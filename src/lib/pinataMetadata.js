export const DEFAULT_PINATA_METADATA_URL = "https://uploads.pinata.cloud/v3/files";
export const DEFAULT_PINATA_AUTH_TEST_URL = "https://api.pinata.cloud/data/testAuthentication";
export const PINATA_METADATA_STAGE = "metadata_upload";
export const METADATA_PROVIDER = Object.freeze({
  PINATA: "pinata"
});
const PINATA_PLACEHOLDER_PATTERN = /^(?:your[-_\s]?)?(?:pinata[-_\s]?)?(?:jwt|token|api[-_\s]?key|secret)$|placeholder|change[-_\s]?me|replace[-_\s]?me|example|dummy|test[-_\s]?token/i;

function stripMatchingQuotes(value) {
  let token = String(value || "").trim();
  for (let index = 0; index < 3; index += 1) {
    const first = token.at(0);
    const last = token.at(-1);
    if ((first === '"' || first === "'") && first === last && token.length >= 2) {
      token = token.slice(1, -1).trim();
    } else {
      break;
    }
  }
  return token;
}

export function pinataTokenDiagnostics(value = "") {
  const raw = value == null ? "" : String(value);
  let token = raw.replace(/^\uFEFF/, "").trim();
  const hadOuterWhitespace = raw !== token;
  const unquoted = stripMatchingQuotes(token);
  const hadSurroundingQuotes = unquoted !== token;
  token = unquoted.replace(/^authorization\s*:\s*/i, "").trim();
  const hadAuthorizationPrefix = /^authorization\s*:/i.test(unquoted);
  const withoutBearer = token.replace(/^bearer\s+/i, "").trim();
  const hadBearerPrefix = withoutBearer !== token;
  token = stripMatchingQuotes(withoutBearer);
  const withoutWhitespace = token.replace(/\s+/g, "");
  const hadTokenWhitespace = withoutWhitespace !== token;
  token = withoutWhitespace;
  return {
    rawPresent: raw.length > 0,
    tokenPresent: token.length > 0,
    tokenLength: token.length,
    hadOuterWhitespace,
    hadSurroundingQuotes,
    hadAuthorizationPrefix,
    hadBearerPrefix,
    hadTokenWhitespace,
    cleaned: hadOuterWhitespace || hadSurroundingQuotes || hadAuthorizationPrefix || hadBearerPrefix || hadTokenWhitespace,
    placeholder: isPlaceholderPinataJwt(token),
    cleanToken: token
  };
}

export function cleanToken(value = "") {
  return pinataTokenDiagnostics(value).cleanToken;
}

export function isPlaceholderPinataJwt(value = "") {
  const token = String(value || "").trim();
  return !token || PINATA_PLACEHOLDER_PATTERN.test(token);
}

export function createPinataMetadataError(message, code, statusCode = 500, extra = {}) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.stage = PINATA_METADATA_STAGE;
  Object.assign(error, extra);
  return error;
}

export function cleanSecret(raw = "") {
  return cleanToken(raw);
}

export function getPinataJwt(env = process.env) {
  return cleanToken(env?.PUMP_LAUNCH_PINATA_JWT || "");
}

export function makePinataAuthHeader(tokenValue = process.env.PUMP_LAUNCH_PINATA_JWT) {
  const diagnostics = pinataTokenDiagnostics(tokenValue);
  if (!diagnostics.tokenPresent) {
    throw createPinataMetadataError(
      "Pinata metadata upload JWT is missing.",
      "PUMP_METADATA_CONFIG_MISSING",
      500
    );
  }
  if (diagnostics.placeholder) {
    throw createPinataMetadataError(
      "Pinata metadata upload JWT is a placeholder.",
      "PUMP_METADATA_CONFIG_PLACEHOLDER",
      500
    );
  }
  return {
    Authorization: `Bearer ${diagnostics.cleanToken}`
  };
}

