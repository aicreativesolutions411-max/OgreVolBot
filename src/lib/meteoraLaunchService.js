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

import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

const LAMPORTS_PER_SOL = 1_000_000_000;

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
