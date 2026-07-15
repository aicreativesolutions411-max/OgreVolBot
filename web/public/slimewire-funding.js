/* Shared injected-wallet funding helpers for SlimeCash and SlimeWire Go. */
(() => {
  "use strict";

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

  function returnUrl(kind, href = location.href) {
    const url = new URL(href);
    url.hash = "";
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

  function loadWeb3() {
    if (window.solanaWeb3) return Promise.resolve(window.solanaWeb3);
    if (web3Promise) return web3Promise;
    web3Promise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-slimewire-solana-web3]');
      const script = existing || document.createElement("script");
      const done = () => window.solanaWeb3
        ? resolve(window.solanaWeb3)
        : reject(new Error("The Solana signing library did not load."));
      if (!existing) {
        script.src = "/vendor/solana-web3.iife.min.js";
        script.dataset.slimewireSolanaWeb3 = "1";
        script.onload = done;
        script.onerror = () => reject(new Error("The Solana signing library could not load. Try again."));
        document.head.appendChild(script);
      } else if (window.solanaWeb3) done();
      else {
        script.addEventListener("load", done, { once: true });
        script.addEventListener("error", () => reject(new Error("The Solana signing library could not load. Try again.")), { once: true });
      }
    });
    return web3Promise;
  }

  function b64ToBytes(value) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }

  function bytesToB64(value) {
    const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
    let binary = "";
    for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
    return btoa(binary);
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
    signSerialized
  };
})();
