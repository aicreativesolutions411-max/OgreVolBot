import assert from "node:assert/strict";
import test from "node:test";
import {
  Connection,
  Keypair,
  PublicKey
} from "@solana/web3.js";
import {
  PUMP_AMM_PROGRAM_ID,
  PUMP_PROGRAM_ID
} from "@pump-fun/pump-sdk";
import {
  PUMP_TOKEN_PROGRAM_ID,
  PUMP_WRAPPED_SOL_MINT,
  buildPumpCashbackClaimInstructions,
  buildPumpCreatorClaimInstructions,
  getPumpRewardAddresses,
  getPumpRewardBalances
} from "../src/lib/pumpRewards.js";

function accountInfo({
  lamports = 0,
  data = Buffer.alloc(0),
  owner = PUMP_PROGRAM_ID
} = {}) {
  return {
    executable: false,
    lamports,
    owner,
    rentEpoch: 0,
    data
  };
}

function tokenAccountInfo({ authority, amount }) {
  const data = Buffer.alloc(165);
  PUMP_WRAPPED_SOL_MINT.toBuffer().copy(data, 0);
  authority.toBuffer().copy(data, 32);
  data.writeBigUInt64LE(BigInt(amount), 64);
  return accountInfo({
    lamports: 2_039_280,
    data,
    owner: PUMP_TOKEN_PROGRAM_ID
  });
}

function mockConnection({ accounts = new Map(), rentBySize = new Map() } = {}) {
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  connection.getMultipleAccountsInfo = async (keys) => keys.map(
    (key) => accounts.get(key.toBase58()) ?? null
  );
  connection.getMinimumBalanceForRentExemption = async (size) => (
    rentBySize.get(size) ?? 0
  );
  return connection;
}

function populatedFixture() {
  const wallet = Keypair.generate().publicKey;
  const addresses = getPumpRewardAddresses(wallet);
  const accounts = new Map();
  const put = (address, info) => accounts.set(address.toBase58(), info);

  put(addresses.creatorCurveVault, accountInfo({
    lamports: 11_000,
    data: Buffer.alloc(0)
  }));
  put(addresses.creatorAmmVaultWsolAta, tokenAccountInfo({
    authority: addresses.creatorAmmVaultAuthority,
    amount: 2_500n
  }));
  put(addresses.cashbackCurveAccumulator, accountInfo({
    lamports: 9_000,
    data: Buffer.alloc(128)
  }));
  put(addresses.cashbackAmmAccumulator, accountInfo({
    lamports: 1,
    data: Buffer.alloc(128),
    owner: PUMP_AMM_PROGRAM_ID
  }));
  put(addresses.cashbackAmmAccumulatorWsolAta, tokenAccountInfo({
    authority: addresses.cashbackAmmAccumulator,
    amount: 3_750n
  }));

  return {
    wallet,
    addresses,
    connection: mockConnection({
      accounts,
      rentBySize: new Map([
        [0, 1_000],
        [128, 2_000]
      ])
    })
  };
}

function instructionKeys(instruction) {
  return new Set(instruction.keys.map(({ pubkey }) => pubkey.toBase58()));
}

test("Pump reward PDAs keep curve and AMM accumulators and creator vaults separate", () => {
  const wallet = Keypair.generate().publicKey;
  const addresses = getPumpRewardAddresses(wallet);

  assert.notEqual(
    addresses.creatorCurveVault.toBase58(),
    addresses.creatorAmmVaultAuthority.toBase58()
  );
  assert.notEqual(
    addresses.cashbackCurveAccumulator.toBase58(),
    addresses.cashbackAmmAccumulator.toBase58()
  );
  assert.notEqual(
    addresses.cashbackCurveAccumulatorWsolAta.toBase58(),
    addresses.cashbackAmmAccumulatorWsolAta.toBase58()
  );
  assert.ok(addresses.walletWsolAta instanceof PublicKey);
});

test("reads authoritative wallet-level Pump creator and cash-back balances", async () => {
  const { wallet, addresses, connection } = populatedFixture();
  const balances = await getPumpRewardBalances({ connection, wallet });

  assert.equal(balances.scope, "wallet");
  assert.equal(balances.wallet, wallet.toBase58());
  assert.deepEqual(balances.creator, {
    curveLamports: "10000",
    ammWsolAtomic: "2500",
    totalAtomic: "12500"
  });
  assert.deepEqual(balances.cashback, {
    curveLamports: "7000",
    ammWsolAtomic: "3750",
    totalAtomic: "10750"
  });
  assert.equal(balances.accounts.creator.curveVault.exists, true);
  assert.equal(balances.accounts.creator.ammVaultWsolAta.exists, true);
  assert.equal(balances.accounts.cashback.ammAccumulator.exists, true);
  assert.equal(balances.accounts.cashback.ammAccumulatorWsolAta.exists, true);
  assert.equal(balances.accounts.walletWsolAta.exists, false);
  assert.equal(
    balances.accounts.cashback.ammAccumulator.address,
    addresses.cashbackAmmAccumulator.toBase58()
  );
});

test("missing Pump reward accounts are valid zero balances", async () => {
  const wallet = Keypair.generate().publicKey;
  let rentCalls = 0;
  const connection = mockConnection();
  connection.getMinimumBalanceForRentExemption = async () => {
    rentCalls += 1;
    return 0;
  };

  const balances = await getPumpRewardBalances({ connection, wallet });
  assert.equal(balances.creator.totalAtomic, "0");
  assert.equal(balances.cashback.totalAtomic, "0");
  assert.equal(balances.accounts.creator.curveVault.exists, false);
  assert.equal(balances.accounts.cashback.ammAccumulatorWsolAta.exists, false);
  assert.equal(rentCalls, 0);
});

