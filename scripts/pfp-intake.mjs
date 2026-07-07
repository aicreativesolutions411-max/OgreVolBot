#!/usr/bin/env node
// 🧟 PFP INTAKE — turn images you generated anywhere (ChatGPT/Codex/web) into ready SlimeWire PFP assets.
//
// WORKFLOW (fully automated on our side — the only manual step is you generating + saving the PNGs):
//   1. Generate images in ChatGPT / your Codex agent / any tool (unlimited on your plan).
//   2. Save them into web/public/pfp/_incoming/<category>/  where <category> is one of:
//        characters  hat  prop  badge  bg
//      (characters + bg = full art, kept opaque; hat/prop/badge = sticker on WHITE bg, gets keyed transparent)
//   3. Run:  node scripts/pfp-intake.mjs        (then npm run build:web, commit, deploy)
//
// It cover-resizes characters/bg to 1024², white-keys + trims the stickers, writes them into the real asset
// folder with a u_<hash> prefix (idempotent — re-running skips ones already imported), and moves the
// originals into _incoming/_done/ so you can see what's been processed.
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "web", "public", "pfp");
const INBOX = path.join(ROOT, "_incoming");
const DONE = path.join(INBOX, "_done");
const CATS = ["characters", "hat", "prop", "badge", "bg"];
const OPAQUE = new Set(["characters", "bg"]);

for (const c of CATS) await fs.mkdir(path.join(INBOX, c), { recursive: true });
await fs.mkdir(DONE, { recursive: true });

// Stamp a clean, subtle "slimewire.org" wordmark bottom-right — brands every roll-one character PFP so the
// DB markets itself when people use them. Crisp vector text (not AI-rendered, so never garbled).
async function brandWordmark(buf, W = 1024) {
  const wm = Buffer.from(`<svg width="${W}" height="${W}" xmlns="http://www.w3.org/2000/svg"><g opacity="0.92">
    <rect x="${W - 322}" y="${W - 70}" width="292" height="44" rx="22" fill="#04120a" fill-opacity="0.62" stroke="#54e000" stroke-opacity="0.6" stroke-width="1.5"/>
    <circle cx="${W - 300}" cy="${W - 48}" r="8" fill="#7dff5b"/>
    <text x="${W - 282}" y="${W - 40}" font-family="Arial Black, Arial" font-weight="900" font-size="26" fill="#bfffa8" letter-spacing="0.5">slimewire.org</text>
  </g></svg>`);
  return sharp(buf).composite([{ input: wm, top: 0, left: 0 }]).png().toBuffer();
}
async function whiteKey(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 232 && g > 232 && b > 232) data[i + 3] = 0;
    else if (r > 208 && g > 208 && b > 208) data[i + 3] = Math.min(data[i + 3], 90);
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

const counts = Object.fromEntries(CATS.map((c) => [c, 0]));
let fail = 0;
for (const cat of CATS) {
  const dir = path.join(INBOX, cat);
  const files = (await fs.readdir(dir).catch(() => [])).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  for (const f of files) {
    const src = path.join(dir, f);
    try {
      const raw = await fs.readFile(src);
      const hash = crypto.createHash("md5").update(raw).digest("hex").slice(0, 8);
      const dest = path.join(ROOT, cat, `u_${hash}.png`);
      if (!fsSync.existsSync(dest)) {
        let out;
        if (cat === "characters") {                                   // roll-one PFPs → cover-resize + slimewire.org wordmark
          out = await brandWordmark(await sharp(raw).resize(1024, 1024, { fit: "cover", position: "attention" }).png().toBuffer());
        } else if (OPAQUE.has(cat)) {                                 // bg → cover-resize, no wordmark (sits behind the face)
          out = await sharp(raw).resize(1024, 1024, { fit: "cover", position: "attention" }).png().toBuffer();
        } else {                                                      // hat/prop/badge stickers → key + trim, stay clean
          out = await sharp(await whiteKey(raw)).trim({ threshold: 10 }).png().toBuffer();
        }
        await fs.writeFile(dest, out);
        counts[cat]++;
      }
      // NOTE: intentionally do NOT move the original — the mass-gen orchestrator resumes by checking whether
      // _incoming/<cat>/<name>.png still exists, so moving it would make it regenerate. Intake is idempotent
      // (dest is content-hashed u_<md5>), so leaving originals here is harmless — re-runs just skip them.
    } catch (e) { fail++; console.error("fail", cat, f, e.message); }
  }
}

console.log("imported:", JSON.stringify(counts), fail ? `· failed ${fail}` : "");
for (const c of CATS) {
  const n = fsSync.readdirSync(path.join(ROOT, c)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).length;
  console.log(`  ${c}: ${n} total`);
}
console.log("\nNext: npm run build:web  →  commit  →  deploy");
