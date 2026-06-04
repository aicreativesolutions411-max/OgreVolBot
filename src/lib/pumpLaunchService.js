import bs58 from "bs58";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  VersionedTransaction
} from "@solana/web3.js";

export const PUMP_LAUNCH_STATUS = Object.freeze({
  PENDING: "PENDING",
  VALIDATING: "VALIDATING",
  UPLOADING_METADATA: "UPLOADING_METADATA",
  METADATA_UPLOADED: "METADATA_UPLOADED",
  BUILDING_TX: "BUILDING_TX",
  SIGNING: "SIGNING",
  SENDING: "SENDING",
  CONFIRMING: "CONFIRMING",
  REGISTERING_TOKEN: "REGISTERING_TOKEN",
  COMPLETE: "COMPLETE",
  FAILED_METADATA_AUTH: "FAILED_METADATA_AUTH",
  FAILED_METADATA_FETCH_TIMEOUT: "FAILED_METADATA_FETCH_TIMEOUT",
  FAILED: "FAILED",
  STARTED: "PENDING",
  PREFLIGHT: "VALIDATING",
  PUMPPORTAL_REQUESTED: "BUILDING_TX",
  SIGNED: "SIGNING",
  SUBMITTED: "SENDING",
  LAUNCHED: "COMPLETE"
});

export const PUMP_LAUNCH_STAGE = Object.freeze({
  CONFIG: "config",
  WALLET_AUTH: "wallet_auth",
  BALANCE_CHECK: "balance_check",
  METADATA_UPLOAD: "metadata_upload",
  PUMPPORTAL_LOCAL: "pumpportal_local",
  SIGNING: "signing",
  SEND_TRANSACTION: "send_transaction",
  STORE_RESULT: "store_result"
});

export function createPumpLaunchError(message, code, statusCode = 400, extra = {}) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  Object.assign(error, extra);
  return error;
}

export function pumpLaunchStageError(stage, code, cause, statusCode = 502, extra = {}) {
  const message = cause?.message || String(cause || "Unknown launch error");
  const error = createPumpLaunchError(message, code, Number(cause?.statusCode || statusCode), {
    stage,
    cause,
    providerStatus: cause?.providerStatus || cause?.status || cause?.statusCode || null,
    providerResponseContentType: cause?.providerResponseContentType || cause?.responseContentType || "",
    providerResponseBody: cause?.providerResponseBody || cause?.responseBody || "",
    requestMeta: cause?.requestMeta || null,
    ...extra
  });
  return error;
}

export function validatePumpPortalLocalApiUrl(apiUrl) {
  const clean = String(apiUrl || "").trim();
  if (clean !== "https://pumpportal.fun/api/trade-local") {
    throw createPumpLaunchError(
      "PUMP_LAUNCH_API_URL must be exactly https://pumpportal.fun/api/trade-local for PumpPortal Local API launches.",
      "PUMP_LAUNCH_API_URL_INVALID",
      500,
      {
        stage: PUMP_LAUNCH_STAGE.CONFIG,
        apiUrl: clean
      }
    );
  }
  return clean;
}

export function isServerSignableWallet(wallet) {
  const secret = wallet?.secret;
  return Boolean(
    secret
    && typeof secret === "object"
    && !Array.isArray(secret)
    && secret.salt
    && secret.iv
    && secret.tag
    && secret.data
  );
}

export function selectPumpLaunchWallet(store, userId, selectedDevWalletId, options = {}) {
  const raw = String(selectedDevWalletId || "").trim();
  const wallets = Array.isArray(store?.wallets) ? store.wallets : [];
  const allowedOwnerIds = new Set([
    String(userId),
    ...(Array.isArray(options.allowedOwnerIds) ? options.allowedOwnerIds.map(String) : [])
  ].filter(Boolean));
  const ownerWallets = wallets.filter((wallet) => allowedOwnerIds.has(String(wallet.ownerId)));

  if (!raw) {
    throw createPumpLaunchError("Choose a managed SlimeWire dev wallet before launching.", "MISSING_DEV_WALLET", 400, {
      stage: PUMP_LAUNCH_STAGE.WALLET_AUTH
    });
  }

  let wallet = null;
  let webIndex = null;
  if (/^\d+$/.test(raw)) {
    webIndex = Number.parseInt(raw, 10);
    wallet = ownerWallets[webIndex - 1] || null;
  } else {
    const normalized = raw.toLowerCase();
    const matchIndex = ownerWallets.findIndex((candidate) => (
      String(candidate.publicKey || "") === raw
      || String(candidate.id || "") === raw
      || String(candidate.label || "").toLowerCase() === normalized
    ));
    if (matchIndex >= 0) {
      wallet = ownerWallets[matchIndex];
      webIndex = matchIndex + 1;
    }
  }

  if (!wallet) {
    const walletFromOtherOwner = wallets.find((candidate) => (
      String(candidate.publicKey || "") === raw
      || String(candidate.id || "") === raw
      || String(candidate.label || "").toLowerCase() === raw.toLowerCase()
    ));
    if (walletFromOtherOwner && !allowedOwnerIds.has(String(walletFromOtherOwner.ownerId))) {
      throw createPumpLaunchError("Not Authorized: that dev wallet is not owned by this logged-in SlimeWire account.", "DEV_WALLET_NOT_AUTHORIZED", 403, {
        stage: PUMP_LAUNCH_STAGE.WALLET_AUTH,
        selectedDevWalletId: raw,
        ownerId: walletFromOtherOwner.ownerId
      });
    }
    throw createPumpLaunchError(`Dev wallet ${raw} was not found for this SlimeWire account.`, "DEV_WALLET_NOT_FOUND", 404, {
      stage: PUMP_LAUNCH_STAGE.WALLET_AUTH,
      selectedDevWalletId: raw
    });
  }

  if (!isServerSignableWallet(wallet)) {
    throw createPumpLaunchError("Selected dev wallet is not a managed SlimeWire/server-signable wallet.", "DEV_WALLET_NOT_MANAGED", 400, {
      stage: PUMP_LAUNCH_STAGE.WALLET_AUTH,
      selectedDevWalletId: raw,
      devWalletPublicKey: wallet.publicKey
    });
  }

  return {
    wallet: {
      ...wallet,
      webIndex
    },
    selectedDevWalletId: raw,
    devWalletPublicKey: wallet.publicKey,
    walletType: "managed_slimewire",
    walletManaged: true,
    authResult: "authorized",
    ownerWalletCount: ownerWallets.length
  };
}

