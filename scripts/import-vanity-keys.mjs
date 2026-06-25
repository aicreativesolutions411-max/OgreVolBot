// Import vanity mint keypairs from a FAST external grinder into the SlimeWire pool. Pure-Node grinding
// is too slow for a 5-char suffix (~4.4 hrs/key), so the real way to MASS-produce …SL1ME addresses is:
//
//   FREE / CPU (multi-core, ~minutes per key):
//     solana-keygen grind --ends-with SL1ME:200            # writes SL1ME…<pubkey>.json files
//   FAST / GPU (seconds per key, thousands/hour) — open-source CUDA grinders, e.g.:
//     vanity-keygen / solana-vanity-gpu on a rented cloud GPU (~$0.20–0.50/hr on runpod/vast.ai)
//
// Both emit standard Solana keypair JSON ([64 ints]). Point this at that folder (or a single file) and
// it converts + de-dupes + appends them to the pool the server loads at boot:
//
//   node scripts/import-vanity-keys.mjs <dir-or-file> [outPoolFile] [--suffix SL1ME]
//   node scripts/import-vanity-keys.mjs ./ground-keys ./data/vanity-mint-pool.json
//
// Then drop the pool file on Render's /var/data and set LAUNCH_VANITY_ENABLED=true.

import fs from "node:fs";
import path from "node:path";
import { Keypair } from "@solana/web3.js";
import {
  assertValidVanitySuffix, matchesVanity, keypairToPoolEntry,
  readVanityPoolFile, writeVanityPoolFile
} from "../src/lib/vanityMint.js";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const SRC = args[0];
const OUT = args[1] || path.join(process.env.DATA_DIR || path.join(process.cwd(), "data"), "vanity-mint-pool.json");
const sIdx = process.argv.indexOf("--suffix");
const SUFFIX = assertValidVanitySuffix(sIdx >= 0 ? process.argv[sIdx + 1] : (process.env.LAUNCH_VANITY_SUFFIX || "SL1ME"));
const CASE_INSENSITIVE = String(process.env.LAUNCH_VANITY_CASE_INSENSITIVE || "").toLowerCase() === "true";

if (!SRC) { console.error("Usage: node scripts/import-vanity-keys.mjs <dir-or-file> [outPoolFile] [--suffix SL1ME]"); process.exit(1); }

// Parse one Solana keypair JSON shape: a 64-int array, OR {secretKey:[...]}, OR an array of those.
function keypairsFromJson(json) {
  const out = [];
  const oneArray = (a) => { try { return Keypair.fromSecretKey(Uint8Array.from(a)); } catch { return null; } };
  if (Array.isArray(json) && typeof json[0] === "number") { const k = oneArray(json); if (k) out.push(k); }
  else if (Array.isArray(json)) { for (const e of json) { const a = Array.isArray(e) ? e : e?.secretKey; const k = a && oneArray(a); if (k) out.push(k); } }
  else if (json && Array.isArray(json.secretKey)) { const k = oneArray(json.secretKey); if (k) out.push(k); }
  return out;
}

const files = [];
const stat = fs.statSync(SRC);
if (stat.isDirectory()) { for (const n of fs.readdirSync(SRC)) if (n.toLowerCase().endsWith(".json")) files.push(path.join(SRC, n)); }
else files.push(SRC);

const found = [];
let scanned = 0, skipped = 0;
for (const f of files) {
  let json; try { json = JSON.parse(fs.readFileSync(f, "utf8")); } catch { skipped += 1; continue; }
  for (const kp of keypairsFromJson(json)) {
    scanned += 1;
    if (matchesVanity(kp.publicKey.toBase58(), SUFFIX, { caseInsensitive: CASE_INSENSITIVE })) found.push(keypairToPoolEntry(kp));
    else skipped += 1;
  }
}

const existing = readVanityPoolFile(OUT).filter((e) => e && e.publicKey && e.secretKey);
const seen = new Set(existing.map((e) => e.publicKey));
const fresh = found.filter((e) => !seen.has(e.publicKey));
const merged = existing.concat(fresh);
writeVanityPoolFile(OUT, { suffix: SUFFIX, keys: merged });

console.log(`suffix "${SUFFIX}" · scanned ${scanned} keypair(s) from ${files.length} file(s)`);
console.log(`matched +${fresh.length} new (skipped ${skipped} non-matching/dupe) → pool now ${merged.length} key(s)`);
console.log(`→ ${OUT}`);
