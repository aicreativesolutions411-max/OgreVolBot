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
const sessions = new Map();
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const SOL_MINT = "So11111111111111111111111111111111111111112";

const PUBLIC_MENU = [
  [{ text: "Start Here / Requirements", callback_data: "quick_start" }],
  [{ text: "Create Wallet Set", callback_data: "create_wallets" }],
  [{ text: "Import Wallet", callback_data: "import_wallet" }],
  [{ text: "My Wallets", callback_data: "list_wallets" }],
  [{ text: "Check Balances", callback_data: "check_balances" }],
  [{ text: "Backup / Restore", callback_data: "backup_menu" }],
  [{ text: "Fund Wallets", callback_data: "fund_wallets" }],
  [{ text: "Bundle Buy Token", callback_data: "batch_buy" }],
  [{ text: "Bundle Sell Token", callback_data: "batch_sell" }],
  [{ text: "Withdraw SOL", callback_data: "sweep_sol" }],
  [{ text: "Sweep Tokens", callback_data: "sweep_tokens" }],
  [{ text: "Close Empty Token Accounts", callback_data: "close_empty_accounts" }],
  [{ text: "Volume Alerts", callback_data: "volume_alerts" }]
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
  "list_wallets",
  "check_balances",
  "quick_start",
  "backup_menu",
  "export_backup",
  "export_private_keys",
  "restore_backup",
  "fund_wallets",
  "batch_buy",
  "batch_sell",
  "sweep_sol",
  "sweep_tokens",
  "close_empty_accounts"
]);

async function main() {
  await ensureDataFiles();
  startHealthServer();
  startKeepAlivePinger();

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
  const bundleConcurrency = Number.parseInt(process.env.BUNDLE_CONCURRENCY || "1", 10);
  const buyReserveSol = Number.parseFloat(process.env.BUY_RESERVE_SOL || "0.01");
  const rpcDelayMs = Number.parseInt(process.env.RPC_DELAY_MS || "800", 10);
  const rpcRetries = Number.parseInt(process.env.RPC_RETRIES || "8", 10);

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
    keepAliveIntervalMinutes: Number.parseInt(process.env.KEEPALIVE_INTERVAL_MINUTES || "10", 10),
    adminUserIds: parseAllowedUserIds(process.env.TELEGRAM_ADMIN_USER_IDS || process.env.TELEGRAM_ALLOWED_USER_IDS || ""),
    jupiterApiKey: process.env.JUPITER_API_KEY || "",
    jupiterApiBase: (process.env.JUPITER_API_BASE || "https://api.jup.ag/swap/v2").replace(/\/$/, ""),
    feeWallet,
    bundleFeeBps,
    bundleConcurrency,
    buyReserveLamports: solToLamports(buyReserveSol),
    buyReserveSol,
    rpcDelayMs,
    rpcRetries,
    defaultSlippageBps: Number.parseInt(process.env.DEFAULT_SLIPPAGE_BPS || "100", 10),
    priorityFeeLamports: Number.parseInt(process.env.PRIORITY_FEE_LAMPORTS || "0", 10)
  };
}