export function solToLamportsNumber(sol) {
  const value = Number(sol);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.ceil(value * LAMPORTS_PER_SOL);
}

export function pumpLaunchRequiredSol({ devBuySol = 0, priorityFeeSol = 0, bufferSol = 0.01 } = {}) {
  const devBuy = Math.max(0, Number(devBuySol) || 0);
  const priorityFee = Math.max(0, Number(priorityFeeSol) || 0);
  const buffer = Math.max(0, Number(bufferSol) || 0);
  return devBuy + priorityFee + buffer;
}

export function assertPumpLaunchBalance({ balanceSol, requiredSol }) {
  if (!Number.isFinite(balanceSol)) {
    throw createPumpLaunchError("Could not read the selected dev wallet SOL balance.", "DEV_WALLET_BALANCE_UNKNOWN", 502, {
      stage: PUMP_LAUNCH_STAGE.BALANCE_CHECK
    });
  }
  if (balanceSol + 1e-9 < requiredSol) {
    throw createPumpLaunchError(
      `Selected dev wallet has ${balanceSol.toFixed(6)} SOL, but launch needs at least ${requiredSol.toFixed(6)} SOL for dev buy, priority fee, rent/network fees, and safety buffer.`,
      "DEV_WALLET_INSUFFICIENT_SOL",
      400,
      {
        stage: PUMP_LAUNCH_STAGE.BALANCE_CHECK,
        balanceSol,
        requiredSol
      }
    );
  }
}

export function buildPumpPortalLocalCreateRequest({
  creatorPublicKey,
  mintPublicKey,
  name,
  symbol,
  metadataUri,
  devBuySol,
  slippageBps,
  priorityFeeSol,
  pool = "pump"
}) {
  return normalizePumpPortalCreatePayload({
    publicKey: creatorPublicKey,
    action: "create",
    tokenMetadata: {
      name,
      symbol,
      uri: metadataUri
    },
    mint: mintPublicKey,
    denominatedInSol: "true",
    amount: devBuySol,
    slippageBps,
    priorityFee: priorityFeeSol,
    pool
  });
}

function normalizePumpPortalName(value) {
  const name = String(value || "").replace(/\s+/g, " ").trim();
  if (!name) {
    throw createPumpLaunchError("Token name is required for PumpPortal create.", "PUMPPORTAL_CREATE_NAME_INVALID", 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL
    });
  }
  if (name.length > 32) {
    throw createPumpLaunchError("Token name must be 32 characters or fewer for PumpPortal create.", "PUMPPORTAL_CREATE_NAME_INVALID", 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL,
      nameLength: name.length
    });
  }
  return name;
}

function normalizePumpPortalSymbol(value) {
  const symbol = String(value || "")
    .trim()
    .replace(/^\$/, "")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();
  if (!symbol || symbol.length < 2) {
    throw createPumpLaunchError("Token symbol must be at least 2 letters/numbers for PumpPortal create.", "PUMPPORTAL_CREATE_SYMBOL_INVALID", 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL
    });
  }
  if (symbol.length > 10) {
    throw createPumpLaunchError("Token symbol must be 10 characters or fewer for PumpPortal create.", "PUMPPORTAL_CREATE_SYMBOL_INVALID", 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL,
      symbolLength: symbol.length
    });
  }
  return symbol;
}

function normalizePumpPortalNumber(value, fallback, min = 0) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min) return fallback;
  return number;
}

function normalizePumpPortalSlippage(input = {}) {
  if (input.slippage !== undefined) {
    return normalizePumpPortalNumber(input.slippage, 10, 0.01);
  }
  if (input.slippageBps !== undefined) {
    return normalizePumpPortalNumber(Number(input.slippageBps) / 100, 10, 0.01);
  }
  return 10;
}

