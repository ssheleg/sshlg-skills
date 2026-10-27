#!/usr/bin/env node
'use strict';
/**
 * B-198: every top-level subcommand answers `--help` and `-h` with its usage on
 * stdout and exit 0, and writes nothing: no file under HOME, no child process
 * (so no install, no backup, no network). B-218 / INST-14: `--version` and `-v`
 * print the package version.
 *
 * The subcommand list is read from `main()` itself, so a subcommand added later
 * without a usage line fails here rather than answering `--help` with exit 2.
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BIN = path.join(ROOT, 'bin', 'sshlg-skills.js');
const VERSION = require('../package.json').version;
let n = 0;
const failures = [];
function it(name, fn) { n++; try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); } }

// Every child-process entry point is replaced by a recorder: a help answer that
// reached one would show up as a call, and none of them runs anything.
function cli(args) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-help-'));
  const home = path.join(tmp, 'home'); fs.mkdirSync(home);
  const calls = path.join(tmp, 'calls.jsonl');
  const preload = path.join(tmp, 'preload.cjs');
  fs.writeFileSync(preload, `const fs=require('fs'),cp=require('child_process');
for (const k of ['spawnSync','spawn','execSync','execFileSync','execFile','exec','fork']) {
  cp[k]=(...a)=>{fs.appendFileSync(${JSON.stringify(calls)},JSON.stringify({k,cmd:String(a[0])})+'\\n');throw new Error('child process in a help answer');};
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

function silent(r, label) {
  assert.strictEqual(r.status, 0, `${label}: exit ${r.status}\n${r.stdout}${r.stderr}`);
  assert.strictEqual(r.stderr, '', `${label}: stderr ${r.stderr}`);
  assert.deepStrictEqual(r.calls, [], `${label}: child processes ${r.calls}`);
  assert.deepStrictEqual(r.homeFiles, [], `${label}: HOME writes ${r.homeFiles}`);
  assert.deepStrictEqual(r.cwdFiles, [], `${label}: cwd writes ${r.cwdFiles}`);
}

// Every name main() dispatches on, aliases included.
const src = fs.readFileSync(BIN, 'utf8');
const mainSrc = src.slice(src.indexOf('\nfunction main(argv)'), src.indexOf('\nif (require.main === module)'));
const names = new Set();
for (const m of mainSrc.matchAll(/cmd === '([a-z]+)'/g)) names.add(m[1]);
for (const m of mainSrc.matchAll(/\[((?:\s*'[a-z]+',?)+)\]\.includes\(cmd\)/g)) for (const x of m[1].matchAll(/'([a-z]+)'/g)) names.add(x[1]);
names.delete('help');
const ALIAS = { i: 'install', up: 'update', un: 'uninstall', ls: 'list', packs: 'pack', materialized: 'materialised' };

it('main() dispatch was read (guards the extraction itself)', () => {
  for (const want of ['install', 'update', 'rules', 'blocks', 'config', 'wipe', 'restore', 'i', 'up']) assert.ok(names.has(want), want);
  assert.ok(names.size >= 30, `only ${names.size} names`);
});

for (const cmd of [...names].sort()) {
  const canonical = ALIAS[cmd] || cmd;
  for (const flag of ['--help', '-h']) {
    it(`${cmd} ${flag} prints its usage, exits 0, writes nothing`, () => {
      const r = cli([cmd, flag]);
      silent(r, `${cmd} ${flag}`);
      assert.match(r.stdout, new RegExp(`npx sshlg-skills ${canonical}\\b`), r.stdout);
    });
  }
}

it('the help flag is honoured after other arguments, and wins over a destructive verb', () => {
  for (const args of [['rules', '--apply', '--help'], ['wipe', '--dry-run', '-h'], ['install', '--agent', 'codex', '--help'],
    ['rules', 'recovery', 'inspect', '--help'], ['hooks', 'install', '-h'], ['config', 'set', 'routers.x', 'off', '--help']]) {
    const r = cli(args);
    silent(r, args.join(' '));
    assert.match(r.stdout, new RegExp(`npx sshlg-skills ${args[0]}\\b`));
  }
});

it('a subcommand help names only that subcommand', () => {
  const r = cli(['rules', '--help']);
  silent(r, 'rules --help');
  for (const line of r.stdout.split('\n').filter(l => /npx sshlg-skills /.test(l))) {
    assert.match(line, /npx sshlg-skills rules\b/, line);
  }
  assert.ok(!r.stdout.includes('Skills:'), 'the whole usage was printed');
});

it('install and update help carry the Defaults section that explains their flags', () => {
  for (const cmd of ['install', 'update']) {
    const r = cli([cmd, '--help']);
    silent(r, cmd);
    assert.match(r.stdout, /--no-claude skip the Claude plugin step/);
    assert.match(r.stdout, /--dry-run/);
  }
});

it('help <command> answers like <command> --help; help <unknown> exits 2', () => {
  const a = cli(['help', 'rules']), b = cli(['rules', '--help']);
  silent(a, 'help rules');
  assert.strictEqual(a.stdout, b.stdout);
  const u = cli(['help', 'no-such-command']);
  assert.strictEqual(u.status, 2, u.stdout);
  assert.match(u.stdout, /unknown command: no-such-command/);
});

it('blocks keeps its own, more detailed usage (verbs included)', () => {
  const r = cli(['blocks', '--help']);
  silent(r, 'blocks --help');
  assert.match(r.stdout, /npx sshlg-skills blocks install/);
  assert.match(r.stdout, /npx sshlg-skills blocks diff/);
});

it('an unknown command with --help still fails with exit 2', () => {
  const r = cli(['no-such-command', '--help']);
  assert.strictEqual(r.status, 2);
  assert.match(r.stdout, /unknown command: no-such-command/);
});

it('the bare and full help stay as they were', () => {
  for (const args of [[], ['help'], ['--help'], ['-h'], ['help', '--help']]) {
    const r = cli(args);
    silent(r, args.join(' ') || '(none)');
    assert.match(r.stdout, /^sshlg-skills/);
    assert.match(r.stdout, /npx sshlg-skills install/);
    assert.match(r.stdout, /npx sshlg-skills --version/);
  }
});

it('--version and -v print the package version only, exit 0, write nothing', () => {
  for (const flag of ['--version', '-v']) {
    const r = cli([flag]);
    silent(r, flag);
    assert.strictEqual(r.stdout, `${VERSION}\n`);
  }
});

it('list -v keeps meaning verbose', () => {
  const r = cli(['list', '-v']);
  silent(r, 'list -v');
  assert.match(r.stdout, /ssheleg skill family/);
  assert.match(r.stdout, /github|\//);
});

if (failures.length) { for (const f of failures) console.log(`FAIL: ${f}`); process.exit(1); }
console.log(`PASS: cli_help — ${n} cases`);
