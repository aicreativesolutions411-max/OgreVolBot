import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const rewards = fs.readFileSync(new URL("../src/lib/pumpRewards.js", import.meta.url), "utf8");
const desktop = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const desktopAlias = fs.readFileSync(new URL("../web/public/gg.html", import.meta.url), "utf8");

function section(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `${startMarker} missing`);
  const end = endMarker ? source.indexOf(endMarker, start + startMarker.length) : source.length;
  assert.notEqual(end, -1, `${endMarker} missing after ${startMarker}`);
  return source.slice(start, end);
}

function functionSection(source, name, nextName) {
  return section(source, `function ${name}`, nextName ? `function ${nextName}` : null);
}

test("server imports the wallet-level Pump reward service", () => {
  assert.match(server, /import\s*\{[\s\S]*?buildPumpCashbackClaimInstructions[\s\S]*?buildPumpCreatorClaimInstructions[\s\S]*?getPumpRewardBalances[\s\S]*?\}\s*from\s*"\.\/lib\/pumpRewards\.js"/);

  assert.match(rewards, /export async function getPumpRewardBalances\(\{[\s\S]*?wallet,/);
  assert.match(rewards, /scope:\s*"wallet"/);
  assert.doesNotMatch(
    section(rewards, "export async function getPumpRewardBalances", "export async function buildPumpCreatorClaimInstructions"),
    /\bmint\s*[,=]/,
    "reward balance reads must remain wallet-level rather than token-level"
  );
});

test("GET Pump rewards returns every owned wallet plus the selected wallet and wallet-wide totals", () => {
  const routes = section(server, 'if (request.method === "GET" && pathname === "/api/web/pump/rewards")', 'pathname === "/api/web/launch/claim-fees"');
  assert.match(routes, /request\.method === "GET"/);
  assert.match(routes, /requestUrl\.searchParams\.get\("walletIndex"\)/);
  assert.match(routes, /webPumpRewards\(auth\.userId, walletIndex, \{ force \}\)/);

  const handler = functionSection(server, "webPumpRewards", "sendPumpRewardProgramClaim");
  assert.match(handler, /walletsForOwner\(walletStore, userId\)/);
  assert.match(handler, /readPumpRewardBalanceCached\(userId, wallet, options\)/);
  assert.match(handler, /scope:\s*"wallet"/);
  assert.match(handler, /wallets:\s*publicRows/);
  assert.match(handler, /wallet:\s*publicRows\.find\(\(row\) => row\.walletIndex === requestedIndex\)/);
  assert.match(handler, /totals:\s*\{[\s\S]*?creatorAtomic:[\s\S]*?creatorSol:[\s\S]*?cashbackAtomic:[\s\S]*?cashbackSol:/);
  assert.match(handler, /creatorClaims:[\s\S]*?scope: "wallet"[\s\S]*?claimedAtomic:[\s\S]*?claimedSol:[\s\S]*?pendingCount:/);
  assert.match(handler, /creatorClaimedAtomic:[\s\S]*?creatorClaimedSol:/);

  const serializer = functionSection(server, "publicPumpRewardWallet", "webPumpRewards");
  assert.match(serializer, /creator:\s*\{[\s\S]*?curveLamports:[\s\S]*?ammWsolAtomic:[\s\S]*?totalLamports:[\s\S]*?totalSol:/);
  assert.match(serializer, /cashback:\s*\{[\s\S]*?curveLamports:[\s\S]*?ammWsolAtomic:[\s\S]*?totalLamports:[\s\S]*?totalSol:/);
  assert.doesNotMatch(serializer, /\bmint\s*:/);
});

test("POST Pump reward claims are wallet-owned, kind-limited, and idempotent", () => {
  const routes = section(server, 'pathname === "/api/web/pump/rewards/claim"', 'pathname === "/api/web/launch/claim-fees"');
  assert.match(routes, /request\.method === "POST"/);
  assert.match(routes, /webClaimPumpRewards\(auth\.userId, await readJsonRequestBody\(request\)\)/);

  const handler = functionSection(server, "webClaimPumpRewards", "pumpCreatorDedicatedProof");
  assert.match(handler, /\["creator", "cashback"\]\.includes\(kind\)/);
  assert.match(handler, /parseWebWalletIndex\(body\.walletIndex\)/);
  assert.match(handler, /firstString\(body\.tradeAttemptId, body\.clientRequestId\)/);
  assert.match(handler, /runIdempotentMoneyOp\(`pump-\$\{kind\}-claim`, userId, attemptId/);
  assert.match(handler, /webClaimPumpRewardsCore\(userId, \{ walletIndex, kind, claimOperationId: attemptId \|\| crypto\.randomUUID\(\) \}\)/);
  assert.doesNotMatch(handler, /body\.mint|tokenMint|claimMint/);

  const core = functionSection(server, "webClaimPumpRewardsCore", "webClaimCreatorFees");
  assert.match(core, /getWalletAt\(walletStore, walletIndex, userId\)/);
  assert.match(core, /pump-reward-wallet:\$\{manualSellUserHash\(userId\)\}:\$\{wallet\.publicKey\}/);
  assert.doesNotMatch(core, /pump-reward-wallet:[^`]*\$\{kind\}/, "creator and Cash Back claims must share one wallet lock");
  assert.match(core, /LockService\.withLock\(lockName, 180_000/);
  assert.match(core, /kind === "cashback"[\s\S]*?buildPumpCashbackClaimInstructions\(\{ connection, user: keypair\.publicKey, feePayer: keypair\.publicKey \}\)[\s\S]*?: await buildPumpCreatorClaimInstructions\(\{ connection, creator: keypair\.publicKey, feePayer: keypair\.publicKey \}\)/);
  assert.match(core, /scope:\s*"wallet"/);
  assert.match(core, /const programs = \[[\s\S]*?name:\s*"pump"[\s\S]*?name:\s*"pumpAmm"/);
  assert.match(core, /for \(const program of programs\)[\s\S]*?completedPrograms\.push\(program\.name\)/);
  assert.match(core, /A confirmed first program must never be replayed/);
});

test("official Pump and PumpSwap creator and Cash Back claim paths stay wired", () => {
  const creator = section(rewards, "export async function buildPumpCreatorClaimInstructions", "export async function buildPumpCashbackClaimInstructions");
  assert.match(creator, /getPumpRewardBalances\(\{[\s\S]*?wallet:\s*creatorKey/);
  assert.match(creator, /collectCreatorFeeV2\(\)/);
  assert.match(creator, /collectCoinCreatorFee\(\)/);
  assert.match(creator, /instructionResult\(\{[\s\S]*?curveInstruction,[\s\S]*?ammInstruction/);
  assert.match(section(rewards, "function instructionResult", "export async function buildPumpCreatorClaimInstructions"), /byProgram:\s*\{[\s\S]*?pump:\s*curveInstruction,[\s\S]*?pumpAmm:\s*ammInstruction/);

  const cashback = section(rewards, "export async function buildPumpCashbackClaimInstructions", null);
  assert.match(cashback, /getPumpRewardBalances\(\{[\s\S]*?wallet:\s*userKey/);
  assert.match(cashback, /PUMP_SDK\.claimCashbackV2Instruction\(\{/);
  assert.match(cashback, /\.claimCashback\(\)/);
  assert.match(cashback, /userVolumeAccumulator:\s*addresses\.cashbackAmmAccumulator/);
  assert.match(cashback, /userWsolTokenAccount:\s*addresses\.walletWsolAta/);
});

test("temporary WSOL ATA creation is idempotent and pre-existing user accounts are never closed", () => {
  const createAta = functionSection(server, "createIdempotentAssociatedTokenAccountInstruction", "selectVolumeBotFunding");
  assert.match(createAta, /programId:\s*ASSOCIATED_TOKEN_PROGRAM_ID/);
  assert.match(createAta, /data:\s*Buffer\.from\(\[1\]\)/, "ATA instruction 1 is CreateIdempotent");

  const send = functionSection(server, "sendPumpRewardProgramClaim", "webClaimPumpRewards");
  const missingDestinationBranches = send.match(/if \(!destinationExists\)/g) || [];
  assert.equal(missingDestinationBranches.length, 2, "creation and close must share the same missing-before-claim guard");
  assert.match(send, /if \(!destinationExists\)[\s\S]*?createIdempotentAssociatedTokenAccountInstruction/);
  assert.match(send, /if \(!destinationExists\)[\s\S]*?createCloseAccountInstruction/);
  assert.match(send, /Only close an ATA this request created/);
  assert.doesNotMatch(send, /if \(destinationExists\)[\s\S]*?createCloseAccountInstruction/);
  assert.match(send, /programName === "pumpAmm" && destinationExists \? "WSOL" : "SOL"/);

  for (const page of [desktop, desktopAlias]) {
    assert.match(page, /PumpSwap rewards can remain WSOL when the wallet already has a WSOL account/);
    assert.match(page, /SlimeWire never closes that existing account/);
    assert.match(page, /d\.payoutAsset/);
    assert.match(page, /PumpSwap proceeds remain WSOL in the wallet's existing WSOL account/);
  }
});

test("wallet-wide creator rewards never guess a holder or NFT mint", () => {
  const proof = functionSection(server, "pumpCreatorDedicatedProof", "pumpCreatorObligationPublicLaunch");
  assert.match(proof, /createHmac\("sha256", CONFIG\.appSecret\)/);
  assert.match(proof, /creatorRewardDedicatedProof/);
  assert.match(proof, /creatorRewardDedicatedWallet/);
  assert.match(proof, /creatorRewardDedicatedMint/);
  assert.match(proof, /crypto\.timingSafeEqual/);

  const attribution = functionSection(server, "pumpCreatorRewardAttribution", "distributeAttributedPumpCreatorRewards");
  assert.match(attribution, /readPumpLaunchAttempts\(\)/);
  assert.match(attribution, /readNftLoyaltyStore\(\)/);
  assert.match(attribution, /const legacyHolderRewards = launchHolderRewardsFromAttempt\(attempt\)\.enabled && !pumpUsesOfficialHolderFeeSharing\(attempt\)/);
  assert.match(attribution, /return legacyHolderRewards \|\| nftCampaignMints\.has\(mint\)/);
  assert.match(attribution, /protectedAttempts\.length === 1 && launches\.length === 1[\s\S]*?pumpCreatorHasDedicatedInvariant/);
  assert.match(attribution, /attributionProven:\s*Boolean\(dedicatedLaunch\)/);

  const distributor = functionSection(server, "distributeAttributedPumpCreatorRewards", "webClaimPumpRewardsCore");
  assert.match(distributor, /if \(!dedicatedProofVerified\)/);
  assert.match(distributor, /dedicated_creator_invariant_not_proven/);

  const core = functionSection(server, "webClaimPumpRewardsCoreLocked", "webClaimCreatorFees");
  assert.doesNotMatch(core, /distributeAttributedPumpCreatorRewards\(/, "the claim path must not auto-distribute wallet-wide creator earnings");
  assert.match(core, /wallet_wide_attribution_unproven/);
});

test("protected creator claims persist and reconcile a durable non-paying obligation", () => {
  const storage = functionSection(server, "readPumpLaunchAttempts", "readSwampLeaderboard");
  assert.match(storage, /creatorRewardObligations/);
  assert.match(storage, /compactPumpRewardStore\(store\)/);
  assert.doesNotMatch(storage, /creatorRewardObligations\.slice\(-500\)/);

  const create = functionSection(server, "createPumpCreatorRewardObligation", "patchPumpCreatorRewardObligation");
  assert.match(create, /status:\s*"SUBMITTING"/);
  assert.match(create, /expectedByProgram/);
  assert.match(create, /distributedAtomic:\s*"0"/);
  assert.match(create, /withFileLock\(pumpLaunchAttemptsPath\(\)/);
  assert.match(create, /\["SUBMITTING", "RECONCILING", "PARTIAL_OR_FAILED"\]/);
  assert.match(create, /prior creator-reward claim for this wallet is still reconciling on-chain/);

  const core = functionSection(server, "webClaimPumpRewardsCoreLocked", "webClaimCreatorFees");
  const obligationIndex = core.indexOf("createPumpCreatorRewardObligation({");
  const submitLoopIndex = core.indexOf("for (const program of programs)");
  assert.ok(obligationIndex >= 0 && obligationIndex < submitLoopIndex, "the obligation must land before the first claim submission");
  assert.match(core, /status:\s*"SUBMITTING"[\s\S]*?sendPumpRewardProgramClaim\(/);
  assert.match(core, /status:\s*"CONFIRMED"[\s\S]*?signature/);
  assert.match(core, /status: outcomeUnknown \? "RECONCILING" : "PARTIAL_OR_FAILED"/);
  assert.match(core, /const confirmedAtomic = completedPrograms\.reduce/);
  assert.match(core, /const claimedAtomic = observedDeltaAtomic > confirmedAtomic \? observedDeltaAtomic : confirmedAtomic/);
  assert.match(core, /reconcilePumpCreatorRewardObligations\(userId, wallet\.publicKey, built\.balances\)/);
  assert.match(core, /distributionStatus:\s*protectedCreatorRewards[\s\S]*?"SKIPPED_UNPROVEN_WALLET_WIDE_ATTRIBUTION"[\s\S]*?: "NOT_APPLICABLE"/);
  assert.match(core, /pumpRewardAtomic\(latest\.distributedAtomic\) !== 0n/);
  const sendLegacy = functionSection(server, "sendLegacyTransaction", "estimateLegacyTransactionFee");
  const signedHookIndex = sendLegacy.indexOf("await options.onSigned");
  const rawSendIndex = sendLegacy.indexOf("connection.sendRawTransaction(raw");
  assert.ok(signedHookIndex >= 0 && rawSendIndex > signedHookIndex, "signed creator-claim receipt must persist before broadcast");
  assert.match(core, /onSigned: obligation \? async \(\{ signature, blockhash, lastValidBlockHeight \}\)/);
  assert.match(core, /signature,[\s\S]*?blockhash,[\s\S]*?lastValidBlockHeight,[\s\S]*?signedAt:/);

  const reconcile = functionSection(server, "reconcilePumpCreatorRewardObligations", "pumpCreatorRewardAttribution");
  assert.match(reconcile, /connection\.getSignatureStatus\(signature, \{ searchTransactionHistory: true \}\)/);
  assert.match(reconcile, /confirmedPumpCreatorObligationAtomic\(programs\)/);
  assert.match(reconcile, /const claimedAtomic = confirmedAtomic > observedDeltaAtomic \? confirmedAtomic : observedDeltaAtomic/);
  assert.match(reconcile, /expiredWithoutEvidence/);
  assert.match(reconcile, /classifySignedPumpClaimReconciliation/);
  assert.match(reconcile, /getBlockHeight\("confirmed"\)/);
  assert.match(reconcile, /FAILED_EXPIRED/);
  assert.match(reconcile, /status: claimedAtomic > 0n[\s\S]*?"MANUAL_ATTRIBUTION_REQUIRED"/);
  assert.match(reconcile, /MANUAL_ATTRIBUTION_REQUIRED/);
  assert.match(reconcile, /SKIPPED_UNPROVEN_WALLET_WIDE_ATTRIBUTION/);
  assert.doesNotMatch(reconcile, /distributeSolHolderRewards|distributeCreatorFeesToNftHolders/);
});

test("claims remain wallet-wide and legacy Pump fee claims cannot pass a mint into the official builders", () => {
  const core = functionSection(server, "webClaimPumpRewardsCore", "webClaimCreatorFees");
  assert.match(core, /function webClaimPumpRewardsCore\(userId, \{ walletIndex, kind, claimOperationId = "" \}\)/);
  assert.doesNotMatch(core, /buildPump(?:Cashback|Creator)ClaimInstructions\(\{[^}]*mint/s);

  const legacy = functionSection(server, "webClaimCreatorFeesCore", "webRhWallets");
  const pumpBranch = section(legacy, 'if (rail === "pump")', "const payload =");
  assert.match(pumpBranch, /webClaimPumpRewardsCore\(userId, \{[\s\S]*?walletIndex:[\s\S]*?kind:\s*"creator"/);
  assert.doesNotMatch(pumpBranch, /webClaimPumpRewardsCore\(userId, \{[\s\S]*?mint:/);
  assert.doesNotMatch(pumpBranch, /creatorFeesAutoClaimSol:\s*Number\(claim\.claimedSol/);
  assert.match(pumpBranch, /markPumpWalletCreatorClaimOnLaunches/);

  const truthfulStats = functionSection(server, "markPumpWalletCreatorClaimOnLaunches", "processCreatorFeeAutoClaims");
  assert.match(truthfulStats, /creatorFeesAutoClaimScope = "wallet"/);
  assert.match(truthfulStats, /creatorFeesAutoClaimSignature = ""/);
  assert.match(truthfulStats, /creatorFeesAutoClaimSol = 0/);

  assert.match(rewards, /Claims are wallet-level and are never attributed to a mint/);
});

test("chart bootstrap exposes Cash Back only for the matching Pump launch mint", () => {
  const bootstrap = functionSection(server, "buildWebChartBootstrap", "storeWebChartBootstrap");
  assert.match(bootstrap, /readPumpLaunchAttempts\(\)/);
  assert.match(bootstrap, /String\(attempt\.rail \|\| "pump"\)\.toLowerCase\(\) === "pump"/);
  assert.match(bootstrap, /\[attempt\.mintPublicKey, attempt\.tokenMint, attempt\.mint\][\s\S]*?\.some\(\(value\) => String\(value \|\| ""\)\.trim\(\) === mint\)/);
  assert.match(bootstrap, /chart\.pumpCashback = normalizePumpCashback\(pumpLaunchMeta\?\.pumpCashback\)/);
  assert.match(bootstrap, /chart\.pumpCashbackSource = chart\.pumpCashback \? "slimewire-launch" : ""/);
});
