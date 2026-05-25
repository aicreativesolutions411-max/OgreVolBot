# Solana Telegram Wallet Ops Bot

Telegram bot for legitimate, auditable Solana wallet operations:

- Create/import managed wallets
- Export/restore encrypted wallet backups
- Emergency private key export for user-owned wallets
- Fund managed wallets from an imported wallet
- Single-wallet trade menu for quick buy/sell, auto sell, and DCA
- OgreSniper early-play scanner, token scorer, mode presets, AutoSnipe/PumpSnipe, and Manual Launch Snipe
- Batch buy a token through Jupiter
- Batch sell a token through Jupiter
- DCA buy and DCA sell plans with scheduled slices
- Timed trade plans: buy now, sell later by timer, take-profit, or stop-loss
- Positions Overview with current live token holdings only, estimated value when Jupiter can quote, and Dexscreener links
- PnL / Results as a bot-recorded trade log, newest first and oldest last
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
   AUTO_SEND_RECOVERY_KEY_FILE=true
   JUPITER_API_KEY=...
   PUMPFUN_API_BASE=https://frontend-api-v3.pump.fun
   PUMPFUN_API_TOKEN=
   PHOTON_NEW_PAIRS_URL=
   PHOTON_API_KEY=
   MANUAL_LAUNCH_SCAN_INTERVAL_MS=500
   TRADING_SPEED_PRESET=balanced
   JUPITER_MIN_INTERVAL_MS=350
   JUPITER_RETRIES=5
   JUPITER_429_COOLDOWN_MS=7000
   FEE_WALLET=AUcSFZsCdawzfqa4KzHK1BHz1RDrBnj8CF5kxoy3NvxV
   BUNDLE_FEE_BPS=50
   BUNDLE_CONCURRENCY=2
   BALANCE_CONCURRENCY=5
   BALANCE_CACHE_TTL_MS=8000
   DEFAULT_SLIPPAGE_BPS=400
   SNIPER_DEFAULT_SLIPPAGE_BPS=400
   JUPITER_SWAP_MAX_ATTEMPTS=3
   BUY_RESERVE_SOL=0.01
   RPC_MIN_INTERVAL_MS=250
   RPC_DELAY_MS=250
   RPC_RETRIES=10
   RPC_429_COOLDOWN_MS=5000
   KEEPALIVE_ENABLED=true
   KEEPALIVE_INTERVAL_MINUTES=5
   TELEGRAM_ADMIN_USER_IDS=123456789
   ```

4. Start the bot:

   ```bash
   npm start
   ```

## Web App

The repo includes a lightweight static web app for Cloudflare Pages. It is a web-first OgreTradeBot dashboard for the Render bot backend with web account creation, optional Telegram-code linking, wallet creation, backup downloads, one-wallet buy/sell controls, balances, positions, PnL, OgreSniper scans, and KOL Tracker signals.

Cloudflare Pages settings:

```text
Build command: npm run build:web
Build output directory: web/dist
Root directory: leave blank
Node version: 20
```

Set this Cloudflare Pages environment variable:

```text
OGRE_API_BASE=https://your-render-service.onrender.com
TELEGRAM_BOT_USERNAME=OgreTradeBot
WEB_PORTAL_URL=https://www.slimewire.org
```

For your current Render service, `OGRE_API_BASE` should be your Render bot URL, for example `https://ogrevolbot.onrender.com`. The web app uses that backend for account creation, wallets, balances, scans, and trades. If the website is served directly from the Render `/portal` route, it can use the same origin automatically. If `OGRE_API_BASE` is blank on a separate website, the app falls back to `https://ogrevolbot.onrender.com`; change `OGRE_API_BASE` if your Render service has a different name.

Set these Render environment variables too:

```text
TELEGRAM_BOT_USERNAME=OgreTradeBot
WEB_PORTAL_URL=https://www.slimewire.org
WEB_ALLOWED_ORIGIN=https://www.slimewire.org,https://slimewire.org,https://your-cloudflare-pages-site.pages.dev,https://*.your-cloudflare-pages-site.pages.dev
WEB_SESSION_TTL_HOURS=72
RESEND_API_KEY=
EMAIL_FROM=
```

