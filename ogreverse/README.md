# Ogreverse: Brainrot Prism

A self-contained retro 2D creature-collecting RPG prototype inspired by GBA-era handheld monster RPGs, with original names, maps, systems, and art direction.

## Visual Direction

All future art, UI, map, building, creature, and screenshot work should follow the Rage Cage style guide in `RAGE_CAGE_STYLE.md`.

In short: authentic GBA-era 240x160 pixel art, sharp chunky pixels, no anti-aliasing, no smooth gradients, dark bordered UI, green/yellow accents, and the `OGREVERSE BRAINROT PRISM` title layout as the visual anchor.

## Originality Guardrails

Ogreverse should feel like its own game, not a clone. Keep the top-down creature RPG structure, but avoid copied maps, copied creature silhouettes, copied names, copied logos, exact battle UI layouts, exact city/route names, or direct terminology from existing monster RPGs. Use Ogreverse terms such as Trial Dens, Sigils, OgreLog, Vault, Apex Quartet, Crown Citadel, and Crown Warden.

## Run

Open `index.html` in a browser. No install or build step is required.

For the local MMO prototype, run the no-dependency Node server:

```powershell
npm start
```

Then open:

```text
http://127.0.0.1:5178/index.html?mmo=1
```

If `5178` is already taken on the local machine, run on another port:

```powershell
$env:OGREVERSE_PORT = "5212"; npm start
```

Then open:

```text
http://127.0.0.1:5212/index.html?mmo=1
```

The raw Node command also works:

```powershell
node server.mjs
```

Health/status endpoints:

```text
http://127.0.0.1:5178/healthz
http://127.0.0.1:5178/api/mmo/status
```

## Controls

- Arrow keys or WASD: move
- Enter, Space, or Z: talk / inspect / confirm
- X, Escape, or M: menu / close menu
- Mouse or touch: use the panel buttons
- Phone/tablet: fixed on-screen joystick plus A/B/Menu buttons appear automatically while roaming

## Included Systems

- Top-down overworld with Ogre Highlands, Alien Nebula, Goblin Warrens, Brainrot Dimension, Memelet Town, Crown Citadel, Trial Dens, shops, Vault stations, switches, and a post-game rift.
- Named towns now match the region map with distinct local tile languages: Grunkridge stone, Lavaridge forge heat, Verdanturf/Fortree canopy paths, Rustburrow cave mud, Slimeport docks, Mauvellite neon panels, Brainrot checker rifts, and Crown Citadel marble/gold.
- Premium overworld pass adds multi-tile service buildings, deterministic town props, terrain blending, softer tile seams, animated water detail, and pixel-safe lighting for a richer remaster-style playable map.
- Premium transparent building and town-prop atlas lives in `assets/world-premium/`; the live overworld uses those PNGs first and falls back to canvas-drawn objects when needed.
- Premium terrain tiles live in `assets/tiles-premium/` with four variants per tile key, giving towns, routes, water, caves, alien floors, brainrot floors, and citadel marble a richer pixel-art base layer.
- Premium battle backdrops live in `assets/battle-premium/` and replace the old flat canvas arenas for town, ogre, alien, goblin, brainrot, and citadel fights.
- 380 generated creatures split across Ogres, Aliens, Goblins, and Brainrot species, including 40 newer two-stage evolution lines. The first 50 supplied canon Goblins are wired to production front/back/icon PNGs, and the supplied Brainrot roster names/evolutions/types are integrated into `BRT001` through `BRT037`.
- Expanded evolution pass: every generated evolution step is checked so the next form gains at least two evolution-only moves. The newest 80 direct expansion forms have premium source-derived front/back/icon assets, while remaining generated entries route through clan/stage visual families.
- 108 moves across 18 custom elements with PP, accuracy, categories, status effects, stat changes, drain, recoil, confusion, and chaos effects.
- Type-specific battle animation passes with chunky pixel beams, slashes, flames, waves, sparks, rocks, chaos glitches, damage popups, HUD status tags, and hit shake.
- Full type chart, leveling, stats, evolutions, first-bond selection, wild encounters, catching with Capture Orbs, crew, Vault storage, satchel items, OgreLog, quests, save/load, Trial Dens, villain battles, Apex Quartet, Crown Warden finale, and post-game legendaries.
- In-game World Map menu using `assets/references/ogreverse-region-map-hires-labeled.png` for the current Ogreverse route-flow anchor.
- Local MMO vertical slice in `server.mjs`: shared overworld presence, nearby player nameplates, Prism Duel Plaza social hub, online field panel, challenge requests, accept/decline flow, expiry/cooldown, room locks, same-browser resume, and PvP battle handoff.
- Server-authoritative PvP prototype in `shared/battle-engine.mjs`: accepted MMO duels create server rooms that own full-party HP, PP, ranked item kit, switching, status effects, faint replacement, surrender, turn clock, timeout wins, turn order, accuracy, damage, logs, and winner state.
- Local Duel Record loop: wins/losses, current streak, best streak, daily duel goals, and small streak rewards are saved in the browser now and are ready to move server-side when accounts/persistence are added.

