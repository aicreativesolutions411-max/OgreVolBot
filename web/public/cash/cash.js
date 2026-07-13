/* SlimeCash — installable PWA on SlimeWire wallet rails.
   Shares localStorage ogreWebToken with /fun and the rest of the site,
   so one SlimeWire account works everywhere. */
(() => {
  "use strict";

  const TOKEN_KEY = "ogreWebToken";
  const ACTIVITY_KEY = "slimecashActivity";
  const GUIDE_KEY = "slimecashGuide";
  const API_BASE = (window.OGRE_PORTAL_CONFIG && window.OGRE_PORTAL_CONFIG.apiBase)
    || (/^(?:www\.)?slimewire\.org$/i.test(location.hostname) ? "https://ogrevolbot.onrender.com" : "");
  const WSOL_MINT = "So11111111111111111111111111111111111111112";
  const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

  const state = {
    token: localStorage.getItem(TOKEN_KEY) || "",
    wallet: null,          // { index, publicKey }
    lamports: null,
    usdcRaw: null,
    usdc: 0,
    tokens: [],
    solUsd: 0,
    tokenUsd: {},          // mint -> priceUsd
    handle: "",
    displayHandle: "",
    amountUnit: "USD",
    sendAsset: "USDC",
    depositAsset: "USDC",
    receiveAsset: "USDC",
    funding: null,
    resolved: null,        // { address, handle } for send target
    depositTimer: null,
    deferredInstall: null,
    terminalLoaded: false
  };

  const $ = (id) => document.getElementById(id);

  /* ---------------- tiny QR encoder (byte mode, ECC L, versions 1-5, mask 0) ---------------- */
  const QR = (() => {
    const EXP = new Uint8Array(512);
    const LOG = new Uint8Array(256);
    let v = 1;
    for (let i = 0; i < 255; i++) { EXP[i] = v; LOG[v] = i; v <<= 1; if (v & 0x100) v ^= 0x11d; }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
    const gfMul = (a, b) => (a && b) ? EXP[LOG[a] + LOG[b]] : 0;

    const SPEC = { 1: [19, 7], 2: [34, 10], 3: [55, 15], 4: [80, 20], 5: [108, 26] };
    const ALIGN = { 1: 0, 2: 18, 3: 22, 4: 26, 5: 30 };
    // Format info strings for ECC L, masks 0-7 (15 bits, placement order below).
    const FORMAT_L = [
      "111011111000100", "111001011110011", "111110110101010", "111100010011101",
      "110011000101111", "110001100011000", "110110001000001", "110100101110110"
    ];

    function polyMul(p, q) {
      const r = new Array(p.length + q.length - 1).fill(0);
      for (let i = 0; i < p.length; i++) for (let j = 0; j < q.length; j++) r[i + j] ^= gfMul(p[i], q[j]);
      return r;
    }
    function rsEcc(data, degree) {
      let gen = [1];
      for (let i = 0; i < degree; i++) gen = polyMul(gen, [1, EXP[i]]);
      const buf = data.concat(new Array(degree).fill(0));
      for (let i = 0; i < data.length; i++) {
        const factor = buf[i];
        if (!factor) continue;
        for (let j = 0; j < gen.length; j++) buf[i + j] ^= gfMul(gen[j], factor);
      }
      return buf.slice(data.length);
    }

    function encode(text) {
      const bytes = new TextEncoder().encode(text);
      let version = 0;
      for (const cand of [1, 2, 3, 4, 5]) {
        if (bytes.length <= SPEC[cand][0] - 2) { version = cand; break; }
      }
      if (!version) return null;
      const [dataCw, eccCw] = SPEC[version];

      // Bit stream: mode 0100, 8-bit count, data, terminator, byte pad.
      const bits = [];
      const push = (value, count) => { for (let i = count - 1; i >= 0; i--) bits.push((value >> i) & 1); };
      push(0b0100, 4);
      push(bytes.length, 8);
      for (const b of bytes) push(b, 8);
      push(0, Math.min(4, dataCw * 8 - bits.length));
      while (bits.length % 8) bits.push(0);
      const data = [];
      for (let i = 0; i < bits.length; i += 8) {
        let byte = 0;
        for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
        data.push(byte);
      }
      const PADS = [0xec, 0x11];
      for (let i = 0; data.length < dataCw; i++) data.push(PADS[i % 2]);
      const codewords = data.concat(rsEcc(data, eccCw));

      // Matrix.
      const size = 17 + 4 * version;
      const m = Array.from({ length: size }, () => new Array(size).fill(null));
      const setFinder = (top, left) => {
        for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
          const rr = top + r, cc = left + c;
          if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
          const inner = r >= 0 && r <= 6 && c >= 0 && c <= 6;
          const ring = inner && (r === 0 || r === 6 || c === 0 || c === 6);
          const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          m[rr][cc] = inner ? ((ring || core) ? 1 : 0) : 0;
        }
      };
      setFinder(0, 0); setFinder(0, size - 7); setFinder(size - 7, 0);
      for (let i = 8; i < size - 8; i++) {
        if (m[6][i] === null) m[6][i] = i % 2 === 0 ? 1 : 0;
        if (m[i][6] === null) m[i][6] = i % 2 === 0 ? 1 : 0;
      }
      const ap = ALIGN[version];
      if (ap) {
        for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++) {
          const ring = Math.max(Math.abs(r), Math.abs(c));
          m[ap + r][ap + c] = ring === 1 ? 0 : 1;
        }
      }
      m[4 * version + 9][8] = 1; // dark module

      // Reserve format areas so data placement skips them.
      for (let i = 0; i <= 8; i++) {
        if (m[8][i] === null) m[8][i] = 0;
        if (m[i][8] === null) m[i][8] = 0;
      }
      for (let i = 0; i < 8; i++) {
        if (m[size - 1 - i][8] === null) m[size - 1 - i][8] = 0;
        if (m[8][size - 1 - i] === null) m[8][size - 1 - i] = 0;
      }

      // Data placement: zigzag right-to-left, skipping column 6, with mask 0.
      let bitIndex = 0;
      const totalBits = codewords.length * 8;
      const bitAt = (i) => (codewords[i >> 3] >> (7 - (i & 7))) & 1;
      let upward = true;
      for (let col = size - 1; col > 0; col -= 2) {
        if (col === 6) col = 5;
        for (let step = 0; step < size; step++) {
          const row = upward ? size - 1 - step : step;
          for (const cc of [col, col - 1]) {
            if (m[row][cc] !== null) continue;
            let bit = bitIndex < totalBits ? bitAt(bitIndex) : 0;
            bitIndex++;
            if ((row + cc) % 2 === 0) bit ^= 1; // mask 0
            m[row][cc] = bit;
          }
        }
        upward = !upward;
      }

      // Format info (ECC L, mask 0) — both copies.
      const fmt = FORMAT_L[0];
      const F = (i) => Number(fmt[i]);
      m[8][0] = F(0); m[8][1] = F(1); m[8][2] = F(2); m[8][3] = F(3); m[8][4] = F(4); m[8][5] = F(5);
      m[8][7] = F(6); m[8][8] = F(7); m[7][8] = F(8);
      m[5][8] = F(9); m[4][8] = F(10); m[3][8] = F(11); m[2][8] = F(12); m[1][8] = F(13); m[0][8] = F(14);
      for (let i = 0; i < 7; i++) m[size - 1 - i][8] = F(i);
      for (let i = 7; i < 15; i++) m[8][size - 15 + i] = F(i);

      return m;
    }

    function draw(canvas, text) {
      const m = encode(text);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (!m) return false;
      const quiet = 4;
      const cells = m.length + quiet * 2;
      const px = Math.floor(canvas.width / cells);
      const offset = Math.floor((canvas.width - px * cells) / 2) + quiet * px;
      ctx.fillStyle = "#000000";
      for (let r = 0; r < m.length; r++) for (let c = 0; c < m.length; c++) {
        if (m[r][c]) ctx.fillRect(offset + c * px, offset + r * px, px, px);
      }
      return true;
    }

    return { draw };
  })();

  /* ---------------- api ---------------- */
  async function api(method, path, body) {
    const headers = { "Content-Type": "application/json" };
    if (state.token) headers.Authorization = `Bearer ${state.token}`;
    try {
      const response = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
      const isJson = /application\/json/i.test(response.headers.get("content-type") || "");
      if (!isJson) {
        return { ok: false, status: response.status, data: { error: "SlimeCash could not reach the account service. Try again." } };
      }
      const data = await response.json().catch(() => ({}));
      return { ok: response.ok && data.ok !== false, status: response.status, data };
    } catch {
      return { ok: false, status: 0, data: { error: "Network error. Check your connection." } };
    }
  }
  const get = (path) => api("GET", path);
  const post = (path, body) => api("POST", path, body || {});

  function setToken(token) {
    state.token = token || "";
    if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY);
  }

  function downloadText(filename, text) {
    if (!text) return;
    try {
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "slimecash-backup.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch { toast("Backup is ready, but the download was blocked. Tap Back up account in Profile.", true); }
  }

  function downloadWalletFiles(downloads) {
    if (downloads?.encryptedBackup?.text) downloadText(downloads.encryptedBackup.filename, downloads.encryptedBackup.text);
    if (downloads?.recoveryKeys?.text) downloadText(downloads.recoveryKeys.filename, downloads.recoveryKeys.text);
  }

  async function backupCashAccount({ includeWallets = false, quiet = false } = {}) {
    if (!state.token) return false;
    const account = await post("/api/web/cash/account-backup", {});
    if (!account.ok || !account.data.accountBackup?.text) {
      if (!quiet) toast(account.data.error || "Could not prepare the account backup.", true);
      return false;
    }
    downloadText(account.data.accountBackup.filename, account.data.accountBackup.text);

    if (includeWallets) {
      const wallets = await post("/api/web/wallets/export", {});
      if (wallets.ok) downloadWalletFiles(wallets.data.backup?.downloads);
      else if (!quiet) toast(wallets.data.error || "Account saved, but wallet backup failed.", true);
    }
    if (!quiet) toast(includeWallets ? "Account + wallet backups downloaded" : "Account recovery backup downloaded");
    return true;
  }

  function openRecovery() {
    $("recoveryText").value = "";
    $("recoveryStatus").textContent = "";
    $("recoveryStatus").className = "status";
    openSheet("recovery");
  }

  function runningStandalone() {
    return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
  }

  function cashAppInstalled() {
    return runningStandalone() && new URLSearchParams(location.search).get("src") === "slimecash-pwa";
  }

  function openInstallGuide() {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent || "");
    const embedded = runningStandalone();
    const dedicated = location.hostname === "app.slimewire.org";
    $("openInstallBrowserBtn").textContent = dedicated ? "Install SlimeCash" : "Open separate install page";
    $("installSteps").innerHTML = (embedded ? (ios ? [
      "1. SlimeCash is open inside the SlimeWire app right now.",
      "2. Copy the install link below, then choose Open in Safari from your app menu.",
      "3. In Safari, Share → Add to Home Screen for a separate SlimeCash icon."
    ] : [
      "1. SlimeCash is open inside the SlimeWire app right now.",
      "2. Tap Open install page in browser below.",
      "3. In Chrome, choose Install app for a separate SlimeCash icon."
    ]) : dedicated && ios ? [
      "1. You are on the separate SlimeCash install origin.",
      "2. Tap Share in Safari, then Add to Home Screen.",
      "3. Confirm Add for its own SlimeCash icon."
    ] : dedicated ? [
      "1. Tap Install SlimeCash below.",
      "2. Confirm the browser install prompt.",
      "3. SlimeCash appears as a separate app from SlimeWire."
    ] : ios ? [
      "1. Tap the Share button in Safari.",
      "2. Choose Add to Home Screen.",
      "3. Tap Add — the separate SlimeCash app appears with its green dollar icon."
    ] : [
      "1. Open your browser menu (⋮).",
      "2. Tap Install app or Add to Home screen.",
      "3. Confirm Install — SlimeCash opens as its own app."
    ]).map((step) => `<div>${escapeHtml(step)}</div>`).join("");
    openSheet("installguide");
  }

  async function installCashApp() {
    if (cashAppInstalled()) { toast("SlimeCash is already installed"); return; }
    if (state.deferredInstall) {
      const promptEvent = state.deferredInstall;
      state.deferredInstall = null;
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice.catch(() => null);
      if (choice?.outcome === "accepted") { toast("SlimeCash installed"); return; }
    }
    openInstallGuide();
  }

  function openInstallPageInBrowser() {
    const dedicatedHost = "app.slimewire.org";
    if (location.hostname === dedicatedHost) {
      installCashApp();
      return;
    }
    const url = `https://${dedicatedHost}/cash/?install=1`;
    if (/android/i.test(navigator.userAgent || "")) {
      location.href = `intent://${dedicatedHost}/cash/?install=1#Intent;scheme=https;package=com.android.chrome;end`;
      return;
    }
    if (runningStandalone()) {
      copyText(url);
      toast("Install link copied — use Open in Safari/Chrome from your app menu");
      return;
    }
    window.open(url, "_blank", "noopener");
  }

  async function restoreCashAccount() {
    const value = $("recoveryText").value.trim();
    const status = $("recoveryStatus");
    const button = $("recoveryBtn");
    if (!value) {
      status.textContent = "Choose your SlimeCash account backup or paste the recovery key.";
      status.className = "status bad";
      return;
    }
    button.disabled = true;
    button.textContent = "Restoring…";
    const result = await post("/api/web/cash/recover", { key: value });
    button.disabled = false;
    button.textContent = "Restore account";
    if (!result.ok || !result.data.token) {
      status.textContent = result.data.error || "That recovery key could not be restored.";
      status.className = "status bad";
      return;
    }
    setToken(result.data.token);
    sessionStorage.setItem("slimecashRecovered", result.data.legacyKey
      ? "Account restored. Download the new permanent recovery backup from Profile."
      : "Account restored — your handle and wallets are back.");
    location.reload();
  }

  async function ensureAccount() {
    if (state.token) return true;
    const result = await post("/api/web/signup", {});
    if (result.ok && result.data.token) {
      setToken(result.data.token);
      return true;
    }
    toast(result.data.error || "Could not create your account.", true);
    return false;
  }

  async function ensureWallet() {
    let result = await get("/api/web/wallets");
    if (result.status === 401) { setToken(""); return null; }
    if (!result.ok) return null;
    let rows = (result.data.wallets || []).filter((row) => !row.volumeBot && !row.sessionWallet);
    if (!rows.length) {
      const created = await post("/api/web/wallets/create", { label: "SlimeCash", count: 1 });
      if (!created.ok) { toast(created.data.error || "Could not create a wallet.", true); return null; }
      downloadWalletFiles(created.data.downloads);
      // The create response already has the new wallet. Paint immediately
      // instead of waiting on another wallet-store + balance round trip.
      rows = (created.data.wallets || []).filter((row) => !row.volumeBot && !row.sessionWallet);
      if (!rows.length) {
        result = await get("/api/web/wallets");
        rows = (result.data.wallets || []).filter((row) => !row.volumeBot && !row.sessionWallet);
      }
    }
    if (!rows.length) return null;
    state.wallet = { index: rows[0].index, publicKey: rows[0].publicKey };
    return state.wallet;
  }

  /* ---------------- pricing (client-side DexScreener, same pattern as the terminal) ---------------- */
  async function refreshSolPrice() {
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${WSOL_MINT}`);
      const data = await response.json();
      const pairs = (data.pairs || []).filter((pair) => Number(pair.liquidity?.usd) > 100000);
      pairs.sort((a, b) => Number(b.liquidity?.usd || 0) - Number(a.liquidity?.usd || 0));
      const price = Number(pairs[0]?.priceUsd || 0);
      if (price > 0) state.solUsd = price;
    } catch { /* keep last price */ }
  }

  async function refreshTokenPrices(mints) {
    const wanted = mints.filter((mint) => mint !== USDC_MINT).slice(0, 10);
    state.tokenUsd[USDC_MINT] = 1;
    if (!wanted.length) return;
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${wanted.join(",")}`);
      const data = await response.json();
      const best = {};
      for (const pair of data.pairs || []) {
        const mint = pair.baseToken?.address;
        if (!mint) continue;
        const liq = Number(pair.liquidity?.usd || 0);
        if (!best[mint] || liq > best[mint].liq) best[mint] = { liq, price: Number(pair.priceUsd || 0) };
      }
      for (const [mint, entry] of Object.entries(best)) {
        if (entry.price > 0) state.tokenUsd[mint] = entry.price;
      }
    } catch { /* best effort */ }
  }

  /* ---------------- balance ---------------- */
  async function refreshBalance({ silent = false } = {}) {
    if (!state.token) return;
    const result = await get("/api/web/cash/assets");
    if (result.status === 401) { setToken(""); showOnboard(); return; }
    if (!result.ok) { if (!silent) toast(result.data.error || "Could not load balance.", true); return; }
    const previousSol = state.lamports;
    const previousUsdc = state.usdcRaw;
    state.lamports = Number(result.data.assets?.SOL?.rawAmount || 0);
    state.usdcRaw = Number(result.data.assets?.USDC?.rawAmount || 0);
    state.usdc = Number(result.data.assets?.USDC?.uiAmount || 0);
    if (result.data.wallet?.address) state.wallet = { index: result.data.wallet.index, publicKey: result.data.wallet.address };
    renderBalance();
    if (previousUsdc !== null && state.usdcRaw > previousUsdc) {
      const gainedUsdc = (state.usdcRaw - previousUsdc) / 1e6;
      addActivity({ type: "in", title: "USDC arrived", sub: "Digital dollars landed on Solana", amountUsd: gainedUsdc, at: Date.now() });
      toast(`+$${gainedUsdc.toFixed(2)} USDC added — ready to use`);
      $("depositWatch").textContent = `+$${gainedUsdc.toFixed(2)} USDC received`;
      $("depositWatch").className = "status ok";
      renderActivity();
    }
    if (previousSol !== null && state.lamports > previousSol + 10000) {
      const gainedSol = (state.lamports - previousSol) / 1e9;
      addActivity({ type: "in", title: "Deposit arrived", sub: "SOL landed in your wallet", amountUsd: gainedSol * state.solUsd, at: Date.now() });
      toast(`+${formatUsd(gainedSol * state.solUsd)} added — ready to use`);
      $("depositWatch").textContent = `+${gainedSol.toFixed(4)} SOL received`;
      $("depositWatch").className = "status ok";
      renderActivity();
    }
  }

  function totalUsd() {
    const sol = (state.lamports || 0) / 1e9;
    return state.usdc + sol * state.solUsd;
  }

  function renderBalance() {
    const sol = (state.lamports || 0) / 1e9;
    $("balanceUsd").textContent = formatUsd(totalUsd());
    $("balanceSub").textContent = `$${state.usdc.toFixed(2)} USDC · ${sol.toFixed(4)} SOL`;
  }

  /* ---------------- activity (device-local) ---------------- */
  function readActivity() {
    try { return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "[]"); } catch { return []; }
  }
  function addActivity(entry) {
    const list = readActivity();
    list.unshift(entry);
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(list.slice(0, 40)));
  }
  function renderActivity() {
    const list = readActivity();
    const host = $("activityList");
    if (!list.length) {
      host.innerHTML = `<div class="activity-empty">Nothing yet. Add cash or send something slimy.</div>`;
      return;
    }
    host.innerHTML = list.map((entry) => {
      const date = new Date(entry.at);
      const when = date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " +
        date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
      const cls = entry.type === "in" ? "in" : "";
      const sign = entry.type === "in" ? "+" : "-";
      return `<div class="activity-row">
        <div class="activity-ico">${entry.type === "in" ? "↓" : "➤"}</div>
        <div class="activity-main">
          <div class="activity-title">${escapeHtml(entry.title)}</div>
          <div class="activity-sub">${escapeHtml(entry.sub || "")} · ${when}</div>
        </div>
        <div class="activity-amt ${cls}">${sign}${formatUsd(Math.abs(entry.amountUsd || 0))}</div>
      </div>`;
    }).join("");
  }

  /* ---------------- handle / profile ---------------- */
  async function refreshProfile() {
    const result = await get("/api/web/cash/me");
    if (!result.ok) return;
    state.handle = result.data.handle || "";
    state.displayHandle = result.data.displayHandle || state.handle;
    renderProfile();
  }

  function renderProfile() {
    const has = Boolean(state.handle);
    $("cardHandle").textContent = has ? `$${state.displayHandle}` : "claim your $handle";
    $("cardLink").textContent = has ? `slimewire.org/cash/?pay=${state.handle} · tap to share` : "tap to set up your pay page";
    $("moreHandle").textContent = has ? `$${state.displayHandle}` : "no $handle yet";
    $("moreAddress").textContent = state.wallet ? shortAddress(state.wallet.publicKey) : "";
  }

  async function claimHandle(raw) {
    const result = await post("/api/web/cash/handle", { handle: raw });
    if (result.ok) {
      state.handle = result.data.handle;
      state.displayHandle = result.data.displayHandle || result.data.handle;
      renderProfile();
      return { ok: true };
    }
    return { ok: false, error: result.data.error || "Could not claim that handle." };
  }

  /* ---------------- send ---------------- */
  let resolveTimer = null;
  async function resolveTarget(raw) {
    const value = String(raw || "").trim();
    state.resolved = null;
    const hint = $("resolveHint");
    if (!value) { hint.textContent = ""; hint.className = "field-hint"; return; }
    if (/^\$?[a-zA-Z0-9]{1,20}$/.test(value) && /[a-zA-Z]/.test(value.replace(/^\$/, "")) && value.replace(/^\$/, "").length <= 20 && !isLikelyAddress(value)) {
      const handle = value.replace(/^\$/, "").toLowerCase();
      const result = await get(`/api/web/cash/resolve?handle=${encodeURIComponent(handle)}`);
      if (result.ok && result.data.address) {
        state.resolved = { address: result.data.address, handle: result.data.displayHandle || handle };
        hint.textContent = `→ $${state.resolved.handle} · ${shortAddress(state.resolved.address)}`;
        hint.className = "field-hint ok";
      } else {
        hint.textContent = result.data.error || "No SlimeCash user with that $handle.";
        hint.className = "field-hint bad";
      }
      return;
    }
    if (isLikelyAddress(value)) {
      state.resolved = { address: value, handle: "" };
      hint.textContent = "→ wallet address";
      hint.className = "field-hint ok";
      return;
    }
    hint.textContent = "Enter a $handle or a Solana address.";
    hint.className = "field-hint bad";
  }

  function isLikelyAddress(value) {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(value).trim());
  }

  function amountToSol() {
    const raw = Number($("sendAmount").value || 0);
    if (!(raw > 0)) return 0;
    if (state.amountUnit === "SOL") return raw;
    return state.solUsd > 0 ? raw / state.solUsd : 0;
  }

  function sendUsdValue() {
    const raw = Number($("sendAmount").value || 0);
    if (!(raw > 0)) return 0;
    return state.sendAsset === "USDC" ? raw : amountToSol() * state.solUsd;
  }

  function selectSendAsset(asset) {
    state.sendAsset = asset === "SOL" ? "SOL" : "USDC";
    document.querySelectorAll("[data-send-asset]").forEach((button) => button.classList.toggle("active", button.dataset.sendAsset === state.sendAsset));
    $("amountUnit").textContent = state.sendAsset === "USDC" ? "USDC" : state.amountUnit;
    $("amountUnit").disabled = state.sendAsset === "USDC";
    $("sendAmount").placeholder = state.sendAsset === "USDC" ? "0.00" : "0.00";
    renderAmountAlt();
  }

  function renderAmountAlt() {
    const alt = $("amountAlt");
    if (state.sendAsset === "USDC") {
      const amount = Number($("sendAmount").value || 0);
      alt.textContent = amount > 0 ? `$${amount.toFixed(2)} digital dollars on Solana` : "";
      return;
    }
    const sol = amountToSol();
    if (!(sol > 0)) { alt.textContent = ""; return; }
    alt.textContent = state.amountUnit === "USD"
      ? `≈ ${sol.toFixed(4)} SOL`
      : `≈ ${formatUsd(sol * state.solUsd)}`;
  }

  async function submitSend() {
    const target = state.resolved;
    const sol = amountToSol();
    const usdc = Number($("sendAmount").value || 0);
    const amount = state.sendAsset === "USDC" ? usdc : sol;
    const status = $("sendStatus");
    if (!target) { status.textContent = "Pick who you're sending to first."; status.className = "status bad"; return; }
    if (!(amount > 0)) { status.textContent = "Enter an amount."; status.className = "status bad"; return; }
    const to = target.handle ? `$${target.handle}` : shortAddress(target.address);
    const amountText = state.sendAsset === "USDC" ? `$${usdc.toFixed(2)} USDC` : `${sol.toFixed(4)} SOL (${formatUsd(sol * state.solUsd)})`;
    $("confirmSummary").innerHTML =
      `Send <b>${amountText}</b><br>` +
      `to <b>${escapeHtml(to)}</b><br>` +
      `<span style="color:var(--dim);font-size:12px">Solana network · 0.5% app fee · ${state.sendAsset === "USDC" ? "a little SOL is needed for network fees" : "network fee ~0.000005 SOL"}</span>`;
    openSheet("confirm");
  }

  async function confirmSend() {
    const target = state.resolved;
    const sol = amountToSol();
    const usdc = Number($("sendAmount").value || 0);
    const note = $("sendNote").value.trim();
    const button = $("confirmSendBtn");
    button.disabled = true;
    button.textContent = "Sending…";
    const result = await post("/api/web/cash/send", {
      fromWalletIndex: state.wallet?.index || 1,
      destination: target.address,
      asset: state.sendAsset,
      ...(state.sendAsset === "USDC" ? { amount: String(usdc) } : { amountSol: String(sol) }),
      sendAttemptId: crypto.randomUUID()
    });
    button.disabled = false;
    button.textContent = "Send it";
    if (result.ok) {
      closeSheet("confirm");
      const to = target.handle ? `$${target.handle}` : shortAddress(target.address);
      addActivity({ type: "out", title: `To ${to}`, sub: note || `${state.sendAsset} sent`, amountUsd: sendUsdValue(), at: Date.now() });
      renderActivity();
      $("sendStatus").textContent = `Sent. Signature ${String(result.data.signature || "").slice(0, 8)}…`;
      $("sendStatus").className = "status ok";
      $("sendAmount").value = "";
      $("sendNote").value = "";
      toast("Sent 🤝");
      refreshBalance({ silent: true });
      switchTab("home");
    } else {
      $("sendStatus").textContent = result.data.error || "Send failed.";
      $("sendStatus").className = "status bad";
      closeSheet("confirm");
      toast(result.data.error || "Send failed.", true);
    }
  }

  /* ---------------- add cash ---------------- */
  const GUIDES = {
    phantom: ["1. Open Phantom and choose Send", "2. Paste your SlimeCash address", "3. Choose the same asset shown above on Solana"],
    coinbase: ["1. Use Buy with Coinbase above for a preloaded checkout", "2. Or copy this address into Coinbase Send", "3. Choose the Solana network — that part matters"],
    robinhood: ["1. Open Robinhood Crypto and choose Send", "2. Paste your SlimeCash address", "3. Send SOL on Solana; asset availability can vary"],
    other: ["Send the selected asset to your address below from any compatible wallet or exchange.", "Always choose the Solana network."]
  };

  function solanaPayUrl(address, asset = "USDC", amount = "", message = "") {
    const params = new URLSearchParams();
    if (Number(amount) > 0) params.set("amount", String(Number(amount)));
    if (asset === "USDC") params.set("spl-token", USDC_MINT);
    params.set("label", state.displayHandle ? `$${state.displayHandle} on SlimeCash` : "SlimeCash");
    if (message) params.set("message", message.slice(0, 80));
    return `solana:${address}?${params.toString()}`;
  }

  function selectDepositAsset(asset) {
    state.depositAsset = asset === "SOL" ? "SOL" : "USDC";
    document.querySelectorAll("[data-deposit-asset]").forEach((button) => button.classList.toggle("active", button.dataset.depositAsset === state.depositAsset));
    if (state.wallet) $("openDepositWallet").href = solanaPayUrl(state.wallet.publicKey, state.depositAsset);
    $("depositWatch").textContent = `Watching ${state.depositAsset} on Solana…`;
    $("depositWatch").className = "status";
    renderFundingPreview();
  }

  function renderFundingPreview() {
    const amount = Number($("fundAmount")?.value || 0);
    const validAmount = amount >= 5 && amount <= 2500;
    $("fundingPreviewTitle").textContent = validAmount ? `$${amount.toFixed(2)} ${state.depositAsset}` : state.depositAsset;
    $("fundingPreviewDestination").textContent = state.wallet
      ? `To ${shortAddress(state.wallet.publicKey)} on Solana`
      : "Solana wallet loading…";
    $("coinbaseFundBtn").textContent = validAmount
      ? `Continue to Coinbase · $${amount.toFixed(amount % 1 ? 2 : 0)} ${state.depositAsset}`
      : "Continue to Coinbase";
  }

  async function refreshFundingConfig() {
    if (state.funding) return state.funding;
    const result = await get("/api/web/cash/funding");
    if (result.ok) state.funding = result.data;
    return state.funding;
  }

  async function startCoinbaseFunding() {
    const amount = Number($("fundAmount").value || 0);
    const button = $("coinbaseFundBtn");
    const status = $("fundingStatus");
    if (!(amount >= 5 && amount <= 2500)) {
      status.textContent = "Choose an amount from $5 to $2,500.";
      status.className = "status bad";
      return;
    }
    button.disabled = true;
    button.textContent = "Opening Coinbase…";
    const result = await post("/api/web/cash/onramp-session", { asset: state.depositAsset, paymentAmount: amount });
    button.disabled = false;
    renderFundingPreview();
    if (result.ok && /^https:\/\/pay\.coinbase\.com\//i.test(result.data.onrampUrl || "")) {
      sessionStorage.setItem("slimecashPendingOnramp", JSON.stringify({ amount, asset: state.depositAsset, startedAt: Date.now() }));
      location.assign(result.data.onrampUrl);
      return;
    }
    status.textContent = result.data.error || "Coinbase could not prepare this checkout. Your SlimeCash wallet was not changed.";
    status.className = "status bad";
  }

  function openAddCash() {
    if (!state.wallet) { toast("Wallet still setting up — try again in a second.", true); return; }
    const guide = localStorage.getItem(GUIDE_KEY) || "phantom";
    selectGuide(guide);
    $("depositAddress").textContent = state.wallet.publicKey;
    QR.draw($("depositQr"), state.wallet.publicKey);
    selectDepositAsset(state.depositAsset);
    refreshFundingConfig().then((funding) => {
      const integrated = Boolean(funding?.providers?.coinbase?.integrated);
      $("fundingStatus").textContent = integrated
        ? "Coinbase checkout is connected. Card, bank, Apple Pay, and limits depend on your Coinbase region/account."
        : "Coinbase quick funding is provider-ready; until credentials are enabled, your address is copied for the normal Coinbase send flow.";
      $("fundingStatus").className = "status";
    });
    openSheet("addcash");
    stopDepositWatch();
    refreshBalance({ silent: true });
    state.depositTimer = setInterval(() => refreshBalance({ silent: true }), 5000);
  }

  function stopDepositWatch() {
    if (state.depositTimer) { clearInterval(state.depositTimer); state.depositTimer = null; }
  }

  function selectGuide(key) {
    localStorage.setItem(GUIDE_KEY, key);
    document.querySelectorAll("[data-guide]").forEach((pill) => pill.classList.toggle("active", pill.dataset.guide === key));
    $("guideSteps").innerHTML = (GUIDES[key] || GUIDES.other).map((step) => `<div>${escapeHtml(step)}</div>`).join("");
    const provider = $("openProviderBtn");
    const rows = {
      phantom: ["Open Phantom", state.funding?.providers?.phantom?.url || "https://phantom.app/"],
      coinbase: ["Open Coinbase", state.funding?.providers?.coinbase?.url || "https://www.coinbase.com/buy"],
      robinhood: ["Open Robinhood", state.funding?.providers?.robinhood?.url || "https://robinhood.com/crypto/SOL"],
      other: ["Open Solana Pay request", state.wallet ? solanaPayUrl(state.wallet.publicKey, state.depositAsset) : "#"]
    };
    const selected = rows[key] || rows.other;
    provider.textContent = selected[0];
    provider.href = selected[1];
  }

  function receiveRequestUrl() {
    return solanaPayUrl(state.wallet.publicKey, state.receiveAsset, $("receiveAmount").value, "SlimeCash payment request");
  }

  function renderReceiveRequest() {
    if (!state.wallet) return;
    document.querySelectorAll("[data-receive-asset]").forEach((button) => button.classList.toggle("active", button.dataset.receiveAsset === state.receiveAsset));
    $("receiveAddress").textContent = state.wallet.publicKey;
    QR.draw($("receiveQr"), state.wallet.publicKey);
    $("openReceiveWallet").href = receiveRequestUrl();
    $("receiveStatus").textContent = state.receiveAsset === "USDC"
      ? "USDC arrives as digital dollars. The QR is your Solana address; the button includes the exact USDC request."
      : "SOL arrives on Solana. The button includes the requested amount when entered.";
  }

  function openReceive() {
    if (!state.wallet) { toast("Wallet still setting up — try again in a second.", true); return; }
    renderReceiveRequest();
    openSheet("receive");
  }

  async function shareReceive() {
    const url = receiveRequestUrl();
    const text = `${state.receiveAsset} payment request${Number($("receiveAmount").value) > 0 ? ` for ${$("receiveAmount").value} ${state.receiveAsset}` : ""}`;
    if (navigator.share) {
      try { await navigator.share({ title: "SlimeCash request", text, url }); return; } catch { /* copy fallback */ }
    }
    copyText(url);
  }

  /* ---------------- pay page ---------------- */
  async function openPayPage(handle) {
    const result = await get(`/api/web/cash/resolve?handle=${encodeURIComponent(handle)}`);
    if (!result.ok || !result.data.address) { toast(result.data.error || "That pay link doesn't exist.", true); return; }
    $("payHandle").textContent = `$${result.data.displayHandle || handle}`;
    $("payAddress").textContent = result.data.address;
    QR.draw($("payQr"), result.data.address);
    $("payNowBtn").onclick = () => {
      closeSheet("paypage");
      switchTab("send");
      $("sendTo").value = `$${result.data.displayHandle || handle}`;
      resolveTarget($("sendTo").value);
    };
    $("payAddressBtn").onclick = () => copyText(result.data.address);
    openSheet("paypage");
  }

  /* ---------------- ui plumbing ---------------- */
  function switchTab(tab) {
    document.querySelectorAll(".tab").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
    for (const view of ["home", "send", "terminal", "more"]) {
      $(`view-${view}`).hidden = view !== tab;
    }
    if (tab === "terminal" && !state.terminalLoaded) {
      $("terminalFrame").src = "/fun";
      state.terminalLoaded = true;
    }
    if (tab !== "home") stopDepositWatch();
  }

  function openSheet(id) { $(id).hidden = false; }
  function closeSheet(id) {
    $(id).hidden = true;
    if (id === "addcash") stopDepositWatch();
  }

  function showOnboard() { $("onboard").hidden = false; }

  let toastTimer = null;
  function toast(message, bad = false) {
    const el = $("toast");
    el.textContent = message;
    el.className = bad ? "toast bad" : "toast";
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
  }

  function copyText(text) {
    navigator.clipboard?.writeText(text).then(() => toast("Copied"), () => toast("Could not copy", true));
  }

  const formatUsd = (value) => "$" + (Number(value) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const shortAddress = (address) => address ? `${address.slice(0, 4)}…${address.slice(-4)}` : "";
  const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

  /* ---------------- boot ---------------- */
  async function boot() {
    // Splash for at least a beat, then the app.
    const params = new URLSearchParams(location.search);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/cash/sw.js").catch(() => {});
    }
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      state.deferredInstall = event;
      if (new URLSearchParams(location.search).get("install") === "1") $("openInstallBrowserBtn").textContent = "Install SlimeCash";
    });
    window.addEventListener("appinstalled", () => {
      state.deferredInstall = null;
      toast("SlimeCash installed — look for the green dollar icon");
    });

    await refreshSolPrice();

    let ready = false;
    if (state.token) {
      const wallet = await ensureWallet();
      ready = Boolean(wallet);
    }

    $("splash").classList.add("fade");
    setTimeout(() => { $("splash").hidden = true; }, 400);
    $("app").hidden = false;
    renderActivity();

    const recoveredMessage = sessionStorage.getItem("slimecashRecovered");
    if (recoveredMessage) {
      sessionStorage.removeItem("slimecashRecovered");
      setTimeout(() => toast(recoveredMessage), 450);
    }

    if (!ready) {
      showOnboard();
    } else {
      refreshProfile();
      refreshBalance();
    }
    selectSendAsset("USDC");

    // Deep links: ?pay=handle opens a pay page, ?tab= / ?sheet= from app shortcuts.
    const pay = params.get("pay");
    if (pay) openPayPage(pay.replace(/^\$/, ""));
    const tab = params.get("tab");
    if (tab && ["home", "send", "terminal", "more"].includes(tab)) switchTab(tab);
    if (params.get("sheet") === "addcash" && ready) openAddCash();
    if (params.get("install") === "1") setTimeout(openInstallGuide, 450);
    if (params.get("onramp") === "return" && ready) {
      let pending = null;
      try { pending = JSON.parse(sessionStorage.getItem("slimecashPendingOnramp") || "null"); } catch {}
      sessionStorage.removeItem("slimecashPendingOnramp");
      toast(pending?.amount
        ? `Back in SlimeCash · checking for $${Number(pending.amount).toFixed(2)} ${pending.asset || "USDC"}…`
        : "Back in SlimeCash · checking for your Coinbase deposit…");
      let checks = 0;
      const timer = setInterval(() => {
        refreshBalance({ silent: true });
        checks += 1;
        if (checks >= 18) clearInterval(timer);
      }, 5000);
    }

    setInterval(() => { refreshSolPrice(); refreshBalance({ silent: true }); }, 60000);
  }

  /* ---------------- events ---------------- */
  document.addEventListener("click", (event) => {
    const close = event.target.closest("[data-close]");
    if (close) closeSheet(close.dataset.close);
    const pill = event.target.closest(".guide-pill");
    if (pill?.dataset.guide) selectGuide(pill.dataset.guide);
    if (pill?.dataset.sendAsset) selectSendAsset(pill.dataset.sendAsset);
    if (pill?.dataset.depositAsset) selectDepositAsset(pill.dataset.depositAsset);
    if (pill?.dataset.receiveAsset) {
      state.receiveAsset = pill.dataset.receiveAsset === "SOL" ? "SOL" : "USDC";
      renderReceiveRequest();
    }
    const amountChip = event.target.closest("[data-fund-amount]");
    if (amountChip) {
      $("fundAmount").value = amountChip.dataset.fundAmount;
      document.querySelectorAll("[data-fund-amount]").forEach((button) => button.classList.toggle("active", button === amountChip));
      renderFundingPreview();
    }
    const tabButton = event.target.closest(".tab");
    if (tabButton) switchTab(tabButton.dataset.tab);
  });

  $("addCashBtn").addEventListener("click", openAddCash);
  $("receiveBtn").addEventListener("click", openReceive);
  $("sendQuickBtn").addEventListener("click", () => switchTab("send"));
  $("sendBtn").addEventListener("click", submitSend);
  $("confirmSendBtn").addEventListener("click", confirmSend);
  $("copyDepositBtn").addEventListener("click", () => state.wallet && copyText(state.wallet.publicKey));
  $("coinbaseFundBtn").addEventListener("click", startCoinbaseFunding);
  $("copyReceiveBtn").addEventListener("click", () => state.wallet && copyText(state.wallet.publicKey));
  $("shareReceiveBtn").addEventListener("click", shareReceive);
  $("receiveAmount").addEventListener("input", renderReceiveRequest);
  $("fundAmount").addEventListener("input", () => {
    document.querySelectorAll("[data-fund-amount]").forEach((button) => button.classList.toggle("active", Number(button.dataset.fundAmount) === Number($("fundAmount").value)));
    renderFundingPreview();
  });
  $("copyAddressBtn").addEventListener("click", () => state.wallet && copyText(state.wallet.publicKey));
  $("avatarBtn").addEventListener("click", () => switchTab("more"));

  $("payCard").addEventListener("click", () => {
    if (state.handle) {
      copyText(`${location.origin}/cash/?pay=${state.handle}`);
      toast("Pay link copied — share it anywhere");
    } else {
      showOnboard();
    }
  });

  $("sendTo").addEventListener("input", (event) => {
    clearTimeout(resolveTimer);
    resolveTimer = setTimeout(() => resolveTarget(event.target.value), 350);
  });
  $("sendAmount").addEventListener("input", renderAmountAlt);
  $("amountUnit").addEventListener("click", () => {
    if (state.sendAsset === "USDC") return;
    state.amountUnit = state.amountUnit === "USD" ? "SOL" : "USD";
    $("amountUnit").textContent = state.amountUnit;
    renderAmountAlt();
  });

  $("claimBtn").addEventListener("click", async () => {
    const button = $("claimBtn");
    const requestedHandle = $("handleInput").value.trim().replace(/^\$+/, "");
    if (!/^[a-z0-9]{1,20}$/i.test(requestedHandle) || !/[a-z]/i.test(requestedHandle)) {
      $("handleHint").textContent = "Use 1–20 letters and numbers with at least one letter.";
      $("handleHint").className = "field-hint bad";
      return;
    }
    button.disabled = true;
    button.textContent = "Claiming…";
    const ok = await ensureAccount() && await ensureWallet();
    if (!ok) { button.disabled = false; button.textContent = "Claim it"; return; }
    const result = await claimHandle(requestedHandle);
    button.disabled = false;
    button.textContent = "Claim it";
    if (result.ok) {
      const backedUp = await backupCashAccount({ quiet: true });
      $("onboard").hidden = true;
      toast(backedUp
        ? `You're $${state.displayHandle} — account + wallet backups downloaded`
        : `You're $${state.displayHandle}. Open Profile to download your account backup.`, !backedUp);
      refreshBalance();
      renderProfile();
    } else {
      $("handleHint").textContent = result.error;
      $("handleHint").className = "field-hint bad";
    }
  });

  $("skipHandleBtn").addEventListener("click", async () => {
    const button = $("skipHandleBtn");
    button.disabled = true;
    button.textContent = "Setting up…";
    if (await ensureAccount() && await ensureWallet()) {
      const backedUp = await backupCashAccount({ quiet: true });
      $("onboard").hidden = true;
      refreshBalance();
      renderProfile();
      toast(backedUp
        ? "Ready — account + wallet backups downloaded"
        : "Ready. Open Profile to download your account backup.", !backedUp);
    }
    button.disabled = false;
    button.textContent = "Skip for now";
  });

  $("onboardRestoreBtn").addEventListener("click", openRecovery);

  $("claimHandleBtn").addEventListener("click", () => { $("onboard").hidden = false; });

  $("backupBtn").addEventListener("click", async () => {
    const button = $("backupBtn");
    button.disabled = true;
    button.textContent = "Preparing backups…";
    await backupCashAccount({ includeWallets: true });
    button.disabled = false;
    button.textContent = "Back up account + wallets";
  });

  $("restoreBtn").addEventListener("click", openRecovery);
  $("spendBtn").addEventListener("click", () => openSheet("spend"));
  $("openReceiveFromSpend").addEventListener("click", () => { closeSheet("spend"); state.receiveAsset = "USDC"; openReceive(); });
  $("fundCardBtn").addEventListener("click", () => {
    closeSheet("spend");
    switchTab("send");
    selectSendAsset("USDC");
    $("sendTo").value = "";
    $("resolveHint").textContent = "In Coinbase: Receive → USDC → Solana. Paste that exact address here, then send a small test first.";
    $("resolveHint").className = "field-hint ok";
    $("sendTo").focus();
  });
  $("recoveryBtn").addEventListener("click", restoreCashAccount);
  $("recoveryFile").addEventListener("change", () => {
    const file = $("recoveryFile").files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      $("recoveryText").value = String(reader.result || "").trim();
      $("recoveryStatus").textContent = `${file.name} loaded — tap Restore account.`;
      $("recoveryStatus").className = "status ok";
    };
    reader.onerror = () => {
      $("recoveryStatus").textContent = "Could not read that file. Paste the recovery key instead.";
      $("recoveryStatus").className = "status bad";
    };
    reader.readAsText(file);
  });

  $("installBtn").addEventListener("click", installCashApp);
  $("installOnboardBtn").addEventListener("click", installCashApp);
  $("openInstallBrowserBtn").addEventListener("click", openInstallPageInBrowser);

  $("signOutBtn").addEventListener("click", () => {
    if (!confirm("Sign out? Make sure your SlimeCash recovery backup is saved first.")) return;
    setToken("");
    location.reload();
  });

  boot();
})();
