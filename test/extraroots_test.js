#!/usr/bin/env node
'use strict';
// B-216: family skill links in host roots outside the default agent set.
//
// The skills CLI 1.7.2 links skills into ~/.qwen/skills (qwen-code), $XDG_CONFIG_HOME/devin/skills
// (devin), ~/.factory/skills (droid) and $GROK_HOME/skills (grok) when an interactive run selected
// them (dist/cli.mjs agent table). `update` adds members only for its default agents, so those
// roots drifted: ~/.factory/skills held 27 of 39 family links on the operator machine. Now
// `update` refreshes a root whose host is installed through the same `skills add` steps (one more
// `--agent`), reports a root whose host is absent with the exact remedy, and removes only DANGLING
// links it can attribute to the family. Foreign entries and real directories are never removed.
//
// Every fixture is a temp HOME; nothing reads or writes the real one.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const X = require('../lib/extraroots.js');
const manifest = require('../skills.json');

const ROOT = path.join(__dirname, '..');
const BIN = path.join(ROOT, 'bin', 'sshlg-skills.js');
let checks = 0;
const failures = [];
function it(name, fn) { checks += 1; try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); } }
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-extraroots-'));

const FAMILY = ['task-pipeline', 'make-skill', 'ux-flows'];
const SHARED = '/h/.agents/skills';
const link = (name, to, live = true) => ({ name, isSymlink: true, target: to, live, isDir: live });

// ── Pure: where each host keeps its skills ──

it('the four roots are where skills@1.7.2 puts them, with XDG_CONFIG_HOME and GROK_HOME honoured', () => {
  const by = (env) => Object.fromEntries(X.hosts('/h', env).map((h) => [h.agent, h.dir]));
  assert.deepStrictEqual(by({}), {
    'qwen-code': '/h/.qwen/skills', devin: '/h/.config/devin/skills', droid: '/h/.factory/skills', grok: '/h/.grok/skills' });
  const moved = by({ XDG_CONFIG_HOME: '/x', GROK_HOME: '/g' });
  assert.strictEqual(moved.devin, '/x/devin/skills');
  assert.strictEqual(moved.grok, '/g/skills');
  for (const h of X.hosts('/h', {})) assert.ok(manifest.defaultAgents.indexOf(h.agent) === -1, `${h.agent} is a default agent`);
});

// ── Pure: what a root holds ──

it('assess: live family links, family copies, missing ids, foreign entries', () => {
  const a = X.assess({
    entries: [
      link('task-pipeline', `${SHARED}/task-pipeline`),
      { name: 'make-skill', isSymlink: false, target: null, live: true, isDir: true },
      link('someone-else', `${SHARED}/someone-else`),
    ],
    familyIds: FAMILY, lock: {}, sharedRoot: SHARED,
  });
  assert.deepStrictEqual(a.linked, ['task-pipeline']);
  assert.deepStrictEqual(a.copies, ['make-skill']);
  assert.deepStrictEqual(a.missing, ['ux-flows']);
  assert.deepStrictEqual(a.stale, []);
  assert.strictEqual(a.foreign, 1);
});

it('assess: a dangling link is stale only when the family owns it and it points into the shared store', () => {
  const a = X.assess({
    entries: [
      link('ux-flows', `${SHARED}/ux-flows`, false),             // family id, dangling: ours
      link('old-member', `${SHARED}/old-member`, false),         // retired, lock says ssheleg/: ours
      link('their-skill', `${SHARED}/their-skill`, false),       // dangling, not attributed: kept
      link('make-skill', '/elsewhere/make-skill', false),        // family name, points elsewhere: kept
    ],
    familyIds: FAMILY, lock: { 'old-member': 'ssheleg/old-member', 'their-skill': 'acme/skills' }, sharedRoot: SHARED,
  });
  assert.deepStrictEqual(a.stale.map((s) => s.name), ['old-member', 'ux-flows']);
  assert.deepStrictEqual(a.danglingKept.map((s) => s.name), ['make-skill', 'their-skill']);
});

