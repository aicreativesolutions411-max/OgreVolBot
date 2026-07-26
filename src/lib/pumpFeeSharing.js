import { createRequire } from "node:module";
import {
  PublicKey
} from "@solana/web3.js";
import {
  NATIVE_MINT,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
const requireModule = createRequire(import.meta.url);
const {
  PUMP_FEE_PROGRAM_ID,
  PUMP_SDK,
  canonicalPumpPoolPda,
  creatorVaultPda,
  feeSharingConfigPda,
  isSharingConfigEditable,
  quoteAta
} = requireModule("@pump-fun/pump-sdk");
const {
  PUMP_AMM_PROGRAM_ID,
  PUMP_PROGRAM_ID,
  coinCreatorVaultAtaPda,
  coinCreatorVaultAuthorityPda
} = requireModule("@pump-fun/pump-swap-sdk");

export const PUMP_FEE_SHARING_TOTAL_BPS = 10_000;
export const PUMP_FEE_SHARING_MAX_SHAREHOLDERS = 2;
export const PUMP_FEE_SHARING_QUOTE_MINT = NATIVE_MINT;
export const PUMP_FEE_SHARING_QUOTE_TOKEN_PROGRAM = TOKEN_PROGRAM_ID;

function asPublicKey(value, label) {
  let key;
  try {
    key = value instanceof PublicKey
      ? value
      : new PublicKey(String(value || ""));
  } catch {
    throw new Error(`${label} is not a valid Solana public key.`);
  }

  if (key.equals(PublicKey.default)) {
    throw new Error(`${label} cannot be the default Solana public key.`);
  }
  return key;
}

function samePublicKey(left, right) {
  return left?.equals?.(right) === true;
}

function asShareBps(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0 || value > PUMP_FEE_SHARING_TOTAL_BPS) {
    throw new Error(`${label} must be a positive integer no greater than 10,000 bps.`);
  }
  return value;
}

/**
 * Validate the stricter SlimeWire Pump fee-sharing profile.
 *
 * Pump itself permits up to ten shareholders. SlimeWire deliberately permits
 * at most two: the launch creator and one spendable, managed per-mint rewards
 * vault. Keeping this rule here prevents a UI or API caller from silently
 * creating a distribution layout the holder-reward worker cannot service.
 */
export function validatePumpFeeShareholders(shareholders) {
  if (!Array.isArray(shareholders) || shareholders.length === 0) {
    throw new Error("Pump fee sharing requires at least one shareholder.");
  }
  if (shareholders.length > PUMP_FEE_SHARING_MAX_SHAREHOLDERS) {
    throw new Error(`Pump fee sharing supports at most ${PUMP_FEE_SHARING_MAX_SHAREHOLDERS} shareholders.`);
  }

  const seen = new Set();
  let totalShareBps = 0;
  const normalized = shareholders.map((shareholder, index) => {
    const address = asPublicKey(shareholder?.address, `Pump fee shareholder ${index + 1}`);
    const shareBps = asShareBps(
      shareholder?.shareBps,
      `Pump fee shareholder ${index + 1} share`
    );
    const encodedAddress = address.toBase58();
    if (seen.has(encodedAddress)) {
      throw new Error("Pump fee sharing cannot contain duplicate shareholder addresses.");
    }
    seen.add(encodedAddress);
    totalShareBps += shareBps;
    return { address, shareBps };
  });

  if (totalShareBps !== PUMP_FEE_SHARING_TOTAL_BPS) {
    throw new Error(`Pump fee shares must total exactly ${PUMP_FEE_SHARING_TOTAL_BPS} bps; received ${totalShareBps}.`);
  }
  return normalized;
}

/**
 * Build the final two-recipient split used by dynamic holder rewards.
 *
 * `holderRewardsVault` must be a unique, spendable managed wallet created for
 * this mint by the caller. A deterministic PDA without a controlling program
 * would permanently lock the rewards, so this module intentionally accepts a
 * real vault public key rather than inventing an unspendable address.
 */