function normalizePumpPortalMetadataUri(value) {
  const uri = String(value || "").trim();
  if (!uri) {
    throw createPumpLaunchError("Missing token metadata URI.", "MISSING_METADATA_URI", 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL
    });
  }
  let parsed;
  try {
    parsed = new URL(uri);
  } catch {
    throw createPumpLaunchError("Token metadata URI must be a public http(s) URL.", "PUMPPORTAL_CREATE_METADATA_URI_INVALID", 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL
    });
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw createPumpLaunchError("Token metadata URI must be a public http(s) URL.", "PUMPPORTAL_CREATE_METADATA_URI_INVALID", 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL
    });
  }
  if (/\.(?:png|jpe?g|gif|webp|svg)(?:$|[?#])/i.test(parsed.pathname)) {
    throw createPumpLaunchError("Token metadata URI must point to metadata JSON, not an image.", "PUMPPORTAL_CREATE_METADATA_URI_IMAGE", 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL
    });
  }
  return uri;
}

export function looksLikeSecretKey(value) {
  if (Array.isArray(value)) return value.length >= 64;
  if (value && typeof value === "object") {
    if (Array.isArray(value.secretKey)) return true;
    if (Array.isArray(value._keypair?.secretKey)) return true;
    return false;
  }
  const text = String(value || "").trim();
  if (!text) return false;
  if (/^\[\s*\d+[\s,\d]*\]$/.test(text)) {
    try {
      return JSON.parse(text).length >= 64;
    } catch {
      return true;
    }
  }
  try {
    return bs58.decode(text).length > 32;
  } catch {
    return false;
  }
}

function normalizePumpPortalPublicKey(value, code, message) {
  const text = String(value || "").trim();
  if (!text) {
    throw createPumpLaunchError(message, code, 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL
    });
  }
  if (looksLikeSecretKey(value)) {
    throw createPumpLaunchError("PumpPortal create payload cannot include a secret key.", "PUMPPORTAL_CREATE_SECRET_KEY_REJECTED", 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL
    });
  }
  try {
    return new PublicKey(text).toBase58();
  } catch {
    throw createPumpLaunchError(message, code, 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL
    });
  }
}

export function normalizePumpPortalCreatePayload(input = {}) {
  const tokenMetadata = input.tokenMetadata || {};
  const amount = normalizePumpPortalNumber(input.amount, 0.0001, 0.0001);
  const slippage = normalizePumpPortalSlippage(input);
  const priorityFee = normalizePumpPortalNumber(input.priorityFee, 0.00001, 0.000001);
  const payload = {
    publicKey: normalizePumpPortalPublicKey(
      input.publicKey,
      "PUMPPORTAL_CREATE_PUBLIC_KEY_INVALID",
      "PumpPortal create publicKey must be the selected dev wallet public key."
    ),
    action: "create",
    tokenMetadata: {
      name: normalizePumpPortalName(tokenMetadata.name ?? input.name),
      symbol: normalizePumpPortalSymbol(tokenMetadata.symbol ?? input.symbol),
      uri: normalizePumpPortalMetadataUri(tokenMetadata.uri ?? input.metadataUri)
    },
    mint: normalizePumpPortalPublicKey(
      input.mint,
      "PUMPPORTAL_CREATE_MINT_INVALID",
      "PumpPortal create mint must be the generated mint public key."
    ),
    denominatedInSol: String(input.denominatedInSol ?? "true").toLowerCase() === "false" ? "false" : "true",
    amount,
    slippage,
    priorityFee,
    pool: String(input.pool || "pump").trim() || "pump"
  };
  validatePumpPortalCreatePayload(payload);
  return payload;
}

