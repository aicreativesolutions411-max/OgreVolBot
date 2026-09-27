# Launch + Wallet experience release

## Included

- Launchpad offers Keep my fees, Reward my community, and Reward two communities.
- Both holder modes use the same server-side 12-hour allocator: strictly >$20,
  balance-weighted, full finalized snapshots, retained dust and durable retries.
- A zero-share community is neither queried nor allocated funds. Creator retains
  at least 1%; the existing two-recipient Pump setup cannot represent a 0% creator.
- New ordinary creator launches default to manual claims. Existing preferences
  are preserved. Because standard claims are wallet-wide, a manual coin blocks
  automatic creator claims for that same wallet; per-coin sharing is unaffected.
- Public, read-only reward reports expose confirmed holder totals and receipts,
  reserved obligations, next snapshot, and queried-wallet last-snapshot eligibility.
  They do not expose encrypted vaults, signed bytes, user IDs or full holder lists.
- Saved templates contain identity and selected route only; every launch requires
  fresh recipient/cost review. No stored approval, payment amount or wallet secret.
- Launch cards and new Telegram chart links use DexScreener. Old root trade
  hashes and chart-only Telegram Go links redirect by exact CA and chain. Explicit
  /terminal, /wallet, /t risk reads, buy, claim, login and invite routes are preserved.
- Main homepage is not replaced. Wallet appearance is unchanged.

## Not enabled / remaining work

Do not advertise custom asset or stock-token launch/rewards as live.

Pump's official custom-pairs page lists many assets, but a read-only inspection
of its mainnet Global account on 2026-09-27 found createV2Enabled=true and only
USDC in whitelistedQuoteMints. Pump SDK supports quote-aware V2 instructions;
SlimeWire creation/funding/bundles, claims, fee-vault accounting and holder
transfers still execute SOL-specific paths. Those paths must all become
quote-aware, including token decimals, ATAs/rent, funding, simulations, recovery,
and reconciling token balance deltas before USDC can be exposed. Never remove
the non-SOL backend guard merely to display a dropdown.

Other crypto quotes require live whitelist verification. Stock-token issuers
also impose jurisdiction/recipient eligibility rules. No compliance integration
exists here. X payouts and unsupported providers remain unavailable.

Legacy holder policies are not migrated: doing so would change existing holders'
eligibility and permanent fee promises. New terminal launches use the unified
choices; original recovery paths remain intact.

## Verification

Offline allocation/settlement integration tests cover own-only and two-community
rewards, unknown/finalized submissions, duplicate prevention, persisted liabilities,
pause/retry, unavailable snapshots and public data minimization. Browser QA uses
local fixtures at desktop/mobile sizes with external requests blocked. No funded
launch, buy, claim or distribution is submitted for testing.

Sources: https://pump.fun/docs/custom-pairs and
https://github.com/pump-fun/pump-public-docs/blob/main/docs/instructions/CREATOR_FEE_SHARING.md
