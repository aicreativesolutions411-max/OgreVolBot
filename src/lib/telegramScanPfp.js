import sharp from "sharp";
import { fetchLogoBuffer } from "./slimeMapRender.mjs";

// Only artwork already discovered by the scan. No extra metadata/RPC requests, no
// generated initials, banners or stats overlays. Shared with neither charts nor X.
export function createScanPfpLoader({ fetchImage = fetchLogoBuffer, now = Date.now, timeoutMs = 4500, maxEntries = 200 } = {}) {
  const cache = new Map();
  const inFlight = new Map();
  const boundedSet = (key, value) => {
    cache.delete(key);
    cache.set(key, value);
    while (cache.size > maxEntries) cache.delete(cache.keys().next().value);
  };
  const normalize = async (buffer) => {
    if (!Buffer.isBuffer(buffer) || !buffer.length || buffer.length > 6_000_000) throw new Error("No usable coin artwork");
    return sharp(buffer, { animated: false, limitInputPixels: 25_000_000 })
      .rotate().resize(512, 512, { fit: "contain", background: "#0b100b" })
      .flatten({ background: "#0b100b" }).jpeg({ quality: 88, chromaSubsampling: "4:4:4" }).toBuffer();
  };
  return async function load(key, imageUrls = [], knownBuffer = null) {
    const urls = [...new Set(imageUrls.filter((url) => typeof url === "string" && /^(https?:\/\/|ipfs:\/\/)/i.test(url)))].slice(0, 3);
    const fingerprint = urls.join("|");
    const cached = cache.get(key);
    if (cached?.buffer && now() - cached.at < 30 * 60_000) return cached.buffer;
    if (cached && !cached.buffer && cached.fingerprint === fingerprint && !knownBuffer && now() - cached.at < 1500) return null;
    if (inFlight.has(key)) return inFlight.get(key);
    if (!urls.length && !knownBuffer) return null;
    const job = (async () => {
      let timer;
      try {
        const candidates = urls.map(async (url) => normalize(await fetchImage(url, 512, timeoutMs)));
        if (knownBuffer) candidates.unshift(normalize(knownBuffer));
        const buffer = await Promise.race([
          Promise.any(candidates),
          new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("PFP deadline")), timeoutMs + 250); })
        ]);
        boundedSet(key, { at: now(), buffer, fingerprint });
        return buffer;
      } catch {
        boundedSet(key, { at: now(), buffer: null, fingerprint });
        return null;
      } finally { clearTimeout(timer); }
    })();
    inFlight.set(key, job);
    try { return await job; } finally { inFlight.delete(key); }
  };
}

export function telegramVisibleText(html) {
  return String(html || "").replace(/<[^>]+>/g, "").replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (match, entity) => {
    if (entity[0] !== "#") return ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" })[entity.toLowerCase()] || match;
    const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return Number.isInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
  });
}

export function scanPhotoContent(text, replyMarkup = null) {
  const plain = telegramVisibleText(text);
  if (plain.length <= 1024) return { caption: text, replyMarkup, fullText: null };
  // Exceptional long scan/context: never reject the PFP or slice through HTML.
  // All original data remains accessible in a reply through Full scan details.
  let preview = "";
  for (const character of plain) {
    if (preview.length + character.length > 900) break;
    preview += character;
  }
  const lastLine = preview.lastIndexOf("\n");
  if (lastLine > 200) preview = preview.slice(0, lastLine);
  const caption = preview.trimEnd().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    + "\n\n<i>Full scan details below — all stats, security and links.</i>";
  const rows = (replyMarkup?.inline_keyboard || []).map((row) => row.filter((button) => button.callback_data !== "scantext:full")).filter((row) => row.length);
  return { caption, fullText: text, replyMarkup: { ...(replyMarkup || {}), inline_keyboard: [...rows, [{ text: "📋 Full scan details", callback_data: "scantext:full" }]] } };
}
