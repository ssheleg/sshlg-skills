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
function cli(args, opts = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hc3-targets-'));
  const taskHome = path.join(tmp, 'home'); fs.mkdirSync(taskHome);
  if (opts.setup) opts.setup(taskHome, tmp);
  const calls = path.join(tmp, 'calls.jsonl');
  const preload = path.join(tmp, 'preload.cjs');
  fs.writeFileSync(preload, `require(${JSON.stringify(path.join(ROOT,'test/fixtures/native-transaction-boundary.cjs'))});const fs=require('fs');require('child_process').spawnSync=(cmd,args)=>{fs.appendFileSync(${JSON.stringify(calls)},JSON.stringify({cmd,args})+'\\n');return {status:0,stdout:'',stderr:''};};`);
  try {
    const result = spawnSync(process.execPath, ['--require',preload,path.join(ROOT,'bin/sshlg-skills.js'),...args], {
      cwd:tmp, encoding:'utf8', timeout:10000,
      env:{...process.env,HOME:taskHome,USERPROFILE:taskHome,CLAUDE_CONFIG_DIR:path.join(taskHome,'.claude'),
        CODEX_HOME:path.join(taskHome,'.codex'),GEMINI_CLI_HOME:taskHome,XDG_CONFIG_HOME:path.join(taskHome,'.config'),
        NODE_OPTIONS:'',SSHLG_CONFIG_DIR:path.join(taskHome,'.sshlg'),...(opts.env||{})},
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
    for (const selection of [['--all'],['--agent','continue'],['--agent','zed,continue,codex']]) {
      for (const extra of [[],['--no-claude']]) {
        const r = cli([verb,...selection,'--member','make-skill',...extra]);
        assert.strictEqual(r.status,0,r.stdout+r.stderr);
        const adds = r.calls.filter(c => c.cmd === 'npx' && c.args[2] === 'add');
        assert.ok(adds.length > 0,'no add calls reached child-process boundary');
        const expected = P.resolveAgents(defaults,{all:selection[0]==='--all',agents:selection[0]==='--agent'?selection[1].split(','):undefined,claude:extra.length?false:true});
        for (const repo of new Set(adds.map(call=>call.args[3]))) {
          assert.deepStrictEqual(adds.filter(call=>call.args[3]===repo).flatMap(call=>targets(call.args)),expected);
        }
        for (const call of adds) {
          assert.strictEqual(call.args[1],spec);
          const ids=targets(call.args); assert.ok(ids.length);
          const copy=ids.filter(id=>P.COPY_AGENTS.includes(id));
          assert.strictEqual(call.args.includes('--copy'),copy.length>0);
          if(copy.length) assert.deepStrictEqual(ids,copy.slice(0,1));
        }
      }
    }
  });
}
it('repeated --agent flags accumulate and reach the child process as separate flags', () => {
  const r=cli(['install','--no-claude','--member','make-skill','--agent','codex,zed','--agent','cursor,codex']);
  assert.strictEqual(r.status,0,r.stdout+r.stderr);
  const adds=r.calls.filter(c=>c.cmd==='npx'&&c.args[2]==='add'); assert.ok(adds.length);
  for(const c of adds) assert.deepStrictEqual(targets(c.args),['codex','zed','cursor']);
});
// B-219: OpenClaw is opt-in. Its detection is a folder (~/.openclaw), and its prompt caps
// (150 skills / 18,000 chars, 300 candidates and 200 loaded per root) would show a
// fraction of the family, so a default run never targets it; an explicit --agent does.
it('openclaw is not a default target and stays reachable with --agent openclaw', () => {
  assert.ok(!defaults.includes('openclaw'), 'skills.json defaultAgents still lists openclaw');
  assert.ok(H.snapshot.agents.some(row => row.id === 'openclaw' && row.global));
  const plain = cli(['install','--no-claude','--member','make-skill'], { setup: h => fs.mkdirSync(path.join(h,'.cursor')) });
  assert.strictEqual(plain.status,0,plain.stdout+plain.stderr);
  const adds = plain.calls.filter(c=>c.cmd==='npx'&&c.args[2]==='add'); assert.ok(adds.length);
  for (const c of adds) assert.ok(!targets(c.args).includes('openclaw'), c.args.join(' '));
  const opted = cli(['install','--no-claude','--member','make-skill','--agent','openclaw']);
  assert.strictEqual(opted.status,0,opted.stdout+opted.stderr);
  const optAdds = opted.calls.filter(c=>c.cmd==='npx'&&c.args[2]==='add'); assert.ok(optAdds.length);
  for (const c of optAdds) assert.deepStrictEqual(targets(c.args),['openclaw']);
});

// B-218 / INST-9: the upstream CLI creates a target's home for every --agent it is
// given, so a DEFAULT target is passed only when its home exists here (skills@1.7.2's
// own detectInstalled paths). An explicit --agent or --all is the operator's choice.
it('every default target has a recorded home, and presence follows HOME, XDG and host variables', () => {
  for (const id of defaults) assert.ok(H.HOMES[id], `no recorded home for default ${id}`);
  const have = new Set(['/h/.cursor', '/x/goose', '/hh', '/c/zed']);
  const ctx = (env) => ({ home: '/h', env, exists: p => have.has(p) });
  const r = H.presence(defaults, ctx({ XDG_CONFIG_HOME: '/x' }));
  assert.deepStrictEqual(r.present, ['cursor', 'goose']);
  assert.deepStrictEqual(r.absent.map(a => a.id), defaults.filter(id => !['cursor', 'goose'].includes(id)));
  assert.deepStrictEqual(H.presence(['hermes-agent', 'zed', 'codex'], ctx({ HERMES_HOME: ' /hh ', XDG_CONFIG_HOME: '/c' })).present, ['hermes-agent', 'zed']);
  assert.deepStrictEqual(H.presence(['codex'], { home: '/h', env: {}, exists: p => p === '/etc/codex' }).present, ['codex']);
  assert.deepStrictEqual(H.presence(['not-recorded'], ctx({})).present, ['not-recorded'], 'unprovable absence is not assumed');
});
for (const verb of ['install','update']) {
  it(`${verb}: default targets whose home is absent are skipped and named, and no home is created`, () => {
    const none = cli([verb,'--no-claude','--member','make-skill']);
    assert.strictEqual(none.status,0,none.stdout+none.stderr);
    assert.deepStrictEqual(none.calls.filter(c=>c.cmd==='npx'&&c.args[2]==='add'),[]);
    assert.match(none.stdout,/not installed here, skipped: cursor, opencode, kilo/);
    for (const d of ['.cursor','.kiro','.codeium','.kilo','.hermes','.gemini','.codex','.config']) assert.ok(!none.homeFiles.includes(d), d);
    const some = cli([verb,'--no-claude','--member','make-skill'],
      { setup: h => { fs.mkdirSync(path.join(h,'.config','goose'),{recursive:true}); fs.mkdirSync(path.join(h,'.cursor')); } });
    assert.strictEqual(some.status,0,some.stdout+some.stderr);
    const adds = some.calls.filter(c=>c.cmd==='npx'&&c.args[2]==='add'); assert.ok(adds.length);
    for (const c of adds) assert.deepStrictEqual(targets(c.args),['cursor','goose']);
    assert.ok(!/skipped: [^\n]*\b(cursor|goose)\b/.test(some.stdout), some.stdout);
    const dry = cli([verb,'--no-claude','--dry-run','--member','make-skill'], { setup: h => fs.mkdirSync(path.join(h,'.cursor')) });
    assert.strictEqual(dry.status,0,dry.stdout+dry.stderr);
    assert.match(dry.stdout,/not installed here, skipped: opencode/);
    assert.ok(!/--agent (opencode|zed|goose)/.test(dry.stdout), dry.stdout);
  });
}
it('an explicit --agent still reaches an absent host (the operator chose it)', () => {
  const r = cli(['install','--no-claude','--member','make-skill','--agent','zed']);
  assert.strictEqual(r.status,0,r.stdout+r.stderr);
  const adds = r.calls.filter(c=>c.cmd==='npx'&&c.args[2]==='add'); assert.ok(adds.length);
  for (const c of adds) assert.deepStrictEqual(targets(c.args),['zed']);
  assert.ok(!/not installed here/.test(r.stdout), r.stdout);
});

// B-213: the Continue `--copy` restore pass joins `update` only when Continue is
// installed (`cn` on PATH, or ~/.continue/config.*) AND the run's scope includes it.
const BASE_PATH = [path.dirname(process.execPath), '/usr/bin', '/bin'].join(path.delimiter);
function continueCopies(home, withConfig) {
  fs.mkdirSync(path.join(home, '.continue', 'skills', 'make-skill'), { recursive: true });
  if (withConfig) fs.writeFileSync(path.join(home, '.continue', withConfig), '');
}
const continueSteps = r => (r.stdout.match(/--agent continue --global --yes --copy/g) || []).length;
it('update --dry-run --agent codex plans no Continue step even with Continue installed', () => {
  const r = cli(['update','--dry-run','--agent','codex'], { setup: h => continueCopies(h, 'config.yaml'), env: { PATH: BASE_PATH } });
  assert.strictEqual(r.status,0,r.stdout+r.stderr);
  assert.match(r.stdout, /--agent codex --global --yes/);
  assert.strictEqual(continueSteps(r), 0, r.stdout);
});
it('unscoped update plans no Continue step when Continue is not installed (copies alone are not a host)', () => {
  const r = cli(['update','--dry-run','--no-claude'], { setup: h => continueCopies(h, null), env: { PATH: BASE_PATH } });
  assert.strictEqual(r.status,0,r.stdout+r.stderr);
  assert.strictEqual(continueSteps(r), 0, r.stdout);
});
it('unscoped update restores Continue copies when ~/.continue/config.* or `cn` proves the host', () => {
  for (const config of ['config.yaml', 'config.json']) {
    const r = cli(['update','--dry-run','--no-claude'], { setup: h => continueCopies(h, config), env: { PATH: BASE_PATH } });
    assert.strictEqual(r.status,0,r.stdout+r.stderr);
    assert.ok(continueSteps(r) > 0, config + ': ' + r.stdout);
  }
  const shim = fs.mkdtempSync(path.join(os.tmpdir(), 'hc3-cn-'));
  try {
    fs.writeFileSync(path.join(shim, 'cn'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
    const r = cli(['update','--dry-run','--no-claude'], { setup: h => continueCopies(h, null), env: { PATH: shim + path.delimiter + BASE_PATH } });
    assert.strictEqual(r.status,0,r.stdout+r.stderr);
    assert.ok(continueSteps(r) > 0, 'cn on PATH: ' + r.stdout);
  } finally { fs.rmSync(shim, { recursive: true, force: true }); }
});
if(failures.length){for(const f of failures) console.log('FAIL: '+f);process.exit(1);}
console.log(`OK (${checks} checks)`);
