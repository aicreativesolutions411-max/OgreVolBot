# Slime Flows implementation and release boundaries

This release adds native SlimeWire reward programs on top of the existing managed SOL rewards engine. It is a tested foundation, not complete Bags feature parity. Production activation is disabled until a funded validation is authorized and completed. Existing launches and payout plans do not acquire a program automatically.

## Implemented functionality

The builder at `/launch/flows` supports saved drafts, templates, hypothetical allocation simulations, exact-term reviews, explicit activation and pause. It uses the existing Wallet sign-in. Telegram `/flows` opens the same builder in a DM; it does not activate a program from a group message. Product navigation links to Flows without changing the Wallet or Terminal layouts.

An eligible completed launch must have an active `holder_alliance` configuration and a dedicated rewards vault. Programs use the original developer, own-community, partner-community and up to ten receiving-wallet percentages. They cannot rewrite permanent on-chain splits. Supported schedules are 12, 24, 48 and 168 hours from the previous completed snapshot. Minimum unreserved SOL and a per-cycle maximum control new allocations. Developer fees, previously allocated credits, community rounding carry and network fees are outside that allocation cap.

Two actions are supported in a fixed sequence: allocate approved rewards, then settle saved credits. This is not an arbitrary workflow, swap or plugin runtime. The simulator uses a user-entered hypothetical unreserved vault amount. It does not read live funds, calculate live eligibility, sign or send.

## Execution and recovery

Rules and audit history are saved on the original launch attempt. Draft changes do not overwrite the approved version. Reviews expire after ten minutes and bind the mint, creator, vault, permanent policy, program definition and revision. A stale revision or changed terms fail closed. Both mutations and execution use the existing durable per-mint payout lock.

The existing server runner evaluates approved rules before new collection and allocation. It saves a deterministic allocation run before settlement. Unknown transactions reconcile before replacement. Pausing or disabling activation stops new submissions, including replacements of expired collection transactions; it does not reverse a transaction already submitted. Saved unpaid credits remain liabilities. Old credits may settle before a new program cycle when the program is active.

No new worker, API subscription, timer or paid RPC source is introduced. Drafts, reviews, simulations and dashboards use saved state, not blockchain reads. Actual payouts retain the existing finalized snapshot and bounded settlement adapters. Empty or insufficiently funded program cycles retry on the existing five-minute backoff instead of postponing a first snapshot for a full new cycle. Legacy empty-vault retry timing is unchanged. Live program execution still consumes the existing infrastructure and network fees; it is not free.

Earnings, public reward reports, Wallet-facing launch metadata and Telegram rewards report the approved cadence and paused state. Community endorsements include program limits and the approval fingerprint. Changing a program invalidates the current endorsement badge and displays `TERMS_CHANGED`; the historical approval remains saved.

## Private API and SDK

`GET /api/web/flows/capabilities` is public and contains no account data. The dashboard and all mutation routes require the existing authenticated session and server-side launch ownership. Requests are limited to 12 KB. Write operations also require the original creator wallet to remain owned by the account.

Authenticated routes are `GET /api/web/flows/dashboard` and `POST /api/web/flows/draft`, `/preview`, `/review`, `/activate`, `/pause`. The browser module `/slime-flows-sdk.js` wraps these routes. It is a first-party session client, not public API credentials or a third-party app marketplace. Never pass bearer tokens in URLs or expose them to untrusted apps.

## Production activation gate

Leave `SLIME_FLOWS_VALIDATED_VERSION` unset for this preview release. The exact value `2026-09-29-v1` enables activation and execution of approved programs. This is an operator safety gate, not evidence that validation has occurred. No deployment step should set it automatically.

Before enabling it, obtain explicit approval for a test mint, creator wallet, payout destinations and maximum total spend including network costs. Validate collection attribution, full holder snapshots, allocation conservation, actual finalized recipient transfers, process restart, pause, delayed confirmation, insufficient funding and retry behavior. Verify web and Telegram receipts against the same chain transactions. Record that evidence, review key custody and recovery, and obtain a security review before broad financial rollout. No funded test has been performed for this implementation.

## Remaining requested platform capabilities

- Verified social recipients and claims require provider identity configuration, immutable account-ID binding, recovery and dispute rules, and a separately reviewed claim custody adapter. An X handle alone is not ownership proof; X Money cash payouts are not implemented.
- Alternative quote launches, tokenized-asset rewards and baskets require supported assets, real liquidity checks, quote freshness, slippage and spend limits, conversion execution, and custody/claim validation. They are unavailable, not represented by working buttons.
- General event/webhook workflows and third-party apps require scoped developer credentials, permissions, quotas, delivery retries, secrets isolation and a constrained runtime. No user-supplied code or external URLs execute in this release.
- Larger recipient sets and new launch rails need their own transaction-size, cost and recovery tests. This release keeps the existing ten receiving-wallet limit.

## Local verification

Run `npm test` and `npm run build:web`. For visual testing, run `node scripts/preview-slime-flows.js` and open `http://127.0.0.1:4318/launch/flows`. This loopback-only fixture uses fictional in-memory launch state, never loads `.env`, has no keys or RPC adapter and cannot move funds. Activation in this fixture only changes synthetic state.

The tests cover ownership, exact decimal amounts, stale/concurrent revisions, expiry, changed terms, caps, thresholds, schedules, paused and disabled states, saved liabilities, duplicate prevention, pending-finalized reconciliation, expired collection replacement prevention, public redaction, UI escaping and authenticated API boundaries. Browser checks cover desktop and phone layouts, draft saving, simulation, approval, activation, pause and persisted state after reload. These tests do not replace funded validation or a security audit.
