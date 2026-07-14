/* SlimeCash — installable PWA on SlimeWire wallet rails.
   Shares localStorage ogreWebToken with /fun and the rest of the site,
   so one SlimeWire account works everywhere. */
(() => {
  "use strict";

  const TOKEN_KEY = "ogreWebToken";
  const ACTIVITY_KEY = "slimecashActivity";
  const GUIDE_KEY = "slimecashGuide";
  const PENDING_FUND_KEY = "slimecashPendingFund";
  const CONTACTS_KEY = "slimecashContacts";
  const SECURITY_KEY = "slimecashSecurity";
  const NOTIFICATIONS_KEY = "slimecashNotifications";
  const REQUESTS_KEY = "slimecashRequests";
  const API_BASE = (window.OGRE_PORTAL_CONFIG && window.OGRE_PORTAL_CONFIG.apiBase)
    || (/^(?:www\.)?slimewire\.org$/i.test(location.hostname) ? "https://app.slimewire.org" : "");
  const WSOL_MINT = "So11111111111111111111111111111111111111112";
  const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const PYUSD_MINT = "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo";   // PayPal USD on Solana (Token-2022)

  const state = {
    token: localStorage.getItem(TOKEN_KEY) || "",
    wallet: null,          // { index, publicKey }
    lamports: null,
    usdcRaw: null,
    usdc: 0,
    pyusdRaw: null,
    pyusd: 0,
    convertFrom: "PYUSD",
    convertTo: "SOL",
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
    requestTimer: null,
    activity: [],
    selectedReceipt: null,
    securitySupported: false,
    cashSecurity: null,
    pendingSendAttemptId: "",
    pendingRequestId: "",
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
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), method === "GET" ? 12_000 : 35_000);
      const response = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: controller.signal }).finally(() => clearTimeout(timer));
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
    const previousPyusd = state.pyusdRaw;
    state.lamports = Number(result.data.assets?.SOL?.rawAmount || 0);
    state.usdcRaw = Number(result.data.assets?.USDC?.rawAmount || 0);
    state.usdc = Number(result.data.assets?.USDC?.uiAmount || 0);
    state.pyusdRaw = Number(result.data.assets?.PYUSD?.rawAmount || 0);
    state.pyusd = Number(result.data.assets?.PYUSD?.uiAmount || 0);
    if (result.data.wallet?.address) state.wallet = { index: result.data.wallet.index, publicKey: result.data.wallet.address };
    renderBalance();
    if (previousUsdc !== null && state.usdcRaw > previousUsdc) {
      const gainedUsdc = (state.usdcRaw - previousUsdc) / 1e6;
      addActivity({ type: "in", title: "USDC arrived", sub: "Digital dollars landed on Solana", amountUsd: gainedUsdc, at: Date.now() });
      toast(`+$${gainedUsdc.toFixed(2)} USDC added — ready to use`);
      $("depositWatch").textContent = `+$${gainedUsdc.toFixed(2)} USDC received`;
      $("depositWatch").className = "status ok";
      notifyIncoming("USDC received", `+$${gainedUsdc.toFixed(2)} arrived in SlimeCash`);
      renderActivity();
      pendingFundArrived("USDC");
    }
    if (previousPyusd !== null && state.pyusdRaw > previousPyusd) {
      const gainedPyusd = (state.pyusdRaw - previousPyusd) / 1e6;
      addActivity({ type: "in", title: "PYUSD arrived", sub: "Dollars landed from Venmo/PayPal", asset: "PYUSD", amountUsd: gainedPyusd, at: Date.now() });
      toast(`+$${gainedPyusd.toFixed(2)} PYUSD added — ready to use`);
      $("depositWatch").textContent = `+$${gainedPyusd.toFixed(2)} PYUSD received`;
      $("depositWatch").className = "status ok";
      notifyIncoming("PYUSD received", `+$${gainedPyusd.toFixed(2)} arrived in SlimeCash`);
      renderActivity();
      pendingFundArrived("PYUSD");
      setTimeout(() => toast("Tap Convert to turn PYUSD into SOL for trading"), 3600);
    }
    if (previousSol !== null && state.lamports > previousSol + 10000) {
      const gainedSol = (state.lamports - previousSol) / 1e9;
      addActivity({ type: "in", title: "Deposit arrived", sub: "SOL landed in your wallet", amountUsd: gainedSol * state.solUsd, at: Date.now() });
      toast(`+${formatUsd(gainedSol * state.solUsd)} added — ready to use`);
      $("depositWatch").textContent = `+${gainedSol.toFixed(4)} SOL received`;
      $("depositWatch").className = "status ok";
      notifyIncoming("SOL received", `+${gainedSol.toFixed(4)} SOL arrived in SlimeCash`);
      renderActivity();
      pendingFundArrived("SOL");
    }
  }

  function totalUsd() {
    const sol = (state.lamports || 0) / 1e9;
    return state.usdc + state.pyusd + sol * state.solUsd;
  }

  function renderBalance() {
    const sol = (state.lamports || 0) / 1e9;
    $("balanceUsd").textContent = formatUsd(totalUsd());
    $("balanceSub").textContent = `$${state.usdc.toFixed(2)} USDC${state.pyusd > 0 ? ` · $${state.pyusd.toFixed(2)} PYUSD` : ""} · ${sol.toFixed(4)} SOL`;
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
  function normalizedActivity(entry = {}, index = 0) {
    const signature = String(entry.signature || entry.tx || entry.transactionSignature || "");
    const asset = String(entry.asset || (entry.amountUsdc ? "USDC" : "SOL")).toUpperCase();
    const incoming = entry.type === "in" || entry.direction === "in" || entry.direction === "incoming";
    const amount = Number(entry.amountUsd ?? entry.usdAmount ?? entry.amountUsdc ?? (asset === "USDC" ? entry.amount : 0)) || 0;
    return { ...entry, id: String(entry.id || signature || `local-${entry.at || index}-${index}`), at: entry.at || entry.createdAt || entry.confirmedAt || Date.now(), type: incoming ? "in" : "out", asset, signature, amountUsd: amount,
      title: entry.title || (incoming ? `${asset} received` : `${asset} sent`),
      sub: entry.sub || entry.counterpartyLabel || entry.handle || (signature ? `${signature.slice(0, 8)}…` : "device activity") };
  }

  function activityRowsHtml(list, limit = 0) {
    const rows = limit ? list.slice(0, limit) : list;
    if (!rows.length) return `<div class="activity-empty">Nothing yet. Add cash or send something slimy.</div>`;
    return rows.map((raw, index) => {
      const entry = normalizedActivity(raw, index);
      const date = new Date(entry.at);
      const when = date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " + date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
      return `<div class="activity-row" data-receipt="${escapeHtml(entry.id)}"><div class="activity-ico">${entry.type === "in" ? "↓" : "➤"}</div><div class="activity-main"><div class="activity-title">${escapeHtml(entry.title)}</div><div class="activity-sub">${escapeHtml(entry.sub || "")} · ${when}</div></div><div class="activity-amt ${entry.type === "in" ? "in" : ""}">${entry.type === "in" ? "+" : "-"}${formatUsd(Math.abs(entry.amountUsd || 0))}</div></div>`;
    }).join("");
  }

  function renderActivity() {
    const list = state.activity.length ? state.activity : readActivity().map(normalizedActivity);
    state.activity = list;
    $("activityList").innerHTML = activityRowsHtml(list, 6);
  }

  async function loadCashHistory({ open = false } = {}) {
    if (open) { openSheet("activitysheet"); $("activityFullList").innerHTML = `<div class="activity-empty">Syncing confirmed activity…</div>`; }
    const result = await get("/api/web/cash/history?limit=60");
    const remote = result.ok ? (result.data.history || result.data.activity || result.data.rows || []) : [];
    const merged = [...remote.map(normalizedActivity), ...readActivity().map(normalizedActivity)]
      .filter((entry, index, all) => all.findIndex((item) => item.id === entry.id) === index)
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
    state.activity = merged; renderActivity();
    if (open) {
      $("activityFullList").innerHTML = activityRowsHtml(merged);
      if (!result.ok) $("activityFullList").insertAdjacentHTML("afterbegin", `<div class="status">Confirmed history is not available yet. Showing this device's activity.</div>`);
    }
  }

  function openReceipt(id) {
    const entry = state.activity.find((item) => String(item.id) === String(id));
    if (!entry) return;
    state.selectedReceipt = entry;
    $("receiptBody").innerHTML = `<div class="receipt-status">${escapeHtml(entry.status || (entry.signature ? "Confirmed" : "Saved on this device"))}</div><div class="receipt-line"><span>Amount</span><b>${entry.type === "in" ? "+" : "-"}${formatUsd(Math.abs(entry.amountUsd || 0))} ${escapeHtml(entry.asset || "")}</b></div><div class="receipt-line"><span>Type</span><b>${entry.type === "in" ? "Received" : "Sent"}</b></div><div class="receipt-line"><span>Details</span><b>${escapeHtml(entry.title || entry.sub || "Payment")}</b></div><div class="receipt-line"><span>Date</span><b>${new Date(entry.at).toLocaleString()}</b></div>${entry.signature ? `<div class="receipt-line"><span>Signature</span><b>${escapeHtml(entry.signature.slice(0, 12))}…${escapeHtml(entry.signature.slice(-8))}</b></div>` : ""}`;
    $("receiptExplorer").hidden = !entry.signature;
    $("receiptExplorer").href = entry.explorerUrl || `https://solscan.io/tx/${encodeURIComponent(entry.signature)}`;
    openSheet("receipt");
  }

  /* ---------------- handle / profile ---------------- */
  async function refreshProfile() {
    const result = await get("/api/web/cash/me");
    if (!result.ok) return;
    state.handle = result.data.handle || "";
    state.displayHandle = result.data.displayHandle || state.handle;
    state.referralLink = result.data.referralLink || `${location.origin}/cash/`;
    state.referralInvites = Number(result.data.referralInvites || 0);
    renderProfile();
  }

  function openInvite() {
    const link = state.referralLink || `${location.origin}/cash/`;
    const invites = Number(state.referralInvites || 0);
    $("inviteLink").textContent = link;
    $("inviteCount").textContent = invites === 1 ? "1 friend" : `${invites} friends`;
    QR.draw($("inviteQr"), link);
    openSheet("invite");
  }
  async function shareInvite() {
    const link = state.referralLink || `${location.origin}/cash/`;
    const text = "Trade coins and cash out with me on SlimeCash 🐸";
    if (navigator.share) { try { await navigator.share({ title: "SlimeCash", text, url: link }); return; } catch { /* fell through */ } }
    copyText(link);
    toast("Invite link copied — share it anywhere");
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
    return state.sendAsset !== "SOL" ? raw : amountToSol() * state.solUsd;
  }

  function selectSendAsset(asset) {
    state.sendAsset = ["SOL", "PYUSD"].includes(asset) ? asset : "USDC";
    document.querySelectorAll("[data-send-asset]").forEach((button) => button.classList.toggle("active", button.dataset.sendAsset === state.sendAsset));
    $("amountUnit").textContent = state.sendAsset !== "SOL" ? state.sendAsset : state.amountUnit;
    $("amountUnit").disabled = state.sendAsset !== "SOL";
    $("sendAmount").placeholder = "0.00";
    renderAmountAlt();
  }

  function renderAmountAlt() {
    const alt = $("amountAlt");
    if (state.sendAsset !== "SOL") {
      const amount = Number($("sendAmount").value || 0);
      alt.textContent = amount > 0 ? `$${amount.toFixed(2)} ${state.sendAsset} on Solana` : "";
      return;
    }
    const sol = amountToSol();
    if (!(sol > 0)) { alt.textContent = ""; return; }
    alt.textContent = state.amountUnit === "USD"
      ? `≈ ${sol.toFixed(4)} SOL`
      : `≈ ${formatUsd(sol * state.solUsd)}`;
  }

  async function submitSend() {
    if (!navigator.onLine) { $("sendStatus").textContent = "You are offline. Reconnect before reviewing a send."; $("sendStatus").className = "status bad"; return; }
    const target = state.resolved;
    const sol = amountToSol();
    const usdc = Number($("sendAmount").value || 0);
    const amount = state.sendAsset !== "SOL" ? usdc : sol;
    const status = $("sendStatus");
    if (!target) { status.textContent = "Pick who you're sending to first."; status.className = "status bad"; return; }
    if (!(amount > 0)) { status.textContent = "Enter an amount."; status.className = "status bad"; return; }
    if (!state.cashSecurity) {
      const securityResult = await get("/api/web/cash/security");
      if (securityResult.ok) state.cashSecurity = securityResult.data.security || securityResult.data;
    }
    const to = target.handle ? `$${target.handle}` : shortAddress(target.address);
    const amountText = state.sendAsset !== "SOL" ? `$${usdc.toFixed(2)} ${state.sendAsset}` : `${sol.toFixed(4)} SOL (${formatUsd(sol * state.solUsd)})`;
    $("confirmSummary").innerHTML =
      `Send <b>${amountText}</b><br>` +
      `to <b>${escapeHtml(to)}</b><br>` +
      `<span style="color:var(--dim);font-size:12px">Solana network · 0.5% app fee · ${state.sendAsset !== "SOL" ? "a little SOL is needed for network fees" : "network fee ~0.000005 SOL"}</span>`;
    $("confirmPinWrap").hidden = !state.cashSecurity?.pinEnabled;
    $("confirmSpendPin").value = "";
    state.pendingSendAttemptId = crypto.randomUUID();
    openSheet("confirm");
  }

  async function confirmSend() {
    if (!navigator.onLine) { closeSheet("confirm"); toast("Reconnect before sending", true); return; }
    const target = state.resolved;
    const sol = amountToSol();
    const usdc = Number($("sendAmount").value || 0);
    const note = $("sendNote").value.trim();
    const spendPin = $("confirmSpendPin").value.trim();
    if (state.cashSecurity?.pinEnabled && !/^\d{4,8}$/.test(spendPin)) {
      toast("Enter your spend PIN", true);
      $("confirmSpendPin").focus();
      return;
    }
    const button = $("confirmSendBtn");
    button.disabled = true;
    button.textContent = "Sending…";
    const result = await post("/api/web/cash/send", {
      fromWalletIndex: state.wallet?.index || 1,
      destination: target.address,
      asset: state.sendAsset,
      ...(state.sendAsset !== "SOL" ? { amount: String(usdc) } : { amountSol: String(sol) }),
      note,
      recipientLabel: target.handle ? `$${target.handle}` : "",
      ...(spendPin ? { spendPin } : {}),
      ...(state.pendingRequestId ? { requestId: state.pendingRequestId } : {}),
      sendAttemptId: state.pendingSendAttemptId || crypto.randomUUID()
    });
    button.disabled = false;
    button.textContent = "Send it";
    if (result.ok) {
      closeSheet("confirm");
      const to = target.handle ? `$${target.handle}` : shortAddress(target.address);
      addActivity({ type: "out", title: `To ${to}`, sub: note || `${state.sendAsset} sent`, asset: state.sendAsset, amountUsd: sendUsdValue(), signature: result.data.signature || "", at: Date.now() });
      state.activity = [];
      renderActivity();
      $("sendStatus").textContent = `Sent. Signature ${String(result.data.signature || "").slice(0, 8)}…`;
      $("sendStatus").className = "status ok";
      $("sendAmount").value = "";
      $("sendNote").value = "";
      $("confirmSpendPin").value = "";
      state.pendingSendAttemptId = "";
      state.pendingRequestId = "";
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
    venmo: ["1. Tap the green button — your address is copied and Venmo opens", "2. In Venmo: Me tab → Crypto → PYUSD → Buy your amount (no Venmo fees)", "3. Transfer → Send to a wallet → PASTE (already copied) → pick SOLANA → confirm", "4. Come back — the tracker below pings you when it lands"],
    paypal: ["1. Tap the green button — your address is copied and PayPal opens", "2. In PayPal: Finances → Crypto → PYUSD → Buy your amount (no fee)", "3. Transfer → Send → External wallet → PASTE → pick SOLANA → confirm", "4. Come back — the tracker below pings you when it lands"],
    phantom: ["1. Tap Open in Phantom — SlimeCash opens inside Phantom's browser", "2. Use Phantom's own Buy for card or Apple Pay checkout", "3. Send the SOL or USDC to your SlimeCash address below", "No Phantom? Get it at phantom.com first."],
    coinbase: ["1. Use Buy with Coinbase above for a preloaded checkout", "2. Or copy this address into Coinbase Send", "3. Choose the Solana network — that part matters"],
    robinhood: ["1. Open Robinhood Crypto and choose Send", "2. Paste your SlimeCash address", "3. Send SOL on Solana; asset availability can vary"],
    peer: ["Peer (ZKP2P) is a permissionless P2P onramp: you pay a market maker on Venmo/Wise and escrow releases USDC.", "Experimental — capped amounts, fills can take minutes, settles on Base (bridge to Solana after).", "Power users only; start small."],
    other: ["Send the selected asset to your address below from any compatible wallet or exchange.", "Always choose the Solana network."]
  };

  // Keyless Phantom rail: opens SlimeCash inside Phantom's in-app browser, where the user
  // can use Phantom's native Buy (their KYC, their onramp) and send straight back here.
  function phantomBrowseUrl() {
    const target = `${location.origin}/cash/?src=phantom`;
    return `https://phantom.app/ul/browse/${encodeURIComponent(target)}?ref=${encodeURIComponent(location.origin)}`;
  }

  function solanaPayUrl(address, asset = "USDC", amount = "", message = "") {
    const params = new URLSearchParams();
    if (Number(amount) > 0) params.set("amount", String(Number(amount)));
    if (asset === "USDC") params.set("spl-token", USDC_MINT);
    if (asset === "PYUSD") params.set("spl-token", PYUSD_MINT);
    params.set("label", state.displayHandle ? `$${state.displayHandle} on SlimeCash` : "SlimeCash");
    if (message) params.set("message", message.slice(0, 80));
    return `solana:${address}?${params.toString()}`;
  }

  function selectDepositAsset(asset) {
    state.depositAsset = ["SOL", "PYUSD"].includes(asset) ? asset : "USDC";
    document.querySelectorAll("[data-deposit-asset]").forEach((button) => button.classList.toggle("active", button.dataset.depositAsset === state.depositAsset));
    if (state.wallet) $("openDepositWallet").href = solanaPayUrl(state.wallet.publicKey, state.depositAsset);
    $("depositWatch").textContent = `Watching ${state.depositAsset} on Solana…`;
    $("depositWatch").className = "status";
    renderFundingPreview();
    const activeGuide = document.querySelector("[data-guide].active")?.dataset.guide;
    if (activeGuide) selectGuide(activeGuide);
  }

  function renderFundingPreview() {
    const amount = Number($("fundAmount")?.value || 0);
    const validAmount = amount >= 5 && amount <= 2500;
    $("fundingPreviewTitle").textContent = validAmount ? `$${amount.toFixed(2)} ${state.depositAsset}` : state.depositAsset;
    $("fundingPreviewDestination").textContent = state.wallet
      ? `To ${shortAddress(state.wallet.publicKey)} on Solana`
      : "Solana wallet loading…";
    const pyusdMode = state.depositAsset === "PYUSD";
    $("coinbaseFundBtn").disabled = false;
    if (pyusdMode) {
      const providerName = ["venmo", "paypal"].includes(activeGuideKey()) ? HANDOFF_PROVIDERS[activeGuideKey()].name : "Venmo";
      $("coinbaseFundBtn").textContent = validAmount
        ? `Copy address & open ${providerName} · $${amount.toFixed(amount % 1 ? 2 : 0)}`
        : `Copy address & open ${providerName}`;
    } else if (state.funding?.providers?.coinbase?.integrated) {
      $("coinbaseFundBtn").textContent = validAmount
        ? `Pay with card or Apple Pay · $${amount.toFixed(amount % 1 ? 2 : 0)}`
        : "Pay with card or Apple Pay";
    } else {
      $("coinbaseFundBtn").textContent = "Turn on 1-tap card funding";
    }
  }

  async function refreshFundingConfig() {
    if (state.funding) return state.funding;
    const result = await get("/api/web/cash/funding");
    if (result.ok) state.funding = result.data;
    return state.funding;
  }

  async function startCoinbaseFunding() {
    if (state.depositAsset === "PYUSD") {
      const key = ["venmo", "paypal"].includes(activeGuideKey()) ? activeGuideKey() : "venmo";
      providerHandoff(key);
      return;
    }
    const amount = Number($("fundAmount").value || 0);
    const button = $("coinbaseFundBtn");
    const status = $("fundingStatus");
    if (!(amount >= 5 && amount <= 2500)) {
      status.textContent = "Choose an amount from $5 to $2,500.";
      status.className = "status bad";
      return;
    }
    const funding = await refreshFundingConfig();
    if (!funding?.providers?.coinbase?.integrated) {
      openSheet("cardsetup");
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

  /* ------- smart provider handoff + live deposit tracker ------- */
  function readPendingFund() {
    try {
      const row = JSON.parse(localStorage.getItem(PENDING_FUND_KEY) || "null");
      if (!row || Date.now() - Number(row.at || 0) > 6 * 60 * 60 * 1000) return null;
      return row;
    } catch { return null; }
  }
  function savePendingFund(row) {
    localStorage.setItem(PENDING_FUND_KEY, JSON.stringify(row));
    renderPendingFund();
  }
  function clearPendingFund() {
    localStorage.removeItem(PENDING_FUND_KEY);
    renderPendingFund();
  }
  function renderPendingFund() {
    const card = $("pendingFund");
    const pending = readPendingFund();
    if (!pending) { card.hidden = true; return; }
    card.hidden = false;
    if (pending.arrived) {
      card.classList.add("arrived");
      $("pendingFundIcon").textContent = "✅";
      $("pendingFundTitle").textContent = `${pending.amount ? `$${Number(pending.amount).toFixed(2)} ` : ""}${pending.asset} landed`;
      $("pendingFundSub").textContent = pending.asset === "PYUSD" ? "Convert it to SOL to trade coins." : "Ready to use.";
      $("pendingFundAction").hidden = pending.asset !== "PYUSD";
    } else {
      card.classList.remove("arrived");
      $("pendingFundIcon").textContent = "⏳";
      $("pendingFundTitle").textContent = `Waiting for ${pending.amount ? `your $${Number(pending.amount).toFixed(2)} ` : "your "}${pending.asset} from ${pending.providerName}`;
      $("pendingFundSub").textContent = "We watch the chain and ping you the moment it lands.";
      $("pendingFundAction").hidden = true;
    }
  }
  function pendingFundArrived(asset) {
    const pending = readPendingFund();
    if (!pending || pending.arrived || pending.asset !== asset) return;
    savePendingFund({ ...pending, arrived: true });
  }
  const HANDOFF_PROVIDERS = {
    venmo: { name: "Venmo", url: () => state.funding?.providers?.venmo?.url || "https://venmo.com" },
    paypal: { name: "PayPal", url: () => state.funding?.providers?.paypal?.url || "https://www.paypal.com/us/digital-wallet/manage-money/crypto" },
    phantom: { name: "Phantom", url: () => phantomBrowseUrl() },
    coinbase: { name: "Coinbase", url: () => state.funding?.providers?.coinbase?.url || "https://www.coinbase.com/buy" },
    robinhood: { name: "Robinhood", url: () => state.funding?.providers?.robinhood?.url || "https://robinhood.com/crypto/SOL" }
  };
  function activeGuideKey() {
    return document.querySelector("[data-guide].active")?.dataset.guide || (state.depositAsset === "PYUSD" ? "venmo" : "phantom");
  }
  // One tap: copy the address, remember what we're waiting for, open the provider app.
  function providerHandoff(guideKey) {
    const provider = HANDOFF_PROVIDERS[guideKey] || HANDOFF_PROVIDERS.venmo;
    if (state.wallet) copyText(state.wallet.publicKey);
    const amount = Number($("fundAmount")?.value || 0);
    savePendingFund({
      asset: state.depositAsset,
      amount: amount >= 1 && amount <= 25000 ? amount : 0,
      provider: guideKey,
      providerName: provider.name,
      at: Date.now()
    });
    $("depositWatch").textContent = `Address copied — paste it in ${provider.name}. Watching the chain…`;
    $("depositWatch").className = "status ok";
    window.open(provider.url(), "_blank", "noopener");
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
      venmo: ["Open Venmo", state.funding?.providers?.venmo?.url || "https://venmo.com"],
      paypal: ["Open PayPal crypto", state.funding?.providers?.paypal?.url || "https://www.paypal.com/us/digital-wallet/manage-money/crypto"],
      phantom: ["Open in Phantom", phantomBrowseUrl()],
      coinbase: ["Open Coinbase", state.funding?.providers?.coinbase?.url || "https://www.coinbase.com/buy"],
      robinhood: ["Open Robinhood", state.funding?.providers?.robinhood?.url || "https://robinhood.com/crypto/SOL"],
      peer: ["Open Peer (experimental)", state.funding?.providers?.peer?.url || "https://www.peer.xyz"],
      other: ["Open Solana Pay request", state.wallet ? solanaPayUrl(state.wallet.publicKey, state.depositAsset) : "#"]
    };
    // Venmo/PayPal deliver PYUSD; the other rails deliver USDC/SOL. Keep the asset toggle in sync.
    if (["venmo", "paypal"].includes(key) && state.depositAsset !== "PYUSD") selectDepositAsset("PYUSD");
    else if (!["venmo", "paypal", "other"].includes(key) && state.depositAsset === "PYUSD") selectDepositAsset("USDC");
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
    $("receiveStatus").textContent = state.receiveAsset === "SOL"
      ? "SOL arrives on Solana. The button includes the requested amount when entered."
      : `${state.receiveAsset} arrives as digital dollars. The QR is your Solana address; the button includes the exact ${state.receiveAsset} request.`;
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

  async function openTrackedPayPage(id, token) {
    const result = await get(`/api/web/cash/request?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token || "")}`);
    const request = result.data?.request;
    if (!result.ok || !request?.recipientAddress) { toast(result.data.error || "That payment request is not available.", true); return; }
    $("payHandle").textContent = request.label || "SlimeCash request";
    $("payAddress").textContent = request.recipientAddress;
    QR.draw($("payQr"), request.uri || request.recipientAddress);
    $("payAddressBtn").onclick = () => copyText(request.recipientAddress);
    $("payNowBtn").textContent = request.status === "pending" ? `Pay ${request.amount} ${request.asset}` : `Request ${request.status}`;
    $("payNowBtn").disabled = request.status !== "pending";
    $("payNowBtn").onclick = () => {
      closeSheet("paypage");
      switchTab("send");
      state.resolved = { address: request.recipientAddress, handle: "" };
      state.pendingRequestId = request.id;
      $("sendTo").value = request.recipientAddress;
      selectSendAsset(request.asset);
      if (request.asset === "SOL") state.amountUnit = "SOL";
      $("sendAmount").value = request.amount;
      renderAmountAlt();
    };
    openSheet("paypage");
  }

  /* ---------------- contacts / requests / preferences ---------------- */
  function readLocalJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; } }
  function writeLocalJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }

  async function loadContacts() {
    openSheet("contacts");
    const result = await get("/api/web/cash/contacts");
    const rows = result.ok ? (result.data.contacts || []) : readLocalJson(CONTACTS_KEY, []);
    $("contactList").innerHTML = rows.length ? rows.map((contact, index) => `<div class="compact-row"><span class="favorite-dot">★</span><div class="compact-row-main"><b>${escapeHtml(contact.name || contact.handle || "Contact")}</b><span>${escapeHtml(shortAddress(contact.address || ""))}</span></div><button class="compact-row-action" data-pay-contact="${index}" data-contact-address="${escapeHtml(contact.address || "")}" data-contact-name="${escapeHtml(contact.handle || contact.name || "")}" type="button">Pay</button></div>`).join("") : `<div class="activity-empty">No favorites yet.</div>`;
  }

  async function saveContact() {
    const name = $("contactName").value.trim().replace(/^\$+/, "");
    const address = $("contactAddress").value.trim();
    if (!name || !isLikelyAddress(address)) { $("contactStatus").textContent = "Enter a name and valid Solana address."; $("contactStatus").className = "status bad"; return; }
    const result = await post("/api/web/cash/contacts", { name, address, favorite: true });
    if (!result.ok) {
      const rows = readLocalJson(CONTACTS_KEY, []).filter((row) => row.address !== address);
      rows.unshift({ name, address, favorite: true }); writeLocalJson(CONTACTS_KEY, rows.slice(0, 40));
      $("contactStatus").textContent = "Saved on this device. Account sync is not available yet.";
    } else $("contactStatus").textContent = "Contact saved to your account.";
    $("contactStatus").className = "status ok"; $("contactName").value = ""; $("contactAddress").value = ""; loadContacts();
  }

  function localRequests() { return readLocalJson(REQUESTS_KEY, []); }
  function renderRequests(rows = localRequests()) {
    $("requestList").innerHTML = rows.length ? rows.map((request) => `<div class="compact-row"><span class="favorite-dot">$</span><div class="compact-row-main"><b>${escapeHtml(request.amount ? `${request.amount} ${request.asset || "USDC"}` : request.asset || "Payment request")}</b><span class="${request.status === "paid" ? "request-paid" : "request-pending"}">${escapeHtml(request.status || "pending")} · ${new Date(request.createdAt || Date.now()).toLocaleDateString()}</span></div>${request.shareUrl || request.uri ? `<button class="compact-row-action" data-share-request="${escapeHtml(request.id || "")}" type="button">Share</button>` : ""}</div>`).join("") : `<div class="activity-empty">No tracked requests yet.</div>`;
  }

  async function loadRequests() {
    openSheet("requests"); renderRequests();
    const result = await get("/api/web/cash/requests?limit=30");
    if (result.ok) { const rows = result.data.requests || result.data.rows || []; writeLocalJson(REQUESTS_KEY, rows); renderRequests(rows); }
  }

  async function createTrackedRequest() {
    if (!state.wallet) return;
    const amount = $("receiveAmount").value.trim();
    if (!(Number(amount) > 0)) { $("receiveStatus").textContent = "Enter an exact amount to track this request."; $("receiveStatus").className = "status bad"; return; }
    const result = await post("/api/web/cash/requests", { asset: state.receiveAsset, amount, note: "SlimeCash payment request" });
    if (!result.ok) {
      const fallback = { id: crypto.randomUUID(), asset: state.receiveAsset, amount, uri: receiveRequestUrl(), shareUrl: receiveRequestUrl(), status: "untracked", createdAt: Date.now() };
      const rows = [fallback, ...localRequests()].slice(0, 30); writeLocalJson(REQUESTS_KEY, rows);
      $("receiveStatus").textContent = "Request link created. Automatic payment confirmation is not available yet."; $("receiveStatus").className = "status";
      return;
    }
    const request = result.data.request || result.data;
    const rows = [request, ...localRequests().filter((row) => row.id !== request.id)].slice(0, 30); writeLocalJson(REQUESTS_KEY, rows);
    const qrValue = request.qrData || request.uri || request.solanaPayUrl;
    const exactQr = qrValue ? QR.draw($("receiveQr"), qrValue) : false;
    if (!exactQr) QR.draw($("receiveQr"), state.wallet.publicKey);
    $("openReceiveWallet").href = request.uri || request.solanaPayUrl || receiveRequestUrl();
    $("receiveStatus").textContent = exactQr ? "Tracked request is live · waiting for confirmation…" : "Tracked request is live. Use Open in wallet or Share for the exact amount; the QR shows your address."; $("receiveStatus").className = "status";
    clearInterval(state.requestTimer);
    if (request.id) state.requestTimer = setInterval(async () => {
      const status = await get(`/api/web/cash/requests/${encodeURIComponent(request.id)}`);
      if (!status.ok) return;
      const updated = status.data.request || status.data;
      if (updated.status === "paid" || updated.status === "confirmed") {
        clearInterval(state.requestTimer); state.requestTimer = null;
        $("receiveStatus").textContent = "Payment confirmed on Solana."; $("receiveStatus").className = "status ok";
        toast("Payment received"); loadCashHistory();
      }
    }, 5000);
  }

  async function openNotifications() {
    openSheet("notifications");
    const local = readLocalJson(NOTIFICATIONS_KEY, { app: false, telegram: false, large: true });
    const result = await get("/api/web/cash/notifications"); const prefs = result.ok ? (result.data.preferences || result.data) : local;
    $("notifyApp").checked = Boolean(prefs.app); $("notifyTelegram").checked = Boolean(prefs.telegram); $("notifyLarge").checked = prefs.large !== false;
  }

  function notifyIncoming(title, body) {
    const prefs = readLocalJson(NOTIFICATIONS_KEY, {});
    if (!prefs.app || !("Notification" in window) || Notification.permission !== "granted" || document.visibilityState === "visible") return;
    try { new Notification(title, { body, icon: "/cash/icons/icon-192.png", tag: "slimecash-incoming" }); } catch {}
  }

  async function saveNotifications() {
    const prefs = { app: $("notifyApp").checked, telegram: $("notifyTelegram").checked, large: $("notifyLarge").checked };
    if (prefs.app && "Notification" in window && Notification.permission !== "granted") prefs.app = (await Notification.requestPermission()) === "granted";
    writeLocalJson(NOTIFICATIONS_KEY, prefs);
    const result = await post("/api/web/cash/notifications", prefs);
    $("notificationStatus").textContent = result.ok ? "Alerts saved to your account." : "App preferences saved on this device. Server alerts are not available yet."; $("notificationStatus").className = "status ok";
  }

  async function openSecurity() {
    openSheet("security"); const local = readLocalJson(SECURITY_KEY, { dailyLimit: 250, confirmNewRecipient: true });
    const result = await get("/api/web/cash/security"); state.securitySupported = result.ok; const settings = result.ok ? (result.data.security || result.data) : local;
    if (result.ok) state.cashSecurity = settings;
    $("dailyLimit").value = Number(settings.dailyLimit || 0) || ""; $("confirmNewRecipient").checked = settings.confirmNewRecipient !== false; $("spendPin").value = "";
  }

  async function saveSecurity() {
    const pin = $("spendPin").value.trim(), settings = { dailyLimit: Number($("dailyLimit").value || 0), confirmNewRecipient: $("confirmNewRecipient").checked };
    if (pin && !/^\d{4,8}$/.test(pin)) { $("securityStatus").textContent = "Use a 4–8 digit spend PIN."; $("securityStatus").className = "status bad"; return; }
    writeLocalJson(SECURITY_KEY, settings);
    const result = state.securitySupported ? await post("/api/web/cash/security", { ...settings, ...(pin ? { pin } : {}) }) : { ok: false };
    if (result.ok) state.cashSecurity = result.data.security || result.data;
    $("securityStatus").textContent = result.ok ? "Security settings saved." : "Warning preferences saved on this device. The PIN was not uploaded or enabled because server enforcement is not available yet."; $("securityStatus").className = "status ok"; $("spendPin").value = "";
  }

  async function revokeOtherSessions() {
    if (!confirm("Sign out every other SlimeCash and SlimeWire web session?")) return;
    const result = state.securitySupported ? await post("/api/web/cash/security/revoke-sessions", { keepCurrent: true }) : { ok: false };
    $("securityStatus").textContent = result.ok ? "Other sessions signed out." : "Session controls are not available yet. Change your account password or recovery key if you suspect access."; $("securityStatus").className = result.ok ? "status ok" : "status bad";
  }

  function verifyBackupFile(file) {
    const output = $("verifyBackupStatus"); if (!file) return;
    const reader = new FileReader(); reader.onload = async () => {
      const text = String(reader.result || "").trim();
      const localLooksValid = /\bsc_[A-Za-z0-9_-]{32,}\b/.test(text) || /SLIMECASH|recovery|secretKey|encrypted/i.test(text);
      if (!localLooksValid) { output.textContent = "This does not look like a SlimeCash account or wallet recovery file."; output.className = "verification-box bad"; return; }
      output.textContent = "File structure looks valid. This check stayed on your device and did not upload the recovery material. Keep the older backup until you have verified both account and wallet files.";
      output.className = "verification-box ok";
    }; reader.onerror = () => { output.textContent = "Could not read that file."; output.className = "verification-box bad"; }; reader.readAsText(file);
  }

  /* ---------------- ui plumbing ---------------- */
  function switchTab(tab) {
    if (tab === "terminal") {
      location.assign("/fun?from=cash");
      return;
    }
    document.querySelectorAll(".tab").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
    for (const view of ["home", "send", "terminal", "more"]) {
      $(`view-${view}`).hidden = view !== tab;
    }
    if (tab !== "home") stopDepositWatch();
  }

  function openSheet(id) {
    const backdrop = $(id); backdrop.hidden = false; document.body.style.overflow = "hidden";
    setTimeout(() => backdrop.querySelector("button, input, a, textarea")?.focus(), 0);
  }
  function closeSheet(id) {
    $(id).hidden = true;
    if (id === "addcash") stopDepositWatch();
    if (id === "receive" && state.requestTimer) { clearInterval(state.requestTimer); state.requestTimer = null; }
    if (![...document.querySelectorAll(".sheet-backdrop")].some((node) => !node.hidden)) document.body.style.overflow = "";
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
    const paintOnlineState = () => {
      let banner = document.getElementById("offlineBanner");
      if (navigator.onLine) { banner?.remove(); return; }
      if (!banner) { banner = document.createElement("div"); banner.id = "offlineBanner"; banner.className = "offline-banner"; banner.textContent = "Offline · balances may be old and sends are disabled"; document.body.prepend(banner); }
    };
    window.addEventListener("online", paintOnlineState); window.addEventListener("offline", paintOnlineState); paintOnlineState();
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
    renderPendingFund();
    if (readPendingFund() && !readPendingFund().arrived) {
      stopDepositWatch();
      state.depositTimer = setInterval(() => refreshBalance({ silent: true }), 8000);
    }

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
      loadCashHistory();
    }
    selectSendAsset("USDC");

    // Deep links: ?pay=handle opens a pay page, ?tab= / ?sheet= from app shortcuts.
    const pay = params.get("pay");
    if (pay) openPayPage(pay.replace(/^\$/, ""));
    const requestId = params.get("request");
    if (requestId) openTrackedPayPage(requestId, params.get("token"));
    const tab = params.get("tab");
    if (tab && ["home", "send", "terminal", "more"].includes(tab)) switchTab(tab);
    if (params.get("sheet") === "addcash" && ready) openAddCash();
    if (params.get("sheet") === "receive" && ready) openReceive();
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
      state.receiveAsset = ["SOL", "PYUSD"].includes(pill.dataset.receiveAsset) ? pill.dataset.receiveAsset : "USDC";
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
    const receipt = event.target.closest("[data-receipt]");
    if (receipt) openReceipt(receipt.dataset.receipt);
    const payContact = event.target.closest("[data-pay-contact]");
    if (payContact) {
      closeSheet("contacts"); switchTab("send"); $("sendTo").value = payContact.dataset.contactAddress || payContact.dataset.contactName || ""; resolveTarget($("sendTo").value);
    }
    const shareRequest = event.target.closest("[data-share-request]");
    if (shareRequest) {
      const request = localRequests().find((row) => String(row.id) === String(shareRequest.dataset.shareRequest));
      if (request?.shareUrl || request?.uri) copyText(request.shareUrl || request.uri);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const open = [...document.querySelectorAll(".sheet-backdrop")].reverse().find((node) => !node.hidden && node.id !== "onboard");
    if (open) closeSheet(open.id);
  });

  $("addCashBtn").addEventListener("click", openAddCash);
  $("receiveBtn").addEventListener("click", openReceive);
  $("activityAllBtn").addEventListener("click", () => loadCashHistory({ open: true }));
  $("activityRefreshBtn").addEventListener("click", () => loadCashHistory({ open: true }));
  $("shareReceiptBtn").addEventListener("click", async () => {
    const entry = state.selectedReceipt; if (!entry) return;
    const url = entry.signature ? `https://solscan.io/tx/${entry.signature}` : "";
    if (navigator.share) { try { await navigator.share({ title: "SlimeCash receipt", text: `${entry.title} · ${formatUsd(Math.abs(entry.amountUsd || 0))}`, url }); return; } catch {} }
    copyText(url || `${entry.title} · ${formatUsd(Math.abs(entry.amountUsd || 0))}`);
  });
  $("sendQuickBtn").addEventListener("click", () => switchTab("send"));
  $("sendBtn").addEventListener("click", submitSend);
  $("confirmSendBtn").addEventListener("click", confirmSend);
  $("copyDepositBtn").addEventListener("click", () => state.wallet && copyText(state.wallet.publicKey));
  $("coinbaseFundBtn").addEventListener("click", startCoinbaseFunding);
  $("copyReceiveBtn").addEventListener("click", () => state.wallet && copyText(state.wallet.publicKey));
  $("shareReceiveBtn").addEventListener("click", shareReceive);
  $("trackRequestBtn").addEventListener("click", createTrackedRequest);
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
    state.pendingRequestId = "";
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
  $("contactsBtn").addEventListener("click", loadContacts);
  $("saveContactBtn").addEventListener("click", saveContact);
  $("requestsBtn").addEventListener("click", loadRequests);
  $("newRequestBtn").addEventListener("click", () => { closeSheet("requests"); openReceive(); });
  $("notificationsBtn").addEventListener("click", openNotifications);
  $("saveNotificationsBtn").addEventListener("click", saveNotifications);
  $("securityBtn").addEventListener("click", openSecurity);
  $("saveSecurityBtn").addEventListener("click", saveSecurity);
  $("revokeSessionsBtn").addEventListener("click", revokeOtherSessions);
  $("verifyBackupBtn").addEventListener("click", () => openSheet("verifybackup"));
  $("verifyBackupFile").addEventListener("change", () => verifyBackupFile($("verifyBackupFile").files?.[0]));
  $("downloadFreshBackupBtn").addEventListener("click", () => backupCashAccount({ includeWallets: true }));
  $("spendBtn").addEventListener("click", () => openSheet("spend"));
  $("trustBtn").addEventListener("click", () => openSheet("trust"));
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

  /* ---------------- convert (Jupiter swap between core assets) ---------------- */
  function convertBalances() {
    return {
      PYUSD: state.pyusd,
      USDC: state.usdc,
      SOL: Math.max(0, (state.lamports || 0) / 1e9 - 0.004)
    };
  }
  function renderConvert() {
    document.querySelectorAll("[data-convert-from]").forEach((pill) => pill.classList.toggle("active", pill.dataset.convertFrom === state.convertFrom));
    document.querySelectorAll("[data-convert-to]").forEach((pill) => pill.classList.toggle("active", pill.dataset.convertTo === state.convertTo));
    const balance = convertBalances()[state.convertFrom] || 0;
    const shown = state.convertFrom === "SOL" ? balance.toFixed(4) : balance.toFixed(2);
    $("convertHint").textContent = `Available: ${state.convertFrom === "SOL" ? `${shown} SOL` : `$${shown} ${state.convertFrom}`}`;
    $("convertHint").className = "field-hint";
    $("convertGoBtn").textContent = `Convert ${state.convertFrom} → ${state.convertTo}`;
  }
  function openConvert() {
    if (!state.wallet) { toast("Wallet still setting up — try again in a second.", true); return; }
    if (state.pyusd > 0.01) { state.convertFrom = "PYUSD"; state.convertTo = "SOL"; }
    renderConvert();
    $("convertStatus").textContent = "";
    $("convertStatus").className = "status";
    openSheet("convert");
  }
  async function runConvert() {
    const amount = Number($("convertAmount").value || 0);
    const status = $("convertStatus");
    if (!(amount > 0)) { status.textContent = "Enter an amount."; status.className = "status bad"; return; }
    if (state.convertFrom === state.convertTo) { status.textContent = "Pick two different assets."; status.className = "status bad"; return; }
    const button = $("convertGoBtn");
    button.disabled = true;
    button.textContent = "Converting…";
    const result = await post("/api/web/cash/convert", {
      from: state.convertFrom,
      to: state.convertTo,
      amount: String(amount),
      convertAttemptId: crypto.randomUUID()
    });
    button.disabled = false;
    renderConvert();
    if (result.ok) {
      const outText = result.data.outputUi
        ? (result.data.to === "SOL" ? `${Number(result.data.outputUi).toFixed(4)} SOL` : `$${Number(result.data.outputUi).toFixed(2)} ${result.data.to}`)
        : result.data.to;
      status.textContent = `Converted — you got ${outText}.`;
      status.className = "status ok";
      addActivity({ type: "in", title: `Converted to ${result.data.to}`, sub: `${result.data.from} → ${result.data.to}`, asset: result.data.to, amountUsd: state.convertFrom === "SOL" ? amount * state.solUsd : amount, signature: result.data.signature || "", at: Date.now() });
      state.activity = [];
      renderActivity();
      $("convertAmount").value = "";
      toast(`Converted 🤝 ${outText}`);
      refreshBalance({ silent: true });
    } else {
      status.textContent = result.data.error || "Convert failed.";
      status.className = "status bad";
    }
  }
  $("convertBtn").addEventListener("click", openConvert);
  $("inviteBtn").addEventListener("click", openInvite);
  $("inviteCopyBtn").addEventListener("click", () => copyText(state.referralLink || `${location.origin}/cash/`));
  $("inviteShareBtn").addEventListener("click", shareInvite);
  $("convertGoBtn").addEventListener("click", runConvert);
  $("convertMaxBtn").addEventListener("click", () => {
    const balance = convertBalances()[state.convertFrom] || 0;
    $("convertAmount").value = state.convertFrom === "SOL" ? balance.toFixed(4) : balance.toFixed(2);
  });
  document.addEventListener("click", (event) => {
    const fromPill = event.target.closest("[data-convert-from]");
    if (fromPill) {
      state.convertFrom = fromPill.dataset.convertFrom;
      if (state.convertTo === state.convertFrom) state.convertTo = state.convertFrom === "SOL" ? "USDC" : "SOL";
      renderConvert();
    }
    const toPill = event.target.closest("[data-convert-to]");
    if (toPill) {
      state.convertTo = toPill.dataset.convertTo;
      if (state.convertTo === state.convertFrom) state.convertFrom = state.convertTo === "SOL" ? "PYUSD" : "SOL";
      renderConvert();
    }
  });

  $("openProviderBtn").addEventListener("click", () => {
    if (state.wallet) copyText(state.wallet.publicKey);
    const key = activeGuideKey();
    if (HANDOFF_PROVIDERS[key]) {
      const amount = Number($("fundAmount")?.value || 0);
      savePendingFund({
        asset: state.depositAsset,
        amount: amount >= 1 && amount <= 25000 ? amount : 0,
        provider: key,
        providerName: HANDOFF_PROVIDERS[key].name,
        at: Date.now()
      });
    }
  });
  $("pendingFundClose").addEventListener("click", clearPendingFund);
  $("pendingFundAction").addEventListener("click", () => {
    clearPendingFund();
    openConvert();
  });

  $("cashOutBtn").addEventListener("click", () => openSheet("cashout"));
  $("cashOutPyusdBtn").addEventListener("click", () => {
    closeSheet("cashout");
    switchTab("send");
    selectSendAsset("PYUSD");
    $("sendTo").focus();
    toast("Paste your Venmo/PayPal PYUSD deposit address (Solana network)");
  });
  $("cashOutUsdcBtn").addEventListener("click", () => {
    closeSheet("cashout");
    switchTab("send");
    selectSendAsset("USDC");
    $("sendTo").focus();
    toast("Paste your Coinbase USDC deposit address (Solana network)");
  });
  $("signOutBtn").addEventListener("click", () => {
    if (!confirm("Sign out? Make sure your SlimeCash recovery backup is saved first.")) return;
    setToken("");
    location.reload();
  });

  boot();
})();
