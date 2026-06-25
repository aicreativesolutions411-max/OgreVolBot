// Unit + end-to-end checks for the vanity mint grinder/pool. No network, no real money.
//   node scripts/test-vanity.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  isBase58String, assertValidVanitySuffix, matchesVanity, grindVanityKeypair,
  keypairToPoolEntry, poolEntryToKeypair, readVanityPoolFile, writeVanityPoolFile, createVanityPool
} from "../src/lib/vanityMint.js";

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass += 1; } else { fail += 1; console.error(`  ✗ ${name}`); } };
const throws = (name, fn) => { try { fn(); fail += 1; console.error(`  ✗ ${name} (expected throw)`); } catch { pass += 1; } };

// 1) base58 validity — the whole point of SL1ME over slime/SLIME.
ok("SL1ME is base58", isBase58String("SL1ME"));
ok("sLime is base58", isBase58String("sLime"));
ok("slime is NOT base58 (lowercase l)", !isBase58String("slime"));
ok("SLIME is NOT base58 (uppercase I)", !isBase58String("SLIME"));
throws("assertValidVanitySuffix rejects slime", () => assertValidVanitySuffix("slime"));
throws("assertValidVanitySuffix rejects SLIME", () => assertValidVanitySuffix("SLIME"));
ok("assertValidVanitySuffix accepts SL1ME", assertValidVanitySuffix("SL1ME") === "SL1ME");

// 2) suffix matching, case sensitivity.
ok("matchesVanity endsWith", matchesVanity("AbcSL1ME", "SL1ME"));
ok("matchesVanity case-sensitive miss", !matchesVanity("Abcsl1me", "SL1ME"));
ok("matchesVanity caseInsensitive hit", matchesVanity("Abcsl1me", "SL1ME", { caseInsensitive: true }));

// 3) grind a short suffix end-to-end (2 chars ≈ 3.4k tries — instant) and confirm the address matches.
const short = "Ab";
const ground = grindVanityKeypair(short, { maxMs: 15000 });
ok(`grind "${short}" returned a keypair`, Boolean(ground?.keypair));
ok(`ground address ends with "${short}"`, ground && ground.keypair.publicKey.toBase58().endsWith(short));
ok("grind reported attempts", ground && ground.attempts > 0);

// 4) pool round-trip: write 2 ground entries, load via pool manager, pop both, verify + emptiness.
const tmp = path.join(os.tmpdir(), `vanity-pool-test-${process.pid}.json`);
try {
  const e1 = keypairToPoolEntry(grindVanityKeypair(short).keypair);
  const e2 = keypairToPoolEntry(grindVanityKeypair(short).keypair);
  writeVanityPoolFile(tmp, { suffix: short, keys: [e1, e2] });
  ok("pool file readback has 2 keys", readVanityPoolFile(tmp).length === 2);
  ok("poolEntryToKeypair round-trips publicKey", poolEntryToKeypair(e1).publicKey.toBase58() === e1.publicKey);

  const pool = createVanityPool({ file: tmp, suffix: short });
  ok("pool size = 2", pool.size() === 2);
  const k1 = pool.popKeypair();
  ok("pop #1 matches suffix", k1 && k1.publicKey.toBase58().endsWith(short));
  ok("pool size after pop = 1", pool.size() === 1);
  ok("persisted file shrank to 1", readVanityPoolFile(tmp).length === 1);
  pool.popKeypair();
  ok("pop on empty returns null", pool.popKeypair() === null);
} finally {
  try { fs.unlinkSync(tmp); } catch {}
}

console.log(`\nvanity tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
