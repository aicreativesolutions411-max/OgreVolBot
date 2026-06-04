export const DEFAULT_PINATA_METADATA_URL = "https://uploads.pinata.cloud/v3/files";
export const DEFAULT_PINATA_AUTH_TEST_URL = "https://api.pinata.cloud/data/testAuthentication";
export const PINATA_METADATA_STAGE = "metadata_upload";

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
    cleanToken: token
  };
}

export function cleanToken(value = "") {
  return pinataTokenDiagnostics(value).cleanToken;
}

export function createPinataMetadataError(message, code, statusCode = 500, extra = {}) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.stage = PINATA_METADATA_STAGE;
  Object.assign(error, extra);
  return error;
}

export function getPinataJwt(env = process.env) {
  return cleanToken(env?.PUMP_LAUNCH_PINATA_JWT || "");
}

export function makePinataAuthHeader(tokenValue = process.env.PUMP_LAUNCH_PINATA_JWT) {
  const token = cleanToken(tokenValue);
  if (!token) {
    throw createPinataMetadataError(
      "Pinata metadata upload JWT is missing.",
      "PUMP_METADATA_CONFIG_MISSING",
      500
    );
  }
  return {
    Authorization: `Bearer ${token}`
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
    metadataUrl: endpoint,
    authHeader: makePinataAuthHeader(diagnostics.cleanToken)
  };
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
      responseBody: error?.responseBody || "",
      providerResponseBody: error?.responseBody || ""
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
