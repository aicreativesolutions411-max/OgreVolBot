import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { Keypair, PublicKey, Transaction, SystemProgram, Connection } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, AccountLayout, MintLayout } from '@solana/spl-token';
import { createDammV2Program, deriveDammV2TokenVaultAddress, createDbcProgram } from '@meteora-ag/dynamic-bonding-curve-sdk';
import BN from 'bn.js';
import nacl from 'tweetnacl';
import { createTokenRewardLaunchService } from '../src/lib/tokenRewardLaunch.js';
import { createRewardDammCollector, rewardDammPool, dammQuoteFees } from '../src/lib/tokenRewardDamm.js';
import { createRewardAssetResolver } from '../src/lib/tokenRewardAssets.js';
import { createTokenRewardExecutionApi } from '../src/lib/tokenRewardExecutionApi.js';
import { createTokenRewardRuntime } from '../src/lib/tokenRewardRuntime.js';
import { createTokenRewardSnapshot } from '../src/lib/tokenRewardSnapshot.js';
import { buildTokenRewardLaunch } from '../src/lib/tokenRewardMeteora.js';
import { normalizeTokenRewardPolicy } from '../src/lib/tokenRewardPolicy.js';
import { createTokenRewardService } from '../src/lib/tokenRewardService.js';

const creator = Keypair.generate(), quote = Keypair.generate().publicKey.toBase58();
const asset = { mint:quote, decimals:6, tokenProgram:TOKEN_PROGRAM_ID.toBase58(), symbol:'TEST',name:'Fixture token',supported:true,verified:true,priceUsd:'0.1',checkedAt:Date.now() };
function memoryStore(){let db={version:1,intents:[]},queue=Promise.resolve(),fail=false;return {snapshot:()=>structuredClone(db),failNext:()=>{fail=true;},mutate(fn){const run=queue.then(async()=>{const next=structuredClone(db),result=await fn(next);if(fail){fail=false;throw Error('disk full');}db=next;return result;});queue=run.catch(()=>{});return run;}};}
function fixture(){
  const store=memoryStore(),secrets=new Map(),chain=new Map(),sent=[],adopted=[];let time=Date.now(),encryptions=0,metadataCalls=0;
  const encrypt=b=>{const id='encrypted-'+ ++encryptions;secrets.set(id,Buffer.from(b));return {id};},decrypt=e=>Buffer.from(secrets.get(e.id));
  const connection={getLatestBlockhash:async()=>({blockhash:Keypair.generate().publicKey.toBase58(),lastValidBlockHeight:500}),getBalance:async()=>2000000000,
    getFeeForMessage:async()=>({value:15000}),simulateTransaction:async()=>({context:{slot:20},value:{err:null,accounts:[{lamports:1900000000}]}}),getBlockHeight:async()=>100,
    getSignatureStatuses:async([s])=>({value:[chain.get(s)||null]}),getTransaction:async s=>({slot:30,meta:{err:null},transaction:{signatures:[s]}}),
    sendRawTransaction:async raw=>{const tx=Transaction.from(raw);sent.push(raw);const stored=Object.values(store.snapshot().tokenRewardLaunches)[0];assert.equal(stored.status,'SUBMITTED');assert.ok(stored.pending.signedTransaction);throw Error('timeout after send');}};
  const rewards={register:async input=>{adopted.push(input);},pause:async()=>{}};
  const build=async p=>({createConfigTx:new Transaction().add(SystemProgram.createAccount({fromPubkey:new PublicKey(p.policy.creator),newAccountPubkey:new PublicKey(p.config),lamports:1000000,space:0,programId:SystemProgram.programId})),createPoolWithFirstBuyTx:new Transaction().add(SystemProgram.createAccount({fromPubkey:new PublicKey(p.policy.creator),newAccountPubkey:new PublicKey(p.baseMint),lamports:1000000,space:0,programId:SystemProgram.programId}))});
  const resolver={resolve:async()=>({...asset,checkedAt:time})};
  const make=()=>createTokenRewardLaunchService({store,connection,resolver,metadata:async()=>{metadataCalls++;return 'https://gateway.pinata.cloud/ipfs/fixture';},encrypt,decrypt,rewards,build,now:()=>time});
  const input={requestId:crypto.randomUUID(),creator:creator.publicKey.toBase58(),quoteMint:quote,name:'Fixture',symbol:'FIX',creatorShareBps:10000,holderShareBps:0,partnerShareBps:0,partnerMint:'',description:'Test fixture',imageData:'data:image/png;base64,YQ==',imageRights:true,vaultBudgetLamports:50000000,consentVersion:'slimewire-token-rewards-2026-10-03-v1'};
  const sign=row=>{const tx=Transaction.from(Buffer.from(row.transaction,'base64'));tx.partialSign(creator);return tx.serialize().toString('base64');};
  return {store,make,input,sign,sent,chain,adopted,connection,resolver,encrypt,decrypt,advance:ms=>{time+=ms;},metadataCalls:()=>metadataCalls};
}

