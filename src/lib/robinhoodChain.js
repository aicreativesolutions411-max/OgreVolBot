// Robinhood Chain (EVM) launch rail. Robinhood Chain is an Arbitrum-Orbit L2 (chain id 4663, gas = ETH)
// with NO pump.fun-style launchpad — so unlike the Solana rails (PumpPortal/Meteora), we deploy the
// token contract OURSELVES: a minimal fixed-supply ERC-20 (src/lib/rh-erc20.json, compiled from
// contracts/SlimeTokenRH.sol — no owner/mint/pause/blacklist, so the contract itself can't rug).
//
// Wallets: every SlimeWire wallet already holds an ed25519 keypair. We derive a deterministic
// secp256k1 (EVM) private key from the same 32-byte seed — same wallet always maps to the same
// Robinhood address, nothing new is stored, and imported wallets work too. The user funds that
// address with bridged ETH; deploys estimate gas FIRST so a broken/underfunded launch costs nothing.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";

const here = path.dirname(fileURLToPath(import.meta.url));
const artifact = JSON.parse(fs.readFileSync(path.join(here, "rh-erc20.json"), "utf8"));

export const RH_CHAIN_ID = 4663;
export const RH_DEFAULT_RPC = "https://rpc.mainnet.chain.robinhood.com";
export const RH_EXPLORER = "https://robinhoodchain.blockscout.com";

let cachedProvider = null;
let cachedProviderUrl = "";

export function rhProvider(rpcUrl = RH_DEFAULT_RPC) {
  if (!cachedProvider || cachedProviderUrl !== rpcUrl) {
    // staticNetwork: skip the chainId round-trip on every call (the chain id is fixed).
    cachedProvider = new ethers.JsonRpcProvider(rpcUrl, RH_CHAIN_ID, { staticNetwork: true });
    cachedProviderUrl = rpcUrl;
  }
  return cachedProvider;
}

// Deterministic EVM key from a Solana keypair's 32-byte seed. keccak(domain-tag || seed) is uniform
// over 2^256; re-hash in the astronomically unlikely case it falls outside the secp256k1 key range.
export function deriveEvmPrivateKey(solanaSecretKey) {
  const seed = Buffer.from(solanaSecretKey).subarray(0, 32);
  let candidate = ethers.keccak256(ethers.concat([ethers.toUtf8Bytes("slimewire-evm-v1"), seed]));
  for (let i = 0; i < 10; i += 1) {
    try {
      new ethers.SigningKey(candidate); // throws if out of range / zero
      return candidate;
    } catch {
      candidate = ethers.keccak256(candidate);
    }
  }
  throw new Error("Could not derive an EVM key from this wallet.");
}

export function evmWalletFromSolana(solanaSecretKey, rpcUrl) {
  return new ethers.Wallet(deriveEvmPrivateKey(solanaSecretKey), rhProvider(rpcUrl));
}

export function evmAddressFromSolana(solanaSecretKey) {
  return new ethers.Wallet(deriveEvmPrivateKey(solanaSecretKey)).address;
}

export async function rhEthBalance(address, rpcUrl) {
  const wei = await rhProvider(rpcUrl).getBalance(address);
  return { wei: wei.toString(), eth: ethers.formatEther(wei) };
}

export function rhExplorerAddress(address) { return `${RH_EXPLORER}/address/${address}`; }
export function rhExplorerToken(address) { return `${RH_EXPLORER}/token/${address}`; }
export function rhExplorerTx(hash) { return `${RH_EXPLORER}/tx/${hash}`; }

