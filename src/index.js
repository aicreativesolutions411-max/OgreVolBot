import crypto from "node:crypto";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bs58 from "bs58";
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
const BRAND_FOOTER = [
  "Powered by Ogres",
  "Telegram: https://t.me/ogrecoinonsol",
  "Website: https://ogremode.com/",
  "Twitter: https://twitter.com/i/communities/1930265213917425858"
].join("\n");

const PUBLIC_MENU = [
  [{ text: "🐎 How To Use", callback_data: "quick_start" }],
  [{ text: "💱 Trade", callback_data: "trade_menu" }],
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
  "wallet_menu",
  "trade_menu",
  "bundle_menu",
  "withdrawal_menu",
  "list_wallets",
  "check_balances",
  "pnl_results",
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
    defaultSlippageBps: Number.parseInt(process.env.DEFAULT_SLIPPAGE_BPS || "100", 10),
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
      rpcDelayMs: 1500,
      rpcMinIntervalMs: 1200,
      rpc429CooldownMs: 15000,
      jupiterMinIntervalMs: 1200,
      jupiter429CooldownMs: 15000
    },
    balanced: {
      bundleConcurrency: 2,
      rpcDelayMs: 750,
      rpcMinIntervalMs: 450,
      rpc429CooldownMs: 10000,
      jupiterMinIntervalMs: 500,
      jupiter429CooldownMs: 10000
    },
    fast: {
      bundleConcurrency: 3,
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
  await telegram("answerCallbackQuery", { callback_query_id: query.id });

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
    await showHowToPage(chatId, query.data.replace("howto_", ""));
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

  if (await isPausedActionBlocked(query.data)) {
    await say(chatId, "Emergency stop is active. Use Unlock Bot to re-enable transaction flows.");
    return;
  }

  switch (query.data) {
    case "quick_start":
      await showHowToMenu(chatId);
      break;
    case "main_menu":
      await showMenu(chatId, userId);
      break;
    case "backup_menu":
      await showBackupMenu(chatId);
      break;
    case "wallet_menu":
      await showWalletMenu(chatId);
      break;
    case "trade_menu":
      await showTradeMenu(chatId);
      break;
    case "bundle_menu":
      await showBundleMenu(chatId);
      break;
    case "withdrawal_menu":
      await showWithdrawalMenu(chatId);
      break;
    case "create_wallets":
      setSession(chatId, "create_wallets_label", userId);
      await say(chatId, "Send a label for this wallet set.");
      break;
    case "import_wallet":
      setSession(chatId, "import_wallet_label", userId);
      await say(chatId, "Send a label for this wallet.");
      break;
    case "list_wallets":
      await listWallets(chatId, userId);
      break;
    case "check_balances":
      await showWalletBalances(chatId, userId);
      break;
    case "pnl_results":
      await showPnlResults(chatId, userId);
      break;
    case "positions_overview":
      await showPositionsOverview(chatId, userId);
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
      sessions.set(chatId, { step: "trade_plan_wallet", userId, data: { tradeMode: "single" } });
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
      setSession(chatId, "plan_token", userId);
      await say(chatId, timedTradePlanIntroText());
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
      await say(chatId, "Reply `yes` to unlock transaction flows, or `/cancel`.");
      break;
    default:
      await say(chatId, "Unknown menu action. Use /start to reopen the menu.");
  }
}

async function handleQuickButton(chatId, callbackData, userId, messageId = null) {
  const session = sessions.get(chatId);
  if (!session || String(session.userId) !== String(userId)) {
    await clearInlineKeyboard(chatId, messageId);
    await say(chatId, "That quick button expired. Use /start and choose the action again.");
    return;
  }

  const value = callbackData.slice("quick:".length);
  await clearInlineKeyboard(chatId, messageId);

  if (value === "cancel") {
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
  }

  if (value === "custom") {
    await say(chatId, "Type your custom value now, or /cancel.");
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
      case "restore_backup":
        await restoreWalletBackupFlow(chatId, text, session);
        break;
      case "rescue_backup_keys":
        await rescueBackupKeysFlow(chatId, text, session);
        break;
      case "export_private_keys_confirm":
        await exportPrivateKeysConfirmFlow(chatId, text, session);
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
        session.step = "buy_slippage";
        await sendQuickSlippagePrompt(chatId, `Send slippage in basis points, or type default for ${CONFIG.defaultSlippageBps} bps.`);
        break;
      case "buy_slippage":
        session.data.slippageBps = parseSlippage(text);
        session.step = "buy_confirm";
        await sendConfirmPrompt(chatId, withBrandFooter(formatBuyConfirm(session.data)));
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
        session.step = "plan_loop_count";
        await sendQuickChoicePrompt(chatId, "Repeat cycles: choose how many total buy/sell cycles this plan should run.", [
          [{ text: "Repeat 1x", value: "1" }, { text: "Repeat 5x", value: "5" }],
          [{ text: "Repeat 10x", value: "10" }]
        ]);
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
      const balance = await rpcWithRetry("get wallet SOL balance", () => connection.getBalance(keypair.publicKey, "confirmed"));
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

      const result = await executeJupiterSwap({
        signer: keypair,
        inputMint: SOL_MINT,
        outputMint: session.data.tokenMint,
        amount: swapLamports,
        slippageBps: session.data.slippageBps
      });
      let feeStatus = "";
      try {
        const feeSignature = await collectSolFee(keypair, feeLamports);
        feeStatus = feeSignature ? `, fee ${feeSignature}` : "";
      } catch (feeError) {
        feeStatus = `, fee failed - ${formatError(feeError)}`;
      }
      results.push(`${wallet.label}: spent ${lamportsToSol(amountLamports)} SOL, swap ${result.signature}${feeStatus}`);
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
      const token = await getTokenBalanceForMint(keypair.publicKey, new PublicKey(session.data.tokenMint));
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
        feeStatus = feeSignature ? `, fee ${feeSignature}` : "";
      } catch (feeError) {
        feeStatus = `, fee failed - ${formatError(feeError)}`;
      }
      results.push(`${wallet.label}: swap ${result.signature}${feeStatus}`);
      tradeEvents.push({
        userId: session.userId,
        type: "sell",
        source: isSingleTrade ? "single_trade" : "bundle",
        tokenMint: session.data.tokenMint,
        walletLabel: wallet.label,
        walletPublicKey: wallet.publicKey,
        tokenAmount: amount.toString(),
        solLamportsReceived: outputLamports.toString(),
        signature: result.signature
      });
    } catch (error) {
      results.push(`${wallet.label}: failed - ${friendlyError(error)}`);
    }
  });

  await recordTradeEvents(tradeEvents);
  const pnl = await pnlSummaryText(session.userId, session.data.tokenMint);
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
  if (!isSingleTrade) {
    await showMenu(chatId, session.userId);
  }
}

