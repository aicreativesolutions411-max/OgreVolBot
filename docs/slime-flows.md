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

Authenticated routes are `GET /api/web/flows/dashboard` and `POST /api/web/flows/draft`, `/preview`, `/readiness`, `/review`, `/activate`, `/pause`. The browser module `/slime-flows-sdk.js` wraps these routes. It is a first-party session client, not public API credentials or a third-party app marketplace. Never pass bearer tokens in URLs or expose them to untrusted apps.

The **Check live prerequisites** button performs an owner-only, read-only check on the selected coin. It verifies the running reward loop, a shared safety lock, encrypted wallet records, finalized fee configuration, native account ownership, vault coverage of saved liabilities, creator fee funding and complete holder snapshots. Provider failures remain unknown, not zero balances or passing checks. It does not decrypt keys, simulate a transaction, collect fees, allocate rewards or submit payments. The check uses free read sources, runs only on demand, coalesces repeated clicks and reuses its result for one minute per coin. A changed saved program invalidates the report. Passing prerequisites is not funded validation or a security audit.

## Production activation gate

Leave `SLIME_FLOWS_VALIDATED_VERSION` unset for this preview release. The exact value `2026-09-29-v1` enables activation and execution of approved programs. This is an operator safety gate, not evidence that validation has occurred. No deployment step should set it automatically.

Before enabling it, obtain explicit approval for a test mint, creator wallet, payout destinations and maximum total spend including network costs. Validate collection attribution, full holder snapshots, allocation conservation, actual finalized recipient transfers, process restart, pause, delayed confirmation, insufficient funding and retry behavior. Verify web and Telegram receipts against the same chain transactions. Record that evidence, review key custody and recovery, and obtain a security review before broad financial rollout. No funded test has been performed for this implementation.

The test operator should first open the coin in Flows, save the intended program and run **Check live prerequisites**. Resolve every blocked or unknown prerequisite, then conduct the separately approved funded test. A low reward balance is shown as waiting for fees; it is not permission to transfer money from another wallet. The release gate must stay unset until the evidence is reviewed. A successful local fixture or an enabled environment variable does not supply that evidence.

## Buy feed operational limits

The background Solana wake feed no longer inherits the trading RPC or its paid credentials. An explicitly configured `GROUP_BUY_CHAIN_WAKE_WS_URL` or `CHAINSTACK_WSS` remains authoritative. Without one, the bot uses a best-effort public Solana stream capped at 32 subscriptions. The same public cap applies when the public endpoint is explicitly selected through `GROUP_BUY_CHAIN_WAKE_WS_URL`; it does not become a 200-subscription dedicated service. Subscription failures retain backoff; an open socket alone is not a successful subscription. Unacknowledged subscriptions time out after six seconds, old-socket errors cannot poison a replacement, and one failed socket counts only once. This public fallback is not a production latency guarantee. See [Solana public endpoint limits](https://solana.com/docs/references/clusters).

Pump HTTP 429 responses now enforce the full provider retry deadline for every priority. New requests that cannot fit within the queue deadline are deferred instead of repeatedly expiring. Trade pagination remains saved for recovery. If the free feed is throttled, under-ten-second delivery cannot be promised; a working authorized live source and enough quota are required. No paid feed is enabled by this change.

Activity signals during a cooldown now coalesce into one scheduled retry per mint. A forced wake does not bypass the provider deadline, and local queue deferrals do not inflate the exponential provider-failure counter. The exact saved page resumes at its retry deadline rather than waiting for another full rotating recovery pass. Removing a tracked mint clears its deferred timers.

`/healthz` reports deferred mints and a bounded last-200-deliveries timing window: source-to-outbox delay, outbox-to-Telegram delay, and total p50/p95 with the sample count. Only notifications with known, ordered source/enqueue/delivery times count; unknown times remain unmeasured. These are per-alert samples since process restart, not a guaranteed SLA or a unique-transaction count. No wallet, transaction or chat identifiers are stored in the timing sample array.

## Remaining requested platform capabilities

- Verified social recipients and claims require provider identity configuration, immutable account-ID binding, recovery and dispute rules, and a separately reviewed claim custody adapter. An X handle alone is not ownership proof; X Money cash payouts are not implemented.
- Alternative quote launches, tokenized-asset rewards and baskets require supported assets, real liquidity checks, quote freshness, slippage and spend limits, conversion execution, and custody/claim validation. They are unavailable, not represented by working buttons.
- General event/webhook workflows and third-party apps require scoped developer credentials, permissions, quotas, delivery retries, secrets isolation and a constrained runtime. No user-supplied code or external URLs execute in this release.
- Larger recipient sets and new launch rails need their own transaction-size, cost and recovery tests. This release keeps the existing ten receiving-wallet limit.

## Local verification

Run `npm test` and `npm run build:web`. For visual testing, run `node scripts/preview-slime-flows.js` and open `http://127.0.0.1:4318/launch/flows`. This loopback-only fixture uses fictional in-memory launch state, never loads `.env`, has no keys or RPC adapter and cannot move funds. Activation in this fixture only changes synthetic state.

The tests cover ownership, exact decimal amounts, stale/concurrent revisions, expiry, changed terms, caps, thresholds, schedules, paused and disabled states, saved liabilities, duplicate prevention, pending-finalized reconciliation, expired collection replacement prevention, public redaction, UI escaping and authenticated API boundaries. Browser checks cover desktop and phone layouts, draft saving, simulation, approval, activation, pause and persisted state after reload. These tests do not replace funded validation or a security audit.