test('native launch binds two wallet reviews, saves encrypted keys and resumes across a server restart',async()=>{
  const f=fixture(),service=f.make();let row=await service.prepare(f.input);
  assert.equal(row.status,'REVIEW');assert.equal(row.phase,'config');assert.equal(row.review.vaultFundingLamports,0);assert.equal(f.sent.length,0);
  assert.equal((await service.prepare(f.input)).id,row.id);assert.equal(f.metadataCalls(),1);assert.doesNotMatch(JSON.stringify(row),/encrypted-|secretKey|templates|signedTransaction/);
  const config=Transaction.from(Buffer.from(row.transaction,'base64'));assert.equal(config.signatures.length,2);
  const signedConfig=f.sign(row);row=await service.submit(row.id,row.wallet,signedConfig);assert.equal(row.status,'SUBMITTED');assert.equal(f.sent.length,1);
  await service.submit(row.id,row.wallet,signedConfig);assert.equal(f.sent.length,1);
  f.chain.set(row.signature,{confirmationStatus:'confirmed',slot:25});assert.equal((await service.status(row.id,row.wallet)).status,'SUBMITTED','confirmed is not enough for adoption');
  f.chain.set(row.signature,{confirmationStatus:'finalized',slot:30});row=await f.make().status(row.id,row.wallet);assert.equal(row.status,'NEXT_STEP');assert.equal(f.adopted.length,0);
  row=await f.make().resume(row.id,row.wallet);assert.equal(row.phase,'pool');assert.equal(row.review.vaultFundingLamports,50000000);assert.equal(row.receipts.length,1);
  const pool=Transaction.from(Buffer.from(row.transaction,'base64'));const funding=pool.instructions.at(-1);assert.ok(funding.programId.equals(SystemProgram.programId));assert.equal(funding.keys[1].pubkey.toBase58(),row.vault);
  row=await service.submit(row.id,row.wallet,f.sign(row));f.chain.set(row.signature,{confirmationStatus:'finalized',slot:30});row=await service.status(row.id,row.wallet);
  assert.equal(row.status,'ACTIVE');assert.equal(f.adopted.length,1);assert.equal(f.adopted[0].adoptionReceipt,row.receipts[1].signature);assert.equal(f.adopted[0].vault,row.vault);
  assert.deepEqual(Object.keys(f.store.snapshot().tokenRewardLaunches[row.id].keys),['vault']);assert.equal(f.sent.length,2);
});

test('unknown signed launch outcomes never create replacement launches or new blockhashes',async()=>{
  const f=fixture(),s=f.make();let row=await s.prepare(f.input);const raw=f.sign(row);row=await s.submit(row.id,row.wallet,raw);
  const before=f.store.snapshot().tokenRewardLaunches[row.id].pending;
  f.advance(180000);assert.equal((await s.resume(row.id,row.wallet)).status,'SUBMITTED');assert.equal(f.sent.length,1);
  await assert.rejects(s.prepare({...f.input,requestId:crypto.randomUUID()}),/existing launch/);
  await s.retry(row.id,row.wallet);assert.equal(f.sent.length,2);assert.equal(f.sent[0].toString('base64'),f.sent[1].toString('base64'));
  assert.equal(f.store.snapshot().tokenRewardLaunches[row.id].pending.messageHash,before.messageHash);
  await assert.rejects(s.cancel(row.id,row.wallet),/on-chain step/);
});

test('changed messages, another wallet and failed durable writes never broadcast a launch',async()=>{
  const f=fixture(),s=f.make(),row=await s.prepare(f.input),tx=Transaction.from(Buffer.from(row.transaction,'base64'));
  await assert.rejects(s.status(row.id,Keypair.generate().publicKey.toBase58()),/not found/);
  tx.instructions.push(SystemProgram.transfer({fromPubkey:creator.publicKey,toPubkey:Keypair.generate().publicKey,lamports:1}));tx.partialSign(creator);
  await assert.rejects(s.submit(row.id,row.wallet,tx.serialize({requireAllSignatures:false,verifySignatures:false}).toString('base64')),/differs/);
  f.store.failNext();await assert.rejects(s.submit(row.id,row.wallet,f.sign(row)),/disk full/);assert.equal(f.sent.length,0);assert.equal((await s.status(row.id,row.wallet)).status,'REVIEW');
  await assert.rejects(s.prepare({...f.input,privateKey:'not-accepted'}),/Invalid launch/);
  await assert.rejects(s.prepare({...f.input,vaultBudgetLamports:600000000}),/budget/);
});

