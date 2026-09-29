# Launch earnings dashboard

Route: `/launch/earnings`. Public by default; **My Earnings** accepts explicitly selected public wallets (up to 25). Wallet selection is kept in memory, never stored in browser storage or the page URL. The dashboard is read-only and never signs, claims or sends a transaction.

## Views

- Public: total recipient payments, developer / community / receiving-wallet breakdown, all recorded launches.
- Personal: received payments, current reserved rewards, a Wallet link for actual claim balances. Trading P&L is not fee income.
- All time (default), rolling 24 hours, 7 days, 30 days. Pending is always the current unpaid allocation, regardless of period.
- Search, exact-integer amount sorting, role filtering, paginated coin / payment rows, coin detail split and receipts, shareable coin links.
- Launch home has a lightweight public earnings strip and verified per-coin paid figures when available. Wallet and Terminal styling is unchanged.

## Accounting boundaries

`launchEarningsHistory.js` records sanitized finalized events in `earningsHistory` alongside the existing distribution/holder state. Signature keys deduplicate replay. History, cumulative amounts and the holder liability debit persist in the same save under the existing durable payout lock. No additional money operation or network read is introduced.

Holder receipt UI tails still rotate at 100 entries; permanent events and wallet/source counters do not. Existing retained receipts seed the history on the next settlement save. Read-only reports merge retained and permanent events without modifying storage. Existing cumulative holder totals are preserved even where old dated receipts are missing.

Collection receipts are accepted only after the existing finalized Pump event/transfer reconciliation. The chain timestamp is used when supplied by the receipt reader. Developer/direct-wallet payments count as income; funding the holder vault does not. Actual subsequent recipient transfers count separately, avoiding double counting. Amounts use integer lamports throughout.

All-time is the full **recorded** history, not an estimate of all historical token fees. Missing legacy events, unavailable collection accounting and wallet-wide standard creator claims remain explicitly partial/unattributed. Unknown values are not zero. Undated legacy payments do not enter rolling time windows. Period totals with missing history remain labeled subtotals. The API exposes up to 100 recent receipts per coin but aggregates the full saved history.

Public data is explicitly allowlisted. Signing bytes, secrets, owner identifiers, eligibility lists and complete credit maps are not returned. Personal amounts require only public wallet addresses; this is not proof of wallet ownership.

## Runtime and verification

No new API key, paid RPC, cron, polling interval or worker. `GET /api/web/launch/earnings?scope=all&period=all` reads saved attempts. Personal queries default to `scope=mine` with repeated `wallet` parameters and `private, no-store`. Public responses have a short cache policy. The homepage makes one bounded public summary request, not a wallet preload.

Run `npm run build:web` and `npm test`. For isolated browser QA, run `node scripts/preview-launch-earnings.mjs`; it binds only to `127.0.0.1:4178` and uses clearly labeled synthetic records. It does not load `.env`, the bot, trading runtime, or real wallets. Never run `src/index.js` locally for visual testing.
