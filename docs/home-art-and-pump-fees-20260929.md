# Homepage artwork and Pump fee reference — 2026-09-29

## Shipped design

- Telegram: **Signal**, a lime-glass paper plane and communication nodes.
- Slime Games: **Horde**, an atmospheric green-fog zombie street. This is promotional artwork, not a gameplay screenshot. Existing game footage and Steam links are unchanged.
- Follow the fees: one source branching into three recipient vaults. The CTA opens `/launch/earnings` directly.
- Each image is a decorative, lazy-loaded 1440 × 720 WebP. Combined transfer size is about 325 KiB. Dark gradients preserve readable HTML headings and links on desktop and mobile.

Saved assets:

- `web/public/assets/slimewire/home/telegram-signal-v1.webp`
- `web/public/assets/slimewire/home/games-horde-v1.webp`
- `web/public/assets/slimewire/home/fees-flow-v1.webp`

Generated with the built-in image tool, with the previously approved concept board as reference. The original full-size PNG outputs remain in the local Codex generated-images folder; only optimized WebP assets ship.

## Fee display contract

The existing public earnings dashboard continues to report **verified SlimeWire payouts**, with all-time totals, per-coin details and receipts. Opening an individual coin also loads a separate **Pump reference** panel. It must never add Pump earnings to local payout totals: earned, distributed, paid and currently claimable are different measures.

- Creator mode uses `GET https://frontend-api-v3.pump.fun/fees/creator/{creator}?mint={mint}&period=30d&interval=1d`, after verifying the mint and creator with `/coins-v2/{mint}`. The `earned` field is the provider's all-time amount; the requested period applies to its series, not the earnings headline.
- Shared modes use `/fees/shareholder/{shareholder}` and require an exact mainnet chain, mint and saved sharing-config match. `totalEarned` and `totalUnclaimed` are coin-pool figures. Earlier creator-vault earnings are not included, and the coverage label says so.
- Account-wide totals and claimable balances are **not** substituted for coin earnings. Creator claims remain in Wallet because a creator vault can cover multiple coins.
- Only explicit SOL raw amounts with nine decimals are accepted. BigInt preserves precision. Missing, mismatched or malformed values are unavailable, never fabricated zeroes.
- These are public Pump frontend endpoints, not a guaranteed stable API. Unsupported coins/modes remain unavailable and retain a direct Pump link. A provider change must not affect launch, trading, rewards execution or verified payout records.
- Successful reads cache for two minutes, failures for 30 seconds; identical requests coalesce; concurrency caps at four. Failed refreshes may retain a clearly labelled stale reading for at most 30 minutes. Requests happen on coin details only, not every directory row or a polling timer.
- There are no paid RPC calls, claims, transfers or changes to payout execution in this feature.

### Read-only source verification

Pump's current frontend fee route schema was inspected in:

- `https://pump.fun/_next/static/chunks/0g33qsmxu2-wq.js`
- `https://pump.fun/_next/static/chunks/0bsli-mxk5jjb.js`
- Fee semantics: `https://pump.fun/docs/fees`

On 2026-09-29, L4S mint `29tonWkkMa9XZEF2iR8RXqkXWmPBiuKWbBUCCsFZpump` returned 7.872559004 SOL in mint-filtered creator earnings. The creator's unfiltered amount differed and an unrelated mint returned no earnings, confirming that the mint filter affected attribution. This is a point-in-time source check, not a hardcoded production figure or a personal claimable balance.

## Image-generation prompt set

Each request used this shared prefix, followed by its subject-specific paragraph:

> Use case: stylized-concept. Production website background, wide landscape approximately 2:1. Reference image is a concept board; output ONLY the requested one scene, edge to edge, no board, no frame, no labels, NO TEXT or logos. Match premium photorealistic black obsidian, chrome and luminous lime-glass SlimeWire rendering. Subject entirely inside RIGHT 55%, left 45% very dark calm negative space for HTML heading and buttons; soft natural blend not hard division. Subtle liquid-black folds with controlled lime highlights, crisp beautiful surfaces, high-end editorial product craft. No purple/blue, no fake charts/numbers, no watermark, no cropped-off main subject.

### Signal

> Follow T1 SIGNAL, top-left reference. Elegant folded paper airplane made of smoked transparent lime glass, three-quarter angle, hovering above black liquid with 3 tiny green signal orbs connected by delicate curves behind. Airplane complete in right half, nose pointing slightly upper-right. Premium communications symbol, strong immediately readable silhouette.

### Horde

> Follow G2 HORDE, middle-right reference. Cinematic abandoned urban street, several distant zombie silhouettes advancing through luminous green fog on the right, one larger looming zombie reaching toward viewer at far right but entire head and hand within frame. Subtle reflective black-liquid foreground blends website style with horror atmosphere. No blood/gore, no weapons, no recognizable proprietary characters. Promotional atmospheric background, NOT pretend gameplay screenshot. Keep left 45% almost black and featureless.

### Follow the fees

> New FOLLOW THE FEES artwork in this same visual family. A floating smoked-glass coin-like circular source on the upper-right pours a narrow lime energy/liquid stream into a beautiful black-chrome branching channel, splitting clearly into THREE distinct elegant translucent lime recipient vaults arranged in a small triangle on right half. Understated engineered sculpture showing fee distribution to multiple destinations. No currency symbols, no text, no percentages, no arrows or diagram boxes; a premium physically rendered product-art metaphor. All source and three recipients clearly visible within frame. Left 45% near-black for text.

## Verification

- Dedicated source, route and browser-renderer tests cover attribution, unknown/zero handling, precision, caching, stale expiry, concurrency, pagination, escaping and no paid-data/execution coupling.
- Existing regression suite, web build and syntax checks must pass before release.
- Desktop and 390 px mobile browser checks cover image loading, legibility, overflow and fee detail rendering using the isolated local preview script. The production bot is never booted locally.
