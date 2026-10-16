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
test('an applied wait-v1 rule upgrades in place to the current revision',h=>{
 const crypto=require('crypto'),dg=s=>crypto.createHash('sha256').update(s).digest('hex');
 const f=host(h,'codex');P.set(h,'on');apply(h);
 const rec=W.receipt(h),r=Object.values(rec.data.records)[0],v1=r.segment.replace(T.render('codex'),T.render('codex',T.PREVIOUS['wait-v1']));
 fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace(r.segment,v1));Object.assign(r,{segment:v1,sourceRevision:'wait-v1',sourceHash:dg(v1)});fs.writeFileSync(rec.file,JSON.stringify(rec.data));
 const p=apply(h,{automatic:true});assert.equal(p.rows.find(x=>x.agent==='codex').action,'write');
 const text=fs.readFileSync(f,'utf8');assert(text.includes('Continuing is not polishing'));assert(text.startsWith('FOREIGN\n'));assert.equal(text.split(T.BEGIN).length,2);
 assert.equal(Object.values(W.receipt(h).data.records)[0].sourceRevision,T.REVISION);
 const again=fs.readFileSync(f);apply(h,{automatic:true});assert(fs.readFileSync(f).equals(again),'a second update changes nothing');
});
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
// B-201: an edited block is that target's refusal during update, never the whole plan's.
test('automatic plan refuses only the edited block, names file:line, and execute still writes the others',h=>{
 const f=host(h,'codex'),g=host(h,'gemini');P.set(h,'on');apply(h);
 const edited=fs.readFileSync(f,'utf8').replace(T.BEGIN+'\n',T.BEGIN+'\nMINE\n');fs.writeFileSync(f,edited);const line=edited.split('\n').indexOf('MINE')+1;
 P.set(h,'off');const p=W.plan(h,{...opts,automatic:true});const row=p.rows.find(r=>r.agent==='codex');
 assert.equal(row.action,'refused');assert.deepEqual(row.lines,{startLine:line,endLine:line});assert(row.reason.includes(f+':'+line),row.reason);assert(/outside the markers/.test(row.remedy));
 assert.equal(p.rows.find(r=>r.agent==='gemini').action,'remove');
 const r=W.execute(p);assert.equal(r.ok,false);assert.equal(r.results.find(x=>x.agent==='codex').action,'refused');assert.equal(r.results.find(x=>x.agent==='gemini').action,'remove');
 assert.equal(fs.readFileSync(f,'utf8'),edited);assert.equal(fs.readFileSync(g,'utf8'),'FOREIGN\n');
 assert.throws(()=>W.plan(h,opts),new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+':'+line));
});
test('an edit to the separator above BEGIN is refused by its own line, the block untouched',h=>{
 const f=host(h,'codex','no final newline');P.set(h,'on');apply(h);const t=fs.readFileSync(f,'utf8'),edited=t.replace('\n\n'+T.BEGIN,'\nMINE\n'+T.BEGIN);fs.writeFileSync(f,edited);
 const row=W.plan(h,{...opts,automatic:true}).rows.find(r=>r.agent==='codex'),line=edited.split('\n').indexOf(T.BEGIN);
 assert.equal(row.action,'refused');assert.deepEqual(row.lines,{startLine:line,endLine:line});assert(/above the BEGIN marker/.test(row.reason),row.reason);assert.equal(fs.readFileSync(f,'utf8'),edited);
});
test('a removed owned block is refused by name during update, with no line to point at',h=>{
 const f=host(h,'codex');P.set(h,'on');apply(h);fs.writeFileSync(f,'FOREIGN\n');const p=W.plan(h,{...opts,automatic:true});const row=p.rows.find(r=>r.agent==='codex');
 assert.equal(row.action,'refused');assert.equal(row.lines,null);assert(row.reason.includes(f));assert(/removed/.test(row.reason));
});
test('automatic plan marks a policy-on host without a receipt as a gap with its command; an absent root is agent-absent',h=>{
 host(h,'codex');const g=host(h,'gemini');P.set(h,'on');apply(h,{hostTargets:A.TARGETS.filter(t=>t.agent==='codex')});
 const p=W.plan(h,{...opts,automatic:true}),row=p.rows.find(r=>r.agent==='gemini');
 assert.equal(row.action,'not-applied');assert.equal(row.command,'npx sshlg-skills rules --apply --agent gemini');assert.equal(row.file,g);
 assert.equal(p.rows.find(r=>r.agent==='pi').action,'agent-absent');
 assert.equal(W.plan(h,{...opts,automatic:true,remove:true}).rows.find(r=>r.agent==='gemini').command,undefined);
 P.set(h,'off');assert.equal(W.plan(h,{...opts,automatic:true}).rows.find(r=>r.agent==='gemini').command,undefined);
 P.set(h,'on');host(h,'claude');assert.equal(W.plan(h,{...opts,automatic:true}).rows.find(r=>r.agent==='claude').command,'npx sshlg-skills rules --apply --claude-only');
});
console.log(failed ? `FAIL: wait_rules — ${n} passed; ${failed} failed` : `PASS: wait_rules — ${n} cases`);process.exitCode=failed?1:0;
