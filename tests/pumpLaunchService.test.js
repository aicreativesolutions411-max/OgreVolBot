import test from "node:test";
import assert from "node:assert/strict";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction
} from "@solana/web3.js";
import {
  decodePumpPortalTransaction,
  PUMP_LAUNCH_STATUS,
  pumpLaunchLogEntry,
  PumpLaunchService,
  selectPumpLaunchWallet
} from "../src/lib/pumpLaunchService.js";

function managedWallet(ownerId, keypair = Keypair.generate(), overrides = {}) {
  return {
    ownerId,
    label: overrides.label || "Dev Wallet",
    publicKey: keypair.publicKey.toBase58(),
    secret: overrides.secret === undefined
      ? { salt: "salt", iv: "iv", tag: "tag", data: "data" }
      : overrides.secret
  };
}

function launchInput(overrides = {}) {
  return {
    launchAttemptId: overrides.launchAttemptId || "attempt-1",
    userId: overrides.userId || "user-7",
    wallet: overrides.wallet,
    walletKeypair: overrides.walletKeypair,
    basePayload: {
      name: "Ogre Test",
      symbol: "OGT",
      devBuy: {
        amountSol: 0.1
      },
      slippageBps: 300,
      clientRequestId: overrides.launchAttemptId || "attempt-1"
    },
    body: {
      devWalletIndex: "1"
    },
    config: {
      apiUrl: "https://pumpportal.fun/api/trade-local",
      priorityFeeSol: 0.00005,
      requiredBufferSol: 0.01,
      timeoutMs: 30000
    }
  };
}

function fakeSignedTransaction() {
  return {
    signerPublicKeys: [],
    sign(signers) {
      this.signerPublicKeys = signers.map((signer) => signer.publicKey.toBase58());
    }
  };
}

function serviceHarness(overrides = {}) {
  const attempts = new Map();
  const tradeEvents = [];
  const logs = [];
  const tx = overrides.tx || fakeSignedTransaction();
  let requestBody = null;
  const service = new PumpLaunchService({
    getBalanceLamports: overrides.getBalanceLamports || (async () => 1 * LAMPORTS_PER_SOL),
    uploadMetadata: overrides.uploadMetadata || (async () => ({
      uri: "https://ipfs.io/ipfs/test-meta",
      imageUri: "https://ipfs.io/ipfs/test-image",
      imageBytes: 100
    })),
    requestLocalTransaction: overrides.requestLocalTransaction || (async (body) => {
      requestBody = body;
      return tx;
    }),
    sendTransaction: overrides.sendTransaction || (async () => "txsig-123"),
    generateMintKeypair: overrides.generateMintKeypair || (() => Keypair.generate()),
    encryptMintSecret: overrides.encryptMintSecret || (() => ({ encrypted: true })),
    saveAttempt: async (update) => {
      const id = update.id || update.launchAttemptId;
      attempts.set(id, {
        ...(attempts.get(id) || {}),
        ...update,
        id,
        launchAttemptId: id
      });
    },
    recordTradeEvent: async (event) => {
      tradeEvents.push(event);
    },
    log: (event, fields) => logs.push({ event, fields })
  });
  return {
    service,
    attempts,
    tradeEvents,
    logs,
    tx,
    requestBody: () => requestBody
  };
}

test("missing selectedDevWalletId returns a clear error", () => {
  assert.throws(
    () => selectPumpLaunchWallet({ wallets: [] }, "user-7", ""),
    /Choose a managed SlimeWire dev wallet/
  );
});

test("user cannot launch with a wallet they do not own", () => {
  const otherWallet = managedWallet("other-user");
  assert.throws(
    () => selectPumpLaunchWallet({ wallets: [otherWallet] }, "user-7", otherWallet.publicKey),
    /Not Authorized/
  );
});

test("browser-only or non-signable wallet is rejected", () => {
  const wallet = managedWallet("user-7", Keypair.generate(), { secret: null });
  assert.throws(
    () => selectPumpLaunchWallet({ wallets: [wallet] }, "user-7", "1"),
    /not a managed SlimeWire\/server-signable wallet/
  );
});

test("managed wallet with too little SOL fails before metadata or PumpPortal", async () => {
  const keypair = Keypair.generate();
  const wallet = managedWallet("user-7", keypair);
  const harness = serviceHarness({
    getBalanceLamports: async () => 0.05 * LAMPORTS_PER_SOL,
    uploadMetadata: async () => {
      throw new Error("should not upload");
    }
  });

  await assert.rejects(
    () => harness.service.launch(launchInput({ wallet, walletKeypair: keypair })),
    /needs at least/
  );
  assert.equal(harness.requestBody(), null);
  assert.equal(harness.attempts.get("attempt-1").status, PUMP_LAUNCH_STATUS.FAILED);
  assert.equal(harness.attempts.get("attempt-1").errorCode, "DEV_WALLET_INSUFFICIENT_SOL");
});

