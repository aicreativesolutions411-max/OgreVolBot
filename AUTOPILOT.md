# Live Autopilot (Fresh-Ape) — terminal control

The same adaptive Fresh-Ape brain that runs on the `/autopilot` page, but running
**inside the server** so it keeps trading in the background even after you close
your phone/laptop. It executes real buys/sells through the battle-tested trade
path, manages many positions at once, and trades **only the wallet you pick**,
with a loss cap, a hard timer, and a kill switch.

It is **off the website on purpose** — controlled only from your terminal, and
authenticated with your own SlimeWire session (no server secrets to set up).

## Turn it on (no env vars needed)

```bash
export AUTOPILOT_API="https://ogrevolbot.onrender.com"   # optional; this is the default

# 1) In Telegram, send /web to get a login code, then:
node scripts/autopilot.js login --code A1B2C3

# 2) See the wallets loaded in your terminal (with balances + index):
node scripts/autopilot.js wallets

# 3) PAPER first — no SOL touched, proves the live feed + brain:
node scripts/autopilot.js start --sol 0.5 --minutes 60 --mode degen

# 4) Go LIVE on a chosen wallet (real SOL):
node scripts/autopilot.js start --sol 0.5 --minutes 60 --mode degen --wallet 2 --live

node scripts/autopilot.js status     # equity, open positions, W/L, recent log
node scripts/autopilot.js stop       # kill switch — stops hunting + flattens
```

- `--wallet <index>` picks from your loaded wallets (the index from the `wallets`
  command). Required for `--live`.
- `--mode` is `chill | normal | degen` (sizing aggressiveness).
- `--live` makes it trade real SOL and auto-sends the `confirm:"LIVE"` opt-in.
- Fund the wallet you pick with **only the SOL you're willing to risk**. The
  engine **refuses the fee wallet** and any wallet without a signable secret.

### Headless option (a server/box with no login)
Set `AUTOPILOT_CONTROL_KEY` (any long secret) and `AUTOPILOT_WALLET_PUBKEY` on
the server, export `AUTOPILOT_CONTROL_KEY` in the box's shell, and the same CLI
works without `login` (the env wallet is used). Optional `AUTOPILOT_SLIPPAGE_BPS`
(default `700`).

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
- **Safety rails**: trades only the wallet you select (never the fee wallet);
  **loss cap** flattens + stops if equity falls to 70% of the starting budget;
  **hard timer** flattens at the end; honors the global emergency-stop; survives
  a redeploy (resumes the open session and re-locks the same wallet).

This is real-money, high-variance memecoin sniping. It is built to be smart and
disciplined, **not** to guarantee profit. Start small, run paper first, watch the
first live session. You can `stop` at any moment.
