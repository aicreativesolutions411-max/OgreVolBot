// Meteora Dynamic Bonding Curve (DBC) launch path — SlimeWire's own bonding-curve rail.
//
// A coin launches on an EXISTING DBC "config" account (METEORA_DBC_CONFIG_KEY). That config — created
// once, off this path — is what defines the curve AND the fee claimers, so trading fees route to the
// DEV wallet we name there. Per launch we just build a create-pool tx on that config with our own
// (vanity SL1ME) base mint, optionally appending the creator's first buy in the same tx.
//
// UNVERIFIED until a real on-chain test launch: this builds + signs a real mainnet tx that custodies
// funds. Keep it behind METEORA_LAUNCH_ENABLED and prove dev-fee routing with a tiny launch first.
//
// SDK: @meteora-ag/dynamic-bonding-curve-sdk (v1.5.x). Verified method shapes:
//   client.creator.createPool({ name, symbol, uri, payer, poolCreator, config, baseMint }) -> Transaction
//   client.creator.createPoolWithFirstBuy({ createPoolParam, firstBuyParam:{ buyer, buyAmount:BN,
//     minimumAmountOut:BN, referralTokenAccount:null } }) -> Transaction
//   client.creator.claimCreatorTradingFee({ creator, payer, pool, maxBaseAmount:BN, maxQuoteAmount:BN }) -> Transaction

