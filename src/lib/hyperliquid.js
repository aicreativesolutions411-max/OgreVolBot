// Hyperliquid perps — thin wrapper over @nktkas/hyperliquid for the PvP module.
// The user's HL account = the SAME derived EVM wallet used for Robinhood Chain (evmWalletFromSolana),
// so one custodial key covers RH spot AND HL perps. Funding: deposit USDC to that address on ARBITRUM
// and it credits Hyperliquid (their canonical bridge). All calls lazy-import the SDK so bot boot stays fast.
let _hl = null;
async function sdk() { if (!_hl) _hl = await import("@nktkas/hyperliquid"); return _hl; }

let _transport = null, _info = null;
async function infoClient() {
  const hl = await sdk();
  if (!_transport) _transport = new hl.HttpTransport();
  if (!_info) _info = new hl.InfoClient({ transport: _transport });
  return _info;
}

// meta (asset universe) cached 10min — asset index + szDecimals are needed to place any order.
let _meta = { at: 0, universe: [] };
async function hlUniverse() {
  if (Date.now() - _meta.at < 10 * 60_000 && _meta.universe.length) return _meta.universe;
  const info = await infoClient();
  const meta = await info.meta();
  _meta = { at: Date.now(), universe: Array.isArray(meta?.universe) ? meta.universe : [] };
  return _meta.universe;
}

export const HL_PVP_ASSETS = ["BTC", "ETH", "SOL", "HYPE", "DOGE", "XRP"];

export async function hlMids() {
  const info = await infoClient();
  return await info.allMids();
}

// Account snapshot: withdrawable USDC + open perp positions.
export async function hlAccount(address) {
  const info = await infoClient();
  const st = await info.clearinghouseState({ user: address });
  const positions = (st?.assetPositions || []).map((ap) => {
    const p = ap?.position || {};
    return {
      coin: String(p.coin || ""),
      size: Number(p.szi) || 0,                        // signed: + long, − short
      entryPx: Number(p.entryPx) || 0,
      unrealizedPnl: Number(p.unrealizedPnl) || 0,
      leverage: Number(p.leverage?.value) || 0,
      marginUsed: Number(p.marginUsed) || 0,
      liqPx: Number(p.liquidationPx) || 0,
    };
  }).filter((p) => p.coin && p.size !== 0);
  return {
    withdrawable: Number(st?.withdrawable) || 0,
    accountValue: Number(st?.marginSummary?.accountValue) || 0,
    positions,
  };
}

// HL price rules: ≤5 significant figures AND ≤ (6 − szDecimals) decimal places for perps.
function hlRoundPrice(px, szDecimals) {
  const maxDec = Math.max(0, 6 - szDecimals);
  let p = Number(px.toPrecision(5));
  p = Number(p.toFixed(maxDec));
  return p;
}
function hlRoundSize(sz, szDecimals) {
  return Number(sz.toFixed(szDecimals));
}

async function exchangeClient(privateKey) {
  const hl = await sdk();
  if (!_transport) _transport = new hl.HttpTransport();
  return new hl.ExchangeClient({ wallet: privateKey, transport: _transport });
}

function orderError(result) {
  const st = result?.response?.data?.statuses?.[0];
  if (st && typeof st === "object" && st.error) return String(st.error);
  if (result?.status && result.status !== "ok") return String(result.status);
  return null;
}
function orderFill(result) {
  const st = result?.response?.data?.statuses?.[0];
  if (st && typeof st === "object" && st.filled) return { avgPx: Number(st.filled.avgPx) || 0, totalSz: Number(st.filled.totalSz) || 0 };
  return null;
}

// Open a market position. `notionalUsd` = position SIZE in USD (margin used ≈ notionalUsd / leverage).
// Market = aggressive IoC limit (mid ± 5%) — the standard HL market-order pattern.
export async function hlMarketOpen({ privateKey, coin, isBuy, notionalUsd, leverage }) {
  const universe = await hlUniverse();
  const idx = universe.findIndex((a) => a.name === coin);
  if (idx < 0) throw new Error(`No Hyperliquid market for ${coin}.`);
  const a = universe[idx];
  const lev = Math.max(1, Math.min(Number(a.maxLeverage) || 20, Math.round(Number(leverage) || 1)));
  const mids = await hlMids();
  const mid = Number(mids[coin]) || 0;
  if (!(mid > 0)) throw new Error(`No live price for ${coin}.`);
  const size = hlRoundSize(Number(notionalUsd) / mid, a.szDecimals);
  if (!(size > 0)) throw new Error(`Position too small — raise the USD size (min ~1 ${coin} tick).`);
  const px = hlRoundPrice(isBuy ? mid * 1.05 : mid * 0.95, a.szDecimals);
  const ex = await exchangeClient(privateKey);
  await ex.updateLeverage({ asset: idx, isCross: true, leverage: lev }).catch(() => {}); // best-effort (fails only if a position already pins it)
  const result = await ex.order({
    orders: [{ a: idx, b: Boolean(isBuy), p: String(px), s: String(size), r: false, t: { limit: { tif: "Ioc" } } }],
    grouping: "na",
  });
  const err = orderError(result);
  if (err) throw new Error(err);
  const fill = orderFill(result);
  if (!fill || !(fill.totalSz > 0)) throw new Error("Order did not fill (thin book) — try again.");
  return { coin, isBuy, size: fill.totalSz, avgPx: fill.avgPx, leverage: lev, notionalUsd: fill.totalSz * fill.avgPx };
}

// Close (reduce-only market) the whole position on `coin`.
export async function hlMarketClose({ privateKey, address, coin }) {
  const universe = await hlUniverse();
  const idx = universe.findIndex((a) => a.name === coin);
  if (idx < 0) throw new Error(`No Hyperliquid market for ${coin}.`);
  const a = universe[idx];
  const acct = await hlAccount(address);
  const pos = acct.positions.find((p) => p.coin === coin);
  if (!pos || pos.size === 0) throw new Error(`No open ${coin} position.`);
  const isBuy = pos.size < 0;                        // closing a short = buy back
  const mids = await hlMids();
  const mid = Number(mids[coin]) || 0;
  if (!(mid > 0)) throw new Error(`No live price for ${coin}.`);
  const px = hlRoundPrice(isBuy ? mid * 1.05 : mid * 0.95, a.szDecimals);
  const size = hlRoundSize(Math.abs(pos.size), a.szDecimals);
  const ex = await exchangeClient(privateKey);
  const result = await ex.order({
    orders: [{ a: idx, b: isBuy, p: String(px), s: String(size), r: true, t: { limit: { tif: "Ioc" } } }],
    grouping: "na",
  });
  const err = orderError(result);
  if (err) throw new Error(err);
  const fill = orderFill(result);
  return { coin, closedSize: fill ? fill.totalSz : size, avgPx: fill ? fill.avgPx : px, wasLong: pos.size > 0, entryPx: pos.entryPx, unrealizedPnl: pos.unrealizedPnl };
}
