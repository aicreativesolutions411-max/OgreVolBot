import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, MintLayout } from '@solana/spl-token';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const A = Keypair.generate().publicKey.toBase58(), B = Keypair.generate().publicKey.toBase58();
const COIN = Keypair.generate().publicKey.toBase58(), QUOTE = Keypair.generate().publicKey.toBase58();
const asset = { mint: QUOTE, symbol: 'SAME', name: 'Selected coin', decimals: 6, tokenProgram: TOKEN_PROGRAM_ID.toBase58(), supported: true };
const policyInput = { creator: A, quoteMint: QUOTE, creatorShareBps: 2500, holderShareBps: 7500, partnerShareBps: 0 };
const mintAccount = (program = TOKEN_PROGRAM_ID, freeze = 0) => {
  const data = Buffer.alloc(MintLayout.span);
  MintLayout.encode({ mintAuthorityOption: 0, mintAuthority: PublicKey.default, supply: 1000000000n, decimals: 6, isInitialized: true, freezeAuthorityOption: freeze, freezeAuthority: freeze ? new PublicKey(A) : PublicKey.default }, data);
  return { owner: program, data, executable: false, lamports: 1000000 };
};

test('custom reward assets require actual mint verification, not a ticker allowlist', async () => {
  const { inspectRewardMint } = await import('../src/lib/tokenRewardAssets.js');
  assert.equal(inspectRewardMint(QUOTE, mintAccount()).decimals, 6);
  assert.throws(() => inspectRewardMint(QUOTE, mintAccount(TOKEN_2022_PROGRAM_ID)), /Token-2022/);
  assert.throws(() => inspectRewardMint(QUOTE, mintAccount(TOKEN_PROGRAM_ID, 1)), /freeze/i);
  assert.throws(() => inspectRewardMint(QUOTE, null), /mint/i);
  assert.throws(() => inspectRewardMint(QUOTE, { ...mintAccount(), data: Buffer.alloc(165) }), /mint/i);
});

test('ticker search lists distinct Solana mints and CA lookup stays exact', async () => {
  const { createRewardAssetResolver } = await import('../src/lib/tokenRewardAssets.js');
  const pair = (address, chainId = 'solana') => ({ chainId, baseToken: { address, symbol: 'SAME', name: 'Same name' }, liquidity: { usd: 25000 }, priceUsd: '0.1' });
  let rpcReads = 0, fetches = 0;
  const resolver = createRewardAssetResolver({ rpc: { getAccountInfoAndContext: async () => { rpcReads++; return { context: { slot: 12 }, value: mintAccount() }; } }, fetchImpl: async () => { fetches++; return new Response(JSON.stringify({ pairs: [pair(QUOTE), pair(COIN), pair(QUOTE), pair(A, 'ethereum')] })); } });
  const found = await resolver.search('SAME');
  assert.equal(found.length, 2);
  assert.equal(rpcReads, 0, 'typing does not poll RPC');
  assert.equal(found[0].verified, false);
  await resolver.search('SAME'); assert.equal(fetches, 1, 'searches are cached');
  const selected = await resolver.resolve(QUOTE);
  assert.equal(selected.mint, QUOTE); assert.equal(selected.supported, true); assert.equal(rpcReads, 1);
  await resolver.resolve(QUOTE); assert.equal(rpcReads, 1);
  await assert.rejects(resolver.resolve('SAME'), /address/i);
  await assert.rejects(resolver.search('https://example.com'), /ticker|address/i);
});

