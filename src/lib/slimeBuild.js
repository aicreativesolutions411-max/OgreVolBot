import {createHash, randomUUID} from 'node:crypto';

// A delivery record, deliberately not a financial executor. No signing keys,
// RPC, balances, fee mutations, schedules or transfers belong in this service.
const NOTE='Milestones and acceptance are creator-reported, not independent verification. This board is not escrow, a payment authorization, or a promise of delivery. Planned budgets do not reserve funds; existing fee shares and holder credits are unchanged.';
const categories=new Set(['game','website','bot','art','community']);
const clean=(value,max)=>String(value??'').trim().replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,max);
const owned=(p,user)=>p.userId===String(user);
const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const iso=now=>new Date(now).toISOString();
function sol(value) {
  const raw=String(value??'');
  if(!/^\d{1,7}(?:\.\d{1,9})?$/.test(raw))throw Error('Enter a planned SOL budget with at most nine decimals.');
  const [a,b='']=raw.split('.'),n=BigInt(a)*1000000000n+BigInt(b.padEnd(9,'0'));
  if(n<=0n||n>1000000000000000n)throw Error('Each planned budget must be above zero and at most 1,000,000 SOL.');
  return String(n);
}
function date(value) {
  if(!value)return '';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw Error('Choose a valid milestone date.');
  return value;
}
function evidenceUrl(value) {
  try {const u=new URL(String(value));if(u.protocol!=='https:'||u.username||u.password||u.href.length>1500)throw Error();return u.href;}
  catch {throw Error('Add a public HTTPS evidence link without embedded credentials.');}
}
function normalized(input) {
  const title=clean(input.title,80);if(!title)throw Error('Give your project a title.');
  if(!categories.has(input.category))throw Error('Choose a project category.');
  if(!Array.isArray(input.milestones)||!input.milestones.length||input.milestones.length>12)throw Error('Add between 1 and 12 milestones.');
  const milestones=input.milestones.map((m,i)=>{
    const title=clean(m.title,100);if(!title)throw Error('Every milestone needs a deliverable.');
    return {id:'m'+(i+1),title,description:clean(m.description,400),budgetLamports:sol(m.budgetSol),dueDate:date(m.dueDate),status:'PLANNED',evidence:'',note:''};
  });
  const budget=milestones.reduce((n,m)=>n+BigInt(m.budgetLamports),0n);if(budget>1000000000000000n)throw Error('Total planned budget cannot exceed 1,000,000 SOL.');
  return {title,description:clean(input.description,1200),category:input.category,mint:clean(input.mint,44),goalId:clean(input.goalId,80),milestones,budgetLamports:String(budget)};
}
function publicProject(p,goals=[]) {
  const g=goals.find(g=>g.id===p.goalId&&g.mint===p.mint);
  return {id:p.id,title:p.title,description:p.description,category:p.category,mint:p.mint,symbol:p.symbol,goalId:p.goalId,
    budgetLamports:p.budgetLamports,published:p.published,archived:p.archived,revision:p.revision,createdAt:p.createdAt,updatedAt:p.updatedAt,
    milestones:p.milestones.map(m=>({...m})),acceptedCount:p.milestones.filter(m=>m.status==='ACCEPTED').length,
    history:p.history.map(({at,action,label,milestoneId,note,evidence})=>({at,action,label,milestoneId,note,evidence})),
    funding:{goalId:p.goalId,targetLamports:g?.targetLamports??null,recordedReceivedLamports:g?.paidLamports??null,payee:g?.payee||'',
      availableLamports:null,builderPaidLamports:null,receiptCount:g?.receiptCount??null,
      note:g?'Finalized creator-fee receipts recorded for the linked project target. Not a treasury balance, reserved budget, or payment to a builder.':'No linked, available project funding record. Planned budgets are not money received.'},note:NOTE};
}
export function createSlimeBuild({read,write,lock,context,now=Date.now,id=randomUUID}) {
  const load=async()=>{const s=await read();if(!s||!Array.isArray(s.projects))throw Error('Build records are unavailable. No change was saved.');return s;};
  const owner=async(userId)=>{if(!String(userId||''))throw Error('Sign in to manage a Build project.');return context(userId);};
  return {
    async create(userId,input) {
      return lock(async()=>{
        const c=await owner(userId),values=normalized(input),requestId=String(input.requestId||'');
        if(!/^[a-zA-Z0-9_-]{12,80}$/.test(requestId))throw Error('A valid draft operation ID is required. Refresh the editor.');
        if(values.mint&&!c.programs.some(p=>p.mint===values.mint))throw Error('Select an owned coin, or create an unlinked project.');
        const goal=c.goals.find(g=>g.id===values.goalId&&g.mint===values.mint);
        if(values.goalId&&!goal)throw Error('Select an owned project target for this coin.');
        if(goal&&BigInt(values.budgetLamports)>BigInt(goal.targetLamports))throw Error('Milestone budgets exceed the linked project target.');
        const s=await load(),hash=digest(values),existing=s.projects.find(p=>owned(p,userId)&&p.requestId===requestId);
        if(existing){if(existing.createHash!==hash)throw Error('This operation ID belongs to a different draft. Refresh before creating another project.');return publicProject(existing,c.goals);}
        if(s.projects.filter(p=>owned(p,userId)).length>=40)throw Error('This account has reached its 40 project limit. Existing records are preserved.');
        const at=iso(now()),p={...values,id:id(),userId:String(userId),requestId,createHash:hash,symbol:clean(c.programs.find(p=>p.mint===values.mint)?.symbol,16),
          published:false,archived:false,revision:1,createdAt:at,updatedAt:at,history:[{at,action:'create',label:'Project plan recorded',note:'Private until explicitly shared.'}]};
        s.projects.push(p);await write(s);return publicProject(p,c.goals);
      });
    },
    async update(userId,input) {
      return lock(async()=>{
        const c=await owner(userId),s=await load(),p=s.projects.find(p=>p.id===input.id&&owned(p,userId));
        if(!p)throw Error('Project not found.');
        if(input.revision!==p.revision)throw Error('This project changed. Refresh and review the latest version before trying again.');
        if(p.history.length>=500)throw Error('Project history limit reached. Existing evidence is preserved.');
        const action=input.action,note=clean(input.note,600),at=iso(now()),event={at,action,note};
        if(action==='publish'){
          if(input.acknowledge!==true)throw Error('Please acknowledge that all project details, evidence and history will be public.');
          if(p.published)throw Error('This project is already public.');p.published=true;event.label='Creator published the project record';
        }else if(action==='unpublish'){if(!p.published)throw Error('This project is already private.');p.published=false;event.label='Creator made the record private';}
        else if(action==='archive'){if(p.archived)throw Error('This project is already archived.');p.archived=true;event.label='Creator archived the project';}
        else if(action==='restore'){if(!p.archived)throw Error('This project is already active.');p.archived=false;event.label='Creator restored the project';}
        else {
          if(p.archived)throw Error('Restore this archived project before updating milestones.');
          const m=p.milestones.find(m=>m.id===input.milestoneId);if(!m)throw Error('Milestone not found.');event.milestoneId=m.id;
          if(action==='start'){
            if(m.status!=='PLANNED')throw Error('Only a planned milestone can be started.');m.status='IN_PROGRESS';event.label='Creator marked work in progress';
          }else if(action==='submit'){
            if(!['PLANNED','IN_PROGRESS'].includes(m.status))throw Error('Reopen this milestone before submitting new evidence.');
            if(!note)throw Error('Describe what was delivered.');m.evidence=evidenceUrl(input.evidence);m.note=note;m.status='SUBMITTED';event.evidence=m.evidence;event.label='Evidence submitted by creator';
          }else if(action==='accept'){
            if(m.status!=='SUBMITTED')throw Error('Evidence must be submitted before acceptance.');
            if(input.acknowledge!==true||!note)throw Error('Acknowledge creator-reported acceptance and add a review note.');
            m.status='ACCEPTED';m.note=note;event.label='Accepted by creator · not independent verification';
          }else if(action==='reopen'){
            if(!['SUBMITTED','ACCEPTED'].includes(m.status)||!note)throw Error('Only a submitted or accepted milestone can be reopened with a reason.');
            m.status='IN_PROGRESS';m.note=note;event.label='Creator reopened the milestone';
          }else throw Error('Unknown project action.');
          m.updatedAt=at;
        }
        p.revision++;p.updatedAt=at;p.history.push(event);await write(s);return publicProject(p,c.goals);
      });
    },
    async dashboard(userId) {
      const [c,s]=await Promise.all([owner(userId),load()]);
      return {projects:s.projects.filter(p=>owned(p,userId)).map(p=>publicProject(p,c.goals)).reverse(),
        programs:c.programs.map(p=>({mint:p.mint,symbol:p.symbol})),goals:c.goals.map(g=>({id:g.id,mint:g.mint,title:g.title,targetLamports:g.targetLamports})),note:NOTE};
    },
    async publicData({id:projectId}={}) {
      const s=await load(),rows=s.projects.filter(p=>p.published&&(!projectId||p.id===projectId)).slice(-60).reverse();
      // Fetch stored owner context only; public output never includes user IDs,
      // sign-in state, request IDs, wallet labels or unrelated account records.
      const contexts=new Map();
      const projects=[];for(const p of rows){if(!contexts.has(p.userId))contexts.set(p.userId,await context(p.userId));projects.push(publicProject(p,contexts.get(p.userId)?.goals||[]));}
      return {projects,note:NOTE};
    }
  };
}
