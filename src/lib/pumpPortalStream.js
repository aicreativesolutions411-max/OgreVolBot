// PumpPortal real-time data stream (free websocket).
//
// One server-side connection to wss://pumpportal.fun/api/data gives us:
//   - subscribeNewToken      -> every pump.fun token creation, sub-second
//   - subscribeMigration     -> bonding-curve graduations
//   - subscribeTokenTrade    -> live trade ticks for mints we care about
//
// The stream replaces "poll pump.fun every 1.5s and hope" as the *first*
// fresh-feed source: creations land in an in-memory buffer the moment they
// happen and are merged into the live-pairs candidate pool. Trades are kept
// in per-mint ring buffers so charts and Ogre A.I. get real momentum data
// (buys/sells/volume in the last seconds, not minutes).
//
// PumpPortal rules honored here:
//   - exactly ONE websocket connection (subscriptions are multiplexed)
//   - unsubscribe trade streams for mints that aged out so we never grow
//     an unbounded subscription set.

const PUMP_VIRTUAL_SOL_START = 30; // pump.fun curve starts ~30 virtual SOL
const PUMP_VIRTUAL_SOL_GRADUATE = 85; // ~85 vSOL when the curve completes

const DEFAULTS = {
  url: "wss://pumpportal.fun/api/data",
  maxCreations: 600,
  creationMaxAgeMs: 60 * 60 * 1000, // keep an hour of creations for the feed
  tradeSubMaxAgeMs: 15 * 60 * 1000, // auto trade-subscription window per new mint
  maxTradeSubs: 90, // hard cap on concurrently subscribed mints
  maxTradesPerMint: 240,
  watchTtlMs: 10 * 60 * 1000, // explicit chart watches expire after 10 min idle
  heartbeatMs: 45_000, // creations flow constantly; silence means dead socket
  reconnectMinMs: 1_000,
  reconnectMaxMs: 30_000
};

