# Rage Cage Visual Style

Use this style for every future visual fix, map pass, UI pass, creature sprite pass, and screenshot pass.

## Core Target

The game should look like an authentic Game Boy Advance-era creature RPG from roughly 2001-2005, with the Ogreverse / Brainrot comedy theme. Use the era's constraints and charm without copying any existing monster RPG's maps, logos, UI composition, names, or creature silhouettes.

The target is not modern pixel art. It is low-resolution handheld RPG art:

- 240x160 resolution emulation as the base composition.
- Chunky low-res pixels.
- Pixel-perfect edges.
- Sharp pixels only.
- No anti-aliasing.
- No smooth gradients.
- No soft glow UI.
- No rounded modern cards.
- Limited palette feel, roughly 16 colors per sprite.
- Bold pixel font text.
- Dark UI panels with green and yellow accents.
- Bordered GBA-style text boxes and menu boxes.

## Main Title Layout

The title screen must keep this composition:

1. Dark starry space background at the top.
2. Large yellow pixel text: `OGREVERSE`.
3. Smaller text below: `BRAINROT PRISM`.
4. Small yellow and cyan pixel structure icon on the right side of the title area.
5. Vertical dark panels on the right side.
6. Green menu buttons labeled `New Run` and `Resume`.
7. Below the buttons, a `Choose First Bond` section.
8. Starter preview shows two small pixel creatures:
   - Grunk Pebblemitt
   - Zorblax Signalbean
9. `Memelet Town` info box visible.
10. `World Map` panel visible.

## Implementation Rules

- Design at 240x160 first, then scale up with nearest-neighbor rendering.
- Keep `image-rendering: pixelated` / `crisp-edges` for canvas and sprites.
- Use hard rectangles, 1-4 px borders, and inset lines.
- Use flat colors and dithered/striped texture instead of gradients.
- Keep text short enough to fit GBA-style boxes.
- Prefer readable block text over tiny decorative labels.
- Any generated screenshot should show the same Rage Cage style, not a modern mockup.

## Originality Rules

- Do not copy existing monster RPG regions, city names, logos, exact UI layouts, or exact map compositions.
- Player-facing systems use Ogreverse language: `Trial Den`, `Sigil`, `OgreLog`, `Vault`, `Crew`, `Satchel`, `Apex Quartet`, `Crown Citadel`, and `Crown Warden`.
- Creature silhouettes, trainer outfits, buildings, and battle backdrops should be humorous Ogreverse originals, not close redraws of existing franchise designs.
- It is fine to preserve the broad genre loop: explore, bond, catch, battle, evolve, clear eight regional trials, stop a villain team, and clear a final gauntlet.

## Palette Direction

Base colors:

- Background: near-black navy, charcoal, dark blue-gray.
- Accent: emerald green, cyan, warm yellow.
- UI: dark panels, black outlines, muted blue-gray fills.
- Warnings/chaos: magenta, slime green, orange, used sparingly.

## Region Map Direction

Full-region maps should match the same quality target as the upgraded creature references:

- Original Ogreverse layout only; do not copy existing region maps, city names, logos, or exact game-map compositions.
- Use a 16x16 tile-grid visual logic with crisp GBA-era overworld tiles.
- Include dense tile detail: grass patches, berry trees, flowers, cliffs, rivers, beaches, caves, ocean currents, ruins, bridges, roads, harbors, Trial Dens, and town buildings.
- Show the four major Ogreverse biomes clearly: Ogre Highlands, Alien Nebula, Goblin Warrens, and Brainrot Dimension.
- Keep labels in small bold pixel-font style with dark bordered label boxes.
- Use vibrant but limited handheld-era colors; avoid modern vector map styling, smooth gradients, realism, or satellite-map composition.
- Current map anchor: `assets/references/ogreverse-region-map-hires-labeled.png`.

## Current Anchor

The title preview in `screenshots/01-title-preview.png` is the current anchor image for the direction. Future work should move maps, buildings, battles, menus, and sprites closer to that style.
