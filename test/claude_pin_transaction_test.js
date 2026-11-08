'use strict';
const assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path');
const S=require('../lib/claude-plugin-source'),P=require('../lib/claude-pinned'),T=require('../lib/claude-pin-transaction');
let count=0;
function test(name,fn,profileRel){const box=fs.mkdtempSync(path.join(os.tmpdir(),'claude-transaction-'));try{fn(fixture(box,profileRel));count++;console.log('ok '+name);}finally{fs.rmSync(box,{recursive:true,force:true});}}
// B-326: ids may carry capitals (lib/claude-plugin-source.js:9); a test may set FIXTURE_ID.
let FIXTURE_ID='probe@fixture';
function fixture(box,profileRel='.claude') {
 const home=box+'/home',profile=home+'/'+profileRel,id=FIXTURE_ID,pn=id.split('@')[0],mkt=id.split('@')[1],a='a'.repeat(40),b='b'.repeat(40);
 const payload=profile+'/plugins/cache/fixture/probe/1.0.0',sf=profile+'/settings.json',rf=profile+'/plugins/installed_plugins.json';
 const raw=JSON.stringify({name:pn,version:'1.0.0'}),files={'.claude-plugin/plugin.json':raw,'value.txt':'second'};
 const m={name:'fixture',repo:'o/r',commit:b,version:'1.0.0',pluginInstall:id};
 const row={...m,pluginPath:'plugins/probe',entry:{name:pn,source:'./plugins/probe'},configSurface:false,files:Object.entries(files).map(([p,v])=>({path:p,bytes:Buffer.byteLength(v),sha256:S.sha256(v)}))};
 const inventory={schema:'claude-plugin-pins/1',members:[row]},opts={home,profileRoot:profile};
 fs.mkdirSync(payload+'/.claude-plugin',{recursive:true});fs.writeFileSync(payload+'/.claude-plugin/plugin.json',raw);fs.writeFileSync(payload+'/value.txt','first');
 const rec={scope:'user',version:'1.0.0',gitCommitSha:a,installPath:payload};fs.writeFileSync(rf,JSON.stringify({version:2,plugins:{[id]:[rec]}}));
 fs.writeFileSync(sf,'{\r\n "huge":1000001.2500, "enabledPlugins":{'+JSON.stringify(id)+':false,"foreign@foreign":false}, "env":{"KEEP":"same"}\r\n}\r\n');
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
 function planCatalog(){return home+'/.sshlg-skills/claude-pinned/'+S.sha256(require('../lib/visibility-state').profilePath(profile)).slice(0,16)+'/'+mkt+'/.claude-plugin/marketplace.json';}
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
// B-224: every update that moved a plugin left a transaction directory for good (48 of them,
// 5,642 files, 128 MB on the operator's machine by 2026-10-27). The newest KEEP finished ones
// stay, every unfinished one stays, and the older finished ones retire their copies of the
// operator's files into ~/.sshlg-skills/backups/, where ordinary retention keeps ten per file.
function txDirs(f){const root=f.plan().transactionRoot;return fs.readdirSync(root).filter(n=>/^\d+-[a-f0-9]{12}$/.test(n)).sort();}
test('B-224: KEEP+2 updates leave the newest KEEP finished transactions and retire the rest',f=>{
 const N=T.KEEP_FINISHED;assert(Number.isSafeInteger(N)&&N>=1,'KEEP_FINISHED is exported');
 const results=[];for(let i=0;i<N+2;i++){const r=f.execute();assert(r.ok,JSON.stringify(r));results.push(r);}
 const dirs=txDirs(f);assert.equal(dirs.length,N,`kept ${dirs.length} transactions`);
 assert.deepEqual(dirs,results.slice(-N).map(r=>path.basename(path.dirname(r.receipt))),'the newest ones are kept');
 assert.equal(results[N+1].retention.retired.length,1,JSON.stringify(results[N+1].retention));
 const main=f.home+'/.sshlg-skills/backups',names=fs.readdirSync(main);
 const settingsCopies=names.filter(n=>n.startsWith('settings.json--v2-'));
 assert(settingsCopies.length>=1 && settingsCopies.length<=10,`retired settings copies under ordinary retention: ${settingsCopies.length}`);
 assert(!names.some(n=>n.startsWith('receipt.json--v2-')||n.startsWith('latest.json--v2-')||n.startsWith('plan.json--v2-')),'the transaction\'s own records are not retired into the operator backups');
 for(const n of names)if(!n.startsWith('.'))assert.equal(fs.statSync(path.join(main,n)).mode&0o777,0o600);
 // the latest receipt still resolves
 assert.equal(JSON.parse(fs.readFileSync(f.plan().transactionRoot+'/latest.json')).status,'complete');
});
test('B-224: an unfinished transaction is never retired, however old',f=>{
 f.setHook(a=>a[1]==='install'?{status:1}:null);const bad=f.execute();assert(!bad.ok);assert.match(bad.results[0].rollback,/failed/);f.setHook(null);
 const N=T.KEEP_FINISHED;for(let i=0;i<N+2;i++)assert(f.execute().ok);
 const dirs=txDirs(f);assert.equal(dirs.length,N+1);assert(dirs.includes(path.basename(path.dirname(bad.receipt))),'the unfinished transaction was retired');
});
test('B-224: an unreadable receipt counts as unfinished and is kept',f=>{
 assert(f.execute().ok);const root=f.plan().transactionRoot,first=txDirs(f)[0];fs.writeFileSync(path.join(root,first,'receipt.json'),'{');
 for(let i=0;i<T.KEEP_FINISHED+1;i++)assert(f.execute().ok);
 assert(txDirs(f).includes(first));assert.equal(txDirs(f).length,T.KEEP_FINISHED+1);
});
// B-326: a foreign write mid-run fails that run and keeps the write; the next run plans
// only when no key the failed run owned differs from its first backup.
function wedge(f,also) {
 assert(f.execute().ok);
 f.setHook(a=>{if(a[1]==='marketplace'){const s=JSON.parse(fs.readFileSync(f.sf));s.env.KEEP='concurrent';if(also)also(s);fs.writeFileSync(f.sf,JSON.stringify(s));f.setHook(null);}return null;});
 const r=f.execute();assert(!r.ok);const receipt=JSON.parse(fs.readFileSync(r.receipt));assert.equal(receipt.settingsRestored,false);return r;
}
test('B-326: a foreign setting written mid-run leaves the next run free to plan, and is kept',f=>{
 wedge(f);const p=f.plan();assert.equal(p.jobs[0].action,'verify');
 const r=T.execute(p,[f.m],f.inventory,{runner:f.runner});assert(r.ok,JSON.stringify(r));assert.equal(JSON.parse(fs.readFileSync(f.sf)).env.KEEP,'concurrent');
});
test('B-326: the refusal cases below differ from a plannable one only in the edit',f=>{
 const r=wedge(f);const latest=path.join(path.dirname(path.dirname(r.receipt)),'latest.json');
 fs.writeFileSync(latest,JSON.stringify(JSON.parse(fs.readFileSync(latest))));assert.equal(f.plan().jobs[0].action,'verify');
});
test('B-326: an owned key that moved during the failed run still refuses, naming the remedy',f=>{
 wedge(f,s=>{s.enabledPlugins[f.id]=true;});assert.throws(f.plan,/incomplete Claude transaction.*settingsRestored/);
});
test('B-326: an owned marketplace source that moved still refuses',f=>{
 wedge(f,s=>{s.extraKnownMarketplaces.fixture.source={source:'github',repo:'other/repo'};});assert.throws(f.plan,/incomplete/);
});
for(const [what,edit] of [
 ['a failed rollback',r=>{r.results.push({member:'x',rollback:'failed; native recovery remains required'});}],
 ['an uncertain outcome',r=>{r.uncertain=true;}],
 ['a backup outside the transaction, however faithful',(r,f)=>{for(const b of r.backups)if(/settings\.json$/.test(b.file)){const out=f.box+'/settings-copy.json';fs.copyFileSync(b.path,out);b.path=out;}}],
 ['a recovery plan outside the transaction, however faithful',(r,f)=>{const out=f.box+'/plan-copy.json';fs.copyFileSync(r.recoveryPlan,out);r.recoveryPlan=out;}],
 ['a missing settings backup',r=>{r.backups=r.backups.filter(b=>!/settings\.json$/.test(b.file));}],
 ['an unreadable recovery plan',r=>{fs.writeFileSync(r.recoveryPlan,'{');}],
]) test('B-326: '+what+' keeps the refusal',f=>{
 const r=wedge(f);const latest=path.join(path.dirname(path.dirname(r.receipt)),'latest.json');
 const rec=JSON.parse(fs.readFileSync(latest));edit(rec,f);fs.writeFileSync(latest,JSON.stringify(rec));assert.throws(f.plan,/incomplete/);
});
function latestOf(r){return path.join(path.dirname(path.dirname(r.receipt)),'latest.json');}
function edit(r,fn){const l=latestOf(r),rec=JSON.parse(fs.readFileSync(l));fn(rec);fs.writeFileSync(l,JSON.stringify(rec));return rec;}
const settingsCopy=rec=>rec.backups.find(b=>/settings\.json$/.test(b.file));
test('B-326: a foreign field beside an owned marketplace source still plans',f=>{
 wedge(f,s=>{s.extraKnownMarketplaces.fixture.autoUpdate=true;});assert.equal(f.plan().jobs[0].action,'verify');
});
test('B-326: an owned source re-saved in another key order still plans',f=>{
 wedge(f,s=>{const src=s.extraKnownMarketplaces.fixture.source;s.extraKnownMarketplaces.fixture.source=Object.fromEntries(Object.entries(src).reverse());});assert.equal(f.plan().jobs[0].action,'verify');
});
test('B-326: a run that began with no settings file plans when no owned key exists now',f=>{
 const r=wedge(f);edit(r,rec=>{const i=rec.backups.indexOf(settingsCopy(rec));rec.backups[i]={action:'no-file',file:rec.backups[i].file};});
 const s=JSON.parse(fs.readFileSync(f.sf));delete s.enabledPlugins[f.id];delete s.extraKnownMarketplaces;fs.writeFileSync(f.sf,JSON.stringify(s));
 assert.equal(f.plan().jobs[0].action,'verify');
});
test('B-326: a receipt with no backups refuses with the remedy, never a TypeError',f=>{
 const r=wedge(f);edit(r,rec=>{delete rec.backups;});assert.throws(f.plan,/incomplete Claude transaction.*settingsRestored/);
});
test('B-326: a settings copy in a sibling transaction is not this transaction\'s backup',f=>{
 const r=wedge(f,s=>{s.enabledPlugins[f.id]=true;});const sib=path.join(path.dirname(path.dirname(r.receipt)),'1-aaaaaaaaaaaa');fs.mkdirSync(sib);
 const out=path.join(sib,'settings.json');fs.copyFileSync(f.sf,out);edit(r,rec=>{settingsCopy(rec).path=out;});assert.throws(f.plan,/incomplete/);
});
test('B-326: a backup replaced by a link to the live settings is not read',f=>{
 const r=wedge(f,s=>{s.enabledPlugins[f.id]=true;});const rec=JSON.parse(fs.readFileSync(latestOf(r)));const b=settingsCopy(rec).path;
 fs.rmSync(b);fs.symlinkSync(f.sf,b);assert.throws(f.plan,/incomplete/);
});
test('B-326: a receipt naming another transaction directory refuses',f=>{
 const r=wedge(f);edit(r,rec=>{rec.receipt=path.join(f.box,'elsewhere','1-aaaaaaaaaaaa','receipt.json');});assert.throws(f.plan,/incomplete/);
});
test('B-326: each refusal names its own remedy',f=>{
 const r=wedge(f,s=>{s.enabledPlugins[f.id]=true;});assert.throws(f.plan,/settingsRestored/);
 edit(r,rec=>{rec.uncertain=true;rec.settingsRestored=true;});assert.throws(f.plan,/outcome is uncertain.*"uncertain"/);
 edit(r,rec=>{rec.status='running';});assert.throws(f.plan,/in progress or interrupted.*"status"/);
 fs.mkdirSync(path.join(path.dirname(latestOf(r)),'lock'));edit(r,rec=>{rec.status='complete';rec.uncertain=false;});assert.throws(f.plan,/lock directory .*remove it/);
 fs.rmSync(path.join(path.dirname(latestOf(r)),'lock'),{recursive:true});assert.equal(f.plan().jobs[0].action,'verify');
 edit(r,rec=>{rec.status='running';});assert.throws(f.plan,/in progress/);edit(r,rec=>{rec.status='failed';rec.settingsRestored=true;});assert.equal(f.plan().jobs[0].action,'verify');
 edit(r,rec=>{rec.uncertain=true;});assert.throws(f.plan,/uncertain/);edit(r,rec=>{rec.uncertain=false;});assert.equal(f.plan().jobs[0].action,'verify');
});
// A faithful copy of the failed transaction placed where only one check stands in its way.
function relocate(f,r,dir) {
 const from=path.dirname(r.receipt);fs.cpSync(from,dir,{recursive:true});
 return edit(r,rec=>{const move=p=>typeof p==='string'&&p.startsWith(from+path.sep)?dir+p.slice(from.length):p;rec.receipt=move(rec.receipt);rec.recoveryPlan=move(rec.recoveryPlan);for(const b of rec.backups)if(b.path)b.path=move(b.path);});
}
test('B-326: the plannable copy below plans where it was written',f=>{
 const r=wedge(f);const root=path.dirname(path.dirname(r.receipt));relocate(f,r,path.join(root,'2-bbbbbbbbbbbb'));assert.equal(f.plan().jobs[0].action,'verify');
});
test('B-326: a faithful copy outside the transactions root is not read',f=>{
 const r=wedge(f);relocate(f,r,path.join(fs.realpathSync(f.box),'outside','2-bbbbbbbbbbbb'));assert.throws(f.plan,/incomplete/);
});
test('B-326: a faithful copy under a name no transaction carries is not read',f=>{
 const r=wedge(f);relocate(f,r,path.join(path.dirname(path.dirname(r.receipt)),'not-a-transaction'));assert.throws(f.plan,/incomplete/);
});
test('B-326: a receipt not named receipt.json is not this transaction\'s receipt',f=>{
 const r=wedge(f);edit(r,rec=>{rec.receipt=path.join(path.dirname(rec.receipt),'other.json');});assert.throws(f.plan,/incomplete/);
});
test('B-326: a backups directory replaced by a link is not followed',f=>{
 const r=wedge(f,s=>{s.enabledPlugins[f.id]=true;});const rec=JSON.parse(fs.readFileSync(latestOf(r)));const b=settingsCopy(rec).path,dir=path.dirname(b);
 const away=path.join(f.box,'away');fs.mkdirSync(away);fs.copyFileSync(f.sf,path.join(away,path.basename(b)));fs.rmSync(dir,{recursive:true});fs.symlinkSync(away,dir);
 assert.throws(f.plan,/incomplete/);
});
test('B-326: two settings backups in one receipt are ambiguous and refuse',f=>{
 const r=wedge(f);edit(r,rec=>{rec.backups.push({...settingsCopy(rec)});});assert.throws(f.plan,/incomplete/);
});
test('B-326: results that are not a list refuse with the remedy, never a TypeError',f=>{
 const r=wedge(f);edit(r,rec=>{rec.results={};});assert.throws(f.plan,/incomplete Claude transaction.*settingsRestored/);
});
const REMEDY=/incomplete Claude transaction.*settingsRestored/;
for(const [what,fn] of [
 ['a null result',rec=>{rec.results.push(null);}],
 ['a string result',rec=>{rec.results.push('x');}],
 ['no receipt path',rec=>{delete rec.receipt;}],
 ['a numeric receipt path',rec=>{rec.receipt=42;}],
 ['a settings copy of another kind than saved or no-file',rec=>{settingsCopy(rec).action='adopted';}],
]) test('B-326: '+what+' refuses with the remedy, never a TypeError or a plan',f=>{const r=wedge(f);edit(r,fn);assert.throws(f.plan,REMEDY);});
for(const [what,jobs] of [['no jobs',[]],['a null job',[null]],['a job without a marketplace',[{pluginInstall:'probe'}]],['jobs that are not a list',{}],['no jobs key',undefined]])
 test('B-326: a recovery plan with '+what+' refuses with the remedy',f=>{
  const r=wedge(f);const rec=JSON.parse(fs.readFileSync(latestOf(r)));const plan=JSON.parse(fs.readFileSync(rec.recoveryPlan));
  if(jobs===undefined) delete plan.jobs; else plan.jobs=jobs;fs.writeFileSync(rec.recoveryPlan,JSON.stringify(plan));assert.throws(f.plan,REMEDY);
 });
for(const name of ['x1-bbbbbbbbbbbb','2-bbbbbbbbbbbbz'])
 test('B-326: a faithful copy under the near-transaction name '+name+' is not read',f=>{const r=wedge(f);relocate(f,r,path.join(path.dirname(path.dirname(r.receipt)),name));assert.throws(f.plan,/incomplete/);});
test('B-326: a directory whose name only extends the transaction\'s is not inside it',f=>{
 const r=wedge(f,s=>{s.enabledPlugins[f.id]=true;});const twin=path.dirname(r.receipt)+'0';fs.mkdirSync(twin);const out=path.join(twin,'settings.json');fs.copyFileSync(f.sf,out);
 edit(r,rec=>{settingsCopy(rec).path=out;});assert.throws(f.plan,/incomplete/);
});
test('B-326: a complete receipt plans whatever flags it carries, as in 1.86.1',f=>{
 const r=wedge(f,s=>{s.enabledPlugins[f.id]=true;});edit(r,rec=>{rec.status='complete';rec.uncertain=true;rec.settingsRestored=false;});assert.equal(f.plan().jobs[0].action,'verify');
});
test('B-326: a settings copy that is not an object is not a backup',f=>{
 const r=wedge(f);const rec=JSON.parse(fs.readFileSync(latestOf(r)));fs.writeFileSync(settingsCopy(rec).path,'[]');
 const s=JSON.parse(fs.readFileSync(f.sf));delete s.enabledPlugins[f.id];delete s.extraKnownMarketplaces;fs.writeFileSync(f.sf,JSON.stringify(s));assert.throws(f.plan,REMEDY);
});
test('B-326: a path with a dot segment inside the transaction is not read',f=>{
 const r=wedge(f);edit(r,rec=>{const b=settingsCopy(rec);b.path=path.join(path.dirname(rec.receipt),'backups','..','backups',path.basename(b.path)).replace(path.sep+'backups'+path.sep+path.basename(b.path),path.sep+'backups'+path.sep+'.'+path.sep+path.basename(b.path));});assert.throws(f.plan,REMEDY);
});
// Every real update writes one recovery job per member; the owned keys of each are compared.
function twoJobs(r){const rec=JSON.parse(fs.readFileSync(latestOf(r)));const plan=JSON.parse(fs.readFileSync(rec.recoveryPlan));plan.jobs.push({member:'other',pluginInstall:'other@othermk'});fs.writeFileSync(rec.recoveryPlan,JSON.stringify(plan));}
test('B-326: with two members and neither owned key moved, the next run plans',f=>{const r=wedge(f);twoJobs(r);assert.equal(f.plan().jobs[0].action,'verify');});
test('B-326: with two members, a moved key of the second refuses',f=>{
 const r=wedge(f,s=>{s.enabledPlugins['other@othermk']=true;});twoJobs(r);assert.throws(f.plan,REMEDY);
});
test('B-326: with two members, a moved key of the first refuses',f=>{
 const r=wedge(f,s=>{s.enabledPlugins[f.id]=true;});twoJobs(r);assert.throws(f.plan,REMEDY);
});
test('B-326: a run that began with no settings file refuses while an owned key exists now',f=>{
 const r=wedge(f);edit(r,rec=>{const i=rec.backups.indexOf(settingsCopy(rec));rec.backups[i]={action:'no-file',file:rec.backups[i].file};});assert.throws(f.plan,REMEDY);
});
test('B-326: an owned source moved to another directory of the same type refuses',f=>{
 wedge(f,s=>{s.extraKnownMarketplaces.fixture.source={...s.extraKnownMarketplaces.fixture.source,path:'/elsewhere'};});assert.throws(f.plan,REMEDY);
});
test('B-326: an owned source of another type at the same path refuses',f=>{
 wedge(f,s=>{s.extraKnownMarketplaces.fixture.source={...s.extraKnownMarketplaces.fixture.source,source:'git'};});assert.throws(f.plan,REMEDY);
});
test('B-326: a faithful copy under a 13-hex name is not a transaction',f=>{const r=wedge(f);relocate(f,r,path.join(path.dirname(path.dirname(r.receipt)),'2-bbbbbbbbbbbbb'));assert.throws(f.plan,/incomplete/);});
test('B-326: with two members, a moved marketplace source of the second refuses',f=>{
 const r=wedge(f,s=>{s.extraKnownMarketplaces.othermk={source:{source:'directory',path:'/moved'}};});twoJobs(r);assert.throws(f.plan,REMEDY);
});
test('B-326: an owned entry null in the backup and absent now refuses, and the reverse',f=>{
 const r=wedge(f);const rec=JSON.parse(fs.readFileSync(latestOf(r)));const b=settingsCopy(rec).path;
 const kept=JSON.parse(fs.readFileSync(b));kept.enabledPlugins[f.id]=null;fs.writeFileSync(b,JSON.stringify(kept));
 const s=JSON.parse(fs.readFileSync(f.sf));delete s.enabledPlugins[f.id];fs.writeFileSync(f.sf,JSON.stringify(s));assert.throws(f.plan,REMEDY);
 delete kept.enabledPlugins[f.id];fs.writeFileSync(b,JSON.stringify(kept));s.enabledPlugins[f.id]=null;fs.writeFileSync(f.sf,JSON.stringify(s));assert.throws(f.plan,REMEDY);
});
test('B-326: an uncertain first install names the uncertain remedy, not the settings one',f=>{
 f.setHook(a=>a[1]==='marketplace'?{status:null,signal:'SIGKILL'}:null);const r=f.execute();assert(!r.ok);
 const rec=JSON.parse(fs.readFileSync(r.receipt));assert.equal(rec.uncertain,true);assert.throws(f.plan,/outcome is uncertain/);
});
test('B-326: a run in flight holds the lock and records running; the next one is told about the lock',f=>{
 let seen=null;f.setHook(a=>{if(a[1]==='marketplace' && !seen){try{f.plan();}catch(e){seen=e.message;}}return null;});f.execute();
 assert.match(seen,/lock directory .*remove it/);
});
test('B-326: an owned source null in the backup and absent now refuses',f=>{
 const r=wedge(f);const rec=JSON.parse(fs.readFileSync(latestOf(r)));const b=settingsCopy(rec).path;
 const kept=JSON.parse(fs.readFileSync(b));kept.extraKnownMarketplaces={fixture:{source:null}};fs.writeFileSync(b,JSON.stringify(kept));
 const s=JSON.parse(fs.readFileSync(f.sf));s.extraKnownMarketplaces={fixture:{}};fs.writeFileSync(f.sf,JSON.stringify(s));assert.throws(f.plan,REMEDY);
});
test('B-326: a verified member ahead of the failed one, as a real run writes it, still plans',f=>{
 const r=wedge(f);twoJobs(r);edit(r,rec=>{rec.results.unshift({member:'other',action:'verify',status:'verified',commit:'b'.repeat(40),files:2});});assert.equal(f.plan().jobs[0].action,'verify');
});
test('B-326: a lock with no journal yet refuses, naming the lock',f=>{
 const p=f.plan();fs.mkdirSync(p.transactionRoot+'/lock',{recursive:true});assert.throws(f.plan,/lock directory .*remove it/);
});
test('B-326: with two members, owned keys exchanged between them refuse',f=>{
 const r=wedge(f);twoJobs(r);const s=JSON.parse(fs.readFileSync(f.sf));
 const src=s.extraKnownMarketplaces.fixture.source,v=s.enabledPlugins[f.id];
 delete s.enabledPlugins[f.id];delete s.extraKnownMarketplaces.fixture;
 s.enabledPlugins['other@othermk']=v;s.extraKnownMarketplaces.othermk={source:src};
 fs.writeFileSync(f.sf,JSON.stringify(s));assert.throws(f.plan,REMEDY);
});
for(const step of ['uninstall','install']) test('B-326: the comparison is with the first settings copy, not a later one the run took ('+step+')',f=>{
 // A first run adds the owned marketplace source; a foreign write at a payload step lands
 // after later copies of settings (which carry that source) were taken. The plugin starts
 // enabled, so only the source differs from the first copy.
 {const s0=JSON.parse(fs.readFileSync(f.sf));s0.enabledPlugins[f.id]=true;fs.writeFileSync(f.sf,JSON.stringify(s0));}
 f.setHook(a=>{if(a[1]===step){const s=JSON.parse(fs.readFileSync(f.sf));s.env.KEEP='concurrent';fs.writeFileSync(f.sf,JSON.stringify(s));f.setHook(null);}return null;});
 const r=f.execute();assert(!r.ok);const rec=JSON.parse(fs.readFileSync(r.receipt));assert.equal(rec.settingsRestored,false);assert(!rec.uncertain);
 const dir=path.dirname(settingsCopy(rec).path);assert(fs.readdirSync(dir).filter(n=>n.startsWith('settings.json')).length>=2,'later settings copies exist');
 assert.throws(f.plan,REMEDY);
});
// The receipt this machine wrote on 2026-11-07: a foreign write after the first backups and
// before the settings write, so the run fails with no results at all.
test('B-326: the incident shape (changed before protected write, no results) plans',f=>{
 assert(f.execute().ok);
 const A=require('../lib/apply'),old=A.protect;let n=0;
 A.protect=(file,o)=>{const r=old(file,o);if(++n===3){const s=JSON.parse(fs.readFileSync(f.sf));s.env.KEEP='concurrent';fs.writeFileSync(f.sf,JSON.stringify(s));}return r;};
 let r;try{r=f.execute();}finally{A.protect=old;}
 assert(!r.ok);const rec=JSON.parse(fs.readFileSync(r.receipt));
 assert.equal(rec.settingsRestored,false);assert(!rec.uncertain);assert.deepEqual(rec.results,[]);assert.match(rec.error,/changed before protected write/);
 assert.equal(f.plan().jobs[0].action,'verify');assert.equal(JSON.parse(fs.readFileSync(f.sf)).env.KEEP,'concurrent');
});
test('B-326: a verified rollback followed by a foreign write, owned keys unchanged, plans',f=>{
 {const s0=JSON.parse(fs.readFileSync(f.sf));s0.enabledPlugins[f.id]=true;fs.writeFileSync(f.sf,JSON.stringify(s0));}
 assert(f.execute().ok);
 const reg=JSON.parse(fs.readFileSync(f.rf));reg.plugins[f.id][0].gitCommitSha=f.a;fs.writeFileSync(f.rf,JSON.stringify(reg));fs.writeFileSync(f.payload+'/value.txt','first');
 assert.equal(f.plan().jobs[0].action,'reinstall');
 let first=true;
 f.setHook(a=>{if(a[1]==='install' && first){first=false;const s=JSON.parse(fs.readFileSync(f.sf));s.env.KEEP='concurrent';fs.writeFileSync(f.sf,JSON.stringify(s));return {status:1};}return null;});
 const r=f.execute();assert(!r.ok);const rec=JSON.parse(fs.readFileSync(r.receipt));
 assert.equal(rec.settingsRestored,false);assert(!rec.uncertain);assert.equal(rec.results.at(-1).rollback,'verified-prior-payload');
 f.setHook(null);assert.equal(f.plan().jobs[0].action,'reinstall');
});
test('B-326: a disabled owned entry deleted mid-run refuses',f=>{wedge(f,s=>{delete s.enabledPlugins[f.id];});assert.throws(f.plan,REMEDY);});
test('B-326: a disabled owned entry set to null mid-run refuses',f=>{wedge(f,s=>{s.enabledPlugins[f.id]=null;});assert.throws(f.plan,REMEDY);});
test('B-326: an owned entry absent in the backup and disabled now refuses',f=>{
 const r=wedge(f);const rec=JSON.parse(fs.readFileSync(latestOf(r)));const b=settingsCopy(rec).path;
 const kept=JSON.parse(fs.readFileSync(b));delete kept.enabledPlugins[f.id];fs.writeFileSync(b,JSON.stringify(kept));assert.throws(f.plan,REMEDY);
});
test('B-326: a foreign pluginConfigs write mid-run is not an owned key, and the next run plans',f=>{
 wedge(f,s=>{s.pluginConfigs={[f.id]:{}};});assert.equal(f.plan().jobs[0].action,'verify');
});
test('B-326: the refusals name the settings file and the lock directory they mean',f=>{
 const r=wedge(f,s=>{s.enabledPlugins[f.id]=true;});
 assert.throws(f.plan,e=>e.message.includes(f.sf)&&/settingsRestored/.test(e.message));
 const lock=path.join(path.dirname(latestOf(r)),'lock');fs.mkdirSync(lock);assert.throws(f.plan,e=>e.message.includes(lock)&&/remove it/.test(e.message));
});
function foreignAtMarketplace(f){f.setHook(a=>{if(a[1]==='marketplace'){const s=JSON.parse(fs.readFileSync(f.sf));s.env.KEEP='concurrent';fs.writeFileSync(f.sf,JSON.stringify(s));f.setHook(null);}return null;});}
test('B-326: a failure with no results after an owned entry was toggled refuses',f=>{
 assert(f.execute().ok);
 const A=require('../lib/apply'),old=A.protect;let n=0;
 A.protect=(file,o)=>{const r=old(file,o);if(++n===3){const s=JSON.parse(fs.readFileSync(f.sf));s.env.KEEP='concurrent';s.enabledPlugins[f.id]=!s.enabledPlugins[f.id];fs.writeFileSync(f.sf,JSON.stringify(s));}return r;};
 let r;try{r=f.execute();}finally{A.protect=old;}
 assert(!r.ok);const rec=JSON.parse(fs.readFileSync(r.receipt));assert.deepEqual(rec.results,[]);assert.equal(rec.settingsRestored,false);assert.throws(f.plan,REMEDY);
});
test('B-326: a failed first rebind whose owned source moved refuses',f=>{
 fs.writeFileSync(f.payload+'/value.txt','second');assert.equal(f.plan().jobs[0].action,'rebind');
 foreignAtMarketplace(f);const r=f.execute();assert(!r.ok);assert.equal(JSON.parse(fs.readFileSync(r.receipt)).settingsRestored,false);assert.throws(f.plan,REMEDY);
});
test('B-326: a failed fresh install whose owned source moved refuses',f=>{
 fs.writeFileSync(f.rf,JSON.stringify({version:2,plugins:{}}));fs.rmSync(f.payload,{recursive:true});assert.equal(f.plan().jobs[0].action,'install');
 foreignAtMarketplace(f);const r=f.execute();assert(!r.ok);const rec=JSON.parse(fs.readFileSync(r.receipt));assert.equal(rec.settingsRestored,false);
 assert.equal(JSON.parse(fs.readFileSync(rec.recoveryPlan)).jobs[0].previous,null);assert.throws(f.plan,REMEDY);
});
test('B-326: a failure on a first backup, settings untouched, plans as in 1.86.1',f=>{
 assert(f.execute().ok);
 const A=require('../lib/apply'),old=A.protect;let n=0;
 A.protect=(file,o)=>(++n===4?{action:'backup-failed',file}:old(file,o));
 let r;try{r=f.execute();}finally{A.protect=old;}
 assert(!r.ok);const rec=JSON.parse(fs.readFileSync(r.receipt));assert.equal(rec.settingsRestored,true);assert.deepEqual(rec.results,[]);
 assert.equal(f.plan().jobs[0].action,'verify');
});
test('B-326: with two members, a rebinding second member whose source moved refuses',f=>{
 const r=wedge(f,s=>{s.extraKnownMarketplaces.othermk={source:{source:'directory',path:'/moved'}};});
 const rec=JSON.parse(fs.readFileSync(latestOf(r)));const plan=JSON.parse(fs.readFileSync(rec.recoveryPlan));
 plan.jobs.push({member:'other',pluginInstall:'other@othermk',action:'rebind',previous:null});fs.writeFileSync(rec.recoveryPlan,JSON.stringify(plan));
 assert.throws(f.plan,REMEDY);
});
function foreignCleanup(f,step,once=true){let done=false;f.setHook(a=>{if(a[1]===step&&!done){done=once;const s=JSON.parse(fs.readFileSync(f.sf));s.cleanupPeriodDays=90;fs.writeFileSync(f.sf,JSON.stringify(s));}return null;});}
test('B-326: a run that began with no settings file and added the owned source refuses',f=>{
 fs.rmSync(f.sf);const p=f.plan();foreignCleanup(f,'marketplace');
 const r=T.execute(p,[f.m],f.inventory,{runner:f.runner});assert(!r.ok);assert.equal(JSON.parse(fs.readFileSync(r.receipt)).backups[0].action,'no-file');assert.throws(f.plan,REMEDY);
});
test('B-326: a run that began with no settings file, then another session created one with an owned entry, refuses',f=>{
 fs.rmSync(f.sf);const p=f.plan();
 const A=require('../lib/apply'),old=A.protect;let n=0;
 A.protect=(file,o)=>{const r=old(file,o);if(++n===3)fs.writeFileSync(f.sf,JSON.stringify({cleanupPeriodDays:90,enabledPlugins:{[f.id]:false}}));return r;};
 let r;try{r=T.execute(p,[f.m],f.inventory,{runner:f.runner});}finally{A.protect=old;}
 assert(!r.ok);assert.deepEqual(JSON.parse(fs.readFileSync(r.receipt)).results,[]);assert.throws(f.plan,REMEDY);
});
test('B-326: a fresh install whose only owned change is the enabledPlugins entry refuses',f=>{
 const dir=f.plan().jobs[0].dir;
 fs.writeFileSync(f.rf,JSON.stringify({version:2,plugins:{}}));fs.rmSync(f.payload,{recursive:true});
 fs.writeFileSync(f.sf,JSON.stringify({env:{KEEP:'same'},extraKnownMarketplaces:{fixture:{source:{source:'directory',path:dir}}}}));
 const p=f.plan();assert.equal(p.jobs[0].action,'install');foreignCleanup(f,'marketplace');
 const r=T.execute(p,[f.m],f.inventory,{runner:f.runner});assert(!r.ok);assert.equal(JSON.parse(fs.readFileSync(f.sf)).enabledPlugins[f.id],true);assert.throws(f.plan,REMEDY);
});
test('B-326: a reinstall that re-enabled a disabled plugin natively refuses',f=>{
 assert(f.execute().ok);
 const reg=JSON.parse(fs.readFileSync(f.rf));reg.plugins[f.id][0].gitCommitSha=f.a;fs.writeFileSync(f.rf,JSON.stringify(reg));fs.writeFileSync(f.payload+'/value.txt','first');
 const p=f.plan();assert.equal(p.jobs[0].action,'reinstall');foreignCleanup(f,'install');
 const r=T.execute(p,[f.m],f.inventory,{runner:f.runner});f.setHook(null);assert(!r.ok);assert.equal(JSON.parse(fs.readFileSync(f.sf)).enabledPlugins[f.id],true);assert.throws(f.plan,REMEDY);
});
test('B-326: a reinstall that failed at the catalog step, nothing owned moved, plans',f=>{
 assert(f.execute().ok);
 const reg=JSON.parse(fs.readFileSync(f.rf));reg.plugins[f.id][0].gitCommitSha=f.a;fs.writeFileSync(f.rf,JSON.stringify(reg));fs.writeFileSync(f.payload+'/value.txt','first');
 const p=f.plan();assert.equal(p.jobs[0].action,'reinstall');foreignCleanup(f,'marketplace');
 const r=T.execute(p,[f.m],f.inventory,{runner:f.runner});f.setHook(null);assert(!r.ok);assert.equal(JSON.parse(fs.readFileSync(r.receipt)).results.at(-1).rollback,'not-attempted');
 assert.equal(f.plan().jobs[0].action,'reinstall');
});
test('B-326: an update job whose failed run added the owned source refuses',f=>{
 const reg=JSON.parse(fs.readFileSync(f.rf));reg.plugins[f.id][0].version='0.9.0';fs.writeFileSync(f.rf,JSON.stringify(reg));
 const p=f.plan();assert.equal(p.jobs[0].action,'update');foreignAtMarketplace(f);
 const r=T.execute(p,[f.m],f.inventory,{runner:f.runner});assert(!r.ok);assert.equal(JSON.parse(fs.readFileSync(r.receipt)).settingsRestored,false);assert.throws(f.plan,REMEDY);
});
test('B-326: an owned source whose extra field the failed run dropped refuses',f=>{
 assert(f.execute().ok);const s=JSON.parse(fs.readFileSync(f.sf));s.extraKnownMarketplaces.fixture.source.ref='keep-me';fs.writeFileSync(f.sf,JSON.stringify(s));
 foreignAtMarketplace(f);const r=f.execute();assert(!r.ok);assert.equal(JSON.parse(fs.readFileSync(f.sf)).extraKnownMarketplaces.fixture.source.ref,undefined);assert.throws(f.plan,REMEDY);
});
test('B-326: a stale lock beside a settled failure still refuses, naming the lock',f=>{
 const r=wedge(f);assert.equal(f.plan().jobs[0].action,'verify');
 fs.mkdirSync(path.join(path.dirname(latestOf(r)),'lock'));assert.throws(f.plan,/lock directory .*remove it/);
});
// Two real members through execute(): the first verified (its run newly bound its marketplace
// source), the second failed on a foreign write at its own marketplace step.
function twoMembers(box,swap) {
 const home=box+'/home',profile=home+'/.claude',sf=profile+'/settings.json',rf=profile+'/plugins/installed_plugins.json',a='a'.repeat(40),b='b'.repeat(40);
 const raw=n=>JSON.stringify({name:n,version:'1.0.0'});
 const mk=(name,plugin,mkt)=>{const files={'.claude-plugin/plugin.json':raw(plugin),'value.txt':'second'};
  const m={name,repo:'o/'+name,commit:b,version:'1.0.0',pluginInstall:plugin+'@'+mkt};
  const row={...m,pluginPath:'plugins/'+plugin,entry:{name:plugin,source:'./plugins/'+plugin},configSurface:false,files:Object.entries(files).map(([p,v])=>({path:p,bytes:Buffer.byteLength(v),sha256:S.sha256(v)}))};
  const payload=profile+'/plugins/cache/'+mkt+'/'+plugin+'/1.0.0';fs.mkdirSync(payload+'/.claude-plugin',{recursive:true});
  for(const [p,v] of Object.entries(files)) fs.writeFileSync(payload+'/'+p,v);
  return {m,row,rec:{scope:'user',version:'1.0.0',gitCommitSha:a,installPath:payload}};};
 let X=mk('fixture','probe','fixture'),Y=mk('second','probe2','second');if(swap)[X,Y]=[Y,X];
 fs.writeFileSync(rf,JSON.stringify({version:2,plugins:{[X.m.pluginInstall]:[X.rec],[Y.m.pluginInstall]:[Y.rec]}}));
 fs.writeFileSync(sf,JSON.stringify({enabledPlugins:{[X.m.pluginInstall]:true,[Y.m.pluginInstall]:true},env:{KEEP:'same'}}));
 const members=[X.m,Y.m],inventory={schema:'claude-plugin-pins/1',members:[X.row,Y.row]},opts={home,profileRoot:profile};
 const failing=Y.m.pluginInstall.split('@')[1];
 const runner=(cmd,args)=>{if(args[0]==='--version')return {status:0,stdout:'2.1.296 (Claude Code)'};
  if(args[1]==='marketplace'&&args[2]==='add'&&path.basename(args[3])===failing){const s=JSON.parse(fs.readFileSync(sf));s.cleanupPeriodDays=90;fs.writeFileSync(sf,JSON.stringify(s));}
  return {status:0,stdout:''};};
 {const p0=P.prepare(members,inventory,opts);const s=JSON.parse(fs.readFileSync(sf));s.extraKnownMarketplaces={[failing]:{source:{source:'directory',path:p0.jobs[1].dir}}};fs.writeFileSync(sf,JSON.stringify(s));}
 const p=P.prepare(members,inventory,opts);const r=T.execute(p,members,inventory,{runner});
 return {r,plan:()=>P.prepare(members,inventory,opts)};
}
for(const swap of [false,true]) test('B-326: two real members, the verified one newly bound, the other failed on a foreign write, refuses'+(swap?' (order swapped)':''),f=>{
 const {r,plan}=twoMembers(f.box,swap);assert(!r.ok);const rec=JSON.parse(fs.readFileSync(r.receipt));
 assert.deepEqual(rec.results.map(x=>x.status),['verified','failed']);assert.equal(rec.settingsRestored,false);assert.throws(plan,REMEDY);
});
// Owned values are compared exactly: no path, type, case or string normalisation. One wedged
// receipt from execute(); each row rewrites the first backup and the live file, then plans.
test('B-326: owned values compare exactly, only key order is free (table)',f=>{
 const r=wedge(f);const rec=JSON.parse(fs.readFileSync(latestOf(r)));const b=settingsCopy(rec).path;
 const base=JSON.parse(fs.readFileSync(f.sf)),D=base.extraKnownMarketplaces.fixture.source.path;
 const src=(o)=>({...base.extraKnownMarketplaces.fixture.source,...o});
 const set=(file,ep,source)=>{const d=JSON.parse(JSON.stringify(base));
  if(ep===undefined)delete d.enabledPlugins[f.id];else d.enabledPlugins[f.id]=ep;
  if(source===undefined)delete d.extraKnownMarketplaces.fixture.source;else d.extraKnownMarketplaces.fixture.source=source;
  fs.writeFileSync(file,JSON.stringify(d));};
 const verdict=()=>{try{f.plan();return 'plan';}catch(e){if(!REMEDY.test(e.message))throw e;return 'refuse';}};
 const S0=src({});
 const rows=[
  ['enabled true vs "true"',[true,S0],['true',S0],'refuse'],
  ['enabled true vs 1',[true,S0],[1,S0],'refuse'],
  ['enabled false vs 0',[false,S0],[0,S0],'refuse'],
  ['enabled false vs "false"',[false,S0],['false',S0],'refuse'],
  ['enabled false vs null',[false,S0],[null,S0],'refuse'],
  ['enabled true vs [true]',[true,S0],[[true],S0],'refuse'],
  ['enabled false vs {}',[false,S0],[{},S0],'refuse'],
  ['source path vs trailing slash',[false,S0],[false,src({path:D+'/'})],'refuse'],
  ['source path vs dot segment',[false,S0],[false,src({path:D+'/.'})],'refuse'],
  ['source path vs parent hop',[false,S0],[false,src({path:path.join(D,'..')+'/'+path.basename(D)+'/../'+path.basename(D)})],'refuse'],
  ['source path vs other case',[false,S0],[false,src({path:D.toUpperCase()})],'refuse'],
  ['source type vs other case',[false,S0],[false,src({source:'Directory'})],'refuse'],
  ['source vs source plus a field',[false,S0],[false,src({ref:'x'})],'refuse'],
  ['source field 1 vs "1"',[false,src({n:1})],[false,src({n:'1'})],'refuse'],
  ['source vs null',[false,S0],[false,null],'refuse'],
  ['source keys reordered',[false,S0],[false,Object.fromEntries(Object.entries(S0).reverse())],'plan'],
  ['nested keys reordered',[false,src({opt:{a:1,b:2}})],[false,src({opt:{b:2,a:1}})],'plan'],
  ['identical',[false,S0],[false,S0],'plan'],
 ];
 const wrong=[];
 for(const [name,before,now,want] of rows){set(b,...before);set(f.sf,...now);const got=verdict();if(got!==want)wrong.push(name+': '+got);}
 assert.deepEqual(wrong,[]);
});
test('B-326: a faithful copy one directory deeper under the transactions root is not read',f=>{const r=wedge(f);relocate(f,r,path.join(path.dirname(path.dirname(r.receipt)),'x','2-bbbbbbbbbbbb'));assert.throws(f.plan,/incomplete/);});
test('B-326: a run recorded in progress refuses even when its failure would have settled',f=>{
 const r=wedge(f);assert.equal(f.plan().jobs[0].action,'verify');edit(r,rec=>{rec.status='running';});assert.throws(f.plan,/in progress or interrupted/);
});
test('B-326: every member verified, then a foreign write before the final check, with the owned source new, refuses',f=>{
 const A=require('../lib/apply'),old=A.protect;let armed=false,fired=false;
 f.setHook(a=>{if(a[1]==='install'||a[1]==='update')armed=true;return null;});
 A.protect=(file,o)=>{if(armed&&!fired&&file.endsWith('receipt.json')){fired=true;
   const s=JSON.parse(fs.readFileSync(f.sf));s.cleanupPeriodDays=14;fs.writeFileSync(f.sf,JSON.stringify(s));
   const g=JSON.parse(fs.readFileSync(f.rf));g.plugins['other@else']=[{scope:'user',version:'1',installPath:'/x'}];fs.writeFileSync(f.rf,JSON.stringify(g));}
  return old(file,o);};
 let r;try{r=f.execute();}finally{A.protect=old;f.setHook(null);}
 assert(!r.ok);const rec=JSON.parse(fs.readFileSync(latestOf(r)));assert(rec.results.length&&rec.results.every(x=>x.status==='verified'));assert.equal(rec.settingsRestored,false);
 assert.throws(f.plan,REMEDY);
});
test('B-326: the whole extraKnownMarketplaces map deleted mid-run refuses',f=>{wedge(f,s=>{delete s.extraKnownMarketplaces;});assert.throws(f.plan,REMEDY);});
test('B-326: the whole enabledPlugins map deleted mid-run refuses',f=>{wedge(f,s=>{delete s.enabledPlugins;});assert.throws(f.plan,REMEDY);});
test('B-326 (round 19) E1: owned enabledPlugins entry re-keyed in other case mid-run refuses',f=>{wedge(f,s=>{const v=s.enabledPlugins[f.id];delete s.enabledPlugins[f.id];s.enabledPlugins[f.id.toUpperCase()]=v;});assert.throws(f.plan,REMEDY);});
test('B-326 (round 19) E2: owned marketplace entry re-keyed in other case mid-run refuses',f=>{wedge(f,s=>{const v=s.extraKnownMarketplaces.fixture;delete s.extraKnownMarketplaces.fixture;s.extraKnownMarketplaces.Fixture=v;});assert.throws(f.plan,REMEDY);});
test('B-326 (round 19) E3: settings emptied by another writer mid-run refuses',f=>{wedge(f,s=>{for(const k of Object.keys(s))delete s[k];});assert.throws(f.plan,REMEDY);});
test('B-326 (round 19) E3b: both owned maps deleted mid-run refuses',f=>{wedge(f,s=>{delete s.enabledPlugins;delete s.extraKnownMarketplaces;});assert.throws(f.plan,REMEDY);});
test('B-326 (round 19) E4: a nested null field inside the owned source dropped mid-run refuses',f=>{
 const r=wedge(f);const rec=JSON.parse(fs.readFileSync(latestOf(r)));const b=settingsCopy(rec).path;
 const k=JSON.parse(fs.readFileSync(b));k.extraKnownMarketplaces.fixture.source.ref=null;fs.writeFileSync(b,JSON.stringify(k));assert.throws(f.plan,REMEDY);});
test('B-326 (round 19) E5: owned source path in NFD vs NFC refuses',f=>{
 const r=wedge(f);const rec=JSON.parse(fs.readFileSync(latestOf(r)));const b=settingsCopy(rec).path;
 const k=JSON.parse(fs.readFileSync(b));k.extraKnownMarketplaces.fixture.source.tag='é';fs.writeFileSync(b,JSON.stringify(k));
 const s=JSON.parse(fs.readFileSync(f.sf));s.extraKnownMarketplaces.fixture.source.tag='é';fs.writeFileSync(f.sf,JSON.stringify(s));assert.throws(f.plan,REMEDY);});
test('B-326 (round 19) E6: a null field added inside the owned source mid-run refuses',f=>{wedge(f,s=>{s.extraKnownMarketplaces.fixture.source.ref=null;});assert.throws(f.plan,REMEDY);});
test('B-326 (round 19) E7: an empty object added inside the owned source mid-run refuses',f=>{wedge(f,s=>{s.extraKnownMarketplaces.fixture.source.opts={};});assert.throws(f.plan,REMEDY);});
// incident shape (failure at the first settings write), so the first backup carries whatever the operator had
function incident(f,pre,mid){
 assert(f.execute().ok);{const s=JSON.parse(fs.readFileSync(f.sf));pre(s);fs.writeFileSync(f.sf,JSON.stringify(s));}
 const A=require('../lib/apply'),old=A.protect;let n=0;
 A.protect=(file,o)=>{const r=old(file,o);if(++n===3){const s=JSON.parse(fs.readFileSync(f.sf));s.env.KEEP='concurrent';mid(s);fs.writeFileSync(f.sf,JSON.stringify(s));}return r;};
 let r;try{r=f.execute();}finally{A.protect=old;}
 assert(!r.ok);const rec=JSON.parse(fs.readFileSync(r.receipt));assert.equal(rec.settingsRestored,false);assert.deepEqual(rec.results,[]);return r;}
test('B-326 (round 19) E8: an owned source string re-saved NFD mid-run refuses (incident shape)',f=>{
 incident(f,s=>{s.extraKnownMarketplaces.fixture.source.tag='café';},s=>{s.extraKnownMarketplaces.fixture.source.tag='café';});assert.throws(f.plan,REMEDY);});
test('B-326 (round 19) E8c: control, unchanged incident shape with the NFC field plans',f=>{
 incident(f,s=>{s.extraKnownMarketplaces.fixture.source.tag='café';},s=>{});assert.ok(f.plan().jobs.length);});
test('B-326 (round 19) E9: an array inside the owned source with a duplicate dropped mid-run refuses (incident shape)',f=>{
 incident(f,s=>{s.extraKnownMarketplaces.fixture.source.list=['x','x'];},s=>{s.extraKnownMarketplaces.fixture.source.list=['x'];});assert.throws(f.plan,REMEDY);});
test('B-326 (round 19) E10: an object enabledPlugins value changed mid-run refuses (incident shape)',f=>{
 incident(f,s=>{s.enabledPlugins[f.id]={a:1};},s=>{s.enabledPlugins[f.id]={a:2};});assert.throws(f.plan,REMEDY);});
test('B-326 (round 19) E9c: control, unchanged duplicate array plans',f=>{incident(f,s=>{s.extraKnownMarketplaces.fixture.source.list=['x','x'];},s=>{});assert.ok(f.plan().jobs.length);});
test('B-326 (round 19) E10c: control, unchanged object value plans',f=>{incident(f,s=>{s.enabledPlugins[f.id]={a:1};},s=>{});assert.ok(f.plan().jobs.length);});
// A seeded walk over perturbations of the owned keys, judged by an independent oracle: the run
// plans exactly when every owned value, read by its exact key, is the same JSON once object keys
// are sorted. One wedged receipt; each step rewrites the live settings only.
test('B-326: seeded perturbations of owned keys agree with an exact-comparison oracle',f=>{
 const r=wedge(f);const rec=JSON.parse(fs.readFileSync(latestOf(r)));
 const first=JSON.parse(fs.readFileSync(settingsCopy(rec).path)),id=f.id,mk='fixture';
 const canon=v=>JSON.stringify(v,(k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(n=>[n,x[n]])):x);
 const own=d=>{const h=(m,k)=>m&&typeof m==='object'&&!Array.isArray(m)&&Object.prototype.hasOwnProperty.call(m,k)?['set',m[k]]:['absent'];
  const em=d&&d.extraKnownMarketplaces;return canon([h(d&&d.enabledPlugins,id),h(em&&typeof em==='object'&&!Array.isArray(em)?em[mk]:null,'source')]);};
 let seed=326;const rnd=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed>>>8)%n;};
 const ops=[
  d=>{const v=d.enabledPlugins[id];delete d.enabledPlugins[id];d.enabledPlugins[id.toUpperCase()]=v;},
  d=>{const v=d.enabledPlugins[id];delete d.enabledPlugins[id];d.enabledPlugins[id+' ']=v;},
  d=>{const v=d.extraKnownMarketplaces[mk];delete d.extraKnownMarketplaces[mk];d.extraKnownMarketplaces['Fixture']=v;},
  d=>{const v=d.extraKnownMarketplaces[mk];delete d.extraKnownMarketplaces[mk];d.extraKnownMarketplaces[' '+mk]=v;},
  d=>{d.extraKnownMarketplaces[mk].source.ref=null;},
  d=>{d.extraKnownMarketplaces[mk].source.opts={};},
  d=>{d.extraKnownMarketplaces[mk].source.list=[1,2];},
  d=>{d.extraKnownMarketplaces[mk].source.list=[2,1];},
  d=>{d.extraKnownMarketplaces[mk].source.tag='\u00e9';},
  d=>{d.extraKnownMarketplaces[mk].source.tag='e\u0301';},
  d=>{d.extraKnownMarketplaces[mk].source.path=d.extraKnownMarketplaces[mk].source.path+'/';},
  d=>{d.extraKnownMarketplaces[mk].source.path=d.extraKnownMarketplaces[mk].source.path.toUpperCase();},
  d=>{d.extraKnownMarketplaces[mk].source=Object.fromEntries(Object.entries(d.extraKnownMarketplaces[mk].source).reverse());},
  d=>{d.enabledPlugins[id]=!d.enabledPlugins[id];},
  d=>{d.enabledPlugins[id]=String(d.enabledPlugins[id]);},
  d=>{d.enabledPlugins[id]={on:d.enabledPlugins[id]};},
  d=>{d.enabledPlugins[id]=null;},
  d=>{delete d.enabledPlugins[id];},
  d=>{delete d.enabledPlugins;},
  d=>{delete d.extraKnownMarketplaces;},
  d=>{for(const k of Object.keys(d))delete d[k];},
  d=>{d.cleanupPeriodDays=(d.cleanupPeriodDays||0)+1;},
  d=>{d.pluginConfigs={[id]:{}};},
  d=>{d.extraKnownMarketplaces[mk].autoUpdate=true;},
  d=>{d.extraKnownMarketplaces[mk].source.flag=false;},
  d=>{d.extraKnownMarketplaces[mk].source.list=[];},
  d=>{d.extraKnownMarketplaces[mk].source.ref='';},
  d=>{const o=d.extraKnownMarketplaces[mk].source;o.Path=o.path;delete o.path;},
  d=>{const o=d.extraKnownMarketplaces[mk].source;o['path ']=o.path;delete o.path;},
  d=>{const o=d.extraKnownMarketplaces[mk].source;if(Array.isArray(o.list))o.list=Object.fromEntries(o.list.map((v,i)=>[String(i),v]));},
  d=>{d.extraKnownMarketplaces[mk].source.opts={a:{b:1}};},
  d=>{const o=d.extraKnownMarketplaces[mk].source;if(o.opts&&o.opts.a)o.opts={a:{B:1}};},
  d=>{const o=d.extraKnownMarketplaces[mk].source;o.ref=(typeof o.ref==='string'?o.ref:'x')+' ';},
  d=>{d.extraKnownMarketplaces[mk].source.ref='x';},
  d=>{d.extraKnownMarketplaces[mk].source.n=1;},
  d=>{d.extraKnownMarketplaces[mk].source.n=1.4;},
  d=>{d.extraKnownMarketplaces[mk].source.n=-1;},
  d=>{d.extraKnownMarketplaces[mk].source.n=1.0000001;},
 ];
 const wrong=[];let plans=0,refusals=0;
 for(let i=0;i<300;i++){
  const d=JSON.parse(JSON.stringify(first));const used=[];
  for(let k=1+rnd(3);k>0;k--){const o=rnd(ops.length);try{ops[o](d);used.push(o);}catch(_){}}
  fs.writeFileSync(f.sf,JSON.stringify(d));
  const want=own(d)===own(first)?'plan':'refuse';let got;
  try{f.plan();got='plan';}catch(e){if(!REMEDY.test(e.message))throw e;got='refuse';}
  if(got==='plan')plans++;else refusals++;
  if(got!==want)wrong.push(used.join(',')+': want '+want+', got '+got);
 }
 assert.deepEqual(wrong,[]);assert(plans>10&&refusals>50,'both outcomes sampled: '+plans+'/'+refusals);
});
// Stale state is still state: a lock a day old, and a running journal whose process is gone
// and which started a day ago, both refuse until the operator clears them.
test('B-326: a lock from 1970 still refuses, naming the lock',f=>{
 const r=wedge(f);const lock=path.join(path.dirname(latestOf(r)),'lock');fs.mkdirSync(lock);
 const old=new Date(0);fs.utimesSync(lock,old,old);assert.throws(f.plan,/lock directory .*remove it/);
});
test('B-326: a running journal from a dead process in 1970 still refuses',f=>{
 const r=wedge(f);const gone=require('child_process').spawnSync(process.execPath,['-e','0']).pid;
 edit(r,rec=>{rec.status='running';rec.pid=gone;rec.startedAt=new Date(0).toISOString();});assert.throws(f.plan,/in progress or interrupted/);
});
test('B-326: every member verified, then a foreign write before the final check, owned keys untouched, plans',f=>{
 assert(f.execute().ok);
 const A=require('../lib/apply'),old=A.protect;let armed=false,fired=false;
 f.setHook(a=>{if(a[1]==='marketplace')armed=true;return null;});
 A.protect=(file,o)=>{if(armed&&!fired&&file.endsWith('receipt.json')){fired=true;
   const s=JSON.parse(fs.readFileSync(f.sf));s.cleanupPeriodDays=14;fs.writeFileSync(f.sf,JSON.stringify(s));
   const g=JSON.parse(fs.readFileSync(f.rf));g.plugins['other@else']=[{scope:'user',version:'1',installPath:'/x'}];fs.writeFileSync(f.rf,JSON.stringify(g));}
  return old(file,o);};
 let r;try{r=f.execute();}finally{A.protect=old;f.setHook(null);}
 assert(!r.ok);const rec=JSON.parse(fs.readFileSync(r.receipt));
 assert(rec.results.length&&rec.results.every(x=>x.status==='verified'));assert.equal(rec.settingsRestored,false);assert(!rec.uncertain);
 assert.equal(f.plan().jobs[0].action,'verify');
});
test('B-326: a settings copy deleted by hand refuses, even with no owned key now',f=>{
 const r=wedge(f);const rec=JSON.parse(fs.readFileSync(latestOf(r)));fs.rmSync(settingsCopy(rec).path);
 const s=JSON.parse(fs.readFileSync(f.sf));delete s.enabledPlugins[f.id];delete s.extraKnownMarketplaces;fs.writeFileSync(f.sf,JSON.stringify(s));assert.throws(f.plan,REMEDY);
});
test('B-326 (round 22) P1 nested false added to owned source',f=>{wedge(f,s=>{s.extraKnownMarketplaces.fixture.source.flag=false;});assert.throws(f.plan,REMEDY);});
test('B-326 (round 22) P2 nested empty array added to owned source',f=>{wedge(f,s=>{s.extraKnownMarketplaces.fixture.source.list=[];});assert.throws(f.plan,REMEDY);});
test('B-326 (round 22) P3 nested empty string added to owned source',f=>{wedge(f,s=>{s.extraKnownMarketplaces.fixture.source.ref='';});assert.throws(f.plan,REMEDY);});
test('B-326 (round 22) P4 owned source key path re-cased Path',f=>{wedge(f,s=>{const o=s.extraKnownMarketplaces.fixture.source;o.Path=o.path;delete o.path;});assert.throws(f.plan,REMEDY);});
test('B-326 (round 22) P5 owned source key path with trailing space',f=>{wedge(f,s=>{const o=s.extraKnownMarketplaces.fixture.source;o['path ']=o.path;delete o.path;});assert.throws(f.plan,REMEDY);});
test('B-326 (round 22) P6 owned source array became index object (incident shape)',f=>{incident(f,s=>{s.extraKnownMarketplaces.fixture.source.list=['a'];},s=>{s.extraKnownMarketplaces.fixture.source.list={'0':'a'};});assert.throws(f.plan,REMEDY);});
test('B-326 (round 22) P0 control: foreign write only plans',f=>{wedge(f);assert.equal(f.plan().jobs[0].action,'verify');});
test('B-326 (round 22) P4b owned source extra key ref re-cased Ref (incident shape)',f=>{incident(f,s=>{s.extraKnownMarketplaces.fixture.source.ref='x';},s=>{const o=s.extraKnownMarketplaces.fixture.source;o.Ref=o.ref;delete o.ref;});assert.throws(f.plan,REMEDY);});
test('B-326 (round 22) P5b owned source extra key ref gains a trailing space (incident shape)',f=>{incident(f,s=>{s.extraKnownMarketplaces.fixture.source.ref='x';},s=>{const o=s.extraKnownMarketplaces.fixture.source;o['ref ']=o.ref;delete o.ref;});assert.throws(f.plan,REMEDY);});
// Owned keys are looked up by their exact name: a mixed-case id, as the validator admits.
FIXTURE_ID='Probe@Fixture';
test('B-326: a mixed-case id with only a foreign write plans',f=>{wedge(f);assert.equal(f.plan().jobs[0].action,'verify');});
test('B-326: a mixed-case id whose owned entry toggled refuses',f=>{wedge(f,s=>{s.enabledPlugins['Probe@Fixture']=true;});assert.throws(f.plan,REMEDY);});
test('B-326: a mixed-case id whose owned source moved refuses',f=>{wedge(f,s=>{s.extraKnownMarketplaces.Fixture.source={source:'github',repo:'o/r'};});assert.throws(f.plan,REMEDY);});
FIXTURE_ID='probe@fixture';
test('B-326: an owned string value that gained surrounding whitespace refuses (incident shape)',f=>{
 incident(f,s=>{s.extraKnownMarketplaces.fixture.source.ref='x';},s=>{s.extraKnownMarketplaces.fixture.source.ref='x ';});assert.throws(f.plan,REMEDY);
});
// Numbers inside an owned value compare by value: 1.0 and 1 agree, 1 and 1.4, 1.0000001 or -1 do not.
for(const [first,now,want] of [[1,1.4,'refuse'],[1,1.0000001,'refuse'],[-1,1,'refuse'],[0.5,0.25,'refuse'],[1.0,1,'plan'],[2.5,2.5,'plan']])
 test('B-326: an owned number '+first+' then '+now+' '+(want==='plan'?'plans':'refuses')+' (incident shape)',f=>{
  incident(f,s=>{s.extraKnownMarketplaces.fixture.source.n=first;},s=>{s.extraKnownMarketplaces.fixture.source.n=now;});
  if(want==='plan')assert.equal(f.plan().jobs[0].action,'verify');else assert.throws(f.plan,REMEDY);
 });