export function validatePumpPortalCreatePayload(payload = {}) {
  if (Array.isArray(payload) || !payload || typeof payload !== "object") {
    throw createPumpLaunchError("PumpPortal create payload must be a JSON object, not an array.", "PUMPPORTAL_CREATE_BODY_INVALID", 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL
    });
  }
  const keys = Object.keys(payload).sort();
  const expectedKeys = ["action", "amount", "denominatedInSol", "mint", "pool", "priorityFee", "publicKey", "slippage", "tokenMetadata"].sort();
  if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) {
    throw createPumpLaunchError("PumpPortal create payload has unexpected fields.", "PUMPPORTAL_CREATE_BODY_INVALID", 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL,
      keys
    });
  }
  if (payload.action !== "create") {
    throw createPumpLaunchError("PumpPortal create action must be create.", "PUMPPORTAL_CREATE_ACTION_INVALID", 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL
    });
  }
  normalizePumpPortalPublicKey(payload.publicKey, "PUMPPORTAL_CREATE_PUBLIC_KEY_INVALID", "PumpPortal create publicKey must be valid.");
  normalizePumpPortalPublicKey(payload.mint, "PUMPPORTAL_CREATE_MINT_INVALID", "PumpPortal create mint must be valid.");
  if (payload.mint === payload.publicKey) {
    throw createPumpLaunchError("PumpPortal create mint must be different from the dev wallet public key.", "PUMPPORTAL_CREATE_MINT_INVALID", 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL
    });
  }
  const metadataKeys = Object.keys(payload.tokenMetadata || {}).sort();
  if (JSON.stringify(metadataKeys) !== JSON.stringify(["name", "symbol", "uri"])) {
    throw createPumpLaunchError("PumpPortal tokenMetadata must contain only name, symbol, and uri.", "PUMPPORTAL_CREATE_METADATA_INVALID", 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL
    });
  }
  normalizePumpPortalName(payload.tokenMetadata.name);
  normalizePumpPortalSymbol(payload.tokenMetadata.symbol);
  normalizePumpPortalMetadataUri(payload.tokenMetadata.uri);
  if (!["true", "false"].includes(payload.denominatedInSol) || typeof payload.denominatedInSol !== "string") {
    throw createPumpLaunchError("PumpPortal denominatedInSol must be the string true or false.", "PUMPPORTAL_CREATE_DENOMINATED_INVALID", 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL
    });
  }
  for (const key of ["amount", "slippage", "priorityFee"]) {
    if (typeof payload[key] !== "number" || !Number.isFinite(payload[key])) {
      throw createPumpLaunchError(`PumpPortal ${key} must be a finite number.`, "PUMPPORTAL_CREATE_NUMBER_INVALID", 400, {
        stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL,
        field: key
      });
    }
  }
  if (payload.amount < 0.0001) {
    throw createPumpLaunchError("PumpPortal amount must be at least 0.0001 SOL.", "PUMPPORTAL_CREATE_AMOUNT_INVALID", 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL
    });
  }
  if (payload.slippage <= 0) {
    throw createPumpLaunchError("PumpPortal slippage must be positive.", "PUMPPORTAL_CREATE_SLIPPAGE_INVALID", 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL
    });
  }
  if (payload.priorityFee < 0.000001) {
    throw createPumpLaunchError("PumpPortal priorityFee must be at least 0.000001 SOL.", "PUMPPORTAL_CREATE_PRIORITY_FEE_INVALID", 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL
    });
  }
  if (payload.pool !== "pump") {
    throw createPumpLaunchError("PumpPortal create pool must be pump.", "PUMPPORTAL_CREATE_POOL_INVALID", 400, {
      stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL,
      pool: payload.pool
    });
  }
  return true;
}

export function pumpPortalCreateDebugSummary(payload = {}) {
  const body = payload || {};
  const tokenMetadata = body.tokenMetadata || {};
  let publicKeyValid = false;
  let mintValid = false;
  try {
    publicKeyValid = new PublicKey(String(body.publicKey || "")).toBase58() === String(body.publicKey || "");
  } catch {
    publicKeyValid = false;
  }
  try {
    mintValid = new PublicKey(String(body.mint || "")).toBase58() === String(body.mint || "");
  } catch {
    mintValid = false;
  }
  return {
    method: "POST",
    contentType: "application/json",
    bodyIsArray: Array.isArray(body),
    bodyKeys: Object.keys(body).sort(),
    publicKeyValid,
    mintValid,
    mintLooksLikeSecret: looksLikeSecretKey(body.mint),
    nameLength: String(tokenMetadata.name || "").length,
    symbol: String(tokenMetadata.symbol || ""),
    symbolLength: String(tokenMetadata.symbol || "").length,
    metadataUri: String(tokenMetadata.uri || ""),
    denominatedInSolType: typeof body.denominatedInSol,
    denominatedInSol: body.denominatedInSol,
    amountType: typeof body.amount,
    amount: body.amount,
    slippageType: typeof body.slippage,
    slippage: body.slippage,
    priorityFeeType: typeof body.priorityFee,
    priorityFee: body.priorityFee,
    pool: body.pool
  };
}

export function pumpPortalRequestMeta(payload = {}) {
  return {
    endpointType: "pumpportal-local",
    method: "POST",
    contentType: "application/json",
    bodyIsArray: Array.isArray(payload),
    bodyKeys: Object.keys(payload || {}).sort()
  };
}

export function firstPumpPortalTransactionValue(value = {}) {
  if (!value || typeof value !== "object") return value;
  for (const candidate of [
    value.transaction,
    value.tx,
    value.serializedTransaction,
    value.signedTransaction,
    value.rawTransaction,
    value.data,
    value.result?.transaction,
    value.result?.tx,
    value.result?.serializedTransaction,
    value.result?.data
  ]) {
    if (candidate) return candidate;
  }
  return null;
}

export function decodePumpPortalTransaction(value) {
  if (!value) return null;
  if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
    return VersionedTransaction.deserialize(new Uint8Array(value));
  }
  if (Array.isArray(value) && value.every((item) => Number.isInteger(item) && item >= 0 && item <= 255)) {
    return VersionedTransaction.deserialize(Uint8Array.from(value));
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const tx = decodePumpPortalTransaction(item);
      if (tx) return tx;
    }
    return null;
  }
  if (typeof value === "object") {
    return decodePumpPortalTransaction(firstPumpPortalTransactionValue(value));
  }
  const encoded = String(value || "").trim();
  if (!encoded) return null;

  for (const decode of [
    () => Buffer.from(encoded, "base64"),
    () => Buffer.from(bs58.decode(encoded))
  ]) {
    try {
      return VersionedTransaction.deserialize(new Uint8Array(decode()));
    } catch {
      // Try the next encoding.
    }
  }
  return null;
}