function startKeepAlivePinger() {
  if (!CONFIG.keepAliveEnabled) return;

  if (!CONFIG.keepAliveUrl) {
    console.warn("KEEPALIVE_ENABLED=true but KEEPALIVE_URL and TELEGRAM_WEBHOOK_URL are empty. Keep-alive pinger is disabled.");
    return;
  }

  const intervalMinutes = Math.min(Math.max(CONFIG.keepAliveIntervalMinutes, 5), 14);
  const intervalMs = intervalMinutes * 60 * 1000;
  const target = `${CONFIG.keepAliveUrl}/healthz`;

  const ping = async () => {
    try {
      const response = await fetch(target, {
        headers: { "User-Agent": "solana-telegram-wallet-ops-bot-keepalive" }
      });
      console.log(`Keep-alive ping ${target}: ${response.status}`);
    } catch (error) {
      console.warn(`Keep-alive ping failed: ${error.message}`);
    }
  };

  console.log(`Keep-alive pinger enabled. Pinging ${target} every ${intervalMinutes} minute(s).`);
  setTimeout(ping, 30_000);
  setInterval(ping, intervalMs);
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
    if (request.url === "/" || request.url === "/healthz") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({
        ok: true,
        service: "solana-telegram-wallet-ops-bot",
        uptimeSeconds: Math.round(process.uptime())
      }));
      return;
    }

    if (request.method === "POST" && request.url === webhookPath()) {
      if (CONFIG.webhookSecret && request.headers["x-telegram-bot-api-secret-token"] !== CONFIG.webhookSecret) {
        response.writeHead(403, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ ok: false, error: "forbidden" }));
        return;
      }

      try {
        const update = JSON.parse(await readRequestBody(request));
        await handleUpdate(update);
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ ok: true }));
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

  if (await isPausedActionBlocked(query.data)) {
    await say(chatId, "Emergency stop is active. Use Unlock Bot to re-enable transaction flows.");
    return;
  }

  switch (query.data) {
    case "quick_start":
      await say(chatId, quickStartText());
      break;
    case "backup_menu":
      await showBackupMenu(chatId);
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
      await say(chatId, "Paste your encrypted backup text, or upload the backup .txt file I sent you.");
      break;
    case "fund_wallets":
      setSession(chatId, "fund_source", userId);
      await say(chatId, await walletPrompt(userId, "Send the source wallet number. This source must be one of your managed wallets."));
      break;
    case "batch_buy":
      setSession(chatId, "buy_token", userId);
      await say(chatId, "Send the token mint address you want to buy.");
      break;
    case "batch_sell":
      setSession(chatId, "sell_token", userId);
      await say(chatId, "Send the token mint address you want to sell from all selected wallets.");
      break;
    case "volume_alerts":
      await say(chatId, [
        "Volume Alerts are the safe version of this feature.",
        "",
        "I can track real volume spikes, trending moves, and watched-token activity.",
        "I cannot run repeated buy/sell loops to manufacture volume."
      ].join("\n"));
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

async function handleMessage(message, userId) {
  const chatId = message.chat.id;
  const text = (message.text || "").trim();
  const session = sessions.get(chatId);

  if (message.document && session?.step === "restore_backup" && String(session.userId) === String(userId)) {
    const backupText = await fetchTelegramFileText(message.document.file_id);
    await continueFlow(chatId, backupText, session);
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

  if (text === "/balances" || text === "/balance") {
    if (!isPrivateChat(message.chat)) {
      await say(chatId, "Open this bot in DM to check wallet balances.");
      return;
    }
    await showWalletBalances(chatId, userId);
    return;
  }

  if (text === "/bundle" || text === "/buy") {
    if (!isPrivateChat(message.chat)) {
      await say(chatId, "Open this bot in DM to use bundle buy.");
      return;
    }
    setSession(chatId, "buy_token", userId);
    await say(chatId, "Send the token mint address you want to bundle buy.");
    return;
  }

  if (text === "/sell") {
    if (!isPrivateChat(message.chat)) {
      await say(chatId, "Open this bot in DM to use bundle sell.");
      return;
    }
    setSession(chatId, "sell_token", userId);
    await say(chatId, "Send the token mint address you want to bundle sell.");
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

  if ((await readState()).paused && session.step !== "unlock_confirm") {
    clearSession(chatId);
    await say(chatId, "Emergency stop is active. Current flow canceled.");
    return;
  }

  await continueFlow(chatId, text, session);
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
        await say(chatId, formatFundConfirm(session.data));
        break;
      case "fund_confirm":
        await confirmOrCancel(chatId, text, () => fundWalletsFlow(chatId, session));
        break;
      case "buy_token":
        session.data.tokenMint = parsePublicKey(text).toBase58();
        session.step = "buy_wallets";
        await say(chatId, await walletPrompt(session.userId, "Send buyer wallet numbers separated by commas, or `all`."));
        break;
      case "buy_wallets":
        session.data.walletIndexes = await parseWalletSelection(text, session.userId);
        session.step = "buy_amount";
        await say(chatId, [
          "Send SOL amount to spend per wallet.",
          "",
          "Examples:",
          "- `0.05` means spend 0.05 SOL from each selected wallet",
          "- `max` means use each wallet's available SOL except the safety reserve",
          "",
          `Safety reserve kept for fees: ${CONFIG.buyReserveSol} SOL per wallet`
        ].join("\n"));
        break;
      case "buy_amount":
        if (["max", "all"].includes(text.trim().toLowerCase())) {
          session.data.amountMode = "max";
        } else {
          session.data.amountMode = "fixed";
          session.data.amountSol = parsePositiveNumber(text);
        }
        session.step = "buy_slippage";
        await say(chatId, `Send slippage in basis points, or type default for ${CONFIG.defaultSlippageBps} bps.`);
        break;
      case "buy_slippage":
        session.data.slippageBps = parseSlippage(text);
        session.step = "buy_confirm";
        await say(chatId, formatBuyConfirm(session.data));
        break;
      case "buy_confirm":
        await confirmOrCancel(chatId, text, () => batchBuyFlow(chatId, session));
        break;
      case "sell_token":
        session.data.tokenMint = parsePublicKey(text).toBase58();
        session.step = "sell_wallets";
        await say(chatId, await walletPrompt(session.userId, "Send seller wallet numbers separated by commas, or `all`."));
        break;
      case "sell_wallets":
        session.data.walletIndexes = await parseWalletSelection(text, session.userId);
        session.step = "sell_percent";
        await say(chatId, `${await selectedTokenBalanceSummary(session.userId, session.data.walletIndexes, session.data.tokenMint)}\n\nSend percent to sell from each wallet, from 1 to 100.`);
        break;
      case "sell_percent":
        session.data.percent = parsePercent(text);
        session.step = "sell_slippage";
        await say(chatId, `Send slippage in basis points, or type default for ${CONFIG.defaultSlippageBps} bps.`);
        break;
      case "sell_slippage":
        session.data.slippageBps = parseSlippage(text);
        session.step = "sell_confirm";
        await say(chatId, formatSellConfirm(session.data));
        break;
      case "sell_confirm":
        await confirmOrCancel(chatId, text, () => batchSellFlow(chatId, session));
        break;
      case "sweep_sol_destination":
        session.data.destination = parsePublicKey(text).toBase58();
        session.step = "sweep_sol_wallets";
        await say(chatId, await walletPrompt(session.userId, "Send wallet numbers to sweep, separated by commas, or `all`."));
        break;
      case "sweep_sol_wallets":
        session.data.walletIndexes = await parseWalletSelection(text, session.userId);
        session.step = "sweep_sol_confirm";
        await say(chatId, formatSweepSolConfirm(session.data));
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
        await say(chatId, formatSweepTokensConfirm(session.data));
        break;
      case "sweep_tokens_confirm":
        await confirmOrCancel(chatId, text, () => sweepTokensFlow(chatId, session));
        break;
      case "close_empty_accounts_wallets":
        session.data.walletIndexes = await parseWalletSelection(text, session.userId);
        session.step = "close_empty_accounts_confirm";
        await say(chatId, formatCloseAccountsConfirm(session.data));
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

  for (let index = 1; index <= count; index += 1) {
    const keypair = Keypair.generate();
    const label = `${session.data.label} ${index}`;
    store.wallets.push(walletRecord(label, keypair, session.userId));
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
  await sendAutomaticWalletBackup(chatId, session.userId, "Automatic backup after wallet creation.");
  await showMenu(chatId, session.userId);
}

async function importWalletFlow(chatId, text, session) {
  const keypair = keypairFromSecret(text);
  const store = await readWalletStore();
  store.wallets.push(walletRecord(session.data.label, keypair, session.userId));
  await writeWalletStore(store);

  await audit("import_wallet", {
    chatId,
    userId: session.userId,
    label: session.data.label,
    publicKey: keypair.publicKey.toBase58()
  });

  clearSession(chatId);
  await say(chatId, `Imported wallet ${session.data.label}: ${keypair.publicKey.toBase58()}`);
  await sendAutomaticWalletBackup(chatId, session.userId, "Automatic backup after wallet import.");
  await showMenu(chatId, session.userId);
}

async function exportWalletBackup(chatId, userId) {
  const sent = await sendWalletBackup(chatId, userId, "Manual backup export.");
  if (!sent) return;
  await say(chatId, "Backup exported. Keep this file private. It is encrypted with this bot's APP_SECRET, so restore only works if APP_SECRET stays the same.");
}

async function sendAutomaticWalletBackup(chatId, userId, note) {
  try {
    await sendWalletBackup(chatId, userId, note);
    await say(chatId, "I sent you an automatic encrypted wallet backup. Keep that file private. If Render Free resets, use Restore Backup with that file.");
  } catch (error) {
    await say(chatId, `Automatic backup failed: ${formatError(error)}. Use Export Backup before funding wallets.`);
  }
}

async function sendWalletBackup(chatId, userId, note) {
  const store = await readWalletStore();
  const wallets = walletsForOwner(store, userId);

  if (wallets.length === 0) {
    await say(chatId, "You do not have any wallets to back up yet.");
    return false;
  }

  const backup = encodeBackup({
    version: 1,
    createdAt: new Date().toISOString(),
    note,
    walletCount: wallets.length,
    wallets: wallets.map((wallet) => ({
      label: wallet.label,
      publicKey: wallet.publicKey,
      secret: wallet.secret
    }))
  });

  await sendDocument(
    chatId,
    `wallet-backup-${userId}-${new Date().toISOString().slice(0, 10)}.txt`,
    backup
  );
  return true;
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
    `emergency-private-keys-${userId}-${new Date().toISOString().slice(0, 10)}.txt`,
    lines.join("\n")
  );

  await audit("export_private_keys", {
    chatId,
    userId,
    walletCount: wallets.length
  });

  await say(chatId, "Emergency private key file sent. Delete it after importing/recovering funds. Do not share it with anyone.");
}

async function restoreWalletBackupFlow(chatId, text, session) {
  const backup = decodeBackup(text);
  if (backup.version !== 1 || !Array.isArray(backup.wallets)) {
    throw new Error("Backup format is not valid.");
  }

  const store = await readWalletStore();
  const existing = new Set(walletsForOwner(store, session.userId).map((wallet) => wallet.publicKey));
  const restored = [];
  let skipped = 0;

  for (const wallet of backup.wallets) {
    if (!wallet?.secret || !wallet?.publicKey) {
      skipped += 1;
      continue;
    }

    const keypair = decryptWallet({ secret: wallet.secret });
    const publicKey = keypair.publicKey.toBase58();
    if (publicKey !== wallet.publicKey) {
      skipped += 1;
      continue;
    }

    if (existing.has(publicKey)) {
      skipped += 1;
      continue;
    }

    store.wallets.push({
      ownerId: session.userId,
      label: cleanLabel(wallet.label || "Restored Wallet"),
      publicKey,
      secret: wallet.secret
    });
    existing.add(publicKey);
    restored.push(publicKey);
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
    await sendAutomaticWalletBackup(chatId, session.userId, "Automatic backup after wallet restore.");
  }
  await showMenu(chatId, session.userId);
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
    } catch (error) {
      results.push(`${wallet.label}: failed - ${friendlyError(error)}`);
    }
  });

  await audit("batch_buy_token", {
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
  await say(chatId, `Batch buy complete:\n\n${results.join("\n")}`);
  await showMenu(chatId, session.userId);
}

async function batchSellFlow(chatId, session) {
  const store = await readWalletStore();
  const wallets = session.data.walletIndexes.map((index) => getWalletAt(store, index, session.userId));
  const results = [];

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
    } catch (error) {
      results.push(`${wallet.label}: failed - ${friendlyError(error)}`);
    }
  });

  await audit("batch_sell_token", {
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
  await say(chatId, `Batch sell complete:\n\n${results.join("\n")}`);
  await showMenu(chatId, session.userId);
}

async function sweepSolFlow(chatId, session) {
  const store = await readWalletStore();
  const destination = new PublicKey(session.data.destination);
  const results = [];

  for (const wallet of session.data.walletIndexes.map((index) => getWalletAt(store, index, session.userId))) {
    try {
      const keypair = decryptWallet(wallet);
      const balance = await rpcWithRetry("get SOL balance", () => connection.getBalance(keypair.publicKey, "confirmed"));

      if (balance <= 0) {
        results.push(`${wallet.label}: no sweepable SOL`);
        continue;
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
        results.push(`${wallet.label}: no sweepable SOL after network fee`);
        continue;
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
      results.push(`${wallet.label}: ${lamportsToSol(sendableLamports)} SOL drained, fee ${lamportsToSol(feeLamports)} SOL, ${signature}`);
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
    throw new Error("Missing JUPITER_API_KEY. Batch buy/sell requires a Jupiter API key.");
  }

  const orderUrl = new URL(`${CONFIG.jupiterApiBase}/order`);
  orderUrl.searchParams.set("inputMint", inputMint);
  orderUrl.searchParams.set("outputMint", outputMint);
  orderUrl.searchParams.set("amount", String(amount));
  orderUrl.searchParams.set("taker", signer.publicKey.toBase58());
  orderUrl.searchParams.set("slippageBps", String(slippageBps));
  if (CONFIG.priorityFeeLamports > 0) {
    orderUrl.searchParams.set("priorityFeeLamports", String(CONFIG.priorityFeeLamports));
  }

  const order = await fetchJson(orderUrl, {
    headers: jupiterHeaders()
  });

  if (!order?.transaction) {
    throw new Error(order?.errorMessage || order?.error || "Jupiter could not build a quote/order. Check the token mint, liquidity, slippage, API key/rate limits, and wallet SOL balance.");
  }

  const tx = VersionedTransaction.deserialize(Buffer.from(order.transaction, "base64"));
  tx.sign([signer]);

  const execute = await fetchJson(`${CONFIG.jupiterApiBase}/execute`, {
    method: "POST",
    headers: jupiterHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      signedTransaction: Buffer.from(tx.serialize()).toString("base64"),
      requestId: order.requestId,
      lastValidBlockHeight: order.lastValidBlockHeight
    })
  });

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

function jupiterHeaders(extra = {}) {
  return {
    ...extra,
    "x-api-key": CONFIG.jupiterApiKey
  };
}

async function sendLegacyTransaction(tx, signers, options = {}) {
  const { blockhash, lastValidBlockHeight } = options.latestBlockhash || await rpcWithRetry("get latest blockhash", () => connection.getLatestBlockhash("confirmed"));
  tx.recentBlockhash = blockhash;
  tx.feePayer = signers[0].publicKey;
  tx.sign(...signers);
  const signature = await rpcWithRetry("send raw transaction", () => connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    maxRetries: 3
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
  const accounts = await getOwnedTokenAccounts(owner);
  return accounts.find((account) => account.mint === mint.toBase58()) || null;
}

async function getMintDecimals(mint) {
  const response = await connection.getParsedAccountInfo(mint, "confirmed");
  const data = response.value?.data;
  const decimals = data && "parsed" in data ? data.parsed?.info?.decimals : null;

  if (!Number.isInteger(decimals)) {
    throw new Error(`Could not read decimals for mint ${mint.toBase58()}.`);
  }

  return decimals;
}

async function getOwnedTokenAccounts(owner) {
  const responses = [];
  responses.push(await rpcWithRetry("get SPL token accounts", () => connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }, "confirmed")));
  await sleep(CONFIG.rpcDelayMs);
  responses.push(await rpcWithRetry("get Token-2022 accounts", () => connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID }, "confirmed")));

  return responses.flatMap((response, index) => {
    const tokenProgramId = index === 0 ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;

    return response.value.map((item) => {
      const parsed = item.account.data.parsed.info;
      const amount = parsed.tokenAmount;

      return {
        pubkey: item.pubkey.toBase58(),
        mint: parsed.mint,
        tokenProgramId: tokenProgramId.toBase58(),
        rawAmount: BigInt(amount.amount),
        uiAmount: amount.uiAmountString || "0"
      };
    });
  });
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

  const lines = wallets.map((wallet, index) => `${index + 1}. ${wallet.label}\n${wallet.publicKey}`);
  await say(chatId, `Your managed wallets:\n\n${lines.join("\n\n")}`);
}

