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
const sushiLaunchArtifact = JSON.parse(fs.readFileSync(path.join(here, "rh-sushi-launch.json"), "utf8"));

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

// Robinhood launcher tokens are EIP-1167 clones whose exact artwork metadata is exposed by
// DropERC20.contractURI(). Market/explorer indexes often omit that image, especially for new coins,
// so this address-keyed on-chain read is the authoritative fallback for site and Telegram PFPs.
export async function rhTokenContractUri(address, rpcUrl, timeoutMs = 2_000) {
  const token = ethers.getAddress(String(address || "").trim());
  const contract = new ethers.Contract(token, ["function contractURI() view returns (string)"], rhProvider(rpcUrl));
  let timeout;
  try {
    const uri = await Promise.race([
      contract.contractURI(),
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Robinhood contract metadata timed out")), Math.max(500, Number(timeoutMs) || 2_000));
      })
    ]);
    const clean = String(uri || "").trim();
    return /^(?:ipfs|https?):\/\//i.test(clean) ? clean.slice(0, 1_000) : "";
  } finally {
    clearTimeout(timeout);
  }
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

// Official Sushi deployments for Robinhood Chain. These are intentionally kept
// separate from RH_UNIV3 below: Robinhood has both Uniswap and Sushi V3 venues,
// and silently treating one as the other produced the wrong pool destination.
// Source: Sushi's published `sushi` package (evm/config/features, chain 4663).
export const RH_SUSHI = Object.freeze({
  launchFactory: "0xd611FEca4504dAa1Ab09fa36AD20F0C4153C24FA",
  v3Factory: "0xe51960f1b45f1c9fb6d166e6a884f866fc70433b",
  v3PositionManager: "0x51d0e5188afe12d502e29d982d20c190e7816107",
  v3Quoter: "0x3e290e5e01818002a0b672148bdc7514d861c7b3",
  v3SwapRouter: "0x1e406484f1f204b23ce84b9901c0171a738fd406",
  v2Factory: "0xe52abd50ad151ecdf56427effd715e703696a6b1",
  v2Router: "0x9a55d3d0c0f09859c7869510f53ed0a30b340766",
  weth: "0x0bd7d308f8e1639fab988df18a8011f41eacad73",
  fee: 10_000,
  tickSpacing: 200,
  poolUrl: "https://www.sushi.com/robinhood/pool",
  quoteApi: `https://api.sushi.com/quote/v7/${RH_CHAIN_ID}`,
});

const RH_SUSHI_MAX_USABLE_TICK = 887_200;
const RH_SUSHI_MIN_USABLE_TICK = -887_200;
const sushiFactoryArtifact = sushiLaunchArtifact.contracts.SlimeSushiLaunchFactoryRH;
const sushiTokenArtifact = sushiLaunchArtifact.contracts.SlimeSushiTokenRH;
const sushiLockerArtifact = sushiLaunchArtifact.contracts.SlimeSushiPositionLockerRH;

function normalizedEvmAddress(value) {
  const clean = String(value || "").trim();
  return /^0x[0-9a-fA-F]{40}$/.test(clean) ? ethers.getAddress(clean) : "";
}

/** Convert a desired starting market cap into a Sushi V3, 1%-fee aligned tick. */
export function rhSushiInitialTick({ marketCapUsd = 5_000, supplyTokens = 1_000_000_000, ethUsd }) {
  const marketCap = Number(marketCapUsd);
  const supply = Number(supplyTokens);
  const ethPrice = Number(ethUsd);
  if (!(marketCap > 0) || !(supply > 0) || !(ethPrice > 0)) throw new Error("Starting market cap, supply, and ETH price must be positive.");
  const wethPerToken = marketCap / supply / ethPrice;
  const rawTick = Math.log(wethPerToken) / Math.log(1.0001);
  const aligned = Math.round(rawTick / RH_SUSHI.tickSpacing) * RH_SUSHI.tickSpacing;
  return Math.max(RH_SUSHI_MIN_USABLE_TICK, Math.min(RH_SUSHI_MAX_USABLE_TICK - RH_SUSHI.tickSpacing, aligned));
}

/**
 * Pick a deterministic CREATE2 salt whose token address sorts below WETH.
 * That ordering is what lets the launch contract put 100% of supply into an
 * active, one-sided rising-price position without creator-supplied liquidity.
 */
export function rhFindSushiLaunchSalt({ factoryAddress, name, symbol, supplyTokens, contractUri = "", maxAttempts = 2_048 }) {
  const factory = normalizedEvmAddress(factoryAddress);
  if (!factory) throw new Error("RH Sushi launch factory address is not configured.");
  const supply = BigInt(String(supplyTokens || 0)) * 10n ** 18n;
  if (supply <= 0n) throw new Error("Supply must be positive.");
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ["string", "string", "uint256", "string"],
    [String(name || "").trim(), String(symbol || "").trim(), supply, String(contractUri || "")]
  );
  const initCodeHash = ethers.keccak256(ethers.concat([sushiTokenArtifact.bytecode, encoded]));
  const weth = BigInt(RH_SUSHI.weth);
  for (let i = 0; i < Math.max(1, Number(maxAttempts) || 2_048); i += 1) {
    const salt = ethers.keccak256(ethers.toUtf8Bytes(`slimewire-sushi-rh:${i}`));
    const tokenAddress = ethers.getCreate2Address(factory, salt, initCodeHash);
    if (BigInt(tokenAddress) < weth) return { salt, tokenAddress, attempts: i + 1, supplyWei: supply };
  }
  throw new Error("Could not derive a valid launch address. Change the ticker or try again.");
}

export function rhSushiLaunchConfigured(factoryAddress) {
  return Boolean(normalizedEvmAddress(factoryAddress));
}

/** Atomic token + Sushi V3 market creation through the audited-to-deploy factory artifact. */
export async function rhLaunchTokenOnSushi({
  solanaSecretKey,
  factoryAddress,
  name,
  symbol,
  supplyTokens = 1_000_000_000,
  contractUri = "",
  initialMarketCapUsd = 5_000,
  ethUsd,
  rpcUrl,
  confirmTimeoutMs = 180_000,
}) {
  const factory = normalizedEvmAddress(factoryAddress);
  if (!factory) throw new Error("Automatic Sushi launches are not enabled yet.");
  const cleanName = String(name || "").trim();
  const cleanSymbol = String(symbol || "").trim();
  if (!cleanName || cleanName.length > 64) throw new Error("Token name is required (max 64 chars).");
  if (!cleanSymbol || cleanSymbol.length > 12) throw new Error("Ticker is required (max 12 chars).");
  const supplyWhole = BigInt(Math.round(Number(supplyTokens) || 0));
  if (supplyWhole <= 0n || supplyWhole > 1_000_000_000_000_000n) throw new Error("Supply must be between 1 and 1,000,000,000,000,000 tokens.");
  const wallet = evmWalletFromSolana(solanaSecretKey, rpcUrl);
  const code = await wallet.provider.getCode(factory);
  if (!code || code === "0x") throw new Error("The configured Sushi launch factory is not deployed on Robinhood Chain.");
  const launch = new ethers.Contract(factory, sushiFactoryArtifact.abi, wallet);
  const { salt, tokenAddress, attempts, supplyWei } = rhFindSushiLaunchSalt({
    factoryAddress: factory,
    name: cleanName,
    symbol: cleanSymbol,
    supplyTokens: supplyWhole,
    contractUri,
  });
  const initialTick = rhSushiInitialTick({ marketCapUsd: initialMarketCapUsd, supplyTokens: supplyWhole, ethUsd });
  const launchFeeWei = BigInt(await launch.launchFeeWei());
  const txArgs = [cleanName, cleanSymbol, supplyWei, String(contractUri || ""), initialTick, wallet.address, salt];
  let gas;
  try {
    gas = await launch.launch.estimateGas(...txArgs, { value: launchFeeWei });
  } catch (error) {
    const message = String(error?.shortMessage || error?.reason || error?.message || error);
    throw new Error(`Automatic Sushi launch simulation failed (nothing was spent): ${message.slice(0, 300)}`);
  }
  const feeData = await wallet.provider.getFeeData();
  const gasPrice = feeData.maxFeePerGas || feeData.gasPrice || 0n;
  const required = launchFeeWei + gas * gasPrice;
  const balance = await wallet.provider.getBalance(wallet.address);
  if (balance < required) {
    const err = new Error(`Automatic launch needs about ${ethers.formatEther(required)} ETH for its fee and gas, but this wallet has ${ethers.formatEther(balance)} ETH.`);
    err.statusCode = 400;
    throw err;
  }
  const tx = await launch.launch(...txArgs, { value: launchFeeWei, gasLimit: (gas * 13n) / 10n });
  const receipt = await tx.wait(1, confirmTimeoutMs);
  let event = null;
  for (const log of receipt?.logs || []) {
    try {
      const parsed = launch.interface.parseLog(log);
      if (parsed?.name === "TokenLaunched") { event = parsed.args; break; }
    } catch { /* another contract's log */ }
  }
  const pool = event?.pool || "";
  const tokenId = event?.tokenId != null ? event.tokenId.toString() : "";
  const locker = await launch.locker().catch(() => "");
  return {
    tokenAddress,
    pool,
    tokenId,
    locker,
    txHash: tx.hash,
    deployer: wallet.address,
    blockNumber: receipt?.blockNumber ?? null,
    gasUsed: receipt?.gasUsed?.toString() || "",
    gasCostEth: receipt ? ethers.formatEther((receipt.gasUsed || 0n) * (receipt.gasPrice || gasPrice)) : "",
    launchFeeEth: ethers.formatEther(launchFeeWei),
    supplyTokens: supplyWhole.toString(),
    initialTick,
    saltAttempts: attempts,
    venue: "sushiswap-v3",
    liquidityLocked: true,
    explorerToken: rhExplorerToken(tokenAddress),
    explorerTx: rhExplorerTx(tx.hash),
    sushiPoolUrl: RH_SUSHI.poolUrl,
  };
}

