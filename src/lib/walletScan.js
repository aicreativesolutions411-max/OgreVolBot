// ── Robinhood-Chain wallet PnL reconstruction (accurate, on-chain, free) ────────────────────────
// There is NO PnL provider for Robinhood Chain, so we rebuild it from Blockscout history the honest way:
// weighted-average cost basis in NATIVE ETH. RH swaps move native ETH (a BUY sends ETH in the tx `value`;
// a SELL receives ETH as an internal-tx from the router), so cost/proceeds are read directly — no WETH-leg
// guessing. Per token: cost = ETH spent buying, proceeds = ETH received selling, realized = proceeds −
// avgCost×soldQty, unrealized = liveValue − avgCost×heldQty. All ETH → USD at the current rate.
//
// Bounded + cached so a whale wallet can't hang or flood: paginated with page caps, one price lookup per
// held token (capped), 90s cache. Best-effort — any leg that fails degrades gracefully, never throws.
import { ethers } from "ethers";
import { rhEthUsd } from "./robinhoodChain.js";
import { getNoxaScan, NOXA_RH } from "./noxaLaunchpad.js";

const BLOCKSCOUT = "https://robinhoodchain.blockscout.com/api/v2";
const BLOCKSCOUT_V1 = "https://robinhoodchain.blockscout.com/api";
const scanCache = new Map();   // addrLc → { at, v }
const scanInflight = new Map();

async function bsFetch(path, timeoutMs = 8000) {
  // One retry on 429/5xx after a short pause — this instance's background sweeps also hit Blockscout, so a
  // wallet scan can land mid-burst; a single retry turns "card full of zeros" into a normal read.
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctl = new AbortController();
    const t = setTimeout(() => { try { ctl.abort(); } catch { /* noop */ } }, timeoutMs);
    try {
      const res = await fetch(`${BLOCKSCOUT}${path}`, { signal: ctl.signal, headers: { accept: "application/json", "user-agent": "SlimeWire/1.0" } });
      if (res.ok) return await res.json();
      if ((res.status === 429 || res.status >= 500) && attempt === 0) { await new Promise((r) => setTimeout(r, 900)); continue; }
      return null;
    } catch { if (attempt === 0) { await new Promise((r) => setTimeout(r, 500)); continue; } return null; }
    finally { clearTimeout(t); }
  }
  return null;
}
// Paginate a Blockscout list endpoint up to `maxPages` (Blockscout returns ~50/page + next_page_params).
async function bsPaged(base, { maxPages = 4, timeoutMs = 8000 } = {}) {
  const out = [];
  let params = null;
  for (let p = 0; p < maxPages; p++) {
    const qs = params ? "&" + new URLSearchParams(params).toString() : "";
    const d = await bsFetch(`${base}${base.includes("?") ? "" : "?"}${qs}`, timeoutMs);
    const items = (d && Array.isArray(d.items)) ? d.items : [];
    out.push(...items);
    params = d && d.next_page_params ? d.next_page_params : null;
    if (!params || !items.length) break;
  }
  return out;
}

async function bsAccount(address, action, timeoutMs = 7000) {
  const params = new URLSearchParams({
    module: "account", action, address: String(address || ""),
    startblock: "0", endblock: "999999999", sort: "desc", page: "1", offset: "250"
  });
  const ctl = new AbortController();
  const timer = setTimeout(() => { try { ctl.abort(); } catch { /* noop */ } }, timeoutMs);
  try {
    const response = await fetch(`${BLOCKSCOUT_V1}?${params}`, { signal: ctl.signal, headers: { accept: "application/json", "user-agent": "SlimeWire/1.0" } });
    if (!response.ok) return null;
    const data = await response.json();
    return String(data?.status) === "1" ? data.result : null;
  } catch { return null; } finally { clearTimeout(timer); }
}

const wei = (v) => { try { return Number(ethers.formatEther(BigInt(String(v || "0")))); } catch { return 0; } };
const tokQty = (v, dec) => { try { const d = Number(dec); return Number(ethers.formatUnits(BigInt(String(v || "0")), Number.isFinite(d) && d >= 0 ? d : 18)); } catch { return 0; } };

