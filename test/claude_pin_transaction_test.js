'use strict';
const assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path');
const S=require('../lib/claude-plugin-source'),P=require('../lib/claude-pinned'),T=require('../lib/claude-pin-transaction');
let count=0;
function test(name,fn,profileRel){const box=fs.mkdtempSync(path.join(os.tmpdir(),'claude-transaction-'));try{fn(fixture(box,profileRel));count++;console.log('ok '+name);}finally{fs.rmSync(box,{recursive:true,force:true});}}
function fixture(box,profileRel='.claude') {
 const home=box+'/home',profile=home+'/'+profileRel,id='probe@fixture',a='a'.repeat(40),b='b'.repeat(40);
 const payload=profile+'/plugins/cache/fixture/probe/1.0.0',sf=profile+'/settings.json',rf=profile+'/plugins/installed_plugins.json';
 const raw=JSON.stringify({name:'probe',version:'1.0.0'}),files={'.claude-plugin/plugin.json':raw,'value.txt':'second'};
 const m={name:'fixture',repo:'o/r',commit:b,version:'1.0.0',pluginInstall:id};
 const row={...m,pluginPath:'plugins/probe',entry:{name:'probe',source:'./plugins/probe'},configSurface:false,files:Object.entries(files).map(([p,v])=>({path:p,bytes:Buffer.byteLength(v),sha256:S.sha256(v)}))};
 const inventory={schema:'claude-plugin-pins/1',members:[row]},opts={home,profileRoot:profile};
 fs.mkdirSync(payload+'/.claude-plugin',{recursive:true});fs.writeFileSync(payload+'/.claude-plugin/plugin.json',raw);fs.writeFileSync(payload+'/value.txt','first');
 const rec={scope:'user',version:'1.0.0',gitCommitSha:a,installPath:payload};fs.writeFileSync(rf,JSON.stringify({version:2,plugins:{[id]:[rec]}}));
 fs.writeFileSync(sf,'{\r\n "huge":1000001.2500, "enabledPlugins":{"probe@fixture":false,"foreign@foreign":false}, "env":{"KEEP":"same"}\r\n}\r\n');
 const calls=[],envs=[];let hook=null;
 const plan=()=>P.prepare([m],inventory,opts);
 function runner(cmd,args,opts) {
  calls.push(args);if(args[0]==='plugin')envs.push(opts.env);
  if(args[0]==='--version')return {status:0,stdout:'2.1.296 (Claude Code)'};
  if(hook){const result=hook(args);if(result)return result;}
  const current=JSON.parse(fs.readFileSync(sf));
  if(args[0]==='plugin' && args[1]==='uninstall') {const reg=JSON.parse(fs.readFileSync(rf));delete reg.plugins[id];fs.writeFileSync(rf,JSON.stringify(reg));delete current.enabledPlugins[id];}
  if(args[0]==='plugin' && (args[1]==='install' || args[1]==='update')) {
   const j=JSON.parse(fs.readFileSync(planCatalog())).plugins[0],commit=j.source.sha;
   fs.writeFileSync(payload+'/value.txt',commit===a?'first':'second');
   const reg=JSON.parse(fs.readFileSync(rf));reg.plugins[id]=[{...rec,gitCommitSha:commit}];fs.writeFileSync(rf,JSON.stringify(reg));current.enabledPlugins[id]=true;
  }
  fs.writeFileSync(sf,JSON.stringify(current,null,2));return {status:0,stdout:''};
 }
 function planCatalog(){return home+'/.sshlg-skills/claude-pinned/'+S.sha256(require('../lib/visibility-state').profilePath(profile)).slice(0,16)+'/fixture/.claude-plugin/marketplace.json';}
 return {box,home,profile,id,a,b,payload,sf,rf,m,row,inventory,opts,calls,envs,plan,runner,planCatalog,setHook:f=>hook=f,execute:()=>T.execute(plan(),[m],inventory,{runner})};
}
test('same-version repair verifies exact payload and restores raw round-trip-safe numbers + disabled state',f=>{const r=f.execute();assert(r.ok,JSON.stringify(r));const s=fs.readFileSync(f.sf,'utf8');assert(s.includes('1000001.2500'));assert(s.includes('\r\n'));assert.equal(JSON.parse(s).enabledPlugins[f.id],false);assert.equal(f.plan().jobs[0].action,'verify');assert.equal(r.results[0].files,2);});
test('failure after uninstall rolls back through native CLI and permits safe retry',f=>{let fail=true;f.setHook(a=>{if(fail&&a[1]==='install'){fail=false;return {status:1};}});const r=f.execute();assert.equal(r.ok,false);assert.equal(r.results[0].rollback,'verified-prior-payload');assert.equal(fs.readFileSync(f.payload+'/value.txt','utf8'),'first');assert(f.execute().ok);});
test('catalog failure before payload changes does not uninstall or pretend rollback',f=>{f.setHook(a=>a[1]==='marketplace'?{status:1}:null);const r=f.execute();assert(!r.ok);assert.equal(r.results[0].rollback,'not-attempted');assert(!f.calls.some(a=>a[1]==='uninstall'));assert.equal(fs.readFileSync(f.payload+'/value.txt','utf8'),'first');});
test('changed frozen settings refuse before even checking runtime',f=>{const p=f.plan();fs.appendFileSync(f.sf,' ');assert.throws(()=>T.execute(p,[f.m],f.inventory,{runner:f.runner}),/plan changed/);assert.equal(f.calls.length,0);});
test('unsupported native runtime refuses with no settings or catalog writes',f=>{const before=fs.readFileSync(f.sf);assert.throws(()=>T.execute(f.plan(),[f.m],f.inventory,{runner:()=>({status:0,stdout:'2.1.295'})}),/2.1.296/);assert.deepEqual(fs.readFileSync(f.sf),before);assert(!fs.existsSync(f.home+'/.sshlg-skills'));});
test('unreadable backup is a failure before native child mutation',f=>{const A=require('../lib/apply'),old=A.protect;A.protect=()=>({action:'backup-failed'});try{const r=f.execute();assert(!r.ok);assert.equal(f.calls.filter(a=>a[0]!=='--version').length,0);}finally{A.protect=old;}});
test('foreign setting changed by concurrent writer is retained and blocks continuation',f=>{f.setHook(a=>{if(a[1]==='marketplace'){let s=JSON.parse(fs.readFileSync(f.sf));s.env.KEEP='concurrent';fs.writeFileSync(f.sf,JSON.stringify(s));}return null;});const r=f.execute();assert(!r.ok);assert.equal(JSON.parse(fs.readFileSync(f.sf)).env.KEEP,'concurrent');assert(!f.calls.some(a=>a[1]==='uninstall'));assert.throws(f.plan,/incomplete Claude transaction/);});
test('saved configuration arriving during catalog action is never uninstalled',f=>{f.setHook(a=>{if(a[1]==='marketplace'){let s=JSON.parse(fs.readFileSync(f.sf));s.pluginConfigs={[f.id]:{}};fs.writeFileSync(f.sf,JSON.stringify(s));}return null;});assert(!f.execute().ok);assert(!f.calls.some(a=>a[1]==='uninstall'));});
test('pending transaction and existing lock refuse before mutation',f=>{const p=f.plan();fs.mkdirSync(p.transactionRoot,{recursive:true});fs.writeFileSync(p.transactionRoot+'/latest.json','{"status":"running"}');assert.throws(f.plan,/incomplete/);fs.writeFileSync(p.transactionRoot+'/latest.json','{"status":"complete"}');fs.mkdirSync(p.transactionRoot+'/lock');assert.throws(f.plan,/incomplete/);});
test('failed rollback stays explicit and never writes cache directly',f=>{f.setHook(a=>a[1]==='install'?{status:1}:null);const r=f.execute();assert(!r.ok);assert.match(r.results[0].rollback,/failed/);assert.equal(JSON.parse(fs.readFileSync(f.rf)).plugins[f.id],undefined);assert.equal(fs.readFileSync(f.payload+'/value.txt','utf8'),'first');});
test('configured target entry and nested manifest surfaces are detected',f=>{for(const value of [{channels:{x:{userConfig:{}}}},{mcpServers:'./bridge.mcpb'},{user_config:{}}])assert(S.configSurface(value));assert(!S.configSurface({name:'plain'}));});
test('payload-equivalent member is rebound to the pin catalog without install or uninstall',f=>{fs.writeFileSync(f.payload+'/value.txt','second');const before=fs.readFileSync(f.rf,'utf8');const p=f.plan();assert.equal(p.jobs[0].action,'rebind');const r=T.execute(p,[f.m],f.inventory,{runner:f.runner});assert(r.ok,JSON.stringify(r));assert(!f.calls.some(a=>['uninstall','install','update'].includes(a[1])));assert(f.calls.some(a=>a[1]==='marketplace'&&a[2]==='add'));assert.equal(fs.readFileSync(f.rf,'utf8'),before);assert.equal(JSON.parse(fs.readFileSync(f.sf)).extraKnownMarketplaces.fixture.source.source,'directory');});
test('rebind refuses when install records change during the source move',f=>{fs.writeFileSync(f.payload+'/value.txt','second');f.setHook(a=>{if(a[1]==='marketplace'){const reg=JSON.parse(fs.readFileSync(f.rf));reg.plugins[f.id][0].installedAt='later';fs.writeFileSync(f.rf,JSON.stringify(reg));}return null;});const r=f.execute();assert.equal(r.ok,false);assert.match(r.results[0].reason,/records changed during source rebind/);assert(!f.calls.some(a=>['uninstall','install','update'].includes(a[1])));});
test('verify-only action performs no uninstall/install/update of plugin',f=>{assert(f.execute().ok);f.calls.length=0;assert(f.execute().ok);assert(!f.calls.some(a=>['uninstall','install','update'].includes(a[1])));});

