import test from "node:test";
import assert from "node:assert/strict";
import bs58 from "bs58";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction
} from "@solana/web3.js";
import {
  buildPumpPortalLocalCreateRequest,
  decodePumpPortalTransaction,
  formatPumpLaunchUserError,
  looksLikeSecretKey,
  normalizePumpPortalCreatePayload,
  PUMP_LAUNCH_STATUS,
  PUMP_LAUNCH_STAGE,
  pumpLaunchLogEntry,
  pumpPortalCreateDebugSummary,
  PumpLaunchService,
  selectPumpLaunchWallet,
  validatePumpPortalCreatePayload,
  validatePumpPortalLocalApiUrl
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
    validateMetadataUri: overrides.validateMetadataUri || (async () => ({ ok: true })),
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
    recordTradeEvent: overrides.recordTradeEvent || (async (event) => {
      tradeEvents.push(event);
    }),
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

test("wrong or missing PumpPortal Local API URL fails with a config error", async () => {
  assert.throws(
    () => validatePumpPortalLocalApiUrl("https://pumpportal.fun/api/trade"),
    /must be exactly/
  );

  const keypair = Keypair.generate();
  const wallet = managedWallet("user-7", keypair);
  const harness = serviceHarness({
    uploadMetadata: async () => {
      throw new Error("should not upload metadata with bad config");
    }
  });

  await assert.rejects(
    () => harness.service.launch({
      ...launchInput({ wallet, walletKeypair: keypair }),
      config: {
        ...launchInput().config,
        apiUrl: ""
      }
    }),
    /PUMP_LAUNCH_API_URL/
  );

  const attempt = harness.attempts.get("attempt-1");
  assert.equal(attempt.status, PUMP_LAUNCH_STATUS.FAILED);
  assert.equal(attempt.stage, PUMP_LAUNCH_STAGE.CONFIG);
  assert.equal(attempt.errorCode, "PUMP_LAUNCH_API_URL_INVALID");
  assert.equal(harness.requestBody(), null);
});

test("correct PumpPortal create payload exactly matches official local shape", () => {
  const dev = Keypair.generate();
  const mint = Keypair.generate();
  const payload = buildPumpPortalLocalCreateRequest({
    creatorPublicKey: dev.publicKey.toBase58(),
    mintPublicKey: mint.publicKey.toBase58(),
    name: "Ogre Test",
    symbol: "og t",
    metadataUri: "https://ogrevolbot.onrender.com/pump/metadata/abc123abc123abc123abc123abc123ab/metadata.json",
    devBuySol: "0.0001",
    slippageBps: undefined,
    priorityFeeSol: undefined,
    pool: undefined
  });

  assert.deepEqual(Object.keys(payload).sort(), [
    "action",
    "amount",
    "denominatedInSol",
    "mint",
    "pool",
    "priorityFee",
    "publicKey",
    "slippage",
    "tokenMetadata"
  ].sort());
  assert.deepEqual(Object.keys(payload.tokenMetadata).sort(), ["name", "symbol", "uri"]);
  assert.deepEqual(payload, {
    publicKey: dev.publicKey.toBase58(),
    action: "create",
    tokenMetadata: {
      name: "Ogre Test",
      symbol: "OGT",
      uri: "https://ogrevolbot.onrender.com/pump/metadata/abc123abc123abc123abc123abc123ab/metadata.json"
    },
    mint: mint.publicKey.toBase58(),
    denominatedInSol: "true",
    amount: 0,
    slippage: 10,
    priorityFee: 0.00001,
    pool: "pump"
  });
});

test("PumpPortal create payload is object, not array", () => {
  assert.throws(
    () => validatePumpPortalCreatePayload([]),
    (error) => error.code === "PUMPPORTAL_CREATE_BODY_INVALID"
  );
});

test("invalid publicKey is rejected locally", () => {
  const mint = Keypair.generate();
  assert.throws(
    () => normalizePumpPortalCreatePayload({
      publicKey: "not-a-key",
      mint: mint.publicKey.toBase58(),
      tokenMetadata: { name: "Ogre Test", symbol: "OGT", uri: "https://example.com/metadata.json" }
    }),
    (error) => error.code === "PUMPPORTAL_CREATE_PUBLIC_KEY_INVALID"
  );
});

test("invalid mint and mint secret key are rejected locally", () => {
  const dev = Keypair.generate();
  assert.throws(
    () => normalizePumpPortalCreatePayload({
      publicKey: dev.publicKey.toBase58(),
      mint: "not-a-mint",
      tokenMetadata: { name: "Ogre Test", symbol: "OGT", uri: "https://example.com/metadata.json" }
    }),
    (error) => error.code === "PUMPPORTAL_CREATE_MINT_INVALID"
  );
  assert.equal(looksLikeSecretKey(bs58.encode(dev.secretKey)), true);
  assert.throws(
    () => normalizePumpPortalCreatePayload({
      publicKey: dev.publicKey.toBase58(),
      mint: bs58.encode(dev.secretKey),
      tokenMetadata: { name: "Ogre Test", symbol: "OGT", uri: "https://example.com/metadata.json" }
    }),
    (error) => error.code === "PUMPPORTAL_CREATE_SECRET_KEY_REJECTED"
  );
});

test("missing or image metadata uri is rejected locally", () => {
  const dev = Keypair.generate();
  const mint = Keypair.generate();
  assert.throws(
    () => normalizePumpPortalCreatePayload({
      publicKey: dev.publicKey.toBase58(),
      mint: mint.publicKey.toBase58(),
      tokenMetadata: { name: "Ogre Test", symbol: "OGT", uri: "" }
    }),
    (error) => error.code === "MISSING_METADATA_URI"
  );
  assert.throws(
    () => normalizePumpPortalCreatePayload({
      publicKey: dev.publicKey.toBase58(),
      mint: mint.publicKey.toBase58(),
      tokenMetadata: { name: "Ogre Test", symbol: "OGT", uri: "https://example.com/image.png" }
    }),
    (error) => error.code === "PUMPPORTAL_CREATE_METADATA_URI_IMAGE"
  );
});

test("empty or too-long token name is rejected locally", () => {
  const dev = Keypair.generate();
  const mint = Keypair.generate();
  assert.throws(
    () => normalizePumpPortalCreatePayload({
      publicKey: dev.publicKey.toBase58(),
      mint: mint.publicKey.toBase58(),
      tokenMetadata: { name: "", symbol: "OGT", uri: "https://example.com/metadata.json" }
    }),
    (error) => error.code === "PUMPPORTAL_CREATE_NAME_INVALID"
  );
  assert.throws(
    () => normalizePumpPortalCreatePayload({
      publicKey: dev.publicKey.toBase58(),
      mint: mint.publicKey.toBase58(),
      tokenMetadata: { name: "x".repeat(33), symbol: "OGT", uri: "https://example.com/metadata.json" }
    }),
    (error) => error.code === "PUMPPORTAL_CREATE_NAME_INVALID"
  );
});

test("symbol is normalized safely and invalid symbol is rejected locally", () => {
  const dev = Keypair.generate();
  const mint = Keypair.generate();
  const payload = normalizePumpPortalCreatePayload({
    publicKey: dev.publicKey.toBase58(),
    mint: mint.publicKey.toBase58(),
    tokenMetadata: { name: "Ogre Test", symbol: "$og t", uri: "https://example.com/metadata.json" }
  });
  assert.equal(payload.tokenMetadata.symbol, "OGT");
  assert.throws(
    () => normalizePumpPortalCreatePayload({
      publicKey: dev.publicKey.toBase58(),
      mint: mint.publicKey.toBase58(),
      tokenMetadata: { name: "Ogre Test", symbol: "!", uri: "https://example.com/metadata.json" }
    }),
    (error) => error.code === "PUMPPORTAL_CREATE_SYMBOL_INVALID"
  );
});

test("denominatedInSol and numeric fields normalize to PumpPortal-safe types", () => {
  const dev = Keypair.generate();
  const mint = Keypair.generate();
  const payload = normalizePumpPortalCreatePayload({
    publicKey: dev.publicKey.toBase58(),
    mint: mint.publicKey.toBase58(),
    tokenMetadata: { name: "Ogre Test", symbol: "OGT", uri: "https://example.com/metadata.json" },
    denominatedInSol: true,
    amount: "bad",
    slippage: "bad",
    priorityFee: "bad",
    pool: ""
  });
  assert.equal(payload.denominatedInSol, "true");
  assert.equal(typeof payload.amount, "number");
  assert.equal(payload.amount, 0);
  assert.equal(payload.slippage, 10);
  assert.equal(payload.priorityFee, 0.00001);
  assert.equal(payload.pool, "pump");
});

test("PumpPortal create debug summary reports body diagnostics", () => {
  const dev = Keypair.generate();
  const mint = Keypair.generate();
  const payload = normalizePumpPortalCreatePayload({
    publicKey: dev.publicKey.toBase58(),
    mint: mint.publicKey.toBase58(),
    tokenMetadata: { name: "Ogre Test", symbol: "OGT", uri: "https://example.com/metadata.json" }
  });
  const summary = pumpPortalCreateDebugSummary(payload);
  assert.equal(summary.bodyIsArray, false);
  assert.equal(summary.publicKeyValid, true);
  assert.equal(summary.mintValid, true);
  assert.equal(summary.mintLooksLikeSecret, false);
  assert.equal(summary.denominatedInSolType, "string");
  assert.equal(summary.amountType, "number");
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
    amount: 0,
    slippage: 3,
    priorityFee: 0.00005,
    pool: "pump"
  });
  assert.equal(harness.attempts.get("attempt-1").requestedDevBuySol, 0.1);
  assert.equal(harness.attempts.get("attempt-1").createAmountSol, 0);
});

