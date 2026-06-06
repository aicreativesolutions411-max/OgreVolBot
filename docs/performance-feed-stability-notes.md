# SlimeWire performance and feed stability notes

## Phase 0 scan findings

- Duplicated polling risk: live pairs, sniper scan, KOL, watchlist, wallet background refresh, worker ticks, and TP/SL loops all have timer paths. The browser timers are now gated harder by active tab and hidden-page state.
- Hidden modules: terminal rendering is mostly active-tab based already, but manual refresh handlers could still start work for related feeds. Feed click handlers now defer network work so the UI paints first.
- Repeated RPC/Helius calls: server endpoints already use cached web summaries and stale-while-revalidate for balances, positions, PnL, and live pairs. The wallet manual refresh path now has a shorter client timeout and request-id guard.
- Expensive renders/tables: live pair rendering is already batched with a delayed animation-frame flush. Manual feed controls now avoid synchronous waits that made clicks feel stuck.
- Stuck loading states: top wallet refresh had a non-forced path and no wallet-specific state machine. It now uses `refreshWalletNow({ force: true, reason: "manual_header_click" })`, request ids, timeout/degraded status, and `finally` cleanup.
- Feed starvation: display feeds were globally dropping mint/freeze/freezable/mayhem/Token-2022 rows before category rules could place them. Those are now risk flags/badges for feed display; trade/buy safety prechecks still run before execution.

## Category behavior

- Fresh/New default to broad launch discovery for the rolling 0-2h launch window, sorted newest first.
- Steady is for older or floor-building rows with liquidity, volume, score, or reasons.
- Graduating is near-bond/progress/market-cap pressure.
- Graduated is bonded/pool-detected.
- SAFE mode can hide mint/freeze/mayhem warnings; ALL mode does not starve discovery.
- Watchlist and selected chart rows should remain displayable with warnings instead of disappearing because of broad feed filters.
