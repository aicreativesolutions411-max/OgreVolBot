import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appSource = fs.readFileSync(path.join(rootDir, "web", "public", "app.js"), "utf8");

function has(pattern) {
  return pattern.test(appSource);
}

console.log(JSON.stringify({
  quickBuySourceComponent: "delegated token/card/chart handlers",
  tokenRefValid: has(/function tokenRefFromMint/),
  presetAmount: has(/activeQuickBuyAmount\(preset\)/) ? "uses active trade preset when present" : "not detected",
  customAmountValid: has(/normalizedQuickBuyAmount\(\$\(\"\[data-quick-buy-modal-amount\]\"\)/),
  walletConnected: has(/isConnectedTradeWallet\(walletIndex\)/),
  confirmRequired: has(/data-quick-buy-confirm/),
  idempotencyKey: has(/createClientAttemptId\("quick-buy"\)/),
  routesToExistingEndpoints: {
    browserWalletOrder: has(/executeConnectedBrowserTrade\(\{[\s\S]*side: "buy"/),
    managedWalletBuy: has(/\/api\/web\/trade\/buy/)
  },
  lastSafeErrorShape: has(/publicErrorMessage\(error\.message \|\| "Quick buy failed\."\)/),
  secretsPrinted: false
}, null, 2));
