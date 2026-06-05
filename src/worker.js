import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { duePeriodicTask } from "./lib/workerTickTasks.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadDotEnv();

const CONFIG = loadWorkerConfig();
let activeTick = false;
let activeTradePlanTick = false;
let tickCount = 0;
let tradePlanTickCount = 0;
let lastPortfolioExitTickAt = 0;

console.log(`SlimeWire worker starting. Tick URL: ${CONFIG.tickUrl}`);
if (CONFIG.tickUrls.length > 1) {
  console.log(`Worker fallback tick URLs: ${CONFIG.tickUrls.slice(1).join(", ")}`);
}
console.log(`Worker interval: ${CONFIG.intervalMs}ms. Feeds: ${CONFIG.warmFeeds ? "on" : "off"}. Display cache: ${CONFIG.warmDisplayCaches ? "on" : "off"}. Trade plans: ${CONFIG.runTradePlans ? "on" : "off"}. Fast TP/SL: ${CONFIG.fastTpSlEnabled ? "on" : "off"}.`);
if (CONFIG.fastTpSlEnabled) {
  console.log(`Fast TP/SL worker interval: ${CONFIG.tradePlanIntervalMs}ms.`);
  console.log(`Broad portfolio TP/SL fallback interval: ${CONFIG.portfolioExitIntervalMs}ms.`);
}

setTimeout(() => void tick(), 500);
setInterval(() => void tick(), CONFIG.intervalMs);
if (CONFIG.fastTpSlEnabled) {
  setTimeout(() => void tradePlanTick(), 1000);
  setInterval(() => void tradePlanTick(), CONFIG.tradePlanIntervalMs);
}

function loadWorkerConfig() {
  const baseUrl = (process.env.WORKER_TICK_BASE_URL || process.env.TELEGRAM_WEBHOOK_URL || process.env.KEEPALIVE_URL || "").replace(/\/$/, "");
  const tickUrl = process.env.WORKER_TICK_URL || (baseUrl ? `${baseUrl}/api/internal/worker/tick` : "");
  const secret = process.env.WORKER_SECRET || "";
  const intervalMs = clampInteger(process.env.WORKER_TICK_INTERVAL_MS, 15_000, 5_000, 120_000);
  const tradePlanIntervalMs = clampInteger(process.env.WORKER_TRADE_PLAN_INTERVAL_MS, 1_500, 750, 30_000);
  const portfolioExitIntervalMs = clampInteger(process.env.WORKER_PORTFOLIO_EXIT_INTERVAL_MS, 30_000, 5_000, 300_000);
  const timeoutMs = clampInteger(process.env.WORKER_TICK_TIMEOUT_MS, 20_000, 5_000, 120_000);
  const buckets = normalizeList(process.env.WORKER_TICK_BUCKETS || "live,under1h,under3h,under1d");
  const sorts = normalizeList(process.env.WORKER_TICK_SORTS || "best,newest");
  const runTradePlans = parseBoolean(process.env.WORKER_TICK_RUN_TRADE_PLANS || "true");

  if (!tickUrl) {
    throw new Error("WORKER_TICK_URL or WORKER_TICK_BASE_URL must be set for the worker service.");
  }
  if (!secret || secret.length < 24) {
    throw new Error("WORKER_SECRET must be set to the same long random value on the web service and worker service.");
  }

  return {
    tickUrl,
    tickUrls: deriveTickUrls(tickUrl),
    secret,
    intervalMs,
    tradePlanIntervalMs,
    portfolioExitIntervalMs,
    timeoutMs,
    runTradePlans,
    fastTpSlEnabled: runTradePlans && parseBoolean(process.env.WORKER_FAST_TP_SL_ENABLED || "true"),
    runDcaPlans: parseBoolean(process.env.WORKER_TICK_RUN_DCA_PLANS || "true"),
    warmFeeds: parseBoolean(process.env.WORKER_TICK_WARM_FEEDS || "true"),
    warmDisplayCaches: parseBoolean(process.env.WORKER_TICK_WARM_DISPLAY_CACHES || "true"),
    displayCacheUserLimit: clampInteger(process.env.WORKER_DISPLAY_CACHE_USER_LIMIT, 8, 0, 50),
    buckets,
    sorts,
    forceFeeds: parseBoolean(process.env.WORKER_TICK_FORCE_FEEDS || "true")
  };
}

