# Launchpad product direction

## Released UI cleanup

The launchpad is for creating and discovering SlimeWire launches; Wallet owns
general token lookup, trading and creator claims. The previous hero-level
"paste a CA" input incorrectly suggested a universal token search. Move it into
the directory as an optional Find a launch control, explicitly scoped to recent
recorded launches. Accept raw CAs, $tickers, Pump coin URLs and SlimeWire coin
URLs. Preserve case for Solana addresses. Never treat a DEX pool URL as a mint.
An unmatched valid address gets an explicit read-only Wallet navigation link,
not an automatic trade. The public directory currently contains at most 90 recent
launches; do not claim that an absent address never launched through SlimeWire.

Show all / shared-fee / creator-fee filters, correct result counts, recent-first
ordering, clean PFP cards, fee destination and public receipts. Remove generic
repeated card descriptions. Keep the existing SlimeWire artwork, launch options,
wallet design and home page. No new polling, paid API, wallet preload or changes
to financial execution in this batch.

## What to borrow from Paid

UsePaid separates Explore, Payments, Analytics and Launch and gives each token
and recipient a destination with payment history. Borrow the clear separation
and emphasis on proof, not its branding or payment claims. Its docs currently
show an X Money payout pause; do not re-enable a rail merely because its older
promotional copy still describes it. Browser navigation was refused during this
review; comparison used freshly indexed official pages, not a live visual audit.

## Next products, not live features

1. **Bring your coin.** Let an authorized creator connect an existing eligible
   Pump coin to holder rewards without launching a replacement. Verify mint,
   fee authority, immutable sharing state and every recipient; simulate setup;
   migrate nothing silently. Third-party launch discovery must not import private
   wallet data. Existing locked splits may make a coin ineligible. This expands
   the audience beyond new launches and reuses the current reward engine.
2. **Verified Community Alliances.** Two communities accept a public agreement
   with wallet signatures: exactly which fee stream, recipients, percentages and
   schedule. Community identity needs independently established authority; merely
   controlling a fresh wallet is not proof of representing a community. Publish
   "unverified" until checked. Revoking a profile endorsement must never pretend
   to undo an irreversible on-chain fee split.
3. **One rewards inbox.** A wallet can see its finalized receipts, reserved
   amounts, last-snapshot eligibility and delays across participating programs,
   on the web and in Telegram. No signature to view public data; authenticated
   opt-in for alerts, with rate limits and an off switch. Keep paid, pending and
   estimated future amounts separate. This is useful even without a launch.
4. **Community-funded work.** A project creates a public funding goal for an
   artist, game update or community expense. Show accrued fees and actual payments
   against a budget, not promised investment returns. Start with verified payee
   wallets and manual reviewed payouts; milestone escrow, disputes and charity
   assertions require separate contracts, review and operating rules.
5. **A verifiable track record.** Shareable program pages show uptime, successful
   payout batches, delays and funds owed with receipts. No "safe coin" score or
   price-multiple ranking. Add a read-only embed so the program's proof can travel
   with its own website and Telegram community.

Build 1 and 3 first; validate demand with existing community operators before
adding more financial rails. These are differentiation hypotheses, not claims
that no competitor offers them or guarantees of adoption. Plain holder rewards
alone are not a new category: Pump already advertises holder rewards.

Sources reviewed: https://usepaid.app/explore, https://usepaid.app/payments,
https://usepaid.app/docs, https://pump.fun/docs/fees,
https://github.com/pump-fun/pump-public-docs/blob/main/docs/instructions/CREATOR_FEE_SHARING.md
