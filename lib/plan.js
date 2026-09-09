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
/**
 * Scope resolution (FIX-UP-03.01): host writes and shared writes are DIFFERENT
 * axes, and a host-only plan must not hide a shared effect.
 *
 * The defect: `update --no-claude --agent codex` rewrote all three host files
 * (.claude/CLAUDE.md, .codex/AGENTS.md, .gemini/GEMINI.md) because the refresh
 * did not carry the agent selection into the block emitter, which iterated
 * every TARGET. And `skills update <name> --global` writes the shared hub —
 * which fans out to every symlinked channel — so a run that names one agent
 * still touches the storage every agent reads. That is not a missing flag; the
 * hub is shared by construction, so the honest move is to NAME the shared
 * effect in the plan rather than let a host-scoped command imply isolation.
 *
 * Pure. `hosts` is the {agent,dir,file} list the caller would otherwise iterate
 * blindly (apply.js's TARGETS); `consumers` is the symlink channels the caller
 * read off disk. Returns the host files this selection MAY touch, the shared
 * store and everyone it fans out to, and any isolation the request asked for
 * that cannot be delivered.
 *
 * @param opts.agents      selected agent ids (already resolved), or null for all
 * @param opts.claude      false when --no-claude
 * @param opts.claudeOnly  true when --claude-only
 * @param opts.hosts       [{agent,dir,file}] host-file targets (apply's TARGETS)
 * @param opts.sharedStore label of the shared skill store (e.g. '~/.agents/skills')
 * @param opts.consumers   channel paths that symlink into the shared store
 */
function resolveScope(opts) {
  const o = opts || {};
  const hosts = o.hosts || [];
  const selected = o.agents && o.agents.length ? new Set(o.agents) : null;

  // Host files this run may touch — filtered by the SAME selection the CLI was
  // given, never the whole TARGET list. --claude-only keeps only claude;
  // --no-claude drops it; an --agent list keeps exactly its members.
  const hostTargets = hosts.filter((h) => {
    if (o.claudeOnly) return h.agent === 'claude';
    if (h.agent === 'claude' && o.claude === false) return false;
    if (selected) return selected.has(h.agent);
    return true;
  });

  // The shared store fans out to every consumer regardless of which agent was
  // named — a shared write is never host-scoped, and saying otherwise is the
  // defect. A run that writes the store (any non-claudeOnly run does, via the
  // skills CLI) lists the store and its consumers as a NAMED part of the plan.
  const writesShared = !o.claudeOnly;
  const shared = writesShared
    ? {
        store: o.sharedStore || '~/.agents/skills',
        consumers: (o.consumers || []).slice(),
        reason: 'the skills CLI writes the shared store, and every channel symlinks into it — this is not host-scoped',
      }
    : null;

  // Impossible isolation, stated: asking to touch ONLY some agents while the
  // shared store (which the others also read) is being written cannot isolate
  // those others. It is unsupported, not silently granted.
  const unsupported = [];
  if (writesShared && (selected || o.claude === false) && (shared.consumers.length)) {
    unsupported.push({
      requested: 'host isolation for the named agents',
      why: 'the shared store fans out to ' + shared.consumers.length
        + ' channel(s); a shared write reaches agents this run did not name',
      surface: shared.consumers.slice(),
    });
  }

  return { hostTargets, shared, unsupported };
}


/**
 * Is a plugin record a VERIFIED replacement for a plain copy (FIX-UP-04.01)?
 *
 * A registry KEY is not enough: `plugins={"super-ux@super-ux":[]}` — a spec
 * with an empty installPath array and no cache payload — used to authorise
 * deleting the sole plain copy of every member skill, which is the copy plus
 * the skill. Pruning removes a working provider, so it may only run behind a
 * provider that is PROVABLY loadable: an applicable, enabled record with an
 * exact installPath whose payload actually exists (`payloadExists` probes the
 * filesystem; the caller supplies it). Absent / corrupt / stale (empty
 * array) / disabled / wrong-scope all fail this and prune NOTHING.
 *
 * Pure but for the injected `payloadExists`; the default treats every path as
 * absent, so a caller that forgets to probe prunes nothing rather than
 * everything.
 */
function providerVerified(record, payloadExists) {
  const probe = typeof payloadExists === 'function' ? payloadExists : () => false;
  const rows = Array.isArray(record) ? record : (record ? [record] : []);
  return rows.some((r) =>
    r && r.enabled !== false && typeof r.installPath === 'string'
    && r.installPath.length > 0 && probe(r.installPath));
}

/**
 * `installed` may be either the legacy array of marketplace names (kept for
 * back-compat: every entry is treated as verified) OR a map
 * `{ marketplace: pluginRecord }`, in which case each is gated through
 * `providerVerified`. Only a member whose marketplace has a VERIFIED provider
 * has its plain copies pruned.
 */
function shadowsToPrune(members, installed, copies, payloadExists) {
  let verified;
  if (Array.isArray(installed)) {
    verified = new Set(installed);                 // legacy: names = verified
  } else {
    verified = new Set();
    for (const [mkt, record] of Object.entries(installed || {})) {
      if (providerVerified(record, payloadExists)) verified.add(mkt);
    }
  }
  const existing = new Set(copies || []);
  const out = [];
  for (const m of members || []) {
    if (!verified.has(m.marketplace)) continue;
    for (const id of skillIds(m)) {
      if (existing.has(id) && out.indexOf(id) === -1) out.push(id);
    }
  }
  return out;
}

module.exports = {
  agentFlags, addArgs, addArgsPinned, updateArgs, resolveAgents, skillIds,
  installPlan, installPlanLocked, updatePlan, shadowsToPrune, providerVerified, resolveScope,
};
