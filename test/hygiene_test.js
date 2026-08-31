#!/usr/bin/env node
'use strict';
// Fixtures for lib/hygiene.js — the three machine rules that were written down,
// broken anyway, and now have a mechanism.
//
// The near misses carry this file. A guard that denies `npx sshlg-skills update`
// would deny its own remedy, and a restore that rebuilds keys while losing the
// file's comments would report success over a config the operator no longer
// recognises.

const assert = require('assert');
const H = require('../lib/hygiene.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const IDS = H.familyIds({
  skills: [
    { name: 'super-ux', skillNames: ['ux-flows', 'copywriting'] },
    { name: 'task-pipeline', skillNames: ['task-pipeline', 'evidence-docs'] },
    { name: 'agent-stack', skillNames: ['agent-orchestrator', 'agent-evals'] },
  ],
});

// ---- the bare skills CLI ---------------------------------------------------

it('the manifest supplies both member names and skill ids', () => {
  for (const id of ['super-ux', 'ux-flows', 'agent-evals', 'evidence-docs']) {
    assert.ok(IDS.has(id), `not guarded: ${id}`);
  }
});

it('a bare update of a member is caught, and the remedy is the launcher', () => {
  const v = H.bareFamilyInstall('npx skills update task-pipeline', IDS);
  assert.ok(v, 'the shadow-making command was allowed through');
  assert.strictEqual(v.target, 'task-pipeline');
  assert.match(v.remedy, /sshlg-skills@latest update/);
});

it('flags between the words do not hide it', () => {
  assert.ok(H.bareFamilyInstall('npx --yes skills update super-ux', IDS));
  assert.ok(H.bareFamilyInstall('skills add --agent claude ux-flows', IDS));
});

it('a skill id of a member counts, not only the member name', () => {
  assert.ok(H.bareFamilyInstall('npx skills update agent-evals', IDS),
    'a member skill was left unguarded because only member names were checked');
});

// The file already knew this class and fixed it one token too late. `skillsCli`'s own
// comment says a flag's VALUE is indistinguishable from a positional and takes EVERY
// positional as a candidate target for exactly that reason — then read the FIRST
// positional as the verb, where the same value lands when the flag precedes the verb.
// Measured 2026-08-31: both lines below reached `bareFamilyInstall` and returned null.
it('A FLAG BEFORE THE VERB DOES NOT HIDE IT — the value is not the verb', () => {
  assert.ok(H.bareFamilyInstall('npx skills --agent claude update super-ux', IDS),
    "the flag's value was read as the verb, so update never matched and the install passed");
});

it('A LINE CONTINUATION IS NOT A VERB', () => {
  assert.ok(H.bareFamilyInstall('npx skills \\\n  update super-ux', IDS),
    'the backslash was read as the verb, so update never matched and the install passed');
});

it('THE LAUNCHER IS NOT DENIED — it is what the denial recommends', () => {
  for (const cmd of ['npx --yes sshlg-skills@latest update',
                     'npx sshlg-skills update',
                     'npx sshlg-skills install',
                     'node bin/sshlg-skills.js update']) {
    assert.strictEqual(H.bareFamilyInstall(cmd, IDS), null, `denied the remedy: ${cmd}`);
  }
});

// --- B-59: a command being written down is not a command being run -------------------
//
// The guard reads the whole Bash payload, so quoting the forbidden invocation IN A
// DOCUMENT was refused too — a verification-ledger row blocked its own commit on
// 2026-08-16, and the sentence had to be split around the guard.
//
// The strings below are ASSEMBLED rather than written whole, because a fixture file
// containing the literal payload is itself refused when anything cats or greps it. That
// is the defect demonstrating itself, and it cost three commands during this fix.
// The targets are ids THIS fixture's manifest actually declares. The first draft used a
// member absent from it, so three of these cases returned null for the wrong reason and
// passed — a plant that asserts nothing is the shape this repository keeps catching.
const RUN_UPDATE = 'npx ' + 'skills ' + 'update copywriting';
const RUN_ADD = 'npx ' + 'skills ' + 'add ux-flows';
assert.ok(H.bareFamilyInstall(RUN_UPDATE, IDS), 'the bare payload must be refused, or these cases prove nothing');
assert.ok(H.bareFamilyInstall(RUN_ADD, IDS), 'the bare payload must be refused, or these cases prove nothing');

