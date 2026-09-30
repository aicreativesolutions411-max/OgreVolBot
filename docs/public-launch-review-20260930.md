# SlimeWire public-launch review — 30 September 2026

## Decision

Ship a focused, clearly labeled product rather than expanding the set of financial promises. Wallet, Terminal, Telegram, Launch and the existing SOL fee-sharing experience are already substantial. A capability flag saying “available” is not evidence of a funded end-to-end test, safe custody, or regulatory approval.

The owner has shelved X-recipient claims because recipients must be selectable before they sign up. Do not resume Privy onboarding or turn on social claims. No account was created. Alternative quote/stock rewards, NFT floor purchases and external cash payouts are optional future products, not prerequisites for launching the supported scope.

## What was checked

- Current source, launch/earnings/community/Flows/Passport implementations and previous release evidence.
- Live public capability endpoints on `app.slimewire.org` for launch utilities, Flows and social claims.
- Live read-only `/healthz` snapshot before this release. No keys, user data or transaction payloads were exported into this report.
- Contact/homepage build, regression tests and 390px phone/desktop browser layouts. No purchases, launches, payouts, wallet funding or messages were submitted.
- Current primary documentation for Bags, Solana Actions, Solana Attestations and Squads. These inform recommendations, not a claim of integration or universal novelty.

## Launch blockers and acceptance evidence

| Priority | Finding | What closes it |
| --- | --- | --- |
| P0 | Buy alerts do not yet meet the requested under-10-second target. At the pre-release snapshot, the configured chain-wake feed had authorization errors and zero subscriptions; Pump trade streaming was disabled. Three buys were delivered since restart, two over 10 seconds; latest 37,842 ms, maximum 50,141 ms. | Restore an authorized live source within the approved budget. Measure source trade time → detection → Telegram delivery over representative live traffic and bursts; publish p50/p95 and missing/duplicate counts. A socket merely being connected is not enough. |
| P0 | Money-moving launch/reward paths need recorded funded beta and independent security evidence. Existing SOL alliance capability is enabled, but that is not proof of full validation. Flows activation is explicitly disabled. | Owner-approved test mint, wallets, recipients and maximum spend; collect fees, allocate, pay and match finalized receipts. Test restarts, delayed confirmation, insufficient funds, partial failures, concurrent retries and pause. Keep the Flows gate closed until evidence is reviewed. |
| P0 | Key custody/recovery and operator documents need sign-off. Help discloses encrypted server-managed keys, but a risk disclosure is not a complete terms/privacy package. No dedicated terms/privacy documents were found in this static source audit. | Independent security review; approved operator identity, custody disclosures, terms/privacy/data-retention policy and appropriate counsel review. Test export/restore for every managed wallet. Do not represent this code review as legal clearance. |
| P1 | Recovery and availability are not proven by a green HTTP health response. Previous release notes record intermittent database timeouts and disk-backed deployment interruption. | Restore a backup into an isolated environment, reconcile saved operations without duplicate sends, exercise failed-provider and rollback runbooks, and measure deployment downtime. Re-check current DB logs rather than assume the older failure remains. |
| P1 | Mobile/account journeys still need a funded human acceptance pass, including Telegram login domain configuration. | iOS Safari, Android Chrome, Phantom browser, Telegram webview and installed wallet: login, same-wallet identity, presets, buy/sell, TP/SL with browser closed, bundle partial failure, backup/restore and sweep. Confirm login-domain settings with BotFather; never treat local fixture QA as this test. |
| P1 | Feature readiness needs to be obvious at the moment of use. | Hide unavailable financial actions or show a clear preview label before setup. Never market social claims, asset rewards, NFT buying or Flows activation as working. Keep fee earned / reserved / finalized-paid totals separate and show data freshness. |

A small closed beta can establish this evidence. A general public financial launch should not be advertised as fully proven while these items remain open. The metrics above are a small observed sample, not a long-term latency estimate.

## Best-fit additions — proposals, not shipped features

### 1. Launch Rehearsal — the best low-risk next build

One “Rehearse launch” view walks through exact recipients, percentages, one-time costs, irreversible settings and a clearly hypothetical fee distribution. Show normal operation, low balance, missing holder data and delayed transaction outcomes before the user funds anything. End with a reusable draft, not a signed transaction.

Already present: draft readiness, server review, Flows allocation simulator, saved receipts. Missing: a unified rehearsal across the entire launch journey and failure scenarios. Reuse these modules; no new paid provider or background polling is required for the hypothetical portion. Any live quote/preflight must be labeled separately with its source and age. Effort/risk: medium UX/testing, low financial risk if strictly read-only.

### 2. Slime Proof — signed promises and visible changes

Upgrade the existing Passport from a saved JSON hash to a creator-wallet-signed, versioned record of destinations and rules. Publish a human-readable change history and opt-in alerts when mutable program terms change. An external site or Telegram card could verify the signature and follow actual payout receipts.

