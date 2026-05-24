const config = window.OGRE_PORTAL_CONFIG || {};
const configuredApiBase = String(config.apiBase || "").trim().replace(/\/+$/, "");
const sameOriginApiBase = window.location.origin.replace(/\/+$/, "");
const defaultRenderApiBase = "https://ogrevolbot.onrender.com";
const apiBase = configuredApiBase
  || (window.location.hostname.endsWith("onrender.com") ? sameOriginApiBase : defaultRenderApiBase);

function getStoredToken() {
  try {
    return window.localStorage?.getItem("ogreWebToken") || "";
  } catch {
    return "";
  }
}

function setStoredToken(token) {
  try {
    window.localStorage?.setItem("ogreWebToken", token);
  } catch {
    // Private browsing or embedded browsers may block localStorage.
  }
}

function clearStoredToken() {
  try {
    window.localStorage?.removeItem("ogreWebToken");
  } catch {
    // Private browsing or embedded browsers may block localStorage.
  }
}

const state = {
  token: getStoredToken(),
  user: null,
  activeTab: "dashboard",
  loading: false,
  wallets: [],
  balances: [],
  positions: [],
  pnl: null,
  scan: null,
  scanMode: "safe",
  tradeToken: "",
  tradeResult: null,
  bundleToken: "",
  bundleResult: null,
  volumeToken: "",
  volumeResult: null,
  sniperResult: null,
  launchResult: null,
  launchWatches: [],
  restoreResult: null,
  importResult: null,
  backupResult: null,
  downloads: null
};

const $ = (selector) => document.querySelector(selector);
const app = $("[data-app]");
const loginView = $("[data-login]");
const dashboardView = $("[data-dashboard]");
const errorBox = $("[data-error]");

function apiUrl(path) {
  return `${apiBase}${path}`;
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  let response;
  try {
    response = await fetch(apiUrl(path), {
      ...options,
      headers,
      cache: "no-store"
    });
  } catch (error) {
    throw new Error(`Could not reach the OgreTrade API at ${apiBase}. Check OGRE_API_BASE on the website and WEB_ALLOWED_ORIGIN on Render.`);
  }
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.ok === false) {
    throw new Error(data.message || data.error || `HTTP ${response.status}`);
  }

  return data;
}

function setError(message = "") {
  errorBox.hidden = !message;
  errorBox.textContent = message;
}

function dexUrl(tokenMint) {
  const mint = String(tokenMint || "").trim();
  return mint ? `https://dexscreener.com/solana/${encodeURIComponent(mint)}` : "#";
}

async function createWebAccount() {
  setError("");
  try {
    const data = await api("/api/web/signup", {
      method: "POST",
      body: JSON.stringify({})
    });
    state.token = data.token;
    state.user = data.user;
    setStoredToken(state.token);
    state.activeTab = "wallets";
    await loadAll();
  } catch (error) {
    setError(error.message);
  }
}

async function logout() {
  try {
    await api("/api/web/logout", { method: "POST" });
  } catch {
    // Local logout should still work if the backend is offline.
  }
  state.token = "";
  state.user = null;
  clearStoredToken();
  render();
}

async function loadSession() {
  if (!state.token) {
    render();
    return;
  }

  try {
    const data = await api("/api/web/me");
    state.user = data.user;
    await loadAll();
  } catch {
    state.token = "";
    clearStoredToken();
    render();
  }
}

async function loadAll() {
  state.loading = true;
  render();

  const [wallets, balances, positions, pnl, launchWatches] = await Promise.all([
    api("/api/web/wallets"),
    api("/api/web/balances"),
    api("/api/web/positions"),
    api("/api/web/pnl"),
    api("/api/web/launch/watches")
  ]);
  state.wallets = wallets.wallets || [];
  state.balances = balances.balances || [];
  state.positions = positions.positions || [];
  state.pnl = pnl.pnl || null;
  state.launchWatches = launchWatches.watches || [];
  state.loading = false;
  render();
}

async function loadScan(mode = state.scanMode) {
  state.scanMode = mode;
  state.loading = true;
  render();

  try {
    const data = await api(`/api/web/sniper/scan?mode=${encodeURIComponent(mode)}`);
    state.scan = data.scan;
  } finally {
    state.loading = false;
    render();
  }
}

function totalSol() {
  return state.balances.reduce((sum, row) => sum + Number(row.sol || 0), 0);
}

function render() {
  app.dataset.loading = state.loading ? "true" : "false";
  loginView.hidden = Boolean(state.user);
  dashboardView.hidden = !state.user;

  if (!state.user) {
    return;
  }

  $("[data-user-id]").textContent = state.user.id;
  $("[data-wallet-count]").textContent = state.wallets.length;
  $("[data-total-sol]").textContent = totalSol().toFixed(4);
  $("[data-position-count]").textContent = state.positions.length;
  $("[data-realized]").textContent = state.pnl?.totals?.realizedSol || "+0 SOL";
  renderTabs();
}

function renderTabs() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.dataset.active = button.dataset.tab === state.activeTab ? "true" : "false";
  });

  const panel = $("[data-panel]");
  if (state.activeTab === "dashboard") panel.innerHTML = dashboardHtml();
  if (state.activeTab === "trade") panel.innerHTML = tradeHtml();
  if (state.activeTab === "bundle") panel.innerHTML = bundleHtml();
  if (state.activeTab === "volume") panel.innerHTML = volumeHtml();
  if (state.activeTab === "launch") panel.innerHTML = launchHtml();
  if (state.activeTab === "wallets") panel.innerHTML = walletsHtml();
  if (state.activeTab === "positions") panel.innerHTML = positionsHtml();
  if (state.activeTab === "pnl") panel.innerHTML = pnlHtml();
  if (state.activeTab === "sniper") panel.innerHTML = sniperHtml();
}

function dashboardHtml() {
  return `
    <section class="panel-grid">
      ${visualCard("visual-aces", "Trade Desk", "Quick buy and sell from one wallet with .10, .50, 1 SOL, max, and percent sell buttons.")}
      ${visualCard("visual-cauldron", "Bundle + Volume", "Buy or sell across selected wallets, then manage timed exits with Volume plans.")}
      ${visualCard("visual-candle", "Launch Snipe", "Preset ticker, wallets, amount, TP/SL, and slippage, then watch live feeds until launch.")}
    </section>
    ${createWalletSection()}
    ${importWalletSection()}
    ${backupRestoreSection()}
    ${downloadsHtml()}
  `;
}

