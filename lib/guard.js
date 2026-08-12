'use strict';
/**
 * Does this tool call write to a file the operator owns and cannot recover?
 *
 * `lib/backup.js` already rules that a copy which cannot be taken cancels the
 * write — but it rules that only for writes this pack performs. Every other route
 * to those files is unguarded: an agent editing `~/.claude/CLAUDE.md` with the
 * `Edit` tool, or redirecting into it from a shell, passes nowhere near
 * `protect()`. Two defects in this repository's history destroyed or overwrote
 * exactly that file, and both times the copy that saved it was made by hand.
 *
 * This module is the decision half of closing that gap at the harness layer. It
 * is **pure**: handed a `PreToolUse` payload and a home, it says which protected
 * file the call is about to write. Taking the copy is the hook's job, because a
 * decision that touches the filesystem cannot be fixtured without one.
 *
 * **Why the matching lives here rather than in the hook entry's `if` field.** The
 * hooks reference states that the `if` filter is best-effort and **fails open**
 * when a Bash command cannot be parsed. A guard whose correctness rested on it
 * would ship with a documented bypass, so `if` is not used at all: the matcher
 * narrows to the write tools, and this function decides.
 *
 * **The honest boundary.** A shell can write to a file in ways no pattern
 * enumerates — a Python one-liner, an editor invocation, a script whose name says
 * nothing. This module catches the forms an agent actually emits — `REDIRECT`,
 * `ALL_ARGS` and `DEST_LAST` below — and does not pretend to be a sandbox. What it
 * removes is the unguarded *ordinary* write, which is the one that has happened here.
 */

const path = require('path');

/**
 * The files this pack refuses to let anything overwrite unbacked, relative to home.
 *
 * The first four are the agent instruction files this pack itself writes into —
 * the ones `lib/apply.js` already protects on its own path. `settings.json` joins
 * them because it is the same class of thing: no version control behind it, edited
 * by installers that are not this one, and this repository has already spent a
 * feature (`displaced:statusLine`) on recovering one key of it.
 */
const PROTECTED = [
  ['.claude', 'CLAUDE.md'],
  ['.codex', 'AGENTS.md'],
  ['.gemini', 'GEMINI.md'],
  ['.cursor', 'rules', 'sshlg-routing.mdc'],
  ['.claude', 'settings.json'],
];

/** Absolute paths of the protected set for a given home. */
function targets(home) {
  return PROTECTED.map((parts) => path.join(home, ...parts));
}

/**
 * Every spelling of `file` a shell command might carry.
 *
 * File tools are documented to deliver `file_path` already absolute, with `~` and
 * relative forms expanded before hooks run — so this is only needed for `Bash`,
 * where the command is a raw string the agent typed.
 */
function spellings(file, home) {
  const rel = path.relative(home, file);
  return [file, `~/${rel}`, `$HOME/${rel}`, `\${HOME}/${rel}`];
}

/** The path sits immediately after a `>` or `>>`. */
const REDIRECT = /(^|[^0-9<>&])>{1,2}\s*$/;

/**
 * Verbs that write to **every** path they are handed.
 *
 * `rm` earns its place here: deletion is the destruction this module exists to
 * survive, and a file that is gone is not more recoverable than one overwritten.
 */
const ALL_ARGS = [
  /(^|[;&|(\s])(tee|dd|truncate|rm|touch|shred)(\s|$)/,
  /(^|[;&|(\s])sed\s+[^|;]*-i/,
  /(^|[;&|(\s])(perl|ruby)\s+[^|;]*-i/,
  /(^|[;&|(\s])python3?\s+[^|;]*['"]w['"]/,
];

/**
 * Verbs that write only to their **last** argument.
 *
 * Splitting these out is not tidiness. `cp CLAUDE.md CLAUDE.md.2026-08-12` — an
 * agent taking a backup by hand, which is the very habit this pack is replacing —
 * was read as overwriting the file by a version of this module that treated every
 * argument alike. Watched failing in `test/guard_test.js` before the split existed.
 */
const DEST_LAST = /(^|[;&|(\s])(cp|mv|ln|install)(\s|$)/;

/** Split a command line into the pieces that run independently. */
function segments(command) {
  return String(command || '').split(/(?:\|\||&&|[;\n|])/);
}

/** Is `spelling` the final argument of this segment? Quotes do not change that. */
function isLastArgument(segment, spelling) {
  const tokens = segment.trim().split(/\s+/);
  const last = (tokens[tokens.length - 1] || '').replace(/^["']|["']$/g, '');
  return last === spelling;
}

/**
 * Is `segment` writing to `spelling`?
 *
 * The path must appear as a **whole** path — a following path character means a
 * different file, which is what keeps a write to `CLAUDE.md.bak` from being read
 * as a write to `CLAUDE.md`. Every occurrence is examined, because `cat X > X`
 * writes to X on its second one and to nothing on its first.
 */
function writesTo(segment, spelling) {
  for (let at = segment.indexOf(spelling); at >= 0; at = segment.indexOf(spelling, at + 1)) {
    const after = segment[at + spelling.length];
    if (after !== undefined && /[A-Za-z0-9._\-/]/.test(after)) continue;

    if (REDIRECT.test(segment.slice(0, at))) return true;
    if (ALL_ARGS.some((re) => re.test(segment))) return true;
    if (DEST_LAST.test(segment) && isLastArgument(segment, spelling)) return true;
  }
  return false;
}

/**
 * Which protected file this call is about to write, or `null`.
 *
 * Returns the absolute path so the caller can hand it straight to `backup.save`.
 * `null` means silence: the overwhelming majority of tool calls, and the reason
 * this hook costs nothing on a normal turn.
 */
function decide(payload, home) {
  const p = payload || {};
  const input = p.tool_input || {};
  const list = targets(home);

  const named = input.file_path || input.notebook_path;
  if (named) {
    const resolved = path.resolve(named);
    return list.find((t) => t === resolved) || null;
  }

  if (typeof input.command === 'string') {
    const segs = segments(input.command);
    for (const file of list) {
      for (const spelling of spellings(file, home)) {
        if (segs.some((s) => writesTo(s, spelling))) return file;
      }
    }
  }
  return null;
}

/** The tools that can write. Used to build the hook entry's matcher. */
const TOOLS = ['Edit', 'Write', 'MultiEdit', 'NotebookEdit', 'Bash'];

module.exports = { decide, targets, spellings, writesTo, segments, PROTECTED, TOOLS };
