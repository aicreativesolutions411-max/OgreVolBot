# Launch utilities — implementation and activation status

## Available in this change

- One optional **NFT & Fees** tab in the main terminal and the embedded Wallet/Fun launcher. Existing creator, holder, Cashback, bundle and participant controls remain intact.
- The legacy web app and Telegram `/launch` expose the same collection and utility choices. The default does not redirect creator fees.
- Linked Metaplex Core collection creation is no longer hidden or overwritten with `enabled:false`. Its own metadata records the linked coin rather than reusing the coin's metadata JSON. Existing collection controls check creator authority.
- Separate collection recovery after the coin succeeds; never mint another coin to retry NFT setup.
- Public Magic Eden listing previews, request coalescing, a 15-second cache and exact integer budget calculations. No background indexing, new worker or paid RPC polling is added.
- UsePaid route validation, metadata directive, explicit per-launch consent, official Pump single-recipient setup and on-chain verification. The destination is pinned before mint submission. Uncertain signatures are reconciled before rebuilding; dev/bundle/invite buys wait for active fee setup. The existing creator-fee runner retries setup at most every five minutes. Once active, UsePaid, not SlimeWire, handles claims/cash payouts.
- Setup receipts and separate on-chain-routing versus cash-payout status. User-owned retry endpoint: `POST /api/web/launch/utility/retry` with `launchAttemptId`.
- Recovery buttons are wired in Terminal, Wallet/Go, legacy web, and Telegram. The same original launch is reconciled; retry never creates another coin.
- Telegram confirmation is bound to the entire reviewed draft, creator wallet, provider recipient and user. Repeated clicks retain the same attempt ID. Its dev-buy exit choice is part of the durable buy intent; "hold" no longer inherits default TP/SL settings, and local launches do not install a second competing exit.
- Telegram → Terminal links preserve the NFT selection, recipient and dev-buy amount, but never carry approval, credentials or an existing launch ID.
- Fee setup distinguishes an empty RPC result from an RPC failure, waits for finalized expiry and rechecks the signature before rebuilding.

## Not live / not complete

**Native NFT floor buying is preview-only.** There is no purchase-signing adapter or live per-coin NFT treasury in this change. No fees can be redirected into an unimplemented treasury. This is not the automatic Sweep-like engine yet. Burn/giveaway/lottery distribution is not implemented or advertised as live.

Access check on 2026-09-22: public listing reads returned real listings without a key. The official `/v2/instructions/buy_now` endpoint returned **HTTP 401** for a read-only unsigned-instruction request using a fresh public listing. `MAGIC_EDEN_API_KEY` is not configured locally. Marketplace instruction access must be arranged before the purchase adapter can be validated end-to-end. The probe did not sign or submit a transaction.

Before enabling native purchases, implement and integration-test a marketplace adapter for each supported NFT standard. It must verify collection membership on-chain, reject creator/self-dealing listings, cap all-in price plus rent/gas, use a dedicated recoverable vault per coin, lock/reserve purchases durably, persist signed bytes/signature/expiry before broadcast, reconcile ambiguous outcomes, and verify ownership/actual debit before recording a completed receipt. The planner is intentionally separate from that money-moving adapter.

**UsePaid is off by default in an unconfigured deployment.** On 2026-09-22, the official `https://usepaid.app/launch` → **Register** screen displayed the following Pump fee-sharing recipient. This is a **Pump social fee PDA**, not an on-curve treasury wallet. A read-only public Solana RPC check verified its owner as the official Pump Fees program and decoded `userId=322216527`, `platform=2` (GitHub); the SDK-derived PDA matched. The code pins the address and verifies its account type before a new launch or setup signature. Activation requires all of:

```text
USEPAID_ROUTING_ENABLED=true
USEPAID_TREASURY_SOLANA=FfLpuH4WPn2MR8Lqn1MpwQc1HtAPPqL3qvMWZjnFHGpv
USEPAID_TERMS_REVIEWED_VERSION=2026-09-22
```

Do not substitute an arbitrary valid address: the configuration and pinned source must agree. Terms v1.5 (17 September 2026) were reviewed; users accept them individually at launch. The provider does not publish its legal operator identity. It is not affiliated with X, and naming an X account does not imply endorsement. No live cash payment has been independently verified by SlimeWire. On-chain routing status never claims that cash was paid. Confirm the creator-fee recovery runner is enabled. There is no invented X Money cash-payout API.

Pump-only, 100% irrevocable routing, no simultaneous Cashback, holder/promoter shares, burn or buyback. Robinhood is explicitly rejected. An already-active route is displayed even when deployment configuration is later disabled; disabling the app cannot revoke an on-chain immutable route.

## Interfaces

- `GET /api/web/launch/utility/capabilities` — public availability, no secret values.
- `POST /api/web/launch/utility/review` — authenticated, read-only policy validation and optional listing preview.
- Launch body `launchUtility: {mode:"creator"}` preserves existing routing.
- `launchUtility: {mode:"usepaid",xHandle:"handle",consentVersion:"2026-09-22"}` is only accepted when deployment verification is configured.
- `nftCollection` remains independent of fee utility. Creating an empty collection does not imply automatic NFT item minting, marketplace listing, NFT purchases, or guaranteed revenue.

## Sources

- https://usepaid.app/docs — required metadata, whole-fee permanence, provider split and eligibility claims.
- https://usepaid.app/legal/terms and https://usepaid.app/legal/disclosures — provider risk/terms review.
- https://github.com/pump-fun/pump-public-docs/blob/main/docs/instructions/CREATOR_FEE_SHARING.md — official sharing-config lifecycle.
- https://docs.magiceden.io/reference/get_collections-symbol-listings — free public listing reads; `sort_direction=asc` verified against the live endpoint.

## Local validation

`npm run build:web`, `npm test`. Use `node scripts/preview-launch-utility.js --usepaid-preview` for a local UI-only server at `http://127.0.0.1:4178/#launch`. The optional flag previews the available disclosure using public configuration, not live credentials. It never loads `.env`, signs, launches, or trades. All non-preview API actions are denied.

Run `node scripts/check-launch-utilities.js --render` for a read-only, paginated production configuration audit plus a public-chain recipient check and free listing probe. It prints no secrets and never signs or broadcasts. If a marketplace key exists, its instruction-access probe uses a fresh public buyer key without saving a wallet or submitting a purchase.

This revision passed all **1,390 tests**, built successfully, and was checked in the browser. The suite includes long/short TP and SL, duplicate exits, launch-consent binding, expiry/RPC-failure recovery, deep links, provider-account validation, HTML escaping, configured API-origin routing and exact Render-deploy verification. The shared utility script is versioned on every app surface to avoid the public site's four-hour asset cache retaining an older check. No live launch, fee reconfiguration, NFT mint/purchase or cash payout was tested.

Production configuration was set to the three reviewed UsePaid values above on 2026-09-22. The live API on `app.slimewire.org` returned UsePaid and linked-collection availability; anonymous review and retry requests returned 401. The apex domain is not a general API proxy, so clients must respect `OGRE_PORTAL_CONFIG.apiBase`. Render's web service was observed with auto-deploy enabled despite the older project note; the release script now follows a matching in-flight deployment instead of creating a duplicate and only reports live after checking both deployment ID and exact commit.

Production release status is recorded in the task handoff. No money transaction is part of this implementation session. Native NFT purchases remain incomplete and cannot be activated by simply adding a key: the signer, isolated treasury, settlement/recovery and distribution engine still need implementation and end-to-end validation against an accessible provider.
