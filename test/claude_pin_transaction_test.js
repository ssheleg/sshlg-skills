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
 fs.writeFileSync(sf,'{\r\n "huge":100000000000000000000000001, "enabledPlugins":{"probe@fixture":false,"foreign@foreign":false}, "env":{"KEEP":"same"}\r\n}\r\n');
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
test('same-version repair verifies exact payload and restores raw foreign settings + disabled state',f=>{const r=f.execute();assert(r.ok,JSON.stringify(r));const s=fs.readFileSync(f.sf,'utf8');assert(s.includes('100000000000000000000000001'));assert(s.includes('\r\n'));assert.equal(JSON.parse(s).enabledPlugins[f.id],false);assert.equal(f.plan().jobs[0].action,'verify');assert.equal(r.results[0].files,2);});
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
test('verify-only action performs no uninstall/install/update of plugin',f=>{assert(f.execute().ok);f.calls.length=0;assert(f.execute().ok);assert(!f.calls.some(a=>['uninstall','install','update'].includes(a[1])));});
console.log(`PASS: Claude native transaction — ${count} cases`);
