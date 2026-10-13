'use strict';
// lib/codexplugins.js — Codex's native plugins through Codex's own CLI (B-166).
// Pure parts and the step machine, driven by a scripted runner; no codex is spawned.
const assert = require('assert');
const cp = require('../lib/codexplugins.js');

let n = 0;
function t(name, fn) { fn(); n++; console.log('  ok  ' + name); }

// The three spellings Codex 0.162.1 wrote into one real config.toml on 2026-10-12.
const CONFIG = [
  'model = "gpt-5"',
  '["marketplaces"]',
  '',
  '["marketplaces".openai-bundled]',
  'source_type = "local"',
  'source = "/x/openai-bundled"',
  '',
  '["marketplaces"."web3d-dev"]',
  '"source_type" = "git"',
  '"source" = "https://github.com/ssheleg/web3d-dev.git"',
  '',
  '["marketplaces".agent-sync]',
  'source_type = "git"',
  'source = "https://github.com/ssheleg/agent-sync.git"',
  'ref = "517b4b6960a4288e2d72939a7a727d9f4bfb9a75" # pinned',
  '',
  '[marketplaces.make-skill]',
  "source_type = 'git'",
  'source = "https://github.com/ssheleg/make-skill"',
  'ref = "v0.30.1"',
  'sparse_paths = ["plugins/make-skill"]',
  '',
  '[plugins."agent-sync@agent-sync"]',
  'enabled = true',
  'ref = "not-a-marketplace-key"',
].join('\n');

const SKILLS = [
  { name: 'agent-sync', repo: 'ssheleg/agent-sync', pluginInstall: 'agent-sync@agent-sync', version: '1.22.0' },
  { name: 'web3d-dev', repo: 'ssheleg/web3d-dev', pluginInstall: 'web3d-dev@web3d-dev', version: '0.1.3' },
  { name: 'make-skill', repo: 'ssheleg/make-skill', pluginInstall: 'make-skill@make-skill', version: '0.31.0' },
  { name: 'sheleg-design', repo: 'ssheleg/sheleg-design-skill', pluginInstall: 'sheleg-design@sheleg-design-skill', version: '1.64.1' },
];

t('config.toml: every quoting Codex writes is read, and other tables end a marketplace', () => {
  const m = cp.readMarketplaces(CONFIG);
  assert.deepStrictEqual(m.get('web3d-dev'),
    { name: 'web3d-dev', other: [], source_type: 'git', source: 'https://github.com/ssheleg/web3d-dev.git' });
  assert.strictEqual(m.get('agent-sync').ref, '517b4b6960a4288e2d72939a7a727d9f4bfb9a75', 'a trailing comment leaked into the ref');
  assert.strictEqual(m.get('make-skill').source_type, 'git', 'a single-quoted literal was not read');
  assert.deepStrictEqual(m.get('make-skill').other, ['sparse_paths']);
  assert.strictEqual(m.get('openai-bundled').source_type, 'local');
  assert.ok(!m.has('plugins'), 'the [plugins] table was read as a marketplace');
  assert.strictEqual(m.get('agent-sync').other.length, 0, 'a key from the next table was attributed to agent-sync');
});

t('config.toml: absent or non-text is an empty map, not a throw', () => {
  assert.strictEqual(cp.readMarketplaces(null).size, 0);
  assert.strictEqual(cp.readMarketplaces('').size, 0);
});

t('sources compare across https, .git, ssh and the owner/repo shorthand', () => {
  const want = cp.normalizeSource('https://github.com/ssheleg/agent-sync.git');
  for (const s of ['https://github.com/ssheleg/agent-sync', 'git@github.com:ssheleg/agent-sync.git',
    'ssheleg/agent-sync', 'https://GitHub.com/ssheleg/agent-sync/', 'ssh://git@github.com/ssheleg/agent-sync.git']) {
    assert.strictEqual(cp.normalizeSource(s), want, s);
  }
  assert.notStrictEqual(cp.normalizeSource('https://github.com/someone/agent-sync.git'), want);
  assert.notStrictEqual(cp.normalizeSource('/Users/dev/agent-sync'), want);
});

t('plugin list: the JSON form', () => {
  const m = cp.parsePluginList(JSON.stringify({ installed: [
    { pluginId: 'agent-sync@agent-sync', version: '1.21.7', installed: true, enabled: true },
    { pluginId: 'x@y', version: '2', installed: true, enabled: false },
  ], available: [] }));
  assert.deepStrictEqual(m.get('agent-sync@agent-sync'), { version: '1.21.7', installed: true, enabled: true });
  assert.strictEqual(m.get('x@y').enabled, false);
});

