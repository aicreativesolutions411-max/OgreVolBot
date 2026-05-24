const config = window.OGRE_PORTAL_CONFIG || {};
const apiBase = (config.apiBase || "https://ogrevolbot.onrender.com").replace(/\/+$/, "");

const state = {
  token: localStorage.getItem("ogreWebToken") || "",
  user: null,
  status: null,
  activeTab: "dashboard",
  loading: false,
  wallets: [],
  balances: [],
  positions: [],
  pnl: null,
  scan: null,
  scanMode: "safe"
};

const $ = (selector) => document.querySelector(selector);
const app = $("[data-app]");
const loginView = $("[data-login]");
const dashboardView = $("[data-dashboard]");
const statusDot = $("[data-status-dot]");
const statusText = $("[data-status-text]");
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

  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
    cache: "no-store"
  });
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

function setStatus(kind, text) {
  statusDot.dataset.status = kind;
  statusText.textContent = text;
}

function botStartUrl() {
  if (config.telegramBotUsername) {
    return `https://t.me/${config.telegramBotUsername}?start=web`;
  }
  return "https://t.me/ogrecoinonsol";
}

async function refreshBackendStatus() {
  try {
    const response = await fetch(apiUrl("/healthz"), { cache: "no-store" });
    const data = await response.json();
    state.status = data;
    setStatus("ok", `Render online - ${Math.floor((data.uptimeSeconds || 0) / 60)}m uptime`);
  } catch (error) {
    setStatus("warn", `Render check failed: ${error.message}`);
  }
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

  await refreshBackendStatus();
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
    $("[data-api-base]").textContent = apiBase;
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
  if (state.activeTab === "wallets") panel.innerHTML = walletsHtml();
  if (state.activeTab === "positions") panel.innerHTML = positionsHtml();
  if (state.activeTab === "pnl") panel.innerHTML = pnlHtml();
  if (state.activeTab === "sniper") panel.innerHTML = sniperHtml();
}

function dashboardHtml() {
  return `
    <section class="panel-grid">
      ${visualCard("visual-aces", "Fast Flow", "Use Telegram for live trade confirms. Use this web portal for desktop monitoring, copying wallet addresses, and finding picks.")}
      ${visualCard("visual-cauldron", "Sniper Desk", "Scan modes rotate fresh picks and keep Dex links plus copyable CAs close at hand.")}
      ${visualCard("visual-candle", "Backup First", "New wallet sets send both encrypted bot backups and Solflare-style recovery files in Telegram.")}
    </section>
    <section class="profile-card">
      <div>
        <h3>Email Reminder</h3>
        <p>Add an optional email for portal reminders. It does not replace Telegram login and it never receives private keys or permanent tokens.</p>
      </div>
      <label>
        Email
        <input data-email type="email" placeholder="you@example.com" value="${escapeHtml(state.user?.email || "")}">
      </label>
      <button data-email-save>Save Email</button>
      <small data-email-status></small>
    </section>
  `;
}

function visualCard(className, title, body) {
  return `<article class="panel visual-card ${className}"><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></div></article>`;
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
  if (!state.wallets.length) return emptyState("No wallets yet", "Create or import wallets from Telegram first.");
  return `
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
      <a class="secondary-link" href="${botStartUrl()}" target="_blank" rel="noreferrer">Trade in Telegram</a>
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
  if (target.matches("[data-logout]")) logout();
  if (target.matches("[data-email-save]")) saveEmail();
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

refreshBackendStatus();
loadSession();
