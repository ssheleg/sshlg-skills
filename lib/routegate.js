'use strict';
/**
 * "The agent should pick the right skill itself and go through the pipeline."
 *
 * **A hook cannot make a model invoke a skill.** It has exactly one power: to
 * refuse the un-routed path and name the route in the refusal. Promising more
 * would be the false guarantee `task-pipeline`'s own `references/hooks.md` warns
 * about — *never describe a project as protected when the mechanism cannot
 * protect it* — so this module does the one thing it can, and the wording says so.
 *
 * The decision, and every narrowness in it:
 *
 * - **`ask`, never `deny`.** The operator answers once and the work continues.
 *   A hard refusal here would fight the routing block's own boundary, which says a
 *   typo, a one-line edit or a mechanical rename does NOT go through the pipeline
 *   — and no hook can tell a typo from a feature.
 * - **Once per turn.** The key is `prompt_id`, so a turn that edits forty files
 *   asks once. A prompt that asks on every call is a prompt that gets answered
 *   without being read.
 * - **Only when the prompt asked for it.** The classification is
 *   `lib/triggers.js`'s, which is conservative by construction: a question is
 *   silence, a refusal phrase is silence, and no signal is silence.
 * - **Only when no run is open.** A `.task-pipeline/run.md` means the route was
 *   already taken; asking again would be the pipeline interrupting itself.
 * - **A refusal phrase silences the whole session, not the turn.** Someone who
 *   says «без пайплайна» has decided, and making them decide again every turn is
 *   how an operator learns to turn a hook off entirely.
 * - **Never inside `bypassPermissions`.** That mode IS the operator's answer,
 *   given in advance for the whole session; asking again converts its one
 *   guarantee — no prompts — into "no prompts except ours", which reads as a
 *   broken bypass toggle (issue #124, observed live 2026-09-09).
 * - **Only for writes that land INSIDE the project.** The boundary this gate
 *   enforces is "it changes the repository", and it cuts both ways: a scratch
 *   file in a session scratchpad changes no repository, and gating it is the
 *   over-catch the header above warns gets a hook switched off. The same test
 *   task-pipeline's build-gate already applies (`rel.startswith("..")`).
 *
 * Pure. The turn's state is read and written by the hook.
 */
const path = require('path');

/** The tools that change a repository. `Bash` is deliberately absent — see below. */
const TOOLS = ['Edit', 'Write', 'MultiEdit', 'NotebookEdit'];

/**
 * Should this tool call stop and ask which route it is on?
 *
 * `state` is what the turn recorded: `{promptId, routes, optedOut, asked}`.
 * Returns `null` for silence, or `{reason}` for a single escalation.
 *
 * `Bash` is not in `TOOLS` on purpose. A shell command is how the agent runs
 * tests, reads logs and inspects the tree, and gating that would put a permission
 * prompt in front of the work rather than in front of the change.
 */
function decide(payload, state, opts) {
  const p = payload || {};
  const s = state || {};
  const o = opts || {};

  if (!TOOLS.includes(p.tool_name)) return null;
  // bypassPermissions is the operator's wholesale answer; a hook's 'ask' forces
  // a dialog even there, so the only correct move is silence.
  if (p.permission_mode === 'bypassPermissions') return null;
  // A write that lands outside the project changes no repository. Judged only
  // when the payload names both the target and the cwd — a call this cannot
  // place keeps the gate's old behaviour rather than inventing an exemption.
  const target = p.tool_input && (p.tool_input.file_path || p.tool_input.notebook_path);
  if (target && p.cwd) {
    const rel = path.relative(path.resolve(p.cwd), path.resolve(p.cwd, target));
    if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  }
  if (s.optedOut) return null;
  if (s.asked) return null;
  if (o.runOpen) return null;
  if (!s.routes || !s.routes.length) return null;
  // A turn's classification belongs to that turn. Without this, a stale record
  // from a previous prompt would escalate a call nobody asked about.
  if (p.prompt_id && s.promptId && p.prompt_id !== s.promptId) return null;

  return { reason: render(s.routes, o.lines) };
}

/**
 * What the operator reads in the permission prompt.
 *
 * It names the route, what taking it costs, and the exact phrase that declines it
 * — because a prompt that only says "are you sure" teaches nothing and gets
 * answered the same way every time.
 */
function render(routes, lines) {
  const named = routes.map((r) => `  - this ${(lines && lines[r]) || r}.`);
  return [
    'This prompt reads as work the family routes:',
    ...named,
    '',
    'No run is open in this project, so nothing has taken that route yet.',
    'Allow to edit directly; take the route instead by invoking it; or say the',
    'route\'s refusal phrase («без пайплайна», «без сценариев», «без дизайна», …)',
    'and this stays quiet for the rest of the session.',
  ].join('\n');
}

module.exports = { decide, render, TOOLS };