test('B-326: an owned number written 1.0 in the first copy and 1 now plans (raw spelling)',f=>{
 const r=incident(f,s=>{s.extraKnownMarketplaces.fixture.source.n=1;},s=>{});
 const rec=JSON.parse(fs.readFileSync(latestOf(r)));const b=settingsCopy(rec).path;
 fs.writeFileSync(b,fs.readFileSync(b,'utf8').replace(/"n":\s*1(?![0-9.])/,'"n":1.0'));assert.match(fs.readFileSync(b,'utf8'),/"n":1\.0/);
 assert.equal(f.plan().jobs[0].action,'verify');
});
// Every pair from a pool of near-collisions, set on both sides (first copy and live file), at the
// top of an owned value and one level down: the run plans exactly when the two are the same JSON.
// A comparison that maps two distinct leaves to one (absence, type, whitespace, Unicode, case,
// rounding) disagrees with this oracle on at least one pair.
test('B-326: every pair of near-colliding leaf values, both sides set, compares exactly',f=>{
 const r=wedge(f);const rec=JSON.parse(fs.readFileSync(latestOf(r)));const b=settingsCopy(rec).path;
 const base=JSON.parse(fs.readFileSync(f.sf));
 const pool=['',' ','  ','x','x ',' x','X','a b','a  b','a\tb','a\nb','\u00e9','e\u0301','\ud800','\ufffd','0','1','true','null',
  'a\u200b','\ufeffa','x\n','\u00e9\u00e9','e\u0301e\u0301',
  null,true,false,0,1,-1,2,0.5,1.1,Math.fround(1.1),1.000000000001,1.00000001,0.30000000000000004,0.3,1e21,[],{},[1],[[1]],[1,2],[2,1],{a:1},{a:null},{a:[]},{'\u00e9':1},{'e\u0301':1},
  // JSON.parse keeps "__proto__" as an own member, as the settings file is read; a literal would set the prototype.
  JSON.parse('{"__proto__":1}'),JSON.parse('{"__proto__":{"a":1}}'),JSON.parse('{"__proto__":{"a":2}}')];
 const put=(d,depth,v)=>{const src={...base.extraKnownMarketplaces.fixture.source};if(depth===0)src.k=v;else src.k={i:v};d.extraKnownMarketplaces.fixture.source=src;};
 const verdict=()=>{try{f.plan();return 'plan';}catch(e){if(!REMEDY.test(e.message))throw e;return 'refuse';}};
 const wrong=[];let plans=0,refusals=0;
 for(const depth of [0,1])for(let i=0;i<pool.length;i++)for(let j=0;j<pool.length;j++){
  const before=JSON.parse(JSON.stringify(base)),now=JSON.parse(JSON.stringify(base));put(before,depth,pool[i]);put(now,depth,pool[j]);
  fs.writeFileSync(b,JSON.stringify(before));fs.writeFileSync(f.sf,JSON.stringify(now));
  const want=JSON.stringify(pool[i])===JSON.stringify(pool[j])?'plan':'refuse',got=verdict();
  if(got==='plan')plans++;else refusals++;
  if(got!==want)wrong.push('depth '+depth+': '+JSON.stringify(pool[i])+' vs '+JSON.stringify(pool[j])+': '+got);
 }
 assert.deepEqual(wrong,[]);assert(plans>=pool.length&&refusals>pool.length*pool.length,'both outcomes sampled');
});
const R27src=(s,k,v)=>{s.extraKnownMarketplaces.fixture.source[k]=v;};
test('B-326 (round 27) an owned array reordered by a foreign writer refuses (incident shape)',f=>{incident(f,s=>R27src(s,'list',[1,2]),s=>R27src(s,'list',[2,1]));assert.throws(f.plan,REMEDY);});
test('B-326 (round 27) an owned number 0.30000000000000004 then 0.3 refuses (incident shape)',f=>{incident(f,s=>R27src(s,'n',0.30000000000000004),s=>R27src(s,'n',0.3));assert.throws(f.plan,REMEDY);});
test('B-326 (round 27) an owned string that lost a zero-width space refuses (incident shape)',f=>{incident(f,s=>R27src(s,'ref','a\u200b'),s=>R27src(s,'ref','a'));assert.throws(f.plan,REMEDY);});
test('B-326 (round 27) an owned key re-saved NFD refuses (incident shape)',f=>{incident(f,s=>R27src(s,'\u00e9',1),s=>{delete s.extraKnownMarketplaces.fixture.source['\u00e9'];R27src(s,'e\u0301',1);});assert.throws(f.plan,REMEDY);});
test('B-326 (round 27) a lock from 1970 still refuses beside a settled failure',f=>{const r=wedge(f);const lock=path.join(path.dirname(latestOf(r)),'lock');fs.mkdirSync(lock);fs.utimesSync(lock,new Date(0),new Date(0));assert.throws(f.plan,/lock directory/);});
test('B-326 (round 27) a running journal from 1970 still refuses beside a settled failure',f=>{const r=wedge(f);edit(r,rec=>{rec.status='running';rec.startedAt=new Date(0).toISOString();});assert.throws(f.plan,/in progress or interrupted/);});
test('B-326 (round 27) control: incident shape with identical owned array plans',f=>{incident(f,s=>R27src(s,'list',[1,2]),s=>{});assert.equal(f.plan().jobs[0].action,'verify');});
// Strings, by construction: seeds passed through every normaliser a comparison might apply. Any
// two distinct results must not compare equal, as values or as keys of an owned object.
test('B-326: strings that differ only under a normaliser never compare equal, as values or keys',f=>{
 const r=wedge(f);const rec=JSON.parse(fs.readFileSync(latestOf(r)));const b=settingsCopy(rec).path;
 const base=JSON.parse(fs.readFileSync(f.sf));
 const seeds=['a b','a\u00a0b','a\tb','a  b',' a','a ','x\r\ny','x\ny','x\u2028y','x\u2029y','x\u0085y','\uff21','A','a','\ufb01','fi',
  '\u00c9','\u00e9','E\u0301','e\u0301','\u0130','\u0131','i','I','\u00df','ss','a\u200bb','\ufeffa','\u2126','\u03a9','\u212b','\u00c5','__proto__'];
 const norms=[x=>x,x=>x.normalize('NFC'),x=>x.normalize('NFD'),x=>x.normalize('NFKC'),x=>x.normalize('NFKD'),x=>x.toLowerCase(),x=>x.toUpperCase(),
  x=>x.trim(),x=>x.replace(/\s+/g,' '),x=>x.replace(/\r\n/g,'\n'),x=>x.replace(/[\u2028\u2029\u0085]/g,'\n'),x=>x.replace(/[\u200b\ufeff]/g,'')];
 const pool=[...new Set(seeds.flatMap(x=>norms.map(n=>n(x))))];
 const put=(d,asKey,v)=>{const src={...base.extraKnownMarketplaces.fixture.source};if(asKey)src.k={[v]:1};else src.k=v;d.extraKnownMarketplaces.fixture.source=src;};
 const verdict=()=>{try{f.plan();return 'plan';}catch(e){if(!REMEDY.test(e.message))throw e;return 'refuse';}};
 const wrong=[];
 for(const asKey of [false,true])for(const x of pool)for(const y of pool){
  const before=JSON.parse(JSON.stringify(base)),now=JSON.parse(JSON.stringify(base));put(before,asKey,x);put(now,asKey,y);
  fs.writeFileSync(b,JSON.stringify(before));fs.writeFileSync(f.sf,JSON.stringify(now));
  const want=x===y?'plan':'refuse',got=verdict();if(got!==want)wrong.push((asKey?'key ':'value ')+JSON.stringify(x)+' vs '+JSON.stringify(y)+': '+got);
 }
 assert.deepEqual(wrong,[]);assert(pool.length>=40,'pool of '+pool.length);
});
test('B-326: a marketplaces map that appears mid-run, empty, is not owned and plans',f=>{
 incident(f,s=>{delete s.extraKnownMarketplaces;},s=>{s.extraKnownMarketplaces={};});assert.equal(f.plan().jobs[0].action,'verify');
});
test('B-326: a marketplaces map that appears mid-run with another marketplace is not owned and plans',f=>{
 incident(f,s=>{delete s.extraKnownMarketplaces;},s=>{s.extraKnownMarketplaces={other:{source:{source:'github',repo:'x/y'}}};});assert.equal(f.plan().jobs[0].action,'verify');
});
test('B-326: a run that failed writing its recovery plan refuses while an owned key differs',f=>{
 assert(f.execute().ok);
 const A=require('../lib/apply'),old=A.protect;let n=0;
 A.protect=(file,o)=>{if(file.endsWith('plan.json'))return {action:'backup-failed',file};const r=old(file,o);
  if(++n===3){const s=JSON.parse(fs.readFileSync(f.sf));s.env.KEEP='concurrent';s.enabledPlugins[f.id]=!s.enabledPlugins[f.id];fs.writeFileSync(f.sf,JSON.stringify(s));}return r;};
 let r;try{r=f.execute();}finally{A.protect=old;}
 assert(!r.ok);const rec=JSON.parse(fs.readFileSync(r.receipt));assert.equal(rec.settingsRestored,false);assert(!fs.existsSync(rec.recoveryPlan),'the plan file was written');
 assert(Array.isArray(rec.backups)&&settingsCopy(rec));assert.throws(f.plan,REMEDY);
});
console.log(`PASS: Claude native transaction — ${count} cases`);