export function createPumpPortalStream(options = {}) {
  const config = { ...DEFAULTS, ...options };
  const log = typeof config.log === "function" ? config.log : () => {};
  const getSolUsd = typeof config.getSolUsd === "function" ? config.getSolUsd : () => null;

  let socket = null;
  let started = false;
  let connected = false;
  let reconnectDelayMs = config.reconnectMinMs;
  let reconnectTimer = null;
  let heartbeatTimer = null;
  let lastMessageAt = 0;
  let connectCount = 0;

  const creations = []; // newest first: [{ mint, at, event, lastTrade, migrated }]
  const creationByMint = new Map();
  const tradesByMint = new Map(); // mint -> [{ at, side, solAmount, tokenAmount, priceSol, marketCapSol }]
  const tradeSubs = new Map(); // mint -> { subscribedAt, reason: "creation" | "watch", watchUntil }
  const counters = { creations: 0, trades: 0, migrations: 0, parseErrors: 0 };

  function now() {
    return Date.now();
  }

  function safeSend(payload) {
    if (!socket || socket.readyState !== 1) return false;
    try {
      socket.send(JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  function subscribeTrades(mints) {
    const keys = mints.filter(Boolean);
    if (keys.length) safeSend({ method: "subscribeTokenTrade", keys });
  }

  function unsubscribeTrades(mints) {
    const keys = mints.filter(Boolean);
    if (keys.length) safeSend({ method: "unsubscribeTokenTrade", keys });
  }

  function pruneTradeSubs() {
    const cutoff = now();
    const expired = [];
    for (const [mint, sub] of tradeSubs) {
      const creationExpired = sub.reason === "creation" && cutoff - sub.subscribedAt > config.tradeSubMaxAgeMs;
      const watchExpired = sub.reason === "watch" && cutoff > (sub.watchUntil || 0);
      if (creationExpired && !(sub.watchUntil > cutoff)) expired.push(mint);
      else if (watchExpired && sub.reason === "watch") expired.push(mint);
    }
    // Oldest-first overflow trim so the subscription set stays bounded.
    if (tradeSubs.size - expired.length > config.maxTradeSubs) {
      const candidates = [...tradeSubs.entries()]
        .filter(([mint]) => !expired.includes(mint))
        .sort((a, b) => a[1].subscribedAt - b[1].subscribedAt);
      let overflow = tradeSubs.size - expired.length - config.maxTradeSubs;
      for (const [mint, sub] of candidates) {
        if (overflow <= 0) break;
        if (sub.watchUntil > cutoff) continue; // never drop an active chart watch
        expired.push(mint);
        overflow -= 1;
      }
    }
    if (!expired.length) return;
    for (const mint of expired) {
      tradeSubs.delete(mint);
      tradesByMint.delete(mint);
    }
    unsubscribeTrades(expired);
  }

  function ensureTradeSub(mint, reason, watchTtlMs = 0) {
    if (!mint) return;
    const existing = tradeSubs.get(mint);
    const watchUntil = watchTtlMs > 0 ? now() + watchTtlMs : existing?.watchUntil || 0;
    if (existing) {
      if (watchUntil > (existing.watchUntil || 0)) existing.watchUntil = watchUntil;
      if (reason === "watch") existing.reason = "watch";
      return;
    }
    tradeSubs.set(mint, { subscribedAt: now(), reason, watchUntil });
    subscribeTrades([mint]);
    pruneTradeSubs();
  }

  function pruneCreations() {
    const cutoff = now() - config.creationMaxAgeMs;
    while (creations.length > config.maxCreations || (creations.length && creations[creations.length - 1].at < cutoff)) {
      const removed = creations.pop();
      if (removed) creationByMint.delete(removed.mint);
    }
  }

  function handleCreation(event) {
    const mint = String(event.mint || "").trim();
    if (!mint || creationByMint.has(mint)) return;
    const entry = {
      mint,
      at: now(),
      event,
      lastTrade: null,
      migrated: false
    };
    creations.unshift(entry);
    creationByMint.set(mint, entry);
    counters.creations += 1;
    pruneCreations();
    ensureTradeSub(mint, "creation");
    if (typeof config.onCreation === "function") {
      try {
        config.onCreation(entry);
      } catch {}
    }
  }

  function handleTrade(event) {
    const mint = String(event.mint || "").trim();
    if (!mint) return;
    const solAmount = Number(event.solAmount) || 0;
    const tokenAmount = Number(event.tokenAmount) || 0;
    const trade = {
      at: now(),
      side: String(event.txType || "").toLowerCase() === "sell" ? "sell" : "buy",
      solAmount,
      tokenAmount,
      priceSol: tokenAmount > 0 ? solAmount / tokenAmount : null,
      marketCapSol: Number(event.marketCapSol) || null,
      vSolInBondingCurve: Number(event.vSolInBondingCurve) || null,
      trader: String(event.traderPublicKey || "")
    };
    let list = tradesByMint.get(mint);
    if (!list) {
      // Only track trades for mints we deliberately subscribed; stray events
      // for unsubscribed mints (race after unsubscribe) are dropped.
      if (!tradeSubs.has(mint)) return;
      list = [];
      tradesByMint.set(mint, list);
    }
    list.unshift(trade);
    if (list.length > config.maxTradesPerMint) list.length = config.maxTradesPerMint;
    counters.trades += 1;
    const creation = creationByMint.get(mint);
    if (creation) creation.lastTrade = trade;
    if (typeof config.onTrade === "function") {
      try {
        config.onTrade(mint, trade);
      } catch {}
    }
  }

  function handleMigration(event) {
    const mint = String(event.mint || "").trim();
    if (!mint) return;
    counters.migrations += 1;
    const creation = creationByMint.get(mint);
    if (creation) creation.migrated = true;
  }

  function handleMessage(raw) {
    lastMessageAt = now();
    let data;
    try {
      data = JSON.parse(typeof raw === "string" ? raw : raw.toString());
    } catch {
      counters.parseErrors += 1;
      return;
    }
    if (!data || typeof data !== "object") return;
    const txType = String(data.txType || "").toLowerCase();
    if (txType === "create") handleCreation(data);
    else if (txType === "buy" || txType === "sell") handleTrade(data);
    else if (txType === "migrate" || txType === "migration") handleMigration(data);
    // anything else (subscription acks, errors) is informational only
  }

  function scheduleReconnect() {
    if (!started || reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void connect();
    }, reconnectDelayMs);
    if (reconnectTimer.unref) reconnectTimer.unref();
    reconnectDelayMs = Math.min(config.reconnectMaxMs, Math.round(reconnectDelayMs * 1.8));
  }

  function startHeartbeat() {
    stopHeartbeat();
    heartbeatTimer = setInterval(() => {
      if (!connected) return;
      if (now() - lastMessageAt > config.heartbeatMs) {
        log(`PumpPortal stream silent for ${Math.round((now() - lastMessageAt) / 1000)}s; reconnecting.`);
        try {
          socket?.close();
        } catch {}
      }
    }, Math.max(5_000, Math.round(config.heartbeatMs / 3)));
    if (heartbeatTimer.unref) heartbeatTimer.unref();
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  async function resolveWebSocketCtor() {
    if (typeof globalThis.WebSocket === "function") return globalThis.WebSocket;
    const mod = await import("ws").catch(() => null);
    return mod?.WebSocket || mod?.default || null;
  }

  async function connect() {
    if (!started) return;
    const Ctor = await resolveWebSocketCtor();
    if (!Ctor) {
      log("PumpPortal stream disabled: no WebSocket implementation available (need Node >=22 or the 'ws' package).");
      started = false;
      return;
    }
    try {
      socket = new Ctor(config.url);
    } catch (error) {
      log(`PumpPortal stream connect error: ${error.message}`);
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      connected = true;
      connectCount += 1;
      reconnectDelayMs = config.reconnectMinMs;
      lastMessageAt = now();
      safeSend({ method: "subscribeNewToken" });
      safeSend({ method: "subscribeMigration" });
      const resubscribe = [...tradeSubs.keys()];
      if (resubscribe.length) subscribeTrades(resubscribe);
      startHeartbeat();
      log(`PumpPortal stream connected (#${connectCount}).`);
    };
    socket.onmessage = (messageEvent) => handleMessage(messageEvent.data);
    socket.onerror = () => {
      // onclose always follows; reconnect is handled there.
    };
    socket.onclose = () => {
      connected = false;
      stopHeartbeat();
      socket = null;
      if (started) scheduleReconnect();
    };
  }

  function tradeStatsForMint(mint, windowMs = 5 * 60 * 1000) {
    const list = tradesByMint.get(mint) || [];
    const cutoff = now() - windowMs;
    let buys = 0;
    let sells = 0;
    let volumeSol = 0;
    for (const trade of list) {
      if (trade.at < cutoff) break; // newest-first list
      if (trade.side === "buy") buys += 1;
      else sells += 1;
      volumeSol += trade.solAmount;
    }
    return { buys, sells, volumeSol, total: buys + sells };
  }

  function creationCandidates({ maxAgeMs = config.creationMaxAgeMs, limit = 120 } = {}) {
    pruneCreations();
    const cutoff = now() - maxAgeMs;
    const solUsd = Number(getSolUsd()) || null;
    const rows = [];
    for (const entry of creations) {
      if (entry.at < cutoff) break;
      if (rows.length >= limit) break;
      const event = entry.event;
      const latest = entry.lastTrade;
      const marketCapSol = Number(latest?.marketCapSol) || Number(event.marketCapSol) || null;
      const vSol = Number(latest?.vSolInBondingCurve) || Number(event.vSolInBondingCurve) || null;
      const stats5m = tradeStatsForMint(entry.mint);
      // The dev's initial buy ships inside the creation event, not as a trade
      // tick - count it so seconds-old tokens show their real starting volume.
      const initialBuySol = Number(event.solAmount) || 0;
      const ageMs = now() - entry.at;
      if (initialBuySol > 0 && ageMs < 5 * 60 * 1000) {
        stats5m.buys += 1;
        stats5m.total += 1;
        stats5m.volumeSol += initialBuySol;
      }
      const progressPct = vSol
        ? Math.max(0, Math.min(100, ((vSol - PUMP_VIRTUAL_SOL_START) / (PUMP_VIRTUAL_SOL_GRADUATE - PUMP_VIRTUAL_SOL_START)) * 100))
        : 0;
      rows.push({
        tokenMint: entry.mint,
        source: "pumpportal-ws",
        profile: {
          symbol: String(event.symbol || ""),
          name: String(event.name || ""),
          description: "",
          metadataUri: String(event.uri || ""),
          pairCreatedAt: entry.at,
          marketCap: marketCapSol && solUsd ? marketCapSol * solUsd : null,
          marketCapSol,
          liquidityUsd: vSol && solUsd ? vSol * solUsd : null,
          volume5m: solUsd ? stats5m.volumeSol * solUsd : null,
          volume: { m5: solUsd ? stats5m.volumeSol * solUsd : null },
          txns: { m5: { buys: stats5m.buys, sells: stats5m.sells } },
          bondingProgressPct: progressPct,
          graduated: entry.migrated,
          isGraduated: entry.migrated,
          pumpCurve: true,
          devWallet: String(event.traderPublicKey || ""),
          initialBuySol: Number(event.solAmount) || 0,
          pool: String(event.pool || "pump"),
          realtime: true
        }
      });
    }
    return rows;
  }

  return {
    start() {
      if (started) return;
      started = true;
      void connect();
    },
    stop() {
      started = false;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      stopHeartbeat();
      try {
        socket?.close();
      } catch {}
      socket = null;
      connected = false;
    },
    isConnected() {
      return connected;
    },
    watchMint(mint, ttlMs = config.watchTtlMs) {
      ensureTradeSub(String(mint || "").trim(), "watch", ttlMs);
    },
    getTrades(mint, { limit = 120 } = {}) {
      const list = tradesByMint.get(String(mint || "").trim()) || [];
      return list.slice(0, limit);
    },
    tradeStatsForMint,
    getCreationCandidates: creationCandidates,
    getCreationEntry(mint) {
      return creationByMint.get(String(mint || "").trim()) || null;
    },
    stats() {
      return {
        connected,
        connectCount,
        lastMessageAgoMs: lastMessageAt ? now() - lastMessageAt : null,
        creationsBuffered: creations.length,
        tradeSubscriptions: tradeSubs.size,
        mintsWithTrades: tradesByMint.size,
        counters: { ...counters }
      };
    }
  };
}