/**
 * Collect the trading fees earned by one permanently locked Sushi V3 launch
 * position. The locker contract sends both assets directly to the creator; the
 * caller cannot redirect them. We still require the managed wallet to be the
 * recorded creator so SlimeWire never spends a user's gas on someone else's
 * position.
 */
export async function rhCollectSushiPositionFees({
  solanaSecretKey,
  lockerAddress,
  tokenId,
  rpcUrl,
  confirmTimeoutMs = 120_000,
}) {
  const locker = normalizedEvmAddress(lockerAddress);
  if (!locker) throw new Error("The Sushi fee locker address is missing or invalid.");
  let positionId;
  try { positionId = BigInt(String(tokenId)); }
  catch { throw new Error("The Sushi liquidity position id is invalid."); }
  if (positionId < 0n) throw new Error("The Sushi liquidity position id is invalid.");

  const wallet = evmWalletFromSolana(solanaSecretKey, rpcUrl);
  const code = await wallet.provider.getCode(locker);
  if (!code || code === "0x") throw new Error("The Sushi fee locker is not deployed on Robinhood Chain.");
  const contract = new ethers.Contract(locker, sushiLockerArtifact.abi, wallet);
  const creator = normalizedEvmAddress(await contract.creatorOf(positionId));
  if (!creator) throw new Error("This Sushi position is not registered with a creator.");
  if (creator.toLowerCase() !== wallet.address.toLowerCase()) {
    throw new Error("This managed wallet is not the creator of that Sushi position.");
  }

  const preview = await contract.collectFees.staticCall(positionId);
  const preview0 = BigInt(preview?.[0] || 0);
  const preview1 = BigInt(preview?.[1] || 0);
  if (preview0 === 0n && preview1 === 0n) {
    return { ok: true, claimed: false, creator, tokenId: positionId.toString(), amount0: "0", amount1: "0", txHash: "" };
  }

  let gas;
  try { gas = await contract.collectFees.estimateGas(positionId); }
  catch (error) {
    const message = String(error?.shortMessage || error?.reason || error?.message || error);
    throw new Error(`Sushi fee collection simulation failed (nothing was spent): ${message.slice(0, 300)}`);
  }
  const feeData = await wallet.provider.getFeeData();
  const gasPrice = feeData.maxFeePerGas || feeData.gasPrice || 0n;
  const required = gas * gasPrice;
  const balance = await wallet.provider.getBalance(wallet.address);
  if (balance < required) {
    const error = new Error(`The creator wallet needs about ${ethers.formatEther(required)} ETH to collect its Sushi fees, but has ${ethers.formatEther(balance)} ETH.`);
    error.statusCode = 400;
    throw error;
  }

  const tx = await contract.collectFees(positionId, { gasLimit: (gas * 13n) / 10n });
  const receipt = await tx.wait(1, confirmTimeoutMs);
  let amount0 = preview0;
  let amount1 = preview1;
  for (const log of receipt?.logs || []) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === "FeesCollected") {
        amount0 = BigInt(parsed.args?.amount0 || 0);
        amount1 = BigInt(parsed.args?.amount1 || 0);
        break;
      }
    } catch { /* another contract's log */ }
  }
  return {
    ok: true,
    claimed: amount0 > 0n || amount1 > 0n,
    creator,
    tokenId: positionId.toString(),
    amount0: amount0.toString(),
    amount1: amount1.toString(),
    txHash: tx.hash,
    explorerTx: rhExplorerTx(tx.hash),
  };
}

// Uniswap V3 is the DEX on Robinhood Chain. To make a freshly-launched coin BUYABLE we create a
// TOKEN/WETH pool (1% fee) and seed it with the creator's ETH + tokens. Addresses read off-chain.
export const RH_UNIV3 = {
  factory: "0x1f7d7550B1b028f7571E69A784071F0205FD2EfA",
  positionManager: "0x73991a25C818Bf1f1128dEAaB1492D45638DE0D3",
  swapRouter: "0xCaf681a66D020601342297493863E78C959E5cb2",
  quoterV2: "0x33e885eD0Ec9bF04EcfB19341582aADCb4c8A9E7",
  weth: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",
  fee: 10000, tickSpacing: 200,
};
function rhBigintSqrt(v) { if (v < 0n) throw new Error("neg"); if (v < 2n) return v; let x0 = v, x1 = (v >> 1n) + 1n; while (x1 < x0) { x0 = x1; x1 = (x1 + v / x1) >> 1n; } return x0; }

// Create + seed a Uniswap V3 pool so the coin can be bought right away. Initial price = the ETH:token
// ratio you provide. Full-range position. Gas-estimated BEFORE sending — a bad setup reverts in
// simulation and costs nothing. Returns the tx hash + the pool once mined.
export async function rhCreatePoolAndSeed({ solanaSecretKey, tokenAddress, ethAmount, tokenAmount, rpcUrl, confirmTimeoutMs = 150_000 }) {
  const wallet = evmWalletFromSolana(solanaSecretKey, rpcUrl);
  const PM = RH_UNIV3.positionManager, WETH = RH_UNIV3.weth, FEE = RH_UNIV3.fee, TS = RH_UNIV3.tickSpacing;
  const ethWei = ethers.parseEther(String(ethAmount || "0"));
  const tokWei = ethers.parseUnits(String(tokenAmount || "0"), 18);
  if (ethWei <= 0n || tokWei <= 0n) throw new Error("Enter both an ETH amount and a token amount to seed the pool.");

  const token = ethers.getAddress(String(tokenAddress));
  const tokenIsToken0 = token.toLowerCase() < WETH.toLowerCase();
  const token0 = tokenIsToken0 ? token : WETH;
  const token1 = tokenIsToken0 ? WETH : token;
  const amount0 = tokenIsToken0 ? tokWei : ethWei;
  const amount1 = tokenIsToken0 ? ethWei : tokWei;
  const sqrtPriceX96 = rhBigintSqrt((amount1 << 192n) / amount0);   // sqrt(price)·2^96
  const tickUpper = Math.floor(887272 / TS) * TS, tickLower = -tickUpper; // full range, spacing-aligned

  const pmIface = new ethers.Interface([
    "function createAndInitializePoolIfNecessary(address token0, address token1, uint24 fee, uint160 sqrtPriceX96) payable returns (address pool)",
    "function mint((address token0,address token1,uint24 fee,int24 tickLower,int24 tickUpper,uint256 amount0Desired,uint256 amount1Desired,uint256 amount0Min,uint256 amount1Min,address recipient,uint256 deadline)) payable returns (uint256 tokenId,uint128 liquidity,uint256 amount0,uint256 amount1)",
    "function refundETH() payable",
    "function multicall(bytes[] data) payable returns (bytes[] results)",
  ]);
  const erc = new ethers.Contract(token, ["function approve(address,uint256) returns (bool)", "function allowance(address,address) view returns (uint256)"], wallet);

  // 1) Approve the position manager to pull exactly the seed tokens (if not already).
  const allowance = await erc.allowance(wallet.address, PM).catch(() => 0n);
  if (allowance < tokWei) { const a = await erc.approve(PM, tokWei); await a.wait(1, confirmTimeoutMs); }

  // 2) create+init pool + mint the full-range position + refund leftover ETH, in ONE multicall. The ETH we
  //    send is wrapped to WETH by the periphery for the WETH side of the position.
  const deadline = Math.floor(Date.now() / 1000) + 1800;
  const mintParams = { token0, token1, fee: FEE, tickLower, tickUpper, amount0Desired: amount0, amount1Desired: amount1, amount0Min: 0n, amount1Min: 0n, recipient: wallet.address, deadline };
  const calls = [
    pmIface.encodeFunctionData("createAndInitializePoolIfNecessary", [token0, token1, FEE, sqrtPriceX96]),
    pmIface.encodeFunctionData("mint", [mintParams]),
    pmIface.encodeFunctionData("refundETH", []),
  ];
  const data = pmIface.encodeFunctionData("multicall", [calls]);
  const txReq = { to: PM, data, value: ethWei };
  let gas;
  try { gas = await wallet.estimateGas(txReq); }
  catch (e) {
    const msg = String(e?.shortMessage || e?.message || e);
    if (/insufficient funds/i.test(msg)) throw Object.assign(new Error(`Not enough ETH — you need the ${ethAmount} ETH to seed + a little gas. Bridge more, then try again.`), { statusCode: 400 });
    throw new Error(`Pool seed simulation failed (nothing was spent): ${msg.slice(0, 300)}`);
  }
  const tx = await wallet.sendTransaction({ ...txReq, gasLimit: (gas * 13n) / 10n });
  const receipt = await tx.wait(1, confirmTimeoutMs);
  // Resolve the pool address from the factory.
  let pool = "";
  try {
    const fac = new ethers.Contract(RH_UNIV3.factory, ["function getPool(address,address,uint24) view returns (address)"], wallet.provider);
    pool = await fac.getPool(token0, token1, FEE);
  } catch { /* best effort */ }
  return {
    ok: true, txHash: tx.hash, pool, tokenAddress: token, deployer: wallet.address,
    ethSeeded: ethers.formatEther(ethWei), tokenSeeded: String(tokenAmount),
    gasCostEth: receipt ? ethers.formatEther((receipt.gasUsed || 0n) * (receipt.gasPrice || 0n)) : "",
    explorerTx: rhExplorerTx(tx.hash),
  };
}

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

