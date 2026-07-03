// REAL devnet executor (@solana/web3.js). Loaded only by the trial runner —
// never by the unit tests. This is the "as close to real as possible" path the
// trial uses: it actually signs and broadcasts on DEVNET.
//
// It is genesis-gated to devnet on EVERY call: assertGenesisIsDevnet() refuses to
// touch any chain whose genesis hash isn't devnet's, and refuses a mainnet-looking
// RPC URL. Reaching mainnet is not a flag flip — it requires editing this source.
//
// NOTE ON FIDELITY: Jupiter does not operate on devnet, so a real *swap* of real
// tokens can't be reproduced here. The trial models the swap as a tiny real SOL
// transfer between two trial wallets — which faithfully exercises the whole
// multi-wallet sign → simulate → broadcast → confirm → balance-change pipeline
// (the part you actually want to trial), with valueless devnet SOL.

import { Connection, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { HarnessConfig, assertGenesisIsDevnet, assertNoMainnet, broadcastFlagsAllow } from "./config";
import { RealExecutor } from "./types";
import { DevnetWalletBook } from "./wallets";
import { log } from "./logger";

export function makeDevnetConnection(cfg: HarnessConfig): Connection {
  assertNoMainnet(cfg);
  return new Connection(cfg.rpcUrl, "confirmed");
}

/**
 * Build a RealExecutor bound to a devnet connection + wallet book. Every call
 * re-verifies the chain is devnet by genesis hash before doing anything.
 */
export function makeDevnetExecutor(cfg: HarnessConfig, conn: Connection, wallets: DevnetWalletBook): RealExecutor {
  assertNoMainnet(cfg);
  return async (ctx) => {
    // Hard chain-identity gate — refuses anything that isn't really devnet.
    const genesis = await conn.getGenesisHash();
    assertGenesisIsDevnet(genesis, cfg.rpcUrl);

    const source = wallets.pickForSource(ctx.chatId);
    const counter = wallets.list()[(source.index + 1) % wallets.list().length];
    const fromKp = wallets.keypair(source.index);
    const toPk = new PublicKey(counter.publicKey);

    // Model the swap as a tiny fixed real transfer (plumbing test, not the amount).
    const lamports = 1000; // 0.000001 SOL — faucet-friendly, valueless
    const tx = new Transaction().add(
      SystemProgram.transfer({ fromPubkey: fromKp.publicKey, toPubkey: toPk, lamports })
    );
    const { blockhash } = await conn.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.feePayer = fromKp.publicKey;
    tx.sign(fromKp);

    // Always simulate first.
    const sim = await conn.simulateTransaction(tx);
    const noteBase = `req ${ctx.uiAmount} (modeled as ${lamports} lamports ${source.label}→${counter.label})`;

    if (!broadcastFlagsAllow(cfg)) {
      return { broadcast: false, err: sim.value.err, walletLabel: source.label,
        note: `DEVNET simulate only — ${noteBase}. Set ALLOW_DEVNET_SEND=true + DRY_RUN=false to broadcast.` };
    }

    // Armed: broadcast + confirm on devnet.
    const signature = await sendAndConfirmTransaction(conn, tx, [fromKp], { commitment: "confirmed" });
    log.info(`devnet broadcast ${source.label}→${counter.label} sig=${signature.slice(0, 12)}…`);
    return { broadcast: true, signature, err: sim.value.err, walletLabel: source.label,
      note: `DEVNET broadcast — ${noteBase}. Devnet SOL has no value.` };
  };
}
