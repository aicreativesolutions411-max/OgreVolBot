// Alchemy bills Solana JSON-RPC requests in Compute Units (CU). Keep this table
// deliberately limited to methods used by rpcRead callers in this service. The
// values mirror Alchemy's published Solana Compute Unit cost table.
export const ALCHEMY_SOLANA_METHOD_CU = Object.freeze({
  getAccountInfo: 10,
  getBalance: 10,
  getMinimumBalanceForRentExemption: 10,
  getTokenAccountsByOwner: 10,
  getBlockHeight: 20,
  getFeeForMessage: 20,
  getMultipleAccounts: 20,
  getProgramAccounts: 20,
  getLatestBlockhash: 20,
  getSignatureStatuses: 20,
  sendTransaction: 20,
  getTokenAccountBalance: 20,
  getTokenLargestAccounts: 20,
  getTokenSupply: 20,
  simulateTransaction: 20,
  getSignaturesForAddress: 40,
  getTransaction: 40
});

function cleanLabel(value) {
  return String(value || "rpc")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\b0x[0-9a-f]{8,}\b/gi, "<address>")
    .replace(/\b[1-9A-HJ-NP-Za-km-z]{32,100}\b/g, "<id>")
    .replace(/\b\d{7,}\b/g, "<number>")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "rpc";
}

export function isAlchemyRpcProvider(providerName = "", providerHost = "") {
  return /alchemy/i.test(`${String(providerName || "")} ${String(providerHost || "")}`);
}

// rpcRead accepts an operation closure, so the JSON-RPC method is not directly
// visible at the call boundary. Its labels are intentionally stable; infer the
// underlying method here and allow an explicit method override for new callers.
export function inferSolanaRpcMethod(label = "", explicitMethod = "") {
  const explicit = String(explicitMethod || "").trim();
  if (explicit) return Object.hasOwn(ALCHEMY_SOLANA_METHOD_CU, explicit) ? explicit : "unknown";
  const value = cleanLabel(label).toLowerCase();

  if (/\b(signatures?|sigs?)\b|token history/.test(value)) return "getSignaturesForAddress";
  if (/\bblockhash\b/.test(value)) return "getLatestBlockhash";
  if (/\bblock height\b/.test(value)) return "getBlockHeight";
  if (/minimum balance.*rent|rent exemption/.test(value)) return "getMinimumBalanceForRentExemption";
  if (/\bfee for message\b/.test(value)) return "getFeeForMessage";
  if (/\bsimulat(?:e|ion).*\btransaction\b/.test(value)) return "simulateTransaction";
  if (/\bconfirm\b|signature status|\bstatuses\b/.test(value)) return "getSignatureStatuses";
  if (/^send\b|\bsend\b.*\btransaction\b/.test(value)) return "sendTransaction";
  if (/\btransaction\b|(^|[:\s-])tx($|[:\s-])|transaction audit/.test(value)) return "getTransaction";

  if (/holder count/.test(value)) return "getProgramAccounts";
  if (/\blargest\b/.test(value)) return "getTokenLargestAccounts";
  if (/\bsupply\b/.test(value)) return "getTokenSupply";

  if (/batch wallet sol balances|multiple accounts|onchain dist: token accounts|owner programs|classify/.test(value)) {
    return "getMultipleAccounts";
  }
  if (/token accounts for selected mint|token-2022 accounts for selected mint|dev balance|token accounts/.test(value)) {
    return "getTokenAccountsByOwner";
  }

  if (/mint safety|mint owner program|mint authorities|mint account|onchain meta|addr-kind|account info/.test(value)) {
    return "getAccountInfo";
  }
  if (/\bbalance\b/.test(value)) return "getBalance";
  return "unknown";
}