// Live USD price for a set of RH tokens. DexScreener (robinhood chain) FIRST — it prices the listed coins
// (HOOD etc.) that NOXA's launch-factory read can't; NOXA getNoxaScan fills the fresh pre-DexScreener ones.
// Batched (DexScreener takes up to 30 addrs/call) so pricing a whole portfolio is ~1 request.
async function priceRhTokens(addrs, rpcUrl) {
  const out = new Map();
  const list = [...new Set(addrs.map((x) => String(x).toLowerCase()).filter(Boolean))];
  const wanted = new Set(list);
  for (let i = 0; i < list.length; i += 30) {
    const chunk = list.slice(i, i + 30);
    try {
      const ctl = new AbortController(); const t = setTimeout(() => { try { ctl.abort(); } catch { /* */ } }, 7000);
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${chunk.join(",")}`, { signal: ctl.signal, headers: { accept: "application/json" } }).finally(() => clearTimeout(t));
      const d = res.ok ? await res.json() : null;
      // Keep the DEEPEST-liquidity robinhood pair per token and REQUIRE real liquidity — a near-zero-liquidity
      // pool reports a garbage priceUsd (seen live: a dust pool priced a token at $1.6e16, which then blew up
      // the whole portfolio value). Track best-liq per token, then take its price.
      const bestLiq = new Map();
      for (const p of (d?.pairs || [])) {
        if (String(p.chainId || "").toLowerCase() !== "robinhood") continue;
        const liq = Number(p.liquidity?.usd) || 0;
        if (liq < 50) continue;                          // no real liquidity → its price is not trustworthy
        const base = String(p.baseToken?.address || "").toLowerCase();
        const quote = String(p.quoteToken?.address || "").toLowerCase();
        const basePrice = Number(p.priceUsd) || 0;
        const nativeRate = Number(p.priceNative) || 0;   // quote-token units per one base token
        const candidates = [
          { mint: base, price: basePrice },
          { mint: quote, price: basePrice > 0 && nativeRate > 0 ? basePrice / nativeRate : 0 },
        ];
        for (const candidate of candidates) {
          if (!wanted.has(candidate.mint) || !(candidate.price > 0)) continue;
          if (!bestLiq.has(candidate.mint) || liq > bestLiq.get(candidate.mint).liq) bestLiq.set(candidate.mint, { price: candidate.price, liq });
        }
      }
      for (const [m, b] of bestLiq) if (!(out.get(m) > 0)) out.set(m, b.price);
    } catch { /* fall through to NOXA per-token */ }
  }
  // NOXA fallback for anything DexScreener didn't price (fresh curve coins), bounded.
  const missing = list.filter((m) => !(out.get(m) > 0)).slice(0, 16);
  await Promise.all(missing.map(async (m) => {
    const s = await getNoxaScan(m, { rpcUrl }).catch(() => null);
    if (s && s.priceUsd > 0) out.set(m, s.priceUsd);
  }));
  return out;
}

// Full RH wallet scan: holdings + accurate realized/unrealized PnL + win rate. Returns null for a non-0x.
async function rhWalletScanCore(address, { rpcUrl, ttlMs = 90_000, maxHoldingsPriced = 16 } = {}) {
  const a = String(address || "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(a)) return null;
  const key = a.toLowerCase();
  const hit = scanCache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.v;
  const wl = key;

  // Robinhood Blockscout's v2 per-address history currently returns intermittent HTTP 500s. The indexed
  // account API stays live when block bounds are explicit, so wallet Bags/Trades use it directly.
  const [ethUsd, ethBalRaw, curTokensRaw, xfersRaw, txsRaw, itxsRaw] = await Promise.all([
    rhEthUsd().catch(() => 0),
    bsAccount(a, "balance").catch(() => null),
    bsAccount(a, "tokenlist").catch(() => null),
    bsAccount(a, "tokentx").catch(() => null),
    bsAccount(a, "txlist").catch(() => null),
    bsAccount(a, "txlistinternal").catch(() => null),
  ]);
  const curTokens = Array.isArray(curTokensRaw) ? curTokensRaw : [];
  const xfers = Array.isArray(xfersRaw) ? xfersRaw : [];
  const txs = Array.isArray(txsRaw) ? txsRaw : [];
  const itxs = Array.isArray(itxsRaw) ? itxsRaw : [];
  const hasPnl = Array.isArray(xfersRaw);
  const historyIncomplete = !Array.isArray(txsRaw) || !Array.isArray(itxsRaw);
  const eth = Number(ethUsd) || 0;
  const ethBalance = ethBalRaw ? wei(ethBalRaw?.coin_balance ?? ethBalRaw) : 0;

  // ETH moved by the wallet, keyed by tx hash. A tx's own `value` = native ETH the wallet SENT (buy spend);
  // internal-tx `to==wallet` = native ETH the wallet RECEIVED (sell proceeds / claims).
  const ethSent = new Map(), ethRecv = new Map();
  for (const t of txs) {
    const h = String(t.hash || "").toLowerCase();
    if (!h) continue;
    if (String(t.from?.hash || t.from || "").toLowerCase() === wl) ethSent.set(h, (ethSent.get(h) || 0) + wei(t.value));
  }
  for (const t of itxs) {
    const h = String(t.transaction_hash || t.transactionHash || t.tx_hash || "").toLowerCase();
    if (!h) continue;
    if (String(t.to?.hash || t.to || "").toLowerCase() === wl) ethRecv.set(h, (ethRecv.get(h) || 0) + wei(t.value));
  }

  // Walk token transfers → per-token bought/sold qty + ETH cost/proceeds (matched by tx hash).
  const tok = new Map();   // tokenAddrLc → { sym, dec, addr, boughtQty, soldQty, costEth, proceedsEth, buys, sells }
  const get = (addr, sym, dec) => {
    const k = addr.toLowerCase();
    if (!tok.has(k)) tok.set(k, { addr, sym: sym || "", dec: dec || 18, boughtQty: 0, soldQty: 0, costEth: 0, proceedsEth: 0, buys: 0, sells: 0 });
    const r = tok.get(k); if (sym && !r.sym) r.sym = sym; return r;
  };
  for (const x of xfers) {
    const h = String(x.transaction_hash || x.transactionHash || x.hash || x.tx_hash || "").toLowerCase();
    const tkn = x.token || x || {};
    const addr = String(tkn.address || tkn.address_hash || x.contractAddress || "");
    if (!addr) continue;
    const sym = String(tkn.symbol || x.tokenSymbol || "").replace(/^\$+/, "").slice(0, 12);
    const rawDecimals = tkn.decimals ?? x.tokenDecimal;
    const dec = rawDecimals == null || rawDecimals === "" ? 0 : Number(rawDecimals);
    const qty = tokQty((x.total || {}).value ?? x.value, dec);
    if (!(qty > 0)) continue;
    const to = String(x.to?.hash || x.to || "").toLowerCase();
    const from = String(x.from?.hash || x.from || "").toLowerCase();
    const r = get(addr, sym, dec);
    if (to === wl) {                       // token came IN → a BUY if the wallet spent ETH in this tx
      const spent = ethSent.get(h) || 0;
      if (spent > 0) { r.boughtQty += qty; r.costEth += spent; r.buys++; }
      else { r.boughtQty += qty; }        // transfer/airdrop in (no ETH cost) — counts to holdings, 0 cost
    } else if (from === wl) {              // token went OUT → a SELL if the wallet received ETH in this tx
      const got = ethRecv.get(h) || 0;
      if (got > 0) { r.soldQty += qty; r.proceedsEth += got; r.sells++; }
      else { r.soldQty += qty; }          // transfer out (no ETH) — reduces holdings, no proceeds
    }
  }

  // Current on-chain holdings (authoritative qty).
  const held = new Map();   // addrLc → { addr, sym, qty }
  for (const it of (Array.isArray(curTokens) ? curTokens : [])) {
    const t = it.token || it || {}; const addr = String(t.address || t.address_hash || it.contractAddress || "");
    if (!addr) continue;
    const rawDecimals = t.decimals ?? it.tokenDecimal;
    const q = tokQty(it.value ?? it.balance, rawDecimals == null || rawDecimals === "" ? 0 : Number(rawDecimals));
    if (q > 0) held.set(addr.toLowerCase(), { addr, sym: String(t.symbol || it.tokenSymbol || "").replace(/^\$+/, "").slice(0, 12), qty: q });
  }

  // Price EVERY token the wallet holds or traded (DexScreener batch + NOXA fallback) — one pass, so a
  // DexScreener-listed coin like HOOD prices correctly instead of showing $0 and wrecking unrealized PnL.
  const priceCandidates = [...new Set([...held.keys(), ...tok.keys()])];
  const priceCap = Math.max(1, Number(maxHoldingsPriced) || 16);
  const priceByAddr = await priceRhTokens(priceCandidates.slice(0, priceCap), rpcUrl).catch(() => new Map());
  const priceOf = (k) => Number(priceByAddr.get(String(k).toLowerCase())) || 0;
  // Final guard: a single memecoin holding worth > $50M is a pricing artifact, not reality → treat as unpriced
  // (0) so one bad pair can never nuke the totals. Real whale positions on this chain are far below this.
  const VALUE_CAP = 50_000_000;
  const valueOf = (qty, k) => { const v = priceOf(k) * qty; return (v > 0 && v < VALUE_CAP) ? v : 0; };

  // Assemble per-token PnL. Realized uses weighted-avg cost; unrealized uses live value vs remaining cost.
  let realizedUsd = 0, unrealizedUsd = 0, wins = 0, losses = 0, holdingsValueUsd = 0;
  const holdings = [], tradeRows = [];
  const DUST = 0.5;    // ignore sub-50-cent dust/airdrop tokens so the card shows real bags, not junk
  const seen = new Set();
  for (const [k, r] of tok) {
    seen.add(k);
    const avgCostEth = r.boughtQty > 0 ? r.costEth / r.boughtQty : 0;
    const realizedEth = r.proceedsEth - avgCostEth * Math.min(r.soldQty, r.boughtQty);
    const realized = realizedEth * eth;
    if (r.buys > 0 || r.sells > 0) tradeRows.push({
      addr: r.addr, sym: r.sym || (held.get(k) || {}).sym || "", buys: r.buys, sells: r.sells,
      boughtQty: r.boughtQty, soldQty: r.soldQty, volumeUsd: (r.costEth + r.proceedsEth) * eth,
      spentUsd: r.costEth * eth, receivedUsd: r.proceedsEth * eth, realizedUsd: realized
    });
    if (r.sells > 0) { realizedUsd += realized; if (realized >= 0) wins++; else losses++; }
    const heldQty = held.has(k) ? held.get(k).qty : Math.max(0, r.boughtQty - r.soldQty);
    const liveValueUsd = valueOf(heldQty, k);
    const remainingCostUsd = avgCostEth * heldQty * eth;
    const unrealized = liveValueUsd - remainingCostUsd;
    if (heldQty > 0 && (liveValueUsd > DUST || remainingCostUsd > DUST)) {
      unrealizedUsd += unrealized; holdingsValueUsd += liveValueUsd;
      holdings.push({ addr: r.addr, sym: r.sym || (held.get(k) || {}).sym || "", qty: heldQty, valueUsd: liveValueUsd, costUsd: remainingCostUsd, pnlUsd: unrealized });
    }
  }
  // Current holdings with NO buy history (received/airdropped) — still show them even when an obscure/new
  // token has no USD price yet. Hiding unpriced balances made a real wallet look empty.
  for (const [k, h] of held) {
    if (seen.has(k)) continue;
    const val = valueOf(h.qty, k);
    if (h.qty > 0) { holdings.push({ addr: h.addr, sym: h.sym, qty: h.qty, valueUsd: val, costUsd: 0, pnlUsd: val, unpriced: !(val > 0) }); holdingsValueUsd += val; unrealizedUsd += val; }
  }
  holdings.sort((x, y) => y.valueUsd - x.valueUsd);
  tradeRows.sort((x, y) => y.volumeUsd - x.volumeUsd);

  const tradeCount = [...tok.values()].reduce((s, r) => s + r.buys + r.sells, 0);
  const closed = wins + losses;
  const v = {
    ok: true, address: a, chain: "robinhood",
    ethBalance, ethUsd: eth, ethBalanceUsd: ethBalance * eth,
    realizedUsd, unrealizedUsd, totalPnlUsd: realizedUsd + unrealizedUsd,
    holdingsValueUsd, totalValueUsd: holdingsValueUsd + ethBalance * eth,
    winRate: closed > 0 ? Math.round((wins / closed) * 100) : null,
    wins, losses, tradeCount,
    tokensTraded: tok.size,
    holdings: holdings.slice(0, 12),
    trades: tradeRows.slice(0, 24),
    hasPnl,
    pnlPartial: hasPnl && (historyIncomplete || xfers.length >= 250 || txs.length >= 250 || itxs.length >= 250),
    pnlSource: hasPnl ? "Robinhood Chain history" : null,
    partial: historyIncomplete || xfers.length >= 250 || txs.length >= 250 || itxs.length >= 250 || priceCandidates.length > priceCap,
    explorer: `https://robinhoodchain.blockscout.com/address/${a}`,
  };
  scanCache.set(key, { at: Date.now(), v });
  if (scanCache.size > 150) scanCache.delete(scanCache.keys().next().value);
  return v;
}

export async function rhWalletScan(address, options = {}) {
  const key = String(address || "").trim().toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(key)) return null;
  const pending = scanInflight.get(key);
  if (pending) return pending;
  const run = rhWalletScanCore(address, options);
  scanInflight.set(key, run);
  try {
    return await run;
  } finally {
    if (scanInflight.get(key) === run) scanInflight.delete(key);
  }
}
