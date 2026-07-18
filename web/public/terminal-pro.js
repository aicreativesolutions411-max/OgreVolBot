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

  const one = (selector, root) => (root || document).querySelector(selector);
  const all = (selector, root) => Array.from((root || document).querySelectorAll(selector));
  const escapeHtml = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const isRobinhood = (value) => /^0x[0-9a-f]{40}$/i.test(String(value || ""));
  const short = (value) => { const text = String(value || ""); return text.length > 12 ? `${text.slice(0, 6)}…${text.slice(-4)}` : text; };

  function currentContext(trade) {
    const raw = decodeURIComponent((location.hash.split("/").slice(1).join("/") || "").trim());
    const rh = trade && (trade.closest("#v-rhtrade") || isRobinhood(raw));
    const symbol = (one(rh ? "#rhTvSym" : "#thead .ti b") || {}).textContent || short(raw);
    return { token: raw, rh: Boolean(rh), symbol: symbol.trim() || short(raw) };
  }

  function nativeChartUrl(context, timeframe, pool) {
    const query = new URLSearchParams({ ca: context.token, tf: timeframe, embed: "1", cv: "4", sym: context.symbol || "" });
    if (pool) query.set("pool", pool);
    return `/chart-lab?${query.toString()}`;
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

  function setTimeframe(trade, timeframe) {
    if (!TIMEFRAMES.some(([value]) => value === timeframe)) return;
    const context = currentContext(trade), chart = one(".chartwrap", trade), frame = chart && one("iframe", chart), toolbar = one(".chartProBar", trade);
    if (!chart || !frame || !context.token) return;
    if (!chart.dataset.proStandardSrc && !/\/chart-lab/i.test(frame.src)) chart.dataset.proStandardSrc = frame.src;
    const pool = poolFromUrl(frame.src) || poolFromUrl(chart.dataset.proStandardSrc || "");
    let next = frame.src;
    if (context.rh || MICRO.has(timeframe) || /\/chart-lab/i.test(frame.src) && !chart.dataset.proStandardSrc) {
      next = nativeChartUrl(context, timeframe, pool);
    } else if (MICRO.has(inferTimeframe(frame)) && chart.dataset.proStandardSrc) {
      next = chart.dataset.proStandardSrc;
    }
    try {
      const url = new URL(next, location.origin);
      if (/geckoterminal\.com$/i.test(url.hostname)) url.searchParams.set("resolution", timeframe);
      else if (/dexscreener\.com$/i.test(url.hostname)) url.searchParams.set("interval", ({ "1m": "1", "15m": "15", "1h": "60", "4h": "240", "12h": "720", "1d": "1D" })[timeframe] || "15");
      else url.searchParams.set("tf", timeframe);
      next = url.origin === location.origin ? `${url.pathname}${url.search}` : url.toString();
    } catch (_) {}
    const replacement = frame.cloneNode(false);
    replacement.src = next;
    replacement.loading = "eager";
    frame.replaceWith(replacement);
    trade.dataset.proTf = timeframe;
    localStorage.setItem(context.rh ? "ggRhChartTf" : "ggSolChartTf", timeframe);
    if (toolbar) paintTimeframeButtons(toolbar, timeframe);
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
    if (input) input.value = side === "sell" ? "100" : (context.rh ? "0.01" : "0.1");
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
      let values = ["0.01", "0.025", "0.05"];
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
    const buyAmounts = context.rh ? ["0.01", "0.025", "0.05", "0.10"] : ["0.1", "0.5", "1", "2"];
    return `<section class="proQuickPanel" data-side="buy" aria-label="Quick trade panel">
      <div class="proQuickHead"><button class="proWallet" type="button" data-pro-wallet><i class="dot"></i><span>Active wallet · pays with SOL</span></button><div class="proProfiles">${[0, 1, 2].map((i) => `<button type="button" data-pro-profile="${i}" title="Quick profile ${i + 1}">P${i + 1}</button>`).join("")}</div><button class="proClose" type="button" data-pro-close aria-label="Close quick trade">×</button></div>
      <div class="proQuickTabs"><button class="buy on" type="button" data-pro-side="buy">Buy</button><button class="sell" type="button" data-pro-side="sell">Sell</button></div>
      <div class="proAmount"><input data-pro-amount inputmode="decimal" value="${context.rh ? "0.01" : "0.1"}" aria-label="Quick trade amount"><span data-pro-unit>SOL</span></div>
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
    return `<div class="chartProBar" aria-label="Professional chart controls"><div class="proIntervals">${TIMEFRAMES.map(([value, label]) => `<button type="button" class="${value === active ? "on" : ""}" data-pro-tf="${value}">${label}</button>`).join("")}</div><i class="proDivider"></i><div class="proActions"><button class="proQuick" type="button" data-pro-quick-toggle>⚡ Quick trade</button><button class="proWide" type="button" data-pro-wide>↔ Wider chart</button><button class="proFull" type="button" data-pro-full>⛶ Fullscreen</button></div></div>`;
  }

  function injectTradeWorkspace(trade) {
    if (!trade || trade.dataset.proReady === "1") return;
    const main = one(".tradeMain", trade), chart = one(".chartwrap", trade), side = one(".tradeSide .sidepad", trade), frame = chart && one("iframe", chart);
    if (!main || !chart || !frame) return;
    const context = currentContext(trade), stored = localStorage.getItem(context.rh ? "ggRhChartTf" : "ggSolChartTf"), inferred = inferTimeframe(frame), active = TIMEFRAMES.some(([value]) => value === stored) ? stored : (TIMEFRAMES.some(([value]) => value === inferred) ? inferred : "15m");
    trade.dataset.proReady = "1";
    chart.dataset.proStandardSrc = /\/chart-lab/i.test(frame.src) ? "" : frame.src;
    chart.insertAdjacentHTML("beforebegin", toolbarHtml(active));
    main.insertAdjacentHTML("beforeend", quickPanelHtml(context));
    const toolbar = one(".chartProBar", trade), panel = one(".proQuickPanel", trade);
    all("[data-pro-tf]", toolbar).forEach((button) => button.addEventListener("click", () => setTimeframe(trade, button.dataset.proTf)));
    one("[data-pro-quick-toggle]", toolbar)?.addEventListener("click", () => panel.classList.toggle("open"));
    one("[data-pro-close]", panel)?.addEventListener("click", () => panel.classList.remove("open"));
    one("[data-pro-wallet]", panel)?.addEventListener("click", () => window.GG?.go?.("wallet"));
    all("[data-pro-side]", panel).forEach((button) => button.addEventListener("click", () => setSide(trade, button.dataset.proSide)));
    all("[data-pro-quick]", panel).forEach((button) => button.addEventListener("click", () => { setSide(trade, button.dataset.proQuick); const input = one("[data-pro-amount]", panel); if (input) input.value = button.dataset.value; }));
    all("[data-pro-profile]", panel).forEach((button) => button.addEventListener("click", () => applyProfile(trade, Number(button.dataset.proProfile))));
    one("[data-pro-execute]", panel)?.addEventListener("click", () => executeQuick(trade));
    all("[data-pro-tool]", panel).forEach((button) => button.addEventListener("click", () => openTool(trade, button.dataset.proTool)));
    one("[data-pro-wide]", toolbar)?.addEventListener("click", (event) => { trade.classList.toggle("proWide"); event.currentTarget.textContent = trade.classList.contains("proWide") ? "↔ Show ticket" : "↔ Wider chart"; });
    one("[data-pro-full]", toolbar)?.addEventListener("click", () => toggleFullscreen(trade));
    if (side && !context.rh && !one(".proSideTools", side)) {
      const tools = document.createElement("div"); tools.className = "proSideTools";
      tools.innerHTML = `<button type="button" data-side-tool="orders">⏱ Orders</button><button type="button" data-side-tool="exits">🎯 TP/SL</button><button type="button" data-side-tool="bundle">📦 Bundle</button><button type="button" data-side-tool="volume">↻ Volume</button>`;
      const anchor = one(".perf", side) || one(".secbox", side); (anchor || side).insertAdjacentElement(anchor ? "afterend" : "beforeend", tools);
      all("[data-side-tool]", tools).forEach((button) => button.addEventListener("click", () => openTool(trade, button.dataset.sideTool)));
    }
    if (active !== inferTimeframe(frame)) setTimeout(() => setTimeframe(trade, active), 0);
  }

  async function toggleFullscreen(trade) {
    if (document.fullscreenElement) { await document.exitFullscreen().catch(() => {}); trade.classList.remove("proFullscreen"); document.body.classList.remove("proNoScroll"); return; }
    try { await trade.requestFullscreen(); }
    catch (_) { trade.classList.toggle("proFullscreen"); document.body.classList.toggle("proNoScroll", trade.classList.contains("proFullscreen")); }
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
    const modal = one("#modal"), box = one("#modalBox"); if (!modal || !box) return;
    box.innerHTML = `<button class="x" type="button" data-pro-order-close>✕</button><div class="proOrders"><h3>⏱ Market-cap orders</h3><p class="sub mut" style="font-size:12px">${escapeHtml(context.symbol)} · current MC ${escapeHtml(mcText)} · wallet ${wallet}. Add one rule or combine all three.</p>
      <div class="orderCard"><h4>Auto buy</h4><div class="fieldGrid"><div class="field"><label>Buy when MC touches</label><input data-order-buy-mc inputmode="decimal" placeholder="30k"></div><div class="field"><label>Spend SOL</label><input data-order-buy-sol inputmode="decimal" value="0.1"></div></div></div>
      <div class="orderCard"><h4>Profit ladder</h4><div class="fieldGrid"><div class="field"><label>MC targets</label><input data-order-ladder-mc placeholder="75k, 100k, 150k"></div><div class="field"><label>Sell % at each</label><input data-order-ladder-sell placeholder="25, 25, 50"></div></div></div>
      <div class="orderCard"><h4>Stop loss by MC</h4><div class="fieldGrid"><div class="field"><label>Exit if MC touches</label><input data-order-stop-mc inputmode="decimal" placeholder="20k"></div><div class="field"><label>Sell %</label><input data-order-stop-sell inputmode="numeric" value="100"></div></div></div>
      <button class="wbtn" type="button" data-pro-submit-orders style="width:100%">Arm selected orders</button><p class="wnote">Targets above or below the current market cap are handled automatically. Orders run server-side after you close the site.</p><div class="orderList" data-pro-order-list><div class="orderRow"><span>Loading active orders…</span></div></div></div>`;
    modal.classList.add("on"); one("[data-pro-order-close]", box)?.addEventListener("click", () => window.GG?.closeModal?.());
    one("[data-pro-submit-orders]", box)?.addEventListener("click", async (event) => {
      const orders = [], buyText = one("[data-order-buy-mc]", box)?.value.trim() || "", buyMc = parseMarketCap(buyText), buySol = Number(one("[data-order-buy-sol]", box)?.value || 0);
      if (buyText) { if (!buyMc || buySol < .005) { toast("Add a valid buy MC and at least 0.005 SOL", true); return; } orders.push({ side: "buy", targetMarketCapUsd: buyMc, amountSol: buySol }); }
      const targets = String(one("[data-order-ladder-mc]", box)?.value || "").split(",").map(parseMarketCap).filter((value) => value > 0).slice(0, 4), sells = String(one("[data-order-ladder-sell]", box)?.value || "").split(",").map(Number);
      targets.forEach((target, index) => orders.push({ side: "sell", targetMarketCapUsd: target, sellPercent: sells[index] > 0 ? sells[index] : Math.max(1, Math.floor(100 / targets.length)) }));
      const stop = parseMarketCap(one("[data-order-stop-mc]", box)?.value), stopSell = Number(one("[data-order-stop-sell]", box)?.value || 100); if (stop) orders.push({ side: "sell", targetMarketCapUsd: stop, sellPercent: stopSell });
      if (!orders.length) { toast("Add a buy target, profit target, or stop loss", true); return; }
      if (orders.some((order) => order.side === "sell" && (!(order.sellPercent >= 1) || order.sellPercent > 100))) { toast("Sell percentages must be 1–100%", true); return; }
      event.currentTarget.disabled = true; event.currentTarget.textContent = "Arming…";
      await request("/api/web/profile/automation", { method: "POST", body: JSON.stringify({ action: "enable" }) });
      const currentMc = parseMarketCap(mcText), result = await request("/api/web/market-orders", { method: "POST", body: JSON.stringify({ token: context.token, symbol: context.symbol, walletIndex: String(wallet), currentMarketCapUsd: currentMc, orders }) });
      event.currentTarget.disabled = false; event.currentTarget.textContent = "Arm selected orders";
      if (!result.ok || !result.data?.ok) { toast(result.data?.message || result.data?.error || "Could not arm orders", true); return; }
      toast(`${result.data.armed?.length || orders.length} order${orders.length === 1 ? "" : "s"} armed`); await refreshOrders(context);
    });
    await refreshOrders(context);
  }

  function applyToolPrefill() {
    const token = localStorage.getItem(TOOL_PREFILL_KEY); if (!token) return;
    const input = one("#bnCa") || one("#vlCa"); if (!input) return;
    if (!input.value) { input.value = token; input.dispatchEvent(new Event("input", { bubbles: true })); }
    localStorage.removeItem(TOOL_PREFILL_KEY);
  }

  function scan() {
    all("#v-trade .trade, #v-rhtrade .trade").forEach(injectTradeWorkspace);
    applyToolPrefill();
  }

  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement) { all(".trade.proFullscreen").forEach((trade) => trade.classList.remove("proFullscreen")); document.body.classList.remove("proNoScroll"); } });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") { all(".trade.proFullscreen").forEach((trade) => trade.classList.remove("proFullscreen")); document.body.classList.remove("proNoScroll"); } });
  let scanQueued = false;
  function scheduleScan() { if (scanQueued) return; scanQueued = true; requestAnimationFrame(() => { scanQueued = false; scan(); }); }
  const observer = new MutationObserver(scheduleScan); observer.observe(document.documentElement, { childList: true, subtree: true });
  window.SlimeWirePro = { scan, openMarketOrders: () => { const trade = one("#v-trade .trade, #v-rhtrade .trade"); if (trade) openMarketOrders(trade); } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan, { once: true }); else scan();
})();
