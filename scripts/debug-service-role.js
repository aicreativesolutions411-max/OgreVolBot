import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readText(file) {
  return fs.readFile(path.join(rootDir, file), "utf8");
}

function bool(text, pattern) {
  return pattern.test(text);
}

function envPresent(...names) {
  return names.some((name) => Boolean(String(process.env[name] || "").trim()));
}

function optionalBoolean(value, fallback) {
  if (value === undefined || value === null || String(value).trim() === "") return Boolean(fallback);
  return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());
}

function normalizeServiceRole(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["worker", "background", "job", "jobs"].includes(normalized)) return "worker";
  if (["web", "server", "app", "api"].includes(normalized)) return "web";
  return "web";
}

function configuredCacheBackend() {
  if (!optionalBoolean(process.env.CACHE_ENABLED, true)) return "memory";
  const provider = String(process.env.CACHE_PROVIDER || process.env.KV_PROVIDER || "auto").trim().toLowerCase();
  const hasRedis = envPresent("REDIS_URL", "RENDER_KEY_VALUE_URL", "RENDER_KEY_VALUE_INTERNAL_URL", "RENDER_REDIS_URL", "REDIS_INTERNAL_URL", "KV_REDIS_URL", "SLIMEWIRE_REDIS_URL");
  const hasRest = envPresent("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL", "SLIMEWIRE_KV_REST_URL") && envPresent("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN", "SLIMEWIRE_KV_REST_TOKEN");
  if (["memory", "none", "off", "disabled"].includes(provider)) return "memory";
  if (["rest", "rest-kv", "upstash", "upstash-redis"].includes(provider)) return hasRest ? "rest-kv" : "memory";
  if (["redis", "render-redis", "keyvalue", "key-value", "kv"].includes(provider)) return hasRedis ? "redis" : "memory";
  if (hasRedis) return "redis";
  if (hasRest) return "rest-kv";
  return "memory";
}

function rpcConfig() {
  const pairs = [
    ["HELIUS_RPC_URL", process.env.HELIUS_RPC_URL],
    ["HELIUS_DEVELOPER_RPC_URL", process.env.HELIUS_DEVELOPER_RPC_URL],
    ["HELIUS_HTTP_URL", process.env.HELIUS_HTTP_URL],
    ["HELIUS_SOLANA_RPC_URL", process.env.HELIUS_SOLANA_RPC_URL],
    ["SOLANA_RPC_URL", process.env.SOLANA_RPC_URL]
  ];
  const found = pairs.find(([, value]) => String(value || "").trim());
  const url = String(found?.[1] || "").trim();
  let host = "";
  try {
    host = url ? new URL(url).host.toLowerCase() : "";
  } catch {
    host = "";
  }
  return {
    envSource: found?.[0] || "",
    providerName: host.includes("helius") ? "helius" : host === "api.mainnet-beta.solana.com" ? "public-solana" : host ? "custom" : "missing",
    rpcUrlHost: host,
    publicFallbackDisabled: !envPresent("ALLOW_PUBLIC_RPC_FALLBACK"),
    rpcRpsLimit: Math.min(40, Math.max(1, Number.parseInt(process.env.RPC_RPS_LIMIT || "40", 10) || 40)),
    dasRpsLimit: Math.min(8, Math.max(1, Number.parseInt(process.env.DAS_RPS_LIMIT || "8", 10) || 8)),
    heliusWsConfigured: envPresent("HELIUS_WS_URL", "HELIUS_WEBSOCKET_URL")
  };
}

const [serverSource, workerSource, packageSource] = await Promise.all([
  readText("src/index.js"),
  readText("src/worker.js"),
  readText("package.json")
]);

