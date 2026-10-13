'use strict';
const assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path');
const C=require('../lib/claude-pinned'),S=require('../lib/claude-plugin-source');
let count=0;function test(name,fn){fn();count++;console.log('ok '+name);}
const box=fs.mkdtempSync(path.join(os.tmpdir(),'claude-pinned-unit-'));
try {
 const home=path.join(box,'home'),profile=path.join(home,'.claude'),payload=path.join(profile,'plugins/cache/fixture/probe/1.0.0');fs.mkdirSync(path.join(payload,'.claude-plugin'),{recursive:true});
 const m={name:'fixture',repo:'o/r',commit:'a'.repeat(40),version:'1.0.0',pluginInstall:'probe@fixture'};
 const manifest={name:'probe',version:'1.0.0'},raw=JSON.stringify(manifest);fs.writeFileSync(path.join(payload,'.claude-plugin/plugin.json'),raw);
 const row={...m,pluginPath:'plugins/probe',entry:{name:'probe',source:'./plugins/probe'},configSurface:false,files:[{path:'.claude-plugin/plugin.json',sha256:S.sha256(raw),bytes:Buffer.byteLength(raw)}]};
 const inv={schema:'claude-plugin-pins/1',members:[row]},opts={home,profileRoot:profile};
 const sf=path.join(profile,'settings.json'),rf=path.join(profile,'plugins/installed_plugins.json'),kf=path.join(profile,'plugins/known_marketplaces.json');
 const rec={scope:'user',version:'1.0.0',gitCommitSha:m.commit,installPath:payload};
 const reset=()=>{fs.writeFileSync(sf,'{ "enabledPlugins": {"probe@fixture":false}, "env": {"FOREIGN":"unchanged"} }\n');fs.writeFileSync(rf,JSON.stringify({version:2,plugins:{[m.pluginInstall]:[rec]}}));fs.writeFileSync(kf,'{}');fs.writeFileSync(path.join(payload,'.claude-plugin/plugin.json'),raw);};
 reset();const prep=()=>C.prepare([m],inv,opts);
 test('exact source is verify only; disabled state preserved in read-only plan',()=>{const before=fs.readFileSync(sf);assert.equal(prep().jobs[0].action,'verify');assert.deepEqual(fs.readFileSync(sf),before);});
 test('same-version wrong source chooses scoped repair',()=>{reset();fs.writeFileSync(rf,JSON.stringify({plugins:{[m.pluginInstall]:[{...rec,gitCommitSha:'b'.repeat(40)}]}}));assert.equal(prep().jobs[0].action,'reinstall');});
 test('different version chooses native update',()=>{reset();fs.writeFileSync(rf,JSON.stringify({plugins:{[m.pluginInstall]:[{...rec,version:'0.9.0',gitCommitSha:'b'.repeat(40)}]}}));assert.equal(prep().jobs[0].action,'update');});
 test('missing record chooses native install',()=>{reset();fs.writeFileSync(rf,'{"plugins":{}}');assert.equal(prep().jobs[0].action,'install');});
 test('project local multi and malformed install records refuse',()=>{for(const records of [[{...rec,scope:'project'}],[{...rec,scope:'local'}],[rec,rec],null,{}]){reset();fs.writeFileSync(rf,JSON.stringify({plugins:{[m.pluginInstall]:records}}));assert.throws(prep,/user-scope/);}});
 test('malformed and duplicate settings refuse without normalization',()=>{for(const raw of ['{broken','{"enabledPlugins":[]}','{"x":1,"x":2}']){reset();fs.writeFileSync(sf,raw);assert.throws(prep);assert.equal(fs.readFileSync(sf,'utf8'),raw);}});
 test('foreign source and sibling installed plugin refuse',()=>{reset();fs.writeFileSync(kf,JSON.stringify({fixture:{source:{source:'github',repo:'foreign/repo'}}}));assert.throws(prep,/conflicting/);reset();fs.writeFileSync(rf,JSON.stringify({plugins:{[m.pluginInstall]:[rec],'foreign@fixture':[rec]}}));assert.throws(prep,/another installed/);});
 test('declared or saved options prevent same-version uninstall',()=>{reset();fs.writeFileSync(path.join(payload,'.claude-plugin/plugin.json'),JSON.stringify({...manifest,userConfig:{}}));assert.throws(prep,/configured plugin/);reset();fs.writeFileSync(sf,JSON.stringify({pluginConfigs:{[m.pluginInstall]:{}}}));fs.writeFileSync(rf,JSON.stringify({plugins:{[m.pluginInstall]:[{...rec,gitCommitSha:'b'.repeat(40)}]}}));assert.throws(prep,/configured plugin/);});
 test('channel and bundled MCP surfaces are detected without saved values',()=>{assert(C.configured({channels:[{userConfig:{}}]}));assert(C.configured({mcpServers:'./bridge.mcpb'}));assert(!C.configured(manifest));});
 test('fingerprint changes on foreign settings edit',()=>{reset();const first=prep().fingerprint;fs.writeFileSync(sf,'{}');assert.notEqual(prep().fingerprint,first);});
 test('lossless nested source edit preserves foreign raw numbers and whitespace',()=>{const before='{\r\n "huge": 100000000000000000000001, "extraKnownMarketplaces": { "fixture": {"autoUpdate":false,"source":{"source":"github","repo":"o/r"}}}}';const next=C.editAt(before,['extraKnownMarketplaces','fixture','source'],{source:'directory',path:'/owned'});assert(next.includes('100000000000000000000001'));assert(next.includes('"autoUpdate":false'));assert(next.startsWith('{\r\n '));assert.equal(JSON.parse(next).extraKnownMarketplaces.fixture.source.path,'/owned');});
 test('insertion supports missing nested maps but rejects nonobject',()=>{assert.equal(JSON.parse(C.editAt('{}',['extraKnownMarketplaces','fixture','source'],{source:'directory',path:'/owned'})).extraKnownMarketplaces.fixture.source.path,'/owned');assert.throws(()=>C.editAt('{"extraKnownMarketplaces":[]}', ['extraKnownMarketplaces','fixture'],{}),/not an object/);});
 console.log('PASS: Claude pinned admission — '+count+' cases');
} finally {fs.rmSync(box,{recursive:true,force:true});}
