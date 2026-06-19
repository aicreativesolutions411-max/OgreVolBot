# Launch Readiness

This build is ready for a public single-player prototype pass and a local MMO prototype demo. It is not yet production MMO-ready.

## Current Ready State

- 380 generated creatures across Ogre, Alien, Goblin, and Brainrot clans, including 40 newer two-stage evolution lines.
- First 50 canon Goblins and first 50 Brainrot entries route to polished front/back/icon PNGs.
- The 80 newest direct expansion forms (`OGR/ALN/GBL/BRT076-095`) now have premium source-derived front/back/icon assets with evolved silhouettes, props, palette changes, and stage-specific details instead of scaled clones.
- Any remaining procedural roster entries route through premium sprite families by clan, rarity, and evolution stage so they avoid the old blob fallback look.
- Title screen now uses Ogreverse: Brainrot Prism branding with a public prototype/originality notice.
- 108 moves with PP, accuracy, type, category, battle effects, and animation hooks.
- Evolution learnsets are validated so every generated evolution gains at least two moves the previous form did not learn.
- Full single-player route flow is wired: first bond, routes, towns, shops, Vault, wild encounters, trainer fights, eight Trial Dens, villain arc, Apex Quartet, Champion, and post-game rift.
- Save/load uses browser localStorage.
- Local MMO prototype server exists in `server.mjs` with shared presence, nearby player rendering, challenge requests, accept/decline, expiry, cooldown, room locks, same-browser resume, and PvP handoff.
- Authoritative PvP prototype exists in `shared/battle-engine.mjs`; server rooms own full-party HP, PP, ranked item kit, switching, status effects, faint replacement, surrender, turn clock, timeout wins, turn order, damage, logs, and winner state.
- Public prototype server hardening now includes a static file allowlist, security headers, JSON body limits, basic API rate limiting, `/healthz`, `/api/mmo/status`, and graceful shutdown.
- Launch wrapper files exist: `package.json`, `.env.example`, `render.yaml`, `Dockerfile`, `.dockerignore`, `.gitignore`, and `docs/PUBLIC_LAUNCH_CHECKLIST.md`.

## Validation

Run these before each showcase build:

```powershell
node --check game.js
node --check server.mjs
node --check shared\battle-engine.mjs
node tools\smoke-game-data.mjs
node tools\smoke-mmo-api.mjs
```

Or run the combined package scripts:

```powershell
npm run prelaunch
```

Current smoke expectations:

- At least 380 species.
- At least 95 creatures per clan.
- Eight Trial Dens.
- Apex Quartet plus Champion.
- Post-game chapter.
- Canon Goblin and Brainrot asset sets present.
- Direct expansion evolution assets present for 80 newest Ogre/Alien/Goblin/Brainrot forms.
- Evolution move deltas present on every generated evolution step.
- MMO smoke verifies self-challenge blocking, private peer party payloads, active-room blocking, resume into an existing room, switch/status/item flow, surrender, and timeout wins.

## Public Prototype Caveats

- The game is still a browser prototype, not packaged for stores.
- MMO is local prototype only; production accounts, database persistence, anti-cheat, moderation, and hosted deployment are still future work.
- Authoritative PvP now supports party snapshots, switching, a server-owned ranked item kit, server status effects, surrender, turn deadlines, timeout wins, challenge expiry/cooldown, room locks, and same-browser resume. Deeper campaign-math parity, full campaign bag parity, disconnect policy, and production battle logging still need follow-up.
- Saves are local to the browser.
- Some non-direct generated roster entries intentionally share premium family sprites until dedicated per-species art is produced.
- Current host configs are prototype-ready, but deployment still requires a real hosting account, repository connection, and owner approval for public URL/domain choices.

## Next Highest-Impact Passes

- Replace remaining premium-family sprite reuse with dedicated final art for late-game rares and legendaries.
- Add more authored trainer teams using the new 380-species roster.
- Add battle intro flourishes for Gym Leaders, villains, Apex Quartet, and Champion.
- Add a first-run options screen for text speed, battle animation speed, and pixel scale.
- Prepare hosted/offline release packaging, plus account-backed MMO infrastructure planning, after the next visual QA sweep.