test('custom payout policy binds mint and full split without promising external rewards', async () => {
  const { normalizeTokenRewardPolicy } = await import('../src/lib/tokenRewardPolicy.js');
  const p = normalizeTokenRewardPolicy(policyInput, asset);
  assert.equal(p.payoutMint, QUOTE); assert.equal(p.quoteMint, QUOTE); assert.equal(p.cadenceHours, 12);
  assert.equal(p.minimumHoldingUsd, 20); assert.equal(p.funding, 'net-quote-trading-fees');
  assert.throws(() => normalizeTokenRewardPolicy({ ...policyInput, holderShareBps: 7400 }, asset), /100%/);
  assert.throws(() => normalizeTokenRewardPolicy({ ...policyInput, quoteMint: COIN }, asset), /match/);
  assert.throws(() => normalizeTokenRewardPolicy(policyInput, { ...asset, supported: false }), /supported/);
  assert.throws(() => normalizeTokenRewardPolicy({ ...policyInput, creatorShareBps: -1, holderShareBps: 10001 }, asset), /percentage/);
});

test('recognized exact ticker mints precede look-alikes without automatic verification', async () => {
  const { createRewardAssetResolver } = await import('../src/lib/tokenRewardAssets.js');
  const bonk = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
  const row = (address, liquidity) => ({ chainId: 'solana', baseToken: { address, symbol: 'BONK', name: 'BONK' }, priceUsd: '0.00001', liquidity: { usd: liquidity } });
  const resolver = createRewardAssetResolver({ fetchImpl: async()=> new Response(JSON.stringify({ pairs:[row(QUOTE,900000000),row(bonk,10000000)] })) });
  const rows = await resolver.search('BONK');
  assert.equal(rows[0].mint, bonk); assert.equal(rows[0].referenceMint, true); assert.equal(rows[0].verified, false);
  assert.equal(rows[1].mint, QUOTE); assert.equal(rows[1].referenceMint, false);
  const exact = await resolver.search(QUOTE); assert.equal(exact.length, 1); assert.equal(exact[0].mint, QUOTE);
});

test('allocations use exact raw units, preserve dust, keep source totals and cannot allocate twice', async () => {
  const { normalizeTokenRewardPolicy } = await import('../src/lib/tokenRewardPolicy.js');
  const { createRewardLedger, recordRewardCollection, allocateTokenRewards, rewardLiabilities } = await import('../src/lib/tokenRewardLedger.js');
  const p = normalizeTokenRewardPolicy(policyInput, asset), time = 1800000000000;
  let s = createRewardLedger({ mint: COIN, policy: p });
  s = recordRewardCollection(s, { signature: 'collection-1', amountRaw: '10000003', mint: QUOTE, finalized: true, slot: 10 });
  const options = { now: time, vaultBalanceRaw: '10000003', snapshots: { own: { mint: COIN, complete: true, slot: 11, capturedAt: time, holders: [{ wallet: A, amount: '1' }, { wallet: B, amount: '2' }] } } };
  s = allocateTokenRewards(s, options);
  assert.equal(s.credits[A].dev, '2500000');
  assert.equal(s.credits[A].own, '2500001');
  assert.equal(s.credits[B].own, '5000002');
  assert.equal(rewardLiabilities(s), 10000003n);
  assert.throws(() => allocateTokenRewards(s, options), /12 hours/);
  assert.deepEqual(recordRewardCollection(s, { signature: 'collection-1', amountRaw: '10000003', mint: QUOTE, finalized: true, slot: 10 }), s);
  assert.throws(() => recordRewardCollection(s, { signature: 'collection-1', amountRaw: '2', mint: QUOTE, finalized: true, slot: 10 }), /different/);
  assert.throws(() => recordRewardCollection(s, { signature: 'wrong-mint', amountRaw: '1', mint: COIN, finalized: true, slot: 11 }), /mint/);
  assert.throws(() => recordRewardCollection(s, { signature: 'not-finalized', amountRaw: '1', mint: QUOTE, finalized: false, slot: 11 }), /finalized/);
});

