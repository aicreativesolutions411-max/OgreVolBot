// Free, on-chain token-distribution reader — the no-cost replacement for the Solana Tracker
// holder/concentration fields in Dev Info + SlimeShield. It reads directly from our own RPC
// (via the caller's rpcRead, which already has Alchemy->Helius failover), so it costs nothing
// beyond reads we already pay for and keeps working with NO Solana Tracker subscription.
//
// What it returns (all decimal-adjusted, pools/curve/burn excluded from "holders"):
//   topHolderPercent  — single largest real holder, % of supply
//   top10Percent      — aggregate of the top 10 real holders, % of supply (the rug-relevant number)
//   devHoldPercent    — creator wallet's current holding, % of supply (0 if they sold out)
//   poolPercent       — % sitting in AMM pools / the bonding curve (liquidity, NOT a holder)
//   burnedPercent     — % sent to a burn address
//   onchainLoaded     — true when the read succeeded (gates the SlimeShield holder factors)

import { PublicKey } from "@solana/web3.js";

// Token-account OWNERS that are pools / bonding curves / LP — supply they custody is liquidity,
// not a holder, and must be excluded from concentration (otherwise every fresh pump coin reads
// 90%+ "concentrated" because the bonding curve holds the unsold supply).
export const POOL_OWNER_PROGRAMS = new Set([
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P", // pump.fun (bonding curve program)
  "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",  // PumpSwap AMM
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", // Raydium Liquidity Pool v4
  "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C", // Raydium CPMM
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", // Raydium CLMM
  "LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj",  // Raydium LaunchLab (letsbonk bonding curve — a fresh bonk coin's curve held ~all supply and rendered as one mega holder bubble)
  "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo",  // Meteora DLMM
  "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB", // Meteora Dynamic AMM Pools
  "dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN",  // Meteora Dynamic Bonding Curve (our own launchpad rail)
  "cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG",  // Meteora DAMM v2
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",  // Orca Whirlpool
  "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", // Orca Token Swap v2
  "SwaPpA9LAaLfeLi3a68M4DjnLqgtticKg6CnyNwgAC8",  // Saber / generic swap
]);

// Pool AUTHORITY wallets that can't be caught by the program check above: Raydium v4 vaults are owned by
// this global authority PDA, and reading ITS account doesn't reveal the AMM program — so v4 pools slipped
// through classification and showed as a whale bubble. Match the wallet directly.
export const KNOWN_POOL_WALLETS = new Set([
  "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1", // Raydium AMM v4 global authority
]);

// Common burn / incinerator destinations.
export const BURN_ADDRESSES = new Set([
  "1nc1nerator11111111111111111111111111111111",
]);

const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

function clampPct(part, whole) {
  if (!(whole > 0) || !(part >= 0)) return null;
  return Math.max(0, Math.min(100, (part / whole) * 100));
}
function round1(value) {
  return value == null || !Number.isFinite(value) ? null : Math.round(value * 10) / 10;
}

/**
 * @param {object} args
 * @param {string} args.mint
 * @param {string} [args.creatorWallet]   creator/dev wallet for the dev-holding read
 * @param {(label:string, fn:(c:any)=>Promise<any>)=>Promise<any>} args.rpcRead
 * @returns {Promise<object>} distribution fields (or { onchainLoaded:false } on failure)
 */
