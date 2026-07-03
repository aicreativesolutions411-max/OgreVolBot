// Telegram command handler in TEST MODE. There is no live Telegram connection
// here on purpose: callers (tests, the demo REPL) drive it with mock updates via
// handleUpdate(). Wiring a real getUpdates/webhook loop is an env-gated exercise
// left to an authorized deployment — see the hardening checklist in README.md.

import { HarnessConfig, modeSummary } from "./config";
import { LabStore } from "./state";
import { RateLimiter } from "./rateLimit";
import { getQuote, buildSwapPlan, Quote } from "./jupiter";
import { ChainConn, executeOrSimulate } from "./solana";
import { parseCommand, validateAmount, validateMint, validateSlippageBps } from "./validation";
import { log } from "./logger";

export interface TgUpdate {
  update_id: number;
  message?: {
    chat?: { id: number | string };
    from?: { id: number | string; is_bot?: boolean };
    text?: string;
  };
}

export interface Deps {
  cfg: HarnessConfig;
  store: LabStore;
  limiter: RateLimiter;
  conn?: ChainConn; // required for /simulate; omitted keeps the harness offline
  fetchImpl?: typeof fetch;
}

export interface HandleResult {
  code:
    | "ignored"
    | "unauthorized"
    | "rate_limited"
    | "replay"
    | "bad_command"
    | "invalid_args"
    | "quote_error"
    | "no_conn"
    | "ok";
  reply: string;
}

const HELP =
  "Lab swap-bot (test mode). Commands:\n" +
  "/quote <inMint> <outMint> <amount> [slippageBps] — read-only quote\n" +
  "/simulate <inMint> <outMint> <amount> [slippageBps] — quote + simulate (no broadcast)\n" +
  "/status — show safety posture\n/help — this message";

function fmtQuote(q: Quote): string {
  return (
    `✅ Quote (${q.source})\n` +
    `in  ${q.inputMint}\nout ${q.outputMint}\n` +
    `inAmount ${q.inAmount} → outAmount ${q.outAmount}\n` +
    `slippage ${q.slippageBps}bps · priceImpact ${q.priceImpactPct}%`
  );
}

export async function handleUpdate(
  update: TgUpdate,
  deps: Deps,
  now: number = Date.now()
): Promise<HandleResult> {
  const { cfg, store, limiter } = deps;
  const msg = update?.message;
  const chatRaw = msg?.chat?.id;
  if (!msg || chatRaw === undefined || chatRaw === null) return { code: "ignored", reply: "" };

  const chatId = String(chatRaw);
  const fromId = String(msg.from?.id ?? chatRaw);
  const text = String(msg.text ?? "");

  // 1) Admin allowlist — DENY BY DEFAULT. Empty allowlist = nobody is admin.
  if (!(cfg.adminChatIds.has(chatId) || cfg.adminChatIds.has(fromId))) {
    store.audit(chatId, "deny_unauthorized", log.redact(text).slice(0, 120), now);
    return { code: "unauthorized", reply: "⛔ Not authorized." };
  }

  // 2) Rate limit (per chat) — flood / RPC-quota protection.
  if (!limiter.allow(chatId, now)) {
    store.audit(chatId, "rate_limited", "", now);
    return { code: "rate_limited", reply: "⏳ Slow down." };
  }

  // 3) Replay / duplicate / concurrent protection — atomic claim on update_id.
  if (!store.claimOnce(`upd:${update.update_id}`, now)) {
    store.audit(chatId, "replay_blocked", `update_id=${update.update_id}`, now);
    return { code: "replay", reply: "" };
  }

  // 4) Whitelist parse.
  const parsed = parseCommand(text);
  if (!parsed.ok) {
    store.audit(chatId, "bad_command", parsed.reason, now);
    return { code: "bad_command", reply: `⚠️ ${parsed.reason}` };
  }
  const cmd = parsed.value;

  if (cmd.name === "status") return { code: "ok", reply: modeSummary(cfg) };
  if (cmd.name === "help") return { code: "ok", reply: HELP };
  // Narrow to the swap-arg variant (also a belt-and-suspenders unknown-command guard).
  if (cmd.name !== "quote" && cmd.name !== "simulate") {
    return { code: "bad_command", reply: "⚠️ unknown command" };
  }

  // 5) Validate every argument (fail closed).
  const inMint = validateMint(cmd.inMint);
  if (!inMint.ok) return { code: "invalid_args", reply: `⚠️ inMint: ${inMint.reason}` };
  const outMint = validateMint(cmd.outMint);
  if (!outMint.ok) return { code: "invalid_args", reply: `⚠️ outMint: ${outMint.reason}` };
  if (inMint.value === outMint.value) return { code: "invalid_args", reply: "⚠️ in and out mint are the same" };
  const amount = validateAmount(cmd.amount, cfg.maxAmountUi);
  if (!amount.ok) return { code: "invalid_args", reply: `⚠️ amount: ${amount.reason}` };
  const defaultSlip = Math.min(50, cfg.maxSlippageBps);
  const slip = validateSlippageBps(cmd.slippage ?? String(defaultSlip), cfg.maxSlippageBps);
  if (!slip.ok) return { code: "invalid_args", reply: `⚠️ slippage: ${slip.reason}` };

  // 6) Quote (mock by default; optional read-only real quote). Fail closed.
  let quote: Quote;
  try {
    quote = await getQuote(
      cfg,
      { inputMint: inMint.value, outputMint: outMint.value, uiAmount: amount.value, slippageBps: slip.value },
      deps.fetchImpl
    );
  } catch (e) {
    store.audit(chatId, "quote_error", log.redact(String((e as Error).message)), now);
    return { code: "quote_error", reply: "⚠️ Quote failed (fail-closed)." };
  }

  if (cmd.name === "quote") {
    store.audit(chatId, "quote", `${inMint.value}->${outMint.value} ${amount.value}`, now);
    return { code: "ok", reply: fmtQuote(quote) };
  }

  // /simulate — needs a chain connection; never broadcasts unless the armed
  // devnet gates + genesis check pass (see solana.ts).
  if (!deps.conn) {
    store.audit(chatId, "no_conn", "", now);
    return { code: "no_conn", reply: "⚠️ Simulation needs an RPC connection (not configured)." };
  }
  try {
    const result = await executeOrSimulate(cfg, buildSwapPlan(quote), deps.conn);
    store.audit(chatId, result.broadcast ? "simulate+devnet-send" : "simulate", `${inMint.value}->${outMint.value}`, now);
    return {
      code: "ok",
      reply:
        `${fmtQuote(quote)}\n\n🧪 ${result.note}\n` +
        `simErr=${JSON.stringify(result.err)} broadcast=${result.broadcast}` +
        (result.signature ? ` sig=${result.signature}` : ""),
    };
  } catch (e) {
    store.audit(chatId, "simulate_error", log.redact(String((e as Error).message)), now);
    return { code: "quote_error", reply: `⚠️ ${(e as Error).message}` };
  }
}
