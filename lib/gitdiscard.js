'use strict';
/**
 * B-240: a git command that throws away uncommitted work.
 *
 * `git checkout -- <paths>`, `git restore`, `git reset --hard`, `git stash` and
 * `git clean -f` over a dirty tree recur in at least 17 retrospectives: an agent "cleans
 * up" a file another session was editing, or resets a tree to make a rebase work, and the
 * only copy of the work is gone. Git asks nothing first; these are the forms that do not.
 *
 * The decision needs the dirty state of exactly the paths the command names, which a pure
 * module cannot read. So the work is split the way every guard here is split:
 *
 * - `targets(command)` (pure) reads which destructive invocations the payload would run,
 *   where (`cd`, `git -C`) and on which paths, and what each would lose (staged changes,
 *   unstaged changes, untracked files). It reads the payload the way the shell does,
 *   through `lib/hygiene.js`'s lexer: a heredoc body fed to a non-shell and a comment are
 *   data; `bash -c '…'`, a shell heredoc and `$(…)` are code; a quoted argument to `echo`
 *   is one word, not a command.
 * - `hooks/pre-tool-use.js` probes `git status --porcelain -z` for exactly those paths,
 *   with a time budget, and only when `targets()` found something.
 * - `decide(targets, probes)` (pure) reads the probe output and refuses when a change the
 *   form would lose exists, naming the paths and the remedy.
 *
 * **It fails open.** A directory it cannot resolve (`cd "$REPO"`, `--git-dir`), a path
 * list it cannot read (`$(git ls-files -m)`, `--pathspec-from-file`), a probe that errs
 * or times out: each is allowed, silently. A guard that guessed would refuse work it
 * cannot see; this one only refuses a loss it has read.
 *
 * **One override, on the command itself:** `SSHLG_DISCARD_OK=1 git checkout -- a.js`.
 * An assignment in front of the command is visible in the payload, harmless to git and
 * scoped to that one invocation, so discarding stays possible and is always deliberate.
 *
 * Out of scope, said out loud: ignored files (`git clean -x`/`-X` delete them; they are
 * not counted), submodule contents (the probe passes `--ignore-submodules=all`),
 * `git switch --discard-changes`, `xargs git …`, and an override exported earlier
 * (`export SSHLG_DISCARD_OK=1` on another line is not read).
 */

const { commandGroups, commandWords, bareName, SUB } = require('./hygiene.js');

const OVERRIDE = 'SSHLG_DISCARD_OK=1';
const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;
const WHOLE_REPO = ':/';
const MAX_LISTED = 10;

/** Cheap necessary condition, so a payload that never says `git` costs one scan. */
function mightDiscard(command) {
  return typeof command === 'string' && /\bgit\b/.test(command);
}

/** A word the lexer could not resolve to literal text: a substitution or a variable. */
function unresolved(word) {
  return typeof word !== 'string' || word.includes(SUB) || word.includes('$');
}

function joinDir(base, next) {
  if (next.startsWith('/') || next.startsWith('~')) return next;
  if (base === '.') return next;
  return `${base.replace(/\/+$/, '')}/${next}`;
}

/** Short-flag cluster letters (`-fdx` -> f, d, x); null for a long flag or a non-flag. */
function cluster(w) {
  return /^-[A-Za-z]+$/.test(w) ? w.slice(1).split('') : null;
}

const LOSE = (index, worktree, untracked, dirs) => ({ index, worktree, untracked, dirs });

/**
 * Split `args` at the first `--`. Flags before it are kept apart from positionals; a flag
 * named in `takes` consumes the next word. Returns null when a word cannot be read.
 */
function split(args, takes) {
  const flags = [];
  const pos = [];
  let after = null;
  for (let i = 0; i < args.length; i += 1) {
    const w = args[i];
    if (after) { after.push(w); continue; }
    if (w === '--') { after = []; continue; }
    if (w.startsWith('-') && w.length > 1) {
      flags.push(w);
      if (takes.includes(w)) { flags.push(args[i + 1]); i += 1; }
      continue;
    }
    pos.push(w);
  }
  return { flags, pos, after };
}

const has = (flags, ...names) => flags.some((f) => names.includes(f));
const letter = (flags, l) => flags.some((f) => { const c = cluster(f); return c && c.includes(l); });

