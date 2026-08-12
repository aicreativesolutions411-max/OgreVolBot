import test from "node:test";
import assert from "node:assert/strict";
import { createPumpPortalStream } from "../src/lib/pumpPortalStream.js";

class FakeWebSocket {
  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.sent = [];
    FakeWebSocket.instances.push(this);
  }

  send(payload) {
    this.sent.push(JSON.parse(payload));
  }

  open() {
    this.readyState = 1;
    this.onopen?.();
  }

  message(payload) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }

  close() {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this.onclose?.();
  }
}

async function withFakeWebSocket(run) {
  const prior = globalThis.WebSocket;
  FakeWebSocket.instances = [];
  globalThis.WebSocket = FakeWebSocket;
  try {
    await run();
  } finally {
    globalThis.WebSocket = prior;
  }
}

const nextTurn = () => new Promise((resolve) => setImmediate(resolve));

test("no-key PumpPortal mode keeps one creation stream without false trade subscriptions", async () => {
  await withFakeWebSocket(async () => {
    const stream = createPumpPortalStream({ tradeStreamEnabled: false });
    assert.deepEqual(stream.syncTrackedMints(["mint-a"]), {
      wanted: 1,
      active: 0,
      desired: 1,
      enabled: false,
    });
    stream.start();
    await nextTurn();
    assert.equal(FakeWebSocket.instances.length, 1);
    const socket = FakeWebSocket.instances[0];
    socket.open();
    assert.deepEqual(socket.sent.map((row) => row.method), ["subscribeNewToken", "subscribeMigration"]);
    assert.equal(stream.stats().tradeSubscriptions, 0);
    assert.equal(stream.stats().desiredTradeSubscriptions, 1);
    assert.equal(stream.stats().tradeStreamAuthorization, "disabled");
    stream.stop();
  });
});

test("group tracking survives an expired chart watch and provider rejections are visible", async () => {
  await withFakeWebSocket(async () => {
    const stream = createPumpPortalStream({ tradeStreamEnabled: true, watchTtlMs: 1 });
    stream.syncTrackedMints(["mint-a"]);
    stream.watchMint("mint-a", 1);
    await new Promise((resolve) => setTimeout(resolve, 5));
    stream.syncTrackedMints(["mint-a"]);
    assert.equal(stream.stats().desiredTradeSubscriptions, 1);

    stream.start();
    await nextTurn();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    assert.ok(socket.sent.some((row) => row.method === "subscribeTokenTrade" && row.keys.includes("mint-a")));
    socket.message({ message: "subscribeTokenTrade is only available with a funded API key" });
    const rejected = stream.stats();
    assert.equal(rejected.tradeStreamAuthorized, false);
    assert.equal(rejected.tradeStreamAuthorization, "rejected");
    assert.equal(rejected.currentSubscriptionErrors, 1);
    assert.match(rejected.lastProviderError, /funded API key/i);
    const subscribeAttempts = socket.sent.filter((row) => row.method === "subscribeTokenTrade").length;
    stream.syncTrackedMints(["mint-a"]);
    assert.equal(
      socket.sent.filter((row) => row.method === "subscribeTokenTrade").length,
      subscribeAttempts,
      "a rejected connection must not hammer the provider with repeat auth attempts",
    );

    stream.syncTrackedMints([]);
    assert.equal(stream.stats().desiredTradeSubscriptions, 0);
    stream.stop();
  });
});

test("authenticated trade events preserve the raw transaction for the Buy Bot handoff", async () => {
  await withFakeWebSocket(async () => {
    let received = null;
    const stream = createPumpPortalStream({
      tradeStreamEnabled: true,
      onTrade: (mint, trade, event) => { received = { mint, trade, event }; },
    });
    stream.syncTrackedMints(["mint-a"]);
    stream.start();
    await nextTurn();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    socket.message({
      mint: "mint-a",
      txType: "buy",
      solAmount: 1.25,
      tokenAmount: 50,
      traderPublicKey: "buyer-a",
      signature: "signature-a",
    });
    assert.equal(stream.stats().tradeStreamAuthorized, true);
    assert.equal(stream.stats().tradeSubscriptions, 1);
    assert.equal(received?.mint, "mint-a");
    assert.equal(received?.trade?.solAmount, 1.25);
    assert.equal(received?.event?.signature, "signature-a");
    stream.stop();
  });
});

test("stray trade frames cannot authorize the stream and provider subscriptions stay capped", async () => {
  await withFakeWebSocket(async () => {
    const stream = createPumpPortalStream({ tradeStreamEnabled: true, maxTradeSubs: 2 });
    stream.syncTrackedMints(["mint-a", "mint-b", "mint-c"]);
    stream.start();
    await nextTurn();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    const subscribed = socket.sent.find((row) => row.method === "subscribeTokenTrade")?.keys || [];
    assert.equal(subscribed.length, 2);
    assert.equal(stream.stats().tradeSubscriptions, 2);
    assert.equal(stream.stats().desiredTradeSubscriptions, 3);
    socket.message({ mint: "mint-stray", txType: "buy", solAmount: 1, tokenAmount: 2 });
    assert.equal(stream.stats().tradeStreamAuthorized, false);
    assert.equal(stream.stats().counters.trades, 0);
    socket.message({ mint: subscribed[0], txType: "buy", solAmount: 1, tokenAmount: 2 });
    assert.equal(stream.stats().tradeStreamAuthorized, true);
    stream.stop();
  });
});

test("provider diagnostics redact keys from common credential formats", async () => {
  await withFakeWebSocket(async () => {
    const stream = createPumpPortalStream({ tradeStreamEnabled: true });
    stream.syncTrackedMints(["mint-a"]);
    stream.start();
    await nextTurn();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    socket.message({ error: "subscribeTokenTrade unauthorized api_key=topsecret Authorization: Bearer secondsecret" });
    const message = stream.stats().lastProviderError;
    assert.doesNotMatch(message, /topsecret|secondsecret/);
    assert.match(message, /\[redacted\]/);
    stream.stop();
  });
});
