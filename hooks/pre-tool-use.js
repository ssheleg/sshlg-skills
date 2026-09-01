#!/usr/bin/env node
'use strict';
/**
 * `PreToolUse` — the half of this pack that holds rather than speaks.
 *
 * Three decisions, in the order their cost falls:
 *
 * 1. **A write to a file the operator cannot recover** takes a copy first. If the
 *    copy cannot be proven, the call is DENIED — the rule `lib/backup.js` already
 *    applies to this pack's own writes, finally applied to everyone else's.
 * 2. **A bare `npx skills update <family member>`** is denied, because it creates
 *    the plain copy that shadows the plugin and serves its version forever. The
 *    reason carries the launcher command, so the denial is a redirection.
 * 3. **`obsidian-wiki setup`** gets a snapshot of the config it is about to
 *    truncate. Nothing is denied here; `hooks/post-tool-use.js` puts back what
 *    the tool drops.
 *
 * All deciding is in `lib/guard.js` and `lib/hygiene.js`, both pure and fixtured.
 * This file moves bytes and touches the filesystem exactly where a backup happens.
 *
 * **It fails silent.** A guard that throws on an unfamiliar payload would break
 * every tool call in every session, including sessions of packs that never asked
 * for this one. Silence costs one unguarded write; a throw costs the machine.
 */

const path = require('path');
const os = require('os');
const fs = require('fs');

const LIB = path.join(__dirname, '..', 'lib');

/** The one output shape this event accepts. */
function say(decision, reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: decision,
      permissionDecisionReason: reason,
    },
  }) + '\n');
}

/**
 * The routing escalation — the only thing a hook can do about "take the route".
 *
 * A hook cannot make a model invoke a skill. It can refuse the un-routed path and
 * name the route, once, and let the operator decide in one keystroke. Everything
 * that makes this bearable lives in `lib/routegate.js`: once per turn, only when
 * the prompt asked for it, only when no run is open, and silenced for the session
 * by any router's refusal phrase.
 */
function routeGate(data, home) {
  try {
    const routegate = require(path.join(LIB, 'routegate.js'));
    if (!routegate.TOOLS.includes(data.tool_name)) return process.exit(0);

    const turnstate = require(path.join(LIB, 'turnstate.js'));
    const state = turnstate.read(home, data.session_id);

    const cwd = data.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
    // Derived from the ledger's CONTENT, not from its existence. A closed run's file
    // stays on disk and keeps being appended to, and asking `existsSync` silenced this
    // gate here for six days after `stage: 10 acceptance — verdict pass` (UM-01).
    const ledgerPath = path.join(cwd, '.task-pipeline', 'run.md');
    let runOpen = false;
    if (fs.existsSync(ledgerPath)) {
      const runledger = require(path.join(LIB, 'runledger.js'));
      let finalStage = null;
      try {
        const pipeline = JSON.parse(fs.readFileSync(path.join(cwd, 'pipeline.json'), 'utf8'));
        const stages = pipeline.stages || [];
        const last = stages[stages.length - 1] || {};
        finalStage = last.state || last.name || null;
      } catch (e) {
        /* No pipeline here: fall back to the highest stage id the ledger itself carries. */
      }
      runOpen = runledger.isOpen(fs.readFileSync(ledgerPath, 'utf8'), finalStage);
    }

    const triggers = require(path.join(LIB, 'triggers.js'));
    const lines = {};
    for (const [name, spec] of Object.entries(triggers.ROUTES)) lines[name] = spec.line;

    const verdict = routegate.decide(data, state, { runOpen, lines });
    if (!verdict) return process.exit(0);

    // Recorded BEFORE the prompt is emitted: a turn that edits forty files must
    // ask once, and an escalation that failed to record itself asks forty times.
    turnstate.write(home, data.session_id, { asked: true });
    say('ask', verdict.reason);
  } catch (e) {
    /* Silence: an escalation that throws must not cost the turn. */
  }
  return process.exit(0);
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  try {
    const data = raw.trim().startsWith('{') ? JSON.parse(raw) : {};
    const home = os.homedir();
    const command = (data.tool_input && data.tool_input.command) || '';

    // 1. The command that quietly pins a skill at an old version.
    const hygiene = require(path.join(LIB, 'hygiene.js'));
    if (command) {
      let ids = new Set();
      try {
        const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'skills.json'), 'utf8'));
        ids = hygiene.familyIds(manifest);
      } catch (e) {
        // Guard nothing rather than guess — but SAY SO. This was a bare swallow, and
        // the failure it hides is the shadow guard returning an empty id set and
        // denying nothing, silently: the one guard this pack was written around, off,
        // with no trace. stderr and not `say()`, deliberately — a missing manifest is
        // a diagnostic, and a hook that answered `allow` to it would be deciding
        // something it cannot know.
        process.stderr.write(
          '[sshlg-skills] no skills.json beside the hook — the shadow guard is '
          + 'inert this turn; reinstall with `npx sshlg-skills hooks install`\n');
      }
      const bare = hygiene.bareFamilyInstall(command, ids);
      if (bare) {
        say('deny',
          `\`${bare.verb} ${bare.target}\` through the bare skills CLI creates ` +
          '~/.claude/skills/' + bare.target + ', a plain copy that shadows the plugin of the ' +
          'same name and serves the version it was copied from forever.\n' +
          `Use the family launcher instead: ${bare.remedy}`);
        return process.exit(0);
      }
    }

    // 2. The config `setup` is about to truncate.
    if (command && hygiene.isObsidianSetup(command)) {
      try {
        const backup = require(path.join(LIB, 'backup.js'));
        const cfg = path.join(home, '.obsidian-wiki', 'config');
        // `realpath`, because `config` is a symlink to the active profile and the
        // write follows it — a copy of the link is a copy of nothing.
        const real = fs.existsSync(cfg) ? fs.realpathSync(cfg) : cfg;
        backup.guard({ file: real, home });
      } catch (e) { /* a missing wiki config is the normal case on most machines */ }
    }

    // 3. The write that cannot be undone.
    const guard = require(path.join(LIB, 'guard.js'));
    const target = guard.decide(data, home);
    if (!target) return routeGate(data, home);

    const backup = require(path.join(LIB, 'backup.js'));
    const saved = backup.guard({ file: target, home });
    if (saved.action === 'backup-failed') {
      say('deny',
        `${target} is an instruction file with no version control behind it, and a ` +
        `copy of it could not be taken (${saved.error}). The write was not performed.\n` +
        'Fix the backup directory (~/.sshlg-skills/backups) and try again.');
      return process.exit(0);
    }
    say('allow', saved.action === 'no-file'
      ? `${target} does not exist yet — creating it destroys nothing.`
      : `copy taken before the write: ${saved.path}`);
  } catch (e) {
    /* Silence, deliberately. See the header. */
  }
  process.exit(0);
});
