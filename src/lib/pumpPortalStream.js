// PumpPortal real-time data stream. Creations/migrations are free; token-trade
// subscriptions are optional and require an authenticated funded provider key.
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
  reconnectMaxMs: 30_000,
  tradeStreamEnabled: false,
  autoSubscribeCreationTrades: false,
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
  let connectionEpoch = 0;
  let tradeStreamAuthorization = config.tradeStreamEnabled ? "pending" : "disabled";
  let currentSubscriptionErrors = 0;

  const creations = []; // newest first: [{ mint, at, event, lastTrade, migrated }]
  const creationByMint = new Map();
  const tradesByMint = new Map(); // mint -> [{ at, side, solAmount, tokenAmount, priceSol, marketCapSol }]
  // Subscription ownership is additive: a Buy Bot mint can simultaneously be an active chart watch.
  // Never let a temporary watch TTL erase a persistent group subscription.
  const tradeSubs = new Map(); // mint -> { subscribedAt, groupTracked, creationUntil, watchUntil }
  const sentTradeSubs = new Set(); // exact provider-side subscription target for this connection
  const counters = { creations: 0, trades: 0, migrations: 0, parseErrors: 0, subscriptionErrors: 0 };
  let lastProviderError = "";

  function now() {
    return Date.now();
  }

  function safeProviderText(value) {
    return String(value || "")
      .replace(/([?&]api-key=)[^&\s]+/ig, "$1[redacted]")
      .replace(/(api[-_ ]?key\s*[:=]\s*)["']?[^\s,"'}]+/ig, "$1[redacted]")
      .replace(/(authorization\s*[:=]\s*(?:bearer\s+)?)["']?[^\s,"'}]+/ig, "$1[redacted]")
      .replace(/(bearer\s+)[a-z0-9._~+\/-]+/ig, "$1[redacted]")
      .slice(0, 240);
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
    if (!config.tradeStreamEnabled) return false;
    const keys = mints.filter(Boolean);
    return keys.length ? safeSend({ method: "subscribeTokenTrade", keys }) : false;
  }

  function unsubscribeTrades(mints) {
    if (!config.tradeStreamEnabled) return false;
    const keys = mints.filter(Boolean);
    return keys.length ? safeSend({ method: "unsubscribeTokenTrade", keys }) : false;
  }

  function desiredTradeTargets() {
    const cutoff = now();
    return [...tradeSubs.entries()]
      .filter(([, sub]) => sub.groupTracked || sub.watchUntil > cutoff || sub.creationUntil > cutoff)
      .sort((a, b) => {
        const aRank = a[1].watchUntil > cutoff ? 2 : a[1].groupTracked ? 1 : 0;
        const bRank = b[1].watchUntil > cutoff ? 2 : b[1].groupTracked ? 1 : 0;
        return bRank - aRank || b[1].subscribedAt - a[1].subscribedAt;
      })
      .slice(0, Math.max(1, Number(config.maxTradeSubs) || 1))
      .map(([mint]) => mint);
  }

  function reconcileTradeSubscriptions({ connectionOpened = false } = {}) {
    if (!config.tradeStreamEnabled || !connected || tradeStreamAuthorization === "rejected") {
      sentTradeSubs.clear();
      return;
    }
    const desired = new Set(desiredTradeTargets());
    if (connectionOpened) sentTradeSubs.clear();
    const remove = [...sentTradeSubs].filter((mint) => !desired.has(mint));
    const add = [...desired].filter((mint) => !sentTradeSubs.has(mint));
    if (remove.length && unsubscribeTrades(remove)) for (const mint of remove) sentTradeSubs.delete(mint);
    if (add.length && subscribeTrades(add)) for (const mint of add) sentTradeSubs.add(mint);
  }

  function pruneTradeSubs() {
    const cutoff = now();
    const expired = [];
    for (const [mint, sub] of tradeSubs) {
      if (sub.creationUntil > 0 && cutoff >= sub.creationUntil) sub.creationUntil = 0;
      if (sub.watchUntil > 0 && cutoff >= sub.watchUntil) sub.watchUntil = 0;
      if (!sub.groupTracked && !(sub.creationUntil > cutoff) && !(sub.watchUntil > cutoff)) expired.push(mint);
    }
    // Oldest-first overflow trim so the subscription set stays bounded.
    if (tradeSubs.size - expired.length > config.maxTradeSubs) {
      const candidates = [...tradeSubs.entries()]
        .filter(([mint]) => !expired.includes(mint))
        .sort((a, b) => a[1].subscribedAt - b[1].subscribedAt);
      let overflow = tradeSubs.size - expired.length - config.maxTradeSubs;
      for (const [mint, sub] of candidates) {
        if (overflow <= 0) break;
        if (sub.groupTracked || sub.watchUntil > cutoff) continue; // never drop a Buy Bot or active chart watch
        expired.push(mint);
        overflow -= 1;
      }
    }
    if (!expired.length) return;
    for (const mint of expired) {
      tradeSubs.delete(mint);
      tradesByMint.delete(mint);
    }
    reconcileTradeSubscriptions();
  }

  function ensureTradeSub(mint, reason, watchTtlMs = 0) {
    if (!mint) return;
    const at = now();
    const existing = tradeSubs.get(mint);
    const sub = existing || {
      subscribedAt: at,
      groupTracked: false,
      creationUntil: 0,
      watchUntil: 0,
    };
    if (reason === "group") sub.groupTracked = true;
    if (reason === "creation") sub.creationUntil = Math.max(sub.creationUntil || 0, at + config.tradeSubMaxAgeMs);
    if (reason === "watch") sub.watchUntil = Math.max(sub.watchUntil || 0, at + Math.max(0, Number(watchTtlMs) || 0));
    tradeSubs.set(mint, sub);
    pruneTradeSubs();
    reconcileTradeSubscriptions();
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
    if (config.autoSubscribeCreationTrades) ensureTradeSub(mint, "creation");
    if (typeof config.onCreation === "function") {
      try {
        config.onCreation(entry);
      } catch {}
    }
  }

  function handleTrade(event) {
    const mint = String(event.mint || "").trim();
    if (!mint || !sentTradeSubs.has(mint)) return false;
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
        config.onTrade(mint, trade, event);
      } catch {}
    }
    return true;
  }

  function handleMigration(event) {
    const mint = String(event.mint || "").trim();
    if (!mint) return;
    counters.migrations += 1;
    const creation = creationByMint.get(mint);
    if (creation) creation.migrated = true;
    if (typeof config.onMigration === "function") {
      try {
        config.onMigration({ mint, at: now(), event });
      } catch {}
    }
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
    const message = typeof data.message === "string" ? data.message.trim() : "";
    const messageIsError = /(?:error|failed|forbidden|unauthori[sz]ed|invalid api|requires?|only available|must be funded|not funded|denied)/i.test(message);
    if (data.error || data.errors || messageIsError) {
      counters.subscriptionErrors += 1;
      currentSubscriptionErrors += 1;
      let providerError = data.error || data.errors || message || "PumpPortal subscription rejected";
      if (typeof providerError !== "string") {
        try { providerError = JSON.stringify(providerError); } catch { providerError = String(providerError); }
      }
      lastProviderError = safeProviderText(providerError);
      const tradeAuthError = config.tradeStreamEnabled && /(?:subscribeTokenTrade|token.?trade|account.?trade|api.?key|funded wallet|funded.*SOL|unauthori[sz]ed|forbidden)/i.test(String(providerError));
      if (tradeAuthError) {
        tradeStreamAuthorization = "rejected";
        sentTradeSubs.clear();
      }
      if (typeof config.onProviderError === "function") {
        try { config.onProviderError(lastProviderError); } catch {}
      }
      return;
    }
    if (config.tradeStreamEnabled && message && /success(?:fully)?\s+subscrib|subscrib(?:ed|ption).*success/i.test(message) && /trad/i.test(message)) {
      tradeStreamAuthorization = "authorized";
    }
    const txType = String(data.txType || "").toLowerCase();
    if (txType === "create") handleCreation(data);
    else if (txType === "buy" || txType === "sell") {
      if (handleTrade(data) && config.tradeStreamEnabled) tradeStreamAuthorization = "authorized";
    }
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
    const epoch = connectionEpoch;
    const Ctor = await resolveWebSocketCtor();
    if (!started || epoch !== connectionEpoch) return;
    if (!Ctor) {
      log("PumpPortal stream disabled: no WebSocket implementation available (need Node >=22 or the 'ws' package).");
      started = false;
      return;
    }
    try {
      socket = new Ctor(config.url);
    } catch (error) {
      log(`PumpPortal stream connect error: ${safeProviderText(error?.message || error)}`);
      scheduleReconnect();
      return;
    }

    const activeSocket = socket;
    activeSocket.onopen = () => {
      if (!started || epoch !== connectionEpoch || socket !== activeSocket) {
        try { activeSocket.close(); } catch {}
        return;
      }
      connected = true;
      connectCount += 1;
      reconnectDelayMs = config.reconnectMinMs;
      lastMessageAt = now();
      currentSubscriptionErrors = 0;
      lastProviderError = "";
      tradeStreamAuthorization = config.tradeStreamEnabled ? "pending" : "disabled";
      safeSend({ method: "subscribeNewToken" });
      safeSend({ method: "subscribeMigration" });
      reconcileTradeSubscriptions({ connectionOpened: true });
      startHeartbeat();
      log(`PumpPortal stream connected (#${connectCount}).`);
    };
    activeSocket.onmessage = (messageEvent) => {
      if (socket === activeSocket && epoch === connectionEpoch) handleMessage(messageEvent.data);
    };
    activeSocket.onerror = () => {
      // onclose always follows; reconnect is handled there.
    };
    activeSocket.onclose = () => {
      if (socket !== activeSocket || epoch !== connectionEpoch) return;
      connected = false;
      stopHeartbeat();
      sentTradeSubs.clear();
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
      // Resolve this coin's socials once from its metadata JSON (creation `uri`), then cache on the
      // entry so every future candidate carries X/Telegram/Website. Fire-and-forget; fills next poll.
      if (!entry.socials && event.uri && typeof config.resolveCreationSocials === "function") {
        entry.socialsPending = entry.socialsPending || Promise.resolve(config.resolveCreationSocials(entry.mint, String(event.uri)))
          .then((soc) => { entry.socials = soc || {}; })
          .catch(() => { entry.socials = {}; });
      }
      const socials = entry.socials || {};
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
          twitterUrl: socials.twitterUrl || "",
          telegramUrl: socials.telegramUrl || "",
          websiteUrl: socials.websiteUrl || "",
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
      connectionEpoch += 1;
      void connect();
    },
    stop() {
      started = false;
      connectionEpoch += 1;
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
      sentTradeSubs.clear();
    },
    isConnected() {
      return connected;
    },
    watchMint(mint, ttlMs = config.watchTtlMs) {
      ensureTradeSub(String(mint || "").trim(), "watch", ttlMs);
    },
    syncTrackedMints(mints = []) {
      const wanted = new Set((Array.isArray(mints) ? mints : []).map((mint) => String(mint || "").trim()).filter(Boolean));
      for (const [mint, sub] of tradeSubs) {
        if (sub.groupTracked && !wanted.has(mint)) sub.groupTracked = false;
      }
      for (const mint of wanted) ensureTradeSub(mint, "group");
      pruneTradeSubs();
      reconcileTradeSubscriptions();
      return {
        wanted: wanted.size,
        active: config.tradeStreamEnabled ? sentTradeSubs.size : 0,
        desired: tradeSubs.size,
        enabled: Boolean(config.tradeStreamEnabled),
      };
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
        tradeStreamEnabled: Boolean(config.tradeStreamEnabled),
        tradeStreamAuthorized: tradeStreamAuthorization === "authorized",
        tradeStreamAuthorization,
        currentSubscriptionErrors,
        lastProviderError: lastProviderError || null,
        connectCount,
        lastMessageAgoMs: lastMessageAt ? now() - lastMessageAt : null,
        creationsBuffered: creations.length,
        tradeSubscriptions: config.tradeStreamEnabled ? sentTradeSubs.size : 0,
        desiredTradeSubscriptions: tradeSubs.size,
        mintsWithTrades: tradesByMint.size,
        counters: { ...counters }
      };
    }
  };
}