it('a heredoc fed to a NON-shell is data, not a command', () => {
  const py = "python3 - <<'PY'\nopen('f','w').write('" + RUN_UPDATE + "')\nPY";
  assert.strictEqual(H.bareFamilyInstall(py, IDS), null);
  const cat = 'cat > doc.md <<EOF\nrun ' + RUN_UPDATE + '\nEOF';
  assert.strictEqual(H.bareFamilyInstall(cat, IDS), null);
});

it('A HEREDOC FED TO A SHELL IS STILL A COMMAND — stripping every one would be a bypass', () => {
  const sh = 'bash <<EOF\n' + RUN_UPDATE + '\nEOF';
  assert.ok(H.bareFamilyInstall(sh, IDS), 'a shell heredoc body runs and must stay guarded');
});

it('the heredoc ends at its terminator, indented or not', () => {
  assert.ok(H.bareFamilyInstall('python3 - <<PY\nx=1\nPY\n' + RUN_ADD, IDS),
            'a command AFTER the heredoc still runs');
  assert.strictEqual(
    H.bareFamilyInstall('python3 - <<-PY\n  ' + RUN_UPDATE + '\n\tPY\nnpm test', IDS), null,
    '`<<-` allows an indented terminator');
});

it('a whole-line comment does not run', () => {
  assert.strictEqual(H.bareFamilyInstall('# never run ' + RUN_UPDATE + '\nnpm test', IDS), null);
});

it('QUOTED IS NOT EXEMPT — and stripping quotes closed a real bypass', () => {
  // Found while fixing the false positive: `bareName` kept the trailing quote, so
  // `ux-flows'` matched no family id and a genuine invocation passed untouched.
  assert.ok(H.bareFamilyInstall("bash -c '" + RUN_ADD + "'", IDS),
            'a real invocation inside quotes must still be refused');
});

it('a skill outside the family is none of our business', () => {
  assert.strictEqual(H.bareFamilyInstall('npx skills add refero-design', IDS), null);
  assert.strictEqual(H.bareFamilyInstall(
    'npx skills add https://github.com/referodesign/refero_skill --skill refero-design', IDS), null);
});

it('reading the skills CLI is not installing with it', () => {
  assert.strictEqual(H.bareFamilyInstall('npx skills list', IDS), null);
  assert.strictEqual(H.bareFamilyInstall('which skills', IDS), null);
});

// ---- the launcher-is-running window ---------------------------------------

it('the launcher mid-run is detected by its argv, not by its name', () => {
  assert.strictEqual(H.launcherRunning('node /Users/x/.npm/_npx/abc/bin/sshlg-skills update'), true);
  assert.strictEqual(H.launcherRunning('npm exec sshlg-skills@latest update'), true);
});

it('a Claude session sitting in the repo is NOT the launcher running', () => {
  // The exact false positive the machine's own CLAUDE.md records: `pgrep -f
  // sshlg-skills` matches every session whose cwd is this repository.
  const ps = 'claude --project /Users/sshlg/DATA/sshlg-skills\nnode /Users/sshlg/DATA/sshlg-skills/test/run.js';
  assert.strictEqual(H.launcherRunning(ps), false,
    'a session working in the repo was mistaken for the launcher installing');
});

// ---- obsidian-wiki setup ---------------------------------------------------

it('setup is recognised; the other subcommands are not', () => {
  assert.strictEqual(H.isObsidianSetup('obsidian-wiki setup --vault /v'), true);
  assert.strictEqual(H.isObsidianSetup('uv tool run obsidian-wiki setup'), true);
  assert.strictEqual(H.isObsidianSetup('obsidian-wiki doctor'), false);
  assert.strictEqual(H.isObsidianSetup('obsidian-wiki info'), false);
  assert.strictEqual(H.isObsidianSetup('uv tool upgrade obsidian-wiki'), false);
});

// The trailing form was fixtured from the start; the leading one was not, and `--vault`
// consumes the next argument — so the vault PATH stood where the subcommand is read.
// Measured 2026-08-31: both returned false, and this is the guard for the command that
// truncates the operator's config.
it('A FLAG THAT CONSUMES ITS ARGUMENT DOES NOT HIDE THE SUBCOMMAND', () => {
  assert.strictEqual(H.isObsidianSetup('obsidian-wiki --vault /Users/x/v setup'), true,
    'the vault path was read as the subcommand, so setup went unguarded');
  assert.strictEqual(H.isObsidianSetup('obsidian-wiki -v /Users/x/v setup'), true,
    'the short form has the same grammar and the same hole');
  assert.strictEqual(H.isObsidianSetup('obsidian-wiki --vault=/Users/x/v setup'), true,
    'the = form consumes nothing and already worked — it is here so a fix cannot break it');
});