export async function computeOnchainDistribution({ mint, creatorWallet = "", rpcRead, withHolderCount = false } = {}) {
  if (!mint || typeof rpcRead !== "function") return { onchainLoaded: false };
  let mintPk;
  try { mintPk = new PublicKey(mint); } catch { return { onchainLoaded: false }; }

  // 1) Total supply (decimal-adjusted).
  const supplyRes = await rpcRead("onchain dist: supply", (c) => c.getTokenSupply(mintPk, "confirmed")).catch(() => null);
  const supply = Number(supplyRes?.value?.uiAmount);
  if (!Number.isFinite(supply) || supply <= 0) return { onchainLoaded: false };

  // 2) Top 20 token accounts by balance.
  const largestRes = await rpcRead("onchain dist: largest", (c) => c.getTokenLargestAccounts(mintPk)).catch(() => null);
  const accounts = (largestRes?.value || []).filter((a) => a && a.address && Number(a.uiAmount) > 0);
  if (!accounts.length) return { onchainLoaded: false };

  // 3) Resolve each token account's OWNER wallet (one batched parsed read).
  const ownerByAccount = new Map();
  try {
    const parsed = await rpcRead("onchain dist: token accounts",
      (c) => c.getMultipleParsedAccounts(accounts.map((a) => new PublicKey(a.address))));
    (parsed?.value || []).forEach((info, i) => {
      const owner = info?.data?.parsed?.info?.owner;
      if (owner) ownerByAccount.set(accounts[i].address, String(owner));
    });
  } catch { /* fall through: unknown owners are treated as real holders (conservative) */ }

  // 4) Classify each owner: is the owner account itself owned by a known pool/curve program?
  const ownerProgram = new Map();
  const ownerSet = [...new Set([...ownerByAccount.values()])];
  if (ownerSet.length) {
    try {
      const infos = await rpcRead("onchain dist: owner programs",
        (c) => c.getMultipleAccountsInfo(ownerSet.map((o) => new PublicKey(o))));
      (infos || []).forEach((info, i) => {
        if (info && info.owner) ownerProgram.set(ownerSet[i], info.owner.toBase58());
      });
    } catch { /* fall through */ }
  }

  const ownerOf = (accAddr) => ownerByAccount.get(accAddr) || null;
  const isBurn = (accAddr) => { const o = ownerOf(accAddr); return !!(o && BURN_ADDRESSES.has(o)); };
  const isPool = (accAddr) => {
    const o = ownerOf(accAddr); if (!o) return false;
    if (KNOWN_POOL_WALLETS.has(o)) return true;
    const prog = ownerProgram.get(o);
    return !!(prog && POOL_OWNER_PROGRAMS.has(prog));
  };

  // Real holders = not a pool/curve and not a burn address (an unknown owner stays a holder).
  const realHolders = accounts
    .filter((a) => !isPool(a.address) && !isBurn(a.address))
    .map((a) => ({ owner: ownerOf(a.address) || a.address, ui: Number(a.uiAmount) || 0 }))
    .sort((x, y) => y.ui - x.ui);

  const pooledUi = accounts.filter((a) => isPool(a.address)).reduce((s, a) => s + (Number(a.uiAmount) || 0), 0);
  const burnedUi = accounts.filter((a) => isBurn(a.address)).reduce((s, a) => s + (Number(a.uiAmount) || 0), 0);

  const topHolderPercent = realHolders.length ? clampPct(realHolders[0].ui, supply) : null;
  const top10Percent = realHolders.length
    ? clampPct(realHolders.slice(0, 10).reduce((s, h) => s + h.ui, 0), supply) : null;

  // 5) Dev holding: prefer the creator found among the top holders; else a direct balance read.
  let devHoldPercent = null;
  const creator = String(creatorWallet || "").trim();
  if (creator) {
    const inTop = realHolders.filter((h) => h.owner === creator).reduce((s, h) => s + h.ui, 0);
    if (inTop > 0) {
      devHoldPercent = clampPct(inTop, supply);
    } else {
      try {
        const res = await rpcRead("onchain dist: dev balance",
          (c) => c.getParsedTokenAccountsByOwner(new PublicKey(creator), { mint: mintPk }));
        const bal = (res?.value || []).reduce(
          (s, x) => s + (Number(x?.account?.data?.parsed?.info?.tokenAmount?.uiAmount) || 0), 0);
        devHoldPercent = clampPct(bal, supply) ?? 0; // creator with no balance => 0% (sold out)
      } catch { /* leave null */ }
    }
  }

  // Exact holder count — one getProgramAccounts over the SPL token program filtered to this mint
  // (pubkeys only via dataSlice, so the response stays light). Off by default to conserve RPC; flip
  // ONCHAIN_HOLDER_COUNT_ENABLED=true to fill the "Holders" number. Concentration above is free either way.
  let holderCount = null;
  if (withHolderCount) {
    try {
      const accts = await rpcRead("onchain dist: holder count", (c) => c.getProgramAccounts(new PublicKey(TOKEN_PROGRAM), {
        commitment: "confirmed",
        dataSlice: { offset: 0, length: 0 },
        filters: [{ dataSize: 165 }, { memcmp: { offset: 0, bytes: mint } }]
      }));
      if (Array.isArray(accts) && accts.length > 0) holderCount = accts.length; // 0 => unknown (Token-2022 / index miss), leave null
    } catch { /* leave null — concentration still loads */ }
  }

  return {
    onchainLoaded: true,
    topHolderPercent: round1(topHolderPercent),
    top10Percent: round1(top10Percent),
    devHoldPercent: round1(devHoldPercent),
    poolPercent: round1(clampPct(pooledUi, supply)),
    burnedPercent: round1(clampPct(burnedUi, supply)),
    holderCount,
    realHolderSample: realHolders.length,
    // Per-wallet top holders (owner + amount + % of supply) — the KOL/wallet MAP needs the actual list,
    // not just the aggregate. Pools/curve/burn already excluded above, so these are real holders only.
    holders: realHolders.slice(0, 40).map((h) => ({ wallet: h.owner, ui: h.ui, pct: round1(clampPct(h.ui, supply)) })),
  };
}