test("RPC and malformed existing-account failures are surfaced", async (t) => {
  await t.test("account RPC errors propagate", async () => {
    const wallet = Keypair.generate().publicKey;
    const connection = mockConnection();
    connection.getMultipleAccountsInfo = async () => {
      throw new Error("rpc unavailable");
    };
    await assert.rejects(
      getPumpRewardBalances({ connection, wallet }),
      /rpc unavailable/
    );
  });

  await t.test("rent RPC errors propagate", async () => {
    const wallet = Keypair.generate().publicKey;
    const addresses = getPumpRewardAddresses(wallet);
    const accounts = new Map([
      [addresses.creatorCurveVault.toBase58(), accountInfo({ lamports: 1 })]
    ]);
    const connection = mockConnection({ accounts });
    connection.getMinimumBalanceForRentExemption = async () => {
      throw new Error("rent rpc unavailable");
    };
    await assert.rejects(
      getPumpRewardBalances({ connection, wallet }),
      /rent rpc unavailable/
    );
  });

  await t.test("malformed token accounts do not become silent zeroes", async () => {
    const wallet = Keypair.generate().publicKey;
    const addresses = getPumpRewardAddresses(wallet);
    const accounts = new Map([
      [addresses.creatorAmmVaultWsolAta.toBase58(), accountInfo({
        data: Buffer.alloc(20),
        owner: PUMP_TOKEN_PROGRAM_ID
      })]
    ]);
    await assert.rejects(
      getPumpRewardBalances({
        connection: mockConnection({ accounts }),
        wallet
      }),
      /too small to be a token account/
    );
  });
});

test("builds official Pump and PumpSwap creator claim instructions", async () => {
  const { wallet, addresses, connection } = populatedFixture();
  const feePayer = Keypair.generate().publicKey;
  const result = await buildPumpCreatorClaimInstructions({
    connection,
    creator: wallet,
    feePayer
  });

  assert.equal(result.scope, "wallet");
  assert.equal(result.feePayer, feePayer.toBase58());
  assert.equal(result.instructions.length, 2);
  assert.equal(result.byProgram.pump.programId.toBase58(), PUMP_PROGRAM_ID.toBase58());
  assert.equal(
    result.byProgram.pumpAmm.programId.toBase58(),
    PUMP_AMM_PROGRAM_ID.toBase58()
  );

  const pumpKeys = instructionKeys(result.byProgram.pump);
  assert.ok(pumpKeys.has(wallet.toBase58()));
  assert.ok(pumpKeys.has(addresses.creatorCurveVault.toBase58()));
  assert.ok(pumpKeys.has(addresses.creatorCurveVaultWsolAta.toBase58()));
  assert.ok(pumpKeys.has(addresses.walletWsolAta.toBase58()));

  const ammKeys = instructionKeys(result.byProgram.pumpAmm);
  assert.ok(ammKeys.has(wallet.toBase58()));
  assert.ok(ammKeys.has(addresses.creatorAmmVaultAuthority.toBase58()));
  assert.ok(ammKeys.has(addresses.creatorAmmVaultWsolAta.toBase58()));
  assert.ok(ammKeys.has(addresses.walletWsolAta.toBase58()));
  assert.equal(result.wsolAccounts.destination.exists, false);
});

test("builds official Pump and PumpSwap cash-back claim instructions", async () => {
  const { wallet, addresses, connection } = populatedFixture();
  const result = await buildPumpCashbackClaimInstructions({
    connection,
    user: wallet
  });

  assert.equal(result.instructions.length, 2);
  assert.equal(result.byProgram.pump.programId.toBase58(), PUMP_PROGRAM_ID.toBase58());
  assert.equal(
    result.byProgram.pumpAmm.programId.toBase58(),
    PUMP_AMM_PROGRAM_ID.toBase58()
  );

  const pumpKeys = instructionKeys(result.byProgram.pump);
  assert.ok(pumpKeys.has(wallet.toBase58()));
  assert.ok(pumpKeys.has(addresses.cashbackCurveAccumulator.toBase58()));
  assert.ok(pumpKeys.has(addresses.cashbackCurveAccumulatorWsolAta.toBase58()));
  assert.ok(pumpKeys.has(addresses.walletWsolAta.toBase58()));

  const ammKeys = instructionKeys(result.byProgram.pumpAmm);
  assert.ok(ammKeys.has(wallet.toBase58()));
  assert.ok(ammKeys.has(addresses.cashbackAmmAccumulator.toBase58()));
  assert.ok(ammKeys.has(addresses.cashbackAmmAccumulatorWsolAta.toBase58()));
  assert.ok(ammKeys.has(addresses.walletWsolAta.toBase58()));
  assert.equal(result.wsolAccounts.destination.exists, false);
});

test("claim builders omit programs with no wallet-level claimable balance", async () => {
  const wallet = Keypair.generate().publicKey;
  const connection = mockConnection();

  const [creator, cashback] = await Promise.all([
    buildPumpCreatorClaimInstructions({ connection, creator: wallet }),
    buildPumpCashbackClaimInstructions({ connection, user: wallet })
  ]);

  assert.deepEqual(creator.instructions, []);
  assert.equal(creator.byProgram.pump, null);
  assert.equal(creator.byProgram.pumpAmm, null);
  assert.deepEqual(cashback.instructions, []);
  assert.equal(cashback.byProgram.pump, null);
  assert.equal(cashback.byProgram.pumpAmm, null);
});
