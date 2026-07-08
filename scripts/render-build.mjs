// Render build wrapper — makes deploys FAST by skipping the dependency install when nothing changed.
// Render preserves the working directory (incl. node_modules) between builds, but `npm ci` DELETES
// node_modules and reinstalls everything from scratch every time — several minutes of every deploy spent
// re-downloading/re-building sharp, ffmpeg-static, solana, ethers for a lockfile that didn't change.
//
// Strategy (safe-by-default):
//   1. Hash package-lock.json. If it matches the hash stored INSIDE node_modules from the last build
//      AND canary packages resolve, SKIP the install entirely (seconds instead of minutes).
//   2. Any mismatch / missing canary / any doubt → full `npm ci` (the exact behavior we have today).
//   3. Always run the web build (it's seconds and depends on the working tree, not the lockfile).
// Escape hatch: set FORCE_FULL_INSTALL=1 on Render to bypass the skip for one deploy.
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
