# Community Alliance launch release

## Delivered scope

Community Alliance is optional under NFT & Fees in the shared launch workspace
and Telegram `/launch`. The launch landing page includes an Alliance entry point
without changing the existing Liquid Obsidian visual design.

This release implements a permanent Pump creator-fee split between the selected
creator wallet and one ordinary Solana community wallet. The split must total
100%, with both recipients receiving a positive share. The community name is a
user-supplied label, not verified affiliation. This is not automatic distribution
to the partner token's individual holders, stock exposure, or a new quote pair.

The reviewed wallet, percentage and optional daily authorization are bound to the
launch attempt. Draft links cannot provide a recipient wallet, fee percentage or
distribution consent. Changing a saved launch's fee destination is rejected.

## Setup and distributions

- SOL-paired Pump launches only; runtime availability requires the enabled local
  signed Pump launcher. Daily distribution additionally requires the existing
  creator-fee runner. No new worker or paid data provider is added.
- The creator wallet pays minting, fee-sharing setup/rent and distribution costs.
  The pre-launch funding check reserves the sharing account rent, setup buffer
  and 0.003 SOL for distribution account rent.
- Optional creator, managed-wallet and invite buys wait until the final on-chain
  sharing configuration matches the reviewed recipients and percentages.
- Manual distribution and optional daily distribution use this coin's own
  sharing account. At least 0.001 SOL must be accrued. Estimated network fees
  above 0.0001 SOL are rejected; the creator must retain the 0.003 SOL reserve.
  Sibling wallets are not automatically charged for Alliance operations.
- Signed distribution intents are persisted before broadcast. Unknown signatures
  are reconciled, not blindly re-signed. Confirmed receipts remain durable.
- Daily payouts can be paused/resumed from the web or Telegram. Pausing does not
  reverse a submitted transaction or change the permanent on-chain split. A
  paused schedule will not re-sign an expired distribution.
- The UI shows transaction receipts and a distribution count, not invented
  lifetime dollar totals. Existing standard creator rewards remain wallet-wide.
- A post-mint setup failure reports the original live coin and offers setup-only
  recovery. It must not encourage a second launch.

## Removed from new-launch choices

- X/UsePaid cash routing, business/LinkedIn/Telegram identity payouts.
- NFT-floor-buying preview as a selectable fee destination.
- Stock/custom quote pairs: the executor currently supports SOL only.
- New native Pump Cashback coin creation. Existing Cashback claims are retained.
- Legacy burn/buyback/custom-recipient controls that the local Pump connector did
  not execute. Saved incompatible values are rejected rather than ignored.

Existing fee assignments, legacy claims, recovery records, linked NFT collection
creation, holder rewards, supported launch rails, bundles and invites are retained.
Saved unavailable routes are not silently converted to a different fee policy.

## Verification and boundaries

The release verification passed all 1,438 tests and the production web build.
Regression tests cover exact-recipient matching, conflicting finalized configs,
unknown transactions, setup funding, owned API/Telegram requests, fee/rent limits,
daily cadence, pause/restart recovery, persistence failures, route conflicts,
draft handoff, and legacy record retention. The full suite and production web
build are required before release.

Headless desktop/mobile checks run against the built site with external traffic
blocked and wallet/API fixtures. They cover the landing page, shared launch form,
Alliance handoff, review preview and mobile overflow. These are not funded chain
tests. No real coin, purchase, payout or wallet transfer was executed for QA.
Successful funded end-to-end launch/distribution remains a separate validation;
external providers and chain conditions cannot be guaranteed by offline tests.

## Protocol references

- [Pump creator fee-sharing lifecycle](https://github.com/pump-fun/pump-public-docs/blob/main/docs/instructions/CREATOR_FEE_SHARING.md)
- [Pump holder rewards / Cashback creation status](https://github.com/pump-fun/pump-public-docs/blob/main/docs/HOLDER_REWARDS_README.md)
- [UsePaid provider documentation](https://usepaid.app/docs)
