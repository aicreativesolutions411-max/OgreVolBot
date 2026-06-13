# SlimeWire Swamp — Build Plan & Agent Coordination

Two agents work this repo (Claude + Codex). To avoid clobbering each other's
edits and rebuilds, we split by **file ownership** and keep a shared task queue.

## File ownership (do not both edit the same file at once)
- **Claude owns:** `web/public/swamp.html` (game engine/UI/logic), `src/index.js`
  swamp endpoints, game JS. If Codex must touch swamp.html, post here first.
- **Codex owns:** asset generation + processing under
  `web/public/assets/slimewire/swamp/**` (sprites, tiles, sheets, audio),
  chroma-key/cutout cleanup, and the `swamp-assets-manifest.json`.
- **Either** may run `npm run build:web`, but **commit + push immediately** after
  so the other can rebase. Small, frequent commits. Never leave the tree dirty for long.

## How the game consumes assets (so Codex names things right)
- Creature sprites: `assets/slimewire/swamp/sprites/<id>.png` (256px, transparent).
  Wired ids: fresh-slime, runner-slime, shiny-slime, toxic-rug-slime,
  sell-pressure-slime, liquidity-slime, small-ogre, ogre-boss, candle-slime,
  chart-wing-slime, pump-rocket-slime, swamp-trader-ogre (= player).
- Ground/deco tiles: `assets/slimewire/swamp/tiles/<name>.png` (128px ok, drawn at 32).
  Wired names: grass, grass-2, tall-grass, tall-grass-2, water, path, plank,
  stump, rock, mushroom, lilypad, portal, flowers. (NOW LIVE in the overworld.)
- The game auto-falls back to procedural art if a file is missing, and re-paints
  the map when tiles finish loading. So partial drops are safe.

## CODEX TASK QUEUE (highest value first)

### 1. Walk-cycle sprite sheets → individual frames
Slice the walk sheets into per-direction frames the engine can animate.
Deliver as `assets/slimewire/swamp/walkers/<id>-<dir>-<n>.png` (64px, transparent),
dir ∈ {down,left,right,up}, n ∈ {0,1,2} (0=left-step,1=idle,2=right-step), for:
`player` (trader ogre), `fresh-slime`, `runner-slime`, `ogre-boss`.
OR a clean uniform sheet `<id>-walk_64x64_3x4.png` (3 cols × 4 rows, row order
down/left/right/up) and note it in the manifest — Claude will slice deterministically.

### 2. Audio (small files, big immersion)
`assets/slimewire/swamp/audio/`: `swamp-ambient.ogg` + `.mp3` (30–60s seamless
loop) and short sfx `catch/throw/miss/levelup/ui/boss` (.ogg+.mp3, <1s each;
boss 1–2s roar). Claude will swap the synth audio for these when present.

### 3. Building props (individual transparent PNGs in `tiles/` or `props/`)
`launch-lab`, `trading-post`, `proof-totem`, `volume-lab` (new), plus a clean
`portal` and `chest`/`egg`/`signpost` cut from the environment sheet. Sizes per
`docs/swamp-asset-spec.md`.

### 4. More creature skins (optional, expands variety)
Extra slime types so the `SLIME_SKINS` rotation grows: whale-slime, ghost-slime,
diamond-slime, jeet-slime, etc. Same 256px transparent style. Add to manifest.

### 5. Title / branding
`title-bg.png` (swamp vista ~1024×576) + `swamp-logo.png` (transparent wordmark)
for the start screen.

## CLAUDE TASK QUEUE (engine — in progress / next)
- [DONE] sprites, player, title screen, synth music, catch arena (drag-throw),
  Arena battle vs bots, cursed-ghost rug mechanic, evolution, painted tiles.
- [NEXT] wire walk-cycle frames (after Codex #1); real PvP + public leaderboard
  (server endpoint in src/index.js); wallet-login save (ties to SlimeWire account);
  community raid on launched OGRE bosses; tournaments/seasons; breeding.

## Style rules (keep consistent — see docs/swamp-asset-spec.md)
Top-left light, soft shadows, swamp greens/teals, toxic-purple for rugs, gold
accents, subtle dark outlines readable at ~40–64px. Transparent PNG (or pure
`#FF00FF` chroma — Claude auto-keys/despeckles).
