import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { advanceDuelClock, createDuelRoom, publicDuelView, submitDuelChoice } from "./shared/battle-engine.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.OGREVERSE_PORT || process.env.PORT || 5178);
const HOST = process.env.OGREVERSE_HOST || "127.0.0.1";
const PRESENCE_TTL_MS = 10000;
const EVENT_TICK_MS = 650;
const DUEL_TURN_TIMEOUT_MS = Math.max(250, Number(process.env.OGREVERSE_DUEL_TIMEOUT_MS || 45000));
const CHALLENGE_TTL_MS = Math.max(5000, Number(process.env.OGREVERSE_CHALLENGE_TTL_MS || 30000));
const CHALLENGE_COOLDOWN_MS = Math.max(0, Number(process.env.OGREVERSE_CHALLENGE_COOLDOWN_MS ?? 2500));
const ROOM_TTL_MS = Math.max(60000, Number(process.env.OGREVERSE_ROOM_TTL_MS || 20 * 60 * 1000));
const MAX_JSON_BYTES = Math.max(4096, Number(process.env.OGREVERSE_MAX_JSON_BYTES || 64 * 1024));
const RATE_LIMIT_WINDOW_MS = Math.max(1000, Number(process.env.OGREVERSE_RATE_LIMIT_WINDOW_MS || 10000));
const RATE_LIMIT_MAX = Math.max(30, Number(process.env.OGREVERSE_RATE_LIMIT_MAX || 240));

const sessions = new Map();
const challenges = new Map();
const rooms = new Map();
const rateBuckets = new Map();

// ===== ACCOUNTS + CLOUD SAVE ============================================================
// Durable accounts so players keep their run (party, position, progress, duel record) across
// devices and redeploys. scrypt password hashing + an HMAC-signed token (survives restarts).
// PLUGGABLE STORE: Postgres when DATABASE_URL is set (durable on a free service — reuses the
// trading bot's DB), else a flat file under OGREVERSE_DATA_DIR (great for local dev).
const DATA_DIR = process.env.OGREVERSE_DATA_DIR || path.join(ROOT, "data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");
const SAVES_DIR = path.join(DATA_DIR, "saves");
const MAX_SAVE_BYTES = Math.max(64 * 1024, Number(process.env.OGREVERSE_MAX_SAVE_BYTES || 512 * 1024));
const DATABASE_URL = process.env.DATABASE_URL || process.env.OGREVERSE_DATABASE_URL || "";
let AUTH_SECRET = process.env.OGREVERSE_AUTH_SECRET || "";

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return { salt, hash: crypto.scryptSync(String(password), salt, 64).toString("hex") };
}
function verifyPassword(password, salt, hash) {
  try { const h = crypto.scryptSync(String(password), salt, 64); const want = Buffer.from(hash, "hex"); return h.length === want.length && crypto.timingSafeEqual(h, want); }
  catch { return false; }
}
function signAccountToken(accountId) {
  const mac = crypto.createHmac("sha256", AUTH_SECRET).update(accountId).digest("hex");
  return `${accountId}.${mac}`;
}
function verifyAccountToken(token) {
  const raw = String(token || ""); const dot = raw.lastIndexOf(".");
  if (dot < 1) return null;
  const id = raw.slice(0, dot), mac = raw.slice(dot + 1);
  const want = crypto.createHmac("sha256", AUTH_SECRET).update(id).digest("hex");
  try { if (mac.length === want.length && crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(want))) return id; } catch {}
  return null;
}
function validUsername(u) { return typeof u === "string" && /^[A-Za-z0-9_]{3,20}$/.test(u); }