function visualCard(className, title, body) {
  return `<article class="panel visual-card ${className}"><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></div></article>`;
}

function createWalletSection() {
  return `
    <section class="create-wallet-card">
      <div>
        <h3>Create Wallet Set</h3>
        <p>Create fresh managed wallets from the web. The browser downloads both backup files immediately after creation.</p>
      </div>
      <label>
        Label
        <input data-wallet-label type="text" placeholder="Ogre Web">
      </label>
      <label>
        Count
        <input data-wallet-count-input type="number" min="1" max="20" value="1">
      </label>
      <button data-create-wallets>Create</button>
      <small data-create-wallet-status></small>
    </section>
  `;
}

function backupRestoreSection() {
  return `
    <section class="create-wallet-card restore-card">
      <div>
        <h3>Backup / Restore</h3>
        <p>Load bot backup files or pasted recovery text back into this web account. Keep backup files private.</p>
      </div>
      <label>
        Backup File
        <input data-restore-file type="file" accept=".txt,.json,text/plain,application/json">
      </label>
      <label class="wide-field">
        Backup Text
        <textarea data-restore-text rows="5" placeholder="Paste the wallet-backup text here, or choose the backup .txt file above."></textarea>
      </label>
      <button data-restore-backup>Restore Wallets</button>
      <button type="button" class="secondary" data-export-backup>Download Current Backup</button>
      <small data-restore-status>${state.restoreResult ? escapeHtml(state.restoreResult.message || "Restore complete.") : ""}</small>
      <small data-export-status>${state.backupResult ? escapeHtml(state.backupResult.message || "Backup ready.") : ""}</small>
    </section>
  `;
}

function importWalletSection() {
  return `
    <section class="create-wallet-card restore-card">
      <div>
        <h3>Import Wallet</h3>
        <p>Paste a base58 private key or JSON secret-key array. The bot encrypts it with this account and immediately downloads fresh backup files.</p>
      </div>
      <label>
        Label
        <input data-import-label type="text" placeholder="Imported Wallet">
      </label>
      <label class="wide-field">
        Private Key / Secret Key
        <textarea data-import-secret rows="5" placeholder="Base58 private key or [12,34,...] secret key"></textarea>
      </label>
      <button data-import-wallet>Import</button>
      <small data-import-status>${state.importResult ? escapeHtml(state.importResult.message || "Import complete.") : ""}</small>
    </section>
  `;
}

function downloadsHtml() {
  if (!state.downloads) return "";
  return `
    <section class="download-card">
      <div>
        <h3>Wallet Backups Ready</h3>
        <p>Keep both files private. The recovery file contains raw private keys.</p>
      </div>
      <button data-download="encryptedBackup">Download Bot Backup</button>
      <button data-download="recoveryKeys">Download Solflare Keys</button>
    </section>
  `;
}

function tradeHtml() {
  if (!state.wallets.length) {
    return `${createWalletSection()}${emptyState("Create a wallet first", "The web trade desk needs at least one managed wallet before it can buy or sell.")}`;
  }

  return `
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>One-Wallet Trade</h3>
            <p>Paste a token CA, pick a wallet, then use fast buy and sell buttons from the webpage.</p>
          </div>
        </div>
        <label>
          Wallet
          <select data-trade-wallet>
            ${walletOptionsHtml()}
          </select>
        </label>
        <label>
          Token CA
          <input data-trade-token type="text" placeholder="Paste Solana token mint" value="${escapeHtml(state.tradeToken)}">
        </label>
        <label>
          Slippage
          <select data-trade-slippage>
            <option value="300">3% - tighter</option>
            <option value="400" selected>4% - default</option>
            <option value="500">5% - faster fills</option>
          </select>
        </label>

        <div class="trade-block">
          <div>
            <h4>Buy</h4>
            <p>Quick SOL amounts include the bot fee and keep the safety reserve.</p>
          </div>
          <div class="quick-grid">
            <button class="primary" data-trade-buy-quick="0.1">Buy .10 SOL</button>
            <button class="primary" data-trade-buy-quick="0.5">Buy .50 SOL</button>
            <button class="primary" data-trade-buy-quick="1">Buy 1 SOL</button>
            <button data-trade-buy-max>Buy Max</button>
          </div>
          <div class="inline-action">
            <input data-buy-custom type="number" min="0" step="0.01" placeholder="Custom SOL">
            <button data-trade-buy-custom>Buy Custom</button>
          </div>
        </div>

        <div class="trade-block">
          <div>
            <h4>Sell</h4>
            <p>Sell buttons use the selected wallet and token CA above.</p>
          </div>
          <div class="quick-grid">
            <button data-trade-sell-quick="25">Sell 25%</button>
            <button data-trade-sell-quick="50">Sell 50%</button>
            <button data-trade-sell-quick="100">Sell 100%</button>
          </div>
          <div class="inline-action">
            <input data-sell-custom type="number" min="1" max="100" step="1" placeholder="Custom %">
            <button data-trade-sell-custom>Sell Custom</button>
          </div>
        </div>
        <p class="trade-status" data-trade-status>${state.tradeResult ? escapeHtml(state.tradeResult.message || "Trade complete.") : "Ready."}</p>
      </article>

      <aside class="trade-side">
        <article>
          <h3>Web Trading</h3>
          <p>Uses the same backend wallet encryption, Jupiter route, safety precheck, slippage settings, and fee collection as the Telegram bot.</p>
        </article>
        <article>
          <h3>Selected Token</h3>
          <code>${state.tradeToken ? escapeHtml(state.tradeToken) : "Paste a CA or tap Trade from a scanner pick."}</code>
        </article>
        ${tradeResultHtml()}
      </aside>
    </section>
  `;
}

function walletOptionsHtml() {
  return state.wallets.map((wallet) => {
    const balance = state.balances.find((row) => Number(row.index) === Number(wallet.index));
    const sol = balance?.sol !== null && balance?.sol !== undefined ? `${Number(balance.sol).toFixed(4)} SOL` : "balance loading";
    return `<option value="${wallet.index}">${wallet.index}. ${escapeHtml(wallet.label)} - ${sol}</option>`;
  }).join("");
}

