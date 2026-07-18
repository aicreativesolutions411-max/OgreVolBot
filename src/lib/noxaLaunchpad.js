// ── NOXA FUN launchpad reader (Robinhood Chain) ────────────────────────────────────────────────
// NOXA (fun.noxa.fi) is the pump.fun-style launchpad for Robinhood Chain. It has NO public data API —
// it is fully on-chain. Every launch emits `TokenLaunched` from the launch factory and drops the token
// straight into a single-sided Uniswap-V3 pool (tradeable on creation). DexScreener indexes almost none
// of these (it showed ~6 RH pairs while NOXA has thousands), so we read the chain ourselves: enumerate
// launches from factory logs, then read each token's ERC-20 metadata + V3 pool spot price to compute
// price / market-cap / liquidity. All reads are batched through Multicall3. ETH→USD via rhEthUsd().
//
// Contracts/config were lifted from NOXA's own frontend bundle (the factory is unverified on Blockscout,
// so there's no published ABI — only the pieces we call are declared here).
import { ethers } from "ethers";
import { rhEthUsd } from "./robinhoodChain.js";

export const NOXA_RH = {
  chainId: 4663,
  rpcUrl: "https://rpc.mainnet.chain.robinhood.com",
  launchFactory: "0xD9eC2db5f3D1b236843925949fe5bd8a3836FCcB",
  launchLocker: "0x7F03effbd7ceB22A3f80Dd468f67eF27826acD85",
  weth: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",
  multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11",
  startBlock: 61688,
  site: "https://fun.noxa.fi",
};

const IFACE_FACTORY = new ethers.Interface([
  "event TokenLaunched(address indexed token,address indexed deployer,address indexed dexFactory,address pairToken,address pool,uint256 dexId,uint256 launchConfigId,uint256 positionId,uint256 restrictionsEndBlock,uint256 initialBuyAmount)",
]);
const TOPIC_LAUNCHED = IFACE_FACTORY.getEvent("TokenLaunched").topicHash;
const ERC20 = new ethers.Interface([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
]);
const POOL = new ethers.Interface([
  "function slot0() view returns (uint160 sqrtPriceX96,int24 tick,uint16,uint16,uint16,uint8,bool)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
]);
// The factory's O(1) view: confirms a coin is a NOXA launch + gives its paired token + pool fee tier, so a
// single-coin lookup never has to scan log history (which the RPC rejects/times-out over the full range).
const LAUNCHER = new ethers.Interface([
  "function getLaunchedToken(address token) view returns (tuple(address token,address deployer,address pairedToken,address positionManager,uint256 positionId,uint256 dexId,uint256 launchConfigId,uint256 restrictionsEndBlock,uint256 supply,bool isToken0,uint24 poolFee,bool exists,uint256 initialBuyAmount))",
]);
const V3_FACTORY_ADDR = "0x1f7d7550B1b028f7571E69A784071F0205FD2EfA";   // Robinhood Uniswap-V3 factory (from NOXA config)
const V3_FACTORY = new ethers.Interface(["function getPool(address,address,uint24) view returns (address)"]);
const MC3 = new ethers.Interface([
  "function aggregate3((address target,bool allowFailure,bytes callData)[] calls) view returns ((bool success,bytes returnData)[])",
]);

let cachedProvider = null;
function noxaProvider(rpcUrl) {
  const url = rpcUrl || NOXA_RH.rpcUrl;
  if (cachedProvider && cachedProvider._noxaUrl === url) return cachedProvider;
  cachedProvider = new ethers.JsonRpcProvider(url, NOXA_RH.chainId, { staticNetwork: true });
  cachedProvider._noxaUrl = url;
  return cachedProvider;
}

// One Multicall3.aggregate3 round. calls = [{target, iface, fn, args}]. Returns decoded results (null on fail).
async function multicall(provider, calls) {
  const mc = new ethers.Contract(NOXA_RH.multicall3, MC3, provider);
  const payload = calls.map((c) => ({ target: c.target, allowFailure: true, callData: c.iface.encodeFunctionData(c.fn, c.args || []) }));
  const res = await mc.aggregate3(payload);
  return res.map((r, i) => {
    if (!r.success || r.returnData === "0x") return null;
    try { const d = calls[i].iface.decodeFunctionResult(calls[i].fn, r.returnData); return d.length === 1 ? d[0] : d; }
    catch { return null; }
  });
}