// --- flat-file store (local dev / no DB) ---
const fileAccounts = new Map();
const fileStore = {
  async init() {
    await fs.mkdir(SAVES_DIR, { recursive: true });
    if (!AUTH_SECRET) {
      const f = path.join(DATA_DIR, ".auth-secret");
      try { AUTH_SECRET = (await fs.readFile(f, "utf8")).trim(); }
      catch { AUTH_SECRET = crypto.randomBytes(32).toString("hex"); await fs.writeFile(f, AUTH_SECRET).catch(() => {}); }
    }
    const raw = await fs.readFile(ACCOUNTS_FILE, "utf8").catch(() => "");
    if (raw.trim()) { const list = JSON.parse(raw); for (const a of (Array.isArray(list) ? list : [])) if (a && a.username) fileAccounts.set(String(a.username).toLowerCase(), a); }
    console.log(`Ogreverse accounts: ${fileAccounts.size} (file store @ ${DATA_DIR})`);
  },
  async persistFile() { try { await fs.writeFile(ACCOUNTS_FILE, JSON.stringify([...fileAccounts.values()])); } catch (e) { console.error("persistAccounts failed", e); } },
  async findByUsername(lower) { return fileAccounts.get(lower) || null; },
  async findById(id) { return [...fileAccounts.values()].find((a) => a.id === id) || null; },
  async create(a) { fileAccounts.set(a.username.toLowerCase(), a); await this.persistFile(); },
  async touchSaved(id) { const a = await this.findById(id); if (a) { a.savedAt = now(); await this.persistFile(); } },
  async readSave(id) { try { const raw = await fs.readFile(path.join(SAVES_DIR, `${id}.json`), "utf8"); return raw.trim() ? JSON.parse(raw) : null; } catch { return null; } },
  async writeSave(id, save) { await fs.writeFile(path.join(SAVES_DIR, `${id}.json`), JSON.stringify(save)); },
};

// --- Postgres store (durable; reuses the bot's DB via DATABASE_URL) ---
function rowToAcct(r) { return { id: r.id, username: r.username, salt: r.salt, hash: r.hash, createdAt: Number(r.created_at), savedAt: Number(r.saved_at || 0) }; }
function makePgStore() {
  let pool = null;
  return {
    async init() {
      const pg = await import("pg");
      const Pool = (pg.default && pg.default.Pool) || pg.Pool;
      const ssl = /localhost|127\.0\.0\.1/.test(DATABASE_URL) ? false : { rejectUnauthorized: false };
      pool = new Pool({ connectionString: DATABASE_URL, ssl, max: 4 });
      await pool.query(`CREATE TABLE IF NOT EXISTS ogv_accounts (id text PRIMARY KEY, username text UNIQUE NOT NULL, username_lower text UNIQUE NOT NULL, salt text NOT NULL, hash text NOT NULL, created_at bigint, saved_at bigint)`);
      await pool.query(`CREATE TABLE IF NOT EXISTS ogv_saves (account_id text PRIMARY KEY, save jsonb NOT NULL, updated_at bigint)`);
      await pool.query(`CREATE TABLE IF NOT EXISTS ogv_meta (k text PRIMARY KEY, v text)`);
      if (!AUTH_SECRET) {
        const r = await pool.query(`SELECT v FROM ogv_meta WHERE k='auth_secret'`);
        if (r.rows[0]) AUTH_SECRET = r.rows[0].v;
        else { AUTH_SECRET = crypto.randomBytes(32).toString("hex"); await pool.query(`INSERT INTO ogv_meta(k,v) VALUES('auth_secret',$1) ON CONFLICT (k) DO NOTHING`, [AUTH_SECRET]); }
      }
      const c = await pool.query(`SELECT count(*)::int AS n FROM ogv_accounts`);
      console.log(`Ogreverse accounts: ${c.rows[0].n} (Postgres store)`);
    },
    async findByUsername(lower) { const r = await pool.query(`SELECT * FROM ogv_accounts WHERE username_lower=$1`, [lower]); return r.rows[0] ? rowToAcct(r.rows[0]) : null; },
    async findById(id) { const r = await pool.query(`SELECT * FROM ogv_accounts WHERE id=$1`, [id]); return r.rows[0] ? rowToAcct(r.rows[0]) : null; },
    async create(a) { await pool.query(`INSERT INTO ogv_accounts(id,username,username_lower,salt,hash,created_at,saved_at) VALUES($1,$2,$3,$4,$5,$6,$7)`, [a.id, a.username, a.username.toLowerCase(), a.salt, a.hash, a.createdAt, a.savedAt || 0]); },
    async touchSaved(id) { await pool.query(`UPDATE ogv_accounts SET saved_at=$2 WHERE id=$1`, [id, now()]); },
    async readSave(id) { const r = await pool.query(`SELECT save FROM ogv_saves WHERE account_id=$1`, [id]); return r.rows[0] ? r.rows[0].save : null; },
    async writeSave(id, save) { await pool.query(`INSERT INTO ogv_saves(account_id,save,updated_at) VALUES($1,$2::jsonb,$3) ON CONFLICT (account_id) DO UPDATE SET save=$2::jsonb, updated_at=$3`, [id, JSON.stringify(save), now()]); },
  };
}

