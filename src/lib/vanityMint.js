// Vanity mint grinder + pre-ground pool for SlimeWire launches.
//
// We control the mint keypair at launch time (the launch service signs the create tx with it), so
// we can make every coin's address END WITH a chosen suffix (e.g. "SL1ME") — exactly how pump.fun
// coins end in "pump". Grinding is just generate-keypair-until-the-address-matches.
//
// BASE58 REALITY: Solana addresses are base58, whose alphabet EXCLUDES `0 O I` and lowercase `l`.
// So a literal lowercase "slime" is impossible; "SL1ME" (digit 1 for i) and "sLime" (capital L) are
// the valid spellings. assertValidVanitySuffix() rejects anything that can never appear.
//
// SPEED: matching a k-char suffix takes ~58^k attempts on average — "SL1ME" (5) ≈ 656M tries, which
// is minutes-to-hours in pure Node. So we DON'T grind on the launch path. Instead an OFFLINE script
// (scripts/grind-vanity.mjs, or `solana-keygen grind --ends-with SL1ME:N` for real speed) fills a
// POOL file, the server loads it into memory at boot, and each launch pops one instantly. If the
// pool is empty the launch falls back to a random mint (never hangs a paid launch) and logs a warning.

import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import fs from "node:fs";
import path from "node:path";

// Bitcoin/Solana base58 alphabet — note the missing 0, O, I, and lowercase l.
export const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE58_SET = new Set(BASE58_ALPHABET);

export function isBase58String(value) {
  const str = String(value || "");
  if (!str) return false;
  for (const ch of str) if (!BASE58_SET.has(ch)) return false;
  return true;
}

// Throw a clear, actionable error if the requested suffix can NEVER appear in a base58 address.
export function assertValidVanitySuffix(suffix) {
  const s = String(suffix || "");
  if (!s) throw new Error("Vanity suffix is empty.");
  const bad = [...new Set([...s].filter((ch) => !BASE58_SET.has(ch)))];
  if (bad.length) {
    throw new Error(`Vanity suffix "${s}" has non-base58 character(s): ${bad.join(" ")}. Solana addresses exclude 0 O I and lowercase l — try e.g. "SL1ME" or "sLime".`);
  }
  return s;
}

export function matchesVanity(address, suffix, { caseInsensitive = false } = {}) {
  const a = String(address || "");
  const s = String(suffix || "");
  if (!s) return false;
  return caseInsensitive ? a.toLowerCase().endsWith(s.toLowerCase()) : a.endsWith(s);
}

// Average attempts to hit a case-sensitive suffix of length k ≈ 58^k. For ETA/΅cost messaging only.
export function expectedAttempts(suffix, { caseInsensitive = false } = {}) {
  const len = String(suffix || "").length;
  if (!len) return 0;
  return Math.pow(caseInsensitive ? 58 / 1.6 : 58, len);
}

// Grind ONE keypair whose address ends with `suffix`. Bounded by maxMs / maxAttempts so a caller can
// never hang; returns { keypair, attempts, ms } or null if it gave up. Pure CPU — fine for offline
// pool-filling and short test suffixes; do NOT call this inline for a 5-char suffix.
export function grindVanityKeypair(suffix, { caseInsensitive = false, maxMs = 0, maxAttempts = 0 } = {}) {
  assertValidVanitySuffix(suffix);
  const start = Date.now();
  let attempts = 0;
  for (;;) {
    const kp = Keypair.generate();
    attempts += 1;
    if (matchesVanity(kp.publicKey.toBase58(), suffix, { caseInsensitive })) {
      return { keypair: kp, attempts, ms: Date.now() - start };
    }
    if (maxAttempts && attempts >= maxAttempts) return null;
    if (maxMs && attempts % 1024 === 0 && Date.now() - start >= maxMs) return null;
  }
}

// ---- pool file (de)serialization -----------------------------------------------------------------
// A pool entry is { publicKey, secretKey } where secretKey is the base58 of the 64-byte secret key —
// the same shape PumpPortal/our launch flow already encrypts at use time. The pool holds UNUSED mint
// keypairs (no funds), so at-rest risk is low, but keep the file off public paths regardless.
export function keypairToPoolEntry(kp) {
  return { publicKey: kp.publicKey.toBase58(), secretKey: bs58.encode(Buffer.from(kp.secretKey)) };
}
export function poolEntryToKeypair(entry) {
  return Keypair.fromSecretKey(bs58.decode(entry.secretKey));
}

export function readVanityPoolFile(file) {
  try {
    const j = JSON.parse(fs.readFileSync(file, "utf8"));
    if (Array.isArray(j)) return j;
    return Array.isArray(j?.keys) ? j.keys : [];
  } catch { return []; }
}
export function writeVanityPoolFile(file, { suffix, keys }) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ suffix, updatedAt: new Date().toISOString(), count: keys.length, keys }));
}

// ---- in-memory pool (the launch path uses this) --------------------------------------------------
// Loaded once at boot. popKeypair() is synchronous (the launch service calls generateMintKeypair()
// synchronously) — it shifts a verified entry, persists the shrunk pool, and returns a Keypair, or
// null when empty so the caller can fall back to a random mint.
export function createVanityPool({ file, suffix, caseInsensitive = false, log = () => {} }) {
  let mem = [];
  let loaded = false;

  function load() {
    mem = readVanityPoolFile(file).filter((e) => e && e.publicKey && e.secretKey
      && matchesVanity(e.publicKey, suffix, { caseInsensitive }));
    loaded = true;
    return mem.length;
  }
  function size() { if (!loaded) load(); return mem.length; }
  function persist() {
    try { writeVanityPoolFile(file, { suffix, keys: mem }); }
    catch (e) { log("vanity_pool_persist_failed", e?.message || String(e)); }
  }
  function popKeypair() {
    if (!loaded) load();
    while (mem.length) {
      const entry = mem.shift();
      try {
        const kp = poolEntryToKeypair(entry);
        if (matchesVanity(kp.publicKey.toBase58(), suffix, { caseInsensitive })) { persist(); return kp; }
      } catch { /* skip corrupt entry */ }
    }
    return null;
  }
  // Stock a freshly-ground key into the pool (in-memory + persist). Called on the SAME main thread as
  // popKeypair(), so the background auto-grinder never races the launch pop against the file. Ignores
  // dupes + keys that don't match the suffix. Returns the new pool size.
  function add(entry) {
    if (!loaded) load();
    if (!entry || !entry.publicKey || !entry.secretKey) return mem.length;
    if (!matchesVanity(entry.publicKey, suffix, { caseInsensitive })) return mem.length;
    if (mem.some((e) => e.publicKey === entry.publicKey)) return mem.length;
    mem.push(entry);
    persist();
    return mem.length;
  }
  return { load, size, add, persist, popKeypair, get suffix() { return suffix; } };
}