test('missing, stale, duplicate and wrong-community snapshots stop allocations', async () => {
  const { normalizeTokenRewardPolicy } = await import('../src/lib/tokenRewardPolicy.js');
  const { createRewardLedger, recordRewardCollection, allocateTokenRewards } = await import('../src/lib/tokenRewardLedger.js');
  let s = createRewardLedger({ mint: COIN, policy: normalizeTokenRewardPolicy(policyInput, asset) });
  s = recordRewardCollection(s, { signature: 'c', amountRaw: '10', mint: QUOTE, finalized: true, slot: 10 });
  const time = 1800000000000, good = { mint: COIN, complete: true, slot: 11, capturedAt: time, holders: [{ wallet: A, amount: '1' }] };
  for (const bad of [undefined, { ...good, complete: false }, { ...good, mint: QUOTE }, { ...good, capturedAt: time - 60001 }, { ...good, holders: [...good.holders, ...good.holders] }]) {
    assert.throws(() => allocateTokenRewards(s, { now: time, vaultBalanceRaw: '10', snapshots: { own: bad } }));
  }
  assert.throws(() => allocateTokenRewards(s, { now: time, vaultBalanceRaw: '9', snapshots: { own: good } }), /cover/);
});

test('developer-only payouts do not request holder snapshots', async () => {
  const { normalizeTokenRewardPolicy } = await import('../src/lib/tokenRewardPolicy.js');
  const { createRewardLedger, recordRewardCollection, allocateTokenRewards } = await import('../src/lib/tokenRewardLedger.js');
  let s = createRewardLedger({ mint: COIN, policy: normalizeTokenRewardPolicy({ ...policyInput, creatorShareBps: 10000, holderShareBps: 0 }, asset) });
  s = recordRewardCollection(s, { signature: 'c', amountRaw: '99999999999999999', mint: QUOTE, finalized: true, slot: 10 });
  s = allocateTokenRewards(s, { now: 1800000000000, vaultBalanceRaw: '99999999999999999', snapshots: {} });
  assert.equal(s.credits[A].dev, '99999999999999999');
});

test('quote-denominated launch config uses custom mint precision and dedicated fee rights', async () => {
  const { tokenRewardCurve, buildTokenRewardLaunch } = await import('../src/lib/tokenRewardMeteora.js');
  const { normalizeTokenRewardPolicy } = await import('../src/lib/tokenRewardPolicy.js');
  for (const decimals of [5,6,9]) {
    const c = tokenRewardCurve({ ...asset, decimals, priceUsd: '0.01' });
    assert.equal(c.collectFeeMode, 0); assert.equal(c.creatorTradingFeePercentage, 0);
    assert.equal(c.partnerPermanentLockedLiquidityPercentage, 100);
    assert.equal(c.migratedPoolFee.collectFeeMode, 0);
    assert.equal(c.migratedPoolFee.poolFeeBps, 100);
    assert.ok(c.migrationQuoteThreshold.gt(0));
  }
  let params;
  await buildTokenRewardLaunch({ connection: { getAccountInfo: async () => mintAccount() }, asset: { ...asset, priceUsd: '0.1', checkedAt: Date.now() }, policy: normalizeTokenRewardPolicy(policyInput, asset), config: Keypair.generate().publicKey, baseMint: COIN, vault: B, name: 'Demo', symbol: 'DEMO', uri: 'https://gateway.pinata.cloud/ipfs/example', client: { partner: { createConfigAndPoolWithFirstBuy: async p => { params=p; return {}; } } } });
  assert.equal(params.quoteMint.toBase58(), QUOTE); assert.equal(params.feeClaimer.toBase58(), B);
  assert.equal(params.preCreatePoolParam.poolCreator.toBase58(), A);
  assert.equal(params.firstBuyParam, undefined, 'building a reward launch never makes an unreviewed initial buy');
  await assert.rejects(buildTokenRewardLaunch({asset:{...asset,priceUsd:'0.1',checkedAt:1},policy:normalizeTokenRewardPolicy(policyInput,asset)}),/expired/);
  const { createRewardLedger } = await import('../src/lib/tokenRewardLedger.js');
  assert.throws(()=>createRewardLedger({mint:COIN,policy:{...normalizeTokenRewardPolicy(policyInput,asset),cadenceHours:1}}),/canonical/);
});

