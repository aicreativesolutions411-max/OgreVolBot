import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  assertPinataAuthWorks,
  assertPinataConfigured,
  DEFAULT_PINATA_METADATA_URL,
  sanitizePinataProviderBody,
  safePinataDiagnostics,
  uploadImage,
  uploadJsonMetadata
} from "../src/lib/pinataMetadata.js";
import {
  processLaunchImage,
  safeLaunchImageDiagnostics
} from "../src/lib/launchImageProcessor.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadDotEnv(path.join(rootDir, ".env"));

const tokenValue = process.env.PUMP_LAUNCH_PINATA_JWT || "";
const metadataUrl = (process.env.PUMP_LAUNCH_METADATA_URL || DEFAULT_PINATA_METADATA_URL).trim();
const timeoutMs = Number.parseInt(process.env.PUMP_LAUNCH_TIMEOUT_MS || "30000", 10);

function loadDotEnv(envPath) {
  try {
    const raw = fsSync.readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env is optional on Render.
  }
}

async function publicProbe(url, accept) {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: accept },
    signal: AbortSignal.timeout ? AbortSignal.timeout(Math.min(timeoutMs, 15000)) : undefined
  });
  const contentType = response.headers.get("content-type") || "";
  const text = /^image\//i.test(contentType) ? "" : await response.text();
  return {
    ok: response.ok,
    status: response.status,
    contentType,
    text
  };
}

const diagnostics = safePinataDiagnostics(tokenValue);
console.log("PUMP LAUNCH IMAGE SMOKE");
console.log(`NODE_ENV=${process.env.NODE_ENV || "(not set)"}`);
console.log(`RENDER_SERVICE_NAME=${process.env.RENDER_SERVICE_NAME || process.env.RENDER_SERVICE_ID || "(not set)"}`);
console.log("metadataProvider=pinata");
console.log(`PUMP_LAUNCH_PINATA_JWT_PRESENT=${diagnostics.tokenPresent}`);
console.log(`PUMP_LAUNCH_PINATA_JWT_LENGTH=${diagnostics.tokenLength}`);
console.log(`PUMP_LAUNCH_PINATA_JWT_CLEANED=${diagnostics.cleaned}`);
console.log(`PUMP_LAUNCH_PINATA_JWT_PLACEHOLDER=${diagnostics.placeholder}`);
console.log(`PUMP_LAUNCH_METADATA_URL=${metadataUrl || "(missing)"}`);

try {
  const config = assertPinataConfigured({ tokenValue, metadataUrl });
  const auth = await assertPinataAuthWorks({
    tokenValue,
    timeoutMs: Math.min(timeoutMs, 15000)
  });
  console.log(`providerAuthStatus=${auth.status}`);

  const sampleBuffer = await sharp({
    create: {
      width: 140,
      height: 80,
      channels: 4,
      background: { r: 57, g: 255, b: 20, alpha: 1 }
    }
  }).png().toBuffer();
  const processed = await processLaunchImage({
    buffer: sampleBuffer,
    filename: "slimewire-smoke-phone-screenshot.png",
    contentType: "application/octet-stream"
  }, {
    outputSize: 1000
  });
  const imageDiag = safeLaunchImageDiagnostics(processed);
  console.log(`detectedMime=${imageDiag.detectedMime}`);
  console.log(`processedMime=${imageDiag.outputMime}`);
  console.log(`processedSize=${imageDiag.outputWidth}x${imageDiag.outputHeight}`);
  console.log(`processedBytes=${imageDiag.outputBytes}`);

  const imageUpload = await uploadImage({
    image: processed,
    tokenValue,
    metadataUrl: config.metadataUrl,
    timeoutMs
  });
  const imageUri = imageUpload.imageUri;
  console.log(`imageUploadOk=${Boolean(imageUri)}`);
  console.log(`imageUri=${imageUri}`);
  const imageProbe = await publicProbe(imageUri, "image/*,*/*");
  console.log(`imageFetchStatus=${imageProbe.status}`);
  console.log(`imageFetchContentType=${imageProbe.contentType}`);
  if (!imageProbe.ok || !/^image\//i.test(imageProbe.contentType)) {
    throw new Error(`Uploaded image is not publicly fetchable as image/*: ${imageProbe.status} ${imageProbe.contentType}`);
  }

  const metadata = {
    name: "SlimeWire Image Smoke",
    symbol: "SWIMG",
    description: "Temporary SlimeWire launch image smoke test.",
    image: imageUri,
    showName: true,
    createdOn: "https://pump.fun",
    smokeTest: true
  };
  const metadataUpload = await uploadJsonMetadata({
    metadata,
    filename: `slimewire-launch-image-smoke-${Date.now()}.json`,
    tokenValue,
    metadataUrl: config.metadataUrl,
    timeoutMs
  });
  const metadataUri = metadataUpload.uri;
  console.log(`metadataUploadOk=${Boolean(metadataUri)}`);
  console.log(`metadataUri=${metadataUri}`);
  const metadataProbe = await publicProbe(metadataUri, "application/json,*/*");
  let fetchedMetadata = {};
  try {
    fetchedMetadata = JSON.parse(metadataProbe.text || "{}");
  } catch {
    fetchedMetadata = {};
  }
  console.log(`metadataFetchStatus=${metadataProbe.status}`);
  console.log(`metadataFetchContentType=${metadataProbe.contentType}`);
  console.log(`metadataImageMatches=${fetchedMetadata.image === imageUri}`);
  if (!metadataProbe.ok || fetchedMetadata.image !== imageUri) {
    throw new Error("Uploaded metadata JSON is not publicly fetchable or image field does not match.");
  }
  console.log("smokeOk=true");
} catch (error) {
  console.log(`smokeOk=false code=${error.code || ""} status=${error.providerStatus || error.status || error.statusCode || ""} reason="${sanitizePinataProviderBody(error.message)}"`);
  process.exitCode = 1;
}