test('unsigned expiration refreshes the same coin; cancellation never funds a vault',async()=>{
  const f=fixture(),s=f.make(),first=await s.prepare(f.input);f.advance(91000);
  await assert.rejects(s.submit(first.id,first.wallet,f.sign(first)),/expired/);
  const next=await s.resume(first.id,first.wallet);assert.equal(next.mint,first.mint);assert.equal(next.config,first.config);assert.notEqual(next.transaction,first.transaction);
  assert.equal((await s.cancel(next.id,next.wallet)).status,'CANCELLED');assert.equal(f.sent.length,0);
});

test('public Raydium fallback resolves an exact mint without spending keyed fallback credits',async()=>{
  let keyed=0;const mintData=Buffer.alloc(MintLayout.span);MintLayout.encode({mintAuthorityOption:0,mintAuthority:PublicKey.default,supply:1000000000n,decimals:6,isInitialized:true,freezeAuthorityOption:0,freezeAuthority:PublicKey.default},mintData);
  const fetchImpl=async(url,opts)=>{const u=new URL(url);if(u.hostname==='api.dexscreener.com')return new Response('{}',{status:429});if(u.hostname==='data.solanatracker.io'){keyed++;throw Error('must not spend credits');}assert.equal(u.hostname,'api-v3.raydium.io');assert.equal(opts.headers['x-api-key'],undefined);
    return new Response(JSON.stringify(u.pathname==='/mint/price'?{success:true,data:{[quote]:'0.25'}}:{success:true,data:{data:[{mintA:{address:quote,chainId:101,symbol:'TEST',name:'Fixture',logoURI:'https://example.org/token.png'},mintB:{address:Keypair.generate().publicKey.toBase58()},tvl:50000}]}}));};
  const r=createRewardAssetResolver({fetchImpl,trackerApiKey:'fixture-key',rpc:{getAccountInfoAndContext:async()=>({context:{slot:12},value:{owner:TOKEN_PROGRAM_ID,data:mintData,executable:false}})}});
  const selected=await r.resolve(quote);assert.equal(selected.mint,quote);assert.equal(selected.marketSource,'raydium');assert.equal(selected.priceUsd,'0.25');assert.equal(keyed,0);
});

const le=v=>[...new BN(v.toString()).toArrayLike(Buffer,'le',32)];
test('graduated quote fee math uses Q128, U256 wrapping and saturating raw amounts',()=>{
  const p={feeBPerLiquidity:le(1n<<128n)},position={feeBPerTokenCheckpoint:le(0),unlockedLiquidity:new BN(0),vestedLiquidity:new BN(0),permanentLockedLiquidity:new BN(12),feeBPending:new BN(3)};
  assert.equal(dammQuoteFees(p,position),15n);
  assert.equal(dammQuoteFees({feeBPerLiquidity:le(0)},{...position,feeBPerTokenCheckpoint:le((1n<<256n)-(1n<<128n))}),15n);
  assert.equal(dammQuoteFees(p,{...position,feeBPending:new BN(((1n<<64n)-1n).toString())}),(1n<<64n)-1n);
  assert.throws(()=>dammQuoteFees({feeBPerLiquidity:[]},position),/accumulator/);
});

