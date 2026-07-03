// Multi-wallet × multi-source DEVNET trial runner.
//
//   npx ts-node src/trial.ts
//
// Spins up N devnet wallets, airdrops them, then drives the SAME command handler
// from several Telegram "sources" (chat IDs). Each source deterministically maps
// to its own wallet, so you see multi-wallet + multi-source behaviour end to end:
// auth, rate-limit, replay protection, quotes, and a REAL devnet sign→broadcast.
//
// Devnet only. Genesis-gated. Never mainnet.
//
//   DRY_RUN=true          -> simulate only (default)
//   DRY_RUN=false + ALLOW_DEVNET_SEND=true -> actually broadcast on devnet

import { loadConfig, modeSummary, assertNoMainnet } from "./config";
import { LabStore } from "./state";
import { RateLimiter } from "./rateLimit";
import { handleUpdate, TgUpdate, Deps } from "./bot";
import { DevnetWalletBook } from "./wallets";
import { makeDevnetConnection, makeDevnetExecutor } from "./chain";
import { log } from "./logger";

const SOL = "So11111111111111111111111111111111111111112";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

async function main() {
  const base = loadConfig();
  assertNoMainnet(base);

  // Trial "sources" — several Telegram chat IDs. All are trial admins.
  const sources = ["100001", "100002", "100003"];
  const cfg = { ...base, adminChatIds: new Set([...base.adminChatIds, ...sources]) };

  log.info(`Trial — ${modeSummary(cfg)} · ${cfg.walletCount} wallets · ${sources.length} sources`);

  const conn = makeDevnetConnection(cfg);
  // Fail early + clearly if the RPC isn't actually devnet.
  const { assertGenesisIsDevnet } = await import("./config");
  assertGenesisIsDevnet(await conn.getGenesisHash(), cfg.rpcUrl);

  const wallets = new DevnetWalletBook(cfg, conn);
  wallets.init();
  log.info("wallets:");
  for (const w of wallets.list()) log.info(`  ${w.label} ${w.publicKey}`);

  log.info("requesting devnet airdrops (faucet limits may throttle some)…");
  await wallets.fund(0.5);

  const deps: Deps = {
    cfg,
    store: new LabStore(":memory:"),
    limiter: new RateLimiter(cfg.rateLimitPerMin),
    walletBook: wallets,
    executeReal: makeDevnetExecutor(cfg, conn, wallets),
  };

  let uid = 1;
  const run = async (source: string, text: string) => {
    const u: TgUpdate = { update_id: uid++, message: { chat: { id: source }, from: { id: source }, text } };
    const r = await handleUpdate(u, deps);
    log.info(`[src ${source}] ${text.split(" ")[0]} -> [${r.code}] ${r.reply.split("\n")[0]}`);
    return r;
  };

  for (const s of sources) {
    await run(s, "/wallets");
    await run(s, `/quote ${SOL} ${USDC} 0.1`);
    await run(s, `/simulate ${SOL} ${USDC} 0.1`);
  }

  log.info("balances after trial:");
  for (const w of wallets.list()) log.info(`  ${w.label}: ${(await wallets.balance(w.index)).toFixed(6)} SOL`);
  log.info(`audit rows: ${deps.store.auditCount()}`);
  deps.store.close();
}

main().catch((e) => {
  log.error("trial failed", String((e as Error).message));
  process.exit(1);
});
