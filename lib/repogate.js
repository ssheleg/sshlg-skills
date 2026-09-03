'use strict';
/**
 * The repository's own gate, as a decision two hooks can make.
 *
 * `docs/DOCMAP.md` already names `npm test` as this repository's gate and CI
 * already runs it. What neither does is stop a commit from being made while it is
 * red: the suite runs after the fact, and the red arrives minutes later attached
 * to a push. Three point three seconds is what the whole suite costs here, which
 * is the only reason a synchronous gate is honest — at three minutes it would be
 * a gate people learn to bypass.
 *
 * The second half is smaller and older: a `SKILL.md` whose front matter breaks the
 * Agent Skills limits fails in CI, in another repository, with a message about a
 * validator. `agent-stack` spent days red on exactly that. Checking it where it is
 * written turns a cross-repository mystery into a sentence in the same turn.
 *
 * Pure: commands and file text in, verdicts out. Running the suite belongs to the
 * hook.
 *
 * Two defects found on 2026-08-19 while proving the gate, both fixed here:
 *
 * - **The verb was read wherever it appeared in the payload.** A whole-line comment
 *   and a heredoc body fed to `cat` both read as invocations, so investigating the
 *   gate required obfuscating the word and recording the finding was refused by the
 *   guard describing it. The treatment already existed one module over — this now
 *   reuses `executablePart()` from `lib/hygiene.js` rather than growing a second
 *   implementation of the same idea.
 * - **Ownership was decided from the staged index.** See `commitDirs`.
 */

/** Front-matter limits from the Agent Skills standard. */
const LIMITS = { name: 64, description: 1024 };

const { executablePart } = require('./hygiene.js');

/**
 * Split a command into pieces that run independently.
 *
 * Fed what would RUN, not the whole payload: `executablePart` drops a heredoc body
 * going to something that is not a shell, and whole-line comments. Quoted strings
 * stay, because `bash -c 'git commit'` is a real invocation.
 */
function segments(command) {
  return executablePart(String(command || '')).split(/(?:\|\||&&|[;\n|])/);
}

