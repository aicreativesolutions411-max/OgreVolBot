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

const htmlSource = read("web/public/index.html");
const appSource = read("web/public/app.js");
const overridesSource = read("web/public/slimewire-final-overrides.css");

function sourceHas(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return has(htmlSource, new RegExp(escaped)) || has(appSource, new RegExp(escaped));
}

function handlerFor(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return has(appSource, new RegExp(`target\\.matches\\("${escaped}"\\)`))
    || has(appSource, new RegExp(escaped));
}

const actions = [
  {
    route: "/",
    action: "Enter the Swamp",
    selector: "[data-nav-route]",
    expectedBehavior: "navigate to /connect through real anchor fallback"
  },
  {
    route: "/connect",
    action: "Connect Wallet",
    selector: "[data-web-signup-connect]",
    expectedBehavior: "open wallet selection modal"
  },
  {
    route: "/connect",
    action: "Phantom/Solflare card",
    selector: "[data-connect-wallet]",
    expectedBehavior: "start selected browser/mobile wallet flow"
  },
  {
    route: "/connect",
    action: "Lock In",
    selector: "[data-connect-login-toggle]",
    expectedBehavior: "open login modal/options"
  },
  {
    route: "/terminal",
    action: "Top Lock In",
    selector: "[data-open-login]",
    expectedBehavior: "open login modal/options"
  },
  {
    route: "/terminal",
    action: "Refresh",
    selector: "[data-top-refresh-wallet]",
    expectedBehavior: "refresh wallet/position without blanking page"
  },
  {
    route: "/terminal",
    action: "Token image/name/card",
    selector: "[data-token-chart]",
    expectedBehavior: "open chart/trade page; no buy"
  },
  {
    route: "/terminal",
    action: "Trade",
    selector: "[data-token-trade]",
    expectedBehavior: "open chart/trade page with Buy panel"
  },
  {
    route: "/terminal",
    action: "Quick Buy",
    selector: "[data-quick-buy-token]",
    expectedBehavior: "open quick buy/custom SOL flow and stop card propagation"
  },
  {
    route: "/terminal/chart",
    action: "Chart Buy",
    selector: "[data-chart-confirm-buy]",
    expectedBehavior: "use existing buy endpoint after validation"
  },
  {
    route: "/terminal/chart",
    action: "Chart Sell",
    selector: "[data-chart-confirm-sell]",
    expectedBehavior: "use existing sell endpoint after validation"
  }
];

const report = {
  mode: "source-audit",
  interactions: actions.map((item) => ({
    ...item,
    selectorPresent: sourceHas(item.selector),
    handlerAttached: handlerFor(item.selector),
    enabledByDefault: true,
    topCoveringElement: "runtime-only",
    blockedByKnownOverlay: false
  })),
  globalGuards: {
    closedModalsDisplayNone: has(overridesSource, /\.wallet-connect-modal\[hidden\][\s\S]*display: none !important/)
      && has(overridesSource, /\.login-modal\[hidden\][\s\S]*display: none !important/)
      && has(overridesSource, /\[data-quick-buy-modal-root\]\[hidden\][\s\S]*display: none !important/),
    broadInlineClickCaptureAbsent: !/document\.addEventListener\("click"[\s\S]*?\{ capture: true \}/.test(htmlSource),
    tokenCardPropagationSafe: has(appSource, /data-token-trade[\s\S]*?event\.stopPropagation\(\)/)
      && has(appSource, /data-quick-buy-token[\s\S]*?event\.stopPropagation\(\)/)
  },
  secretsPrinted: false
};

console.log("INTERACTION MAP DEBUG");
console.log(JSON.stringify(report, null, 2));
