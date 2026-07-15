const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

function addressOf(value) {
  const candidate = typeof value === "string"
    ? value
    : (value?.hash || value?.address_hash || value?.address || "");
  return EVM_ADDRESS_RE.test(String(candidate || "").trim())
    ? String(candidate).trim().toLowerCase()
    : "";
}

function timestampMs(value) {
  if (value == null || value === "") return 0;
  if (typeof value === "number" || /^\d+$/.test(String(value))) {
    const numeric = Number(value) || 0;
    return numeric > 1e12 ? numeric : numeric * 1000;
  }
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function decimalAmount(rawValue, decimals = 0) {
  const raw = String(rawValue ?? "").trim();
  if (!/^\d+$/.test(raw)) return 0;
  const places = Math.max(0, Math.min(255, Number(decimals) || 0));
  // Keep the useful leading precision without overflowing Number on spam tokens with enormous supplies.
  const padded = places > 0 ? raw.padStart(places + 1, "0") : raw;
  const whole = places > 0 ? padded.slice(0, -places) : padded;
  const fraction = places > 0 ? padded.slice(-places).slice(0, 12) : "";
  const amount = Number(`${whole || "0"}${fraction ? `.${fraction}` : ""}`);
  return Number.isFinite(amount) ? amount : 0;
}

function resultItems(value) {
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.result)) return value.result;
  return Array.isArray(value) ? value : [];
}

/**
 * Normalize Blockscout v2 Ethereum address activity into the shared SlimeWire fund-flow shape.
 * Regular and internal ETH movements are kept separate; token transfers are deduplicated by log index.
 */
export function normalizeEthereumFundFlows({ transactions, internalTransactions, tokenTransfers } = {}) {
  const records = [];
  const seen = new Set();
  const push = (key, record) => {
    if (!record.from || !record.to || record.from === record.to || seen.has(key)) return;
    seen.add(key);
    records.push(record);
  };

  for (const transaction of resultItems(transactions)) {
    const from = addressOf(transaction?.from), to = addressOf(transaction?.to);
    const native = decimalAmount(transaction?.value, 18);
    if (!(native > 0)) continue;
    const tx = String(transaction?.hash || transaction?.transaction_hash || "");
    push(`tx:${tx || `${from}:${to}:${transaction?.block_number || ""}:${transaction?.nonce || ""}`}`, {
      from, to, native, nativeSymbol: "ETH", at: timestampMs(transaction?.timestamp || transaction?.timeStamp), tx
    });
  }

  for (const transfer of resultItems(internalTransactions)) {
    const from = addressOf(transfer?.from), to = addressOf(transfer?.to);
    const native = decimalAmount(transfer?.value, 18);
    if (!(native > 0)) continue;
    const tx = String(transfer?.transaction_hash || transfer?.hash || "");
    const index = String(transfer?.index ?? transfer?.trace_index ?? transfer?.block_index ?? "");
    push(`internal:${tx}:${index}:${from}:${to}:${transfer?.value || ""}`, {
      from, to, native, nativeSymbol: "ETH", at: timestampMs(transfer?.timestamp || transfer?.timeStamp), tx
    });
  }

  for (const transfer of resultItems(tokenTransfers)) {
    const from = addressOf(transfer?.from), to = addressOf(transfer?.to);
    const token = transfer?.token || {};
    const total = transfer?.total || {};
    const raw = total?.value ?? transfer?.value ?? transfer?.amount ?? "1";
    const decimals = total?.decimals ?? token?.decimals ?? transfer?.tokenDecimal ?? 0;
    const tokenAmount = decimalAmount(raw, decimals) || 1;
    const tx = String(transfer?.transaction_hash || transfer?.hash || "");
    const logIndex = String(transfer?.log_index ?? transfer?.index ?? "");
    push(`token:${tx}:${logIndex}:${addressOf(token) || transfer?.contractAddress || ""}:${from}:${to}`, {
      from,
      to,
      mint: addressOf(token) || addressOf(transfer?.contractAddress),
      symbol: String(token?.symbol || token?.name || transfer?.tokenSymbol || transfer?.tokenName || "TOKEN").slice(0, 24),
      tokenAmount,
      nativeSymbol: "ETH",
      at: timestampMs(transfer?.timestamp || transfer?.timeStamp),
      tx
    });
  }
  return records;
}

export async function fetchEthereumFundFlows(address, options = {}) {
  const wallet = addressOf(address);
  if (!wallet) return [];
  const fetchJson = options.fetchJson;
  if (typeof fetchJson !== "function") throw new TypeError("fetchJson is required");
  const timeoutMs = Math.max(1_000, Math.min(8_000, Number(options.timeoutMs) || 5_000));
  const base = String(options.baseUrl || "https://eth.blockscout.com/api/v2").replace(/\/$/, "");
  const read = (suffix) => fetchJson(`${base}/addresses/${wallet}/${suffix}`, {
    headers: { accept: "application/json" }, timeoutMs
  }).catch(() => null);
  const [transactions, internalTransactions, tokenTransfers] = await Promise.all([
    read("transactions"), read("internal-transactions"), read("token-transfers")
  ]);
  return normalizeEthereumFundFlows({ transactions, internalTransactions, tokenTransfers });
}