export function buildPumpHolderRewardsShareholders({
  creator,
  holderRewardsVault,
  holderRewardsShareBps,
  creatorShareBps
} = {}) {
  const creatorKey = asPublicKey(creator, "Pump fee-sharing creator");
  const rewardsVaultKey = asPublicKey(
    holderRewardsVault,
    "Pump holder-rewards vault"
  );
  if (creatorKey.equals(rewardsVaultKey)) {
    throw new Error("Pump holder-rewards vault must be different from the creator wallet.");
  }

  const rewardsBps = asShareBps(
    holderRewardsShareBps,
    "Pump holder-rewards share"
  );
  if (rewardsBps >= PUMP_FEE_SHARING_TOTAL_BPS) {
    throw new Error("Pump holder-rewards share must leave a positive share for the creator.");
  }
  const expectedCreatorBps = PUMP_FEE_SHARING_TOTAL_BPS - rewardsBps;
  if (creatorShareBps !== undefined && creatorShareBps !== expectedCreatorBps) {
    throw new Error(`Pump creator share must be ${expectedCreatorBps} bps so the split totals 10,000.`);
  }

  return validatePumpFeeShareholders([
    { address: creatorKey, shareBps: expectedCreatorBps },
    { address: rewardsVaultKey, shareBps: rewardsBps }
  ]);
}

export function getPumpFeeSharingAddresses({ mint } = {}) {
  const mintKey = asPublicKey(mint, "Pump fee-sharing mint");
  const sharingConfig = feeSharingConfigPda(mintKey);
  const pumpCreatorVault = creatorVaultPda(sharingConfig);
  const pumpSwapCreatorVaultAuthority = coinCreatorVaultAuthorityPda(sharingConfig);

  return {
    mint: mintKey,
    sharingConfig,
    canonicalPool: canonicalPumpPoolPda(mintKey),
    quoteMint: PUMP_FEE_SHARING_QUOTE_MINT,
    quoteTokenProgram: PUMP_FEE_SHARING_QUOTE_TOKEN_PROGRAM,
    pumpCreatorVault,
    pumpCreatorVaultWsolAta: quoteAta(
      pumpCreatorVault,
      PUMP_FEE_SHARING_QUOTE_MINT,
      PUMP_FEE_SHARING_QUOTE_TOKEN_PROGRAM
    ),
    pumpSwapCreatorVaultAuthority,
    pumpSwapCreatorVaultWsolAta: coinCreatorVaultAtaPda(
      pumpSwapCreatorVaultAuthority,
      PUMP_FEE_SHARING_QUOTE_MINT,
      PUMP_FEE_SHARING_QUOTE_TOKEN_PROGRAM
    )
  };
}

function normalizePool(mint, pool) {
  if (pool === null || pool === undefined || pool === "") return null;
  const poolKey = asPublicKey(pool, "Pump canonical pool");
  const expected = canonicalPumpPoolPda(mint);
  if (!poolKey.equals(expected)) {
    throw new Error(`Pump fee sharing requires the canonical pool ${expected.toBase58()}.`);
  }
  return poolKey;
}

/** Build step 1 of Pump's official creator fee-sharing lifecycle. */
export async function buildPumpFeeSharingCreateConfigInstruction({
  creator,
  mint,
  pool = null
} = {}) {
  const creatorKey = asPublicKey(creator, "Pump fee-sharing creator");
  const mintKey = asPublicKey(mint, "Pump fee-sharing mint");
  return PUMP_SDK.createFeeSharingConfig({
    creator: creatorKey,
    mint: mintKey,
    pool: normalizePool(mintKey, pool)
  });
}

/**
 * Build step 2 of Pump's official lifecycle. The V2 instruction distributes
 * any fees pending under the initial `(creator, 10000)` share, installs the
 * final creator/vault split, and permanently revokes further share updates.
 */
