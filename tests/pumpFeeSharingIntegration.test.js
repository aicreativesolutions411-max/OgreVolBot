import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

function functionBody(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist`);
  const signatureEnd = source.indexOf(") {", start);
  assert.notEqual(signatureEnd, -1, `${name} should have a function body`);
  const brace = signatureEnd + 2;
  let depth = 0;
  for (let index = brace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`${name} body is incomplete`);
}

test("Pump holder launches attach the official fee-sharing lifecycle after launch confirmation", () => {
  assert.match(server, /from "\.\/lib\/pumpFeeSharing\.js"/);
  const attach = functionBody(server, "attachPumpHolderRewardFeeSharingToLaunch");
  assert.match(attach, /reconcilePumpHolderRewardFeeSharing/);
  assert.match(attach, /const initialFeeSharing = existing\?\.pumpFeeSharing \|\|/);
  assert.match(attach, /pumpFeeSharing: initialFeeSharing/);
  assert.match(attach, /Coin launched\. Official holder-reward fee sharing is pending/);
  assert.match(attach, /warnings:/);

  const launch = functionBody(server, "webLaunchPumpCoin");
  const intentIndex = launch.indexOf("pumpFeeSharingIntent: basePayload.pumpFeeSharingIntent");
  const launchIndex = launch.indexOf("await webLaunchPumpJitoBundle");
  assert.ok(intentIndex >= 0 && launchIndex > intentIndex, "official accounting intent must be durable before launch submission");
  assert.match(launch, /result = await attachPumpHolderRewardFeeSharingToLaunch\(userId, basePayload, result\)/);
  assert.match(launch, /attachPumpHolderRewardFeeSharingToLaunch\(userId, basePayload, genericWithCollection\)/);
  assert.match(launch, /PUMP_CASHBACK_HOLDER_REWARDS_CONFLICT/);
});

test("official per-mint holder fees never fall back into wallet-wide legacy attribution", () => {
  const attribution = functionBody(server, "pumpCreatorRewardAttribution");
  assert.match(attribution, /launchHolderRewardsFromAttempt\(attempt\)\.enabled && !pumpUsesOfficialHolderFeeSharing\(attempt\)/);

  const publicLaunch = functionBody(server, "pumpCreatorObligationPublicLaunch");
  assert.match(publicLaunch, /&& !pumpUsesOfficialHolderFeeSharing\(attempt\)/);

  const legacyDistribution = functionBody(server, "distributeAttributedPumpCreatorRewards");
  assert.match(legacyDistribution, /policy\.enabled && !pumpUsesOfficialHolderFeeSharing\(launch\)/);
  assert.match(legacyDistribution, /reason: "dedicated_fee_sharing_vault"/);
});

test("per-mint holder vault is encrypted before official setup and never silently replaced", () => {
  assert.match(server, /const PUMP_HOLDER_REWARD_VAULT_OWNER = "__pump_holder_reward_vaults__"/);
  const ensure = functionBody(server, "ensurePumpHolderRewardVault");
  assert.match(ensure, /mutateWalletStore/);
  assert.match(ensure, /walletRecord\(label, Keypair\.generate\(\), PUMP_HOLDER_REWARD_VAULT_OWNER\)/);
  assert.match(ensure, /kind: "pump_holder_reward_vault"/);
  assert.match(ensure, /Encrypted holder-reward vault[\s\S]*is missing/);
  assert.match(ensure, /patchPumpFeeSharingState/);
});

test("fee-sharing setup persists a signed intent before broadcast and reconciles retries on chain", () => {
  const submit = functionBody(server, "submitPumpFeeSharingSetupTransaction");
  const persistIndex = submit.indexOf("await patchPumpFeeSharingState");
  const broadcastIndex = submit.indexOf("connection.sendRawTransaction");
  assert.ok(persistIndex >= 0 && broadcastIndex > persistIndex, "signed setup must be durable before broadcast");
  assert.match(submit, /setupSignature: signedSignature/);
  assert.match(submit, /setupLastValidBlockHeight: latest\.lastValidBlockHeight/);
  assert.match(submit, /backupConnection\.sendRawTransaction\(raw/);

  const disposition = functionBody(server, "pumpFeeSharingSubmissionDisposition");
  assert.match(disposition, /getSignatureStatus\(signature, \{ searchTransactionHistory: true \}\)/);
  assert.match(disposition, /getBlockHeight\("confirmed"\)/);
  assert.match(disposition, /expired_unseen/);

  const reconcile = functionBody(server, "reconcilePumpHolderRewardFeeSharing");
  const legacyGuardIndex = reconcile.indexOf("!pumpUsesOfficialHolderFeeSharing(attempt)");
  const setupIndex = reconcile.indexOf("buildPumpHolderRewardsFeeSharingSetup");
  assert.ok(legacyGuardIndex >= 0 && setupIndex > legacyGuardIndex, "legacy launches must fail closed before official setup");
  assert.match(reconcile, /legacy_holder_rewards_require_explicit_migration/);
  assert.match(reconcile, /buildPumpHolderRewardsFeeSharingSetup/);
  assert.match(reconcile, /buildPumpFeeSharingOneTimeUpdateInstruction/);
  assert.match(reconcile, /pumpFeeSharingMatches/);
  assert.match(reconcile, /status: "CONFLICT"/);
  const fundingIndex = reconcile.indexOf("pumpFeeSharingSetupFundingTarget");
  const submitIndex = reconcile.indexOf("submitPumpFeeSharingSetupTransaction");
  assert.ok(fundingIndex >= 0 && submitIndex > fundingIndex, "bounded setup funding must be verified before submission");
  assert.match(reconcile, /getMinimumBalanceForRentExemption\(PUMP_HOLDER_REWARD_CONFIG_RENT_SPACE/);
  assert.match(reconcile, /topUpSellFees\(walletStore, attempt\.userId, creatorWallet, Number\(setupFundingTarget\)\)/);
  assert.match(reconcile, /PUMP_FEE_SHARING_SETUP_NEEDS_FUNDING/);
});

test("holder-reward launches activate official sharing before any dev or bundle buy", () => {
  const local = functionBody(server, "webLaunchPumpPortalLocal");
  const attachIndex = local.indexOf("attachPumpHolderRewardFeeSharingToLaunch");
  const buyIndex = local.indexOf("firePostLaunchBuysServerSide");
  assert.ok(attachIndex >= 0 && buyIndex > attachIndex, "official fee sharing must activate before post-launch buys");
  assert.match(local, /holderFeeSharingReady[\s\S]*?status[\s\S]*?=== "ACTIVE"/);
  assert.match(local, /reason: "holder_fee_sharing_not_active"/);
  assert.match(local, /buysDeferred:/);

  const launch = functionBody(server, "webLaunchPumpCoin");
  assert.match(launch, /requiresPreBuyFeeSharing/);
  assert.match(launch, /&& !requiresPreBuyFeeSharing/);
  assert.match(launch, /PUMP_HOLDER_REWARDS_REQUIRE_LOCAL_FLOW/);
});

test("deferred dev and managed-wallet buys persist an exact resumable plan before mint submission", () => {
  const local = functionBody(server, "webLaunchPumpPortalLocal");
  const persistIndex = local.indexOf("postLaunchBuyIntent");
  const launchIndex = local.indexOf("await service.launch");
  assert.ok(persistIndex >= 0 && launchIndex > persistIndex, "the exact post-launch buy plan must be durable before mint submission");
  assert.match(local, /buildPumpPostLaunchBuyIntent/);
  assert.match(local, /executePumpPostLaunchBuyIntent/);

  const intent = functionBody(server, "buildPumpPostLaunchBuyIntent");
  assert.match(intent, /walletPublicKey/);
  assert.match(intent, /amountSol/);
  assert.match(intent, /exitStrategy/);
  assert.match(intent, /status: "PENDING"/);

  const execute = functionBody(server, "executePumpPostLaunchBuyIntentCore");
  assert.match(execute, /persistedLaunchBundleFeeSharingDisposition/);
  assert.match(execute, /disposition\.required && !disposition\.active/);
  assert.match(execute, /runIdempotentMoneyOp/);
  assert.match(execute, /pump-post-launch-buy/);
  assert.match(execute, /ENTRY_CONFIRMED_SETUP_PENDING/);
  assert.match(execute, /runLaunchBundleInviteWaves\(pending/);
  const wrapper = functionBody(server, "executePumpPostLaunchBuyIntent");
  assert.match(wrapper, /LockService\.withLock/);
});

test("deferred buy recovery never age-terminalizes a launch that may still be live", () => {
  const execute = functionBody(server, "executePumpPostLaunchBuyIntentCore");
  const noMint = execute.slice(execute.indexOf("if (!tokenMint)"), execute.indexOf("const disposition"));
  assert.match(noMint, /launchStatus === "COMPLETE"/);
  assert.doesNotMatch(noMint, /intentAge|15 \* 60_000|Date\.now\(\) -/);

  const worker = functionBody(server, "resumePumpPostLaunchBuyIntents");
  assert.match(worker, /launchStatus === "COMPLETE" \|\| launchStatus\.startsWith\("FAILED"\)/);
  assert.doesNotMatch(
    worker,
    /for \(const attempt of \(store\.attempts \|\| \[\]\)\)/,
    "the timer must not execute arbitrary pre-broadcast intents while their provider call may still be live"
  );

  const restart = functionBody(server, "pumpLaunchAttemptRestartDisposition");
  assert.match(restart, /pumpLaunchAttemptHasSignedOrSubmittedEvidence/);
  assert.match(restart, /restart_intent_only/);
  assert.match(restart, /terminal_pre_broadcast/);
  const terminal = functionBody(server, "terminalizePersistedPreBroadcastPumpLaunch");
  assert.match(terminal, /FAILED_PRE_BROADCAST_RESTART/);
  assert.match(terminal, /LAUNCH_NOT_SUBMITTED/);
});

test("deferred launch accounting and auto exits are durable-idempotent", () => {
  const finalize = functionBody(server, "finalizePumpPostLaunchBuyEntry");
  assert.match(finalize, /const provenanceId = durableTradeWatchKey/);
  assert.match(finalize, /status: "ENTRY_CONFIRMED_SETUP_PENDING"/);
  assert.match(finalize, /provenanceId/);
  assert.match(finalize, /durablePlanKey/);
  assert.match(finalize, /source: "pump_post_launch_auto_exit"/);

  const autoExit = functionBody(server, "webCreateSingleTradeAutoExitPlan");
  assert.match(autoExit, /options\.durablePlanKey/);
  assert.match(autoExit, /plans\.plans\.find\(\(row\) => String\(row\.durablePlanKey/);
  assert.match(autoExit, /if \(existing\)[\s\S]*?planCreated = false/);

  const execute = functionBody(server, "executePumpPostLaunchBuyIntentCore");
  const submit = execute.indexOf('"pump-post-launch-buy"');
  const submitCallback = execute.slice(submit, execute.indexOf("ENTRY_CONFIRMED_SETUP_PENDING", submit));
  assert.match(submitCallback, /async \(\) => \{[\s\S]*?await freshServerTradeWalletForOwner/);
  assert.match(submitCallback, /return buyTokenForPlan\(wallet/);
  const pending = execute.slice(execute.indexOf("const pending ="));
  assert.match(pending, /authoritativeRecoveryTokenRawBalance/);
  assert.match(pending, /preTokenBalanceKnown: true/);
  const recovery = execute.slice(execute.indexOf("let balanceProofKnown"), execute.indexOf("const pending ="));
  assert.match(recovery, /authoritativeRecoveryTokenRawBalance/);
  assert.match(recovery, /5 \* 60_000 && balanceProofKnown/);
  assert.doesNotMatch(recovery, /safeTokenRawBalance/);
  assert.match(execute, /!error\?\.launchWalletTerminal && !ambiguous/);
});

test("holder vaults have an encrypted integrity-protected recovery path outside user wallet views", () => {
  const ensure = functionBody(server, "ensurePumpHolderRewardVault");
  assert.match(ensure, /readPumpHolderVaultRecoveryArtifact/);
  assert.match(ensure, /recoveredPumpHolderVaultRecord/);
  assert.match(ensure, /persistPumpHolderVaultRecovery/);
  const persist = functionBody(server, "persistPumpHolderVaultRecovery");
  assert.match(persist, /createPumpHolderVaultRecoveryArtifact/);
  assert.match(persist, /writeJsonFile\(PUMP_HOLDER_VAULT_RECOVERY_FILE/);
  assert.match(server, /\/api\/web\/autopilot\/pump-holder-vault-backup/);
  assert.match(server, /Content-Disposition/);
});

test("holder worker cranks official programs and pays only from its dedicated vault", () => {
  const worker = functionBody(server, "processHolderRewardAutoClaims");
  const officialGuardIndex = worker.indexOf("!pumpUsesOfficialHolderFeeSharing(attempt)");
  const reconcileIndex = worker.indexOf("reconcilePumpHolderRewardFeeSharing");
  assert.ok(officialGuardIndex >= 0 && reconcileIndex > officialGuardIndex, "worker must skip legacy rows before reconciliation");
  assert.match(worker, /reconcilePumpHolderRewardFeeSharing/);
  assert.match(worker, /runPumpHolderRewardDistribution/);
  assert.doesNotMatch(worker, /webClaimCreatorFeesCore/);

  const distribute = functionBody(server, "runPumpHolderRewardDistribution");
  assert.match(distribute, /buildPumpFeeSharingDistributionInstructions/);
  assert.match(distribute, /connection\.getBalance\(vault\.keypair\.publicKey/);
  assert.match(distribute, /signer: vault\.keypair/);
  assert.match(distribute, /shareBps: 10_000/);
  assert.match(distribute, /PUMP_HOLDER_REWARD_PAYOUT_FEE_RESERVE/);
  assert.doesNotMatch(distribute, /webClaimCreatorFeesCore|claimedSol|wallet-wide/i);
});

test("launch history compaction preserves durable reward mappings and unresolved claims", () => {
  const writer = functionBody(server, "writePumpLaunchAttempts");
  assert.match(writer, /compactPumpRewardStore\(store\)/);
  assert.doesNotMatch(writer, /attempts\.slice\(-100\)|creatorRewardObligations\.slice\(-500\)/);
});

test("public launch model exposes official status and the spendable rewards vault without secrets", () => {
  const model = functionBody(server, "pumpFeeSharingPublic");
  assert.match(model, /official: true/);
  assert.match(model, /nativeSol: true/);
  assert.match(model, /configAddress/);
  assert.match(model, /vaultAddress/);
  assert.doesNotMatch(model, /secret|privateKey/i);
  const summary = functionBody(server, "publicLaunchAttemptSummary");
  assert.match(summary, /feeSharing/);
  const launches = functionBody(server, "webLaunchedCoins");
  assert.match(launches, /feeSharing: pumpFeeSharingPublic\(a\)/);
});
