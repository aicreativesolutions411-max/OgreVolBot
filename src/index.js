import crypto from "node:crypto";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bs58 from "bs58";
import sharp from "sharp";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  VersionedTransaction
} from "@solana/web3.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG = loadConfig();
const connection = new Connection(CONFIG.rpcUrl, "confirmed");
const rpcLimiter = createRpcLimiter();
const jupiterLimiter = createJupiterLimiter();
const sessions = new Map();
const mintProgramCache = new Map();
const dexMetadataCache = new Map();
const solBalanceCache = new Map();
const tokenAccountsCache = new Map();
const tokenBalanceCache = new Map();
const positionValueCache = new Map();
const mintSafetyCache = new Map();
const sniperScanState = new Map();
const startedAt = new Date();
let lastKeepAliveStatus = {
  enabled: false,
  target: null,
  lastPingAt: null,
  lastStatus: null,
  lastError: null
};
let tradePlanRunnerActive = false;
let dcaPlanRunnerActive = false;
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const SOL_MINT = "So11111111111111111111111111111111111111112";
const AUTOSNIPE_TAKE_PROFIT_PCT = 15;
const AUTOSNIPE_STOP_LOSS_PCT = 8;
const AUTOSNIPE_SLIPPAGE_BPS = 400;
const AUTOSNIPE_SELL_DELAY_SECONDS = 300;
const PUMPSNIPE_TAKE_PROFIT_PCT = 40;
const PUMPSNIPE_STOP_LOSS_PCT = 8;
const PUMPSNIPE_SLIPPAGE_BPS = 300;
const PUMPSNIPE_SELL_DELAY_SECONDS = 180;
const SNIPER_ROUTE_PROBE_LAMPORTS = 50_000_000;
const AUTO_BUNDLE_TAKE_PROFIT_PCT = 60;
const AUTO_BUNDLE_STOP_LOSS_PCT = 10;
const AUTO_BUNDLE_SELL_DELAY_SECONDS = 172800;
const PNL_CARD_STYLE = Object.freeze({
  width: 1200,
  height: 675,
  fontFamily: "Arial, Helvetica, sans-serif",
  bg: "#071407",
  green: "#18ff29",
  slime: "#39ff14",
  red: "#ff3838",
  white: "#f7fff7",
  muted: "#b8c7b8",
  panel: "rgba(4, 16, 5, 0.72)"
});
const PNL_CARD_BORDER_FILES = [
  path.join(__dirname, "assets", "pnl-borders", "ogre-pnl-border-1.png"),
  path.join(__dirname, "assets", "pnl-borders", "ogre-pnl-border-2.png"),
  path.join(__dirname, "assets", "pnl-borders", "ogre-pnl-border-3.png")
];
const pnlBorderDataUrlCache = new Map();
let pnlBorderRotationIndex = 0;
const BRAND_FOOTER = [
  "Powered by Ogres",
  "Telegram: https://t.me/ogrecoinonsol",
  "Website: https://ogremode.com/",
  "Twitter: https://twitter.com/i/communities/1930265213917425858"
].join("\n");

const PUBLIC_MENU = [
  [{ text: "🐎 How To Use", callback_data: "quick_start" }],
  [{ text: "💱 Trade", callback_data: "trade_menu" }],
  [{ text: "🎯 OgreSniper", callback_data: "sniper_menu" }],
  [{ text: "💳 Wallet", callback_data: "wallet_menu" }, { text: "🧲 Bundle", callback_data: "bundle_menu" }],
  [{ text: "📊📈 Volume", callback_data: "timed_trade_plans" }, { text: "🔍 Check Balances", callback_data: "check_balances" }],
  [{ text: "💾 Backup / Restore", callback_data: "backup_menu" }, { text: "🏦 Withdrawal", callback_data: "withdrawal_menu" }]
];

const ADMIN_MENU = [
  [{ text: "Export Audit Log", callback_data: "export_audit" }],
  [{ text: "Emergency Stop", callback_data: "emergency_stop" }],
  [{ text: "Unlock Bot", callback_data: "unlock_bot" }]
];

const ADMIN_ACTIONS = new Set(["export_audit", "emergency_stop", "unlock_bot"]);
const PRIVATE_CHAT_ACTIONS = new Set([
  "create_wallets",
  "import_wallet",
  "delete_wallets",
  "wallet_menu",
  "trade_menu",
  "sniper_menu",
  "sniper_auto_menu",
  "sniper_scan",
  "sniper_auto",
  "sniper_pumpsnipe",
  "sniper_modes",
  "sniper_mode_safe",
  "sniper_mode_smart",
  "sniper_mode_fast",
  "sniper_mode_moonshot",
  "sniper_mode_meme",
  "sniper_mode_ai",
  "sniper_mode_long",
  "bundle_menu",
  "withdrawal_menu",
  "list_wallets",
  "check_balances",
  "pnl_results",
  "pnl_card",
  "pnl_card_by_ca",
  "positions_overview",
  "copy_trade_info",
  "quick_start",
  "main_menu",
  "backup_menu",
  "export_backup",
  "export_private_keys",
  "restore_backup",
  "rescue_backup_keys",
  "fund_wallets",
  "auto_bundle",
  "batch_buy",
  "batch_sell",
  "trade_buy",
  "trade_sell",
  "trade_auto_sell",
  "trade_dca_buy",
  "trade_dca_sell",
  "dca_buy",
  "dca_sell",
  "timed_trade_plans",
  "sell_all_tokens",
  "sweep_sol",
  "sweep_tokens",
  "close_empty_accounts"
]);

async function main() {
  await ensureDataFiles();
  startHealthServer();
  startKeepAlivePinger();
  startTradePlanRunner();
  startDcaPlanRunner();

  if (CONFIG.webhookUrl) {
    await setupWebhook();
    console.log("Telegram bot is running in webhook mode.");
    return;
  }

  await telegram("deleteWebhook", { drop_pending_updates: true });
  await sendLoop();
}

function loadConfig() {
  loadDotEnv();

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.APP_SECRET;

  if (!token) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN. Copy .env.example to .env and set it.");
  }

  if (!secret || secret.length < 24) {
    throw new Error("APP_SECRET must be set to a long random value of at least 24 characters.");
  }

  const feeWallet = process.env.FEE_WALLET || "AUcSFZsCdawzfqa4KzHK1BHz1RDrBnj8CF5kxoy3NvxV";
  const bundleFeeBps = Number.parseInt(process.env.BUNDLE_FEE_BPS || "50", 10);
  const tradingSpeedPreset = parseTradingSpeedPreset(process.env.TRADING_SPEED_PRESET || "balanced");
  const speedDefaults = tradingSpeedDefaults(tradingSpeedPreset);
  const bundleConcurrency = Number.parseInt(process.env.BUNDLE_CONCURRENCY || String(speedDefaults.bundleConcurrency), 10);
  const buyReserveSol = Number.parseFloat(process.env.BUY_RESERVE_SOL || "0.01");
  const rpcDelayMs = Number.parseInt(process.env.RPC_DELAY_MS || String(speedDefaults.rpcDelayMs), 10);
  const rpcRetries = Number.parseInt(process.env.RPC_RETRIES || "10", 10);
  const rpcMinIntervalMs = Number.parseInt(process.env.RPC_MIN_INTERVAL_MS || String(speedDefaults.rpcMinIntervalMs), 10);
  const rpc429CooldownMs = Number.parseInt(process.env.RPC_429_COOLDOWN_MS || String(speedDefaults.rpc429CooldownMs), 10);
  const jupiterMinIntervalMs = Number.parseInt(process.env.JUPITER_MIN_INTERVAL_MS || String(speedDefaults.jupiterMinIntervalMs), 10);
  const jupiterRetries = Number.parseInt(process.env.JUPITER_RETRIES || "5", 10);
  const jupiter429CooldownMs = Number.parseInt(process.env.JUPITER_429_COOLDOWN_MS || String(speedDefaults.jupiter429CooldownMs), 10);
  const balanceConcurrency = Number.parseInt(process.env.BALANCE_CONCURRENCY || String(speedDefaults.balanceConcurrency), 10);
  const balanceCacheTtlMs = Number.parseInt(process.env.BALANCE_CACHE_TTL_MS || "12000", 10);
  const defaultSlippageBps = Number.parseInt(process.env.DEFAULT_SLIPPAGE_BPS || "400", 10);
  const sniperDefaultSlippageBps = Number.parseInt(process.env.SNIPER_DEFAULT_SLIPPAGE_BPS || "400", 10);
  const jupiterSwapMaxAttempts = Number.parseInt(process.env.JUPITER_SWAP_MAX_ATTEMPTS || "2", 10);

  if (!Number.isInteger(bundleFeeBps) || bundleFeeBps < 0 || bundleFeeBps > 1000) {
    throw new Error("BUNDLE_FEE_BPS must be an integer from 0 to 1000.");
  }

  if (!Number.isInteger(bundleConcurrency) || bundleConcurrency < 1 || bundleConcurrency > 10) {
    throw new Error("BUNDLE_CONCURRENCY must be an integer from 1 to 10.");
  }

  if (!Number.isFinite(buyReserveSol) || buyReserveSol < 0 || buyReserveSol > 0.1) {
    throw new Error("BUY_RESERVE_SOL must be from 0 to 0.1.");
  }

  if (!Number.isInteger(rpcDelayMs) || rpcDelayMs < 0 || rpcDelayMs > 10_000) {
    throw new Error("RPC_DELAY_MS must be an integer from 0 to 10000.");
  }

  if (!Number.isInteger(rpcRetries) || rpcRetries < 0 || rpcRetries > 20) {
    throw new Error("RPC_RETRIES must be an integer from 0 to 20.");
  }

  if (!Number.isInteger(rpcMinIntervalMs) || rpcMinIntervalMs < 0 || rpcMinIntervalMs > 30_000) {
    throw new Error("RPC_MIN_INTERVAL_MS must be an integer from 0 to 30000.");
  }

  if (!Number.isInteger(rpc429CooldownMs) || rpc429CooldownMs < 0 || rpc429CooldownMs > 120_000) {
    throw new Error("RPC_429_COOLDOWN_MS must be an integer from 0 to 120000.");
  }

  if (!Number.isInteger(jupiterMinIntervalMs) || jupiterMinIntervalMs < 0 || jupiterMinIntervalMs > 30_000) {
    throw new Error("JUPITER_MIN_INTERVAL_MS must be an integer from 0 to 30000.");
  }

  if (!Number.isInteger(jupiterRetries) || jupiterRetries < 0 || jupiterRetries > 20) {
    throw new Error("JUPITER_RETRIES must be an integer from 0 to 20.");
  }

  if (!Number.isInteger(jupiter429CooldownMs) || jupiter429CooldownMs < 0 || jupiter429CooldownMs > 120_000) {
    throw new Error("JUPITER_429_COOLDOWN_MS must be an integer from 0 to 120000.");
  }

  if (!Number.isInteger(balanceConcurrency) || balanceConcurrency < 1 || balanceConcurrency > 8) {
    throw new Error("BALANCE_CONCURRENCY must be an integer from 1 to 8.");
  }

  if (!Number.isInteger(balanceCacheTtlMs) || balanceCacheTtlMs < 0 || balanceCacheTtlMs > 120_000) {
    throw new Error("BALANCE_CACHE_TTL_MS must be an integer from 0 to 120000.");
  }

  if (!Number.isInteger(defaultSlippageBps) || defaultSlippageBps < 1 || defaultSlippageBps > 5000) {
    throw new Error("DEFAULT_SLIPPAGE_BPS must be an integer from 1 to 5000.");
  }

  if (!Number.isInteger(sniperDefaultSlippageBps) || sniperDefaultSlippageBps < 1 || sniperDefaultSlippageBps > 5000) {
    throw new Error("SNIPER_DEFAULT_SLIPPAGE_BPS must be an integer from 1 to 5000.");
  }

  if (!Number.isInteger(jupiterSwapMaxAttempts) || jupiterSwapMaxAttempts < 1 || jupiterSwapMaxAttempts > 5) {
    throw new Error("JUPITER_SWAP_MAX_ATTEMPTS must be an integer from 1 to 5.");
  }

  try {
    new PublicKey(feeWallet);
  } catch {
    throw new Error("FEE_WALLET must be a valid Solana wallet address.");
  }

  return {
    telegramToken: token,
    rpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
    appSecret: secret,
    dataDir: path.resolve(process.cwd(), process.env.DATA_DIR || path.join(__dirname, "..", "data")),
    allowEphemeralStorage: parseBoolean(process.env.ALLOW_EPHEMERAL_STORAGE || "false"),
    port: Number.parseInt(process.env.PORT || "0", 10),
    webhookUrl: (process.env.TELEGRAM_WEBHOOK_URL || "").replace(/\/$/, ""),
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || "",
    keepAliveEnabled: parseBoolean(process.env.KEEPALIVE_ENABLED || "false"),
    keepAliveUrl: (process.env.KEEPALIVE_URL || process.env.TELEGRAM_WEBHOOK_URL || "").replace(/\/$/, ""),
    keepAliveIntervalMinutes: Number.parseInt(process.env.KEEPALIVE_INTERVAL_MINUTES || "5", 10),
    adminUserIds: parseAllowedUserIds(process.env.TELEGRAM_ADMIN_USER_IDS || process.env.TELEGRAM_ALLOWED_USER_IDS || ""),
    jupiterApiKey: process.env.JUPITER_API_KEY || "",
    jupiterApiBase: (process.env.JUPITER_API_BASE || "https://api.jup.ag/swap/v2").replace(/\/$/, ""),
    pumpFunApiBase: (process.env.PUMPFUN_API_BASE || "https://frontend-api-v3.pump.fun").replace(/\/$/, ""),
    pumpFunApiToken: process.env.PUMPFUN_API_TOKEN || "",
    tradingSpeedPreset,
    feeWallet,
    bundleFeeBps,
    bundleConcurrency,
    buyReserveLamports: solToLamports(buyReserveSol),
    buyReserveSol,
    rpcDelayMs,
    rpcRetries,
    rpcMinIntervalMs,
    rpc429CooldownMs,
    jupiterMinIntervalMs,
    jupiterRetries,
    jupiter429CooldownMs,
    balanceConcurrency,
    balanceCacheTtlMs,
    defaultSlippageBps,
    sniperDefaultSlippageBps,
    jupiterSwapMaxAttempts,
    priorityFeeLamports: Number.parseInt(process.env.PRIORITY_FEE_LAMPORTS || "0", 10)
  };
}

function startKeepAlivePinger() {
  lastKeepAliveStatus.enabled = CONFIG.keepAliveEnabled;
  if (!CONFIG.keepAliveEnabled) return;

  if (!CONFIG.keepAliveUrl) {
    console.warn("KEEPALIVE_ENABLED=true but KEEPALIVE_URL and TELEGRAM_WEBHOOK_URL are empty. Keep-alive pinger is disabled.");
    lastKeepAliveStatus.lastError = "KEEPALIVE_URL and TELEGRAM_WEBHOOK_URL are empty";
    return;
  }

  const intervalMinutes = Math.min(Math.max(CONFIG.keepAliveIntervalMinutes, 5), 14);
  const intervalMs = intervalMinutes * 60 * 1000;
  const target = `${CONFIG.keepAliveUrl}/healthz`;
  lastKeepAliveStatus.target = target;

  const ping = async () => {
    lastKeepAliveStatus.lastPingAt = new Date().toISOString();
    try {
      const response = await fetch(target, {
        headers: { "User-Agent": "solana-telegram-wallet-ops-bot-keepalive" }
      });
      lastKeepAliveStatus.lastStatus = response.status;
      lastKeepAliveStatus.lastError = null;
      console.log(`Keep-alive ping ${target}: ${response.status}`);
    } catch (error) {
      lastKeepAliveStatus.lastStatus = null;
      lastKeepAliveStatus.lastError = error.message;
      console.warn(`Keep-alive ping failed: ${error.message}`);
    }
  };

  console.log(`Keep-alive pinger enabled. Pinging ${target} every ${intervalMinutes} minute(s).`);
  setTimeout(ping, 30_000);
  setInterval(ping, intervalMs);
}

function startTradePlanRunner() {
  setTimeout(() => void processTradePlans().catch((error) => {
    console.error("Trade plan runner failed:", error.message);
  }), 10_000);

  setInterval(() => void processTradePlans().catch((error) => {
    console.error("Trade plan runner failed:", error.message);
  }), 5_000);
}

function startDcaPlanRunner() {
  setTimeout(() => void processDcaPlans().catch((error) => {
    console.error("DCA plan runner failed:", error.message);
  }), 50_000);

  setInterval(() => void processDcaPlans().catch((error) => {
    console.error("DCA plan runner failed:", error.message);
  }), 60_000);
}

async function setupWebhook() {
  if (!CONFIG.webhookSecret) {
    throw new Error("TELEGRAM_WEBHOOK_SECRET is required when TELEGRAM_WEBHOOK_URL is set.");
  }

  await telegram("setWebhook", {
    url: `${CONFIG.webhookUrl}${webhookPath()}`,
    secret_token: CONFIG.webhookSecret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false
  });
}

function startHealthServer() {
  if (!CONFIG.port) return;

  const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

    if (["/", "/healthz", "/readyz", "/wake"].includes(requestUrl.pathname)) {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({
        ok: true,
        service: "solana-telegram-wallet-ops-bot",
        startedAt: startedAt.toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
        dataDir: CONFIG.dataDir,
        webhookMode: Boolean(CONFIG.webhookUrl),
        tradeSpeed: {
          preset: CONFIG.tradingSpeedPreset,
          bundleConcurrency: CONFIG.bundleConcurrency,
          rpcMinIntervalMs: CONFIG.rpcMinIntervalMs,
          jupiterMinIntervalMs: CONFIG.jupiterMinIntervalMs
        },
        keepAlive: lastKeepAliveStatus
      }));
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === webhookPath()) {
      if (CONFIG.webhookSecret && request.headers["x-telegram-bot-api-secret-token"] !== CONFIG.webhookSecret) {
        response.writeHead(403, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ ok: false, error: "forbidden" }));
        return;
      }

      try {
        const update = JSON.parse(await readRequestBody(request));
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ ok: true }));
        void handleUpdate(update).catch((error) => {
          console.error("Webhook update error:", error.message);
        });
      } catch (error) {
        console.error("Webhook error:", error.message);
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ ok: true }));
      }
      return;
    }

    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ ok: false, error: "not_found" }));
  });

  server.listen(CONFIG.port, () => {
    console.log(`Health server listening on port ${CONFIG.port}.`);
  });
}

function webhookPath() {
  return `/telegram/webhook/${CONFIG.webhookSecret}`;
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function parseAllowedUserIds(value) {
  return value
    .split(",")
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((item) => Number.isInteger(item));
}

function parseBoolean(value) {
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function parseTradingSpeedPreset(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["safe", "balanced", "fast"].includes(normalized)) {
    return normalized;
  }
  throw new Error("TRADING_SPEED_PRESET must be safe, balanced, or fast.");
}

function tradingSpeedDefaults(preset) {
  const presets = {
    safe: {
      bundleConcurrency: 1,
      balanceConcurrency: 1,
      rpcDelayMs: 1500,
      rpcMinIntervalMs: 1200,
      rpc429CooldownMs: 15000,
      jupiterMinIntervalMs: 1200,
      jupiter429CooldownMs: 15000
    },
    balanced: {
      bundleConcurrency: 2,
      balanceConcurrency: 3,
      rpcDelayMs: 750,
      rpcMinIntervalMs: 450,
      rpc429CooldownMs: 10000,
      jupiterMinIntervalMs: 500,
      jupiter429CooldownMs: 10000
    },
    fast: {
      bundleConcurrency: 3,
      balanceConcurrency: 5,
      rpcDelayMs: 400,
      rpcMinIntervalMs: 200,
      rpc429CooldownMs: 7000,
      jupiterMinIntervalMs: 250,
      jupiter429CooldownMs: 7000
    }
  };
  return presets[preset] || presets.balanced;
}

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), ".env");

  try {
    const raw = fsSync.readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env is optional when environment variables are supplied by the host.
  }
}

async function ensureDataFiles() {
  await ensureDataDir();
  await writeJsonIfMissing(walletPath(), { wallets: [] });
  await writeJsonIfMissing(auditPath(), { entries: [] });
  await writeJsonIfMissing(statePath(), { paused: false });
  await writeJsonIfMissing(tradePlansPath(), { plans: [] });
  await writeJsonIfMissing(dcaPlansPath(), { plans: [] });
  await writeJsonIfMissing(sniperSettingsPath(), { users: {} });
  await writeJsonIfMissing(tradeHistoryPath(), { trades: [] });
  await ensureAppSecretFingerprint();
  await assignUnownedWalletsToSingleAdmin();
  await validateStoredWalletSecrets();
}

async function ensureDataDir() {
  try {
    await fs.mkdir(CONFIG.dataDir, { recursive: true });
    await fs.access(CONFIG.dataDir, fsSync.constants.R_OK | fsSync.constants.W_OK);
  } catch (error) {
    if (isPermissionError(error)) {
      if (CONFIG.allowEphemeralStorage) {
        const fallbackDir = path.resolve(process.cwd(), "data");
        await fs.mkdir(fallbackDir, { recursive: true });
        await fs.access(fallbackDir, fsSync.constants.R_OK | fsSync.constants.W_OK);
        console.warn(`DATA_DIR ${CONFIG.dataDir} is not writable. Falling back to ephemeral storage at ${fallbackDir}. Wallet data can reset on free Render.`);
        CONFIG.dataDir = fallbackDir;
        return;
      }

      throw new Error([
        `Cannot write DATA_DIR at ${CONFIG.dataDir}.`,
        "On Render, this usually means the persistent disk is not mounted.",
        "Fix: add a persistent disk to this Web Service with mount path /var/data, keep DATA_DIR=/var/data, and redeploy.",
        "For free Render testing, set ALLOW_EPHEMERAL_STORAGE=true and use the bot's Export Backup button after wallet changes.",
        "If you created a normal Web Service from Git instead of a Blueprint, render.yaml did not automatically attach the disk.",
        "Do not change DATA_DIR to an ephemeral path for real wallets, or wallet data can reset on redeploy."
      ].join(" "));
    }

    throw error;
  }
}

function isPermissionError(error) {
  return ["EACCES", "EPERM", "EROFS"].includes(error?.code);
}

async function writeJsonIfMissing(filePath, value) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(value, null, 2));
  }
}

function walletPath() {
  return path.join(CONFIG.dataDir, "wallets.json");
}

function auditPath() {
  return path.join(CONFIG.dataDir, "audit-log.json");
}

function statePath() {
  return path.join(CONFIG.dataDir, "state.json");
}

function tradePlansPath() {
  return path.join(CONFIG.dataDir, "trade-plans.json");
}

function dcaPlansPath() {
  return path.join(CONFIG.dataDir, "dca-plans.json");
}

function sniperSettingsPath() {
  return path.join(CONFIG.dataDir, "sniper-settings.json");
}

function tradeHistoryPath() {
  return path.join(CONFIG.dataDir, "trade-history.json");
}

function appSecretFingerprintPath() {
  return path.join(CONFIG.dataDir, "app-secret.json");
}

async function ensureAppSecretFingerprint() {
  const current = appSecretFingerprint();

  try {
    const stored = await readJson(appSecretFingerprintPath());
    if (stored.fingerprint === current) return;

    const store = await readWalletStore();
    if (store.wallets.length > 0) {
      throw new Error(
        "APP_SECRET does not match this DATA_DIR. Keep the same APP_SECRET on Render, or existing encrypted wallets cannot be used."
      );
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  await fs.writeFile(appSecretFingerprintPath(), JSON.stringify({
    algorithm: "sha256",
    fingerprint: current,
    createdAt: new Date().toISOString()
  }, null, 2));
}

async function validateStoredWalletSecrets() {
  const store = await readWalletStore();

  try {
    for (const wallet of store.wallets) {
      decryptWallet(wallet);
    }
  } catch {
    throw new Error(
      "Stored wallets could not be decrypted. Check that Render is using the same APP_SECRET that created/imported these wallets."
    );
  }
}

async function assignUnownedWalletsToSingleAdmin() {
  const store = await readWalletStore();
  const unowned = store.wallets.filter((wallet) => wallet.ownerId === undefined || wallet.ownerId === null);

  if (unowned.length === 0) return;

  if (CONFIG.adminUserIds.length !== 1) {
    console.warn("Found wallets without ownerId. They are hidden until TELEGRAM_ADMIN_USER_IDS has exactly one admin for migration.");
    return;
  }

  for (const wallet of unowned) {
    wallet.ownerId = CONFIG.adminUserIds[0];
  }

  await writeWalletStore(store);
  console.log(`Assigned ${unowned.length} existing wallet(s) to admin ${CONFIG.adminUserIds[0]}.`);
}

function appSecretFingerprint() {
  return crypto.createHash("sha256").update(CONFIG.appSecret).digest("hex");
}

async function sendLoop() {
  let offset = 0;
  console.log("Telegram bot is running.");

  while (true) {
    try {
      const result = await telegram("getUpdates", {
        offset,
        timeout: 30,
        allowed_updates: ["message", "callback_query"]
      });

      for (const update of result) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
    } catch (error) {
      console.error("Polling error:", error.message);
      await sleep(2000);
    }
  }
}

async function handleUpdate(update) {
  const user = update.callback_query?.from || update.message?.from;
  if (!user?.id) {
    return;
  }

  if (update.callback_query) {
    await handleCallback(update.callback_query, user.id);
    return;
  }

  if (update.message) {
    await handleMessage(update.message, user.id);
  }
}

async function handleCallback(query, userId) {
  const chatId = query.message.chat.id;
  const chat = query.message.chat;
  const messageId = query.message?.message_id;
  void telegram("answerCallbackQuery", { callback_query_id: query.id }).catch(() => {});

  if (ADMIN_ACTIONS.has(query.data) && !isAdmin(userId)) {
    await say(chatId, "Only bot admins can use that control.");
    return;
  }

  if (PRIVATE_CHAT_ACTIONS.has(query.data) && !isPrivateChat(chat)) {
    await say(chatId, "Open this bot in DM to use wallet and trading features. That keeps wallet prompts out of group chat.");
    return;
  }

  if (query.data?.startsWith("howto_")) {
    if (!isPrivateChat(chat)) {
      await say(chatId, "Open this bot in DM to use the How To guide.");
      return;
    }
    await showHowToPage(chatId, query.data.replace("howto_", ""), messageId);
    return;
  }

  if (query.data?.startsWith("quick:")) {
    if (!isPrivateChat(chat)) {
      await say(chatId, "Open this bot in DM to use wallet and trading quick buttons.");
      return;
    }
    await handleQuickButton(chatId, query.data, userId, query.message?.message_id);
    return;
  }

  if (query.data === "pnl_card" || query.data?.startsWith("pnl_card:")) {
    if (!isPrivateChat(chat)) {
      await say(chatId, "Open this bot in DM to create a PnL card.");
      return;
    }
    const tokenMint = query.data.startsWith("pnl_card:")
      ? query.data.slice("pnl_card:".length)
      : null;
    await sendPnlCard(chatId, userId, tokenMint);
    return;
  }

  if (query.data?.startsWith("sniper_pick:")) {
    if (!isPrivateChat(chat)) {
      await say(chatId, "Open this bot in DM to use OgreSniper.");
      return;
    }
    if (await isPausedActionBlocked("sniper_pick")) {
      await say(chatId, "Emergency stop is active. Use Unlock Bot to re-enable transaction flows.");
      return;
    }
    await startSniperPickFlow(chatId, userId, query.data.slice("sniper_pick:".length), messageId);
    return;
  }

  if (await isPausedActionBlocked(query.data)) {
    await say(chatId, "Emergency stop is active. Use Unlock Bot to re-enable transaction flows.");
    return;
  }

  switch (query.data) {
    case "quick_start":
      await showHowToMenu(chatId, messageId);
      break;
    case "main_menu":
      await showMenu(chatId, userId, messageId);
      break;
    case "backup_menu":
      await showBackupMenu(chatId, messageId);
      break;
    case "wallet_menu":
      await showWalletMenu(chatId, messageId);
      break;
    case "trade_menu":
      await showTradeMenu(chatId, messageId);
      break;
    case "sniper_menu":
      await showSniperMenu(chatId, userId, messageId);
      break;
    case "sniper_auto_menu":
      await showSniperAutoMenu(chatId, userId, messageId);
      break;
    case "sniper_modes":
      await showSniperModes(chatId, userId, messageId);
      break;
    case "sniper_scan":
      await showSniperScan(chatId, userId, messageId);
      break;
    case "sniper_auto":
      await startAutoSnipeFlow(chatId, userId, messageId);
      break;
    case "sniper_pumpsnipe":
      await startPumpSnipeFlow(chatId, userId, messageId);
      break;
    case "sniper_mode_safe":
    case "sniper_mode_smart":
    case "sniper_mode_fast":
    case "sniper_mode_moonshot":
    case "sniper_mode_meme":
    case "sniper_mode_ai":
    case "sniper_mode_long":
      await updateSniperMode(chatId, userId, query.data.replace("sniper_mode_", ""), messageId);
      break;
    case "bundle_menu":
      await showBundleMenu(chatId, messageId);
      break;
    case "auto_bundle":
      sessions.set(chatId, {
        step: "auto_bundle_token",
        userId,
        data: {
          tradeMode: "bundle",
          autoBundle: true,
          planSource: "auto_bundle",
          allowRepeat: false
        }
      });
      await say(chatId, withBrandFooter([
        "Auto Bundle",
        "",
        "Send the token mint / CA.",
        "",
        `Default exits: -${AUTO_BUNDLE_STOP_LOSS_PCT}% stop-loss and +${AUTO_BUNDLE_TAKE_PROFIT_PCT}% take-profit.`,
        "After wallet and amount, you can use defaults or customize full exits, wallet-by-wallet profit targets, or 25% ladder chunks."
      ].join("\n")));
      break;
    case "withdrawal_menu":
      await showWithdrawalMenu(chatId, messageId);
      break;
    case "create_wallets":
      setSession(chatId, "create_wallets_label", userId);
      await say(chatId, "Send a label for this wallet set.");
      break;
    case "import_wallet":
      setSession(chatId, "import_wallet_label", userId);
      await say(chatId, "Send a label for this wallet.");
      break;
    case "delete_wallets":
      setSession(chatId, "delete_wallets_select", userId);
      await say(chatId, await walletPrompt(userId, [
        "Send wallet numbers to remove from the bot, separated by commas, or `all`.",
        "",
        "This only deletes the saved bot wallet record. It does not move SOL or tokens on-chain.",
        "The bot will send an encrypted backup file before removing anything."
      ].join("\n")));
      break;
    case "list_wallets":
      await listWallets(chatId, userId);
      break;
    case "check_balances":
      await showWalletBalances(chatId, userId, messageId);
      break;
    case "pnl_results":
      await showPnlResults(chatId, userId, messageId);
      break;
    case "pnl_card_by_ca":
      setSession(chatId, "pnl_card_token", userId);
      await say(chatId, "Paste the token mint / CA for the PnL card. Example: `5RAZ...pump`.\n\nCards only work for tokens traded from this bot.");
      break;
    case "positions_overview":
      await showPositionsOverview(chatId, userId, messageId);
      break;
    case "copy_trade_info":
      await say(chatId, copyTradeText());
      break;
    case "export_backup":
      await exportWalletBackup(chatId, userId);
      break;
    case "export_private_keys":
      setSession(chatId, "export_private_keys_confirm", userId);
      await say(chatId, [
        "Emergency Key Export will send raw private keys for your bot wallets.",
        "",
        "Only use this if you need to recover funds in Phantom/Solflare or another wallet.",
        "Anyone with this file can drain those wallets.",
        "",
        "Reply `EXPORT KEYS` to continue, or `/cancel`."
      ].join("\n"));
      break;
    case "restore_backup":
      setSession(chatId, "restore_backup", userId);
      await say(chatId, "Paste the backup text, upload the backup .txt file, or paste emergency key text that contains `Base58 secret key:` / `JSON secret key:` lines.");
      break;
    case "rescue_backup_keys":
      setSession(chatId, "rescue_backup_keys", userId);
      await say(chatId, [
        "Upload the backup .txt file, paste the backup text, or paste emergency key text.",
        "",
        "I will read the backup or extract the wallet keys from pasted text, then send a private-key recovery file without needing the wallets to already be restored.",
        "Only do this in DM. Delete the recovery file after importing into Solflare/Phantom."
      ].join("\n"));
      break;
    case "fund_wallets":
      setSession(chatId, "fund_source", userId);
      await say(chatId, await walletPrompt(userId, "Send the source wallet number. This source must be one of your managed wallets."));
      break;
    case "batch_buy":
      setSession(chatId, "buy_token", userId);
      await say(chatId, withBrandFooter("Send the token mint address you want to buy."));
      break;
    case "batch_sell":
      setSession(chatId, "sell_token", userId);
      await say(chatId, "Send the token mint address you want to sell from all selected wallets.");
      break;
    case "trade_buy":
      sessions.set(chatId, { step: "trade_buy_wallet", userId, data: { tradeMode: "single" } });
      await say(chatId, await walletPrompt(userId, "Choose one wallet to buy from. Send the wallet number."));
      break;
    case "trade_sell":
      sessions.set(chatId, { step: "trade_sell_wallet", userId, data: { tradeMode: "single" } });
      await say(chatId, await walletPrompt(userId, "Choose one wallet to sell from. Send the wallet number."));
      break;
    case "trade_auto_sell":
      sessions.set(chatId, { step: "trade_plan_wallet", userId, data: { tradeMode: "single", allowRepeat: false } });
      await say(chatId, await walletPrompt(userId, "Choose one wallet for the auto-sell / timed plan. Send the wallet number."));
      break;
    case "trade_dca_buy":
      sessions.set(chatId, { step: "trade_dca_wallet", userId, data: { tradeMode: "single", side: "buy" } });
      await say(chatId, await walletPrompt(userId, "Choose one wallet for this DCA buy. Send the wallet number."));
      break;
    case "trade_dca_sell":
      sessions.set(chatId, { step: "trade_dca_wallet", userId, data: { tradeMode: "single", side: "sell" } });
      await say(chatId, await walletPrompt(userId, "Choose one wallet for this DCA sell. Send the wallet number."));
      break;
    case "dca_buy":
      sessions.set(chatId, { step: "dca_token", userId, data: { side: "buy" } });
      await say(chatId, dcaIntroText("buy"));
      break;
    case "dca_sell":
      sessions.set(chatId, { step: "dca_token", userId, data: { side: "sell" } });
      await say(chatId, dcaIntroText("sell"));
      break;
    case "timed_trade_plans":
      sessions.set(chatId, { step: "plan_token", userId, data: { allowRepeat: true } });
      await say(chatId, timedTradePlanIntroText());
      break;
    case "sell_all_tokens":
      sessions.set(chatId, { step: "sell_all_tokens_wallets", userId, data: {} });
      await say(chatId, await walletPrompt(userId, "Send one wallet number, multiple wallet numbers, `all`, or `group: group name`.\n\nThe bot will sell every SPL token it can route through Jupiter into SOL."));
      break;
    case "sweep_sol":
      setSession(chatId, "sweep_sol_destination", userId);
      await say(chatId, "Send the destination wallet address for swept SOL.");
      break;
    case "sweep_tokens":
      setSession(chatId, "sweep_tokens_destination", userId);
      await say(chatId, "Send the destination wallet address for swept SPL tokens.");
      break;
    case "close_empty_accounts":
      setSession(chatId, "close_empty_accounts_wallets", userId);
      await say(chatId, await walletPrompt(userId, "Send wallet numbers to check, separated by commas, or `all`."));
      break;
    case "export_audit":
      await exportAudit(chatId);
      break;
    case "emergency_stop":
      await setPaused(true);
      clearSession(chatId);
      await audit("emergency_stop", { chatId });
      await say(chatId, "Emergency stop is active. Transaction flows are locked.");
      break;
    case "unlock_bot":
      setSession(chatId, "unlock_confirm", userId);
      await sendConfirmPrompt(chatId, "Confirm unlock:\n\nThis re-enables transaction flows after emergency stop.");
      break;
    default:
      await say(chatId, "Unknown menu action. Use /start to reopen the menu.");
  }
}

async function handleQuickButton(chatId, callbackData, userId, messageId = null) {
  const session = sessions.get(chatId);
  if (!session || String(session.userId) !== String(userId)) {
    scheduleInlineKeyboardClear(chatId, messageId);
    await say(chatId, "That quick button expired. Use /start and choose the action again.");
    return;
  }

  const value = callbackData.slice("quick:".length);

  if (value === "cancel") {
    scheduleInlineKeyboardClear(chatId, messageId);
    clearSession(chatId);
    await say(chatId, "Current flow canceled.");
    await showMenu(chatId, userId);
    return;
  }

  if (value === "yes") {
    if (session.executing) {
      await say(chatId, "Already executing this action. Please wait for the result.");
      return;
    }
    session.executing = true;
    scheduleInlineKeyboardClear(chatId, messageId);
  }

  if (messageId) {
    session.activePromptMessageId = messageId;
  }

  if (value === "custom") {
    await sendFlowPrompt(chatId, "Type your custom value now, or /cancel.", { inline_keyboard: [] }, { brand: false });
    return;
  }

  await continueFlow(chatId, value, session);
}

async function clearInlineKeyboard(chatId, messageId) {
  if (!messageId) return;

  try {
    await telegram("editMessageReplyMarkup", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: [] }
    });
  } catch {
    // Best-effort cleanup only. Telegram may reject edits for old messages.
  }
}

function scheduleInlineKeyboardClear(chatId, messageId) {
  if (!messageId) return;
  void clearInlineKeyboard(chatId, messageId).catch(() => {});
}

async function handleMessage(message, userId) {
  const chatId = message.chat.id;
  const text = (message.text || "").trim();
  const session = sessions.get(chatId);

  if (message.document) {
    try {
      await handleDocumentMessage(message, userId, session);
    } catch (error) {
      await say(chatId, `Backup file error: ${friendlyBackupError(error)}`);
    }
    return;
  }

  if (!text) return;

  if (text === "/start" || text === "/menu") {
    clearSession(chatId);
    await showMenu(chatId, userId);
    return;
  }

  if (text === "/cancel") {
    clearSession(chatId);
    await say(chatId, "Current flow canceled.");
    await showMenu(chatId, userId);
    return;
  }

  if (text === "/wallets") {
    if (!isPrivateChat(message.chat)) {
      await say(chatId, "Open this bot in DM to view your wallets.");
      return;
    }
    await listWallets(chatId, userId);
    return;
  }

  if (text === "/deletewallets" || text === "/removewallets") {
    if (!isPrivateChat(message.chat)) {
      await say(chatId, "Open this bot in DM to remove saved wallets.");
      return;
    }
    setSession(chatId, "delete_wallets_select", userId);
    await say(chatId, await walletPrompt(userId, [
      "Send wallet numbers to remove from the bot, separated by commas, or `all`.",
      "",
      "This only deletes the saved bot wallet record. It does not move SOL or tokens on-chain.",
      "The bot will send an encrypted backup file before removing anything."
    ].join("\n")));
    return;
  }

  if (text === "/restore" || text === "/backup") {
    if (!isPrivateChat(message.chat)) {
      await say(chatId, "Open this bot in DM to restore a backup.");
      return;
    }
    setSession(chatId, "restore_backup", userId);
    await say(chatId, "Upload the backup .txt file, paste the full backup text, or paste emergency key text with Base58/JSON secret-key lines.");
    return;
  }

  if (text === "/rescue") {
    if (!isPrivateChat(message.chat)) {
      await say(chatId, "Open this bot in DM to use rescue recovery.");
      return;
    }
    setSession(chatId, "rescue_backup_keys", userId);
    await say(chatId, "Upload the backup .txt file or paste backup/emergency-key text. I will send a private-key recovery file.");
    return;
  }

  if (text === "/balances" || text === "/balance") {
    if (!isPrivateChat(message.chat)) {
      await say(chatId, "Open this bot in DM to check wallet balances.");
      return;
    }
    await showWalletBalances(chatId, userId);
    return;
  }

  if (text === "/trade") {
    if (!isPrivateChat(message.chat)) {
      await say(chatId, "Open this bot in DM to trade.");
      return;
    }
    await showTradeMenu(chatId);
    return;
  }

  if (text === "/sniper") {
    if (!isPrivateChat(message.chat)) {
      await say(chatId, "Open this bot in DM to use OgreSniper.");
      return;
    }
    await showSniperMenu(chatId, userId);
    return;
  }

  if (text === "/buy") {
    if (!isPrivateChat(message.chat)) {
      await say(chatId, "Open this bot in DM to buy.");
      return;
    }
    sessions.set(chatId, { step: "trade_buy_wallet", userId, data: { tradeMode: "single" } });
    await say(chatId, await walletPrompt(userId, "Choose one wallet to buy from. Send the wallet number."));
    return;
  }

  if (text === "/bundle") {
    if (!isPrivateChat(message.chat)) {
      await say(chatId, "Open this bot in DM to use bundle tools.");
      return;
    }
    await showBundleMenu(chatId);
    return;
  }

  if (text === "/sell") {
    if (!isPrivateChat(message.chat)) {
      await say(chatId, "Open this bot in DM to sell.");
      return;
    }
    sessions.set(chatId, { step: "trade_sell_wallet", userId, data: { tradeMode: "single" } });
    await say(chatId, await walletPrompt(userId, "Choose one wallet to sell from. Send the wallet number."));
    return;
  }

  if (text === "/positions") {
    if (!isPrivateChat(message.chat)) {
      await say(chatId, "Open this bot in DM to view positions.");
      return;
    }
    await showPositionsOverview(chatId, userId);
    return;
  }

  const pnlCommand = parseCommandWithArgument(text, ["pnl"]);
  if (pnlCommand) {
    if (!isPrivateChat(message.chat)) {
      await say(chatId, "Open this bot in DM to view PnL.");
      return;
    }
    if (pnlCommand.argument) {
      await sendPnlCardForTokenText(chatId, userId, pnlCommand.argument);
    } else {
      await showPnlResults(chatId, userId);
    }
    return;
  }

  const pnlCardCommand = parseCommandWithArgument(text, ["pnlcard", "pnl_card", "card"]);
  if (pnlCardCommand) {
    if (!isPrivateChat(message.chat)) {
      await say(chatId, "Open this bot in DM to create a PnL card.");
      return;
    }
    if (pnlCardCommand.argument) {
      await sendPnlCardForTokenText(chatId, userId, pnlCardCommand.argument);
    } else {
      setSession(chatId, "pnl_card_token", userId);
      await say(chatId, "Paste the token mint / CA for the PnL card. You can also use `/pnlcard CA` in one message.");
    }
    return;
  }

  if (text === "/withdraw" || text === "/sweep") {
    if (!isPrivateChat(message.chat)) {
      await say(chatId, "Open this bot in DM to withdraw SOL.");
      return;
    }
    setSession(chatId, "sweep_sol_destination", userId);
    await say(chatId, "Send the destination wallet address for withdrawn SOL.");
    return;
  }

  if (!session) {
    await say(chatId, "Use /start to choose an action.");
    return;
  }

  if (String(session.userId) !== String(userId)) {
    await say(chatId, "That active flow belongs to another Telegram user. Use /cancel and start your own flow in DM.");
    return;
  }

  const stepsAllowedWhilePaused = new Set(["unlock_confirm", "restore_backup", "rescue_backup_keys", "export_private_keys_confirm"]);
  if ((await readState()).paused && !stepsAllowedWhilePaused.has(session.step)) {
    clearSession(chatId);
    await say(chatId, "Emergency stop is active. Current flow canceled.");
    return;
  }

  await continueFlow(chatId, text, session);
}

async function handleDocumentMessage(message, userId, session) {
  const chatId = message.chat.id;

  if (!isPrivateChat(message.chat)) {
    await say(chatId, "Open this bot in DM before uploading wallet backup files.");
    return;
  }

  if (session && String(session.userId) !== String(userId)) {
    await say(chatId, "That active flow belongs to another Telegram user. Use /cancel and start your own flow in DM.");
    return;
  }

  if (message.document.file_size && message.document.file_size > 2_000_000) {
    await say(chatId, "That file is too large for a wallet backup. Upload the small .txt backup file the bot sent.");
    return;
  }

  const filename = message.document.file_name || "uploaded file";
  const backupText = await fetchTelegramFileText(message.document.file_id);

  if (session?.step === "rescue_backup_keys") {
    await rescueBackupKeysFlow(chatId, backupText, session);
    return;
  }

  if (session?.step === "restore_backup") {
    await continueFlow(chatId, backupText, session);
    return;
  }

  if (!looksLikeBackupDocument(filename, backupText)) {
    await say(chatId, "I received a file. To restore wallets, use Backup / Restore > Restore Backup, then upload the .txt backup file.");
    return;
  }

  const restoreSession = { step: "restore_backup", userId, data: {} };
  await restoreWalletBackupFlow(chatId, backupText, restoreSession);
}

async function continueFlow(chatId, text, session) {
  try {
    switch (session.step) {
      case "create_wallets_label":
        session.data.label = cleanLabel(text);
        session.step = "create_wallets_count";
        await say(chatId, "How many wallets should I create? Send a number from 1 to 20.");
        break;
      case "create_wallets_count":
        await createWalletsFlow(chatId, text, session);
        break;
      case "import_wallet_label":
        session.data.label = cleanLabel(text);
        session.step = "import_wallet_secret";
        await say(chatId, [
          "Send the private key.",
          "",
          "Accepted formats:",
          "- Base58 secret key from Phantom/Solflare",
          "- JSON byte array like [12,34,...]",
          "- Comma-separated 64-byte array",
          "",
          "Do not send a seed phrase or public wallet address. Delete your Telegram message afterward."
        ].join("\n"));
        break;
      case "import_wallet_secret":
        await importWalletFlow(chatId, text, session);
        break;
      case "delete_wallets_select":
        await prepareDeleteWalletsFlow(chatId, text, session);
        break;
      case "delete_wallets_confirm":
        await confirmDeleteWalletsBackupFlow(chatId, text, session);
        break;
      case "delete_wallets_final_confirm":
        await confirmOrCancel(chatId, text, () => deleteWalletsFlow(chatId, session));
        break;
      case "restore_backup":
        await restoreWalletBackupFlow(chatId, text, session);
        break;
      case "rescue_backup_keys":
        await rescueBackupKeysFlow(chatId, text, session);
        break;
      case "export_private_keys_confirm":
        await exportPrivateKeysConfirmFlow(chatId, text, session);
        break;
      case "pnl_card_token":
        clearSession(chatId);
        await sendPnlCardForTokenText(chatId, session.userId, text);
        break;
      case "fund_source":
        session.data.sourceIndex = parseWalletIndex(text);
        session.step = "fund_targets";
        await say(chatId, await walletPrompt(session.userId, "Send target wallet numbers separated by commas, or `all`."));
        break;
      case "fund_targets":
        session.data.targetIndexes = await parseWalletSelection(text, session.userId, { exclude: [session.data.sourceIndex] });
        session.step = "fund_amount";
        await say(chatId, "Send SOL amount per target wallet.");
        break;
      case "fund_amount":
        session.data.amountSol = parsePositiveNumber(text);
        session.step = "fund_confirm";
        await sendConfirmPrompt(chatId, formatFundConfirm(session.data));
        break;
      case "fund_confirm":
        await confirmOrCancel(chatId, text, () => fundWalletsFlow(chatId, session));
        break;
      case "sniper_wallets":
        session.data.walletIndexes = await parseWalletSelectionOrGroup(text, session.userId);
        session.data.walletSelector = text.trim();
        session.step = "sniper_amount";
        await sendQuickAmountPrompt(chatId, [
          "Send SOL amount to use per wallet.",
          "",
          "Early launches are risky. Start small until the filters prove themselves."
        ].join("\n"));
        break;
      case "sniper_amount":
        session.data.amountSol = parsePositiveNumber(text);
        if (session.data.pumpSnipe) {
          applyPumpSnipeExitPreset(session);
          {
            const preflight = await preflightSniperSelectedRoute(session);
            if (!preflight.ok) {
              await sendSniperPreflightFailure(chatId, session, preflight.reason);
              break;
            }
            session.data.routePrecheckNote = preflight.note;
          }
          session.step = "pumpsnipe_exit_review";
          await sendQuickChoicePrompt(chatId, [
            "PumpSnipe defaults selected.",
            "",
            formatPumpSnipePresetDetails(session.data)
          ].join("\n"), [
            [{ text: "Use Default", value: "use" }, { text: "Customize", value: "customize" }],
            [{ text: "Cancel", value: "cancel" }]
          ], { includeCustom: false });
          break;
        }
        if (session.data.autoSnipe) {
          applyAutoSnipeExitPreset(session);
          {
            const preflight = await preflightSniperSelectedRoute(session);
            if (!preflight.ok) {
              await sendSniperPreflightFailure(chatId, session, preflight.reason);
              break;
            }
            session.data.routePrecheckNote = preflight.note;
          }
          session.step = "sniper_confirm";
          await sendConfirmPrompt(chatId, withBrandFooter(formatSniperConfirm(session.data)));
          break;
        }
        applySniperExitPreset(session, recommendedSniperExitPreset(session.data.score, session.data.settings));
        session.step = "sniper_exit_review";
        await sendQuickChoicePrompt(chatId, [
          "Recommended exit preset selected.",
          "",
          formatSniperPresetDetails(session.data)
        ].join("\n"), [
          [{ text: "Use Preset", value: "use" }, { text: "Customize TP/SL", value: "customize" }],
          [{ text: "Back", value: "back" }]
        ], { includeCustom: false });
        break;
      case "sniper_exit_preset":
        applySniperExitPreset(session, text);
        session.step = "sniper_exit_review";
        await sendQuickChoicePrompt(chatId, formatSniperPresetDetails(session.data), [
          [{ text: "Use Preset", value: "use" }, { text: "Customize TP/SL", value: "customize" }],
          [{ text: "Back", value: "back" }]
        ], { includeCustom: false });
        break;
      case "sniper_exit_review": {
        const choice = text.trim().toLowerCase();
        if (choice === "back") {
          session.step = "sniper_exit_preset";
          await sendQuickChoicePrompt(chatId, "Choose an exit preset for this snipe.", [
            [{ text: "Fast Scalp", value: "fast" }, { text: "Balanced", value: "balanced" }],
            [{ text: "Moonbag", value: "moonbag" }, { text: "Safe", value: "safe" }],
            [{ text: "Long Term", value: "long" }]
          ], { includeCustom: false });
          break;
        }
        if (choice === "customize") {
          session.step = "sniper_custom_take_profit";
          await sendQuickChoicePrompt(chatId, "Send custom take-profit percent. Example: `35` sells when estimated value is about +35%.", [
            [{ text: "+20%", value: "20" }, { text: "+35%", value: "35" }],
            [{ text: "+50%", value: "50" }, { text: "+100%", value: "100" }]
          ]);
          break;
        }
        if (choice !== "use") {
          throw new Error("Choose Use Preset, Customize TP/SL, or Back.");
        }
        session.step = "sniper_slippage";
        await sendQuickSlippagePrompt(chatId, `Fast launches move hard. Choose slippage for this snipe, or type default for ${CONFIG.sniperDefaultSlippageBps} bps.`, { defaultBps: CONFIG.sniperDefaultSlippageBps, fastButtons: true });
        break;
      }
      case "sniper_custom_take_profit":
        session.data.takeProfitPct = parseOptionalTriggerPercent(text);
        session.step = "sniper_custom_stop_loss";
        await sendQuickChoicePrompt(chatId, "Send custom stop-loss percent. Example: `12` sells when estimated value is about -12%.", [
          [{ text: "-8%", value: "8" }, { text: "-10%", value: "10" }],
          [{ text: "-15%", value: "15" }, { text: "-25%", value: "25" }]
        ]);
        break;
      case "sniper_custom_stop_loss":
        session.data.stopLossPct = parseOptionalTriggerPercent(text);
        session.data.exitPreset = `${session.data.exitPreset} + Custom TP/SL`;
        session.step = "sniper_slippage";
        await sendQuickSlippagePrompt(chatId, `Custom exits saved: TP +${session.data.takeProfitPct}%, SL -${session.data.stopLossPct}%.\n\nFast launches move hard. Choose slippage for this snipe, or type default for ${CONFIG.sniperDefaultSlippageBps} bps.`, { defaultBps: CONFIG.sniperDefaultSlippageBps, fastButtons: true });
        break;
      case "sniper_slippage":
        session.data.slippageBps = parseSlippage(text, CONFIG.sniperDefaultSlippageBps);
        session.step = "sniper_confirm";
        await sendConfirmPrompt(chatId, withBrandFooter(formatSniperConfirm(session.data)));
        break;
      case "sniper_confirm":
        await confirmOrCancel(chatId, text, () => createSniperTimedPlanFlow(chatId, session));
        break;
      case "pumpsnipe_exit_review": {
        const choice = text.trim().toLowerCase();
        if (choice === "cancel") {
          clearSession(chatId);
          await say(chatId, "PumpSnipe canceled.");
          await showSniperMenu(chatId, session.userId);
          break;
        }
        if (choice === "customize") {
          session.step = "pumpsnipe_custom_take_profit";
          await sendQuickChoicePrompt(chatId, "Choose PumpSnipe take-profit percent.", [
            [{ text: "+25%", value: "25" }, { text: "+40%", value: "40" }],
            [{ text: "+60%", value: "60" }, { text: "+100%", value: "100" }]
          ]);
          break;
        }
        if (choice !== "use") {
          throw new Error("Choose Use Default, Customize, or Cancel.");
        }
        session.step = "pumpsnipe_slippage";
        await sendQuickSlippagePrompt(chatId, `Choose PumpSnipe slippage, or type default for ${PUMPSNIPE_SLIPPAGE_BPS} bps.`, { defaultBps: PUMPSNIPE_SLIPPAGE_BPS, fastButtons: true });
        break;
      }
      case "pumpsnipe_custom_take_profit":
        session.data.takeProfitPct = parseOptionalTriggerPercent(text);
        session.step = "pumpsnipe_custom_stop_loss";
        await sendQuickChoicePrompt(chatId, "Choose PumpSnipe stop-loss percent.", [
          [{ text: "-5%", value: "5" }, { text: "-8%", value: "8" }],
          [{ text: "-10%", value: "10" }, { text: "-15%", value: "15" }]
        ]);
        break;
      case "pumpsnipe_custom_stop_loss":
        session.data.stopLossPct = parseOptionalTriggerPercent(text);
        session.data.exitPreset = "PumpSnipe Custom";
        session.step = "pumpsnipe_slippage";
        await sendQuickSlippagePrompt(chatId, `Custom PumpSnipe exits saved: TP +${session.data.takeProfitPct}%, SL -${session.data.stopLossPct}%.\n\nChoose slippage, or type default for ${PUMPSNIPE_SLIPPAGE_BPS} bps.`, { defaultBps: PUMPSNIPE_SLIPPAGE_BPS, fastButtons: true });
        break;
      case "pumpsnipe_slippage":
        session.data.slippageBps = parseSlippage(text, PUMPSNIPE_SLIPPAGE_BPS);
        session.step = "sniper_confirm";
        await sendConfirmPrompt(chatId, withBrandFooter(formatSniperConfirm(session.data)));
        break;
      case "trade_buy_wallet": {
        const wallet = await setSingleWalletSelection(session, text);
        session.step = "trade_buy_token";
        await say(chatId, withBrandFooter(`Selected wallet: ${wallet.label}\n${wallet.publicKey}\n\nSend the token mint address to buy.`));
        break;
      }
      case "trade_buy_token":
        session.data.tokenMint = parsePublicKey(text).toBase58();
        session.step = "buy_amount";
        await sendQuickAmountPrompt(chatId, [
          `Selected wallet: ${session.data.walletLabel}`,
          `Dexscreener: ${dexScreenerUrl(session.data.tokenMint)}`,
          "",
          "Choose a quick buy amount or type your custom SOL amount.",
          "",
          `Safety reserve kept for fees: ${CONFIG.buyReserveSol} SOL`
        ].join("\n"), { allowMax: true });
        break;
      case "trade_sell_wallet": {
        const wallet = await setSingleWalletSelection(session, text);
        session.step = "trade_sell_token";
        await say(chatId, withBrandFooter(`Selected wallet: ${wallet.label}\n${wallet.publicKey}\n\nSend the token mint address to sell.`));
        break;
      }
      case "trade_sell_token":
        session.data.tokenMint = parsePublicKey(text).toBase58();
        session.step = "sell_percent";
        await sendQuickPercentPrompt(chatId, [
          `Selected wallet: ${session.data.walletLabel}`,
          `Dexscreener: ${dexScreenerUrl(session.data.tokenMint)}`,
          "",
          await selectedTokenBalanceSummary(session.userId, session.data.walletIndexes, session.data.tokenMint),
          "",
          "Choose a quick sell percent or type a custom percent from 1 to 100."
        ].join("\n"));
        break;
      case "trade_plan_wallet": {
        const wallet = await setSingleWalletSelection(session, text);
        session.step = "trade_plan_token";
        await say(chatId, withBrandFooter(`Selected wallet: ${wallet.label}\n${wallet.publicKey}\n\nSend the token mint address for the auto-sell / timed plan.`));
        break;
      }
      case "trade_plan_token":
        session.data.tokenMint = parsePublicKey(text).toBase58();
        session.step = "plan_buy_amount";
        await sendQuickAmountPrompt(chatId, [
          `Selected wallet: ${session.data.walletLabel}`,
          `Dexscreener: ${dexScreenerUrl(session.data.tokenMint)}`,
          "",
          "Choose the SOL amount to buy now. The bot can sell later by timer, take-profit, or stop-loss."
        ].join("\n"));
        break;
      case "trade_dca_wallet": {
        const wallet = await setSingleWalletSelection(session, text);
        session.step = "trade_dca_token";
        await say(chatId, withBrandFooter(`Selected wallet: ${wallet.label}\n${wallet.publicKey}\n\nSend the token mint address for this DCA ${session.data.side}.`));
        break;
      }
      case "trade_dca_token":
        session.data.tokenMint = parsePublicKey(text).toBase58();
        if (session.data.side === "buy") {
          session.step = "dca_buy_total";
          await sendQuickAmountPrompt(chatId, [
            `Selected wallet: ${session.data.walletLabel}`,
            `Dexscreener: ${dexScreenerUrl(session.data.tokenMint)}`,
            "",
            "Send total SOL to DCA from this wallet. Example: `1` split over 5 buys spends 0.2 SOL each buy."
          ].join("\n"));
        } else {
          session.step = "dca_sell_percent";
          await sendQuickPercentPrompt(chatId, [
            `Selected wallet: ${session.data.walletLabel}`,
            `Dexscreener: ${dexScreenerUrl(session.data.tokenMint)}`,
            "",
            await selectedTokenBalanceSummary(session.userId, session.data.walletIndexes, session.data.tokenMint),
            "",
            "Send total percent to DCA sell from this wallet, from 1 to 100."
          ].join("\n"));
        }
        break;
      case "auto_bundle_token":
        session.data.tokenMint = parsePublicKey(text).toBase58();
        session.step = "auto_bundle_wallets";
        await say(chatId, await walletPrompt(session.userId, [
          `Dexscreener: ${dexScreenerUrl(session.data.tokenMint)}`,
          "",
          "Send wallet numbers, `all`, or `group: group name` for Auto Bundle."
        ].join("\n")));
        break;
      case "auto_bundle_wallets":
        session.data.walletIndexes = await parseWalletSelectionOrGroup(text, session.userId);
        session.data.walletSelector = text.trim();
        session.step = "auto_bundle_amount";
        await sendQuickAmountPrompt(chatId, [
          "Choose SOL amount to buy per selected wallet.",
          "",
          `Default exits are -${AUTO_BUNDLE_STOP_LOSS_PCT}% stop-loss and +${AUTO_BUNDLE_TAKE_PROFIT_PCT}% take-profit. You can customize exits next.`
        ].join("\n"));
        break;
      case "auto_bundle_amount":
        session.data.amountSol = parsePositiveNumber(text);
        applyAutoBundleDefaults(session);
        session.step = "auto_bundle_exit_mode";
        await sendQuickChoicePrompt(chatId, [
          "Choose Auto Bundle exit style.",
          "",
          "Default: full sell at +60%, full stop-loss at -10%.",
          "Custom Full Exit: set your own TP/SL and fallback timer.",
          "25% Ladder: sell chunks of the original bag at multiple profit levels.",
          "By Wallet Targets: each wallet gets its own take-profit target."
        ].join("\n"), [
          [{ text: "Use Default", value: "default" }],
          [{ text: "Custom Full Exit", value: "custom" }],
          [{ text: "25% Ladder", value: "ladder" }],
          [{ text: "By Wallet Targets", value: "wallets" }]
        ], { includeCustom: false });
        break;
      case "auto_bundle_exit_mode":
        await handleAutoBundleExitMode(chatId, text, session);
        break;
      case "auto_bundle_take_profit":
        session.data.takeProfitPct = parseOptionalTriggerPercent(text);
        session.data.takeProfitMode = "single";
        session.step = "auto_bundle_stop_loss";
        await sendQuickChoicePrompt(chatId, "Choose stop-loss percent. Example: `10` exits around -10%.", [
          [{ text: "-8%", value: "8" }, { text: "-10%", value: "10" }],
          [{ text: "-15%", value: "15" }, { text: "-25%", value: "25" }]
        ]);
        break;
      case "auto_bundle_ladder_levels":
        session.data.takeProfitMode = "ladder";
        session.data.takeProfitLadder = parseTakeProfitLadder(text);
        session.data.takeProfitPct = session.data.takeProfitLadder[0]?.pct || AUTO_BUNDLE_TAKE_PROFIT_PCT;
        session.data.triggerSellPercent = session.data.takeProfitLadder[0]?.sellPercent || 25;
        session.step = "auto_bundle_stop_loss";
        await sendQuickChoicePrompt(chatId, [
          `Ladder saved: ${formatTakeProfitLadder(session.data.takeProfitLadder)}`,
          "",
          "Choose stop-loss percent. Stop-loss always exits the remaining bag."
        ].join("\n"), [
          [{ text: "-8%", value: "8" }, { text: "-10%", value: "10" }],
          [{ text: "-15%", value: "15" }, { text: "-25%", value: "25" }]
        ]);
        break;
      case "auto_bundle_wallet_targets":
        session.data.takeProfitMode = "wallets";
        session.data.walletTakeProfitTargets = parseWalletTakeProfitTargets(text, session.data.walletIndexes);
        session.data.takeProfitPct = AUTO_BUNDLE_TAKE_PROFIT_PCT;
        session.data.triggerSellPercent = 100;
        session.step = "auto_bundle_stop_loss";
        await sendQuickChoicePrompt(chatId, [
          "Wallet take-profit targets saved.",
          "",
          formatWalletTakeProfitTargets(session.data),
          "",
          "Choose stop-loss percent. Stop-loss exits every selected wallet's remaining bag."
        ].join("\n"), [
          [{ text: "-8%", value: "8" }, { text: "-10%", value: "10" }],
          [{ text: "-15%", value: "15" }, { text: "-25%", value: "25" }]
        ]);
        break;
      case "auto_bundle_stop_loss":
        session.data.stopLossPct = parseOptionalTriggerPercent(text);
        session.step = "auto_bundle_timer";
        await sendQuickChoicePrompt(chatId, "Choose fallback timer if TP/SL does not trigger first.", [
          [{ text: "30 min", value: "30" }, { text: "1 hour", value: "60" }],
          [{ text: "6 hours", value: "360" }, { text: "1 day", value: "1440" }],
          [{ text: "2 days", value: "2880" }]
        ]);
        break;
      case "auto_bundle_timer":
        session.data.sellDelaySeconds = parseSellDelaySeconds(text);
        session.data.sellDelayMinutes = session.data.sellDelaySeconds / 60;
        session.step = "auto_bundle_slippage";
        await sendQuickSlippagePrompt(chatId, `Choose slippage for Auto Bundle, or type default for ${CONFIG.defaultSlippageBps} bps.`);
        break;
      case "auto_bundle_slippage":
        session.data.slippageBps = parseSlippage(text);
        session.step = "auto_bundle_confirm";
        await sendConfirmPrompt(chatId, withBrandFooter(formatTimedTradePlanConfirm(session.data)));
        break;
      case "auto_bundle_confirm":
        await confirmOrCancel(chatId, text, () => createTimedTradePlanFlow(chatId, session));
        break;
      case "buy_token":
        session.data.tokenMint = parsePublicKey(text).toBase58();
        session.step = "buy_wallets";
        await say(chatId, await walletPrompt(session.userId, `Dexscreener: ${dexScreenerUrl(session.data.tokenMint)}\n\nSend buyer wallet numbers separated by commas, or \`all\`.`));
        break;
      case "buy_wallets":
        session.data.walletIndexes = await parseWalletSelection(text, session.userId);
        session.step = "buy_amount";
        await sendQuickAmountPrompt(chatId, [
          "Send SOL amount to spend per wallet.",
          "",
          "Examples:",
          "- `0.05` means spend 0.05 SOL from each selected wallet",
          "- `max` means use each wallet's available SOL except the safety reserve",
          "",
          `Safety reserve kept for fees: ${CONFIG.buyReserveSol} SOL per wallet`
        ].join("\n"), { allowMax: true });
        break;
      case "buy_amount":
        if (["max", "all"].includes(text.trim().toLowerCase())) {
          session.data.amountMode = "max";
        } else {
          session.data.amountMode = "fixed";
          session.data.amountSol = parsePositiveNumber(text);
        }
        if (session.data.amountMode === "max") {
          session.step = "buy_slippage";
          await sendQuickSlippagePrompt(chatId, buySlippagePromptText(session.data));
        } else {
          session.step = "buy_auto_exit";
          await sendQuickChoicePrompt(chatId, [
            "Do you want to add automatic take-profit / stop-loss to this buy?",
            "",
            "No: buys immediately like normal.",
            "Add TP/SL: buys now, then the bot watches and sells on your targets or timer."
          ].join("\n"), [
            [{ text: "No Auto Exit", value: "no" }],
            [{ text: "Add TP/SL", value: "yes" }]
          ], { includeCustom: false });
        }
        break;
      case "buy_auto_exit": {
        const choice = text.trim().toLowerCase();
        if (choice === "no") {
          session.data.autoExit = false;
          session.step = "buy_slippage";
          await sendQuickSlippagePrompt(chatId, buySlippagePromptText(session.data));
          break;
        }
        if (choice !== "yes") {
          throw new Error("Choose No Auto Exit or Add TP/SL.");
        }
        session.data.autoExit = true;
        session.data.sellPercent = 100;
        session.data.triggerSellPercent = 100;
        session.data.loopCount = 1;
        session.step = "buy_auto_take_profit";
        await sendQuickChoicePrompt(chatId, "Choose take-profit percent. TP sells 100% of the tracked bag.", [
          [{ text: "+15%", value: "15" }, { text: "+25%", value: "25" }],
          [{ text: "+50%", value: "50" }, { text: "+100%", value: "100" }]
        ]);
        break;
      }
      case "buy_auto_take_profit":
        session.data.takeProfitPct = parseOptionalTriggerPercent(text);
        session.step = "buy_auto_stop_loss";
        await sendQuickChoicePrompt(chatId, "Choose stop-loss percent. SL sells 100% of the tracked bag.", [
          [{ text: "-8%", value: "8" }, { text: "-10%", value: "10" }],
          [{ text: "-15%", value: "15" }, { text: "-25%", value: "25" }]
        ]);
        break;
      case "buy_auto_stop_loss":
        session.data.stopLossPct = parseOptionalTriggerPercent(text);
        session.step = "buy_auto_timer";
        await sendQuickChoicePrompt(chatId, "Choose fallback auto-sell timer if TP/SL does not trigger first.", [
          [{ text: "5 min", value: "5" }, { text: "30 min", value: "30" }],
          [{ text: "1 hour", value: "60" }, { text: "2 hours", value: "120" }],
          [{ text: "1 day", value: "1440" }]
        ]);
        break;
      case "buy_auto_timer":
        session.data.sellDelaySeconds = parseSellDelaySeconds(text);
        session.data.sellDelayMinutes = session.data.sellDelaySeconds / 60;
        session.step = "buy_slippage";
        await sendQuickSlippagePrompt(chatId, buySlippagePromptText(session.data));
        break;
      case "buy_slippage":
        session.data.slippageBps = parseSlippage(text);
        if (session.data.autoExit) {
          session.step = "buy_auto_confirm";
          await sendConfirmPrompt(chatId, withBrandFooter(formatTimedTradePlanConfirm(session.data)));
        } else {
          session.step = "buy_confirm";
          await sendConfirmPrompt(chatId, withBrandFooter(formatBuyConfirm(session.data)));
        }
        break;
      case "buy_auto_confirm":
        await confirmOrCancel(chatId, text, () => createTimedTradePlanFlow(chatId, session));
        break;
      case "buy_confirm":
        await confirmOrCancel(chatId, text, () => batchBuyFlow(chatId, session));
        break;
      case "sell_token":
        session.data.tokenMint = parsePublicKey(text).toBase58();
        session.step = "sell_wallets";
        await say(chatId, await walletPrompt(session.userId, `Dexscreener: ${dexScreenerUrl(session.data.tokenMint)}\n\nSend seller wallet numbers separated by commas, or \`all\`.`));
        break;
      case "sell_wallets":
        session.data.walletIndexes = await parseWalletSelection(text, session.userId);
        session.step = "sell_percent";
        await sendQuickPercentPrompt(chatId, `${await selectedTokenBalanceSummary(session.userId, session.data.walletIndexes, session.data.tokenMint)}\n\nSend percent to sell from each wallet, from 1 to 100.`);
        break;
      case "sell_percent":
        session.data.percent = parsePercent(text);
        session.step = "sell_slippage";
        await sendQuickSlippagePrompt(chatId, `Send slippage in basis points, or type default for ${CONFIG.defaultSlippageBps} bps.`);
        break;
      case "sell_slippage":
        session.data.slippageBps = parseSlippage(text);
        session.step = "sell_confirm";
        await sendConfirmPrompt(chatId, withBrandFooter(formatSellConfirm(session.data)));
        break;
      case "sell_confirm":
        await confirmOrCancel(chatId, text, () => batchSellFlow(chatId, session));
        break;
      case "plan_token":
        session.data.tokenMint = parsePublicKey(text).toBase58();
        session.step = "plan_wallets";
        await say(chatId, await walletPrompt(session.userId, `Dexscreener: ${dexScreenerUrl(session.data.tokenMint)}\n\nSend wallet numbers, \`all\`, or \`group: group name\` for the timed trade plan.`));
        break;
      case "plan_wallets":
        session.data.walletIndexes = await parseWalletSelectionOrGroup(text, session.userId);
        session.data.walletSelector = text.trim();
        session.step = "plan_buy_amount";
        await sendQuickAmountPrompt(chatId, "Send SOL amount to buy per wallet. Timed plans use a fixed amount, for example `0.05`.");
        break;
      case "plan_buy_amount":
        session.data.amountSol = parsePositiveNumber(text);
        session.step = "plan_sell_delay";
        await sendQuickChoicePrompt(chatId, "Choose when to auto-sell after the buy. Use `5s` for a quick 5-second exit, or type minutes like `15`.", [
          [{ text: "5 sec", value: "5s" }, { text: "1 min", value: "1" }],
          [{ text: "5 min", value: "5" }, { text: "15 min", value: "15" }],
          [{ text: "30 min", value: "30" }, { text: "60 min", value: "60" }]
        ]);
        break;
      case "plan_sell_delay":
        session.data.sellDelaySeconds = parseSellDelaySeconds(text);
        session.data.sellDelayMinutes = session.data.sellDelaySeconds / 60;
        session.step = "plan_sell_percent";
        await sendQuickPercentPrompt(chatId, "Send percent to sell when the timer, take-profit, or stop-loss triggers. Example: `100`.");
        break;
      case "plan_sell_percent":
        session.data.sellPercent = parsePercent(text);
        session.step = "plan_take_profit";
        await sendQuickChoicePrompt(chatId, "Send take-profit percent up, or `0` / `off` to disable. Example: `25` sells when estimated value is about +25%.", [
          [{ text: "Off", value: "0" }, { text: "+10%", value: "10" }],
          [{ text: "+25%", value: "25" }, { text: "+50%", value: "50" }]
        ]);
        break;
      case "plan_take_profit":
        session.data.takeProfitPct = parseOptionalTriggerPercent(text);
        session.step = "plan_stop_loss";
        await sendQuickChoicePrompt(chatId, "Send stop-loss percent down, or `0` / `off` to disable. Example: `10` sells when estimated value is about -10%.", [
          [{ text: "Off", value: "0" }, { text: "-10%", value: "10" }],
          [{ text: "-25%", value: "25" }, { text: "-50%", value: "50" }]
        ]);
        break;
      case "plan_stop_loss":
        session.data.stopLossPct = parseOptionalTriggerPercent(text);
        if (session.data.allowRepeat) {
          session.step = "plan_loop_count";
          await sendQuickChoicePrompt(chatId, "Repeat cycles: choose how many total buy/sell cycles this plan should run.", [
            [{ text: "Repeat 1x", value: "1" }, { text: "Repeat 5x", value: "5" }],
            [{ text: "Repeat 10x", value: "10" }]
          ]);
        } else {
          session.data.loopCount = 1;
          session.step = "plan_slippage";
          await sendQuickSlippagePrompt(chatId, `Send slippage in basis points, or type default for ${CONFIG.defaultSlippageBps} bps.`);
        }
        break;
      case "plan_loop_count":
        session.data.loopCount = parseLoopCount(text);
        session.step = "plan_slippage";
        await sendQuickSlippagePrompt(chatId, `Send slippage in basis points, or type default for ${CONFIG.defaultSlippageBps} bps.`);
        break;
      case "plan_slippage":
        session.data.slippageBps = parseSlippage(text);
        session.step = "plan_confirm";
        await sendConfirmPrompt(chatId, withBrandFooter(formatTimedTradePlanConfirm(session.data)));
        break;
      case "plan_confirm":
        await confirmOrCancel(chatId, text, () => createTimedTradePlanFlow(chatId, session));
        break;
      case "dca_token":
        session.data.tokenMint = parsePublicKey(text).toBase58();
        session.step = "dca_wallets";
        await say(chatId, await walletPrompt(session.userId, `Dexscreener: ${dexScreenerUrl(session.data.tokenMint)}\n\nSend wallet numbers, \`all\`, or \`group: group name\` for this DCA ${session.data.side}.`));
        break;
      case "dca_wallets":
        session.data.walletIndexes = await parseWalletSelectionOrGroup(text, session.userId);
        session.data.walletSelector = text.trim();
        if (session.data.side === "buy") {
          session.step = "dca_buy_total";
          await sendQuickAmountPrompt(chatId, "Send total SOL to DCA from each selected wallet. Example: `1` split over 5 buys spends 0.2 SOL each buy.");
        } else {
          session.step = "dca_sell_percent";
          await sendQuickPercentPrompt(chatId, `${await selectedTokenBalanceSummary(session.userId, session.data.walletIndexes, session.data.tokenMint)}\n\nSend total percent to DCA sell from each selected wallet, from 1 to 100.`);
        }
        break;
      case "dca_buy_total":
        session.data.totalSol = parsePositiveNumber(text);
        session.step = "dca_orders";
        await sendQuickChoicePrompt(chatId, "How many DCA orders? Send a number from 2 to 50.", [
          [{ text: "2", value: "2" }, { text: "3", value: "3" }, { text: "5", value: "5" }],
          [{ text: "10", value: "10" }]
        ]);
        break;
      case "dca_sell_percent":
        session.data.totalPercent = parsePercent(text);
        session.step = "dca_orders";
        await sendQuickChoicePrompt(chatId, "How many DCA sell orders? Send a number from 2 to 50.", [
          [{ text: "2", value: "2" }, { text: "3", value: "3" }, { text: "5", value: "5" }],
          [{ text: "10", value: "10" }]
        ]);
        break;
      case "dca_orders":
        session.data.orderCount = parseDcaOrderCount(text);
        session.step = "dca_interval";
        await sendQuickChoicePrompt(chatId, "Send minutes between each DCA order. Example: `5` runs one slice every 5 minutes.", [
          [{ text: "1 min", value: "1" }, { text: "5 min", value: "5" }],
          [{ text: "15 min", value: "15" }, { text: "60 min", value: "60" }]
        ]);
        break;
      case "dca_interval":
        session.data.intervalMinutes = parseDelayMinutes(text);
        session.step = "dca_slippage";
        await sendQuickSlippagePrompt(chatId, `Send slippage in basis points, or type default for ${CONFIG.defaultSlippageBps} bps.`);
        break;
      case "dca_slippage":
        session.data.slippageBps = parseSlippage(text);
        session.step = "dca_confirm";
        await sendConfirmPrompt(chatId, withBrandFooter(formatDcaPlanConfirm(session.data)));
        break;
      case "dca_confirm":
        await confirmOrCancel(chatId, text, () => createDcaPlanFlow(chatId, session));
        break;
      case "sell_all_tokens_wallets":
        session.data.walletIndexes = await parseWalletSelectionOrGroup(text, session.userId);
        session.data.walletSelector = text.trim();
        session.step = "sell_all_tokens_after";
        await sendQuickChoicePrompt(chatId, [
          "After selling all selected wallet tokens into SOL, where should the SOL stay?",
          "",
          "Keep in wallets: leaves each wallet's SOL in place.",
          "Send to one wallet: drains each selected wallet's SOL after the sells finish."
        ].join("\n"), [
          [{ text: "Keep in wallets", value: "keep" }],
          [{ text: "Send to one wallet", value: "sweep" }]
        ], { includeCustom: false });
        break;
      case "sell_all_tokens_after":
        if (text.trim().toLowerCase() === "keep") {
          session.data.sweepAfter = false;
          session.step = "sell_all_tokens_slippage";
          await sendQuickSlippagePrompt(chatId, `Choose slippage for selling all tokens, or type default for ${CONFIG.defaultSlippageBps} bps.`);
        } else if (text.trim().toLowerCase() === "sweep") {
          session.data.sweepAfter = true;
          session.step = "sell_all_tokens_destination";
          await say(chatId, "Send the destination wallet address that should receive all SOL after the token sells.");
        } else {
          await sendQuickChoicePrompt(chatId, "Choose where SOL should go after selling tokens.", [
            [{ text: "Keep in wallets", value: "keep" }],
            [{ text: "Send to one wallet", value: "sweep" }]
          ], { includeCustom: false });
        }
        break;
      case "sell_all_tokens_destination":
        session.data.destination = parsePublicKey(text).toBase58();
        session.step = "sell_all_tokens_slippage";
        await sendQuickSlippagePrompt(chatId, `Choose slippage for selling all tokens, or type default for ${CONFIG.defaultSlippageBps} bps.`);
        break;
      case "sell_all_tokens_slippage":
        session.data.slippageBps = parseSlippage(text);
        session.step = "sell_all_tokens_confirm";
        await sendConfirmPrompt(chatId, withBrandFooter(formatSellAllTokensConfirm(session.data)));
        break;
      case "sell_all_tokens_confirm":
        await confirmOrCancel(chatId, text, () => sellAllTokensFlow(chatId, session));
        break;
      case "sweep_sol_destination":
        session.data.destination = parsePublicKey(text).toBase58();
        session.step = "sweep_sol_wallets";
        await say(chatId, await walletPrompt(session.userId, "Send wallet numbers to sweep, separated by commas, or `all`."));
        break;
      case "sweep_sol_wallets":
        session.data.walletIndexes = await parseWalletSelection(text, session.userId);
        session.step = "sweep_sol_confirm";
        await sendConfirmPrompt(chatId, formatSweepSolConfirm(session.data));
        break;
      case "sweep_sol_confirm":
        await confirmOrCancel(chatId, text, () => sweepSolFlow(chatId, session));
        break;
      case "sweep_tokens_destination":
        session.data.destination = parsePublicKey(text).toBase58();
        session.step = "sweep_tokens_wallets";
        await say(chatId, await walletPrompt(session.userId, "Send wallet numbers to sweep tokens from, separated by commas, or `all`."));
        break;
      case "sweep_tokens_wallets":
        session.data.walletIndexes = await parseWalletSelection(text, session.userId);
        session.step = "sweep_tokens_mint";
        await say(chatId, "Send a token mint to sweep, or type `all` to sweep every SPL token found.");
        break;
      case "sweep_tokens_mint":
        session.data.tokenMint = text.toLowerCase() === "all" ? "all" : parsePublicKey(text).toBase58();
        session.step = "sweep_tokens_confirm";
        await sendConfirmPrompt(chatId, formatSweepTokensConfirm(session.data));
        break;
      case "sweep_tokens_confirm":
        await confirmOrCancel(chatId, text, () => sweepTokensFlow(chatId, session));
        break;
      case "close_empty_accounts_wallets":
        session.data.walletIndexes = await parseWalletSelection(text, session.userId);
        session.step = "close_empty_accounts_confirm";
        await sendConfirmPrompt(chatId, formatCloseAccountsConfirm(session.data));
        break;
      case "close_empty_accounts_confirm":
        await confirmOrCancel(chatId, text, () => closeEmptyAccountsFlow(chatId, session));
        break;
      case "unlock_confirm":
        await confirmOrCancel(chatId, text, () => unlockBotFlow(chatId, session.userId), { allowWhilePaused: true });
        break;
      default:
        clearSession(chatId);
        await say(chatId, "That flow reset. Use /start to choose an action.");
    }
  } catch (error) {
    session.executing = false;
    await say(chatId, `Input error: ${error.message}`);
  }
}

async function unlockBotFlow(chatId, userId) {
  await setPaused(false);
  await audit("unlock_bot", { chatId });
  clearSession(chatId);
  await say(chatId, "Bot unlocked. Transaction flows are enabled.");
  await showMenu(chatId, userId);
}

async function createWalletsFlow(chatId, text, session) {
  const count = Number.parseInt(text, 10);
  if (!Number.isInteger(count) || count < 1 || count > 20) {
    throw new Error("Wallet count must be from 1 to 20.");
  }

  const store = await readWalletStore();
  const created = [];
  const createdRecords = [];

  for (let index = 1; index <= count; index += 1) {
    const keypair = Keypair.generate();
    const label = `${session.data.label} ${index}`;
    const record = walletRecord(label, keypair, session.userId);
    store.wallets.push(record);
    createdRecords.push(record);
    created.push(`${label}: ${keypair.publicKey.toBase58()}`);
  }

  await writeWalletStore(store);
  await audit("create_wallet_set", {
    chatId,
    userId: session.userId,
    label: session.data.label,
    count,
    publicKeys: created
  });

  clearSession(chatId);
  await say(chatId, `Created ${count} wallet(s):\n\n${created.join("\n")}`);
  await sendAutomaticWalletBackup(chatId, session.userId, "Automatic backup after wallet creation.", session.data.label, createdRecords);
  await showMenu(chatId, session.userId);
}

async function importWalletFlow(chatId, text, session) {
  const keypair = keypairFromSecret(text);
  const store = await readWalletStore();
  const record = walletRecord(session.data.label, keypair, session.userId);
  store.wallets.push(record);
  await writeWalletStore(store);

  await audit("import_wallet", {
    chatId,
    userId: session.userId,
    label: session.data.label,
    publicKey: keypair.publicKey.toBase58()
  });

  clearSession(chatId);
  await say(chatId, `Imported wallet ${session.data.label}: ${keypair.publicKey.toBase58()}`);
  await sendAutomaticWalletBackup(chatId, session.userId, "Automatic backup after wallet import.", session.data.label, [record]);
  await showMenu(chatId, session.userId);
}

async function prepareDeleteWalletsFlow(chatId, text, session) {
  session.data.walletIndexes = await parseWalletSelection(text, session.userId);
  const store = await readWalletStore();
  const selected = session.data.walletIndexes.map((index) => getWalletAt(store, index, session.userId));
  session.data.walletPublicKeys = selected.map((wallet) => wallet.publicKey);
  session.data.wallets = selected.map(publicWallet);
  session.step = "delete_wallets_confirm";
  await sendConfirmPrompt(chatId, withBrandFooter(formatDeleteWalletsConfirm(session.data)));
}

async function confirmDeleteWalletsBackupFlow(chatId, text, session) {
  if (text.trim().toLowerCase() !== "yes") {
    session.executing = false;
    await sendConfirmPrompt(chatId, withBrandFooter(formatDeleteWalletsConfirm(session.data)));
    return;
  }

  if ((await readState()).paused) {
    clearSession(chatId);
    await say(chatId, "Emergency stop is active. Wallet removal canceled.");
    return;
  }

  const store = await readWalletStore();
  const selected = selectedWalletRecordsForDelete(store, session);

  try {
    await say(chatId, "First confirmation received. Sending encrypted backup before final delete confirmation.");
    session.data.backupFilename = await sendWalletBackup(chatId, session.userId, "Encrypted backup before wallet removal.", "removed-wallets", selected);
  } catch (error) {
    session.executing = false;
    await say(chatId, `Backup failed, so I did not remove any wallets: ${formatError(error)}`);
    return;
  }

  session.step = "delete_wallets_final_confirm";
  session.executing = false;
  await sendConfirmPrompt(chatId, withBrandFooter(formatDeleteWalletsFinalConfirm(session.data)));
}

async function deleteWalletsFlow(chatId, session) {
  const store = await readWalletStore();
  const selected = selectedWalletRecordsForDelete(store, session);
  const selectedPublicKeys = new Set(selected.map((wallet) => wallet.publicKey));
  const removedLines = selected.map((wallet) => `${wallet.label}: ${wallet.publicKey}`);

  if (!session.data.backupFilename) {
    try {
      session.data.backupFilename = await sendWalletBackup(chatId, session.userId, "Encrypted backup before wallet removal.", "removed-wallets", selected);
    } catch (error) {
      session.executing = false;
      await say(chatId, `Backup failed, so I did not remove any wallets: ${formatError(error)}`);
      return;
    }
  }

  const before = store.wallets.length;
  store.wallets = store.wallets.filter((wallet) => {
    return !(String(wallet.ownerId) === String(session.userId) && selectedPublicKeys.has(wallet.publicKey));
  });
  const removed = before - store.wallets.length;

  await writeWalletStore(store);
  await audit("delete_wallets", {
    chatId,
    userId: session.userId,
    removed,
    wallets: selected.map(publicWallet)
  });

  clearSession(chatId);
  await say(chatId, [
    `Removed ${removed} wallet record(s) from the bot.`,
    session.data.backupFilename ? `Backup sent first: ${session.data.backupFilename}` : "",
    "",
    "This did not move any SOL or tokens on-chain.",
    "To restore access later, use Backup / Restore > Restore Backup with that backup file and the same APP_SECRET.",
    "",
    removedLines.join("\n")
  ].filter(Boolean).join("\n"));
  await showWalletMenu(chatId);
}

function selectedWalletRecordsForDelete(store, session) {
  const selectedPublicKeys = new Set(session.data.walletPublicKeys || []);
  const selected = store.wallets.filter((wallet) => {
    return String(wallet.ownerId) === String(session.userId) && selectedPublicKeys.has(wallet.publicKey);
  });

  if (selected.length !== selectedPublicKeys.size) {
    throw new Error("One or more selected wallets changed before removal. Start Remove Wallets again.");
  }

  return selected;
}

async function exportWalletBackup(chatId, userId) {
  const sent = await sendWalletBackup(chatId, userId, "Manual backup export.", "manual-all-wallets");
  if (!sent) return;
  await say(chatId, "Backup exported. Keep this file private. It is encrypted with this bot's APP_SECRET, so restore only works if APP_SECRET stays the same.");
}

async function sendAutomaticWalletBackup(chatId, userId, note, groupLabel = "wallets", walletRecords = null) {
  try {
    const filename = await sendWalletBackup(chatId, userId, note, groupLabel, walletRecords);
    await say(chatId, `I sent you an automatic encrypted wallet backup: ${filename}. Keep it private. If Render Free resets, use Restore Backup with that file.`);
  } catch (error) {
    await say(chatId, `Automatic backup failed: ${formatError(error)}. Use Export Backup before funding wallets.`);
  }
}

async function sendWalletBackup(chatId, userId, note, groupLabel = "wallets", walletRecords = null) {
  const store = await readWalletStore();
  const wallets = (walletRecords || walletsForOwner(store, userId))
    .filter((wallet) => String(wallet.ownerId) === String(userId));

  if (wallets.length === 0) {
    await say(chatId, "You do not have any wallets to back up yet.");
    return false;
  }

  const backup = encodeBackup({
    version: 1,
    createdAt: new Date().toISOString(),
    note,
    groupLabel,
    walletCount: wallets.length,
    wallets: wallets.map((wallet) => ({
      label: wallet.label,
      publicKey: wallet.publicKey,
      secret: wallet.secret
    }))
  });

  const filename = `wallet-backup-${sanitizeFilenamePart(groupLabel)}-${userId}-${new Date().toISOString().slice(0, 10)}.txt`;
  await sendDocument(chatId, filename, backup);
  return filename;
}

async function exportPrivateKeysConfirmFlow(chatId, text, session) {
  if (text.trim() !== "EXPORT KEYS") {
    await say(chatId, "Reply exactly `EXPORT KEYS` to export raw private keys, or `/cancel`.");
    return;
  }

  await exportPrivateKeys(chatId, session.userId);
  clearSession(chatId);
  await showMenu(chatId, session.userId);
}

async function exportPrivateKeys(chatId, userId) {
  const store = await readWalletStore();
  const wallets = walletsForOwner(store, userId);

  if (wallets.length === 0) {
    await say(chatId, "You do not have any wallets to export.");
    return;
  }

  await sendPrivateKeyDocument(chatId, userId, wallets, `emergency-private-keys-${userId}`);

  await audit("export_private_keys", {
    chatId,
    userId,
    walletCount: wallets.length
  });

  await say(chatId, "Emergency private key file sent. Delete it after importing/recovering funds. Do not share it with anyone.");
}

async function restoreWalletBackupFlow(chatId, text, session) {
  const backup = parseBackupPayload(text);
  const backupWallets = backupWalletList(backup);
  const store = await readWalletStore();
  const existing = new Set(walletsForOwner(store, session.userId).map((wallet) => wallet.publicKey));
  const restored = [];
  let skipped = 0;
  const errors = [];

  for (const [index, wallet] of backupWallets.entries()) {
    let record;
    try {
      record = walletRecordFromBackup(wallet, session.userId, index);
    } catch (error) {
      skipped += 1;
      errors.push(`Wallet ${index + 1}: ${friendlyBackupError(error)}`);
      continue;
    }

    if (existing.has(record.publicKey)) {
      skipped += 1;
      continue;
    }

    store.wallets.push(record);
    existing.add(record.publicKey);
    restored.push(record.publicKey);
  }

  if (restored.length === 0 && errors.length > 0) {
    throw new Error(`Backup parsed but no wallets could be restored. ${errors.slice(0, 3).join(" ")}`);
  }

  await writeWalletStore(store);
  await audit("restore_wallet_backup", {
    chatId,
    userId: session.userId,
    restored: restored.length,
    skipped
  });

  clearSession(chatId);
  await say(chatId, `Restore complete. Restored ${restored.length} wallet(s). Skipped ${skipped}.`);
  if (restored.length > 0) {
    await sendAutomaticWalletBackup(chatId, session.userId, "Automatic backup after wallet restore.", "restored-wallets");
  }
  await showMenu(chatId, session.userId);
}

async function rescueBackupKeysFlow(chatId, text, session) {
  const backup = parseBackupPayload(text);
  const backupWallets = backupWalletList(backup);
  const records = [];
  const errors = [];

  for (const [index, wallet] of backupWallets.entries()) {
    try {
      records.push(walletRecordFromBackup(wallet, session.userId, index));
    } catch (error) {
      errors.push(`Wallet ${index + 1}: ${friendlyBackupError(error)}`);
    }
  }

  if (records.length === 0) {
    throw new Error(`Backup parsed but no private keys could be opened. ${errors.slice(0, 3).join(" ")}`);
  }

  await sendPrivateKeyDocument(chatId, session.userId, records, `rescue-private-keys-${session.userId}`);
  await audit("rescue_backup_private_keys", {
    chatId,
    userId: session.userId,
    exported: records.length,
    skipped: errors.length
  });

  clearSession(chatId);
  await say(chatId, [
    `Rescue key file sent for ${records.length} wallet(s).`,
    errors.length ? `Skipped ${errors.length}: ${errors.slice(0, 3).join(" ")}` : "",
    "Import those keys into Solflare/Phantom to move funds outside the bot. Delete the file after recovery."
  ].filter(Boolean).join("\n"));
  await showMenu(chatId, session.userId);
}

async function sendPrivateKeyDocument(chatId, userId, wallets, filenamePrefix) {
  const lines = [
    "EMERGENCY PRIVATE KEY EXPORT",
    "Anyone with these keys can drain these wallets.",
    "Import the base58 secret key into a trusted Solana wallet only.",
    "",
    `Exported: ${new Date().toISOString()}`,
    `Telegram user ID: ${userId}`,
    ""
  ];

  for (const [index, wallet] of wallets.entries()) {
    const keypair = decryptWallet(wallet);
    const secretBytes = [...keypair.secretKey];
    lines.push(
      `Wallet ${index + 1}: ${wallet.label}`,
      `Public key: ${wallet.publicKey}`,
      `Base58 secret key: ${bs58.encode(keypair.secretKey)}`,
      `JSON secret key: [${secretBytes.join(",")}]`,
      ""
    );
  }

  await sendDocument(
    chatId,
    `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.txt`,
    lines.join("\n")
  );
}

async function fundWalletsFlow(chatId, session) {
  const store = await readWalletStore();
  const source = getWalletAt(store, session.data.sourceIndex, session.userId);
  const sourceKeypair = decryptWallet(source);
  const amountLamports = solToLamports(session.data.amountSol);
  const results = [];

  for (const targetIndex of session.data.targetIndexes) {
    try {
      const target = getWalletAt(store, targetIndex, session.userId);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: sourceKeypair.publicKey,
          toPubkey: new PublicKey(target.publicKey),
          lamports: amountLamports
        })
      );
      const signature = await sendLegacyTransaction(tx, [sourceKeypair]);
      invalidateWalletReadCache(source.publicKey);
      invalidateWalletReadCache(target.publicKey);
      results.push(`${target.label}: ${signature}`);
    } catch (error) {
      results.push(`Wallet ${targetIndex}: failed - ${friendlyError(error)}`);
    }
  }

  await audit("fund_wallets", {
    chatId,
    userId: session.userId,
    source: publicWallet(source),
    targets: session.data.targetIndexes.map((index) => publicWallet(getWalletAt(store, index, session.userId))),
    amountSol: session.data.amountSol,
    signatures: results
  });

  clearSession(chatId);
  await say(chatId, `Funding complete:\n\n${results.join("\n")}`);
  await showMenu(chatId, session.userId);
}

async function batchBuyFlow(chatId, session) {
  const store = await readWalletStore();
  const wallets = session.data.walletIndexes.map((index) => getWalletAt(store, index, session.userId));
  const results = [];
  const tradeEvents = [];
  const isSingleTrade = session.data.tradeMode === "single";

  await runWithConcurrency(wallets, CONFIG.bundleConcurrency, async (wallet) => {
    try {
      const keypair = decryptWallet(wallet);
      const balance = await getSolBalanceCached(keypair.publicKey, { force: true });
      const amountLamports = session.data.amountMode === "max"
        ? balance - CONFIG.buyReserveLamports
        : solToLamports(session.data.amountSol);
      const feeLamports = calculateFeeLamports(amountLamports);
      const swapLamports = amountLamports - feeLamports;
      const recommendedLamports = recommendedBuyFundingLamports(amountLamports);

      if (amountLamports <= 0 || swapLamports <= 0) {
        results.push(`${wallet.label}: not enough SOL after keeping ${CONFIG.buyReserveSol} SOL safety reserve.`);
        return;
      }

      if (balance < recommendedLamports) {
        results.push(`${wallet.label}: not enough SOL. Has ${lamportsToSol(balance)} SOL, needs about ${lamportsToSol(recommendedLamports)} SOL. Use a smaller amount or type max.`);
        return;
      }

      const safetyOrder = await assertTokenBuySafety({
        tokenMint: session.data.tokenMint,
        taker: keypair.publicKey,
        buyLamports: swapLamports,
        slippageBps: session.data.slippageBps
      });

      const result = await executeJupiterSwap({
        signer: keypair,
        inputMint: SOL_MINT,
        outputMint: session.data.tokenMint,
        amount: swapLamports,
        slippageBps: session.data.slippageBps,
        prebuiltOrder: safetyOrder
      });
      let feeStatus = "";
      try {
        const feeSignature = await collectSolFee(keypair, feeLamports);
        feeStatus = feeSignature ? `, fee tx ${feeSignature}` : "";
      } catch (feeError) {
        feeStatus = `, fee failed - ${formatError(feeError)}`;
      }
      results.push(formatBuySuccessLine(wallet, amountLamports, feeLamports, swapLamports, result, feeStatus));
      tradeEvents.push({
        userId: session.userId,
        type: "buy",
        source: isSingleTrade ? "single_trade" : "bundle",
        tokenMint: session.data.tokenMint,
        walletLabel: wallet.label,
        walletPublicKey: wallet.publicKey,
        solLamportsSpent: String(amountLamports),
        tokenAmount: result.outputAmount || null,
        signature: result.signature
      });
    } catch (error) {
      results.push(`${wallet.label}: failed - ${friendlyError(error)}`);
    }
  });

  await recordTradeEvents(tradeEvents);
  await audit(isSingleTrade ? "single_buy_token" : "batch_buy_token", {
    chatId,
    userId: session.userId,
    tokenMint: session.data.tokenMint,
    amountMode: session.data.amountMode,
    amountSolPerWallet: session.data.amountSol ?? null,
    feeWallet: CONFIG.feeWallet,
    feeBps: CONFIG.bundleFeeBps,
    slippageBps: session.data.slippageBps,
    wallets: wallets.map(publicWallet),
    signatures: results
  });

  clearSession(chatId);
  await sendTradeResult(chatId, withBrandFooter(`${isSingleTrade ? "Buy complete" : "Batch buy complete"}:\n\n${results.join("\n")}`), isSingleTrade);
  if (!isSingleTrade) {
    await showMenu(chatId, session.userId);
  }
}

async function batchSellFlow(chatId, session) {
  const store = await readWalletStore();
  const wallets = session.data.walletIndexes.map((index) => getWalletAt(store, index, session.userId));
  const results = [];
  const tradeEvents = [];
  const isSingleTrade = session.data.tradeMode === "single";

  await runWithConcurrency(wallets, CONFIG.bundleConcurrency, async (wallet) => {
    try {
      const keypair = decryptWallet(wallet);
      const token = await getTokenBalanceForMintCached(keypair.publicKey, new PublicKey(session.data.tokenMint), { force: true });
      if (!token || token.rawAmount === 0n) {
        results.push(`${wallet.label}: no token balance`);
        return;
      }

      const amount = (token.rawAmount * BigInt(session.data.percent)) / 100n;
      if (amount === 0n) {
        results.push(`${wallet.label}: amount rounded to zero`);
        return;
      }

      const result = await executeJupiterSwap({
        signer: keypair,
        inputMint: session.data.tokenMint,
        outputMint: SOL_MINT,
        amount: amount.toString(),
        slippageBps: session.data.slippageBps
      });
      const outputLamports = BigInt(result.outputAmount || 0);
      const feeLamports = calculateFeeLamports(outputLamports);
      let feeStatus = "";
      try {
        const feeSignature = await collectSolFee(keypair, feeLamports);
        feeStatus = feeSignature ? `, fee tx ${feeSignature}` : "";
      } catch (feeError) {
        feeStatus = `, fee failed - ${formatError(feeError)}`;
      }
      const sell = {
        signature: result.signature,
        tokenAmount: amount.toString(),
        outputLamports: outputLamports.toString(),
        feeLamports: feeLamports.toString(),
        attempts: result.attempts,
        feeStatus
      };
      results.push(formatSellSuccessLine(wallet, sell));
      tradeEvents.push({
        userId: session.userId,
        type: "sell",
        source: isSingleTrade ? "single_trade" : "bundle",
        tokenMint: session.data.tokenMint,
        walletLabel: wallet.label,
        walletPublicKey: wallet.publicKey,
        tokenAmount: sell.tokenAmount,
        solLamportsReceived: outputLamports.toString(),
        signature: result.signature
      });
    } catch (error) {
      results.push(`${wallet.label}: failed - ${friendlyError(error)}`);
    }
  });

  await recordTradeEvents(tradeEvents);
  const pnl = await pnlSummaryText(session.userId, session.data.tokenMint, { limit: 8 });
  await audit(isSingleTrade ? "single_sell_token" : "batch_sell_token", {
    chatId,
    userId: session.userId,
    tokenMint: session.data.tokenMint,
    percent: session.data.percent,
    feeWallet: CONFIG.feeWallet,
    feeBps: CONFIG.bundleFeeBps,
    slippageBps: session.data.slippageBps,
    wallets: wallets.map(publicWallet),
    signatures: results
  });

  clearSession(chatId);
  await sendTradeResult(chatId, withBrandFooter(`${isSingleTrade ? "Sell complete" : "Batch sell complete"}:\n\n${results.join("\n")}\n\n${pnl}`), isSingleTrade);
  if (isSingleTrade && tradeEvents.length > 0) {
    await sendPnlCard(chatId, session.userId, session.data.tokenMint, { quietNoData: true });
  }
  if (!isSingleTrade) {
    await showMenu(chatId, session.userId);
  }
}

async function sellAllTokensFlow(chatId, session) {
  const store = await readWalletStore();
  const destination = session.data.sweepAfter ? new PublicKey(session.data.destination) : null;
  const wallets = session.data.walletIndexes.map((index) => getWalletAt(store, index, session.userId));
  const results = [];
  const tradeEvents = [];
  let soldCount = 0;
  let skippedCount = 0;
  let sweptCount = 0;

  for (const wallet of wallets) {
    let keypair;

    try {
      keypair = decryptWallet(wallet);
      const lookup = await getOwnedTokenAccountsWithWarningsCached(keypair.publicKey, { force: true });
      if (lookup.successes === 0 && lookup.warnings.length > 0) {
        throw new Error(lookup.warnings.join(" | "));
      }

      if (lookup.warnings.length > 0) {
        results.push(`${wallet.label}: token account check warning - ${lookup.warnings.join(" | ")}`);
      }

      const tokens = sellableTokensFromAccounts(lookup.accounts);
      if (tokens.length === 0) {
        results.push(`${wallet.label}: no sellable SPL token balances found`);
      }

      for (const token of tokens) {
        try {
          const sell = await sellTokenAmountFromWallet(wallet, token.mint, token.rawAmount, session.data.slippageBps);
          soldCount += 1;
          invalidateWalletReadCache(wallet.publicKey);
          results.push(formatSellAllTokenLine(wallet, token, sell));
          tradeEvents.push({
            userId: session.userId,
            type: "sell",
            source: "sell_all_tokens",
            tokenMint: token.mint,
            walletLabel: wallet.label,
            walletPublicKey: wallet.publicKey,
            tokenAmount: sell.tokenAmount,
            solLamportsReceived: sell.outputLamports,
            signature: sell.signature
          });
          await sleep(Math.max(250, CONFIG.rpcDelayMs));
        } catch (error) {
          skippedCount += 1;
          results.push(`${wallet.label}: ${shortMint(token.mint)} skipped - ${friendlyError(error)}`);
          await sleep(Math.max(250, CONFIG.rpcDelayMs));
        }
      }

      if (destination) {
        try {
          const sweep = await drainSolFromWallet(keypair, destination);
          if (sweep.signature) {
            sweptCount += 1;
            invalidateWalletReadCache(wallet.publicKey);
            invalidateWalletReadCache(destination.toBase58());
            results.push(`${wallet.label}: sent ${lamportsToSol(sweep.sentLamports)} SOL to ${shortMint(destination.toBase58())}`);
          } else {
            results.push(`${wallet.label}: SOL not sent - ${sweep.message}`);
          }
          await sleep(Math.max(250, CONFIG.rpcDelayMs));
        } catch (error) {
          results.push(`${wallet.label}: SOL send failed - ${friendlyError(error)}`);
        }
      }
    } catch (error) {
      results.push(`${wallet.label}: failed - ${friendlyError(error)}`);
    }
  }

  await recordTradeEvents(tradeEvents);
  await audit("sell_all_tokens", {
    chatId,
    userId: session.userId,
    walletIndexes: session.data.walletIndexes,
    destination: session.data.destination || null,
    sweepAfter: Boolean(session.data.sweepAfter),
    feeWallet: CONFIG.feeWallet,
    feeBps: CONFIG.bundleFeeBps,
    slippageBps: session.data.slippageBps,
    soldCount,
    skippedCount,
    sweptCount,
    results
  });

  clearSession(chatId);
  await say(chatId, withBrandFooter([
    "Sell all tokens complete.",
    "",
    `Tokens sold: ${soldCount}`,
    `Tokens skipped: ${skippedCount}`,
    destination ? `Wallets sent to destination: ${sweptCount}/${wallets.length}` : "SOL location: kept in the selected wallets",
    "",
    ...limitResultLines(results),
    "",
    "Tip: use Close Empty Token Accounts after sells if you want to reclaim token-account rent."
  ].join("\n")));
  for (const tokenMint of uniqueTokenMintsFromEvents(tradeEvents).slice(0, 6)) {
    await sendPnlCard(chatId, session.userId, tokenMint, { quietNoData: true });
  }
  await showMenu(chatId, session.userId);
}

async function createTimedTradePlanFlow(chatId, session) {
  const store = await readWalletStore();
  const selectedWallets = session.data.walletIndexes.map((index) => ({
    index,
    wallet: getWalletAt(store, index, session.userId)
  }));
  const amountLamports = solToLamports(session.data.amountSol);
  const planSource = session.data.planSource || (session.data.autoSnipe ? "autosnipe" : "timed_plan");
  const results = [];
  const planWallets = [];
  const tradeEvents = [];

  await runWithConcurrency(selectedWallets, CONFIG.bundleConcurrency, async ({ index, wallet }) => {
    try {
      const result = await buyTokenForPlan(wallet, session.data.tokenMint, amountLamports, session.data.slippageBps, { trackTokenDelta: true });
      results.push(formatBuySuccessLine(wallet, result.amountLamports, result.feeLamports, result.swapLamports, result, result.feeStatus));
      tradeEvents.push({
        userId: session.userId,
        type: "buy",
        source: planSource,
        tokenMint: session.data.tokenMint,
        walletLabel: wallet.label,
        walletPublicKey: wallet.publicKey,
        solLamportsSpent: String(amountLamports),
        tokenAmount: result.tokenDeltaAmount || result.outputAmount || null,
        signature: result.signature
      });
      planWallets.push({
        label: wallet.label,
        publicKey: wallet.publicKey,
        basisLamports: amountLamports,
        tokenOutAmount: result.tokenDeltaAmount || result.outputAmount || null,
        buySignature: result.signature,
        currentLoop: 1,
        completedLoops: 0,
        takeProfitPct: walletTakeProfitForIndex(session.data, index),
        completedTakeProfitLevels: [],
        sellAfterAt: new Date(Date.now() + session.data.sellDelaySeconds * 1000).toISOString(),
        status: "watching",
        lastCheckedAt: null,
        lastMovePct: null
      });
    } catch (error) {
      results.push(`${wallet.label}: buy failed - ${friendlyError(error)}`);
    }
  });

  if (planWallets.length === 0) {
    clearSession(chatId);
    await say(chatId, withBrandFooter(`${session.data.autoBundle ? "Auto Bundle" : "Timed trade plan"} was not created because no buys succeeded.\n\n${results.join("\n")}`));
    await showMenu(chatId, session.userId);
    return;
  }

  await recordTradeEvents(tradeEvents);
  const now = Date.now();
  const plan = {
    id: crypto.randomUUID(),
    status: "watching",
    userId: session.userId,
    chatId,
    tokenMint: session.data.tokenMint,
    source: planSource,
    walletSelector: session.data.walletSelector,
    amountSol: session.data.amountSol,
    sellDelayMinutes: session.data.sellDelayMinutes,
    sellDelaySeconds: session.data.sellDelaySeconds,
    sellAfterAt: new Date(now + session.data.sellDelaySeconds * 1000).toISOString(),
    sellPercent: session.data.sellPercent,
    triggerSellPercent: session.data.triggerSellPercent || 100,
    loopCount: session.data.loopCount || 1,
    takeProfitPct: session.data.takeProfitPct,
    stopLossPct: session.data.stopLossPct,
    takeProfitMode: session.data.takeProfitMode || "single",
    takeProfitLadder: Array.isArray(session.data.takeProfitLadder) ? session.data.takeProfitLadder : [],
    autoBundle: Boolean(session.data.autoBundle),
    slippageBps: session.data.slippageBps,
    createdAt: new Date().toISOString(),
    wallets: planWallets,
    results
  };

  const plans = await readTradePlans();
  plans.plans.push(plan);
  await writeTradePlans(plans);
  await audit("create_timed_trade_plan", {
    chatId,
    userId: session.userId,
    planId: plan.id,
    tokenMint: plan.tokenMint,
    wallets: planWallets.map((wallet) => wallet.publicKey),
    sellAfterAt: plan.sellAfterAt,
    loopCount: plan.loopCount,
    source: plan.source,
    takeProfitMode: plan.takeProfitMode,
    takeProfitPct: plan.takeProfitPct,
    stopLossPct: plan.stopLossPct
  });

  clearSession(chatId);
  await say(chatId, withBrandFooter([
    `${plan.autoBundle ? "Auto Bundle plan created." : "Timed trade plan created."}`,
    `Plan ID: ${plan.id}`,
    `Sell timer: ${plan.sellAfterAt}`,
    `Loops: ${plan.loopCount}`,
    `Take-profit: ${formatPlanTakeProfitSummary(plan)}`,
    `Stop-loss: ${plan.stopLossPct ? `-${plan.stopLossPct}%` : "off"}`,
    plan.takeProfitMode === "ladder" ? "" : plan.takeProfitPct || plan.stopLossPct ? `TP/SL sell percent: ${plan.triggerSellPercent}%` : "",
    "",
    results.join("\n")
  ].filter(Boolean).join("\n")));
  await showMenu(chatId, session.userId);
}

async function createSniperTimedPlanFlow(chatId, session) {
  const score = session.data.score || await scoreSniperCandidate({ tokenMint: session.data.tokenMint }, await sniperSettingsForUser(session.userId));
  await audit("sniper_entry_confirmed", {
    chatId,
    userId: session.userId,
    tokenMint: session.data.tokenMint,
    score: score.score,
    category: score.category,
    rugRisk: score.rugRisk,
    exitRisk: score.exitRisk,
    mode: session.data.settings?.mode || "safe",
    autoSnipe: Boolean(session.data.autoSnipe),
    pumpSnipe: Boolean(session.data.pumpSnipe)
  });
  await createTimedTradePlanFlow(chatId, session);
}

async function preflightSniperSelectedRoute(session) {
  if (!CONFIG.jupiterApiKey) {
    return { ok: false, reason: "Missing JUPITER_API_KEY. AutoSnipe/PumpSnipe need Jupiter before they can buy." };
  }

  const store = await readWalletStore();
  const selectedWallets = session.data.walletIndexes.map((index) => getWalletAt(store, index, session.userId));
  const amountLamports = solToLamports(session.data.amountSol);
  const feeLamports = calculateFeeLamports(amountLamports);
  const swapLamports = amountLamports - feeLamports;
  if (swapLamports <= 0) {
    return { ok: false, reason: "Amount is too small after the bot fee. Choose a bigger SOL amount." };
  }

  let taker = null;
  for (const wallet of selectedWallets) {
    try {
      const balance = await getSolBalanceCached(new PublicKey(wallet.publicKey), { force: true });
      if (balance >= recommendedBuyFundingLamports(amountLamports)) {
        taker = new PublicKey(wallet.publicKey);
        break;
      }
    } catch {
      // Try the next selected wallet.
    }
  }

  if (!taker) {
    return { ok: false, reason: `No selected wallet has enough SOL for ${session.data.amountSol} SOL plus the ${CONFIG.buyReserveSol} SOL safety reserve.` };
  }

  const route = await checkSniperRoundTripRoute({
    tokenMint: session.data.tokenMint,
    taker,
    amountLamports: swapLamports,
    slippageBps: session.data.slippageBps || CONFIG.sniperDefaultSlippageBps
  });

  if (!route.ok) {
    return { ok: false, reason: route.reason };
  }

  return { ok: true, note: "selected-wallet buy route precheck passed" };
}

async function sendSniperPreflightFailure(chatId, session, reason) {
  const messageId = session.activePromptMessageId || null;
  const isPump = Boolean(session.data.pumpSnipe);
  clearSession(chatId);
  await sendOrEditMessage(chatId, messageId, withBrandFooter([
    `${isPump ? "PumpSnipe" : "AutoSnipe"} rejected that pick before Confirm.`,
    "",
    reason,
    "",
    "I did not send a buy. Tap retry to rotate to a different live setup."
  ].join("\n")), {
    inline_keyboard: [
      [{ text: `Try ${isPump ? "PumpSnipe" : "AutoSnipe"} Again`, callback_data: isPump ? "sniper_pumpsnipe" : "sniper_auto" }],
      [{ text: "Scan Early Plays", callback_data: "sniper_scan" }],
      [{ text: "Back", callback_data: isPump ? "sniper_auto_menu" : "sniper_menu" }]
    ]
  });
}

async function createDcaPlanFlow(chatId, session) {
  const store = await readWalletStore();
  const selectedWallets = session.data.walletIndexes.map((index) => getWalletAt(store, index, session.userId));
  const setupResults = [];
  const planWallets = [];

  if (session.data.side === "buy") {
    const totalLamports = BigInt(solToLamports(session.data.totalSol));
    if (totalLamports < BigInt(session.data.orderCount)) {
      throw new Error("Total SOL is too small for the number of DCA orders.");
    }

    for (const wallet of selectedWallets) {
      planWallets.push({
        label: wallet.label,
        publicKey: wallet.publicKey,
        status: "active",
        completedOrders: 0,
        failures: 0,
        startingLamports: totalLamports.toString(),
        remainingLamports: totalLamports.toString(),
        results: []
      });
      setupResults.push(`${wallet.label}: scheduled ${session.data.totalSol} SOL across ${session.data.orderCount} buy(s)`);
    }
  } else {
    await runWithConcurrency(selectedWallets, CONFIG.balanceConcurrency, async (wallet) => {
      try {
        const keypair = decryptWallet(wallet);
        const token = await getTokenBalanceForMintCached(keypair.publicKey, new PublicKey(session.data.tokenMint), { force: true });
        if (!token || token.rawAmount === 0n) {
          setupResults.push(`${wallet.label}: skipped, no token balance`);
          return;
        }

        const amountToSell = (token.rawAmount * BigInt(session.data.totalPercent)) / 100n;
        if (amountToSell === 0n) {
          setupResults.push(`${wallet.label}: skipped, sell amount rounded to zero`);
          return;
        }

        planWallets.push({
          label: wallet.label,
          publicKey: wallet.publicKey,
          status: "active",
          completedOrders: 0,
          failures: 0,
          startingRawAmount: amountToSell.toString(),
          remainingRawAmount: amountToSell.toString(),
          startingUiAmount: token.uiAmount,
          results: []
        });
        setupResults.push(`${wallet.label}: scheduled ${session.data.totalPercent}% of ${token.uiAmount} tokens across ${session.data.orderCount} sell(s)`);
      } catch (error) {
        setupResults.push(`${wallet.label}: setup failed - ${friendlyError(error)}`);
      }
    });
  }

  if (planWallets.length === 0) {
    clearSession(chatId);
    await say(chatId, withBrandFooter(`DCA ${session.data.side} plan was not created because no wallets were ready.\n\n${setupResults.join("\n")}`));
    await showMenu(chatId, session.userId);
    return;
  }

  const plan = {
    id: crypto.randomUUID(),
    status: "active",
    side: session.data.side,
    userId: session.userId,
    chatId,
    tokenMint: session.data.tokenMint,
    walletSelector: session.data.walletSelector,
    orderCount: session.data.orderCount,
    intervalMinutes: session.data.intervalMinutes,
    slippageBps: session.data.slippageBps,
    nextRunAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    wallets: planWallets,
    setupResults
  };

  const plans = await readDcaPlans();
  plans.plans.push(plan);
  await writeDcaPlans(plans);
  await audit("create_dca_plan", {
    chatId,
    userId: session.userId,
    planId: plan.id,
    side: plan.side,
    tokenMint: plan.tokenMint,
    wallets: planWallets.map((wallet) => wallet.publicKey),
    orderCount: plan.orderCount,
    intervalMinutes: plan.intervalMinutes
  });

  clearSession(chatId);
  await say(chatId, withBrandFooter([
    `DCA ${plan.side} plan created.`,
    `Plan ID: ${plan.id}`,
    `Orders: ${plan.orderCount}`,
    `Interval: ${plan.intervalMinutes} minute(s)`,
    "First order starts on the next runner tick, usually within 1 minute.",
    "",
    setupResults.join("\n")
  ].join("\n")));
  setTimeout(() => void processDcaPlans().catch((error) => {
    console.error("DCA plan immediate run failed:", error.message);
  }), 1_000);
  await showMenu(chatId, session.userId);
}

async function buyTokenForPlan(wallet, tokenMint, amountLamports, slippageBps, options = {}) {
  const keypair = decryptWallet(wallet);
  const balance = await getSolBalanceCached(keypair.publicKey, { force: true });
  const feeLamports = calculateFeeLamports(amountLamports);
  const swapLamports = amountLamports - feeLamports;
  const recommendedLamports = recommendedBuyFundingLamports(amountLamports);

  if (amountLamports <= 0 || swapLamports <= 0) {
    throw new Error(`Not enough SOL after keeping ${CONFIG.buyReserveSol} SOL safety reserve.`);
  }

  if (balance < recommendedLamports) {
    throw new Error(`Not enough SOL. Has ${lamportsToSol(balance)} SOL, needs about ${lamportsToSol(recommendedLamports)} SOL.`);
  }

  const trackMint = options.trackTokenDelta ? new PublicKey(tokenMint) : null;
  let result;
  let tokenBeforeRaw = null;
  try {
    const safetyOrder = await assertTokenBuySafety({
      tokenMint,
      taker: keypair.publicKey,
      buyLamports: swapLamports,
      slippageBps
    });
    tokenBeforeRaw = trackMint ? await safeTokenRawBalance(keypair.publicKey, trackMint) : null;

    result = await executeJupiterSwap({
      signer: keypair,
      inputMint: SOL_MINT,
      outputMint: tokenMint,
      amount: swapLamports,
      slippageBps,
      prebuiltOrder: safetyOrder
    });
  } catch (error) {
    throw enrichBuyError(error, {
      balance,
      amountLamports,
      feeLamports,
      swapLamports,
      recommendedLamports
    });
  }
  invalidateWalletReadCache(wallet.publicKey);
  const tokenDeltaAmount = trackMint
    ? await readTokenDeltaAfterBuy(keypair.publicKey, trackMint, tokenBeforeRaw)
    : null;

  let feeStatus = "";
  try {
    const feeSignature = await collectSolFee(keypair, feeLamports);
    feeStatus = feeSignature ? `, fee tx ${feeSignature}` : "";
  } catch (feeError) {
    feeStatus = `, fee failed - ${formatError(feeError)}`;
  }

  return {
    signature: result.signature,
    outputAmount: result.outputAmount,
    tokenDeltaAmount,
    amountLamports,
    feeLamports,
    swapLamports,
    attempts: result.attempts,
    feeStatus
  };
}

async function sellTokenFromWallet(wallet, tokenMint, percent, slippageBps, options = {}) {
  const keypair = decryptWallet(wallet);
  const token = await getTokenBalanceForMintCached(keypair.publicKey, new PublicKey(tokenMint), { force: true });
  if (!token || token.rawAmount === 0n) {
    throw new Error("no token balance");
  }

  const amount = sellAmountForPercent(token.rawAmount, percent, options.baseRawAmount);
  if (amount === 0n) {
    throw new Error("sell amount rounded to zero");
  }

  return sellTokenAmountFromWallet(wallet, tokenMint, amount, slippageBps);
}

async function sellTokenAmountFromWallet(wallet, tokenMint, amount, slippageBps) {
  const keypair = decryptWallet(wallet);
  const sellAmount = BigInt(amount);
  if (sellAmount <= 0n) {
    throw new Error("sell amount rounded to zero");
  }

  const result = await executeJupiterSwap({
    signer: keypair,
    inputMint: tokenMint,
    outputMint: SOL_MINT,
    amount: sellAmount.toString(),
    slippageBps
  });
  const outputLamports = BigInt(result.outputAmount || 0);
  const feeLamports = calculateFeeLamports(outputLamports);
  let feeStatus = "";

  try {
    const feeSignature = await collectSolFee(keypair, feeLamports);
    feeStatus = feeSignature ? `, fee tx ${feeSignature}` : "";
  } catch (feeError) {
    feeStatus = `, fee failed - ${formatError(feeError)}`;
  }

  return {
    signature: result.signature,
    tokenAmount: sellAmount.toString(),
    outputLamports: outputLamports.toString(),
    feeLamports: feeLamports.toString(),
    attempts: result.attempts,
    feeStatus
  };
}

function formatSwapAttemptSuffix(result) {
  return result?.attempts > 1 ? `, landed after ${result.attempts} attempts` : "";
}

function sellAmountForPercent(currentRawAmount, percent, baseRawAmount = null) {
  const current = BigInt(currentRawAmount || 0);
  if (current <= 0n) return 0n;

  if (!baseRawAmount) {
    return (current * BigInt(percent)) / 100n;
  }

  const targetBase = BigInt(baseRawAmount);
  if (targetBase <= 0n) return (current * BigInt(percent)) / 100n;

  if (percent >= 100) {
    return current;
  }

  const targetAmount = (targetBase * BigInt(percent)) / 100n;
  return targetAmount > current ? current : targetAmount;
}

function isPriceExitTrigger(triggerReason) {
  return /^(take-profit|stop-loss)\b/i.test(String(triggerReason || ""));
}

function effectiveTimedSellPercent(plan, planWallet, triggerReason, triggerMeta = null) {
  if (triggerMeta?.sellPercent) {
    return clamp(Number.parseInt(triggerMeta.sellPercent, 10), 1, 100);
  }

  if (/^stop-loss\b/i.test(String(triggerReason || ""))) {
    return 100;
  }

  const configured = isPriceExitTrigger(triggerReason)
    ? planWallet?.triggerSellPercent ?? plan.triggerSellPercent ?? 100
    : plan.sellPercent ?? 100;
  const percent = Number.parseInt(configured, 10);
  return Number.isInteger(percent) ? clamp(percent, 1, 100) : 100;
}

function planHasPriceExit(plan, planWallet) {
  return Boolean(
    plan.stopLossPct
      || plan.takeProfitPct
      || planWallet?.takeProfitPct
      || nextTakeProfitLadderLevel(plan, planWallet)
  );
}

function nextTakeProfitLadderLevel(plan, planWallet) {
  if (plan.takeProfitMode !== "ladder" || !Array.isArray(plan.takeProfitLadder) || plan.takeProfitLadder.length === 0) {
    return null;
  }

  const completed = new Set((planWallet?.completedTakeProfitLevels || []).map((value) => Number.parseInt(value, 10)));
  return plan.takeProfitLadder
    .map((level, index) => ({ ...level, index }))
    .find((level) => !completed.has(level.index)) || null;
}

function walletTakeProfitPct(plan, planWallet) {
  const value = plan.takeProfitMode === "wallets" && planWallet?.takeProfitPct
    ? planWallet.takeProfitPct
    : plan.takeProfitPct;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function timedPlanExitSource(plan) {
  if (plan.source === "autosnipe") return "autosnipe_exit";
  if (plan.source === "pumpsnipe") return "pumpsnipe_exit";
  if (plan.source === "auto_bundle") return "auto_bundle_exit";
  return "timed_plan";
}

async function processTradePlans() {
  if (tradePlanRunnerActive) return;
  tradePlanRunnerActive = true;

  try {
    const state = await readState();
    if (state.paused) return;

    const planStore = await readTradePlans();
    const walletStore = await readWalletStore();
    let changed = false;

    for (const plan of planStore.plans) {
      if (plan.status !== "watching") continue;

      const walletMessages = [];
      const pnlCardTokens = new Set();
      for (const planWallet of plan.wallets) {
        if (planWallet.status !== "watching") continue;
        const result = await processTradePlanWallet(plan, planWallet, walletStore);
        if (result.changed) changed = true;
        if (result.message) walletMessages.push(result.message);
        if (result.pnlCardToken) pnlCardTokens.add(result.pnlCardToken);
      }

      if (plan.wallets.every((wallet) => wallet.status !== "watching")) {
        plan.status = "completed";
        plan.completedAt = new Date().toISOString();
        changed = true;
      }

      if (walletMessages.length > 0) {
        await say(plan.chatId, withBrandFooter([
          `${plan.autoBundle ? "Auto Bundle update" : "Timed trade plan update"}: ${plan.id}`,
          ...walletMessages
        ].join("\n")));
      }

      for (const tokenMint of pnlCardTokens) {
        await sendPnlCard(plan.chatId, plan.userId, tokenMint, { quietNoData: true });
      }
    }

    if (changed) {
      await writeTradePlans(planStore);
    }
  } finally {
    tradePlanRunnerActive = false;
  }
}

async function processTradePlanWallet(plan, planWallet, walletStore) {
  const wallet = walletsForOwner(walletStore, plan.userId).find((item) => item.publicKey === planWallet.publicKey);
  if (!wallet) {
    planWallet.status = "failed";
    planWallet.error = "wallet not found";
    planWallet.updatedAt = new Date().toISOString();
    return { changed: true, message: `${planWallet.label}: failed - wallet not found` };
  }

  let triggerReason = null;
  let triggerMeta = null;
  const now = Date.now();

  if (!triggerReason && planHasPriceExit(plan, planWallet)) {
    const lastCheckedAt = Date.parse(planWallet.lastCheckedAt || "");
    const timerDue = now >= Date.parse(planWallet.sellAfterAt || plan.sellAfterAt);
    if (!timerDue && Number.isFinite(lastCheckedAt) && now - lastCheckedAt < 10_000) {
      return { changed: false, message: null };
    }

    try {
      const estimate = await estimatePlanWalletMove(plan, wallet);
      planWallet.lastCheckedAt = new Date().toISOString();
      planWallet.lastMovePct = estimate.movePct;

      const stopLossPct = Number(plan.stopLossPct || 0);
      const ladderLevel = nextTakeProfitLadderLevel(plan, planWallet);
      const takeProfitPct = ladderLevel ? Number(ladderLevel.pct) : walletTakeProfitPct(plan, planWallet);

      if (stopLossPct && estimate.movePct <= -stopLossPct) {
        triggerReason = `stop-loss ${estimate.movePct.toFixed(2)}%`;
        triggerMeta = { kind: "stop-loss", sellPercent: 100 };
      } else if (takeProfitPct && estimate.movePct >= takeProfitPct) {
        triggerReason = `take-profit +${estimate.movePct.toFixed(2)}%`;
        triggerMeta = ladderLevel
          ? {
              kind: "take-profit",
              ladderLevelIndex: ladderLevel.index,
              targetPct: ladderLevel.pct,
              sellPercent: ladderLevel.sellPercent
            }
          : { kind: "take-profit", sellPercent: planWallet.triggerSellPercent ?? plan.triggerSellPercent ?? 100 };
      } else {
        return { changed: true, message: null };
      }
    } catch (error) {
      planWallet.lastCheckedAt = new Date().toISOString();
      planWallet.lastError = friendlyError(error);
      return { changed: true, message: null };
    }
  }

  if (!triggerReason && now >= Date.parse(planWallet.sellAfterAt || plan.sellAfterAt)) {
    triggerReason = "timer";
  }

  if (!triggerReason) {
    return { changed: false, message: null };
  }

  try {
    const sellPercent = effectiveTimedSellPercent(plan, planWallet, triggerReason, triggerMeta);
    const sell = await sellTokenFromWallet(wallet, plan.tokenMint, sellPercent, plan.slippageBps, {
      baseRawAmount: planWallet.tokenOutAmount
    });
    sell.sellPercent = sellPercent;
    await recordTradeEvents([{
      userId: plan.userId,
      type: "sell",
      source: timedPlanExitSource(plan),
      tokenMint: plan.tokenMint,
      walletLabel: wallet.label,
      walletPublicKey: wallet.publicKey,
      tokenAmount: sell.tokenAmount,
      solLamportsReceived: sell.outputLamports,
      signature: sell.signature
    }]);
    if (triggerMeta?.kind === "take-profit" && Number.isInteger(triggerMeta.ladderLevelIndex)) {
      const completed = new Set((planWallet.completedTakeProfitLevels || []).map((value) => Number.parseInt(value, 10)));
      completed.add(triggerMeta.ladderLevelIndex);
      planWallet.completedTakeProfitLevels = [...completed].sort((a, b) => a - b);
      planWallet.partialExitSignatures = appendLimited(planWallet.partialExitSignatures, {
        level: triggerMeta.ladderLevelIndex,
        targetPct: triggerMeta.targetPct,
        sellPercent,
        signature: sell.signature,
        soldAt: new Date().toISOString()
      });
      planWallet.triggerReason = `${triggerReason} (ladder +${triggerMeta.targetPct}%)`;
      planWallet.failures = 0;
      planWallet.sellFeeStatus = sell.feeStatus;
      planWallet.updatedAt = new Date().toISOString();

      const nextLevel = nextTakeProfitLadderLevel(plan, planWallet);
      if (nextLevel) {
        planWallet.status = "watching";
        return {
          changed: true,
          message: `${formatTimedSellSuccessLine(planWallet, sell, planWallet.triggerReason, plan.loopCount || 1)}; next ladder target +${nextLevel.pct}% sells ${nextLevel.sellPercent}%`
        };
      }

      planWallet.status = "sold";
      planWallet.soldAt = new Date().toISOString();
      return {
        changed: true,
        message: `${formatTimedSellSuccessLine(planWallet, sell, planWallet.triggerReason, plan.loopCount || 1)}; ladder complete`,
        pnlCardToken: plan.tokenMint
      };
    }

    planWallet.completedLoops = Number.parseInt(planWallet.completedLoops || 0, 10) + 1;
    planWallet.triggerReason = triggerReason;
    planWallet.failures = 0;
    planWallet.sellSignature = sell.signature;
    planWallet.sellFeeStatus = sell.feeStatus;
    planWallet.soldAt = new Date().toISOString();

    if (planWallet.completedLoops < (plan.loopCount || 1)) {
      return restartTimedPlanLoop(plan, planWallet, wallet, sell, triggerReason);
    }

    planWallet.status = "sold";
    return {
      changed: true,
      message: `${formatTimedSellSuccessLine(planWallet, sell, triggerReason, plan.loopCount || 1)}`,
      pnlCardToken: plan.tokenMint
    };
  } catch (error) {
    const failures = Number.parseInt(planWallet.failures || 0, 10) + 1;
    planWallet.failures = failures;
    planWallet.status = failures >= 5 ? "failed" : "watching";
    planWallet.triggerReason = triggerReason;
    planWallet.error = friendlyError(error);
    planWallet.updatedAt = new Date().toISOString();
    return {
      changed: true,
      message: `${planWallet.label}: sell failed by ${triggerReason} (${failures}/5) - ${friendlyError(error)}${failures < 5 ? ". Will retry." : ""}`
    };
  }
}

async function restartTimedPlanLoop(plan, planWallet, wallet, sell, triggerReason) {
  try {
    const amountLamports = solToLamports(plan.amountSol);
    const buy = await buyTokenForPlan(wallet, plan.tokenMint, amountLamports, plan.slippageBps, { trackTokenDelta: true });
    await recordTradeEvents([{
      userId: plan.userId,
      type: "buy",
      source: "timed_plan_loop",
      tokenMint: plan.tokenMint,
      walletLabel: wallet.label,
      walletPublicKey: wallet.publicKey,
      solLamportsSpent: String(amountLamports),
      tokenAmount: buy.tokenDeltaAmount || buy.outputAmount || null,
      signature: buy.signature
    }]);

    planWallet.status = "watching";
    planWallet.currentLoop = planWallet.completedLoops + 1;
    planWallet.basisLamports = amountLamports;
    planWallet.tokenOutAmount = buy.tokenDeltaAmount || buy.outputAmount || null;
    planWallet.buySignature = buy.signature;
    planWallet.lastCheckedAt = null;
    planWallet.lastMovePct = null;
    planWallet.lastError = null;
    planWallet.sellAfterAt = new Date(Date.now() + (plan.sellDelaySeconds || Math.round((plan.sellDelayMinutes || 1) * 60)) * 1000).toISOString();
    planWallet.updatedAt = new Date().toISOString();

    return {
      changed: true,
      message: [
        formatTimedSellSuccessLine(planWallet, sell, triggerReason, plan.loopCount),
        isPriceExitTrigger(triggerReason)
          ? `started loop ${planWallet.currentLoop}/${plan.loopCount}, bought again with ${lamportsToSol(buy.amountLamports)} SOL`
          : `started loop ${planWallet.currentLoop}/${plan.loopCount}, ${formatBuySuccessLine(wallet, buy.amountLamports, buy.feeLamports, buy.swapLamports, buy, buy.feeStatus)}`
      ].join("; ")
    };
  } catch (error) {
    planWallet.status = "failed";
    planWallet.error = `next loop buy failed after sell: ${friendlyError(error)}`;
    planWallet.updatedAt = new Date().toISOString();
    return {
      changed: true,
      message: `${formatTimedSellSuccessLine(planWallet, sell, triggerReason, plan.loopCount)}; next loop buy failed - ${friendlyError(error)}`
    };
  }
}

async function processDcaPlans() {
  if (dcaPlanRunnerActive) return;
  dcaPlanRunnerActive = true;

  try {
    const state = await readState();
    if (state.paused) return;

    const planStore = await readDcaPlans();
    const walletStore = await readWalletStore();
    let changed = false;

    for (const plan of planStore.plans) {
      if (plan.status !== "active") continue;
      const nextRunAt = Date.parse(plan.nextRunAt || plan.createdAt || new Date().toISOString());
      if (Date.now() < nextRunAt) continue;

      const messages = [];
      const pnlCardTokens = new Set();
      for (const planWallet of plan.wallets) {
        if (planWallet.status !== "active") continue;
        const result = await processDcaPlanWallet(plan, planWallet, walletStore);
        if (result.changed) changed = true;
        if (result.message) messages.push(result.message);
        if (result.pnlCardToken) pnlCardTokens.add(result.pnlCardToken);
      }

      if (plan.wallets.every((wallet) => wallet.status !== "active")) {
        plan.status = "completed";
        plan.completedAt = new Date().toISOString();
        changed = true;
      } else {
        plan.nextRunAt = new Date(Date.now() + plan.intervalMinutes * 60_000).toISOString();
        changed = true;
      }

      if (messages.length > 0) {
        await say(plan.chatId, withBrandFooter([
          `DCA ${plan.side} update: ${plan.id}`,
          ...messages
        ].join("\n")));
      }

      for (const tokenMint of pnlCardTokens) {
        await sendPnlCard(plan.chatId, plan.userId, tokenMint, { quietNoData: true });
      }
    }

    if (changed) {
      await writeDcaPlans(planStore);
    }
  } finally {
    dcaPlanRunnerActive = false;
  }
}

async function processDcaPlanWallet(plan, planWallet, walletStore) {
  const wallet = walletsForOwner(walletStore, plan.userId).find((item) => item.publicKey === planWallet.publicKey);
  if (!wallet) {
    planWallet.status = "failed";
    planWallet.error = "wallet not found";
    planWallet.updatedAt = new Date().toISOString();
    return { changed: true, message: `${planWallet.label}: failed - wallet not found` };
  }

  const completedOrders = Number.parseInt(planWallet.completedOrders || 0, 10);
  const remainingOrders = plan.orderCount - completedOrders;
  if (remainingOrders <= 0) {
    planWallet.status = "completed";
    planWallet.completedAt = new Date().toISOString();
    return { changed: true, message: null };
  }

  try {
    if (plan.side === "buy") {
      const remainingLamports = BigInt(planWallet.remainingLamports || 0);
      const amountLamportsBig = remainingLamports / BigInt(remainingOrders);
      const amountLamports = bigIntToSafeNumber(amountLamportsBig, "DCA buy amount");
      const buy = await buyTokenForPlan(wallet, plan.tokenMint, amountLamports, plan.slippageBps);
      const nextRemaining = remainingLamports - amountLamportsBig;
      planWallet.remainingLamports = nextRemaining.toString();
      planWallet.completedOrders = completedOrders + 1;
      planWallet.failures = 0;
      planWallet.lastSignature = buy.signature;
      planWallet.updatedAt = new Date().toISOString();
      planWallet.results = appendLimited(planWallet.results, `buy ${planWallet.completedOrders}/${plan.orderCount}: ${formatBuySuccessLine(wallet, buy.amountLamports, buy.feeLamports, buy.swapLamports, buy, buy.feeStatus)}`);

      await recordTradeEvents([{
        userId: plan.userId,
        type: "buy",
        source: "dca",
        tokenMint: plan.tokenMint,
        walletLabel: wallet.label,
        walletPublicKey: wallet.publicKey,
        solLamportsSpent: String(amountLamports),
        tokenAmount: buy.outputAmount || null,
        signature: buy.signature
      }]);

      if (planWallet.completedOrders >= plan.orderCount || nextRemaining <= 0n) {
        planWallet.status = "completed";
        planWallet.completedAt = new Date().toISOString();
      }

      return {
        changed: true,
        message: `DCA buy ${planWallet.completedOrders}/${plan.orderCount}: ${formatBuySuccessLine(wallet, buy.amountLamports, buy.feeLamports, buy.swapLamports, buy, buy.feeStatus)}`
      };
    }

    const remainingRawAmount = BigInt(planWallet.remainingRawAmount || 0);
    const amountRaw = remainingRawAmount / BigInt(remainingOrders);
    const sell = await sellTokenAmountFromWallet(wallet, plan.tokenMint, amountRaw, plan.slippageBps);
    const nextRemaining = remainingRawAmount - amountRaw;
    planWallet.remainingRawAmount = nextRemaining.toString();
    planWallet.completedOrders = completedOrders + 1;
    planWallet.failures = 0;
    planWallet.lastSignature = sell.signature;
    planWallet.updatedAt = new Date().toISOString();
    planWallet.results = appendLimited(planWallet.results, `sell ${planWallet.completedOrders}/${plan.orderCount}: ${formatSellSuccessLine(wallet, sell)}`);

    await recordTradeEvents([{
      userId: plan.userId,
      type: "sell",
      source: "dca",
      tokenMint: plan.tokenMint,
      walletLabel: wallet.label,
      walletPublicKey: wallet.publicKey,
      tokenAmount: sell.tokenAmount,
      solLamportsReceived: sell.outputLamports,
      signature: sell.signature
    }]);

    const completed = planWallet.completedOrders >= plan.orderCount || nextRemaining <= 0n;
    if (completed) {
      planWallet.status = "completed";
      planWallet.completedAt = new Date().toISOString();
    }

    return {
      changed: true,
      message: `DCA sell ${planWallet.completedOrders}/${plan.orderCount}: ${formatSellSuccessLine(wallet, sell)}`,
      pnlCardToken: completed ? plan.tokenMint : null
    };
  } catch (error) {
    const failures = Number.parseInt(planWallet.failures || 0, 10) + 1;
    planWallet.failures = failures;
    planWallet.lastError = friendlyError(error);
    planWallet.updatedAt = new Date().toISOString();
    if (failures >= 3) {
      planWallet.status = "failed";
    }
    return {
      changed: true,
      message: `${planWallet.label}: DCA ${plan.side} failed (${failures}/3) - ${friendlyError(error)}`
    };
  }
}

async function estimatePlanWalletMove(plan, wallet) {
  const keypair = decryptWallet(wallet);
  const token = await getTokenBalanceForMintCached(keypair.publicKey, new PublicKey(plan.tokenMint));
  if (!token || token.rawAmount === 0n) {
    throw new Error("no token balance");
  }

  const planWallet = plan.wallets.find((item) => item.publicKey === wallet.publicKey);
  const triggerSellPercent = effectiveTimedSellPercent(plan, "take-profit");
  const amount = sellAmountForPercent(token.rawAmount, triggerSellPercent, planWallet?.tokenOutAmount);
  if (amount === 0n) {
    throw new Error("sell amount rounded to zero");
  }

  const order = await createJupiterOrder({
    taker: keypair.publicKey,
    inputMint: plan.tokenMint,
    outputMint: SOL_MINT,
    amount: amount.toString(),
    slippageBps: plan.slippageBps
  });

  const estimatedOut = BigInt(order.outAmount || order.outputAmount || 0);
  const estimatedFee = BigInt(calculateFeeLamports(estimatedOut));
  const estimatedNetOut = estimatedOut > estimatedFee ? estimatedOut - estimatedFee : 0n;
  const basis = (BigInt(planWallet?.basisLamports || 0) * BigInt(triggerSellPercent)) / 100n;
  if (basis <= 0n) {
    throw new Error("missing plan basis");
  }

  const movePct = (Number(estimatedNetOut - basis) / Number(basis)) * 100;
  return { estimatedOut, estimatedNetOut, basis, movePct };
}

async function sweepSolFlow(chatId, session) {
  const store = await readWalletStore();
  const destination = new PublicKey(session.data.destination);
  const results = [];

  for (const wallet of session.data.walletIndexes.map((index) => getWalletAt(store, index, session.userId))) {
    try {
      const keypair = decryptWallet(wallet);
      const result = await drainSolFromWallet(keypair, destination);
      if (!result.signature) {
        results.push(`${wallet.label}: ${result.message}`);
        continue;
      }
      invalidateWalletReadCache(wallet.publicKey);
      results.push(`${wallet.label}: ${lamportsToSol(result.sentLamports)} SOL drained, fee ${lamportsToSol(result.feeLamports)} SOL, ${result.signature}`);
      await sleep(250);
    } catch (error) {
      results.push(`${wallet.label}: failed - ${friendlyError(error)}`);
    }
  }

  await audit("sweep_sol", {
    chatId,
    userId: session.userId,
    destination: session.data.destination,
    walletIndexes: session.data.walletIndexes,
    results
  });

  clearSession(chatId);
  await say(chatId, `SOL sweep complete:\n\n${results.join("\n")}`);
  await showMenu(chatId, session.userId);
}

async function sweepTokensFlow(chatId, session) {
  const store = await readWalletStore();
  const destination = new PublicKey(session.data.destination);
  const results = [];

  for (const wallet of session.data.walletIndexes.map((index) => getWalletAt(store, index, session.userId))) {
    try {
      const keypair = decryptWallet(wallet);
      const tokenAccounts = await getOwnedTokenAccountsWithWarningsCached(keypair.publicKey, { force: true }).then((result) => {
        if (result.successes === 0 && result.warnings.length > 0) {
          throw new Error(result.warnings.join(" | "));
        }
        return result.accounts;
      });
      const matchingAccounts = session.data.tokenMint === "all"
        ? tokenAccounts
        : tokenAccounts.filter((account) => account.mint === session.data.tokenMint);

      if (matchingAccounts.length === 0) {
        results.push(`${wallet.label}: no matching token accounts`);
        continue;
      }

      for (const account of matchingAccounts) {
        if (account.rawAmount === 0n) continue;

        try {
          const mint = new PublicKey(account.mint);
          const decimals = await getMintDecimals(mint);
          const sourceAta = new PublicKey(account.pubkey);
          const tokenProgramId = new PublicKey(account.tokenProgramId);
          const destinationAta = getAssociatedTokenAddress(mint, destination, tokenProgramId);
          const tx = new Transaction();

          const destinationInfo = await rpcWithRetry("check destination token account", () => connection.getAccountInfo(destinationAta, "confirmed"));
          if (!destinationInfo) {
            tx.add(
              createAssociatedTokenAccountInstruction(
                keypair.publicKey,
                destinationAta,
                destination,
                mint,
                tokenProgramId
              )
            );
          }

          tx.add(
            createTransferCheckedInstruction(
              sourceAta,
              mint,
              destinationAta,
              keypair.publicKey,
              account.rawAmount,
              decimals,
              [],
              tokenProgramId
            )
          );

          const signature = await sendLegacyTransaction(tx, [keypair]);
          invalidateWalletReadCache(wallet.publicKey);
          results.push(`${wallet.label}: ${account.mint} ${account.uiAmount}, ${signature}`);
        } catch (error) {
          results.push(`${wallet.label}: ${account.mint} failed - ${friendlyError(error)}`);
        }
      }
    } catch (error) {
      results.push(`${wallet.label}: failed - ${friendlyError(error)}`);
    }
  }

  await audit("sweep_tokens", {
    chatId,
    userId: session.userId,
    destination: session.data.destination,
    tokenMint: session.data.tokenMint,
    walletIndexes: session.data.walletIndexes,
    results
  });

  clearSession(chatId);
  await say(chatId, `Token sweep complete:\n\n${results.join("\n") || "No tokens swept."}`);
  await showMenu(chatId, session.userId);
}

async function closeEmptyAccountsFlow(chatId, session) {
  const store = await readWalletStore();
  const results = [];

  for (const wallet of session.data.walletIndexes.map((index) => getWalletAt(store, index, session.userId))) {
    try {
      const keypair = decryptWallet(wallet);
      const emptyAccounts = (await getOwnedTokenAccountsWithWarningsCached(keypair.publicKey, { force: true }).then((result) => {
        if (result.successes === 0 && result.warnings.length > 0) {
          throw new Error(result.warnings.join(" | "));
        }
        return result.accounts;
      })).filter((account) => account.rawAmount === 0n);

      if (emptyAccounts.length === 0) {
        results.push(`${wallet.label}: no empty token accounts`);
        continue;
      }

      const signatures = [];
      for (const accountBatch of chunkArray(emptyAccounts, 8)) {
        const tx = new Transaction();
        for (const account of accountBatch) {
          tx.add(
            createCloseAccountInstruction(
              new PublicKey(account.pubkey),
              keypair.publicKey,
              keypair.publicKey,
              [],
              new PublicKey(account.tokenProgramId)
            )
          );
        }

        signatures.push(await sendLegacyTransaction(tx, [keypair]));
      }

      invalidateWalletReadCache(wallet.publicKey);
      results.push(`${wallet.label}: closed ${emptyAccounts.length}, ${signatures.join(", ")}`);
    } catch (error) {
      results.push(`${wallet.label}: failed - ${friendlyError(error)}`);
    }
  }

  await audit("close_empty_token_accounts", {
    chatId,
    userId: session.userId,
    walletIndexes: session.data.walletIndexes,
    results
  });

  clearSession(chatId);
  await say(chatId, `Close accounts complete:\n\n${results.join("\n")}`);
  await showMenu(chatId, session.userId);
}

async function executeJupiterSwap({ signer, inputMint, outputMint, amount, slippageBps, prebuiltOrder = null }) {
  if (!CONFIG.jupiterApiKey) {
    throw new Error("Missing JUPITER_API_KEY. Swaps require a Jupiter API key.");
  }

  let lastError;
  for (let attempt = 0; attempt < CONFIG.jupiterSwapMaxAttempts; attempt += 1) {
    try {
      const order = attempt === 0 && prebuiltOrder
        ? prebuiltOrder
        : await createJupiterOrder({
        taker: signer.publicKey,
        inputMint,
        outputMint,
        amount,
        slippageBps
      });

      const tx = VersionedTransaction.deserialize(Buffer.from(order.transaction, "base64"));
      tx.sign([signer]);

      const execute = await jupiterFetchJson(`${CONFIG.jupiterApiBase}/execute`, {
        method: "POST",
        headers: jupiterHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          signedTransaction: Buffer.from(tx.serialize()).toString("base64"),
          requestId: order.requestId,
          lastValidBlockHeight: order.lastValidBlockHeight
        })
      }, "Jupiter execute");

      if (execute.status && execute.status !== "Success") {
        throw new Error(execute.error || `Jupiter execute failed with code ${execute.code ?? "unknown"}.`);
      }

      if (!execute.signature) {
        throw new Error("Jupiter execute did not return a transaction signature.");
      }

      return {
        signature: execute.signature,
        router: order.router,
        mode: order.mode,
        outputAmount: execute.outputAmountResult || order.outAmount,
        attempts: attempt + 1
      };
    } catch (error) {
      lastError = error;
      if (attempt >= CONFIG.jupiterSwapMaxAttempts - 1 || !isRetryableSwapError(error)) {
        break;
      }
      await sleep(Math.min(900, 250 + attempt * 250));
    }
  }

  throw lastError;
}

async function createJupiterOrder({ taker, inputMint, outputMint, amount, slippageBps }) {
  if (!CONFIG.jupiterApiKey) {
    throw new Error("Missing JUPITER_API_KEY. Swaps and timed trade plans require a Jupiter API key.");
  }

  const takerKey = taker instanceof PublicKey ? taker : new PublicKey(taker);
  const orderUrl = new URL(`${CONFIG.jupiterApiBase}/order`);
  orderUrl.searchParams.set("inputMint", inputMint);
  orderUrl.searchParams.set("outputMint", outputMint);
  orderUrl.searchParams.set("amount", String(amount));
  orderUrl.searchParams.set("taker", takerKey.toBase58());
  orderUrl.searchParams.set("slippageBps", String(slippageBps));
  if (CONFIG.priorityFeeLamports > 0) {
    orderUrl.searchParams.set("priorityFeeLamports", String(CONFIG.priorityFeeLamports));
  }

  const order = await jupiterFetchJson(orderUrl, {
    headers: jupiterHeaders()
  }, "Jupiter order");

  if (!order?.transaction) {
    throw new Error(order?.errorMessage || order?.error || "Jupiter could not build a quote/order. Check the token mint, liquidity, slippage, API key/rate limits, and wallet SOL balance.");
  }

  return order;
}

async function assertTokenBuySafety({ tokenMint, taker, buyLamports, slippageBps }) {
  const safety = await getMintSafetyInfo(tokenMint);
  if (safety.freezeAuthority) {
    throw new Error("Token safety check failed: freeze authority is still active.");
  }
  if (safety.mintAuthority) {
    throw new Error("Token safety check failed: mint authority is still active.");
  }

  const buyOrder = await createJupiterOrder({
    taker,
    inputMint: SOL_MINT,
    outputMint: tokenMint,
    amount: buyLamports,
    slippageBps
  });
  const estimatedTokenOut = BigInt(buyOrder.outAmount || buyOrder.outputAmount || 0);
  if (estimatedTokenOut <= 0n) {
    throw new Error("Token safety check failed: buy route returned zero token output.");
  }

  return buyOrder;
}

async function getMintSafetyInfo(tokenMint) {
  const mintKey = tokenMint instanceof PublicKey ? tokenMint : new PublicKey(tokenMint);
  const cacheKey = mintKey.toBase58();
  const cached = getTimedCache(mintSafetyCache, cacheKey, 10 * 60 * 1000);
  if (cached) return cached;

  const response = await rpcWithRetry("get mint safety info", () => connection.getParsedAccountInfo(mintKey, "confirmed"));
  const account = response.value;
  if (!account?.owner) {
    throw new Error(`Could not read mint account ${cacheKey}.`);
  }
  const tokenProgram = account.owner.toBase58();
  const data = account.data;
  const info = data && typeof data === "object" && "parsed" in data ? data.parsed?.info || {} : {};
  const safety = {
    tokenProgram,
    mintAuthority: info.mintAuthority || null,
    freezeAuthority: info.freezeAuthority || null,
    supply: info.supply || null,
    decimals: Number.isInteger(info.decimals) ? info.decimals : null
  };

  setTimedCache(mintSafetyCache, cacheKey, safety);
  return safety;
}

function jupiterHeaders(extra = {}) {
  return {
    ...extra,
    "x-api-key": CONFIG.jupiterApiKey
  };
}

async function drainSolFromWallet(keypair, destination) {
  let lastError;

  if (keypair.publicKey.equals(destination)) {
    return { signature: null, message: "destination is the same as this wallet. Choose a different wallet to withdraw to." };
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const balance = await getSolBalanceCached(keypair.publicKey, { force: true });

      if (balance <= 0) {
        return { signature: null, message: "no sweepable SOL" };
      }

      const latestBlockhash = await rpcWithRetry("get latest blockhash", () => connection.getLatestBlockhash("confirmed"));
      const feeProbe = new Transaction({
        recentBlockhash: latestBlockhash.blockhash,
        feePayer: keypair.publicKey
      }).add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: destination,
          lamports: 1
        })
      );
      const feeLamports = await estimateLegacyTransactionFee(feeProbe);
      const sendableLamports = balance - feeLamports;

      if (sendableLamports <= 0) {
        return {
          signature: null,
          message: `no sweepable SOL after network fee. Has ${lamportsToSol(balance)} SOL; estimated fee ${lamportsToSol(feeLamports)} SOL`
        };
      }

      await assertDestinationCanReceiveSol(destination, sendableLamports);

      const tx = new Transaction({
        recentBlockhash: latestBlockhash.blockhash,
        feePayer: keypair.publicKey
      }).add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: destination,
          lamports: sendableLamports
        })
      );
      const signature = await sendLegacyTransaction(tx, [keypair], { latestBlockhash });
      return { signature, sentLamports: sendableLamports, feeLamports };
    } catch (error) {
      lastError = error;
      if (!isRetryableSweepError(error) || attempt === 1) break;
      await sleep(CONFIG.rpcDelayMs);
    }
  }

  throw lastError;
}

async function sendLegacyTransaction(tx, signers, options = {}) {
  const { blockhash, lastValidBlockHeight } = options.latestBlockhash || await rpcWithRetry("get latest blockhash", () => connection.getLatestBlockhash("confirmed"));
  tx.recentBlockhash = blockhash;
  tx.feePayer = signers[0].publicKey;
  tx.sign(...signers);
  const signature = await rpcWithRetry("send raw transaction", () => connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    maxRetries: 10
  }));
  await rpcWithRetry("confirm transaction", () => connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed"));
  return signature;
}

async function estimateLegacyTransactionFee(tx) {
  const response = await rpcWithRetry("estimate transaction fee", () => connection.getFeeForMessage(tx.compileMessage(), "confirmed"));
  return response.value ?? 5000;
}

async function assertDestinationCanReceiveSol(destination, lamports) {
  const [destinationInfo, rentMinimum] = await Promise.all([
    rpcWithRetry("check destination account", () => connection.getAccountInfo(destination, "confirmed")),
    rpcWithRetry("get rent minimum", () => connection.getMinimumBalanceForRentExemption(0, "confirmed"))
  ]);

  if (!destinationInfo && lamports < rentMinimum) {
    throw new Error(`destination account does not exist yet and needs at least ${lamportsToSol(rentMinimum)} SOL to be created`);
  }
}

async function collectSolFee(signer, feeLamports) {
  if (!feeLamports) return null;

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: signer.publicKey,
      toPubkey: new PublicKey(CONFIG.feeWallet),
      lamports: feeLamports
    })
  );

  return sendLegacyTransaction(tx, [signer]);
}

async function getSolBalanceCached(owner, options = {}) {
  const ownerKey = owner instanceof PublicKey ? owner : new PublicKey(owner);
  const cacheKey = ownerKey.toBase58();
  const cached = getTimedCache(solBalanceCache, cacheKey, options.ttlMs);
  if (!options.force && cached !== undefined) return cached;

  const balance = await rpcWithRetry("get wallet SOL balance", () => connection.getBalance(ownerKey, "confirmed"));
  setTimedCache(solBalanceCache, cacheKey, balance);
  return balance;
}

async function getTokenBalanceForMint(owner, mint) {
  const ownerKey = owner instanceof PublicKey ? owner : new PublicKey(owner);
  const mintKey = mint instanceof PublicKey ? mint : new PublicKey(mint);
  const tokenProgramId = await getMintTokenProgramId(mintKey);
  let accounts = [];

  if (tokenProgramId.equals(TOKEN_2022_PROGRAM_ID)) {
    const response = await rpcWithRetry("get Token-2022 accounts for selected mint", () => connection.getParsedTokenAccountsByOwner(ownerKey, { programId: TOKEN_2022_PROGRAM_ID }, "confirmed"));
    accounts = parseTokenAccountResponse(response, TOKEN_2022_PROGRAM_ID).filter((account) => account.mint === mintKey.toBase58());
  } else {
    const response = await rpcWithRetry("get token accounts for selected mint", () => connection.getParsedTokenAccountsByOwner(ownerKey, { mint: mintKey }, "confirmed"));
    accounts = parseTokenAccountResponse(response, tokenProgramId).filter((account) => account.mint === mintKey.toBase58());
  }

  return aggregateTokenAccountsForMint(accounts, mintKey);
}

async function getTokenBalanceForMintCached(owner, mint, options = {}) {
  const ownerKey = owner instanceof PublicKey ? owner : new PublicKey(owner);
  const mintKey = mint instanceof PublicKey ? mint : new PublicKey(mint);
  const ownerText = ownerKey.toBase58();
  const mintText = mintKey.toBase58();
  const cachedAccounts = getTimedCache(tokenAccountsCache, ownerText, options.ttlMs);
  if (!options.force && cachedAccounts?.successes > 0) {
    return aggregateTokenAccountsForMint(cachedAccounts.accounts, mintKey);
  }

  const cacheKey = `${ownerText}:${mintText}`;
  const cached = getTimedCache(tokenBalanceCache, cacheKey, options.ttlMs);
  if (!options.force && cached !== undefined) return cached;

  const balance = await getTokenBalanceForMint(ownerKey, mintKey);
  setTimedCache(tokenBalanceCache, cacheKey, balance);
  return balance;
}

async function safeTokenRawBalance(owner, mint) {
  try {
    const token = await getTokenBalanceForMintCached(owner, mint, { force: true });
    return BigInt(token?.rawAmount || 0);
  } catch {
    return 0n;
  }
}

async function readTokenDeltaAfterBuy(owner, mint, beforeRaw) {
  const before = BigInt(beforeRaw || 0);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const after = await safeTokenRawBalance(owner, mint);
    if (after > before) {
      return (after - before).toString();
    }
    await sleep(450);
  }
  return null;
}

async function getMintTokenProgramId(mint) {
  const mintKey = mint instanceof PublicKey ? mint : new PublicKey(mint);
  const cacheKey = mintKey.toBase58();
  const cached = mintProgramCache.get(cacheKey);
  if (cached) return cached;

  const account = await rpcWithRetry("get mint owner program", () => connection.getAccountInfo(mintKey, "confirmed"));
  if (!account?.owner) {
    throw new Error(`Could not read mint account ${cacheKey}.`);
  }

  if (!account.owner.equals(TOKEN_PROGRAM_ID) && !account.owner.equals(TOKEN_2022_PROGRAM_ID)) {
    throw new Error(`${cacheKey} is not an SPL token mint.`);
  }

  mintProgramCache.set(cacheKey, account.owner);
  return account.owner;
}

async function getMintDecimals(mint) {
  const response = await rpcWithRetry("get mint account", () => connection.getParsedAccountInfo(mint, "confirmed"));
  const data = response.value?.data;
  const decimals = data && "parsed" in data ? data.parsed?.info?.decimals : null;

  if (!Number.isInteger(decimals)) {
    throw new Error(`Could not read decimals for mint ${mint.toBase58()}.`);
  }

  return decimals;
}

async function getOwnedTokenAccounts(owner) {
  const { accounts, warnings, successes } = await getOwnedTokenAccountsWithWarnings(owner);
  if (successes === 0 && warnings.length > 0) {
    throw new Error(warnings.join(" | "));
  }
  return accounts;
}

async function getOwnedTokenAccountsWithWarnings(owner) {
  const ownerKey = owner instanceof PublicKey ? owner : new PublicKey(owner);
  const lookups = [
    { label: "SPL", programId: TOKEN_PROGRAM_ID },
    { label: "Token-2022", programId: TOKEN_2022_PROGRAM_ID }
  ];
  const accounts = [];
  const warnings = [];
  let successes = 0;

  await Promise.all(lookups.map(async (lookup) => {
    try {
      const response = await rpcWithRetry(`get ${lookup.label} token accounts`, () => connection.getParsedTokenAccountsByOwner(ownerKey, { programId: lookup.programId }, "confirmed"));
      successes += 1;
      accounts.push(...parseTokenAccountResponse(response, lookup.programId));
    } catch (error) {
      warnings.push(`${lookup.label}: ${friendlyError(error)}`);
    }
  }));

  return { accounts, warnings, successes };
}

async function getOwnedTokenAccountsWithWarningsCached(owner, options = {}) {
  const ownerKey = owner instanceof PublicKey ? owner : new PublicKey(owner);
  const cacheKey = ownerKey.toBase58();
  const cached = getTimedCache(tokenAccountsCache, cacheKey, options.ttlMs);
  if (!options.force && cached) return cached;

  const result = await getOwnedTokenAccountsWithWarnings(ownerKey);
  setTimedCache(tokenAccountsCache, cacheKey, result);
  return result;
}

function parseTokenAccountResponse(response, tokenProgramId = null) {
  return response.value.map((item) => {
    const parsed = item.account.data.parsed.info;
    const amount = parsed.tokenAmount;
    const ownerProgram = tokenProgramId?.toBase58?.()
      || item.account.owner?.toBase58?.()
      || String(item.account.owner || "");

    return {
      pubkey: item.pubkey.toBase58(),
      mint: parsed.mint,
      tokenProgramId: ownerProgram,
      rawAmount: BigInt(amount.amount),
      uiAmount: amount.uiAmountString || "0",
      decimals: amount.decimals
    };
  });
}

function aggregateTokenAccountsForMint(accounts, mint) {
  const mintText = mint instanceof PublicKey ? mint.toBase58() : String(mint);
  const matching = accounts.filter((account) => account.mint === mintText && account.rawAmount > 0n);
  if (matching.length === 0) return null;

  const rawAmount = matching.reduce((total, account) => total + account.rawAmount, 0n);
  const decimals = Number.isInteger(matching[0].decimals) ? matching[0].decimals : 0;

  return {
    ...matching[0],
    rawAmount,
    uiAmount: rawTokenAmountToUi(rawAmount, decimals),
    accountCount: matching.length
  };
}

function sellableTokensFromAccounts(accounts) {
  const byMint = new Map();

  for (const account of accounts) {
    if (!account || account.rawAmount <= 0n || account.mint === SOL_MINT) continue;

    const current = byMint.get(account.mint);
    if (!current) {
      byMint.set(account.mint, {
        mint: account.mint,
        rawAmount: account.rawAmount,
        decimals: account.decimals,
        uiAmount: account.uiAmount,
        accountCount: 1
      });
      continue;
    }

    current.rawAmount += account.rawAmount;
    current.accountCount += 1;
    current.uiAmount = rawTokenAmountToUi(current.rawAmount, current.decimals);
  }

  return [...byMint.values()].sort((left, right) => compareBigInt(right.rawAmount, left.rawAmount));
}

function getAssociatedTokenAddress(mint, owner, tokenProgramId = TOKEN_PROGRAM_ID) {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), tokenProgramId.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
}

function createAssociatedTokenAccountInstruction(payer, associatedToken, owner, mint, tokenProgramId = TOKEN_PROGRAM_ID) {
  return new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedToken, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: tokenProgramId, isSigner: false, isWritable: false }
    ],
    data: Buffer.alloc(0)
  });
}

function createTransferCheckedInstruction(source, mint, destination, owner, amount, decimals, signers = [], tokenProgramId = TOKEN_PROGRAM_ID) {
  const data = Buffer.alloc(10);
  data[0] = 12;
  data.writeBigUInt64LE(BigInt(amount), 1);
  data[9] = decimals;

  return new TransactionInstruction({
    programId: tokenProgramId,
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: signers.length === 0, isWritable: false },
      ...signers.map((signer) => ({ pubkey: signer.publicKey ?? signer, isSigner: true, isWritable: false }))
    ],
    data
  });
}

function createCloseAccountInstruction(account, destination, owner, signers = [], tokenProgramId = TOKEN_PROGRAM_ID) {
  return new TransactionInstruction({
    programId: tokenProgramId,
    keys: [
      { pubkey: account, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: signers.length === 0, isWritable: false },
      ...signers.map((signer) => ({ pubkey: signer.publicKey ?? signer, isSigner: true, isWritable: false }))
    ],
    data: Buffer.from([9])
  });
}

async function listWallets(chatId, userId) {
  const store = await readWalletStore();
  const wallets = walletsForOwner(store, userId);
  if (wallets.length === 0) {
    await say(chatId, "You do not have any managed wallets yet.");
    return;
  }

  const pageSize = 20;
  for (let start = 0; start < wallets.length; start += pageSize) {
    const pageWallets = wallets.slice(start, start + pageSize);
    const lines = pageWallets.map((wallet, index) => {
      const walletNumber = start + index + 1;
      return `${walletNumber}. ${escapeHtml(wallet.label)}\n<code>${wallet.publicKey}</code>`;
    });
    const pageLabel = wallets.length > pageSize
      ? ` (${start + 1}-${start + pageWallets.length} of ${wallets.length})`
      : "";

    await telegram("sendMessage", {
      chat_id: chatId,
      text: `Your managed wallets${pageLabel}:\n\n${lines.join("\n\n")}\n\nTap or long-press an address to copy it.`,
      disable_web_page_preview: true,
      parse_mode: "HTML"
    });
  }
}

async function showWalletBalances(chatId, userId, messageId = null) {
  const store = await readWalletStore();
  const wallets = walletsForOwner(store, userId);

  if (wallets.length === 0) {
    await say(chatId, "You do not have any managed wallets yet.");
    return;
  }

  const started = Date.now();
  const status = await sendOrEditMessage(chatId, messageId, withBrandFooter([
    "Checking wallet balances...",
    "",
    `${wallets.length} wallet(s) queued.`,
    `Read speed: ${CONFIG.balanceConcurrency} at a time.`,
    `Cache: ${Math.round(CONFIG.balanceCacheTtlMs / 1000)}s for quick refreshes.`
  ].join("\n")), {
    inline_keyboard: [[{ text: "Main Menu", callback_data: "main_menu" }]]
  });
  const targetMessageId = messageId || status?.message_id || null;
  const lines = [];

  await runWithConcurrency(wallets, CONFIG.balanceConcurrency, async (wallet, index) => {
    try {
      const keypair = decryptWallet(wallet);
      const parts = [
        `${index + 1}. ${wallet.label}`,
        `${wallet.publicKey}`
      ];

      try {
        const balance = await getSolBalanceCached(keypair.publicKey);
        parts.push(`SOL: ${lamportsToSol(balance)}`);
      } catch (error) {
        parts.push(`SOL: unavailable - ${friendlyError(error)}`);
      }

      const { accounts: tokenAccounts, warnings, successes } = await getOwnedTokenAccountsWithWarningsCached(keypair.publicKey);
      const nonZeroTokens = tokenAccounts.filter((account) => account.rawAmount > 0n);
      if (nonZeroTokens.length > 0) {
        const tokenPreview = nonZeroTokens
          .slice(0, 4)
          .map((account) => `${shortMint(account.mint)}: ${account.uiAmount}`)
          .join("\n  ");
        const more = nonZeroTokens.length > 4 ? `\n  +${nonZeroTokens.length - 4} more token account(s)` : "";
        parts.push(`Tokens:\n  ${tokenPreview}${more}`);
      } else if (successes === 0 && warnings.length > 0) {
        parts.push(`Tokens: unavailable - ${warnings.join(" | ")}`);
      } else if (warnings.length > 0) {
        parts.push(`Tokens: none found. Partial scan warning: ${warnings.join(" | ")}`);
      } else {
        parts.push("Tokens: none");
      }

      lines[index] = parts.join("\n");
    } catch (error) {
      lines[index] = `${index + 1}. ${wallet.label}\n${wallet.publicKey}\nBalance check failed: ${friendlyError(error)}`;
    }
  });

  const finalText = withBrandFooter([
    "Wallet balances",
    `Updated in ${((Date.now() - started) / 1000).toFixed(1)}s.`,
    "",
    lines.join("\n\n")
  ].join("\n"));
  const replyMarkup = {
    inline_keyboard: [
      [{ text: "Refresh", callback_data: "check_balances" }, { text: "Positions", callback_data: "positions_overview" }],
      [{ text: "Main Menu", callback_data: "main_menu" }]
    ]
  };

  if (targetMessageId && finalText.length <= 3900) {
    await sendOrEditMessage(chatId, targetMessageId, finalText, replyMarkup);
    return;
  }

  if (targetMessageId) {
    scheduleInlineKeyboardClear(chatId, targetMessageId);
  }
  await say(chatId, finalText);
}

async function selectedTokenBalanceSummary(userId, walletIndexes, tokenMint) {
  const store = await readWalletStore();
  const lines = [];
  let holders = 0;
  const mint = new PublicKey(tokenMint);

  await runWithConcurrency(walletIndexes, CONFIG.balanceConcurrency, async (walletIndex, resultIndex) => {
    const wallet = getWalletAt(store, walletIndex, userId);
    try {
      const keypair = decryptWallet(wallet);
      const token = await getTokenBalanceForMintCached(keypair.publicKey, mint);
      if (token && token.rawAmount > 0n) holders += 1;
      lines[resultIndex] = `${walletIndex}. ${wallet.label}: ${token?.uiAmount || "0"}`;
    } catch (error) {
      lines[resultIndex] = `${walletIndex}. ${wallet.label}: balance check failed - ${friendlyError(error)}`;
    }
  });

  return [
    `Selected token balances for ${shortMint(tokenMint)}:`,
    ...lines,
    "",
    `${holders}/${walletIndexes.length} selected wallet(s) currently hold this token.`
  ].join("\n");
}

async function exportAudit(chatId) {
  const auditLog = await readJson(auditPath());
  const latest = auditLog.entries.slice(-30).map((entry) => {
    return `${entry.timestamp} | ${entry.action}`;
  });
  await say(chatId, latest.length ? `Last ${latest.length} audit entries:\n\n${latest.join("\n")}` : "Audit log is empty.");
}

async function showWalletMenu(chatId, messageId = null) {
  await sendOrEditMessage(chatId, messageId, withBrandFooter("Wallet tools:"), {
    inline_keyboard: [
      [{ text: "💴💶💷 Create Wallet Set", callback_data: "create_wallets" }],
      [{ text: "Import Wallet", callback_data: "import_wallet" }],
      [{ text: "💳 My Wallets", callback_data: "list_wallets" }],
      [{ text: "🔍 Check Balances", callback_data: "check_balances" }],
      [{ text: "Positions Overview", callback_data: "positions_overview" }],
      [{ text: "PnL / Results", callback_data: "pnl_results" }],
      [{ text: "Close Empty Token Accounts", callback_data: "close_empty_accounts" }],
      [{ text: "Remove Wallets", callback_data: "delete_wallets" }],
      [{ text: "Main Menu", callback_data: "main_menu" }]
    ]
  });
}

async function showTradeMenu(chatId, messageId = null) {
  await sendOrEditMessage(chatId, messageId, withBrandFooter("Single-wallet trade tools:\n\nPick one wallet first, then use quick buttons like 0.10 SOL, 0.50 SOL, 1 SOL, 25%, 50%, and 100%."), {
    inline_keyboard: [
      [{ text: "Buy", callback_data: "trade_buy" }, { text: "Sell", callback_data: "trade_sell" }],
      [{ text: "Auto Sell", callback_data: "trade_auto_sell" }],
      [{ text: "Sell All Tokens", callback_data: "sell_all_tokens" }],
      [{ text: "DCA Buy", callback_data: "trade_dca_buy" }, { text: "DCA Sell", callback_data: "trade_dca_sell" }],
      [{ text: "Positions", callback_data: "positions_overview" }, { text: "Wallets", callback_data: "list_wallets" }],
      [{ text: "Main Menu", callback_data: "main_menu" }]
    ]
  });
}

async function showSniperMenu(chatId, userId, messageId = null) {
  const settings = await sniperSettingsForUser(userId);
  await sendOrEditMessage(chatId, messageId, withBrandFooter([
    "OgreSniper",
    "",
    "Find the highest-scored early plays, pick one fast, and set up a buy with automatic exits.",
    "",
    `Mode: ${sniperModeLabel(settings.mode)}`,
    `Minimum score: ${settings.minScore}/100`,
    `Risk ceiling: ${settings.maxRisk}/100`,
    "",
    "Scan shows ranked picks with Snipe buttons. After amount, the bot auto-selects a take-profit / stop-loss preset you can customize before Confirm."
  ].join("\n")), {
    inline_keyboard: [
      [{ text: "Auto", callback_data: "sniper_auto_menu" }],
      [{ text: "Scan Early Plays", callback_data: "sniper_scan" }],
      [{ text: "Modes", callback_data: "sniper_modes" }],
      [{ text: "Main Menu", callback_data: "main_menu" }]
    ]
  });
}

async function showSniperAutoMenu(chatId, userId, messageId = null) {
  await sendOrEditMessage(chatId, messageId, withBrandFooter([
    "OgreSniper Auto",
    "",
    "Pick an automatic scanner. The bot still asks for wallet, amount, and Confirm before buying.",
    "",
    `AutoSnipe: balanced early-play pick with +${AUTOSNIPE_TAKE_PROFIT_PCT}% TP / -${AUTOSNIPE_STOP_LOSS_PCT}% SL.`,
    `PumpSnipe: very early pump-style launches with +${PUMPSNIPE_TAKE_PROFIT_PCT}% TP / -${PUMPSNIPE_STOP_LOSS_PCT}% SL / ${PUMPSNIPE_SLIPPAGE_BPS} bps default slippage.`
  ].join("\n")), {
    inline_keyboard: [
      [{ text: "AutoSnipe", callback_data: "sniper_auto" }],
      [{ text: "PumpSnipe", callback_data: "sniper_pumpsnipe" }],
      [{ text: "Back", callback_data: "sniper_menu" }]
    ]
  });
}

async function showSniperModes(chatId, userId, messageId = null) {
  const settings = await sniperSettingsForUser(userId);
  await sendOrEditMessage(chatId, messageId, withBrandFooter([
    "OgreSniper Modes",
    "",
    `Current: ${sniperModeLabel(settings.mode)}`,
    "",
    "Tap a mode to scan that category now. Each mode returns ranked picks with Snipe buttons, chart links, and copyable CA lines.",
    "",
    "Safe Mode: stricter score/risk filters.",
    "Smart Money Only: waits for stronger quality signals.",
    "Fast Scalps: quicker auto-exit defaults.",
    "Low Cap Moonshots: focuses on low market-cap picks under $30K when available.",
    "Meme Momentum: prioritizes social/meta language.",
    "Long Term: looks for stronger day-or-two setups with a 2-day timer.",
    `AutoSnipe: fresh-scans, auto-picks one high-conviction scalp setup, then uses +${AUTOSNIPE_TAKE_PROFIT_PCT}% TP / -${AUTOSNIPE_STOP_LOSS_PCT}% SL / ${AUTOSNIPE_SLIPPAGE_BPS} bps slippage.`,
    `PumpSnipe: focuses on very early pump-style launches, then uses +${PUMPSNIPE_TAKE_PROFIT_PCT}% TP / -${PUMPSNIPE_STOP_LOSS_PCT}% SL / ${PUMPSNIPE_SLIPPAGE_BPS} bps slippage by default.`
  ].join("\n")), {
    inline_keyboard: [
      [{ text: "Auto", callback_data: "sniper_auto_menu" }],
      [{ text: "Safe Scan", callback_data: "sniper_mode_safe" }, { text: "Smart Money Scan", callback_data: "sniper_mode_smart" }],
      [{ text: "Fast Scalp Scan", callback_data: "sniper_mode_fast" }, { text: "Low Cap Scan", callback_data: "sniper_mode_moonshot" }],
      [{ text: "Meme Scan", callback_data: "sniper_mode_meme" }, { text: "Long Term", callback_data: "sniper_mode_long" }],
      [{ text: "Back", callback_data: "sniper_menu" }]
    ]
  });
}

async function showBundleMenu(chatId, messageId = null) {
  await sendOrEditMessage(chatId, messageId, withBrandFooter("Bundle tools:\n\nAuto Bundle buys selected wallets, then watches stop-loss / take-profit exits."), {
    inline_keyboard: [
      [{ text: "Auto Bundle", callback_data: "auto_bundle" }],
      [{ text: "🧲 Bundle Buy", callback_data: "batch_buy" }],
      [{ text: "🧲 Bundle Sell", callback_data: "batch_sell" }],
      [{ text: "DCA Buy", callback_data: "dca_buy" }, { text: "DCA Sell", callback_data: "dca_sell" }],
      [{ text: "Copy Trade", callback_data: "copy_trade_info" }],
      [{ text: "Main Menu", callback_data: "main_menu" }]
    ]
  });
}

async function showWithdrawalMenu(chatId, messageId = null) {
  await sendOrEditMessage(chatId, messageId, withBrandFooter("Withdrawal tools:"), {
    inline_keyboard: [
      [{ text: "🏦 Withdraw SOL", callback_data: "sweep_sol" }],
      [{ text: "Sell All Tokens to SOL", callback_data: "sell_all_tokens" }],
      [{ text: "Sweep Tokens", callback_data: "sweep_tokens" }],
      [{ text: "Fund Wallets", callback_data: "fund_wallets" }],
      [{ text: "Main Menu", callback_data: "main_menu" }]
    ]
  });
}

async function showPnlResults(chatId, userId, messageId = null) {
  const tokenRows = await pnlRows(userId, null, { groupByToken: true, sortBy: "recent", limit: 10 });
  const cardButtons = tokenRows.map((row, index) => ([{
    text: `Latest Card ${index + 1}: ${shortMint(row.tokenMint)}`,
    callback_data: `pnl_card:${row.tokenMint}`
  }]));
  const replyMarkup = {
    inline_keyboard: [
      [{ text: "Share Best PnL Card", callback_data: "pnl_card" }],
      [{ text: "Card by CA", callback_data: "pnl_card_by_ca" }],
      ...cardButtons,
      [{ text: "Positions", callback_data: "positions_overview" }, { text: "Wallet Menu", callback_data: "wallet_menu" }],
      [{ text: "Main Menu", callback_data: "main_menu" }]
    ]
  };
  const text = withBrandFooter(await pnlSummaryText(userId, null, { includeTrades: false }));

  await sendLongMenuText(chatId, messageId, text, replyMarkup);
}

async function showPositionsOverview(chatId, userId, messageId = null) {
  const started = Date.now();
  const status = await sendOrEditMessage(chatId, messageId, withBrandFooter([
    "Loading positions...",
    "",
    "Checking wallet token accounts and recent bot trade history."
  ].join("\n")), {
    inline_keyboard: [[{ text: "Main Menu", callback_data: "main_menu" }]]
  });
  const targetMessageId = messageId || status?.message_id || null;
  const positions = await buildPositionsOverview(userId);

  if (positions.length === 0) {
    await sendOrEditMessage(chatId, targetMessageId, withBrandFooter("Positions Overview\n\nNo active token positions found. This view only shows coins your managed wallets still hold."), {
      inline_keyboard: [
        [{ text: "Refresh", callback_data: "positions_overview" }],
        [{ text: "Main Menu", callback_data: "main_menu" }]
      ]
    });
    return;
  }

  const rows = positions.slice(0, 8).map((position, index) => {
    const valueLine = position.estimatedValueLamports !== null
      ? `Value: ${lamportsBigToSol(position.estimatedValueLamports)} SOL est.`
      : `Value: unavailable${position.valueError ? ` - ${position.valueError}` : ""}`;
    const profitLine = position.estimatedValueLamports !== null
      ? `Profit: ${formatSignedLamports(position.estimatedValueLamports + position.received - position.spent)} SOL${position.spent > 0n ? ` / ${formatPercentMove(position.estimatedValueLamports + position.received - position.spent, position.spent)}` : ""}`
      : `Realized: ${formatSignedLamports(position.received - position.spent)} SOL`;

    return [
      `${index + 1}. ${shortMint(position.tokenMint)}`,
      profitLine,
      valueLine,
      `Balance: ${formatTokenAmount(position.uiAmount)} tokens across ${position.walletCount} wallet(s)`,
      `Buys/Sells: ${position.buys}/${position.sells}`,
      `Dex: ${dexScreenerUrl(position.tokenMint)}`
    ].join("\n");
  });

  const keyboard = [
    [{ text: "Buy", callback_data: "batch_buy" }, { text: "Sell & Manage", callback_data: "batch_sell" }],
    [{ text: "Refresh", callback_data: "positions_overview" }],
    ...positions.slice(0, 5).map((position, index) => ([{
      text: `Dex ${index + 1}: ${shortMint(position.tokenMint)}`,
      url: dexScreenerUrl(position.tokenMint)
    }])),
    [{ text: "PnL / Results", callback_data: "pnl_results" }, { text: "Main Menu", callback_data: "main_menu" }]
  ];

  await sendOrEditMessage(chatId, targetMessageId, withBrandFooter(["Positions Overview", "Current holdings only.", `Updated in ${((Date.now() - started) / 1000).toFixed(1)}s.`, ...rows].join("\n\n")), {
    inline_keyboard: keyboard
  });
}

async function buildPositionsOverview(userId) {
  const store = await readWalletStore();
  const wallets = walletsForOwner(store, userId);
  const history = await readTradeHistory();
  const positions = new Map();

  for (const trade of history.trades.filter((item) => String(item.userId) === String(userId))) {
    const position = ensurePosition(positions, trade.tokenMint);
    if (trade.type === "buy") {
      position.buys += 1;
      position.spent += BigInt(trade.solLamportsSpent || 0);
    } else if (trade.type === "sell") {
      position.sells += 1;
      position.received += BigInt(trade.solLamportsReceived || 0);
    }
  }

  await runWithConcurrency(wallets, CONFIG.balanceConcurrency, async (wallet) => {
    try {
      const keypair = decryptWallet(wallet);
      const { accounts } = await getOwnedTokenAccountsWithWarningsCached(keypair.publicKey);
      for (const account of accounts.filter((item) => item.rawAmount > 0n)) {
        const position = ensurePosition(positions, account.mint);
        position.rawAmount += account.rawAmount;
        position.uiAmount += Number.parseFloat(account.uiAmount || "0") || 0;
        position.wallets.add(wallet.publicKey);
        position.accounts.push({
          walletPublicKey: wallet.publicKey,
          rawAmount: account.rawAmount
        });
      }
    } catch (error) {
      // Keep the positions page usable even if one wallet balance lookup is rate-limited.
    }
  });

  const rows = [...positions.values()]
    .filter((position) => position.rawAmount > 0n)
    .sort((a, b) => Number((b.spent - b.received) - (a.spent - a.received)));

  await runWithConcurrency(rows.slice(0, 5), Math.min(2, CONFIG.balanceConcurrency), async (position) => {
    try {
      position.estimatedValueLamports = await estimatePositionValue(position);
    } catch (error) {
      position.estimatedValueLamports = null;
      position.valueError = friendlyError(error);
    }
  });

  return rows;
}

async function showSniperScan(chatId, userId, messageId = null, options = {}) {
  const settings = await sniperSettingsForUser(userId);
  const modeLabel = sniperModeLabel(settings.mode);
  const scanState = nextSniperScanState(userId, settings.mode);
  const scanningLines = [
    options.modeSelected ? `${modeLabel} selected.` : "OgreSniper is scanning latest Solana profiles...",
    "",
    `Scanning for ${modeLabel} picks with metadata, liquidity/market signals, and momentum heuristics.`,
    "Refresh rotates fresh mode-fit picks and avoids repeating the last screen when enough candidates are available."
  ];
  await sendOrEditMessage(chatId, messageId, withBrandFooter(scanningLines.join("\n")), {
    inline_keyboard: [[{ text: "Back", callback_data: "sniper_menu" }]]
  });

  const candidates = await fetchSniperCandidates();
  const scored = [];
  const scanPool = await hydrateSniperCandidates(rotateSniperCandidatePool(candidates, scanState));
  await runWithConcurrency(scanPool, Math.min(6, Math.max(3, CONFIG.balanceConcurrency)), async (candidate) => {
    try {
      scored.push(await scoreSniperCandidate(candidate, settings));
    } catch {
      // Ignore broken profile rows.
    }
  });

  const strictRows = scored
    .filter((item) => isStrictSniperPick(item, settings))
    .sort(compareSniperScores);
  const fallbackRows = scored
    .filter((item) => isFallbackSniperPick(item, settings))
    .sort(compareSniperScores);
  const qualifiedRows = strictRows.length >= 6 ? strictRows : fallbackRows;
  const modeRows = qualifiedRows.filter((item) => isModeRelevantSniperPick(item, settings.mode));
  const displayRows = modeRows.length > 0
    ? modeRows
    : qualifiedRows;
  const rows = selectRotatingSniperRows(displayRows, scanState);
  rememberSniperScanRows(userId, settings.mode, rows);

  if (rows.length === 0) {
    await say(chatId, withBrandFooter("OgreSniper scan found no usable early-play candidates right now.\n\nTry again later or choose a different mode."));
    return;
  }

  const keyboard = [
    ...chunkArray(rows.slice(0, 6).map((row, index) => ({
      text: `Snipe #${index + 1}`,
      callback_data: `sniper_pick:${row.tokenMint}`
    })), 2),
    [{ text: "Refresh Scan", callback_data: "sniper_scan" }, { text: "Modes", callback_data: "sniper_modes" }],
    [{ text: "Back", callback_data: "sniper_menu" }]
  ];

  await sendOrEditHtmlMessage(chatId, messageId, withBrandFooter([
      `<b>${escapeHtml(modeLabel)} Picks</b>`,
      `Mode: <b>${escapeHtml(modeLabel)}</b>`,
      `Refresh: <b>${scanState.refreshCount}</b> | Scored: <b>${scored.length}</b> | Qualified: <b>${qualifiedRows.length}</b> | Mode-fit: <b>${modeRows.length}</b>`,
      "Tap Snipe, choose wallets and SOL size, then review/customize profit and loss settings before Confirm. CA lines are tap-to-copy and Dex links open charts.",
      "",
      ...rows.map(formatSniperPickHtml)
    ].join("\n\n")), {
      inline_keyboard: keyboard
    });
}

async function startAutoSnipeFlow(chatId, userId, messageId = null) {
  const status = await sendOrEditMessage(chatId, messageId, withBrandFooter([
    "AutoSnipe is fresh-scanning now...",
    "",
    "Looking for one high-conviction scalp setup with live metadata, active volume, buyer pressure, and manageable risk."
  ].join("\n")), {
    inline_keyboard: [[{ text: "Back", callback_data: "sniper_menu" }]]
  });
  const targetMessageId = messageId || status?.message_id || null;

  const result = await findAutoSnipePick(userId);
  const precheckSummary = formatSniperPrecheckSummary(result.precheckStats);
  if (!result.pick) {
    clearSession(chatId);
    await sendOrEditMessage(chatId, targetMessageId, withBrandFooter([
      "AutoSnipe did not find a strong enough fresh setup right now.",
      "",
      `Scored: ${result.scoredCount}`,
      `Strict qualified: ${result.strictCount}`,
      `Backup qualified: ${result.backupCount}`,
      `Usable after precheck: ${result.freshCount}`,
      precheckSummary,
      "",
      "Try again in a minute, or use Scan Early Plays to review picks manually."
    ].filter(Boolean).join("\n")), {
      inline_keyboard: [
        [{ text: "Try AutoSnipe Again", callback_data: "sniper_auto" }],
        [{ text: "Scan Early Plays", callback_data: "sniper_scan" }],
        [{ text: "Back", callback_data: "sniper_menu" }]
      ]
    });
    return;
  }

  sessions.set(chatId, {
    step: "sniper_wallets",
    userId,
    data: {
      tokenMint: result.pick.tokenMint,
      settings: result.settings,
      score: result.pick,
      autoSnipe: true,
      planSource: "autosnipe",
      autoSnipeStats: {
        scoredCount: result.scoredCount,
        qualifiedCount: result.qualifiedCount,
        strictCount: result.strictCount,
        backupCount: result.backupCount,
        freshCount: result.freshCount,
        tier: result.tier
      }
    }
  });

  await sendSniperWalletPrompt(chatId, userId, result.pick, [
    `AutoSnipe picked the strongest ${formatAutoSnipeTier(result.tier)} setup it found.`,
    result.pick.autoSnipeSafetyNote ? `Precheck: ${result.pick.autoSnipeSafetyNote}` : "",
    `Defaults after amount: +${AUTOSNIPE_TAKE_PROFIT_PCT}% take-profit, -${AUTOSNIPE_STOP_LOSS_PCT}% stop-loss, ${AUTOSNIPE_SLIPPAGE_BPS} bps slippage.`,
    "Choose wallets, then choose SOL amount. The next screen will be Confirm."
  ].filter(Boolean).join("\n"), targetMessageId);
}

async function startPumpSnipeFlow(chatId, userId, messageId = null) {
  const status = await sendOrEditMessage(chatId, messageId, withBrandFooter([
    "PumpSnipe is scanning now...",
    "",
    "Looking for very early pump-style launches with fresh metadata, live volume, buyer pressure, and enough liquidity to attempt a fast exit."
  ].join("\n")), {
    inline_keyboard: [[{ text: "Back", callback_data: "sniper_auto_menu" }]]
  });
  const targetMessageId = messageId || status?.message_id || null;

  const result = await findPumpSnipePick(userId);
  const precheckSummary = formatSniperPrecheckSummary(result.precheckStats);
  if (!result.pick) {
    clearSession(chatId);
    await sendOrEditMessage(chatId, targetMessageId, withBrandFooter([
      "PumpSnipe did not find a strong enough early pump setup right now.",
      "",
      `Scored: ${result.scoredCount}`,
      `Strict qualified: ${result.strictCount}`,
      `Backup qualified: ${result.backupCount}`,
      `Usable after precheck: ${result.freshCount}`,
      precheckSummary,
      "",
      "Tap Try PumpSnipe Again to rotate the candidate pool, or use Scan Early Plays to review more options manually."
    ].filter(Boolean).join("\n")), {
      inline_keyboard: [
        [{ text: "Try PumpSnipe Again", callback_data: "sniper_pumpsnipe" }],
        [{ text: "Scan Early Plays", callback_data: "sniper_scan" }],
        [{ text: "Back", callback_data: "sniper_auto_menu" }]
      ]
    });
    return;
  }

  sessions.set(chatId, {
    step: "sniper_wallets",
    userId,
    data: {
      tokenMint: result.pick.tokenMint,
      settings: result.settings,
      score: result.pick,
      pumpSnipe: true,
      planSource: "pumpsnipe",
      pumpSnipeStats: {
        scoredCount: result.scoredCount,
        qualifiedCount: result.qualifiedCount,
        strictCount: result.strictCount,
        backupCount: result.backupCount,
        freshCount: result.freshCount,
        tier: result.tier
      }
    }
  });

  await sendSniperWalletPrompt(chatId, userId, result.pick, [
    `PumpSnipe picked the strongest ${formatAutoSnipeTier(result.tier)} early setup it found.`,
    result.pick.autoSnipeSafetyNote ? `Precheck: ${result.pick.autoSnipeSafetyNote}` : "",
    `Defaults after amount: +${PUMPSNIPE_TAKE_PROFIT_PCT}% take-profit, -${PUMPSNIPE_STOP_LOSS_PCT}% stop-loss, ${PUMPSNIPE_SLIPPAGE_BPS} bps slippage.`,
    "Choose wallets, choose SOL amount, then use defaults or customize before Confirm."
  ].filter(Boolean).join("\n"), targetMessageId);
}

async function startSniperPickFlow(chatId, userId, tokenMint, messageId = null) {
  scheduleInlineKeyboardClear(chatId, messageId);
  const settings = await sniperSettingsForUser(userId);
  const score = await scoreSniperCandidate({ tokenMint: parsePublicKey(tokenMint).toBase58() }, settings);
  sessions.set(chatId, {
    step: "sniper_wallets",
    userId,
    data: {
      tokenMint: score.tokenMint,
      settings,
      score
    }
  });

  await sendSniperWalletPrompt(chatId, userId, score, "Pick loaded. Choose the wallets to use for this entry.");
}

async function sendSniperWalletPrompt(chatId, userId, score, prefix, messageId = null) {
  const store = await readWalletStore();
  const wallets = walletsForOwner(store, userId);
  if (wallets.length === 0) {
    clearSession(chatId);
    await sendOrEditMessage(chatId, messageId, withBrandFooter("No managed wallets found yet. Create or import a wallet first, then come back to OgreSniper."), {
      inline_keyboard: [
        [{ text: "Wallet Menu", callback_data: "wallet_menu" }],
        [{ text: "Back", callback_data: "sniper_menu" }]
      ]
    });
    return;
  }

  const walletLines = wallets.slice(0, 12).map((wallet, index) => `${index + 1}. ${escapeHtml(wallet.label)} - <code>${wallet.publicKey}</code>`);
  const hiddenCount = Math.max(0, wallets.length - walletLines.length);
  const quickWalletRows = [
    ...(wallets.length > 1 ? [[{ text: "All Wallets", callback_data: "quick:all" }]] : []),
    ...chunkArray(wallets.slice(0, 4).map((wallet, index) => ({
      text: `Wallet ${index + 1}`,
      callback_data: `quick:${index + 1}`
    })), 2),
    [{ text: "Custom / Group", callback_data: "quick:custom" }, { text: "Cancel", callback_data: "quick:cancel" }]
  ];

  const result = await sendOrEditHtmlMessage(chatId, messageId, withBrandFooter([
      "<b>OgreSniper Entry</b>",
      "",
      formatSniperPickHtml(score),
      "",
      escapeHtml(prefix),
      "",
      ...walletLines,
      hiddenCount ? `...and ${hiddenCount} more wallet(s). Use Custom / Group for the rest.` : ""
    ].filter(Boolean).join("\n")), {
      inline_keyboard: [
        [{ text: "Open Dex Chart", url: dexScreenerUrl(score.tokenMint) }],
        ...quickWalletRows
      ]
    });
  const session = sessions.get(chatId);
  if (session && result?.message_id) {
    session.activePromptMessageId = result.message_id;
  } else if (session && messageId) {
    session.activePromptMessageId = messageId;
  }
}


function ensurePosition(positions, tokenMint) {
  const existing = positions.get(tokenMint);
  if (existing) return existing;

  const created = {
    tokenMint,
    buys: 0,
    sells: 0,
    spent: 0n,
    received: 0n,
    rawAmount: 0n,
    uiAmount: 0,
    wallets: new Set(),
    accounts: [],
    estimatedValueLamports: null,
    valueError: null,
    get walletCount() {
      return this.wallets.size;
    }
  };
  positions.set(tokenMint, created);
  return created;
}

async function estimatePositionValue(position) {
  if (!CONFIG.jupiterApiKey) {
    throw new Error("Jupiter API key missing");
  }

  const cacheKey = [
    position.tokenMint,
    ...position.accounts.slice(0, 8).map((account) => `${account.walletPublicKey}:${account.rawAmount}`)
  ].join("|");
  const cached = getTimedCache(positionValueCache, cacheKey);
  if (cached !== undefined) return cached;

  let total = 0n;
  for (const account of position.accounts.slice(0, 8)) {
    const order = await createJupiterOrder({
      taker: new PublicKey(account.walletPublicKey),
      inputMint: position.tokenMint,
      outputMint: SOL_MINT,
      amount: account.rawAmount.toString(),
      slippageBps: CONFIG.defaultSlippageBps
    });
    total += BigInt(order.outAmount || order.outputAmount || 0);
  }
  setTimedCache(positionValueCache, cacheKey, total);
  return total;
}

async function pnlSummaryText(userId, tokenFilter = null, options = {}) {
  const trades = await tradeHistoryRows(userId, tokenFilter);

  if (trades.length === 0) {
    return "PnL / Results\n\nNo bot trade history yet. Buys and sells made from this bot will show here.";
  }

  const totals = trades.reduce((summary, trade) => {
    if (trade.type === "buy") {
      summary.buys += 1;
      summary.spent += BigInt(trade.solLamportsSpent || 0);
    } else if (trade.type === "sell") {
      summary.sells += 1;
      summary.received += BigInt(trade.solLamportsReceived || 0);
    }
    return summary;
  }, { buys: 0, sells: 0, spent: 0n, received: 0n });
  const realized = totals.received - totals.spent;
  const shownTrades = options.limit ? trades.slice(0, options.limit) : trades;
  const includeTrades = options.includeTrades !== false;

  return [
    "PnL / Results",
    includeTrades ? "Trade history from this bot, newest first. Oldest trades are at the bottom." : "Tap a card button below to share a result. Use Card by CA for older tokens.",
    "Open token value is not included in realized PnL.",
    "",
    `Trades: ${trades.length} | Buys: ${totals.buys} | Sells: ${totals.sells}`,
    `Spent: ${lamportsBigToSol(totals.spent)} SOL`,
    `Received: ${lamportsBigToSol(totals.received)} SOL`,
    `Net realized: ${formatSignedLamports(realized)} SOL`,
    includeTrades && shownTrades.length < trades.length ? `Showing latest ${shownTrades.length} of ${trades.length} trade(s).` : "",
    "",
    ...(includeTrades ? shownTrades.map(formatTradeHistoryEntry) : [])
  ].filter(Boolean).join("\n\n");
}

async function tradeHistoryRows(userId, tokenFilter = null) {
  const history = await readTradeHistory();
  return history.trades
    .filter((trade) => String(trade.userId) === String(userId))
    .filter((trade) => !tokenFilter || trade.tokenMint === tokenFilter)
    .sort((a, b) => (Date.parse(b.timestamp || "") || 0) - (Date.parse(a.timestamp || "") || 0));
}

function formatTradeHistoryEntry(trade, index) {
  const isBuy = trade.type === "buy";
  const solAmount = isBuy
    ? BigInt(trade.solLamportsSpent || 0)
    : BigInt(trade.solLamportsReceived || 0);
  return [
    `${index + 1}. ${formatTradeTimestamp(trade.timestamp)} - ${String(trade.type || "trade").toUpperCase()}`,
    `Wallet: ${trade.walletLabel || shortMint(trade.walletPublicKey || "")}`,
    `Token: ${shortMint(trade.tokenMint)}`,
    `${isBuy ? "Spent" : "Received"}: ${lamportsBigToSol(solAmount)} SOL`,
    trade.tokenAmount ? `Token amount: ${shortMint(trade.tokenAmount)}` : "",
    trade.source ? `Source: ${formatTradeSource(trade.source)}` : "",
    trade.signature ? `Tx: ${shortMint(trade.signature)}` : ""
  ].filter(Boolean).join("\n");
}

function formatTradeTimestamp(value) {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return "unknown time";
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

function formatTradeSource(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function pnlRows(userId, tokenFilter = null, options = {}) {
  const history = await readTradeHistory();
  const groupByToken = Boolean(options.groupByToken);
  const aggregates = new Map();

  for (const trade of history.trades.filter((item) => String(item.userId) === String(userId))) {
    if (tokenFilter && trade.tokenMint !== tokenFilter) continue;
    const key = groupByToken ? trade.tokenMint : `${trade.walletPublicKey}:${trade.tokenMint}`;
    const entry = aggregates.get(key) || {
      walletLabel: groupByToken ? "All wallets" : trade.walletLabel,
      walletPublicKey: groupByToken ? null : trade.walletPublicKey,
      tokenMint: trade.tokenMint,
      buys: 0,
      sells: 0,
      spent: 0n,
      received: 0n,
      lastTradeAt: null
    };

    if (trade.type === "buy") {
      entry.buys += 1;
      entry.spent += BigInt(trade.solLamportsSpent || 0);
    } else if (trade.type === "sell") {
      entry.sells += 1;
      entry.received += BigInt(trade.solLamportsReceived || 0);
    }
    if (!entry.lastTradeAt || tradeTimestampMs(trade.timestamp) >= tradeTimestampMs(entry.lastTradeAt)) {
      entry.lastTradeAt = trade.timestamp || entry.lastTradeAt;
    }
    aggregates.set(key, entry);
  }

  const sortBy = options.sortBy || "pnl";
  return [...aggregates.values()]
    .sort((a, b) => sortBy === "recent"
      ? tradeTimestampMs(b.lastTradeAt) - tradeTimestampMs(a.lastTradeAt)
      : compareBigInt((b.received - b.spent), (a.received - a.spent)))
    .slice(0, options.limit || 12);
}

function tradeTimestampMs(value) {
  return Date.parse(value || "") || 0;
}

async function sendPnlCard(chatId, userId, tokenFilter = null, options = {}) {
  const rows = await pnlRows(userId, tokenFilter, { groupByToken: true, limit: 1 });
  if (rows.length === 0) {
    if (!options.quietNoData) {
      await say(chatId, tokenFilter
        ? `No PnL data found for ${shortMint(tokenFilter)}. Cards only work for buys/sells made from this bot.`
        : "No PnL data yet. Buy and sell from the bot first, then create a card.");
    }
    return;
  }

  const row = rows[0];
  try {
    const metadata = await getDexTokenMetadata(row.tokenMint);
    const png = await renderPnlCard(row, metadata);
    await sendPhoto(chatId, `pnl-card-${sanitizeFilenamePart(metadata.symbol || row.tokenMint)}.png`, png, [
      `${metadata.symbol || shortMint(row.tokenMint)} PnL card`,
      dexScreenerUrl(row.tokenMint)
    ].join("\n"), {
      inline_keyboard: [
        [{ text: "Chart", url: dexScreenerUrl(row.tokenMint) }],
        [{ text: "PnL / Results", callback_data: "pnl_results" }, { text: "Positions", callback_data: "positions_overview" }]
      ]
    });
  } catch (error) {
    if (!options.quietNoData) {
      await say(chatId, `Could not create PnL card: ${friendlyError(error)}`);
    }
  }
}

async function sendPnlCardForTokenText(chatId, userId, text) {
  const tokenMint = parsePublicKey(text).toBase58();
  await sendPnlCard(chatId, userId, tokenMint);
}

async function renderPnlCard(row, metadata = {}) {
  const spent = row.spent;
  const received = row.received;
  const realized = received - spent;
  const positive = realized >= 0n;
  const accent = positive ? PNL_CARD_STYLE.green : PNL_CARD_STYLE.red;
  const multiple = formatPnlMultiple(received, spent);
  const symbol = sanitizeCardText(metadata.symbol || shortMint(row.tokenMint), 18);
  const name = sanitizeCardText(metadata.name || "OgreTradeBot", 26);
  const imageDataUrl = await tokenImageDataUrl(metadata.imageUrl);
  const art = imageDataUrl
    ? `<image href="${imageDataUrl}" x="72" y="142" width="430" height="430" preserveAspectRatio="xMidYMid slice" clip-path="url(#artClip)"/>`
    : `<rect x="72" y="142" width="430" height="430" rx="34" fill="#123018"/><text x="287" y="385" text-anchor="middle" font-size="92" font-weight="900" fill="${accent}" font-family="${PNL_CARD_STYLE.fontFamily}">${escapeSvg(symbol.slice(0, 4))}</text>`;
  const priceMove = formatDexPriceMove(metadata.priceChange);
  const marketCap = metadata.marketCap || metadata.fdv;
  const subline = [
    marketCap ? `MC ${formatUsdCompact(marketCap)}` : null,
    priceMove || null
  ].filter(Boolean).join("  |  ");
  const profitLabel = `${positive ? "+" : "-"}${lamportsBigToSol(realized >= 0n ? realized : -realized)} SOL`;
  const borderDataUrl = await nextPnlBorderDataUrl();
  const borderLayer = borderDataUrl
    ? `<image href="${borderDataUrl}" x="0" y="0" width="${PNL_CARD_STYLE.width}" height="${PNL_CARD_STYLE.height}" preserveAspectRatio="xMidYMid slice"/>`
    : pnlSlimeBorderSvg();

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${PNL_CARD_STYLE.width}" height="${PNL_CARD_STYLE.height}" viewBox="0 0 ${PNL_CARD_STYLE.width} ${PNL_CARD_STYLE.height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#061006"/>
      <stop offset="48%" stop-color="#0b2b12"/>
      <stop offset="100%" stop-color="#020702"/>
    </linearGradient>
    <radialGradient id="glow" cx="68%" cy="50%" r="48%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.38"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="artClip"><rect x="72" y="142" width="430" height="430" rx="34"/></clipPath>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#000000" flood-opacity="0.55"/>
    </filter>
    <filter id="slimeGlow" x="-10%" y="-20%" width="120%" height="145%">
      <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="${PNL_CARD_STYLE.slime}" flood-opacity="0.95"/>
      <feDropShadow dx="0" dy="0" stdDeviation="18" flood-color="${PNL_CARD_STYLE.slime}" flood-opacity="0.42"/>
    </filter>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect width="1200" height="675" fill="url(#glow)"/>
  <g opacity="0.16">
    <path d="M0 570 C220 420 342 690 540 520 S882 430 1200 560 L1200 675 L0 675 Z" fill="${accent}"/>
    <path d="M60 100 H1140 M60 590 H1140 M980 60 V615" stroke="${accent}" stroke-width="2"/>
  </g>
  ${borderLayer}
  <rect x="42" y="86" width="1116" height="510" rx="42" fill="${PNL_CARD_STYLE.panel}" filter="url(#shadow)" stroke="rgba(255,255,255,0.09)"/>
  ${art}
  <text x="555" y="162" font-family="${PNL_CARD_STYLE.fontFamily}" font-size="54" font-weight="900" fill="${PNL_CARD_STYLE.white}" letter-spacing="0">@OgreTradeBot</text>
  <text x="555" y="215" font-family="${PNL_CARD_STYLE.fontFamily}" font-size="34" font-weight="800" fill="${PNL_CARD_STYLE.muted}">PNL CARD</text>
  <text x="555" y="392" font-family="${PNL_CARD_STYLE.fontFamily}" font-size="170" font-weight="900" fill="${accent}" letter-spacing="0">${escapeSvg(multiple)}X</text>
  <text x="555" y="450" font-family="${PNL_CARD_STYLE.fontFamily}" font-size="38" font-weight="900" fill="${PNL_CARD_STYLE.white}">${escapeSvg(symbol)} / ${escapeSvg(name)}</text>
  <text x="555" y="500" font-family="${PNL_CARD_STYLE.fontFamily}" font-size="34" font-weight="800" fill="${accent}">Profit ${escapeSvg(profitLabel)}</text>
  <text x="555" y="544" font-family="${PNL_CARD_STYLE.fontFamily}" font-size="28" font-weight="700" fill="${PNL_CARD_STYLE.muted}">Spent ${escapeSvg(lamportsBigToSol(spent))} SOL  |  Received ${escapeSvg(lamportsBigToSol(received))} SOL</text>
  <text x="555" y="584" font-family="${PNL_CARD_STYLE.fontFamily}" font-size="26" font-weight="700" fill="${PNL_CARD_STYLE.muted}">${escapeSvg(subline || shortMint(row.tokenMint))}</text>
</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function nextPnlBorderDataUrl() {
  if (PNL_CARD_BORDER_FILES.length === 0) return null;

  for (let attempt = 0; attempt < PNL_CARD_BORDER_FILES.length; attempt += 1) {
    const index = pnlBorderRotationIndex % PNL_CARD_BORDER_FILES.length;
    pnlBorderRotationIndex = (pnlBorderRotationIndex + 1) % PNL_CARD_BORDER_FILES.length;
    const dataUrl = await pnlBorderDataUrl(PNL_CARD_BORDER_FILES[index]);
    if (dataUrl) return dataUrl;
  }

  return null;
}

async function pnlBorderDataUrl(filePath) {
  if (pnlBorderDataUrlCache.has(filePath)) {
    return pnlBorderDataUrlCache.get(filePath);
  }

  try {
    const buffer = await fs.readFile(filePath);
    const dataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
    pnlBorderDataUrlCache.set(filePath, dataUrl);
    return dataUrl;
  } catch {
    pnlBorderDataUrlCache.set(filePath, null);
    return null;
  }
}

function pnlSlimeBorderSvg() {
  const slime = PNL_CARD_STYLE.slime;
  return `
  <g filter="url(#slimeGlow)">
    <rect x="42" y="86" width="1116" height="510" rx="42" fill="none" stroke="${slime}" stroke-width="7"/>
    <path d="M85 86 H1115 Q1158 86 1158 129 V157 C1139 153 1125 168 1111 150 C1097 132 1078 138 1070 158 C1062 178 1039 178 1030 158 C1020 134 997 137 987 157 C978 176 955 176 947 156 C938 135 916 134 906 154 C896 175 872 176 864 153 C856 130 834 134 825 156 C817 177 791 177 784 154 C777 131 755 132 747 155 C738 181 711 177 704 153 C697 131 674 134 665 156 C657 177 632 178 623 154 C614 130 591 134 584 156 C576 179 548 179 541 155 C534 132 511 133 503 155 C495 177 469 177 462 154 C454 130 431 133 423 155 C415 177 389 176 382 153 C374 130 352 132 344 155 C336 179 309 176 302 152 C295 130 272 134 264 156 C256 178 231 177 223 154 C216 134 194 132 184 151 C174 170 150 169 141 151 C132 133 111 134 101 154 C94 168 76 166 60 157 V129 Q60 86 85 86 Z" fill="${slime}" opacity="0.96"/>
    <path d="M135 86 C123 118 129 150 141 181 C151 207 143 236 124 258 C112 230 114 202 103 180 C91 155 92 124 108 86 Z" fill="${slime}"/>
    <path d="M308 86 C292 125 309 156 299 190 C292 214 272 223 254 215 C278 188 257 154 275 116 C281 102 289 92 299 86 Z" fill="${slime}" opacity="0.92"/>
    <path d="M526 86 C511 126 527 169 515 207 C507 234 485 251 461 247 C492 213 469 169 489 124 C498 103 510 91 526 86 Z" fill="${slime}"/>
    <path d="M742 86 C725 124 744 158 734 198 C727 226 705 237 681 230 C711 202 691 158 708 120 C716 102 728 91 742 86 Z" fill="${slime}" opacity="0.92"/>
    <path d="M1014 86 C999 120 1012 150 1002 181 C995 204 977 213 957 207 C982 184 964 149 980 116 C988 100 1000 90 1014 86 Z" fill="${slime}"/>
    <circle cx="141" cy="181" r="12" fill="${slime}"/>
    <circle cx="515" cy="207" r="14" fill="${slime}"/>
    <circle cx="734" cy="198" r="11" fill="${slime}"/>
  </g>`;
}

async function getDexTokenMetadata(tokenMint) {
  const cached = dexMetadataCache.get(tokenMint);
  if (cached && Date.now() - cached.cachedAt < 5 * 60 * 1000) {
    return cached.value;
  }

  const dexValue = await getDexScreenerTokenMetadata(tokenMint).catch(() => ({}));
  const needsPumpFallback = !dexValue.imageUrl || !dexValue.symbol || !dexValue.name;
  const pumpValue = needsPumpFallback
    ? await getPumpFunTokenMetadata(tokenMint).catch(() => ({}))
    : {};
  const value = {
    symbol: dexValue.symbol || pumpValue.symbol || "",
    name: dexValue.name || pumpValue.name || "",
    imageUrl: dexValue.imageUrl || pumpValue.imageUrl || "",
    marketCap: dexValue.marketCap || pumpValue.marketCap || null,
    fdv: dexValue.fdv || null,
    priceChange: dexValue.priceChange || null,
    liquidityUsd: dexValue.liquidityUsd || null,
    volume: dexValue.volume || null,
    txns: dexValue.txns || null,
    pairCreatedAt: dexValue.pairCreatedAt || null,
    source: dexValue.imageUrl ? "dexscreener" : pumpValue.imageUrl ? "pumpfun" : "fallback"
  };

  dexMetadataCache.set(tokenMint, { cachedAt: Date.now(), value });
  return value;
}

async function getDexScreenerTokenMetadata(tokenMint) {
  const pairs = await fetchDexScreenerTokenPairsBatch([tokenMint]);
  return metadataFromDexPair(tokenMint, bestDexPairForToken(tokenMint, pairs));
}

async function fetchDexScreenerTokenPairsBatch(tokenMints) {
  const addresses = [...new Set((tokenMints || []).filter(Boolean))].slice(0, 30);
  if (addresses.length === 0) return [];

  const tokenPath = addresses.map((address) => encodeURIComponent(address)).join(",");
  const data = await fetchJson(`https://api.dexscreener.com/tokens/v1/solana/${tokenPath}`, {
    headers: { "Accept": "application/json", "User-Agent": "solana-telegram-wallet-ops-bot" }
  });
  return Array.isArray(data) ? data : [];
}

function bestDexPairForToken(tokenMint, pairs) {
  return (pairs || [])
    .filter((pair) => pairMatchesToken(pair, tokenMint))
    .sort(compareDexPairsForSniper)[0] || null;
}

function pairMatchesToken(pair, tokenMint) {
  return pair?.baseToken?.address === tokenMint || pair?.quoteToken?.address === tokenMint;
}

function compareDexPairsForSniper(a, b) {
  return Number(b?.liquidity?.usd || 0) - Number(a?.liquidity?.usd || 0)
    || Number(b?.volume?.h1 || 0) - Number(a?.volume?.h1 || 0)
    || Number(b?.marketCap || b?.fdv || 0) - Number(a?.marketCap || a?.fdv || 0);
}

function metadataFromDexPair(tokenMint, best = null) {
  const token = best?.baseToken?.address === tokenMint ? best.baseToken : best?.quoteToken || best?.baseToken || {};

  return {
    symbol: token.symbol || "",
    name: token.name || "",
    imageUrl: best?.info?.imageUrl || "",
    marketCap: best?.marketCap || null,
    fdv: best?.fdv || null,
    priceChange: best?.priceChange || null,
    liquidityUsd: best?.liquidity?.usd || null,
    volume: best?.volume || null,
    txns: best?.txns || null,
    pairCreatedAt: best?.pairCreatedAt || null
  };
}

async function getPumpFunTokenMetadata(tokenMint) {
  const headers = { "Accept": "application/json", "User-Agent": "solana-telegram-wallet-ops-bot" };
  if (CONFIG.pumpFunApiToken) {
    headers.Authorization = `Bearer ${CONFIG.pumpFunApiToken}`;
  }

  const url = `${CONFIG.pumpFunApiBase}/coins/${encodeURIComponent(tokenMint)}?sync=false`;
  const response = await fetchJson(url, { headers });
  const coin = response?.data || response;

  return {
    symbol: coin?.symbol || "",
    name: coin?.name || "",
    imageUrl: coin?.image_uri || coin?.image || coin?.metadata?.image || "",
    marketCap: coin?.usd_market_cap || coin?.market_cap || null
  };
}

async function fetchSniperCandidates() {
  const headers = { "Accept": "application/json", "User-Agent": "solana-telegram-wallet-ops-bot" };
  const [profiles, latestBoosts, topBoosts] = await Promise.all([
    fetchJson("https://api.dexscreener.com/token-profiles/latest/v1", { headers }).catch(() => []),
    fetchJson("https://api.dexscreener.com/token-boosts/latest/v1", { headers }).catch(() => []),
    fetchJson("https://api.dexscreener.com/token-boosts/top/v1", { headers }).catch(() => [])
  ]);

  return uniqueSniperCandidates([
    ...sniperCandidatesFromDexList(profiles, "profile"),
    ...sniperCandidatesFromDexList(latestBoosts, "latest-boost"),
    ...sniperCandidatesFromDexList(topBoosts, "top-boost")
  ]);
}

async function fetchPumpSnipeCandidates() {
  const candidates = await fetchSniperCandidates();
  const latestFirst = candidates.filter((candidate) => candidate.source !== "top-boost");
  const topBoostBackup = candidates.filter((candidate) => candidate.source === "top-boost");
  return uniqueSniperCandidates([...latestFirst, ...topBoostBackup]);
}

function sniperCandidatesFromDexList(items, source) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => String(item.chainId || "").toLowerCase() === "solana" && item.tokenAddress)
    .map((item) => ({
      tokenMint: item.tokenAddress,
      source,
      profile: item
    }));
}

function nextSniperScanState(userId, mode) {
  const key = `${userId}:${mode}`;
  const previous = sniperScanState.get(key) || { refreshCount: 0, candidateOffset: -24, displayOffset: -5 };
  const next = {
    refreshCount: previous.refreshCount + 1,
    candidateOffset: previous.candidateOffset + 42,
    displayOffset: previous.displayOffset + 6,
    previousShown: previous.lastShown || [],
    updatedAt: Date.now()
  };
  sniperScanState.set(key, next);
  pruneSniperScanState();
  return next;
}

function pruneSniperScanState() {
  const maxAgeMs = 60 * 60 * 1000;
  const now = Date.now();
  for (const [key, state] of sniperScanState.entries()) {
    if (now - Number(state.updatedAt || 0) > maxAgeMs) {
      sniperScanState.delete(key);
    }
  }
}

function rotateSniperCandidatePool(candidates, scanState) {
  const unique = uniqueSniperCandidates(candidates);
  return rotateItems(unique.slice(0, 260), scanState.candidateOffset).slice(0, 108);
}

function rotatePumpSnipeCandidatePool(candidates, scanState) {
  const unique = uniqueSniperCandidates(candidates);
  const primary = unique.filter((candidate) => candidate.source !== "top-boost");
  const backup = unique.filter((candidate) => candidate.source === "top-boost");
  const pool = primary.length >= 30 ? primary : [...primary, ...backup];
  return rotateItems(pool.slice(0, 360), scanState.candidateOffset).slice(0, 144);
}

function uniqueSniperCandidates(candidates) {
  const seen = new Set();
  const rows = [];
  for (const candidate of candidates || []) {
    const tokenMint = candidate?.tokenMint;
    if (!tokenMint || seen.has(tokenMint)) continue;
    seen.add(tokenMint);
    rows.push(candidate);
  }
  return rows;
}

function compareSniperScores(a, b) {
  return Number(b.modeRelevance || 0) - Number(a.modeRelevance || 0)
    || (b.score - a.score)
    || (a.rugRisk - b.rugRisk)
    || (a.exitRisk - b.exitRisk)
    || (a.manipulationScore - b.manipulationScore);
}

function selectRotatingSniperRows(rows, scanState) {
  if (rows.length <= 6) return rows;

  const previousShown = new Set(scanState.previousShown || []);
  const freshRows = rows.filter((row) => !previousShown.has(row.tokenMint));
  const pool = freshRows.length >= 6 ? freshRows : rows;
  return uniqueSniperScoreRows(rotateItems(pool.slice(0, 42), scanState.displayOffset)).slice(0, 6);
}

function rememberSniperScanRows(userId, mode, rows) {
  const key = `${userId}:${mode}`;
  const previous = sniperScanState.get(key) || {};
  sniperScanState.set(key, {
    ...previous,
    lastShown: rows.map((row) => row.tokenMint),
    updatedAt: Date.now()
  });
}

function uniqueSniperScoreRows(rows) {
  const seen = new Set();
  const unique = [];
  for (const row of rows) {
    if (!row?.tokenMint || seen.has(row.tokenMint)) continue;
    seen.add(row.tokenMint);
    unique.push(row);
  }
  return unique;
}

async function findAutoSnipePick(userId) {
  const settings = sniperModeDefaults("autosnipe");
  const scanState = nextSniperScanState(userId, "autosnipe");
  const candidates = await fetchSniperCandidates();
  const scored = [];
  const precheckStats = createSniperPrecheckStats();
  const scanPool = await hydrateSniperCandidates(rotateSniperCandidatePool(candidates, scanState));

  await runWithConcurrency(scanPool, Math.min(6, Math.max(3, CONFIG.balanceConcurrency)), async (candidate) => {
    try {
      scored.push(await scoreSniperCandidate(candidate, settings));
    } catch {
      // Ignore broken rows; AutoSnipe only needs the best valid setup.
    }
  });

  const recentTokens = await recentAutoSnipeTokenSet(userId);
  const previousShown = new Set(scanState.previousShown || []);
  const strictQualified = scored
    .filter((item) => isAutoSnipePick(item))
    .sort(compareAutoSnipeScores);
  const strictMints = new Set(strictQualified.map((item) => item.tokenMint));
  const backupQualified = scored
    .filter((item) => !strictMints.has(item.tokenMint))
    .filter((item) => isAutoSnipeBackupPick(item))
    .sort(compareAutoSnipeScores);

  let tier = "strict";
  let precheck = await filterSniperCandidatesForBuy(
    freshAutoSnipeRows(strictQualified, previousShown, recentTokens).slice(0, 18),
    { userId, slippageBps: AUTOSNIPE_SLIPPAGE_BPS, targetAccepted: 1 }
  );
  mergeSniperPrecheckStats(precheckStats, precheck.stats);
  let safeFresh = precheck.rows;
  if (safeFresh.length === 0) {
    tier = "backup";
    precheck = await filterSniperCandidatesForBuy(
      freshAutoSnipeRows(backupQualified, previousShown, recentTokens).slice(0, 30),
      { userId, slippageBps: AUTOSNIPE_SLIPPAGE_BPS, targetAccepted: 1 }
    );
    mergeSniperPrecheckStats(precheckStats, precheck.stats);
    safeFresh = precheck.rows;
  }
  if (safeFresh.length === 0) {
    tier = "repeat";
    precheck = await filterSniperCandidatesForBuy(
      uniqueSniperScoreRows([...strictQualified, ...backupQualified])
        .filter((item) => shouldRepeatAutoSnipePick(item))
        .slice(0, 18),
      { userId, slippageBps: AUTOSNIPE_SLIPPAGE_BPS, targetAccepted: 1 }
    );
    mergeSniperPrecheckStats(precheckStats, precheck.stats);
    safeFresh = precheck.rows;
  }
  const pick = safeFresh[0] || null;

  if (pick) {
    rememberSniperScanRows(userId, "autosnipe", [pick]);
  }

  return {
    pick,
    settings,
    scoredCount: scored.length,
    qualifiedCount: strictQualified.length + backupQualified.length,
    strictCount: strictQualified.length,
    backupCount: backupQualified.length,
    freshCount: safeFresh.length,
    tier,
    precheckStats
  };
}

async function findPumpSnipePick(userId) {
  const settings = sniperModeDefaults("pumpsnipe");
  const scanState = nextSniperScanState(userId, "pumpsnipe");
  const candidates = await fetchPumpSnipeCandidates();
  const scored = [];
  const precheckStats = createSniperPrecheckStats();
  const scanPool = await hydrateSniperCandidates(rotatePumpSnipeCandidatePool(candidates, scanState));

  await runWithConcurrency(scanPool, Math.min(8, Math.max(4, CONFIG.balanceConcurrency)), async (candidate) => {
    try {
      scored.push(await scoreSniperCandidate(candidate, settings));
    } catch {
      // Ignore broken rows; PumpSnipe only needs the best valid early setup.
    }
  });

  const recentTokens = await recentAutoSnipeTokenSet(userId, "pumpsnipe");
  const previousShown = new Set(scanState.previousShown || []);
  const strictQualified = scored
    .filter((item) => isPumpSnipePick(item))
    .sort(comparePumpSnipeScores);
  const strictMints = new Set(strictQualified.map((item) => item.tokenMint));
  const backupQualified = scored
    .filter((item) => !strictMints.has(item.tokenMint))
    .filter((item) => isPumpSnipeBackupPick(item))
    .sort(comparePumpSnipeScores);

  let tier = "strict";
  let precheck = await filterSniperCandidatesForBuy(
    freshPumpSnipeRows(strictQualified, previousShown, recentTokens).slice(0, 24),
    { userId, slippageBps: PUMPSNIPE_SLIPPAGE_BPS, targetAccepted: 1 }
  );
  mergeSniperPrecheckStats(precheckStats, precheck.stats);
  let safeFresh = precheck.rows;
  if (safeFresh.length === 0) {
    tier = "backup";
    precheck = await filterSniperCandidatesForBuy(
      freshPumpSnipeRows(backupQualified, previousShown, recentTokens).slice(0, 36),
      { userId, slippageBps: PUMPSNIPE_SLIPPAGE_BPS, targetAccepted: 1 }
    );
    mergeSniperPrecheckStats(precheckStats, precheck.stats);
    safeFresh = precheck.rows;
  }
  if (safeFresh.length === 0) {
    tier = "repeat";
    precheck = await filterSniperCandidatesForBuy(
      uniqueSniperScoreRows([...strictQualified, ...backupQualified])
        .filter((item) => shouldRepeatPumpSnipePick(item))
        .slice(0, 24),
      { userId, slippageBps: PUMPSNIPE_SLIPPAGE_BPS, targetAccepted: 1 }
    );
    mergeSniperPrecheckStats(precheckStats, precheck.stats);
    safeFresh = precheck.rows;
  }

  const pick = safeFresh[0] || null;
  if (pick) {
    rememberSniperScanRows(userId, "pumpsnipe", [pick]);
  }

  return {
    pick,
    settings,
    scoredCount: scored.length,
    qualifiedCount: strictQualified.length + backupQualified.length,
    strictCount: strictQualified.length,
    backupCount: backupQualified.length,
    freshCount: safeFresh.length,
    tier,
    precheckStats
  };
}

function freshAutoSnipeRows(rows, previousShown, recentTokens) {
  const fresh = rows.filter((item) => {
    const recentlySeen = previousShown.has(item.tokenMint) || recentTokens.has(item.tokenMint);
    return !recentlySeen || shouldRepeatAutoSnipePick(item);
  });
  if (fresh.length > 0) return fresh;

  const strongRepeats = rows.filter((item) => shouldRepeatAutoSnipePick(item));
  return strongRepeats.length > 0 ? strongRepeats : rows;
}

function freshPumpSnipeRows(rows, previousShown, recentTokens) {
  const fresh = rows.filter((item) => {
    const recentlySeen = previousShown.has(item.tokenMint) || recentTokens.has(item.tokenMint);
    return !recentlySeen || shouldRepeatPumpSnipePick(item);
  });
  if (fresh.length > 0) return fresh;

  const strongRepeats = rows.filter((item) => shouldRepeatPumpSnipePick(item));
  return strongRepeats.length > 0 ? strongRepeats : rows;
}

async function filterSniperCandidatesForBuy(rows, options = {}) {
  const accepted = [];
  const stats = createSniperPrecheckStats();
  const targetAccepted = Math.max(1, Number(options.targetAccepted || 1));
  const shouldCheckRoute = options.checkRoute === true;
  const taker = shouldCheckRoute
    ? await sniperRoutePrecheckTaker(options.userId, options.routeProbeLamports || SNIPER_ROUTE_PROBE_LAMPORTS)
    : null;

  for (const row of rows) {
    if (accepted.length >= targetAccepted) break;
    stats.checked += 1;
    let isToken2022 = false;

    try {
      const safety = await getMintSafetyInfo(row.tokenMint);
      if (safety.tokenProgram === TOKEN_2022_PROGRAM_ID.toBase58()) {
        stats.token2022 += 1;
        isToken2022 = true;
      }
      if (safety.freezeAuthority) {
        stats.freezeAuthority += 1;
        stats.lastReject = `${sniperCandidateLabel(row)} blocked: freeze authority active`;
        continue;
      }
      if (safety.mintAuthority) {
        stats.mintAuthority += 1;
        stats.lastReject = `${sniperCandidateLabel(row)} blocked: mint authority active`;
        continue;
      }
    } catch {
      stats.mintReadUnavailable += 1;
    }

    if (shouldCheckRoute && taker && CONFIG.jupiterApiKey) {
      const route = await checkSniperRoundTripRoute({
        tokenMint: row.tokenMint,
        taker,
        amountLamports: options.routeProbeLamports || SNIPER_ROUTE_PROBE_LAMPORTS,
        slippageBps: options.slippageBps || CONFIG.sniperDefaultSlippageBps
      });
      if (!route.ok) {
        stats.routeRejected += 1;
        stats.lastReject = `${sniperCandidateLabel(row)} route blocked: ${route.reason}`;
        continue;
      }

      accepted.push({
        ...row,
        autoSnipeSafetyNote: isToken2022
          ? "Token-2022 mint; buy route precheck passed"
          : "mint and buy route precheck passed"
      });
      stats.accepted += 1;
      continue;
    }

    accepted.push({
      ...row,
      autoSnipeSafetyNote: isToken2022
        ? "Token-2022 mint; trade route checks after wallet and amount"
        : "mint precheck passed; trade route checks after wallet and amount"
    });
    stats.accepted += 1;
  }

  return { rows: accepted, stats };
}

async function sniperRoutePrecheckTaker(userId, minLamports = SNIPER_ROUTE_PROBE_LAMPORTS) {
  try {
    const store = await readWalletStore();
    const wallets = walletsForOwner(store, userId);
    for (const wallet of wallets.slice(0, 6)) {
      try {
        const publicKey = new PublicKey(wallet.publicKey);
        const balance = await getSolBalanceCached(publicKey, { force: false });
        if (balance >= minLamports + CONFIG.buyReserveLamports) {
          return publicKey;
        }
      } catch {
        // Try the next wallet.
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function checkSniperRoundTripRoute({ tokenMint, taker, amountLamports, slippageBps }) {
  try {
    const buyOrder = await createJupiterOrder({
      taker,
      inputMint: SOL_MINT,
      outputMint: tokenMint,
      amount: amountLamports,
      slippageBps
    });
    const estimatedTokenOut = BigInt(buyOrder.outAmount || buyOrder.outputAmount || 0);
    if (estimatedTokenOut <= 0n) {
      return { ok: false, reason: "buy route returned zero token output" };
    }

    return { ok: true, estimatedTokenOut: estimatedTokenOut.toString() };
  } catch (error) {
    return { ok: false, reason: friendlyError(error) };
  }
}

function createSniperPrecheckStats() {
  return {
    checked: 0,
    accepted: 0,
    token2022: 0,
    freezeAuthority: 0,
    mintAuthority: 0,
    mintReadUnavailable: 0,
    routeRejected: 0,
    lastReject: ""
  };
}

function mergeSniperPrecheckStats(target, source) {
  if (!source) return target;
  for (const key of ["checked", "accepted", "token2022", "freezeAuthority", "mintAuthority", "mintReadUnavailable", "routeRejected"]) {
    target[key] += Number(source[key] || 0);
  }
  if (source.lastReject) target.lastReject = source.lastReject;
  return target;
}

function formatSniperPrecheckSummary(stats) {
  if (!stats || !stats.checked) return "";
  const blocked = stats.freezeAuthority + stats.mintAuthority + stats.routeRejected;
  const parts = [
    `Prechecked: ${stats.checked}`,
    `Mint-safe: ${stats.accepted}`,
    blocked ? `Blocked: ${blocked}` : "",
    stats.routeRejected ? `No route: ${stats.routeRejected}` : "",
    stats.mintAuthority ? `Mint active: ${stats.mintAuthority}` : "",
    stats.freezeAuthority ? `Freeze active: ${stats.freezeAuthority}` : "",
    stats.token2022 ? `Token-2022 tested: ${stats.token2022}` : "",
    stats.mintReadUnavailable ? `Mint read skipped: ${stats.mintReadUnavailable}` : ""
  ].filter(Boolean);
  return [
    parts.join(" | "),
    stats.lastReject ? `Last blocker: ${stats.lastReject}` : ""
  ].filter(Boolean).join("\n");
}

function sniperCandidateLabel(row) {
  return row?.symbol || row?.name || shortMint(row?.tokenMint || "");
}

function formatAutoSnipeTier(tier) {
  if (tier === "strict") return "strict";
  if (tier === "backup") return "backup";
  if (tier === "repeat") return "repeat-strength";
  return "available";
}

async function recentAutoSnipeTokenSet(userId, source = "autosnipe") {
  const history = await readTradeHistory();
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  const tokens = new Set();

  for (const trade of history.trades) {
    if (String(trade.userId) !== String(userId)) continue;
    if (trade.type !== "buy" || trade.source !== source || !trade.tokenMint) continue;
    const timestamp = Date.parse(trade.timestamp || "");
    if (Number.isFinite(timestamp) && timestamp >= cutoff) {
      tokens.add(trade.tokenMint);
    }
  }

  return tokens;
}

function isAutoSnipePick(item) {
  const flags = new Set(item.riskFlags || []);
  const liquidityToMarketCap = item.marketCap > 0 ? item.liquidityUsd / item.marketCap : 0;

  return item.category !== "Avoid"
    && item.score >= 78
    && item.rugRisk <= 48
    && item.exitRisk <= 58
    && item.manipulationScore <= 68
    && item.scalpScore >= 4
    && item.marketCap >= 5_000
    && item.marketCap <= 220_000
    && item.liquidityUsd >= 4_000
    && item.liquidityUsd <= 120_000
    && liquidityToMarketCap >= 0.025
    && liquidityToMarketCap <= 1.25
    && (item.volume5m >= 500 || item.volumeH1 >= 5_000)
    && item.buyPressure >= 1.03
    && item.m5 >= -8
    && item.m5 <= 55
    && item.h1 >= -5
    && item.h1 <= 120
    && !flags.has("hard dump")
    && !flags.has("dumping")
    && !flags.has("sell pressure")
    && !flags.has("low volume");
}

function isAutoSnipeBackupPick(item) {
  const flags = new Set(item.riskFlags || []);
  const liquidityToMarketCap = item.marketCap > 0 ? item.liquidityUsd / item.marketCap : 0;

  return item.category !== "Avoid"
    && item.score >= 64
    && item.rugRisk <= 64
    && item.exitRisk <= 76
    && item.manipulationScore <= 84
    && item.scalpScore >= 3
    && item.marketCap >= 3_000
    && item.marketCap <= 450_000
    && item.liquidityUsd >= 2_500
    && liquidityToMarketCap >= 0.012
    && (item.volume5m >= 250 || item.volumeH1 >= 2_500)
    && item.buyPressure >= 0.95
    && item.m5 >= -12
    && item.h1 >= -10
    && !flags.has("hard dump")
    && !flags.has("sell pressure")
    && !flags.has("low volume");
}

function isPumpSnipePick(item) {
  const flags = new Set(item.riskFlags || []);
  const liquidityToMarketCap = item.marketCap > 0 ? item.liquidityUsd / item.marketCap : 0;
  const earlyEnough = item.pairAgeMinutes === null
    || item.pairAgeMinutes <= 240
    || isPumpStyleToken(item);

  return item.category !== "Avoid"
    && earlyEnough
    && item.score >= 50
    && item.rugRisk <= 84
    && item.exitRisk <= 92
    && item.manipulationScore <= 96
    && item.scalpScore >= 2
    && item.marketCap >= 500
    && item.marketCap <= 220_000
    && item.liquidityUsd >= 500
    && liquidityToMarketCap >= 0.004
    && (item.volume5m >= 75 || item.volumeH1 >= 750)
    && item.buyPressure >= 0.65
    && item.m5 >= -25
    && item.m5 <= 180
    && item.h1 >= -35
    && !flags.has("hard dump")
    && !flags.has("sell pressure");
}

function isPumpSnipeBackupPick(item) {
  const flags = new Set(item.riskFlags || []);
  const liquidityToMarketCap = item.marketCap > 0 ? item.liquidityUsd / item.marketCap : 0;

  return item.category !== "Avoid"
    && item.score >= 42
    && item.rugRisk <= 90
    && item.exitRisk <= 96
    && item.manipulationScore <= 98
    && item.scalpScore >= 1
    && item.marketCap >= 400
    && item.marketCap <= 320_000
    && item.liquidityUsd >= 400
    && liquidityToMarketCap >= 0.003
    && (item.volume5m >= 50 || item.volumeH1 >= 400)
    && item.buyPressure >= 0.55
    && item.m5 >= -30
    && !flags.has("hard dump")
    && !flags.has("sell pressure");
}

function shouldRepeatAutoSnipePick(item) {
  return item.score >= 86
    && item.rugRisk <= 42
    && item.exitRisk <= 50
    && item.scalpScore >= 5
    && item.buyPressure >= 1.2
    && item.m5 >= 2
    && item.h1 >= 5
    && !(item.riskFlags || []).includes("hard dump")
    && !(item.riskFlags || []).includes("sell pressure");
}

function shouldRepeatPumpSnipePick(item) {
  return item.score >= 74
    && item.rugRisk <= 62
    && item.exitRisk <= 72
    && item.scalpScore >= 3
    && item.buyPressure >= 1.05
    && item.m5 >= -5
    && (item.pairAgeMinutes === null || item.pairAgeMinutes <= 180 || isPumpStyleToken(item))
    && !(item.riskFlags || []).includes("hard dump")
    && !(item.riskFlags || []).includes("sell pressure");
}

function compareAutoSnipeScores(a, b) {
  return (b.scalpScore - a.scalpScore)
    || (b.score - a.score)
    || (Number(b.buyPressure || 0) - Number(a.buyPressure || 0))
    || (Number(b.volume5m || 0) - Number(a.volume5m || 0))
    || (a.exitRisk - b.exitRisk)
    || (a.rugRisk - b.rugRisk)
    || (a.manipulationScore - b.manipulationScore);
}

function comparePumpSnipeScores(a, b) {
  return (pumpFreshnessScore(b) - pumpFreshnessScore(a))
    || (Number(b.modeRelevance || 0) - Number(a.modeRelevance || 0))
    || (b.scalpScore - a.scalpScore)
    || (b.score - a.score)
    || (Number(b.buyPressure || 0) - Number(a.buyPressure || 0))
    || (Number(b.volume5m || 0) - Number(a.volume5m || 0))
    || (a.exitRisk - b.exitRisk)
    || (a.rugRisk - b.rugRisk);
}

function pumpFreshnessScore(item) {
  const age = Number(item.pairAgeMinutes);
  if (!Number.isFinite(age)) return isPumpStyleToken(item) ? 4 : 1;
  if (age <= 15) return 8;
  if (age <= 45) return 7;
  if (age <= 90) return 6;
  if (age <= 180) return 4;
  if (age <= 360) return 2;
  return 0;
}

function isPumpStyleToken(item) {
  const haystack = `${item?.tokenMint || ""} ${item?.symbol || ""} ${item?.name || ""}`.toLowerCase();
  return haystack.includes("pump");
}

function isStrictSniperPick(item, settings) {
  return item.category !== "Avoid"
    && item.score >= Math.max(52, settings.minScore - 10)
    && item.rugRisk <= settings.maxRisk + 14
    && item.exitRisk <= 72
    && item.scalpScore >= 3
    && !item.riskFlags?.includes("dumping")
    && !item.riskFlags?.includes("sell pressure")
    && !item.riskFlags?.includes("low volume");
}

function isFallbackSniperPick(item, settings) {
  return item.score >= Math.max(45, settings.minScore - 22)
    && item.rugRisk <= settings.maxRisk + 24
    && item.exitRisk <= 84
    && item.scalpScore >= 2
    && !item.riskFlags?.includes("hard dump");
}

async function hydrateSniperCandidates(candidates) {
  const unique = uniqueSniperCandidates(candidates);
  const pairByToken = new Map();

  await runWithConcurrency(chunkArray(unique.map((item) => item.tokenMint), 30), 2, async (chunk) => {
    const pairs = await fetchDexScreenerTokenPairsBatch(chunk).catch(() => []);
    for (const tokenMint of chunk) {
      const best = bestDexPairForToken(tokenMint, pairs);
      if (best) pairByToken.set(tokenMint, best);
    }
  });

  return unique.map((candidate) => {
    const pair = pairByToken.get(candidate.tokenMint);
    const metadata = pair
      ? mergeSniperMetadata(metadataFromDexPair(candidate.tokenMint, pair), candidate.profile, candidate.source)
      : null;
    if (metadata) {
      dexMetadataCache.set(candidate.tokenMint, { cachedAt: Date.now(), value: metadata });
    }
    return {
      ...candidate,
      dexPair: pair || null,
      metadata
    };
  });
}

function mergeSniperMetadata(dexValue, profile = {}, source = "profile") {
  return {
    ...dexValue,
    symbol: dexValue.symbol || profile.symbol || "",
    name: dexValue.name || profile.name || "",
    imageUrl: dexValue.imageUrl || profile.icon || "",
    description: profile.description || "",
    profileSource: source,
    boostAmount: Number(profile.amount || profile.totalAmount || 0)
  };
}

function isModeRelevantSniperPick(item, mode) {
  if (mode === "autosnipe") return Number(item.modeRelevance || 0) >= 4;
  if (mode === "pumpsnipe") return Number(item.modeRelevance || 0) >= 3;
  if (mode === "moonshot") return Number(item.modeRelevance || 0) >= 3 && item.marketCap > 0 && item.marketCap <= 30_000;
  if (mode === "long") return Number(item.modeRelevance || 0) >= 3 && item.h6 >= 0;
  return Number(item.modeRelevance || 0) >= (mode === "ai" || mode === "meme" ? 5 : 3);
}

function rotateItems(items, offset) {
  if (!Array.isArray(items) || items.length <= 1) return items || [];
  const start = Math.abs(Number(offset) || 0) % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

function buyPressureRatio(buys, sells) {
  const buyCount = Math.max(0, Number(buys) || 0);
  const sellCount = Math.max(0, Number(sells) || 0);
  if (buyCount === 0 && sellCount === 0) return 1;
  return (buyCount + 1) / (sellCount + 1);
}

function sniperScalpSetup({ m5, h1, h6, volume5m, volumeH1, buyPressure, liquidityUsd, sells5m, sellsH1 }) {
  const hasActiveVolume = volume5m >= 750 || volumeH1 >= 5_000;
  const hasGoodLiquidity = liquidityUsd >= 5_000;
  const buyersPresent = buyPressure >= 1.08;
  const notTooMuchShortSelling = sells5m < 8 || buyPressure >= 1.2;

  if (!hasActiveVolume || !hasGoodLiquidity) {
    return { label: "Low-volume watch", score: 0 };
  }

  if (m5 >= 4 && h1 >= 6 && buyersPresent) {
    return { label: "Breakout scalp", score: 5 };
  }

  if (m5 >= -2 && h1 >= 8 && buyersPresent && notTooMuchShortSelling) {
    return { label: "Uptrend scalp", score: 4 };
  }

  if (m5 >= -12 && m5 <= 2 && (h1 >= 15 || h6 >= 20) && buyPressure >= 1.18 && volumeH1 >= 7_500) {
    return { label: "Cool-off bounce", score: 4 };
  }

  if (m5 >= 0 && h1 >= 0 && volumeH1 >= 10_000 && buyPressure >= 1) {
    return { label: "Volume building", score: 3 };
  }

  if (h1 >= 10 && volumeH1 >= 5_000 && buyPressure >= 0.95 && sellsH1 < 30) {
    return { label: "Needs confirmation", score: 2 };
  }

  return { label: "Slow/unclear", score: 1 };
}

function pumpSnipeScalpSetup({ m5, h1, h6, volume5m, volumeH1, buyPressure, liquidityUsd, sells5m, sellsH1 }) {
  const hasEarlyVolume = volume5m >= 75 || volumeH1 >= 750;
  const hasTradableLiquidity = liquidityUsd >= 500;
  const buyersPresent = buyPressure >= 0.85;
  const shortSellsControlled = sells5m < 12 || buyPressure >= 1;

  if (!hasEarlyVolume || !hasTradableLiquidity) {
    return { label: "Early watch", score: 1 };
  }

  if (m5 >= 6 && buyersPresent && volume5m >= 150) {
    return { label: "Fresh pump breakout", score: 5 };
  }

  if (m5 >= -4 && h1 >= 4 && buyersPresent && shortSellsControlled) {
    return { label: "Early uptrend scalp", score: 4 };
  }

  if (m5 >= -10 && h1 >= 8 && buyPressure >= 0.95 && volumeH1 >= 1_500) {
    return { label: "Early cool-off bounce", score: 4 };
  }

  if (m5 >= -8 && volumeH1 >= 1_000 && buyPressure >= 0.8) {
    return { label: "Pump volume building", score: 3 };
  }

  if (h1 >= -5 && volumeH1 >= 750 && buyPressure >= 0.75 && sellsH1 < 40) {
    return { label: "Early confirmation", score: 2 };
  }

  return { label: "Early watch", score: 1 };
}

function sniperVolumePenalty({ volume5m, volumeH1, liquidityUsd }) {
  let penalty = 0;
  if (volume5m < 250 && volumeH1 < 2_000) penalty += 18;
  else if (volume5m < 750 && volumeH1 < 5_000) penalty += 10;
  if (liquidityUsd >= 25_000 && volumeH1 < 2_500) penalty += 6;
  return penalty;
}

function sniperDumpPenalty({ m5, h1, h6, h24 }) {
  let penalty = 0;
  if (m5 < -10) penalty += Math.min(18, Math.abs(m5) * 0.9);
  if (h1 < -8) penalty += Math.min(24, Math.abs(h1) * 0.9);
  if (h6 < -15) penalty += Math.min(20, Math.abs(h6) * 0.45);
  if (h24 < -35) penalty += 10;
  return Math.round(penalty);
}

function sniperLiquidityPenalty({ marketCap, liquidityUsd }) {
  let penalty = 0;
  if (liquidityUsd <= 0) penalty += 18;
  else if (liquidityUsd < 5_000) penalty += 18;
  else if (liquidityUsd < 10_000) penalty += 10;

  if (marketCap > 0 && liquidityUsd > 0) {
    const liqToMc = liquidityUsd / marketCap;
    if (liqToMc < 0.015) penalty += 18;
    else if (liqToMc < 0.03) penalty += 10;
  }

  return Math.round(penalty);
}

function sniperSellPressurePenalty({ buys5m, sells5m, buysH1, sellsH1 }) {
  const shortPressure = buyPressureRatio(buys5m, sells5m);
  const hourlyPressure = buyPressureRatio(buysH1, sellsH1);
  let penalty = 0;
  if (sells5m >= 5 && shortPressure < 0.75) penalty += 18;
  else if (sells5m >= 3 && shortPressure < 0.95) penalty += 8;
  if (sellsH1 >= 10 && hourlyPressure < 0.8) penalty += 14;
  else if (sellsH1 >= 5 && hourlyPressure < 1) penalty += 6;
  return penalty;
}

function sniperRiskFlags(data) {
  const flags = [];
  if (data.namePenalty > 0) flags.push("bad name");
  if (data.m5 < -18 || data.h1 < -20 || data.h6 < -35) flags.push("hard dump");
  else if (data.m5 < -10 || data.h1 < -8 || data.h6 < -15) flags.push("dumping");
  if (data.volume5m < 250 && data.volumeH1 < 2_000) flags.push("low volume");
  if (data.liquidityUsd > 0 && data.liquidityUsd < 10_000) flags.push("thin liquidity");
  if (data.marketCap > 0 && data.liquidityUsd > 0 && data.liquidityUsd / data.marketCap < 0.03) flags.push("weak liquidity");
  if ((data.sells5m >= 5 && buyPressureRatio(data.buys5m, data.sells5m) < 0.9)
    || (data.sellsH1 >= 10 && buyPressureRatio(data.buysH1, data.sellsH1) < 0.85)) {
    flags.push("sell pressure");
  }
  return flags;
}

async function scoreSniperCandidate(candidate, settings) {
  const tokenMint = candidate.tokenMint;
  const metadata = candidate.metadata || await getDexTokenMetadata(tokenMint);
  const text = `${metadata.symbol || ""} ${metadata.name || ""} ${metadata.description || ""}`.toLowerCase();
  const marketCap = Number(metadata.marketCap || metadata.fdv || 0);
  const liquidityUsd = Number(metadata.liquidityUsd || 0);
  const volume5m = Number(metadata.volume?.m5 || 0);
  const volumeH1 = Number(metadata.volume?.h1 || 0);
  const m5 = Number(metadata.priceChange?.m5 || 0);
  const h24 = Number(metadata.priceChange?.h24 || 0);
  const h6 = Number(metadata.priceChange?.h6 || 0);
  const h1 = Number(metadata.priceChange?.h1 || 0);
  const tx5m = metadata.txns?.m5 || {};
  const txH1 = metadata.txns?.h1 || {};
  const buys5m = Number(tx5m.buys || 0);
  const sells5m = Number(tx5m.sells || 0);
  const buysH1 = Number(txH1.buys || 0);
  const sellsH1 = Number(txH1.sells || 0);
  const buyPressure = buyPressureRatio(buys5m + buysH1, sells5m + sellsH1);
  const pairAgeMinutes = metadata.pairCreatedAt ? Math.max(0, Math.round((Date.now() - Number(metadata.pairCreatedAt)) / 60_000)) : null;
  const hasImage = Boolean(metadata.imageUrl);
  const hasMeta = Boolean(metadata.symbol && metadata.name);
  const narrative = sniperNarrativeScore(text, settings.mode);
  const modeRelevance = sniperModeRelevance(settings.mode, {
    tokenMint,
    marketCap,
    liquidityUsd,
    m5,
    h1,
    h6,
    h24,
    text,
    buyPressure,
    volume5m,
    volumeH1,
    narrative,
    pairAgeMinutes
  });
  const scalp = settings.mode === "pumpsnipe"
    ? pumpSnipeScalpSetup({ m5, h1, h6, volume5m, volumeH1, buyPressure, liquidityUsd, sells5m, sellsH1 })
    : sniperScalpSetup({ m5, h1, h6, volume5m, volumeH1, buyPressure, liquidityUsd, sells5m, sellsH1 });
  const liquiditySignal = liquidityUsd > 0
    ? Math.min(22, Math.log10(Math.max(10, liquidityUsd)) * 4)
    : marketCap > 0 ? Math.min(12, Math.log10(Math.max(10, marketCap)) * 2) : 2;
  const volumeSignal = Math.min(14, Math.log10(Math.max(1, volumeH1 + volume5m)) * 2.5);
  const buyPressureSignal = clamp(Math.round((buyPressure - 1) * 10), -8, 10);
  const dumpPenalty = sniperDumpPenalty({ m5, h1, h6, h24 });
  const liquidityPenalty = sniperLiquidityPenalty({ marketCap, liquidityUsd });
  const sellPressurePenalty = sniperSellPressurePenalty({ buys5m, sells5m, buysH1, sellsH1 });
  const volumePenalty = sniperVolumePenalty({ volume5m, volumeH1, liquidityUsd });
  const namePenalty = sniperRiskPenalty(text);
  const momentumSignal = Math.max(0, Math.min(25, (m5 * 0.8) + (h1 * 0.35) + (h6 * 0.1) + (h24 * 0.02)));
  const metadataSignal = (hasMeta ? 12 : 2) + (hasImage ? 8 : 0);
  const modeBonus = sniperModeBonus(settings.mode, { tokenMint, marketCap, liquidityUsd, m5, h1, h6, h24, text, buyPressure, volume5m, volumeH1, narrative, pairAgeMinutes });
  const riskTotal = namePenalty + dumpPenalty + liquidityPenalty + sellPressurePenalty + volumePenalty;
  const score = clamp(Math.round(22 + liquiditySignal + volumeSignal + momentumSignal + metadataSignal + narrative + modeBonus + buyPressureSignal + (scalp.score * 5) - riskTotal), 1, 100);
  const rugRisk = clamp(Math.round(70 - metadataSignal - Math.min(18, liquiditySignal) - Math.min(10, volumeSignal) + namePenalty + liquidityPenalty + sellPressurePenalty + volumePenalty + Math.round(dumpPenalty * 0.65)), 1, 100);
  const exitRisk = clamp(Math.round(58 - Math.min(18, momentumSignal) - Math.max(0, buyPressureSignal) - (scalp.score * 3) + dumpPenalty + sellPressurePenalty + volumePenalty + (marketCap > 0 && marketCap < 20_000 ? 12 : 0)), 1, 100);
  const manipulationScore = clamp(Math.round(28 + (liquidityPenalty * 0.8) + (Math.abs(m5) > 60 ? 12 : 0) + (Math.abs(h1) > 100 ? 18 : 0) + sellPressurePenalty + (pairAgeMinutes !== null && pairAgeMinutes < 10 ? 10 : 0) - (hasMeta ? 6 : 0)), 1, 100);
  const riskFlags = sniperRiskFlags({ m5, h1, h6, h24, liquidityUsd, marketCap, volume5m, volumeH1, buys5m, sells5m, buysH1, sellsH1, namePenalty });
  const category = riskFlags.includes("hard dump") || rugRisk > settings.maxRisk + 26
    ? "Avoid"
    : score >= 82 && rugRisk <= settings.maxRisk
    ? "High Conviction"
    : score >= settings.minScore && momentumSignal >= 10
      ? "Momentum"
      : score >= settings.minScore
        ? "Stealth Accumulation"
        : "Avoid";

  return {
    tokenMint,
    symbol: metadata.symbol,
    name: metadata.name,
    score,
    category,
    rugRisk,
    exitRisk,
    manipulationScore,
    liquidityUsd,
    volume5m,
    volumeH1,
    buyPressure,
    scalpSetup: scalp.label,
    scalpScore: scalp.score,
    modeRelevance,
    marketCap,
    m5,
    h1,
    h6,
    h24,
    narrative,
    pairAgeMinutes,
    riskFlags,
    momentum: scalp.score >= 4 ? "Scalp-ready" : momentumSignal >= 18 ? "Strong" : momentumSignal >= 8 ? "Building" : "Weak",
    smartMoney: score >= 80 ? "High" : score >= 65 ? "Medium" : "Low",
    reasons: sniperReasons({ hasImage, hasMeta, marketCap, liquidityUsd, volume5m, volumeH1, m5, h1, h6, h24, narrative, buyPressure, scalpSetup: scalp.label, riskFlags, settings })
  };
}

function formatSniperPickHtml(score, index = null) {
  const rank = Number.isInteger(index) ? `${index + 1}. ` : "";
  const label = escapeHtml(score.symbol || score.name || shortMint(score.tokenMint));
  const reasons = score.reasons?.length ? escapeHtml(score.reasons.join(" | ")) : "highest available quality signals";
  return [
    `<b>${rank}${escapeHtml(score.category)}: ${label}</b>`,
    `Score: <b>${score.score}/100</b> | Momentum: ${escapeHtml(score.momentum)} | Rug: ${score.rugRisk}/100 | Exit: ${score.exitRisk}/100`,
    `Setup: <b>${escapeHtml(score.scalpSetup || "Scalp watch")}</b> | 5m: ${formatPercentCompact(score.m5)} | 1h: ${formatPercentCompact(score.h1)}`,
    `MC: ${formatUsdCompact(score.marketCap || 0) || "$0"} | Liq: ${formatUsdCompact(score.liquidityUsd || 0) || "$0"} | Vol 5m/1h: ${formatUsdCompact(score.volume5m || 0) || "$0"} / ${formatUsdCompact(score.volumeH1 || 0) || "$0"}`,
    `Flow: ${formatBuyPressure(score.buyPressure)} | Mode fit: ${score.modeRelevance || 0}/5`,
    `Smart: ${escapeHtml(score.smartMoney)} | Manipulation: ${score.manipulationScore}/100${score.riskFlags?.length ? ` | Flags: ${escapeHtml(score.riskFlags.join(", "))}` : ""}`,
    `CA: <code>${score.tokenMint}</code>`,
    `Dex: <a href="${dexScreenerUrl(score.tokenMint)}">Open chart</a>`,
    `Why: ${reasons}`
  ].join("\n");
}

function sniperReasons(data) {
  const reasons = [];
  if (data.scalpSetup) reasons.push(data.scalpSetup);
  if (data.hasMeta) reasons.push("metadata live");
  if (data.liquidityUsd > 0) reasons.push(`liq ${formatUsdCompact(data.liquidityUsd)}`);
  if (data.volume5m > 0) reasons.push(`5m vol ${formatUsdCompact(data.volume5m)}`);
  if (data.volumeH1 > 0 && reasons.length < 4) reasons.push(`1h vol ${formatUsdCompact(data.volumeH1)}`);
  if (data.buyPressure > 1.15) reasons.push("buyers leading");
  if (data.m5 > 0) reasons.push(`5m +${data.m5.toFixed(1)}%`);
  else if (data.h1 > 0) reasons.push(`1h +${data.h1.toFixed(1)}%`);
  if (data.narrative > 0) reasons.push(`${sniperModeLabel(data.settings.mode)} narrative match`);
  for (const flag of data.riskFlags || []) {
    if (reasons.length >= 4) break;
    reasons.push(`watch ${flag}`);
  }
  return reasons.slice(0, 4);
}

function sniperModeDefaults(mode) {
  const defaults = {
    safe: { mode: "safe", minScore: 78, maxRisk: 42 },
    smart: { mode: "smart", minScore: 82, maxRisk: 45 },
    fast: { mode: "fast", minScore: 68, maxRisk: 58 },
    moonshot: { mode: "moonshot", minScore: 62, maxRisk: 65 },
    meme: { mode: "meme", minScore: 66, maxRisk: 58 },
    ai: { mode: "ai", minScore: 66, maxRisk: 58 },
    long: { mode: "long", minScore: 72, maxRisk: 48 },
    autosnipe: { mode: "autosnipe", minScore: 82, maxRisk: 38 },
    pumpsnipe: { mode: "pumpsnipe", minScore: 48, maxRisk: 78 }
  };
  return defaults[mode] || defaults.safe;
}

function sniperModeLabel(mode) {
  const labels = {
    safe: "Safe Mode",
    smart: "Smart Money Only",
    fast: "Fast Scalps",
    moonshot: "Low Cap Moonshots",
    meme: "Meme Momentum",
    ai: "AI Narrative",
    long: "Long Term",
    autosnipe: "AutoSnipe",
    pumpsnipe: "PumpSnipe"
  };
  return labels[mode] || labels.safe;
}

function sniperNarrativeScore(text, mode) {
  const keywords = {
    ai: ["ai", "agent", "gpt", "robot", "neural", "compute", "agi"],
    meme: ["dog", "cat", "frog", "pepe", "bonk", "wif", "meme", "cto"],
    moonshot: ["moon", "rocket", "pump", "gem", "100x"],
    fast: ["pump", "moon", "send", "ape"],
    pumpsnipe: ["pump", "moon", "send", "ape", "cto", "meme"],
    long: ["utility", "ai", "agent", "game", "defi", "protocol", "community"]
  };
  const list = keywords[mode] || [];
  return list.some((word) => text.includes(word)) ? 10 : 0;
}

function sniperModeBonus(mode, data) {
  const relevance = sniperModeRelevance(mode, data);
  if (mode === "safe") return relevance >= 3 ? 8 : 0;
  if (mode === "smart") return relevance >= 3 ? 10 : 0;
  if (mode === "fast") return relevance >= 3 ? 11 : 0;
  if (mode === "autosnipe") return relevance >= 4 ? 13 : relevance >= 3 ? 6 : 0;
  if (mode === "pumpsnipe") return relevance >= 4 ? 15 : relevance >= 3 ? 9 : relevance >= 2 ? 4 : 0;
  if (mode === "moonshot") return relevance >= 3 ? 8 : 0;
  if (mode === "long") return relevance >= 4 ? 10 : relevance >= 3 ? 5 : 0;
  if (mode === "meme" || mode === "ai") return data.narrative > 0 ? 12 : 0;
  return 0;
}

function sniperModeRelevance(mode, data) {
  if (mode === "ai" || mode === "meme") return data.narrative > 0 ? 5 : 0;
  if (mode === "safe") {
    return Number(data.liquidityUsd >= 10_000)
      + Number(data.marketCap >= 50_000)
      + Number(data.buyPressure >= 1)
      + Number(data.m5 >= -4 && data.h1 >= 0)
      + Number(data.volumeH1 >= 5_000 || data.volume5m >= 750);
  }
  if (mode === "smart") {
    return Number(data.buyPressure >= 1.1)
      + Number(data.volumeH1 >= 7_500 || data.volume5m >= 1_000)
      + Number(data.h1 > 5 || data.m5 > 2)
      + Number(data.h6 >= 0)
      + Number(data.liquidityUsd >= 8_000);
  }
  if (mode === "fast") {
    return Number(data.m5 > 2 || data.h1 > 8)
      + Number(data.volumeH1 >= 10_000 || data.volume5m >= 1_500)
      + Number(data.buyPressure >= 1.15)
      + Number(data.liquidityUsd >= 5_000)
      + Number(data.h6 >= -5 && data.m5 >= -8);
  }
  if (mode === "autosnipe") {
    return Number(data.m5 >= 0 && data.h1 >= 4)
      + Number(data.volumeH1 >= 10_000 || data.volume5m >= 1_000)
      + Number(data.buyPressure >= 1.15)
      + Number(data.liquidityUsd >= 8_000)
      + Number(data.h6 >= -5 && data.m5 >= -6);
  }
  if (mode === "pumpsnipe") {
    const age = Number(data.pairAgeMinutes);
    const isEarly = !Number.isFinite(age) || age <= 240;
    return Number(isEarly)
      + Number(data.marketCap > 0 && data.marketCap <= 180_000)
      + Number(data.liquidityUsd >= 1_000)
      + Number(data.volume5m >= 100 || data.volumeH1 >= 1_000)
      + Number(data.buyPressure >= 0.85)
      + Number(data.m5 >= -15 && data.h1 >= -20);
  }
  if (mode === "moonshot") {
    return Number(data.marketCap > 0 && data.marketCap <= 30_000)
      + Number(data.liquidityUsd >= 3_000)
      + Number(data.buyPressure >= 1)
      + Number(data.volumeH1 >= 3_000 || data.volume5m >= 500)
      + Number(data.h1 >= -5 && data.m5 >= -10);
  }
  if (mode === "long") {
    return Number(data.marketCap >= 30_000 && data.marketCap <= 1_500_000)
      + Number(data.liquidityUsd >= 10_000)
      + Number(data.buyPressure >= 1)
      + Number(data.h1 >= 0 && data.h6 >= 0)
      + Number(data.h24 >= -10);
  }
  return 1;
}

function sniperRiskPenalty(text) {
  const bad = ["test", "rug", "scam", "honeypot", "copy", "fake"];
  return bad.some((word) => text.includes(word)) ? 18 : 0;
}

function applySniperExitPreset(session, presetText) {
  const preset = String(presetText || "").trim().toLowerCase();
  const presets = {
    fast: { sellDelaySeconds: 180, sellPercent: 100, takeProfitPct: 35, stopLossPct: 10, label: "Fast Scalp" },
    balanced: { sellDelaySeconds: 900, sellPercent: 80, takeProfitPct: 50, stopLossPct: 15, label: "Balanced" },
    moonbag: { sellDelaySeconds: 1800, sellPercent: 60, takeProfitPct: 100, stopLossPct: 25, label: "Moonbag" },
    safe: { sellDelaySeconds: 600, sellPercent: 100, takeProfitPct: 20, stopLossPct: 8, label: "Safe" },
    long: { sellDelaySeconds: 172800, sellPercent: 100, takeProfitPct: 75, stopLossPct: 20, label: "Long Term" }
  };
  const selected = presets[preset];
  if (!selected) {
    throw new Error("Choose Fast Scalp, Balanced, Moonbag, Safe, or Long Term.");
  }
  Object.assign(session.data, selected, {
    sellDelayMinutes: selected.sellDelaySeconds / 60,
    triggerSellPercent: 100,
    loopCount: 1,
    exitPreset: selected.label,
    allowRepeat: false
  });
}

function applyAutoSnipeExitPreset(session) {
  Object.assign(session.data, {
    sellDelaySeconds: AUTOSNIPE_SELL_DELAY_SECONDS,
    sellDelayMinutes: AUTOSNIPE_SELL_DELAY_SECONDS / 60,
    sellPercent: 100,
    triggerSellPercent: 100,
    takeProfitPct: AUTOSNIPE_TAKE_PROFIT_PCT,
    stopLossPct: AUTOSNIPE_STOP_LOSS_PCT,
    loopCount: 1,
    exitPreset: `AutoSnipe ${AUTOSNIPE_TAKE_PROFIT_PCT}%`,
    allowRepeat: false,
    slippageBps: AUTOSNIPE_SLIPPAGE_BPS
  });
}

function applyPumpSnipeExitPreset(session) {
  Object.assign(session.data, {
    sellDelaySeconds: PUMPSNIPE_SELL_DELAY_SECONDS,
    sellDelayMinutes: PUMPSNIPE_SELL_DELAY_SECONDS / 60,
    sellPercent: 100,
    triggerSellPercent: 100,
    takeProfitPct: PUMPSNIPE_TAKE_PROFIT_PCT,
    stopLossPct: PUMPSNIPE_STOP_LOSS_PCT,
    loopCount: 1,
    exitPreset: `PumpSnipe ${PUMPSNIPE_TAKE_PROFIT_PCT}%`,
    allowRepeat: false,
    slippageBps: PUMPSNIPE_SLIPPAGE_BPS
  });
}

function formatPumpSnipePresetDetails(data) {
  return [
    `Exit preset selected: ${data.exitPreset}`,
    "",
    `Sell timer fallback: ${formatDelay(data.sellDelaySeconds)} after buy`,
    `Take-profit: +${data.takeProfitPct}% -> sells 100% of the tracked bag`,
    `Stop-loss: -${data.stopLossPct}% -> sells 100% of the tracked bag`,
    `Default slippage: ${PUMPSNIPE_SLIPPAGE_BPS} bps`,
    "",
    "PumpSnipe focuses on very early launches, so fills can move fast. Start small until your RPC and Jupiter routes are landing cleanly."
  ].join("\n");
}

function applyAutoBundleDefaults(session) {
  Object.assign(session.data, {
    tradeMode: "bundle",
    autoBundle: true,
    planSource: "auto_bundle",
    sellDelaySeconds: AUTO_BUNDLE_SELL_DELAY_SECONDS,
    sellDelayMinutes: AUTO_BUNDLE_SELL_DELAY_SECONDS / 60,
    sellPercent: 100,
    triggerSellPercent: 100,
    takeProfitPct: AUTO_BUNDLE_TAKE_PROFIT_PCT,
    stopLossPct: AUTO_BUNDLE_STOP_LOSS_PCT,
    takeProfitMode: "single",
    takeProfitLadder: [],
    walletTakeProfitTargets: null,
    loopCount: 1,
    exitPreset: "Auto Bundle Default",
    allowRepeat: false
  });
}

async function handleAutoBundleExitMode(chatId, text, session) {
  const choice = text.trim().toLowerCase();
  if (choice === "default") {
    applyAutoBundleDefaults(session);
    session.step = "auto_bundle_slippage";
    await sendQuickSlippagePrompt(chatId, [
      "Default Auto Bundle exits selected.",
      "",
      `Take-profit: +${AUTO_BUNDLE_TAKE_PROFIT_PCT}% full exit`,
      `Stop-loss: -${AUTO_BUNDLE_STOP_LOSS_PCT}% full exit`,
      `Fallback timer: ${formatDelay(AUTO_BUNDLE_SELL_DELAY_SECONDS)}`,
      "",
      `Choose slippage, or type default for ${CONFIG.defaultSlippageBps} bps.`
    ].join("\n"));
    return;
  }

  if (choice === "custom") {
    session.data.takeProfitMode = "single";
    session.data.takeProfitLadder = [];
    session.data.walletTakeProfitTargets = null;
    session.step = "auto_bundle_take_profit";
    await sendQuickChoicePrompt(chatId, "Choose custom take-profit percent. Full exit sells 100% of each tracked bag.", [
      [{ text: "+40%", value: "40" }, { text: "+60%", value: "60" }],
      [{ text: "+100%", value: "100" }, { text: "+150%", value: "150" }]
    ]);
    return;
  }

  if (choice === "ladder") {
    session.data.takeProfitMode = "ladder";
    session.step = "auto_bundle_ladder_levels";
    await sendQuickChoicePrompt(chatId, [
      "Send profit levels for ladder exits.",
      "",
      "The bot splits the original tracked bag across the levels. With 4 levels, each trigger sells 25% of the original bag.",
      "",
      "Example: `40,70,100,150` sells 25% at +40%, 25% at +70%, 25% at +100%, and the last 25% at +150%."
    ].join("\n"), [
      [{ text: "40,70,100,150", value: "40,70,100,150" }],
      [{ text: "25,50,75,100", value: "25,50,75,100" }],
      [{ text: "60,90,120,150", value: "60,90,120,150" }]
    ]);
    return;
  }

  if (choice === "wallets") {
    session.data.takeProfitMode = "wallets";
    session.step = "auto_bundle_wallet_targets";
    await sendQuickChoicePrompt(chatId, [
      "Set take-profit by wallet.",
      "",
      "Send one percent per selected wallet in the same order. Example for 3 wallets: `40,70,100`.",
      "",
      "Or use a spread button to auto-fill targets from the first selected wallet to the last.",
      "",
      await selectedWalletTargetOrderText(session.userId, session.data.walletIndexes)
    ].join("\n"), [
      [{ text: "Spread 40-70%", value: "spread:40:70" }],
      [{ text: "Spread 60-120%", value: "spread:60:120" }],
      [{ text: "All +60%", value: "all:60" }]
    ]);
    return;
  }

  throw new Error("Choose Default, Custom Full Exit, 25% Ladder, or By Wallet Targets.");
}

function recommendedSniperExitPreset(score, settings) {
  const mode = settings?.mode || "safe";
  if (mode === "fast") return "fast";
  if (mode === "moonshot") return "moonbag";
  if (mode === "long") return "long";
  if (mode === "safe" || score?.rugRisk <= 35 && score?.exitRisk <= 40) return "safe";
  if (score?.score >= 88 && score?.rugRisk <= 45) return "moonbag";
  if (score?.score >= 74) return "balanced";
  return "fast";
}

function formatSniperPresetDetails(data) {
  return [
    `Exit preset selected: ${data.exitPreset}`,
    "",
    `Sell timer: ${formatDelay(data.sellDelaySeconds)} after buy`,
    `Timer sell: ${data.sellPercent}%`,
    `Take-profit: +${data.takeProfitPct}% -> sells 100% of the tracked bag`,
    `Stop-loss: -${data.stopLossPct}% -> sells 100% of the tracked bag`,
    "",
    sniperPresetExplanation(data.exitPreset),
    "",
    "Use this preset, customize take-profit/stop-loss, or go back and choose another preset."
  ].join("\n");
}

function sniperPresetExplanation(label) {
  const normalized = String(label || "").toLowerCase();
  if (normalized.includes("fast")) {
    return "Fast Scalp is built for quick flips: exit fast, take smaller wins, and cut early if it fades.";
  }
  if (normalized.includes("balanced")) {
    return "Balanced gives the trade more time while still taking most of the position off on strength.";
  }
  if (normalized.includes("moonbag")) {
    return "Moonbag takes profit on a bigger move while leaving more room for upside and volatility.";
  }
  if (normalized.includes("safe")) {
    return "Safe is strict: smaller profit target, tighter stop, and full exit to protect capital.";
  }
  if (normalized.includes("long")) {
    return "Long Term gives stronger setups up to 2 days to develop, while still using take-profit and stop-loss exits.";
  }
  if (normalized.includes("autosnipe")) {
    return "AutoSnipe is tuned for faster low-cap scalps with a realistic profit target and tight stop.";
  }
  return "This preset controls timer exit, take-profit, stop-loss, and sell percent.";
}

async function tokenImageDataUrl(imageUrl) {
  if (!/^https?:\/\//i.test(String(imageUrl || ""))) return null;

  try {
    const response = await fetch(imageUrl, {
      headers: { "User-Agent": "solana-telegram-wallet-ops-bot" },
      signal: AbortSignal.timeout(7000)
    });
    if (!response.ok) return null;
    const source = Buffer.from(await response.arrayBuffer());
    const png = await sharp(source, { animated: false }).resize(430, 430, { fit: "cover" }).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

function copyTradeText() {
  return withBrandFooter([
    "Copy Trade",
    "",
    "Safe copy-trade setup is planned as a separate wallet-watcher flow:",
    "- Choose a public wallet to watch.",
    "- Pick your own bot wallets.",
    "- Set max SOL per copied buy.",
    "- Set take-profit and stop-loss.",
    "",
    "For now, use Volume or Bundle tools for user-confirmed trades."
  ].join("\n"));
}

async function showBackupMenu(chatId, messageId = null) {
  await sendOrEditMessage(chatId, messageId, withBrandFooter("Backup and recovery tools:"), {
    inline_keyboard: [
      [{ text: "Export Backup", callback_data: "export_backup" }],
      [{ text: "Restore Backup", callback_data: "restore_backup" }],
      [{ text: "Rescue Backup Keys", callback_data: "rescue_backup_keys" }],
      [{ text: "Emergency Key Export", callback_data: "export_private_keys" }],
      [{ text: "Remove Wallets", callback_data: "delete_wallets" }],
      [{ text: "Main Menu", callback_data: "main_menu" }]
    ]
  });
}

async function showHowToMenu(chatId, messageId = null) {
  await sendOrEditMessage(chatId, messageId, withBrandFooter([
      "How To Use This Bot",
      "",
      "Tap a section below to learn that part of the bot. Start with Wallet, Backup, and Trade if this is your first time.",
      "",
      "Basic flow:",
      "1. Create or import a wallet.",
      "2. Save the automatic backup file.",
      "3. Fund the wallet with enough SOL for buys plus network fees.",
      "4. Trade, track positions, then withdraw when ready."
    ].join("\n")), { inline_keyboard: howToMenuKeyboard() });
}

async function showHowToPage(chatId, topic, messageId = null) {
  if (topic === "menu") {
    await showHowToMenu(chatId, messageId);
    return;
  }

  const page = howToPage(topic);
  if (!page) {
    await showHowToMenu(chatId, messageId);
    return;
  }

  await sendOrEditMessage(chatId, messageId, withBrandFooter(page.text), {
    inline_keyboard: howToPageKeyboard(page.openAction)
  });
}

function howToMenuKeyboard() {
  return [
    [{ text: "💱 Trade", callback_data: "howto_trade" }],
    [{ text: "🎯 OgreSniper", callback_data: "howto_sniper" }],
    [{ text: "💳 Wallet", callback_data: "howto_wallet" }, { text: "🧲 Bundle", callback_data: "howto_bundle" }],
    [{ text: "📊📈 Volume", callback_data: "howto_volume" }, { text: "🔍 Check Balances", callback_data: "howto_balances" }],
    [{ text: "💾 Backup / Restore", callback_data: "howto_backup" }, { text: "🏦 Withdrawal", callback_data: "howto_withdrawal" }],
    [{ text: "✅ Success Checklist", callback_data: "howto_success" }],
    [{ text: "Open Main Menu", callback_data: "main_menu" }]
  ];
}

function howToPageKeyboard(openAction) {
  const rows = [];
  if (openAction) {
    rows.push([{ text: "Open This Menu", callback_data: openAction }]);
  }
  rows.push(
    [{ text: "Back to How To", callback_data: "howto_menu" }],
    [{ text: "Main Menu", callback_data: "main_menu" }]
  );
  return rows;
}

function howToPage(topic) {
  const pages = {
    trade: {
      openAction: "trade_menu",
      text: [
        "How To Use: Trade",
        "",
        "Use Trade when you only want to trade one wallet at a time.",
        "",
        "Buttons inside Trade:",
        "- Buy: choose one wallet, paste the token mint, then tap a quick amount like Buy 0.10 SOL, Buy 0.50 SOL, Buy 1 SOL, Use Max, or Buy X SOL. With a fixed amount, you can add take-profit / stop-loss before confirming.",
        "- Sell: choose one wallet, paste the token mint, then tap Sell 25%, Sell 50%, Sell 100%, or Sell X %.",
        "- Sell All Tokens: choose one wallet, multiple wallets, all, or group: name. The bot sells every token with a Jupiter route into SOL, then lets you keep SOL in those wallets or send it to one destination.",
        "- Auto Sell: buys now, then sells later by timer, take-profit, or stop-loss.",
        "- DCA Buy: splits one total SOL amount into smaller buys over time.",
        "- DCA Sell: captures the wallet's current token balance, then sells your chosen percent in smaller slices.",
        "- Positions: shows only coins your managed wallets still hold, with estimated value when available and Dexscreener links.",
        "- Wallets: shows your wallet addresses as tap-to-copy address text.",
        "",
        "Important settings:",
        `- Safety reserve: the bot keeps about ${CONFIG.buyReserveSol} SOL per wallet for fees and token account creation.`,
        "- Slippage: default is usually fine. Raise it only if a token is moving fast or quotes fail from price movement.",
        "- Use Max: spends available SOL minus the safety reserve.",
        "- Confirm screen: always read token mint, wallet, amount, fee, and slippage before tapping Confirm.",
        "- Safety check: buys block active mint/freeze authority and require a Jupiter sell route back to SOL.",
        "",
        "Best first trade:",
        "Use a small amount, confirm the token on Dexscreener, then try a sell before using larger size."
      ].join("\n")
    },
    sniper: {
      openAction: "sniper_menu",
      text: [
        "How To Use: OgreSniper",
        "",
        "OgreSniper is for finding highest-scored early plays, choosing a setup quickly, and setting up a buy with automatic exits.",
        "",
        "Buttons inside OgreSniper:",
        `- Auto: opens AutoSnipe and PumpSnipe.`,
        `- AutoSnipe: fresh-scans, picks one high-conviction scalp setup, then after wallet and amount it fills +${AUTOSNIPE_TAKE_PROFIT_PCT}% take-profit, -${AUTOSNIPE_STOP_LOSS_PCT}% stop-loss, ${AUTOSNIPE_SLIPPAGE_BPS} bps slippage, and a ${formatDelay(AUTOSNIPE_SELL_DELAY_SECONDS)} timer fallback.`,
        `- PumpSnipe: focuses on very early pump-style launches and uses +${PUMPSNIPE_TAKE_PROFIT_PCT}% take-profit, -${PUMPSNIPE_STOP_LOSS_PCT}% stop-loss, ${PUMPSNIPE_SLIPPAGE_BPS} bps default slippage, and a ${formatDelay(PUMPSNIPE_SELL_DELAY_SECONDS)} fallback. After amount, tap Use Default or Customize.`,
        "- Scan Early Plays: checks latest Solana token profiles and shows the top ranked picks. Each pick has a Snipe button, Dex chart link in the text, and tap-to-copy CA.",
        "- Modes: choose Safe Scan, Smart Money Scan, Fast Scalp Scan, Low Cap Scan, Meme Scan, or Long Term. Tapping a mode saves that mode and immediately scans that category.",
        "",
        "Auto flow:",
        "Tap Auto, choose AutoSnipe or PumpSnipe, let it scan, choose wallet(s), choose SOL amount, then Confirm. PumpSnipe rotates a wider early-launch pool so it can surface new pump-style options more often.",
        "",
        "Fast scan flow:",
        "Tap Scan Early Plays, open the Dex chart link in the text if you want to inspect it, then tap Snipe #1 through #6. Pick All Wallets, a quick wallet button, or Custom / Group. Pick 0.05, 0.10, 0.50, 1 SOL, or Buy X SOL. OgreSniper then selects the best matching exit preset for the mode and score.",
        "Tap Refresh Scan to rotate through more qualified picks. The bot keeps the highest-score pick anchored, then rotates the other slots from a wider scored pool so you see fresh options more often. It now filters harder against hard dumps, sell pressure, thin liquidity, and weak liquidity-to-market-cap setups.",
        "",
        "Mode scan flow:",
        "Tap Modes, pick the category you want, then choose from the ranked list. The rest is the same: Snipe button, wallet, amount, profit/loss preset, optional custom TP/SL, slippage, Confirm.",
        "",
        "Modes explained:",
        "- Safe Mode: strict score and risk limits. Best first mode.",
        "- Smart Money Only: stricter score requirement and stronger momentum quality.",
        "- Fast Scalps: allows more speed-focused entries and pairs well with the Fast Scalp exit.",
        "- Low Cap Moonshots: focuses on lower market-cap picks under $30K when available, with higher risk.",
        "- Meme Momentum: gives extra weight to current meme-style names/meta.",
        "- Long Term: looks for better day-or-two setups and uses a 2-day timer by default.",
        "",
        "Scoring explained:",
        "- Entry Score estimates metadata quality, liquidity, 5m/1h volume, buy pressure, price momentum, and narrative fit.",
        "- Setup labels show what kind of quick-trade idea it is: Breakout scalp, Uptrend scalp, Cool-off bounce, or Volume building.",
        "- Rug Risk is a heuristic warning based on weak metadata, weak liquidity, sell pressure, dumping, and bad naming patterns.",
        "- Exit Risk warns when momentum is weak, sellers are leading, or the launch looks thin.",
        "- Manipulation Score warns when liquidity is thin, the pair is very new, or the move/market cap looks easy to push around.",
        "- Smart Money Proxy is a quality proxy from available signals, not true wallet tracking yet.",
        "",
        "Exit presets:",
        "- Fast Scalp: sells 100% after 3 minutes, or earlier at +35% take-profit / -10% stop-loss.",
        "- Balanced: timer sells 80% after 15 minutes. Take-profit or stop-loss sells 100% of the tracked bag.",
        "- Moonbag: timer sells 60% after 30 minutes. Take-profit or stop-loss sells 100% of the tracked bag.",
        "- Safe: sells 100% after 10 minutes, or earlier at +20% take-profit / -8% stop-loss.",
        "- Long Term: sells 100% after 2 days, or earlier at +75% take-profit / -20% stop-loss.",
        "",
        "Custom exits:",
        "After amount selection, OgreSniper shows the recommended preset. Tap Use Preset, Customize TP/SL, or Back. Customize TP/SL changes the take-profit and stop-loss percentages. TP/SL exits are always full exits on the tracked bag.",
        "",
        "Execution:",
        "OgreSniper uses the same timed-plan engine as Volume. It buys after you confirm, then watches for the selected timer, take-profit, or stop-loss exit.",
        `Fast launches can move before the first transaction lands, so OgreSniper's default slippage is ${CONFIG.sniperDefaultSlippageBps} bps and swaps can retry with a fresh Jupiter order on retryable quote/execution errors. Use 300 bps, default 400 bps, or 500 bps for normal use; higher custom slippage can create a worse fill.`,
        "",
        "Manual CA trades:",
        "If you already know the token you want, use Trade for one wallet or Bundle for multiple wallets. OgreSniper is kept focused on bot-researched picks.",
        "",
        "Best practice:",
        "Start tiny, avoid low-score plays, and use Safe Mode until your RPC/Jupiter setup is reliable."
      ].join("\n")
    },
    wallet: {
      openAction: "wallet_menu",
      text: [
        "How To Use: Wallet",
        "",
        "The Wallet menu controls the wallets saved inside the bot for your Telegram account.",
        "",
        "Buttons inside Wallet:",
        "- Create Wallet Set: enter a group label, then a count from 1 to 20. Example label: ogretest. The bot creates ogretest 1, ogretest 2, etc.",
        "- Import Wallet: enter a label, then paste a private key from Phantom/Solflare. Accepted formats are base58 secret key, JSON byte array, or comma-separated 64-byte array.",
        "- My Wallets: lists wallet labels and addresses. Tap or long-press the address text to copy it.",
        "- Check Balances: scans your bot wallets for SOL, token holdings, current positions, and quick refresh/position buttons.",
        "- Positions Overview: shows current token holdings only, estimated value when Jupiter can quote, and Dexscreener links.",
        "- PnL / Results: shows every bot-recorded buy and sell, newest first and oldest last. Latest token card buttons appear first; use Card by CA or `/pnlcard CA` for older tokens.",
        "- Close Empty Token Accounts: reclaims rent from empty SPL token accounts when possible.",
        "- Remove Wallets: deletes selected saved wallet records from the bot after two confirmations. It sends an encrypted backup before the final confirm and does not move funds on-chain.",
        "",
        "Wallet privacy and safety:",
        "- Each Telegram user only sees their own wallets.",
        "- Private keys are encrypted at rest with APP_SECRET.",
        "- Never send seed phrases. The bot does not need them.",
        "- Delete Telegram messages that contain raw private keys after importing.",
        "",
        "After creating/importing wallets:",
        "The bot sends an automatic encrypted backup file. Keep that file private."
      ].join("\n")
    },
    bundle: {
      openAction: "bundle_menu",
      text: [
        "How To Use: Bundle",
        "",
        "Use Bundle when you want the same action across multiple wallets.",
        "",
        "Buttons inside Bundle:",
        `- Auto Bundle: paste CA, choose wallets/group, choose SOL per wallet, then use the default -${AUTO_BUNDLE_STOP_LOSS_PCT}% stop-loss / +${AUTO_BUNDLE_TAKE_PROFIT_PCT}% take-profit or customize exits before confirming.`,
        "- Auto Bundle 25% Ladder: set multiple profit levels like `40,70,100,150`; each level sells a chunk of the original tracked bag.",
        "- Auto Bundle By Wallet Targets: set different take-profit targets per wallet, such as wallet 1 at +40% and wallet 2 at +70%. Stop-loss still exits the remaining bag.",
        "- Bundle Buy: paste token mint, choose wallets, choose fixed SOL per wallet, then choose normal buy or add take-profit / stop-loss before confirming.",
        "- Bundle Sell: paste token mint, choose wallets, choose percent to sell, choose slippage, confirm.",
        "- DCA Buy: split a total SOL amount per selected wallet into scheduled smaller buys.",
        "- DCA Sell: split a selected percent per wallet into scheduled smaller sells.",
        "- Copy Trade: info/setup placeholder for a future wallet watcher.",
        "",
        "Use the main Volume button for auto-sell, take-profit, stop-loss, and Repeat cycles.",
        "",
        "Wallet selection:",
        "- Type `all` to use every wallet you own.",
        "- Type numbers like `1,2,5` to pick specific wallets.",
        "- Type `group: ogretest` to use wallets whose labels match that group.",
        "",
        "Funding rule:",
        `Each wallet needs at least buy amount + ${CONFIG.buyReserveSol} SOL reserve. Example: 10 wallets buying 0.10 SOL each need about 1.10 SOL spread across those wallets.`,
        "",
        "Speed and reliability:",
        "- The bot queues RPC/Jupiter calls to avoid 429 rate-limit errors.",
        "- Free/public RPC is not reliable for big batches.",
        "- If you get rate limits, lower batch size or use a private RPC."
      ].join("\n")
    },
    volume: {
      openAction: "timed_trade_plans",
      text: [
        "How To Use: Volume",
        "",
        "The Volume button is a timed trade plan for managing your own position. It is not a wash-trading or fake-volume tool.",
        "",
        "What it does:",
        "- Buys a token now from selected wallet(s).",
        "- Watches the position about once per minute while the bot is awake.",
        "- Sells when the timer, take-profit, or stop-loss triggers.",
        "- If Render sleeps, it catches up when the service wakes and the saved data still exists.",
        "",
        "Settings explained:",
        "- Token mint: the coin you want to trade.",
        "- Wallets: numbers, all, or group: name.",
        "- Buy amount: fixed SOL amount per wallet.",
        "- Sell timer: choose 5 seconds for a quick exit, or set minutes like 1, 5, 15, 30, or 60.",
        "- Sell percent: how much of the token balance to sell when triggered.",
        "- Take-profit: sell early if estimated value rises by this percent. Use 0/off to disable.",
        "- Stop-loss: sell early if estimated value falls by this percent. Use 0/off to disable.",
        "- Repeat cycles: total buy/sell cycles. 1 is normal; 5 or 10 repeats the cycle multiple times.",
        "- Slippage: tolerance for the swap route.",
        "",
        "Good setup example:",
        "Quick exit example: buy 0.05 SOL, sell after 5 seconds, sell 100%, take-profit off, stop-loss off, Repeat 1x, default slippage.",
        "Repeat example: buy 0.05 SOL, sell after 5 seconds, sell 100%, take-profit off, stop-loss off, Repeat 5x, default slippage.",
        "Normal example: buy 0.10 SOL, sell after 30 minutes, sell 100%, take-profit 25%, stop-loss 10%, default slippage."
      ].join("\n")
    },
    balances: {
      openAction: "check_balances",
      text: [
        "How To Use: Check Balances",
        "",
        "Check Balances scans your bot wallets and shows:",
        "- SOL balance.",
        "- Token accounts with non-zero balances.",
        "- Partial warnings if an RPC call is rate-limited.",
        "",
        "How to use it:",
        "Tap Check Balances from the main menu. The bot responds immediately, checks wallets with controlled concurrency, and reuses very fresh balance data for quick refreshes.",
        "",
        "What errors mean:",
        "- 429 Too Many Requests: your RPC is rate-limiting. Wait, refresh later, or use a better RPC.",
        "- Tokens unavailable: token account lookup failed, usually from RPC limits.",
        "- Tokens none: that wallet has no visible SPL token balances.",
        "",
        "For a coin-specific view before selling:",
        "Use Sell or Bundle Sell, paste the token mint, then select wallet(s). The bot shows selected token balances before asking sell percent."
      ].join("\n")
    },
    backup: {
      openAction: "backup_menu",
      text: [
        "How To Use: Backup / Restore",
        "",
        "This is one of the most important menus. Backups protect users if Render restarts, redeploys, or free storage resets.",
        "",
        "Buttons inside Backup / Restore:",
        "- Export Backup: sends an encrypted .txt backup file for your bot wallets.",
        "- Restore Backup: loads wallets back into the bot from an encrypted backup file or pasted backup text.",
        "- Rescue Backup Keys: reads a backup and sends a private-key recovery file without needing wallets restored first.",
        "- Emergency Key Export: sends raw private keys for wallets already inside the bot after exact confirmation.",
        "- Remove Wallets: sends an encrypted backup, asks for a second confirmation, then removes selected wallet records from the bot without moving funds.",
        "",
        "Automatic backups:",
        "The bot automatically sends a backup file after wallet creation, wallet import, and wallet restore. The filename includes the group label, user ID, and date.",
        "",
        "How to restore by uploading the saved file:",
        "1. Open the bot in DM.",
        "2. Tap Backup / Restore.",
        "3. Tap Restore Backup.",
        "4. In Telegram, tap the paperclip/attachment button.",
        "5. Choose File or Document, not photo.",
        "6. Select the wallet-backup-... .txt file the bot sent you.",
        "7. Send it to the bot.",
        "8. The bot imports any wallets that are not already saved.",
        "",
        "If file upload fails:",
        "Open the .txt file, copy all text, tap Restore Backup, and paste it into chat. The bot can also scan pasted text that contains Base58 secret key or JSON secret key lines.",
        "",
        "APP_SECRET warning:",
        "Encrypted backups only restore when Render uses the same APP_SECRET that created them. Never change APP_SECRET after wallets exist.",
        "If a wallet is removed by mistake, Restore Backup can add it back as long as you use the backup file and the same APP_SECRET.",
        "",
        "Keep backups private. Anyone with raw private keys can drain funds."
      ].join("\n")
    },
    withdrawal: {
      openAction: "withdrawal_menu",
      text: [
        "How To Use: Withdrawal",
        "",
        "Use Withdrawal when you want to move SOL or tokens out of bot-managed wallets.",
        "",
        "Buttons inside Withdrawal:",
        "- Withdraw SOL: sends the maximum safe SOL from selected wallets to your destination wallet. It estimates the network fee and sends balance minus fee to avoid rent errors.",
        "- Sell All Tokens to SOL: sells every non-zero SPL token in selected wallets through Jupiter. After the sells, choose whether SOL stays in each wallet or gets sent to one destination wallet.",
        "- Sweep Tokens: sends SPL tokens from selected wallets to your destination wallet. You can sweep one mint or all tokens found.",
        "- Fund Wallets: sends SOL from one managed source wallet to selected managed target wallets.",
        "",
        "Withdraw SOL steps:",
        "1. Tap Withdrawal.",
        "2. Tap Withdraw SOL.",
        "3. Paste the destination wallet address.",
        "4. Choose wallet numbers or type all.",
    "5. Tap Confirm.",
        "",
        "Sweep Tokens steps:",
        "1. Paste destination wallet.",
        "2. Choose source wallet numbers or all.",
        "3. Paste one token mint, or type all.",
        "4. Tap Confirm.",
        "",
        "Sell All Tokens to SOL steps:",
        "1. Tap Sell All Tokens to SOL.",
        "2. Choose wallet numbers, all, or group: name.",
        "3. Choose Keep in wallets or Send to one wallet.",
        "4. If sending to one wallet, paste the destination.",
        "5. Choose slippage and Confirm.",
        "",
        "Funding wallets:",
        "Use Fund Wallets when one bot wallet has SOL and you want to distribute a fixed amount to other bot wallets.",
        "",
        "If a withdraw fails:",
        "Check that the destination address is correct, the wallet has enough SOL for network fees, and your RPC is not rate-limiting."
      ].join("\n")
    },
    success: {
      openAction: null,
      text: [
        "Success Checklist",
        "",
        "Before trading:",
        "- Save your APP_SECRET and never change it.",
        "- Keep every automatic backup file private.",
        "- Use a real Solana RPC for smoother buys/sells. Public RPC can rate-limit.",
        "- Use TRADING_SPEED_PRESET=balanced for normal use, safe if you see 429s, or fast only with a private RPC.",
        "- Add a Jupiter API key for swap routes.",
        `- Fund each buy wallet with buy amount + about ${CONFIG.buyReserveSol} SOL reserve.`,
        "- Test with a small buy and sell first.",
        "",
        "When buying:",
        "- Verify the token mint.",
        "- Open the Dexscreener link and check liquidity.",
        "- Use quick buttons for common sizes or Buy X SOL for custom.",
        "- Read the confirm screen before tapping Confirm.",
        "",
        "When selling:",
        "- Use Positions Overview or Check Balances first.",
        "- If token balance shows 0, that wallet cannot sell that token.",
        "- Use Sell 25%, 50%, 100%, or Sell X %.",
        "",
        "When something fails:",
        "- Quote failed usually means no route, low liquidity, slippage too low, not enough SOL, or API/RPC limits.",
        "- 429 means rate limit. Wait or upgrade RPC/Jupiter limits.",
        "- If the bot resets, use Backup / Restore with the .txt backup file."
      ].join("\n")
    }
  };

  return pages[topic] || null;
}

function timedTradePlanIntroText() {
  return withBrandFooter([
    "Timed Trade Plans",
    "",
    "What it does:",
    "- Buys a token from selected wallets now.",
    "- Sells later after your chosen timer, including a 5-second quick exit option.",
    "- Can sell early if take-profit or stop-loss triggers.",
    "- Can loop the buy/sell cycle 1, 5, 10, or a custom count up to 10.",
    "- Works by wallet numbers, `all`, or `group: group name`.",
    "",
    "This is for managing your own position. It is not a volume or wash-trading tool.",
    "",
    "Send the token mint address to start."
  ].join("\n"));
}

function dcaIntroText(side) {
  const label = side === "buy" ? "DCA Buy" : "DCA Sell";
  const action = side === "buy"
    ? "splits one total SOL amount into smaller buys over time."
    : "splits one selected token amount into smaller sells over time.";
  return withBrandFooter([
    label,
    "",
    `This ${action}`,
    "You choose the token, wallets, number of orders, interval, and slippage.",
    "",
    "Send the token mint address to start."
  ].join("\n"));
}

function withBrandFooter(text) {
  return `${text}\n\n${BRAND_FOOTER}`;
}

async function walletPrompt(userId, prefix) {
  const store = await readWalletStore();
  const wallets = walletsForOwner(store, userId);
  const lines = wallets.map((wallet, index) => `${index + 1}. ${wallet.label} - ${wallet.publicKey}`);
  return `${prefix}\n\n${lines.join("\n") || "You do not have any managed wallets yet."}`;
}

async function showMenu(chatId, userId, messageId = null) {
  const state = await readState();
  const menu = isAdmin(userId) ? [...PUBLIC_MENU, ...ADMIN_MENU] : PUBLIC_MENU;
  await sendOrEditMessage(chatId, messageId, withBrandFooter(`${state.paused ? "Status: emergency stop active.\n\n" : ""}Choose a wallet operation:`), {
    inline_keyboard: menu
  });
}

async function sendQuickAmountPrompt(chatId, text, options = {}) {
  const lastRow = options.allowMax
    ? [{ text: "Use Max", callback_data: "quick:max" }, { text: "Buy X SOL", callback_data: "quick:custom" }]
    : [{ text: "Buy X SOL", callback_data: "quick:custom" }];

  await sendFlowPrompt(chatId, text, {
    inline_keyboard: [
      [{ text: "Buy 0.10 SOL", callback_data: "quick:0.10" }, { text: "Buy 0.50 SOL", callback_data: "quick:0.50" }, { text: "Buy 1 SOL", callback_data: "quick:1" }],
      [{ text: "Buy 0.05 SOL", callback_data: "quick:0.05" }],
      lastRow
    ]
  });
}

async function sendQuickPercentPrompt(chatId, text) {
  await sendFlowPrompt(chatId, text, {
    inline_keyboard: [
      [{ text: "Sell 25%", callback_data: "quick:25" }, { text: "Sell 50%", callback_data: "quick:50" }, { text: "Sell 100%", callback_data: "quick:100" }],
      [{ text: "Sell X %", callback_data: "quick:custom" }]
    ]
  });
}

async function sendQuickSlippagePrompt(chatId, text, options = {}) {
  const defaultBps = Number.isInteger(options.defaultBps) ? options.defaultBps : CONFIG.defaultSlippageBps;
  const inline_keyboard = [
    [{ text: `Default ${defaultBps} bps`, callback_data: "quick:default" }, { text: "300 bps", callback_data: "quick:300" }],
    [{ text: "500 bps", callback_data: "quick:500" }, { text: "Custom", callback_data: "quick:custom" }]
  ];

  await sendFlowPrompt(chatId, text, { inline_keyboard });
}

async function sendQuickChoicePrompt(chatId, text, rows, options = {}) {
  const includeCustom = options.includeCustom !== false;
  await sendFlowPrompt(chatId, text, {
    inline_keyboard: [
      ...rows.map((row) => row.map((button) => ({
        text: button.text,
        callback_data: `quick:${button.value}`
      }))),
      ...(includeCustom ? [[{ text: "Custom", callback_data: "quick:custom" }]] : [])
    ]
  });
}

async function sendConfirmPrompt(chatId, text) {
  const prompt = "Confirm or cancel.";
  const messageText = text.includes(BRAND_FOOTER)
    ? text.replace(`\n\n${BRAND_FOOTER}`, `\n\n${prompt}\n\n${BRAND_FOOTER}`)
    : `${text}\n\n${prompt}`;

  await sendFlowPrompt(chatId, messageText, {
    inline_keyboard: [
      [{ text: "Confirm", callback_data: "quick:yes" }, { text: "Cancel / Back", callback_data: "quick:cancel" }]
    ]
  }, { brand: false });
}

async function sendFlowPrompt(chatId, text, replyMarkup = null, options = {}) {
  const session = sessions.get(chatId);
  const messageText = options.brand === false ? text : withBrandFooter(text);
  const result = await sendOrEditMessage(chatId, session?.activePromptMessageId, messageText, replyMarkup);
  if (session && result?.message_id) {
    session.activePromptMessageId = result.message_id;
  }
  return result;
}

async function sendTradeResult(chatId, text, withActions = false) {
  if (!withActions) {
    await say(chatId, text);
    return;
  }

  await telegram("sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [{ text: "Buy Again", callback_data: "trade_buy" }, { text: "Sell", callback_data: "trade_sell" }],
        [{ text: "Positions", callback_data: "positions_overview" }, { text: "Trade Menu", callback_data: "trade_menu" }]
      ]
    }
  });
}

async function say(chatId, text) {
  const chunks = chunkText(text, 3900);
  for (const chunk of chunks) {
    await telegram("sendMessage", {
      chat_id: chatId,
      text: chunk,
      disable_web_page_preview: true
    });
  }
}

async function sendOrEditMessage(chatId, messageId, text, replyMarkup = null) {
  if (messageId) {
    try {
      const result = await telegram("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text,
        disable_web_page_preview: true,
        reply_markup: replyMarkup || undefined
      });
      return result;
    } catch (error) {
      if (/message is not modified/i.test(formatError(error))) {
        return null;
      }
      // Fall through to a new message if Telegram cannot edit this message.
    }
  }

  return telegram("sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
    reply_markup: replyMarkup || undefined
  });
}

async function sendLongMenuText(chatId, messageId, text, replyMarkup = null) {
  if (text.length <= 3900) {
    await sendOrEditMessage(chatId, messageId, text, replyMarkup);
    return;
  }

  const chunks = chunkText(text, 3300);
  for (const [index, chunk] of chunks.entries()) {
    const labeled = `Part ${index + 1}/${chunks.length}\n\n${chunk}`;
    if (index === 0) {
      await sendOrEditMessage(chatId, messageId, labeled, replyMarkup);
    } else {
      await telegram("sendMessage", {
        chat_id: chatId,
        text: labeled,
        disable_web_page_preview: true
      });
    }
  }
}

async function sendOrEditHtmlMessage(chatId, messageId, text, replyMarkup = null) {
  if (messageId) {
    try {
      const result = await telegram("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: replyMarkup || undefined
      });
      return result;
    } catch (error) {
      if (/message is not modified/i.test(formatError(error))) {
        return null;
      }
    }
  }

  return telegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: replyMarkup || undefined
  });
}

async function telegram(method, payload = {}) {
  return fetchJson(`https://api.telegram.org/bot${CONFIG.telegramToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).then((response) => {
    if (!response.ok) {
      throw new Error(response.description || `Telegram ${method} failed`);
    }
    return response.result;
  });
}

async function sendDocument(chatId, filename, text) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("document", new Blob([text], { type: "text/plain" }), filename);

  const response = await fetch(`https://api.telegram.org/bot${CONFIG.telegramToken}/sendDocument`, {
    method: "POST",
    body: form
  });
  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.description || "Telegram sendDocument failed");
  }

  return data.result;
}

async function sendPhoto(chatId, filename, buffer, caption = "", replyMarkup = null) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("photo", new Blob([buffer], { type: "image/png" }), filename);
  if (caption) form.append("caption", caption);
  if (replyMarkup) form.append("reply_markup", JSON.stringify(replyMarkup));

  const response = await fetch(`https://api.telegram.org/bot${CONFIG.telegramToken}/sendPhoto`, {
    method: "POST",
    body: form
  });
  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.description || "Telegram sendPhoto failed");
  }

  return data.result;
}

async function fetchTelegramFileText(fileId) {
  const file = await telegram("getFile", { file_id: fileId });
  const response = await fetch(`https://api.telegram.org/file/bot${CONFIG.telegramToken}/${file.file_path}`);
  if (!response.ok) {
    throw new Error(`Could not download backup file: HTTP ${response.status}`);
  }
  return response.text();
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text.slice(0, 300) };
    }
  }

  if (!response.ok) {
    const error = new Error(data.error || data.description || `HTTP ${response.status}`);
    error.status = response.status;
    error.retryAfter = response.headers.get("retry-after");
    throw error;
  }

  return data;
}

async function readWalletStore() {
  const store = await readJson(walletPath());
  if (!Array.isArray(store.wallets)) store.wallets = [];
  return store;
}

async function writeWalletStore(store) {
  await fs.writeFile(walletPath(), JSON.stringify(store, null, 2));
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function audit(action, details) {
  const auditLog = await readJson(auditPath());
  auditLog.entries.push({
    timestamp: new Date().toISOString(),
    action,
    details
  });
  await fs.writeFile(auditPath(), JSON.stringify(auditLog, null, 2));
}

async function readState() {
  return readJson(statePath());
}

async function readTradePlans() {
  const store = await readJson(tradePlansPath());
  if (!Array.isArray(store.plans)) store.plans = [];
  return store;
}

async function writeTradePlans(store) {
  await fs.writeFile(tradePlansPath(), JSON.stringify(store, null, 2));
}

async function readDcaPlans() {
  const store = await readJson(dcaPlansPath());
  if (!Array.isArray(store.plans)) store.plans = [];
  return store;
}

async function writeDcaPlans(store) {
  await fs.writeFile(dcaPlansPath(), JSON.stringify(store, null, 2));
}

async function readTradeHistory() {
  const store = await readJson(tradeHistoryPath());
  if (!Array.isArray(store.trades)) store.trades = [];
  return store;
}

async function recordTradeEvents(events) {
  if (!events.length) return;
  for (const event of events) {
    invalidateWalletReadCache(event.walletPublicKey);
  }
  const store = await readTradeHistory();
  store.trades.push(...events.map((event) => ({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...event
  })));
  await fs.writeFile(tradeHistoryPath(), JSON.stringify(store, null, 2));
}

async function readSniperSettings() {
  const store = await readJson(sniperSettingsPath());
  if (!store.users || typeof store.users !== "object") store.users = {};
  return store;
}

async function writeSniperSettings(store) {
  await fs.writeFile(sniperSettingsPath(), JSON.stringify(store, null, 2));
}

async function sniperSettingsForUser(userId) {
  const store = await readSniperSettings();
  const key = String(userId);
  const settings = {
    ...sniperModeDefaults("safe"),
    ...(store.users[key] || {})
  };
  return settings;
}

async function updateSniperMode(chatId, userId, mode, messageId = null) {
  const store = await readSniperSettings();
  const key = String(userId);
  store.users[key] = {
    ...sniperModeDefaults(mode),
    mode
  };
  await writeSniperSettings(store);
  await audit("sniper_mode_update", { chatId, userId, mode });
  await showSniperScan(chatId, userId, messageId, { modeSelected: true });
}

async function setPaused(paused) {
  const state = await readState();
  state.paused = paused;
  state.updatedAt = new Date().toISOString();
  await fs.writeFile(statePath(), JSON.stringify(state, null, 2));
}

function walletRecord(label, keypair, ownerId) {
  return {
    ownerId,
    label,
    publicKey: keypair.publicKey.toBase58(),
    secret: encryptSecret(Buffer.from(keypair.secretKey))
  };
}

function publicWallet(wallet) {
  return {
    label: wallet.label,
    publicKey: wallet.publicKey
  };
}

function encryptSecret(secret) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(CONFIG.appSecret, salt, 32);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(secret), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    version: 1,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64")
  };
}

function decryptWallet(wallet) {
  try {
    const secret = wallet.secret;
    const salt = Buffer.from(secret.salt, "base64");
    const iv = Buffer.from(secret.iv, "base64");
    const tag = Buffer.from(secret.tag, "base64");
    const data = Buffer.from(secret.data, "base64");
    const key = crypto.scryptSync(CONFIG.appSecret, salt, 32);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return Keypair.fromSecretKey(decrypted);
  } catch {
    throw new Error("Wallet key could not be decrypted. Use the exact same APP_SECRET that created the wallets/backups, then restore or export keys.");
  }
}

function keypairFromSecret(text) {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim()
    .replace(/^["']|["']$/g, "");

  if (!trimmed) {
    throw new Error("Private key is empty.");
  }

  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount >= 12 && /^[a-z\s]+$/i.test(trimmed)) {
    throw new Error("Seed phrases are not supported. Export the wallet private key/secret key instead.");
  }

  const arrayMatch = trimmed.match(/\[[\d,\s]+\]/);
  if (arrayMatch) {
    const parsed = JSON.parse(arrayMatch[0]);
    return keypairFromBytes(parsed, { allowSeed: true });
  }

  if (/^\d+(?:\s*,\s*\d+)+$/.test(trimmed)) {
    return keypairFromBytes(trimmed.split(",").map((value) => Number.parseInt(value.trim(), 10)), { allowSeed: true });
  }

  const compact = trimmed.replace(/\s+/g, "");

  try {
    return keypairFromBytes([...bs58.decode(compact)], { allowSeed: false });
  } catch {
    throw new Error([
      "Could not import that private key.",
      "Use a base58 private key or a JSON byte array like [12,34,...].",
      "Do not paste a public address, seed phrase, or text with extra labels."
    ].join(" "));
  }
}

function keypairFromBytes(bytes, options = {}) {
  if (!Array.isArray(bytes) || !bytes.every((value) => Number.isInteger(value) && value >= 0 && value <= 255)) {
    throw new Error("Secret key byte array must contain only numbers from 0 to 255.");
  }

  if (bytes.length === 64) {
    return Keypair.fromSecretKey(Uint8Array.from(bytes));
  }

  if (bytes.length === 32 && options.allowSeed) {
    return Keypair.fromSeed(Uint8Array.from(bytes));
  }

  if (bytes.length === 32) {
    throw new Error("That looks like a public address or 32-byte key. Paste the full 64-byte private/secret key instead.");
  }

  throw new Error(`Secret key must be 64 bytes, or a 32-byte seed. Received ${bytes.length} bytes.`);
}

function parseBackupPayload(text) {
  try {
    return decodeBackup(text);
  } catch (error) {
    const looseBackup = looseWalletBackupFromText(text);
    if (looseBackup.wallets.length > 0) {
      return looseBackup;
    }
    throw new Error(`Could not read that backup. Upload the .txt backup file the bot sent, paste the full backup text, or paste emergency key text with Base58 secret key / JSON secret key lines. ${formatError(error)}`);
  }
}

function looseWalletBackupFromText(text) {
  const normalized = normalizeBackupText(text).replace(/\r/g, "");
  const wallets = [];
  const seen = new Set();
  const blocks = splitLooseWalletBlocks(normalized);

  for (const [index, block] of blocks.entries()) {
    const label = looseWalletLabel(block, index);
    const declaredPublicKey = loosePublicKey(block);

    for (const secretText of looseSecretCandidates(block)) {
      try {
        tryAddLooseWallet(wallets, seen, secretText, label, declaredPublicKey);
      } catch {
        // Ignore loose-text false positives; a valid key candidate will be imported.
      }
    }
  }

  if (wallets.length === 0) {
    for (const secretText of looseSecretCandidates(normalized)) {
      try {
        tryAddLooseWallet(wallets, seen, secretText, "Recovered Wallet", null);
      } catch {
        // Ignore loose-text false positives; a valid key candidate will be imported.
      }
    }
  }

  return {
    version: "loose-text",
    createdAt: new Date().toISOString(),
    note: "Recovered from pasted key text",
    walletCount: wallets.length,
    wallets
  };
}

function splitLooseWalletBlocks(text) {
  const matches = [...text.matchAll(/(?:^|\n)\s*(Wallet\s+\d+\s*:[\s\S]*?)(?=\n\s*Wallet\s+\d+\s*:|$)/gi)]
    .map((match) => match[1].trim())
    .filter(Boolean);
  return matches.length ? matches : [text];
}

function looseWalletLabel(block, index) {
  const walletMatch = block.match(/Wallet\s+\d+\s*:\s*([^\n]+)/i);
  if (walletMatch?.[1]) return cleanLabel(walletMatch[1]);

  const labelMatch = block.match(/(?:Label|Name)\s*:\s*([^\n]+)/i);
  if (labelMatch?.[1]) return cleanLabel(labelMatch[1]);

  return `Recovered Wallet ${index + 1}`;
}

function loosePublicKey(block) {
  const match = block.match(/(?:Public\s*key|PublicKey|Address|Pubkey)\s*:\s*([1-9A-HJ-NP-Za-km-z]{32,64})/i);
  return match?.[1] || null;
}

function looseSecretCandidates(block) {
  const candidates = [];

  for (const regex of [
    /(?:Base58\s*secret\s*key|Base58SecretKey|Private\s*key|Secret\s*key)\s*:\s*([1-9A-HJ-NP-Za-km-z]{80,120})/gi,
    /(?:base58|privateKey|private_key|secretKey|secret_key)\s*["'=:\s]+([1-9A-HJ-NP-Za-km-z]{80,120})/gi
  ]) {
    for (const match of block.matchAll(regex)) {
      candidates.push(match[1]);
    }
  }

  for (const regex of [
    /(?:JSON\s*secret\s*key|Secret\s*key|secretKey|secret_key)\s*:\s*(\[[\d,\s]+\])/gi,
    /(\[(?:\s*\d+\s*,){31,}\s*\d+\s*\])/g
  ]) {
    for (const match of block.matchAll(regex)) {
      candidates.push(match[1]);
    }
  }

  return [...new Set(candidates)];
}

function tryAddLooseWallet(wallets, seen, secretText, label, declaredPublicKey) {
  const keypair = keypairFromSecret(secretText);
  const publicKey = keypair.publicKey.toBase58();

  if (declaredPublicKey && declaredPublicKey !== publicKey) {
    return;
  }

  if (seen.has(publicKey)) {
    return;
  }

  seen.add(publicKey);
  wallets.push({
    label,
    publicKey,
    secretKey: bs58.encode(keypair.secretKey)
  });
}

function backupWalletList(backup) {
  if (Array.isArray(backup)) return backup;

  for (const key of ["wallets", "managedWallets", "items", "accounts"]) {
    if (Array.isArray(backup?.[key])) return backup[key];
  }

  if (Array.isArray(backup?.data?.wallets)) return backup.data.wallets;

  throw new Error("Backup format is not valid. I could not find a wallets list in it.");
}

function walletRecordFromBackup(wallet, ownerId, index) {
  if (!wallet || typeof wallet !== "object") {
    throw new Error("Backup wallet entry is empty.");
  }

  const encryptedSecret = encryptedSecretFromBackup(wallet);
  if (encryptedSecret) {
    const keypair = decryptWallet({ secret: encryptedSecret });
    const publicKey = keypair.publicKey.toBase58();
    assertBackupPublicKey(wallet, publicKey);
    return {
      ownerId,
      label: cleanLabel(wallet.label || wallet.name || `Restored Wallet ${index + 1}`),
      publicKey,
      secret: encryptedSecret
    };
  }

  const keypair = keypairFromBackupWallet(wallet);
  const publicKey = keypair.publicKey.toBase58();
  assertBackupPublicKey(wallet, publicKey);
  return walletRecord(cleanLabel(wallet.label || wallet.name || `Restored Wallet ${index + 1}`), keypair, ownerId);
}

function encryptedSecretFromBackup(wallet) {
  const secret = wallet.secret || wallet.encryptedSecret || wallet.encrypted_secret;
  if (secret && typeof secret === "object" && !Array.isArray(secret) && secret.salt && secret.iv && secret.tag && secret.data) {
    return secret;
  }
  return null;
}

function keypairFromBackupWallet(wallet) {
  const candidates = [
    wallet.secretKey,
    wallet.secret_key,
    wallet.privateKey,
    wallet.private_key,
    wallet.base58SecretKey,
    wallet.base58_secret_key,
    wallet.base58,
    wallet.keypair,
    wallet.secret
  ];

  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) continue;
    if (Array.isArray(candidate)) {
      return keypairFromBytes(candidate, { allowSeed: true });
    }
    if (typeof candidate === "object") {
      for (const nestedKey of ["secretKey", "secret_key", "privateKey", "private_key"]) {
        if (candidate[nestedKey] !== undefined) {
          return keypairFromBackupWallet({ [nestedKey]: candidate[nestedKey] });
        }
      }
      continue;
    }
    if (typeof candidate === "string" && candidate.trim()) {
      return keypairFromSecret(candidate);
    }
  }

  throw new Error("No private key was found in this wallet entry.");
}

function assertBackupPublicKey(wallet, publicKey) {
  const declared = wallet.publicKey || wallet.pubkey || wallet.address || wallet.wallet || wallet.owner;
  if (declared && String(declared).trim() !== publicKey) {
    throw new Error(`Public key mismatch. Backup says ${declared}, but the private key opens ${publicKey}.`);
  }
}

function encodeBackup(value) {
  return Buffer.from(JSON.stringify(value), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBackup(text) {
  const normalized = normalizeBackupText(text);
  const jsonCandidate = extractJsonObject(normalized);

  if (jsonCandidate) {
    return JSON.parse(jsonCandidate);
  }

  const compact = normalized.replace(/[^A-Za-z0-9+/=_-]/g, "");
  if (!compact) {
    throw new Error("Backup is empty.");
  }

  const base64 = compact.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

function normalizeBackupText(text) {
  return String(text)
    .replace(/^\uFEFF/, "")
    .replace(/^\s*```(?:json|txt|text)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .replace(/^\s*Backup(?: file| text)?:\s*/i, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

function extractJsonObject(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return text.slice(start, end + 1);
}

function parseWalletIndex(text) {
  const index = Number.parseInt(text, 10);
  if (!Number.isInteger(index) || index < 1) {
    throw new Error("Wallet number must be a positive integer.");
  }
  return index;
}

async function parseWalletSelection(text, userId, options = {}) {
  const store = await readWalletStore();
  const wallets = walletsForOwner(store, userId);
  const exclude = new Set(options.exclude || []);
  let indexes;

  if (text.trim().toLowerCase() === "all") {
    indexes = wallets.map((_, index) => index + 1);
  } else {
    indexes = text
      .split(",")
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isInteger(value));
  }

  indexes = [...new Set(indexes)].filter((index) => !exclude.has(index));

  if (indexes.length === 0) {
    throw new Error("No wallets selected.");
  }

  for (const index of indexes) {
    getWalletAt(store, index, userId);
  }

  return indexes;
}

async function setSingleWalletSelection(session, text) {
  const index = parseWalletIndex(text);
  const store = await readWalletStore();
  const wallet = getWalletAt(store, index, session.userId);
  session.data.walletIndex = index;
  session.data.walletIndexes = [index];
  session.data.walletSelector = wallet.label;
  session.data.walletLabel = wallet.label;
  session.data.walletPublicKey = wallet.publicKey;
  return wallet;
}

async function parseWalletSelectionOrGroup(text, userId) {
  const trimmed = text.trim();
  const groupMatch = trimmed.match(/^group\s*:?\s*(.+)$/i);
  if (!groupMatch) {
    return parseWalletSelection(text, userId);
  }

  const group = groupMatch[1].trim().toLowerCase();
  if (!group) {
    throw new Error("Group name cannot be empty.");
  }

  const store = await readWalletStore();
  const wallets = walletsForOwner(store, userId);
  const indexes = wallets
    .map((wallet, index) => ({ wallet, index: index + 1 }))
    .filter(({ wallet }) => {
      const label = wallet.label.toLowerCase();
      return label === group || label.startsWith(`${group} `);
    })
    .map(({ index }) => index);

  if (indexes.length === 0) {
    throw new Error(`No wallets found for group "${groupMatch[1].trim()}".`);
  }

  return indexes;
}

async function selectedWalletTargetOrderText(userId, walletIndexes) {
  const store = await readWalletStore();
  return walletIndexes
    .map((walletIndex, orderIndex) => {
      const wallet = getWalletAt(store, walletIndex, userId);
      return `${orderIndex + 1}. Wallet ${walletIndex}: ${wallet.label}`;
    })
    .join("\n");
}

function walletTakeProfitForIndex(data, walletIndex) {
  if (data.takeProfitMode !== "wallets" || !data.walletTakeProfitTargets) {
    return null;
  }

  const value = Number(data.walletTakeProfitTargets[String(walletIndex)]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function getWalletAt(store, oneBasedIndex, userId) {
  const wallet = walletsForOwner(store, userId)[oneBasedIndex - 1];
  if (!wallet) {
    throw new Error(`Wallet ${oneBasedIndex} does not exist.`);
  }
  return wallet;
}

function walletsForOwner(store, userId) {
  return store.wallets.filter((wallet) => String(wallet.ownerId) === String(userId));
}

function parsePublicKey(text) {
  try {
    return new PublicKey(text.trim());
  } catch {
    throw new Error("Invalid Solana public key.");
  }
}

function parseCommandWithArgument(text, names) {
  const match = String(text || "").trim().match(/^\/([a-z0-9_]+)(?:@[a-z0-9_]+)?(?:\s+([\s\S]+))?$/i);
  if (!match) return null;
  const command = match[1].toLowerCase();
  if (!names.includes(command)) return null;
  return { command, argument: String(match[2] || "").trim() };
}

function parsePositiveNumber(text) {
  const value = Number.parseFloat(text);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Amount must be greater than zero.");
  }
  return value;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parsePercent(text) {
  const value = Number.parseInt(text, 10);
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    throw new Error("Percent must be from 1 to 100.");
  }
  return value;
}

function parseDelayMinutes(text) {
  const value = Number.parseInt(text, 10);
  if (!Number.isInteger(value) || value < 1 || value > 10_080) {
    throw new Error("Delay must be from 1 minute to 10080 minutes.");
  }
  return value;
}

function parseSellDelaySeconds(text) {
  const normalized = text.trim().toLowerCase();
  const secondsMatch = normalized.match(/^(\d+)\s*(s|sec|secs|second|seconds)$/);
  if (secondsMatch) {
    const seconds = Number.parseInt(secondsMatch[1], 10);
    if (!Number.isInteger(seconds) || seconds < 5 || seconds > 59) {
      throw new Error("Second-based auto-sell timers must be from 5 to 59 seconds.");
    }
    return seconds;
  }

  const minutes = parseDelayMinutes(normalized.replace(/\s*(m|min|mins|minute|minutes)$/i, ""));
  return minutes * 60;
}

function formatDelay(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value)) return "unknown";
  if (value < 60) return `${value} second(s)`;
  if (value >= 86_400 && value % 86_400 === 0) return `${value / 86_400} day(s)`;
  const minutes = value / 60;
  return Number.isInteger(minutes) ? `${minutes} minute(s)` : `${minutes.toFixed(2)} minute(s)`;
}

function parseDcaOrderCount(text) {
  const value = Number.parseInt(text, 10);
  if (!Number.isInteger(value) || value < 2 || value > 50) {
    throw new Error("DCA order count must be from 2 to 50.");
  }
  return value;
}

function parseLoopCount(text) {
  const value = Number.parseInt(text, 10);
  if (!Number.isInteger(value) || value < 1 || value > 10) {
    throw new Error("Repeat cycles must be from 1 to 10.");
  }
  return value;
}

function parseOptionalTriggerPercent(text) {
  const normalized = text.trim().toLowerCase();
  if (["0", "off", "none", "no", "disable", "disabled"].includes(normalized)) {
    return 0;
  }

  const value = Number.parseFloat(normalized.replace(/%$/, ""));
  if (!Number.isFinite(value) || value <= 0 || value > 10000) {
    throw new Error("Trigger percent must be 0/off, or a positive number up to 10000.");
  }
  return value;
}

function parseTakeProfitLadder(text) {
  const levels = parseNumberList(text);
  if (levels.length < 2 || levels.length > 8) {
    throw new Error("Ladder must have 2 to 8 profit levels. Example: 40,70,100,150.");
  }

  const sorted = [...levels].sort((a, b) => a - b);
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index] === sorted[index - 1]) {
      throw new Error("Ladder levels must be unique.");
    }
  }

  const baseChunk = Math.floor(100 / sorted.length);
  return sorted.map((pct, index) => ({
    pct,
    sellPercent: index === sorted.length - 1 ? 100 - (baseChunk * (sorted.length - 1)) : baseChunk
  }));
}

function parseWalletTakeProfitTargets(text, walletIndexes) {
  const normalized = text.trim().toLowerCase();
  const indexes = Array.isArray(walletIndexes) ? walletIndexes : [];
  if (indexes.length === 0) {
    throw new Error("No wallets selected.");
  }

  if (normalized.startsWith("spread:")) {
    const [, startText, endText] = normalized.split(":");
    const start = parsePositivePercentValue(startText);
    const end = parsePositivePercentValue(endText);
    const values = indexes.length === 1
      ? [start]
      : indexes.map((_, index) => start + ((end - start) * index) / (indexes.length - 1));
    return walletTargetMap(indexes, values);
  }

  if (normalized.startsWith("all:")) {
    const value = parsePositivePercentValue(normalized.split(":")[1]);
    return walletTargetMap(indexes, indexes.map(() => value));
  }

  const values = parseNumberList(text);
  if (values.length !== indexes.length) {
    throw new Error(`Send exactly ${indexes.length} take-profit value(s), one for each selected wallet.`);
  }
  return walletTargetMap(indexes, values);
}

function walletTargetMap(indexes, values) {
  return Object.fromEntries(indexes.map((walletIndex, index) => [
    String(walletIndex),
    Number(values[index].toFixed(2))
  ]));
}

function parseNumberList(text) {
  const values = String(text || "")
    .split(/[,\s]+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map(parsePositivePercentValue);
  if (values.length === 0) {
    throw new Error("Send one or more percent values.");
  }
  return values;
}

function parsePositivePercentValue(value) {
  const number = Number.parseFloat(String(value || "").replace(/%$/, ""));
  if (!Number.isFinite(number) || number <= 0 || number > 10000) {
    throw new Error("Percent values must be positive numbers up to 10000.");
  }
  return number;
}

function parseSlippage(text, defaultBps = CONFIG.defaultSlippageBps) {
  if (text.trim().toLowerCase() === "default") {
    return defaultBps;
  }

  const value = Number.parseInt(text, 10);
  if (!Number.isInteger(value) || value < 1 || value > 5000) {
    throw new Error("Slippage must be from 1 to 5000 bps.");
  }
  return value;
}

function cleanLabel(text) {
  const label = text.trim().replace(/\s+/g, " ").slice(0, 40);
  if (!label) throw new Error("Label cannot be empty.");
  return label;
}

function sanitizeFilenamePart(text) {
  return String(text || "wallets")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "wallets";
}

function solToLamports(sol) {
  return Math.round(sol * LAMPORTS_PER_SOL);
}

function calculateFeeLamports(amountLamports) {
  const feeLamports = (BigInt(amountLamports) * BigInt(CONFIG.bundleFeeBps)) / 10_000n;
  if (feeLamports > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Calculated fee is too large for this transaction.");
  }
  return Number(feeLamports);
}

function bigIntToSafeNumber(value, label) {
  if (value <= 0n) {
    throw new Error(`${label} rounded to zero.`);
  }
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${label} is too large.`);
  }
  return Number(value);
}

function recommendedBuyFundingLamports(amountLamports) {
  return amountLamports + CONFIG.buyReserveLamports;
}

function enrichBuyError(error, details) {
  const base = friendlyError(error);
  const debug = [
    `wallet SOL ${lamportsToSol(details.balance)}`,
    `requested ${lamportsToSol(details.amountLamports)}`,
    `swap ${lamportsToSol(details.swapLamports)}`,
    `fee ${lamportsToSol(details.feeLamports)}`,
    `reserve ${CONFIG.buyReserveSol}`,
    `needs about ${lamportsToSol(details.recommendedLamports)}`
  ].join(", ");
  return new Error(`Buy failed after funding check: ${base} (${debug}).`);
}

function lamportsToSol(lamports) {
  return (lamports / LAMPORTS_PER_SOL).toFixed(9).replace(/0+$/, "").replace(/\.$/, "");
}

function lamportsBigToSol(value) {
  const amount = BigInt(value);
  const sign = amount < 0n ? "-" : "";
  const absolute = amount < 0n ? -amount : amount;
  const whole = absolute / BigInt(LAMPORTS_PER_SOL);
  const fraction = (absolute % BigInt(LAMPORTS_PER_SOL)).toString().padStart(9, "0").replace(/0+$/, "");
  return `${sign}${whole.toString()}${fraction ? `.${fraction}` : ""}`;
}

function formatSignedLamports(value) {
  const amount = BigInt(value);
  return `${amount >= 0n ? "+" : "-"}${lamportsBigToSol(amount >= 0n ? amount : -amount)}`;
}

function formatPercentMove(delta, basis) {
  if (basis <= 0n) return "";
  const pct = (Number(delta) / Number(basis)) * 100;
  if (!Number.isFinite(pct)) return "";
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

function formatTokenAmount(value) {
  if (!Number.isFinite(value)) return "0";
  if (value === 0) return "0";
  if (Math.abs(value) >= 1_000_000) return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (Math.abs(value) >= 1) return value.toLocaleString("en-US", { maximumFractionDigits: 6 });
  return value.toPrecision(6).replace(/0+$/, "").replace(/\.$/, "");
}

function rawTokenAmountToUi(rawAmount, decimals) {
  const raw = BigInt(rawAmount);
  const precision = Number.isInteger(decimals) ? decimals : 0;
  if (precision <= 0) return raw.toString();

  const base = 10n ** BigInt(precision);
  const whole = raw / base;
  const fraction = (raw % base).toString().padStart(precision, "0").replace(/0+$/, "");
  return `${whole.toString()}${fraction ? `.${fraction}` : ""}`;
}

function formatFeeRate() {
  return `${(CONFIG.bundleFeeBps / 100).toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}%`;
}

function shortMint(value) {
  const text = String(value);
  return text.length > 12 ? `${text.slice(0, 4)}...${text.slice(-4)}` : text;
}

function compareBigInt(left, right) {
  if (left > right) return 1;
  if (left < right) return -1;
  return 0;
}

function formatPnlMultiple(received, spent) {
  if (spent <= 0n) return "--";
  const value = Number(received) / Number(spent);
  if (!Number.isFinite(value)) return "--";
  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return value.toFixed(decimals).replace(/0+$/, "").replace(/\.$/, "");
}

function sanitizeCardText(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, Math.max(1, maxLength - 1))}` : text;
}

function formatUsdCompact(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "";
  if (number >= 1_000_000_000) return `$${(number / 1_000_000_000).toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}B`;
  if (number >= 1_000_000) return `$${(number / 1_000_000).toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}M`;
  if (number >= 1_000) return `$${(number / 1_000).toFixed(1).replace(/0+$/, "").replace(/\.$/, "")}K`;
  return `$${Math.round(number).toLocaleString("en-US")}`;
}

function formatBuyPressure(value) {
  const ratio = Number(value);
  if (!Number.isFinite(ratio)) return "flat";
  if (ratio >= 1.35) return "buyers strong";
  if (ratio >= 1.1) return "buyers";
  if (ratio >= 0.9) return "flat";
  return "sellers";
}

function formatPercentCompact(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0%";
  return `${number >= 0 ? "+" : ""}${number.toFixed(Math.abs(number) >= 100 ? 0 : 1)}%`;
}

function formatDexPriceMove(priceChange) {
  const entry = [
    ["24h", priceChange?.h24],
    ["6h", priceChange?.h6],
    ["1h", priceChange?.h1]
  ].find(([, value]) => Number.isFinite(Number(value)));
  if (!entry) return "";
  const [label, value] = entry;
  const number = Number(value);
  return `${label} ${number >= 0 ? "+" : ""}${number.toFixed(2)}%`;
}

function dexScreenerUrl(tokenMint) {
  return `https://dexscreener.com/solana/${tokenMint}`;
}

function escapeSvg(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function appendLimited(list, item, limit = 20) {
  return [...(Array.isArray(list) ? list : []), item].slice(-limit);
}

function limitResultLines(lines, limit = 80) {
  const list = Array.isArray(lines) ? lines : [];
  if (list.length <= limit) return list;
  return [
    ...list.slice(0, limit),
    `...${list.length - limit} more result(s) saved in the audit log.`
  ];
}

function uniqueTokenMintsFromEvents(events) {
  return [...new Set((Array.isArray(events) ? events : [])
    .map((event) => event.tokenMint)
    .filter(Boolean))];
}

function formatTakeProfitLadder(levels) {
  if (!Array.isArray(levels) || levels.length === 0) return "off";
  return levels.map((level) => `+${level.pct}% sells ${level.sellPercent}%`).join(" | ");
}

function formatWalletTakeProfitTargets(data) {
  if (!data?.walletTakeProfitTargets) return "No wallet targets set.";
  return (data.walletIndexes || [])
    .map((walletIndex) => `Wallet ${walletIndex}: +${data.walletTakeProfitTargets[String(walletIndex)]}%`)
    .join("\n");
}

function formatTakeProfitSummary(data) {
  if (data.takeProfitMode === "ladder") {
    return `ladder: ${formatTakeProfitLadder(data.takeProfitLadder)}`;
  }

  if (data.takeProfitMode === "wallets") {
    return `by wallet:\n${formatWalletTakeProfitTargets(data)}`;
  }

  return data.takeProfitPct ? `+${data.takeProfitPct}%` : "off";
}

function formatPlanTakeProfitSummary(plan) {
  if (plan.takeProfitMode === "ladder") {
    return `ladder: ${formatTakeProfitLadder(plan.takeProfitLadder)}`;
  }

  if (plan.takeProfitMode === "wallets") {
    const targets = (plan.wallets || [])
      .map((wallet) => `${wallet.label}: +${wallet.takeProfitPct || plan.takeProfitPct}%`)
      .join(" | ");
    return targets || "by wallet";
  }

  return plan.takeProfitPct ? `+${plan.takeProfitPct}%` : "off";
}

function formatFundConfirm(data) {
  return [
    "Confirm funding:",
    `Source wallet: ${data.sourceIndex}`,
    `Target wallets: ${data.targetIndexes.join(", ")}`,
    `Amount per wallet: ${data.amountSol} SOL`
  ].join("\n");
}

function buySlippagePromptText(data) {
  if (data.amountMode === "max") {
    return [
      "Amount selected: MAX.",
      `Each wallet keeps ${CONFIG.buyReserveSol} SOL safety reserve.`,
      `The confirm screen will show fee rate: ${formatFeeRate()}.`,
      "",
      `Send slippage in basis points, or type default for ${CONFIG.defaultSlippageBps} bps.`
    ].join("\n");
  }

  const amountLamports = solToLamports(data.amountSol);
  const feeLamports = calculateFeeLamports(amountLamports);
  const swapLamports = amountLamports - feeLamports;
  return [
    `Button spend: ${lamportsToSol(amountLamports)} SOL`,
    `Net Jupiter swap input: ${lamportsToSol(swapLamports)} SOL`,
    `Platform fee: ${lamportsToSol(feeLamports)} SOL (${formatFeeRate()})`,
    "",
    "Slippage is not a fee. It only controls how much price movement you allow before the swap fails.",
    "",
    `Send slippage in basis points, or type default for ${CONFIG.defaultSlippageBps} bps.`
  ].join("\n");
}

function formatBuyConfirm(data) {
  const heading = data.tradeMode === "single" ? "Confirm buy:" : "Confirm bundle buy:";
  const walletLabel = data.tradeMode === "single" && data.walletLabel ? `Wallet: ${data.walletLabel}` : `Wallets: ${data.walletIndexes.join(", ")}`;

  if (data.amountMode === "max") {
    return [
      heading,
      `Token mint: ${data.tokenMint}`,
      walletLabel,
      `Spend: MAX, keeping ${CONFIG.buyReserveSol} SOL reserve`,
      `Fee: ${formatFeeRate()}`,
      `Slippage: ${data.slippageBps} bps`,
      "Safety: blocks active mint/freeze authority and requires a sell route."
    ].join("\n");
  }

  const amountLamports = solToLamports(data.amountSol);
  const feeLamports = calculateFeeLamports(amountLamports);
  return [
    heading,
    `Token mint: ${data.tokenMint}`,
    walletLabel,
    `${data.tradeMode === "single" ? "Spend" : "Spend per wallet"}: ${lamportsToSol(amountLamports)} SOL`,
    `Net swap: ${lamportsToSol(amountLamports - feeLamports)} SOL`,
    `Fee: ${lamportsToSol(feeLamports)} SOL (${formatFeeRate()})`,
    `Slippage: ${data.slippageBps} bps`,
    "Safety: blocks active mint/freeze authority and requires a sell route."
  ].join("\n");
}

function formatBuySuccessLine(wallet, amountLamports, feeLamports, swapLamports, result, feeStatus) {
  return [
    `${wallet.label}: button spend ${lamportsToSol(amountLamports)} SOL`,
    `net swap ${lamportsToSol(swapLamports)} SOL`,
    `fee ${lamportsToSol(feeLamports)} SOL`,
    `tx ${result.signature}${formatSwapAttemptSuffix(result)}${feeStatus}`
  ].join(", ");
}

function formatSellSuccessLine(wallet, sell) {
  const outputLamports = BigInt(sell.outputLamports || 0);
  const feeLamports = BigInt(sell.feeLamports || calculateFeeLamports(outputLamports));
  const netLamports = outputLamports > feeLamports ? outputLamports - feeLamports : 0n;
  return [
    `${wallet.label}: swap ${sell.signature}${formatSwapAttemptSuffix(sell)}`,
    `gross out ${lamportsBigToSol(outputLamports)} SOL`,
    `fee ${lamportsBigToSol(feeLamports)} SOL`,
    `net after fee ${lamportsBigToSol(netLamports)} SOL${sell.feeStatus || ""}`
  ].join(", ");
}

function formatSellAllTokenLine(wallet, token, sell) {
  const outputLamports = BigInt(sell.outputLamports || 0);
  const feeLamports = BigInt(sell.feeLamports || calculateFeeLamports(outputLamports));
  const netLamports = outputLamports > feeLamports ? outputLamports - feeLamports : 0n;
  const accountNote = token.accountCount > 1 ? ` across ${token.accountCount} accounts` : "";
  return `${wallet.label}: sold ${token.uiAmount} of ${shortMint(token.mint)}${accountNote}, got ${lamportsBigToSol(netLamports)} SOL`;
}

function formatTimedSellSuccessLine(planWallet, sell, triggerReason, loopCount) {
  if (isPriceExitTrigger(triggerReason)) {
    return formatPriceExitRecap(planWallet, sell, triggerReason, loopCount);
  }

  return [
    `${planWallet.label}: sold loop ${planWallet.completedLoops}/${loopCount} by ${triggerReason}`,
    sell.sellPercent ? `sell ${sell.sellPercent}%` : "",
    formatSellSuccessLine({ label: planWallet.label }, sell).replace(`${planWallet.label}: `, "")
  ].filter(Boolean).join(", ");
}

function formatPriceExitRecap(planWallet, sell, triggerReason, loopCount) {
  const reason = String(triggerReason || "");
  const isProfit = /^take-profit\b/i.test(reason);
  const percentMatch = reason.match(/[-+]?\d+(?:\.\d+)?%/);
  const label = isProfit ? "Profit target hit" : "Stop loss hit";
  const outputLamports = BigInt(sell.outputLamports || 0);
  const feeLamports = BigInt(sell.feeLamports || calculateFeeLamports(outputLamports));
  const gotBack = outputLamports > feeLamports ? outputLamports - feeLamports : 0n;
  const sellPercent = Number.isFinite(Number(sell.sellPercent)) ? Number(sell.sellPercent) : 100;
  const putIn = (BigInt(planWallet.basisLamports || 0) * BigInt(sellPercent)) / 100n;
  const net = gotBack - putIn;

  return [
    `${planWallet.label}: ${label}${percentMatch ? ` ${percentMatch[0]}` : ""}`,
    loopCount > 1 ? `loop ${planWallet.completedLoops}/${loopCount}` : "",
    `put in ${lamportsBigToSol(putIn)} SOL`,
    `got back ${lamportsBigToSol(gotBack)} SOL`,
    `net ${formatSignedLamports(net)} SOL`
  ].filter(Boolean).join(", ");
}

function formatSellConfirm(data) {
  const heading = data.tradeMode === "single" ? "Confirm sell:" : "Confirm bundle sell:";
  const walletLabel = data.tradeMode === "single" && data.walletLabel ? `Wallet: ${data.walletLabel}` : `Wallets: ${data.walletIndexes.join(", ")}`;

  return [
    heading,
    `Token mint: ${data.tokenMint}`,
    walletLabel,
    `${data.tradeMode === "single" ? "Percent" : "Percent per wallet"}: ${data.percent}%`,
    `Fee: ${formatFeeRate()} of SOL output`,
    `Slippage: ${data.slippageBps} bps`,
    data.percent === 100 ? "100% sells the full current token balance." : ""
  ].filter(Boolean).join("\n");
}

function formatSellAllTokensConfirm(data) {
  return [
    "Confirm sell all tokens:",
    `Wallets: ${data.walletSelector || data.walletIndexes.join(", ")}`,
    "Action: sell every non-zero SPL token with a Jupiter route into SOL",
    data.sweepAfter
      ? `After sells: send all SOL to ${data.destination}`
      : "After sells: keep SOL in the selected wallets",
    `Fee: ${formatFeeRate()} of SOL output`,
    `Slippage: ${data.slippageBps} bps`,
    "Tokens with no route are skipped."
  ].join("\n");
}

function formatTimedTradePlanConfirm(data) {
  const amountLamports = solToLamports(data.amountSol);
  const feeLamports = calculateFeeLamports(amountLamports);
  const walletLabel = data.tradeMode === "single" && data.walletLabel ? `Wallet: ${data.walletLabel}` : `Wallets: ${data.walletIndexes.join(", ")}`;
  return [
    data.autoBundle ? "Confirm Auto Bundle plan:" : "Confirm timed trade plan:",
    `Token mint: ${data.tokenMint}`,
    walletLabel,
    `${data.tradeMode === "single" ? "Buy" : "Buy per wallet"}: ${data.amountSol} SOL`,
    `Net swap: ${lamportsToSol(amountLamports - feeLamports)} SOL`,
    `Sell timer: ${formatDelay(data.sellDelaySeconds)} after buy`,
    `Timer sell: ${data.sellPercent}%`,
    data.takeProfitMode === "ladder" ? "Take-profit: ladder chunks" : `TP/SL sell: ${data.triggerSellPercent || 100}%`,
    `Repeat cycles: ${data.loopCount || 1}x`,
    `Take-profit: ${formatTakeProfitSummary(data)}`,
    `Stop-loss: ${data.stopLossPct ? `-${data.stopLossPct}%` : "off"}`,
    `Slippage: ${data.slippageBps} bps`,
    "Safety: blocks active mint/freeze authority and requires a sell route."
  ].join("\n");
}

function formatSniperConfirm(data) {
  const score = data.score;
  return [
    "Confirm OgreSniper entry:",
    `Token mint: ${data.tokenMint}`,
    `Wallets: ${data.walletIndexes.join(", ")}`,
    `Mode: ${sniperModeLabel(data.settings?.mode || "safe")}`,
    score ? `Entry Score: ${score.score}/100 (${score.category})` : "",
    score ? `Rug Risk: ${score.rugRisk}/100` : "",
    `${data.tradeMode === "single" ? "Buy" : "Buy per wallet"}: ${data.amountSol} SOL`,
    `Exit: ${data.exitPreset}`,
    `Timer: ${formatDelay(data.sellDelaySeconds)} / ${data.sellPercent}%`,
    `TP/SL: +${data.takeProfitPct}% / -${data.stopLossPct}%`,
    `Slippage: ${data.slippageBps} bps`,
    "Safety: blocks active mint/freeze authority and requires a sell route."
  ].filter(Boolean).join("\n");
}

function formatDcaPlanConfirm(data) {
  const walletLabel = data.tradeMode === "single" && data.walletLabel ? `Wallet: ${data.walletLabel}` : `Wallets: ${data.walletIndexes.join(", ")}`;
  const lines = [
    `Confirm DCA ${data.side}:`,
    `Token mint: ${data.tokenMint}`,
    walletLabel,
    `Orders: ${data.orderCount}`,
    `Interval: ${data.intervalMinutes} minute(s)`,
    `Slippage: ${data.slippageBps} bps`
  ];

  if (data.side === "buy") {
    const totalLamports = solToLamports(data.totalSol);
    const feeLamports = calculateFeeLamports(totalLamports);
    lines.push(
      `Total spend per wallet: ${data.totalSol} SOL`,
      `Approx net swap total: ${lamportsToSol(totalLamports - feeLamports)} SOL`,
      `Approx each order: ${lamportsToSol(Math.floor(totalLamports / data.orderCount))} SOL`
    );
  } else {
    lines.push(
      `Total percent to sell per wallet: ${data.totalPercent}%`
    );
  }

  lines.push(
    `Fee: ${formatFeeRate()} ${data.side === "buy" ? "of SOL input" : "of SOL output"}`,
    "First slice runs on the next runner tick."
  );

  return lines.join("\n");
}

function formatSweepSolConfirm(data) {
  return [
    "Confirm SOL withdraw:",
    `Destination: ${data.destination}`,
    `Wallets: ${data.walletIndexes.join(", ")}`,
    "",
    "This sends each selected wallet's maximum available SOL minus the live network fee.",
    "If the destination is brand new, the first transfer must be large enough to create it on-chain."
  ].join("\n");
}

function formatSweepTokensConfirm(data) {
  return [
    "Confirm token sweep:",
    `Destination: ${data.destination}`,
    `Wallets: ${data.walletIndexes.join(", ")}`,
    `Token mint: ${data.tokenMint}`
  ].join("\n");
}

function formatCloseAccountsConfirm(data) {
  return [
    "Confirm close empty token accounts:",
    `Wallets: ${data.walletIndexes.join(", ")}`
  ].join("\n");
}

function formatDeleteWalletsConfirm(data) {
  const selected = (data.wallets || []).map((wallet, index) => {
    return `${index + 1}. ${wallet.label}: ${wallet.publicKey}`;
  });

  return [
    "Confirm wallet removal (1 of 2):",
    "",
    "This deletes the saved wallet record(s) from this bot only.",
    "It does not move SOL or tokens on-chain.",
    "The bot will send an encrypted backup file before the final confirmation.",
    "",
    "Selected wallets:",
    selected.join("\n"),
    "",
    "After this first confirm, review/save the backup file, then confirm one more time to delete."
  ].join("\n");
}

function formatDeleteWalletsFinalConfirm(data) {
  const selected = (data.wallets || []).map((wallet, index) => {
    return `${index + 1}. ${wallet.label}: ${wallet.publicKey}`;
  });

  return [
    "Final wallet removal confirmation (2 of 2):",
    "",
    `Backup file sent: ${data.backupFilename || "sent"}`,
    "That encrypted backup keeps the wallet keys recoverable through Backup / Restore as long as the same APP_SECRET is used.",
    "",
    "Tap Confirm one more time to remove these saved wallet records from the bot.",
    "This still does not move SOL or tokens on-chain.",
    "",
    selected.join("\n")
  ].join("\n");
}

async function confirmOrCancel(chatId, text, onConfirm, options = {}) {
  if (text.trim().toLowerCase() !== "yes") {
    await sendConfirmPrompt(chatId, "Confirm this action:");
    return;
  }

  if (!options.allowWhilePaused && (await readState()).paused) {
    clearSession(chatId);
    await say(chatId, "Emergency stop is active. Transaction flow canceled.");
    return;
  }

  await say(chatId, "Executing. This can take a bit if several wallets are selected.");
  await onConfirm();
}

function isAdmin(userId) {
  return CONFIG.adminUserIds.includes(userId);
}

function isPrivateChat(chat) {
  return chat?.type === "private";
}

async function isPausedActionBlocked(action) {
  const allowedWhilePaused = new Set([
    "quick_start",
    "main_menu",
    "list_wallets",
    "check_balances",
    "backup_menu",
    "export_backup",
    "restore_backup",
    "rescue_backup_keys",
    "export_private_keys",
    "export_audit",
    "emergency_stop",
    "unlock_bot"
  ]);
  return (await readState()).paused && !allowedWhilePaused.has(action);
}

function setSession(chatId, step, userId) {
  sessions.set(chatId, { step, userId, data: {} });
}

function clearSession(chatId) {
  sessions.delete(chatId);
}

function chunkText(text, size) {
  const chunks = [];
  for (let index = 0; index < text.length; index += size) {
    chunks.push(text.slice(index, index + size));
  }
  return chunks.length ? chunks : [""];
}

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function getTimedCache(cache, key, ttlMs = CONFIG.balanceCacheTtlMs) {
  if (ttlMs <= 0) return undefined;
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.createdAt > ttlMs) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function setTimedCache(cache, key, value) {
  if (CONFIG.balanceCacheTtlMs <= 0) return;
  cache.set(key, { createdAt: Date.now(), value });
}

function invalidateWalletReadCache(publicKey) {
  const key = String(publicKey || "");
  if (!key) return;
  solBalanceCache.delete(key);
  tokenAccountsCache.delete(key);
  for (const cacheKey of [...tokenBalanceCache.keys()]) {
    if (cacheKey.startsWith(`${key}:`)) {
      tokenBalanceCache.delete(cacheKey);
    }
  }
  positionValueCache.clear();
}

async function runWithConcurrency(items, concurrency, worker) {
  let nextIndex = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      await worker(items[index], index);
    }
  });

  await Promise.all(runners);
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}

function friendlyError(error) {
  const message = formatError(error);

  if (message.startsWith("Buy failed after funding check:")) {
    return message;
  }

  if (message.includes("429") || /too many requests|rate limit/i.test(message)) {
    return "Rate limit after automatic retries. The bot slowed down and queued requests, but the RPC or Jupiter endpoint is still throttling. Use fewer wallets, wait a minute, or upgrade SOLANA_RPC_URL/Jupiter limits for reliable batches.";
  }

  if (/failed to get quote|could not build a quote|quote\/order|No routes/i.test(message)) {
    return "No Jupiter route/quote. Check token mint, liquidity, amount size, slippage, and wallet SOL balance.";
  }

  if (/insufficient funds for rent/i.test(message)) {
    return "Not enough SOL after fees/rent. For Withdraw SOL, use an existing funded destination wallet, or make sure the amount is enough to create a brand-new destination account.";
  }

  if (/destination account does not exist/i.test(message)) {
    return message;
  }

  if (/insufficient funds|custom program error: 0x1/i.test(message)) {
    return "Not enough SOL for swap plus network fees. Add SOL, use a smaller amount, or type max in the buy amount step.";
  }

  return message;
}

function friendlyBackupError(error) {
  const message = formatError(error);
  if (/APP_SECRET|could not be decrypted/i.test(message)) {
    return "Backup opened, but wallet keys could not be decrypted. Set the new Render APP_SECRET to the exact old APP_SECRET, redeploy, then restore or use /rescue.";
  }
  if (/Unexpected token|JSON|Could not read that backup|Backup format/i.test(message)) {
    return "Could not read that backup. Upload the original wallet-backup .txt file, paste the full backup text, or paste emergency key text with Base58 secret key / JSON secret key lines.";
  }
  return message;
}

function looksLikeBackupDocument(filename, text) {
  const name = String(filename || "").toLowerCase();
  const sample = String(text || "").slice(0, 500).toLowerCase();
  return name.includes("backup")
    || name.endsWith(".txt")
    || sample.includes("\"wallets\"")
    || sample.includes("wallet-backup")
    || sample.includes("encrypted");
}

async function rpcWithRetry(label, operation, retries = CONFIG.rpcRetries) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await rpcLimiter.schedule(label, operation);
    } catch (error) {
      lastError = error;
      if (!isRetryableRpcError(error) || attempt === retries) break;
      if (CONFIG.rpc429CooldownMs > 0) {
        rpcLimiter.cooldown(CONFIG.rpc429CooldownMs);
      }
      const jitterMs = Math.floor(Math.random() * 250);
      const delayMs = CONFIG.rpcDelayMs * (attempt + 1) + jitterMs;
      console.warn(`${label} failed with a retryable RPC error. Retrying in ${delayMs}ms.`);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

async function jupiterFetchJson(url, init, label, retries = CONFIG.jupiterRetries) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await jupiterLimiter.schedule(label, () => fetchJson(url, init));
    } catch (error) {
      lastError = error;
      if (!isRetryableServiceError(error) || attempt === retries) break;
      const retryAfterMs = parseRetryAfterMs(error.retryAfter);
      if (CONFIG.jupiter429CooldownMs > 0) {
        jupiterLimiter.cooldown(Math.max(CONFIG.jupiter429CooldownMs, retryAfterMs));
      }
      const jitterMs = Math.floor(Math.random() * 250);
      const delayMs = Math.max(CONFIG.jupiterMinIntervalMs, retryAfterMs) + (CONFIG.jupiterMinIntervalMs * attempt) + jitterMs;
      console.warn(`${label} failed with a retryable API error. Retrying in ${delayMs}ms.`);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

function createRpcLimiter() {
  let gate = Promise.resolve();
  let nextStartAt = 0;
  let cooldownUntil = 0;

  return {
    async schedule(_label, operation) {
      const waitTurn = gate.then(async () => {
        const waitMs = Math.max(0, nextStartAt - Date.now(), cooldownUntil - Date.now());
        if (waitMs > 0) {
          await sleep(waitMs);
        }
        nextStartAt = Date.now() + CONFIG.rpcMinIntervalMs;
      });
      gate = waitTurn.catch(() => {});
      await waitTurn;
      return operation();
    },
    cooldown(milliseconds) {
      cooldownUntil = Math.max(cooldownUntil, Date.now() + milliseconds);
    }
  };
}

function createJupiterLimiter() {
  let gate = Promise.resolve();
  let nextStartAt = 0;
  let cooldownUntil = 0;

  return {
    async schedule(_label, operation) {
      const waitTurn = gate.then(async () => {
        const waitMs = Math.max(0, nextStartAt - Date.now(), cooldownUntil - Date.now());
        if (waitMs > 0) {
          await sleep(waitMs);
        }
        nextStartAt = Date.now() + CONFIG.jupiterMinIntervalMs;
      });
      gate = waitTurn.catch(() => {});
      await waitTurn;
      return operation();
    },
    cooldown(milliseconds) {
      cooldownUntil = Math.max(cooldownUntil, Date.now() + milliseconds);
    }
  };
}

function isRetryableRpcError(error) {
  const message = formatError(error);
  return message.includes("429") || /too many requests/i.test(message) || /rate limit/i.test(message);
}

function isRetryableServiceError(error) {
  const status = Number(error?.status);
  const message = formatError(error);
  return status === 429
    || [500, 502, 503, 504].includes(status)
    || /too many requests|rate limit|temporarily unavailable|fetch failed|network/i.test(message);
}

function isRetryableSwapError(error) {
  const message = formatError(error);
  if (/insufficient funds|not enough sol|no token balance|missing jupiter|invalid public key/i.test(message)) {
    return false;
  }

  return isRetryableServiceError(error)
    || /slippage|price|quote|route|blockhash|expired|timeout|temporarily|execute|simulation|transaction|failed to land|did not return/i.test(message);
}

function isRetryableSweepError(error) {
  const message = formatError(error);
  return isRetryableRpcError(error)
    || /blockhash|block height exceeded|insufficient funds|insufficient funds for rent|account.*insufficient/i.test(message);
}

function parseRetryAfterMs(value) {
  if (!value) return 0;
  const seconds = Number.parseFloat(value);
  if (Number.isFinite(seconds)) {
    return Math.max(0, Math.floor(seconds * 1000));
  }
  const dateMs = Date.parse(value);
  return Number.isFinite(dateMs) ? Math.max(0, dateMs - Date.now()) : 0;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
