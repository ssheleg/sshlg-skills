#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const H = require('../lib/host-targets.js');
const P = require('../lib/plan.js');
const ROOT = path.resolve(__dirname, '..');
let checks = 0;
const failures = [];
function it(name, fn) { checks++; try { fn(); } catch (e) { failures.push(name + ': ' + e.message); } }
const spec = require('../package.json').skillsCli;
const defaults = require('../skills.json').defaultAgents;

it('snapshot is bound to the exact package pin and rejects missing/mismatched pins', () => {
  assert.strictEqual(H.validateSnapshot(H.snapshot, spec), H.snapshot);
  for (const pin of [undefined, 'skills', 'skills@0.0.0']) assert.throws(() => H.validateSnapshot(H.snapshot, pin), /does not match/);
});
it('snapshot is ordered, distinct and enumerates the published unsupported targets', () => {
  const ids = H.snapshot.agents.map(row => row.id);
  assert.strictEqual(ids.length, 79);
  const catalog = require('../skills.json').agentsUpstream;
  assert.strictEqual(ids.length, catalog.count);
  assert.strictEqual(H.snapshot.agents.filter(row => row.global).length, catalog.globalCount);
  assert.deepStrictEqual(ids, [...new Set(ids)].sort());
  assert.deepStrictEqual(H.excludedGlobal(), ['eve', 'promptscript']);
  for (const agents of [[], [{id:'x',global:true},{id:'x',global:false}], [{id:'x',global:'yes'}]]) {
    assert.throws(() => H.validateSnapshot({...H.snapshot, agents}, spec), /empty|Invalid/);
  }
});
it('all has stable explicit targets and only no-claude includes plain Claude', () => {
  const supported = H.snapshot.agents.filter(row => row.global).map(row => row.id);
  assert.deepStrictEqual(P.resolveAgents(defaults, {all:true,claude:false}), supported);
  assert.deepStrictEqual(P.resolveAgents(defaults, {all:true}), supported.filter(id => id !== 'claude-code'));
  assert.deepStrictEqual(P.resolveAgents(defaults, {all:true,agents:['zed']}), supported.filter(id => id !== 'claude-code'));
});
it('selected targets retain caller order with duplicates removed and do not mutate inputs', () => {
  const requested = ['zed','codex','zed','claude-code'];
  assert.deepStrictEqual(P.resolveAgents(defaults, {agents:requested}), ['zed','codex']);
  assert.deepStrictEqual(requested, ['zed','codex','zed','claude-code']);
  assert.deepStrictEqual(P.resolveAgents(defaults, {}), defaults);
});
it('the installed hook runtime carries the target snapshot and can resolve the same plan', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hc3-runtime-'));
  try {
    require('../lib/runtime.js').sync(ROOT, tmp, {create:true});
    const runtimePlan = require(path.join(tmp,'lib','plan.js'));
    assert.deepStrictEqual(runtimePlan.resolveAgents(defaults,{all:true}),P.resolveAgents(defaults,{all:true}));
  } finally { fs.rmSync(tmp,{recursive:true,force:true}); }
});
it('unrecognized source bytes cannot verify', () => {
  assert.throws(() => H.verifySource(Buffer.from('unrelated source')), /digest differs/);
});

