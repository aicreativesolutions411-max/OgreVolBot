// Input validation for every untrusted value that enters from Telegram.
// Fail closed: anything that doesn't parse cleanly is rejected with a reason.

import bs58 from "bs58";

export interface Valid<T> {
  ok: true;
  value: T;
}
export interface Invalid {
  ok: false;
  reason: string;
}
export type Result<T> = Valid<T> | Invalid;

const ok = <T>(value: T): Valid<T> => ({ ok: true, value });
const bad = (reason: string): Invalid => ({ ok: false, reason });

// Match ASCII control chars (0x00-0x1F and 0x7F) without embedding literal
// control bytes in source: build the class from char codes at module load.
const CONTROL_RE = new RegExp(`[${"\\x00-\\x1f\\x7f"}]`);

// A Solana mint is a base58 ed25519 public key. We validate it *decodes* to 32
// bytes (format-only). We do NOT claim anything about whether the token is safe.
export function validateMint(raw: unknown): Result<string> {
  const s = String(raw ?? "").trim();
  if (!s) return bad("empty mint");
  if (s.length < 32 || s.length > 44) return bad("mint length out of range (32-44 base58)");
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(s)) return bad("mint has non-base58 characters");
  try {
    const bytes = bs58.decode(s);
    if (bytes.length !== 32) return bad("mint does not decode to 32 bytes");
    return ok(s);
  } catch {
    return bad("mint is not valid base58");
  }
}

// Amount: a positive, finite decimal within a hard ceiling. Rejects NaN,
// Infinity, negatives, scientific-notation abuse, and absurd precision.
export function validateAmount(raw: unknown, maxUi: number): Result<number> {
  const s = String(raw ?? "").trim();
  if (!/^\d{1,12}(\.\d{1,9})?$/.test(s)) return bad("amount must be a plain positive decimal");
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return bad("amount must be > 0");
  if (n > maxUi) return bad(`amount exceeds lab ceiling (${maxUi})`);
  return ok(n);
}

// Slippage in basis points: integer, 0..ceiling. Excessive slippage is the #1
// way a swap bot gets drained by MEV, so we cap it hard.
export function validateSlippageBps(raw: unknown, maxBps: number): Result<number> {
  const s = String(raw ?? "").trim();
  if (!/^\d{1,5}$/.test(s)) return bad("slippage must be an integer (bps)");
  const n = Number.parseInt(s, 10);
  if (n < 0) return bad("slippage cannot be negative");
  if (n > maxBps) return bad(`slippage ${n}bps exceeds ceiling ${maxBps}bps`);
  return ok(n);
}

export type ParsedCommand =
  | { name: "quote" | "simulate"; inMint: string; outMint: string; amount: string; slippage?: string }
  | { name: "status" | "help" | "wallets" };

const KNOWN = new Set(["/quote", "/simulate", "/status", "/help", "/wallets"]);

// Whitelist parser. Unknown commands are rejected (never "best-effort" matched).
// Rejects control chars and over-long payloads before doing anything else.
export function parseCommand(raw: unknown): Result<ParsedCommand> {
  const text = String(raw ?? "");
  if (text.length > 400) return bad("command too long");
  if (CONTROL_RE.test(text)) return bad("command contains control characters");
  const parts = text.trim().split(/\s+/);
  const head = (parts[0] || "").toLowerCase().replace(/@[a-z0-9_]+$/i, ""); // strip /cmd@BotName
  if (!KNOWN.has(head)) return bad("unknown command");
  if (head === "/status") return ok({ name: "status" });
  if (head === "/help") return ok({ name: "help" });
  if (head === "/wallets") return ok({ name: "wallets" });
  // /quote|/simulate <inMint> <outMint> <amount> [slippageBps]
  if (parts.length < 4) return bad(`usage: ${head} <inMint> <outMint> <amount> [slippageBps]`);
  return ok({
    name: head === "/quote" ? "quote" : "simulate",
    inMint: parts[1],
    outMint: parts[2],
    amount: parts[3],
    slippage: parts[4],
  });
}
