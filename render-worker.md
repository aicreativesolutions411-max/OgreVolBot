# Render Worker Setup

This project now supports a Render background worker that calls the web service through a private endpoint:

`POST /api/internal/worker/tick`

The worker does not store wallet keys and does not mount the web service disk. It asks the web service to run the same local jobs the web service already owns:

- TP/SL trade-plan checks
- DCA plan checks
- Live-pair feed warming

That design avoids Render disk split-brain. Render persistent disks are service-local, so a worker cannot safely read the web service's `/var/data` wallet files unless the app is moved to a shared database.

## Render Services

Keep the current web service running with its persistent disk. Add one background worker service:

- Type: Background Worker
- Name: `solana-telegram-wallet-ops-worker`
- Runtime: Node
- Build command: `npm ci`
- Start command: `npm run worker`
- Plan: Starter is enough to begin

If you deploy with `render.yaml`, the worker service is already included.

## Environment Variables

Set the same `WORKER_SECRET` on both the web service and worker service. Use a new long random string, not your wallet key and not a public value.

Web service:

```env
WORKER_TICK_ENABLED=true
WORKER_SECRET=use-a-new-long-random-value
WORKER_TICK_RUN_TRADE_PLANS=true
WORKER_TICK_RUN_DCA_PLANS=true
WORKER_TICK_WARM_FEEDS=true
STOP_LOSS_CHECK_INTERVAL_MS=2000
STOP_LOSS_TRIGGER_BUFFER_PCT=1.5
STOP_LOSS_EXIT_SLIPPAGE_BPS=1500
```

Worker service:

```env
WORKER_TICK_URL=https://ogrevolbot.onrender.com/api/internal/worker/tick
WORKER_SECRET=use-the-same-value-as-the-web-service
WORKER_TICK_INTERVAL_MS=2000
WORKER_TICK_TIMEOUT_MS=20000
WORKER_TICK_RUN_TRADE_PLANS=true
WORKER_TICK_RUN_DCA_PLANS=true
WORKER_TICK_WARM_FEEDS=true
WORKER_TICK_BUCKETS=live,under1h,under3h,under1d
WORKER_TICK_SORTS=best,newest
WORKER_TICK_FORCE_FEEDS=false
```

Leave `WORKER_TICK_FORCE_FEEDS=false` unless you intentionally want more aggressive feed refreshes. False keeps shared cache protection on and is cheaper/smoother.

## What This Fixes

- Keeps TP/SL and DCA checks firing even when user traffic is light.
- Warms live-pair feeds so users are less likely to hit cold/stale data.
- Keeps the web service as the only process touching wallet storage.

## What It Does Not Fix Alone

- Browser wallet auto-sells still require user signing unless you add a real delegated/session-key flow. Managed/in-app wallets can be sold by the server because the app already has those keys.
- Pump launch `bad request` still depends on the launch API format and provider. The worker does not create a Pump API.
- For high user counts, the next real upgrade is shared Postgres/Redis so the worker can own queues without calling the web service.