it('a path that ENDS in setup is not the setup subcommand', () => {
  assert.strictEqual(H.isObsidianSetup('obsidian-wiki --vault /Users/x/setup doctor'), false,
    'widening the search must not start matching directory names');
});

const SNAPSHOT = [
  '# Obsidian Wiki Configuration — Projects vault',
  '# Active profile: symlink config -> config.projects',
  '',
  '# --- Vault location ---',
  'OBSIDIAN_VAULT_PATH=/vault/old',
  '',
  '# --- Framework ---',
  'OBSIDIAN_WIKI_VERSION="2026.7"',
  '',
  '# --- Sources ---',
  'CLAUDE_HISTORY_PATH=/Users/x/.claude',
  'CURSOR_HISTORY_PATH=/Users/x/.cursor',
  'OBSIDIAN_SOURCES_EXCLUDE="node_modules,.git"',
  '',
  '# --- QMD semantic search (disabled) ---',
  '# QMD_TRANSPORT=mcp',
  '# QMD_WIKI_COLLECTION=sshlg_projects',
].join('\n');

// Exactly what write_config() leaves behind: three keys, nothing else.
const TRUNCATED = [
  'OBSIDIAN_VAULT_PATH=/vault/new',
  'OBSIDIAN_WIKI_REPO="/site-packages/obsidian_wiki/_data"',
  'OBSIDIAN_WIKI_VERSION="2026.8"',
].join('\n');

it('every dropped key comes back', () => {
  const { text, restored } = H.reapply(SNAPSHOT, TRUNCATED);
  for (const k of ['CLAUDE_HISTORY_PATH', 'CURSOR_HISTORY_PATH', 'OBSIDIAN_SOURCES_EXCLUDE']) {
    assert.ok(text.includes(k), `still missing after restore: ${k}`);
    assert.ok(restored.includes(k), `restore did not report ${k}`);
  }
});

it('the QMD block survives — it is commented out, so no key-level merge can see it', () => {
  const { text } = H.reapply(SNAPSHOT, TRUNCATED);
  assert.ok(text.includes('# QMD_TRANSPORT=mcp'),
    'the commented QMD block was lost, which is what merging keys instead of keeping the file does');
  assert.ok(text.includes('# --- QMD semantic search (disabled) ---'));
});

it('what setup deliberately wrote wins — the new values are adopted', () => {
  const { text, updated } = H.reapply(SNAPSHOT, TRUNCATED);
  assert.ok(text.includes('OBSIDIAN_VAULT_PATH=/vault/new'), 'the old vault path was kept over the new one');
  assert.ok(!text.includes('/vault/old'), 'the stale value survived');
  assert.ok(text.includes('OBSIDIAN_WIKI_VERSION="2026.8"'), 'the version was not updated');
  assert.ok(updated.includes('OBSIDIAN_VAULT_PATH'));
});

it('a key setup invented is appended, not dropped', () => {
  const { text } = H.reapply(SNAPSHOT, TRUNCATED);
  assert.ok(text.includes('OBSIDIAN_WIKI_REPO='),
    'a key the new version writes was silently reverted by the restore');
});

it('the header comments survive, because the file is the base and not the keys', () => {
  const { text } = H.reapply(SNAPSHOT, TRUNCATED);
  assert.ok(text.startsWith('# Obsidian Wiki Configuration'));
});

it('restoring an untouched config changes nothing', () => {
  const { text, restored } = H.reapply(SNAPSHOT, SNAPSHOT);
  assert.strictEqual(text, SNAPSHOT, 'a no-op restore rewrote the file');
  assert.deepStrictEqual(restored, []);
});

it('restore is idempotent — running it twice is running it once', () => {
  const once = H.reapply(SNAPSHOT, TRUNCATED).text;
  const twice = H.reapply(once, TRUNCATED).text;
  assert.strictEqual(twice, once, 'the second restore changed the file again');
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