function checkout(args) {
  const { flags, pos, after } = split(args, ['--conflict']);
  if (has(flags, '-b', '-B', '--orphan', '--detach', '-p', '--patch', '--ours', '--theirs')
    || letter(flags, 'b') || letter(flags, 'B') || letter(flags, 'p')) return null;
  if (flags.some((f) => typeof f === 'string' && f.startsWith('--pathspec-from-file'))) return 'unreadable';
  const force = has(flags, '-f', '--force') || letter(flags, 'f');
  if (after) {
    if (!after.length) return null;
    return { pathspecs: after, lose: LOSE(pos.length > 0, true, false, false) };
  }
  if (force) return { pathspecs: [WHOLE_REPO], lose: LOSE(true, true, false, false) };
  if (!pos.length || (pos.length === 1 && pos[0] === '-')) return null;
  if (pos.length === 1) return { pathspecs: pos, lose: LOSE(false, true, false, false) };
  return { pathspecs: pos.slice(1), lose: LOSE(true, true, false, false) };
}

function restore(args) {
  const { flags, pos, after } = split(args, ['-s', '--source']);
  if (has(flags, '-p', '--patch', '--ours', '--theirs') || letter(flags, 'p')) return null;
  if (flags.some((f) => typeof f === 'string' && f.startsWith('--pathspec-from-file'))) return 'unreadable';
  const staged = has(flags, '--staged') || letter(flags, 'S');
  const worktree = has(flags, '--worktree') || letter(flags, 'W') || !staged;
  if (!worktree) return null;
  const paths = pos.concat(after || []);
  if (!paths.length) return null;
  return { pathspecs: paths, lose: LOSE(staged, true, false, false) };
}

function reset(args) {
  return args.includes('--hard') ? { pathspecs: [WHOLE_REPO], lose: LOSE(true, true, false, false) } : null;
}

const STASH_READS = new Set(['list', 'show', 'pop', 'apply', 'drop', 'clear', 'branch', 'create', 'store']);

function stash(args) {
  let rest = args;
  if (rest.length && !rest[0].startsWith('-')) {
    if (STASH_READS.has(rest[0])) return null;
    if (rest[0] === 'save') {
      const { flags } = split(rest.slice(1), ['-m', '--message']);
      return stashPush(flags, [], null);
    }
    if (rest[0] !== 'push') return null;
    rest = rest.slice(1);
  }
  const { flags, pos, after } = split(rest, ['-m', '--message']);
  return stashPush(flags, pos, after);
}

function stashPush(flags, pos, after) {
  if (has(flags, '-p', '--patch') || letter(flags, 'p')) return null;
  if (flags.some((f) => typeof f === 'string' && f.startsWith('--pathspec-from-file'))) return 'unreadable';
  const untracked = has(flags, '-u', '--include-untracked', '-a', '--all') || letter(flags, 'u') || letter(flags, 'a');
  const paths = pos.concat(after || []);
  return { pathspecs: paths.length ? paths : [WHOLE_REPO], lose: LOSE(true, true, untracked, untracked) };
}

function clean(args) {
  const { flags, pos, after } = split(args, ['-e', '--exclude']);
  const force = has(flags, '--force') || letter(flags, 'f');
  if (!force) return null;
  if (has(flags, '-n', '--dry-run', '-i', '--interactive') || letter(flags, 'n') || letter(flags, 'i')) return null;
  if (letter(flags, 'X')) return null;   // ignored files only: outside this guard
  const dirs = letter(flags, 'd');
  const paths = pos.concat(after || []);
  return { pathspecs: paths.length ? paths : ['.'], lose: LOSE(false, false, true, dirs) };
}

const FORMS = { checkout, restore, reset, stash, clean };

/** One simple command's words (and the dir the shell is in) -> a target, null or 'skip'. */
function readGit(words, dir) {
  const cw = commandWords(words);
  if (!cw.length || bareName(cw[0]) !== 'git') return null;
  const lead = words.slice(0, words.length - cw.length);
  if (lead.includes(OVERRIDE)) return null;
  let i = 1;
  let where = dir;
  while (i < cw.length && cw[i].startsWith('-')) {
    const o = cw[i];
    if (o === '-C') {
      const d = cw[i + 1];
      if (d === undefined || unresolved(d) || where === null) where = null;
      else where = joinDir(where, d);
      i += 2; continue;
    }
    if (o === '-c' || o === '--namespace' || o === '--config-env') { i += 2; continue; }
    if (o === '--git-dir' || o === '--work-tree') { where = null; i += 2; continue; }
    if (o.startsWith('--git-dir=') || o.startsWith('--work-tree=')) { where = null; i += 1; continue; }
    i += 1;
  }
  const sub = cw[i];
  const read = FORMS[sub];
  if (!read) return null;
  const args = cw.slice(i + 1);
  const found = read(args);
  if (!found) return null;
  // A target this cannot place or whose paths it cannot read is allowed: fail open.
  if (found === 'unreadable' || where === null || found.pathspecs.some(unresolved)) return 'skip';
  const form = sub === 'reset' ? 'reset --hard' : sub;
  return { form, command: cw.join(' '), dir: where, pathspecs: found.pathspecs, lose: found.lose };
}

