import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.resolve(process.env.DATA_DIR || path.join(rootDir, "data"));

function argValue(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((item) => item.startsWith(prefix));
  return found ? found.slice(prefix.length) : "";
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

function maskPublicKey(value = "") {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.length <= 12) return text;
  return `${text.slice(0, 6)}...${text.slice(-4)}`;
}

function safeRecord(record = {}) {
  return {
    provider: record.provider || "",
    status: record.status || "",
    pendingConnectId: record.pendingConnectId || "",
    intendedRoute: record.intendedRoute || "",
    callbackRoute: record.callbackRoute || "",
    hasState: Boolean(record.stateId),
    hasNonce: false,
    hasData: false,
    stateValid: record.status === "COMPLETE" || record.status === "RECEIVED" ? true : null,
    callbackParsed: record.status === "COMPLETE",
    walletPublicKey: maskPublicKey(record.walletPublicKey || ""),
    finalizedAppSession: record.status === "COMPLETE" && Boolean(record.userId),
    finalRedirectRoute: record.intendedRoute || "",
    createdAt: record.createdAt || "",
    expiresAt: record.expiresAt || "",
    completedAt: record.completedAt || "",
    lastSafeError: record.safeMessage || "",
    errorCode: record.errorCode || "",
    queryKeys: Array.isArray(record.queryKeys) ? record.queryKeys : []
  };
}

const store = await readJsonIfExists("web-auth.json", { mobileWalletConnects: {} });
const records = Object.values(store.mobileWalletConnects || {})
  .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
const pendingConnectId = argValue("pendingConnectId");

console.log("MOBILE WALLET CALLBACK DEBUG");
console.log(`dataDir=${dataDir}`);

if (pendingConnectId) {
  const record = store.mobileWalletConnects?.[pendingConnectId];
  if (!record) {
    console.log(JSON.stringify({ pendingConnectId, found: false }, null, 2));
  } else {
    console.log(JSON.stringify({ found: true, ...safeRecord(record) }, null, 2));
  }
} else {
  console.log(JSON.stringify({
    count: records.length,
    last10: records.slice(0, 10).map(safeRecord)
  }, null, 2));
}