let store = fileStore;
async function loadAccounts() {
  try {
    if (DATABASE_URL) { store = makePgStore(); await store.init(); }
    else { await fileStore.init(); }
  } catch (e) {
    console.error("Postgres store init failed — falling back to file store", e);
    store = fileStore; try { await fileStore.init(); } catch (err) { console.error(err); }
  }
}

const PUBLIC_FILES = new Set(["/index.html", "/game.js", "/styles.css"]);
const PUBLIC_DIRS = ["/assets/"];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8",
};

const securityHeaders = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "x-frame-options": "DENY",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()",
  "cross-origin-opener-policy": "same-origin",
  "content-security-policy": [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
  ].join("; "),
};

function now() {
  return Date.now();
}

function makeId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...securityHeaders,
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store",
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_JSON_BYTES) {
      const error = new Error("request_too_large");
      error.statusCode = 413;
      error.publicError = "request_too_large";
      throw error;
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("bad_json");
    error.statusCode = 400;
    error.publicError = "bad_json";
    throw error;
  }
}

function clientKey(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket?.remoteAddress || "unknown";
}

function rateLimit(req) {
  const key = clientKey(req);
  const current = now();
  const bucket = rateBuckets.get(key);
  if (!bucket || current - bucket.startedAt > RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(key, { startedAt: current, count: 1 });
    return null;
  }
  bucket.count += 1;
  if (bucket.count <= RATE_LIMIT_MAX) return null;
  return Math.max(1, Math.ceil((RATE_LIMIT_WINDOW_MS - (current - bucket.startedAt)) / 1000));
}

function pruneRateBuckets() {
  const cutoff = now() - RATE_LIMIT_WINDOW_MS * 2;
  for (const [key, bucket] of rateBuckets) {
    if (bucket.startedAt < cutoff) rateBuckets.delete(key);
  }
}

function publicSession(session) {
  return {
    id: session.id,
    name: session.name,
    x: session.x,
    y: session.y,
    facing: session.facing,
    region: session.region,
    sprite: session.sprite,
    leadSpecies: session.leadSpecies,
    leadName: session.leadName,
    leadLevel: session.leadLevel,
    duelWins: session.duelWins,
    duelStreak: session.duelStreak,
    partyCount: Array.isArray(session.party) ? session.party.length : 0,
    badges: session.badges,
    updatedAt: session.updatedAt,
  };
}

function getSession(id, token) {
  const session = sessions.get(id);
  if (!session || session.token !== token) return null;
  return session;
}

function pruneSessions() {
  const cutoff = now() - PRESENCE_TTL_MS;
  for (const [id, session] of sessions) {
    if (session.updatedAt < cutoff && !session.stream) sessions.delete(id);
  }
}

function publicRoomSummary(room) {
  return {
    id: room.id,
    players: room.sides.map((side) => side.playerId),
    createdAt: room.createdAt,
  };
}

function expireChallenge(challenge) {
  if (!challenges.has(challenge.id)) return;
  challenges.delete(challenge.id);
  queueEvent(challenge.from, { type: "challengeExpired", challenge });
  queueEvent(challenge.to, { type: "challengeExpired", challenge });
}

function pruneChallenges() {
  const cutoff = now() - CHALLENGE_TTL_MS;
  for (const challenge of challenges.values()) {
    if ((challenge.createdAt || 0) < cutoff) expireChallenge(challenge);
  }
}

function clearRoomLocks(room) {
  if (!room || room.status !== "complete") return;
  room.sides.forEach((side) => {
    const session = sessions.get(side.playerId);
    if (session?.activeRoomId === room.id) session.activeRoomId = null;
  });
}

function pruneRooms() {
  const cutoff = now() - ROOM_TTL_MS;
  const completedCutoff = now() - 60000;
  for (const [id, room] of rooms) {
    clearRoomLocks(room);
    if ((room.status === "complete" && room.updatedAt < completedCutoff) || room.updatedAt < cutoff) {
      rooms.delete(id);
      room.sides.forEach((side) => {
        const session = sessions.get(side.playerId);
        if (session?.activeRoomId === id) session.activeRoomId = null;
      });
    }
  }
}

function pruneServerState() {
  pruneSessions();
  pruneChallenges();
  pruneRooms();
  pruneRateBuckets();
}

