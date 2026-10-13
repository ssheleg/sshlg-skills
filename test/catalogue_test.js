'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const T = require('../lib/toolkit');
const home = fs.mkdtempSync(path.join(os.tmpdir(), 'catalogue-test-'));
let checks = 0;
function check(name, fn) { fn(); checks++; }
function skill(rel, text) {
  const file = path.join(home, rel, 'SKILL.md');
  fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file,text); return file;
}
try {
  const gem = skill('.gemini/skills/host-only', '---\r\nname: gem-only\r\ndescription: >-\r\n  Nebula calibration\r\n  and measurement.\r\n---\r\n');
  check('hidden host-only skill remains searchable', () => {
    const rows = T.readShared(home, [], {env:{}});
    assert.strictEqual(T.find(rows, 'nebula calibration').rows[0].path, gem);
    assert.strictEqual(rows[0].id, 'gem-only');
  });
  skill('.agents/skills/same', '---\nname: same\ndescription: First variant\n---\n');
  const alt = skill('.codex/skills/same', '---\nname: same\ndescription: Second variant\n---\n');
  check('same name with different content is retained', () => assert.strictEqual(T.readShared(home, [], {env:{}}).filter(s => s.id === 'same').length, 2));
  fs.mkdirSync(path.join(home,'.pi/agent/skills'), {recursive:true});
  fs.symlinkSync(path.dirname(alt), path.join(home,'.pi/agent/skills/same'));
  check('realpath alias appears once', () => assert.strictEqual(T.readShared(home, [], {env:{}}).filter(s=>s.path===alt).length,1));
  check('known exact file is not added again', () => assert.ok(!T.readShared(home,[{id:'same',path:alt}],{env:{}}).some(s=>s.path===alt)));
  const nested = skill('.codex/skills/.system/create', '---\nname: create\ndescription: "Create a skill"\n---\n');
  check('Codex system skills are found', () => assert.ok(T.readShared(home,[],{env:{}}).some(s=>s.path===nested)));
  const moved = skill('custom-gemini/skills/moved', '---\nname: moved\ndescription: |\n  Moved root\n  telescope\n---\n');
  check('documented environment root is respected', () => {
    const rows=T.readShared(home,[],{env:{GEMINI_CONFIG_DIR:path.join(home,'custom-gemini')}});
    assert.ok(rows.some(s=>s.path===moved)); assert.ok(!rows.some(s=>s.path===gem));
  });
  const cached=skill('.codex/plugins/cache/vendor/plugin/1.0/skills/cached','---\nname: cached\ndescription: Cached plugin\n---\n');
  check('native cache is searchable without claiming active listing', () => {
    const row=T.readShared(home,[],{env:{}}).find(s=>s.path===cached); assert.ok(row);
    assert.ok(/cache/.test(T.renderFind(T.find([row],'cached').rows,'cached')));
    assert.ok(!/\blisted\b/.test(T.renderFind(T.find([row],'cached').rows,'cached')));
  });
  fs.symlinkSync(path.join(home,'.agents/skills'),path.join(home,'.agents/skills/loop'));
  check('directory symlink cycles terminate', () => assert.ok(T.readShared(home,[],{env:{}}).length <20));
  const broken=path.join(home,'.agents/skills/broken');fs.symlinkSync('/missing-catalogue-target',broken);
  check('broken symlinks are not presented as usable',()=>assert.ok(!T.readShared(home,[],{env:{}}).some(s=>s.id==='broken')));
  const originalRead=fs.readFileSync;
  fs.readFileSync=function(file,...args){if(file===gem){const e=new Error('fixture denied');e.code='EACCES';throw e;}return originalRead.call(this,file,...args);};
  try {
    check('read failure is explicit and never reported as usable',()=>{
      const rows=T.readShared(home,[],{env:{}});assert.ok(rows.warnings.some(w=>w.includes('EACCES')));
      assert.ok(!rows.some(s=>s.path===gem));
    });
  } finally {fs.readFileSync=originalRead;}
  check('bounded metadata scalar parsing',()=>{
    const parse=require('../lib/catalogue').metadata;
    assert.deepStrictEqual(parse('---\nname: x # note\ndescription: |\n  Telescope\n  focus\n---\n'),{name:'x',description:'Telescope focus'});
    assert.strictEqual(parse("---\nname: x\ndescription: 'It''s a telescope'\n---\n").description,"It's a telescope");
    assert.strictEqual(parse('---\nname: x\ndescription: Hydrogen spectral\n  telescope analysis\n---\n').description,'Hydrogen spectral telescope analysis');
    assert.strictEqual(parse('---\nname: x\ndescription: "Hydrogen spectral\n  telescope analysis"\n---\n').description,'Hydrogen spectral telescope analysis');
  });
  check('identical entries share one ranking slot but retain their paths',()=>{
    const rows=T.find([
      {id:'same',description:'Telescope focus',digest:'abc',path:'/host/a'},
      {id:'same',description:'Telescope focus',digest:'abc',path:'/host/b'},
      {id:'different',description:'Telescope focus',digest:'def',path:'/host/c'},
    ],'telescope focus',2).rows;
    assert.strictEqual(rows.length,2);assert.strictEqual(rows.find(r=>r.id==='same').entryCopies[0].path,'/host/b');
    assert.ok(!T.renderFind(rows,'telescope focus').includes('/host/b'));
    assert.ok(T.renderFind(rows,'telescope focus',2,{showCopies:true}).includes('/host/b'));
  });
  const plain=skill('.claude/skills/line-endings', '---\r\nname: line-endings\r\ndescription: >-\r\n  Hydrogen spectral\r\n  analysis\r\n---\r\n');
  check('Claude known rows retain CRLF descriptions before deduplication',()=>{
    const known=T.readSkills(home), all=known.concat(T.readShared(home,known,{env:{}}));
    assert.strictEqual(T.find(all,'hydrogen spectral').rows[0].path,plain);
  });
  const disabled=skill('custom-plugin/skills/disabled', '---\nname: disabled\ndescription: Dormant optical research\n---\n');
  fs.mkdirSync(path.join(home,'.claude/plugins'),{recursive:true});
  fs.writeFileSync(path.join(home,'.claude/settings.json'),JSON.stringify({enabledPlugins:{'foreign@vendor':false}}));
  const registry=path.join(home,'.claude/plugins/installed_plugins.json');
  fs.writeFileSync(registry,JSON.stringify({plugins:{'foreign@vendor':[{installPath:path.join(home,'custom-plugin')}]}}));
  check('disabled foreign plugin at custom install path remains searchable',()=>{
    const known=T.readSkills(home), rows=T.find(known.concat(T.readShared(home,known,{env:{}})),'dormant optical').rows;
    assert.strictEqual(rows[0].path,disabled);
    assert.ok(T.renderFind(rows,'dormant optical').includes('native availability unverified'));
  });
  fs.writeFileSync(registry,'{malformed');
  check('malformed registry reports incomplete discovery',()=>assert.ok(T.readShared(home,[],{env:{}}).warnings.some(w=>w.includes('invalid JSON'))));
  console.log(`OK (${checks} checks)`);
} finally {fs.rmSync(home,{recursive:true,force:true});}