function tradeResultHtml() {
  if (!state.tradeResult) {
    return `
      <article>
        <h3>Latest Result</h3>
        <p>Your latest web buy or sell recap will appear here after the transaction lands.</p>
      </article>
    `;
  }

  const row = state.tradeResult;
  const isBuy = row.type === "buy";
  return `
    <article class="latest-trade">
      <h3>${isBuy ? "Buy Complete" : "Sell Complete"}</h3>
      <p>${escapeHtml(row.message || "")}</p>
      <dl>
        <div><dt>Wallet</dt><dd>${escapeHtml(row.walletLabel)}</dd></div>
        <div><dt>${isBuy ? "Spent" : "Net"}</dt><dd>${escapeHtml(isBuy ? row.spentSol : row.netSol)} SOL</dd></div>
        <div><dt>Fee</dt><dd>${escapeHtml(row.feeSol || "0")} SOL</dd></div>
      </dl>
      <div class="card-actions">
        <button data-copy="${escapeHtml(row.tokenMint)}">Copy CA</button>
        <a href="${escapeHtml(row.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `;
}

function bundleHtml() {
  if (!state.wallets.length) {
    return `${createWalletSection()}${emptyState("Create wallets first", "Bundle needs two or more managed wallets to be useful.")}`;
  }

  return `
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Bundle</h3>
            <p>Buy or sell the same token across selected wallets from one clean panel.</p>
          </div>
          <a class="mini-link" href="${state.bundleToken ? dexUrl(state.bundleToken) : "#"}" target="_blank" rel="noreferrer">Dex</a>
        </div>
        <label>
          Token CA
          <input data-bundle-token type="text" placeholder="Paste Solana token mint" value="${escapeHtml(state.bundleToken || state.tradeToken)}">
        </label>
        <div class="wallet-checks">
          ${walletChecksHtml("bundle")}
        </div>
        ${walletGroupHtml("bundle")}
        <div class="volume-grid">
          <label>
            Buy Per Wallet
            <input data-bundle-amount type="number" min="0" step="0.01" value="0.1">
          </label>
          <label>
            Sell Percent
            <select data-bundle-percent>
              <option value="25">25%</option>
              <option value="50">50%</option>
              <option value="100" selected>100%</option>
            </select>
          </label>
          <label>
            Slippage
            <select data-bundle-slippage>
              <option value="300">3%</option>
              <option value="400" selected>4%</option>
              <option value="500">5%</option>
            </select>
          </label>
        </div>
        <div class="quick-grid two-wide">
          <button class="primary" data-bundle-buy>Bundle Buy</button>
          <button data-bundle-sell>Bundle Sell</button>
        </div>
        <p class="trade-status" data-bundle-status>${state.bundleResult ? escapeHtml(state.bundleResult.message || "Bundle complete.") : "Ready."}</p>
      </article>
      <aside class="trade-side">
        <article>
          <h3>Multi-Wallet Control</h3>
          <p>Select the exact wallets to use. Each selected wallet must hold enough SOL for buy amount, fees, and reserve.</p>
        </article>
        ${bundleResultHtml()}
      </aside>
    </section>
  `;
}

function bundleResultHtml() {
  if (!state.bundleResult) {
    return `
      <article>
        <h3>Latest Bundle</h3>
        <p>Bundle buy/sell results will show here wallet by wallet.</p>
      </article>
    `;
  }

  return `
    <article class="latest-trade">
      <h3>${escapeHtml(state.bundleResult.type === "bundle_sell" ? "Bundle Sell" : "Bundle Buy")}</h3>
      <p>${escapeHtml(state.bundleResult.message || "")}</p>
      <div class="mini-results">
        ${(state.bundleResult.results || []).map((row) => `<span data-ok="${row.ok ? "true" : "false"}">${escapeHtml(row.message)}</span>`).join("")}
      </div>
      <div class="card-actions">
        <button data-copy="${escapeHtml(state.bundleResult.tokenMint)}">Copy CA</button>
        <a href="${escapeHtml(state.bundleResult.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `;
}

function walletChecksHtml(prefix) {
  return state.wallets.map((wallet, index) => `
    <label class="wallet-check">
      <input type="checkbox" data-${prefix}-wallet value="${wallet.index}" ${index < 6 ? "checked" : ""}>
      <span>${wallet.index}. ${escapeHtml(wallet.label)}</span>
      <code>${escapeHtml(wallet.shortPublicKey || wallet.publicKey)}</code>
    </label>
  `).join("");
}

function walletGroupHtml(prefix) {
  return `
    <label>
      Optional Group Label
      <input data-${prefix}-group type="text" placeholder="Example: Ogre">
    </label>
  `;
}