function serverStatus() {
  pruneServerState();
  return {
    ok: true,
    name: "Ogreverse: Brainrot Prism",
    uptimeSeconds: Math.round(process.uptime()),
    sessions: sessions.size,
    streams: [...sessions.values()].filter((session) => session.stream).length,
    pendingChallenges: challenges.size,
    rooms: rooms.size,
    activeRooms: [...rooms.values()].filter((room) => room.status !== "complete").length,
    config: {
      presenceTtlMs: PRESENCE_TTL_MS,
      challengeTtlMs: CHALLENGE_TTL_MS,
      challengeCooldownMs: CHALLENGE_COOLDOWN_MS,
      duelTurnTimeoutMs: DUEL_TURN_TIMEOUT_MS,
    },
  };
}

function activeRoomFor(session) {
  if (!session?.activeRoomId) return null;
  const room = rooms.get(session.activeRoomId);
  if (!room || room.status === "complete") {
    session.activeRoomId = null;
    return null;
  }
  return room;
}

function opponentForRoom(room, playerId) {
  return room?.sides?.find((side) => side.playerId !== playerId) || null;
}

function playerIsInRoom(room, playerId) {
  return Boolean(room?.sides?.some((side) => side.playerId === playerId));
}

function isPublicStaticPath(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  return PUBLIC_FILES.has(normalized) || PUBLIC_DIRS.some((dir) => normalized.startsWith(dir));
}

function nearbyPeers(session) {
  pruneServerState();
  return [...sessions.values()]
    .filter((peer) => peer.id !== session.id)
    .filter((peer) => Math.abs(peer.x - session.x) <= 18 && Math.abs(peer.y - session.y) <= 14)
    .map(publicSession);
}

function queueEvent(playerId, event) {
  const session = sessions.get(playerId);
  if (!session) return;
  if (session.stream) {
    writeServerEvent(session.stream, event);
  } else {
    session.events.push(event);
  }
}

function writeServerEvent(stream, event) {
  stream.write(`event: ${event.type}\n`);
  stream.write(`data: ${JSON.stringify(event)}\n\n`);
}

function publishRoomState(room) {
  room.sides.forEach((side) => {
    queueEvent(side.playerId, { type: "battleState", room: { id: room.id }, state: publicDuelView(room, side.playerId) });
  });
}

function sanitizeParty(party, session) {
  const source = Array.isArray(party) && party.length
    ? party
    : [{ speciesId: session.leadSpecies, name: session.leadName, level: session.leadLevel }];
  return source
    .filter(Boolean)
    .slice(0, 6)
    .map((entry, index) => ({
      speciesId: String(entry.speciesId || entry.id || (index === 0 ? session.leadSpecies : "OGR001") || "OGR001").slice(0, 12),
      name: String(entry.name || entry.nickname || (index === 0 ? session.leadName : "Party Pal") || "Party Pal").slice(0, 24),
      level: Math.max(1, Math.min(100, Number(entry.level || (index === 0 ? session.leadLevel : 5) || 5))),
      hp: Number.isFinite(Number(entry.hp)) ? Math.max(0, Math.round(Number(entry.hp))) : undefined,
    }));
}

function updatePresence(session, body = {}) {
  session.name = String(body.name || session.name || "Guest").slice(0, 18);
  session.x = Number.isFinite(Number(body.x)) ? Number(body.x) : session.x;
  session.y = Number.isFinite(Number(body.y)) ? Number(body.y) : session.y;
  session.facing = ["up", "down", "left", "right"].includes(body.facing) ? body.facing : session.facing;
  session.region = String(body.region || session.region || "Ogreverse").slice(0, 32);
  session.sprite = String(body.sprite || session.sprite || "trainer").slice(0, 16);
  session.leadSpecies = String(body.leadSpecies || session.leadSpecies || "OGR001").slice(0, 12);
  session.leadName = String(body.leadName || session.leadName || "First Bond").slice(0, 24);
  session.leadLevel = Math.max(1, Math.min(100, Number(body.leadLevel || session.leadLevel || 5)));
  session.duelWins = Math.max(0, Math.min(9999, Number(body.duelWins || session.duelWins || 0)));
  session.duelStreak = Math.max(0, Math.min(999, Number(body.duelStreak || session.duelStreak || 0)));
  session.party = sanitizeParty(body.party || session.party, session);
  session.badges = Math.max(0, Math.min(8, Number(body.badges || session.badges || 0)));
  session.updatedAt = now();
}

