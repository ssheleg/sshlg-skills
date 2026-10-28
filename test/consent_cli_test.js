'use strict';
// A routing-block run with no terminal decides nothing (reported from a Windows install,
// 2026-10-28: an agent's run wrote opt-out markers into Codex AGENTS.md and Gemini GEMINI.md
// and recorded a permanent "no"). `--routers yes|no` carries the person's answer instead.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const BIN = path.join(__dirname, '..', 'bin', 'sshlg-skills.js');
let cases = 0;
function test(name, fn) { fn(); cases++; console.log(`ok ${name}`); }

function home() {
  const h = fs.mkdtempSync(path.join(os.tmpdir(), 'consent-cli-'));
  for (const d of ['.claude', '.codex', '.gemini']) fs.mkdirSync(path.join(h, d), { recursive: true });
  fs.writeFileSync(path.join(h, '.codex', 'AGENTS.md'), '# my codex rules\n');
  fs.writeFileSync(path.join(h, '.gemini', 'GEMINI.md'), '# my gemini rules\n');
  return h;
}
function run(h, args) {
  const env = { ...process.env, HOME: h, USERPROFILE: h };
  for (const k of ['CODEX_HOME', 'CLAUDE_CONFIG_DIR', 'XDG_CONFIG_HOME', 'XDG_STATE_HOME', 'GEMINI_CLI_HOME']) delete env[k];
  // stdin is a pipe, never a TTY: the shape of an agent or a CI runner
  return spawnSync('node', [BIN, 'routers', ...args], { env, input: '', encoding: 'utf8', timeout: 60000 });
}
const read = (h, rel) => { try { return fs.readFileSync(path.join(h, rel), 'utf8'); } catch (e) { return ''; } };
const state = (h) => { try { return JSON.parse(read(h, '.sshlg-skills/state.json')); } catch (e) { return {}; } };

test('no terminal and no answer: no block, no opt-out marker, nothing recorded, the next step named', () => {
  const h = home();
  const r = run(h, []);
  for (const f of ['.codex/AGENTS.md', '.gemini/GEMINI.md', '.claude/CLAUDE.md']) {
    assert.ok(!/SSHLG:ROUTERS/.test(read(h, f)), `${f} was written: ${read(h, f)}`);
  }
  assert.strictEqual(read(h, '.codex/AGENTS.md'), '# my codex rules\n');
  assert.strictEqual(state(h).routers, undefined);
  assert.match(r.stdout + r.stderr, /--routers yes/);
});

test('--routers yes writes the block without a terminal and records the answer', () => {
  const h = home();
  const r = run(h, ['--routers', 'yes']);
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.match(read(h, '.codex/AGENTS.md'), /SSHLG:ROUTERS:BEGIN/);
  assert.match(read(h, '.codex/AGENTS.md'), /^# my codex rules/);
  assert.strictEqual(state(h).routers, 'yes');
});

test('--routers no records the refusal the person gave', () => {
  const h = home();
  run(h, ['--routers', 'no']);
  assert.strictEqual(state(h).routers, 'no');
  assert.ok(!/SSHLG:ROUTERS:BEGIN/.test(read(h, '.codex/AGENTS.md')));
});

test('--routers with any other value refuses before anything runs', () => {
  const h = home();
  const r = run(h, ['--routers', 'maybe']);
  assert.strictEqual(r.status, 2);
  assert.strictEqual(state(h).routers, undefined);
});

test('an opted-out file under an explicit yes names the line to delete, and is left as it is', () => {
  const h = home();
  fs.writeFileSync(path.join(h, '.codex', 'AGENTS.md'), '# my codex rules\n\n<!-- SSHLG:ROUTERS:OPTOUT -->\n');
  const r = run(h, ['--routers', 'yes']);
  assert.match(r.stdout + r.stderr, /delete that line/);
  assert.strictEqual(read(h, '.codex/AGENTS.md'), '# my codex rules\n\n<!-- SSHLG:ROUTERS:OPTOUT -->\n');
});

console.log(`PASS: consent cli — ${cases} cases`);
