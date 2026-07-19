const DEFAULT_BRIDGE_BASE = "https://bridge.polymarket.com";
const SOLANA_CHAIN_ID = "1151111081099710";
const POLYGON_CHAIN_ID = "137";
const SOL_NATIVE_ADDRESS = "11111111111111111111111111111111";
const PUSD_ADDRESS = "0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB";
const EVM_ADDRESS_RE = /^0x[0-9a-f]{40}$/i;
const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const BUILDER_CODE_RE = /^0x[0-9a-f]{64}$/i;

export const POLYMARKET_SOL_BRIDGE = Object.freeze({
  solanaChainId: SOLANA_CHAIN_ID,
  polygonChainId: POLYGON_CHAIN_ID,
  solNativeAddress: SOL_NATIVE_ADDRESS,
  pUsdAddress: PUSD_ADDRESS,
  serviceFeeBps: 50
});

function positiveDecimal(value, label, max = 100_000) {
  const raw = String(value ?? "").trim();
  if (!/^(?:\d+|\d*\.\d+)$/.test(raw)) throw new Error(`Enter a valid ${label}.`);
  const number = Number(raw);
  if (!Number.isFinite(number) || number <= 0 || number > max) throw new Error(`Enter a valid ${label}.`);
  return raw;
}

function decimalToBaseUnits(value, decimals, label, max) {
  const raw = positiveDecimal(value, label, max);
  const [whole, fraction = ""] = raw.split(".");
  if (fraction.length > decimals) throw new Error(`${label} supports up to ${decimals} decimal places.`);
  return BigInt(whole || "0") * (10n ** BigInt(decimals)) + BigInt((fraction + "0".repeat(decimals)).slice(0, decimals) || "0");
}

export function solToLamportsExact(value) {
  return decimalToBaseUnits(value, 9, "SOL amount", 10_000);
}

export function pUsdToRawExact(value) {
  return decimalToBaseUnits(value, 6, "cash-out amount", 100_000_000);
}

function evmAddress(value, label = "Polymarket wallet") {
  const address = String(value || "").trim();
  if (!EVM_ADDRESS_RE.test(address)) throw new Error(`${label} is unavailable.`);
  return address;
}

function solanaAddress(value) {
  const address = String(value || "").trim();
  if (!SOLANA_ADDRESS_RE.test(address)) throw new Error("SlimeWire SOL wallet is unavailable.");
  return address;
}

function bridgeAddress(value, kind) {
  const address = String(value || "").trim();
  const valid = kind === "evm" ? EVM_ADDRESS_RE.test(address) : SOLANA_ADDRESS_RE.test(address);
  if (!valid) throw new Error("Polymarket SOL conversion address is unavailable.");
  return address;
}

function cleanQuote(value = {}) {
  const fees = value.estFeeBreakdown && typeof value.estFeeBreakdown === "object" ? value.estFeeBreakdown : {};
  return {
    quoteId: String(value.quoteId || "").slice(0, 100),
    inputUsd: Number(value.estInputUsd || 0),
    outputUsd: Number(value.estOutputUsd || 0),
    outputBaseUnits: String(value.estToTokenBaseUnit || "0"),
    minimumReceived: Number(fees.minReceived || 0),
    estimatedMs: Math.max(0, Number(value.estCheckoutTimeMs || 0)),
    providerImpactUsd: Math.max(0, Number(fees.totalImpactUsd || 0)),
    providerImpactPct: Math.max(0, Number(fees.totalImpact || 0)),
    maxSlippagePct: Math.max(0, Number(fees.maxSlippage || 0))
  };
}

function cleanTransactions(value = {}) {
  const rows = Array.isArray(value.transactions) ? value.transactions : [];
  return rows.slice(0, 100).map((row) => ({
    fromChainId: String(row?.fromChainId || ""),
    fromTokenAddress: String(row?.fromTokenAddress || ""),
    fromAmountBaseUnit: String(row?.fromAmountBaseUnit || "0"),
    toChainId: String(row?.toChainId || ""),
    toTokenAddress: String(row?.toTokenAddress || ""),
    status: String(row?.status || "").toUpperCase(),
    txHash: String(row?.txHash || "").slice(0, 120),
    createdTimeMs: Number(row?.createdTimeMs || 0)
  }));
}

