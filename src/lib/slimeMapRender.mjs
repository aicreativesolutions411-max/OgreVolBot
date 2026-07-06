// 🗺️ SlimeWire KOL/wallet MAP renderer — radial "bag map" like the reference, SlimeWire-branded.
// Pure SVG → PNG (sharp), no external calls. The bot passes real nodes/stats; this file owns the LOOK.
// Node = a holder/recipient wallet: sized by holding, colored by state (holding=green, sold=red, whale=gold),
// framed avatar (X pfp when known, slime-blob when not), a few big ones labeled. Stat header up top,
// SlimeWire wordmark baked in. Backgrounds rotate from the map-kit asset set (passed as a data URI/href).
import sharp from "sharp";
import fs from "node:fs";

const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmtNum = (n) => {
  n = Number(n) || 0;
  if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e10 ? 0 : 1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + "K";
  return String(Math.round(n));
};
const fmtUsd = (n) => "$" + fmtNum(n);

// Deterministic per-index pseudo-random (no Math.random → same map renders identically for the same subject).
function rng(seed) {
  let s = (seed * 2654435761) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

const STATE_COLOR = {
  hold:  { fill: "#5be36a", ring: "#0c7a2a" }, // diamond hands — green
  sold:  { fill: "#e2564b", ring: "#7a1010" }, // dumped — red
  whale: { fill: "#ffcf4d", ring: "#8a6410" }, // biggest bags — gold
  new:   { fill: "#4dd6ff", ring: "#0c5a7a" }, // fresh in — cyan
};

// Lay out nodes on staggered spokes (firework look): each gets its own angle, radius varies by size tier.
function layout(nodes, cx, cy, rMin, rMax) {
  const n = nodes.length;
  const r = rng(n + 7);
  return nodes.map((node, i) => {
    const ang = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.10;      // even spread + tiny jitter
    const tier = Math.max(0, Math.min(1, node.weight || 0));      // 0..1
    const rad = rMin + (rMax - rMin) * (0.18 + 0.82 * (1 - tier)) + (r() - 0.5) * 96; // whales sit closer, wide firework spread
    return { ...node, x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad, size: 7 + tier * 22 };
  });
}

export function buildMapSvg({ subject = "$SLIME", subtitle = "top holders", stats = [], nodes = [], bgHref = null, transparent = false, W = 900, H = 820 } = {}) {
  const cx = W / 2, cy = 118 + (H - 118) / 2;
  const placed = layout(nodes, cx, cy, 130, Math.min(W, H - 118) / 2 - 40);

  // Header stat pills
  const pillW = (W - 60 - 4 * 14) / 5;
  const header = stats.slice(0, 5).map((s, i) => {
    const x = 30 + i * (pillW + 14);
    return `<g>
      <rect x="${x.toFixed(1)}" y="24" width="${pillW.toFixed(1)}" height="70" rx="16" fill="#0a1f12" stroke="#2f6b3a" stroke-width="1.5"/>
      <text x="${(x + pillW / 2).toFixed(1)}" y="48" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="0.5" fill="#7bd98a">${esc(s.label)}</text>
      <text x="${(x + pillW / 2).toFixed(1)}" y="78" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="24" font-weight="900" fill="#eafff0">${esc(s.value)}</text>
    </g>`;
  }).join("");

  // Spokes (draw first, behind nodes)
  const spokes = placed.map((p) =>
    `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="#3a7d49" stroke-width="${(0.6 + p.size / 28).toFixed(2)}" stroke-opacity="0.5"/>`
  ).join("");

  // Nodes — glossy gradient "spheres" with a soft glow + specular highlight (premium, not flat circles).
  const GRAD = { hold: "gHold", sold: "gSold", whale: "gWhale", new: "gNew" };
  const nodeEls = placed.map((p) => {
    const c = STATE_COLOR[p.state] || STATE_COLOR.hold;
    const g = GRAD[p.state] || "gHold";
    const glow = `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(p.size + 6).toFixed(1)}" fill="${c.fill}" fill-opacity="0.16"/>`;
    const body = p.avatar
      ? `<clipPath id="cp${p.i}"><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(p.size - 2).toFixed(1)}"/></clipPath>
         <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(p.size - 2).toFixed(1)}" fill="${c.fill}"/>
         <image href="${esc(p.avatar)}" x="${(p.x - p.size).toFixed(1)}" y="${(p.y - p.size).toFixed(1)}" width="${(p.size * 2).toFixed(1)}" height="${(p.size * 2).toFixed(1)}" clip-path="url(#cp${p.i})" preserveAspectRatio="xMidYMid slice"/>`
      : `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(p.size - 1).toFixed(1)}" fill="url(#${g})"/>` +
        `<ellipse cx="${(p.x - p.size * 0.28).toFixed(1)}" cy="${(p.y - p.size * 0.34).toFixed(1)}" rx="${(p.size * 0.36).toFixed(1)}" ry="${(p.size * 0.22).toFixed(1)}" fill="#ffffff" fill-opacity="0.4"/>`;
    const rim = `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.size.toFixed(1)}" fill="none" stroke="${c.ring}" stroke-width="2.5"/><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(p.size + 1.6).toFixed(1)}" fill="none" stroke="${c.fill}" stroke-width="1" stroke-opacity="0.6"/>`;
    return `<g>${glow}${body}${rim}</g>`;
  }).join("");

  // Labels for the biggest / named nodes
  const labels = placed.filter((p) => p.label).map((p) => {
    const lw = 26 + esc(p.label).length * 8.4;
    const left = p.x > cx;
    const lx = left ? p.x + p.size + 8 : p.x - p.size - 8 - lw;
    const ly = p.y - 15;
    const c = STATE_COLOR[p.state] || STATE_COLOR.whale;
    return `<g>
      <line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${(left ? lx : lx + lw).toFixed(1)}" y2="${(ly + 15).toFixed(1)}" stroke="${c.fill}" stroke-width="1.5" stroke-dasharray="3 3"/>
      <rect x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" width="${lw.toFixed(1)}" height="30" rx="15" fill="#081a0e" stroke="${c.fill}" stroke-width="1.5"/>
      <text x="${(lx + lw / 2).toFixed(1)}" y="${(ly + 20).toFixed(1)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#eafff0">${esc(p.label)}</text>
    </g>`;
  }).join("");

  // Center hub — glowing gradient orb, the coin front-and-center
  const hubR = subject.length > 8 ? 62 : 58;
  const fs = subject.length > 8 ? 22 : 26;
  const hub = `<g>
    <circle cx="${cx}" cy="${cy}" r="${hubR + 14}" fill="#5be36a" fill-opacity="0.12"/>
    <circle cx="${cx}" cy="${cy}" r="${hubR}" fill="url(#gHub)" stroke="#5be36a" stroke-width="3"/>
    <circle cx="${cx}" cy="${cy}" r="${hubR + 6}" fill="none" stroke="#7dff5b" stroke-width="1.4" stroke-opacity="0.55"/>
    <ellipse cx="${(cx - 16).toFixed(1)}" cy="${(cy - hubR * 0.45).toFixed(1)}" rx="28" ry="12" fill="#ffffff" fill-opacity="0.10"/>
    <text x="${cx}" y="${(cy + 6).toFixed(1)}" text-anchor="middle" font-family="Arial Black, Arial" font-size="${fs}" font-weight="900" fill="#eafff0">${esc(subject)}</text>
    <text x="${cx}" y="${(cy + 28).toFixed(1)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#7bd98a">${esc(subtitle)}</text>
  </g>`;

  const bg = transparent
    ? ""  // renderSlimeMapPng composites the branded background underneath via sharp
    : bgHref
      ? `<image href="${esc(bgHref)}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/><rect width="${W}" height="${H}" fill="#04120a" fill-opacity="0.35"/>`
      : `<rect width="${W}" height="${H}" fill="#04120a"/><radialGradient id="glow" cx="50%" cy="55%" r="55%"><stop offset="0%" stop-color="#0d3a1e"/><stop offset="100%" stop-color="#04120a"/></radialGradient><rect width="${W}" height="${H}" fill="url(#glow)"/>`;

  // Legend + wordmark
  const legend = `<g font-family="Arial, sans-serif" font-size="12" font-weight="700">
    <circle cx="34" cy="${H - 30}" r="6" fill="#5be36a"/><text x="46" y="${H - 26}" fill="#9fe0ab">holding</text>
    <circle cx="132" cy="${H - 30}" r="6" fill="#e2564b"/><text x="144" y="${H - 26}" fill="#9fe0ab">sold</text>
    <circle cx="214" cy="${H - 30}" r="6" fill="#ffcf4d"/><text x="226" y="${H - 26}" fill="#9fe0ab">whale</text>
  </g>
  <g>
    <rect x="${W - 236}" y="${H - 44}" width="206" height="30" rx="15" fill="#04120a" fill-opacity="0.7" stroke="#5be36a" stroke-opacity="0.6"/>
    <circle cx="${W - 218}" cy="${H - 29}" r="6" fill="#7dff5b"/>
    <text x="${W - 204}" y="${H - 24}" font-family="Arial Black, Arial" font-size="17" font-weight="900" fill="#bfffa8">slimewire.org</text>
  </g>`;

  const defs = `<defs>
    <radialGradient id="gHold" cx="38%" cy="30%" r="78%"><stop offset="0%" stop-color="#d6ffc4"/><stop offset="42%" stop-color="#5be36a"/><stop offset="100%" stop-color="#0a6b28"/></radialGradient>
    <radialGradient id="gWhale" cx="38%" cy="30%" r="78%"><stop offset="0%" stop-color="#fff2c2"/><stop offset="42%" stop-color="#ffcf4d"/><stop offset="100%" stop-color="#8a6410"/></radialGradient>
    <radialGradient id="gSold" cx="38%" cy="30%" r="78%"><stop offset="0%" stop-color="#ffcabf"/><stop offset="42%" stop-color="#e2564b"/><stop offset="100%" stop-color="#7a1010"/></radialGradient>
    <radialGradient id="gNew" cx="38%" cy="30%" r="78%"><stop offset="0%" stop-color="#c8f4ff"/><stop offset="42%" stop-color="#4dd6ff"/><stop offset="100%" stop-color="#0c5a7a"/></radialGradient>
    <radialGradient id="gHub" cx="50%" cy="36%" r="72%"><stop offset="0%" stop-color="#12401f"/><stop offset="100%" stop-color="#05160c"/></radialGradient>
  </defs>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${defs}
    ${bg}
    ${spokes}
    ${header}
    ${hub}
    ${nodeEls}
    ${labels}
    ${legend}
  </svg>`;
}

// Fetch a remote avatar (X pfp etc.) → square PNG data-URI so it embeds in the SVG (resvg/librsvg won't
// fetch remote hrefs at raster time). Small + cached by the caller. Returns null on any failure.
export async function fetchAvatarDataUri(url, size = 96) {
  if (!url) return null;
  // AbortController + setTimeout works on EVERY Node version (AbortSignal.timeout is missing on Render's older
  // Node → without a real timeout a hanging avatar fetch would never resolve and would stall the whole render,
  // which stalls the X poll tick — the "poller went silent" bug).
  const ctl = new AbortController();
  const t = setTimeout(() => { try { ctl.abort(); } catch {} }, 4500);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 80) return null;
    const png = await sharp(buf).resize(size, size, { fit: "cover", position: "attention" }).png().toBuffer();
    return "data:image/png;base64," + png.toString("base64");
  } catch { return null; }
  finally { clearTimeout(t); }
}

