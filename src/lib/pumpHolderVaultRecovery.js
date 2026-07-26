import crypto from "node:crypto";

export const PUMP_HOLDER_VAULT_RECOVERY_VERSION = 1;

const INTEGRITY_ALGORITHM = "HMAC-SHA256";
const INTEGRITY_DOMAIN = "slimewire:pump-holder-vault-recovery:v1\n";

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
  return value;
}

function requireString(value, label, { allowEmpty = false } = {}) {
  const normalized = String(value ?? "").trim();
  if (!allowEmpty && !normalized) throw new TypeError(`${label} is required.`);
  return normalized;
}

function assertOnlyKeys(value, allowedKeys, label) {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) throw new TypeError(`${label} contains unsupported field ${key}.`);
  }
}

function requireBase64(value, label, expectedBytes = null) {
  const normalized = requireString(value, label);
  const decoded = Buffer.from(normalized, "base64");
  if (!decoded.length || decoded.toString("base64") !== normalized) {
    throw new TypeError(`${label} must be canonical base64 ciphertext data.`);
  }
  if (expectedBytes !== null && decoded.length !== expectedBytes) {
    throw new TypeError(`${label} must decode to ${expectedBytes} bytes.`);
  }
  return normalized;
}

function normalizeEncryptedSecret(value) {
  const secret = requireObject(value, "Encrypted vault secret");
  const version = Number(secret.version);
  if (version !== 1) throw new TypeError("Encrypted vault secret version is not supported.");
  return {
    version,
    salt: requireBase64(secret.salt, "Encrypted vault secret salt", 16),
    iv: requireBase64(secret.iv, "Encrypted vault secret iv", 12),
    tag: requireBase64(secret.tag, "Encrypted vault secret tag", 16),
    data: requireBase64(secret.data, "Encrypted vault secret data")
  };
}

function normalizeVault(value) {
  const vault = requireObject(value, "Holder vault");
  return {
    publicKey: requireString(vault.publicKey, "Holder vault public key"),
    tokenMint: requireString(vault.tokenMint, "Holder vault token mint", { allowEmpty: true }),
    launchAttemptId: requireString(vault.launchAttemptId, "Holder vault launch attempt id", { allowEmpty: true }),
    userId: requireString(vault.userId, "Holder vault user id", { allowEmpty: true }),
    createdAt: requireString(vault.createdAt, "Holder vault creation time", { allowEmpty: true }),
    secret: normalizeEncryptedSecret(vault.secret ?? vault.encryptedSecret)
  };
}

function normalizePayload(value) {
  const payload = requireObject(value, "Holder-vault recovery artifact");
  if (Number(payload.version) !== PUMP_HOLDER_VAULT_RECOVERY_VERSION) {
    throw new TypeError("Holder-vault recovery artifact version is not supported.");
  }
  if (!Array.isArray(payload.vaults)) throw new TypeError("Holder-vault recovery artifact vaults must be an array.");
  const vaults = payload.vaults.map(normalizeVault);
  const publicKeys = new Set();
  for (const vault of vaults) {
    if (publicKeys.has(vault.publicKey)) throw new TypeError(`Holder-vault recovery artifact repeats ${vault.publicKey}.`);
    publicKeys.add(vault.publicKey);
  }
  return {
    version: PUMP_HOLDER_VAULT_RECOVERY_VERSION,
    updatedAt: requireString(payload.updatedAt, "Holder-vault recovery artifact update time"),
    vaults
  };
}

function appSecretBuffer(appSecret) {
  const secret = requireString(appSecret, "Application secret");
  return Buffer.from(secret, "utf8");
}

function signPayload(payload, appSecret) {
  return crypto
    .createHmac("sha256", appSecretBuffer(appSecret))
    .update(INTEGRITY_DOMAIN)
    .update(JSON.stringify(payload))
    .digest("base64url");
}

export function createPumpHolderVaultRecoveryArtifact({ vaults, appSecret, updatedAt = new Date().toISOString() } = {}) {
  const payload = normalizePayload({
    version: PUMP_HOLDER_VAULT_RECOVERY_VERSION,
    updatedAt,
    vaults
  });
  return {
    ...payload,
    integrity: {
      algorithm: INTEGRITY_ALGORITHM,
      value: signPayload(payload, appSecret)
    }
  };
}

export function verifyPumpHolderVaultRecoveryArtifact(artifact, appSecret) {
  const source = requireObject(artifact, "Holder-vault recovery artifact");
  assertOnlyKeys(source, new Set(["version", "updatedAt", "vaults", "integrity"]), "Holder-vault recovery artifact");
  const integrity = requireObject(source.integrity, "Holder-vault recovery integrity");
  assertOnlyKeys(integrity, new Set(["algorithm", "value"]), "Holder-vault recovery integrity");
  if (integrity.algorithm !== INTEGRITY_ALGORITHM) throw new TypeError("Holder-vault recovery integrity algorithm is not supported.");

  for (const [index, vault] of (source.vaults || []).entries()) {
    assertOnlyKeys(requireObject(vault, `Holder vault ${index + 1}`), new Set([
      "publicKey", "tokenMint", "launchAttemptId", "userId", "createdAt", "secret"
    ]), `Holder vault ${index + 1}`);
    assertOnlyKeys(requireObject(vault.secret, `Holder vault ${index + 1} encrypted secret`), new Set([
      "version", "salt", "iv", "tag", "data"
    ]), `Holder vault ${index + 1} encrypted secret`);
  }

  const payload = normalizePayload(source);
  const expected = Buffer.from(signPayload(payload, appSecret), "base64url");
  const suppliedValue = requireString(integrity.value, "Holder-vault recovery integrity value");
  const supplied = Buffer.from(suppliedValue, "base64url");
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
    throw new Error("Holder-vault recovery artifact failed its integrity check.");
  }
  return payload;
}
