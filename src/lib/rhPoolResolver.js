const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const RH_PUBLIC_RPC = "https://rpc.mainnet.chain.robinhood.com";

// Common Robinhood Chain quote assets. DexScreener normally puts the traded coin
// on the base side, but recognizing quotes also handles reversed pools.
export const RH_POOL_QUOTE_TOKENS = new Set([
  "0x0000000000000000000000000000000000000000", // native ETH placeholder
  "0x0bd7d308f8e1639fab988df18a8011f41eacad73", // WETH
  "0xc6911796042b15d7fa4f6cde69e245ddcd3d9c31", // VIRTUAL
  "0x5fc5360d0400a0fd4f2af552add042d716f1d168", // USDG
]);

const poolResolutionCache = new Map();
const resolvedPoolHintsByToken = new Map();

function rememberResolvedPoolHint(tokenAddress, poolAddress, pair = null) {
  const token = normalizeAddress(tokenAddress).toLowerCase();
  const pool = normalizeAddress(poolAddress).toLowerCase();
  if (!token || !pool || token === pool) return;
  const rows = resolvedPoolHintsByToken.get(token) || [];
  const existing = rows.find((row) => row.poolAddress === pool);
  const next = [{ poolAddress: pool, pair: pair && typeof pair === "object" ? pair : (existing?.pair || null), at: Date.now() },
    ...rows.filter((row) => row.poolAddress !== pool)].slice(0, 4);
  resolvedPoolHintsByToken.set(token, next);
  if (resolvedPoolHintsByToken.size > 500) resolvedPoolHintsByToken.delete(resolvedPoolHintsByToken.keys().next().value);
}

export function rhResolvedPoolHints(tokenAddress) {
  const token = normalizeAddress(tokenAddress).toLowerCase();
  return token ? (resolvedPoolHintsByToken.get(token) || []).map((row) => ({ ...row })) : [];
}

function normalizeAddress(value) {
  const address = String(value || "").trim();
  return EVM_ADDRESS_RE.test(address) ? address : "";
}

function addressFromGeckoId(value) {
  const id = String(value || "").trim();
  const address = id.includes("_") ? id.slice(id.lastIndexOf("_") + 1) : id;
  return normalizeAddress(address);
}

export function chooseRhPoolToken(baseAddress, quoteAddress, quoteTokens = RH_POOL_QUOTE_TOKENS) {
  const base = normalizeAddress(baseAddress);
  const quote = normalizeAddress(quoteAddress);
  if (!base && !quote) return "";
  const baseIsQuote = base && quoteTokens.has(base.toLowerCase());
  const quoteIsQuote = quote && quoteTokens.has(quote.toLowerCase());
  if (base && !baseIsQuote && quoteIsQuote) return base;
  if (quote && !quoteIsQuote && baseIsQuote) return quote;
  return base || quote;
}

function dexPairToken(data, poolAddress) {
  const pool = poolAddress.toLowerCase();
  const rows = Array.isArray(data?.pairs) ? data.pairs : (data?.pair ? [data.pair] : []);
  const exact = rows.find((row) =>
    String(row?.chainId || "").toLowerCase() === "robinhood"
    && String(row?.pairAddress || row?.address || "").toLowerCase() === pool
  );
  if (!exact) return "";
  const token = chooseRhPoolToken(exact?.baseToken?.address, exact?.quoteToken?.address);
  if (token) rememberResolvedPoolHint(token, poolAddress, exact);
  return token;
}

function geckoPoolToken(data, poolAddress) {
  const row = data?.data;
  const exactAddress = normalizeAddress(row?.attributes?.address) || addressFromGeckoId(row?.id);
  if (!exactAddress || exactAddress.toLowerCase() !== poolAddress.toLowerCase()) return "";
  const base = addressFromGeckoId(row?.relationships?.base_token?.data?.id);
  const quote = addressFromGeckoId(row?.relationships?.quote_token?.data?.id);
  return chooseRhPoolToken(base, quote);
}