function volumeHtml() {
  if (!state.wallets.length) {
    return `${createWalletSection()}${emptyState("Create a wallet first", "Volume plans need at least one managed wallet before they can buy and watch exits.")}`;
  }

  return `
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Volume Plan</h3>
            <p>Buy once, then auto-manage the exit by timer, take-profit, stop-loss, or repeat cycles.</p>
          </div>
          <a class="mini-link" href="${state.volumeToken ? dexUrl(state.volumeToken) : "#"}" target="_blank" rel="noreferrer">Dex</a>
        </div>
        <label>
          Token CA
          <input data-volume-token type="text" placeholder="Paste Solana token mint" value="${escapeHtml(state.volumeToken || state.tradeToken)}">
        </label>
        <div class="wallet-checks">
          ${walletChecksHtml("volume")}
        </div>
        ${walletGroupHtml("volume")}

        <div class="volume-grid">
          <label>
            Buy Amount
            <input data-volume-amount type="number" min="0" step="0.01" value="0.1">
          </label>
          <label>
            Sell After
            <select data-volume-delay>
              <option value="5s">5 sec</option>
              <option value="1">1 min</option>
              <option value="5" selected>5 min</option>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="60">1 hour</option>
            </select>
          </label>
          <label>
            Take Profit
            <select data-volume-tp>
              <option value="15">+15%</option>
              <option value="25" selected>+25%</option>
              <option value="50">+50%</option>
              <option value="100">+100%</option>
            </select>
          </label>
          <label>
            Stop Loss
            <select data-volume-sl>
              <option value="8" selected>-8%</option>
              <option value="10">-10%</option>
              <option value="15">-15%</option>
              <option value="25">-25%</option>
            </select>
          </label>
          <label>
            Repeat
            <select data-volume-loop>
              <option value="1" selected>1x</option>
              <option value="5">5x</option>
              <option value="10">10x</option>
            </select>
          </label>
          <label>
            Slippage
            <select data-volume-slippage>
              <option value="300">3%</option>
              <option value="400" selected>4%</option>
              <option value="500">5%</option>
            </select>
          </label>
        </div>

        <button class="primary" data-volume-start>Start Volume Plan</button>
        <p class="trade-status" data-volume-status>${state.volumeResult ? escapeHtml(state.volumeResult.message || "Volume plan armed.") : "Ready."}</p>
      </article>

      <aside class="trade-side">
        <article>
          <h3>What It Does</h3>
        <p>Volume is a timed position manager: it buys from selected wallets, then watches for your timer, profit target, or stop-loss. Repeat runs the same managed cycle again after an exit.</p>
        </article>
        <article>
          <h3>Default Setup</h3>
          <p>5 minute fallback timer, +25% take-profit, -8% stop-loss, 4% slippage, 100% exit.</p>
        </article>
        ${volumeResultHtml()}
      </aside>
    </section>
  `;
}

function volumeResultHtml() {
  if (!state.volumeResult) {
    return `
      <article>
        <h3>Latest Plan</h3>
        <p>Your latest web volume plan recap will show here after the first buy lands.</p>
      </article>
    `;
  }

  const row = state.volumeResult;
  return `
    <article class="latest-trade">
      <h3>Plan Armed</h3>
      <p>${escapeHtml(row.message || "")}</p>
      <dl>
        <div><dt>Wallets</dt><dd>${escapeHtml(row.walletLabel || `${row.successCount || 0}/${row.walletCount || 0}`)}</dd></div>
        <div><dt>Buy</dt><dd>${escapeHtml(row.amountSol)} SOL</dd></div>
        <div><dt>TP / SL</dt><dd>+${escapeHtml(row.takeProfitPct)}% / -${escapeHtml(row.stopLossPct)}%</dd></div>
        <div><dt>Repeat</dt><dd>${escapeHtml(row.loopCount)}x</dd></div>
      </dl>
      ${row.results?.length ? `<div class="mini-results">${row.results.map((item) => `<span data-ok="${item.ok ? "true" : "false"}">${escapeHtml(item.message || item)}</span>`).join("")}</div>` : ""}
      <div class="card-actions">
        <button data-copy="${escapeHtml(row.tokenMint)}">Copy CA</button>
        <a href="${escapeHtml(row.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `;
}

function launchHtml() {
  if (!state.wallets.length) {
    return `${createWalletSection()}${emptyState("Create wallets first", "Launch Snipe needs managed wallets selected before it can watch and buy a ticker.")}`;
  }

  return `
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Launch Snipe</h3>
            <p>Preset the ticker, wallets, SOL amount, exits, and slippage. The backend keeps scanning until that ticker appears.</p>
          </div>
        </div>
        <label>
          Ticker
          <input data-launch-ticker type="text" placeholder="Example: OGRE">
        </label>
        <div class="wallet-checks">
          ${walletChecksHtml("launch")}
        </div>
        ${walletGroupHtml("launch")}
        <div class="volume-grid">
          <label>
            Buy Per Wallet
            <input data-launch-amount type="number" min="0" step="0.01" value="0.1">
          </label>
          <label>
            Take Profit
            <select data-launch-tp>
              <option value="25">+25%</option>
              <option value="40" selected>+40%</option>
              <option value="60">+60%</option>
              <option value="100">+100%</option>
            </select>
          </label>
          <label>
            Stop Loss
            <select data-launch-sl>
              <option value="8" selected>-8%</option>
              <option value="10">-10%</option>
              <option value="15">-15%</option>
            </select>
          </label>
          <label>
            Fallback Sell
            <select data-launch-delay>
              <option value="1">1 min</option>
              <option value="3" selected>3 min</option>
              <option value="5">5 min</option>
              <option value="15">15 min</option>
            </select>
          </label>
          <label>
            Slippage
            <select data-launch-slippage>
              <option value="300" selected>3%</option>
              <option value="400">4%</option>
              <option value="500">5%</option>
            </select>
          </label>
        </div>
        <button class="primary" data-launch-start>Start Launch Watch</button>
        <p class="trade-status" data-launch-status>${state.launchResult ? escapeHtml(state.launchResult.message || "Launch watch armed.") : "Ready."}</p>
      </article>

      <aside class="trade-side">
        <article>
          <h3>How It Works</h3>
          <p>It scans live launch/profile feeds about every ${escapeHtml(launchScanSeconds())} seconds while Render is awake. If PHOTON_NEW_PAIRS_URL is set, it checks that feed first.</p>
        </article>
        <article>
          <h3>Active Watches</h3>
          ${launchWatchesHtml()}
        </article>
      </aside>
    </section>
  `;
}

function launchScanSeconds() {
  const first = state.launchWatches?.[0]?.scanIntervalMs;
  return first ? (first / 1000).toFixed(first % 1000 === 0 ? 0 : 1) : "1.5";
}

function launchWatchesHtml() {
  if (!state.launchWatches.length) return "<p>No active launch watches yet.</p>";
  return `
    <div class="mini-results">
      ${state.launchWatches.map((watch) => `
        <span>
          $${escapeHtml(watch.ticker)} - ${escapeHtml(watch.status)} - ${escapeHtml(watch.walletCount)} wallet(s)
          ${watch.status === "launch_watch" ? `<button data-launch-cancel="${escapeHtml(watch.id)}">Cancel</button>` : ""}
        </span>
      `).join("")}
    </div>
  `;
}

