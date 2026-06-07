import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(rootDir, "web", "public");
const distDir = path.join(rootDir, "web", "dist");

async function copyDir(source, target) {
  await fs.mkdir(target, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath);
    } else if (entry.isFile()) {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function envBool(name, fallback = false) {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on", "enabled"].includes(String(value).trim().toLowerCase());
}

function envNumber(name, fallback) {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function envList(name, fallback) {
  const items = String(process.env[name] || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : fallback;
}

try {
  await fs.rm(distDir, { recursive: true, force: true });
} catch (error) {
  if (error?.code !== "EBUSY" && error?.code !== "EPERM") throw error;
  console.warn(`Could not fully clear ${path.relative(rootDir, distDir)} (${error.code}); copying over existing files.`);
}
await copyDir(publicDir, distDir);

const buildId = String(process.env.WEB_BUILD_ID || new Date().toISOString().replace(/[-:.TZ]/g, "")).slice(0, 14);
const apiBase = normalizeBaseUrl(process.env.OGRE_API_BASE || process.env.WEB_API_BASE || process.env.RENDER_EXTERNAL_URL || "https://ogrevolbot.onrender.com");
const telegramBotUsername = String(process.env.TELEGRAM_BOT_USERNAME || "OgreTradeBot").trim().replace(/^@/, "");
const portalUrl = normalizeBaseUrl(process.env.WEB_PORTAL_URL || "https://www.slimewire.org");
const ogreTek = {
  enabled: envBool("OGRE_TEK_ENABLED", envBool("NEXT_PUBLIC_ENABLE_OGRE_TEK", false)),
  demoMode: envBool("OGRE_TEK_DEMO_MODE", true),
  provider: String(process.env.OGRE_TEK_PROVIDER || "mock").trim().toLowerCase() || "mock",
  maxLeverage: Math.max(1, envNumber("OGRE_TEK_MAX_LEVERAGE", 5)),
  maxPositionSize: Math.max(0, envNumber("OGRE_TEK_MAX_POSITION_SIZE", 10_000)),
  dailyLossLimit: Math.max(0, envNumber("OGRE_TEK_DAILY_LOSS_LIMIT", 500)),
  allowedMarkets: envList("OGRE_TEK_ALLOWED_MARKETS", ["SOL-PERP", "BTC-PERP", "ETH-PERP"]),
  emergencyDisabled: envBool("OGRE_TEK_EMERGENCY_DISABLED", false),
  staleMarketMs: Math.max(5_000, envNumber("OGRE_TEK_STALE_MARKET_MS", 60_000)),
  staleAccountMs: Math.max(5_000, envNumber("OGRE_TEK_STALE_ACCOUNT_MS", 60_000))
};
const pumpLive = {
  enabled: envBool("PUMP_LIVE_ENABLED", false),
  provider: String(process.env.PUMP_LIVE_PROVIDER || "").trim().toLowerCase(),
  ingestUrl: normalizeBaseUrl(process.env.PUMP_LIVE_INGEST_URL || ""),
  playbackBaseUrl: normalizeBaseUrl(process.env.PUMP_LIVE_PLAYBACK_BASE_URL || ""),
  docsUrl: normalizeBaseUrl(process.env.PUMP_LIVE_DOCS_URL || ""),
  chatEnabled: envBool("PUMP_LIVE_CHAT_ENABLED", true),
};
const featureFlags = {
  slimeShieldEnabled: envBool("VITE_SLIMESHIELD_ENABLED", true),
  kolDumpDetectorEnabled: envBool("VITE_KOL_DUMP_DETECTOR_ENABLED", true),
  replayBeforeBuyEnabled: envBool("VITE_REPLAY_BEFORE_BUY_ENABLED", true),
  protectedBuyEnabled: envBool("VITE_PROTECTED_BUY_ENABLED", true),
  tokenAvatarFixEnabled: envBool("VITE_TOKEN_AVATAR_FIX_ENABLED", true),
  chatAiEnabled: envBool("VITE_CHAT_AI_ENABLED", true),
  chatAiProviderEnabled: envBool("VITE_CHAT_AI_PROVIDER_ENABLED", true),
  siteSmoothnessFixesEnabled: envBool("VITE_SITE_SMOOTHNESS_FIXES_ENABLED", true),
  disableUnfinishedButtons: envBool("VITE_DISABLE_UNFINISHED_BUTTONS", true),
  debugPerformanceCounters: envBool("VITE_DEBUG_PERFORMANCE_COUNTERS", false)
};
const configSource = `window.OGRE_PORTAL_CONFIG = ${JSON.stringify({ apiBase, telegramBotUsername, portalUrl, featureFlags, ogreTek, pumpLive }, null, 2)};\n`;
await fs.writeFile(path.join(distDir, "config.js"), configSource, "utf8");

const indexPath = path.join(distDir, "index.html");
const indexHtml = await fs.readFile(indexPath, "utf8");
await fs.writeFile(
  indexPath,
  indexHtml
    .replace(/styles\.css(?:\?v=[^"]*)?/g, `styles.css?v=${buildId}`)
    .replace(/slimewire-final-overrides\.css(?:\?v=[^"]*)?/g, `slimewire-final-overrides.css?v=${buildId}`)
    .replace(/app\.js(?:\?v=[^"]*)?/g, `app.js?v=${buildId}`),
  "utf8"
);

try {
  const assetDir = path.join(distDir, "assets");
  await fs.mkdir(assetDir, { recursive: true });
  await fs.copyFile(
    path.join(rootDir, "pnl-card-slime-preview.png"),
    path.join(assetDir, "pnl-card-slime-preview.png")
  );
} catch (error) {
  console.warn(`Web preview image was not copied: ${error.message}`);
}

console.log(`Built OgreTrade web portal at ${path.relative(rootDir, distDir)}`);

