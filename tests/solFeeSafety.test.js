import test from "node:test";
import assert from "node:assert/strict";
import { Keypair } from "@solana/web3.js";
import {
  buildFrozenSolFeeAllocation,
  classifyFeeConfirmation,
  feeTargetsFromFrozenAllocation,
  validateFrozenSolFeeAllocation
} from "../src/lib/solFeeSafety.js";

test("Jito recovery uses the exact build-time fee wallets and lamports", () => {
  const ownerWallet = Keypair.generate().publicKey.toBase58();
  const cashCowWallet = Keypair.generate().publicKey.toBase58();
  const referralOne = Keypair.generate().publicKey.toBase58();
  const referralTwo = Keypair.generate().publicKey.toBase58();
  const targets = {
    ownerLamports: 500n,
    cashCowLamports: 150n,
    cashCowWallet,
    partnerProgramId: "cashcow-v1",
    referralLamports: 150n,
    referrerUserId: "original-referrer",
    referralSplits: [
      { wallet: referralOne, lamports: 50n },
      { wallet: referralTwo, lamports: 100n }
    ]
  };

  const frozen = buildFrozenSolFeeAllocation({ feeLamports: 800n, ownerWallet, targets });

  // Simulate profile/program changes after the signed bundle was persisted.
  targets.ownerLamports = 800n;
  targets.cashCowLamports = 0n;
  targets.cashCowWallet = Keypair.generate().publicKey.toBase58();
  targets.referralLamports = 0n;
  targets.referralSplits = [];

  const recovered = feeTargetsFromFrozenAllocation({ feeLamports: 800n, allocation: frozen });
  assert.equal(recovered.ownerWallet, ownerWallet);
  assert.equal(recovered.ownerLamports, 500n);
  assert.equal(recovered.cashCowWallet, cashCowWallet);
  assert.equal(recovered.cashCowLamports, 150n);
  assert.equal(recovered.referrerUserId, "original-referrer");
  assert.deepEqual(recovered.referralSplits, [
    { wallet: referralOne, lamports: 50n },
    { wallet: referralTwo, lamports: 100n }
  ]);
});

test("frozen fee allocation rejects any total, owner, or referral mismatch", () => {
  const ownerWallet = Keypair.generate().publicKey.toBase58();
  const referralWallet = Keypair.generate().publicKey.toBase58();
  const frozen = buildFrozenSolFeeAllocation({
    feeLamports: 650n,
    ownerWallet,
    targets: {
      ownerLamports: 500n,
      cashCowLamports: 0n,
      referralLamports: 150n,
      referralSplits: [{ wallet: referralWallet, lamports: 150n }]
    }
  });

  assert.throws(() => validateFrozenSolFeeAllocation({
    feeLamports: 651n,
    allocation: frozen
  }), /total does not match/i);

  assert.throws(() => validateFrozenSolFeeAllocation({
    feeLamports: 650n,
    expectedOwnerWallet: Keypair.generate().publicKey.toBase58(),
    allocation: frozen
  }), /platform fee wallet/i);

  const badSplit = structuredClone(frozen);
  badSplit.referral.splits[0].lamports = "149";
  assert.throws(() => validateFrozenSolFeeAllocation({
    feeLamports: 650n,
    allocation: badSplit
  }), /splits do not equal/i);
});

test("post-broadcast confirmation exceptions are unknown; only value.err is definitive", () => {
  for (const message of [
    "block height exceeded",
    "already processed",
    "confirmation timed out",
    "RPC connection reset"
  ]) {
    assert.equal(classifyFeeConfirmation({ error: new Error(message) }).status, "outcome_unknown");
  }
  assert.equal(classifyFeeConfirmation({ confirmation: { value: { err: { InstructionError: [0, "Custom"] } } } }).status, "failed_on_chain");
  assert.equal(classifyFeeConfirmation({ confirmation: { value: { err: null } } }).status, "confirmed");
});
