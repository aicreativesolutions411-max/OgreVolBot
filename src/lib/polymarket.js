const GAMMA_BASE = "https://gamma-api.polymarket.com";
const DATA_BASE = "https://data-api.polymarket.com";

export function polymarketWalletAddress(value) {
  const address = String(value || "").trim().toLowerCase();
  return /^0x[0-9a-f]{40}$/.test(address) ? address : "";
}

function jsonArray(value) {
  if (Array.isArray(value)) return value;
  try { const parsed = JSON.parse(String(value || "[]")); return Array.isArray(parsed) ? parsed : []; }
  catch { return []; }
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function normalizePolymarketEvent(event = {}) {
  const markets = (Array.isArray(event.markets) ? event.markets : [])
    .filter((market) => market && market.closed !== true)
    .map((market) => {
      const outcomes = jsonArray(market.outcomes).map(String);
      const prices = jsonArray(market.outcomePrices).map(finite);
      const tokens = jsonArray(market.clobTokenIds).map(String);
      return {
        id: String(market.id || ""),
        conditionId: String(market.conditionId || ""),
        question: String(market.question || event.title || "Prediction market"),
        outcomes: outcomes.map((outcome, index) => ({ outcome, price: prices[index] || 0, tokenId: tokens[index] || "" })),
        volume24h: finite(market.volume24hr),
        liquidity: finite(market.liquidityNum ?? market.liquidity),
        acceptingOrders: market.acceptingOrders !== false,
        endDate: market.endDate || event.endDate || null,
        slug: String(market.slug || event.slug || "")
      };
    })
    .sort((a, b) => (b.volume24h + b.liquidity * .01) - (a.volume24h + a.liquidity * .01));
  return {
    id: String(event.id || ""),
    title: String(event.title || event.question || "Prediction market"),
    slug: String(event.slug || ""),
    icon: String(event.icon || event.image || ""),
    category: String(event.category || ""),
    startDate: event.startDate || event.creationDate || event.createdAt || null,
    volume24h: finite(event.volume24hr),
    liquidity: finite(event.liquidity),
    endDate: event.endDate || null,
    markets: markets.slice(0, 6),
    url: event.slug ? `https://polymarket.com/event/${encodeURIComponent(event.slug)}` : "https://polymarket.com"
  };
}

export function normalizePolymarketPosition(position = {}, closed = false) {
  return {
    key: [position.conditionId, position.asset, position.timestamp || position.endDate || ""].map(String).join(":"),
    conditionId: String(position.conditionId || ""),
    asset: String(position.asset || ""),
    title: String(position.title || "Prediction market"),
    slug: String(position.slug || ""),
    eventSlug: String(position.eventSlug || ""),
    icon: String(position.icon || ""),
    outcome: String(position.outcome || ""),
    size: finite(position.size),
    avgPrice: finite(position.avgPrice),
    currentPrice: finite(position.curPrice ?? position.currentPrice),
    currentValue: finite(position.currentValue),
    initialValue: finite(position.initialValue ?? position.totalBought),
    cashPnl: finite(position.cashPnl),
    percentPnl: finite(position.percentPnl),
    realizedPnl: finite(position.realizedPnl),
    timestamp: finite(position.timestamp),
    endDate: position.endDate || null,
    closed: Boolean(closed),
    url: position.slug ? `https://polymarket.com/event/${encodeURIComponent(position.eventSlug || position.slug)}?market=${encodeURIComponent(position.slug)}` : "https://polymarket.com"
  };
}

export function summarizePolymarketPortfolio(openRows = [], closedRows = []) {
  const open = openRows.map((row) => normalizePolymarketPosition(row, false));
  const closed = closedRows.map((row) => normalizePolymarketPosition(row, true));
  return {
    open,
    closed,
    totals: {
      openValue: open.reduce((sum, row) => sum + row.currentValue, 0),
      openPnl: open.reduce((sum, row) => sum + row.cashPnl, 0),
      realizedPnl: closed.reduce((sum, row) => sum + row.realizedPnl, 0),
      openCount: open.length,
      closedCount: closed.length
    }
  };
}

export function createPolymarketClient({ fetchImpl = fetch, cacheTtlMs = 15_000, cacheMax = 256 } = {}) {
  const cache = new Map();
  const pending = new Map();
  async function request(base, pathname, params = {}) {
    const url = new URL(pathname, base);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    });
    const key = url.toString();
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < cacheTtlMs) return hit.value;
    if (pending.has(key)) return pending.get(key);
    const load = (async () => {
      const response = await fetchImpl(key, { headers: { Accept: "application/json", "User-Agent": "SlimeWire/1.0" }, signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error(`Polymarket API ${response.status}`);
      const value = await response.json();
      cache.delete(key);
      cache.set(key, { at: Date.now(), value });
      while (cache.size > Math.max(16, Number(cacheMax) || 256)) cache.delete(cache.keys().next().value);
      return value;
    })();
    pending.set(key, load);
    try { return await load; }
    finally { pending.delete(key); }
  }

  return {
    async events({ limit = 12, query = "", view = "trending" } = {}) {
      const take = Math.max(1, Math.min(30, Number(limit) || 12));
      const safeView = ["trending", "new", "ending", "liquid", "crypto", "politics", "sports"].includes(String(view || "").toLowerCase())
        ? String(view).toLowerCase()
        : "trending";
      const categorySearch = { crypto: "crypto", politics: "politics", sports: "sports" }[safeView] || "";
      const search = String(query || categorySearch).trim().slice(0, 80);
      const order = safeView === "new" ? "start_date" : safeView === "ending" ? "end_date" : safeView === "liquid" ? "liquidity" : "volume_24hr";
      const payload = search
        ? await request(GAMMA_BASE, "/public-search", { q: search, limit_per_type: take })
        : await request(GAMMA_BASE, "/events", { active: true, closed: false, limit: take, order, ascending: safeView === "ending" });
      const rows = Array.isArray(payload) ? payload : (Array.isArray(payload?.events) ? payload.events : []);
      return rows
        .filter((event) => event?.active !== false && event?.closed !== true)
        .map(normalizePolymarketEvent)
        .filter((event) => event.markets.length);
    },
    async event(eventId) {
      const id = String(eventId || "").trim();
      if (!/^\d{1,30}$/.test(id)) throw new Error("valid Polymarket event required");
      const payload = await request(GAMMA_BASE, `/events/${id}`);
      const event = normalizePolymarketEvent(payload && typeof payload === "object" ? payload : {});
      if (!event.id || !event.markets.length) throw new Error("Polymarket event not found");
      return event;
    },
    async portfolio(wallet, { openLimit = 100, closedLimit = 50 } = {}) {
      const user = polymarketWalletAddress(wallet);
      if (!user) throw new Error("valid Polygon wallet required");
      const [open, closed] = await Promise.all([
        request(DATA_BASE, "/positions", { user, limit: Math.max(1, Math.min(500, openLimit)) }),
        request(DATA_BASE, "/closed-positions", { user, limit: Math.max(1, Math.min(500, closedLimit)) })
      ]);
      return { wallet: user, ...summarizePolymarketPortfolio(Array.isArray(open) ? open : [], Array.isArray(closed) ? closed : []) };
    }
  };
}
