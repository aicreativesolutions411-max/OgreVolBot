import crypto from "node:crypto";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey
} from "@solana/web3.js";
import {
  buildPumpPortalLocalCreateRequest,
  isServerSignableWallet,
  pumpLaunchRequiredSol,
  sanitizePumpPortalCreateRequest,
  selectPumpLaunchWallet
} from "../src/lib/pumpLaunchService.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadDotEnv(path.join(rootDir, ".env"));

const dataDir = path.resolve(process.env.DATA_DIR || path.join(rootDir, "data"));
const apiUrl = (process.env.PUMP_LAUNCH_API_URL || process.env.PUMP_LAUNCH_API_BASE || "").trim();
const metadataUrl = (process.env.PUMP_LAUNCH_METADATA_URL || "https://uploads.pinata.cloud/v3/files").trim();
const pinataJwt = process.env.PUMP_LAUNCH_PINATA_JWT || "";
const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const userId = String(process.env.DEBUG_PUMP_LAUNCH_USER_ID || "").trim();
const selectedDevWalletId = String(process.env.DEBUG_PUMP_LAUNCH_DEV_WALLET || process.env.DEBUG_PUMP_LAUNCH_DEV_WALLET_ID || "").trim();
const devBuySol = numberOrDefault(process.env.DEBUG_PUMP_LAUNCH_DEV_BUY_SOL, 0.0001);
const priorityFeeSol = numberOrDefault(process.env.PUMP_LAUNCH_PRIORITY_FEE_SOL, 0.00005);
const requiredBufferSol = numberOrDefault(process.env.PUMP_LAUNCH_REQUIRED_BUFFER_SOL, 0.01);
const slippageBps = numberOrDefault(process.env.DEBUG_PUMP_LAUNCH_SLIPPAGE_BPS, 300);

function loadDotEnv(envPath) {
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
    // .env is optional on Render.
  }
}

