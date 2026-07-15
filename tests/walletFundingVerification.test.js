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
  Transaction,
  TransactionInstruction
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

const buildWalletFunding = Function(
  "Transaction",
  "ComputeBudgetProgram",
  "SystemProgram",
  `return (${extractedFunction("buildWalletFundingTransaction")});`
)(Transaction, ComputeBudgetProgram, SystemProgram);

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

function rawComputeBudgetInstruction(type, value = 0) {
  const data = Buffer.alloc(type === 3 ? 9 : 5);
  data.writeUInt8(type, 0);
  if (type === 3) data.writeBigUInt64LE(BigInt(value), 1);
  else data.writeUInt32LE(Number(value), 1);
  return new TransactionInstruction({
    programId: ComputeBudgetProgram.programId,
    keys: [],
    data
  });
}

function lighthouseInstruction(source, marker = 1) {
  return new TransactionInstruction({
    programId: new PublicKey("L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95"),
    keys: [{ pubkey: source.publicKey, isSigner: true, isWritable: true }],
    data: Buffer.from([marker])
  });
}

test("wallet funding orders predeclare safe fees so Phantom and Solflare can sign the same message", () => {
  const fixture = fundingFixture();
  const transaction = buildWalletFunding({
    sourcePublicKey: fixture.source.publicKey,
    destinationPublicKey: fixture.destination,
    amountLamports: fixture.amountLamports,
    blockhash: fixture.order.blockhash
  });
  assert.deepEqual(transaction.instructions.map((instruction) => (
    instruction.programId.equals(ComputeBudgetProgram.programId)
      ? ComputeBudgetInstruction.decodeInstructionType(instruction)
      : "Transfer"
  )), ["SetComputeUnitLimit", "SetComputeUnitPrice", "Transfer"]);
  assert.doesNotThrow(() => verifyWalletFunding(sign(transaction, fixture.source), fixture.order));
});

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
  const walletReturned = Transaction.from(sign(fixture.transaction, fixture.source).serialize());
  assert.doesNotThrow(() => verifyWalletFunding(walletReturned, fixture.order));
});

test("wallet funding accepts Phantom's capped legacy combined compute budget instruction", () => {
  const fixture = fundingFixture();
  fixture.transaction.add(
    ComputeBudgetProgram.requestUnits({ units: 200_000, additionalFee: 5_000 }),
    SystemProgram.transfer({
      fromPubkey: fixture.source.publicKey,
      toPubkey: fixture.destination,
      lamports: fixture.amountLamports
    })
  );
  assert.doesNotThrow(() => verifyWalletFunding(sign(fixture.transaction, fixture.source), fixture.order));
});

test("wallet funding accepts the current Solana loaded-account-data compute instruction", () => {
  const fixture = fundingFixture();
  fixture.transaction.add(
    rawComputeBudgetInstruction(4, 64 * 1024 * 1024),
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5_000 }),
    SystemProgram.transfer({
      fromPubkey: fixture.source.publicKey,
      toPubkey: fixture.destination,
      lamports: fixture.amountLamports
    })
  );
  const walletReturned = Transaction.from(sign(fixture.transaction, fixture.source).serialize());
  assert.doesNotThrow(() => verifyWalletFunding(walletReturned, fixture.order));
});

test("wallet funding accepts Phantom's appended Lighthouse guard", () => {
  const fixture = fundingFixture();
  fixture.transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5_000 }),
    SystemProgram.transfer({
      fromPubkey: fixture.source.publicKey,
      toPubkey: fixture.destination,
      lamports: fixture.amountLamports
    }),
    lighthouseInstruction(fixture.source)
  );
  const walletReturned = Transaction.from(sign(fixture.transaction, fixture.source).serialize());
  assert.doesNotThrow(() => verifyWalletFunding(walletReturned, fixture.order));
});

test("wallet funding accepts Solflare's bounded Lighthouse guards", () => {
  const fixture = fundingFixture();
  fixture.transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5_000 }),
    SystemProgram.transfer({
      fromPubkey: fixture.source.publicKey,
      toPubkey: fixture.destination,
      lamports: fixture.amountLamports
    }),
    lighthouseInstruction(fixture.source, 1),
    lighthouseInstruction(fixture.source, 2)
  );
  const walletReturned = Transaction.from(sign(fixture.transaction, fixture.source).serialize());
  assert.doesNotThrow(() => verifyWalletFunding(walletReturned, fixture.order));
});

test("wallet funding rejects Lighthouse guards before the exact transfer or above the wallet bound", () => {
  const before = fundingFixture();
  before.transaction.add(
    lighthouseInstruction(before.source),
    SystemProgram.transfer({
      fromPubkey: before.source.publicKey,
      toPubkey: before.destination,
      lamports: before.amountLamports
    })
  );
  assert.throws(
    () => verifyWalletFunding(sign(before.transaction, before.source), before.order),
    (error) => error?.code === "WALLET_FUNDING_LIGHTHOUSE_LAYOUT"
  );

  const tooMany = fundingFixture();
  tooMany.transaction.add(
    SystemProgram.transfer({
      fromPubkey: tooMany.source.publicKey,
      toPubkey: tooMany.destination,
      lamports: tooMany.amountLamports
    }),
    lighthouseInstruction(tooMany.source, 1),
    lighthouseInstruction(tooMany.source, 2),
    lighthouseInstruction(tooMany.source, 3),
    lighthouseInstruction(tooMany.source, 4)
  );
  assert.throws(
    () => verifyWalletFunding(sign(tooMany.transaction, tooMany.source), tooMany.order),
    (error) => error?.code === "WALLET_FUNDING_LIGHTHOUSE_LAYOUT"
  );
});

test("wallet funding still rejects an arbitrary appended program", () => {
  const fixture = fundingFixture();
  fixture.transaction.add(
    SystemProgram.transfer({
      fromPubkey: fixture.source.publicKey,
      toPubkey: fixture.destination,
      lamports: fixture.amountLamports
    }),
    new TransactionInstruction({
      programId: Keypair.generate().publicKey,
      keys: [],
      data: Buffer.from([1])
    })
  );
  assert.throws(
    () => verifyWalletFunding(sign(fixture.transaction, fixture.source), fixture.order),
    (error) => error?.code === "WALLET_FUNDING_PROGRAM"
  );
});

test("wallet funding rejects unknown compute layouts with a diagnostic code", () => {
  const fixture = fundingFixture();
  fixture.transaction.add(
    rawComputeBudgetInstruction(5, 1),
    SystemProgram.transfer({
      fromPubkey: fixture.source.publicKey,
      toPubkey: fixture.destination,
      lamports: fixture.amountLamports
    })
  );
  assert.throws(
    () => verifyWalletFunding(sign(fixture.transaction, fixture.source), fixture.order),
    (error) => error?.code === "WALLET_FUNDING_COMPUTE_LAYOUT" && /changed/i.test(error.message)
  );
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