// ── Pure: what update does with each root ──

const assessed = (over) => Object.assign({ linked: ['task-pipeline'], copies: [], missing: ['make-skill', 'ux-flows'], stale: [], danglingKept: [], foreign: 0 }, over);
const host = (agent) => X.hosts('/h', {}).find((h) => h.agent === agent);

it('decide: an installed host is refreshed through the same skills-add steps', () => {
  const d = X.decide({ host: host('qwen-code'), assessed: assessed(), installed: true, scope: { agents: null } });
  assert.strictEqual(d.action, 'refresh');
  assert.strictEqual(d.addAgent, 'qwen-code');
});

it('decide: an absent host is reported with the exact remedy, not written', () => {
  const d = X.decide({ host: host('droid'), assessed: assessed(), installed: false, scope: { agents: null } });
  assert.strictEqual(d.action, 'report');
  assert.strictEqual(d.addAgent, null);
  const text = d.lines.join('\n');
  assert.ok(text.includes('npx sshlg-skills update --agent droid'), text);
  assert.ok(text.includes("cd '/h/.factory/skills' && rm -- 'task-pipeline'"), text);
  assert.ok(/missing 2: make-skill, ux-flows/.test(text), text);
});

it('decide: the remove command names only symlinks, never a copy', () => {
  const d = X.decide({ host: host('droid'), assessed: assessed({ copies: ['make-skill'] }), installed: false, scope: { agents: null } });
  const rm = d.lines.find((l) => l.includes('rm '));
  assert.ok(rm && !rm.includes('make-skill'), rm);
});

it('decide: `--agent droid` (the printed remedy) refreshes the root in that run, without a second --agent', () => {
  const d = X.decide({ host: host('droid'), assessed: assessed(), installed: false, scope: { agents: ['droid'] } });
  assert.strictEqual(d.action, 'refresh');
  assert.strictEqual(d.addAgent, null);
  assert.ok(!d.lines.join('\n').includes('not installed'), d.lines.join('\n'));
});

it('decide: stale links are removed in either case; a root with no family entry is left alone', () => {
  const stale = [{ name: 'ux-flows', path: '/h/.factory/skills/ux-flows', target: `${SHARED}/ux-flows` }];
  const d = X.decide({ host: host('droid'), assessed: assessed({ stale }), installed: false, scope: { agents: null } });
  assert.deepStrictEqual(d.prune, ['/h/.factory/skills/ux-flows']);
  const none = X.decide({ host: host('grok'), assessed: assessed({ linked: [], missing: FAMILY }), installed: true, scope: { agents: null } });
  assert.strictEqual(none.action, 'none');
  assert.deepStrictEqual(none.prune, []);
});

it('decide: out of an --agent scope that does not name it, or under --claude-only, nothing happens', () => {
  for (const scope of [{ agents: ['cursor'] }, { claudeOnly: true }]) {
    const d = X.decide({ host: host('qwen-code'), assessed: assessed({ stale: [{ name: 'x', path: '/p', target: '/t' }] }), installed: true, scope });
    assert.strictEqual(d.action, 'out-of-scope', JSON.stringify(scope));
    assert.deepStrictEqual(d.prune, []);
  }
  const named = X.decide({ host: host('qwen-code'), assessed: assessed(), installed: true, scope: { agents: ['qwen-code'] } });
  assert.strictEqual(named.action, 'refresh');
  assert.strictEqual(named.addAgent, null, 'already in the run: no second --agent');
});

// ── B-262: an acknowledged root prints one line until its contents change ──