// Deploy the fixed-supply ERC-20. supplyTokens is whole tokens (18 decimals added here).
// Order of operations is the safety story: build tx -> estimateGas (reverts surface HERE, costing
// nothing) -> check the wallet can afford gas -> send -> wait for the receipt.
export async function rhDeployToken({ solanaSecretKey, name, symbol, supplyTokens, rpcUrl, confirmTimeoutMs = 120_000 }) {
  const cleanName = String(name || "").trim();
  const cleanSymbol = String(symbol || "").trim();
  if (!cleanName || cleanName.length > 64) throw new Error("Token name is required (max 64 chars).");
  if (!cleanSymbol || cleanSymbol.length > 12) throw new Error("Ticker is required (max 12 chars).");
  const supply = BigInt(Math.round(Number(supplyTokens) || 0));
  if (supply <= 0n || supply > 1_000_000_000_000_000n) throw new Error("Supply must be between 1 and 1,000,000,000,000,000 tokens.");

  const wallet = evmWalletFromSolana(solanaSecretKey, rpcUrl);
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const supplyWei = supply * 10n ** 18n;

  const deployTx = await factory.getDeployTransaction(cleanName, cleanSymbol, supplyWei, wallet.address);
  let gas;
  try {
    gas = await wallet.estimateGas(deployTx);
  } catch (error) {
    const msg = String(error?.shortMessage || error?.message || error);
    if (/insufficient funds/i.test(msg)) {
      const bal = await rhEthBalance(wallet.address, rpcUrl).catch(() => ({ eth: "0" }));
      const err = new Error(`Your Robinhood Chain wallet ${wallet.address} has ${bal.eth} ETH — not enough for the deploy gas. Bridge a little ETH to it (0.0005+ is plenty), then launch.`);
      err.statusCode = 400;
      throw err;
    }
    throw new Error(`Deploy simulation failed (nothing was spent): ${msg.slice(0, 300)}`);
  }

  const feeData = await wallet.provider.getFeeData();
  const gasPrice = feeData.maxFeePerGas || feeData.gasPrice || 0n;
  const estCostWei = gas * gasPrice;
  const balanceWei = BigInt((await rhEthBalance(wallet.address, rpcUrl)).wei);
  if (balanceWei < estCostWei) {
    const err = new Error(`Deploy needs ~${ethers.formatEther(estCostWei)} ETH in gas but ${wallet.address} only has ${ethers.formatEther(balanceWei)} ETH. Bridge a little more ETH, then launch.`);
    err.statusCode = 400;
    throw err;
  }

  const contract = await factory.deploy(cleanName, cleanSymbol, supplyWei, wallet.address, { gasLimit: (gas * 12n) / 10n });
  const deploymentTx = contract.deploymentTransaction();
  const receipt = await deploymentTx.wait(1, confirmTimeoutMs);
  const tokenAddress = await contract.getAddress();
  return {
    tokenAddress,
    txHash: deploymentTx.hash,
    deployer: wallet.address,
    blockNumber: receipt?.blockNumber ?? null,
    gasUsed: receipt?.gasUsed?.toString() || "",
    gasCostEth: receipt ? ethers.formatEther((receipt.gasUsed || 0n) * (receipt.gasPrice || gasPrice)) : "",
    supplyTokens: supply.toString(),
    explorerToken: rhExplorerToken(tokenAddress),
    explorerTx: rhExplorerTx(deploymentTx.hash)
  };
}

export const rhArtifactInfo = { solcVersion: artifact.solcVersion, bytecodeBytes: (artifact.bytecode.length - 2) / 2 };

// ---------- Blockscout (the chain's own explorer) — free, always-current chain data ----------
// No DexScreener/Gecko coverage for chain 4663 yet, so the coin feed comes straight from Blockscout:
// token list (name/symbol/holders/volume/mcap/icon) + per-token creation time (cached forever — it
// never changes) for the "New" ordering.
const BLOCKSCOUT = "https://robinhoodchain.blockscout.com/api/v2";
const creationTimeCache = new Map(); // tokenAddress -> ISO timestamp ("" = lookup failed, retryable)