Cloudflare Pages creates preview deployment URLs such as `https://8cfb8188.your-cloudflare-pages-site.pages.dev`. Those preview URLs are different browser origins from the stable production URL, so they must be allowed by CORS if you open them. Use `https://www.slimewire.org` as the stable production URL for users, keep the wildcard preview origin above for testing, and use `WEB_ALLOWED_ORIGIN=*` only while you are still changing domains.

Users can create a web account directly from the site. Existing Telegram users can also connect by opening `@OgreTradeBot`, sending `/web`, or tapping the bot's **Web App** menu button. The bot sends a one-time 64-bit random code that expires after 10 minutes, stores only a hash of the code, and rate-limits failed web login attempts.

The web dashboard can create wallet sets directly. After web wallet creation, it downloads both the encrypted bot backup and the Solflare/Phantom recovery key file. The recovery key file contains raw private keys, so users must store it privately.

The web Trade tab is for simple one-wallet trading from the browser. It uses the same backend wallet encryption, Jupiter swap path, token safety precheck, slippage settings, and fee logic as the Telegram Trade button. Scanner rows can hand a CA straight into the Trade tab so users can stay on the webpage.

The web Volume tab creates the same timed position plan used by the Telegram Volume button: buy now, then sell by timer, take-profit, stop-loss, or repeat cycle. It is a position-management feature for the user's own wallet, not a fake-volume tool.

The web Bundle tab exposes multi-wallet bundle buy/sell from the page. Users select the exact managed wallets, paste a token CA, set buy amount per wallet or sell percent, choose slippage, and run the bundle. It also includes **Bundle Buy + Auto Exits**, which buys across the selected wallets and immediately arms timer, take-profit, stop-loss, repeat count, repeat wait, and custom target settings.

The web Launch Snipe tab exposes Manual Launch Snipe from the page. Users preset ticker, wallets, buy amount, take-profit, stop-loss, fallback timer, and slippage; the backend keeps scanning the configured launch/profile feeds until a matching ticker appears, then buys with the preset wallets.

The web KOL Tracker tab uses MadeOnSol as the cheap primary KOL feed when `MADE_ON_SOL_API_KEY` is set on Render. Solana Tracker can stay disabled, or it can be used as an optional fallback/context source when `SOLANA_TRACKER_API_KEY` and `KOL_USE_SOLANA_TRACKER_FALLBACK=true` are set. It shows Hot Buys, Top KOLs, Consistent KOLs, Fresh Activity, and custom-wallet scans. Pasting a public wallet works even without a KOL API key by reading its current token holdings from RPC. KOLscan is mixed in as direct account, trades, and leaderboard links so users can inspect the same wallet context externally without the backend scraping their frontend. Each signal includes chart/copy buttons plus Trade, Bundle, and Buy Position actions. Buy Position uses the same timed engine as Volume with preset-or-custom timer, take-profit, stop-loss, repeat, and slippage settings. If `SOLANA_TRACKER_API_KEY` is set, users can also arm **Copy Wallet Next Buy**, which ignores already-seen recent buys and watches the pasted wallet for the next new buy at `KOL_COPY_SCAN_INTERVAL_MS`.

The web dashboard has an optional email field. If `RESEND_API_KEY` and `EMAIL_FROM` are set on Render, users can request a fresh email login code later. Email never carries private keys, backup files, or permanent login tokens.

The Render bot also serves the same built portal at `/portal` after `npm run build:web`, but Cloudflare Pages is recommended for the public website.

## Telegram Commands

