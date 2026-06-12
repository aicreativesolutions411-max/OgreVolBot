# SlimeWire Swamp — Asset Request Spec (for the asset-generating AI)

Drop everything under `web/public/assets/slimewire/swamp/`. Use the existing
creature sprites as the quality/style bar (256px, transparent PNG, console-tier
pixel art, swamp-green palette). **Transparent PNG, no chroma background** — but
if you must use chroma, use pure magenta `#FF00FF` so it keys cleanly.

Two formats accepted:
- **Individual transparent PNGs** (preferred — zero slicing guesswork), OR
- **Uniform grid sheets** — ONLY if every cell is the exact same size; state the
  cell size + columns/rows in the filename or a `*.json` next to it, e.g.
  `player-walk_64x64_3x4.png` (3 cols = frames, 4 rows = down/left/right/up).

---

## PRIORITY 1 — Tileset (the biggest visual jump)

Folder: `tiles/` — each a **64×64 transparent PNG**, seamless/tileable, top-down.

Required:
- `grass.png`, `grass-2.png`, `grass-3.png` (3 subtle variants so the ground isn't repetitive)
- `tall-grass.png` (the encounter tile — visibly distinct, tufts)
- `path-mud.png`, `path-mud-edge.png` (worn dirt path)
- `water.png`, `water-edge.png` (swamp water + a bank/shore edge)
- `lilypad.png` (small, sits on water)
- `flowers.png`, `rock.png`, `stump.png` (scatter decorations, can be partial-transparent over grass)

Nice to have: `bridge-h.png`, `bridge-v.png`, `fence.png`, autotile corner pieces.

---

## PRIORITY 2 — Walk-cycle animation

Folder: `walkers/`. Each character as ONE sheet, **4 rows × 3 columns**, every
cell **64×64**, transparent, character centered, feet near the bottom.
Row order: **row0=facing down, row1=left, row2=right, row3=up.** 3 frames per row:
**col0=left-step, col1=idle/stand, col2=right-step.**

- `player-walk.png` — the trader-ogre trainer (matches `swamp-trader-ogre.png`)
- `fresh-slime-walk.png`
- `runner-slime-walk.png`
- `ogre-boss-walk.png` (can be 96×96 cells — it's bigger; note the size)

If full walk cycles are too heavy, even a **2-frame bob (squash/stretch)** per
creature as `*-bob.png` (2 cols × 1 row) is a big upgrade over static.

---

## PRIORITY 3 — Buildings & props (individual PNGs)

Folder: `props/` — transparent PNG, sized to footprint noted (1 tile = 64px).

- `launch-lab.png` (~6×4 tiles → ~384×256) — egg/altar hut, green roof
- `trading-post.png` (~6×4) — terminal/market hut, gold roof
- `proof-totem.png` (~3×3) — the skull/shield totem
- `volume-lab.png` (~4×3) — NEW building for the volume bot tie-in
- `portal.png` (the glowing green portal — CTA/site entrance)
- `chest.png`, `egg.png`, `signpost.png`, `skull-totem.png` (you have these on the
  environment sheet — cut to individual transparent PNGs at ~96px)

---

## PRIORITY 4 — FX & items

Folder: `fx/` — small transparent PNGs (or short sprite strips):
- `slimeball.png` (~48px, the throwable)
- `catch-burst.png` (3–5 frame strip, capture sparkle)
- `splat.png` (impact ring, 3 frames)
- `sparkle.png` (shiny twinkle, 4 frames)
- `level-ring.png` (level-up burst)

---

## PRIORITY 5 — Audio (huge immersion lift, small files)

Folder: `audio/` — `.ogg` AND `.mp3` (~96–128kbps), keep each small:
- `swamp-ambient.ogg/.mp3` — 30–60s seamless loop (bog ambience, soft pads, frogs)
- sfx: `catch.ogg`, `throw.ogg`, `miss.ogg`, `levelup.ogg`, `ui.ogg`, `boss.ogg`
  (short, <1s each; boss can be a 1–2s roar/stinger)

---

## PRIORITY 6 — Title / branding

- `title-bg.png` (1024×576-ish swamp vista for a start screen)
- `swamp-logo.png` (transparent "THE SWAMP" wordmark, SlimeWire green)

---

## Style rules (keep it consistent)
- One light source (top-left), soft drop shadows under everything.
- Consistent scale: a normal slime ≈ the player's torso height; ogre boss noticeably larger.
- Swamp palette: greens/teals primary, toxic-purple for rugs, amber for caution, gold accents.
- Outlines: subtle dark, not pure black; readable at small sizes (will render ~40–64px on screen).
