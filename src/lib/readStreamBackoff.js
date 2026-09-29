// Read-only event feeds must not hammer denied/rate-limited providers. No endpoint
// rotation or automatic escalation to a paid RPC is performed here.
export function createReadStreamBackoff({ now = Date.now, random = Math.random } = {}) {
  let failures = 0, retryAt = 0, category = '', lastError = '';
  return {
    fail(error) {
      const raw = String(error?.message || error || 'Connection failed');
      category = /\b(401|403)\b|unauthori[sz]ed|forbidden|api.?key|access denied/i.test(raw) ? 'authorization'
        : /\b429\b|rate.?limit|too many/i.test(raw) ? 'rate_limit' : 'connection';
      failures = Math.min(20, failures + 1);
      const floor = category === 'authorization' ? 60_000 : category === 'rate_limit' ? 15_000 : 3_000;
      const delay = Math.min(300_000, floor * 2 ** (failures - 1));
      retryAt = now() + Math.min(300_000, Math.round(delay * (1 + Math.max(0, Math.min(1, random())) * .15)));
      // Provider exceptions can contain credential-bearing URLs. Health output
      // exposes only a stable category, not the original exception text.
      lastError = category === 'authorization' ? 'Feed access denied; check provider credentials and WebSocket permissions.'
        : category === 'rate_limit' ? 'Feed rate limited; retrying with backoff.' : 'Feed connection interrupted; retrying with backoff.';
      return this.state();
    },
    reset() { failures = 0; retryAt = 0; category = ''; lastError = ''; },
    remaining() { return Math.max(0, retryAt - now()); },
    state() { return { failures, retryAt, category, lastError }; },
  };
}
