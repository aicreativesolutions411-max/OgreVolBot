import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import {
  SOLANA_USDC_MINT,
  buildSolanaPayUrl,
  createCoinbaseCdpJwt,
  createCoinbaseOnrampSession,
  parseCashDecimalToRaw,
  rawCashAmountToUi
} from "../src/lib/cashPayments.js";

test("cash decimal parsing is exact and rejects ambiguous precision", () => {
  assert.equal(parseCashDecimalToRaw("25.01", 6), 25_010_000n);
  assert.equal(rawCashAmountToUi(25_010_000n, 6), "25.01");
  assert.throws(() => parseCashDecimalToRaw("1.0000001", 6), /6 decimal places/);
  assert.throws(() => parseCashDecimalToRaw("1e3", 6), /valid amount/);
  assert.throws(() => parseCashDecimalToRaw("0", 6), /greater than zero/);
});

test("Solana Pay USDC requests use the canonical mint and user units", () => {
  const recipient = "mvines9iiHiQTysrwkJjGf2gb9Ex9jXJX8ns3qwf2kN";
  const reference = "Vote111111111111111111111111111111111111111";
  const url = new URL(buildSolanaPayUrl({ recipient, asset: "USDC", amount: "0.01", label: "SlimeCash", reference }));
  assert.equal(url.protocol, "solana:");
  assert.equal(url.searchParams.get("amount"), "0.01");
  assert.equal(url.searchParams.get("spl-token"), SOLANA_USDC_MINT);
  assert.equal(url.searchParams.get("reference"), reference);
  assert.throws(() => buildSolanaPayUrl({ recipient, reference: "not-a-key" }), /Invalid Solana Pay reference/);
});

test("Coinbase CDP JWT binds method, host, and path and verifies with ES256", () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
  const jwt = createCoinbaseCdpJwt({
    keyId: "organizations/test/apiKeys/key",
    keySecret: privateKey.export({ type: "pkcs8", format: "pem" }),
    now: 1_700_000_000_000
  });
  const [encodedHeader, encodedPayload, encodedSignature] = jwt.split(".");
  const header = JSON.parse(Buffer.from(encodedHeader, "base64url"));
  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url"));
  assert.equal(header.alg, "ES256");
  assert.equal(payload.exp - payload.nbf, 120);
  assert.equal(payload.uri, "POST api.developer.coinbase.com/onramp/v1/token");
  assert.equal(crypto.verify(
    "sha256",
    Buffer.from(`${encodedHeader}.${encodedPayload}`),
    { key: publicKey, dsaEncoding: "ieee-p1363" },
    Buffer.from(encodedSignature, "base64url")
  ), true);
});

