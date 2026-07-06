// Unofficial X (Twitter) access via a logged-in account's SESSION COOKIES — no paid API. Isolates the
// fragile third-party client (agent-twitter-client) behind a tiny, stable interface so the rest of the
// app never imports it directly. Everything degrades to "not configured" (returns null/[]) when the
// cookies aren't set, so nothing here can fire until the owner opts in.
//
// SECRETS: the account's auth_token + ct0 cookies come from env (X_AUTH_TOKEN / X_CT0). They are set by
// the owner in Render — this code only READS them. Never log them.
//
// TERMS: automating a logged-in account is against X's ToS and can get the account suspended. The owner
// accepted that risk; callers throttle hard + reply with value (a scan card), not bare-link spam.
import { Scraper, SearchMode } from "agent-twitter-client";

let scraperPromise = null;
// Per-method auth outcome, in plain English, so /xtest can tell the owner WHY (expired cookies vs a login
// challenge vs wrong password) instead of a useless "failed". Never contains the secret itself.
let lastAuthError = "";
let lastAuthReport = { cookies: "", password: "" };
export function xLastAuthError() { return lastAuthError; }
export function xAuthReport() { return lastAuthReport; }

// Cookies can be supplied two ways, in priority order:
//  (1) X_AUTH_TOKEN + X_CT0 (+ optional X_GUEST_ID) — the individual values, OR
//  (2) X_COOKIES — paste the WHOLE cookie string from the browser (Application → Cookies, or
//      `document.cookie`); we parse auth_token / ct0 / guest_id out of it. Far harder to get wrong.
// Strips accidental wrapping quotes / spaces that silently break the individual-var path.
function clean(v) { return String(v || "").trim().replace(/^["']|["']$/g, "").trim(); }
function readCookieParts() {
  let auth = clean(process.env.X_AUTH_TOKEN);
  let ct0 = clean(process.env.X_CT0);
  let guest = clean(process.env.X_GUEST_ID);
  const blob = clean(process.env.X_COOKIES);
  if (blob) {
    if (!auth) { const m = blob.match(/auth_token=([^;\s]+)/i); if (m) auth = m[1]; }
    if (!ct0) { const m = blob.match(/ct0=([^;\s]+)/i); if (m) ct0 = m[1]; }
    if (!guest) { const m = blob.match(/guest_id=([^;\s]+)/i); if (m) guest = m[1]; }
  }
  return { auth, ct0, guest };
}
function hasXCookies() { const { auth, ct0 } = readCookieParts(); return Boolean(auth && ct0); }
function hasXPassword() { return Boolean(clean(process.env.X_USERNAME) && String(process.env.X_PASSWORD || "").length); }
export function xConfigured() { return hasXCookies() || hasXPassword(); }
export function xAuthMode() { return hasXCookies() ? "cookies" : hasXPassword() ? "password" : "none"; }
export function xHandle() {
  return String(process.env.X_HANDLE || process.env.TELEGRAM_BOT_USERNAME || "SlimeWiredBot").replace(/^@+/, "").trim();
}

// Build (once) a cookie-authenticated Scraper. Returns null if not configured or the session is dead
// (expired/invalidated cookies) so callers just no-op instead of throwing.
export async function getXScraper() {
  if (!xConfigured()) return null;
  if (scraperPromise) return scraperPromise;
  scraperPromise = (async () => {
    const report = { cookies: "", password: "" };
    try {
      const s = new Scraper();
      // A login "took" if EITHER isLoggedIn() says so OR me() returns a handle. isLoggedIn() is flaky on
      // this client (sometimes false right after a good login), so me() is the tie-breaker.
      const authed = async () => {
        if (await s.isLoggedIn().catch(() => false)) return true;
        try { const me = await s.me(); return Boolean(me && (me.username || me.screenName || me?.legacy?.screen_name)); } catch { return false; }
      };
      const finish = (sc) => { lastAuthError = ""; lastAuthReport = report; return sc; };
      // 1) COOKIES — an already-authenticated browser session; most reliable WHEN FRESH (they expire).
      const { auth, ct0, guest } = readCookieParts();
      if (auth && ct0) {
        try {
          // Set for BOTH twitter.com and x.com so whichever host the client hits is covered.
          const cookies = [];
          for (const d of ["twitter.com", "x.com"]) {
            cookies.push(`auth_token=${auth}; Domain=.${d}; Path=/; Secure; HttpOnly`);
            cookies.push(`ct0=${ct0}; Domain=.${d}; Path=/; Secure`);
            if (guest) cookies.push(`guest_id=${guest}; Domain=.${d}; Path=/`);
          }
          await s.setCookies(cookies).catch(() => {});
          if (await authed()) { report.cookies = "ok"; return finish(s); }
          report.cookies = "rejected — auth_token/ct0 are stale or mistyped (grab fresh from x.com; copy the VALUE only, no name/quotes)";
        } catch (e) { report.cookies = `error: ${String(e?.message || e).slice(0, 120)}`; }
      } else {
        report.cookies = "not set";
      }
      // 2) USERNAME/PASSWORD — durable fallback that DOESN'T expire like cookies. Set X_USERNAME +
      // X_PASSWORD (+ X_EMAIL, + X_2FA_SECRET if 2FA is on). The password is owner-set env; never logged.
      if (hasXPassword()) {
        const user = clean(process.env.X_USERNAME);
        const email = clean(process.env.X_EMAIL);
        const twoFa = clean(process.env.X_2FA_SECRET);
        try {
          await s.login(user, String(process.env.X_PASSWORD), email || undefined, twoFa || undefined);
          if (await authed()) { report.password = "ok"; return finish(s); }
          if (email) { // some flows want the EMAIL as the identifier ("confirm your email")
            try { await s.login(email, String(process.env.X_PASSWORD), user || undefined, twoFa || undefined); if (await authed()) { report.password = "ok"; return finish(s); } } catch { /* keep error below */ }
          }
          report.password = twoFa ? "login didn't authenticate — check creds; a wrong X_2FA_SECRET fails silently" : "login didn't authenticate — X wants a confirmation code it emailed/texted (the library can't read it). Use cookies.";
        } catch (e) {
          const msg = String(e?.message || e || "login failed");
          if (/acid|confirm|verif|challenge|code|arkose|captcha/i.test(msg)) report.password = "X challenged the login (datacenter IP → emailed code the library can't read). Use cookies.";
          else if (/suspend|locked/i.test(msg)) report.password = "account suspended/locked — log in on x.com and clear it";
          else if (/password|credential|denied|401|403|unauthor/i.test(msg)) report.password = "X rejected the credentials — double-check X_USERNAME + X_PASSWORD";
          else report.password = `login error: ${msg.slice(0, 120)}`;
        }
      } else {
        report.password = "not set";
      }
      // Both paths failed — surface the most actionable one (cookies is the reliable route from a server).
      lastAuthReport = report;
      lastAuthError = report.cookies && report.cookies !== "not set" && report.cookies !== "ok"
        ? `cookies ${report.cookies}`
        : (report.password && report.password !== "not set" ? report.password : "not configured");
      scraperPromise = null;
      return null;
    } catch (e) { scraperPromise = null; lastAuthReport = report; lastAuthError = `client: ${String(e?.message || e).slice(0, 140)}`; return null; }
  })();
  return scraperPromise;
}

// Force a fresh login on the next call (e.g. after a 401 / cookie rotation).
export function resetXScraper() { scraperPromise = null; }

// The @handle we reply as — resolved from the LOGGED-IN account (the cookies), so a mistyped/omitted
// X_HANDLE env can't make it watch the wrong account. Falls back to X_HANDLE only if whoami fails.
let cachedHandle = null;
export async function xResolvedHandle() {
  if (cachedHandle) return cachedHandle;
  const s = await getXScraper();
  if (s) { try { const me = await s.me(); const h = me?.username || me?.screenName || me?.legacy?.screen_name; if (h) { cachedHandle = String(h).replace(/^@+/, ""); return cachedHandle; } } catch {} }
  return xHandle();
}

// Recent tweets that MENTION our handle (people asking us) — the least-abusive read: our own inbox.
// Excludes our own tweets + retweets. Returns [{ id, text, username, userId, permanentUrl, createdAtMs }].
export async function xSearchMentions(count = 20) {
  const s = await getXScraper();
  if (!s) return [];
  const handle = await xResolvedHandle();
  try {
    const res = await s.fetchSearchTweets(`@${handle} -from:${handle} -filter:retweets`, Math.min(50, count), SearchMode.Latest);
    const tweets = (res && res.tweets) || [];
    return tweets.map((t) => ({
      id: String(t.id || t.rest_id || ""),
      text: String(t.text || t.full_text || ""),
      username: String(t.username || t.user?.screen_name || ""),
      userId: String(t.userId || t.user_id || ""),
      // the tweet this mention is a reply TO — lets us scan the coin in the PARENT post (tag us anywhere).
      inReplyToId: String(t.inReplyToStatusId || t.in_reply_to_status_id_str || t.conversationId || ""),
      permanentUrl: t.permanentUrl || (t.username && t.id ? `https://x.com/${t.username}/status/${t.id}` : ""),
      createdAtMs: t.timeParsed ? new Date(t.timeParsed).getTime() : (Number(t.timestamp) ? Number(t.timestamp) * 1000 : 0)
    })).filter((t) => t.id);
  } catch { return []; }
}

// Read one tweet's text by id (used to scan the coin in a post someone tagged us UNDER).
export async function xGetTweet(id) {
  const s = await getXScraper();
  if (!s || !id) return null;
  try { const t = await s.getTweet(String(id)); return t ? { id: String(t.id || id), text: String(t.text || t.full_text || "") } : null; } catch { return null; }
}

// Reply to a tweet, optionally with a PNG card attached. Returns { ok, id? } — never throws.
export async function xReply({ inReplyToId, text, mediaBuffer }) {
  const s = await getXScraper();
  if (!s) return { ok: false, reason: "not configured" };
  try {
    const media = mediaBuffer ? [{ data: mediaBuffer, mediaType: "image/png" }] : undefined;
    const resp = await s.sendTweet(String(text || "").slice(0, 279), String(inReplyToId), media);
    // sendTweet returns a fetch Response (graphql); a 200 means posted. Best-effort id parse.
    let id = "";
    try { const j = await resp.json(); id = j?.data?.create_tweet?.tweet_results?.result?.rest_id || ""; } catch {}
    const ok = !resp || resp.ok !== false;
    return { ok, id };
  } catch (e) {
    if (/401|unauthor/i.test(String(e?.message || ""))) resetXScraper();
    return { ok: false, reason: String(e?.message || "reply failed").slice(0, 160) };
  }
}

export async function xWhoAmI() {
  const s = await getXScraper();
  if (!s) return null;
  try { return await s.me(); } catch { return null; }
}
