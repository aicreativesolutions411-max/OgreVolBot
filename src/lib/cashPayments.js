import crypto from "node:crypto";

export const SOLANA_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const COINBASE_ONRAMP_HOST = "api.cdp.coinbase.com";
export const COINBASE_ONRAMP_PATH = "/platform/v2/onramp/sessions";
export const COINBASE_ONRAMP_TOKEN_HOST = "api.developer.coinbase.com";
export const COINBASE_ONRAMP_TOKEN_PATH = "/onramp/v1/token";

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

export function parseCashDecimalToRaw(value, decimals, label = "amount") {
  const text = String(value ?? "").trim();
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new Error("Invalid token precision.");
  }
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(text)) {
    throw new Error(`Enter a valid ${label}.`);
  }
  const [whole, fraction = ""] = text.split(".");
  if (fraction.length > decimals) {
    throw new Error(`${label[0].toUpperCase()}${label.slice(1)} supports up to ${decimals} decimal places.`);
  }
  const raw = BigInt(whole) * (10n ** BigInt(decimals))
    + BigInt((fraction + "0".repeat(decimals)).slice(0, decimals) || "0");
  if (raw <= 0n) throw new Error(`Enter a ${label} greater than zero.`);
  return raw;
}

export function rawCashAmountToUi(rawAmount, decimals) {
  const raw = BigInt(rawAmount);
  const scale = 10n ** BigInt(decimals);
  const whole = raw / scale;
  const fraction = String(raw % scale).padStart(decimals, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
}

export function buildSolanaPayUrl({ recipient, asset = "USDC", amount = "", label = "SlimeCash", message = "" } = {}) {
  const address = String(recipient || "").trim();
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) throw new Error("Invalid Solana recipient.");
  const normalizedAsset = String(asset || "USDC").trim().toUpperCase();
  if (!new Set(["USDC", "SOL"]).has(normalizedAsset)) throw new Error("Choose USDC or SOL.");
  const params = new URLSearchParams();
  if (String(amount || "").trim()) {
    const decimals = normalizedAsset === "USDC" ? 6 : 9;
    const raw = parseCashDecimalToRaw(amount, decimals);
    params.set("amount", rawCashAmountToUi(raw, decimals));
  }
  if (normalizedAsset === "USDC") params.set("spl-token", SOLANA_USDC_MINT);
  if (String(label || "").trim()) params.set("label", String(label).trim().slice(0, 48));
  if (String(message || "").trim()) params.set("message", String(message).trim().slice(0, 80));
  const query = params.toString();
  return `solana:${address}${query ? `?${query}` : ""}`;
}

function normalizeCdpSecret(secret) {
  return String(secret || "").trim().replace(/\\n/g, "\n");
}

function coinbasePrivateKey(secret) {
  const normalized = normalizeCdpSecret(secret);
  if (!normalized) throw new Error("Coinbase CDP key secret is not configured.");
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(normalized)) return crypto.createPrivateKey(normalized);

  const decoded = Buffer.from(normalized, "base64");
  if (decoded.length !== 32 && decoded.length !== 64) {
    throw new Error("Coinbase CDP Ed25519 secret must be a 32- or 64-byte base64 key.");
  }
  const seed = decoded.subarray(0, 32);
  const pkcs8 = Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), seed]);
  return crypto.createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });
}

export function createCoinbaseCdpJwt({ keyId, keySecret, method = "POST", host = COINBASE_ONRAMP_HOST, path = COINBASE_ONRAMP_PATH, now = Date.now() } = {}) {
  const kid = String(keyId || "").trim();
  if (!kid) throw new Error("Coinbase CDP key ID is not configured.");
  const key = coinbasePrivateKey(keySecret);
  const keyType = key.asymmetricKeyType;
  const alg = keyType === "ed25519" ? "EdDSA" : keyType === "ec" ? "ES256" : "";
  if (!alg) throw new Error("Coinbase CDP key must be Ed25519 or ECDSA P-256.");
  const issued = Math.floor(Number(now) / 1000);
  const header = { alg, typ: "JWT", kid, nonce: crypto.randomBytes(16).toString("hex") };
  const payload = {
    sub: kid,
    iss: "cdp",
    aud: ["cdp_service"],
    nbf: issued,
    exp: issued + 120,
    uri: `${String(method).toUpperCase()} ${host}${path}`
  };
  const input = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signature = alg === "EdDSA"
    ? crypto.sign(null, Buffer.from(input), key)
    : crypto.sign("sha256", Buffer.from(input), { key, dsaEncoding: "ieee-p1363" });
  return `${input}.${signature.toString("base64url")}`;
}

export function normalizeCoinbasePaymentAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 5 || amount > 2500) {
    throw new Error("Choose a funding amount from $5 to $2,500.");
  }
  return amount.toFixed(2);
}

function coinbaseProviderError(response, data = {}) {
  const rawProviderMessage = [
    data?.message,
    data?.error_description,
    typeof data?.error === "string" ? data.error : data?.error?.message
  ].find((value) => typeof value === "string" && value.trim());
  const providerMessage = /(?:cloud project id|mongo:|no documents in result|failed to find app)/i.test(String(rawProviderMessage || ""))
    ? "Coinbase checkout is awaiting Onramp app approval. No funds were moved."
    : rawProviderMessage;
  const providerCode = String(data?.code || data?.error?.code || "").trim();
  const statusText = response.status ? `HTTP ${response.status}${providerCode ? `, ${providerCode}` : ""}` : "provider error";
  const error = new Error(providerMessage || `Coinbase rejected the funding session (${statusText}).`);
  error.statusCode = response.status >= 400 && response.status < 500 ? 400 : 502;
  return error;
}

async function createCoinbaseHostedTokenSession({ keyId, keySecret, destinationAddress, purchaseCurrency, paymentAmount, redirectUrl, clientIp, partnerUserRef, fetchImpl }) {
  const body = {
    addresses: [{ address: String(destinationAddress || "").trim(), blockchains: ["solana"] }],
    assets: [purchaseCurrency],
    clientIp: String(clientIp || "").trim()
  };
  const token = createCoinbaseCdpJwt({
    keyId,
    keySecret,
    host: COINBASE_ONRAMP_TOKEN_HOST,
    path: COINBASE_ONRAMP_TOKEN_PATH
  });
  const response = await fetchImpl(`https://${COINBASE_ONRAMP_TOKEN_HOST}${COINBASE_ONRAMP_TOKEN_PATH}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12_000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.token) throw coinbaseProviderError(response, data);

  const url = new URL("https://pay.coinbase.com/buy/select-asset");
  url.searchParams.set("sessionToken", data.token);
  if (String(partnerUserRef || "").trim()) url.searchParams.set("partnerUserRef", String(partnerUserRef).trim().slice(0, 50));
  if (String(redirectUrl || "").trim()) url.searchParams.set("redirectUrl", String(redirectUrl).trim());
  url.searchParams.set("defaultNetwork", "solana");
  url.searchParams.set("defaultAsset", purchaseCurrency);
  url.searchParams.set("presetFiatAmount", paymentAmount);
  url.searchParams.set("defaultExperience", "buy");
  url.searchParams.set("defaultPaymentMethod", "CARD");
  url.searchParams.set("fiatCurrency", "USD");
  return { onrampUrl: url.toString(), quote: null, asset: purchaseCurrency };
}

export async function createCoinbaseOnrampSession({ keyId, keySecret, destinationAddress, asset = "USDC", paymentAmount, redirectUrl, clientIp, partnerUserRef, fetchImpl = fetch } = {}) {
  const purchaseCurrency = String(asset || "USDC").trim().toUpperCase();
  if (!new Set(["USDC", "SOL"]).has(purchaseCurrency)) throw new Error("Coinbase funding supports USDC or SOL.");
  const normalizedPaymentAmount = normalizeCoinbasePaymentAmount(paymentAmount);
  const body = {
    purchaseCurrency,
    destinationNetwork: "solana",
    destinationAddress: String(destinationAddress || "").trim(),
    paymentAmount: normalizedPaymentAmount,
    paymentCurrency: "USD",
    paymentMethod: "CARD",
    redirectUrl: String(redirectUrl || "").trim(),
    clientIp: String(clientIp || "").trim(),
    partnerUserRef: String(partnerUserRef || "").trim()
  };
  const token = createCoinbaseCdpJwt({ keyId, keySecret });
  const response = await fetchImpl(`https://${COINBASE_ONRAMP_HOST}${COINBASE_ONRAMP_PATH}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12_000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.session?.onrampUrl) {
    if (response.status === 404) {
      return createCoinbaseHostedTokenSession({
        keyId,
        keySecret,
        destinationAddress,
        purchaseCurrency,
        paymentAmount: normalizedPaymentAmount,
        redirectUrl,
        clientIp,
        partnerUserRef,
        fetchImpl
      });
    }
    throw coinbaseProviderError(response, data);
  }
  return { onrampUrl: data.session.onrampUrl, quote: data.quote || null, asset: purchaseCurrency };
}