// Full premium render: resolve avatars → build transparent map SVG → composite over a branded background
// (map-kit PNG) with a dark wash so nodes pop. Returns a PNG buffer ready to post/serve. bgPath optional.
// Read a LOCAL face PNG (anon slime face) → small data-URI. Cached by the caller (only ~20 unique faces).
async function localFaceDataUri(file, size = 88) {
  try {
    const png = await sharp(file).resize(size, size, { fit: "cover" }).png().toBuffer();
    return "data:image/png;base64," + png.toString("base64");
  } catch { return null; }
}

export async function renderSlimeMapPng({ subject, subtitle, stats = [], nodes = [], bgPath = null, W = 900, H = 820 } = {}) {
  // Resolve avatars → embedded data-URIs, in parallel. KOL X pfps come from a remote URL (fetch); anonymous
  // wallets get a LOCAL slime face (read off disk). Deduped so the same face/url is only processed once.
  const cache = new Map(), faceCache = new Map();
  await Promise.all(nodes.map(async (n) => {
    if (n.avatar) return;                       // already a data-URI
    if (n.avatarUrl) {
      if (!cache.has(n.avatarUrl)) cache.set(n.avatarUrl, fetchAvatarDataUri(n.avatarUrl));
      n.avatar = await cache.get(n.avatarUrl);
    }
    if (!n.avatar && n.faceFile) {              // fall back to the wallet's deterministic slime face
      if (!faceCache.has(n.faceFile)) faceCache.set(n.faceFile, localFaceDataUri(n.faceFile));
      n.avatar = await faceCache.get(n.faceFile);
    }
  }));

  const svg = buildMapSvg({ subject, subtitle, stats, nodes, transparent: true, W, H });
  const mapPng = await sharp(Buffer.from(svg)).png().toBuffer();

  // Base = branded background (cover) or a dark-green fallback gradient.
  let base;
  if (bgPath && fs.existsSync(bgPath)) {
    base = await sharp(bgPath).resize(W, H, { fit: "cover", position: "centre" }).toBuffer();
  } else {
    base = await sharp(Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="g" cx="50%" cy="55%" r="60%"><stop offset="0%" stop-color="#0e3d20"/><stop offset="100%" stop-color="#03100a"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`
    )).png().toBuffer();
  }
  // Dark wash + subtle border so any background stays legible behind the map.
  const wash = await sharp(Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#03100a" fill-opacity="0.5"/><rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="22" fill="none" stroke="#5be36a" stroke-opacity="0.35" stroke-width="3"/></svg>`
  )).png().toBuffer();

  return sharp(base).composite([{ input: wash }, { input: mapPng }]).png().toBuffer();
}

