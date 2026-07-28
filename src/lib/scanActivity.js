function positiveNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return 0;
}

function pairMatchesMint(pair, mint) {
  const target = String(mint || "").toLowerCase();
  return target && [pair?.baseToken?.address, pair?.quoteToken?.address]
    .some((address) => String(address || "").toLowerCase() === target);
}

// A token can trade across several real pools. The deepest pool is best for price/liquidity, but using only
// that pool loses volume whenever another venue carries the activity. Sum each unique pool so every scan
// surface receives the token's complete DexScreener activity instead of a blank single-pool value.
export function aggregateDexPairActivity(mint, pairs = []) {
  const seen = new Set();
  const volume = { m5: 0, h1: 0, h6: 0, h24: 0 };
  const txns = {
    m5: { buys: 0, sells: 0 },
    h1: { buys: 0, sells: 0 },
    h24: { buys: 0, sells: 0 },
  };
  for (const pair of Array.isArray(pairs) ? pairs : []) {
    if (!pairMatchesMint(pair, mint)) continue;
    const key = String(pair?.pairAddress || pair?.address || pair?.url || "").toLowerCase();
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    volume.m5 += positiveNumber(pair?.volume?.m5, pair?.volume?.["5m"]);
    volume.h1 += positiveNumber(pair?.volume?.h1, pair?.volume?.["1h"]);
    volume.h6 += positiveNumber(pair?.volume?.h6, pair?.volume?.["6h"]);
    volume.h24 += positiveNumber(pair?.volume?.h24, pair?.volume?.["24h"], pair?.volume?.d1);
    for (const window of ["m5", "h1", "h24"]) {
      const aliases = window === "m5" ? ["m5", "5m"] : window === "h1" ? ["h1", "1h"] : ["h24", "24h", "d1"];
      const row = aliases.map((alias) => pair?.txns?.[alias] || pair?.transactions?.[alias]).find(Boolean) || {};
      txns[window].buys += positiveNumber(row.buys);
      txns[window].sells += positiveNumber(row.sells);
    }
  }
  const cleanVolume = Object.fromEntries(Object.entries(volume).filter(([, value]) => value > 0));
  const cleanTxns = Object.fromEntries(Object.entries(txns).filter(([, row]) => row.buys > 0 || row.sells > 0));
  return {
    volume: Object.keys(cleanVolume).length ? cleanVolume : null,
    txns: Object.keys(cleanTxns).length ? cleanTxns : null,
  };
}

// Hourly candles include USD volume as item[5]. When ordinary token metadata omits its volume object,
// a full rolling day of candles is an independent exact fallback regardless of which provider returned it.
// Short PumpPortal-style synthesized tapes stay honestly labelled RECENT rather than pretending to be 24h.
export function volumeFallbackFromOhlcv(payload = {}) {
  const candles = (Array.isArray(payload?.candles) ? payload.candles : [])
    .map((row) => ({ t: Number(row?.t) || 0, v: Number(row?.v) || 0 }))
    .filter((row) => row.t > 0 && row.v > 0)
    .sort((a, b) => a.t - b.t);
  if (!candles.length) return null;
  const latestAt = candles[candles.length - 1]?.t || 0;
  const oneDayAgo = latestAt - 24 * 60 * 60;
  const last24 = candles.filter((row) => row.t > oneDayAgo);
  const spanSeconds = latestAt - (last24[0]?.t || latestAt);
  // Eighteen hours of coverage tolerates a few missing/late provider candles without turning a
  // genuinely daily feed into a misleading short-tape number.
  if (last24.length >= 18 && spanSeconds >= 17 * 60 * 60) {
    const h24 = last24.reduce((sum, row) => sum + row.v, 0);
    const h1 = last24[last24.length - 1]?.v || 0;
    return h24 > 0 ? { volume: { h24, ...(h1 > 0 ? { h1 } : {}) }, source: "ohlcv-24h" } : null;
  }
  const recent = candles.reduce((sum, row) => sum + row.v, 0);
  return recent > 0 ? { volumeRecentUsd: recent, source: "recent-trade-tape" } : null;
}
