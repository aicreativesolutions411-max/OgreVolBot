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

const MAIN_MENU = [
  [{ text: "Create Wallet Set", callback_data: "create_wallets" }],
  [{ text: "Import Wallet", callback_data: "import_wallet" }],
  [{ text: "List Wallets", callback_data: "list_wallets" }],
  [{ text: "Fund Wallets", callback_data: "fund_wallets" }],
  [{ text: "Bundle Buy Token", callback_data: "batch_buy" }],
  [{ text: "Bundle Sell Token", callback_data: "batch_sell" }],
  [{ text: "Volume Alerts", callback_data: "volume_alerts" }],
  [{ text: "Sweep SOL", callback_data: "sweep_sol" }],
  [{ text: "Sweep Tokens", callback_data: "sweep_tokens" }],
  [{ text: "Close Empty Token Accounts", callback_data: "close_empty_accounts" }],
  [{ text: "Export Audit Log", callback_data: "export_audit" }],
  [{ text: "Emergency Stop", callback_data: "emergency_stop" }],
  [{ text: "Unlock Bot", callback_data: "unlock_bot" }]
];

async function main() {
  await ensureDataFiles();
  startHealthServer();
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

  if (!Number.isInteger(bundleFeeBps) || bundleFeeBps < 0 || bundleFeeBps > 1000) {
    throw new Error("BUNDLE_FEE_BPS must be an integer from 0 to 1000.");
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
    port: Number.parseInt(process.env.PORT || "0", 10),
    allowedUserIds: parseAllowedUserIds(process.env.TELEGRAM_ALLOWED_USER_IDS || ""),
    jupiterApiKey: process.env.JUPITER_API_KEY || "",
    jupiterApiBase: (process.env.JUPITER_API_BASE || "https://api.jup.ag/swap/v2").replace(/\/$/, ""),
    feeWallet,
    bundleFeeBps,
    defaultSlippageBps: Number.parseInt(process.env.DEFAULT_SLIPPAGE_BPS || "100", 10),
    priorityFeeLamports: Number.parseInt(process.env.PRIORITY_FEE_LAMPORTS || "0", 10)
  };
}

function startHealthServer() {
  if (!CONFIG.port) return;

  const server = http.createServer((request, response) => {
    if (request.url === "/" || request.url === "/healthz") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({
        ok: true,
        service: "solana-telegram-wallet-ops-bot",
        uptimeSeconds: Math.round(process.uptime())
      }));
      return;
    }

    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ ok: false, error: "not_found" }));
  });

  server.listen(CONFIG.port, () => {
    console.log(`Health server listening on port ${CONFIG.port}.`);
  });
}

function parseAllowedUserIds(value) {
  return value
    .split(",")
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((item) => Number.isInteger(item));
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
  await fs.mkdir(CONFIG.dataDir, { recursive: true });
  await writeJsonIfMissing(walletPath(), { wallets: [] });
  await writeJsonIfMissing(auditPath(), { entries: [] });
  await writeJsonIfMissing(statePath(), { paused: false });
  await ensureAppSecretFingerprint();
  await validateStoredWalletSecrets();
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
  const chatId = update.callback_query?.message?.chat?.id || update.message?.chat?.id;

  if (!isAuthorized(user?.id)) {
    if (chatId) await say(chatId, "This bot is not authorized for your Telegram account.");
    return;
  }

  if (update.callback_query) {
    await handleCallback(update.callback_query);
    return;
  }

  if (update.message) {
    await handleMessage(update.message);
  }
}