// All real child execution is replaced with a logging stub. CLI still parses
// flags and builds/executes its real plans, in a disposable HOME/cwd. This proves
// the argv reached spawnSync without invoking npx, git or Claude globally.
function cli(args) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hc3-targets-'));
  const taskHome = path.join(tmp, 'home'); fs.mkdirSync(taskHome);
  const calls = path.join(tmp, 'calls.jsonl');
  const preload = path.join(tmp, 'preload.cjs');
  fs.writeFileSync(preload, `const fs=require('fs');require('child_process').spawnSync=(cmd,args)=>{fs.appendFileSync(${JSON.stringify(calls)},JSON.stringify({cmd,args})+'\\n');return {status:0,stdout:'',stderr:''};};`);
  try {
    const result = spawnSync(process.execPath, ['--require',preload,path.join(ROOT,'bin/sshlg-skills.js'),...args], {
      cwd:tmp, encoding:'utf8', timeout:10000,
      env:{...process.env,HOME:taskHome,USERPROFILE:taskHome,CLAUDE_CONFIG_DIR:path.join(taskHome,'.claude'),
        CODEX_HOME:path.join(taskHome,'.codex'),GEMINI_CLI_HOME:taskHome,XDG_CONFIG_HOME:path.join(taskHome,'.config'),
        NODE_OPTIONS:'',SSHLG_CONFIG_DIR:path.join(taskHome,'.sshlg')},
    });
    return {...result, calls:fs.existsSync(calls)?fs.readFileSync(calls,'utf8').trim().split('\n').map(JSON.parse):[], homeFiles:fs.readdirSync(taskHome)};
  } finally { fs.rmSync(tmp,{recursive:true,force:true}); }
}
const targets = args => args.flatMap((arg,i) => arg === '--agent' ? [args[i+1]] : []);
it('agents lists every pinned installer ID and global capability without children or HOME writes', () => {
  const r = cli(['agents']);
  assert.strictEqual(r.status,0,r.stdout+r.stderr);
  const rows = [...r.stdout.matchAll(/^  ([a-z0-9-]+)\s+(global|project-only)$/gm)]
    .map(m => ({id:m[1],global:m[2]==='global'}));
  assert.deepStrictEqual(rows,H.snapshot.agents);
  assert.strictEqual(rows.filter(row=>!row.global).length,2);
  assert.ok(r.stdout.includes(spec),'exact upstream pin missing');
  assert.match(r.stdout,/Default set:/);
  assert.match(r.stdout,/Claude Code uses the plugin channel/);
  assert.match(r.stdout,/installer destinations, not native runtime acceptance/);
  assert.ok(!r.stdout.includes('__x__'),'listing delegates discovery to an invalid external install');
  assert.deepStrictEqual(r.calls,[]); assert.deepStrictEqual(r.homeFiles,[]);
});

for (const verb of ['install','update']) {
  it(`${verb}: invalid requests reject before any subprocess or HOME write, including mixed flags`, () => {
    for (const extra of [[],['--all'],['--claude-only'],['--dry-run'],['--agent','codex']]) {
      for (const id of ['eve','promptscript','unknown-host','*']) {
        const r = cli([verb,'--member','make-skill','--agent',id,...extra]);
        assert.strictEqual(r.status,2,r.stdout+r.stderr);
        assert.deepStrictEqual(r.calls,[]); assert.deepStrictEqual(r.homeFiles,[]);
      }
    }
  });
  it(`${verb}: --all dry-run discloses exclusions and leaves HOME/children untouched`, () => {
    const r = cli([verb,'--all','--dry-run','--member','make-skill']);
    assert.strictEqual(r.status,0,r.stdout+r.stderr);
    assert.match(r.stdout,/excludes non-global targets.*eve, promptscript/);
    assert.match(r.stdout,/plugin channel; no plain Claude target/);
    assert.ok(!r.stdout.includes('--agent *') && !r.stdout.includes('--agent eve') && !r.stdout.includes('--agent claude-code'));
    assert.deepStrictEqual(r.calls,[]); assert.deepStrictEqual(r.homeFiles,[]);
  });
  it(`${verb}: actual CLI add calls propagate the same explicit supported targets`, () => {
    for (const extra of [[],['--no-claude']]) {
      const r = cli([verb,'--all','--member','make-skill',...extra]);
      assert.strictEqual(r.status,0,r.stdout+r.stderr);
      const adds = r.calls.filter(c => c.cmd === 'npx' && c.args[2] === 'add');
      assert.ok(adds.length > 0,'no add calls reached child-process boundary');
      const expected = P.resolveAgents(defaults,{all:true,claude:extra.length?false:true});
      for (const call of adds) { assert.strictEqual(call.args[1],spec); assert.deepStrictEqual(targets(call.args),expected); }
    }
  });
}
it('repeated --agent flags accumulate and reach the child process as separate flags', () => {
  const r=cli(['install','--no-claude','--member','make-skill','--agent','codex,zed','--agent','cursor,codex']);
  assert.strictEqual(r.status,0,r.stdout+r.stderr);
  const adds=r.calls.filter(c=>c.cmd==='npx'&&c.args[2]==='add'); assert.ok(adds.length);
  for(const c of adds) assert.deepStrictEqual(targets(c.args),['codex','zed','cursor']);
});
if(failures.length){for(const f of failures) console.log('FAIL: '+f);process.exit(1);}
console.log(`OK (${checks} checks)`);