export async function buildPumpFeeSharingOneTimeUpdateInstruction({
  creator,
  mint,
  holderRewardsVault,
  holderRewardsShareBps,
  creatorShareBps
} = {}) {
  const creatorKey = asPublicKey(creator, "Pump fee-sharing creator");
  const mintKey = asPublicKey(mint, "Pump fee-sharing mint");
  const newShareholders = buildPumpHolderRewardsShareholders({
    creator: creatorKey,
    holderRewardsVault,
    holderRewardsShareBps,
    creatorShareBps
  });

  return PUMP_SDK.updateFeeSharesV2({
    authority: creatorKey,
    mint: mintKey,
    currentShareholders: [creatorKey],
    newShareholders,
    quoteMint: PUMP_FEE_SHARING_QUOTE_MINT,
    quoteTokenProgram: PUMP_FEE_SHARING_QUOTE_TOKEN_PROGRAM
  });
}

/** Build the atomic two-instruction setup transaction for index integration. */
export async function buildPumpHolderRewardsFeeSharingSetup({
  creator,
  mint,
  pool = null,
  holderRewardsVault,
  holderRewardsShareBps,
  creatorShareBps
} = {}) {
  const creatorKey = asPublicKey(creator, "Pump fee-sharing creator");
  const addresses = getPumpFeeSharingAddresses({ mint });
  const poolKey = normalizePool(addresses.mint, pool);
  const shareholders = buildPumpHolderRewardsShareholders({
    creator: creatorKey,
    holderRewardsVault,
    holderRewardsShareBps,
    creatorShareBps
  });
  const [createConfig, finalizeShares] = await Promise.all([
    buildPumpFeeSharingCreateConfigInstruction({
      creator: creatorKey,
      mint: addresses.mint,
      pool: poolKey
    }),
    buildPumpFeeSharingOneTimeUpdateInstruction({
      creator: creatorKey,
      mint: addresses.mint,
      holderRewardsVault: shareholders[1].address,
      holderRewardsShareBps: shareholders[1].shareBps,
      creatorShareBps: shareholders[0].shareBps
    })
  ]);

  return {
    instructions: [createConfig, finalizeShares],
    byStep: { createConfig, finalizeShares },
    creator: creatorKey,
    holderRewardsVault: shareholders[1].address,
    shareholders,
    addresses,
    pool: poolKey,
    isGraduated: Boolean(poolKey),
    requiredSigners: [creatorKey]
  };
}

function accountData(accountInfo, label) {
  if (!accountInfo?.data || typeof accountInfo.data.length !== "number") {
    throw new Error(`${label} returned malformed account data.`);
  }
  return Buffer.isBuffer(accountInfo.data)
    ? accountInfo.data
    : Buffer.from(accountInfo.data);
}

function sharingConfigStatusName(status) {
  if (!status || typeof status !== "object") return "unknown";
  const variant = Object.keys(status)[0];
  return variant ? String(variant).toLowerCase() : "unknown";
}

/** Decode and validate an authoritative Pump Fees sharing-config account. */
export function decodePumpFeeSharingConfig({ mint, accountInfo } = {}) {
  const addresses = getPumpFeeSharingAddresses({ mint });
  if (!accountInfo) {
    throw new Error(`Pump fee-sharing config ${addresses.sharingConfig.toBase58()} does not exist.`);
  }
  if (!samePublicKey(accountInfo.owner, PUMP_FEE_PROGRAM_ID)) {
    throw new Error("Pump fee-sharing config is not owned by the official Pump Fees program.");
  }

  let decoded;
  try {
    decoded = PUMP_SDK.decodeSharingConfig({
      ...accountInfo,
      data: accountData(accountInfo, "Pump fee-sharing config")
    });
  } catch (error) {
    throw new Error(`Could not decode Pump fee-sharing config: ${error?.message || error}`);
  }

  const decodedMint = asPublicKey(decoded?.mint, "Decoded Pump fee-sharing mint");
  if (!decodedMint.equals(addresses.mint)) {
    throw new Error("Pump fee-sharing config mint does not match the requested mint.");
  }
  const admin = asPublicKey(decoded?.admin, "Decoded Pump fee-sharing admin");
  const shareholders = validatePumpFeeShareholders(decoded?.shareholders);
  const version = Number(decoded?.version);
  if (!Number.isSafeInteger(version) || version < 1) {
    throw new Error("Pump fee-sharing config has an invalid version.");
  }
  const status = sharingConfigStatusName(decoded?.status);
  const raw = {
    ...decoded,
    version,
    mint: decodedMint,
    admin,
    shareholders
  };

  return {
    exists: true,
    address: addresses.sharingConfig,
    version,
    status,
    mint: decodedMint,
    admin,
    adminRevoked: raw.adminRevoked === true,
    editable: isSharingConfigEditable({ sharingConfig: raw }),
    finalized: version !== 1
      && status === "active"
      && raw.adminRevoked === true
      && shareholders.length === 2,
    shareholders,
    totalShareBps: shareholders.reduce((sum, row) => sum + row.shareBps, 0),
    raw,
    addresses
  };
}