async function handleApi(req, res, url) {
  pruneServerState();

  if (req.method === "GET" && url.pathname === "/api/mmo/status") {
    return json(res, 200, serverStatus());
  }

  const retryAfter = rateLimit(req);
  if (retryAfter) return json(res, 429, { error: "rate_limited", retryAfter });

  if (req.method === "POST" && url.pathname === "/api/mmo/join") {
    const body = await readJson(req);
    const session = {
      id: makeId("ply"),
      token: makeId("tok"),
      name: "Guest",
      x: 14,
      y: 63,
      facing: "down",
      region: "Memelet Town",
      sprite: "trainer",
      leadSpecies: "OGR001",
      leadName: "First Bond",
      leadLevel: 5,
      duelWins: 0,
      duelStreak: 0,
      party: [],
      badges: 0,
      activeRoomId: null,
      lastChallengeAt: 0,
      events: [],
      stream: null,
      updatedAt: now(),
    };
    updatePresence(session, body);
    sessions.set(session.id, session);
    return json(res, 200, { id: session.id, token: session.token, player: publicSession(session) });
  }

  if (req.method === "POST" && url.pathname === "/api/mmo/resume") {
    const body = await readJson(req);
    const session = getSession(body.id, body.token);
    if (!session) return json(res, 401, { error: "bad_session" });
    updatePresence(session, body);
    const room = activeRoomFor(session);
    const opponent = opponentForRoom(room, session.id);
    return json(res, 200, {
      id: session.id,
      token: session.token,
      player: publicSession(session),
      room: room ? publicRoomSummary(room) : null,
      opponentId: opponent?.playerId || null,
      opponentName: opponent?.name || null,
      state: room ? publicDuelView(room, session.id) : null,
    });
  }

  if (req.method === "POST" && url.pathname === "/api/mmo/presence") {
    const body = await readJson(req);
    const session = getSession(body.id, body.token);
    if (!session) return json(res, 401, { error: "bad_session" });
    updatePresence(session, body);
    return json(res, 200, { ok: true, peers: nearbyPeers(session) });
  }

  if (req.method === "GET" && url.pathname === "/api/mmo/events") {
    const id = url.searchParams.get("id");
    const token = url.searchParams.get("token");
    const session = getSession(id, token);
    if (!session) return json(res, 401, { error: "bad_session" });
    res.writeHead(200, {
      ...securityHeaders,
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    });
    session.stream = res;
    while (session.events.length) {
      writeServerEvent(res, session.events.shift());
    }
    const sendPresence = () => {
      if (!sessions.has(session.id)) return;
      res.write(`event: presence\n`);
      res.write(`data: ${JSON.stringify({ type: "presence", peers: nearbyPeers(session), serverTime: now() })}\n\n`);
    };
    sendPresence();
    const interval = setInterval(sendPresence, EVENT_TICK_MS);
    req.on("close", () => {
      clearInterval(interval);
      if (session.stream === res) session.stream = null;
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/mmo/challenge") {
    const body = await readJson(req);
    const from = getSession(body.id, body.token);
    const to = sessions.get(String(body.to || ""));
    if (!from) return json(res, 401, { error: "bad_session" });
    if (!to) return json(res, 404, { error: "target_missing" });
    if (from.id === to.id) return json(res, 400, { error: "self_challenge" });
    if (now() - to.updatedAt > PRESENCE_TTL_MS) return json(res, 404, { error: "target_offline" });
    if (activeRoomFor(from) || activeRoomFor(to)) return json(res, 409, { error: "player_in_duel" });
    if (now() - from.lastChallengeAt < CHALLENGE_COOLDOWN_MS) return json(res, 429, { error: "challenge_cooldown" });
    for (const [id, pending] of challenges) {
      if ((pending.from === from.id && pending.to === to.id) || (pending.from === to.id && pending.to === from.id)) {
        challenges.delete(id);
      }
    }
    const createdAt = now();
    const challenge = {
      id: makeId("duel"),
      from: from.id,
      to: to.id,
      fromName: from.name,
      toName: to.name,
      fromLeadSpecies: from.leadSpecies,
      fromLeadName: from.leadName,
      fromLeadLevel: from.leadLevel,
      toLeadSpecies: to.leadSpecies,
      toLeadName: to.leadName,
      toLeadLevel: to.leadLevel,
      createdAt,
      expiresAt: createdAt + CHALLENGE_TTL_MS,
    };
    from.lastChallengeAt = createdAt;
    challenges.set(challenge.id, challenge);
    queueEvent(to.id, { type: "challenge", challenge });
    return json(res, 200, { ok: true, challenge });
  }

  if (req.method === "POST" && url.pathname === "/api/mmo/respond") {
    const body = await readJson(req);
    const session = getSession(body.id, body.token);
    const challenge = challenges.get(String(body.challengeId || ""));
    if (!session) return json(res, 401, { error: "bad_session" });
    if (!challenge || challenge.to !== session.id) return json(res, 404, { error: "challenge_missing" });
    if (now() > (challenge.expiresAt || challenge.createdAt + CHALLENGE_TTL_MS)) {
      challenges.delete(challenge.id);
      queueEvent(challenge.from, { type: "challengeExpired", challenge });
      return json(res, 410, { error: "challenge_expired" });
    }
    challenges.delete(challenge.id);
    if (!body.accept) {
      queueEvent(challenge.from, { type: "challengeDeclined", challenge });
      return json(res, 200, { ok: true, accepted: false });
    }
    const from = sessions.get(challenge.from);
    const to = sessions.get(challenge.to);
    if (!from || !to) return json(res, 404, { error: "player_missing" });
    if (activeRoomFor(from) || activeRoomFor(to)) return json(res, 409, { error: "player_in_duel" });
    const room = createDuelRoom({
      id: makeId("room"),
      players: [from, to],
      createdAt: now(),
      seed: challenge.id,
      turnTimeoutMs: DUEL_TURN_TIMEOUT_MS,
    });
    rooms.set(room.id, room);
    from.activeRoomId = room.id;
    to.activeRoomId = room.id;
    const publicRoom = publicRoomSummary(room);
    queueEvent(challenge.from, { type: "battle", room: publicRoom, challenge, opponentId: challenge.to, state: publicDuelView(room, challenge.from) });
    queueEvent(challenge.to, { type: "battle", room: publicRoom, challenge, opponentId: challenge.from, state: publicDuelView(room, challenge.to) });
    return json(res, 200, { ok: true, accepted: true, room: publicRoom, state: publicDuelView(room, session.id) });
  }

  if (req.method === "POST" && url.pathname === "/api/mmo/battle/state") {
    const body = await readJson(req);
    const session = getSession(body.id, body.token);
    const room = rooms.get(String(body.roomId || ""));
    if (!session) return json(res, 401, { error: "bad_session" });
    if (!room) return json(res, 404, { error: "room_missing" });
    if (!playerIsInRoom(room, session.id)) return json(res, 403, { error: "not_in_room" });
    const beforeUpdatedAt = room.updatedAt;
    advanceDuelClock(room);
    if (room.status === "complete") clearRoomLocks(room);
    if (room.updatedAt !== beforeUpdatedAt && room.status === "complete") publishRoomState(room);
    return json(res, 200, { ok: true, state: publicDuelView(room, session.id) });
  }

  if (req.method === "POST" && url.pathname === "/api/mmo/battle/choice") {
    const body = await readJson(req);
    const session = getSession(body.id, body.token);
    const room = rooms.get(String(body.roomId || ""));
    if (!session) return json(res, 401, { error: "bad_session" });
    if (!room) return json(res, 404, { error: "room_missing" });
    if (!playerIsInRoom(room, session.id)) return json(res, 403, { error: "not_in_room" });
    try {
      submitDuelChoice(room, session.id, body.action || body.choice || String(body.moveId || ""));
    } catch (error) {
      return json(res, 400, { error: String(error.message || error) });
    }
    if (room.status === "complete") clearRoomLocks(room);
    publishRoomState(room);
    return json(res, 200, { ok: true, state: publicDuelView(room, session.id) });
  }

  return json(res, 404, { error: "not_found" });
}

async function handleAccountApi(req, res, url) {
  if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });
  const retryAfter = rateLimit(req);
  if (retryAfter) return json(res, 429, { error: "rate_limited", retryAfter });
  const body = await readJson(req);

  if (url.pathname === "/api/account/register") {
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    if (!validUsername(username)) return json(res, 400, { error: "bad_username", message: "3-20 letters, numbers or underscore." });
    if (password.length < 6) return json(res, 400, { error: "bad_password", message: "At least 6 characters." });
    if (await store.findByUsername(username.toLowerCase())) return json(res, 409, { error: "username_taken" });
    const id = makeId("acct");
    const { salt, hash } = hashPassword(password);
    try { await store.create({ id, username, salt, hash, createdAt: now(), savedAt: 0 }); }
    catch { return json(res, 409, { error: "username_taken" }); }   // unique-constraint race
    return json(res, 200, { ok: true, accountId: id, accountToken: signAccountToken(id), username, save: null });
  }

  if (url.pathname === "/api/account/login") {
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const account = await store.findByUsername(username.toLowerCase());
    if (!account || !verifyPassword(password, account.salt, account.hash)) return json(res, 401, { error: "bad_credentials" });
    const save = await store.readSave(account.id);
    return json(res, 200, { ok: true, accountId: account.id, accountToken: signAccountToken(account.id), username: account.username, save });
  }

  if (url.pathname === "/api/account/save") {
    const accountId = verifyAccountToken(body.accountToken);
    if (!accountId || accountId !== String(body.accountId || "")) return json(res, 401, { error: "bad_token" });
    const save = body.save;
    if (!save || typeof save !== "object") return json(res, 400, { error: "bad_save" });
    if (Buffer.byteLength(JSON.stringify(save)) > MAX_SAVE_BYTES) return json(res, 413, { error: "save_too_large" });
    await store.writeSave(accountId, save);
    await store.touchSaved(accountId).catch(() => {});
    return json(res, 200, { ok: true, savedAt: now() });
  }

  if (url.pathname === "/api/account/load") {
    const accountId = verifyAccountToken(body.accountToken);
    if (!accountId || accountId !== String(body.accountId || "")) return json(res, 401, { error: "bad_token" });
    return json(res, 200, { ok: true, save: await store.readSave(accountId) });
  }

  return json(res, 404, { error: "not_found" });
}

