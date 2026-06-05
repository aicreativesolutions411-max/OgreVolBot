import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TokenMetadataResolver, uriGatewayCandidates } from "../src/lib/tokenMetadataResolver.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.resolve(process.env.DATA_DIR || path.join(rootDir, "data"));

function argValue(name) {
  const prefix = `${name}=`;
  const direct = process.argv.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

async function readJsonIfExists(fileName, fallback) {
  try {
    const raw = await fs.readFile(path.join(dataDir, fileName), "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

function firstString(...values) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

function short(value = "") {
  const text = String(value || "");
  return text.length <= 12 ? text : `${text.slice(0, 4)}...${text.slice(-4)}`;
}

function lamportsToSolString(value) {
  const lamports = BigInt(value || 0);
  const sign = lamports < 0n ? "-" : "";
  const abs = lamports < 0n ? -lamports : lamports;
  const whole = abs / 1_000_000_000n;
  const fraction = (abs % 1_000_000_000n).toString().padStart(9, "0").replace(/0+$/, "");
  return `${sign}${whole}${fraction ? `.${fraction}` : ""}`;
}

function groupPnlRows(trades) {
  const rows = new Map();
  for (const trade of trades) {
    if (!trade.tokenMint) continue;
    const row = rows.get(trade.tokenMint) || {
      tokenMint: trade.tokenMint,
      pairAddress: trade.pairAddress || "",
      buys: 0,
      sells: 0,
      spent: 0n,
      received: 0n,
      lastTradeAt: ""
    };
    if (trade.type === "buy") {
      row.buys += 1;
      row.spent += BigInt(trade.solLamportsSpent || 0);
    } else if (trade.type === "sell") {
      row.sells += 1;
      row.received += BigInt(trade.solLamportsReceived || 0);
    }
    if (!row.lastTradeAt || Date.parse(trade.timestamp || "") > Date.parse(row.lastTradeAt || "")) {
      row.lastTradeAt = trade.timestamp || row.lastTradeAt;
    }
    rows.set(trade.tokenMint, row);
  }
  return [...rows.values()].sort((a, b) => Date.parse(b.lastTradeAt || "") - Date.parse(a.lastTradeAt || ""));
}

function metadataFromDexPair(tokenMint, pair = {}) {
  const token = pair?.baseToken?.address === tokenMint ? pair.baseToken : pair?.quoteToken || pair?.baseToken || {};
  return {
    symbol: token.symbol || "",
    name: token.name || "",
    imageUrl: firstString(pair?.info?.imageUrl, pair?.info?.image, pair?.info?.logo, pair?.imageUrl, token.imageUrl, token.image, token.logoURI, token.logo),
    pairAddress: firstString(pair?.pairAddress, pair?.address),
    marketCap: Number(pair?.marketCap || pair?.fdv || 0) || null,
    liquidityUsd: Number(pair?.liquidity?.usd || 0) || null,
    source: "dex"
  };
}

async function getDexMetadata(tokenMint) {
  const url = `https://api.dexscreener.com/tokens/v1/solana/${encodeURIComponent(tokenMint)}`;
  const response = await fetch(url, {
    headers: { "Accept": "application/json", "User-Agent": "slimewire-debug-pnl" },
    signal: AbortSignal.timeout ? AbortSignal.timeout(3_500) : undefined
  });
  if (!response.ok) return {};
  const pairs = await response.json();
  const best = (Array.isArray(pairs) ? pairs : [])
    .filter((pair) => pair?.baseToken?.address === tokenMint || pair?.quoteToken?.address === tokenMint)
    .sort((a, b) => Number(b?.liquidity?.usd || 0) - Number(a?.liquidity?.usd || 0))[0];
  return metadataFromDexPair(tokenMint, best);
}

async function getPumpMetadata(tokenMint) {
  const base = String(process.env.PUMP_FUN_API_BASE || "https://frontend-api.pump.fun").replace(/\/$/, "");
  const response = await fetch(`${base}/coins/${encodeURIComponent(tokenMint)}?sync=false`, {
    headers: { "Accept": "application/json", "User-Agent": "slimewire-debug-pnl" },
    signal: AbortSignal.timeout ? AbortSignal.timeout(2_500) : undefined
  });
  if (!response.ok) return {};
  const coin = await response.json();
  const data = coin?.data || coin || {};
  return {
    symbol: data.symbol || "",
    name: data.name || "",
    imageUri: data.image_uri || data.image || data.metadata?.image || "",
    metadataUri: data.metadata_uri || data.metadataUri || data.uri || data.metadata?.uri || "",
    source: "pumpfun"
  };
}

function launchMetadataForMint(attempts, trades, tokenMint) {
  const attempt = (attempts || [])
    .filter((row) => String(firstString(row.mintPublicKey, row.tokenMint, row.mint, row.requestBody?.mint)) === tokenMint)
    .sort((a, b) => Date.parse(b.completedAt || b.updatedAt || b.createdAt || "") - Date.parse(a.completedAt || a.updatedAt || a.createdAt || ""))[0];
  if (attempt) {
    return {
      source: "pumpfun",
      tokenName: firstString(attempt.tokenName, attempt.name, attempt.metadataJson?.name, attempt.requestBody?.tokenMetadata?.name),
      symbol: firstString(attempt.symbol, attempt.metadataJson?.symbol, attempt.requestBody?.tokenMetadata?.symbol),
      imageUri: firstString(attempt.imageUri, attempt.metadataJson?.image, attempt.metadataValidation?.imageUri),
      metadataUri: firstString(attempt.metadataUri, attempt.requestBody?.tokenMetadata?.uri),
      metadataJson: attempt.metadataJson || null,
      completedAt: firstString(attempt.completedAt, attempt.updatedAt, attempt.createdAt)
    };
  }
  const launchTrade = (trades || []).find((trade) => trade.tokenMint === tokenMint && /pump|launch/i.test(String(trade.source || trade.type || "")));
  return launchTrade ? {
    source: "pumpfun",
    tokenName: firstString(launchTrade.tokenName, launchTrade.name),
    symbol: firstString(launchTrade.symbol, launchTrade.ticker),
    imageUri: firstString(launchTrade.imageUri, launchTrade.imageUrl),
    metadataUri: firstString(launchTrade.metadataUri),
    completedAt: launchTrade.timestamp || ""
  } : {};
}

async function fetchMetadataJson(uri) {
  for (const candidate of uriGatewayCandidates(uri)) {
    try {
      const response = await fetch(candidate, {
        headers: { "Accept": "application/json,text/plain,*/*", "User-Agent": "slimewire-debug-pnl" },
        signal: AbortSignal.timeout ? AbortSignal.timeout(2_500) : undefined
      });
      const text = await response.text();
      if (!response.ok) continue;
      return {
        json: JSON.parse(text),
        uri: candidate,
        status: response.status,
        contentType: response.headers.get("content-type") || ""
      };
    } catch {
      // Try the next gateway.
    }
  }
  return null;
}

async function verifyImageUri(uri) {
  for (const candidate of uriGatewayCandidates(uri)) {
    try {
      const response = await fetch(candidate, {
        headers: { "Accept": "image/*,*/*", "User-Agent": "slimewire-debug-pnl" },
        signal: AbortSignal.timeout ? AbortSignal.timeout(2_500) : undefined
      });
      const contentType = response.headers.get("content-type") || "";
      if (response.ok && (/^image\//i.test(contentType) || !contentType)) {
        await response.arrayBuffer().catch(() => null);
        return { ok: true, status: response.status, uri: candidate, contentType };
      }
    } catch {
      // Try the next gateway.
    }
  }
  return { ok: false, status: null, uri };
}

const walletFilter = String(argValue("--wallet") || argValue("--user") || "").trim();
const tradeStore = await readJsonIfExists("trade-history.json", { trades: [] });
const attemptStore = await readJsonIfExists("pump-launch-attempts.json", { attempts: [] });
const trades = (tradeStore.trades || []).filter((trade) => !walletFilter
  || String(trade.userId || "") === walletFilter
  || String(trade.walletPublicKey || "") === walletFilter);
const pnlRows = groupPnlRows(trades);
const resolver = new TokenMetadataResolver({
  getSlimeWireMetadata: ({ mint }) => launchMetadataForMint(attemptStore.attempts || [], tradeStore.trades || [], mint),
  getDexMetadata,
  getPumpMetadata,
  fetchMetadataJson,
  verifyImageUri,
  log: () => {}
});

console.log("PNL DEBUG");
console.log(`filter=${walletFilter || "(all users/wallets)"}`);
console.log(`tradeCount=${trades.length}`);
console.log(`pnlTokenCount=${pnlRows.length}`);
for (const row of pnlRows.slice(0, 50)) {
  const metadata = await resolver.resolveTokenMetadata({ mint: row.tokenMint }, {
    timeoutMs: 2_500,
    metadataRetries: 1,
    imageRetries: 1
  });
  const realized = row.received - row.spent;
  console.log([
    `tokenAddress=${row.tokenMint}`,
    `mint=${row.tokenMint}`,
    `pairAddress=${metadata.pairAddress || row.pairAddress || ""}`,
    `metadataSourceUsed=${metadata.metadataSourceUsed || metadata.source || "placeholder"}`,
    `dexImagePresent=${Boolean(metadata.dexImagePresent)}`,
    `pumpMetadataPresent=${Boolean(metadata.pumpMetadataPresent)}`,
    `metadataUri=${metadata.metadataUri || ""}`,
    `imageUri=${metadata.imageUri || metadata.imageUrl || ""}`,
    `imageFetchStatus=${metadata.imageFetchStatus || ""}`,
    `metadataMissing=${Boolean(metadata.metadataMissing)}`,
    `symbol=${metadata.symbol || short(row.tokenMint)}`,
    `name=${metadata.name || ""}`,
    `realizedSol=${lamportsToSolString(realized)}`,
    `warnings=${(metadata.warnings || []).slice(0, 3).join("; ")}`
  ].join(" "));
}
