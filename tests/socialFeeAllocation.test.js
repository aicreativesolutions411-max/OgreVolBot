import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHolderAlliance, allocateHolderCycle, holderLiabilities, HOLDER_VAULT_RESERVE } from '../src/lib/holderAlliance.js';
const policy={mode:'holder_alliance',creatorShareBps:2000,ownHolderShareBps:0,partnerHolderShareBps:0,recipients:[],socialRecipients:[{handle:'artist',xUserId:'123456789',shareBps:8000,name:'Artist'}]};
test('X credits remain liabilities unavailable to later holder allocations',()=>{
  assert.equal(holderLiabilities({credits:{},socialCredits:{'123456789':'10000'}}),10000n);
});
test('native X allocation preserves stable identity and exact reserved funds',()=>{
  const p=normalizeHolderAlliance(policy);assert.equal(p.socialShareBps,8000);assert.equal(p.version,4);
  const s=allocateHolderCycle({}, {policy:p,balance:String(HOLDER_VAULT_RESERVE+7000000n),snapshots:{},now:1000});
  assert.equal(s.socialCredits['123456789'],'7000000');assert.deepEqual(s.credits,{});
  assert.equal(holderLiabilities(s),7000000n);assert.equal(s.allocatedBySource['x:123456789'],'7000000');
});
test('duplicate X IDs and mismatched aggregate shares are rejected',()=>{
  assert.throws(()=>normalizeHolderAlliance({...policy,socialRecipients:[{handle:'a',xUserId:'123',shareBps:4000},{handle:'b',xUserId:'123',shareBps:4000}]}),/Duplicate X/);
  assert.throws(()=>normalizeHolderAlliance({...policy,socialShareBps:100}),/percentages/);
});
test('rounding across communities, wallets and X never creates money',()=>{
  const p={...policy,ownHolderShareBps:4000,socialRecipients:[{handle:'a',xUserId:'123',shareBps:2000},{handle:'b',xUserId:'456',shareBps:2000}]};
  for(let i=1;i<60;i++){
    const s=allocateHolderCycle({}, {policy:p,balance:String(HOLDER_VAULT_RESERVE+BigInt(i)),snapshots:{own:{holders:[]}},now:1000});
    assert.equal(holderLiabilities(s),BigInt(i));
  }
});