for(const kind of ['installed','marketplaces']) test('foreign '+kind+' mutation is never a successful native transaction',f=>{
 const file=kind==='installed'?f.rf:f.profile+'/plugins/known_marketplaces.json';
 const before=kind==='installed'?JSON.parse(fs.readFileSync(file)):{};
 if(kind==='installed')before.plugins['foreign@elsewhere']=[{version:'old'}];else before.elsewhere={source:{source:'github',repo:'other/repo'},lastUpdated:'old'};
 fs.writeFileSync(file,JSON.stringify(before));
 f.setHook(args=>{if(args[1]==='marketplace'){const changed=JSON.parse(fs.readFileSync(file));if(kind==='installed')changed.plugins['foreign@elsewhere'][0].version='CHANGED';else changed.elsewhere.lastUpdated='CHANGED';fs.writeFileSync(file,JSON.stringify(changed));}});
 const r=f.execute();assert(!r.ok);assert.match(r.error,/foreign Claude registry/);assert(fs.readFileSync(file,'utf8').includes('CHANGED'));assert(!f.calls.some(a=>a[1]==='uninstall'));
});
test('requested profile alias retarget refuses instead of writing either profile',f=>{
 const alias=f.box+'/profile-alias';fs.symlinkSync(f.profile,alias);const p=P.prepare([f.m],f.inventory,{home:f.home,profileRoot:alias});
 const other=f.box+'/other';fs.mkdirSync(other);fs.unlinkSync(alias);fs.symlinkSync(other,alias);
 const before=fs.readFileSync(f.sf);assert.throws(()=>T.execute(p,[f.m],f.inventory,{runner:f.runner}),/plan changed/);assert.deepEqual(fs.readFileSync(f.sf),before);assert.deepEqual(fs.readdirSync(other),[]);assert.equal(f.calls.length,0);
});
test('settings leaf symlink is refused before native mutation',f=>{const actual=f.box+'/original-settings';fs.renameSync(f.sf,actual);fs.symlinkSync(actual,f.sf);assert.throws(f.plan,/metadata/);assert.equal(f.calls.length,0);});
for(const failKind of ['short-write','rename']) test('atomic journal '+failKind+' failure leaves settings intact and prevents native actions',f=>{
 const before=fs.readFileSync(f.sf),write=fs.writeFileSync,rename=fs.renameSync,open=fs.openSync;let injected=false,journalFd=null;
 fs.openSync=function(file,...args){const fd=open.call(fs,file,...args);if(String(file).includes('.receipt.json.')&&String(file).endsWith('.tmp'))journalFd=fd;return fd;};
 fs.writeFileSync=function(file,body,...rest){if(failKind==='short-write'&&!injected&&typeof file==='number'&&file===journalFd){injected=true;return write.call(fs,file,String(body).slice(0,3),...rest);}return write.call(fs,file,body,...rest);};
 fs.renameSync=function(from,to){if(failKind==='rename'&&!injected&&String(to).endsWith('latest.json')){injected=true;throw Object.assign(Error('fixture rename failure'),{code:'EIO'});}return rename.call(fs,from,to);};
 try{const r=f.execute();assert(injected);assert(!r.ok);assert.deepEqual(fs.readFileSync(f.sf),before);assert.equal(f.calls.filter(a=>a[0]!=='--version').length,0);}finally{fs.writeFileSync=write;fs.renameSync=rename;fs.openSync=open;}
});
test('atomic settings replacement preserves regular-file permissions',f=>{fs.chmodSync(f.sf,0o640);assert(f.execute().ok);assert.equal(fs.statSync(f.sf).mode&0o777,0o640);});

