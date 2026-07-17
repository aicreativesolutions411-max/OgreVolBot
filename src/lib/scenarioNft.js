const SCENARIO_API_BASE = "https://api.cloud.scenario.com/v1";

function envText(name) {
  return String(process.env[name] || "").trim();
}

function authHeader() {
  return `Basic ${Buffer.from(`${envText("SCENARIO_API_KEY")}:${envText("SCENARIO_API_SECRET")}`).toString("base64")}`;
}

export function scenarioNftConfigured() {
  return Boolean(envText("SCENARIO_API_KEY") && envText("SCENARIO_API_SECRET") && envText("SCENARIO_NFT_MODEL_ID"));
}

export function scenarioNftModelId() {
  return envText("SCENARIO_NFT_MODEL_ID");
}

async function scenarioJson(pathname, options = {}) {
  if (!scenarioNftConfigured()) throw new Error("Scenario NFT Studio is not configured.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(2_000, Number(options.timeoutMs || 30_000)));
  try {
    const response = await fetch(`${SCENARIO_API_BASE}${pathname}`, {
      method: options.method || "GET",
      headers: {
        Authorization: authHeader(),
        Accept: "application/json",
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" })
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal
    });
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
    if (!response.ok) {
      const detail = String(data?.message || data?.error?.message || data?.error || text || `HTTP ${response.status}`).slice(0, 300);
      throw new Error(`Scenario request failed: ${detail}`);
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

let modelCache = null;
let modelCacheAt = 0;

async function scenarioModel() {
  const now = Date.now();
  if (modelCache && now - modelCacheAt < 10 * 60_000) return modelCache;
  const data = await scenarioJson(`/models/${encodeURIComponent(scenarioNftModelId())}`);
  modelCache = data?.model || data;
  modelCacheAt = now;
  return modelCache;
}

function modelInputs(model) {
  const candidates = [model?.inputs, model?.inference?.inputs, model?.metadata?.inputs, model?.model?.inputs];
  return candidates.find(Array.isArray) || [];
}

function inputName(inputs, predicate) {
  const row = inputs.find((entry) => entry && typeof entry === "object" && predicate(entry));
  return String(row?.name || "").trim();
}

export async function scenarioValidateNftModel() {
  const model = await scenarioModel();
  const inputs = modelInputs(model);
  const promptKey = inputName(inputs, (entry) => entry.prompt === true || /(^|_)(prompt|text)(_|$)/i.test(String(entry.name || ""))) || "prompt";
  const imageKey = inputName(inputs, (entry) => ["file", "file_array", "string"].includes(String(entry.type || "")) && (entry.kind === "image" || /image|reference/i.test(String(entry.name || ""))));
  if (!imageKey) throw new Error("The configured Scenario NFT model needs a reference-image input so the approved collection identity stays consistent.");
  return { ok: true, modelId: scenarioNftModelId(), promptKey, imageKey };
}

async function generationBody({ prompt, referenceImageDataUrl = "" }) {
  const model = await scenarioModel();
  const inputs = modelInputs(model);
  let base = {};
  const configured = envText("SCENARIO_NFT_MODEL_DEFAULTS_JSON");
  if (configured) {
    try { base = JSON.parse(configured); } catch { throw new Error("SCENARIO_NFT_MODEL_DEFAULTS_JSON is not valid JSON."); }
  }
  const promptKey = inputName(inputs, (entry) => entry.prompt === true || /(^|_)(prompt|text)(_|$)/i.test(String(entry.name || ""))) || "prompt";
  base[promptKey] = prompt;
  const ratioKey = inputName(inputs, (entry) => /aspect.?ratio/i.test(String(entry.name || "")));
  if (ratioKey && base[ratioKey] == null) base[ratioKey] = "1:1";
  if (referenceImageDataUrl) {
    const imageKey = inputName(inputs, (entry) => ["file", "string"].includes(String(entry.type || "")) && (entry.kind === "image" || /image|reference/i.test(String(entry.name || ""))));
    const imagesKey = inputName(inputs, (entry) => entry.type === "file_array" && (entry.kind === "image" || /image|reference/i.test(String(entry.name || ""))));
    if (imageKey) base[imageKey] = referenceImageDataUrl;
    else if (imagesKey) base[imagesKey] = [referenceImageDataUrl];
    else throw new Error("The configured Scenario NFT model has no reference-image input. Choose an image-to-image or custom consistency model before accepting funded jobs.");
  }
  return base;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadAsset(assetId) {
  const data = await scenarioJson(`/assets/${encodeURIComponent(assetId)}`, { timeoutMs: 30_000 });
  const url = String(data?.asset?.url || data?.asset?.preview?.url || data?.asset?.thumbnail?.url || "").trim();
  if (!url) throw new Error("Scenario completed without an image URL.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Scenario image download failed (HTTP ${response.status}).`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length || buffer.length > 15 * 1024 * 1024) throw new Error("Scenario returned an invalid or oversized image.");
    return buffer;
  } finally {
    clearTimeout(timeout);
  }
}

export async function scenarioGenerateNftImage({ prompt, referenceImageDataUrl = "", timeoutMs = 240_000 }) {
  const body = await generationBody({ prompt, referenceImageDataUrl });
  const started = await scenarioJson(`/generate/custom/${encodeURIComponent(scenarioNftModelId())}`, {
    method: "POST", body, timeoutMs: 45_000
  });
  const jobId = String(started?.job?.jobId || started?.jobId || "").trim();
  if (!jobId) throw new Error("Scenario did not return a generation job ID.");
  const deadline = Date.now() + Math.max(30_000, Number(timeoutMs || 240_000));
  let job = started?.job || {};
  while (Date.now() < deadline) {
    const status = String(job?.status || "").toLowerCase();
    if (status === "success") break;
    if (["failure", "failed", "canceled", "rejected"].includes(status)) {
      throw new Error(String(job?.metadata?.error || `Scenario generation ${status}.`).slice(0, 300));
    }
    await delay(1_500);
    const polled = await scenarioJson(`/jobs/${encodeURIComponent(jobId)}`, { timeoutMs: 30_000 });
    job = polled?.job || polled;
  }
  if (String(job?.status || "").toLowerCase() !== "success") throw new Error("Scenario generation timed out; the funded job can be resumed.");
  const assetIds = Array.isArray(job?.metadata?.assetIds) ? job.metadata.assetIds : [];
  const assetId = String(assetIds[0] || "").trim();
  if (!assetId) throw new Error("Scenario completed without a generated image asset.");
  return {
    buffer: await downloadAsset(assetId),
    assetId,
    jobId,
    creativeUnitsCost: Number(job?.creativeUnitsCost || started?.creativeUnitsCost || 0) || 0
  };
}
