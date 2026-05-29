import test from "node:test";
import assert from "node:assert/strict";

import {
  formatPresetSolAmount,
  smartChartSuggestion,
  tradeActionLabelFromPreset
} from "../web/public/liveTerminalUi.js";

test("trade action label shows active preset SOL amount", () => {
  assert.equal(tradeActionLabelFromPreset({ amountSol: 0.5 }), "0.5 SOL");
  assert.equal(tradeActionLabelFromPreset({ amountSol: 1 }), "1 SOL");
  assert.equal(tradeActionLabelFromPreset({ amountSol: 0.1234567 }), "0.123457 SOL");
});

test("trade action label falls back when preset amount is not usable", () => {
  assert.equal(formatPresetSolAmount(0), "");
  assert.equal(tradeActionLabelFromPreset({ amountSol: "bad" }, "Trade"), "Trade");
  assert.equal(tradeActionLabelFromPreset(null, "Buy"), "Buy");
});

test("smart chart suggestion surfaces risk flags first", () => {
  const message = smartChartSuggestion({
    bestPickScore: 99,
    riskFlags: ["high sell pressure", "thin liquidity"]
  });
  assert.match(message, /Risk flags/);
  assert.match(message, /high sell pressure/);
});

test("smart chart suggestion explains confidence without promising profit", () => {
  assert.match(smartChartSuggestion({ bestPickScore: 88 }), /Strong setup/);
  assert.doesNotMatch(smartChartSuggestion({ bestPickScore: 88 }), /guarantee|guaranteed/i);
});
