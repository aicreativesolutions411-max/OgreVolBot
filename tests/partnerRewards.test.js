import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const maker = fs.readFileSync(new URL("../web/public/site-maker.html", import.meta.url), "utf8");
const coin = fs.readFileSync(new URL("../web/public/coin-site.html", import.meta.url), "utf8");
const dashboard = fs.readFileSync(new URL("../web/public/partner-rewards.html", import.meta.url), "utf8");
const cashCow = fs.readFileSync(new URL("../web/public/cashcow.html", import.meta.url), "utf8");
const redirects = fs.readFileSync(new URL("../web/public/_redirects", import.meta.url), "utf8");

test("every trade keeps 0.50% platform plus 0.15% Cash Cow, with referral 0.15% only when payable", () => {
  assert.match(server, /const bundleFeeBps = 50/);
  assert.match(server, /const referralFeeBps = 15/);
  assert.match(server, /const cashCowTradeFeeBps = 15/);
  assert.match(server, /const baseTradeFeeBps = bundleFeeBps \+ cashCowTradeFeeBps/);
  assert.match(server, /connectedTradeFeeBps = jupiterReferralAccount \? baseTradeFeeBps : 0/);
  assert.match(server, /calculateTradeFeeLamports\(amountLamports, session\.userId\)/);
  assert.match(server, /totalFeeBps = CONFIG\.baseTradeFeeBps \+ await referralTradeSurchargeBps\(userId\)/);
  assert.match(server, /const cashCow = await ensureCashCowRewardsProgram\(\)/);
  assert.match(server, /ownerLamports: total - cashCowLamports - referralLamports/);
  assert.match(server, /PARTNER_DEV_SHARE_BPS = 5_000/);
  assert.match(server, /PARTNER_HOLDER_SHARE_BPS = 5_000/);
});

