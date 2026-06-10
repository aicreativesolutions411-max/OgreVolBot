// Pure formatting / string / URL helpers extracted from src/index.js.
// Everything here is self-contained (no CONFIG, no connection, no module state), so it is
// safe to import anywhere. Keep only pure functions in this file.

export function shortMint(value) {
  const text = String(value);
  return text.length > 12 ? `${text.slice(0, 4)}...${text.slice(-4)}` : text;
}

export function compareBigInt(left, right) {
  if (left > right) return 1;
  if (left < right) return -1;
  return 0;
}

export function formatPnlMultiple(received, spent) {
  if (spent <= 0n) return "--";
  const value = Number(received) / Number(spent);
  if (!Number.isFinite(value)) return "--";
  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return value.toFixed(decimals).replace(/0+$/, "").replace(/\.$/, "");
}

export function sanitizeCardText(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, Math.max(1, maxLength - 1))}` : text;
}

export function formatUsdCompact(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "";
  if (number >= 1_000_000_000) return `$${(number / 1_000_000_000).toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}B`;
  if (number >= 1_000_000) return `$${(number / 1_000_000).toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}M`;
  if (number >= 1_000) return `$${(number / 1_000).toFixed(1).replace(/0+$/, "").replace(/\.$/, "")}K`;
  return `$${Math.round(number).toLocaleString("en-US")}`;
}

export function formatBuyPressure(value) {
  const ratio = Number(value);
  if (!Number.isFinite(ratio)) return "flat";
  if (ratio >= 1.35) return "buyers strong";
  if (ratio >= 1.1) return "buyers";
  if (ratio >= 0.9) return "flat";
  return "sellers";
}

export function formatPercentCompact(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0%";
  return `${number >= 0 ? "+" : ""}${number.toFixed(Math.abs(number) >= 100 ? 0 : 1)}%`;
}

export function formatDexPriceMove(priceChange) {
  const entry = [
    ["24h", priceChange?.h24],
    ["6h", priceChange?.h6],
    ["1h", priceChange?.h1]
  ].find(([, value]) => Number.isFinite(Number(value)));
  if (!entry) return "";
  const [label, value] = entry;
  const number = Number(value);
  return `${label} ${number >= 0 ? "+" : ""}${number.toFixed(2)}%`;
}

export function dexScreenerUrl(tokenMint) {
  return `https://dexscreener.com/solana/${tokenMint}`;
}

export function pumpFunUrl(tokenMint) {
  return `https://pump.fun/coin/${tokenMint}`;
}

export function kolscanAccountUrl(wallet) {
  const address = String(wallet || "").trim();
  return address ? `https://kolscan.io/account/${address}` : "";
}

export function escapeSvg(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function appendLimited(list, item, limit = 20) {
  return [...(Array.isArray(list) ? list : []), item].slice(-limit);
}

export function limitResultLines(lines, limit = 80) {
  const list = Array.isArray(lines) ? lines : [];
  if (list.length <= limit) return list;
  return [
    ...list.slice(0, limit),
    `...${list.length - limit} more result(s) saved in the audit log.`
  ];
}

export function uniqueTokenMintsFromEvents(events) {
  return [...new Set((Array.isArray(events) ? events : [])
    .map((event) => event.tokenMint)
    .filter(Boolean))];
}
