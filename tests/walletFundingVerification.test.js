import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  ComputeBudgetInstruction,
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemInstruction,
  SystemProgram,
  Transaction
} from "@solana/web3.js";

const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

function extractedFunction(name) {
  const start = serverSource.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} must exist`);
  const open = serverSource.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < serverSource.length; index += 1) {
    if (serverSource[index] === "{") depth += 1;
    if (serverSource[index] === "}") depth -= 1;
    if (depth === 0) return serverSource.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

const verifyWalletFunding = Function(
  "PublicKey",
  "SystemInstruction",
  "SystemProgram",
  "ComputeBudgetInstruction",
  "ComputeBudgetProgram",
  `return (${extractedFunction("verifySessionWalletFundingTransaction")});`
)(PublicKey, SystemInstruction, SystemProgram, ComputeBudgetInstruction, ComputeBudgetProgram);

function fundingFixture({ amountLamports = 200_000_000n } = {}) {
  const source = Keypair.generate();
  const destination = Keypair.generate().publicKey;
  const blockhash = Keypair.generate().publicKey.toBase58();
  const order = {
    sourcePublicKey: source.publicKey.toBase58(),
    destinationPublicKey: destination.toBase58(),
    amountLamports: String(amountLamports),
    blockhash
  };
  const transaction = new Transaction({ feePayer: source.publicKey, recentBlockhash: blockhash });
  return { source, destination, order, transaction, amountLamports };
}

function sign(transaction, source) {
  transaction.partialSign(source);
  return transaction;
}

test("wallet funding accepts capped wallet-added compute budget instructions", () => {
  const fixture = fundingFixture();
  fixture.transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25_000 }),
    SystemProgram.transfer({
      fromPubkey: fixture.source.publicKey,
      toPubkey: fixture.destination,
      lamports: fixture.amountLamports
    })
  );
  assert.doesNotThrow(() => verifyWalletFunding(sign(fixture.transaction, fixture.source), fixture.order));
});

test("wallet funding still rejects an added transfer", () => {
  const fixture = fundingFixture();
  fixture.transaction.add(
    SystemProgram.transfer({
      fromPubkey: fixture.source.publicKey,
      toPubkey: fixture.destination,
      lamports: fixture.amountLamports
    }),
    SystemProgram.transfer({
      fromPubkey: fixture.source.publicKey,
      toPubkey: Keypair.generate().publicKey,
      lamports: 1n
    })
  );
  assert.throws(() => verifyWalletFunding(sign(fixture.transaction, fixture.source), fixture.order), /changed/i);
});

test("wallet funding rejects an excessive wallet-added priority fee", () => {
  const fixture = fundingFixture();
  fixture.transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000_000 }),
    SystemProgram.transfer({
      fromPubkey: fixture.source.publicKey,
      toPubkey: fixture.destination,
      lamports: fixture.amountLamports
    })
  );
  assert.throws(() => verifyWalletFunding(sign(fixture.transaction, fixture.source), fixture.order), /priority fee settings are unsafe/i);
});

test("wallet funding rejects a changed destination or amount", () => {
  const fixture = fundingFixture();
  fixture.transaction.add(SystemProgram.transfer({
    fromPubkey: fixture.source.publicKey,
    toPubkey: Keypair.generate().publicKey,
    lamports: fixture.amountLamports + 1n
  }));
  assert.throws(() => verifyWalletFunding(sign(fixture.transaction, fixture.source), fixture.order), /approved amount/i);
});
