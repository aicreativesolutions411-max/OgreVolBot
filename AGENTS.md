# AGENTS.md — OgreVolBot / SlimeWire (read this first)

You are an engineering agent on this project. This file tells you **what we're building**,
**how to get access to the live system**, and **the rules you must not break**. It is committed
to git, so it contains **no secret values** — only the *names* of env vars and the *shapes* of
commands. The real keys live in a gitignored `.env` (see "Access" below).

---

## 1. What this project is

**SlimeWire / OgreVolBot** is a Solana memecoin trading platform: a web app + Telegram bot +
an automated trading engine ("Autopilot"). One operator (the owner) runs it; users get access
via access keys.

- **Stack:** Node.js. The server is a large monolith at `src/index.js` (~40k lines). The trading
  engine is `src/lib/autopilotEngine.js`. Web UI is plain HTML/JS in `web/public/`, built to
  `web/dist/` by `npm run build:web` (minifies `app.js`). Tests are node's built-in runner under
  `tests/` (run with `npm test` — currently ~378 tests, all green).
- **Hosting:** Cloudflare (`slimewire.org`) proxies to the Render origin
  (`ogrevolbot.onrender.com`). Render auto-deploys on every push to `main`.
- **Data, free only (NO paid RPC / NO Helius credit burn):**
  - `swap-api.pump.fun` — per-trade feed (`/v2/coins/{mint}/trades`) **and** candles
    (`/v1/coins/{mint}/candles?interval=&limit=`). Free, server-side, does NOT rate-limit us.
    This is the backbone for pump (pre/in-bonding) coins.
  - `api.dexscreener.com/latest/dex/tokens/{mint}` — stats (price/MC/liq/vol). CORS-ok in the
    browser, ~300/min/IP. This is the SAME source as the app's top bar, so numbers match.
  - GeckoTerminal — has OHLCV but **429-rate-limits hard**; only ever fetch it *client-side*
    (per-user IP), NEVER depend on it server-side (Render's shared IP 429s instantly).
  - Solana Tracker (`data.solanatracker.io/chart/{token}?type=5m`, header `x-api-key`) — keyed
    OHLCV for pump + graduated coins. We already have `SOLANA_TRACKER_API_KEY` on Render.

### Main areas of the product
- **Autopilot** — the auto-trading engine (`autopilotEngine.js` + the `createAutopilotEngine`
  deps in `src/index.js`). Modes: chill / normal / degen / grind / **steady** / blend / **scalp**.
  The Pro panel exposes 3 user-facing styles: **Steady** (`steady`), **Balanced** (`blend`),
  **Quick** (`scalp`).
- **Native chart** — `web/public/chart-lab.html` on TradingView `lightweight-charts` v4.2.3
  (vendored). Slime-green/blood-red candles. Route is `/chart-lab` (NOT `/chart`, which the SPA
  claims). Stats from DexScreener, candles from GeckoTerminal/swap-api.
- **Smart-money copy-trade**, **scan cards**, **raid bot**, **Telegram group bot (OgreVolBot)**,
  **Pump Launch**.

---

## 2. What we're working on right now (current focus)

1. **Autopilot — "winning steady."** Goal: consistent green sessions so it can ship to users.
   Recent direction (don't revert):
   - **Honest equity:** open bags are valued at a *realizable* haircut (60% of upside, capped 4x,
     full downside, capped at COST when liquidity < $1500), via the shared `realizableMove()`
     helper. The headline `pnlPct` is realized-anchored (open bags at cost). Phantom thin-curve
     marks must NEVER read as profit. Don't restore the raw 10x mark.
   - **Steady locks a win:** banks ~88% at the first pop so a pop books a real win, not a scratch.
   - **Entry clamped to the proven +EV pocket** (fresh path: MC ~2.1k–2.5k, skip the 30–120s age
     dead-zone). Judge changes by **session PnL**, not the cumulative scorecard (polluted by old
     broken-price trades).
2. **The chart loading reliably.** Known issue: it leads with GeckoTerminal (client-side) which
   429s → "not loading." Planned fix: make our server `/api/chart` (`buildChartData` in
   `src/index.js`) the primary source — Solana Tracker (keyed) + swap-api fallback, cached
   server-side — and demote browser GeckoTerminal polling. Rendering (lightweight-charts) is fine.

---

## 3. Access — how to check the live deploy & bot (same as the lead agent)

You need **two secrets**, provided as environment variables (put them in the gitignored `.env`,
or export them in the shell you launch from — NEVER commit them, NEVER print their values):

| Env var | Used for |
|---|---|
| `RENDER_API_KEY` | Render deploy status **and** live logs (`api.render.com`) |
| `AUTOPILOT_OWNER_KEY` | Owner-gated bot reads — passed as `?key=…` on `/api/web/autopilot/*` |

Fixed (non-secret) identifiers:
- Render **service ID**: `srv-d86q8gq8qa3s73fq1r60`
- Render **owner ID**: `tea-d84e17rtqb8s73fabu1g`
- Origin (owner-key reads work here; Cloudflare shadows the path): `https://ogrevolbot.onrender.com`

### The three checks (verified working)
```bash
# A) Is the latest commit live? (status should be "live")
curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/srv-d86q8gq8qa3s73fq1r60/deploys?limit=1"

# B) Scan recent server logs for errors
curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/logs?ownerId=tea-d84e17rtqb8s73fabu1g&resource=srv-d86q8gq8qa3s73fq1r60&limit=50&direction=backward"

# C) Bot health / autopilot scorecard (owner-gated read)
curl -s "https://ogrevolbot.onrender.com/api/web/autopilot/stats?key=$AUTOPILOT_OWNER_KEY"
```
Other owner-gated reads: `/api/web/autopilot/status`, `/api/web/autopilot/caller-intel`
(same `?key=$AUTOPILOT_OWNER_KEY` pattern). Treat these as **read/scan** only.

---

## 4. Build → test → deploy → verify (the loop)

1. Make the change. If you touched anything under `web/`, run **`npm run build:web`** (regenerates
   `web/dist/`).
2. **`npm test`** — must stay green. A fix isn't done until tests fail before it and pass after.
3. Commit + push to `main`. End commit messages with the project's `Co-Authored-By:` trailer.
4. Render auto-deploys. **Poll check (A) until `status === "live"`**, then run check (B) and look
   for errors. A deploy is not "done" on push — only when it's live and the logs are clean.
5. Do not mark work done based on UI screenshots alone (see trading rules below).

---

## 5. Hard rules — do not break

- **Secrets:** use the keys in requests; **never echo their values** in output, logs, commits, or
  files. `.env` and `uploaded-assets/*.jpg` are gitignored — never `git add` them.
- **No credit burn:** no Helius / no paid RPC for features. Use the free sources in §1 (plus the
  Solana Tracker key we already have). Don't reintroduce server-side GeckoTerminal (it 429s).
- **Honest display:** never surface phantom/unrealized marks as the headline result (see §2).
- **Trading safety** (for any change to trade execution, stop loss, take profit, order closing,
  position monitoring, or PnL):
  1. Never rely on frontend/browser code to trigger financial exits.
  2. Never rely on in-memory state in a request-only API route for active trade monitoring.
  3. All TP/SL logic must be server-side, testable, and idempotent.
  4. Every execution path must log `tradeId, userId, symbol, side, entryPrice, currentPrice,
     stopLoss, takeProfit, status, reason`.
  5. Every TP/SL change must include tests for: long stop loss, long take profit, short stop loss,
     short take profit, duplicate-trigger prevention.
  6. A fix is not complete until tests fail before the fix and pass after the fix.
  7. Do not mark a task done based only on visual UI behavior.
  8. The browser must be closable and TP/SL must still keep working server-side.