async function createWalletSet() {
  const labelInput = $("[data-wallet-label]");
  const countInput = $("[data-wallet-count-input]");
  const status = $("[data-create-wallet-status]");
  if (!labelInput || !countInput || !status) return;
  status.textContent = "Creating wallets...";

  try {
    const data = await api("/api/web/wallets/create", {
      method: "POST",
      body: JSON.stringify({
        label: labelInput.value.trim() || "Ogre Web",
        count: countInput.value
      })
    });
    state.downloads = data.downloads;
    downloadText(data.downloads.encryptedBackup.filename, data.downloads.encryptedBackup.text);
    downloadText(data.downloads.recoveryKeys.filename, data.downloads.recoveryKeys.text);
    status.textContent = `Created ${data.wallets.length} wallet(s). Backup downloads started.`;
    await loadAll();
    state.activeTab = "wallets";
    render();
  } catch (error) {
    status.textContent = error.message;
  }
}

async function restoreWalletBackup() {
  const textarea = $("[data-restore-text]");
  const status = $("[data-restore-status]");
  if (!textarea || !status) return;
  const backupText = textarea.value.trim();
  if (!backupText) {
    status.textContent = "Choose a backup file or paste backup text first.";
    return;
  }

  status.textContent = "Restoring wallets...";
  try {
    const data = await api("/api/web/wallets/restore", {
      method: "POST",
      body: JSON.stringify({ backupText })
    });
    state.restoreResult = data.restore;
    if (data.restore?.downloads) {
      state.downloads = data.restore.downloads;
      if (data.restore.downloads.encryptedBackup) {
        downloadText(data.restore.downloads.encryptedBackup.filename, data.restore.downloads.encryptedBackup.text);
      }
      if (data.restore.downloads.recoveryKeys) {
        downloadText(data.restore.downloads.recoveryKeys.filename, data.restore.downloads.recoveryKeys.text);
      }
    }
    textarea.value = "";
    status.textContent = data.restore?.message || "Restore complete.";
    await loadAll();
    state.activeTab = "wallets";
    render();
  } catch (error) {
    status.textContent = error.message;
  }
}

async function exportWalletBackup() {
  const status = $("[data-export-status]");
  if (!status) return;

  status.textContent = "Building backup files...";
  try {
    const data = await api("/api/web/wallets/export", {
      method: "POST",
      body: JSON.stringify({})
    });
    state.backupResult = data.backup;
    if (data.backup?.downloads) {
      state.downloads = data.backup.downloads;
      if (data.backup.downloads.encryptedBackup) {
        downloadText(data.backup.downloads.encryptedBackup.filename, data.backup.downloads.encryptedBackup.text);
      }
      if (data.backup.downloads.recoveryKeys) {
        downloadText(data.backup.downloads.recoveryKeys.filename, data.backup.downloads.recoveryKeys.text);
      }
    }
    status.textContent = data.backup?.message || "Backup ready.";
    render();
  } catch (error) {
    status.textContent = error.message;
  }
}

async function importWallet() {
  const labelInput = $("[data-import-label]");
  const secretInput = $("[data-import-secret]");
  const status = $("[data-import-status]");
  if (!labelInput || !secretInput || !status) return;
  const label = labelInput.value.trim() || "Imported Wallet";
  const secret = secretInput.value.trim();
  if (!secret) {
    status.textContent = "Paste a private key or JSON secret-key array first.";
    return;
  }

  status.textContent = "Importing wallet...";
  try {
    const data = await api("/api/web/wallets/import", {
      method: "POST",
      body: JSON.stringify({ label, secret })
    });
    state.importResult = data.imported;
    if (data.imported?.downloads) {
      state.downloads = data.imported.downloads;
      if (data.imported.downloads.encryptedBackup) {
        downloadText(data.imported.downloads.encryptedBackup.filename, data.imported.downloads.encryptedBackup.text);
      }
      if (data.imported.downloads.recoveryKeys) {
        downloadText(data.imported.downloads.recoveryKeys.filename, data.imported.downloads.recoveryKeys.text);
      }
    }
    secretInput.value = "";
    status.textContent = data.imported?.message || "Import complete.";
    await loadAll();
    state.activeTab = "wallets";
    render();
  } catch (error) {
    status.textContent = error.message;
  }
}

