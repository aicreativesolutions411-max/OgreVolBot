import test from "node:test";
import assert from "node:assert/strict";
import { PumpSdk, PUMP_PROGRAM_ID } from "@pump-fun/pump-sdk";
import { Keypair, TransactionMessage } from "@solana/web3.js";
import { buildPumpCashbackCreateTransaction, normalizePumpCashback } from "../src/lib/pumpCashback.js";

test("native Pump Cash back builder emits the official create_v2 cashback instruction", async () => {
  const mint = Keypair.generate();
  const creator = Keypair.generate();
  const args = {
    mint: mint.publicKey,
    creator: creator.publicKey,
    name: "Cash Back Test",
    symbol: "CBT",
    uri: "https://example.com/cashback.json",
    recentBlockhash: Keypair.generate().publicKey.toBase58(),
    priorityFeeSol: 0.00005
  };
  const tx = await buildPumpCashbackCreateTransaction(args);
  const instructions = TransactionMessage.decompile(tx.message).instructions;
  const actualCreate = instructions.find((instruction) => instruction.programId.equals(PUMP_PROGRAM_ID));
  assert.ok(actualCreate, "official Pump create_v2 instruction should be present");

  const sdk = new PumpSdk();
  const shared = {
    mint: mint.publicKey,
    name: args.name,
    symbol: args.symbol,
    uri: args.uri,
    creator: creator.publicKey,
    user: creator.publicKey,
    mayhemMode: false
  };
  const expectedCashback = await sdk.createV2Instruction({ ...shared, cashback: true });
  const ordinaryCreate = await sdk.createV2Instruction({ ...shared, cashback: false });
  assert.deepEqual(actualCreate.data, expectedCashback.data);
  assert.notDeepEqual(actualCreate.data, ordinaryCreate.data);
  assert.equal(actualCreate.keys.find((key) => key.pubkey.equals(mint.publicKey))?.isSigner, true);
  assert.equal(actualCreate.keys.find((key) => key.pubkey.equals(creator.publicKey))?.isSigner, true);

  tx.sign([mint, creator]);
  assert.ok(tx.serialize().length > 0);
});

test("Pump Cash back boolean normalization is explicit", () => {
  assert.equal(normalizePumpCashback(true), true);
  assert.equal(normalizePumpCashback("yes"), true);
  assert.equal(normalizePumpCashback("false"), false);
  assert.equal(normalizePumpCashback(undefined), false);
});