test("Cash Cow receives its holder-only 0.15% allocation across Solana and Robinhood trades", () => {
  assert.match(server, /CASH_COW_RH_TOKEN = "0x4ad72e468e38ec204c605f2e058d61e4d79e2ceb"/);
  assert.match(server, /CASH_COW_REWARD_BPS = CONFIG\.cashCowTradeFeeBps/);
  const ensure = server.slice(server.indexOf("async function ensureCashCowRewardsProgram"), server.indexOf("async function partnerProgramByToken"));
  assert.match(ensure, /holderShareBps: 10_000/);
  assert.match(ensure, /developerShareBps: 0/);
  assert.match(ensure, /mode: "surcharge"/);
  assert.match(ensure, /baseBps: CONFIG\.bundleFeeBps/);
  assert.match(ensure, /rewardBps: CASH_COW_REWARD_BPS/);
  assert.match(ensure, /maxRecipients: 100/);
  const holders = server.slice(server.indexOf("async function rhHolderRewardRecipients"), server.indexOf("async function distributeSolHolderRewards"));
  assert.match(holders, /next_page_params/);
  assert.match(holders, /while \(items\.length < 150\)/);
  assert.match(holders, /address_hash\?\.hash/);
  assert.match(holders, /r\.proxyType === "eip7702"/);
  assert.match(holders, /0\{36\}dead/);
  assert.match(holders, /rhBackfillHolderHistory/);
  assert.match(holders, /slice\(0, 100\)/);
  const history = server.slice(server.indexOf("async function rhHolderContinuousSince"), server.indexOf("async function rhHolderRewardRecipients"));
  assert.match(history, /addresses\/\$\{wallet\}\/token-transfers/);
  assert.match(history, /url\.searchParams\.set\("token", tokenAddress\)/);
  assert.match(history, /historyBackfilledAt/);
  const snapshot = server.slice(server.indexOf("async function snapshotPartnerProgram"), server.indexOf("async function bridgePartnerRhRewards"));
  assert.match(snapshot, /partner_holder_snapshot_failed/);
  assert.match(snapshot, /backfillHistory: program\.token\?\.chain === "robinhood"/);
  assert.doesNotMatch(snapshot, /rhHolderRewardRecipients\([^;]+\.catch\(\(\) => \[\]\)/);
  assert.match(server, /PARTNER_HOLDER_ELIGIBILITY_VERSION = 2/);
  const tradeStart = server.indexOf("async function webRhTradeCore");
  const tradeEnd = server.indexOf("function scheduleRhFeeSweep", tradeStart);
  const trade = server.slice(tradeStart, tradeEnd);
  assert.match(trade, /CONFIG\.baseTradeFeeBps \+ \(referralTarget \? CONFIG\.referralFeeBps : 0\)/);
  assert.match(trade, /grossFeeBasisWei \* BigInt\(CONFIG\.cashCowTradeFeeBps\)/);
  assert.match(trade, /const ownerWei = feeWei - partnerWei - referralWei/);
  assert.ok(trade.indexOf("partnerFeeTxHash = await rhTransferEth") < trade.indexOf("feeTxHash = await rhTransferEth"));
  assert.match(server, /await ensureCashCowRewardsProgram\(\);[\s\S]{0,160}const programs/);
  const distribute = server.slice(server.indexOf("async function distributeRhHolderRewards"), server.indexOf("let holderRewardsAutoClaimBusy"));
  assert.match(distribute, /const paidRecipients = \[\]/);
  assert.match(distribute, /paidRecipients\.push\(\{ wallet: p\.wallet, wei: p\.value\.toString\(\), signature: txHash \}\)/);
  assert.match(distribute, /recipients: paidRecipients/);
  assert.match(dashboard, /100% of the extra reward goes to eligible holders/);
  assert.match(server, /serveStaticHtmlPage\(response, "cashcow\.html"/);
  assert.doesNotMatch(redirects, /\/cashcow\s+\/cashcow\.html\s+200/);
  assert.match(cashCow, /THE FIRST CTO ON ROBINHOOD CHAIN/);
  assert.doesNotMatch(cashCow, /0\.50%|0\.15%|0\.65%/);
  assert.match(cashCow, /LIVE HOLDER REWARDS GENERATED/);
  assert.match(cashCow, /id="rewardCounter"/);
  assert.match(cashCow, /\/api\/partner-rewards\/CASHCOW/);
  assert.match(cashCow, /CHECK EARNINGS/);
  assert.match(cashCow, /cashcow-rewards-hero\.webp/);
  assert.match(cashCow, /cashcow-holders-meme\.webp/);
  assert.match(cashCow, /cashcow-first-cto-meme\.webp/);
});

test("coin-aware fee plumbing covers Telegram, managed-wallet, bundle, and RH trades", () => {
  assert.match(server, /session\.userId, tokenMint: session\.data\.tokenMint/);
  assert.match(server, /options\.userId, tokenMint, chain: "solana"/);
  assert.match(server, /b\.userId, tokenMint: mint, chain: "solana"/);
  assert.match(server, /recordPartnerRhFee/);
  assert.match(server, /cashCowProgram\.vaultRhWallet/);
});

test("holder policy is daily, snapshot-gated, sqrt-weighted, capped, and bounded to 100", () => {
  assert.match(server, /PARTNER_SNAPSHOT_MS = 6 \* 60 \* 60 \* 1000/);
  assert.match(server, /PARTNER_SETTLEMENT_MS = 24 \* 60 \* 60 \* 1000/);
  assert.match(server, /minHoldHours: 24/);
  assert.match(server, /minSnapshots: 2/);
  assert.match(server, /weighting: "sqrt_balance"/);
  assert.match(server, /maxWalletPoolPct: 5/);
  assert.match(server, /maxRecipients: 100/);
});

test("Site Maker, coin sites, Telegram, and public receipts expose the partner program", () => {
  assert.match(maker, /Community Rewards payout wallet/);
  assert.match(maker, /partnerPayoutWallet/);
  assert.match(maker, /Community Rewards automatically enabled/);
  assert.match(maker, /p\.partner\.enabled = Boolean\(p\.partner\.payoutWallet\)/);
  assert.match(coin, /COMMUNITY REWARDS/);
  assert.match(coin, /LIVE HOLDER REWARDS GENERATED/);
  assert.doesNotMatch(coin, /Every SlimeWire trade keeps the same 0\.50% total fee/);
  assert.match(coin, /\/rewards\/\$\{encodeURIComponent\(p\.partner\.code\)\}/);
  assert.match(dashboard, /PUBLIC HOLDER PROOF/);
  assert.match(dashboard, /MY HOLDER REWARDS/);
  assert.doesNotMatch(dashboard, /Developer paid/);
  assert.match(maker, /PRIVATE DEVELOPER VIEW/);
  assert.match(server, /partnerHolderPublic\(program, store, wallet\)/);
  assert.match(server, /partnerProgramAdminForProject\(project\)/);
  assert.match(server, /\/api\/partner-rewards\//);
  assert.match(server, /partner_\$\{program\.code\}/);
  assert.match(redirects, /\/rewards\/\*\s+\/partner-rewards\.html\s+200/);
  assert.match(redirects, /\/ca\/\*\s+\/coin-site\.html\s+200/);
});
