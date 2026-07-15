import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

function extractedFunction(name) {
  const functionStart = serverSource.indexOf(`function ${name}(`);
  assert.ok(functionStart >= 0, `${name} must exist`);
  const start = serverSource.slice(Math.max(0, functionStart - 6), functionStart) === "async "
    ? functionStart - 6
    : functionStart;
  const open = serverSource.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < serverSource.length; index += 1) {
    if (serverSource[index] === "{") depth += 1;
    if (serverSource[index] === "}") depth -= 1;
    if (depth === 0) return serverSource.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

const cashTransactionInstructions = Function(
  `return (${extractedFunction("cashTransactionInstructions")});`
)();
const cashRequestPaidByTransaction = Function(
  "cashTransactionInstructions",
  `return (${extractedFunction("cashRequestPaidByTransaction")});`
)(cashTransactionInstructions);

function cashWalletSelector(store) {
  return Function(
    "readWalletStore",
    "walletsForOwner",
    `return (${extractedFunction("cashPrimaryWallet")});`
  )(
    async () => store,
    (walletStore, userId) => walletStore.wallets.filter((wallet) => String(wallet.ownerId) === String(userId))
  );
}

function parsedFundingTransaction({ reference, destination, lamports, error = null }) {
  return {
    meta: { err: error, innerInstructions: [] },
    transaction: {
      message: {
        accountKeys: ["source-wallet", destination, reference],
        instructions: [{
          parsed: {
            type: "transfer",
            info: { source: "source-wallet", destination, lamports }
          },
          program: "system"
        }]
      }
    }
  };
}

test("mobile wallet funding confirms only the referenced exact SOL transfer", () => {
  const row = {
    reference: "reference-key",
    recipientAddress: "managed-wallet",
    asset: "SOL",
    rawAmount: "250000000"
  };
  assert.equal(cashRequestPaidByTransaction(row, parsedFundingTransaction({
    reference: row.reference,
    destination: row.recipientAddress,
    lamports: 250000000
  })), true);
  assert.equal(cashRequestPaidByTransaction(row, parsedFundingTransaction({
    reference: "different-reference",
    destination: row.recipientAddress,
    lamports: 250000000
  })), false);
  assert.equal(cashRequestPaidByTransaction(row, parsedFundingTransaction({
    reference: row.reference,
    destination: "different-wallet",
    lamports: 250000000
  })), false);
  assert.equal(cashRequestPaidByTransaction(row, parsedFundingTransaction({
    reference: row.reference,
    destination: row.recipientAddress,
    lamports: 249999999
  })), false);
  assert.equal(cashRequestPaidByTransaction(row, parsedFundingTransaction({
    reference: row.reference,
    destination: row.recipientAddress,
    lamports: 250000000,
    error: { InstructionError: [0, "Custom"] }
  })), false);
  const wrongProgram = parsedFundingTransaction({
    reference: row.reference,
    destination: row.recipientAddress,
    lamports: 250000000
  });
  wrongProgram.transaction.message.instructions[0].program = "spl-token";
  assert.equal(cashRequestPaidByTransaction(row, wrongProgram), false);
});

test("wallet funding resolves the requested one-based managed wallet", async () => {
  const store = {
    wallets: [
      { ownerId: "user-1", publicKey: "volume", volumeBot: true },
      { ownerId: "user-1", publicKey: "wallet-2" },
      { ownerId: "other", publicKey: "other-wallet" },
      { ownerId: "user-1", publicKey: "wallet-3" }
    ]
  };
  const selectWallet = cashWalletSelector(store);
  assert.equal((await selectWallet("user-1")).publicKey, "wallet-2");
  assert.equal((await selectWallet("user-1")).index, 2);
  assert.equal((await selectWallet("user-1", 3)).publicKey, "wallet-3");
  assert.equal((await selectWallet("user-1", 3)).index, 3);
  assert.equal(await selectWallet("user-1", 1), null, "filtered wallets must not silently fall back");
  assert.equal(await selectWallet("user-1", 99), null, "missing wallets must not silently fall back");
});

test("mobile funding status is authenticated, bounded, deduplicated, and receipt-backed", () => {
  assert.match(serverSource, /pathname === "\/api\/web\/wallet-funding\/status"/);
  assert.match(serverSource, /verifySolanaPayWalletFunding\(auth\.userId, body\)/);
  assert.match(serverSource, /wallet-funding-status:\$\{auth\.userId\}/);
  assert.match(serverSource, /getSignaturesForAddress\(referenceKey, \{ limit: 12 \}\)/);
  assert.match(serverSource, /walletFundingReferenceSignatures\(new PublicKey\(reference\)\)/);
  assert.match(serverSource, /walletFundingParsedTransaction\(item\.signature\)/);
  assert.match(serverSource, /wallet funding primary reference signatures/);
  assert.match(serverSource, /wallet funding primary reference transaction/);
  assert.match(serverSource, /15_000,\s*\(\) => verifySolanaPayWalletFunding/);
  assert.match(serverSource, /walletIndexKey.*amountKey.*referenceKey/s);
  assert.match(serverSource, /rawAmount < minimum \|\| rawAmount > maximum/);
  assert.match(serverSource, /store\.walletFundingReceipts\[reference\] = receipt/);
  assert.match(serverSource, /if \(!store\.signatureIndex\[item\.signature\]\)/);
});
