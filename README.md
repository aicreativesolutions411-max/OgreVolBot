# Solana Telegram Wallet Ops Bot

Telegram bot for legitimate, auditable Solana wallet operations:

- Create/import managed wallets
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
   TELEGRAM_ALLOWED_USER_IDS=123456789
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

Set `TELEGRAM_ALLOWED_USER_IDS` to your numeric Telegram user ID before using real funds. If it is blank, anyone who can message the bot can operate it.

Batch buy and sell use Jupiter Swap API v2, so you need a Jupiter API key from the Jupiter developer portal.

Bundle buy and sell charge a 0.5% platform fee by default. `BUNDLE_FEE_BPS=50` means 50 basis points, which is 0.5%, and fees are sent to `FEE_WALLET`.

The Volume Alerts button is for legitimate monitoring. This bot does not run repeated buy/sell loops to manufacture volume.

## Deploy On Render

This repo includes `render.yaml` for a Render Web Service. The web service runs the Telegram polling bot and exposes `/healthz` so Render can health-check it.

1. Push this folder to a GitHub repo.
2. In Render, choose **New > Blueprint** and select the repo.
3. Render will read `render.yaml` and create `solana-telegram-wallet-ops-bot`.
4. Set these secret environment variables in Render:

   ```bash
   TELEGRAM_BOT_TOKEN=...
   APP_SECRET=...
   JUPITER_API_KEY=...
   TELEGRAM_ALLOWED_USER_IDS=123456789
   ```

5. Deploy the service.

`DATA_DIR` is set to `/var/data` in `render.yaml` and backed by a 1 GB Render disk. Wallets, audit logs, emergency-stop state, and the app-secret fingerprint are stored there, so normal Render restarts/redeploys will not reset wallets.

Do not remove the Render disk, change `DATA_DIR`, or regenerate `APP_SECRET` after wallets exist. The bot encrypts wallet keys with `APP_SECRET`; if that value changes, the bot now fails startup with a clear error instead of silently acting like wallets reset.

Use a Render plan that supports persistent disks. The blueprint uses `starter` for that reason.

## Key Safety

- `.env` and `data/` are ignored by Git.
- `render.yaml` does not contain private keys or bot secrets; sensitive values use `sync: false`.
- Wallet private keys are encrypted before being written to `DATA_DIR`.
- `APP_SECRET` must stay stable, because it is the key used to decrypt stored wallets.

Health check URL:

```text
https://your-render-service.onrender.com/healthz
```