it('B-262: assess fingerprints what the folder holds, independent of listing order', () => {
  const a = [link('task-pipeline', `${SHARED}/task-pipeline`), { name: 'theirs', isSymlink: false, isDir: true, live: true }];
  const f1 = X.assess({ entries: a, familyIds: FAMILY, sharedRoot: SHARED }).fingerprint;
  assert.match(f1, /^[0-9a-f]{64}$/);
  assert.strictEqual(X.assess({ entries: a.slice().reverse(), familyIds: FAMILY, sharedRoot: SHARED }).fingerprint, f1);
  const added = a.concat([link('make-skill', `${SHARED}/make-skill`)]);
  assert.notStrictEqual(X.assess({ entries: added, familyIds: FAMILY, sharedRoot: SHARED }).fingerprint, f1, 'a new link is a change');
  const moved = [link('task-pipeline', '/elsewhere/task-pipeline'), a[1]];
  assert.notStrictEqual(X.assess({ entries: moved, familyIds: FAMILY, sharedRoot: SHARED }).fingerprint, f1, 'a new target is a change');
});

it('B-262: an unacknowledged report names how to acknowledge it', () => {
  const d = X.decide({ host: host('droid'), assessed: assessed({ fingerprint: 'f' }), installed: false, scope: { agents: null } });
  assert.ok(d.lines.join('\n').includes('npx sshlg-skills config set extraRoots.droid ack'), d.lines.join('\n'));
  assert.strictEqual(d.fingerprint, 'f');
});

it('B-262: an acknowledged, unchanged root is one line; a changed one is the full report again', () => {
  const ack = { fingerprint: 'f', at: '2026-10-27', entries: 1 };
  const same = X.decide({ host: host('droid'), assessed: assessed({ fingerprint: 'f' }), installed: false, scope: { agents: null }, ack });
  assert.strictEqual(same.action, 'report');
  assert.strictEqual(same.lines.length, 1, same.lines.join('\n'));
  assert.match(same.lines[0], /^droid \/h\/\.factory\/skills: acknowledged 2026-10-27, unchanged \(1 family entry\)/);
  assert.ok(same.lines[0].includes('config set extraRoots.droid default'), same.lines[0]);
  const changed = X.decide({ host: host('droid'), assessed: assessed({ fingerprint: 'g' }), installed: false, scope: { agents: null }, ack });
  assert.ok(changed.lines.length > 2, changed.lines.join('\n'));
  assert.match(changed.lines.join('\n'), /changed since it was acknowledged on 2026-10-27/);
  assert.ok(changed.lines.join('\n').includes('npx sshlg-skills update --agent droid'));
});

it('B-262: an acknowledgement changes neither a refresh nor the removal of a stale link', () => {
  const ack = { fingerprint: 'f', at: '2026-10-27', entries: 1 };
  const stale = [{ name: 'ux-flows', path: '/h/.factory/skills/ux-flows', target: `${SHARED}/ux-flows` }];
  const d = X.decide({ host: host('droid'), assessed: assessed({ fingerprint: 'f', stale }), installed: false, scope: { agents: null }, ack });
  assert.deepStrictEqual(d.prune, ['/h/.factory/skills/ux-flows']);
  const r = X.decide({ host: host('qwen-code'), assessed: assessed({ fingerprint: 'f' }), installed: true, scope: { agents: null }, ack });
  assert.strictEqual(r.action, 'refresh');
  assert.ok(!/acknowledged/.test(r.lines.join('\n')));
});

// ── End to end through the launcher, on a temp HOME ──

