import crypto from "node:crypto";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bs58 from "bs58";
import sharp from "sharp";
import {
  classifySlimeScopePair,
  computeBestPickScore,
  formatLivePairAge as formatLivePairAgeFromData,
  isGraduatedSlimeScopePair,
  isLivePairInBucket as isLivePairInBucketWindow,
  livePairBucketLabel as livePairBucketLabelCore,
  normalizeLivePairBucket as normalizeLivePairBucketCore,
  normalizePairTimestamp,
  pairAgeMinutes as pairAgeMinutesFromData,
  slimeScopeProgressPct,
  sortLivePairs
} from "./lib/liveTerminal.js";
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
let sniperCandidatesCache = { cachedAt: 0, value: [] };
const dexSearchCandidatesCache = new Map();
let photonNewPairsCache = { cachedAt: 0, value: [] };
let manualLaunchCandidatesCache = { cachedAt: 0, value: [] };
let livePairsSharedCache = new Map();
const solanaTrackerCache = new Map();
const madeOnSolCache = new Map();
const webLoginAttemptLimits = new Map();
const startedAt = new Date();
const WEB_LOGIN_CODE_TTL_MS = 10 * 60 * 1000;
const WEB_STATIC_DIR = path.resolve(__dirname, "..", "web", "dist");
const WEB_AVATAR_MAX_BYTES = 160 * 1024;
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
const AUTOSNIPE_TAKE_PROFIT_PCT = 25;
const AUTOSNIPE_STOP_LOSS_PCT = 8;
const AUTOSNIPE_SLIPPAGE_BPS = 400;
const AUTOSNIPE_SELL_DELAY_SECONDS = 300;
const PUMPSNIPE_TAKE_PROFIT_PCT = 40;
const PUMPSNIPE_STOP_LOSS_PCT = 8;
const PUMPSNIPE_SLIPPAGE_BPS = 300;
const PUMPSNIPE_SELL_DELAY_SECONDS = 180;
const DEFAULT_MANUAL_LAUNCH_SCAN_INTERVAL_MS = 1500;
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
  [{ text: "Web App", callback_data: "web_portal" }],
  [{ text: "KOL Tracker", callback_data: "kol_tracker_menu" }],
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
  "sniper_manual_launch",
  "manual_launch_watches",
  "sniper_modes",
  "sniper_mode_safe",
  "sniper_mode_smart",
  "sniper_mode_fast",
  "sniper_mode_pumpsnipe",
  "sniper_mode_moonshot",
  "sniper_mode_meme",
  "sniper_mode_ai",
  "sniper_mode_long",
  "kol_tracker_menu",
  "kol_scan_hot",
  "kol_scan_top",
  "kol_scan_consistent",
  "kol_scan_fresh",
  "kol_scan_wallet",
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
  "verify_backup_file",
  "rescue_backup_keys",
  "web_portal",
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
  const bundleFeeBps = Number.parseInt(process.env.TRADE_FEE_BPS || process.env.BUNDLE_FEE_BPS || "65", 10);
  const referralFeeBps = Number.parseInt(process.env.REFERRAL_FEE_BPS || "15", 10);
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
  const manualLaunchScanIntervalMs = Number.parseInt(process.env.MANUAL_LAUNCH_SCAN_INTERVAL_MS || String(DEFAULT_MANUAL_LAUNCH_SCAN_INTERVAL_MS), 10);
  const webSessionTtlHours = Number.parseInt(process.env.WEB_SESSION_TTL_HOURS || "720", 10);
  const solanaTrackerKolLimit = Number.parseInt(process.env.SOLANA_TRACKER_KOL_LIMIT || "12", 10);
  const solanaTrackerCacheTtlMs = Number.parseInt(process.env.SOLANA_TRACKER_CACHE_TTL_MS || "15000", 10);
  const solanaTrackerKolCacheTtlMs = Number.parseInt(process.env.SOLANA_TRACKER_KOL_CACHE_TTL_MS || "120000", 10);
  const solanaTrackerKolSignalLookups = Number.parseInt(process.env.SOLANA_TRACKER_KOL_SIGNAL_LOOKUPS || "2", 10);
  const solanaTrackerKolPositionLimit = Number.parseInt(process.env.SOLANA_TRACKER_KOL_POSITION_LIMIT || "4", 10);
  const solanaTrackerKolPositionConcurrency = Number.parseInt(process.env.SOLANA_TRACKER_KOL_POSITION_CONCURRENCY || "1", 10);
  const solanaTrackerKolUsePeriodEndpoint = parseBoolean(process.env.SOLANA_TRACKER_KOL_USE_PERIOD_ENDPOINT || "false");
  const kolCopyScanIntervalMs = Number.parseInt(process.env.KOL_COPY_SCAN_INTERVAL_MS || "30000", 10);
  const madeOnSolKolLimit = Number.parseInt(process.env.MADE_ON_SOL_KOL_LIMIT || "10", 10);
  const madeOnSolCacheTtlMs = Number.parseInt(process.env.MADE_ON_SOL_CACHE_TTL_MS || "900000", 10);
  const kolUseSolanaTrackerFallback = parseBoolean(process.env.KOL_USE_SOLANA_TRACKER_FALLBACK || "false");
  const livePairsRpcSafety = parseBoolean(process.env.LIVE_PAIRS_RPC_SAFETY || "false");
  const livePairsRefreshSeconds = Number.parseInt(process.env.LIVE_PAIRS_REFRESH_SECONDS || "4", 10);
  const livePairsSharedCacheMs = Number.parseInt(process.env.LIVE_PAIRS_SHARED_CACHE_MS || "4000", 10);
  const livePairsImageEnrich = parseBoolean(process.env.LIVE_PAIRS_IMAGE_ENRICH || "true");
  const minExitMarketCapUsd = Number.parseInt(process.env.MIN_EXIT_MARKET_CAP_USD || "2000", 10);
  const minExitLiquidityUsd = Number.parseInt(process.env.MIN_EXIT_LIQUIDITY_USD || "250", 10);
  const stopLossCheckIntervalMs = Number.parseInt(process.env.STOP_LOSS_CHECK_INTERVAL_MS || "2000", 10);
  const stopLossTriggerBufferPct = Number.parseFloat(process.env.STOP_LOSS_TRIGGER_BUFFER_PCT || "1.5");
  const stopLossExitSlippageBps = Number.parseInt(process.env.STOP_LOSS_EXIT_SLIPPAGE_BPS || "1500", 10);
  const stopLossMonitorSlippageBps = Number.parseInt(process.env.STOP_LOSS_MONITOR_SLIPPAGE_BPS || "2500", 10);
  const pumpLaunchBodyLimitBytes = Number.parseInt(process.env.PUMP_LAUNCH_BODY_LIMIT_BYTES || "12000000", 10);
  const pumpLaunchRequestMode = (process.env.PUMP_LAUNCH_REQUEST_MODE || "multipart").trim().toLowerCase();
  const workerTickEnabled = parseBoolean(process.env.WORKER_TICK_ENABLED || (process.env.WORKER_SECRET ? "true" : "false"));
  const workerTickRunTradePlans = parseBoolean(process.env.WORKER_TICK_RUN_TRADE_PLANS || "true");
  const workerTickRunDcaPlans = parseBoolean(process.env.WORKER_TICK_RUN_DCA_PLANS || "true");
  const workerTickWarmFeeds = parseBoolean(process.env.WORKER_TICK_WARM_FEEDS || "true");
  const workerSecret = process.env.WORKER_SECRET || "";

  if (!Number.isInteger(bundleFeeBps) || bundleFeeBps < 0 || bundleFeeBps > 1000) {
    throw new Error("TRADE_FEE_BPS/BUNDLE_FEE_BPS must be an integer from 0 to 1000.");
  }

  if (!Number.isInteger(referralFeeBps) || referralFeeBps < 0 || referralFeeBps > bundleFeeBps) {
    throw new Error("REFERRAL_FEE_BPS must be an integer from 0 through TRADE_FEE_BPS/BUNDLE_FEE_BPS.");
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

  if (!Number.isInteger(manualLaunchScanIntervalMs) || manualLaunchScanIntervalMs < 500 || manualLaunchScanIntervalMs > 30_000) {
    throw new Error("MANUAL_LAUNCH_SCAN_INTERVAL_MS must be an integer from 500 to 30000.");
  }

  if (!Number.isInteger(webSessionTtlHours) || webSessionTtlHours < 1 || webSessionTtlHours > 720) {
    throw new Error("WEB_SESSION_TTL_HOURS must be an integer from 1 to 720.");
  }

  if (!Number.isInteger(solanaTrackerKolLimit) || solanaTrackerKolLimit < 3 || solanaTrackerKolLimit > 50) {
    throw new Error("SOLANA_TRACKER_KOL_LIMIT must be an integer from 3 to 50.");
  }

  if (!Number.isInteger(solanaTrackerCacheTtlMs) || solanaTrackerCacheTtlMs < 0 || solanaTrackerCacheTtlMs > 300_000) {
    throw new Error("SOLANA_TRACKER_CACHE_TTL_MS must be an integer from 0 to 300000.");
  }

  if (!Number.isInteger(solanaTrackerKolCacheTtlMs) || solanaTrackerKolCacheTtlMs < 15_000 || solanaTrackerKolCacheTtlMs > 900_000) {
    throw new Error("SOLANA_TRACKER_KOL_CACHE_TTL_MS must be an integer from 15000 to 900000.");
  }

  if (!Number.isInteger(solanaTrackerKolSignalLookups) || solanaTrackerKolSignalLookups < 0 || solanaTrackerKolSignalLookups > 12) {
    throw new Error("SOLANA_TRACKER_KOL_SIGNAL_LOOKUPS must be an integer from 0 to 12.");
  }

  if (!Number.isInteger(solanaTrackerKolPositionLimit) || solanaTrackerKolPositionLimit < 1 || solanaTrackerKolPositionLimit > 12) {
    throw new Error("SOLANA_TRACKER_KOL_POSITION_LIMIT must be an integer from 1 to 12.");
  }

  if (!Number.isInteger(solanaTrackerKolPositionConcurrency) || solanaTrackerKolPositionConcurrency < 1 || solanaTrackerKolPositionConcurrency > 5) {
    throw new Error("SOLANA_TRACKER_KOL_POSITION_CONCURRENCY must be an integer from 1 to 5.");
  }

  if (!Number.isInteger(kolCopyScanIntervalMs) || kolCopyScanIntervalMs < 5_000 || kolCopyScanIntervalMs > 300_000) {
    throw new Error("KOL_COPY_SCAN_INTERVAL_MS must be an integer from 5000 to 300000.");
  }

  if (!Number.isInteger(madeOnSolKolLimit) || madeOnSolKolLimit < 1 || madeOnSolKolLimit > 50) {
    throw new Error("MADE_ON_SOL_KOL_LIMIT must be an integer from 1 to 50.");
  }

  if (!Number.isInteger(madeOnSolCacheTtlMs) || madeOnSolCacheTtlMs < 60_000 || madeOnSolCacheTtlMs > 86_400_000) {
    throw new Error("MADE_ON_SOL_CACHE_TTL_MS must be an integer from 60000 to 86400000.");
  }

  if (!Number.isInteger(livePairsRefreshSeconds) || livePairsRefreshSeconds < 2 || livePairsRefreshSeconds > 60) {
    throw new Error("LIVE_PAIRS_REFRESH_SECONDS must be an integer from 2 to 60.");
  }

  if (!Number.isInteger(livePairsSharedCacheMs) || livePairsSharedCacheMs < 0 || livePairsSharedCacheMs > 60_000) {
    throw new Error("LIVE_PAIRS_SHARED_CACHE_MS must be an integer from 0 to 60000.");
  }

  if (!Number.isInteger(minExitMarketCapUsd) || minExitMarketCapUsd < 0 || minExitMarketCapUsd > 100_000) {
    throw new Error("MIN_EXIT_MARKET_CAP_USD must be an integer from 0 to 100000.");
  }

  if (!Number.isInteger(minExitLiquidityUsd) || minExitLiquidityUsd < 0 || minExitLiquidityUsd > 50_000) {
    throw new Error("MIN_EXIT_LIQUIDITY_USD must be an integer from 0 to 50000.");
  }

  if (!Number.isInteger(stopLossCheckIntervalMs) || stopLossCheckIntervalMs < 500 || stopLossCheckIntervalMs > 30_000) {
    throw new Error("STOP_LOSS_CHECK_INTERVAL_MS must be an integer from 500 to 30000.");
  }

  if (!Number.isFinite(stopLossTriggerBufferPct) || stopLossTriggerBufferPct < 0 || stopLossTriggerBufferPct > 5) {
    throw new Error("STOP_LOSS_TRIGGER_BUFFER_PCT must be from 0 to 5.");
  }

  if (!Number.isInteger(stopLossExitSlippageBps) || stopLossExitSlippageBps < 1 || stopLossExitSlippageBps > 5000) {
    throw new Error("STOP_LOSS_EXIT_SLIPPAGE_BPS must be an integer from 1 to 5000.");
  }

  if (!Number.isInteger(stopLossMonitorSlippageBps) || stopLossMonitorSlippageBps < 1 || stopLossMonitorSlippageBps > 5000) {
    throw new Error("STOP_LOSS_MONITOR_SLIPPAGE_BPS must be an integer from 1 to 5000.");
  }

  if (!["json", "multipart", "form"].includes(pumpLaunchRequestMode)) {
    throw new Error("PUMP_LAUNCH_REQUEST_MODE must be json, multipart, or form.");
  }

  if (!Number.isInteger(pumpLaunchBodyLimitBytes) || pumpLaunchBodyLimitBytes < 100_000 || pumpLaunchBodyLimitBytes > 25_000_000) {
    throw new Error("PUMP_LAUNCH_BODY_LIMIT_BYTES must be an integer from 100000 to 25000000.");
  }

  if (workerTickEnabled && (!workerSecret || workerSecret.length < 24)) {
    throw new Error("WORKER_SECRET must be set to a long random value of at least 24 characters when WORKER_TICK_ENABLED=true.");
  }

  try {
    new PublicKey(feeWallet);
  } catch {
    throw new Error("FEE_WALLET must be a valid Solana wallet address.");
  }

  return {
    telegramToken: token,
    rpcUrl: process.env.HELIUS_RPC_URL
      || process.env.HELIUS_DEVELOPER_RPC_URL
      || process.env.HELIUS_HTTP_URL
      || process.env.HELIUS_SOLANA_RPC_URL
      || process.env.SOLANA_RPC_URL
      || (() => {
        throw new Error("HELIUS_RPC_URL (or another Helius RPC env var) must be set. Public Solana RPC fallback is disabled.");
      })(),
    appSecret: secret,
    dataDir: path.resolve(process.cwd(), process.env.DATA_DIR || path.join(__dirname, "..", "data")),
    allowEphemeralStorage: parseBoolean(process.env.ALLOW_EPHEMERAL_STORAGE || "false"),
    autoSendRecoveryKeyFile: parseBoolean(process.env.AUTO_SEND_RECOVERY_KEY_FILE || "true"),
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
    pumpLaunchEnabled: parseBoolean(process.env.PUMP_LAUNCH_ENABLED || "false"),
    pumpLaunchApiUrl: (process.env.PUMP_LAUNCH_API_URL || process.env.PUMP_LAUNCH_API_BASE || "").trim(),
    pumpLaunchApiKey: process.env.PUMP_LAUNCH_API_KEY || "",
    pumpLaunchTimeoutMs: Number.parseInt(process.env.PUMP_LAUNCH_TIMEOUT_MS || "30000", 10),
    pumpLaunchBodyLimitBytes,
    pumpLaunchImageMaxBytes: Number.parseInt(process.env.PUMP_LAUNCH_IMAGE_MAX_BYTES || "450000", 10),
    pumpLaunchApiFormat: (process.env.PUMP_LAUNCH_API_FORMAT || "minimal").trim().toLowerCase(),
    pumpLaunchImageField: (process.env.PUMP_LAUNCH_IMAGE_FIELD || "").trim(),
    pumpLaunchRequestMode,
    photonNewPairsUrl: (process.env.PHOTON_NEW_PAIRS_URL || "").trim(),
    photonApiKey: process.env.PHOTON_API_KEY || "",
    livePairsRpcSafety,
    livePairsRefreshSeconds,
    livePairsSharedCacheMs,
    livePairsImageEnrich,
    minExitMarketCapUsd,
    minExitLiquidityUsd,
    stopLossCheckIntervalMs,
    stopLossTriggerBufferPct,
    stopLossExitSlippageBps,
    stopLossMonitorSlippageBps,
    workerTickEnabled,
    workerTickRunTradePlans,
    workerTickRunDcaPlans,
    workerTickWarmFeeds,
    workerSecret,
    solanaTrackerApiKey: process.env.SOLANA_TRACKER_API_KEY || "",
    solanaTrackerApiBase: (process.env.SOLANA_TRACKER_API_BASE || "https://data.solanatracker.io").replace(/\/$/, ""),
    solanaTrackerKolLimit,
    solanaTrackerCacheTtlMs,
    solanaTrackerKolCacheTtlMs,
    solanaTrackerKolSignalLookups,
    solanaTrackerKolPositionLimit,
    solanaTrackerKolPositionConcurrency,
    solanaTrackerKolUsePeriodEndpoint,
    kolCopyScanIntervalMs,
    madeOnSolApiKey: process.env.MADE_ON_SOL_API_KEY || "",
    madeOnSolApiBase: (process.env.MADE_ON_SOL_API_BASE || "https://madeonsol.com/api/v1").replace(/\/$/, ""),
    madeOnSolKolLimit,
    madeOnSolCacheTtlMs,
    kolUseSolanaTrackerFallback,
    telegramBotUsername: normalizeTelegramUsername(process.env.TELEGRAM_BOT_USERNAME || ""),
    webPortalUrl: (process.env.WEB_PORTAL_URL || "").replace(/\/$/, ""),
    webAllowedOrigin: process.env.WEB_ALLOWED_ORIGIN || "*",
    webSessionTtlHours,
    resendApiKey: process.env.RESEND_API_KEY || "",
    emailFrom: process.env.EMAIL_FROM || "",
    tradingSpeedPreset,
    feeWallet,
    bundleFeeBps,
    referralFeeBps,
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
    manualLaunchScanIntervalMs,
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
  }), Math.max(1_000, Math.min(10_000, CONFIG.stopLossCheckIntervalMs)));

  const intervalMs = Math.max(500, Math.min(
    5_000,
    CONFIG.manualLaunchScanIntervalMs,
    CONFIG.stopLossCheckIntervalMs
  ));
  setInterval(() => void processTradePlans().catch((error) => {
    console.error("Trade plan runner failed:", error.message);
  }), intervalMs);
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

    if (request.method === "OPTIONS" && requestUrl.pathname.startsWith("/api/")) {
      response.writeHead(204, webCorsHeaders(request));
      response.end();
      return;
    }

    if (requestUrl.pathname.startsWith("/api/")
      || requestUrl.pathname.startsWith("/internal/")
      || requestUrl.pathname === "/worker/tick"
      || requestUrl.pathname === "/worker/health") {
      await handleWebApiRequest(request, response, requestUrl);
      return;
    }

    if (request.method === "GET" && (requestUrl.pathname === "/" || requestUrl.pathname === "/connect"
      || requestUrl.pathname === "/portal" || requestUrl.pathname.startsWith("/portal/")
      || requestUrl.pathname === "/terminal" || requestUrl.pathname.startsWith("/terminal/"))) {
      await serveWebPortal(requestUrl, response);
      return;
    }

    if (request.method === "GET" && (requestUrl.pathname.startsWith("/assets/")
      || /\.(?:css|js|png|jpe?g|svg|webp|ico)$/i.test(requestUrl.pathname))) {
      await serveWebPortal(requestUrl, response);
      return;
    }

    if (["/healthz", "/readyz", "/wake"].includes(requestUrl.pathname)) {
      response.writeHead(200, {
        "Content-Type": "application/json",
        ...webCorsHeaders(request)
      });
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

async function handleWebApiRequest(request, response, requestUrl) {
  try {
    const pathname = requestUrl.pathname;

    const workerTickPaths = new Set([
      "/api/internal/worker/tick",
      "/api/worker/tick",
      "/internal/worker/tick",
      "/worker/tick"
    ]);
    const workerHealthPaths = new Set([
      "/api/internal/worker/health",
      "/api/worker/health",
      "/internal/worker/health",
      "/worker/health"
    ]);

    if (request.method === "POST" && workerTickPaths.has(pathname)) {
      await handleInternalWorkerTick(request, response);
      return;
    }

    if (request.method === "GET" && workerHealthPaths.has(pathname)) {
      handleInternalWorkerHealth(request, response);
      return;
    }

    if (request.method === "GET" && pathname === "/api/web/config") {
      sendWebJson(request, response, 200, {
        ok: true,
        service: "OgreTradeBot",
        portalUrl: CONFIG.webPortalUrl,
        telegramBotUsername: CONFIG.telegramBotUsername,
        telegramBotUrl: telegramBotStartUrl(),
        socials: brandSocialLinks(),
        features: ["wallets", "balances", "positions", "pnl", "sniper-scan", "kol-tracker", "one-wallet-trade", "volume-plans", "bundle", "launch-watch", "launch-coin"]
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/login") {
      assertWebLoginAttemptAllowed(request);
      const body = await readJsonRequestBody(request);
      const result = await verifyWebLoginCode(body.code);
      clearWebLoginAttempts(request);
      sendWebJson(request, response, 200, {
        ok: true,
        token: result.token,
        expiresAt: result.expiresAt,
        user: await webUserSummary(result.userId)
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/password-login") {
      assertWebLoginAttemptAllowed(request);
      const body = await readJsonRequestBody(request);
      const result = await verifyWebPasswordLogin(body.username, body.password);
      clearWebLoginAttempts(request);
      sendWebJson(request, response, 200, {
        ok: true,
        token: result.token,
        expiresAt: result.expiresAt,
        user: await webUserSummary(result.userId)
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/signup") {
      const body = await readJsonRequestBody(request);
      const result = await createWebAccount(body);
      sendWebJson(request, response, 200, {
        ok: true,
        token: result.token,
        expiresAt: result.expiresAt,
        user: await webUserSummary(result.userId),
        emailSent: result.emailSent,
        emailError: result.emailError
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/email-code") {
      assertWebLoginAttemptAllowed(request);
      const body = await readJsonRequestBody(request);
      const result = await sendEmailWebLoginCode(body.email);
      sendWebJson(request, response, 200, {
        ok: true,
        expiresAt: result.expiresAt,
        emailSent: result.emailSent
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/web/sniper/scan") {
      const auth = await authenticateOptionalWebRequest(request);
      const mode = requestUrl.searchParams.get("mode") || "safe";
      sendWebJson(request, response, 200, {
        ok: true,
        scan: await webSniperScan(auth?.userId || "guest", mode)
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/web/live-pairs") {
      const auth = await authenticateOptionalWebRequest(request);
      const bucket = requestUrl.searchParams.get("bucket") || "live";
      const sort = requestUrl.searchParams.get("sort") || "best";
      const force = parseBoolean(requestUrl.searchParams.get("force") || "false");
      sendWebJson(request, response, 200, {
        ok: true,
        livePairs: await webLivePairs(auth?.userId || "guest", bucket, { sort, force })
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/web/kol/scan") {
      const auth = await authenticateOptionalWebRequest(request);
      const mode = requestUrl.searchParams.get("mode") || "hot";
      const wallet = requestUrl.searchParams.get("wallet") || "";
      sendWebJson(request, response, 200, {
        ok: true,
        scan: await webKolScan(auth?.userId || "guest", mode, wallet)
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/web/slimewire-traders") {
      sendWebJson(request, response, 200, {
        ok: true,
        traders: await webSlimewireTraders()
      });
      return;
    }

    const auth = await authenticateWebRequest(request);

    if (request.method === "POST" && pathname === "/api/web/logout") {
      await revokeWebSession(auth.tokenHash);
      sendWebJson(request, response, 200, { ok: true });
      return;
    }

    if (request.method === "GET" && pathname === "/api/web/me") {
      sendWebJson(request, response, 200, {
        ok: true,
        user: await webUserSummary(auth.userId)
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/email") {
      const body = await readJsonRequestBody(request);
      const result = await updateWebProfileEmail(auth.userId, body.email);
      sendWebJson(request, response, 200, {
        ok: true,
        profile: result.profile,
        emailSent: result.emailSent,
        emailError: result.emailError
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/profile/credentials") {
      const body = await readJsonRequestBody(request);
      const result = await updateWebProfileCredentials(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        profile: result.profile,
        user: await webUserSummary(auth.userId)
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/profile/avatar") {
      const body = await readJsonRequestBody(request, 400_000);
      const result = await updateWebProfileAvatar(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        profile: result.profile,
        user: await webUserSummary(auth.userId)
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/profile/connected-wallet") {
      const body = await readJsonRequestBody(request);
      const result = await updateWebConnectedWallet(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        profile: result.profile,
        user: await webUserSummary(auth.userId)
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/profile/x") {
      const body = await readJsonRequestBody(request);
      const result = await updateWebProfileXHandle(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        profile: result.profile,
        user: await webUserSummary(auth.userId)
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/profile/referral") {
      const body = await readJsonRequestBody(request);
      const result = await updateWebReferralProfile(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        profile: result.profile,
        user: await webUserSummary(auth.userId)
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/web/presets") {
      sendWebJson(request, response, 200, {
        ok: true,
        presets: await webPresetRows(auth.userId)
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/presets") {
      const body = await readJsonRequestBody(request);
      const result = await updateWebPreset(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        presets: result.presets,
        user: await webUserSummary(auth.userId)
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/web/watchlist") {
      sendWebJson(request, response, 200, {
        ok: true,
        watchlist: await webWatchlistRows(auth.userId)
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/watchlist") {
      const body = await readJsonRequestBody(request);
      const result = await updateWebWatchlist(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        watchlist: result.watchlist,
        user: await webUserSummary(auth.userId)
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/web/wallets") {
      sendWebJson(request, response, 200, {
        ok: true,
        wallets: await webWalletRows(auth.userId)
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/wallets/create") {
      const body = await readJsonRequestBody(request);
      const result = await createWebWalletSet(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        ...result
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/wallets/restore") {
      const body = await readJsonRequestBody(request);
      const result = await restoreWebWalletBackup(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        restore: result
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/wallets/export") {
      const result = await exportWebWalletBackup(auth.userId);
      sendWebJson(request, response, 200, {
        ok: true,
        backup: result
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/wallets/import") {
      const body = await readJsonRequestBody(request);
      const result = await importWebWallet(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        imported: result
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/wallets/remove") {
      const body = await readJsonRequestBody(request);
      const result = await removeWebWallets(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        removed: result
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/wallets/sweep-sol") {
      const body = await readJsonRequestBody(request);
      const result = await webSweepSol(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        sweep: result
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/wallets/sweep-tokens") {
      const body = await readJsonRequestBody(request);
      const result = await webSweepTokens(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        sweep: result
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/wallets/sell-all-tokens") {
      const body = await readJsonRequestBody(request);
      const result = await webSellAllTokens(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        sweep: result
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/wallets/send-sol") {
      const body = await readJsonRequestBody(request);
      const result = await webSendSolMany(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        sweep: result
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/trade/buy") {
      const body = await readJsonRequestBody(request);
      const result = await webTradeBuy(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        trade: result
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/trade/sell") {
      const body = await readJsonRequestBody(request);
      const result = await webTradeSell(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        trade: result
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/trade/plan") {
      const body = await readJsonRequestBody(request);
      const result = await webCreateTradePlan(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        plan: result
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/volume/plan") {
      const body = await readJsonRequestBody(request);
      const result = await webCreateVolumePlan(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        plan: result
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/bundle/buy") {
      const body = await readJsonRequestBody(request);
      const result = await webBundleBuy(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        bundle: result
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/bundle/plan") {
      const body = await readJsonRequestBody(request);
      const result = await webCreateBundlePlan(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        plan: result
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/bundle/sell") {
      const body = await readJsonRequestBody(request);
      const result = await webBundleSell(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        bundle: result
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/web/launch/watches") {
      sendWebJson(request, response, 200, {
        ok: true,
        watches: await webLaunchWatches(auth.userId)
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/launch/watch") {
      const body = await readJsonRequestBody(request);
      const result = await webCreateLaunchWatch(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        watch: result
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/launch/coin") {
      const bodyLimit = Number.isFinite(CONFIG.pumpLaunchBodyLimitBytes) && CONFIG.pumpLaunchBodyLimitBytes > 0
        ? CONFIG.pumpLaunchBodyLimitBytes
        : 12_000_000;
      const body = await readJsonRequestBody(request, bodyLimit);
      const result = await webLaunchPumpCoin(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        launch: result
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/launch/cancel") {
      const body = await readJsonRequestBody(request);
      const result = await webCancelLaunchWatch(auth.userId, body.planId);
      sendWebJson(request, response, 200, {
        ok: true,
        watch: result
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/web/balances") {
      const force = parseBoolean(requestUrl.searchParams.get("force") || "false");
      const [balances, connectedWallet] = await Promise.all([
        webBalanceRows(auth.userId, { force }),
        webConnectedWalletBalance(auth.userId, { force })
      ]);
      sendWebJson(request, response, 200, {
        ok: true,
        balances,
        connectedWallet
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/web/positions") {
      const force = parseBoolean(requestUrl.searchParams.get("force") || "false");
      sendWebJson(request, response, 200, {
        ok: true,
        positions: await webPositionRows(auth.userId, { force })
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/web/pnl") {
      sendWebJson(request, response, 200, {
        ok: true,
        pnl: await webPnlSummary(auth.userId)
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/web/pnl/card") {
      const tokenMint = requestUrl.searchParams.get("tokenMint") || "";
      const card = await webPnlCard(auth.userId, tokenMint);
      sendWebBinary(request, response, 200, card.png, "image/png", card.filename);
      return;
    }

    if (request.method === "GET" && pathname === "/api/web/tx-audit") {
      const signature = requestUrl.searchParams.get("signature") || "";
      sendWebJson(request, response, 200, {
        ok: true,
        audit: await webTxAudit(signature)
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/web/sniper/scan") {
      const mode = requestUrl.searchParams.get("mode") || "safe";
      sendWebJson(request, response, 200, {
        ok: true,
        scan: await webSniperScan(auth.userId, mode)
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/web/live-pairs") {
      const bucket = requestUrl.searchParams.get("bucket") || "live";
      const sort = requestUrl.searchParams.get("sort") || "best";
      const force = parseBoolean(requestUrl.searchParams.get("force") || "false");
      sendWebJson(request, response, 200, {
        ok: true,
        livePairs: await webLivePairs(auth.userId, bucket, { sort, force })
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/sniper/entry") {
      const body = await readJsonRequestBody(request);
      const result = await webCreateSniperEntry(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        plan: result
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/web/kol/scan") {
      const mode = requestUrl.searchParams.get("mode") || "hot";
      const wallet = requestUrl.searchParams.get("wallet") || "";
      sendWebJson(request, response, 200, {
        ok: true,
        scan: await webKolScan(auth.userId, mode, wallet)
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/kol/entry") {
      const body = await readJsonRequestBody(request);
      const result = await webCreateKolEntry(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        plan: result
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/web/kol/copy-wallet") {
      const body = await readJsonRequestBody(request);
      const result = await webCreateKolCopyWallet(auth.userId, body);
      sendWebJson(request, response, 200, {
        ok: true,
        plan: result
      });
      return;
    }

    sendWebJson(request, response, 404, { ok: false, error: "not_found" });
  } catch (error) {
    const status = error.statusCode || error.status || 500;
    sendWebJson(request, response, status, {
      ok: false,
      error: status >= 500 ? "server_error" : "request_error",
      message: friendlyError(error)
    });
  }
}

async function serveWebPortal(requestUrl, response) {
  const relativePath = requestUrl.pathname === "/" || requestUrl.pathname === "/connect"
    || requestUrl.pathname === "/portal" || requestUrl.pathname === "/terminal"
    ? "index.html"
    : decodeURIComponent(requestUrl.pathname.replace(/^\/(?:portal|terminal)\/?/, "")) || "index.html";
  const safeRelativePath = relativePath.replace(/^[/\\]+/, "");
  const filePath = path.resolve(WEB_STATIC_DIR, safeRelativePath);

  if (!filePath.startsWith(WEB_STATIC_DIR)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    const target = stat.isDirectory() ? path.join(filePath, "index.html") : filePath;
    const data = await fs.readFile(target);
    const noStoreAsset = target.endsWith("index.html") || /\.(?:js|css)$/i.test(target);
    response.writeHead(200, {
      "Content-Type": webContentType(target),
      "Cache-Control": noStoreAsset ? "no-store" : "public, max-age=3600"
    });
    response.end(data);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

function webContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml; charset=utf-8"
  };
  return types[ext] || "application/octet-stream";
}

function webCorsHeaders(request) {
  const origin = request.headers.origin || "";
  const allowed = CONFIG.webAllowedOrigin || "*";
  const allowedOrigins = allowed.split(",").map((item) => item.trim()).filter(Boolean);
  const portalOrigin = originFromUrl(CONFIG.webPortalUrl);
  const allowOrigin = !origin
    ? "*"
    : allowedOrigins.includes("*") || allowedOrigins.some((allowedOrigin) => originMatchesAllowedOrigin(origin, allowedOrigin)) || (portalOrigin && originMatchesAllowedOrigin(origin, portalOrigin))
      ? origin
      : portalOrigin || allowedOrigins[0] || "null";
  return {
    "Access-Control-Allow-Origin": allowOrigin || "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Ogre-Session",
    "Access-Control-Expose-Headers": "X-Ogre-Filename",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function originMatchesAllowedOrigin(origin, allowedOrigin) {
  if (!origin || !allowedOrigin) return false;
  if (allowedOrigin === "*" || origin === allowedOrigin) return true;

  try {
    const originUrl = new URL(origin);
    const allowedUrl = new URL(allowedOrigin);
    if (originUrl.protocol !== allowedUrl.protocol) return false;
    const allowedHost = allowedUrl.hostname.toLowerCase();
    const originHost = originUrl.hostname.toLowerCase();
    if (!allowedHost.startsWith("*.")) return false;
    const suffix = allowedHost.slice(2);
    return originHost === suffix || originHost.endsWith(`.${suffix}`);
  } catch {
    return false;
  }
}

function originFromUrl(value) {
  try {
    return value ? new URL(value).origin : "";
  } catch {
    return "";
  }
}

function sendWebJson(request, response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    ...webCorsHeaders(request)
  });
  response.end(JSON.stringify(data));
}

function sendWebBinary(request, response, status, buffer, contentType, filename = "") {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "X-Ogre-Filename": filename,
    "Content-Disposition": filename ? `attachment; filename="${filename.replace(/[^a-z0-9_.-]/gi, "_")}"` : "attachment",
    ...webCorsHeaders(request)
  });
  response.end(buffer);
}

async function handleInternalWorkerTick(request, response) {
  if (!CONFIG.workerTickEnabled) {
    sendWebJson(request, response, 503, {
      ok: false,
      error: "worker_tick_disabled"
    });
    return;
  }

  const providedSecret = workerTickSecretFromRequest(request);
  if (!constantTimeStringEquals(providedSecret, CONFIG.workerSecret)) {
    sendWebJson(request, response, 401, {
      ok: false,
      error: "unauthorized_worker_tick"
    });
    return;
  }

  const body = await readJsonRequestBody(request, 64_000);
  const result = await runInternalWorkerTick(body);
  sendWebJson(request, response, 200, {
    ok: true,
    ...result
  });
}

function handleInternalWorkerHealth(request, response) {
  sendWebJson(request, response, 200, {
    ok: true,
    workerTickEnabled: CONFIG.workerTickEnabled,
    workerSecretConfigured: Boolean(CONFIG.workerSecret && CONFIG.workerSecret.length >= 24),
    runTradePlans: CONFIG.workerTickRunTradePlans,
    runDcaPlans: CONFIG.workerTickRunDcaPlans,
    warmFeeds: CONFIG.workerTickWarmFeeds,
    livePairRefreshSeconds: CONFIG.livePairsRefreshSeconds,
    stopLossCheckIntervalMs: CONFIG.stopLossCheckIntervalMs
  });
}

function workerTickSecretFromRequest(request) {
  const direct = request.headers["x-worker-secret"] || request.headers["x-ogre-worker-secret"];
  if (Array.isArray(direct)) return direct[0] || "";
  if (direct) return String(direct);

  const authorization = request.headers.authorization || "";
  const match = String(authorization).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function constantTimeStringEquals(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length || left.length === 0) return false;
  try {
    return crypto.timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

async function runInternalWorkerTick(body = {}) {
  const startedAt = Date.now();
  const result = {
    ranAt: new Date(startedAt).toISOString(),
    tradePlans: { skipped: true },
    dcaPlans: { skipped: true },
    feeds: { skipped: true }
  };

  if (CONFIG.workerTickRunTradePlans && body.runTradePlans !== false) {
    result.tradePlans = await runWorkerTask("tradePlans", () => processTradePlans());
  }

  if (CONFIG.workerTickRunDcaPlans && body.runDcaPlans !== false) {
    result.dcaPlans = await runWorkerTask("dcaPlans", () => processDcaPlans());
  }

  if (CONFIG.workerTickWarmFeeds && body.warmLivePairs !== false) {
    result.feeds = await runWorkerTask("feeds", () => warmWorkerLivePairFeeds(body));
  }

  result.durationMs = Date.now() - startedAt;
  return result;
}

async function runWorkerTask(name, fn) {
  const startedAt = Date.now();
  try {
    const value = await fn();
    return {
      ok: true,
      durationMs: Date.now() - startedAt,
      value: value && typeof value === "object" ? value : undefined
    };
  } catch (error) {
    console.warn(`Worker ${name} tick failed: ${error.message}`);
    return {
      ok: false,
      durationMs: Date.now() - startedAt,
      error: error.message
    };
  }
}

async function warmWorkerLivePairFeeds(body = {}) {
  const buckets = normalizeWorkerList(body.buckets, ["live", "under1h", "under3h", "under1d"])
    .map(normalizeLivePairBucket)
    .filter((value, index, list) => list.indexOf(value) === index);
  const sorts = normalizeWorkerList(body.sorts, ["best", "newest"])
    .map((sort) => String(sort || "best").trim().toLowerCase())
    .filter(Boolean);
  const force = Boolean(body.forceFeeds);
  const warmed = [];

  for (const bucket of buckets) {
    for (const sort of sorts) {
      const livePairs = await webLivePairs("worker", bucket, { sort, force });
      warmed.push({
        bucket,
        sort,
        rows: Array.isArray(livePairs?.rows) ? livePairs.rows.length : 0,
        stale: Boolean(livePairs?.stale)
      });
    }
  }

  return { warmed };
}

function normalizeWorkerList(value, fallback) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [...fallback];
}

async function readJsonRequestBody(request, maxBytes = 0) {
  const text = await readRequestBody(request, maxBytes);
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

function webhookPath() {
  return `/telegram/webhook/${CONFIG.webhookSecret}`;
}

function readRequestBody(request, maxBytes = 0) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    let tooLarge = false;
    request.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (maxBytes > 0 && totalBytes > maxBytes) {
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      if (tooLarge) return;
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (tooLarge) {
        const error = new Error("Upload is too large. Use a smaller image or compress it before launching.");
        error.statusCode = 413;
        reject(error);
        return;
      }
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    request.on("error", reject);
  });
}

function parseAllowedUserIds(value) {
  return value
    .split(",")
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((item) => Number.isInteger(item));
}

function normalizeTelegramUsername(value) {
  return String(value || "").trim().replace(/^@/, "");
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
  await writeJsonIfMissing(webAuthPath(), { codes: [], sessions: [] });
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
    const existing = await fs.readFile(filePath, "utf8");
    if (existing.trim()) return;
  } catch {
  }
  await writeJsonFile(filePath, value);
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

function webAuthPath() {
  return path.join(CONFIG.dataDir, "web-auth.json");
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

  await writeJsonFile(appSecretFingerprintPath(), {
    algorithm: "sha256",
    fingerprint: current,
    createdAt: new Date().toISOString()
  });
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

  if (query.data?.startsWith("manual_launch_cancel:")) {
    if (!isPrivateChat(chat)) {
      await say(chatId, "Open this bot in DM to cancel a Manual Launch Snipe.");
      return;
    }
    await cancelManualLaunchWatch(chatId, userId, query.data.slice("manual_launch_cancel:".length), messageId);
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

  if (query.data?.startsWith("kol_trade:") || query.data?.startsWith("kol_bundle:") || query.data?.startsWith("kol_copy:")) {
    if (!isPrivateChat(chat)) {
      await say(chatId, "Open this bot in DM to use KOL Tracker trading actions.");
      return;
    }
    const [action, tokenMint] = query.data.split(":");
    await startKolSignalAction(chatId, userId, action, tokenMint);
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
    case "web_portal":
      await sendWebLoginCode(chatId, userId, messageId);
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
    case "manual_launch_watches":
      await showManualLaunchWatches(chatId, userId, messageId);
      break;
    case "sniper_manual_launch":
      setSession(chatId, "manual_launch_ticker", userId);
      await say(chatId, withBrandFooter([
        "Manual Launch Snipe",
        "",
        "Send the ticker/symbol to watch, without the CA.",
        "Example: OGRE or $OGRE",
        "",
        "The bot will scan live launch/profile feeds for a matching Solana token, then buy with the wallets and exits you set before it goes live."
      ].join("\n")));
      break;
    case "sniper_mode_safe":
    case "sniper_mode_smart":
    case "sniper_mode_fast":
    case "sniper_mode_pumpsnipe":
    case "sniper_mode_moonshot":
    case "sniper_mode_meme":
    case "sniper_mode_ai":
    case "sniper_mode_long":
      await updateSniperMode(chatId, userId, query.data.replace("sniper_mode_", ""), messageId);
      break;
    case "kol_tracker_menu":
      await showKolTrackerMenu(chatId, messageId);
      break;
    case "kol_scan_wallet":
      setSession(chatId, "kol_wallet_scan", userId);
      await say(chatId, withBrandFooter("Send the public Solana wallet address to scan. The bot will show current token holdings and any configured KOL API signals."));
      break;
    case "kol_scan_hot":
    case "kol_scan_top":
    case "kol_scan_consistent":
    case "kol_scan_fresh":
      await showKolScan(chatId, userId, query.data.replace("kol_scan_", ""), messageId);
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
    case "verify_backup_file":
      setSession(chatId, "verify_backup_file", userId);
      await say(chatId, [
        "Upload or paste a backup file and I will show the wallet addresses inside it without restoring anything.",
        "",
        "Use this when several backups have the same label. Match the public address before restoring or rescuing keys."
      ].join("\n"));
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

  if (text === "/web" || /^\/start(?:@\w+)?\s+web$/i.test(text)) {
    if (!isPrivateChat(message.chat)) {
      await say(chatId, "Open this bot in DM to connect the web portal.");
      return;
    }
    clearSession(chatId);
    await sendWebLoginCode(chatId, userId);
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

  if (text === "/kol" || text === "/koltracker") {
    if (!isPrivateChat(message.chat)) {
      await say(chatId, "Open this bot in DM to use KOL Tracker.");
      return;
    }
    await showKolTrackerMenu(chatId);
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

  const stepsAllowedWhilePaused = new Set(["unlock_confirm", "restore_backup", "verify_backup_file", "rescue_backup_keys", "export_private_keys_confirm"]);
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

  if (session?.step === "verify_backup_file") {
    await verifyBackupFileFlow(chatId, backupText, session);
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
      case "verify_backup_file":
        await verifyBackupFileFlow(chatId, text, session);
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
        ].join("\n"), { fresh: true });
        break;
      case "sniper_amount":
        session.data.amountSol = parsePositiveNumber(text);
        if (session.data.pumpSnipe) {
          applyPumpSnipeExitPreset(session);
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
          session.step = "autosnipe_exit_review";
          await sendQuickChoicePrompt(chatId, [
            "AutoSnipe defaults selected.",
            "",
            formatAutoSnipePresetDetails(session.data)
          ].join("\n"), [
            [{ text: "Use Default", value: "use" }, { text: "Customize", value: "customize" }],
            [{ text: "Cancel", value: "cancel" }]
          ], { includeCustom: false });
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
        session.data.takeProfitPct = parseTakeProfitPercent(text);
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
        await sendQuickSlippagePrompt(chatId, `Custom exits saved: TP ${formatTakeProfitTarget(session.data.takeProfitPct)}, SL -${session.data.stopLossPct}%.\n\nFast launches move hard. Choose slippage for this snipe, or type default for ${CONFIG.sniperDefaultSlippageBps} bps.`, { defaultBps: CONFIG.sniperDefaultSlippageBps, fastButtons: true });
        break;
      case "sniper_slippage":
        session.data.slippageBps = parseSlippage(text, CONFIG.sniperDefaultSlippageBps);
        session.step = "sniper_confirm";
        await sendConfirmPrompt(chatId, withBrandFooter(formatSniperConfirm(session.data)));
        break;
      case "sniper_confirm":
        await confirmOrCancel(chatId, text, () => createSniperTimedPlanFlow(chatId, session));
        break;
      case "autosnipe_exit_review": {
        const choice = text.trim().toLowerCase();
        if (choice === "cancel") {
          clearSession(chatId);
          await say(chatId, "AutoSnipe canceled.");
          await showSniperMenu(chatId, session.userId);
          break;
        }
        if (choice === "customize") {
          session.step = "autosnipe_custom_take_profit";
          await sendQuickChoicePrompt(chatId, "Choose AutoSnipe take-profit percent.", [
            [{ text: "+15%", value: "15" }, { text: "+25%", value: "25" }],
            [{ text: "+40%", value: "40" }, { text: "+60%", value: "60" }]
          ]);
          break;
        }
        if (choice !== "use") {
          throw new Error("Choose Use Default, Customize, or Cancel.");
        }
        session.step = "autosnipe_slippage";
        await sendQuickSlippagePrompt(chatId, `Choose AutoSnipe slippage, or type default for ${AUTOSNIPE_SLIPPAGE_BPS} bps.`, { defaultBps: AUTOSNIPE_SLIPPAGE_BPS, fastButtons: true });
        break;
      }
      case "autosnipe_custom_take_profit":
        session.data.takeProfitPct = parseTakeProfitPercent(text);
        session.step = "autosnipe_custom_stop_loss";
        await sendQuickChoicePrompt(chatId, "Choose AutoSnipe stop-loss percent.", [
          [{ text: "-5%", value: "5" }, { text: "-8%", value: "8" }],
          [{ text: "-10%", value: "10" }, { text: "-15%", value: "15" }]
        ]);
        break;
      case "autosnipe_custom_stop_loss":
        session.data.stopLossPct = parseOptionalTriggerPercent(text);
        session.data.exitPreset = "AutoSnipe Custom";
        session.step = "autosnipe_slippage";
        await sendQuickSlippagePrompt(chatId, `Custom AutoSnipe exits saved: TP ${formatTakeProfitTarget(session.data.takeProfitPct)}, SL -${session.data.stopLossPct}%.\n\nChoose slippage, or type default for ${AUTOSNIPE_SLIPPAGE_BPS} bps.`, { defaultBps: AUTOSNIPE_SLIPPAGE_BPS, fastButtons: true });
        break;
      case "autosnipe_slippage":
        session.data.slippageBps = parseSlippage(text, AUTOSNIPE_SLIPPAGE_BPS);
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
        session.data.takeProfitPct = parseTakeProfitPercent(text);
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
        await sendQuickSlippagePrompt(chatId, `Custom PumpSnipe exits saved: TP ${formatTakeProfitTarget(session.data.takeProfitPct)}, SL -${session.data.stopLossPct}%.\n\nChoose slippage, or type default for ${PUMPSNIPE_SLIPPAGE_BPS} bps.`, { defaultBps: PUMPSNIPE_SLIPPAGE_BPS, fastButtons: true });
        break;
      case "pumpsnipe_slippage":
        session.data.slippageBps = parseSlippage(text, PUMPSNIPE_SLIPPAGE_BPS);
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
      case "trade_buy_wallet": {
        const wallet = await setSingleWalletSelection(session, text);
        session.step = "trade_buy_token";
        await say(chatId, withBrandFooter(`Selected wallet: ${wallet.label}\n${wallet.publicKey}\n\nSend the token mint address to buy.`));
        break;
      }
      case "kol_trade_wallet": {
        const wallet = await setSingleWalletSelection(session, text);
        session.step = "buy_amount";
        await sendQuickAmountPrompt(chatId, [
          `KOL signal: ${session.data.signalLabel || shortMint(session.data.tokenMint)}`,
          `Selected wallet: ${wallet.label}`,
          `Dexscreener: ${dexScreenerUrl(session.data.tokenMint)}`,
          "",
          "Choose a quick buy amount or type your custom SOL amount.",
          "",
          `Safety reserve kept for fees: ${CONFIG.buyReserveSol} SOL`
        ].join("\n"), { allowMax: true });
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
      case "kol_wallet_scan": {
        const owner = parsePublicKey(text).toBase58();
        sessions.delete(chatId);
        await showKolScan(chatId, session.userId, "fresh", null, owner);
        break;
      }
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
        ].join("\n"), { fresh: true });
        break;
      case "auto_bundle_amount":
        session.data.amountSol = parsePositiveNumber(text);
        applyAutoBundleDefaults(session);
        session.step = "auto_bundle_exit_mode";
        await sendQuickChoicePrompt(chatId, [
          "Choose Auto Bundle exit style.",
          "",
          "Default: full sell at +60%, full stop-loss at -10%.",
          "Custom Full Exit: set your own TP/SL and fallback timer. You can type `500` for +500%, or `5x` for a 5x value target.",
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
        session.data.takeProfitPct = parseTakeProfitPercent(text);
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
        await sendQuickChoicePrompt(chatId, "Choose fallback timer if TP/SL does not trigger first, or choose No Timer to only use TP/SL.", [
          [{ text: "No Timer", value: "off" }, { text: "30 min", value: "30" }],
          [{ text: "1 hour", value: "60" }, { text: "6 hours", value: "360" }],
          [{ text: "1 day", value: "1440" }, { text: "2 days", value: "2880" }]
        ]);
        break;
      case "auto_bundle_timer":
        session.data.sellDelaySeconds = parseOptionalSellDelaySeconds(text);
        session.data.sellDelayMinutes = session.data.sellDelaySeconds / 60;
        ensureTimedPlanHasExit(session.data);
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
      case "manual_launch_ticker":
        session.data.ticker = cleanTickerSymbol(text);
        session.data.planSource = "manual_launch_snipe";
        session.data.tradeMode = "bundle";
        session.step = "manual_launch_wallets";
        await say(chatId, await walletPrompt(session.userId, [
          `Manual Launch Snipe: $${session.data.ticker}`,
          "",
          "Send wallet numbers, `all`, or `group: group name`.",
          "These wallets will buy as soon as a matching live Solana launch is found."
        ].join("\n")));
        break;
      case "manual_launch_wallets":
        session.data.walletIndexes = await parseWalletSelectionOrGroup(text, session.userId);
        session.data.walletSelector = text.trim();
        session.step = "manual_launch_amount";
        await sendQuickAmountPrompt(chatId, [
          `Watching ticker: $${session.data.ticker}`,
          "",
          "Choose SOL amount to buy per selected wallet when the launch appears."
        ].join("\n"), { fresh: true });
        break;
      case "manual_launch_amount":
        session.data.amountSol = parsePositiveNumber(text);
        applyManualLaunchDefaults(session);
        session.step = "manual_launch_take_profit";
        await sendQuickChoicePrompt(chatId, "Choose take-profit for the launch snipe.", [
          [{ text: "+25%", value: "25" }, { text: "+40%", value: "40" }],
          [{ text: "+60%", value: "60" }, { text: "+100%", value: "100" }]
        ]);
        break;
      case "manual_launch_take_profit":
        session.data.takeProfitPct = parseTakeProfitPercent(text);
        session.step = "manual_launch_stop_loss";
        await sendQuickChoicePrompt(chatId, "Choose stop-loss for the launch snipe.", [
          [{ text: "-8%", value: "8" }, { text: "-10%", value: "10" }],
          [{ text: "-15%", value: "15" }, { text: "-25%", value: "25" }]
        ]);
        break;
      case "manual_launch_stop_loss":
        session.data.stopLossPct = parseOptionalTriggerPercent(text);
        session.step = "manual_launch_timer";
        await sendQuickChoicePrompt(chatId, "Choose fallback timer after the launch buy, or choose No Timer to only use TP/SL.", [
          [{ text: "No Timer", value: "off" }, { text: "5 sec", value: "5s" }],
          [{ text: "1 min", value: "1" }, { text: "3 min", value: "3" }],
          [{ text: "5 min", value: "5" }, { text: "15 min", value: "15" }]
        ]);
        break;
      case "manual_launch_timer":
        session.data.sellDelaySeconds = parseOptionalSellDelaySeconds(text);
        session.data.sellDelayMinutes = session.data.sellDelaySeconds / 60;
        ensureTimedPlanHasExit(session.data);
        session.step = "manual_launch_slippage";
        await sendQuickSlippagePrompt(chatId, `Choose slippage for launch entry, or type default for ${PUMPSNIPE_SLIPPAGE_BPS} bps.`, { defaultBps: PUMPSNIPE_SLIPPAGE_BPS, fastButtons: true });
        break;
      case "manual_launch_slippage":
        session.data.slippageBps = parseSlippage(text, PUMPSNIPE_SLIPPAGE_BPS);
        session.step = "manual_launch_confirm";
        await sendConfirmPrompt(chatId, withBrandFooter(formatManualLaunchConfirm(session.data)));
        break;
      case "manual_launch_confirm":
        await confirmOrCancel(chatId, text, () => createManualLaunchPlanFlow(chatId, session));
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
        session.data.takeProfitPct = parseTakeProfitPercent(text);
        session.step = "buy_auto_stop_loss";
        await sendQuickChoicePrompt(chatId, "Choose stop-loss percent. SL sells 100% of the tracked bag.", [
          [{ text: "-8%", value: "8" }, { text: "-10%", value: "10" }],
          [{ text: "-15%", value: "15" }, { text: "-25%", value: "25" }]
        ]);
        break;
      case "buy_auto_stop_loss":
        session.data.stopLossPct = parseOptionalTriggerPercent(text);
        session.step = "buy_auto_timer";
        await sendQuickChoicePrompt(chatId, "Choose fallback auto-sell timer if TP/SL does not trigger first, or choose No Timer to only use TP/SL.", [
          [{ text: "No Timer", value: "off" }, { text: "5 min", value: "5" }],
          [{ text: "30 min", value: "30" }, { text: "1 hour", value: "60" }],
          [{ text: "2 hours", value: "120" }],
          [{ text: "1 day", value: "1440" }]
        ]);
        break;
      case "buy_auto_timer":
        session.data.sellDelaySeconds = parseOptionalSellDelaySeconds(text);
        session.data.sellDelayMinutes = session.data.sellDelaySeconds / 60;
        ensureTimedPlanHasExit(session.data);
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
        await sendQuickChoicePrompt(chatId, "Choose fallback sell after buy. Use No Timer if you only want TP/SL exits.", [
          [{ text: "No Timer", value: "off" }, { text: "5 sec", value: "5s" }],
          [{ text: "1 min", value: "1" }, { text: "5 min", value: "5" }],
          [{ text: "15 min", value: "15" }],
          [{ text: "30 min", value: "30" }, { text: "60 min", value: "60" }]
        ]);
        break;
      case "plan_sell_delay":
        session.data.sellDelaySeconds = parseOptionalSellDelaySeconds(text);
        session.data.sellDelayMinutes = session.data.sellDelaySeconds / 60;
        session.step = "plan_sell_percent";
        await sendQuickPercentPrompt(chatId, "Send percent to sell when an exit triggers. Example: `100`.");
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
        session.data.takeProfitPct = parseTakeProfitPercent(text);
        session.step = "plan_stop_loss";
        await sendQuickChoicePrompt(chatId, "Send stop-loss percent down, or `0` / `off` to disable. Example: `10` sells when estimated value is about -10%.", [
          [{ text: "Off", value: "0" }, { text: "-10%", value: "10" }],
          [{ text: "-25%", value: "25" }, { text: "-50%", value: "50" }]
        ]);
        break;
      case "plan_stop_loss":
        session.data.stopLossPct = parseOptionalTriggerPercent(text);
        ensureTimedPlanHasExit(session.data);
        if (session.data.allowRepeat) {
          session.step = "plan_loop_count";
          await sendQuickChoicePrompt(chatId, "Repeat cycles: choose how many total buy/sell cycles this plan should run.", [
            [{ text: "Repeat 1x", value: "1" }, { text: "Repeat 5x", value: "5" }],
            [{ text: "Repeat 10x", value: "10" }]
          ]);
        } else {
          session.data.loopCount = 1;
          session.data.loopDelaySeconds = 0;
          session.step = "plan_slippage";
          await sendQuickSlippagePrompt(chatId, `Send slippage in basis points, or type default for ${CONFIG.defaultSlippageBps} bps.`);
        }
        break;
      case "plan_loop_count":
        session.data.loopCount = parseLoopCount(text);
        session.step = "plan_loop_delay";
        await sendQuickChoicePrompt(chatId, "Repeat wait: choose how long to wait before the next buy starts after a sell.", [
          [{ text: "No wait", value: "0" }, { text: "5 sec", value: "5s" }],
          [{ text: "30 sec", value: "30s" }, { text: "1 min", value: "1" }],
          [{ text: "5 min", value: "5" }]
        ]);
        break;
      case "plan_loop_delay":
        session.data.loopDelaySeconds = parseLoopDelaySeconds(text);
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

  try {
    await maybeSendAutomaticRecoveryKeyFile(chatId, session.userId, "removed-wallets", selected, "Optional recovery key file before wallet removal.");
  } catch (error) {
    await say(chatId, `Encrypted backup was sent, but the optional Solflare recovery key file failed: ${formatError(error)}.`);
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

async function maybeSendAutomaticRecoveryKeyFile(chatId, userId, groupLabel, walletRecords, reason) {
  if (!CONFIG.autoSendRecoveryKeyFile || !Array.isArray(walletRecords) || walletRecords.length === 0) {
    return null;
  }

  const filename = await sendPrivateKeyDocument(
    chatId,
    userId,
    walletRecords,
    `solflare-recovery-${sanitizeFilenamePart(groupLabel)}-${userId}`,
    {
      title: "SOLFLARE / PHANTOM RECOVERY KEY FILE",
      note: reason
    }
  );

  await say(chatId, [
    `I also sent a Solflare/Phantom recovery key file: ${filename}.`,
    "This file contains raw private keys. Anyone with it can drain these wallets.",
    "Keep it private, and use it only for emergency import/recovery."
  ].join("\n"));
  return filename;
}

async function sendAutomaticWalletBackup(chatId, userId, note, groupLabel = "wallets", walletRecords = null) {
  try {
    const filename = await sendWalletBackup(chatId, userId, note, groupLabel, walletRecords);
    const included = walletRecords?.length
      ? walletRecords.map((wallet) => `${wallet.label}: ${wallet.publicKey}`)
      : [];
    await say(chatId, [
      `I sent you an automatic encrypted wallet backup: ${filename}.`,
      included.length ? "" : "",
      included.length ? "This backup contains:" : "",
      ...included.slice(0, 10),
      included.length > 10 ? `...${included.length - 10} more wallet(s)` : "",
      "",
      "Keep it private. If Render resets, use Verify Backup File first, then Restore Backup or Rescue Backup Keys."
    ].filter(Boolean).join("\n"));
  } catch (error) {
    await say(chatId, `Automatic backup failed: ${formatError(error)}. Use Export Backup before funding wallets.`);
    return;
  }

  try {
    await maybeSendAutomaticRecoveryKeyFile(chatId, userId, groupLabel, walletRecords, note);
  } catch (error) {
    await say(chatId, `Encrypted backup was sent, but the optional Solflare recovery key file failed: ${formatError(error)}. You can use Backup / Restore > Solflare Key Export while the wallet is still loaded.`);
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

  const { filename, text } = buildWalletBackupDocument(userId, note, groupLabel, wallets);
  await sendDocument(chatId, filename, text);
  return filename;
}

function buildWalletBackupDocument(userId, note, groupLabel = "wallets", wallets = []) {
  const createdAt = new Date().toISOString();
  const backupId = backupFingerprint(wallets, createdAt);
  const text = encodeBackup({
    version: 1,
    backupId,
    createdAt,
    note,
    groupLabel,
    walletCount: wallets.length,
    walletPublicKeys: wallets.map((wallet) => wallet.publicKey),
    wallets: wallets.map((wallet) => ({
      label: wallet.label,
      publicKey: wallet.publicKey,
      secret: wallet.secret
    }))
  });

  const filename = walletBackupFilename(groupLabel, userId, wallets, createdAt, backupId);
  return { filename, text, createdAt, backupId };
}

function walletBackupFilename(groupLabel, userId, wallets, createdAt, backupId) {
  return [
    "wallet-backup",
    sanitizeFilenamePart(groupLabel),
    userId,
    compactTimestamp(createdAt),
    walletFilenameHint(wallets),
    backupId.slice(0, 8)
  ].filter(Boolean).join("-") + ".txt";
}

function backupFingerprint(wallets, createdAt) {
  return crypto
    .createHash("sha256")
    .update([
      createdAt,
      ...wallets.map((wallet) => `${wallet.label}:${wallet.publicKey}`)
    ].join("|"))
    .digest("hex")
    .slice(0, 16);
}

function compactTimestamp(isoText) {
  const date = new Date(isoText);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  return date.toISOString().replace(/\D/g, "").slice(0, 14);
}

function walletFilenameHint(wallets) {
  if (!Array.isArray(wallets) || wallets.length === 0) return "0w";
  if (wallets.length === 1) {
    const key = String(wallets[0].publicKey || "");
    return sanitizeFilenamePart(`${key.slice(0, 4)}-${key.slice(-4)}`);
  }
  return `${wallets.length}w`;
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
  const skippedExisting = [];
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
      skippedExisting.push(`${record.label}: ${record.publicKey}`);
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
  await say(chatId, [
    `Restore complete. Restored ${restored.length} wallet(s). Skipped ${skipped}.`,
    "",
    skippedExisting.length ? "Skipped because already loaded:" : "",
    ...skippedExisting.slice(0, 12),
    skippedExisting.length > 12 ? `...${skippedExisting.length - 12} more already-loaded wallet(s)` : "",
    "",
    errors.length ? "Skipped with errors:" : "",
    ...errors.slice(0, 5)
  ].filter(Boolean).join("\n"));
  if (restored.length > 0) {
    await sendAutomaticWalletBackup(chatId, session.userId, "Automatic backup after wallet restore.", "restored-wallets");
  }
  await showMenu(chatId, session.userId);
}

async function verifyBackupFileFlow(chatId, text, session) {
  const summary = inspectBackupPayload(text, session.userId);
  clearSession(chatId);
  await say(chatId, withBrandFooter(formatBackupInspectionSummary(summary)));
  await showBackupMenu(chatId);
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

function inspectBackupPayload(text, userId) {
  const backup = parseBackupPayload(text);
  const backupWallets = backupWalletList(backup);
  const rows = [];
  const errors = [];

  for (const [index, wallet] of backupWallets.entries()) {
    const declaredPublicKey = backupDeclaredPublicKey(wallet);
    const label = cleanLabel(wallet?.label || wallet?.name || `Backup Wallet ${index + 1}`);
    try {
      const record = walletRecordFromBackup(wallet, userId, index);
      rows.push({
        label: record.label,
        publicKey: record.publicKey,
        canOpen: true
      });
    } catch (error) {
      if (declaredPublicKey) {
        rows.push({
          label,
          publicKey: declaredPublicKey,
          canOpen: false,
          error: friendlyBackupError(error)
        });
      } else {
        errors.push(`Wallet ${index + 1}: ${friendlyBackupError(error)}`);
      }
    }
  }

  return {
    backupId: backup?.backupId || backup?.id || "",
    createdAt: backup?.createdAt || "",
    note: backup?.note || "",
    groupLabel: backup?.groupLabel || "",
    walletCount: backupWallets.length,
    openedCount: rows.filter((row) => row.canOpen).length,
    rows,
    errors
  };
}

function formatBackupInspectionSummary(summary) {
  const rows = summary.rows.slice(0, 25).map((row, index) => [
    `${index + 1}. ${row.label}`,
    row.publicKey,
    row.canOpen ? "Key check: opens with current APP_SECRET/raw key" : `Key check: not opened here (${row.error})`
  ].join("\n"));

  return [
    "Backup File Check",
    "",
    summary.backupId ? `Backup ID: ${summary.backupId}` : "",
    summary.createdAt ? `Created: ${summary.createdAt}` : "",
    summary.groupLabel ? `Group: ${summary.groupLabel}` : "",
    summary.note ? `Note: ${summary.note}` : "",
    `Wallet entries: ${summary.walletCount}`,
    `Keys opened: ${summary.openedCount}/${summary.walletCount}`,
    "",
    ...rows,
    summary.rows.length > 25 ? `...${summary.rows.length - 25} more wallet(s) in this backup` : "",
    summary.errors.length ? "" : "",
    summary.errors.length ? "Entries without readable public keys:" : "",
    ...summary.errors.slice(0, 5),
    "",
    "If the public address you need is listed here, use Rescue Backup Keys with this same file."
  ].filter(Boolean).join("\n");
}

async function sendPrivateKeyDocument(chatId, userId, wallets, filenamePrefix, options = {}) {
  const { filename, text } = buildPrivateKeyDocument(userId, wallets, filenamePrefix, options);
  await sendDocument(chatId, filename, text);
  return filename;
}

function buildPrivateKeyDocument(userId, wallets, filenamePrefix, options = {}) {
  const exportedAt = new Date().toISOString();
  const lines = [
    options.title || "EMERGENCY PRIVATE KEY EXPORT",
    "Anyone with these keys can drain these wallets.",
    "Import the base58 secret key into a trusted Solana wallet only.",
    "",
    `Exported: ${exportedAt}`,
    `Telegram user ID: ${userId}`,
    ""
  ];
  if (options.note) {
    lines.splice(3, 0, `Reason: ${options.note}`);
  }

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

  const filename = privateKeyExportFilename(filenamePrefix, wallets, exportedAt);
  return { filename, text: lines.join("\n"), exportedAt };
}

function privateKeyExportFilename(filenamePrefix, wallets, createdAt) {
  return [
    sanitizeFilenamePart(filenamePrefix || "private-keys"),
    compactTimestamp(createdAt),
    walletFilenameHint(wallets)
  ].filter(Boolean).join("-") + ".txt";
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
          const sell = await sellTokenAmountFromWallet(wallet, token.mint, token.rawAmount, session.data.slippageBps, { userId: session.userId });
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
  ensureTimedPlanHasExit({
    sellDelaySeconds: session.data.sellDelaySeconds,
    takeProfitPct: session.data.takeProfitPct,
    stopLossPct: session.data.stopLossPct,
    walletTakeProfitTargets: session.data.walletTakeProfitTargets,
    walletStopLossTargets: session.data.walletStopLossTargets,
    takeProfitLadder: session.data.takeProfitLadder
  });
  const now = Date.now();
  const sellAfterAt = planSellAfterAtFromNow(session.data, now);

  await runWithConcurrency(selectedWallets, CONFIG.bundleConcurrency, async ({ index, wallet }) => {
    try {
      const result = await buyTokenForPlan(wallet, session.data.tokenMint, amountLamports, session.data.slippageBps, { trackTokenDelta: true, userId: session.userId });
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
        basisLamports: Number(result.swapLamports || amountLamports),
        grossLamports: amountLamports,
        feeLamports: result.feeLamports,
        tokenOutAmount: result.tokenDeltaAmount || result.outputAmount || null,
        buySignature: result.signature,
        currentLoop: 1,
        completedLoops: 0,
        takeProfitPct: walletTakeProfitForIndex(session.data, index),
        stopLossPct: walletStopLossForIndex(session.data, index),
        completedTakeProfitLevels: [],
        sellAfterAt,
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
    sellAfterAt,
    sellPercent: session.data.sellPercent,
    triggerSellPercent: session.data.triggerSellPercent || 100,
    loopCount: session.data.loopCount || 1,
    loopDelaySeconds: session.data.loopDelaySeconds || 0,
    takeProfitPct: session.data.takeProfitPct,
    stopLossPct: session.data.stopLossPct,
    takeProfitMode: session.data.takeProfitMode || "single",
    stopLossMode: session.data.stopLossMode || "single",
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
    `Sell timer: ${formatSellTimerSummary(plan.sellDelaySeconds)}`,
    `Loops: ${plan.loopCount}`,
    `Take-profit: ${formatPlanTakeProfitSummary(plan)}`,
    `Stop-loss: ${formatPlanStopLossSummary(plan)}`,
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

async function createManualLaunchPlanFlow(chatId, session) {
  const store = await readWalletStore();
  const selectedWallets = session.data.walletIndexes.map((index) => getWalletAt(store, index, session.userId));
  const plan = {
    id: crypto.randomUUID(),
    status: "launch_watch",
    userId: session.userId,
    chatId,
    source: "manual_launch_snipe",
    launchTicker: session.data.ticker,
    walletSelector: session.data.walletSelector,
    amountSol: session.data.amountSol,
    sellDelayMinutes: session.data.sellDelayMinutes,
    sellDelaySeconds: session.data.sellDelaySeconds,
    sellPercent: session.data.sellPercent,
    triggerSellPercent: session.data.triggerSellPercent || 100,
    loopCount: 1,
    takeProfitPct: session.data.takeProfitPct,
    stopLossPct: session.data.stopLossPct,
    takeProfitMode: "single",
    stopLossMode: "single",
    takeProfitLadder: [],
    autoBundle: false,
    manualLaunch: true,
    slippageBps: session.data.slippageBps,
    createdAt: new Date().toISOString(),
    lastScanAt: null,
    wallets: selectedWallets.map((wallet) => ({
      label: wallet.label,
      publicKey: wallet.publicKey,
      status: "pending",
      results: []
    })),
    results: [`Watching for ticker $${session.data.ticker}`]
  };

  const plans = await readTradePlans();
  plans.plans.push(plan);
  await writeTradePlans(plans);
  await audit("create_manual_launch_snipe", {
    chatId,
    userId: session.userId,
    planId: plan.id,
    ticker: session.data.ticker,
    wallets: selectedWallets.map(publicWallet),
    amountSol: session.data.amountSol,
    takeProfitPct: session.data.takeProfitPct,
    stopLossPct: session.data.stopLossPct
  });

  clearSession(chatId);
  await sendManualLaunchArmedMessage(chatId, plan);
  setTimeout(() => void processTradePlans().catch((error) => {
    console.error("Manual launch immediate scan failed:", error.message);
  }), 250);
}

async function sendManualLaunchArmedMessage(chatId, plan) {
  await sendOrEditMessage(chatId, null, withBrandFooter([
    "Manual Launch Snipe armed.",
    `Ticker: $${plan.launchTicker}`,
    `Wallets: ${plan.wallets.length}`,
    `Buy amount: ${plan.amountSol} SOL per wallet`,
    `Take-profit: ${formatTakeProfitTarget(plan.takeProfitPct)}`,
    `Stop-loss: -${plan.stopLossPct}%`,
    `Fallback timer: ${formatSellTimerSummary(plan.sellDelaySeconds)}`,
    `Slippage: ${plan.slippageBps} bps`,
    `Scan speed: every ${(CONFIG.manualLaunchScanIntervalMs / 1000).toFixed(CONFIG.manualLaunchScanIntervalMs % 1000 === 0 ? 0 : 1)}s while online`,
    "Watch window: until matched or canceled",
    "",
    "The bot scans live launch/profile feeds and buys once a matching ticker appears."
  ].join("\n")), {
    inline_keyboard: [
      [{ text: "Cancel Watch", callback_data: `manual_launch_cancel:${plan.id}` }],
      [{ text: "OgreSniper", callback_data: "sniper_auto_menu" }, { text: "Main Menu", callback_data: "main_menu" }]
    ]
  });
}

async function showManualLaunchWatches(chatId, userId, messageId = null) {
  const store = await readTradePlans();
  const watches = store.plans
    .filter((plan) => plan.status === "launch_watch" && String(plan.userId) === String(userId))
    .sort((a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || ""));

  if (watches.length === 0) {
    await sendOrEditMessage(chatId, messageId, withBrandFooter([
      "Active Launch Watches",
      "",
      "No Manual Launch Snipe watches are currently scanning."
    ].join("\n")), {
      inline_keyboard: [
        [{ text: "New Manual Launch Snipe", callback_data: "sniper_manual_launch" }],
        [{ text: "Back", callback_data: "sniper_auto_menu" }]
      ]
    });
    return;
  }

  const lines = watches.slice(0, 10).map((plan, index) => [
    `${index + 1}. $${plan.launchTicker || "UNKNOWN"}`,
    `${plan.wallets?.length || 0} wallet(s), ${plan.amountSol} SOL each`,
    `TP/SL: ${formatPlanTakeProfitSummary(plan)} / ${formatPlanStopLossSummary(plan)}`,
    `Armed: ${formatTradeTimestamp(plan.createdAt)}`
  ].join(" | "));

  const cancelRows = watches.slice(0, 8).map((plan, index) => ([{
    text: `Cancel ${index + 1}: $${plan.launchTicker || "UNKNOWN"}`,
    callback_data: `manual_launch_cancel:${plan.id}`
  }]));

  await sendOrEditMessage(chatId, messageId, withBrandFooter([
    "Active Launch Watches",
    "",
    `Scan speed: about every ${(CONFIG.manualLaunchScanIntervalMs / 1000).toFixed(CONFIG.manualLaunchScanIntervalMs % 1000 === 0 ? 0 : 1)}s while online`,
    "",
    ...lines
  ].join("\n")), {
    inline_keyboard: [
      ...cancelRows,
      [{ text: "Refresh Watches", callback_data: "manual_launch_watches" }],
      [{ text: "New Manual Launch Snipe", callback_data: "sniper_manual_launch" }],
      [{ text: "Back", callback_data: "sniper_auto_menu" }]
    ]
  });
}

async function cancelManualLaunchWatch(chatId, userId, planId, messageId = null) {
  const store = await readTradePlans();
  const plan = store.plans.find((item) => item.id === planId);

  if (!plan || String(plan.userId) !== String(userId)) {
    await say(chatId, "I could not find that launch watch for your Telegram account.");
    return;
  }

  if (plan.status !== "launch_watch") {
    const alreadyMatched = plan.status === "watching";
    await sendOrEditMessage(chatId, messageId, withBrandFooter([
      alreadyMatched ? "This launch already matched and bought." : "This launch watch is no longer scanning.",
      `Ticker: $${plan.launchTicker || "unknown"}`,
      `Status: ${plan.status}`,
      "",
      alreadyMatched
        ? "The cancel button only stops pre-launch scanning. Use Positions or Trade Sell if you want to exit an active position."
        : "No scanning action is running for this watch."
    ].join("\n")), {
      inline_keyboard: [
        [{ text: "Positions", callback_data: "positions_overview" }, { text: "Trade", callback_data: "trade_menu" }],
        [{ text: "OgreSniper", callback_data: "sniper_auto_menu" }]
      ]
    });
    return;
  }

  plan.status = "canceled";
  plan.canceledAt = new Date().toISOString();
  plan.results = appendLimited([...(plan.results || []), "Canceled before launch match"]);
  await writeTradePlans(store);
  await audit("cancel_manual_launch_snipe", {
    chatId,
    userId,
    planId,
    ticker: plan.launchTicker
  });

  await sendOrEditMessage(chatId, messageId, withBrandFooter([
    "Manual Launch Snipe canceled.",
    `Ticker: $${plan.launchTicker}`,
    "",
    "No buy was sent. You can arm a new launch watch anytime."
  ].join("\n")), {
    inline_keyboard: [
      [{ text: "New Manual Launch Snipe", callback_data: "sniper_manual_launch" }],
      [{ text: "OgreSniper", callback_data: "sniper_auto_menu" }, { text: "Main Menu", callback_data: "main_menu" }]
    ]
  });
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
    const feeSignature = await collectSolFee(keypair, feeLamports, { userId: options.userId });
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
  const token = await getReliableTokenBalanceForMint(keypair.publicKey, new PublicKey(tokenMint), { throwOnError: true });
  if (!token || token.rawAmount === 0n) {
    throw new Error("no token balance");
  }

  const amount = sellAmountForPercent(token.rawAmount, percent, options.baseRawAmount);
  if (amount === 0n) {
    throw new Error("sell amount rounded to zero");
  }

  return sellTokenAmountFromWallet(wallet, tokenMint, amount, slippageBps, options);
}

async function sellTokenAmountFromWallet(wallet, tokenMint, amount, slippageBps, options = {}) {
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
    const feeSignature = await collectSolFee(keypair, feeLamports, { userId: options.userId });
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

async function getReliableTokenBalanceForMint(owner, mint, options = {}) {
  const ownerKey = owner instanceof PublicKey ? owner : new PublicKey(owner);
  const mintKey = mint instanceof PublicKey ? mint : new PublicKey(mint);
  let lastError = null;
  let lastBalance = null;

  try {
    const direct = await getTokenBalanceForMintCached(ownerKey, mintKey, { force: true });
    if (direct?.rawAmount > 0n) return direct;
    lastBalance = direct || lastBalance;
  } catch (error) {
    lastError = error;
  }

  try {
    const lookup = await getOwnedTokenAccountsWithWarningsCached(ownerKey, { force: true });
    const aggregate = aggregateTokenAccountsForMint(lookup.accounts || [], mintKey);
    if (aggregate?.rawAmount > 0n) {
      setTimedCache(tokenBalanceCache, `${ownerKey.toBase58()}:${mintKey.toBase58()}`, aggregate);
      return aggregate;
    }
    lastBalance = aggregate || lastBalance;
    if (lookup.warnings?.length && !lastError) {
      lastError = new Error(lookup.warnings.join(" | "));
    }
  } catch (error) {
    lastError = error;
  }

  if (options.throwOnError && lastError) {
    throw lastError;
  }
  return lastBalance;
}

async function getPlanWalletTokenBalance(plan, wallet, planWallet, options = {}) {
  const attempts = Math.max(1, Math.min(6, Number.parseInt(options.attempts || 1, 10) || 1));
  const keypair = decryptWallet(wallet);
  const mintKey = new PublicKey(plan.tokenMint);
  let lastError = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt > 0) {
      invalidateWalletReadCache(wallet.publicKey);
      await sleep(Math.min(1_500, 250 + attempt * 250));
    }

    try {
      const token = await getReliableTokenBalanceForMint(keypair.publicKey, mintKey, { throwOnError: false });
      if (token?.rawAmount > 0n) {
        recoverPlanWalletTokenOutAmount(planWallet, token);
        return token;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (options.throwOnMissing) {
    throw lastError || new Error("no live token balance");
  }
  return null;
}

function exitSlippageAttemptList(baseSlippageBps, priceExit = false) {
  const maxSlippageBps = 5_000;
  const defaultSlippageBps = Number(CONFIG.defaultSlippageBps || 400);
  const base = Math.max(1, Math.min(maxSlippageBps, Number.parseInt(baseSlippageBps || defaultSlippageBps, 10) || defaultSlippageBps));
  if (!priceExit) return [base];
  return [...new Set([
    base,
    Math.max(base, CONFIG.stopLossExitSlippageBps),
    Math.max(base, 2_500),
    Math.max(base, 4_000),
    maxSlippageBps
  ].map((value) => Math.max(1, Math.min(maxSlippageBps, Number.parseInt(value, 10) || base))))];
}

async function sellTradePlanWalletWithRetries(plan, planWallet, wallet, sellPercent, baseSlippageBps, options = {}) {
  const priceExit = Boolean(options.priceExit);
  const slippageAttempts = exitSlippageAttemptList(baseSlippageBps, priceExit);
  const attemptLog = [];
  let lastError = null;

  for (const slippageBps of slippageAttempts) {
    try {
      invalidateWalletReadCache(wallet.publicKey);
      const token = await getPlanWalletTokenBalance(plan, wallet, planWallet, {
        attempts: priceExit ? 4 : 2,
        throwOnMissing: true
      });
      const tokenBaseRawAmount = recoverPlanWalletTokenOutAmount(planWallet, token);
      const amount = sellAmountForPercent(token.rawAmount, sellPercent, tokenBaseRawAmount);
      if (amount === 0n) {
        throw new Error("sell amount rounded to zero");
      }

      const sell = await sellTokenAmountFromWallet(wallet, plan.tokenMint, amount, slippageBps, { userId: options.userId });
      sell.sellSlippageBps = slippageBps;
      planWallet.exitSlippageAttempts = attemptLog;
      return sell;
    } catch (error) {
      lastError = error;
      attemptLog.push({
        at: new Date().toISOString(),
        slippageBps,
        error: friendlyError(error)
      });
      if (!priceExit) break;
      await sleep(350);
    }
  }

  planWallet.exitSlippageAttempts = attemptLog;
  throw lastError || new Error("sell failed");
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

function positiveBigIntOrZero(value) {
  if (value === null || value === undefined || value === "") return 0n;
  try {
    const amount = BigInt(String(value));
    return amount > 0n ? amount : 0n;
  } catch {
    return 0n;
  }
}

function positiveRawString(value) {
  const amount = positiveBigIntOrZero(value);
  return amount > 0n ? amount.toString() : null;
}

function planWalletBasisLamports(plan, planWallet) {
  for (const key of ["basisLamports", "basisLamportsRaw", "swapLamports", "grossLamports", "amountLamports"]) {
    const amount = positiveBigIntOrZero(planWallet?.[key]);
    if (amount > 0n) return amount;
  }

  const fallbackSol = Number.parseFloat(String(planWallet?.amountSol ?? plan?.amountSol ?? plan?.buyAmountSol ?? 0));
  if (Number.isFinite(fallbackSol) && fallbackSol > 0) {
    return BigInt(Math.floor(fallbackSol * LAMPORTS_PER_SOL));
  }

  return 0n;
}

function recoverPlanWalletTokenOutAmount(planWallet, token) {
  const existing = positiveRawString(planWallet?.tokenOutAmount);
  if (existing) return existing;

  const rawAmount = positiveRawString(token?.rawAmount);
  if (planWallet && rawAmount) {
    planWallet.tokenOutAmount = rawAmount;
    planWallet.recoveredTokenOutAmountAt = new Date().toISOString();
    planWallet.lastRecoveryNote = "Recovered token amount from on-chain balance.";
  }
  return rawAmount;
}

function scheduleTradePlanProcessing(label = "trade plan", delays = [500, 1500, 4000, 10000, 20000]) {
  for (const delay of delays) {
    setTimeout(() => void processTradePlans().catch((error) => {
      console.error(`${label} processing failed:`, error.message);
    }), delay);
  }
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
      || planWallet?.stopLossPct
      || plan.takeProfitPct
      || planWallet?.takeProfitPct
      || nextTakeProfitLadderLevel(plan, planWallet)
  );
}

function planSellAfterAtFromNow(plan, now = Date.now()) {
  const seconds = Number(plan?.sellDelaySeconds);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return new Date(now + seconds * 1000).toISOString();
}

function ensureTimedPlanHasExit({
  sellDelaySeconds,
  takeProfitPct,
  stopLossPct,
  walletTakeProfitTargets,
  walletStopLossTargets,
  takeProfitLadder
} = {}) {
  const hasExit = Number(sellDelaySeconds || 0) > 0
    || Number(takeProfitPct || 0) > 0
    || Number(stopLossPct || 0) > 0
    || (Array.isArray(takeProfitLadder) && takeProfitLadder.length > 0)
    || Boolean(walletTakeProfitTargets && Object.keys(walletTakeProfitTargets).length)
    || Boolean(walletStopLossTargets && Object.keys(walletStopLossTargets).length);

  if (!hasExit) {
    throw new Error("Turn on take-profit, stop-loss, or a fallback timer before starting this plan.");
  }
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

function walletStopLossPct(plan, planWallet) {
  const value = plan.stopLossMode === "wallets" && planWallet?.stopLossPct
    ? planWallet.stopLossPct
    : plan.stopLossPct;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function timedPlanExitSource(plan) {
  if (plan.source === "autosnipe") return "autosnipe_exit";
  if (plan.source === "pumpsnipe") return "pumpsnipe_exit";
  if (plan.source === "manual_launch_snipe") return "manual_launch_snipe_exit";
  if (plan.source === "kol_copy_wallet") return "kol_copy_wallet_exit";
  if (plan.source === "auto_bundle") return "auto_bundle_exit";
  if (plan.source === "web_bundle_plan") return "web_bundle_plan_exit";
  if (plan.source === "web_trade_plan") return "web_trade_plan_exit";
  if (plan.source === "web_trade_auto_exit") return "web_trade_auto_exit";
  if (plan.source === "web_volume") return "web_volume_exit";
  return "timed_plan";
}

function isActiveTimedWalletStatus(status) {
  return ["armed", "watching", "retrying", "submitting", "waiting_next_loop", "timer-only"].includes(String(status || "").toLowerCase());
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
      if (plan.status === "launch_watch") {
        const result = await processLaunchWatchPlan(plan, walletStore);
        if (result.changed) changed = true;
        if (result.message && plan.chatId) {
          await say(plan.chatId, withBrandFooter(result.message));
        }
        continue;
      }

      if (plan.status === "copy_wallet_watch") {
        const result = await processCopyWalletWatchPlan(plan, walletStore);
        if (result.changed) changed = true;
        if (result.message && plan.chatId) {
          await say(plan.chatId, withBrandFooter(result.message));
        }
        continue;
      }

      if (plan.status !== "watching") continue;

      const walletMessages = [];
      const pnlCardTokens = new Set();
      for (const planWallet of plan.wallets) {
        if (!isActiveTimedWalletStatus(planWallet.status)) continue;
        const result = await processTradePlanWallet(plan, planWallet, walletStore);
        if (result.changed) changed = true;
        if (result.message) walletMessages.push(result.message);
        if (result.pnlCardToken) pnlCardTokens.add(result.pnlCardToken);
      }

      if (plan.wallets.every((wallet) => !isActiveTimedWalletStatus(wallet.status))) {
        plan.status = "completed";
        plan.completedAt = new Date().toISOString();
        changed = true;
      }

      if (walletMessages.length > 0 && plan.chatId) {
        await say(plan.chatId, withBrandFooter([
          `${plan.autoBundle ? "Auto Bundle update" : "Timed trade plan update"}: ${plan.id}`,
          ...walletMessages
        ].join("\n")));
      }

      for (const tokenMint of plan.chatId ? pnlCardTokens : []) {
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

  if (planWallet.status === "waiting_next_loop") {
    const nextLoopAt = Date.parse(planWallet.nextLoopAt || "");
    if (!Number.isFinite(nextLoopAt) || Date.now() < nextLoopAt) {
      return { changed: false, message: null };
    }
    return startDelayedTimedPlanLoop(plan, planWallet, wallet);
  }

  let triggerReason = null;
  let triggerMeta = null;
  const now = Date.now();
  const retryAfterAt = Date.parse(planWallet.retryAfterAt || "");
  if (Number.isFinite(retryAfterAt) && now < retryAfterAt) {
    return { changed: false, message: null };
  }

  if (
    !triggerReason
    && isPriceExitTrigger(planWallet.triggerReason)
    && Number.parseInt(planWallet.failures || 0, 10) > 0
    && !["sold", "confirmed", "failed", "cancelled"].includes(String(planWallet.exitStatus || planWallet.status || "").toLowerCase())
  ) {
    triggerReason = planWallet.triggerReason;
    triggerMeta = {
      kind: /^stop-loss\b/i.test(String(planWallet.triggerReason || "")) ? "stop-loss" : "take-profit",
      sellPercent: /^stop-loss\b/i.test(String(planWallet.triggerReason || ""))
        ? 100
        : (planWallet.triggerSellPercent ?? plan.triggerSellPercent ?? 100)
    };
    planWallet.triggerStatus = "retrying";
    planWallet.lastTriggerCheckAt = new Date().toISOString();
  }

  if (!triggerReason && planHasPriceExit(plan, planWallet)) {
    const lastCheckedAt = Date.parse(planWallet.lastCheckedAt || "");
    const timerDue = now >= Date.parse(planWallet.sellAfterAt || plan.sellAfterAt);
    if (!timerDue && Number.isFinite(lastCheckedAt) && now - lastCheckedAt < CONFIG.stopLossCheckIntervalMs) {
      return { changed: false, message: null };
    }

    try {
      const stopLossPct = walletStopLossPct(plan, planWallet);
      const ladderLevel = nextTakeProfitLadderLevel(plan, planWallet);
      const takeProfitPct = ladderLevel ? Number(ladderLevel.pct) : walletTakeProfitPct(plan, planWallet);
      const estimateSellPercent = stopLossPct
        ? 100
        : (ladderLevel?.sellPercent ?? planWallet.triggerSellPercent ?? plan.triggerSellPercent ?? 100);
      invalidateWalletReadCache(wallet.publicKey);
      const estimate = await estimatePlanWalletMove(plan, wallet, estimateSellPercent);
      planWallet.lastCheckedAt = new Date().toISOString();
      planWallet.lastMovePct = estimate.movePct;
      planWallet.lastEstimateSource = estimate.source || "jupiter";
      planWallet.lastEstimatedNetOut = estimate.estimatedNetOut?.toString?.() || null;
      planWallet.lastBasisLamports = estimate.basis?.toString?.() || null;
      planWallet.lastMonitorSlippageBps = estimate.monitorSlippageBps || CONFIG.stopLossMonitorSlippageBps;
      planWallet.lastError = estimate.quoteError ? `Jupiter quote fallback: ${estimate.quoteError}` : null;
      planWallet.triggerStatus = "watching";
      planWallet.lastTriggerCheckAt = planWallet.lastCheckedAt;
      planWallet.triggerCheckIntervalMs = CONFIG.stopLossCheckIntervalMs;

      const stopLossTriggerPct = stopLossPct
        ? Math.max(0.1, Number(stopLossPct) - CONFIG.stopLossTriggerBufferPct)
        : 0;

      if (stopLossPct && estimate.movePct <= -stopLossTriggerPct) {
        const armedPct = Number(stopLossPct).toFixed(2).replace(/\.00$/, "");
        triggerReason = `stop-loss ${estimate.movePct.toFixed(2)}% (armed ${armedPct}%)`;
        triggerMeta = { kind: "stop-loss", sellPercent: 100 };
        planWallet.triggerStatus = "triggered";
        planWallet.triggerKind = "stop-loss";
        planWallet.triggerTargetPct = stopLossPct;
        planWallet.triggerSellPercent = 100;
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
        planWallet.triggerStatus = "triggered";
        planWallet.triggerKind = "take-profit";
        planWallet.triggerTargetPct = ladderLevel?.pct ?? takeProfitPct;
        planWallet.triggerSellPercent = triggerMeta.sellPercent;
      } else {
        return { changed: true, message: null };
      }
    } catch (error) {
      planWallet.lastCheckedAt = new Date().toISOString();
      planWallet.lastError = friendlyError(error);
      planWallet.triggerStatus = timerDue ? "timer-triggered" : "watching";
      planWallet.lastTriggerCheckAt = planWallet.lastCheckedAt;
      if (timerDue) {
        triggerReason = "timer";
      } else {
        return { changed: true, message: null };
      }
    }
  }

  if (!triggerReason && now >= Date.parse(planWallet.sellAfterAt || plan.sellAfterAt)) {
    triggerReason = "timer";
  }

  if (!triggerReason) {
    return { changed: false, message: null };
  }

  try {
    const triggeredAt = new Date().toISOString();
    planWallet.status = "submitting";
    planWallet.exitStatus = "submitting";
    planWallet.triggeredAt = planWallet.triggeredAt || triggeredAt;
    planWallet.triggerReason = triggerReason;
    planWallet.lastSellAttemptAt = triggeredAt;
    planWallet.updatedAt = triggeredAt;
    invalidateWalletReadCache(wallet.publicKey);
    const priceExitTrigger = isPriceExitTrigger(triggerReason);
    const sellPercent = effectiveTimedSellPercent(plan, planWallet, triggerReason, triggerMeta);
    if (priceExitTrigger) {
      planWallet.triggerStatus = "submitting";
      planWallet.triggerKind = triggerMeta?.kind || (/^stop-loss\b/i.test(String(triggerReason || "")) ? "stop-loss" : "take-profit");
      planWallet.triggerSellPercent = sellPercent;
    }
    const exitSlippageBps = priceExitTrigger
      ? Math.max(Number(plan.slippageBps || 0), CONFIG.stopLossExitSlippageBps)
      : plan.slippageBps;
    planWallet.exitSlippageBps = exitSlippageBps;
    const sell = await sellTradePlanWalletWithRetries(plan, planWallet, wallet, sellPercent, exitSlippageBps, {
      userId: plan.userId,
      priceExit: priceExitTrigger
    });
    planWallet.exitSlippageBps = sell.sellSlippageBps || exitSlippageBps;
    invalidateWalletReadCache(wallet.publicKey);
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
      planWallet.triggerReason = `${triggerReason} (ladder ${formatTakeProfitTarget(triggerMeta.targetPct)})`;
      planWallet.failures = 0;
      planWallet.error = null;
      planWallet.lastError = null;
      planWallet.retryAfterAt = null;
      planWallet.sellFeeStatus = sell.feeStatus;
      planWallet.updatedAt = new Date().toISOString();

      const nextLevel = nextTakeProfitLadderLevel(plan, planWallet);
      if (nextLevel) {
        planWallet.status = "watching";
        planWallet.exitStatus = "watching";
        planWallet.triggerStatus = "watching";
        planWallet.triggerKind = null;
        return {
          changed: true,
          message: `${formatTimedSellSuccessLine(planWallet, sell, planWallet.triggerReason, plan.loopCount || 1)}; next ladder target ${formatTakeProfitTarget(nextLevel.pct)} sells ${nextLevel.sellPercent}%`
        };
      }

      planWallet.status = "sold";
      planWallet.exitStatus = "confirmed";
      planWallet.triggerStatus = "confirmed";
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
    planWallet.error = null;
    planWallet.lastError = null;
    planWallet.retryAfterAt = null;
    planWallet.exitStatus = "confirmed";
    planWallet.triggerStatus = priceExitTrigger ? "confirmed" : (planWallet.triggerStatus || "timer-confirmed");
    planWallet.sellSignature = sell.signature;
    planWallet.sellFeeStatus = sell.feeStatus;
    planWallet.soldAt = new Date().toISOString();

    if (planWallet.completedLoops < (plan.loopCount || 1)) {
      const loopDelaySeconds = Number(plan.loopDelaySeconds || 0);
      if (loopDelaySeconds > 0) {
        planWallet.status = "waiting_next_loop";
        planWallet.triggerStatus = "waiting_next_loop";
        planWallet.nextLoopAt = new Date(Date.now() + loopDelaySeconds * 1000).toISOString();
        planWallet.updatedAt = new Date().toISOString();
        return {
          changed: true,
          message: `${formatTimedSellSuccessLine(planWallet, sell, triggerReason, plan.loopCount || 1)}; next loop starts in ${formatDelay(loopDelaySeconds)}`
        };
      }
      return restartTimedPlanLoop(plan, planWallet, wallet, sell, triggerReason);
    }

    planWallet.status = "sold";
    planWallet.exitStatus = "confirmed";
    planWallet.soldAt = new Date().toISOString();
    return {
      changed: true,
      message: `${formatTimedSellSuccessLine(planWallet, sell, triggerReason, plan.loopCount || 1)}`,
      pnlCardToken: plan.tokenMint
    };
  } catch (error) {
    const failures = Number.parseInt(planWallet.failures || 0, 10) + 1;
    const priceExit = isPriceExitTrigger(triggerReason);
    const maxFailures = priceExit ? 90 : 5;
    const retryDelayMs = failures >= maxFailures ? 0 : (priceExit ? Math.min(6_000, 500 * failures) : Math.min(12_000, 750 * failures));
    planWallet.failures = failures;
    planWallet.status = failures >= maxFailures ? "failed" : (priceExit ? "retrying" : "watching");
    planWallet.exitStatus = failures >= maxFailures ? "failed" : (priceExit ? "retrying" : "watching");
    planWallet.triggerStatus = failures >= maxFailures ? "failed" : (priceExit ? "retrying" : "watching");
    planWallet.triggerReason = triggerReason;
    planWallet.error = friendlyError(error);
    planWallet.lastError = friendlyError(error);
    planWallet.lastFailedAt = new Date().toISOString();
    planWallet.retryAfterAt = retryDelayMs > 0 ? new Date(Date.now() + retryDelayMs).toISOString() : null;
    planWallet.nextRetryAt = planWallet.retryAfterAt;
    planWallet.updatedAt = new Date().toISOString();
    return {
      changed: true,
      message: `${planWallet.label}: sell failed by ${triggerReason} (${failures}/${maxFailures}) - ${friendlyError(error)}${failures < maxFailures ? `. Will retry in ${Math.ceil(retryDelayMs / 1000)}s.` : ""}`
    };
  }
}

async function processCopyWalletWatchPlan(plan, walletStore) {
  const intervalMs = Math.max(5_000, Math.min(CONFIG.kolCopyScanIntervalMs, 300_000));
  const lastScanAt = Date.parse(plan.lastScanAt || "");
  if (Number.isFinite(lastScanAt) && Date.now() - lastScanAt < intervalMs) {
    return { changed: false, message: null };
  }

  plan.lastScanAt = new Date().toISOString();
  if (!CONFIG.solanaTrackerApiKey) {
    plan.lastError = "SOLANA_TRACKER_API_KEY is required for live copy-wallet watches.";
    return { changed: true, message: null };
  }

  const owner = parsePublicKey(plan.copyWallet || "").toBase58();
  const signals = await fetchKolWalletTradeSignals(owner, "fresh", {
    limit: 12,
    cacheTtlMs: Math.max(0, Math.min(intervalMs - 500, CONFIG.solanaTrackerKolCacheTtlMs))
  }).catch((error) => {
    plan.lastError = friendlyError(error);
    return [];
  });
  const seen = new Set(plan.seenTokenMints || []);
  const signal = signals.find((row) => row.tokenMint && !seen.has(row.tokenMint));
  plan.seenTokenMints = uniqueStrings([
    ...(plan.seenTokenMints || []),
    ...signals.map((row) => row.tokenMint).filter(Boolean)
  ]).slice(-80);

  if (!signal) {
    return { changed: true, message: null };
  }

  const tokenMint = parsePublicKey(signal.tokenMint).toBase58();
  plan.tokenMint = tokenMint;
  plan.copyMatchedAt = new Date().toISOString();
  plan.copySignal = {
    tokenMint,
    symbol: signal.symbol || shortMint(tokenMint),
    name: signal.name || "Unknown Token",
    source: signal.sourceLabel || signal.source || "KOL wallet trade",
    lastTradeAt: signal.lastTradeAt || null
  };
  plan.sellAfterAt = planSellAfterAtFromNow(plan);

  const ownerWallets = walletsForOwner(walletStore, plan.userId);
  const amountLamports = solToLamports(plan.amountSol);
  const tradeEvents = [];
  const results = [];

  for (const planWallet of plan.wallets) {
    const wallet = ownerWallets.find((item) => item.publicKey === planWallet.publicKey);
    if (!wallet) {
      planWallet.status = "failed";
      planWallet.error = "wallet not found";
      planWallet.updatedAt = new Date().toISOString();
      results.push(`${planWallet.label}: wallet not found`);
      continue;
    }

    try {
      const buy = await buyTokenForPlan(wallet, tokenMint, amountLamports, plan.slippageBps, { trackTokenDelta: true, userId: plan.userId });
      Object.assign(planWallet, {
        basisLamports: Number(buy.swapLamports || amountLamports),
        grossLamports: amountLamports,
        feeLamports: buy.feeLamports,
        tokenOutAmount: buy.tokenDeltaAmount || buy.outputAmount || null,
        buySignature: buy.signature,
        currentLoop: 1,
        completedLoops: 0,
        completedTakeProfitLevels: [],
        sellAfterAt: plan.sellAfterAt,
        status: "watching",
        lastCheckedAt: null,
        lastMovePct: null,
        error: null,
        updatedAt: new Date().toISOString()
      });
      results.push(`${planWallet.label}: copied ${signal.symbol || shortMint(tokenMint)} with ${plan.amountSol} SOL`);
      tradeEvents.push({
        userId: plan.userId,
        type: "buy",
        source: "kol_copy_wallet",
        tokenMint,
        walletLabel: wallet.label,
        walletPublicKey: wallet.publicKey,
        solLamportsSpent: String(amountLamports),
        tokenAmount: buy.tokenDeltaAmount || buy.outputAmount || null,
        signature: buy.signature
      });
    } catch (error) {
      planWallet.status = "failed";
      planWallet.error = friendlyError(error);
      planWallet.updatedAt = new Date().toISOString();
      results.push(`${planWallet.label}: copy buy failed - ${friendlyError(error)}`);
    }
  }

  plan.results = [
    ...(plan.results || []),
    `Matched ${signal.symbol || shortMint(tokenMint)} (${shortMint(tokenMint)})`,
    ...results
  ].filter(Boolean).slice(-20);

  if (tradeEvents.length > 0) {
    await recordTradeEvents(tradeEvents);
    plan.status = "watching";
    return {
      changed: true,
      message: [
        `KOL Copy Wallet matched ${signal.symbol || shortMint(tokenMint)}`,
        `Wallet: ${shortMint(owner)}`,
        `CA: ${tokenMint}`,
        `Chart: ${dexScreenerUrl(tokenMint)}`,
        "",
        ...results
      ].join("\n")
    };
  }

  plan.status = "copy_wallet_watch";
  plan.lastError = "Matched a wallet buy, but no managed wallet buys succeeded.";
  return { changed: true, message: null };
}

async function processLaunchWatchPlan(plan, walletStore) {
  const lastScanAt = Date.parse(plan.lastScanAt || "");
  if (Number.isFinite(lastScanAt) && Date.now() - lastScanAt < CONFIG.manualLaunchScanIntervalMs) {
    return { changed: false, message: null };
  }

  plan.lastScanAt = new Date().toISOString();
  const match = await findManualLaunchCandidate(plan.launchTicker);
  if (!match) {
    return { changed: true, message: null };
  }

  plan.tokenMint = match.tokenMint;
  plan.launchMatchedAt = new Date().toISOString();
  plan.sellAfterAt = planSellAfterAtFromNow(plan);
  const amountLamports = solToLamports(plan.amountSol);
  const tradeEvents = [];
  const results = [];

  for (const planWallet of plan.wallets) {
    const wallet = walletsForOwner(walletStore, plan.userId).find((item) => item.publicKey === planWallet.publicKey);
    if (!wallet) {
      planWallet.status = "failed";
      planWallet.error = "wallet not found";
      results.push(`${planWallet.label}: wallet not found`);
      continue;
    }

    try {
      const buy = await buyTokenForPlan(wallet, match.tokenMint, amountLamports, plan.slippageBps, { trackTokenDelta: true, userId: plan.userId });
      Object.assign(planWallet, {
        basisLamports: Number(buy.swapLamports || amountLamports),
        grossLamports: amountLamports,
        feeLamports: buy.feeLamports,
        tokenOutAmount: buy.tokenDeltaAmount || buy.outputAmount || null,
        buySignature: buy.signature,
        currentLoop: 1,
        completedLoops: 0,
        completedTakeProfitLevels: [],
        sellAfterAt: plan.sellAfterAt,
        status: "watching",
        lastCheckedAt: null,
        lastMovePct: null,
        error: null,
        updatedAt: new Date().toISOString()
      });
      results.push(`${planWallet.label}: bought $${plan.launchTicker} (${shortMint(match.tokenMint)}) with ${plan.amountSol} SOL`);
      tradeEvents.push({
        userId: plan.userId,
        type: "buy",
        source: "manual_launch_snipe",
        tokenMint: match.tokenMint,
        walletLabel: wallet.label,
        walletPublicKey: wallet.publicKey,
        solLamportsSpent: String(amountLamports),
        tokenAmount: buy.tokenDeltaAmount || buy.outputAmount || null,
        signature: buy.signature
      });
    } catch (error) {
      planWallet.status = "failed";
      planWallet.error = friendlyError(error);
      planWallet.updatedAt = new Date().toISOString();
      results.push(`${planWallet.label}: buy failed - ${friendlyError(error)}`);
    }
  }

  if (tradeEvents.length > 0) {
    await recordTradeEvents(tradeEvents);
    plan.status = "watching";
    plan.results = appendLimited([...(plan.results || []), ...results]);
    return {
      changed: true,
      message: [
        `Manual Launch Snipe matched $${plan.launchTicker}: ${match.symbol || match.name || shortMint(match.tokenMint)}`,
        `CA: ${match.tokenMint}`,
        `Chart: ${dexScreenerUrl(match.tokenMint)}`,
        "",
        ...results
      ].join("\n")
    };
  }

  plan.status = "failed";
  plan.results = appendLimited([...(plan.results || []), ...results]);
  return {
    changed: true,
    message: [
      `Manual Launch Snipe found $${plan.launchTicker}, but no buys succeeded.`,
      `CA: ${match.tokenMint}`,
      "",
      ...results
    ].join("\n")
  };
}

async function restartTimedPlanLoop(plan, planWallet, wallet, sell, triggerReason) {
  try {
    const amountLamports = solToLamports(plan.amountSol);
    const buy = await buyTokenForPlan(wallet, plan.tokenMint, amountLamports, plan.slippageBps, { trackTokenDelta: true, userId: plan.userId });
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
    planWallet.basisLamports = Number(buy.swapLamports || amountLamports);
    planWallet.grossLamports = amountLamports;
    planWallet.feeLamports = buy.feeLamports;
    planWallet.tokenOutAmount = buy.tokenDeltaAmount || buy.outputAmount || null;
    planWallet.buySignature = buy.signature;
    planWallet.lastCheckedAt = null;
    planWallet.lastMovePct = null;
    planWallet.lastError = null;
    planWallet.nextLoopAt = null;
    planWallet.sellAfterAt = planSellAfterAtFromNow(plan);
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

async function startDelayedTimedPlanLoop(plan, planWallet, wallet) {
  try {
    const amountLamports = solToLamports(plan.amountSol);
    const buy = await buyTokenForPlan(wallet, plan.tokenMint, amountLamports, plan.slippageBps, { trackTokenDelta: true, userId: plan.userId });
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
    planWallet.basisLamports = Number(buy.swapLamports || amountLamports);
    planWallet.grossLamports = amountLamports;
    planWallet.feeLamports = buy.feeLamports;
    planWallet.tokenOutAmount = buy.tokenDeltaAmount || buy.outputAmount || null;
    planWallet.buySignature = buy.signature;
    planWallet.lastCheckedAt = null;
    planWallet.lastMovePct = null;
    planWallet.lastError = null;
    planWallet.nextLoopAt = null;
    planWallet.sellAfterAt = planSellAfterAtFromNow(plan);
    planWallet.updatedAt = new Date().toISOString();

    return {
      changed: true,
      message: `started loop ${planWallet.currentLoop}/${plan.loopCount}, ${formatBuySuccessLine(wallet, buy.amountLamports, buy.feeLamports, buy.swapLamports, buy, buy.feeStatus)}`
    };
  } catch (error) {
    planWallet.status = "failed";
    planWallet.error = `delayed loop buy failed: ${friendlyError(error)}`;
    planWallet.updatedAt = new Date().toISOString();
    return {
      changed: true,
      message: `${planWallet.label}: next loop buy failed - ${friendlyError(error)}`
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

      if (messages.length > 0 && plan.chatId) {
        await say(plan.chatId, withBrandFooter([
          `DCA ${plan.side} update: ${plan.id}`,
          ...messages
        ].join("\n")));
      }

      for (const tokenMint of plan.chatId ? pnlCardTokens : []) {
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
      const buy = await buyTokenForPlan(wallet, plan.tokenMint, amountLamports, plan.slippageBps, { userId: plan.userId });
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
    const sell = await sellTokenAmountFromWallet(wallet, plan.tokenMint, amountRaw, plan.slippageBps, { userId: plan.userId });
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

async function estimatePlanWalletMove(plan, wallet, sellPercentOverride = null) {
  const keypair = decryptWallet(wallet);
  const planWallet = plan.wallets.find((item) => item.publicKey === wallet.publicKey);
  const token = await getPlanWalletTokenBalance(plan, wallet, planWallet, { attempts: 2, throwOnMissing: true });
  if (!token || token.rawAmount === 0n) {
    throw new Error("no token balance");
  }

  const triggerSellPercent = Math.max(1, Math.min(100, Number.parseFloat(sellPercentOverride || effectiveTimedSellPercent(plan, planWallet, "take-profit")) || 100));
  const tokenBaseRawAmount = recoverPlanWalletTokenOutAmount(planWallet, token);
  const amount = sellAmountForPercent(token.rawAmount, triggerSellPercent, tokenBaseRawAmount);
  if (amount === 0n) {
    throw new Error("sell amount rounded to zero");
  }

  const basisLamports = planWalletBasisLamports(plan, planWallet);
  const basis = (basisLamports * BigInt(Math.round(triggerSellPercent))) / 100n;
  if (basis <= 0n) {
    throw new Error("missing plan basis");
  }

  const monitorSlippageBps = Math.max(
    Number.parseInt(plan.slippageBps || CONFIG.defaultSlippageBps, 10) || CONFIG.defaultSlippageBps,
    CONFIG.stopLossMonitorSlippageBps
  );

  let order;
  try {
    order = await createJupiterOrder({
      taker: keypair.publicKey,
      inputMint: plan.tokenMint,
      outputMint: SOL_MINT,
      amount: amount.toString(),
      slippageBps: monitorSlippageBps
    });
  } catch (quoteError) {
    try {
      return await estimatePlanWalletMoveFromPumpFun(plan, token, amount, basis, quoteError, monitorSlippageBps);
    } catch {
      return estimatePlanWalletMoveFromDexPair(plan, token, amount, basis, quoteError, monitorSlippageBps);
    }
  }

  const estimatedOut = BigInt(order.outAmount || order.outputAmount || 0);
  const estimatedFee = BigInt(calculateFeeLamports(estimatedOut));
  const estimatedNetOut = estimatedOut > estimatedFee ? estimatedOut - estimatedFee : 0n;
  const movePct = (Number(estimatedNetOut - basis) / Number(basis)) * 100;
  return { estimatedOut, estimatedNetOut, basis, movePct, source: "jupiter", monitorSlippageBps };
}

async function estimatePlanWalletMoveFromPumpFun(plan, token, amount, basis, quoteError, monitorSlippageBps = null) {
  const metadata = await getPumpFunTokenMetadata(plan.tokenMint, { timeoutMs: 1_800 });
  const decimals = Number(token?.decimals);
  const priceSol = pumpFunPriceSol(metadata, decimals);

  if (!Number.isFinite(priceSol) || priceSol <= 0 || !Number.isInteger(decimals)) {
    throw quoteError;
  }

  const tokenUnits = Number(amount) / (10 ** decimals);
  const estimatedOutNumber = tokenUnits * priceSol * LAMPORTS_PER_SOL;
  if (!Number.isFinite(estimatedOutNumber) || estimatedOutNumber <= 0) {
    throw quoteError;
  }

  const estimatedOut = BigInt(Math.max(0, Math.floor(estimatedOutNumber)));
  const estimatedFee = BigInt(calculateFeeLamports(estimatedOut));
  const estimatedNetOut = estimatedOut > estimatedFee ? estimatedOut - estimatedFee : 0n;
  const movePct = (Number(estimatedNetOut - basis) / Number(basis)) * 100;

  return {
    estimatedOut,
    estimatedNetOut,
    basis,
    movePct,
    source: "pumpfun",
    monitorSlippageBps,
    quoteError: friendlyError(quoteError)
  };
}

function pumpFunPriceSol(metadata = {}, tokenDecimals = 6) {
  const direct = firstMeaningfulNumber(
    metadata.priceSol,
    metadata.priceNative,
    metadata.priceInSol,
    metadata.price_sol,
    metadata.price_native
  );
  if (Number.isFinite(direct) && direct > 0) return direct;

  const virtualSolReserves = firstMeaningfulNumber(metadata.virtualSolReserves, metadata.virtual_sol_reserves);
  const virtualTokenReserves = firstMeaningfulNumber(metadata.virtualTokenReserves, metadata.virtual_token_reserves);
  const decimals = Number.isInteger(Number(tokenDecimals)) ? Number(tokenDecimals) : 6;
  if (!Number.isFinite(virtualSolReserves) || virtualSolReserves <= 0 || !Number.isFinite(virtualTokenReserves) || virtualTokenReserves <= 0) {
    return null;
  }

  const solUnits = virtualSolReserves > 10_000 ? virtualSolReserves / LAMPORTS_PER_SOL : virtualSolReserves;
  const tokenUnits = virtualTokenReserves / (10 ** decimals);
  if (!Number.isFinite(solUnits) || !Number.isFinite(tokenUnits) || tokenUnits <= 0) {
    return null;
  }

  return solUnits / tokenUnits;
}

function tokenAddressEquals(left, right) {
  return String(left || "").trim() === String(right || "").trim();
}

function dexTokenIsSol(token = {}) {
  return tokenAddressEquals(token.address, SOL_MINT)
    || /^w?sol$/i.test(String(token.symbol || ""))
    || /^solana$/i.test(String(token.name || ""));
}

function dexPairTokenPriceSol(pair, tokenMint) {
  const base = pair?.baseToken || {};
  const quote = pair?.quoteToken || {};
  const priceNative = Number(pair?.priceNative);
  if (!Number.isFinite(priceNative) || priceNative <= 0) return null;

  const baseIsTarget = tokenAddressEquals(base.address, tokenMint);
  const quoteIsTarget = tokenAddressEquals(quote.address, tokenMint);
  const baseIsSol = dexTokenIsSol(base);
  const quoteIsSol = dexTokenIsSol(quote);

  if (baseIsTarget && quoteIsSol) return priceNative;
  if (quoteIsTarget && baseIsSol) return 1 / priceNative;
  return null;
}

function bestDexPairWithSolPrice(tokenMint, pairs) {
  return (pairs || [])
    .filter((pair) => pairMatchesToken(pair, tokenMint))
    .map((pair) => ({ pair, priceSol: dexPairTokenPriceSol(pair, tokenMint) }))
    .filter((item) => Number.isFinite(item.priceSol) && item.priceSol > 0)
    .sort((a, b) => compareDexPairsForSniper(a.pair, b.pair))[0] || null;
}

async function estimatePlanWalletMoveFromDexPair(plan, token, amount, basis, quoteError, monitorSlippageBps = null) {
  const pairs = await fetchDexScreenerTokenPairsBatch([plan.tokenMint], { timeoutMs: 1_800 }).catch(() => []);
  const pricedPair = bestDexPairWithSolPrice(plan.tokenMint, pairs);
  const priceSol = pricedPair?.priceSol;
  const decimals = Number(token?.decimals);

  if (!Number.isFinite(priceSol) || priceSol <= 0 || !Number.isInteger(decimals)) {
    throw quoteError;
  }

  const tokenUnits = Number(amount) / (10 ** decimals);
  const estimatedOutNumber = tokenUnits * priceSol * LAMPORTS_PER_SOL;
  if (!Number.isFinite(estimatedOutNumber) || estimatedOutNumber <= 0) {
    throw quoteError;
  }

  const estimatedOut = BigInt(Math.max(0, Math.floor(estimatedOutNumber)));
  const estimatedFee = BigInt(calculateFeeLamports(estimatedOut));
  const estimatedNetOut = estimatedOut > estimatedFee ? estimatedOut - estimatedFee : 0n;
  const movePct = (Number(estimatedNetOut - basis) / Number(basis)) * 100;

  return {
    estimatedOut,
    estimatedNetOut,
    basis,
    movePct,
    source: "dexscreener",
    monitorSlippageBps,
    pairAddress: firstString(pricedPair?.pair?.pairAddress, pricedPair?.pair?.address),
    quoteError: friendlyError(quoteError)
  };
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

async function collectSolFee(signer, feeLamports, options = {}) {
  if (!feeLamports) return null;
  const feeAmount = BigInt(feeLamports);
  if (feeAmount <= 0n) return null;
  const targets = await referralFeeTargets(options.userId, feeAmount);
  const ownerLamports = Number(targets.ownerLamports);
  const referralLamports = Number(targets.referralLamports);

  const tx = new Transaction();
  if (ownerLamports > 0) {
    tx.add(SystemProgram.transfer({
      fromPubkey: signer.publicKey,
      toPubkey: new PublicKey(CONFIG.feeWallet),
      lamports: ownerLamports
    }));
  }
  if (targets.referralWallet && referralLamports > 0) {
    tx.add(SystemProgram.transfer({
      fromPubkey: signer.publicKey,
      toPubkey: new PublicKey(targets.referralWallet),
      lamports: referralLamports
    }));
  }
  if (!tx.instructions.length) return null;

  const signature = await sendLegacyTransaction(tx, [signer]);
  if (targets.referrerUserId && targets.referralWallet && referralLamports > 0) {
    await recordReferralFeePayout({
      userId: options.userId,
      referrerUserId: targets.referrerUserId,
      referralWallet: targets.referralWallet,
      lamports: referralLamports,
      signature
    }).catch((error) => audit("referral_fee_record_failed", {
      userId: options.userId,
      referrerUserId: targets.referrerUserId,
      error: friendlyError(error)
    }));
  }
  return signature;
}

async function referralFeeTargets(userId, feeLamports) {
  const total = BigInt(feeLamports);
  const fallback = { ownerLamports: total, referralLamports: 0n, referralWallet: "", referrerUserId: "" };
  if (!userId || CONFIG.bundleFeeBps <= 0 || CONFIG.referralFeeBps <= 0) return fallback;

  try {
    const store = await readWebAuthStore();
    const profile = store.profiles[String(userId)] || {};
    const referrer = profile.referredByUserId ? store.profiles[String(profile.referredByUserId)] : null;
    const referralWallet = referrer?.referralPayoutWallet || "";
    if (!referralWallet || referralWallet === CONFIG.feeWallet) return fallback;
    new PublicKey(referralWallet);
    const referralLamports = (total * BigInt(CONFIG.referralFeeBps)) / BigInt(CONFIG.bundleFeeBps);
    if (referralLamports <= 0n || referralLamports >= total) return fallback;
    return {
      ownerLamports: total - referralLamports,
      referralLamports,
      referralWallet,
      referrerUserId: String(profile.referredByUserId || "")
    };
  } catch {
    return fallback;
  }
}

function referralSolString(lamports) {
  const value = Number(lamports || "0") / LAMPORTS_PER_SOL;
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

function normalizeReferralStats(stats = {}) {
  const totalLamports = String(stats.totalLamports || "0");
  const referralsObj = stats.referrals && typeof stats.referrals === "object" ? stats.referrals : {};
  const referrals = Object.entries(referralsObj).map(([id, row]) => {
    const lamports = String(row?.lamports || "0");
    return {
      userId: id,
      lamports,
      sol: referralSolString(lamports),
      payoutCount: Number(row?.payoutCount || 0),
      lastSignature: row?.lastSignature || "",
      lastPaidAt: row?.lastPaidAt || ""
    };
  }).sort((a, b) => Number(b.lamports) - Number(a.lamports));

  return {
    totalLamports,
    totalSol: referralSolString(totalLamports),
    payoutCount: Number(stats.payoutCount || 0),
    referralWallet: stats.referralWallet || "",
    lastSignature: stats.lastSignature || "",
    lastPaidAt: stats.lastPaidAt || "",
    referrals
  };
}

async function recordReferralFeePayout({ userId, referrerUserId, referralWallet, lamports, signature }) {
  if (!referrerUserId || !lamports) return;
  const payoutLamports = BigInt(lamports);
  if (payoutLamports <= 0n) return;

  const store = await readWebAuthStore();
  const key = String(referrerUserId);
  const profile = store.profiles[key] || {};
  const currentStats = profile.referralStats && typeof profile.referralStats === "object" ? profile.referralStats : {};
  const currentTotal = BigInt(currentStats.totalLamports || "0");
  const referrals = currentStats.referrals && typeof currentStats.referrals === "object" ? { ...currentStats.referrals } : {};
  const childKey = String(userId || "unknown");
  const child = referrals[childKey] || {};
  referrals[childKey] = {
    lamports: String(BigInt(child.lamports || "0") + payoutLamports),
    payoutCount: Number(child.payoutCount || 0) + 1,
    lastSignature: signature || "",
    lastPaidAt: new Date().toISOString()
  };

  profile.referralStats = {
    totalLamports: String(currentTotal + payoutLamports),
    payoutCount: Number(currentStats.payoutCount || 0) + 1,
    referralWallet,
    lastSignature: signature || "",
    lastPaidAt: new Date().toISOString(),
    referrals
  };
  profile.updatedAt = new Date().toISOString();
  store.profiles[key] = profile;
  await writeWebAuthStore(store);
  await audit("referral_fee_recorded", {
    userId,
    referrerUserId,
    referralWallet,
    lamports: String(payoutLamports),
    signature
  });
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
    const token = await getReliableTokenBalanceForMint(owner, mint, { throwOnError: false });
    return BigInt(token?.rawAmount || 0);
  } catch {
    return 0n;
  }
}

async function readTokenDeltaAfterBuy(owner, mint, beforeRaw) {
  const before = BigInt(beforeRaw || 0);
  const ownerText = owner instanceof PublicKey ? owner.toBase58() : String(owner || "");
  for (let attempt = 0; attempt < 9; attempt += 1) {
    if (attempt > 0) {
      if (ownerText) invalidateWalletReadCache(ownerText);
      await sleep(Math.min(1800, 350 + attempt * 275));
    }
    const after = await safeTokenRawBalance(owner, mint);
    if (after > before) {
      return (after - before).toString();
    }
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
      [{ text: "Copy Trade / KOL Tracker", callback_data: "kol_tracker_menu" }],
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
      [{ text: "Manual Launch Snipe", callback_data: "sniper_manual_launch" }],
      [{ text: "Active Launch Watches", callback_data: "manual_launch_watches" }],
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
    "Safe Picks: stronger liquidity, cleaner trend, lower risk flags.",
    "Smart Accumulation: buyer pressure and steady volume without obvious sell pressure.",
    "Fast Movers: volume picking up with cleaner short-term momentum.",
    "Low MC Picks: targets $4K-$40K market caps, with a fallback up to $60K when the clean low-cap pool is thin.",
    "Narratives: metadata/keyword narrative matches plus volume and trend checks.",
    "Long Term: steadier accumulation signals for longer holds.",
    `AutoSnipe: fresh-scans, auto-picks one high-conviction scalp setup, then uses +${AUTOSNIPE_TAKE_PROFIT_PCT}% TP / -${AUTOSNIPE_STOP_LOSS_PCT}% SL / ${AUTOSNIPE_SLIPPAGE_BPS} bps slippage.`,
    `PumpSnipe: focuses on very early pump-style launches, then uses +${PUMPSNIPE_TAKE_PROFIT_PCT}% TP / -${PUMPSNIPE_STOP_LOSS_PCT}% SL / ${PUMPSNIPE_SLIPPAGE_BPS} bps slippage by default.`
  ].join("\n")), {
    inline_keyboard: [
      [{ text: "Auto", callback_data: "sniper_auto_menu" }],
      [{ text: "Safe Picks", callback_data: "sniper_mode_safe" }, { text: "Smart Accumulation", callback_data: "sniper_mode_smart" }],
      [{ text: "Fast Movers", callback_data: "sniper_mode_fast" }, { text: "PumpSnipe", callback_data: "sniper_mode_pumpsnipe" }],
      [{ text: "Low MC Picks", callback_data: "sniper_mode_moonshot" }, { text: "Narratives", callback_data: "sniper_mode_meme" }],
      [{ text: "Long Term", callback_data: "sniper_mode_long" }],
      [{ text: "Back", callback_data: "sniper_menu" }]
    ]
  });
}

async function showKolTrackerMenu(chatId, messageId = null) {
  await sendOrEditMessage(chatId, messageId, withBrandFooter([
    "KOL Tracker",
    "",
    "Track Solana KOL wallets, see what they are holding or recently buying, open charts, then choose Trade, Bundle, or Copy Plan from a signal."
  ].join("\n")), {
    inline_keyboard: [
      [{ text: "Hot KOL Buys", callback_data: "kol_scan_hot" }],
      [{ text: "Top KOLs", callback_data: "kol_scan_top" }, { text: "Consistent KOLs", callback_data: "kol_scan_consistent" }],
      [{ text: "Fresh Activity", callback_data: "kol_scan_fresh" }],
      [{ text: "Scan Wallet", callback_data: "kol_scan_wallet" }],
      [{ text: "Trade", callback_data: "trade_menu" }, { text: "Bundle", callback_data: "bundle_menu" }],
      [{ text: "Main Menu", callback_data: "main_menu" }]
    ]
  });
}

async function showKolScan(chatId, userId, mode = "hot", messageId = null, wallet = "") {
  const scan = await buildKolScan(userId, mode, wallet);
  if (!scan.configured) {
    await sendOrEditMessage(chatId, messageId, withBrandFooter([
      "KOL Tracker setup needed.",
      "",
      "Live KOL lists are not connected yet.",
      "You can still tap Scan Wallet and paste a public wallet to inspect current holdings."
    ].join("\n")), {
      inline_keyboard: [
        [{ text: "Back", callback_data: "kol_tracker_menu" }],
        [{ text: "Main Menu", callback_data: "main_menu" }]
      ]
    });
    return;
  }

  const lines = [
    `KOL Tracker: ${scan.label}`,
    "",
    scan.description,
    "",
    `KOLs checked: ${scan.kolCount}`,
    `Signals found: ${scan.rows.length}`,
    ""
  ];

  if (scan.kols?.length) {
    lines.push("Top KOL wallets:", "");
    scan.kols.slice(0, 5).forEach((kol, index) => {
      lines.push(
        `${index + 1}. ${kol.name}${kol.twitter ? ` (@${kol.twitter})` : ""}`,
        `Wallet: ${kol.shortWallet || shortMint(kol.wallet)}`,
        `Win: ${kol.winRateLabel || "n/a"} | ROI: ${kol.roiLabel || "n/a"} | PnL: ${kol.realizedLabel || "$0"}${kol.volumeLabel ? ` | ${kol.volumeLabel}` : ""}`,
        ""
      );
    });
  }

  if (scan.rows.length === 0) {
    lines.push(scan.kols?.length
      ? "KOL leaderboard loaded, but no current token signals came back on this refresh. Try another mode or refresh in a minute."
      : "No strong KOL signals found on this refresh. Try another mode or refresh in a minute.");
  } else {
    scan.rows.slice(0, 6).forEach((row, index) => {
      lines.push(
        `${index + 1}. ${row.symbol} | ${row.signalType} | Score ${row.score}/100`,
        `${row.name}`,
        `CA: ${row.tokenMint}`,
        `KOL: ${row.kolName}${row.twitter ? ` (@${row.twitter})` : ""}`,
        `Value: ${row.valueLabel} | KOL win: ${row.winRateLabel} | ROI: ${row.roiLabel}`,
        row.kolscanUrl ? `KOLscan: ${row.kolscanUrl}` : "",
        `Chart: ${row.dexUrl}`,
        ""
      );
    });
  }

  await sendLongMenuText(chatId, messageId, withBrandFooter(lines.join("\n")), {
    inline_keyboard: kolScanKeyboard(scan.rows, mode)
  });
}

function kolScanKeyboard(rows, mode) {
  const keyboard = [];
  for (const [index, row] of rows.slice(0, 6).entries()) {
    keyboard.push([
      { text: `Trade ${index + 1}`, callback_data: `kol_trade:${row.tokenMint}` },
      { text: `Bundle ${index + 1}`, callback_data: `kol_bundle:${row.tokenMint}` },
      { text: `Copy Plan ${index + 1}`, callback_data: `kol_copy:${row.tokenMint}` }
    ]);
  }
  keyboard.push([{ text: "Refresh", callback_data: `kol_scan_${normalizeKolMode(mode)}` }]);
  keyboard.push([{ text: "Back", callback_data: "kol_tracker_menu" }, { text: "Main Menu", callback_data: "main_menu" }]);
  return keyboard;
}

async function startKolSignalAction(chatId, userId, action, rawTokenMint) {
  if (await isPausedActionBlocked(action)) {
    await say(chatId, "Emergency stop is active. Use Unlock Bot to re-enable transaction flows.");
    return;
  }
  const tokenMint = parsePublicKey(String(rawTokenMint || "")).toBase58();
  const signalLabel = shortMint(tokenMint);

  if (action === "kol_trade") {
    sessions.set(chatId, {
      step: "kol_trade_wallet",
      userId,
      data: {
        tradeMode: "single",
        tokenMint,
        signalLabel,
        source: "kol_tracker"
      }
    });
    await say(chatId, await walletPrompt(userId, [
      `KOL signal: ${signalLabel}`,
      `Dexscreener: ${dexScreenerUrl(tokenMint)}`,
      "",
      "Choose one wallet to buy from. Send the wallet number."
    ].join("\n")));
    return;
  }

  if (action === "kol_bundle") {
    sessions.set(chatId, {
      step: "buy_wallets",
      userId,
      data: {
        tradeMode: "bundle",
        tokenMint,
        source: "kol_tracker"
      }
    });
    await say(chatId, await walletPrompt(userId, [
      `KOL signal: ${signalLabel}`,
      `Dexscreener: ${dexScreenerUrl(tokenMint)}`,
      "",
      "Send buyer wallet numbers separated by commas, or `all`."
    ].join("\n")));
    return;
  }

  sessions.set(chatId, {
    step: "plan_wallets",
    userId,
    data: {
      tradeMode: "bundle",
      tokenMint,
      planSource: "kol_tracker",
      allowRepeat: false
    }
  });
  await say(chatId, await walletPrompt(userId, [
    `KOL Copy Plan: ${signalLabel}`,
    `Dexscreener: ${dexScreenerUrl(tokenMint)}`,
    "",
    "Send wallet numbers, `all`, or `group: group name`.",
    "This creates your own timed TP/SL plan from the KOL signal."
  ].join("\n")));
}

async function showBundleMenu(chatId, messageId = null) {
  await sendOrEditMessage(chatId, messageId, withBrandFooter("Bundle tools:\n\nAuto Bundle buys selected wallets, then watches stop-loss / take-profit exits."), {
    inline_keyboard: [
      [{ text: "Auto Bundle", callback_data: "auto_bundle" }],
      [{ text: "🧲 Bundle Buy", callback_data: "batch_buy" }],
      [{ text: "🧲 Bundle Sell", callback_data: "batch_sell" }],
      [{ text: "DCA Buy", callback_data: "dca_buy" }, { text: "DCA Sell", callback_data: "dca_sell" }],
      [{ text: "Copy Trade / KOL Tracker", callback_data: "kol_tracker_menu" }],
      [{ text: "Copy Trade Info", callback_data: "copy_trade_info" }],
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

async function buildPositionsOverview(userId, options = {}) {
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
      const { accounts } = await getOwnedTokenAccountsWithWarningsCached(keypair.publicKey, { force: Boolean(options.force) });
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

  const usesEarlyPool = ["pumpsnipe", "moonshot"].includes(settings.mode);
  const candidates = await fetchSniperCandidatesForMode(settings.mode, { ttlMs: 750, scanState });
  const scored = [];
  const rotatedCandidates = usesEarlyPool
    ? rotatePumpSnipeCandidatePool(candidates, scanState)
    : rotateSniperCandidatePool(candidates, scanState);
  const scanPool = await hydrateSniperCandidates(rotatedCandidates);
  await runWithConcurrency(scanPool, Math.min(6, Math.max(3, CONFIG.balanceConcurrency)), async (candidate) => {
    try {
      scored.push(await scoreSniperCandidate(candidate, settings));
    } catch {
      // Ignore broken profile rows.
    }
  });

  const { qualifiedRows } = buildQualifiedSniperRows(scored, settings);
  const display = buildSniperModeDisplay(qualifiedRows, settings.mode, scanState);
  const modeRows = display.modeRows;
  const rows = display.rows;
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
    [{ text: `Refresh ${modeLabel}`, callback_data: "sniper_scan" }, { text: "Modes", callback_data: "sniper_modes" }],
    [{ text: "Back", callback_data: "sniper_menu" }]
  ];

  await sendOrEditHtmlMessage(chatId, messageId, withBrandFooter([
      `<b>${escapeHtml(modeLabel)} Picks</b>`,
      `Mode: <b>${escapeHtml(modeLabel)}</b>`,
      `Refresh: <b>${scanState.refreshCount}</b> | Scored: <b>${scored.length}</b> | Qualified: <b>${qualifiedRows.length}</b> | Mode-fit: <b>${modeRows.length}</b> | Display pool: <b>${display.displayRows.length}</b>`,
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
      firstBuyAt: null,
      lastSellAt: null,
      lastTradeAt: null
    };

    if (trade.type === "buy") {
      entry.buys += 1;
      entry.spent += BigInt(trade.solLamportsSpent || 0);
      if (!entry.firstBuyAt || tradeTimestampMs(trade.timestamp) < tradeTimestampMs(entry.firstBuyAt)) {
        entry.firstBuyAt = trade.timestamp || entry.firstBuyAt;
      }
    } else if (trade.type === "sell") {
      entry.sells += 1;
      entry.received += BigInt(trade.solLamportsReceived || 0);
      if (!entry.lastSellAt || tradeTimestampMs(trade.timestamp) >= tradeTimestampMs(entry.lastSellAt)) {
        entry.lastSellAt = trade.timestamp || entry.lastSellAt;
      }
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

function formatPnlHoldDuration(row = {}) {
  const start = tradeTimestampMs(row.firstBuyAt);
  const end = tradeTimestampMs(row.lastSellAt || row.lastTradeAt);
  if (!start || !end || end < start) return "n/a";
  return formatCompactDurationMs(end - start);
}

function formatCompactDurationMs(ms) {
  const seconds = Math.max(0, Math.floor(Number(ms || 0) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
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
  const name = sanitizeCardText(metadata.name || "SlimeWire", 26);
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
  const holdLabel = formatPnlHoldDuration(row);
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
  <text x="555" y="168" font-family="${PNL_CARD_STYLE.fontFamily}" font-size="62" font-weight="900" fill="${PNL_CARD_STYLE.slime}" letter-spacing="0" filter="url(#slimeGlow)">www.SlimeWire.org</text>
  <text x="555" y="222" font-family="${PNL_CARD_STYLE.fontFamily}" font-size="34" font-weight="800" fill="${PNL_CARD_STYLE.muted}">PNL CARD</text>
  <text x="555" y="392" font-family="${PNL_CARD_STYLE.fontFamily}" font-size="170" font-weight="900" fill="${accent}" letter-spacing="0">${escapeSvg(multiple)}X</text>
  <text x="555" y="450" font-family="${PNL_CARD_STYLE.fontFamily}" font-size="38" font-weight="900" fill="${PNL_CARD_STYLE.white}">${escapeSvg(symbol)} / ${escapeSvg(name)}</text>
  <text x="555" y="500" font-family="${PNL_CARD_STYLE.fontFamily}" font-size="34" font-weight="800" fill="${accent}">Profit ${escapeSvg(profitLabel)}</text>
  <text x="555" y="544" font-family="${PNL_CARD_STYLE.fontFamily}" font-size="28" font-weight="700" fill="${PNL_CARD_STYLE.muted}">Spent ${escapeSvg(lamportsBigToSol(spent))} SOL  |  Received ${escapeSvg(lamportsBigToSol(received))} SOL</text>
  <text x="555" y="584" font-family="${PNL_CARD_STYLE.fontFamily}" font-size="26" font-weight="700" fill="${PNL_CARD_STYLE.muted}">Held ${escapeSvg(holdLabel)}</text>
  <text x="555" y="620" font-family="${PNL_CARD_STYLE.fontFamily}" font-size="24" font-weight="700" fill="${PNL_CARD_STYLE.muted}">${escapeSvg(subline || shortMint(row.tokenMint))}</text>
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
    websiteUrl: dexValue.websiteUrl || "",
    twitterUrl: dexValue.twitterUrl || "",
    telegramUrl: dexValue.telegramUrl || "",
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

async function tokenMetadataMapForMints(tokenMints, options = {}) {
  const addresses = [...new Set((tokenMints || []).filter(Boolean))].slice(0, options.limit || 30);
  const metadataByMint = new Map();
  const uncached = [];

  for (const mint of addresses) {
    const cached = dexMetadataCache.get(mint);
    if (cached && Date.now() - cached.cachedAt < 5 * 60 * 1000) {
      metadataByMint.set(mint, cached.value);
    } else {
      uncached.push(mint);
    }
  }

  if (!uncached.length) return metadataByMint;

  const pairs = await fetchDexScreenerTokenPairsBatch(uncached, { timeoutMs: options.timeoutMs || 3_500 }).catch(() => []);
  await runWithConcurrency(uncached, options.concurrency || 3, async (mint) => {
    const dexValue = metadataFromDexPair(mint, bestDexPairForToken(mint, pairs));
    const needsPumpFallback = options.pumpFallback !== false && (
      !dexValue.symbol
      || !dexValue.name
      || !dexValue.imageUrl
      || !dexValue.marketCap
      || !dexValue.liquidityUsd
      || !dexValue.volume?.h1
    );
    const pumpValue = needsPumpFallback
      ? await getPumpFunTokenMetadata(mint, { timeoutMs: options.pumpTimeoutMs || 1_500 }).catch(() => ({}))
      : {};
    const value = {
      ...dexValue,
      symbol: dexValue.symbol || pumpValue.symbol || "",
      name: dexValue.name || pumpValue.name || "",
      imageUrl: dexValue.imageUrl || pumpValue.imageUrl || "",
      marketCap: dexValue.marketCap || pumpValue.marketCap || null,
      fdv: dexValue.fdv || pumpValue.fdv || null,
      liquidityUsd: dexValue.liquidityUsd || pumpValue.liquidityUsd || null,
      volume: dexValue.volume || pumpValue.volume || null,
      txns: dexValue.txns || pumpValue.txns || null,
      priceChange: dexValue.priceChange || pumpValue.priceChange || null,
      pairCreatedAt: dexValue.pairCreatedAt || pumpValue.pairCreatedAt || null,
      source: dexValue.imageUrl ? "dexscreener" : pumpValue.imageUrl ? "pumpfun" : "fallback"
    };
    dexMetadataCache.set(mint, { cachedAt: Date.now(), value });
    metadataByMint.set(mint, value);
  });

  return metadataByMint;
}

async function getDexScreenerTokenMetadata(tokenMint) {
  const pairs = await fetchDexScreenerTokenPairsBatch([tokenMint]);
  return metadataFromDexPair(tokenMint, bestDexPairForToken(tokenMint, pairs));
}

async function fetchDexScreenerTokenPairsBatch(tokenMints, options = {}) {
  const addresses = [...new Set((tokenMints || []).filter(Boolean))].slice(0, 30);
  if (addresses.length === 0) return [];

  const tokenPath = addresses.map((address) => encodeURIComponent(address)).join(",");
  const data = await fetchJson(`https://api.dexscreener.com/tokens/v1/solana/${tokenPath}`, {
    headers: { "Accept": "application/json", "User-Agent": "solana-telegram-wallet-ops-bot" },
    timeoutMs: options.timeoutMs || 4_500
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
  const links = dexPairLinks(best);
  const dexId = firstString(best?.dexId, best?.dexName);
  const pairAddress = firstString(best?.pairAddress, best?.address);
  const raydiumPool = /raydium|meteora|orca/i.test(dexId) ? pairAddress : "";
  const graduated = Boolean(
    raydiumPool
    && isPumpStyleToken({ tokenMint, symbol: token.symbol, name: token.name })
  );

  return {
    symbol: token.symbol || "",
    name: token.name || "",
    imageUrl: best?.info?.imageUrl || "",
    websiteUrl: links.websiteUrl,
    twitterUrl: links.twitterUrl,
    telegramUrl: links.telegramUrl,
    marketCap: firstNumber(best?.marketCap, best?.fdv),
    fdv: firstNumber(best?.fdv),
    priceChange: best?.priceChange || null,
    liquidityUsd: firstNumber(best?.liquidity?.usd),
    volume: best?.volume || null,
    txns: best?.txns || null,
    pairCreatedAt: best?.pairCreatedAt || null,
    dexId,
    dexName: dexId,
    pairAddress,
    pairUrl: firstString(best?.url),
    raydiumPool,
    graduated,
    isGraduated: graduated
  };
}

function dexPairLinks(pair = null) {
  const websites = Array.isArray(pair?.info?.websites) ? pair.info.websites : [];
  const socials = Array.isArray(pair?.info?.socials) ? pair.info.socials : [];
  const websiteUrl = firstString(
    websites.find((item) => /website|site|web/i.test(item?.label || ""))?.url,
    websites[0]?.url
  );
  const twitterUrl = firstString(
    socials.find((item) => /twitter|x/i.test(item?.type || item?.label || ""))?.url,
    socials.find((item) => /twitter\.com|x\.com/i.test(item?.url || ""))?.url
  );
  const telegramUrl = firstString(
    socials.find((item) => /telegram|tg/i.test(item?.type || item?.label || ""))?.url,
    socials.find((item) => /t\.me|telegram/i.test(item?.url || ""))?.url
  );
  return { websiteUrl, twitterUrl, telegramUrl };
}

async function getPumpFunTokenMetadata(tokenMint, options = {}) {
  const headers = { "Accept": "application/json", "User-Agent": "solana-telegram-wallet-ops-bot" };
  if (CONFIG.pumpFunApiToken) {
    headers.Authorization = `Bearer ${CONFIG.pumpFunApiToken}`;
  }

  const url = `${CONFIG.pumpFunApiBase}/coins/${encodeURIComponent(tokenMint)}?sync=false`;
  const response = await fetchJson(url, { headers, timeoutMs: options.timeoutMs || 3_500 });
  const coin = response?.data || response;
  const volume = typeof coin?.volume === "object" && coin.volume !== null ? coin.volume : {};
  const txns = typeof coin?.txns === "object" && coin.txns !== null ? coin.txns : {};
  const transactions = typeof coin?.transactions === "object" && coin.transactions !== null ? coin.transactions : {};
  const raydiumPool = firstString(coin?.raydium_pool, coin?.raydiumPool, coin?.poolAddress, coin?.pool, coin?.amm_pool);
  const bondingProgressPct = firstMeaningfulNumber(
    coin?.bondingProgressPct,
    coin?.bondingProgress,
    coin?.bonding_curve_progress,
    coin?.bondingCurveProgress,
    coin?.progress,
    coin?.pumpProgress,
    coin?.graduationProgress,
    coin?.completion,
    coin?.completePct
  ) || 0;
  const graduated = Boolean(
    coin?.complete
    || coin?.completed
    || coin?.bonded
    || coin?.isBonded
    || coin?.graduated
    || coin?.isGraduated
    || raydiumPool
  );

  return {
    symbol: coin?.symbol || "",
    name: coin?.name || "",
    imageUrl: coin?.image_uri || coin?.image || coin?.metadata?.image || "",
    priceSol: firstMeaningfulNumber(coin?.priceSol, coin?.price_sol, coin?.priceNative, coin?.price_native, coin?.priceInSol) || null,
    virtualSolReserves: firstMeaningfulNumber(coin?.virtual_sol_reserves, coin?.virtualSolReserves) || null,
    virtualTokenReserves: firstMeaningfulNumber(coin?.virtual_token_reserves, coin?.virtualTokenReserves) || null,
    marketCap: firstMeaningfulNumber(coin?.usd_market_cap, coin?.market_cap, coin?.marketCap, coin?.fdv, coin?.mcap, coin?.mc) || null,
    fdv: firstMeaningfulNumber(coin?.fdv, coin?.marketCap, coin?.usd_market_cap, coin?.market_cap, coin?.mcap, coin?.mc) || null,
    liquidityUsd: firstMeaningfulNumber(coin?.liquidity_usd, coin?.liquidityUsd, coin?.liquidity?.usd, coin?.liquidity, coin?.currentLiquidityUsd) || null,
    volume: {
      m5: firstMeaningfulNumber(volume.m5, volume["5m"], coin?.volume5m, coin?.volume_5m) || 0,
      m15: firstMeaningfulNumber(volume.m15, volume.m15m, volume["15m"], coin?.volume15m, coin?.volume_15m, coin?.volumeM15) || 0,
      m30: firstMeaningfulNumber(volume.m30, volume.m30m, volume["30m"], coin?.volume30m, coin?.volume_30m, coin?.volumeM30) || 0,
      h1: firstMeaningfulNumber(volume.h1, volume["1h"], coin?.volumeH1, coin?.volume_h1, coin?.volume_1h, coin?.volume) || 0,
      h24: firstMeaningfulNumber(volume.h24, volume.d1, volume["24h"], coin?.volume24h, coin?.volume_h24, coin?.volume_24h) || 0
    },
    txns: {
      m5: {
        buys: firstNumber(txns.m5?.buys, transactions.m5?.buys, coin?.buys5m, coin?.buys_5m) || 0,
        sells: firstNumber(txns.m5?.sells, transactions.m5?.sells, coin?.sells5m, coin?.sells_5m) || 0
      },
      h1: {
        buys: firstNumber(txns.h1?.buys, transactions.h1?.buys, coin?.buysH1, coin?.buys_h1, coin?.buys) || 0,
        sells: firstNumber(txns.h1?.sells, transactions.h1?.sells, coin?.sellsH1, coin?.sells_h1, coin?.sells) || 0
      }
    },
    priceChange: {
      m5: normalizePercentLike(coin?.priceChange?.m5 ?? coin?.price_change_m5 ?? coin?.m5) || 0,
      h1: normalizePercentLike(coin?.priceChange?.h1 ?? coin?.price_change_h1 ?? coin?.h1) || 0,
      h6: normalizePercentLike(coin?.priceChange?.h6 ?? coin?.price_change_h6 ?? coin?.h6) || 0,
      h24: normalizePercentLike(coin?.priceChange?.h24 ?? coin?.price_change_h24 ?? coin?.h24) || 0
    },
    pairCreatedAt: normalizePairCreatedAt(firstString(coin?.created_timestamp, coin?.createdAt, coin?.created_at, coin?.timestamp)),
    bondingProgressPct,
    graduated,
    isGraduated: graduated,
    raydiumPool
  };
}

async function fetchSniperCandidates(options = {}) {
  const ttlMs = Number.isFinite(Number(options.ttlMs)) ? Number(options.ttlMs) : 2_500;
  if (!options.force && ttlMs > 0 && Date.now() - sniperCandidatesCache.cachedAt < ttlMs) {
    return sniperCandidatesCache.value;
  }

  const headers = { "Accept": "application/json", "User-Agent": "solana-telegram-wallet-ops-bot" };
  const requestOptions = { headers, timeoutMs: options.timeoutMs || 3_500 };
  const [profiles, latestBoosts, topBoosts] = await Promise.all([
    fetchJson("https://api.dexscreener.com/token-profiles/latest/v1", requestOptions).catch(() => []),
    fetchJson("https://api.dexscreener.com/token-boosts/latest/v1", requestOptions).catch(() => []),
    fetchJson("https://api.dexscreener.com/token-boosts/top/v1", requestOptions).catch(() => [])
  ]);

  const value = uniqueSniperCandidates([
    ...sniperCandidatesFromDexList(profiles, "profile"),
    ...sniperCandidatesFromDexList(latestBoosts, "latest-boost"),
    ...sniperCandidatesFromDexList(topBoosts, "top-boost")
  ]);
  sniperCandidatesCache = { cachedAt: Date.now(), value };
  return value;
}

async function fetchSniperCandidatesForMode(mode, options = {}) {
  const safeMode = normalizeSniperMode(mode);
  const [base, search, pumpLatest] = await Promise.all([
    fetchSniperCandidates(options).catch(() => []),
    fetchDexSearchCandidatesForMode(safeMode, options).catch(() => []),
    ["pumpsnipe", "moonshot"].includes(safeMode)
      ? fetchPumpFunLatestCandidates(options).catch(() => [])
      : Promise.resolve([])
  ]);
  const latestFirst = base.filter((candidate) => candidate.source !== "top-boost");
  const topBoostBackup = base.filter((candidate) => candidate.source === "top-boost");
  return uniqueSniperCandidates([...pumpLatest, ...search, ...latestFirst, ...topBoostBackup]);
}

async function fetchDexSearchCandidatesForMode(mode, options = {}) {
  const queries = sniperModeSearchQueries(mode, options.scanState);
  if (queries.length === 0) return [];

  const ttlMs = Number.isFinite(Number(options.searchTtlMs))
    ? Number(options.searchTtlMs)
    : Math.max(1_500, Number(options.ttlMs || 0), 5_000);
  const headers = { "Accept": "application/json", "User-Agent": "solana-telegram-wallet-ops-bot" };
  const rows = [];

  await runWithConcurrency(queries, 3, async (query) => {
    const cacheKey = `${mode}:${query}`;
    const cached = dexSearchCandidatesCache.get(cacheKey);
    if (!options.force && cached && Date.now() - cached.cachedAt < ttlMs) {
      rows.push(...cached.value);
      return;
    }

    const data = await fetchJson(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`, {
      headers,
      timeoutMs: options.timeoutMs || 3_500
    }).catch(() => null);
    const value = sniperCandidatesFromDexPairs(arrayFromApiData(data, ["pairs"]), `search:${mode}:${query}`);
    dexSearchCandidatesCache.set(cacheKey, { cachedAt: Date.now(), value });
    rows.push(...value);
  });

  return uniqueSniperCandidates(rows);
}

function sniperModeSearchQueries(mode, scanState = {}) {
  const querySets = {
    safe: ["solana trending", "solana volume", "raydium solana", "jupiter solana", "bonk solana", "solana community", "solana breakout", "solana movers"],
    smart: ["solana accumulation", "cto solana", "community solana", "smart money solana", "holder solana", "solana steady", "solana reversal", "solana base"],
    fast: ["solana pump", "solana breakout", "solana moon", "solana volume", "send solana", "ape solana", "fast solana", "raydium pump"],
    moonshot: ["pump low cap", "solana low cap", "moon pump", "solana gem", "new pump", "micro cap solana", "low mcap solana", "pumpfun solana"],
    pumpsnipe: ["pump", "pumpfun", "new pump", "fresh pump", "moon pump", "solana pump", "cto pump", "ape pump"],
    meme: ["solana meme", "pepe solana", "cat solana", "dog solana", "frog solana", "bonk meme", "wif solana", "cto meme"],
    ai: ["ai solana", "agent solana", "gpt solana", "robot solana", "compute solana", "neural solana", "ai meme solana", "agent pump"],
    long: ["solana utility", "solana ai", "solana gaming", "solana defi", "solana protocol", "solana community", "solana infra", "solana agent"],
    autosnipe: ["solana breakout", "solana volume", "solana pump", "raydium solana", "pump trending", "solana movers"]
  };
  const list = querySets[mode] || querySets.safe;
  const refreshCount = Number(scanState?.refreshCount || 0);
  const modeSeed = stringModulo(mode, list.length || 1);
  const offset = refreshCount * 2 + modeSeed + Math.floor(Date.now() / 45_000);
  return rotateItems(list, offset).slice(0, mode === "pumpsnipe" || mode === "moonshot" ? 5 : 4);
}

async function fetchPumpSnipeCandidates(options = {}) {
  const [pumpLatest, candidates, search] = await Promise.all([
    fetchPumpFunLatestCandidates(options).catch(() => []),
    fetchSniperCandidates(options),
    fetchDexSearchCandidatesForMode("pumpsnipe", options).catch(() => [])
  ]);
  const latestFirst = candidates.filter((candidate) => candidate.source !== "top-boost");
  const topBoostBackup = candidates.filter((candidate) => candidate.source === "top-boost");
  return uniqueSniperCandidates([...pumpLatest, ...search, ...latestFirst, ...topBoostBackup]);
}

async function fetchLivePairCandidates(options = {}) {
  const ttlMs = Number.isFinite(Number(options.ttlMs)) ? Number(options.ttlMs) : 500;
  const safeBucket = normalizeLivePairBucket(options.bucket);
  const [photon, pumpLatest, dexLatest, dexBucketSearch] = await Promise.all([
    fetchPhotonNewPairCandidates({ ...options, ttlMs }).catch(() => []),
    fetchPumpFunLatestCandidates({ ...options, timeoutMs: options.timeoutMs || 1_800 }).catch(() => []),
    fetchSniperCandidates({ ...options, ttlMs, timeoutMs: options.timeoutMs || 1_800 }).catch(() => []),
    safeBucket === "live"
      ? Promise.resolve([])
      : fetchDexSearchCandidatesForLiveBucket(safeBucket, options).catch(() => [])
  ]);
  const freshDexRows = dexLatest.filter((candidate) => candidate.source !== "top-boost" || safeBucket !== "live");
  return uniqueSniperCandidates([...photon, ...pumpLatest, ...dexBucketSearch, ...freshDexRows])
    .sort(compareLivePairCandidates);
}

async function fetchDexSearchCandidatesForLiveBucket(bucket, options = {}) {
  const safeBucket = normalizeLivePairBucket(bucket);
  const queries = livePairBucketSearchQueries(safeBucket, options.scanState);
  if (!queries.length) return [];

  const ttlMs = Number.isFinite(Number(options.searchTtlMs))
    ? Number(options.searchTtlMs)
    : Math.max(3_000, Number(options.ttlMs || 0), 6_000);
  const headers = { "Accept": "application/json", "User-Agent": "solana-telegram-wallet-ops-bot" };
  const rows = [];

  await runWithConcurrency(queries, 3, async (query) => {
    const cacheKey = `live:${safeBucket}:${query}`;
    const cached = dexSearchCandidatesCache.get(cacheKey);
    if (!options.force && cached && Date.now() - cached.cachedAt < ttlMs) {
      rows.push(...cached.value);
      return;
    }

    const data = await fetchJson(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`, {
      headers,
      timeoutMs: options.timeoutMs || 3_000
    }).catch(() => null);
    const value = sniperCandidatesFromDexPairs(arrayFromApiData(data, ["pairs"]), `live:${safeBucket}:${query}`);
    dexSearchCandidatesCache.set(cacheKey, { cachedAt: Date.now(), value });
    rows.push(...value);
  });

  return uniqueSniperCandidates(rows);
}

function livePairBucketSearchQueries(bucket, scanState = {}) {
  const querySets = {
    under1h: ["pump solana", "pumpfun solana", "new pump", "solana meme", "raydium pump", "solana trending", "solana volume", "cto pump"],
    under3h: ["solana trending", "solana pump", "raydium solana", "solana movers", "bonk solana", "pumpfun", "solana breakout", "cto solana"],
    under1d: ["solana volume", "solana movers", "solana meme", "solana breakout", "raydium solana", "pump trending", "solana community", "solana gem"]
  };
  const list = querySets[normalizeLivePairBucket(bucket)] || [];
  const refreshCount = Number(scanState?.refreshCount || 0);
  const offset = refreshCount * 2 + stringModulo(bucket, list.length || 1) + Math.floor(Date.now() / 60_000);
  return rotateItems(list, offset).slice(0, 6);
}

function compareLivePairCandidates(a, b) {
  return Number(livePairCandidateCreatedAt(b) || 0) - Number(livePairCandidateCreatedAt(a) || 0);
}

function livePairCandidateCreatedAt(candidate) {
  const profile = candidate?.metadata || candidate?.profile || {};
  return normalizePairCreatedAt(firstString(
    profile.pairCreatedAt,
    profile.pair_created_at,
    profile.pair_created_timestamp,
    profile.poolCreatedAt,
    profile.pool_created_at,
    profile.pool_created_timestamp,
    profile.listingCreatedAt,
    profile.listedAt,
    profile.launchTimestamp,
    profile.created_timestamp,
    profile.createdAt,
    profile.created_at,
    profile.pairCreatedTime,
    profile.timestamp
  ));
}

async function findManualLaunchCandidate(ticker) {
  const target = cleanTickerSymbol(ticker);
  const candidates = await fetchManualLaunchCandidates();
  const hydrated = await hydrateSniperCandidates(rotatePumpSnipeCandidatePool(candidates, { candidateOffset: Date.now() }));
  const exact = [];
  const fuzzy = [];

  for (const candidate of hydrated) {
    const metadata = candidate.metadata || {};
    const symbol = cleanTickerForCompare(metadata.symbol || candidate.profile?.symbol || "");
    const name = cleanTickerForCompare(metadata.name || candidate.profile?.name || "");
    const row = {
      tokenMint: candidate.tokenMint,
      symbol: metadata.symbol || candidate.profile?.symbol || "",
      name: metadata.name || candidate.profile?.name || "",
      pairCreatedAt: metadata.pairCreatedAt || null
    };
    if (symbol === target) {
      exact.push(row);
    } else if (name.includes(target) || symbol.includes(target)) {
      fuzzy.push(row);
    }
  }

  return [...exact, ...fuzzy]
    .sort((a, b) => Number(b.pairCreatedAt || 0) - Number(a.pairCreatedAt || 0))[0] || null;
}

async function fetchManualLaunchCandidates() {
  const cacheTtlMs = Math.max(500, Math.min(CONFIG.manualLaunchScanIntervalMs, 2_000));
  if (Date.now() - manualLaunchCandidatesCache.cachedAt < cacheTtlMs) {
    return manualLaunchCandidatesCache.value;
  }

  const [photon, pump] = await Promise.all([
    fetchPhotonNewPairCandidates({ ttlMs: cacheTtlMs }).catch(() => []),
    fetchPumpSnipeCandidates({ ttlMs: cacheTtlMs, timeoutMs: 2_500 }).catch(() => [])
  ]);
  const value = uniqueSniperCandidates([...photon, ...pump]);
  manualLaunchCandidatesCache = { cachedAt: Date.now(), value };
  return value;
}

async function fetchPhotonNewPairCandidates(options = {}) {
  if (!CONFIG.photonNewPairsUrl) return [];
  const ttlMs = Number.isFinite(Number(options.ttlMs)) ? Number(options.ttlMs) : Math.max(500, Math.min(CONFIG.manualLaunchScanIntervalMs, 2_000));
  if (!options.force && ttlMs > 0 && Date.now() - photonNewPairsCache.cachedAt < ttlMs) {
    return photonNewPairsCache.value;
  }

  const headers = { "Accept": "application/json", "User-Agent": "solana-telegram-wallet-ops-bot" };
  if (CONFIG.photonApiKey) {
    headers.Authorization = `Bearer ${CONFIG.photonApiKey}`;
  }

  const timeoutMs = Number.isFinite(Number(options.timeoutMs))
    ? Number(options.timeoutMs)
    : Math.max(1_200, Math.min(3_500, CONFIG.manualLaunchScanIntervalMs));
  const data = await fetchJson(CONFIG.photonNewPairsUrl, { headers, timeoutMs });
  const value = sniperCandidatesFromPhotonData(data);
  photonNewPairsCache = { cachedAt: Date.now(), value };
  return value;
}

function sniperCandidatesFromPhotonData(data) {
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.data) ? data.data
      : Array.isArray(data?.pairs) ? data.pairs
        : Array.isArray(data?.tokens) ? data.tokens
          : Array.isArray(data?.results) ? data.results
            : [];

  return items
    .map((item) => {
      const token = item?.token || item?.baseToken || item?.base || item || {};
      const tokenMint = token.address
        || token.mint
        || token.tokenAddress
        || item?.tokenAddress
        || item?.mint
        || item?.ca
        || item?.contractAddress
        || item?.address;
      if (!tokenMint) return null;

      return {
        tokenMint,
        source: "photon",
        profile: {
          symbol: token.symbol || item?.symbol || item?.ticker || "",
          name: token.name || item?.name || "",
          description: item?.description || "",
          icon: token.image || token.imageUrl || item?.image || item?.imageUrl || "",
          pairCreatedAt: item?.pairCreatedAt || item?.createdAt || item?.created_at || item?.timestamp || null,
          marketCap: firstNumber(item?.marketCap, item?.market_cap, item?.fdv, item?.usdMarketCap, token.marketCap, token.market_cap),
          fdv: firstNumber(item?.fdv, token.fdv),
          liquidityUsd: firstNumber(item?.liquidityUsd, item?.liquidity_usd, item?.liquidity?.usd, item?.liquidity, token.liquidityUsd, token.liquidity?.usd),
          volume: {
            m5: firstNumber(item?.volume?.m5, item?.volume5m, item?.volume_5m, token.volume?.m5),
            h1: firstNumber(item?.volume?.h1, item?.volume1h, item?.volume_h1, item?.volume, token.volume?.h1, token.volume)
          }
        }
      };
    })
    .filter(Boolean);
}

async function fetchPumpFunLatestCandidates(options = {}) {
  const headers = { "Accept": "application/json", "User-Agent": "solana-telegram-wallet-ops-bot" };
  if (CONFIG.pumpFunApiToken) {
    headers.Authorization = `Bearer ${CONFIG.pumpFunApiToken}`;
  }

  const requestOptions = { headers, timeoutMs: options.timeoutMs || 2_500 };
  const latestUrl = `${CONFIG.pumpFunApiBase}/coins/latest`;
  const listUrl = `${CONFIG.pumpFunApiBase}/coins?offset=0&limit=100&sort=created_timestamp&order=DESC&includeNsfw=false`;
  const [latest, list] = await Promise.all([
    fetchJson(latestUrl, requestOptions).catch(() => null),
    fetchJson(listUrl, requestOptions).catch(() => [])
  ]);
  return uniqueSniperCandidates(sniperCandidatesFromPumpFunData([latest, ...arrayFromApiData(list)], "pumpfun-latest"));
}

function sniperCandidatesFromPumpFunData(items, source = "pumpfun") {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const coin = item?.data || item?.coin || item;
      if (!coin || typeof coin !== "object") return null;
      const tokenMint = firstString(coin.mint, coin.address, coin.tokenAddress, coin.token_address, coin.ca, coin.contractAddress);
      if (!tokenMint) return null;
      const raydiumPool = firstString(coin.raydium_pool, coin.raydiumPool, coin.poolAddress, coin.pool, coin.amm_pool);
      const bondingProgressPct = firstMeaningfulNumber(
        coin.bondingProgressPct,
        coin.bondingProgress,
        coin.bonding_curve_progress,
        coin.bondingCurveProgress,
        coin.progress,
        coin.pumpProgress,
        coin.graduationProgress,
        coin.completion,
        coin.completePct
      ) || 0;
      const graduated = Boolean(
        coin.complete
        || coin.completed
        || coin.bonded
        || coin.isBonded
        || coin.graduated
        || coin.isGraduated
        || raydiumPool
      );
      return {
        tokenMint,
        source,
        profile: {
          symbol: firstString(coin.symbol, coin.ticker),
          name: firstString(coin.name),
          description: firstString(coin.description),
          icon: firstString(coin.image_uri, coin.image, coin.imageUrl, coin.metadata?.image),
          pairCreatedAt: normalizePairCreatedAt(firstString(coin.created_timestamp, coin.createdAt, coin.created_at, coin.timestamp)),
          marketCap: firstNumber(coin.usd_market_cap, coin.market_cap, coin.marketCap, coin.fdv),
          fdv: firstNumber(coin.fdv, coin.marketCap, coin.usd_market_cap, coin.market_cap),
          liquidityUsd: firstNumber(coin.liquidity_usd, coin.liquidityUsd, coin.liquidity?.usd, coin.liquidity, coin.currentLiquidityUsd),
          volume: typeof coin.volume === "object" && coin.volume !== null ? coin.volume : firstNumber(coin.volume, coin.volumeUsd, coin.volume_usd),
          volume5m: firstNumber(coin.volume5m, coin.volume_5m, coin.volume?.m5, coin.volume?.["5m"]),
          volume15m: firstNumber(coin.volume15m, coin.volume_15m, coin.volumeM15, coin.volume?.m15, coin.volume?.["15m"]),
          volume30m: firstNumber(coin.volume30m, coin.volume_30m, coin.volumeM30, coin.volume?.m30, coin.volume?.["30m"]),
          volumeH1: firstNumber(coin.volumeH1, coin.volume_h1, coin.volume_1h, coin.volume?.h1, coin.volume?.["1h"]),
          volume24h: firstNumber(coin.volume24h, coin.volume_h24, coin.volume_24h, coin.volume?.h24, coin.volume?.["24h"]),
          txns: coin.txns || coin.transactions || null,
          virtualSolReserves: firstNumber(coin.virtual_sol_reserves),
          virtualTokenReserves: firstNumber(coin.virtual_token_reserves),
          bondingProgressPct,
          graduated,
          isGraduated: graduated,
          raydiumPool
        }
      };
    })
    .filter(Boolean);
}

function cleanTickerForCompare(text) {
  return String(text || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function sniperCandidatesFromDexList(items, source) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => String(item.chainId || "").toLowerCase() === "solana" && item.tokenAddress)
    .filter((item) => item.tokenAddress !== SOL_MINT)
    .map((item) => ({
      tokenMint: item.tokenAddress,
      source,
      profile: item
    }));
}

function sniperCandidatesFromDexPairs(pairs, source) {
  return (Array.isArray(pairs) ? pairs : [])
    .filter((pair) => String(pair?.chainId || "").toLowerCase() === "solana")
    .map((pair) => {
      const base = pair?.baseToken || {};
      const quote = pair?.quoteToken || {};
      const token = base.address && base.address !== SOL_MINT ? base : quote.address && quote.address !== SOL_MINT ? quote : null;
      if (!token?.address) return null;
      const links = dexPairLinks(pair);
      return {
        tokenMint: token.address,
        source,
        profile: {
          symbol: token.symbol || "",
          name: token.name || "",
          icon: pair?.info?.imageUrl || "",
          imageUrl: pair?.info?.imageUrl || "",
          websiteUrl: links.websiteUrl,
          twitterUrl: links.twitterUrl,
          telegramUrl: links.telegramUrl,
          dexId: pair?.dexId || pair?.dexName || "",
          dexName: pair?.dexId || pair?.dexName || "",
          pairAddress: pair?.pairAddress || "",
          pairUrl: pair?.url || "",
          raydiumPool: /raydium|meteora|orca/i.test(String(pair?.dexId || pair?.dexName || "")) ? (pair?.pairAddress || "") : "",
          graduated: Boolean(/raydium|meteora|orca/i.test(String(pair?.dexId || pair?.dexName || "")) && String(token.address || "").toLowerCase().endsWith("pump")),
          pairCreatedAt: pair?.pairCreatedAt || null,
          marketCap: firstNumber(pair?.marketCap, pair?.fdv),
          fdv: pair?.fdv || null,
          liquidityUsd: pair?.liquidity?.usd || null,
          liquidity: pair?.liquidity || null,
          volume: pair?.volume || null,
          txns: pair?.txns || null,
          priceChange: pair?.priceChange || null
        }
      };
    })
    .filter(Boolean);
}

function nextSniperScanState(userId, mode) {
  const key = `${userId}:${mode}`;
  const modeSeed = stringModulo(mode, 97);
  const previous = sniperScanState.get(key) || {
    refreshCount: 0,
    candidateOffset: -24 + modeSeed,
    displayOffset: -5 + (modeSeed % 19)
  };
  const refreshCount = previous.refreshCount + 1;
  const jitter = Math.floor(Math.random() * 17);
  const next = {
    refreshCount,
    candidateOffset: previous.candidateOffset + 37 + (refreshCount % 5) * 11 + jitter,
    displayOffset: previous.displayOffset + 7 + (refreshCount % 4) * 3 + jitter,
    previousShown: uniqueStrings([
      ...(previous.recentShown || previous.lastShown || []),
      ...recentSniperShownMintsForUser(userId, mode)
    ]).slice(-180),
    lastShown: previous.lastShown || [],
    recentShown: previous.recentShown || [],
    updatedAt: Date.now()
  };
  sniperScanState.set(key, next);
  pruneSniperScanState();
  return next;
}

function recentSniperShownMintsForUser(userId, currentMode) {
  const prefix = `${userId}:`;
  const rows = [];
  for (const [key, state] of sniperScanState.entries()) {
    if (!key.startsWith(prefix) || key === `${userId}:${currentMode}`) continue;
    rows.push(...(state.recentShown || state.lastShown || []));
  }
  return rows;
}

function stringModulo(value, modulo) {
  const text = String(value || "");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % modulo;
  }
  return hash;
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
  const primary = unique.filter((candidate) => candidate.source !== "top-boost");
  const backup = unique.filter((candidate) => candidate.source === "top-boost");
  const pool = primary.length >= 80 ? [...primary, ...backup] : unique;
  return rotateItems(pool.slice(0, 520), scanState.candidateOffset).slice(0, 220);
}

function rotatePumpSnipeCandidatePool(candidates, scanState) {
  const unique = uniqueSniperCandidates(candidates);
  const primary = unique.filter((candidate) => candidate.source !== "top-boost");
  const backup = unique.filter((candidate) => candidate.source === "top-boost");
  const pool = primary.length >= 30 ? primary : [...primary, ...backup];
  return rotateItems(pool.slice(0, 560), scanState.candidateOffset).slice(0, 240);
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

function compareSniperScoresForMode(mode, a, b) {
  if (mode === "moonshot") {
    const aMc = Number(a.marketCap || 0);
    const bMc = Number(b.marketCap || 0);
    const aSweetSpot = aMc >= 4_000 && aMc <= 40_000 ? 1 : 0;
    const bSweetSpot = bMc >= 4_000 && bMc <= 40_000 ? 1 : 0;
    return (bSweetSpot - aSweetSpot)
      || Number(b.modeRelevance || 0) - Number(a.modeRelevance || 0)
      || (b.scalpScore - a.scalpScore)
      || (b.score - a.score)
      || (Number(b.volume5m || 0) - Number(a.volume5m || 0))
      || (a.exitRisk - b.exitRisk)
      || (a.rugRisk - b.rugRisk)
      || (aMc - bMc);
  }
  if (mode === "fast" || mode === "pumpsnipe") {
    return (b.scalpScore - a.scalpScore)
      || Number(b.modeRelevance || 0) - Number(a.modeRelevance || 0)
      || (Number(b.volume5m || 0) - Number(a.volume5m || 0))
      || (b.score - a.score)
      || (a.exitRisk - b.exitRisk)
      || (a.rugRisk - b.rugRisk);
  }
  if (mode === "smart") {
    return Number(b.buyPressure || 0) - Number(a.buyPressure || 0)
      || Number(b.modeRelevance || 0) - Number(a.modeRelevance || 0)
      || (b.score - a.score)
      || (a.rugRisk - b.rugRisk);
  }
  if (mode === "long") {
    return (Number(b.h6 || 0) - Number(a.h6 || 0))
      || (Number(b.h24 || 0) - Number(a.h24 || 0))
      || Number(b.modeRelevance || 0) - Number(a.modeRelevance || 0)
      || (b.score - a.score)
      || (a.rugRisk - b.rugRisk);
  }
  if (mode === "meme" || mode === "ai") {
    return Number(b.narrative || 0) - Number(a.narrative || 0)
      || Number(b.modeRelevance || 0) - Number(a.modeRelevance || 0)
      || (b.score - a.score)
      || (Number(b.volumeH1 || 0) - Number(a.volumeH1 || 0));
  }
  return compareSniperScores(a, b);
}

function selectRotatingSniperRows(rows, scanState, limit = 6) {
  const displayLimit = Math.max(1, Math.min(Number.parseInt(limit, 10) || 6, 12));
  if (rows.length <= displayLimit) return uniqueSniperScoreRows(rotateItems(rows, scanState.displayOffset)).slice(0, displayLimit);

  const previousShown = new Set(scanState.previousShown || []);
  const lastShown = new Set(scanState.lastShown || []);
  const neverShownRows = rows.filter((row) => !previousShown.has(row.tokenMint));
  const notLastRows = rows.filter((row) => !lastShown.has(row.tokenMint));
  const pool = neverShownRows.length >= displayLimit
    ? neverShownRows
    : notLastRows.length >= displayLimit
      ? uniqueSniperScoreRows([...neverShownRows, ...notLastRows])
      : uniqueSniperScoreRows([...neverShownRows, ...notLastRows, ...rows]);
  return uniqueSniperScoreRows(rotateItems(pool.slice(0, 180), scanState.displayOffset)).slice(0, displayLimit);
}

function rememberSniperScanRows(userId, mode, rows) {
  const key = `${userId}:${mode}`;
  const previous = sniperScanState.get(key) || {};
  const recentShown = uniqueStrings([
    ...(previous.recentShown || previous.lastShown || []),
    ...rows.map((row) => row.tokenMint)
  ]).slice(-80);
  sniperScanState.set(key, {
    ...previous,
    lastShown: rows.map((row) => row.tokenMint),
    recentShown,
    updatedAt: Date.now()
  });
}

function uniqueStrings(values) {
  const seen = new Set();
  const unique = [];
  for (const value of values || []) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    unique.push(value);
  }
  return unique;
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
  const candidates = await fetchSniperCandidatesForMode("autosnipe", { scanState });
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
    { userId, slippageBps: AUTOSNIPE_SLIPPAGE_BPS, targetAccepted: 6 }
  );
  mergeSniperPrecheckStats(precheckStats, precheck.stats);
  let safeFresh = precheck.rows;
  if (safeFresh.length === 0) {
    tier = "backup";
    precheck = await filterSniperCandidatesForBuy(
      freshAutoSnipeRows(backupQualified, previousShown, recentTokens).slice(0, 30),
      { userId, slippageBps: AUTOSNIPE_SLIPPAGE_BPS, targetAccepted: 6 }
    );
    mergeSniperPrecheckStats(precheckStats, precheck.stats);
    safeFresh = precheck.rows;
  }
  const pick = chooseAutoModePick(safeFresh, scanState);

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
  const candidates = await fetchSniperCandidatesForMode("pumpsnipe", { scanState });
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
    { userId, slippageBps: PUMPSNIPE_SLIPPAGE_BPS, targetAccepted: 6 }
  );
  mergeSniperPrecheckStats(precheckStats, precheck.stats);
  let safeFresh = precheck.rows;
  if (safeFresh.length === 0) {
    tier = "backup";
    precheck = await filterSniperCandidatesForBuy(
      freshPumpSnipeRows(backupQualified, previousShown, recentTokens).slice(0, 36),
      { userId, slippageBps: PUMPSNIPE_SLIPPAGE_BPS, targetAccepted: 6 }
    );
    mergeSniperPrecheckStats(precheckStats, precheck.stats);
    safeFresh = precheck.rows;
  }
  const pick = chooseAutoModePick(safeFresh, scanState);
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
    return !recentlySeen;
  });
  if (fresh.length > 0) return fresh;
  return [];
}

function freshPumpSnipeRows(rows, previousShown, recentTokens) {
  const fresh = rows.filter((item) => {
    const recentlySeen = previousShown.has(item.tokenMint) || recentTokens.has(item.tokenMint);
    return !recentlySeen;
  });
  if (fresh.length > 0) return fresh;
  return [];
}

function chooseAutoModePick(rows, scanState) {
  const unique = uniqueSniperScoreRows(rows);
  if (unique.length === 0) return null;
  return rotateItems(unique, scanState.displayOffset)[0] || unique[0] || null;
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
    && !isPumpMayhemToken(item)
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
    && !isPumpMayhemToken(item)
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
    && !isPumpMayhemToken(item)
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
    && !isPumpMayhemToken(item)
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
  const haystack = `${item?.tokenMint || ""} ${item?.symbol || ""} ${item?.name || ""} ${item?.source || ""} ${item?.category || ""}`.toLowerCase();
  return haystack.includes("pump");
}

function isPumpMayhemToken(item) {
  const labels = [
    item?.tokenMint,
    item?.symbol,
    item?.name,
    item?.source,
    item?.category,
    item?.platform,
    item?.market,
    item?.dexId,
    item?.profileSource,
    item?.profile?.source,
    item?.profile?.market,
    item?.profile?.mode,
    item?.metadata?.source,
    item?.metadata?.market,
    item?.metadata?.mode,
    item?.dexPair?.dexId,
    item?.dexPair?.labels,
    item?.labels,
    item?.riskFlags
  ].flat().filter(Boolean).join(" ").toLowerCase();
  return /\bmayhem\b/.test(labels) || labels.includes("pump mayhem") || labels.includes("mayhem mode");
}

function isStrictSniperPick(item, settings) {
  return item.category !== "Avoid"
    && !isPumpMayhemToken(item)
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
    && !isPumpMayhemToken(item)
    && item.rugRisk <= settings.maxRisk + 24
    && item.exitRisk <= 84
    && item.scalpScore >= 2
    && !item.riskFlags?.includes("hard dump");
}

function buildQualifiedSniperRows(scored, settings) {
  const safeMode = String(settings.mode || "safe");
  const eligibleRows = (scored || []).filter((item) => !isPumpMayhemToken(item));
  const sorter = safeMode === "pumpsnipe"
    ? comparePumpSnipeScores
    : (a, b) => compareSniperScoresForMode(safeMode, a, b);

  if (safeMode === "pumpsnipe") {
    const strictRows = eligibleRows.filter((item) => isPumpSnipePick(item)).sort(sorter);
    const strictMints = new Set(strictRows.map((item) => item.tokenMint));
    const fallbackRows = eligibleRows
      .filter((item) => !strictMints.has(item.tokenMint))
      .filter((item) => isPumpSnipeBackupPick(item))
      .sort(sorter);
    return {
      strictRows,
      fallbackRows,
      qualifiedRows: uniqueSniperScoreRows([...strictRows, ...fallbackRows]).sort(sorter)
    };
  }

  const modeRows = eligibleRows
    .filter((item) => isModeRelevantSniperPick(item, safeMode))
    .sort(sorter);
  const modeMints = new Set(modeRows.map((item) => item.tokenMint));
  const looseRows = eligibleRows
    .filter((item) => !modeMints.has(item.tokenMint))
    .filter((item) => isLooseModeRelevantSniperPick(item, safeMode))
    .sort(sorter);
  const looseMints = new Set([...modeMints, ...looseRows.map((item) => item.tokenMint)]);
  const fallbackRows = eligibleRows
    .filter((item) => !looseMints.has(item.tokenMint))
    .filter((item) => isModeFallbackSniperPick(item, safeMode))
    .sort(sorter);
  const genericRows = eligibleRows
    .filter((item) => !looseMints.has(item.tokenMint))
    .filter((item) => isStrictSniperPick(item, settings) || isFallbackSniperPick(item, settings))
    .sort(sorter);

  return {
    strictRows: modeRows,
    fallbackRows: uniqueSniperScoreRows([...looseRows, ...fallbackRows, ...genericRows]).sort(sorter),
    qualifiedRows: uniqueSniperScoreRows([...modeRows, ...looseRows, ...fallbackRows, ...genericRows]).sort(sorter)
  };
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
      : mergeSniperMetadata({}, candidate.profile, candidate.source);
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
  const profileVolume = Number(profile.volume || profile.volumeUsd || profile.volume_usd || 0);
  return {
    ...dexValue,
    symbol: dexValue.symbol || profile.symbol || "",
    name: dexValue.name || profile.name || "",
    imageUrl: dexValue.imageUrl || profile.icon || "",
    description: profile.description || "",
    marketCap: dexValue.marketCap || profile.marketCap || profile.fdv || null,
    fdv: dexValue.fdv || profile.fdv || null,
    volume: dexValue.volume || (profileVolume > 0 ? { h1: profileVolume } : null),
    volume5m: dexValue.volume?.m5 || profile.volume5m || profile.volume_5m || null,
    volumeM15: dexValue.volume?.m15 || dexValue.volume?.m15m || profile.volumeM15 || profile.volume15m || profile.volume_15m || null,
    volumeM30: dexValue.volume?.m30 || dexValue.volume?.m30m || profile.volumeM30 || profile.volume30m || profile.volume_30m || null,
    volumeH1: dexValue.volume?.h1 || profile.volumeH1 || profile.volume_h1 || null,
    volumeH24: dexValue.volume?.h24 || dexValue.volume?.d1 || profile.volumeH24 || profile.volume24h || profile.volume_h24 || null,
    pairCreatedAt: dexValue.pairCreatedAt || normalizePairCreatedAt(profile.pairCreatedAt || profile.created_timestamp || profile.createdAt),
    profileSource: source,
    websiteUrl: dexValue.websiteUrl || profile.websiteUrl || profile.website_url || profile.website || profile.url || profile.links?.website || "",
    twitterUrl: dexValue.twitterUrl || profile.twitterUrl || profile.twitter_url || profile.twitter || profile.xUrl || profile.links?.twitter || profile.links?.x || "",
    telegramUrl: dexValue.telegramUrl || profile.telegramUrl || profile.telegram_url || profile.telegram || profile.links?.telegram || "",
    sniperCount: profile.sniperCount || profile.snipers || profile.sniper_count || profile.sniperWallets || profile.sniper_wallets || 0,
    boostAmount: Number(profile.amount || profile.totalAmount || 0)
  };
}

function normalizePairCreatedAt(value) {
  return normalizePairTimestamp(value);
}

function isCleanTrendCandidate(item, options = {}) {
  const flags = new Set(item.riskFlags || []);
  const minM5 = Number(options.minM5 ?? -12);
  const minH1 = Number(options.minH1 ?? -12);
  const minH6 = Number(options.minH6 ?? -20);
  const maxManipulation = Number(options.maxManipulation ?? 82);
  return item.category !== "Avoid"
    && !flags.has("hard dump")
    && !flags.has("sell pressure")
    && (options.allowDumping || !flags.has("dumping"))
    && Number(item.m5 || 0) >= minM5
    && Number(item.h1 || 0) >= minH1
    && Number(item.h6 || 0) >= minH6
    && Number(item.manipulationScore || 0) <= maxManipulation;
}

function isModeRelevantSniperPick(item, mode) {
  if (mode === "autosnipe") return Number(item.modeRelevance || 0) >= 4 && isCleanTrendCandidate(item, { minM5: -6, minH1: -8, minH6: -15, maxManipulation: 70 });
  if (mode === "pumpsnipe") return Number(item.modeRelevance || 0) >= 3 && isCleanTrendCandidate(item, { allowDumping: true, minM5: -18, minH1: -22, minH6: -30, maxManipulation: 92 });
  if (mode === "moonshot") return Number(item.modeRelevance || 0) >= 3
    && item.marketCap >= 4_000
    && item.marketCap <= 40_000
    && isCleanTrendCandidate(item, { allowDumping: true, minM5: -12, minH1: -15, minH6: -25, maxManipulation: 78 });
  if (mode === "long") return Number(item.modeRelevance || 0) >= 3
    && item.h6 >= -5
    && item.h24 >= -10
    && isCleanTrendCandidate(item, { minM5: -10, minH1: -8, minH6: -8, maxManipulation: 62 });
  if (mode === "safe") return Number(item.modeRelevance || 0) >= 3
    && isCleanTrendCandidate(item, { minM5: -6, minH1: -5, minH6: -10, maxManipulation: 58 });
  if (mode === "smart") return Number(item.modeRelevance || 0) >= 3
    && isCleanTrendCandidate(item, { minM5: -8, minH1: -6, minH6: -12, maxManipulation: 64 });
  if (mode === "fast") return Number(item.modeRelevance || 0) >= 3
    && isCleanTrendCandidate(item, { minM5: -6, minH1: -8, minH6: -15, maxManipulation: 72 });
  if (mode === "ai" || mode === "meme") return Number(item.modeRelevance || 0) >= 5
    && isCleanTrendCandidate(item, { allowDumping: true, minM5: -10, minH1: -10, minH6: -18, maxManipulation: 75 });
  return Number(item.modeRelevance || 0) >= 3 && isCleanTrendCandidate(item);
}

function isLooseModeRelevantSniperPick(item, mode) {
  if (mode === "moonshot") {
    return item.marketCap >= 4_000
      && item.marketCap <= 40_000
      && item.liquidityUsd >= 150
      && item.scalpScore >= 1
      && (item.volume5m >= 10 || item.volumeH1 >= 100)
      && isCleanTrendCandidate(item, { allowDumping: true, minM5: -18, minH1: -24, minH6: -34, maxManipulation: 86 });
  }
  if (mode === "pumpsnipe") {
    return item.marketCap >= 3_000
      && item.marketCap <= 60_000
      && item.liquidityUsd >= 400
      && item.scalpScore >= 1
      && (item.volume5m >= 50 || item.volumeH1 >= 400)
      && item.m5 >= -30
      && isCleanTrendCandidate(item, { allowDumping: true, minM5: -30, minH1: -35, minH6: -45, maxManipulation: 94 });
  }
  if (mode === "fast") {
    return item.scalpScore >= 2
      && (item.volume5m >= 75 || item.volumeH1 >= 750)
      && item.m5 >= -12
      && item.buyPressure >= 0.9
      && isCleanTrendCandidate(item, { allowDumping: true, minM5: -12, minH1: -14, minH6: -20, maxManipulation: 78 });
  }
  if (mode === "meme" || mode === "ai") {
    return item.narrative > 0
      && item.scalpScore >= 1
      && (item.volume5m >= 50 || item.volumeH1 >= 750)
      && isCleanTrendCandidate(item, { allowDumping: true, minM5: -12, minH1: -14, minH6: -22, maxManipulation: 80 });
  }
  if (mode === "smart") {
    return item.buyPressure >= 1
      && item.liquidityUsd >= 1_000
      && item.scalpScore >= 1
      && item.m5 <= 35
      && isCleanTrendCandidate(item, { minM5: -10, minH1: -10, minH6: -18, maxManipulation: 70 });
  }
  if (mode === "long") {
    return item.h1 >= -5
      && item.h6 >= -10
      && item.liquidityUsd >= 1_000
      && item.volumeH1 >= 1_000
      && isCleanTrendCandidate(item, { minM5: -12, minH1: -8, minH6: -12, maxManipulation: 68 });
  }
  if (mode === "safe") {
    return item.liquidityUsd >= 5_000
      && (item.volume5m >= 100 || item.volumeH1 >= 1_500)
      && item.buyPressure >= 0.95
      && isCleanTrendCandidate(item, { minM5: -8, minH1: -8, minH6: -12, maxManipulation: 66 });
  }
  return false;
}

function buildSniperModeDisplay(qualifiedRows, mode, scanState, options = {}) {
  const limit = Number.parseInt(options.limit || 6, 10);
  const safeMode = String(mode || "safe");
  const sorter = safeMode === "pumpsnipe"
    ? comparePumpSnipeScores
    : (a, b) => compareSniperScoresForMode(safeMode, a, b);
  const modeRows = qualifiedRows
    .filter((item) => !isKnownBelowExitFloor(item))
    .filter((item) => isModeRelevantSniperPick(item, safeMode))
    .sort(sorter);
  const strictMints = new Set(modeRows.map((item) => item.tokenMint));
  const looseModeRows = qualifiedRows
    .filter((item) => !isKnownBelowExitFloor(item))
    .filter((item) => !strictMints.has(item.tokenMint))
    .filter((item) => isLooseModeRelevantSniperPick(item, safeMode))
    .sort(sorter);
  const looseMints = new Set([...strictMints, ...looseModeRows.map((item) => item.tokenMint)]);
  const fallbackRows = qualifiedRows
    .filter((item) => !isKnownBelowExitFloor(item))
    .filter((item) => !looseMints.has(item.tokenMint))
    .filter((item) => isModeFallbackSniperPick(item, safeMode))
    .sort(sorter);
  const fallbackMints = new Set([...looseMints, ...fallbackRows.map((item) => item.tokenMint)]);
  const remainingRows = safeMode === "moonshot"
    ? []
    : qualifiedRows
      .filter((item) => !isKnownBelowExitFloor(item))
      .filter((item) => !fallbackMints.has(item.tokenMint))
      .sort(sorter);
  const displayRows = uniqueSniperScoreRows([
    ...modeRows,
    ...looseModeRows,
    ...fallbackRows,
    ...remainingRows
  ]).sort(sorter);

  return {
    modeRows,
    looseModeRows,
    fallbackRows,
    displayRows,
    rows: selectRotatingSniperRows(displayRows, scanState, limit)
  };
}

function isModeFallbackSniperPick(item, mode) {
  const flags = new Set(item.riskFlags || []);
  const clean = (options = {}) => isCleanTrendCandidate(item, options)
    && !flags.has("hard dump")
    && !flags.has("sell pressure");

  if (mode === "moonshot") {
    return item.marketCap >= 1_000
      && item.marketCap <= 80_000
      && item.liquidityUsd >= 100
      && item.scalpScore >= 1
      && (item.volume5m >= 5 || item.volumeH1 >= 50)
      && item.m5 >= -30
      && item.h1 >= -40
      && clean({ allowDumping: true, minM5: -30, minH1: -40, minH6: -55, maxManipulation: 92 });
  }
  if (mode === "pumpsnipe") {
    return item.marketCap >= 400
      && item.marketCap <= 260_000
      && item.liquidityUsd >= 350
      && item.scalpScore >= 1
      && (item.volume5m >= 40 || item.volumeH1 >= 350)
      && item.m5 >= -30
      && clean({ allowDumping: true, minM5: -30, minH1: -35, minH6: -45, maxManipulation: 94 });
  }
  if (mode === "fast") {
    return item.scalpScore >= 1
      && (item.volume5m >= 100 || item.volumeH1 >= 1_000)
      && item.buyPressure >= 0.9
      && item.m5 >= -14
      && clean({ allowDumping: true, minM5: -14, minH1: -16, minH6: -24, maxManipulation: 82 });
  }
  if (mode === "smart") {
    return item.buyPressure >= 0.95
      && item.liquidityUsd >= 750
      && (item.volume5m >= 50 || item.volumeH1 >= 750)
      && item.m5 <= 45
      && clean({ minM5: -12, minH1: -12, minH6: -20, maxManipulation: 76 });
  }
  if (mode === "safe") {
    return item.liquidityUsd >= 3_500
      && item.rugRisk <= 66
      && item.exitRisk <= 78
      && (item.volume5m >= 75 || item.volumeH1 >= 1_000)
      && item.buyPressure >= 0.9
      && clean({ minM5: -10, minH1: -10, minH6: -16, maxManipulation: 72 });
  }
  if (mode === "long") {
    return item.h1 >= -8
      && item.h6 >= -14
      && item.h24 >= -18
      && item.liquidityUsd >= 1_000
      && item.volumeH1 >= 750
      && clean({ minM5: -14, minH1: -10, minH6: -16, maxManipulation: 72 });
  }
  if (mode === "meme" || mode === "ai") {
    return item.narrative > 0
      && item.scalpScore >= 1
      && (item.volume5m >= 40 || item.volumeH1 >= 500)
      && clean({ allowDumping: true, minM5: -14, minH1: -16, minH6: -26, maxManipulation: 84 });
  }
  return false;
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
  const pairAgeSeconds = metadata.pairCreatedAt ? Math.max(0, Math.floor((Date.now() - Number(metadata.pairCreatedAt)) / 1000)) : null;
  const pairAgeMinutes = pairAgeSeconds === null ? null : Math.floor(pairAgeSeconds / 60);
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
  const isPump = isPumpStyleToken({
    tokenMint,
    symbol: metadata.symbol,
    name: metadata.name,
    source: metadata.source || metadata.profileSource
  });

  return {
    tokenMint,
    symbol: metadata.symbol,
    name: metadata.name,
    imageUrl: metadata.imageUrl || "",
    isPump,
    pumpUrl: isPump ? pumpFunUrl(tokenMint) : "",
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
    pairCreatedAt: metadata.pairCreatedAt || null,
    pairAgeSeconds,
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
    safe: { mode: "safe", minScore: 74, maxRisk: 40 },
    smart: { mode: "smart", minScore: 74, maxRisk: 48 },
    fast: { mode: "fast", minScore: 68, maxRisk: 58 },
    moonshot: { mode: "moonshot", minScore: 56, maxRisk: 70 },
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
    safe: "Safe Picks",
    smart: "Smart Accumulation",
    fast: "Fast Movers",
    moonshot: "Low MC Picks",
    meme: "Narratives",
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
    return Number(data.buyPressure >= 1.05)
      + Number(data.volumeH1 >= 3_500 || data.volume5m >= 400)
      + Number(data.m5 >= -6 && data.m5 <= 18)
      + Number(data.h1 >= -4 && data.h6 >= -10)
      + Number(data.liquidityUsd >= 2_500);
  }
  if (mode === "fast") {
    return Number(data.m5 > 2 || data.h1 > 8)
      + Number(data.volumeH1 >= 5_000 || data.volume5m >= 750)
      + Number(data.buyPressure >= 1.05)
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
    return Number(data.marketCap >= 4_000 && data.marketCap <= 40_000)
      + Number(data.liquidityUsd >= 400)
      + Number(data.buyPressure >= 0.85)
      + Number(data.volumeH1 >= 500 || data.volume5m >= 50)
      + Number(data.h1 >= -12 && data.m5 >= -12);
  }
  if (mode === "long") {
    return Number(data.marketCap >= 30_000 && data.marketCap <= 2_500_000)
      + Number(data.liquidityUsd >= 5_000)
      + Number(data.buyPressure >= 1)
      + Number(data.h1 >= -4 && data.h6 >= -8)
      + Number(data.h24 >= -12);
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
    loopDelaySeconds: 0,
    exitPreset: selected.label,
    allowRepeat: false,
    takeProfitMode: "single",
    stopLossMode: "single",
    walletTakeProfitTargets: null,
    walletStopLossTargets: null
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
    loopDelaySeconds: 0,
    exitPreset: `AutoSnipe ${AUTOSNIPE_TAKE_PROFIT_PCT}%`,
    allowRepeat: false,
    slippageBps: AUTOSNIPE_SLIPPAGE_BPS,
    takeProfitMode: "single",
    stopLossMode: "single",
    walletTakeProfitTargets: null,
    walletStopLossTargets: null
  });
}

function formatAutoSnipePresetDetails(data) {
  return [
    `Exit preset selected: ${data.exitPreset}`,
    "",
    `Sell timer fallback: ${formatSellTimerSummary(data.sellDelaySeconds)}`,
    `Take-profit: ${formatTakeProfitTarget(data.takeProfitPct)} -> sells 100% of the tracked bag`,
    `Stop-loss: -${data.stopLossPct}% -> sells 100% of the tracked bag`,
    `Default slippage: ${AUTOSNIPE_SLIPPAGE_BPS} bps`
  ].join("\n");
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
    loopDelaySeconds: 0,
    exitPreset: `PumpSnipe ${PUMPSNIPE_TAKE_PROFIT_PCT}%`,
    allowRepeat: false,
    slippageBps: PUMPSNIPE_SLIPPAGE_BPS,
    takeProfitMode: "single",
    stopLossMode: "single",
    walletTakeProfitTargets: null,
    walletStopLossTargets: null
  });
}

function formatPumpSnipePresetDetails(data) {
  return [
    `Exit preset selected: ${data.exitPreset}`,
    "",
    `Sell timer fallback: ${formatSellTimerSummary(data.sellDelaySeconds)}`,
    `Take-profit: ${formatTakeProfitTarget(data.takeProfitPct)} -> sells 100% of the tracked bag`,
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
    stopLossMode: "single",
    takeProfitLadder: [],
    walletTakeProfitTargets: null,
    walletStopLossTargets: null,
    loopCount: 1,
    loopDelaySeconds: 0,
    exitPreset: "Auto Bundle Default",
    allowRepeat: false
  });
}

function applyManualLaunchDefaults(session) {
  Object.assign(session.data, {
    tradeMode: "bundle",
    manualLaunch: true,
    planSource: "manual_launch_snipe",
    sellDelaySeconds: PUMPSNIPE_SELL_DELAY_SECONDS,
    sellDelayMinutes: PUMPSNIPE_SELL_DELAY_SECONDS / 60,
    sellPercent: 100,
    triggerSellPercent: 100,
    takeProfitPct: PUMPSNIPE_TAKE_PROFIT_PCT,
    stopLossPct: PUMPSNIPE_STOP_LOSS_PCT,
    takeProfitMode: "single",
    stopLossMode: "single",
    takeProfitLadder: [],
    walletTakeProfitTargets: null,
    walletStopLossTargets: null,
    loopCount: 1,
    loopDelaySeconds: 0,
    exitPreset: "Manual Launch Snipe",
    allowRepeat: false,
    slippageBps: PUMPSNIPE_SLIPPAGE_BPS
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
      `Take-profit: ${formatTakeProfitTarget(AUTO_BUNDLE_TAKE_PROFIT_PCT)} full exit`,
      `Stop-loss: -${AUTO_BUNDLE_STOP_LOSS_PCT}% full exit`,
      `Fallback timer: ${formatSellTimerSummary(AUTO_BUNDLE_SELL_DELAY_SECONDS)}`,
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
    await sendQuickChoicePrompt(chatId, [
      "Choose custom take-profit percent.",
      "",
      "Full exit sells 100% of each tracked bag.",
      "`500` means +500% profit target, roughly 6x value.",
      "`5x` means 5x value target, which is +400% profit."
    ].join("\n"), [
      [{ text: "+40%", value: "40" }, { text: "+60%", value: "60" }],
      [{ text: "+100%", value: "100" }, { text: "+150%", value: "150" }],
      [{ text: "+250%", value: "250" }, { text: "+500%", value: "500" }]
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
    `Sell timer: ${formatSellTimerSummary(data.sellDelaySeconds)}`,
    Number(data.sellDelaySeconds || 0) > 0 ? `Timer sell: ${data.sellPercent}%` : "",
    `Take-profit: ${formatTakeProfitTarget(data.takeProfitPct)} -> sells 100% of the tracked bag`,
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
      [{ text: "Verify Backup File", callback_data: "verify_backup_file" }],
      [{ text: "Restore Backup", callback_data: "restore_backup" }],
      [{ text: "Rescue Backup Keys", callback_data: "rescue_backup_keys" }],
      [{ text: "Solflare Key Export", callback_data: "export_private_keys" }],
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
    [{ text: "KOL Tracker", callback_data: "howto_kol" }],
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
        "- Safety check: buys block active mint/freeze authority. The bot checks the buy route before entry and checks the sell route when an exit triggers.",
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
        `- AutoSnipe: fresh-scans, picks one high-conviction scalp setup, then after wallet and amount it fills +${AUTOSNIPE_TAKE_PROFIT_PCT}% take-profit, -${AUTOSNIPE_STOP_LOSS_PCT}% stop-loss, ${AUTOSNIPE_SLIPPAGE_BPS} bps slippage, and a ${formatDelay(AUTOSNIPE_SELL_DELAY_SECONDS)} timer fallback. After amount, tap Use Default or Customize.`,
        `- PumpSnipe: focuses on very early pump-style launches, including lower market-cap setups, and uses +${PUMPSNIPE_TAKE_PROFIT_PCT}% take-profit, -${PUMPSNIPE_STOP_LOSS_PCT}% stop-loss, ${PUMPSNIPE_SLIPPAGE_BPS} bps default slippage, and a ${formatDelay(PUMPSNIPE_SELL_DELAY_SECONDS)} fallback. After amount, tap Use Default or Customize.`,
        `- Manual Launch Snipe: enter a ticker before a launch, choose wallets, SOL size, TP/SL, and slippage, then the bot watches live launch feeds about every ${(CONFIG.manualLaunchScanIntervalMs / 1000).toFixed(CONFIG.manualLaunchScanIntervalMs % 1000 === 0 ? 0 : 1)}s while online and buys once that ticker appears. The armed watch message and Active Launch Watches screen both include cancel buttons.`,
        "- Scan Early Plays: checks latest Solana token profiles and shows the top ranked picks. Each pick has a Snipe button, Dex chart link in the text, and tap-to-copy CA.",
        "- Modes: choose Safe Picks, Smart Accumulation, Fast Movers, PumpSnipe, Low MC, Narratives, or Long Term. Tapping a mode saves that mode and immediately scans that category.",
        "",
        "Auto flow:",
        "Tap Auto, choose AutoSnipe or PumpSnipe, let it scan, choose wallet(s), choose SOL amount, then Confirm. PumpSnipe rotates a wider early-launch pool so it can surface new pump-style options more often.",
        "",
        "Fast scan flow:",
        "Tap Scan Early Plays, open the Dex chart link in the text if you want to inspect it, then tap Snipe #1 through #6. Pick All Wallets, a quick wallet button, or Custom / Group. Pick 0.05, 0.10, 0.50, 1 SOL, or Buy X SOL. OgreSniper then selects the best matching exit preset for the mode and score.",
        "Tap Refresh Scan to rotate through more qualified picks. The bot avoids recently shown picks when enough candidates are available, so refresh should feel more like a new board instead of the same top token every time.",
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
        "Start tiny, avoid low-score plays, and use Safe Mode until buys and sells are landing smoothly."
      ].join("\n")
    },
    kol: {
      openAction: "kol_tracker_menu",
      text: [
        "How To Use: KOL Tracker",
        "",
        "KOL Tracker follows public Solana KOL wallets, then turns current positions or recent buy-style trades into quick signals.",
        "",
        "Buttons inside KOL Tracker:",
        "- Hot KOL Buys: recent high-performing KOLs and their strongest current positions.",
        "- Top KOLs: best ranked KOL wallets by realized performance.",
        "- Consistent KOLs: focuses on win-rate / consistency from the available KOL leaderboard.",
        "- Fresh Activity: prioritizes wallets with newest activity.",
        "- Trade: sends the signal CA into the one-wallet Trade flow.",
        "- Bundle: sends the signal CA into the Bundle flow for multiple wallets.",
        "- Copy Plan: buys from your selected wallets and arms timer, take-profit, stop-loss, repeat, and slippage settings.",
        "",
        "Web-only extras:",
        "- Paste a custom KOL wallet in the web panel to inspect latest buy-style trades from that wallet.",
        "- All KOL copy settings have quick presets plus Custom inputs.",
        "",
        "Notes:",
        "- KOL signals are not guarantees. Always check the chart and token liquidity.",
        "- Profile cards may show KOL pictures when the wallet profile includes one.",
        "- Use Copy Wallet when you want the bot to watch for the next new buy from that wallet."
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
        "- Copy Trade: info/setup item for a future wallet watcher.",
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
        "- Repeat wait: optional pause before the next cycle starts after a sell. Choose no wait, 5s, 30s, 1m, 5m, or type a custom value.",
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
        "- Verify Backup File: shows the public wallet addresses inside a backup before restoring or rescuing keys.",
        "- Restore Backup: loads wallets back into the bot from an encrypted backup file or pasted backup text.",
        "- Rescue Backup Keys: reads a backup and sends a private-key recovery file without needing wallets restored first.",
        "- Solflare Key Export: sends raw private keys for wallets already inside the bot after exact confirmation.",
        "- Remove Wallets: sends an encrypted backup, asks for a second confirmation, then removes selected wallet records from the bot without moving funds.",
        "",
        "Automatic backups:",
        "The bot automatically sends an encrypted bot backup file after wallet creation, wallet import, and wallet restore. The filename includes the group label, user ID, exact timestamp, wallet hint, and backup fingerprint so repeated group names do not look identical.",
        "If several old files have the same label, tap Verify Backup File and upload each one until the needed public address appears.",
        "Solflare recovery file:",
        "With AUTO_SEND_RECOVERY_KEY_FILE=true, the bot also sends a Solflare/Phantom recovery key file after wallet create/import/restore. This is easier to import if the bot fails, but it contains raw private keys and must be kept private.",
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
  }, { fresh: options.fresh === true });
}

async function sendQuickPercentPrompt(chatId, text, options = {}) {
  await sendFlowPrompt(chatId, text, {
    inline_keyboard: [
      [{ text: "Sell 25%", callback_data: "quick:25" }, { text: "Sell 50%", callback_data: "quick:50" }, { text: "Sell 100%", callback_data: "quick:100" }],
      [{ text: "Sell X %", callback_data: "quick:custom" }]
    ]
  }, { fresh: options.fresh === true });
}

async function sendQuickSlippagePrompt(chatId, text, options = {}) {
  const defaultBps = Number.isInteger(options.defaultBps) ? options.defaultBps : CONFIG.defaultSlippageBps;
  const inline_keyboard = [
    [{ text: `Default ${defaultBps} bps`, callback_data: "quick:default" }, { text: "300 bps", callback_data: "quick:300" }],
    [{ text: "500 bps", callback_data: "quick:500" }, { text: "Custom", callback_data: "quick:custom" }]
  ];

  await sendFlowPrompt(chatId, text, { inline_keyboard }, { fresh: options.fresh === true });
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
  }, { fresh: options.fresh === true });
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
  const result = await sendOrEditMessage(chatId, options.fresh ? null : session?.activePromptMessageId, messageText, replyMarkup);
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

  const data = await fetchJson(`https://api.telegram.org/bot${CONFIG.telegramToken}/sendDocument`, {
    method: "POST",
    body: form
  });

  if (!data.ok) {
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

  const data = await fetchJson(`https://api.telegram.org/bot${CONFIG.telegramToken}/sendPhoto`, {
    method: "POST",
    body: form
  });

  if (!data.ok) {
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

function providerErrorValue(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(providerErrorValue).filter(Boolean).join("; ");
  }
  if (typeof value === "object") {
    return firstString(
      value.message,
      value.error,
      value.description,
      value.reason,
      value.detail,
      value.details,
      providerErrorValue(value.errors),
      providerErrorValue(value.result?.error)
    );
  }
  return String(value);
}

function fetchJsonErrorMessage(data, text, status) {
  const message = providerErrorValue(data);
  if (message) return message.slice(0, 500);
  const fallback = String(text || "").replace(/\s+/g, " ").trim();
  if (fallback) return fallback.slice(0, 500);
  return `HTTP ${status}`;
}

async function fetchJson(url, init = {}) {
  const { timeoutMs, ...fetchInit } = init || {};
  let timeout = null;
  let controller = null;

  if (Number.isFinite(Number(timeoutMs)) && Number(timeoutMs) > 0 && !fetchInit.signal) {
    controller = new AbortController();
    fetchInit.signal = controller.signal;
    timeout = setTimeout(() => controller.abort(), Number(timeoutMs));
  }

  let response;
  try {
    response = await fetch(url, fetchInit);
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    if (timeout) clearTimeout(timeout);
  }

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
    const error = new Error(fetchJsonErrorMessage(data, text, response.status));
    error.status = response.status;
    error.retryAfter = response.headers.get("retry-after");
    error.responseBody = String(text || "").slice(0, 1000);
    error.providerData = data;
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
  await writeJsonFile(walletPath(), store);
}

async function readJson(filePath) {
  const fallback = defaultJsonForPath(filePath);
  let text = "";

  try {
    text = await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT" || fallback === null) throw error;
    await writeJsonFile(filePath, fallback);
    return cloneJson(fallback);
  }

  if (!text.trim()) {
    if (fallback === null) {
      const error = new Error(`${path.basename(filePath)} is empty.`);
      error.statusCode = 500;
      throw error;
    }
    await writeJsonFile(filePath, fallback);
    return cloneJson(fallback);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    const wrapped = new Error(`${path.basename(filePath)} is not valid JSON. Use the backup/restore file if this data file was interrupted during deploy.`);
    wrapped.statusCode = 500;
    wrapped.cause = error;
    throw wrapped;
  }
}

async function writeJsonFile(filePath, value) {
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  try {
    await fs.writeFile(tmpPath, JSON.stringify(value, null, 2));
    await fs.rename(tmpPath, filePath);
  } catch (error) {
    await fs.unlink(tmpPath).catch(() => {});
    throw error;
  }
}

function defaultJsonForPath(filePath) {
  switch (path.basename(filePath)) {
    case "wallets.json":
      return { wallets: [] };
    case "audit-log.json":
      return { entries: [] };
    case "state.json":
      return { paused: false };
    case "trade-plans.json":
    case "dca-plans.json":
      return { plans: [] };
    case "sniper-settings.json":
      return { users: {} };
    case "trade-history.json":
      return { trades: [] };
    case "web-auth.json":
      return { codes: [], sessions: [], profiles: {} };
    case "app-secret.json":
      return {};
    default:
      return null;
  }
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

async function audit(action, details) {
  const auditLog = await readJson(auditPath());
  if (!Array.isArray(auditLog.entries)) auditLog.entries = [];
  auditLog.entries.push({
    timestamp: new Date().toISOString(),
    action,
    details
  });
  await writeJsonFile(auditPath(), auditLog);
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
  await writeJsonFile(tradePlansPath(), store);
}

async function readDcaPlans() {
  const store = await readJson(dcaPlansPath());
  if (!Array.isArray(store.plans)) store.plans = [];
  return store;
}

async function writeDcaPlans(store) {
  await writeJsonFile(dcaPlansPath(), store);
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
  await writeJsonFile(tradeHistoryPath(), store);
}

async function readSniperSettings() {
  const store = await readJson(sniperSettingsPath());
  if (!store.users || typeof store.users !== "object") store.users = {};
  return store;
}

async function writeSniperSettings(store) {
  await writeJsonFile(sniperSettingsPath(), store);
}

async function readWebAuthStore() {
  const store = await readJson(webAuthPath());
  if (!Array.isArray(store.codes)) store.codes = [];
  if (!Array.isArray(store.sessions)) store.sessions = [];
  if (!store.profiles || typeof store.profiles !== "object") store.profiles = {};
  return store;
}

async function writeWebAuthStore(store) {
  await writeJsonFile(webAuthPath(), store);
}

function defaultWebPresets() {
  return {
    trade: [
      {
        id: "trade-default-scalp",
        name: "Scalp .10",
        kind: "trade",
        walletIndex: "1",
        amountSol: "0.1",
        takeProfitPct: "25",
        stopLossPct: "8",
        sellDelay: "off",
        sellPercent: "100",
        slippageBps: "400",
        readonly: true
      },
      {
        id: "trade-default-fast",
        name: "Fast .50",
        kind: "trade",
        walletIndex: "1",
        amountSol: "0.5",
        takeProfitPct: "40",
        stopLossPct: "10",
        sellDelay: "5",
        sellPercent: "100",
        slippageBps: "400",
        readonly: true
      }
    ],
    bundle: [
      {
        id: "bundle-default-six",
        name: "6 Wallet .10",
        kind: "bundle",
        walletIndexes: ["1", "2", "3", "4", "5", "6"],
        walletGroup: "",
        amountSol: "0.1",
        takeProfitPct: "60",
        stopLossPct: "10",
        sellDelay: "off",
        sellPercent: "100",
        slippageBps: "400",
        readonly: true
      },
      {
        id: "bundle-default-scalp",
        name: "Bundle Scalp",
        kind: "bundle",
        walletIndexes: ["1", "2", "3"],
        walletGroup: "",
        amountSol: "0.1",
        takeProfitPct: "25",
        stopLossPct: "8",
        sellDelay: "5",
        sellPercent: "100",
        slippageBps: "400",
        readonly: true
      }
    ]
  };
}

function ensureWebProfileDefaults(store, userId) {
  const key = String(userId);
  const existing = store.profiles[key] || {};
  let changed = false;
  const profile = { ...existing };

  if (!profile.referralCode) {
    profile.referralCode = generateWebReferralCode(store, profile.username || key);
    changed = true;
  }
  if (!Array.isArray(profile.tradePresets)) {
    profile.tradePresets = [];
    changed = true;
  }
  if (!Array.isArray(profile.bundlePresets)) {
    profile.bundlePresets = [];
    changed = true;
  }
  if (!Array.isArray(profile.hiddenWebPresetIds)) {
    profile.hiddenWebPresetIds = [];
    changed = true;
  }
  if (!Array.isArray(profile.watchedTokens)) {
    profile.watchedTokens = [];
    changed = true;
  }
  if (typeof profile.showOnTraderBoard !== "boolean") {
    profile.showOnTraderBoard = false;
    changed = true;
  }
  if (!["all", "manual"].includes(String(profile.traderBoardWalletMode || ""))) {
    profile.traderBoardWalletMode = "all";
    changed = true;
  }
  if (!Array.isArray(profile.traderBoardWalletIndexes)) {
    profile.traderBoardWalletIndexes = [];
    changed = true;
  }
  if (!Array.isArray(profile.traderBoardWalletPublicKeys)) {
    profile.traderBoardWalletPublicKeys = [];
    changed = true;
  }
  if (profile.referralPayoutWallet === undefined) {
    profile.referralPayoutWallet = "";
    changed = true;
  }
  if (!profile.referralStats || typeof profile.referralStats !== "object") {
    profile.referralStats = { totalLamports: "0", payoutCount: 0, referrals: {} };
    changed = true;
  }

  if (changed || !store.profiles[key]) {
    profile.updatedAt = profile.updatedAt || new Date().toISOString();
    store.profiles[key] = profile;
  }
  return { profile, changed };
}

function generateWebReferralCode(store, seed = "sw") {
  const cleanSeed = String(seed || "sw")
    .replace(/^web_/i, "")
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 8)
    .toUpperCase() || "SW";
  for (let i = 0; i < 20; i += 1) {
    const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const code = normalizeReferralCode(`${cleanSeed}${suffix}`);
    if (!findWebProfileByReferralCode(store, code)) return code;
  }
  return normalizeReferralCode(crypto.randomBytes(7).toString("hex").toUpperCase());
}

function normalizeReferralCode(value) {
  return String(value || "").trim().replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 20);
}

function findWebProfileByReferralCode(store, codeValue) {
  const code = normalizeReferralCode(codeValue);
  if (!code) return null;
  const entry = Object.entries(store.profiles || {}).find(([, profile]) => normalizeReferralCode(profile.referralCode) === code);
  return entry ? { userId: entry[0], profile: entry[1] } : null;
}

function webReferralLink(code) {
  const base = CONFIG.webPortalUrl || "https://www.slimewire.org";
  const url = new URL(base);
  url.searchParams.set("ref", normalizeReferralCode(code));
  return url.toString();
}

async function createWebLoginCode(userId, chatId) {
  const store = await readWebAuthStore();
  const now = Date.now();
  const result = addWebLoginCodeToStore(store, userId, chatId, now);
  await writeWebAuthStore(store);
  await audit("web_login_code_created", { userId, chatId, expiresAt: result.expiresAt });

  return result;
}

function addWebLoginCodeToStore(store, userId, chatId, now = Date.now()) {
  const code = crypto.randomBytes(8).toString("hex").toUpperCase();
  const formatted = code.match(/.{1,4}/g).join("-");
  const expiresAt = new Date(now + WEB_LOGIN_CODE_TTL_MS).toISOString();

  store.codes = store.codes.filter((item) => {
    const expired = Date.parse(item.expiresAt || "") <= now;
    const sameUser = String(item.userId) === String(userId);
    return !expired && !sameUser && !item.usedAt;
  });
  store.codes.push({
    codeHash: hashWebSecret(code),
    userId: String(userId),
    chatId: String(chatId),
    createdAt: new Date(now).toISOString(),
    expiresAt
  });
  store.sessions = store.sessions.filter((item) => Date.parse(item.expiresAt || "") > now);

  return { code: formatted, expiresAt };
}

async function verifyWebLoginCode(input) {
  const normalized = normalizeWebLoginCode(input);
  if (!normalized) {
    const error = new Error("Enter the login code from Telegram.");
    error.statusCode = 400;
    throw error;
  }

  const store = await readWebAuthStore();
  const now = Date.now();
  const codeHash = hashWebSecret(normalized);
  const index = store.codes.findIndex((item) => item.codeHash === codeHash && !item.usedAt && Date.parse(item.expiresAt || "") > now);

  if (index === -1) {
    const error = new Error("Login code is expired or invalid. Open Telegram and request a new /web code.");
    error.statusCode = 401;
    throw error;
  }

  const codeRecord = store.codes[index];
  store.codes[index] = {
    ...codeRecord,
    usedAt: new Date(now).toISOString()
  };
  store.codes = store.codes.filter((item) => !item.usedAt && Date.parse(item.expiresAt || "") > now);
  const session = issueWebSessionRecord(codeRecord.userId, codeRecord.chatId || codeRecord.userId, now);
  store.sessions = [
    ...store.sessions.filter((item) => Date.parse(item.expiresAt || "") > now),
    session.record
  ];
  await writeWebAuthStore(store);
  await audit("web_login_success", { userId: codeRecord.userId, expiresAt: session.expiresAt });

  return { token: session.token, tokenHash: session.tokenHash, userId: codeRecord.userId, expiresAt: session.expiresAt };
}

async function verifyWebPasswordLogin(usernameValue, passwordValue) {
  const username = normalizeWebUsername(usernameValue);
  const password = normalizeWebPassword(passwordValue);
  const store = await readWebAuthStore();
  const entry = findWebProfileByUsername(store, username);
  const invalidError = () => {
    const error = new Error("Username or password is incorrect.");
    error.statusCode = 401;
    return error;
  };

  if (!entry?.profile?.passwordLogin) throw invalidError();
  if (!verifyWebPassword(password, entry.profile.passwordLogin)) throw invalidError();

  const now = Date.now();
  const session = issueWebSessionRecord(entry.userId, entry.userId, now);
  store.sessions = [
    ...store.sessions.filter((item) => Date.parse(item.expiresAt || "") > now),
    session.record
  ];
  entry.profile.lastPasswordLoginAt = new Date(now).toISOString();
  await writeWebAuthStore(store);
  await audit("web_password_login_success", { userId: entry.userId, username, expiresAt: session.expiresAt });
  return { token: session.token, tokenHash: session.tokenHash, userId: entry.userId, expiresAt: session.expiresAt };
}

async function createWebAccount(options = {}) {
  const body = typeof options === "string" ? { email: options } : (options || {});
  const store = await readWebAuthStore();
  const now = Date.now();
  const userId = `web_${crypto.randomBytes(12).toString("base64url")}`;
  const email = normalizeEmail(body.email);
  const rawUsername = String(body.username || "").trim();
  const rawPassword = String(body.password || "");
  const wantsPasswordLogin = Boolean(rawUsername || rawPassword);
  const username = wantsPasswordLogin ? normalizeWebUsername(rawUsername) : "";
  const passwordLogin = wantsPasswordLogin ? hashWebPassword(normalizeWebPassword(rawPassword)) : null;
  if (username) assertWebUsernameAvailable(store, username);
  const referralEntry = findWebProfileByReferralCode(store, body.referralCode || body.ref || "");
  const referralCode = generateWebReferralCode(store, username || userId);
  const session = issueWebSessionRecord(userId, userId, now);

  store.profiles[userId] = {
    email,
    username,
    usernameNormalized: username,
    passwordLogin,
    referralCode,
    referredByUserId: referralEntry && referralEntry.userId !== userId ? String(referralEntry.userId) : "",
    referredByCode: referralEntry && referralEntry.userId !== userId ? normalizeReferralCode(referralEntry.profile.referralCode) : "",
    referralPayoutWallet: "",
    showOnTraderBoard: false,
    traderBoardWalletMode: "all",
    traderBoardWalletIndexes: [],
    traderBoardWalletPublicKeys: [],
    tradePresets: [],
    bundlePresets: [],
    hiddenWebPresetIds: [],
    watchedTokens: [],
    xHandle: "",
    xConnectedAt: "",
    avatarDataUrl: "",
    avatarUrl: "",
    avatarSource: "",
    connectedWallet: null,
    source: "web",
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString()
  };
  store.sessions = [
    ...store.sessions.filter((item) => Date.parse(item.expiresAt || "") > now),
    session.record
  ];
  await writeWebAuthStore(store);
  await audit("web_account_created", { userId, hasEmail: Boolean(email), hasPasswordLogin: Boolean(username), username, expiresAt: session.expiresAt });

  let emailSent = false;
  let emailError = null;
  if (email) {
    try {
      emailSent = await sendPortalReminderEmail(email);
    } catch (error) {
      emailError = friendlyError(error);
    }
  }

  return { userId, token: session.token, tokenHash: session.tokenHash, expiresAt: session.expiresAt, emailSent, emailError };
}

function issueWebSessionRecord(userId, chatId, now = Date.now()) {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashWebSecret(token);
  const expiresAt = new Date(now + CONFIG.webSessionTtlHours * 60 * 60 * 1000).toISOString();
  return {
    token,
    tokenHash,
    expiresAt,
    record: {
      tokenHash,
      userId: String(userId),
      chatId: String(chatId || userId),
      createdAt: new Date(now).toISOString(),
      lastUsedAt: new Date(now).toISOString(),
      expiresAt
    }
  };
}

function normalizeWebUsername(value) {
  const username = String(value || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();

  if (!/^[a-z0-9][a-z0-9_.-]{2,23}$/.test(username)) {
    const error = new Error("Username must be 3-24 characters and use letters, numbers, dot, dash, or underscore.");
    error.statusCode = 400;
    throw error;
  }

  return username;
}

function normalizeWebPassword(value) {
  const password = String(value || "");
  if (password.length < 8 || password.length > 128) {
    const error = new Error("Password must be 8-128 characters.");
    error.statusCode = 400;
    throw error;
  }
  return password;
}

function assertWebUsernameAvailable(store, username, excludeUserId = "") {
  const existing = findWebProfileByUsername(store, username);
  if (existing && String(existing.userId) !== String(excludeUserId || "")) {
    const error = new Error("That username is already taken.");
    error.statusCode = 409;
    throw error;
  }
}

function findWebProfileByUsername(store, usernameValue) {
  const username = String(usernameValue || "").trim().toLowerCase();
  if (!username) return null;
  const entry = Object.entries(store.profiles || {}).find(([, profile]) => {
    const saved = String(profile.usernameNormalized || profile.username || "").trim().toLowerCase();
    return saved === username;
  });
  return entry ? { userId: entry[0], profile: entry[1] } : null;
}

function hashWebPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const options = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
  const hash = crypto.scryptSync(password, salt, 32, options).toString("hex");
  return {
    algorithm: "scrypt",
    salt,
    hash,
    keyLength: 32,
    N: options.N,
    r: options.r,
    p: options.p,
    createdAt: new Date().toISOString()
  };
}

function verifyWebPassword(password, record = {}) {
  try {
    if (record.algorithm !== "scrypt" || !record.salt || !record.hash) return false;
    const keyLength = Number.parseInt(record.keyLength || "32", 10);
    const expected = Buffer.from(String(record.hash), "hex");
    const actual = crypto.scryptSync(password, String(record.salt), keyLength, {
      N: Number.parseInt(record.N || "16384", 10),
      r: Number.parseInt(record.r || "8", 10),
      p: Number.parseInt(record.p || "1", 10),
      maxmem: 64 * 1024 * 1024
    });
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

async function authenticateWebRequest(request) {
  const token = webAuthTokenFromRequest(request);
  if (!token) {
    const error = new Error("Missing web session. Tap Create Account on the web panel, or log in again with a fresh Telegram /web code.");
    error.statusCode = 401;
    throw error;
  }

  const tokenHash = hashWebSecret(token);
  const store = await readWebAuthStore();
  const now = Date.now();
  const session = store.sessions.find((item) => item.tokenHash === tokenHash && Date.parse(item.expiresAt || "") > now);

  if (!session) {
    const error = new Error("Web session expired. Tap Create Account on the web panel, or open Telegram and request a fresh /web code.");
    error.statusCode = 401;
    throw error;
  }

  session.lastUsedAt = new Date(now).toISOString();
  store.sessions = store.sessions.filter((item) => Date.parse(item.expiresAt || "") > now);
  await writeWebAuthStore(store);

  return { userId: session.userId, chatId: session.chatId, tokenHash };
}

async function authenticateOptionalWebRequest(request) {
  const token = webAuthTokenFromRequest(request);
  if (!token) return null;
  try {
    return await authenticateWebRequest(request);
  } catch {
    return null;
  }
}

async function revokeWebSession(tokenHash) {
  const store = await readWebAuthStore();
  store.sessions = store.sessions.filter((item) => item.tokenHash !== tokenHash);
  await writeWebAuthStore(store);
}

function webAuthTokenFromRequest(request) {
  const auth = request.headers.authorization || "";
  if (/^bearer\s+/i.test(auth)) return auth.replace(/^bearer\s+/i, "").trim();
  return String(request.headers["x-ogre-session"] || "").trim();
}

function normalizeWebLoginCode(value) {
  return String(value || "").replace(/[^a-f0-9]/gi, "").toUpperCase();
}

function hashWebSecret(value) {
  return crypto.createHmac("sha256", CONFIG.appSecret).update(String(value)).digest("hex");
}

function assertWebLoginAttemptAllowed(request) {
  const key = webClientKey(request);
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const record = webLoginAttemptLimits.get(key) || { count: 0, resetAt: now + windowMs };

  if (record.resetAt <= now) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }

  record.count += 1;
  webLoginAttemptLimits.set(key, record);

  if (record.count > 8) {
    const error = new Error("Too many login attempts. Wait a few minutes, then try again.");
    error.statusCode = 429;
    throw error;
  }
}

function clearWebLoginAttempts(request) {
  webLoginAttemptLimits.delete(webClientKey(request));
}

function webClientKey(request) {
  return String(request.headers["cf-connecting-ip"]
    || request.headers["x-forwarded-for"]
    || request.socket?.remoteAddress
    || "unknown").split(",")[0].trim();
}

async function sendWebLoginCode(chatId, userId, messageId = null) {
  const { code, expiresAt } = await createWebLoginCode(userId, chatId);
  const lines = [
    "Web Portal Login",
    "",
    `Code: ${code}`,
    `Expires: ${expiresAt}`,
    "",
    "Enter this one-time code on the OgreTradeBot web app. It is 64-bit random, expires in 10 minutes, and is stored only as a hash.",
    "The web app can open your dashboard and one-wallet trade desk. Private keys stay encrypted and are never shown to other users.",
    CONFIG.webPortalUrl ? `Portal: ${CONFIG.webPortalUrl}` : "Set WEB_PORTAL_URL on Render so this message can include your website link.",
    "",
    "Never give this code to anyone else."
  ];

  await sendOrEditMessage(chatId, messageId, withBrandFooter(lines.join("\n")), {
    inline_keyboard: [
      ...(CONFIG.webPortalUrl ? [[{ text: "Open Web App", url: CONFIG.webPortalUrl }]] : []),
      [{ text: "Main Menu", callback_data: "main_menu" }]
    ]
  });
}

async function webUserSummary(userId) {
  const wallets = await webWalletRows(userId);
  const profile = await webProfileForUser(userId);
  return {
    id: String(userId),
    isAdmin: isAdmin(userId),
    walletCount: wallets.length,
    email: profile.email || "",
    username: profile.username || "",
    hasPasswordLogin: Boolean(profile.passwordLogin?.hash),
    xHandle: profile.xHandle || "",
    xProfileUrl: profile.xHandle ? `https://x.com/${profile.xHandle}` : "",
    avatar: profile.avatarDataUrl || profile.avatarUrl || "",
    avatarSource: profile.avatarSource || "",
    avatarUpdatedAt: profile.avatarUpdatedAt || "",
    connectedWallet: profile.connectedWallet || null,
    referralCode: profile.referralCode || "",
    referralLink: profile.referralCode ? webReferralLink(profile.referralCode) : "",
    referralPayoutWallet: profile.referralPayoutWallet || "",
    referralStats: normalizeReferralStats(profile.referralStats),
    referredByCode: profile.referredByCode || "",
    showOnTraderBoard: Boolean(profile.showOnTraderBoard),
    traderBoardWalletMode: ["all", "manual"].includes(String(profile.traderBoardWalletMode || "")) ? profile.traderBoardWalletMode : "all",
    traderBoardWalletIndexes: Array.isArray(profile.traderBoardWalletIndexes) ? profile.traderBoardWalletIndexes : [],
    traderBoardWalletCount: Array.isArray(profile.traderBoardWalletPublicKeys) ? profile.traderBoardWalletPublicKeys.length : 0,
    tradePresetCount: Array.isArray(profile.tradePresets) ? profile.tradePresets.length : 0,
    bundlePresetCount: Array.isArray(profile.bundlePresets) ? profile.bundlePresets.length : 0,
    watchlistCount: Array.isArray(profile.watchedTokens) ? profile.watchedTokens.length : 0,
    portalUrl: CONFIG.webPortalUrl,
    telegramBotUrl: telegramBotStartUrl()
  };
}

async function webProfileForUser(userId) {
  const store = await readWebAuthStore();
  const result = ensureWebProfileDefaults(store, userId);
  if (result.changed) await writeWebAuthStore(store);
  return result.profile;
}

async function updateWebProfileEmail(userId, emailValue) {
  const email = normalizeEmail(emailValue);
  const store = await readWebAuthStore();
  const key = String(userId);
  const profile = {
    ...(store.profiles[key] || {}),
    email,
    updatedAt: new Date().toISOString()
  };
  store.profiles[key] = profile;
  await writeWebAuthStore(store);
  await audit("web_profile_email_update", { userId, hasEmail: Boolean(email) });

  let emailSent = false;
  let emailError = null;
  if (email) {
    try {
      emailSent = await sendPortalReminderEmail(email);
    } catch (error) {
      emailError = friendlyError(error);
    }
  }

  return { profile, emailSent, emailError };
}

async function updateWebProfileCredentials(userId, body = {}) {
  const username = normalizeWebUsername(body.username);
  const password = normalizeWebPassword(body.password);
  const store = await readWebAuthStore();
  const key = String(userId);
  const existing = store.profiles[key] || {};
  assertWebUsernameAvailable(store, username, key);
  const now = new Date().toISOString();
  const profile = {
    ...existing,
    username,
    usernameNormalized: username,
    passwordLogin: hashWebPassword(password),
    credentialsUpdatedAt: now,
    updatedAt: now
  };
  store.profiles[key] = profile;
  await writeWebAuthStore(store);
  await audit("web_profile_credentials_update", { userId, username });
  return { profile };
}

async function updateWebProfileAvatar(userId, body = {}) {
  const store = await readWebAuthStore();
  const key = String(userId);
  const now = new Date().toISOString();
  const existing = store.profiles[key] || {};
  let avatarDataUrl = "";
  let avatarUrl = "";
  let avatarSource = "";

  if (body.clear) {
    avatarSource = "";
  } else if (body.avatarDataUrl) {
    avatarDataUrl = normalizeWebAvatarDataUrl(body.avatarDataUrl);
    avatarSource = "upload";
  } else if (body.avatarUrl) {
    avatarUrl = normalizeWebAvatarUrl(body.avatarUrl);
    avatarSource = cleanWebAvatarSource(body.avatarSource || "url");
  } else {
    const error = new Error("Choose an image, use your X profile picture, or remove the current PFP.");
    error.statusCode = 400;
    throw error;
  }

  const profile = {
    ...existing,
    avatarDataUrl,
    avatarUrl,
    avatarSource,
    avatarUpdatedAt: now,
    updatedAt: now
  };
  store.profiles[key] = profile;
  await writeWebAuthStore(store);
  await audit("web_profile_avatar_update", { userId, avatarSource, hasAvatar: Boolean(avatarDataUrl || avatarUrl) });
  return { profile };
}

async function updateWebConnectedWallet(userId, body = {}) {
  const store = await readWebAuthStore();
  const key = String(userId);
  const now = new Date().toISOString();
  const existing = store.profiles[key] || {};
  let connectedWallet = null;

  if (!body.clear) {
    const publicKey = normalizeConnectedWalletPublicKey(body.publicKey);
    connectedWallet = {
      publicKey,
      shortPublicKey: shortMint(publicKey),
      provider: cleanConnectedWalletProvider(body.provider),
      connectedAt: now
    };
  }

  const profile = {
    ...existing,
    connectedWallet,
    updatedAt: now
  };
  store.profiles[key] = profile;
  await writeWebAuthStore(store);
  await audit("web_connected_wallet_update", {
    userId,
    provider: connectedWallet?.provider || "",
    publicKey: connectedWallet?.publicKey || "",
    connected: Boolean(connectedWallet)
  });
  return { profile };
}

async function updateWebProfileXHandle(userId, body = {}) {
  const store = await readWebAuthStore();
  const key = String(userId);
  const now = new Date().toISOString();
  const existing = store.profiles[key] || {};
  const xHandle = body.clear ? "" : normalizeWebXHandle(body.xHandle || body.handle || body.username);
  const profile = {
    ...existing,
    xHandle,
    xConnectedAt: xHandle ? now : "",
    updatedAt: now
  };
  store.profiles[key] = profile;
  await writeWebAuthStore(store);
  await audit("web_profile_x_update", { userId, xHandle, connected: Boolean(xHandle) });
  return { profile };
}

async function updateWebReferralProfile(userId, body = {}) {
  const store = await readWebAuthStore();
  const key = String(userId);
  const now = new Date().toISOString();
  const { profile: existing } = ensureWebProfileDefaults(store, userId);
  const referralPayoutWallet = body.clearPayout
    ? ""
      : String(body.referralPayoutWallet || body.wallet || "").trim()
      ? normalizeConnectedWalletPublicKey(body.referralPayoutWallet || body.wallet)
      : existing.referralPayoutWallet || "";
  const traderBoardWalletMode = ["all", "manual"].includes(String(body.traderBoardWalletMode || "").trim().toLowerCase())
    ? String(body.traderBoardWalletMode).trim().toLowerCase()
    : existing.traderBoardWalletMode || "all";
  let traderBoardWalletIndexes = Array.isArray(existing.traderBoardWalletIndexes) ? existing.traderBoardWalletIndexes : [];
  let traderBoardWalletPublicKeys = Array.isArray(existing.traderBoardWalletPublicKeys) ? existing.traderBoardWalletPublicKeys : [];
  if (body.traderBoardWalletIndexes !== undefined || body.traderBoardWalletMode !== undefined) {
    const walletStore = await readWalletStore();
    const rawIndexes = Array.isArray(body.traderBoardWalletIndexes)
      ? body.traderBoardWalletIndexes
      : String(body.traderBoardWalletIndexes || "").split(/[,\s]+/);
    traderBoardWalletIndexes = uniqueStrings(rawIndexes
      .map((value) => String(value || "").replace(/[^\d]/g, ""))
      .filter(Boolean))
      .slice(0, 50);
    const selectedWallets = traderBoardWalletIndexes
      .map((index) => {
        try {
          const walletIndex = Number.parseInt(index, 10);
          return { ...getWalletAt(walletStore, walletIndex, userId), webIndex: walletIndex };
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    traderBoardWalletIndexes = selectedWallets.map((wallet) => String(wallet.webIndex || wallet.index || ""));
    traderBoardWalletPublicKeys = uniqueStrings(selectedWallets.map((wallet) => wallet.publicKey).filter(Boolean));
    if (parseBoolean(String(body.showOnTraderBoard ?? existing.showOnTraderBoard ?? "false")) && traderBoardWalletMode === "manual" && !traderBoardWalletPublicKeys.length) {
      const error = new Error("Select at least one wallet for the trader board, or choose All SlimeWire wallets.");
      error.statusCode = 400;
      throw error;
    }
  }
  const profile = {
    ...existing,
    referralPayoutWallet,
    showOnTraderBoard: parseBoolean(String(body.showOnTraderBoard ?? existing.showOnTraderBoard ?? "false")),
    traderBoardWalletMode,
    traderBoardWalletIndexes,
    traderBoardWalletPublicKeys,
    updatedAt: now
  };
  store.profiles[key] = profile;
  await writeWebAuthStore(store);
  await audit("web_referral_profile_update", {
    userId,
    hasPayoutWallet: Boolean(referralPayoutWallet),
    showOnTraderBoard: profile.showOnTraderBoard,
    traderBoardWalletMode,
    traderBoardWalletCount: traderBoardWalletPublicKeys.length
  });
  return { profile };
}

async function webPresetRows(userId) {
  const profile = await webProfileForUser(userId);
  const defaults = defaultWebPresets();
  const hiddenIds = new Set(Array.isArray(profile.hiddenWebPresetIds) ? profile.hiddenWebPresetIds.map(String) : []);
  return {
    trade: [...defaults.trade.filter((preset) => !hiddenIds.has(preset.id)), ...cleanStoredPresets(profile.tradePresets, "trade")],
    bundle: [...defaults.bundle.filter((preset) => !hiddenIds.has(preset.id)), ...cleanStoredPresets(profile.bundlePresets, "bundle")]
  };
}

async function updateWebPreset(userId, body = {}) {
  const type = normalizeWebPresetType(body.type || body.kind);
  const store = await readWebAuthStore();
  const key = String(userId);
  const { profile: existing } = ensureWebProfileDefaults(store, userId);
  const field = type === "bundle" ? "bundlePresets" : "tradePresets";
  const current = cleanStoredPresets(existing[field], type);
  const action = String(body.action || "save").trim().toLowerCase();
  const defaultIds = new Set((defaultWebPresets()[type] || []).map((preset) => preset.id));
  let hiddenWebPresetIds = Array.isArray(existing.hiddenWebPresetIds)
    ? uniqueStrings(existing.hiddenWebPresetIds.map(String))
    : [];

  let next = current;
  if (action === "delete") {
    const id = String(body.id || "").trim();
    if (defaultIds.has(id)) {
      hiddenWebPresetIds = uniqueStrings([...hiddenWebPresetIds, id]);
    } else {
      next = current.filter((preset) => preset.id !== id);
    }
  } else {
    const rawPreset = body.preset || body;
    const rawId = String(rawPreset.id || "").trim();
    const preset = normalizeWebPreset(type, rawPreset, { keepId: Boolean(rawId && !defaultIds.has(rawId)) });
    const existingIndex = current.findIndex((item) => item.id === preset.id);
    next = existingIndex >= 0
      ? current.map((item, index) => (index === existingIndex ? preset : item))
      : [preset, ...current].slice(0, 5);
  }

  const profile = {
    ...existing,
    [field]: next,
    hiddenWebPresetIds,
    updatedAt: new Date().toISOString()
  };
  store.profiles[key] = profile;
  await writeWebAuthStore(store);
  await audit("web_preset_update", { userId, type, action, count: next.length });
  return { presets: await webPresetRows(userId) };
}

function normalizeWebPresetType(value) {
  const type = String(value || "").trim().toLowerCase();
  if (type === "bundle") return "bundle";
  if (type === "trade") return "trade";
  const error = new Error("Preset type must be trade or bundle.");
  error.statusCode = 400;
  throw error;
}

function cleanStoredPresets(value, type) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      try {
        return normalizeWebPreset(type, item, { keepId: true });
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .slice(0, 5);
}

function normalizeWebPreset(type, raw = {}, options = {}) {
  const id = options.keepId && String(raw.id || "").trim()
    ? String(raw.id).trim().slice(0, 80)
    : `${type}-${crypto.randomUUID()}`;
  const name = String(raw.name || `${type === "bundle" ? "Bundle" : "Trade"} Preset`).trim().replace(/[^\w .%-]/g, "").slice(0, 32) || "Preset";
  const amountSol = String(raw.amountSol || raw.amount || "0.1").trim();
  parsePositiveNumber(amountSol);
  const takeProfitPct = String(raw.takeProfitPct || "25").trim();
  parseTakeProfitPercent(takeProfitPct);
  const stopLossPct = String(raw.stopLossPct || "8").trim();
  parseOptionalTriggerPercent(stopLossPct);
  const sellDelay = firstString(raw.sellDelay, raw.sellDelaySeconds, "off");
  parseOptionalSellDelaySeconds(sellDelay);
  const sellPercent = String(raw.sellPercent || "100").trim();
  parsePercent(sellPercent);
  const slippageBps = String(raw.slippageBps || "400").trim();
  parseWebSlippage(slippageBps);

  const preset = {
    id,
    name,
    kind: type,
    amountSol,
    takeProfitPct,
    stopLossPct,
    sellDelay,
    sellPercent,
    slippageBps,
    updatedAt: new Date().toISOString()
  };
  if (type === "trade") {
    preset.walletIndex = String(raw.walletIndex || "1").replace(/[^\d]/g, "") || "1";
  } else {
    preset.walletIndexes = Array.isArray(raw.walletIndexes)
      ? uniqueStrings(raw.walletIndexes.map((item) => String(item).replace(/[^\d]/g, "")).filter(Boolean)).slice(0, 20)
      : [];
    preset.walletGroup = String(raw.walletGroup || "").trim().replace(/[^\w .-]/g, "").slice(0, 40);
    if (!preset.walletIndexes.length && !preset.walletGroup) {
      preset.walletIndexes = ["1", "2", "3", "4", "5", "6"];
    }
  }
  return preset;
}

async function webWatchlistRows(userId) {
  const profile = await webProfileForUser(userId);
  const watched = Array.isArray(profile.watchedTokens) ? profile.watchedTokens : [];
  const rows = [];
  await runWithConcurrency(watched.slice(0, 100), 4, async (item) => {
    const tokenMint = String(item.tokenMint || "").trim();
    if (!tokenMint) return;
    const metadata = await getDexTokenMetadata(tokenMint).catch(() => ({}));
    rows.push(webTokenWatchRow(tokenMint, metadata, item));
  });
  rows.sort((a, b) => Date.parse(b.addedAt || "") - Date.parse(a.addedAt || ""));
  return { rows, count: rows.length };
}

async function updateWebWatchlist(userId, body = {}) {
  const tokenMint = parsePublicKey(String(body.tokenMint || "")).toBase58();
  const action = String(body.action || "add").trim().toLowerCase();
  const store = await readWebAuthStore();
  const key = String(userId);
  const { profile: existing } = ensureWebProfileDefaults(store, userId);
  const current = Array.isArray(existing.watchedTokens) ? existing.watchedTokens : [];
  let next = current.filter((item) => item.tokenMint !== tokenMint);

  if (action !== "remove") {
    next.unshift({
      tokenMint,
      symbol: String(body.symbol || "").trim().slice(0, 24),
      name: String(body.name || "").trim().slice(0, 80),
      imageUrl: String(body.imageUrl || "").trim().slice(0, 500),
      addedAt: new Date().toISOString()
    });
    next = next.slice(0, 100);
  }

  const profile = {
    ...existing,
    watchedTokens: next,
    updatedAt: new Date().toISOString()
  };
  store.profiles[key] = profile;
  await writeWebAuthStore(store);
  await audit("web_watchlist_update", { userId, action, tokenMint, count: next.length });
  return { watchlist: await webWatchlistRows(userId) };
}

function webTokenWatchRow(tokenMint, metadata = {}, saved = {}) {
  const row = webSniperRow({
    tokenMint,
    symbol: metadata.symbol || saved.symbol || shortMint(tokenMint),
    name: metadata.name || saved.name || "Watched Token",
    imageUrl: metadata.imageUrl || saved.imageUrl || "",
    websiteUrl: metadata.websiteUrl || saved.websiteUrl || "",
    twitterUrl: metadata.twitterUrl || saved.twitterUrl || "",
    telegramUrl: metadata.telegramUrl || saved.telegramUrl || "",
    marketCap: metadata.marketCap || 0,
    liquidityUsd: metadata.liquidityUsd || 0,
    volume5m: metadata.volume?.m5 || 0,
    volumeH1: metadata.volume?.h1 || 0,
    pairCreatedAt: metadata.pairCreatedAt || null,
    score: 0,
    category: "Watchlist",
    rugRisk: "check",
    exitRisk: "check",
    manipulationScore: "check",
    momentum: "Watching",
    smartMoney: "Watchlist",
    scalpSetup: "Saved watch",
    riskFlags: [],
    reasons: []
  });
  return {
    ...row,
    addedAt: saved.addedAt || "",
    watched: true
  };
}

async function webSlimewireTraders() {
  const [authStore, tradeHistory] = await Promise.all([readWebAuthStore(), readTradeHistory()]);
  const totals = new Map();
  for (const trade of tradeHistory.trades || []) {
    const userId = String(trade.userId || "");
    if (!userId) continue;
    const profile = authStore.profiles?.[userId];
    if (!profile?.showOnTraderBoard) continue;
    if (profile.traderBoardWalletMode === "manual") {
      const selectedPublicKeys = new Set((Array.isArray(profile.traderBoardWalletPublicKeys) ? profile.traderBoardWalletPublicKeys : []).map(String));
      if (!selectedPublicKeys.size || !selectedPublicKeys.has(String(trade.walletPublicKey || ""))) continue;
    }
    const current = totals.get(userId) || {
      userId,
      tradeCount: 0,
      buys: 0,
      sells: 0,
      spent: 0n,
      received: 0n,
      lastTradeAt: ""
    };
    current.tradeCount += 1;
    if (String(trade.type).includes("buy")) current.buys += 1;
    if (String(trade.type).includes("sell")) current.sells += 1;
    current.spent += BigInt(trade.solLamportsSpent || 0);
    current.received += BigInt(trade.solLamportsReceived || 0);
    if (!current.lastTradeAt || Date.parse(trade.timestamp || "") > Date.parse(current.lastTradeAt)) {
      current.lastTradeAt = trade.timestamp || "";
    }
    totals.set(userId, current);
  }

  return [...totals.values()]
    .map((row) => {
      const profile = authStore.profiles[row.userId] || {};
      const realized = row.received - row.spent;
      const name = profile.username || profile.xHandle || shortMint(row.userId);
      return {
        userId: row.userId,
        name,
        username: profile.username || "",
        twitter: profile.xHandle || "",
        avatar: profile.avatarDataUrl || profile.avatarUrl || "",
        wallet: profile.connectedWallet?.publicKey || "",
        shortWallet: profile.connectedWallet?.shortPublicKey || "",
        referralCode: profile.referralCode || "",
        referralLink: profile.referralCode ? webReferralLink(profile.referralCode) : "",
        trackedWalletMode: profile.traderBoardWalletMode || "all",
        trackedWalletCount: profile.traderBoardWalletMode === "manual"
          ? (Array.isArray(profile.traderBoardWalletPublicKeys) ? profile.traderBoardWalletPublicKeys.length : 0)
          : "all",
        realizedLamports: realized.toString(),
        realizedLabel: `${realized >= 0n ? "+" : "-"}${lamportsBigToSol(realized >= 0n ? realized : -realized)} SOL`,
        roiLabel: row.spent > 0n ? `${Number((realized * 10000n) / row.spent / 100n)}%` : "n/a",
        winRateLabel: row.sells > 0 ? `${row.sells} closed` : "building",
        trades: row.tradeCount,
        buys: row.buys,
        sells: row.sells,
        lastTradeAt: row.lastTradeAt,
        source: "slimewire"
      };
    })
    .sort((a, b) => Number(BigInt(b.realizedLamports || 0n) - BigInt(a.realizedLamports || 0n)) || Number(b.trades || 0) - Number(a.trades || 0))
    .slice(0, 25);
}

function normalizeWebXHandle(value) {
  const handle = String(value || "")
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\//i, "")
    .split(/[/?#]/)[0]
    .replace(/[^a-z0-9_]/gi, "")
    .slice(0, 15);

  if (!/^[a-z0-9_]{1,15}$/i.test(handle)) {
    const error = new Error("Enter a valid X handle, like @yourname.");
    error.statusCode = 400;
    throw error;
  }

  return handle;
}

function normalizeConnectedWalletPublicKey(value) {
  try {
    return new PublicKey(String(value || "").trim()).toBase58();
  } catch {
    const error = new Error("Connected wallet address is not a valid Solana public key.");
    error.statusCode = 400;
    throw error;
  }
}

function cleanConnectedWalletProvider(value) {
  const provider = String(value || "Solana Wallet").trim().replace(/[^a-z0-9 _.-]/gi, "").slice(0, 40);
  return provider || "Solana Wallet";
}

function normalizeWebAvatarDataUrl(value) {
  const text = String(value || "").trim();
  const match = text.match(/^data:image\/(png|jpe?g|webp);base64,([a-z0-9+/=]+)$/i);
  if (!match) {
    const error = new Error("Avatar must be a PNG, JPG, or WebP image.");
    error.statusCode = 400;
    throw error;
  }

  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > WEB_AVATAR_MAX_BYTES) {
    const error = new Error("Avatar is too large after compression. Use a smaller image.");
    error.statusCode = 400;
    throw error;
  }

  return text;
}

function normalizeWebAvatarUrl(value) {
  const text = String(value || "").trim();
  if (text.length > 500) {
    const error = new Error("Avatar URL is too long.");
    error.statusCode = 400;
    throw error;
  }

  try {
    const url = new URL(text);
    if (url.protocol !== "https:") throw new Error("bad protocol");
    return url.toString();
  } catch {
    const error = new Error("Avatar URL must be a valid https image/profile URL.");
    error.statusCode = 400;
    throw error;
  }
}

function cleanWebAvatarSource(value) {
  const source = String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 24);
  return source || "url";
}

async function sendEmailWebLoginCode(emailValue) {
  const email = normalizeEmail(emailValue);
  if (!email) {
    const error = new Error("Enter the email saved on your web account.");
    error.statusCode = 400;
    throw error;
  }
  if (!CONFIG.resendApiKey || !CONFIG.emailFrom) {
    const error = new Error("Email login is not configured yet. Use Create Web Account or Telegram /web code.");
    error.statusCode = 400;
    throw error;
  }

  const store = await readWebAuthStore();
  const entry = Object.entries(store.profiles).find(([, profile]) => String(profile.email || "").toLowerCase() === email);
  if (!entry) {
    const error = new Error("No web account found for that email.");
    error.statusCode = 404;
    throw error;
  }

  const [userId] = entry;
  const result = addWebLoginCodeToStore(store, userId, userId);
  await writeWebAuthStore(store);
  await sendWebLoginCodeEmail(email, result.code, result.expiresAt);
  await audit("web_email_login_code_sent", { userId, emailHash: hashWebSecret(email), expiresAt: result.expiresAt });
  return { expiresAt: result.expiresAt, emailSent: true };
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!email) return "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error("Enter a valid email address, or leave it blank.");
    error.statusCode = 400;
    throw error;
  }
  return email;
}

async function sendPortalReminderEmail(email) {
  if (!CONFIG.resendApiKey || !CONFIG.emailFrom) {
    return false;
  }

  const portalUrl = CONFIG.webPortalUrl || "your OgreTrade web portal";
  const botUrl = telegramBotStartUrl() || "your Telegram bot";
  await sendEmailViaResend(email, "Your OgreTrade portal login reminder", [
    "OgreTrade portal reminder",
    "",
    `Portal: ${portalUrl}`,
    `Telegram bot: ${botUrl}`,
    "",
    "To log in later, use the website's Email Login Code button or open the Telegram bot and send /web.",
    "For security, this email does not include wallet private keys, backup files, or a permanent login token."
  ].join("\n"));
  return true;
}

async function sendWebLoginCodeEmail(email, code, expiresAt) {
  await sendEmailViaResend(email, "Your OgreTrade web login code", [
    "OgreTrade web login code",
    "",
    `Code: ${code}`,
    `Expires: ${expiresAt}`,
    "",
    "Paste this one-time code into the OgreTrade web portal.",
    "For security, this email does not include wallet private keys, backup files, or a permanent login token."
  ].join("\n"));
}

async function sendEmailViaResend(email, subject, text) {
  await fetchJson("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CONFIG.resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: CONFIG.emailFrom,
      to: email,
      subject,
      text
    }),
    timeoutMs: 8_000
  });
}

async function webWalletRows(userId) {
  const store = await readWalletStore();
  return walletsForOwner(store, userId).map((wallet, index) => ({
    index: index + 1,
    label: wallet.label,
    publicKey: wallet.publicKey,
    shortPublicKey: shortMint(wallet.publicKey)
  }));
}

async function createWebWalletSet(userId, body = {}) {
  const label = cleanLabel(String(body.label || "Ogre Web"));
  const count = Number.parseInt(body.count || "1", 10);
  if (!Number.isInteger(count) || count < 1 || count > 20) {
    const error = new Error("Wallet count must be from 1 to 20.");
    error.statusCode = 400;
    throw error;
  }

  const store = await readWalletStore();
  const createdRecords = [];
  for (let index = 1; index <= count; index += 1) {
    const keypair = Keypair.generate();
    const walletLabel = count === 1 ? label : `${label} ${index}`;
    const record = walletRecord(walletLabel, keypair, userId);
    store.wallets.push(record);
    createdRecords.push(record);
  }

  await writeWalletStore(store);
  await audit("web_create_wallet_set", {
    userId,
    label,
    count,
    publicKeys: createdRecords.map((wallet) => wallet.publicKey)
  });

  const encryptedBackup = buildWalletBackupDocument(
    userId,
    "Automatic web backup after wallet creation.",
    label,
    createdRecords
  );
  const recoveryKeys = buildPrivateKeyDocument(
    userId,
    createdRecords,
    `solflare-recovery-${sanitizeFilenamePart(label)}-${userId}`,
    {
      title: "SOLFLARE / PHANTOM RECOVERY KEY FILE",
      note: "Automatic web recovery file after wallet creation."
    }
  );

  return {
    wallets: createdRecords.map((wallet, index) => ({
      index: index + 1,
      label: wallet.label,
      publicKey: wallet.publicKey,
      shortPublicKey: shortMint(wallet.publicKey)
    })),
    downloads: {
      encryptedBackup: {
        filename: encryptedBackup.filename,
        text: encryptedBackup.text
      },
      recoveryKeys: {
        filename: recoveryKeys.filename,
        text: recoveryKeys.text
      }
    }
  };
}

async function restoreWebWalletBackup(userId, body = {}) {
  const text = String(body.backupText || body.text || "").trim();
  if (!text) {
    const error = new Error("Choose a backup file or paste backup text first.");
    error.statusCode = 400;
    throw error;
  }

  const backup = parseBackupPayload(text);
  const backupWallets = backupWalletList(backup);
  const store = await readWalletStore();
  const existing = new Set(walletsForOwner(store, userId).map((wallet) => wallet.publicKey));
  const restoredRecords = [];
  const skippedExisting = [];
  const errors = [];
  let skipped = 0;

  for (const [index, wallet] of backupWallets.entries()) {
    let record;
    try {
      record = walletRecordFromBackup(wallet, userId, index);
    } catch (error) {
      skipped += 1;
      errors.push(`Wallet ${index + 1}: ${friendlyBackupError(error)}`);
      continue;
    }

    if (existing.has(record.publicKey)) {
      skipped += 1;
      skippedExisting.push(`${record.label}: ${record.publicKey}`);
      continue;
    }

    store.wallets.push(record);
    existing.add(record.publicKey);
    restoredRecords.push(record);
  }

  if (restoredRecords.length === 0 && errors.length > 0) {
    throw new Error(`Backup parsed but no wallets could be restored. ${errors.slice(0, 3).join(" ")}`);
  }

  await writeWalletStore(store);
  await audit("web_restore_wallet_backup", {
    userId,
    backupId: backup?.backupId || backup?.id || "",
    groupLabel: backup?.groupLabel || "",
    restored: restoredRecords.length,
    skipped,
    errors: errors.slice(0, 5)
  });

  const downloads = restoredRecords.length > 0
    ? webBackupDownloadsForWallets(
      userId,
      restoredRecords,
      backup?.groupLabel || "restored-wallets",
      "Automatic web backup after wallet restore."
    )
    : null;

  return {
    restoredCount: restoredRecords.length,
    skippedCount: skipped,
    skippedExisting: skippedExisting.slice(0, 25),
    errors: errors.slice(0, 10),
    downloads,
    wallets: restoredRecords.map((wallet, index) => ({
      index: index + 1,
      label: wallet.label,
      publicKey: wallet.publicKey,
      shortPublicKey: shortMint(wallet.publicKey)
    })),
    message: `Restore complete: ${restoredRecords.length} wallet(s) restored, ${skipped} skipped.`
  };
}

async function exportWebWalletBackup(userId) {
  const store = await readWalletStore();
  const wallets = walletsForOwner(store, userId);
  if (wallets.length === 0) {
    const error = new Error("No wallets found in this web account yet.");
    error.statusCode = 400;
    throw error;
  }

  await audit("web_export_wallet_backup", {
    userId,
    walletCount: wallets.length
  });

  return {
    walletCount: wallets.length,
    downloads: webBackupDownloadsForWallets(
      userId,
      wallets,
      "current-web-wallets",
      "Manual web backup export for all wallets currently loaded in this account."
    ),
    message: `Backup ready: ${wallets.length} wallet(s) exported.`
  };
}

async function importWebWallet(userId, body = {}) {
  const label = cleanLabel(String(body.label || "Imported Wallet"));
  const secret = String(body.secret || body.privateKey || "").trim();
  if (!secret) {
    const error = new Error("Paste a private key or JSON secret-key array first.");
    error.statusCode = 400;
    throw error;
  }

  const keypair = keypairFromSecret(secret);
  const publicKey = keypair.publicKey.toBase58();
  const store = await readWalletStore();
  const existing = walletsForOwner(store, userId).find((wallet) => wallet.publicKey === publicKey);
  if (existing) {
    const error = new Error(`That wallet is already imported as ${existing.label}.`);
    error.statusCode = 409;
    throw error;
  }

  const record = walletRecord(label, keypair, userId);
  store.wallets.push(record);
  await writeWalletStore(store);
  await audit("web_import_wallet", {
    userId,
    label,
    publicKey
  });

  return {
    label: record.label,
    publicKey,
    shortPublicKey: shortMint(publicKey),
    downloads: webBackupDownloadsForWallets(
      userId,
      [record],
      label,
      "Automatic web backup after wallet import."
    ),
    message: `Imported ${record.label}: ${publicKey}`
  };
}

async function removeWebWallets(userId, body = {}) {
  const rawIndexes = Array.isArray(body.walletIndexes)
    ? body.walletIndexes
    : String(body.walletIndex || body.index || "")
      .split(/[,\s]+/)
      .filter(Boolean);
  const indexes = uniqueStrings(rawIndexes.map((item) => String(item).replace(/[^\d]/g, "")).filter(Boolean));
  if (!indexes.length) {
    const error = new Error("Choose at least one wallet to remove.");
    error.statusCode = 400;
    throw error;
  }

  const store = await readWalletStore();
  const owned = walletsForOwner(store, userId);
  const selected = indexes.map((index) => {
    const wallet = owned[Number.parseInt(index, 10) - 1];
    if (!wallet) {
      const error = new Error(`Wallet ${index} does not exist.`);
      error.statusCode = 400;
      throw error;
    }
    return wallet;
  });
  const selectedPublicKeys = new Set(selected.map((wallet) => wallet.publicKey));
  const downloads = webBackupDownloadsForWallets(
    userId,
    selected,
    "removed-web-wallets",
    "Automatic web backup before wallet removal."
  );

  const before = store.wallets.length;
  store.wallets = store.wallets.filter((wallet) => {
    return !(String(wallet.ownerId) === String(userId) && selectedPublicKeys.has(wallet.publicKey));
  });
  const removedCount = before - store.wallets.length;
  await writeWalletStore(store);
  await audit("web_remove_wallets", {
    userId,
    removedCount,
    wallets: selected.map(publicWallet)
  });

  return {
    removedCount,
    downloads,
    wallets: await webWalletRows(userId),
    message: `Removed ${removedCount} wallet record(s). Backup downloads started first. No SOL or tokens were moved.`
  };
}

function webBackupDownloadsForWallets(userId, wallets, groupLabel, note) {
  if (!Array.isArray(wallets) || wallets.length === 0) return null;
  const encryptedBackup = buildWalletBackupDocument(userId, note, groupLabel, wallets);
  const recoveryKeys = buildPrivateKeyDocument(
    userId,
    wallets,
    `solflare-recovery-${sanitizeFilenamePart(groupLabel)}-${userId}`,
    {
      title: "SOLFLARE / PHANTOM RECOVERY KEY FILE",
      note
    }
  );

  return {
    encryptedBackup: {
      filename: encryptedBackup.filename,
      text: encryptedBackup.text
    },
    recoveryKeys: {
      filename: recoveryKeys.filename,
      text: recoveryKeys.text
    }
  };
}

function webAutoExitRequested(body = {}) {
  if (cleanLaunchBoolean(body.autoExit)) return true;

  const hasExitFields = body.takeProfitPct !== undefined
    || body.stopLossPct !== undefined
    || body.sellDelay !== undefined
    || body.sellDelaySeconds !== undefined;
  if (!hasExitFields) return false;

  const takeProfitPct = parseTakeProfitPercent(String(body.takeProfitPct || "0"));
  const stopLossPct = parseOptionalTriggerPercent(String(body.stopLossPct || "0"));
  const sellDelaySeconds = parseOptionalSellDelaySeconds(firstString(body.sellDelay, body.sellDelaySeconds, "off"));
  return Boolean(takeProfitPct || stopLossPct || sellDelaySeconds > 0);
}

async function webTradeBuy(userId, body = {}) {
  const store = await readWalletStore();
  const wallet = getWalletAt(store, parseWebWalletIndex(body.walletIndex), userId);
  const tokenMint = parsePublicKey(String(body.tokenMint || "")).toBase58();
  const slippageBps = parseWebSlippage(body.slippageBps);
  const amountLamports = await webBuyAmountLamports(wallet, body);
  const result = await buyTokenForPlan(wallet, tokenMint, amountLamports, slippageBps, { trackTokenDelta: true, userId });
  const tokenAmount = result.tokenDeltaAmount || result.outputAmount || null;

  await recordTradeEvents([{
    userId,
    type: "buy",
    source: "web_trade",
    tokenMint,
    walletLabel: wallet.label,
    walletPublicKey: wallet.publicKey,
    solLamportsSpent: String(result.amountLamports),
    tokenAmount,
    signature: result.signature
  }]);
  await audit("web_trade_buy", {
    userId,
    tokenMint,
    wallet: publicWallet(wallet),
    amountMode: String(body.amountMode || "").toLowerCase() === "max" ? "max" : "fixed",
    amountSol: lamportsToSol(result.amountLamports),
    slippageBps,
    signature: result.signature
  });

  const autoExitPlan = webAutoExitRequested(body)
    ? await webCreateSingleTradeAutoExitPlan(userId, wallet, tokenMint, result, body, slippageBps)
    : null;
  const baseMessage = `${wallet.label} bought ${shortMint(tokenMint)} with ${lamportsToSol(result.amountLamports)} SOL.`;

  return {
    type: "buy",
    tokenMint,
    shortMint: shortMint(tokenMint),
    walletLabel: wallet.label,
    walletPublicKey: wallet.publicKey,
    spentSol: lamportsToSol(result.amountLamports),
    netSwapSol: lamportsToSol(result.swapLamports),
    feeSol: lamportsToSol(result.feeLamports),
    tokenAmount,
    signature: result.signature,
    attempts: result.attempts,
    dexUrl: dexScreenerUrl(tokenMint),
    autoExitPlan,
    message: autoExitPlan ? `${baseMessage} ${autoExitPlan.shortMessage}` : baseMessage
  };
}

async function webTradeSell(userId, body = {}) {
  const store = await readWalletStore();
  const wallet = getWalletAt(store, parseWebWalletIndex(body.walletIndex), userId);
  const tokenMint = parsePublicKey(String(body.tokenMint || "")).toBase58();
  const percent = parsePercent(String(body.percent || "100"));
  const slippageBps = parseWebSlippage(body.slippageBps);
  const result = await sellTokenFromWallet(wallet, tokenMint, percent, slippageBps, { userId });
  const outputLamports = BigInt(result.outputLamports || 0);
  const feeLamports = BigInt(result.feeLamports || 0);
  const netLamports = outputLamports > feeLamports ? outputLamports - feeLamports : 0n;

  await recordTradeEvents([{
    userId,
    type: "sell",
    source: "web_trade",
    tokenMint,
    walletLabel: wallet.label,
    walletPublicKey: wallet.publicKey,
    tokenAmount: result.tokenAmount,
    solLamportsReceived: result.outputLamports,
    signature: result.signature
  }]);
  await audit("web_trade_sell", {
    userId,
    tokenMint,
    wallet: publicWallet(wallet),
    percent,
    slippageBps,
    signature: result.signature
  });

  return {
    type: "sell",
    tokenMint,
    shortMint: shortMint(tokenMint),
    walletLabel: wallet.label,
    walletPublicKey: wallet.publicKey,
    percent,
    tokenAmount: result.tokenAmount,
    grossSol: lamportsBigToSol(outputLamports),
    feeSol: lamportsBigToSol(feeLamports),
    netSol: lamportsBigToSol(netLamports),
    signature: result.signature,
    attempts: result.attempts,
    dexUrl: dexScreenerUrl(tokenMint),
    message: `${wallet.label} sold ${percent}% of ${shortMint(tokenMint)} for ${lamportsBigToSol(netLamports)} SOL after fee.`
  };
}

async function webCreateSingleTradeAutoExitPlan(userId, wallet, tokenMint, buyResult, body = {}, slippageBps = CONFIG.defaultSlippageBps) {
  const takeProfitPct = parseTakeProfitPercent(String(body.takeProfitPct || "0"));
  const stopLossPct = parseOptionalTriggerPercent(String(body.stopLossPct || "0"));
  const sellDelaySeconds = parseOptionalSellDelaySeconds(firstString(body.sellDelay, body.sellDelaySeconds, "off"));
  const sellPercent = parsePercent(String(body.sellPercent || "100"));
  const triggerSellPercent = (takeProfitPct || stopLossPct) ? 100 : sellPercent;

  if (!takeProfitPct && !stopLossPct && sellDelaySeconds <= 0) {
    return null;
  }

  const now = Date.now();
  const sellAfterAt = planSellAfterAtFromNow({ sellDelaySeconds }, now);
  const amountLamports = positiveRawString(buyResult.amountLamports) || "0";
  const basisLamports = positiveRawString(buyResult.swapLamports) || amountLamports;
  const feeLamports = positiveRawString(buyResult.feeLamports) || "0";
  const tokenAmount = positiveRawString(buyResult.tokenDeltaAmount) || positiveRawString(buyResult.outputAmount);
  const walletIndex = parseWebWalletIndex(body.walletIndex || "1");
  const planWallet = {
    label: wallet.label,
    publicKey: wallet.publicKey,
    walletIndex,
    basisLamports,
    grossLamports: amountLamports,
    feeLamports,
    tokenOutAmount: tokenAmount,
    buySignature: buyResult.signature,
    currentLoop: 1,
    completedLoops: 0,
    takeProfitPct,
    stopLossPct,
    completedTakeProfitLevels: [],
    sellAfterAt,
    triggerSellPercent,
    exitStatus: "watching",
    status: "watching",
    lastCheckedAt: null,
    lastMovePct: null,
    armedAt: new Date(now).toISOString(),
    triggerStatus: takeProfitPct || stopLossPct ? "armed" : "timer-only",
    lastError: tokenAmount ? null : "Waiting for token account indexing before TP/SL checks."
  };
  const plan = {
    id: crypto.randomUUID(),
    status: "watching",
    userId,
    chatId: null,
    tokenMint,
    source: "web_trade_auto_exit",
    walletSelector: String(walletIndex),
    amountSol: lamportsBigToSol(amountLamports),
    sellDelayMinutes: sellDelaySeconds / 60,
    sellDelaySeconds,
    sellAfterAt,
    sellPercent,
    triggerSellPercent,
    loopCount: 1,
    loopDelaySeconds: 0,
    takeProfitPct,
    stopLossPct,
    takeProfitMode: "single",
    stopLossMode: "single",
    takeProfitLadder: [],
    autoBundle: false,
    slippageBps,
    createdAt: new Date().toISOString(),
    wallets: [planWallet],
    results: [`${wallet.label}: auto-exit armed after quick buy`]
  };

  const plans = await readTradePlans();
  plans.plans.push(plan);
  await writeTradePlans(plans);
  await audit("web_trade_auto_exit_plan", {
    userId,
    planId: plan.id,
    tokenMint,
    wallet: publicWallet(wallet),
    sellDelaySeconds,
    sellPercent,
    triggerSellPercent,
    takeProfitPct,
    stopLossPct,
    slippageBps,
    buySignature: buyResult.signature
  });

  scheduleTradePlanProcessing("single trade auto-exit", [500, 1200, 2500, 5000, 8000, 12000, 20000, 30000]);

  const timerSummary = sellDelaySeconds > 0 ? formatDelay(sellDelaySeconds) : "timer off";
  return {
    id: plan.id,
    tokenMint,
    shortMint: shortMint(tokenMint),
    walletLabel: wallet.label,
    walletCount: 1,
    successCount: 1,
    failedCount: 0,
    amountSol: lamportsBigToSol(amountLamports),
    sellAfterAt,
    sellDelaySeconds,
    sellPercent,
    triggerSellPercent,
    takeProfitPct,
    stopLossPct,
    takeProfitSummary: formatPlanTakeProfitSummary(plan),
    stopLossSummary: formatPlanStopLossSummary(plan),
    loopCount: 1,
    loopDelaySeconds: 0,
    slippageBps,
    source: "web_trade_auto_exit",
    results: [{ ok: true, message: `${wallet.label}: auto-exit armed` }],
    dexUrl: dexScreenerUrl(tokenMint),
    shortMessage: `Auto-exit armed: TP ${formatPlanTakeProfitSummary(plan)}, SL ${formatPlanStopLossSummary(plan)}, ${timerSummary}.`,
    message: `Single trade auto-exit armed for ${wallet.label}: TP ${formatPlanTakeProfitSummary(plan)}, SL ${formatPlanStopLossSummary(plan)}, ${timerSummary}.`
  };
}

async function webCreateTradePlan(userId, body = {}) {
  const store = await readWalletStore();
  const wallets = Array.isArray(body.walletIndexes) || String(body.walletGroup || "").trim()
    ? webSelectedWallets(store, userId, body.walletIndexes, body.walletGroup)
    : [getWalletAt(store, parseWebWalletIndex(body.walletIndex || "1"), userId)];
  return webCreateManagedBuyPlan(userId, wallets, body, {
    source: "web_trade_plan",
    label: "Managed trade",
    auditType: "web_create_trade_plan",
    defaultSellDelay: "5",
    defaultTakeProfitPct: "25",
    defaultStopLossPct: "8",
    defaultSlippageBps: 400
  });
}

async function webCreateManagedBuyPlan(userId, wallets, body = {}, options = {}) {
  const tokenMint = parsePublicKey(String(body.tokenMint || "")).toBase58();
  const amountSol = parsePositiveNumber(String(body.amountSol || ""));
  const amountLamports = solToLamports(amountSol);
  const sellDelaySeconds = parseOptionalSellDelaySeconds(firstString(body.sellDelay, body.sellDelaySeconds, options.defaultSellDelay, "5"));
  const sellPercent = parsePercent(String(body.sellPercent || "100"));
  const takeProfitPct = parseTakeProfitPercent(String(body.takeProfitPct || options.defaultTakeProfitPct || "25"));
  const stopLossPct = parseOptionalTriggerPercent(String(body.stopLossPct || options.defaultStopLossPct || "8"));
  const loopCount = parseLoopCount(String(body.loopCount || "1"));
  const loopDelaySeconds = parseLoopDelaySeconds(String(body.loopDelay || body.loopDelaySeconds || "0"));
  const slippageBps = parseWebSlippage(body.slippageBps || options.defaultSlippageBps);
  const source = options.source || "web_volume";
  const label = options.label || "Plan";
  const results = [];
  const tradeEvents = [];
  const planWallets = [];
  const walletIndexes = wallets.map((wallet, index) => Number(wallet.webIndex || index + 1));
  const walletTakeProfitTargets = parseWebWalletTakeProfitTargets(body, walletIndexes);
  const walletStopLossTargets = parseWebWalletStopLossTargets(body, walletIndexes);
  ensureTimedPlanHasExit({
    sellDelaySeconds,
    takeProfitPct,
    stopLossPct,
    walletTakeProfitTargets,
    walletStopLossTargets
  });

  const now = Date.now();
  const sellAfterAt = planSellAfterAtFromNow({ sellDelaySeconds }, now);
  await runWithConcurrency(wallets, CONFIG.bundleConcurrency, async (wallet) => {
    const walletIndex = Number(wallet.webIndex || wallets.indexOf(wallet) + 1);
    try {
      const result = await buyTokenForPlan(wallet, tokenMint, amountLamports, slippageBps, { trackTokenDelta: true, userId });
      const tokenAmount = result.tokenDeltaAmount || result.outputAmount || null;
      tradeEvents.push({
        userId,
        type: "buy",
        source,
        tokenMint,
        walletLabel: wallet.label,
        walletPublicKey: wallet.publicKey,
        solLamportsSpent: String(amountLamports),
        tokenAmount,
        signature: result.signature
      });
      planWallets.push({
        label: wallet.label,
        publicKey: wallet.publicKey,
        walletIndex,
        basisLamports: Number(result.swapLamports || amountLamports),
        grossLamports: amountLamports,
        feeLamports: result.feeLamports,
        tokenOutAmount: tokenAmount,
        buySignature: result.signature,
        currentLoop: 1,
        completedLoops: 0,
        takeProfitPct: walletTakeProfitTargets ? walletTakeProfitTargets[String(walletIndex)] || null : null,
        stopLossPct: walletStopLossTargets ? walletStopLossTargets[String(walletIndex)] || null : null,
        completedTakeProfitLevels: [],
        triggerSellPercent: 100,
        triggerStatus: takeProfitPct || stopLossPct || walletTakeProfitTargets || walletStopLossTargets ? "armed" : "timer-only",
        exitStatus: "watching",
        armedAt: new Date(now).toISOString(),
        sellAfterAt,
        status: "watching",
        lastCheckedAt: null,
        lastMovePct: null,
        lastError: tokenAmount ? null : "Waiting for token account indexing before TP/SL checks."
      });
      results.push({
        ok: true,
        walletLabel: wallet.label,
        walletPublicKey: wallet.publicKey,
        signature: result.signature,
        message: formatBuySuccessLine(wallet, result.amountLamports, result.feeLamports, result.swapLamports, result, result.feeStatus)
      });
    } catch (error) {
      results.push({
        ok: false,
        walletLabel: wallet.label,
        walletPublicKey: wallet.publicKey,
        message: `${wallet.label}: buy failed - ${friendlyError(error)}`
      });
    }
  });

  if (planWallets.length === 0) {
    throw new Error(`${label} was not created because no buys succeeded.\n\n${results.map((row) => row.message).join("\n")}`);
  }

  await recordTradeEvents(tradeEvents);

  const plan = {
    id: crypto.randomUUID(),
    status: "watching",
    userId,
    chatId: null,
    tokenMint,
    source,
    walletSelector: String(body.walletGroup || "").trim()
      ? `group:${String(body.walletGroup).trim()}`
      : Array.isArray(body.walletIndexes)
      ? body.walletIndexes.join(",")
      : String(body.walletIndex || planWallets.length),
    amountSol,
    sellDelayMinutes: sellDelaySeconds / 60,
    sellDelaySeconds,
    sellAfterAt,
    sellPercent,
    triggerSellPercent: 100,
    loopCount,
    loopDelaySeconds,
    takeProfitPct,
    stopLossPct,
    takeProfitMode: walletTakeProfitTargets ? "wallets" : "single",
    stopLossMode: walletStopLossTargets ? "wallets" : "single",
    takeProfitLadder: [],
    autoBundle: false,
    slippageBps,
    createdAt: new Date().toISOString(),
    wallets: planWallets,
    results: results.map((row) => row.message)
  };

  const plans = await readTradePlans();
  plans.plans.push(plan);
  await writeTradePlans(plans);
  await audit(options.auditType || "web_create_managed_plan", {
    userId,
    planId: plan.id,
    tokenMint,
    wallets: planWallets.map((wallet) => wallet.publicKey),
    walletCount: wallets.length,
    successCount: planWallets.length,
    amountSol,
    sellDelaySeconds,
    sellPercent,
    takeProfitPct,
    stopLossPct,
    walletTakeProfitTargets,
    walletStopLossTargets,
    loopCount,
    loopDelaySeconds,
    source,
    slippageBps
  });

  scheduleTradePlanProcessing(`${label} auto-exit`, [500, 1200, 2500, 5000, 8000, 12000, 20000, 30000]);

  return {
    id: plan.id,
    tokenMint,
    shortMint: shortMint(tokenMint),
    walletLabel: planWallets.length === 1 ? planWallets[0].label : `${planWallets.length}/${wallets.length} wallets`,
    walletCount: wallets.length,
    successCount: planWallets.length,
    failedCount: Math.max(0, wallets.length - planWallets.length),
    amountSol: lamportsToSol(amountLamports),
    sellAfterAt: plan.sellAfterAt,
    sellDelaySeconds,
    sellPercent,
    takeProfitPct,
    stopLossPct,
    takeProfitSummary: formatPlanTakeProfitSummary(plan),
    stopLossSummary: formatPlanStopLossSummary(plan),
    loopCount,
    loopDelaySeconds,
    slippageBps,
    source,
    results,
    dexUrl: dexScreenerUrl(tokenMint),
    message: `${label} armed: ${planWallets.length}/${wallets.length} wallet(s) bought ${shortMint(tokenMint)}. Watching TP ${formatPlanTakeProfitSummary(plan)}, SL ${formatPlanStopLossSummary(plan)}${sellDelaySeconds > 0 ? `, timer ${formatSellTimerSummary(sellDelaySeconds)}` : ""}.`
  };
}

async function webCreateVolumePlan(userId, body = {}) {
  const store = await readWalletStore();
  const wallets = Array.isArray(body.walletIndexes) || String(body.walletGroup || "").trim()
    ? webSelectedWallets(store, userId, body.walletIndexes, body.walletGroup)
    : [getWalletAt(store, parseWebWalletIndex(body.walletIndex), userId)];
  return webCreateManagedBuyPlan(userId, wallets, body, {
    source: "web_volume",
    label: "Volume plan",
    auditType: "web_create_volume_plan",
    defaultSellDelay: "5",
    defaultTakeProfitPct: "25",
    defaultStopLossPct: "8",
    defaultSlippageBps: 400
  });
}

async function webCreateBundlePlan(userId, body = {}) {
  const store = await readWalletStore();
  const wallets = webSelectedWallets(store, userId, body.walletIndexes, body.walletGroup);
  return webCreateManagedBuyPlan(userId, wallets, body, {
    source: "web_bundle_plan",
    label: "Bundle auto-exit plan",
    auditType: "web_create_bundle_exit_plan",
    defaultSellDelay: "5",
    defaultTakeProfitPct: "60",
    defaultStopLossPct: "10",
    defaultSlippageBps: 400
  });
}

async function webCreateSniperEntry(userId, body = {}) {
  const store = await readWalletStore();
  const wallets = webSelectedWallets(store, userId, body.walletIndexes, body.walletGroup);
  const mode = normalizeSniperMode(body.mode || "safe");
  const isPump = mode === "pumpsnipe";
  return webCreateManagedBuyPlan(userId, wallets, { ...body, mode }, {
    source: isPump ? "pumpsnipe" : "autosnipe",
    label: isPump ? "PumpSnipe plan" : "Sniper plan",
    auditType: "web_create_sniper_plan",
    defaultSellDelay: isPump ? "3" : "5",
    defaultTakeProfitPct: isPump ? "40" : "25",
    defaultStopLossPct: "8",
    defaultSlippageBps: isPump ? 300 : 400
  });
}

async function webBundleBuy(userId, body = {}) {
  const store = await readWalletStore();
  const wallets = webSelectedWallets(store, userId, body.walletIndexes, body.walletGroup);
  const tokenMint = parsePublicKey(String(body.tokenMint || "")).toBase58();
  const amountSol = parsePositiveNumber(String(body.amountSol || ""));
  const amountLamports = solToLamports(amountSol);
  const slippageBps = parseWebSlippage(body.slippageBps);
  const results = [];
  const tradeEvents = [];

  await runWithConcurrency(wallets, CONFIG.bundleConcurrency, async (wallet) => {
    try {
      const result = await buyTokenForPlan(wallet, tokenMint, amountLamports, slippageBps, { trackTokenDelta: true, userId });
      results.push({
        ok: true,
        walletLabel: wallet.label,
        walletPublicKey: wallet.publicKey,
        spentSol: lamportsToSol(result.amountLamports),
        netSwapSol: lamportsToSol(result.swapLamports),
        feeSol: lamportsToSol(result.feeLamports),
        signature: result.signature,
        message: `${wallet.label}: bought with ${lamportsToSol(result.amountLamports)} SOL`
      });
      tradeEvents.push({
        userId,
        type: "buy",
        source: "web_bundle",
        tokenMint,
        walletLabel: wallet.label,
        walletPublicKey: wallet.publicKey,
        solLamportsSpent: String(result.amountLamports),
        tokenAmount: result.tokenDeltaAmount || result.outputAmount || null,
        signature: result.signature
      });
    } catch (error) {
      results.push({
        ok: false,
        walletLabel: wallet.label,
        walletPublicKey: wallet.publicKey,
        message: `${wallet.label}: buy failed - ${friendlyError(error)}`
      });
    }
  });

  await recordTradeEvents(tradeEvents);
  await audit("web_bundle_buy", {
    userId,
    tokenMint,
    walletCount: wallets.length,
    successCount: tradeEvents.length,
    amountSol,
    slippageBps
  });

  return webBundleResult("bundle_buy", tokenMint, wallets.length, tradeEvents.length, results);
}

async function webBundleSell(userId, body = {}) {
  const store = await readWalletStore();
  const wallets = webSelectedWallets(store, userId, body.walletIndexes, body.walletGroup);
  const tokenMint = parsePublicKey(String(body.tokenMint || "")).toBase58();
  const percent = parsePercent(String(body.percent || "100"));
  const slippageBps = parseWebSlippage(body.slippageBps);
  const results = [];
  const tradeEvents = [];

  await runWithConcurrency(wallets, CONFIG.bundleConcurrency, async (wallet) => {
    try {
      const sell = await sellTokenFromWallet(wallet, tokenMint, percent, slippageBps, { userId });
      const outputLamports = BigInt(sell.outputLamports || 0);
      const feeLamports = BigInt(sell.feeLamports || 0);
      const netLamports = outputLamports > feeLamports ? outputLamports - feeLamports : 0n;
      results.push({
        ok: true,
        walletLabel: wallet.label,
        walletPublicKey: wallet.publicKey,
        percent,
        netSol: lamportsBigToSol(netLamports),
        feeSol: lamportsBigToSol(feeLamports),
        signature: sell.signature,
        message: `${wallet.label}: sold ${percent}% for ${lamportsBigToSol(netLamports)} SOL after fee`
      });
      tradeEvents.push({
        userId,
        type: "sell",
        source: "web_bundle",
        tokenMint,
        walletLabel: wallet.label,
        walletPublicKey: wallet.publicKey,
        tokenAmount: sell.tokenAmount,
        solLamportsReceived: sell.outputLamports,
        signature: sell.signature
      });
    } catch (error) {
      results.push({
        ok: false,
        walletLabel: wallet.label,
        walletPublicKey: wallet.publicKey,
        message: `${wallet.label}: sell failed - ${friendlyError(error)}`
      });
    }
  });

  await recordTradeEvents(tradeEvents);
  await audit("web_bundle_sell", {
    userId,
    tokenMint,
    walletCount: wallets.length,
    successCount: tradeEvents.length,
    percent,
    slippageBps
  });

  return webBundleResult("bundle_sell", tokenMint, wallets.length, tradeEvents.length, results);
}

function webBundleResult(type, tokenMint, walletCount, successCount, results) {
  return {
    type,
    tokenMint,
    shortMint: shortMint(tokenMint),
    walletCount,
    successCount,
    failedCount: Math.max(0, walletCount - successCount),
    dexUrl: dexScreenerUrl(tokenMint),
    results,
    message: `${type === "bundle_buy" ? "Bundle buy" : "Bundle sell"} complete: ${successCount}/${walletCount} wallet(s) succeeded.`
  };
}

function cleanLaunchText(value, maxLength = 256) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanLaunchUrl(value) {
  const text = String(value || "").trim();
  if (!text || text.startsWith("@")) return "";
  try {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function cleanLaunchBoolean(value) {
  if (typeof value === "boolean") return value;
  const text = String(value || "").trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(text);
}

function cleanLaunchNumber(value, fallback = 0, min = 0, max = 10000) {
  const parsed = Number.parseFloat(String(value ?? "").replace(/,/g, "").trim());
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normalizeLaunchResponseMint(data = {}) {
  return firstString(
    data.tokenMint,
    data.mint,
    data.ca,
    data.address,
    data.contractAddress,
    data.token?.mint,
    data.token?.address,
    data.result?.tokenMint,
    data.result?.mint,
    data.result?.ca,
    data.result?.address
  );
}

function compactLaunchPayload(value) {
  if (Array.isArray(value)) {
    return value
      .map(compactLaunchPayload)
      .filter((item) => item !== null && item !== undefined && item !== "");
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, entry]) => [key, compactLaunchPayload(entry)])
      .filter(([, entry]) => {
        if (entry === null || entry === undefined || entry === "") return false;
        if (Array.isArray(entry)) return entry.length > 0;
        if (entry && typeof entry === "object") return Object.keys(entry).length > 0;
        return true;
      });
    return Object.fromEntries(entries);
  }
  return value;
}

function buildPumpLaunchPayload(basePayload) {
  if (["minimal", "flat", "pump"].includes(CONFIG.pumpLaunchApiFormat)) {
    const flat = compactLaunchPayload({
      name: basePayload.name,
      symbol: basePayload.symbol,
      ticker: basePayload.symbol,
      description: basePayload.description,
      website: basePayload.website,
      twitter: basePayload.twitter,
      x: basePayload.twitter,
      telegram: basePayload.telegram,
      imageName: basePayload.imageName,
      imageType: basePayload.imageType,
      creatorFeeBps: basePayload.creatorFeeBps,
      creatorFeeRecipient: basePayload.creatorFeeRecipient,
      buybackWallet: basePayload.buybackWallet,
      burnCreatorFees: basePayload.burnCreatorFees,
      feeMode: basePayload.feeMode,
      devBuySol: basePayload.devBuy?.amountSol,
      initialBuySol: basePayload.devBuy?.amountSol,
      devBuyEnabled: basePayload.devBuy?.enabled,
      devWalletIndex: basePayload.devBuy?.walletIndex,
      clientRequestId: basePayload.clientRequestId,
      source: basePayload.source
    });
    const imageField = CONFIG.pumpLaunchImageField
      || (CONFIG.pumpLaunchApiFormat === "minimal" ? "imageDataUrl" : "image");
    if (basePayload.imageDataUrl && !/^none$/i.test(imageField)) {
      flat[imageField] = basePayload.imageDataUrl;
    }
    if (CONFIG.pumpLaunchApiFormat !== "pump") return flat;
    return compactLaunchPayload({
      action: "create",
      ...flat,
      denominatedInSol: "true",
      amount: flat.initialBuySol || 0,
      pool: "pump"
    });
  }
  return compactLaunchPayload(basePayload);
}

function launchImageExtension(contentType = "") {
  const type = String(contentType || "").toLowerCase();
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  if (type.includes("webp")) return "webp";
  if (type.includes("gif")) return "gif";
  return "png";
}

function decodeLaunchImageDataUrl(dataUrl, basePayload = {}) {
  const text = String(dataUrl || "");
  const match = /^data:(image\/(?:png|jpe?g|webp|gif));base64,([a-z0-9+/=]+)$/i.exec(text);
  if (!match) return null;
  const contentType = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  const cleanSymbol = cleanTickerSymbol(basePayload.symbol || basePayload.name || "token") || "token";
  const filename = cleanLaunchText(basePayload.imageName, 96)
    || `${cleanSymbol.toLowerCase()}-${Date.now()}.${launchImageExtension(contentType)}`;
  return { buffer, contentType, filename };
}

function appendPumpLaunchFormValue(form, key, value) {
  if (value === null || value === undefined || value === "") return;
  if (Array.isArray(value) || (value && typeof value === "object")) {
    form.append(key, JSON.stringify(value));
    return;
  }
  form.append(key, String(value));
}

function buildPumpLaunchRequestOptions(basePayload, payload, timeoutMs) {
  const mode = CONFIG.pumpLaunchRequestMode || "json";
  const headers = {};
  if (CONFIG.pumpLaunchApiKey) headers.Authorization = `Bearer ${CONFIG.pumpLaunchApiKey}`;

  if (mode === "multipart" || mode === "form") {
    if (typeof FormData === "undefined" || typeof Blob === "undefined") {
      throw new Error("This Node runtime does not support multipart launch uploads. Use Node 20+ or set PUMP_LAUNCH_REQUEST_MODE=json.");
    }

    const imageField = CONFIG.pumpLaunchImageField || "image";
    const textPayload = compactLaunchPayload({ ...payload });
    for (const key of ["image", "imageDataUrl", "file", "media", imageField]) {
      if (key) delete textPayload[key];
    }

    const form = new FormData();
    for (const [key, value] of Object.entries(textPayload)) {
      appendPumpLaunchFormValue(form, key, value);
    }

    if (basePayload.imageDataUrl && !/^none$/i.test(imageField)) {
      const image = decodeLaunchImageDataUrl(basePayload.imageDataUrl, basePayload);
      if (image) {
        form.append(imageField, new Blob([image.buffer], { type: image.contentType }), image.filename);
      }
    }

    return {
      method: "POST",
      headers,
      body: form,
      timeoutMs
    };
  }

  return {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    timeoutMs
  };
}

function pumpLaunchProviderHint(status) {
  const mode = CONFIG.pumpLaunchRequestMode || "json";
  if (mode === "json" && [400, 413, 415].includes(Number(status))) {
    return " If your launch API expects an image file upload, set PUMP_LAUNCH_REQUEST_MODE=multipart and set PUMP_LAUNCH_IMAGE_FIELD to the provider's file field name, usually image or file.";
  }
  if (mode !== "json" && Number(status) === 400) {
    return " Check PUMP_LAUNCH_API_FORMAT and PUMP_LAUNCH_IMAGE_FIELD against the launch provider docs; multipart is enabled but the provider rejected one of the fields.";
  }
  return "";
}

function launchProviderErrorDetail(error) {
  const detail = fetchJsonErrorMessage(error?.providerData || {}, error?.responseBody || error?.message || "", error?.status || error?.statusCode || 0);
  return detail ? detail.replace(/\s+/g, " ").trim().slice(0, 500) : "";
}

async function webLaunchPumpCoin(userId, body = {}) {
  if (!CONFIG.pumpLaunchEnabled || !CONFIG.pumpLaunchApiUrl) {
    const error = new Error("Direct Pump launch is not enabled yet. Save the launch sheet or use the official Pump fallback link.");
    error.statusCode = 501;
    throw error;
  }

  const name = cleanLaunchText(body.name, 64);
  const symbol = cleanTickerSymbol(body.symbol || body.ticker || "");
  const description = cleanLaunchText(body.description, 800);
  if (!name) {
    const error = new Error("Token name is required.");
    error.statusCode = 400;
    throw error;
  }
  if (!symbol) {
    const error = new Error("Token ticker/symbol is required.");
    error.statusCode = 400;
    throw error;
  }

  const imageDataUrl = String(body.imageDataUrl || "");
  if (imageDataUrl && !/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(imageDataUrl)) {
    const error = new Error("Upload a PNG, JPG, WEBP, or GIF token image.");
    error.statusCode = 400;
    throw error;
  }
  const decodedLaunchImage = imageDataUrl ? decodeLaunchImageDataUrl(imageDataUrl, { symbol, name, imageName: body.imageName }) : null;
  if (imageDataUrl && !decodedLaunchImage) {
    const error = new Error("Token image could not be decoded. Upload a smaller square PNG, JPG, WEBP, or GIF.");
    error.statusCode = 400;
    throw error;
  }
  const imageMaxBytes = Number.isFinite(CONFIG.pumpLaunchImageMaxBytes) && CONFIG.pumpLaunchImageMaxBytes > 0
    ? CONFIG.pumpLaunchImageMaxBytes
    : 450_000;
  if (decodedLaunchImage && decodedLaunchImage.buffer.length > imageMaxBytes) {
    const actualKb = Math.ceil(decodedLaunchImage.buffer.length / 1024);
    const maxKb = Math.floor(imageMaxBytes / 1024);
    const error = new Error(`Token image is ${actualKb}KB after compression. Limit is ${maxKb}KB. Use a smaller square JPG, PNG, WEBP, or GIF and try again.`);
    error.statusCode = 413;
    throw error;
  }

  const creatorFeeBps = cleanLaunchNumber(body.creatorFeeBps, 0, 0, 1000);
  const devBuyEnabled = cleanLaunchBoolean(body.devBuyEnabled);
  const feeModeRaw = cleanLaunchText(body.feeMode, 24).toLowerCase();
  const feeMode = ["standard", "dev", "buyback", "burn", "split"].includes(feeModeRaw)
    ? feeModeRaw
    : "standard";
  const creatorFeeRecipient = cleanLaunchText(body.creatorFeeRecipient || body.feeRecipient, 64);
  const buybackWallet = cleanLaunchText(body.buybackWallet, 64);
  const burnCreatorFees = cleanLaunchBoolean(body.burnCreatorFees) || feeMode === "burn";

  const basePayload = {
    name,
    symbol,
    description,
    website: cleanLaunchUrl(body.website),
    twitter: cleanLaunchUrl(body.x) || cleanLaunchUrl(body.twitter),
    telegram: cleanLaunchUrl(body.telegram),
    imageDataUrl,
    imageName: cleanLaunchText(body.imageName, 120),
    imageType: cleanLaunchText(body.imageType, 80),
    creatorFeeBps,
    burnCreatorFees,
    creatorFeeRecipient,
    buybackWallet,
    feeMode,
    feeRouting: {
      mode: feeMode,
      creatorFeeBps,
      creatorFeeRecipient,
      buybackWallet,
      burnCreatorFees
    },
    devBuy: {
      enabled: devBuyEnabled,
      amountSol: cleanLaunchNumber(body.devBuySol, 0, 0, 1000),
      walletIndex: cleanLaunchText(body.devWalletIndex, 24)
    },
    clientRequestId: crypto.randomUUID(),
    source: "slimewire_web"
  };
  const payload = buildPumpLaunchPayload(basePayload);

  const timeoutMs = Number.isFinite(CONFIG.pumpLaunchTimeoutMs) && CONFIG.pumpLaunchTimeoutMs > 0
    ? CONFIG.pumpLaunchTimeoutMs
    : 30000;
  let providerResult;
  try {
    providerResult = await fetchJson(CONFIG.pumpLaunchApiUrl, buildPumpLaunchRequestOptions(basePayload, payload, timeoutMs));
  } catch (error) {
    const status = Number(error.status || error.statusCode || 502);
    const detail = launchProviderErrorDetail(error);
    const message = status === 413
      ? `Pump launch provider rejected the upload because the image/payload is too large. Compress the image or switch to multipart upload.${pumpLaunchProviderHint(status)}`
      : `Pump launch provider rejected the request${detail ? `: ${detail}` : `: ${friendlyError(error)}`}${pumpLaunchProviderHint(status)}`;
    const wrapped = new Error(message);
    wrapped.statusCode = status >= 400 && status < 500 ? status : 502;
    wrapped.providerStatus = status;
    wrapped.providerResponseBody = error.responseBody;
    throw wrapped;
  }
  const tokenMint = normalizeLaunchResponseMint(providerResult);
  const status = firstString(providerResult.status, providerResult.state, tokenMint ? "launched" : "submitted");

  await audit("web_launch_pump_coin", {
    userId,
    symbol,
    status,
    tokenMint: tokenMint ? shortMint(tokenMint) : "",
    hasImage: Boolean(imageDataUrl)
  });

  return {
    status,
    tokenMint,
    signature: firstString(
      providerResult.signature,
      providerResult.txSignature,
      providerResult.transactionSignature,
      providerResult.txid,
      providerResult.result?.signature
    ),
    requestId: firstString(providerResult.requestId, providerResult.id, providerResult.result?.requestId, payload.clientRequestId),
    pumpUrl: tokenMint ? pumpFunUrl(tokenMint) : "",
    dexUrl: tokenMint ? dexScreenerUrl(tokenMint) : "",
    message: tokenMint ? `Pump launch returned ${shortMint(tokenMint)}.` : "Pump launch submitted. Waiting for token CA."
  };
}

async function webCreateLaunchWatch(userId, body = {}) {
  const store = await readWalletStore();
  const wallets = webSelectedWallets(store, userId, body.walletIndexes, body.walletGroup);
  const ticker = cleanTickerSymbol(String(body.ticker || ""));
  const amountSol = parsePositiveNumber(String(body.amountSol || ""));
  const sellDelayInput = firstString(body.sellDelay, body.sellDelaySeconds);
  const sellDelaySeconds = sellDelayInput
    ? parseOptionalSellDelaySeconds(sellDelayInput)
    : PUMPSNIPE_SELL_DELAY_SECONDS;
  const takeProfitPct = parseTakeProfitPercent(String(body.takeProfitPct || PUMPSNIPE_TAKE_PROFIT_PCT));
  const stopLossPct = parseOptionalTriggerPercent(String(body.stopLossPct || PUMPSNIPE_STOP_LOSS_PCT));
  const loopCount = parseLoopCount(String(body.loopCount || "1"));
  const loopDelaySeconds = parseLoopDelaySeconds(String(body.loopDelay || body.loopDelaySeconds || "0"));
  const slippageBps = parseWebSlippage(body.slippageBps || PUMPSNIPE_SLIPPAGE_BPS);
  const walletIndexes = wallets.map((wallet, index) => Number(wallet.webIndex || index + 1));
  const walletTakeProfitTargets = parseWebWalletTakeProfitTargets(body, walletIndexes);
  const walletStopLossTargets = parseWebWalletStopLossTargets(body, walletIndexes);
  ensureTimedPlanHasExit({
    sellDelaySeconds,
    takeProfitPct,
    stopLossPct,
    walletTakeProfitTargets,
    walletStopLossTargets
  });
  const plan = {
    id: crypto.randomUUID(),
    status: "launch_watch",
    userId,
    chatId: null,
    source: "manual_launch_snipe",
    launchTicker: ticker,
    walletSelector: wallets.map((wallet) => wallet.label).join(", "),
    amountSol,
    sellDelayMinutes: sellDelaySeconds / 60,
    sellDelaySeconds,
    sellPercent: 100,
    triggerSellPercent: 100,
    loopCount,
    loopDelaySeconds,
    takeProfitPct,
    stopLossPct,
    takeProfitMode: walletTakeProfitTargets ? "wallets" : "single",
    stopLossMode: walletStopLossTargets ? "wallets" : "single",
    takeProfitLadder: [],
    autoBundle: false,
    manualLaunch: true,
    slippageBps,
    createdAt: new Date().toISOString(),
    lastScanAt: null,
    wallets: wallets.map((wallet, index) => {
      const walletIndex = walletIndexes[index];
      return {
        label: wallet.label,
        publicKey: wallet.publicKey,
        walletIndex,
        takeProfitPct: walletTakeProfitTargets ? walletTakeProfitTargets[String(walletIndex)] || null : null,
        stopLossPct: walletStopLossTargets ? walletStopLossTargets[String(walletIndex)] || null : null,
        status: "pending",
        results: []
      };
    }),
    results: [`Watching for ticker $${ticker}`]
  };

  const plans = await readTradePlans();
  plans.plans.push(plan);
  await writeTradePlans(plans);
  await audit("web_create_manual_launch_snipe", {
    userId,
    planId: plan.id,
    ticker,
    wallets: wallets.map(publicWallet),
    amountSol,
    sellDelaySeconds,
    loopCount,
    loopDelaySeconds,
    takeProfitPct,
    stopLossPct,
    walletTakeProfitTargets,
    walletStopLossTargets,
    slippageBps
  });
  setTimeout(() => void processTradePlans().catch((error) => {
    console.error("Web manual launch immediate scan failed:", error.message);
  }), 250);

  return webLaunchWatchRow(plan);
}

async function webLaunchWatches(userId) {
  const plans = await readTradePlans();
  return plans.plans
    .filter((plan) => String(plan.userId) === String(userId) && ["launch_watch", "watching"].includes(plan.status) && plan.manualLaunch)
    .sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0))
    .slice(0, 20)
    .map(webLaunchWatchRow);
}

async function webCancelLaunchWatch(userId, planId) {
  const store = await readTradePlans();
  const plan = store.plans.find((item) => item.id === String(planId || "") && String(item.userId) === String(userId));
  if (!plan) {
    throw new Error("Launch watch not found.");
  }
  if (plan.status !== "launch_watch") {
    throw new Error("This launch watch is no longer scanning.");
  }

  plan.status = "canceled";
  plan.canceledAt = new Date().toISOString();
  plan.results = appendLimited([...(plan.results || []), "Canceled from web panel."]);
  await writeTradePlans(store);
  await audit("web_cancel_manual_launch_snipe", { userId, planId: plan.id, ticker: plan.launchTicker });
  return webLaunchWatchRow(plan);
}

function webLaunchWatchRow(plan) {
  return {
    id: plan.id,
    status: plan.status,
    ticker: plan.launchTicker,
    tokenMint: plan.tokenMint || null,
    shortMint: plan.tokenMint ? shortMint(plan.tokenMint) : null,
    walletCount: plan.wallets?.length || 0,
    amountSol: plan.amountSol,
    takeProfitPct: plan.takeProfitPct,
    stopLossPct: plan.stopLossPct,
    takeProfitSummary: formatPlanTakeProfitSummary(plan),
    stopLossSummary: formatPlanStopLossSummary(plan),
    sellDelaySeconds: plan.sellDelaySeconds,
    loopCount: plan.loopCount || 1,
    loopDelaySeconds: plan.loopDelaySeconds || 0,
    slippageBps: plan.slippageBps,
    scanIntervalMs: CONFIG.manualLaunchScanIntervalMs,
    createdAt: plan.createdAt,
    lastScanAt: plan.lastScanAt || null,
    results: (plan.results || []).slice(-6),
    dexUrl: plan.tokenMint ? dexScreenerUrl(plan.tokenMint) : null,
    message: plan.status === "launch_watch"
      ? `Watching $${plan.launchTicker} every ${(CONFIG.manualLaunchScanIntervalMs / 1000).toFixed(CONFIG.manualLaunchScanIntervalMs % 1000 === 0 ? 0 : 1)}s while the bot is online.`
      : `Launch watch ${plan.status}.`
  };
}

function webSelectedWallets(store, userId, walletIndexes, walletGroup = "") {
  const ownerWallets = walletsForOwner(store, userId);
  const group = String(walletGroup || "").trim().toLowerCase();
  const indexes = group
    ? ownerWallets
      .map((wallet, index) => ({ wallet, index: index + 1 }))
      .filter(({ wallet }) => {
        const label = String(wallet.label || "").toLowerCase();
        return label === group || label.startsWith(`${group} `);
      })
      .map(({ index }) => index)
    : Array.isArray(walletIndexes)
      ? walletIndexes.map((value) => Number.parseInt(value, 10))
      : String(walletIndexes || "").toLowerCase() === "all"
        ? ownerWallets.map((_, index) => index + 1)
        : [];

  const uniqueIndexes = [...new Set(indexes)].filter((index) => Number.isInteger(index) && index >= 1);
  if (uniqueIndexes.length === 0) {
    throw new Error(group ? `No wallets found for group "${walletGroup}".` : "Choose at least one wallet.");
  }
  if (uniqueIndexes.length > 20) {
    throw new Error("Choose 20 wallets or fewer.");
  }

  return uniqueIndexes.map((index) => ({
    ...getWalletAt(store, index, userId),
    webIndex: index
  }));
}

function webWalletRef(wallet) {
  return {
    walletIndex: wallet.webIndex,
    walletLabel: wallet.label,
    walletPublicKey: wallet.publicKey,
    shortPublicKey: shortMint(wallet.publicKey)
  };
}

function parseWebDestination(value, label = "destination wallet") {
  const text = String(value || "").trim();
  if (!text) {
    throw new Error(`Enter a ${label}.`);
  }
  try {
    return new PublicKey(text);
  } catch {
    throw new Error(`Invalid ${label}.`);
  }
}

function parseOptionalWebMint(value) {
  const text = String(value || "").trim();
  if (!text || text.toLowerCase() === "all") return "";
  try {
    return new PublicKey(text).toBase58();
  } catch {
    throw new Error("Invalid token mint. Leave blank for all tokens.");
  }
}

function splitWebDestinationList(value) {
  const rows = Array.isArray(value)
    ? value
    : String(value || "").split(/[\s,]+/);
  const destinations = rows.map((item) => String(item || "").trim()).filter(Boolean);
  const unique = [...new Set(destinations)];
  if (unique.length === 0) {
    throw new Error("Enter at least one destination wallet.");
  }
  if (unique.length > 20) {
    throw new Error("Use 20 destination wallets or fewer.");
  }
  return unique.map((address) => parseWebDestination(address, "destination wallet"));
}

function selectedWebSweepWallets(store, userId, body = {}) {
  return webSelectedWallets(
    store,
    userId,
    body.walletIndexes || body.wallets || "all",
    body.walletGroup || body.group || ""
  );
}

function solTransferResultRow(wallet, result) {
  return {
    ...webWalletRef(wallet),
    ok: Boolean(result.signature),
    signature: result.signature || null,
    sentSol: result.sentLamports ? lamportsToSol(result.sentLamports) : "0",
    feeSol: result.feeLamports ? lamportsToSol(result.feeLamports) : "0",
    message: result.message || (result.signature ? "SOL sent." : "No sweepable SOL.")
  };
}

async function webSweepSol(userId, body = {}) {
  const store = await readWalletStore();
  const destination = parseWebDestination(body.destination || body.destinationWallet);
  const wallets = selectedWebSweepWallets(store, userId, body);
  const rows = [];

  for (const wallet of wallets) {
    try {
      const keypair = decryptWallet(wallet);
      const result = await drainSolFromWallet(keypair, destination);
      invalidateWalletReadCache(wallet.publicKey);
      rows.push(solTransferResultRow(wallet, result));
    } catch (error) {
      rows.push({
        ...webWalletRef(wallet),
        ok: false,
        signature: null,
        sentSol: "0",
        feeSol: "0",
        message: friendlyError(error)
      });
    }
  }

  invalidateWalletReadCache(destination.toBase58());
  await audit("web_sweep_sol", { userId, destination: destination.toBase58(), walletCount: wallets.length, successCount: rows.filter((row) => row.ok).length });
  return {
    action: "sweep-sol",
    destination: destination.toBase58(),
    rows,
    summary: `${rows.filter((row) => row.ok).length}/${rows.length} wallet(s) swept SOL.`
  };
}

async function webSweepTokens(userId, body = {}) {
  const store = await readWalletStore();
  const destination = parseWebDestination(body.destination || body.destinationWallet);
  const tokenMint = parseOptionalWebMint(body.tokenMint || body.mint);
  const wallets = selectedWebSweepWallets(store, userId, body);
  const rows = [];

  for (const wallet of wallets) {
    const walletRow = {
      ...webWalletRef(wallet),
      ok: false,
      transfers: [],
      message: ""
    };

    try {
      const keypair = decryptWallet(wallet);
      const lookup = await getOwnedTokenAccountsWithWarningsCached(keypair.publicKey, { force: true });
      const accounts = (lookup.accounts || []).filter((account) => account.rawAmount > 0n && (!tokenMint || account.mint === tokenMint));

      if (!accounts.length) {
        walletRow.message = tokenMint ? "No balance for that token." : "No sweepable tokens.";
        rows.push(walletRow);
        continue;
      }

      for (const account of accounts) {
        const mint = new PublicKey(account.mint);
        const decimals = Number.isInteger(account.decimals) ? account.decimals : await getMintDecimals(mint);
        const sourceAta = new PublicKey(account.pubkey);
        const tokenProgramId = new PublicKey(account.tokenProgramId || TOKEN_PROGRAM_ID);
        const destinationAta = getAssociatedTokenAddress(mint, destination, tokenProgramId);
        const tx = new Transaction();
        const destinationInfo = await rpcWithRetry("check destination token account", () => connection.getAccountInfo(destinationAta, "confirmed"));

        if (!destinationInfo) {
          tx.add(createAssociatedTokenAccountInstruction(keypair.publicKey, destinationAta, destination, mint, tokenProgramId));
        }

        tx.add(createTransferCheckedInstruction(
          sourceAta,
          mint,
          destinationAta,
          keypair.publicKey,
          account.rawAmount,
          decimals,
          [],
          tokenProgramId
        ));

        const signature = await sendLegacyTransaction(tx, [keypair]);
        walletRow.transfers.push({
          mint: account.mint,
          uiAmount: rawTokenAmountToUi(account.rawAmount, decimals),
          rawAmount: account.rawAmount.toString(),
          signature
        });
      }

      walletRow.ok = walletRow.transfers.length > 0;
      walletRow.message = `Transferred ${walletRow.transfers.length} token account(s).`;
      invalidateWalletReadCache(wallet.publicKey);
      rows.push(walletRow);
    } catch (error) {
      walletRow.message = friendlyError(error);
      rows.push(walletRow);
    }
  }

  invalidateWalletReadCache(destination.toBase58());
  await audit("web_sweep_tokens", { userId, destination: destination.toBase58(), tokenMint: tokenMint || "all", walletCount: wallets.length, successCount: rows.filter((row) => row.ok).length });
  return {
    action: "sweep-tokens",
    destination: destination.toBase58(),
    tokenMint: tokenMint || "all",
    rows,
    summary: `${rows.filter((row) => row.ok).length}/${rows.length} wallet(s) transferred tokens.`
  };
}

async function webSellAllTokens(userId, body = {}) {
  const store = await readWalletStore();
  const tokenMint = parseOptionalWebMint(body.tokenMint || body.mint);
  const destination = String(body.destination || body.destinationWallet || "").trim()
    ? parseWebDestination(body.destination || body.destinationWallet)
    : null;
  const slippageBps = parseWebSlippage(body.slippageBps || body.slippage || CONFIG.stopLossExitSlippageBps);
  const wallets = selectedWebSweepWallets(store, userId, body);
  const rows = [];
  const tradeEvents = [];

  for (const wallet of wallets) {
    const walletRow = {
      ...webWalletRef(wallet),
      ok: false,
      sells: [],
      solSweep: null,
      message: ""
    };

    try {
      const keypair = decryptWallet(wallet);
      const lookup = await getOwnedTokenAccountsWithWarningsCached(keypair.publicKey, { force: true });
      const tokens = sellableTokensFromAccounts(lookup.accounts || []).filter((token) => !tokenMint || token.mint === tokenMint);

      if (!tokens.length) {
        walletRow.message = tokenMint ? "No sellable balance for that token." : "No sellable token balances.";
      }

      for (const token of tokens) {
        try {
          const sell = await sellTokenAmountFromWallet(wallet, token.mint, token.rawAmount, slippageBps, { userId });
          walletRow.sells.push({
            ok: true,
            mint: token.mint,
            uiAmount: rawTokenAmountToUi(token.rawAmount, token.decimals),
            outputSol: lamportsToSol(sell.outputLamports),
            signature: sell.signature,
            feeSol: lamportsToSol(sell.feeLamports || "0")
          });
          tradeEvents.push({
            userId,
            type: "sell",
            source: "web_sell_all_tokens",
            tokenMint: token.mint,
            walletLabel: wallet.label,
            walletPublicKey: wallet.publicKey,
            tokenAmount: sell.tokenAmount,
            solLamportsReceived: sell.outputLamports,
            signature: sell.signature
          });
          await sleep(CONFIG.rpcDelayMs);
        } catch (sellError) {
          walletRow.sells.push({
            ok: false,
            mint: token.mint,
            uiAmount: rawTokenAmountToUi(token.rawAmount, token.decimals),
            message: friendlyError(sellError)
          });
        }
      }

      if (destination && walletRow.sells.some((sell) => sell.ok)) {
        await sleep(800);
        const sweep = await drainSolFromWallet(keypair, destination);
        walletRow.solSweep = solTransferResultRow(wallet, sweep);
      }

      walletRow.ok = walletRow.sells.some((sell) => sell.ok) || Boolean(walletRow.solSweep?.ok);
      walletRow.message = walletRow.message || `Sold ${walletRow.sells.filter((sell) => sell.ok).length}/${walletRow.sells.length} token(s).`;
      invalidateWalletReadCache(wallet.publicKey);
      rows.push(walletRow);
    } catch (error) {
      walletRow.message = friendlyError(error);
      rows.push(walletRow);
    }
  }

  if (tradeEvents.length) {
    await recordTradeEvents(tradeEvents);
  }
  if (destination) {
    invalidateWalletReadCache(destination.toBase58());
  }
  await audit("web_sell_all_tokens", { userId, tokenMint: tokenMint || "all", destination: destination?.toBase58?.() || null, walletCount: wallets.length, successCount: rows.filter((row) => row.ok).length });
  return {
    action: destination ? "sell-all-and-sweep-sol" : "sell-all-tokens",
    destination: destination?.toBase58?.() || null,
    tokenMint: tokenMint || "all",
    rows,
    summary: `${rows.filter((row) => row.ok).length}/${rows.length} wallet(s) sold token balances.`
  };
}

async function webSendSolMany(userId, body = {}) {
  const store = await readWalletStore();
  const walletIndex = parseWebWalletIndex(body.fromWalletIndex || body.walletIndex);
  const wallet = {
    ...getWalletAt(store, walletIndex, userId),
    webIndex: walletIndex
  };
  const destinations = splitWebDestinationList(body.destinations || body.destinationWallets || body.destination);
  const keypair = decryptWallet(wallet);
  const splitAll = Boolean(body.splitAll || body.amountMode === "splitAll");
  let amountLamports;

  if (splitAll) {
    const balance = await getSolBalanceCached(keypair.publicKey, { force: true });
    const estimatedFeeLamports = 5000 * Math.max(1, destinations.length);
    const reserveLamports = CONFIG.buyReserveLamports + estimatedFeeLamports;
    const sendableLamports = balance - reserveLamports;
    if (sendableLamports <= 0) {
      throw new Error(`Not enough SOL after keeping ${lamportsToSol(reserveLamports)} SOL for reserve and fees.`);
    }
    amountLamports = Math.floor(sendableLamports / destinations.length);
  } else {
    amountLamports = solToLamports(parsePositiveNumber(String(body.amountSol || "")));
  }

  if (amountLamports <= 0) {
    throw new Error("Enter a SOL amount greater than zero.");
  }

  const tx = new Transaction();
  for (const destination of destinations) {
    if (keypair.publicKey.equals(destination)) {
      throw new Error("A destination matches the source wallet.");
    }
    await assertDestinationCanReceiveSol(destination, amountLamports);
    tx.add(SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: destination,
      lamports: amountLamports
    }));
  }

  const signature = await sendLegacyTransaction(tx, [keypair]);
  invalidateWalletReadCache(wallet.publicKey);
  destinations.forEach((destination) => invalidateWalletReadCache(destination.toBase58()));
  await audit("web_send_sol_many", { userId, walletIndex, destinationCount: destinations.length, amountSol: lamportsToSol(amountLamports), signature });
  return {
    action: "send-sol-many",
    source: webWalletRef(wallet),
    amountSol: lamportsToSol(amountLamports),
    destinationCount: destinations.length,
    destinations: destinations.map((destination) => destination.toBase58()),
    signature,
    summary: `Sent ${lamportsToSol(amountLamports)} SOL to ${destinations.length} wallet(s).`
  };
}

function parseWebWalletIndex(value) {
  const index = Number.parseInt(value || "1", 10);
  if (!Number.isInteger(index) || index < 1) {
    throw new Error("Choose a wallet first.");
  }
  return index;
}

function parseWebSlippage(value) {
  return parseSlippage(String(value || "default"), CONFIG.defaultSlippageBps);
}

async function webBuyAmountLamports(wallet, body = {}) {
  if (String(body.amountMode || "").trim().toLowerCase() === "max") {
    const balance = await getSolBalanceCached(new PublicKey(wallet.publicKey), { force: true });
    const amountLamports = balance - CONFIG.buyReserveLamports;
    if (amountLamports <= 0) {
      throw new Error(`Not enough SOL after keeping ${CONFIG.buyReserveSol} SOL safety reserve.`);
    }
    return amountLamports;
  }

  return solToLamports(parsePositiveNumber(String(body.amountSol || "")));
}

async function webBalanceRows(userId, options = {}) {
  const store = await readWalletStore();
  const wallets = walletsForOwner(store, userId);
  const rows = [];

  await runWithConcurrency(wallets, CONFIG.balanceConcurrency, async (wallet, index) => {
    const row = {
      index: index + 1,
      label: wallet.label,
      publicKey: wallet.publicKey,
      shortPublicKey: shortMint(wallet.publicKey),
      sol: null,
      tokens: [],
      warnings: [],
      error: null
    };

    try {
      const keypair = decryptWallet(wallet);
      const balance = await getSolBalanceCached(keypair.publicKey, { force: Boolean(options.force) });
      row.sol = lamportsToSol(balance);
      row.lamports = String(balance);

      const { accounts, warnings } = await getOwnedTokenAccountsWithWarningsCached(keypair.publicKey, { force: Boolean(options.force) });
      row.warnings = warnings || [];
      row.tokens = accounts
        .filter((account) => account.rawAmount > 0n)
        .slice(0, 12)
        .map((account) => ({
          mint: account.mint,
          shortMint: shortMint(account.mint),
          uiAmount: account.uiAmount,
          rawAmount: account.rawAmount.toString(),
          dexUrl: dexScreenerUrl(account.mint)
        }));
    } catch (error) {
      row.error = friendlyError(error);
    }

    rows[index] = row;
  });

  return rows;
}

async function webConnectedWalletBalance(userId, options = {}) {
  const profile = await webProfileForUser(userId);
  const connected = profile.connectedWallet || null;
  if (!connected?.publicKey) return null;

  const row = {
    label: connected.provider || "Connected Wallet",
    publicKey: connected.publicKey,
    shortPublicKey: connected.shortPublicKey || shortMint(connected.publicKey),
    provider: connected.provider || "Solana Wallet",
    connectedAt: connected.connectedAt || "",
    sol: null,
    lamports: null,
    tokens: [],
    warnings: [],
    error: null,
    viewOnly: true
  };

  try {
    const owner = new PublicKey(connected.publicKey);
    const balance = await getSolBalanceCached(owner, { force: Boolean(options.force) });
    row.sol = lamportsToSol(balance);
    row.lamports = String(balance);
    const { accounts, warnings } = await getOwnedTokenAccountsWithWarningsCached(owner, { force: Boolean(options.force) });
    row.warnings = warnings || [];
    const tokens = accounts
      .filter((account) => account.rawAmount > 0n)
      .slice(0, 12)
      .map((account) => ({
        mint: account.mint,
        shortMint: shortMint(account.mint),
        uiAmount: account.uiAmount,
        rawAmount: account.rawAmount.toString(),
        dexUrl: dexScreenerUrl(account.mint)
      }));
    const metadataByMint = await tokenMetadataMapForMints(tokens.map((token) => token.mint), {
      timeoutMs: 1_800,
      pumpTimeoutMs: 900
    }).catch(() => new Map());
    row.tokens = tokens.map((token) => {
      const metadata = metadataByMint.get(token.mint) || {};
      return {
        ...token,
        symbol: metadata.symbol || token.shortMint,
        name: metadata.name || "",
        imageUrl: metadata.imageUrl || ""
      };
    });
  } catch (error) {
    row.error = friendlyError(error);
  }

  return row;
}

async function webPositionRows(userId, options = {}) {
  const positions = await buildPositionsOverview(userId, options);
  const limited = positions.slice(0, 25);
  const metadataByMint = await tokenMetadataMapForMints(limited.map((position) => position.tokenMint), {
    timeoutMs: 2_000,
    pumpTimeoutMs: 1_000
  }).catch(() => new Map());
  return limited.map((position) => {
    const metadata = metadataByMint.get(position.tokenMint) || {};
    const realized = position.received - position.spent;
    const openPnl = position.estimatedValueLamports !== null
      ? position.estimatedValueLamports + position.received - position.spent
      : null;
    return {
      tokenMint: position.tokenMint,
      shortMint: shortMint(position.tokenMint),
      symbol: metadata.symbol || shortMint(position.tokenMint),
      name: metadata.name || "",
      imageUrl: metadata.imageUrl || "",
      dexUrl: dexScreenerUrl(position.tokenMint),
      uiAmount: formatTokenAmount(position.uiAmount),
      walletCount: position.walletCount,
      buys: position.buys,
      sells: position.sells,
      spentSol: lamportsBigToSol(position.spent),
      receivedSol: lamportsBigToSol(position.received),
      realizedSol: formatSignedLamports(realized),
      estimatedValueSol: position.estimatedValueLamports !== null ? lamportsBigToSol(position.estimatedValueLamports) : null,
      openPnlSol: openPnl !== null ? formatSignedLamports(openPnl) : null,
      openPnlPercent: openPnl !== null && position.spent > 0n ? formatPercentMove(openPnl, position.spent) : null,
      valueError: position.valueError || null
    };
  });
}

async function webPnlSummary(userId) {
  const trades = await tradeHistoryRows(userId, null);
  const tokenRows = await pnlRows(userId, null, { groupByToken: true, sortBy: "recent", limit: 25 });
  const metadataByMint = await tokenMetadataMapForMints(tokenRows.map((row) => row.tokenMint), {
    timeoutMs: 2_000,
    pumpTimeoutMs: 1_000
  }).catch(() => new Map());
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

  return {
    totals: {
      tradeCount: trades.length,
      buys: totals.buys,
      sells: totals.sells,
      spentSol: lamportsBigToSol(totals.spent),
      receivedSol: lamportsBigToSol(totals.received),
      realizedSol: formatSignedLamports(realized)
    },
    tokens: tokenRows.map((row) => {
      const metadata = metadataByMint.get(row.tokenMint) || {};
      return {
        tokenMint: row.tokenMint,
        shortMint: shortMint(row.tokenMint),
        symbol: metadata.symbol || shortMint(row.tokenMint),
        name: metadata.name || "",
        imageUrl: metadata.imageUrl || "",
        walletLabel: row.walletLabel,
        buys: row.buys,
        sells: row.sells,
        spentSol: lamportsBigToSol(row.spent),
        receivedSol: lamportsBigToSol(row.received),
        realizedSol: formatSignedLamports(row.received - row.spent),
        firstBuyAt: row.firstBuyAt,
        lastSellAt: row.lastSellAt,
        lastTradeAt: row.lastTradeAt,
        holdTime: formatPnlHoldDuration(row),
        dexUrl: dexScreenerUrl(row.tokenMint)
      };
    }),
    trades: trades.slice(0, 50).map((trade) => ({
      id: trade.id,
      timestamp: trade.timestamp,
      type: trade.type,
      walletLabel: trade.walletLabel || shortMint(trade.walletPublicKey || ""),
      walletPublicKey: trade.walletPublicKey || null,
      tokenMint: trade.tokenMint,
      shortMint: shortMint(trade.tokenMint || ""),
      solAmount: trade.type === "buy"
        ? lamportsBigToSol(BigInt(trade.solLamportsSpent || 0))
        : lamportsBigToSol(BigInt(trade.solLamportsReceived || 0)),
      tokenAmount: trade.tokenAmount || null,
      source: trade.source ? formatTradeSource(trade.source) : null,
      signature: trade.signature || null,
      dexUrl: trade.tokenMint ? dexScreenerUrl(trade.tokenMint) : null
    }))
  };
}

async function webPnlCard(userId, tokenMintText) {
  const tokenMint = parsePublicKey(String(tokenMintText || "")).toBase58();
  const rows = await pnlRows(userId, tokenMint, { groupByToken: true, limit: 1 });
  if (rows.length === 0) {
    const error = new Error("No PnL data found for that token. Cards only work for buys/sells made from this account.");
    error.statusCode = 404;
    throw error;
  }

  const row = rows[0];
  const metadata = await getDexTokenMetadata(row.tokenMint);
  const png = await renderPnlCard(row, metadata);
  return {
    png,
    filename: `pnl-card-${sanitizeFilenamePart(metadata.symbol || row.tokenMint)}.png`
  };
}

async function webTxAudit(signatureText) {
  const signature = String(signatureText || "").trim();
  if (!/^[1-9A-HJ-NP-Za-km-z]{40,100}$/.test(signature)) {
    throw new Error("Paste a valid Solana transaction signature.");
  }

  const tx = await rpcWithRetry("get transaction audit", () => connection.getParsedTransaction(signature, {
    commitment: "finalized",
    maxSupportedTransactionVersion: 0
  }));
  if (!tx) {
    return {
      signature,
      status: "not_found",
      message: "Finalized transaction was not found by the configured RPC. Try again later or check the signature on Solscan.",
      explorerUrl: `https://solscan.io/tx/${signature}`
    };
  }

  const solDeltas = parseSolBalanceDeltas(tx);
  const tokenDeltas = parseTokenBalanceDeltas(tx);
  const createdAtas = detectCreatedAssociatedTokenAccounts(tx);
  const swapActivity = detectSwapActivity(tx);
  const feePayer = solDeltas[0]?.account || "";

  return {
    signature,
    status: tx.meta?.err ? "failed" : "finalized",
    error: tx.meta?.err || null,
    slot: tx.slot,
    blockTime: tx.blockTime || null,
    blockTimeLabel: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : "",
    feeLamports: tx.meta?.fee || 0,
    feeSol: lamportsToSol(tx.meta?.fee || 0),
    feePayer,
    signer: feePayer,
    programs: swapActivity.programs,
    swapActivity,
    solDeltas,
    tokenDeltas,
    createdAssociatedTokenAccounts: createdAtas,
    logs: tx.meta?.logMessages || [],
    explorerUrl: `https://solscan.io/tx/${signature}`,
    shouldRefreshBalances: !tx.meta?.err && (solDeltas.length > 0 || tokenDeltas.length > 0 || createdAtas.length > 0)
  };
}

function parseSolBalanceDeltas(tx) {
  const accountKeys = tx.transaction?.message?.accountKeys || [];
  const pre = tx.meta?.preBalances || [];
  const post = tx.meta?.postBalances || [];
  return accountKeys.map((key, index) => {
    const pubkey = key.pubkey?.toBase58?.() || key.pubkey?.toString?.() || key.toString?.() || String(key);
    const before = Number(pre[index] || 0);
    const after = Number(post[index] || 0);
    const delta = after - before;
    if (delta === 0) return null;
    return {
      account: pubkey,
      shortAccount: shortMint(pubkey),
      beforeSol: lamportsToSol(before),
      afterSol: lamportsToSol(after),
      deltaSol: formatSignedLamports(BigInt(delta))
    };
  }).filter(Boolean);
}

function parseTokenBalanceDeltas(tx) {
  const byKey = new Map();
  const collect = (balance, side) => {
    if (!balance?.mint) return;
    const owner = balance.owner || "";
    const key = `${balance.accountIndex}:${owner}:${balance.mint}`;
    const current = byKey.get(key) || {
      accountIndex: balance.accountIndex,
      owner,
      shortOwner: owner ? shortMint(owner) : "",
      mint: balance.mint,
      shortMint: shortMint(balance.mint),
      decimals: balance.uiTokenAmount?.decimals ?? null,
      preRaw: 0n,
      postRaw: 0n
    };
    const amount = BigInt(balance.uiTokenAmount?.amount || 0);
    if (side === "pre") current.preRaw = amount;
    else current.postRaw = amount;
    byKey.set(key, current);
  };

  for (const balance of tx.meta?.preTokenBalances || []) collect(balance, "pre");
  for (const balance of tx.meta?.postTokenBalances || []) collect(balance, "post");

  return [...byKey.values()].map((row) => {
    const delta = row.postRaw - row.preRaw;
    const decimals = Number.isInteger(row.decimals) ? row.decimals : 0;
    return {
      ...row,
      preAmount: rawTokenAmountToUi(row.preRaw, decimals),
      postAmount: rawTokenAmountToUi(row.postRaw, decimals),
      deltaAmount: `${delta < 0n ? "-" : ""}${rawTokenAmountToUi(delta < 0n ? -delta : delta, decimals)}`
    };
  }).filter((row) => row.preRaw !== row.postRaw);
}

function detectCreatedAssociatedTokenAccounts(tx) {
  return flattenParsedInstructions(tx)
    .filter((instruction) => {
      const type = String(instruction.parsed?.type || "").toLowerCase();
      const program = String(instruction.program || instruction.programId || "").toLowerCase();
      return type.includes("create") && (type.includes("associated") || program.includes("associated"));
    })
    .map((instruction) => ({
      type: instruction.parsed?.type || "create",
      account: instruction.parsed?.info?.account || instruction.parsed?.info?.associatedAccount || "",
      mint: instruction.parsed?.info?.mint || "",
      wallet: instruction.parsed?.info?.wallet || instruction.parsed?.info?.owner || "",
      program: instruction.program || String(instruction.programId || "")
    }));
}

function detectSwapActivity(tx) {
  const instructions = flattenParsedInstructions(tx);
  const logs = tx.meta?.logMessages || [];
  const programs = uniqueStrings(instructions.map((instruction) => (
    instruction.programId?.toBase58?.() || instruction.programId?.toString?.() || instruction.program || ""
  )).filter(Boolean)).slice(0, 20);
  const lowerLogs = logs.join("\n").toLowerCase();
  const swapLike = /jupiter|raydium|orca|meteora|pump|swap|route/.test(lowerLogs)
    || instructions.some((instruction) => /swap|route/i.test(String(instruction.parsed?.type || instruction.program || "")));
  return {
    detected: swapLike,
    programs,
    summary: swapLike ? "Swap/route activity detected from parsed instructions or logs." : "No obvious swap activity detected in parsed logs."
  };
}

function flattenParsedInstructions(tx) {
  const top = tx.transaction?.message?.instructions || [];
  const inner = (tx.meta?.innerInstructions || []).flatMap((group) => group.instructions || []);
  return [...top, ...inner].filter(Boolean);
}

async function webKolScan(userId, mode = "hot", wallet = "") {
  if (String(mode || "").trim().toLowerCase() === "slimewire") {
    const traders = await webSlimewireTraders();
    return {
      configured: true,
      label: "Top SlimeWire Traders",
      message: traders.length
        ? "Top opt-in SlimeWire traders by saved web trade history."
        : "No opt-in SlimeWire traders yet. Turn on the leaderboard option in Profile after you have trade history.",
      kolCount: traders.length,
      kols: traders,
      rows: [],
      source: "slimewire"
    };
  }
  return buildKolScan(userId, mode, wallet);
}

async function webCreateKolEntry(userId, body = {}) {
  const store = await readWalletStore();
  const wallets = webSelectedWallets(store, userId, body.walletIndexes, body.walletGroup);
  return webCreateManagedBuyPlan(userId, wallets, body, {
    source: "kol_tracker",
    label: "KOL copy plan",
    auditType: "web_create_kol_copy_plan",
    defaultSellDelay: "5",
    defaultTakeProfitPct: "25",
    defaultStopLossPct: "8",
    defaultSlippageBps: 400
  });
}

async function webCreateKolCopyWallet(userId, body = {}) {
  if (!CONFIG.solanaTrackerApiKey) {
    throw new Error("Live copy-wallet watches need SOLANA_TRACKER_API_KEY. You can still paste a wallet, scan its current positions, and use Copy Plan on any token without this.");
  }

  const copyWallet = parsePublicKey(String(body.copyWallet || body.wallet || "")).toBase58();
  const store = await readWalletStore();
  const wallets = webSelectedWallets(store, userId, body.walletIndexes, body.walletGroup);
  const amountSol = parsePositiveNumber(String(body.amountSol || ""));
  const sellDelaySeconds = parseOptionalSellDelaySeconds(firstString(body.sellDelay, body.sellDelaySeconds, "5"));
  const takeProfitPct = parseTakeProfitPercent(String(body.takeProfitPct || "25"));
  const stopLossPct = parseOptionalTriggerPercent(String(body.stopLossPct || "8"));
  const loopCount = parseLoopCount(String(body.loopCount || "1"));
  const loopDelaySeconds = parseLoopDelaySeconds(String(body.loopDelay || body.loopDelaySeconds || "0"));
  const slippageBps = parseWebSlippage(body.slippageBps || 400);
  const walletIndexes = wallets.map((wallet, index) => Number(wallet.webIndex || index + 1));
  const walletTakeProfitTargets = parseWebWalletTakeProfitTargets(body, walletIndexes);
  const walletStopLossTargets = parseWebWalletStopLossTargets(body, walletIndexes);
  ensureTimedPlanHasExit({
    sellDelaySeconds,
    takeProfitPct,
    stopLossPct,
    walletTakeProfitTargets,
    walletStopLossTargets
  });
  const initialSignals = await fetchKolWalletTradeSignals(copyWallet, "fresh", {
    limit: 12,
    cacheTtlMs: Math.max(0, Math.min(CONFIG.kolCopyScanIntervalMs - 500, CONFIG.solanaTrackerKolCacheTtlMs))
  }).catch(() => []);

  const plan = {
    id: crypto.randomUUID(),
    status: "copy_wallet_watch",
    userId,
    chatId: null,
    source: "kol_copy_wallet",
    copyWallet,
    walletSelector: String(body.walletGroup || "").trim()
      ? `group:${String(body.walletGroup).trim()}`
      : Array.isArray(body.walletIndexes)
        ? body.walletIndexes.join(",")
        : "selected",
    amountSol,
    sellDelayMinutes: sellDelaySeconds / 60,
    sellDelaySeconds,
    sellPercent: 100,
    triggerSellPercent: 100,
    loopCount,
    loopDelaySeconds,
    takeProfitPct,
    stopLossPct,
    takeProfitMode: walletTakeProfitTargets ? "wallets" : "single",
    stopLossMode: walletStopLossTargets ? "wallets" : "single",
    takeProfitLadder: [],
    autoBundle: false,
    slippageBps,
    seenTokenMints: uniqueStrings(initialSignals.map((row) => row.tokenMint).filter(Boolean)).slice(-80),
    createdAt: new Date().toISOString(),
    lastScanAt: null,
    wallets: wallets.map((wallet, index) => {
      const walletIndex = walletIndexes[index];
      return {
        label: wallet.label,
        publicKey: wallet.publicKey,
        walletIndex,
        takeProfitPct: walletTakeProfitTargets ? walletTakeProfitTargets[String(walletIndex)] || null : null,
        stopLossPct: walletStopLossTargets ? walletStopLossTargets[String(walletIndex)] || null : null,
        status: "pending",
        results: []
      };
    }),
    results: [
      `Watching ${shortMint(copyWallet)} for the next new buy.`,
      `Initial recent buys ignored: ${initialSignals.length}`
    ]
  };

  const plans = await readTradePlans();
  plans.plans.push(plan);
  await writeTradePlans(plans);
  await audit("web_create_kol_copy_wallet_watch", {
    userId,
    planId: plan.id,
    copyWallet,
    wallets: wallets.map(publicWallet),
    amountSol,
    sellDelaySeconds,
    takeProfitPct,
    stopLossPct,
    walletTakeProfitTargets,
    walletStopLossTargets,
    loopCount,
    loopDelaySeconds,
    slippageBps
  });
  setTimeout(() => void processTradePlans().catch((error) => {
    console.error("Web KOL copy-wallet watch failed:", error.message);
  }), 1_000);

  return {
    id: plan.id,
    type: "kol_copy_wallet",
    copyWallet,
    shortWallet: shortMint(copyWallet),
    walletCount: wallets.length,
    amountSol,
    takeProfitPct,
    stopLossPct,
    takeProfitSummary: formatPlanTakeProfitSummary(plan),
    stopLossSummary: formatPlanStopLossSummary(plan),
    sellDelaySeconds,
    loopCount,
    loopDelaySeconds,
    slippageBps,
    scanIntervalMs: CONFIG.kolCopyScanIntervalMs,
    results: plan.results,
    message: `Copy Wallet armed for ${shortMint(copyWallet)}. It ignores already-seen buys and watches for the next new buy.`
  };
}

async function buildKolScan(userId, mode = "hot", wallet = "") {
  const safeMode = normalizeKolMode(mode);
  const customWallet = String(wallet || "").trim();
  const scanState = nextSniperScanState(`web:${userId}`, `kol:${safeMode}:${customWallet || "global"}`);
  const hasMadeOnSol = Boolean(CONFIG.madeOnSolApiKey);
  const hasSolanaTracker = Boolean(CONFIG.solanaTrackerApiKey);
  const base = {
    mode: safeMode,
    label: kolModeLabel(safeMode),
    description: kolModeDescription(safeMode),
    configured: hasMadeOnSol || hasSolanaTracker,
    source: hasMadeOnSol && hasSolanaTracker ? "mixed" : hasMadeOnSol ? "made_on_sol" : "solana_tracker",
    apiBase: hasMadeOnSol ? CONFIG.madeOnSolApiBase : CONFIG.solanaTrackerApiBase,
    sources: {
      madeOnSol: hasMadeOnSol,
      solanaTracker: hasSolanaTracker,
      localWallet: Boolean(customWallet),
      solanaTrackerFallback: CONFIG.kolUseSolanaTrackerFallback,
      solanaTrackerPeriodEndpoint: CONFIG.solanaTrackerKolUsePeriodEndpoint
    },
    kolCount: 0,
    kols: [],
    rows: [],
    message: ""
  };

  try {
    if (customWallet) {
      const owner = parsePublicKey(customWallet).toBase58();
      const localPart = await fetchPublicWalletPositionSignals(owner, safeMode).catch((error) => ({
        rows: [],
        warnings: [friendlyError(error)]
      }));
      const madeRows = hasMadeOnSol
        ? await fetchMadeOnSolKolFeedSignals(safeMode, { kol: owner }).catch(() => [])
        : [];
      const solanaPositionRows = hasSolanaTracker
        ? await fetchKolWalletPositions(owner, safeMode)
          .then((positions) => positions
            .map((position) => normalizeKolPositionSignal(position, { wallet: owner, name: shortMint(owner) }, safeMode))
            .filter(Boolean))
          .catch(() => [])
        : [];
      const solanaRows = hasSolanaTracker && (!madeRows.length || CONFIG.kolUseSolanaTrackerFallback)
        ? await fetchKolWalletTradeSignals(owner, safeMode).catch(() => [])
        : [];
      const customCandidates = diversifyKolSignals(uniqueKolSignals([
        ...madeRows,
        ...solanaPositionRows,
        ...solanaRows,
        ...(localPart.rows || [])
      ]).sort(compareKolSignals), 36);
      const hydratedRows = diversifyKolSignals((await hydrateKolSignalMetadata(customCandidates)).sort(compareKolSignals), 24);
      const rows = rotateRowsForRefresh(hydratedRows, 12, scanState.refreshCount, { stickyCount: 1 });
      return {
        ...base,
        configured: true,
        source: hasMadeOnSol || hasSolanaTracker ? base.source : "wallet_scan",
        label: `Custom Wallet ${shortMint(owner)}`,
        description: "Current positions and recent buy-style trades from the wallet you entered.",
        wallet: owner,
        kolCount: 1,
        kols: [webKolSummaryRow({
          wallet: owner,
          name: shortMint(owner),
          trades: rows.length,
          volumeLabel: `${localPart.rows?.length || 0} current holding(s)`
        })],
        rows,
        localRows: localPart.rows?.length || 0,
        warnings: localPart.warnings || [],
        madeOnSolRows: madeRows.length,
        solanaTrackerRows: solanaRows.length + solanaPositionRows.length,
        refreshCount: scanState.refreshCount,
        copyWalletEnabled: hasSolanaTracker,
        copyScanIntervalMs: CONFIG.kolCopyScanIntervalMs,
        message: rows.length
          ? `Custom wallet loaded: ${localPart.rows?.length || 0} current holding(s), ${madeRows.length + solanaRows.length + solanaPositionRows.length} API signal(s).`
          : "No current token positions or recent buy-style trades found for this wallet."
      };
    }

    if (!base.configured) {
      return {
        ...base,
        message: "Live KOL lists are not connected yet. Use Scan Wallet to inspect a public wallet, or try again later."
      };
    }

    const madePart = hasMadeOnSol
      ? await buildMadeOnSolKolPart(safeMode).catch((error) => ({ rows: [], kols: [], error: formatError(error), calls: 1 }))
      : { rows: [], kols: [], calls: 0 };
    const shouldUseSolanaTracker = hasSolanaTracker && (!hasMadeOnSol || (CONFIG.kolUseSolanaTrackerFallback && madePart.rows.length < 4));
    const solanaPart = shouldUseSolanaTracker
      ? await buildSolanaTrackerKolPart(safeMode).catch((error) => ({ rows: [], kols: [], error: formatError(error), calls: 1, signalWalletsChecked: 0 }))
      : { rows: [], kols: [], calls: 0, signalWalletsChecked: 0 };

    const signalCandidates = diversifyKolSignals(uniqueKolSignals([
      ...(madePart.rows || []),
      ...(solanaPart.rows || [])
    ]).sort(compareKolSignals), 36);
    const sortedPool = diversifyKolSignals((await hydrateKolSignalMetadata(signalCandidates)).sort(compareKolSignals), 24);
    const sorted = rotateRowsForRefresh(sortedPool, 12, scanState.refreshCount, { stickyCount: 2 });
    const kols = uniqueKolSummaries([
      ...(madePart.kols || []),
      ...(solanaPart.kols || [])
    ]).slice(0, 12);
    const notes = [madePart.error ? `MadeOnSol: ${madePart.error}` : "", solanaPart.error ? `Solana Tracker: ${solanaPart.error}` : ""].filter(Boolean);

    return {
      ...base,
      kolCount: kols.length,
      kols,
      rows: sorted,
      madeOnSolRows: madePart.rows?.length || 0,
      solanaTrackerRows: solanaPart.rows?.length || 0,
      madeOnSolCalls: madePart.calls || 0,
      solanaTrackerCalls: solanaPart.calls || 0,
      signalWalletsChecked: solanaPart.signalWalletsChecked || 0,
      refreshCount: scanState.refreshCount,
      cacheTtlMs: Math.max(CONFIG.madeOnSolCacheTtlMs, CONFIG.solanaTrackerKolCacheTtlMs),
      periodEndpoint: CONFIG.solanaTrackerKolUsePeriodEndpoint,
      creditHint: kolCreditHint(solanaPart.signalWalletsChecked || 0, madePart.calls || 0, solanaPart.calls || 0),
      notes,
      message: sorted.length
        ? `KOL tracker refreshed with ${sorted.length} token signal(s).`
        : `KOL tracker refreshed. Try another mode or refresh again for new signals.`
    };
  } catch (error) {
    return {
      ...base,
      error: formatError(error),
      message: `KOL Tracker could not load ${kolModeLabel(safeMode)}: ${formatError(error)}`
    };
  }
}

function kolCreditHint(signalWalletsChecked, madeOnSolCalls = 0, solanaTrackerCalls = null) {
  const trackerCalls = solanaTrackerCalls === null
    ? 1 + Math.max(0, Number(signalWalletsChecked || 0))
    : Number(solanaTrackerCalls || 0);
  const parts = [];
  if (madeOnSolCalls) parts.push(`${madeOnSolCalls} MadeOnSol call(s), cache ${Math.round(CONFIG.madeOnSolCacheTtlMs / 1000)}s`);
  if (trackerCalls) parts.push(`${trackerCalls} Solana Tracker call(s), cache ${Math.round(CONFIG.solanaTrackerKolCacheTtlMs / 1000)}s`);
  if (!parts.length) return "KOL refresh complete.";
  return "KOL refresh complete.";
}

function uniqueKolSummaries(kols) {
  const seen = new Set();
  const rows = [];
  for (const kol of kols || []) {
    const key = kolSummaryIdentityKey(kol);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    rows.push(kol);
  }
  return rows;
}

function kolSummaryIdentityKey(kol = {}) {
  const wallet = firstString(kol.wallet, kol.owner, kol.address, kol.publicKey);
  if (wallet) return `wallet:${wallet}`;
  const twitter = stripAt(firstString(kol.twitter, kol.x, kol.username, deepFindKolTwitter(kol))).toLowerCase();
  if (twitter) return `x:${twitter}`;
  const name = String(firstString(kol.name, kol.kolName, kol.kol_name)).trim().toLowerCase();
  if (name && !/^(unknown kol|kol wallet|kol cluster|\d+\s+kols?)$/i.test(name)) return `name:${name}`;
  return "";
}

async function buildMadeOnSolKolPart(mode) {
  const safeMode = normalizeKolMode(mode);
  if (safeMode === "top" || safeMode === "consistent") {
    const kols = await fetchMadeOnSolKolLeaderboard(safeMode);
    return { rows: [], kols, calls: 1 };
  }

  const rows = safeMode === "hot"
    ? await fetchMadeOnSolHotKolTokens(safeMode)
    : await fetchMadeOnSolKolFeedSignals(safeMode);
  return {
    rows: rows.slice(0, 12),
    kols: uniqueKolSummaries(rows
      .filter((row) => row.kolWallet || row.twitter)
      .map((row) => webKolSummaryRow({
        wallet: row.kolWallet,
        name: row.kolName,
        twitter: row.twitter,
        avatar: row.avatar,
        lastTradeAt: row.lastTradeAt,
        trades: row.kolCount || null
      }))).slice(0, 12),
    calls: 1
  };
}

async function buildSolanaTrackerKolPart(mode) {
  const safeMode = normalizeKolMode(mode);
  const kols = await fetchKolLeaderboard(safeMode);
  const signals = [];
  const topKols = kols.slice(0, Math.min(CONFIG.solanaTrackerKolLimit, 12));
  const signalKols = topKols.slice(0, Math.min(CONFIG.solanaTrackerKolSignalLookups, topKols.length));

  await runWithConcurrency(signalKols, CONFIG.solanaTrackerKolPositionConcurrency, async (kol) => {
    const positions = await fetchKolWalletPositions(kol.wallet, safeMode).catch(() => []);
    for (const position of positions.slice(0, CONFIG.solanaTrackerKolPositionLimit)) {
      const signal = normalizeKolPositionSignal(position, kol, safeMode);
      if (signal) signals.push(signal);
    }
  });

  return {
    rows: uniqueKolSignals(signals).sort(compareKolSignals).slice(0, 12),
    kols: topKols.map((kol) => webKolSummaryRow(kol)),
    calls: 1 + signalKols.length,
    signalWalletsChecked: signalKols.length
  };
}

async function fetchPublicWalletPositionSignals(wallet, mode) {
  const owner = parsePublicKey(wallet).toBase58();
  const { accounts, warnings } = await getOwnedTokenAccountsWithWarningsCached(new PublicKey(owner), {
    ttlMs: Math.max(CONFIG.balanceCacheTtlMs, 15_000)
  });
  const tokens = sellableTokensFromAccounts(accounts)
    .filter((account) => account.mint && account.rawAmount > 0n && account.mint !== SOL_MINT)
    .slice(0, 20);
  const rows = tokens.map((token, index) => normalizePublicWalletPositionSignal(token, owner, mode, index));
  return { rows, warnings };
}

function normalizePublicWalletPositionSignal(token, wallet, mode, index = 0) {
  const numericAmount = Number(token.uiAmount || 0);
  const amountText = Number.isFinite(numericAmount) ? formatTokenAmount(numericAmount) : String(token.uiAmount || "0");
  const amountLabel = `${amountText} token${amountText === "1" ? "" : "s"}`;
  const score = Math.max(38, Math.min(78, 58 - Math.min(index, 10) + Math.min(10, Number(token.accountCount || 1))));
  return {
    tokenMint: token.mint,
    symbol: shortMint(token.mint),
    name: "Current wallet holding",
    score,
    signalType: "Wallet holding",
    kolWallet: wallet,
    kolName: shortMint(wallet),
    twitter: "",
    valueUsd: 0,
    valueLabel: amountLabel,
    amount: token.uiAmount,
    amountLabel,
    roiPct: null,
    roiLabel: "chart check",
    winRatePct: null,
    winRateLabel: "wallet scan",
    kolRoiPct: null,
    realizedLabel: `${token.accountCount || 1} account(s)`,
    lastTradeAt: null,
    dexUrl: dexScreenerUrl(token.mint),
    kolscanUrl: kolscanAccountUrl(wallet),
    source: "wallet_holding",
    sourceLabel: "On-chain wallet scan",
    mode: normalizeKolMode(mode)
  };
}

async function hydrateKolSignalMetadata(rows) {
  const signals = Array.isArray(rows) ? rows : [];
  const mints = [...new Set(signals
    .filter((row) => row?.tokenMint)
    .map((row) => row.tokenMint))]
    .slice(0, 30);
  const metadataByMint = mints.length
    ? await tokenMetadataMapForMints(mints, { timeoutMs: 2_500, pumpTimeoutMs: 1_200 }).catch(() => new Map())
    : new Map();

  return signals.map((row) => {
    const metadata = metadataByMint.get(row.tokenMint) || {};
    const symbol = meaningfulTokenText(row.symbol, row.tokenMint) || metadata.symbol || shortMint(row.tokenMint);
    const name = meaningfulTokenText(row.name, row.tokenMint) || metadata.name || (symbol !== shortMint(row.tokenMint) ? symbol : "Unknown Token");
    const volume = metadata.volume || {};
    const txns5m = metadata.txns?.m5 || {};
    const txnsH1 = metadata.txns?.h1 || {};
    const priceChange = metadata.priceChange || {};
    const marketCap = firstMeaningfulNumber(row.marketCap, metadata.marketCap, row.fdv, metadata.fdv) || 0;
    const fdv = firstMeaningfulNumber(row.fdv, metadata.fdv, marketCap) || 0;
    const liquidityUsd = firstMeaningfulNumber(row.liquidityUsd, metadata.liquidityUsd) || 0;
    const volume5m = firstMeaningfulNumber(row.volume5m, volume.m5) || 0;
    const volumeM15 = firstMeaningfulNumber(row.volumeM15, volume.m15, volume.m15m) || 0;
    const volumeM30 = firstMeaningfulNumber(row.volumeM30, volume.m30, volume.m30m) || 0;
    const volumeH1 = firstMeaningfulNumber(row.volumeH1, volume.h1) || 0;
    const volumeH24 = firstMeaningfulNumber(row.volumeH24, volume.h24, volume.d1) || 0;
    const primaryVolume = firstMeaningfulNumber(volumeM15, volumeM30, volumeH1, volume5m, volumeH24) || 0;
    const primaryVolumeLabel = formatUsdCompact(primaryVolume);
    const m5 = firstMeaningfulNumber(row.m5, priceChange.m5) || 0;
    const h1 = firstMeaningfulNumber(row.h1, priceChange.h1) || 0;
    const h6 = firstMeaningfulNumber(row.h6, priceChange.h6) || 0;
    const h24 = firstMeaningfulNumber(row.h24, priceChange.h24) || 0;
    const buys5m = firstMeaningfulNumber(row.buys5m, txns5m.buys) || 0;
    const sells5m = firstMeaningfulNumber(row.sells5m, txns5m.sells) || 0;
    const buysH1 = firstMeaningfulNumber(row.buysH1, txnsH1.buys) || 0;
    const sellsH1 = firstMeaningfulNumber(row.sellsH1, txnsH1.sells) || 0;
    const pairCreatedAt = firstMeaningfulNumber(normalizePairCreatedAt(row.pairCreatedAt), normalizePairCreatedAt(metadata.pairCreatedAt)) || null;
    const pairAgeSeconds = pairCreatedAt
      ? Math.max(0, Math.floor((Date.now() - pairCreatedAt) / 1000))
      : Number.isFinite(Number(row.pairAgeSeconds)) ? Number(row.pairAgeSeconds) : null;
    const pairAgeMinutes = Number.isFinite(Number(pairAgeSeconds))
      ? Math.floor(Number(pairAgeSeconds) / 60)
      : Number.isFinite(Number(row.pairAgeMinutes)) ? Number(row.pairAgeMinutes) : null;
    const isPump = Boolean(row.isPump) || isPumpStyleToken({
      tokenMint: row.tokenMint,
      symbol,
      name,
      source: row.source || metadata.source
    });
    const enriched = {
      ...row,
      symbol,
      name,
      imageUrl: firstString(row.imageUrl, metadata.imageUrl),
      websiteUrl: firstString(row.websiteUrl, metadata.websiteUrl),
      twitterUrl: firstString(row.twitterUrl, metadata.twitterUrl),
      telegramUrl: firstString(row.telegramUrl, metadata.telegramUrl),
      marketCap,
      fdv,
      marketCapLabel: formatUsdCompact(marketCap) || row.marketCapLabel || "n/a",
      fdvLabel: formatUsdCompact(fdv) || row.fdvLabel || "n/a",
      liquidityUsd,
      liquidityLabel: formatUsdCompact(liquidityUsd) || row.liquidityLabel || "n/a",
      volume5m,
      volume5mLabel: formatUsdCompact(volume5m) || row.volume5mLabel || "n/a",
      volumeM15,
      volumeM15Label: formatUsdCompact(volumeM15) || row.volumeM15Label || "",
      volumeM30,
      volumeM30Label: formatUsdCompact(volumeM30) || row.volumeM30Label || "",
      volumeH1,
      volumeH1Label: formatUsdCompact(volumeH1) || row.volumeH1Label || row.volumeLabel || "n/a",
      volumeH24,
      volumeH24Label: formatUsdCompact(volumeH24) || row.volumeH24Label || "",
      volumeLabel: row.volumeLabel && row.volumeLabel !== "n/a"
        ? row.volumeLabel
        : primaryVolumeLabel ? `${primaryVolumeLabel} vol` : "n/a",
      m5,
      h1,
      h6,
      h24,
      buys5m,
      sells5m,
      buysH1,
      sellsH1,
      txnsLabel: `${buys5m + buysH1}/${sells5m + sellsH1}`,
      pairCreatedAt,
      pairAgeSeconds,
      pairAgeMinutes,
      pairAgeLabel: Number.isFinite(Number(pairAgeSeconds)) ? formatLivePairAgeLabel(pairAgeSeconds, pairAgeMinutes) : row.pairAgeLabel,
      isPump,
      pumpUrl: row.pumpUrl || (isPump ? pumpFunUrl(row.tokenMint) : ""),
      valueLabel: row.valueLabel && row.valueLabel !== "n/a" ? row.valueLabel : primaryVolumeLabel ? `${primaryVolumeLabel} vol` : row.valueLabel,
      roiLabel: row.roiLabel && row.roiLabel !== "n/a" ? row.roiLabel : marketCap ? `MC ${formatUsdCompact(marketCap)}` : row.roiLabel,
      dexUrl: row.dexUrl || dexScreenerUrl(row.tokenMint),
      kolscanUrl: row.kolscanUrl || kolscanAccountUrl(row.kolWallet)
    };
    const bestPick = computeBestPickScore(enriched);
    return {
      ...enriched,
      bestPickScore: firstMeaningfulNumber(enriched.bestPickScore, bestPick.score) || bestPick.score,
      bestPickLabel: enriched.bestPickLabel || bestPick.label,
      bestPickInputs: enriched.bestPickInputs || bestPick.inputs,
      bestPickWarnings: enriched.bestPickWarnings || bestPick.warnings,
      scoreBreakdown: enriched.scoreBreakdown || bestPick.inputs,
      scoreWarnings: enriched.scoreWarnings || bestPick.warnings
    };
  }).filter((row) => !isPumpMayhemToken(row));
}

function needsKolMetadataHydration(row) {
  return !meaningfulTokenText(row.symbol, row.tokenMint)
    || !meaningfulTokenText(row.name, row.tokenMint)
    || row.name === "Unknown Token"
    || !row.imageUrl;
}

function parseNumericValue(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value).trim();
  if (!raw) return null;
  const compact = raw.replace(/[$,%_\s,]/g, "");
  const match = compact.match(/^([-+]?\d*\.?\d+)([kmb])?$/i);
  if (!match) return null;
  const number = Number(match[1]);
  if (!Number.isFinite(number)) return null;
  const suffix = String(match[2] || "").toLowerCase();
  if (suffix === "k") return number * 1_000;
  if (suffix === "m") return number * 1_000_000;
  if (suffix === "b") return number * 1_000_000_000;
  return number;
}

function firstMeaningfulNumber(...values) {
  const finite = [];
  for (const value of values) {
    const number = parseNumericValue(value);
    if (Number.isFinite(number)) finite.push(number);
  }
  return finite.find((number) => number !== 0) ?? finite[0] ?? null;
}

function meaningfulTokenText(value, tokenMint = "") {
  const text = String(value || "").trim();
  if (!text || /^unknown token$/i.test(text)) return "";
  if (tokenMint && text === shortMint(tokenMint)) return "";
  return text;
}

async function fetchMadeOnSolKolFeedSignals(mode, filters = {}) {
  const search = new URLSearchParams({
    limit: String(CONFIG.madeOnSolKolLimit),
    action: "buy"
  });
  if (filters.kol) {
    search.set("kol", filters.kol);
    search.set("wallet", filters.kol);
  }
  const data = await madeOnSolJson(`/kol/feed?${search.toString()}`, { cacheTtlMs: CONFIG.madeOnSolCacheTtlMs });
  return arrayFromApiData(data)
    .map((trade) => normalizeMadeOnSolKolTradeSignal(trade, mode))
    .filter(Boolean)
    .sort(compareKolSignals);
}

async function fetchMadeOnSolHotKolTokens(mode) {
  const search = new URLSearchParams({
    period: normalizeKolMode(mode) === "fresh" ? "1h" : "6h",
    min_kols: "1",
    limit: String(Math.min(CONFIG.madeOnSolKolLimit, 20))
  });
  const data = await madeOnSolJson(`/kol/tokens/hot?${search.toString()}`, { cacheTtlMs: CONFIG.madeOnSolCacheTtlMs });
  const rows = arrayFromApiData(data)
    .map((token) => normalizeMadeOnSolHotTokenSignal(token, mode))
    .filter(Boolean)
    .sort(compareKolSignals);
  return rows.length ? rows : fetchMadeOnSolKolFeedSignals(mode);
}

async function fetchMadeOnSolKolLeaderboard(mode) {
  const safeMode = normalizeKolMode(mode);
  const search = new URLSearchParams({
    period: safeMode === "consistent" ? "30d" : "7d",
    limit: String(Math.min(CONFIG.madeOnSolKolLimit, 20))
  });
  const data = await madeOnSolJson(`/kol/leaderboard?${search.toString()}`, { cacheTtlMs: CONFIG.madeOnSolCacheTtlMs });
  return arrayFromApiData(data)
    .map((row) => normalizeMadeOnSolLeaderboardKol(row))
    .filter((kol) => kol.wallet || kol.twitter)
    .map((kol) => webKolSummaryRow(kol));
}

async function madeOnSolJson(pathName, options = {}) {
  const url = `${CONFIG.madeOnSolApiBase}${pathName.startsWith("/") ? pathName : `/${pathName}`}`;
  const cacheTtlMs = Number(options.cacheTtlMs ?? CONFIG.madeOnSolCacheTtlMs);
  const cached = madeOnSolCache.get(url);
  if (cached && cacheTtlMs > 0 && Date.now() - cached.cachedAt < cacheTtlMs) {
    return cached.value;
  }

  const data = await fetchJson(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "solana-telegram-wallet-ops-bot",
      "Authorization": `Bearer ${CONFIG.madeOnSolApiKey}`,
      "x-api-key": CONFIG.madeOnSolApiKey
    },
    timeoutMs: options.timeoutMs || 6_500
  });
  madeOnSolCache.set(url, { cachedAt: Date.now(), value: data });
  return data;
}

function normalizeMadeOnSolKolTradeSignal(trade, mode) {
  const token = trade.token || trade.tokenInfo || trade.token_info || trade.metadata || {};
  const kol = trade.kol || trade.trader || trade.walletInfo || trade.wallet_info || {};
  const action = String(firstString(trade.action, trade.side, trade.type, "buy")).toLowerCase();
  if (action.includes("sell")) return null;
  const tokenMint = firstString(
    trade.tokenMint,
    trade.token_mint,
    trade.mint,
    trade.tokenAddress,
    trade.token_address,
    trade.address,
    token.mint,
    token.address,
    token.tokenAddress,
    token.token_address
  );
  if (!tokenMint || tokenMint === SOL_MINT) return null;
  const solAmount = firstNumber(trade.solAmount, trade.sol_amount, trade.amountSol, trade.amount_sol, trade.sizeSol, trade.size_sol);
  const usdValue = firstNumber(trade.valueUsd, trade.value_usd, trade.usdValue, trade.usd_value, trade.amountUsd, trade.amount_usd, trade.volumeUsd);
  const marketCap = firstNumber(trade.marketCapUsdAtTrade, trade.market_cap_usd_at_trade, trade.marketCap, trade.market_cap, trade.mc);
  const winRate = normalizePercentLike(firstNumber(
    trade.winRate,
    trade.win_rate,
    trade.winrate_7d,
    trade.kolWinRate,
    trade.kol_win_rate,
    kol.winRate,
    kol.win_rate
  ));
  const roiPct = normalizePercentLike(firstNumber(trade.roi, trade.roiPct, trade.roi_pct, kol.roi, kol.roiPct));
  const lastTradeAt = normalizeTimestamp(firstString(
    trade.tradedAt,
    trade.traded_at,
    trade.timestamp,
    trade.time,
    trade.createdAt,
    trade.created_at
  ));
  const score = scoreMadeOnSolSignal({
    solAmount,
    usdValue,
    winRate,
    roiPct,
    ageHours: hoursSince(lastTradeAt),
    mode
  });
  if (score < 35 && normalizeKolMode(mode) !== "fresh") return null;

  const kolWallet = firstString(trade.wallet, trade.walletAddress, trade.wallet_address, trade.kolWallet, trade.kol_wallet, kol.wallet, kol.wallet_address, kol.address);
  const kolTwitter = stripAt(firstString(trade.kolTwitter, trade.kol_twitter, trade.twitter, trade.x, trade.username, kol.twitter, kol.kol_twitter, kol.x, kol.username, twitterHandleFromUrl(kol.twitterUrl || kol.twitter_url || kol.xUrl || kol.x_url), deepFindKolTwitter(kol, trade)));
  const kolAvatar = firstString(
    trade.kolAvatar, trade.kol_avatar,
    deepFindKolAvatar(kol, trade.kol, trade.trader, trade.walletInfo, trade.wallet_info),
    trade.avatar, trade.avatarUrl, trade.avatar_url, trade.image, trade.imageUrl, trade.image_url,
    trade.profileImage, trade.profile_image, trade.profileImageUrl, trade.profile_image_url,
    trade.profilePic, trade.profile_pic, trade.pfp, trade.pfpUrl, trade.pfp_url
  );
  return {
    tokenMint,
    symbol: firstString(token.symbol, token.token_symbol, trade.tokenSymbol, trade.token_symbol, trade.symbol, trade.ticker, shortMint(tokenMint)),
    name: firstString(token.name, token.token_name, trade.tokenName, trade.token_name, trade.token_name_display, "Unknown Token"),
    imageUrl: firstString(token.image_uri, token.image, token.imageUrl, token.image_url, token.logoURI, token.logo, token.metadata?.image, trade.tokenImage, trade.token_image, trade.tokenImageUrl, trade.token_image_url),
    score,
    signalType: "MadeOnSol KOL buy",
    kolWallet,
    kolName: firstString(trade.kolName, trade.kol_name, trade.traderName, trade.trader_name, kol.name, kol.kol_name, kol.username, "KOL Wallet"),
    twitter: kolTwitter,
    avatar: kolAvatar,
    valueUsd: Number(usdValue || solAmount || 0),
    valueLabel: usdValue ? (formatUsdCompact(usdValue) || "$0") : solAmount ? `${formatCompactNumber(solAmount)} SOL` : "n/a",
    roiPct,
    roiLabel: roiPct !== null ? formatPercentNumber(roiPct) : marketCap ? `MC ${formatUsdCompact(marketCap)}` : "n/a",
    winRatePct: winRate,
    winRateLabel: formatPercentNumber(winRate),
    kolRoiPct: roiPct,
    realizedLabel: "n/a",
    lastTradeAt,
    dexUrl: dexScreenerUrl(tokenMint),
    kolscanUrl: kolscanAccountUrl(kolWallet),
    source: "made_on_sol_feed",
    sourceLabel: "MadeOnSol",
    mode: normalizeKolMode(mode)
  };
}

function normalizeMadeOnSolHotTokenSignal(tokenRow, mode) {
  const token = tokenRow.token || tokenRow.tokenInfo || tokenRow.token_info || tokenRow.metadata || {};
  const kolList = firstArray(
    tokenRow.kolsList,
    tokenRow.kols_list,
    tokenRow.kolWallets,
    tokenRow.kol_wallets,
    tokenRow.kols,
    tokenRow.wallets,
    tokenRow.buyers
  );
  const topKol = kolList[0];
  const topKolObject = topKol && typeof topKol === "object" ? topKol : {};
  const tokenMint = firstString(
    tokenRow.tokenMint,
    tokenRow.token_mint,
    tokenRow.mint,
    tokenRow.address,
    tokenRow.tokenAddress,
    tokenRow.token_address,
    token.mint,
    token.address,
    token.tokenAddress,
    token.token_address
  );
  if (!tokenMint || tokenMint === SOL_MINT) return null;
  const kolCount = firstNumber(
    tokenRow.kolCount,
    tokenRow.kol_count,
    tokenRow.kols_total,
    tokenRow.kolsRecent,
    tokenRow.kols_recent,
    Array.isArray(tokenRow.kols) ? tokenRow.kols.length : tokenRow.kols,
    kolList.length || null
  );
  const buySol = firstNumber(tokenRow.buySol, tokenRow.buy_sol, tokenRow.totalBuySol, tokenRow.total_buy_sol, tokenRow.netFlowSol, tokenRow.net_flow_sol);
  const volumeUsd = firstNumber(tokenRow.volumeUsd, tokenRow.volume_usd, tokenRow.volume, tokenRow.totalVolumeUsd, tokenRow.total_volume_usd);
  const marketCap = firstNumber(tokenRow.marketCap, tokenRow.market_cap, tokenRow.mc, token.marketCap, token.market_cap);
  const lastTradeAt = normalizeTimestamp(firstString(tokenRow.lastTradeAt, tokenRow.last_trade_at, tokenRow.updatedAt, tokenRow.updated_at, tokenRow.createdAt, tokenRow.created_at));
  const score = scoreMadeOnSolHotToken({ kolCount, buySol, volumeUsd, marketCap, ageHours: hoursSince(lastTradeAt), mode });
  if (score < 35 && normalizeKolMode(mode) !== "fresh") return null;
  const kolWallet = firstString(
    typeof topKol === "string" ? topKol : "",
    topKolObject.wallet,
    topKolObject.walletAddress,
    topKolObject.wallet_address,
    topKolObject.address,
    tokenRow.topKolWallet,
    tokenRow.top_kol_wallet
  );
  const kolName = kolWallet
    ? firstString(topKolObject.name, topKolObject.username, topKolObject.twitter, tokenRow.topKolName, tokenRow.top_kol_name, shortMint(kolWallet))
    : kolCount ? `${kolCount} KOL${Number(kolCount) === 1 ? "" : "s"}` : "KOL cluster";
  const topKolTwitter = stripAt(firstString(topKolObject.twitter, topKolObject.x, topKolObject.username, twitterHandleFromUrl(topKolObject.twitterUrl || topKolObject.twitter_url || topKolObject.xUrl || topKolObject.x_url), tokenRow.topKolTwitter, deepFindKolTwitter(topKolObject)));
  const topKolAvatar = firstString(
    deepFindKolAvatar(topKolObject),
    topKolObject.avatar, topKolObject.avatarUrl, topKolObject.avatar_url,
    topKolObject.image, topKolObject.imageUrl, topKolObject.image_url,
    topKolObject.profileImage, topKolObject.profile_image, topKolObject.profileImageUrl, topKolObject.profile_image_url,
    topKolObject.profilePic, topKolObject.profile_pic, topKolObject.pfp, topKolObject.pfpUrl, topKolObject.pfp_url,
    tokenRow.topKolAvatar, tokenRow.top_kol_avatar, tokenRow.topKolAvatarUrl, tokenRow.top_kol_avatar_url
  );
  return {
    tokenMint,
    symbol: firstString(token.symbol, token.token_symbol, tokenRow.tokenSymbol, tokenRow.token_symbol, tokenRow.symbol, tokenRow.ticker, shortMint(tokenMint)),
    name: firstString(token.name, token.token_name, tokenRow.tokenName, tokenRow.token_name, tokenRow.name, "Unknown Token"),
    imageUrl: firstString(token.image_uri, token.image, token.imageUrl, token.image_url, token.logoURI, token.logo, token.metadata?.image, tokenRow.tokenImage, tokenRow.token_image, tokenRow.tokenImageUrl, tokenRow.token_image_url),
    score,
    signalType: kolWallet ? "Hot KOL buy" : "Hot KOL cluster",
    kolWallet,
    kolName,
    kolCount,
    twitter: topKolTwitter,
    avatar: topKolAvatar,
    valueUsd: Number(volumeUsd || buySol || 0),
    valueLabel: volumeUsd ? (formatUsdCompact(volumeUsd) || "$0") : buySol ? `${formatCompactNumber(buySol)} SOL` : "n/a",
    roiPct: null,
    roiLabel: marketCap ? `MC ${formatUsdCompact(marketCap)}` : "n/a",
    winRatePct: null,
    winRateLabel: kolCount ? `${kolCount} KOL${Number(kolCount) === 1 ? "" : "s"}` : "n/a",
    kolRoiPct: null,
    realizedLabel: buySol ? `${formatCompactNumber(buySol)} SOL buys` : "n/a",
    lastTradeAt,
    dexUrl: dexScreenerUrl(tokenMint),
    kolscanUrl: kolscanAccountUrl(kolWallet),
    source: "made_on_sol_hot",
    sourceLabel: "MadeOnSol",
    mode: normalizeKolMode(mode)
  };
}

function normalizeMadeOnSolLeaderboardKol(row) {
  const profile = row.profile || row.identity || row.kol || row.walletInfo || row.wallet_info || {};
  const stats = row.stats || row.summary || row.performance || {};
  const wallet = firstString(row.wallet, row.walletAddress, row.wallet_address, row.address, profile.wallet, profile.address);
  const socials = row.socials || row.social || {};
  const profileSocials = profile.socials || profile.social || {};
  const twitter = stripAt(firstString(row.twitter, row.x, row.username, socials.twitter, socials.x, profile.twitter, profile.x, profile.username, profileSocials.twitter, profileSocials.x, twitterHandleFromUrl(row.twitterUrl || row.twitter_url || row.xUrl || row.x_url || profile.twitterUrl || profile.twitter_url || profile.xUrl || profile.x_url), deepFindKolTwitter(profile, row)));
  const buyCount = firstNumber(row.buyCount, row.buy_count, stats.buyCount, stats.buy_count);
  const sellCount = firstNumber(row.sellCount, row.sell_count, stats.sellCount, stats.sell_count);
  const pnlSol = firstNumber(row.pnl, row.realizedSol, row.realized_sol, stats.pnl, stats.realizedSol, stats.realized_sol);
  const volumeSol = firstNumber(row.volume, row.volumeSol, row.volume_sol, stats.volume, stats.volumeSol, stats.volume_sol);
  const trades = firstNumber(row.trades, row.tradeCount, row.trade_count, stats.trades, stats.tradeCount)
    ?? (Number.isFinite(Number(buyCount)) || Number.isFinite(Number(sellCount)) ? Number(buyCount || 0) + Number(sellCount || 0) : null);
  return {
    wallet,
    name: firstString(row.name, row.kolName, row.kol_name, profile.name, twitter, wallet ? shortMint(wallet) : "Unknown KOL"),
    twitter,
    avatar: firstString(deepFindKolAvatar(profile, row), row.avatar, row.avatarUrl, row.avatar_url, row.image, row.imageUrl, row.image_url, row.profileImage, row.profile_image, row.profileImageUrl, row.profile_image_url, row.profilePic, row.profile_pic, row.profilePicture, row.profile_picture, row.pfp, row.pfpUrl, row.pfp_url, profile.avatar, profile.avatarUrl, profile.avatar_url, profile.image, profile.imageUrl, profile.image_url, profile.profileImage, profile.profile_image, profile.profileImageUrl, profile.profile_image_url, profile.profilePic, profile.profile_pic, profile.profilePicture, profile.profile_picture, profile.pfp, profile.pfpUrl, profile.pfp_url),
    realizedUsd: firstNumber(row.realizedUsd, row.realized_usd, row.realized, row.pnlUsd, row.pnl_usd, stats.realizedUsd, stats.realized_usd, stats.realized),
    realizedLabel: pnlSol !== null ? `${formatCompactNumber(pnlSol)} SOL` : "",
    roiPct: normalizePercentLike(firstNumber(row.roi, row.roiPct, row.roi_pct, stats.roi, stats.roiPct, stats.roi_pct)),
    winRatePct: normalizePercentLike(firstNumber(row.winRate, row.win_rate, row.winrate, row.winPercentage, row.win_percentage, stats.winRate, stats.win_rate, stats.winPercentage)),
    trades,
    volumeLabel: volumeSol !== null ? `${formatCompactNumber(volumeSol)} SOL volume` : "",
    lastTradeAt: normalizeTimestamp(firstString(row.lastTradeAt, row.last_trade_at, row.lastTrade, stats.lastTradeAt, stats.last_trade_at))
  };
}

function scoreMadeOnSolSignal({ solAmount, usdValue, winRate, roiPct, ageHours, mode }) {
  const safeMode = normalizeKolMode(mode);
  let score = 52;
  const numericSol = Number(solAmount || 0);
  const numericUsd = Number(usdValue || 0);
  if (numericSol > 0) score += Math.min(18, Math.log10(Math.max(1, numericSol * 10)) * 8);
  if (numericUsd > 0) score += Math.min(18, Math.log10(Math.max(1, numericUsd)) * 3);
  if (Number.isFinite(Number(winRate))) score += Math.min(12, Math.max(0, Number(winRate)) / 7);
  if (Number.isFinite(Number(roiPct))) score += Math.min(10, Math.max(0, Number(roiPct)) / 30);
  if (Number.isFinite(ageHours)) {
    if (ageHours <= 1) score += 13;
    else if (ageHours <= 6) score += 8;
    else if (ageHours <= 24) score += 4;
  }
  if (safeMode === "fresh" && Number.isFinite(ageHours) && ageHours <= 6) score += 8;
  if (safeMode === "consistent" && Number(winRate || 0) >= 55) score += 7;
  return Math.round(Math.max(0, Math.min(100, score)));
}

function scoreMadeOnSolHotToken({ kolCount, buySol, volumeUsd, marketCap, ageHours, mode }) {
  const safeMode = normalizeKolMode(mode);
  let score = 50;
  score += Math.min(18, Math.max(0, Number(kolCount || 0)) * 5);
  if (Number(buySol || 0) > 0) score += Math.min(15, Math.log10(Math.max(1, Number(buySol) * 10)) * 6);
  if (Number(volumeUsd || 0) > 0) score += Math.min(14, Math.log10(Math.max(1, Number(volumeUsd))) * 2.5);
  if (Number.isFinite(Number(marketCap)) && Number(marketCap) > 0) {
    if (Number(marketCap) >= 5_000 && Number(marketCap) <= 500_000) score += 8;
    else if (Number(marketCap) <= 2_000_000) score += 4;
  }
  if (Number.isFinite(ageHours)) {
    if (ageHours <= 1) score += 12;
    else if (ageHours <= 6) score += 7;
    else if (ageHours <= 24) score += 3;
  }
  if (safeMode === "hot" && Number(kolCount || 0) >= 2) score += 6;
  if (safeMode === "fresh" && Number.isFinite(ageHours) && ageHours <= 3) score += 8;
  return Math.round(Math.max(0, Math.min(100, score)));
}

function twitterHandleFromUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const match = text.match(/(?:x\.com|twitter\.com)\/([^/?#]+)/i);
  return match ? stripAt(match[1]) : stripAt(text);
}

function deepFindKolAvatar(...values) {
  const keyPattern = /(avatar|pfp|profile.*(image|pic|photo|picture)|image.*url|photo.*url|picture.*url|avatar.*url)/i;
  for (const value of values) {
    const found = deepFindStringByKey(value, keyPattern, { preferUrl: true });
    const normalized = normalizeAvatarUrlCandidate(found);
    if (normalized) return normalized;
  }
  return "";
}

function deepFindKolTwitter(...values) {
  const keyPattern = /(^|_)(twitter|x|username|handle|screenname|screen_name)($|_)|twitter.*url|x.*url/i;
  for (const value of values) {
    const found = deepFindStringByKey(value, keyPattern, { preferUrl: false });
    const handle = twitterHandleFromUrl(found);
    if (handle && !/^https?$/i.test(handle)) return handle;
  }
  return "";
}

function deepFindStringByKey(value, keyPattern, options = {}, seen = new Set(), depth = 0) {
  if (!value || depth > 5) return "";
  if (typeof value !== "object") return "";
  if (seen.has(value)) return "";
  seen.add(value);

  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item])
    : Object.entries(value);

  for (const [key, child] of entries) {
    if (keyPattern.test(key) && child !== null && child !== undefined && typeof child !== "object") {
      const text = String(child).trim();
      if (text && (!options.preferUrl || /^(https?:)?\/\//i.test(text) || text.startsWith("data:image/"))) {
        return text;
      }
    }
  }

  for (const [, child] of entries) {
    const nested = deepFindStringByKey(child, keyPattern, options, seen, depth + 1);
    if (nested) return nested;
  }

  return "";
}

function normalizeAvatarUrlCandidate(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^data:image\//i.test(text)) return text;
  if (/^\/\//.test(text)) return `https:${text}`;
  if (/^https:\/\//i.test(text)) return text;
  if (/^http:\/\//i.test(text)) return text.replace(/^http:/i, "https:");
  return "";
}

function formatCompactNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  if (Math.abs(number) >= 1_000_000_000) return `${(number / 1_000_000_000).toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}B`;
  if (Math.abs(number) >= 1_000_000) return `${(number / 1_000_000).toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}M`;
  if (Math.abs(number) >= 1_000) return `${(number / 1_000).toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}K`;
  return number.toFixed(number >= 10 ? 2 : 4).replace(/0+$/, "").replace(/\.$/, "");
}

function webKolSummaryRow(kol = {}) {
  const wallet = firstString(kol.wallet, kol.owner, kol.address, kol.publicKey);
  const socials = kol.socials || kol.social || {};
  const twitter = stripAt(firstString(kol.twitter, kol.x, kol.username, socials.twitter, socials.x, twitterHandleFromUrl(kol.twitterUrl || kol.twitter_url || kol.xUrl || kol.x_url), deepFindKolTwitter(kol)));
  const name = firstString(kol.name, twitter, wallet ? shortMint(wallet) : "Unknown KOL");
  const realizedUsd = firstNumber(kol.realizedUsd, kol.realized_usd);
  const realizedLabel = firstString(
    kol.realizedLabel,
    realizedUsd !== null ? formatUsdCompact(realizedUsd) : "",
    kol.realizedSol !== undefined ? `${formatCompactNumber(kol.realizedSol)} SOL` : "",
    kol.pnl !== undefined ? `${formatCompactNumber(kol.pnl)} SOL` : "",
    "n/a"
  );
  const trades = Number.isFinite(Number(kol.trades))
    ? Number(kol.trades)
    : Number.isFinite(Number(kol.buyCount || kol.buy_count)) || Number.isFinite(Number(kol.sellCount || kol.sell_count))
      ? Number(kol.buyCount || kol.buy_count || 0) + Number(kol.sellCount || kol.sell_count || 0)
      : null;
  return {
    wallet,
    shortWallet: wallet ? shortMint(wallet) : "",
    name,
    twitter,
    avatar: firstString(deepFindKolAvatar(kol), kol.avatar, kol.avatarUrl, kol.avatar_url, kol.image, kol.imageUrl, kol.image_url, kol.profileImage, kol.profile_image, kol.profileImageUrl, kol.profile_image_url, kol.profilePic, kol.profile_pic, kol.profilePicture, kol.profile_picture, kol.pfp, kol.pfpUrl, kol.pfp_url),
    realizedUsd: Number(realizedUsd || 0),
    realizedLabel,
    roiPct: kol.roiPct ?? null,
    roiLabel: firstString(kol.roiLabel, formatPercentNumber(kol.roiPct)),
    winRatePct: kol.winRatePct ?? null,
    winRateLabel: firstString(kol.winRateLabel, formatPercentNumber(kol.winRatePct)),
    trades,
    volumeLabel: firstString(kol.volumeLabel, kol.volume !== undefined ? `${formatCompactNumber(kol.volume)} SOL volume` : ""),
    lastTradeAt: kol.lastTradeAt || null,
    solscanUrl: wallet ? `https://solscan.io/account/${wallet}` : "",
    kolscanUrl: kolscanAccountUrl(wallet)
  };
}

async function fetchKolLeaderboard(mode) {
  const params = kolLeaderboardParams(mode);
  const usePeriodEndpoint = Boolean(params.period && CONFIG.solanaTrackerKolUsePeriodEndpoint);
  const pathName = usePeriodEndpoint ? `/v2/pnl/leaderboard/kols/period` : `/v2/pnl/leaderboard/kols`;
  const search = new URLSearchParams();
  if (usePeriodEndpoint) search.set("period", params.period);
  search.set("sort", params.sort);
  search.set("direction", params.direction);
  search.set("limit", String(CONFIG.solanaTrackerKolLimit));
  const data = await solanaTrackerJson(`${pathName}?${search.toString()}`, { cacheTtlMs: CONFIG.solanaTrackerKolCacheTtlMs });
  return normalizeKolLeaderboard(data)
    .filter((kol) => kol.wallet)
    .slice(0, CONFIG.solanaTrackerKolLimit);
}

function kolLeaderboardParams(mode) {
  const safeMode = normalizeKolMode(mode);
  if (safeMode === "top") return { sort: "realized", direction: "desc" };
  if (safeMode === "consistent") return { period: "30d", sort: "win_percentage", direction: "desc" };
  if (safeMode === "fresh") return { period: "7d", sort: "last_trade", direction: "desc" };
  return CONFIG.solanaTrackerKolUsePeriodEndpoint
    ? { period: "1d", sort: "realized", direction: "desc" }
    : { sort: "value", direction: "desc" };
}

async function fetchKolWalletPositions(wallet, mode) {
  const search = new URLSearchParams({
    sort: normalizeKolMode(mode) === "fresh" ? "last_trade" : "value",
    direction: "desc",
    limit: String(CONFIG.solanaTrackerKolPositionLimit),
    filter: "holding"
  });
  const data = await solanaTrackerJson(`/v2/pnl/wallets/${encodeURIComponent(wallet)}/positions?${search.toString()}`, { cacheTtlMs: CONFIG.solanaTrackerKolCacheTtlMs });
  return arrayFromApiData(data).map((position) => normalizeKolPosition(position)).filter((position) => position.tokenMint);
}

async function fetchKolWalletTradeSignals(wallet, mode, options = {}) {
  const search = new URLSearchParams({ limit: String(options.limit || 15) });
  const data = await solanaTrackerJson(`/wallet/${encodeURIComponent(wallet)}/trades?${search.toString()}`, {
    cacheTtlMs: Number.isFinite(Number(options.cacheTtlMs)) ? Number(options.cacheTtlMs) : CONFIG.solanaTrackerKolCacheTtlMs
  });
  const trades = arrayFromApiData(data)
    .map((trade) => normalizeKolTradeSignal(trade, wallet, mode))
    .filter(Boolean);
  return uniqueKolSignals(trades).sort(compareKolSignals);
}

async function solanaTrackerJson(pathName, options = {}) {
  const url = `${CONFIG.solanaTrackerApiBase}${pathName.startsWith("/") ? pathName : `/${pathName}`}`;
  const cacheTtlMs = Number(options.cacheTtlMs ?? CONFIG.solanaTrackerCacheTtlMs);
  const cached = solanaTrackerCache.get(url);
  if (cached && cacheTtlMs > 0 && Date.now() - cached.cachedAt < cacheTtlMs) {
    return cached.value;
  }

  const data = await fetchJson(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "solana-telegram-wallet-ops-bot",
      "x-api-key": CONFIG.solanaTrackerApiKey
    },
    timeoutMs: options.timeoutMs || 6_500
  });
  solanaTrackerCache.set(url, { cachedAt: Date.now(), value: data });
  return data;
}

function normalizeKolLeaderboard(data) {
  return arrayFromApiData(data).map((row) => {
    const identity = row.identity || row.profile || row.kol || {};
    const stats = row.stats || row.summary || {};
    const pnl = row.pnl || row.profit || {};
    const counts = row.counts || row.count || {};
    const timing = row.timing || row.time || {};
    const period = row.period || row.periodStats || row.performance || {};
    const wallet = firstString(row.wallet, row.owner, row.address, row.publicKey, identity.wallet, identity.address);
    const socials = row.socials || row.social || {};
    const identitySocials = identity.socials || identity.social || {};
    const twitter = stripAt(firstString(identity.twitter, identity.x, identity.username, identitySocials.twitter, identitySocials.x, row.twitter, row.x, row.username, socials.twitter, socials.x, twitterHandleFromUrl(identity.twitterUrl || identity.twitter_url || identity.xUrl || identity.x_url || row.twitterUrl || row.twitter_url || row.xUrl || row.x_url), deepFindKolTwitter(identity, row)));
    const name = firstString(identity.name, row.name, twitter, wallet ? shortMint(wallet) : "Unknown KOL");
    return {
      wallet,
      name,
      twitter,
      avatar: firstString(deepFindKolAvatar(identity, row), identity.avatar, identity.avatarUrl, identity.avatar_url, identity.image, identity.imageUrl, identity.image_url, identity.profileImage, identity.profile_image, identity.profileImageUrl, identity.profile_image_url, identity.profilePic, identity.profile_pic, identity.profilePicture, identity.profile_picture, identity.pfp, identity.pfpUrl, identity.pfp_url, row.avatar, row.avatarUrl, row.avatar_url, row.image, row.imageUrl, row.image_url, row.profileImage, row.profile_image, row.profileImageUrl, row.profile_image_url, row.profilePic, row.profile_pic, row.profilePicture, row.profile_picture, row.pfp, row.pfpUrl, row.pfp_url),
      realizedUsd: firstNumber(
        row.realizedUsd,
        row.realized_usd,
        row.realized,
        row.realizedPnlUsd,
        row.pnlUsd,
        pnl.realized,
        pnl.realizedUsd,
        pnl.realized_usd,
        pnl.total,
        stats.realized,
        stats.realizedUsd,
        stats.realized_usd,
        period.realized
      ),
      roiPct: normalizePercentLike(firstNumber(
        row.roi,
        row.roiPct,
        row.roi_percentage,
        row.totalRoi,
        pnl.roi,
        pnl.roiPct,
        pnl.roi_percentage,
        stats.roi,
        stats.roiPct,
        stats.roi_percentage,
        period.roi
      )),
      winRatePct: normalizePercentLike(firstNumber(
        row.winPercentage,
        row.win_percentage,
        row.winRate,
        row.win_rate,
        stats.winPercentage,
        stats.win_percentage,
        stats.winRate,
        stats.win_rate,
        period.winRate,
        period.win_percentage
      )),
      trades: firstNumber(
        row.trades,
        row.tradeCount,
        row.totalTrades,
        counts.trades,
        counts.tradeCount,
        counts.totalTrades,
        stats.trades,
        stats.tradeCount,
        stats.totalTrades,
        period.trades
      ),
      lastTradeAt: normalizeTimestamp(firstString(
        row.lastTrade,
        row.last_trade,
        row.lastTradeAt,
        timing.lastTrade,
        timing.last_trade,
        timing.lastTradeAt,
        stats.lastTrade,
        stats.last_trade,
        stats.lastTradeAt,
        period.lastTrade
      ))
    };
  });
}

function normalizeKolPosition(position) {
  const tokenValue = position.token;
  const token = tokenValue && typeof tokenValue === "object" ? tokenValue : {};
  const meta = position.meta || position.metadata || position.tokenMeta || {};
  const pnl = position.pnl || position.profit || position.performance || {};
  const currentValue = position.current || position.value || position.position || position.balance || {};
  const current = currentValue && typeof currentValue === "object" ? currentValue : { value: currentValue };
  const timing = position.timing || {};
  const tokenMint = firstString(
    typeof tokenValue === "string" ? tokenValue : "",
    token.address,
    token.mint,
    token.tokenAddress,
    meta.address,
    meta.mint,
    meta.tokenAddress,
    position.tokenMint,
    position.mint,
    position.address
  );
  return {
    tokenMint,
    symbol: firstString(meta.symbol, token.symbol, position.symbol, position.ticker),
    name: firstString(meta.name, token.name, position.name),
    valueUsd: firstNumber(position.valueUsd, position.usdValue, current.valueUsd, current.usdValue, current.usd, current.value),
    amount: firstString(position.amount, position.balance, current.balance, current.amount, current.uiAmount),
    realizedUsd: firstNumber(pnl.realized, pnl.realizedUsd, pnl.realized_usd),
    unrealizedUsd: firstNumber(pnl.unrealized, pnl.unrealizedUsd, pnl.unrealized_usd),
    totalPnlUsd: firstNumber(pnl.total, pnl.totalUsd, pnl.total_usd, position.pnlUsd),
    roiPct: normalizePercentLike(firstNumber(pnl.roi, pnl.roiPct, pnl.roi_percentage, position.roi)),
    lastTradeAt: normalizeTimestamp(firstString(
      position.lastTrade,
      position.last_trade,
      position.lastTradeAt,
      timing.lastTrade,
      timing.last_trade,
      timing.lastTradeAt,
      current.lastTrade,
      current.last_trade,
      current.lastTradeAt
    ))
  };
}

function normalizeKolPositionSignal(position, kol, mode) {
  if (!position?.tokenMint || position.tokenMint === SOL_MINT) return null;
  const score = scoreKolSignal({ position, kol, mode });
  if (score < 35 && normalizeKolMode(mode) !== "fresh") return null;
  return {
    tokenMint: position.tokenMint,
    symbol: position.symbol || shortMint(position.tokenMint),
    name: position.name || "Unknown Token",
    imageUrl: firstString(position.imageUrl, position.image_url, position.image, position.logoURI, position.logo, position.metadata?.image),
    score,
    signalType: kolSignalType(position, mode),
    kolWallet: kol.wallet,
    kolName: kol.name || shortMint(kol.wallet),
    twitter: kol.twitter || "",
    avatar: kol.avatar || "",
    valueUsd: Number(position.valueUsd || 0),
    valueLabel: formatUsdCompact(Number(position.valueUsd || 0)) || "$0",
    roiPct: position.roiPct,
    roiLabel: formatPercentNumber(position.roiPct),
    winRatePct: kol.winRatePct,
    winRateLabel: formatPercentNumber(kol.winRatePct),
    kolRoiPct: kol.roiPct,
    realizedLabel: formatUsdCompact(kol.realizedUsd || 0) || "$0",
    lastTradeAt: position.lastTradeAt || kol.lastTradeAt || null,
    dexUrl: dexScreenerUrl(position.tokenMint),
    kolscanUrl: kolscanAccountUrl(kol.wallet),
    source: "kol_position",
    sourceLabel: "Solana Tracker",
    mode: normalizeKolMode(mode)
  };
}

function normalizeKolTradeSignal(trade, wallet, mode) {
  const from = trade.from || trade.input || trade.inputToken || {};
  const to = trade.to || trade.output || trade.outputToken || {};
  const type = String(trade.type || trade.side || "").toLowerCase();
  const fromMint = firstString(from.address, from.mint, from.tokenAddress, trade.fromMint);
  const toMint = firstString(to.address, to.mint, to.tokenAddress, trade.toMint);
  const looksBuy = type.includes("buy") || fromMint === SOL_MINT || trade.inputMint === SOL_MINT;
  const tokenMint = looksBuy ? (toMint || firstString(trade.tokenMint, trade.mint)) : "";
  if (!tokenMint || tokenMint === SOL_MINT) return null;
  const token = looksBuy ? to : (trade.token || {});
  const tokenInfo = token.token || token.meta || token.metadata || token;
  const usdValue = firstNumber(trade.valueUsd, trade.usdValue, trade.volumeUsd, trade.amountUsd, trade.usd, trade.volume?.usd);
  const score = Math.min(100, Math.max(40, Math.round(55 + Math.min(25, Number(usdValue || 0) / 200))));
  return {
    tokenMint,
    symbol: firstString(tokenInfo.symbol, trade.symbol, shortMint(tokenMint)),
    name: firstString(tokenInfo.name, trade.name, "Unknown Token"),
    imageUrl: firstString(tokenInfo.imageUrl, tokenInfo.image_url, tokenInfo.image, tokenInfo.image_uri, tokenInfo.logoURI, tokenInfo.logo, tokenInfo.metadata?.image),
    score,
    signalType: "Latest wallet buy",
    kolWallet: wallet,
    kolName: shortMint(wallet),
    twitter: "",
    valueUsd: Number(usdValue || 0),
    valueLabel: formatUsdCompact(Number(usdValue || 0)) || "$0",
    roiPct: null,
    roiLabel: "n/a",
    winRatePct: null,
    winRateLabel: "n/a",
    kolRoiPct: null,
    realizedLabel: "n/a",
    lastTradeAt: normalizeTimestamp(firstString(trade.time, trade.timestamp, trade.date, trade.createdAt)),
    dexUrl: dexScreenerUrl(tokenMint),
    kolscanUrl: kolscanAccountUrl(wallet),
    source: "kol_trade",
    sourceLabel: "Solana Tracker",
    mode: normalizeKolMode(mode)
  };
}

function scoreKolSignal({ position, kol, mode }) {
  const safeMode = normalizeKolMode(mode);
  const valueUsd = Number(position.valueUsd || 0);
  const winRate = Number(kol.winRatePct || 0);
  const kolRoi = Number(kol.roiPct || 0);
  const posRoi = Number(position.roiPct || 0);
  const ageHours = hoursSince(position.lastTradeAt || kol.lastTradeAt);
  let score = 48;
  score += Math.min(16, Math.max(0, winRate) / 5);
  score += Math.min(12, Math.max(0, kolRoi) / 20);
  score += Math.min(10, Math.max(0, posRoi) / 15);
  score += Math.min(10, Math.log10(Math.max(1, valueUsd)) * 2);
  if (Number.isFinite(ageHours)) {
    if (ageHours <= 2) score += 12;
    else if (ageHours <= 12) score += 7;
    else if (ageHours <= 48) score += 3;
  }
  if (safeMode === "consistent" && winRate >= 55) score += 8;
  if (safeMode === "fresh" && Number.isFinite(ageHours) && ageHours <= 24) score += 8;
  if (safeMode === "hot" && valueUsd >= 2_500) score += 5;
  return Math.round(Math.max(0, Math.min(100, score)));
}

function compareKolSignals(a, b) {
  return (kolSignalFreshnessRank(b) - kolSignalFreshnessRank(a))
    || (Number(b.bestPickScore || b.score || 0) - Number(a.bestPickScore || a.score || 0))
    || (Number(b.marketCap || b.fdv || 0) > 0 ? 1 : 0) - (Number(a.marketCap || a.fdv || 0) > 0 ? 1 : 0)
    || (Number(b.liquidityUsd || 0) > 0 ? 1 : 0) - (Number(a.liquidityUsd || 0) > 0 ? 1 : 0)
    || (Number(b.volumeH1 || b.valueUsd || 0) - Number(a.volumeH1 || a.valueUsd || 0))
    || (Date.parse(b.lastTradeAt || 0) - Date.parse(a.lastTradeAt || 0));
}

function kolSignalFreshnessRank(signal = {}) {
  const tradeHours = hoursSince(signal.lastTradeAt);
  if (Number.isFinite(tradeHours)) {
    if (tradeHours <= 1) return 12;
    if (tradeHours <= 6) return 9;
    if (tradeHours <= 24) return 6;
    if (tradeHours <= 72) return 2;
    return -8;
  }

  const createdAt = normalizePairCreatedAt(signal.pairCreatedAt);
  if (!createdAt && !Number.isFinite(Number(signal.pairAgeSeconds))) return 0;
  const ageMinutes = createdAt
    ? (Date.now() - createdAt) / 60_000
    : Number(signal.pairAgeSeconds) / 60;
  if (ageMinutes <= 60) return 10;
  if (ageMinutes <= 180) return 8;
  if (ageMinutes <= 1440) return 5;
  return -4;
}

function uniqueKolSignals(signals) {
  const seen = new Set();
  const rows = [];
  for (const signal of signals) {
    const key = `${signal.tokenMint}:${signal.kolWallet || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(signal);
  }
  return rows;
}

function diversifyKolSignals(signals, limit = 12) {
  const picked = [];
  const seenRows = new Set();
  const seenIdentities = new Set();

  for (const signal of signals || []) {
    const rowKey = kolSignalRowKey(signal);
    const identity = kolSignalIdentityKey(signal);
    if (seenRows.has(rowKey)) continue;
    if (identity && seenIdentities.has(identity)) continue;
    picked.push(signal);
    seenRows.add(rowKey);
    if (identity) seenIdentities.add(identity);
    if (picked.length >= limit) return picked;
  }

  for (const signal of signals || []) {
    const rowKey = kolSignalRowKey(signal);
    if (seenRows.has(rowKey)) continue;
    picked.push(signal);
    seenRows.add(rowKey);
    if (picked.length >= limit) break;
  }

  return picked;
}

function rowRotationIdentity(row = {}) {
  return String(
    row.tokenMint ||
    row.mint ||
    row.address ||
    row.pairAddress ||
    row.ca ||
    row.wallet ||
    row.name ||
    row.symbol ||
    ""
  ).trim().toLowerCase();
}

function rotateRowsForRefresh(rows = [], limit = 12, refreshCount = 0, options = {}) {
  const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
  const max = Math.max(0, Number(limit) || list.length);
  if (!max) return [];
  if (list.length <= max) return list.slice(0, max);

  const stickyCount = Math.min(
    Math.max(0, Number(options.stickyCount) || 0),
    Math.max(0, max - 1),
    list.length
  );
  const sticky = list.slice(0, stickyCount);
  const pool = list.slice(stickyCount);
  if (!pool.length) return sticky.slice(0, max);

  const offset = Math.abs(Number(refreshCount) || 0) % pool.length;
  const rotated = pool.slice(offset).concat(pool.slice(0, offset));
  const picked = [];
  const seen = new Set();

  for (const row of sticky.concat(rotated, pool)) {
    const key = rowRotationIdentity(row) || `row:${picked.length}`;
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(row);
    if (picked.length >= max) break;
  }

  return picked;
}

function kolSignalRowKey(signal = {}) {
  return `${signal.tokenMint || ""}:${signal.kolWallet || ""}:${signal.twitter || ""}:${signal.kolName || ""}`;
}

function kolSignalIdentityKey(signal = {}) {
  const wallet = firstString(signal.kolWallet, signal.wallet, signal.owner, signal.address);
  if (wallet) return `wallet:${wallet}`;
  const twitter = stripAt(firstString(signal.twitter, signal.x, signal.username)).toLowerCase();
  if (twitter) return `x:${twitter}`;
  const name = String(firstString(signal.kolName, signal.name)).trim().toLowerCase();
  if (name && !/^(unknown|unknown token|unknown kol|kol wallet|kol cluster|\d+\s+kols?)$/i.test(name)) return `name:${name}`;
  const tokenMint = firstString(signal.tokenMint);
  return tokenMint ? `token:${tokenMint}` : "";
}

function kolSignalType(position, mode) {
  const ageHours = hoursSince(position.lastTradeAt);
  if (normalizeKolMode(mode) === "fresh" || (Number.isFinite(ageHours) && ageHours <= 12)) {
    return "Fresh KOL position";
  }
  if (Number(position.roiPct || 0) > 0) return "KOL winning bag";
  return "KOL holding";
}

function normalizeKolMode(mode) {
  const value = String(mode || "hot").trim().toLowerCase();
  return ["hot", "top", "consistent", "fresh"].includes(value) ? value : "hot";
}

function kolModeLabel(mode) {
  return {
    hot: "Hot KOL Buys",
    top: "Top KOLs",
    consistent: "Consistent KOLs",
    fresh: "Fresh Activity"
  }[normalizeKolMode(mode)];
}

function kolModeDescription(mode) {
  return {
    hot: "Recent high-performing KOLs and the strongest current positions they are holding.",
    top: "Best ranked KOL wallets by realized performance, then their highest-value current token positions.",
    consistent: "KOLs ranked by consistency/win rate from the available leaderboard, then filtered into cleaner copyable positions.",
    fresh: "KOL wallets with the newest activity first, useful when you want faster signal flow."
  }[normalizeKolMode(mode)];
}

function arrayFromApiData(data) {
  if (Array.isArray(data)) return data;
  const keys = [
    "data",
    "items",
    "results",
    "traders",
    "kols",
    "leaderboard",
    "positions",
    "trades",
    "feed",
    "pairs",
    "tokens",
    "hotTokens",
    "hot_tokens",
    "kolTrades",
    "kol_trades",
    "alerts"
  ];
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  for (const containerKey of ["data", "result", "response"]) {
    const container = data?.[containerKey];
    if (Array.isArray(container)) return container;
    for (const key of keys) {
      if (Array.isArray(container?.[key])) return container[key];
    }
  }
  return [];
}

function firstString(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function firstNumber(...values) {
  for (const value of values) {
    const number = parseNumericValue(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function firstArray(...values) {
  for (const value of values) {
    if (Array.isArray(value)) return value;
  }
  return [];
}

function normalizePercentLike(value) {
  const number = parseNumericValue(value);
  if (!Number.isFinite(number)) return null;
  const raw = String(value ?? "");
  if (raw.includes("%")) return number;
  if (Math.abs(number) <= 1) return number * 100;
  return number;
}

function formatPercentNumber(value) {
  if (!Number.isFinite(Number(value))) return "n/a";
  return `${Number(value).toFixed(Math.abs(Number(value)) >= 100 ? 0 : 1)}%`;
}

function stripAt(value) {
  return String(value || "").trim().replace(/^@+/, "");
}

function normalizeTimestamp(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  if (/^\d+$/.test(text)) {
    const number = Number(text);
    if (!Number.isFinite(number)) return null;
    return new Date(number < 10_000_000_000 ? number * 1000 : number).toISOString();
  }
  return text;
}

function hoursSince(value) {
  const timestamp = Date.parse(value || "");
  if (!Number.isFinite(timestamp)) return null;
  return (Date.now() - timestamp) / 3_600_000;
}

async function webSniperScan(userId, mode) {
  const safeMode = normalizeSniperMode(mode);
  const settings = { ...sniperModeDefaults(safeMode), mode: safeMode };
  const scanState = nextSniperScanState(`web:${userId}`, safeMode);
  const usesEarlyPool = ["pumpsnipe", "moonshot"].includes(safeMode);
  const candidates = await fetchSniperCandidatesForMode(safeMode, { ttlMs: 750, scanState });
  const scored = [];
  const rotatedPool = usesEarlyPool
    ? rotatePumpSnipeCandidatePool(candidates, scanState)
    : rotateSniperCandidatePool(candidates, scanState);
  const scanPool = await hydrateSniperCandidates(rotatedPool);

  await runWithConcurrency(scanPool, Math.min(6, Math.max(3, CONFIG.balanceConcurrency)), async (candidate) => {
    try {
      scored.push(await scoreSniperCandidate(candidate, settings));
    } catch {
      // Ignore broken profile rows.
    }
  });

  const { qualifiedRows } = buildQualifiedSniperRows(scored, settings);
  const display = buildSniperModeDisplay(qualifiedRows, safeMode, scanState, { limit: 12 });
  const modeRows = display.modeRows;
  const rows = display.rows.slice(0, 12);
  rememberSniperScanRows(`web:${userId}`, safeMode, rows);

  return {
    mode: safeMode,
    label: sniperModeLabel(safeMode),
    refreshCount: scanState.refreshCount,
    scanned: scored.length,
    qualified: qualifiedRows.length,
    modeFit: modeRows.length,
    displayPool: display.displayRows.length,
    rows: rows.map(webSniperRow)
  };
}

async function webLivePairs(userId, bucket = "live", options = {}) {
  const safeBucket = normalizeLivePairBucket(bucket);
  const sort = String(options.sort || "best").toLowerCase();
  const force = Boolean(options.force);
  const cacheKey = `${safeBucket}:${sort}`;
  const cached = livePairsSharedCache.get(cacheKey) || { cachedAt: 0, value: null, promise: null };
  if (!force && CONFIG.livePairsSharedCacheMs > 0 && cached.value && Date.now() - cached.cachedAt < CONFIG.livePairsSharedCacheMs) {
    return cached.value;
  }

  if (!force && CONFIG.livePairsSharedCacheMs > 0 && cached.promise) {
    return cached.promise;
  }

  const promise = buildWebLivePairs(userId, safeBucket, { sort, force });
  if (CONFIG.livePairsSharedCacheMs > 0) {
    livePairsSharedCache.set(cacheKey, { ...cached, promise });
  }

  try {
    const value = await promise;
    if (CONFIG.livePairsSharedCacheMs > 0) {
      livePairsSharedCache.set(cacheKey, { cachedAt: Date.now(), value, promise: null });
    }
    return value;
  } catch (error) {
    if (cached.value) {
      const staleValue = {
        ...cached.value,
        stale: true,
        refreshError: error?.message || "Live feed refresh failed.",
        message: `Showing last good ${livePairBucketLabel(safeBucket)} feed. Refresh failed, retrying automatically.`
      };
      if (CONFIG.livePairsSharedCacheMs > 0) {
        livePairsSharedCache.set(cacheKey, { cachedAt: cached.cachedAt || Date.now(), value: staleValue, promise: null });
      }
      return staleValue;
    }
    throw error;
  } finally {
    const current = livePairsSharedCache.get(cacheKey);
    if (current?.promise === promise) {
      livePairsSharedCache.set(cacheKey, { ...current, promise: null });
    }
  }
}

async function buildWebLivePairs(userId, bucket = "live", options = {}) {
  const safeBucket = normalizeLivePairBucket(bucket);
  const sort = String(options.sort || "best").toLowerCase();
  const isLive = safeBucket === "live";
  const scanState = nextSniperScanState(`web:${userId}`, `livepairs:${safeBucket}`);
  const candidates = await fetchLivePairCandidates({
    ttlMs: isLive ? 800 : 2_000,
    timeoutMs: isLive ? 2_500 : 4_200,
    scanState,
    bucket: safeBucket,
    force: Boolean(options.force)
  });
  const baseRows = uniqueSniperScoreRows(candidates.map(livePairCandidateToRow).filter(Boolean))
    .sort(compareWebLivePairs)
    .slice(0, isLive ? 110 : 240);
  let enrichedRows = baseRows;
  if (safeBucket !== "live" || CONFIG.livePairsImageEnrich) {
    enrichedRows = await enrichWebLivePairsForImages(baseRows).catch(() => baseRows);
  }
  const targetLimit = livePairBucketLimit(safeBucket);
  let liveRows = uniqueSniperScoreRows(enrichedRows)
    .filter((row) => isWebLivePairCandidate(row, safeBucket))
    .sort((a, b) => compareWebLivePairs(a, b, sort));
  if (!isLive && liveRows.length < targetLimit) {
    const currentMints = new Set(liveRows.map((row) => row.tokenMint));
    const backfillRows = uniqueSniperScoreRows(enrichedRows)
      .filter((row) => !currentMints.has(row.tokenMint))
      .filter((row) => isLivePairInBucket(row, safeBucket))
      .filter((row) => isWebLivePairBackfillCandidate(row, safeBucket, { allowUnknownMarketCap: true }))
      .sort((a, b) => compareWebLivePairs(a, b, sort));
    liveRows = uniqueSniperScoreRows([...liveRows, ...backfillRows]).sort((a, b) => compareWebLivePairs(a, b, sort));
  }
  if (!isLive && liveRows.length < targetLimit) {
    const currentMints = new Set(liveRows.map((row) => row.tokenMint));
    const relaxedRows = uniqueSniperScoreRows(enrichedRows)
      .filter((row) => !currentMints.has(row.tokenMint))
      .filter((row) => isLivePairInRelaxedBucket(row, safeBucket))
      .filter((row) => isWebLivePairCandidate(row, safeBucket, { relaxedAge: true }))
      .sort((a, b) => compareWebLivePairs(a, b, sort));
    liveRows = uniqueSniperScoreRows([...liveRows, ...relaxedRows]).sort((a, b) => compareWebLivePairs(a, b, sort));
  }
  const safety = await maybeFilterWebLivePairsForSafety(liveRows, targetLimit);
  let rowsForSort = safety.rows;
  if (CONFIG.livePairsImageEnrich && safeBucket === "live") {
    rowsForSort = await enrichWebLivePairsForImages(safety.rows).catch(() => safety.rows);
  }
  const stickyCount = sort === "best" && safeBucket !== "live"
    ? Math.min(1, Math.max(0, Math.floor(targetLimit / 12)))
    : 0;
  const safeRows = rotateRowsForRefresh(
    sortLivePairs(rowsForSort, sort),
    targetLimit,
    scanState.refreshCount,
    { stickyCount }
  );
  rememberSniperScanRows(`web:${userId}`, `livepairs:${safeBucket}`, safeRows);

  return {
    label: livePairBucketLabel(safeBucket),
    bucket: safeBucket,
    sort,
    refreshCount: scanState.refreshCount,
    scanned: candidates.length,
    qualified: liveRows.length,
    rows: safeRows.map(webLivePairRow),
    refreshedAt: new Date().toISOString(),
    refreshSeconds: CONFIG.livePairsRefreshSeconds,
    message: safeRows.length
      ? livePairStatusMessage(safeRows.length, safety.stats, safeBucket)
      : `${livePairBucketLabel(safeBucket)} has no rows in this window yet. The feed keeps scanning and will fill as fresh pairs qualify.`
  };
}

function normalizeLivePairBucket(bucket) {
  return normalizeLivePairBucketCore(bucket);
}

function livePairBucketLabel(bucket) {
  const label = livePairBucketLabelCore(bucket);
  return label === "Live" ? "Live Pairs" : `${label} Pairs`;
}

function livePairBucketLimit(bucket) {
  return normalizeLivePairBucket(bucket) === "live" ? 18 : 30;
}

function livePairAgeMinutesValue(item) {
  return pairAgeMinutesFromData(item);
}

function isLivePairInBucket(item, bucket) {
  return isLivePairInBucketWindow(item, bucket);
}

function isLivePairInRelaxedBucket(item, bucket) {
  const safeBucket = normalizeLivePairBucket(bucket);
  const ageMinutes = livePairAgeMinutesValue(item);
  if (ageMinutes === null) return false;
  if (safeBucket === "under1h") return ageMinutes >= 5 && ageMinutes < 90;
  if (safeBucket === "under3h") return ageMinutes >= 30 && ageMinutes < 240;
  if (safeBucket === "under1d") return ageMinutes >= 60 && ageMinutes < 1440;
  return isLivePairInBucket(item, safeBucket);
}

function livePairMaxMarketCap(bucket) {
  const maxByBucket = {
    live: 750_000,
    under1h: 1_000_000,
    under3h: 1_500_000,
    under1d: 2_000_000
  };
  return maxByBucket[normalizeLivePairBucket(bucket)] || maxByBucket.live;
}

function livePairCandidateToRow(candidate) {
  if (!candidate?.tokenMint) return null;
  const profile = candidate.metadata || candidate.profile || {};
  const pairCreatedAt = livePairCandidateCreatedAt(candidate);
  const pairAgeSeconds = pairCreatedAt ? Math.max(0, Math.floor((Date.now() - Number(pairCreatedAt)) / 1000)) : null;
  const volumeObject = typeof profile.volume === "object" && profile.volume !== null ? profile.volume : {};
  const volumeNumber = typeof profile.volume === "object" ? null : firstNumber(profile.volume);
  const marketCap = firstMeaningfulNumber(
    profile.marketCap,
    profile.usd_market_cap,
    profile.usdMarketCap,
    profile.market_cap,
    profile.mcap,
    profile.mc,
    profile.fdv,
    profile.fdvUsd,
    profile.fdv_usd
  ) || 0;
  const liquidityUsd = firstMeaningfulNumber(
    profile.liquidityUsd,
    profile.liquidityUSD,
    profile.currentLiquidityUsd,
    profile.current_liquidity_usd,
    profile.poolLiquidityUsd,
    profile.liquidity_usd,
    profile.liquidity?.usd,
    profile.liquidity
  ) || 0;
  const volume5m = firstMeaningfulNumber(volumeObject.m5, volumeObject["5m"], profile.volume5m, profile.volume_5m, profile.volumeM5) || 0;
  const volumeM15 = firstMeaningfulNumber(volumeObject.m15, volumeObject.m15m, volumeObject["15m"], profile.volume15m, profile.volume_15m, profile.volumeM15) || 0;
  const volumeM30 = firstMeaningfulNumber(volumeObject.m30, volumeObject.m30m, volumeObject["30m"], profile.volume30m, profile.volume_30m, profile.volumeM30) || 0;
  const volumeH1 = firstMeaningfulNumber(volumeObject.h1, volumeObject["1h"], profile.volumeH1, profile.volume_h1, profile.volume_1h, volumeNumber) || 0;
  const volumeH24 = firstMeaningfulNumber(volumeObject.h24, volumeObject.d1, volumeObject["24h"], profile.volume24h, profile.volume_h24, profile.volume_24h, profile.volumeH24) || 0;
  const m5 = normalizePercentLike(profile.priceChange?.m5 ?? profile.price_change_m5 ?? profile.m5) || 0;
  const h1 = normalizePercentLike(profile.priceChange?.h1 ?? profile.price_change_h1 ?? profile.h1) || 0;
  const txns5m = profile.txns?.m5 || profile.transactions?.m5 || {};
  const txnsH1 = profile.txns?.h1 || profile.transactions?.h1 || {};
  const buys5m = Number(firstNumber(txns5m.buys, profile.buys5m, profile.buys_5m) || 0);
  const sells5m = Number(firstNumber(txns5m.sells, profile.sells5m, profile.sells_5m) || 0);
  const buysH1 = Number(firstNumber(txnsH1.buys, profile.buysH1, profile.buys_h1, profile.buys) || 0);
  const sellsH1 = Number(firstNumber(txnsH1.sells, profile.sellsH1, profile.sells_h1, profile.sells) || 0);
  const buyPressure = buyPressureRatio(buys5m + buysH1, sells5m + sellsH1);
  const sniperCount = Number(firstNumber(
    profile.sniperCount,
    profile.snipers,
    profile.sniper_count,
    profile.sniperWallets,
    profile.sniper_wallets
  ) || 0);
  const bondingProgressPct = firstMeaningfulNumber(
    profile.bondingProgressPct,
    profile.bondingProgress,
    profile.bonding_curve_progress,
    profile.bondingCurveProgress,
    profile.pumpProgress,
    profile.graduationProgress,
    profile.completion,
    profile.completePct
  ) || 0;
  const source = candidate.source || "live";
  const symbol = firstString(profile.symbol, profile.ticker) || shortMint(candidate.tokenMint);
  const name = firstString(profile.name) || "Fresh Launch";
  const imageUrl = firstString(
    profile.imageUrl,
    profile.image_url,
    profile.icon,
    profile.image,
    profile.image_uri,
    profile.logoURI,
    profile.logo,
    profile.metadata?.image
  );
  const websiteUrl = firstString(profile.websiteUrl, profile.website_url, profile.website, profile.url, profile.links?.website);
  const twitterUrl = firstString(profile.twitterUrl, profile.twitter_url, profile.twitter, profile.xUrl, profile.links?.twitter, profile.links?.x);
  const telegramUrl = firstString(profile.telegramUrl, profile.telegram_url, profile.telegram, profile.links?.telegram);
  const dexId = firstString(profile.dexId, profile.dexName, profile.market, profile.platform);
  const dexName = firstString(profile.dexName, dexId);
  const pairAddress = firstString(profile.pairAddress, profile.address);
  const pairUrl = firstString(profile.pairUrl, profile.url);
  const raydiumPool = firstString(profile.raydiumPool, profile.raydium_pool, profile.poolAddress);
  const isPump = String(source).toLowerCase().includes("pump") || isPumpStyleToken({
    tokenMint: candidate.tokenMint,
    symbol,
    name,
    source,
    dexId,
    dexName
  });
  const graduated = Boolean(
    profile.graduated
    || profile.isGraduated
    || profile.bonded
    || profile.isBonded
    || profile.complete
    || profile.completed
    || profile.bondingComplete
    || raydiumPool
    || (isPump && /\b(raydium|meteora|orca)\b/i.test(`${dexId} ${dexName} ${source}`))
  );

  const row = {
    tokenMint: candidate.tokenMint,
    symbol,
    name,
    score: 0,
    category: source === "photon" ? "Photon Live" : String(source).includes("pump") ? "Pump Live" : "Live Pair",
    rugRisk: "check",
    exitRisk: "check",
    manipulationScore: "check",
    liquidityUsd,
    volume5m,
    volumeM15,
    volumeM30,
    volumeH1,
    volumeH24,
    buyPressure,
    buys5m,
    sells5m,
    buysH1,
    sellsH1,
    scalpSetup: "Fresh launch",
    scalpScore: 0,
    modeRelevance: 0,
    marketCap,
    m5,
    h1,
    h6: 0,
    h24: 0,
    narrative: 0,
    pairCreatedAt,
    pairAgeSeconds,
    pairAgeMinutes: pairAgeSeconds === null ? null : Math.floor(pairAgeSeconds / 60),
    riskFlags: [],
    momentum: volume5m > 0 || volumeH1 > 0 ? "Fresh flow" : "Just listed",
    smartMoney: "Live",
    reasons: [],
    source,
    imageUrl,
    websiteUrl,
    twitterUrl,
    telegramUrl,
    dexId,
    dexName,
    pairAddress,
    pairUrl,
    sniperCount,
    bondingProgressPct,
    graduated,
    isGraduated: graduated,
    raydiumPool,
    isPump,
    pumpUrl: isPump ? pumpFunUrl(candidate.tokenMint) : ""
  };
  if (isPumpMayhemToken({ ...row, profile: candidate.profile })) {
    return null;
  }
  const bestPick = computeBestPickScore(row);
  return {
    ...row,
    slimeScopeCategory: classifySlimeScopePair(row),
    bestPickScore: bestPick.score,
    bestPickLabel: bestPick.label,
    bestPickInputs: bestPick.inputs,
    bestPickWarnings: bestPick.warnings,
    reasons: bestPick.warnings.length ? bestPick.warnings : row.reasons
  };
}

function livePairStatusMessage(count, stats = {}, bucket = "live") {
  const label = livePairBucketLabel(bucket);
  if (stats.relaxedAge) {
    return `${label}: ${count} nearby pair(s). Auto-refreshing with the closest fresh matches.`;
  }
  if (stats.rpcSafetySkipped) {
    return `${label}: ${count} live pair(s). Auto-refreshing.`;
  }
  const pending = Number(stats.pending || 0);
  if (pending > 0) {
    return `${label}: ${count} pair(s). ${pending} still settling while the feed keeps updating.`;
  }
  return `${label}: ${count} pair(s). Auto-refreshing.`;
}

async function maybeFilterWebLivePairsForSafety(rows, limit = 12) {
  if (CONFIG.livePairsRpcSafety) {
    return filterWebLivePairsForSafety(rows, limit);
  }

  const limited = uniqueSniperScoreRows(rows)
    .sort(compareWebLivePairs)
    .slice(0, limit)
    .map((row) => ({
      ...row,
      safetyNote: "Trade safety runs before buy"
    }));

  return {
    rows: limited,
    stats: {
      checked: 0,
      accepted: 0,
      pending: 0,
      blocked: 0,
      token2022: 0,
      rpcSafetySkipped: true
    }
  };
}

async function enrichWebLivePairsForImages(rows) {
  if (!rows.length) return rows;
  const pairs = await fetchDexScreenerTokenPairsBatch(rows.map((row) => row.tokenMint), { timeoutMs: 2_500 }).catch(() => []);
  const enriched = [...rows];

  await runWithConcurrency(rows.map((row, index) => ({ row, index })), 4, async ({ row, index }) => {
    const dexMeta = metadataFromDexPair(row.tokenMint, bestDexPairForToken(row.tokenMint, pairs));
    let imageUrl = firstString(dexMeta.imageUrl, row.imageUrl);
    let symbol = firstString(dexMeta.symbol, row.symbol);
    let name = firstString(dexMeta.name, row.name);
    let marketCap = firstNumber(dexMeta.marketCap, row.marketCap) || 0;
    let liquidityUsd = firstNumber(dexMeta.liquidityUsd, row.liquidityUsd) || 0;
    let volume5m = firstNumber(dexMeta.volume?.m5, row.volume5m) || 0;
    let volumeM15 = firstNumber(dexMeta.volume?.m15, dexMeta.volume?.m15m, row.volumeM15) || 0;
    let volumeM30 = firstNumber(dexMeta.volume?.m30, dexMeta.volume?.m30m, row.volumeM30) || 0;
    let volumeH1 = firstNumber(dexMeta.volume?.h1, row.volumeH1) || 0;
    let volumeH24 = firstNumber(dexMeta.volume?.h24, dexMeta.volume?.d1, row.volumeH24) || 0;
    let pairCreatedAt = firstNumber(dexMeta.pairCreatedAt, row.pairCreatedAt) || null;
    const websiteUrl = firstString(dexMeta.websiteUrl, row.websiteUrl);
    const twitterUrl = firstString(dexMeta.twitterUrl, row.twitterUrl);
    const telegramUrl = firstString(dexMeta.telegramUrl, row.telegramUrl);
    let dexId = firstString(dexMeta.dexId, row.dexId, row.dexName);
    let dexName = firstString(dexMeta.dexName, row.dexName, dexId);
    let pairAddress = firstString(dexMeta.pairAddress, row.pairAddress);
    let pairUrl = firstString(dexMeta.pairUrl, row.pairUrl);
    let raydiumPool = firstString(dexMeta.raydiumPool, row.raydiumPool);
    let bondingProgressPct = firstMeaningfulNumber(dexMeta.bondingProgressPct, row.bondingProgressPct, row.bondingProgress) || 0;
    let graduated = Boolean(row.graduated || row.isGraduated || dexMeta.graduated || dexMeta.isGraduated || isGraduatedSlimeScopePair({ ...row, ...dexMeta }));

    if (webLivePairIsPump(row) && (!imageUrl || !marketCap || !liquidityUsd || !volumeH1 || !volumeM15 || !bondingProgressPct || !graduated)) {
      const pumpMeta = await getPumpFunTokenMetadata(row.tokenMint, { timeoutMs: 1_800 }).catch(() => ({}));
      imageUrl = firstString(pumpMeta.imageUrl, imageUrl);
      symbol = symbol && symbol !== shortMint(row.tokenMint) ? symbol : firstString(pumpMeta.symbol, symbol);
      name = name && name !== "Fresh Launch" ? name : firstString(pumpMeta.name, name);
      marketCap = Number(marketCap) > 0 ? marketCap : firstMeaningfulNumber(pumpMeta.marketCap, marketCap) || 0;
      liquidityUsd = Number(liquidityUsd) > 0 ? liquidityUsd : firstMeaningfulNumber(pumpMeta.liquidityUsd, liquidityUsd) || 0;
      volume5m = Number(volume5m) > 0 ? volume5m : firstMeaningfulNumber(pumpMeta.volume?.m5, volume5m) || 0;
      volumeM15 = Number(volumeM15) > 0 ? volumeM15 : firstMeaningfulNumber(pumpMeta.volume?.m15, volumeM15) || 0;
      volumeM30 = Number(volumeM30) > 0 ? volumeM30 : firstMeaningfulNumber(pumpMeta.volume?.m30, volumeM30) || 0;
      volumeH1 = Number(volumeH1) > 0 ? volumeH1 : firstMeaningfulNumber(pumpMeta.volume?.h1, volumeH1) || 0;
      volumeH24 = Number(volumeH24) > 0 ? volumeH24 : firstMeaningfulNumber(pumpMeta.volume?.h24, volumeH24) || 0;
      pairCreatedAt = firstNumber(pairCreatedAt, pumpMeta.pairCreatedAt) || null;
      bondingProgressPct = Number(bondingProgressPct) > 0 ? bondingProgressPct : firstMeaningfulNumber(pumpMeta.bondingProgressPct, bondingProgressPct) || 0;
      graduated = Boolean(graduated || pumpMeta.graduated || pumpMeta.isGraduated);
      raydiumPool = firstString(raydiumPool, pumpMeta.raydiumPool);
    }

    const pairAgeSeconds = pairCreatedAt ? Math.max(0, Math.floor((Date.now() - Number(pairCreatedAt)) / 1000)) : row.pairAgeSeconds;
    const isPump = webLivePairIsPump({ ...row, symbol, name });
    const scopeProbe = {
      ...row,
      dexId,
      dexName,
      marketCap,
      bondingProgressPct,
      graduated,
      isGraduated: graduated,
      raydiumPool,
      isPump
    };
    graduated = Boolean(graduated || isGraduatedSlimeScopePair(scopeProbe));

    const nextRow = {
      ...row,
      symbol,
      name,
      imageUrl,
      websiteUrl,
      twitterUrl,
      telegramUrl,
      marketCap,
      liquidityUsd,
      volume5m,
      volumeM15,
      volumeM30,
      volumeH1,
      volumeH24,
      pairCreatedAt,
      pairAgeSeconds,
      pairAgeMinutes: Number.isFinite(Number(pairAgeSeconds)) ? Math.floor(Number(pairAgeSeconds) / 60) : row.pairAgeMinutes,
      isPump,
      pumpUrl: isPump ? pumpFunUrl(row.tokenMint) : "",
      dexId,
      dexName,
      pairAddress,
      pairUrl,
      raydiumPool,
      bondingProgressPct: slimeScopeProgressPct({ ...scopeProbe, bondingProgressPct }),
      graduated,
      isGraduated: graduated
    };
    nextRow.slimeScopeCategory = classifySlimeScopePair(nextRow);
    if (isPumpMayhemToken({ ...row, ...nextRow, metadata: dexMeta })) {
      enriched[index] = null;
      return;
    }
    const bestPick = computeBestPickScore(nextRow);
    enriched[index] = {
      ...nextRow,
      bestPickScore: bestPick.score,
      bestPickLabel: bestPick.label,
      bestPickInputs: bestPick.inputs,
      bestPickWarnings: bestPick.warnings
    };
  });

  return enriched.filter(Boolean);
}

function webLivePairIsPump(row) {
  return Boolean(row?.isPump)
    || String(row?.source || "").toLowerCase().includes("pump")
    || String(row?.category || "").toLowerCase().includes("pump")
    || isPumpStyleToken(row);
}

function isKnownBelowExitFloor(item) {
  const marketCap = Number(item?.marketCap || 0);
  const liquidityUsd = Number(item?.liquidityUsd || 0);
  const hasMarketCap = marketCap > 0;
  const hasLiquidity = liquidityUsd > 0;
  if (hasMarketCap && marketCap < CONFIG.minExitMarketCapUsd) return true;
  if (hasLiquidity && liquidityUsd < CONFIG.minExitLiquidityUsd) return true;
  return false;
}

function isWebLivePairCandidate(item, bucket = "live", options = {}) {
  const flags = new Set(item.riskFlags || []);
  const safeBucket = normalizeLivePairBucket(bucket);
  const ageSeconds = Number(item.pairAgeSeconds);
  const ageMinutes = Number(item.pairAgeMinutes);
  const marketCap = Number(item.marketCap || 0);
  const minMarketCap = safeBucket === "live" ? 0 : 7_000;
  const maxMarketCap = livePairMaxMarketCap(safeBucket);
  const marketCapOk = safeBucket === "live"
    ? (!marketCap || marketCap <= maxMarketCap)
    : marketCap >= minMarketCap && marketCap <= maxMarketCap;
  const hasFreshActivity = Number(item.volume5m || 0) > 0
    || Number(item.volumeH1 || 0) > 0
    || Number(item.liquidityUsd || 0) > 0
    || Number.isFinite(ageSeconds) && ageSeconds <= 300
    || isPumpStyleToken(item);
  const ageOk = options.relaxedAge ? isLivePairInRelaxedBucket(item, safeBucket) : isLivePairInBucket(item, safeBucket);
  return ageOk
    && marketCapOk
    && hasFreshActivity
    && !isPumpMayhemToken(item)
    && !isKnownBelowExitFloor(item)
    && !flags.has("hard dump")
    && !flags.has("sell pressure");
}

function isWebLivePairBackfillCandidate(item, bucket = "live", options = {}) {
  const flags = new Set(item.riskFlags || []);
  const safeBucket = normalizeLivePairBucket(bucket);
  const marketCap = Number(item.marketCap || 0);
  const liquidityUsd = Number(item.liquidityUsd || 0);
  const volume5m = Number(item.volume5m || 0);
  const volumeH1 = Number(item.volumeH1 || 0);
  const maxMarketCap = livePairMaxMarketCap(safeBucket);
  const hasMarketCap = marketCap > 0;
  const marketCapOk = options.allowUnknownMarketCap
    ? (!hasMarketCap || marketCap <= maxMarketCap)
    : marketCap >= 7_000 && marketCap <= maxMarketCap;
  const activityOk = volume5m > 0 || volumeH1 > 0 || liquidityUsd > 0 || isPumpStyleToken(item);
  return marketCapOk
    && activityOk
    && !isPumpMayhemToken(item)
    && !isKnownBelowExitFloor(item)
    && !flags.has("hard dump")
    && !flags.has("sell pressure");
}

function compareWebLivePairs(a, b, sort = "best") {
  const sorted = sortLivePairs([a, b], sort);
  if (sorted[0] === b) return 1;
  if (sorted[0] === a) return -1;
  const aCreated = Number(a.pairCreatedAt || 0);
  const bCreated = Number(b.pairCreatedAt || 0);
  return (bCreated - aCreated)
    || (pumpFreshnessScore(b) - pumpFreshnessScore(a))
    || (Number(b.volume5m || 0) - Number(a.volume5m || 0))
    || (Number(b.volumeH1 || 0) - Number(a.volumeH1 || 0))
    || (b.scalpScore - a.scalpScore)
    || (b.score - a.score)
    || (a.rugRisk - b.rugRisk);
}

async function filterWebLivePairsForSafety(rows, limit = 12) {
  const accepted = [];
  const pending = [];
  const stats = {
    checked: 0,
    accepted: 0,
    pending: 0,
    blocked: 0,
    token2022: 0
  };
  const candidates = rows.slice(0, Math.max(limit * 4, 32));

  await runWithConcurrency(candidates, Math.min(8, Math.max(3, CONFIG.balanceConcurrency)), async (row) => {
    try {
      const safety = await getMintSafetyInfo(row.tokenMint);
      stats.checked += 1;
      if (safety.tokenProgram === TOKEN_2022_PROGRAM_ID.toBase58()) stats.token2022 += 1;
      if (safety.freezeAuthority || safety.mintAuthority) {
        stats.blocked += 1;
        return;
      }
      accepted.push({
        ...row,
        safetyNote: safety.tokenProgram === TOKEN_2022_PROGRAM_ID.toBase58()
          ? "Token-2022 mint/freeze clear"
          : "Mint/freeze safety passed"
      });
      stats.accepted += 1;
    } catch {
      pending.push({
        ...row,
        safetyNote: "Mint check pending; trade precheck still runs before buy"
      });
      stats.pending += 1;
    }
  });

  const combined = uniqueSniperScoreRows([...accepted, ...pending]).sort(compareWebLivePairs).slice(0, limit);
  return { rows: combined, stats };
}

function webLivePairRow(row) {
  const bestPick = row.bestPickScore ? {
    score: row.bestPickScore,
    label: row.bestPickLabel || "",
    inputs: row.bestPickInputs || {},
    warnings: row.bestPickWarnings || []
  } : computeBestPickScore(row);
  return {
    ...webSniperRow(row),
    pairAgeLabel: formatLivePairAgeFromData(row),
    bestPickScore: bestPick.score,
    bestPickLabel: bestPick.label,
    bestPickInputs: bestPick.inputs,
    bestPickWarnings: bestPick.warnings,
    scoreBreakdown: bestPick.inputs,
    scoreWarnings: bestPick.warnings,
    bondingProgressPct: slimeScopeProgressPct(row),
    slimeScopeCategory: row.slimeScopeCategory || classifySlimeScopePair(row),
    graduated: Boolean(row.graduated || row.isGraduated || isGraduatedSlimeScopePair(row)),
    isGraduated: Boolean(row.graduated || row.isGraduated || isGraduatedSlimeScopePair(row)),
    safetyNote: row.safetyNote || "Mint/freeze safety passed",
    liveLabel: Number.isFinite(Number(row.pairAgeSeconds)) && Number(row.pairAgeSeconds) <= 60 ? "Seconds Old" : row.pairAgeMinutes !== null && Number(row.pairAgeMinutes) <= 30 ? "Just Listed" : isPumpStyleToken(row) ? "Pump Feed" : "Live Pair"
  };
}

function formatLivePairAgeLabel(pairAgeSeconds, pairAgeMinutes) {
  const seconds = Number(pairAgeSeconds);
  if (Number.isFinite(seconds)) {
    if (seconds < 60) return `${Math.max(0, Math.floor(seconds))}s`;
    if (seconds < 180) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86_400)}d`;
  }
  const minutes = Number(pairAgeMinutes);
  if (Number.isFinite(minutes)) return `${Math.max(0, Math.round(minutes))}m`;
  return "new";
}

function normalizeSniperMode(mode) {
  const normalized = String(mode || "safe").trim().toLowerCase();
  const map = {
    lowcap: "moonshot",
    low_cap: "moonshot",
    pumpsnipe: "pumpsnipe",
    auto: "safe"
  };
  const value = map[normalized] || normalized;
  return ["safe", "smart", "fast", "moonshot", "meme", "ai", "long", "pumpsnipe"].includes(value) ? value : "safe";
}

function webSniperRow(row) {
  const isPump = Boolean(row.isPump) || webLivePairIsPump(row);
  return {
    tokenMint: row.tokenMint,
    shortMint: shortMint(row.tokenMint),
    symbol: row.symbol || shortMint(row.tokenMint),
    name: row.name || "Unknown",
    imageUrl: row.imageUrl || "",
    websiteUrl: row.websiteUrl || "",
    twitterUrl: row.twitterUrl || "",
    telegramUrl: row.telegramUrl || "",
    dexId: row.dexId || "",
    dexName: row.dexName || "",
    pairAddress: row.pairAddress || "",
    pairUrl: row.pairUrl || "",
    raydiumPool: row.raydiumPool || "",
    bondingProgressPct: slimeScopeProgressPct(row),
    slimeScopeCategory: row.slimeScopeCategory || classifySlimeScopePair(row),
    graduated: Boolean(row.graduated || row.isGraduated || isGraduatedSlimeScopePair(row)),
    isGraduated: Boolean(row.graduated || row.isGraduated || isGraduatedSlimeScopePair(row)),
    isPump,
    pumpUrl: row.pumpUrl || (isPump ? pumpFunUrl(row.tokenMint) : ""),
    score: row.score,
    category: row.category,
    rugRisk: row.rugRisk,
    exitRisk: row.exitRisk,
    manipulationScore: row.manipulationScore,
    momentum: row.momentum,
    smartMoney: row.smartMoney,
    scalpSetup: row.scalpSetup,
    marketCap: row.marketCap,
    marketCapLabel: formatUsdCompact(row.marketCap || 0) || "n/a",
    liquidityUsd: row.liquidityUsd,
    liquidityLabel: formatUsdCompact(row.liquidityUsd || 0) || "n/a",
    volume5m: row.volume5m,
    volume5mLabel: formatUsdCompact(row.volume5m || 0) || "n/a",
    volumeM15: row.volumeM15,
    volumeM15Label: row.volumeM15 ? formatUsdCompact(row.volumeM15 || 0) : "",
    volumeM30: row.volumeM30,
    volumeM30Label: row.volumeM30 ? formatUsdCompact(row.volumeM30 || 0) : "",
    volumeH1: row.volumeH1,
    volumeH1Label: formatUsdCompact(row.volumeH1 || 0) || "n/a",
    volumeH24: row.volumeH24,
    volumeH24Label: row.volumeH24 ? formatUsdCompact(row.volumeH24 || 0) : "",
    volumeLabel: formatUsdCompact(firstMeaningfulNumber(row.volumeM15, row.volumeM30, row.volumeH1, row.volume5m, row.volumeH24) || 0) || "n/a",
    sniperCount: row.sniperCount || 0,
    buys5m: row.buys5m || 0,
    sells5m: row.sells5m || 0,
    buysH1: row.buysH1 || 0,
    sellsH1: row.sellsH1 || 0,
    txnsLabel: `${Number(row.buys5m || 0) + Number(row.buysH1 || 0)}/${Number(row.sells5m || 0) + Number(row.sellsH1 || 0)}`,
    m5: row.m5,
    h1: row.h1,
    h6: row.h6,
    h24: row.h24,
    pairCreatedAt: row.pairCreatedAt || null,
    pairAgeSeconds: row.pairAgeSeconds,
    pairAgeMinutes: row.pairAgeMinutes,
    riskFlags: row.riskFlags || [],
    reasons: row.reasons || [],
    dexUrl: dexScreenerUrl(row.tokenMint)
  };
}

function telegramBotStartUrl() {
  return `https://t.me/${CONFIG.telegramBotUsername || "OgreTradeBot"}?start=web`;
}

function brandSocialLinks() {
  return {
    telegram: telegramBotStartUrl(),
    website: "https://ogremode.com/",
    twitter: "https://twitter.com/i/communities/1930265213917425858"
  };
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
  await writeJsonFile(statePath(), state);
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
  const declared = backupDeclaredPublicKey(wallet);
  if (declared && String(declared).trim() !== publicKey) {
    throw new Error(`Public key mismatch. Backup says ${declared}, but the private key opens ${publicKey}.`);
  }
}

function backupDeclaredPublicKey(wallet) {
  const declared = wallet?.publicKey || wallet?.pubkey || wallet?.address || wallet?.wallet || wallet?.owner;
  return declared ? String(declared).trim() : "";
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

function walletStopLossForIndex(data, walletIndex) {
  if (data.stopLossMode !== "wallets" || !data.walletStopLossTargets) {
    return null;
  }

  const value = Number(data.walletStopLossTargets[String(walletIndex)]);
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

  const hoursMatch = normalized.match(/^(\d+)\s*(h|hr|hrs|hour|hours)$/);
  if (hoursMatch) {
    const hours = Number.parseInt(hoursMatch[1], 10);
    if (!Number.isInteger(hours) || hours < 1 || hours > 168) {
      throw new Error("Hour-based auto-sell timers must be from 1 to 168 hours.");
    }
    return hours * 60 * 60;
  }

  const daysMatch = normalized.match(/^(\d+)\s*(d|day|days)$/);
  if (daysMatch) {
    const days = Number.parseInt(daysMatch[1], 10);
    if (!Number.isInteger(days) || days < 1 || days > 7) {
      throw new Error("Day-based auto-sell timers must be from 1 to 7 days.");
    }
    return days * 24 * 60 * 60;
  }

  const minutes = parseDelayMinutes(normalized.replace(/\s*(m|min|mins|minute|minutes)$/i, ""));
  return minutes * 60;
}

function parseOptionalSellDelaySeconds(text) {
  const normalized = String(text || "").trim().toLowerCase();
  if (!normalized || ["0", "off", "none", "no", "disable", "disabled"].includes(normalized)) {
    return 0;
  }
  return parseSellDelaySeconds(normalized);
}

function parseLoopDelaySeconds(text) {
  const normalized = text.trim().toLowerCase();
  if (!normalized || ["0", "off", "none", "no", "disabled", "now", "immediate"].includes(normalized)) {
    return 0;
  }
  return parseSellDelaySeconds(normalized);
}

function formatDelay(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value)) return "unknown";
  if (value < 60) return `${value} second(s)`;
  if (value >= 86_400 && value % 86_400 === 0) return `${value / 86_400} day(s)`;
  const minutes = value / 60;
  return Number.isInteger(minutes) ? `${minutes} minute(s)` : `${minutes.toFixed(2)} minute(s)`;
}

function formatSellTimerSummary(seconds) {
  return Number(seconds || 0) > 0 ? `${formatDelay(seconds)} after buy` : "off";
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

  const value = parsePercentOrMultiplierValue(normalized, { allowMultiplier: false });
  if (!Number.isFinite(value) || value <= 0 || value > 10000) {
    throw new Error("Trigger percent must be 0/off, or a positive number up to 10000.");
  }
  return value;
}

function parseTakeProfitPercent(text) {
  const normalized = text.trim().toLowerCase();
  if (["0", "off", "none", "no", "disable", "disabled"].includes(normalized)) {
    return 0;
  }

  const value = parsePercentOrMultiplierValue(normalized, { allowMultiplier: true });
  if (!Number.isFinite(value) || value <= 0 || value > 10000) {
    throw new Error("Take-profit must be 0/off, a positive percent up to 10000, or a multiplier like 5x.");
  }
  return Number(value.toFixed(4));
}

function parsePercentOrMultiplierValue(text, options = {}) {
  const normalized = String(text || "").trim().toLowerCase();
  const multiplierMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*x$/);
  if (multiplierMatch) {
    if (!options.allowMultiplier) {
      throw new Error("Multiplier input like 5x is only for take-profit targets.");
    }
    const multiple = Number.parseFloat(multiplierMatch[1]);
    if (!Number.isFinite(multiple) || multiple <= 1) {
      throw new Error("Take-profit multiplier must be greater than 1x.");
    }
    return (multiple - 1) * 100;
  }

  return Number.parseFloat(normalized.replace(/%$/, ""));
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

function parseWalletStopLossTargets(text, walletIndexes) {
  const normalized = text.trim().toLowerCase();
  const indexes = Array.isArray(walletIndexes) ? walletIndexes : [];
  if (indexes.length === 0) {
    throw new Error("No wallets selected.");
  }

  if (normalized.startsWith("spread:")) {
    const [, startText, endText] = normalized.split(":");
    const start = parseStopLossPercentValue(startText);
    const end = parseStopLossPercentValue(endText);
    const values = indexes.length === 1
      ? [start]
      : indexes.map((_, index) => start + ((end - start) * index) / (indexes.length - 1));
    return walletTargetMap(indexes, values);
  }

  if (normalized.startsWith("all:")) {
    const value = parseStopLossPercentValue(normalized.split(":")[1]);
    return walletTargetMap(indexes, indexes.map(() => value));
  }

  const values = parseStopLossNumberList(text);
  if (values.length !== indexes.length) {
    throw new Error(`Send exactly ${indexes.length} stop-loss value(s), one for each selected wallet.`);
  }
  return walletTargetMap(indexes, values);
}

function parseWebWalletTakeProfitTargets(body, walletIndexes) {
  const text = firstString(body.walletTakeProfitTargets, body.takeProfitTargetsByWallet, body.walletTakeProfitPct);
  if (!text || isDisabledText(text)) return null;
  return parseWalletTakeProfitTargets(text, walletIndexes);
}

function parseWebWalletStopLossTargets(body, walletIndexes) {
  const text = firstString(body.walletStopLossTargets, body.stopLossTargetsByWallet, body.walletStopLossPct);
  if (!text || isDisabledText(text)) return null;
  return parseWalletStopLossTargets(text, walletIndexes);
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

function parseStopLossNumberList(text) {
  const values = String(text || "")
    .split(/[,\s]+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map(parseStopLossPercentValue);
  if (values.length === 0) {
    throw new Error("Send one or more stop-loss percent values.");
  }
  return values;
}

function parsePositivePercentValue(value) {
  const number = parsePercentOrMultiplierValue(value, { allowMultiplier: true });
  if (!Number.isFinite(number) || number <= 0 || number > 10000) {
    throw new Error("Percent values must be positive numbers up to 10000, or a multiplier like 5x.");
  }
  return Number(number.toFixed(4));
}

function parseStopLossPercentValue(value) {
  const number = parsePercentOrMultiplierValue(value, { allowMultiplier: false });
  if (!Number.isFinite(number) || number <= 0 || number > 10000) {
    throw new Error("Stop-loss percent values must be positive numbers up to 10000.");
  }
  return Number(number.toFixed(4));
}

function isDisabledText(value) {
  return ["", "0", "off", "none", "no", "disable", "disabled"].includes(String(value || "").trim().toLowerCase());
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

function cleanTickerSymbol(text) {
  const ticker = String(text || "")
    .trim()
    .replace(/^\$/, "")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 16);
  if (!ticker || ticker.length < 2) {
    throw new Error("Ticker must be at least 2 letters/numbers.");
  }
  return ticker;
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

function pumpFunUrl(tokenMint) {
  return `https://pump.fun/coin/${tokenMint}`;
}

function kolscanAccountUrl(wallet) {
  const address = String(wallet || "").trim();
  return address ? `https://kolscan.io/account/${address}` : "";
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
  return levels.map((level) => `${formatTakeProfitTarget(level.pct)} sells ${level.sellPercent}%`).join(" | ");
}

function formatWalletTakeProfitTargets(data) {
  if (!data?.walletTakeProfitTargets) return "No wallet targets set.";
  return (data.walletIndexes || [])
    .map((walletIndex) => `Wallet ${walletIndex}: ${formatTakeProfitTarget(data.walletTakeProfitTargets[String(walletIndex)])}`)
    .join("\n");
}

function formatTakeProfitSummary(data) {
  if (data.takeProfitMode === "ladder") {
    return `ladder: ${formatTakeProfitLadder(data.takeProfitLadder)}`;
  }

  if (data.takeProfitMode === "wallets") {
    return `by wallet:\n${formatWalletTakeProfitTargets(data)}`;
  }

  return formatTakeProfitTarget(data.takeProfitPct);
}

function formatPlanTakeProfitSummary(plan) {
  if (plan.takeProfitMode === "ladder") {
    return `ladder: ${formatTakeProfitLadder(plan.takeProfitLadder)}`;
  }

  if (plan.takeProfitMode === "wallets") {
    const targets = (plan.wallets || [])
      .map((wallet) => `${wallet.label}: ${formatTakeProfitTarget(wallet.takeProfitPct || plan.takeProfitPct)}`)
      .join(" | ");
    return targets || "by wallet";
  }

  return formatTakeProfitTarget(plan.takeProfitPct);
}

function formatPlanStopLossSummary(plan) {
  if (plan.stopLossMode === "wallets") {
    const targets = (plan.wallets || [])
      .map((wallet) => `${wallet.label}: ${formatStopLossTarget(wallet.stopLossPct || plan.stopLossPct)}`)
      .join(" | ");
    return targets || "by wallet";
  }

  return formatStopLossTarget(plan.stopLossPct);
}

function formatStopLossTarget(value) {
  const pct = Number(value);
  if (!Number.isFinite(pct) || pct <= 0) return "off";
  return `-${formatTakeProfitNumber(pct)}%`;
}

function formatTakeProfitTarget(value) {
  const pct = Number(value);
  if (!Number.isFinite(pct) || pct <= 0) return "off";
  const pctText = formatTakeProfitNumber(pct);
  const multiple = 1 + (pct / 100);
  if (multiple >= 2) {
    return `+${pctText}% (~${formatTakeProfitNumber(multiple)}x value)`;
  }
  return `+${pctText}%`;
}

function formatTakeProfitNumber(value) {
  if (!Number.isFinite(Number(value))) return String(value);
  return Number(value).toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
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
      "Safety: blocks active mint/freeze authority. Sell route is checked when an exit triggers."
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
    "Safety: blocks active mint/freeze authority; sell route is checked at exit."
  ].filter(Boolean).join("\n");
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
    `Sell timer: ${formatSellTimerSummary(data.sellDelaySeconds)}`,
    Number(data.sellDelaySeconds || 0) > 0 ? `Timer sell: ${data.sellPercent}%` : "",
    data.takeProfitMode === "ladder" ? "Take-profit: ladder chunks" : `TP/SL sell: ${data.triggerSellPercent || 100}%`,
    `Repeat cycles: ${data.loopCount || 1}x`,
    data.loopDelaySeconds ? `Repeat wait: ${formatDelay(data.loopDelaySeconds)}` : "",
    `Take-profit: ${formatTakeProfitSummary(data)}`,
    `Stop-loss: ${data.stopLossPct ? `-${data.stopLossPct}%` : "off"}`,
    `Slippage: ${data.slippageBps} bps`,
    "Safety: blocks active mint/freeze authority; sell route is checked at exit."
  ].filter(Boolean).join("\n");
}

function formatManualLaunchConfirm(data) {
  const amountLamports = solToLamports(data.amountSol);
  const feeLamports = calculateFeeLamports(amountLamports);
  return [
    "Confirm Manual Launch Snipe:",
    `Ticker: $${data.ticker}`,
    `Wallets: ${data.walletSelector || data.walletIndexes.join(", ")}`,
    `Buy per wallet: ${data.amountSol} SOL`,
    `Net swap: ${lamportsToSol(amountLamports - feeLamports)} SOL`,
    `Take-profit: ${formatTakeProfitTarget(data.takeProfitPct)}`,
    `Stop-loss: -${data.stopLossPct}%`,
    `Fallback timer: ${formatSellTimerSummary(data.sellDelaySeconds)}`,
    data.loopCount > 1 ? `Repeat cycles: ${data.loopCount}x${data.loopDelaySeconds ? `, wait ${formatDelay(data.loopDelaySeconds)}` : ""}` : "",
    `Slippage: ${data.slippageBps} bps`,
    `The bot buys only after a live ${CONFIG.photonNewPairsUrl ? "Photon/Solana" : "Solana"} token profile matches this ticker.`
  ].filter(Boolean).join("\n");
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
    `Timer: ${formatSellTimerSummary(data.sellDelaySeconds)}${Number(data.sellDelaySeconds || 0) > 0 ? ` / ${data.sellPercent}%` : ""}`,
    `TP/SL: ${formatTakeProfitTarget(data.takeProfitPct)} / -${data.stopLossPct}%`,
    `Slippage: ${data.slippageBps} bps`,
    "Safety: blocks active mint/freeze authority. Sell route is checked when an exit triggers."
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
    "manual_launch_watches",
    "export_backup",
    "restore_backup",
    "verify_backup_file",
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
