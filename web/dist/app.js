const config = window.OGRE_PORTAL_CONFIG || {};
const configuredApiBase = String(config.apiBase || "").trim().replace(/\/+$/, "");
const sameOriginApiBase = window.location.origin.replace(/\/+$/, "");
const defaultRenderApiBase = "https://ogrevolbot.onrender.com";
const shareSiteUrl = String(config.shareUrl || config.siteUrl || "https://www.slimewire.org").trim() || "https://www.slimewire.org";
const apiCandidates = [
  configuredApiBase,
  window.location.hostname.endsWith("onrender.com") ? sameOriginApiBase : "",
  defaultRenderApiBase
].filter(Boolean);
let apiBase = apiCandidates[0] || defaultRenderApiBase;
const API_CONNECT_TIMEOUT_MS = 18_000;

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

function getStoredXHandle() {
  try {
    return window.localStorage?.getItem("ogreXHandle") || "";
  } catch {
    return "";
  }
}

function setStoredXHandle(handle) {
  try {
    window.localStorage?.setItem("ogreXHandle", handle);
  } catch {
    // Local share settings are optional.
  }
}

function clearStoredXHandle() {
  try {
    window.localStorage?.removeItem("ogreXHandle");
  } catch {
    // Local share settings are optional.
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
  kolScan: null,
  kolMode: "hot",
  kolWallet: "",
  kolResult: null,
  kolStatus: "",
  kolLoading: false,
  kolLastUpdatedAt: "",
  restoreResult: null,
  importResult: null,
  backupResult: null,
  downloads: null,
  xHandle: getStoredXHandle()
};

const $ = (selector) => document.querySelector(selector);
const app = $("[data-app]");
const loginView = $("[data-login]");
const dashboardView = $("[data-dashboard]");
const errorBox = $("[data-error]");
const dashboardErrorBox = $("[data-dashboard-error]");

function apiUrl(path) {
  return `${apiBase}${path}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = API_CONNECT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function wakeApi(base) {
  try {
    await fetchWithTimeout(`${base}/wake`, { cache: "no-store" }, 8_000);
  } catch {
    // Wake checks are best-effort. The main request below reports the real failure.
  }
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  let response;
  let lastError = null;
  try {
    response = await fetchWithTimeout(apiUrl(path), { ...options, headers, cache: "no-store" });
  } catch (error) {
    lastError = error;
    await wakeApi(apiBase);
    await sleep(900);
    try {
      response = await fetchWithTimeout(apiUrl(path), { ...options, headers, cache: "no-store" });
    } catch (retryError) {
      lastError = retryError;
      for (const fallbackBase of apiCandidates) {
        if (fallbackBase === apiBase) continue;
        try {
          await wakeApi(fallbackBase);
          response = await fetchWithTimeout(`${fallbackBase}${path}`, { ...options, headers, cache: "no-store" });
          apiBase = fallbackBase;
          break;
        } catch (fallbackError) {
          lastError = fallbackError;
        }
      }
      if (!response) {
        const detail = lastError?.name === "AbortError" ? "The request timed out." : "The browser blocked or could not open the request.";
        throw new Error(`${detail} Could not reach OgreTrade right now. Try again in a moment or contact support.`);
      }
    }
  }
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.ok === false) {
    const message = data.message || data.error || `HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    if (response.status === 401) {
      resetWebSession(message);
    }
    throw error;
  }

  return data;
}

function resetWebSession(message = "") {
  state.token = "";
  state.user = null;
  state.loading = false;
  clearStoredToken();
  render();
  setError(message || "Your web session expired. Tap Create Account to start a fresh session.");
}

function setError(message = "") {
  [errorBox, dashboardErrorBox].forEach((box) => {
    if (!box) return;
    box.hidden = !message;
    box.textContent = message;
  });
}

function dexUrl(tokenMint) {
  const mint = String(tokenMint || "").trim();
  return mint ? `https://dexscreener.com/solana/${encodeURIComponent(mint)}` : "#";
}

function kolscanUrl(wallet) {
  const address = String(wallet || "").trim();
  return address ? `https://kolscan.io/account/${encodeURIComponent(address)}` : "https://kolscan.io";
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
    state.activeTab = "dashboard";
    await loadAll();
  } catch (error) {
    setError(error.message);
  }
}

async function createAccountAndConnectWallet() {
  setError("");
  try {
    if (!state.user) {
      const data = await api("/api/web/signup", {
        method: "POST",
        body: JSON.stringify({})
      });
      state.token = data.token;
      state.user = data.user;
      setStoredToken(state.token);
      await loadAll();
    }
    state.activeTab = "profile";
    render();
    await connectBrowserWallet("solana");
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

  try {
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
  } finally {
    state.loading = false;
    render();
  }
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

async function loadKolScan(mode = state.kolMode, wallet = state.kolWallet) {
  state.kolMode = mode;
  state.kolWallet = String(wallet || "").trim();
  state.loading = true;
  state.kolLoading = true;
  state.kolStatus = state.kolWallet
    ? "Scanning custom KOL wallet..."
    : `Loading ${kolModeLabel(state.kolMode)}...`;
  setError("");
  render();

  try {
    const params = new URLSearchParams({ mode });
    if (state.kolWallet) params.set("wallet", state.kolWallet);
    const data = await api(`/api/web/kol/scan?${params.toString()}`);
    state.kolScan = data.scan;
    state.kolLastUpdatedAt = new Date().toISOString();
    state.kolStatus = data.scan?.message || `${kolModeLabel(state.kolMode)} loaded.`;
  } catch (error) {
    state.kolStatus = error.message || "KOL scan failed.";
    throw error;
  } finally {
    state.loading = false;
    state.kolLoading = false;
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

  const userIdEl = $("[data-user-id]");
  if (userIdEl) userIdEl.textContent = state.user.id;
  $("[data-wallet-count]").textContent = state.wallets.length;
  $("[data-total-sol]").textContent = totalSol().toFixed(4);
  $("[data-position-count]").textContent = state.positions.length;
  $("[data-realized]").textContent = state.pnl?.totals?.realizedSol || "+0 SOL";
  const avatar = $("[data-user-avatar]");
  if (avatar) avatar.innerHTML = userAvatarHtml("SW");
  renderTabs();
}

function renderTabs() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.dataset.active = button.dataset.tab === state.activeTab ? "true" : "false";
  });

  const panel = $("[data-panel]");
  if (state.activeTab === "dashboard") panel.innerHTML = dashboardHtml();
  if (state.activeTab === "profile") panel.innerHTML = profileHtml();
  if (state.activeTab === "trade") panel.innerHTML = tradeHtml();
  if (state.activeTab === "bundle") panel.innerHTML = bundleHtml();
  if (state.activeTab === "volume") panel.innerHTML = volumeHtml();
  if (state.activeTab === "launch") panel.innerHTML = launchHtml();
  if (state.activeTab === "kol") panel.innerHTML = kolHtml();
  if (state.activeTab === "wallets") panel.innerHTML = walletsHtml();
  if (state.activeTab === "positions") panel.innerHTML = positionsHtml();
  if (state.activeTab === "pnl") panel.innerHTML = pnlHtml();
  if (state.activeTab === "sniper") panel.innerHTML = sniperHtml();
  syncCustomFields(panel);
}

function dashboardHtml() {
  return `
    ${accountToolsHtml()}
    ${createWalletSection()}
    <section class="panel-grid">
      ${visualCard("visual-aces", "Trade Desk", "Quick buy and sell from one wallet with .10, .50, 1 SOL, max, and percent sell buttons.")}
      ${visualCard("visual-cauldron", "Bundle + Volume", "Buy or sell across selected wallets, then manage timed exits with Volume plans.")}
      ${visualCard("visual-candle", "Launch Snipe", "Preset ticker, wallets, amount, TP/SL, and slippage, then watch live feeds until launch.")}
      ${visualCard("visual-cauldron", "KOL Tracker", "Follow KOL wallets, review their strongest current signals, then trade, bundle, or copy-plan from the same panel.")}
    </section>
    ${importWalletSection()}
    ${backupRestoreSection()}
    ${downloadsHtml()}
  `;
}

function profileHtml() {
  return `
    ${profileIntroHtml()}
    ${accountProfileSection()}
    ${connectWalletSection()}
    ${profilePfpSection()}
    ${xConnectSection()}
  `;
}

function profileIntroHtml() {
  return `
    <section class="profile-intro">
      <div>
        <h3>Profile</h3>
        <p>Save your public wallet connection, upload a panel PFP, and connect X for sharing and PFP import.</p>
      </div>
    </section>
  `;
}

function accountProfileSection() {
  const connected = state.user?.connectedWallet;
  return `
    <section class="profile-card account-profile-card">
      <div class="pfp-row">
        <div class="user-avatar" aria-hidden="true">${userAvatarHtml("SW")}</div>
        <div>
          <h3>SlimeWire Account</h3>
          <p>${connected ? `Wallet connected: ${escapeHtml(connected.shortPublicKey || shortAddress(connected.publicKey))}` : "No browser wallet connected yet."}</p>
        </div>
      </div>
      <button type="button" class="primary" data-connect-wallet="solana">Connect Wallet</button>
      <button type="button" data-tab="wallets">Open Wallets</button>
    </section>
  `;
}

function accountToolsHtml() {
  return `
    <section class="account-check-card">
      <div>
        <h3>Wallet Checks</h3>
        <p>Open balances, current token positions, or refresh everything before trading.</p>
      </div>
      <button class="primary" data-tab="wallets">Wallet Balances</button>
      <button data-tab="positions">Open Positions</button>
      <button data-refresh-all>Refresh All</button>
    </section>
  `;
}

function visualCard(className, title, body) {
  return `<article class="panel visual-card ${className}"><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></div></article>`;
}

function profilePfpSection() {
  const hasAvatar = Boolean(state.user?.avatar);
  const xHandle = state.xHandle ? `@${state.xHandle}` : "";
  return `
    <section class="create-wallet-card pfp-card">
      <div class="pfp-row">
        <div class="user-avatar" aria-hidden="true">${userAvatarHtml("SW")}</div>
        <div>
          <h3>Profile PFP</h3>
          <p>Used on the web panel and wallet rows. Uploads are compressed in your browser first, so trading speed is not affected.</p>
        </div>
      </div>
      <label>
        Upload Image
        <input data-avatar-file type="file" accept="image/png,image/jpeg,image/webp">
      </label>
      <div class="profile-actions">
        <button type="button" data-use-x-avatar ${state.xHandle ? "" : "disabled"}>${xHandle ? `Use ${escapeHtml(xHandle)} PFP` : "Use X PFP"}</button>
        ${hasAvatar ? `<button type="button" data-clear-avatar>Remove</button>` : ""}
      </div>
      <small data-avatar-status>${hasAvatar ? `PFP saved${state.user.avatarSource ? ` from ${escapeHtml(state.user.avatarSource)}` : ""}.` : "Optional. You can also connect X below and use that public profile image."}</small>
    </section>
  `;
}