export function createPolymarketBridgeService({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== "function") throw new Error("Polymarket bridge fetch is unavailable.");
  const baseUrl = String(env.POLYMARKET_BRIDGE_URL || DEFAULT_BRIDGE_BASE).trim().replace(/\/+$/, "");
  const builderCode = String(env.POLYMARKET_BUILDER_CODE || "").trim();
  let assetCache = null;

  async function request(path, { method = "GET", body } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    try {
      const headers = { Accept: "application/json" };
      if (body !== undefined) headers["Content-Type"] = "application/json";
      if (BUILDER_CODE_RE.test(builderCode) && ["/deposit", "/withdraw"].includes(path)) headers["X-Builder-Code"] = builderCode;
      const response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal
      });
      const value = await response.json().catch(() => null);
      if (!response.ok || !value || typeof value !== "object") throw new Error("provider request failed");
      return value;
    } catch {
      throw Object.assign(new Error("SOL conversion is temporarily unavailable. No funds were moved."), { statusCode: 502 });
    } finally {
      clearTimeout(timer);
    }
  }

  async function solAsset() {
    if (assetCache && Date.now() - assetCache.at < 5 * 60_000) return assetCache.value;
    const response = await request("/supported-assets");
    const assets = Array.isArray(response.supportedAssets) ? response.supportedAssets : [];
    const match = assets.find((row) => String(row?.chainId) === SOLANA_CHAIN_ID
      && String(row?.token?.symbol || "").toUpperCase() === "SOL"
      && String(row?.token?.address || "") === SOL_NATIVE_ADDRESS);
    if (!match) throw Object.assign(new Error("SOL funding is temporarily unavailable. No funds were moved."), { statusCode: 503 });
    const value = {
      chainId: SOLANA_CHAIN_ID,
      tokenAddress: SOL_NATIVE_ADDRESS,
      decimals: 9,
      minimumUsd: Math.max(0, Number(match.minCheckoutUsd || 0))
    };
    assetCache = { at: Date.now(), value };
    return value;
  }

  async function depositAddresses(polymarketWallet) {
    const wallet = evmAddress(polymarketWallet);
    const response = await request("/deposit", { method: "POST", body: { address: wallet } });
    return {
      evm: bridgeAddress(response?.address?.evm, "evm"),
      svm: bridgeAddress(response?.address?.svm, "svm")
    };
  }

  async function quoteSolDeposit({ amountSol, polymarketWallet }) {
    const wallet = evmAddress(polymarketWallet);
    const lamports = solToLamportsExact(amountSol);
    const [asset, addresses] = await Promise.all([solAsset(), depositAddresses(wallet)]);
    const quote = cleanQuote(await request("/quote", {
      method: "POST",
      body: {
        fromAmountBaseUnit: String(lamports),
        fromChainId: asset.chainId,
        fromTokenAddress: asset.tokenAddress,
        recipientAddress: wallet,
        toChainId: POLYGON_CHAIN_ID,
        toTokenAddress: PUSD_ADDRESS
      }
    }));
    if (!(quote.inputUsd >= asset.minimumUsd) || !(quote.minimumReceived > 1)) {
      throw new Error(`Enter enough SOL to fund at least $${asset.minimumUsd.toFixed(2)}.`);
    }
    return { amountSol: Number(amountSol), amountLamports: String(lamports), addresses, minimumUsd: asset.minimumUsd, quote };
  }

  async function quoteSolWithdrawal({ amountPUsd, solRecipient }) {
    const recipient = solanaAddress(solRecipient);
    const rawAmount = pUsdToRawExact(amountPUsd);
    const asset = await solAsset();
    const quote = cleanQuote(await request("/quote", {
      method: "POST",
      body: {
        fromAmountBaseUnit: String(rawAmount),
        fromChainId: POLYGON_CHAIN_ID,
        fromTokenAddress: PUSD_ADDRESS,
        recipientAddress: recipient,
        toChainId: asset.chainId,
        toTokenAddress: asset.tokenAddress
      }
    }));
    if (!(quote.inputUsd >= asset.minimumUsd) || !(quote.outputBaseUnits !== "0")) {
      throw new Error(`Cash out at least $${asset.minimumUsd.toFixed(2)}.`);
    }
    return { amountPUsd: Number(amountPUsd), amountRaw: String(rawAmount), solRecipient: recipient, minimumUsd: asset.minimumUsd, quote };
  }

  async function withdrawalAddresses({ polymarketWallet, solRecipient }) {
    const wallet = evmAddress(polymarketWallet);
    const recipient = solanaAddress(solRecipient);
    const asset = await solAsset();
    const response = await request("/withdraw", {
      method: "POST",
      body: {
        address: wallet,
        toChainId: asset.chainId,
        toTokenAddress: asset.tokenAddress,
        recipientAddr: recipient
      }
    });
    return {
      evm: bridgeAddress(response?.address?.evm, "evm"),
      svm: bridgeAddress(response?.address?.svm, "svm")
    };
  }

  async function status(address) {
    const value = String(address || "").trim();
    if (!EVM_ADDRESS_RE.test(value) && !SOLANA_ADDRESS_RE.test(value)) throw new Error("SOL conversion status address is invalid.");
    return cleanTransactions(await request(`/status/${encodeURIComponent(value)}`));
  }

  return {
    config: { serviceFeeBps: POLYMARKET_SOL_BRIDGE.serviceFeeBps },
    solAsset,
    depositAddresses,
    quoteSolDeposit,
    quoteSolWithdrawal,
    withdrawalAddresses,
    status
  };
}
