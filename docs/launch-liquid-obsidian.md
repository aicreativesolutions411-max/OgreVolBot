# Launch / Liquid Obsidian

Selected direction: user-approved option 01, September 27, 2026.

## Implementation

- `/launch`: actual responsive HTML/CSS, not a screenshot. Existing SlimeWire logo.
- Generated art is decorative only. Buttons, typography, search, cards and dialogs are native controls.
- Public directory reads only whitelisted metadata from completed launch attempts. One-minute coalesced server cache, no RPC or paid metadata API calls. Manual browser refresh; no polling.
- My launches uses the existing authenticated endpoint on demand; no account data in the public response or public browser cache.
- Create prepares a draft for the existing reviewed launch workspace. It cannot choose a wallet, authorize a trade, redirect fees or submit a launch.
- Existing launch/fee execution, invitations, rewards, NFT collection and recovery flows are untouched.
- X Money provider warning is a dated September 27 snapshot of https://usepaid.app/docs, which reports payouts paused. No cash balance or claim action is fabricated. The redesign does not alter existing fee assignments or provider configuration.
- Google/LinkedIn/Telegram identity payouts and custom quote pairs remain marked not enabled. This visual release does not implement those adapters.

## Coin artwork follow-up

- IPFS PFPs load from Pump's image gateway first, with bounded exact-CID Pinata/original URL fallbacks. Direct `ipfs://` and older `imageUrl` metadata are retained.
- Only visible/near-visible avatars load. Retry timers and observers are stopped on refresh/search/view changes. No metadata API, wallet read, paid RPC call or periodic polling was added.
- A coin without published/stored artwork keeps its initials; another token's picture is never substituted.
- Pump's [supported pair assets](https://pump.fun/docs/custom-pairs) include selected crypto and tokenized stocks (checked September 27, 2026), but SlimeWire's current launch executor remains SOL-based. A real quote-asset integration must cover funding, swaps, fees in the quote asset, recovery and issuer eligibility before it can be enabled; a dropdown alone is not sufficient.

## Artwork

Built-in image generation, not API/CLI fallback.

- Source copied into project: `web/public/assets/slimewire/launch/liquid-obsidian-v1.png`.
- Web delivery: `web/public/assets/slimewire/launch/liquid-obsidian-v1.webp` (Sharp format/compression only; no crop or artistic edits).
- Reference: approved `01-liquid-obsidian.png` mockup from the six concept directions.

Final prompt:

> Use case: style-transfer. Asset type: production website hero background, wide landscape 1536x1024. Image 1 is STYLE REFERENCE ONLY: the user approved its Liquid Obsidian black-and-acid-green sculptural artwork. Create a clean standalone background asset from that art direction, NOT a website screenshot. Scene: almost-black obsidian studio backdrop, deep forest-black with very fine physical grain. Subject: one elegant liquid ribbon of translucent emerald slime fused with glossy black chrome, sculpted as an abstract flowing S, with sharp lime glass highlights and beautiful true reflections. Composition: sculpture occupies the RIGHT 60 percent, flowing from top center toward lower right, with no circles or generic blobs. LEFT 45 percent is quiet near-black negative space so real HTML headings can sit over it. Sculpture should feel expensive, tactile, unique, dynamic but controlled; no neon fog, no excessive bloom. Reference the precise green/black ribbon material in upper right of Image 1. Bottom and left edges fade naturally into near-black #080b09 for website compositing. Only the sculpture and backdrop. STRICTLY NO TEXT, letters, numbers, logos, symbols, UI, panels, buttons, frames, labels, coins, people, watermark or branding. No orange, blue or purple. This is final art for SlimeWire launch page.