test('timeout uncertainty never starts rollback and blocks another native attempt',f=>{
 f.setHook(args=>args[1]==='install'?{status:null,signal:'SIGTERM',error:{code:'ETIMEDOUT'}}:null);
 const r=f.execute();assert(!r.ok);assert.match(r.error,/uncertain/);assert.equal(r.results[0].rollback,'not-attempted');
 assert.equal(f.calls.filter(a=>a[1]==='uninstall').length,1);assert.equal(f.calls.filter(a=>a[1]==='install').length,1);
 assert.throws(f.plan,/incomplete Claude transaction/);const receipt=JSON.parse(fs.readFileSync(r.receipt));assert.equal(receipt.uncertain,true);
 const recovery=JSON.parse(fs.readFileSync(receipt.recoveryPlan));assert.equal(recovery.jobs[0].previous.commit,f.a);assert.equal(recovery.jobs[0].desired.commit,f.b);
});

test('unknown native outcome leaves partially written settings untouched until recovery',f=>{
 let nativeBytes=null;
 f.setHook(args=>{if(args[1]==='install'){const setting=JSON.parse(fs.readFileSync(f.sf));setting.enabledPlugins[f.id]=true;nativeBytes=JSON.stringify(setting);fs.writeFileSync(f.sf,nativeBytes);return {status:null,signal:'SIGTERM'};}});
 const r=f.execute();assert(!r.ok);assert.equal(fs.readFileSync(f.sf,'utf8'),nativeBytes);
 const receipt=JSON.parse(fs.readFileSync(r.receipt));assert.equal(receipt.settingsRestored,false);assert.equal(receipt.uncertain,true);assert.throws(f.plan,/incomplete/);
});
test('destructive repair requires a prior immutable rollback identity',f=>{
 const before=fs.readFileSync(f.sf);
 for(const sha of [undefined,'main','A'.repeat(40)]){const registry=JSON.parse(fs.readFileSync(f.rf));registry.plugins[f.id][0].gitCommitSha=sha;fs.writeFileSync(f.rf,JSON.stringify(registry));assert.throws(f.plan,/prior immutable Git identity/);}
 assert.equal(f.calls.length,0);assert.deepEqual(fs.readFileSync(f.sf),before);
});