async function bsJson(pathname, timeoutMs = 12_000) {
  const response = await fetch(`${BLOCKSCOUT}${pathname}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined
  });
  if (!response.ok) throw new Error(`Blockscout ${pathname} -> HTTP ${response.status}`);
  return response.json();
}

// All ERC-20s on the chain (paginated; the chain is young so a few pages covers it).
export async function rhListTokens(maxPages = 3) {
  const items = [];
  let params = "?type=ERC-20";
  for (let page = 0; page < maxPages; page += 1) {
    const data = await bsJson(`/tokens${params}`);
    items.push(...(data.items || []));
    const next = data.next_page_params;
    if (!next) break;
    params = `?type=ERC-20&${new URLSearchParams(next).toString()}`;
  }
  return items;
}

export async function rhTokenCreationTime(tokenAddress) {
  const cached = creationTimeCache.get(tokenAddress);
  if (cached) return cached;
  try {
    const info = await bsJson(`/addresses/${tokenAddress}`);
    const txHash = info.creation_transaction_hash || info.creation_tx_hash;
    if (!txHash) return "";
    const tx = await bsJson(`/transactions/${txHash}`);
    const ts = tx.timestamp || "";
    if (ts) creationTimeCache.set(tokenAddress, ts);
    return ts;
  } catch {
    return "";
  }
}

// ERC-20 balances a wallet holds on Robinhood Chain (Blockscout indexes them — no per-token RPC scan).
export async function rhAddressTokens(address) {
  try {
    const rows = await bsJson(`/addresses/${address}/token-balances`);
    return (Array.isArray(rows) ? rows : []).filter((r) => r?.token?.type === "ERC-20").map((r) => ({
      address: r.token.address_hash || r.token.address || "",
      name: r.token.name || "",
      symbol: r.token.symbol || "",
      decimals: Number(r.token.decimals || 18),
      iconUrl: r.token.icon_url || "",
      raw: r.value || "0",
      uiAmount: Number(ethers.formatUnits(BigInt(r.value || "0"), Number(r.token.decimals || 18)))
    }));
  } catch {
    return []; // brand-new address Blockscout hasn't seen yet -> no holdings
  }
}

// ---------- Relay (relay.link) — SOL -> ETH-on-Robinhood-Chain in one signed Solana tx ----------
// Relay supports both Solana (chain 792703809) and Robinhood Chain (4663): quote returns Solana
// instructions we sign with the user's existing wallet; Relay's solver delivers ETH to the wallet's
// derived EVM address on 4663. Live-verified 2026-06-29 (0.1 SOL -> 0.004675 ETH, ~-2.6% impact).
export const RELAY_SOLANA_CHAIN_ID = 792703809;
const RELAY_API = "https://api.relay.link";

export async function relayQuoteSolToRhEth({ solanaAddress, evmRecipient, lamports }) {
  const response = await fetch(`${RELAY_API}/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user: solanaAddress,
      recipient: evmRecipient,
      originChainId: RELAY_SOLANA_CHAIN_ID,
      destinationChainId: RH_CHAIN_ID,
      originCurrency: "11111111111111111111111111111111",
      destinationCurrency: "0x0000000000000000000000000000000000000000",
      amount: String(lamports),
      tradeType: "EXACT_INPUT"
    }),
    signal: AbortSignal.timeout ? AbortSignal.timeout(20_000) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.message) {
    throw new Error(`Relay quote failed: ${String(data.message || `HTTP ${response.status}`).slice(0, 240)}`);
  }
  const item = data.steps?.[0]?.items?.[0];
  if (!item?.data?.instructions?.length) throw new Error("Relay quote returned no Solana transaction to sign.");
  return {
    instructions: item.data.instructions,
    lookupTables: item.data.addressLookupTableAddresses || [],
    checkEndpoint: item.check?.endpoint || "",
    requestId: data.steps?.[0]?.requestId || "",
    outEth: data.details?.currencyOut?.amountFormatted || "",
    impactPercent: data.details?.totalImpact?.percent || ""
  };
}

export async function relayCheckStatus(checkEndpoint) {
  if (!checkEndpoint) return { status: "unknown" };
  const response = await fetch(`${RELAY_API}${checkEndpoint}`, {
    signal: AbortSignal.timeout ? AbortSignal.timeout(10_000) : undefined
  });
  return response.json().catch(() => ({ status: "unknown" }));
}