// Coin price in WETH from a V3 pool's sqrtPriceX96 (WETH is 18 decimals). Handles either token ordering.
function coinPriceInWeth(sqrtPriceX96, decCoin, wethIsToken0) {
  const sp = Number(sqrtPriceX96) / 2 ** 96;
  const rawP = sp * sp;                     // raw token1 per token0
  if (!isFinite(rawP) || rawP <= 0) return 0;
  const decAdj = Math.pow(10, Number(decCoin) - 18);
  return wethIsToken0 ? (1 / rawP) * decAdj : rawP * decAdj;   // WETH per 1 coin (human)
}

// Enumerate recent NOXA launches from factory logs, newest-first. Chunked so a wide range never fails.
export async function fetchNoxaLaunches({ rpcUrl, lookbackBlocks = 60000, max = 120 } = {}) {
  const provider = noxaProvider(rpcUrl);
  const latest = await provider.getBlockNumber();
  const start = Math.max(NOXA_RH.startBlock, latest - lookbackBlocks);
  const span = 15000;                       // conservative per-getLogs window
  const out = [];
  for (let to = latest; to >= start && out.length < max * 3; to -= span + 1) {
    const from = Math.max(start, to - span);
    let logs = [];
    try { logs = await provider.getLogs({ address: NOXA_RH.launchFactory, topics: [TOPIC_LAUNCHED], fromBlock: from, toBlock: to }); }
    catch { /* skip a bad window rather than fail the whole scan */ }
    for (const l of logs) {
      try {
        const d = IFACE_FACTORY.parseLog(l);
        out.push({
          token: ethers.getAddress(d.args.token), pool: ethers.getAddress(d.args.pool),
          pairToken: ethers.getAddress(d.args.pairToken), deployer: ethers.getAddress(d.args.deployer),
          positionId: d.args.positionId, block: Number(l.blockNumber),
        });
      } catch { /* undecodable log */ }
    }
    if (from <= start) break;
  }
  out.sort((a, b) => b.block - a.block);    // newest first
  const seen = new Set(); const uniq = [];
  for (const e of out) { const k = e.token.toLowerCase(); if (!seen.has(k)) { seen.add(k); uniq.push(e); } }
  return uniq.slice(0, max);
}

// Read live market stats (symbol/name/supply/price/mc/liq) for a batch of launch entries via Multicall3.
export async function readNoxaMarkets(entries, { rpcUrl, ethUsd } = {}) {
  if (!entries || !entries.length) return [];
  const provider = noxaProvider(rpcUrl);
  const eth = ethUsd || (await rhEthUsd().catch(() => 0)) || 0;
  const weth = NOXA_RH.weth;
  const calls = [];
  for (const e of entries) {
    calls.push({ target: e.token, iface: ERC20, fn: "name" });
    calls.push({ target: e.token, iface: ERC20, fn: "symbol" });
    calls.push({ target: e.token, iface: ERC20, fn: "decimals" });
    calls.push({ target: e.token, iface: ERC20, fn: "totalSupply" });
    calls.push({ target: e.pool, iface: POOL, fn: "slot0" });
    calls.push({ target: e.pool, iface: POOL, fn: "token0" });
    calls.push({ target: weth, iface: ERC20, fn: "balanceOf", args: [e.pool] });
    calls.push({ target: e.token, iface: ERC20, fn: "balanceOf", args: [e.pool] });
  }
  let r = [];
  try { r = await multicall(provider, calls); } catch { return []; }
  const out = [];
  for (let i = 0; i < entries.length; i++) {
    const b = i * 8;
    const name = r[b], symbol = r[b + 1], decRaw = r[b + 2], supplyRaw = r[b + 3], slot0 = r[b + 4], token0 = r[b + 5], wethBalRaw = r[b + 6], tokenBalRaw = r[b + 7];
    if (slot0 == null || supplyRaw == null) continue;   // pool/token unreadable → skip
    const dec = Number(decRaw ?? 18);
    const wethIsToken0 = token0 && String(token0).toLowerCase() === weth.toLowerCase();
    const sqrt = Array.isArray(slot0) ? slot0[0] : slot0;
    const priceWeth = coinPriceInWeth(sqrt, dec, wethIsToken0);
    const supply = Number(ethers.formatUnits(supplyRaw, dec));
    const wethReserve = wethBalRaw != null ? Number(ethers.formatUnits(wethBalRaw, 18)) : 0;
    const tokenReserve = tokenBalRaw != null ? Number(ethers.formatUnits(tokenBalRaw, dec)) : 0;
    const priceUsd = priceWeth * eth;
    // Total current pool TVL, not merely the WETH side. In an active V3 range
    // the two reserve values are often close, so the old one-sided figure
    // appeared almost exactly half of the liquidity shown by market trackers.
    const liquidityUsd = wethReserve * eth + tokenReserve * priceUsd;
    out.push({
      ...entries[i],
      positionId: entries[i].positionId != null ? String(entries[i].positionId) : "",   // ethers BigInt → string (JSON.stringify throws on BigInt)
      chain: "robinhood", source: "noxa",
      name: String(name || ""), symbol: String(symbol || "").replace(/^\$+/, "").slice(0, 16), decimals: dec,
      supply, priceUsd, priceWeth,
      mc: priceUsd > 0 ? priceUsd * supply : 0,
      liq: liquidityUsd,
      wethReserve, tokenReserve, isWethPair: !!wethIsToken0 || (entries[i].pairToken || "").toLowerCase() === weth.toLowerCase(),
      explorer: `https://robinhoodchain.blockscout.com/token/${entries[i].token}`,
      noxaUrl: `${NOXA_RH.site}/token/${entries[i].token}`,
    });
  }
  return out;
}

