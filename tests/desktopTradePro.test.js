import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const gg = read("../web/public/gg.html");
const index = read("../web/public/index.html");
const pro = read("../web/public/terminal-pro.js");
const css = read("../web/public/terminal-pro.css");
const chart = read("../web/public/chart-lab.html");
const server = read("../src/index.js");

test("desktop terminal mirrors ship the same market and trade workspace", () => {
  assert.equal(index, gg);
  assert.match(gg, /terminal-pro\.css/);
  assert.match(gg, /terminal-pro\.js/);
});

test("desktop market can view both chains together or independently", () => {
  assert.match(gg, /\[\["all","All"\],\["solana","Solana"\],\["robinhood","Robinhood"\]\]/);
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