const serviceRole = normalizeServiceRole(process.env.SERVICE_ROLE || process.env.RENDER_SERVICE_ROLE || "");
const runWorker = ["1", "true", "yes", "on"].includes(String(process.env.RUN_WORKER || (serviceRole === "worker" ? "true" : "false")).trim().toLowerCase());
const workerSecretPresent = envPresent("WORKER_SECRET");
const workerTickEndpointEnabled = optionalBoolean(
  process.env.WORKER_TICK_ENDPOINT_ENABLED,
  optionalBoolean(process.env.WORKER_TICK_ENABLED, workerSecretPresent || runWorker)
);
const report = {
  serviceRole,
  runWorker,
  workerTickEndpointEnabled,
  staleHeartbeatRisk: {
    workerSecretPresent,
    workerTickEndpointDisabled: !workerTickEndpointEnabled,
    likelyCause: !workerTickEndpointEnabled
      ? "Render worker cannot update heartbeat because the web tick endpoint is disabled. Set WORKER_TICK_ENDPOINT_ENABLED=true on the web service."
      : ""
  },
  expectedRenderSettings: {
    web: { SERVICE_ROLE: "web", RUN_WORKER: "false" },
    worker: { SERVICE_ROLE: "worker", RUN_WORKER: "true" }
  },
  jobsStarted: serviceRole === "worker" && runWorker
    ? ["worker tick", "fast TP/SL tick", "feed warmers", "display cache warmers"]
    : ["web server"],
  jobsBlockedByRole: serviceRole === "web" || !runWorker
    ? ["web internal TP/SL intervals", "web startup/view TP/SL reconcile", "web internal DCA interval", "feed refresh loops", "wallet/positions refresh loops"]
    : [],
  activeIntervals: {
    webInternalTpSlDefaultOffWithWorker: bool(serverSource, /defaultWebInternalRunners/) && bool(serverSource, /serviceRole === "web"/),
    webLocalTpSlReconcileGated: bool(serverSource, /function webLocalTpSlReconcileEnabled/) && bool(serverSource, /Web startup TP\/SL reconcile disabled/),
    separateWorkerEndpointFlag: bool(serverSource, /WORKER_TICK_ENDPOINT_ENABLED/) && bool(serverSource, /parseOptionalBoolean/),
    workerBroadTick: bool(workerSource, /setInterval\(\(\) => void tick\(\), CONFIG\.intervalMs\)/),
    workerFastTpSlTick: bool(workerSource, /setInterval\(\(\) => void tradePlanTick\(\), CONFIG\.tradePlanIntervalMs\)/),
    workerRefusesWebRole: bool(workerSource, /SERVICE_ROLE=web or WORKER_DISABLED=true/),
    sharedRunWorkerFalseCannotKillWorker: bool(workerSource, /const runWorker = serviceRole === "worker" && !workerDisabled/)
  },
  activeLocks: {
    cacheLocksImplemented: bool(serverSource, /async function withCacheLock/) && bool(serverSource, /const LockService = Object\.freeze/),
    displayCacheLock: bool(serverSource, /worker-display-caches/),
    feedDedupe: bool(serverSource, /worker-feed:\$\{bucket\}:\$\{sort\}/)
  },
  cacheBackend: configuredCacheBackend(),
  cacheEnv: {
    cacheEnabled: optionalBoolean(process.env.CACHE_ENABLED, true),
    redisPresent: envPresent("REDIS_URL", "RENDER_KEY_VALUE_URL", "RENDER_KEY_VALUE_INTERNAL_URL", "RENDER_REDIS_URL", "REDIS_INTERNAL_URL", "KV_REDIS_URL", "SLIMEWIRE_REDIS_URL"),
    renderKeyValuePresent: envPresent("RENDER_KEY_VALUE_URL", "RENDER_KEY_VALUE_INTERNAL_URL"),
    restKvPresent: envPresent("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL", "SLIMEWIRE_KV_REST_URL")
  },
  rpcProvider: rpcConfig(),
  packageScripts: {
    debugServiceRole: bool(packageSource, /"debug:service-role": "node scripts\/debug-service-role\.js"/),
    debugWorkerHealth: bool(packageSource, /"debug:worker-health": "node scripts\/debug-worker-health\.js"/),
    debugFrontendPerf: bool(packageSource, /"debug:frontend-perf": "node scripts\/debug-frontend-perf\.js"/)
  },
  secretsPrinted: false
};

console.log("SLIMEWIRE SERVICE ROLE DEBUG");
console.log(JSON.stringify(report, null, 2));