test("Coinbase session uses the documented hosted v1 token flow and preloads Solana", async () => {
  const { privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
  let request;
  const result = await createCoinbaseOnrampSession({
    keyId: "organizations/test/apiKeys/key",
    keySecret: privateKey.export({ type: "pkcs8", format: "pem" }),
    destinationAddress: "mvines9iiHiQTysrwkJjGf2gb9Ex9jXJX8ns3qwf2kN",
    asset: "USDC",
    paymentAmount: "50",
    redirectUrl: "https://www.slimewire.org/cash/?onramp=return",
    clientIp: "127.0.0.1",
    partnerUserRef: "slimecash-test",
    fetchImpl: async (url, options) => {
      request = { url, options, body: JSON.parse(options.body) };
      return { ok: true, status: 200, json: async () => ({ token: "one-use" }) };
    }
  });
  assert.equal(request.url, "https://api.developer.coinbase.com/onramp/v1/token");
  assert.deepEqual(request.body.addresses, [{ address: "mvines9iiHiQTysrwkJjGf2gb9Ex9jXJX8ns3qwf2kN", blockchains: ["solana"] }]);
  assert.deepEqual(request.body.assets, ["USDC"]);
  assert.equal(request.body.clientIp, "127.0.0.1");
  assert.match(request.options.headers.Authorization, /^Bearer /);
  const hostedUrl = new URL(result.onrampUrl);
  assert.equal(hostedUrl.origin, "https://pay.coinbase.com");
  assert.equal(hostedUrl.searchParams.get("sessionToken"), "one-use");
  assert.equal(hostedUrl.searchParams.get("presetFiatAmount"), "50.00");
});

test("Coinbase hosted funding uses one current API call and preserves preload parameters", async () => {
  const { privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
  const requests = [];
  const result = await createCoinbaseOnrampSession({
    keyId: "organizations/test/apiKeys/key",
    keySecret: privateKey.export({ type: "pkcs8", format: "pem" }),
    destinationAddress: "mvines9iiHiQTysrwkJjGf2gb9Ex9jXJX8ns3qwf2kN",
    asset: "USDC",
    paymentAmount: "25",
    redirectUrl: "https://www.slimewire.org/cash/?onramp=return",
    clientIp: "192.0.2.1",
    partnerUserRef: "slimecash-test",
    fetchImpl: async (url, options) => {
      requests.push({ url, options, body: JSON.parse(options.body) });
      return { ok: true, status: 200, json: async () => ({ token: "one-use-v1" }) };
    }
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://api.developer.coinbase.com/onramp/v1/token");
  assert.deepEqual(requests[0].body.addresses, [{ address: "mvines9iiHiQTysrwkJjGf2gb9Ex9jXJX8ns3qwf2kN", blockchains: ["solana"] }]);
  assert.deepEqual(requests[0].body.assets, ["USDC"]);
  assert.equal(requests[0].body.clientIp, "192.0.2.1");
  const hostedUrl = new URL(result.onrampUrl);
  assert.equal(hostedUrl.origin, "https://pay.coinbase.com");
  assert.equal(hostedUrl.searchParams.get("sessionToken"), "one-use-v1");
  assert.equal(hostedUrl.searchParams.get("defaultNetwork"), "solana");
  assert.equal(hostedUrl.searchParams.get("defaultAsset"), "USDC");
  assert.equal(hostedUrl.searchParams.get("presetFiatAmount"), "25.00");
  assert.equal(hostedUrl.searchParams.get("defaultExperience"), "buy");
  assert.equal(hostedUrl.searchParams.get("defaultPaymentMethod"), "CARD");
});

test("Coinbase session failures preserve a safe provider status for setup diagnostics", async () => {
  const { privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
  await assert.rejects(() => createCoinbaseOnrampSession({
    keyId: "organizations/test/apiKeys/key",
    keySecret: privateKey.export({ type: "pkcs8", format: "pem" }),
    destinationAddress: "mvines9iiHiQTysrwkJjGf2gb9Ex9jXJX8ns3qwf2kN",
    asset: "USDC",
    paymentAmount: "10",
    redirectUrl: "https://www.slimewire.org/cash/",
    clientIp: "127.0.0.1",
    partnerUserRef: "slimecash-test",
    fetchImpl: async () => ({ ok: false, status: 403, json: async () => ({}) })
  }), /HTTP 403/);
});

test("Coinbase setup failures never expose internal cloud project identifiers", async () => {
  const { privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
  let calls = 0;
  await assert.rejects(() => createCoinbaseOnrampSession({
    keyId: "organizations/test/apiKeys/key",
    keySecret: privateKey.export({ type: "pkcs8", format: "pem" }),
    destinationAddress: "mvines9iiHiQTysrwkJjGf2gb9Ex9jXJX8ns3qwf2kN",
    asset: "USDC",
    paymentAmount: "10",
    redirectUrl: "https://app.slimewire.org/cash/",
    clientIp: "192.0.2.1",
    partnerUserRef: "slimecash-test",
    fetchImpl: async () => {
      calls += 1;
      return { ok: false, status: 404, json: async () => ({ message: "NotFound: failed to find app with cloud project id private-id: mongo: no documents in result" }) };
    }
  }), (error) => {
    assert.match(error.message, /awaiting Onramp app approval/);
    assert.doesNotMatch(error.message, /cloud project id|private-id|mongo/i);
    return true;
  });
  assert.equal(calls, 1);
});