t('plugin list: the table form, as Codex 0.162.1 prints it', () => {
  const m = cp.parsePluginList([
    'Marketplace `agent-sync`',
    '/x/.claude-plugin/marketplace.json',
    '',
    'PLUGIN                 STATUS              VERSION  SOURCE',
    'agent-sync@agent-sync  installed, enabled  1.22.0   /x/plugins/agent-sync',
    'latex@openai-bundled   not installed                /x/plugins/latex',
  ].join('\n'));
  assert.deepStrictEqual(m.get('agent-sync@agent-sync'), { version: '1.22.0', installed: true, enabled: true });
  assert.deepStrictEqual(m.get('latex@openai-bundled'), { version: null, installed: false, enabled: false });
});

t('plugin list: output nobody can read is null, never an empty list', () => {
  assert.strictEqual(cp.parsePluginList('Error: duplicate key at 517:11'), null);
  assert.strictEqual(cp.parsePluginList(''), null);
});

function listed(entries) { return new Map(Object.entries(entries)); }
const pinRef = (s) => ({ ref: `v${s.version}`, kind: 'tag' });

t('plan: behind → refresh with the previous ref recorded; at pin → current; absent → absent', () => {
  const items = cp.planRefresh({ skills: SKILLS, marketplaces: cp.readMarketplaces(CONFIG), pinRef,
    listed: listed({
      'agent-sync@agent-sync': { version: '1.21.7', installed: true, enabled: true },
      'web3d-dev@web3d-dev': { version: '0.1.3', installed: true, enabled: true },
    }) });
  const by = Object.fromEntries(items.map((i) => [i.member, i]));
  assert.strictEqual(by['agent-sync'].action, 'refresh');
  assert.deepStrictEqual(by['agent-sync'].prev,
    { source: 'https://github.com/ssheleg/agent-sync.git', ref: '517b4b6960a4288e2d72939a7a727d9f4bfb9a75' });
  assert.strictEqual(by['agent-sync'].ref, 'v1.22.0');
  assert.strictEqual(by['agent-sync'].url, 'https://github.com/ssheleg/agent-sync.git');
  assert.strictEqual(by['web3d-dev'].action, 'current');
  assert.strictEqual(by['make-skill'].action, 'absent', 'a plugin Codex does not have was planned');
  assert.strictEqual(by['sheleg-design'].marketplace, 'sheleg-design-skill');
});

t('plan: unsafe cases are skipped with a reason — disabled, no table, foreign source, unrestorable keys', () => {
  const text = CONFIG + '\n\n[marketplaces.sheleg-design-skill]\nsource_type = "local"\nsource = "/dev/sheleg-design"\n';
  const items = cp.planRefresh({ skills: SKILLS.concat([
    { name: 'ghost', repo: 'ssheleg/ghost', pluginInstall: 'ghost@ghost', version: '1.0.0' }]),
  marketplaces: cp.readMarketplaces(text), pinRef,
  listed: listed({
    'agent-sync@agent-sync': { version: '1.0.0', installed: true, enabled: false },
    'make-skill@make-skill': { version: '0.30.1', installed: true, enabled: true },
    'sheleg-design@sheleg-design-skill': { version: '1.0.0', installed: true, enabled: true },
    'ghost@ghost': { version: '0.9.0', installed: true, enabled: true },
  }) });
  const why = Object.fromEntries(items.filter((i) => i.action === 'skip').map((i) => [i.member, i.why]));
  assert.ok(/disabled/.test(why['agent-sync']));
  assert.ok(/sparse_paths/.test(why['make-skill']));
  assert.ok(/not the family repository/.test(why['sheleg-design']));
  assert.ok(/previous ref\s+cannot be recorded/.test(why.ghost));
  assert.ok(!items.some((i) => i.action === 'refresh'));
});

t('plan: --member narrows to that member', () => {
  const items = cp.planRefresh({ skills: SKILLS, marketplaces: cp.readMarketplaces(CONFIG), pinRef,
    listed: listed({}), only: 'web3d-dev' });
  assert.deepStrictEqual(items.map((i) => i.member), ['web3d-dev']);
});

