# Public Launch Checklist

This is the handoff list for getting Ogreverse: Brainrot Prism in front of real players as a public prototype.

## Done In This Build

- Public static server now exposes only the game shell and `assets/`.
- Security headers, request body limits, basic API rate limiting, health/status endpoints, and graceful shutdown are wired in `server.mjs`.
- Local MMO has presence, challenge accept/decline, challenge expiry/cooldown, active-room locks, same-browser resume, and authoritative PvP rooms.
- PvP rooms own party HP, PP, server item kit, switching, status effects, surrender, turn clocks, timeout wins, logs, and winner state.
- Prism Duel Plaza is the intended online hangout/duel hub; publish the playtest link with `?mmo=1` when testing multiplayer.
- Browser-local Duel Record tracks casual wins/losses, daily duel progress, streaks, and small rewards. Server-side ranked persistence still requires accounts and a database.
- `package.json` scripts cover start, syntax checks, smoke tests, screenshots, and prelaunch validation.
- `render.yaml`, `Dockerfile`, `.dockerignore`, `.gitignore`, and `.env.example` are present.
- Current validation command: `npm run prelaunch`.
- Host/deployment audit command: `npm run launch-audit`.

## Required Before Sharing Publicly

- Pick a hosting target and connect the repository.
- Run `npm run prelaunch` after the project lands in the hosting/repo environment.
- Set `OGREVERSE_HOST=0.0.0.0` in hosted environments.
- Confirm the hosted `/healthz` endpoint returns `ok: true`.
- Open the hosted game with `?mmo=1` in two browser sessions and test presence plus a PvP duel.
- Decide whether the public link is a temporary playtest, a closed alpha, or a wider public prototype.
- Add a short player-facing notice that saves are local to the browser and online PvP is prototype-grade.
- Do a legal/IP review of names, art direction, and marketing copy before paid ads, store pages, or press.

## Not Production MMO Yet

- No persistent accounts.
- No cloud database for saves, parties, inventory, or PvP records.
- No moderation tools.
- No ranked matchmaking.
- No anti-cheat beyond server-authoritative duel rooms and basic request limiting.
- No production disconnect/forfeit policy beyond current turn timeout behavior.
- No cross-server presence or region sharding.

## Suggested First Public Scope

Use the first public release as a browser playtest:

- Single-player campaign and visual direction feedback.
- Creature readability and evolution feedback.
- Local/hosted MMO presence sanity check.
- Casual PvP duel feedback, not ranked competition.

The correct label is `Public Prototype`, not `Production MMO`.
