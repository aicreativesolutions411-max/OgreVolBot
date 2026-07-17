import assert from "node:assert/strict";
import test from "node:test";

import {
  linkedCollectionMetadata,
  normalizeLinkedNftCollection
} from "../src/lib/linkedNftCollection.js";

test("linked NFT collection is opt-in", () => {
  assert.deepEqual(normalizeLinkedNftCollection({}, { name: "Ogre" }), { enabled: false });
});

test("linked NFT collection gets clear defaults from its coin", () => {
  const value = normalizeLinkedNftCollection({ enabled: true }, { name: "Ogre", symbol: "OGRE" });
  assert.equal(value.enabled, true);
  assert.equal(value.name, "Ogre NFT Collection");
  assert.match(value.description, /\$OGRE/);
  assert.equal(value.standard, "metaplex-core");
  assert.equal(value.supplyMode, "expandable");
  assert.equal(value.supplyCap, 500);
  assert.equal(value.royaltyBps, 500);
});

test("linked NFT collection clamps fixed supply and royalties to supported limits", () => {
  const value = normalizeLinkedNftCollection({
    enabled: true,
    supplyMode: "fixed",
    supplyCap: 900,
    royaltyBps: 2500
  }, { name: "Ogre" });
  assert.equal(value.supplyMode, "fixed");
  assert.equal(value.supplyCap, 500);
  assert.equal(value.royaltyBps, 1000);
});

test("collection metadata carries a permanent explicit coin link", () => {
  const mint = "7tsiSR4b774u1prqAxfcWKgfQYavCDNBwK3xyYG8eR3F";
  const metadata = linkedCollectionMetadata({
    collection: { enabled: true, name: "Shark Collection", description: "Official sharks." },
    coin: { name: "Shark", symbol: "SHARK" },
    tokenMint: mint,
    imageUri: "ipfs://art",
    externalUrl: `https://slimewire.org/fun?ca=${mint}`
  });
  assert.equal(metadata.name, "Shark Collection");
  assert.equal(metadata.properties.linked_token_mint, mint);
  assert.equal(metadata.properties.supply_mode, "expandable");
  assert.equal(metadata.properties.supply_cap, 500);
  assert.equal(metadata.properties.royalty_bps, 500);
  assert.equal(metadata.attributes[0].value, mint);
  assert.match(metadata.description, new RegExp(mint));
});