function createWalletSection() {
  const connected = state.user?.connectedWallet;
  const hasAvatar = Boolean(state.user?.avatar);
  const xHandle = state.xHandle ? `@${state.xHandle}` : "";
  return `
    <section class="create-wallet-card setup-hub-card">
      <article class="setup-hub-panel">
        <h3>Create Wallet Set</h3>
        <p>Create fresh managed wallets. Backup files download immediately after creation.</p>
        <label>
          Label
          <input data-wallet-label type="text" placeholder="Ogre Web">
        </label>
        <label>
          Count
          <input data-wallet-count-input type="number" min="1" max="20" value="1">
        </label>
        <button class="primary" type="button" data-create-wallets>Create Wallets</button>
        <small data-create-wallet-status></small>
      </article>

      <article class="setup-hub-panel">
        <h3>Connect Wallet</h3>
        <p>Connect Phantom, Solflare, Backpack, or a detected Solana wallet. Public address only.</p>
        <div class="wallet-provider-buttons">
          ${browserWalletChoices().map((wallet) => `
            <button type="button" data-connect-wallet="${wallet.id}" ${wallet.detected ? "" : `title="${escapeHtml(wallet.label)} extension not detected"`}>
              ${escapeHtml(wallet.label)}
            </button>
          `).join("")}
        </div>
        <div class="connected-wallet-box">
          ${connected ? `
            <span>${escapeHtml(connected.provider || "Solana Wallet")}</span>
            <code>${escapeHtml(connected.publicKey)}</code>
            <div class="card-actions compact">
              <button type="button" data-copy="${escapeHtml(connected.publicKey)}">Copy</button>
              <a href="https://solscan.io/account/${encodeURIComponent(connected.publicKey)}" target="_blank" rel="noreferrer">Solscan</a>
              <button type="button" data-disconnect-wallet>Remove</button>
            </div>
          ` : `<small>No wallet connected yet.</small>`}
        </div>
        <small data-wallet-connect-status>${connected ? `Connected ${escapeHtml(connected.shortPublicKey || shortAddress(connected.publicKey))}.` : "Pick a wallet. Your extension will ask you to approve."}</small>
      </article>

      <article class="setup-hub-panel">
        <div class="pfp-row compact">
          <div class="user-avatar mini" aria-hidden="true">${userAvatarHtml("SW")}</div>
          <div>
            <h3>Profile PFP</h3>
            <p>Upload your panel PFP or pull your public X picture.</p>
          </div>
        </div>
        <label>
          Upload Image
          <input data-avatar-file type="file" accept="image/png,image/jpeg,image/webp">
        </label>
        <div class="profile-actions">
          <button type="button" data-use-x-avatar ${state.xHandle ? "" : "disabled"}>${xHandle ? `Use ${escapeHtml(xHandle)} PFP` : "Use X PFP"}</button>
          ${hasAvatar ? `<button type="button" data-clear-avatar>Remove</button>` : ""}
        </div>
        <small data-avatar-status>${hasAvatar ? `PFP saved${state.user.avatarSource ? ` from ${escapeHtml(state.user.avatarSource)}` : ""}.` : "Optional. Connect X first if you want to use your X PFP."}</small>
      </article>

      <article class="setup-hub-panel">
        <h3>Connect X</h3>
        <p>Save your handle for share buttons, watch posts, and PFP import.</p>
        <label>
          X Handle
          <input data-x-handle type="text" placeholder="@yourhandle" value="${escapeHtml(state.xHandle ? `@${state.xHandle}` : "")}">
        </label>
        <div class="profile-actions">
          <button type="button" class="primary" data-connect-x>${state.xHandle ? "Update X" : "Connect X"}</button>
          ${state.xHandle ? `<button type="button" data-clear-x>Disconnect</button>` : ""}
        </div>
        <small data-x-status>${state.xHandle ? `Connected as @${escapeHtml(state.xHandle)}.` : "Local to this browser. No X password or API key is stored."}</small>
      </article>
    </section>
  `;
}

function connectWalletSection() {
  const connected = state.user?.connectedWallet;
  return `
    <section class="create-wallet-card wallet-connect-card">
      <div>
        <h3>Connect Wallet</h3>
        <p>Connect Phantom, Solflare, Backpack, or another browser Solana wallet. This saves the public address only; it never imports private keys.</p>
      </div>
      <div class="wallet-provider-buttons">
        ${browserWalletChoices().map((wallet) => `
          <button type="button" data-connect-wallet="${wallet.id}" ${wallet.detected ? "" : `title="${escapeHtml(wallet.label)} extension not detected"`}>
            ${escapeHtml(wallet.label)}
          </button>
        `).join("")}
      </div>
      <div class="connected-wallet-box">
        ${connected ? `
          <span>${escapeHtml(connected.provider || "Solana Wallet")}</span>
          <code>${escapeHtml(connected.publicKey)}</code>
          <div class="card-actions compact">
            <button type="button" data-copy="${escapeHtml(connected.publicKey)}">Copy</button>
            <a href="https://solscan.io/account/${encodeURIComponent(connected.publicKey)}" target="_blank" rel="noreferrer">Solscan</a>
            <button type="button" data-disconnect-wallet>Remove</button>
          </div>
        ` : `
          <span>No browser wallet connected yet.</span>
          <small>Use this for identity, quick copying, and future non-custodial features. Managed bot wallets stay separate.</small>
        `}
      </div>
      <small data-wallet-connect-status>${connected ? `Connected ${escapeHtml(connected.shortPublicKey || shortAddress(connected.publicKey))}.` : "Pick a wallet above. The wallet extension will ask you to approve the connection."}</small>
    </section>
  `;
}

function xConnectSection() {
  return `
    <section class="create-wallet-card x-connect-card">
      <div>
        <h3>Connect X</h3>
        <p>Save your X handle to unlock fast share buttons for PnL cards, trades, scanner picks, watchlists, KOL signals, and launch watches. Posts always open in X for you to review first.</p>
      </div>
      <label>
        X Handle
        <input data-x-handle type="text" placeholder="@yourhandle" value="${escapeHtml(state.xHandle ? `@${state.xHandle}` : "")}">
      </label>
      <button type="button" class="primary" data-connect-x>${state.xHandle ? "Update X" : "Connect X"}</button>
      ${state.xHandle ? `<button type="button" data-clear-x>Disconnect</button>` : ""}
      <small data-x-status>${state.xHandle ? `Connected as @${escapeHtml(state.xHandle)}. Share buttons will tag ${escapeHtml(shareSiteUrl)}.` : `Connect is local to this browser. No X password or API key is stored.`}</small>
    </section>
    <section class="create-wallet-card x-watch-card">
      <div>
        <h3>Share Watch</h3>
        <p>Post a coin, CA, ticker, or KOL you are watching without buying. Good for calls, watchlists, and community alerts.</p>
      </div>
      <label>
        Coin / CA / Ticker
        <input data-share-watch-token type="text" placeholder="Example: $OGRE or token CA">
      </label>
      <label>
        KOL Wallet / Handle
        <input data-share-watch-kol type="text" placeholder="Example: @kol or wallet address">
      </label>
      <div class="share-watch-actions">
        <button type="button" class="primary" data-share-watch-token-btn>Share Coin</button>
        <button type="button" data-share-watch-kol-btn>Share KOL</button>
      </div>
      <small data-share-watch-status></small>
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

function xShareButton(text, label = "Share X") {
  return `<button type="button" data-share-x data-share-text="${escapeHtml(text)}">${escapeHtml(label)}</button>`;
}

function shareTextWithSite(text) {
  const base = String(text || "").replace(/\s+/g, " ").trim();
  const body = base.length > 210 ? `${base.slice(0, 207).trim()}...` : base;
  return `${body} Traded on SlimeWire.`;
}

function tradeShareText(row) {
  const isBuy = row.type === "buy";
  const amount = isBuy ? `${row.spentSol} SOL` : `${row.netSol} SOL`;
  return `${isBuy ? "Bought" : "Sold"} ${row.shortMint || shortAddress(row.tokenMint)} for ${amount} from the Ogre Trade Panel.`;
}

function bundleShareText(row) {
  const action = row.type === "bundle_sell" ? "Bundle sold" : row.source === "web_bundle_plan" ? "Armed bundle auto-exit" : "Bundle bought";
  return `${action} ${row.shortMint || shortAddress(row.tokenMint)} across ${row.successCount || 0}/${row.walletCount || 0} wallet(s).`;
}

function planShareText(row, label = "Armed timed trade") {
  return `${label} on ${row.shortMint || shortAddress(row.tokenMint)} with ${row.successCount || 0}/${row.walletCount || 0} wallet(s), TP ${row.takeProfitSummary || `+${row.takeProfitPct}%`}, SL ${row.stopLossSummary || `-${row.stopLossPct}%`}.`;
}

function pnlShareText(row) {
  return `PnL on ${row.shortMint || shortAddress(row.tokenMint)}: ${row.realizedSol} realized, ${row.buys} buy(s), ${row.sells} sell(s).`;
}

function positionShareText(position) {
  return `Watching ${position.shortMint || shortAddress(position.tokenMint)}: ${position.uiAmount} tokens across ${position.walletCount} wallet(s), PnL ${position.openPnlSol || position.realizedSol || "tracking"}.`;
}

function sniperShareText(row) {
  return `Watching ${row.symbol || shortAddress(row.tokenMint)} from ${state.scan?.label || "OgreSniper"}: score ${row.score}/100, MC ${row.marketCapLabel}, liq ${row.liquidityLabel}.`;
}

function kolShareText(row) {
  return `KOL signal ${row.symbol || shortAddress(row.tokenMint)}: score ${row.score || 0}/100, value ${row.valueLabel || "$0"}, signal ${row.winRateLabel || "n/a"}.`;
}

function kolProfileShareText(kol) {
  const name = kol.twitter ? `@${kol.twitter}` : kol.name || kol.shortWallet || shortAddress(kol.wallet);
  return `Watching KOL ${name}: realized ${kol.realizedLabel || "n/a"}, ROI ${kol.roiLabel || "n/a"}, trades ${kol.trades ?? "n/a"}.`;
}

function launchShareText(watch) {
  return `Watching $${watch.ticker} with Launch Snipe: ${watch.walletCount} wallet(s), ${watch.amountSol} SOL each, TP ${watch.takeProfitSummary || `+${watch.takeProfitPct}%`}, SL ${watch.stopLossSummary || `-${watch.stopLossPct}%`}.`;
}

function manualCoinWatchShareText(value) {
  const text = String(value || "").trim();
  return `Watching ${text.startsWith("$") ? text : text.length > 30 ? shortAddress(text) : `$${text.replace(/^\$+/, "")}`} from the Ogre Trade Panel.`;
}

function manualKolWatchShareText(value) {
  const text = String(value || "").trim();
  const label = text.startsWith("@") ? text : text.length > 30 ? shortAddress(text) : `@${text.replace(/^@+/, "")}`;
  return `Watching KOL ${label} from the Ogre Trade Panel.`;
}

function userAvatarHtml(fallback = "SW") {
  const avatar = String(state.user?.avatar || "").trim();
  if (isSafeAvatarSrc(avatar)) {
    return `<img src="${escapeHtml(avatar)}" alt="">`;
  }
  const label = String(fallback || "SW").trim().slice(0, 2).toUpperCase() || "SW";
  return `<span>${escapeHtml(label)}</span>`;
}

function isSafeAvatarSrc(value) {
  const text = String(value || "").trim();
  return /^data:image\/(png|jpe?g|webp);base64,/i.test(text) || /^https:\/\/[^\s"'<>]+$/i.test(text);
}

function xAvatarUrl(handle) {
  const clean = cleanXHandle(handle);
  return clean ? `https://unavatar.io/twitter/${encodeURIComponent(clean)}` : "";
}

