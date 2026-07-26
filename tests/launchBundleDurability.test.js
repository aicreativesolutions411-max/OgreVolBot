import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

function functionSource(source, name) {
  const match = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`).exec(source);
  assert.ok(match, `${name} is missing`);
  const paramsStart = source.indexOf("(", match.index);
  let paramsDepth = 0;
  let paramsEnd = -1;
  for (let index = paramsStart; index < source.length; index += 1) {
    if (source[index] === "(") paramsDepth += 1;
    if (source[index] === ")") {
      paramsDepth -= 1;
      if (paramsDepth === 0) {
        paramsEnd = index;
        break;
      }
    }
  }
  const bodyStart = source.indexOf("{", paramsEnd);
  assert.notEqual(bodyStart, -1, `${name} has no body`);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(match.index, index + 1);
    }
  }
  assert.fail(`${name} has an unterminated body`);
}

function functionBody(source, name) {
  const declaration = functionSource(source, name);
  return declaration.slice(declaration.indexOf("{") + 1, -1);
}

function loadSyncFunction(name, dependencies = {}) {
  const names = Object.keys(dependencies);
  const values = Object.values(dependencies);
  return Function(...names, `return (${functionSource(serverSource, name)});`)(...values);
}

test("launch invite reservations remain durable after the invite TTL", () => {
  const stateBody = functionBody(serverSource, "launchBundleInviteState");
  const reservedCheck = stateBody.indexOf('invite.status === "RESERVED"');
  const expiryCheck = stateBody.indexOf("Date.parse(invite.expiresAt");
  assert.ok(reservedCheck >= 0, "RESERVED launch entries need an explicit durable state");
  assert.ok(expiryCheck >= 0, "unclaimed launch invites still need to expire");
  assert.ok(
    reservedCheck < expiryCheck,
    "a RESERVED money intent must not become revocable/replaceable merely because its original invite TTL elapsed"
  );

  const state = loadSyncFunction("launchBundleInviteState");
  assert.equal(state({ status: "RESERVED", expiresAt: "2000-01-01T00:00:00.000Z" }), "RESERVED");
  assert.equal(state({ status: "WAITING", expiresAt: "2000-01-01T00:00:00.000Z" }), "EXPIRED");
});

test("all 50 opted-in wallets retain first-opt-in queue order and run in bounded waves", async () => {
  const queueValue = loadSyncFunction("launchBundleInviteQueueValue");
  const sortQueue = loadSyncFunction("sortLaunchBundleInviteQueue", { launchBundleInviteQueueValue: queueValue });
  const rows = Array.from({ length: 50 }, (_, index) => ({
    id: `seat-${String(index + 1).padStart(2, "0")}`,
    queueOrdinal: index + 1,
    optedInAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString()
  })).reverse();

  assert.deepEqual(
    sortQueue(rows).map((row) => row.queueOrdinal),
    Array.from({ length: 50 }, (_, index) => index + 1)
  );

  const reserveBody = functionBody(serverSource, "reserveLaunchBundleInvites");
  assert.match(reserveBody, /allIds\.length > 50/);
  assert.match(reserveBody, /sortLaunchBundleInviteQueue\(ids\.map/);
  assert.doesNotMatch(reserveBody, /\.slice\(0,\s*50\)/, "over-limit launches must be rejected, not silently truncated");

  const batches = [];
  const runWithConcurrency = async (items, concurrency, worker) => {
    assert.equal(concurrency, items.length);
    assert.ok(items.length <= 4, "an invite wave must remain bounded to four submissions");
    batches.push(items.map((row) => row.queueOrdinal));
    return Promise.all(items.map(worker));
  };
  const runWaves = Function(
    "sortLaunchBundleInviteQueue",
    "runWithConcurrency",
    `return (${functionSource(serverSource, "runLaunchBundleInviteWaves")});`
  )(sortQueue, runWithConcurrency);
  const output = await runWaves(rows, async (row) => row.queueOrdinal, 4);

  assert.equal(output.length, 50);
  assert.equal(batches.length, 13);
  assert.deepEqual(batches.map((batch) => batch.length), [...Array(12).fill(4), 2]);
  assert.deepEqual(output, Array.from({ length: 50 }, (_, index) => index + 1));
});

test("participant buys persist crash-safe states before money submission and optional setup", () => {
  for (const name of ["fulfillLaunchBundleInvites", "fulfillRhLaunchBundleInvites"]) {
    const body = functionBody(serverSource, name);
    const submitting = body.indexOf('status: "SUBMITTING"');
    const moneyOp = body.indexOf("runIdempotentMoneyOp(");
    const confirmedPending = body.indexOf('status: "ENTRY_CONFIRMED_SETUP_PENDING"');
    const optionalSetup = name === "fulfillLaunchBundleInvites"
      ? body.indexOf("recordTradeEvents(")
      : body.indexOf("webRhArmGuard(");

    assert.ok(submitting >= 0 && submitting < moneyOp, `${name} must persist SUBMITTING before the money operation`);
    assert.ok(
      confirmedPending >= 0 && confirmedPending < optionalSetup,
      `${name} must persist a confirmed entry before optional event/exit setup`
    );
    assert.match(body, /runLaunchBundleInviteWaves\(pending/);
  }

  const resume = functionBody(serverSource, "resumeLaunchBundleInviteEntries");
  assert.match(resume, /ENTRY_CONFIRMED_SETUP_PENDING/);
  assert.match(resume, /finalizeRecoveredLaunchBundleInvite/);
  assert.match(resume, /\["RECONCILING", "SUBMITTING", "OUTCOME_UNKNOWN"\]/);
  assert.match(resume, /!row\.entry \|\| row\.entry\?\.status === "RETRYING"/);
  assert.doesNotMatch(resume, /\.slice\(0,\s*12\)/, "recovery must not starve seats after the first twelve");
  const expiryDecision = resume.slice(resume.indexOf("const safelyExpired"), resume.indexOf("store = await readLaunchBundleInvites", resume.indexOf("const safelyExpired")));
  assert.match(
    expiryDecision,
    /chain[\s\S]*?robinhood/,
    "time-based blockhash expiry is safe for Solana only; an EVM transaction can remain pending beyond five minutes"
  );
  assert.doesNotMatch(expiryDecision, /failedOnChain \|\| safelyExpired/);

  const robinhood = functionBody(serverSource, "fulfillRhLaunchBundleInvites");
  assert.match(
    robinhood,
    /results\.filter\(\(row\) => row\.retrying \|\| row\.ambiguous\)/,
    "an unknown Robinhood outcome is reconciling, not a terminal failed participant entry"
  );
  assert.match(
    robinhood,
    /preTokenRaw/,
    "RH recovery needs the pre-submit token balance so an unrelated existing bag is not mistaken for this invite landing"
  );
  const rhRecovery = resume.slice(resume.indexOf('if (chain === "robinhood")'), resume.indexOf("} else {", resume.indexOf('if (chain === "robinhood")')));
  assert.match(rhRecovery, /currentRaw > beforeRaw|BigInt\([^)]*raw[^)]*\) > beforeRaw/);
  assert.match(rhRecovery, /terminalHash = hashes\.at\(-1\)/);
  assert.doesNotMatch(
    rhRecovery,
    /for \(const hash of hashes\)[\s\S]*?failedOnChain = true/,
    "an approval-step failure/success is not proof of the terminal RH swap outcome"
  );
});

test("restart recovery binds both Pump and Robinhood launch ledger records", () => {
  const recover = functionBody(serverSource, "recoverLaunchBundleInviteTokensFromLedger");
  assert.match(recover, /readPumpLaunchAttempts/);
  assert.match(recover, /bindLaunchBundleInvitesToToken/);
  assert.match(recover, /COMPLETE/);
  assert.match(
    recover,
    /CONFIRMED|confirmed/,
    "Robinhood launches are persisted as confirmed and must be eligible for participant recovery"
  );
  assert.doesNotMatch(recover, /\.slice\(0,\s*(?:12|20)\)/);

  assert.match(
    serverSource,
    /if \(duplicateComplete && duplicateTokenMint\)[\s\S]*?bindLaunchBundleInvitesToToken\([\s\S]*?fulfillLaunchBundleInvites\(/,
    "a duplicate COMPLETE Pump launch request must resume reserved participant entries"
  );
  assert.match(
    serverSource,
    /const launchBundleInviteRetryTimer = setInterval\(\(\) => \{[\s\S]*?void resumeLaunchBundleInviteEntries\(\)\.catch\(/,
    "a transient recovery error must be logged instead of becoming an unhandled timer rejection"
  );
});

test("an ambiguity proven absent can advance to a fresh idempotency generation", () => {
  const resume = functionBody(serverSource, "resumeLaunchBundleInviteEntries");
  const sol = functionBody(serverSource, "fulfillLaunchBundleInvites");
  const robinhood = functionBody(serverSource, "fulfillRhLaunchBundleInvites");
  const generationPattern = /(?:recovery|retry)(?:Generation|Nonce)/i;
  const explicitCacheResetPattern = /(?:clear|delete|reset)[A-Za-z]*(?:Idem|Idempotent|Ambiguous)/i;

  const advancesGeneration = generationPattern.test(resume)
    && generationPattern.test(sol)
    && generationPattern.test(robinhood);
  const clearsAmbiguousCache = explicitCacheResetPattern.test(resume)
    && explicitCacheResetPattern.test(serverSource);
  assert.ok(
    advancesGeneration || clearsAmbiguousCache,
    "after receipt/balance checks and blockhash expiry prove no landing, recovery must not reuse the 30-day cached ambiguous idempotency key"
  );

  if (advancesGeneration) {
    for (const [name, body] of [["Solana", sol], ["Robinhood", robinhood]]) {
      const errorPatch = body.slice(body.indexOf("const knownHashes"));
      assert.match(
        errorPatch,
        /entry:\s*\{[\s\S]*?recoveryGeneration[,\s:]/,
        `${name} error persistence must retain its current recovery generation so a second ambiguity advances past g1 instead of looping on it`
      );
      assert.match(
        errorPatch,
        /entry:\s*\{[\s\S]*?preTokenRaw[,\s:]/,
        `${name} ambiguity persistence must retain the exact pre-submit token baseline used to prove whether this invite landed`
      );
    }
  }
});

test("Robinhood swap recovery reuses funding instead of bridging the participant SOL twice", () => {
  const fulfillment = functionBody(serverSource, "fulfillRhLaunchBundleInvites");
  const trade = functionBody(serverSource, "webRhTradeCore");
  const fundingField = /fundingAttemptId:\s*([^,\n}]+)/.exec(fulfillment);

  assert.ok(fundingField, "the RH participant entry must pass a separately durable funding attempt id");
  assert.doesNotMatch(
    fundingField[1],
    /recoveryGeneration/,
    "a new final-swap generation must not create a new SOL-to-Robinhood funding transfer"
  );
  assert.match(trade, /body\.fundingAttemptId/);
  assert.match(
    trade,
    /funding\?\.duplicate|funding\.duplicate/,
    "a replayed funding receipt must not wait for the already-funded ETH balance to increase a second time"
  );
});
