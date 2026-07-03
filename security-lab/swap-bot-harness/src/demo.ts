// Offline demo: drives a few mock Telegram updates through the handler and
// prints the results. No live Telegram, no mainnet, mock quotes by default.
//
//   npx ts-node src/demo.ts
//
// To include yourself as admin: ADMIN_CHAT_IDS=123456 npx ts-node src/demo.ts

import { loadConfig, modeSummary } from "./config";
import { LabStore } from "./state";
import { RateLimiter } from "./rateLimit";
import { handleUpdate, TgUpdate } from "./bot";
import { log } from "./logger";

async function main() {
  const cfg = loadConfig();
  log.info(`Booting lab harness — ${modeSummary(cfg)}`);
  if (cfg.adminChatIds.size === 0) {
    log.warn("ADMIN_CHAT_IDS is empty — every command will be DENIED (deny-by-default). Set it to try commands.");
  }

  const store = new LabStore(":memory:"); // demo uses in-memory; set DB_PATH for a file
  const limiter = new RateLimiter(cfg.rateLimitPerMin);
  const admin = [...cfg.adminChatIds][0] ?? "0"; // if empty, these will be denied (that's the point)

  // Well-known mints (used only as valid base58 inputs for the mock quoter).
  const SOL = "So11111111111111111111111111111111111111112";
  const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

  const updates: TgUpdate[] = [
    { update_id: 1, message: { chat: { id: admin }, from: { id: admin }, text: "/status" } },
    { update_id: 2, message: { chat: { id: admin }, from: { id: admin }, text: `/quote ${SOL} ${USDC} 0.25` } },
    { update_id: 3, message: { chat: { id: admin }, from: { id: admin }, text: `/quote ${SOL} ${USDC} 999999` } }, // over ceiling
    { update_id: 4, message: { chat: { id: admin }, from: { id: admin }, text: `/quote ${SOL} ${USDC} 1 100000` } }, // slippage over ceiling
    { update_id: 5, message: { chat: { id: "999" }, from: { id: "999" }, text: "/status" } }, // not admin
    { update_id: 2, message: { chat: { id: admin }, from: { id: admin }, text: `/quote ${SOL} ${USDC} 0.25` } }, // replay of update_id 2
  ];

  for (const u of updates) {
    const r = await handleUpdate(u, { cfg, store, limiter });
    log.info(`update ${u.update_id} -> [${r.code}] ${r.reply.replace(/\n/g, " | ")}`);
  }
  log.info(`audit rows: ${store.auditCount()}`);
  store.close();
}

main().catch((e) => {
  log.error("demo failed", String(e));
  process.exit(1);
});
