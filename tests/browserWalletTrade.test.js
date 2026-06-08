import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const htmlSource = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const web3BundleSource = fs.readFileSync(new URL("../web/public/vendor/solana-web3.iife.min.js", import.meta.url), "utf8");
const stylesSource = fs.readFileSync(new URL("../web/public/styles.css", import.meta.url), "utf8");

function functionBody(source, name) {
  const syncMatch = new RegExp(`function\\s+${name}\\s*\\(`).exec(source);
  const asyncMatch = new RegExp(`async\\s+function\\s+${name}\\s*\\(`).exec(source);
  const syncStart = syncMatch?.index ?? -1;
  const asyncStart = asyncMatch?.index ?? -1;
  const start = syncStart >= 0 && (asyncStart < 0 || syncStart < asyncStart) ? syncStart : asyncStart;
  assert.notEqual(start, -1, `${name} is missing`);
  const paramsStart = source.indexOf("(", start);
  let paramsDepth = 0;
  let paramsEnd = -1;
  for (let index = paramsStart; index < source.length; index += 1) {
    if (source[index] === "(") paramsDepth += 1;
    if (source[index] === ")") {
      paramsDepth -= 1;
      if (paramsDepth === 0) {
        paramsEnd = index;
        break;
      }
    }
  }
  const bodyStart = source.indexOf("{", paramsEnd);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(bodyStart + 1, index);
    }
  }
  return "";
}

