Render services cleanup (2026-06-06)
=====================================

Goal: remove worker-launch confusion and prep for smooth terminal refresh as traffic increases.

What was fixed
-------------
- Updated web service to run the web entrypoint:
  - `startCommand: npm run render-start`
  - `buildCommand: npm ci && npm run build:web`
  - `healthCheckPath: /healthz`
- Set web service worker flags to current model:
  - `WORKER_TICK_ENABLED=true`
  - `WORKER_TICK_ENDPOINT_ENABLED=true`
  - `WORKER_TICK_RUN_TRADE_PLANS=true`
  - `WORKER_TICK_RUN_DCA_PLANS=true`
  - `WORKER_TICK_WARM_FEEDS=true`
  - `WORKER_TICK_WARM_DISPLAY_CACHES=true`
  - `WORKER_TICK_FORCE_FEEDS=false`
  - `WORKER_TICK_TIMEOUT_MS=20000`
  - `WORKER_DISPLAY_CACHE_USER_LIMIT=8`
- Removed legacy/unused env flags from web + both workers:
  - `RUN_METADATA_WORKER`
  - `RUN_POSITION_REFRESH_WORKER`
  - `RUN_WALLET_REFRESH_WORKER`
  - `RUN_FEED_WORKER`
  - `RUN_TPSL_WORKER`
- Confirmed web service has `TELEGRAM_BOT_TOKEN` set.

Workers
-------
- Main worker (`srv-d8f0vpc2m8qs73dmdmqg`):
  - `startCommand: npm run worker`
  - `plan: standard`
  - Shared settings:
    - `RUN_WORKER=true`, `WORKER_DISABLED=false`, `SERVICE_ROLE=worker`
    - `WORKER_TICK_URL=https://ogrevolbot.onrender.com/api/internal/worker/tick`
    - `WORKER_SECRET=<set-in-render-env>`
    - `WORKER_TICK_INTERVAL_MS=15000`
    - `WORKER_TRADE_PLAN_INTERVAL_MS=1500`
    - `WORKER_FAST_TP_SL_ENABLED=true`
    - `WORKER_TICK_FORCE_FEEDS=false`
    - `WORKER_TICK_WARM_DISPLAY_CACHES=true`
    - `WORKER_DISPLAY_CACHE_USER_LIMIT=8`
    - `WORKER_CONCURRENCY=2`
    - `CACHE_ENABLED=true`, `CACHE_PROVIDER=redis`
    - `CACHE_CONNECT_TIMEOUT_MS=800`, `CACHE_CIRCUIT_BREAKER_MS=15000`
    - `REDIS_URL=redis://red-d8h5inj7uimc73cjad1g:6379`

- Wallet worker (`srv-d8hmit0jo6nc73cd4q60`):
  - `startCommand: npm run worker`
  - `plan: standard`
  - `SERVICE_ROLE=worker`
  - `RUN_WORKER=true`, `WORKER_TASK_SET=wallets`
  - `WORKER_TICK_RUN_TRADE_PLANS=false`, `WORKER_TICK_RUN_DCA_PLANS=false`
  - `WORKER_TICK_WARM_FEEDS=false`, `WORKER_TICK_WARM_DISPLAY_CACHES=true`
  - `WORKER_TICK_FORCE_FEEDS=false`
  - `WORKER_FAST_TP_SL_ENABLED=false`
  - `WORKER_TICK_INTERVAL_MS=20000`, `WORKER_TRADE_PLAN_INTERVAL_MS=1500`
  - `WORKER_TICK_TIMEOUT_MS=20000`
- Shared Redis settings as above (`WORKER_SECRET=<same-value-as-WEB>`).

Why this should feel smoother
------------------------------
- The web process no longer launches with the wrong entrypoint and crashes on startup due to missing Telegram token.
- Both workers now run in dedicated, supported mode with explicit task sets.
- Legacy worker flags are removed so startup behavior is deterministic.
- Shared Redis caching settings are aligned across workers and web to reduce cold-cache latency.

Recommended next upgrades (if traffic grows past ~50+ users)
-------------------------------------------------------------
- Keep both workers on standard (already done).
- Add a second read replica cache (or move heavy cache lookups to a dedicated Redis tier) before scaling past medium traffic.
- Consider splitting long-running RPC/Jupiter scan jobs into a background job queue if wallet-refresh and chart-load spikes still appear during peak usage.
