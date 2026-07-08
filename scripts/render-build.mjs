// Render build wrapper — trims the install portion of every deploy, safely.
//
// MEASURED FACT (verified 2026-07-08 via build logs): Render does a CLEAN CHECKOUT each build — the
// working tree, incl. node_modules, does NOT persist between deploys (canary probe was `false` on two
// consecutive fresh builds). So a "skip install if node_modules is warm" cache can't fire here; it's kept
// only as a correct no-op that would help if Render ever changes that (or when run locally).
//
// What ACTUALLY speeds Render up, and is applied unconditionally below:
//   • `--prefer-offline` — Render DOES cache npm's tarball store (~/.npm), so packages are reused from
//     cache instead of re-downloaded over the network.
//   • `--no-audit --no-fund` — skips the audit/funding network round-trips (pure deploy-time overhead).
//   • Fewer deps in package.json (dead `agent-twitter-client`, 47MB, removed) — less to install/build.
// Escape hatch: FORCE_FULL_INSTALL=1 forces the plain path (no behavioral difference on Render today).
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const lockFile = path.join(root, "package-lock.json");
const hashFile = path.join(root, "node_modules", ".render-lock-hash");
// Canaries: one pure-JS dep, one native dep (native = the expensive rebuild we're skipping), one devDep
// (the build needs tailwindcss). If any is missing the cache is unusable regardless of the hash.
const canaries = ["sharp", "ethers", "tailwindcss"].map((m) => path.join(root, "node_modules", m, "package.json"));

const run = (cmd) => { console.log(`[render-build] $ ${cmd}`); execSync(cmd, { cwd: root, stdio: "inherit" }); };

let lockHash = "";
try { lockHash = createHash("sha256").update(fs.readFileSync(lockFile)).digest("hex"); }
catch { console.log("[render-build] no package-lock.json?! falling back to npm ci"); }

const cachedHash = (() => { try { return fs.readFileSync(hashFile, "utf8").trim(); } catch { return ""; } })();
const canariesOk = canaries.every((f) => fs.existsSync(f));
const skip = !process.env.FORCE_FULL_INSTALL && lockHash && cachedHash === lockHash && canariesOk;

if (skip) {
  console.log(`[render-build] deps unchanged (lock ${lockHash.slice(0, 12)}…) + canaries present → SKIPPING install`);
} else {
  console.log(`[render-build] installing (lock changed: ${cachedHash !== lockHash}, canaries ok: ${canariesOk}, forced: ${Boolean(process.env.FORCE_FULL_INSTALL)})`);
  run("npm ci --no-audit --no-fund --prefer-offline");
  try { fs.writeFileSync(hashFile, lockHash); } catch { /* cache marker is best-effort */ }
}

// Workers pass --no-web (they only need node_modules; the web bundle is the web service's job).
if (!process.argv.includes("--no-web")) run("npm run build:web");
console.log("[render-build] done");