Already present: Passport hash, community approvals, payout receipts and approved-term invalidation. Missing: portable creator signatures, durable public revision history, and alerts. A signature proves who approved the record—not that a token is safe, that all holders consented, or that mutable settings are immutable. Start with standard wallet message signatures and signed manifests; optional on-chain attestations later add transaction/rent and operating costs. Effort/risk: medium, with replay/domain/expiry/authority review.

[Solana Attestations](https://solana.com/docs/tools/attestations) supplies schemas and authorized issuers for verifiable account-linked statements; it does not verify a claim's truth or a social account by itself. This is a possible extension, not an installed dependency.

### 3. Slime Build — fee-funded project milestones

Turn existing public funding goals into a practical delivery workspace: game update/art/community-tool milestone, recipient wallet, target, submitted evidence, named reviewers and payout receipts. This connects Launch, communities, Games and the new contact page in a way that makes the fees useful.

Already present: public project targets and fee/recipient accounting. Missing: submissions, approval workflow, disputes/timeouts, and controlled release. Start with a no-custody planning/proof board. Add capped reviewed payouts only after that is useful. Escrow requires a separately reviewed contract or multisig custody design; do not label today's goals escrow. Avoid paid-engagement tasks or unverifiable promises. Effort/risk: medium for the board, high for autonomous escrow/release.

[Squads v4](https://github.com/Squads-Protocol/v4) provides multisig, roles, time locks and spending limits that could support the controlled treasury stage. It does not supply project-completion verification or dispute handling.

### 4. Shareable community actions — distribution after reliability

Let a project share one clean page/card to open its verified fee terms, view earnings, or prepare an explicitly reviewed contribution. Existing charts and invite links are not a standards-compliant Action endpoint. A read-only embeddable “fees actually paid” card is a smaller first step than another wallet.

[Solana Actions/Blinks](https://solana.com/docs/tools/actions) can carry previewable, wallet-approved transactions on compatible clients. Telegram/X do not universally render them; preserve a regular web fallback. Add origin/rate controls, simulation, explicit signing and receipt tracking before any financial action. No blind automatic spending or new public signing key.

## Competitive interpretation

[Bags' current developer docs](https://docs.bags.fm/) list custom quote launches, launch-intent URLs, token lifetime fees, claim events, fee customization and developer/agent interfaces. SlimeWire already has meaningful overlap in launch templates, recorded earnings, allocation and wallet tooling. A small internal SDK is not an open developer platform, and a saved fee hash is not a signed commitment. Close those quality gaps deliberately; do not call this complete Bags parity.

Recommended sequence: reliability and funded acceptance → Launch Rehearsal → signed Passport/change history → project milestone board. Do not add another worker or paid API just to make the feature list longer. Budget/quota, contract review and identity remain explicit dependencies for the larger extensions.

## Contact implementation in this batch

- `/contact`: “Let’s build what’s next.” Direct Telegram handoff to the user-supplied `https://t.me/degenme420`; no messages auto-send.
- Dedicated sections for projects/collaboration, games/creative work and feedback/support, plus useful first-message context and recovery-secret warnings.
- Homepage art section, footer links, product More menus, launch-tools menu, Bot/Games/Help links, crawler metadata and sitemap entry.
- No login, wallet preload, API polling, contact form, database collection, new dependency or worker. Browser screenshots verified at desktop and 390px; no horizontal overflow, artwork loaded, homepage contact navigation worked.
- `npm test`: 1,677 passed; `npm run check` and `npm run build:web`: passed. New contact regression tests were observed failing before implementation, then passing.

## Artwork

Built-in image-generation tool; inspected output and used the existing Sharp asset pipeline for WebP delivery. New original art, not an edited logo. Shipping file: `web/public/assets/slimewire/home/contact-forge-v1.webp` (1440 × 720, 85,052 bytes). Homepage loads it lazily. Original PNG remains in the Codex generated-images folder.

Final generation prompt:

> Use case: stylized-concept. Asset type: premium website contact / collaboration hero background for SlimeWire, matching an established black liquid-obsidian and luminous lime-green visual identity. Primary request: a striking, polished 'ideas become real' digital atelier sculpture for a page inviting project builders, game creators and community feedback. Scene: a dark reflective obsidian work surface, deep black seamless backdrop. Subject: one beautifully machined black-chrome open circular portal with a flowing ribbon of translucent electric-lime slime connecting two offset interlocking sculptural pieces, suggesting conversation and collaboration; a few restrained suspended liquid droplets, refined microtexture, cinematic studio-product rendering. Composition: wide 2:1 landscape image, sculpture concentrated in the right 55%, generous nearly-black negative space in the left 45% for accessible HTML page copy, entire hero sculpture visible with safe margins, no edge clipping. Lighting: precise lime rim light, soft white specular highlights, deep charcoal shadow, premium sophisticated software-and-game-studio campaign art. Not a generic AI dashboard. Constraints: NO text, NO letters, NO numbers, NO logos, NO UI, NO buttons, NO humans, NO hands, NO robots, NO cartoon blobs, NO huge bubbles, NO coins, NO candlestick charts, NO extra clutter, NO watermark. Restrained professional art direction, crisp sculptural materials, captivating but not visually noisy.