export function assertPinataConfigured({
  tokenValue = process.env.PUMP_LAUNCH_PINATA_JWT,
  metadataUrl = process.env.PUMP_LAUNCH_METADATA_URL || DEFAULT_PINATA_METADATA_URL
} = {}) {
  const diagnostics = pinataTokenDiagnostics(tokenValue);
  if (!diagnostics.tokenPresent) {
    throw createPinataMetadataError(
      "Pinata metadata upload JWT is missing.",
      "PUMP_METADATA_CONFIG_MISSING",
      500,
      {
        tokenPresent: false
      }
    );
  }
  if (diagnostics.placeholder) {
    throw createPinataMetadataError(
      "Pinata metadata upload JWT is a placeholder.",
      "PUMP_METADATA_CONFIG_PLACEHOLDER",
      500,
      {
        tokenPresent: true,
        tokenLength: diagnostics.tokenLength
      }
    );
  }
  const endpoint = String(metadataUrl || "").trim();
  if (!endpoint) {
    throw createPinataMetadataError(
      "Pinata metadata upload endpoint is missing.",
      "PUMP_METADATA_CONFIG_MISSING",
      500,
      {
        tokenPresent: true
      }
    );
  }
  return {
    configured: true,
    tokenPresent: true,
    tokenLength: diagnostics.tokenLength,
    tokenCleaned: diagnostics.cleaned,
    hadOuterWhitespace: diagnostics.hadOuterWhitespace,
    hadSurroundingQuotes: diagnostics.hadSurroundingQuotes,
    hadAuthorizationPrefix: diagnostics.hadAuthorizationPrefix,
    hadBearerPrefix: diagnostics.hadBearerPrefix,
    hadTokenWhitespace: diagnostics.hadTokenWhitespace,
    placeholder: diagnostics.placeholder,
    metadataUrl: endpoint,
    authHeader: makePinataAuthHeader(diagnostics.cleanToken)
  };
}

function assertUploadRuntime() {
  if (typeof FormData === "undefined" || typeof Blob === "undefined") {
    throw createPinataMetadataError(
      "This Node runtime does not support metadata uploads. Use Node 20+ on Render.",
      "PUMP_METADATA_RUNTIME_UNSUPPORTED",
      500
    );
  }
}

export function sanitizePinataProviderBody(value = "") {
  return String(value || "")
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, "$1[redacted]")
    .replace(/([A-Za-z0-9_-]*(?:jwt|token|secret|api[-_ ]?key)[A-Za-z0-9_-]*["']?\s*[:=]\s*["']?)[^"',\s]+/gi, "$1[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1000);
}

export async function assertPinataAuthWorks({
  tokenValue = process.env.PUMP_LAUNCH_PINATA_JWT,
  authTestUrl = DEFAULT_PINATA_AUTH_TEST_URL,
  fetchImpl = globalThis.fetch,
  timeoutMs = 10000
} = {}) {
  const headers = makePinataAuthHeader(tokenValue);
  if (typeof fetchImpl !== "function") {
    throw createPinataMetadataError(
      "Pinata auth test cannot run because fetch is unavailable.",
      "PUMP_METADATA_AUTH_TEST_UNAVAILABLE",
      500
    );
  }

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller && Number.isFinite(Number(timeoutMs)) && Number(timeoutMs) > 0
    ? setTimeout(() => controller.abort(), Number(timeoutMs))
    : null;
  let response;
  let text = "";
  try {
    response = await fetchImpl(authTestUrl, {
      method: "GET",
      headers,
      signal: controller?.signal
    });
    text = await response.text();
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createPinataMetadataError(
        `Pinata auth test timed out after ${timeoutMs}ms.`,
        "PUMP_METADATA_AUTH_TEST_FAILED",
        502,
        { cause: error }
      );
    }
    throw createPinataMetadataError(
      error?.message || "Pinata auth test failed.",
      "PUMP_METADATA_AUTH_TEST_FAILED",
      502,
      { cause: error }
    );
  } finally {
    if (timer) clearTimeout(timer);
  }

  const result = {
    ok: Boolean(response?.ok),
    status: response?.status || 0,
    bodySnippet: sanitizePinataProviderBody(text)
  };

  if (!response?.ok) {
    throw createPinataMetadataError(
      "Pinata metadata upload provider rejected authorization.",
      response?.status === 401 || response?.status === 403
        ? "PUMP_METADATA_AUTH_FAILED"
        : "PUMP_METADATA_AUTH_TEST_FAILED",
      502,
      {
        providerStatus: response?.status || 0,
        providerResponseBody: result.bodySnippet,
        authTest: result
      }
    );
  }

  return result;
}

