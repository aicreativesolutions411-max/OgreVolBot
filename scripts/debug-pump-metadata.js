import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertPinataConfigured,
  DEFAULT_PINATA_AUTH_TEST_URL,
  DEFAULT_PINATA_METADATA_URL,
  makePinataAuthHeader,
  safePinataDiagnostics
} from "../src/lib/pinataMetadata.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadDotEnv(path.join(rootDir, ".env"));

const dataDir = path.resolve(process.env.DATA_DIR || path.join(rootDir, "data"));
const tokenValue = process.env.PUMP_LAUNCH_PINATA_JWT || "";
const metadataUrl = (process.env.PUMP_LAUNCH_METADATA_URL || DEFAULT_PINATA_METADATA_URL).trim();
const authTestUrl = (process.env.PUMP_LAUNCH_PINATA_AUTH_TEST_URL || DEFAULT_PINATA_AUTH_TEST_URL).trim();
const debugLaunchAttemptId = String(process.env.DEBUG_PUMP_LAUNCH_ATTEMPT_ID || "").trim();

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

async function readJsonIfExists(fileName, fallback) {
  try {
    const raw = await fs.readFile(path.join(dataDir, fileName), "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

function compact(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 260);
}

function safeProviderSnippet(value = "") {
  return compact(value)
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, "$1[redacted]")
    .replace(/([A-Za-z0-9_-]*token[A-Za-z0-9_-]*["']?\s*[:=]\s*["']?)[^"',\s]+/gi, "$1[redacted]");
}

function attemptLine(attempt) {
  return [
    `launchAttemptId=${attempt.launchAttemptId || attempt.id || ""}`,
    `status=${attempt.status || ""}`,
    `stage=${attempt.stage || ""}`,
    `errorCode=${attempt.errorCode || ""}`,
    `providerStatus=${attempt.providerStatus || ""}`,
    `metadataUri=${attempt.metadataUri ? "yes" : "no"}`,
    `reason=${compact(attempt.failureReason || attempt.errorMessage || "")}`
  ].join(" ");
}

async function providerAuthTest() {
  let headers;
  try {
    headers = makePinataAuthHeader(tokenValue);
  } catch (error) {
    return {
      ok: false,
      skipped: true,
      reason: error.message
    };
  }

  try {
    const response = await fetch(authTestUrl, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
    });
    const text = await response.text();
    return {
      ok: response.ok,
      skipped: false,
      status: response.status,
      bodySnippet: safeProviderSnippet(text)
    };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      reason: error.message || "provider auth test failed"
    };
  }
}

const diagnostics = safePinataDiagnostics(tokenValue);
let configured = false;
let configReason = "";
try {
  assertPinataConfigured({
    tokenValue,
    metadataUrl
  });
  configured = true;
} catch (error) {
  configReason = error.message;
}

const attemptStore = await readJsonIfExists("pump-launch-attempts.json", { attempts: [] });
const attempts = Array.isArray(attemptStore.attempts) ? attemptStore.attempts : [];
const metadataAttempts = attempts
  .filter((attempt) => (
    String(attempt.stage || "") === "metadata_upload"
    || String(attempt.status || "") === "FAILED_METADATA_AUTH"
    || /metadata/i.test(String(attempt.errorCode || attempt.failureReason || attempt.errorMessage || ""))
  ))
  .slice(-10)
  .reverse();
const selectedAttempt = debugLaunchAttemptId
  ? attempts.find((attempt) => String(attempt.launchAttemptId || attempt.id || "") === debugLaunchAttemptId)
  : null;

const authResult = configured
  ? await providerAuthTest()
  : { ok: false, skipped: true, reason: configReason || "Pinata config missing" };

console.log("PUMP METADATA DEBUG");
console.log(`NODE_ENV=${process.env.NODE_ENV || "(not set)"}`);
console.log(`RENDER_SERVICE_NAME=${process.env.RENDER_SERVICE_NAME || process.env.RENDER_SERVICE_ID || "(not set)"}`);
console.log(`RENDER_EXTERNAL_HOSTNAME=${process.env.RENDER_EXTERNAL_HOSTNAME || "(not set)"}`);
console.log(`dataDir=${dataDir}`);
console.log(`PUMP_LAUNCH_PINATA_JWT_PRESENT=${diagnostics.tokenPresent}`);
console.log(`PUMP_LAUNCH_PINATA_JWT_LENGTH=${diagnostics.tokenLength}`);
console.log(`PUMP_LAUNCH_PINATA_JWT_CLEANED=${diagnostics.cleaned}`);
console.log(`tokenHadQuotes=${diagnostics.hadSurroundingQuotes}`);
console.log(`tokenHadWhitespace=${diagnostics.hadOuterWhitespace || diagnostics.hadTokenWhitespace}`);
console.log(`tokenHadBearerPrefix=${diagnostics.hadBearerPrefix}`);
console.log(`PUMP_LAUNCH_METADATA_URL=${metadataUrl || "(missing)"}`);
console.log(`imageUploadConfigExists=${Boolean(configured && typeof FormData !== "undefined" && typeof Blob !== "undefined")}`);
console.log(`metadataJsonUploadConfigExists=${Boolean(configured && typeof FormData !== "undefined" && typeof Blob !== "undefined")}`);
console.log(`pinataNetwork=public`);
console.log(`providerAuthTest=${JSON.stringify(authResult)}`);

console.log("LAST 10 METADATA LAUNCH FAILURES");
if (!metadataAttempts.length) {
  console.log("No metadata-stage launch attempts found.");
} else {
  for (const attempt of metadataAttempts) {
    console.log(attemptLine(attempt));
  }
}

if (debugLaunchAttemptId) {
  console.log("SELECTED LAUNCH ATTEMPT");
  console.log(selectedAttempt ? attemptLine(selectedAttempt) : `No launch attempt found for ${debugLaunchAttemptId}.`);
}
