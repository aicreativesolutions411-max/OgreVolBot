// Structured logger with aggressive secret redaction. Nothing that looks like a
// key, token, or seed phrase should ever reach stdout / a log sink.

const REDACTIONS: Array<[RegExp, string]> = [
  // Telegram bot token: <digits>:<35+ base64ish chars>
  [/\b\d{6,}:[A-Za-z0-9_-]{30,}\b/g, "<REDACTED_TG_TOKEN>"],
  // Long base58 blobs (private keys / secret keys are 64-88 base58 chars).
  [/\b[1-9A-HJ-NP-Za-km-z]{60,}\b/g, "<REDACTED_BASE58_SECRET>"],
  // Hex secrets (64+ hex chars).
  [/\b[0-9a-fA-F]{64,}\b/g, "<REDACTED_HEX_SECRET>"],
  // API-key-ish query params.
  [/([?&](?:api[_-]?key|key|token|secret)=)[^&\s]+/gi, "$1<REDACTED>"],
];

// A 12-24 word BIP39-style seed phrase — redact the whole run of lowercase words.
const SEED_RE = /\b(?:[a-z]{3,8}\s+){11,23}[a-z]{3,8}\b/g;

export function redact(input: unknown): string {
  let s = typeof input === "string" ? input : safeStringify(input);
  s = s.replace(SEED_RE, "<REDACTED_SEED_PHRASE>");
  for (const [re, rep] of REDACTIONS) s = s.replace(re, rep);
  return s;
}

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

type Level = "info" | "warn" | "error";
function emit(level: Level, msg: string, meta?: unknown): void {
  const line = meta === undefined ? redact(msg) : `${redact(msg)} ${redact(meta)}`;
  // Timestamps are injected by the caller's test clock in tests; here we keep it simple.
  const stream = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  stream(`[${level}] ${line}`);
}

export const log = {
  info: (msg: string, meta?: unknown) => emit("info", msg, meta),
  warn: (msg: string, meta?: unknown) => emit("warn", msg, meta),
  error: (msg: string, meta?: unknown) => emit("error", msg, meta),
  redact,
};
