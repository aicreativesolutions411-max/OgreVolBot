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
  polyfillArrayBufferTransfer();
  _xti = await import("x-client-transaction-id");
  return _xti;
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

// ---- Session (transaction signer + live query-id map), refreshed periodically --------------------
let session = null; // { tx, qmap, at }
async function scrapeQueryIds() {
  const map = {};
  try {
    const home = await (await fetch("https://x.com/", { headers: { "user-agent": UA, accept: "text/html" } })).text();
    const urls = [...new Set([...home.matchAll(/https:\/\/abs\.twimg\.com\/responsive-web\/client-web\/[a-zA-Z0-9._/-]+\.js/g)].map((m) => m[0]))];
    const scan = (urls.filter((u) => /\/(main|api|endpoints|bundle)\./.test(u)) || []);
    for (const u of (scan.length ? scan : urls).slice(0, 12)) {
      try {
        const js = await (await fetch(u, { headers: { "user-agent": UA } })).text();
        for (const m of js.matchAll(/queryId:"([^"]+)",operationName:"([^"]+)"/g)) map[m[2]] = m[1];
        for (const m of js.matchAll(/operationName:"([^"]+)"[^}]{0,80}?queryId:"([^"]+)"/g)) map[m[1]] = m[2];
      } catch { /* skip a bundle */ }
    }
  } catch { /* fall back to hardcoded ids */ }
  return map;
}
async function getSession() {
  if (session && Date.now() - session.at < 25 * 60_000) return session;
  const { ClientTransaction, fetchXDocument } = await loadXti(); // lazy: never loaded at app boot
  const doc = await fetchXDocument();
  const tx = await ClientTransaction.create(doc);
  const qmap = await scrapeQueryIds();
  session = { tx, qmap, at: Date.now() };
  return session;
}
export function resetXScraper() { session = null; }
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
    lastAuthError = ""; lastAuthReport = { cookies: "ok", api: "ok" };
    return screen ? { username: screen, screenName: screen, name } : null;
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
    inReplyToId: String(legacy.in_reply_to_status_id_str || legacy.conversation_id_str || ""),
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
  const { tx } = await getSession();
  const tid = await tx.generateTransactionId("GET", path);
  const url = `https://x.com/i/api${path}${query ? "?" + query : ""}`;
  const res = await fetch(url, { headers: { ...baseHeaders(ct0, tid), cookie: `auth_token=${auth}; ct0=${ct0}` }, signal: AbortSignal.timeout(10_000) });
  const text = await res.text();
  if (res.status === 401 || res.status === 403) { resetXScraper(); const e = new Error(`auth ${res.status}`); e.status = res.status; throw e; }
  if (!res.ok) { const e = new Error(`${path} ${res.status}`); e.status = res.status; throw e; }
  return JSON.parse(text);
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
      inReplyToId: String(t.in_reply_to_status_id_str || t.conversation_id_str || ""),
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
export async function xSearchMentions(count = 20) {
  // Search BOTH the logged-in account's real handle (from whoami) AND the configured/TG handle — they can
  // differ (e.g. @SlimeWirebot vs @SlimeWiredBot), and a tag of one spelling would otherwise be invisible to
  // a search for the other. We reply from the cookie account either way, so a union is strictly safer.
  const resolved = String(await xResolvedHandle()).toLowerCase().replace(/^@+/, "");
  const envH = String(xHandle()).toLowerCase().replace(/^@+/, "");
  // ALIASES: the account was RENAMED (@SlimeWireSol → @slimewirebot). X still routes tags of a FORMER handle
  // to this account's mentions feed, but user_mentions carries the OLD spelling — so we must recognize it too
  // or every old-handle tag is dropped (live logs: tweets mention "slimewiresol", handle is "slimewirebot",
  // → 0 uniq). Configurable via X_HANDLE_ALIASES (comma/space list); defaults to the known former handle.
  const aliases = String(process.env.X_HANDLE_ALIASES || "slimewiresol").toLowerCase()
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
  try {
    const arr = await notificationMentions(count); n1 = arr.length; for (const t of arr) add(t, true);
    // If notifications returned tweets but none passed the mention filter, capture WHY from the newest one.
    if (arr.length && byId.size === 0) { const t = arr[0]; sample = ` sample[@${t.username} mentions=${(t.mentions || []).join("/") || "-"} replyTo=${t.inReplyToScreen || "-"} txt=${JSON.stringify(String(t.text || "").slice(0, 40))}]`; }
  }
  catch (e) { errs.push("notif:" + String(e?.message || e).slice(0, 50)); }
  // SOURCE 2: search — UNION, not just a fallback. Catches anything notifications dropped (and vice-versa),
  // so a tag can't slip through a single-source gap. Run once PER handle spelling. Best-effort per query.
  for (const h of handles) {
    try {
      const j = await gql("GET", "SearchTimeline", { variables: { rawQuery: `@${h} -filter:retweets`, count: Math.min(40, count), querySource: "typed_query", product: "Latest" }, features: READ_FEATURES });
      const instr = j?.data?.search_by_raw_query?.search_timeline?.timeline?.instructions || [];
      for (const ins of instr) for (const entry of (ins.entries || [])) {
        if (!String(entry.entryId || "").startsWith("tweet-")) continue;
        n2++; add(parseTweetResult(entry.content?.itemContent?.tweet_results?.result), false);
      }
    } catch (e) { errs.push(`search(@${h}):` + String(e?.message || e).slice(0, 50)); }
  }
  const out = [...byId.values()].sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
  // DIAGNOSTIC: both sources previously swallowed errors, so a double failure returned [] with NO log — the
  // "poll ticks but never sees a mention" blind spot. Now every fetch reports what it saw.
  try { console.log(`[xreply] mentions: handles=[${handles.join(",")}] notif=${n1} search=${n2} → ${out.length} uniq${errs.length ? " · ERR " + errs.join(" | ") : ""}${out.length === 0 ? sample : ""}`); } catch { /* logging is best-effort */ }
  return out;
}
export async function xGetTweet(id) {
  if (!id) return null;
  try {
    const j = await gql("GET", "TweetResultByRestId", { variables: { tweetId: String(id), withCommunity: false, includePromotedContent: false, withVoice: false }, features: READ_FEATURES });
    const t = parseTweetResult(j?.data?.tweetResult?.result);
    return t ? { id: t.id, text: t.text, urls: t.urls, conversationId: t.conversationId } : null;
  } catch { return null; }
}