export async function rhTokenInfo(tokenAddress) {
  const a = String(tokenAddress || "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(a)) return null;
  try {
    return await bsJson(`/tokens/${a}`, 6_000);
  } catch {
    return null;
  }
}

// The shared "rug-as-a-service" drain controller (see rhHoneypotCheck). Exported so the feed can build a
// bulk scam-token exclusion set from it without a per-coin scan.
export const RH_DRAIN_CONTROLLER = "0x2D7aA179B485D25FE89f8E1B26b9f3CC2668f615";

// Enumerate the whole drain operation cheaply: the controller's callers ARE the scam operators, and each
// operator's contract-creation txs (to === null, created_contract set) ARE their rug tokens. Returns the
// operator wallets + the full set of token addresses they deployed — a definitive block-list for the feed.
export async function rhScamTokenSet({ controller = RH_DRAIN_CONTROLLER, operatorPages = 8, deployPages = 3 } = {}) {
  const operators = new Set();
  let params = "";
  for (let p = 0; p < operatorPages; p += 1) {
    const d = await bsJson(`/addresses/${controller}/transactions${params}`).catch(() => ({}));
    for (const t of (d.items || [])) { const f = ((t.from || {}).hash || "").toLowerCase(); if (f) operators.add(f); }
    if (!d.next_page_params) break;
    params = `?${new URLSearchParams(d.next_page_params).toString()}`;
  }
  const tokens = new Set();
  for (const op of operators) {
    let pr = "";
    for (let p = 0; p < deployPages; p += 1) {
      const d = await bsJson(`/addresses/${op}/transactions${pr}`).catch(() => ({}));
      for (const t of (d.items || [])) {
        const created = ((t.created_contract || {}).hash || "").toLowerCase();
        if (created) tokens.add(created);
      }
      if (!d.next_page_params) break;
      pr = `?${new URLSearchParams(d.next_page_params).toString()}`;
    }
  }
  return { operators: [...operators], tokens: [...tokens] };
}

// FRESHNESS source: Blockscout's /tokens is sorted by holders, so brand-new coins (1-5 holders) sit at
// the very bottom and never surface. The GLOBAL token-transfers feed is time-ordered, so a coin's first
// buys appear here the moment it launches — this is how we catch launches the holder-list misses. The
// embedded `token` object carries full metadata (holders/supply/volume/icon), so no extra call per token.
export async function rhRecentActiveTokens(maxPages = 2) {
  const seen = new Map(); // addrLc -> token item (first/most-recent wins)
  let params = "?type=ERC-20";
  for (let page = 0; page < maxPages; page += 1) {
    const data = await bsJson(`/token-transfers${params}`).catch(() => ({}));
    for (const t of (data.items || [])) {
      const tk = t.token || {};
      const addr = String(tk.address_hash || tk.address || "").toLowerCase();
      if (!addr || (tk.type && tk.type !== "ERC-20")) continue;
      if (!seen.has(addr)) seen.set(addr, { ...tk, address_hash: tk.address_hash || tk.address, lastActiveAt: t.timestamp });
    }
    const next = data.next_page_params;
    if (!next) break;
    params = `?type=ERC-20&${new URLSearchParams(next).toString()}`;
  }
  return [...seen.values()];
}

// Per-wallet DRAIN audit: for every token this wallet has received, compare net-received (sum of
// Transfer events) to the actual on-chain balanceOf. If a coin's contract silently reduced the balance
// with NO sale (held << received and the wallet never sold), that's a rug/clawback — flag it red. This
// is the honest, reliable detector for "I saw my coins then they vanished": it measures the RESULT.
export async function rhWalletTokenAudit(evmAddress, rpcUrl) {
  const provider = rhProvider(rpcUrl);
  const me = evmAddress.toLowerCase();
  const erc = new ethers.Contract("0x0000000000000000000000000000000000000000", ["function balanceOf(address) view returns (uint256)"], provider);
  // Sum received/sent per token; keep the OUTGOING tx hashes so we can tell a real sale (you signed it)
  // from a drain (someone else moved your tokens via a backdoor/allowance — the MAXI class).
  const perToken = new Map(); // addrLc -> { address, symbol, decimals, recv, sent, outTx:[{hash,value}] }
  let path = `/addresses/${evmAddress}/token-transfers?type=ERC-20`, pages = 0;
  while (path && pages < 4) {
    const data = await bsJson(path).catch(() => ({}));
    for (const t of (data.items || [])) {
      const tk = t.token || {}; const addr = (tk.address_hash || tk.address || "").toLowerCase();
      if (!addr) continue;
      const dec = Number((t.total || {}).decimals || tk.decimals || 18);
      const v = BigInt((t.total || {}).value || "0");
      const to = ((t.to || {}).hash || "").toLowerCase();
      const row = perToken.get(addr) || { address: tk.address_hash || tk.address, symbol: tk.symbol || "", decimals: dec, recv: 0n, sent: 0n, outTx: [] };
      if (to === me) row.recv += v; else { row.sent += v; const h = t.transaction_hash || t.tx_hash; if (h) row.outTx.push({ hash: h, value: v }); }
      perToken.set(addr, row);
    }
    const n = data.next_page_params;
    path = n ? `/addresses/${evmAddress}/token-transfers?type=ERC-20&${new URLSearchParams(n)}` : null;
    pages++;
  }
  const out = [];
  for (const [addr, row] of perToken) {
    if (row.recv <= 0n) continue;
    let bal = 0n;
    try { bal = await erc.attach(addr).balanceOf(evmAddress); } catch { continue; }
    const recvUi = Number(row.recv) / 10 ** row.decimals;      // GROSS received (what you bought in)
    const heldUi = Number(bal) / 10 ** row.decimals;
    const heldPct = recvUi > 0 ? heldUi / recvUi : 1;
    if (heldPct >= 0.7) continue;                               // you still hold most of it — nothing to flag
    // You hold far less than you bought. Was it a real SALE (you signed the send) or a DRAIN (a bot moved
    // it)? Check who signed the outgoing transfers — any outflow NOT signed by you = seized.
    let seizedValue = 0n;
    for (const o of row.outTx.slice(0, 5)) {
      try {
        const tx = await bsJson(`/transactions/${o.hash}`).catch(() => ({}));
        const signer = ((tx.from || {}).hash || "").toLowerCase();
        if (signer && signer !== me) seizedValue += o.value;   // someone else moved your tokens = theft
      } catch { /* skip */ }
    }
    // What you ACTUALLY authorized to leave (your own signed sends). Anything missing beyond that —
    // whether seized in a visible transfer (MAXI) or vanished with no transfer at all (BRODIE's invisible
    // rebase) — is a drain. A genuine sale you signed leaves expected≈0 and is never flagged.
    const authorizedOut = row.sent - seizedValue;
    const expected = row.recv - authorizedOut;                 // what should still be in your wallet
    const drained = expected > 0n && bal * 10n < expected * 7n; // you hold <70% of what you never sold
    out.push({ address: row.address, symbol: row.symbol, received: recvUi, held: heldUi, heldPct: Math.round(heldPct * 1000) / 1000, drained, seized: seizedValue > 0n, lostPct: Math.round((1 - heldPct) * 100) });
  }
  return { ok: true, tokens: out };
}

// ---------- Pre-buy safety scan (honeypot guard) ----------
// No checker is perfect — a token whose owner rugs holders LATER (like a rebase/clawback) can't be
// caught before you buy; that's true of every honeypot detector. What this DOES catch, with a REAL
// on-chain execution sim (not an off-chain quote): (1) can't-sell honeypots — simulate a transfer from
// a real holder; if it reverts, the token blocks moving/selling → BLOCK. (2) custom transfer code —
// tokens that run extra logic on every transfer (fees/rebase/clawback) burn far more gas; flag them.
// (3) concentration — one wallet holding most of supply can dump on you. Verdict: block | warn | ok.
const SIMPLE_TRANSFER_GAS = 40_000; // a plain ERC-20 transfer; well above this = extra hooks on transfer
const safetyCache = new Map(); // addrLc -> { at, result }

export async function rhHoneypotCheck(tokenAddress, rpcUrl) {
  const key = String(tokenAddress).toLowerCase();
  const cached = safetyCache.get(key);
  if (cached && Date.now() - cached.at < 300_000) return cached.result;
  const reasons = [];
  let sellable = null; let transferGas = null; let holders = null; let topPct = null; let ownerRenounced = null;

  // VERIFIED-SAFE tier: if the coin's on-chain runtime bytecode EXACTLY matches our SlimeTokenRH
  // (fixed supply, no owner, no mint, no fees, no reflection), it is provably unruggable — there is no
  // code path that can alter balances or block sells. This is the ONLY "100% safe" category; nothing
  // heuristic can match it. All SlimeWire-launched RH coins deploy this exact contract.
  try {
    const code = (await rhProvider(rpcUrl).getCode(tokenAddress)).toLowerCase();
    if (code && code.length > 2 && code === String(artifact.deployedBytecode || "").toLowerCase()) {
      const result = { ok: true, verdict: "verified", sellable: true, verifiedSafe: true, ownerRenounced: true, holders: null, topPct: null, transferGas: null, reasons: ["SlimeWire fixed-supply contract — no owner, no mint, no fees, no reflection: it cannot rug"] };
      safetyCache.set(key, { at: Date.now(), result });
      return result;
    }
  } catch { /* fall through to heuristic scan */ }

  // Ownership: owner()==0x0 means the owner can't call onlyOwner rug functions (mint/pause/blacklist)
  // anymore. A GOOD signal — but NOT a guarantee (a renounced coin still drained a user via non-owner
  // transfer logic), so we surface it, never rely on it alone.
  try {
    const provider = rhProvider(rpcUrl);
    const iface = new ethers.Interface(["function owner() view returns (address)"]);
    const raw = await provider.call({ to: tokenAddress, data: iface.encodeFunctionData("owner", []) });
    if (raw && raw !== "0x") {
      const owner = ethers.getAddress("0x" + raw.slice(-40));
      ownerRenounced = owner === "0x0000000000000000000000000000000000000000";
    }
  } catch { /* no owner() — leave null */ }

  // Holders + total supply. NOTE: gas is NOT used as a risk signal — EVERY token on this chain (incl.
  // Robinhood's own legit stock tokens) is a proxy that burns ~79k per transfer, so a gas threshold
  // flagged everything. We judge by what actually matters: can you sell, and do holders keep their bag.
  let holderList = [];
  try {
    const hs = await bsJson(`/tokens/${tokenAddress}/holders`);
    holderList = hs.items || [];
    const tk = await bsJson(`/tokens/${tokenAddress}`).catch(() => ({}));
    holders = Number(tk.holders_count || 0) || null;
    // Concentration by the top NON-CONTRACT holder (the #1 is usually the LP pair / treasury — exclude it).
    const topWallet = holderList.find((h) => h.address && !h.address.is_contract);
    if (tk.total_supply && topWallet && Number(BigInt(tk.total_supply)) > 0) {
      topPct = Math.round((Number(BigInt(topWallet.value || "0")) / Number(BigInt(tk.total_supply))) * 100);
    }
  } catch { /* Blockscout hiccup — sim still runs if we have a holder */ }
  const holderAddr = ((holderList[0] || {}).address || {}).hash || "";

  // (1) SELL-SIM: can a real holder actually move the token? transfer(dead,1) via eth_call. Revert =
  // the token blocks transfers → un-sellable honeypot → BLOCK. This is the strongest, cleanest signal.
  if (holderAddr) {
    const provider = rhProvider(rpcUrl);
    const iface = new ethers.Interface(["function transfer(address,uint256) returns (bool)"]);
    const data = iface.encodeFunctionData("transfer", ["0x000000000000000000000000000000000000dEaD", 1n]);
    try {
      await provider.call({ from: holderAddr, to: tokenAddress, data });
      transferGas = Number(await provider.estimateGas({ from: holderAddr, to: tokenAddress, data }).catch(() => 0));
      sellable = true;
    } catch {
      sellable = false;
      reasons.push("a real holder can't even transfer this token — sells are blocked (honeypot)");
    }
  }

  // (2a) DEPLOYER DRAIN DETECTION — the decisive signal. Two mechanisms seen on this chain, both caught
  // by reading the token creator's OWN transaction history:
  //   • DRAIN-SERVICE (the big one): a "rug-as-a-service" — one shared controller contract that 16+ scam
  //     operators funnel their tokens through. Seconds after you buy, the deployer calls the controller
  //     (selector 0x73ed6b13) with your address and your balanceOf is silently emptied — NO Transfer
  //     event, so explorers & transfer-based checks never see it. HOODCAT and BRODIE were the same op.
  //   • transferFrom BACKDOOR: the deployer calls transferFrom to physically SEIZE tokens from a holder
  //     who never approved them (visible, but still a rug). HOODCAT also did this.
  // Any deployer that touches the drain service, or seizes from a real wallet, is a rug → BLOCK.
  const DRAIN_CONTROLLERS = new Set(["0x2d7aa179b485d25fe89f8e1b26b9f3cc2668f615"]); // shared balance-drain service
  const DRAIN_SELECTOR = "0x73ed6b13";                                               // the drain call
  let backdoor = false, backdoorProven = false, drainService = false;
  try {
    const meta = await bsJson(`/addresses/${tokenAddress}`).catch(() => ({}));
    const creator = String(meta.creator_address_hash || "").toLowerCase();
    if (creator) {
      // Scan several pages of the creator's history — an active operator has many txs and a drain call
      // can be buried past page 1. Newest-first, so a few pages reliably covers recent drains.
      let ctxItems = [], np = null, pg = 0;
      do {
        const q = np ? "?" + new URLSearchParams(np).toString() : "";
        const d = await bsJson(`/addresses/${creator}/transactions${q}`).catch(() => ({}));
        ctxItems.push(...(d.items || []));
        np = d.next_page_params; pg += 1;
      } while (np && pg < 4);
      const ctx = { items: ctxItems };
      const DEAD = /^0x0+$/, cand = [];
      for (const t of (ctx.items || [])) {
        if (String(t.status || "ok").toLowerCase() === "error") continue;      // reverted calls don't count
        const to = ((t.to || {}).hash || "").toLowerCase();
        const inp = String(t.raw_input || t.input || "").toLowerCase();
        // Drain-service: creator calls the known controller, or invokes the drain selector on ANY contract.
        if (DRAIN_CONTROLLERS.has(to) || inp.slice(0, 10) === DRAIN_SELECTOR) drainService = true;
        // transferFrom backdoor (only calls ONTO the token itself count here)
        if (to !== tokenAddress.toLowerCase() || inp.slice(0, 10) !== "0x23b872dd") continue;
        const fromParam = "0x" + inp.slice(34, 74);                    // wallet whose tokens are moved
        const toParam = "0x" + inp.slice(98, 138);                     // where they're sent
        if (fromParam === creator || DEAD.test(fromParam)) continue;   // creator moving its OWN tokens = fine
        cand.push({ from: fromParam, burn: DEAD.test(toParam) });
      }
      // For the transferFrom path only: a seizure from a REAL WALLET (EOA) is a drain, but a transferFrom
      // OUT of a factory/pool CONTRACT is just launchpad liquidity seeding — not theft. getCode() separates them.
      const provider = rhProvider(rpcUrl);
      const uniq = [...new Set(cand.map((c) => c.from))];
      const codes = {};
      await Promise.all(uniq.map(async (f) => { try { codes[f] = (await provider.getCode(f)) || "0x"; } catch { codes[f] = "0x"; } }));
      const victims = new Set(); let burnSeize = false;
      for (const c of cand) {
        if ((codes[c.from] || "0x").length > 2) continue;              // from is a CONTRACT → launchpad infra, skip
        victims.add(c.from);                                           // from is a real wallet → a holder was seized
        if (c.burn) burnSeize = true;                                  // ...and burned = pure drain
      }
      // Unambiguous drain: uses the drain service, burned a holder's tokens, or seized from ≥2 distinct
      // wallets. A single transferFrom to a live wallet is ambiguous (could be a team consolidation) → warn.
      backdoorProven = drainService || burnSeize || victims.size >= 2;
      backdoor = victims.size >= 1;
      if (drainService) reasons.unshift("this coin's deployer uses a known balance-drain service — buyers get silently emptied seconds after buying (rug)");
      else if (backdoorProven) reasons.unshift("the deployer SEIZES holders' tokens without approval — proven backdoor drain (rug)");
      else if (backdoor) reasons.unshift("the deployer has moved a holder's tokens via a backdoor — treat as unsafe");
    }
  } catch { /* Blockscout hiccup — fall through to reconciliation */ }

  // (2b) BUYER RECONCILIATION — sample RECENT BUYERS (from the pool's transfers, since the per-token
  // transfer endpoint is empty for these tokens) and check what they RECEIVED vs HOLD now. If the MAJORITY
  // of recent buyers sit near zero without a real exit, the coin drains buyers → BLOCK. NOTE: this can only
  // catch BROAD drainers. SELECTIVE drainers (MAXI — empties only some buyers) and relayed trades (a
  // relayer signs, so tx-signer can't distinguish a sell from a seizure) defeat pre-buy detection here;
  // the POST-buy drain alert (rhWalletTokenAudit) is the honest backstop for those.
  if (!backdoorProven && sellable !== false) {
    let buyers = [];
    try {
      const poolHash = (((holderList.find((h) => h.address && h.address.is_contract) || {}).address || {}).hash || "").toLowerCase();
      if (poolHash) {
        const pt = await bsJson(`/addresses/${poolHash}/token-transfers?type=ERC-20`).catch(() => ({}));
        const seen = new Set();
        for (const t of (pt.items || [])) {
          if (((t.token || {}).address_hash || (t.token || {}).address || "").toLowerCase() !== tokenAddress.toLowerCase()) continue;
          if (((t.from || {}).hash || "").toLowerCase() !== poolHash) continue;   // pool -> buyer = a buy
          const to = ((t.to || {}).hash || "").toLowerCase();
          if (!to || /^0x0+$/.test(to) || to === poolHash) continue;
          if (!seen.has(to)) { seen.add(to); buyers.push(to); }
          if (buyers.length >= 6) break;
        }
      }
    } catch { /* skip */ }
    let checked = 0, drained = 0;
    for (const addr of buyers) {
      try {
        const [tr, held] = await Promise.all([
          bsJson(`/addresses/${addr}/token-transfers?type=ERC-20`),
          rhErc20Balance(tokenAddress, addr).catch(() => null),
        ]);
        let recv = 0n, sent = 0n;
        for (const t of (tr.items || [])) {
          if (((t.token || {}).address_hash || (t.token || {}).address || "").toLowerCase() !== tokenAddress.toLowerCase()) continue;
          const v = BigInt((t.total || {}).value || "0");
          if (((t.to || {}).hash || "").toLowerCase() === addr.toLowerCase()) recv += v; else sent += v;
        }
        if (recv <= 0n || held == null) continue;
        checked += 1;
        // Drained = never sold it out (sent≈0) yet holds far less than received (invisible balance cut).
        if (sent === 0n && BigInt(held) * 100n < recv * 35n) drained += 1;
      } catch { /* skip this buyer */ }
    }
    if (checked >= 3 && drained >= Math.ceil(checked * 2 / 3)) {
      reasons.unshift("recent buyers are LOSING tokens with no sale — this coin drains buyers (rug)");
    }
  }

  // (3) Extreme concentration ONLY — a single real wallet holding almost everything can dump on you.
  if (topPct != null && topPct >= 85) reasons.push(`one wallet holds ~${topPct}% of supply — it can dump on you`);

  // BLOCK = proven un-sellable (honeypot), proven backdoor drain, or observed buyer-drain. WARN = a single
  // ambiguous backdoor move or heavy concentration. OK = passed everything.
  let verdict = "ok";
  const blockReason = sellable === false || backdoorProven
    || reasons.some((r) => r.includes("drains buyers") || r.includes("drains balances") || r.includes("sells are blocked"));
  if (blockReason) verdict = "block";
  else if (reasons.length) verdict = "warn";
  const result = { ok: true, verdict, sellable, transferGas, holders, topPct, ownerRenounced, backdoor, reasons };
  safetyCache.set(key, { at: Date.now(), result });
  return result;
}

// ETH/USD from the chain's own explorer stats (cached — it only needs to be roughly right for MC).
let ethUsdCache = { at: 0, price: 0 };
export async function rhEthUsd() {
  if (Date.now() - ethUsdCache.at < 300_000 && ethUsdCache.price > 0) return ethUsdCache.price;
  const stats = await bsJson("/stats");
  const price = Number(stats.coin_price || 0);
  if (price > 0) ethUsdCache = { at: Date.now(), price };
  return price;
}

// Pool-implied token price for coins DexScreener hasn't indexed yet: quote a tiny ETH buy through
// the chain's live pools and derive $/token. Returns null when the coin has NO pool ("no routes").
export async function rhImpliedPriceUsd(tokenAddress, probeAddress) {
  const probeEth = 0.0005;
  const [ethUsd, quote] = await Promise.all([
    rhEthUsd(),
    relayQuoteRhSwap({
      address: probeAddress,
      fromCurrency: "0x0000000000000000000000000000000000000000",
      toCurrency: tokenAddress,
      amountRaw: (ethers.parseEther(String(probeEth))).toString()
    }).catch(async () => {
      const input = {
        address: probeAddress,
        fromCurrency: "0x0000000000000000000000000000000000000000",
        toCurrency: tokenAddress,
        amountRaw: ethers.parseEther(String(probeEth)).toString()
      };
      try { return await uniswapQuoteRhSwap(input); }
      catch { return sushiQuoteRhSwap(input).catch(() => ({ noPool: true })); }
    })
  ]);
  if (!quote || quote.noPool) return quote && quote.noPool ? { noPool: true } : null;
  const out = Number(quote.outFormatted || 0);
  if (!(out > 0) || !(ethUsd > 0)) return null;
  return { priceUsd: (probeEth * ethUsd) / out };
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

async function relayPostQuote(body, label = "Relay quote") {
  const endpoints = ["/quote/v2", "/quote"];
  for (let index = 0; index < endpoints.length; index += 1) {
    const endpoint = endpoints[index];
    const response = await fetch(`${RELAY_API}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout ? AbortSignal.timeout(20_000) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && !data.message) return data;
    // Keep the legacy endpoint only as an availability fallback. A real v2
    // route/liquidity rejection must not trigger a duplicate quote request.
    if (index === 0 && [404, 405, 501].includes(response.status)) continue;
    const code = String(data.errorCode || data.code || "").trim();
    const detail = String(data.message || data.error || `HTTP ${response.status}`).slice(0, 220);
    const error = new Error(`${label} failed${code ? ` (${code})` : ""}: ${detail}`);
    error.statusCode = response.status >= 400 && response.status < 500 ? 400 : 502;
    error.relayErrorCode = code;
    throw error;
  }
  throw new Error(`${label} failed: Relay quote service is unavailable.`);
}

export function rhBuySpendPlanFromWei({
  availableWei,
  quotedWei,
  maxFeePerGasWei = 0n,
  userReserveWei = 0n,
  gasUnits = 800_000n
}) {
  const available = BigInt(availableWei || 0);
  const quoted = BigInt(quotedWei || 0);
  const maxFee = BigInt(maxFeePerGasWei || 0);
  const requestedReserve = BigInt(userReserveWei || 0);
  const gasBudget = BigInt(gasUnits || 0);
  const floorReserve = ethers.parseEther("0.00004");
  const liveReserve = maxFee > 0n && gasBudget > 0n ? maxFee * gasBudget : 0n;
  const reserveWei = [floorReserve, liveReserve, requestedReserve]
    .reduce((max, value) => value > max ? value : max, 0n);
  const spendableWei = available > reserveWei ? available - reserveWei : 0n;
  const quotedTargetWei = quoted > 0n ? (quoted * 96n) / 100n : spendableWei;
  const spendWei = spendableWei < quotedTargetWei ? spendableWei : quotedTargetWei;
  return {
    spendWei: spendWei.toString(),
    spendEth: ethers.formatEther(spendWei),
    gasReserveWei: reserveWei.toString(),
    gasReserveEth: ethers.formatEther(reserveWei),
    maxFeePerGasWei: maxFee.toString()
  };
}

export async function rhBuySpendPlan({ availableWei, quotedEth, userReserveEth = 0, gasUnits = 800_000n, rpcUrl }) {
  const feeData = await rhProvider(rpcUrl).getFeeData().catch(() => ({}));
  const maxFeePerGasWei = feeData.maxFeePerGas || feeData.gasPrice || 0n;
  let quotedWei = 0n;
  let userReserveWei = 0n;
  try { quotedWei = ethers.parseEther(String(quotedEth || 0)); } catch { /* quote remains zero */ }
  try { userReserveWei = ethers.parseEther(String(Math.max(0, Number(userReserveEth) || 0))); } catch { /* live reserve wins */ }
  return rhBuySpendPlanFromWei({ availableWei, quotedWei, maxFeePerGasWei, userReserveWei, gasUnits });
}

export async function relayQuoteSolToRhEth({ solanaAddress, evmRecipient, lamports }) {
  const data = await relayPostQuote({
    user: solanaAddress,
    recipient: evmRecipient,
    originChainId: RELAY_SOLANA_CHAIN_ID,
    destinationChainId: RH_CHAIN_ID,
    originCurrency: "11111111111111111111111111111111",
    destinationCurrency: "0x0000000000000000000000000000000000000000",
    amount: String(lamports),
    tradeType: "EXACT_INPUT"
  }, "SOL to Robinhood quote");
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
  const data = await relayPostQuote({
    user: address,
    recipient: address,
    originChainId: RH_CHAIN_ID,
    destinationChainId: RH_CHAIN_ID,
    originCurrency: fromCurrency,
    destinationCurrency: toCurrency,
    amount: String(amountRaw),
    tradeType: "EXACT_INPUT"
  }, "Robinhood swap quote");
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

// Direct Sushi fallback for brand-new Sushi pools. Relay remains the first choice
// because it can aggregate every RH venue, but its index may trail a fresh pool.
// Sushi's swap API knows its own V2/V3 pools immediately and returns executable
// calldata. ERC-20 inputs receive an explicit exact-amount approval step.
export async function sushiQuoteRhSwap({ address, fromCurrency, toCurrency, amountRaw, maxSlippage = 0.03 }) {
  const native = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
  const zero = "0x0000000000000000000000000000000000000000";
  const tokenIn = String(fromCurrency || "").toLowerCase() === zero ? native : ethers.getAddress(fromCurrency);
  const tokenOut = String(toCurrency || "").toLowerCase() === zero ? native : ethers.getAddress(toCurrency);
  const sender = ethers.getAddress(address);
  const url = new URL(`${RH_SUSHI.quoteApi.replace("/quote/", "/swap/")}`);
  url.searchParams.set("tokenIn", tokenIn);
  url.searchParams.set("tokenOut", tokenOut);
  url.searchParams.set("amount", String(amountRaw));
  url.searchParams.set("maxSlippage", String(Math.max(0.001, Math.min(0.25, Number(maxSlippage) || 0.03))));
  url.searchParams.set("sender", sender);
  // SlimeWire estimates every returned transaction with the actual signer just
  // before sending. Skipping Sushi's remote simulation also lets read-only price
  // probes use an unfunded address without producing a false "no route".
  url.searchParams.set("simulate", "false");
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "SlimeWire/1.0" },
    signal: AbortSignal.timeout ? AbortSignal.timeout(20_000) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.status !== "Success" || !data.tx?.to || !data.tx?.data) {
    throw new Error(data.status === "NoWay"
      ? "No trading route for this coin right now — its Sushi pool may still be initializing."
      : `Sushi swap quote failed: ${String(data.detail || data.title || data.message || data.status || `HTTP ${response.status}`).slice(0, 200)}`);
  }
  const txs = [];
  if (tokenIn !== native) {
    const approve = new ethers.Interface(["function approve(address spender,uint256 amount) returns (bool)"]);
    txs.push({ stepId: "sushi-approve", to: tokenIn, data: approve.encodeFunctionData("approve", [data.tx.to, BigInt(amountRaw)]), value: "0" });
  }
  txs.push({ stepId: "sushi-swap", to: data.tx.to, data: data.tx.data, value: String(data.tx.value || "0") });
  const outToken = Array.isArray(data.tokens) ? data.tokens[Number(data.tokenTo)] : null;
  const decimals = Math.max(0, Math.min(36, Number(outToken?.decimals ?? 18)));
  const assumed = BigInt(String(data.assumedAmountOut || "0"));
  return {
    txs,
    outFormatted: ethers.formatUnits(assumed, decimals),
    outSymbol: String(outToken?.symbol || ""),
    impactPercent: Number.isFinite(Number(data.priceImpact)) ? String(Number(data.priceImpact) * 100) : "",
    venue: "sushiswap",
  };
}

// Direct Sushi V3 fallback for confirmed on-chain pools. Sushi's hosted route
// service can return `NoWay` while a brand-new SlimeWire pool is already live.
// The factory, quoter and SwapRouter below are one verified Sushi deployment,
// so this path does not depend on an off-chain index catching up first.
export async function sushiV3QuoteRhSwap({ address, fromCurrency, toCurrency, amountRaw, maxSlippage = 0.03, rpcUrl }) {
  const zero = ethers.ZeroAddress;
  const sender = ethers.getAddress(address);
  const from = String(fromCurrency || "").toLowerCase() === zero.toLowerCase()
    ? RH_SUSHI.weth
    : ethers.getAddress(fromCurrency);
  const to = String(toCurrency || "").toLowerCase() === zero.toLowerCase()
    ? RH_SUSHI.weth
    : ethers.getAddress(toCurrency);
  if (from.toLowerCase() === to.toLowerCase()) throw new Error("Sushi V3 swap needs two different assets.");
  const amountIn = BigInt(amountRaw || 0);
  if (amountIn <= 0n) throw new Error("Sushi V3 swap amount must be above zero.");

  const provider = rhProvider(rpcUrl);
  const factory = new ethers.Contract(RH_SUSHI.v3Factory, [
    "function getPool(address tokenA,address tokenB,uint24 fee) view returns(address pool)"
  ], provider);
  const quoter = new ethers.Contract(RH_SUSHI.v3Quoter, [
    "function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96)) returns(uint256 amountOut,uint160 sqrtPriceX96After,uint32 initializedTicksCrossed,uint256 gasEstimate)"
  ], provider);
  const candidates = (await Promise.all([10_000, 3_000, 500, 100].map(async (fee) => {
    const pool = await factory.getPool(from, to, fee).catch(() => zero);
    if (!pool || String(pool).toLowerCase() === zero.toLowerCase()) return null;
    try {
      const quoted = await quoter.quoteExactInputSingle.staticCall({
        tokenIn: from,
        tokenOut: to,
        amountIn,
        fee,
        sqrtPriceLimitX96: 0
      });
      const amountOut = BigInt(quoted?.amountOut ?? quoted?.[0] ?? 0);
      return amountOut > 0n ? { fee, pool, amountOut } : null;
    } catch { return null; }
  }))).filter(Boolean);
  candidates.sort((a, b) => a.amountOut === b.amountOut ? 0 : (a.amountOut > b.amountOut ? -1 : 1));
  const best = candidates[0];
  if (!best) throw new Error("No executable Sushi V3 pool for this Robinhood coin right now.");

  const slippageBps = BigInt(Math.round(Math.max(0.001, Math.min(0.25, Number(maxSlippage) || 0.03)) * 10_000));
  const amountOutMinimum = (best.amountOut * (10_000n - slippageBps)) / 10_000n;
  const router = new ethers.Interface([
    "function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96)) payable returns(uint256 amountOut)",
    "function unwrapWETH9(uint256 amountMinimum,address recipient) payable",
    "function multicall(bytes[] data) payable returns(bytes[] results)"
  ]);
  const nativeInput = String(fromCurrency || "").toLowerCase() === zero.toLowerCase();
  const nativeOutput = String(toCurrency || "").toLowerCase() === zero.toLowerCase();
  const swapRecipient = nativeOutput ? RH_SUSHI.v3SwapRouter : sender;
  const swapData = router.encodeFunctionData("exactInputSingle", [{
    tokenIn: from,
    tokenOut: to,
    fee: best.fee,
    recipient: swapRecipient,
    deadline: Math.floor(Date.now() / 1000) + 600,
    amountIn,
    amountOutMinimum,
    sqrtPriceLimitX96: 0
  }]);
  const txs = [];
  if (!nativeInput) {
    const approve = new ethers.Interface(["function approve(address spender,uint256 amount) returns(bool)"]);
    txs.push({ stepId: "sushi-v3-approve", to: from, data: approve.encodeFunctionData("approve", [RH_SUSHI.v3SwapRouter, amountIn]), value: "0" });
  }
  const swapCall = nativeOutput
    ? router.encodeFunctionData("multicall", [[
      swapData,
      router.encodeFunctionData("unwrapWETH9", [amountOutMinimum, sender])
    ]])
    : swapData;
  txs.push({
    stepId: "sushi-v3-swap",
    to: RH_SUSHI.v3SwapRouter,
    data: swapCall,
    value: nativeInput ? amountIn.toString() : "0"
  });

  let decimals = 18;
  let symbol = nativeOutput ? "ETH" : "";
  if (!nativeOutput) {
    const outputToken = new ethers.Contract(to, [
      "function decimals() view returns(uint8)",
      "function symbol() view returns(string)"
    ], provider);
    [decimals, symbol] = await Promise.all([
      outputToken.decimals().then(Number).catch(() => 18),
      outputToken.symbol().then(String).catch(() => "")
    ]);
  }
  return {
    txs,
    outFormatted: ethers.formatUnits(best.amountOut, decimals),
    outSymbol: symbol,
    impactPercent: "",
    venue: "sushiswap-v3-direct",
    pool: best.pool,
    fee: best.fee
  };
}

// Direct Uniswap V3 fallback for Robinhood pools Relay has not indexed yet.
// The factory/router/quoter relationship is verified on-chain (factory() and
// WETH9()), and every returned transaction is still simulated by the signer
// in rhExecuteEvmSteps before anything is sent.
export async function uniswapQuoteRhSwap({ address, fromCurrency, toCurrency, amountRaw, maxSlippage = 0.03, rpcUrl }) {
  const zero = ethers.ZeroAddress;
  const sender = ethers.getAddress(address);
  const from = String(fromCurrency || "").toLowerCase() === zero.toLowerCase()
    ? RH_UNIV3.weth
    : ethers.getAddress(fromCurrency);
  const to = String(toCurrency || "").toLowerCase() === zero.toLowerCase()
    ? RH_UNIV3.weth
    : ethers.getAddress(toCurrency);
  if (from.toLowerCase() === to.toLowerCase()) throw new Error("Uniswap swap needs two different assets.");
  const amountIn = BigInt(amountRaw || 0);
  if (amountIn <= 0n) throw new Error("Uniswap swap amount must be above zero.");

  const provider = rhProvider(rpcUrl);
  const factory = new ethers.Contract(RH_UNIV3.factory, [
    "function getPool(address tokenA,address tokenB,uint24 fee) view returns(address pool)"
  ], provider);
  const quoter = new ethers.Contract(RH_UNIV3.quoterV2, [
    "function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96)) returns(uint256 amountOut,uint160 sqrtPriceX96After,uint32 initializedTicksCrossed,uint256 gasEstimate)"
  ], provider);
  const candidates = (await Promise.all([10_000, 3_000, 500, 100].map(async (fee) => {
    const pool = await factory.getPool(from, to, fee).catch(() => zero);
    if (!pool || String(pool).toLowerCase() === zero.toLowerCase()) return null;
    try {
      const quoted = await quoter.quoteExactInputSingle.staticCall({
        tokenIn: from,
        tokenOut: to,
        amountIn,
        fee,
        sqrtPriceLimitX96: 0
      });
      const amountOut = BigInt(quoted?.amountOut ?? quoted?.[0] ?? 0);
      return amountOut > 0n ? { fee, pool, amountOut } : null;
    } catch { return null; /* this pool cannot execute the requested size */ }
  }))).filter(Boolean);
  candidates.sort((a, b) => a.amountOut === b.amountOut ? 0 : (a.amountOut > b.amountOut ? -1 : 1));
  const best = candidates[0];
  if (!best) throw new Error("No executable Uniswap V3 pool for this Robinhood coin right now.");

  const slippageBps = BigInt(Math.round(Math.max(0.001, Math.min(0.25, Number(maxSlippage) || 0.03)) * 10_000));
  const amountOutMinimum = (best.amountOut * (10_000n - slippageBps)) / 10_000n;
  const router = new ethers.Interface([
    "function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96)) payable returns(uint256 amountOut)",
    "function unwrapWETH9(uint256 amountMinimum,address recipient) payable",
    "function multicall(bytes[] data) payable returns(bytes[] results)"
  ]);
  const nativeInput = String(fromCurrency || "").toLowerCase() === zero.toLowerCase();
  const nativeOutput = String(toCurrency || "").toLowerCase() === zero.toLowerCase();
  const swapRecipient = nativeOutput ? RH_UNIV3.swapRouter : sender;
  const swapData = router.encodeFunctionData("exactInputSingle", [{
    tokenIn: from,
    tokenOut: to,
    fee: best.fee,
    recipient: swapRecipient,
    amountIn,
    amountOutMinimum,
    sqrtPriceLimitX96: 0
  }]);
  const txs = [];
  if (!nativeInput) {
    const approve = new ethers.Interface(["function approve(address spender,uint256 amount) returns(bool)"]);
    txs.push({ stepId: "uniswap-approve", to: from, data: approve.encodeFunctionData("approve", [RH_UNIV3.swapRouter, amountIn]), value: "0" });
  }
  const swapCall = nativeOutput
    ? router.encodeFunctionData("multicall", [[
      swapData,
      router.encodeFunctionData("unwrapWETH9", [amountOutMinimum, sender])
    ]])
    : swapData;
  txs.push({
    stepId: "uniswap-swap",
    to: RH_UNIV3.swapRouter,
    data: swapCall,
    value: nativeInput ? amountIn.toString() : "0"
  });

  let decimals = 18;
  let symbol = nativeOutput ? "ETH" : "";
  if (!nativeOutput) {
    const outputToken = new ethers.Contract(to, [
      "function decimals() view returns(uint8)",
      "function symbol() view returns(string)"
    ], provider);
    [decimals, symbol] = await Promise.all([
      outputToken.decimals().then(Number).catch(() => 18),
      outputToken.symbol().then(String).catch(() => "")
    ]);
  }
  return {
    txs,
    outFormatted: ethers.formatUnits(best.amountOut, decimals),
    outSymbol: symbol,
    impactPercent: "",
    venue: "uniswap-v3",
    pool: best.pool,
    fee: best.fee
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
      // Buffer the gas 1.6x over the estimate. Tax / rebase / anti-bot tokens run extra code on
      // transfer, so the router's estimate can fall short and the swap fails "out of gas" (a real user
      // hit this on a scam token — first buy reverted OOG). Over-provisioning is refunded, so it's free.
      const est = await wallet.estimateGas(request);
      request.gasLimit = (est * 16n) / 10n;
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
    hashes.push(sent.hash);
    try {
      await sent.wait(1, confirmTimeoutMs);
    } catch (error) {
      // The node accepted a signed transaction and gave us its stable hash.
      // A receipt timeout is outcome-unknown, never permission to build/send a
      // second swap. Callers persist this hash and pause for reconciliation.
      const ambiguous = error instanceof Error ? error : new Error(String(error || "Robinhood transaction confirmation failed"));
      ambiguous.tradeSubmissionAmbiguous = true;
      ambiguous.transactionHash = sent.hash;
      ambiguous.partialHashes = hashes.slice();
      throw ambiguous;
    }
  }
  return { hashes, address: wallet.address };
}

// ---------- Platform fee on Robinhood Chain -> converted to SOL ----------
// RH trades pay the SAME bps fee as Solana trades, skimmed in ETH to a platform fee account whose key
// is derived from APP_SECRET (no new secret to store; don't rotate APP_SECRET — known constraint).
// When the pot is big enough, it swaps itself cross-chain to SOL delivered to the Solana FEE_WALLET
// (Relay 4663 -> Solana, live-verified: 0.002 ETH -> 0.041 SOL direct to the fee wallet).
export function rhFeeEvmWallet(appSecret, rpcUrl) {
  let candidate = ethers.keccak256(ethers.concat([ethers.toUtf8Bytes("slimewire-rh-fee-v1"), ethers.toUtf8Bytes(String(appSecret || ""))]));
  for (let i = 0; i < 10; i += 1) {
    try {
      new ethers.SigningKey(candidate);
      return new ethers.Wallet(candidate, rhProvider(rpcUrl));
    } catch {
      candidate = ethers.keccak256(candidate);
    }
  }
  throw new Error("Could not derive the RH fee account.");
}

// Plain ETH transfer from a user's derived account (used for the per-trade fee skim). Non-critical
// callers wrap this in try/catch — a failed skim must never break the user's trade.
export async function rhTransferEth(solanaSecretKey, toAddress, wei, rpcUrl) {
  const wallet = evmWalletFromSolana(solanaSecretKey, rpcUrl);
  const sent = await wallet.sendTransaction({ to: toAddress, value: BigInt(wei) });
  await sent.wait(1, 60_000);
  return sent.hash;
}

export async function rhTransferErc20(solanaSecretKey, tokenAddress, toAddress, amountRaw, rpcUrl) {
  const wallet = evmWalletFromSolana(solanaSecretKey, rpcUrl);
  const token = ethers.getAddress(String(tokenAddress || ""));
  const destination = ethers.getAddress(String(toAddress || ""));
  if (destination.toLowerCase() === wallet.address.toLowerCase()) throw new Error("That destination is this wallet.");
  const raw = BigInt(amountRaw || 0);
  if (raw <= 0n) throw new Error("Enter a token amount greater than zero.");
  const contract = new ethers.Contract(token, ["function transfer(address,uint256) returns (bool)"], wallet);
  const request = await contract.transfer.populateTransaction(destination, raw);
  try {
    const estimated = await wallet.estimateGas(request);
    request.gasLimit = (estimated * 14n) / 10n;
  } catch (error) {
    const message = String(error?.shortMessage || error?.message || "");
    if (/insufficient funds/i.test(message)) throw new Error("Not enough ETH for the Robinhood Chain network fee.");
    throw new Error(`Token transfer simulation failed: ${message.slice(0, 220)}`);
  }
  const sent = await wallet.sendTransaction(request);
  const receipt = await sent.wait(1, 90_000);
  if (!receipt || Number(receipt.status) !== 1) throw new Error("Token transfer failed on Robinhood Chain.");
  return sent.hash;
}

// Convert the accrued ETH fee pot -> SOL at the Solana fee wallet. Leaves a gas reserve behind.
export async function rhSweepFeesToSol({ appSecret, solFeeWallet, rpcUrl, minEth = 0.002, gasReserveEth = 0.0003 }) {
  const feeWallet = rhFeeEvmWallet(appSecret, rpcUrl);
  const balanceWei = BigInt((await rhEthBalance(feeWallet.address, rpcUrl)).wei);
  const minWei = ethers.parseEther(String(minEth));
  const reserveWei = ethers.parseEther(String(gasReserveEth));
  if (balanceWei < minWei + reserveWei) {
    return { swept: false, reason: "below threshold", balanceEth: ethers.formatEther(balanceWei), feeAddress: feeWallet.address };
  }
  const sendWei = balanceWei - reserveWei;
  const data = await relayPostQuote({
    user: feeWallet.address,
    recipient: solFeeWallet,
    originChainId: RH_CHAIN_ID,
    destinationChainId: RELAY_SOLANA_CHAIN_ID,
    originCurrency: "0x0000000000000000000000000000000000000000",
    destinationCurrency: "11111111111111111111111111111111",
    amount: sendWei.toString(),
    tradeType: "EXACT_INPUT"
  }, "Fee sweep quote");
  const txs = [];
  for (const step of data.steps || []) {
    for (const item of step.items || []) {
      const tx = item.data || {};
      if (tx.to && tx.data !== undefined) txs.push({ to: tx.to, data: tx.data, value: tx.value || "0" });
    }
  }
  if (!txs.length) throw new Error("Fee sweep quote returned no transaction.");
  const hashes = [];
  for (const tx of txs) {
    const sent = await feeWallet.sendTransaction({ to: tx.to, data: tx.data, value: BigInt(tx.value || "0") });
    await sent.wait(1, 90_000);
    hashes.push(sent.hash);
  }
  return {
    swept: true,
    hashes,
    sentEth: ethers.formatEther(sendWei),
    outSol: data.details?.currencyOut?.amountFormatted || "",
    feeAddress: feeWallet.address
  };
}

// Cash a USER's Robinhood ETH back out to their OWN Solana address (the reverse of relayQuoteSolToRhEth).
// Same cross-chain rail as the fee sweep (Relay 4663 -> Solana, native ETH -> native SOL), but signed by
// the user's derived EVM wallet and delivered to their Solana pubkey. Leaves a small gas reserve behind so
// the wallet can still pay for a future trade. amountEth "all"/omitted = sweep the whole balance minus gas.
export async function rhBridgeEthToSol({ solanaSecretKey, solRecipient, amountEth, rpcUrl, gasReserveEth = 0.0003 }) {
  if (!solRecipient) throw new Error("Missing Solana destination address.");
  const wallet = evmWalletFromSolana(solanaSecretKey, rpcUrl);
  const balanceWei = BigInt((await rhEthBalance(wallet.address, rpcUrl)).wei);
  const reserveWei = ethers.parseEther(String(gasReserveEth));
  const wantAll = amountEth == null || String(amountEth).trim() === "" || String(amountEth).trim().toLowerCase() === "all";
  // Spendable = balance minus the gas reserve; a specific amount is clamped to that so we never over-draw.
  const spendableWei = balanceWei > reserveWei ? balanceWei - reserveWei : 0n;
  let sendWei = spendableWei;
  if (!wantAll) {
    const reqWei = ethers.parseEther(String(amountEth));
    if (reqWei <= 0n) { const e = new Error("Enter an ETH amount above 0."); e.statusCode = 400; throw e; }
    sendWei = reqWei < spendableWei ? reqWei : spendableWei;
  }
  // Relay's cross-chain minimum is tiny but real; below ~0.0005 ETH the route won't quote. Fail clearly.
  const minSendWei = ethers.parseEther("0.0005");
  if (sendWei < minSendWei) {
    const e = new Error(`This wallet has ${ethers.formatEther(balanceWei)} ETH — after leaving ${gasReserveEth} ETH for gas that's not enough to bridge (need ~0.0005 ETH). Trade or fund more first.`);
    e.statusCode = 400; throw e;
  }
  const nativeSol = "11111111111111111111111111111111";
  const solanaUsdc = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const quote = (destinationCurrency, label) => relayPostQuote({
    user: wallet.address,
    recipient: solRecipient,
    originChainId: RH_CHAIN_ID,
    destinationChainId: RELAY_SOLANA_CHAIN_ID,
    originCurrency: "0x0000000000000000000000000000000000000000",
    destinationCurrency,
    amount: sendWei.toString(),
    tradeType: "EXACT_INPUT"
  }, label);
  let settlementAsset = "SOL";
  let data;
  try {
    data = await quote(nativeSol, "ETH to SOL quote");
  } catch (error) {
    // A newly supported EVM chain can temporarily lack a native-SOL solver while its
    // ETH -> Solana USDC route remains executable. The server converts that exact USDC
    // delivery to SOL in the same managed wallet.
    if (String(error?.relayErrorCode || "").toUpperCase() !== "NO_SWAP_ROUTES_FOUND") throw error;
    settlementAsset = "USDC";
    data = await quote(solanaUsdc, "ETH to Solana USDC fallback quote");
  }
  const txs = [];
  for (const step of data.steps || []) {
    for (const item of step.items || []) {
      const tx = item.data || {};
      if (tx.to && tx.data !== undefined) txs.push({ to: tx.to, data: tx.data, value: tx.value || "0" });
    }
  }
  if (!txs.length) throw new Error("ETH → SOL quote returned no transaction.");
  const { hashes } = await rhExecuteEvmSteps(solanaSecretKey, txs, rpcUrl);
  return {
    ok: true,
    hashes,
    evmAddress: wallet.address,
    sentEth: ethers.formatEther(sendWei),
    settlementAsset,
    outSol: settlementAsset === "SOL" ? (data.details?.currencyOut?.amountFormatted || "") : "",
    outUsdc: settlementAsset === "USDC" ? (data.details?.currencyOut?.amountFormatted || "") : "",
    requestId: data.steps?.[0]?.requestId || data.requestId || "",
    checkEndpoint: data.steps?.flatMap((step) => step.items || []).find((item) => item?.check?.endpoint)?.check?.endpoint || "",
    impactPercent: data.details?.totalImpact?.percent || ""
  };
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