- `/start` - open the menu
- `/trade` - open the single-wallet trade menu
- `/sniper` - open OgreSniper
- `/kol` - open KOL Tracker
- `/buy` - start a one-wallet buy
- `/sell` - start a one-wallet sell
- `/positions` - view positions overview
- `/pnl` - view PnL / Results
- `/pnlcard` - paste a token CA to create a PnL card
- `/pnlcard CA` - create a PnL card for a specific token CA
- `/bundle` - open bundle tools
- `/wallets` - list managed wallets
- `/deletewallets` - remove saved wallets from the bot after backup and confirmation
- `/balances` - show SOL and token balances for your wallets
- `/withdraw` - withdraw maximum available SOL from selected wallets
- `/cancel` - cancel the current flow

The bot keeps encrypted key material and an audit log under `DATA_DIR`.

Set `TELEGRAM_ADMIN_USER_IDS` to your numeric Telegram user ID to show bot-wide admin controls like audit export and emergency stop. Public users can still use their own wallet/trading menu in DM.

Batch buy and sell use Jupiter Swap API v2, so you need a Jupiter API key from the Jupiter developer portal.

KOL Tracker can mix MadeOnSol and Solana Tracker while keeping API keys server-side on Render. For lowest Solana Tracker credit usage, set MadeOnSol first and keep fallback off:

```text
MADE_ON_SOL_API_KEY=
MADE_ON_SOL_API_BASE=https://madeonsol.com/api/v1
MADE_ON_SOL_KOL_LIMIT=10
MADE_ON_SOL_CACHE_TTL_MS=900000
KOL_USE_SOLANA_TRACKER_FALLBACK=false
```

Optional Solana Tracker tuning:

```text
SOLANA_TRACKER_API_KEY=
SOLANA_TRACKER_API_BASE=https://data.solanatracker.io
SOLANA_TRACKER_KOL_LIMIT=12
SOLANA_TRACKER_CACHE_TTL_MS=15000
SOLANA_TRACKER_KOL_CACHE_TTL_MS=120000
SOLANA_TRACKER_KOL_SIGNAL_LOOKUPS=2
SOLANA_TRACKER_KOL_POSITION_LIMIT=4
SOLANA_TRACKER_KOL_POSITION_CONCURRENCY=1
SOLANA_TRACKER_KOL_USE_PERIOD_ENDPOINT=false
KOL_COPY_SCAN_INTERVAL_MS=30000
```

Browser users only call your `/api/web/kol/*` routes; they never receive either provider key. MadeOnSol results cache for `MADE_ON_SOL_CACHE_TTL_MS`. Solana Tracker runs in credit-safe mode by default: each uncached fallback refresh uses the KOL leaderboard plus only `SOLANA_TRACKER_KOL_SIGNAL_LOOKUPS` wallet-position lookups. `SOLANA_TRACKER_KOL_USE_PERIOD_ENDPOINT=false` avoids the `/v2/pnl/leaderboard/kols/period` endpoint and uses the main KOL leaderboard with mode-specific sorting instead. `KOL_COPY_SCAN_INTERVAL_MS` controls how often a Copy Wallet watch checks the pasted wallet's new buys; lower is faster but uses more Solana Tracker credits.

Bundle buy and sell charge a 0.5% platform fee by default. `BUNDLE_FEE_BPS=50` means 50 basis points, which is 0.5%, and fees are sent to `FEE_WALLET`.

`TRADING_SPEED_PRESET` can be `safe`, `balanced`, or `fast`. `balanced` is the default and is much smoother on a decent RPC. Use `safe` for free/public RPCs that keep returning 429s, or `fast` only with a private RPC and solid Jupiter limits. The bot also has a global RPC queue controlled by `RPC_MIN_INTERVAL_MS`, `RPC_DELAY_MS`, `RPC_RETRIES`, and `RPC_429_COOLDOWN_MS`, plus a Jupiter queue controlled by `JUPITER_MIN_INTERVAL_MS`, `JUPITER_RETRIES`, and `JUPITER_429_COOLDOWN_MS`. `BALANCE_CONCURRENCY` controls how many wallet balance reads can be prepared at once, and `BALANCE_CACHE_TTL_MS` reuses fresh balance data for quick refreshes. `BUY_RESERVE_SOL=0.01` is the recommended extra SOL per wallet for network fees and token-account creation around buys.

