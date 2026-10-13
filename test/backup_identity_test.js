#!/usr/bin/env node
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const B=require('../lib/backup.js');
const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sshlg-backup-identity-')));
const failures=[];let count=0;
function test(name,fn){count++;try{fn();}catch(e){failures.push(name+': '+e.message);}}
function fixture(name){const home=path.join(root,name);fs.mkdirSync(home);return home;}
function target(home,rel,body){const f=path.join(home,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,body);return f;}
(async()=>{try{
 test('different canonical profiles do not cross-prune or select restore bytes',()=>{
  const home=fixture('profiles'),a=target(home,'profiles/a/CLAUDE.md','A'),b=target(home,'profiles_a/CLAUDE.md','B');
  const saved=B.save({home,file:a,stamp:'20261013T000000Z'});
  for(let i=1;i<=10;i++)B.save({home,file:b,stamp:'20261013T0000'+String(i).padStart(2,'0')+'Z'});
  assert.ok(fs.existsSync(saved.path),'other profile pruned the only recovery copy');
  assert.equal(fs.readFileSync(B.latest({home,file:a}),'utf8'),'A');
  assert.equal(fs.readFileSync(B.latest({home,file:b}),'utf8'),'B');
 });
 test('legacy ambiguous candidates survive and cannot drive an automatic restore',()=>{
  const home=fixture('legacy'),a=target(home,'profiles/a/CLAUDE.md','A'),b=target(home,'profiles_a/CLAUDE.md','B');
  const dir=path.join(home,...B.DIR);fs.mkdirSync(dir,{recursive:true});
  const old=path.join(dir,'profiles_a_CLAUDE.md.20261013T000000Z');fs.writeFileSync(old,'LEGACY_UNKNOWN_TARGET');
  assert.throws(()=>B.latest({home,file:a}),e=>e.code==='BACKUP_LEGACY_UNBOUND');
  assert.throws(()=>B.latest({home,file:b}),e=>e.code==='BACKUP_LEGACY_UNBOUND');
  const info=B.lookup({home,file:a});assert.equal(info.state,'legacy-unbound');assert.deepEqual(info.candidates,[old]);
  for(let i=1;i<=11;i++)B.save({home,file:a,stamp:'20261013T0000'+String(i).padStart(2,'0')+'Z'});
  assert.equal(fs.readFileSync(old,'utf8'),'LEGACY_UNKNOWN_TARGET');assert.equal(fs.readFileSync(a,'utf8'),'A');
 });
 test('real restore hook reports legacy ambiguity and leaves current config untouched',()=>{
  const home=fixture('hook'),f=target(home,'.obsidian-wiki/config','OBSIDIAN_VAULT_PATH=/current\n');
  const dir=path.join(home,...B.DIR);fs.mkdirSync(dir,{recursive:true});
  const old=path.join(dir,'obsidian-wiki_config.20261013T000000Z');fs.writeFileSync(old,'OBSIDIAN_VAULT_PATH=/foreign\nCLAUDE_HISTORY_PATH=/foreign-history\n');
  const run=cp.spawnSync(process.execPath,[path.join(__dirname,'../hooks/post-tool-use.js')],{cwd:home,env:{...process.env,HOME:home},encoding:'utf8',input:JSON.stringify({hook_event_name:'PostToolUse',tool_name:'Bash',tool_input:{command:'obsidian-wiki setup'}})});
  assert.equal(run.status,0);assert.equal(fs.readFileSync(f,'utf8'),'OBSIDIAN_VAULT_PATH=/current\n');
  assert.match(JSON.parse(run.stdout).hookSpecificOutput.additionalContext,/NOT performed.*legacy backup/);
  assert.deepEqual(fs.readdirSync(dir),[path.basename(old)]);
 });
 test('canonical alias uses same history but retarget cannot retrieve prior profile bytes',()=>{
  const home=fixture('alias'),a=target(home,'a/CLAUDE.md','A'),b=target(home,'b/CLAUDE.md','B'),alias=path.join(home,'active');
  fs.symlinkSync(path.dirname(a),alias);B.save({home,file:path.join(alias,'CLAUDE.md')});
  assert.equal(fs.readFileSync(B.latest({home,file:a}),'utf8'),'A');
  fs.unlinkSync(alias);fs.symlinkSync(path.dirname(b),alias);assert.equal(B.latest({home,file:path.join(alias,'CLAUDE.md')}),null);
 });
 test('same-second copies are exclusive and latest orders the tenth suffix numerically',()=>{
  const home=fixture('serial'),f=target(home,'CLAUDE.md','initial'),paths=[];
  for(let i=0;i<12;i++){fs.writeFileSync(f,String(i));paths.push(B.save({home,file:f,stamp:'20261013T000000Z',keep:20}).path);}
  assert.equal(new Set(paths).size,12);for(let i=0;i<12;i++)assert.equal(fs.readFileSync(paths[i],'utf8'),String(i));
  assert.equal(fs.readFileSync(B.latest({home,file:f}),'utf8'),'11');
 });
 test('pre-existing same-second name cannot be overwritten even across a stale existence probe',()=>{
  const home=fixture('exclusive'),f=target(home,'CLAUDE.md','FIRST');
  const first=B.save({home,file:f,stamp:'20261013T000000Z'});fs.writeFileSync(f,'SECOND');
  const exists=fs.existsSync;let second;
  // Models another writer allocating the name after an old exists-check. An
  // exclusive publication syscall must remain safe even with stale knowledge.
  fs.existsSync=p=>p===first.path?false:exists(p);
  try{second=B.save({home,file:f,stamp:'20261013T000000Z'});}finally{fs.existsSync=exists;}
  assert.notEqual(first.path,second.path);assert.equal(fs.readFileSync(first.path,'utf8'),'FIRST');assert.equal(fs.readFileSync(second.path,'utf8'),'SECOND');
 });
 test('retarget during publication refuses backup admission and preserves both profiles',()=>{
  const home=fixture('retarget'),a=target(home,'a/CLAUDE.md','A'),b=target(home,'b/CLAUDE.md','B'),alias=path.join(home,'active');fs.symlinkSync(path.dirname(a),alias);
  const link=fs.linkSync;fs.linkSync=(...args)=>{const r=link(...args);fs.unlinkSync(alias);fs.symlinkSync(path.dirname(b),alias);return r;};
  let result;try{result=B.guard({home,file:path.join(alias,'CLAUDE.md')});}finally{fs.linkSync=link;}
  assert.equal(result.action,'backup-failed');assert.match(result.error,/identity changed/);assert.equal(fs.readFileSync(a,'utf8'),'A');assert.equal(fs.readFileSync(b,'utf8'),'B');assert.equal(B.latest({home,file:b}),null);
 });
 test('pending foreign and symlink entries are never pruned or followed',()=>{
  const home=fixture('foreign'),f=target(home,'CLAUDE.md','TARGET'),foreign=target(home,'foreign','FOREIGN');
  const dir=path.join(home,...B.DIR);fs.mkdirSync(dir,{recursive:true});const key=B.keyFor(f);
  const names=['.pending-foreign',key+'.not-a-backup'];for(const n of names)fs.writeFileSync(path.join(dir,n),'KEEP');
  const linked=path.join(dir,key+'.20200101T000000Z');fs.symlinkSync(foreign,linked);
  for(let i=0;i<12;i++)B.save({home,file:f,stamp:'20261013T0000'+String(i).padStart(2,'0')+'Z'});
  for(const n of names)assert.equal(fs.readFileSync(path.join(dir,n),'utf8'),'KEEP');assert.ok(fs.lstatSync(linked).isSymbolicLink());assert.equal(fs.readFileSync(foreign,'utf8'),'FOREIGN');
 });
 test('failed exclusive publication cancels guard and cleans only its owned temporary copy',()=>{
  const home=fixture('linkfail'),f=target(home,'CLAUDE.md','TARGET'),link=fs.linkSync;
  fs.linkSync=()=>{const e=Error('synthetic unsupported link');e.code='EPERM';throw e;};let result;
  try{result=B.guard({home,file:f});}finally{fs.linkSync=link;}
  assert.equal(result.action,'backup-failed');assert.equal(fs.readFileSync(f,'utf8'),'TARGET');assert.deepEqual(fs.readdirSync(path.join(home,...B.DIR)),[]);
 });
 count++;
 try{
  const home=fixture('concurrent'),f=target(home,'CLAUDE.md','CONCURRENT'),n=12;
  const script=`const fs=require('fs'),B=require(process.argv[1]);const r=B.save({home:process.argv[2],file:process.argv[3],stamp:'20261013T010000Z',keep:100});process.stdout.write(JSON.stringify(r));`;
  const results=await Promise.all(Array.from({length:n},()=>new Promise((resolve,reject)=>{
   const p=cp.spawn(process.execPath,['-e',script,require.resolve('../lib/backup.js'),home,f]);let out='',err='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>err+=d);p.on('error',reject);p.on('close',c=>c===0?resolve(JSON.parse(out)):reject(Error(err||'exit '+c)));
  })));
  assert.equal(new Set(results.map(r=>r.path)).size,n,'concurrent saves reused a path');
  for(const r of results){assert.equal(fs.readFileSync(r.path,'utf8'),'CONCURRENT');assert.equal(fs.statSync(r.path).mode&0o777,0o600);}
 }catch(e){failures.push('real same-second concurrent processes: '+e.message);}
}finally{fs.rmSync(root,{recursive:true,force:true});}
if(failures.length){for(const f of failures)console.error('FAIL: '+f);console.error(failures.length+' failures / '+count);process.exitCode=1;}else console.log('OK ('+count+' checks)');})();
