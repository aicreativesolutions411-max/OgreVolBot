// Branded "Scanned by SlimeWire" card for X replies — a premium 1200x675 infographic so a reply reads as
// value (dodges link-spam filters + looks pro). Pure sharp + SVG. Rotating Higgs backgrounds (from a dir),
// a legibility scrim, big glowing coin logo, bold neon chips + verdict pill.
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const W = 1200, H = 675;

function esc(s) {
  return String(s == null ? "" : s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));
}
function hash(s) { let h = 2166136261; const str = String(s || ""); for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function verdictColor(tone) { return tone === "danger" ? "#ff5b5b" : tone === "warn" ? "#ffc234" : "#54e000"; }

// Neon info chip.
function chip(x, y, w, label, value, accent = "#8aff6b") {
  const val = String(value == null || value === "" ? "—" : value);
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="104" rx="18" fill="#06120b" fill-opacity="0.82" stroke="${accent}" stroke-opacity="0.55" stroke-width="2"/>
    <text x="${x + 22}" y="${y + 38}" font-family="Arial" font-size="21" fill="#8fbf93" letter-spacing="2">${esc(label)}</text>
    <text x="${x + 22}" y="${y + 82}" font-family="Arial Black, Arial" font-weight="900" font-size="38" fill="#ffffff">${esc(val)}</text>
  </g>`;
}

async function pickBg(bgDir, seed) {
  try {
    const files = (await fs.readdir(bgDir)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
    if (!files.length) return null;
    const idx = Number.isFinite(seed) ? hash(seed) % files.length : (seed != null ? hash(seed) % files.length : Math.floor(Math.random() * files.length));
    return await sharp(path.join(bgDir, files[idx])).resize(W, H, { fit: "cover", position: "center" }).toBuffer();
  } catch { return null; }
}

export async function renderXScanCard({ symbol, name, mcLabel, liqLabel, ageLabel, railLabel, verdict, verdictTone = "ok", changeLabel, changeTone, logoBuffer, bgDir, seed }) {
  const vColor = verdictColor(verdictTone);
  const chColor = changeTone === "up" ? "#54e000" : changeTone === "down" ? "#ff5b5b" : "#8aff6b";
  const sym = (symbol || "?").slice(0, 12);

  // 1) Base: a rotating Higgs background (seeded per-coin so the same coin is consistent), else a rich gradient.
  const bg = bgDir ? await pickBg(bgDir, seed != null ? seed : sym) : null;
  const base = bg
    ? sharp(bg)
    : sharp({ create: { width: W, height: H, channels: 3, background: { r: 6, g: 16, b: 9 } } });

  // 2) Overlay SVG: legibility scrims + all text/chips/verdict + the glossy slime ring (logo composited after).
  const cx = 968, cy = 300, ringR = 176; // coin logo center
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#02070400" stop-opacity="0.92"/><stop offset="0.55" stop-color="#020704" stop-opacity="0.72"/><stop offset="1" stop-color="#020704" stop-opacity="0"/></linearGradient>
      <linearGradient id="botscrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020704" stop-opacity="0"/><stop offset="1" stop-color="#020704" stop-opacity="0.85"/></linearGradient>
      <linearGradient id="slime" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8ff8a"/><stop offset="1" stop-color="#54e000"/></linearGradient>
      <filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="26"/></filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#scrim)"/>
    <rect width="${W}" height="${H}" fill="url(#botscrim)"/>
    <rect x="0" y="0" width="${W}" height="8" fill="url(#slime)"/>

    <text x="60" y="86" font-family="Arial Black, Arial" font-weight="900" font-size="32" letter-spacing="2" fill="url(#slime)" filter="url(#glow)">🐸 SLIMEWIRE SCAN</text>
    <text x="60" y="205" font-family="Arial Black, Arial" font-weight="900" font-size="96" fill="#ffffff" filter="url(#glow)">$${esc(sym)}</text>
    <text x="62" y="252" font-family="Arial" font-size="30" fill="#b6e6bd">${esc((name || "").slice(0, 40))}</text>

    ${chip(60, 292, 250, "MARKET CAP", mcLabel, "#8aff6b")}
    ${chip(330, 292, 250, "LIQUIDITY", liqLabel, "#8aff6b")}
    ${chip(60, 410, 250, "AGE", ageLabel, "#8aff6b")}
    ${chip(330, 410, 250, changeLabel ? "1H" : "RAIL", changeLabel ? changeLabel : railLabel, changeLabel ? chColor : "#8aff6b")}

    <rect x="60" y="536" width="560" height="86" rx="20" fill="#04110a" fill-opacity="0.9" stroke="${vColor}" stroke-width="3" filter="url(#glow)"/>
    <circle cx="104" cy="579" r="14" fill="${vColor}"/>
    <text x="136" y="590" font-family="Arial Black, Arial" font-weight="900" font-size="34" fill="${vColor}">${esc((verdict || "Scanned").slice(0, 28))}</text>

    <text x="640" y="648" font-family="Arial Black, Arial" font-weight="900" font-size="26" fill="#cdeacf">Scan any coin free 👉 slimewire.org</text>

    <circle cx="${cx}" cy="${cy}" r="${ringR + 18}" fill="#54e000" opacity="0.28" filter="url(#soft)"/>
    <circle cx="${cx}" cy="${cy}" r="${ringR}" fill="none" stroke="url(#slime)" stroke-width="16" filter="url(#glow)"/>
  </svg>`;

  const layers = [{ input: Buffer.from(svg), top: 0, left: 0 }];
  if (logoBuffer) {
    try {
      const size = ringR * 2 - 20;
      const round = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`);
      const logo = await sharp(logoBuffer).resize(size, size, { fit: "cover" }).composite([{ input: round, blend: "dest-in" }]).png().toBuffer();
      layers.push({ input: logo, left: Math.round(cx - size / 2), top: Math.round(cy - size / 2) });
    } catch { /* ring alone still looks intentional */ }
  }
  return base.composite(layers).png().toBuffer();
}