/**
 * The destructive git invocations a payload would run, in order. Each is
 * `{form, command, dir, pathspecs, lose}`: `dir` is relative to the payload's cwd, or
 * absolute, or `~`-led (the hook expands it); `pathspecs` are relative to `dir` (`:/` is
 * the whole repository); `lose` says which changes the form throws away. Never throws.
 */
function targets(command) {
  const out = [];
  if (!mightDiscard(command)) return out;
  try {
    for (const { commands } of commandGroups(command)) {
      let dir = '.';
      for (const words of commands) {
        const cw = commandWords(words);
        if (cw.length && bareName(cw[0]) === 'cd') {
          const to = cw.slice(1).filter((w) => w !== '--')[0];
          if (to === undefined) dir = '~';
          else if (unresolved(to) || to === '-' || dir === null) dir = null;
          else dir = joinDir(dir, to);
          continue;
        }
        const t = readGit(words, dir);
        if (t && t !== 'skip') out.push(t);
      }
    }
  } catch (e) {
    /* Pure and silent: a payload this cannot read is allowed. */
  }
  return out;
}

/** `git status --porcelain=v1 -z` -> `[{xy, path}]`; a rename's source record is skipped. */
function parsePorcelain(out) {
  const rows = [];
  if (typeof out !== 'string' || !out) return rows;
  const recs = out.split('\0');
  for (let i = 0; i < recs.length; i += 1) {
    const r = recs[i];
    if (r.length < 4 || r[2] !== ' ') continue;
    const xy = r.slice(0, 2);
    rows.push({ xy, path: r.slice(3) });
    if (xy[0] === 'R' || xy[0] === 'C') i += 1;
  }
  return rows;
}

/** Which of a row's changes this form would lose, as words; empty when none. */
function lostParts(row, lose) {
  if (row.xy === '!!') return [];
  if (row.xy === '??') return lose.untracked && (lose.dirs || !row.path.endsWith('/')) ? ['untracked'] : [];
  const parts = [];
  if (lose.index && row.xy[0] !== ' ') parts.push('staged');
  if (lose.worktree && row.xy[1] !== ' ') parts.push('unstaged');
  return parts;
}

const VERB = {
  stash: 'would move uncommitted work out of the working tree into the stash',
  clean: 'would delete untracked files',
};

/**
 * The verdict. `probes[i]` belongs to `targets[i]`: `{dir, out}` with `dir` the absolute
 * directory probed and `out` the porcelain text, or null when the probe failed (allowed).
 * Returns `{why, dirty: [{form, command, dir, paths}]}` or null.
 */
function decide(list, probes) {
  try {
    const dirty = [];
    (list || []).forEach((t, i) => {
      const p = probes && probes[i];
      if (!t || !p || typeof p.out !== 'string') return;
      const rows = parsePorcelain(p.out)
        .map((r) => ({ path: r.path, parts: lostParts(r, t.lose) }))
        .filter((r) => r.parts.length);
      if (rows.length) dirty.push({ form: t.form, command: t.command, dir: String(p.dir), rows });
    });
    if (!dirty.length) return null;
    const blocks = dirty.map((d) => {
      const shown = d.rows.slice(0, MAX_LISTED).map((r) => `  ${r.path} (${r.parts.join(', ')})`);
      if (d.rows.length > MAX_LISTED) shown.push(`  and ${d.rows.length - MAX_LISTED} more`);
      const verb = VERB[d.form] || 'would discard uncommitted changes';
      return [`\`${d.command}\` ${verb} in ${d.dir}, and no commit holds them:`, ...shown].join('\n');
    });
    const why = [
      ...blocks,
      'Keep the work first: commit it (on a WIP branch if this branch must stay clean), or copy the files '
        + 'outside the working tree. A stash is not a keep: a later drop or a failed pop loses it, and in a '
        + 'shared checkout it takes another session\'s work too.',
      'If discarding is what you mean, say so on the command itself: '
        + dirty.map((d) => `\`${OVERRIDE} ${d.command}\``).join(', ') + '.',
    ].join('\n');
    return { why, dirty: dirty.map((d) => ({ form: d.form, command: d.command, dir: d.dir, paths: d.rows.map((r) => r.path) })) };
  } catch (e) {
    return null;
  }
}

module.exports = { targets, decide, parsePorcelain, mightDiscard, OVERRIDE, WHOLE_REPO };