// Drop pool/curve/burn wallets from an ALREADY-FETCHED holder-row list ({wallet, pct}). The Solana Tracker
// holders feed includes the AMM pool / bonding curve as a "holder", so a fresh coin's map showed ONE mega
// bubble "holding" ~all supply (it was the curve, not a person). Classifies the top `probeLimit` owners with
// one getMultipleAccountsInfo read; best-effort — on RPC failure the known-wallet/burn drops still apply.
export async function excludePoolOwnerRows(rows, { rpcRead, probeLimit = 25, extraExclude = [] } = {}) {
  if (!Array.isArray(rows) || !rows.length) return rows || [];
  const drop = new Set(extraExclude.filter(Boolean));
  for (const r of rows) {
    const w = String(r?.wallet || "");
    if (BURN_ADDRESSES.has(w) || KNOWN_POOL_WALLETS.has(w)) drop.add(w);
  }
  const probe = rows.slice(0, probeLimit).map((r) => String(r?.wallet || "")).filter((w) => w && !drop.has(w));
  if (probe.length && typeof rpcRead === "function") {
    try {
      const infos = await rpcRead("holder rows: classify pools",
        (c) => c.getMultipleAccountsInfo(probe.map((w) => new PublicKey(w))));
      (infos || []).forEach((info, i) => {
        const prog = info?.owner?.toBase58?.() || (info?.owner ? String(info.owner) : "");
        if (prog && POOL_OWNER_PROGRAMS.has(prog)) drop.add(probe[i]);
      });
    } catch { /* classification is best-effort — unfiltered rows beat no rows */ }
  }
  return drop.size ? rows.filter((r) => !drop.has(String(r?.wallet || ""))) : rows;
}