import {
  DynamicBondingCurveClient, PartnerService, buildCurveWithMarketCap,
  TokenType, TokenDecimal, TokenAuthorityOption, CollectFeeMode,
  MigrationOption, MigrationFeeOption, ActivationType, BaseFeeMode
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

const LAMPORTS_PER_SOL = 1_000_000_000;
const SOL_MINT = "So11111111111111111111111111111111111111112";

// Shared SlimeWire curve shape (used by the one-time shared config AND the per-coin config). Only the
// market-cap knobs vary. creatorTradingFeePercentage:100 → each coin's fees go to its own launcher.
export function slimeWireCurveParameters(initialMarketCap = 5000, migrationMarketCap = 69000) {
  const init = Math.max(500, Number(initialMarketCap) || 5000);
  const mig = Math.max(init * 1.5, Number(migrationMarketCap) || 69000);
  return buildCurveWithMarketCap({
    initialMarketCap: init,
    migrationMarketCap: mig,
    activationType: ActivationType.Timestamp,
    token: {
      tokenType: TokenType.SPLToken,
      tokenBaseDecimal: TokenDecimal.SIX,
      tokenQuoteDecimal: TokenDecimal.NINE,
      tokenAuthorityOption: TokenAuthorityOption.Immutable,
      totalTokenSupply: 1_000_000_000,
      leftover: 0
    },
    fee: {
      baseFeeParams: {
        baseFeeMode: BaseFeeMode.FeeSchedulerLinear,
        feeSchedulerParam: { startingFeeBps: 100, endingFeeBps: 100, numberOfPeriod: 0, totalDuration: 0 }
      },
      dynamicFeeEnabled: false,
      collectFeeMode: CollectFeeMode.QuoteToken,
      creatorTradingFeePercentage: 100,          // 100% of fees to the per-coin creator (its launcher)
      poolCreationFee: 0,
      enableFirstSwapWithMinFee: false
    },
    migration: {
      migrationOption: MigrationOption.MET_DAMM_V2,
      migrationFeeOption: MigrationFeeOption.FixedBps25,
      migrationFee: { feePercentage: 0, creatorFeePercentage: 0 }
    },
    // Meteora requires >=10% of the migrated LP locked at day 1 (anti-rug). Lock 100% permanently —
    // the trustworthy, pump-style default (LP can't be pulled = rug-proof). The creator still earns
    // 100% of TRADING fees (creatorTradingFeePercentage above); locked LP and fees are separate.
    liquidityDistribution: {
      partnerPermanentLockedLiquidityPercentage: 0,
      partnerLiquidityPercentage: 0,
      creatorPermanentLockedLiquidityPercentage: 100,
      creatorLiquidityPercentage: 0
    },
    lockedVesting: { totalLockedVestingAmount: 0, numberOfVestingPeriod: 0, cliffUnlockAmount: 0, totalVestingDuration: 0, cliffDurationFromMigrationTime: 0 }
  });
}

// Build the one-time DBC config-creation transaction. The config defines the curve + fee split for
// every coin launched on the SlimeWire/Meteora rail. Caller passes a fresh `configKeypair`; sign with
// [payerKeypair, configKeypair] then send.
export async function buildMeteoraCreateConfigTransaction({
  connection, commitment = "confirmed", configPublicKey, feeClaimer, payer,
  initialMarketCap = 5000, migrationMarketCap = 69000
}) {
  if (!isValidPublicKey(configPublicKey)) throw new Error("Config public key invalid.");
  if (!isValidPublicKey(feeClaimer)) throw new Error("Fee claimer (dev wallet) public key invalid.");
  if (!isValidPublicKey(payer)) throw new Error("Payer public key invalid.");
  const configParameters = slimeWireCurveParameters(initialMarketCap, migrationMarketCap);
  const partner = new PartnerService(connection, commitment);
  return partner.createConfig({
    config: new PublicKey(configPublicKey),
    feeClaimer: new PublicKey(feeClaimer),
    leftoverReceiver: new PublicKey(feeClaimer),
    quoteMint: new PublicKey(SOL_MINT),
    payer: new PublicKey(payer),
    ...configParameters
  });
}

// PER-COIN curve: create a FRESH config (with this coin's own start/graduation MC) AND its pool in one
// flow. Returns { createConfigTx, createPoolWithFirstBuyTx } — sign createConfigTx with
// [payer, configKeypair], the pool tx with [payer, baseMintKeypair], and send config → pool in order.
// Costs more SOL per launch (a config rent each time) — that's the trade for per-coin starting liquidity.
export async function buildMeteoraConfigAndPoolTransactions({
  connection, commitment = "confirmed", configPublicKey, feeClaimer, payer, baseMint,
  name, symbol, uri, devBuySol = 0, minimumAmountOut = 0, initialMarketCap = 5000, migrationMarketCap = 69000
}) {
  if (!isValidPublicKey(configPublicKey)) throw new Error("Config public key invalid.");
  if (!isValidPublicKey(feeClaimer)) throw new Error("Fee claimer public key invalid.");
  if (!isValidPublicKey(payer)) throw new Error("Payer public key invalid.");
  if (!isValidPublicKey(baseMint)) throw new Error("Base mint public key invalid.");
  const creator = new PublicKey(payer);
  const configParameters = slimeWireCurveParameters(initialMarketCap, migrationMarketCap);
  const params = {
    config: new PublicKey(configPublicKey),
    feeClaimer: new PublicKey(feeClaimer),
    leftoverReceiver: new PublicKey(feeClaimer),
    quoteMint: new PublicKey(SOL_MINT),
    payer: creator,
    ...configParameters,
    preCreatePoolParam: { name: String(name || ""), symbol: String(symbol || ""), uri: String(uri || ""), poolCreator: creator, baseMint: new PublicKey(baseMint) }
  };
  const buyLamports = Math.max(0, Math.round(Number(devBuySol || 0) * LAMPORTS_PER_SOL));
  if (buyLamports > 0) {
    params.firstBuyParam = {
      buyer: creator,
      buyAmount: new BN(String(buyLamports)),
      minimumAmountOut: new BN(String(Math.max(0, Math.round(Number(minimumAmountOut || 0))))),
      referralTokenAccount: null
    };
  }
  const client = DynamicBondingCurveClient.create(connection, commitment);
  return client.partner.createConfigAndPoolWithFirstBuy(params);
}

export function isValidPublicKey(value) {
  try { new PublicKey(String(value || "")); return true; } catch { return false; }
}

// Build the DBC create-pool transaction (legacy Transaction) on an existing config. Caller sets the
// feePayer + recentBlockhash, then signs with [creatorKeypair, baseMintKeypair] and sends.
export async function buildMeteoraCreatePoolTransaction({
  connection, commitment = "confirmed", configKey, creatorPublicKey, baseMintPublicKey,
  name, symbol, uri, devBuySol = 0, minimumAmountOut = 0
}) {
  if (!isValidPublicKey(configKey)) throw new Error("Meteora DBC config key is not a valid public key.");
  if (!isValidPublicKey(creatorPublicKey)) throw new Error("Creator (dev wallet) public key is invalid.");
  if (!isValidPublicKey(baseMintPublicKey)) throw new Error("Base mint public key is invalid.");

  const client = DynamicBondingCurveClient.create(connection, commitment);
  const creator = new PublicKey(creatorPublicKey);
  const createPoolParam = {
    name: String(name || ""),
    symbol: String(symbol || ""),
    uri: String(uri || ""),
    payer: creator,
    poolCreator: creator,            // dev wallet is the pool creator → creator fees accrue to it
    config: new PublicKey(configKey),
    baseMint: new PublicKey(baseMintPublicKey)
  };

  const buyLamports = Math.max(0, Math.round(Number(devBuySol || 0) * LAMPORTS_PER_SOL));
  if (buyLamports > 0) {
    return client.creator.createPoolWithFirstBuy({
      createPoolParam,
      firstBuyParam: {
        buyer: creator,
        buyAmount: new BN(String(buyLamports)),
        minimumAmountOut: new BN(String(Math.max(0, Math.round(Number(minimumAmountOut || 0))))),
        referralTokenAccount: null
      }
    });
  }
  return client.creator.createPool(createPoolParam);
}

// Build the claim-creator-fees tx (the dev withdraws accrued trading fees from their pool).
export async function buildMeteoraClaimCreatorFeesTransaction({
  connection, commitment = "confirmed", poolPublicKey, creatorPublicKey, receiverPublicKey
}) {
  const client = DynamicBondingCurveClient.create(connection, commitment);
  const creator = new PublicKey(creatorPublicKey);
  return client.creator.claimCreatorTradingFee({
    creator,
    payer: creator,
    pool: new PublicKey(poolPublicKey),
    maxBaseAmount: new BN(String("18446744073709551615")),   // u64 max — claim everything available
    maxQuoteAmount: new BN(String("18446744073709551615")),
    ...(receiverPublicKey && isValidPublicKey(receiverPublicKey) ? { receiver: new PublicKey(receiverPublicKey) } : {})
  });
}
