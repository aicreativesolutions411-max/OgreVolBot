import { ethers } from "ethers";

const ETH_DOMAIN_RE = /^[a-z0-9][a-z0-9._-]{0,62}\.eth$/i;
const DEFAULT_ETHEREUM_RPC_URLS = [
  "https://ethereum-rpc.publicnode.com",
  "https://eth.llamarpc.com"
];
const CACHE_TTL_MS = 10 * 60_000;
const MISS_TTL_MS = 60_000;
const cache = new Map();
const providers = new Map();

export function ethDomainLike(value) {
  return ETH_DOMAIN_RE.test(String(value || "").trim());
}

function providerFor(rpcUrl) {
  if (!providers.has(rpcUrl)) {
    providers.set(rpcUrl, new ethers.JsonRpcProvider(rpcUrl, 1, { staticNetwork: true }));
  }
  return providers.get(rpcUrl);
}

function timeoutAfter(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("ENS resolution timed out")), ms));
}

export async function resolveEthDomainToAddress(name, options = {}) {
  const raw = String(name || "").trim().toLowerCase();
  if (!ethDomainLike(raw)) return null;
  let normalized;
  try { normalized = ethers.ensNormalize(raw); }
  catch { return null; }

  const now = Date.now();
  const cached = cache.get(normalized);
  if (cached && now - cached.at < (cached.address ? CACHE_TTL_MS : MISS_TTL_MS)) return cached.address;

  const timeoutMs = Math.max(500, Math.min(8_000, Number(options.timeoutMs) || 4_500));
  const injected = options.provider;
  const configuredUrl = String(options.rpcUrl || process.env.ETHEREUM_RPC_URL || "").trim();
  const candidates = injected
    ? [injected]
    : (configuredUrl ? [providerFor(configuredUrl)] : DEFAULT_ETHEREUM_RPC_URLS.map(providerFor));

  let address = null;
  try {
    address = await Promise.any(candidates.map(async (candidate) => {
      const resolved = await Promise.race([candidate.resolveName(normalized), timeoutAfter(timeoutMs)]);
      if (!resolved || !ethers.isAddress(resolved)) throw new Error("ENS name has no address");
      return ethers.getAddress(resolved);
    }));
  } catch { address = null; }

  cache.set(normalized, { at: now, address });
  if (cache.size > 500) cache.delete(cache.keys().next().value);
  return address;
}
