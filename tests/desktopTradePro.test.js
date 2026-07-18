import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const gg = read("../web/public/gg.html");
const index = read("../web/public/index.html");
const pro = read("../web/public/terminal-pro.js");
const css = read("../web/public/terminal-pro.css");
const chart = read("../web/public/chart-lab.html");
const indicators = read("../web/public/fun-indicators.js");
const noxa = read("../src/lib/noxaLaunchpad.js");
const server = read("../src/index.js");

test("desktop terminal mirrors ship the same market and trade workspace", () => {
  assert.equal(index, gg);
  assert.match(gg, /terminal-pro\.css/);
  assert.match(gg, /terminal-pro\.js/);
});

test("desktop market can view both chains together or independently", () => {
  assert.match(gg, /\[\["all","Both"\],\["solana","Solana"\],\["robinhood","Robinhood"\]\]/);
  assert.match(gg, /aria-label="Choose coin feed"/);
  assert.match(gg, /GG\.setMarketChain/);
  assert.match(gg, /api\("\/api\/web\/rh\/pairs\?category="\+rhCategory\)/);
  assert.match(gg, /state\.marketChain==="all"/);
  assert.match(gg, /GG\.rhQuick/);
});

test("professional chart controls expose every requested candle interval", () => {
  for (const timeframe of ["1s", "15s", "30s", "1m", "15m", "1h", "4h", "12h", "1d"]) {
    assert.match(pro, new RegExp(`\\[\\"${timeframe}\\",`));
    assert.match(chart, new RegExp(`'${timeframe}':`));
    assert.match(server, new RegExp(`\\"${timeframe}\\"`));
  }
  assert.match(pro, /requestFullscreen/);
  assert.match(css, /\.trade\.proFullscreen/);
  assert.match(css, /\.trade\.proWide/);
});

test("compact quick panel reuses the existing guarded execution buttons", () => {
  assert.match(pro, /#rhTmBuy/);
  assert.match(pro, /#bigbuy/);
  assert.match(pro, /data-pro-profile/);
  assert.match(pro, /data-pro-tool="orders"/);
  assert.match(pro, /data-pro-tool="exits"/);
  assert.match(pro, /data-pro-tool="bundle"/);
  assert.match(pro, /data-pro-tool="volume"/);
  assert.match(pro, /Server-side exits/);
  assert.match(pro, /\["0\.1", "0\.5", "1", "2"\]/);
});

test("Solana charts never use a token address as a DexScreener pool", () => {
  assert.match(gg, /function solChartUrl/);
  assert.match(gg, /\/chart-lab\?ca=/);
  assert.match(gg, /resolvedPool=String\(best\.pairAddress/);
  assert.match(gg, /cw\.dataset\.proStandardSrc=solChartUrl/);
  assert.doesNotMatch(gg, /dexscreener\.com\/solana\/"\+encodeURIComponent\(mint\)\+"\?embed=1/);
});

test("coin chart headers hydrate artwork and published socials on both chains", () => {
  assert.match(gg, /function mergeTradeIdentity/);
  assert.match(gg, /\/api\/web\/token-search\?q=/);
  assert.match(gg, /put\("twitterUrl",meta\.twitterUrl\|\|meta\.x\)/);
  assert.match(gg, /\/api\/web\/rh\/token\?address=/);
  assert.match(gg, /function rhTradeLinksHtml/);
  assert.match(gg, /soc\.innerHTML=rhTradeLinksHtml\(r,address\)/);
  assert.match(server, /websiteUrl: chart\?\.websiteUrl/);
  assert.match(server, /twitterUrl: chart\?\.twitterUrl/);
  assert.match(server, /telegramUrl: chart\?\.telegramUrl/);
});

test("desktop market-cap orders use the existing server-side engine", () => {
  assert.match(pro, /\/api\/web\/market-orders/);
  assert.match(pro, /\/api\/web\/profile\/automation/);
  assert.match(pro, /Market-cap orders/);
  assert.match(pro, /Targets above or below the current market cap/);
  assert.match(server, /pathname === "\/api\/web\/market-orders"/);
});

test("sub-minute native charts aggregate real recent trades instead of fabricating bars", () => {
  assert.match(chart, /candlesFromApiTrades/);
  assert.match(chart, /tfSec\(\)<60\?candlesFromApiTrades\(d\.trades\)/);
  assert.match(server, /webChartTimeframes = \["1s", "15s", "30s"/);
});

test("desktop charts preserve the full indicator workspace", () => {
  assert.match(gg, /fun-indicators\.js/);
  assert.match(pro, /data-indicators-toggle/);
  for (const kind of ["fib", "rsi", "macd", "harmonics"]) {
    assert.match(pro, new RegExp(`data-indicator-kind=\\"${kind}\\"`));
  }
  for (const pattern of ["bat", "gartley", "shark", "butterfly", "crab", "five0"]) {
    assert.match(indicators, new RegExp(`\\b${pattern}\\b`));
  }
  assert.match(indicators, /#\(\?:coin\|trade\|rhtrade\)/);
  assert.match(indicators, /syncIndicatorProvider/);
  assert.match(css, /\.tradeMain\.indicator-analysis-open/);
});

test("Robinhood chart and transactions fall back to exact on-chain pool swaps", () => {
  assert.match(noxa, /export async function fetchPoolSwaps/);
  assert.match(noxa, /SWAP_TOPIC_V3, SWAP_TOPIC_V2/);
  assert.match(noxa, /historySecondsPerBlock/);
  assert.match(server, /rhCandlesFromSwaps/);
  assert.match(server, /source = "robinhood rpc swaps"/);
  assert.match(server, /pathname === "\/api\/web\/token-trades"/);
  assert.match(gg, /token-trades\?pool=.*&ca=/);
});

test("Telegram Slime Chart links land on the exact Fun coin route", () => {
  assert.match(server, /function slimewireCoinRouteUrl/);
  assert.match(server, /route = normalizeRobinhoodTokenAddress\(mint\) \? "rhtrade" : "trade"/);
  assert.match(server, /\/fun\?\$\{params\.toString\(\)\}#\$\{route\}/);
  assert.doesNotMatch(server, /site: `\$\{siteBase\}\/terminal\/chart\?token=/);
});