// Media upload (v1.1 simple upload). Returns { id, error } — tries upload.twitter.com then upload.x.com.
async function uploadMedia(buffer) {
  if (!buffer || !hasXCookies()) return { id: null, error: "no buffer" };
  const { auth, ct0 } = readCookieParts();
  let tx; try { ({ tx } = await getSession()); } catch (e) { return { id: null, error: "session:" + String(e?.message || e).slice(0, 50) }; }
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
export async function xReply({ inReplyToId, text, mediaBuffer }) {
  if (!hasXCookies()) return { ok: false, reason: "not configured" };
  try {
    let mediaId = null, media = "none";
    if (mediaBuffer) { const up = await uploadMedia(mediaBuffer); mediaId = up.id; media = up.id ? "card" : ("no-card:" + (up.error || "")); }
    const variables = {
      tweet_text: String(text || "").slice(0, 279),
      reply: { in_reply_to_tweet_id: String(inReplyToId), exclude_reply_user_ids: [] },
      dark_request: false,
      media: { media_entities: mediaId ? [{ media_id: mediaId, tagged_users: [] }] : [], possibly_sensitive: false },
      semantic_annotation_ids: []
    };
    const j = await gql("POST", "CreateTweet", { variables, features: WRITE_FEATURES });
    const id = j?.data?.create_tweet?.tweet_results?.result?.rest_id || "";
    if (j?.errors?.length && !id) return { ok: false, reason: String(j.errors[0]?.message || "create_tweet error").slice(0, 140), media };
    return { ok: true, id, media };
  } catch (e) {
    if (e.status === 401 || e.status === 403) resetXScraper();
    return { ok: false, reason: String(e?.message || "reply failed").slice(0, 160) };
  }
}