async function readProviderJson(response) {
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
    error.providerData = data;
    throw error;
  }
  return data;
}

export async function uploadPinataFile({
  content,
  filename,
  contentType = "application/octet-stream",
  tokenValue = process.env.PUMP_LAUNCH_PINATA_JWT,
  metadataUrl = process.env.PUMP_LAUNCH_METADATA_URL || DEFAULT_PINATA_METADATA_URL,
  timeoutMs = 30000,
  fetchImpl = globalThis.fetch
} = {}) {
  assertUploadRuntime();
  const config = assertPinataConfigured({
    tokenValue,
    metadataUrl
  });
  if (typeof fetchImpl !== "function") {
    throw createPinataMetadataError(
      "Pinata upload cannot run because fetch is unavailable.",
      "PUMP_METADATA_UPLOAD_UNAVAILABLE",
      500
    );
  }
  if (content == null) {
    throw createPinataMetadataError(
      "Pinata upload content is missing.",
      "PUMP_METADATA_UPLOAD_CONTENT_MISSING",
      400
    );
  }

  const form = new FormData();
  form.append("network", "public");
  form.append("file", new Blob([content], { type: contentType }), filename || "metadata.json");

  try {
    const response = await fetchImpl(config.metadataUrl, {
      method: "POST",
      headers: config.authHeader,
      body: form,
      signal: AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined
    });
    const upload = await readProviderJson(response);
    const cid = upload?.data?.cid || upload?.cid || upload?.IpfsHash || upload?.ipfsHash || "";
    const uri = pinataPublicUriFromUpload(upload);
    if (!cid || !uri) {
      throw createPinataMetadataError(
        "Pinata upload did not return a CID.",
        "PUMP_METADATA_UPLOAD_NO_CID",
        502
      );
    }
    return {
      cid,
      uri,
      upload,
      network: "public",
      metadataUrl: config.metadataUrl
    };
  } catch (error) {
    throw pinataProviderError(error, "Pinata metadata upload failed.");
  }
}

export async function uploadImage({
  image,
  tokenValue,
  metadataUrl,
  timeoutMs,
  fetchImpl
} = {}) {
  const result = await uploadPinataFile({
    content: image?.buffer,
    filename: image?.filename || "token-image.png",
    contentType: image?.contentType || "image/png",
    tokenValue,
    metadataUrl,
    timeoutMs,
    fetchImpl
  });
  return {
    ...result,
    imageUri: result.uri,
    imageBytes: image?.buffer?.length || 0,
    imageContentType: image?.contentType || "image/png"
  };
}

export async function uploadJsonMetadata({
  metadata,
  filename = "metadata.json",
  tokenValue,
  metadataUrl,
  timeoutMs,
  fetchImpl
} = {}) {
  return uploadPinataFile({
    content: JSON.stringify(metadata || {}),
    filename,
    contentType: "application/json",
    tokenValue,
    metadataUrl,
    timeoutMs,
    fetchImpl
  });
}

export function pinataProviderError(error, fallbackMessage = "Pinata metadata upload failed.") {
  const status = Number(error?.status || error?.statusCode || error?.providerStatus || 0);
  const message = String(error?.message || fallbackMessage).replace(/\s+/g, " ").trim();
  const unauthorized = status === 401 || status === 403 || /not authorized|unauthorized|forbidden/i.test(message);
  if (!unauthorized) return error;
  return createPinataMetadataError(
    message || "Metadata upload provider rejected authorization.",
    "PUMP_METADATA_AUTH_FAILED",
    502,
    {
      cause: error,
      status,
      providerStatus: status,
      responseBody: sanitizePinataProviderBody(error?.responseBody || ""),
      providerResponseBody: sanitizePinataProviderBody(error?.responseBody || "")
    }
  );
}

export function pinataPublicUriFromUpload(upload = {}) {
  const cid = upload?.data?.cid || upload?.cid || upload?.IpfsHash || upload?.ipfsHash || "";
  return cid ? `https://ipfs.io/ipfs/${cid}` : "";
}

export function safePinataDiagnostics(value = "") {
  const diagnostics = pinataTokenDiagnostics(value);
  const {
    cleanToken,
    ...safe
  } = diagnostics;
  return safe;
}
