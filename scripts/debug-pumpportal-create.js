import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizePumpPortalCreatePayload,
  pumpPortalCreateDebugSummary,
  sanitizeProviderBody,
  sanitizePumpPortalCreateRequest,
  validatePumpPortalCreatePayload
} from "../src/lib/pumpLaunchService.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadDotEnv(path.join(rootDir, ".env"));

const dataDir = path.resolve(process.env.DATA_DIR || path.join(rootDir, "data"));
const launchAttemptId = argValue("--launchAttemptId") || process.env.DEBUG_PUMP_LAUNCH_ATTEMPT_ID || "";

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

function argValue(name) {
  const exact = process.argv.find((item) => item.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1).trim();
  const index = process.argv.indexOf(name);
  return index >= 0 ? String(process.argv[index + 1] || "").trim() : "";
}

async function readJsonIfExists(fileName, fallback) {
  try {
    const raw = await fs.readFile(path.join(dataDir, fileName), "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

function compact(value = "", length = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, length);
}

async function metadataProbe(uri) {
  const clean = String(uri || "").trim();
  if (!clean) {
    return {
      metadataUriFetchStatus: "",
      metadataUriContentType: "",
      metadataUriBodySnippet: "",
      metadataUriJson: false
    };
  }
  try {
    const response = await fetch(clean, {
      method: "GET",
      signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
    });
    const text = await response.text();
    let json = false;
    try {
      const data = JSON.parse(text);
      json = Boolean(data && typeof data === "object" && !Array.isArray(data));
    } catch {
      json = false;
    }
    return {
      metadataUriFetchStatus: response.status,
      metadataUriContentType: response.headers.get("content-type") || "",
      metadataUriBodySnippet: sanitizeProviderBody(text),
      metadataUriJson: json
    };
  } catch (error) {
    return {
      metadataUriFetchStatus: "fetch_error",
      metadataUriContentType: "",
      metadataUriBodySnippet: compact(error.message),
      metadataUriJson: false
    };
  }
}

const attemptStore = await readJsonIfExists("pump-launch-attempts.json", { attempts: [] });
const attempts = Array.isArray(attemptStore.attempts) ? attemptStore.attempts : [];
const selectedAttempt = launchAttemptId
  ? attempts.find((attempt) => String(attempt.launchAttemptId || attempt.id || "") === String(launchAttemptId))
  : attempts.at(-1);

console.log("PUMPPORTAL CREATE DEBUG");
console.log(`dataDir=${dataDir}`);
console.log(`launchAttemptId=${launchAttemptId || "(latest)"}`);

if (!selectedAttempt) {
  console.log("attemptFound=false");
  process.exit(1);
}

const requestBody = selectedAttempt.requestBody || {};
const summary = pumpPortalCreateDebugSummary(requestBody);
const metadata = await metadataProbe(summary.metadataUri);
let normalizedRequest = null;
let validationOk = false;
let validationError = "";
try {
  normalizedRequest = normalizePumpPortalCreatePayload(requestBody);
  validatePumpPortalCreatePayload(normalizedRequest);
  validationOk = true;
} catch (error) {
  validationError = `${error.code || ""} ${error.message || error}`.trim();
}

console.log("attemptFound=true");
console.log(`endpoint=${selectedAttempt.apiUrl || selectedAttempt.requestMeta?.endpoint || process.env.PUMP_LAUNCH_API_URL || ""}`);
console.log(`method=${selectedAttempt.requestMeta?.method || summary.method}`);
console.log(`contentType=${selectedAttempt.requestMeta?.contentType || summary.contentType}`);
console.log(`bodyIsArray=${summary.bodyIsArray}`);
console.log(`bodyKeys=${summary.bodyKeys.join(",")}`);
console.log(`publicKeyValid=${summary.publicKeyValid}`);
console.log(`mintValid=${summary.mintValid}`);
console.log(`mintLooksLikeSecret=${summary.mintLooksLikeSecret}`);
console.log(`nameLength=${summary.nameLength}`);
console.log(`symbol=${summary.symbol}`);
console.log(`symbolLength=${summary.symbolLength}`);
console.log(`metadataUri=${summary.metadataUri}`);
console.log(`metadataUriFetchStatus=${metadata.metadataUriFetchStatus}`);
console.log(`metadataUriContentType=${metadata.metadataUriContentType}`);
console.log(`metadataUriJson=${metadata.metadataUriJson}`);
console.log(`metadataUriBodySnippet=${compact(metadata.metadataUriBodySnippet, 300)}`);
console.log(`denominatedInSolType=${summary.denominatedInSolType}`);
console.log(`denominatedInSol=${summary.denominatedInSol}`);
console.log(`amountType=${summary.amountType}`);
console.log(`amount=${summary.amount}`);
console.log(`slippageType=${summary.slippageType}`);
console.log(`slippage=${summary.slippage}`);
console.log(`priorityFeeType=${summary.priorityFeeType}`);
console.log(`priorityFee=${summary.priorityFee}`);
console.log(`pool=${summary.pool}`);
console.log(`payloadValidationOk=${validationOk}`);
if (!validationOk) console.log(`payloadValidationError=${validationError}`);
console.log(`sanitizedRequest=${JSON.stringify(sanitizePumpPortalCreateRequest(requestBody))}`);
if (normalizedRequest) console.log(`normalizedRequest=${JSON.stringify(sanitizePumpPortalCreateRequest(normalizedRequest))}`);
console.log(`lastPumpPortalStatus=${selectedAttempt.providerStatus || ""}`);
console.log(`lastPumpPortalContentType=${selectedAttempt.providerResponseContentType || ""}`);
console.log(`lastPumpPortalBodySnippet=${compact(selectedAttempt.providerResponseBody || "", 500)}`);
