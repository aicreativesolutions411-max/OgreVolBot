// Branded "Scanned by SlimeWire" card for X replies — a premium 1200x675 infographic so a reply reads as
// value (dodges link-spam filters + looks pro). Pure sharp + SVG.
//
// ANTI-DUPLICATE: X (and spam classifiers generally) run near-duplicate detection on IMAGES, not just text.
// A reply bot that posts a pixel-identical card every time gets its replies folded as automation. So every
// render is deliberately DIFFERENT — seeded by the tweet so it's stable per-reply but varies across replies:
//   • one of many rotating Higgs backgrounds, hue/brightness/saturation-jittered
//   • a unique per-card film-grain layer (feTurbulence seed) → no two cards perceptual-hash alike
//   • two mirrored layouts (logo left vs right), jittered element positions
//   • rotating header wording, footer wording, and accent color
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const W = 1200, H = 675;

function esc(s) {
  return String(s == null ? "" : s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));
}
function hash(s) { let h = 2166136261; const str = String(s || ""); for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
// A small deterministic PRNG seeded off the tweet — every visual choice below draws from it, so the same
// reply always renders the same card but two different replies almost never match.
function makeRng(seed) { let h = hash(String(seed)) || 1; return () => { h = (Math.imul(h, 1103515245) + 12345) >>> 0; return h / 4294967296; }; }
function verdictColor(tone) { return tone === "danger" ? "#ff5b5b" : tone === "warn" ? "#ffc234" : "#54e000"; }

const HEADERS = ["🐸 SLIMEWIRE SCAN", "SLIMEWIRE · SCAN", "🐸 SLIMEWIRE", "SLIME SCAN", "SCANNED BY SLIMEWIRE", "🐸 SLIMEWIRE SCANNER"];
const FOOTERS = ["Scan any coin free · slimewire.org", "Free scans · slimewire.org", "slimewire.org", "🐸 slimewire.org", "Free CA scans · slimewire.org", "slimewire.org · scan anything"];
const ACCENTS = ["#8aff6b", "#7dff8f", "#a6ff5b", "#63f0c0", "#9bff77", "#54e000"];

// Neon info chip.
function chip(x, y, w, label, value, accent) {
  const val = String(value == null || value === "" ? "—" : value);
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="104" rx="18" fill="#06120b" fill-opacity="0.82" stroke="${accent}" stroke-opacity="0.55" stroke-width="2"/>
    <text x="${x + 22}" y="${y + 38}" font-family="Arial" font-size="21" fill="#8fbf93" letter-spacing="2">${esc(label)}</text>
    <text x="${x + 22}" y="${y + 82}" font-family="Arial Black, Arial" font-weight="900" font-size="38" fill="#ffffff">${esc(val)}</text>
  </g>`;
}

async function pickBg(bgDir, r) {
  try {
    const files = (await fs.readdir(bgDir)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
    if (!files.length) return null;
    const idx = Math.floor(r() * files.length) % files.length;
    // Jitter hue/brightness/saturation so even the SAME background reads as a distinct image each time.
    const hue = Math.round((r() - 0.5) * 30);            // ±15° — stays in the green family
    const brightness = 0.9 + r() * 0.2;                  // 0.90–1.10
    const saturation = 0.85 + r() * 0.35;                // 0.85–1.20
    return await sharp(path.join(bgDir, files[idx]))
      .resize(W, H, { fit: "cover", position: "center" })
      .modulate({ hue, brightness, saturation })
      .toBuffer();
  } catch { return null; }
}

export async function renderXScanCard({ symbol, name, mcLabel, liqLabel, ageLabel, railLabel, verdict, verdictTone = "ok", changeLabel, changeTone, logoBuffer, bgDir, seed }) {
  const r = makeRng(seed != null ? seed : symbol || "slime");
  const vColor = verdictColor(verdictTone);
  const chColor = changeTone === "up" ? "#54e000" : changeTone === "down" ? "#ff5b5b" : "#8aff6b";
  const accent = ACCENTS[Math.floor(r() * ACCENTS.length) % ACCENTS.length];
  const header = HEADERS[Math.floor(r() * HEADERS.length) % HEADERS.length];
  const footer = FOOTERS[Math.floor(r() * FOOTERS.length) % FOOTERS.length];
  const sym = (symbol || "?").slice(0, 12);
  const grainSeed = Math.floor(r() * 100000);            // unique film grain per card → beats image dedup
  const jx = Math.round((r() - 0.5) * 18), jy = Math.round((r() - 0.5) * 14); // whole-panel position jitter
  const mirror = r() < 0.45;                             // ~45% flip logo↔text (two distinct layouts)

  const logoCx = mirror ? 236 : 964, logoCy = 300, ringR = 176;
  const tx = mirror ? 470 : 60;                          // text/chips column origin

  // 1) Base: a rotating (jittered) background, else a rich gradient.
  const bg = bgDir ? await pickBg(bgDir, r) : null;
  const base = bg ? sharp(bg) : sharp({ create: { width: W, height: H, channels: 3, background: { r: 6, g: 16, b: 9 } } });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="scrim" x1="${mirror ? 1 : 0}" y1="0" x2="${mirror ? 0 : 1}" y2="0"><stop offset="0" stop-color="#020704" stop-opacity="0.92"/><stop offset="0.55" stop-color="#020704" stop-opacity="0.72"/><stop offset="1" stop-color="#020704" stop-opacity="0"/></linearGradient>
      <linearGradient id="botscrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020704" stop-opacity="0"/><stop offset="1" stop-color="#020704" stop-opacity="0.85"/></linearGradient>
      <linearGradient id="slime" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8ff8a"/><stop offset="1" stop-color="${accent}"/></linearGradient>
      <filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="26"/></filter>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${grainSeed}" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#scrim)"/>
    <rect width="${W}" height="${H}" fill="url(#botscrim)"/>
    <rect x="0" y="${mirror ? H - 8 : 0}" width="${W}" height="8" fill="url(#slime)"/>

    <g transform="translate(${jx} ${jy})">
      <text x="${tx}" y="86" font-family="Arial Black, Arial" font-weight="900" font-size="32" letter-spacing="2" fill="url(#slime)" filter="url(#glow)">${esc(header)}</text>
      <text x="${tx}" y="205" font-family="Arial Black, Arial" font-weight="900" font-size="96" fill="#ffffff" filter="url(#glow)">$${esc(sym)}</text>
      <text x="${tx + 2}" y="252" font-family="Arial" font-size="30" fill="#b6e6bd">${esc((name || "").slice(0, 40))}</text>

      ${chip(tx, 292, 250, "MARKET CAP", mcLabel, accent)}
      ${chip(tx + 270, 292, 250, "LIQUIDITY", liqLabel, accent)}
      ${chip(tx, 410, 250, "AGE", ageLabel, accent)}
      ${chip(tx + 270, 410, 250, changeLabel ? "1H" : "RAIL", changeLabel ? changeLabel : railLabel, changeLabel ? chColor : accent)}

      <rect x="${tx}" y="536" width="560" height="86" rx="20" fill="#04110a" fill-opacity="0.9" stroke="${vColor}" stroke-width="3" filter="url(#glow)"/>
      <circle cx="${tx + 44}" cy="579" r="14" fill="${vColor}"/>
      <text x="${tx + 76}" y="590" font-family="Arial Black, Arial" font-weight="900" font-size="34" fill="${vColor}">${esc((verdict || "Scanned").slice(0, 28))}</text>
    </g>

    <text x="${mirror ? 60 : 600}" y="648" font-family="Arial Black, Arial" font-weight="900" font-size="26" fill="#cdeacf">${esc(footer)}</text>

    <circle cx="${logoCx}" cy="${logoCy}" r="${ringR + 18}" fill="${accent}" opacity="0.28" filter="url(#soft)"/>
    <circle cx="${logoCx}" cy="${logoCy}" r="${ringR}" fill="none" stroke="url(#slime)" stroke-width="16" filter="url(#glow)"/>

    <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.06"/>
  </svg>`;

  const layers = [{ input: Buffer.from(svg), top: 0, left: 0 }];
  if (logoBuffer) {
    try {
      const size = ringR * 2 - 20;
      const round = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`);
      const logo = await sharp(logoBuffer).resize(size, size, { fit: "cover" }).composite([{ input: round, blend: "dest-in" }]).png().toBuffer();
      layers.push({ input: logo, left: Math.round(logoCx - size / 2), top: Math.round(logoCy - size / 2) });
    } catch { /* ring alone still looks intentional */ }
  }
  return base.composite(layers).png().toBuffer();
}