// Convenience: recent NOXA coins with full stats, newest-first (for the RH board / "fresh" feed).
export async function fetchNoxaFeed({ rpcUrl, lookbackBlocks = 60000, max = 60 } = {}) {
  const launches = await fetchNoxaLaunches({ rpcUrl, lookbackBlocks, max });
  if (!launches.length) return [];
  const eth = (await rhEthUsd().catch(() => 0)) || 0;
  return readNoxaMarkets(launches, { rpcUrl, ethUsd: eth });
}

// ── Uniswap-V3 pool BUY watcher (Robinhood Chain) ─────────────────────────────────────────────
// Reads a pool's Swap logs since a block and returns decoded BUYS of `tokenAddress` (pool pays token out,
// takes WETH in). Powers the group Buy Bot for RH coins — same idea as the pump per-buy feed, but straight
// off the chain. Works for ANY RH V3 pool (NOXA or DexScreener-listed).
// RH pools come in BOTH flavors (verified live): NOXA launches emit Uniswap-V3 Swaps, while other listed
// pairs (e.g. HOOD's DexScreener pair) are Uniswap-V2 (Swap topic 0xd78ad95f… + Sync). Watch both.
const SWAP_TOPIC_V3 = ethers.id("Swap(address,address,int256,int256,uint160,uint128,int24)");
const SWAP_TOPIC_V2 = ethers.id("Swap(address,uint256,uint256,uint256,uint256,address)");
const POOL_SWAP_IFACE = new ethers.Interface([
  "event Swap(address indexed sender,address indexed recipient,int256 amount0,int256 amount1,uint160 sqrtPriceX96,uint128 liquidity,int24 tick)",
]);
const POOL_SWAP_V2_IFACE = new ethers.Interface([
  "event Swap(address indexed sender,uint256 amount0In,uint256 amount1In,uint256 amount0Out,uint256 amount1Out,address indexed to)",
]);
const poolToken0Cache = new Map();   // pool → token0 addr (immutable)
const poolSwapMetaCache = new Map();
const poolSwapHistoryCache = new Map();

async function poolSwapMeta(provider, poolAddr) {
  const cached = poolSwapMetaCache.get(poolAddr);
  if (cached) return cached;
  const [token0, token1] = await multicall(provider, [
    { target: poolAddr, iface: POOL, fn: "token0" },
    { target: poolAddr, iface: POOL, fn: "token1" }
  ]);
  if (!token0 || !token1) return null;
  const [dec0, dec1, sym0, sym1] = await multicall(provider, [
    { target: token0, iface: ERC20, fn: "decimals" },
    { target: token1, iface: ERC20, fn: "decimals" },
    { target: token0, iface: ERC20, fn: "symbol" },
    { target: token1, iface: ERC20, fn: "symbol" }
  ]);
  const value = {
    token0: ethers.getAddress(token0), token1: ethers.getAddress(token1),
    dec0: Number(dec0 ?? 18), dec1: Number(dec1 ?? 18),
    sym0: String(sym0 || ""), sym1: String(sym1 || "")
  };
  poolSwapMetaCache.set(poolAddr, value);
  return value;
}