async function showWalletBalances(chatId, userId) {
  const store = await readWalletStore();
  const wallets = walletsForOwner(store, userId);

  if (wallets.length === 0) {
    await say(chatId, "You do not have any managed wallets yet.");
    return;
  }

  const lines = [];

  await runWithConcurrency(wallets, 4, async (wallet, index) => {
    try {
      const keypair = decryptWallet(wallet);
      const balance = await rpcWithRetry("get wallet SOL balance", () => connection.getBalance(keypair.publicKey, "confirmed"));
      await sleep(CONFIG.rpcDelayMs);
      const tokenAccounts = await getOwnedTokenAccounts(keypair.publicKey);
      const nonZeroTokens = tokenAccounts.filter((account) => account.rawAmount > 0n);
      const tokenPreview = nonZeroTokens
        .slice(0, 4)
        .map((account) => `${shortMint(account.mint)}: ${account.uiAmount}`)
        .join("\n  ");
      const more = nonZeroTokens.length > 4 ? `\n  +${nonZeroTokens.length - 4} more token account(s)` : "";

      lines[index] = [
        `${index + 1}. ${wallet.label}`,
        `${wallet.publicKey}`,
        `SOL: ${lamportsToSol(balance)}`,
        nonZeroTokens.length ? `Tokens:\n  ${tokenPreview}${more}` : "Tokens: none"
      ].join("\n");
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

  await runWithConcurrency(walletIndexes, 4, async (walletIndex, resultIndex) => {
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

async function showBackupMenu(chatId) {
  await telegram("sendMessage", {
    chat_id: chatId,
    text: "Backup and recovery tools:",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Export Backup", callback_data: "export_backup" }],
        [{ text: "Restore Backup", callback_data: "restore_backup" }],
        [{ text: "Emergency Key Export", callback_data: "export_private_keys" }]
      ]
    }
  });
}

function quickStartText() {
  return [
    "Start Here",
    "",
    "1. Create Wallet Set",
    "Make the wallets you want the bot to control.",
    "",
    "2. Save Backup",
    "The bot automatically sends a backup after wallet creation/import. Keep it private.",
    "",
    "3. Fund Wallets",
    `Each buy wallet needs buy amount + about ${CONFIG.buyReserveSol} SOL for fees/reserve.`,
    "",
    "4. Bundle Buy",
    "Enter token mint, wallets, then amount. Type `max` to use all available SOL except the safety reserve.",
    "",
    "5. Bundle Sell",
    "The bot checks token balances first. If a wallet shows 0, it cannot sell that token.",
    "",
    "6. Withdraw SOL",
    "Use Withdraw SOL to send SOL out. Latest version drains balance - network fee to avoid rent errors.",
    "",
    "Common errors:",
    "- RPC rate limit: wait, select fewer wallets, or use paid/private SOLANA_RPC_URL.",
    "- No quote: token has no Jupiter route/liquidity, wrong mint, amount too small, or slippage too low.",
    "- Not enough SOL: add SOL or type `max` in the buy amount step."
  ].join("\n");
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
    text: `${state.paused ? "Status: emergency stop active.\n\n" : ""}Choose a wallet operation:`,
    reply_markup: { inline_keyboard: menu }
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
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.error || data.description || `HTTP ${response.status}`);
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

function encodeBackup(value) {
  return Buffer.from(JSON.stringify(value), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBackup(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }

  const compact = trimmed.replace(/\s+/g, "");
  const base64 = compact.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
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

function recommendedBuyFundingLamports(amountLamports) {
  return amountLamports + CONFIG.buyReserveLamports;
}

function lamportsToSol(lamports) {
  return (lamports / LAMPORTS_PER_SOL).toFixed(9).replace(/0+$/, "").replace(/\.$/, "");
}

function formatFeeRate() {
  return `${(CONFIG.bundleFeeBps / 100).toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}%`;
}

function shortMint(value) {
  const text = String(value);
  return text.length > 12 ? `${text.slice(0, 4)}...${text.slice(-4)}` : text;
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
  if (data.amountMode === "max") {
    return [
      "Confirm bundle buy:",
      `Token mint: ${data.tokenMint}`,
      `Wallets: ${data.walletIndexes.join(", ")}`,
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
    "Confirm bundle buy:",
    `Token mint: ${data.tokenMint}`,
    `Wallets: ${data.walletIndexes.join(", ")}`,
    `Spend per wallet: ${data.amountSol} SOL`,
    `Net swap per wallet: ${lamportsToSol(amountLamports - feeLamports)} SOL`,
    `Platform fee: ${formatFeeRate()} to ${CONFIG.feeWallet}`,
    `Recommended balance per wallet: ${lamportsToSol(recommendedLamports)} SOL`,
    `Slippage: ${data.slippageBps} bps`,
    "",
    "Reply `yes` to execute or `/cancel`."
  ].join("\n");
}

function formatSellConfirm(data) {
  return [
    "Confirm bundle sell:",
    `Token mint: ${data.tokenMint}`,
    `Wallets: ${data.walletIndexes.join(", ")}`,
    `Percent per wallet: ${data.percent}%`,
    `Platform fee: ${formatFeeRate()} of SOL output to ${CONFIG.feeWallet}`,
    `Slippage: ${data.slippageBps} bps`,
    "",
    "Reply `yes` to execute or `/cancel`."
  ].join("\n");
}

function formatSweepSolConfirm(data) {
  return [
    "Confirm SOL sweep:",
    `Destination: ${data.destination}`,
    `Wallets: ${data.walletIndexes.join(", ")}`,
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
  const allowedWhilePaused = new Set(["list_wallets", "export_audit", "emergency_stop", "unlock_bot"]);
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
    return "RPC rate limit. Try again in a minute, reduce selected wallets, or use a paid/private SOLANA_RPC_URL.";
  }

  if (/failed to get quote|could not build a quote|quote\/order|No routes/i.test(message)) {
    return "No Jupiter route/quote. Check token mint, liquidity, amount size, slippage, and wallet SOL balance.";
  }

  if (/insufficient funds for rent/i.test(message)) {
    return "Not enough SOL after fees/rent. Use Withdraw SOL on the latest version, or keep about 0.001 SOL behind on old versions.";
  }

  if (/insufficient funds|custom program error: 0x1/i.test(message)) {
    return "Not enough SOL for swap plus network fees. Add SOL, use a smaller amount, or type max in the buy amount step.";
  }

  return message;
}

async function rpcWithRetry(label, operation, retries = CONFIG.rpcRetries) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableRpcError(error) || attempt === retries) break;
      const delayMs = CONFIG.rpcDelayMs * (attempt + 1);
      console.warn(`${label} failed with a retryable RPC error. Retrying in ${delayMs}ms.`);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

function isRetryableRpcError(error) {
  const message = formatError(error);
  return message.includes("429") || /too many requests/i.test(message) || /rate limit/i.test(message);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