test('token payouts create ATAs and transfer the exact selected mint, with no SOL fallback', async () => {
  const { tokenRewardTransferInstructions } = await import('../src/lib/tokenRewardMeteora.js');
  const { decodeTransferCheckedInstruction } = await import('@solana/spl-token');
  const vault = Keypair.generate().publicKey.toBase58();
  const instructions = tokenRewardTransferInstructions({ asset, vault, rows: [{ wallet: A, amountRaw: '9007199254740993' }] });
  assert.equal(instructions.length, 2);
  const ix = decodeTransferCheckedInstruction(instructions[1]);
  assert.equal(ix.keys.mint.pubkey.toBase58(), QUOTE); assert.equal(ix.data.amount, 9007199254740993n); assert.equal(ix.data.decimals, 6);
  assert.throws(() => tokenRewardTransferInstructions({ asset, vault, rows: [{ wallet: A, amountRaw: '1' }, { wallet: A, amountRaw: '2' }] }), /duplicate/);
  assert.throws(() => tokenRewardTransferInstructions({ asset, vault, rows: [{ wallet: vault, amountRaw: '1' }] }), /recipient/);
});

function memoryStore(){let db={version:1,intents:[]}, fail=false;return {snapshot:()=>structuredClone(db),failNext:()=>{fail=true;},async mutate(fn){const next=structuredClone(db);const result=await fn(next);if(fail){fail=false;throw Error('disk full');}db=next;return result;}};}
test('durable reward pipeline persists before broadcasting, reconciles timeouts and pays each allocation once', async () => {
  const { createTokenRewardService } = await import('../src/lib/tokenRewardService.js');
  const { normalizeTokenRewardPolicy } = await import('../src/lib/tokenRewardPolicy.js');
  const store=memoryStore(), receipts=new Map(), broadcasts=[];let time=1800000000000, snapReads=0;
  const pending=(kind,rows=[])=>({kind,rows,mint:QUOTE,signature:kind+'-sig',rawBase64:Buffer.from(kind).toString('base64'),blockhash:'block',lastValidBlockHeight:900});
  const driver={verify:async()=>true,balance:async()=> '100',prepareCollection:async()=>pending('collection'),preparePayout:async(_p,rows)=>pending('payout',rows),receipt:async(_p,p)=>receipts.get(p.signature)||{status:'unknown'},broadcast:async p=>{assert.equal(store.snapshot().tokenRewardPrograms[COIN].ledger.pending.signature,p.signature);broadcasts.push(p);throw Error('timeout after submit');}};
  const service=createTokenRewardService({store,driverFor:async()=>driver,now:()=>time,enableBroadcast:true,snapshot:async mint=>{snapReads++;return {mint,slot:100,capturedAt:time,holders:[{wallet:B,amount:'1'}]};}});
  await service.register({mint:COIN,policy:normalizeTokenRewardPolicy(policyInput,asset),pool:Keypair.generate().publicKey.toBase58(),config:Keypair.generate().publicKey.toBase58(),vault:Keypair.generate().publicKey.toBase58(),adoptionReceipt:'launch-proof',validationApproved:true,minimumPayoutRaw:'1',minimumCollectionRaw:'1',maxNetworkCostLamports:20000000});
  await service.pause(COIN,false);await service.tick(COIN);
  assert.equal(broadcasts.length,1);assert.equal((await service.read(COIN)).paidRaw,'0');
  time+=60000;receipts.set('collection-sig',{status:'finalized',finalized:true,signature:'collection-sig',mint:QUOTE,amountRaw:'100',slot:100});
  await service.tick(COIN);await service.tick(COIN);assert.equal(snapReads,1);
  await service.tick(COIN);assert.equal(broadcasts.at(-1).kind,'payout');assert.equal((await service.read(COIN)).paidRaw,'0');
  time+=60000;await service.tick(COIN);assert.equal(broadcasts.at(-1).rawBase64,broadcasts.at(-2).rawBase64);
  receipts.set('payout-sig',{status:'finalized',finalized:true,signature:'payout-sig',mint:QUOTE,slot:101});time+=60000;
  await service.tick(COIN);const result=await service.read(COIN);assert.equal(result.paidRaw,'100');assert.equal(result.pendingRaw,'0');assert.equal(result.receipts.length,1);
  await service.tick(COIN);assert.equal((await service.read(COIN)).receipts.length,1);
});

