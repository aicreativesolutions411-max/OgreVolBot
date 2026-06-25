# SlimeWire Launchpad — go-live runbook

Three launch rails, all minting `…SL1ME` vanity addresses with creator fees routed to the dev wallet.
This is the operator checklist to take each from "built" to "live + proven".

| Rail | Code state | What it needs to go live |
|---|---|---|
| 💊 **pump.fun** | **Live** | nothing — works today |
| 🐸 **SlimeWire (bonk / Raydium LaunchLab)** | **Live** (rides the proven PumpPortal path) | one tiny real test launch to confirm |
| 🌊 **Meteora DBC** (own curve) | Built, **dark** | a DBC config + flip 2 env vars + one tiny real test launch |

Dev fees: on pump + bonk the coin's **creator = the signing dev wallet**, so creator fees route to it automatically. On Meteora, the **config's fee claimer = the dev wallet** (set in Step B).

---

## Step A — turn on `…SL1ME` vanity addresses (optional, all rails)

Vanity is OFF until a pool of pre-ground keypairs exists. Until then launches mint random addresses (safe).

1. **Grind a pool.** A 5-char suffix is ~656M tries/key, so use a fast tool:
   - Solana CLI (fast, multi-core): `solana-keygen grind --ends-with SL1ME:25` → convert each keypair JSON into a pool entry, **or**
   - This repo (slower, pure Node): `node scripts/grind-vanity.mjs SL1ME 25 ./data/vanity-mint-pool.json`
   - GPU vanity grinder = seconds/key if you launch at volume.
2. **Put the pool on Render** at `/var/data/vanity-mint-pool.json` (the `CONFIG.dataDir` path).
3. **Flip it on:** set `LAUNCH_VANITY_ENABLED=true` (and `LAUNCH_VANITY_SUFFIX=SL1ME`) on Render. Boot logs `[vanity] enabled · pool N key(s)`.
4. Empty pool → launches fall back to random mints and log a refill warning. Never blocks a launch.

> The mint keypairs in the pool are **secret keys** — never commit them to git (the `data/` dir is gitignored).

---

## Step B — stand up the Meteora rail's fee config (dev wallet = fee claimer)

**Recommended (safe, tested): Meteora's official config tool ("Studio" / launchpad config builder).**
Create a DBC config with: quote = **SOL**, **fee claimer = your dev wallet**, collect fees in **SOL**,
migrate to **DAMM v2**. Copy the resulting **config pubkey**.

**Alternative (from code, advanced):**
```
# SIMULATE first — spends nothing:
METEORA_FEE_CLAIMER=<devWalletPubkey> node scripts/meteora-create-config.mjs --keypair ~/payer.json
# Broadcast for real (costs ~rent):
METEORA_FEE_CLAIMER=<devWalletPubkey> node scripts/meteora-create-config.mjs --keypair ~/payer.json --send
```
This helper is **unverified** — simulate + sanity-check the curve/fees before `--send`. It prints the new
config pubkey.

Then on Render set:
```
METEORA_DBC_CONFIG_KEY=<config pubkey from above>
METEORA_LAUNCH_ENABLED=true
```

---

## Step C — prove it with a tiny real launch (do this before relying on any new rail)

For **bonk** and **meteora**, launch a throwaway coin from the app (Launch → pick the rail → ~0.01 SOL dev buy):
1. Confirm the coin mints and the tx lands (the app returns the mint + signature).
2. Confirm the address ends in `SL1ME` (only if Step A is on).
3. Do a couple of buys/sells on it, then confirm **creator fees accrued to the dev wallet**:
   - pump/bonk: claim via pump's creator-fee flow (creator = dev wallet).
   - meteora: fees accrue to the config's fee claimer (dev wallet); claim with the SDK's
     `claimCreatorTradingFee` (already wired in `src/lib/meteoraLaunchService.js` as
     `buildMeteoraClaimCreatorFeesTransaction` — a claim button can be added once verified).
4. Only after fees are confirmed landing should each rail be considered "live" for real users.

---

## Env var reference (Render)

| Var | Default | Purpose |
|---|---|---|
| `LAUNCH_VANITY_ENABLED` | `false` | turn on `…SL1ME` vanity mints (needs a pool on disk) |
| `LAUNCH_VANITY_SUFFIX` | `SL1ME` | the vanity suffix (base58-valid only) |
| `METEORA_LAUNCH_ENABLED` | `false` | un-dark the Meteora rail |
| `METEORA_DBC_CONFIG_KEY` | — | the DBC config pubkey (Step B) that routes fees to the dev wallet |

## Honest status
- pump + bonk: structurally correct (creator = dev wallet); bonk wants one real test launch to confirm end-to-end.
- meteora: real code, **never run on-chain from here** — Step B + Step C are required and were not certified by the build. Treat it as untested until a real launch proves fee routing.
