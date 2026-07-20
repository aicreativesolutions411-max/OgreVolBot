import test from "node:test";
import assert from "node:assert/strict";
import { calculateTradeFeeAmount, splitTradeFeeAllocation } from "../src/lib/tradeFeePolicy.js";

test("the site fee stays at 0.65% with or without a referral", () => {
  const gross = 1_000_000n;
  const totalFee = calculateTradeFeeAmount(gross, 65);
  assert.equal(totalFee, 6_500n);

  assert.deepEqual(splitTradeFeeAllocation(totalFee, {
    totalFeeBps: 65,
    allocationBps: 15,
    allocationEnabled: false
  }), {
    totalAmount: 6_500n,
    ownerAmount: 6_500n,
    allocatedAmount: 0n
  });

  assert.deepEqual(splitTradeFeeAllocation(totalFee, {
    totalFeeBps: 65,
    allocationBps: 15,
    allocationEnabled: true
  }), {
    totalAmount: 6_500n,
    ownerAmount: 5_000n,
    allocatedAmount: 1_500n
  });
});

test("fee allocation preserves the exact charged total after integer rounding", () => {
  const fee = calculateTradeFeeAmount(123_456_789n, 65);
  const split = splitTradeFeeAllocation(fee, {
    totalFeeBps: 65,
    allocationBps: 15,
    allocationEnabled: true
  });
  assert.equal(split.ownerAmount + split.allocatedAmount, fee);
  assert.ok(split.ownerAmount > split.allocatedAmount);
});

test("an allocation can never exceed the configured total fee", () => {
  assert.throws(() => splitTradeFeeAllocation(650n, {
    totalFeeBps: 65,
    allocationBps: 66,
    allocationEnabled: true
  }), /cannot exceed/);
});