async function handleCallback(query) {
  const chatId = query.message.chat.id;
  await telegram("answerCallbackQuery", { callback_query_id: query.id });

  if (await isPausedActionBlocked(query.data)) {
    await say(chatId, "Emergency stop is active. Use Unlock Bot to re-enable transaction flows.");
    return;
  }

  switch (query.data) {
    case "create_wallets":
      setSession(chatId, "create_wallets_label");
      await say(chatId, "Send a label for this wallet set.");
      break;
    case "import_wallet":
      setSession(chatId, "import_wallet_label");
      await say(chatId, "Send a label for this wallet.");
      break;
    case "list_wallets":
      await listWallets(chatId);
      break;
    case "fund_wallets":
      setSession(chatId, "fund_source");
      await say(chatId, await walletPrompt("Send the source wallet number. This source must be one of your imported managed wallets."));
      break;
    case "batch_buy":
      setSession(chatId, "buy_token");
      await say(chatId, "Send the token mint address you want to buy.");
      break;
    case "batch_sell":
      setSession(chatId, "sell_token");
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
      setSession(chatId, "sweep_sol_destination");
      await say(chatId, "Send the destination wallet address for swept SOL.");
      break;
    case "sweep_tokens":
      setSession(chatId, "sweep_tokens_destination");
      await say(chatId, "Send the destination wallet address for swept SPL tokens.");
      break;
    case "close_empty_accounts":
      setSession(chatId, "close_empty_accounts_wallets");
      await say(chatId, await walletPrompt("Send wallet numbers to check, separated by commas, or `all`."));
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
      setSession(chatId, "unlock_confirm");
      await say(chatId, "Reply `yes` to unlock transaction flows, or `/cancel`.");
      break;
    default:
      await say(chatId, "Unknown menu action. Use /start to reopen the menu.");
  }
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = (message.text || "").trim();

  if (!text) return;

  if (text === "/start" || text === "/menu") {
    clearSession(chatId);
    await showMenu(chatId);
    return;
  }

  if (text === "/cancel") {
    clearSession(chatId);
    await say(chatId, "Current flow canceled.");
    await showMenu(chatId);
    return;
  }

  if (text === "/wallets") {
    await listWallets(chatId);
    return;
  }

  if (text === "/bundle" || text === "/buy") {
    setSession(chatId, "buy_token");
    await say(chatId, "Send the token mint address you want to bundle buy.");
    return;
  }

  if (text === "/sell") {
    setSession(chatId, "sell_token");
    await say(chatId, "Send the token mint address you want to bundle sell.");
    return;
  }

  const session = sessions.get(chatId);
  if (!session) {
    await say(chatId, "Use /start to choose an action.");
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
        await say(chatId, "Send the private key as a JSON array or base58 secret key. Delete this Telegram message afterward.");
        break;
      case "import_wallet_secret":
        await importWalletFlow(chatId, text, session);
        break;
      case "fund_source":
        session.data.sourceIndex = parseWalletIndex(text);
        session.step = "fund_targets";
        await say(chatId, await walletPrompt("Send target wallet numbers separated by commas, or `all`."));
        break;
      case "fund_targets":
        session.data.targetIndexes = await parseWalletSelection(text, { exclude: [session.data.sourceIndex] });
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
        await say(chatId, await walletPrompt("Send buyer wallet numbers separated by commas, or `all`."));
        break;
      case "buy_wallets":
        session.data.walletIndexes = await parseWalletSelection(text);
        session.step = "buy_amount";
        await say(chatId, "Send SOL amount to spend per wallet.");
        break;
      case "buy_amount":
        session.data.amountSol = parsePositiveNumber(text);
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
        await say(chatId, await walletPrompt("Send seller wallet numbers separated by commas, or `all`."));
        break;
      case "sell_wallets":
        session.data.walletIndexes = await parseWalletSelection(text);
        session.step = "sell_percent";
        await say(chatId, "Send percent to sell from each wallet, from 1 to 100.");
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
        await say(chatId, await walletPrompt("Send wallet numbers to sweep, separated by commas, or `all`."));
        break;
      case "sweep_sol_wallets":
        session.data.walletIndexes = await parseWalletSelection(text);
        session.step = "sweep_sol_confirm";
        await say(chatId, formatSweepSolConfirm(session.data));
        break;
      case "sweep_sol_confirm":
        await confirmOrCancel(chatId, text, () => sweepSolFlow(chatId, session));
        break;
      case "sweep_tokens_destination":
        session.data.destination = parsePublicKey(text).toBase58();
        session.step = "sweep_tokens_wallets";
        await say(chatId, await walletPrompt("Send wallet numbers to sweep tokens from, separated by commas, or `all`."));
        break;
      case "sweep_tokens_wallets":
        session.data.walletIndexes = await parseWalletSelection(text);
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
        session.data.walletIndexes = await parseWalletSelection(text);
        session.step = "close_empty_accounts_confirm";
        await say(chatId, formatCloseAccountsConfirm(session.data));
        break;
      case "close_empty_accounts_confirm":
        await confirmOrCancel(chatId, text, () => closeEmptyAccountsFlow(chatId, session));
        break;
      case "unlock_confirm":
        await confirmOrCancel(chatId, text, () => unlockBotFlow(chatId), { allowWhilePaused: true });
        break;
      default:
        clearSession(chatId);
        await say(chatId, "That flow reset. Use /start to choose an action.");
    }
  } catch (error) {
    await say(chatId, `Input error: ${error.message}`);
  }
}

