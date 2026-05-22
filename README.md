# Solana Telegram Wallet Ops Bot

Telegram bot for legitimate, auditable Solana wallet operations:

- Create/import managed wallets
- Export/restore encrypted wallet backups
- Emergency private key export for user-owned wallets
- Fund managed wallets from an imported wallet
- Single-wallet trade menu for quick buy/sell, auto sell, and DCA
- OgreSniper early-play scanner, token scorer, mode presets, and timed-plan entry setup
- Batch buy a token through Jupiter
- Batch sell a token through Jupiter
- DCA buy and DCA sell plans with scheduled slices
- Timed trade plans: buy now, sell later by timer, take-profit, or stop-loss
- Positions Overview with live token balances, estimated value when Jupiter can quote, PnL, and Dexscreener links
- PnL / Results from bot-recorded buys and sells
- PnL share cards as Telegram PNG images using Dexscreener token metadata/art first, with a best-effort Pump.fun metadata fallback for missing art/name/symbol
- Tap-to-copy managed wallet addresses
- Sweep SOL to a destination wallet
- Sweep SPL tokens to a destination wallet
- Close empty token accounts
- Export an audit log

This bot does not provide wallet washing, provenance hiding, mixer behavior, or claims that activity cannot be traced.

## Setup

1. Install Node.js 20 or newer.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in:

   ```bash
   TELEGRAM_BOT_TOKEN=...
   SOLANA_RPC_URL=...
   APP_SECRET=...
   JUPITER_API_KEY=...
   PUMPFUN_API_BASE=https://frontend-api-v3.pump.fun
   PUMPFUN_API_TOKEN=
   TRADING_SPEED_PRESET=balanced
   JUPITER_MIN_INTERVAL_MS=500
   JUPITER_RETRIES=5
   JUPITER_429_COOLDOWN_MS=10000
   FEE_WALLET=AUcSFZsCdawzfqa4KzHK1BHz1RDrBnj8CF5kxoy3NvxV
   BUNDLE_FEE_BPS=50
   BUNDLE_CONCURRENCY=2
   BUY_RESERVE_SOL=0.01
   RPC_MIN_INTERVAL_MS=450
   RPC_DELAY_MS=750
   RPC_RETRIES=10
   RPC_429_COOLDOWN_MS=10000
   KEEPALIVE_ENABLED=true
   KEEPALIVE_INTERVAL_MINUTES=5
   TELEGRAM_ADMIN_USER_IDS=123456789
   ```

4. Start the bot:

   ```bash
   npm start
   ```

## Telegram Commands

- `/start` - open the menu
- `/trade` - open the single-wallet trade menu
- `/sniper` - open OgreSniper
- `/buy` - start a one-wallet buy
- `/sell` - start a one-wallet sell
- `/positions` - view positions overview
- `/bundle` - open bundle tools
- `/wallets` - list managed wallets
- `/balances` - show SOL and token balances for your wallets
- `/withdraw` - withdraw maximum available SOL from selected wallets
- `/cancel` - cancel the current flow

The bot keeps encrypted key material and an audit log under `DATA_DIR`.

Set `TELEGRAM_ADMIN_USER_IDS` to your numeric Telegram user ID to show bot-wide admin controls like audit export and emergency stop. Public users can still use their own wallet/trading menu in DM.

Batch buy and sell use Jupiter Swap API v2, so you need a Jupiter API key from the Jupiter developer portal.

Bundle buy and sell charge a 0.5% platform fee by default. `BUNDLE_FEE_BPS=50` means 50 basis points, which is 0.5%, and fees are sent to `FEE_WALLET`.

`TRADING_SPEED_PRESET` can be `safe`, `balanced`, or `fast`. `balanced` is the default and is much smoother on a decent RPC. Use `safe` for free/public RPCs that keep returning 429s, or `fast` only with a private RPC and solid Jupiter limits. The bot also has a global RPC queue controlled by `RPC_MIN_INTERVAL_MS`, `RPC_DELAY_MS`, `RPC_RETRIES`, and `RPC_429_COOLDOWN_MS`, plus a Jupiter queue controlled by `JUPITER_MIN_INTERVAL_MS`, `JUPITER_RETRIES`, and `JUPITER_429_COOLDOWN_MS`. `BUY_RESERVE_SOL=0.01` is the recommended extra SOL per wallet for network fees and token-account creation around buys.

