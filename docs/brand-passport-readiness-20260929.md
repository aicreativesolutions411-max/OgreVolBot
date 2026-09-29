# Branding, Launch Passport and release readiness

## This release

- The user's uploaded lime slime-face JPG is used unchanged for site branding. The wallet layout and game/coin-specific artwork remain intact.
- Static Open Graph and X card metadata uses a new, versioned share image. Crawlers do not need JavaScript or authentication. Main product pages have distinct titles and descriptions; older guide previews stop using the login hero.
- Launch rewards have a collapsible **Launch Passport**: saved destinations, percentages, holder rules, managed-vault disclosure, automation status, retained transaction receipts and downloadable configuration JSON with a SHA-256 fingerprint.
- Passport is not a creator signature, lock, audit, immutable commitment or new live-chain verification. Historical configuration changes are not reconstructed. Only public report fields are serialized.
- Denied Buy Bot wake-up connections back off instead of repeatedly hammering the provider. Health includes a sanitized error category and retry delay. A configured endpoint override is supported, but no provider or paid subscription was changed.
- Removed the old terminal copy describing the strongest safety filter as a 100% guarantee. Risk checks cannot promise trading safety.

## Verification

`npm run build:web`, `npm run check`, and the complete test suite must pass. Read-only responsive QA uses `scripts/preview-launch-earnings.mjs`, which has clearly labeled fixtures and cannot transact. Verify live metadata and exact asset bytes with `node scripts/check-public-branding.mjs` after release. Existing X posts may retain cached cards; publishing a new image URL does not force X to rewrite old posts.

Local results: build and syntax checks passed; 1,584 tests passed with zero failures. All six product routes and both exact image assets passed the read-only smoke. Mobile homepage and expanded Passport were checked at 390px without horizontal overflow; uploaded header logo loaded successfully.

Deployment follow-up: the CDN had cached a 200 HTML fallback for the two newly requested image paths before static deployment completed. The actual new files were present and correct with a fresh query. Image references now carry an explicit release query; smoke checks verify the exact full URLs and bytes rather than accepting a 200 response as proof of an image.

## Still required before calling the whole platform launch-ready

1. **Feed authorization:** the selected Chainstack WebSocket returned 403. Backoff contains retries; it does not repair provider credentials/permissions. Verify an authorized free endpoint or the existing subscription with the owner. Do not silently substitute billable Helius traffic.
2. **Buy notification latency:** observe actual finalized trades and delivery timestamps. Unit tests and quiet health counters do not prove an under-ten-second service level. PumpPortal trade subscriptions are metered; no wallet was funded or paid stream enabled.
3. **Telegram login domain:** link the correct production login domain in BotFather. This cannot be repaired by changing a site logo or calling a bot token endpoint.
4. **Operations:** investigate intermittent database connection timeouts; perform a backup restore drill in an isolated database; address deployment downtime from the current disk-backed service before promising uninterrupted trading.
5. **Financial launch gates:** independent wallet/custody/security review, owner-approved legal identity/terms/privacy and a funded real-device beta. No real buys, sells, launches or sweeps were performed during this pass.
6. **X:** the old unofficial DM adapter has a separate upstream compatibility error. No X Money capability is advertised or enabled.

## Staged differentiators, not shipped or advertised by this release

- **Slime Apps:** start with one functioning community tool; define hosting budget, permissions and ownership before deploying user-hosted code.
- **Slime Assist:** reviewed intents with explicit transaction previews and approvals. Reuse existing intent/trade infrastructure; never let model text sign arbitrary transactions.
- **No-SOL onboarding:** requires a capped, funded fee-payer and abuse controls. Kora is an implementation option, not free gas. Sponsor allowance and recurring costs need owner approval.
- **Community missions:** a restricted treasury, spending limits and independently verified completion criteria. Do not describe current public funding goals as escrow.
- **Community-first launch venue:** Meteora is a separate integration and audit/test project; do not re-label Pump launches as that venue.
- **Signed Passport commitments:** explicit wallet-signed manifests and durable change history are a later extension. The current hash alone does not implement these.

Reference sources for later work: [Kora](https://solana.com/docs/payments/send-payments/payment-processing/fee-abstraction), [Squads](https://docs.squads.so/main/development), [Meteora launch tools](https://launch.meteora.ag/), [x402](https://github.com/x402-foundation/x402), [PumpPortal fees](https://pumpportal.fun/fees/).

## Artwork provenance and prompt

Logo: exact copy of the user upload `2-1000038258.jpg`, 1280 × 1280, 79,658 bytes. No generated replacement is used for the site's actual mark.

Share banner: built-in image generator using that upload as its reference. Saved at `web/public/assets/slimewire/brand/slimewire-share-20260929.png`, 1734 × 907, 1,325,386 bytes. Complete logo, generous safe margins, black background and legible text inspected visually.

Generation prompt:

> Use case: ads-marketing. Create a finished premium SlimeWire social sharing banner in a wide 1.91:1 landscape composition, suitable for a 1200x630 website link preview. Input image 1 is the supplied brand logo reference: preserve its distinctive horned slime face, eyes, smile, green gel appearance and silhouette faithfully, do not redesign it or add an ogre body. Show the complete logo at the right with generous black negative space around its horns and drips, no cropping. Background nearly black with a restrained subtle deep green glow, no busy scenery, no dashboards or fake UI. Left side extremely clear polished modern sans-serif typography. Exact text only: "slimewire" in a small refined wordmark above the main headline "One home.\nEvery move." with One home. in off white and Every move. in electric lime. Under headline smaller but legible text "WALLET · TERMINAL · LAUNCH" and a restrained footer "slimewire.org". Clean precise typography, ample safe margins 8% all around, no claims about guaranteed profits, no extra words, no buttons, no watermark. The result should feel like a professionally art-directed software brand launch, minimal yet distinctive, matching the logo black and luminous lime.