function kolAvatarSrc(kol = {}) {
  const avatar = String(kol.avatar || kol.image || "").trim();
  if (isSafeAvatarSrc(avatar)) return avatar;
  const directHandle = cleanXHandle(kol.twitter || kol.x || kol.username || "");
  if (directHandle) return xAvatarUrl(directHandle);
  const nameHandle = cleanXHandle(kol.name || kol.kolName || "");
  return nameHandle && nameHandle.length >= 2 ? xAvatarUrl(nameHandle) : "";
}

function kolAvatarLabel(kol = {}) {
  const text = String(kol.twitter || kol.name || kol.kolName || kol.shortWallet || kol.wallet || "KO").trim();
  return text.replace(/^@+/, "").slice(0, 2).toUpperCase() || "KO";
}

function kolAvatarMarkup(kol = {}, className = "kol-avatar") {
  const src = kolAvatarSrc(kol);
  return src
    ? `<img class="${escapeHtml(className)}" src="${escapeHtml(src)}" alt="">`
    : `<div class="${escapeHtml(className)} kol-avatar-fallback" aria-hidden="true">${escapeHtml(kolAvatarLabel(kol))}</div>`;
}

function browserWalletChoices() {
  return [
    { id: "phantom", label: "Phantom", detected: Boolean(walletProviderById("phantom")) },
    { id: "solflare", label: "Solflare", detected: Boolean(walletProviderById("solflare")) },
    { id: "backpack", label: "Backpack", detected: Boolean(walletProviderById("backpack")) },
    { id: "solana", label: "Detected Wallet", detected: Boolean(walletProviderById("solana")) }
  ];
}

function walletProviderById(id) {
  if (id === "phantom") return window.phantom?.solana || (window.solana?.isPhantom ? window.solana : null);
  if (id === "solflare") return window.solflare || (window.solana?.isSolflare ? window.solana : null);
  if (id === "backpack") return window.backpack?.solana || null;
  if (id === "solana") return window.solana || window.solflare || window.phantom?.solana || window.backpack?.solana || null;
  return null;
}

function walletProviderLabel(id, provider) {
  if (id === "phantom") return "Phantom";
  if (id === "solflare") return "Solflare";
  if (id === "backpack") return "Backpack";
  if (provider?.isPhantom) return "Phantom";
  if (provider?.isSolflare) return "Solflare";
  if (provider?.isBackpack) return "Backpack";
  return "Solana Wallet";
}

function shortAddress(value) {
  const text = String(value || "");
  return text.length > 10 ? `${text.slice(0, 4)}...${text.slice(-4)}` : text || "token";
}

