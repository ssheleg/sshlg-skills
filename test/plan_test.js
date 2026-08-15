#!/usr/bin/env node
'use strict';
// Fixtures for lib/plan.js — the argv the launcher hands the skills CLI.
//
// This module exists because `install` and `update` built their commands in
// two independent places, and the difference between them was invisible until
// it cost a release: `install` issued `skills add <repo> --agent …`, `update`
// issued `skills update <name>` with no agent at all. `skills update` is a
// no-op for a skill installed nowhere, so a family member added after a
// channel was last fed never arrived — and `update` reported success for it,
// line by line, because printing "Updating evidence-docs…" is not the same as
// having updated anything.
//
// Observed 2026-08-10: seven of nineteen skills were absent from the hub after
// an `update` that named all nineteen. One builder now serves both commands,
// so the two cannot drift apart again without a fixture noticing.

const assert = require('assert');
const P = require('../lib/plan.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const DEFAULTS = ['cursor', 'openclaw', 'kiro-cli'];

it('an agent list becomes one --agent flag per agent, never a joined value', () => {
  // The skills CLI does not split a comma- or space-joined value. A single
  // `--agent a,b` silently installs to one agent named "a,b" — which is to
  // say, to none.
  assert.deepStrictEqual(
    P.agentFlags(['cursor', 'openclaw']),
    ['--agent', 'cursor', '--agent', 'openclaw']
  );
});

it('addArgs names the REPO, because that is what the CLI clones', () => {
  assert.deepStrictEqual(
    P.addArgs('ssheleg/agent-stack', ['openclaw']),
    ['--yes', 'skills', 'add', 'ssheleg/agent-stack', '--agent', 'openclaw', '--global', '--yes']
  );
});

it('updateArgs names the SKILL, because that is what the CLI matches', () => {
  // A repo can ship several skills under different ids — super-ux ships seven
  // and there is no skill called "super-ux". `skills update` matches installed
  // skill names, so passing the repo name here updates nothing.
  assert.deepStrictEqual(
    P.updateArgs('evidence-docs'),
    ['--yes', 'skills', 'update', 'evidence-docs', '--global', '--yes']
  );
});

it('the resolved agent set is the defaults when nothing is asked for', () => {
  assert.deepStrictEqual(P.resolveAgents(DEFAULTS, {}), DEFAULTS);
});

it('--agent replaces the defaults rather than adding to them', () => {
  assert.deepStrictEqual(P.resolveAgents(DEFAULTS, { agents: ['zed'] }), ['zed']);
});

it('--all collapses to the CLI wildcard', () => {
  assert.deepStrictEqual(P.resolveAgents(DEFAULTS, { all: true }), ['*']);
});

it('claude-code is dropped from the skills-CLI set while the plugin channel is on', () => {
  // One channel per agent. The skills CLI writes ~/.claude/skills/<id>, and
  // that plain copy shadows the plugin and serves its frozen version forever.
  assert.ok(!P.resolveAgents(['cursor', 'claude-code'], { claude: true }).includes('claude-code'));
});

it('with --no-claude the caller may keep claude-code, since no plugin competes', () => {
  assert.ok(P.resolveAgents(['cursor', 'claude-code'], { claude: false }).includes('claude-code'));
});

it('update plans an add for every repo, not only a refresh for every skill', () => {
  // The whole defect in one fixture. A plan that contains only `update` verbs
  // cannot install a member that reached no channel, and that is exactly the
  // state seven skills were found in.
  const SKILLS = [
    { name: 'task-pipeline', repo: 'ssheleg/task-pipeline', skillNames: ['task-pipeline', 'evidence-docs'] },
    { name: 'agent-stack', repo: 'ssheleg/agent-stack', skillNames: ['agent-orchestrator'] },
  ];
  const plan = P.updatePlan(SKILLS, ['openclaw']);
  const verbs = plan.map((a) => a[2]);
  assert.ok(verbs.includes('update'), 'no refresh step');
  assert.ok(verbs.includes('add'), 'update cannot install what is missing — the defect this closes');
  const added = plan.filter((a) => a[2] === 'add').map((a) => a[3]);
  assert.deepStrictEqual(added, ['ssheleg/task-pipeline', 'ssheleg/agent-stack']);
});

it('update refreshes by every declared skill id, not by repo name', () => {
  const SKILLS = [{ name: 'super-ux', repo: 'ssheleg/super-ux', skillNames: ['vision', 'ux-audit'] }];
  const refreshed = P.updatePlan(SKILLS, ['openclaw']).filter((a) => a[2] === 'update').map((a) => a[3]);
  assert.deepStrictEqual(refreshed, ['vision', 'ux-audit']);
});

it('a member with no skillNames falls back to its own name', () => {
  const SKILLS = [{ name: 'lonely', repo: 'ssheleg/lonely' }];
  const refreshed = P.updatePlan(SKILLS, ['openclaw']).filter((a) => a[2] === 'update').map((a) => a[3]);
  assert.deepStrictEqual(refreshed, ['lonely']);
});

it('install and update issue the SAME add command for the same inputs', () => {
  // The two drifted apart once and the drift was invisible. Equality here is
  // the check that they cannot again.
  const SKILLS = [{ name: 'agent-stack', repo: 'ssheleg/agent-stack', skillNames: ['agent-orchestrator'] }];
  const agents = ['openclaw', 'goose'];
  const fromInstall = P.installPlan(SKILLS, agents).filter((a) => a[2] === 'add');
  const fromUpdate = P.updatePlan(SKILLS, agents).filter((a) => a[2] === 'add');
  assert.deepStrictEqual(fromUpdate, fromInstall);
});

it('the refresh runs before the add, so a present skill is not reinstalled first', () => {
  const SKILLS = [{ name: 'agent-stack', repo: 'ssheleg/agent-stack', skillNames: ['agent-orchestrator'] }];
  const verbs = P.updatePlan(SKILLS, ['openclaw']).map((a) => a[2]);
  assert.ok(verbs.indexOf('update') < verbs.indexOf('add'), verbs.join(','));
});

// --------------------------------------------------------------- shadows
//
// Found by breaking it. Teaching `update` to call `skills add` gave it the
// side effect `install` always had — the skills CLI auto-detects Claude Code
// and writes `~/.claude/skills/<id>` even when that agent was never asked for.
// `install` prunes those afterwards, but the prune sat behind `if (f.claude)`,
// so `update --no-claude` created a shadow and left it: observed on the
// operator's own machine at 20:35, a `task-pipeline` copy beside the
// `task-pipeline` plugin, serving a frozen version forever.
//
// The condition was a proxy for the real one. A plain copy is a SHADOW when a
// plugin of the same member is installed — which has nothing to do with
// whether this particular run was asked to touch plugins.

const MEMBERS = [
  { name: 'task-pipeline', marketplace: 'task-pipeline', skillNames: ['task-pipeline', 'evidence-docs'] },
  { name: 'sheleg-design', marketplace: 'sheleg-design-skill', skillNames: ['sheleg-design'] },
];

it('a plain copy is pruned when its member has a plugin installed', () => {
  assert.deepStrictEqual(
    P.shadowsToPrune(MEMBERS, ['task-pipeline'], ['task-pipeline', 'evidence-docs']),
    ['task-pipeline', 'evidence-docs']
  );
});

it('a plain copy survives when no plugin of that member is installed', () => {
  // Someone running --no-claude with no plugin channel at all is using the
  // plain copy deliberately. Deleting it would break the only copy they have.
  assert.deepStrictEqual(P.shadowsToPrune(MEMBERS, [], ['task-pipeline']), []);
});

it('the second argument is the INSTALLED set, and a marketplace is not one', () => {
  // Measured 2026-08-15, before this test existed: fed the marketplace list, the
  // function pruned the plain copy of a member whose plugin was not installed —
  // the only copy, and the skill with it. `marketplace add` and `plugin install`
  // are separate operations, so a marketplace routinely outlives its plugin.
  //
  // The function cannot tell the two apart; the caller must, and the caller now
  // reads `installed_plugins.json`. This test is what keeps the argument honest:
  // an empty installed set prunes nothing, however many marketplaces exist.
  assert.deepStrictEqual(P.shadowsToPrune(MEMBERS, [], ['task-pipeline', 'evidence-docs']), []);
  // …and a member whose plugin IS installed still loses its shadow.
  assert.deepStrictEqual(
    P.shadowsToPrune(MEMBERS, ['task-pipeline'], ['task-pipeline']),
    ['task-pipeline']
  );
});

it('the marketplace name is matched, not the skill id', () => {
  // sheleg-design ships under the `sheleg-design-skill` marketplace. Looking
  // for a marketplace named after the SKILL finds nothing and prunes nothing,
  // which is the shadow that would then live forever.
  assert.deepStrictEqual(
    P.shadowsToPrune(MEMBERS, ['sheleg-design-skill'], ['sheleg-design']),
    ['sheleg-design']
  );
});

it('only copies that actually exist are named for pruning', () => {
  assert.deepStrictEqual(P.shadowsToPrune(MEMBERS, ['task-pipeline'], ['evidence-docs']), ['evidence-docs']);
});

it('a plain copy belonging to no family member is never touched', () => {
  // ~/.claude/skills also holds skills this pack did not install.
  assert.deepStrictEqual(P.shadowsToPrune(MEMBERS, ['task-pipeline'], ['graphify', 'xlsx']), []);
});

it('an empty agent set produces no add commands rather than an unscoped install', () => {
  // `skills add` with no --agent auto-detects, and auto-detection is what
  // drops a plain Claude copy next to the plugin.
  const SKILLS = [{ name: 'agent-stack', repo: 'ssheleg/agent-stack', skillNames: ['agent-orchestrator'] }];
  assert.deepStrictEqual(P.updatePlan(SKILLS, []).filter((a) => a[2] === 'add'), []);
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
