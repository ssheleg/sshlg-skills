'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert');
const W=require('../lib/wait-rules'),P=require('../lib/wait-rule-policy'),A=require('../lib/apply'),B=require('../lib/backup');
let n=0,fail=0;const opts={env:{},cursor:false,hostTargets:A.TARGETS.filter(x=>x.agent==='codex')};
function test(name,fn){const h=fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(),'sshlg-wait-recovery-')));try{const d=path.join(h,'.codex');fs.mkdirSync(d);P.set(h,'on');fn(h,path.join(d,'AGENTS.md'));n++;console.log('ok '+name);}catch(e){fail++;console.error('FAIL '+name+': '+e.message);}finally{fs.rmSync(h,{recursive:true,force:true});}}
function interrupt(h,f,after=false){const plan=W.plan(h,opts),replace=P.replace;P.replace=(home,file,...args)=>{if(file===f){if(after)replace(home,file,...args);throw Error('injected target boundary');}return replace(home,file,...args);};try{const r=W.execute(plan);assert.equal(r.ok,false);}finally{P.replace=replace;}return plan;}
test('before-write failure retains exact recovery bytes through 15 ordinary saves', (h,f)=>{fs.writeFileSync(f,'BEFORE');interrupt(h,f);const info=W.inspectRecovery(h);assert.equal(info.state,'before');const ref=info.operation.backup.reference;for(let i=0;i<15;i++)B.save({home:h,file:f});assert.equal(fs.readFileSync(path.join(path.dirname(ref.file),ref.backup),'utf8'),'BEFORE');const resolved=W.resolveRecovery(h);assert.equal(resolved.state,'recovered-no-write');assert.equal(fs.readFileSync(f,'utf8'),'BEFORE');});
test('post-write failure classifies committed without repeating a host write',(h,f)=>{fs.writeFileSync(f,'BEFORE');const plan=interrupt(h,f,true);assert.equal(W.inspectRecovery(h).state,'after');const replace=P.replace;P.replace=(home,file,...args)=>{assert.notEqual(file,f,'recovery must not rewrite host');return replace(home,file,...args);};try{assert.equal(W.resolveRecovery(h).state,'recovered-committed');}finally{P.replace=replace;}assert.equal(fs.readFileSync(f,'utf8'),plan.rows[0].text);assert.equal(W.execute(W.plan(h,opts)).ok,true);});
test('absent original is distinct from an existing empty file',(h,f)=>{interrupt(h,f);const info=W.inspectRecovery(h);assert.equal(info.operation.before.exists,false);assert.equal(info.state,'before');fs.writeFileSync(f,'');assert.equal(W.inspectRecovery(h).state,'unresolved');const receipt=fs.readFileSync(W.receiptPath(h));assert.throws(()=>W.resolveRecovery(h));assert.ok(fs.readFileSync(W.receiptPath(h)).equals(receipt));});
test('legacy pending remains unresolved and byte-identical',(h,f)=>{fs.writeFileSync(f,'BEFORE');const file=W.receiptPath(h);fs.writeFileSync(file,JSON.stringify({schema:1,records:{},pending:{file:f,beforeHash:'a'.repeat(64),afterHash:'b'.repeat(64)}}),{mode:0o600});const before=fs.readFileSync(file);assert.equal(W.inspectRecovery(h).state,'legacy-unresolved');assert.throws(()=>W.resolveRecovery(h));assert.ok(fs.readFileSync(file).equals(before));});
test('changed policy refuses metadata recovery and preserves pending',(h,f)=>{fs.writeFileSync(f,'BEFORE');interrupt(h,f,true);P.set(h,'off');assert.equal(W.inspectRecovery(h).state,'unresolved');const before=fs.readFileSync(W.receiptPath(h));assert.throws(()=>W.resolveRecovery(h));assert.ok(fs.readFileSync(W.receiptPath(h)).equals(before));});
test('third-party content is never restored or adopted',(h,f)=>{fs.writeFileSync(f,'BEFORE');interrupt(h,f);fs.writeFileSync(f,'FOREIGN');assert.equal(W.inspectRecovery(h).state,'unresolved');assert.throws(()=>W.resolveRecovery(h));assert.equal(fs.readFileSync(f,'utf8'),'FOREIGN');});

