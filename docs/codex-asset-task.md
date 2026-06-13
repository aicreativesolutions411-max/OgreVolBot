# CODEX TASK — HD Cinematic Art Pass (style pivot: NO MORE PIXEL ART)

You are the ASSET agent for the SlimeWire "Swamp" browser game (Claude owns the
game code; you own art). The game has been reskinned to a **cinematic
dark-fantasy** look (Warcraft-movie vibe): stormy purple night sky, lightning,
fog, bonfire/torch light, painterly realistic rendering. Claude shipped the
engine pass + painted ground textures + title backdrop. What's left is
**repainting the creature/player sprites** to match.

Reference for the target style: `web/public/assets/slimewire/swamp/art/title-bg.jpg`
(painterly realistic, moody night palette, warm fire light vs cool purple storm light).
The old pixel-art sprite style is RETIRED — do not match it.

## Task 1 (highest value): repaint the 12 sprites, SAME filenames
Output to `web/public/assets/slimewire/swamp/sprites/<id>.png` — overwriting the
existing pixel-style files. The engine already loads these names, so dropping the
files in upgrades every screen (feed cards, overworld roamers, catch arena,
battles, survival horde) with zero code changes.

Spec per sprite:
- 512×512, TRANSPARENT background (or pure #FF00FF chroma — Claude auto-keys).
- Painterly realistic dark-fantasy creature render, soft volumetric shading,
  cool moonlit rim light from top-left + subtle warm bounce from below-right.
- Readable silhouette at 48px. Centered, base of creature at ~85% height.
- Palette: swamp greens/teals for healthy slimes, toxic purple for rug/ghost,
  amber for shaky, mossy ogre-green + gold accents for ogres.

The 12 ids and what they are:
| id | creature |
|---|---|
| fresh-slime | small eager slime blob, big hopeful eyes |
| runner-slime | lean fast slime mid-dash, motion-stretched |
| shiny-slime | radiant golden slime, sparkling |
| toxic-rug-slime | ghostly purple cursed slime, X eyes, wispy trails |
| sell-pressure-slime | sweating panicked slime, drooping |
| liquidity-slime | deep translucent watery slime, coins suspended inside |
| small-ogre | squat young ogre, tusks, mossy skin |
| ogre-boss | hulking ogre boss, glowing eyes, gold trinkets — must read POWERFUL |
| candle-slime | slime shaped like a green candlestick, flame on top |
| chart-wing-slime | slime with translucent wings shaped like a rising chart line |
| pump-rocket-slime | slime riding/fused with a small rocket, exhaust glow |
| swamp-trader-ogre | THE PLAYER: ogre trader with hood/satchel, friendly but tough |

## Task 2: building props (optional, after Task 1)
`web/public/assets/slimewire/swamp/props/`: `launch-lab.png`, `trading-post.png`,
`proof-totem.png` — painterly stilt-huts/totem matching title-bg.jpg, transparent,
~768px wide, warm glowing windows. Claude will wire them over the procedural huts.

## Task 3: audio (unchanged)
`web/public/assets/slimewire/swamp/audio/`: `swamp-ambient` 30–60s seamless loop +
short sfx `catch/throw/miss/levelup/ui/boss` (.ogg+.mp3). Storm/night mood:
distant thunder, crickets, low drone, water drips.

## Rules
- Commit + push after each task so Claude can wire immediately.
- DO NOT edit `web/public/swamp.html` or any .js (Claude owns those).
- After adding files run `npm run build:web` so `web/dist` picks them up, and
  verify each PNG actually has transparency before committing.