// Same-chain swap ON Robinhood Chain (buy: ETH -> token, sell: token -> ETH). Relay routes through the
// chain's live pools; sells come back as TWO sequential txs (ERC-20 approve, then swap) — live-verified
// both directions (0.001 ETH -> 6201 CAPTAIN; 5000 CAPTAIN -> 0.000786 ETH, ~-1.5% impact).
export async function relayQuoteRhSwap({ address, fromCurrency, toCurrency, amountRaw }) {
  const response = await fetch(`${RELAY_API}/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user: address,
      recipient: address,
      originChainId: RH_CHAIN_ID,
      destinationChainId: RH_CHAIN_ID,
      originCurrency: fromCurrency,
      destinationCurrency: toCurrency,
      amount: String(amountRaw),
      tradeType: "EXACT_INPUT"
    }),
    signal: AbortSignal.timeout ? AbortSignal.timeout(20_000) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.message) {
    const raw = String(data.message || `HTTP ${response.status}`);
    throw new Error(/no routes found/i.test(raw)
      ? "No trading route for this coin right now — its pool may be too new or too thin. Try again soon."
      : `Swap quote failed: ${raw.slice(0, 200)}`);
  }
  const txs = [];
  for (const step of data.steps || []) {
    for (const item of step.items || []) {
      const tx = item.data || {};
      if (tx.to && tx.data !== undefined) txs.push({ stepId: step.id || "", to: tx.to, data: tx.data, value: tx.value || "0" });
    }
  }
  if (!txs.length) throw new Error("Swap quote returned no transactions.");
  return {
    txs,
    outFormatted: data.details?.currencyOut?.amountFormatted || "",
    outSymbol: data.details?.currencyOut?.currency?.symbol || "",
    impactPercent: data.details?.totalImpact?.percent || ""
  };
}

// Execute Relay's EVM txs in order (approve then swap for sells). Gas is estimated per tx BEFORE
// sending, so an underfunded/broken swap costs nothing; each tx waits for its receipt so the approve
// is mined before the swap that depends on it.
export async function rhExecuteEvmSteps(solanaSecretKey, txs, rpcUrl, confirmTimeoutMs = 90_000) {
  const wallet = evmWalletFromSolana(solanaSecretKey, rpcUrl);
  const hashes = [];
  for (const tx of txs) {
    const request = { to: tx.to, data: tx.data, value: BigInt(tx.value || "0") };
    try {
      await wallet.estimateGas(request);
    } catch (error) {
      const msg = String(error?.shortMessage || error?.message || "");
      if (/insufficient funds/i.test(msg)) {
        const bal = await rhEthBalance(wallet.address, rpcUrl).catch(() => ({ eth: "0" }));
        const e = new Error(`Not enough ETH for gas on ${wallet.address} (has ${bal.eth} ETH). Fund it (Wallet → 🪶 Robinhood Chain), then trade.`);
        e.statusCode = 400;
        throw e;
      }
      const e = new Error(`Swap simulation failed (nothing was spent): ${msg.slice(0, 240)}`);
      e.statusCode = 400;
      throw e;
    }
    const sent = await wallet.sendTransaction(request);
    await sent.wait(1, confirmTimeoutMs);
    hashes.push(sent.hash);
  }
  return { hashes, address: wallet.address };
}

// ERC-20 balance straight from the chain (fresher than Blockscout's indexer for just-traded wallets).
const ERC20_MINI_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];
export async function rhErc20Balance(tokenAddress, ownerAddress, rpcUrl) {
  const contract = new ethers.Contract(tokenAddress, ERC20_MINI_ABI, rhProvider(rpcUrl));
  const [raw, decimals] = await Promise.all([contract.balanceOf(ownerAddress), contract.decimals()]);
  return { raw: raw.toString(), decimals: Number(decimals), uiAmount: Number(ethers.formatUnits(raw, decimals)) };
}
