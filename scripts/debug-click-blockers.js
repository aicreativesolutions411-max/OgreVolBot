import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(file) {
  return fs.readFileSync(path.join(rootDir, file), "utf8");
}

function has(text, pattern) {
  return pattern.test(text);
}

function count(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function functionBody(source, name) {
  const marker = `function ${name}`;
  const start = source.indexOf(marker);
  if (start === -1) return "";
  const next = source.indexOf("\nfunction ", start + marker.length);
  return source.slice(start, next === -1 ? undefined : next);
}

const htmlSource = read("web/public/index.html");
const appSource = read("web/public/app.js");
const overridesSource = read("web/public/slimewire-final-overrides.css");
const openTokenChartBody = functionBody(appSource, "openTokenChart");

const interactiveSelectors = [
  { selector: "[data-nav-route]", expected: "route navigation" },
  { selector: "[data-web-signup-connect]", expected: "open wallet chooser" },
  { selector: "[data-connect-wallet]", expected: "connect selected wallet provider" },
  { selector: "[data-connect-login-toggle]", expected: "open login modal" },
  { selector: "[data-open-login]", expected: "open login modal" },
  { selector: "[data-token-chart]", expected: "open chart/trade page" },
  { selector: "[data-token-trade]", expected: "open chart/trade page buy panel" },
  { selector: "[data-quick-buy-token]", expected: "open quick buy flow" },
  { selector: "[data-chart-confirm-buy]", expected: "confirm chart buy" },
  { selector: "[data-chart-confirm-sell]", expected: "confirm chart sell" },
  { selector: "[data-top-refresh-wallet]", expected: "refresh wallet/position" }
];

const inlineClickFallback = /document\.addEventListener\("click"[\s\S]*?\{ capture: true \}/.test(htmlSource);
const broadCapturePreventDefault = /document\.addEventListener\("click"[\s\S]*?event\.preventDefault\(\)[\s\S]*?\{ capture: true \}/.test(htmlSource);

const report = {
  route: "source-audit",
  knownInteractiveSelectors: interactiveSelectors.map((item) => ({
    ...item,
    htmlCount: count(htmlSource, new RegExp(item.selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")),
    appHandlerPresent: has(appSource, new RegExp(`target\\.matches\\("${item.selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\)`))
      || has(appSource, new RegExp(item.selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/data-/g, "data-")))
  })),
  blockers: {
    inlineCaptureClickFallbackPresent: inlineClickFallback,
    broadCapturePreventDefaultPresent: broadCapturePreventDefault,
    earlyConnectQueuePresent: has(htmlSource + appSource, /__SLIMEWIRE_EARLY_CONNECT_ACTION/),
    hiddenModalPointerGuardPresent: has(overridesSource, /\.wallet-connect-modal\[hidden\][\s\S]*pointer-events: none !important/)
      && has(overridesSource, /\.login-modal\[hidden\][\s\S]*pointer-events: none !important/)
      && has(overridesSource, /\[data-quick-buy-modal-root\]\[hidden\][\s\S]*pointer-events: none !important/),
    decorativeLayersPointerNone: count(overridesSource, /pointer-events: none !important/g),
    realControlsPointerAutoGuard: has(overridesSource, /\[data-token-trade\][\s\S]*pointer-events: auto/)
      && has(overridesSource, /\[data-quick-buy-token\][\s\S]*pointer-events: auto/)
  },
  propagation: {
    quickBuyStopsPropagation: has(appSource, /data-quick-buy-token[\s\S]*?event\.stopPropagation\(\)/),
    tradeStopsPropagation: has(appSource, /data-token-trade[\s\S]*?event\.stopPropagation\(\)/),
    tokenChartDoesNotBuy: !/(quickPresetTrade|\/api\/web\/trade\/buy|executeWebBuy)/.test(openTokenChartBody)
  },
  note: "Runtime element coverage needs a browser, but this source audit catches the production regression class: broad capture listeners, closed overlays, and missing action handlers.",
  secretsPrinted: false
};

console.log("CLICK BLOCKERS DEBUG");
console.log(JSON.stringify(report, null, 2));