test("Trade tab treats a connected Phantom/Solflare wallet as a usable trade wallet", () => {
  assert.match(appSource, /function connectedBrowserWallet/);
  assert.match(appSource, /function connectedBrowserWalletOptionHtml/);
  assert.match(appSource, /<option value="connected"/);
  assert.match(functionBody(appSource, "tradeHtml"), /Connect to Trade/);
  assert.match(functionBody(appSource, "tradeHtml"), /Connected browser wallets stay ready for this session/);
  assert.match(functionBody(appSource, "tradeHtml"), /every buy\/sell still requires wallet confirmation/);
  assert.match(functionBody(appSource, "tradeHtml"), /Automation Wallets/);
  assert.doesNotMatch(functionBody(appSource, "tradeHtml"), /return `\$\{createWalletSection\(\)\}/);
});

test("browser wallet buy and sell sign locally instead of entering managed-wallet setup", () => {
  assert.match(htmlSource, /vendor\/solana-web3\.iife\.min\.js/);
  assert.match(web3BundleSource.slice(0, 80), /window\.solanaWeb3=/);
  assert.match(appSource, /window\.solanaWeb3\.VersionedTransaction\.deserialize/);
  assert.match(functionBody(appSource, "executeWebBuy"), /isConnectedTradeWallet\(form\.walletIndex\)/);
  assert.match(functionBody(appSource, "executeWebBuy"), /executeConnectedBrowserTrade\(\{[\s\S]*side: "buy"/);
  assert.match(functionBody(appSource, "executeWebSell"), /isConnectedTradeWallet\(form\.walletIndex\)/);
  assert.match(functionBody(appSource, "executeWebSell"), /executeConnectedBrowserTrade\(\{[\s\S]*side: "sell"/);
  assert.match(functionBody(appSource, "executeConnectedBrowserTrade"), /\/api\/web\/browser-trade\/order/);
  assert.match(functionBody(appSource, "executeConnectedBrowserTrade"), /\/api\/web\/browser-trade\/execute/);
  assert.match(functionBody(appSource, "executeConnectedBrowserTrade"), /confirmConnectedBrowserTrade/);
  assert.match(functionBody(appSource, "executeConnectedBrowserTrade"), /!state\.walletFastApprovalsEnabled && !confirmConnectedBrowserTrade/);
  assert.match(functionBody(appSource, "executeConnectedBrowserTrade"), /Building \$\{side\} approval/);
  assert.match(appSource, /async function executeConnectedBrowserTrade\(\{[\s\S]*statusWriter = setTradeStatus/);
  assert.match(functionBody(appSource, "executeConnectedBrowserTrade"), /writeStatus/);
  assert.match(functionBody(appSource, "executeChartConnectedBuy"), /statusWriter: setChartTradeStatus/);
  assert.match(functionBody(appSource, "confirmConnectedBrowserTrade"), /window\.confirm/);
  assert.match(functionBody(appSource, "promptConnectedWalletReconnect"), /startMobileWalletConnect/);
  assert.match(functionBody(appSource, "promptConnectedWalletReconnect"), /openMobileWalletBrowse/);
  assert.match(functionBody(appSource, "connectedTradeProvider"), /promptConnectedWalletReconnect/);
  assert.doesNotMatch(functionBody(appSource, "executeConnectedBrowserTrade"), /JUPITER_API_KEY|privateKey|secretKey|seed/i);
});

test("top wallet status opens connect, wallets, or disconnect", () => {
  assert.match(htmlSource, /data-top-wallet-status/);
  assert.match(functionBody(appSource, "updateTopWalletConnectStatus"), /data-top-wallet-status/);
  assert.match(functionBody(appSource, "updateTopWalletConnectStatus"), /Wallet: Connected/);
  assert.match(functionBody(appSource, "handleTopWalletStatusClick"), /disconnectBrowserWallet/);
  assert.match(functionBody(appSource, "handleTopWalletStatusClick"), /openWalletConnectChooser\(\{ returnPath: "\/terminal" \}\)/);
  assert.match(appSource, /target\.matches\("\[data-top-wallet-status\]"\)[\s\S]*handleTopWalletStatusClick\(\)/);
});

test("backend builds a short-lived browser wallet Jupiter order and executes signed transactions", () => {
  assert.match(serverSource, /pathname === "\/api\/web\/browser-trade\/order"/);
  assert.match(serverSource, /pathname === "\/api\/web\/browser-trade\/execute"/);
  assert.match(serverSource, /async function webBrowserTradeOrder/);
  assert.match(serverSource, /async function webBrowserTradeExecute/);
  assert.match(functionBody(serverSource, "connectedWalletForBrowserTrade"), /profile\.connectedWallet/);
  assert.match(functionBody(serverSource, "webBrowserTradeOrder"), /assertTokenBuySafety/);
  assert.match(functionBody(serverSource, "webBrowserTradeOrder"), /createJupiterOrder/);
  assert.match(functionBody(serverSource, "webBrowserTradeOrder"), /saveBrowserTradeOrder/);
  assert.match(functionBody(serverSource, "assertTokenBuySafety"), /priority: true/);
  assert.match(functionBody(serverSource, "webBrowserTradeExecute"), /signedTransaction/);
  assert.match(functionBody(serverSource, "webBrowserTradeExecute"), /Jupiter browser wallet execute/);
  assert.match(functionBody(serverSource, "webBrowserTradeExecute"), /source: "web_browser_wallet_trade"/);
});

test("browser trade approvals are initialized in the server auth store and never use managed private keys", () => {
  assert.match(functionBody(serverSource, "defaultJsonForPath"), /browserTradeOrders: \[\]/);
  assert.match(functionBody(serverSource, "readWebAuthStore"), /browserTradeOrders/);
  assert.match(functionBody(serverSource, "takePendingBrowserTradeOrder"), /status !== "pending"/);
  assert.match(functionBody(serverSource, "takePendingBrowserTradeOrder"), /status = "submitting"/);
  assert.doesNotMatch(functionBody(serverSource, "webBrowserTradeOrder"), /decryptWallet|secretKey|privateKey|Keypair\.fromSecretKey/i);
  assert.doesNotMatch(functionBody(serverSource, "webBrowserTradeExecute"), /decryptWallet|secretKey|privateKey|Keypair\.fromSecretKey/i);
});

test("connected wallets can fund a limited session wallet with one normal wallet approval", () => {
  assert.match(appSource, /data-create-session-wallet/);
  assert.match(functionBody(appSource, "automationDelegationHtml"), /Session Budget SOL/);
  assert.match(functionBody(appSource, "automationDelegationHtml"), /only the SOL you approve into the session wallet can be automated/);
  assert.match(functionBody(appSource, "createSessionWalletFromConnected"), /\/api\/web\/session-wallet\/create/);
  assert.match(functionBody(appSource, "createSessionWalletFromConnected"), /signBrowserLegacyTransaction/);
  assert.match(functionBody(appSource, "createSessionWalletFromConnected"), /\/api\/web\/session-wallet\/execute/);
  assert.match(functionBody(appSource, "createSessionWalletFromConnected"), /session-wallet-funded/);
  assert.match(functionBody(appSource, "signBrowserLegacyTransaction"), /provider\.signTransaction/);
  assert.match(functionBody(appSource, "walletOptionsHtml"), /sessionWallet \? " Session"/);
  assert.match(stylesSource, /\.session-wallet-controls/);
  assert.match(stylesSource, /\.session-wallet-badge/);
});

test("backend session wallets verify the funding transaction before becoming automation wallets", () => {
  assert.match(serverSource, /pathname === "\/api\/web\/session-wallet\/create"/);
  assert.match(serverSource, /pathname === "\/api\/web\/session-wallet\/execute"/);
  assert.match(functionBody(serverSource, "defaultJsonForPath"), /sessionWalletOrders: \[\]/);
  assert.match(functionBody(serverSource, "readWebAuthStore"), /sessionWalletOrders/);
  assert.match(functionBody(serverSource, "sessionWalletFundingAmountLamports"), /0\.005/);
  assert.match(functionBody(serverSource, "sessionWalletFundingAmountLamports"), /10/);
  assert.match(functionBody(serverSource, "createWebSessionWalletOrder"), /profile\.connectedWallet/);
  assert.match(functionBody(serverSource, "createWebSessionWalletOrder"), /Keypair\.generate/);
  assert.match(functionBody(serverSource, "createWebSessionWalletOrder"), /sessionWallet: true/);
  assert.match(functionBody(serverSource, "createWebSessionWalletOrder"), /SystemProgram\.transfer/);
  assert.match(functionBody(serverSource, "createWebSessionWalletOrder"), /serialize\(\{ requireAllSignatures: false, verifySignatures: false \}\)/);
  assert.match(functionBody(serverSource, "verifySessionWalletFundingTransaction"), /feePayer/);
  assert.match(functionBody(serverSource, "verifySessionWalletFundingTransaction"), /tx\.instructions\.length !== 1/);
  assert.match(functionBody(serverSource, "verifySessionWalletFundingTransaction"), /SystemInstruction\.decodeTransfer/);
  assert.match(functionBody(serverSource, "verifySessionWalletFundingTransaction"), /BigInt\(transfer\.lamports\) === amountLamports/);
  assert.match(functionBody(serverSource, "verifySessionWalletFundingTransaction"), /signature/);
  assert.match(functionBody(serverSource, "executeWebSessionWalletFunding"), /sendRawTransaction/);
  assert.match(functionBody(serverSource, "executeWebSessionWalletFunding"), /confirmTransaction/);
  assert.match(functionBody(serverSource, "executeWebSessionWalletFunding"), /sessionStatus = "funded"/);
});

test("server-side trade selectors only allow funded live session wallets", () => {
  assert.match(functionBody(serverSource, "assertServerTradeWalletReady"), /sessionStatus !== "funded"/);
  assert.match(functionBody(serverSource, "assertServerTradeWalletReady"), /sessionExpiresAt/);
  assert.match(functionBody(serverSource, "getWebServerTradeWalletAt"), /assertServerTradeWalletReady/);
  assert.match(functionBody(serverSource, "webTradeBuy"), /getWebServerTradeWalletAt/);
  assert.match(functionBody(serverSource, "webTradeSellCore"), /getWebServerTradeWalletAt/);
  assert.match(functionBody(serverSource, "webSelectedWallets"), /assertServerTradeWalletReady/);
});
