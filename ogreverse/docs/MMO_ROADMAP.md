# MMO Roadmap

Ogreverse now has a local MMO vertical slice. It is not production MMO-ready yet, but the first real multiplayer loop exists: run a local server, open two browser sessions with `?mmo=1`, see nearby players, challenge them, accept/decline, resume after a same-browser refresh, and drop into a prototype PvP battle.

## Current Prototype Status

Done in the current build:

- `server.mjs` serves the game and exposes local MMO endpoints with no npm install.
- Player sessions join with guest identity, position, facing, region, sprite class, lead creature, full party snapshot kept server-side, lead level, and badge count.
- Presence sync returns nearby players with public lead info and party count, not full party payloads.
- Server-sent events are wired for presence, challenge, decline, challenge expiry, and battle-room events in normal browsers.
- The client shows an Online Field panel when opened with `?mmo=1`.
- Prism Duel Plaza is now a dedicated social/PvP crossroads on the playable map, connected to Slimeport, the citadel path, Alien Nebula, and Brainrot docks.
- Nearby players render on the overworld with nameplates, lead level, and a duel marker.
- Player presence now exposes public duel wins/streaks, while full party data stays private on the server.
- Facing a nearby online player and pressing interact sends a duel request.
- The panel supports challenge buttons plus incoming accept/decline.
- Accepted duels create a room and hand off to a prototype PvP battle.
- The browser save now tracks a local Duel Record with wins/losses, daily duel goals, streaks, best streak, and small win/streak rewards.
- Challenge expiry, challenge cooldown, self-challenge blocking, active-room blocking, and same-browser session resume are implemented locally.
- Shared battle module exists in `shared/battle-engine.mjs`.
- Server duel rooms now own party HP, PP, ranked item kit, switching, status effects, faint replacement, surrender, turn clock, timeout wins, turn order, move accuracy, damage, battle logs, winner state, and turn progression.
- `tools/smoke-mmo-api.mjs` validates join, presence, self-challenge blocking, private peer payloads, challenge, room creation, active-room blocking, resume, party switch submission, status application, item use/stock decrement, surrender, timeout wins, move submission, and server-side turn resolution.

Run:

```powershell
node server.mjs
```

Open:

```text
http://127.0.0.1:5178/index.html?mmo=1
```

If that port is already occupied, choose an alternate local port:

```powershell
$env:OGREVERSE_PORT = "5212"; node server.mjs
```

Then open:

```text
http://127.0.0.1:5212/index.html?mmo=1
```

## What This Is

This is a local online vertical slice. It proves the MMO shape and lets us test UI, presence, challenge flow, and PvP handoff without committing to accounts, a database, cloud hosting, or anti-cheat yet.

## What This Is Not Yet

- Not a production-hardened battle service.
- Not persistent cloud accounts.
- Not a secure trade/economy system.
- Not matchmaking.
- Not deployed infrastructure.
- Not anti-cheat hardened.
- Not moderation-ready.

## Phase 1: Shared Overworld Presence

Status: prototype implemented locally.

Remaining production work:

- Replace in-memory sessions with Redis or another realtime presence store.
- Add proper account/session auth.
- Add region shards and interest zones.
- Replace same-browser in-memory resume with account-backed reconnect handoff.
- Add production rate limits for movement, presence updates, and challenge spam.

## Phase 2: Server-Authoritative PvP

Status: full-party authoritative PvP foundation implemented locally.

Done:

- `shared/battle-engine.mjs` provides deterministic server duel rooms.
- Server creates rooms on accepted challenges.
- Clients can request room state and submit moves or switch choices.
- Player sessions send six-slot party snapshots into accepted duel rooms.
- Server resolves switches and ranked-kit items before attacks, applies PP/accuracy/damage/status effects, auto-promotes the next living creature after a faint, resolves surrender immediately, advances turn deadlines, awards timeout wins, and tracks winner state.
- Browser PvP UI renders server room state, move PP, move effect labels, status tags, active party slot, fainted slots, server item stock, surrender, server clock countdown, and server-event pips/effects.
- Smoke test verifies switching, status application, item use/stock decrement, surrender, timeout wins, plus server turn advancement.

Required next:

- Port the full campaign battle math from `game.js` into the shared engine so single-player and PvP use the same calculations.
- Add full campaign bag parity, evolution reward, production disconnect policy, account-backed reconnect, and forced replacement prompt handling.
- Client becomes only a renderer/input surface for PvP, never the authority.
- Store battle logs for anti-cheat review.

## Phase 3: Persistence

Status: future production milestone.

Required:

- Database tables for accounts, saves, party creatures, Vault storage, inventory, quests, badges, PvP rating, cosmetics, and battle logs.
- Migration from localStorage saves.
- Cloud save conflict policy.
- Backup/export tools.

## Phase 4: MMO Features That Fit Ogreverse

After authoritative PvP and persistence:

- Rival sightings on routes.
- PvP duel flags and quick emotes.
- Trial Den leaderboards.
- Seasonal Brainrot Overload events.
- Cosmetic trainer outfits by clan.
- Limited trades with server validation.
- Spectator mode for Champion/Apex PvP rooms.
- Guild-style "Meme Crews" with shared seasonal goals.

## Difficulty Update

- Local shared-overworld prototype: done.
- Basic online PvP MVP with full-party authoritative battle server: implemented locally; production parity is still hard, roughly 2-5 weeks from here.
- Production MMO with accounts, persistence, anti-cheat, moderation, trading, seasons, and reliable hosting: very hard, roughly 3-6+ months depending scale.

## Next Best Build Target

The next milestone should be PvP parity and persistence:

- Add full campaign bag parity, forced replacement prompts, account-backed reconnects, disconnect wins, and production-grade timeout/forfeit policy.
- Move the remaining single-player battle math into `shared/battle-engine.mjs`.
- Make the browser battle screen consume server turn events for PvP.
- Keep existing single-player battles using the same shared engine locally.

That gives us the foundation needed for ranked duels, tournaments, persistence, and later trading.