async function createTimedTradePlanFlow(chatId, session) {
  const store = await readWalletStore();
  const wallets = session.data.walletIndexes.map((index) => getWalletAt(store, index, session.userId));
  const amountLamports = solToLamports(session.data.amountSol);
  const results = [];
  const planWallets = [];
  const tradeEvents = [];

  await runWithConcurrency(wallets, 1, async (wallet) => {
    try {
      const result = await buyTokenForPlan(wallet, session.data.tokenMint, amountLamports, session.data.slippageBps);
      results.push(`${wallet.label}: buy ${result.signature}${result.feeStatus}`);
      tradeEvents.push({
        userId: session.userId,
        type: "buy",
        source: "timed_plan",
        tokenMint: session.data.tokenMint,
        walletLabel: wallet.label,
        walletPublicKey: wallet.publicKey,
        solLamportsSpent: String(amountLamports),
        tokenAmount: result.outputAmount || null,
        signature: result.signature
      });
      planWallets.push({
        label: wallet.label,
        publicKey: wallet.publicKey,
        basisLamports: amountLamports,
        tokenOutAmount: result.outputAmount || null,
        buySignature: result.signature,
        currentLoop: 1,
        completedLoops: 0,
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
    await say(chatId, withBrandFooter(`Timed trade plan was not created because no buys succeeded.\n\n${results.join("\n")}`));
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
    walletSelector: session.data.walletSelector,
    amountSol: session.data.amountSol,
    sellDelayMinutes: session.data.sellDelayMinutes,
    sellDelaySeconds: session.data.sellDelaySeconds,
    sellAfterAt: new Date(now + session.data.sellDelaySeconds * 1000).toISOString(),
    sellPercent: session.data.sellPercent,
    loopCount: session.data.loopCount || 1,
    takeProfitPct: session.data.takeProfitPct,
    stopLossPct: session.data.stopLossPct,
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
    takeProfitPct: plan.takeProfitPct,
    stopLossPct: plan.stopLossPct
  });

  clearSession(chatId);
  await say(chatId, withBrandFooter([
    "Timed trade plan created.",
    `Plan ID: ${plan.id}`,
    `Sell timer: ${plan.sellAfterAt}`,
    `Loops: ${plan.loopCount}`,
    `Take-profit: ${plan.takeProfitPct ? `+${plan.takeProfitPct}%` : "off"}`,
    `Stop-loss: ${plan.stopLossPct ? `-${plan.stopLossPct}%` : "off"}`,
    "",
    results.join("\n")
  ].join("\n")));
  await showMenu(chatId, session.userId);
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
    await runWithConcurrency(selectedWallets, 1, async (wallet) => {
      try {
        const keypair = decryptWallet(wallet);
        const token = await getTokenBalanceForMint(keypair.publicKey, new PublicKey(session.data.tokenMint));
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

async function buyTokenForPlan(wallet, tokenMint, amountLamports, slippageBps) {
  const keypair = decryptWallet(wallet);
  const balance = await rpcWithRetry("get wallet SOL balance", () => connection.getBalance(keypair.publicKey, "confirmed"));
  const feeLamports = calculateFeeLamports(amountLamports);
  const swapLamports = amountLamports - feeLamports;
  const recommendedLamports = recommendedBuyFundingLamports(amountLamports);

  if (amountLamports <= 0 || swapLamports <= 0) {
    throw new Error(`Not enough SOL after keeping ${CONFIG.buyReserveSol} SOL safety reserve.`);
  }

  if (balance < recommendedLamports) {
    throw new Error(`Not enough SOL. Has ${lamportsToSol(balance)} SOL, needs about ${lamportsToSol(recommendedLamports)} SOL.`);
  }

  const result = await executeJupiterSwap({
    signer: keypair,
    inputMint: SOL_MINT,
    outputMint: tokenMint,
    amount: swapLamports,
    slippageBps
  });

  let feeStatus = "";
  try {
    const feeSignature = await collectSolFee(keypair, feeLamports);
    feeStatus = feeSignature ? `, fee ${feeSignature}` : "";
  } catch (feeError) {
    feeStatus = `, fee failed - ${formatError(feeError)}`;
  }

  return {
    signature: result.signature,
    outputAmount: result.outputAmount,
    feeStatus
  };
}

async function sellTokenFromWallet(wallet, tokenMint, percent, slippageBps) {
  const keypair = decryptWallet(wallet);
  const token = await getTokenBalanceForMint(keypair.publicKey, new PublicKey(tokenMint));
  if (!token || token.rawAmount === 0n) {
    throw new Error("no token balance");
  }

  const amount = (token.rawAmount * BigInt(percent)) / 100n;
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
    feeStatus = feeSignature ? `, fee ${feeSignature}` : "";
  } catch (feeError) {
    feeStatus = `, fee failed - ${formatError(feeError)}`;
  }

  return {
    signature: result.signature,
    tokenAmount: sellAmount.toString(),
    outputLamports: outputLamports.toString(),
    feeStatus
  };
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
      for (const planWallet of plan.wallets) {
        if (planWallet.status !== "watching") continue;
        const result = await processTradePlanWallet(plan, planWallet, walletStore);
        if (result.changed) changed = true;
        if (result.message) walletMessages.push(result.message);
      }

      if (plan.wallets.every((wallet) => wallet.status !== "watching")) {
        plan.status = "completed";
        plan.completedAt = new Date().toISOString();
        changed = true;
      }

      if (walletMessages.length > 0) {
        await say(plan.chatId, withBrandFooter([
          `Timed trade plan update: ${plan.id}`,
          ...walletMessages
        ].join("\n")));
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
  const now = Date.now();
  if (now >= Date.parse(planWallet.sellAfterAt || plan.sellAfterAt)) {
    triggerReason = "timer";
  }

  if (!triggerReason && (plan.takeProfitPct || plan.stopLossPct)) {
    const lastCheckedAt = Date.parse(planWallet.lastCheckedAt || "");
    if (Number.isFinite(lastCheckedAt) && now - lastCheckedAt < 30_000) {
      return { changed: false, message: null };
    }

    try {
      const estimate = await estimatePlanWalletMove(plan, wallet);
      planWallet.lastCheckedAt = new Date().toISOString();
      planWallet.lastMovePct = estimate.movePct;

      if (plan.takeProfitPct && estimate.movePct >= plan.takeProfitPct) {
        triggerReason = `take-profit +${estimate.movePct.toFixed(2)}%`;
      } else if (plan.stopLossPct && estimate.movePct <= -plan.stopLossPct) {
        triggerReason = `stop-loss ${estimate.movePct.toFixed(2)}%`;
      } else {
        return { changed: true, message: null };
      }
    } catch (error) {
      planWallet.lastCheckedAt = new Date().toISOString();
      planWallet.lastError = friendlyError(error);
      return { changed: true, message: null };
    }
  }

  if (!triggerReason) {
    return { changed: false, message: null };
  }

  try {
    const sell = await sellTokenFromWallet(wallet, plan.tokenMint, plan.sellPercent, plan.slippageBps);
    await recordTradeEvents([{
      userId: plan.userId,
      type: "sell",
      source: "timed_plan",
      tokenMint: plan.tokenMint,
      walletLabel: wallet.label,
      walletPublicKey: wallet.publicKey,
      tokenAmount: sell.tokenAmount,
      solLamportsReceived: sell.outputLamports,
      signature: sell.signature
    }]);
    planWallet.completedLoops = Number.parseInt(planWallet.completedLoops || 0, 10) + 1;
    planWallet.triggerReason = triggerReason;
    planWallet.sellSignature = sell.signature;
    planWallet.sellFeeStatus = sell.feeStatus;
    planWallet.soldAt = new Date().toISOString();

    if (planWallet.completedLoops < (plan.loopCount || 1)) {
      return restartTimedPlanLoop(plan, planWallet, wallet, sell, triggerReason);
    }

    planWallet.status = "sold";
    return { changed: true, message: `${planWallet.label}: sold loop ${planWallet.completedLoops}/${plan.loopCount || 1} by ${triggerReason}, ${sell.signature}${sell.feeStatus}` };
  } catch (error) {
    planWallet.status = "failed";
    planWallet.triggerReason = triggerReason;
    planWallet.error = friendlyError(error);
    planWallet.updatedAt = new Date().toISOString();
    return { changed: true, message: `${planWallet.label}: sell failed by ${triggerReason} - ${friendlyError(error)}` };
  }
}

async function restartTimedPlanLoop(plan, planWallet, wallet, sell, triggerReason) {
  try {
    const amountLamports = solToLamports(plan.amountSol);
    const buy = await buyTokenForPlan(wallet, plan.tokenMint, amountLamports, plan.slippageBps);
    await recordTradeEvents([{
      userId: plan.userId,
      type: "buy",
      source: "timed_plan_loop",
      tokenMint: plan.tokenMint,
      walletLabel: wallet.label,
      walletPublicKey: wallet.publicKey,
      solLamportsSpent: String(amountLamports),
      tokenAmount: buy.outputAmount || null,
      signature: buy.signature
    }]);

    planWallet.status = "watching";
    planWallet.currentLoop = planWallet.completedLoops + 1;
    planWallet.basisLamports = amountLamports;
    planWallet.tokenOutAmount = buy.outputAmount || null;
    planWallet.buySignature = buy.signature;
    planWallet.lastCheckedAt = null;
    planWallet.lastMovePct = null;
    planWallet.lastError = null;
    planWallet.sellAfterAt = new Date(Date.now() + (plan.sellDelaySeconds || Math.round((plan.sellDelayMinutes || 1) * 60)) * 1000).toISOString();
    planWallet.updatedAt = new Date().toISOString();

    return {
      changed: true,
      message: `${planWallet.label}: sold loop ${planWallet.completedLoops}/${plan.loopCount} by ${triggerReason}, ${sell.signature}${sell.feeStatus}; started loop ${planWallet.currentLoop}/${plan.loopCount}, buy ${buy.signature}${buy.feeStatus}`
    };
  } catch (error) {
    planWallet.status = "failed";
    planWallet.error = `next loop buy failed after sell: ${friendlyError(error)}`;
    planWallet.updatedAt = new Date().toISOString();
    return {
      changed: true,
      message: `${planWallet.label}: sold loop ${planWallet.completedLoops}/${plan.loopCount} by ${triggerReason}, ${sell.signature}${sell.feeStatus}; next loop buy failed - ${friendlyError(error)}`
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
      for (const planWallet of plan.wallets) {
        if (planWallet.status !== "active") continue;
        const result = await processDcaPlanWallet(plan, planWallet, walletStore);
        if (result.changed) changed = true;
        if (result.message) messages.push(result.message);
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
      planWallet.results = appendLimited(planWallet.results, `buy ${planWallet.completedOrders}/${plan.orderCount}: ${buy.signature}`);

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
        message: `${planWallet.label}: DCA buy ${planWallet.completedOrders}/${plan.orderCount}, ${lamportsToSol(amountLamports)} SOL, ${buy.signature}${buy.feeStatus}`
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
    planWallet.results = appendLimited(planWallet.results, `sell ${planWallet.completedOrders}/${plan.orderCount}: ${sell.signature}`);

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

    if (planWallet.completedOrders >= plan.orderCount || nextRemaining <= 0n) {
      planWallet.status = "completed";
      planWallet.completedAt = new Date().toISOString();
    }

    return {
      changed: true,
      message: `${planWallet.label}: DCA sell ${planWallet.completedOrders}/${plan.orderCount}, ${sell.signature}${sell.feeStatus}`
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
  const token = await getTokenBalanceForMint(keypair.publicKey, new PublicKey(plan.tokenMint));
  if (!token || token.rawAmount === 0n) {
    throw new Error("no token balance");
  }

  const amount = (token.rawAmount * BigInt(plan.sellPercent)) / 100n;
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
  const basis = (BigInt(plan.wallets.find((item) => item.publicKey === wallet.publicKey)?.basisLamports || 0) * BigInt(plan.sellPercent)) / 100n;
  if (basis <= 0n) {
    throw new Error("missing plan basis");
  }

  const movePct = (Number(estimatedOut - basis) / Number(basis)) * 100;
  return { estimatedOut, basis, movePct };
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
      const tokenAccounts = await getOwnedTokenAccounts(keypair.publicKey);
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
      const emptyAccounts = (await getOwnedTokenAccounts(keypair.publicKey)).filter((account) => account.rawAmount === 0n);

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

async function executeJupiterSwap({ signer, inputMint, outputMint, amount, slippageBps }) {
  if (!CONFIG.jupiterApiKey) {
    throw new Error("Missing JUPITER_API_KEY. Swaps require a Jupiter API key.");
  }

  const order = await createJupiterOrder({
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
    outputAmount: execute.outputAmountResult || order.outAmount
  };
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
      const balance = await rpcWithRetry("get SOL balance", () => connection.getBalance(keypair.publicKey, "confirmed"));

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
  const lookups = [
    { label: "SPL", programId: TOKEN_PROGRAM_ID },
    { label: "Token-2022", programId: TOKEN_2022_PROGRAM_ID }
  ];
  const accounts = [];
  const warnings = [];
  let successes = 0;

  for (const lookup of lookups) {
    try {
      const response = await rpcWithRetry(`get ${lookup.label} token accounts`, () => connection.getParsedTokenAccountsByOwner(owner, { programId: lookup.programId }, "confirmed"));
      successes += 1;
      accounts.push(...parseTokenAccountResponse(response, lookup.programId));
    } catch (error) {
      warnings.push(`${lookup.label}: ${friendlyError(error)}`);
    }
    await sleep(CONFIG.rpcDelayMs);
  }

  return { accounts, warnings, successes };
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

async function showWalletBalances(chatId, userId) {
  const store = await readWalletStore();
  const wallets = walletsForOwner(store, userId);

  if (wallets.length === 0) {
    await say(chatId, "You do not have any managed wallets yet.");
    return;
  }

  const lines = [];

  await runWithConcurrency(wallets, 1, async (wallet, index) => {
    try {
      const keypair = decryptWallet(wallet);
      const parts = [
        `${index + 1}. ${wallet.label}`,
        `${wallet.publicKey}`
      ];

      try {
        const balance = await rpcWithRetry("get wallet SOL balance", () => connection.getBalance(keypair.publicKey, "confirmed"));
        parts.push(`SOL: ${lamportsToSol(balance)}`);
      } catch (error) {
        parts.push(`SOL: unavailable - ${friendlyError(error)}`);
      }

      const { accounts: tokenAccounts, warnings, successes } = await getOwnedTokenAccountsWithWarnings(keypair.publicKey);
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

  await say(chatId, `Wallet balances:\n\n${lines.join("\n\n")}`);
}

async function selectedTokenBalanceSummary(userId, walletIndexes, tokenMint) {
  const store = await readWalletStore();
  const lines = [];
  let holders = 0;

  await runWithConcurrency(walletIndexes, 1, async (walletIndex, resultIndex) => {
    const wallet = getWalletAt(store, walletIndex, userId);
    try {
      const keypair = decryptWallet(wallet);
      const token = await getTokenBalanceForMint(keypair.publicKey, new PublicKey(tokenMint));
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

async function showWalletMenu(chatId) {
  await telegram("sendMessage", {
    chat_id: chatId,
    text: withBrandFooter("Wallet tools:"),
    reply_markup: {
      inline_keyboard: [
        [{ text: "💴💶💷 Create Wallet Set", callback_data: "create_wallets" }],
        [{ text: "Import Wallet", callback_data: "import_wallet" }],
        [{ text: "💳 My Wallets", callback_data: "list_wallets" }],
        [{ text: "Positions Overview", callback_data: "positions_overview" }],
        [{ text: "PnL / Results", callback_data: "pnl_results" }],
        [{ text: "Close Empty Token Accounts", callback_data: "close_empty_accounts" }]
      ]
    }
  });
}

async function showTradeMenu(chatId) {
  await telegram("sendMessage", {
    chat_id: chatId,
    text: withBrandFooter("Single-wallet trade tools:\n\nPick one wallet first, then use quick buttons like 0.10 SOL, 0.50 SOL, 1 SOL, 25%, 50%, and 100%."),
    reply_markup: {
      inline_keyboard: [
        [{ text: "Buy", callback_data: "trade_buy" }, { text: "Sell", callback_data: "trade_sell" }],
        [{ text: "Auto Sell", callback_data: "trade_auto_sell" }],
        [{ text: "DCA Buy", callback_data: "trade_dca_buy" }, { text: "DCA Sell", callback_data: "trade_dca_sell" }],
        [{ text: "Positions", callback_data: "positions_overview" }, { text: "Wallets", callback_data: "list_wallets" }]
      ]
    }
  });
}

async function showBundleMenu(chatId) {
  await telegram("sendMessage", {
    chat_id: chatId,
    text: withBrandFooter("Bundle and trade tools:"),
    reply_markup: {
      inline_keyboard: [
        [{ text: "🧲 Bundle Buy", callback_data: "batch_buy" }],
        [{ text: "🧲 Bundle Sell", callback_data: "batch_sell" }],
        [{ text: "DCA Buy", callback_data: "dca_buy" }, { text: "DCA Sell", callback_data: "dca_sell" }],
        [{ text: "Auto Sell / Timed Plan", callback_data: "timed_trade_plans" }],
        [{ text: "Copy Trade", callback_data: "copy_trade_info" }]
      ]
    }
  });
}

async function showWithdrawalMenu(chatId) {
  await telegram("sendMessage", {
    chat_id: chatId,
    text: withBrandFooter("Withdrawal tools:"),
    reply_markup: {
      inline_keyboard: [
        [{ text: "🏦 Withdraw SOL", callback_data: "sweep_sol" }],
        [{ text: "Sweep Tokens", callback_data: "sweep_tokens" }],
        [{ text: "Fund Wallets", callback_data: "fund_wallets" }]
      ]
    }
  });
}

async function showPnlResults(chatId, userId) {
  await say(chatId, await pnlSummaryText(userId));
}

async function showPositionsOverview(chatId, userId) {
  const positions = await buildPositionsOverview(userId);

  if (positions.length === 0) {
    await say(chatId, withBrandFooter("Positions Overview\n\nNo token positions found yet. Buy or import funded wallets, then refresh balances."));
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
    }]))
  ];

  await telegram("sendMessage", {
    chat_id: chatId,
    text: withBrandFooter(["Positions Overview", ...rows].join("\n\n")),
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: keyboard }
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

  await runWithConcurrency(wallets, 1, async (wallet) => {
    try {
      const keypair = decryptWallet(wallet);
      const { accounts } = await getOwnedTokenAccountsWithWarnings(keypair.publicKey);
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
    .filter((position) => position.rawAmount > 0n || position.buys > 0 || position.sells > 0)
    .sort((a, b) => Number((b.rawAmount > 0n ? 1 : 0) - (a.rawAmount > 0n ? 1 : 0)) || Number((b.spent - b.received) - (a.spent - a.received)));

  for (const position of rows.slice(0, 5)) {
    try {
      position.estimatedValueLamports = await estimatePositionValue(position);
    } catch (error) {
      position.estimatedValueLamports = null;
      position.valueError = friendlyError(error);
    }
  }

  return rows;
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
  return total;
}

async function pnlSummaryText(userId, tokenFilter = null) {
  const history = await readTradeHistory();
  const aggregates = new Map();

  for (const trade of history.trades.filter((item) => String(item.userId) === String(userId))) {
    if (tokenFilter && trade.tokenMint !== tokenFilter) continue;
    const key = `${trade.walletPublicKey}:${trade.tokenMint}`;
    const entry = aggregates.get(key) || {
      walletLabel: trade.walletLabel,
      walletPublicKey: trade.walletPublicKey,
      tokenMint: trade.tokenMint,
      buys: 0,
      sells: 0,
      spent: 0n,
      received: 0n
    };

    if (trade.type === "buy") {
      entry.buys += 1;
      entry.spent += BigInt(trade.solLamportsSpent || 0);
    } else if (trade.type === "sell") {
      entry.sells += 1;
      entry.received += BigInt(trade.solLamportsReceived || 0);
    }
    aggregates.set(key, entry);
  }

  const rows = [...aggregates.values()]
    .sort((a, b) => Number((b.received - b.spent) - (a.received - a.spent)))
    .slice(0, 12);

  if (rows.length === 0) {
    return "PnL / Results\n\nNo bot trade history yet. Buys and sells made from this bot will show here.";
  }

  return [
    "PnL / Results",
    "Realized SOL estimate from this bot's recorded buys/sells. Open token value is not included.",
    "",
    ...rows.map((row) => {
      const realized = row.received - row.spent;
      const sign = realized >= 0n ? "+" : "-";
      const abs = realized >= 0n ? realized : -realized;
      return [
        `${row.walletLabel} - ${shortMint(row.tokenMint)}`,
        `Buys/Sells: ${row.buys}/${row.sells}`,
        `Spent: ${lamportsToSol(Number(row.spent))} SOL`,
        `Received: ${lamportsToSol(Number(row.received))} SOL`,
        `Realized: ${sign}${lamportsToSol(Number(abs))} SOL`
      ].join("\n");
    })
  ].join("\n\n");
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

async function showBackupMenu(chatId) {
  await telegram("sendMessage", {
    chat_id: chatId,
    text: withBrandFooter("Backup and recovery tools:"),
    reply_markup: {
      inline_keyboard: [
        [{ text: "Export Backup", callback_data: "export_backup" }],
        [{ text: "Restore Backup", callback_data: "restore_backup" }],
        [{ text: "Rescue Backup Keys", callback_data: "rescue_backup_keys" }],
        [{ text: "Emergency Key Export", callback_data: "export_private_keys" }]
      ]
    }
  });
}

async function showHowToMenu(chatId) {
  await telegram("sendMessage", {
    chat_id: chatId,
    text: withBrandFooter([
      "How To Use This Bot",
      "",
      "Tap a section below to learn that part of the bot. Start with Wallet, Backup, and Trade if this is your first time.",
      "",
      "Basic flow:",
      "1. Create or import a wallet.",
      "2. Save the automatic backup file.",
      "3. Fund the wallet with enough SOL for buys plus network fees.",
      "4. Trade, track positions, then withdraw when ready."
    ].join("\n")),
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: howToMenuKeyboard() }
  });
}

async function showHowToPage(chatId, topic) {
  if (topic === "menu") {
    await showHowToMenu(chatId);
    return;
  }

  const page = howToPage(topic);
  if (!page) {
    await showHowToMenu(chatId);
    return;
  }

  await telegram("sendMessage", {
    chat_id: chatId,
    text: withBrandFooter(page.text),
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: howToPageKeyboard(page.openAction) }
  });
}

function howToMenuKeyboard() {
  return [
    [{ text: "💱 Trade", callback_data: "howto_trade" }],
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
        "- Buy: choose one wallet, paste the token mint, then tap a quick amount like Buy 0.10 SOL, Buy 0.50 SOL, Buy 1 SOL, Use Max, or Buy X SOL.",
        "- Sell: choose one wallet, paste the token mint, then tap Sell 25%, Sell 50%, Sell 100%, or Sell X %.",
        "- Auto Sell: buys now, then sells later by timer, take-profit, or stop-loss.",
        "- DCA Buy: splits one total SOL amount into smaller buys over time.",
        "- DCA Sell: captures the wallet's current token balance, then sells your chosen percent in smaller slices.",
        "- Positions: shows bot-tracked positions, PnL estimate, balances, and Dexscreener links.",
        "- Wallets: shows your wallet addresses as tap-to-copy address text.",
        "",
        "Important settings:",
        `- Safety reserve: the bot keeps about ${CONFIG.buyReserveSol} SOL per wallet for fees and token account creation.`,
        "- Slippage: default is usually fine. Raise it only if a token is moving fast or quotes fail from price movement.",
        "- Use Max: spends available SOL minus the safety reserve.",
        "- Confirm screen: always read token mint, wallet, amount, fee, and slippage before tapping Confirm.",
        "",
        "Best first trade:",
        "Use a small amount, confirm the token on Dexscreener, then try a sell before using larger size."
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
        "- Positions Overview: shows tokens held, estimated value when Jupiter can quote, and Dexscreener links.",
        "- PnL / Results: shows realized SOL from buys and sells recorded by this bot.",
        "- Close Empty Token Accounts: reclaims rent from empty SPL token accounts when possible.",
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
        "- Bundle Buy: paste token mint, choose wallets, choose SOL per wallet, choose slippage, confirm.",
        "- Bundle Sell: paste token mint, choose wallets, choose percent to sell, choose slippage, confirm.",
        "- DCA Buy: split a total SOL amount per selected wallet into scheduled smaller buys.",
        "- DCA Sell: split a selected percent per wallet into scheduled smaller sells.",
        "- Auto Sell / Timed Plan: buy now from selected wallets, then sell by timer, take-profit, or stop-loss.",
        "- Copy Trade: info/setup placeholder for a future wallet watcher.",
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
        "Tap Check Balances from the main menu. The bot checks one wallet at a time so it is less likely to hit RPC rate limits.",
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
        "- Sweep Tokens: sends SPL tokens from selected wallets to your destination wallet. You can sweep one mint or all tokens found.",
        "- Fund Wallets: sends SOL from one managed source wallet to selected managed target wallets.",
        "",
        "Withdraw SOL steps:",
        "1. Tap Withdrawal.",
        "2. Tap Withdraw SOL.",
        "3. Paste the destination wallet address.",
        "4. Choose wallet numbers or type all.",
        "5. Tap Confirm, or reply yes.",
        "",
        "Sweep Tokens steps:",
        "1. Paste destination wallet.",
        "2. Choose source wallet numbers or all.",
        "3. Paste one token mint, or type all.",
        "4. Tap Confirm, or reply yes.",
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
        "- Read the confirm screen before replying yes.",
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

async function showMenu(chatId, userId) {
  const state = await readState();
  const menu = isAdmin(userId) ? [...PUBLIC_MENU, ...ADMIN_MENU] : PUBLIC_MENU;
  await telegram("sendMessage", {
    chat_id: chatId,
    text: withBrandFooter(`${state.paused ? "Status: emergency stop active.\n\n" : ""}Choose a wallet operation:`),
    reply_markup: { inline_keyboard: menu }
  });
}

async function sendQuickAmountPrompt(chatId, text, options = {}) {
  const lastRow = options.allowMax
    ? [{ text: "Use Max", callback_data: "quick:max" }, { text: "Buy X SOL", callback_data: "quick:custom" }]
    : [{ text: "Buy X SOL", callback_data: "quick:custom" }];

  await telegram("sendMessage", {
    chat_id: chatId,
    text: withBrandFooter(text),
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [{ text: "Buy 0.10 SOL", callback_data: "quick:0.10" }, { text: "Buy 0.50 SOL", callback_data: "quick:0.50" }, { text: "Buy 1 SOL", callback_data: "quick:1" }],
        [{ text: "Buy 0.05 SOL", callback_data: "quick:0.05" }],
        lastRow
      ]
    }
  });
}

async function sendQuickPercentPrompt(chatId, text) {
  await telegram("sendMessage", {
    chat_id: chatId,
    text: withBrandFooter(text),
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [{ text: "Sell 25%", callback_data: "quick:25" }, { text: "Sell 50%", callback_data: "quick:50" }, { text: "Sell 100%", callback_data: "quick:100" }],
        [{ text: "Sell X %", callback_data: "quick:custom" }]
      ]
    }
  });
}

async function sendQuickSlippagePrompt(chatId, text) {
  await telegram("sendMessage", {
    chat_id: chatId,
    text: withBrandFooter(text),
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [{ text: "Default", callback_data: "quick:default" }, { text: "100 bps", callback_data: "quick:100" }],
        [{ text: "300 bps", callback_data: "quick:300" }, { text: "500 bps", callback_data: "quick:500" }],
        [{ text: "Custom", callback_data: "quick:custom" }]
      ]
    }
  });
}

async function sendQuickChoicePrompt(chatId, text, rows) {
  await telegram("sendMessage", {
    chat_id: chatId,
    text: withBrandFooter(text),
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        ...rows.map((row) => row.map((button) => ({
          text: button.text,
          callback_data: `quick:${button.value}`
        }))),
        [{ text: "Custom", callback_data: "quick:custom" }]
      ]
    }
  });
}

async function sendConfirmPrompt(chatId, text) {
  await telegram("sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ Confirm", callback_data: "quick:yes" }, { text: "Cancel", callback_data: "quick:cancel" }]
      ]
    }
  });
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
  const store = await readTradeHistory();
  store.trades.push(...events.map((event) => ({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...event
  })));
  await fs.writeFile(tradeHistoryPath(), JSON.stringify(store, null, 2));
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

function parsePositiveNumber(text) {
  const value = Number.parseFloat(text);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Amount must be greater than zero.");
  }
  return value;
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

function parseSlippage(text) {
  if (text.trim().toLowerCase() === "default") {
    return CONFIG.defaultSlippageBps;
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

function dexScreenerUrl(tokenMint) {
  return `https://dexscreener.com/solana/${tokenMint}`;
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

function formatFundConfirm(data) {
  return [
    "Confirm funding:",
    `Source wallet: ${data.sourceIndex}`,
    `Target wallets: ${data.targetIndexes.join(", ")}`,
    `Amount per wallet: ${data.amountSol} SOL`,
    "",
    "Reply `yes` to execute or `/cancel`."
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
      `Spend mode: MAX`,
      `Each wallet keeps safety reserve: ${CONFIG.buyReserveSol} SOL`,
      `Platform fee: ${formatFeeRate()} to ${CONFIG.feeWallet}`,
      `Slippage: ${data.slippageBps} bps`,
      "",
      "Reply `yes` to execute or `/cancel`."
    ].join("\n");
  }

  const amountLamports = solToLamports(data.amountSol);
  const feeLamports = calculateFeeLamports(amountLamports);
  const recommendedLamports = recommendedBuyFundingLamports(amountLamports);
  return [
    heading,
    `Token mint: ${data.tokenMint}`,
    walletLabel,
    `${data.tradeMode === "single" ? "Spend" : "Spend per wallet"}: ${data.amountSol} SOL`,
    `${data.tradeMode === "single" ? "Net swap" : "Net swap per wallet"}: ${lamportsToSol(amountLamports - feeLamports)} SOL`,
    `Platform fee: ${formatFeeRate()} to ${CONFIG.feeWallet}`,
    `${data.tradeMode === "single" ? "Recommended balance" : "Recommended balance per wallet"}: ${lamportsToSol(recommendedLamports)} SOL`,
    `Slippage: ${data.slippageBps} bps`,
    "",
    "Reply `yes` to execute or `/cancel`."
  ].join("\n");
}

function formatSellConfirm(data) {
  const heading = data.tradeMode === "single" ? "Confirm sell:" : "Confirm bundle sell:";
  const walletLabel = data.tradeMode === "single" && data.walletLabel ? `Wallet: ${data.walletLabel}` : `Wallets: ${data.walletIndexes.join(", ")}`;

  return [
    heading,
    `Token mint: ${data.tokenMint}`,
    walletLabel,
    `${data.tradeMode === "single" ? "Percent" : "Percent per wallet"}: ${data.percent}%`,
    `Platform fee: ${formatFeeRate()} of SOL output to ${CONFIG.feeWallet}`,
    `Slippage: ${data.slippageBps} bps`,
    "",
    "Reply `yes` to execute or `/cancel`."
  ].join("\n");
}

function formatTimedTradePlanConfirm(data) {
  const amountLamports = solToLamports(data.amountSol);
  const feeLamports = calculateFeeLamports(amountLamports);
  const walletLabel = data.tradeMode === "single" && data.walletLabel ? `Wallet: ${data.walletLabel}` : `Wallets: ${data.walletIndexes.join(", ")}`;
  return [
    "Confirm timed trade plan:",
    `Token mint: ${data.tokenMint}`,
    walletLabel,
    `${data.tradeMode === "single" ? "Buy" : "Buy per wallet"}: ${data.amountSol} SOL`,
    `Net buy before routing fees: ${lamportsToSol(amountLamports - feeLamports)} SOL`,
    `Sell timer: ${formatDelay(data.sellDelaySeconds)} after buy`,
    `Sell percent: ${data.sellPercent}%`,
    `Repeat cycles: ${data.loopCount || 1}x`,
    `Take-profit: ${data.takeProfitPct ? `+${data.takeProfitPct}%` : "off"}`,
    `Stop-loss: ${data.stopLossPct ? `-${data.stopLossPct}%` : "off"}`,
    `Slippage: ${data.slippageBps} bps`,
    "",
    "The bot buys now, then watches every few seconds while awake. If Render was asleep, it catches up when it wakes.",
    "Reply `yes` to execute or `/cancel`."
  ].join("\n");
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
      `Approx each order: ${lamportsToSol(Math.floor(totalLamports / data.orderCount))} SOL before fee split`,
      `Recommended balance per wallet: ${lamportsToSol(recommendedBuyFundingLamports(totalLamports))} SOL`
    );
  } else {
    lines.push(
      `Total percent to sell per wallet: ${data.totalPercent}%`,
      "The bot captures the current token balance at confirmation, then sells that amount in equal slices."
    );
  }

  lines.push(
    `Platform fee: ${formatFeeRate()} ${data.side === "buy" ? "of SOL input" : "of SOL output"} to ${CONFIG.feeWallet}`,
    "",
    "The first slice runs on the next runner tick, usually within 1 minute. If Render sleeps, it catches up when awake.",
    "Reply `yes` to execute or `/cancel`."
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
    "If the destination is brand new, the first transfer must be large enough to create it on-chain.",
    "",
    "Reply `yes` to execute or `/cancel`."
  ].join("\n");
}

function formatSweepTokensConfirm(data) {
  return [
    "Confirm token sweep:",
    `Destination: ${data.destination}`,
    `Wallets: ${data.walletIndexes.join(", ")}`,
    `Token mint: ${data.tokenMint}`,
    "",
    "Reply `yes` to execute or `/cancel`."
  ].join("\n");
}

function formatCloseAccountsConfirm(data) {
  return [
    "Confirm close empty token accounts:",
    `Wallets: ${data.walletIndexes.join(", ")}`,
    "",
    "Reply `yes` to execute or `/cancel`."
  ].join("\n");
}

async function confirmOrCancel(chatId, text, onConfirm, options = {}) {
  if (text.trim().toLowerCase() !== "yes") {
    await say(chatId, "Reply `yes` to confirm, or `/cancel` to stop this flow.");
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
