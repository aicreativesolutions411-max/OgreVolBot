# SlimeWire Community Hub

Entry point: `slimewire.org/launch/community`, redirected by Pages to
`app.slimewire.org/launch/community` to share Wallet's same-origin sign-in session.
Agreement query strings and selected-tab fragments are retained; no auth token
is passed in a URL. The launch page links here; Wallet retains its
existing layout with an added Rewards inbox shortcut. Telegram DM commands
`/community` and `/rewards` open the tools or read the account's saved rewards.
Group commands never disclose a user's private managed-wallet list.

## Supported flows

- **Connect an existing coin:** SOL-paired Pump coin, creator's managed wallet,
  unlocked fee configuration. Review is read-only and expires after ten minutes.
  Confirmation freezes the mint, wallet and split before reusing the existing
  durable Pump fee-sharing setup. No token launch or initial purchase occurs.
  Setup reserve/rent limit: 0.02 SOL. Setup transaction network-fee cap: 0.0001 SOL.
  Pump fee shares are permanent. Cashback, Mayhem, non-SOL coins and previously
  customized/locked programs cannot be overwritten. Graduated creator authority
  comes from the canonical PumpSwap pool; pre-graduation from the bonding curve.
- **Partnerships:** an active two-community holder program's creator proposes its
  exact terms. The recipient coin's verified creator wallet must approve the same
  terms hash. Seven-day invite expiry; public wallet approvals; no financial action
  on acceptance. Withdrawal removes endorsement, not permanent shares or debt.
  This proves wallet authority, not real-world identity or every holder's consent.
- **Rewards inbox:** saved eligibility, reserved liabilities and retained,
  wallet-specific finalized payments. No estimated earnings or batch-total
  attribution. Prior batch-only history is not claimed as wallet-level history.
  Totals are recent retained receipts, not lifetime earnings. Creator claims stay
  in Wallet. Existing strictly-over-$20 eligibility, 12-hour snapshots and
  0.001 SOL minimum payout rules are unchanged.
- **Project goals:** one public SOL target per active manual treasury program.
  No use of holder liabilities. Publishing a goal does not transfer money.
  Distribution is separately reviewed and uses the existing immutable split;
  the target does not cap or stop payments. The creator manually checks receipts.
  Only server-recorded fee distributions after goal creation, verified finalized
  on-chain and scoped to the coin sharing account, contribute to progress. Check
  receipts regularly: the source distribution history retains its latest 100
  records. Goals are not escrow or verified charities; payees control received money.

## Persistence, costs and safety

`CONFIG.dataDir/launch-community-hub.json` stores reviews, proposals and goals.
Include it in the existing persistent data backup. All mutations run under the
fail-closed distributed money lock, and writes use atomic JSON persistence.
An unavailable or corrupt file is an error, not permission to reset history.

On-chain authority and goal-receipt reads are on-demand using the public Solana
RPC. Holder preflight requires the existing complete finalized holder snapshot;
partial lists, unavailable data or unsupported pricing prevent configuration.
No paid provider, new worker, background wallet poll or subscription was added.
Existing server-side reward settlement remains responsible for payouts even
when the browser is closed. The new UI cannot monitor trades or trigger exits.

Do not run `src/index.js` locally for a preview: it starts live bot services.
Regression tests use injected storage, authority, signing and RPC fixtures.
Browser QA uses an isolated mock server, not a funded account. Real mainnet
setup/distribution is not proven by the offline tests; never claim a funded
transaction was completed without an actual finalized receipt.

## Routes

Public GET: `community/public`, `community/inbox` under `/api/web/`.
Authenticated GET: `community/dashboard`, `community/my-inbox`.
Authenticated POST: `community/connect/review`, `community/connect/confirm`,
`community/partnership/propose`, `community/partnership/respond`,
`community/goal/create`, `community/goal/sync`.
Actual manual fee distribution reuses `launch/utility/retry` with
`action: distribute` and the owned launch attempt ID.
