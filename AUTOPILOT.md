# Live Autopilot (Fresh-Ape) — terminal control

The same adaptive Fresh-Ape brain that runs on the `/autopilot` page, but running
**inside the server** so it keeps trading in the background even after you close
your phone. It executes real buys/sells through the battle-tested trade path,
manages many positions at once, and is bounded to **one dedicated wallet** with a
loss cap, a hard timer, and a kill switch.

It is **off the website on purpose** — controlled only from your terminal with a
secret key.

## One-time setup (on Render → OgreVolBot → Environment)

1. Create a **fresh wallet** in the bot and fund it with only the SOL you're
   willing to risk. This is the ONLY wallet the autopilot can touch.
2. Set these env vars (then redeploy):

   | Var | Value |
   |-----|-------|
   | `AUTOPILOT_CONTROL_KEY` | a long random secret (your password to control it) |
   | `AUTOPILOT_WALLET_PUBKEY` | the public key of the dedicated wallet above |
   | `AUTOPILOT_SLIPPAGE_BPS` | optional, default `700` (7%) for fast fresh fills |

   The engine **refuses to run on the fee wallet** and refuses live mode unless
   `AUTOPILOT_WALLET_PUBKEY` resolves to a managed, signable wallet.

## Control from your terminal

```bash
export AUTOPILOT_API="https://ogrevolbot.onrender.com"
export AUTOPILOT_CONTROL_KEY="<the key you set on Render>"

# Dry run first — PAPER mode, no SOL touched, proves the feed/brain live:
node scripts/autopilot.js start --sol 0.5 --minutes 60 --mode degen

# Go LIVE (real SOL from the dedicated wallet):
node scripts/autopilot.js start --sol 0.5 --minutes 60 --mode degen --live

node scripts/autopilot.js status     # equity, open positions, W/L, recent log
node scripts/autopilot.js stop       # kill switch — stops hunting + flattens
```

`--mode` is `chill | normal | degen` (sizing aggressiveness). `--live` makes it
trade real SOL and auto-sends the `confirm:"LIVE"` opt-in.

You can also `curl` the endpoints directly:

```
GET  /api/web/autopilot/status?key=...
POST /api/web/autopilot/start  {key, sol, minutes, mode, live, confirm:"LIVE"}
POST /api/web/autopilot/stop   {key}
```

## What it does, ruthlessly honest

- **Hunts** the real fresh-launch feed every ~6.6s; **manages exits every ~2.2s**.
- **Entry gates** (anti-rug): age 4–1200s, MC $1.8k–$20k, liquidity ≥ $2.5k,
  ≥2 buyers, 5m volume ≥ $25, not dumping, fresh-score over the regime cutoff.
- **Adaptive sizing**: scales up on win streaks / hot regimes, shrinks on cold
  streaks but never stops buying; each trade is clamped to ≤22% of cash.
- **Multi-position**: holds as many as cash + a ≤90% deployment cap + a soft cap
  of 8 allow — moon bags can sit while it keeps playing others. Re-enters a coin
  it sold after a 45s wave cooldown.
- **Exits**: TP1 banks 40% at +25–28%, the moon bag rides to TP2 (+45–75%);
  hard stop at −8%; instant exit if liquidity is pulled; stale exit at 3 min.
- **Safety rails**: dedicated wallet only; **loss cap** flattens + stops if equity
  falls to 70% of the starting budget; **hard timer** flattens at the end; honors
  the global emergency-stop; survives a redeploy (resumes the open session).

This is real-money, high-variance memecoin sniping. It is built to be smart and
disciplined, **not** to guarantee profit. Start small, run paper first, watch the
first live session. You can `stop` at any moment.