async function unlockBotFlow(chatId) {
  await setPaused(false);
  await audit("unlock_bot", { chatId });
  clearSession(chatId);
  await say(chatId, "Bot unlocked. Transaction flows are enabled.");
  await showMenu(chatId);
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
    store.wallets.push(walletRecord(label, keypair));
    created.push(`${label}: ${keypair.publicKey.toBase58()}`);
  }

  await writeWalletStore(store);
  await audit("create_wallet_set", {
    chatId,
    label: session.data.label,
    count,
    publicKeys: created
  });

  clearSession(chatId);
  await say(chatId, `Created ${count} wallet(s):\n\n${created.join("\n")}`);
  await showMenu(chatId);
}

async function importWalletFlow(chatId, text, session) {
  const keypair = keypairFromSecret(text);
  const store = await readWalletStore();
  store.wallets.push(walletRecord(session.data.label, keypair));
  await writeWalletStore(store);

  await audit("import_wallet", {
    chatId,
    label: session.data.label,
    publicKey: keypair.publicKey.toBase58()
  });

  clearSession(chatId);
  await say(chatId, `Imported wallet ${session.data.label}: ${keypair.publicKey.toBase58()}`);
  await showMenu(chatId);
}

async function fundWalletsFlow(chatId, session) {
  const store = await readWalletStore();
  const source = getWalletAt(store, session.data.sourceIndex);
  const sourceKeypair = decryptWallet(source);
  const amountLamports = solToLamports(session.data.amountSol);
  const results = [];

  for (const targetIndex of session.data.targetIndexes) {
    try {
      const target = getWalletAt(store, targetIndex);
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
      results.push(`Wallet ${targetIndex}: failed - ${formatError(error)}`);
    }
  }

  await audit("fund_wallets", {
    chatId,
    source: publicWallet(source),
    targets: session.data.targetIndexes.map((index) => publicWallet(getWalletAt(store, index))),
    amountSol: session.data.amountSol,
    signatures: results
  });

  clearSession(chatId);
  await say(chatId, `Funding complete:\n\n${results.join("\n")}`);
  await showMenu(chatId);
}

async function batchBuyFlow(chatId, session) {
  const store = await readWalletStore();
  const wallets = session.data.walletIndexes.map((index) => getWalletAt(store, index));
  const amountLamports = solToLamports(session.data.amountSol);
  const feeLamports = calculateFeeLamports(amountLamports);
  const swapLamports = amountLamports - feeLamports;
  const results = [];

  if (swapLamports <= 0) {
    throw new Error("Amount is too small after platform fee.");
  }

  for (const wallet of wallets) {
    try {
      const keypair = decryptWallet(wallet);
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
      results.push(`${wallet.label}: swap ${result.signature}${feeStatus}`);
    } catch (error) {
      results.push(`${wallet.label}: failed - ${formatError(error)}`);
    }
  }

  await audit("batch_buy_token", {
    chatId,
    tokenMint: session.data.tokenMint,
    amountSolPerWallet: session.data.amountSol,
    netSwapSolPerWallet: lamportsToSol(swapLamports),
    feeSolPerWallet: lamportsToSol(feeLamports),
    feeWallet: CONFIG.feeWallet,
    feeBps: CONFIG.bundleFeeBps,
    slippageBps: session.data.slippageBps,
    wallets: wallets.map(publicWallet),
    signatures: results
  });

  clearSession(chatId);
  await say(chatId, `Batch buy complete:\n\n${results.join("\n")}`);
  await showMenu(chatId);
}

