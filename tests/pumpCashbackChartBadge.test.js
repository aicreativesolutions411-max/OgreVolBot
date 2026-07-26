import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const pro = fs.readFileSync(new URL("../web/public/terminal-pro.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../web/public/terminal-pro.css", import.meta.url), "utf8");
const chart = fs.readFileSync(new URL("../web/public/chart-lab.html", import.meta.url), "utf8");
const desktop = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const desktopAlias = fs.readFileSync(new URL("../web/public/gg.html", import.meta.url), "utf8");

function functionBody(source, name) {
  const marker = `function ${name}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${name} missing`);
  const next = source.indexOf("\n  function ", start + marker.length);
  return source.slice(start, next === -1 ? undefined : next);
}

test("professional chart chrome marks Pump Cash back coins without replacing chart controls", () => {
  const toolbar = functionBody(pro, "toolbarHtml");
  assert.match(toolbar, /data-pro-pump-cashback hidden/);
  assert.match(toolbar, /Pump Cash back/);
  for (const control of ["data-pro-slime-mode", "data-indicators-toggle", "data-pro-quick-toggle", "data-pro-wide", "data-pro-full"]) {
    assert.match(toolbar, new RegExp(control));
  }
  assert.match(css, /\.proCashbackBadge\[hidden\]\{display:none\}/);
  assert.match(css, /@media\(max-width:820px\)[\s\S]*\.proCashbackBadge small\{display:none\}/);
});

test("professional chart reads cashback truth from bootstrap and labels rewards wallet-wide", () => {
  const refresh = functionBody(pro, "refreshPumpCashbackContext");
  assert.match(refresh, /\/api\/web\/chart\/bootstrap\?token=/);
  assert.match(refresh, /chart\.pumpCashback === true/);
  assert.match(refresh, /\/api\/web\/pump\/rewards\?walletIndex=/);
  assert.match(refresh, /!enabled \|\| !hasSession/);
  assert.match(refresh, /proCashbackWallet/);
  assert.match(refresh, /pumpCashbackContextFresh/);
  assert.match(refresh, /schedulePumpCashbackRefresh/);
  assert.match(refresh, /delete trade\.dataset\.proCashbackCheckedAt/);
  assert.match(refresh, /pumpCashbackRequest/);
  assert.match(refresh, /!rewards\.ok[\s\S]*schedulePumpCashbackRefresh/);
  assert.match(functionBody(pro, "pumpCashbackSolFromRewards"), /selected\?\.cashback/);
  assert.match(functionBody(pro, "paintPumpCashbackBadge"), /across Pump Cash back trades/);
  assert.match(functionBody(pro, "paintPumpCashbackBadge"), /not earned only from this coin/);
});

test("professional Cash back checks expire, retry failures, and publish a fresh asset URL", () => {
  const freshnessSource = functionBody(pro, "pumpCashbackContextFresh");
  const isFresh = Function(`return (${freshnessSource})`)();
  assert.equal(isFresh(1_000, 8_000, 8_999), true);
  assert.equal(isFresh(1_000, 8_000, 9_000), false);
  assert.equal(isFresh(0, 8_000, 1_000), false);
  assert.equal(isFresh(2_000, 8_000, 1_999), false, "clock rollback must not pin a stale result");
  assert.match(functionBody(pro, "schedulePumpCashbackRefresh"), /refreshPumpCashbackContext/);
  assert.match(functionBody(pro, "pumpCashbackRequest"), /AbortController/);

  const jsVersion = desktop.match(/terminal-pro\.js\?v=([A-Za-z0-9_-]+)/)?.[1];
  const cssVersion = desktop.match(/terminal-pro\.css\?v=([A-Za-z0-9_-]+)/)?.[1];
  assert.ok(jsVersion && cssVersion);
  assert.equal(jsVersion, cssVersion);
  assert.notEqual(jsVersion, "20260719a", "changed professional assets need a new browser-cache URL");
  assert.match(desktopAlias, new RegExp(`terminal-pro\\.js\\?v=${jsVersion}`));
  assert.match(desktopAlias, new RegExp(`terminal-pro\\.css\\?v=${cssVersion}`));
  assert.equal(desktop, desktopAlias, "desktop mirrors must stay byte-identical");
});

test("native Slime chart shows the same compact cashback badge from chart bootstrap", () => {
  assert.match(chart, /id="pumpCashbackBadge" hidden>Pump Cash back/);
  assert.match(chart, /\.cashbackBadge\[hidden\]\{display:none\}/);
  const bootstrap = functionBody(chart, "loadBootstrap");
  assert.match(bootstrap, /c\.pumpCashback===true\|\|j\.pumpCashback===true/);
  assert.match(bootstrap, /c\.pumpCashbackSource\|\|j\.pumpCashbackSource/);
  const paint = functionBody(chart, "setPumpCashbackBadge");
  assert.match(paint, /Claimable rewards are wallet-wide and available in Wallet/);
});
