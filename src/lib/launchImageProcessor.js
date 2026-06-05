import sharp from "sharp";
import {
  createPumpLaunchError,
  PUMP_LAUNCH_STAGE
} from "./pumpLaunchService.js";

const DEFAULT_OUTPUT_SIZE = 1000;
const DEFAULT_MAX_INPUT_BYTES = 12 * 1024 * 1024;
const DEFAULT_LIMIT_INPUT_PIXELS = 64_000_000;
const SVG_TEXT_PATTERN = /^\s*(?:<\?xml[^>]*>\s*)?(?:<!doctype\s+svg[^>]*>\s*)?<svg[\s>]/i;
const HEIF_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "mif1", "msf1", "heim", "heis"]);

function createLaunchImageError(message, code, statusCode = 400, extra = {}) {
  return createPumpLaunchError(message, code, statusCode, {
    stage: PUMP_LAUNCH_STAGE.METADATA_UPLOAD,
    ...extra
  });
}

function cleanBase64(value = "") {
  return String(value || "").replace(/\s+/g, "");
}

function safeFilename(value = "") {
  return String(value || "")
    .trim()
    .replace(/[^\w.\-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function normalizeMime(value = "") {
  const mime = String(value || "").trim().toLowerCase().replace(/^image\/jpg$/, "image/jpeg");
  if (mime === "image/pjpeg") return "image/jpeg";
  if (mime === "image/svg") return "image/svg+xml";
  return mime;
}

export function launchImageExtension(contentType = "") {
  const type = normalizeMime(contentType);
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  if (type === "image/heic") return "heic";
  if (type === "image/heif") return "heif";
  if (type === "image/avif") return "avif";
  return "png";
}

function extensionMime(filename = "") {
  const ext = String(filename || "").toLowerCase().split(".").pop();
  if (["jpg", "jpeg"].includes(ext)) return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  if (ext === "avif") return "image/avif";
  if (ext === "svg") return "image/svg+xml";
  return "";
}

export function detectLaunchImageMime(buffer, { reportedMime = "", filename = "" } = {}) {
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  const reported = normalizeMime(reportedMime);
  const extMime = extensionMime(filename);
  if (bytes.length >= 12) {
    if (bytes[0] === 0x89 && bytes.slice(1, 4).toString("ascii") === "PNG") return "image/png";
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
    if (bytes.slice(0, 3).toString("ascii") === "GIF") return "image/gif";
    if (bytes.slice(0, 4).toString("ascii") === "RIFF" && bytes.slice(8, 12).toString("ascii") === "WEBP") return "image/webp";
    if (bytes.slice(4, 8).toString("ascii") === "ftyp") {
      const brand = bytes.slice(8, 12).toString("ascii").toLowerCase();
      if (brand === "avif" || brand === "avis") return "image/avif";
      if (HEIF_BRANDS.has(brand)) return "image/heif";
    }
  }
  const head = bytes.slice(0, 512).toString("utf8");
  if (SVG_TEXT_PATTERN.test(head)) return "image/svg+xml";
  if (reported.startsWith("image/")) return reported;
  if (extMime) return extMime;
  return "application/octet-stream";
}

export function decodeLaunchImageDataUrl(dataUrl, basePayload = {}) {
  const text = String(dataUrl || "");
  const match = /^data:([^;,]*);base64,([\s\S]+)$/i.exec(text);
  if (!match) return null;
  const reportedMime = normalizeMime(match[1] || basePayload.imageType || "");
  const buffer = Buffer.from(cleanBase64(match[2]), "base64");
  if (!buffer.length) return null;
  const symbol = safeFilename(basePayload.symbol || basePayload.name || "token") || "token";
  const filename = safeFilename(basePayload.imageName)
    || `${symbol.toLowerCase()}-${Date.now()}.${launchImageExtension(reportedMime || "image/png")}`;
  return {
    buffer,
    contentType: reportedMime || "application/octet-stream",
    reportedMime: reportedMime || "application/octet-stream",
    filename,
    originalFilename: safeFilename(basePayload.imageName) || filename
  };
}

function sharpCanRead(mime) {
  if (mime === "image/heic" || mime === "image/heif") return Boolean(sharp.format.heif?.input?.buffer || sharp.format.heif?.input?.file);
  if (mime === "image/avif") return Boolean(sharp.format.avif?.input?.buffer || sharp.format.avif?.input?.file);
  return ["image/png", "image/jpeg", "image/webp", "image/gif"].includes(mime);
}

function unsupportedMessage(mime) {
  if (mime === "image/heic" || mime === "image/heif") {
    return "HEIC/HEIF conversion is unavailable in this backend runtime. Save the image as JPG, PNG, or WEBP and retry.";
  }
  if (mime === "image/avif") {
    return "AVIF conversion is unavailable in this backend runtime. Save the image as JPG, PNG, or WEBP and retry.";
  }
  if (mime === "image/svg+xml") {
    return "SVG token images are not accepted for Pump launch. Upload a PNG, JPG, WEBP, GIF, or phone screenshot.";
  }
  return "Unsupported token image type. Upload a PNG, JPG, WEBP, GIF, or phone screenshot.";
}

export async function processLaunchImage(input = {}, options = {}) {
  const originalBuffer = Buffer.isBuffer(input.buffer) ? input.buffer : Buffer.from(input.buffer || []);
  const originalFilename = safeFilename(input.originalFilename || input.filename || "token-image");
  const reportedMime = normalizeMime(input.reportedMime || input.contentType || input.mime || "");
  const maxInputBytes = Number.isFinite(Number(options.maxInputBytes)) && Number(options.maxInputBytes) > 0
    ? Number(options.maxInputBytes)
    : DEFAULT_MAX_INPUT_BYTES;
  const outputSize = Number.isFinite(Number(options.outputSize)) && Number(options.outputSize) > 0
    ? Number(options.outputSize)
    : DEFAULT_OUTPUT_SIZE;

  if (!originalBuffer.length) {
    throw createLaunchImageError("Token image is empty or could not be read.", "PUMP_LAUNCH_IMAGE_EMPTY", 400, {
      originalFilename,
      reportedMime
    });
  }
  if (originalBuffer.length > maxInputBytes) {
    throw createLaunchImageError(
      `Token image is ${Math.ceil(originalBuffer.length / 1024)}KB. Limit is ${Math.floor(maxInputBytes / 1024)}KB.`,
      "PUMP_LAUNCH_IMAGE_TOO_LARGE",
      413,
      {
        originalFilename,
        reportedMime,
        originalBytes: originalBuffer.length,
        maxInputBytes
      }
    );
  }

  const detectedMime = detectLaunchImageMime(originalBuffer, {
    reportedMime,
    filename: originalFilename
  });
  const warnings = [];
  if (detectedMime === "image/gif") warnings.push("Animated GIFs are flattened to the first frame for Pump metadata compatibility.");

  if (!sharpCanRead(detectedMime)) {
    throw createLaunchImageError(unsupportedMessage(detectedMime), "PUMP_LAUNCH_IMAGE_UNSUPPORTED", 415, {
      originalFilename,
      reportedMime,
      detectedMime,
      originalBytes: originalBuffer.length
    });
  }

  let metadata;
  try {
    metadata = await sharp(originalBuffer, {
      animated: false,
      failOn: "warning",
      limitInputPixels: DEFAULT_LIMIT_INPUT_PIXELS
    }).metadata();
  } catch (error) {
    const code = detectedMime === "image/heic" || detectedMime === "image/heif"
      ? "PUMP_LAUNCH_IMAGE_HEIC_UNAVAILABLE"
      : detectedMime === "image/avif"
        ? "PUMP_LAUNCH_IMAGE_AVIF_UNSUPPORTED"
        : "PUMP_LAUNCH_IMAGE_DECODE_FAILED";
    throw createLaunchImageError(
      code === "PUMP_LAUNCH_IMAGE_HEIC_UNAVAILABLE"
        ? unsupportedMessage(detectedMime)
        : `Token image could not be decoded: ${error.message}`,
      code,
      415,
      {
        cause: error,
        originalFilename,
        reportedMime,
        detectedMime,
        originalBytes: originalBuffer.length
      }
    );
  }

  const originalWidth = Number(metadata.width || 0);
  const originalHeight = Number(metadata.height || 0);
  const hasAlpha = Boolean(metadata.hasAlpha);
  const basePipeline = sharp(originalBuffer, {
    animated: false,
    failOn: "warning",
    limitInputPixels: DEFAULT_LIMIT_INPUT_PIXELS
  })
    .rotate()
    .resize(outputSize, outputSize, {
      fit: "cover",
      position: "centre"
    });

  const outputMime = hasAlpha || detectedMime === "image/gif" ? "image/png" : "image/jpeg";
  const outputBuffer = outputMime === "image/png"
    ? await basePipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer()
    : await basePipeline.flatten({ background: "#050805" }).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  const outputMetadata = await sharp(outputBuffer).metadata();
  const extension = launchImageExtension(outputMime);
  const baseName = safeFilename(originalFilename.replace(/\.[^.]+$/, "")) || "token-image";

  return {
    buffer: outputBuffer,
    contentType: outputMime,
    mime: outputMime,
    extension,
    filename: `${baseName}-${outputSize}.${extension}`,
    originalFilename,
    reportedMime: reportedMime || "",
    detectedMime,
    originalBytes: originalBuffer.length,
    originalWidth,
    originalHeight,
    outputBytes: outputBuffer.length,
    outputWidth: Number(outputMetadata.width || outputSize),
    outputHeight: Number(outputMetadata.height || outputSize),
    outputMime,
    warnings
  };
}

export async function defaultLaunchImageInput(symbol = "SW") {
  const safeSymbol = safeFilename(symbol || "SW").slice(0, 8).toUpperCase() || "SW";
  const svg = `
    <svg width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
      <rect width="1000" height="1000" rx="176" fill="#050705"/>
      <circle cx="500" cy="500" r="370" fill="#10230d" stroke="#72ff23" stroke-width="34"/>
      <text x="500" y="560" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="154" font-weight="900" fill="#bbff63">${safeSymbol}</text>
    </svg>`;
  return {
    buffer: await sharp(Buffer.from(svg)).png().toBuffer(),
    contentType: "image/png",
    reportedMime: "image/png",
    filename: `${safeSymbol.toLowerCase()}-slimewire.png`,
    originalFilename: `${safeSymbol.toLowerCase()}-slimewire.png`
  };
}

export function safeLaunchImageDiagnostics(image = {}) {
  return {
    originalFilename: image.originalFilename || image.filename || "",
    reportedMime: image.reportedMime || image.contentType || "",
    detectedMime: image.detectedMime || "",
    originalBytes: image.originalBytes || image.buffer?.length || 0,
    originalWidth: image.originalWidth || 0,
    originalHeight: image.originalHeight || 0,
    outputMime: image.outputMime || image.contentType || "",
    outputBytes: image.outputBytes || image.buffer?.length || 0,
    outputWidth: image.outputWidth || 0,
    outputHeight: image.outputHeight || 0,
    warnings: image.warnings || []
  };
}