/** A scripted codex holding one plugin; `fail(line, calls)` makes a call exit 1. */
function scripted(versionAfter, fail) {
  const calls = [];
  let version = '1.21.7';
  let pending = null;
  const runner = (cmd, args) => {
    assert.strictEqual(cmd, 'codex');
    const line = args.join(' ');
    calls.push(line);
    if (fail && fail(line, calls)) return { status: 1, stdout: '', stderr: `Error: no ${line}` };
    if (line.startsWith('plugin marketplace add')) pending = line.includes('--ref v1.21.7') ? '1.21.7' : versionAfter;
    if (line.startsWith('plugin add')) version = pending;
    if (line === 'plugin list --json') {
      return { status: 0, stdout: JSON.stringify({ installed: [
        { pluginId: 'agent-sync@agent-sync', version, installed: true, enabled: true }] }) };
    }
    return { status: 0, stdout: 'ok\n', stderr: '' };
  };
  return { runner, calls };
}
const ITEM = { member: 'agent-sync', pluginId: 'agent-sync@agent-sync', marketplace: 'agent-sync', pin: '1.22.0',
  from: '1.21.7', url: 'https://github.com/ssheleg/agent-sync.git', ref: 'v1.22.0', refKind: 'tag',
  prev: { source: 'https://github.com/ssheleg/agent-sync.git', ref: 'v1.21.7' }, action: 'refresh' };

t('refresh: native mutation is deferred with no commands or false current claim', () => {
  const s = scripted('1.22.0');
  const r = cp.refreshOne(ITEM, s.runner);
  assert.strictEqual(r.status, 'deferred');
  assert.strictEqual(r.code, 'DEFERRED_ACTIVE_GENERATION_SAFETY');
  assert.strictEqual(r.catalogVersion, '1.21.7');
  assert.strictEqual(r.threadLoadedVersion, 'unknown');
  assert.deepStrictEqual(s.calls, []);
  assert.deepStrictEqual(cp.refreshCommands(ITEM), []);
  assert.ok(cp.resultLines(r).join('\n').includes(r.code));
});

t('refresh: injected unsupported capability or active-process assertion cannot bypass admission', () => {
  for (const extra of [{ activeSessions: 0 }, { force: true }, { runtime: 'codex-cli 999.0.0' }, { safe: true }]) {
    const s = scripted('1.22.0');
    assert.strictEqual(cp.refreshOne({ ...ITEM, ...extra }, s.runner).status, 'deferred');
    assert.deepStrictEqual(s.calls, []);
  }
});

t('refreshAll: no config → skipped without spawning anything', () => {
  let spawned = 0;
  const out = cp.refreshAll({ skills: SKILLS, readConfig: () => null, runner: () => { spawned++; }, pinRef });
  assert.strictEqual(out.status, 'skipped');
  assert.strictEqual(spawned, 0);
});

t('refreshAll: codex missing → skipped with the reason named', () => {
  const out = cp.refreshAll({ skills: SKILLS, readConfig: () => CONFIG, pinRef,
    runner: () => ({ status: null, error: new Error('spawnSync codex ENOENT') }) });
  assert.strictEqual(out.status, 'skipped');
  assert.ok(/not on PATH/.test(out.why));
});

t('refreshAll: a Codex that cannot load its config is unread; one without the CLI is unsupported', () => {
  const broken = cp.refreshAll({ skills: SKILLS, readConfig: () => CONFIG, pinRef,
    runner: (c, a) => (a[0] === '--version' ? { status: 0, stdout: 'codex-cli 0.162.1' }
      : { status: 1, stdout: '', stderr: 'Error: duplicate key at 517:11' }) });
  assert.strictEqual(broken.status, 'unread');
  assert.ok(/duplicate key/.test(broken.why));
  const old = cp.refreshAll({ skills: SKILLS, readConfig: () => CONFIG, pinRef,
    runner: (c, a) => (a[0] === '--version' ? { status: 0, stdout: 'codex-cli 0.40.0' }
      : { status: 2, stdout: '', stderr: "error: unrecognized subcommand 'plugin'" }) });
  assert.strictEqual(old.status, 'unsupported');
});

t('refreshAll: the table form is read when --json is refused', () => {
  const s = scripted('1.22.0');
  const runner = (c, a) => {
    const l = a.join(' ');
    if (l === '--version') return { status: 0 };
    if (l === 'plugin list --json') return { status: 2, stderr: "error: unexpected argument '--json' found" };
    if (l === 'plugin list') {
      return { status: 0, stdout: 'PLUGIN  STATUS  VERSION  SOURCE\nagent-sync@agent-sync  installed, enabled  1.21.7  /x\n' };
    }
    return s.runner(c, a);
  };
  const out = cp.refreshAll({ skills: SKILLS, readConfig: () => CONFIG, pinRef, runner });
  assert.strictEqual(out.status, 'ran');
  assert.strictEqual(out.items.find((i) => i.member === 'agent-sync').action, 'refresh');
});

console.log('\nPASS: codexplugins — ' + n + ' cases');