For bundle buys, fund each wallet with at least:

```text
buy amount per wallet + BUY_RESERVE_SOL
```

Example: buying `0.10 SOL` from 10 wallets with `BUY_RESERVE_SOL=0.01` needs about `1.10 SOL` across the 10 wallets, plus a little SOL in the source wallet for funding transaction fees.

Wallet import accepts a base58 private key, a JSON byte array like `[12,34,...]`, or a comma-separated 64-byte secret key. It does not accept seed phrases or public wallet addresses.

`Sweep SOL` drains each selected wallet by estimating the network fee and sending `balance - fee`. This avoids the old rent error where a wallet was left with too little SOL to remain rent-exempt.

In the buy amount step, users can type `max` to use each wallet's available SOL except the safety reserve.

If you still see `429 Too Many Requests`, your current Solana RPC or Jupiter plan is rate-limiting even after the bot queues and slows requests. Switch `TRADING_SPEED_PRESET=safe`, keep `BUNDLE_CONCURRENCY=1`, or use a paid/private `SOLANA_RPC_URL` plus higher Jupiter limits for reliable multi-wallet usage. Public `https://api.mainnet-beta.solana.com` is not reliable for production batches.

`Emergency Key Export` sends raw private keys for the Telegram user's own bot wallets after an exact confirmation phrase. This is for recovery only. Anyone with that file can drain those wallets.

`Rescue Backup Keys` lets a user upload the wallet backup `.txt` file and receive a private-key recovery file even if the wallets are not currently restored in the bot. If the backup opens but keys cannot decrypt, the new deployment is using a different `APP_SECRET`; set Render back to the exact old `APP_SECRET`, redeploy, then restore or rescue again.

If Telegram file upload is failing, users can paste recovery text instead. Restore and Rescue scan pasted text for lines like `Base58 secret key: ...` or `JSON secret key: [12,34,...]` and rebuild only the valid Solana wallet keys they find.

Quote failures usually mean Jupiter cannot build a route for the token/amount, liquidity is too low, slippage is too low, the wallet does not have enough SOL after fees, or Jupiter/RPC is rate-limiting the request.

The Bundle submenu includes **DCA Buy** and **DCA Sell**. DCA Buy splits a total SOL amount per wallet into smaller buys over time. DCA Sell captures the current token balance at confirmation, then sells the selected percent in smaller slices. Both plans are stored in `dca-plans.json`, check once per minute while awake, and resume from saved data after a restart if `DATA_DIR` is still available.

The main menu shows this as **Volume**. Under the hood it is a timed trade plan: it buys a token now from selected user wallets, then sells later when one of the user's configured exits triggers:

- 5-second quick exit for short auto-sell timing
- Repeat cycles for running the timed buy/sell flow 1, 5, 10, or a custom count up to 10
- Timer exit, such as sell 15 minutes after buy
- Take-profit, such as sell if estimated value is up 25%
- Stop-loss, such as sell if estimated value is down 10%

Wallet selection supports wallet numbers, `all`, or a wallet group like `group: ogretest`. The bot checks Volume plans every few seconds while the service is awake. If Render was asleep, it catches up when the service wakes and the local data still exists.

This is a position-management feature for the user's own wallets. It does not run repeated buy/sell loops to manufacture volume.

The main menu also includes **OgreSniper**. It provides:

- Scan Early Plays from latest Solana token profiles, with direct Snipe buttons
- Score Token for a pasted mint
- Snipe Setup, which scores a mint and then creates a timed-plan entry after user confirmation
- Modes: Safe Scan, Smart Money Scan, Fast Scalp Scan, Low Cap Scan, Meme Scan, and AI Scan. Tapping a mode immediately scans that category.

OgreSniper scoring is heuristic. It uses Dexscreener/Pump.fun metadata and available market signals to estimate entry score, momentum, rug risk, exit risk, and manipulation score. It does not guarantee profitable trades, and it does not bypass the normal confirm screen.

OgreSniper options:

