# Holder Alliance

Optional Pump/SOL launch mode: `holder_alliance`. Configure positive whole
percentages (at least 1% each, totaling 100%) for the launcher, the new coin's
holders, and a different Solana token's holders. Default draft: 20 / 40 / 40.
Existing `alliance` wallet splits are unchanged and cannot be converted.

## Routing and custody

Pump's finalized two-recipient configuration pays the launcher and one unique,
encrypted per-mint holder vault. The holder vault's share is the sum of the two
community percentages. Its key uses the existing holder-vault recovery artifact
and off-box backup path. Setup is verified before optional buys/invites resume.
This is SlimeWire-managed distribution, not Pump's native holder rewards.

## Eligibility and accounting

- New snapshots at least 12 hours apart; failed data reads retry later.
- Strictly over USD 20 of the respective token, aggregated by case-sensitive
  wallet address. Eligible balances weight each community's pool independently.
- A wallet can qualify for both communities, including the launcher.
- Full finalized SPL / Token-2022 enumeration uses free Solana public RPC,
  capped at 24 MB and 25 seconds per community. No top-holder fallback.
- Verify token account mint, account type/state, raw amount and recipient owner.
  Exclude burn addresses, off-curve owners, programs and the distribution vault.
- Pricing uses a fresh liquid indexed USD market ($1,000+ liquidity) or a
  verified funded SOL Pump curve plus liquid SOL/USD quote. Missing prices or
  an unsupported curve defer payouts. Eligibility is spot value, not a promise
  of realizable sale proceeds or a continuous-holding requirement.
- Initially supports up to 2,000 eligible wallets per community. Above that,
  defer the whole snapshot, never silently pay just the first 2,000.
- Keep 0.001 SOL in the holder vault. Track reserved credits and community carry
  amounts before allocating new deposits. Community pools with no eligible
  holders and rounding remainders carry forward within that community.
- Rewards accumulate until a wallet has at least 0.001 SOL. Creator pays network
  fees, capped at 0.0001 SOL per transaction; 8 transfers per batch. Creator must
  retain 0.003 SOL plus the fee. Large cycles settle across multiple batches.

## Execution and recovery

The existing web/bot process owns an in-process queue (no new paid worker).
Idle queue checks read local state, not RPC. Due jobs use distributed money locks;
production does not downgrade to a memory lock during a lock-service outage.
Persist the signed payout plus frozen recipients before broadcasting. Require
finalization to debit liabilities; reconcile unknown outcomes before rebuilding.
Expired/failed intents retain the same recipients. Never reweight a retry.
Ledger records survive launch-history compaction and include aggregate totals
and the last 100 batch receipts (last 20 exposed in the owned launch view).

Pause stops new automatic transactions/snapshots, not already-signed outcomes.
Earned credits remain reserved. New mode has per-launch versioned consent and
cannot combine with legacy holder rewards, cashback, buyback or other fee routes.

## Entry points

- `/launch` > Holder Alliance > launch workspace > NFT & Fees.
- Shared Terminal / Fun / Wallet launch screen: fee utility dropdown.
- Telegram DM `/launch` > NFT & fee utility > Holder Alliance.
- Owned launch cards/messages expose receipt refresh and pause/resume.

## Verification

Offline tests cover policy consent, complete source validation, exact balances,
strict USD threshold, both pools, dust, cadence, interrupted persistence, restart,
unknown/forked outcomes, finalized receipt accounting, setup gating and pause.
Desktop/mobile browser QA uses blocked external traffic and no funded wallet.
Read-only mainnet L4S snapshot succeeded on 2026-09-27 (36 eligible wallets at the
observed price). No funded launch or distribution was performed in this release.
