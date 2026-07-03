// Execution layer — SIMULATION ONLY by default.
//
// This lab harness deliberately does NOT depend on a real chain SDK. It models
// signing with a MOCK, fund-less signer and models the "transaction" as a plain
// object, then routes it through an abstract `ChainConn`. That keeps the whole
// suite offline and deterministic while faithfully demonstrating every guardrail.
//
// The only thing this file can ever "broadcast" is a HARMLESS no-op, and ONLY
// after: DRY_RUN=false + cluster=devnet + ALLOW_DEVNET_SEND=true AND the live
// chain's genesis hash is verified to be devnet. Env strings are never trusted.
//
// In an authorized deployment review you would back `ChainConn` with a real
// @solana/web3.js Connection + Transaction; the guardrail logic here is unchanged.

import { randomBytes } from "crypto";
import bs58 from "bs58";
import { DEVNET_GENESIS, HarnessConfig, assertNoMainnet, broadcastFlagsAllow } from "./config";
import { SwapPlan } from "./jupiter";

export interface MockSigner {
  publicKey: string; // base58; a fresh random 32-byte pubkey with NO funds
}

// A modeled transaction — intentionally not a real serialized tx.
export interface LabTx {
  feePayer: string;
  recentBlockhash: string;
  instructions: Array<{ kind: string; note: string }>;
  signedBy: string[];
}

export interface SimResult {
  simulated: true;
  broadcast: boolean;
  signature?: string;
  err: unknown;
  logs: string[] | null;
  note: string;
}

// Minimal chain surface. Tests inject a fake; a real review backs it with web3.
export interface ChainConn {
  getGenesisHash(): Promise<string>;
  getLatestBlockhash(): Promise<{ blockhash: string }>;
  simulateTransaction(tx: LabTx): Promise<{ value: { err: unknown; logs: string[] | null } }>;
  sendRawTransaction?(tx: LabTx): Promise<string>;
  confirmTransaction?(sig: string): Promise<unknown>;
}

/** Ephemeral, fund-less MOCK signer. Never persisted, never a user key. */
export function ephemeralSigner(): MockSigner {
  return { publicKey: bs58.encode(randomBytes(32)) };
}

/**
 * Last line of defense before any broadcast: prove the chain is devnet by its
 * genesis hash. If someone points the RPC at mainnet and flips the env flags,
 * THIS throws — env strings are never trusted for a send decision.
 */
export async function assertBroadcastAllowed(cfg: HarnessConfig, conn: ChainConn): Promise<void> {
  assertNoMainnet(cfg);
  if (!broadcastFlagsAllow(cfg)) {
    throw new Error("broadcast disabled (need DRY_RUN=false + cluster=devnet + ALLOW_DEVNET_SEND=true)");
  }
  const genesis = await conn.getGenesisHash();
  if (genesis !== DEVNET_GENESIS) {
    throw new Error(`refusing to send: chain genesis ${genesis} is not devnet — aborting`);
  }
}

/**
 * "Execute" a swap plan. In every safe mode this only SIMULATES a harmless no-op
 * and returns the result. Only if the broadcast gates AND the genesis check pass
 * does it broadcast that same no-op to devnet (not a swap; moves nothing).
 */
export async function executeOrSimulate(
  cfg: HarnessConfig,
  _plan: SwapPlan,
  conn: ChainConn
): Promise<SimResult> {
  assertNoMainnet(cfg);
  const signer = ephemeralSigner();
  const { blockhash } = await conn.getLatestBlockhash();
  const tx: LabTx = {
    feePayer: signer.publicKey,
    recentBlockhash: blockhash,
    // A 0-lamport self-transfer stands in for the swap: harmless, moves nothing.
    instructions: [{ kind: "noop-self-transfer", note: "0 lamports; NOT a swap" }],
    signedBy: [signer.publicKey],
  };

  const sim = await conn.simulateTransaction(tx);

  if (!broadcastFlagsAllow(cfg)) {
    return {
      simulated: true,
      broadcast: false,
      err: sim.value.err,
      logs: sim.value.logs,
      note: "SIMULATED no-op (no broadcast). This harness never assembles or sends a real swap.",
    };
  }

  await assertBroadcastAllowed(cfg, conn); // re-verify the chain before sending
  let signature: string | undefined;
  if (conn.sendRawTransaction) {
    signature = await conn.sendRawTransaction(tx);
    if (conn.confirmTransaction) await conn.confirmTransaction(signature);
  }
  return {
    simulated: true,
    broadcast: true,
    signature,
    err: sim.value.err,
    logs: sim.value.logs,
    note: "Broadcast a HARMLESS no-op tx on devnet (not a swap). Devnet SOL has no value.",
  };
}
