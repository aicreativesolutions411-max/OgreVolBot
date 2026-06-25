// Offline vanity-mint pool filler. Grinds N keypairs whose address ends with a suffix and appends
// them to the pool file the server loads at boot.
//
//   node scripts/grind-vanity.mjs [suffix] [count] [outFile]
//   node scripts/grind-vanity.mjs SL1ME 25
//   LAUNCH_VANITY_SUFFIX=SL1ME node scripts/grind-vanity.mjs
//
// Pure Node is fine for short suffixes and small batches. For "SL1ME" (5 chars ≈ 656M tries/key) at
// real scale, prefer the Solana CLI which is far faster and multi-threaded in Rust:
//   solana-keygen grind --ends-with SL1ME:25
// (then convert those keypair JSONs into pool entries, or just run this overnight on a spare box).

import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { Keypair } from "@solana/web3.js";
import {
  assertValidVanitySuffix, matchesVanity, expectedAttempts,
  keypairToPoolEntry, readVanityPoolFile, writeVanityPoolFile
} from "../src/lib/vanityMint.js";

const SUFFIX = assertValidVanitySuffix(process.argv[2] || process.env.LAUNCH_VANITY_SUFFIX || "SL1ME");
const CASE_INSENSITIVE = String(process.env.LAUNCH_VANITY_CASE_INSENSITIVE || "").toLowerCase() === "true";
const COUNT = Math.max(1, Number(process.argv[3] || process.env.LAUNCH_VANITY_GRIND_COUNT || 25));
const OUT_FILE = process.argv[4] || process.env.LAUNCH_VANITY_POOL_FILE
  || path.join(process.env.DATA_DIR || path.join(process.cwd(), "data"), "vanity-mint-pool.json");

if (!isMainThread) {
  // Worker: grind forever, post each match back to the main thread.
  const { suffix, caseInsensitive } = workerData;
  for (;;) {
    const kp = Keypair.generate();
    if (matchesVanity(kp.publicKey.toBase58(), suffix, { caseInsensitive })) {
      parentPort.postMessage(keypairToPoolEntry(kp));
    }
  }
} else {
  const here = fileURLToPath(import.meta.url);
  const workers = Math.max(1, (os.cpus()?.length || 2) - 1);
  const found = [];
  const start = Date.now();
  let totalRate = 0;

  console.log(`[grind] suffix="${SUFFIX}" count=${COUNT} workers=${workers} caseInsensitive=${CASE_INSENSITIVE}`);
  console.log(`[grind] ~${Math.round(expectedAttempts(SUFFIX, { caseInsensitive: CASE_INSENSITIVE })).toLocaleString()} attempts/key on average (58^${SUFFIX.length}). For real speed use: solana-keygen grind --ends-with ${SUFFIX}:${COUNT}`);
  console.log(`[grind] out → ${OUT_FILE}`);

  const pool = [];
  for (let i = 0; i < workers; i += 1) {
    const w = new Worker(here, { workerData: { suffix: SUFFIX, caseInsensitive: CASE_INSENSITIVE } });
    pool.push(w);
    w.on("message", (entry) => {
      if (found.length >= COUNT) return;
      found.push(entry);
      const secs = (Date.now() - start) / 1000;
      console.log(`[grind] ${found.length}/${COUNT}  ${entry.publicKey}  (${secs.toFixed(1)}s)`);
      if (found.length >= COUNT) finish();
    });
    w.on("error", (e) => console.error(`[grind] worker error: ${e.message}`));
  }

  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    for (const w of pool) w.terminate();
    const existing = readVanityPoolFile(OUT_FILE).filter((e) => e && e.publicKey && e.secretKey);
    const seen = new Set(existing.map((e) => e.publicKey));
    const merged = existing.concat(found.filter((e) => !seen.has(e.publicKey)));
    writeVanityPoolFile(OUT_FILE, { suffix: SUFFIX, keys: merged });
    const secs = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[grind] done: +${found.length} new, pool now ${merged.length} key(s) in ${secs}s → ${OUT_FILE}`);
    process.exit(0);
  }
}
