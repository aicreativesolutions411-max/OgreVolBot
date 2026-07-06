// SlimeWire PFP maker — composite a user's photo (Telegram avatar or an upload) into a branded
// SlimeWire profile picture. Pure sharp + hand-authored SVG frames = free, fast, no external service.
// "Accent" frames layer a transparent PNG sticker (Higgs-generated ogre art) over a ring; they only
// appear when their asset file exists, and a bad asset degrades gracefully to the ring alone.
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

export const PFP_SIZE = 1024;

// ---- Shared SVG bits -------------------------------------------------------------------------------
// A dark "corner fill" so any photo reads as a clean round PFP, plus the glossy ring both drawn from
// the same geometry. R = visible-photo radius; the ring sits just outside it.
function baseDefs() {
  return `
    <radialGradient id="bg" cx="50%" cy="40%" r="80%">
      <stop offset="0" stop-color="#123a1d"/>
      <stop offset="0.6" stop-color="#0a1c0f"/>
      <stop offset="1" stop-color="#030804"/>
    </radialGradient>
    <linearGradient id="goo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#c6ff6b"/>
      <stop offset="0.5" stop-color="#54e000"/>
      <stop offset="1" stop-color="#2ba300"/>
    </linearGradient>
    <mask id="hole"><rect width="1024" height="1024" fill="#fff"/><circle cx="512" cy="512" r="470" fill="#000"/></mask>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10"/></filter>`;
}
// Corner backdrop + the base ring, common to every frame. accents/drips draw on top.
function ringBase(ringInner, ringOuter) {
  return `
    <rect width="1024" height="1024" fill="url(#bg)" mask="url(#hole)"/>
    <circle cx="512" cy="512" r="${(ringInner + ringOuter) / 2}" fill="none" stroke="#071408" stroke-width="${ringOuter - ringInner + 14}"/>
    <circle cx="512" cy="512" r="${(ringInner + ringOuter) / 2}" fill="none" stroke="url(#goo)" stroke-width="${ringOuter - ringInner}"/>`;
}
// A band of glossy goo oozing over the top edge onto the photo — overlapping rounded blobs that each
// taper to a downward point (drip). Reads unmistakably as slime, not pins. `blobs` = [x, depth, radius].
function gooTopBand(blobs) {
  const body = blobs.map(([bx, by, r]) =>
    `<path d="M ${bx - r} 20 A ${r} ${r} 0 1 0 ${bx + r} 20`
    + ` C ${bx + r} ${20 + (by - 20) * 0.55} ${bx + 11} ${by - 20} ${bx + 10} ${by - 10}`
    + ` A 10 10 0 0 1 ${bx - 10} ${by - 10}`
    + ` C ${bx - 11} ${by - 20} ${bx - r} ${20 + (by - 20) * 0.55} ${bx - r} 20 Z"`
    + ` fill="url(#goo)" stroke="#0a1a0d" stroke-width="7" stroke-linejoin="round"/>`
  ).join("");
  // a couple of glossy highlights so the goo looks wet
  const shine = blobs.filter((_, i) => i % 2 === 0).map(([bx, , r]) => `<ellipse cx="${bx - r * 0.3}" cy="70" rx="${r * 0.18}" ry="${r * 0.3}" fill="#eaffd0" opacity="0.5"/>`).join("");
  return body + shine;
}
function wordmark(y = 946) {
  return `<g>
    <rect x="342" y="${y}" width="340" height="60" rx="30" fill="#04110a" stroke="url(#goo)" stroke-width="3"/>
    <text x="512" y="${y + 41}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900"
      font-size="34" letter-spacing="6" fill="#b6ff5a">SLIMEWIRE</text>
  </g>`;
}
function svgWrap(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs>${baseDefs()}</defs>${inner}</svg>`;
}

// ---- The frames ------------------------------------------------------------------------------------
function frameSlime() {
  const band = gooTopBand([[196, 96, 52], [300, 138, 74], [412, 104, 60], [512, 156, 86], [620, 110, 62], [724, 140, 74], [828, 92, 52]]);
  const bubbles = `<circle cx="330" cy="720" r="10" fill="url(#goo)" opacity="0.9"/><circle cx="712" cy="770" r="14" fill="url(#goo)" opacity="0.85"/><circle cx="620" cy="690" r="7" fill="#b6ff5a" opacity="0.9"/>`;
  return svgWrap(ringBase(452, 500) + band + bubbles + wordmark());
}
function frameHolo() {
  const glow = `
    <linearGradient id="holo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#54e000"/><stop offset="0.4" stop-color="#00e6c3"/>
      <stop offset="0.7" stop-color="#8a5bff"/><stop offset="1" stop-color="#54e000"/>
    </linearGradient>`;
  const inner = `
    <rect width="1024" height="1024" fill="url(#bg)" mask="url(#hole)"/>
    <circle cx="512" cy="512" r="486" fill="none" stroke="url(#holo)" stroke-width="54" filter="url(#soft)" opacity="0.55"/>
    <circle cx="512" cy="512" r="482" fill="none" stroke="url(#holo)" stroke-width="30"/>
    <circle cx="512" cy="512" r="466" fill="none" stroke="#eafff6" stroke-width="3" opacity="0.5"/>
    ${wordmark()}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs>${baseDefs()}${glow}</defs>${inner}</svg>`;
}
function frameNeon() {
  const inner = `
    <rect width="1024" height="1024" fill="url(#bg)" mask="url(#hole)"/>
    <circle cx="512" cy="512" r="492" fill="none" stroke="#39ff14" stroke-width="6" filter="url(#soft)"/>
    <circle cx="512" cy="512" r="492" fill="none" stroke="#39ff14" stroke-width="4"/>
    <circle cx="512" cy="512" r="470" fill="none" stroke="#39ff14" stroke-width="3" opacity="0.7"/>
    ${wordmark(944)}`;
  return svgWrap(inner);
}
function frameSlimed() {
  // A deep goo splat oozing over the top edge + a bold SLIMED ribbon at the bottom.
  const splat = gooTopBand([[210, 150, 66], [330, 210, 84], [452, 150, 62], [560, 232, 92], [680, 160, 68], [800, 200, 78]]);
  const ribbon = `<g>
      <rect x="286" y="912" width="452" height="82" rx="16" fill="#04110a" stroke="url(#goo)" stroke-width="4"/>
      <text x="512" y="972" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900"
        font-size="58" letter-spacing="10" fill="#c6ff6b">SLIMED</text>
    </g>`;
  return svgWrap(ringBase(452, 500) + splat + ribbon);
}
// Ring-only base used under the Higgs "accent" (sticker) frames.
function frameRingOnly() { return svgWrap(ringBase(452, 500) + wordmark()); }

// id order = display order. `grade` slimes the ACTUAL photo (transforms the pixels → feels custom, not a
// sticker slapped on). accent frames carry {file,width,top|gravity}; they show only if the asset exists.
export const PFP_FRAMES = [
  { id: "slime", label: "💚 Slimed", svg: frameSlime, grade: "slime" },        // hero: green-graded photo + drips
  { id: "toxic", label: "☢️ Toxic", svg: frameSlimed, grade: "toxic" },        // heavier neon-green wash + SLIMED
  { id: "holo", label: "🌈 Holo Glow", svg: frameHolo },                       // clean: natural photo + holo ring
  { id: "neon", label: "⚡ Neon Wire", svg: frameNeon },                       // clean: natural photo + neon ring
  { id: "crown", label: "👑 Slime King", svg: frameRingOnly, grade: "slime", accent: { file: "crown.png", width: 520, top: 4 } },
  { id: "horns", label: "😈 Ogre Horns", svg: frameRingOnly, grade: "slime", accent: { file: "horns.png", width: 720, top: 0 } },
  { id: "mascot", label: "🐸 Ogre Buddy", svg: frameRingOnly, accent: { file: "mascot.png", width: 430, gravity: "southeast" } }
];

function frameById(id) { return PFP_FRAMES.find((f) => f.id === id) || PFP_FRAMES[0]; }

async function accentExists(frameDir, file) {
  try { await fs.access(path.join(frameDir, file)); return true; } catch { return false; }
}

// The frames actually offerable right now (accent frames need their asset file present).
export async function availableFrames(frameDir) {
  const out = [];
  for (const f of PFP_FRAMES) {
    if (f.accent && !(await accentExists(frameDir, f.accent.file))) continue;
    out.push({ id: f.id, label: f.label });
  }
  return out;
}

// "Slime" the actual photo — a green colour-grade + wet pop so the picture itself looks transformed
// (this is what makes it feel custom, not a random sticker). "toxic" = heavier neon duotone.
async function applySlimeGrade(buf, level) {
  const strong = level === "toxic";
  // .tint() = a green DUOTONE: it recolors the photo toward slime-green while preserving the luminance
  // (all the face detail/shading survives) — a clear, reliable "slimed" transform, not a faint wash.
  const tintColor = strong ? { r: 34, g: 236, b: 78 } : { r: 118, g: 208, b: 128 };
  return sharp(buf)
    .modulate({ saturation: 1.12, brightness: 1.02 })
    .tint(tintColor)
    .linear(strong ? 1.16 : 1.07, strong ? -10 : -3)            // contrast pop so it looks glossy/wet
    .png().toBuffer();
}

// Build ONE framed PFP. sourceBuffer = any image the user gave us. Returns a PNG buffer.
export async function makeSlimewirePfp({ sourceBuffer, frameId, frameDir, size = PFP_SIZE }) {
  const frame = frameById(frameId);
  // Cover-crop to a square, focusing on the salient region (a face) so heads aren't chopped.
  let base = await sharp(sourceBuffer, { animated: false })
    .resize(size, size, { fit: "cover", position: "attention" })
    .flatten({ background: "#0a140a" })
    .toBuffer();
  if (frame.grade) { try { base = await applySlimeGrade(base, frame.grade, size); } catch { /* keep ungraded base */ } }
  const layers = [{ input: Buffer.from(frame.svg()), top: 0, left: 0 }];
  if (frame.accent && frameDir) {
    try {
      const raw = await fs.readFile(path.join(frameDir, frame.accent.file));
      const w = Math.min(size, frame.accent.width);
      const sticker = await sharp(raw).resize({ width: w }).png().toBuffer();
      const sh = (await sharp(sticker).metadata()).height || w;
      // Corner buddy → gravity; head-piece (crown/horns) → explicit top so it sits ON the head (a face
      // attention-cropped to a square has its head near the top-centre), never floating in a fixed corner.
      const place = frame.accent.gravity
        ? { input: sticker, gravity: frame.accent.gravity }
        : { input: sticker, left: Math.round((size - w) / 2), top: Math.max(0, Math.min(size - sh, frame.accent.top || 0)) };
      const accentLayer = await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([place]).png().toBuffer();
      layers.push({ input: accentLayer, top: 0, left: 0 });
    } catch { /* asset missing/unreadable → ring-only, still a clean PFP */ }
  }
  return sharp(base).composite(layers).png().toBuffer();
}

// Render EVERY available frame from one source in a single pass (one upload → a whole gallery).
export async function renderAllSlimewirePfps({ sourceBuffer, frameDir, size = PFP_SIZE }) {
  const frames = await availableFrames(frameDir);
  const out = [];
  for (const f of frames) {
    try {
      const png = await makeSlimewirePfp({ sourceBuffer, frameId: f.id, frameDir, size });
      out.push({ id: f.id, label: f.label, png });
    } catch { /* skip a frame that fails to render rather than fail the whole gallery */ }
  }
  return out;
}
