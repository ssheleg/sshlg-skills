#!/usr/bin/env node
'use strict';
// Policy admission is independent from router consent; all homes are synthetic.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const W = require('../lib/wait-rule-policy.js');
let checks = 0, failed = 0;
function check(name, fn) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-wait-policy-'));
  try { fn(home); checks++; console.log('ok ' + name); }
  catch (e) { failed++; console.error('FAIL ' + name + ': ' + e.message); }
  finally { fs.rmSync(home, {recursive: true, force: true}); }
}
function file(home, text) {
  const f = path.join(home, '.sshlg-skills', 'config.json');
  fs.mkdirSync(path.dirname(f), {recursive:true}); fs.writeFileSync(f, text); return f;
}
function cli(home, args) {
  return cp.spawnSync(process.execPath, [path.resolve(__dirname, '../bin/sshlg-skills.js'), 'config', ...args], {env:{...process.env, HOME:home}, encoding:'utf8', timeout:10000});
}
check('absent policy is off without creating files', home => {
  assert.equal(W.read(home).enabled, false); assert.deepEqual(fs.readdirSync(home), []);
});
check('router consent does not enable wait', home => {
  file(home, '{"consent":"yes","routers":{"wait":"on"}}'); assert.equal(W.read(home).enabled, false);
});
check('explicit on persists and explicit off remains explicit', home => {
  W.set(home, 'on'); assert.equal(W.read(home).enabled, true); W.set(home,'off');
  assert.equal(W.read(home).enabled, false); assert.equal(W.read(home).data.rules.wait,'off');
});
check('foreign lexemes and whitespace survive both state edits', home => {
  const initial = '{\r\n "foreign": [9007199254740993,1e+04,"\\u0061"], "rules" : { "else" : true, "wait" : "off" }\r\n}\r\n';
  const f=file(home,initial); W.set(home,'on');
  assert.equal(fs.readFileSync(f,'utf8'),initial.replace('"off"','"on"')); W.set(home,'off'); assert.equal(fs.readFileSync(f,'utf8'),initial);
});
check('same setting is a byte-identical no-op', home => {
  const f=file(home,'{ "rules" : { "wait" : "on" } }\n'); const stat=fs.statSync(f); W.set(home,'on'); assert.equal(fs.statSync(f).mtimeMs,stat.mtimeMs);
});
for (const raw of ['{oops','[]','null','{"rules":[]}','{"rules":{"wait":true}}','{"rules":{"wait":"ON"}}','{"rules":{},"ru\\u006ces":{}}']) {
  check('unknown/corrupt policy refuses reads and writes: '+raw, home => {
    const f=file(home,raw); assert.throws(()=>W.read(home)); assert.throws(()=>W.set(home,'on')); assert.equal(fs.readFileSync(f,'utf8'),raw);
  });
}
check('invalid UTF-8 policy refuses before lock, backup or replacement', home => {
 const f=file(home,'{}'),bytes=Buffer.concat([Buffer.from('{"foreign":"'),Buffer.from([255]),Buffer.from('"}')]);fs.writeFileSync(f,bytes);
 assert.throws(()=>W.set(home,'on'),/UTF-8/);assert(fs.readFileSync(f).equals(bytes));assert.deepEqual(fs.readdirSync(path.dirname(f)),['config.json']);
});
check('leaf symlink policy is refused without touching its target', home => {
  const target=path.join(home,'foreign'); fs.writeFileSync(target,'{}'); const f=file(home,'{}'); fs.unlinkSync(f);fs.symlinkSync(target,f);
  assert.throws(()=>W.set(home,'on'));assert.equal(fs.readFileSync(target,'utf8'),'{}');assert.ok(fs.lstatSync(f).isSymbolicLink());
});
check('held policy lock refuses rather than overwrites', home => {
  const f=file(home,'{}');fs.writeFileSync(f+'.lock','foreign owner');assert.throws(()=>W.set(home,'on'));assert.equal(fs.readFileSync(f,'utf8'),'{}');assert.equal(fs.readFileSync(f+'.lock','utf8'),'foreign owner');
});
check('backup failure prevents policy mutation', home => {
  const f=file(home,'{}');fs.writeFileSync(path.join(home,'.sshlg-skills','backups'),'occupied');assert.throws(()=>W.set(home,'on'));assert.equal(fs.readFileSync(f,'utf8'),'{}');
});
check('successful change preserves mode and makes exact backup', home => {
  const f=file(home,'{ "foreign": true }');fs.chmodSync(f,0o640);W.set(home,'on');assert.equal(fs.statSync(f).mode&0o777,0o640);
  const dir=path.join(home,'.sshlg-skills','backups');assert.ok(fs.readdirSync(dir).some(n=>fs.readFileSync(path.join(dir,n),'utf8')==='{ "foreign": true }'));
});
check('short temporary write refuses without replacing current policy', home => {
  const f=file(home,'{ "foreign": 9007199254740993 }');const write=fs.writeFileSync;
  fs.writeFileSync=function(target,data,...args){return write.call(this,target,typeof target==='number'?String(data).slice(0,2):data,...args);};
  try{assert.throws(()=>W.set(home,'on'),/incomplete/);}finally{fs.writeFileSync=write;}
  assert.equal(fs.readFileSync(f,'utf8'),'{ "foreign": 9007199254740993 }');
});
check('rename failure refuses and cleans only its temporary file and lock', home => {
  const f=file(home,'{}');const rename=fs.renameSync;fs.renameSync=()=>{throw Error('injected rename');};
  try{assert.throws(()=>W.set(home,'on'),/injected rename/);}finally{fs.renameSync=rename;}
  assert.equal(fs.readFileSync(f,'utf8'),'{}');assert(!fs.readdirSync(path.dirname(f)).some(n=>n.endsWith('.tmp')||n.endsWith('.lock')));
});
check('foreign edit after backup is preserved instead of overwritten', home => {
  const f=file(home,'{ "foreign": 9007199254740993 }');const A=require('../lib/apply.js'),protect=A.protect;
  A.protect=(target,o)=>{const saved=protect(target,o);if(target===f)fs.writeFileSync(f,'{ "foreign": 9007199254740994 }');return saved;};
  try{assert.throws(()=>W.set(home,'on'),/changed before replacement/);}finally{A.protect=protect;}
  assert.equal(fs.readFileSync(f,'utf8'),'{ "foreign": 9007199254740994 }');
});
check('canonical CLI records opt-in without applying host text', home => {
  fs.mkdirSync(path.join(home,'.codex'));const r=cli(home,['set','rules.wait','on']);assert.equal(r.status,0,r.stderr+r.stdout);assert.equal(W.read(home).enabled,true);assert.deepEqual(fs.readdirSync(path.join(home,'.codex')),[]);
});
for (const args of [['rules.wait','on'],['set','rules.wait'],['set','rules.wait','yes'],['set','rules.wait','on','extra']]) {
  check('malformed CLI refuses without writes: '+args.join(' '), home => {const r=cli(home,args);assert.equal(r.status,2);assert.deepEqual(fs.readdirSync(home),[]);});
}
console.log(`${failed?'FAIL':'OK'} (${checks} checks; ${failed} failed)`);process.exitCode=failed?1:0;
