import test from 'node:test';import assert from 'node:assert/strict';
import {hasManualCreatorFees} from '../src/lib/creatorClaimPolicy.js';
const a={userId:'1',devWalletPublicKey:'wallet',rail:'pump',status:'COMPLETE',creatorFeeClaimMode:'manual'};
test('a manual coin protects wallet-wide creator accrual from another automatic coin',()=>{
 assert.equal(hasManualCreatorFees([a,{...a,creatorFeeClaimMode:'auto'}],1,'wallet'),true);
 for(const edit of [{userId:2},{devWalletPublicKey:'other'},{status:'FAILED'},{creatorFeeClaimMode:'auto'},{rail:'robinhood'},{launchUtility:{mode:'holder_alliance'}},{pumpCashback:true},{holderRewards:{enabled:true}}])assert.equal(hasManualCreatorFees([{...a,...edit}],1,'wallet'),false);
});