test("managed funded wallet builds the correct PumpPortal Local create body", async () => {
  const keypair = Keypair.generate();
  const wallet = managedWallet("user-7", keypair);
  const mintKeypair = Keypair.generate();
  const harness = serviceHarness({
    generateMintKeypair: () => mintKeypair
  });

  await harness.service.launch(launchInput({ wallet, walletKeypair: keypair }));

  assert.deepEqual(harness.requestBody(), {
    publicKey: keypair.publicKey.toBase58(),
    action: "create",
    tokenMetadata: {
      name: "Ogre Test",
      symbol: "OGT",
      uri: "https://ipfs.io/ipfs/test-meta"
    },
    mint: mintKeypair.publicKey.toBase58(),
    denominatedInSol: "true",
    amount: 0.1,
    slippage: 3,
    priorityFee: 0.00005,
    pool: "pump"
  });
});

test("Local API transaction is signed by mint keypair and dev wallet keypair", async () => {
  const keypair = Keypair.generate();
  const mintKeypair = Keypair.generate();
  const wallet = managedWallet("user-7", keypair);
  const harness = serviceHarness({
    generateMintKeypair: () => mintKeypair
  });

  await harness.service.launch(launchInput({ wallet, walletKeypair: keypair }));

  assert.deepEqual(harness.tx.signerPublicKeys, [
    mintKeypair.publicKey.toBase58(),
    keypair.publicKey.toBase58()
  ]);
});

test("serialized PumpPortal transaction response can be deserialized", () => {
  const keypair = Keypair.generate();
  const message = new TransactionMessage({
    payerKey: keypair.publicKey,
    recentBlockhash: "11111111111111111111111111111111",
    instructions: [
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: Keypair.generate().publicKey,
        lamports: 1
      })
    ]
  }).compileToV0Message();
  const tx = new VersionedTransaction(message);
  const decoded = decodePumpPortalTransaction(Buffer.from(tx.serialize()));

  assert.ok(decoded);
  assert.equal(decoded.message.staticAccountKeys[0].toBase58(), keypair.publicKey.toBase58());
});

test("PumpPortal non-200 failure is recorded with status and body", async () => {
  const keypair = Keypair.generate();
  const wallet = managedWallet("user-7", keypair);
  const harness = serviceHarness({
    requestLocalTransaction: async () => {
      const error = new Error("Not Authorized");
      error.status = 401;
      error.responseBody = "Not Authorized";
      throw error;
    }
  });

  await assert.rejects(
    () => harness.service.launch(launchInput({ wallet, walletKeypair: keypair })),
    /Not Authorized/
  );

  const attempt = harness.attempts.get("attempt-1");
  assert.equal(attempt.status, PUMP_LAUNCH_STATUS.FAILED);
  assert.equal(attempt.stage, "pumpportal_local");
  assert.equal(attempt.providerStatus, 401);
  assert.equal(attempt.providerResponseBody, "Not Authorized");
});

test("successful launch stores token record fields and transaction signature", async () => {
  const keypair = Keypair.generate();
  const mintKeypair = Keypair.generate();
  const wallet = managedWallet("user-7", keypair);
  const harness = serviceHarness({
    generateMintKeypair: () => mintKeypair,
    sendTransaction: async () => "txsig-success"
  });

  const result = await harness.service.launch(launchInput({ wallet, walletKeypair: keypair }));

  assert.equal(result.status, PUMP_LAUNCH_STATUS.LAUNCHED);
  assert.equal(result.tokenMint, mintKeypair.publicKey.toBase58());
  assert.equal(result.signature, "txsig-success");
  assert.equal(harness.tradeEvents.length, 1);
  assert.equal(harness.tradeEvents[0].source, "pumpfun_launch");
  assert.equal(harness.tradeEvents[0].tokenMint, mintKeypair.publicKey.toBase58());
  assert.equal(harness.tradeEvents[0].signature, "txsig-success");
  assert.equal(harness.attempts.get("attempt-1").txSignature, "txsig-success");
});

test("retry with the same launchAttemptId updates one attempt record instead of duplicating", async () => {
  const keypair = Keypair.generate();
  const wallet = managedWallet("user-7", keypair);
  let shouldFail = true;
  const harness = serviceHarness({
    requestLocalTransaction: async () => {
      if (shouldFail) {
        shouldFail = false;
        const error = new Error("temporary provider failure");
        error.status = 500;
        error.responseBody = "temporary provider failure";
        throw error;
      }
      return fakeSignedTransaction();
    }
  });

  await assert.rejects(
    () => harness.service.launch(launchInput({ wallet, walletKeypair: keypair, launchAttemptId: "retry-1" })),
    /temporary provider failure/
  );
  await harness.service.launch(launchInput({ wallet, walletKeypair: keypair, launchAttemptId: "retry-1" }));

  assert.equal(harness.attempts.size, 1);
  assert.equal(harness.attempts.get("retry-1").status, PUMP_LAUNCH_STATUS.LAUNCHED);
});

test("launch logs redact private and encrypted secret fields", () => {
  const entry = pumpLaunchLogEntry("pump_launch_wallet_validated", {
    secret: "raw",
    privateKey: "raw",
    secretKey: "raw",
    encryptedMintSecret: { data: "ciphertext" },
    providerResponseBody: "Authorization: Bearer abc123"
  });

  assert.equal(entry.secret, undefined);
  assert.equal(entry.privateKey, undefined);
  assert.equal(entry.secretKey, undefined);
  assert.equal(entry.encryptedMintSecret, undefined);
  assert.match(entry.providerResponseBody, /Bearer \[redacted\]/);
});
