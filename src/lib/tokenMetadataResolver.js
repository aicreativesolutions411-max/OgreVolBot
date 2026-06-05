const DEFAULT_METADATA_TTL_MS = 5 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 2_000;
const IPFS_GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/"
];

function firstString(...values) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

function normalizeMint(input = {}) {
  return firstString(input.mint, input.tokenAddress, input.tokenMint, input.address);
}

function nowIso(now = Date.now()) {
  return new Date(Number(now || Date.now())).toISOString();
}

export function cidFromIpfsUri(value = "") {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^ipfs:\/\//i.test(text)) return text.replace(/^ipfs:\/\//i, "").replace(/^ipfs\//i, "").split(/[?#]/)[0];
  const match = text.match(/\/ipfs\/([^/?#]+)/i);
  return match?.[1] || "";
}

export function uriGatewayCandidates(uri = "") {
  const clean = String(uri || "").trim();
  if (!clean) return [];
  const cid = cidFromIpfsUri(clean);
  if (!cid) return [clean];
  return [...new Set([
    /^ipfs:\/\//i.test(clean) ? "" : clean,
    ...IPFS_GATEWAYS.map((gateway) => `${gateway}${cid}`)
  ].filter(Boolean))];
}

function normalizeImageUri(value = "") {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^ipfs:\/\//i.test(text)) {
    const cid = cidFromIpfsUri(text);
    return cid ? `${IPFS_GATEWAYS[0]}${cid}` : "";
  }
  if (/^https?:\/\//i.test(text)) return text;
  return "";
}

export function metadataComplete(metadata = {}) {
  return Boolean(metadata.name && metadata.symbol && metadata.imageUri);
}

function hasAnyMetadata(metadata = {}) {
  return Boolean(metadata.name || metadata.symbol || metadata.imageUri || metadata.metadataUri);
}

function normalizeMetadata(raw = {}, source = "placeholder", warnings = []) {
  const metadataJson = raw.metadataJson || raw.metadata || raw.json || {};
  const metadataUri = firstString(raw.metadataUri, raw.metadata_uri, raw.uri, metadataJson.uri);
  const imageUri = normalizeImageUri(firstString(
    raw.imageUri,
    raw.imageUrl,
    raw.image_uri,
    raw.image,
    raw.logoURI,
    raw.logo,
    metadataJson.image,
    metadataJson.imageUri,
    metadataJson.image_url
  ));
  return {
    name: firstString(raw.name, raw.tokenName, metadataJson.name),
    symbol: firstString(raw.symbol, raw.ticker, metadataJson.symbol),
    imageUri,
    imageUrl: imageUri,
    metadataUri,
    source,
    metadataSourceUsed: source,
    confidence: raw.confidence || (source === "placeholder" ? "none" : source === "dex" ? "medium" : "high"),
    lastUpdatedAt: firstString(raw.lastUpdatedAt, raw.updatedAt, raw.completedAt, raw.createdAt),
    warnings: [...warnings, ...(Array.isArray(raw.warnings) ? raw.warnings : [])],
    marketCap: raw.marketCap || null,
    fdv: raw.fdv || null,
    priceChange: raw.priceChange || null,
    liquidityUsd: raw.liquidityUsd || null,
    volume: raw.volume || null,
    txns: raw.txns || null,
    pairCreatedAt: raw.pairCreatedAt || null,
    websiteUrl: raw.websiteUrl || "",
    twitterUrl: raw.twitterUrl || "",
    telegramUrl: raw.telegramUrl || "",
    pairAddress: raw.pairAddress || "",
    dexId: raw.dexId || "",
    dexName: raw.dexName || "",
    metadataMissing: source === "placeholder",
    dexImagePresent: Boolean(raw.dexImagePresent),
    pumpMetadataPresent: Boolean(raw.pumpMetadataPresent),
    imageFetchStatus: raw.imageFetchStatus || ""
  };
}

function mergeMetadata(primary = {}, secondary = {}) {
  const source = primary.metadataSourceUsed || primary.source || secondary.metadataSourceUsed || secondary.source || "placeholder";
  const imageUri = firstString(primary.imageUri, secondary.imageUri);
  const marketCap = primary.marketCap || secondary.marketCap || null;
  const fdv = primary.fdv || secondary.fdv || null;
  const liquidityUsd = primary.liquidityUsd || secondary.liquidityUsd || null;
  return {
    ...secondary,
    ...primary,
    name: firstString(primary.name, secondary.name),
    symbol: firstString(primary.symbol, secondary.symbol),
    imageUri,
    imageUrl: imageUri,
    metadataUri: firstString(primary.metadataUri, secondary.metadataUri),
    metadataSourceUsed: source,
    source,
    confidence: primary.confidence || secondary.confidence || "medium",
    warnings: [...(secondary.warnings || []), ...(primary.warnings || [])],
    marketCap,
    fdv,
    liquidityUsd,
    priceChange: primary.priceChange || secondary.priceChange || null,
    volume: primary.volume || secondary.volume || null,
    txns: primary.txns || secondary.txns || null,
    pairCreatedAt: primary.pairCreatedAt || secondary.pairCreatedAt || null,
    metadataMissing: source === "placeholder",
    dexImagePresent: Boolean(primary.dexImagePresent || secondary.dexImagePresent),
    pumpMetadataPresent: Boolean(primary.pumpMetadataPresent || secondary.pumpMetadataPresent),
    imageFetchStatus: firstString(primary.imageFetchStatus, secondary.imageFetchStatus)
  };
}

async function defaultFetchJson(uri, options = {}) {
  if (typeof fetch !== "function") return null;
  const timeoutMs = Number(options.timeoutMs || DEFAULT_TIMEOUT_MS);
  for (const candidate of uriGatewayCandidates(uri)) {
    try {
      const response = await fetch(candidate, {
        method: "GET",
        headers: { "Accept": "application/json,text/plain,*/*" },
        signal: AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined
      });
      const text = await response.text();
      if (!response.ok) continue;
      const json = JSON.parse(text);
      return {
        json,
        uri: candidate,
        status: response.status,
        contentType: response.headers.get("content-type") || ""
      };
    } catch {
      // Try the next gateway candidate.
    }
  }
  return null;
}

async function defaultVerifyImage(uri, options = {}) {
  if (typeof fetch !== "function") return { ok: false, status: null, uri: normalizeImageUri(uri) };
  const timeoutMs = Number(options.timeoutMs || DEFAULT_TIMEOUT_MS);
  for (const candidate of uriGatewayCandidates(uri)) {
    try {
      const response = await fetch(candidate, {
        method: "GET",
        headers: { "Accept": "image/*,*/*" },
        signal: AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined
      });
      const contentType = response.headers.get("content-type") || "";
      if (response.ok && (/^image\//i.test(contentType) || !contentType)) {
        await response.arrayBuffer().catch(() => null);
        return { ok: true, status: response.status, uri: candidate, contentType };
      }
    } catch {
      // Try the next gateway candidate.
    }
  }
  return { ok: false, status: null, uri: normalizeImageUri(uri) };
}

export class TokenMetadataResolver {
  constructor(deps = {}) {
    this.deps = {
      getSlimeWireMetadata: deps.getSlimeWireMetadata || (async () => ({})),
      getDexMetadata: deps.getDexMetadata || (async () => ({})),
      getPumpMetadata: deps.getPumpMetadata || (async () => ({})),
      getOnchainMetadata: deps.getOnchainMetadata || (async () => ({})),
      fetchMetadataJson: deps.fetchMetadataJson || defaultFetchJson,
      verifyImageUri: deps.verifyImageUri || defaultVerifyImage,
      now: deps.now || (() => Date.now()),
      log: deps.log || (() => {})
    };
    this.ttlMs = Number.isFinite(Number(deps.ttlMs)) ? Number(deps.ttlMs) : DEFAULT_METADATA_TTL_MS;
    this.cache = deps.cache || new Map();
  }

  invalidate(tokenAddress = "") {
    const mint = normalizeMint({ mint: tokenAddress });
    if (mint) this.cache.delete(mint);
  }

  clear() {
    this.cache.clear();
  }

  async resolveTokenMetadata(input = {}, options = {}) {
    const mint = normalizeMint(input);
    if (!mint) return normalizeMetadata({}, "placeholder", ["missing token mint"]);
    const force = Boolean(options.force);
    const cached = this.cache.get(mint);
    const now = Number(this.deps.now());
    if (!force && cached && now - cached.cachedAt < this.ttlMs) return cached.value;

    const warnings = [];
    const dexRaw = options.dexMetadata !== undefined
      ? options.dexMetadata
      : await this.safeGet("dex", () => this.deps.getDexMetadata(mint, options), warnings);
    let dex = normalizeMetadata({ ...(dexRaw || {}), dexImagePresent: Boolean(dexRaw?.imageUrl || dexRaw?.imageUri || dexRaw?.image) }, "dex");
    if (dex.imageUri) dex = await this.withVerifiedImage(dex, options, warnings);

    const launchRaw = await this.safeGet("slimewireLaunch", () => this.deps.getSlimeWireMetadata({ ...input, mint, tokenAddress: mint }, options), warnings);
    let launch = normalizeMetadata(launchRaw || {}, "slimewireLaunch");
    if (launch.metadataUri && !launch.imageUri) {
      launch = mergeMetadata(await this.metadataFromUri(launch.metadataUri, "slimewireLaunch", options, warnings), launch);
    }
    if (launch.imageUri) launch = await this.withVerifiedImage(launch, options, warnings);
    const isSlimeWirePump = Boolean(hasAnyMetadata(launch) && /pump|launch/i.test(String(launchRaw?.source || input.source || "")));
    if (metadataComplete(launch) && (isSlimeWirePump || !metadataComplete(dex))) {
      return this.remember(mint, mergeMetadata({ ...launch, metadataSourceUsed: "slimewireLaunch", source: "slimewireLaunch" }, dex));
    }

    if (metadataComplete(dex) && !isSlimeWirePump) {
      return this.remember(mint, { ...dex, metadataMissing: false, lastUpdatedAt: nowIso(now) });
    }

    const pumpRaw = await this.safeGet("pumpMetadata", () => this.deps.getPumpMetadata(mint, options), warnings);
    let pump = normalizeMetadata({ ...(pumpRaw || {}), pumpMetadataPresent: hasAnyMetadata(pumpRaw || {}) }, "pumpMetadata");
    if (pump.metadataUri && !pump.imageUri) {
      pump = mergeMetadata(await this.metadataFromUri(pump.metadataUri, "pumpMetadata", options, warnings), pump);
    }
    if (pump.imageUri) pump = await this.withVerifiedImage(pump, options, warnings);
    if (metadataComplete(pump)) {
      return this.remember(mint, mergeMetadata({ ...pump, metadataSourceUsed: "pumpMetadata", source: "pumpMetadata" }, mergeMetadata(launch, dex)));
    }

    const onchainRaw = await this.safeGet("onchainMetadata", () => this.deps.getOnchainMetadata(mint, options), warnings);
    let onchain = normalizeMetadata(onchainRaw || {}, "onchainMetadata");
    if (onchain.metadataUri && !onchain.imageUri) {
      onchain = mergeMetadata(await this.metadataFromUri(onchain.metadataUri, "onchainMetadata", options, warnings), onchain);
    }
    if (onchain.imageUri) onchain = await this.withVerifiedImage(onchain, options, warnings);
    if (metadataComplete(onchain)) {
      return this.remember(mint, mergeMetadata({ ...onchain, metadataSourceUsed: "onchainMetadata", source: "onchainMetadata" }, mergeMetadata(pump, mergeMetadata(launch, dex))));
    }

    const bestPartial = [launch, dex, pump, onchain].find(hasAnyMetadata) || {};
    const source = bestPartial.metadataSourceUsed || bestPartial.source || "placeholder";
    const partial = mergeMetadata(bestPartial, dex);
    const result = {
      ...partial,
      imageUri: partial.imageUri || "",
      imageUrl: partial.imageUri || "",
      metadataSourceUsed: partial.imageUri || partial.name || partial.symbol ? source : "placeholder",
      source: partial.imageUri || partial.name || partial.symbol ? source : "placeholder",
      confidence: partial.imageUri ? "low" : "none",
      metadataMissing: !partial.imageUri,
      warnings: [...warnings, ...(partial.imageUri ? [] : ["metadataMissing=true"])],
      lastUpdatedAt: nowIso(now)
    };
    return this.remember(mint, result);
  }

  async safeGet(label, fn, warnings) {
    try {
      return await fn();
    } catch (error) {
      warnings.push(`${label}: ${error?.message || "unavailable"}`.slice(0, 160));
      return {};
    }
  }

  async metadataFromUri(uri, source, options, warnings) {
    const fetched = await this.deps.fetchMetadataJson(uri, {
      timeoutMs: options.metadataTimeoutMs || options.timeoutMs || DEFAULT_TIMEOUT_MS,
      retries: options.metadataRetries ?? 1
    }).catch((error) => {
      warnings.push(`${source} metadata URI fetch failed: ${error?.message || "unavailable"}`.slice(0, 160));
      return null;
    });
    if (!fetched?.json) return normalizeMetadata({ metadataUri: uri }, source);
    const imageUri = normalizeImageUri(firstString(fetched.json.image, fetched.json.imageUri, fetched.json.image_url));
    return normalizeMetadata({
      name: fetched.json.name,
      symbol: fetched.json.symbol,
      imageUri,
      metadataUri: fetched.uri || uri,
      imageFetchStatus: fetched.status ? `metadata:${fetched.status}` : "",
      confidence: source === "slimewireLaunch" ? "high" : "medium"
    }, source === "slimewireLaunch" || source === "pumpMetadata" ? source : "ipfs");
  }

  async withVerifiedImage(metadata, options, warnings) {
    const verification = await this.deps.verifyImageUri(metadata.imageUri, {
      timeoutMs: options.imageTimeoutMs || options.timeoutMs || DEFAULT_TIMEOUT_MS,
      retries: options.imageRetries ?? 1
    }).catch((error) => {
      warnings.push(`image verify failed: ${error?.message || "unavailable"}`.slice(0, 160));
      return { ok: false, status: null };
    });
    if (verification?.ok) {
      return {
        ...metadata,
        imageUri: verification.uri || metadata.imageUri,
        imageUrl: verification.uri || metadata.imageUri,
        imageFetchStatus: String(verification.status || "ok")
      };
    }
    return {
      ...metadata,
      imageUri: "",
      imageUrl: "",
      imageFetchStatus: String(verification?.status || "unfetchable"),
      warnings: [...(metadata.warnings || []), "image unavailable"]
    };
  }

  remember(mint, metadata) {
    const value = {
      ...metadata,
      imageUrl: metadata.imageUri || metadata.imageUrl || "",
      metadataMissing: Boolean(metadata.metadataMissing),
      lastUpdatedAt: metadata.lastUpdatedAt || nowIso(this.deps.now())
    };
    this.cache.set(mint, { cachedAt: Number(this.deps.now()), value });
    try {
      this.deps.log("token_metadata_resolved", {
        tokenAddress: mint,
        metadataSourceUsed: value.metadataSourceUsed || value.source,
        imagePresent: Boolean(value.imageUri || value.imageUrl),
        metadataMissing: Boolean(value.metadataMissing),
        warningCount: value.warnings?.length || 0
      });
    } catch {
      // Metadata diagnostics must never block PnL rendering.
    }
    return value;
  }
}

export function createTokenMetadataResolver(deps = {}) {
  return new TokenMetadataResolver(deps);
}