async function blockTimestamps(rpcUrl, blockNumbers) {
  const unique = [...new Set(blockNumbers.map(Number).filter(Number.isFinite))];
  const out = new Map();
  const chunks = [];
  for (let offset = 0; offset < unique.length; offset += 100) chunks.push(unique.slice(offset, offset + 100));
  const results = await Promise.all(chunks.map(async (chunk) => {
    try {
      const response = await fetch(rpcUrl || NOXA_RH.rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(chunk.map((block, index) => ({
          jsonrpc: "2.0", id: index + 1, method: "eth_getBlockByNumber",
          params: [`0x${block.toString(16)}`, false]
        })))
      });
      if (!response.ok) return [];
      const rows = await response.json();
      return (Array.isArray(rows) ? rows : []).map((row) => ({
        block: chunk[Number(row?.id) - 1],
        timestamp: Number.parseInt(String(row?.result?.timestamp || ""), 16)
      }));
    } catch { return []; }
  }));
  for (const row of results.flat()) {
    if (Number.isFinite(row.block) && row.timestamp > 0) out.set(row.block, row.timestamp);
  }
  return out;
}

// Ground-truth RH tape for pools that GeckoTerminal does not index. Supports both V2 and V3 and is
// bounded/cached so the chart remains fast without growing Render memory.
export async function fetchPoolSwaps(pool, tokenAddress, {
  rpcUrl, lookbackSeconds = 86_400, maxLogs = 2_500, currentPriceUsd = 0, ttlMs = 8_000
} = {}) {
  const poolAddr = ethers.getAddress(pool);
  const token = ethers.getAddress(tokenAddress);
  const cacheKey = `${poolAddr.toLowerCase()}:${token.toLowerCase()}:${Math.round(Number(lookbackSeconds) || 0)}`;
  const cached = poolSwapHistoryCache.get(cacheKey);
  if (cached && Date.now() - cached.at < ttlMs) return cached.value;

  const provider = noxaProvider(rpcUrl);
  const [latest, meta] = await Promise.all([provider.getBlockNumber(), poolSwapMeta(provider, poolAddr)]);
  if (!meta) return { toBlock: latest, swaps: [] };
  const tokenIs0 = meta.token0.toLowerCase() === token.toLowerCase();
  const tokenIs1 = meta.token1.toLowerCase() === token.toLowerCase();
  if (!tokenIs0 && !tokenIs1) return { toBlock: latest, swaps: [] };

  const sampleBlock = Math.max(0, latest - 10_000);
  const [latestInfo, sampleInfo] = await Promise.all([provider.getBlock(latest), provider.getBlock(sampleBlock)]);
  const secondsPerBlock = Math.max(0.05, (Number(latestInfo?.timestamp) - Number(sampleInfo?.timestamp)) / Math.max(1, latest - sampleBlock) || 0.1);
  const requestedSpan = Math.ceil(Math.max(900, Number(lookbackSeconds) || 86_400) / secondsPerBlock);
  const start = Math.max(0, latest - Math.min(requestedSpan, 14_400_000));
  const ranges = [];
  for (let from = start; from <= latest; from += 900_000) ranges.push([from, Math.min(latest, from + 899_999)]);
  const settled = await Promise.allSettled(ranges.map(([fromBlock, toBlock]) =>
    provider.getLogs({ address: poolAddr, topics: [[SWAP_TOPIC_V3, SWAP_TOPIC_V2]], fromBlock, toBlock })
  ));
  let logs = settled.flatMap((row) => row.status === "fulfilled" ? row.value : []);
  logs.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber) || Number(b.index ?? b.logIndex ?? 0) - Number(a.index ?? a.logIndex ?? 0));
  if (logs.length > maxLogs) logs = logs.slice(0, maxLogs);
  const timestamps = await blockTimestamps(rpcUrl || NOXA_RH.rpcUrl, logs.map((log) => log.blockNumber));

  const tokenDecimals = tokenIs0 ? meta.dec0 : meta.dec1;
  const quoteDecimals = tokenIs0 ? meta.dec1 : meta.dec0;
  const quoteAddress = tokenIs0 ? meta.token1 : meta.token0;
  const quoteSymbol = tokenIs0 ? meta.sym1 : meta.sym0;
  const anchor = Number(currentPriceUsd) || 0;
  const ethUsd = !anchor && quoteAddress.toLowerCase() === NOXA_RH.weth.toLowerCase()
    ? Number(await rhEthUsd().catch(() => 0)) || 0 : 0;
  const quoteUsd = ethUsd || (/^(?:USDC|USDT|USDCE|DAI)$/i.test(quoteSymbol) ? 1 : 0);
  const swaps = [];
  for (const log of logs) {
    try {
      let side = "buy", maker = "", tokenRaw = 0n, quoteRaw = 0n;
      if (log.topics[0] === SWAP_TOPIC_V3) {
        const decoded = POOL_SWAP_IFACE.parseLog(log);
        const tokenDelta = tokenIs0 ? decoded.args.amount0 : decoded.args.amount1;
        const quoteDelta = tokenIs0 ? decoded.args.amount1 : decoded.args.amount0;
        side = tokenDelta < 0n ? "buy" : "sell";
        tokenRaw = tokenDelta < 0n ? -tokenDelta : tokenDelta;
        quoteRaw = quoteDelta < 0n ? -quoteDelta : quoteDelta;
        maker = String(decoded.args.recipient || decoded.args.sender || "");
      } else {
        const decoded = POOL_SWAP_V2_IFACE.parseLog(log);
        const tokenIn = tokenIs0 ? decoded.args.amount0In : decoded.args.amount1In;
        const tokenOut = tokenIs0 ? decoded.args.amount0Out : decoded.args.amount1Out;
        const quoteIn = tokenIs0 ? decoded.args.amount1In : decoded.args.amount0In;
        const quoteOut = tokenIs0 ? decoded.args.amount1Out : decoded.args.amount0Out;
        side = tokenOut > 0n ? "buy" : "sell";
        tokenRaw = tokenOut > 0n ? tokenOut : tokenIn;
        quoteRaw = quoteIn > 0n ? quoteIn : quoteOut;
        maker = String(decoded.args.to || decoded.args.sender || "");
      }
      const tokens = Number(ethers.formatUnits(tokenRaw, tokenDecimals));
      const quoteAmount = Number(ethers.formatUnits(quoteRaw, quoteDecimals));
      if (!(tokens > 0) || !(quoteAmount > 0)) continue;
      const block = Number(log.blockNumber);
      const t = timestamps.get(block)
        || Math.max(1, Math.round(Number(latestInfo?.timestamp || Date.now() / 1000) - (latest - block) * secondsPerBlock));
      swaps.push({
        t, ts: new Date(t * 1000).toISOString(), side, kind: side, tokens, quoteAmount,
        priceQuote: quoteAmount / tokens,
        price: quoteUsd > 0 ? (quoteAmount / tokens) * quoteUsd : 0,
        usd: quoteUsd > 0 ? quoteAmount * quoteUsd : 0,
        maker: /^0x[0-9a-f]{40}$/i.test(maker) ? ethers.getAddress(maker) : maker,
        tx: log.transactionHash, block
      });
    } catch { /* incompatible swap log */ }
  }
  swaps.sort((a, b) => b.t - a.t || b.block - a.block);
  const latestRatio = swaps.find((swap) => swap.priceQuote > 0)?.priceQuote || 0;
  const ratioUsd = anchor > 0 && latestRatio > 0 ? anchor / latestRatio : 0;
  if (ratioUsd > 0) {
    for (const swap of swaps) { swap.price = swap.priceQuote * ratioUsd; swap.usd = swap.tokens * swap.price; }
  }
  const value = { toBlock: latest, swaps, tokenDecimals, quoteDecimals, quoteAddress, quoteSymbol };
  poolSwapHistoryCache.set(cacheKey, { at: Date.now(), value });
  if (poolSwapHistoryCache.size > 80) {
    const oldest = [...poolSwapHistoryCache.entries()].sort((a, b) => a[1].at - b[1].at).slice(0, 30);
    for (const [oldKey] of oldest) poolSwapHistoryCache.delete(oldKey);
  }
  return value;
}