test('disabled runner and persistence failure never broadcast funds', async () => {
  const { createTokenRewardService } = await import('../src/lib/tokenRewardService.js');
  const { normalizeTokenRewardPolicy } = await import('../src/lib/tokenRewardPolicy.js');
  let sent=0;const store=memoryStore(),driver={verify:async()=>true,prepareCollection:async()=>({kind:'collection',rows:[],mint:QUOTE,signature:'s',rawBase64:'AA==',blockhash:'b',lastValidBlockHeight:1}),broadcast:async()=>{sent++;}};
  const off=createTokenRewardService({store,driverFor:async()=>driver});assert.equal((await off.tick(COIN)).status,'DISABLED');assert.throws(()=>off.start(),/disabled/);
  const s=createTokenRewardService({store,driverFor:async()=>driver,enableBroadcast:true});
  await s.register({mint:COIN,policy:normalizeTokenRewardPolicy(policyInput,asset),pool:COIN,config:QUOTE,vault:Keypair.generate().publicKey.toBase58(),adoptionReceipt:'receipt',validationApproved:true,minimumPayoutRaw:'1',minimumCollectionRaw:'1',maxNetworkCostLamports:20000000});await s.pause(COIN,false);store.failNext();
  await assert.rejects(s.tick(COIN),/disk full/);assert.equal(sent,0);
});

test('custom reward UI keeps search results escaped and validates whole percentage splits',()=>{
  const context=vm.createContext({URL});vm.runInContext(readFileSync(new URL('../web/public/token-rewards.js',import.meta.url),'utf8'),context);
  const ui=context.SlimeTokenRewards;
  assert.equal(ui.shares('split',['20','60','20']).valid,true);
  for(const values of [['20','70','0'],['1.5','98.5','0'],['','100','0'],['-1','101','0']])assert.equal(ui.shares('split',values).valid,false);
  const html=ui.tokenHtml({mint:QUOTE,symbol:'<script>x</script>',name:'Wrong ticker',imageUrl:'javascript:alert(1)'});
  assert.doesNotMatch(html,/<script>|javascript:/);assert.match(html,new RegExp(QUOTE));
});

test('readiness cannot be switched to live by an environment flag',async()=>{
  const {tokenRewardReadiness}=await import('../src/lib/tokenRewardsApi.js');
  assert.equal(tokenRewardReadiness({enabled:true}).launchEnabled,false);assert.equal(tokenRewardReadiness().payoutsEnabled,false);
});

