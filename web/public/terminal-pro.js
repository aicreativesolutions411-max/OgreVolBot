(function () {
  "use strict";

  const TIMEFRAMES = [
    ["1s", "1s"], ["15s", "15s"], ["30s", "30s"], ["1m", "1m"],
    ["15m", "15m"], ["1h", "1h"], ["4h", "4h"], ["12h", "12h"], ["1d", "1D"]
  ];
  const MICRO = new Set(["1s", "15s", "30s"]);
  const API_BASE = ((window.OGRE_PORTAL_CONFIG && window.OGRE_PORTAL_CONFIG.apiBase) || "https://app.slimewire.org").replace(/\/+$/, "");
  const TOKEN_KEY = "ogreWebToken";
  const ACTIVE_WALLET_KEY = "slimecashActiveWalletIndex";
  const TOOL_PREFILL_KEY = "ggToolPrefill";
  const PUMP_CASHBACK_POSITIVE_TTL_MS = 30_000;
  const PUMP_CASHBACK_RETRY_TTL_MS = 8_000;
  const pumpCashbackRefreshTimers = new WeakMap();
  let pumpCashbackAuthToken = null;
  let pumpCashbackAuthVersion = 0;

  const one = (selector, root) => (root || document).querySelector(selector);
  const all = (selector, root) => Array.from((root || document).querySelectorAll(selector));
  const escapeHtml = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const isRobinhood = (value) => /^0x[0-9a-f]{40}$/i.test(String(value || ""));
  const short = (value) => { const text = String(value || ""); return text.length > 12 ? `${text.slice(0, 6)}…${text.slice(-4)}` : text; };

  function currentContext(trade) {
    const raw = decodeURIComponent((location.hash.split("/").slice(1).join("/") || "").trim());
    const rh = trade && (trade.closest("#v-rhtrade") || isRobinhood(raw));
    const visibleSymbol = String((one(rh ? "#rhTvSym" : "#thead .ti b") || {}).textContent || "").trim();
    const symbol = visibleSymbol && visibleSymbol !== "?" ? visibleSymbol : short(raw);
    return { token: raw, rh: Boolean(rh), symbol };
  }

  function nativeChartUrl(context, timeframe, pool) {
    const query = new URLSearchParams({ ca: context.token, tf: timeframe, embed: "1", cv: "6", sym: context.symbol || "" });
    if (pool) query.set("pool", pool);
    return `/chart-lab?${query.toString()}`;
  }

  function standardChartUrl(context, timeframe, pool, existing) {
    const interval = ({ "1m": "1", "15m": "15", "1h": "60", "4h": "240", "12h": "720", "1d": "1D" })[timeframe] || "15";
    const existingUrl = String(existing || "").trim();
    const resolvedExternal = /^https?:\/\//i.test(existingUrl) && !/\/chart-lab/i.test(existingUrl);
    const poolCandidate = String(pool || "").trim();
    const validPool = context.rh
      ? /^0x[0-9a-f]{40}$/i.test(poolCandidate) && poolCandidate.toLowerCase() !== String(context.token || "").toLowerCase()
      : /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(poolCandidate) && poolCandidate !== String(context.token || "");
    const address = validPool ? poolCandidate : "";
    // External charts require a real pool address. Never send a token mint through
    // a provider's pool route: that produces misleading one-candle/404 frames. The
    // native Slime chart remains visible until the exact-pool resolver completes.
    let value = existingUrl;
    if (!/^https?:\/\//i.test(value) || /\/chart-lab/i.test(value)) {
      if (!address) return nativeChartUrl(context, timeframe, pool);
      const network = context.rh ? "robinhood" : "solana";
      if (context.rh && address) {
        value = `https://dexscreener.com/${network}/${encodeURIComponent(address)}?embed=1&theme=dark&trades=0&info=0`;
      } else {
        value = `https://www.geckoterminal.com/${network}/pools/${encodeURIComponent(address)}?embed=1&info=0&swaps=0&grayscale=0&light_chart=0&chart_type=price`;
      }
    }
    try {
      const url = new URL(value, location.origin);
      if (/geckoterminal\.com$/i.test(url.hostname)) url.searchParams.set("resolution", timeframe);
      else if (/dexscreener\.com$/i.test(url.hostname)) url.searchParams.set("interval", interval);
      return url.toString();
    } catch (_) { return value; }
  }

  function poolFromUrl(value) {
    try {
      const url = new URL(value, location.origin);
      if (/geckoterminal\.com$/i.test(url.hostname)) return (url.pathname.match(/\/pools\/([^/?#]+)/i) || [])[1] || "";
      if (/dexscreener\.com$/i.test(url.hostname)) return url.pathname.split("/").filter(Boolean).pop() || "";
      return url.searchParams.get("pool") || "";
    } catch (_) { return ""; }
  }

  function inferTimeframe(frame) {
    try {
      const url = new URL(frame.src, location.origin);
      return url.searchParams.get("tf") || url.searchParams.get("resolution") || ({ "1": "1m", "15": "15m", "60": "1h", "240": "4h", "720": "12h", "1D": "1d" }[url.searchParams.get("interval")]) || "15m";
    } catch (_) { return "15m"; }
  }

  function paintTimeframeButtons(toolbar, timeframe) {
    all("[data-pro-tf]", toolbar).forEach((button) => button.classList.toggle("on", button.dataset.proTf === timeframe));
  }

  function paintChartMode(trade, slimeMode, microMode) {
    const chart = one(".chartwrap", trade), toolbar = one(".chartProBar", trade), button = one("[data-pro-slime-mode]", toolbar);
    const nativeVisible = Boolean(slimeMode || microMode);
    trade.dataset.proChartMode = slimeMode ? "slime" : "pro";
    chart?.classList.toggle("proSlimeChart", nativeVisible);
    if (button) {
      button.classList.toggle("on", slimeMode);
      button.setAttribute("aria-pressed", slimeMode ? "true" : "false");
      button.title = slimeMode ? "Return to the professional DEX chart" : "Open the SlimeWire native chart";
    }
    let mark = chart && one(".proSlimeWatermark", chart);
    if (nativeVisible && chart && !mark) {
      mark = document.createElement("button");
      mark.type = "button";
      mark.className = "proSlimeWatermark";
      mark.innerHTML = '<img src="/assets/slimewire/svg/slimewire-mark.svg" alt=""><span>TERMINAL HOME</span>';
      mark.addEventListener("click", () => activateChartHome(trade));
      chart.appendChild(mark);
    } else if (!nativeVisible && mark) mark.remove();
    refreshChartHomeButton(trade);
  }

  function chartIsFocused(trade) {
    return document.fullscreenElement === trade || trade.classList.contains("proFullscreen") || trade.classList.contains("proWide");
  }

  function refreshChartHomeButton(trade) {
    const button = one(".proSlimeWatermark", trade);
    if (!button) return;
    const focused = chartIsFocused(trade);
    const text = one("span", button);
    if (text) text.textContent = focused ? "EXIT CHART" : "TERMINAL HOME";
    button.setAttribute("aria-label", focused ? "Exit the expanded chart and return to the terminal" : "Return to the SlimeWire terminal home");
    button.title = focused ? "Exit chart view" : "Back to terminal home";
  }

  function refreshChartFocusControls(trade) {
    const wide = one("[data-pro-wide]", trade), full = one("[data-pro-full]", trade);
    const wideOpen = trade.classList.contains("proWide"), fullscreenOpen = document.fullscreenElement === trade || trade.classList.contains("proFullscreen");
    if (wide) {
      wide.textContent = wideOpen ? "↔ Show trade panel" : "↔ Wider chart";
      wide.setAttribute("aria-pressed", wideOpen ? "true" : "false");
      wide.setAttribute("aria-label", wideOpen ? "Show the trade panel beside the chart" : "Hide the trade panel for a wider chart");
      wide.title = wideOpen ? "Restore the buy and sell panel" : "Give the chart more horizontal room";
    }
    if (full) {
      full.textContent = fullscreenOpen ? "⛶ Exit fullscreen" : "⛶ Fullscreen";
      full.setAttribute("aria-pressed", fullscreenOpen ? "true" : "false");
      full.setAttribute("aria-label", fullscreenOpen ? "Exit fullscreen chart" : "Open fullscreen chart");
      full.title = fullscreenOpen ? "Return to the terminal" : "Fill the screen with the chart";
    }
    refreshChartHomeButton(trade);
  }

  function refreshTradeContext(trade) {
    const panel = one(".proQuickPanel", trade), action = one("[data-pro-execute]", panel);
    if (!panel || !action) return;
    const context = currentContext(trade), side = panel.dataset.side === "sell" ? "Sell" : "Buy";
    action.textContent = `${side} ${context.symbol}`;
  }

  async function activateChartHome(trade) {
    if (chartIsFocused(trade)) {
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      trade.classList.remove("proFullscreen", "proWide");
      document.body.classList.remove("proNoScroll");
      refreshChartFocusControls(trade);
      trade.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (window.GG?.go) window.GG.go("trending");
    else location.hash = "#trending";
  }

  function setChartMode(trade, mode) {
    const context = currentContext(trade), chart = one(".chartwrap", trade), frame = chart && one("iframe", chart), toolbar = one(".chartProBar", trade);
    if (!chart || !frame || !context.token) return;
    const slimeMode = mode === "slime", timeframe = trade.dataset.proTf || inferTimeframe(frame) || "15m", pool = poolFromUrl(frame.src) || poolFromUrl(chart.dataset.proStandardSrc || "") || chart.dataset.poolAddress || "";
    if (!chart.dataset.proStandardSrc || /\/chart-lab/i.test(chart.dataset.proStandardSrc)) {
      chart.dataset.proStandardSrc = standardChartUrl(context, timeframe, pool, chart.dataset.proStandardSrc || "");
    }
    const next = slimeMode
      ? nativeChartUrl(context, timeframe, pool)
      : MICRO.has(timeframe)
        ? nativeChartUrl(context, timeframe, pool)
        : standardChartUrl(context, timeframe, pool, chart.dataset.proStandardSrc);
    const replacement = frame.cloneNode(false);
    replacement.src = next;
    replacement.loading = "eager";
    frame.replaceWith(replacement);
    paintChartMode(trade, slimeMode, MICRO.has(timeframe) || /\/chart-lab/i.test(next));
    if (toolbar) paintTimeframeButtons(toolbar, timeframe);
  }

  function setTimeframe(trade, timeframe) {
    if (!TIMEFRAMES.some(([value]) => value === timeframe)) return;
    const context = currentContext(trade), chart = one(".chartwrap", trade), frame = chart && one("iframe", chart), toolbar = one(".chartProBar", trade);
    if (!chart || !context.token) return;
    if (!frame) {
      trade.dataset.proTf = timeframe;
      localStorage.setItem(context.rh ? "ggRhChartTf" : "ggSolChartTf", timeframe);
      if (toolbar) paintTimeframeButtons(toolbar, timeframe);
      document.dispatchEvent(new CustomEvent("slimewire:pro-timeframe", { detail: { timeframe, token: context.token } }));
      return;
    }
    const slimeMode = trade.dataset.proChartMode === "slime";
    if (!chart.dataset.proStandardSrc && !/\/chart-lab/i.test(frame.src)) chart.dataset.proStandardSrc = frame.src;
    const pool = poolFromUrl(frame.src) || poolFromUrl(chart.dataset.proStandardSrc || "");
    if (!chart.dataset.proStandardSrc || /\/chart-lab/i.test(chart.dataset.proStandardSrc)) chart.dataset.proStandardSrc = standardChartUrl(context, timeframe, pool, chart.dataset.proStandardSrc || "");
    const next = slimeMode || MICRO.has(timeframe)
      ? nativeChartUrl(context, timeframe, pool)
      : standardChartUrl(context, timeframe, pool, chart.dataset.proStandardSrc);
    const replacement = frame.cloneNode(false);
    replacement.src = next;
    replacement.loading = "eager";
    frame.replaceWith(replacement);
    trade.dataset.proTf = timeframe;
    localStorage.setItem(context.rh ? "ggRhChartTf" : "ggSolChartTf", timeframe);
    if (toolbar) paintTimeframeButtons(toolbar, timeframe);
    paintChartMode(trade, slimeMode, MICRO.has(timeframe) || /\/chart-lab/i.test(next));
    document.dispatchEvent(new CustomEvent("slimewire:pro-timeframe", { detail: { timeframe, token: context.token } }));
  }

  function setSide(trade, side) {
    const context = currentContext(trade), buy = one(context.rh ? "#rhSideBuy" : "#sideBuy"), sell = one(context.rh ? "#rhSideSell" : "#sideSell");
    (side === "sell" ? sell : buy)?.click();
    const panel = one(".proQuickPanel", trade);
    if (!panel) return;
    panel.dataset.side = side;
    one("[data-pro-side='buy']", panel)?.classList.toggle("on", side === "buy");
    one("[data-pro-side='sell']", panel)?.classList.toggle("on", side === "sell");
    one(".proPresetGrid.buy", panel).hidden = side !== "buy";
    one(".proPresetGrid.sell", panel).hidden = side !== "sell";
    const input = one("[data-pro-amount]", panel), unit = one("[data-pro-unit]", panel), action = one("[data-pro-execute]", panel);
    if (input) input.value = side === "sell" ? "100" : "0.1";
    if (unit) unit.textContent = side === "sell" ? "%" : "SOL";
    if (action) { action.classList.toggle("sell", side === "sell"); action.textContent = `${side === "sell" ? "Sell" : "Buy"} ${context.symbol}`; }
  }

  function executeQuick(trade) {
    const context = currentContext(trade), panel = one(".proQuickPanel", trade), side = panel?.dataset.side === "sell" ? "sell" : "buy", value = Number(one("[data-pro-amount]", panel)?.value || 0);
    if (!(value > 0)) { window.GG?.toast?.("Enter a valid amount", true); return; }
    setSide(trade, side);
    const input = one(context.rh ? "#rhTmAmt" : "#amt");
    if (!input) return;
    input.value = String(value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    one(context.rh ? "#rhTmBuy" : "#bigbuy")?.click();
  }

  function applyProfile(trade, index) {
    const context = currentContext(trade), panel = one(".proQuickPanel", trade);
    all("[data-pro-profile]", panel).forEach((button) => button.classList.toggle("on", Number(button.dataset.proProfile) === index));
    if (context.rh) {
      let values = ["0.1", "0.5", "1"];
      try { const parsed = JSON.parse(localStorage.getItem("ggRhPresets") || "null"); if (Array.isArray(parsed) && parsed.length >= 3) values = parsed; } catch (_) {}
      setSide(trade, "buy");
      const input = one("[data-pro-amount]", panel); if (input) input.value = String(values[index] || values[0]);
      return;
    }
    const select = one("#presetSel"), options = select ? Array.from(select.options).filter((option) => option.value) : [];
    if (options[index]) { select.value = options[index].value; select.dispatchEvent(new Event("change", { bubbles: true })); }
    setSide(trade, "buy");
    const amount = one("#amt")?.value, input = one("[data-pro-amount]", panel); if (input && Number(amount) > 0) input.value = amount;
  }

  function openTool(trade, kind) {
    const context = currentContext(trade);
    if (kind === "orders") { openMarketOrders(trade); return; }
    if (kind === "exits") { context.rh ? window.GG?.rhGuardModal?.(context.token) : window.GG?.armPos?.(context.token, context.symbol); return; }
    if (kind === "presets") { context.rh ? window.GG?.rhPresetModal?.() : window.GG?.go?.("wallet"); return; }
    if (kind === "safety") { one(context.rh ? "#rhSafety" : "#secbox")?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    if (context.rh) {
      if (kind === "bundle") window.GG?.rhBundleModal?.(context.token);
      if (kind === "volume") window.GG?.rhVolumeModal?.(context.token);
      return;
    }
    localStorage.setItem(TOOL_PREFILL_KEY, context.token);
    window.GG?.go?.(kind);
  }

  function quickPanelHtml(context) {
    const buyAmounts = ["0.1", "0.5", "1", "2"];
    return `<section class="proQuickPanel" data-side="buy" aria-label="Quick trade panel">
      <div class="proQuickHead"><button class="proWallet" type="button" data-pro-wallet><i class="dot"></i><span>Active wallet · pays with SOL</span></button><div class="proProfiles">${[0, 1, 2].map((i) => `<button type="button" data-pro-profile="${i}" title="Quick profile ${i + 1}">P${i + 1}</button>`).join("")}</div><button class="proClose" type="button" data-pro-close aria-label="Close quick trade">×</button></div>
      <div class="proQuickTabs"><button class="buy on" type="button" data-pro-side="buy">Buy</button><button class="sell" type="button" data-pro-side="sell">Sell</button></div>
      <div class="proAmount"><input data-pro-amount inputmode="decimal" value="0.1" aria-label="Quick trade amount"><span data-pro-unit>SOL</span></div>
      <div class="proPresetGrid buy">${buyAmounts.map((value) => `<button type="button" data-pro-quick="buy" data-value="${value}">${value} ◎</button>`).join("")}</div>
      <div class="proPresetGrid sell" hidden>${[25, 50, 75, 100].map((value) => `<button type="button" data-pro-quick="sell" data-value="${value}">${value}%</button>`).join("")}</div>
      <div class="proTradeMeta"><span>◎ SOL funding</span><span>${context.rh ? "RH auto-convert" : "Solana direct"}</span><span>Server-side exits</span></div>
      <button class="proExecute" type="button" data-pro-execute>Buy ${escapeHtml(context.symbol)}</button>
      <div class="proToolsLabel"><span>SlimeWire trade tools</span><span>stay active after close</span></div>
      <div class="proTools"><button type="button" data-pro-tool="orders">⏱ MC Orders</button><button type="button" data-pro-tool="exits">🎯 TP / SL</button><button type="button" data-pro-tool="presets">⚡ Presets</button><button type="button" data-pro-tool="bundle">📦 Bundle</button><button type="button" data-pro-tool="volume">↻ Volume</button><button type="button" data-pro-tool="safety">🛡 Safety</button></div>
      <p class="proPanelNote">Review the amount before submitting. Market-cap orders, ladders, and exits run on SlimeWire servers with the browser closed.</p>
    </section>`;
  }

  function toolbarHtml(active) {
    return `<div class="chartProBar" aria-label="Professional chart controls"><div class="proIntervals">${TIMEFRAMES.map(([value, label]) => `<button type="button" class="${value === active ? "on" : ""}" data-pro-tf="${value}">${label}</button>`).join("")}</div><span class="proCashbackBadge" data-pro-pump-cashback hidden><b><i></i>Pump Cash back</b><small data-pro-pump-cashback-amount hidden></small></span><i class="proDivider"></i><div class="proActions"><button class="proSlime" type="button" data-pro-slime-mode aria-pressed="false"><img src="/assets/slimewire/svg/slimewire-mark.svg" alt=""> Slime Mode</button><button class="proIndicator" type="button" data-indicators-toggle aria-expanded="false" aria-pressed="false">⌁ Indicators</button><button class="proQuick" type="button" data-pro-quick-toggle>⚡ Quick trade</button><button class="proWide" type="button" data-pro-wide>↔ Wider chart</button><button class="proFull" type="button" data-pro-full>⛶ Fullscreen</button></div></div>`;
  }

  function pumpCashbackSolFromRewards(payload, walletIndex) {
    const root = payload?.rewards || payload?.data || payload || {};
    const wallets = Array.isArray(root.wallets) ? root.wallets : [];
    const selected = root.wallet || wallets.find((wallet) => Number(wallet?.walletIndex || wallet?.index) === Number(walletIndex)) || null;
    const cashback = selected?.cashback || root.cashback || root.totals?.cashback || null;
    const solCandidates = [cashback?.totalSol, selected?.cashbackTotalSol, root.cashbackTotalSol, root.totals?.cashbackSol];
    for (const candidate of solCandidates) {
      if (candidate == null || candidate === "") continue;
      const amount = Number(candidate);
      if (Number.isFinite(amount) && amount >= 0) return amount;
    }
    const lamportCandidates = [cashback?.totalLamports, selected?.cashbackTotalLamports, root.cashbackTotalLamports, root.totals?.cashbackLamports];
    for (const candidate of lamportCandidates) {
      if (candidate == null || candidate === "") continue;
      const lamports = Number(candidate);
      if (Number.isFinite(lamports) && lamports >= 0) return lamports / 1e9;
    }
    return null;
  }

  function formatPumpCashbackSol(value) {
    if (value == null || value === "") return "";
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) return "";
    if (amount > 0 && amount < .000001) return "<0.000001";
    return amount.toFixed(6).replace(/\.?0+$/, "") || "0";
  }

  function paintPumpCashbackBadge(trade, enabled, source, claimableSol) {
    const badge = one("[data-pro-pump-cashback]", trade), amount = one("[data-pro-pump-cashback-amount]", badge);
    if (!badge) return;
    badge.hidden = !enabled;
    badge.dataset.source = enabled ? String(source || "pump") : "";
    badge.title = enabled
      ? "Cash back is enabled for this Pump coin. Rewards shown here are wallet-wide, not earned only from this coin."
      : "";
    if (!amount) return;
    const formatted = formatPumpCashbackSol(claimableSol);
    amount.hidden = !enabled || !formatted;
    amount.textContent = formatted ? `active wallet · ${formatted} SOL across Pump Cash back trades` : "";
  }

  function pumpCashbackContextFresh(checkedAt, ttlMs, nowMs = Date.now()) {
    const checked = Number(checkedAt), ttl = Number(ttlMs), now = Number(nowMs);
    const age = now - checked;
    return checked > 0 && ttl > 0 && Number.isFinite(age) && age >= 0 && age < ttl;
  }

  function pumpCashbackWalletContext(authToken, walletIndex) {
    const token = String(authToken || "");
    if (token !== pumpCashbackAuthToken) {
      pumpCashbackAuthToken = token;
      pumpCashbackAuthVersion += 1;
    }
    return token ? `session-${pumpCashbackAuthVersion}-wallet-${walletIndex}` : "guest";
  }

  function schedulePumpCashbackRefresh(trade, delayMs) {
    const oldTimer = pumpCashbackRefreshTimers.get(trade);
    if (oldTimer) clearTimeout(oldTimer);
    const timer = setTimeout(() => {
      pumpCashbackRefreshTimers.delete(trade);
      if (trade?.isConnected) void refreshPumpCashbackContext(trade);
    }, Math.max(1_000, Number(delayMs) || PUMP_CASHBACK_RETRY_TTL_MS));
    pumpCashbackRefreshTimers.set(trade, timer);
  }

  function clearPumpCashbackRefresh(trade) {
    const timer = pumpCashbackRefreshTimers.get(trade);
    if (timer) clearTimeout(timer);
    pumpCashbackRefreshTimers.delete(trade);
  }

  async function pumpCashbackRequest(path, timeoutMs = PUMP_CASHBACK_RETRY_TTL_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(1_000, Number(timeoutMs) || PUMP_CASHBACK_RETRY_TTL_MS));
    try { return await request(path, { signal: controller.signal }); }
    finally { clearTimeout(timer); }
  }

  async function refreshPumpCashbackContext(trade) {
    const context = currentContext(trade), token = String(context.token || "");
    const authToken = localStorage.getItem(TOKEN_KEY) || "";
    const hasSession = Boolean(authToken);
    const walletIndex = Number(localStorage.getItem(ACTIVE_WALLET_KEY)) || 1;
    const walletContext = pumpCashbackWalletContext(authToken, walletIndex);
    if (!token || context.rh) {
      clearPumpCashbackRefresh(trade);
      trade.dataset.proCashbackToken = token;
      trade.dataset.proCashbackWallet = walletContext;
      delete trade.dataset.proCashbackCheckedAt;
      delete trade.dataset.proCashbackEnabled;
      delete trade.dataset.proCashbackRequest;
      paintPumpCashbackBadge(trade, false);
      return;
    }
    const sameContext = trade.dataset.proCashbackToken === token && trade.dataset.proCashbackWallet === walletContext;
    if (sameContext && trade.dataset.proCashbackRequest) return;
    const ttlMs = trade.dataset.proCashbackEnabled === "1" ? PUMP_CASHBACK_POSITIVE_TTL_MS : PUMP_CASHBACK_RETRY_TTL_MS;
    if (sameContext && pumpCashbackContextFresh(trade.dataset.proCashbackCheckedAt, ttlMs)) return;
    if (!sameContext) {
      clearPumpCashbackRefresh(trade);
      delete trade.dataset.proCashbackCheckedAt;
      delete trade.dataset.proCashbackEnabled;
      paintPumpCashbackBadge(trade, false);
    }
    trade.dataset.proCashbackToken = token;
    trade.dataset.proCashbackWallet = walletContext;
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    trade.dataset.proCashbackRequest = requestId;
    const bootstrap = await pumpCashbackRequest(`/api/web/chart/bootstrap?token=${encodeURIComponent(token)}`);
    if (trade.dataset.proCashbackToken !== token || trade.dataset.proCashbackWallet !== walletContext || trade.dataset.proCashbackRequest !== requestId) return;
    delete trade.dataset.proCashbackRequest;
    if (!bootstrap.ok || !bootstrap.data) {
      delete trade.dataset.proCashbackCheckedAt;
      delete trade.dataset.proCashbackEnabled;
      schedulePumpCashbackRefresh(trade, PUMP_CASHBACK_RETRY_TTL_MS);
      return;
    }
    const chart = bootstrap.data?.chart || bootstrap.data || {};
    const enabled = chart.pumpCashback === true || bootstrap.data?.pumpCashback === true;
    const source = chart.pumpCashbackSource || bootstrap.data?.pumpCashbackSource || "";
    trade.dataset.proCashbackCheckedAt = String(Date.now());
    trade.dataset.proCashbackEnabled = enabled ? "1" : "0";
    paintPumpCashbackBadge(trade, enabled, source);
    schedulePumpCashbackRefresh(trade, enabled ? PUMP_CASHBACK_POSITIVE_TTL_MS : PUMP_CASHBACK_RETRY_TTL_MS);
    if (!enabled || !hasSession) return;
    const rewards = await pumpCashbackRequest(`/api/web/pump/rewards?walletIndex=${encodeURIComponent(walletIndex)}`);
    if (trade.dataset.proCashbackToken !== token || trade.dataset.proCashbackWallet !== walletContext) return;
    if (!rewards.ok || rewards.data?.ok === false) {
      schedulePumpCashbackRefresh(trade, PUMP_CASHBACK_RETRY_TTL_MS);
      return;
    }
    paintPumpCashbackBadge(trade, true, source, pumpCashbackSolFromRewards(rewards.data, walletIndex));
  }

  function indicatorDrawerHtml() {
    return `<section class="indicator-drawer proIndicatorDrawer" data-indicator-drawer hidden aria-label="Technical indicators"><div class="indicator-picker"><button type="button" data-indicator-kind="fib" aria-pressed="false">Fibonacci ⚙</button><button type="button" data-indicator-kind="rsi" aria-pressed="false">RSI</button><button type="button" data-indicator-kind="macd" aria-pressed="false">MACD</button><button type="button" data-indicator-kind="harmonics" aria-pressed="false">Harmonics ◇</button></div><section class="fib-settings" data-fib-settings hidden aria-label="Fibonacci settings"></section><section class="harmonic-settings" data-harmonic-settings hidden aria-label="Harmonic pattern settings"></section><div class="indicator-status" data-indicator-status role="status" aria-live="polite">Choose an indicator or stack several.</div><div class="indicator-panels" data-indicator-panels></div><p class="indicator-note">Fibonacci, RSI, MACD, Bat, Gartley, Shark, Butterfly, Crab and 5-0 are calculated from live SlimeWire candles.</p></section>`;
  }

  async function resolveStandardPool(trade, context, timeframe) {
    const chart = one(".chartwrap", trade);
    if (!chart || chart.dataset.proPoolResolving === "1") return;
    // A pair already present in the chart URL came from the terminal's exact market
    // resolution. Keep it immutable; discovery is only allowed to fill a missing pair.
    if (chart.dataset.proPoolPinned === "1" && chart.dataset.poolAddress) return;
    chart.dataset.proPoolResolving = "1";
    try {
      const result = await request(`/api/web/chart/bootstrap?token=${encodeURIComponent(context.token)}`);
      const resolved = result.ok && result.data?.ok ? result.data.chart : null;
      let pair = String(resolved?.pairAddress || "").trim();
      // Static/PWA hosts can briefly miss the backend bootstrap because of CORS or a
      // sleeping service. DexScreener's public token endpoint is the same browser-side
      // fallback already used by the terminal header; rank exact-chain pools by real
      // liquidity + volume and never guess a pool from the token address.
      if (!pair) {
        const dex = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(context.token)}`, { headers: { Accept: "application/json" } })
          .then((response) => response.ok ? response.json() : null)
          .catch(() => null);
        const tokenKey = context.rh ? context.token.toLowerCase() : context.token;
        const network = context.rh ? "robinhood" : "solana";
        const matching = (Array.isArray(dex?.pairs) ? dex.pairs : []).filter((row) => {
          if (String(row?.chainId || "").toLowerCase() !== network) return false;
          const base = String(row?.baseToken?.address || ""), quote = String(row?.quoteToken?.address || "");
          return context.rh ? base.toLowerCase() === tokenKey || quote.toLowerCase() === tokenKey : base === tokenKey || quote === tokenKey;
        });
        const baseMatches = matching.filter((row) => context.rh
          ? String(row?.baseToken?.address || "").toLowerCase() === tokenKey
          : String(row?.baseToken?.address || "") === tokenKey);
        const exact = (baseMatches.length ? baseMatches : matching).sort((a, b) => {
          const weight = (row) => Number(row?.liquidity?.usd || 0) + Number(row?.volume?.h24 || 0) * .01;
          return weight(b) - weight(a);
        });
        pair = String(exact[0]?.pairAddress || "").trim();
      }
      if (!pair) {
        const network = context.rh ? "robinhood" : "solana";
        const gecko = await fetch(`https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${encodeURIComponent(context.token)}/pools?page=1`, {
          headers: { Accept: "application/json;version=20230302" }
        }).then((response) => response.ok ? response.json() : null).catch(() => null);
        const tokenKey = context.rh ? context.token.toLowerCase() : context.token;
        const prefix = `${network}_`;
        const matching = (Array.isArray(gecko?.data) ? gecko.data : []).map((row) => {
          const relationshipAddress = (relationship) => {
            const id = String(relationship?.data?.id || "");
            return id.toLowerCase().startsWith(prefix) ? id.slice(prefix.length) : "";
          };
          const base = relationshipAddress(row?.relationships?.base_token), quote = relationshipAddress(row?.relationships?.quote_token);
          const matches = context.rh
            ? base.toLowerCase() === tokenKey || quote.toLowerCase() === tokenKey
            : base === tokenKey || quote === tokenKey;
          return {
            matches,
            baseMatch: context.rh ? base.toLowerCase() === tokenKey : base === tokenKey,
            address: String(row?.attributes?.address || String(row?.id || "").replace(new RegExp(`^${prefix}`, "i"), "")),
            reserveUsd: Number(row?.attributes?.reserve_in_usd || 0),
            volumeUsd: Number(row?.attributes?.volume_usd?.h24 || 0)
          };
        }).filter((row) => row.matches && row.address);
        const baseMatches = matching.filter((row) => row.baseMatch);
        const exact = (baseMatches.length ? baseMatches : matching).sort((a, b) => (b.reserveUsd + b.volumeUsd * .01) - (a.reserveUsd + a.volumeUsd * .01));
        pair = String(exact[0]?.address || "").trim();
      }
      if (!pair || !document.documentElement.contains(trade)) return;
      chart.dataset.poolAddress = pair;
      chart.dataset.proPoolPinned = "1";
      chart.dataset.proStandardSrc = standardChartUrl(context, timeframe, pair, "");
      const activeTimeframe = trade.dataset.proTf || timeframe;
      if (trade.dataset.proChartMode !== "slime" && !MICRO.has(activeTimeframe)) setTimeframe(trade, activeTimeframe);
    } finally {
      chart.dataset.proPoolResolving = "0";
    }
  }

  function injectTradeWorkspace(trade) {
    if (!trade || trade.dataset.proReady === "1") return;
    const main = one(".tradeMain", trade), chart = one(".chartwrap", trade), side = one(".tradeSide .sidepad", trade), frame = chart && one("iframe", chart);
    if (!main || !chart || !frame) return;
    const context = currentContext(trade), stored = localStorage.getItem(context.rh ? "ggRhChartTf" : "ggSolChartTf"), inferred = inferTimeframe(frame), active = TIMEFRAMES.some(([value]) => value === stored) ? stored : (TIMEFRAMES.some(([value]) => value === inferred) ? inferred : "15m");
    const initialPool = poolFromUrl(frame.src);
    trade.dataset.proReady = "1";
    chart.dataset.proStandardSrc = /\/chart-lab/i.test(frame.src) ? standardChartUrl(context, active, initialPool, "") : frame.src;
    chart.classList.add("proIndicatorFrame");
    chart.setAttribute("data-chart-frame", "");
    chart.dataset.poolAddress = initialPool;
    chart.dataset.proPoolPinned = initialPool ? "1" : "0";
    chart.insertAdjacentHTML("beforebegin", toolbarHtml(active));
    chart.insertAdjacentHTML("afterend", indicatorDrawerHtml());
    main.insertAdjacentHTML("beforeend", quickPanelHtml(context));
    const toolbar = one(".chartProBar", trade), panel = one(".proQuickPanel", trade);
    all("[data-pro-tf]", toolbar).forEach((button) => button.addEventListener("click", () => setTimeframe(trade, button.dataset.proTf)));
    one("[data-pro-slime-mode]", toolbar)?.addEventListener("click", () => setChartMode(trade, trade.dataset.proChartMode === "slime" ? "pro" : "slime"));
    one("[data-pro-quick-toggle]", toolbar)?.addEventListener("click", () => panel.classList.toggle("open"));
    one("[data-pro-close]", panel)?.addEventListener("click", () => panel.classList.remove("open"));
    one("[data-pro-wallet]", panel)?.addEventListener("click", () => window.GG?.go?.("wallet"));
    all("[data-pro-side]", panel).forEach((button) => button.addEventListener("click", () => setSide(trade, button.dataset.proSide)));
    all("[data-pro-quick]", panel).forEach((button) => button.addEventListener("click", () => { setSide(trade, button.dataset.proQuick); const input = one("[data-pro-amount]", panel); if (input) input.value = button.dataset.value; }));
    all("[data-pro-profile]", panel).forEach((button) => button.addEventListener("click", () => applyProfile(trade, Number(button.dataset.proProfile))));
    one("[data-pro-execute]", panel)?.addEventListener("click", () => executeQuick(trade));
    all("[data-pro-tool]", panel).forEach((button) => button.addEventListener("click", () => openTool(trade, button.dataset.proTool)));
    one("[data-pro-wide]", toolbar)?.addEventListener("click", () => { trade.classList.toggle("proWide"); refreshChartFocusControls(trade); });
    one("[data-pro-full]", toolbar)?.addEventListener("click", () => toggleFullscreen(trade));
    if (side && !context.rh && !one(".proSideTools", side)) {
      const tools = document.createElement("div"); tools.className = "proSideTools";
      tools.innerHTML = `<button type="button" data-side-tool="orders">⏱ Orders</button><button type="button" data-side-tool="exits">🎯 TP/SL</button><button type="button" data-side-tool="bundle">📦 Bundle</button><button type="button" data-side-tool="volume">↻ Volume</button>`;
      const anchor = one(".perf", side) || one(".secbox", side); (anchor || side).insertAdjacentElement(anchor ? "afterend" : "beforeend", tools);
      all("[data-side-tool]", tools).forEach((button) => button.addEventListener("click", () => openTool(trade, button.dataset.sideTool)));
    }
    // Pro is the default for every 1m+ interval on both chains. Micro candles use
    // SlimeWire's native tape, and the user can explicitly keep Slime Mode on.
    setTimeout(() => setTimeframe(trade, active), 0);
    refreshChartFocusControls(trade);
    refreshTradeContext(trade);
    void resolveStandardPool(trade, context, active);
  }

  async function toggleFullscreen(trade) {
    if (document.fullscreenElement) { await document.exitFullscreen().catch(() => {}); trade.classList.remove("proFullscreen"); document.body.classList.remove("proNoScroll"); refreshChartFocusControls(trade); return; }
    try { await trade.requestFullscreen(); }
    catch (_) { trade.classList.toggle("proFullscreen"); document.body.classList.toggle("proNoScroll", trade.classList.contains("proFullscreen")); }
    refreshChartFocusControls(trade);
  }

  function parseMarketCap(value) {
    const match = String(value || "").trim().toLowerCase().replace(/[$,\s]/g, "").match(/^([0-9]*\.?[0-9]+)(k|m|b)?$/);
    if (!match) return 0;
    let amount = Number(match[1]); if (!(amount > 0)) return 0;
    if (match[2] === "k") amount *= 1e3; else if (match[2] === "m") amount *= 1e6; else if (match[2] === "b") amount *= 1e9;
    return Math.round(amount);
  }

  function formatUsd(value) {
    const n = Number(value) || 0; return n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${Math.round(n)}`;
  }

  async function request(path, options) {
    const token = localStorage.getItem(TOKEN_KEY) || "";
    const headers = Object.assign({ Accept: "application/json" }, options?.headers || {});
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options?.body) headers["Content-Type"] = "application/json";
    try { const response = await fetch(`${API_BASE}${path}`, Object.assign({}, options || {}, { headers })); const data = await response.json().catch(() => null); return { ok: response.ok, status: response.status, data }; }
    catch (_) { return { ok: false, status: 0, data: null }; }
  }

  function toast(message, error) {
    if (window.GG?.toast) window.GG.toast(message, error);
    else { const node = one("#toast"); if (node) { node.textContent = message; node.className = `toast show${error ? " err" : ""}`; setTimeout(() => { node.className = "toast"; }, 3000); } }
  }

  async function freezeManagedWallet(walletIndex) {
    const index = Number(walletIndex) || 1;
    const exposed = window.GG?.walletSnapshot?.(index);
    if (exposed?.publicKey) return { index, publicKey: String(exposed.publicKey), label: String(exposed.label || `Wallet ${index}`) };
    try {
      const saved = JSON.parse(localStorage.getItem("slimewireTerminalWalletPreviewV1") || "null");
      const preview = Array.isArray(saved?.wallets) ? saved.wallets.find((row) => Number(row?.index) === index) : null;
      if (preview?.publicKey) return { index, publicKey: String(preview.publicKey), label: String(preview.label || `Wallet ${index}`) };
    } catch (_) {}
    const result = await request("/api/web/wallets");
    const wallet = result.ok && result.data?.ok && Array.isArray(result.data.wallets)
      ? result.data.wallets.find((row) => Number(row?.index) === index)
      : null;
    return wallet?.publicKey ? { index, publicKey: String(wallet.publicKey), label: String(wallet.label || `Wallet ${index}`) } : null;
  }

  async function refreshOrders(context) {
    const list = one("[data-pro-order-list]"); if (!list) return;
    const result = await request(`/api/web/market-orders?token=${encodeURIComponent(context.token)}`), rows = result.ok && result.data?.ok ? (result.data.orders || []) : [];
    list.innerHTML = rows.length ? rows.map((order) => { const buy = String(order.kind || order.side || "").includes("buy"), target = Number(order.targetMarketCapUsd || order.triggerMc || 0), amount = buy ? `${order.amountSol || "?"} SOL` : `${order.sellPercent || order.pct || 100}%`; return `<div class="orderRow"><b>${buy ? "BUY" : "SELL"}</b><span>${formatUsd(target)} · ${escapeHtml(amount)} · ${escapeHtml(order.status || "active")}</span>${["active", "armed"].includes(String(order.status || "active")) ? `<button type="button" data-pro-cancel-order="${escapeHtml(order.id)}" data-chain="${escapeHtml(order.chain || (context.rh ? "robinhood" : "solana"))}">×</button>` : ""}</div>`; }).join("") : `<div class="orderRow"><span>No active orders on this coin.</span></div>`;
    all("[data-pro-cancel-order]", list).forEach((button) => button.addEventListener("click", async () => { button.disabled = true; const result = await request("/api/web/market-orders/cancel", { method: "POST", body: JSON.stringify({ id: button.dataset.proCancelOrder, chain: button.dataset.chain }) }); toast(result.ok ? "Order cancelled" : (result.data?.message || result.data?.error || "Could not cancel order"), !result.ok); await refreshOrders(context); }));
  }

  async function openMarketOrders(trade) {
    const context = currentContext(trade), token = localStorage.getItem(TOKEN_KEY) || "";
    if (!token) { toast("Open Wallet to create or log into your profile first", true); window.GG?.go?.("wallet"); return; }
    const mcText = (one(context.rh ? "#rhTvStats div:first-child b" : "#thead .st div:first-child b") || {}).textContent || "—", wallet = Number(localStorage.getItem(ACTIVE_WALLET_KEY)) || 1;
    // Freeze the reviewed wallet by index + public key. A wallet switch while
    // this sheet is open cannot redirect an already-reviewed server-side order.
    const frozenWallet = await freezeManagedWallet(wallet);
    if (!frozenWallet?.publicKey) { toast("Wallet details are still loading. Refresh Wallet, then try again.", true); return; }
    const modal = one("#modal"), box = one("#modalBox"); if (!modal || !box) return;
    box.innerHTML = `<button class="x" type="button" data-pro-order-close>✕</button><div class="proOrders"><h3>⏱ Market-cap orders</h3><p class="sub mut" style="font-size:12px">${escapeHtml(context.symbol)} · current MC ${escapeHtml(mcText)} · wallet ${wallet}. Add one rule or combine all three.</p>
      <div class="orderCard"><h4>Auto buy</h4><div class="fieldGrid"><div class="field"><label>Buy when MC touches</label><input data-order-buy-mc inputmode="decimal" placeholder="30k"></div><div class="field"><label>Spend SOL</label><input data-order-buy-sol inputmode="decimal" value="0.1"></div></div></div>
      <div class="orderCard"><h4>Profit ladder</h4><div class="fieldGrid"><div class="field"><label>MC targets</label><input data-order-ladder-mc placeholder="75k, 100k, 150k"></div><div class="field"><label>Sell % of remaining</label><input data-order-ladder-sell placeholder="25, 25, 100"></div></div></div>
      <div class="orderCard"><h4>Stop loss by MC</h4><div class="fieldGrid"><div class="field"><label>Exit if MC touches</label><input data-order-stop-mc inputmode="decimal" placeholder="20k"></div><div class="field"><label>Sell %</label><input data-order-stop-sell inputmode="numeric" value="100"></div></div></div>
      <button class="wbtn" type="button" data-pro-submit-orders style="width:100%">Arm selected orders</button><p class="wnote">Targets above or below the current market cap are handled automatically. Orders run server-side after you close the site.</p><div class="orderList" data-pro-order-list><div class="orderRow"><span>Loading active orders…</span></div></div></div>`;
    box.dataset.proOrderAttempt = `market-orders-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    modal.classList.add("on"); one("[data-pro-order-close]", box)?.addEventListener("click", () => window.GG?.closeModal?.());
    one("[data-pro-submit-orders]", box)?.addEventListener("click", async (event) => {
      const orders = [], buyText = one("[data-order-buy-mc]", box)?.value.trim() || "", buyMc = parseMarketCap(buyText), buySol = Number(one("[data-order-buy-sol]", box)?.value || 0);
      if (buyText) { if (!buyMc || buySol < .005) { toast("Add a valid buy MC and at least 0.005 SOL", true); return; } orders.push({ side: "buy", targetMarketCapUsd: buyMc, amountSol: buySol }); }
      const targets = String(one("[data-order-ladder-mc]", box)?.value || "").split(",").map(parseMarketCap).filter((value) => value > 0).slice(0, 4), sells = String(one("[data-order-ladder-sell]", box)?.value || "").split(",").map(Number);
      targets.forEach((target, index) => orders.push({ side: "sell", targetMarketCapUsd: target, sellPercent: sells[index] > 0 ? sells[index] : (index === targets.length - 1 ? 100 : Math.max(1, Math.floor(100 / targets.length))) }));
      const stop = parseMarketCap(one("[data-order-stop-mc]", box)?.value), stopSell = Number(one("[data-order-stop-sell]", box)?.value || 100); if (stop) orders.push({ side: "sell", targetMarketCapUsd: stop, sellPercent: stopSell });
      if (!orders.length) { toast("Add a buy target, profit target, or stop loss", true); return; }
      if (orders.some((order) => order.side === "sell" && (!(order.sellPercent >= 1) || order.sellPercent > 100))) { toast("Sell percentages must be 1–100%", true); return; }
      event.currentTarget.disabled = true; event.currentTarget.textContent = "Arming…";
      await request("/api/web/profile/automation", { method: "POST", body: JSON.stringify({ action: "enable" }) });
      const currentMc = parseMarketCap(mcText), result = await request("/api/web/market-orders", { method: "POST", body: JSON.stringify({ token: context.token, symbol: context.symbol, walletIndex: String(frozenWallet.index), walletPublicKey: frozenWallet.publicKey, currentMarketCapUsd: currentMc, clientRequestId: box.dataset.proOrderAttempt, orders }) });
      event.currentTarget.disabled = false; event.currentTarget.textContent = "Arm selected orders";
      if (!result.ok || !result.data?.ok) { toast(result.data?.message || result.data?.error || "Could not arm orders", true); return; }
      toast(`${result.data.armed?.length || orders.length} order${orders.length === 1 ? "" : "s"} armed`); await refreshOrders(context);
    });
    await refreshOrders(context);
  }

  let portfolioLoadSequence = 0;

  function ensurePortfolioActivityStyles() {
    if (one("#proPortfolioActivityStyles")) return;
    const style = document.createElement("style");
    style.id = "proPortfolioActivityStyles";
    style.textContent = `
      .proActivityShell{display:grid;gap:12px;max-width:1160px;margin:0 auto;padding:2px 0 30px}
      .proActivityHero{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:18px;border:1px solid rgba(114,255,35,.22);border-radius:18px;background:linear-gradient(135deg,rgba(114,255,35,.075),rgba(8,14,9,.95) 46%,rgba(102,65,255,.08));box-shadow:inset 0 1px rgba(255,255,255,.035)}
      .proActivityHero h2{margin:3px 0 5px;font-size:20px}.proActivityHero p{margin:0;color:var(--muted);font-size:12px;line-height:1.5}.proActivityEyebrow{color:var(--green);font-size:9px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
      .proActivityScopes{display:flex;gap:7px;flex-wrap:wrap}.proActivityScopes button{border:1px solid var(--border);border-radius:999px;background:#0a100b;color:var(--muted);padding:8px 11px;font:800 10px var(--font);cursor:pointer}.proActivityScopes button.on{border-color:rgba(114,255,35,.55);color:#071006;background:var(--green)}
      .proActivitySummary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.proActivitySummary article{padding:12px 14px;border:1px solid var(--border);border-radius:13px;background:rgba(8,13,9,.86)}.proActivitySummary span{display:block;color:var(--muted2);font-size:9px;text-transform:uppercase;letter-spacing:.08em}.proActivitySummary b{display:block;margin-top:4px;font-size:15px}
      .proActivitySection{border:1px solid var(--border);border-radius:16px;background:rgba(7,12,8,.88);overflow:hidden}.proActivitySectionHead{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;border-bottom:1px solid var(--border)}.proActivitySectionHead h3{margin:0;font-size:13px}.proActivitySectionHead span{font-size:10px;color:var(--muted)}
      .proActivityList{display:grid}.proActivityRow{display:grid;grid-template-columns:minmax(155px,1.1fr) minmax(225px,1.5fr) minmax(130px,.8fr) auto;align-items:center;gap:12px;padding:13px 15px;border-bottom:1px solid var(--border2)}.proActivityRow:last-child{border-bottom:0}.proActivityAsset{display:flex;align-items:center;gap:10px;min-width:0}.proActivityAvatar{position:relative;display:grid;place-items:center;width:38px;height:38px;flex:0 0 38px;border-radius:12px;background:linear-gradient(145deg,#203423,#0a100b);border:1px solid rgba(114,255,35,.25);color:var(--green);font-size:12px;font-weight:900;overflow:hidden}.proActivityAvatar img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.proActivityAsset b,.proActivityWallet b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px}.proActivityAsset small,.proActivityWallet small{display:block;margin-top:3px;color:var(--muted);font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .proActivityLegs{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px}.proActivityLeg{min-width:0;padding:8px 9px;border:1px solid var(--border2);border-radius:10px;background:rgba(14,23,15,.7)}.proActivityLeg span{display:block;color:var(--muted2);font-size:8px;text-transform:uppercase;letter-spacing:.08em}.proActivityLeg b{display:block;margin-top:3px;font:800 11px var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.proActivityArrow{color:var(--green);font-size:15px}
      .proActivityMeta{text-align:right}.proActivityMeta b{display:block;font-size:10px}.proActivityMeta span{display:block;margin-top:4px;color:var(--muted);font-size:9px}.proActivityLinks{display:flex;justify-content:flex-end;gap:6px}.proActivityLinks a,.proActivityLinks button{padding:7px 9px;border:1px solid var(--border);border-radius:9px;background:transparent;color:var(--text);font:800 9px var(--sans);text-decoration:none;cursor:pointer}.proActivityLinks a:hover,.proActivityLinks button:hover{border-color:var(--green);color:var(--green)}.proActivityLinks button:disabled{opacity:.55;cursor:wait}
      .proActivityBadge{display:inline-flex!important;width:max-content;margin-top:4px!important;padding:2px 6px;border:1px solid rgba(114,255,35,.25);border-radius:999px;color:var(--green)!important;font-size:8px!important;text-transform:uppercase;letter-spacing:.05em}.proActivityBadge.history{border-color:var(--border);color:var(--muted)!important}.proActivityBadge.attention{border-color:rgba(255,190,60,.45);color:#d7bc78!important;background:rgba(255,190,60,.06)}.proActivityEmpty{padding:24px 16px;text-align:center;color:var(--muted);font-size:11px}.proActivityWarn{padding:10px 13px;border:1px solid rgba(255,190,60,.25);border-radius:11px;background:rgba(255,190,60,.055);color:#d7bc78;font-size:10px}
      @media(max-width:760px){.proActivityHero{display:grid}.proActivitySummary{grid-template-columns:1fr 1fr}.proActivitySummary article:first-child{grid-column:1/-1}.proActivityRow{grid-template-columns:minmax(0,1fr) auto;gap:10px}.proActivityLegs{grid-column:1/-1;grid-row:2}.proActivityWallet{min-width:0}.proActivityLinks{grid-column:1/-1;justify-content:flex-start}.proActivityMeta{text-align:right}.proActivitySectionHead{align-items:flex-start}.proActivityAvatar{width:34px;height:34px;flex-basis:34px}}
    `;
    document.head.appendChild(style);
  }

  function compactAmount(value, fallback = "—") {
    const number = Number(value);
    if (!Number.isFinite(number)) return value == null || value === "" ? fallback : String(value);
    if (number === 0) return "0";
    if (Math.abs(number) >= 1e9) return `${(number / 1e9).toFixed(2)}B`;
    if (Math.abs(number) >= 1e6) return `${(number / 1e6).toFixed(2)}M`;
    if (Math.abs(number) >= 1e3) return number.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return number.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }

  function activityTime(value) {
    const timestamp = Date.parse(value || "");
    if (!Number.isFinite(timestamp)) return { relative: "Time unavailable", exact: "" };
    const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    const relative = seconds < 45 ? "Just now" : seconds < 3600 ? `${Math.floor(seconds / 60)}m ago` : seconds < 86400 ? `${Math.floor(seconds / 3600)}h ago` : seconds < 604800 ? `${Math.floor(seconds / 86400)}d ago` : new Date(timestamp).toLocaleDateString();
    return { relative, exact: new Date(timestamp).toLocaleString() };
  }

  function tokenMetaMap(pnl) {
    const map = new Map();
    for (const row of Array.isArray(pnl?.tokens) ? pnl.tokens : []) {
      const token = String(row?.tokenMint || row?.address || "").toLowerCase();
      if (token) map.set(token, row);
    }
    return map;
  }

  function activityAvatar(meta, symbol) {
    const image = String(meta?.imageUrl || meta?.iconUrl || "");
    const letter = String(symbol || "?").replace(/^\$+/, "").slice(0, 2).toUpperCase() || "?";
    return `<span class="proActivityAvatar">${escapeHtml(letter)}${image ? `<img src="${escapeHtml(image)}" alt="" loading="lazy" onerror="this.remove()">` : ""}</span>`;
  }

  function explorerUrl(chain, signature, token) {
    const rh = chain === "robinhood" || isRobinhood(token);
    if (signature) return `${rh ? "https://robinhoodchain.blockscout.com/tx/" : "https://solscan.io/tx/"}${encodeURIComponent(signature)}`;
    if (!token) return "";
    return `${rh ? "https://robinhoodchain.blockscout.com/token/" : "https://solscan.io/token/"}${encodeURIComponent(token)}`;
  }

  function activityRowHtml(row, metaByToken) {
    const token = String(row.tokenMint || row.tokenAddress || row.token || ""), meta = metaByToken.get(token.toLowerCase()) || {};
    const symbol = String(row.symbol || meta.symbol || row.shortMint || row.shortToken || short(token) || "Token").replace(/^\$+/, ""), side = String(row.side || row.type || "").toLowerCase() === "sell" ? "sell" : "buy";
    const left = row.leftText || (side === "buy" ? `${compactAmount(row.solAmount ?? row.amountSol)} SOL` : `${row.sellPercent ? `${compactAmount(row.sellPercent)}% ` : compactAmount(row.tokenAmount) + " "}$${symbol}`);
    const right = row.rightText || (side === "buy" ? `${compactAmount(row.tokenAmount, "Token amount pending")} $${symbol}` : `${compactAmount(row.solAmount, "SOL pending")} SOL`);
    const time = activityTime(row.timestamp || row.completedAt || row.triggeredAt || row.updatedAt || row.createdAt), walletKey = String(row.walletPublicKey || row.publicKey || ""), wallet = String(row.walletLabel || row.label || (row.walletIndex ? `Wallet ${row.walletIndex}` : "Managed wallet"));
    const signature = String(row.signature || row.sellSignature || row.txHash || ""), explorer = String(row.explorerUrl || "") || explorerUrl(row.chain, signature, token), source = String(row.sourceLabel || row.source || "SlimeWire");
    const status = String(row.statusLabel || row.status || "confirmed"), active = Boolean(row.isActive), chartHash = `${isRobinhood(token) ? "#rhtrade/" : "#trade/"}${encodeURIComponent(token)}`, title = String(row.displayName || `$${symbol}`);
    const badgeClass = row.needsAttention ? " attention" : active ? "" : " history";
    return `<article class="proActivityRow">
      <div class="proActivityAsset">${activityAvatar(meta, symbol)}<div><b>${escapeHtml(title)}</b><small>${escapeHtml(short(token) || row.assetDetail || row.chain || "")}</small><span class="proActivityBadge${badgeClass}">${escapeHtml(row.kindLabel || (side === "sell" ? "Sell" : "Buy"))} · ${escapeHtml(status)}</span></div></div>
      <div class="proActivityLegs"><div class="proActivityLeg"><span>${escapeHtml(row.leftLabel || (side === "buy" ? "Paid" : "Sold"))}</span><b>${escapeHtml(left)}</b></div><span class="proActivityArrow">→</span><div class="proActivityLeg"><span>${escapeHtml(row.rightLabel || "Received")}</span><b>${escapeHtml(right)}</b></div></div>
      <div class="proActivityWallet"><b>${escapeHtml(wallet)}</b><small title="${escapeHtml(walletKey)}">${escapeHtml(short(walletKey) || "Wallet identity recorded")}</small><small>${escapeHtml(source)}</small></div>
      <div class="proActivityMeta"><b title="${escapeHtml(time.exact)}">${escapeHtml(time.relative)}</b><span>${row.targetMarketCapUsd ? `Target ${escapeHtml(formatUsd(row.targetMarketCapUsd))}` : escapeHtml(row.detail || "")}</span><div class="proActivityLinks">${token ? `<a href="${chartHash}">Chart</a>` : ""}${explorer ? `<a href="${escapeHtml(explorer)}" target="_blank" rel="noopener noreferrer">Explorer ↗</a>` : ""}${row.canCancel ? `<button type="button" data-pro-cancel-global="${escapeHtml(row.id)}" data-chain="${escapeHtml(row.cancelChain || row.chain || "solana")}">Cancel</button>` : ""}</div></div>
    </article>`;
  }

  function activitySection(title, subtitle, rows, metaByToken, emptyText) {
    return `<section class="proActivitySection"><header class="proActivitySectionHead"><h3>${escapeHtml(title)}</h3><span>${escapeHtml(subtitle)}</span></header><div class="proActivityList">${rows.length ? rows.map((row) => activityRowHtml(row, metaByToken)).join("") : `<div class="proActivityEmpty">${escapeHtml(emptyText)}</div>`}</div></section>`;
  }

  function normalizeOrderRows(orders, plans, rhGuards) {
    const market = (Array.isArray(orders) ? orders : []).map((order) => {
      const status = String(order.status || "unknown").toLowerCase(), needsAttention = ["outcome_unknown", "needs_attention"].includes(status);
      return { ...order, status, statusLabel: needsAttention ? "Needs attention" : status, needsAttention, isActive: Boolean(order.isActive) && !needsAttention, canCancel: Boolean(order.id) && ["armed", "active"].includes(status), cancelChain: order.chain || "solana", sourceLabel: order.chain === "robinhood" ? "Robinhood market order" : "Solana market order", kindLabel: "Market order", timestamp: order.completedAt || order.triggeredAt || order.createdAt, detail: needsAttention ? "Outcome unknown — check the explorer before retrying." : order.error || "" };
    });
    const planRows = (Array.isArray(plans) ? plans : []).flatMap((plan) => {
      const wallets = Array.isArray(plan.wallets) && plan.wallets.length ? plan.wallets : [{}];
      return wallets.map((wallet) => {
        const planWatching = ["watching", "armed", "running"].includes(String(plan.status || "").toLowerCase());
        const status = String(wallet.exitStatus || (planWatching ? plan.status : wallet.status || plan.status) || "watching"), needsAttention = ["outcome_unknown", "needs_attention"].includes(status.toLowerCase());
        return { ...plan, ...wallet, id: `${plan.id || "plan"}:${wallet.publicKey || wallet.label || "wallet"}`, side: "sell", tokenMint: plan.tokenMint, walletLabel: wallet.label, walletPublicKey: wallet.publicKey, status, statusLabel: needsAttention ? "Needs attention" : status, needsAttention, isActive: !needsAttention && ["watching", "armed", "running", "retrying", "submitting", "waiting_next_loop", "timer-only", "price-unavailable"].includes(status.toLowerCase()), sellPercent: wallet.triggerSellPercent || plan.triggerSellPercent || plan.sellPercent || 100, signature: wallet.sellSignature || wallet.buySignature || "", timestamp: wallet.soldAt || wallet.triggeredAt || wallet.lastCheckedAt || plan.completedAt || plan.createdAt, sourceLabel: plan.source || "Automated exit", kindLabel: "Auto exit", detail: needsAttention ? "Outcome unknown — check the explorer before retrying." : [plan.takeProfitSummary, plan.stopLossSummary].filter(Boolean).join(" · "), dexUrl: plan.dexUrl };
      });
    });
    // /market-orders already contains Robinhood limit-buy/limit-sell guards.
    // Only true exit guards belong here, otherwise every RH limit appears twice.
    const robinhoodExits = (Array.isArray(rhGuards) ? rhGuards : []).filter((guard) => String(guard?.kind || "exit").toLowerCase() === "exit").map((guard) => { const status = String(guard.status || "active").toLowerCase(), needsAttention = ["outcome_unknown", "needs_attention"].includes(status), txHashes = Array.isArray(guard.txHashes) ? guard.txHashes.filter(Boolean) : []; return { ...guard, chain: "robinhood", side: "sell", tokenMint: guard.tokenAddress, walletLabel: guard.walletLabel || (guard.walletIndex ? `Wallet ${guard.walletIndex}` : "Managed wallet"), status, statusLabel: needsAttention ? "Needs attention" : status, needsAttention, isActive: ["active", "armed", "retrying", "submitting"].includes(status), timestamp: guard.completedAt || guard.firedAt || guard.updatedAt || guard.createdAt, signature: guard.sellSignature || guard.txHash || txHashes[txHashes.length - 1] || "", sourceLabel: "Robinhood TP/SL", kindLabel: "Robinhood exit", detail: needsAttention ? (guard.lastError || "Check the explorer and wallet activity before retrying.") : [guard.takeProfitPct ? `TP +${guard.takeProfitPct}%` : "", guard.stopLossPct ? `SL -${guard.stopLossPct}%` : ""].filter(Boolean).join(" · ") }; });
    const seen = new Set();
    return [...market, ...planRows, ...robinhoodExits].filter((row) => { const key = `${row.kindLabel}:${row.id}:${row.walletPublicKey || row.walletIndex || ""}`; if (seen.has(key)) return false; seen.add(key); return true; }).sort((a, b) => Date.parse(b.timestamp || 0) - Date.parse(a.timestamp || 0));
  }

  function normalizeRhActivity(rows) {
    return (Array.isArray(rows) ? rows : []).map((item) => {
      const kind = String(item?.kind || item?.side || "activity").toLowerCase(), side = ["sell", "auto-sell", "cashout", "send"].includes(kind) ? "sell" : "buy";
      const base = { ...item, chain: "robinhood", side, status: "confirmed", timestamp: item.at || item.timestamp, tokenMint: item.tokenAddress || "", signature: item.tx || "", explorerUrl: item.url || "", walletLabel: item.walletLabel || (item.walletIndex ? `Wallet ${item.walletIndex}` : "Robinhood wallet"), sourceLabel: item.source || "Robinhood activity", kindLabel: kind === "auto-sell" ? "Auto sell" : kind.charAt(0).toUpperCase() + kind.slice(1) };
      if (kind === "buy") {
        return { ...base, leftLabel: "Paid", leftText: item.amountSol ? `${compactAmount(item.amountSol)} SOL` : `${compactAmount(item.amountEth, "ETH pending")} ETH`, rightLabel: "Received", rightText: `${compactAmount(item.tokenAmount, "Token amount pending")} $${item.symbol || short(item.tokenAddress) || "TOKEN"}` };
      }
      if (kind === "sell" || kind === "auto-sell") {
        return { ...base, leftLabel: "Sold", leftText: `${compactAmount(item.tokenAmount, "Token amount pending")} $${item.symbol || short(item.tokenAddress) || "TOKEN"}`, rightLabel: "Received", rightText: item.amountSol ? `${compactAmount(item.amountSol)} SOL` : `${compactAmount(item.amountEth ?? item.out, "ETH pending")} ETH`, detail: item.trigger ? `${item.trigger}${item.movePct !== "" && item.movePct != null ? ` · ${item.movePct}%` : ""}` : "" };
      }
      if (kind === "fund") return { ...base, displayName: "Fund Robinhood", symbol: "RH", assetDetail: "SOL to Robinhood ETH", leftLabel: "Sent", leftText: `${compactAmount(item.amountSol)} SOL`, rightLabel: "Received", rightText: `${compactAmount(item.quotedEth, "ETH pending")} ETH` };
      if (kind === "cashout") return { ...base, displayName: "Cash out to SOL", symbol: "RH", assetDetail: "Robinhood ETH to SOL", leftLabel: "Sent", leftText: `${compactAmount(item.sentEth)} ETH`, rightLabel: "Received", rightText: `${compactAmount(item.outSol, "SOL pending")} SOL` };
      if (kind === "send") return { ...base, displayName: "Send Robinhood ETH", symbol: "RH", assetDetail: item.destination ? `To ${short(item.destination)}` : "External wallet", leftLabel: "Sent", leftText: `${compactAmount(item.sentEth)} ETH`, rightLabel: "Destination", rightText: short(item.destination) || "External wallet" };
      if (kind === "launch") return { ...base, displayName: "Robinhood launch", symbol: item.symbol || "RH", leftLabel: "Created", leftText: item.symbol ? `$${item.symbol}` : "Token contract", rightLabel: "Contract", rightText: short(item.tokenAddress) || "Confirmed" };
      return { ...base, displayName: "Robinhood activity", symbol: "RH", leftLabel: "Action", leftText: kind, rightLabel: "Status", rightText: "Confirmed" };
    });
  }

  function activityHero(mode) {
    const activity = mode === "activity";
    return `<header class="proActivityHero"><div><span class="proActivityEyebrow">Portfolio / Activity</span><h2>${activity ? "My activity" : "Orders & exits"}</h2><p>${activity ? "Confirmed transactions from your SlimeWire managed wallets — separate from public market trades." : "Server-side orders, automated exits, and their completed history across Solana and Robinhood Chain."}</p></div><div class="proActivityScopes"><button type="button" class="${activity ? "on" : ""}" data-pro-portfolio-tab="activity">My activity</button><button type="button" class="${activity ? "" : "on"}" data-pro-portfolio-tab="orders">Orders & exits</button><button type="button" data-pro-market-trades>Market trades ↗</button></div></header>`;
  }

  function wirePortfolioActivity(container) {
    all("[data-pro-portfolio-tab]", container).forEach((button) => button.addEventListener("click", () => window.GG?.setPortfolioTab?.(button.dataset.proPortfolioTab)));
    one("[data-pro-market-trades]", container)?.addEventListener("click", () => { toast("Open a coin to see its live market trades."); window.GG?.go?.("trending"); });
    one("[data-pro-activity-refresh]", container)?.addEventListener("click", () => renderPortfolioActivity(container, container.dataset.proPortfolioMode || "activity"));
    all("[data-pro-cancel-global]", container).forEach((button) => button.addEventListener("click", async () => {
      button.disabled = true; button.textContent = "Cancelling…";
      const result = await request("/api/web/market-orders/cancel", { method: "POST", body: JSON.stringify({ id: button.dataset.proCancelGlobal, chain: button.dataset.chain || "solana" }) });
      toast(result.ok && result.data?.ok ? "Order cancelled" : (result.data?.message || result.data?.error || "Could not cancel order"), !(result.ok && result.data?.ok));
      await renderPortfolioActivity(container, "orders");
    }));
  }

  async function renderPortfolioActivity(container, mode = "activity") {
    if (!container) return;
    ensurePortfolioActivityStyles();
    const loadId = String(++portfolioLoadSequence);
    container.dataset.proPortfolioLoad = loadId;
    container.dataset.proPortfolioMode = mode;
    container.innerHTML = `<div class="proActivityShell">${activityHero(mode)}<div class="loading"><span class="spin"></span> Loading your ${mode === "activity" ? "activity" : "orders"}…</div></div>`;
    wirePortfolioActivity(container);
    const [pnlResult, rhActivityResult, ordersResult, plansResult, rhResult] = await Promise.all([
      request("/api/web/pnl"),
      request("/api/web/rh/activity"),
      request("/api/web/market-orders?token="),
      request("/api/web/trade/plans"),
      request("/api/web/rh/guards")
    ]);
    if (!container.isConnected || container.dataset.proPortfolioLoad !== loadId) return;
    const pnl = pnlResult.ok && pnlResult.data?.ok ? pnlResult.data.pnl || {} : {}, meta = tokenMetaMap(pnl);
    let content = "", warnings = [];
    if (mode === "activity") {
      const solanaTrades = Array.isArray(pnl.trades) ? pnl.trades.map((trade) => ({ ...trade, side: trade.type, status: "confirmed", timestamp: trade.timestamp, sourceLabel: trade.source || "Solana SlimeWire trade", kindLabel: "My activity", explorerUrl: trade.signature ? explorerUrl("solana", trade.signature, trade.tokenMint) : trade.dexUrl })) : [];
      const robinhoodTrades = rhActivityResult.ok && rhActivityResult.data?.ok ? normalizeRhActivity(rhActivityResult.data.activity || []) : [];
      const trades = [...solanaTrades, ...robinhoodTrades].sort((a, b) => Date.parse(b.timestamp || 0) - Date.parse(a.timestamp || 0));
      if (!pnlResult.ok) warnings.push("Transaction history could not refresh. Try again in a moment.");
      if (!rhActivityResult.ok) warnings.push("Robinhood activity could not refresh.");
      content = `<div class="proActivitySummary"><article><span>Scope</span><b>My wallets only</b></article><article><span>Transactions</span><b>${trades.length}</b></article><article><span>Networks</span><b>Solana + RH</b></article></div>${activitySection("Transaction history", `${trades.length} recent receipt${trades.length === 1 ? "" : "s"}`, trades, meta, "No SlimeWire wallet transactions yet.")}`;
    } else {
      const orders = ordersResult.ok && ordersResult.data?.ok ? ordersResult.data.orders || [] : [], plans = plansResult.ok && plansResult.data?.ok ? plansResult.data.plans || [] : [], rhGuards = rhResult.ok && rhResult.data?.ok ? rhResult.data.guards || [] : [];
      if (!ordersResult.ok) warnings.push("Market orders could not refresh.");
      if (!plansResult.ok) warnings.push("Solana exits could not refresh.");
      if (!rhResult.ok) warnings.push("Robinhood exits could not refresh.");
      const rows = normalizeOrderRows(orders, plans, rhGuards), open = rows.filter((row) => row.isActive), history = rows.filter((row) => !row.isActive), attention = history.filter((row) => row.needsAttention).length;
      content = `<div class="proActivitySummary"><article><span>Open now</span><b>${open.length}</b></article><article><span>Order history</span><b>${history.length}</b></article><article><span>Needs attention</span><b>${attention}</b></article></div>${activitySection("Open orders & exits", `${open.length} active`, open, meta, "No open market orders or automated exits.")}${activitySection("Order history & needs attention", `${history.length} completed / cancelled / unknown`, history, meta, "Completed and cancelled orders will appear here.")}`;
    }
    container.innerHTML = `<div class="proActivityShell">${activityHero(mode)}${warnings.map((message) => `<div class="proActivityWarn">${escapeHtml(message)}</div>`).join("")}${content}<button class="wbtn ghost" type="button" data-pro-activity-refresh style="justify-self:start">Refresh activity</button></div>`;
    wirePortfolioActivity(container);
  }

  function applyToolPrefill() {
    const token = localStorage.getItem(TOOL_PREFILL_KEY); if (!token) return;
    const input = one("#bnCa") || one("#vlCa"); if (!input) return;
    if (!input.value) { input.value = token; input.dispatchEvent(new Event("input", { bubbles: true })); }
    localStorage.removeItem(TOOL_PREFILL_KEY);
  }

  function scan() {
    all("#v-trade .trade, #v-rhtrade .trade").forEach((trade) => { injectTradeWorkspace(trade); refreshTradeContext(trade); refreshChartFocusControls(trade); void refreshPumpCashbackContext(trade); });
    applyToolPrefill();
  }

  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement) { all(".trade.proFullscreen").forEach((trade) => trade.classList.remove("proFullscreen")); document.body.classList.remove("proNoScroll"); } all(".trade").forEach(refreshChartFocusControls); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") { all(".trade.proFullscreen").forEach((trade) => trade.classList.remove("proFullscreen")); document.body.classList.remove("proNoScroll"); all(".trade").forEach(refreshChartFocusControls); } });
  let scanQueued = false;
  function scheduleScan() { if (scanQueued) return; scanQueued = true; requestAnimationFrame(() => { scanQueued = false; scan(); }); }
  const observer = new MutationObserver(scheduleScan); observer.observe(document.documentElement, { childList: true, subtree: true });
  window.SlimeWirePro = {
    scan,
    renderPortfolioActivity,
    syncIndicatorProvider: () => {
      const trade = one(location.hash.startsWith("#rhtrade/") ? "#v-rhtrade .trade" : "#v-trade .trade");
      if (!trade) return;
      const timeframe = one(".chartProBar [data-pro-tf].on", trade)?.dataset.proTf || trade.dataset.proTf || "15m";
      setTimeframe(trade, timeframe);
    },
    openMarketOrders: () => { const trade = one("#v-trade .trade, #v-rhtrade .trade"); if (trade) openMarketOrders(trade); }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan, { once: true }); else scan();
})();