export function sanitizePumpPortalCreateRequest(payload = {}) {
  return {
    publicKey: payload.publicKey || "",
    action: payload.action || "",
    mint: payload.mint || "",
    tokenMetadata: {
      name: payload.tokenMetadata?.name || "",
      symbol: payload.tokenMetadata?.symbol || "",
      uri: payload.tokenMetadata?.uri || ""
    },
    denominatedInSol: payload.denominatedInSol,
    amount: payload.amount,
    slippage: payload.slippage,
    priorityFee: payload.priorityFee,
    pool: payload.pool
  };
}

export function sanitizeProviderBody(value) {
  return String(value || "")
    .replace(/([A-Za-z0-9_-]*api[-_ ]?key[A-Za-z0-9_-]*["']?\s*[:=]\s*["']?)[^"',\s]+/gi, "$1[redacted]")
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, "$1[redacted]")
    .slice(0, 1000);
}

export function pumpLaunchLogEntry(event, fields = {}) {
  const entry = {
    event,
    kind: "pump_launch",
    at: new Date().toISOString(),
    ...fields
  };
  delete entry.secret;
  delete entry.privateKey;
  delete entry.private_key;
  delete entry.secretKey;
  delete entry.secret_key;
  delete entry.encryptedMintSecret;
  delete entry.encryptedSecret;
  if (entry.providerResponseBody) {
    entry.providerResponseBody = sanitizeProviderBody(entry.providerResponseBody);
  }
  return entry;
}

export function formatPumpLaunchUserError(error) {
  const stage = error?.stage || error?.cause?.stage || "";
  const code = error?.code || "";
  const message = String(error?.message || "Pump launch failed").replace(/\s+/g, " ").trim();
  const status = Number(error?.providerStatus || error?.status || error?.statusCode || 0);
  const launchAttemptId = error?.launchAttemptId ? ` launchAttemptId=${error.launchAttemptId}` : "";

  if (code === "PUMP_LAUNCH_NOT_ENABLED") return `Direct Pump launch is not enabled on the backend.${launchAttemptId}`;
  if (code === "PUMP_LAUNCH_API_URL_INVALID") return `${message}${launchAttemptId}`;
  if (code === "PUMP_METADATA_CONFIG_MISSING") return `Metadata upload is not configured. Contact support with${launchAttemptId || " the launch attempt ID"}.`;
  if (code === "PUMP_METADATA_CONFIG_PLACEHOLDER") return `Metadata upload is not configured. Contact support with${launchAttemptId || " the launch attempt ID"}.`;
  if (code === "PUMP_METADATA_AUTH_FAILED") return `Metadata upload provider rejected authorization. Contact support with${launchAttemptId || " the launch attempt ID"}.`;
  if (code === "PUMPPORTAL_CREATE_METADATA_URI_TIMEOUT" || code === "PUMP_METADATA_FETCH_TIMEOUT" || code === "PUMP_METADATA_IMAGE_FETCH_TIMEOUT") {
    return `Metadata upload failed before PumpPortal was called: Token metadata URI is not publicly fetchable fast enough for PumpPortal. Retry in a moment or contact support with${launchAttemptId || " the launch attempt ID"}.`;
  }
  if (code === "MISSING_DEV_WALLET") return "Choose a managed SlimeWire dev wallet before launching.";
  if (code === "DEV_WALLET_NOT_AUTHORIZED") return message;
  if (code === "DEV_WALLET_NOT_FOUND") return message;
  if (code === "DEV_WALLET_NOT_MANAGED") return message;
  if (code === "DEV_WALLET_LOAD_FAILED") return `${message}${launchAttemptId}`;
  if (code === "DEV_WALLET_DECRYPT_FAILED") return `Selected dev wallet could not be decrypted for signing.${launchAttemptId}`;
  if (code === "DEV_WALLET_INSUFFICIENT_SOL") return message;
  if (stage === PUMP_LAUNCH_STAGE.METADATA_UPLOAD && (status === 401 || status === 403 || /not authorized|unauthorized/i.test(message))) {
    return `Metadata upload provider rejected authorization. Contact support with${launchAttemptId || " the launch attempt ID"}.`;
  }
  if (stage === PUMP_LAUNCH_STAGE.METADATA_UPLOAD) {
    return `Metadata upload failed before PumpPortal was called: ${message}${launchAttemptId}`;
  }
  if (stage === PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL) {
    return `PumpPortal Local API rejected the create request: ${message}${launchAttemptId}`;
  }
  if (stage === PUMP_LAUNCH_STAGE.SIGNING) {
    return `PumpPortal returned a transaction, but SlimeWire could not sign it with the mint and dev wallet: ${message}${launchAttemptId}`;
  }
  if (stage === PUMP_LAUNCH_STAGE.SEND_TRANSACTION) {
    return `Pump launch transaction was signed but failed to send or confirm: ${message}${launchAttemptId}`;
  }
  if (stage === PUMP_LAUNCH_STAGE.STORE_RESULT && error?.txSignature) {
    return `Token launched on-chain but failed to save in SlimeWire. Contact support with launchAttemptId=${error.launchAttemptId || ""} txSignature=${error.txSignature}.`;
  }
  return `${message}${launchAttemptId}`;
}

