// Create a Meteora DBC config that routes trading fees to your DEV wallet — the on-chain account whose
// pubkey becomes METEORA_DBC_CONFIG_KEY. Every SlimeWire/Meteora launch then runs on THIS config, so
// the curve + fee split below apply to all of them.
//
//   SIMULATE (default, spends nothing):
//     METEORA_FEE_CLAIMER=<devWalletPubkey> node scripts/meteora-create-config.mjs --keypair ~/payer.json
//   BROADCAST for real (creates the config, costs ~rent in SOL):
//     METEORA_FEE_CLAIMER=<devWalletPubkey> node scripts/meteora-create-config.mjs --keypair ~/payer.json --send
//
// IMPORTANT — read before --send:
// * This is UNVERIFIED helper code. The SAFE, tested path is Meteora's own config tool (Meteora
//   "Studio" / launchpad config builder): create a config there with quote=SOL, fee claimer = your dev
//   wallet, collect fees in SOL, migrate to DAMM v2 — then just paste its config pubkey into
//   METEORA_DBC_CONFIG_KEY. Use this script only if you'd rather do it from code, and SIMULATE first.
// * The payer keypair (--keypair <solana-cli json> OR METEORA_CONFIG_PAYER_SECRET=<base58>) signs + pays.
//   Keep it secret; this script never transmits it anywhere but the RPC you point at.

import fs from "node:fs";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import {
  PartnerService, buildCurveWithMarketCap,
  TokenType, TokenDecimal, TokenAuthorityOption, CollectFeeMode,
  MigrationOption, MigrationFeeOption, ActivationType, BaseFeeMode
} from "@meteora-ag/dynamic-bonding-curve-sdk";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };

const SEND = has("--send");
const RPC = val("--rpc", process.env.READ_RPC_URL || process.env.RPC_URL || "https://api.mainnet-beta.solana.com");
const FEE_CLAIMER = (process.env.METEORA_FEE_CLAIMER || val("--fee-claimer", "")).trim();   // your DEV wallet
const INITIAL_MC = Number(val("--initial-mcap", process.env.METEORA_INITIAL_MCAP || "5000"));
const MIGRATION_MC = Number(val("--migration-mcap", process.env.METEORA_MIGRATION_MCAP || "69000"));

function loadPayer() {
  const kpPath = val("--keypair", "");
  if (kpPath) return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(kpPath, "utf8"))));
  const b58 = (process.env.METEORA_CONFIG_PAYER_SECRET || "").trim();
  if (b58) return Keypair.fromSecretKey(bs58.decode(b58));
  throw new Error("Provide the payer keypair via --keypair <solana-cli-json> or METEORA_CONFIG_PAYER_SECRET=<base58>.");
}

(async () => {
  if (!FEE_CLAIMER) throw new Error("Set METEORA_FEE_CLAIMER=<your dev wallet pubkey> — that's where trading fees route.");
  const feeClaimer = new PublicKey(FEE_CLAIMER);
  const payer = loadPayer();
  const connection = new Connection(RPC, "confirmed");
  const configKeypair = Keypair.generate();   // its pubkey is your METEORA_DBC_CONFIG_KEY

  // Curve + fees. Pump-like defaults: 1B supply, 6 decimals, SOL quote, flat ~1% fee collected in SOL,
  // creator (dev) gets 100% of the creator fee share, renounced authority, graduate to DAMM v2.
  const configParameters = buildCurveWithMarketCap({
    initialMarketCap: INITIAL_MC,
    migrationMarketCap: MIGRATION_MC,
    activationType: ActivationType.Timestamp,
    token: {
      tokenType: TokenType.SPLToken,
      tokenBaseDecimal: TokenDecimal.SIX,
      tokenQuoteDecimal: TokenDecimal.NINE,           // SOL = 9 decimals
      tokenAuthorityOption: TokenAuthorityOption.Immutable,
      totalTokenSupply: 1_000_000_000,
      leftover: 0
    },
    fee: {
      baseFeeParams: {
        baseFeeMode: BaseFeeMode.FeeSchedulerLinear,
        feeSchedulerParam: { startingFeeBps: 100, endingFeeBps: 100, numberOfPeriod: 0, totalDuration: 0 } // flat 1%
      },
      dynamicFeeEnabled: false,
      collectFeeMode: CollectFeeMode.QuoteToken,       // collect in SOL → dev fees accrue in SOL
      creatorTradingFeePercentage: 100,                // dev keeps 100% of the creator fee share
      poolCreationFee: 0,
      enableFirstSwapWithMinFee: false
    },
    migration: {
      migrationOption: MigrationOption.MET_DAMM_V2,
      migrationFeeOption: MigrationFeeOption.FixedBps25,
      migrationFee: { feePercentage: 0, creatorFeePercentage: 0 }
    },
    liquidityDistribution: {
      partnerPermanentLockedLiquidityPercentage: 0,
      partnerLiquidityPercentage: 0,
      creatorPermanentLockedLiquidityPercentage: 0,
      creatorLiquidityPercentage: 100
    },
    lockedVesting: { totalLockedVestingAmount: 0, numberOfVestingPeriod: 0, cliffUnlockAmount: 0, totalVestingDuration: 0, cliffDurationFromMigrationTime: 0 }
  });

  const partner = new PartnerService(connection, "confirmed");
  const tx = await partner.createConfig({
    config: configKeypair.publicKey,
    feeClaimer,                          // ← dev wallet earns the trading fees
    leftoverReceiver: feeClaimer,        // ← leftover base tokens also to the dev wallet
    quoteMint: new PublicKey(SOL_MINT),
    payer: payer.publicKey,
    ...configParameters
  });

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.feePayer = payer.publicKey;
  tx.recentBlockhash = blockhash;
  tx.sign(payer, configKeypair);

  console.log(`RPC: ${RPC}`);
  console.log(`fee claimer (dev wallet): ${feeClaimer.toBase58()}`);
  console.log(`initial MC: $${INITIAL_MC} → migration MC: $${MIGRATION_MC} (graduates to DAMM v2)`);
  console.log(`NEW config pubkey → set METEORA_DBC_CONFIG_KEY=${configKeypair.publicKey.toBase58()}`);

  if (!SEND) {
    const sim = await connection.simulateTransaction(tx);
    console.log(`\n[SIMULATE] err: ${JSON.stringify(sim.value.err)}`);
    console.log((sim.value.logs || []).slice(-12).join("\n"));
    console.log("\nDry run only — nothing was created. Re-run with --send to broadcast (after validating against Meteora docs).");
    return;
  }
  const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false, maxRetries: 3 });
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  console.log(`\n✅ CONFIG CREATED. tx: ${sig}`);
  console.log(`Set on Render: METEORA_DBC_CONFIG_KEY=${configKeypair.publicKey.toBase58()}  +  METEORA_LAUNCH_ENABLED=true`);
})().catch((e) => { console.error(`\n[meteora-create-config] FAILED: ${e?.message || e}`); process.exit(1); });
