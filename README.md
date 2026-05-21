# Solana Telegram Wallet Ops Bot

Telegram bot for legitimate, auditable Solana wallet operations:

- Create/import managed wallets
- Export/restore encrypted wallet backups
- Emergency private key export for user-owned wallets
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
   JUPITER_MIN_INTERVAL_MS=1200
   JUPITER_RETRIES=5
   JUPITER_429_COOLDOWN_MS=15000
   FEE_WALLET=AUcSFZsCdawzfqa4KzHK1BHz1RDrBnj8CF5kxoy3NvxV
   BUNDLE_FEE_BPS=50
   BUNDLE_CONCURRENCY=1
   BUY_RESERVE_SOL=0.01
   RPC_MIN_INTERVAL_MS=1200
   RPC_DELAY_MS=1500
   RPC_RETRIES=10
   RPC_429_COOLDOWN_MS=15000
   TELEGRAM_ADMIN_USER_IDS=123456789
   ```

4. Start the bot:

   ```bash
   npm start
   ```

## Telegram Commands

- `/start` - open the menu
- `/wallets` - list managed wallets
- `/balances` - show SOL and token balances for your wallets
- `/withdraw` - withdraw maximum available SOL from selected wallets
- `/cancel` - cancel the current flow

The bot keeps encrypted key material and an audit log under `DATA_DIR`.

Set `TELEGRAM_ADMIN_USER_IDS` to your numeric Telegram user ID to show bot-wide admin controls like audit export and emergency stop. Public users can still use their own wallet/trading menu in DM.

Batch buy and sell use Jupiter Swap API v2, so you need a Jupiter API key from the Jupiter developer portal.

Bundle buy and sell charge a 0.5% platform fee by default. `BUNDLE_FEE_BPS=50` means 50 basis points, which is 0.5%, and fees are sent to `FEE_WALLET`.

`BUNDLE_CONCURRENCY=1` is the safest default for free/public RPCs. Raise it only if your RPC/Jupiter plan can handle it. The bot also has a global RPC queue controlled by `RPC_MIN_INTERVAL_MS`, `RPC_DELAY_MS`, `RPC_RETRIES`, and `RPC_429_COOLDOWN_MS`, plus a Jupiter queue controlled by `JUPITER_MIN_INTERVAL_MS`, `JUPITER_RETRIES`, and `JUPITER_429_COOLDOWN_MS`. This keeps multiple users/actions from hammering the same endpoints at once. `BUY_RESERVE_SOL=0.01` is the recommended extra SOL per wallet for network fees and token-account creation around buys.

For bundle buys, fund each wallet with at least:

```text
buy amount per wallet + BUY_RESERVE_SOL
```

Example: buying `0.10 SOL` from 10 wallets with `BUY_RESERVE_SOL=0.01` needs about `1.10 SOL` across the 10 wallets, plus a little SOL in the source wallet for funding transaction fees.

Wallet import accepts a base58 private key, a JSON byte array like `[12,34,...]`, or a comma-separated 64-byte secret key. It does not accept seed phrases or public wallet addresses.

`Sweep SOL` drains each selected wallet by estimating the network fee and sending `balance - fee`. This avoids the old rent error where a wallet was left with too little SOL to remain rent-exempt.

In the buy amount step, users can type `max` to use each wallet's available SOL except the safety reserve.

If you still see `429 Too Many Requests`, your current Solana RPC or Jupiter plan is rate-limiting even after the bot queues and slows requests. Keep `BUNDLE_CONCURRENCY=1`, keep `RPC_MIN_INTERVAL_MS=1200` and `JUPITER_MIN_INTERVAL_MS=1200` or higher, and use a paid/private `SOLANA_RPC_URL` plus higher Jupiter limits for reliable multi-wallet usage. Public `https://api.mainnet-beta.solana.com` is not reliable for production batches.

`Emergency Key Export` sends raw private keys for the Telegram user's own bot wallets after an exact confirmation phrase. This is for recovery only. Anyone with that file can drain those wallets.

`Rescue Backup Keys` lets a user upload the wallet backup `.txt` file and receive a private-key recovery file even if the wallets are not currently restored in the bot. If the backup opens but keys cannot decrypt, the new deployment is using a different `APP_SECRET`; set Render back to the exact old `APP_SECRET`, redeploy, then restore or rescue again.

If Telegram file upload is failing, users can paste recovery text instead. Restore and Rescue scan pasted text for lines like `Base58 secret key: ...` or `JSON secret key: [12,34,...]` and rebuild only the valid Solana wallet keys they find.

Quote failures usually mean Jupiter cannot build a route for the token/amount, liquidity is too low, slippage is too low, the wallet does not have enough SOL after fees, or Jupiter/RPC is rate-limiting the request.

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
KEEPALIVE_INTERVAL_MINUTES=10
```

It pings:

```text
https://your-service-name.onrender.com/healthz
```

This can reduce idle spin-down, but Render Free can still restart services and local files can still reset. Keep using **Export Backup** after wallet changes.
The bot also sends automatic backups after wallet create/import/restore, so users do not have to remember every time.

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
