// Abuse-case matrix for the Telegram-triggered swap-bot lab harness.
// Covers: malicious inputs, invalid mints, replayed commands, duplicate events,
// concurrent triggers, missing API keys, excessive slippage, and an attempted
// mainnet execution (which must be refused).

import { loadConfig, HarnessConfig, assertNoMainnet, broadcastFlagsAllow, DEVNET_GENESIS, MAINNET_GENESIS } from "../src/config";
import { LabStore } from "../src/state";
import { RateLimiter } from "../src/rateLimit";
import { handleUpdate, TgUpdate, Deps } from "../src/bot";
import { assertBroadcastAllowed, executeOrSimulate, ChainConn, LabTx } from "../src/solana";
import { buildSwapPlan } from "../src/jupiter";

const SOL = "So11111111111111111111111111111111111111112";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const ADMIN = "111222333";

function cfg(overrides: Partial<NodeJS.ProcessEnv> = {}): HarnessConfig {
  return loadConfig({
    DRY_RUN: "true",
    SOLANA_CLUSTER: "devnet",
    ALLOW_DEVNET_SEND: "false",
    USE_REAL_JUPITER_QUOTES: "false",
    ADMIN_CHAT_IDS: ADMIN,
    RATE_LIMIT_PER_MIN: "20",
    MAX_SLIPPAGE_BPS: "100",
    MAX_AMOUNT_UI: "5",
    ...overrides,
  } as NodeJS.ProcessEnv);
}

function deps(overrides: Partial<Deps> = {}): Deps {
  return {
    cfg: cfg(),
    store: new LabStore(":memory:"),
    limiter: new RateLimiter(20),
    ...overrides,
  };
}

const msg = (update_id: number, text: string, id: string = ADMIN): TgUpdate => ({
  update_id,
  message: { chat: { id }, from: { id }, text },
});

// Fake chain that reports a genesis hash of our choosing — no network.
function fakeConn(genesis: string): ChainConn {
  return {
    async getGenesisHash() {
      return genesis;
    },
    async getLatestBlockhash() {
      return { blockhash: "11111111111111111111111111111111" };
    },
    async simulateTransaction(_tx: LabTx) {
      return { value: { err: null, logs: ["Program log: simulated"] } };
    },
    async sendRawTransaction() {
      return "FAKE_SIGNATURE";
    },
    async confirmTransaction() {
      return {};
    },
  };
}

describe("authorization", () => {
  test("non-allowlisted chat is denied (deny-by-default)", async () => {
    const d = deps();
    const r = await handleUpdate(msg(1, "/status", "999999"), d);
    expect(r.code).toBe("unauthorized");
  });
  test("empty allowlist denies everyone", async () => {
    const d = deps({ cfg: cfg({ ADMIN_CHAT_IDS: "" }) });
    const r = await handleUpdate(msg(1, "/status", ADMIN), d);
    expect(r.code).toBe("unauthorized");
  });
});

describe("malicious / invalid inputs", () => {
  test("invalid mint is rejected", async () => {
    const r = await handleUpdate(msg(1, `/quote not_a_mint ${USDC} 1`, ADMIN), deps());
    expect(r.code).toBe("invalid_args");
  });
  test("SQL-injection-ish payload is rejected as a bad mint, never executed", async () => {
    const r = await handleUpdate(msg(1, `/quote '; DROP TABLE sessions;-- ${USDC} 1`, ADMIN), deps());
    expect(["invalid_args", "bad_command"]).toContain(r.code);
  });
  test("unknown command is rejected (no fuzzy match to a real action)", async () => {
    const r = await handleUpdate(msg(1, "/withdraw all to me", ADMIN), deps());
    expect(r.code).toBe("bad_command");
  });
  test("same in/out mint is rejected", async () => {
    const r = await handleUpdate(msg(1, `/quote ${SOL} ${SOL} 1`, ADMIN), deps());
    expect(r.code).toBe("invalid_args");
  });
});

describe("excessive slippage", () => {
  test("slippage above ceiling is rejected", async () => {
    const r = await handleUpdate(msg(1, `/quote ${SOL} ${USDC} 1 10000`, ADMIN), deps());
    expect(r.code).toBe("invalid_args");
    expect(r.reply).toMatch(/slippage/i);
  });
});

