// Minimal Cloudflare R2 (S3-compatible) client — AWS Signature V4, zero dependencies.
//
// R2 gives 10GB free with ZERO egress fees, so it's the cheapest home for growing backups.
// Rather than pull in the heavy AWS SDK, this signs requests with node:crypto. The signer is
// pure + testable and is validated against AWS's own published SigV4 example in the tests, so
// we trust it before it ever touches real backups. R2 specifics: region is "auto", service is
// "s3", host is "<accountId>.r2.cloudflarestorage.com", path-style "/<bucket>/<key>".

import crypto from "node:crypto";

const sha256hex = (data) => crypto.createHash("sha256").update(data).digest("hex");
const hmac = (key, data) => crypto.createHmac("sha256", key).update(data).digest();

// Encode a path segment per AWS rules (RFC3986; keep unreserved, encode the rest). "/" is the
// separator and is preserved by encoding each segment independently.
function encodeSegment(seg) {
  return encodeURIComponent(seg).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}
function canonicalUri(path) {
  return "/" + String(path).replace(/^\/+/, "").split("/").map(encodeSegment).join("/");
}

// Build the signed headers (incl. Authorization) for one S3/R2 request. Pure: the caller
// passes amzDate/dateStamp so it's deterministic and unit-testable. `headers` are any extra
// headers to sign (lowercased keys). `payload` is the raw body (Buffer/string) — its sha256
// is both signed and sent as x-amz-content-sha256, as S3 requires.
export function buildSigV4Headers(opts) {
  const {
    method = "PUT", host, path, query = "",
    region = "auto", service = "s3",
    accessKeyId, secretKey, payload = "",
    amzDate, dateStamp, headers = {}
  } = opts;
  const payloadHash = sha256hex(payload);
  const baseHeaders = { host, "x-amz-content-sha256": payloadHash, "x-amz-date": amzDate };
  const allHeaders = {};
  for (const [k, v] of Object.entries({ ...headers, ...baseHeaders })) allHeaders[k.toLowerCase()] = String(v).trim();
  const sortedNames = Object.keys(allHeaders).sort();
  const canonicalHeaders = sortedNames.map((n) => `${n}:${allHeaders[n]}\n`).join("");
  const signedHeaders = sortedNames.join(";");

  const canonicalRequest = [method, canonicalUri(path), query, canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256hex(canonicalRequest)].join("\n");
  const kDate = hmac("AWS4" + secretKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return { ...allHeaders, authorization, _signature: signature, _signedHeaders: signedHeaders };
}

// PUT an object to R2. cfg = { accountId, accessKeyId, secretAccessKey, bucket }. Returns
// { ok, status, key }. Throws on network error; non-2xx returns ok:false with the status.
export async function r2PutObject(cfg, key, body, contentType = "application/octet-stream", deps = {}) {
  const fetchImpl = deps.fetch || globalThis.fetch;
  const now = deps.now ? new Date(deps.now) : new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ""); // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);
  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const path = `/${cfg.bucket}/${key}`;
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  const signed = buildSigV4Headers({
    method: "PUT", host, path,
    accessKeyId: cfg.accessKeyId, secretKey: cfg.secretAccessKey,
    payload, amzDate, dateStamp,
    headers: { "content-type": contentType }
  });
  const res = await fetchImpl(`https://${host}${path}`, {
    method: "PUT",
    headers: { ...signed, "content-type": contentType, "content-length": String(payload.length) },
    body: payload
  });
  return { ok: res.ok, status: res.status, key };
}

export function r2Configured(cfg) {
  return Boolean(cfg && cfg.accountId && cfg.accessKeyId && cfg.secretAccessKey && cfg.bucket);
}