For bundle buys, fund each wallet with at least:

```text
buy amount per wallet + BUY_RESERVE_SOL
```

Example: buying `0.10 SOL` from 10 wallets with `BUY_RESERVE_SOL=0.01` needs about `1.10 SOL` across the 10 wallets, plus a little SOL in the source wallet for funding transaction fees.

Wallet import accepts a base58 private key, a JSON byte array like `[12,34,...]`, or a comma-separated 64-byte secret key. It does not accept seed phrases or public wallet addresses.

`Sweep SOL` drains each selected wallet by estimating the network fee and sending `balance - fee`. This avoids the old rent error where a wallet was left with too little SOL to remain rent-exempt.

In the buy amount step, users can type `max` to use each wallet's available SOL except the safety reserve.

If you still see `429 Too Many Requests`, your current Solana RPC or Jupiter plan is rate-limiting even after the bot queues and slows requests. Switch `TRADING_SPEED_PRESET=safe`, keep `BUNDLE_CONCURRENCY=1`, or use a paid/private `SOLANA_RPC_URL` plus higher Jupiter limits for reliable multi-wallet usage. Public `https://api.mainnet-beta.solana.com` is not reliable for production batches.

`Emergency Key Export` / **Solflare Key Export** sends raw private keys for the Telegram user's own bot wallets after an exact confirmation phrase. This is for recovery only. Anyone with that file can drain those wallets.

`AUTO_SEND_RECOVERY_KEY_FILE=true` makes the bot also send a Solflare/Phantom recovery key file after wallet create/import/restore, and before wallet removal. This is now the recommended recovery-first setup so new wallet sets immediately get both the encrypted bot backup and a Solflare-style key export. The recovery key file contains raw private keys, so users must keep it private.

`Rescue Backup Keys` lets a user upload the wallet backup `.txt` file and receive a private-key recovery file even if the wallets are not currently restored in the bot. If the backup opens but keys cannot decrypt, the new deployment is using a different `APP_SECRET`; set Render back to the exact old `APP_SECRET`, redeploy, then restore or rescue again.

If Telegram file upload is failing, users can paste recovery text instead. Restore and Rescue scan pasted text for lines like `Base58 secret key: ...` or `JSON secret key: [12,34,...]` and rebuild only the valid Solana wallet keys they find.

Quote failures usually mean Jupiter cannot build a route for the token/amount, liquidity is too low, slippage is too low, the wallet does not have enough SOL after fees, or Jupiter/RPC is rate-limiting the request.

The Bundle submenu includes **DCA Buy** and **DCA Sell**. DCA Buy splits a total SOL amount per wallet into smaller buys over time. DCA Sell captures the current token balance at confirmation, then sells the selected percent in smaller slices. Both plans are stored in `dca-plans.json`, check once per minute while awake, and resume from saved data after a restart if `DATA_DIR` is still available.

The main menu shows this as **Volume**. Under the hood it is a timed trade plan: it buys a token now from selected user wallets, then sells later when one of the user's configured exits triggers:

- 5-second quick exit for short auto-sell timing
- Repeat cycles for running the timed buy/sell flow 1, 5, 10, or a custom count up to 10
- Repeat wait, such as no wait, 5 seconds, 30 seconds, 1 minute, 5 minutes, or a custom timer before the next cycle starts
- Timer exit, such as sell 15 minutes after buy
- Take-profit, such as sell if estimated value is up 25%
- Stop-loss, such as sell if estimated value is down 10%

Wallet selection supports wallet numbers, `all`, or a wallet group like `group: ogretest`. The bot checks Volume plans every few seconds while the service is awake. If Render was asleep, it catches up when the service wakes and the local data still exists.

This is a position-management feature for the user's own wallets. It does not run repeated buy/sell loops to manufacture volume.

The main menu also includes **OgreSniper**. It provides:

