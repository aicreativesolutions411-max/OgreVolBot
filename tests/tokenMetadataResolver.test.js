import test from "node:test";
import assert from "node:assert/strict";
import { TokenMetadataResolver, uriGatewayCandidates } from "../src/lib/tokenMetadataResolver.js";

function resolver(deps = {}) {
  return new TokenMetadataResolver({
    ttlMs: 60_000,
    verifyImageUri: async (uri) => ({ ok: Boolean(uri), status: 200, uri, contentType: "image/png" }),
    fetchMetadataJson: async () => null,
    getSlimeWireMetadata: async () => ({}),
    getDexMetadata: async () => ({}),
    getPumpMetadata: async () => ({}),
    getOnchainMetadata: async () => ({}),
    log: () => {},
    ...deps
  });
}

test("DEX image metadata is used when complete", async () => {
  const metadata = await resolver({
    getDexMetadata: async () => ({
      name: "Dex Token",
      symbol: "DEX",
      imageUrl: "https://img.example/dex.png"
    })
  }).resolveTokenMetadata({ mint: "DexMint111" });

  assert.equal(metadata.metadataSourceUsed, "dex");
  assert.equal(metadata.name, "Dex Token");
  assert.equal(metadata.symbol, "DEX");
  assert.equal(metadata.imageUri, "https://img.example/dex.png");
  assert.equal(metadata.dexImagePresent, true);
});

test("SlimeWire Pump launch image is used when DEX image is missing", async () => {
  const metadata = await resolver({
    getDexMetadata: async () => ({ name: "", symbol: "", imageUrl: "" }),
    getSlimeWireMetadata: async () => ({
      source: "pumpfun",
      tokenName: "Launch Token",
      symbol: "LCH",
      imageUri: "https://img.example/launch.png",
      metadataUri: "https://meta.example/launch.json"
    })
  }).resolveTokenMetadata({ mint: "PumpMint111", source: "pumpfun" });

  assert.equal(metadata.metadataSourceUsed, "slimewireLaunch");
  assert.equal(metadata.name, "Launch Token");
  assert.equal(metadata.symbol, "LCH");
  assert.equal(metadata.imageUri, "https://img.example/launch.png");
  assert.equal(metadata.metadataUri, "https://meta.example/launch.json");
  assert.equal(metadata.metadataMissing, false);
});

test("metadataUri image fills PnL card image when DEX image is missing", async () => {
  const metadata = await resolver({
    getDexMetadata: async () => ({ name: "", symbol: "", imageUrl: "" }),
    getSlimeWireMetadata: async () => ({
      source: "pumpfun",
      tokenName: "Uri Token",
      symbol: "URI",
      metadataUri: "https://meta.example/token.json"
    }),
    fetchMetadataJson: async (uri) => ({
      uri,
      status: 200,
      json: {
        name: "Uri Token JSON",
        symbol: "URIJ",
        image: "https://img.example/from-json.png"
      }
    })
  }).resolveTokenMetadata({ mint: "UriMint111", source: "pumpfun" });

  assert.equal(metadata.metadataSourceUsed, "slimewireLaunch");
  assert.equal(metadata.name, "Uri Token JSON");
  assert.equal(metadata.symbol, "URIJ");
  assert.equal(metadata.imageUri, "https://img.example/from-json.png");
  assert.equal(metadata.imageFetchStatus, "200");
});

test("IPFS metadata URI has fallback gateway candidates", () => {
  const candidates = uriGatewayCandidates("ipfs://bafyMetaCid");

  assert.deepEqual(candidates, [
    "https://gateway.pinata.cloud/ipfs/bafyMetaCid",
    "https://ipfs.io/ipfs/bafyMetaCid",
    "https://cloudflare-ipfs.com/ipfs/bafyMetaCid"
  ]);
});

