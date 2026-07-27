import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

test("Telegram exposes a paged source-backed developer dossier", () => {
  assert.match(source, /command: "dev", description: "Developer wallet and launch history"/);
  assert.match(source, /parseCommandWithArgument\(text, \["dev", "developer", "devhistory"\]\)/);
  assert.match(source, /async function handleTelegramDevCommand\(/);
  assert.match(source, /async function handleTelegramDevCallback\(/);
  assert.match(source, /const TELEGRAM_DEV_HISTORY_PAGE_SIZE = 5/);
  assert.match(source, /callback_data: `dv:p:/);
  assert.match(source, /text: "More ➡"/);
  assert.match(source, /callback_data: `dv:r:/);
  assert.match(source, /Rates use known outcomes only/);
  assert.match(source, /it is not proof of intent/);
});

test("developer dossier combines creator launches, tracked outcomes, and market history", () => {
  assert.match(source, /getSolanaTrackerDeployerLaunches\(wallet, \{ limit: 100/);
  assert.match(source, /\/deployer\/\$\{encodeURIComponent\(wallet\)\}/);
  assert.match(source, /Array\.isArray\(payload\?\.tokens\)/);
  assert.match(source, /getPumpFunCreatorLaunches\(wallet, \{ limit: 50/);
  assert.match(source, /coins-v2\/user-created-coins/);
  assert.match(source, /deployerWarehouse\.get\(wallet\)/);
  assert.match(source, /readPostgresDevLaunchHistory\(wallet, 100\)/);
  assert.match(source, /from dev_wallet_candidates/);
  assert.match(source, /from dev_wallet_events/);
  assert.match(source, /from processed_transactions/);
  assert.match(source, /readPostgresDevLaunchMarketHistory/);
  assert.match(source, /from pair_snapshots/);
  assert.match(source, /recordsRecovered: launches\.length/);
  assert.match(source, /Prior coin records available/);
  assert.match(source, /Active markets now/);
  assert.match(source, /Low markets now/);
  assert.match(source, /Sold &gt;50% in 15m/);
  assert.match(source, /Typical first dev sell/);
  assert.match(source, /Best tracked market cap/);
  assert.match(source, /Dev History", callback_data: `dvo:/);
});
