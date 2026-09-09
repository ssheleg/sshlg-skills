'use strict';
/**
 * The argv the launcher hands the skills CLI — built in one place for every
 * command that talks to it.
 *
 * Before this module `install` and `update` each built their own commands, and
 * the difference cost a release. `install` issued
 * `skills add <repo> --agent …`; `update` issued `skills update <name>` with no
 * agent at all. `skills update` is a **no-op for a skill installed nowhere**,
 * so a member added to the family after a channel was last fed never reached
 * it — while `update` printed a confident line per skill, because naming a
 * skill is not the same as having installed one. Seven of nineteen skills were
 * found absent from the hub on 2026-08-10 after exactly that.
 *
 * So `update` now reconciles rather than merely refreshes: refresh what is
 * there, then add what is not. The two verbs come from one builder, and a
 * fixture asserts they agree, because the previous drift was invisible in
 * review — the two functions read correctly on their own and only disagreed
 * about a case neither mentioned.
 *
 * Pure by construction, like `routers.js` and `drift.js`: it returns argv and
 * spawns nothing, which is what lets the contract be tested without a network.
 */

/**
 * One `--agent` flag per agent.
 *
 * The skills CLI does not split a comma- or space-joined value: `--agent a,b`
 * installs to an agent literally named `a,b`, which exists nowhere, and the
 * run still reports success.
 */
function agentFlags(agents) {
  return (agents || []).reduce((acc, a) => acc.concat('--agent', a), []);
}

/** `skills add` takes the REPO — it clones it. */
function addArgs(repo, agents) {
  return ['--yes', 'skills', 'add', repo].concat(agentFlags(agents), ['--global', '--yes']);
}

/**
 * `skills add` PINNED to an immutable ref (FIX-UP-01.01) — `repo@<sha>`, so
 * the clone lands the exact bytes the lock recorded rather than whatever the
 * branch tip happens to be. A member the lock could not pin (UNSUPPORTED_PIN)
 * gets NO install argv: installing it would mean installing a moving ref,
 * which is the promise the lock exists to keep.
 */
function addArgsPinned(repo, ref, agents) {
  return ['--yes', 'skills', 'add', `${repo}@${ref}`]
    .concat(agentFlags(agents), ['--global', '--yes']);
}

/**
 * `skills update` takes the SKILL id — it matches what is installed.
 *
 * A repo may ship several skills under different names (super-ux ships seven,
 * and none of them is called `super-ux`), so passing a repo name here matches
 * nothing and updates nothing.
 */
function updateArgs(name) {
  return ['--yes', 'skills', 'update', name, '--global', '--yes'];
}

/**
 * Which agents this run targets: `--all` wins, then `--agent`, then the pack's
 * defaults. `claude-code` is removed while the plugin channel is on — the
 * skills CLI would write `~/.claude/skills/<id>`, and that plain copy shadows
 * the plugin and serves its frozen version forever.
 */
function resolveAgents(defaults, flags) {
  const f = flags || {};
  if (f.all) return ['*'];
  const chosen = (f.agents && f.agents.length) ? f.agents.slice() : (defaults || []).slice();
  return f.claude === false ? chosen : chosen.filter((a) => a !== 'claude-code');
}

/** Every skill id a member advertises, or its own name when it advertises none. */
function skillIds(skill) {
  const n = skill.skillNames;
  return (n && n.length) ? n.slice() : [skill.name];
}

/** `install`: add every repo to every agent. */
function installPlan(skills, agents) {
  if (!agents || !agents.length) return [];
  return (skills || []).map((s) => addArgs(s.repo, agents));
}

/**
 * `install` from a LOCK: pin every member to its recorded SHA, and REFUSE the
 * members the lock could not pin rather than installing a moving ref
 * (FIX-UP-01.01). Returns `{plan, skipped}` — the skipped list names each
 * UNSUPPORTED_PIN member so a caller reports it instead of quietly shipping a
 * partial set as if it were the whole one.
 */
function installPlanLocked(lock, skillsByName, agents) {
  const plan = [];
  const skipped = [];
  if (!agents || !agents.length) return { plan, skipped };
  for (const m of (lock && lock.members) || []) {
    const s = (skillsByName || {})[m.name];
    if (!s) { skipped.push({ name: m.name, reason: 'not in skills.json' }); continue; }
    if (m.status === 'pinned' && m.ref) {
      plan.push(addArgsPinned(s.repo, m.ref, agents));
    } else {
      skipped.push({ name: m.name, reason: m.reason || 'UNSUPPORTED_PIN' });
    }
  }
  return { plan, skipped };
}

/**
 * `update`: refresh what is present, then add what is not.
 *
 * Order matters and is asserted. Refreshing first means a skill already
 * installed is updated by the verb meant for it, and the add that follows is
 * the idempotent no-op the CLI reports as "already installed" — rather than a
 * reinstall racing an update over the same directory.
 *
 * With no agents resolved the add half is omitted entirely: `skills add`
 * without `--agent` auto-detects, and auto-detection is the thing that drops a
 * plain Claude copy beside the plugin.
 */
function updatePlan(skills, agents) {
  const list = skills || [];
  const refresh = list.reduce((acc, s) => acc.concat(skillIds(s).map(updateArgs)), []);
  return refresh.concat(installPlan(list, agents));
}

/**
 * Which plain copies under `~/.claude/skills/` are genuine shadows.
 *
 * A copy shadows a plugin and serves its frozen version forever — the one
 * failure mode this pack exists to automate away. But it is only a shadow when
 * a plugin of the SAME MEMBER is installed, and that is not the same question
 * as "is this run touching plugins". The prune used to hang off the latter, so
 * `update --no-claude` created a copy and left it sitting beside a live
 * plugin.
 *
 * Matching is by MARKETPLACE, never by skill id: `sheleg-design` ships under
 * the `sheleg-design-skill` marketplace, so a lookup keyed on the skill name
 * finds nothing and prunes nothing — leaving exactly the shadow it was written
 * to remove.
 *
 * @param members       skills.json entries, each with `marketplace` and skill ids
 * @param marketplaces  marketplace directory names present on disk
 * @param copies        skill ids that actually have a plain copy right now
 */
// `installed` is the set of marketplaces whose plugin is ACTUALLY INSTALLED — not the
// set of marketplaces present on disk. The two are different and the difference deletes
// work: `claude plugin marketplace add` and `claude plugin install` are separate
// operations, so a marketplace can outlive its plugin (a failed install, an uninstall).
// Fed the marketplace list, this function pruned the plain copy of a member whose plugin
// was gone — removing the only copy and taking the skill out of Claude Code entirely.
// Measured 2026-08-15: `shadowsToPrune([agent-stack], ['agent-stack'], ['agent-orchestrator'])`
// returned `['agent-orchestrator']` with no plugin installed anywhere.
//
// The caller reads the installed set and passes it; where it cannot be read it passes
// nothing, and nothing is pruned. A component that never received its input refuses.
function shadowsToPrune(members, installed, copies) {
  const present = new Set(installed || []);
  const existing = new Set(copies || []);
  const out = [];
  for (const m of members || []) {
    if (!present.has(m.marketplace)) continue;
    for (const id of skillIds(m)) {
      if (existing.has(id) && out.indexOf(id) === -1) out.push(id);
    }
  }
  return out;
}

module.exports = {
  agentFlags, addArgs, addArgsPinned, updateArgs, resolveAgents, skillIds,
  installPlan, installPlanLocked, updatePlan, shadowsToPrune,
};