async function tradePlanTick() {
  if (activeTradePlanTick) {
    console.log("Fast TP/SL worker tick skipped because the previous TP/SL tick is still running.");
    return;
  }

  activeTradePlanTick = true;
  tradePlanTickCount += 1;
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutMs = Math.min(CONFIG.timeoutMs, 15_000);
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let lastFailure = null;
    for (let index = 0; index < CONFIG.tickUrls.length; index += 1) {
      const tickUrl = CONFIG.tickUrls[index];
      const response = await fetch(tickUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Worker-Secret": CONFIG.secret,
          "User-Agent": "slimewire-render-worker-tpsl"
        },
        body: JSON.stringify({
          runTradePlans: true,
          forceTradePlans: true,
          runPortfolioExits: false,
          runWebExitGuards: true,
          runTimedTradePlans: true,
          runDcaPlans: false,
          warmLivePairs: false
        }),
        signal: controller.signal
      });
      const raw = await response.text();
      const data = parseJson(raw);

      if (response.status === 404 && index < CONFIG.tickUrls.length - 1) {
        lastFailure = `404 at ${tickUrl}: ${data?.error || raw.slice(0, 120)}`;
        console.warn(`Fast TP/SL worker tick ${tradePlanTickCount} endpoint not found at ${tickUrl}; trying fallback endpoint.`);
        continue;
      }

      if (!response.ok || data?.ok === false) {
        const detail = data?.error || raw.slice(0, 240);
        console.warn(`Fast TP/SL worker tick ${tradePlanTickCount} failed (${response.status}) at ${tickUrl}: ${detail}`);
        return;
      }

      const tradePlans = data?.tradePlans?.value || data?.tradePlans || {};
      const webExitGuards = data?.webExitGuards?.value || data?.webExitGuards || {};
      const tradePlanSummary = tradePlans?.skipped
        ? `skipped:${tradePlans.reason || "unknown"}`
        : `checked:${tradePlans.checkedWallets ?? 0} triggered:${tradePlans.triggeredWallets ?? 0} sold:${tradePlans.soldWallets ?? 0} failed:${tradePlans.failedWallets ?? 0}`;
      const guardSummary = webExitGuards?.skipped
        ? `guards skipped:${webExitGuards.reason || "unknown"}`
        : `guards checked:${webExitGuards.checkedGuards ?? 0} triggered:${webExitGuards.triggeredGuards ?? 0} sold:${webExitGuards.soldGuards ?? 0} failed:${webExitGuards.failedGuards ?? 0}`;
      const fallbackNote = lastFailure ? ` Recovered after ${lastFailure}.` : "";
      console.log(`Fast TP/SL worker tick ${tradePlanTickCount} ok in ${Date.now() - startedAt}ms. ${guardSummary}. plans ${tradePlanSummary}.${fallbackNote}`);
      return;
    }
  } catch (error) {
    const reason = error?.name === "AbortError" ? `timed out after ${timeoutMs}ms` : error.message;
    console.warn(`Fast TP/SL worker tick ${tradePlanTickCount} failed: ${reason}`);
  } finally {
    clearTimeout(timer);
    activeTradePlanTick = false;
  }
}