- Scan Early Plays from latest Solana token profiles, with direct Snipe buttons
- AutoSnipe and PumpSnipe rotate away from recently shown/bought tokens when enough candidates are available, then let users keep the default exits or customize TP/SL before confirming
- Manual Launch Snipe lets a user enter a ticker ahead of launch, preselect wallets/SOL/exits/slippage, and watch live Solana launch/profile feeds for a matching ticker
- Modes: Safe Picks, Smart Accumulation, Fast Movers, PumpSnipe, Low MC, Narratives, and Long Term. Tapping a mode immediately scans that category and refreshes the six quick-pick buttons for that style.

OgreSniper scoring is heuristic. It uses Dexscreener/Pump.fun metadata and available market signals to estimate entry score, momentum, rug risk, exit risk, and manipulation score. It does not guarantee profitable trades, and it does not bypass the normal confirm screen.

OgreSniper options:

- **Scan Early Plays** checks latest Solana token profiles and shows the highest-scoring candidates with tap-to-copy CA text, Dex chart links in the text, and **Snipe #1** through **Snipe #6** buttons.
- **AutoSnipe** defaults to +25% take-profit, -8% stop-loss, 400 bps slippage, and a full-bag exit. After the SOL amount, users can tap **Use Default** or **Customize**.
- **PumpSnipe** defaults to +40% take-profit, -8% stop-loss, 300 bps slippage, and a full-bag exit. It accepts lower market-cap early setups than AutoSnipe and also supports **Customize** before confirm.
- **Manual Launch Snipe** watches for a ticker the user enters ahead of time, then buys with the preselected wallets once a matching live launch/profile appears. By default it uses the bot's current Solana launch/profile feeds. If you set `PHOTON_NEW_PAIRS_URL`, the watcher checks that feed first and can pass `PHOTON_API_KEY` as a bearer token. It scans every `MANUAL_LAUNCH_SCAN_INTERVAL_MS` while awake, defaults to `1500` ms, supports `500` ms on paid/private RPC setups, uses short burst caching so multiple watches do not duplicate the same feed calls, and sends **Cancel Watch** controls after the plan is armed and under **Active Launch Watches**.
- **Modes** adjust score/risk strictness and immediately run that category scan: Safe Picks, Smart Accumulation, Fast Movers, PumpSnipe, Low MC, Narratives, and Long Term. Refreshes are mode-specific, and the scanner avoids recently shown picks across modes when enough candidates are available.

Fast scan flow:

1. Tap **Scan Early Plays**.
2. Open the Dex chart link in the text or copy the CA from the result.
3. Tap **Snipe #1** through **Snipe #6**.
4. Pick **All Wallets**, a quick wallet button, or **Custom / Group**.
5. Pick 0.05, 0.10, 0.50, 1 SOL, or **Buy X SOL**.
6. Review the recommended exit preset, customize TP/SL if needed, set slippage, then tap **Confirm**.
7. If a fast launch moves between quote and execution, the bot can retry with a fresh Jupiter order before it reports failure. Tune this with `JUPITER_SWAP_MAX_ATTEMPTS`.

Mode scan flow:

1. Tap **Modes**.
2. Pick the category: Safe Picks, Smart Accumulation, Fast Movers, PumpSnipe, Low MC, Narratives, or Long Term.
3. The bot saves that mode and shows ranked picks for that category.
4. Tap a **Snipe** button, choose wallets and amount, set profit/loss settings, then confirm.

OgreSniper exit presets:

- **Fast Scalp** sells 100% after 3 minutes, or earlier at +25% take-profit / -10% stop-loss.
- **Balanced** sells 80% after 15 minutes, or earlier at +50% take-profit / -15% stop-loss.
- **Moonbag** sells 60% after 30 minutes, or earlier at +100% take-profit / -25% stop-loss.
- **Safe** sells 100% after 10 minutes, or earlier at +20% take-profit / -8% stop-loss.

After the amount is chosen, the bot picks a recommended preset from the active mode and score. Users can tap **Use Preset**, **Customize TP/SL**, or **Back**. Custom TP/SL changes the take-profit and stop-loss percentages while keeping the preset timer and sell percent. The web panel exposes custom fields directly for timer, TP, SL, repeat count, repeat wait, and slippage on Volume, Bundle auto exits, Sniper, and Launch Snipe.

