// Branded "Scanned by SlimeWire" card for X replies — a clean 1200x675 infographic so a reply reads as
// value (dodges link-spam filters + looks pro). Pure sharp + SVG; takes plain data so it has no app deps.
import sharp from "sharp";

const W = 1200, H = 675;

function esc(s) {
  return String(s == null ? "" : s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));
}
function chip(x, y, label, value) {
  return `<g>
    <rect x="${x}" y="${y}" width="250" height="92" rx="16" fill="#0c1a10" stroke="#1c3a20" stroke-width="2"/>
    <text x="${x + 20}" y="${y + 34}" font-family="Arial" font-size="20" fill="#7fae86" letter-spacing="1">${esc(label)}</text>
    <text x="${x + 20}" y="${y + 74}" font-family="Arial Black, Arial" font-weight="900" font-size="34" fill="#e7ffe0">${esc(value)}</text>
  </g>`;
}

// verdict tone → pill color
function verdictColor(tone) {
  return tone === "danger" ? "#ff5b5b" : tone === "warn" ? "#ffc234" : "#54e000";
}

export async function renderXScanCard({ symbol, name, mcLabel, liqLabel, ageLabel, railLabel, verdict, verdictTone = "ok", logoBuffer }) {
  const vColor = verdictColor(verdictTone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <radialGradient id="bg" cx="28%" cy="26%" r="95%">
        <stop offset="0" stop-color="#123a1d"/><stop offset="0.6" stop-color="#0a1c0f"/><stop offset="1" stop-color="#040905"/>
      </radialGradient>
      <linearGradient id="slime" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c6ff6b"/><stop offset="1" stop-color="#54e000"/></linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <text x="60" y="96" font-family="Arial Black, Arial" font-weight="900" font-size="30" letter-spacing="1" fill="url(#slime)">🐸 SLIMEWIRE SCAN</text>
    <text x="60" y="196" font-family="Arial Black, Arial" font-weight="900" font-size="78" fill="#e7ffe0">$${esc((symbol || "?").slice(0, 12))}</text>
    <text x="60" y="242" font-family="Arial" font-size="30" fill="#9fd0a6">${esc((name || "").slice(0, 40))}</text>
    ${chip(60, 300, "MARKET CAP", mcLabel || "—")}
    ${chip(330, 300, "LIQUIDITY", liqLabel || "—")}
    ${chip(60, 410, "AGE", ageLabel || "—")}
    ${chip(330, 410, "RAIL", railLabel || "—")}
    <rect x="60" y="536" width="520" height="74" rx="18" fill="#04110a" stroke="${vColor}" stroke-width="3"/>
    <circle cx="98" cy="573" r="12" fill="${vColor}"/>
    <text x="126" y="583" font-family="Arial Black, Arial" font-weight="900" font-size="30" fill="${vColor}">${esc((verdict || "Scan complete").slice(0, 30))}</text>
    <text x="640" y="640" font-family="Arial" font-size="24" fill="#7fae86">Scan any coin free 👉 slimewire.org</text>
    <circle cx="930" cy="300" r="196" fill="none" stroke="url(#slime)" stroke-width="14"/>
  </svg>`;

  const layers = [];
  if (logoBuffer) {
    try {
      const size = 356;
      const round = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`);
      const logo = await sharp(logoBuffer).resize(size, size, { fit: "cover" })
        .composite([{ input: round, blend: "dest-in" }]).png().toBuffer();
      layers.push({ input: logo, left: 930 - size / 2, top: 300 - size / 2 });
    } catch { /* no logo → the slime ring alone still looks intentional */ }
  }
  return sharp(Buffer.from(svg)).composite(layers).png().toBuffer();
}