test('graduated claim uses the actual installed IDL, locked LP, exact quote and no unwrap',async()=>{
  const owner=Keypair.generate().publicKey,base=Keypair.generate().publicKey,quoteMint=new PublicKey(quote),pool=rewardDammPool(base,quoteMint),nft=Keypair.generate().publicKey,nftAccount=Keypair.generate().publicKey;
  const data=Buffer.alloc(165);AccountLayout.encode({mint:nft,owner,amount:1n,delegateOption:0,delegate:PublicKey.default,state:1,isNativeOption:0,isNative:0n,delegatedAmount:0n,closeAuthorityOption:0,closeAuthority:PublicKey.default},data);
  const connection=new Connection('https://api.mainnet-beta.solana.com');connection.getTokenAccountsByOwner=async()=>({value:[{pubkey:nftAccount,account:{data,owner:TOKEN_2022_PROGRAM_ID,executable:false}}]});
  const program=createDammV2Program(connection,'finalized');let locked=true,mode=1;
  const state={tokenAMint:base,tokenBMint:quoteMint,tokenAVault:deriveDammV2TokenVaultAddress(pool,base),tokenBVault:deriveDammV2TokenVaultAddress(pool,quoteMint),tokenAFlag:0,tokenBFlag:0,feeBPerLiquidity:le(1n<<128n)};
  program.account.pool.fetch=async()=>({...state,collectFeeMode:mode});program.account.position.fetchNullable=async()=>({pool,nftMint:nft,unlockedLiquidity:new BN(locked?0:1),vestedLiquidity:new BN(0),permanentLockedLiquidity:new BN(10),feeBPerTokenCheckpoint:le(0),feeBPending:new BN(0)});
  const collector=createRewardDammCollector({connection,owner,program});const tx=await collector.prepare({baseMint:base.toBase58(),quoteMint:quote,minimumRaw:'1'});
  assert.equal(tx.instructions.length,3);assert.equal(tx.instructions.at(-1).data.toString('hex'),'b4269a118521a2d3');assert.ok(tx.instructions.at(-1).keys.some(k=>k.pubkey.equals(owner)&&k.isSigner));
  assert.equal(await collector.prepare({baseMint:base.toBase58(),quoteMint:quote,minimumRaw:'11'}),null);
  locked=false;await assert.rejects(collector.prepare({baseMint:base.toBase58(),quoteMint:quote,minimumRaw:'1'}),/locked LP/);locked=true;mode=0;
  await assert.rejects(collector.prepare({baseMint:base.toBase58(),quoteMint:quote,minimumRaw:'1'}),/quote-only/);
});

test('wallet execution requires an approved wallet, exact origin and a single-use ownership signature',async()=>{
  const calls=[];let time=Date.now(),out;const wallet=creator.publicKey.toBase58();
  const runtime={canLaunch:w=>w===wallet,launches:{history:async w=>{calls.push(w);return [];}}};
  const api=createTokenRewardExecutionApi({runtime,now:()=>time,readBody:async r=>JSON.stringify(r.body),sendJson:(_r,_s,status,data)=>{out={status,...data};}});
  const req=async(action,body={},headers={})=>{await api.route({method:'POST',headers:{origin:'https://slimewire.org','content-type':'application/json',...headers},body:{wallet,...body}},{},new URL('https://slimewire.org/api/web/token-rewards/execution/'+action));return out;};
  assert.equal((await req('history')).status,401);assert.equal((await req('challenge',{}, {origin:'https://evil.test'})).status,403);
  const challenge=(await req('challenge')).data;const signature=Buffer.from(nacl.sign.detached(Buffer.from(challenge.message),creator.secretKey)).toString('base64');
  const session=(await req('verify',{id:challenge.id,signature})).data;assert.equal((await req('verify',{id:challenge.id,signature})).status,401);
  assert.equal((await req('history',{}, {authorization:'Bearer '+session.token})).status,200);assert.deepEqual(calls,[wallet]);
  time+=1800001;assert.equal((await req('history',{}, {authorization:'Bearer '+session.token})).status,401);
});

test('runtime cannot expose public financial activation through a flag and starts without idle RPC',async()=>{
  let rpc=0;const connection=new Connection('https://api.mainnet-beta.solana.com');connection.getAccountInfo=async()=>{rpc++;throw Error('idle RPC forbidden');};
  const store=memoryStore(),runtime=createTokenRewardRuntime({dataDir:process.cwd(),store,connection,env:{PUMP_LAUNCH_PINATA_JWT:'fixture-jwt',TOKEN_REWARDS_ENABLED:'true'},encrypt:()=>({}),decrypt:()=>Buffer.alloc(64),audit:()=>{}});
  await runtime.start();assert.equal(runtime.readiness().launchEnabled,false);assert.equal(runtime.readiness().payoutsEnabled,false);assert.equal(runtime.canLaunch(creator.publicKey.toBase58()),false);assert.equal(rpc,0);
  assert.ok(createDbcProgram(connection).program.coder.accounts,'native snapshot uses the installed SDK program wrapper');
});

