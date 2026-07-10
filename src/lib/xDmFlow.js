const BUY_MIN_SOL = 0.001;
const BUY_MAX_SOL = 50;
const SELL_PERCENTAGES = new Set([25, 50, 75, 100]);
export const X_DM_TRADE_EVENT_MAX_AGE_MS = 5 * 60_000;

function cleanText(value) {
  return String(value || "").trim();
}

export function validateXDmBuyAmount(value) {
  const amountSol = Number(value);
  return Number.isFinite(amountSol) && amountSol >= BUY_MIN_SOL && amountSol <= BUY_MAX_SOL
    ? amountSol
    : null;
}

function timestampNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return 0;
  if (number < 100_000_000_000) return Math.round(number * 1000); // epoch seconds
  if (number > 10_000_000_000_000) return Math.round(number / 1000); // epoch microseconds
  return Math.round(number); // epoch milliseconds
}

export function xDmEventTimestampMs(event) {
  const raw = String(event?.createdAt || "").trim();
  if (raw) {
    const numeric = timestampNumber(raw);
    if (numeric) return numeric;
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  // Official X event ids are Snowflakes, so they still provide a trustworthy
  // event time when created_at was omitted from an API response.
  try {
    const id = BigInt(String(event?.id || ""));
    const epoch = Number((id >> 22n) + 1288834974657n);
    return Number.isFinite(epoch) && epoch > 0 ? epoch : 0;
  } catch {
    return 0;
  }
}

export function isStaleXDmMoneyEvent(event, text, options = {}) {
  if (!/\b(?:buy|ape|sell)\b|^(?:yes|y|confirm|no|n|cancel|stop)(?:\s|$)/i.test(cleanText(text))) return false;
  const eventAt = xDmEventTimestampMs(event);
  if (!eventAt) return false;
  const now = Number(options.now) || Date.now();
  const maxAgeMs = Math.max(60_000, Number(options.maxAgeMs) || X_DM_TRADE_EVENT_MAX_AGE_MS);
  return eventAt < now - maxAgeMs || eventAt > now + 60_000;
}

/**
 * Canonical X DM slot grammar: `buy <slot> [amount]`.
 *
 * Slot always comes first. Keeping that order explicit prevents integer amounts
 * from being mistaken for a different coin slot (for example `buy 5 1`).
 */
export function parseXDmBuySlotCommand(value) {
  const match = cleanText(value).match(/^(?:buy|ape)\s+([1-6])(?:\s+([0-9]*\.?[0-9]+)\s*(?:sol)?)?$/i);
  if (!match) return null;
  const slot = Number(match[1]);
  if (!match[2]) return { slot, amountSol: null };
  const amountSol = validateXDmBuyAmount(match[2]);
  if (amountSol === null) {
    return { slot, amountSol: null, error: `Buy amount must be ${BUY_MIN_SOL}-${BUY_MAX_SOL} SOL.` };
  }
  return { slot, amountSol };
}

/** Canonical X DM sell grammar: `sell <slot> <25|50|75|100>`.
 */
export function parseXDmSellSlotCommand(value) {
  const match = cleanText(value).match(/^sell\s+([1-6])\s+(25|50|75|100)%?$/i);
  if (!match) return null;
  const slot = Number(match[1]);
  const percent = Number(match[2]);
  if (!SELL_PERCENTAGES.has(percent)) return null;
  return { slot, percent };
}

export const X_DM_BUY_LIMITS = Object.freeze({ minSol: BUY_MIN_SOL, maxSol: BUY_MAX_SOL });
export const X_DM_SELL_PERCENTAGES = Object.freeze([...SELL_PERCENTAGES]);