// ---- sample render (run directly) ----
function sampleNodes() {
  const named = [
    { label: "WHALE.sol · 210M", state: "whale", weight: 1.0, avatarUrl: "https://unavatar.io/twitter/solana" },
    { label: "@degenape · 88M", state: "hold", weight: 0.82, avatarUrl: "https://unavatar.io/twitter/pumpdotfun" },
    { label: "COMET · 41M", state: "hold", weight: 0.66 },
    { label: "@paperhands · 30M", state: "sold", weight: 0.55 },
    { label: "SNIPER.sol · 22M", state: "new", weight: 0.48 },
  ];
  const rest = [];
  const r = rng(99);
  for (let i = 0; i < 62; i++) {
    const roll = r();
    const state = roll < 0.6 ? "hold" : roll < 0.85 ? "sold" : roll < 0.95 ? "whale" : "new";
    rest.push({ state, weight: r() * 0.42 });
  }
  // Interleave the named nodes at spread-out angles so their labels don't stack on one side.
  const total = named.length + rest.length;
  const step = Math.floor(total / named.length);
  const out = new Array(total);
  let ri = 0;
  for (let i = 0; i < total; i++) {
    const ni = i % step === 0 ? i / step : -1;
    out[i] = (ni >= 0 && ni < named.length) ? named[ni] : rest[ri++];
  }
  return out.map((n, i) => ({ ...n, i }));
}

if (process.argv[1]?.endsWith("slimeMapRender.mjs")) {
  const out = process.argv[2] || "map_sample.png";
  const bgPath = process.argv[3] || null;   // pass a map-kit background to test the composite
  const png = await renderSlimeMapPng({
    subject: "$SLIME",
    subtitle: "top 67 holders · live",
    stats: [
      { label: "HOLDERS", value: "1,204" },
      { label: "KOLS IN", value: "38" },
      { label: "SUPPLY HELD", value: "72%" },
      { label: "STREET VALUE", value: "$410K" },
      { label: "DIAMOND HANDS", value: "56" },
    ],
    nodes: sampleNodes(),
    bgPath,
  });
  fs.writeFileSync(out, png);
  console.log("wrote", out, png.length, "bytes", bgPath ? `(bg: ${bgPath})` : "(fallback gradient)");
}