describe("replay / duplicate / concurrent protection", () => {
  test("a replayed update_id is blocked the second time", async () => {
    const d = deps();
    const first = await handleUpdate(msg(42, `/quote ${SOL} ${USDC} 1`, ADMIN), d);
    const second = await handleUpdate(msg(42, `/quote ${SOL} ${USDC} 1`, ADMIN), d);
    expect(first.code).toBe("ok");
    expect(second.code).toBe("replay");
  });
  test("duplicate delivery of the same event is idempotent", async () => {
    const d = deps();
    const dup = msg(77, `/quote ${SOL} ${USDC} 1`, ADMIN);
    await handleUpdate(dup, d);
    const again = await handleUpdate(dup, d);
    expect(again.code).toBe("replay");
  });
  test("concurrent triggers with the same update_id: exactly one wins", async () => {
    const d = deps();
    const u = msg(99, `/quote ${SOL} ${USDC} 1`, ADMIN);
    const results = await Promise.all([handleUpdate(u, d), handleUpdate(u, d), handleUpdate(u, d)]);
    const okCount = results.filter((r) => r.code === "ok").length;
    const replayCount = results.filter((r) => r.code === "replay").length;
    expect(okCount).toBe(1);
    expect(replayCount).toBe(2);
  });
});

describe("rate limiting", () => {
  test("floods past the per-minute cap are throttled", async () => {
    const d = deps({ cfg: cfg({ RATE_LIMIT_PER_MIN: "3" }), limiter: new RateLimiter(3) });
    const codes: string[] = [];
    for (let i = 0; i < 6; i++) {
      const r = await handleUpdate(msg(1000 + i, `/quote ${SOL} ${USDC} 1`, ADMIN), d, 1_000_000);
      codes.push(r.code);
    }
    expect(codes.filter((c) => c === "rate_limited").length).toBeGreaterThan(0);
  });
});

describe("missing API keys / provider failure (fail closed)", () => {
  test("real-quote mode with a failing fetch returns quote_error, never executes", async () => {
    const d = deps({
      cfg: cfg({ USE_REAL_JUPITER_QUOTES: "true" }),
      fetchImpl: (async () => {
        throw new Error("network down / missing endpoint");
      }) as unknown as typeof fetch,
    });
    const r = await handleUpdate(msg(1, `/quote ${SOL} ${USDC} 1`, ADMIN), d);
    expect(r.code).toBe("quote_error");
  });
});

describe("mainnet execution is impossible", () => {
  test("assertNoMainnet throws for mainnet-beta cluster", () => {
    expect(() => assertNoMainnet(cfg({ SOLANA_CLUSTER: "mainnet-beta" }))).toThrow(/mainnet/i);
  });
  test("broadcast flags never allow when DRY_RUN or non-devnet", () => {
    expect(broadcastFlagsAllow(cfg())).toBe(false); // DRY_RUN true
    expect(broadcastFlagsAllow(cfg({ DRY_RUN: "false", SOLANA_CLUSTER: "mainnet-beta", ALLOW_DEVNET_SEND: "true" }))).toBe(false);
  });
  test("even fully armed, a non-devnet genesis is refused", async () => {
    const armed = cfg({ DRY_RUN: "false", SOLANA_CLUSTER: "devnet", ALLOW_DEVNET_SEND: "true" });
    // Chain claims to be devnet via env, but its genesis is mainnet's -> refuse.
    await expect(assertBroadcastAllowed(armed, fakeConn(MAINNET_GENESIS))).rejects.toThrow(/genesis/i);
  });
  test("simulate path never broadcasts under DRY_RUN, even with a working chain", async () => {
    const d = deps({ conn: fakeConn(DEVNET_GENESIS) });
    const r = await handleUpdate(msg(1, `/simulate ${SOL} ${USDC} 1`, ADMIN), d);
    expect(r.code).toBe("ok");
    expect(r.reply).toMatch(/broadcast=false/);
  });
  test("armed devnet path broadcasts ONLY the harmless no-op, and only on real devnet", async () => {
    const armed = cfg({ DRY_RUN: "false", SOLANA_CLUSTER: "devnet", ALLOW_DEVNET_SEND: "true" });
    const res = await executeOrSimulate(armed, buildSwapPlan({
      inputMint: SOL, outputMint: USDC, inAmount: "1", outAmount: "1", slippageBps: 50, priceImpactPct: 0, source: "mock",
    }), fakeConn(DEVNET_GENESIS));
    expect(res.broadcast).toBe(true);
    expect(res.signature).toBe("FAKE_SIGNATURE");
    expect(res.note).toMatch(/no-op/i);
  });
});

describe("audit trail", () => {
  test("every decision writes an audit row", async () => {
    const store = new LabStore(":memory:");
    const d = deps({ store });
    await handleUpdate(msg(1, "/status", "999999"), d); // unauthorized -> audited
    await handleUpdate(msg(2, `/quote ${SOL} ${USDC} 1`, ADMIN), d); // quote -> audited
    expect(store.auditCount()).toBeGreaterThanOrEqual(2);
  });
});
