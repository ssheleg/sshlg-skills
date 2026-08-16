#!/usr/bin/env node
'use strict';
/**
 * This repository's own gate, run at the moment it can still prevent something.
 *
 * Wired by `.claude/settings.json` — committed, so a clone arrives with the gate
 * rather than acquiring it when somebody remembers. Two events:
 *
 * - `PreToolUse` on `Bash`: a `git commit` runs `npm test` first, and a red suite
 *   DENIES the commit with the failing tail in the reason. `docs/DOCMAP.md`
 *   already names this command as the gate; until now nothing ran it before the
 *   commit, only after the push, attached to a red CI badge minutes later.
 * - `PostToolUse` on `Edit|Write`: a `SKILL.md` whose front matter breaks the
 *   Agent Skills limits is reported in the same turn it was written. `agent-stack`
 *   spent days red on exactly that class, diagnosed from another repository.
 *
 * **The gate is only honest because of a number.** `npm test` costs ~8.5 s here
 * (8.29 / 8.57 / 8.83 s, three runs, 2026-08-16). It was written as 3.3 s and
 * never recomputed; the argument survives the correction, which is the only
 * reason this is a number and not a feeling.
 * A synchronous gate at three minutes is a gate people route around, and this
 * file would then be teaching the habit it exists to prevent.
 *
 * The deciding is `lib/repogate.js`, pure and fixtured. This runs the suite.
 */

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

// Two roots, and conflating them is how this became untestable in the first
// draft. The module is loaded from beside this script; the suite runs in the
// project the hook was wired from, which `CLAUDE_PROJECT_DIR` names and which a
// fixture can therefore point somewhere else.
const SCRIPT_ROOT = path.resolve(__dirname, '..');
const PROJECT = process.env.CLAUDE_PROJECT_DIR || SCRIPT_ROOT;
const gate = require(path.join(SCRIPT_ROOT, 'lib', 'repogate.js'));

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }) + '\n');
}

function report(reason) {
  process.stdout.write(JSON.stringify({ decision: 'block', reason }) + '\n');
}

/** The last few lines of a failing suite — the part that names the check. */
function tail(text, lines) {
  return String(text || '').trimEnd().split('\n').slice(-(lines || 12)).join('\n');
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  try {
    const data = raw.trim().startsWith('{') ? JSON.parse(raw) : {};
    const input = data.tool_input || {};

    if (data.hook_event_name === 'PreToolUse') {
      if (!gate.isCommit(input.command || '')) return process.exit(0);
      // Whose commit is this? The payload carries no shell cwd, and this hook is
      // wired from ONE project — so a commit made inside a submodule would be
      // gated by the umbrella's suite, which is a different repository's verdict
      // about a change it does not contain. Watched: it deadlocked a release, the
      // umbrella being red precisely because the submodule had not shipped yet.
      // Staged changes are the decidable version of the question: a commit for
      // THIS project must have something staged in it.
      try {
        execFileSync('git', ['diff', '--cached', '--quiet'], { cwd: PROJECT, stdio: 'pipe' });
        return process.exit(0);  // nothing staged here — the commit is not ours
      } catch (e) {
        if (e.status !== 1) return process.exit(0);  // not a git repo, or git is absent
      }
      try {
        execFileSync('npm', ['test'], { cwd: PROJECT, encoding: 'utf8', stdio: 'pipe' });
      } catch (e) {
        deny('`npm test` is red, so this commit was not made. ' +
          'This repository\'s gate is that command (docs/DOCMAP.md → The gate).\n\n' +
          tail(`${e.stdout || ''}${e.stderr || ''}`));
      }
      return process.exit(0);
    }

    const file = input.file_path || '';
    if (!gate.isSkillManifest(file) || !fs.existsSync(file)) return process.exit(0);
    const rows = gate.violations(fs.readFileSync(file, 'utf8'));
    // The file is already written — this event fires after the tool ran — so the
    // wording is a report, never a claim that anything was prevented.
    if (rows.length) report(gate.render(rows, file));
  } catch (e) {
    /* Silence: a gate that throws blocks every command in the repository. */
  }
  process.exit(0);
});
