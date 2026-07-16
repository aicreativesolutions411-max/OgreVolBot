import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

function functionBody(name) {
  const match = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`).exec(source);
  assert.ok(match, `${name} missing`);
  const paramsStart = source.indexOf("(", match.index);
  let paramsDepth = 0;
  let paramsEnd = -1;
  for (let i = paramsStart; i < source.length; i += 1) {
    if (source[i] === "(") paramsDepth += 1;
    else if (source[i] === ")" && --paramsDepth === 0) { paramsEnd = i; break; }
  }
  const bodyStart = source.indexOf("{", paramsEnd);
  let depth = 0;
  for (let i = bodyStart; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}" && --depth === 0) return source.slice(bodyStart + 1, i);
  }
  return "";
}

function compileAsyncFunction(name, params, deps = {}) {
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const depNames = Object.keys(deps);
  const factory = new AsyncFunction(...depNames, `return async function(${params.join(",")}) {${functionBody(name)}};`);
  return factory(...depNames.map((key) => deps[key]));
}

test("volume cleanup requires complete fresh reads of both token programs", () => {
  const complete = functionBody("completeVolumeTokenAccountRead");
  assert.match(complete, /force: true, priority: true/);
  assert.match(complete, /lookup\?\.stale/);
  assert.match(complete, /successes \|\| 0\) !== 2/);
  assert.match(complete, /warnings\.length/);

  const cleanup = functionBody("cleanupVolumeBotWallet");
  const verifyAt = cleanup.indexOf("completeVolumeTokenAccountRead(publicKey)");
  const sellAt = cleanup.indexOf("runVolumeBotExternalAction(plan, persist");
  const drainAt = cleanup.indexOf("drainSolFromWallet(");
  const pruneAt = cleanup.indexOf("pruneVolumeWallet(");
  assert.ok(verifyAt >= 0 && verifyAt < sellAt && sellAt < drainAt && drainAt < pruneAt);
  assert.match(cleanup, /nonzeroVolumeTokenAccounts\(tokenAccounts\)/);
  assert.match(cleanup, /afterClose\.length/);
  assert.match(cleanup, /remainingAccounts\.length/);
  assert.match(cleanup, /targetRaw > 0n && !residueAlreadyPrepared/);
  assert.match(cleanup, /retainVolumeWalletAndReturnExcessSol\(plan, record, persist\)/);
});

test("cleanup skips a new sell claim when the screenshot wallet is already sold", async () => {
  let actionCalls = 0;
  let drains = 0;
  let prunes = 0;
  const cleanupState = (plan, publicKey) => {
    plan.cleanupStateByWallet ||= {};
    return (plan.cleanupStateByWallet[publicKey] ||= {});
  };
  const cleanup = await compileAsyncFunction("cleanupVolumeBotWallet", ["plan", "record", "slippageBps", "noBalance", "persist"], {
    completeVolumeTokenAccountRead: async () => [],
    volumeBotLogPush: () => {},
    shortMint: (value) => value,
    volumeBotCleanupWalletState: cleanupState,
    volumeBotTargetRawAmount: () => 0n,
    volumeBotOneTokenRaw: () => ({ decimals: 0, rawAmount: 1n }),
    volumeBotSellPercent: () => 98,
    runVolumeBotExternalAction: async () => { actionCalls += 1; },
    sellVolumeCleanupToken: async () => {},
    volumeBotTradeOutcomeAmbiguous: () => false,
    volumeBotEnterRecovery: () => {},
    volumeBotNeedsCleanupGas: () => false,
    topUpVolumeCleanupGas: async () => false,
    friendlyError: (error) => String(error?.message || error),
    markVolumeBotCleanupTokenPhase: (plan, publicKey, phase) => Object.assign(cleanupState(plan, publicKey), { tokenPhase: phase }),
    retainVolumeWalletAndReturnExcessSol: async () => { throw new Error("zero target must fully clean, not retain"); },
    nonzeroVolumeTokenAccounts: () => [],
    closeEmptyVolumeTokenAccounts: async () => {},
    drainSolFromWallet: async () => { drains += 1; return { sentLamports: 123 }; },
    decryptWallet: (record) => record,
    PublicKey: class PublicKey { constructor(value) { this.value = value; } },
    invalidateWalletReadCache: () => {},
    getSolBalanceCached: async () => 0,
    pruneVolumeWallet: async () => { prunes += 1; }
  });
  const plan = { tokenMint: "TOKEN", sourcePublicKey: "SOURCE", config: { keepDust: true, sweepBack: true } };
  const result = await cleanup(plan, { publicKey: "GHOST" }, 600, () => false, async () => true);
  assert.equal(actionCalls, 0);
  assert.equal(drains, 1);
  assert.equal(prunes, 1);
  assert.equal(result.closed, true);
  assert.equal(result.retained, false);
  assert.equal(plan.cleanupStateByWallet.GHOST.tokenPhase, "empty");
});

test("an exhausted legacy keep-dust run gets one exact sell, preserves one token, and releases", async () => {
  let read = 0;
  let retained = 0;
  let claimedAction = null;
  let claimedSellOptions = null;
  let migrationCheckpointedBeforeSell = false;
  const cleanupState = (plan, publicKey) => {
    plan.cleanupStateByWallet ||= {};
    return (plan.cleanupStateByWallet[publicKey] ||= {});
  };
  const targetRaw = (accounts) => accounts.reduce((sum, row) => sum + BigInt(row.rawAmount || 0), 0n);
  const cleanup = await compileAsyncFunction("cleanupVolumeBotWallet", ["plan", "record", "slippageBps", "noBalance", "persist"], {
    completeVolumeTokenAccountRead: async () => [{
      mint: "TOKEN",
      rawAmount: read++ === 0 ? "3000000" : "1000000",
      decimals: 6
    }],
    volumeBotLogPush: () => {},
    shortMint: (value) => value,
    volumeBotCleanupWalletState: cleanupState,
    volumeBotTargetRawAmount: targetRaw,
    volumeBotOneTokenRaw: () => ({ decimals: 6, rawAmount: 1000000n }),
    expectedVolumeBotResidueRaw: (before, pct) => BigInt(before) - ((BigInt(before) * BigInt(pct)) / 100n),
    applyVolumeBotCleanupStateUpdate: (plan, update) => Object.assign(cleanupState(plan, update.publicKey), update, { tokenPhase: update.tokenPhase }),
    volumeBotSellPercent: () => 98,
    runVolumeBotExternalAction: async (_plan, _persist, action, task) => { claimedAction = action; return task(); },
    sellVolumeCleanupToken: async (_record, _mint, _slippage, _userId, options) => {
      claimedSellOptions = options;
      return { ok: true };
    },
    volumeBotTradeOutcomeAmbiguous: () => false,
    volumeBotEnterRecovery: () => {},
    volumeBotNeedsCleanupGas: () => false,
    topUpVolumeCleanupGas: async () => false,
    friendlyError: (error) => String(error?.message || error),
    markVolumeBotCleanupTokenPhase: (plan, publicKey, phase, details = {}) => Object.assign(cleanupState(plan, publicKey), details, { tokenPhase: phase }),
    retainVolumeWalletAndReturnExcessSol: async () => { retained += 1; return { closed: true, retained: true, sentLamports: 50 }; },
    nonzeroVolumeTokenAccounts: () => { throw new Error("residue path must return before full cleanup"); },
    closeEmptyVolumeTokenAccounts: async () => {},
    drainSolFromWallet: async () => {},
    decryptWallet: (record) => record,
    PublicKey: class PublicKey {},
    invalidateWalletReadCache: () => {},
    getSolBalanceCached: async () => 0,
    pruneVolumeWallet: async () => {}
  });
  const plan = {
    tokenMint: "TOKEN",
    sourcePublicKey: "SOURCE",
    config: { keepDust: true, sweepBack: true },
    cleanupAttemptsByWallet: { GHOST: 6 },
    cleanupStateByWallet: {
      GHOST: { tokenPhase: "residue", expectedRawAfter: "60000", sellPercent: 98, keepDust: true }
    }
  };
  const result = await cleanup(plan, { publicKey: "GHOST" }, 600, () => false, async () => {
    if (!claimedAction && plan.cleanupStateByWallet.GHOST.residuePolicy === "one-token-v1") {
      migrationCheckpointedBeforeSell = true;
    }
    return true;
  });
  assert.equal(claimedAction.kind, "cleanup-sell");
  assert.equal(claimedAction.tokenRawBefore, "3000000");
  assert.equal(claimedAction.expectedRawAfter, "1000000");
  assert.equal(claimedAction.sellRawAmount, "2000000");
  assert.equal(claimedAction.tokenDecimals, 6);
  assert.equal(claimedAction.sellPercent, null);
  assert.equal(claimedAction.keepDust, true);
  assert.equal(claimedSellOptions.sellRawAmount, 2000000n);
  assert.equal(claimedSellOptions.tokenDecimals, 6);
  assert.equal(claimedSellOptions.sellPercent, null);
  assert.equal(plan.cleanupStateByWallet.GHOST.residuePolicy, "one-token-v1");
  assert.equal(migrationCheckpointedBeforeSell, true);
  assert.equal(plan.cleanupStateByWallet.GHOST.tokenPhase, "residue");
  assert.equal(retained, 1);
  assert.deepEqual(result, { closed: true, retained: true, sentLamports: 50, sold: true });
});

test("reconciled no-progress and cleanup-gas restarts cannot re-enter the sell loop or block Start", async () => {
  let actionCalls = 0;
  let retained = 0;
  let checkpoints = 0;
  const cleanupState = (plan, publicKey) => {
    plan.cleanupStateByWallet ||= {};
    return (plan.cleanupStateByWallet[publicKey] ||= {});
  };
  const markPhase = (plan, publicKey, phase, details = {}) => Object.assign(
    cleanupState(plan, publicKey), details, { tokenPhase: phase }
  );
  const cleanup = await compileAsyncFunction("cleanupVolumeBotWallet", ["plan", "record", "slippageBps", "noBalance", "persist"], {
    completeVolumeTokenAccountRead: async () => [{ mint: "TOKEN", rawAmount: "3000000", decimals: 6 }],
    volumeBotLogPush: () => {},
    shortMint: (value) => value,
    volumeBotCleanupWalletState: cleanupState,
    volumeBotTargetRawAmount: (accounts) => accounts.reduce((sum, row) => sum + BigInt(row.rawAmount || 0), 0n),
    volumeBotOneTokenRaw: () => ({ decimals: 6, rawAmount: 1000000n }),
    expectedVolumeBotResidueRaw: () => 1000000n,
    applyVolumeBotCleanupStateUpdate: (plan, update) => markPhase(plan, update.publicKey, update.tokenPhase, update),
    runVolumeBotExternalAction: async () => { actionCalls += 1; },
    sellVolumeCleanupToken: async () => { throw new Error("exhausted wallet must not sell again"); },
    volumeBotTradeOutcomeAmbiguous: () => false,
    volumeBotEnterRecovery: () => {},
    volumeBotNeedsCleanupGas: () => false,
    topUpVolumeCleanupGas: async () => false,
    friendlyError: (error) => String(error?.message || error),
    markVolumeBotCleanupTokenPhase: markPhase,
    retainVolumeWalletAndReturnExcessSol: async () => {
      retained += 1;
      return { closed: true, retained: true, sentLamports: 25 };
    },
    nonzeroVolumeTokenAccounts: () => { throw new Error("terminal retained path must return first"); },
    closeEmptyVolumeTokenAccounts: async () => {},
    drainSolFromWallet: async () => {},
    decryptWallet: (record) => record,
    PublicKey: class PublicKey {},
    invalidateWalletReadCache: () => {},
    getSolBalanceCached: async () => 0,
    pruneVolumeWallet: async () => {}
  });
  const plan = {
    tokenMint: "TOKEN",
    sourcePublicKey: "SOURCE",
    config: { keepDust: true, sweepBack: true },
    cleanupAttemptsByWallet: { GHOST: 6 },
    cleanupStateByWallet: { GHOST: { residuePolicy: "one-token-v1" } },
    lastExternalAction: {
      kind: "cleanup-sell",
      status: "reconciled_from_balances",
      publicKey: "GHOST",
      tokenRawBefore: "3000000",
      expectedRawAfter: "1000000",
      sellRawAmount: "2000000",
      tokenDecimals: 6,
      keepDust: true
    }
  };
  const result = await cleanup(plan, { publicKey: "GHOST" }, 600, () => false, async () => {
    checkpoints += 1;
    return true;
  });
  assert.equal(actionCalls, 0);
  assert.equal(retained, 1);
  assert.ok(checkpoints >= 1);
  assert.equal(plan.cleanupStateByWallet.GHOST.tokenPhase, "retained");
  assert.deepEqual(result, { closed: true, retained: true, sentLamports: 25, sold: false });

  const gasRestartPlan = {
    tokenMint: "TOKEN",
    sourcePublicKey: "SOURCE",
    config: { keepDust: true, sweepBack: true },
    cleanupAttemptsByWallet: { GHOST: 6 },
    cleanupStateByWallet: { GHOST: { residuePolicy: "one-token-v1", sellObserved: false } },
    lastExternalAction: { kind: "cleanup-gas", status: "confirmed", publicKey: "GHOST" }
  };
  const gasRestartResult = await cleanup(gasRestartPlan, { publicKey: "GHOST" }, 600, () => false, async () => true);
  assert.equal(actionCalls, 0);
  assert.equal(gasRestartPlan.cleanupStateByWallet.GHOST.tokenPhase, "retained");
  assert.equal(gasRestartResult.closed, true);
  assert.equal(gasRestartResult.sold, false);
});

test("an already-one-token wallet stays sell-free across an excess-SOL retry", async () => {
  let actionCalls = 0;
  let retained = 0;
  const cleanupState = (plan, publicKey) => {
    plan.cleanupStateByWallet ||= {};
    return (plan.cleanupStateByWallet[publicKey] ||= {});
  };
  const markPhase = (plan, publicKey, phase, details = {}) => Object.assign(
    cleanupState(plan, publicKey), details, { tokenPhase: phase }
  );
  const cleanup = await compileAsyncFunction("cleanupVolumeBotWallet", ["plan", "record", "slippageBps", "noBalance", "persist"], {
    completeVolumeTokenAccountRead: async () => [{ mint: "TOKEN", rawAmount: "1000000", decimals: 6 }],
    volumeBotLogPush: () => {},
    shortMint: (value) => value,
    volumeBotCleanupWalletState: cleanupState,
    volumeBotTargetRawAmount: (accounts) => accounts.reduce((sum, row) => sum + BigInt(row.rawAmount || 0), 0n),
    volumeBotOneTokenRaw: () => ({ decimals: 6, rawAmount: 1000000n }),
    expectedVolumeBotResidueRaw: () => 1000000n,
    applyVolumeBotCleanupStateUpdate: (plan, update) => markPhase(plan, update.publicKey, update.tokenPhase, update),
    runVolumeBotExternalAction: async () => { actionCalls += 1; },
    sellVolumeCleanupToken: async () => { throw new Error("one token must never be sold"); },
    volumeBotTradeOutcomeAmbiguous: () => false,
    volumeBotEnterRecovery: () => {},
    volumeBotNeedsCleanupGas: () => false,
    topUpVolumeCleanupGas: async () => false,
    friendlyError: (error) => String(error?.message || error),
    markVolumeBotCleanupTokenPhase: markPhase,
    retainVolumeWalletAndReturnExcessSol: async () => {
      retained += 1;
      return { closed: retained >= 2, retained: true, sentLamports: retained >= 2 ? 25 : 0 };
    },
    nonzeroVolumeTokenAccounts: () => { throw new Error("residue path must return first"); },
    closeEmptyVolumeTokenAccounts: async () => {},
    drainSolFromWallet: async () => {},
    decryptWallet: (record) => record,
    PublicKey: class PublicKey {},
    invalidateWalletReadCache: () => {},
    getSolBalanceCached: async () => 0,
    pruneVolumeWallet: async () => {}
  });
  const plan = { tokenMint: "TOKEN", sourcePublicKey: "SOURCE", config: { keepDust: true, sweepBack: true } };
  const first = await cleanup(plan, { publicKey: "GHOST" }, 600, () => false, async () => true);
  const second = await cleanup(plan, { publicKey: "GHOST" }, 600, () => false, async () => true);
  assert.equal(actionCalls, 0);
  assert.equal(plan.cleanupStateByWallet.GHOST.sellObserved, false);
  assert.equal(first.sold, false);
  assert.equal(second.sold, false);
  assert.equal(second.closed, true);
});

test("a confirmed keep-dust sell survives stale balance propagation without selling twice", async () => {
  let read = 0;
  let sellClaims = 0;
  let retained = 0;
  let checkpoints = 0;
  const cleanupState = (plan, publicKey) => {
    plan.cleanupStateByWallet ||= {};
    return (plan.cleanupStateByWallet[publicKey] ||= {});
  };
  const expectedResidue = (before, pct) => BigInt(before) - ((BigInt(before) * BigInt(pct)) / 100n);
  const markPhase = (plan, publicKey, phase, details = {}) => Object.assign(
    cleanupState(plan, publicKey), details, { tokenPhase: phase }
  );
  const cleanup = await compileAsyncFunction("cleanupVolumeBotWallet", ["plan", "record", "slippageBps", "noBalance", "persist"], {
    completeVolumeTokenAccountRead: async () => [{
      mint: "TOKEN",
      rawAmount: ["3000000", "3000000", "1000000"][read++] || "1000000",
      decimals: 6
    }],
    volumeBotLogPush: () => {},
    shortMint: (value) => value,
    volumeBotCleanupWalletState: cleanupState,
    volumeBotTargetRawAmount: (accounts) => accounts.reduce((sum, row) => sum + BigInt(row.rawAmount || 0), 0n),
    volumeBotOneTokenRaw: () => ({ decimals: 6, rawAmount: 1000000n }),
    expectedVolumeBotResidueRaw: expectedResidue,
    applyVolumeBotCleanupStateUpdate: (plan, update) => markPhase(plan, update.publicKey, update.tokenPhase, update),
    volumeBotSellPercent: () => 98,
    runVolumeBotExternalAction: async (plan, _persist, action, task) => {
      sellClaims += 1;
      await task();
      plan.lastExternalAction = { ...action, status: "confirmed", completedAt: new Date().toISOString() };
    },
    sellVolumeCleanupToken: async () => ({ tokenAmount: "2000000" }),
    volumeBotTradeOutcomeAmbiguous: () => false,
    volumeBotEnterRecovery: () => {},
    volumeBotNeedsCleanupGas: () => false,
    topUpVolumeCleanupGas: async () => false,
    friendlyError: (error) => String(error?.message || error),
    markVolumeBotCleanupTokenPhase: markPhase,
    retainVolumeWalletAndReturnExcessSol: async () => { retained += 1; return { closed: true, retained: true, sentLamports: 50 }; },
    nonzeroVolumeTokenAccounts: (accounts) => accounts.filter((row) => BigInt(row.rawAmount || 0) > 0n),
    closeEmptyVolumeTokenAccounts: async () => {},
    drainSolFromWallet: async () => {},
    decryptWallet: (record) => record,
    PublicKey: class PublicKey {},
    invalidateWalletReadCache: () => {},
    getSolBalanceCached: async () => 0,
    pruneVolumeWallet: async () => {}
  });
  const plan = { tokenMint: "TOKEN", sourcePublicKey: "SOURCE", config: { keepDust: true, sweepBack: true } };
  const persist = async () => { checkpoints += 1; return true; };
  const first = await cleanup(plan, { publicKey: "GHOST" }, 600, () => false, persist);
  assert.equal(first.closed, false);
  assert.equal(sellClaims, 1);
  assert.equal(plan.cleanupStateByWallet.GHOST?.tokenPhase, undefined);

  const second = await cleanup(plan, { publicKey: "GHOST" }, 600, () => false, persist);
  assert.equal(second.closed, true);
  assert.equal(second.retained, true);
  assert.equal(sellClaims, 1);
  assert.equal(retained, 1);
  assert.equal(plan.cleanupStateByWallet.GHOST.tokenPhase, "residue");
  assert.ok(checkpoints >= 1);
});

test("a confirmed exact migration overrides legacy residue state and cannot replay after a crash", async () => {
  let read = 0;
  let sellClaims = 0;
  let retained = 0;
  const cleanupState = (plan, publicKey) => {
    plan.cleanupStateByWallet ||= {};
    return (plan.cleanupStateByWallet[publicKey] ||= {});
  };
  const markPhase = (plan, publicKey, phase, details = {}) => Object.assign(
    cleanupState(plan, publicKey), details, { tokenPhase: phase }
  );
  const cleanup = await compileAsyncFunction("cleanupVolumeBotWallet", ["plan", "record", "slippageBps", "noBalance", "persist"], {
    completeVolumeTokenAccountRead: async () => [{
      mint: "TOKEN",
      rawAmount: read++ === 0 ? "3000000" : "1000000",
      decimals: 6
    }],
    volumeBotLogPush: () => {},
    shortMint: (value) => value,
    volumeBotCleanupWalletState: cleanupState,
    volumeBotTargetRawAmount: (accounts) => accounts.reduce((sum, row) => sum + BigInt(row.rawAmount || 0), 0n),
    volumeBotOneTokenRaw: () => ({ decimals: 6, rawAmount: 1000000n }),
    expectedVolumeBotResidueRaw: (before, pct) => BigInt(before) - ((BigInt(before) * BigInt(pct)) / 100n),
    applyVolumeBotCleanupStateUpdate: (plan, update) => markPhase(plan, update.publicKey, update.tokenPhase, update),
    runVolumeBotExternalAction: async () => { sellClaims += 1; },
    sellVolumeCleanupToken: async () => { throw new Error("confirmed exact sell must not replay"); },
    volumeBotTradeOutcomeAmbiguous: () => false,
    volumeBotEnterRecovery: () => {},
    volumeBotNeedsCleanupGas: () => false,
    topUpVolumeCleanupGas: async () => false,
    friendlyError: (error) => String(error?.message || error),
    markVolumeBotCleanupTokenPhase: markPhase,
    retainVolumeWalletAndReturnExcessSol: async () => {
      retained += 1;
      return { closed: true, retained: true, sentLamports: 25 };
    },
    nonzeroVolumeTokenAccounts: (accounts) => accounts.filter((row) => BigInt(row.rawAmount || 0) > 0n),
    closeEmptyVolumeTokenAccounts: async () => {},
    drainSolFromWallet: async () => {},
    decryptWallet: (record) => record,
    PublicKey: class PublicKey {},
    invalidateWalletReadCache: () => {},
    getSolBalanceCached: async () => 0,
    pruneVolumeWallet: async () => {}
  });
  const plan = {
    tokenMint: "TOKEN",
    sourcePublicKey: "SOURCE",
    config: { keepDust: true, sweepBack: true },
    cleanupAttemptsByWallet: { GHOST: 6 },
    cleanupStateByWallet: {
      GHOST: { tokenPhase: "residue", expectedRawAfter: "60000", sellPercent: 98, keepDust: true }
    },
    lastExternalAction: {
      kind: "cleanup-sell",
      status: "confirmed",
      publicKey: "GHOST",
      tokenRawBefore: "3000000",
      expectedRawAfter: "1000000",
      sellRawAmount: "2000000",
      tokenDecimals: 6,
      keepDust: true,
      completedAt: new Date().toISOString()
    }
  };
  const first = await cleanup(plan, { publicKey: "GHOST" }, 600, () => false, async () => true);
  assert.equal(first.closed, false);
  assert.equal(plan.cleanupStateByWallet.GHOST.tokenPhase, "sell-confirmed");
  const second = await cleanup(plan, { publicKey: "GHOST" }, 600, () => false, async () => true);
  assert.equal(sellClaims, 0);
  assert.equal(retained, 1);
  assert.equal(second.closed, true);
  assert.equal(second.sold, true);
  assert.equal(plan.cleanupStateByWallet.GHOST.tokenPhase, "residue");
});

test("a confirmed full cleanup sell survives stale balance propagation without selling twice", async () => {
  let read = 0;
  let sellClaims = 0;
  let drains = 0;
  let prunes = 0;
  const rawReads = ["100", "100", "0", "0", "0"];
  const cleanupState = (plan, publicKey) => {
    plan.cleanupStateByWallet ||= {};
    return (plan.cleanupStateByWallet[publicKey] ||= {});
  };
  const markPhase = (plan, publicKey, phase, details = {}) => Object.assign(
    cleanupState(plan, publicKey), details, { tokenPhase: phase }
  );
  const cleanup = await compileAsyncFunction("cleanupVolumeBotWallet", ["plan", "record", "slippageBps", "noBalance", "persist"], {
    completeVolumeTokenAccountRead: async () => {
      const rawAmount = rawReads[read++] || "0";
      return rawAmount === "0" ? [] : [{ mint: "TOKEN", rawAmount }];
    },
    volumeBotLogPush: () => {},
    shortMint: (value) => value,
    volumeBotCleanupWalletState: cleanupState,
    volumeBotTargetRawAmount: (accounts) => accounts.reduce((sum, row) => sum + BigInt(row.rawAmount || 0), 0n),
    volumeBotOneTokenRaw: () => ({ decimals: 0, rawAmount: 1n }),
    expectedVolumeBotResidueRaw: (before, pct) => BigInt(before) - ((BigInt(before) * BigInt(pct)) / 100n),
    applyVolumeBotCleanupStateUpdate: (plan, update) => markPhase(plan, update.publicKey, update.tokenPhase, update),
    volumeBotSellPercent: () => 100,
    runVolumeBotExternalAction: async (plan, _persist, action, task) => {
      sellClaims += 1;
      await task();
      const { keepDust: _omittedFalse, ...durableAction } = action;
      plan.lastExternalAction = { ...durableAction, status: "confirmed", completedAt: new Date().toISOString() };
    },
    sellVolumeCleanupToken: async () => ({ tokenAmount: "100" }),
    volumeBotTradeOutcomeAmbiguous: () => false,
    volumeBotEnterRecovery: () => {},
    volumeBotNeedsCleanupGas: () => false,
    topUpVolumeCleanupGas: async () => false,
    friendlyError: (error) => String(error?.message || error),
    markVolumeBotCleanupTokenPhase: markPhase,
    retainVolumeWalletAndReturnExcessSol: async () => { throw new Error("full cleanup must not retain"); },
    nonzeroVolumeTokenAccounts: (accounts) => accounts.filter((row) => BigInt(row.rawAmount || 0) > 0n),
    closeEmptyVolumeTokenAccounts: async () => {},
    drainSolFromWallet: async () => { drains += 1; return { sentLamports: 50 }; },
    decryptWallet: (record) => record,
    PublicKey: class PublicKey { constructor(value) { this.value = value; } },
    invalidateWalletReadCache: () => {},
    getSolBalanceCached: async () => 0,
    pruneVolumeWallet: async () => { prunes += 1; }
  });
  const plan = { tokenMint: "TOKEN", sourcePublicKey: "SOURCE", config: { keepDust: false, sweepBack: true } };
  const first = await cleanup(plan, { publicKey: "GHOST" }, 600, () => false, async () => true);
  assert.equal(first.closed, false);
  assert.equal(sellClaims, 1);

  const second = await cleanup(plan, { publicKey: "GHOST" }, 600, () => false, async () => true);
  assert.equal(second.closed, true);
  assert.equal(second.retained, false);
  assert.equal(sellClaims, 1);
  assert.equal(drains, 1);
  assert.equal(prunes, 1);
  assert.equal(plan.cleanupStateByWallet.GHOST.tokenPhase, "empty");
});

test("fixed-pool start reserves durable state before its one funding submission", () => {
  const start = functionBody("webStartVolumeBotCore");
  const reserveAt = start.indexOf("reserveVolumeBotPlan(plan)", start.indexOf("// --- Fixed-pool mode"));
  const fundingBoundaryAt = start.indexOf('saved.startStage = "funding"', reserveAt);
  const sendAt = start.indexOf("await webSendSolMany(", fundingBoundaryAt);
  assert.ok(reserveAt >= 0 && reserveAt < fundingBoundaryAt && fundingBoundaryAt < sendAt);
  assert.match(start, /botStage: "starting"/);
  assert.match(start, /startStage: "reserved"/);
  assert.match(start, /sendAttemptId: `volume-fund-\$\{plan\.id\}`/);
  assert.match(start, /funding-ambiguous/);
  assert.match(start, /createFixedVolumeWalletSet/);
  assert.match(start, /volumePlanId: plan\.id/);
  assert.match(functionBody("reserveVolumeBotPlan"), /mutateTradePlans/);
  assert.match(functionBody("createFixedVolumeWalletSet"), /record\.ephemeral = true/);
});

test("Stop during fixed-wallet funding waits for late landing and cannot resurrect after release", () => {
  const start = functionBody("webStartVolumeBotCore");
  const stop = functionBody("webStopVolumeBot");
  const release = functionBody("webHaltAndReleaseVolumeBot");
  assert.match(stop, /const fundingRecovery = \["funding", "funding-ambiguous"\]\.includes\(startStage\)/);
  assert.match(stop, /const sweepBack = fundingRecovery \|\| plan\.config\?\.sweepBack !== false/);
  assert.match(stop, /plan\.startStage = "funding-ambiguous"/);
  assert.match(stop, /plan\.recoveryNotBeforeAt = new Date\(recoveryAt\)\.toISOString\(\)/);
  assert.match(stop, /plan\.nextActionAt = plan\.recoveryNotBeforeAt/);
  assert.match(release, /startStage === "funding"/);
  assert.match(release, /startStage === "funding-ambiguous" && Date\.now\(\) < settleAt/);
  assert.match(start, /saved\.forceReleasedAt[\s\S]{0,180}saved\.status === "completed"/);
  assert.match(start, /saved\.startStage = "funded-after-release"/);
  assert.match(start, /saved\.startStage = "funded-after-stop"/);
  assert.match(start, /saved\.recoveryNotBeforeAt = null/);
  assert.match(start, /if \(!terminalAfterFunding && \(fundingStarted/);
});

test("active volume plans reject any overlapping source, trading, active, or pool wallet", () => {
  const keys = functionBody("volumePlanWalletPublicKeys");
  assert.match(keys, /sourcePublicKey/);
  assert.match(keys, /activeWalletPublicKey/);
  assert.match(keys, /tradingPublicKeys/);
  assert.match(keys, /plan\.pool/);
  const guard = functionBody("assertVolumePlanCanReserve");
  assert.match(guard, /volumePlanWalletOverlap/);
  assert.match(guard, /already reserved by another active volume bot/);
});

test("unknown trade outcomes stop new activity and delay balance-driven recovery", () => {
  const recovery = functionBody("volumeBotEnterRecovery");
  assert.match(recovery, /plan\.botStage = "sweeping"/);
  assert.match(recovery, /recoveryNotBeforeAt/);
  assert.match(recovery, /New trades stopped/);
  const processor = functionBody("processVolumeBotPlan");
  assert.match(processor, /volumeBotTradeOutcomeAmbiguous\(error\)/);
  assert.match(processor, /plan\.botStage === "running" && \(wantBuy \|\| !didSell\)/);
  assert.match(processor, /plan\.recoveryNotBeforeAt = new Date\(now \+ VOLUME_BOT_RECOVERY_SETTLE_MS\)/);
  assert.match(processor, /plan\.nextActionAt = plan\.recoveryNotBeforeAt/);
  assert.match(processor, /if \(typeof persist === "function"\) await persist\(\);\s*return \{ changed: true \};/);
  const rolling = functionBody("runRollingVolumeBotStep");
  assert.match(rolling, /volumeBotEnterRecovery\(plan, "Rolling fund\/buy"/);
  assert.match(rolling, /volumeBotEnterRecovery\(plan, "Rolling sell"/);
});

test("Pump pool simulation failures are pre-submit and can try the next pool", () => {
  const classify = new Function("error", functionBody("tradeFailureDefinitelyPreSubmit"));
  assert.equal(classify(new Error("Transaction simulation failed: custom program error: 0x1788")), true);
  assert.equal(classify(new Error("Transaction results in an account with insufficient funds")), true);
  const landed = new Error("sell failed on-chain");
  landed.signature = "confirmed-signature";
  assert.equal(classify(landed), false);
  assert.equal(classify(new Error("network timeout while sending")), false);

  for (const name of ["buyTokenViaPumpPortal", "sellTokenAmountFromWalletViaPumpPortal"]) {
    const body = functionBody(name);
    assert.match(body, /tradeFailureDefinitelyPreSubmit\(tradeError\)/);
    assert.match(body, /&& !definitelyPreSubmit/);
  }

  const exactSell = functionBody("sellTokenAmountFromWalletViaPumpPortal");
  assert.match(exactSell, /exactTokenAmount = Number\(exactTokenUiAmount\)/);
  assert.match(exactSell, /amount: hasExactTokenAmount[\s\S]{0,80}\? exactTokenAmount/);
});

test("rolling volume forces sells and can replenish cleanup gas", () => {
  const rolling = functionBody("runRollingVolumeBotStep");
  assert.match(rolling, /plan\.pool\.length >= poolTarget \|\| consecutiveBuys >= 2/);
  assert.match(rolling, /plan\.consecutiveBuys = consecutiveBuys \+ 1/);
  assert.match(rolling, /plan\.consecutiveBuys = 0/);

  const cleanup = functionBody("cleanupVolumeBotWallet");
  assert.match(cleanup, /volumeBotNeedsCleanupGas\(error\)/);
  assert.match(cleanup, /topUpVolumeCleanupGas\(plan, record, persist\)/);
  const topUp = functionBody("topUpVolumeCleanupGas");
  assert.match(topUp, /kind: "cleanup-gas"/);
  assert.match(topUp, /volumeBotTransferSol\(source, record\.publicKey, needed\)/);
});

test("volume cleanup uses locked fallback exits and eventually releases a stuck run safely", () => {
  const sell = functionBody("sellVolumeCleanupToken");
  assert.match(sell, /withExitSellLock/);
  assert.match(sell, /exitSlippageAttemptList\(baseSlippageBps, true\)/);
  assert.match(sell, /priceExit: true/);
  assert.match(sell, /error\?\.sellPreSubmit !== true/);

  const cleanup = functionBody("cleanupVolumeBotWallet");
  assert.match(cleanup, /runVolumeBotExternalAction/);
  assert.match(cleanup, /cleanupAttemptsByWallet/);
  assert.match(cleanup, /const maxCleanupAttempts = 6/);
  assert.match(cleanup, /priorCleanupAttempts >= maxCleanupAttempts/);
  assert.match(cleanup, /attempts >= maxCleanupAttempts/);
  assert.match(cleanup, /retainVolumeWalletAndReturnExcessSol/);
  assert.ok(cleanup.indexOf("priorCleanupAttempts >= maxCleanupAttempts")
    < cleanup.indexOf("runVolumeBotExternalAction(plan, persist"));
  assert.ok(cleanup.indexOf('if (typeof persist === "function") await persist();')
    < cleanup.indexOf("runVolumeBotExternalAction(plan, persist"));

  const retain = functionBody("retainVolumeWalletAndReturnExcessSol");
  assert.match(retain, /VOLUME_BOT_CLEANUP_GAS_LAMPORTS/);
  assert.match(retain, /kind: "cleanup-excess-sol"/);
  assert.match(retain, /retained: true/);
  assert.doesNotMatch(retain, /pruneVolumeWallet/);
});

test("the durable worker lease permits every recovery action while sweeping", () => {
  const worker = functionBody("processTradePlans");
  assert.match(worker, /botStage === "sweeping"/);
  assert.match(worker, /"cleanup-sell"/);
  assert.match(worker, /"cleanup-gas"/);
  assert.match(worker, /"cleanup-excess-sol"/);
  assert.match(worker, /botStage === "running" \|\| cleanupClaim/);
});

test("settled volume actions clear unknown checkpoints from complete live balances", () => {
  const reconcile = functionBody("reconcileSettledVolumeAction");
  assert.match(reconcile, /pending\?\.status[\s\S]{0,100}!== "outcome_unknown"/);
  assert.doesNotMatch(reconcile, /\["submitting", "outcome_unknown"\]/);
  assert.match(reconcile, /volumeBotRecoverySettleAtMs\(plan, pending\)/);
  assert.match(reconcile, /completeVolumeTokenAccountRead/);
  assert.match(reconcile, /getSolBalanceCached/);
  assert.match(reconcile, /"sell", "offset-sell", "rolling-sell", "cleanup-sell"/);
  assert.match(reconcile, /targetStillHeld/);
  assert.match(reconcile, /!soldOut && !cleanupSellProgressed && now < settleAt/);
  assert.match(reconcile, /markVolumeBotCleanupTokenPhase/);
  assert.match(reconcile, /status: "reconciled_from_balances"/);
  assert.match(reconcile, /plan\.pendingAction = null/);
  assert.match(reconcile, /plan\.recoveryNotBeforeAt = null/);
  assert.match(functionBody("processVolumeBotPlan"), /await reconcileSettledVolumeAction\(plan, walletStore, persist\)/);
});

test("the legacy false cleanup claim in the screenshot reconciles immediately from zero balance", async () => {
  let persisted = 0;
  const cleanupState = (plan, publicKey) => {
    plan.cleanupStateByWallet ||= {};
    return (plan.cleanupStateByWallet[publicKey] ||= {});
  };
  const reconcile = await compileAsyncFunction("reconcileSettledVolumeAction", ["plan", "walletStore", "persist"], {
    walletsForOwner: (store) => store.wallets,
    completeVolumeTokenAccountRead: async () => [],
    getSolBalanceCached: async () => 100,
    PublicKey: class PublicKey { constructor(value) { this.value = value; } },
    volumeBotTargetRawAmount: () => 0n,
    markVolumeBotCleanupTokenPhase: (plan, publicKey, phase) => Object.assign(cleanupState(plan, publicKey), { tokenPhase: phase }),
    volumeBotRecoverySettleAtMs: () => Date.now() + 90_000,
    volumeBotLogPush: () => {},
    shortMint: (value) => value
  });
  const plan = {
    botStage: "sweeping",
    tokenMint: "TOKEN",
    volumeActionSeq: 4,
    recoveryNotBeforeAt: new Date(Date.now() + 60_000).toISOString(),
    pendingAction: { kind: "cleanup-sell", status: "outcome_unknown", publicKey: "GHOST", sequence: 4, claimToken: "old-bogus-claim" }
  };
  const reconciled = await reconcile(plan, { wallets: [{ publicKey: "GHOST" }] }, async () => { persisted += 1; });
  assert.equal(reconciled, true);
  assert.equal(plan.pendingAction, null);
  assert.equal(plan.volumeActionSeq, 5);
  assert.equal(plan.lastExternalAction.status, "reconciled_from_balances");
  assert.equal(plan.cleanupStateByWallet.GHOST.tokenPhase, "empty");
  assert.equal(persisted, 1);
});

test("a proven-empty rolling sweep reconciles to completed before list or restart", () => {
  const reconcile = functionBody("reconcileFinishedRollingVolumeBots");
  assert.match(reconcile, /plan\.config\?\.rollingWallets/);
  assert.match(reconcile, /planHasLiveCustody/);
  assert.match(reconcile, /pool\.length \|\| plan\.activeWalletPublicKey \|\| plan\.pendingAction\?\.publicKey/);
  assert.match(reconcile, /wallet\.volumePlanId/);
  assert.match(reconcile, /plan\.botStage = "done"/);
  assert.match(reconcile, /plan\.status = "completed"/);
  assert.match(reconcile, /plan\.pendingAction = null/);

  assert.match(functionBody("webStartVolumeBotCore"), /await reconcileFinishedRollingVolumeBots\(userId\)/);
  assert.match(functionBody("webVolumeBotRows"), /await reconcileFinishedRollingVolumeBots\(userId\)/);
});

test("rolling wallets and every fixed trade checkpoint before external money moves", () => {
  const rolling = functionBody("runRollingVolumeBotStep");
  const poolAt = rolling.indexOf("plan.pool.push(poolEntry)");
  const persistAt = rolling.indexOf("await persist()", poolAt);
  const fundAt = rolling.indexOf("volumeBotTransferSol(sourceRecord", poolAt);
  assert.ok(poolAt >= 0 && persistAt > poolAt && fundAt > persistAt);
  assert.match(rolling.slice(fundAt - 220, fundAt + 900), /kind: "rolling-fund"/);
  assert.match(rolling.slice(fundAt, fundAt + 1_500), /kind: "rolling-buy"/);
  assert.match(rolling, /\["funding", "funded"\]/);
  assert.match(rolling, /Recovered rolling fund\/buy/);

  const external = functionBody("runVolumeBotExternalAction");
  assert.match(external, /status: "submitting"/);
  assert.ok(external.indexOf("volumeActionClaim: pending") < external.indexOf("await task()"));
  assert.match(external, /claimToken: crypto\.randomUUID\(\)/);
  assert.match(external, /volumeActionResolution/);
  assert.match(external, /status: "outcome_unknown"/);

  const processor = functionBody("processVolumeBotPlan");
  assert.match(processor, /plan\.pendingAction\?\.status === "submitting"/);
  assert.match(processor, /runVolumeBotExternalAction\(plan, persist/);
});

test("volume actions use a locked monotonic claim and a stopped bot cannot submit", () => {
  const runner = functionBody("processTradePlans");
  assert.match(runner, /checkpoint\?\.volumeActionClaim/);
  assert.match(runner, /return mutateTradePlans/);
  assert.match(runner, /savedSequence !== expectedSequence/);
  assert.match(runner, /existing\?\.claimToken !== pending\.claimToken/);
  assert.match(runner, /checkpoint\?\.volumeActionResolution/);
  assert.match(runner, /saved\.volumeActionSeq = nextSequence/);
  assert.match(runner, /botStage === "running"/);
  assert.match(runner, /botStage === "sweeping"[\s\S]{0,220}"cleanup-sell"[\s\S]{0,120}"cleanup-gas"[\s\S]{0,120}"cleanup-excess-sol"/);
  assert.match(runner, /\["sweeping", "done", "stopped"\]/);
  assert.match(runner, /processVolumeBotPlan\(plan, walletStore, persistPlanCheckpoint\)/);
  assert.doesNotMatch(runner, /processVolumeBotPlan\(plan, walletStore, async \(\) =>/);

  const merge = functionBody("writeTradePlansPreservingNewPlans");
  assert.match(merge, /incomingSequence < currentSequence/);
  assert.match(merge, /currentClaim\?\.claimToken/);
  assert.match(merge, /!initialVolumePlanStates\.has\(incoming\.id\)/);
});

test("cleanup target raw balance totals every matching token account", () => {
  const total = new Function("accounts", "tokenMint", functionBody("volumeBotTargetRawAmount"));
  assert.equal(total([
    { mint: "TARGET", rawAmount: "7" },
    { mint: "OTHER", rawAmount: "999" },
    { mint: "TARGET", rawAmount: "5" },
    { mint: "TARGET", rawAmount: "bad" }
  ], "TARGET"), 12n);

  const oneToken = new Function("accounts", "tokenMint", functionBody("volumeBotOneTokenRaw"));
  assert.deepEqual(oneToken([{ mint: "TARGET", rawAmount: "3000000", decimals: 6 }], "TARGET"), {
    decimals: 6,
    rawAmount: 1000000n
  });
});

test("a sweeping worker can persist removal of a sold ghost without losing stop safety", () => {
  const merge = new Function("current", "incoming", "initial", functionBody("mergeVolumePlanAcrossStop"));
  const current = {
    id: "volume-1",
    status: "volume_bot",
    botStage: "sweeping",
    config: { keepDust: false },
    manualRecoveryRequestedAt: "manual",
    pool: [{ publicKey: "sold" }, { publicKey: "remaining" }],
    tradingPublicKeys: ["sold", "remaining"]
  };
  const initial = {
    botStage: "sweeping",
    manualRecoveryRequestedAt: "manual",
    pool: current.pool.map((entry) => ({ ...entry }))
  };
  const advanced = merge(current, {
    ...current,
    botStage: "sweeping",
    config: { keepDust: true },
    pool: [{ publicKey: "remaining" }]
  }, initial);
  assert.deepEqual(advanced.pool.map((entry) => entry.publicKey), ["remaining"]);
  assert.equal(advanced.config.keepDust, false);
  assert.equal(advanced.manualRecoveryRequestedAt, "manual");

  const completed = merge(current, { ...current, status: "completed", botStage: "done", pool: [] }, initial);
  assert.equal(completed.status, "completed");
  assert.equal(completed.botStage, "done");
  assert.deepEqual(completed.pool, []);

  const stopped = merge(current, {
    ...current,
    status: "volume_bot",
    botStage: "running",
    pool: [...current.pool, { publicKey: "discovered" }]
  }, initial);
  assert.equal(stopped.botStage, "sweeping");
  assert.deepEqual(stopped.pool.map((entry) => entry.publicKey), ["sold", "remaining", "discovered"]);

  const concurrent = merge(
    { ...current, pool: [...current.pool, { publicKey: "concurrent" }] },
    { ...current, status: "completed", botStage: "done", pool: [] },
    initial
  );
  assert.equal(concurrent.botStage, "sweeping");
  assert.deepEqual(concurrent.pool.map((entry) => entry.publicKey), ["concurrent"]);
  assert.deepEqual(concurrent.tradingPublicKeys, ["sold", "remaining", "concurrent"]);

  const manualRecoveryWonRace = merge(
    { ...current, manualRecoveryRequestedAt: "new-manual-sweep" },
    { ...current, status: "completed", botStage: "done", pool: [] },
    initial
  );
  assert.equal(manualRecoveryWonRace.botStage, "sweeping");
  assert.deepEqual(manualRecoveryWonRace.pool.map((entry) => entry.publicKey), ["sold", "remaining"]);

  const stopWonRace = merge(
    current,
    { ...current, status: "completed", botStage: "done", pool: [] },
    { botStage: "running", pool: current.pool.map((entry) => ({ ...entry })) }
  );
  assert.equal(stopWonRace.botStage, "sweeping");
  assert.deepEqual(stopWonRace.pool.map((entry) => entry.publicKey), ["sold", "remaining"]);

  const fixed = merge(
    { ...current, pool: [], sweepCursor: 0, tradingPublicKeys: ["a", "b"] },
    { ...current, pool: [], sweepCursor: 1, tradingPublicKeys: ["a", "b"] },
    { botStage: "sweeping", pool: [] }
  );
  assert.equal(fixed.sweepCursor, 1);
});

test("manual background recovery schedules an immediate safe worker pass", () => {
  const sweep = functionBody("webSweepBackgroundWallets");
  assert.match(sweep, /scheduleTradePlanProcessing\("Manual volume recovery", \[25, 1000, 5000\]\)/);
});

test("fixed ghost keys remain discoverable across a crash before plan attachment", () => {
  const create = functionBody("createFixedVolumeWalletSet");
  assert.match(create, /mutateWalletStore/);
  assert.match(create, /record\.ephemeral = true/);
  assert.match(create, /record\.volumePlanId = String\(volumePlanId/);

  const processor = functionBody("processVolumeBotPlan");
  assert.match(processor, /wallet\.volumePlanId/);
  assert.match(processor, /orphanedGhostKeys/);
  assert.match(processor, /failed-before-funding/);
  assert.match(processor, /plan\.botStage = "sweeping"/);
});

test("Jito exit recovery counts only wallets actually armed or already covered", () => {
  const arm = functionBody("webArmExitsForExistingPositions");
  assert.match(arm, /returnCoverageDetails/);
  assert.match(arm, /alreadyCoveredWalletPublicKeys/);
  const reconcile = functionBody("reconcileJitoAtomicExitIntents");
  assert.match(reconcile, /Number\(armedResult\?\.walletCount/);
  assert.match(reconcile, /result\.failed \+= walletPublicKeys\.length - armed/);
  assert.doesNotMatch(reconcile, /result\.armed \+= walletPublicKeys\.length/);
});

test("trade-plan runners never clear a live lock or race the dedicated worker", () => {
  const runner = functionBody("processTradePlans");
  assert.doesNotMatch(runner, /clearing stale runner lock/);
  assert.doesNotMatch(runner, /tradePlanRunnerActive = false[\s\S]{0,120}tradePlanRunnerActive = true/);
  const schedule = functionBody("scheduleTradePlanProcessing");
  assert.match(schedule, /!webLocalTpSlReconcileEnabled\(\)/);
  assert.match(schedule, /processTradePlansWithLease/);
  const lease = functionBody("processTradePlansWithLease");
  assert.match(lease, /runWorkerTask\("tradePlans"/);
  assert.match(lease, /leaseMs: 300_000/);
});

test("rolling ghost creation is locked, plan-stamped, and every money step is claimed", () => {
  const create = functionBody("createEphemeralVolumeWallet");
  assert.match(create, /return mutateWalletStore/);
  assert.match(create, /record\.volumePlanId = String\(volumePlanId\)/);
  assert.doesNotMatch(create, /readWalletStore\(|writeWalletStore\(/);

  const rolling = functionBody("runRollingVolumeBotStep");
  assert.match(rolling, /typeof entry === "string" \? \{ publicKey: entry/);
  assert.match(rolling, /createEphemeralVolumeWallet\([\s\S]{0,180}plan\.id/);
  assert.match(rolling, /kind: "rolling-fund"/);
  assert.match(rolling, /kind: "rolling-buy"/);
  assert.match(rolling, /if \(active === false \|\| plan\.botStage !== "running"\) return/);
});

test("manual release wins stale workers and residue recovery keeps exactly one target token", () => {
  const merge = functionBody("mergeVolumePlanAcrossStop");
  assert.match(merge, /if \(current\?\.forceReleasedAt\)/);
  assert.match(merge, /pendingAction: null/);
  assert.match(merge, /status: "completed"/);
  assert.match(merge, /botStage: "stopped"/);

  const release = functionBody("webHaltAndReleaseVolumeBot");
  assert.match(release, /pendingStatus === "submitting"[\s\S]{0,220}throw volumeBotConflict/);
  assert.match(release, /pending && pendingStatus === "outcome_unknown"/);
  assert.match(release, /plan\.forceReleasedAt/);

  const sweep = functionBody("webSweepBackgroundWallets");
  assert.match(sweep, /recoveryPolicyByWallet/);
  assert.match(sweep, /preserveOneToken/);
  assert.match(sweep, /BigInt\(token\.rawAmount \|\| 0\) - oneTokenRaw/);
  assert.match(sweep, /retainedTargetRaw <= retainedUnit/);
  assert.match(sweep, /VOLUME_BOT_CLEANUP_GAS_LAMPORTS/);
  assert.match(sweep, /row\.retainedResidue = true/);
  assert.match(sweep, /cleared = await mutateWalletStore/);
});

test("legacy cleanup claims without a token still terminate after verified no progress", () => {
  const reconcile = functionBody("reconcileSettledVolumeAction");
  assert.match(reconcile, /const noProgressClaimToken = firstString/);
  assert.match(reconcile, /pending\.id/);
  assert.match(reconcile, /VOLUME_BOT_MAX_CLEANUP_ATTEMPTS/);
  assert.match(reconcile, /status: "reconciled_from_balances"/);
  assert.match(reconcile, /plan\.lastExternalAction\.status = "reconciled_no_progress"/);
});