test("validated fast metadata URI is the URI sent to PumpPortal", async () => {
  const keypair = Keypair.generate();
  const wallet = managedWallet("user-7", keypair);
  const mintKeypair = Keypair.generate();
  const harness = serviceHarness({
    generateMintKeypair: () => mintKeypair,
    uploadMetadata: async () => ({
      uri: "https://ipfs.io/ipfs/test-meta",
      imageUri: "https://ipfs.io/ipfs/test-image",
      imageBytes: 100
    }),
    validateMetadataUri: async () => ({
      ok: true,
      uri: "https://gateway.pinata.cloud/ipfs/test-meta"
    })
  });

  await harness.service.launch(launchInput({ wallet, walletKeypair: keypair }));

  assert.equal(harness.requestBody().tokenMetadata.uri, "https://gateway.pinata.cloud/ipfs/test-meta");
  assert.equal(harness.attempts.get("attempt-1").metadataUri, "https://gateway.pinata.cloud/ipfs/test-meta");
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

test("metadata upload failure records a specific metadata error", async () => {
  const keypair = Keypair.generate();
  const wallet = managedWallet("user-7", keypair);
  const harness = serviceHarness({
    uploadMetadata: async () => {
      const error = new Error("Pinata token expired");
      error.code = "PUMP_METADATA_AUTH_FAILED";
      error.statusCode = 502;
      error.providerStatus = 401;
      error.responseBody = "Not Authorized";
      throw error;
    }
  });

  await assert.rejects(
    () => harness.service.launch(launchInput({ wallet, walletKeypair: keypair })),
    /Pinata token expired/
  );

  const attempt = harness.attempts.get("attempt-1");
  assert.equal(attempt.status, PUMP_LAUNCH_STATUS.FAILED_METADATA_AUTH);
  assert.equal(attempt.stage, PUMP_LAUNCH_STAGE.METADATA_UPLOAD);
  assert.equal(attempt.errorCode, "PUMP_METADATA_AUTH_FAILED");
  assert.equal(attempt.providerStatus, 401);
  assert.match(attempt.failureReason, /Metadata upload provider rejected authorization/);
  assert.match(attempt.failureReason, /launchAttemptId=attempt-1/);
  assert.doesNotMatch(attempt.failureReason, /PUMP_LAUNCH_PINATA_JWT/);
  assert.equal(harness.requestBody(), null);
});

test("metadata public fetch timeout records a specific timeout status and avoids PumpPortal", async () => {
  const keypair = Keypair.generate();
  const wallet = managedWallet("user-7", keypair);
  const harness = serviceHarness({
    validateMetadataUri: async () => {
      const error = new Error("Token metadata URI is not publicly fetchable: The operation was aborted due to timeout");
      error.code = "PUMPPORTAL_CREATE_METADATA_URI_TIMEOUT";
      error.statusCode = 400;
      throw error;
    }
  });

  await assert.rejects(
    () => harness.service.launch(launchInput({ wallet, walletKeypair: keypair })),
    /timeout/
  );

  const attempt = harness.attempts.get("attempt-1");
  assert.equal(attempt.status, PUMP_LAUNCH_STATUS.FAILED_METADATA_FETCH_TIMEOUT);
  assert.equal(attempt.stage, PUMP_LAUNCH_STAGE.METADATA_UPLOAD);
  assert.equal(attempt.errorCode, "PUMPPORTAL_CREATE_METADATA_URI_TIMEOUT");
  assert.equal(harness.requestBody(), null);
});

test("Local transaction signing failure records a signing error", async () => {
  const keypair = Keypair.generate();
  const wallet = managedWallet("user-7", keypair);
  const harness = serviceHarness({
    tx: {
      sign() {
        throw new Error("missing mint signer");
      }
    }
  });

  await assert.rejects(
    () => harness.service.launch(launchInput({ wallet, walletKeypair: keypair })),
    /missing mint signer/
  );

  const attempt = harness.attempts.get("attempt-1");
  assert.equal(attempt.status, PUMP_LAUNCH_STATUS.FAILED);
  assert.equal(attempt.stage, PUMP_LAUNCH_STAGE.SIGNING);
  assert.equal(attempt.errorCode, "PUMP_LAUNCH_SIGNING_FAILED");
  assert.match(attempt.failureReason, /could not sign/);
});

test("RPC send failure records a send error and keeps scanning details", async () => {
  const keypair = Keypair.generate();
  const wallet = managedWallet("user-7", keypair);
  const harness = serviceHarness({
    sendTransaction: async () => {
      throw new Error("simulation failed: custom program error");
    }
  });

  await assert.rejects(
    () => harness.service.launch(launchInput({ wallet, walletKeypair: keypair })),
    /simulation failed/
  );

  const attempt = harness.attempts.get("attempt-1");
  assert.equal(attempt.status, PUMP_LAUNCH_STATUS.FAILED);
  assert.equal(attempt.stage, PUMP_LAUNCH_STAGE.SEND_TRANSACTION);
  assert.equal(attempt.errorCode, "PUMP_LAUNCH_SEND_FAILED");
  assert.match(attempt.failureReason, /failed to send or confirm/);
});

test("successful chain send but failed SlimeWire token save returns a recoverable support message", async () => {
  const keypair = Keypair.generate();
  const wallet = managedWallet("user-7", keypair);
  const harness = serviceHarness({
    sendTransaction: async () => "txsig-chain-success",
    recordTradeEvent: async () => {
      throw new Error("trade-history write failed");
    }
  });

  let capturedError = null;
  await assert.rejects(
    async () => {
      try {
        await harness.service.launch(launchInput({ wallet, walletKeypair: keypair }));
      } catch (error) {
        capturedError = error;
        throw error;
      }
    },
    /trade-history write failed/
  );

  const attempt = harness.attempts.get("attempt-1");
  assert.equal(attempt.status, PUMP_LAUNCH_STATUS.FAILED);
  assert.equal(attempt.stage, PUMP_LAUNCH_STAGE.STORE_RESULT);
  assert.equal(attempt.errorCode, "PUMP_LAUNCH_TOKEN_REGISTRATION_FAILED");
  assert.equal(attempt.txSignature, "txsig-chain-success");
  assert.match(attempt.failureReason, /Token launched on-chain but failed to save in SlimeWire/);
  assert.match(formatPumpLaunchUserError(capturedError), /txSignature=txsig-chain-success/);
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
  assert.equal(harness.tradeEvents[0].type, "launch");
  assert.equal(harness.tradeEvents[0].tokenMint, mintKeypair.publicKey.toBase58());
  assert.equal(harness.tradeEvents[0].signature, "txsig-success");
  assert.equal(harness.tradeEvents[0].solLamportsSpent, "0");
  assert.equal(harness.tradeEvents[0].requestedDevBuySol, 0.1);
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
