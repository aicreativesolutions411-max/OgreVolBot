import { ethers } from "ethers";
import launchArtifact from "../src/lib/rh-sushi-launch.json" with { type: "json" };
import { RH_DEFAULT_RPC, RH_SUSHI, rhFeeEvmWallet } from "../src/lib/robinhoodChain.js";

const send = process.argv.includes("--send");
const appSecret = String(process.env.APP_SECRET || "");
if (appSecret.length < 24) throw new Error("APP_SECRET must be available to derive the existing Robinhood treasury wallet.");

const rpcUrl = String(process.env.RH_CHAIN_RPC_URL || RH_DEFAULT_RPC);
const provider = new ethers.JsonRpcProvider(rpcUrl, 4663, { staticNetwork: true });
const deployer = rhFeeEvmWallet(appSecret, rpcUrl).connect(provider);
const treasury = ethers.getAddress(String(process.env.RH_SUSHI_TREASURY_ADDRESS || deployer.address));
const launchFeeWei = ethers.parseEther(String(process.env.RH_SUSHI_FACTORY_LAUNCH_FEE_ETH || "0"));
const artifact = launchArtifact.contracts.SlimeSushiLaunchFactoryRH;
const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
const args = [RH_SUSHI.v3PositionManager, RH_SUSHI.weth, treasury, launchFeeWei];
const request = await factory.getDeployTransaction(...args);
const [balance, gas, feeData, network] = await Promise.all([
  provider.getBalance(deployer.address),
  provider.estimateGas({ ...request, from: deployer.address }),
  provider.getFeeData(),
  provider.getNetwork(),
]);
if (Number(network.chainId) !== 4663) throw new Error(`Refusing to deploy on chain ${network.chainId}; expected Robinhood Chain 4663.`);
const gasPrice = feeData.maxFeePerGas || feeData.gasPrice || 0n;
const estimatedCost = gas * gasPrice;
console.log(JSON.stringify({
  mode: send ? "send" : "dry-run",
  chainId: Number(network.chainId),
  deployer: deployer.address,
  treasury,
  launchFeeEth: ethers.formatEther(launchFeeWei),
  balanceEth: ethers.formatEther(balance),
  estimatedGas: gas.toString(),
  estimatedCostEth: ethers.formatEther(estimatedCost),
}));

if (!send) process.exit(0);
if (balance < estimatedCost) throw new Error("The existing Robinhood treasury wallet does not have enough ETH for factory deployment gas.");

const contract = await factory.deploy(...args, { gasLimit: (gas * 12n) / 10n });
const receipt = await contract.deploymentTransaction().wait(1, 180_000);
const address = await contract.getAddress();
const live = new ethers.Contract(address, artifact.abi, provider);
const [positionManager, wrappedNative, liveTreasury, liveLaunchFee, locker] = await Promise.all([
  live.positionManager(),
  live.wrappedNative(),
  live.treasury(),
  live.launchFeeWei(),
  live.locker(),
]);
if (positionManager.toLowerCase() !== RH_SUSHI.v3PositionManager.toLowerCase()) throw new Error("Deployed position manager verification failed.");
if (wrappedNative.toLowerCase() !== RH_SUSHI.weth.toLowerCase()) throw new Error("Deployed wrapped-native verification failed.");
if (liveTreasury.toLowerCase() !== treasury.toLowerCase()) throw new Error("Deployed treasury verification failed.");
if (BigInt(liveLaunchFee) !== launchFeeWei) throw new Error("Deployed launch-fee verification failed.");
console.log(JSON.stringify({
  deployed: true,
  address,
  locker,
  transactionHash: receipt.hash,
  blockNumber: receipt.blockNumber,
  gasUsed: receipt.gasUsed.toString(),
}));