test('installed Meteora SDK builds both real launch instructions within transaction size limits',async()=>{
  const connection=new Connection('https://api.mainnet-beta.solana.com'),data=Buffer.alloc(MintLayout.span);
  MintLayout.encode({mintAuthorityOption:0,mintAuthority:PublicKey.default,supply:1000000000n,decimals:6,isInitialized:true,freezeAuthorityOption:0,freezeAuthority:PublicKey.default},data);
  connection.getAccountInfo=async()=>({data,owner:TOKEN_PROGRAM_ID,executable:false});
  const verified={...asset,checkedAt:Date.now()},config=Keypair.generate(),base=Keypair.generate(),vault=Keypair.generate();
  const policy=normalizeTokenRewardPolicy({creator:creator.publicKey.toBase58(),quoteMint:quote,creatorShareBps:10000},verified);
  const built=await buildTokenRewardLaunch({connection,asset:verified,policy,config:config.publicKey.toBase58(),baseMint:base.publicKey.toBase58(),vault:vault.publicKey.toBase58(),name:'Fixture',symbol:'FIX',uri:'https://gateway.pinata.cloud/ipfs/fixture'});
  for(const [tx,signer] of [[built.createConfigTx,config],[built.createPoolWithFirstBuyTx,base]]){
    assert.equal(tx.instructions.length,1);
    assert.equal(tx.instructions[0].programId.toBase58(),'dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN');
    tx.feePayer=creator.publicKey;tx.recentBlockhash=Keypair.generate().publicKey.toBase58();tx.partialSign(signer);
    assert.ok(tx.serialize({requireAllSignatures:false}).length<1100,'leaves room for compute budget and atomic vault funding');
  }
});

test('partner holder snapshots use the exact-mint fallback and reject missing or stale pricing evidence',async()=>{
  const connection=new Connection('https://api.mainnet-beta.solana.com');let checks=0,marketCheckedAt=Date.now();
  connection.getSlot=async opts=>{assert.deepEqual(opts,{commitment:'finalized',minContextSlot:100});return 101;};
  const snapshot=createTokenRewardSnapshot({connection,resolver:{resolve:async(mint,options)=>{checks++;assert.equal(mint,quote);assert.equal(options.fresh,true);return {...asset,marketCheckedAt,marketSource:'raydium'};}},read:async(mint,options)=>{
    assert.equal(mint,quote);return options.priceAtSnapshot({decimals:6,minContextSlot:100});
  }});
  const result=await snapshot(quote,{excluded:[],source:'partner'});assert.equal(result.priceUsd,asset.priceUsd);assert.equal(checks,1);
  marketCheckedAt=undefined;await assert.rejects(snapshot(quote,{excluded:[],source:'partner'}),/freshly verified/);
  marketCheckedAt=Date.now()-31000;await assert.rejects(snapshot(quote,{excluded:[],source:'partner'}),/freshly verified/);
});

test('reward cycle collects residual DBC and graduated DAMM fees before allocating; adoption is idempotent',async()=>{
  const store=memoryStore(),mint=Keypair.generate().publicKey.toBase58(),vault=Keypair.generate().publicKey.toBase58(),sent=[];
  let time=1800000000000;
  const policy=normalizeTokenRewardPolicy({creator:creator.publicKey.toBase58(),quoteMint:quote,creatorShareBps:10000},asset);
  const input={mint,pool:mint,config:quote,vault,policy,adoptionReceipt:'pool-receipt',validationApproved:true,minimumPayoutRaw:'1',minimumCollectionRaw:'1',maxNetworkCostLamports:20000000};
  const driver={verify:async()=>true,balance:async()=>'300',prepareCollection:async p=>{
    const source=['dbc','damm-v2'].find(s=>!p.collectionSources?.includes(s));
    return source?{kind:'collection',collectionSource:source,mint:quote,rows:[],signature:source,rawBase64:'AA==',blockhash:'block',lastValidBlockHeight:100}:null;
  },broadcast:async p=>{sent.push(p.collectionSource);return p.signature;},receipt:async(_p,p)=>({status:'finalized',finalized:true,signature:p.signature,mint:quote,amountRaw:p.collectionSource==='dbc'?'100':'200',slot:100})};
  const service=createTokenRewardService({store,driverFor:async()=>driver,now:()=>time,enableBroadcast:true});
  await service.register(input);await service.pause(mint,false);
  await service.tick(mint);time+=15000;await service.tick(mint);
  assert.equal((await service.read(mint)).collectedRaw,'100');
  await service.tick(mint);time+=15000;await service.tick(mint);
  assert.deepEqual(sent,['dbc','damm-v2']);assert.equal((await service.read(mint)).collectedRaw,'300');
  await service.tick(mint);const saved=store.snapshot().tokenRewardPrograms[mint];
  assert.equal(saved.ledger.credits[creator.publicKey.toBase58()].dev,'300');
  assert.equal(saved.ledger.collections.dbc.source,'dbc');assert.equal(saved.ledger.collections['damm-v2'].source,'damm-v2');
  assert.equal((await service.register(input)).collectedRaw,'300','re-adoption returns existing totals');
  await assert.rejects(service.register({...input,adoptionReceipt:'different'}),/immutable/);
});
