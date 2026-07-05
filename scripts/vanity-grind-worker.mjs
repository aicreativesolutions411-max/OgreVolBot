// Background vanity-mint grinder worker (spawned by the bot via worker_threads). It ONLY does the CPU
// grind — generate keypairs, keep the ones whose address ends with the suffix, post each back to the
// main thread. All pool storage (add/pop/persist) happens on the main thread so there's never a file
// race with a launch consuming a key. Runs one gentle worker by default; the main thread terminates it
// once the stockpile is full and respawns it when launches draw it down.
import { parentPort, workerData } from "node:worker_threads";
import { Keypair } from "@solana/web3.js";
import { matchesVanity, keypairToPoolEntry } from "../src/lib/vanityMint.js";

const suffix = String(workerData?.suffix || "pump");
const caseInsensitive = Boolean(workerData?.caseInsensitive);

// Grind forever; the parent decides when to stop (terminate) once the pool hits its target.
for (;;) {
  const kp = Keypair.generate();
  if (matchesVanity(kp.publicKey.toBase58(), suffix, { caseInsensitive })) {
    parentPort.postMessage(keypairToPoolEntry(kp));
  }
}