function machine() {
  const base = tmp();
  const home = path.join(base, 'home');
  const shims = path.join(base, 'bin');
  fs.mkdirSync(shims, { recursive: true });
  const calls = path.join(base, 'npx.calls');
  fs.writeFileSync(path.join(shims, 'npx'), `#!/bin/sh\necho "$@" >> "${calls}"\nexit 0\n`, { mode: 0o755 });
  for (const n of ['git', 'claude', 'codex']) fs.writeFileSync(path.join(shims, n), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  const shared = path.join(home, '.agents', 'skills');
  for (const id of FAMILY) {
    fs.mkdirSync(path.join(shared, id), { recursive: true });
    fs.writeFileSync(path.join(shared, id, 'SKILL.md'), `---\nname: ${id}\ndescription: x\n---\n`);
  }
  fs.writeFileSync(path.join(home, '.agents', '.skill-lock.json'), JSON.stringify({ version: 3, skills: {
    'old-member': { source: 'ssheleg/old-member' }, 'their-skill': { source: 'acme/skills' } } }));
  const rel = (root, id) => path.relative(root, path.join(shared, id));
  // Qwen is installed (its settings file), and its root misses one family link.
  const qwen = path.join(home, '.qwen', 'skills');
  fs.mkdirSync(qwen, { recursive: true });
  fs.writeFileSync(path.join(home, '.qwen', 'settings.json'), '{}');
  fs.symlinkSync(rel(qwen, 'task-pipeline'), path.join(qwen, 'task-pipeline'));
  // Droid is absent: only its skills folder, with a partial set, a stale family link and foreign entries.
  const factory = path.join(home, '.factory', 'skills');
  fs.mkdirSync(factory, { recursive: true });
  fs.symlinkSync(rel(factory, 'task-pipeline'), path.join(factory, 'task-pipeline'));
  fs.symlinkSync(rel(factory, 'old-member'), path.join(factory, 'old-member'));
  fs.symlinkSync(rel(factory, 'their-skill'), path.join(factory, 'their-skill'));
  fs.mkdirSync(path.join(factory, 'make-skill'));                        // a real directory: never removed
  fs.writeFileSync(path.join(factory, 'make-skill', 'SKILL.md'), 'mine');
  const env = {
    HOME: home, SSHLG_SKILLS_NO_UPDATE_CHECK: '1', NO_COLOR: '1', XDG_CONFIG_HOME: path.join(home, '.config'),
    PATH: [shims, path.dirname(process.execPath), '/usr/bin', '/bin'].join(path.delimiter),
  };
  const run = (...args) => {
    const r = spawnSync(process.execPath, [BIN, ...args], { cwd: ROOT, env, encoding: 'utf8', timeout: 180000, stdin: 'ignore' });
    return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
  };
  const npxCalls = () => (fs.existsSync(calls) ? fs.readFileSync(calls, 'utf8') : '');
  return { home, qwen, factory, run, npxCalls };
}

const M = machine();
const exists = (p) => { try { fs.lstatSync(p); return true; } catch (e) { return false; } };

it('update --dry-run plans --agent qwen-code and the stale link, and changes nothing', () => {
  const r = M.run('update', '--dry-run');
  assert.strictEqual(r.status, 0, r.out.slice(-2000));
  assert.ok(/skills@1.7.2 add \S+ (?:--agent \S+ )*--agent qwen-code/.test(r.out), r.out.slice(0, 3000));
  assert.ok(!/--agent droid/.test(r.out), 'droid is absent: no install for it');
  assert.ok(r.out.includes(path.join(M.factory, 'old-member')), r.out.slice(-3000));
  assert.ok(exists(path.join(M.factory, 'old-member')), 'the dry run removed a link');
  assert.strictEqual(M.npxCalls(), '', 'the dry run ran npx');
});

it('update --agent cursor leaves the other roots alone', () => {
  const r = M.run('update', '--no-claude', '--agent', 'cursor');
  assert.ok(!/--agent qwen-code/.test(M.npxCalls()), M.npxCalls());
  assert.ok(exists(path.join(M.factory, 'old-member')), r.out.slice(-2000));
});

it('update refreshes Qwen, reports Droid with its remedy, removes only the stale family link', () => {
  const r = M.run('update', '--no-claude');
  const sect = r.out.slice(r.out.indexOf('== Family links in other host roots'));
  assert.ok(r.out.includes('== Family links in other host roots'), r.out.slice(-3000));
  assert.ok(/--agent qwen-code/.test(M.npxCalls()), M.npxCalls());
  assert.ok(/qwen-code .*refreshed/.test(sect), sect);
  assert.ok(sect.includes('npx sshlg-skills update --agent droid'), sect);
  assert.ok(!exists(path.join(M.factory, 'old-member')), 'the stale family link is still there');
  assert.ok(sect.includes(`removed dangling family link ${path.join(M.factory, 'old-member')}`), sect);
  assert.ok(exists(path.join(M.factory, 'their-skill')), 'a foreign dangling link was removed');
  assert.ok(exists(path.join(M.factory, 'task-pipeline')), 'a live family link was removed');
  assert.strictEqual(fs.readFileSync(path.join(M.factory, 'make-skill', 'SKILL.md'), 'utf8'), 'mine');
});

it('a second update finds nothing more to remove', () => {
  const r = M.run('update', '--no-claude');
  assert.ok(!/removed dangling family link/.test(r.out), r.out.slice(-2000));
});

const cfgFile = path.join(M.home, '.sshlg-skills', 'config.json');
const sha = (f) => require('crypto').createHash('sha256').update(fs.readFileSync(f)).digest('hex');

it('B-262: `config set extraRoots.droid ack` records the folder; three runs change nothing more', () => {
  const hashes = [];
  for (let i = 0; i < 3; i += 1) {
    const r = M.run('config', 'set', 'extraRoots.droid', 'ack');
    assert.strictEqual(r.status, 0, r.out);
    hashes.push(sha(cfgFile));
  }
  assert.strictEqual(hashes[1], hashes[0]);
  assert.strictEqual(hashes[2], hashes[0]);
  const rec = JSON.parse(fs.readFileSync(cfgFile, 'utf8')).extraRoots.droid;
  assert.match(rec.fingerprint, /^[0-9a-f]{64}$/);
  assert.match(rec.at, /^\d{4}-\d{2}-\d{2}$/);
});

it('B-262: after the acknowledgement, update prints one line for the folder', () => {
  const r = M.run('update', '--no-claude');
  const sect = r.out.slice(r.out.indexOf('== Family links in other host roots'));
  const droid = sect.split('\n').filter((l) => l.includes('droid') || l.includes('.factory'));
  assert.strictEqual(droid.length, 1, sect);
  assert.match(droid[0], /acknowledged \d{4}-\d{2}-\d{2}, unchanged/);
  assert.ok(!sect.includes('rm --'), sect);
});

it('B-262: a change in the folder re-opens the full report; `default` clears the acknowledgement', () => {
  fs.symlinkSync(path.relative(M.factory, path.join(M.home, '.agents', 'skills', 'ux-flows')), path.join(M.factory, 'ux-flows'));
  let r = M.run('update', '--no-claude');
  let sect = r.out.slice(r.out.indexOf('== Family links in other host roots'));
  assert.match(sect, /changed since it was acknowledged on/);
  assert.ok(sect.includes('npx sshlg-skills update --agent droid'), sect);
  r = M.run('config', 'set', 'extraRoots.droid', 'default');
  assert.strictEqual(r.status, 0, r.out);
  assert.ok(!('extraRoots' in JSON.parse(fs.readFileSync(cfgFile, 'utf8'))), 'the empty record was kept');
  r = M.run('update', '--no-claude');
  sect = r.out.slice(r.out.indexOf('== Family links in other host roots'));
  assert.ok(!/acknowledged/.test(sect.split('\n').filter((l) => l.includes('droid')).join('\n')) && !/changed since/.test(sect), sect);
});

it('B-262: acknowledging a root that is refreshed, empty or unknown is refused with the reason', () => {
  for (const [agent, why] of [['qwen-code', /refreshed/], ['grok', /no family entry/], ['nobody', /one of/]]) {
    const r = M.run('config', 'set', `extraRoots.${agent}`, 'ack');
    assert.strictEqual(r.status, 2, r.out);
    assert.match(r.out, why);
  }
  assert.strictEqual(M.run('config', 'set', 'extraRoots.droid', 'maybe').status, 2);
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`PASS: extraroots — ${checks} cases`);
