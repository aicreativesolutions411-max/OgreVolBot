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
  funded:{ fill: "#8dff6a", ring: "#1d8f32" }, // wallet sent funds out — green
  funder:{ fill: "#4dd6ff", ring: "#15718f" }, // wallet sent funds in — cyan
  both:  { fill: "#ffcf4d", ring: "#9a7115" }, // two-way flow — gold
};

// Lay out nodes with the GOLDEN ANGLE (sunflower) so consecutive-by-size nodes land ~137° apart — the biggest
// holders (which arrive first, sorted by %) get spread evenly around the hub instead of stacking in one spot
// where their labels collided. Whales sit on a comfortable inner ring (not on the hub), dust drifts outward.
function layout(nodes, cx, cy, rMin, rMax) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const r = rng(nodes.length + 7);
  return nodes.map((node, i) => {
    const ang = i * golden;                                       // even angular spread, no clustering
    const tier = Math.max(0, Math.min(1, node.weight || 0));      // 0..1 (1 = biggest)
    const rad = rMin + (rMax - rMin) * (0.30 + 0.66 * (1 - tier)) + (r() - 0.5) * 40; // whales inner ring, dust outer
    return { ...node, x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad, size: 7 + tier * 22 };
  });
}

// CLUSTER-AWARE layout — cluster members pack into tight satellite blobs around the hub (like the reference
// "flower" groups), non-clustered holders scatter on the outer band via golden angle. Each cluster gets its
// group center stamped on the cluster object (_cx/_cy/_blobR) so hulls + total cards + arrows can be drawn.
function layoutClustered(nodes, clusters, cx, cy, rMin, rMax) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const r = rng(nodes.length + 11);
  const nodeByI = new Map(nodes.map((n) => [n.i, n]));
  const memberSet = new Set();
  clusters.forEach((c) => (c.members || []).forEach((mi) => memberSet.add(mi)));
  const placed = {};
  const nc = clusters.length;
  clusters.forEach((c, k) => {
    const ang = (2 * Math.PI * k) / Math.max(1, nc) + 0.5;
    const gr = rMin + (rMax - rMin) * 0.52;                       // cluster groups sit on a mid ring
    const gcx = cx + Math.cos(ang) * gr, gcy = cy + Math.sin(ang) * gr;
    const mem = (c.members || []).map((mi) => nodeByI.get(mi)).filter(Boolean).sort((a, b) => (b.weight || 0) - (a.weight || 0));
    const spread = 20 + mem.length * 9;
    let maxD = 0;
    mem.forEach((n, j) => {
      const a2 = j * golden + k;
      const rr = j === 0 ? 0 : (spread * (0.45 + 0.55 * (j / Math.max(1, mem.length))) + (r() - 0.5) * 10);
      const size = 8 + Math.max(0, Math.min(1, n.weight || 0)) * 20;
      placed[n.i] = { ...n, x: gcx + Math.cos(a2) * rr, y: gcy + Math.sin(a2) * rr, size, _cid: c.id };
      maxD = Math.max(maxD, rr + size);
    });
    c._cx = gcx; c._cy = gcy; c._blobR = maxD + 14; c._hubI = mem[0] ? mem[0].i : null;
  });
  let si = 0;
  nodes.forEach((n) => {
    if (memberSet.has(n.i)) return;
    const ang = si * golden;
    const tier = Math.max(0, Math.min(1, n.weight || 0));
    const rad = rMin + (rMax - rMin) * (0.66 + 0.32 * (1 - tier)) + (r() - 0.5) * 26; // singles ride the outer band
    placed[n.i] = { ...n, x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad, size: 7 + tier * 22 };
    si++;
  });
  return nodes.map((n) => placed[n.i]).filter(Boolean);
}

// Explicit directional arrow (line + solid triangle head) — resvg/librsvg don't reliably honour <marker>
// context-stroke, so we draw the head ourselves. Backs the head off the target's rim so it sits ON the edge.
function arrowSvg(x1, y1, x2, y2, color, w, targetR, dash) {
  const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
  const ex = x2 - ux * (targetR + 3), ey = y2 - uy * (targetR + 3);      // arrow tip on the rim
  const bx = ex - ux * (7 + w), by = ey - uy * (7 + w);                  // base of the head
  const px = -uy, py = ux, hw = 3.4 + w;
  return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${color}" stroke-width="${w}" stroke-opacity="0.8"${dash ? ` stroke-dasharray="${dash}"` : ""}/>` +
    `<polygon points="${ex.toFixed(1)},${ey.toFixed(1)} ${(bx + px * hw).toFixed(1)},${(by + py * hw).toFixed(1)} ${(bx - px * hw).toFixed(1)},${(by - py * hw).toFixed(1)}" fill="${color}" fill-opacity="0.92"/>`;
}
const CLUSTER_COLORS = ["#ffcf4d", "#4dd6ff", "#ff7de3", "#8bff5b", "#ff9f4d", "#b98cff", "#4dffd0", "#ff6b6b"];
function shortAddr(a) { a = String(a || ""); return a.length > 10 ? a.slice(0, 4) + "..." + a.slice(-4) : a; }