/** Read a sharing config without treating an unconfigured coin as an RPC error. */
export async function readPumpFeeSharingConfig({
  connection,
  mint,
  commitment = "confirmed",
  required = false
} = {}) {
  if (!connection?.getAccountInfo) {
    throw new Error("A Solana connection is required to read Pump fee sharing.");
  }
  const addresses = getPumpFeeSharingAddresses({ mint });
  const accountInfo = await connection.getAccountInfo(
    addresses.sharingConfig,
    commitment
  );
  if (!accountInfo) {
    if (required) {
      throw new Error(`Pump fee-sharing config ${addresses.sharingConfig.toBase58()} does not exist.`);
    }
    return {
      exists: false,
      address: addresses.sharingConfig,
      mint: addresses.mint,
      quoteMint: PUMP_FEE_SHARING_QUOTE_MINT,
      addresses
    };
  }
  return decodePumpFeeSharingConfig({ mint: addresses.mint, accountInfo });
}

/** Build the permissionless PumpSwap -> Pump WSOL creator-fee sweep. */
export async function buildPumpFeeSharingTransferToPumpInstruction({
  payer,
  mint
} = {}) {
  const payerKey = asPublicKey(payer, "Pump fee distribution payer");
  const mintKey = asPublicKey(mint, "Pump fee-sharing mint");
  return PUMP_SDK.transferCreatorFeesToPumpV2({
    payer: payerKey,
    mint: mintKey,
    quoteMint: PUMP_FEE_SHARING_QUOTE_MINT,
    quoteTokenProgram: PUMP_FEE_SHARING_QUOTE_TOKEN_PROGRAM
  });
}

function normalizeDecodedConfig(mint, sharingConfig) {
  if (!sharingConfig?.exists || !sharingConfig?.raw) {
    throw new Error("A decoded Pump fee-sharing config is required for distribution.");
  }
  const addresses = getPumpFeeSharingAddresses({ mint });
  if (!sharingConfig.address?.equals?.(addresses.sharingConfig)) {
    throw new Error("Pump fee-sharing config address does not match the requested mint.");
  }
  const shareholders = validatePumpFeeShareholders(sharingConfig.raw.shareholders);
  if (
    sharingConfig.version === 1
    || sharingConfig.status !== "active"
    || sharingConfig.raw.adminRevoked !== true
    || shareholders.length !== 2
  ) {
    throw new Error("Pump holder-reward fee sharing must be finalized before distribution.");
  }
  return {
    ...sharingConfig,
    shareholders,
    raw: { ...sharingConfig.raw, shareholders },
    addresses
  };
}

/** Build the permissionless Pump creator-vault -> shareholders distribution. */
export async function buildPumpFeeSharingDistributeInstruction({
  payer,
  mint,
  sharingConfig
} = {}) {
  const payerKey = asPublicKey(payer, "Pump fee distribution payer");
  const normalized = normalizeDecodedConfig(mint, sharingConfig);
  return PUMP_SDK.distributeCreatorFeesV2({
    mint: normalized.addresses.mint,
    sharingConfig: normalized.raw,
    sharingConfigAddress: normalized.address,
    quoteMint: PUMP_FEE_SHARING_QUOTE_MINT,
    payer: payerKey,
    shouldInitializeAta: false,
    quoteTokenProgram: PUMP_FEE_SHARING_QUOTE_TOKEN_PROGRAM
  });
}

