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

function blocks(text, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...text.matchAll(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\{([^}]*)\\}`, "g"))].map((match) => match[1] || "");
}

const appSource = read("web/public/app.js");
const overridesSource = read("web/public/slimewire-final-overrides.css");
const stylesSource = read("web/public/styles.css");
const cssSource = `${stylesSource}\n${overridesSource}`;
const directBodyBlocks = blocks(cssSource, "body");

const routeChecks = [
  {
    route: "/",
    expectedScrollContainer: "body",
    bottomReachableGuard: has(overridesSource, /\[data-app\]\[data-route="intro"\][\s\S]*overflow-y: visible !important/)
  },
  {
    route: "/connect",
    expectedScrollContainer: "body",
    bottomReachableGuard: has(overridesSource, /\[data-app\]\[data-route="connect"\][\s\S]*overflow-y: visible !important/)
      && has(overridesSource, /\[data-app\]\[data-route="connect"\] \.swamp-connect-shell[\s\S]*max-height: none !important/)
  },
  {
    route: "/terminal",
    expectedScrollContainer: "body/dashboard",
    bottomReachableGuard: has(overridesSource, /\[data-app\]\[data-route="terminal"\] \.dashboard[\s\S]*overflow-y: visible !important/)
  },
  {
    route: "/terminal/chart",
    expectedScrollContainer: "body/chart panel",
    bottomReachableGuard: has(overridesSource, /\.chart-trade-page[\s\S]*touch-action: manipulation !important/)
  }
];

const report = {
  mode: "source-audit",
  bodyHtmlOverflowValues: {
    finalHtmlOverflowAuto: has(overridesSource, /html\s*\{[\s\S]*overflow-y: auto !important/),
    finalBodyOverflowAutoWhenUnlocked: has(overridesSource, /body:not\(\.login-modal-open\):not\(\.quick-buy-modal-open\)\s*\{[\s\S]*overflow-y: auto !important/),
    permanentBodyOverflowHidden: directBodyBlocks.some((block) => /overflow:\s*hidden/i.test(block))
  },
  scrollLocks: {
    loginLockClass: has(overridesSource, /body\.login-modal-open\s*\{[\s\S]*overflow: hidden !important/),
    quickBuyLockClass: has(overridesSource, /\.quick-buy-modal-open\s*\{[\s\S]*overflow: hidden/),
    syncInteractionLocks: has(appSource, /function syncInteractionLocks\(\)/),
    clearsBodyInlineOverflow: has(appSource, /document\.body\.style\.overflow = ""/),
    clearsDocumentInlineOverflow: has(appSource, /document\.documentElement\.style\.overflow = ""/),
    routeChangeClosesTransientLayers: has(appSource, /function closeTransientInteractionLayers/)
      && has(appSource, /closeTransientInteractionLayers\(\{ keepLogin: state\.route === "login" \}\)/)
  },
  overlays: {
    hiddenWalletModalInert: has(overridesSource, /\.wallet-connect-modal\[hidden\][\s\S]*pointer-events: none !important/),
    hiddenLoginModalInert: has(overridesSource, /\.login-modal\[hidden\][\s\S]*pointer-events: none !important/),
    hiddenQuickBuyModalInert: has(overridesSource, /\[data-quick-buy-modal-root\]\[hidden\][\s\S]*pointer-events: none !important/),
    visibleModalPointerAuto: has(overridesSource, /\.wallet-connect-modal:not\(\[hidden\]\)[\s\S]*pointer-events: auto !important/)
  },
  routes: routeChecks,
  eventListeners: {
    globalWheelPreventDefault: /addEventListener\("wheel"[\s\S]*?preventDefault/.test(appSource),
    globalTouchMovePreventDefault: /addEventListener\("touchmove"[\s\S]*?preventDefault/.test(appSource)
  },
  bottomReachable: routeChecks.every((item) => item.bottomReachableGuard),
  secretsPrinted: false
};

console.log("SCROLL HEALTH DEBUG");
console.log(JSON.stringify(report, null, 2));