async function fetchJsonWithin(fetchImpl, url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(100, Number(timeoutMs) || 2500));
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: { accept: "application/json", "user-agent": "SlimeWire-Scan/1.0" },
    });
    if (!response?.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function addressFromRpcWord(value) {
  const word = String(value || "").replace(/^0x/, "");
  if (!/^[0-9a-fA-F]{64}$/.test(word)) return "";
  return normalizeAddress(`0x${word.slice(-40)}`);
}

async function rpcPoolToken(fetchImpl, rpcUrl, poolAddress, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(100, timeoutMs));
  try {
    const response = await fetchImpl(rpcUrl, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify([
        { jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: poolAddress, data: "0x0dfe1681" }, "latest"] },
        { jsonrpc: "2.0", id: 2, method: "eth_call", params: [{ to: poolAddress, data: "0xd21220a7" }, "latest"] },
      ]),
    });
    if (!response?.ok) return "";
    const rows = await response.json();
    if (!Array.isArray(rows)) return "";
    const token0 = addressFromRpcWord(rows.find((row) => Number(row?.id) === 1)?.result);
    const token1 = addressFromRpcWord(rows.find((row) => Number(row?.id) === 2)?.result);
    if (!token0 || !token1) return "";
    // On-chain token ordering is numerical, not base/quote ordering. Only choose
    // when exactly one side is a known quote; otherwise wait for an indexer rather
    // than guessing which of two ordinary assets the user intended.
    const token0IsQuote = RH_POOL_QUOTE_TOKENS.has(token0.toLowerCase());
    const token1IsQuote = RH_POOL_QUOTE_TOKENS.has(token1.toLowerCase());
    if (token0IsQuote === token1IsQuote) return "";
    return token0IsQuote ? token1 : token0;
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

async function firstResolved(tasks) {
  return await new Promise((resolve) => {
    let left = tasks.length;
    if (!left) return resolve("");
    for (const task of tasks) {
      Promise.resolve(task).then((value) => {
        if (value) return resolve(value);
        left -= 1;
        if (!left) resolve("");
      }, () => {
        left -= 1;
        if (!left) resolve("");
      });
    }
  });
}

/** Resolve an exact RH pool address to the traded token; normal tokens pass through. */
export async function resolveRhPoolToken(address, options = {}) {
  const input = normalizeAddress(address);
  if (!input) return "";
  const key = input.toLowerCase();
  const now = Date.now();
  const cached = poolResolutionCache.get(key);
  const cacheMs = cached?.resolved ? 24 * 60 * 60_000 : 30_000;
  if (cached && now - cached.at < cacheMs) return cached.token;

  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== "function") return input;
  const timeoutMs = Math.max(250, Number(options.timeoutMs) || 2500);
  const dexTask = fetchJsonWithin(fetchImpl, `https://api.dexscreener.com/latest/dex/pairs/robinhood/${key}`, timeoutMs)
    .then((data) => dexPairToken(data, input));
  // DexScreener's direct pair route and search index are separate deployments;
  // either can briefly know a new pool before the other. Exact-address matching
  // keeps the search fallback safe from same-symbol clone mistakes.
  const dexSearchTask = fetchJsonWithin(fetchImpl, `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(key)}`, timeoutMs)
    .then((data) => dexPairToken(data, input));
  const geckoTask = fetchJsonWithin(fetchImpl, `https://api.geckoterminal.com/api/v2/networks/robinhood/pools/${key}`, timeoutMs)
    .then((data) => geckoPoolToken(data, input));
  const rpcTask = rpcPoolToken(fetchImpl, String(options.rpcUrl || RH_PUBLIC_RPC), input, timeoutMs);
  const token = await firstResolved([dexTask, dexSearchTask, geckoTask, rpcTask]);
  const result = token || input;
  if (token && token.toLowerCase() !== key) rememberResolvedPoolHint(token, input);
  poolResolutionCache.set(key, { at: now, token: result, resolved: Boolean(token && token.toLowerCase() !== key) });
  if (poolResolutionCache.size > 500) poolResolutionCache.delete(poolResolutionCache.keys().next().value);
  return result;
}

export function clearRhPoolResolverCache() {
  poolResolutionCache.clear();
  resolvedPoolHintsByToken.clear();
}
