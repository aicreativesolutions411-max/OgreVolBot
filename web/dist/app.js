const config = window.OGRE_PORTAL_CONFIG || {};
const configuredApiBase = String(config.apiBase || "").trim().replace(/\/+$/, "");
const sameOriginApiBase = window.location.origin.replace(/\/+$/, "");
const defaultRenderApiBase = "https://ogrevolbot.onrender.com";
const apiBase = configuredApiBase
  || (window.location.hostname.endsWith("onrender.com") ? sameOriginApiBase : defaultRenderApiBase);

const state = {
  token: localStorage.getItem("ogreWebToken") || "",
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
  downloads: null
};

const $ = (selector) => document.querySelector(selector);
const app = $("[data-app]");
const loginView = $("[data-login]");
const dashboardView = $("[data-dashboard]");
const codeInput = $("[data-login-code]");
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

function botStartUrl() {
  if (config.telegramBotUsername) {
    return `https://t.me/${config.telegramBotUsername}?start=web`;
  }
  return "https://t.me/ogretradebot?start=web";
}

function dexUrl(tokenMint) {
  const mint = String(tokenMint || "").trim();
  return mint ? `https://dexscreener.com/solana/${encodeURIComponent(mint)}` : "#";
}

async function login() {
  setError("");
  const code = codeInput.value.trim();
  if (!code) {
    setError("Paste the login code the Telegram bot sent you.");
    return;
  }

  try {
    const data = await api("/api/web/login", {
      method: "POST",
      body: JSON.stringify({ code })
    });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem("ogreWebToken", state.token);
    codeInput.value = "";
    await loadAll();
  } catch (error) {
    setError(error.message);
  }
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
    localStorage.setItem("ogreWebToken", state.token);
    await loadAll();
  } catch (error) {
    setError(error.message);
  }
}

async function requestEmailCode() {
  setError("");
  const email = document.querySelector("[data-signup-email]")?.value?.trim() || "";
  if (!email) {
    setError("Enter the email saved on your web account first.");
    return;
  }
  try {
    await api("/api/web/email-code", {
      method: "POST",
      body: JSON.stringify({ email })
    });
    setError("Email code sent. Paste it in the code box below.");
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
  localStorage.removeItem("ogreWebToken");
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
    localStorage.removeItem("ogreWebToken");
    render();
  }
}

async function loadAll() {
  state.loading = true;
  render();

  const [wallets, balances, positions, pnl] = await Promise.all([
    api("/api/web/wallets"),
    api("/api/web/balances"),
    api("/api/web/positions"),
    api("/api/web/pnl")
  ]);
  state.wallets = wallets.wallets || [];
  state.balances = balances.balances || [];
  state.positions = positions.positions || [];
  state.pnl = pnl.pnl || null;
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
    $("[data-bot-link]").href = botStartUrl();
    return;
  }

  $("[data-user-id]").textContent = state.user.id;
  const emailField = $("[data-email]");
  if (emailField && document.activeElement !== emailField) emailField.value = state.user.email || "";
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
  if (state.activeTab === "wallets") panel.innerHTML = walletsHtml();
  if (state.activeTab === "positions") panel.innerHTML = positionsHtml();
  if (state.activeTab === "pnl") panel.innerHTML = pnlHtml();
  if (state.activeTab === "sniper") panel.innerHTML = sniperHtml();
}

function dashboardHtml() {
  return `
    <section class="panel-grid">
      ${visualCard("visual-aces", "Trade Desk", "Quick buy and sell from one wallet with .10, .50, 1 SOL, max, and percent sell buttons.")}
      ${visualCard("visual-cauldron", "Sniper Scanner", "Scan modes rotate fresh picks with Dex links, copyable CAs, risk notes, and one-click handoff to Trade.")}
      ${visualCard("visual-candle", "Backup First", "Web wallet creation downloads both encrypted bot backups and Solflare-style recovery files.")}
    </section>
    ${createWalletSection()}
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
          <a class="mini-link" data-trade-dex href="${state.tradeToken ? dexUrl(state.tradeToken) : "#"}" target="_blank" rel="noreferrer">Dex</a>
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

async function saveEmail() {
  const input = $("[data-email]");
  const status = $("[data-email-status]");
  if (!input || !status) return;
  status.textContent = "Saving...";
  try {
    const data = await api("/api/web/email", {
      method: "POST",
      body: JSON.stringify({ email: input.value.trim() })
    });
    state.user.email = data.profile.email || "";
    status.textContent = data.emailSent
      ? "Saved. Reminder email sent."
      : data.emailError
        ? `Saved. Email send skipped: ${data.emailError}`
        : "Saved. Email sending is not configured on Render yet.";
  } catch (error) {
    status.textContent = error.message;
  }
}

function walletsHtml() {
  const create = `${createWalletSection()}${downloadsHtml()}`;
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
    ["safe", "Safe"],
    ["smart", "Smart"],
    ["fast", "Fast"],
    ["moonshot", "Low MC"],
    ["meme", "Meme"],
    ["long", "Long"]
  ];
  return `
    <div class="mode-row">
      ${modes.map(([mode, label]) => `<button data-scan-mode="${mode}" data-active="${state.scanMode === mode}">${label}</button>`).join("")}
    </div>
    <div class="section-actions">
      <button class="primary" data-refresh-scan>Refresh Picks</button>
      <button data-tab="trade">Trade Desk</button>
    </div>
    ${state.scan ? sniperRowsHtml() : emptyState("No scan loaded", "Pick a mode or tap Refresh Picks.")}
  `;
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

  if (target.matches("[data-login-submit]")) login();
  if (target.matches("[data-web-signup]")) createWebAccount();
  if (target.matches("[data-email-code]")) requestEmailCode();
  if (target.matches("[data-logout]")) logout();
  if (target.matches("[data-email-save]")) saveEmail();
  if (target.matches("[data-create-wallets]")) createWalletSet();
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
  if (target.matches("[data-use-token]")) {
    state.tradeToken = target.dataset.useToken || "";
    state.activeTab = "trade";
    render();
  }
  if (target.matches("[data-refresh-all]")) loadAll().catch((error) => setError(error.message));
  if (target.matches("[data-open-bot]")) window.open(botStartUrl(), "_blank", "noopener,noreferrer");

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

codeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") login();
});

loadSession();