function validateWsolVaultAccount(accountInfo, addresses) {
  if (!accountInfo) return;
  if (!samePublicKey(accountInfo.owner, PUMP_FEE_SHARING_QUOTE_TOKEN_PROGRAM)) {
    throw new Error("PumpSwap creator vault is not owned by the SPL token program.");
  }
  const data = accountData(accountInfo, "PumpSwap creator WSOL vault");
  if (data.length < 72) {
    throw new Error("PumpSwap creator WSOL vault is too small to be a token account.");
  }
  const mint = new PublicKey(data.subarray(0, 32));
  const authority = new PublicKey(data.subarray(32, 64));
  if (!mint.equals(PUMP_FEE_SHARING_QUOTE_MINT)) {
    throw new Error("PumpSwap creator vault has an unexpected quote mint.");
  }
  if (!authority.equals(addresses.pumpSwapCreatorVaultAuthority)) {
    throw new Error("PumpSwap creator vault has an unexpected authority.");
  }
}

/**
 * Read the finalized config and build the permissionless distribution crank.
 * The AMM sweep is included only when the canonical pool and its WSOL creator
 * vault both exist; bonding-curve-only coins receive only the Pump distribute
 * instruction.
 */
export async function buildPumpFeeSharingDistributionInstructions({
  connection,
  payer,
  mint,
  commitment = "confirmed"
} = {}) {
  if (!connection?.getMultipleAccountsInfo) {
    throw new Error("A Solana connection is required to build Pump fee distribution.");
  }
  const payerKey = asPublicKey(payer, "Pump fee distribution payer");
  const addresses = getPumpFeeSharingAddresses({ mint });
  const infos = await connection.getMultipleAccountsInfo([
    addresses.sharingConfig,
    addresses.canonicalPool,
    addresses.pumpSwapCreatorVaultWsolAta
  ], commitment);
  if (!Array.isArray(infos) || infos.length !== 3) {
    throw new Error("Solana RPC returned an incomplete Pump fee-sharing account response.");
  }
  const [sharingConfigInfo, poolInfo, pumpSwapVaultInfo] = infos;
  const sharingConfig = normalizeDecodedConfig(
    addresses.mint,
    decodePumpFeeSharingConfig({
      mint: addresses.mint,
      accountInfo: sharingConfigInfo
    })
  );

  const isGraduated = Boolean(poolInfo);
  if (poolInfo && !samePublicKey(poolInfo.owner, PUMP_AMM_PROGRAM_ID)) {
    throw new Error("Pump canonical pool is not owned by the official PumpSwap program.");
  }
  if (!isGraduated && pumpSwapVaultInfo) {
    throw new Error("PumpSwap creator vault exists without the canonical graduated pool.");
  }
  validateWsolVaultAccount(pumpSwapVaultInfo, addresses);

  const transferToPump = isGraduated && pumpSwapVaultInfo
    ? await buildPumpFeeSharingTransferToPumpInstruction({
      payer: payerKey,
      mint: addresses.mint
    })
    : null;
  const distribute = await buildPumpFeeSharingDistributeInstruction({
    payer: payerKey,
    mint: addresses.mint,
    sharingConfig
  });

  return {
    instructions: [transferToPump, distribute].filter(Boolean),
    byProgram: {
      pumpAmm: transferToPump,
      pump: distribute
    },
    payer: payerKey,
    sharingConfig,
    addresses,
    isGraduated,
    hasPumpSwapCreatorVault: Boolean(pumpSwapVaultInfo),
    programIds: {
      pumpFees: PUMP_FEE_PROGRAM_ID,
      pumpAmm: PUMP_AMM_PROGRAM_ID,
      pump: PUMP_PROGRAM_ID
    }
  };
}
