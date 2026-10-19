'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {spawnSync} = require('child_process');
const b = require('../lib/blocks');
let n=0;function t(label,f){f();n++;console.log('  ok  '+label);}
const block=(id,body='private-body')=>`<!-- ${id}:BEGIN -->\n${body}\n<!-- ${id}:END -->\n`;
t('mixed owners are metadata, never authorization',()=>{
 const r=b.parse(block('SSHLG:ROUTERS',block('SSHLG:ROUTER:fabric'))+block('SSHLG:REPOSITORY-HANDOFF')+block('OTHER:NOTES'));
 assert(r.ok);assert.strictEqual(r.blocks.length,4);assert.strictEqual(r.blocks[1].syntaxState,'NESTED_SUBREGION');
 assert.strictEqual(r.blocks[2].writerAdmission,'OPERATOR_DECISION_REQUIRED');assert.strictEqual(r.blocks[3].writerAdmission,'FOREIGN');
 assert(!JSON.stringify(r).includes('private-body'));assert(r.blocks.every(x=>x.writerAdmission!=='AUTHORIZED_BY_EXISTING_POLICY'));
});
t('duplicate, crossed, unclosed and stray markers refuse clean syntax',()=>{
 for(const s of [block('A:B')+block('A:B'),'<!-- A:B:BEGIN -->\n<!-- C:D:BEGIN -->\n<!-- A:B:END -->\n<!-- C:D:END -->','<!-- A:B:BEGIN -->','<!-- A:B:END -->',block('SSHLG:ROUTERS',block('OTHER:BLOCK'))])assert(!b.parse(s).ok,s);
});
t('descriptive multiline opening and optout retain ranges',()=>{
 const r=b.parse('<!-- SSHLG:ROUTERS:BEGIN — managed\n explanatory tail -->\ntext\n<!-- SSHLG:ROUTERS:END -->\n');assert(r.ok);assert.deepStrictEqual(r.blocks[0].range,{startLine:1,endLine:4});
 const o=b.parse('<!-- SSHLG:ROUTERS:OPTOUT -->');assert(o.ok);assert.strictEqual(o.blocks[0].syntaxState,'OPTOUT');
 assert(!b.parse('<!-- SSHLG:ROUTERS:OPTOUT -->\n'+block('SSHLG:ROUTERS')).ok);
});
t('near markers and invalid UTF8 are uncertain, not repaired',()=>{
 for(const s of ['<!-- SSHLG:ROUTERS :BEGIN -->','<!-- SSHLG:ROUTERS: BEGIN -->','<!-- SSHLG:ROUTERS : BEGIN -->','<!-- SSHLG:ROUTERS:begin -->','<!-- SSHLG:ROUTERS:BEGIN','<!-- ВЛАДЕЛЕЦ:БЛОК:BEGIN -->'])assert(!b.parse(s).ok,s);
 assert.throws(()=>b.decode(Buffer.from([0xff])),/UTF/);
});
t('large valid inventory retains exact line ranges without prefix rescans',()=>{const r=b.parse(Array.from({length:10000},(_,i)=>block('A:B'+i,'')).join(''));assert(r.ok);assert.strictEqual(r.blocks.length,10000);assert.deepStrictEqual(r.blocks[9999].range,{startLine:29998,endLine:30000});});
t('a <!-- inside an inline code span opens no comment (CommonMark), so it cannot swallow a block below',()=>{
 let r=b.parse('Never write `<!--` in a table cell.\n'+block('A:B'));assert(r.ok,JSON.stringify(r.issues));assert.strictEqual(r.blocks.length,1);
 r=b.parse('Use ``a `<!--` b`` here.\n'+block('A:B'));assert(r.ok);assert.strictEqual(r.blocks.length,1,'a double-backtick span counts too');
 r=b.parse('An open <!-- comment outside code\n'+block('A:B'));assert.strictEqual(r.blocks.length,0,'an unterminated comment outside code still swallows what follows');
 r=b.parse('One backtick ` then <!-- with no closing tick\n'+block('A:B'));assert.strictEqual(r.blocks.length,0,'an unclosed backtick is not a code span');
});
t('markers inside a closed code fence are examples: alone, beside a real block, and an unterminated example comment',()=>{
 const fence=(body)=>'```markdown\n'+body+'\n```\n';
 let r=b.parse('# doc\n'+fence(block('OBSERVATORY:AGENT-UPDATES','example')));assert(r.ok);assert.strictEqual(r.blocks.length,0);
 r=b.parse(fence(block('OBSERVATORY:AGENT-UPDATES','example'))+block('OBSERVATORY:AGENT-UPDATES','real'));assert(r.ok);assert.strictEqual(r.blocks.length,1);assert.strictEqual(r.blocks[0].range.startLine,7);
 r=b.parse('~~~\n<!-- an example left open\n~~~\n'+block('A:B'));assert(r.ok,JSON.stringify(r.issues));assert.strictEqual(r.blocks.length,1);
 r=b.parse('```\nnever closed\n'+block('A:B'));assert(r.ok);assert.strictEqual(r.blocks.length,1,'an unclosed fence fences nothing');
 r=b.parse('```js `not a fence`\n'+block('A:B')+'```\n');assert.strictEqual(r.blocks.length,1,'a backtick info string is not a fence');
});
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'blocks-'));
try{
 const home=path.join(tmp,'home');fs.mkdirSync(home);const cd=path.join(home,'.codex');fs.mkdirSync(cd);const file=path.join(cd,'AGENTS.md');fs.writeFileSync(file,block('SSHLG:ROUTERS')+block('OTHER:NOTES'));fs.chmodSync(file,0o640);
 const snapshot=()=>{const s=fs.statSync(file);return [fs.readFileSync(file,'hex'),s.mode,s.mtimeMs,fs.readdirSync(home).sort()];};
 t('selected host inspection performs no writes',()=>{const before=snapshot();const r=b.inspect({home,env:{},agents:['codex']});assert(r.ok);assert.strictEqual(r.targets.length,1);assert.strictEqual(r.targets[0].readState,'READ');assert.deepStrictEqual(snapshot(),before);assert(!fs.existsSync(path.join(home,'.sshlg-skills')));});
 t('absent and unreadable remain distinct',()=>{assert.strictEqual(b.inspect({home,env:{},agents:['claude']}).targets[0].readState,'ABSENT');fs.chmodSync(file,0);assert.strictEqual(b.inspect({home,env:{},agents:['codex']}).targets[0].readState,'UNKNOWN');fs.chmodSync(file,0o640);});
 t('symlink target and non-file are not opened',()=>{const link=path.join(tmp,'link');fs.mkdirSync(link);fs.symlinkSync(file,path.join(link,'AGENTS.md'));const r=b.inspect({home,env:{CODEX_HOME:link},agents:['codex']});assert(!r.ok);assert.strictEqual(r.targets[0].readState,'UNSUPPORTED');});
 t('override profile is scoped and its absolute path stays private',()=>{const env={CODEX_HOME:cd};const r=b.inspect({home,env,agents:['codex']});assert(r.ok);assert.strictEqual(r.targets[0].pathAlias,'${CODEX_HOME}/AGENTS.md');assert(!JSON.stringify(r).includes(tmp));});
 t('EACCES, invalid bytes and size bound are explicit unknowns',()=>{
  const io={...fs,openSync(){throw Object.assign(Error('denied'),{code:'EACCES'});}};
  assert.strictEqual(b.inspect({home,env:{},agents:['codex'],io}).targets[0].reason,'UNREADABLE');
  const bad=path.join(tmp,'bad');fs.writeFileSync(bad,Buffer.from([0xff]));assert.strictEqual(b.read(bad).reason,'INVALID_UTF8');
  fs.writeFileSync(bad,Buffer.alloc(1024*1024+1));assert.strictEqual(b.read(bad).reason,'SIZE_LIMIT');
 });
 t('file replacement and parent retarget during read are refused',()=>{
  let done=false;const io={...fs,readSync(...args){const r=fs.readSync(...args);if(!done){done=true;fs.renameSync(file,file+'.old');fs.copyFileSync(file+'.old',file);}return r;}};
  assert.strictEqual(b.read(file,io).readState,'CHANGED_DURING_READ');
  const other=path.join(tmp,'other');fs.mkdirSync(other);fs.writeFileSync(path.join(other,'AGENTS.md'),block('A:B'));
  const parent=path.join(tmp,'profile');fs.symlinkSync(cd,parent);done=false;
  const io2={...fs,readSync(...args){const r=fs.readSync(...args);if(!done){done=true;fs.unlinkSync(parent);fs.symlinkSync(other,parent);}return r;}};
  assert.strictEqual(b.read(path.join(parent,'AGENTS.md'),io2).readState,'CHANGED_DURING_READ');
 });
 t('invalid host and mutation flags are rejected',()=>{for(const args of [['--agent','unknown'],['--apply'],['--from','x'],['--agent'],['--json','--json']])assert.throws(()=>b.flags(args));});
 t('actual CLI metadata and malformed-file exit preserve all bytes',()=>{
  const env={...process.env,HOME:home,CODEX_HOME:cd};const run=(a)=>spawnSync(process.execPath,[path.join(__dirname,'..','bin','sshlg-skills.js'),'blocks',...a],{env,encoding:'utf8'});
  let before=snapshot();let r=run(['--agent','codex','--json']);assert.strictEqual(r.status,0,r.stderr+r.stdout);assert.strictEqual(JSON.parse(r.stdout).targets.length,1);assert(!r.stdout.includes('private-body'));assert.deepStrictEqual(snapshot(),before);
  fs.writeFileSync(file,'<!-- SSHLG:ROUTERS:BEGIN -->');before=snapshot();r=run(['--agent','codex','--json']);assert.strictEqual(r.status,1);assert.strictEqual(JSON.parse(r.stdout).targets[0].readState,'READ');assert.deepStrictEqual(snapshot(),before);
  for(const near of ['<!-- SSHLG:ROUTERS: BEGIN -->','<!-- SSHLG:ROUTERS : BEGIN -->']){fs.writeFileSync(file,near);r=run(['--agent','codex','--json']);assert.strictEqual(r.status,1);assert.strictEqual(JSON.parse(r.stdout).ok,false);}
  fs.writeFileSync(file,block('SSHLG:ROUTERS')+block('OTHER:NOTES'));
 });
 t('local selected diff never emits adjacent foreign bytes or writes',()=>{
  const source=path.join(tmp,'proposal.md');fs.writeFileSync(source,block('SSHLG:ROUTERS','replacement'));
  const before=snapshot();const r=b.localDiff({home,env:{},agents:['codex'],id:'SSHLG:ROUTERS',from:source});assert(r.includes('+replacement'));assert(!r.includes('OTHER:NOTES'));assert.deepStrictEqual(snapshot(),before);
  fs.writeFileSync(source,block('OTHER:NOTES'));assert.throws(()=>b.localDiff({home,env:{},agents:['codex'],id:'SSHLG:ROUTERS',from:source}));
 });
 t('blocks lists OBSERVATORY:AGENT-UPDATES from a fixture as Observatory\'s registered block',()=>{
  // The block exactly as Observatory's agent_updates.py writes it into a host file (body synthetic).
  const h=path.join(tmp,'obs-home');fs.mkdirSync(path.join(h,'.claude'),{recursive:true});const f=path.join(h,'.claude','CLAUDE.md');
  fs.writeFileSync(f,'# rules\n\n'+block('SSHLG:ROUTERS')+block('SSHLG:REPOSITORY-HANDOFF')+'<!-- OBSERVATORY:AGENT-UPDATES:BEGIN -->\n## Important repository updates\nprivate-body\n<!-- OBSERVATORY:AGENT-UPDATES:END -->\n');
  const r=spawnSync(process.execPath,[path.join(__dirname,'..','bin','sshlg-skills.js'),'blocks','--agent','claude','--json'],{env:{PATH:process.env.PATH,HOME:h},encoding:'utf8'});
  assert.strictEqual(r.status,0,r.stderr+r.stdout);const blocks=JSON.parse(r.stdout).targets[0].blocks;
  const obs=blocks.find(x=>x.markerId==='OBSERVATORY:AGENT-UPDATES');assert(obs,'not listed');
  assert.strictEqual(obs.syntaxState,'PAIRED');assert.strictEqual(obs.claimedOwner,'OBSERVATORY');assert.strictEqual(obs.registered.owner,'project-observatory');
  assert.strictEqual(obs.writerAdmission,'REGISTERED_NOT_AUTHORIZED');assert(!r.stdout.includes('private-body'));
  const handoff=blocks.find(x=>x.markerId==='SSHLG:REPOSITORY-HANDOFF');assert.strictEqual(handoff.registered.owner,null);assert.strictEqual(handoff.writerAdmission,'OPERATOR_DECISION_REQUIRED');
  const text=spawnSync(process.execPath,[path.join(__dirname,'..','bin','sshlg-skills.js'),'blocks','--agent','claude'],{env:{PATH:process.env.PATH,HOME:h},encoding:'utf8'});
  assert.match(text.stdout,/claude ~\/\.claude\/CLAUDE\.md: READ \(3 markers; syntax valid\)/);
 });
 // INST-3: markers alone read "syntax valid" while a line the pack never wrote sat inside its block.
 t('blocks names foreign lines inside an owned wait block and router section, by line, without printing them',()=>{
  const h=path.join(tmp,'foreign-home');fs.mkdirSync(path.join(h,'.codex'),{recursive:true});fs.mkdirSync(path.join(h,'.sshlg-skills'),{recursive:true});
  const f=path.join(h,'.codex','AGENTS.md');fs.writeFileSync(f,'# mine\n');fs.writeFileSync(path.join(h,'.sshlg-skills','state.json'),'{"routers":"yes"}\n');
  const env={PATH:process.env.PATH,HOME:h};const cli=(a)=>spawnSync(process.execPath,[path.join(__dirname,'..','bin','sshlg-skills.js'),...a],{env,encoding:'utf8'});
  for(const a of [['config','set','rules.wait','on'],['rules','--apply','--agent','codex'],['routers','--agent','codex']]){const r=cli(a);assert.strictEqual(r.status,0,a.join(' ')+': '+r.stdout+r.stderr);}
  let r=cli(['blocks','--agent','codex','--json']);assert.strictEqual(r.status,0,r.stdout+r.stderr);
  for(const x of JSON.parse(r.stdout).targets[0].blocks.filter(x=>x.markerId.startsWith('SSHLG:')&&x.markerId!=='SSHLG:ROUTERS'))assert.strictEqual(x.content&&x.content.state,'AS_WRITTEN',x.markerId+' '+JSON.stringify(x.content));
  const W='<!-- SSHLG:RULE:wait-is-not-a-stop:BEGIN -->\n',S='<!-- SSHLG:ROUTER:task-pipeline:BEGIN -->\n';
  const text=fs.readFileSync(f,'utf8').replace(W,W+'SECRET-ISH OPERATOR WAIT\n').replace(S,S+'SECRET-ISH OPERATOR ROUTE\n');fs.writeFileSync(f,text);
  const lines=text.split('\n'),wl=lines.indexOf('SECRET-ISH OPERATOR WAIT')+1,rl=lines.indexOf('SECRET-ISH OPERATOR ROUTE')+1;
  const before=fs.readFileSync(f);r=cli(['blocks','--agent','codex','--json']);assert.strictEqual(r.status,1,r.stdout+r.stderr);assert(!r.stdout.includes('SECRET-ISH'));
  const got=JSON.parse(r.stdout).targets[0].blocks;const wait=got.find(x=>x.markerId==='SSHLG:RULE:wait-is-not-a-stop'),route=got.find(x=>x.markerId==='SSHLG:ROUTER:task-pipeline');
  assert.deepStrictEqual(wait.content,{state:'FOREIGN_TEXT_INSIDE',startLine:wl,endLine:wl});
  assert.strictEqual(route.content.state,'FOREIGN_TEXT_INSIDE');assert(route.content.startLine<=rl&&rl<=route.content.endLine,JSON.stringify(route.content)+' '+rl);
  const plain=cli(['blocks','--agent','codex']);assert.strictEqual(plain.status,1);assert(plain.stdout.includes(`FOREIGN_TEXT_INSIDE SSHLG:RULE:wait-is-not-a-stop lines ${wl}`),plain.stdout);assert(!plain.stdout.includes('SECRET-ISH'));
  assert(fs.readFileSync(f).equals(before),'blocks wrote to the file');
 });
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
console.log(`PASS: blocks — ${n} cases`);
