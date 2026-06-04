# Trading safety rules for Codex

For any change involving trade execution, stop loss, take profit, order closing, position monitoring, or PnL:

1. Never rely on frontend/browser code to trigger financial exits.
2. Never rely on in-memory state in a request-only API route for active trade monitoring.
3. All TP/SL logic must be server-side, testable, and idempotent.
4. Every execution path must include structured logs with tradeId, userId, symbol, side, entryPrice, currentPrice, stopLoss, takeProfit, status, and reason.
5. Every TP/SL change must include tests for:
   - long stop loss
   - long take profit
   - short stop loss
   - short take profit
   - duplicate trigger prevention
6. A fix is not complete until tests fail before the fix and pass after the fix.
7. Do not mark a task done based only on visual UI behavior.
8. The browser must be closable and TP/SL must still work.
