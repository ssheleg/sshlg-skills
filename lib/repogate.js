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
 */

/** Front-matter limits from the Agent Skills standard. */
const LIMITS = { name: 64, description: 1024 };

/** Split a command into pieces that run independently. */
function segments(command) {
  return String(command || '').split(/(?:\|\||&&|[;\n|])/);
}

/**
 * Is this command going to create a commit?
 *
 * Every spelling counts, and that is the point: `--amend` rewrites one, `-n`
 * skips the hooks a repository installed for itself, and `--dry-run` is the one
 * shape that does not — so it is the one shape allowed through.
 */
function isCommit(command) {
  return segments(command).some((seg) => {
    if (!/(^|[\s(])git(\s|$)/.test(seg)) return false;
    if (!/(^|\s)commit(\s|$)/.test(seg)) return false;
    return !/(^|\s)--dry-run(\s|$)/.test(seg);
  });
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

module.exports = { isCommit, isSkillManifest, frontMatter, violations, render, segments, LIMITS };
