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

test("volume cleanup requires complete fresh reads of both token programs", () => {
  const complete = functionBody("completeVolumeTokenAccountRead");
  assert.match(complete, /force: true, priority: true/);
  assert.match(complete, /lookup\?\.stale/);
  assert.match(complete, /successes \|\| 0\) !== 2/);
  assert.match(complete, /warnings\.length/);

  const cleanup = functionBody("cleanupVolumeBotWallet");
  const verifyAt = cleanup.indexOf("completeVolumeTokenAccountRead(publicKey)");
  const drainAt = cleanup.indexOf("drainSolFromWallet(");
  const pruneAt = cleanup.indexOf("pruneVolumeWallet(");
  assert.ok(verifyAt >= 0 && verifyAt < drainAt && drainAt < pruneAt);
  assert.match(cleanup, /nonzeroVolumeTokenAccounts\(tokenAccounts\)/);
  assert.match(cleanup, /afterClose\.length/);
  assert.match(cleanup, /remainingAccounts\.length/);
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

test("rolling wallets and every fixed trade checkpoint before external money moves", () => {
  const rolling = functionBody("runRollingVolumeBotStep");
  const poolAt = rolling.indexOf("plan.pool.push(poolEntry)");
  const persistAt = rolling.indexOf("await persist()", poolAt);
  const fundAt = rolling.indexOf("await volumeBotTransferSol(", poolAt);
  assert.ok(poolAt >= 0 && persistAt > poolAt && fundAt > persistAt);
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
  assert.match(runner, /botStage === "sweeping"[\s\S]{0,100}pending\?\.kind[\s\S]{0,80}"cleanup-gas"/);
  assert.match(runner, /\["sweeping", "done", "stopped"\]/);

  const merge = functionBody("writeTradePlansPreservingNewPlans");
  assert.match(merge, /incomingSequence < currentSequence/);
  assert.match(merge, /currentClaim\?\.claimToken/);
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
