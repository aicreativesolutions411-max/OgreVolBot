You are the ASSET agent for the SlimeWire "Swamp" browser game (Claude owns the game code; you own art). Read docs/swamp-build-plan.md and docs/swamp-asset-spec.md first. Match the style of the existing creature sprites in web/public/assets/slimewire/swamp/sprites/ (glowing toxic-swamp, console-grade pixel art, top-left light, transparent PNG).

Generate these as TRANSPARENT PNGs (NOT on a black or magenta background unless you key it out yourself):
1) Seamless top-down 64x64 ground TILES into web/public/assets/slimewire/swamp/tiles/ : grass.png, grass-2.png, tall-grass.png, water.png, path.png. They must TILE seamlessly edge-to-edge and be full-bleed (no border, no background).
2) Building sprites into web/public/assets/slimewire/swamp/props/ : launch-lab.png (~384x256), trading-post.png (~384x256), proof-totem.png (~192x192), volume-lab.png (~256x192). Transparent background, footprint sized as noted.

Also mirror any new files into web/dist/assets/slimewire/swamp/ (the served dir). Update swamp-assets-manifest.json if useful. DO NOT edit web/public/swamp.html or any .js. When done, commit with message "Codex: clean seamless swamp tiles + building sprites" and push. Keep going until the files exist; verify each PNG is transparent.
