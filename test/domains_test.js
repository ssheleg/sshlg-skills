#!/usr/bin/env node
'use strict';
// Fixtures for lib/domains.js — which family members a project's own files call for.
//
// Three properties. Evidence is read from what a repository DEPENDS on or DECLARES,
// never from its name or its prose. The plan adds per-project entries before it removes
// a machine-wide one, and a project it cannot write blocks that removal. Ownership: the
// launcher changes only values it can name as its own, and a value the operator changed
// since is theirs.

const assert = require('assert');
const D = require('../lib/domains.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}
const members = (ev) => [...new Set(ev.map((e) => e.member))].sort();

// ── evidence ──
it('package.json: three and @react-three/* are web3d; a description naming three.js is not', () => {
  const pj = JSON.stringify({ description: 'built with three.js, stripe and telegram', dependencies: { three: '^0.186.0' }, devDependencies: { '@react-three/drei': '9' } });
  assert.deepStrictEqual(members(D.evidenceIn('package.json', pj)), ['web3d-dev']);
});

it('package.json: grammy, telegraf and @telegram-apps/* are telegram', () => {
  for (const dep of ['grammy', 'telegraf', 'node-telegram-bot-api', '@telegram-apps/sdk-react']) {
    const ev = D.evidenceIn('web/package.json', JSON.stringify({ dependencies: { [dep]: '1' } }));
    assert.deepStrictEqual(members(ev), ['telegram-dev'], dep);
    assert.ok(ev[0].why.includes(dep) && ev[0].why.includes('web/package.json'), ev[0].why);
  }
});

it('package.json: stripe, @stripe/*, @sentry/*, posthog, google sign-in are sheleg-dev', () => {
  for (const dep of ['stripe', '@stripe/stripe-js', '@sentry/nextjs', 'posthog-js', '@react-oauth/google', 'google-auth-library']) {
    assert.deepStrictEqual(members(D.evidenceIn('package.json', JSON.stringify({ dependencies: { [dep]: '1' } }))), ['sheleg-dev'], dep);
  }
});

it('package.json: a dependency that merely contains a domain word is not evidence', () => {
  const pj = JSON.stringify({ dependencies: { 'three-stdlib-ish': '1', 'not-stripe': '1', 'telegraf-ish': '1', react: '18' } });
  assert.deepStrictEqual(D.evidenceIn('package.json', pj), []);
});

it('package.json that does not parse is no evidence, not a crash', () => {
  assert.deepStrictEqual(D.evidenceIn('package.json', '{ not json'), []);
});

it('python requirements: aiogram, telethon, sentry-sdk, stripe — by package, not substring', () => {
  const req = 'aiogram==3.4.1\nTelethon>=1.36\nsentry-sdk[fastapi]~=2.0\nstripe\n# python-telegram-bot is mentioned in a comment\nposthog-extra==1\n';
  const ev = D.evidenceIn('requirements.txt', req);
  assert.deepStrictEqual(members(ev), ['sheleg-dev', 'telegram-dev']);
  assert.ok(!ev.some((e) => e.why.includes('posthog')), 'posthog-extra is another package');
  assert.ok(!ev.some((e) => e.why.includes('python-telegram-bot')), 'a comment is not a dependency');
});

it('pyproject: quoted dependency strings and poetry keys count; prose does not', () => {
  const py = '[project]\ndescription = "uses pyrogram"\ndependencies = ["pyrogram>=2", "httpx"]\n[tool.poetry.dependencies]\nsentry-sdk = "^2"\n';
  const ev = D.evidenceIn('pyproject.toml', py);
  assert.deepStrictEqual(members(ev), ['sheleg-dev', 'telegram-dev']);
});

it('xr: AndroidManifest VR category, Meta XR gradle, Unity OpenXR package, CMake OpenXR', () => {
  assert.deepStrictEqual(members(D.evidenceIn('app/src/main/AndroidManifest.xml', '<category android:name="com.oculus.intent.category.VR" />')), ['xr-dev']);
  assert.deepStrictEqual(members(D.evidenceIn('app/build.gradle.kts', 'implementation("com.meta.spatial:meta-spatial-sdk:0.6.0")')), ['xr-dev']);
  assert.deepStrictEqual(members(D.evidenceIn('Packages/manifest.json', JSON.stringify({ dependencies: { 'com.meta.xr.sdk.core': '72.0.0' } }))), ['xr-dev']);
  assert.deepStrictEqual(members(D.evidenceIn('CMakeLists.txt', 'find_package(OpenXR REQUIRED)')), ['xr-dev']);
});

it('source: navigator.xr is xr, gtag is sheleg-dev; only in source files', () => {
  assert.deepStrictEqual(members(D.evidenceIn('src/vr.ts', 'if (navigator.xr) await navigator.xr.requestSession("immersive-vr")')), ['xr-dev']);
  assert.deepStrictEqual(members(D.evidenceIn('index.html', '<script src="https://www.googletagmanager.com/gtag/js?id=G-X"></script>')), ['sheleg-dev']);
  assert.deepStrictEqual(D.evidenceIn('README.md', 'navigator.xr and gtag( and three and stripe'), []);
});

it('a file kind the scanner does not read yields nothing', () => {
  assert.strictEqual(D.kindOf('docs/notes.md'), null);
  assert.strictEqual(D.kindOf('package.json'), 'npm');
  assert.strictEqual(D.kindOf('a/b/requirements-dev.txt'), 'python');
  assert.strictEqual(D.kindOf('vendor/three.min.js'), null);
});

// ── usage ──
it('usage: Claude-encoded directories map to members by prefix or by bare skill name', () => {
  const tsv = '   3 -Users-me-DATA-game\txr-dev:quest-store\n   1 -Users-me-DATA-game\tquest-perf\n   2 -Users-me-DATA-bot\ttelegram-bots\n   9 -Users-me-DATA-bot\tsuper-ux:copywriting\ngarbage line\n';
  const u = D.parseUsage(tsv, [{ name: 'xr-dev', skillNames: ['quest-store', 'quest-perf'] }, { name: 'telegram-dev', skillNames: ['telegram-bots'] }]);
  assert.deepStrictEqual(u.get('-Users-me-DATA-game'), { 'xr-dev': 4 });
  assert.deepStrictEqual(u.get('-Users-me-DATA-bot'), { 'telegram-dev': 2 });
  assert.strictEqual(D.encodeDir('/Users/me/DATA/my_app.v2'), '-Users-me-DATA-my-app-v2');
});

// ── settings edits ──
const S = (o) => JSON.stringify(o, null, 2) + '\n';
it('readEnabled: valid settings formatting is independent of edit support', () => {
  for (const text of ['{"enabledPlugins":{"a@a":true,"b@b":false}}\n', '{\r\n\t"enabledPlugins": {"a@a": true,"b@b":false}\r\n}\r\n']) {
    assert.deepStrictEqual(D.readEnabled(text), { ok: true, enabled: { 'a@a': true, 'b@b': false } });
    assert.strictEqual(D.editEnabled(text, { set: { 'c@c': true } }).ok, true);
  }
  for (const text of [null, undefined, '{}', '{"permissions":{}}']) assert.deepStrictEqual(D.readEnabled(text), { ok: true, enabled: {} });
});

it('readEnabled: malformed settings and unknown enablement shapes are not absence', () => {
  for (const text of ['{', 'null', '[]', 'true', '{"enabledPlugins":null}', '{"enabledPlugins":[]}', '{"enabledPlugins":{"a@a":"true"}}', '{"enabledPlugins":{"a@a":0}}']) {
    assert.strictEqual(D.readEnabled(text).ok, false, text);
  }
});

it('editEnabled: sets a key and keeps every other byte', () => {
  const before = S({ permissions: { allow: ['Bash(ls)'] }, enabledPlugins: { 'figma@x': true } });
  const r = D.editEnabled(before, { set: { 'xr-dev@xr-dev': true } });
  assert.ok(r.ok, r.reason);
  assert.deepStrictEqual(JSON.parse(r.text), { permissions: { allow: ['Bash(ls)'] }, enabledPlugins: { 'figma@x': true, 'xr-dev@xr-dev': true } });
  assert.deepStrictEqual(r.changed, ['xr-dev@xr-dev']);
});

it('editEnabled: an absent file is created only when there is something to set', () => {
  assert.strictEqual(D.editEnabled(null, { set: {} }).text, null);
  assert.strictEqual(D.editEnabled(null, { set: { 'a@a': true } }).text, S({ enabledPlugins: { 'a@a': true } }));
});

it('editEnabled: a file without a trailing newline keeps that form', () => {
  const before = JSON.stringify({ a: 1 }, null, 2);
  const r = D.editEnabled(before, { set: { 'k@k': true } });
  assert.ok(r.ok && !r.text.endsWith('\n'), r.text);
});

it('editEnabled: compact valid JSON is edited without reformatting existing bytes', () => {
  const r = D.editEnabled('{"a":1}\n', { set: { 'k@k': true } });
  assert.strictEqual(r.ok, true);
  assert.ok(r.text.startsWith('{"a":1,'), r.text);
  assert.strictEqual(D.editEnabled('{ nope', { set: { 'k@k': true } }).ok, false);
});

it('editEnabled: unset removes a key only while it holds the value the launcher set', () => {
  const before = S({ enabledPlugins: { 'a@a': true, 'b@b': false } });
  const r = D.editEnabled(before, { unset: { 'a@a': true, 'b@b': true } });
  assert.deepStrictEqual(JSON.parse(r.text), { enabledPlugins: { 'b@b': false } });
  assert.deepStrictEqual(r.kept, ['b@b']);
  assert.strictEqual(D.editEnabled(S({ enabledPlugins: { 'a@a': true } }), { unset: { 'a@a': true } }).text, S({}));
});

it('editEnabled: noncanonical nested bytes and value spellings survive insertion and undo', () => {
  const before = '{\n  "permissions": {\n    "allow": [\n       "Bash(example)"\n    ]\n  }, "numeric":1e+03,"escaped":"\\u0061"\n}\n';
  const added = D.editEnabled(before, { set: { 'web3d-dev@web3d-dev': true } });
  assert.ok(added.ok, added.reason);
  assert.ok(added.text.includes('       "Bash(example)"'));
  assert.ok(added.text.includes('"numeric":1e+03,"escaped":"\\u0061"'));
  assert.strictEqual(JSON.parse(added.text).enabledPlugins['web3d-dev@web3d-dev'], true);
  assert.strictEqual(D.editEnabled(added.text, { set: { 'web3d-dev@web3d-dev': true } }).text, added.text);
  assert.strictEqual(D.editEnabled(added.text, { unset: { 'web3d-dev@web3d-dev': true } }).text, before);
});

it('editEnabled: ambiguous duplicate keys and unknown values refuse before editing', () => {
  for (const before of ['{"enabledPlugins":{},"enabledPlugins":{}}', '{"enabledPlugins":{"x":true,"\\u0078":false}}', '{"enabledPlugins":{"x":null}}', '{"permissions":{"a":1,"a":2}}']) {
    assert.strictEqual(D.editEnabled(before, { set: { 'a@a': true } }).ok, false, before);
    assert.strictEqual(D.readEnabled(before).ok, false, before);
  }
});

it('editEnabled: targeted values and first/middle/last removals retain neighboring source', () => {
  const before = '{ "enabledPlugins" : { "a":true, "b": false, "c" :true }, "note":"\\\"},\\\"enabledPlugins\\\":{}" }\r\n';
  for (const key of ['a','b','c']) {
    const r = D.editEnabled(before, { unset: { [key]: key !== 'b' } });
    assert.ok(r.ok, r.reason); const expected = JSON.parse(before); delete expected.enabledPlugins[key];
    assert.deepStrictEqual(JSON.parse(r.text), expected);
    assert.ok(r.text.endsWith(before.slice(before.indexOf(', "note"'))));
  }
  const r = D.editEnabled(before, { set: { b: true }, unset: { a: false } });
  assert.deepStrictEqual(r.kept, ['a']);
  assert.strictEqual(r.text, before.replace('"b": false', '"b": true'));
});

it('editEnabled: CRLF, escaped keys, decoy strings and depth refusal are source-bound', () => {
  const before = '{\r\n\t"enabled\\u0050lugins": {"a":false},\r\n\t"unrelated": ["enabledPlugins", {"raw":1e999}]\r\n}\r\n';
  const r = D.editEnabled(before, { set: { a: true } });
  assert.ok(r.ok, r.reason);
  assert.strictEqual(r.text, before.replace('"a":false', '"a":true'));
  const deep = '{"other":' + '['.repeat(130) + '0' + ']'.repeat(130) + '}';
  assert.strictEqual(D.editEnabled(deep, { set: { 'a@a': true } }).ok, false);
  for (const text of ['{}\r\n', '{  }', '{"enabledPlugins": { }, "extra":[false,null,1.2e-3]}']) {
    const out = D.editEnabled(text, { set: { 'a@a': true, 'b@b': false } });
    assert.ok(out.ok, out.reason);
    assert.deepStrictEqual(JSON.parse(out.text).enabledPlugins, { 'a@a': true, 'b@b': false });
    assert.strictEqual(D.editEnabled(out.text, { set: { 'a@a': true, 'b@b': false } }).text, out.text);
    const reverted = D.editEnabled(out.text, { unset: { 'a@a': true, 'b@b': false }, keepEmpty: text.includes('enabledPlugins') });
    assert.strictEqual(reverted.text, text);
  }
});

// ── the plan ──
const PLUG = { 'xr-dev': 'xr-dev@xr-dev', 'web3d-dev': 'web3d-dev@web3d-dev', 'telegram-dev': 'telegram-dev@telegram-dev', 'sheleg-dev': 'sheleg-dev@sheleg-dev' };
const USER = { 'xr-dev@xr-dev': true, 'web3d-dev@web3d-dev': true, 'telegram-dev@telegram-dev': true, 'task-pipeline@task-pipeline': true };
const proj = (dir, ev, local, ignored) => ({ dir, evidence: ev, local: local || {}, ignored: ignored === undefined ? { ok: true, why: '.gitignore:1' } : ignored });

it('plan: adds per project, then turns the member off at user scope', () => {
  const p = D.plan({ projects: [proj('/p/game', { 'xr-dev': ['AndroidManifest.xml: VR'] })], user: USER, owned: null, plugins: PLUG });
  assert.deepStrictEqual(p.adds, [{ dir: '/p/game', keys: ['xr-dev@xr-dev'] }]);
  assert.deepStrictEqual(p.userOff.sort(), ['telegram-dev@telegram-dev', 'web3d-dev@web3d-dev', 'xr-dev@xr-dev']);
  assert.ok(!p.userOff.includes('task-pipeline@task-pipeline'), 'a core member is never touched');
});

it('plan: a project that cannot be written blocks that member at user scope, and only that member', () => {
  const p = D.plan({ projects: [
    proj('/p/bot', { 'telegram-dev': ['package.json: grammy'] }, {}, { ok: false, why: 'not ignored by git' }),
    proj('/p/game', { 'xr-dev': ['x'] }),
  ], user: USER, owned: null, plugins: PLUG });
  assert.deepStrictEqual(p.refused, [{ dir: '/p/bot', keys: ['telegram-dev@telegram-dev'], why: 'not ignored by git' }]);
  assert.ok(!p.userOff.includes('telegram-dev@telegram-dev'));
  assert.deepStrictEqual(p.blocked, [{ key: 'telegram-dev@telegram-dev', dirs: ['/p/bot'] }]);
  assert.ok(p.userOff.includes('xr-dev@xr-dev'));
});

it('plan: a project entry already true needs nothing; one set false by the operator is respected', () => {
  const p = D.plan({ projects: [
    proj('/p/a', { 'xr-dev': ['x'] }, { 'xr-dev@xr-dev': true }),
    proj('/p/b', { 'xr-dev': ['x'] }, { 'xr-dev@xr-dev': false }),
  ], user: USER, owned: null, plugins: PLUG });
  assert.deepStrictEqual(p.adds, []);
  assert.deepStrictEqual(p.respected, [{ dir: '/p/b', key: 'xr-dev@xr-dev' }]);
  assert.ok(p.userOff.includes('xr-dev@xr-dev'));
});

it('plan: a member absent at user scope, or turned off there by the operator, is left alone', () => {
  const p = D.plan({ projects: [proj('/p/a', { 'sheleg-dev': ['x'] }), proj('/p/b', { 'xr-dev': ['x'] })],
    user: { 'xr-dev@xr-dev': false }, owned: null, plugins: PLUG });
  assert.deepStrictEqual(p.adds, []);
  assert.deepStrictEqual(p.userOff, []);
  assert.deepStrictEqual(p.skipped.map((s) => s.member).sort(), ['sheleg-dev', 'telegram-dev', 'web3d-dev', 'xr-dev']);
});

it('plan: after --apply, a user-scope value the operator turned back on is theirs', () => {
  const owned = { user: { 'xr-dev@xr-dev': false }, projects: {} };
  const p = D.plan({ projects: [], user: Object.assign({}, USER), owned, plugins: PLUG });
  assert.ok(!p.userOff.includes('xr-dev@xr-dev'));
  assert.ok(p.skipped.some((s) => s.member === 'xr-dev' && /turned back on/.test(s.why)), JSON.stringify(p.skipped));
});

it('plan: still off and still ours is managed — a new project gets its entry', () => {
  const owned = { user: { 'xr-dev@xr-dev': false }, projects: {} };
  const p = D.plan({ projects: [proj('/p/new', { 'xr-dev': ['x'] })], user: Object.assign({}, USER, { 'xr-dev@xr-dev': false }), owned, plugins: PLUG });
  assert.deepStrictEqual(p.adds, [{ dir: '/p/new', keys: ['xr-dev@xr-dev'] }]);
  assert.ok(!p.userOff.includes('xr-dev@xr-dev'), 'already off');
});

it('plan: a member off by domains goes back ON when a new project with evidence cannot be written', () => {
  const owned = { user: { 'telegram-dev@telegram-dev': false }, projects: {} };
  const p = D.plan({ projects: [proj('/p/bot', { 'telegram-dev': ['package.json: grammy'] }, {}, { ok: false, why: 'not ignored' })],
    user: Object.assign({}, USER, { 'telegram-dev@telegram-dev': false }), owned, plugins: PLUG });
  assert.deepStrictEqual(p.userOn, ['telegram-dev@telegram-dev']);
  assert.ok(!p.userOff.includes('telegram-dev@telegram-dev'));
});

it('validRecord: a record of the wrong shape is named, not trusted', () => {
  assert.strictEqual(D.validRecord({ roots: ['/x'], user: { 'a@a': false }, projects: { '/p': { plugins: ['a@a'] } } }), null);
  assert.ok(D.validRecord({ roots: 'x', user: {}, projects: {} }));
  assert.ok(D.validRecord({ roots: [], user: {}, projects: { '/p': {} } }));
  assert.ok(D.validRecord([]));
});

it('evidenceIn on a whole source line keeps the word boundary: navigator.xrFoo is not xr', () => {
  assert.deepStrictEqual(D.evidenceIn('a.js', 'const x = window.mynavigator.xrFoo;'), []);
});

it('plan: a partly read project blocks turning off every member it could not rule out', () => {
  const p = D.plan({ projects: [
    proj('/p/game', { 'xr-dev': ['x'] }),
    Object.assign(proj('/p/odd', { 'xr-dev': ['x'] }), { partial: ['xr-dev', 'web3d-dev', 'telegram-dev', 'sheleg-dev'] }),
  ], user: USER, owned: null, plugins: PLUG });
  assert.ok(p.userOff.includes('xr-dev@xr-dev'), 'evidence was found there, so xr-dev is ruled IN, not unknown');
  assert.ok(!p.userOff.includes('web3d-dev@web3d-dev') && !p.userOff.includes('telegram-dev@telegram-dev'));
  assert.deepStrictEqual(p.uncertain.map((u) => u.key).sort(), ['telegram-dev@telegram-dev', 'web3d-dev@web3d-dev']);
});

it('plan: onlyAdd (the update step) never turns a member off at user scope', () => {
  const p = D.plan({ projects: [proj('/p/a', { 'xr-dev': ['x'] })], user: USER, owned: null, plugins: PLUG, onlyAdd: true });
  assert.deepStrictEqual(p.adds, [{ dir: '/p/a', keys: ['xr-dev@xr-dev'] }]);
  assert.deepStrictEqual(p.userOff, []);
  assert.ok(p.wouldOff.includes('xr-dev@xr-dev'));
});

it('editEnabled: keepEmpty leaves an emptied enabledPlugins in place', () => {
  const before = S({ enabledPlugins: { 'a@a': true } });
  assert.strictEqual(D.editEnabled(before, { unset: { 'a@a': true }, keepEmpty: true }).text, S({ enabledPlugins: {} }));
});

it('plan: a member whose plugin ships hooks is never scoped (S1)', () => {
  const keepOn = {}; // The safety invariant does not depend on installed files.
  const U = Object.assign({}, USER, { 'sheleg-dev@sheleg-dev': true });
  const p = D.plan({ projects: [proj('/p/shop', { 'sheleg-dev': ['package.json: stripe'] })], user: U, owned: null, plugins: PLUG, keepOn });
  assert.ok(!p.userOff.includes('sheleg-dev@sheleg-dev'));
  assert.deepStrictEqual(p.adds, []);
  assert.ok(p.skipped.some((x) => x.member === 'sheleg-dev' && /ships hooks/.test(x.why)));
  // Off by an older --apply: it goes back on.
  const q = D.plan({ projects: [], user: Object.assign({}, U, { 'sheleg-dev@sheleg-dev': false }), owned: { user: { 'sheleg-dev@sheleg-dev': false } }, plugins: PLUG, keepOn });
  assert.deepStrictEqual(q.userOn, ['sheleg-dev@sheleg-dev']);
});

it('a previously scoped member returns globally when a later scan is incomplete', () => {
  const p = D.plan({ projects: [Object.assign(proj('/p/broken', {}), { partial: ['xr-dev'] })],
    user: { 'xr-dev@xr-dev': false }, owned: { user: { 'xr-dev@xr-dev': false } }, plugins: PLUG });
  assert.deepStrictEqual(p.userOn, ['xr-dev@xr-dev']);
});

it('PLUGIN_SPECS agree with skills.json', () => {
  const fam = require('../skills.json').skills;
  for (const m of D.DOMAIN_MEMBERS) assert.strictEqual(D.PLUGIN_SPECS[m], fam.find((s) => s.name === m).pluginInstall, m);
});

it('usageFresh: a table older than its 60-day window from its own date is ignored', () => {
  const now = Date.UTC(2026, 9, 13);
  assert.ok(!D.usageFresh('skill-usage-60d-2026-10-14.tsv', now));
  assert.ok(!D.usageFresh('skill-usage-60d-2026-02-30.tsv', now));
  assert.ok(D.usageFresh('skill-usage-60d-2026-10-13.tsv', now));
  assert.ok(D.usageFresh('skill-usage-60d-2026-08-20.tsv', now));
  assert.ok(!D.usageFresh('skill-usage-60d-2026-08-01.tsv', now));
  assert.ok(!D.usageFresh('skill-usage-60d-garbage.tsv', now));
});

it('revertPlan: user scope back on first, then only project values still as set', () => {
  const owned = { user: { 'xr-dev@xr-dev': false, 'web3d-dev@web3d-dev': false }, projects: { '/p/a': { plugins: ['xr-dev@xr-dev'] }, '/p/b': { plugins: ['xr-dev@xr-dev'] } } };
  const r = D.revertPlan({ owned, user: { 'xr-dev@xr-dev': false, 'web3d-dev@web3d-dev': true }, locals: { '/p/a': { 'xr-dev@xr-dev': true }, '/p/b': { 'xr-dev@xr-dev': false } } });
  assert.deepStrictEqual(r.userOn, ['xr-dev@xr-dev']);
  assert.deepStrictEqual(r.unset, [{ dir: '/p/a', keys: ['xr-dev@xr-dev'] }]);
});

it('every domain member is a family member, and no core member is a domain', () => {
  const fam = require('../skills.json').skills.map((s) => s.name);
  for (const m of D.DOMAIN_MEMBERS) assert.ok(fam.includes(m), m);
  for (const m of ['task-pipeline', 'agent-sync', 'make-skill', 'super-ux', 'sheleg-design', 'seo-aeo-audit', 'agent-stack']) assert.ok(!D.DOMAIN_MEMBERS.includes(m), m);
});

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