export async function fetchPoolBuys(pool, tokenAddress, { fromBlock, rpcUrl, maxSpan = 4000 } = {}) {
  const provider = noxaProvider(rpcUrl);
  const poolAddr = ethers.getAddress(pool);
  const token = ethers.getAddress(tokenAddress);
  const latest = await provider.getBlockNumber();
  const start = Number.isFinite(Number(fromBlock)) && Number(fromBlock) > 0 ? Math.max(Number(fromBlock), latest - maxSpan) : latest - 100;
  if (start >= latest) return { toBlock: latest, buys: [] };
  let t0 = poolToken0Cache.get(poolAddr);
  if (!t0) {
    try { [t0] = await multicall(provider, [{ target: poolAddr, iface: POOL, fn: "token0" }]); } catch { t0 = null; }
    if (t0) poolToken0Cache.set(poolAddr, String(t0));
  }
  if (!t0) return { toBlock: latest, buys: [] };
  const tokenIs0 = String(t0).toLowerCase() === token.toLowerCase();
  let logs = [];
  try { logs = await provider.getLogs({ address: poolAddr, topics: [[SWAP_TOPIC_V3, SWAP_TOPIC_V2]], fromBlock: start + 1, toBlock: latest }); }
  catch { return { toBlock: latest, buys: [] }; }
  const buys = [];
  for (const l of logs) {
    try {
      if (l.topics[0] === SWAP_TOPIC_V3) {
        const d = POOL_SWAP_IFACE.parseLog(l);
        const amtToken = tokenIs0 ? d.args.amount0 : d.args.amount1;
        const amtOther = tokenIs0 ? d.args.amount1 : d.args.amount0;
        if (amtToken >= 0n) continue;                     // pool RECEIVED token → that's a sell, skip
        buys.push({
          trader: ethers.getAddress(d.args.recipient),
          tokens: Number(ethers.formatUnits(-amtToken, 18)),   // NOXA/RH memecoins are 18-dec; callers rescale if not
          ethAmount: Number(ethers.formatUnits(amtOther > 0n ? amtOther : -amtOther, 18)),
          tx: l.transactionHash, block: Number(l.blockNumber),
        });
      } else {
        const d = POOL_SWAP_V2_IFACE.parseLog(l);
        const tokenOut = tokenIs0 ? d.args.amount0Out : d.args.amount1Out;
        const otherIn = tokenIs0 ? d.args.amount1In : d.args.amount0In;
        if (tokenOut <= 0n) continue;                     // no token left the pool → not a buy
        buys.push({
          trader: ethers.getAddress(d.args.to),
          tokens: Number(ethers.formatUnits(tokenOut, 18)),
          ethAmount: Number(ethers.formatUnits(otherIn, 18)),
          tx: l.transactionHash, block: Number(l.blockNumber),
        });
      }
    } catch { /* undecodable swap */ }
  }
  return { toBlock: latest, buys };
}