for(const cut of [1,2,3])test('receipt write boundary '+cut+' fails without falsely completing',(h,f)=>{
 fs.writeFileSync(f,'BEFORE');const plan=W.plan(h,opts),replace=P.replace;let calls=0;
 P.replace=(home,file,...args)=>{if(file===W.receiptPath(h)&&++calls===cut)throw Error('receipt boundary');return replace(home,file,...args);};
 try{assert.equal(W.execute(plan).ok,false);}finally{P.replace=replace;}
 assert.equal(fs.readFileSync(f,'utf8'),cut===3?plan.rows[0].text:'BEFORE');
 const info=W.inspectRecovery(h);assert.equal(info.state,cut===1?'none':cut===2?'unresolved':'after');
});
for(const phase of ['link','unlink'])test('retirement '+phase+' interruption retains and resumes exact reference',(h,f)=>{
 fs.writeFileSync(f,'BEFORE');const R=require('../lib/backup-retention'),plan=W.plan(h,opts),original=phase==='link'?fs.linkSync:fs.unlinkSync;let planted=false;
 const prop=phase==='link'?'linkSync':'unlinkSync';
 fs[prop]=(...args)=>{if(!planted&&(phase==='link'?String(args[1]).includes('.released-'):String(args[0]).includes('.retain-'))){planted=true;throw Error('retirement boundary');}return original(...args);};
 try{assert.equal(W.execute(plan).ok,false);}finally{fs[prop]=original;}
 assert(planted);const data=JSON.parse(fs.readFileSync(W.receiptPath(h))),ref=data.lastOperation.backup.reference;
 assert(fs.existsSync(ref.file));assert.equal(R.retired(ref),false);assert.equal(W.inspectRecovery(h).state,'after');
 assert.equal(W.resolveRecovery(h).state,'recovered-committed');assert.equal(R.retired(ref),true);assert.equal(fs.readFileSync(f,'utf8'),plan.rows[0].text);
});
test('a committed target later reverted to original bytes is not classified as no-write',(h,f)=>{
 fs.writeFileSync(f,'BEFORE');const R=require('../lib/backup-retention'),release=R.releaseWait;R.releaseWait=()=>{throw Error('retirement pending');};try{assert.equal(W.execute(W.plan(h,opts)).ok,false);}finally{R.releaseWait=release;}
 fs.writeFileSync(f,'BEFORE');assert.equal(W.inspectRecovery(h).state,'unresolved');assert.throws(()=>W.resolveRecovery(h));
});

test('three repeated completed resolutions are byte-identical no-ops',(h,f)=>{
 fs.writeFileSync(f,'BEFORE');interrupt(h,f,true);W.resolveRecovery(h);const file=W.receiptPath(h),before=fs.readFileSync(file);
 for(let i=0;i<3;i++){assert.equal(W.resolveRecovery(h).state,'none');assert.ok(fs.readFileSync(file).equals(before));}
});
test('actual case alias keeps canonical reference binding',(h,f)=>{
 const lower=path.join(path.dirname(f),'agents.md');fs.writeFileSync(lower,'BEFORE');
 if(!fs.existsSync(f))fs.renameSync(lower,f);
 assert.equal(W.execute(W.plan(h,opts)).ok,true);assert.equal(W.inspectRecovery(h).state,'none');
});

test('malformed next ownership cannot be written during metadata resolution',(h,f)=>{
 fs.writeFileSync(f,'BEFORE');interrupt(h,f,true);const file=W.receiptPath(h),data=JSON.parse(fs.readFileSync(file));const key=Object.keys(data.pending.nextRecords)[0];delete data.pending.nextRecords[key].root;fs.writeFileSync(file,JSON.stringify(data));const before=fs.readFileSync(file);assert.throws(()=>W.resolveRecovery(h),/ownership/);assert.ok(fs.readFileSync(file).equals(before));
});
test('foreign retirement destination is preserved and cannot free reference',(h,f)=>{
 fs.writeFileSync(f,'BEFORE');const link=fs.linkSync;let dest;
 fs.linkSync=(a,b)=>{if(b.includes('.released-')){dest=b;fs.writeFileSync(b,'FOREIGN',{mode:0o600});}return link(a,b);};
 try{assert.equal(W.execute(W.plan(h,opts)).ok,false);}finally{fs.linkSync=link;}
 assert.equal(fs.readFileSync(dest,'utf8'),'FOREIGN');const data=JSON.parse(fs.readFileSync(W.receiptPath(h)));assert(fs.existsSync(data.lastOperation.backup.reference.file));assert.throws(()=>W.resolveRecovery(h),/foreign/);assert.equal(fs.readFileSync(dest,'utf8'),'FOREIGN');
});

test('relocated reference outside owner backup namespace is not silently adopted',(h,f)=>{
 fs.writeFileSync(f,'BEFORE');interrupt(h,f);const file=W.receiptPath(h),data=JSON.parse(fs.readFileSync(file)),ref=data.pending.backup.reference;
 const outside=path.join(h,'unrelated');fs.mkdirSync(outside,{mode:0o700});for(const name of [path.basename(ref.file),ref.backup])fs.copyFileSync(path.join(path.dirname(ref.file),name),path.join(outside,name));
 ref.file=path.join(outside,path.basename(ref.file));fs.writeFileSync(file,JSON.stringify(data));const before=fs.readFileSync(file),names=fs.readdirSync(outside);
 assert.equal(W.inspectRecovery(h).state,'unresolved');assert.throws(()=>W.resolveRecovery(h));assert.ok(fs.readFileSync(file).equals(before));assert.deepEqual(fs.readdirSync(outside),names);
});

