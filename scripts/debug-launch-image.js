import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sanitizeProviderBody } from "../src/lib/pumpLaunchService.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadDotEnv(path.join(rootDir, ".env"));

const dataDir = path.resolve(process.env.DATA_DIR || path.join(rootDir, "data"));
const launchAttemptId = String(argValue("--launchAttemptId") || process.env.DEBUG_PUMP_LAUNCH_ATTEMPT_ID || "").trim();

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
    return JSON.parse(await fs.readFile(path.join(dataDir, fileName), "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

async function probe(url, accept = "*/*") {
  if (!/^https?:\/\//i.test(String(url || ""))) {
    return { status: "", contentType: "", bodySnippet: "", json: false };
  }
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: accept },
      signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined
    });
    const contentType = response.headers.get("content-type") || "";
    const text = /^image\//i.test(contentType) ? "" : await response.text();
    let json = false;
    if (text) {
      try {
        JSON.parse(text);
        json = true;
      } catch {
        json = false;
      }
    }
    return {
      status: response.status,
      contentType,
      bodySnippet: sanitizeProviderBody(text).slice(0, 500),
      json
    };
  } catch (error) {
    return {
      status: "fetch_error",
      contentType: "",
      bodySnippet: sanitizeProviderBody(error.message),
      json: false
    };
  }
}

const attemptStore = await readJsonIfExists("pump-launch-attempts.json", { attempts: [] });
const attempts = Array.isArray(attemptStore.attempts) ? attemptStore.attempts : [];
const attempt = launchAttemptId
  ? attempts.find((row) => String(row.launchAttemptId || row.id || "") === launchAttemptId)
  : attempts.at(-1);

console.log("PUMP LAUNCH IMAGE DEBUG");
console.log(`dataDir=${dataDir}`);
console.log(`launchAttemptId=${launchAttemptId || "(latest)"}`);
if (!attempt) {
  console.log("attemptFound=false");
  process.exit(0);
}

const imageProcessing = attempt.imageProcessing || {};
const metadataJson = attempt.metadataJson || {};
const requestUri = attempt.requestBody?.tokenMetadata?.uri || "";
const imageProbe = await probe(attempt.imageUri, "image/*,*/*");
const metadataProbe = await probe(attempt.metadataUri, "application/json,*/*");

console.log("attemptFound=true");
console.log(`status=${attempt.status || ""}`);
console.log(`stage=${attempt.stage || ""}`);
console.log(`originalFilename=${imageProcessing.originalFilename || ""}`);
console.log(`reportedMime=${imageProcessing.reportedMime || attempt.imageContentType || ""}`);
console.log(`detectedMime=${imageProcessing.detectedMime || ""}`);
console.log(`originalBytes=${imageProcessing.originalBytes || ""}`);
console.log(`originalWidth=${imageProcessing.originalWidth || ""}`);
console.log(`originalHeight=${imageProcessing.originalHeight || ""}`);
console.log(`processedMime=${imageProcessing.outputMime || attempt.imageContentType || ""}`);
console.log(`processedBytes=${imageProcessing.outputBytes || attempt.imageBytes || ""}`);
console.log(`processedWidth=${imageProcessing.outputWidth || ""}`);
console.log(`processedHeight=${imageProcessing.outputHeight || ""}`);
console.log(`imageUri=${attempt.imageUri || ""}`);
console.log(`imageFetchStatus=${imageProbe.status}`);
console.log(`imageFetchContentType=${imageProbe.contentType}`);
console.log(`metadataUri=${attempt.metadataUri || ""}`);
console.log(`metadataFetchStatus=${metadataProbe.status}`);
console.log(`metadataFetchContentType=${metadataProbe.contentType}`);
console.log(`metadataFetchJson=${metadataProbe.json}`);
console.log(`metadataBodySnippet=${metadataProbe.bodySnippet || sanitizeProviderBody(JSON.stringify(metadataJson)).slice(0, 500)}`);
console.log(`metadataImageMatchesImageUri=${Boolean(metadataJson.image && attempt.imageUri && metadataJson.image === attempt.imageUri)}`);
console.log(`pumpPortalTokenMetadataUri=${requestUri}`);
console.log(`pumpPortalUsesMetadataUri=${Boolean(requestUri && attempt.metadataUri && requestUri === attempt.metadataUri)}`);