// Alchemy documents a small set of request failures as zero-CU. They still
// count as attempts/errors/retries, but charging their normal method cost would
// overstate the bill during a rate-limit incident.
export function alchemyErrorCostsCu(error) {
  if (!error) return true;
  const status = Number(error?.status ?? error?.statusCode ?? error?.response?.status ?? 0);
  const code = Number(error?.code ?? error?.error?.code ?? error?.response?.data?.error?.code ?? 0);
  const message = String(
    error?.message
    || error?.error?.message
    || error?.response?.data?.error?.message
    || error
    || ""
  );
  if (status === 403 || status === 429 || code === 403 || code === 429 || code === -32601) return false;
  return !/\b(?:403|429)\b|method not found|ip(?: address)? (?:is )?not (?:allowlisted|on (?:the )?whitelist)|ip whitelist|origin (?:is )?not allowlisted|origin whitelist|app (?:is )?inactive/i.test(message);
}

function newBucket(label = "", method = "unknown") {
  return {
    label,
    method,
    requests: 0,
    successful: 0,
    errors: 0,
    retries: 0,
    estimatedCu: 0
  };
}

export function createAlchemyRpcTelemetry({ maxLabels = 64, topLabels = 12 } = {}) {
  const startedAt = new Date().toISOString();
  const labelLimit = Math.max(8, Math.min(256, Number(maxLabels) || 64));
  const topLimit = Math.max(1, Math.min(30, Number(topLabels) || 12));
  const labels = new Map();
  const methods = new Map();
  const totals = {
    requests: 0,
    successful: 0,
    errors: 0,
    retries: 0,
    estimatedCu: 0,
    unknownMethodRequests: 0
  };

  function record({
    label = "rpc",
    method = "",
    providerName = "",
    providerHost = "",
    error = null,
    retry = false
  } = {}) {
    if (!isAlchemyRpcProvider(providerName, providerHost)) return false;

    const safeLabel = cleanLabel(label);
    const rpcMethod = inferSolanaRpcMethod(safeLabel, method);
    const failed = Boolean(error);
    const cu = failed && !alchemyErrorCostsCu(error)
      ? 0
      : Number(ALCHEMY_SOLANA_METHOD_CU[rpcMethod] || 0);

    totals.requests += 1;
    totals.successful += failed ? 0 : 1;
    totals.errors += failed ? 1 : 0;
    totals.retries += retry ? 1 : 0;
    totals.estimatedCu += cu;
    totals.unknownMethodRequests += rpcMethod === "unknown" ? 1 : 0;

    let labelKey = safeLabel;
    // Reserve the final bucket for all future labels so the Map itself never
    // exceeds labelLimit (not labelLimit + one overflow bucket).
    if (!labels.has(labelKey) && labels.size >= labelLimit - 1) labelKey = "other";
    if (!labels.has(labelKey)) labels.set(labelKey, newBucket(labelKey, rpcMethod));
    const labelBucket = labels.get(labelKey);
    // "other" can contain multiple methods; keep it honest instead of showing
    // a misleading single inferred method.
    if (labelBucket.method !== rpcMethod) labelBucket.method = "mixed";
    labelBucket.requests += 1;
    labelBucket.successful += failed ? 0 : 1;
    labelBucket.errors += failed ? 1 : 0;
    labelBucket.retries += retry ? 1 : 0;
    labelBucket.estimatedCu += cu;

    if (!methods.has(rpcMethod)) methods.set(rpcMethod, newBucket("", rpcMethod));
    const methodBucket = methods.get(rpcMethod);
    methodBucket.requests += 1;
    methodBucket.successful += failed ? 0 : 1;
    methodBucket.errors += failed ? 1 : 0;
    methodBucket.retries += retry ? 1 : 0;
    methodBucket.estimatedCu += cu;
    return true;
  }

  function snapshot() {
    const byMethod = [...methods.values()]
      .sort((a, b) => b.estimatedCu - a.estimatedCu || b.requests - a.requests || a.method.localeCompare(b.method))
      .map(({ label: _label, ...row }) => ({ ...row }));
    const topConsumers = [...labels.values()]
      .sort((a, b) => b.estimatedCu - a.estimatedCu || b.requests - a.requests || a.label.localeCompare(b.label))
      .slice(0, topLimit)
      .map((row) => ({ ...row }));
    return {
      startedAt,
      ...totals,
      trackedLabelCount: labels.size,
      labelLimit,
      byMethod,
      topConsumers
    };
  }

  return Object.freeze({ record, snapshot });
}
