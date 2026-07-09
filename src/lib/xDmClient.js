// Official X API v2 Direct Message helper.
// Requires an OAuth 2.0 user-context token with DM scopes. Keep it optional:
// when unset, callers no-op and the main bot keeps running normally.

function clean(value) {
  return String(value || "").trim().replace(/^["']|["']$/g, "").trim();
}

function dmToken() {
  return clean(process.env.X_DM_OAUTH2_TOKEN || process.env.X_DM_ACCESS_TOKEN || "");
}

function dmBaseUrl() {
  return clean(process.env.X_DM_API_BASE || "https://api.x.com/2").replace(/\/+$/, "");
}

export function xDmConfigured() {
  return Boolean(dmToken());
}

export function xDmAuthMode() {
  return xDmConfigured() ? "official-oauth2" : "none";
}

async function xDmRequest(path, options = {}) {
  const token = dmToken();
  if (!token) throw new Error("X DM OAuth token not configured");
  const headers = {
    authorization: `Bearer ${token}`,
    accept: "application/json",
    ...(options.body ? { "content-type": "application/json" } : {}),
    ...(options.headers || {})
  };
  const res = await fetch(`${dmBaseUrl()}${path}`, {
    ...options,
    headers,
    signal: AbortSignal.timeout(Number(process.env.X_DM_TIMEOUT_MS || 12_000))
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  if (!res.ok) {
    const msg = json?.title || json?.detail || json?.errors?.[0]?.message || text || `X DM ${res.status}`;
    const err = new Error(String(msg).slice(0, 180));
    err.status = res.status;
    throw err;
  }
  return json || {};
}

function normalizeDmEvent(event) {
  const id = String(event?.id || event?.dm_event_id || "");
  const senderId = String(event?.sender_id || event?.senderId || event?.sender?.id || "");
  const conversationId = String(event?.dm_conversation_id || event?.conversation_id || event?.dmConversationId || "");
  const createdAt = String(event?.created_at || event?.createdAt || "");
  const text = String(event?.text || event?.message_create?.message_data?.text || "");
  return { id, senderId, conversationId, createdAt, text };
}

export async function xDmFetchEvents({ maxResults = 50 } = {}) {
  const params = new URLSearchParams();
  params.set("max_results", String(Math.max(10, Math.min(100, Number(maxResults) || 50))));
  params.set("dm_event.fields", "id,text,event_type,created_at,sender_id,dm_conversation_id");
  const json = await xDmRequest(`/dm_events?${params.toString()}`, { method: "GET" });
  return (Array.isArray(json?.data) ? json.data : [])
    .map(normalizeDmEvent)
    .filter((event) => event.id && event.senderId && event.text);
}

export async function xDmSendText(participantId, text) {
  const id = String(participantId || "").trim();
  if (!id) throw new Error("Missing X DM participant id");
  const body = JSON.stringify({ text: String(text || "").slice(0, 9500) });
  const json = await xDmRequest(`/dm_conversations/with/${encodeURIComponent(id)}/messages`, {
    method: "POST",
    body
  });
  const eventId = json?.data?.id || json?.data?.dm_event_id || "";
  return { ok: true, id: eventId ? String(eventId) : "" };
}
