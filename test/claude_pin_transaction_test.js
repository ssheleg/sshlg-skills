'use strict';
const assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path');
const S=require('../lib/claude-plugin-source'),P=require('../lib/claude-pinned'),T=require('../lib/claude-pin-transaction');
let count=0;
function test(name,fn){const box=fs.mkdtempSync(path.join(os.tmpdir(),'claude-transaction-'));try{fn(fixture(box));count++;console.log('ok '+name);}finally{fs.rmSync(box,{recursive:true,force:true});}}
function fixture(box) {
 const home=box+'/home',profile=home+'/.claude',id='probe@fixture',a='a'.repeat(40),b='b'.repeat(40);
 const payload=profile+'/plugins/cache/fixture/probe/1.0.0',sf=profile+'/settings.json',rf=profile+'/plugins/installed_plugins.json';
 const raw=JSON.stringify({name:'probe',version:'1.0.0'}),files={'.claude-plugin/plugin.json':raw,'value.txt':'second'};
 const m={name:'fixture',repo:'o/r',commit:b,version:'1.0.0',pluginInstall:id};
 const row={...m,pluginPath:'plugins/probe',entry:{name:'probe',source:'./plugins/probe'},configSurface:false,files:Object.entries(files).map(([p,v])=>({path:p,bytes:Buffer.byteLength(v),sha256:S.sha256(v)}))};
 const inventory={schema:'claude-plugin-pins/1',members:[row]},opts={home,profileRoot:profile};
 fs.mkdirSync(payload+'/.claude-plugin',{recursive:true});fs.writeFileSync(payload+'/.claude-plugin/plugin.json',raw);fs.writeFileSync(payload+'/value.txt','first');
 const rec={scope:'user',version:'1.0.0',gitCommitSha:a,installPath:payload};fs.writeFileSync(rf,JSON.stringify({version:2,plugins:{[id]:[rec]}}));
 fs.writeFileSync(sf,'{\r\n "huge":1000001.2500, "enabledPlugins":{"probe@fixture":false,"foreign@foreign":false}, "env":{"KEEP":"same"}\r\n}\r\n');
 const calls=[];let hook=null;
 const plan=()=>P.prepare([m],inventory,opts);
 function runner(cmd,args) {
  calls.push(args);
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
 return {box,home,profile,id,a,b,payload,sf,rf,m,row,inventory,opts,calls,plan,runner,setHook:f=>hook=f,execute:()=>T.execute(plan(),[m],inventory,{runner})};
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
console.log(`PASS: Claude native transaction — ${count} cases`);