async function serveStatic(req, res, url) {
  if (!["GET", "HEAD"].includes(req.method || "GET")) {
    return json(res, 405, { error: "method_not_allowed" });
  }
  let filePath = decodeURIComponent(url.pathname);
  if (filePath === "/" || filePath === "") filePath = "/index.html";
  if (!isPublicStaticPath(filePath)) return json(res, 404, { error: "missing_file" });
  const resolved = path.resolve(ROOT, `.${filePath}`);
  if (resolved !== ROOT && !resolved.startsWith(`${ROOT}${path.sep}`)) return json(res, 403, { error: "forbidden" });
  try {
    const data = await fs.readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    res.writeHead(200, {
      ...securityHeaders,
      "content-type": mimeTypes[ext] || "application/octet-stream",
      "content-length": data.length,
      "cache-control": ext === ".html" ? "no-store" : "public, max-age=3600",
    });
    if (req.method === "HEAD") return res.end();
    res.end(data);
  } catch {
    json(res, 404, { error: "missing_file" });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || `${HOST}:${PORT}`}`);
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        ...securityHeaders,
        "cache-control": "no-store",
        allow: "GET, HEAD, POST, OPTIONS",
      });
      return res.end();
    }
    if (process.env.OGREVERSE_ENABLE_TEST_SHUTDOWN === "1" && url.pathname === "/__audit_shutdown") {
      json(res, 200, { ok: true, shuttingDown: true });
      return setTimeout(() => shutdown("AUDIT"), 25).unref();
    }
    if (url.pathname === "/healthz") return json(res, 200, serverStatus());
    if (url.pathname.startsWith("/api/account/")) return await handleAccountApi(req, res, url);
    if (url.pathname.startsWith("/api/mmo/")) return await handleApi(req, res, url);
    return await serveStatic(req, res, url);
  } catch (error) {
    console.error(error);
    if (error.statusCode) return json(res, error.statusCode, { error: error.publicError || "bad_request" });
    return json(res, 500, { error: "server_error" });
  }
});

await loadAccounts();
server.listen(PORT, HOST, () => {
  console.log(`Ogreverse MMO server (accounts + cloud save): http://${HOST}:${PORT}/`);
});

function shutdown(signal) {
  console.log(`Ogreverse server received ${signal}; closing active streams.`);
  for (const session of sessions.values()) {
    if (session.stream) session.stream.end();
    session.stream = null;
  }
  server.close(() => {
    process.exitCode = 0;
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
