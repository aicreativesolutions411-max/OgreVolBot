// Unofficial X (Twitter) access — no paid API. Talks to X's CURRENT web GraphQL endpoints directly,
// signing each request with the `x-client-transaction-id` header X now requires (its anti-bot measure).
// This replaces agent-twitter-client, which calls RETIRED api.twitter.com endpoints and can't produce
// the transaction id, so it 401s against 2026 X. Query IDs are scraped live from X's JS bundle so they
// stay current when X rotates them.
//
// SECRETS: the account's auth_token + ct0 come from env (X_AUTH_TOKEN / X_CT0, or a pasted X_COOKIES
// string). This code only READS them — never logs them. Everything degrades to null/[] when unset.
//
// TERMS: automating a logged-in account is against X's ToS and can get it suspended. The owner accepted
// that risk; callers throttle + reply with value (a scan card), not bare-link spam.
//
// The `x-client-transaction-id` dep (+ its heavy linkedom DOM lib) is LAZY-loaded inside getSession, NOT
// imported at module top — so this optional, fragile feature can never crash the main app's boot. If the
// dep fails to load, every X call just no-ops.
let _xti = null;
let _xtiLoadPromise = null;
function boundedMs(value, fallback, min, max) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}
async function withDeadline(promise, timeoutMs, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
// The signing lib uses ArrayBuffer.prototype.transfer() (Node 22+). Render may run older Node, where it's
// missing → "output.buffer.transfer is not a function". Polyfill it (a plain copy is functionally fine for
// the lib's hashing) right before the lazy import, so we don't have to bump the whole app's Node version.
function polyfillArrayBufferTransfer() {
  for (const name of ["transfer", "transferToFixedLength"]) {
    if (typeof ArrayBuffer.prototype[name] !== "function") {
      Object.defineProperty(ArrayBuffer.prototype, name, {
        value: function (newLength) {
          const len = newLength === undefined ? this.byteLength : Number(newLength);
          const out = new ArrayBuffer(len);
          new Uint8Array(out).set(new Uint8Array(this).subarray(0, Math.min(this.byteLength, len)));
          return out;
        },
        writable: true, configurable: true
      });
    }
  }
}
async function loadXti() {
  if (_xti) return _xti;
  if (_xtiLoadPromise) return await _xtiLoadPromise;
  polyfillArrayBufferTransfer();
  const pending = withDeadline(
    import("x-client-transaction-id"),
    boundedMs(process.env.X_SIGNER_IMPORT_TIMEOUT_MS, 5_000, 1_000, 15_000),
    "X transaction signer import"
  ).then((loaded) => {
    _xti = loaded;
    return loaded;
  });
  _xtiLoadPromise = pending;
  try {
    return await pending;
  } finally {
    if (_xtiLoadPromise === pending) _xtiLoadPromise = null;
  }
}

// The public web-app bearer (not a secret — it's shipped in x.com's JS). Overridable via env.
const BEARER = (process.env.X_BEARER_TOKEN || "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA").trim();
const UA = (process.env.X_USER_AGENT || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36").trim();
// Fallbacks if the live scrape fails; the scrape keeps the real ones current automatically.
const FALLBACK_QID = { SearchTimeline: "Bcw3RzK-PatNAmbnw54hFw", CreateTweet: "R5EPiGHgSqbTYFyozd-gFw", UserByScreenName: "2qvSHpkWTMS9i0zJAwDNiA", Viewer: "u4ni7JqpqdAQxWQfkLsdUQ", TweetResultByRestId: "zAz9764BcLZOJ0JU2wrd1A" };

// GraphQL feature flags X validates per operation (missing ones → 400). Broad current set.
const READ_FEATURES = { rweb_video_screen_enabled: false, profile_label_improvements_pcf_label_in_post_enabled: true, rweb_tipjar_consumption_enabled: true, responsive_web_graphql_exclude_directive_enabled: true, verified_phone_label_enabled: false, creator_subscriptions_tweet_preview_api_enabled: true, responsive_web_graphql_timeline_navigation_enabled: true, responsive_web_graphql_skip_user_profile_image_extensions_enabled: false, premium_content_api_read_enabled: false, communities_web_enable_tweet_community_results_fetch: true, c9s_tweet_anatomy_moderator_badge_enabled: true, responsive_web_grok_analyze_button_fetch_trends_enabled: false, responsive_web_grok_analyze_post_followups_enabled: true, responsive_web_jetfuel_frame: false, responsive_web_grok_share_attachment_enabled: true, articles_preview_enabled: true, responsive_web_edit_tweet_api_enabled: true, graphql_is_translatable_rweb_tweet_is_translatable_enabled: true, view_counts_everywhere_api_enabled: true, longform_notetweets_consumption_enabled: true, responsive_web_twitter_article_tweet_consumption_enabled: true, tweet_awards_web_tipping_enabled: false, responsive_web_grok_show_grok_translated_post: false, responsive_web_grok_analysis_button_from_backend: true, creator_subscriptions_quote_tweet_preview_enabled: false, freedom_of_speech_not_reach_fetch_enabled: true, standardized_nudges_misinfo: true, tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true, longform_notetweets_rich_text_read_enabled: true, longform_notetweets_inline_media_enabled: true, responsive_web_grok_image_annotation_enabled: true, responsive_web_grok_imagine_annotation_enabled: true, responsive_web_grok_community_note_auto_translation_is_enabled: false, responsive_web_enhance_cards_enabled: false, payments_enabled: false };
const WRITE_FEATURES = { premium_content_api_read_enabled: false, communities_web_enable_tweet_community_results_fetch: true, c9s_tweet_anatomy_moderator_badge_enabled: true, responsive_web_grok_analyze_button_fetch_trends_enabled: false, responsive_web_grok_analyze_post_followups_enabled: true, responsive_web_jetfuel_frame: false, responsive_web_grok_share_attachment_enabled: true, responsive_web_edit_tweet_api_enabled: true, graphql_is_translatable_rweb_tweet_is_translatable_enabled: true, view_counts_everywhere_api_enabled: true, longform_notetweets_consumption_enabled: true, responsive_web_twitter_article_tweet_consumption_enabled: true, tweet_awards_web_tipping_enabled: false, responsive_web_grok_show_grok_translated_post: false, responsive_web_grok_analysis_button_from_backend: true, creator_subscriptions_quote_tweet_preview_enabled: false, longform_notetweets_rich_text_read_enabled: true, longform_notetweets_inline_media_enabled: true, profile_label_improvements_pcf_label_in_post_enabled: true, rweb_tipjar_consumption_enabled: true, verified_phone_label_enabled: false, articles_preview_enabled: true, responsive_web_graphql_exclude_directive_enabled: true, responsive_web_graphql_skip_user_profile_image_extensions_enabled: false, freedom_of_speech_not_reach_fetch_enabled: true, standardized_nudges_misinfo: true, tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true, responsive_web_graphql_timeline_navigation_enabled: true, responsive_web_grok_image_annotation_enabled: true, responsive_web_enhance_cards_enabled: false, payments_enabled: false, rweb_video_screen_enabled: false, responsive_web_grok_imagine_annotation_enabled: true, responsive_web_grok_community_note_auto_translation_is_enabled: false };

let lastAuthError = "";
let lastAuthReport = { cookies: "", api: "" };
export function xLastAuthError() { return lastAuthError; }
export function xAuthReport() { return lastAuthReport; }

// ---- Cookies -------------------------------------------------------------------------------------
function clean(v) { return String(v || "").trim().replace(/^["']|["']$/g, "").trim(); }
function readCookieParts() {
  let auth = clean(process.env.X_AUTH_TOKEN), ct0 = clean(process.env.X_CT0), guest = clean(process.env.X_GUEST_ID);
  const blob = clean(process.env.X_COOKIES);
  if (blob) {
    if (!auth) { const m = blob.match(/auth_token=([^;\s]+)/i); if (m) auth = m[1]; }
    if (!ct0) { const m = blob.match(/ct0=([^;\s]+)/i); if (m) ct0 = m[1]; }
    if (!guest) { const m = blob.match(/guest_id=([^;\s]+)/i); if (m) guest = m[1]; }
  }
  return { auth, ct0, guest };
}
function hasXCookies() { const { auth, ct0 } = readCookieParts(); return Boolean(auth && ct0); }
// password auth is dead against current X (datacenter logins get an email-code challenge the bot can't
// read) — kept only so /xtest can explain it; cookies are the only working path.
function hasXPassword() { return Boolean(clean(process.env.X_USERNAME) && String(process.env.X_PASSWORD || "").length); }
export function xConfigured() { return hasXCookies(); }
export function xAuthMode() { return hasXCookies() ? "cookies" : hasXPassword() ? "password (unsupported — use cookies)" : "none"; }
export function xHandle() { return String(process.env.X_HANDLE || process.env.TELEGRAM_BOT_USERNAME || "SlimeWiredBot").replace(/^@+/, "").trim(); }

// ---- Session caches -----------------------------------------------------------------------------
// REST calls (including DMs) only need the transaction signer. Keep its refresh completely separate
// from the slower GraphQL query-id scrape so a bundle-host hiccup can never stall the DM inbox.
const X_SESSION_TTL_MS = 25 * 60_000;
const X_COOKIE_OWN_USER_TTL_MS = 60 * 60_000;
let signerSession = null;       // { tx, at }
let signerRefreshPromise = null;
let queryIdSession = null;      // { qmap, at }
let queryIdRefreshPromise = null;
let scraperGeneration = 0;
let cookieOwnUserCache = { id: "", at: 0, auth: "" };

async function scrapeQueryIds() {
  const map = {};
  try {
    const homeTimeoutMs = boundedMs(process.env.X_QUERY_HOME_TIMEOUT_MS, 4_000, 1_000, 10_000);
    const bundleTimeoutMs = boundedMs(process.env.X_QUERY_BUNDLE_TIMEOUT_MS, 2_500, 750, 8_000);
    const home = await (await fetch("https://x.com/", {
      headers: { "user-agent": UA, accept: "text/html" },
      signal: AbortSignal.timeout(homeTimeoutMs)
    })).text();
    const urls = [...new Set([...home.matchAll(/https:\/\/abs\.twimg\.com\/responsive-web\/client-web\/[a-zA-Z0-9._/-]+\.js/g)].map((m) => m[0]))];
    const scan = (urls.filter((u) => /\/(main|api|endpoints|bundle)\./.test(u)) || []);
    const selected = (scan.length ? scan : urls).slice(0, 10);
    const bundles = await Promise.allSettled(selected.map(async (u) => {
      try {
        return await (await fetch(u, {
          headers: { "user-agent": UA },
          signal: AbortSignal.timeout(bundleTimeoutMs)
        })).text();
      } catch { return ""; }
    }));
    for (const result of bundles) {
      if (result.status !== "fulfilled" || !result.value) continue;
      for (const m of result.value.matchAll(/queryId:"([^"]+)",operationName:"([^"]+)"/g)) map[m[2]] = m[1];
      for (const m of result.value.matchAll(/operationName:"([^"]+)"[^}]{0,80}?queryId:"([^"]+)"/g)) map[m[1]] = m[2];
    }
  } catch { /* fall back to hardcoded ids */ }
  return map;
}

async function buildSignerSession() {
  const { ClientTransaction, fetchXDocument } = await loadXti();
  const documentTimeoutMs = boundedMs(process.env.X_SIGNER_DOCUMENT_TIMEOUT_MS, 6_000, 1_500, 15_000);
  const createTimeoutMs = boundedMs(process.env.X_SIGNER_CREATE_TIMEOUT_MS, 3_000, 750, 10_000);
  const doc = await withDeadline(Promise.resolve().then(() => fetchXDocument()), documentTimeoutMs, "X signer document");
  const tx = await withDeadline(Promise.resolve().then(() => ClientTransaction.create(doc)), createTimeoutMs, "X signer create");
  return { tx, at: Date.now() };
}

async function getSignerSession() {
  if (signerSession && Date.now() - signerSession.at < X_SESSION_TTL_MS) return signerSession;
  const stale = signerSession;
  if (!signerRefreshPromise) {
    const generation = scraperGeneration;
    const pending = buildSignerSession().then((fresh) => {
      if (generation === scraperGeneration) signerSession = fresh;
      return fresh;
    });
    signerRefreshPromise = pending;
    pending.finally(() => {
      if (signerRefreshPromise === pending) signerRefreshPromise = null;
    }).catch(() => {});
  }
  try {
    return await signerRefreshPromise;
  } catch (error) {
    // A signer that was working moments ago is a safer temporary fallback than freezing every REST
    // call because X's bootstrap document had a transient outage.
    if (stale?.tx) return stale;
    throw error;
  }
}

async function getQueryIdMap() {
  if (queryIdSession && Date.now() - queryIdSession.at < X_SESSION_TTL_MS) return queryIdSession.qmap;
  const stale = queryIdSession;
  if (!queryIdRefreshPromise) {
    const generation = scraperGeneration;
    const scrapeTimeoutMs = boundedMs(process.env.X_QUERY_SCRAPE_TIMEOUT_MS, 8_000, 2_000, 20_000);
    const pending = withDeadline(scrapeQueryIds(), scrapeTimeoutMs, "X query-id scrape").then((qmap) => {
      const fresh = { qmap: qmap || {}, at: Date.now() };
      if (generation === scraperGeneration) queryIdSession = fresh;
      return fresh.qmap;
    });
    queryIdRefreshPromise = pending;
    pending.finally(() => {
      if (queryIdRefreshPromise === pending) queryIdRefreshPromise = null;
    }).catch(() => {});
  }
  try {
    return await queryIdRefreshPromise;
  } catch (error) {
    if (stale?.qmap) return stale.qmap;
    // qid() still has tested fallbacks for every operation used by this client.
    return {};
  }
}

async function getSession() {
  const [{ tx, at }, qmap] = await Promise.all([getSignerSession(), getQueryIdMap()]);
  return { tx, qmap, at };
}
export function resetXScraper() {
  scraperGeneration++;
  signerSession = null;
  queryIdSession = null;
  signerRefreshPromise = null;
  queryIdRefreshPromise = null;
  cookieOwnUserCache = { id: "", at: 0, auth: "" };
}
function qid(qmap, op) { return qmap[op] || FALLBACK_QID[op] || ""; }
function baseHeaders(ct0, tid) {
  return { authorization: `Bearer ${BEARER}`, "x-csrf-token": ct0, "x-client-transaction-id": tid, cookie: `auth_token=${readCookieParts().auth}; ct0=${ct0}`, "content-type": "application/json", "x-twitter-active-user": "yes", "x-twitter-auth-type": "OAuth2Session", "x-twitter-client-language": "en", "user-agent": UA, accept: "*/*", origin: "https://x.com", referer: "https://x.com/" };
}
// A signed GraphQL call. Returns parsed JSON, or throws { status } on a non-200.
async function gql(method, op, { variables, features }) {
  if (!hasXCookies()) throw new Error("no cookies");
  const { auth, ct0 } = readCookieParts();
  const { tx, qmap } = await getSession();
  const id = qid(qmap, op);
  if (!id) throw new Error(`no queryId for ${op}`);
  const path = `/i/api/graphql/${id}/${op}`;
  const tid = await tx.generateTransactionId(method, path);
  let url = `https://x.com${path}`, body;
  if (method === "GET") url += `?variables=${encodeURIComponent(JSON.stringify(variables || {}))}&features=${encodeURIComponent(JSON.stringify(features || {}))}`;
  else body = JSON.stringify({ variables: variables || {}, features: features || {}, queryId: id });
  const res = await fetch(url, { method, headers: { ...baseHeaders(ct0, tid), cookie: `auth_token=${auth}; ct0=${ct0}` }, body, signal: AbortSignal.timeout(12_000) });
  const text = await res.text();
  if (res.status === 401 || res.status === 403) { resetXScraper(); const e = new Error(`auth ${res.status}`); e.status = res.status; throw e; }
  if (!res.ok) { const e = new Error(`${op} ${res.status}: ${text.slice(0, 120)}`); e.status = res.status; throw e; }
  try { return JSON.parse(text); } catch { throw new Error(`${op}: bad JSON`); }
}

// ---- Public interface (unchanged shape, so index.js doesn't change) ------------------------------
let cachedHandle = null;
export async function xWhoAmI() {
  try {
    const j = await gql("GET", "Viewer", { variables: { withCommunitiesMemberships: true }, features: READ_FEATURES });
    const u = j?.data?.viewer?.user_results?.result;
    const screen = u?.legacy?.screen_name || u?.core?.screen_name;
    const name = u?.legacy?.name || u?.core?.name;
    const id = u?.rest_id || u?.legacy?.id_str || "";
    if (id) rememberCookieOwnUserId(id);
    lastAuthError = ""; lastAuthReport = { cookies: "ok", api: "ok" };
    return screen ? { username: screen, screenName: screen, name, id: id ? String(id) : "" } : null;
  } catch (e) {
    lastAuthReport = { cookies: hasXCookies() ? (e.status === 401 || e.status === 403 ? "rejected — auth_token/ct0 stale (re-grab from x.com)" : "set") : "not set", api: String(e?.message || e).slice(0, 120) };
    lastAuthError = String(e?.message || e).slice(0, 160);
    return null;
  }
}
export async function xResolvedHandle() {
  if (cachedHandle) return cachedHandle;
  const me = await xWhoAmI().catch(() => null);
  if (me?.username) { cachedHandle = String(me.username).replace(/^@+/, ""); return cachedHandle; }
  return xHandle();
}

function parseTweetResult(result) {
  if (!result) return null;
  if (result.__typename === "TweetWithVisibilityResults") result = result.tweet;
  const legacy = result?.legacy; if (!legacy) return null;
  const user = result?.core?.user_results?.result;
  const uname = user?.legacy?.screen_name || user?.core?.screen_name || "";
  const id = result?.rest_id || legacy?.id_str || "";
  return {
    id: String(id),
    text: String(legacy.full_text || legacy.text || ""),
    username: String(uname),
    userId: String(legacy.user_id_str || user?.rest_id || ""),
    // Keep the direct parent distinct from the conversation root. A standalone tag has its own
    // conversation_id; treating that as a parent made the poller retry a no-target tag three times and
    // pause newer mentions behind it even though there was no parent coin to resolve.
    inReplyToId: String(legacy.in_reply_to_status_id_str || ""),
    inReplyToScreen: String(legacy.in_reply_to_screen_name || "").toLowerCase(),   // who this tweet REPLIES to
    conversationId: String(legacy.conversation_id_str || ""),                     // thread ROOT (CA often lives here)
    mentions: (legacy.entities?.user_mentions || []).map((u) => String(u.screen_name || "").toLowerCase()).filter(Boolean), // X-parsed @-mentions (works even when the handle isn't in the visible reply text)
    urls: (legacy.entities?.urls || []).map((u) => u.expanded_url || u.url).filter(Boolean), // expanded links (dexscreener/pump CA)
    permanentUrl: uname && id ? `https://x.com/${uname}/status/${id}` : "",
    createdAtMs: legacy.created_at ? new Date(legacy.created_at).getTime() : 0
  };
}
// A raw (non-GraphQL) signed GET — for X's v2 REST endpoints like the notifications feed.
async function signedGet(path, query) {
  if (!hasXCookies()) throw new Error("no cookies");
  const { auth, ct0 } = readCookieParts();
  const { tx } = await getSignerSession();
  const tid = await tx.generateTransactionId("GET", path);
  const url = `https://x.com/i/api${path}${query ? "?" + query : ""}`;
  const res = await fetch(url, { headers: { ...baseHeaders(ct0, tid), cookie: `auth_token=${auth}; ct0=${ct0}` }, signal: AbortSignal.timeout(10_000) });
  const text = await res.text();
  if (res.status === 401 || res.status === 403) { resetXScraper(); const e = new Error(`auth ${res.status}`); e.status = res.status; throw e; }
  if (!res.ok) { const e = new Error(`${path} ${res.status}`); e.status = res.status; throw e; }
  return JSON.parse(text);
}
function cookieOwnUserId() {
  const blob = clean(process.env.X_COOKIES);
  const twid = clean((blob.match(/(?:^|;\s*)twid=([^;]+)/i) || [])[1] || "");
  const decoded = (() => { try { return decodeURIComponent(twid); } catch { return twid; } })();
  return String((decoded.match(/u=(\d+)/) || [])[1] || "").trim();
}
function rememberCookieOwnUserId(value) {
  const id = String(value || "").trim();
  if (!id) return "";
  cookieOwnUserCache = { id, at: Date.now(), auth: readCookieParts().auth };
  return id;
}
function uuid4() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
async function signedApiJson(method, path, { query = "", body = null } = {}) {
  if (!hasXCookies()) throw new Error("no cookies");
  const { auth, ct0 } = readCookieParts();
  const { tx } = await getSignerSession();
  const tid = await tx.generateTransactionId(method, path);
  const qs = query ? (String(query).startsWith("?") ? String(query) : "?" + String(query)) : "";
  const headers = {
    ...baseHeaders(ct0, tid),
    cookie: `auth_token=${auth}; ct0=${ct0}`,
    "x-client-uuid": uuid4(),
    "content-type": "application/json"
  };
  let lastErr = "x api failed";
  for (const host of ["https://x.com/i/api", "https://api.x.com"]) {
    try {
      const res = await fetch(`${host}${path}${qs}`, {
        method,
        headers,
        body: body == null ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(boundedMs(process.env.X_DM_TIMEOUT_MS, 6_000, 2_000, 12_000))
      });
      const text = await res.text();
      if (res.status === 401 || res.status === 403) { resetXScraper(); const e = new Error(`auth ${res.status}`); e.status = res.status; throw e; }
      if (!res.ok) { lastErr = `${path} ${res.status}: ${text.slice(0, 120).replace(/\s+/g, " ")}`; continue; }
      try { return text ? JSON.parse(text) : {}; } catch { throw new Error(`${path}: bad JSON`); }
    } catch (e) {
      if (e.status === 401 || e.status === 403) throw e;
      lastErr = String(e?.message || e).slice(0, 160);
    }
  }
  throw new Error(lastErr);
}
function collectCookieDmEvents(node, out = [], seen = new Set()) {
  if (!node) return out;
  if (Array.isArray(node)) { for (const item of node) collectCookieDmEvents(item, out, seen); return out; }
  if (typeof node !== "object") return out;
  const msg = node.message || (node.message_data ? node : null);
  const data = msg?.message_data || msg;
  const text = data?.text || data?.message || "";
  const senderId = data?.sender_id || msg?.sender_id || "";
  const id = msg?.id || data?.id || node.id || msg?.request_id || `${senderId}:${data?.time || msg?.time || ""}:${String(text).slice(0, 20)}`;
  if (text && senderId && id && !seen.has(String(id))) {
    seen.add(String(id));
    out.push({
      id: String(id),
      senderId: String(senderId),
      conversationId: String(data?.conversation_id || msg?.conversation_id || node.conversation_id || ""),
      createdAt: String(data?.time || msg?.time || ""),
      text: String(text)
    });
  }
  for (const value of Object.values(node)) collectCookieDmEvents(value, out, seen);
  return out;
}
const DM_QUERY = "ext=mediaColor%2CaltText%2CmediaStats%2ChighlightedLabel%2CvoiceInfo%2CbirdwatchPivot%2CsuperFollowMetadata%2CunmentionInfo%2CeditControl%2Carticle&include_ext_alt_text=true&include_ext_limited_action_results=true&include_reply_count=1&tweet_mode=extended&include_ext_views=true&include_groups=true&include_inbox_timelines=true&include_ext_media_color=true&supports_reactions=true&supports_edit=true&dm_users=true";
export function xCookieDmConfigured() { return hasXCookies(); }
export async function xCookieDmOwnUserId() {
  const fromEnv = clean(process.env.X_DM_OWN_USER_ID || "");
  if (fromEnv) return rememberCookieOwnUserId(fromEnv);
  const fromCookie = cookieOwnUserId();
  if (fromCookie) return rememberCookieOwnUserId(fromCookie);
  const auth = readCookieParts().auth;
  if (cookieOwnUserCache.id && cookieOwnUserCache.auth === auth && Date.now() - cookieOwnUserCache.at < X_COOKIE_OWN_USER_TTL_MS) {
    return cookieOwnUserCache.id;
  }
  const me = await xWhoAmI().catch(() => null);
  return me?.id ? rememberCookieOwnUserId(me.id) : "";
}
export async function xCookieDmFetchEvents({ maxResults = 50 } = {}) {
  if (!hasXCookies()) return [];
  // This endpoint is polled repeatedly with the same authenticated URL. A timestamp prevents an X/CDN edge
  // from replaying an older inbox snapshot after a deploy while a fresh CA is visibly sitting in the DM.
  const json = await signedApiJson("GET", "/1.1/dm/inbox_initial_state.json", { query: `${DM_QUERY}&_=${Date.now()}` });
  const own = await xCookieDmOwnUserId().catch(() => "");
  return collectCookieDmEvents(json)
    .filter((event) => event.id && event.senderId && event.text && (!own || event.senderId !== own))
    .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }))
    .slice(-Math.max(10, Math.min(100, Number(maxResults) || 50)));
}
export async function xCookieDmSendText(participantId, text) {
  if (!hasXCookies()) return { ok: false, reason: "not configured" };
  const recipient = String(participantId || "").trim();
  if (!recipient) throw new Error("Missing X DM participant id");
  const base = {
    request_id: uuid4(),
    text: String(text || "").slice(0, 9500),
    cards_platform: "Web-12",
    include_cards: 1,
    include_quote_count: true,
    dm_users: true
  };
  // Recipient addressing does not need a Viewer lookup or guessed conversation-id ordering and is
  // the normal fast path. Keep both conversation forms only as compatibility fallbacks.
  const variants = [{ ...base, recipient_ids: recipient }];
  let addedConversationFallbacks = false;
  let lastErr = "";
  for (let index = 0; index < variants.length; index++) {
    const body = variants[index];
    try {
      const json = await signedApiJson("POST", "/1.1/dm/new2.json", { query: DM_QUERY, body });
      const entries = Array.isArray(json?.entries) ? json.entries : Object.values(json?.entries || {});
      const sent = collectCookieDmEvents(entries).find((event) => event.text === base.text);
      return { ok: true, id: sent?.id || body.request_id };
    } catch (e) {
      lastErr = String(e?.message || e).slice(0, 160);
      if (!addedConversationFallbacks) {
        addedConversationFallbacks = true;
        const own = await xCookieDmOwnUserId().catch(() => "");
        if (own) {
          variants.push(
            { ...base, conversation_id: `${recipient}-${own}`, recipient_ids: false },
            { ...base, conversation_id: `${own}-${recipient}`, recipient_ids: false }
          );
        }
      }
    }
  }
  return { ok: false, reason: lastErr || "dm send failed" };
}
// The account's REAL @mentions feed (notifications) — instant + complete, unlike search. This is the
// TG-scan-bot-style source: the moment someone tags us, it's here.
async function notificationMentions(count = 20) {
  const j = await signedGet("/2/notifications/mentions.json", `count=${Math.min(40, count)}&include_profile_interstitial_type=1&include_ext_alt_text=true&tweet_mode=extended&include_entities=true`);
  const tweets = j?.globalObjects?.tweets || {};
  const users = j?.globalObjects?.users || {};
  const out = [];
  for (const id of Object.keys(tweets)) {
    const t = tweets[id]; const u = users[String(t.user_id_str)] || {};
    out.push({
      id: String(t.id_str || id),
      text: String(t.full_text || t.text || ""),
      username: String(u.screen_name || ""),
      userId: String(t.user_id_str || ""),
      // conversation_id_str is the thread root (and equals this tweet for standalone posts), not the
      // direct parent. Keep it in conversationId only so retry logic can tell real replies apart.
      inReplyToId: String(t.in_reply_to_status_id_str || ""),
      inReplyToScreen: String(t.in_reply_to_screen_name || "").toLowerCase(),      // who this tweet REPLIES to
      conversationId: String(t.conversation_id_str || ""),                        // thread ROOT
      mentions: (t.entities?.user_mentions || []).map((x) => String(x.screen_name || "").toLowerCase()).filter(Boolean), // X-parsed @-mentions (present even when handle isn't in visible reply text)
      urls: (t.entities?.urls || []).map((x) => x.expanded_url || x.url).filter(Boolean), // expanded links
      permanentUrl: u.screen_name ? `https://x.com/${u.screen_name}/status/${id}` : "",
      createdAtMs: t.created_at ? new Date(t.created_at).getTime() : 0
    });
  }
  return out.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
}

async function searchMentionsForHandle(handle, count = 20) {
  const h = String(handle || "").replace(/^@+/, "").trim();
  if (!h) return { count: 0, tweets: [] };
  const j = await gql("GET", "SearchTimeline", {
    variables: {
      rawQuery: `(@${h}) -filter:retweets`,
      count: Math.min(40, count),
      querySource: "typed_query",
      product: "Latest"
    },
    features: READ_FEATURES
  });
  const instr = j?.data?.search_by_raw_query?.search_timeline?.timeline?.instructions || [];
  const tweets = [];
  let resultCount = 0;
  for (const ins of instr) for (const entry of (ins.entries || [])) {
    if (!String(entry.entryId || "").startsWith("tweet-")) continue;
    resultCount += 1;
    const tweet = parseTweetResult(entry.content?.itemContent?.tweet_results?.result);
    if (tweet) tweets.push(tweet);
  }
  return { count: resultCount, tweets };
}
// opts.includeSearch=false skips the SearchTimeline union (notifications only). The poller runs search on a
// slow cadence: 2 searches (one per handle spelling) EVERY 30s tick was ~240 searches/hr → constant 429s that
// ALSO starved the KOL first-responder + trench-watch, which share the same search quota. Notifications is the
// instant, complete source; search is a safety net that doesn't need to run every tick.
export async function xSearchMentions(count = 20, { includeSearch = true } = {}) {
  // Start sources that do not depend on the live handle immediately. On a cold process,
  // xResolvedHandle may need Viewer + query-id bootstrap; notifications should not sit idle behind it.
  // The env-handle search is one of the exact same (at most two) searches this function already made.
  const settleSource = (promise) => Promise.resolve(promise)
    .then((value) => ({ ok: true, value }), (error) => ({ ok: false, error }));
  const notificationPromise = settleSource(notificationMentions(count));
  const envH = String(xHandle()).toLowerCase().replace(/^@+/, "");
  const envSearchPromise = includeSearch && envH
    ? settleSource(searchMentionsForHandle(envH, count))
    : null;
  // Search BOTH the logged-in account's real handle (from whoami) AND the configured/TG handle — they can
  // differ (e.g. @SlimeWirebot vs @SlimeWiredBot), and a tag of one spelling would otherwise be invisible to
  // a search for the other. We reply from the cookie account either way, so a union is strictly safer.
  const resolved = String(await xResolvedHandle()).toLowerCase().replace(/^@+/, "");
  // ALIASES: the account was RENAMED (@SlimeWireSol → @slimewirebot). X still routes tags of a FORMER handle
  // to this account's mentions feed, but user_mentions carries the OLD spelling — so we must recognize it too
  // or every old-handle tag is dropped (live logs: tweets mention "slimewiresol", handle is "slimewirebot",
  // → 0 uniq). Configurable via X_HANDLE_ALIASES (comma/space list); defaults to the known former handle.
  const aliases = String(process.env.X_HANDLE_ALIASES || "slimewiresol,slimewiredbot,slimewireorg").toLowerCase()
    .split(/[,\s]+/).map((h) => h.replace(/^@+/, "").replace(/[^a-z0-9_]/g, "")).filter(Boolean);
  const handles = [...new Set([resolved, envH, ...aliases].filter(Boolean))];
  const tagRe = new RegExp("@(" + handles.map((h) => h.replace(/[^a-z0-9_]/g, "")).join("|") + ")\\b", "i");
  const self = new Set(handles);
  const byId = new Map();
  // Does this tweet REALLY tag us? Use X's authoritative signals, NOT just regex-on-text: a reply on X puts
  // the handle in entities.user_mentions / in_reply_to_screen_name, and often NOT in the visible full_text —
  // so a text-only check dropped every reply-mention (the "10 notifs → 0 uniq, bot stays silent" bug).
  const mentionsUs = (t) =>
    (Array.isArray(t.mentions) && t.mentions.some((m) => self.has(m))) ||   // X-parsed @-mentions
    (t.inReplyToScreen && self.has(t.inReplyToScreen)) ||                    // a direct reply to us
    tagRe.test(t.text || "");                                               // handle literally in the text
  const add = (t, requireTag) => {
    if (!t || !t.id || !t.username) return;
    if (self.has(t.username.toLowerCase())) return;              // never treat our own tweets as mentions
    // The notifications feed's globalObjects also holds PARENT/quoted tweets that don't tag us — only keep
    // ones that actually mention us so we never reply to a random coin tweet we were merely quoted under.
    if (requireTag && !mentionsUs(t)) return;
    if (!byId.has(t.id)) byId.set(t.id, t);
  };
  let n1 = 0, n2 = 0; const errs = []; let sample = "";
  // SOURCE 1: notifications feed — instant + complete (the account's real @mentions).
  // SOURCE 2: search — the freshest source (notifications lags for hours). Search ONLY the LIVE account handle
  // (the one the cookies resolve to) + the env handle if different — NOT the dead aliases. Searching all 4
  // spellings fired 4 SearchTimeline calls per tick → the last one always 429'd, throttling the REAL handle's
  // search so fresh tags never surfaced (the "tagged, got nothing" bug). One or two calls = no 429.
  const searchHandles = includeSearch ? [...new Set([resolved, envH].filter(Boolean))] : [];
  const searchPromises = searchHandles.map((h) => ({
    h,
    promise: h === envH && envSearchPromise
      ? envSearchPromise
      : settleSource(searchMentionsForHandle(h, count))
  }));

  // Await every already-started source together. The source set/call count is unchanged; only serial wait
  // time is removed, so latency becomes roughly the slowest source rather than their sum.
  const [notificationResult, ...searchResults] = await Promise.all([
    notificationPromise,
    ...searchPromises.map(({ promise }) => promise)
  ]);

  if (notificationResult.ok) {
    const arr = notificationResult.value || [];
    n1 = arr.length;
    for (const t of arr) add(t, true);
    if (arr.length && byId.size === 0) { const t = arr[0]; sample = ` sample[@${t.username} mentions=${(t.mentions || []).join("/") || "-"} replyTo=${t.inReplyToScreen || "-"} txt=${JSON.stringify(String(t.text || "").slice(0, 40))}]`; }
  } else {
    errs.push("notif:" + String(notificationResult.error?.message || notificationResult.error).slice(0, 50));
  }

  for (let i = 0; i < searchResults.length; i += 1) {
    const result = searchResults[i];
    const h = searchPromises[i].h;
    if (!result.ok) {
      errs.push(`search(@${h}):` + String(result.error?.message || result.error).slice(0, 50));
      continue;
    }
    n2 += Number(result.value?.count || 0);
    for (const tweet of (result.value?.tweets || [])) add(tweet, false);
  }
  const out = [...byId.values()].sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
  // DIAGNOSTIC: both sources previously swallowed errors, so a double failure returned [] with NO log — the
  // "poll ticks but never sees a mention" blind spot. Now every fetch reports what it saw.
  try { console.log(`[xreply] mentions: handles=[${handles.join(",")}] notif=${n1} search=${n2} → ${out.length} uniq${errs.length ? " · ERR " + errs.join(" | ") : ""}${out.length === 0 ? sample : ""}`); } catch { /* logging is best-effort */ }
  return out;
}
// General SearchTimeline query → parsed tweets (newest first). Powers the KOL first-responder
// (rawQuery `from:<handle>`) and any other "watch a search" feature. Best-effort: returns [] on error.
export async function xSearchQuery(rawQuery, count = 10) {
  if (!hasXCookies() || !rawQuery) return [];
  const out = [];
  try {
    const j = await gql("GET", "SearchTimeline", { variables: { rawQuery: String(rawQuery), count: Math.min(40, count), querySource: "typed_query", product: "Latest" }, features: READ_FEATURES });
    const instr = j?.data?.search_by_raw_query?.search_timeline?.timeline?.instructions || [];
    for (const ins of instr) for (const entry of (ins.entries || [])) {
      if (!String(entry.entryId || "").startsWith("tweet-")) continue;
      const t = parseTweetResult(entry.content?.itemContent?.tweet_results?.result);
      if (t && t.id) out.push(t);
    }
  } catch { /* best-effort */ }
  return out.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
}
export async function xGetTweet(id) {
  if (!id) return null;
  try {
    const j = await gql("GET", "TweetResultByRestId", { variables: { tweetId: String(id), withCommunity: false, includePromotedContent: false, withVoice: false }, features: READ_FEATURES });
    const t = parseTweetResult(j?.data?.tweetResult?.result);
    return t || null;
  } catch { return null; }
}

// Media upload (v1.1 simple upload). Returns { id, error } — tries upload.twitter.com then upload.x.com.
async function uploadMedia(buffer) {
  if (!buffer || !hasXCookies()) return { id: null, error: "no buffer" };
  const { auth, ct0 } = readCookieParts();
  let tx; try { ({ tx } = await getSignerSession()); } catch (e) { return { id: null, error: "session:" + String(e?.message || e).slice(0, 50) }; }
  const path = "/1.1/media/upload.json";
  let lastErr = "upload failed";
  for (const host of ["https://upload.twitter.com", "https://upload.x.com"]) {
    try {
      const tid = await tx.generateTransactionId("POST", path);
      const form = new FormData();
      form.append("media_data", buffer.toString("base64"));
      form.append("media_category", "tweet_image");
      const res = await fetch(`${host}${path}`, { method: "POST", headers: { authorization: `Bearer ${BEARER}`, "x-csrf-token": ct0, "x-client-transaction-id": tid, cookie: `auth_token=${auth}; ct0=${ct0}`, "user-agent": UA, referer: "https://x.com/", origin: "https://x.com" }, body: form, signal: AbortSignal.timeout(12_000) });
      const t = await res.text();
      if (res.ok) { try { const j = JSON.parse(t); const id = j?.media_id_string || (j?.media_id ? String(j.media_id) : null); if (id) return { id, error: null }; } catch {} }
      lastErr = `${res.status}:${t.slice(0, 60).replace(/\s+/g, " ")}`;
    } catch (e) { lastErr = String(e?.message || e).slice(0, 60); }
  }
  return { id: null, error: lastErr };
}

async function runXWithConcurrency(items, concurrency, worker) {
  if (!items.length) return [];
  const results = Array.from({ length: items.length });
  let nextIndex = 0;
  const runners = Array.from({ length: Math.min(Math.max(1, concurrency), items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}
// General tweet poster — powers replies, STANDALONE posts (proactive auto-calls), and QUOTE-tweets (receipts,
// KOL first-responder). Pass inReplyToId for a reply, quoteTweetId to quote another tweet, neither for a plain
// broadcast. Up to 4 images (mediaBuffers[] or mediaBuffer).
export async function xPost({ text, mediaBuffer, mediaBuffers, inReplyToId, quoteTweetId } = {}) {
  if (!hasXCookies()) return { ok: false, reason: "not configured" };
  try {
    const bufs = (Array.isArray(mediaBuffers) ? mediaBuffers : [mediaBuffer]).filter(Boolean).slice(0, 4);
    const mediaIds = []; let media = "none";
    // X allows up to four images. Upload at most two concurrently: this cuts two-card map latency without
    // turning a four-image post into a burst of four simultaneous upload requests. Input order is preserved.
    const uploads = await runXWithConcurrency(bufs, 2, (buffer) => uploadMedia(buffer));
    for (const up of uploads) { if (up.id) mediaIds.push(up.id); else media = "no-card:" + (up.error || ""); }
    if (mediaIds.length) media = mediaIds.length + "img";
    const variables = {
      tweet_text: String(text || "").slice(0, 279),
      dark_request: false,
      media: { media_entities: mediaIds.map((id) => ({ media_id: id, tagged_users: [] })), possibly_sensitive: false },
      semantic_annotation_ids: []
    };
    if (inReplyToId) variables.reply = { in_reply_to_tweet_id: String(inReplyToId), exclude_reply_user_ids: [] };
    // A quote-tweet on X's CreateTweet is just the quoted tweet's URL as attachment_url.
    if (quoteTweetId) variables.attachment_url = `https://x.com/i/status/${String(quoteTweetId)}`;
    const j = await gql("POST", "CreateTweet", { variables, features: WRITE_FEATURES });
    const id = j?.data?.create_tweet?.tweet_results?.result?.rest_id || "";
    if (j?.errors?.length && !id) return { ok: false, reason: String(j.errors[0]?.message || "create_tweet error").slice(0, 140), media };
    return { ok: true, id, media };
  } catch (e) {
    if (e.status === 401 || e.status === 403) resetXScraper();
    return { ok: false, reason: String(e?.message || "post failed").slice(0, 160) };
  }
}
// Back-compat wrapper — a reply is just a post with an in_reply_to. (Up to 4 images: the holder bubble map AND
// the airdrop map in one reply when a coin is tagged.)
export async function xReply({ inReplyToId, text, mediaBuffer, mediaBuffers }) {
  return xPost({ inReplyToId, text, mediaBuffer, mediaBuffers });
}
