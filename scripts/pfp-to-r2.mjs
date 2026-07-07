#!/usr/bin/env node
// 📦 PFP → R2 — push browser-served PFP assets to a Cloudflare R2 bucket so they can be served from a CDN
// instead of bloating the git repo. Reuses the zero-dep signer in src/lib/r2.js. Idempotent + resumable via
// a local manifest (.pfp-r2-manifest.json): a file whose key+size already uploaded is skipped, so re-runs are
// cheap and a killed run just continues.
//
// USAGE (needs the same R2_* env the app's backup uses — R2 egress is FREE, so serving from R2 costs nothing):
//   R2_ACCOUNT_ID=… R2_ACCESS_KEY_ID=… R2_SECRET_ACCESS_KEY=… R2_BUCKET=… \
//     node scripts/pfp-to-r2.mjs [dir ...]
//   • no args  → uploads the browser-served dirs (characters) by default
//   • dir args → e.g. `characters bg hat` (relative to web/public/pfp) to push more
//   • --all    → every dir under web/public/pfp except _incoming/_done
//   • --prefix=pfp  → key prefix in the bucket (default "pfp"); objects land at <prefix>/<dir>/<file>
//
// After it finishes it prints the public base to set as PFP_CDN_BASE (once the bucket has public access or a
// custom domain — see PFP_R2_RUNBOOK.md). Verifies nothing about the app; it only uploads.
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { r2PutObject, r2Configured } from "../src/lib/r2.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PFP_DIR = path.join(ROOT, "web", "public", "pfp");
const MANIFEST = path.join(ROOT, ".pfp-r2-manifest.json");
const DEFAULT_DIRS = ["characters"];               // browser-served only; compositing inputs stay on disk
const CONCURRENCY = Math.max(1, Number(process.env.PFP_R2_CONCURRENCY) || 8);

const CT = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml" };
const contentType = (f) => CT[path.extname(f).toLowerCase()] || "application/octet-stream";

function cfg() {
  return { accountId: process.env.R2_ACCOUNT_ID || "", accessKeyId: process.env.R2_ACCESS_KEY_ID || "", secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "", bucket: process.env.R2_BUCKET || "" };
}
async function walk(dir, base = dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p, base));
    else if (e.isFile() && /\.(png|jpe?g|webp|gif|svg)$/i.test(e.name)) out.push(p);
  }
  return out;
}

const args = process.argv.slice(2);
const prefix = (args.find((a) => a.startsWith("--prefix=")) || "--prefix=pfp").split("=")[1].replace(/^\/+|\/+$/g, "");
const wantAll = args.includes("--all");
const dirArgs = args.filter((a) => !a.startsWith("--"));

const c = cfg();
if (!r2Configured(c)) { console.error("❌ R2 not configured. Set R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET."); process.exit(1); }

let dirs = dirArgs.length ? dirArgs : DEFAULT_DIRS;
if (wantAll) dirs = (await fs.readdir(PFP_DIR, { withFileTypes: true })).filter((e) => e.isDirectory() && !["_incoming", "_done"].includes(e.name)).map((e) => e.name);

let manifest = {};
try { manifest = JSON.parse(fsSync.readFileSync(MANIFEST, "utf8")); } catch { manifest = {}; }

const jobs = [];
for (const d of dirs) {
  const abs = path.join(PFP_DIR, d);
  for (const file of await walk(abs)) {
    const rel = path.relative(PFP_DIR, file).split(path.sep).join("/");   // e.g. characters/u_ab12.png
    const key = `${prefix}/${rel}`;
    const size = fsSync.statSync(file).size;
    if (manifest[key] && manifest[key] === size) continue;               // already uploaded (same size) → skip
    jobs.push({ file, key, size });
  }
}
console.log(`📦 ${jobs.length} file(s) to upload to r2://${c.bucket}/${prefix}/ (${dirs.join(", ")}); ${Object.keys(manifest).length} already done.`);
if (!jobs.length) { console.log("✅ Nothing to do — everything already uploaded."); process.exit(0); }

let done = 0, fail = 0, i = 0;
async function worker() {
  while (i < jobs.length) {
    const j = jobs[i++];
    try {
      const body = await fs.readFile(j.file);
      const r = await r2PutObject(c, j.key, body, contentType(j.file));
      if (r.ok) { manifest[j.key] = j.size; done++; }
      else { fail++; console.error(`  ✗ ${j.key} → HTTP ${r.status}`); }
    } catch (e) { fail++; console.error(`  ✗ ${j.key} → ${e.message}`); }
    if ((done + fail) % 50 === 0) { fsSync.writeFileSync(MANIFEST, JSON.stringify(manifest)); process.stdout.write(`  …${done + fail}/${jobs.length}\r`); }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
fsSync.writeFileSync(MANIFEST, JSON.stringify(manifest));
console.log(`\n✅ uploaded ${done}, failed ${fail}. Manifest: ${path.relative(ROOT, MANIFEST)}`);
console.log(`\nNext: give the bucket public access (r2.dev) or a custom domain, then set on Render:`);
console.log(`   PFP_CDN_BASE=https://<your-r2-public-or-custom-domain>`);
console.log(`(app serves /pfp/characters/* from there when set; falls back to local when unset). See PFP_R2_RUNBOOK.md.`);