async function readRestoreFile(input) {
  const status = $("[data-restore-status]");
  const textarea = $("[data-restore-text]");
  const file = input?.files?.[0];
  if (!file || !textarea) return;
  if (status) status.textContent = "Reading backup file...";
  try {
    textarea.value = await file.text();
    if (status) status.textContent = "Backup loaded. Tap Restore Wallets.";
  } catch (error) {
    if (status) status.textContent = `Could not read file: ${error.message}`;
  }
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function readTradeForm() {
  const walletIndex = $("[data-trade-wallet]")?.value || "";
  const tokenMint = $("[data-trade-token]")?.value?.trim() || "";
  const slippageBps = $("[data-trade-slippage]")?.value || "400";
  if (!walletIndex) throw new Error("Choose a wallet first.");
  if (!tokenMint) throw new Error("Paste a token CA first.");
  state.tradeToken = tokenMint;
  return { walletIndex, tokenMint, slippageBps };
}

function setTradeStatus(message) {
  const status = $("[data-trade-status]");
  if (status) status.textContent = message;
}

async function executeWebBuy(amountSol, amountMode = "fixed") {
  try {
    const form = readTradeForm();
    const payload = {
      tokenMint: form.tokenMint,
      walletIndex: form.walletIndex,
      slippageBps: form.slippageBps
    };
    if (amountMode === "max") {
      payload.amountMode = "max";
    } else {
      const value = Number(amountSol);
      if (!Number.isFinite(value) || value <= 0) throw new Error("Enter a buy amount greater than zero.");
      payload.amountSol = String(value);
    }

    setTradeStatus("Sending buy...");
    const data = await api("/api/web/trade/buy", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.tradeResult = data.trade;
    await loadAll();
    state.activeTab = "trade";
    render();
  } catch (error) {
    setTradeStatus(error.message);
  }
}

async function executeWebSell(percent) {
  try {
    const form = readTradeForm();
    const value = Number.parseInt(percent, 10);
    if (!Number.isInteger(value) || value < 1 || value > 100) {
      throw new Error("Sell percent must be from 1 to 100.");
    }

    setTradeStatus("Sending sell...");
    const data = await api("/api/web/trade/sell", {
      method: "POST",
      body: JSON.stringify({
        tokenMint: form.tokenMint,
        walletIndex: form.walletIndex,
        slippageBps: form.slippageBps,
        percent: value
      })
    });
    state.tradeResult = data.trade;
    await loadAll();
    state.activeTab = "trade";
    render();
  } catch (error) {
    setTradeStatus(error.message);
  }
}

function readVolumeForm() {
  const walletIndexes = checkedWalletIndexes("volume");
  const walletGroup = $("[data-volume-group]")?.value?.trim() || "";
  const tokenMint = $("[data-volume-token]")?.value?.trim() || "";
  const amountSol = $("[data-volume-amount]")?.value || "";
  const sellDelay = $("[data-volume-delay]")?.value || "5";
  const takeProfitPct = $("[data-volume-tp]")?.value || "25";
  const stopLossPct = $("[data-volume-sl]")?.value || "8";
  const loopCount = $("[data-volume-loop]")?.value || "1";
  const slippageBps = $("[data-volume-slippage]")?.value || "400";
  if (!walletIndexes.length && !walletGroup) throw new Error("Choose at least one wallet or enter a group label.");
  if (!tokenMint) throw new Error("Paste a token CA first.");
  state.volumeToken = tokenMint;
  return { walletIndexes, walletGroup, tokenMint, amountSol, sellDelay, takeProfitPct, stopLossPct, loopCount, slippageBps };
}

function setVolumeStatus(message) {
  const status = $("[data-volume-status]");
  if (status) status.textContent = message;
}

async function createVolumePlan() {
  try {
    const payload = readVolumeForm();
    setVolumeStatus("Buying and arming plan...");
    const data = await api("/api/web/volume/plan", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.volumeResult = data.plan;
    await loadAll();
    state.activeTab = "volume";
    render();
  } catch (error) {
    setVolumeStatus(error.message);
  }
}

function readSniperEntryForm(tokenMint) {
  const walletIndexes = checkedWalletIndexes("sniper");
  const walletGroup = $("[data-sniper-group]")?.value?.trim() || "";
  const amountSol = $("[data-sniper-amount]")?.value || "";
  const sellDelay = $("[data-sniper-delay]")?.value || (state.scanMode === "pumpsnipe" ? "3" : "5");
  const takeProfitPct = $("[data-sniper-tp]")?.value || (state.scanMode === "pumpsnipe" ? "40" : "25");
  const stopLossPct = $("[data-sniper-sl]")?.value || "8";
  const slippageBps = $("[data-sniper-slippage]")?.value || (state.scanMode === "pumpsnipe" ? "300" : "400");
  if (!walletIndexes.length && !walletGroup) throw new Error("Choose at least one wallet or enter a group label.");
  if (!tokenMint) throw new Error("Pick a token first.");
  state.tradeToken = tokenMint;
  state.volumeToken = tokenMint;
  state.bundleToken = tokenMint;
  return {
    mode: state.scanMode,
    tokenMint,
    walletIndexes,
    walletGroup,
    amountSol,
    sellDelay,
    takeProfitPct,
    stopLossPct,
    slippageBps,
    loopCount: "1"
  };
}

function setSniperStatus(message) {
  const status = $("[data-sniper-status]");
  if (status) status.textContent = message;
}

async function createSniperEntry(tokenMint) {
  try {
    const payload = readSniperEntryForm(tokenMint);
    setSniperStatus("Buying and arming exits...");
    const data = await api("/api/web/sniper/entry", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.sniperResult = data.plan;
    await loadAll();
    state.activeTab = "sniper";
    render();
  } catch (error) {
    setSniperStatus(error.message);
  }
}

function checkedWalletIndexes(prefix) {
  return [...document.querySelectorAll(`[data-${prefix}-wallet]:checked`)].map((input) => input.value);
}

function setBundleStatus(message) {
  const status = $("[data-bundle-status]");
  if (status) status.textContent = message;
}

function readBundleForm() {
  const tokenMint = $("[data-bundle-token]")?.value?.trim() || "";
  const walletIndexes = checkedWalletIndexes("bundle");
  const walletGroup = $("[data-bundle-group]")?.value?.trim() || "";
  const amountSol = $("[data-bundle-amount]")?.value || "";
  const percent = $("[data-bundle-percent]")?.value || "100";
  const slippageBps = $("[data-bundle-slippage]")?.value || "400";
  if (!tokenMint) throw new Error("Paste a token CA first.");
  if (!walletIndexes.length && !walletGroup) throw new Error("Choose at least one wallet or enter a group label.");
  state.bundleToken = tokenMint;
  return { tokenMint, walletIndexes, walletGroup, amountSol, percent, slippageBps };
}

async function executeBundle(action) {
  try {
    const payload = readBundleForm();
    setBundleStatus(action === "buy" ? "Sending bundle buy..." : "Sending bundle sell...");
    const data = await api(`/api/web/bundle/${action}`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.bundleResult = data.bundle;
    await loadAll();
    state.activeTab = "bundle";
    render();
  } catch (error) {
    setBundleStatus(error.message);
  }
}

function setLaunchStatus(message) {
  const status = $("[data-launch-status]");
  if (status) status.textContent = message;
}

function readLaunchForm() {
  const ticker = $("[data-launch-ticker]")?.value?.trim() || "";
  const walletIndexes = checkedWalletIndexes("launch");
  const walletGroup = $("[data-launch-group]")?.value?.trim() || "";
  const amountSol = $("[data-launch-amount]")?.value || "";
  const takeProfitPct = $("[data-launch-tp]")?.value || "40";
  const stopLossPct = $("[data-launch-sl]")?.value || "8";
  const sellDelay = $("[data-launch-delay]")?.value || "180";
  const slippageBps = $("[data-launch-slippage]")?.value || "300";
  if (!ticker) throw new Error("Enter a ticker to watch.");
  if (!walletIndexes.length && !walletGroup) throw new Error("Choose at least one wallet or enter a group label.");
  return { ticker, walletIndexes, walletGroup, amountSol, takeProfitPct, stopLossPct, sellDelay, slippageBps };
}

async function startLaunchWatch() {
  try {
    const payload = readLaunchForm();
    setLaunchStatus("Arming launch watch...");
    const data = await api("/api/web/launch/watch", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.launchResult = data.watch;
    await loadAll();
    state.activeTab = "launch";
    render();
  } catch (error) {
    setLaunchStatus(error.message);
  }
}

async function cancelLaunchWatch(planId) {
  try {
    const data = await api("/api/web/launch/cancel", {
      method: "POST",
      body: JSON.stringify({ planId })
    });
    state.launchResult = data.watch;
    await loadAll();
    state.activeTab = "launch";
    render();
  } catch (error) {
    setLaunchStatus(error.message);
  }
}

function walletsHtml() {
  const create = `${createWalletSection()}${importWalletSection()}${backupRestoreSection()}${downloadsHtml()}`;
  if (!state.wallets.length) return `${create}${emptyState("No wallets yet", "Create a wallet set above to get started on web.")}`;
  return `
    ${create}
    <div class="table-list">
      ${state.wallets.map((wallet) => `
        <article class="row-card">
          <div>
            <strong>${wallet.index}. ${escapeHtml(wallet.label)}</strong>
            <code>${wallet.publicKey}</code>
          </div>
          <button data-copy="${wallet.publicKey}">Copy</button>
        </article>
      `).join("")}
    </div>
  `;
}

function positionsHtml() {
  if (!state.positions.length) return emptyState("No open positions", "Current token holdings will show here.");
  return `
    <div class="table-list">
      ${state.positions.map((position) => `
        <article class="row-card position">
          <div>
            <strong>${position.shortMint}</strong>
            <span>${position.uiAmount} tokens across ${position.walletCount} wallet(s)</span>
            <small>Value: ${position.estimatedValueSol || "unavailable"} SOL | PnL: ${position.openPnlSol || position.realizedSol}</small>
          </div>
          <a class="mini-link" href="${position.dexUrl}" target="_blank" rel="noreferrer">Dex</a>
        </article>
      `).join("")}
    </div>
  `;
}

function pnlHtml() {
  if (!state.pnl?.totals?.tradeCount) return emptyState("No PnL yet", "Trades made through the bot will show here.");
  return `
    <section class="pnl-summary">
      <div><span>Trades</span><strong>${state.pnl.totals.tradeCount}</strong></div>
      <div><span>Spent</span><strong>${state.pnl.totals.spentSol} SOL</strong></div>
      <div><span>Received</span><strong>${state.pnl.totals.receivedSol} SOL</strong></div>
      <div><span>Realized</span><strong>${state.pnl.totals.realizedSol}</strong></div>
    </section>
    <div class="table-list">
      ${state.pnl.tokens.map((row) => `
        <article class="row-card">
          <div>
            <strong>${row.shortMint}</strong>
            <span>${row.realizedSol} realized | buys ${row.buys} / sells ${row.sells}</span>
            <small>Latest: ${formatDate(row.lastTradeAt)}</small>
          </div>
          <a class="mini-link" href="${row.dexUrl}" target="_blank" rel="noreferrer">Dex</a>
        </article>
      `).join("")}
    </div>
  `;
}

function sniperHtml() {
  const modes = [
    ["safe", "Safe Picks"],
    ["smart", "Smart Accumulation"],
    ["fast", "Fast Movers"],
    ["pumpsnipe", "PumpSnipe"],
    ["moonshot", "Low MC"],
    ["meme", "Narratives"],
    ["long", "Long Term"]
  ];
  const activeLabel = modes.find(([mode]) => mode === state.scanMode)?.[1] || "Picks";
  return `
    <div class="mode-row">
      ${modes.map(([mode, label]) => `<button data-scan-mode="${mode}" data-active="${state.scanMode === mode}">${label}</button>`).join("")}
    </div>
    <p class="scan-meta">${escapeHtml(sniperModeDescription(state.scanMode))}</p>
    <div class="section-actions">
      <button class="primary" data-refresh-scan>Refresh ${escapeHtml(activeLabel)}</button>
      <button data-tab="trade">Trade Desk</button>
    </div>
    ${sniperSetupHtml()}
    ${state.scan ? sniperRowsHtml() : emptyState("No scan loaded", "Pick a mode or tap Refresh Picks.")}
  `;
}

function sniperModeDescription(mode) {
  const descriptions = {
    safe: "Safer-looking picks with stronger liquidity, cleaner trend, lower risk flags, and no obvious dump/sell-pressure pattern.",
    smart: "Accumulation-style picks: buyer pressure, steady volume, and cleaner momentum without obvious sell pressure.",
    fast: "Fast movers with volume picking up and a cleaner short-term trend for quicker in-and-out trades.",
    pumpsnipe: "Very early pump-style launches, usually lower market cap, with enough volume/liquidity to attempt a quick trade.",
    moonshot: "Low market-cap picks in the 4k-40k range with usable volume and no active dump signal.",
    meme: "Narrative picks based on token metadata/keywords plus volume and trend checks. Add a social feed later for true social velocity.",
    long: "Longer-hold candidates with steadier accumulation signals and less short-term dump pressure."
  };
  return descriptions[mode] || descriptions.safe;
}

function sniperSetupHtml() {
  if (!state.wallets.length) {
    return emptyState("Create wallets to snipe", "Sniper can scan without wallets, but buying needs at least one managed wallet.");
  }

  const isPump = state.scanMode === "pumpsnipe";
  return `
    <section class="trade-card sniper-setup">
      <div class="trade-head">
        <div>
          <h3>${isPump ? "PumpSnipe Setup" : "Sniper Buy Setup"}</h3>
          <p>Select wallets once, then tap Snipe on any pick. Amount is per selected wallet.</p>
        </div>
      </div>
      <div class="wallet-checks">
        ${walletChecksHtml("sniper")}
      </div>
      ${walletGroupHtml("sniper")}
      <div class="volume-grid">
        <label>
          Buy Per Wallet
          <input data-sniper-amount type="number" min="0" step="0.01" value="0.1">
        </label>
        <label>
          Take Profit
          <select data-sniper-tp>
            <option value="15">+15%</option>
            <option value="25" ${isPump ? "" : "selected"}>+25%</option>
            <option value="40" ${isPump ? "selected" : ""}>+40%</option>
            <option value="50">+50%</option>
            <option value="100">+100%</option>
          </select>
        </label>
        <label>
          Stop Loss
          <select data-sniper-sl>
            <option value="8" selected>-8%</option>
            <option value="10">-10%</option>
            <option value="15">-15%</option>
          </select>
        </label>
        <label>
          Fallback Sell
          <select data-sniper-delay>
            <option value="1">1 min</option>
            <option value="3" ${isPump ? "selected" : ""}>3 min</option>
            <option value="5" ${isPump ? "" : "selected"}>5 min</option>
            <option value="15">15 min</option>
          </select>
        </label>
        <label>
          Slippage
          <select data-sniper-slippage>
            <option value="300" ${isPump ? "selected" : ""}>3%</option>
            <option value="400" ${isPump ? "" : "selected"}>4%</option>
            <option value="500">5%</option>
          </select>
        </label>
      </div>
      <p class="trade-status" data-sniper-status>${state.sniperResult ? escapeHtml(state.sniperResult.message || "Sniper plan armed.") : "Ready. Tap Snipe on a pick below."}</p>
      ${sniperResultHtml()}
    </section>
  `;
}

function sniperResultHtml() {
  const row = state.sniperResult;
  if (!row?.results?.length) return "";
  return `<div class="mini-results">${row.results.map((item) => `<span data-ok="${item.ok ? "true" : "false"}">${escapeHtml(item.message || item)}</span>`).join("")}</div>`;
}

function sniperRowsHtml() {
  if (!state.scan.rows.length) {
    return emptyState("No usable picks", "Refresh again or choose a different mode.");
  }
  return `
    <p class="scan-meta">${escapeHtml(state.scan.label)} | scored ${state.scan.scanned} | qualified ${state.scan.qualified} | mode-fit ${state.scan.modeFit}</p>
    <div class="pick-grid">
      ${state.scan.rows.map((row, index) => `
        <article class="pick-card">
          <div class="pick-top">
            <span>#${index + 1}</span>
            <strong>${escapeHtml(row.symbol || row.shortMint)}</strong>
            <em>${row.score}/100</em>
          </div>
          <h3>${escapeHtml(row.category)}</h3>
          <p>${escapeHtml(row.scalpSetup || row.momentum)} | Rug ${row.rugRisk}/100 | Exit ${row.exitRisk}/100</p>
          <dl>
            <div><dt>MC</dt><dd>${row.marketCapLabel}</dd></div>
            <div><dt>Liq</dt><dd>${row.liquidityLabel}</dd></div>
            <div><dt>Vol 5m</dt><dd>${row.volume5mLabel}</dd></div>
          </dl>
          <code>${row.tokenMint}</code>
          <div class="card-actions">
            <button data-copy="${row.tokenMint}">Copy CA</button>
            <button class="primary" data-sniper-buy="${row.tokenMint}">Snipe</button>
            <button data-use-token="${row.tokenMint}">Trade</button>
            <a href="${row.dexUrl}" target="_blank" rel="noreferrer">Dex</a>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function emptyState(title, body) {
  return `<article class="empty"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></article>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(value) {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? "unknown" : date.toLocaleString();
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("button, a");
  if (!target) return;

  if (target.matches("[data-web-signup]")) createWebAccount();
  if (target.matches("[data-logout]")) logout();
  if (target.matches("[data-create-wallets]")) createWalletSet();
  if (target.matches("[data-restore-backup]")) restoreWalletBackup();
  if (target.matches("[data-export-backup]")) exportWalletBackup();
  if (target.matches("[data-import-wallet]")) importWallet();
  if (target.matches("[data-download]")) {
    const file = state.downloads?.[target.dataset.download];
    if (file) downloadText(file.filename, file.text);
  }
  if (target.matches("[data-trade-buy-quick]")) {
    await executeWebBuy(target.dataset.tradeBuyQuick);
  }
  if (target.matches("[data-trade-buy-max]")) {
    await executeWebBuy(null, "max");
  }
  if (target.matches("[data-trade-buy-custom]")) {
    await executeWebBuy($("[data-buy-custom]")?.value);
  }
  if (target.matches("[data-trade-sell-quick]")) {
    await executeWebSell(target.dataset.tradeSellQuick);
  }
  if (target.matches("[data-trade-sell-custom]")) {
    await executeWebSell($("[data-sell-custom]")?.value);
  }
  if (target.matches("[data-volume-start]")) {
    await createVolumePlan();
  }
  if (target.matches("[data-sniper-buy]")) {
    await createSniperEntry(target.dataset.sniperBuy);
  }
  if (target.matches("[data-bundle-buy]")) {
    await executeBundle("buy");
  }
  if (target.matches("[data-bundle-sell]")) {
    await executeBundle("sell");
  }
  if (target.matches("[data-launch-start]")) {
    await startLaunchWatch();
  }
  if (target.matches("[data-launch-cancel]")) {
    await cancelLaunchWatch(target.dataset.launchCancel);
  }
  if (target.matches("[data-use-token]")) {
    state.tradeToken = target.dataset.useToken || "";
    state.volumeToken = target.dataset.useToken || "";
    state.bundleToken = target.dataset.useToken || "";
    state.activeTab = "trade";
    render();
  }
  if (target.matches("[data-refresh-all]")) loadAll().catch((error) => setError(error.message));

  if (target.matches("[data-tab]")) {
    state.activeTab = target.dataset.tab;
    if (state.activeTab === "sniper" && !state.scan) {
      await loadScan().catch((error) => setError(error.message));
    }
    render();
  }

  if (target.matches("[data-refresh-scan]")) {
    await loadScan().catch((error) => setError(error.message));
  }

  if (target.matches("[data-scan-mode]")) {
    await loadScan(target.dataset.scanMode).catch((error) => setError(error.message));
  }

  const copyValue = target.getAttribute("data-copy");
  if (copyValue) {
    await navigator.clipboard.writeText(copyValue);
    target.textContent = "Copied";
    setTimeout(() => { target.textContent = copyValue.length > 44 ? "Copy CA" : "Copy"; }, 1000);
  }
});

document.addEventListener("change", async (event) => {
  const target = event.target;
  if (target?.matches?.("[data-restore-file]")) {
    await readRestoreFile(target);
  }
});

loadSession();
