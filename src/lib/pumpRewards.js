import {
  PublicKey,
  SystemProgram
} from "@solana/web3.js";
import {
  PUMP_AMM_EVENT_AUTHORITY_PDA,
  PUMP_AMM_PROGRAM_ID,
  PUMP_EVENT_AUTHORITY_PDA,
  PUMP_PROGRAM_ID,
  PUMP_SDK,
  ammCreatorVaultPda,
  creatorVaultPda,
  getPumpAmmProgram,
  getPumpProgram,
  quoteAta,
  userVolumeAccumulatorPda
} from "@pump-fun/pump-sdk";

// Pump's legacy SOL quote is represented by wrapped SOL in token accounts.
export const PUMP_WRAPPED_SOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);
export const PUMP_TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
export const PUMP_ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

function asPublicKey(value, label) {
  try {
    return value instanceof PublicKey ? value : new PublicKey(String(value || ""));
  } catch {
    throw new Error(`${label} is not a valid Solana public key.`);
  }
}

function accountDataBuffer(accountInfo, label) {
  const data = accountInfo?.data;
  if (!data || typeof data.length !== "number") {
    throw new Error(`${label} returned malformed account data.`);
  }
  return Buffer.isBuffer(data) ? data : Buffer.from(data);
}

function safeIntegerBigInt(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} returned an unsafe lamport value.`);
  }
  return BigInt(value);
}

function tokenAccountAmount(accountInfo, {
  address,
  expectedMint,
  expectedOwner
}) {
  if (!accountInfo) return 0n;
  if (!accountInfo.owner?.equals?.(PUMP_TOKEN_PROGRAM_ID)) {
    throw new Error(`Pump WSOL account ${address.toBase58()} is not owned by the token program.`);
  }

  const data = accountDataBuffer(accountInfo, `Pump WSOL account ${address.toBase58()}`);
  if (data.length < 72) {
    throw new Error(`Pump WSOL account ${address.toBase58()} is too small to be a token account.`);
  }

  const mint = new PublicKey(data.subarray(0, 32));
  const owner = new PublicKey(data.subarray(32, 64));
  if (!mint.equals(expectedMint)) {
    throw new Error(`Pump WSOL account ${address.toBase58()} has an unexpected mint.`);
  }
  if (!owner.equals(expectedOwner)) {
    throw new Error(`Pump WSOL account ${address.toBase58()} has an unexpected authority.`);
  }
  return data.readBigUInt64LE(64);
}

async function spendableLamports(connection, accountInfo, label, commitment) {
  if (!accountInfo) return 0n;
  const data = accountDataBuffer(accountInfo, label);
  const minimum = await connection.getMinimumBalanceForRentExemption(
    data.length,
    commitment
  );
  const lamports = safeIntegerBigInt(accountInfo.lamports, `${label} balance`);
  const rent = safeIntegerBigInt(minimum, `${label} rent exemption`);
  return lamports > rent ? lamports - rent : 0n;
}

/**
 * Derive the wallet-level Pump reward accounts. These accounts aggregate all
 * coins for a wallet; none of the returned values represent per-token fees.
 */
export function getPumpRewardAddresses(wallet) {
  const owner = asPublicKey(wallet, "Pump rewards wallet");
  const creatorCurveVault = creatorVaultPda(owner);
  const creatorAmmVaultAuthority = ammCreatorVaultPda(owner);
  const cashbackCurveAccumulator = userVolumeAccumulatorPda(owner);
  const cashbackAmmAccumulator = userVolumeAccumulatorPda(
    owner,
    PUMP_AMM_PROGRAM_ID
  );

  return {
    wallet: owner,
    walletWsolAta: quoteAta(owner, PUMP_WRAPPED_SOL_MINT, PUMP_TOKEN_PROGRAM_ID),
    creatorCurveVault,
    creatorCurveVaultWsolAta: quoteAta(
      creatorCurveVault,
      PUMP_WRAPPED_SOL_MINT,
      PUMP_TOKEN_PROGRAM_ID
    ),
    creatorAmmVaultAuthority,
    creatorAmmVaultWsolAta: quoteAta(
      creatorAmmVaultAuthority,
      PUMP_WRAPPED_SOL_MINT,
      PUMP_TOKEN_PROGRAM_ID
    ),
    cashbackCurveAccumulator,
    cashbackCurveAccumulatorWsolAta: quoteAta(
      cashbackCurveAccumulator,
      PUMP_WRAPPED_SOL_MINT,
      PUMP_TOKEN_PROGRAM_ID
    ),
    cashbackAmmAccumulator,
    cashbackAmmAccumulatorWsolAta: quoteAta(
      cashbackAmmAccumulator,
      PUMP_WRAPPED_SOL_MINT,
      PUMP_TOKEN_PROGRAM_ID
    )
  };
}

function addressState(address, accountInfo) {
  return {
    address: address.toBase58(),
    exists: Boolean(accountInfo)
  };
}

/**
 * Read authoritative, wallet-level Pump rewards from chain state.
 *
 * Creator rewards are the spendable lamports in Pump's creator vault plus the
 * WSOL token amount in PumpSwap's creator vault ATA. Cash back is the
 * spendable lamports in Pump's user-volume accumulator plus the WSOL token
 * amount in PumpSwap's accumulator ATA. All amounts are integer strings in
 * lamports/WSOL atomic units (both use nine decimals).
 *
 * Missing accounts are a valid zero balance. RPC failures and malformed
 * existing accounts are deliberately allowed to throw.
 */
export async function getPumpRewardBalances({
  connection,
  wallet,
  commitment = "confirmed"
} = {}) {
  if (!connection?.getMultipleAccountsInfo || !connection?.getMinimumBalanceForRentExemption) {
    throw new Error("A Solana connection is required to read Pump rewards.");
  }

  const addresses = getPumpRewardAddresses(wallet);
  const requested = [
    addresses.creatorCurveVault,
    addresses.creatorCurveVaultWsolAta,
    addresses.creatorAmmVaultWsolAta,
    addresses.cashbackCurveAccumulator,
    addresses.cashbackCurveAccumulatorWsolAta,
    addresses.cashbackAmmAccumulator,
    addresses.cashbackAmmAccumulatorWsolAta,
    addresses.walletWsolAta
  ];
  const infos = await connection.getMultipleAccountsInfo(requested, commitment);
  if (!Array.isArray(infos) || infos.length !== requested.length) {
    throw new Error("Solana RPC returned an incomplete Pump rewards account response.");
  }

  const [
    creatorCurveVaultInfo,
    creatorCurveVaultWsolAtaInfo,
    creatorAmmVaultWsolAtaInfo,
    cashbackCurveAccumulatorInfo,
    cashbackCurveAccumulatorWsolAtaInfo,
    cashbackAmmAccumulatorInfo,
    cashbackAmmAccumulatorWsolAtaInfo,
    walletWsolAtaInfo
  ] = infos;

  const [creatorCurveLamports, cashbackCurveLamports] = await Promise.all([
    spendableLamports(
      connection,
      creatorCurveVaultInfo,
      "Pump creator vault",
      commitment
    ),
    spendableLamports(
      connection,
      cashbackCurveAccumulatorInfo,
      "Pump cash-back accumulator",
      commitment
    )
  ]);
  const creatorAmmWsol = tokenAccountAmount(creatorAmmVaultWsolAtaInfo, {
    address: addresses.creatorAmmVaultWsolAta,
    expectedMint: PUMP_WRAPPED_SOL_MINT,
    expectedOwner: addresses.creatorAmmVaultAuthority
  });
  const cashbackAmmWsol = tokenAccountAmount(cashbackAmmAccumulatorWsolAtaInfo, {
    address: addresses.cashbackAmmAccumulatorWsolAta,
    expectedMint: PUMP_WRAPPED_SOL_MINT,
    expectedOwner: addresses.cashbackAmmAccumulator
  });

  return {
    scope: "wallet",
    wallet: addresses.wallet.toBase58(),
    quoteMint: PUMP_WRAPPED_SOL_MINT.toBase58(),
    atomicUnitDecimals: 9,
    creator: {
      curveLamports: creatorCurveLamports.toString(),
      ammWsolAtomic: creatorAmmWsol.toString(),
      totalAtomic: (creatorCurveLamports + creatorAmmWsol).toString()
    },
    cashback: {
      curveLamports: cashbackCurveLamports.toString(),
      ammWsolAtomic: cashbackAmmWsol.toString(),
      totalAtomic: (cashbackCurveLamports + cashbackAmmWsol).toString()
    },
    accounts: {
      walletWsolAta: addressState(addresses.walletWsolAta, walletWsolAtaInfo),
      creator: {
        curveVault: addressState(addresses.creatorCurveVault, creatorCurveVaultInfo),
        curveVaultWsolAta: addressState(
          addresses.creatorCurveVaultWsolAta,
          creatorCurveVaultWsolAtaInfo
        ),
        ammVaultAuthority: {
          address: addresses.creatorAmmVaultAuthority.toBase58()
        },
        ammVaultWsolAta: addressState(
          addresses.creatorAmmVaultWsolAta,
          creatorAmmVaultWsolAtaInfo
        )
      },
      cashback: {
        curveAccumulator: addressState(
          addresses.cashbackCurveAccumulator,
          cashbackCurveAccumulatorInfo
        ),
        curveAccumulatorWsolAta: addressState(
          addresses.cashbackCurveAccumulatorWsolAta,
          cashbackCurveAccumulatorWsolAtaInfo
        ),
        ammAccumulator: addressState(
          addresses.cashbackAmmAccumulator,
          cashbackAmmAccumulatorInfo
        ),
        ammAccumulatorWsolAta: addressState(
          addresses.cashbackAmmAccumulatorWsolAta,
          cashbackAmmAccumulatorWsolAtaInfo
        )
      }
    }
  };
}

function instructionResult({ balances, curveInstruction, ammInstruction, feePayer }) {
  const instructions = [curveInstruction, ammInstruction].filter(Boolean);
  return {
    scope: "wallet",
    feePayer: feePayer.toBase58(),
    balances,
    instructions,
    byProgram: {
      pump: curveInstruction,
      pumpAmm: ammInstruction
    },
    wsolAccounts: {
      destination: balances.accounts.walletWsolAta,
      pumpVaultOrAccumulator: balances.accounts.creator?.curveVaultWsolAta
        || balances.accounts.cashback?.curveAccumulatorWsolAta,
      pumpAmmVaultOrAccumulator: balances.accounts.creator?.ammVaultWsolAta
        || balances.accounts.cashback?.ammAccumulatorWsolAta
    }
  };
}

/**
 * Build the official Pump bonding-curve and PumpSwap creator claim
 * instructions for a creator wallet. Only programs with a positive balance
 * are included in `instructions`; `byProgram` preserves the split.
 *
 * ATA creation and optional WSOL closing intentionally remain the caller's
 * responsibility. The returned account states make those choices explicit.
 */
export async function buildPumpCreatorClaimInstructions({
  connection,
  creator,
  feePayer = creator,
  commitment = "confirmed"
} = {}) {
  const creatorKey = asPublicKey(creator, "Pump creator");
  const payerKey = asPublicKey(feePayer, "Pump creator claim fee payer");
  const balances = await getPumpRewardBalances({
    connection,
    wallet: creatorKey,
    commitment
  });
  const addresses = getPumpRewardAddresses(creatorKey);

  let curveInstruction = null;
  if (BigInt(balances.creator.curveLamports) > 0n) {
    const pumpProgram = getPumpProgram(connection);
    curveInstruction = await pumpProgram.methods
      .collectCreatorFeeV2()
      .accountsPartial({
        creator: creatorKey,
        creatorTokenAccount: addresses.walletWsolAta,
        creatorVault: addresses.creatorCurveVault,
        creatorVaultTokenAccount: addresses.creatorCurveVaultWsolAta,
        quoteMint: PUMP_WRAPPED_SOL_MINT,
        quoteTokenProgram: PUMP_TOKEN_PROGRAM_ID,
        associatedTokenProgram: PUMP_ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        eventAuthority: PUMP_EVENT_AUTHORITY_PDA,
        program: PUMP_PROGRAM_ID
      })
      .instruction();
  }

  let ammInstruction = null;
  if (BigInt(balances.creator.ammWsolAtomic) > 0n) {
    const pumpAmmProgram = getPumpAmmProgram(connection);
    ammInstruction = await pumpAmmProgram.methods
      .collectCoinCreatorFee()
      .accountsPartial({
        quoteMint: PUMP_WRAPPED_SOL_MINT,
        quoteTokenProgram: PUMP_TOKEN_PROGRAM_ID,
        coinCreator: creatorKey,
        coinCreatorVaultAuthority: addresses.creatorAmmVaultAuthority,
        coinCreatorVaultAta: addresses.creatorAmmVaultWsolAta,
        coinCreatorTokenAccount: addresses.walletWsolAta,
        eventAuthority: PUMP_AMM_EVENT_AUTHORITY_PDA,
        program: PUMP_AMM_PROGRAM_ID
      })
      .instruction();
  }

  const result = instructionResult({
    balances,
    curveInstruction,
    ammInstruction,
    feePayer: payerKey
  });
  result.wsolAccounts = {
    destination: balances.accounts.walletWsolAta,
    pumpCreatorVault: balances.accounts.creator.curveVaultWsolAta,
    pumpAmmCreatorVault: balances.accounts.creator.ammVaultWsolAta
  };
  return result;
}

/**
 * Build the official Pump and PumpSwap cash-back claim instructions for one
 * wallet. Claims are wallet-level and are never attributed to a mint.
 *
 * PumpSwap pays WSOL into the wallet ATA. The caller must add an idempotent ATA
 * creation when `wsolAccounts.destination.exists` is false and may close that
 * ATA only when it was created for this claim and closing is explicitly safe.
 */
export async function buildPumpCashbackClaimInstructions({
  connection,
  user,
  feePayer = user,
  commitment = "confirmed"
} = {}) {
  const userKey = asPublicKey(user, "Pump cash-back user");
  const payerKey = asPublicKey(feePayer, "Pump cash-back claim fee payer");
  const balances = await getPumpRewardBalances({
    connection,
    wallet: userKey,
    commitment
  });
  const addresses = getPumpRewardAddresses(userKey);

  let curveInstruction = null;
  if (BigInt(balances.cashback.curveLamports) > 0n) {
    curveInstruction = await PUMP_SDK.claimCashbackV2Instruction({
      user: userKey,
      quoteMint: PUMP_WRAPPED_SOL_MINT,
      quoteTokenProgram: PUMP_TOKEN_PROGRAM_ID
    });
  }

  let ammInstruction = null;
  if (BigInt(balances.cashback.ammWsolAtomic) > 0n) {
    const pumpAmmProgram = getPumpAmmProgram(connection);
    ammInstruction = await pumpAmmProgram.methods
      .claimCashback()
      .accountsPartial({
        user: userKey,
        userVolumeAccumulator: addresses.cashbackAmmAccumulator,
        quoteMint: PUMP_WRAPPED_SOL_MINT,
        quoteTokenProgram: PUMP_TOKEN_PROGRAM_ID,
        userVolumeAccumulatorWsolTokenAccount:
          addresses.cashbackAmmAccumulatorWsolAta,
        userWsolTokenAccount: addresses.walletWsolAta,
        systemProgram: SystemProgram.programId,
        eventAuthority: PUMP_AMM_EVENT_AUTHORITY_PDA,
        program: PUMP_AMM_PROGRAM_ID
      })
      .instruction();
  }

  const result = instructionResult({
    balances,
    curveInstruction,
    ammInstruction,
    feePayer: payerKey
  });
  result.wsolAccounts = {
    destination: balances.accounts.walletWsolAta,
    pumpAccumulator: balances.accounts.cashback.curveAccumulatorWsolAta,
    pumpAmmAccumulator: balances.accounts.cashback.ammAccumulatorWsolAta
  };
  return result;
}