const scanCache = new Map();   // token → { at, v }
// Single-coin scan: is this a NOXA launch? If so, return its live stats. O(1) — asks the factory's
// getLaunchedToken view (no log-history scan, which the RPC rejects over the full range), derives the V3
// pool from the paired token + fee tier, then reads the market. Returns null for non-NOXA tokens.
export async function getNoxaScan(tokenAddress, { rpcUrl, ethUsd } = {}) {
  const addr = String(tokenAddress || "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) return null;
  const key = addr.toLowerCase();
  const hit = scanCache.get(key);
  // A public-RPC miss is transient. Keep successful reads warm, but never let one timeout make a valid
  // NOXA coin look nonexistent for 45 seconds across every scan request.
  if (hit && Date.now() - hit.at < (hit.v ? 45_000 : 2_000)) return hit.v;
  const provider = noxaProvider(rpcUrl);
  const token = ethers.getAddress(addr);
  let info = null;
  try { [info] = await multicall(provider, [{ target: NOXA_RH.launchFactory, iface: LAUNCHER, fn: "getLaunchedToken", args: [token] }]); }
  catch { /* fall through */ }
  if (!info || !info.exists) { scanCache.set(key, { at: Date.now(), v: null }); return null; }
  const pairToken = ethers.getAddress(info.pairedToken);
  const fee = Number(info.poolFee) || 10000;
  // Derive the pool: the coin's launch fee tier first, then the other RH tiers as a fallback.
  const feeTiers = [...new Set([fee, 10000, 3000, 500])];
  let pool = ethers.ZeroAddress;
  try {
    const pr = await multicall(provider, feeTiers.map((f) => ({ target: V3_FACTORY_ADDR, iface: V3_FACTORY, fn: "getPool", args: [token, pairToken, f] })));
    for (const p of pr) { if (p && p !== ethers.ZeroAddress) { pool = ethers.getAddress(p); break; } }
  } catch { /* no pool derivable */ }
  if (pool === ethers.ZeroAddress) { scanCache.set(key, { at: Date.now(), v: null }); return null; }
  const [mk] = await readNoxaMarkets([{ token, pool, pairToken, deployer: ethers.getAddress(info.deployer), positionId: info.positionId, block: 0 }], { rpcUrl, ethUsd });
  const v = mk || null;
  scanCache.set(key, { at: Date.now(), v });
  return v;
}
