'use strict';
const assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path');
const W=require('../lib/wait-rules.js'),P=require('../lib/wait-rule-policy.js'),T=require('../lib/wait-rule-text.js'),A=require('../lib/apply.js');
let n=0,failed=0;
function test(name,fn){const home=fs.mkdtempSync(path.join(os.tmpdir(),'sshlg-wait-emit-'));try{fn(home);n++;console.log('ok '+name);}catch(e){failed++;console.error('FAIL '+name+': '+e.stack);}finally{fs.rmSync(home,{recursive:true,force:true});}}
const opts={env:{},cursor:false};
function host(home,agent,raw='FOREIGN\n'){const t=A.TARGETS.find(x=>x.agent===agent),root=path.join(home,t.dir);fs.mkdirSync(root,{recursive:true});const file=path.join(root,t.file);fs.writeFileSync(file,raw);return file;}
function apply(home,o={}){const p=W.plan(home,{...opts,...o});const r=W.execute(p);assert.equal(r.ok,true,JSON.stringify(r));return p;}
test('default-off and old consent do not add rules',h=>{const f=host(h,'codex');apply(h);assert.equal(fs.readFileSync(f,'utf8'),'FOREIGN\n');});
test('five hosts carry the right variant; third application is byte-identical',h=>{
 const files=A.TARGETS.map(t=>host(h,t.agent));fs.mkdirSync(path.join(h,'.cursor','rules'),{recursive:true});P.set(h,'on');const p=apply(h,{cursor:true});for(const row of p.rows){const text=fs.readFileSync(row.file,'utf8');assert.equal(text,row.text);assert.equal(text.includes('run_in_background'),row.agent==='claude');}
 const before=p.rows.map(r=>fs.readFileSync(r.file,'utf8'));apply(h,{cursor:true});apply(h,{cursor:true});assert.deepEqual(p.rows.map(r=>fs.readFileSync(r.file,'utf8')),before);
});
test('Cursor off removes only its dedicated owned file and can be enabled again',h=>{const d=path.join(h,'.cursor','rules');fs.mkdirSync(d,{recursive:true});P.set(h,'on');apply(h,{cursor:true});P.set(h,'off');apply(h,{cursor:true});assert(!fs.existsSync(path.join(d,'sshlg-wait.mdc')));P.set(h,'on');apply(h,{cursor:true});assert(fs.existsSync(path.join(d,'sshlg-wait.mdc')));});
test('selected host only; absent roots are not created',h=>{const f=host(h,'claude');host(h,'codex');P.set(h,'on');apply(h,{hostTargets:A.TARGETS.filter(t=>t.agent==='codex')});assert.equal(fs.readFileSync(f,'utf8'),'FOREIGN\n');assert(!fs.existsSync(path.join(h,'.gemini')));});
test('off removes owned segment and preserves appended foreign bytes',h=>{const f=host(h,'codex','no final newline');P.set(h,'on');apply(h);fs.appendFileSync(f,'FOREIGN AFTER\n');P.set(h,'off');apply(h);assert.equal(fs.readFileSync(f,'utf8'),'no final newlineFOREIGN AFTER\n');});
test('automatic update touches only previously applied profiles',h=>{const f=host(h,'codex');P.set(h,'on');apply(h);const g=host(h,'gemini');apply(h,{automatic:true});assert.equal(fs.readFileSync(g,'utf8'),'FOREIGN\n');assert(fs.readFileSync(f,'utf8').includes(T.BEGIN));});
test('custom root with spaces works without default profile writes',h=>{const f=host(h,'codex');const root=path.join(h,'custom codex');fs.mkdirSync(root);P.set(h,'on');apply(h,{roots:{codex:root}});assert(fs.readFileSync(path.join(root,'AGENTS.md'),'utf8').includes(T.BEGIN));assert.equal(fs.readFileSync(f,'utf8'),'FOREIGN\n');});
test('retargeted root alias refuses and preserves new target',h=>{const a=path.join(h,'a'),b=path.join(h,'b'),alias=path.join(h,'profile');fs.mkdirSync(a);fs.mkdirSync(b);fs.symlinkSync(a,alias);P.set(h,'on');const o={roots:{codex:alias},hostTargets:A.TARGETS.filter(t=>t.agent==='codex')};apply(h,o);fs.unlinkSync(alias);fs.symlinkSync(b,alias);assert.throws(()=>W.plan(h,{...opts,...o}),/binding changed/);assert.deepEqual(fs.readdirSync(b),[]);});
for(const raw of [T.BEGIN+'\n',T.BEGIN+'\n'+T.END+'\n',T.BEGIN+T.END+T.BEGIN+T.END])test('unknown or malformed markers refuse before write',h=>{const f=host(h,'codex',raw);P.set(h,'on');assert.throws(()=>W.plan(h,opts));assert.equal(fs.readFileSync(f,'utf8'),raw);});
test('edited owned region refuses even off',h=>{const f=host(h,'codex');P.set(h,'on');apply(h);fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace('Finish a unit','CUSTOM unit'));const before=fs.readFileSync(f,'utf8');P.set(h,'off');assert.throws(()=>W.plan(h,opts));assert.equal(fs.readFileSync(f,'utf8'),before);});
test('foreign Cursor filename refuses',h=>{const d=path.join(h,'.cursor','rules');fs.mkdirSync(d,{recursive:true});fs.writeFileSync(path.join(d,'sshlg-wait.mdc'),'foreign');P.set(h,'on');assert.throws(()=>W.plan(h,{...opts,cursor:true}),/foreign Cursor/);});
test('changed target between preview and execute refuses before target write',h=>{const f=host(h,'codex');P.set(h,'on');const p=W.plan(h,opts);fs.writeFileSync(f,'CONCURRENT');const r=W.execute(p);assert.equal(r.ok,false);assert.equal(fs.readFileSync(f,'utf8'),'CONCURRENT');});
test('failed target backup leaves pending recovery and no target write',h=>{const f=host(h,'codex');P.set(h,'on');const p=W.plan(h,opts);const protect=A.protect;A.protect=(file,o)=>file===f?{action:'backup-failed',error:'injected'}:protect(file,o);try{const r=W.execute(p);assert.equal(r.ok,false);assert.equal(fs.readFileSync(f,'utf8'),'FOREIGN\n');assert.throws(()=>W.plan(h,opts),/unfinished/);}finally{A.protect=protect;}});
for(const target of ['instruction','receipt'])test('invalid UTF-8 '+target+' refuses with exact bytes and no new files',h=>{
 const f=host(h,'codex');P.set(h,'on');const invalid=target==='instruction'?Buffer.from([255,254,0]):Buffer.concat([Buffer.from('{"schema":1,"records":{},"foreign":"'),Buffer.from([255]),Buffer.from('"}')]);const file=target==='instruction'?f:W.receiptPath(h);fs.writeFileSync(file,invalid);const names=fs.readdirSync(path.join(h,'.sshlg-skills')).sort();assert.throws(()=>W.plan(h,opts),/UTF-8/);assert(fs.readFileSync(file).equals(invalid));assert.deepEqual(fs.readdirSync(path.join(h,'.sshlg-skills')).sort(),names);
});
test('policy off after first target prevents the second target and retains first ownership',h=>{
 const first=host(h,'claude'),second=host(h,'codex');P.set(h,'on');const p=W.plan(h,opts),rename=fs.renameSync;let once=false;
 fs.renameSync=(from,to)=>{const result=rename(from,to);if(to===first&&!once){once=true;P.set(h,'off');}return result;};
 let result;try{result=W.execute(p);}finally{fs.renameSync=rename;}
 assert.equal(result.ok,false);assert(fs.readFileSync(first,'utf8').includes(T.BEGIN));assert.equal(fs.readFileSync(second,'utf8'),'FOREIGN\n');assert.equal(Object.keys(W.receipt(h).data.records).length,1);
});
test('policy off during target backup refuses before writing that target',h=>{
 const f=host(h,'codex');P.set(h,'on');const p=W.plan(h,opts),protect=A.protect;let once=false;
 A.protect=(file,o)=>{const saved=protect(file,o);if(file===f&&!once){once=true;P.set(h,'off');}return saved;};
 let result;try{result=W.execute(p);}finally{A.protect=protect;}
 assert.equal(result.ok,false);assert.equal(fs.readFileSync(f,'utf8'),'FOREIGN\n');
});
test('unknown source revision refuses despite a matching segment hash',h=>{
 const f=host(h,'codex');P.set(h,'on');apply(h);const rec=W.receipt(h);Object.values(rec.data.records)[0].sourceRevision='unknown-v99';fs.writeFileSync(rec.file,JSON.stringify(rec.data));const before=fs.readFileSync(f);assert.throws(()=>W.plan(h,opts),/revision|ownership/);assert(fs.readFileSync(f).equals(before));
});
test('receipt cannot extend its segment over foreign text even with a recomputed hash',h=>{
 const f=host(h,'codex');P.set(h,'on');apply(h);const rec=W.receipt(h),r=Object.values(rec.data.records)[0];r.segment='FOREIGN\n'+r.segment;r.sourceHash=require('crypto').createHash('sha256').update(r.segment).digest('hex');fs.writeFileSync(rec.file,JSON.stringify(rec.data));P.set(h,'off');const before=fs.readFileSync(f);assert.throws(()=>W.plan(h,opts),/revision|ownership/);assert(fs.readFileSync(f).equals(before));
});
console.log(`${failed?'FAIL':'OK'} (${n} checks; ${failed} failed)`);process.exitCode=failed?1:0;