export function buildMapSvg({ subject = "$SLIME", subtitle = "top holders", stats = [], nodes = [], bgHref = null, transparent = false, centerImage = null, clusters = [], clusterEdges = [], clusterLinks = [], sidePanel = false, kolsIn = 0, W = 900, H = 820 } = {}) {
  // Side panel (Bubblemaps-style, on the RIGHT): ranked clusters w/ bars + a holders/whales/KOLs stat grid +
  // a KOL roster. The map draws into the LEFT `mapW` region; the panel fills the rest.
  const PANEL = sidePanel ? 452 : 0;
  const mapW = W - PANEL;
  const cx = mapW / 2, cy = 118 + (H - 118) / 2;
  const rMax = Math.min(mapW, H - 118) / 2 - 40;
  // Colour + letter each cluster (biggest first — server already sorted), then lay members into tight blobs.
  const cls = (clusters || []).filter((c) => Array.isArray(c.members) && c.members.length >= 2)
    .map((c, k) => ({ ...c, color: CLUSTER_COLORS[k % CLUSTER_COLORS.length], letter: String.fromCharCode(65 + k) }));
  const useClusters = cls.length > 0;
  const fundMode = nodes.some((node) => node?.direction);
  const placed = useClusters ? layoutClustered(nodes, cls, cx, cy, 130, rMax) : layout(nodes, cx, cy, 130, rMax);
  const posByI = new Map(placed.map((p) => [p.i, p]));

  // Header stat pills (span the MAP region, not the panel)
  const pillW = (mapW - 60 - 4 * 14) / 5;
  const header = stats.slice(0, 5).map((s, i) => {
    const x = 30 + i * (pillW + 14);
    return `<g>
      <rect x="${x.toFixed(1)}" y="24" width="${pillW.toFixed(1)}" height="70" rx="16" fill="#0a1f12" stroke="#2f6b3a" stroke-width="1.5"/>
      <text x="${(x + pillW / 2).toFixed(1)}" y="48" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="0.5" fill="#7bd98a">${esc(s.label)}</text>
      <text x="${(x + pillW / 2).toFixed(1)}" y="78" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="24" font-weight="900" fill="#eafff0">${esc(s.value)}</text>
    </g>`;
  }).join("");

  // Spokes (draw first, behind nodes). Cluster members get their own funder→member arrows, so skip their
  // hub spokes when clustering to keep the fund-flow readable instead of a spider web.
  const clusteredSet = new Set();
  if (useClusters) cls.forEach((c) => (c.members || []).forEach((mi) => clusteredSet.add(mi)));
  const spokes = placed.map((p) => {
    if (useClusters && clusteredSet.has(p.i)) return "";
    if (fundMode) {
      const color = (STATE_COLOR[p.state] || STATE_COLOR.hold).fill;
      if (p.direction === "in") return arrowSvg(p.x, p.y, cx, cy, color, 1.8, 62);
      if (p.direction === "both") return arrowSvg(cx, cy, p.x, p.y, color, 1.8, p.size) + arrowSvg(p.x, p.y, cx, cy, color, 1.1, 62, "4 3");
      return arrowSvg(cx, cy, p.x, p.y, color, 1.8, p.size);
    }
    return `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="#3a7d49" stroke-width="${(0.6 + p.size / 28).toFixed(2)}" stroke-opacity="${useClusters ? "0.32" : "0.5"}"/>`;
  }).join("");

  // Nodes — glossy gradient "spheres" with a soft glow + specular highlight (premium, not flat circles).
  const GRAD = { hold: "gHold", sold: "gSold", whale: "gWhale", new: "gNew", funded: "gHold", funder: "gNew", both: "gWhale" };
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
    // % printed ON the big bubbles (heavy dark outline so it's legible over any sphere/avatar even if two touch)
    // — the side pills stacked and hid the number; this always shows each whale's % right on its bubble.
    const pctTxt = (p.pct != null && +p.pct > 0 && p.size >= 15)
      ? `<text x="${p.x.toFixed(1)}" y="${(p.y + p.size * 0.42 + 4).toFixed(1)}" text-anchor="middle" font-family="Arial Black, Arial" font-size="${Math.max(11, Math.min(19, 8 + p.size * 0.44)).toFixed(0)}" font-weight="900" fill="#ffffff" paint-order="stroke" stroke="#04120a" stroke-width="4">${(+p.pct).toFixed(+p.pct >= 10 ? 0 : 1)}%</text>`
      : "";
    return `<g>${glow}${body}${rim}${pctTxt}</g>`;
  }).join("");

  // 🕸️ CLUSTER LAYER — translucent blob per group, directional funder→member arrows, inter-cluster arrows,
  // and a floating total card (◆letter · funder / N wallets · % / $ · →N linked). Drawn UNDER the bubbles so
  // the slime spheres sit on top; the total cards render last so they stay readable.
  let clusterBlobs = "", clusterArrows = "", clusterCards = "";
  if (useClusters) {
    const byId = new Map(cls.map((c) => [c.id, c]));
    clusterBlobs = cls.map((c) =>
      `<circle cx="${c._cx.toFixed(1)}" cy="${c._cy.toFixed(1)}" r="${(c._blobR || 40).toFixed(1)}" fill="${c.color}" fill-opacity="0.10" stroke="${c.color}" stroke-opacity="0.4" stroke-width="1.6"/>`
    ).join("");
    // Render the actual relationship evidence when supplied. Direct holder→holder funding keeps its
    // direction and arrowhead; sibling wallets sharing an outside funder get a dashed undirected tie.
    // Older cached graph shapes fall back to the previous hub-star layout.
    const memberArrows = (clusterLinks || []).length
      ? (clusterLinks || []).map((edge) => {
        const c = byId.get(edge.clusterId) || cls.find((row) => row.members.includes(edge.a) && row.members.includes(edge.b));
        const s = posByI.get(edge.source != null ? edge.source : edge.a);
        const t = posByI.get(edge.target != null ? edge.target : edge.b);
        if (!c || !s || !t) return "";
        if (edge.kind === "direct") return arrowSvg(s.x, s.y, t.x, t.y, c.color, 2.2, t.size);
        return `<line x1="${s.x.toFixed(1)}" y1="${s.y.toFixed(1)}" x2="${t.x.toFixed(1)}" y2="${t.y.toFixed(1)}" stroke="${c.color}" stroke-width="1.8" stroke-opacity="0.82" stroke-dasharray="5 3"/>`;
      }).join("")
      : cls.map((c) => {
        const hub = posByI.get(c._hubI); if (!hub) return "";
        return (c.members || []).filter((mi) => mi !== c._hubI).map((mi) => {
          const t = posByI.get(mi); if (!t) return "";
          return arrowSvg(hub.x, hub.y, t.x, t.y, c.color, 1.6, t.size, "5 3");
        }).join("");
      }).join("");
    // inter-cluster: cluster A funded by a wallet inside cluster B → A points at B (thicker, solid)
    const xArrows = (clusterEdges || []).map((e) => {
      const a = byId.get(e.from), b = byId.get(e.to);
      if (!a || !b || a._cx == null || b._cx == null) return "";
      return arrowSvg(a._cx, a._cy, b._cx, b._cy, a.color, 3, b._blobR || 40);
    }).join("");
    clusterArrows = memberArrows + xArrows;
    clusterCards = cls.map((c) => {
      const outN = (clusterEdges || []).filter((e) => e.from === c.id).length;
      const direct = Number(c.directLinkCount) || 0, shared = Number(c.sharedLinkCount) || 0;
      const relationship = direct ? `${direct} direct link${direct === 1 ? "" : "s"}` : `${shared} shared-funder link${shared === 1 ? "" : "s"}`;
      const l1 = `${c.size || (c.members || []).length} wallets · COMBINED ${(+c.pct).toFixed(1)}%`;
      const l2 = `${fmtUsd(c.usd)} · ${relationship}${outN ? ` · →${outN} cluster${outN > 1 ? "s" : ""}` : ""}`;
      const l3 = direct ? `◆${c.letter} · linked on-chain` : `◆${c.letter} · shared ${esc(c.funderShort || shortAddr(c.funder))}`;
      const wpx = Math.max(l1.length, l2.length, l3.length) * 6.9 + 22;
      const yTop = c._cy - (c._blobR || 40) - 30;
      return `<g>
        <rect x="${(c._cx - wpx / 2).toFixed(1)}" y="${yTop.toFixed(1)}" width="${wpx.toFixed(1)}" height="52" rx="11" fill="#04120a" fill-opacity="0.82" stroke="${c.color}" stroke-opacity="0.55" stroke-width="1.4"/>
        <text x="${c._cx.toFixed(1)}" y="${(yTop + 16).toFixed(1)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10.5" font-weight="700" fill="${c.color}" paint-order="stroke" stroke="#04120a" stroke-width="2.5">${esc(l3)}</text>
        <text x="${c._cx.toFixed(1)}" y="${(yTop + 32).toFixed(1)}" text-anchor="middle" font-family="Arial Black, Arial" font-size="13" font-weight="900" fill="#eafff0" paint-order="stroke" stroke="#04120a" stroke-width="2.5">${esc(l1)}</text>
        <text x="${c._cx.toFixed(1)}" y="${(yTop + 47).toFixed(1)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="${c.color}" paint-order="stroke" stroke="#04120a" stroke-width="2.5">${esc(l2)}</text>
      </g>`;
    }).join("");
  }
  // 🏷️ wallet SNIPPET under bigger bubbles (first4…last4) — reads like a real address (clickable on-site).
  const snippets = placed.filter((p) => p.wallet && !p.label && p.size >= 13).map((p) =>
    `<text x="${p.x.toFixed(1)}" y="${(p.y + p.size + 12).toFixed(1)}" text-anchor="middle" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="10" font-weight="700" fill="#bfe9c8" paint-order="stroke" stroke="#04120a" stroke-width="3">${esc(shortAddr(p.wallet))}</text>`
  ).join("");

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

  // Center hub — the COIN's PFP filling the orb when we have it (resolved to a data-URI in renderSlimeMapPng),
  // else a glowing gradient orb. Ticker + subtitle sit UNDER the orb when the image is present (like the site).
  const hubR = subject.length > 8 ? 62 : 58;
  const fs = subject.length > 8 ? 22 : 26;
  const hub = centerImage
    ? `<g>
    <clipPath id="hubClip"><circle cx="${cx}" cy="${cy}" r="${hubR - 2}"/></clipPath>
    <circle cx="${cx}" cy="${cy}" r="${hubR + 14}" fill="#5be36a" fill-opacity="0.12"/>
    <circle cx="${cx}" cy="${cy}" r="${hubR}" fill="#0a1f12" stroke="#5be36a" stroke-width="3"/>
    <image href="${esc(centerImage)}" x="${(cx - hubR + 2).toFixed(1)}" y="${(cy - hubR + 2).toFixed(1)}" width="${(hubR * 2 - 4).toFixed(1)}" height="${(hubR * 2 - 4).toFixed(1)}" clip-path="url(#hubClip)" preserveAspectRatio="xMidYMid slice"/>
    <circle cx="${cx}" cy="${cy}" r="${hubR + 6}" fill="none" stroke="#7dff5b" stroke-width="1.4" stroke-opacity="0.55"/>
    <text x="${cx}" y="${(cy + hubR + 28).toFixed(1)}" text-anchor="middle" font-family="Arial Black, Arial" font-size="${fs}" font-weight="900" fill="#eafff0" paint-order="stroke" stroke="#04120a" stroke-width="5">${esc(subject)}</text>
    <text x="${cx}" y="${(cy + hubR + 48).toFixed(1)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#7bd98a" paint-order="stroke" stroke="#04120a" stroke-width="3">${esc(subtitle)}</text>
  </g>`
    : `<g>
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

  // 📊 SIDE PANEL — ranked clusters w/ bars + holders/whales/KOLs stat grid + KOL roster (Bubblemaps-style).
  let panel = "";
  if (sidePanel) {
    const px = mapW + 20, pw = PANEL - 40;
    const whales = placed.filter((p) => p.state === "whale").length;
    const kolNodes = nodes.filter((n) => n.isKol);
    const kolCount = Math.max(Number(kolsIn) || 0, kolNodes.length);
    const maxPct = cls.reduce((m, c) => Math.max(m, +c.pct || 0), 0) || 1;
    let y = 34;
    const rows = [];
    // header (no emoji — resvg has no emoji font, they'd render as tofu; use a drawn accent instead)
    rows.push(`<circle cx="${px + 7}" cy="${y - 5}" r="7" fill="none" stroke="#ffcf4d" stroke-width="2"/><circle cx="${px + 7}" cy="${y - 5}" r="2.5" fill="#ffcf4d"/>`);
    rows.push(`<text x="${px + 22}" y="${y}" font-family="Arial Black, Arial" font-size="19" font-weight="900" fill="#eafff0">Clusters (${cls.length})</text>`);
    rows.push(`<text x="${px + pw}" y="${y}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#7bd98a">bundled / insider</text>`);
    y += 22;
    if (!cls.length) {
      rows.push(`<text x="${px}" y="${y + 8}" font-family="Arial, sans-serif" font-size="12.5" font-weight="600" fill="#9fe0ab">No wallet clusters — top holders</text>`);
      rows.push(`<text x="${px}" y="${y + 26}" font-family="Arial, sans-serif" font-size="12.5" font-weight="600" fill="#9fe0ab">were funded independently. Clean.</text>`);
      y += 44;
    } else {
      cls.slice(0, 8).forEach((c) => {
        const barW = pw - 8, fillW = Math.max(6, barW * Math.min(1, (+c.pct || 0) / maxPct));
        rows.push(`<g>
          <circle cx="${px + 7}" cy="${y + 6}" r="6" fill="${c.color}"/>
          <text x="${px + 20}" y="${y + 10}" font-family="Arial Black, Arial" font-size="13" font-weight="900" fill="#eafff0">Cluster ${c.letter}</text>
          <text x="${px + 96}" y="${y + 10}" font-family="Arial, sans-serif" font-size="11.5" font-weight="700" fill="#9fe0ab">${c.size || (c.members || []).length} wallets</text>
          <text x="${px + pw}" y="${y + 10}" text-anchor="end" font-family="Arial Black, Arial" font-size="13" font-weight="900" fill="${c.color}">COMBINED ${(+c.pct).toFixed(1)}% · ${fmtUsd(c.usd)}</text>
          <rect x="${px}" y="${y + 17}" width="${barW}" height="8" rx="4" fill="#0c2113"/>
          <rect x="${px}" y="${y + 17}" width="${fillW.toFixed(1)}" height="8" rx="4" fill="${c.color}"/>
        </g>`);
        y += 36;
      });
    }
    y += 8;
    // stat grid (2x2)
    const cellW = (pw - 12) / 2;
    // HOLDERS shows the coin's REAL total (from the stats header), not just the bubble count.
    const holdersVal = (stats.find((s) => String(s.label).toUpperCase() === "HOLDERS") || {}).value || String(nodes.length);
    const grid = [["HOLDERS", String(holdersVal), "#5be36a"], ["WHALES", String(whales), "#ffcf4d"], ["KOLS IN", String(kolCount), "#ffcf4d"], ["CLUSTERS", String(cls.length), "#ff7de3"]];
    grid.forEach((g, i) => {
      const gx = px + (i % 2) * (cellW + 12), gy = y + Math.floor(i / 2) * 62;
      rows.push(`<g>
        <rect x="${gx}" y="${gy}" width="${cellW.toFixed(1)}" height="52" rx="12" fill="#0a1f12" stroke="#2f6b3a" stroke-width="1.3"/>
        <circle cx="${gx + 16}" cy="${gy + 18}" r="4" fill="${g[2]}"/>
        <text x="${gx + 26}" y="${gy + 22}" font-family="Arial, sans-serif" font-size="10.5" font-weight="800" letter-spacing="0.4" fill="#7bd98a">${esc(g[0])}</text>
        <text x="${gx + 12}" y="${gy + 44}" font-family="Arial Black, Arial" font-size="22" font-weight="900" fill="#eafff0">${esc(g[1])}</text>
      </g>`);
    });
    y += 62 * 2 + 14;
    // KOL roster
    if (kolNodes.length) {
      rows.push(`<circle cx="${px + 6}" cy="${y - 5}" r="5" fill="#ffcf4d"/><text x="${px + 18}" y="${y}" font-family="Arial Black, Arial" font-size="14" font-weight="900" fill="#eafff0">${kolCount} KOL${kolCount > 1 ? "s" : ""} holding</text>`);
      y += 20;
      kolNodes.slice(0, 6).forEach((n) => {
        rows.push(`<g>
          <circle cx="${px + 9}" cy="${y + 6}" r="9" fill="#0a1f12" stroke="#ffcf4d" stroke-width="1.4"/>
          ${n.avatar ? `<clipPath id="pk${n.i}"><circle cx="${px + 9}" cy="${y + 6}" r="8"/></clipPath><image href="${esc(n.avatar)}" x="${px + 1}" y="${y - 2}" width="16" height="16" clip-path="url(#pk${n.i})" preserveAspectRatio="xMidYMid slice"/>` : ""}
          <text x="${px + 26}" y="${y + 10}" font-family="Arial, sans-serif" font-size="12.5" font-weight="800" fill="#eafff0">${esc(String(n.name || "").slice(0, 20))}</text>
          <text x="${px + pw}" y="${y + 10}" text-anchor="end" font-family="Arial Black, Arial" font-size="12" font-weight="900" fill="#ffcf4d">${n.pct != null ? (+n.pct).toFixed(1) + "%" : ""}</text>
        </g>`);
        y += 24;
      });
    }
    panel = `<line x1="${mapW}" y1="20" x2="${mapW}" y2="${H - 20}" stroke="#2f6b3a" stroke-opacity="0.6" stroke-width="1.5"/>
      <rect x="${mapW + 8}" y="20" width="${PANEL - 20}" height="${H - 40}" rx="16" fill="#04120a" fill-opacity="0.55"/>
      ${rows.join("")}`;
  }

  // Legend + wordmark
  const legend = `<g font-family="Arial, sans-serif" font-size="12" font-weight="700">
    ${fundMode
      ? `<circle cx="34" cy="${H - 30}" r="6" fill="#4dd6ff"/><text x="46" y="${H - 26}" fill="#9fe0ab">funded this wallet</text>
    <circle cx="178" cy="${H - 30}" r="6" fill="#8dff6a"/><text x="190" y="${H - 26}" fill="#9fe0ab">wallet funded</text>
    <circle cx="300" cy="${H - 30}" r="6" fill="#ffcf4d"/><text x="312" y="${H - 26}" fill="#9fe0ab">both ways</text>`
      : `<circle cx="34" cy="${H - 30}" r="6" fill="#5be36a"/><text x="46" y="${H - 26}" fill="#9fe0ab">holding</text>
    <circle cx="132" cy="${H - 30}" r="6" fill="#e2564b"/><text x="144" y="${H - 26}" fill="#9fe0ab">sold</text>
    <circle cx="214" cy="${H - 30}" r="6" fill="#ffcf4d"/><text x="226" y="${H - 26}" fill="#9fe0ab">whale</text>`}
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
    ${clusterBlobs}
    ${spokes}
    ${clusterArrows}
    ${header}
    ${hub}
    ${nodeEls}
    ${snippets}
    ${labels}
    ${clusterCards}
    ${panel}
    ${legend}
  </svg>`;
}

// Fetch a remote avatar (X pfp etc.) → square PNG data-URI so it embeds in the SVG (resvg/librsvg won't
// fetch remote hrefs at raster time). Small + cached by the caller. Returns null on any failure.
// An `ipfs.io/ipfs/<cid>` or `ipfs://<cid>` URL → ordered gateway candidates (Cloudflare + pump's own CDN are
// FAST; ipfs.io is slow/rate-limited on Render — the "coin PFP won't load on the airdrop card" cause). We try
// them in order until one returns an image. Non-IPFS URLs pass through unchanged.
function ipfsGatewayCandidates(url) {
  const s = String(url || "");
  const m = s.match(/\/ipfs\/([^?#]+)/i) || s.match(/^ipfs:\/\/(?:ipfs\/)?([^?#]+)/i);
  if (!m || !m[1]) return [s];
  const cid = m[1].replace(/^ipfs\//, "");
  return [
    `https://cf-ipfs.com/ipfs/${cid}`,        // Cloudflare — fast + reliable
    `https://ipfs-gw.pump.fun/ipfs/${cid}`,   // pump's own gateway (their logos live here)
    `https://dweb.link/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,            // slow original last
  ];
}
// THE ONE hardened image fetcher — every coin PFP / avatar on every card goes through this. Returns a
// guaranteed-decodable square PNG Buffer, or null. Hard-won lessons baked in (each cost a "PFP won't load"
// bug): (1) AbortController + setTimeout, because AbortSignal.timeout is MISSING on Render's older Node so a
// timeout there is a silent no-op; (2) a browser User-Agent + Accept, because coin-logo CDNs (DexScreener,
// pump) 403/422 a bare fetch; (3) try the FAST IPFS gateways (Cloudflare/pump/dweb) under one total deadline,
// never trust slow ipfs.io alone; (4) ALWAYS re-encode through sharp → a non-image (HTML error page) or odd format (webp/
// avif/gif) can NEVER slip through and get silently dropped by a downstream compositor. Callers that need a
// data-URI wrap the buffer; callers that need a Buffer use it directly.
export async function fetchLogoBuffer(url, size = 200, ms = 7000) {
  if (!url) return null;
  const candidates = [...new Set(ipfsGatewayCandidates(url).map((href) => String(href || "").trim()).filter(Boolean))];
  const totalMs = Math.max(250, Number(ms) || 7000);
  const deadline = Date.now() + totalMs;
  for (let index = 0; index < candidates.length; index += 1) {
    const href = candidates[index];
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) break;
    // Split one total budget across the gateways still available. Previously every gateway received its
    // own 2.5s+ timeout, so a nominal 7s fetch could block for 10-15s before returning null.
    const candidatesLeft = candidates.length - index;
    const per = Math.max(1, Math.min(remainingMs, Math.max(100, Math.ceil(remainingMs / candidatesLeft))));
    const ctl = new AbortController();
    const t = setTimeout(() => { try { ctl.abort(); } catch {} }, per);
    try {
      const res = await fetch(href, {
        signal: ctl.signal, redirect: "follow",
        headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36", "accept": "image/*,*/*" },
      });
      if (!res.ok) { clearTimeout(t); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 80) { clearTimeout(t); continue; }
      if (Date.now() >= deadline) continue;
      // animated? take the first frame. Any decode failure → try the next gateway (never return garbage).
      const decode = sharp(buf, { animated: false }).resize(size, size, { fit: "cover", position: "attention" }).png().toBuffer();
      const decodeRemainingMs = Math.max(1, deadline - Date.now());
      let decodeTimer;
      const png = await Promise.race([
        decode,
        new Promise((_, reject) => {
          decodeTimer = setTimeout(() => reject(new Error("logo decode deadline exceeded")), decodeRemainingMs);
        })
      ]).finally(() => clearTimeout(decodeTimer));
      clearTimeout(t);
      return png;
    } catch { /* try the next gateway */ }
    finally { clearTimeout(t); }
  }
  return null;
}
export async function fetchAvatarDataUri(url, size = 96, ms = 4500) {
  const png = await fetchLogoBuffer(url, size, ms);
  return png ? "data:image/png;base64," + png.toString("base64") : null;
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

export async function renderSlimeMapPng({ subject, subtitle, stats = [], nodes = [], bgPath = null, centerImage = null, clusters = [], clusterEdges = [], clusterLinks = [], sidePanel = false, kolsIn = 0, W = 900, H = 820 } = {}) {
  // Resolve avatars → embedded data-URIs, in parallel. KOL X pfps come from a remote URL (fetch); anonymous
  // wallets get a LOCAL slime face (read off disk). Deduped so the same face/url is only processed once.
  // The COIN's PFP (centerImage) is fetched the same way so it embeds in the center hub of the share card.
  const cache = new Map(), faceCache = new Map();
  const centerImageP = centerImage ? fetchAvatarDataUri(centerImage, 160, 9000) : Promise.resolve(null);   // 9s: coin logos live on slow IPFS gateways
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
  const centerData = await centerImageP;        // null if the coin logo failed → hub falls back to the orb

  const svg = buildMapSvg({ subject, subtitle, stats, nodes, transparent: true, centerImage: centerData, clusters, clusterEdges, clusterLinks, sidePanel, kolsIn, W, H });
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

// ===== 💰 AIRDROP CARD — a DISTINCT light/cream slime look (money bags + diamonds), so the airdrop share
// card doesn't look identical to the dark holder-map card. Matches the /airdrop site aesthetic. =====
const BAG_PATH = "M20 4.5c-2.5 0-4.2 1.5-4.2 3.2 0 1 .55 1.9 1.45 2.5l-.9 1.6C12.4 14.1 8 19.7 8 26.1 8 32.6 13.2 36 20 36s12-3.4 12-9.9c0-6.4-4.4-12-8.35-14.3l-.9-1.6c.9-.6 1.45-1.5 1.45-2.5 0-1.7-1.7-3.2-4.2-3.2z";
const BAG_TIE = "M15.2 9.6q4.8 2 9.6 0";
const BAGPAL = [["#7fb8e6", "#3a6ea5"], ["#e79cc4", "#a8477e"], ["#b79ae0", "#6f4aa0"], ["#9aa6e6", "#4a56a0"], ["#7fd0d0", "#3a9a9a"], ["#e6b07f", "#a86a3a"], ["#88d18a", "#3f9c34"], ["#d99ad0", "#9a4a90"]];
const STAT_BG = ["#bfe2f5", "#f6c9dd", "#e9d5f2", "#cdd0f4", "#3a3550"];   // matches the site's s0..s4 header
function bagHash(s) { let h = 0; s = String(s || ""); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

export function buildAirdropSvg({ subject = "$SLIME", subtitle = "airdrop", stats = [], nodes = [], flow = null, centerImage = null, devName = "", W = 900, H = 820 } = {}) {
  const cx = W / 2, cy = 150 + (H - 150) / 2;
  const laid = layout(nodes.slice(0, 90), cx, cy, 96, Math.min(cx, cy) - 66);
  const cardW = (W - 2 * 22 - 4 * 10) / 5;
  const header = stats.slice(0, 5).map((s, i) => {
    const x = 22 + i * (cardW + 10), y = 18, bg = STAT_BG[i] || "#e9d5f2", dark = i === 4;
    return `<g>
      <rect x="${x.toFixed(1)}" y="${y}" width="${cardW.toFixed(1)}" height="92" rx="16" fill="${bg}"/>
      <text x="${(x + cardW / 2).toFixed(1)}" y="${y + 24}" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="${dark ? "#c9b8ff" : "#5b4a58"}">${esc(String(s.label || "").toUpperCase())}</text>
      <text x="${(x + cardW / 2).toFixed(1)}" y="${y + 58}" text-anchor="middle" font-family="Arial Black, Arial" font-size="26" font-weight="900" fill="${dark ? "#ffffff" : "#2b2417"}">${esc(s.value || "")}</text>
      ${s.sub ? `<text x="${(x + cardW / 2).toFixed(1)}" y="${y + 78}" text-anchor="middle" font-family="Arial" font-size="10" fill="${dark ? "#c9b8ff" : "#8b7d5f"}">${esc(s.sub)}</text>` : ""}
    </g>`;
  }).join("");
  const flowAll = Array.isArray(flow?.rows) ? flow.rows.slice(0, 50) : [];
  // Draw the biggest ~15 as bags (readable), then LIST more in the "top transfer paths" table below —
  // that's the clean way to surface up to the top 50 without cramming the visual (owner's "top fifty").
  const flowRows = flowAll.slice(0, 15);
  if (flowRows.length) {
    const nodeByIndex = new Map(nodes.map((n) => [n.i, n]));
    const sourceX = 150, sourceY = 275;
    const cols = [360, 535, 710];
    // Spread + vertically center the rows between the header and the transfer table — a small drop (few
    // rows) otherwise bunched at the top and left a dead band above the table.
    const gridRows = Math.max(1, Math.ceil(flowRows.length / cols.length));
    const rowH = gridRows > 1 ? Math.min(96, (500 - 158) / (gridRows - 1)) : 0;
    const startY = 158 + Math.max(0, (500 - 158 - (gridRows - 1) * rowH) / 2);
    const placed = flowRows.map((row, i) => {
      const node = nodeByIndex.get(row.i) || {};
      const col = i % cols.length;
      const y = startY + Math.floor(i / cols.length) * rowH;
      return { ...node, ...row, x: cols[col], y, size: 18 + Math.max(0.15, Math.min(1, node.weight || 0.35)) * 18 };
    });
    const paths = placed.map((row, i) => {
      const held = row.held !== false;
      const stroke = held ? "#50b947" : "#d76a58";
      const w = Math.max(1.4, Math.min(5.2, 1.4 + (Number(row.weight) || 0.25) * 4));
      return `<path d="M${sourceX + 108} ${sourceY} C${sourceX + 170} ${sourceY + (i % 3 - 1) * 18},${row.x - 84} ${row.y},${row.x - 28} ${row.y}" fill="none" stroke="${stroke}" stroke-opacity="${held ? "0.62" : "0.42"}" stroke-width="${w.toFixed(1)}"/>`;
    }).join("");
    const sourceCard = `<g>
      <rect x="28" y="126" width="256" height="228" rx="22" fill="#fffaf0" fill-opacity="0.88" stroke="#3f9c34" stroke-opacity="0.72" stroke-width="2.4"/>
      <text x="52" y="164" font-family="Arial Black, Arial" font-size="26" font-weight="900" fill="#2b2417">${esc(flow.title || "Drop Flow")}</text>
      <text x="52" y="188" font-family="Arial" font-size="13" font-weight="700" fill="#8b7d5f">${esc(String(flow.subtitle || subtitle).slice(0, 46))}</text>
      <circle cx="${sourceX}" cy="${sourceY}" r="58" fill="#eaf6e6" stroke="#3f9c34" stroke-width="4"/>
      ${centerImage
        ? `<clipPath id="flowSourceClip"><circle cx="${sourceX}" cy="${sourceY}" r="53"/></clipPath><image href="${esc(centerImage)}" x="${sourceX - 53}" y="${sourceY - 53}" width="106" height="106" clip-path="url(#flowSourceClip)" preserveAspectRatio="xMidYMid slice"/>`
        : `<text x="${sourceX}" y="${sourceY + 15}" text-anchor="middle" font-family="Arial Black, Arial" font-size="42" font-weight="900" fill="#3f9c34">$</text>`}
      <text x="${sourceX}" y="${sourceY + 82}" text-anchor="middle" font-family="Arial Black, Arial" font-size="19" font-weight="900" fill="#2b2417">${esc(subject)}</text>
      <text x="${sourceX}" y="${sourceY + 103}" text-anchor="middle" font-family="Arial" font-size="12" font-weight="700" fill="#8b7d5f">${esc(String(flow.sourceLabel || devName || "source").slice(0, 24))}</text>
    </g>`;
    const bagEls = placed.map((row) => {
      const pal = BAGPAL[bagHash(row.wallet || row.to || String(row.i)) % BAGPAL.length];
      const held = row.held !== false;
      const sc = (row.size * 2) / 40;
      const label = String(row.to || "").slice(0, 14);
      const amount = String(row.amountLabel || "").slice(0, 10);
      return `<g transform="translate(${row.x.toFixed(1)},${row.y.toFixed(1)})">
        <g transform="scale(${sc.toFixed(3)}) translate(-20,-20)" opacity="${held ? 1 : 0.58}">
          <path d="${BAG_PATH}" fill="${pal[0]}" stroke="${pal[1]}" stroke-width="1.8"/>
          <path d="${BAG_TIE}" fill="none" stroke="${pal[1]}" stroke-width="2" stroke-linecap="round"/>
          <text x="20" y="28" text-anchor="middle" font-family="Arial Black, Arial" font-size="12" font-weight="900" fill="#ffffff">${held ? "$" : "x"}</text>
        </g>
        <rect x="${(row.size + 7).toFixed(1)}" y="-17" width="116" height="34" rx="13" fill="#fffaf0" stroke="${held ? "#3f9c34" : "#b56256"}" stroke-width="1.4"/>
        <text x="${(row.size + 16).toFixed(1)}" y="-2" font-family="Arial Black, Arial" font-size="12" font-weight="900" fill="#2b2417">${esc(amount)}</text>
        <text x="${(row.size + 16).toFixed(1)}" y="13" font-family="Arial" font-size="10" font-weight="700" fill="#8b7d5f">${esc(label)}</text>
      </g>`;
    }).join("");
    // Table = the top transfer paths from the full top-50 set (not just the 15 drawn), biggest bag first.
    // TWO columns of 7 (14 rows) so a big drop reads like a real distribution sheet without cramming. The
    // FROM column is dropped — it's always the one source (shown in the source card), so the space goes to
    // rank/amount/%/wallet/status instead.
    const perCol = 7;
    const tableSrc = flowAll.slice(0, perCol * 2).map((row) => ({ ...(nodeByIndex.get(row.i) || {}), ...row }));
    const colX = [{ base: 44, rank: 58, amt: 92, pct: 176, to: 226, status: 340 }, { base: 452, rank: 466, amt: 500, pct: 584, to: 634, status: 748 }];
    const tableRows = tableSrc.map((row, i) => {
      const c = colX[Math.floor(i / perCol)];
      const y = 648 + (i % perCol) * 16.4;
      const status = row.held !== false ? "HELD" : "DUMPED";
      const color = row.held !== false ? "#3f9c34" : "#b56256";
      const valTxt = Number(row.usd) > 0 ? fmtUsd(row.usd) : "-";      // $ VALUE of the transfer (owner: "how much value")
      const toTxt = (row.isKol ? "KOL " : "") + String(row.to || "").slice(0, row.isKol ? 12 : 13);
      return `<g>
        <rect x="${c.base}" y="${(y - 13).toFixed(1)}" width="376" height="15.6" rx="6" fill="${(i % perCol) % 2 ? "#fff6e8" : "#fffaf0"}" fill-opacity="0.82"/>
        <text x="${c.rank}" y="${y.toFixed(1)}" font-family="Arial Black, Arial" font-size="10.5" font-weight="900" fill="#9a8b6e">${i + 1}</text>
        <text x="${c.amt}" y="${y.toFixed(1)}" font-family="Arial Black, Arial" font-size="11" font-weight="900" fill="#2b2417">${esc(String(row.amountLabel || "").slice(0, 8))}</text>
        <text x="${c.pct}" y="${y.toFixed(1)}" font-family="Arial Black, Arial" font-size="10.5" font-weight="900" fill="#2f8f28">${esc(valTxt)}</text>
        <text x="${c.to}" y="${y.toFixed(1)}" font-family="Arial" font-size="10.5" font-weight="800" fill="${row.isKol ? "#b0640f" : "#6d614d"}">${esc(toTxt)}</text>
        <text x="${c.status}" y="${y.toFixed(1)}" font-family="Arial Black, Arial" font-size="10.5" font-weight="900" fill="${color}">${status}</text>
      </g>`;
    }).join("");
    const totalFed = Number(flow.totalWallets) || flowAll.length;
    const moreNote = totalFed > tableSrc.length ? `top ${tableSrc.length} of ${totalFed} fed | biggest bag first` : `${tableSrc.length} wallet${tableSrc.length === 1 ? "" : "s"} | biggest bag first`;
    const colHdr = (c) => `
      <text x="${c.rank}" y="628" font-family="Arial" font-size="9.5" font-weight="900" fill="#9a8b6e">#</text>
      <text x="${c.amt}" y="628" font-family="Arial" font-size="9.5" font-weight="900" fill="#9a8b6e">AMOUNT</text>
      <text x="${c.pct}" y="628" font-family="Arial" font-size="9.5" font-weight="900" fill="#9a8b6e">VALUE</text>
      <text x="${c.to}" y="628" font-family="Arial" font-size="9.5" font-weight="900" fill="#9a8b6e">TO WALLET / KOL</text>
      <text x="${c.status}" y="628" font-family="Arial" font-size="9.5" font-weight="900" fill="#9a8b6e">STATUS</text>`;
    const table = `<g>
      <rect x="28" y="556" width="844" height="212" rx="20" fill="#fffaf0" fill-opacity="0.92" stroke="#cbb98d" stroke-width="2"/>
      <text x="52" y="588" font-family="Arial Black, Arial" font-size="22" font-weight="900" fill="#2b2417">Top transfer paths</text>
      <text x="${W - 52}" y="588" text-anchor="end" font-family="Arial" font-size="12" font-weight="700" fill="#9a8b6e">${esc(moreNote)}</text>
      <line x1="450" y1="616" x2="450" y2="760" stroke="#e2d3ad" stroke-width="1.5"/>
      ${colHdr(colX[0])}${tableSrc.length > perCol ? colHdr(colX[1]) : ""}
      ${tableRows}
    </g>`;
    const legend = `<g font-family="Arial" font-size="12" font-weight="700">
      <text x="30" y="${H - 22}" fill="#8b7d5f">Green = still holding | red = dumped | KOL = known account | bags show the 15 biggest, table lists the top ${tableSrc.length}</text>
      <rect x="${W - 244}" y="${H - 40}" width="216" height="28" rx="14" fill="#fffaf0" stroke="#3f9c34" stroke-opacity="0.55"/>
      <circle cx="${W - 226}" cy="${H - 26}" r="6" fill="#57c04a"/>
      <text x="${W - 212}" y="${H - 21}" font-family="Arial Black, Arial" font-size="16" font-weight="900" fill="#3f9c34">slimewire.org</text>
    </g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${header}${paths}${sourceCard}${bagEls}${table}${legend}</svg>`;
  }
  const spokes = laid.map((n) => `<line x1="${cx}" y1="${cy}" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}" stroke="#cbb98d" stroke-opacity="0.5" stroke-width="${n.crown || n.label ? 1.6 : 1}"/>`).join("");
  const bags = laid.map((n) => {
    const pal = BAGPAL[bagHash(n.wallet || n.name || String(n.i)) % BAGPAL.length];
    const sc = (n.size * 2) / 40;
    const held = n.state === "diamond" || n.held === true;
    const faded = !held;
    return `<g transform="translate(${n.x.toFixed(1)},${n.y.toFixed(1)})">
      ${n.crown ? `<g transform="translate(0,${(-n.size - 6).toFixed(1)})"><path d="M-9 0 L-9 -7 L-4 -3 L0 -9 L4 -3 L9 -7 L9 0 Z" fill="#f4b721" stroke="#a8770f" stroke-width="0.8"/></g>` : ""}
      <g transform="scale(${sc.toFixed(3)}) translate(-20,-20)" opacity="${faded ? 0.5 : 1}">
        <path d="${BAG_PATH}" fill="${pal[0]}" stroke="${pal[1]}" stroke-width="1.6"/>
        <path d="${BAG_TIE}" fill="none" stroke="${pal[1]}" stroke-width="2" stroke-linecap="round"/>
        <text x="20" y="28" text-anchor="middle" font-family="Arial Black, Arial" font-size="12" font-weight="900" fill="#ffffff" opacity="0.92">${held ? "$" : ""}</text>
        ${held && n.weight > 0.35 ? `<path d="M20 8 L25 13 L20 18 L15 13 Z" fill="#3fb6e6" opacity="0.92"/>` : ""}
      </g>
    </g>`;
  }).join("");
  const labels = laid.filter((n) => n.label).map((n) => {
    const w = String(n.label).length * 6.7 + 18, pal = BAGPAL[bagHash(n.wallet || "") % BAGPAL.length];
    return `<g transform="translate(${(n.x + n.size + 6).toFixed(1)},${n.y.toFixed(1)})">
      <rect x="0" y="-11" rx="9" width="${w.toFixed(0)}" height="22" fill="#fffaf0" stroke="${pal[1]}" stroke-width="1.4"/>
      <text x="9" y="4" font-family="Arial" font-size="12.5" font-weight="800" fill="#2b2417">${esc(n.label)}</text>
    </g>`;
  }).join("");
  const hubR = 56;
  const hub = `<g>
    <circle cx="${cx}" cy="${cy}" r="${hubR + 4}" fill="#3f9c34" fill-opacity="0.12"/>
    <circle cx="${cx}" cy="${cy}" r="${hubR}" fill="#eaf6e6" stroke="#3f9c34" stroke-width="4"/>
    ${centerImage
      ? `<clipPath id="aclip"><circle cx="${cx}" cy="${cy}" r="${hubR - 3}"/></clipPath><image href="${esc(centerImage)}" x="${cx - hubR + 3}" y="${cy - hubR + 3}" width="${(hubR - 3) * 2}" height="${(hubR - 3) * 2}" clip-path="url(#aclip)" preserveAspectRatio="xMidYMid slice"/>`
      : `<text x="${cx}" y="${cy + 13}" text-anchor="middle" font-family="Arial Black, Arial" font-size="38" font-weight="900" fill="#3f9c34">$</text>`}
    <text x="${cx}" y="${cy + hubR + 30}" text-anchor="middle" font-family="Arial Black, Arial" font-size="26" font-weight="900" fill="#2b2417" paint-order="stroke" stroke="#fffaf0" stroke-width="5">${esc(subject)}</text>
    <text x="${cx}" y="${cy + hubR + 50}" text-anchor="middle" font-family="Arial" font-size="13" fill="#8b7d5f" paint-order="stroke" stroke="#fffaf0" stroke-width="3">${esc(devName ? "by " + devName : subtitle)}</text>
  </g>`;
  const legend = `<g font-family="Arial" font-size="12" font-weight="700">
    <circle cx="30" cy="${H - 26}" r="6" fill="#3f9c34"/><text x="42" y="${H - 22}" fill="#8b7d5f">held</text>
    <circle cx="92" cy="${H - 26}" r="6" fill="#b56256"/><text x="104" y="${H - 22}" fill="#8b7d5f">dumped</text>
    <path d="M172 ${H - 22} L172 ${H - 29} L177 ${H - 25} L181 ${H - 31} L185 ${H - 25} L190 ${H - 29} L190 ${H - 22} Z" fill="#f4b721"/><text x="196" y="${H - 22}" fill="#8b7d5f">biggest bag</text>
    <rect x="${W - 244}" y="${H - 40}" width="216" height="28" rx="14" fill="#fffaf0" stroke="#3f9c34" stroke-opacity="0.55"/>
    <circle cx="${W - 226}" cy="${H - 26}" r="6" fill="#57c04a"/>
    <text x="${W - 212}" y="${H - 21}" font-family="Arial Black, Arial" font-size="16" font-weight="900" fill="#3f9c34">slimewire.org</text>
  </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${spokes}${header}${bags}${labels}${hub}${legend}</svg>`;
}

export async function renderSlimeAirdropPng({ subject, subtitle, stats = [], nodes = [], flow = null, centerImage = null, devName = "", bgPath = null, W = 900, H = 820 } = {}) {
  const centerData = centerImage ? await fetchAvatarDataUri(centerImage, 160, 9000) : null;   // coin/airdropper pfp → center
  const svg = buildAirdropSvg({ subject, subtitle, stats, nodes, flow, centerImage: centerData, devName, W, H });
  const cardPng = await sharp(Buffer.from(svg)).png().toBuffer();
  // Base = the LIGHT cream slime frame (distinct from the dark map card) or a cream gradient fallback.
  let base;
  if (bgPath && fs.existsSync(bgPath)) {
    base = await sharp(bgPath).resize(W, H, { fit: "cover", position: "centre" })
      .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#f6ecd7" fill-opacity="0.32"/></svg>`), top: 0, left: 0 }]).png().toBuffer();
  } else {
    base = await sharp(Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="g" cx="50%" cy="42%" r="65%"><stop offset="0%" stop-color="#fbf3e0"/><stop offset="100%" stop-color="#efe2c6"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`
    )).png().toBuffer();
  }
  return sharp(base).composite([{ input: cardPng }]).png().toBuffer();
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
