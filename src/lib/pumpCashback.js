import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction
} from "@solana/web3.js";

const PUMP_CREATE_COMPUTE_UNITS = 350_000;
let pumpSdkModulePromise = null;

function loadPumpSdk() {
  pumpSdkModulePromise ||= import("@pump-fun/pump-sdk");
  return pumpSdkModulePromise;
}

function asPublicKey(value, label) {
  try {
    return value instanceof PublicKey ? value : new PublicKey(String(value || ""));
  } catch {
    throw new Error(`${label} is not a valid Solana public key.`);
  }
}

function priorityMicroLamports(priorityFeeSol, computeUnits = PUMP_CREATE_COMPUTE_UNITS) {
  const sol = Math.max(0, Number(priorityFeeSol) || 0);
  if (!sol) return 0;
  const value = Math.ceil((sol * 1_000_000_000 * 1_000_000) / computeUnits);
  return Math.min(Number.MAX_SAFE_INTEGER, Math.max(1, value));
}

/**
 * Build Pump's official create_v2 instruction with native Cash back enabled.
 * Cash back is immutable at creation and is intentionally never delegated to
 * PumpPortal: its local-create endpoint silently ignores the cashback fields.
 */
export async function buildPumpCashbackCreateTransaction({
  mint,
  creator,
  name,
  symbol,
  uri,
  recentBlockhash,
  priorityFeeSol = 0,
  jitoTipAccount = "",
  jitoTipSol = 0
} = {}) {
  const mintPublicKey = asPublicKey(mint, "Pump mint");
  const creatorPublicKey = asPublicKey(creator, "Pump creator");
  const blockhash = String(recentBlockhash || "").trim();
  if (!blockhash) throw new Error("A recent Solana blockhash is required for Pump Cash back creation.");
  if (!String(name || "").trim()) throw new Error("Pump token name is required.");
  if (!String(symbol || "").trim()) throw new Error("Pump token symbol is required.");
  if (!String(uri || "").trim()) throw new Error("Pump metadata URI is required.");

  const { PumpSdk } = await loadPumpSdk();
  const sdk = new PumpSdk();
  const createInstruction = await sdk.createV2Instruction({
    mint: mintPublicKey,
    name: String(name),
    symbol: String(symbol),
    uri: String(uri),
    creator: creatorPublicKey,
    user: creatorPublicKey,
    mayhemMode: false,
    cashback: true
  });
  const instructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: PUMP_CREATE_COMPUTE_UNITS })
  ];
  const microLamports = priorityMicroLamports(priorityFeeSol);
  if (microLamports > 0) {
    instructions.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports }));
  }
  instructions.push(createInstruction);

  const tipSol = Math.max(0, Number(jitoTipSol) || 0);
  if (tipSol > 0) {
    instructions.push(SystemProgram.transfer({
      fromPubkey: creatorPublicKey,
      toPubkey: asPublicKey(jitoTipAccount, "Jito tip account"),
      lamports: Math.max(1_000, Math.round(tipSol * 1_000_000_000))
    }));
  }

  const message = new TransactionMessage({
    payerKey: creatorPublicKey,
    recentBlockhash: blockhash,
    instructions
  }).compileToV0Message();
  return new VersionedTransaction(message);
}

export function normalizePumpCashback(value) {
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());
}