## Sprite Pipeline

High-quality PNG sprites live in `assets/sprites/` and icons live in `assets/icons/`.

The game loads `assets/sprites/{SPECIES_ID}_front.png` and `{SPECIES_ID}_back.png` when present. If a creature has no PNG yet, it falls back to the procedural canvas sprite.

Rebuild sprite assets from the reference sheets:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\build-sprites.ps1
```

Re-crop the 50 supplied canon Goblin front/back/icon assets:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\crop-goblin-batch.ps1
```

Rebuild premium direct expansion evolution variants:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\build-premium-expansion-evolution-variants.ps1
```

Rebuild premium trainer, NPC, portrait, and player assets:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\build-premium-trainer-assets.ps1
```

Render the current trainer/NPC role preview sheet:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\render-character-role-sheet.ps1
```

Rebuild world/building assets:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\build-world-assets.ps1
```

Rebuild premium transparent town/building atlas:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\build-premium-world-assets.ps1
```

Rebuild premium terrain tile variants:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\build-premium-terrain-tiles.ps1
```

Rebuild premium battle backgrounds:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\build-premium-battle-backgrounds.ps1
```

Rebuild the original grid region map from the actual game world grid:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\build-region-map-from-world.ps1
```

Recompose the high-detail labeled region map from the generated base:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\compose-hires-region-map.ps1
```

Regenerate preview screenshots:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\make-screenshots.ps1
```

Run the data/progression smoke check:

```powershell
npm run smoke
```

Run the MMO server syntax check:

```powershell
npm run check
```

Run the local MMO API smoke check:

```powershell
node tools\smoke-mmo-api.mjs
```

Run the host/deployment audit:

```powershell
npm run launch-audit
```

Run the full prelaunch verification:

```powershell
npm run prelaunch
```

## Public Prototype Deployment

This repo includes `render.yaml`, `Dockerfile`, `.dockerignore`, and `.env.example`.

Render-style deployment:

1. Push the project to a GitHub repository.
2. Create a Render Blueprint from `render.yaml`.
3. Keep `OGREVERSE_HOST=0.0.0.0`; Render provides `PORT`.
4. Use `/healthz` as the health check path.
5. Open the hosted URL with `?mmo=1` for the local MMO/PvP path.

The Render build command runs `npm run prelaunch`, which includes syntax checks, game data smoke tests, MMO/PvP API smoke tests, and the launch audit.

Docker-style deployment:

```powershell
docker build -t ogreverse-brainrot-prism .
docker run --rm -p 5178:5178 ogreverse-brainrot-prism
```

The server intentionally exposes only `index.html`, `game.js`, `styles.css`, and `assets/` as static public files.

## Readiness Notes

- `docs/LAUNCH_READINESS.md` tracks what is ready for public prototype testing, what is still single-player/local-only, and the exact validation commands.
- `docs/MMO_ROADMAP.md` lays out the multiplayer path: shared overworld presence first, instanced turn-based PvP second, then accounts, persistence, trades, seasons, and live ops.
- `docs/PUBLIC_LAUNCH_CHECKLIST.md` lists the remaining owner tasks before putting the prototype in front of players.
