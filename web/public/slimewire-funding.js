/* Shared wallet funding helpers for SlimeCash and SlimeWire Go. */
(() => {
  "use strict";

  const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const BASE58_LOOKUP = new Map([...BASE58_ALPHABET].map((char, index) => [char, index]));
  const MOBILE_PENDING_KEY = "slimewireMobileFundingPending:v2";
  const MOBILE_SESSION_PREFIX = "slimewireMobileFundingSession:v2:";
  const MWA_AUTHORIZATION_PREFIX = "slimewireMwaFundingAuthorization:v1:";
  const MOBILE_CALLBACK_KEYS = [
    "sw_fund_provider", "sw_fund_stage", "sw_fund_state", "nonce", "data", "errorCode", "errorMessage",
    "phantom_encryption_public_key", "solflare_encryption_public_key"
  ];
  const MOBILE_PENDING_MAX_AGE_MS = 20 * 60 * 1000;
  let web3Promise = null;
  let naclPromise = null;
  let mwaPromise = null;

  function isMobile() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "")
      || (/Macintosh/i.test(navigator.userAgent || "") && navigator.maxTouchPoints > 1);
  }

  function supportsMwa() {
    const ua = navigator.userAgent || "";
    return Boolean(window.isSecureContext !== false
      && /Android/i.test(ua)
      && /Chrome\/[0-9]+/i.test(ua)
      && !/(?:EdgA|OPR|SamsungBrowser|Firefox)\//i.test(ua));
  }

  function candidates() {
    return [
      window.backpack?.solana,
      window.okxwallet?.solana,
      window.braveSolana,
      window.xnft?.solana,
      window.solana && !window.solana.isPhantom ? window.solana : null
    ].filter(Boolean);
  }

  function provider(kind) {
    if (kind === "phantom") {
      const found = window.phantom?.solana || (window.solana?.isPhantom ? window.solana : null);
      return found?.isPhantom ? found : null;
    }
    if (kind === "solflare") {
      const found = window.solflare;
      return found && (found.isSolflare || typeof found.connect === "function") ? found : null;
    }
    if (kind === "other") return candidates().find((item) => typeof item.connect === "function") || null;
    return null;
  }

  function label(kind, found = provider(kind)) {
    if (kind === "phantom") return "Phantom";
    if (kind === "solflare") return "Solflare";
    const name = String(found?.name || found?.providerName || "").trim();
    return name ? name.slice(0, 30) : "Solana wallet";
  }

  function returnUrl(kind, href = location.href) {
    const url = new URL(href, location.origin);
    url.searchParams.set("fund", kind);
    return url.toString();
  }

  function browseUrl(kind, href = location.href) {
    const target = encodeURIComponent(returnUrl(kind, href));
    const ref = encodeURIComponent(location.origin);
    if (kind === "phantom") return `https://phantom.app/ul/browse/${target}?ref=${ref}`;
    if (kind === "solflare") return `https://solflare.com/ul/v1/browse/${target}?ref=${ref}`;
    return "";
  }

  function installUrl(kind) {
    if (kind === "phantom") return "https://phantom.app/download";
    if (kind === "solflare") return "https://solflare.com/download";
    return "";
  }

  function loadScript({ selector, src, datasetKey, ready, errorMessage }) {
    if (ready()) return Promise.resolve(ready());
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(selector);
      const script = existing || document.createElement("script");
      const done = () => ready() ? resolve(ready()) : reject(new Error(errorMessage));
      if (!existing) {
        script.src = src;
        script.dataset[datasetKey] = "1";
        script.onload = done;
        script.onerror = () => reject(new Error(errorMessage));
        document.head.appendChild(script);
      } else {
        script.addEventListener("load", done, { once: true });
        script.addEventListener("error", () => reject(new Error(errorMessage)), { once: true });
      }
    });
  }

  function loadWeb3() {
    if (window.solanaWeb3) return Promise.resolve(window.solanaWeb3);
    if (!web3Promise) web3Promise = loadScript({
      selector: "script[data-slimewire-solana-web3]",
      src: "/vendor/solana-web3.iife.min.js",
      datasetKey: "slimewireSolanaWeb3",
      ready: () => window.solanaWeb3,
      errorMessage: "The Solana signing library could not load. Try again."
    });
    return web3Promise;
  }

  function loadNacl() {
    if (window.nacl?.box) return Promise.resolve(window.nacl);
    if (!naclPromise) naclPromise = loadScript({
      selector: "script[data-slimewire-tweetnacl]",
      src: "/vendor/tweetnacl-fast.min.js",
      datasetKey: "slimewireTweetnacl",
      ready: () => window.nacl?.box ? window.nacl : null,
      errorMessage: "The secure wallet connection helper could not load. Try again."
    });
    return naclPromise;
  }

  function loadMwa() {
    if (window.SlimeWireMwa?.authorizeAndSign) return Promise.resolve(window.SlimeWireMwa);
    if (!mwaPromise) mwaPromise = loadScript({
      selector: "script[data-slimewire-mwa]",
      src: "/vendor/slimewire-mwa.iife.min.js",
      datasetKey: "slimewireMwa",
      ready: () => window.SlimeWireMwa?.authorizeAndSign ? window.SlimeWireMwa : null,
      errorMessage: "The installed-wallet approval helper could not load. Try again."
    });
    return mwaPromise;
  }

  function b64ToBytes(value) {
    const binary = atob(String(value || ""));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }

  function bytesToB64(value) {
    const bytes = value instanceof Uint8Array ? value : new Uint8Array(value || []);
    let binary = "";
    for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
    return btoa(binary);
  }

  function base58Encode(value) {
    const bytes = value instanceof Uint8Array ? value : new Uint8Array(value || []);
    if (!bytes.length) return "";
    let number = 0n;
    for (const byte of bytes) number = (number << 8n) + BigInt(byte);
    let encoded = "";
    while (number > 0n) {
      encoded = BASE58_ALPHABET[Number(number % 58n)] + encoded;
      number /= 58n;
    }
    for (const byte of bytes) {
      if (byte !== 0) break;
      encoded = `1${encoded}`;
    }
    return encoded || "1";
  }

  function base58Decode(value) {
    const text = String(value || "").trim();
    if (!text) return new Uint8Array();
    let number = 0n;
    for (const char of text) {
      const index = BASE58_LOOKUP.get(char);
      if (index === undefined) throw new Error("Invalid mobile wallet response.");
      number = number * 58n + BigInt(index);
    }
    const bytes = [];
    while (number > 0n) {
      bytes.unshift(Number(number & 255n));
      number >>= 8n;
    }
    for (const char of text) {
      if (char !== "1") break;
      bytes.unshift(0);
    }
    return new Uint8Array(bytes);
  }

  function readJsonStorage(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value && typeof value === "object" ? value : null;
    } catch {
      return null;
    }
  }

  function writeJsonStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  }

  function mobileSession(kind) {
    if (!["phantom", "solflare"].includes(kind)) return null;
    const session = readJsonStorage(`${MOBILE_SESSION_PREFIX}${kind}`);
    if (!session || session.kind !== kind || !session.publicKey || !session.session
        || !session.walletEncryptionPublicKey || !session.dappEncryptionPublicKey || !session.dappEncryptionSecretKey) return null;
    return session;
  }

  function clearMobileSession(kind) {
    try { localStorage.removeItem(`${MOBILE_SESSION_PREFIX}${kind}`); } catch {}
  }

  async function authorizeAndSignMobile(kind, options = {}) {
    if (!supportsMwa()) throw new Error("One-tap installed-wallet approval is not supported in this browser.");
    if (!["phantom", "solflare"].includes(kind)) throw new Error("Choose Phantom or Solflare.");
    if (typeof options.prepareTransaction !== "function") throw new Error("The funding transaction could not be prepared.");
    const mwa = await loadMwa();
    const cacheKey = `${MWA_AUTHORIZATION_PREFIX}${kind}`;
    const cachedAuthorization = readJsonStorage(cacheKey);
    try {
      const result = await mwa.authorizeAndSign({
        cachedAuthorization,
        prepareTransaction: options.prepareTransaction,
      });
      if (!result?.publicKey || !result?.order?.walletFundingAttemptId || !result?.signedTransaction) {
        throw new Error("The wallet did not return a complete funding approval.");
      }
      if (result.authorization) writeJsonStorage(cacheKey, result.authorization);
      return result;
    } catch (error) {
      const message = String(error?.message || "");
      if (/authorization|auth token|account|invalid/i.test(message)) {
        try { localStorage.removeItem(cacheKey); } catch {}
      }
      throw error;
    }
  }

  function readMobilePending() { return readJsonStorage(MOBILE_PENDING_KEY); }
  function storeMobilePending(pending) {
    if (!writeJsonStorage(MOBILE_PENDING_KEY, pending)) throw new Error("Mobile wallet handoff storage is blocked. Allow site storage and try again.");
  }
  function clearMobilePending() { try { localStorage.removeItem(MOBILE_PENDING_KEY); } catch {} }

  function cleanReturnUrl(href = location.href) {
    const url = new URL(href, location.origin);
    for (const key of MOBILE_CALLBACK_KEYS) url.searchParams.delete(key);
    url.searchParams.delete("fund");
    return url.toString();
  }

  function mobileCallbackUrl(kind, stage, stateId, href = location.href) {
    const url = new URL(cleanReturnUrl(href), location.origin);
    url.searchParams.set("sw_fund_provider", kind);
    url.searchParams.set("sw_fund_stage", stage);
    url.searchParams.set("sw_fund_state", stateId);
    return url.toString();
  }

  function cleanMobileCallbackUrl() {
    try {
      const url = new URL(location.href);
      for (const key of MOBILE_CALLBACK_KEYS) url.searchParams.delete(key);
      history.replaceState(null, "", url.toString());
    } catch {}
  }

  function providerEncryptionKeyParam(kind) {
    return kind === "solflare" ? "solflare_encryption_public_key" : "phantom_encryption_public_key";
  }

  function mobileMethodUrl(kind, method) {
    // Android can treat Phantom's HTTPS universal link as an ordinary website even when the app is
    // installed. Phantom officially supports this custom protocol handler; it targets the app
    // directly instead of relying on the user's Android "open supported links" setting.
    if (kind === "phantom") return `phantom://v1/${method}`;
    if (kind === "solflare") return `https://solflare.com/ul/v1/${method}`;
    return "";
  }

  function mobileLaunchUrl(kind, methodUrl) {
    if (kind !== "phantom" || !/Android/i.test(navigator.userAgent || "")) return methodUrl;
    const parsed = new URL(methodUrl);
    const target = `${parsed.host}${parsed.pathname}${parsed.search}`;
    // Keep an installed-wallet handoff installed-wallet-only. A Play Store fallback turns a normal
    // approval into an unexpected storefront detour and can cover the PWA when the user returns.
    return `intent://${target}#Intent;scheme=phantom;package=app.phantom;end`;
  }

  function randomState(nacl) {
    return base58Encode(nacl.randomBytes(16));
  }

  function decryptPayload(nacl, encryptedData, nonce, walletEncryptionPublicKey, dappEncryptionSecretKey) {
    const sharedSecret = nacl.box.before(base58Decode(walletEncryptionPublicKey), base58Decode(dappEncryptionSecretKey));
    const opened = nacl.box.open.after(base58Decode(encryptedData), base58Decode(nonce), sharedSecret);
    if (!opened) throw new Error("The mobile wallet response could not be verified.");
    return JSON.parse(new TextDecoder().decode(opened));
  }

  function encryptPayload(nacl, payload, walletEncryptionPublicKey, dappEncryptionSecretKey) {
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const sharedSecret = nacl.box.before(base58Decode(walletEncryptionPublicKey), base58Decode(dappEncryptionSecretKey));
    const encrypted = nacl.box.after(new TextEncoder().encode(JSON.stringify(payload)), nonce, sharedSecret);
    return { nonce: base58Encode(nonce), payload: base58Encode(encrypted) };
  }

  async function startMobileConnect(kind, intent = {}) {
    if (!["phantom", "solflare"].includes(kind) || !isMobile()) return false;
    const nacl = await loadNacl();
    const keyPair = nacl.box.keyPair();
    const stateId = randomState(nacl);
    const returnHref = cleanReturnUrl(intent.returnUrl || location.href);
    const pending = {
      kind,
      stage: "connect",
      stateId,
      amountSol: String(intent.amountSol || ""),
      walletIndex: intent.walletIndex !== null && intent.walletIndex !== "" && Number.isFinite(Number(intent.walletIndex)) ? Number(intent.walletIndex) : null,
      returnUrl: returnHref,
      dappEncryptionPublicKey: base58Encode(keyPair.publicKey),
      dappEncryptionSecretKey: base58Encode(keyPair.secretKey),
      createdAt: Date.now()
    };
    storeMobilePending(pending);
    const url = new URL(mobileMethodUrl(kind, "connect"));
    url.searchParams.set("app_url", location.origin);
    url.searchParams.set("dapp_encryption_public_key", pending.dappEncryptionPublicKey);
    url.searchParams.set("redirect_link", mobileCallbackUrl(kind, "connect", stateId, returnHref));
    url.searchParams.set("cluster", "mainnet-beta");
    location.assign(mobileLaunchUrl(kind, url.toString()));
    return true;
  }

  async function startMobileSign(kind, options = {}) {
    const session = mobileSession(kind);
    if (!session) throw new Error(`Reconnect ${label(kind)} once, then approve the transfer.`);
    if (!options.transaction || !options.walletFundingAttemptId) throw new Error("The wallet funding order is incomplete.");
    const nacl = await loadNacl();
    const stateId = randomState(nacl);
    const returnHref = cleanReturnUrl(options.returnUrl || location.href);
    const encrypted = encryptPayload(nacl, {
      transaction: base58Encode(b64ToBytes(options.transaction)),
      session: session.session
    }, session.walletEncryptionPublicKey, session.dappEncryptionSecretKey);
    storeMobilePending({
      kind,
      stage: "sign",
      stateId,
      amountSol: String(options.amountSol || ""),
      walletIndex: options.walletIndex !== null && options.walletIndex !== "" && Number.isFinite(Number(options.walletIndex)) ? Number(options.walletIndex) : null,
      walletFundingAttemptId: String(options.walletFundingAttemptId),
      returnUrl: returnHref,
      createdAt: Date.now()
    });
    // Phantom deprecated signAndSendTransaction; signTransaction returns the signed bytes so the
    // existing SlimeWire endpoint can verify the exact destination and amount before broadcasting.
    const url = new URL(mobileMethodUrl(kind, "signTransaction"));
    url.searchParams.set("dapp_encryption_public_key", session.dappEncryptionPublicKey);
    url.searchParams.set("nonce", encrypted.nonce);
    url.searchParams.set("redirect_link", mobileCallbackUrl(kind, "sign", stateId, returnHref));
    url.searchParams.set("payload", encrypted.payload);
    location.assign(mobileLaunchUrl(kind, url.toString()));
    return true;
  }

  async function consumeMobileCallback() {
    const params = new URLSearchParams(location.search || "");
    const kind = String(params.get("sw_fund_provider") || "").toLowerCase();
    const stage = String(params.get("sw_fund_stage") || "").toLowerCase();
    if (!["phantom", "solflare"].includes(kind) || !["connect", "sign"].includes(stage)) return null;
    const pending = readMobilePending();
    const finish = (result) => { clearMobilePending(); cleanMobileCallbackUrl(); return result; };
    if (!pending || pending.kind !== kind || pending.stage !== stage || pending.stateId !== params.get("sw_fund_state")) {
      return finish({ stage: "error", kind, error: "This wallet approval did not match the pending SlimeWire transfer. Start funding again." });
    }
    if (Date.now() - Number(pending.createdAt || 0) > MOBILE_PENDING_MAX_AGE_MS) {
      return finish({ stage: "error", kind, error: "The wallet approval expired. Start funding again." });
    }
    const errorCode = params.get("errorCode") || "";
    const errorMessage = params.get("errorMessage") || "";
    if (errorCode || errorMessage) {
      const reconnect = String(errorCode) === "4100";
      if (reconnect) clearMobileSession(kind);
      return finish({
        stage: "error",
        kind,
        reconnect,
        amountSol: pending.amountSol,
        walletIndex: pending.walletIndex,
        error: reconnect ? `${label(kind)} needs to reconnect once before funding.` : (errorMessage || (String(errorCode) === "4001" ? "Wallet approval was cancelled." : `Wallet error ${errorCode}.`))
      });
    }
    try {
      const nacl = await loadNacl();
      if (stage === "connect") {
        const walletEncryptionPublicKey = params.get(providerEncryptionKeyParam(kind)) || "";
        const payload = decryptPayload(nacl, params.get("data"), params.get("nonce"), walletEncryptionPublicKey, pending.dappEncryptionSecretKey);
        const publicKey = String(payload.public_key || payload.publicKey || "").trim();
        const sessionToken = String(payload.session || "").trim();
        if (!publicKey || !sessionToken) throw new Error(`${label(kind)} connected without returning a wallet session.`);
        const session = {
          kind,
          publicKey,
          session: sessionToken,
          walletEncryptionPublicKey,
          dappEncryptionPublicKey: pending.dappEncryptionPublicKey,
          dappEncryptionSecretKey: pending.dappEncryptionSecretKey,
          connectedAt: Date.now()
        };
        if (!writeJsonStorage(`${MOBILE_SESSION_PREFIX}${kind}`, session)) throw new Error("Could not remember the wallet connection. Allow site storage and try again.");
        return finish({ stage: "connected", kind, publicKey, amountSol: pending.amountSol, walletIndex: pending.walletIndex });
      }
      const session = mobileSession(kind);
      if (!session) throw new Error(`${label(kind)} connection was lost. Connect it again.`);
      const payload = decryptPayload(nacl, params.get("data"), params.get("nonce"), session.walletEncryptionPublicKey, session.dappEncryptionSecretKey);
      const signedBase58 = String(payload.transaction || "").trim();
      if (!signedBase58) throw new Error(`${label(kind)} did not return the signed transaction.`);
      return finish({
        stage: "signed",
        kind,
        signedTransaction: bytesToB64(base58Decode(signedBase58)),
        walletFundingAttemptId: pending.walletFundingAttemptId,
        amountSol: pending.amountSol,
        walletIndex: pending.walletIndex
      });
    } catch (error) {
      return finish({ stage: "error", kind, error: error?.message || "The mobile wallet approval could not be completed." });
    }
  }

  async function signSerialized(found, serializedTransaction) {
    if (!found || typeof found.signTransaction !== "function") throw new Error("Open this page inside your Solana wallet and reconnect.");
    const web3 = await loadWeb3();
    const transaction = web3.Transaction.from(b64ToBytes(serializedTransaction));
    const signed = await found.signTransaction(transaction);
    return bytesToB64((signed || transaction).serialize());
  }

  window.SlimeWireFunding = {
    provider,
    label,
    candidates,
    isMobile,
    returnUrl,
    browseUrl,
    installUrl,
    loadWeb3,
    loadNacl,
    loadMwa,
    supportsMwa,
    authorizeAndSignMobile,
    mobileSession,
    clearMobileSession,
    startMobileConnect,
    startMobileSign,
    consumeMobileCallback,
    signSerialized
  };
})();