for(const plant of ['drop-sibling','add-sibling','edit-sibling','target-root','target-canonical-root','target-agent','target-prefix','target-previous','drop-target'])test('recovery refuses ownership delta '+plant,(h,f)=>{
 const cf=path.join(h,'.claude','CLAUDE.md');fs.mkdirSync(path.dirname(cf));fs.writeFileSync(cf,'CLAUDE ORIGINAL');
 const co={...opts,hostTargets:A.TARGETS.filter(x=>x.agent==='claude')};assert.equal(W.execute(W.plan(h,co)).ok,true);
 fs.writeFileSync(f,'CODEX ORIGINAL');interrupt(h,f,true);const file=W.receiptPath(h),data=JSON.parse(fs.readFileSync(file)),next=data.pending.nextRecords;
 const sibling=Object.keys(data.records)[0],target=Object.keys(next).find(k=>k!==sibling),digest=s=>require('crypto').createHash('sha256').update(s).digest('hex');
 if(plant==='drop-sibling')delete next[sibling];
 if(plant==='add-sibling'){const r={...next[sibling],file:path.join(h,'other','CLAUDE.md')};next[digest(r.file)]=r;}
 if(plant==='edit-sibling')next[sibling]={...next[sibling],previousSegment:'invented'};
 if(plant==='target-root')next[target].root=path.join(h,'different');
 if(plant==='target-canonical-root')next[target].canonicalRoot=path.join(h,'different');
 if(plant==='target-agent')next[target].agent='pi';
 if(plant==='target-prefix'){next[target].segment=next[target].segment.slice(1);next[target].sourceHash=digest(next[target].segment);}
 if(plant==='target-previous')next[target].previousSegment='invented';
 if(plant==='drop-target')delete next[target];
 fs.writeFileSync(file,JSON.stringify(data));const before=fs.readFileSync(file),cb=fs.readFileSync(cf),fb=fs.readFileSync(f);
 assert.throws(()=>W.resolveRecovery(h),/ownership|transition/);assert.ok(fs.readFileSync(file).equals(before));assert.ok(fs.readFileSync(cf).equals(cb));assert.ok(fs.readFileSync(f).equals(fb));
});
test('post-write remove preserves sibling ownership and exact foreign text',(h,f)=>{
 const cf=path.join(h,'.claude','CLAUDE.md');fs.mkdirSync(path.dirname(cf));fs.writeFileSync(cf,'CLAUDE ORIGINAL');assert.equal(W.execute(W.plan(h,{...opts,hostTargets:A.TARGETS.filter(x=>x.agent==='claude')})).ok,true);const siblings=W.receipt(h).data.records,cb=fs.readFileSync(cf);
 fs.writeFileSync(f,'FOREIGN');assert.equal(W.execute(W.plan(h,opts)).ok,true);P.set(h,'off');interrupt(h,f,true);
 assert.equal(W.resolveRecovery(h).state,'recovered-committed');assert.equal(fs.readFileSync(f,'utf8'),'FOREIGN');assert.deepEqual(W.receipt(h).data.records,siblings);assert.ok(fs.readFileSync(cf).equals(cb));
});
test('operation without prior ownership proof remains unresolved without migration',(h,f)=>{
 fs.writeFileSync(f,'BEFORE');interrupt(h,f,true);const file=W.receiptPath(h),data=JSON.parse(fs.readFileSync(file));delete data.pending.priorRecords;fs.writeFileSync(file,JSON.stringify(data));const before=fs.readFileSync(file);assert.throws(()=>W.resolveRecovery(h),/ownership/);assert.ok(fs.readFileSync(file).equals(before));
});
for(const phase of ['link','unlink'])test('no-write recovery retirement '+phase+' interruption resumes without ownership adoption',(h,f)=>{
 fs.writeFileSync(f,'BEFORE');interrupt(h,f);const prop=phase==='link'?'linkSync':'unlinkSync',original=fs[prop];let planted=false;
 fs[prop]=(...args)=>{if(!planted&&(phase==='link'?String(args[1]).includes('.released-'):String(args[0]).includes('.retain-'))){planted=true;throw Error('no-write retirement boundary');}return original(...args);};
 try{assert.throws(()=>W.resolveRecovery(h),/boundary/);}finally{fs[prop]=original;}
 assert(planted);const data=JSON.parse(fs.readFileSync(W.receiptPath(h)));assert.equal(data.lastOperation.state,'recovered-no-write');assert.deepEqual(data.records,{});assert.equal(fs.readFileSync(f,'utf8'),'BEFORE');assert(fs.existsSync(data.lastOperation.backup.reference.file));
 assert.equal(W.resolveRecovery(h).state,'recovered-no-write');assert.equal(fs.readFileSync(f,'utf8'),'BEFORE');assert.deepEqual(W.receipt(h).data.records,{});assert.equal(W.inspectRecovery(h).state,'none');
});
console.log(fail ? `FAIL: wait_recovery — ${n} passed; ${fail} failed` : `PASS: wait_recovery — ${n} cases`);process.exitCode=fail?1:0;
