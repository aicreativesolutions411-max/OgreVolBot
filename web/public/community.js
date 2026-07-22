(() => {
  "use strict";
  const TOKEN_KEY = "ogreWebToken";
  const API_BASE = String(window.OGRE_PORTAL_CONFIG?.apiBase || "https://app.slimewire.org").replace(/\/+$/, "");
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const state = { address: "", chain: "solana", token: localStorage.getItem(TOKEN_KEY) || "", payload: null, market: {}, bannerDataUrl: "", refreshTimer: null, pendingAction: null, directoryLoaded: false };

  function escapeHtml(value) { return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char])); }
  function validAddress(value) { const text = String(value || "").trim(); return /^0x[0-9a-fA-F]{40}$/.test(text) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(text); }
  function normalizedAddress(value) { const text = String(value || "").trim(); return text.startsWith("0x") ? text.toLowerCase() : text; }
  function short(value, left = 6, right = 5) { const text = String(value || ""); return text.length > left + right + 3 ? `${text.slice(0, left)}…${text.slice(-right)}` : text; }
  function formatUsd(value) { const number = Number(value); if (!Number.isFinite(number) || number <= 0) return "—"; if (number >= 1e9) return `$${(number / 1e9).toFixed(number >= 10e9 ? 1 : 2)}B`; if (number >= 1e6) return `$${(number / 1e6).toFixed(number >= 10e6 ? 1 : 2)}M`; if (number >= 1e3) return `$${(number / 1e3).toFixed(number >= 10e3 ? 1 : 2)}K`; return `$${number.toLocaleString(undefined, { maximumFractionDigits: 2 })}`; }
  function formatCount(value) { const number = Number(value); return Number.isFinite(number) && number > 0 ? number.toLocaleString() : "—"; }
  function relativeTime(value) { const age = Date.now() - Date.parse(value || ""); if (!Number.isFinite(age)) return "now"; const minute = 60_000, hour = 60 * minute, day = 24 * hour; if (age < minute) return "now"; if (age < hour) return `${Math.floor(age / minute)}m`; if (age < day) return `${Math.floor(age / hour)}h`; return `${Math.floor(age / day)}d`; }
  function setToken(token) { state.token = token || ""; if (state.token) localStorage.setItem(TOKEN_KEY, state.token); else localStorage.removeItem(TOKEN_KEY); }
  function toast(message) { const node = $("[data-toast]"); node.textContent = message; node.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove("show"), 2200); }

  async function api(path, options = {}) {
    const headers = { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}) };
    try {
      const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) }, cache: "no-store" });
      const type = response.headers.get("content-type") || "", data = type.includes("json") ? await response.json() : { error: `Request failed (${response.status})` };
      return { ok: response.ok && data?.ok !== false, status: response.status, data };
    } catch (error) { return { ok: false, status: 0, data: { error: error?.message || "Connection failed" } }; }
  }
  function post(path, body) { return api(path, { method: "POST", body: JSON.stringify(body) }); }
  function apiError(result, fallback = "That did not work. Try again.") { return result?.data?.message || result?.data?.error || fallback; }
  function apiAssetUrl(value) { const url = String(value || ""); return url.startsWith("/") ? `${API_BASE}${url}` : url; }

  function addressFromLocation() {
    const match = location.pathname.match(/^\/c\/([^/?#]+)/i);
    if (match) { try { return decodeURIComponent(match[1]); } catch { return match[1]; } }
    return new URLSearchParams(location.search).get("ca") || "";
  }
  function terminalUrl() { return `/#${state.chain === "robinhood" ? "rhtrade" : "trade"}/${encodeURIComponent(state.address)}`; }
  function communityUrl() { return `${location.origin}/community?ca=${encodeURIComponent(state.address)}`; }
  function setAvatar(node, url, fallback = "SW") { if (!node) return; node.style.backgroundImage = url ? `url(${JSON.stringify(url)})` : ""; node.textContent = url ? "" : String(fallback || "SW").slice(0, 2).toUpperCase(); }
  function socialLink(label, url) { return url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>` : ""; }

  async function loadDirectory(force = false) {
    if (state.directoryLoaded && !force) return;
    const node = $("[data-directory]"); node.innerHTML = '<div class="directory-empty">Loading active communities…</div>';
    const result = await api("/api/web/communities?limit=12");
    if (!result.ok) { node.innerHTML = '<div class="directory-empty">Active communities are refreshing. Try again in a moment.</div>'; return; }
    const rows = result.data?.communities || []; state.directoryLoaded = true;
    if (!rows.length) { node.innerHTML = '<div class="directory-empty"><b>Be the first community on the board.</b><span>Paste a coin above, claim its page and start the conversation.</span></div>'; return; }
    node.innerHTML = rows.map((row) => {
      const banner = apiAssetUrl(row.bannerUrl), owner = row.owner || {}, chain = row.chain === "robinhood" ? "RH" : "SOL";
      return `<a class="directory-card" href="/community?ca=${encodeURIComponent(row.address)}"><div class="directory-cover"${banner ? ` style="background-image:url(${escapeHtml(JSON.stringify(banner))})"` : ""}></div><div class="directory-card-copy"><div><span>${escapeHtml(chain)}</span><b>${escapeHtml(row.title || row.ticker || "Coin community")}</b><small>${row.ticker ? `$${escapeHtml(row.ticker)}` : escapeHtml(short(row.address))}</small></div><p>${escapeHtml(row.description || "Live coin discussion, links and market pulse.")}</p><footer><span>${Number(row.memberCount || 0).toLocaleString()} members</span><span>${Number(row.activity24h || 0).toLocaleString()} today</span>${owner.xHandle ? `<span>@${escapeHtml(owner.xHandle)}</span>` : ""}</footer></div></a>`;
    }).join("");
  }

  function showFinder() {
    clearTimeout(state.refreshTimer); state.address = ""; state.payload = null;
    $("[data-finder]").hidden = false; $("[data-community-shell]").hidden = true;
    $("[data-directory-section]").hidden = false; loadDirectory();
    history.pushState(null, "", "/community"); setTimeout(() => $("[data-ca-input]")?.focus(), 30);
  }

  async function openAddress(rawAddress) {
    if (!validAddress(rawAddress)) { toast("Paste a valid Solana or 0x contract address."); return; }
    state.address = normalizedAddress(rawAddress); state.chain = state.address.startsWith("0x") ? "robinhood" : "solana";
    $("[data-finder]").hidden = true; $("[data-directory-section]").hidden = true; $("[data-community-shell]").hidden = false;
    history.pushState(null, "", `/community?ca=${encodeURIComponent(state.address)}`);
    $("[data-chain]").textContent = state.chain === "robinhood" ? "ROBINHOOD CHAIN" : "SOLANA";
    $$('[data-terminal]').forEach((link) => { link.href = terminalUrl(); });
    $$('[data-copy-ca]').forEach((button) => { button.title = state.address; });
    $("[data-contract]").textContent = state.address; $("[data-copy-ca]").textContent = short(state.address, 7, 5);
    renderLoadingShell();
    await Promise.allSettled([loadCommunity(), refreshMarket(true)]);
    scheduleRefresh();
  }

  function renderLoadingShell() {
    $("[data-community-title]").textContent = "Loading coin…"; $("[data-ticker]").textContent = "";
    $("[data-updated]").textContent = "Connecting to live sources…";
    for (const stat of ["mc", "volume", "liquidity", "holders"]) $(`[data-stat="${stat}"]`).textContent = "—";
  }

  async function loadCommunity() {
    const result = await api(`/api/web/community?ca=${encodeURIComponent(state.address)}`);
    if (!result.ok) { toast(apiError(result, "Could not load this community.")); return; }
    state.payload = result.data; renderCommunity();
  }

  function renderCommunity() {
    const payload = state.payload || {}, community = payload.community || {}, exists = Boolean(payload.exists), viewer = payload.viewer;
    const title = community.title || state.market.name || state.market.symbol || "Coin community", ticker = community.ticker || state.market.symbol || "";
    $("[data-community-title]").textContent = title; $("[data-about-title]").textContent = title;
    $("[data-ticker]").textContent = ticker ? `$${ticker.replace(/^\$+/, "")}` : "";
    $("[data-description]").textContent = community.description || "This community has not added a description yet.";
    $("[data-rules]").textContent = community.rules || "Keep it useful. No impersonation, wallet requests or misleading links.";
    const hero = $("[data-hero]"), bannerUrl = apiAssetUrl(community.bannerUrl); hero.style.backgroundImage = bannerUrl ? `url(${JSON.stringify(bannerUrl)})` : "";
    setAvatar($("[data-coin-avatar]"), state.market.imageUrl, ticker || title);
    const xUrl = community.xUrl || state.market.xUrl || "", telegramUrl = community.telegramUrl || state.market.telegramUrl || "", websiteUrl = community.websiteUrl || state.market.websiteUrl || "";
    $("[data-socials]").innerHTML = socialLink("X", xUrl) + socialLink("Telegram", telegramUrl) + socialLink("Website", websiteUrl) + socialLink("DexScreener", state.market.dexUrl);
    $("[data-official-links]").innerHTML = socialLink("X ↗", xUrl) + socialLink("Telegram ↗", telegramUrl) + socialLink("Website ↗", websiteUrl) || "<span>No links added yet.</span>";
    $("[data-member-count]").textContent = `${Number(community.memberCount || 0).toLocaleString()} member${Number(community.memberCount || 0) === 1 ? "" : "s"}`;
    const owner = community.owner || {}; $("[data-owner-name]").textContent = owner.name || "SlimeWire member"; setAvatar($("[data-owner-avatar]"), owner.avatar, owner.name);
    const ownerX = $("[data-owner-x]"); ownerX.hidden = !owner.xUrl; ownerX.href = owner.xUrl || "#"; ownerX.textContent = owner.xHandle ? `@${owner.xHandle}` : "";
    $("[data-not-created]").hidden = exists; $("[data-created-content]").hidden = !exists;
    const edit = $("[data-edit]"); edit.hidden = !viewer?.isOwner;
    const join = $("[data-join]"); join.hidden = !exists || viewer?.isOwner; join.classList.toggle("joined", Boolean(viewer?.isMember)); join.textContent = viewer?.isMember ? "Joined" : "Join community";
    setAvatar($("[data-viewer-avatar]"), viewer?.avatar, viewer?.name || "SW");
    $("[data-pulse-members]").textContent = Number(community.memberCount || 0).toLocaleString();
    $("[data-pulse-posts]").textContent = Number(community.postCount || 0).toLocaleString();
    $("[data-pulse-active]").textContent = Number(community.activity24h || 0).toLocaleString();
    $("[data-pulse-x]").textContent = Number(community.xLinkedCount || 0).toLocaleString();
    renderThread(payload.posts || []);
    updateXShareLink();
  }

  function renderThread(posts) {
    const thread = $("[data-thread]");
    if (!posts.length) { thread.innerHTML = '<div class="thread-empty">No posts yet. Start the conversation.</div>'; return; }
    thread.innerHTML = posts.map((post) => {
      const author = post.author || {}, avatarStyle = author.avatar ? ` style="background-image:url(${escapeHtml(JSON.stringify(author.avatar))})"` : "";
      const shareUrl = `https://x.com/intent/post?text=${encodeURIComponent(`${post.text}\n\n${communityUrl()}#post-${post.id}`)}`;
      return `<article class="post" id="post-${escapeHtml(post.id)}"><div class="user-avatar"${avatarStyle}>${author.avatar ? "" : escapeHtml((author.name || "SW").slice(0, 2).toUpperCase())}</div><div><div class="post-head"><b>${escapeHtml(author.name || "SlimeWire member")}</b>${post.ownerPost ? '<span class="owner-badge">CREATOR</span>' : ""}${author.xUrl ? `<a href="${escapeHtml(author.xUrl)}" target="_blank" rel="noopener">@${escapeHtml(author.xHandle)}</a>` : ""}<time datetime="${escapeHtml(post.createdAt)}">${escapeHtml(relativeTime(post.createdAt))}</time></div><p>${escapeHtml(post.text)}</p>${post.xPostUrl ? `<a class="attached-x" href="${escapeHtml(post.xPostUrl)}" target="_blank" rel="noopener"><b>𝕏 Attached post</b><span>Open the original post on X ↗</span></a>` : ""}<div class="post-actions"><button class="${post.viewerReacted ? "reacted" : ""}" type="button" data-react-post="${escapeHtml(post.id)}" data-reacted="${post.viewerReacted ? "1" : "0"}">● Slime ${Number(post.reactionCount || 0).toLocaleString()}</button><a href="${escapeHtml(shareUrl)}" target="_blank" rel="noopener">Share on X</a><button type="button" data-copy-post="${escapeHtml(post.id)}">Copy link</button></div></div></article>`;
    }).join("");
  }

  async function refreshMarket(initial = false) {
    const address = state.address;
    const dexPromise = fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(address)}`, { headers: { Accept: "application/json" } }).then((response) => response.ok ? response.json() : null).catch(() => null);
    const detailPath = state.chain === "robinhood" ? `/api/web/rh/token?address=${encodeURIComponent(address)}` : `/api/web/token-read?mint=${encodeURIComponent(address)}`;
    const [dexResult, detailResult, searchResult] = await Promise.allSettled([dexPromise, api(detailPath), api(`/api/web/token-search?q=${encodeURIComponent(address)}`)]);
    if (address !== state.address) return;
    const dexData = dexResult.status === "fulfilled" ? dexResult.value : null;
    const exactPairs = (dexData?.pairs || []).filter((pair) => String(pair?.baseToken?.address || "").toLowerCase() === address.toLowerCase());
    const pair = exactPairs.sort((a, b) => Number(b?.liquidity?.usd || 0) - Number(a?.liquidity?.usd || 0))[0] || null;
    const detailResponse = detailResult.status === "fulfilled" ? detailResult.value : null, detail = detailResponse?.ok ? (detailResponse.data?.coin || detailResponse.data || {}) : {};
    const searchResponse = searchResult.status === "fulfilled" ? searchResult.value : null;
    const searchRows = searchResponse?.ok ? (searchResponse.data?.matches || []) : [], search = searchRows.find((row) => String(row.address || row.tokenMint || "").toLowerCase() === address.toLowerCase()) || {};
    const info = pair?.info || {}, socials = Array.isArray(info.socials) ? info.socials : [], websites = Array.isArray(info.websites) ? info.websites : [];
    const social = (type) => socials.find((item) => [type, type === "twitter" ? "x" : type].includes(String(item?.type || item?.platform || "").toLowerCase()))?.url || "";
    state.market = {
      ...state.market,
      name: pair?.baseToken?.name || search.name || detail.name || detail.tokenName || state.market.name || "",
      symbol: String(pair?.baseToken?.symbol || search.symbol || detail.symbol || state.market.symbol || "").replace(/^\$+/, ""),
      imageUrl: info.imageUrl || search.imageUrl || search.avatarUrl || detail.imageUrl || detail.iconUrl || state.market.imageUrl || "",
      marketCap: Number(pair?.marketCap || pair?.fdv || search.marketCap || search.marketCapUsd || detail.marketCapUsd || detail.marketCap || detail.mc || state.market.marketCap || 0),
      volume: Number(pair?.volume?.h24 || search.volumeH24 || search.volumeUsd || detail.volume24hUsd || detail.volumeH24 || detail.vol24 || state.market.volume || 0),
      liquidity: Number(pair?.liquidity?.usd || search.liquidityUsd || detail.liquidityUsd || detail.liq || state.market.liquidity || 0),
      holders: Number(detail.holderCount || detail.holders || detail.holdersCount || search.holderCount || search.holders || state.market.holders || 0),
      change: Number(pair?.priceChange?.h24 ?? detail.priceChange24h ?? detail.ch24),
      xUrl: social("twitter") || search.twitterUrl || detail.twitterUrl || state.market.xUrl || "",
      telegramUrl: social("telegram") || search.telegramUrl || detail.telegramUrl || state.market.telegramUrl || "",
      websiteUrl: websites[0]?.url || search.websiteUrl || detail.websiteUrl || state.market.websiteUrl || "",
      dexUrl: pair?.url || (pair?.pairAddress ? `https://dexscreener.com/${pair.chainId}/${pair.pairAddress}` : state.market.dexUrl || ""),
      updatedAt: Date.now()
    };
    renderMarket();
    if (state.payload) renderCommunity();
    if (initial && !pair && !detailResponse?.ok && !searchResponse?.ok) toast("Live sources are warming up; this page will keep retrying.");
  }

  function renderMarket() {
    $('[data-stat="mc"]').textContent = formatUsd(state.market.marketCap);
    $('[data-stat="volume"]').textContent = formatUsd(state.market.volume);
    $('[data-stat="liquidity"]').textContent = formatUsd(state.market.liquidity);
    $('[data-stat="holders"]').textContent = formatCount(state.market.holders);
    const change = $("[data-change]"), value = Number(state.market.change); change.className = Number.isFinite(value) ? (value >= 0 ? "up" : "down") : ""; change.textContent = Number.isFinite(value) ? `${value >= 0 ? "+" : ""}${value.toFixed(1)}% 24h` : "live";
    $("[data-updated]").textContent = `Updated ${new Date(state.market.updatedAt || Date.now()).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}`;
    if (!state.payload) {
      const title = state.market.name || state.market.symbol || "Coin community", ticker = state.market.symbol || "";
      $("[data-community-title]").textContent = title; $("[data-about-title]").textContent = title; $("[data-ticker]").textContent = ticker ? `$${ticker}` : "";
      setAvatar($("[data-coin-avatar]"), state.market.imageUrl, ticker || title);
      $("[data-socials]").innerHTML = socialLink("X", state.market.xUrl) + socialLink("Telegram", state.market.telegramUrl) + socialLink("Website", state.market.websiteUrl) + socialLink("DexScreener", state.market.dexUrl);
    }
  }
  function scheduleRefresh() { clearTimeout(state.refreshTimer); state.refreshTimer = setTimeout(async () => { if (!document.hidden && state.address) await Promise.allSettled([refreshMarket(), loadCommunity()]); scheduleRefresh(); }, 12_000); }

  function requireAuth(action) { if (state.token && state.payload?.viewer) return true; state.pendingAction = action; $("[data-auth-dialog]").showModal(); return false; }
  function openEditor() {
    if (!requireAuth("edit")) return;
    const community = state.payload?.community || {};
    $("[data-editor-title]").textContent = state.payload?.exists ? "Edit community page" : "Create coin community";
    for (const field of ["title", "ticker", "description", "xUrl", "telegramUrl", "websiteUrl", "rules"]) $(`[data-field="${field}"]`).value = community[field] || (field === "title" ? state.market.name || "" : field === "ticker" ? state.market.symbol || "" : field === "xUrl" ? state.market.xUrl || "" : field === "telegramUrl" ? state.market.telegramUrl || "" : field === "websiteUrl" ? state.market.websiteUrl || "" : "");
    $("[data-x-handle]").value = state.payload?.viewer?.xHandle || ""; state.bannerDataUrl = ""; $("[data-banner]").value = ""; $("[data-form-error]").textContent = ""; $("[data-editor]").showModal();
  }

  async function saveEditor(event) {
    event.preventDefault(); const submit = $('[data-editor-form] button[type="submit"]'), errorNode = $("[data-form-error]"); submit.disabled = true; submit.textContent = "Saving…"; errorNode.textContent = "";
    const xHandle = $("[data-x-handle]").value.trim().replace(/^@+/, ""), currentX = state.payload?.viewer?.xHandle || "";
    if (xHandle && xHandle !== currentX) { const xResult = await post("/api/web/profile/x", { handle: xHandle }); if (!xResult.ok) { errorNode.textContent = apiError(xResult); submit.disabled = false; submit.textContent = "Save community"; return; } }
    const body = { address: state.address, bannerDataUrl: state.bannerDataUrl || undefined };
    for (const field of ["title", "ticker", "description", "xUrl", "telegramUrl", "websiteUrl", "rules"]) body[field] = $(`[data-field="${field}"]`).value.trim();
    const result = await post("/api/web/community/save", body); submit.disabled = false; submit.textContent = "Save community";
    if (!result.ok) { errorNode.textContent = apiError(result); return; }
    state.payload = result.data; state.directoryLoaded = false; $("[data-editor]").close(); renderCommunity(); toast(state.payload.exists ? "Community saved." : "Community created.");
  }

  async function compressBanner(file) {
    if (!file) return ""; if (file.size > 8 * 1024 * 1024) throw new Error("Choose an image under 8 MB.");
    const url = URL.createObjectURL(file);
    try {
      const image = await new Promise((resolve, reject) => { const node = new Image(); node.onload = () => resolve(node); node.onerror = () => reject(new Error("Could not read that image.")); node.src = url; });
      const canvas = document.createElement("canvas"); canvas.width = 1800; canvas.height = 560; const context = canvas.getContext("2d");
      const scale = Math.max(canvas.width / image.width, canvas.height / image.height), width = image.width * scale, height = image.height * scale;
      context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      return canvas.toDataURL("image/jpeg", .84);
    } finally { URL.revokeObjectURL(url); }
  }

  async function handleJoin() {
    if (!requireAuth("join")) return; const button = $("[data-join]"), join = !state.payload?.viewer?.isMember; button.disabled = true;
    const result = await post("/api/web/community/join", { address: state.address, join }); button.disabled = false;
    if (!result.ok) { toast(apiError(result)); return; } state.payload = result.data; state.directoryLoaded = false; renderCommunity(); toast(join ? "Joined community." : "Left community.");
  }
  async function handlePost() {
    if (!requireAuth("post")) return; const input = $("[data-post-text]"), text = input.value.trim(); if (!text) { input.focus(); return; }
    const xInput = $("[data-x-post]"), xPostUrl = xInput.value.trim(), button = $("[data-post]"); button.disabled = true; button.textContent = "Posting…";
    const result = await post("/api/web/community/post", { address: state.address, text, xPostUrl }); button.disabled = false; button.textContent = "Post";
    if (!result.ok) { toast(apiError(result)); return; } state.payload = result.data; input.value = ""; xInput.value = ""; state.directoryLoaded = false; $("[data-character-count]").textContent = "0 / 700"; renderCommunity(); toast("Posted to the live community board.");
  }

  async function handleReaction(button) {
    if (!requireAuth("react")) return;
    const active = button.dataset.reacted !== "1"; button.disabled = true;
    const result = await post("/api/web/community/react", { address: state.address, postId: button.dataset.reactPost, active }); button.disabled = false;
    if (!result.ok) { toast(apiError(result)); return; }
    state.payload = result.data; state.directoryLoaded = false; renderCommunity();
  }

  async function auth(mode) {
    const username = $("[data-auth-user]").value.trim(), password = $("[data-auth-password]").value, errorNode = $("[data-auth-error]"); errorNode.textContent = "";
    const buttons = $$('[data-auth-mode]'); buttons.forEach((button) => { button.disabled = true; });
    const result = await post(mode === "create" ? "/api/web/signup" : "/api/web/password-login", { username, password, ref: localStorage.getItem("ggRef") || "" });
    buttons.forEach((button) => { button.disabled = false; });
    if (!result.ok || !result.data?.token) { errorNode.textContent = apiError(result, "Could not sign in."); return; }
    setToken(result.data.token); $("[data-auth-dialog]").close(); await loadCommunity(); const action = state.pendingAction; state.pendingAction = null; if (action === "edit") openEditor(); else if (action === "join") handleJoin(); else if (action === "post") handlePost(); else if (action === "react") toast("Signed in. Tap Slime again to react.");
  }

  async function shareCommunity() {
    const title = state.payload?.community?.title || state.market.name || "Coin community", text = `${title} on SlimeWire`;
    if (navigator.share) { try { await navigator.share({ title, text, url: communityUrl() }); return; } catch {} }
    await navigator.clipboard.writeText(communityUrl()); toast("Community link copied.");
  }
  function updateXShareLink() {
    const title = state.payload?.community?.title || state.market.name || "this coin", ticker = state.payload?.community?.ticker || state.market.symbol || "";
    const draft = $("[data-post-text]")?.value.trim(), lead = draft || `Join the ${title} community on SlimeWire${ticker ? ` · $${ticker.replace(/^\$+/, "")}` : ""}`;
    const href = `https://x.com/intent/post?text=${encodeURIComponent(`${lead}\n\n${communityUrl()}`)}`;
    $("[data-share-x]").href = href; $("[data-community-x-share]").href = href;
  }
  async function copyAddress() { try { await navigator.clipboard.writeText(state.address); toast("Contract copied."); } catch { toast(short(state.address)); } }

  $("[data-ca-form]").addEventListener("submit", (event) => { event.preventDefault(); openAddress($("[data-ca-input]").value); });
  $("[data-change-coin]").addEventListener("click", showFinder);
  $("[data-directory-refresh]").addEventListener("click", () => loadDirectory(true));
  $$('[data-copy-ca]').forEach((button) => button.addEventListener("click", copyAddress));
  $("[data-share]").addEventListener("click", shareCommunity); $("[data-start-community]").addEventListener("click", openEditor); $("[data-edit]").addEventListener("click", openEditor); $("[data-join]").addEventListener("click", handleJoin); $("[data-post]").addEventListener("click", handlePost); $("[data-refresh]").addEventListener("click", async () => { await Promise.allSettled([loadCommunity(), refreshMarket()]); toast("Community refreshed."); });
  $("[data-post-text]").addEventListener("input", (event) => { $("[data-character-count]").textContent = `${event.target.value.length} / 700`; updateXShareLink(); });
  $$('[data-prompt]').forEach((button) => button.addEventListener("click", () => { const input = $("[data-post-text]"); if (!input.value.trim()) input.value = button.dataset.prompt || ""; input.focus(); $("[data-character-count]").textContent = `${input.value.length} / 700`; updateXShareLink(); }));
  $("[data-thread]").addEventListener("click", async (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const react = target?.closest("[data-react-post]"); if (react) { await handleReaction(react); return; }
    const copy = target?.closest("[data-copy-post]"); if (copy) { try { await navigator.clipboard.writeText(`${communityUrl()}#post-${copy.dataset.copyPost}`); toast("Post link copied."); } catch { toast("Could not copy that link."); } }
  });
  $$('[data-tab]').forEach((button) => button.addEventListener("click", () => { $$('[data-tab]').forEach((item) => item.classList.toggle("active", item === button)); $$('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== button.dataset.tab; }); }));
  $$('[data-close-dialog]').forEach((button) => button.addEventListener("click", () => $("[data-editor]").close())); $$('[data-close-auth]').forEach((button) => button.addEventListener("click", () => $("[data-auth-dialog]").close()));
  $("[data-editor-form]").addEventListener("submit", saveEditor); $("[data-banner]").addEventListener("change", async (event) => { try { state.bannerDataUrl = await compressBanner(event.target.files?.[0]); toast("Banner ready to save."); } catch (error) { $("[data-form-error]").textContent = error.message; } });
  $("[data-auth-form]").addEventListener("submit", (event) => { event.preventDefault(); auth("login"); });
  $('[data-auth-mode="create"]').addEventListener("click", () => auth("create"));
  window.addEventListener("popstate", () => { const address = addressFromLocation(); if (validAddress(address)) openAddress(address); else showFinder(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && state.address) { refreshMarket(); scheduleRefresh(); } });

  const initialAddress = addressFromLocation(); if (validAddress(initialAddress)) openAddress(initialAddress); else showFinder();
})();
