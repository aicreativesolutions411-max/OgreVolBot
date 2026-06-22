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
  "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo",  // Meteora DLMM
  "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB", // Meteora Dynamic AMM Pools
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",  // Orca Whirlpool
  "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", // Orca Token Swap v2
  "SwaPpA9LAaLfeLi3a68M4DjnLqgtticKg6CnyNwgAC8",  // Saber / generic swap
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
  };
}
