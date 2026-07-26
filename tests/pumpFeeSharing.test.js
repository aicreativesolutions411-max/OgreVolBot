import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import {
  Connection,
  Keypair,
  PublicKey
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import {
  PUMP_FEE_SHARING_MAX_SHAREHOLDERS,
  PUMP_FEE_SHARING_QUOTE_MINT,
  PUMP_FEE_SHARING_TOTAL_BPS,
  buildPumpFeeSharingCreateConfigInstruction,
  buildPumpFeeSharingDistributeInstruction,
  buildPumpFeeSharingDistributionInstructions,
  buildPumpFeeSharingOneTimeUpdateInstruction,
  buildPumpFeeSharingTransferToPumpInstruction,
  buildPumpHolderRewardsFeeSharingSetup,
  buildPumpHolderRewardsShareholders,
  decodePumpFeeSharingConfig,
  getPumpFeeSharingAddresses,
  readPumpFeeSharingConfig,
  validatePumpFeeShareholders
} from "../src/lib/pumpFeeSharing.js";

const requireModule = createRequire(import.meta.url);
const {
  PUMP_FEE_PROGRAM_ID,
  PUMP_SDK,
  canonicalPumpPoolPda,
  getPumpFeeProgram
} = requireModule("@pump-fun/pump-sdk");
const {
  PUMP_AMM_PROGRAM_ID,
  PUMP_PROGRAM_ID
} = requireModule("@pump-fun/pump-swap-sdk");

const offlineConnection = new Connection("http://127.0.0.1:8899", "confirmed");

function key() {
  return Keypair.generate().publicKey;
}

function accountInfo({ owner, data = Buffer.alloc(0), lamports = 1 } = {}) {
  return {
    executable: false,
    lamports,
    owner,
    rentEpoch: 0,
    data
  };
}

async function sharingConfigAccount({
  mint,
  creator,
  rewardsVault,
  creatorShareBps = 7_500,
  rewardsShareBps = 2_500,
  adminRevoked = true,
  version = 2,
  encodedMint = mint
}) {
  const data = await getPumpFeeProgram(offlineConnection).coder.accounts.encode(
    "sharingConfig",
    {
      bump: 255,
      version,
      status: { active: {} },
      mint: encodedMint,
      admin: creator,
      adminRevoked,
      shareholders: [
        { address: creator, shareBps: creatorShareBps },
        { address: rewardsVault, shareBps: rewardsShareBps }
      ]
    }
  );
  return accountInfo({ owner: PUMP_FEE_PROGRAM_ID, data });
}

function wsolVaultAccount({ authority, amount = 1n }) {
  const data = Buffer.alloc(165);
  PUMP_FEE_SHARING_QUOTE_MINT.toBuffer().copy(data, 0);
  authority.toBuffer().copy(data, 32);
  data.writeBigUInt64LE(amount, 64);
  return accountInfo({ owner: TOKEN_PROGRAM_ID, data, lamports: 2_039_280 });
}

function instructionKeySet(instruction) {
  return new Set(instruction.keys.map(({ pubkey }) => pubkey.toBase58()));
}

test("SlimeWire Pump fee shares are capped at two recipients and total exactly 10,000 bps", () => {
  assert.equal(PUMP_FEE_SHARING_TOTAL_BPS, 10_000);
  assert.equal(PUMP_FEE_SHARING_MAX_SHAREHOLDERS, 2);
  const creator = key();
  const rewardsVault = key();
  const rows = validatePumpFeeShareholders([
    { address: creator.toBase58(), shareBps: 7_500 },
    { address: rewardsVault, shareBps: 2_500 }
  ]);
  assert.ok(rows[0].address instanceof PublicKey);
  assert.equal(rows[0].shareBps + rows[1].shareBps, 10_000);

  assert.throws(
    () => validatePumpFeeShareholders([
      { address: key(), shareBps: 3_334 },
      { address: key(), shareBps: 3_333 },
      { address: key(), shareBps: 3_333 }
    ]),
    /at most 2 shareholders/
  );
  assert.throws(
    () => validatePumpFeeShareholders([
      { address: creator, shareBps: 8_000 },
      { address: rewardsVault, shareBps: 1_999 }
    ]),
    /exactly 10000 bps/i
  );
  assert.throws(
    () => validatePumpFeeShareholders([
      { address: creator, shareBps: 5_000 },
      { address: creator, shareBps: 5_000 }
    ]),
    /duplicate/
  );
  assert.throws(
    () => validatePumpFeeShareholders([
      { address: PublicKey.default, shareBps: 10_000 }
    ]),
    /default Solana public key/
  );
});

test("holder-reward split derives the creator remainder and requires a distinct spendable vault", () => {
  const creator = key();
  const holderRewardsVault = key();
  const rows = buildPumpHolderRewardsShareholders({
    creator,
    holderRewardsVault,
    holderRewardsShareBps: 1_500
  });
  assert.deepEqual(rows.map(({ address, shareBps }) => ({
    address: address.toBase58(),
    shareBps
  })), [
    { address: creator.toBase58(), shareBps: 8_500 },
    { address: holderRewardsVault.toBase58(), shareBps: 1_500 }
  ]);
  assert.throws(
    () => buildPumpHolderRewardsShareholders({
      creator,
      holderRewardsVault: creator,
      holderRewardsShareBps: 1_500
    }),
    /different from the creator/
  );
  assert.throws(
    () => buildPumpHolderRewardsShareholders({
      creator,
      holderRewardsVault,
      holderRewardsShareBps: 1_500,
      creatorShareBps: 8_499
    }),
    /must be 8500 bps/
  );
});

test("official setup builder emits create plus the one-time V2 final share update", async () => {
  const creator = key();
  const mint = key();
  const holderRewardsVault = key();
  const pool = canonicalPumpPoolPda(mint);
  const setup = await buildPumpHolderRewardsFeeSharingSetup({
    creator,
    mint,
    pool,
    holderRewardsVault,
    holderRewardsShareBps: 2_000
  });

  assert.equal(setup.instructions.length, 2);
  assert.equal(setup.byStep.createConfig.programId.toBase58(), PUMP_FEE_PROGRAM_ID.toBase58());
  assert.equal(setup.byStep.finalizeShares.programId.toBase58(), PUMP_FEE_PROGRAM_ID.toBase58());
  assert.deepEqual(setup.shareholders.map(({ shareBps }) => shareBps), [8_000, 2_000]);
  assert.equal(setup.requiredSigners[0].toBase58(), creator.toBase58());
  assert.equal(setup.addresses.sharingConfig.toBase58(), getPumpFeeSharingAddresses({ mint }).sharingConfig.toBase58());
  assert.equal(setup.isGraduated, true);

  const updateKeys = instructionKeySet(setup.byStep.finalizeShares);
  assert.ok(updateKeys.has(creator.toBase58()));
  assert.ok(updateKeys.has(mint.toBase58()));
  const decodedUpdate = getPumpFeeProgram(offlineConnection).coder.instruction.decode(
    setup.byStep.finalizeShares.data
  );
  assert.equal(decodedUpdate.name, "updateFeeSharesV2");
  assert.deepEqual(
    decodedUpdate.data.shareholders.map(({ address, shareBps }) => ({
      address: address.toBase58(),
      shareBps
    })),
    [
      { address: creator.toBase58(), shareBps: 8_000 },
      { address: holderRewardsVault.toBase58(), shareBps: 2_000 }
    ]
  );
  await assert.rejects(
    buildPumpHolderRewardsFeeSharingSetup({
      creator,
      mint,
      pool: key(),
      holderRewardsVault,
      holderRewardsShareBps: 2_000
    }),
    /requires the canonical pool/
  );
});

test("standalone official create and update builders remain easy to compose", async () => {
  const creator = key();
  const mint = key();
  const holderRewardsVault = key();
  const [create, update] = await Promise.all([
    buildPumpFeeSharingCreateConfigInstruction({ creator, mint }),
    buildPumpFeeSharingOneTimeUpdateInstruction({
      creator,
      mint,
      holderRewardsVault,
      holderRewardsShareBps: 1_000
    })
  ]);
  assert.equal(create.programId.toBase58(), PUMP_FEE_PROGRAM_ID.toBase58());
  assert.equal(update.programId.toBase58(), PUMP_FEE_PROGRAM_ID.toBase58());
});

test("sharing config read/decode verifies the Pump owner, mint and finalized two-share split", async () => {
  const mint = key();
  const creator = key();
  const rewardsVault = key();
  const info = await sharingConfigAccount({ mint, creator, rewardsVault });
  const decoded = decodePumpFeeSharingConfig({ mint, accountInfo: info });
  assert.equal(decoded.exists, true);
  assert.equal(decoded.version, 2);
  assert.equal(decoded.status, "active");
  assert.equal(decoded.adminRevoked, true);
  assert.equal(decoded.editable, false);
  assert.equal(decoded.finalized, true);
  assert.equal(decoded.totalShareBps, 10_000);
  assert.deepEqual(decoded.shareholders.map(({ address }) => address.toBase58()), [
    creator.toBase58(),
    rewardsVault.toBase58()
  ]);

  const connection = {
    getAccountInfo: async (address, commitment) => {
      assert.equal(address.toBase58(), getPumpFeeSharingAddresses({ mint }).sharingConfig.toBase58());
      assert.equal(commitment, "processed");
      return info;
    }
  };
  const read = await readPumpFeeSharingConfig({
    connection,
    mint,
    commitment: "processed"
  });
  assert.equal(read.address.toBase58(), decoded.address.toBase58());

  const absent = await readPumpFeeSharingConfig({
    connection: { getAccountInfo: async () => null },
    mint
  });
  assert.equal(absent.exists, false);
  await assert.rejects(
    readPumpFeeSharingConfig({
      connection: { getAccountInfo: async () => null },
      mint,
      required: true
    }),
    /does not exist/
  );
  assert.throws(
    () => decodePumpFeeSharingConfig({
      mint,
      accountInfo: { ...info, owner: PUMP_PROGRAM_ID }
    }),
    /official Pump Fees program/
  );
});

test("sharing config rejects an otherwise valid account encoded for another mint", async () => {
  const mint = key();
  const creator = key();
  const rewardsVault = key();
  const info = await sharingConfigAccount({
    mint,
    encodedMint: key(),
    creator,
    rewardsVault
  });
  assert.throws(
    () => decodePumpFeeSharingConfig({ mint, accountInfo: info }),
    /mint does not match/
  );
});

test("permissionless V2 transfer and distribute builders use the official programs", async () => {
  const payer = key();
  const mint = key();
  const creator = key();
  const rewardsVault = key();
  const info = await sharingConfigAccount({ mint, creator, rewardsVault });
  const sharingConfig = decodePumpFeeSharingConfig({ mint, accountInfo: info });
  const [transfer, distribute] = await Promise.all([
    buildPumpFeeSharingTransferToPumpInstruction({ payer, mint }),
    buildPumpFeeSharingDistributeInstruction({
      payer,
      mint,
      sharingConfig
    })
  ]);
  assert.equal(transfer.programId.toBase58(), PUMP_AMM_PROGRAM_ID.toBase58());
  assert.equal(distribute.programId.toBase58(), PUMP_PROGRAM_ID.toBase58());
  const transferKeys = instructionKeySet(transfer);
  assert.ok(transferKeys.has(payer.toBase58()));
  assert.ok(transferKeys.has(PUMP_FEE_SHARING_QUOTE_MINT.toBase58()));
  const distributeKeys = instructionKeySet(distribute);
  assert.ok(distributeKeys.has(mint.toBase58()));
  assert.ok(distributeKeys.has(creator.toBase58()));
  assert.ok(distributeKeys.has(rewardsVault.toBase58()));
});

test("distribution crank adds the PumpSwap sweep only for a graduated pool with a real WSOL vault", async () => {
  const payer = key();
  const mint = key();
  const creator = key();
  const rewardsVault = key();
  const addresses = getPumpFeeSharingAddresses({ mint });
  const configInfo = await sharingConfigAccount({ mint, creator, rewardsVault });
  const poolInfo = accountInfo({ owner: PUMP_AMM_PROGRAM_ID });
  const vaultInfo = wsolVaultAccount({
    authority: addresses.pumpSwapCreatorVaultAuthority,
    amount: 123n
  });
  const connection = {
    getMultipleAccountsInfo: async (requested, commitment) => {
      assert.deepEqual(requested.map((address) => address.toBase58()), [
        addresses.sharingConfig.toBase58(),
        addresses.canonicalPool.toBase58(),
        addresses.pumpSwapCreatorVaultWsolAta.toBase58()
      ]);
      assert.equal(commitment, "confirmed");
      return [configInfo, poolInfo, vaultInfo];
    }
  };
  const graduated = await buildPumpFeeSharingDistributionInstructions({
    connection,
    payer,
    mint
  });
  assert.equal(graduated.instructions.length, 2);
  assert.equal(graduated.isGraduated, true);
  assert.equal(graduated.byProgram.pumpAmm.programId.toBase58(), PUMP_AMM_PROGRAM_ID.toBase58());
  assert.equal(graduated.byProgram.pump.programId.toBase58(), PUMP_PROGRAM_ID.toBase58());

  const bondingOnly = await buildPumpFeeSharingDistributionInstructions({
    connection: {
      getMultipleAccountsInfo: async () => [configInfo, null, null]
    },
    payer,
    mint
  });
  assert.equal(bondingOnly.instructions.length, 1);
  assert.equal(bondingOnly.isGraduated, false);
  assert.equal(bondingOnly.byProgram.pumpAmm, null);
});

test("distribution refuses unfinalized configs and malformed PumpSwap vaults", async () => {
  const payer = key();
  const mint = key();
  const creator = key();
  const rewardsVault = key();
  const addresses = getPumpFeeSharingAddresses({ mint });
  const unfinalized = await sharingConfigAccount({
    mint,
    creator,
    rewardsVault,
    adminRevoked: false
  });
  await assert.rejects(
    buildPumpFeeSharingDistributionInstructions({
      connection: {
        getMultipleAccountsInfo: async () => [unfinalized, null, null]
      },
      payer,
      mint
    }),
    /must be finalized/
  );

  const finalized = await sharingConfigAccount({ mint, creator, rewardsVault });
  await assert.rejects(
    buildPumpFeeSharingDistributionInstructions({
      connection: {
        getMultipleAccountsInfo: async () => [
          finalized,
          accountInfo({ owner: PUMP_AMM_PROGRAM_ID }),
          wsolVaultAccount({ authority: key() })
        ]
      },
      payer,
      mint
    }),
    /unexpected authority/
  );

  await assert.rejects(
    buildPumpFeeSharingDistributionInstructions({
      connection: {
        getMultipleAccountsInfo: async () => [
          finalized,
          null,
          wsolVaultAccount({ authority: addresses.pumpSwapCreatorVaultAuthority })
        ]
      },
      payer,
      mint
    }),
    /without the canonical graduated pool/
  );
});

test("module uses the installed official SDK instruction surface", () => {
  for (const method of [
    "createFeeSharingConfig",
    "updateFeeSharesV2",
    "transferCreatorFeesToPumpV2",
    "distributeCreatorFeesV2",
    "decodeSharingConfig"
  ]) {
    assert.equal(typeof PUMP_SDK[method], "function");
  }
});
