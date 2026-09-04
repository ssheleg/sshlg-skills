#!/usr/bin/env node
'use strict';
// Fixtures for lib/shadow.js.
//
// The check this replaces under-reports, and the fixture that matters is the one
// where plugin and marketplace names differ — because that is the case the cheap
// version misses and the case this machine actually has.

const assert = require('assert');
const S = require('../lib/shadow.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// Real shapes from this machine: the skill id on the left, the plugin that
// provides it on the right. Note that neither pair shares a name.
const PROVIDED = {
  'ux-flows': 'super-ux@super-ux',
  'copywriting': 'super-ux@super-ux',
  'sheleg-design': 'sheleg-design@sheleg-design-skill',
  'task-pipeline': 'task-pipeline@task-pipeline',
};

it('a plain copy of a plugin-provided skill is a shadow', () => {
  const rows = S.shadows(['task-pipeline', 'graphify'], PROVIDED);
  assert.strictEqual(rows.length, 1);
  assert.deepStrictEqual(rows[0],
    { skill: 'task-pipeline', plugin: 'task-pipeline@task-pipeline', scope: 'home', at: null });
});

it('a bare name still means the home directory — the older call shape survives', () => {
  // The project scope arrived after this module. Migrating every call site to objects
  // would have been a change to callers for a change in one of them.
  assert.strictEqual(S.shadows(['task-pipeline'], PROVIDED)[0].scope, 'home');
});

it('a project copy is reported separately, with the consequence a home copy lacks', () => {
  // Measured: 173 files across seven skill directories swept into a commit whose
  // message was about an MCP server, by one `git add -A`. (#98)
  const rows = S.shadows([{ name: 'task-pipeline', scope: 'project', at: './.claude/skills' }], PROVIDED);
  assert.strictEqual(rows[0].scope, 'project');
  const out = S.render(rows);
  assert.ok(/inside a git tree/.test(out), 'the git consequence is not stated');
  assert.ok(out.includes('!.claude/skills/'),
    'the allowlist shape is missing — a bare ignore deletes the one correct case');
  assert.ok(!/~\/\.claude\/skills\/ —/.test(out), 'a project row was reported as a home row');
});

it('a project copy names the tooling consequence, not only the git one', () => {
  // The half that stops a release rather than dirtying a history. Measured: six skills,
  // seven vendored `.cjs`, and a deploy script refusing to ship on 143 problems in files
  // the operator had never seen. (#86)
  const out = S.render(S.shadows([{ name: 'task-pipeline', scope: 'project' }], PROVIDED));
  assert.ok(/tooling discovers it/.test(out), 'the lint-gate consequence is not stated');
  assert.ok(/`files` scope/.test(out),
    'the reason a flat config reaches vendored files is missing, so the remedy reads as superstition');
});

it('the consequence COUNT is derived from the list, never restated', () => {
  // It said "two consequences" over a body of three for exactly as long as it took to
  // add one. A restated number is the defect this repository catches most often.
  const out = S.render(S.shadows([{ name: 'task-pipeline', scope: 'project' }], PROVIDED));
  const claimed = Number(/— (\d+) consequences/.exec(out)[1]);
  const listed = (out.match(/^ {2}\d+\. /gm) || []).length;
  assert.strictEqual(claimed, listed, `header claims ${claimed}, body lists ${listed}`);
});

it('the ignore shape explains why the trailing star is load-bearing', () => {
  // `.claude/skills/` without it excludes the directory, git does not descend into it,
  // and the `!` negation never fires — so the allowlist silently keeps nothing.
  const out = S.render(S.shadows([{ name: 'task-pipeline', scope: 'project' }], PROVIDED));
  assert.ok(/does not descend into an excluded/.test(out),
    'the reason is missing, and a rule with no reason is copied wrong');
});

it('both scopes in one run print two sections, home first', () => {
  const out = S.render(S.shadows(
    ['task-pipeline', { name: 'task-pipeline', scope: 'project', at: 'p' }], PROVIDED));
  assert.ok(out.indexOf('~/.claude/skills/') < out.indexOf("THIS PROJECT's"),
    'the sections are out of order, so the two consequences read as one');
});

it('a skill that exists ONLY as a plain copy is not a shadow', () => {
  // `graphify` and `context7-docs` live nowhere else on this machine. Reporting
  // them would train the operator to ignore the report.
  assert.deepStrictEqual(S.shadows(['graphify', 'context7-docs'], PROVIDED), []);
});

it('the skill id is compared, not the marketplace name', () => {
  // `sheleg-design` ships from the `sheleg-design-skill` marketplace. A check
  // comparing marketplace names finds nothing here and reports a clean machine.
  const rows = S.shadows(['sheleg-design'], PROVIDED);
  assert.strictEqual(rows.length, 1, 'the differing-name case was missed — the under-report this module exists for');
  assert.strictEqual(rows[0].plugin, 'sheleg-design@sheleg-design-skill');
});

it('several skills from one plugin each shadow it separately', () => {
  const rows = S.shadows(['copywriting', 'ux-flows'], PROVIDED);
  assert.strictEqual(rows.length, 2);
  assert.deepStrictEqual(rows.map((r) => r.skill), ['copywriting', 'ux-flows'], 'rows are not sorted');
});

it('a Map is accepted as well as an object', () => {
  const rows = S.shadows(['task-pipeline'], new Map(Object.entries(PROVIDED)));
  assert.strictEqual(rows.length, 1);
});

it('empty inputs are silence, not a throw', () => {
  assert.deepStrictEqual(S.shadows(undefined, undefined), []);
  assert.deepStrictEqual(S.shadows([], PROVIDED), []);
});

it('a clean machine renders nothing at all', () => {
  assert.strictEqual(S.render([]), '');
  assert.strictEqual(S.render(undefined), '');
});

it('the report names the skill, the plugin, and the remedy', () => {
  const out = S.render(S.shadows(['sheleg-design'], PROVIDED));
  assert.match(out, /sheleg-design/);
  assert.match(out, /sheleg-design-skill/);
  assert.match(out, /sshlg-skills@latest update/, 'the report does not say what to do about it');
});

it('the count agrees with the rows, singular and plural', () => {
  assert.match(S.render(S.shadows(['task-pipeline'], PROVIDED)), /1 shadowing plain copy/);
  assert.match(S.render(S.shadows(['task-pipeline', 'ux-flows'], PROVIDED)), /2 shadowing plain copies/);
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
