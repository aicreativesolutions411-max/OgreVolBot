# Solana Telegram Wallet Ops Bot

Telegram bot for legitimate, auditable Solana wallet operations:

- Create/import managed wallets
- Export/restore encrypted wallet backups
- Fund managed wallets from an imported wallet
- Batch buy a token through Jupiter
- Batch sell a token through Jupiter
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
   FEE_WALLET=AUcSFZsCdawzfqa4KzHK1BHz1RDrBnj8CF5kxoy3NvxV
   BUNDLE_FEE_BPS=50
   TELEGRAM_ADMIN_USER_IDS=123456789
   ```

4. Start the bot:

   ```bash
   npm start
   ```

## Telegram Commands

- `/start` - open the menu
- `/wallets` - list managed wallets
- `/cancel` - cancel the current flow

The bot keeps encrypted key material and an audit log under `DATA_DIR`.

Set `TELEGRAM_ADMIN_USER_IDS` to your numeric Telegram user ID to show bot-wide admin controls like audit export and emergency stop. Public users can still use their own wallet/trading menu in DM.

Batch buy and sell use Jupiter Swap API v2, so you need a Jupiter API key from the Jupiter developer portal.

Bundle buy and sell charge a 0.5% platform fee by default. `BUNDLE_FEE_BPS=50` means 50 basis points, which is 0.5%, and fees are sent to `FEE_WALLET`.

The Volume Alerts button is for legitimate monitoring. This bot does not run repeated buy/sell loops to manufacture volume.

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

But local files can reset whenever Render redeploys, restarts, or spins down the free instance. Users should tap **Export Backup** after creating/importing wallets, then use **Restore Backup** if the free service resets.

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
KEEPALIVE_INTERVAL_MINUTES=10
```

It pings:

```text
https://your-service-name.onrender.com/healthz
```

This can reduce idle spin-down, but Render Free can still restart services and local files can still reset. Keep using **Export Backup** after wallet changes.

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
- `APP_SECRET` must stay stable, because it is the key used to decrypt stored wallets and backups.

Health check URL:

```text
https://your-render-service.onrender.com/healthz
```
