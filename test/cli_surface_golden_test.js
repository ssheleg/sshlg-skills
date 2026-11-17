#!/usr/bin/env node
'use strict';
require('./tmproot.js').isolate(); // B-350: no inherited host config root reaches this suite or its children
/**
 * B-354: the CLI's observable surface, byte for byte. Every case below runs the
 * real launcher in an empty HOME with a PATH that holds only `node`, and compares
 * stdout+stderr and the exit code with `test/fixtures/cli-surface.json`.
 *
 * It exists so the launcher can be cut into modules (2026-11-17 refactor) with a
 * proof that nothing a person or an agent reads has moved: the full usage, each
 * command's own help, the version, an unknown command, and the read-only and
 * dry-run answers of every command that is deterministic in an empty HOME.
 *
 * What changes between machines and releases is normalised, never skipped: the
 * temporary HOME, this checkout's root, 40-hex commits, 16-hex profile hashes, the
 * per-member file counts of a pinned payload and the package version.
 *
 * A deliberate surface change rewrites the fixture in the same commit:
 *   SSHLG_GOLDEN_WRITE=1 node test/cli_surface_golden_test.js
 * and the diff of the fixture is the review of the change.
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BIN = path.join(ROOT, 'bin', 'sshlg-skills.js');
const FIXTURE = path.join(__dirname, 'fixtures', 'cli-surface.json');
const VERSION = require('../package.json').version;

// Read-only or dry-run answers, deterministic in an empty HOME (checked twice
// in two HOMEs when the fixture was written). `blocks --json` is not: it stamps
// a time. Each case is an argv after the launcher.
const READ_ONLY = [
  'list', 'list --json', 'list -v', 'agents', 'hosts', 'injectors', 'conflicts',
  'config list', 'context', 'context --json', 'install --dry-run', 'update --dry-run',
  'uninstall --dry-run', 'routers --dry-run', 'enroll --dry-run --json', 'materialised',
  'humanizers', 'domains', 'pack', 'settings get hooks', 'toolkit --find test --json',
  'rules', 'hooks status', 'visibility',
];
const META = ['', 'help', '--help', '-h', '--version', '-v', 'nosuch', 'help nosuch', 'nosuch --help'];

function commandNames() {
  const text = run(['help']).out;
  const names = new Set();
  for (const m of text.matchAll(/^ {2}npx sshlg-skills ([a-z]+)\b/gm)) names.add(m[1]);
  return [...names].sort();
}

function run(argv) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-surface-'));
  try {
    const home = path.join(tmp, 'home'); fs.mkdirSync(home);
    const bin = path.join(tmp, 'bin'); fs.mkdirSync(bin);
    fs.symlinkSync(process.execPath, path.join(bin, 'node'));
    const r = spawnSync(process.execPath, [BIN, ...argv], {
      cwd: home, encoding: 'utf8', timeout: 60000,
      env: { PATH: bin, HOME: home, USERPROFILE: home, CLAUDE_CONFIG_DIR: path.join(home, '.claude'),
        CODEX_HOME: path.join(home, '.codex'), XDG_CONFIG_HOME: path.join(home, '.config'),
        SSHLG_CONFIG_DIR: path.join(home, '.sshlg'), NODE_OPTIONS: '', LANG: 'C', TZ: 'UTC' },
    });
    let out = `${r.stdout || ''}${r.stderr || ''}`;
    for (const p of [fs.realpathSync(tmp), tmp]) out = out.split(path.join(p, 'home')).join('<HOME>').split(path.join(p, 'bin')).join('<BIN>');
    out = out.split(ROOT).join('<ROOT>')
      .replace(/\b[0-9a-f]{40}\b/g, '<SHA>')
      .replace(/\b[0-9a-f]{16}\b/g, '<H>')
      .replace(/\b\d+ files\b/g, '<N> files')
      .split(VERSION).join('<VERSION>');
    return { out, status: r.status };
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

function cases() {
  const list = [...META.map(a => a.split(' ').filter(Boolean))];
  for (const name of commandNames()) list.push([name, '--help']);
  for (const c of READ_ONLY) list.push(c.split(' '));
  return list;
}

const actual = {};
for (const argv of cases()) actual[argv.join(' ') || '(none)'] = run(argv);

if (process.env.SSHLG_GOLDEN_WRITE === '1') {
  fs.mkdirSync(path.dirname(FIXTURE), { recursive: true });
  fs.writeFileSync(FIXTURE, JSON.stringify(actual, null, 1) + '\n');
  console.log(`wrote ${path.relative(ROOT, FIXTURE)} (${Object.keys(actual).length} cases)`);
  process.exit(0);
}

const expected = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
const failures = [];
for (const key of new Set([...Object.keys(expected), ...Object.keys(actual)])) {
  try {
    assert.ok(key in actual, `case gone: ${key}`);
    assert.ok(key in expected, `new case without a fixture: ${key} (SSHLG_GOLDEN_WRITE=1 records it)`);
    assert.strictEqual(actual[key].status, expected[key].status, `exit code of \`${key}\``);
    assert.strictEqual(actual[key].out, expected[key].out, `output of \`${key}\``);
  } catch (e) { failures.push(e.message.split('\n').slice(0, 12).join('\n')); }
}
const n = Object.keys(expected).length;
if (failures.length) {
  console.log(`FAIL: cli_surface_golden — ${failures.length} of ${n} cases differ\n` + failures.join('\n---\n'));
  process.exit(1);
}
console.log(`PASS: cli_surface_golden — ${n} cases`);