test('ambiguous numeric metadata refuses before any native command or write',f=>{
 const before=fs.readFileSync(f.sf);
 for(const raw of ['9007199254740993','100000000000000000000000001','0.10000000000000001','1e309','-0']) {
   const candidate='{"foreign":'+raw+'}';fs.writeFileSync(f.sf,candidate);assert.throws(f.plan,/metadata/);assert.equal(fs.readFileSync(f.sf,'utf8'),candidate);
 }
 assert.equal(f.calls.length,0);fs.writeFileSync(f.sf,before);
});
test('precise foreign numeric changes cannot collide in settings restore or registry checks',f=>{
 const plan=f.plan(),target=T.targetSettings(plan),backup=f.box+'/backups';
 for(const raw of ['100000000000000000000000002','9007199254740993']) {
   fs.writeFileSync(f.sf,'{"foreign":'+raw+'}');const exact=fs.readFileSync(f.sf);assert.throws(()=>T.restoreSettings(plan,target,backup),/number/);assert.deepEqual(fs.readFileSync(f.sf),exact);
 }
 fs.writeFileSync(f.rf,'{"version":2,"plugins":{"foreign@elsewhere":[{"value":9007199254740993}]}}');assert.throws(()=>T.verifyForeign(plan),/number/);
});
test('safe decimal and exponent spellings retain exact mathematical values',f=>{
 for(const raw of ['1','1.0','0.1','-12.50','1e3','9007199254740992','1e300','0e-1000']) assert.equal(typeof P.parseMetadata('{"n":'+raw+'}').data.n,'number');
 assert.equal(P.parseMetadata('{"s":"9007199254740993","escaped":"\\\"0.10000000000000001"}').data.s,'9007199254740993');
});
test('runtime version child has bounded timeout and output before any mutation',f=>{
 const before=fs.readFileSync(f.sf);let seen=false;
 assert.throws(()=>T.execute(f.plan(),[f.m],f.inventory,{runner:(cmd,args,opts)=>{seen=true;assert.equal(cmd,'claude');assert.deepEqual(args,['--version']);assert.equal(opts.timeout,10000);assert.equal(opts.maxBuffer,65536);return {status:1,stdout:'2.1.296 (Claude Code)'};}}),/2.1.296/);
 assert(seen);assert.deepEqual(fs.readFileSync(f.sf),before);assert(!fs.existsSync(f.home+'/.sshlg-skills'));
});
test('runtime refuses error signal and unsuccessful status despite compatible stdout',f=>{
 const before=fs.readFileSync(f.sf);
 for(const result of [{status:1},{status:null,signal:'SIGTERM'},{status:0,error:Error('timeout')},{status:0,signal:'SIGTERM'}]) {
  assert.throws(()=>T.execute(f.plan(),[f.m],f.inventory,{runner:()=>({...result,stdout:'2.1.296 (Claude Code)'})}),/2.1.296/);
  assert.deepEqual(fs.readFileSync(f.sf),before);assert(!fs.existsSync(f.home+'/.sshlg-skills'));
 }
 assert.equal(T.runtime(()=>({status:0,stdout:'2.1.296 (Claude Code)'})),'2.1.296 (Claude Code)');
});
test('runtime admits every Claude Code release from 2.1.296 on, across minors and majors (B-203)',()=>{
 for(const v of ['2.1.296','2.1.300','2.2.0','2.10.1','3.0.1','2.2.0-beta.1']) assert.equal(T.runtime(()=>({status:0,stdout:v+' (Claude Code)\n'})),v+' (Claude Code)',v);
 for(const v of ['2.1.295','2.0.999','1.9.400','0.2.0']) assert.throws(()=>T.runtime(()=>({status:0,stdout:v+' (Claude Code)'})),new RegExp('2\\.1\\.296 or later.*found '+v.replace(/\./g,'\\.')),v);
 for(const out of ['','Claude Code','v2.2.0','2.2','latest',undefined]) assert.throws(()=>T.runtime(()=>({status:0,stdout:out})),/2\.1\.296 or later.*unparsable/,String(out));
});
test('default profile: claude plugin children get no CLAUDE_CONFIG_DIR, even an inherited one (B-220)',f=>{
 const saved=process.env.CLAUDE_CONFIG_DIR;process.env.CLAUDE_CONFIG_DIR=f.profile;
 try{const r=f.execute();assert(r.ok,JSON.stringify(r));}finally{if(saved===undefined)delete process.env.CLAUDE_CONFIG_DIR;else process.env.CLAUDE_CONFIG_DIR=saved;}
 assert(f.envs.length>0);
 for(const env of f.envs){assert.equal(env.HOME,require('../lib/visibility-state').profilePath(f.home));assert(!Object.prototype.hasOwnProperty.call(env,'CLAUDE_CONFIG_DIR'),'CLAUDE_CONFIG_DIR leaked for the default profile');}
});
test('non-default profile: claude plugin children keep CLAUDE_CONFIG_DIR on that profile (B-220)',f=>{
 const r=f.execute();assert(r.ok,JSON.stringify(r));
 assert(f.envs.length>0);
 for(const env of f.envs){assert.equal(env.HOME,require('../lib/visibility-state').profilePath(f.home));assert.equal(env.CLAUDE_CONFIG_DIR,require('../lib/visibility-state').profilePath(f.profile));}
},'.claude-work');
// B-242: a member in the user scope plus local scopes. The simulator follows Claude Code
// 2.1.299 as measured in a scratch HOME: `update --scope local` picks the record whose
// projectPath is the physical cwd, and a cwd matching none moves the FIRST local record
// and still exits 0. `wrongCwd` plants exactly that.
function multi(f,{userAtPin=false,alias=false,failAt=null,wrongCwd=null,reorder=false}={}) {
 const oldDir=f.profile+'/plugins/cache/fixture/probe/0.9.0',oldRaw=JSON.stringify({name:'probe',version:'0.9.0'});
 fs.mkdirSync(oldDir+'/.claude-plugin',{recursive:true});fs.writeFileSync(oldDir+'/.claude-plugin/plugin.json',oldRaw);fs.writeFileSync(oldDir+'/value.txt','old');
 const proj=n=>{const d=f.box+'/projects/'+n;fs.mkdirSync(d,{recursive:true});return fs.realpathSync(d);};
 const a=proj('a'),b=proj('b');
 const prior={version:'0.9.0',gitCommitSha:f.a,installPath:oldDir};
 const pinned={version:'1.0.0',gitCommitSha:f.b,installPath:f.payload};
 fs.writeFileSync(f.payload+'/value.txt','second');
 const records=[{scope:'user',...(userAtPin?pinned:prior)},{scope:'local',projectPath:a,...prior},{scope:'local',projectPath:b,...prior}];
 let link=null;if(alias){link=f.box+'/projects/a-renamed';fs.symlinkSync(a,link);records.push({scope:'local',projectPath:link,...prior});}
 fs.writeFileSync(f.rf,JSON.stringify({version:2,plugins:{[f.id]:records}}));
 const calls=[];let updates=0;
 function runner(cmd,args,opts) {
  if(args[0]==='--version')return {status:0,stdout:'2.1.299 (Claude Code)'};
  calls.push({args,cwd:opts.cwd,pwd:opts.env.PWD});
  if(args[1]==='update') {
   updates++;if(failAt===updates)return {status:1};
   const commit=JSON.parse(fs.readFileSync(f.planCatalog())).plugins[0].source.sha,to=commit===f.b?pinned:prior;
   const reg=JSON.parse(fs.readFileSync(f.rf)),list=reg.plugins[f.id];
   let i=args[4]==='user'?list.findIndex(r=>r.scope==='user'):list.findIndex(r=>r.scope==='local' && r.projectPath===fs.realpathSync(opts.cwd));
   if(wrongCwd===updates || i<0) i=list.findIndex(r=>r.scope==='local');
   list[i]={...list[i],...to};
   // Claude 2.1.299 rewrote a neighbouring record's key order on save (measured).
   if(reorder) reg.plugins[f.id]=list.map(r=>Object.fromEntries(Object.entries(r).reverse()));
   fs.writeFileSync(f.rf,JSON.stringify(reg));
  }
  return {status:0,stdout:''};
 }
 return {a,b,link,calls,runner,regs:()=>JSON.parse(fs.readFileSync(f.rf)).plugins[f.id],execute:()=>T.execute(f.plan(),[f.m],f.inventory,{runner})};
}
test('B-242: user plus two local scopes move to the pin together, each local run in its own project',f=>{
 const x=multi(f);assert.equal(f.plan().jobs[0].action,'update');const r=x.execute();assert(r.ok,JSON.stringify(r));
 assert.deepEqual(x.regs().map(r=>[r.scope,r.version,r.gitCommitSha]),[['user','1.0.0',f.b],['local','1.0.0',f.b],['local','1.0.0',f.b]]);
 const ups=x.calls.filter(c=>c.args[1]==='update');assert.deepEqual(ups.map(c=>c.args[4]),['user','local','local']);
 assert.deepEqual(ups.slice(1).map(c=>[c.cwd,c.pwd]),[[x.a,x.a],[x.b,x.b]]);assert.notEqual(ups[0].cwd,x.a);
 const again=f.plan();assert.equal(again.blocked.length,0);assert(['rebind','verify'].includes(again.jobs[0].action),again.jobs[0].action);
});
test('B-242: a rebind readback accepts records Claude re-saved in another key order, values unchanged',f=>{
 fs.writeFileSync(f.payload+'/value.txt','second');
 f.setHook(a=>{if(a[1]==='marketplace'){const reg=JSON.parse(fs.readFileSync(f.rf));reg.plugins[f.id]=reg.plugins[f.id].map(r=>Object.fromEntries(Object.entries(r).reverse()));fs.writeFileSync(f.rf,JSON.stringify(reg));return {status:0,stdout:''};}return null;});
 assert.equal(f.plan().jobs[0].action,'rebind');const r=f.execute();assert(r.ok,JSON.stringify(r));
});
test('B-242: a neighbour record rewritten in another key order is the same record',f=>{
 const x=multi(f,{reorder:true,alias:true});const r=x.execute();assert(r.ok,JSON.stringify(r));
});
test('B-242: a scope already at the pin is not touched; only the stale scopes update',f=>{
 const x=multi(f,{userAtPin:true});const r=x.execute();assert(r.ok,JSON.stringify(r));
 assert.deepEqual(x.calls.filter(c=>c.args[1]==='update').map(c=>c.args[4]),['local','local']);
});
test('B-242: a failure on the second local scope rolls every moved scope back to the prior install',f=>{
 const x=multi(f,{failAt:3});const r=x.execute();assert.equal(r.ok,false);assert.equal(r.results[0].rollback,'verified-prior-payload',JSON.stringify(r));
 assert.deepEqual(x.regs().map(r=>r.version),['0.9.0','0.9.0','0.9.0']);
 const rp=JSON.parse(fs.readFileSync(path.join(path.dirname(r.receipt),'plan.json')));assert.deepEqual(rp.jobs[0].scopes.map(t=>t.projectPath),[null,x.a,x.b],'the recovery plan names every scope');
});
test('B-242: an exit-0 update that moved the wrong scope is caught by readback, not trusted',f=>{
 const x=multi(f,{wrongCwd:3});const r=x.execute();assert.equal(r.ok,false);assert.match(r.error,/did not move exactly the local scope/);assert.equal(r.results[0].rollback,'verified-prior-payload');assert.deepEqual(x.regs().map(r=>r.version),['0.9.0','0.9.0','0.9.0']);
});
test('B-242: an aliased local path is left as recorded and read back unchanged',f=>{
 const x=multi(f,{alias:true});const p=f.plan();assert.equal(p.jobs[0].aliases.length,1);const r=x.execute();assert(r.ok,JSON.stringify(r));
 const al=x.regs().find(r=>r.projectPath===x.link);assert.equal(al.version,'0.9.0');assert.equal(x.calls.filter(c=>c.args[1]==='update').length,3);
});
console.log(`PASS: Claude native transaction — ${count} cases`);