- **Scan Early Plays** checks latest Solana token profiles and shows the highest-scoring candidates with tap-to-copy CA text, Dex chart buttons, and **Snipe #1** through **Snipe #5** buttons.
- **Score Token** scores one pasted mint before entry and includes **Snipe This** so the user does not need to paste the mint again.
- **Snipe Setup** scores a mint, asks for wallet selection and SOL amount, then auto-selects a recommended exit preset before confirmation.
- **Modes** adjust score/risk strictness and immediately run that category scan: Safe Scan, Smart Money Scan, Fast Scalp Scan, Low Cap Scan, Meme Scan, and AI Scan.

Fast scan flow:

1. Tap **Scan Early Plays**.
2. Open a Dex chart or copy the CA from the result.
3. Tap **Snipe #1** through **Snipe #5**.
4. Pick **All Wallets**, a quick wallet button, or **Custom / Group**.
5. Pick 0.05, 0.10, 0.50, 1 SOL, or **Buy X SOL**.
6. Review the recommended exit preset, customize TP/SL if needed, set slippage, then tap **Confirm**.

Mode scan flow:

1. Tap **Modes**.
2. Pick the category: Safe, Smart Money, Fast Scalp, Low Cap, Meme, or AI.
3. The bot saves that mode and shows ranked picks for that category.
4. Tap a **Snipe** button, choose wallets and amount, set profit/loss settings, then confirm.

OgreSniper exit presets:

- **Fast Scalp** sells 100% after 3 minutes, or earlier at +25% take-profit / -10% stop-loss.
- **Balanced** sells 80% after 15 minutes, or earlier at +50% take-profit / -15% stop-loss.
- **Moonbag** sells 60% after 30 minutes, or earlier at +100% take-profit / -25% stop-loss.
- **Safe** sells 100% after 10 minutes, or earlier at +20% take-profit / -8% stop-loss.

After the amount is chosen, the bot picks a recommended preset from the active mode and score. Users can tap **Use Preset**, **Customize TP/SL**, or **Back**. Custom TP/SL changes the take-profit and stop-loss percentages while keeping the preset timer and sell percent.

Normal trade confirmations use inline **Confirm** and **Cancel / Back** buttons. Emergency raw private key export still requires typing `EXPORT KEYS` exactly because it exposes recovery keys.

The front menu is intentionally short:

- 🐎 How To Use
- 💱 Trade
- 🎯 OgreSniper
- 💳 Wallet
- 🧲 Bundle
- 📊📈 Volume
- 🔍 Check Balances
- 💾 Backup / Restore
- 🏦 Withdrawal

The How To Use button opens a clickable learning hub with user-friendly instructions for Trade, Wallet, Bundle, Volume, Check Balances, Backup / Restore, Withdrawal, and a Success Checklist. The Backup / Restore page explains exactly how to upload the automatic `.txt` backup file from Telegram or paste backup text if upload fails.

The Trade menu is for one wallet at a time. It includes Buy, Sell, Auto Sell, DCA Buy, DCA Sell, Positions, and Wallets. Buy screens include quick buttons for `0.10 SOL`, `0.50 SOL`, `1 SOL`, `max`, and custom amount. Sell screens include quick buttons for `25%`, `50%`, `100%`, and custom percent.

The Wallet menu includes wallet creation/import, My Wallets with tap-to-copy address text, Positions Overview, and PnL / Results. PnL / Results includes share-card buttons, and successful sells try to send a PnL card automatically. Cards use Dexscreener metadata/art first; if Dexscreener has no token image/name/symbol, the bot tries Pump.fun metadata next. The Bundle menu contains Bundle Buy, Bundle Sell, DCA Buy, DCA Sell, and Copy Trade info. Use the main Volume button for auto-sell, take-profit, stop-loss, and Repeat cycles. Copy Trade is shown as a setup/info item until a full wallet-watcher implementation is added.

Menu navigation edits the existing Telegram menu message when possible, with Main Menu back buttons on submenus. Wallet lists, backups, trade results, and generated PnL cards still post as new messages so users do not lose important data.

Menu and buy-flow messages include:

