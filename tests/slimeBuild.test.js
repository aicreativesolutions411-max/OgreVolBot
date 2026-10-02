import test from 'node:test';
import assert from 'node:assert/strict';
import {createSlimeBuild} from '../src/lib/slimeBuild.js';

function fixture() {
  let state={projects:[]}, count=0, writes=0, tick=Date.parse('2026-10-02T12:00:00Z');
  const context={programs:[{mint:'owned',symbol:'TEST'}],goals:[{id:'goal-1',mint:'owned',title:'Game update',targetLamports:'3000000000',paidLamports:'750000000',payee:'treasury',shareBps:2000,receipts:[],receiptCount:0}]};
  let queue=Promise.resolve();
  const api=createSlimeBuild({read:async()=>structuredClone(state),write:async s=>{state=structuredClone(s);writes++;},lock:fn=>{const run=queue.then(fn);queue=run.catch(()=>{});return run;},context:async user=>user==='owner'?structuredClone(context):{programs:[],goals:[]},now:()=>tick++,id:()=>`project-${++count}`});
  const draft={requestId:'request-abcdefgh',title:'Playable game update',description:'A testable slice.',category:'game',mint:'owned',goalId:'goal-1',milestones:[{title:'Prototype',description:'Playable first room',budgetSol:'1',dueDate:'2026-11-01'},{title:'Polish',budgetSol:'2'}]};
  return {api,draft,state:()=>state,writes:()=>writes,context};
}
test('Build drafts are durable and private, never money or independently verified',async()=>{
  const f=fixture(),p=await f.api.create('owner',f.draft);
  assert.equal(p.budgetLamports,'3000000000');assert.equal(p.published,false);assert.equal(p.revision,1);
  assert.equal(p.funding.recordedReceivedLamports,'750000000');assert.equal(p.funding.availableLamports,null);assert.equal(p.funding.builderPaidLamports,null);
  assert.match(p.note,/not escrow/);assert.match(p.note,/creator-reported/);
  assert.equal((await f.api.publicData({id:p.id})).projects.length,0);
  assert.equal((await f.api.dashboard('other')).projects.length,0);
  assert.equal(f.state().projects.length,1);
});
test('create retries deduplicate and reject reused IDs with changed terms',async()=>{
  const f=fixture();const [a,b]=await Promise.all([f.api.create('owner',f.draft),f.api.create('owner',f.draft)]);
  assert.equal(a.id,b.id);assert.equal(f.writes(),1);
  await assert.rejects(f.api.create('owner',{...f.draft,title:'Changed'}),/different draft/);
});
test('ownership, funding target and amount validation fail closed',async()=>{
  const f=fixture();
  await assert.rejects(f.api.create('other',f.draft),/owned coin/);
  await assert.rejects(f.api.create('owner',{...f.draft,goalId:'someone-else'}),/project target/);
  for(const budgetSol of ['-1','NaN','Infinity','1e9','0.0000000001','1000001'])await assert.rejects(f.api.create('owner',{...f.draft,milestones:[{title:'Bad',budgetSol}]}));
  await assert.rejects(f.api.create('owner',{...f.draft,milestones:[{title:'Too much',budgetSol:'4'}]}),/target/);
  await assert.rejects(f.api.create('owner',{...f.draft,milestones:[]}),/milestone/);
  await assert.rejects(f.api.create('owner',{...f.draft,milestones:[{title:'Bad date',budgetSol:'1',dueDate:'2026-02-31'}]}),/date/);
});
test('public sharing needs explicit consent and does not disclose account or request IDs',async()=>{
  const f=fixture(),p=await f.api.create('owner',f.draft);
  await assert.rejects(f.api.update('owner',{id:p.id,revision:1,action:'publish'}),/acknowledge/);
  await assert.rejects(f.api.update('other',{id:p.id,revision:1,action:'publish',acknowledge:true}),/not found/);
  await f.api.update('owner',{id:p.id,revision:1,action:'publish',acknowledge:true});
  const rows=(await f.api.publicData({id:p.id})).projects;
  assert.equal(rows.length,1);assert.doesNotMatch(JSON.stringify(rows),/request-abcdefgh|userId|createHash/);
  assert.equal(rows[0].funding.recordedReceivedLamports,'750000000');
  await f.api.update('owner',{id:p.id,revision:2,action:'unpublish'});
  assert.equal((await f.api.publicData({id:p.id})).projects.length,0);
});
test('milestone evidence and acceptance follow a versioned state machine',async()=>{
  const f=fixture(),p=await f.api.create('owner',f.draft),mid=p.milestones[0].id;
  await assert.rejects(f.api.update('owner',{id:p.id,revision:1,action:'accept',milestoneId:mid,note:'good'}),/submitted/);
  await assert.rejects(f.api.update('owner',{id:p.id,revision:1,action:'submit',milestoneId:mid,note:'done',evidence:'javascript:alert(1)'}),/HTTPS/);
  await assert.rejects(f.api.update('owner',{id:p.id,revision:1,action:'submit',milestoneId:mid,note:'done',evidence:'https://user:secret@example.org/'}),/HTTPS/);
  const submit=await f.api.update('owner',{id:p.id,revision:1,action:'submit',milestoneId:mid,note:'Playable build',evidence:'https://example.org/build'});
  assert.equal(submit.milestones[0].status,'SUBMITTED');assert.equal(submit.revision,2);
  await assert.rejects(f.api.update('owner',{id:p.id,revision:1,action:'accept',milestoneId:mid,note:'tested'}),/changed/);
  const accept=await f.api.update('owner',{id:p.id,revision:2,action:'accept',milestoneId:mid,note:'Tested the room',acknowledge:true});
  assert.equal(accept.milestones[0].status,'ACCEPTED');assert.equal(accept.acceptedCount,1);assert.equal(accept.history.length,3);
  assert.equal(accept.funding.builderPaidLamports,null);assert.match(accept.history[2].label,/creator/);
  await f.api.update('owner',{id:p.id,revision:3,action:'reopen',milestoneId:mid,note:'Needs controller work'});
  const final=(await f.api.dashboard('owner')).projects[0];assert.equal(final.milestones[0].status,'IN_PROGRESS');assert.equal(final.history.length,4);assert.equal(final.history[1].evidence,'https://example.org/build');
});
test('parallel updates cannot overwrite each other and archive is reversible',async()=>{
  const f=fixture(),p=await f.api.create('owner',f.draft);
  const actions=await Promise.allSettled([f.api.update('owner',{id:p.id,revision:1,action:'archive'}),f.api.update('owner',{id:p.id,revision:1,action:'publish',acknowledge:true})]);
  assert.equal(actions.filter(r=>r.status==='fulfilled').length,1);
  await assert.rejects(f.api.update('owner',{id:p.id,revision:2,action:'start',milestoneId:p.milestones[0].id}),/archived/);
  const restored=await f.api.update('owner',{id:p.id,revision:2,action:'restore'});assert.equal(restored.archived,false);
});
test('lost or mismatched funding records remain unknown, never zero or a spendable balance',async()=>{
  const f=fixture(),p=await f.api.create('owner',f.draft);f.context.goals=[];
  const current=(await f.api.dashboard('owner')).projects[0];assert.equal(current.funding.recordedReceivedLamports,null);assert.equal(current.funding.availableLamports,null);
  assert.equal(current.budgetLamports,p.budgetLamports);
});