async function tick() {
  if (activeTick) {
    console.log("Worker tick skipped because the previous tick is still running.");
    return;
  }

  activeTick = true;
  tickCount += 1;
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.timeoutMs);

  try {
    let lastFailure = null;
    const now = Date.now();
    const runPortfolioExits = duePeriodicTask(now, lastPortfolioExitTickAt, CONFIG.portfolioExitIntervalMs);
    if (runPortfolioExits) lastPortfolioExitTickAt = now;
    for (let index = 0; index < CONFIG.tickUrls.length; index += 1) {
      const tickUrl = CONFIG.tickUrls[index];
      const response = await fetch(tickUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Worker-Secret": CONFIG.secret,
          "User-Agent": "slimewire-render-worker"
        },
        body: JSON.stringify({
          runTradePlans: CONFIG.runTradePlans,
          forceTradePlans: CONFIG.runTradePlans,
          runPortfolioExits,
          runWebExitGuards: CONFIG.runTradePlans && !CONFIG.fastTpSlEnabled,
          runTimedTradePlans: CONFIG.runTradePlans && !CONFIG.fastTpSlEnabled,
          runDcaPlans: CONFIG.runDcaPlans,
          warmLivePairs: CONFIG.warmFeeds,
          warmDisplayCaches: CONFIG.warmDisplayCaches,
          displayCacheUserLimit: CONFIG.displayCacheUserLimit,
          buckets: CONFIG.buckets,
          sorts: CONFIG.sorts,
          forceFeeds: CONFIG.forceFeeds
        }),
        signal: controller.signal
      });
      const raw = await response.text();
      const data = parseJson(raw);

      if (response.status === 404 && index < CONFIG.tickUrls.length - 1) {
        lastFailure = `404 at ${tickUrl}: ${data?.error || raw.slice(0, 120)}`;
        console.warn(`Worker tick ${tickCount} endpoint not found at ${tickUrl}; trying fallback endpoint.`);
        continue;
      }

      if (!response.ok || data?.ok === false) {
        const detail = data?.error || raw.slice(0, 240);
        const hint = response.status === 404
          ? " Check WORKER_TICK_URL points to the Render web service, not Cloudflare Pages, and confirm the web service finished deploying this code."
          : "";
        console.warn(`Worker tick ${tickCount} failed (${response.status}) at ${tickUrl}: ${detail}${hint}`);
        return;
      }

      const tradePlans = data?.tradePlans?.value || data?.tradePlans || {};
      const webExitGuards = data?.webExitGuards?.value || data?.webExitGuards || {};
      const portfolioExits = data?.portfolioExits?.value || data?.portfolioExits || {};
      const tradePlanSummary = tradePlans?.skipped
        ? `TP/SL skipped:${tradePlans.reason || "unknown"}`
        : `TP/SL checked:${tradePlans.checkedWallets ?? 0} triggered:${tradePlans.triggeredWallets ?? 0} sold:${tradePlans.soldWallets ?? 0} failed:${tradePlans.failedWallets ?? 0}`;
      const guardSummary = webExitGuards?.skipped
        ? `guards skipped:${webExitGuards.reason || "unknown"}`
        : `guards checked:${webExitGuards.checkedGuards ?? 0} triggered:${webExitGuards.triggeredGuards ?? 0} sold:${webExitGuards.soldGuards ?? 0} failed:${webExitGuards.failedGuards ?? 0}`;
      const portfolioSummary = portfolioExits?.skipped
        ? `portfolio skipped:${portfolioExits.reason || "scheduled later"}`
        : `portfolio checked:${portfolioExits.checkedPositions ?? 0} triggered:${portfolioExits.triggeredPositions ?? 0} sold:${portfolioExits.soldPositions ?? 0} failed:${portfolioExits.sellFailures ?? 0}`;
      const feeds = data?.feeds?.value?.warmed || data?.feeds?.warmed || [];
      const feedSummary = Array.isArray(feeds)
        ? feeds.map((item) => `${item.bucket}/${item.sort}:${item.rows}`).join(" ")
        : "feeds:n/a";
      const displayCaches = data?.displayCaches?.value || data?.displayCaches || {};
      const displayCacheSummary = displayCaches?.skipped
        ? "display-cache skipped"
        : `display-cache users:${displayCaches.users ?? 0} provider:${displayCaches.provider || "memory"}`;
      const fallbackNote = lastFailure ? ` Recovered after ${lastFailure}.` : "";
      console.log(`Worker tick ${tickCount} ok in ${Date.now() - startedAt}ms. ${guardSummary}. ${tradePlanSummary}. ${portfolioSummary}. ${feedSummary}. ${displayCacheSummary}${fallbackNote}`);
      return;
    }
  } catch (error) {
    const reason = error?.name === "AbortError" ? `timed out after ${CONFIG.timeoutMs}ms` : error.message;
    console.warn(`Worker tick ${tickCount} failed: ${reason}`);
  } finally {
    clearTimeout(timer);
    activeTick = false;
  }
}

function parseJson(raw) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return null;
  }
}

function deriveTickUrls(tickUrl) {
  const urls = [tickUrl];
  try {
    const parsed = new URL(tickUrl);
    for (const pathname of [
      "/api/internal/worker/tick",
      "/api/worker/tick",
      "/internal/worker/tick",
      "/worker/tick"
    ]) {
      const next = new URL(parsed.toString());
      next.pathname = pathname;
      next.search = "";
      urls.push(next.toString());
    }
  } catch {
    // If the URL is malformed, startup validation and the first fetch will surface it.
  }
  return [...new Set(urls)];
}

function loadDotEnv() {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(__dirname, "..", ".env")
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      if (!key || process.env[key] !== undefined) continue;
      let value = trimmed.slice(index + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
    return;
  }
}

function parseBoolean(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());
}

function clampInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value || String(fallback), 10);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normalizeList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
