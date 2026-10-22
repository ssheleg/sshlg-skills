'use strict';
const assert=require('assert');
const C=require('../lib/claude-plugin-source');
const m={name:'fixture',repo:'o/r',commit:'a'.repeat(40),version:'1.0.0',pluginInstall:'probe@fixture'};
const manifest={name:'fixture',owner:{name:'Owner'},plugins:[{name:'probe',source:'./plugins/other-name'}]};
assert.equal(C.pluginPath(m,manifest),'plugins/other-name');
for(const source of ['../outside','./../outside','./plugins/../other','./plugins\\bad',{source:'github',repo:'other/repo'}]) {
 assert.throws(()=>C.pluginPath(m,{...manifest,plugins:[{name:'probe',source}]}));
}
assert.throws(()=>C.pluginPath(m,{...manifest,name:'foreign'}));
assert.throws(()=>C.pluginPath(m,{...manifest,plugins:[]}));
assert.throws(()=>C.pluginPath(m,{...manifest,plugins:[...manifest.plugins,...manifest.plugins]}));
console.log('PASS: Claude immutable source admission — 9 controls');
const fs=require('fs'),os=require('os'),path=require('path'),{spawnSync}=require('child_process');
const box=fs.mkdtempSync(path.join(os.tmpdir(),'claude-source-unit-'));
try {
 const repo=path.join(box,'repo');fs.mkdirSync(repo);
 function git(...args){const r=spawnSync('git',['-C',repo,...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
 git('init','-q');git('config','user.email','fixture@example.invalid');git('config','user.name','Fixture');
 fs.mkdirSync(path.join(repo,'.claude-plugin'));fs.writeFileSync(path.join(repo,'.claude-plugin/marketplace.json'),JSON.stringify(manifest));
 const plugin=path.join(repo,'plugins/other-name');fs.mkdirSync(path.join(plugin,'.claude-plugin'),{recursive:true});
 fs.writeFileSync(path.join(plugin,'.claude-plugin/plugin.json'),JSON.stringify({name:'probe',version:'1.0.0'}));
 fs.writeFileSync(path.join(plugin,'payload.txt'),'pinned bytes');git('add','.');git('commit','-qm','fixture');
 const member={...m,dir:'repo',commit:git('rev-parse','HEAD')};
 const inventory=C.generate([member],box),row=C.validate(inventory,[member])[0];
 assert.equal(row.pluginPath,'plugins/other-name');assert.equal(C.catalog(row).plugins[0].source.sha,member.commit);
 assert.equal(C.verifyPayload(plugin,row),2);
 fs.mkdirSync(path.join(plugin,'.in_use'));fs.writeFileSync(path.join(plugin,'.in_use/1234'),'runtime');assert.equal(C.verifyPayload(plugin,row),2);
 fs.writeFileSync(path.join(plugin,'.in_use/extra'),'bad');assert.throws(()=>C.verifyPayload(plugin,row),/lease-marker/);fs.unlinkSync(path.join(plugin,'.in_use/extra'));
 // B-245: a Claude process that died while writing its marker leaves `<pid>.tmp.<hex>`.
 // A dead writer's temp file is residue; a live writer's is a marker in flight and refuses.
 const dead=spawnSync(process.execPath,['-e','']).pid;
 fs.writeFileSync(path.join(plugin,`.in_use/${dead}.tmp.1a2b3c`),'');assert.equal(C.verifyPayload(plugin,row),2,'a dead writer\'s temp marker is residue');
 fs.writeFileSync(path.join(plugin,`.in_use/${process.pid}.tmp.4d5e6f`),'');assert.throws(()=>C.verifyPayload(plugin,row),/lease marker in flight.*pid \d+/);fs.unlinkSync(path.join(plugin,`.in_use/${process.pid}.tmp.4d5e6f`));
 fs.writeFileSync(path.join(plugin,`.in_use/${dead}.tmp.`),'');assert.throws(()=>C.verifyPayload(plugin,row),/lease-marker shape/,'a temp name without its suffix is not the writer\'s shape');fs.unlinkSync(path.join(plugin,`.in_use/${dead}.tmp.`));
 fs.mkdirSync(path.join(plugin,`.in_use/${dead}.tmp.abc`+'d'));assert.throws(()=>C.verifyPayload(plugin,row),/lease-marker shape/,'a directory is never a marker');fs.rmdirSync(path.join(plugin,`.in_use/${dead}.tmp.abcd`));
 fs.unlinkSync(path.join(plugin,`.in_use/${dead}.tmp.1a2b3c`));
 // Python bytecode caches written by running hooks are runtime artifacts, not payload.
 // A cache for a pinned source is ignored; an orphan or shadowing .pyc is not.
 fs.mkdirSync(path.join(plugin,'__pycache__'),{recursive:true});fs.writeFileSync(path.join(plugin,'__pycache__/payload.cpython-314.pyc'),'bytecode');
 const pinnedTxt=new Set(['payload.txt']);assert.throws(()=>C.snapshotPayload(plugin,pinnedTxt),/bytecode-cache shape/);
 assert.ok(!C.snapshotPayload(plugin,new Set(['payload.py'])).some(f=>f.path.includes('__pycache__')));
 assert.throws(()=>C.verifyPayload(plugin,row),/bytecode-cache shape/,'orphan .pyc with no pinned source refuses');
 fs.writeFileSync(path.join(plugin,'__pycache__/payload.cpython-314.opt-1.pyc'),'optimised');assert.ok(!C.snapshotPayload(plugin,new Set(['payload.py'])).some(f=>f.path.includes('__pycache__')),'optimised bytecode for a pinned source is ignored');
 // A payload being replaced keeps caches for its own sources, not the new pin's.
 assert.throws(()=>C.snapshotPayload(plugin,'present'),/bytecode-cache shape/);fs.writeFileSync(path.join(plugin,'payload.py'),'old source');assert.ok(C.snapshotPayload(plugin,'present').some(f=>f.path==='payload.py'));fs.unlinkSync(path.join(plugin,'payload.py'));
 fs.writeFileSync(path.join(plugin,'__pycache__/notes.txt'),'not bytecode');assert.throws(()=>C.snapshotPayload(plugin,new Set(['payload.py'])),/bytecode-cache shape/);fs.rmSync(path.join(plugin,'__pycache__'),{recursive:true});
 fs.writeFileSync(path.join(plugin,'unexpected.txt'),'extra');assert.throws(()=>C.verifyPayload(plugin,row),/inventory differs/);fs.unlinkSync(path.join(plugin,'unexpected.txt'));
 fs.writeFileSync(path.join(plugin,'payload.txt'),'drift');assert.throws(()=>C.verifyPayload(plugin,row),/bytes differ/);
 assert.throws(()=>C.validate(inventory,[{...member,commit:'b'.repeat(40)}]),/differs/);
 assert.throws(()=>C.validate({...inventory,members:[row,row]},[member]),/duplicate/);
 assert.throws(()=>C.generate([{...member,version:'2.0.0'}],box),/identity\/version/);
 const invalid=JSON.parse(JSON.stringify(inventory));invalid.members[0].files[0].path='../escape';assert.throws(()=>C.validate(invalid,[member]),/payload inventory/);
 console.log('PASS: Claude source generation/readback — 21 controls');
} finally {fs.rmSync(box,{recursive:true,force:true});}
