const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(timer) };
}

function usefulHex(value, bytes = 1) {
  const text = String(value || "");
  return /^0x[0-9a-f]+$/i.test(text) && text.length >= 2 + bytes * 2;
}

async function blockscoutTokenProbe(address, fetchImpl, timeoutMs) {
  const timer = withTimeout(timeoutMs);
  try {
    const response = await fetchImpl(`https://robinhoodchain.blockscout.com/api/v2/tokens/${address}`, {
      signal: timer.signal,
      headers: { accept: "application/json", "user-agent": "SlimeWire/1.0" },
    });
    if (!response.ok) throw new Error(`Blockscout token ${response.status}`);
    const data = await response.json();
    if (/^ERC-20$/i.test(String(data?.type || ""))) return { isToken: true, source: "blockscout-token" };
    throw new Error("not ERC-20 metadata");
  } finally {
    timer.done();
  }
}

async function rpcTokenProbe(address, rpcUrl, fetchImpl, timeoutMs) {
  if (!rpcUrl) throw new Error("missing Robinhood RPC");
  const timer = withTimeout(timeoutMs);
  try {
    // One JSON-RPC batch distinguishes an EOA, ERC-20, and smart-contract wallet. Bytecode alone is not
    // enough: smart wallets are contracts too, but they must open the wallet card rather than a coin card.
    const response = await fetchImpl(rpcUrl, {
      method: "POST",
      signal: timer.signal,
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify([
        { jsonrpc: "2.0", id: 1, method: "eth_getCode", params: [address, "latest"] },
        { jsonrpc: "2.0", id: 2, method: "eth_call", params: [{ to: address, data: "0x18160ddd" }, "latest"] }, // totalSupply()
        { jsonrpc: "2.0", id: 3, method: "eth_call", params: [{ to: address, data: "0x313ce567" }, "latest"] }, // decimals()
        { jsonrpc: "2.0", id: 4, method: "eth_call", params: [{ to: address, data: "0x95d89b41" }, "latest"] }, // symbol()
      ]),
    });
    if (!response.ok) throw new Error(`Robinhood RPC ${response.status}`);
    const json = await response.json();
    const rows = Array.isArray(json) ? json : [];
    const result = (id) => rows.find((row) => Number(row?.id) === id)?.result;
    const code = String(result(1) || "");
    if (code === "0x" || code === "0x0") return { isToken: false, source: "rpc-eoa" };
    if (!usefulHex(code)) throw new Error("RPC omitted bytecode");
    const hasSupply = usefulHex(result(2), 32);
    const hasDecimals = usefulHex(result(3), 32);
    const hasSymbol = usefulHex(result(4), 32);
    return {
      isToken: Boolean(hasSupply && (hasDecimals || hasSymbol)),
      source: hasSupply && (hasDecimals || hasSymbol) ? "rpc-erc20" : "rpc-smart-wallet",
    };
  } finally {
    timer.done();
  }
}

export async function classifyRhAddress(address, options = {}) {
  const clean = String(address || "").trim();
  if (!EVM_ADDRESS.test(clean)) return { isToken: null, source: "invalid" };
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== "function") return { isToken: null, source: "no-fetch" };
  const timeoutMs = Math.max(500, Number(options.timeoutMs) || 5_500);
  const rpcUrls = [...new Set([
    String(options.rpcUrl || "").trim(),
    String(options.fallbackRpcUrl || "https://rpc.mainnet.chain.robinhood.com").trim(),
  ].filter(Boolean))];
  const probes = [
    blockscoutTokenProbe(clean, fetchImpl, timeoutMs),
    ...rpcUrls.map((url) => rpcTokenProbe(clean, url, fetchImpl, timeoutMs)),
  ];
  try {
    return await Promise.any(probes);
  } catch {
    return { isToken: null, source: "unavailable" };
  }
}

