import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertPinataAuthWorks,
  assertPinataConfigured,
  DEFAULT_PINATA_METADATA_URL,
  pinataPublicUriFromUpload,
  sanitizePinataProviderBody,
  safePinataDiagnostics
} from "../src/lib/pinataMetadata.js";

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

async function fetchJson(url, init = {}) {
  const response = await fetch(url, init);
  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: sanitizePinataProviderBody(text) };
    }
  }
  if (!response.ok) {
    const error = new Error(sanitizePinataProviderBody(text) || `HTTP ${response.status}`);
    error.status = response.status;
    error.responseBody = sanitizePinataProviderBody(text);
    throw error;
  }
  return data;
}

const diagnostics = safePinataDiagnostics(tokenValue);
console.log("PUMP PINATA UPLOAD SMOKE");
console.log(`NODE_ENV=${process.env.NODE_ENV || "(not set)"}`);
console.log(`RENDER_SERVICE_NAME=${process.env.RENDER_SERVICE_NAME || process.env.RENDER_SERVICE_ID || "(not set)"}`);
console.log(`PUMP_LAUNCH_PINATA_JWT_PRESENT=${diagnostics.tokenPresent}`);
console.log(`PUMP_LAUNCH_PINATA_JWT_LENGTH=${diagnostics.tokenLength}`);
console.log(`PUMP_LAUNCH_PINATA_JWT_CLEANED=${diagnostics.cleaned}`);
console.log(`PUMP_LAUNCH_PINATA_JWT_PLACEHOLDER=${diagnostics.placeholder}`);
console.log(`PUMP_LAUNCH_METADATA_URL=${metadataUrl || "(missing)"}`);
console.log("uploadNetwork=public");

try {
  const config = assertPinataConfigured({
    tokenValue,
    metadataUrl
  });

  const authResult = await assertPinataAuthWorks({
    tokenValue,
    timeoutMs: Math.min(timeoutMs, 15000)
  });
  console.log(`pinataAuthStatus=${authResult.status}`);

  const metadata = {
    name: "SlimeWire Pinata Smoke",
    symbol: "SWTEST",
    description: "Temporary SlimeWire backend metadata upload smoke test.",
    image: "https://ipfs.io/ipfs/bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku",
    showName: true,
    smokeTest: true,
    createdAt: new Date().toISOString()
  };

  const form = new FormData();
  form.append("network", "public");
  form.append(
    "file",
    new Blob([JSON.stringify(metadata)], { type: "application/json" }),
    `slimewire-pinata-smoke-${Date.now()}.json`
  );

  const upload = await fetchJson(config.metadataUrl, {
    method: "POST",
    headers: config.authHeader,
    body: form,
    signal: AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined
  });
  const metadataUri = pinataPublicUriFromUpload(upload);
  const cid = upload?.data?.cid || upload?.cid || upload?.IpfsHash || upload?.ipfsHash || "";
  if (!cid || !metadataUri) {
    console.log(`uploadOk=false reason="Pinata upload succeeded but response did not include a CID."`);
    process.exitCode = 1;
    process.exit();
  }

  console.log(`uploadOk=true`);
  console.log(`cid=${cid}`);
  console.log(`metadataUri=${metadataUri}`);
} catch (error) {
  console.log(`uploadOk=false code=${error.code || ""} status=${error.providerStatus || error.status || error.statusCode || ""} reason="${sanitizePinataProviderBody(error.message)}"`);
  process.exitCode = 1;
}