// BIGGER holder list for the bubble MAP / airdrop (up to `limit`, default 150). getTokenLargestAccounts only
// returns the top 20; this enumerates ALL token accounts for the mint via getProgramAccounts.
//
// MEMORY SAFETY (this used to OOM-crash the whole service): web3.js's Connection.getProgramAccounts
// deserializes EVERY matching account into JS objects, so a busy coin (tens of thousands of holders) blew the
// Node heap — "FATAL ERROR: Reached heap limit". Instead we hit the JSON-RPC endpoint with a RAW STREAMED
// fetch and a HARD BYTE CAP: the moment the response exceeds `maxBytes` we abort and return [], so a mega-holder
// token safely falls back to the top-20 path instead of taking the process down. We parse owner+amount from the
// 40-byte dataSlice ourselves, defer base58 encoding until AFTER sort+slice (only the top ~165, never all N),
// and allow only ONE heavy read at a time. Returns [] on any failure (caller then uses the top-20 fallback).
let _manyHoldersInFlight = 0;
export async function computeManyHolders({ mint, rpcRead, rpcUrl = "", limit = 150, poolAddr = "", maxBytes = 3_000_000 } = {}) {
  if (!mint || !rpcUrl) return [];
  let mintPk; try { mintPk = new PublicKey(mint); } catch { return []; }
  // Supply first (light, cheap) — no point streaming the big list if we can't compute percentages.
  const supplyRes = typeof rpcRead === "function"
    ? await rpcRead("many holders: supply", (c) => c.getTokenSupply(mintPk, "confirmed")).catch(() => null)
    : null;
  const rawSupply = Number(supplyRes?.value?.amount || 0);
  if (!(rawSupply > 0)) return [];

  if (_manyHoldersInFlight >= 1) return [];   // one heavy read at a time — protects the heap from concurrent bursts
  _manyHoldersInFlight++;
  const ctl = new AbortController();
  const timer = setTimeout(() => { try { ctl.abort(); } catch { /* noop */ } }, 8_000);
  let body = null;
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: ctl.signal,
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "getProgramAccounts",
        params: [TOKEN_PROGRAM, {
          encoding: "base64", commitment: "confirmed",
          dataSlice: { offset: 32, length: 40 },                   // SPL token account: owner(32) + amount(u64,8)
          filters: [{ dataSize: 165 }, { memcmp: { offset: 0, bytes: mint } }],
        }],
      }),
    });
    if (!res.ok || !res.body) return [];
    const reader = res.body.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > maxBytes) {                                       // too many holders → bail, fall back to top-20
        try { await reader.cancel(); } catch { /* noop */ }
        try { ctl.abort(); } catch { /* noop */ }
        return [];
      }
      chunks.push(value);
    }
    body = Buffer.concat(chunks);
  } catch { return []; }
  finally { clearTimeout(timer); _manyHoldersInFlight--; }

  let accts;
  try { accts = JSON.parse(body.toString("utf8"))?.result; } catch { return []; }
  if (!Array.isArray(accts) || !accts.length) return [];

  const rows = [];
  for (const a of accts) {
    const d = a?.account?.data;
    const b64 = Array.isArray(d) ? d[0] : d;
    if (!b64) continue;
    let buf; try { buf = Buffer.from(b64, "base64"); } catch { continue; }
    if (buf.length < 40) continue;
    const amt = Number(buf.readBigUInt64LE(32));
    if (amt > 0) rows.push({ ownerBuf: buf.subarray(0, 32), amt });  // defer base58 until after sort/slice
  }
  if (!rows.length) return [];
  rows.sort((a, b) => b.amt - a.amt);
  const head = rows.slice(0, limit + 15)
    .map((r) => { let owner = ""; try { owner = new PublicKey(r.ownerBuf).toBase58(); } catch { /* skip */ } return { owner, amt: r.amt }; })
    .filter((r) => r.owner);

  const exclude = new Set([poolAddr, ...KNOWN_POOL_WALLETS].filter(Boolean));
  if (typeof rpcRead === "function") {
    try {
      const probe = head.slice(0, Math.min(24, head.length)).map((r) => new PublicKey(r.owner));
      const infos = await rpcRead("many holders: classify", (c) => c.getMultipleAccountsInfo(probe)).catch(() => null);
      (infos || []).forEach((info, i) => {
        const prog = info?.owner?.toBase58?.() || (info?.owner ? String(info.owner) : "");
        if (prog && POOL_OWNER_PROGRAMS.has(prog)) exclude.add(head[i].owner);
        if (BURN_ADDRESSES.has(head[i].owner)) exclude.add(head[i].owner);
      });
    } catch { /* worst case a pool shows as one bubble */ }
  }
  return head.filter((r) => !exclude.has(r.owner)).slice(0, limit)
    .map((r) => ({ wallet: r.owner, pct: round1((r.amt / rawSupply) * 100) || 0 }));
}
