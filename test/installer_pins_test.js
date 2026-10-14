'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {spawnSync} = require('child_process');
const root = path.resolve(__dirname, '..');
const P = require('../lib/plan');
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('ok ' + name); }
const sha = 'a'.repeat(40);
test('actual CLI ref spelling is hash, never the skill filter at-sign', () => {
  assert.equal(P.addArgsPinned('o/r', sha, ['codex'])[3], 'o/r#' + sha);
});
test('production plan rejects absent, mutable, partial and malformed member commits', () => {
  const pins = require('../lib/installer-pins');
  for (const commit of [undefined, 'main', 'abc123', 'A'.repeat(40), sha+'@other']) {
    assert.throws(() => pins.build([{name:'one',repo:'o/r',commit}], ['codex']), /immutable commit/);
  }
});
test('production update is only pinned adds, preserves target order and Continue copy', () => {
  const pins = require('../lib/installer-pins');
  const members = [{name:'one',repo:'o/r',commit:sha}];
  const got = pins.build(members, ['codex','continue','zed'], {continueCopies:true});
  assert.equal(got.length, 3);
  assert.deepEqual(got.map(a=>a[5]), ['codex','continue','zed']);
  assert(got.every(a=>a[2]==='add' && a[3]==='o/r#'+sha));
  assert(got[1].includes('--copy')); assert(!got[0].includes('--copy'));
  const restore = pins.build(members, ['codex'], {continueCopies:true});
  assert.equal(restore.length,2); assert(restore[1].includes('--copy'));
  assert.deepEqual(pins.build(members, []), []);
});
test('duplicate and missing members cannot form a partial production set', () => {
  const pins=require('../lib/installer-pins');
  const m={name:'one',repo:'o/r',commit:sha};
  assert.throws(()=>pins.build([m,m],['codex']), /duplicate/);
  assert.throws(()=>pins.build([m,{name:'bad',repo:'o/b'}],['codex']), /immutable commit/);
  assert.throws(()=>pins.build([],['codex']), /empty/);
  for(const repo of ['./r','../r','-o/r','o/r#main','o/r@other']) {
    assert.throws(()=>pins.build([{...m,repo}],['codex']),/repository source/);
  }
});
test('shipped commit inventory equals gitlinks, with mismatch and missing controls', () => {
  const pins=require('../lib/installer-pins');
  const members=require('../skills.json').skills;
  const r=spawnSync('git',['-C',root,'ls-files','--stage'],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr); assert(pins.verifyGitlinks(members,r.stdout));
  assert.throws(()=>pins.verifyGitlinks([{...members[0],commit:sha}],r.stdout),/gitlink/);
  assert.throws(()=>pins.verifyGitlinks(members,''),/gitlink/);
});
test('packed launcher preview equals executed pinned argv, preserving Continue restoration', () => {
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'installer-pins-'));
  try {
    const pkg=path.join(tmp,'package'), home=path.join(tmp,'home');
    fs.mkdirSync(pkg);fs.mkdirSync(home);
    for(const d of ['lib','bin'])fs.cpSync(path.join(root,d),path.join(pkg,d),{recursive:true});
    for(const f of ['skills.json','package.json','claude-plugin-pins.json'])fs.copyFileSync(path.join(root,f),path.join(pkg,f));
    const continueDir=path.join(home,'.continue','skills','make-skill');
    fs.mkdirSync(continueDir,{recursive:true});fs.writeFileSync(path.join(continueDir,'SKILL.md'),'existing');
    const calls=path.join(tmp,'calls.jsonl'), shim=path.join(tmp,'shim.cjs');
    fs.writeFileSync(shim,`const fs=require('fs');require('child_process').spawnSync=(cmd,args)=>{fs.appendFileSync(${JSON.stringify(calls)},JSON.stringify({cmd,args})+'\\n');return {status:0,stdout:'',stderr:''};};`);
    const env={...process.env,HOME:home,USERPROFILE:home,CLAUDE_CONFIG_DIR:path.join(home,'.claude'),CODEX_HOME:path.join(home,'.codex'),XDG_CONFIG_HOME:path.join(home,'.config'),NODE_OPTIONS:'--require='+shim};
    const run=(verb,extra=[])=>spawnSync(process.execPath,[path.join(pkg,'bin/sshlg-skills.js'),verb,'--agent','zed','--no-claude','--member','make-skill',...extra],{env,cwd:tmp,encoding:'utf8',timeout:20000});
    for(const verb of ['install','update']) {
      fs.writeFileSync(calls,'');
      const dry=run(verb,['--dry-run']);assert.equal(dry.status,0,dry.stdout+dry.stderr);
      assert.equal(fs.readFileSync(calls,'utf8'),'','preview spawned a child');
      const expected=dry.stdout.split('\n').filter(l=>/^\s+npx /.test(l)).map(l=>l.trim().slice(4).split(' '));
      const actual=run(verb);assert.equal(actual.status,0,actual.stdout+actual.stderr);
      const npx=fs.readFileSync(calls,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse).filter(c=>c.cmd==='npx').map(c=>c.args);
      assert.deepEqual(npx,expected);assert(npx.length>0,'vacuous plan');
      assert(npx.every(a=>a[2]==='add' && /#[a-f0-9]{40}$/.test(a[3])),'floating refresh');
      assert.equal(npx.filter(a=>a.includes('--copy')).length,verb==='update'?require('../skills.json').skills.length:0);
    }
    const registry=path.join(home,'.claude','plugins');fs.mkdirSync(registry,{recursive:true});
    fs.writeFileSync(path.join(registry,'installed_plugins.json'),JSON.stringify({version:2,plugins:{'make-skill@make-skill':[{scope:'user',installPath:path.join(tmp,'payload')}]}}));
    const claude=extra=>spawnSync(process.execPath,[path.join(pkg,'bin/sshlg-skills.js'),'install','--claude-only','--member','make-skill',...extra],{env,cwd:tmp,encoding:'utf8',timeout:20000});
    fs.writeFileSync(calls,'');const preview=claude(['--dry-run']);assert.equal(preview.status,2,preview.stdout+preview.stderr);assert.match(preview.stdout,/invalid installed plugin metadata/);
    assert.equal(fs.readFileSync(calls,'utf8'),'');
    for(const commit of [undefined,'main']) {
      const manifest=JSON.parse(fs.readFileSync(path.join(pkg,'skills.json')));manifest.skills[0].commit=commit;
      fs.writeFileSync(path.join(pkg,'skills.json'),JSON.stringify(manifest));
      for(const verb of ['install','update'])for(const extra of [[],['--dry-run']]) {
        fs.writeFileSync(calls,'');const r=run(verb,extra);
        assert.equal(r.status,2,r.stdout+r.stderr);assert.match(r.stdout,/immutable commit/);
        assert.equal(fs.readFileSync(calls,'utf8'),'','invalid pin spawned a child');
        assert(!fs.existsSync(path.join(home,'.sshlg-skills','update.lock')));
      }
    }
    fs.copyFileSync(path.join(root,'skills.json'),path.join(pkg,'skills.json'));
    const packageFile=path.join(pkg,'package.json'), packageData=JSON.parse(fs.readFileSync(packageFile));
    for(const spec of [undefined,'skills','skills@latest','skills@1.7.3']) {
      packageData.skillsCli=spec;fs.writeFileSync(packageFile,JSON.stringify(packageData));fs.writeFileSync(calls,'');
      const refused=run('update');assert.equal(refused.status,2,refused.stdout+refused.stderr);
      assert.match(refused.stdout,/Host target snapshot does not match|verified skills@1.7.2/);assert.equal(fs.readFileSync(calls,'utf8'),'');
    }
  } finally { fs.rmSync(tmp,{recursive:true,force:true}); }
});
console.log(`PASS: installer pins — ${checks} cases`);