```text
Powered by Ogres
Telegram: https://t.me/ogrecoinonsol
Website: https://ogremode.com/
Twitter: https://twitter.com/i/communities/1930265213917425858
```

## Deploy On Render

This repo includes `render.yaml` for a free Render Web Service. The web service runs Telegram webhook mode and exposes `/healthz` so Render can health-check it.

1. Push this folder to a GitHub repo.
2. In Render, choose **New > Blueprint** and select the repo.
3. Render will read `render.yaml` and create `solana-telegram-wallet-ops-bot`.
4. Set these secret environment variables in Render:

   ```bash
   TELEGRAM_BOT_TOKEN=...
   TELEGRAM_WEBHOOK_URL=https://your-service-name.onrender.com
   KEEPALIVE_URL=https://your-service-name.onrender.com
   SOLANA_RPC_URL=https://your-private-mainnet-rpc
   APP_SECRET=...
   JUPITER_API_KEY=...
   TELEGRAM_ADMIN_USER_IDS=123456789
   ```

5. Deploy the service.

### Free Render Storage Reality

Render Free web services cannot attach persistent disks. The bot can run for free with:

```bash
DATA_DIR=./data
ALLOW_EPHEMERAL_STORAGE=true
```

But local files can reset whenever Render redeploys, restarts, or spins down the free instance. The bot automatically sends each user an encrypted backup file after wallet creation, wallet import, and wallet restore. Users can also tap **Export Backup** any time, then use **Restore Backup** if the free service resets.

Keep `APP_SECRET` the same forever. Backups are encrypted with the bot's `APP_SECRET`; if that value changes, old backups and stored wallets cannot be restored.

### Webhook URL

Free Render services spin down when idle. Telegram long polling will not reliably wake them, so this bot uses Telegram webhooks on Render.

After Render gives you the public URL, set:

```bash
TELEGRAM_WEBHOOK_URL=https://your-service-name.onrender.com
```

`TELEGRAM_WEBHOOK_SECRET` should be a random secret. The Blueprint can generate it automatically.

### Free Keep-Alive Ping

The bot includes an optional keep-alive pinger for Render Free:

```bash
KEEPALIVE_ENABLED=true
KEEPALIVE_URL=https://your-service-name.onrender.com
KEEPALIVE_INTERVAL_MINUTES=5
```

It pings:

```text
https://your-service-name.onrender.com/healthz
```

The health server also responds on `/healthz`, `/readyz`, and `/wake`. The `/healthz` response includes uptime, data directory, webhook mode, and the latest keep-alive ping status.

Important Render Free detail: an in-app keep-alive only runs while the service is already awake. For the free setup, also use an external uptime monitor such as UptimeRobot, Better Stack, cron-job.org, or any service that sends an HTTP GET to:

```text
https://your-service-name.onrender.com/healthz
```

Set the external monitor to every 5 minutes. Render Free can still restart services and local files can still reset. Keep using backups.

The bot sends automatic encrypted `.txt` backup files after wallet create/import/restore, so users do not have to remember every time. It sends a Telegram document, not pasted backup code in chat. Automatic wallet-group backup filenames include the wallet group label, for example:

```text
wallet-backup-ogretest-123456789-2026-05-21.txt
```

### Paid Persistent Option

For production, use a paid Render service with a persistent disk:

```bash
DATA_DIR=/var/data
ALLOW_EPHEMERAL_STORAGE=false
```

Then attach a persistent disk with mount path `/var/data`. This avoids needing manual backup/restore after restarts.

## Key Safety

- `.env` and `data/` are ignored by Git.
- `render.yaml` does not contain private keys or bot secrets; sensitive values use `sync: false`.
- Wallet private keys are encrypted before being written to `DATA_DIR`.
- Wallet records are scoped by Telegram user ID, so users only see and operate their own managed wallets in the bot UI.
- On Render Free, the bot automatically DMs encrypted backups after wallet creation/import/restore because local storage is ephemeral.
- Users can also use Emergency Key Export to import bot-created wallets into Phantom/Solflare and move funds outside the bot.
- `APP_SECRET` must stay stable, because it is the key used to decrypt stored wallets and backups.

Health check URL:

```text
https://your-render-service.onrender.com/healthz
```