export class PumpLaunchService {
  constructor(deps = {}) {
    this.getBalanceLamports = deps.getBalanceLamports;
    this.uploadMetadata = deps.uploadMetadata;
    this.requestLocalTransaction = deps.requestLocalTransaction;
    this.sendTransaction = deps.sendTransaction;
    this.generateMintKeypair = deps.generateMintKeypair;
    this.validateMetadataUri = deps.validateMetadataUri || (async () => {});
    this.encryptMintSecret = deps.encryptMintSecret || null;
    this.saveAttempt = deps.saveAttempt || (async () => {});
    this.recordTradeEvent = deps.recordTradeEvent || (async () => {});
    this.log = deps.log || (() => {});
    this.now = deps.now || (() => new Date());
  }

  async launch({
    launchAttemptId,
    userId,
    wallet,
    walletKeypair,
    basePayload,
    body = {},
    config = {}
  }) {
    if (!this.getBalanceLamports || !this.uploadMetadata || !this.requestLocalTransaction || !this.sendTransaction || !this.generateMintKeypair) {
      throw createPumpLaunchError("PumpLaunchService is missing required backend dependencies.", "PUMP_LAUNCH_SERVICE_MISCONFIGURED", 500);
    }
    if (!wallet || !walletKeypair) {
      throw createPumpLaunchError("Selected dev wallet could not be loaded for signing.", "DEV_WALLET_LOAD_FAILED", 400, {
        stage: PUMP_LAUNCH_STAGE.WALLET_AUTH
      });
    }
    if (!isServerSignableWallet(wallet)) {
      throw createPumpLaunchError("Selected dev wallet is not a managed SlimeWire/server-signable wallet.", "DEV_WALLET_NOT_MANAGED", 400, {
        stage: PUMP_LAUNCH_STAGE.WALLET_AUTH,
        devWalletPublicKey: wallet.publicKey
      });
    }

    const attemptId = launchAttemptId || basePayload?.clientRequestId;
    const mintKeypair = this.generateMintKeypair();
    const mintPublicKey = mintKeypair.publicKey.toBase58();
    const devWalletPublicKey = walletKeypair.publicKey.toBase58();
    const selectedDevWalletId = String(wallet.webIndex || body.devWalletIndex || wallet.publicKey || "").trim();
    const devBuySol = Math.max(0.0001, Number(basePayload?.devBuy?.amountSol || body.amountSol || 0.0001));
    const priorityFeeSol = Math.max(0, Number(config.priorityFeeSol || 0));
    const requiredSol = pumpLaunchRequiredSol({
      devBuySol,
      priorityFeeSol,
      bufferSol: config.requiredBufferSol
    });
    let submittedSignature = "";

    if (wallet.publicKey && wallet.publicKey !== devWalletPublicKey) {
      throw createPumpLaunchError("Decrypted dev wallet key does not match the selected wallet public key.", "DEV_WALLET_KEY_MISMATCH", 500, {
        stage: PUMP_LAUNCH_STAGE.WALLET_AUTH,
        devWalletPublicKey: wallet.publicKey
      });
    }

    const baseAttempt = {
      id: attemptId,
      launchAttemptId: attemptId,
      userId,
      selectedDevWalletId,
      devWalletPublicKey,
      walletType: "managed_slimewire",
      walletManaged: true,
      authResult: "authorized",
      tokenName: basePayload?.name || "",
      symbol: basePayload?.symbol || "",
      mintPublicKey,
      mintSecretStored: Boolean(this.encryptMintSecret),
      encryptedMintSecret: this.encryptMintSecret ? this.encryptMintSecret(mintKeypair) : null,
      devBuySol,
      priorityFeeSol,
      requiredSol,
      apiUrl: config.apiUrl || "",
      status: PUMP_LAUNCH_STATUS.PENDING,
      stage: PUMP_LAUNCH_STAGE.WALLET_AUTH,
      createdAt: this.now().toISOString(),
      updatedAt: this.now().toISOString()
    };
    await this.saveAttempt(baseAttempt);
    this.log("pump_launch_wallet_validated", {
      launchAttemptId: attemptId,
      userId,
      selectedDevWalletId,
      devWalletPublicKey,
      walletType: "managed_slimewire",
      walletManaged: true,
      authResult: "authorized",
      tokenName: basePayload?.name || "",
      symbol: basePayload?.symbol || "",
      mintPublicKey,
      mintSecretStored: Boolean(this.encryptMintSecret),
      devBuySol,
      priorityFeeSol,
      requiredSol,
      apiUrl: config.apiUrl || "",
      status: PUMP_LAUNCH_STATUS.PENDING,
      stage: PUMP_LAUNCH_STAGE.WALLET_AUTH
    });

    try {
      validatePumpPortalLocalApiUrl(config.apiUrl);
      await this.saveAttempt({
        id: attemptId,
        status: PUMP_LAUNCH_STATUS.VALIDATING,
        stage: PUMP_LAUNCH_STAGE.BALANCE_CHECK,
        updatedAt: this.now().toISOString()
      });
      const balanceLamports = await this.getBalanceLamports(walletKeypair.publicKey);
      const balanceSol = Number(balanceLamports || 0) / LAMPORTS_PER_SOL;
      assertPumpLaunchBalance({ balanceSol, requiredSol });
      await this.saveAttempt({
        id: attemptId,
        status: PUMP_LAUNCH_STATUS.VALIDATING,
        stage: PUMP_LAUNCH_STAGE.BALANCE_CHECK,
        balanceSol,
        requiredSol,
        updatedAt: this.now().toISOString()
      });
      this.log("pump_launch_preflight_passed", {
        launchAttemptId: attemptId,
        userId,
        selectedDevWalletId,
        devWalletPublicKey,
        balanceSol,
        requiredSol
      });

      let metadata;
      try {
        await this.saveAttempt({
          id: attemptId,
          status: PUMP_LAUNCH_STATUS.UPLOADING_METADATA,
          stage: PUMP_LAUNCH_STAGE.METADATA_UPLOAD,
          updatedAt: this.now().toISOString()
        });
        metadata = await this.uploadMetadata(basePayload);
        const metadataValidation = await this.validateMetadataUri(metadata.uri);
        if (metadataValidation?.uri) {
          metadata.uri = metadataValidation.uri;
        }
        await this.saveAttempt({
          id: attemptId,
          metadataValidation,
          metadataValidatedAt: this.now().toISOString(),
          updatedAt: this.now().toISOString()
        });
      } catch (error) {
        throw pumpLaunchStageError(PUMP_LAUNCH_STAGE.METADATA_UPLOAD, error.code || "PUMP_LAUNCH_METADATA_UPLOAD_FAILED", error);
      }
      await this.saveAttempt({
        id: attemptId,
        status: PUMP_LAUNCH_STATUS.METADATA_UPLOADED,
        stage: PUMP_LAUNCH_STAGE.METADATA_UPLOAD,
        metadataUri: metadata.uri,
        imageUri: metadata.imageUri || "",
        imageBytes: metadata.imageBytes || 0,
        updatedAt: this.now().toISOString()
      });
      this.log("pump_launch_metadata_uploaded", {
        launchAttemptId: attemptId,
        userId,
        selectedDevWalletId,
        devWalletPublicKey,
        metadataUri: metadata.uri,
        imageBytes: metadata.imageBytes || 0
      });

      const requestPayload = buildPumpPortalLocalCreateRequest({
        creatorPublicKey: devWalletPublicKey,
        mintPublicKey,
        name: basePayload?.name,
        symbol: basePayload?.symbol,
        metadataUri: metadata.uri,
        devBuySol,
        slippageBps: basePayload?.slippageBps || body.slippageBps,
        priorityFeeSol,
        pool: config.pool || "pump"
      });
      const sanitizedRequest = sanitizePumpPortalCreateRequest(requestPayload);
      const requestMeta = pumpPortalRequestMeta(requestPayload);
      await this.saveAttempt({
        id: attemptId,
        status: PUMP_LAUNCH_STATUS.BUILDING_TX,
        stage: PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL,
        requestBody: sanitizedRequest,
        requestMeta,
        updatedAt: this.now().toISOString()
      });
      this.log("pump_launch_pumpportal_request", {
        launchAttemptId: attemptId,
        userId,
        selectedDevWalletId,
        devWalletPublicKey,
        apiUrl: config.apiUrl || "",
        requestMeta,
        requestBody: sanitizedRequest
      });

      let tx;
      try {
        tx = await this.requestLocalTransaction(requestPayload, config.timeoutMs);
      } catch (error) {
        throw pumpLaunchStageError(PUMP_LAUNCH_STAGE.PUMPPORTAL_LOCAL, "PUMPPORTAL_LOCAL_CREATE_FAILED", error);
      }

      if (tx?.signature) {
        await this.saveAttempt({
          id: attemptId,
          status: PUMP_LAUNCH_STATUS.SUBMITTED,
          txSignature: tx.signature,
          updatedAt: this.now().toISOString()
        });
        this.log("pump_launch_transaction_signature", {
          launchAttemptId: attemptId,
          userId,
          mintPublicKey,
          txSignature: tx.signature,
          status: PUMP_LAUNCH_STATUS.SUBMITTED
        });
        return {
          status: PUMP_LAUNCH_STATUS.SUBMITTED,
          tokenMint: mintPublicKey,
          signature: tx.signature,
          requestId: attemptId,
          provider: "pumpportal-local",
          metadataUri: metadata.uri
        };
      }

      try {
        await this.saveAttempt({
          id: attemptId,
          status: PUMP_LAUNCH_STATUS.SIGNING,
          stage: PUMP_LAUNCH_STAGE.SIGNING,
          updatedAt: this.now().toISOString()
        });
        tx.sign([mintKeypair, walletKeypair]);
      } catch (error) {
        throw pumpLaunchStageError(PUMP_LAUNCH_STAGE.SIGNING, "PUMP_LAUNCH_SIGNING_FAILED", error, 500);
      }
      await this.saveAttempt({
        id: attemptId,
        status: PUMP_LAUNCH_STATUS.SIGNING,
        stage: PUMP_LAUNCH_STAGE.SIGNING,
        updatedAt: this.now().toISOString()
      });
      this.log("pump_launch_transaction_signed", {
        launchAttemptId: attemptId,
        userId,
        mintPublicKey,
        devWalletPublicKey,
        signerCount: 2,
        status: PUMP_LAUNCH_STATUS.SIGNED
      });

      let signature;
      try {
        await this.saveAttempt({
          id: attemptId,
          status: PUMP_LAUNCH_STATUS.SENDING,
          stage: PUMP_LAUNCH_STAGE.SEND_TRANSACTION,
          updatedAt: this.now().toISOString()
        });
        signature = await this.sendTransaction(tx);
      } catch (error) {
        throw pumpLaunchStageError(PUMP_LAUNCH_STAGE.SEND_TRANSACTION, "PUMP_LAUNCH_SEND_FAILED", error);
      }
      submittedSignature = signature;

      await this.saveAttempt({
        id: attemptId,
        status: PUMP_LAUNCH_STATUS.REGISTERING_TOKEN,
        stage: PUMP_LAUNCH_STAGE.STORE_RESULT,
        txSignature: signature,
        updatedAt: this.now().toISOString()
      });
      try {
        await this.recordTradeEvent({
          userId,
          type: "buy",
          source: "pumpfun_launch",
          tokenMint: mintPublicKey,
          tokenName: basePayload?.name || "",
          symbol: basePayload?.symbol || "",
          walletLabel: wallet.label,
          walletPublicKey: devWalletPublicKey,
          solLamportsSpent: String(solToLamportsNumber(devBuySol)),
          tokenAmount: null,
          signature,
          metadataUri: metadata.uri
        });
      } catch (error) {
        throw pumpLaunchStageError(PUMP_LAUNCH_STAGE.STORE_RESULT, "PUMP_LAUNCH_TOKEN_REGISTRATION_FAILED", error, 500, {
          txSignature: signature
        });
      }
      await this.saveAttempt({
        id: attemptId,
        status: PUMP_LAUNCH_STATUS.COMPLETE,
        stage: PUMP_LAUNCH_STAGE.STORE_RESULT,
        txSignature: signature,
        metadataUri: metadata.uri,
        completedAt: this.now().toISOString(),
        updatedAt: this.now().toISOString()
      });
      this.log("pump_launch_transaction_signature", {
        launchAttemptId: attemptId,
        userId,
        mintPublicKey,
        txSignature: signature,
        status: PUMP_LAUNCH_STATUS.LAUNCHED
      });

      return {
        status: PUMP_LAUNCH_STATUS.COMPLETE,
        tokenMint: mintPublicKey,
        signature,
        requestId: attemptId,
        provider: "pumpportal-local",
        metadataUri: metadata.uri
      };
    } catch (error) {
      error.launchAttemptId = error.launchAttemptId || attemptId;
      if (submittedSignature && !error.txSignature) error.txSignature = submittedSignature;
      const failureReason = formatPumpLaunchUserError(error);
      const failureStatus = ["PUMP_METADATA_AUTH_FAILED", "PUMP_METADATA_CONFIG_MISSING", "PUMP_METADATA_CONFIG_PLACEHOLDER"].includes(error.code)
        ? PUMP_LAUNCH_STATUS.FAILED_METADATA_AUTH
        : ["PUMPPORTAL_CREATE_METADATA_URI_TIMEOUT", "PUMP_METADATA_FETCH_TIMEOUT", "PUMP_METADATA_IMAGE_FETCH_TIMEOUT"].includes(error.code)
          ? PUMP_LAUNCH_STATUS.FAILED_METADATA_FETCH_TIMEOUT
          : PUMP_LAUNCH_STATUS.FAILED;
      await this.saveAttempt({
        id: attemptId,
        status: failureStatus,
        stage: error.stage || PUMP_LAUNCH_STAGE.STORE_RESULT,
        errorCode: error.code || "PUMP_LAUNCH_FAILED",
        errorMessage: String(error.message || error).slice(0, 500),
        failureReason,
        txSignature: error.txSignature || submittedSignature || undefined,
        providerStatus: error.providerStatus || error.status || error.statusCode || null,
        providerStatusText: error.providerStatusText || "",
        providerResponseContentType: error.providerResponseContentType || error.responseContentType || "",
        providerResponseBody: sanitizeProviderBody(error.providerResponseBody || error.responseBody || ""),
        requestMeta: error.requestMeta || undefined,
        failedAt: this.now().toISOString(),
        updatedAt: this.now().toISOString()
      });
      this.log("pump_launch_failed", {
        launchAttemptId: attemptId,
        userId,
        selectedDevWalletId,
        devWalletPublicKey,
        mintPublicKey,
        status: failureStatus,
        stage: error.stage || "",
        errorCode: error.code || "PUMP_LAUNCH_FAILED",
        errorMessage: String(error.message || error).slice(0, 500),
        failureReason,
        txSignature: error.txSignature || submittedSignature || undefined,
        providerStatus: error.providerStatus || error.status || error.statusCode || null,
        providerStatusText: error.providerStatusText || "",
        providerResponseContentType: error.providerResponseContentType || error.responseContentType || "",
        providerResponseBody: error.providerResponseBody || error.responseBody || ""
      });
      throw error;
    }
  }
}
