import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.resolve(process.env.DATA_DIR || path.join(rootDir, "data"));

async function readText(file) {
  return fs.readFile(path.join(rootDir, file), "utf8");
}

async function readJsonIfExists(fileName, fallback) {
  try {
    return JSON.parse(await fs.readFile(path.join(dataDir, fileName), "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

function bool(text, pattern) {
  return pattern.test(text);
}

function envPresent(...names) {
  return names.some((name) => Boolean(String(process.env[name] || "").trim()));
}

function configuredProvider() {
  const provider = String(process.env.CACHE_PROVIDER || process.env.KV_PROVIDER || "auto").trim().toLowerCase();
  if (["memory", "none", "off", "disabled"].includes(provider)) return "memory";
  if (["rest", "rest-kv", "upstash", "upstash-redis"].includes(provider)) return envPresent("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL", "SLIMEWIRE_KV_REST_URL") ? "rest-kv" : "memory";
  if (["redis", "render-redis", "keyvalue", "key-value", "kv"].includes(provider)) return envPresent("REDIS_URL", "RENDER_KEY_VALUE_URL", "RENDER_KEY_VALUE_INTERNAL_URL", "RENDER_REDIS_URL", "REDIS_INTERNAL_URL", "KV_REDIS_URL", "SLIMEWIRE_REDIS_URL") ? "redis" : "memory";
  if (envPresent("REDIS_URL", "RENDER_KEY_VALUE_URL", "RENDER_KEY_VALUE_INTERNAL_URL", "RENDER_REDIS_URL", "REDIS_INTERNAL_URL", "KV_REDIS_URL", "SLIMEWIRE_REDIS_URL")) return "redis";
  if (envPresent("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL", "SLIMEWIRE_KV_REST_URL") && envPresent("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN", "SLIMEWIRE_KV_REST_TOKEN")) return "rest-kv";
  return "memory";
}

async function safeProviderPing(provider) {
  if (provider === "memory") return { attempted: false, ok: false, reason: "No external KV configured." };
  if (provider === "rest-kv") {
    const url = String(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.SLIMEWIRE_KV_REST_URL || "").trim().replace(/\/$/, "");
    const token = String(process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.SLIMEWIRE_KV_REST_TOKEN || "").trim();
    if (!url || !token) return { attempted: false, ok: false, reason: "REST KV URL/token missing." };
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(["PING"])
      });
      const text = await response.text();
      return {
        attempted: true,
        ok: response.ok,
        status: response.status,
        bodySnippet: text.slice(0, 120)
      };
    } catch (error) {
      return { attempted: true, ok: false, error: error.message };
    }
  }
  if (provider === "redis") {
    const redisUrl = String(process.env.REDIS_URL || process.env.RENDER_KEY_VALUE_URL || process.env.RENDER_KEY_VALUE_INTERNAL_URL || process.env.RENDER_REDIS_URL || process.env.REDIS_INTERNAL_URL || process.env.KV_REDIS_URL || process.env.SLIMEWIRE_REDIS_URL || "").trim();
    if (!redisUrl) return { attempted: false, ok: false, reason: "REDIS_URL/RENDER_KEY_VALUE_URL/KV_REDIS_URL missing." };
    try {
      const { createClient } = await import("redis");
      const client = createClient({ url: redisUrl });
      client.on("error", () => {});
      await client.connect();
      const pong = await client.ping();
      await client.quit();
      return { attempted: true, ok: pong === "PONG", status: pong };
    } catch (error) {
      return { attempted: true, ok: false, error: error.message };
    }
  }
  return { attempted: false, ok: false, reason: "Unsupported provider." };
}

const [serverSource, appSource, workerSource, packageSource, cacheStore] = await Promise.all([
  readText("src/index.js"),
  readText("web/public/app.js"),
  readText("src/worker.js"),
  readText("package.json"),
  readJsonIfExists("cache-events.json", { events: [] })
]);

const provider = configuredProvider();
const ping = await safeProviderPing(provider);
const events = Array.isArray(cacheStore.events) ? cacheStore.events : [];

const report = {
  provider,
  configured: provider !== "memory",
  env: {
    redisUrlPresent: envPresent("REDIS_URL", "RENDER_KEY_VALUE_URL", "RENDER_KEY_VALUE_INTERNAL_URL", "RENDER_REDIS_URL", "REDIS_INTERNAL_URL", "KV_REDIS_URL", "SLIMEWIRE_REDIS_URL"),
    renderKeyValueUrlPresent: envPresent("RENDER_KEY_VALUE_URL", "RENDER_KEY_VALUE_INTERNAL_URL"),
    restUrlPresent: envPresent("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL", "SLIMEWIRE_KV_REST_URL"),
    restTokenPresent: envPresent("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN", "SLIMEWIRE_KV_REST_TOKEN"),
    cacheNamespacePresent: envPresent("CACHE_NAMESPACE", "KV_CACHE_NAMESPACE")
  },
  providerPing: ping,
  webCacheFastPath: {
    cachedWebSummary: bool(serverSource, /async function cachedWebSummary/),
    cacheServiceWrapper: bool(serverSource, /const CacheService = Object\.freeze/),
    lockServiceWrapper: bool(serverSource, /const LockService = Object\.freeze/) && bool(serverSource, /async function withCacheLock/),
    dedupeServiceWrapper: bool(serverSource, /const DedupeService = Object\.freeze/) && bool(serverSource, /async function withCacheDedupe/),
    redisCircuitBreaker: bool(serverSource, /kvCircuitOpenUntil/) && bool(serverSource, /CACHE_CONNECT_TIMEOUT_MS/) && bool(serverSource, /CACHE_CIRCUIT_BREAKER_MS/),
    staleWhileRevalidate: bool(serverSource, /memory-stale-hit-background-refresh/) && bool(serverSource, /kv-stale-hit-background-refresh/),
    balancesCached: bool(serverSource, /cachedWebSummary\("web:balances"/),
    positionsCached: bool(serverSource, /cachedWebSummary\("web:positions"/),
    pnlCached: bool(serverSource, /cachedWebSummary\("web:pnl"/),
    feedKvCache: bool(serverSource, /web:livePairs:/) && bool(serverSource, /cacheSetJson\(externalKey/)
  },
  workerBackgroundRefresh: {
    workerSendsWarmDisplayCaches: bool(workerSource, /warmDisplayCaches: CONFIG\.warmDisplayCaches/),
    backendWarmsDisplayCaches: bool(serverSource, /async function warmWorkerDisplayCaches/),
    workerHealthReportsCache: bool(serverSource, /warmDisplayCaches: CONFIG\.workerTickWarmDisplayCaches/) && bool(serverSource, /cacheProvider: kvProviderName\(\)/)
  },
  frontendCacheBehavior: {
    getRequestDedupe: bool(appSource, /apiInFlight\.has\(dedupeKey\)/),
    walletRefreshDedupe: bool(appSource, /walletRefreshPromise/),
    cachedTabRenderBeforeRefresh: bool(appSource, /const hasCachedTabData = terminalFeedHasData\(state\.activeTab\)/)
  },
  scripts: {
    debugCacheRegistered: bool(packageSource, /"debug:cache": "node scripts\/debug-cache\.js"/),
    debugWebWorkerLoopsRegistered: bool(packageSource, /"debug:web-worker-loops": "node scripts\/debug-web-worker-loops\.js"/)
  },
  recentCacheEvents: events.slice(-20)
};

console.log("SLIMEWIRE CACHE DEBUG");
console.log(JSON.stringify(report, null, 2));