function tradeHtml() {
  if (!state.wallets.length) {
    return `${createWalletSection()}${emptyState("No wallets loaded yet", "Create a wallet set above, restore a backup, or import a wallet. After one wallet is saved, the Trade buttons unlock automatically.")}`;
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
          <select data-trade-slippage data-custom-select="trade-slippage">
            <option value="300">3% - tighter</option>
            <option value="400" selected>4% - default</option>
            <option value="500">5% - faster fills</option>
            <option value="custom">Custom</option>
          </select>
          <input data-trade-slippage-custom data-custom-for="trade-slippage" type="number" min="1" max="5000" step="1" placeholder="Custom bps" hidden>
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
          <p>Uses encrypted managed wallets, Jupiter routes, safety precheck, slippage settings, and the same fee logic as the Telegram bot.</p>
        </article>
        <article>
          <h3>Selected Token</h3>
          <code>${state.tradeToken ? escapeHtml(state.tradeToken) : "Paste a CA or tap Trade from a scanner pick."}</code>
          ${state.tradeToken ? `<div class="card-actions">${xShareButton(manualCoinWatchShareText(state.tradeToken), "Share Watch")}</div>` : ""}
        </article>
        <article>
          <h3>Balance Check</h3>
          <p>Refresh wallet balances and open positions without leaving this account.</p>
          <div class="card-actions">
            <button data-refresh-all>Refresh Balances</button>
            <button data-tab="positions">Positions</button>
          </div>
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
        ${xShareButton(tradeShareText(row))}
        <a href="${escapeHtml(row.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `;
}

function bundleHtml() {
  if (!state.wallets.length) {
    return `${createWalletSection()}${emptyState("No wallets loaded yet", "Create or restore wallets above first. Bundle works after the web account has managed wallets saved.")}`;
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
            <select data-bundle-percent data-custom-select="bundle-percent">
              <option value="25">25%</option>
              <option value="50">50%</option>
              <option value="100" selected>100%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-bundle-percent-custom data-custom-for="bundle-percent" type="number" min="1" max="100" step="1" placeholder="Custom %" hidden>
          </label>
          <label>
            Slippage
            <select data-bundle-slippage data-custom-select="bundle-slippage">
              <option value="300">3%</option>
              <option value="400" selected>4%</option>
              <option value="500">5%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-bundle-slippage-custom data-custom-for="bundle-slippage" type="number" min="1" max="5000" step="1" placeholder="Custom bps" hidden>
          </label>
        </div>
        <div class="trade-block">
          <div>
            <h4>Auto Exit After Bundle Buy</h4>
            <p>Optional timed plan for selected wallets. Use presets or type custom targets like 500 or 5x.</p>
          </div>
          <div class="volume-grid">
            <label>
              Fallback Sell
              <select data-bundle-plan-delay data-custom-select="bundle-plan-delay">
                <option value="5s">5 sec</option>
                <option value="1">1 min</option>
                <option value="5" selected>5 min</option>
                <option value="15">15 min</option>
                <option value="60">1 hour</option>
                <option value="custom">Custom</option>
              </select>
              <input data-bundle-plan-delay-custom data-custom-for="bundle-plan-delay" type="text" placeholder="Custom: 45s or 120" hidden>
            </label>
            <label>
              Take Profit
              <select data-bundle-plan-tp data-custom-select="bundle-plan-tp">
                <option value="25">+25%</option>
                <option value="60" selected>+60%</option>
                <option value="100">+100%</option>
                <option value="250">+250%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-bundle-plan-tp-custom data-custom-for="bundle-plan-tp" type="text" placeholder="Custom: 500 or 5x" hidden>
            </label>
            <label>
              Stop Loss
              <select data-bundle-plan-sl data-custom-select="bundle-plan-sl">
                <option value="0">Off</option>
                <option value="8">-8%</option>
                <option value="10" selected>-10%</option>
                <option value="15">-15%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-bundle-plan-sl-custom data-custom-for="bundle-plan-sl" type="text" placeholder="Custom SL %" hidden>
            </label>
            <label>
              Repeat
              <select data-bundle-plan-loop data-custom-select="bundle-plan-loop">
                <option value="1" selected>1x</option>
                <option value="5">5x</option>
                <option value="10">10x</option>
                <option value="custom">Custom</option>
              </select>
              <input data-bundle-plan-loop-custom data-custom-for="bundle-plan-loop" type="number" min="1" max="10" step="1" placeholder="Custom 1-10" hidden>
            </label>
            <label>
              Repeat Wait
              <select data-bundle-plan-loop-delay data-custom-select="bundle-plan-loop-delay">
                <option value="0" selected>No wait</option>
                <option value="5s">5 sec</option>
                <option value="30s">30 sec</option>
                <option value="1">1 min</option>
                <option value="5">5 min</option>
                <option value="custom">Custom</option>
              </select>
              <input data-bundle-plan-loop-delay-custom data-custom-for="bundle-plan-loop-delay" type="text" placeholder="Custom: 30s or 2" hidden>
            </label>
            <label>
              Timer Sell
              <select data-bundle-plan-sell-percent data-custom-select="bundle-plan-sell-percent">
                <option value="50">50%</option>
                <option value="80">80%</option>
                <option value="100" selected>100%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-bundle-plan-sell-percent-custom data-custom-for="bundle-plan-sell-percent" type="number" min="1" max="100" step="1" placeholder="Custom %" hidden>
            </label>
          </div>
          ${walletExitTargetsHtml("bundle-plan")}
          <button class="primary" data-bundle-plan>Bundle Buy + Auto Exits</button>
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
          <div class="card-actions">
            <button data-refresh-all>Refresh Balances</button>
            <button data-tab="positions">Positions</button>
          </div>
        </article>
        <article>
          <h3>Copy Trade / KOL Tracker</h3>
          <p>Use KOL signals as the CA source, then send them into Bundle or arm a copy plan with the exits above.</p>
          <div class="card-actions">
            <button data-tab="kol">Open KOL Tracker</button>
            ${state.bundleToken ? xShareButton(manualCoinWatchShareText(state.bundleToken), "Share Token") : ""}
          </div>
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

  const title = state.bundleResult.source === "web_bundle_plan"
    ? "Bundle Auto Exit Plan"
    : state.bundleResult.type === "bundle_sell" ? "Bundle Sell" : "Bundle Buy";
  return `
    <article class="latest-trade">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(state.bundleResult.message || "")}</p>
      <div class="mini-results">
        ${(state.bundleResult.results || []).map((row) => `<span data-ok="${row.ok ? "true" : "false"}">${escapeHtml(row.message)}</span>`).join("")}
      </div>
      <div class="card-actions">
        <button data-copy="${escapeHtml(state.bundleResult.tokenMint)}">Copy CA</button>
        ${xShareButton(bundleShareText(state.bundleResult))}
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

function fieldValue(selectSelector, customSelector, fallback = "") {
  const selected = $(selectSelector)?.value || fallback;
  if (selected !== "custom") return selected;
  const custom = $(customSelector)?.value?.trim();
  if (!custom) throw new Error("Enter the custom value first.");
  return custom;
}

function walletExitTargetsHtml(prefix) {
  return `
    <div class="trade-block">
      <div>
        <h4>Wallet-by-Wallet Exits</h4>
        <p>Optional for multi-wallet entries. Leave on Same to use the normal TP/SL above, or spread targets across wallets.</p>
      </div>
      <div class="volume-grid">
        <label>
          TP Targets
          <select data-${prefix}-wallet-tp data-custom-select="${prefix}-wallet-tp">
            <option value="" selected>Same TP for all</option>
            <option value="spread:25:60">Spread +25% to +60%</option>
            <option value="spread:40:100">Spread +40% to +100%</option>
            <option value="spread:60:250">Spread +60% to +250%</option>
            <option value="custom">Custom list</option>
          </select>
          <input data-${prefix}-wallet-tp-custom data-custom-for="${prefix}-wallet-tp" type="text" placeholder="Example: 25,40,60 or spread:25:100" hidden>
        </label>
        <label>
          SL Targets
          <select data-${prefix}-wallet-sl data-custom-select="${prefix}-wallet-sl">
            <option value="" selected>Same SL for all</option>
            <option value="spread:6:10">Spread -6% to -10%</option>
            <option value="spread:8:15">Spread -8% to -15%</option>
            <option value="spread:10:20">Spread -10% to -20%</option>
            <option value="custom">Custom list</option>
          </select>
          <input data-${prefix}-wallet-sl-custom data-custom-for="${prefix}-wallet-sl" type="text" placeholder="Example: 8,10,12 or spread:8:15" hidden>
        </label>
      </div>
    </div>
  `;
}

function readWalletExitTargets(prefix) {
  return {
    walletTakeProfitTargets: fieldValue(`[data-${prefix}-wallet-tp]`, `[data-${prefix}-wallet-tp-custom]`, ""),
    walletStopLossTargets: fieldValue(`[data-${prefix}-wallet-sl]`, `[data-${prefix}-wallet-sl-custom]`, "")
  };
}

function syncCustomFields(root = document) {
  root.querySelectorAll("[data-custom-for]").forEach((input) => {
    const select = [...document.querySelectorAll("[data-custom-select]")]
      .find((item) => item.dataset.customSelect === input.dataset.customFor);
    const isCustom = select?.value === "custom";
    input.hidden = !isCustom;
    if (!isCustom) input.value = "";
  });
}

function volumeHtml() {
  if (!state.wallets.length) {
    return `${createWalletSection()}${emptyState("No wallets loaded yet", "Create or restore a wallet above first. Volume plans need a saved wallet so they can buy and watch exits.")}`;
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
            <select data-volume-delay data-custom-select="volume-delay">
              <option value="5s">5 sec</option>
              <option value="1">1 min</option>
              <option value="5" selected>5 min</option>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="60">1 hour</option>
              <option value="custom">Custom</option>
            </select>
            <input data-volume-delay-custom data-custom-for="volume-delay" type="text" placeholder="Custom: 45s, 2, 2h" hidden>
          </label>
          <label>
            Take Profit
            <select data-volume-tp data-custom-select="volume-tp">
              <option value="0">Off</option>
              <option value="15">+15%</option>
              <option value="25" selected>+25%</option>
              <option value="50">+50%</option>
              <option value="100">+100%</option>
              <option value="250">+250%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-volume-tp-custom data-custom-for="volume-tp" type="text" placeholder="Custom: 500 or 5x" hidden>
          </label>
          <label>
            Stop Loss
            <select data-volume-sl data-custom-select="volume-sl">
              <option value="0">Off</option>
              <option value="8" selected>-8%</option>
              <option value="10">-10%</option>
              <option value="15">-15%</option>
              <option value="25">-25%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-volume-sl-custom data-custom-for="volume-sl" type="text" placeholder="Custom SL %" hidden>
          </label>
          <label>
            Repeat
            <select data-volume-loop data-custom-select="volume-loop">
              <option value="1" selected>1x</option>
              <option value="5">5x</option>
              <option value="10">10x</option>
              <option value="custom">Custom</option>
            </select>
            <input data-volume-loop-custom data-custom-for="volume-loop" type="number" min="1" max="10" step="1" placeholder="Custom 1-10" hidden>
          </label>
          <label>
            Repeat Wait
            <select data-volume-loop-delay data-custom-select="volume-loop-delay">
              <option value="0" selected>No wait</option>
              <option value="5s">5 sec</option>
              <option value="30s">30 sec</option>
              <option value="1">1 min</option>
              <option value="5">5 min</option>
              <option value="custom">Custom</option>
            </select>
            <input data-volume-loop-delay-custom data-custom-for="volume-loop-delay" type="text" placeholder="Custom: 30s or 2" hidden>
          </label>
          <label>
            Timer Sell
            <select data-volume-sell-percent data-custom-select="volume-sell-percent">
              <option value="50">50%</option>
              <option value="80">80%</option>
              <option value="100" selected>100%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-volume-sell-percent-custom data-custom-for="volume-sell-percent" type="number" min="1" max="100" step="1" placeholder="Custom %" hidden>
          </label>
          <label>
            Slippage
            <select data-volume-slippage data-custom-select="volume-slippage">
              <option value="300">3%</option>
              <option value="400" selected>4%</option>
              <option value="500">5%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-volume-slippage-custom data-custom-for="volume-slippage" type="number" min="1" max="5000" step="1" placeholder="Custom bps" hidden>
          </label>
        </div>

        ${walletExitTargetsHtml("volume")}
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
        <article>
          <h3>After Entry</h3>
          <p>Refresh balances or view positions after a plan buys or exits.</p>
          <div class="card-actions">
            <button data-refresh-all>Refresh Balances</button>
            <button data-tab="positions">Positions</button>
          </div>
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
        <div><dt>TP / SL</dt><dd>${escapeHtml(row.takeProfitSummary || `+${row.takeProfitPct}%`)} / ${escapeHtml(row.stopLossSummary || `-${row.stopLossPct}%`)}</dd></div>
        <div><dt>Repeat</dt><dd>${escapeHtml(row.loopCount)}x</dd></div>
        <div><dt>Repeat Wait</dt><dd>${escapeHtml(row.loopDelaySeconds || 0)} sec</dd></div>
        <div><dt>Timer Sell</dt><dd>${escapeHtml(row.sellPercent || 100)}%</dd></div>
      </dl>
      ${row.results?.length ? `<div class="mini-results">${row.results.map((item) => `<span data-ok="${item.ok ? "true" : "false"}">${escapeHtml(item.message || item)}</span>`).join("")}</div>` : ""}
      <div class="card-actions">
        <button data-copy="${escapeHtml(row.tokenMint)}">Copy CA</button>
        ${xShareButton(planShareText(row, "Armed volume plan"))}
        <a href="${escapeHtml(row.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `;
}

function launchHtml() {
  if (!state.wallets.length) {
    return `${createWalletSection()}${emptyState("No wallets loaded yet", "Create or restore wallets above first. Launch Snipe needs selected wallets before it can watch and buy a ticker.")}`;
  }

  return `
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Launch Snipe</h3>
            <p>Preset the ticker, wallets, SOL amount, exits, and slippage. The bot keeps scanning until that ticker appears.</p>
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
            <select data-launch-tp data-custom-select="launch-tp">
              <option value="0">Off</option>
              <option value="25">+25%</option>
              <option value="40" selected>+40%</option>
              <option value="60">+60%</option>
              <option value="100">+100%</option>
              <option value="250">+250%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-launch-tp-custom data-custom-for="launch-tp" type="text" placeholder="Custom: 500 or 5x" hidden>
          </label>
          <label>
            Stop Loss
            <select data-launch-sl data-custom-select="launch-sl">
              <option value="0">Off</option>
              <option value="8" selected>-8%</option>
              <option value="10">-10%</option>
              <option value="15">-15%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-launch-sl-custom data-custom-for="launch-sl" type="text" placeholder="Custom SL %" hidden>
          </label>
          <label>
            Fallback Sell
            <select data-launch-delay data-custom-select="launch-delay">
              <option value="5s">5 sec</option>
              <option value="1">1 min</option>
              <option value="3" selected>3 min</option>
              <option value="5">5 min</option>
              <option value="15">15 min</option>
              <option value="custom">Custom</option>
            </select>
            <input data-launch-delay-custom data-custom-for="launch-delay" type="text" placeholder="Custom: 45s, 2, 2h" hidden>
          </label>
          <label>
            Repeat
            <select data-launch-loop data-custom-select="launch-loop">
              <option value="1" selected>1x</option>
              <option value="5">5x</option>
              <option value="10">10x</option>
              <option value="custom">Custom</option>
            </select>
            <input data-launch-loop-custom data-custom-for="launch-loop" type="number" min="1" max="10" step="1" placeholder="Custom 1-10" hidden>
          </label>
          <label>
            Repeat Wait
            <select data-launch-loop-delay data-custom-select="launch-loop-delay">
              <option value="0" selected>No wait</option>
              <option value="5s">5 sec</option>
              <option value="30s">30 sec</option>
              <option value="1">1 min</option>
              <option value="5">5 min</option>
              <option value="custom">Custom</option>
            </select>
            <input data-launch-loop-delay-custom data-custom-for="launch-loop-delay" type="text" placeholder="Custom: 30s or 2" hidden>
          </label>
          <label>
            Slippage
            <select data-launch-slippage data-custom-select="launch-slippage">
              <option value="300" selected>3%</option>
              <option value="400">4%</option>
              <option value="500">5%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-launch-slippage-custom data-custom-for="launch-slippage" type="number" min="1" max="5000" step="1" placeholder="Custom bps" hidden>
          </label>
        </div>
        ${walletExitTargetsHtml("launch")}
        <button class="primary" data-launch-start>Start Launch Watch</button>
        <p class="trade-status" data-launch-status>${state.launchResult ? escapeHtml(state.launchResult.message || "Launch watch armed.") : "Ready."}</p>
      </article>

      <aside class="trade-side">
        <article>
          <h3>How It Works</h3>
          <p>It scans live launch/profile feeds about every ${escapeHtml(launchScanSeconds())} seconds while the bot is online.</p>
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
          ${xShareButton(launchShareText(watch), "Share Watch")}
          ${watch.status === "launch_watch" ? `<button data-launch-cancel="${escapeHtml(watch.id)}">Cancel</button>` : ""}
        </span>
      `).join("")}
    </div>
  `;
}

function kolHtml() {
  const configured = state.kolScan?.configured !== false;
  const disabled = state.kolLoading ? "disabled" : "";
  return `
    <section class="section-actions mode-row">
      <button data-kol-mode="hot" data-active="${state.kolMode === "hot"}" ${disabled}>Hot Buys</button>
      <button data-kol-mode="top" data-active="${state.kolMode === "top"}" ${disabled}>Top KOLs</button>
      <button data-kol-mode="consistent" data-active="${state.kolMode === "consistent"}" ${disabled}>Consistent</button>
      <button data-kol-mode="fresh" data-active="${state.kolMode === "fresh"}" ${disabled}>Fresh</button>
      <button data-kol-refresh ${disabled}>${state.kolLoading ? "Scanning..." : "Refresh"}</button>
    </section>
    <p class="scan-meta">${escapeHtml(kolModeDescription(state.kolMode))}</p>
    ${kolScanStatusHtml()}
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>KOL Copy Setup</h3>
            <p>Pick wallets and exits once, then buy a selected KOL position, send it to Trade/Bundle, or arm Copy Wallet for the next new buy.</p>
          </div>
        </div>
        ${state.wallets.length ? `
          <div class="wallet-checks">
            ${walletChecksHtml("kol")}
          </div>
          ${walletGroupHtml("kol")}
        ` : `
          <p class="trade-status">KOL viewing works now. Create, restore, or import a wallet before using Copy Plan to trade.</p>
          <button class="secondary" data-tab="wallets">Open Wallets</button>
        `}
        <div class="volume-grid">
          <label>
            Buy Per Wallet
            <input data-kol-amount type="number" min="0" step="0.01" value="0.1">
          </label>
          <label>
            Take Profit
            <select data-kol-tp data-custom-select="kol-tp">
              <option value="0">Off</option>
              <option value="15">+15%</option>
              <option value="25" selected>+25%</option>
              <option value="40">+40%</option>
              <option value="60">+60%</option>
              <option value="100">+100%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-kol-tp-custom data-custom-for="kol-tp" type="text" placeholder="Custom: 500 or 5x" hidden>
          </label>
          <label>
            Stop Loss
            <select data-kol-sl data-custom-select="kol-sl">
              <option value="0">Off</option>
              <option value="8" selected>-8%</option>
              <option value="10">-10%</option>
              <option value="15">-15%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-kol-sl-custom data-custom-for="kol-sl" type="text" placeholder="Custom SL %" hidden>
          </label>
          <label>
            Fallback Sell
            <select data-kol-delay data-custom-select="kol-delay">
              <option value="5s">5 sec</option>
              <option value="1">1 min</option>
              <option value="5" selected>5 min</option>
              <option value="15">15 min</option>
              <option value="60">1 hour</option>
              <option value="custom">Custom</option>
            </select>
            <input data-kol-delay-custom data-custom-for="kol-delay" type="text" placeholder="Custom: 45s, 2, 2h" hidden>
          </label>
          <label>
            Repeat
            <select data-kol-loop data-custom-select="kol-loop">
              <option value="1" selected>1x</option>
              <option value="5">5x</option>
              <option value="10">10x</option>
              <option value="custom">Custom</option>
            </select>
            <input data-kol-loop-custom data-custom-for="kol-loop" type="number" min="1" max="10" step="1" placeholder="Custom 1-10" hidden>
          </label>
          <label>
            Repeat Wait
            <select data-kol-loop-delay data-custom-select="kol-loop-delay">
              <option value="0" selected>No wait</option>
              <option value="5s">5 sec</option>
              <option value="30s">30 sec</option>
              <option value="1">1 min</option>
              <option value="5">5 min</option>
              <option value="custom">Custom</option>
            </select>
            <input data-kol-loop-delay-custom data-custom-for="kol-loop-delay" type="text" placeholder="Custom: 30s or 2" hidden>
          </label>
          <label>
            Slippage
            <select data-kol-slippage data-custom-select="kol-slippage">
              <option value="300">3%</option>
              <option value="400" selected>4%</option>
              <option value="500">5%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-kol-slippage-custom data-custom-for="kol-slippage" type="number" min="1" max="5000" step="1" placeholder="Custom bps" hidden>
          </label>
        </div>
        ${walletExitTargetsHtml("kol")}
        <p class="trade-status" data-kol-status>${state.kolResult ? escapeHtml(state.kolResult.message || "KOL copy plan armed.") : configured ? "Ready. Tap Buy Position on a signal below, or Copy Wallet after scanning a public wallet." : "Paste a public wallet for a free holdings scan, or use the links on the right for outside KOL context."}</p>
        ${kolResultHtml()}
      </article>

      <aside class="trade-side">
        <article>
          <h3>Custom KOL Wallet</h3>
          <p>Paste any public Solana wallet to inspect current holdings, open KOLscan, or arm copy-watch from your selected wallets.</p>
          <label>
            Wallet Address
            <input data-kol-wallet type="text" placeholder="Paste KOL wallet" value="${escapeHtml(state.kolWallet || "")}">
          </label>
          <div class="card-actions">
            <button data-kol-wallet-scan ${disabled}>${state.kolLoading ? "Scanning..." : "Scan Wallet"}</button>
            ${state.kolWallet ? `<button class="primary" data-kol-copy-wallet="${escapeHtml(state.kolWallet)}" ${disabled}>Copy Wallet Next Buy</button>` : ""}
            ${state.kolWallet ? xShareButton(manualKolWatchShareText(state.kolWallet), "Share KOL") : ""}
          </div>
        </article>
        <article>
          <h3>KOL Tools</h3>
          <p>Open outside KOL dashboards for extra wallet context, then come back here to trade, bundle, or copy from your saved wallets.</p>
          <div class="card-actions">
            <a href="https://kolscan.io/trades" target="_blank" rel="noreferrer">KOLscan Trades</a>
            <a href="https://kolscan.io/leaderboard" target="_blank" rel="noreferrer">KOLscan Leaderboard</a>
          </div>
        </article>
      </aside>
    </section>
    ${state.kolScan?.kols?.length ? kolSummaryHtml() : ""}
    ${state.kolScan ? kolRowsHtml() : emptyState("No KOL scan loaded", "Pick a KOL mode or tap Refresh.")}
  `;
}

function kolScanStatusHtml() {
  const scan = state.kolScan || null;
  const status = state.kolStatus
    || scan?.message
    || `Pick ${kolModeLabel(state.kolMode)} or tap Refresh.`;
  const details = scan
    ? ` ${Number(scan.kolCount || scan.kols?.length || 0)} KOL wallet(s), ${Number(scan.rows?.length || 0)} token signal(s).`
    : "";
  const updated = state.kolLastUpdatedAt ? ` Last updated ${formatDate(state.kolLastUpdatedAt)}.` : "";
  return `<p class="trade-status kol-status">${escapeHtml(`${status}${state.kolLoading ? "" : details}${updated}`)}</p>`;
}

function kolModeLabel(mode) {
  const map = {
    hot: "Hot Buys",
    top: "Top KOLs",
    consistent: "Consistent",
    fresh: "Fresh"
  };
  return map[mode] || map.hot;
}

function kolModeDescription(mode) {
  const map = {
    hot: "Recent high-performing KOLs and the strongest current positions they are holding.",
    top: "Best ranked KOL wallets by realized performance, then their highest-value current token positions.",
    consistent: "KOLs ranked by consistency/win rate from the available leaderboard, then filtered into cleaner copyable positions.",
    fresh: "KOL wallets with the newest activity first, useful when you want faster signal flow."
  };
  return map[mode] || map.hot;
}

function kolResultHtml() {
  const row = state.kolResult;
  if (!row?.results?.length) return "";
  return `<div class="mini-results">${row.results.map((item) => `<span data-ok="${item.ok ? "true" : "false"}">${escapeHtml(item.message || item)}</span>`).join("")}</div>`;
}

function kolSummaryHtml() {
  const scan = state.kolScan || {};
  const kols = (scan.kols || []).filter((kol) => kol.wallet || kol.twitter);
  if (!kols.length || scan.configured === false) return "";
  return `
    <section class="kol-dashboard">
      <div class="trade-head">
        <div>
          <h3>${escapeHtml(scan.label || "KOL Tracker")}</h3>
          <p>${escapeHtml(scan.message || "Live KOL leaderboard loaded.")}</p>
        </div>
        <span>${escapeHtml(scan.kolCount || kols.length)} tracked</span>
      </div>
      <div class="kol-grid">
        ${kols.slice(0, 12).map((kol, index) => `
          <article class="kol-profile">
            ${kolAvatarMarkup(kol)}
            <div class="pick-top">
              <span>${index + 1}</span>
              <h3>${escapeHtml(kol.name || kol.shortWallet || "KOL Wallet")}</h3>
              <em>${escapeHtml(kol.winRateLabel || "n/a")}</em>
            </div>
            <p>${kol.twitter ? `@${escapeHtml(kol.twitter)}` : escapeHtml(kol.shortWallet || kol.wallet || "")}</p>
            <dl>
              <div><dt>Realized</dt><dd>${escapeHtml(kol.realizedLabel || "n/a")}</dd></div>
              <div><dt>ROI</dt><dd>${escapeHtml(kol.roiLabel || "n/a")}</dd></div>
              <div><dt>Trades</dt><dd>${escapeHtml(kol.trades ?? "n/a")}</dd></div>
            </dl>
            <small>${escapeHtml(kol.volumeLabel || "Volume n/a")} | Last trade: ${escapeHtml(formatDate(kol.lastTradeAt))}</small>
            <div class="card-actions">
              ${kol.solscanUrl ? `<a href="${escapeHtml(kol.solscanUrl)}" target="_blank" rel="noreferrer">Wallet</a>` : ""}
              ${kol.kolscanUrl || kol.wallet ? `<a href="${escapeHtml(kol.kolscanUrl || kolscanUrl(kol.wallet))}" target="_blank" rel="noreferrer">KOLscan</a>` : ""}
              ${xShareButton(kolProfileShareText(kol), "Share Watch")}
              ${kol.wallet ? `<button data-kol-scan-wallet="${escapeHtml(kol.wallet)}">Scan Positions</button>` : ""}
              ${kol.wallet ? `<button data-kol-copy-wallet="${escapeHtml(kol.wallet)}">Copy Wallet</button>` : ""}
              ${kol.wallet ? `<button data-copy="${escapeHtml(kol.wallet)}">Copy Address</button>` : ""}
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function kolRowsHtml() {
  const scan = state.kolScan || {};
  if (scan.configured === false) {
    return emptyState("KOL Tracker is not connected yet", scan.message || "Use Scan Wallet for a public wallet, or try again later.");
  }
  if (!scan.rows?.length) {
    return emptyState(
      scan.kols?.length ? "No token signals on this refresh" : "No KOL signals found",
      scan.message || "Try Refresh or another mode."
    );
  }
  return `
    <section class="pick-grid">
      ${scan.rows.slice(0, 12).map((row, index) => {
        const isCluster = row.source === "made_on_sol_hot" && !row.kolWallet;
        const kolLabel = isCluster ? "KOLs" : "KOL";
        const kolValue = isCluster ? (row.winRateLabel || row.kolName || "cluster") : (row.kolName || "Unknown");
        const roiLabel = isCluster ? "Market Cap" : "KOL ROI";
        const realizedLabel = isCluster ? "Buys" : "Realized";
        return `
          <article class="pick-card kol-card">
            ${kolAvatarMarkup(row, "kol-avatar small")}
            <div class="pick-top">
              <span>${index + 1}</span>
              <h3>${escapeHtml(row.symbol || "KOL Signal")}</h3>
              <em>${escapeHtml(row.signalType || "KOL signal")}</em>
            </div>
            <p>${escapeHtml(row.name || "")}</p>
            <code>${escapeHtml(row.tokenMint)}</code>
            <dl>
              <div><dt>Score</dt><dd>${escapeHtml(row.score || 0)}/100</dd></div>
              <div><dt>${kolLabel}</dt><dd>${escapeHtml(kolValue)}</dd></div>
              <div><dt>Value</dt><dd>${escapeHtml(row.valueLabel || "$0")}</dd></div>
              <div><dt>Signal</dt><dd>${escapeHtml(row.winRateLabel || "n/a")}</dd></div>
              <div><dt>${roiLabel}</dt><dd>${escapeHtml(row.roiLabel || "n/a")}</dd></div>
              <div><dt>${realizedLabel}</dt><dd>${escapeHtml(row.realizedLabel || "n/a")}</dd></div>
            </dl>
            <div class="card-actions">
            <button data-kol-copy="${escapeHtml(row.tokenMint)}">Buy Position</button>
            <button data-kol-trade="${escapeHtml(row.tokenMint)}">Trade</button>
            <button data-kol-bundle="${escapeHtml(row.tokenMint)}">Bundle</button>
            ${xShareButton(kolShareText(row), "Share Signal")}
            ${row.kolWallet ? `<button data-kol-copy-wallet="${escapeHtml(row.kolWallet)}">Copy Wallet</button>` : ""}
            <a href="${escapeHtml(row.dexUrl)}" target="_blank" rel="noreferrer">Chart</a>
              ${row.kolscanUrl || row.kolWallet ? `<a href="${escapeHtml(row.kolscanUrl || kolscanUrl(row.kolWallet))}" target="_blank" rel="noreferrer">KOLscan</a>` : ""}
              <button data-copy="${escapeHtml(row.tokenMint)}">Copy CA</button>
            </div>
          </article>
        `;
      }).join("")}
    </section>
  `;
}

async function createWalletSet() {
  const labelInput = $("[data-wallet-label]");
  const countInput = $("[data-wallet-count-input]");
  const status = $("[data-create-wallet-status]");
  if (!labelInput || !countInput || !status) return;
  const buttons = [...document.querySelectorAll("[data-create-wallets]")];
  setError("");
  status.textContent = "Creating wallets...";
  buttons.forEach((button) => {
    button.disabled = true;
    button.textContent = "Creating...";
  });

  try {
    const count = Number.parseInt(countInput.value || "1", 10);
    if (!Number.isInteger(count) || count < 1 || count > 20) {
      throw new Error("Wallet count must be from 1 to 20.");
    }
    const data = await api("/api/web/wallets/create", {
      method: "POST",
      body: JSON.stringify({
        label: labelInput.value.trim() || "Ogre Web",
        count
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
    setError(error.message);
  } finally {
    buttons.forEach((button) => {
      button.disabled = false;
      button.textContent = "Create Wallets";
    });
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

function connectXAccount() {
  const input = $("[data-x-handle]");
  const status = $("[data-x-status]");
  const handle = cleanXHandle(input?.value || "");
  if (!handle) {
    if (status) status.textContent = "Enter a valid X handle first.";
    return;
  }
  state.xHandle = handle;
  setStoredXHandle(handle);
  if (status) status.textContent = `Connected as @${handle}. Share buttons now open X with SlimeWire tagged.`;
  render();
}

function disconnectXAccount() {
  state.xHandle = "";
  clearStoredXHandle();
  render();
}

async function updateProfileAvatar(payload, statusText = "Saving PFP...") {
  const status = $("[data-avatar-status]");
  if (status) status.textContent = statusText;
  try {
    const data = await api("/api/web/profile/avatar", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.user = data.user || {
      ...state.user,
      avatar: data.profile?.avatarDataUrl || data.profile?.avatarUrl || "",
      avatarSource: data.profile?.avatarSource || "",
      avatarUpdatedAt: data.profile?.avatarUpdatedAt || ""
    };
    if (status) status.textContent = state.user.avatar ? "PFP saved." : "PFP removed.";
    render();
  } catch (error) {
    if (status) status.textContent = error.message;
    setError(error.message);
  }
}

async function uploadProfileAvatar(input) {
  const status = $("[data-avatar-status]");
  const file = input?.files?.[0];
  if (!file) return;
  if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
    if (status) status.textContent = "Use a PNG, JPG, or WebP image.";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    if (status) status.textContent = "Use an image under 5 MB.";
    return;
  }
  try {
    if (status) status.textContent = "Compressing PFP...";
    const avatarDataUrl = await imageFileToAvatarDataUrl(file);
    await updateProfileAvatar({ avatarDataUrl }, "Saving compressed PFP...");
  } catch (error) {
    if (status) status.textContent = error.message;
    setError(error.message);
  } finally {
    input.value = "";
  }
}

function imageFileToAvatarDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load that image."));
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("This browser cannot resize images."));
          return;
        }
        const scale = Math.max(size / img.width, size / img.height);
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const x = Math.round((size - width) / 2);
        const y = Math.round((size - height) / 2);
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, x, y, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.84);
        if (dataUrl.length > 220_000) {
          reject(new Error("Compressed PFP is still too large. Try a simpler image."));
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

async function useXProfileAvatar() {
  const url = xAvatarUrl(state.xHandle);
  if (!url) {
    const status = $("[data-avatar-status]");
    if (status) status.textContent = "Connect an X handle first.";
    return;
  }
  await updateProfileAvatar({ avatarUrl: url, avatarSource: "x" }, "Saving X PFP...");
}

async function connectBrowserWallet(providerId) {
  const status = $("[data-wallet-connect-status]");
  const provider = walletProviderById(providerId);
  if (!provider) {
    if (status) status.textContent = `${walletProviderLabel(providerId)} is not detected in this browser. Install/open the wallet extension, then refresh.`;
    return;
  }

  try {
    if (status) status.textContent = `Opening ${walletProviderLabel(providerId, provider)}...`;
    const result = await provider.connect?.({ onlyIfTrusted: false });
    const publicKey = result?.publicKey || provider.publicKey;
    const publicKeyText = publicKey?.toBase58?.() || publicKey?.toString?.() || "";
    if (!publicKeyText) throw new Error("Wallet connected, but no public address was returned.");
    const data = await api("/api/web/profile/connected-wallet", {
      method: "POST",
      body: JSON.stringify({
        publicKey: publicKeyText,
        provider: walletProviderLabel(providerId, provider)
      })
    });
    state.user = data.user || {
      ...state.user,
      connectedWallet: data.profile?.connectedWallet || null
    };
    if (status) status.textContent = `Connected ${shortAddress(publicKeyText)}.`;
    render();
  } catch (error) {
    if (status) status.textContent = error.message || "Wallet connection was cancelled.";
  }
}

async function disconnectBrowserWallet() {
  const status = $("[data-wallet-connect-status]");
  try {
    const providerName = state.user?.connectedWallet?.provider || "";
    const provider = providerName.toLowerCase().includes("phantom")
      ? walletProviderById("phantom")
      : providerName.toLowerCase().includes("solflare")
        ? walletProviderById("solflare")
        : providerName.toLowerCase().includes("backpack")
          ? walletProviderById("backpack")
          : walletProviderById("solana");
    await provider?.disconnect?.();
  } catch {
    // Some wallet extensions do not expose disconnect. Clearing the saved public address is enough.
  }

  try {
    const data = await api("/api/web/profile/connected-wallet", {
      method: "POST",
      body: JSON.stringify({ clear: true })
    });
    state.user = data.user || {
      ...state.user,
      connectedWallet: null
    };
    if (status) status.textContent = "Connected wallet removed.";
    render();
  } catch (error) {
    if (status) status.textContent = error.message;
    setError(error.message);
  }
}

function cleanXHandle(value) {
  return String(value || "")
    .trim()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_]/gi, "")
    .slice(0, 15);
}

function openXShare(rawText) {
  const text = shareTextWithSite(rawText);
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareSiteUrl)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function shareManualWatch(type) {
  const isKol = type === "kol";
  const input = isKol ? $("[data-share-watch-kol]") : $("[data-share-watch-token]");
  const status = $("[data-share-watch-status]");
  const value = input?.value?.trim() || "";
  if (!value) {
    if (status) status.textContent = isKol ? "Enter a KOL handle or wallet first." : "Enter a coin, ticker, or CA first.";
    return;
  }
  openXShare(isKol ? manualKolWatchShareText(value) : manualCoinWatchShareText(value));
  if (status) status.textContent = isKol ? "KOL watch post opened in X." : "Coin watch post opened in X.";
}

async function fetchPnlCardBlob(tokenMint) {
  const headers = {};
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetchWithTimeout(apiUrl(`/api/web/pnl/card?tokenMint=${encodeURIComponent(tokenMint)}`), {
    headers,
    cache: "no-store"
  }, 30_000);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.error || `Could not build PnL card (${response.status}).`);
  }
  return {
    blob: await response.blob(),
    filename: response.headers.get("x-ogre-filename") || `pnl-card-${shortAddress(tokenMint)}.png`
  };
}

async function downloadPnlCard(tokenMint) {
  const { blob, filename } = await fetchPnlCardBlob(tokenMint);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function sharePnlCard(tokenMint, shareText) {
  try {
    const { blob, filename } = await fetchPnlCardBlob(tokenMint);
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: "SlimeWire PnL Card",
        text: shareTextWithSite(shareText),
        url: shareSiteUrl,
        files: [file]
      });
      return;
    }
    await downloadPnlCard(tokenMint);
    openXShare(`${shareText} PnL card downloaded and ready to attach.`);
  } catch (error) {
    setError(error.message);
  }
}

function readTradeForm() {
  const walletIndex = $("[data-trade-wallet]")?.value || "";
  const tokenMint = $("[data-trade-token]")?.value?.trim() || "";
  const slippageBps = fieldValue("[data-trade-slippage]", "[data-trade-slippage-custom]", "400");
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
  const sellDelay = fieldValue("[data-volume-delay]", "[data-volume-delay-custom]", "5");
  const takeProfitPct = fieldValue("[data-volume-tp]", "[data-volume-tp-custom]", "25");
  const stopLossPct = fieldValue("[data-volume-sl]", "[data-volume-sl-custom]", "8");
  const loopCount = fieldValue("[data-volume-loop]", "[data-volume-loop-custom]", "1");
  const loopDelay = fieldValue("[data-volume-loop-delay]", "[data-volume-loop-delay-custom]", "0");
  const sellPercent = fieldValue("[data-volume-sell-percent]", "[data-volume-sell-percent-custom]", "100");
  const slippageBps = fieldValue("[data-volume-slippage]", "[data-volume-slippage-custom]", "400");
  if (!walletIndexes.length && !walletGroup) throw new Error("Choose at least one wallet or enter a group label.");
  if (!tokenMint) throw new Error("Paste a token CA first.");
  state.volumeToken = tokenMint;
  return { walletIndexes, walletGroup, tokenMint, amountSol, sellDelay, takeProfitPct, stopLossPct, loopCount, loopDelay, sellPercent, slippageBps, ...readWalletExitTargets("volume") };
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
  const sellDelay = fieldValue("[data-sniper-delay]", "[data-sniper-delay-custom]", state.scanMode === "pumpsnipe" ? "3" : "5");
  const takeProfitPct = fieldValue("[data-sniper-tp]", "[data-sniper-tp-custom]", state.scanMode === "pumpsnipe" ? "40" : "25");
  const stopLossPct = fieldValue("[data-sniper-sl]", "[data-sniper-sl-custom]", "8");
  const loopCount = fieldValue("[data-sniper-loop]", "[data-sniper-loop-custom]", "1");
  const loopDelay = fieldValue("[data-sniper-loop-delay]", "[data-sniper-loop-delay-custom]", "0");
  const slippageBps = fieldValue("[data-sniper-slippage]", "[data-sniper-slippage-custom]", state.scanMode === "pumpsnipe" ? "300" : "400");
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
    loopCount,
    loopDelay,
    ...readWalletExitTargets("sniper")
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

function setKolStatus(message) {
  const status = $("[data-kol-status]");
  if (status) status.textContent = message;
}

function readKolPlanForm(tokenMint) {
  const walletIndexes = checkedWalletIndexes("kol");
  const walletGroup = $("[data-kol-group]")?.value?.trim() || "";
  const amountSol = $("[data-kol-amount]")?.value || "";
  const sellDelay = fieldValue("[data-kol-delay]", "[data-kol-delay-custom]", "5");
  const takeProfitPct = fieldValue("[data-kol-tp]", "[data-kol-tp-custom]", "25");
  const stopLossPct = fieldValue("[data-kol-sl]", "[data-kol-sl-custom]", "8");
  const loopCount = fieldValue("[data-kol-loop]", "[data-kol-loop-custom]", "1");
  const loopDelay = fieldValue("[data-kol-loop-delay]", "[data-kol-loop-delay-custom]", "0");
  const slippageBps = fieldValue("[data-kol-slippage]", "[data-kol-slippage-custom]", "400");
  if (!walletIndexes.length && !walletGroup) throw new Error("Choose at least one wallet or enter a group label.");
  if (!tokenMint) throw new Error("Pick a KOL signal first.");
  state.tradeToken = tokenMint;
  state.volumeToken = tokenMint;
  state.bundleToken = tokenMint;
  return { tokenMint, walletIndexes, walletGroup, amountSol, sellDelay, takeProfitPct, stopLossPct, loopCount, loopDelay, sellPercent: "100", slippageBps, ...readWalletExitTargets("kol") };
}

function readKolWalletCopyForm(copyWallet) {
  const walletIndexes = checkedWalletIndexes("kol");
  const walletGroup = $("[data-kol-group]")?.value?.trim() || "";
  const amountSol = $("[data-kol-amount]")?.value || "";
  const sellDelay = fieldValue("[data-kol-delay]", "[data-kol-delay-custom]", "5");
  const takeProfitPct = fieldValue("[data-kol-tp]", "[data-kol-tp-custom]", "25");
  const stopLossPct = fieldValue("[data-kol-sl]", "[data-kol-sl-custom]", "8");
  const loopCount = fieldValue("[data-kol-loop]", "[data-kol-loop-custom]", "1");
  const loopDelay = fieldValue("[data-kol-loop-delay]", "[data-kol-loop-delay-custom]", "0");
  const slippageBps = fieldValue("[data-kol-slippage]", "[data-kol-slippage-custom]", "400");
  const wallet = String(copyWallet || state.kolWallet || $("[data-kol-wallet]")?.value || "").trim();
  if (!walletIndexes.length && !walletGroup) throw new Error("Choose at least one wallet or enter a group label.");
  if (!wallet) throw new Error("Paste or choose a KOL wallet first.");
  return { copyWallet: wallet, walletIndexes, walletGroup, amountSol, sellDelay, takeProfitPct, stopLossPct, loopCount, loopDelay, sellPercent: "100", slippageBps, ...readWalletExitTargets("kol") };
}

async function createKolCopyPlan(tokenMint) {
  try {
    const payload = readKolPlanForm(tokenMint);
    setKolStatus("Buying and arming KOL copy plan...");
    const data = await api("/api/web/kol/entry", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.kolResult = data.plan;
    await loadAll();
    state.activeTab = "kol";
    render();
  } catch (error) {
    setKolStatus(error.message);
  }
}

async function createKolCopyWallet(copyWallet) {
  try {
    const payload = readKolWalletCopyForm(copyWallet);
    setKolStatus("Arming Copy Wallet watch...");
    const data = await api("/api/web/kol/copy-wallet", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.kolResult = data.plan;
    state.kolWallet = payload.copyWallet;
    state.activeTab = "kol";
    render();
  } catch (error) {
    setKolStatus(error.message);
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
  const percent = fieldValue("[data-bundle-percent]", "[data-bundle-percent-custom]", "100");
  const slippageBps = fieldValue("[data-bundle-slippage]", "[data-bundle-slippage-custom]", "400");
  if (!tokenMint) throw new Error("Paste a token CA first.");
  if (!walletIndexes.length && !walletGroup) throw new Error("Choose at least one wallet or enter a group label.");
  state.bundleToken = tokenMint;
  return { tokenMint, walletIndexes, walletGroup, amountSol, percent, slippageBps };
}

function readBundlePlanForm() {
  const payload = readBundleForm();
  return {
    ...payload,
    sellDelay: fieldValue("[data-bundle-plan-delay]", "[data-bundle-plan-delay-custom]", "5"),
    takeProfitPct: fieldValue("[data-bundle-plan-tp]", "[data-bundle-plan-tp-custom]", "60"),
    stopLossPct: fieldValue("[data-bundle-plan-sl]", "[data-bundle-plan-sl-custom]", "10"),
    loopCount: fieldValue("[data-bundle-plan-loop]", "[data-bundle-plan-loop-custom]", "1"),
    loopDelay: fieldValue("[data-bundle-plan-loop-delay]", "[data-bundle-plan-loop-delay-custom]", "0"),
    sellPercent: fieldValue("[data-bundle-plan-sell-percent]", "[data-bundle-plan-sell-percent-custom]", "100"),
    ...readWalletExitTargets("bundle-plan")
  };
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

async function executeBundlePlan() {
  try {
    const payload = readBundlePlanForm();
    setBundleStatus("Buying and arming bundle exits...");
    const data = await api("/api/web/bundle/plan", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.bundleResult = data.plan;
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
  const takeProfitPct = fieldValue("[data-launch-tp]", "[data-launch-tp-custom]", "40");
  const stopLossPct = fieldValue("[data-launch-sl]", "[data-launch-sl-custom]", "8");
  const sellDelay = fieldValue("[data-launch-delay]", "[data-launch-delay-custom]", "3");
  const loopCount = fieldValue("[data-launch-loop]", "[data-launch-loop-custom]", "1");
  const loopDelay = fieldValue("[data-launch-loop-delay]", "[data-launch-loop-delay-custom]", "0");
  const slippageBps = fieldValue("[data-launch-slippage]", "[data-launch-slippage-custom]", "300");
  if (!ticker) throw new Error("Enter a ticker to watch.");
  if (!walletIndexes.length && !walletGroup) throw new Error("Choose at least one wallet or enter a group label.");
  return { ticker, walletIndexes, walletGroup, amountSol, takeProfitPct, stopLossPct, sellDelay, loopCount, loopDelay, slippageBps, ...readWalletExitTargets("launch") };
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
    ${walletBalanceSummaryHtml()}
    <section class="account-check-card">
      <div>
        <h3>Wallet Actions</h3>
        <p>Refresh balances, view token positions, or open KOL Tracker from the same account.</p>
      </div>
      <button class="primary" data-refresh-all>Refresh Balances</button>
      <button data-tab="positions">View Positions</button>
      <button data-tab="kol">Open KOL Tracker</button>
    </section>
    <div class="table-list">
      ${state.wallets.map((wallet) => `
        <article class="row-card">
          <div class="wallet-row-main">
            <div class="user-avatar mini" aria-hidden="true">${userAvatarHtml(String(wallet.index))}</div>
            <div>
            <strong>${wallet.index}. ${escapeHtml(wallet.label)}</strong>
            <code>${wallet.publicKey}</code>
            ${walletBalanceLine(wallet)}
            </div>
          </div>
          <button data-copy="${wallet.publicKey}">Copy</button>
        </article>
      `).join("")}
    </div>
  `;
}

function walletBalanceSummaryHtml() {
  const tokenTotal = state.balances.reduce((sum, row) => sum + Number(row.tokens?.length || 0), 0);
  const errorCount = state.balances.filter((row) => row.error).length;
  return `
    <section class="pnl-summary wallet-summary">
      <div><span>Wallets</span><strong>${state.wallets.length}</strong></div>
      <div><span>Total SOL</span><strong>${totalSol().toFixed(4)}</strong></div>
      <div><span>Token Accounts</span><strong>${tokenTotal}</strong></div>
      <div><span>Balance Errors</span><strong>${errorCount}</strong></div>
    </section>
  `;
}

function walletBalanceLine(wallet) {
  const balance = state.balances.find((row) => Number(row.index) === Number(wallet.index));
  if (!balance) return `<span>Balance: loading</span>`;
  if (balance.error) return `<span>Balance check failed: ${escapeHtml(balance.error)}</span>`;
  const sol = Number.isFinite(Number(balance.sol)) ? `${Number(balance.sol).toFixed(4)} SOL` : "SOL unavailable";
  const tokenText = Number(balance.tokens?.length || 0) === 1 ? "1 token" : `${Number(balance.tokens?.length || 0)} tokens`;
  const warnings = balance.warnings?.length ? ` | ${balance.warnings.length} warning(s)` : "";
  return `<span>Balance: ${escapeHtml(sol)} | ${escapeHtml(tokenText)}${escapeHtml(warnings)}</span>`;
}

function positionsHtml() {
  const header = `
    <section class="account-check-card">
      <div>
        <h3>Open Positions</h3>
        <p>Only current token holdings show here. Use Refresh after buys, sells, or transfers.</p>
      </div>
      <button class="primary" data-refresh-all>Refresh Positions</button>
      <button data-tab="wallets">Wallet Balances</button>
      <button data-tab="pnl">PnL History</button>
    </section>
  `;
  if (!state.positions.length) return `${header}${emptyState("No open positions", "Current token holdings will show here after a wallet holds non-zero tokens.")}`;
  return `
    ${header}
    <div class="table-list">
      ${state.positions.map((position) => `
        <article class="row-card position">
          <div>
            <strong>${position.shortMint}</strong>
            <span>${position.uiAmount} tokens across ${position.walletCount} wallet(s)</span>
            <small>Value: ${position.estimatedValueSol || "unavailable"} SOL | PnL: ${position.openPnlSol || position.realizedSol}</small>
          </div>
          <div class="card-actions">
            ${xShareButton(positionShareText(position))}
            <a href="${position.dexUrl}" target="_blank" rel="noreferrer">Dex</a>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function pnlHtml() {
  const header = `
    <section class="account-check-card">
      <div>
        <h3>PnL / Results</h3>
        <p>Refresh after a trade closes, or jump back to open positions and wallet balances.</p>
      </div>
      <button class="primary" data-refresh-all>Refresh PnL</button>
      <button data-tab="positions">Open Positions</button>
      <button data-tab="wallets">Wallet Balances</button>
    </section>
  `;
  if (!state.pnl?.totals?.tradeCount) return `${header}${emptyState("No PnL yet", "Trades made through the bot will show here.")}`;
  return `
    ${header}
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
          <div class="card-actions">
            ${xShareButton(pnlShareText(row), "Share PnL")}
            <button data-pnl-card="${escapeHtml(row.tokenMint)}">Download Card</button>
            <button data-share-pnl-card="${escapeHtml(row.tokenMint)}" data-share-text="${escapeHtml(pnlShareText(row))}">Share Card</button>
            <a href="${row.dexUrl}" target="_blank" rel="noreferrer">Dex</a>
          </div>
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
    moonshot: "Low market-cap picks targeting the 4k-40k range, with fallback up to 60k only when the cleaner low-cap pool is thin.",
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
          <select data-sniper-tp data-custom-select="sniper-tp">
            <option value="0">Off</option>
            <option value="15">+15%</option>
            <option value="25" ${isPump ? "" : "selected"}>+25%</option>
            <option value="40" ${isPump ? "selected" : ""}>+40%</option>
            <option value="50">+50%</option>
            <option value="100">+100%</option>
            <option value="250">+250%</option>
            <option value="custom">Custom</option>
          </select>
          <input data-sniper-tp-custom data-custom-for="sniper-tp" type="text" placeholder="Custom: 500 or 5x" hidden>
        </label>
        <label>
          Stop Loss
          <select data-sniper-sl data-custom-select="sniper-sl">
            <option value="0">Off</option>
            <option value="8" selected>-8%</option>
            <option value="10">-10%</option>
            <option value="15">-15%</option>
            <option value="custom">Custom</option>
          </select>
          <input data-sniper-sl-custom data-custom-for="sniper-sl" type="text" placeholder="Custom SL %" hidden>
        </label>
        <label>
          Fallback Sell
          <select data-sniper-delay data-custom-select="sniper-delay">
            <option value="5s">5 sec</option>
            <option value="1">1 min</option>
            <option value="3" ${isPump ? "selected" : ""}>3 min</option>
            <option value="5" ${isPump ? "" : "selected"}>5 min</option>
            <option value="15">15 min</option>
            <option value="custom">Custom</option>
          </select>
          <input data-sniper-delay-custom data-custom-for="sniper-delay" type="text" placeholder="Custom: 45s, 2, 2h" hidden>
        </label>
        <label>
          Repeat
          <select data-sniper-loop data-custom-select="sniper-loop">
            <option value="1" selected>1x</option>
            <option value="5">5x</option>
            <option value="10">10x</option>
            <option value="custom">Custom</option>
          </select>
          <input data-sniper-loop-custom data-custom-for="sniper-loop" type="number" min="1" max="10" step="1" placeholder="Custom 1-10" hidden>
        </label>
        <label>
          Repeat Wait
          <select data-sniper-loop-delay data-custom-select="sniper-loop-delay">
            <option value="0" selected>No wait</option>
            <option value="5s">5 sec</option>
            <option value="30s">30 sec</option>
            <option value="1">1 min</option>
            <option value="5">5 min</option>
            <option value="custom">Custom</option>
          </select>
          <input data-sniper-loop-delay-custom data-custom-for="sniper-loop-delay" type="text" placeholder="Custom: 30s or 2" hidden>
        </label>
        <label>
          Slippage
          <select data-sniper-slippage data-custom-select="sniper-slippage">
            <option value="300" ${isPump ? "selected" : ""}>3%</option>
            <option value="400" ${isPump ? "" : "selected"}>4%</option>
            <option value="500">5%</option>
            <option value="custom">Custom</option>
          </select>
          <input data-sniper-slippage-custom data-custom-for="sniper-slippage" type="number" min="1" max="5000" step="1" placeholder="Custom bps" hidden>
        </label>
      </div>
      ${walletExitTargetsHtml("sniper")}
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
    <p class="scan-meta">${escapeHtml(state.scan.label)} | scored ${state.scan.scanned} | qualified ${state.scan.qualified} | mode-fit ${state.scan.modeFit} | display pool ${state.scan.displayPool || 0}</p>
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
            ${xShareButton(sniperShareText(row), "Share Pick")}
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

  if (target.matches("[data-web-signup]")) await createWebAccount();
  if (target.matches("[data-web-signup-connect]")) await createAccountAndConnectWallet();
  if (target.matches("[data-logout]")) await logout();
  if (target.matches("[data-connect-x]")) connectXAccount();
  if (target.matches("[data-clear-x]")) disconnectXAccount();
  if (target.matches("[data-use-x-avatar]")) await useXProfileAvatar();
  if (target.matches("[data-clear-avatar]")) await updateProfileAvatar({ clear: true }, "Removing PFP...");
  if (target.matches("[data-connect-wallet]")) await connectBrowserWallet(target.dataset.connectWallet);
  if (target.matches("[data-disconnect-wallet]")) await disconnectBrowserWallet();
  if (target.matches("[data-share-x]")) openXShare(target.dataset.shareText || "");
  if (target.matches("[data-share-watch-token-btn]")) shareManualWatch("token");
  if (target.matches("[data-share-watch-kol-btn]")) shareManualWatch("kol");
  if (target.matches("[data-pnl-card]")) {
    try {
      await downloadPnlCard(target.dataset.pnlCard);
    } catch (error) {
      setError(error.message);
    }
  }
  if (target.matches("[data-share-pnl-card]")) {
    await sharePnlCard(target.dataset.sharePnlCard, target.dataset.shareText || "");
  }
  if (target.matches("[data-create-wallets]")) await createWalletSet();
  if (target.matches("[data-restore-backup]")) await restoreWalletBackup();
  if (target.matches("[data-export-backup]")) await exportWalletBackup();
  if (target.matches("[data-import-wallet]")) await importWallet();
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
  if (target.matches("[data-kol-mode]")) {
    state.kolWallet = "";
    await loadKolScan(target.dataset.kolMode).catch((error) => setError(error.message));
    return;
  }
  if (target.matches("[data-kol-refresh]")) {
    await loadKolScan(state.kolMode, state.kolWallet).catch((error) => setError(error.message));
    return;
  }
  if (target.matches("[data-kol-wallet-scan]")) {
    await loadKolScan(state.kolMode, $("[data-kol-wallet]")?.value || "").catch((error) => setError(error.message));
    return;
  }
  if (target.matches("[data-kol-scan-wallet]")) {
    await loadKolScan(state.kolMode, target.dataset.kolScanWallet || "").catch((error) => setError(error.message));
    return;
  }
  if (target.matches("[data-kol-copy]")) {
    await createKolCopyPlan(target.dataset.kolCopy);
    return;
  }
  if (target.matches("[data-kol-copy-wallet]")) {
    await createKolCopyWallet(target.dataset.kolCopyWallet || "");
    return;
  }
  if (target.matches("[data-kol-trade]")) {
    state.tradeToken = target.dataset.kolTrade || "";
    state.activeTab = "trade";
    render();
    return;
  }
  if (target.matches("[data-kol-bundle]")) {
    state.bundleToken = target.dataset.kolBundle || "";
    state.activeTab = "bundle";
    render();
    return;
  }
  if (target.matches("[data-bundle-buy]")) {
    await executeBundle("buy");
  }
  if (target.matches("[data-bundle-sell]")) {
    await executeBundle("sell");
  }
  if (target.matches("[data-bundle-plan]")) {
    await executeBundlePlan();
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
    if (state.activeTab === "kol" && !state.kolScan) {
      await loadKolScan().catch((error) => setError(error.message));
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
    const originalLabel = target.getAttribute("data-copy-label") || target.textContent || "Copy";
    await navigator.clipboard.writeText(copyValue);
    target.textContent = "Copied";
    setTimeout(() => { target.textContent = originalLabel; }, 1000);
  }
});

document.addEventListener("change", async (event) => {
  const target = event.target;
  if (target?.matches?.("[data-custom-select]")) {
    syncCustomFields();
  }
  if (target?.matches?.("[data-restore-file]")) {
    await readRestoreFile(target);
  }
  if (target?.matches?.("[data-avatar-file]")) {
    await uploadProfileAvatar(target);
  }
});

loadSession();
