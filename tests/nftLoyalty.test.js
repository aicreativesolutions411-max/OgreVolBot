import assert from "node:assert/strict";
import test from "node:test";
import {
  allocateNftRewards,
  nftLoyaltyMultiplierBps,
  nftRewardPower,
  normalizeNftItem,
  syncNftOwnership
} from "../src/lib/nftLoyalty.js";

test("NFT item normalization uses safe rarity defaults", () => {
  assert.deepEqual(normalizeNftItem({ name: "  Slime #1  ", rarity: "MYTHIC" }), {
    name: "Slime #1", description: "", rarity: "common", recipient: "", imageDataUrl: "", imageName: "", version: 1
  });
});

test("loyalty multiplier grows with uninterrupted ownership and caps at 2x", () => {
  const now = Date.UTC(2026, 6, 16);
  assert.equal(nftLoyaltyMultiplierBps(now, now), 10_000);
  assert.equal(nftLoyaltyMultiplierBps(now - 90 * 86_400_000, now), 13_000);
  assert.equal(nftLoyaltyMultiplierBps(now - 900 * 86_400_000, now), 20_000);
  assert.equal(nftRewardPower({ rarity: "legendary", ownerSince: now - 30 * 86_400_000 }, now).displayMultiplier, 3.3);
});

test("ownership transfer resets loyalty start", () => {
  const before = { NFT1: { asset: "NFT1", owner: "A", ownerSince: 100, lastCheckedAt: 200 } };
  const same = syncNftOwnership(before, [{ asset: "NFT1", owner: "A" }], 300);
  assert.equal(same.NFT1.ownerSince, 100);
  const moved = syncNftOwnership(before, [{ asset: "NFT1", owner: "B" }], 300);
  assert.equal(moved.NFT1.ownerSince, 300);
});

test("creator-funded allocation is deterministic and preserves every raw token", () => {
  const now = Date.UTC(2026, 6, 16);
  const rows = allocateNftRewards(101n, [
    { asset: "B", owner: "wallet-b", rarity: "legendary", ownerSince: now },
    { asset: "A", owner: "wallet-a", rarity: "common", ownerSince: now }
  ], now);
  assert.deepEqual(rows.map((row) => row.asset), ["A", "B"]);
  assert.equal(rows.reduce((sum, row) => sum + BigInt(row.allocationRaw), 0n), 101n);
  assert.ok(BigInt(rows[1].allocationRaw) > BigInt(rows[0].allocationRaw));
});
