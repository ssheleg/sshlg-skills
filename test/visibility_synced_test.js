#!/usr/bin/env node
'use strict';
require('./tmproot.js').isolate(); // B-350: no inherited host config root reaches this suite or its children
// B-365 (2026-11-22): the Claude listing estimate counts the plugins Claude Code syncs from
// claude.ai into `<claude home>/plugins/synced/<organizationUuid>_<accountUuid>/`. Measured on
// Claude Code 2.1.330 the same day: the newest copy loads (`design~g2` over `design`), a synced
// plugin whose name an ENABLED installed plugin has is not loaded from there (agent-sync came
// from the cache), and one whose installed namesake is disabled is (figma). Scratch HOME,
// preview only.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const V = require('../lib/visibility.js');

let checks = 0;
const failures = [];
function it(name, fn) { checks += 1; try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); } }

const md = (name, desc, extra) => `---\nname: ${name}\ndescription: ${desc}\n${extra || ''}---\n# ${name}\n`;
const ORG = '11111111-1111-4111-8111-111111111111';
const ACCT = '22222222-2222-4222-8222-222222222222';

function scratch(opts) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-synced-'));
  const w = (rel, text) => { const p = path.join(home, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); return p; };
  w('.claude/skills/plain-one/SKILL.md', md('plain-one', 'Use when testing the plain skill.'));
  // An installed, enabled plugin `on` and an installed, disabled plugin `off`.
  w('.claude/plugins/cache/m/on/1/skills/on-skill/SKILL.md', md('on-skill', 'Use when testing the enabled installed plugin.'));
  w('.claude/plugins/cache/m/off/1/skills/off-skill/SKILL.md', md('off-skill', 'Use when testing the disabled installed plugin.'));
  w('.claude/plugins/installed_plugins.json', JSON.stringify({ version: 2, plugins: {
    'on@m': [{ installPath: path.join(home, '.claude/plugins/cache/m/on/1'), scope: 'user' }],
    'off@m': [{ installPath: path.join(home, '.claude/plugins/cache/m/off/1'), scope: 'user' }],
  } }));
  w('.claude/plugins/known_marketplaces.json', JSON.stringify({ m: { installLocation: path.join(home, '.claude/plugins/cache/m') } }));
  w('.claude/settings.json', JSON.stringify({ enabledPlugins: { 'on@m': true, 'off@m': false } }));
  const usage = { skillUsage: { 'plain-one': { usageCount: 1, lastUsedAt: Date.now() } } };
  if (opts.account !== false) usage.oauthAccount = { organizationUuid: ORG, accountUuid: ACCT };
  w('.claude/.claude.json', JSON.stringify(usage));
  const acct = (key, rel, text) => w(path.join('.claude/plugins/synced', key, rel), text);
  const mine = `${ORG}_${ACCT}`;
  acct(mine, 'manifest.json', '{"plugins":[]}');
  // Only an older copy: counted from it.
  acct(mine, 'solo/skills/solo-a/SKILL.md', md('solo-a', 'Use when testing a synced plugin with one copy.'));
  acct(mine, 'solo/skills/solo-b/SKILL.md', md('solo-b', 'Use only by hand.', 'disable-model-invocation: true\n'));
  // Two generations: the ~g2 copy is the one Claude Code loads.
  acct(mine, 'twice/skills/old/SKILL.md', md('old', 'Use when the older generation would be counted.'));
  acct(mine, 'twice~g2/skills/new/SKILL.md', md('new', 'Use when testing the newest generation.'));
  acct(mine, 'twice~g2.meta.json', '{}');
  // Synced namesakes of installed plugins: the enabled one shadows its synced copy, the disabled one does not.
  acct(mine, 'on/skills/on-synced/SKILL.md', md('on-synced', 'Use when an enabled namesake is installed.'));
  acct(mine, 'off/skills/off-synced/SKILL.md', md('off-synced', 'Use when the installed namesake is disabled.'));
  // Another account's folder on the same machine: never counted while the account is known.
  acct(`${ORG}_33333333-3333-4333-8333-333333333333`, 'manifest.json', '{"plugins":[]}');
  acct(`${ORG}_33333333-3333-4333-8333-333333333333`, 'other/skills/other-skill/SKILL.md', md('other-skill', 'Use when another account is counted.'));
  if (opts.only) fs.rmSync(path.join(home, '.claude/plugins/synced', `${ORG}_33333333-3333-4333-8333-333333333333`), { recursive: true });
  return home;
}

