'use strict';
/**
 * B-166, end to end: `update` moves a family plugin that Codex holds at an old version
 * to the pin, through Codex's own CLI, and reads the loaded version back.
 *
 * The real launcher runs as a process. `npx`, `git` and `claude` are shims that log and
 * succeed — except `git ls-tree`, which reaches the real git so the pin's commit is read
 * from this checkout exactly as a run from a clone reads it. `codex` is
 * `test/fixtures/fake-codex.js`, holding its state in a temp file; HOME and CODEX_HOME are
 * sandboxes, and PATH carries no real `codex`, so the machine's own Codex is never reached.
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BIN = path.join(ROOT, 'bin', 'sshlg-skills.js');
const FAKE = path.join(__dirname, 'fixtures', 'fake-codex.js');
const SKILLS = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills.json'), 'utf8')).skills;
const bySkill = (n) => SKILLS.find((s) => s.name === n);
const PIN = bySkill('agent-sync').version;
const UX = bySkill('super-ux').version;

const REAL_GIT = (() => {
  const r = spawnSync('git', ['--version']);
  if (r.status !== 0) throw new Error('git is needed to read the pin commit');
  for (const d of (process.env.PATH || '').split(path.delimiter)) {
    if (d && fs.existsSync(path.join(d, 'git'))) return path.join(d, 'git');
  }
  return 'git';
})();
const GITLINK = (() => {
  const r = spawnSync(REAL_GIT, ['-C', ROOT, 'ls-tree', 'HEAD', 'skills/agent-sync'], { encoding: 'utf8' });
  const m = /^160000 commit ([0-9a-f]{40})\t/m.exec(r.stdout || '');
  return m ? m[1] : null;
})();

let n = 0;
const tmp = [];
const failures = [];
// Every case runs even after one fails, so a run against a tree without the fix shows
// each case's own verdict rather than the first one's.
function t(name, fn) {
  try { fn(); n++; console.log('  ok  ' + name); }
  catch (e) { failures.push(name); console.log(`FAIL  ${name}\n      ${String(e.message).split('\n')[0]}`); }
}

function sandbox(opts) {
  const o = opts || {};
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b166-'));
  tmp.push(dir);
  const home = path.join(dir, 'home');
  const codexHome = path.join(dir, 'codex');
  const shims = path.join(dir, 'shims');
  for (const d of [home, codexHome, shims]) fs.mkdirSync(d, { recursive: true });
  const log = path.join(dir, 'calls.log');
  for (const name of ['npx', 'claude']) {
    fs.writeFileSync(path.join(shims, name), `#!/bin/sh\necho "${name} $@" >> "${log}"\nexit 0\n`, { mode: 0o755 });
  }
  fs.writeFileSync(path.join(shims, 'git'),
    `#!/bin/sh\nif [ "$3" = "ls-tree" ]; then exec "${REAL_GIT}" "$@"; fi\necho "git $@" >> "${log}"\nexit 0\n`,
    { mode: 0o755 });
  if (o.codex !== false) {
    fs.writeFileSync(path.join(shims, 'codex'), `#!/bin/sh\nexec "${process.execPath}" "${FAKE}" "$@"\n`, { mode: 0o755 });
  }
  const state = {
    prefix: 'model = "gpt-5"\n\n[marketplaces.other-mk]\nsource_type = "git"\nsource = "https://github.com/someone/other-mk.git"\nref = "v9"\n\n',
    marketplaces: {
      'agent-sync': { source: 'https://github.com/ssheleg/agent-sync.git', ref: 'v1.21.7' },
      'super-ux': { source: 'https://github.com/ssheleg/super-ux.git', ref: `v${UX}` },
    },
    cache: { 'agent-sync@agent-sync': '1.21.7', 'super-ux@super-ux': UX, 'foo@other-mk': '9.0.0' },
    enabled: { 'agent-sync@agent-sync': true, 'super-ux@super-ux': true, 'foo@other-mk': true },
    catalog: {
      'agent-sync': { 'v1.21.7': '1.21.7', [`v${PIN}`]: PIN, HEAD: PIN },
      'super-ux': { [`v${UX}`]: UX },
      'make-skill': { HEAD: '0.31.0' },
    },
    calls: [],
  };
  if (GITLINK) state.catalog['agent-sync'][GITLINK] = PIN;
  (o.edit || (() => {}))(state);
  const statePath = path.join(dir, 'codex-state.json');
  fs.writeFileSync(statePath, JSON.stringify(state));
  if (o.config !== false) {
    // Written the way Codex writes it. The non-family marketplace sits in the prefix, so it
    // is in config.toml but never in the fake's own tables: nothing the hub does reaches it
    // except through the file it reads.
    const tables = Object.entries(state.marketplaces).map(([k, m]) =>
      `[marketplaces.${k}]\nsource_type = "git"\nsource = "${m.source}"\n${m.ref ? `ref = "${m.ref}"\n` : ''}`);
    fs.writeFileSync(path.join(codexHome, 'config.toml'), state.prefix + tables.join('\n'));
  }
  return { dir, home, codexHome, shims, statePath, log };
}

function runUpdate(sb, args, env) {
  const r = spawnSync(process.execPath, [BIN, 'update'].concat(args), {
    cwd: ROOT, encoding: 'utf8', timeout: 180000, stdin: 'ignore',
    env: Object.assign({
      HOME: sb.home, CODEX_HOME: sb.codexHome, FAKE_CODEX_STATE: sb.statePath, NO_COLOR: '1',
      PATH: [sb.shims, path.dirname(process.execPath), '/usr/bin', '/bin'].join(path.delimiter),
    }, env || {}),
  });
  return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}

const state = (sb) => JSON.parse(fs.readFileSync(sb.statePath, 'utf8'));
const mutating = (sb) => state(sb).calls.filter((c) => !/^(--version|plugin list)/.test(c));

t('an old family plugin moves to the pin, and the readback is what says current', () => {
  const sb = sandbox();
  const r = runUpdate(sb, ['--agent', 'codex']);
  assert.strictEqual(r.status, 0, r.out.slice(-1500));
  const s = state(sb);
  assert.strictEqual(s.cache['agent-sync@agent-sync'], PIN, 'Codex still holds the old version');
  const ref = GITLINK || `v${PIN}`;
  assert.deepStrictEqual(mutating(sb), [
    'plugin marketplace remove agent-sync',
    `plugin marketplace add https://github.com/ssheleg/agent-sync.git --ref ${ref}`,
    'plugin add agent-sync@agent-sync',
  ]);
  assert.ok(new RegExp(`agent-sync@agent-sync: 1\\.21\\.7 → ${PIN.replace(/\./g, '\\.')} — current \\(read back`).test(r.out), r.out.slice(-1500));
  const cfg = fs.readFileSync(path.join(sb.codexHome, 'config.toml'), 'utf8');
  assert.ok(cfg.includes(`ref = "${ref}"`), 'config.toml does not record the pin ref');
});

t('a checkout re-adds at the pin COMMIT, not at the tag', () => {
  if (!GITLINK) { console.log('    (not a git checkout with gitlinks — the tag path is the one exercised)'); return; }
  const sb = sandbox();
  runUpdate(sb, ['--agent', 'codex']);
  assert.ok(mutating(sb).includes(`plugin marketplace add https://github.com/ssheleg/agent-sync.git --ref ${GITLINK}`));
});

t('a non-family marketplace, a plugin already at the pin and one not installed are left alone', () => {
  const sb = sandbox();
  runUpdate(sb, ['--agent', 'codex']);
  const calls = mutating(sb);
  assert.ok(!calls.some((c) => c.includes('other-mk')), `touched other-mk: ${calls}`);
  assert.ok(!calls.some((c) => c.includes('super-ux')), `touched super-ux, already at its pin: ${calls}`);
  assert.ok(!calls.some((c) => c.includes('make-skill')), `installed make-skill into Codex: ${calls}`);
  assert.strictEqual(state(sb).cache['foo@other-mk'], '9.0.0');
  assert.ok(fs.readFileSync(path.join(sb.codexHome, 'config.toml'), 'utf8').includes('[marketplaces.other-mk]'));
});

t('a failure in step 3 rolls the marketplace back to the ref recorded before the removal', () => {
  const sb = sandbox();
  const r = runUpdate(sb, ['--agent', 'codex'], { FAKE_CODEX_FAIL: 'plugin add agent-sync@agent-sync' });
  assert.strictEqual(r.status, 1, 'a failed Codex step must fail the run');
  assert.ok(/agent-sync@agent-sync: FAILED plugin add — /.test(r.out), r.out.slice(-1500));
  assert.ok(/rollback: marketplace agent-sync restored at v1\.21\.7/.test(r.out), r.out.slice(-1500));
  const s = state(sb);
  assert.deepStrictEqual(s.marketplaces['agent-sync'],
    { source: 'https://github.com/ssheleg/agent-sync.git', ref: 'v1.21.7' });
  assert.strictEqual(s.cache['agent-sync@agent-sync'], '1.21.7');
  assert.ok(/FAILED \d+ of \d+ steps[\s\S]*codex plugin add agent-sync@agent-sync/.test(r.out),
    'the closing summary does not name the failed Codex command');
});

t('a rollback that fails too prints the exact commands that restore the marketplace', () => {
  const sb = sandbox();
  const r = runUpdate(sb, ['--agent', 'codex'],
    { FAKE_CODEX_FAIL: 'plugin marketplace add', FAKE_CODEX_FAIL_TIMES: '2' });
  assert.strictEqual(r.status, 1);
  assert.ok(/agent-sync@agent-sync: FAILED marketplace add — /.test(r.out), r.out.slice(-1500));
  assert.ok(/rollback FAILED rollback marketplace add/.test(r.out), r.out.slice(-1500));
  assert.ok(r.out.includes('codex plugin marketplace add https://github.com/ssheleg/agent-sync.git --ref v1.21.7'));
  assert.ok(r.out.includes('codex plugin add agent-sync@agent-sync'));
});

t('a family-named marketplace from another source is not touched', () => {
  const sb = sandbox({ edit: (s) => { s.marketplaces['agent-sync'].source = '/Users/dev/agent-sync'; } });
  const r = runUpdate(sb, ['--agent', 'codex']);
  assert.strictEqual(r.status, 0, r.out.slice(-1500));
  assert.deepStrictEqual(mutating(sb), []);
  assert.ok(/agent-sync@agent-sync: left alone — marketplace source is \/Users\/dev\/agent-sync/.test(r.out));
});

t('a plugin the operator disabled is not refreshed', () => {
  const sb = sandbox({ edit: (s) => { s.enabled['agent-sync@agent-sync'] = false; } });
  const r = runUpdate(sb, ['--agent', 'codex']);
  assert.deepStrictEqual(mutating(sb), []);
  assert.ok(/agent-sync@agent-sync: left alone — disabled in Codex/.test(r.out));
});

t('Codex absent: skipped with a named reason, exit 0', () => {
  const sb = sandbox({ codex: false });
  const r = runUpdate(sb, ['--agent', 'codex']);
  assert.strictEqual(r.status, 0, r.out.slice(-1500));
  assert.ok(/Codex plugins ==\n  skipped: codex is not on PATH/.test(r.out), r.out.slice(-1500));
});

t('no Codex config: skipped without spawning codex', () => {
  const sb = sandbox({ config: false });
  const r = runUpdate(sb, ['--agent', 'codex']);
  assert.ok(/skipped: no Codex config at /.test(r.out), r.out.slice(-1500));
  assert.deepStrictEqual(state(sb).calls, []);
});

t('--claude-only and an --agent list without codex leave Codex out of scope', () => {
  for (const args of [['--claude-only'], ['--agent', 'cursor']]) {
    const sb = sandbox();
    const r = runUpdate(sb, args);
    assert.deepStrictEqual(state(sb).calls, [], `${args}: codex was called`);
    assert.ok(/Codex plugins ==\n  skipped: --(claude-only|agent cursor)/.test(r.out), r.out.slice(-1200));
  }
});

t('--dry-run lists the Codex commands and runs none of them', () => {
  const sb = sandbox();
  const r = runUpdate(sb, ['--agent', 'codex', '--dry-run']);
  assert.strictEqual(r.status, 0, r.out.slice(-1500));
  assert.deepStrictEqual(state(sb).calls, [], 'dry-run called codex');
  assert.ok(!fs.existsSync(sb.log) || !fs.readFileSync(sb.log, 'utf8').trim(), 'dry-run ran a subprocess');
  assert.ok(r.out.includes(`codex plugin marketplace add https://github.com/ssheleg/agent-sync.git --ref v${PIN}`), r.out.slice(-2500));
  assert.ok(r.out.includes('codex plugin marketplace remove agent-sync'));
  assert.ok(!r.out.includes('remove other-mk'));
});

for (const d of tmp) fs.rmSync(d, { recursive: true, force: true });
if (failures.length) {
  console.log(`\nFAIL: codex native e2e — ${failures.length} of ${failures.length + n} cases`);
  process.exit(1);
}
console.log('\nPASS: codex native e2e — ' + n + ' cases');