async function batchSellFlow(chatId, session) {
  const store = await readWalletStore();
  const wallets = session.data.walletIndexes.map((index) => getWalletAt(store, index));
  const results = [];

  for (const wallet of wallets) {
    try {
      const keypair = decryptWallet(wallet);
      const token = await getTokenBalanceForMint(keypair.publicKey, new PublicKey(session.data.tokenMint));
      if (!token || token.rawAmount === 0n) {
        results.push(`${wallet.label}: no token balance`);
        continue;
      }

      const amount = (token.rawAmount * BigInt(session.data.percent)) / 100n;
      if (amount === 0n) {
        results.push(`${wallet.label}: amount rounded to zero`);
        continue;
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
      results.push(`${wallet.label}: failed - ${formatError(error)}`);
    }
  }

  await audit("batch_sell_token", {
    chatId,
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
  await showMenu(chatId);
}

async function sweepSolFlow(chatId, session) {
  const store = await readWalletStore();
  const destination = new PublicKey(session.data.destination);
  const results = [];
  const reserveLamports = 10_000;

  for (const wallet of session.data.walletIndexes.map((index) => getWalletAt(store, index))) {
    try {
      const keypair = decryptWallet(wallet);
      const balance = await connection.getBalance(keypair.publicKey, "confirmed");
      const sendable = balance - reserveLamports;

      if (sendable <= 0) {
        results.push(`${wallet.label}: no sweepable SOL`);
        continue;
      }

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: destination,
          lamports: sendable
        })
      );
      const signature = await sendLegacyTransaction(tx, [keypair]);
      results.push(`${wallet.label}: ${lamportsToSol(sendable)} SOL, ${signature}`);
    } catch (error) {
      results.push(`${wallet.label}: failed - ${formatError(error)}`);
    }
  }

  await audit("sweep_sol", {
    chatId,
    destination: session.data.destination,
    walletIndexes: session.data.walletIndexes,
    results
  });

  clearSession(chatId);
  await say(chatId, `SOL sweep complete:\n\n${results.join("\n")}`);
  await showMenu(chatId);
}

async function sweepTokensFlow(chatId, session) {
  const store = await readWalletStore();
  const destination = new PublicKey(session.data.destination);
  const results = [];

  for (const wallet of session.data.walletIndexes.map((index) => getWalletAt(store, index))) {
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

          const destinationInfo = await connection.getAccountInfo(destinationAta, "confirmed");
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
          results.push(`${wallet.label}: ${account.mint} failed - ${formatError(error)}`);
        }
      }
    } catch (error) {
      results.push(`${wallet.label}: failed - ${formatError(error)}`);
    }
  }

  await audit("sweep_tokens", {
    chatId,
    destination: session.data.destination,
    tokenMint: session.data.tokenMint,
    walletIndexes: session.data.walletIndexes,
    results
  });

  clearSession(chatId);
  await say(chatId, `Token sweep complete:\n\n${results.join("\n") || "No tokens swept."}`);
  await showMenu(chatId);
}

async function closeEmptyAccountsFlow(chatId, session) {
  const store = await readWalletStore();
  const results = [];

  for (const wallet of session.data.walletIndexes.map((index) => getWalletAt(store, index))) {
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
      results.push(`${wallet.label}: failed - ${formatError(error)}`);
    }
  }

  await audit("close_empty_token_accounts", {
    chatId,
    walletIndexes: session.data.walletIndexes,
    results
  });

  clearSession(chatId);
  await say(chatId, `Close accounts complete:\n\n${results.join("\n")}`);
  await showMenu(chatId);
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
    throw new Error(order?.errorMessage || order?.error || "Jupiter order did not return a transaction.");
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

