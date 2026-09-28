import { createRequire } from 'node:module';
import { Connection, PublicKey } from '@solana/web3.js';
const require=createRequire(import.meta.url);
const {PUMP_SDK,PUMP_PROGRAM_ID,PUMP_FEE_PROGRAM_ID,PUMP_AMM_PROGRAM_ID,bondingCurvePda,feeSharingConfigPda,canonicalPumpPoolPda,isLegacyQuoteMint}=require('@pump-fun/pump-sdk');
const {PUMP_AMM_SDK}=require('@pump-fun/pump-swap-sdk');
const SOL='So11111111111111111111111111111111111111112';

export function assertCommunityAuthorityState({mint,wallet,curve,config,pool,editable=false}) {
  const target=new PublicKey(mint),owner=new PublicKey(wallet),sharing=feeSharingConfigPda(target);
  if(!PublicKey.isOnCurve(owner.toBytes())||owner.equals(PublicKey.default))throw new Error('An ordinary creator wallet is required.');
  if(!curve?.quoteMint||!isLegacyQuoteMint(curve.quoteMint))throw new Error('Only SOL-paired Pump coins are supported.');
  if(curve.isCashbackCoin||curve.isMayhemMode)throw new Error('Cashback and Mayhem coins cannot use this connector.');
  if(curve.complete&&!pool)throw new Error('The graduated canonical Pump pool is not available yet.');
  if(pool&&(!pool.baseMint?.equals(target)||pool.quoteMint?.toBase58()!==SOL||pool.isMayhemMode||pool.isCashbackCoin))throw new Error('Unsupported canonical pool mint, quote or rewards mode.');
  const currentCreator=curve.complete?pool.coinCreator:curve.creator;
  if(config) {
    if(!config.mint.equals(target)||!config.admin.equals(owner)||!curve.creator.equals(sharing)||!currentCreator?.equals(sharing))throw new Error('This wallet is not the coin’s recorded fee-configuration creator.');
    if(config.status?.paused)throw new Error('The on-chain fee configuration is paused.');
    if(editable&&(config.version!==2||config.adminRevoked||config.shareholders?.length!==1||!config.shareholders[0].address.equals(owner)||config.shareholders[0].shareBps!==10000))throw new Error('Fee shares are locked or already customized. The existing program cannot be replaced.');
  } else if(!currentCreator?.equals(owner))throw new Error('This wallet is not the on-chain Pump coin creator.');
  return {mint:target.toBase58(),creator:owner.toBase58(),role:config?'Recorded Pump fee-config creator':'On-chain Pump creator',editable:!config||config.version===2&&!config.adminRevoked};
}

// On-demand reads only: one free public-RPC batch, no paid indexer, account scan,
// API key, polling worker or automatic wallet discovery.
let freeConnection;
export async function verifyCommunityAuthority(mint,wallet,{editable=false,connection}={}) {
  const rpc=connection||(freeConnection ||= new Connection('https://api.mainnet-beta.solana.com',{commitment:'finalized',disableRetryOnRateLimit:true,confirmTransactionInitialTimeout:15000,fetch:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(15000)})}));
  const key=new PublicKey(mint),addresses=[bondingCurvePda(key),feeSharingConfigPda(key),canonicalPumpPoolPda(key)];
  const result=await rpc.getMultipleAccountsInfoAndContext(addresses,{commitment:'finalized'});
  if(!Array.isArray(result?.value)||result.value.length!==3)throw new Error('Coin authority data is incomplete. Try again; no fees were changed.');
  const [curveInfo,configInfo,pool]=result.value;
  if(!curveInfo?.owner.equals(PUMP_PROGRAM_ID))throw new Error('This is not a supported Pump coin.');
  if(configInfo&&!configInfo.owner.equals(PUMP_FEE_PROGRAM_ID))throw new Error('Invalid fee-configuration account owner.');
  if(pool&&!pool.owner.equals(PUMP_AMM_PROGRAM_ID))throw new Error('Invalid canonical pool owner.');
  // Legacy layouts omit newer trailing flags, not the creator. Never pad an
  // account whose creator field itself is truncated into an authority proof.
  if(curveInfo.data?.length<81||pool&&pool.data?.length<243)throw new Error('Incomplete creator account data.');
  const curve=PUMP_SDK.decodeBondingCurveNullable(curveInfo);
  if(!curve)throw new Error('Unsupported Pump creator account.');
  return {...assertCommunityAuthorityState({mint,wallet,curve,config:configInfo?PUMP_SDK.decodeSharingConfig(configInfo):null,pool:pool?PUMP_AMM_SDK.decodePool(pool):null,editable}),slot:result.context.slot,checkedAt:new Date().toISOString()};
}
