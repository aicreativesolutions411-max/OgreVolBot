import assert from "node:assert/strict";
import test from "node:test";

import {
  createPumpHolderVaultRecoveryArtifact,
  verifyPumpHolderVaultRecoveryArtifact
} from "../src/lib/pumpHolderVaultRecovery.js";

const APP_SECRET = "test-only-app-secret";
const PUBLIC_KEY = "6mmjYWVDnaTA6MJcMo9m6Ww7GBaMVTx4MuKUokW7LnJq";
const TOKEN_MINT = "9kCV7fTAoRUAEPHfHpGEhjNjfdr6MWz3ExzZngHwpump";

function encryptedSecret() {
  return {
    version: 1,
    salt: Buffer.alloc(16, 1).toString("base64"),
    iv: Buffer.alloc(12, 2).toString("base64"),
    tag: Buffer.alloc(16, 3).toString("base64"),
    data: Buffer.alloc(64, 4).toString("base64")
  };
}

function artifact() {
  return createPumpHolderVaultRecoveryArtifact({
    appSecret: APP_SECRET,
    updatedAt: "2026-07-25T12:00:00.000Z",
    vaults: [{
      ownerId: "__pump_holder_reward_vaults__",
      label: "pump-holder:ignored",
      publicKey: PUBLIC_KEY,
      tokenMint: TOKEN_MINT,
      launchAttemptId: "pump-launch-1",
      userId: "12345",
      createdAt: "2026-07-25T11:59:00.000Z",
      secret: {
        ...encryptedSecret(),
        plaintext: "must-not-survive"
      },
      secretKey: "plaintext-private-key-must-not-survive",
      privateKey: "another-plaintext-key-must-not-survive"
    }]
  });
}

test("holder-vault recovery artifact keeps only encrypted secret fields and public metadata", () => {
  const recovery = artifact();
  const json = JSON.stringify(recovery);

  assert.deepEqual(Object.keys(recovery.vaults[0]), [
    "publicKey", "tokenMint", "launchAttemptId", "userId", "createdAt", "secret"
  ]);
  assert.deepEqual(Object.keys(recovery.vaults[0].secret), ["version", "salt", "iv", "tag", "data"]);
  assert.doesNotMatch(json, /plaintext-private-key|another-plaintext-key|must-not-survive/);
  assert.doesNotMatch(json, /secretKey|privateKey|ownerId|label/);

  assert.deepEqual(verifyPumpHolderVaultRecoveryArtifact(recovery, APP_SECRET), {
    version: 1,
    updatedAt: "2026-07-25T12:00:00.000Z",
    vaults: [{
      publicKey: PUBLIC_KEY,
      tokenMint: TOKEN_MINT,
      launchAttemptId: "pump-launch-1",
      userId: "12345",
      createdAt: "2026-07-25T11:59:00.000Z",
      secret: encryptedSecret()
    }]
  });
});

test("holder-vault recovery artifact rejects metadata and encrypted-secret tampering", () => {
  const metadataTamper = structuredClone(artifact());
  metadataTamper.vaults[0].tokenMint = PUBLIC_KEY;
  assert.throws(
    () => verifyPumpHolderVaultRecoveryArtifact(metadataTamper, APP_SECRET),
    /failed its integrity check/
  );

  const ciphertextTamper = structuredClone(artifact());
  const tamperedCiphertext = Buffer.from(ciphertextTamper.vaults[0].secret.data, "base64");
  tamperedCiphertext[0] ^= 0xff;
  ciphertextTamper.vaults[0].secret.data = tamperedCiphertext.toString("base64");
  assert.throws(
    () => verifyPumpHolderVaultRecoveryArtifact(ciphertextTamper, APP_SECRET),
    /failed its integrity check/
  );
});

test("holder-vault recovery artifact rejects the wrong app secret and unexpected plaintext fields", () => {
  const recovery = artifact();
  assert.throws(
    () => verifyPumpHolderVaultRecoveryArtifact(recovery, "wrong-app-secret"),
    /failed its integrity check/
  );

  const injected = structuredClone(recovery);
  injected.vaults[0].privateKey = "plaintext-even-with-an-otherwise-valid-hmac";
  assert.throws(
    () => verifyPumpHolderVaultRecoveryArtifact(injected, APP_SECRET),
    /unsupported field privateKey/
  );
});

test("holder-vault recovery artifact requires an already-encrypted secret envelope", () => {
  assert.throws(() => createPumpHolderVaultRecoveryArtifact({
    appSecret: APP_SECRET,
    vaults: [{ publicKey: PUBLIC_KEY, secret: "raw-private-key" }]
  }), /Encrypted vault secret must be an object/);

  assert.throws(() => createPumpHolderVaultRecoveryArtifact({
    appSecret: APP_SECRET,
    vaults: [{
      publicKey: PUBLIC_KEY,
      secret: { ...encryptedSecret(), data: "raw-private-key" }
    }]
  }), /canonical base64 ciphertext data/);
});
