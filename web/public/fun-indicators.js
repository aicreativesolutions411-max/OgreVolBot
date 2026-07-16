"use strict";

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const API_BASE = window.OGRE_PORTAL_CONFIG?.apiBase || location.origin;
  const STORAGE_KEY = "slimewireFunIndicators:v1";
  const FIB_STORAGE_KEY = "slimewireFunFibSettings:v1";
  const DEFAULT_FIB_SETTINGS = Object.freeze({
    lookback: 120,
    levels: [
      { ratio: 0, enabled: true, color: "#72ff23", style: 0 },
      { ratio: 0.236, enabled: true, color: "#8dff52", style: 2 },
      { ratio: 0.382, enabled: true, color: "#a5ff6f", style: 2 },
      { ratio: 0.5, enabled: true, color: "#d1ff9c", style: 0 },
      { ratio: 0.618, enabled: true, color: "#f2ff7a", style: 0 },
      { ratio: 0.786, enabled: true, color: "#a5ff6f", style: 2 },
      { ratio: 1, enabled: true, color: "#72ff23", style: 0 },
      { ratio: 1.272, enabled: false, color: "#ffca54", style: 2 },
      { ratio: 1.618, enabled: false, color: "#ff8b54", style: 2 }
    ]
  });
  const TF_MAP = { "1": "1m", "5": "5m", "15": "15m", "60": "1h" };
  const AUTO_REFRESH_MS = 25_000;
  const CANDLE_TIMEOUT_MS = 6_500;
  const enabled = readEnabled();
  let fibSettings = readFibSettings();
  const candleCache = new Map();
  const pendingCandleRequests = new Map();
  const geckoPoolCache = new Map();
  let requestVersion = 0;
  let refreshTimer = null;
  let autoRefreshTimer = null;
  let nativeChart = null;
  let nativeResizeObserver = null;
  let analysisActive = false;

  function readEnabled() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return { fib: Boolean(value?.fib), rsi: Boolean(value?.rsi), macd: Boolean(value?.macd) };
    } catch { return { fib: false, rsi: false, macd: false }; }
  }
  function saveEnabled() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled)); } catch {} }
  function defaultFibSettings() { return { lookback: DEFAULT_FIB_SETTINGS.lookback, levels: DEFAULT_FIB_SETTINGS.levels.map((level) => ({ ...level })) }; }
  function normalizeFibLevel(level, fallback = {}) {
    const ratio = Number(level?.ratio);
    const color = /^#[0-9a-f]{6}$/i.test(String(level?.color || "")) ? String(level.color) : (fallback.color || "#72ff23");
    const style = [0, 1, 2].includes(Number(level?.style)) ? Number(level.style) : Number(fallback.style || 0);
    return { ratio: Number.isFinite(ratio) ? Math.max(-5, Math.min(10, ratio)) : Number(fallback.ratio || 0), enabled: level?.enabled !== false, color, style };
  }
  function readFibSettings() {
    const defaults = defaultFibSettings();
    try {
      const value = JSON.parse(localStorage.getItem(FIB_STORAGE_KEY) || "null");
      const lookback = [60, 120, 240].includes(Number(value?.lookback)) ? Number(value.lookback) : defaults.lookback;
      const levels = Array.isArray(value?.levels) && value.levels.length
        ? value.levels.slice(0, 12).map((level, index) => normalizeFibLevel(level, defaults.levels[index] || defaults.levels[0]))
        : defaults.levels;
      return { lookback, levels };
    } catch { return defaults; }
  }
  function saveFibSettings() { try { localStorage.setItem(FIB_STORAGE_KEY, JSON.stringify(fibSettings)); } catch {} }
  function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])); }
  function fibRatioLabel(ratio) { return Number.isInteger(ratio) ? String(ratio) : String(Number(ratio.toFixed(3))); }
  function renderFibSettings() {
    const panel = $("[data-fib-settings]");
    if (!panel || panel.hidden) return;
    const rows = fibSettings.levels.map((level, index) => `<div class="fib-setting-row" data-fib-level="${index}"><label class="fib-level-toggle" title="Show this level"><input type="checkbox" data-fib-field="enabled" ${level.enabled ? "checked" : ""}><span></span></label><input class="fib-ratio-input" type="number" min="-5" max="10" step="0.001" inputmode="decimal" value="${escapeHtml(fibRatioLabel(level.ratio))}" data-fib-field="ratio" aria-label="Fibonacci level ${index + 1}"><input class="fib-color-input" type="color" value="${escapeHtml(level.color)}" data-fib-field="color" aria-label="Level color"><select data-fib-field="style" aria-label="Line style"><option value="0" ${level.style === 0 ? "selected" : ""}>Solid</option><option value="2" ${level.style === 2 ? "selected" : ""}>Dashed</option><option value="1" ${level.style === 1 ? "selected" : ""}>Dotted</option></select><button type="button" class="fib-remove" data-fib-remove="${index}" aria-label="Remove level">×</button></div>`).join("");
    panel.innerHTML = `<div class="fib-settings-head"><div><b>Fibonacci settings</b><span>Customize retracement paint</span></div><button type="button" data-fib-settings-close aria-label="Close Fibonacci settings">×</button></div><div class="fib-settings-controls"><label class="fib-show"><input type="checkbox" data-fib-enabled ${enabled.fib ? "checked" : ""}><span>Show Fibonacci on chart</span></label><label class="fib-lookback"><span>Swing window</span><select data-fib-lookback><option value="60" ${fibSettings.lookback === 60 ? "selected" : ""}>60 candles</option><option value="120" ${fibSettings.lookback === 120 ? "selected" : ""}>120 candles</option><option value="240" ${fibSettings.lookback === 240 ? "selected" : ""}>240 candles</option></select></label></div><div class="fib-level-heading"><span>On</span><span>Level</span><span>Color</span><span>Line</span><span></span></div><div class="fib-setting-rows">${rows}</div><div class="fib-settings-actions"><button type="button" data-fib-add ${fibSettings.levels.length >= 12 ? "disabled" : ""}>＋ Add level</button><button type="button" data-fib-reset>Restore defaults</button></div>`;
  }
  function openFibSettings() {
    const panel = $("[data-fib-settings]");
    if (!panel) return;
    panel.hidden = false;
    renderFibSettings();
  }
  function closeFibSettings() {
    const panel = $("[data-fib-settings]");
    if (panel) panel.hidden = true;
  }
  function selectedKey() {
    const match = String(location.hash || "").match(/^#coin\/(.+)$/);
    if (match) {
      try { return decodeURIComponent(match[1]).trim(); } catch { return match[1].trim(); }
    }
    return String(new URLSearchParams(location.search).get("ca") || "").trim();
  }
  function activeTimeframe() {
    const value = $("[data-chart-interval].active")?.dataset.chartInterval || "15";
    return TF_MAP[value] || "15m";
  }
  function isRobinhood(key) { return /^0x[0-9a-f]{40}$/i.test(String(key || "")); }
  function anyEnabled() { return enabled.fib || enabled.rsi || enabled.macd; }
  function setStatus(message, error = false) {
    const status = $("[data-indicator-status]");
    if (!status) return;
    status.hidden = !message;
    status.classList.toggle("error", error);
    status.textContent = message || "";
  }
  function syncButtons() {
    const count = Object.values(enabled).filter(Boolean).length;
    $$('[data-indicator-kind]').forEach((button) => {
      const active = Boolean(enabled[button.dataset.indicatorKind]);
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const trigger = $("[data-indicators-toggle]");
    trigger?.classList.toggle("active", analysisActive);
    trigger?.setAttribute("aria-pressed", String(analysisActive));
    if (trigger) trigger.textContent = count ? `⌁ Indicators · ${count}` : "⌁ Indicators";
    const transactions = $('[data-chart-mode="transactions"]')?.classList.contains("active");
    $('[data-chart-mode="chart"]')?.classList.toggle("active", !analysisActive && !transactions);
  }
  function toggleDrawer(force, renderWhenOpen = true) {
    const drawer = $("[data-indicator-drawer]");
    const card = drawer?.closest(".chart-card");
    const trigger = $("[data-indicators-toggle]");
    if (!drawer || !card || !trigger) return;
    const open = typeof force === "boolean" ? force : drawer.hidden;
    drawer.hidden = !open;
    card.classList.toggle("indicators-open", open);
    trigger.setAttribute("aria-expanded", String(open));
    syncButtons();
    if (open && renderWhenOpen && analysisActive) void renderIndicators();
  }
  function scheduleRender(delay = 0) {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      if (analysisActive && anyEnabled()) void renderIndicators();
    }, delay);
  }
  function indicatorSurfaceActive() {
    const coinView = $(".coin-view");
    const transactions = $('[data-chart-mode="transactions"]')?.classList.contains("active");
    return Boolean(analysisActive && coinView?.classList.contains("active") && !transactions && !document.hidden && anyEnabled());
  }
  function scheduleAutoRefresh() {
    clearTimeout(autoRefreshTimer);
    if (!indicatorSurfaceActive()) return;
    autoRefreshTimer = setTimeout(() => void renderIndicators({ background: true }), AUTO_REFRESH_MS);
  }
  function syncChartMode() {
    const transactions = $('[data-chart-mode="transactions"]')?.classList.contains("active");
    const trigger = $("[data-indicators-toggle]");
    if (trigger) trigger.hidden = Boolean(transactions);
    if (transactions) toggleDrawer(false, false);
    syncButtons();
  }

  function normalizeCandles(rows) {
    return (Array.isArray(rows) ? rows : []).map((row) => ({
      t: Number(row?.t) || 0,
      o: Number(row?.o) || 0,
      h: Number(row?.h) || 0,
      l: Number(row?.l) || 0,
      c: Number(row?.c) || 0,
      v: Number(row?.v) || 0
    })).filter((row) => row.t > 0 && row.h > 0 && row.l > 0 && row.c > 0).sort((a, b) => a.t - b.t);
  }
  function normalizeGeckoCandles(rows) {
    return normalizeCandles((Array.isArray(rows) ? rows : []).map((row) => ({
      t: row?.[0], o: row?.[1], h: row?.[2], l: row?.[3], c: row?.[4], v: row?.[5]
    })));
  }
  function geckoTimeframe(timeframe) {
    if (timeframe === "1h") return { path: "hour", aggregate: 1 };
    const aggregate = Number.parseInt(timeframe, 10);
    return { path: "minute", aggregate: [1, 5, 15].includes(aggregate) ? aggregate : 15 };
  }
  async function fetchCandleJson(url, timeoutMs = CANDLE_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
      if (!response.ok) throw new Error(`Candle request failed (${response.status})`);
      return await response.json();
    } finally { clearTimeout(timeout); }
  }
  function validGeckoPool(network, value) {
    const pool = String(value || "").trim().replace(new RegExp(`^${network}_`, "i"), "");
    if (network === "robinhood") return /^0x[0-9a-f]{40}$/i.test(pool) ? pool.toLowerCase() : "";
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(pool) ? pool : "";
  }
  function geckoRelationAddress(network, value) {
    return String(value || "").trim().replace(new RegExp(`^${network}_`, "i"), "");
  }
  async function resolveBrowserGeckoPool(network, token) {
    const cacheKey = `${network}:${String(token).toLowerCase()}`;
    const cached = geckoPoolCache.get(cacheKey);
    if (cached && Date.now() - cached.at < 2 * 60_000) return cached.value;
    const payload = await fetchCandleJson(`https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${encodeURIComponent(token)}/pools?page=1`);
    const target = String(token).toLowerCase();
    const candidates = (Array.isArray(payload?.data) ? payload.data : []).map((row) => {
      const base = geckoRelationAddress(network, row?.relationships?.base_token?.data?.id).toLowerCase();
      const quote = geckoRelationAddress(network, row?.relationships?.quote_token?.data?.id).toLowerCase();
      const side = base === target ? "base" : quote === target ? "quote" : "";
      const pool = validGeckoPool(network, row?.attributes?.address || row?.id);
      const liquidity = Number(row?.attributes?.reserve_in_usd) || 0;
      const volume24 = Number(row?.attributes?.volume_usd?.h24) || 0;
      return { pool, side, liquidity, volume24, score: liquidity + volume24 * 0.08 };
    }).filter((row) => row.pool && row.side).sort((a, b) => b.score - a.score || b.liquidity - a.liquidity);
    const value = candidates[0] || null;
    geckoPoolCache.set(cacheKey, { at: Date.now(), value });
    return value;
  }
  async function loadBrowserGeckoCandles(network, key, timeframe, knownPool, knownSide) {
    const resolvedPool = validGeckoPool(network, knownPool);
    const market = resolvedPool
      ? { pool: resolvedPool, side: knownSide === "quote" ? "quote" : "base" }
      : await resolveBrowserGeckoPool(network, key);
    if (!market?.pool) return { candles: [], source: "geckoterminal browser", stale: false };
    const tf = geckoTimeframe(timeframe);
    const payload = await fetchCandleJson(`https://api.geckoterminal.com/api/v2/networks/${network}/pools/${encodeURIComponent(market.pool)}/ohlcv/${tf.path}?aggregate=${tf.aggregate}&limit=300&currency=usd&token=${market.side}`);
    return { candles: normalizeGeckoCandles(payload?.data?.attributes?.ohlcv_list), source: "geckoterminal browser", stale: false };
  }
  async function loadCandles(key, timeframe) {
    const frame = $("[data-chart-frame]");
    const pool = String(frame?.dataset.poolAddress || "").trim();
    const side = frame?.dataset.tokenSide === "quote" ? "quote" : "base";
    const robinhood = isRobinhood(key);
    const network = robinhood ? "robinhood" : "solana";
    const cacheKey = `${network}:${key.toLowerCase()}:${pool.toLowerCase()}:${side}:${timeframe}`;
    const cached = candleCache.get(cacheKey);
    if (cached && Date.now() - cached.at < 12_000) return cached.payload;
    if (pendingCandleRequests.has(cacheKey)) return pendingCandleRequests.get(cacheKey);
    const pending = (async () => {
      let primaryError = null;
      if (!robinhood) {
        try {
          const payload = await fetchCandleJson(`${API_BASE}/api/chart?ca=${encodeURIComponent(key)}&tf=${encodeURIComponent(timeframe)}`);
          const nativeResult = { candles: normalizeCandles(payload?.candles), source: String(payload?.source || "native chart"), stale: false };
          if (nativeResult.candles.length) {
            candleCache.set(cacheKey, { at: Date.now(), payload: nativeResult });
            return nativeResult;
          }
        } catch (error) { primaryError = error; }
      }
      try {
        const fallback = await loadBrowserGeckoCandles(network, key, timeframe, pool, side);
        if (fallback.candles.length) candleCache.set(cacheKey, { at: Date.now(), payload: fallback });
        return fallback;
      } catch (error) {
        throw primaryError || error;
      }
    })();
    pendingCandleRequests.set(cacheKey, pending);
    try { return await pending; }
    finally { if (pendingCandleRequests.get(cacheKey) === pending) pendingCandleRequests.delete(cacheKey); }
  }

  function fmtPrice(value) {
    const number = Number(value);
    if (!(number > 0)) return "—";
    if (number >= 1000) return `$${number.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    if (number >= 1) return `$${number.toFixed(3)}`;
    if (number >= 0.001) return `$${number.toFixed(6)}`;
    return `$${number.toPrecision(4)}`;
  }
  function pointsPath(values, xAt, yAt) {
    let path = "";
    values.forEach((value, index) => {
      if (!Number.isFinite(value)) return;
      path += `${path ? "L" : "M"}${xAt(index).toFixed(2)},${yAt(value).toFixed(2)}`;
    });
    return path;
  }
  function linePanel(title, subtitle, valueLabel, body) {
    return `<article class="indicator-panel"><header><div><b>${escapeHtml(title)}</b><span>${escapeHtml(subtitle)}</span></div><strong>${escapeHtml(valueLabel)}</strong></header>${body}</article>`;
  }
  function emptyPanel(title, message) {
    return `<article class="indicator-panel"><header><div><b>${escapeHtml(title)}</b><span>Waiting for enough history</span></div></header><div class="indicator-panel-empty">${escapeHtml(message)}</div></article>`;
  }

  function fibonacciPanel(candles) {
    const rows = candles.slice(-120);
    if (rows.length < 2) return emptyPanel("Fibonacci", "At least two candles are needed.");
    let highIndex = 0, lowIndex = 0;
    rows.forEach((row, index) => {
      if (row.h > rows[highIndex].h) highIndex = index;
      if (row.l < rows[lowIndex].l) lowIndex = index;
    });
    const high = rows[highIndex].h, low = rows[lowIndex].l, span = high - low;
    if (!(span > 0)) return emptyPanel("Fibonacci", "The current candle range is flat.");
    const risingSwing = highIndex > lowIndex;
    const ratios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const levels = ratios.map((ratio) => ({ ratio, price: risingSwing ? high - span * ratio : low + span * ratio }));
    const width = 360, height = 132, left = 10, right = 62, top = 9, bottom = 13;
    const plotWidth = width - left - right, plotHeight = height - top - bottom;
    const xAt = (index) => left + (index / Math.max(1, rows.length - 1)) * plotWidth;
    const yAt = (price) => top + ((high - price) / span) * plotHeight;
    const closePath = pointsPath(rows.map((row) => row.c), xAt, yAt);
    const levelSvg = levels.map(({ ratio, price }, index) => {
      const y = yAt(price), strong = ratio === 0.5 || ratio === 0.618;
      const color = strong ? "#72ff23" : index % 2 ? "#7ad84b" : "#3d6f35";
      return `<line x1="${left}" y1="${y.toFixed(2)}" x2="${(width - right).toFixed(2)}" y2="${y.toFixed(2)}" stroke="${color}" stroke-width="${strong ? 1.2 : 0.75}" stroke-dasharray="${strong ? "0" : "3 3"}" opacity="${strong ? 0.8 : 0.58}"/><text class="fib-level-label" x="${width - right + 5}" y="${(y + 2.5).toFixed(2)}">${Math.round(ratio * 1000) / 10}%</text>`;
    }).join("");
    const svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Fibonacci levels calculated from the recent candle swing"><defs><linearGradient id="fibGlow" x1="0" x2="1"><stop stop-color="#58dc22" stop-opacity=".18"/><stop offset="1" stop-color="#c4ff8c" stop-opacity=".85"/></linearGradient></defs>${levelSvg}<path d="${closePath}" fill="none" stroke="url(#fibGlow)" stroke-width="1.7"/><circle cx="${xAt(rows.length - 1).toFixed(2)}" cy="${yAt(rows.at(-1).c).toFixed(2)}" r="2.5" fill="#b8ff75"/></svg>`;
    return linePanel("Fibonacci", `Recent ${rows.length}-candle ${risingSwing ? "upswing" : "downswing"} · ${fmtPrice(low)}–${fmtPrice(high)}`, `61.8% ${fmtPrice(levels[4].price)}`, svg);
  }

  function rsiSeries(values, period = 14) {
    const output = Array(values.length).fill(null);
    if (values.length <= period) return output;
    let gain = 0, loss = 0;
    for (let index = 1; index <= period; index += 1) {
      const change = values[index] - values[index - 1];
      gain += Math.max(0, change);
      loss += Math.max(0, -change);
    }
    let averageGain = gain / period, averageLoss = loss / period;
    const valueAt = () => averageLoss === 0 ? (averageGain === 0 ? 50 : 100) : 100 - (100 / (1 + averageGain / averageLoss));
    output[period] = valueAt();
    for (let index = period + 1; index < values.length; index += 1) {
      const change = values[index] - values[index - 1];
      averageGain = ((averageGain * (period - 1)) + Math.max(0, change)) / period;
      averageLoss = ((averageLoss * (period - 1)) + Math.max(0, -change)) / period;
      output[index] = valueAt();
    }
    return output;
  }
  function rsiPanel(candles) {
    const rows = candles.slice(-160), values = rsiSeries(rows.map((row) => row.c));
    const valid = values.filter(Number.isFinite);
    if (!valid.length) return emptyPanel("RSI (14)", "15 candles are needed for RSI.");
    const width = 360, height = 108, left = 10, right = 30, top = 7, bottom = 12;
    const xAt = (index) => left + (index / Math.max(1, values.length - 1)) * (width - left - right);
    const yAt = (value) => top + ((100 - value) / 100) * (height - top - bottom);
    const path = pointsPath(values, xAt, yAt), last = valid.at(-1);
    const svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Relative Strength Index 14"><rect x="${left}" y="${yAt(70).toFixed(2)}" width="${width - left - right}" height="${(yAt(30) - yAt(70)).toFixed(2)}" fill="rgba(114,255,35,.035)"/><line x1="${left}" y1="${yAt(70)}" x2="${width - right}" y2="${yAt(70)}" stroke="#406235" stroke-dasharray="3 3"/><line x1="${left}" y1="${yAt(30)}" x2="${width - right}" y2="${yAt(30)}" stroke="#406235" stroke-dasharray="3 3"/><line x1="${left}" y1="${yAt(50)}" x2="${width - right}" y2="${yAt(50)}" stroke="#213221"/><text class="indicator-axis-label" x="${width - 24}" y="${yAt(70) + 2.5}">70</text><text class="indicator-axis-label" x="${width - 24}" y="${yAt(30) + 2.5}">30</text><path d="${path}" fill="none" stroke="#9cff58" stroke-width="1.8"/><circle cx="${xAt(values.length - 1)}" cy="${yAt(last)}" r="2.4" fill="#d2ffb2"/></svg>`;
    const zone = last >= 70 ? "Above 70" : last <= 30 ? "Below 30" : "Neutral band";
    return linePanel("RSI (14)", zone, last.toFixed(1), svg);
  }

  function emaSeries(values, period) {
    const output = Array(values.length).fill(null);
    if (values.length < period) return output;
    let ema = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
    output[period - 1] = ema;
    const multiplier = 2 / (period + 1);
    for (let index = period; index < values.length; index += 1) {
      ema = ((values[index] - ema) * multiplier) + ema;
      output[index] = ema;
    }
    return output;
  }
  function macdSeries(values) {
    const fast = emaSeries(values, 12), slow = emaSeries(values, 26);
    const macd = values.map((_, index) => Number.isFinite(fast[index]) && Number.isFinite(slow[index]) ? fast[index] - slow[index] : null);
    const first = macd.findIndex(Number.isFinite);
    if (first < 0) return { macd, signal: Array(values.length).fill(null), histogram: Array(values.length).fill(null) };
    const compactSignal = emaSeries(macd.slice(first), 9);
    const signal = Array(values.length).fill(null);
    compactSignal.forEach((value, index) => { if (Number.isFinite(value)) signal[first + index] = value; });
    const histogram = macd.map((value, index) => Number.isFinite(value) && Number.isFinite(signal[index]) ? value - signal[index] : null);
    return { macd, signal, histogram };
  }
  function macdPanel(candles) {
    const rows = candles.slice(-180), series = macdSeries(rows.map((row) => row.c));
    const validMacd = series.macd.filter(Number.isFinite), validSignal = series.signal.filter(Number.isFinite);
    if (!validSignal.length) return emptyPanel("MACD (12, 26, 9)", "34 candles are needed for MACD and its signal line.");
    const all = [...validMacd, ...validSignal, ...series.histogram.filter(Number.isFinite)];
    const maxAbs = Math.max(...all.map((value) => Math.abs(value)), Number.EPSILON);
    const width = 360, height = 114, left = 10, right = 9, top = 8, bottom = 11, zeroY = top + (height - top - bottom) / 2;
    const xAt = (index) => left + (index / Math.max(1, rows.length - 1)) * (width - left - right);
    const yAt = (value) => zeroY - (value / maxAbs) * ((height - top - bottom) * 0.44);
    const barWidth = Math.max(1, (width - left - right) / Math.max(1, rows.length) * 0.7);
    const bars = series.histogram.map((value, index) => Number.isFinite(value) ? `<rect x="${(xAt(index) - barWidth / 2).toFixed(2)}" y="${Math.min(zeroY, yAt(value)).toFixed(2)}" width="${barWidth.toFixed(2)}" height="${Math.max(0.7, Math.abs(yAt(value) - zeroY)).toFixed(2)}" fill="${value >= 0 ? "rgba(114,255,35,.38)" : "rgba(255,82,111,.42)"}"/>` : "").join("");
    const macdPath = pointsPath(series.macd, xAt, yAt), signalPath = pointsPath(series.signal, xAt, yAt);
    const lastMacd = validMacd.at(-1), lastSignal = validSignal.at(-1), positive = lastMacd >= lastSignal;
    const svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Moving Average Convergence Divergence 12 26 9"><line x1="${left}" y1="${zeroY}" x2="${width - right}" y2="${zeroY}" stroke="#263526"/>${bars}<path d="${macdPath}" fill="none" stroke="#8fff49" stroke-width="1.55"/><path d="${signalPath}" fill="none" stroke="#c781ff" stroke-width="1.35"/></svg>`;
    return linePanel("MACD (12, 26, 9)", positive ? "MACD above signal" : "MACD below signal", `${positive ? "+" : "−"} spread`, svg);
  }

  function destroyNativeChart() {
    nativeResizeObserver?.disconnect();
    nativeResizeObserver = null;
    if (nativeChart) {
      try { nativeChart.remove(); } catch {}
      nativeChart = null;
    }
  }

  function restoreProviderChart() {
    const frame = $("[data-chart-frame]");
    const card = frame?.closest(".chart-card");
    destroyNativeChart();
    card?.classList.remove("indicator-analysis-open");
    if (frame?.querySelector("[data-indicator-analysis]")) window.SlimeWireFunChart?.render?.();
  }

  function analysisHeader(subtitle, badge = "LIVE") {
    return `<div class="analysis-head"><div><b>SLIME ANALYSIS</b><span>${escapeHtml(subtitle)}</span></div><div class="analysis-head-actions"><em>${escapeHtml(badge)}</em><button type="button" data-analysis-back aria-label="Return to regular chart">↩ Chart</button></div></div>`;
  }

  function activateAnalysis({ openDrawer = true } = {}) {
    analysisActive = true;
    requestVersion += 1;
    clearTimeout(autoRefreshTimer);
    window.SlimeWireFunChart?.setMode?.("chart");
    if (openDrawer) toggleDrawer(true, false);
    syncButtons();
    if (anyEnabled()) void renderIndicators();
    else setStatus("Choose one or stack all three.");
  }

  function deactivateAnalysis({ closeDrawer = true } = {}) {
    analysisActive = false;
    requestVersion += 1;
    clearTimeout(refreshTimer);
    clearTimeout(autoRefreshTimer);
    restoreProviderChart();
    if (closeDrawer) toggleDrawer(false, false);
    syncButtons();
  }

  function mountAnalysisLoading(timeframe) {
    const frame = $("[data-chart-frame]");
    if (!frame) return;
    destroyNativeChart();
    frame.closest(".chart-card")?.classList.add("indicator-analysis-open");
    frame.innerHTML = `<div class="indicator-analysis indicator-analysis-loading" data-indicator-analysis>${analysisHeader(`Native candle chart · ${timeframe}`)}<div class="analysis-loading"><span></span><b>Loading candle history</b><small>Painting your selected indicators directly on the chart…</small></div></div>`;
  }

  function fibonacciPriceLines(candles) {
    const rows = candles.slice(-fibSettings.lookback);
    if (rows.length < 2) return [];
    let highIndex = 0, lowIndex = 0;
    rows.forEach((row, index) => {
      if (row.h > rows[highIndex].h) highIndex = index;
      if (row.l < rows[lowIndex].l) lowIndex = index;
    });
    const high = rows[highIndex].h, low = rows[lowIndex].l, span = high - low;
    if (!(span > 0)) return [];
    const risingSwing = highIndex > lowIndex;
    return fibSettings.levels.filter((level) => level.enabled).map((level) => ({
      ...level,
      price: risingSwing ? high - span * level.ratio : low + span * level.ratio
    }));
  }

  function nativeAnalysisMarkup(candles, source, timeframe, stale) {
    const activeLabels = [enabled.fib && "Fibonacci", enabled.rsi && "RSI 14", enabled.macd && "MACD"].filter(Boolean);
    const panels = [enabled.rsi && rsiPanel(candles), enabled.macd && macdPanel(candles)].filter(Boolean).join("");
    return `<div class="indicator-analysis" data-indicator-analysis>${analysisHeader(`${activeLabels.join(" + ")} · ${timeframe}`)}<div class="analysis-price" data-analysis-price aria-label="Candlestick chart with selected technical indicators"></div>${panels}<div class="analysis-source">${escapeHtml(source.replace(/[-_]/g, " "))}${stale ? " · cached fallback" : ""} · ${candles.length} candles${enabled.fib ? ` · ${Math.min(fibSettings.lookback, candles.length)}-bar Fib window` : ""}</div></div>`;
  }

  function mountNativeAnalysis(candles, source, timeframe, stale) {
    const frame = $("[data-chart-frame]");
    if (!frame) return false;
    destroyNativeChart();
    frame.closest(".chart-card")?.classList.add("indicator-analysis-open");
    frame.innerHTML = nativeAnalysisMarkup(candles, source, timeframe, stale);
    const priceNode = $("[data-analysis-price]", frame);
    if (!priceNode || typeof window.LightweightCharts?.createChart !== "function") {
      priceNode?.insertAdjacentHTML("beforeend", '<div class="analysis-empty"><b>Chart engine unavailable</b><small>Refresh once to finish the update.</small></div>');
      return false;
    }
    const last = candles.at(-1)?.c || 0;
    const precision = last > 0 ? Math.min(10, Math.max(2, Math.ceil(-Math.log10(last)) + 3)) : 6;
    nativeChart = window.LightweightCharts.createChart(priceNode, {
      width: Math.max(280, priceNode.clientWidth),
      height: priceNode.clientHeight || 250,
      layout: { background: { color: "#030603" }, textColor: "#8ea48a", fontFamily: "Inter, system-ui, sans-serif" },
      grid: { vertLines: { color: "rgba(114,255,35,.055)" }, horzLines: { color: "rgba(114,255,35,.055)" } },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: "rgba(114,255,35,.16)", scaleMargins: { top: 0.08, bottom: 0.22 } },
      timeScale: { borderColor: "rgba(114,255,35,.16)", timeVisible: true, secondsVisible: timeframe === "1m", rightOffset: 3, barSpacing: 7 },
      handleScroll: true,
      handleScale: true
    });
    const candleSeries = nativeChart.addCandlestickSeries({
      upColor: "#72ff23", downColor: "#ff526f", borderUpColor: "#72ff23", borderDownColor: "#ff526f",
      wickUpColor: "#b7ff8c", wickDownColor: "#ff7890",
      priceFormat: { type: "price", precision, minMove: Number((1 / Math.pow(10, precision)).toFixed(precision)) }
    });
    candleSeries.setData(candles.map((row) => ({ time: row.t, open: row.o, high: row.h, low: row.l, close: row.c })));
    const volumeSeries = nativeChart.addHistogramSeries({ priceFormat: { type: "volume" }, priceScaleId: "volume", lastValueVisible: false, priceLineVisible: false });
    nativeChart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volumeSeries.setData(candles.map((row) => ({ time: row.t, value: row.v, color: row.c >= row.o ? "rgba(114,255,35,.25)" : "rgba(255,82,111,.28)" })));
    if (enabled.fib) {
      fibonacciPriceLines(candles).forEach(({ ratio, price, color, style }) => {
        const strong = ratio === 0.5 || ratio === 0.618;
        candleSeries.createPriceLine({
          price,
          color,
          lineWidth: strong ? 2 : 1,
          lineStyle: style,
          axisLabelVisible: true,
          title: `Fib ${Math.round(ratio * 1000) / 10}%`
        });
      });
    }
    nativeChart.timeScale().fitContent();
    nativeResizeObserver = new ResizeObserver(() => {
      if (nativeChart && priceNode.isConnected) nativeChart.applyOptions({ width: Math.max(280, priceNode.clientWidth) });
    });
    nativeResizeObserver.observe(priceNode);
    return true;
  }

  function showProviderFallback(message) {
    analysisActive = false;
    clearTimeout(autoRefreshTimer);
    restoreProviderChart();
    syncButtons();
    const panels = $("[data-indicator-panels]");
    if (panels) panels.innerHTML = `<div class="analysis-fallback"><b>Regular chart restored</b><small>${escapeHtml(message)}</small><button type="button" data-indicator-retry>Retry analysis</button></div>`;
    toggleDrawer(true, false);
    setStatus("Regular chart is available while indicator candles catch up.", true);
  }

  async function renderIndicators({ background = false } = {}) {
    const version = ++requestVersion;
    syncButtons();
    const panels = $("[data-indicator-panels]");
    if (!panels) return;
    if (!analysisActive) { clearTimeout(autoRefreshTimer); return; }
    if ($('[data-chart-mode="transactions"]')?.classList.contains("active")) {
      destroyNativeChart();
      $("[data-chart-frame]")?.closest(".chart-card")?.classList.remove("indicator-analysis-open");
      clearTimeout(autoRefreshTimer);
      return;
    }
    if (!anyEnabled()) { analysisActive = false; clearTimeout(autoRefreshTimer); panels.innerHTML = ""; setStatus("Choose one or stack all three."); restoreProviderChart(); syncButtons(); return; }
    const key = selectedKey();
    if (!key) { clearTimeout(autoRefreshTimer); panels.innerHTML = ""; setStatus("Open a coin chart first.", true); return; }
    const timeframe = activeTimeframe();
    if (!background) {
      panels.innerHTML = "";
      setStatus(`Mixing real ${isRobinhood(key) ? "Robinhood" : "Solana"} candles into Slime paint…`);
      mountAnalysisLoading(timeframe);
    }
    try {
      const payload = await loadCandles(key, timeframe);
      if (version !== requestVersion || key !== selectedKey() || timeframe !== activeTimeframe() || !indicatorSurfaceActive()) return;
      if (!payload.candles.length) {
        if (background) { setStatus("Live refresh delayed — keeping the current analysis.", true); return; }
        showProviderFallback("This pool is still being indexed. The regular chart stays usable; retry analysis in a few seconds.");
        return;
      }
      const freshness = payload.stale ? " · cached fallback" : "";
      mountNativeAnalysis(payload.candles, payload.source, timeframe, payload.stale);
      panels.innerHTML = `<div class="indicator-source">Painted on the chart · ${escapeHtml(payload.source.replace(/[-_]/g, " "))}${freshness} · ${payload.candles.length} candles · ${escapeHtml(timeframe)}</div>`;
      setStatus("");
    } catch {
      if (version !== requestVersion) return;
      if (background) { setStatus("Live refresh delayed — keeping the current analysis.", true); return; }
      showProviderFallback("Candle history timed out. The regular chart stays usable while the analysis feed catches up.");
    } finally { if (version === requestVersion) scheduleAutoRefresh(); }
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-indicators-toggle]")) {
      if (!analysisActive) activateAnalysis({ openDrawer: true });
      else toggleDrawer();
      return;
    }
    if (event.target.closest("[data-analysis-back]")) { deactivateAnalysis({ closeDrawer: true }); return; }
    if (event.target.closest("[data-fib-settings-close]")) { closeFibSettings(); return; }
    if (event.target.closest("[data-fib-reset]")) {
      fibSettings = defaultFibSettings();
      saveFibSettings();
      renderFibSettings();
      scheduleRender(0);
      return;
    }
    if (event.target.closest("[data-fib-add]")) {
      if (fibSettings.levels.length < 12) {
        fibSettings.levels.push({ ratio: 1.618, enabled: true, color: "#ffca54", style: 2 });
        saveFibSettings();
        renderFibSettings();
        scheduleRender(0);
      }
      return;
    }
    const removeLevel = event.target.closest("[data-fib-remove]");
    if (removeLevel) {
      const index = Number(removeLevel.dataset.fibRemove);
      if (Number.isInteger(index) && fibSettings.levels.length > 1) fibSettings.levels.splice(index, 1);
      saveFibSettings();
      renderFibSettings();
      scheduleRender(0);
      return;
    }
    const indicator = event.target.closest("[data-indicator-kind]");
    if (indicator) {
      const kind = indicator.dataset.indicatorKind;
      if (!(kind in enabled)) return;
      if (kind === "fib") {
        enabled.fib = true;
        openFibSettings();
      } else enabled[kind] = !enabled[kind];
      saveEnabled();
      if (anyEnabled()) {
        analysisActive = true;
        void renderIndicators();
      } else deactivateAnalysis({ closeDrawer: false });
      return;
    }
    if (event.target.closest("[data-indicator-retry]")) { candleCache.clear(); geckoPoolCache.clear(); activateAnalysis({ openDrawer: true }); return; }
    if (event.target.closest("[data-chart-interval]")) { requestVersion += 1; clearTimeout(autoRefreshTimer); scheduleRender(25); return; }
    if (event.target.closest("[data-chart-mode]")) { analysisActive = false; requestVersion += 1; clearTimeout(autoRefreshTimer); destroyNativeChart(); toggleDrawer(false, false); syncChartMode(); }
  });
  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-fib-enabled]")) {
      enabled.fib = event.target.checked;
      saveEnabled();
      syncButtons();
      if (anyEnabled()) { analysisActive = true; void renderIndicators(); }
      else deactivateAnalysis({ closeDrawer: false });
      return;
    }
    if (event.target.matches("[data-fib-lookback]")) {
      const lookback = Number(event.target.value);
      if ([60, 120, 240].includes(lookback)) fibSettings.lookback = lookback;
    } else {
      const field = event.target.dataset.fibField;
      const row = event.target.closest("[data-fib-level]");
      if (!field || !row) return;
      const index = Number(row.dataset.fibLevel);
      const level = fibSettings.levels[index];
      if (!level) return;
      if (field === "enabled") level.enabled = event.target.checked;
      if (field === "ratio") level.ratio = Math.max(-5, Math.min(10, Number(event.target.value) || 0));
      if (field === "color" && /^#[0-9a-f]{6}$/i.test(event.target.value)) level.color = event.target.value;
      if (field === "style" && [0, 1, 2].includes(Number(event.target.value))) level.style = Number(event.target.value);
    }
    saveFibSettings();
    renderFibSettings();
    scheduleRender(0);
  });
  window.addEventListener("hashchange", () => { analysisActive = false; requestVersion += 1; clearTimeout(autoRefreshTimer); toggleDrawer(false, false); syncButtons(); });
  document.addEventListener("slimewire:chart-rendered", () => { if (analysisActive && anyEnabled()) scheduleRender(0); });
  document.addEventListener("visibilitychange", () => {
    clearTimeout(autoRefreshTimer);
    if (!document.hidden && analysisActive) scheduleRender(0);
  });
  const identity = $("[data-coin-mini]");
  if (identity) new MutationObserver(() => { requestVersion += 1; clearTimeout(autoRefreshTimer); syncChartMode(); if (analysisActive) scheduleRender(30); }).observe(identity, { childList: true, subtree: true, characterData: true });
  syncChartMode();
  syncButtons();
})();
