// The bubble-map "one wallet holds all" bug: pool/curve/burn wallets must never render as holders.
// excludePoolOwnerRows is the shared funnel filter for holder rows (Solana Tracker path included).
import test from "node:test";
import assert from "node:assert/strict";
import { excludePoolOwnerRows, KNOWN_POOL_WALLETS, POOL_OWNER_PROGRAMS } from "../src/lib/onchainHolders.js";

const HOLDER_A = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"; // arbitrary real-looking wallets
const HOLDER_B = "9yQNfPFbAY5cyBgQZzGb6FqYmk8YBAJKRoWZ9zS2ky3V";
const CURVE = "BpjE1xtJFHTgTTS6cwoBCGWi1mEkGkgYaAvXWZ2P4LMB";  // classified as LaunchLab-owned below
const LAUNCHLAB = "LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj";
const RAYDIUM_V4_AUTH = [...KNOWN_POOL_WALLETS][0];

function fakeRpcRead(programByWallet) {
  return async (_label, fn) => fn({
    getMultipleAccountsInfo: async (pks) => pks.map((pk) => {
      const prog = programByWallet[pk.toBase58()];
      return prog ? { owner: { toBase58: () => prog } } : null;
    }),
  });
}

test("drops a bonding-curve wallet classified by owner program (LaunchLab)", async () => {
  assert.ok(POOL_OWNER_PROGRAMS.has(LAUNCHLAB), "LaunchLab program must be in the pool set");
  const rows = [
    { wallet: CURVE, pct: 93.4 },
    { wallet: HOLDER_A, pct: 2.1 },
    { wallet: HOLDER_B, pct: 1.4 },
  ];
  const out = await excludePoolOwnerRows(rows, { rpcRead: fakeRpcRead({ [CURVE]: LAUNCHLAB }) });
  assert.deepEqual(out.map((r) => r.wallet), [HOLDER_A, HOLDER_B]);
});

test("drops known pool-authority wallets even when classification fails", async () => {
  const rows = [
    { wallet: RAYDIUM_V4_AUTH, pct: 88 },
    { wallet: HOLDER_A, pct: 3 },
  ];
  const failingRead = async () => { throw new Error("rpc down"); };
  const out = await excludePoolOwnerRows(rows, { rpcRead: failingRead });
  assert.deepEqual(out.map((r) => r.wallet), [HOLDER_A]);
});

test("keeps real holders untouched when nothing classifies as a pool", async () => {
  const rows = [{ wallet: HOLDER_A, pct: 5 }, { wallet: HOLDER_B, pct: 4 }];
  const out = await excludePoolOwnerRows(rows, { rpcRead: fakeRpcRead({}) });
  assert.equal(out.length, 2);
});

test("survives missing rpcRead (returns rows minus known/burn only)", async () => {
  const rows = [{ wallet: HOLDER_A, pct: 5 }, { wallet: RAYDIUM_V4_AUTH, pct: 50 }];
  const out = await excludePoolOwnerRows(rows, {});
  assert.deepEqual(out.map((r) => r.wallet), [HOLDER_A]);
});
