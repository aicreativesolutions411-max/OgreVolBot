import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.resolve(process.env.DATA_DIR || path.join(rootDir, "data"));

async function readText(file) {
  return fs.readFile(path.join(rootDir, file), "utf8");
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

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function present(text, pattern) {
  return pattern.test(text);
}

const [html, app, css, server] = await Promise.all([
  readText("web/public/index.html"),
  readText("web/public/app.js"),
  readText("web/public/slimewire-final-overrides.css"),
  readText("src/index.js")
]);
const lockEvents = await readJsonIfExists("lock-in-events.json", { events: [] });

const report = {
  lockInControls: {
    dataOpenLoginButtons: countMatches(html, /data-open-login/g),
    dataConnectLoginToggleButtons: countMatches(html, /data-connect-login-toggle/g),
    allLockInLabels: countMatches(html, />\s*Lock In\s*</g),
    buttonsUseTypeButton: !/<button(?![^>]*type="button")[^>]*(data-open-login|data-connect-login-toggle)/.test(html)
  },
  wiring: {
    sharedOpenLoginModal: present(app, /function openLoginModal/),
    pointerupCaptureWired: present(app, /addEventListener\("pointerup"[\s\S]*data-open-login/),
    clickFallbackWired: present(app, /target\.matches\("\[data-open-login\]"\)[\s\S]*openLoginPanel/),
    lockInClickedLog: present(app, /LOCK_IN_CLICKED/) && present(server, /LOCK_IN_CLICKED/),
    fallbackLoginRoute: present(app, /function loginFallbackRoute/) && present(app, /\/login\?returnTo=/)
  },
  modalProvider: {
    mountedInHtml: present(html, /data-login-modal/),
    loginTabPresent: present(html, /data-login-tab="login"/),
    createAccountTabPresent: present(html, /data-login-tab="create"/),
    loginFieldsPresent: present(html, /data-login-username/) && present(html, /data-login-password/),
    createAccountActionPresent: present(html, /data-web-signup/)
  },
  authSession: {
    passwordLoginEndpoint: present(server, /pathname === "\/api\/web\/password-login"/),
    emailCodeEndpoint: present(server, /pathname === "\/api\/web\/login"/),
    createAccountEndpoint: present(server, /pathname === "\/api\/web\/signup"/),
    rateLimitPresent: present(server, /assertWebLoginAttemptAllowed/)
  },
  cssRiskCheck: {
    modalFixed: present(css, /\.login-modal\s*\{[\s\S]*position: fixed !important/),
    modalHighZIndex: present(css, /\.login-modal\s*\{[\s\S]*z-index: 7600 !important/),
    modalPointerEventsAuto: present(css, /\.login-modal\s*\{[\s\S]*pointer-events: auto !important/),
    decorativePseudoPointerNone: present(css, /\.login-modal-card::before\s*\{[\s\S]*pointer-events: none !important/),
    modalOverflowAuto: present(css, /\.login-modal-card\s*\{[\s\S]*overflow: auto !important/)
  },
  recentLockInClicks: (lockEvents.events || []).slice(-10)
};

console.log("LOCK IN MOBILE DEBUG");
console.log(JSON.stringify(report, null, 2));