Slippage quick buttons use a safer 3% / 4% / 5% shape: 300 bps, default 400 bps, and 500 bps. Anything higher is left behind **Custom** because it can land at a worse fill if price moves against the user. OgreSniper uses `SNIPER_DEFAULT_SLIPPAGE_BPS`; normal Trade and Bundle use `DEFAULT_SLIPPAGE_BPS`.

Manual CA trades belong in **Trade** for one wallet or **Bundle** for multiple wallets. OgreSniper stays focused on bot-researched picks and fast managed exits.

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

The How To Use button opens a clickable learning hub with user-friendly instructions for Trade, Wallet, Bundle, Volume, Check Balances, Backup / Restore, Withdrawal, and a Success Checklist. The Backup / Restore page explains exactly how to verify/upload the automatic `.txt` backup file from Telegram or paste backup text if upload fails.

The Trade menu is for one wallet at a time. It includes Buy, Sell, Auto Sell, DCA Buy, DCA Sell, Positions, and Wallets. Buy screens include quick buttons for `0.10 SOL`, `0.50 SOL`, `1 SOL`, `max`, and custom amount. Sell screens include quick buttons for `25%`, `50%`, `100%`, and custom percent.

The Wallet and Backup / Restore menus include Remove Wallets. Remove Wallets deletes selected saved wallet records from the bot only after two confirmations, sends an encrypted backup before the final confirmation, and does not move funds on-chain. If removed by mistake, users can restore the backup later as long as Render still uses the same APP_SECRET. Positions Overview only shows coins the managed wallets still hold. PnL / Results shows bot-recorded buys and sells newest first, with older trades below, plus share-card buttons. PnL card buttons show the latest traded tokens first, and users can tap **Card by CA** or use `/pnlcard CA` for any older token that falls off the visible list. Successful sells try to send a PnL card automatically. Cards use Dexscreener metadata/art first; if Dexscreener has no token image/name/symbol, the bot tries Pump.fun metadata next. Cards rotate through the branded neon slime frame assets while keeping the same PnL text layout. The Bundle menu contains Bundle Buy, Bundle Sell, DCA Buy, DCA Sell, and Copy Trade info. Use the main Volume button for auto-sell, take-profit, stop-loss, and Repeat cycles. Copy Trade is shown as a setup/info item until a full wallet-watcher implementation is added.

Auto Bundle custom take-profit accepts larger targets. Type `500` for a +500% profit target, shown as about 6x value. Type `5x` if the intended target is 5x value, which equals +400% profit. The same parser is used by full exits, wallet targets, ladders, sniper custom exits, manual launch exits, and timed trade take-profit.

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

But local files can reset whenever Render redeploys, restarts, or spins down the free instance. The bot automatically sends each user an encrypted backup file after wallet creation, wallet import, and wallet restore. Users can also tap **Export Backup** in Telegram or **Download Current Backup** on the web panel any time, then use **Restore Backup** if the free service resets.

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

The bot sends automatic encrypted `.txt` backup files after wallet create/import/restore, so users do not have to remember every time. It sends a Telegram document, not pasted backup code in chat. Backup / Restore includes **Verify Backup File**, which lists the wallet public keys inside a backup before restoring or rescuing keys. If `AUTO_SEND_RECOVERY_KEY_FILE=true`, the bot also sends a separate Solflare/Phantom recovery key file with raw keys for the affected wallets. Automatic wallet-group backup filenames include the wallet group label, exact timestamp, wallet hint, and fingerprint, for example:

```text
wallet-backup-ogretest-123456789-20260524014233-HTHf-Wdnb-a1b2c3d4.txt
```

### Paid Persistent Option

For production, use a paid Render service with a persistent disk. The included `render.yaml` is set up for a Starter web service with a 1 GB disk mounted at `/var/data`:

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