test("IPFS gateway timeout can fall back to the next gateway", async (t) => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).includes("gateway.pinata.cloud/ipfs/bafyMetaCid")) {
      const error = new Error("timeout");
      error.name = "AbortError";
      throw error;
    }
    if (String(url).includes("ipfs.io/ipfs/bafyMetaCid")) {
      return new Response(JSON.stringify({
        name: "Fallback Meta",
        symbol: "FBK",
        image: "ipfs://bafyImageCid"
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (String(url).includes("gateway.pinata.cloud/ipfs/bafyImageCid")) {
      return new Response("png", { status: 200, headers: { "content-type": "image/png" } });
    }
    return new Response("not found", { status: 404 });
  };

  const metadata = await new TokenMetadataResolver({
    getDexMetadata: async () => ({}),
    getSlimeWireMetadata: async () => ({ source: "pumpfun", metadataUri: "ipfs://bafyMetaCid" })
  }).resolveTokenMetadata({ mint: "IpfsMint111", source: "pumpfun" });

  assert.equal(metadata.metadataSourceUsed, "slimewireLaunch");
  assert.equal(metadata.name, "Fallback Meta");
  assert.equal(metadata.imageUri, "https://gateway.pinata.cloud/ipfs/bafyImageCid");
  assert.ok(calls.some((url) => url.includes("gateway.pinata.cloud/ipfs/bafyMetaCid")));
  assert.ok(calls.some((url) => url.includes("ipfs.io/ipfs/bafyMetaCid")));
});

test("missing metadata returns placeholder without throwing", async () => {
  const metadata = await resolver().resolveTokenMetadata({ mint: "MissingMint111" });

  assert.equal(metadata.metadataSourceUsed, "placeholder");
  assert.equal(metadata.imageUri, "");
  assert.equal(metadata.metadataMissing, true);
  assert.ok(metadata.warnings.some((warning) => warning.includes("metadataMissing=true")));
});

test("metadata resolver does not change PnL math fields", async () => {
  const row = {
    spent: 100_000_000n,
    received: 150_000_000n
  };
  const before = row.received - row.spent;
  await resolver({
    getSlimeWireMetadata: async () => ({
      source: "pumpfun",
      tokenName: "Math Token",
      symbol: "MATH",
      imageUri: "https://img.example/math.png"
    })
  }).resolveTokenMetadata({ mint: "MathMint111", source: "pumpfun" });
  const after = row.received - row.spent;

  assert.equal(after, before);
  assert.equal(after, 50_000_000n);
});

test("Pump metadata fills name, symbol, and image when launch and DEX are incomplete", async () => {
  const metadata = await resolver({
    getDexMetadata: async () => ({ name: "", symbol: "", imageUrl: "" }),
    getPumpMetadata: async () => ({
      source: "pumpfun",
      name: "Pump Token",
      symbol: "PMP",
      imageUri: "https://img.example/pump.png"
    })
  }).resolveTokenMetadata({ mint: "PumpApiMint111", source: "pumpfun" });

  assert.equal(metadata.metadataSourceUsed, "pumpMetadata");
  assert.equal(metadata.name, "Pump Token");
  assert.equal(metadata.symbol, "PMP");
  assert.equal(metadata.imageUri, "https://img.example/pump.png");
  assert.equal(metadata.pumpMetadataPresent, true);
});

test("metadata cache can be invalidated after Pump launch metadata changes", async () => {
  let imageUri = "https://img.example/old.png";
  const metadataResolver = resolver({
    getSlimeWireMetadata: async () => ({
      source: "pumpfun",
      tokenName: "Cached Token",
      symbol: "CACHE",
      imageUri
    })
  });

  const first = await metadataResolver.resolveTokenMetadata({ mint: "CacheMint111", source: "pumpfun" });
  imageUri = "https://img.example/new.png";
  const cached = await metadataResolver.resolveTokenMetadata({ mint: "CacheMint111", source: "pumpfun" });
  metadataResolver.invalidate("CacheMint111");
  const refreshed = await metadataResolver.resolveTokenMetadata({ mint: "CacheMint111", source: "pumpfun" });

  assert.equal(first.imageUri, "https://img.example/old.png");
  assert.equal(cached.imageUri, "https://img.example/old.png");
  assert.equal(refreshed.imageUri, "https://img.example/new.png");
});

test("resolver logs safe metadata diagnostics without provider secrets", async () => {
  const logs = [];
  await resolver({
    log: (event, payload) => logs.push({ event, payload }),
    getSlimeWireMetadata: async () => ({
      source: "pumpfun",
      tokenName: "Safe Token",
      symbol: "SAFE",
      imageUri: "https://img.example/safe.png",
      secret: "do-not-log"
    })
  }).resolveTokenMetadata({ mint: "SafeMint111", source: "pumpfun" });

  assert.equal(logs.length, 1);
  const serialized = JSON.stringify(logs);
  assert.doesNotMatch(serialized, /do-not-log|api[-_ ]?key|secret/i);
  assert.match(serialized, /slimewireLaunch/);
});
