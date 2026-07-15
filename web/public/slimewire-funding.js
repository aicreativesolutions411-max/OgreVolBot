/* Shared wallet funding helpers for SlimeCash and SlimeWire Go. */
(() => {
  "use strict";

  const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const BASE58_LOOKUP = new Map([...BASE58_ALPHABET].map((char, index) => [char, index]));
  let web3Promise = null;

  function isMobile() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "")
      || (/Macintosh/i.test(navigator.userAgent || "") && navigator.maxTouchPoints > 1);
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
      if (index === undefined) throw new Error("Invalid Solana public key.");
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

  function publicKeyText(value, fieldName) {
    const text = String(value || "").trim();
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(text)) {
      throw new Error(`${fieldName} must be a valid Solana public key.`);
    }
    let decoded;
    try { decoded = base58Decode(text); }
    catch { throw new Error(`${fieldName} must be a valid Solana public key.`); }
    if (decoded.length !== 32) throw new Error(`${fieldName} must be a valid Solana public key.`);
    return text;
  }

  function amountText(value) {
    const text = String(value ?? "").trim();
    if (!/^(?:0|[1-9]\d*)(?:\.\d{1,9})?$/.test(text)) {
      throw new Error("SOL amount must use no more than 9 decimal places.");
    }
    const amount = Number(text);
    if (!Number.isFinite(amount) || amount < 0.005 || amount > 10) {
      throw new Error("SOL amount must be between 0.005 and 10.");
    }
    return text;
  }

  function createSolanaPayReference() {
    if (!globalThis.crypto?.getRandomValues) throw new Error("Secure payment references are not available in this browser.");
    const bytes = new Uint8Array(32);
    globalThis.crypto.getRandomValues(bytes);
    return base58Encode(bytes);
  }

  function solanaPayTransferUrl(options = {}) {
    const recipient = publicKeyText(options.recipient, "Recipient");
    const reference = publicKeyText(options.reference, "Reference");
    const amount = amountText(options.amountSol);
    const params = new URLSearchParams();
    params.set("amount", amount);
    params.set("reference", reference);
    const paymentLabel = String(options.label || "SlimeWire").trim();
    const message = String(options.message || "Fund your SlimeWire wallet").trim();
    if (paymentLabel) params.set("label", paymentLabel.slice(0, 48));
    if (message) params.set("message", message.slice(0, 80));
    return `solana:${recipient}?${params.toString()}`;
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
    loadWeb3,
    signSerialized,
    createSolanaPayReference,
    solanaPayTransferUrl
  };
})();
