import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { EventEmitter } from 'node:events';
import { createReadStreamBackoff } from '../src/lib/readStreamBackoff.js';

const source = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
function between(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, `Missing source region: ${start}`);
  return source.slice(a, b);
}

function scheduler() {
  let now = 10_000, sequence = 0;
  const timers = new Map(), calls = [];
  const context = vm.createContext({
    Date: { now: () => now },
    setTimeout(fn, ms) { const id = ++sequence; timers.set(id, { fn, at: now + ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
    groupBuyTradeBackoff: new Map(), groupBuyTradePollInFlight: new Set(),
    groupBuyTradeWakePending: new Map(), groupBuyTradeWakeConfirmTimers: new Map(),
    groupBuyTradeDeferredTimers: new Map(),
    GROUP_BUY_WAKE_CONFIRM_DELAYS_MS: [500, 1000, 2000, 4000],
    groupBuyTradeDiag: { rateLimits: 0, wakeConfirmations: 0, deferredWakes: 0 },
    pumpSwapApiHostGate: { snapshot: () => ({ cooldownUntil: 0 }) },
    groupBuyBackoffDelayMs: (failures, delay) => Math.max(1500 * 2 ** (failures - 1), delay),
    pollGroupBuyTradesForMint: async (mint, options) => { calls.push({ mint, ...options }); return { ok: true, foundBuy: true }; },
    noteGroupBuyTradePollError() {},
  });
  vm.runInContext(between('function scheduleGroupBuyTradeBackoff(', 'async function fetchGroupBuyTradePage(')
    + between('function queueGroupBuyTradePoll(', 'async function pollGroupBuyTrades('), context);
  return {
    context, timers, calls,
    async advance(ms) {
      now += ms;
      for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.fn(); }
      for (let i = 0; i < 8; i++) await Promise.resolve();
    },
  };
}

test('repeated forced activity wakes respect Retry-After and coalesce into one exact retry', async () => {
  const h = scheduler();
  h.context.groupBuyTradeBackoff.set('Mint', { failures: 1, nextAttemptAt: 40_000 });
  for (let i = 0; i < 30; i++) h.context.queueGroupBuyTradePoll('Mint', { force: true, priority: 120, confirmOnce: true });
  assert.equal(h.calls.length, 0, 'a forced wake must not bypass the provider deadline');
  assert.equal(h.timers.size, 1, 'all repeated wakes share one retry timer');
  await h.advance(29_999); assert.equal(h.calls.length, 0);
  await h.advance(1); assert.deepEqual(h.calls, [{ mint: 'Mint', priority: 120 }]);
  assert.equal(h.timers.size, 0);
});

test('a provider-wide cooldown defers wakes without admitting doomed HTTP queue jobs', async () => {
  const h = scheduler();
  h.context.pumpSwapApiHostGate.snapshot = () => ({ cooldownUntil: 25_000 });
  h.context.queueGroupBuyTradePoll('Mint', { force: true, priority: 120 });
  assert.equal(h.calls.length, 0);
  assert.equal(h.timers.size, 1);
  await h.advance(15_000); assert.equal(h.calls.length, 1);
});

test('a routine poll winning the retry deadline retains the pending live wake priority and confirmation', async () => {
  const h = scheduler();
  h.context.groupBuyTradeBackoff.set('Mint', { failures: 1, nextAttemptAt: 11_000 });
  h.context.queueGroupBuyTradePoll('Mint', { force: true, priority: 120, confirmOnce: true });
  // Let a routine callback run at the same deadline, before the deferred timer.
  h.context.pollGroupBuyTradesForMint = async (mint, options) => { h.calls.push({ mint, ...options }); return { ok: true, foundBuy: false }; };
  h.context.groupBuyTradeBackoff.delete('Mint');
  h.context.queueGroupBuyTradePoll('Mint', { priority: 100 });
  await h.advance(0);
  assert.equal(h.calls[0].priority, 120);
  assert.equal(h.timers.size, 1, 'a pending confirmation survives the routine callback');
});

test('local admission deferrals do not grow a provider failure streak or add a minute of delay', () => {
  const h = scheduler();
  h.context.groupBuyTradeBackoff.set('Mint', { failures: 8, nextAttemptAt: 11_000 });
  const next = h.context.scheduleGroupBuyTradeBackoff('Mint', { code: 'GROUP_BUY_PROVIDER_COOLDOWN', retryAfterMs: 12_000 });
  assert.equal(next.failures, 8);
  assert.equal(next.nextAttemptAt, 22_000);
  assert.equal(h.context.groupBuyTradeDiag.rateLimits, 0);
});

test('a failed exact read retries on its deadline without waiting for the next rotating recovery tick', async () => {
  const h = scheduler(); let calls = 0;
  h.context.pollGroupBuyTradesForMint = async (mint) => {
    calls++;
    if (calls === 1) {
      h.context.scheduleGroupBuyTradeBackoff(mint, { status: 429, retryAfterMs: 6000 });
      return { ok: false };
    }
    h.context.clearGroupBuyTradeBackoff(mint);
    return { ok: true, foundBuy: true };
  };
  h.context.queueGroupBuyTradePoll('Mint', { force: true, priority: 120 });
  await h.advance(0); assert.equal(h.timers.size, 1);
  await h.advance(5999); assert.equal(calls, 1);
  await h.advance(1); assert.equal(calls, 2);
});

test('deactivating a tracked coin cancels deferred retry timers', () => {
  const poll = between('async function pollGroupBuyTrades(', 'async function buildGroupBuyStatsSnapshot(');
  assert.match(poll, /groupBuyTradeDeferredTimers/);
  assert.match(poll, /clearTimeout\(timer\)/);
});

test('an explicitly configured public Solana endpoint retains the bounded public subscription cap', () => {
  const c = vm.createContext({ URL });
  vm.runInContext(between('function groupBuyChainWakeCapacity(', 'const GROUP_BUY_CHAIN_WAKE_URL'), c);
  assert.equal(c.groupBuyChainWakeCapacity('wss://api.mainnet.solana.com/'), 32);
  assert.equal(c.groupBuyChainWakeCapacity('wss://api.mainnet-beta.solana.com/'), 32);
  assert.equal(c.groupBuyChainWakeCapacity('wss://dedicated.example/private'), 200);
  assert.equal(c.groupBuyChainWakeCapacity(''), 0);
});

function wakeHarness() {
  let sequence = 0;
  const timers = new Map(), sockets = [];
  class FakeWebSocket extends EventEmitter {
    static OPEN = 1; static CONNECTING = 0;
    constructor() { super(); this.readyState = 0; this.sent = []; sockets.push(this); }
    send(value) { this.sent.push(JSON.parse(value)); }
    close() { this.readyState = 3; this.emit('close'); }
    terminate() { this.close(); }
    ping() {}
  }
  const c = vm.createContext({
    URL, WebSocket: FakeWebSocket, process: { env: {} }, CHAINSTACK_WSS: '',
    createReadStreamBackoff: () => createReadStreamBackoff({ random: () => 0 }),
    firstString: (...values) => values.find(value => value) || '',
    setTimeout(fn, ms) { const id = ++sequence; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); }, setInterval() { return 1; }, clearInterval() {},
    queueGroupBuyTradePoll() {},
  });
  vm.runInContext(between('function groupBuyChainWakeUrl(', 'async function buyWsSync('), c);
  return { c, timers, sockets, read: expression => vm.runInContext(expression, c) };
}

test('late errors from a replaced socket cannot poison the active live feed', () => {
  const h = wakeHarness(); h.c.syncGroupBuyChainWake(['Mint']);
  const old = h.sockets[0]; old.close(); h.c.startGroupBuyChainWake();
  assert.equal(h.sockets.length, 2);
  old.emit('error', new Error('old socket reset'));
  assert.equal(h.read('groupBuyChainWakeDiag.errors'), 0);
  assert.equal(h.read('groupBuyWakeBackoff.remaining()'), 0);
});

test('an open socket with no accepted subscriptions times out instead of silently stalling forever', () => {
  const h = wakeHarness(); h.c.syncGroupBuyChainWake(['Mint']);
  const socket = h.sockets[0]; socket.readyState = 1; socket.emit('open');
  assert.equal(h.c.groupBuyChainWakeConnected(), false);
  const ackTimer = [...h.timers.values()].find(timer => timer.ms === 6000);
  assert.ok(ackTimer, 'every subscription batch needs an acknowledgement deadline');
  ackTimer.fn();
  assert.equal(socket.readyState, 3);
  assert.equal(h.read('groupBuyChainWakeDiag.errors'), 1);
});

test('one denied connection counts once even if several subscription errors arrive together', () => {
  const h = wakeHarness(); h.c.syncGroupBuyChainWake(['MintA', 'MintB']);
  const socket = h.sockets[0]; socket.readyState = 1; socket.emit('open');
  for (const request of socket.sent) socket.emit('message', Buffer.from(JSON.stringify({ id: request.id, error: { message: '403 forbidden' } })));
  socket.emit('error', new Error('403 forbidden'));
  assert.equal(h.read('groupBuyChainWakeDiag.errors'), 1);
});

test('delivery timing separates source-to-outbox and outbox-to-Telegram without storing user data', () => {
  let now = 50_000;
  const c = vm.createContext({
    Date: { now: () => now },
    groupBuyLatencySamples: [],
    groupBuyDeliveryDiag: { alertsDelivered: 0, buysDelivered: 0, buysOver10s: 0, maxBuyLatencyMs: 0 },
  });
  vm.runInContext(between('function groupBuyTradeAlertEvent(', 'function updateGroupBuyDeliveryHealthState('), c);
  c.noteGroupBuyDelivery('delivered', { eventKey: 'sol:Mint:secret-tx', createdAt: 48_000, options: { detectedAt: 35_000 } });
  const result = c.groupBuyLatencySnapshot();
  assert.equal(result.samples, 1);
  assert.equal(result.totalP95Ms, 15_000);
  assert.equal(result.feedP95Ms, 13_000);
  assert.equal(result.queueP95Ms, 2000);
  assert.doesNotMatch(JSON.stringify(c.groupBuyLatencySamples), /Mint|secret-tx/);
  c.noteGroupBuyDelivery('delivered', { eventKey: 'sol:missing', createdAt: 48_000 });
  c.noteGroupBuyDelivery('delivered', { eventKey: 'sol:future', createdAt: 48_000, options: { detectedAt: 60_000 } });
  assert.equal(c.groupBuyLatencySnapshot().samples, 1, 'unknown/future trade timestamps must not pretend to be fast buys');
  for (let i = 0; i < 250; i++) {
    now++;
    c.noteGroupBuyDelivery('delivered', { eventKey: 'rh:Mint:tx', createdAt: now - 100, options: { detectedAt: now - 200 } });
  }
  assert.equal(c.groupBuyLatencySnapshot().samples, 200, 'timing history must be bounded');
});

test('missing source timestamps stay unknown all the way into the durable alert options', () => {
  const normalizer = between('function normalizeGroupBuyTrade(', 'async function handoffGroupBuyTrade(');
  assert.doesNotMatch(normalizer, /detectedAt:[^\n]*Date\.now/);
  const post = between('async function postGroupBuy(', '// ---- 🪶 ROBINHOOD BUY BOT');
  assert.doesNotMatch(post, /detectedAt:[^\n]*Date\.now/);
  const socket = between('async function onGroupBuyTrade(', '// One cheap DexScreener batch');
  assert.match(socket, /timestamp:.*d\.timestamp/);
});
