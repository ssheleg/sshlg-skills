#!/usr/bin/env node
'use strict';
require('./tmproot.js').isolate(); // B-350: no inherited host config root reaches this suite or its children
/**
 * B-331: a flag a command does not read is refused, never ignored. An agent that
 * mistypes `--jsno` must not get the human table with exit 0 and read it as data,
 * and a mistyped `--aply` must not look like a finished preview.
 *
 * Two halves. The pure half reads `lib/cli-flags.js`: what each command accepts.
 * The process half runs the launcher itself: every command `main()` dispatches on
 * answers an unknown flag with exit 2, names the flag, starts no child process
 * and writes nothing under HOME.
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BIN = path.join(ROOT, 'bin', 'sshlg-skills.js');
const F = require('../lib/cli-flags.js');
let n = 0;
const failures = [];
function it(name, fn) { n++; try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); } }

const BOGUS = '--no-such-flag-b331';

function cli(args) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-flags-'));
  const home = path.join(tmp, 'home'); fs.mkdirSync(home);
  const calls = path.join(tmp, 'calls.jsonl');
  const preload = path.join(tmp, 'preload.cjs');
  fs.writeFileSync(preload, `const fs=require('fs'),cp=require('child_process');
for (const k of ['spawnSync','spawn','execSync','execFileSync','execFile','exec','fork']) {
  cp[k]=(...a)=>{fs.appendFileSync(${JSON.stringify(calls)},JSON.stringify({k,cmd:String(a[0])})+'\\n');throw new Error('child process in a refusal');};
}`);
  try {
    const r = spawnSync(process.execPath, ['--require', preload, BIN, ...args], {
      cwd: tmp, encoding: 'utf8', timeout: 15000,
      env: { PATH: path.dirname(process.execPath), HOME: home, USERPROFILE: home,
        CLAUDE_CONFIG_DIR: path.join(home, '.claude'), CODEX_HOME: path.join(home, '.codex'),
        XDG_CONFIG_HOME: path.join(home, '.config'), SSHLG_CONFIG_DIR: path.join(home, '.sshlg'), NODE_OPTIONS: '' },
    });
    return { ...r, calls: fs.existsSync(calls) ? fs.readFileSync(calls, 'utf8').trim().split('\n') : [],
      homeFiles: fs.readdirSync(home), cwdFiles: fs.readdirSync(tmp).filter(f => !['home', 'preload.cjs', 'calls.jsonl'].includes(f)) };
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

// Every name main() dispatches on, aliases included (the extraction cli_help_test.js uses).
const src = fs.readFileSync(BIN, 'utf8');
const mainSrc = src.slice(src.indexOf('\nfunction main(argv)'), src.indexOf('\nif (require.main === module)'));
const names = new Set();
for (const m of mainSrc.matchAll(/cmd === '([a-z]+)'/g)) names.add(m[1]);
for (const m of mainSrc.matchAll(/\[((?:\s*'[a-z]+',?)+)\]\.includes\(cmd\)/g)) for (const x of m[1].matchAll(/'([a-z]+)'/g)) names.add(x[1]);
names.delete('help');

it('main() dispatch was read (guards the extraction itself)', () => {
  for (const want of ['install', 'list', 'toolkit', 'hooks', 'config', 'restore', 'domains', 'ls']) assert.ok(names.has(want), want);
  assert.ok(names.size >= 30, `only ${names.size} names`);
});

// --- the process half ---------------------------------------------------------
for (const cmd of [...names].sort()) {
  it(`${cmd} ${BOGUS} exits 2, names the flag, runs and writes nothing`, () => {
    const r = cli([cmd, BOGUS]);
    const out = `${r.stdout}${r.stderr}`;
    assert.strictEqual(r.status, 2, `exit ${r.status}\n${out}`);
    assert.ok(out.includes(BOGUS), `the flag is not named:\n${out}`);
    assert.deepStrictEqual(r.calls, [], `child processes ${r.calls}`);
    assert.deepStrictEqual(r.homeFiles, [], `HOME writes ${r.homeFiles}`);
    assert.deepStrictEqual(r.cwdFiles, [], `cwd writes ${r.cwdFiles}`);
  });
}

it('a known flag beside the unknown one does not rescue the run', () => {
  for (const args of [['list', '--json', BOGUS], ['toolkit', '--find', 'design', BOGUS], ['hooks', 'status', BOGUS],
    ['visibility', 'marks', BOGUS], ['config', 'set', BOGUS], ['pack', 'design', BOGUS], ['restore', 'x.tar.gz', BOGUS]]) {
    const r = cli(args);
    assert.strictEqual(r.status, 2, `${args.join(' ')}: exit ${r.status}\n${r.stdout}${r.stderr}`);
    assert.deepStrictEqual(r.homeFiles, [], `${args.join(' ')}: HOME writes`);
  }
});

it('list --json with a mistyped second flag prints no JSON document', () => {
  const r = cli(['list', '--json', '--verbos']);
  assert.strictEqual(r.status, 2);
  assert.ok(!r.stdout.includes('"schema"'), r.stdout);
  assert.ok(r.stdout.includes('--verbos'));
});

it('the refusal carries the command\'s own usage lines', () => {
  const r = cli(['toolkit', BOGUS]);
  assert.ok(/unknown flag for toolkit: /.test(r.stdout), r.stdout);
  assert.ok(r.stdout.includes('npx sshlg-skills toolkit'), r.stdout);
  assert.ok(!r.stdout.includes('npx sshlg-skills install'), 'the whole usage was printed');
});

it('commands the table covers still run with the flags they read', () => {
  for (const args of [['list'], ['list', '--verbose'], ['list', '-v'], ['ls', '--json'], ['agents'], ['pack'],
    ['materialised', '--root', '.'], ['materialized'], ['config'], ['config', 'list']]) {
    const r = cli(args);
    assert.strictEqual(r.status, 0, `${args.join(' ')}: exit ${r.status}\n${r.stdout}${r.stderr}`);
  }
});

// --- the pure half ------------------------------------------------------------
const ok = (cmd, ...rest) => assert.strictEqual(F.unknownFlag(cmd, rest), null, `${cmd} ${rest.join(' ')}`);
const bad = (want, cmd, ...rest) => assert.strictEqual(F.unknownFlag(cmd, rest), want, `${cmd} ${rest.join(' ')}`);

it('every flag the usage text documents for a covered command is accepted', () => {
  ok('list', '--verbose'); ok('list', '-v'); ok('list', '--json'); ok('ls', '--json');
  ok('toolkit', '--for', 'a landing page', '--expand', 'x', '--limit', '5');
  ok('toolkit', '--find', 'design, дизайн', '--json'); ok('toolkit', '--find', 'x', '--copies');
  ok('visibility', '--apply', '--days', '60', '--full-days', 'off', '--keep', 'a,b', '--measure');
  ok('visibility', '--revert');
  ok('visibility', 'marks', '--init', '--show', 'a/b,c/d', '--replace', '--apply');
  ok('domains', '--apply', '--root', '/x', '--no-usage'); ok('domains', '--revert');
  ok('domains', '--enable', 'xr-dev', '--project', '/x'); ok('domains', '--disable', 'xr-dev'); ok('domains', '--update-step');
  ok('pack', 'design', '--lane', 'motion', '--check'); ok('packs');
  ok('materialised', '--root', '/x'); ok('materialized', '--root', '/x');
  ok('signature', '--used', 'a=b', '--format', 'html', '--part', 'footer', '--no-star');
  ok('humanizers', '--quiet');
  ok('hooks'); ok('hooks', 'status'); ok('hooks', 'remove');
  ok('hooks', 'install', '--force', '--dry-run', '--codex', '--gemini', '--kimi', '--hermes', '--pi', '--opencode');
  ok('config', 'set', 'routers.task-pipeline', 'off'); ok('restore', 'skills-all-x.tar.gz');
  ok('agents'); ok('hosts'); ok('injectors'); ok('conflicts');
});

it('a flag another command reads is unknown here', () => {
  bad('--json', 'agents', '--json'); bad('--apply', 'list', '--apply'); bad('--find', 'pack', '--find', 'x');
  bad('--init', 'visibility', '--init'); bad('--days', 'visibility', 'marks', '--days', '3');
  bad('--codex', 'restore', '--codex'); bad('-x', 'hosts', '-x');
});

it('a valued flag takes the next token unless that token is a long flag', () => {
  ok('toolkit', '--find', '-dash-led query');
  bad('--bogus', 'toolkit', '--find', '--bogus');
  bad('--bogus', 'toolkit', '--limit', '5', '--bogus');
  ok('signature', '--used', 'a=--not-a-flag');
});

it('config: the verb and the key are checked, a value is the operator\'s text', () => {
  bad('--list', 'config', '--list'); bad('--x', 'config', 'set', '--x', 'on');
  ok('config', 'set', 'routes.external.foo.line', '- a line that starts with a dash');
  ok('config', 'set', 'routes.external.foo.triggers', '--weird, trigger');
});

it('commands with a parser of their own are left to it', () => {
  // hooks recovery, rules, blocks, schedule, enroll, settings, context and the
  // install family refuse on their own, with their own usage and JSON shapes.
  for (const cmd of ['install', 'i', 'update', 'up', 'uninstall', 'un', 'backup', 'wipe', 'routers', 'rules', 'blocks',
    'schedule', 'enroll', 'settings', 'context']) ok(cmd, BOGUS);
  ok('hooks', 'recovery', 'inspect', BOGUS);
});

// --- the install family: one parser, each command its own flags ------------------
const own = (cmd, ...rest) => assert.strictEqual(F.foreignFamilyFlag(cmd, rest), null, `${cmd} ${rest.join(' ')}`);
const foreign = (want, cmd, ...rest) => assert.strictEqual(F.foreignFamilyFlag(cmd, rest), want, `${cmd} ${rest.join(' ')}`);

it('an install-family command accepts the flags it reads', () => {
  for (const cmd of ['install', 'i']) own(cmd, '--agent', 'cursor,zed', '-a', 'codex', '--all', '--no-claude', '--dry-run', '--routers', 'yes', '--member', 'make-skill');
  for (const cmd of ['update', 'up']) own(cmd, '--agent', 'codex', '--all', '--claude-only', '--bump-pins', '--dry-run', '--member', 'make-skill');
  for (const cmd of ['uninstall', 'un']) own(cmd, '--no-claude', '--dry-run', '--agent', 'codex', '--claude-only', '--member', 'make-skill');
  own('backup'); own('wipe', '--dry-run');
  own('routers', '--member', 'make-skill', '--update', '--dry-run', '--agent', 'codex', '--no-claude', '--routers', 'no');
  own('routers', '--diff', 'task-pipeline'); own('routers', '--update', '--adopt', 'task-pipeline,super-ux', '--claude-only');
});

it('a flag only another install-family command reads is foreign here', () => {
  foreign('--bump-pins', 'install', '--bump-pins'); foreign('--adopt', 'i', '--agent', 'codex', '--adopt', 'x');
  foreign('--diff', 'update', '--diff', 'task-pipeline'); foreign('--update', 'up', '--update');
  foreign('--all', 'uninstall', '--all'); foreign('--bump-pins', 'un', '--dry-run', '--bump-pins');
  foreign('--routers', 'uninstall', '--routers', 'yes');
  for (const flag of ['--dry-run', '--all', '--no-claude', '--claude-only', '--bump-pins', '--update']) foreign(flag, 'backup', flag);
  foreign('--agent', 'backup', '--agent', 'codex'); foreign('-a', 'backup', '-a', 'codex');
  foreign('--no-claude', 'wipe', '--no-claude'); foreign('--member', 'wipe', '--dry-run', '--member', 'x');
  foreign('--all', 'routers', '--all'); foreign('--bump-pins', 'routers', '--update', '--bump-pins');
});

it('a value is not judged as a flag, and what no family command reads is left to the parser', () => {
  own('routers', '--member', 'bump-pins'); own('install', '--agent', 'all');
  own('wipe', BOGUS); own('backup', 'stray-word');
  assert.strictEqual(F.foreignFamilyFlag('list', ['--all']), null, 'a command outside the family');
});

it('every install-family name main() dispatches on has its own flag set', () => {
  for (const cmd of ['install', 'i', 'update', 'up', 'uninstall', 'un', 'backup', 'wipe', 'routers']) {
    assert.ok(names.has(cmd), `${cmd} is not dispatched`);
    assert.ok(F.familyCovers(cmd), `${cmd} has no flag set`);
  }
});

it('the launcher refuses a foreign family flag: exit 2, the flag named, own usage, nothing run or written', () => {
  for (const args of [['backup', '--dry-run'], ['wipe', '--no-claude'], ['wipe', '--dry-run', '--agent', 'codex'],
    ['uninstall', '--dry-run', '--all'], ['un', '--bump-pins'], ['routers', '--all'], ['routers', '--dry-run', '--bump-pins'],
    ['install', '--dry-run', '--bump-pins'], ['update', '--dry-run', '--adopt', 'task-pipeline']]) {
    const r = cli(args);
    const out = `${r.stdout}${r.stderr}`;
    const bad = args.find((a) => F.foreignFamilyFlag(args[0], [a]) === a);
    assert.strictEqual(r.status, 2, `${args.join(' ')}: exit ${r.status}\n${out}`);
    assert.ok(out.includes(`unknown flag for ${args[0]}: ${bad}`), `${args.join(' ')}:\n${out}`);
    assert.ok(out.includes('npx sshlg-skills '), `${args.join(' ')}: no usage`);
    assert.deepStrictEqual(r.calls, [], `${args.join(' ')}: child processes ${r.calls}`);
    assert.deepStrictEqual(r.homeFiles, [], `${args.join(' ')}: HOME writes ${r.homeFiles}`);
    assert.deepStrictEqual(r.cwdFiles, [], `${args.join(' ')}: cwd writes ${r.cwdFiles}`);
  }
});

it('wipe --dry-run and uninstall --dry-run still preview', () => {
  for (const args of [['wipe', '--dry-run'], ['uninstall', '--dry-run', '--no-claude']]) {
    const r = cli(args);
    assert.strictEqual(r.status, 0, `${args.join(' ')}: exit ${r.status}\n${r.stdout}${r.stderr}`);
    assert.ok(!/unknown flag/.test(r.stdout + r.stderr), r.stdout);
  }
});

it('`--` ends the flags and a lone `-` is not one', () => {
  ok('list', '--', BOGUS); ok('restore', '-');
});

it('every command main() dispatches on is either in the table or named as self-parsing', () => {
  for (const cmd of names) assert.ok(F.covers(cmd) || F.SELF_PARSING.includes(cmd), `${cmd} is in neither list`);
});

if (failures.length) { console.error(failures.map((f) => `FAIL ${f}`).join('\n')); console.error(`${failures.length}/${n} failed`); process.exit(1); }
console.log(`cli_unknown_flag_test: ${n} cases passed`);
