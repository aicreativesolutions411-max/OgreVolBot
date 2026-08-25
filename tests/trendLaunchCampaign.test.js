import test from "node:test";
import assert from "node:assert/strict";
import {
  TREND_LAUNCH_RIGHTS_VERSION,
  chooseTrendLaunchCandidate,
  fallbackTrendLaunchConcept,
  isBlockedTrendLaunchContent,
  nextTrendLaunchAt,
  trendLaunchDayKey,
  normalizeTrendLaunchCampaign,
  normalizeTrendLaunchRate,
  trendLaunchDue,
  trendLaunchRightsAccepted
} from "../src/lib/trendLaunchCampaign.js";

function candidate(id, username, trend, likes = 10) {
  return {
    id,
    username,
    trend,
    text: `${trend} is moving across the timeline`,
    mediaUrl: `https://pbs.twimg.com/media/${id}.jpg`,
    sourceUrl: `https://x.com/${username}/status/${id}`,
    createdAt: new Date().toISOString(),
    metrics: { like_count: likes, retweet_count: 2 }
  };
}

test("rate, cadence and campaign limits stay bounded", () => {
  assert.equal(normalizeTrendLaunchRate(0), 1);
  assert.equal(normalizeTrendLaunchRate(99), 4);
  assert.equal(nextTrendLaunchAt(1_000, 4, 0), 901_000);
  const normalized = normalizeTrendLaunchCampaign({ launchesPerHour: 8, maxLaunchesPerDay: 100, devBuySol: 99, walletIndex: 0 }, {}, Date.UTC(2026, 7, 25));
  assert.equal(normalized.launchesPerHour, 4);
  assert.equal(normalized.maxLaunchesPerDay, 24);
  assert.equal(normalized.devBuySol, 5);
  assert.equal(normalized.walletIndex, 1);
});

test("unattended runs require the explicit current rights attestation", () => {
  const base = { enabled: true, status: "running", nextRunAt: 0, dayKey: trendLaunchDayKey(), maxLaunchesPerDay: 12, launchedToday: 0 };
  assert.equal(trendLaunchDue(base), false);
  const attested = { ...base, rightsVersion: TREND_LAUNCH_RIGHTS_VERSION, rightsAttestedAt: new Date().toISOString() };
  assert.equal(trendLaunchRightsAccepted(attested), true);
  assert.equal(trendLaunchDue(attested), true);
  assert.equal(trendLaunchDue({ ...attested, launchedToday: 12 }), false);
  assert.equal(trendLaunchDue({ ...attested, pendingRun: { slotId: "slot" } }), false);
});

test("sensitive trends are rejected", () => {
  assert.equal(isBlockedTrendLaunchContent("breaking school shooting"), true);
  assert.equal(isBlockedTrendLaunchContent("funny dog learns to skateboard"), false);
  assert.equal(chooseTrendLaunchCandidate([candidate("1", "safe", "earthquake")], []), null);
});

test("selection rotates post ids, authors and recent trend names", () => {
  const rows = [
    candidate("1", "sameAuthor", "Green Cat", 1000),
    candidate("2", "sameAuthor", "Blue Dog", 900),
    candidate("3", "freshAuthor", "Fresh Frog", 500)
  ];
  const history = [{ sourceId: "1", sourceUsername: "sameAuthor", trend: "Blue Dog" }];
  const selected = chooseTrendLaunchCandidate(rows, history, () => 0);
  assert.equal(selected.id, "3");
});

test("fallback creates a unique launch-ready identity", () => {
  const source = candidate("4567", "source", "Dancing Gecko", 20);
  const first = fallbackTrendLaunchConcept(source, []);
  const second = fallbackTrendLaunchConcept(source, [first.symbol]);
  assert.equal(first.name, "Dancing Gecko");
  assert.match(first.symbol, /^[A-Z0-9]{2,10}$/);
  assert.notEqual(second.symbol, first.symbol);
  assert.match(first.description, /inspired by a current X conversation/i);
});