/** Does this one segment invoke git's commit verb? */
function isCommitSegment(seg) {
  // A quote may sit where a space would: `bash -c "git commit -m x"` is one segment
  // and a real invocation. Reading only space-delimited words missed it, which was a
  // bypass rather than a false negative — measured 2026-08-19.
  if (!/(^|[\s('"`])git(\s|$)/.test(seg)) return false;
  if (!/(^|[\s('"`])commit([\s'"`]|$)/.test(seg)) return false;
  return !/(^|\s)--dry-run(\s|$)/.test(seg);
}

/**
 * `cd somewhere` and nothing else — the only shape that moves the shell.
 *
 * A leading `(` counts. `(cd skills/x && git commit …)` is the ordinary way to commit
 * in a submodule without moving the caller's shell, and the anchored form read it as
 * not-a-cd at all: cwd stayed `.`, so the umbrella claimed a member's commit on a
 * literal path — the same wrong claim B-106 reports for `$n`, arriving one step
 * earlier. Found by probing the fix rather than by reading it.
 */
function cdTarget(seg) {
  const m = /^\(?\s*cd\s+(?:--\s+)?(['"]?)([^'"\s)]+)\1\)?$/.exec(seg.trim());
  return m ? m[2] : null;
}

/**
 * Does this command move the shell to somewhere this module cannot resolve?
 *
 * B-106. `(cd $n && git commit …)` gives `cdTarget` a literal `$n`, which resolves to
 * no directory, so ownership came back unresolved and the caller fell through to the
 * OLD index question — the one `commitDirs` exists to replace. On 2026-08-20 that made
 * the umbrella claim a member's commit and deny it on the umbrella's own red suite,
 * with three members in flight. The refusal was correct behaviour and the claim was
 * not: a gate that denies somebody else's commit is how an operator learns to switch a
 * hook off.
 *
 * So an unexpanded expansion is reported as UNKNOWN ownership rather than resolved to
 * a wrong answer. The caller discloses instead of claiming. The trade-off is stated
 * rather than hidden: `cd $x && git commit` is a way past this gate, and it was already
 * one — the hook is best-effort and fails open by construction, so this narrows a wrong
 * claim without widening what gets through.
 */
function unresolvedCd(command) {
  for (const raw of segments(command)) {
    const cd = cdTarget(raw.trim());
    if (cd && /[$`]/.test(cd)) return true;
  }
  return false;
}

function joinPath(base, next) {
  if (next.startsWith('/') || next.startsWith('~')) return next;
  if (base === '.') return next;
  return `${base.replace(/\/$/, '')}/${next}`;
}

/**
 * Which directories would this command commit in, relative to the shell's cwd?
 *
 * **This replaces asking the index, and the reason is a measured bypass.** The gate
 * used to decide whose commit this is by running `git diff --cached --quiet` — at
 * PreToolUse, BEFORE the command runs. So in the ordinary compound form
 * (`git add -A && git commit -m x`) nothing is staged at decision time, the gate
 * concluded "not ours" and exited 0 without ever running the suite. Proven on
 * 2026-08-19 against a throwaway project: no output, exit 0, no suite (UM-09).
 *
 * The same heuristic misattributed in the other direction: another agent's staged
 * index made the umbrella look like the owner of a submodule's commit, which is how
 * a release once deadlocked — the umbrella red because the submodule had not
 * shipped, the submodule unable to commit the fix because the umbrella was red
 * (UM-11).
 *
 * The command's own text and the shell's cwd are the two things the command cannot
 * change under the hook, so ownership is derived from them: `-C <path>` on the
 * commit itself, otherwise wherever a preceding `cd` left the shell. `'.'` means
 * "wherever this ran", which the caller resolves against the payload's cwd.
 */
function commitDirs(command) {
  const dirs = [];
  let cwd = '.';
  for (const raw of segments(command)) {
    const seg = raw.trim();
    if (!seg) continue;
    const cd = cdTarget(seg);
    if (cd) { cwd = joinPath(cwd, cd); continue; }
    if (!isCommitSegment(seg)) continue;
    const c = /(?:^|\s)-C\s+(['"]?)([^'"\s]+)\1/.exec(seg);
    dirs.push(c ? joinPath(cwd, c[2]) : cwd);
  }
  return dirs;
}

/**
 * Is this command going to create a commit?
 *
 * Every spelling counts, and that is the point: `--amend` rewrites one, `-n`
 * skips the hooks a repository installed for itself, and `--dry-run` is the one
 * shape that does not — so it is the one shape allowed through.
 */
function isCommit(command) {
  return segments(command).some(isCommitSegment);
}

/** Does this path name a skill manifest? */
function isSkillManifest(file) {
  return /(^|[\\/])SKILL\.md$/.test(String(file || ''));
}

/**
 * The front-matter fields this gate cares about.
 *
 * Only `name` and `description`, and only their lengths — this is a length check
 * at the moment of writing, not a second validator. The repository's own
 * `test/validate.py` remains the authority; disagreeing with it here would create
 * exactly the second home this project keeps refusing to grow.
 */
function frontMatter(text) {
  const m = /^---\n([\s\S]*?)\n---/.exec(String(text || ''));
  if (!m) return null;
  const block = m[1];
  // No `m` flag, deliberately. With it, `$` means end of LINE, the lazy capture
  // stops at the first newline, and a folded `description: >-` block measures as
  // its first line — which is exactly the case the limit exists for. Watched
  // failing: a 1200-char folded description measured as legal.
  const read = (key) => {
    const re = new RegExp(`(?:^|\\n)${key}:\\s*(?:>-?\\s*\\n)?([\\s\\S]*?)(?=\\n[a-z-]+:\\s|$)`);
    const v = re.exec(block);
    return v ? v[1].trim().replace(/\s+/g, ' ') : null;
  };
  return { name: read('name'), description: read('description') };
}

/** Which limits this manifest breaks, if any. */
function violations(text) {
  const fm = frontMatter(text);
  if (!fm) return [];
  const out = [];
  for (const [field, limit] of Object.entries(LIMITS)) {
    const value = fm[field];
    if (value && value.length > limit) {
      out.push({ field, limit, actual: value.length });
    }
  }
  return out;
}

/** The sentence a violation becomes. Names the number, because the number is the fix. */
function render(rows, file) {
  if (!rows || !rows.length) return '';
  const lines = rows.map((r) => `  ${r.field}: ${r.actual} chars, the limit is ${r.limit}`);
  return [
    `[sshlg-skills] ${file} breaks the Agent Skills front-matter limits:`,
    ...lines,
    '  It will fail `claude plugin validate --strict` and this family\'s validator.',
  ].join('\n');
}

// `cdTarget` and `joinPath` are exported for `lib/guard.js`, which needs the same
// question answered — where is the shell after this segment — and the alternative was a
// second copy of a resolver in a family that keeps a guard against copied mechanisms.
module.exports = {
  isCommit, isCommitSegment, commitDirs, unresolvedCd, isSkillManifest, frontMatter, violations,
  render, segments, cdTarget, joinPath, LIMITS,
};
