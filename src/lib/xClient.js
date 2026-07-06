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

function hasXCookies() { return Boolean((process.env.X_AUTH_TOKEN || "").trim() && (process.env.X_CT0 || "").trim()); }
function hasXPassword() { return Boolean((process.env.X_USERNAME || "").trim() && (process.env.X_PASSWORD || "").trim()); }
export function xConfigured() { return hasXCookies() || hasXPassword(); }
export function xHandle() {
  return String(process.env.X_HANDLE || process.env.TELEGRAM_BOT_USERNAME || "SlimeWiredBot").replace(/^@+/, "").trim();
}

// Build (once) a cookie-authenticated Scraper. Returns null if not configured or the session is dead
// (expired/invalidated cookies) so callers just no-op instead of throwing.
export async function getXScraper() {
  if (!xConfigured()) return null;
  if (scraperPromise) return scraperPromise;
  scraperPromise = (async () => {
    try {
      const s = new Scraper();
      // 1) COOKIES — an already-authenticated browser session; most reliable WHEN FRESH (they expire).
      if (hasXCookies()) {
        const domain = "twitter.com";
        const cookies = [
          `auth_token=${String(process.env.X_AUTH_TOKEN).trim()}; Domain=.${domain}; Path=/; Secure; HttpOnly`,
          `ct0=${String(process.env.X_CT0).trim()}; Domain=.${domain}; Path=/; Secure`
        ];
        if ((process.env.X_GUEST_ID || "").trim()) cookies.push(`guest_id=${String(process.env.X_GUEST_ID).trim()}; Domain=.${domain}; Path=/`);
        await s.setCookies(cookies).catch(() => {});
        if (await s.isLoggedIn().catch(() => false)) return s;
      }
      // 2) USERNAME/PASSWORD — durable fallback that DOESN'T expire like cookies. Set X_USERNAME +
      // X_PASSWORD (+ X_EMAIL, + X_2FA_SECRET if 2FA is on). The password is owner-set env; never logged.
      if (hasXPassword()) {
        try {
          await s.login(
            String(process.env.X_USERNAME).trim(),
            String(process.env.X_PASSWORD),
            (process.env.X_EMAIL || "").trim() || undefined,
            (process.env.X_2FA_SECRET || "").trim() || undefined
          );
          if (await s.isLoggedIn().catch(() => false)) return s;
        } catch { /* fall through to null */ }
      }
      scraperPromise = null;
      return null;
    } catch { scraperPromise = null; return null; }
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