async function readJsonIfExists(fileName, fallback) {
  try {
    const raw = await fs.readFile(path.join(dataDir, fileName), "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

function numberOrDefault(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function short(value = "") {
  const text = String(value || "");
  return text.length <= 14 ? text : `${text.slice(0, 6)}...${text.slice(-6)}`;
}

function decryptManagedWallet(wallet) {
  if (!process.env.APP_SECRET || process.env.APP_SECRET.length < 24) {
    return { ok: false, reason: "APP_SECRET is missing or too short in this debug runtime." };
  }
  try {
    const secret = wallet.secret;
    const salt = Buffer.from(secret.salt, "base64");
    const iv = Buffer.from(secret.iv, "base64");
    const tag = Buffer.from(secret.tag, "base64");
    const data = Buffer.from(secret.data, "base64");
    const key = crypto.scryptSync(process.env.APP_SECRET, salt, 32);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    Buffer.concat([decipher.update(data), decipher.final()]);
    return { ok: true, reason: "decrypt ok" };
  } catch (error) {
    return { ok: false, reason: error.message || "decrypt failed" };
  }
}

async function balanceFor(publicKey) {
  if (!rpcUrl) return { ok: false, reason: "SOLANA_RPC_URL is missing" };
  try {
    const connection = new Connection(rpcUrl, "confirmed");
    const lamports = await connection.getBalance(new PublicKey(publicKey), "confirmed");
    return { ok: true, balanceSol: lamports / LAMPORTS_PER_SOL };
  } catch (error) {
    return { ok: false, reason: error.message || "balance lookup failed" };
  }
}

function attemptLine(attempt) {
  return [
    `launchAttemptId=${attempt.launchAttemptId || attempt.id || ""}`,
    `status=${attempt.status || ""}`,
    `stage=${attempt.stage || ""}`,
    `userId=${attempt.userId || ""}`,
    `devWallet=${short(attempt.devWalletPublicKey)}`,
    `mint=${short(attempt.mintPublicKey)}`,
    `metadataUri=${attempt.metadataUri ? "yes" : "no"}`,
    `mintSecretStored=${Boolean(attempt.mintSecretStored || attempt.encryptedMintSecret)}`,
    `tx=${short(attempt.txSignature)}`,
    `errorCode=${attempt.errorCode || ""}`,
    `error=${String(attempt.errorMessage || "").replace(/\s+/g, " ").slice(0, 160)}`
  ].join(" ");
}

const [walletStore, attemptStore] = await Promise.all([
  readJsonIfExists("wallets.json", { wallets: [] }),
  readJsonIfExists("pump-launch-attempts.json", { attempts: [] })
]);

console.log("PUMP LAUNCH DEBUG");
console.log(`dataDir=${dataDir}`);
console.log(`PUMP_LAUNCH_API_URL=${apiUrl || "(missing)"}`);
console.log(`PUMP_LAUNCH_METADATA_URL=${metadataUrl || "(missing)"}`);
console.log(`PUMP_LAUNCH_PINATA_JWT_CONFIGURED=${Boolean(pinataJwt)}`);
console.log(`SOLANA_RPC_URL_CONFIGURED=${Boolean(rpcUrl)}`);
console.log(`DEBUG_PUMP_LAUNCH_USER_ID=${userId || "(not set)"}`);
console.log(`DEBUG_PUMP_LAUNCH_DEV_WALLET=${selectedDevWalletId || "(not set)"}`);

const requiredSol = pumpLaunchRequiredSol({ devBuySol, priorityFeeSol, bufferSol: requiredBufferSol });
console.log(`requiredSol=${requiredSol.toFixed(6)} devBuySol=${devBuySol} priorityFeeSol=${priorityFeeSol} bufferSol=${requiredBufferSol}`);

if (!apiUrl || !apiUrl.includes("pumpportal.fun/api/trade-local")) {
  console.log("apiUrlValid=false reason=PUMP_LAUNCH_API_URL should be https://pumpportal.fun/api/trade-local for Local API signing.");
} else {
  console.log("apiUrlValid=true");
}

console.log(`metadataConfigValid=${Boolean(metadataUrl && pinataJwt)}`);
if (!pinataJwt) {
  console.log("metadataConfigReason=PUMP_LAUNCH_PINATA_JWT is missing; metadata upload will fail before PumpPortal is called.");
}

if (userId && selectedDevWalletId) {
  try {
    const selection = selectPumpLaunchWallet(walletStore, userId, selectedDevWalletId);
    const wallet = selection.wallet;
    const decrypt = decryptManagedWallet(wallet);
    const balance = await balanceFor(wallet.publicKey);
    console.log(`selectedDevWalletId=${selection.selectedDevWalletId}`);
    console.log(`devWalletPublicKey=${wallet.publicKey}`);
    console.log(`walletManaged=${isServerSignableWallet(wallet)}`);
    console.log(`walletOwnerPass=true ownerId=${wallet.ownerId}`);
    console.log(`walletDecryptable=${decrypt.ok} reason="${decrypt.reason}"`);
    if (balance.ok) {
      console.log(`balanceSol=${balance.balanceSol.toFixed(6)} requiredSol=${requiredSol.toFixed(6)} funded=${balance.balanceSol + 1e-9 >= requiredSol}`);
    } else {
      console.log(`balanceSol=unknown reason="${balance.reason}"`);
    }
    const request = buildPumpPortalLocalCreateRequest({
      creatorPublicKey: wallet.publicKey,
      mintPublicKey: "11111111111111111111111111111111",
      name: process.env.DEBUG_PUMP_LAUNCH_NAME || "Debug Token",
      symbol: process.env.DEBUG_PUMP_LAUNCH_SYMBOL || "DBG",
      metadataUri: "https://ipfs.io/ipfs/debug",
      devBuySol,
      slippageBps,
      priorityFeeSol,
      pool: "pump"
    });
    console.log(`localApiRequestShapeValid=${request.action === "create" && request.publicKey === wallet.publicKey && request.tokenMetadata.uri.startsWith("https://")}`);
    console.log(`sampleSanitizedRequest=${JSON.stringify(sanitizePumpPortalCreateRequest(request))}`);
  } catch (error) {
    console.log(`walletAuthPass=false code=${error.code || ""} reason="${error.message}"`);
  }
} else {
  console.log("walletAuthPass=unknown reason=set DEBUG_PUMP_LAUNCH_USER_ID and DEBUG_PUMP_LAUNCH_DEV_WALLET to inspect one selected dev wallet.");
}

console.log("LAST 10 PUMP LAUNCH ATTEMPTS");
const attempts = Array.isArray(attemptStore.attempts) ? attemptStore.attempts.slice(-10).reverse() : [];
if (!attempts.length) {
  console.log("No launch attempts found.");
} else {
  for (const attempt of attempts) {
    console.log(attemptLine(attempt));
  }
}