const run = (home) => {
  const got = spawnSync(process.execPath, [path.join(__dirname, '..', 'bin', 'sshlg-skills.js'), 'visibility'], {
    cwd: home, encoding: 'utf8',
    env: Object.assign({}, process.env, { HOME: home, CLAUDE_CONFIG_DIR: path.join(home, '.claude'), SSHLG_SKILLS_NO_UPDATE_CHECK: '1' }),
  });
  return { status: got.status, out: `${got.stdout}${got.stderr}` };
};
const estimate = (out) => {
  const m = /launcher's estimate ≈ (\d+) → \d+ characters \((\d+) → \d+ entries\)/.exec(out);
  return m ? { chars: Number(m[1]), entries: Number(m[2]) } : null;
};
const base = [
  { name: 'plain-one', description: 'Use when testing the plain skill.', state: 'on' },
  { name: 'on:on-skill', description: 'Use when testing the enabled installed plugin.', state: 'on' },
];
const syncedRows = [
  { name: 'off:off-synced', description: 'Use when the installed namesake is disabled.', state: 'on' },
  { name: 'solo:solo-a', description: 'Use when testing a synced plugin with one copy.', state: 'on' },
  { name: 'twice:new', description: 'Use when testing the newest generation.', state: 'on' },
];

const homes = [];
{
  const home = scratch({});
  homes.push(home);
  const r = run(home);
  it('the preview runs', () => assert.strictEqual(r.status, 0, r.out));
  it('the estimate counts the signed-in account\'s synced plugins: newest copy, no enabled namesake, no manual-only skill', () => {
    const got = estimate(r.out);
    assert.ok(got, r.out);
    assert.strictEqual(got.chars, V.listingChars(base.concat(syncedRows)), r.out);
    assert.strictEqual(got.entries, 5, r.out);
  });
  it('the preview names the synced plugins and who can hide them', () => {
    assert.ok(r.out.includes('of them, 3 skill(s) of 3 plugin(s) the account syncs from claude.ai: off 1, solo 1, twice 1;'), r.out);
    assert.ok(r.out.includes('disable them in Claude Code\'s /plugin or on claude.ai.'), r.out);
    assert.ok(!/other-skill|on-synced|twice:old/.test(r.out), r.out);
  });
}
{
  // No account on record and one account folder with a manifest: that folder is read.
  const home = scratch({ account: false, only: true });
  homes.push(home);
  const r = run(home);
  it('without an account on record, the only account folder is read', () => {
    assert.strictEqual(r.status, 0, r.out);
    assert.strictEqual(estimate(r.out).chars, V.listingChars(base.concat(syncedRows)), r.out);
  });
}
{
  // No account on record and two account folders: nothing is guessed, and the preview says so.
  const home = scratch({ account: false });
  homes.push(home);
  const r = run(home);
  it('with two account folders and no account on record, none is counted and the preview says why', () => {
    assert.strictEqual(r.status, 0, r.out);
    assert.strictEqual(estimate(r.out).chars, V.listingChars(base), r.out);
    assert.ok(r.out.includes('plugins synced from claude.ai: not counted (no account folder could be matched to the signed-in account).'), r.out);
  });
}
it('syncedPlugins: no synced folder gives nothing', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-synced-none-'));
  homes.push(home);
  const { syncedPlugins } = require('../lib/cli-visibility.js');
  assert.deepStrictEqual(syncedPlugins(path.join(home, '.claude'), home), { folder: null, plugins: [] });
});

for (const h of homes) fs.rmSync(h, { recursive: true, force: true });
if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
