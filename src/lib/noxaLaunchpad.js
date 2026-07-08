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
]);
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
  }
  let r = [];
  try { r = await multicall(provider, calls); } catch { return []; }
  const out = [];
  for (let i = 0; i < entries.length; i++) {
    const b = i * 7;
    const name = r[b], symbol = r[b + 1], decRaw = r[b + 2], supplyRaw = r[b + 3], slot0 = r[b + 4], token0 = r[b + 5], wethBalRaw = r[b + 6];
    if (slot0 == null || supplyRaw == null) continue;   // pool/token unreadable → skip
    const dec = Number(decRaw ?? 18);
    const wethIsToken0 = token0 && String(token0).toLowerCase() === weth.toLowerCase();
    const sqrt = Array.isArray(slot0) ? slot0[0] : slot0;
    const priceWeth = coinPriceInWeth(sqrt, dec, wethIsToken0);
    const supply = Number(ethers.formatUnits(supplyRaw, dec));
    const wethReserve = wethBalRaw != null ? Number(ethers.formatUnits(wethBalRaw, 18)) : 0;
    const priceUsd = priceWeth * eth;
    out.push({
      ...entries[i],
      chain: "robinhood", source: "noxa",
      name: String(name || ""), symbol: String(symbol || "").replace(/^\$+/, "").slice(0, 16), decimals: dec,
      supply, priceUsd, priceWeth,
      mc: priceUsd > 0 ? priceUsd * supply : 0,
      liq: wethReserve * eth,                 // the ETH side locked in the pool (single-sided V3)
      wethReserve, isWethPair: !!wethIsToken0 || (entries[i].pairToken || "").toLowerCase() === weth.toLowerCase(),
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

const scanCache = new Map();   // token → { at, v }
// Single-coin scan: is this a NOXA launch? If so, return its live stats. Cheap (targeted log query by the
// indexed `token` topic + one multicall). Returns null for non-NOXA tokens so callers can fall back.
export async function getNoxaScan(tokenAddress, { rpcUrl, ethUsd } = {}) {
  const addr = String(tokenAddress || "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) return null;
  const key = addr.toLowerCase();
  const hit = scanCache.get(key);
  if (hit && Date.now() - hit.at < 45_000) return hit.v;
  const provider = noxaProvider(rpcUrl);
  let entry = null;
  try {
    // token is topics[1] on TokenLaunched (first indexed arg) — a targeted, cheap lookup across all history.
    const logs = await provider.getLogs({
      address: NOXA_RH.launchFactory, fromBlock: NOXA_RH.startBlock, toBlock: "latest",
      topics: [TOPIC_LAUNCHED, ethers.zeroPadValue(ethers.getAddress(addr), 32)],
    });
    if (logs.length) {
      const d = IFACE_FACTORY.parseLog(logs[logs.length - 1]);
      entry = { token: ethers.getAddress(d.args.token), pool: ethers.getAddress(d.args.pool), pairToken: ethers.getAddress(d.args.pairToken), deployer: ethers.getAddress(d.args.deployer), positionId: d.args.positionId, block: Number(logs[logs.length - 1].blockNumber) };
    }
  } catch { /* fall through to null */ }
  if (!entry) { scanCache.set(key, { at: Date.now(), v: null }); return null; }
  const [mk] = await readNoxaMarkets([entry], { rpcUrl, ethUsd });
  const v = mk || null;
  scanCache.set(key, { at: Date.now(), v });
  return v;
}