async function sendLegacyTransaction(tx, signers) {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = signers[0].publicKey;
  tx.sign(...signers);
  const signature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    maxRetries: 3
  });
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  return signature;
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
  const responses = await Promise.all([
    connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }, "confirmed"),
    connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID }, "confirmed")
  ]);

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

async function listWallets(chatId) {
  const store = await readWalletStore();
  if (store.wallets.length === 0) {
    await say(chatId, "No wallets are managed yet.");
    return;
  }

  const lines = store.wallets.map((wallet, index) => `${index + 1}. ${wallet.label}\n${wallet.publicKey}`);
  await say(chatId, `Managed wallets:\n\n${lines.join("\n\n")}`);
}

async function exportAudit(chatId) {
  const auditLog = await readJson(auditPath());
  const latest = auditLog.entries.slice(-30).map((entry) => {
    return `${entry.timestamp} | ${entry.action}`;
  });
  await say(chatId, latest.length ? `Last ${latest.length} audit entries:\n\n${latest.join("\n")}` : "Audit log is empty.");
}

async function walletPrompt(prefix) {
  const store = await readWalletStore();
  const lines = store.wallets.map((wallet, index) => `${index + 1}. ${wallet.label} - ${wallet.publicKey}`);
  return `${prefix}\n\n${lines.join("\n") || "No wallets are managed yet."}`;
}

async function showMenu(chatId) {
  const state = await readState();
  await telegram("sendMessage", {
    chat_id: chatId,
    text: `${state.paused ? "Status: emergency stop active.\n\n" : ""}Choose a wallet operation:`,
    reply_markup: { inline_keyboard: MAIN_MENU }
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

function walletRecord(label, keypair) {
  return {
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
  const trimmed = text.trim();

  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) throw new Error("Secret key JSON must be an array.");
    return Keypair.fromSecretKey(Uint8Array.from(parsed));
  }

  return Keypair.fromSecretKey(bs58.decode(trimmed));
}

function parseWalletIndex(text) {
  const index = Number.parseInt(text, 10);
  if (!Number.isInteger(index) || index < 1) {
    throw new Error("Wallet number must be a positive integer.");
  }
  return index;
}

async function parseWalletSelection(text, options = {}) {
  const store = await readWalletStore();
  const exclude = new Set(options.exclude || []);
  let indexes;

  if (text.trim().toLowerCase() === "all") {
    indexes = store.wallets.map((_, index) => index + 1);
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
    getWalletAt(store, index);
  }

  return indexes;
}

function getWalletAt(store, oneBasedIndex) {
  const wallet = store.wallets[oneBasedIndex - 1];
  if (!wallet) {
    throw new Error(`Wallet ${oneBasedIndex} does not exist.`);
  }
  return wallet;
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

function lamportsToSol(lamports) {
  return (lamports / LAMPORTS_PER_SOL).toFixed(9).replace(/0+$/, "").replace(/\.$/, "");
}

function formatFeeRate() {
  return `${(CONFIG.bundleFeeBps / 100).toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}%`;
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
  return [
    "Confirm bundle buy:",
    `Token mint: ${data.tokenMint}`,
    `Wallets: ${data.walletIndexes.join(", ")}`,
    `Spend per wallet: ${data.amountSol} SOL`,
    `Platform fee: ${formatFeeRate()} to ${CONFIG.feeWallet}`,
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

function isAuthorized(userId) {
  return CONFIG.allowedUserIds.length === 0 || CONFIG.allowedUserIds.includes(userId);
}

async function isPausedActionBlocked(action) {
  const allowedWhilePaused = new Set(["list_wallets", "export_audit", "emergency_stop", "unlock_bot"]);
  return (await readState()).paused && !allowedWhilePaused.has(action);
}

function setSession(chatId, step) {
  sessions.set(chatId, { step, data: {} });
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

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
