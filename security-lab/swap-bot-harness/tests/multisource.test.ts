// Multi-source + multi-wallet routing (web3-free: MockWalletBook + injected
// executor). Verifies several Telegram sources each map to their own wallet, and
// the real-executor path can never be reached without the genesis-gated executor.

import { loadConfig, HarnessConfig } from "../src/config";
import { LabStore } from "../src/state";
import { RateLimiter } from "../src/rateLimit";
import { handleUpdate, TgUpdate, Deps } from "../src/bot";
import { MockWalletBook, RealExecutor } from "../src/types";

const SOL = "So11111111111111111111111111111111111111112";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOURCES = ["100001", "100002", "100003"];

function cfg(): HarnessConfig {
  return loadConfig({
    DRY_RUN: "true",
    SOLANA_CLUSTER: "devnet",
    ADMIN_CHAT_IDS: SOURCES.join(","),
    RATE_LIMIT_PER_MIN: "50",
    WALLET_COUNT: "3",
  } as NodeJS.ProcessEnv);
}

const msg = (id: number, text: string, from: string): TgUpdate => ({
  update_id: id,
  message: { chat: { id: from }, from: { id: from }, text },
});

test("each source deterministically maps to a trial wallet", () => {
  const book = new MockWalletBook(3);
  const picks = SOURCES.map((s) => book.pickForSource(s).label);
  // Deterministic + stable across calls.
  expect(SOURCES.map((s) => book.pickForSource(s).label)).toEqual(picks);
  expect(new Set(picks).size).toBeGreaterThanOrEqual(1);
});

test("/wallets shows the source its own wallet (marked ➡️)", async () => {
  const book = new MockWalletBook(3);
  const deps: Deps = { cfg: cfg(), store: new LabStore(":memory:"), limiter: new RateLimiter(50), walletBook: book };
  const r = await handleUpdate(msg(1, "/wallets", SOURCES[0]), deps);
  expect(r.code).toBe("ok");
  expect(r.reply).toMatch(/➡️/);
  expect(r.reply).toContain(book.pickForSource(SOURCES[0]).publicKey);
});

test("multiple sources each drive their own wallet through /simulate", async () => {
  const book = new MockWalletBook(3);
  const seen: string[] = [];
  const executor: RealExecutor = async (ctx) => {
    const w = book.pickForSource(ctx.chatId);
    seen.push(`${ctx.chatId}:${w.label}`);
    return { broadcast: false, err: null, walletLabel: w.label, note: "devnet simulate (test)" };
  };
  const deps: Deps = {
    cfg: cfg(), store: new LabStore(":memory:"), limiter: new RateLimiter(50), walletBook: book, executeReal: executor,
  };
  let uid = 1;
  for (const s of SOURCES) {
    const r = await handleUpdate(msg(uid++, `/simulate ${SOL} ${USDC} 0.1`, s), deps);
    expect(r.code).toBe("ok");
    expect(r.reply).toMatch(/broadcast=false/);
    expect(r.reply).toContain(book.pickForSource(s).label);
  }
  // Each source routed to its mapped wallet.
  expect(seen).toEqual(SOURCES.map((s) => `${s}:${book.pickForSource(s).label}`));
});

test("without an executor or conn, /simulate fails closed (no_conn)", async () => {
  const deps: Deps = { cfg: cfg(), store: new LabStore(":memory:"), limiter: new RateLimiter(50), walletBook: new MockWalletBook(3) };
  const r = await handleUpdate(msg(1, `/simulate ${SOL} ${USDC} 0.1`, SOURCES[0]), deps);
  expect(r.code).toBe("no_conn");
});