test('read-only reward API validates exact token, rejects signing inputs and explains unsupported curves', async () => {
  const { createTokenRewardsApi } = await import('../src/lib/tokenRewardsApi.js');
  let result, body, selected = { ...asset, priceUsd: '0.1' }, freshReview = false;
  const api = createTokenRewardsApi({
    resolver: { search: async () => [selected], resolve: async (mint, options) => { assert.equal(mint, QUOTE); if(options?.fresh) freshReview = true; return selected; } },
    readBody: async (_req, max) => { assert.equal(max, 8192); return JSON.stringify(body); },
    sendJson: (_req, _res, code, data) => { result = { code, ...data }; },
  });
  async function call(action, method = 'GET', input) {
    body = input;
    const matched = await api.route({ method, headers: { 'content-type': 'application/json' } }, {}, new URL('https://slimewire.org/api/web/token-rewards/' + action));
    assert.equal(matched, true); return result;
  }
  const good = { name: 'Demo', symbol: 'DEMO', ...policyInput };
  let r = await call('plan', 'POST', good);
  assert.equal(r.code, 200); assert.equal(r.data.policy.payoutMint, QUOTE); assert.equal(r.data.readiness.launchEnabled, false);
  assert.equal(freshReview, true); assert.equal(r.data.requiresFreshReviewBeforeSigning, true);
  assert.match(r.data.disclosures.join(' '), /migration rounding/);
  assert.equal((await call('plan', 'POST', { ...good, signedTransaction: 'not-allowed' })).code, 400);
  assert.equal((await call('submit', 'POST', {})).code, 405);
  assert.equal((await call('asset?mint='+QUOTE+'&mint='+QUOTE)).code, 400);
  assert.equal((await call('search?q=DEMO&signature=x')).code, 400);
  selected = { ...selected, priceUsd: '0' };
  r = await call('asset?mint='+QUOTE);
  assert.equal(r.code, 422); assert.match(r.error, /no fallback asset/);
  assert.equal((await call('plan', 'POST', good)).code, 422);
});

test('SOL fee collection preserves previously reserved wrapped SOL instead of closing its account', async () => {
  const { retainWrappedRewardVault } = await import('../src/lib/tokenRewardMeteora.js');
  const { Transaction, TransactionInstruction } = await import('@solana/web3.js');
  const { NATIVE_MINT, getAssociatedTokenAddressSync, createCloseAccountInstruction } = await import('@solana/spl-token');
  const owner = new PublicKey(A), ata = getAssociatedTokenAddressSync(NATIVE_MINT, owner);
  const claim = new TransactionInstruction({ programId: new PublicKey(COIN), keys: [], data: Buffer.from([1]) });
  const tx = new Transaction().add(claim, createCloseAccountInstruction(ata, owner, owner));
  retainWrappedRewardVault(tx, owner);
  assert.deepEqual(tx.instructions, [claim], 'only the exact final unwrap is removed; claim and existing ATA survive');
  assert.throws(() => retainWrappedRewardVault(new Transaction().add(claim), owner), /cleanup changed/);
  assert.throws(() => retainWrappedRewardVault(new Transaction().add(createCloseAccountInstruction(ata, new PublicKey(B), owner)), owner), /Unexpected/);
});

test('pausing a reward program reconciles a pending receipt without rebroadcasting it', async () => {
  const { createTokenRewardService } = await import('../src/lib/tokenRewardService.js');
  const { normalizeTokenRewardPolicy } = await import('../src/lib/tokenRewardPolicy.js');
  const store = memoryStore(); let time = 1800000000000, sends = 0, reads = 0;
  const driver = { verify: async()=>true, prepareCollection: async()=>({kind:'collection',rows:[],mint:QUOTE,signature:'pause-sig',rawBase64:'AA==',blockhash:'b',lastValidBlockHeight:1}), broadcast: async()=>{ sends++; return 'pause-sig'; }, receipt: async()=>{reads++; return {status:'unknown'};} };
  const service = createTokenRewardService({store,driverFor:async()=>driver,now:()=>time,enableBroadcast:true});
  await service.register({mint:COIN,policy:normalizeTokenRewardPolicy(policyInput,asset),pool:COIN,config:QUOTE,vault:B,adoptionReceipt:'r',validationApproved:true,minimumPayoutRaw:'1',minimumCollectionRaw:'1',maxNetworkCostLamports:20000000});
  await service.pause(COIN,false); await service.tick(COIN); assert.equal(sends,1);
  await service.pause(COIN,true); time += 60000; await service.tick(COIN);
  assert.equal(reads,1); assert.equal(sends,1); assert.equal(store.snapshot().tokenRewardPrograms[COIN].ledger.pending.signature,'pause-sig');
});
