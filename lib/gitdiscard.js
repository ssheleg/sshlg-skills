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
 * B-270 widened it: `git clean -x`/`-X` count ignored files (the hook probes them with
 * `--ignored`, so an ignored `.env` is named before it is deleted); `git switch
 * --discard-changes`/`-f` is read like `checkout -f`; `xargs git …` is read when its input
 * is readable (`echo`/`printf` of literal paths, or a git listing such as `git diff
 * --name-only` or `git ls-files -m`, whose scope the probe covers); and `export
 * SSHLG_DISCARD_OK=1` earlier in the same command group covers what follows it.
 *
 * Out of scope, said out loud: submodule contents (the probe passes
 * `--ignore-submodules=all`), xargs input from a file, a redirect or any other producer
 * (allowed: fail open), `clean -x -e <pattern>` (the excluded files are counted as lost,
 * an over-count on the side of keeping), and an override exported in an earlier payload.
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

const LOSE = (index, worktree, untracked, dirs, ignored = false) => ({ index, worktree, untracked, dirs, ignored });

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
  // B-270: `-x` deletes ignored files as well as untracked ones; `-X` deletes only them.
  const onlyIgnored = letter(flags, 'X');
  const ignored = onlyIgnored || letter(flags, 'x');
  const dirs = letter(flags, 'd');
  const paths = pos.concat(after || []);
  return { pathspecs: paths.length ? paths : ['.'], lose: LOSE(false, false, !onlyIgnored, dirs, ignored) };
}

/** B-270: `git switch --discard-changes` (and its alias `-f`) resets index and tree like `checkout -f`. */
function switchForm(args) {
  const { flags } = split(args, ['-c', '-C', '--create', '--force-create', '--orphan', '--conflict']);
  if (has(flags, '--discard-changes', '-f', '--force') || letter(flags, 'f')) {
    return { pathspecs: [WHOLE_REPO], lose: LOSE(true, true, false, false) };
  }
  return null;
}

const FORMS = { checkout, restore, reset, stash, clean, switch: switchForm };

/** Stands for the words xargs appends from its input, until the input is known. */
const INPUT = '\u0001xargs-input';

/** xargs options that consume the next word (or carry it attached, `-I{}`, `-n1`). */
const XARGS_TAKES = new Set(['-I', '-L', '-n', '-P', '-s', '-d', '-E', '-e', '-a']);

/**
 * `xargs [options] git …` -> `{git, replace, zero, delim, file}` or null.
 * `git` is the git words, with the input marked where xargs puts it.
 */
function readXargs(cw) {
  if (!cw.length || bareName(cw[0]) !== 'xargs') return null;
  let i = 1;
  let replace = null;
  let zero = false;
  let delim = false;
  let file = false;
  while (i < cw.length && cw[i].startsWith('-') && cw[i] !== '-') {
    const o = cw[i];
    if (o === '--') { i += 1; break; }
    if (o === '-0' || o === '--null') { zero = true; i += 1; continue; }
    if (o.startsWith('--arg-file') || o === '-a' || /^-a./.test(o)) file = true;
    if (o.startsWith('--delimiter') || o === '-d' || /^-d./.test(o)) delim = true;
    if (o.startsWith('--replace')) { replace = o.includes('=') ? o.slice(o.indexOf('=') + 1) : '{}'; i += 1; continue; }
    if (o === '-I') { replace = cw[i + 1]; i += 2; continue; }
    if (/^-I./.test(o)) { replace = o.slice(2); i += 1; continue; }
    if (o === '-i' || /^-i./.test(o)) { replace = o.length > 2 ? o.slice(2) : '{}'; i += 1; continue; }
    if (XARGS_TAKES.has(o)) { i += 2; continue; }
    i += 1;
  }
  const rest = cw.slice(i);
  if (!rest.length || bareName(rest[0]) !== 'git') return null;
  if (replace !== null && (replace === undefined || unresolved(replace) || !replace)) return { git: null };
  let git;
  if (replace) {
    if (rest.some((w) => w !== replace && w.includes(replace))) return { git: null };
    git = rest.map((w) => (w === replace ? INPUT : w));
  } else git = rest.concat(INPUT);
  return { git, lead: rest.length, zero, delim, file };
}

/** Global git options before the subcommand: none but `-c` (config) are read as placing it. */
function gitSub(cw) {
  let i = 1;
  while (i < cw.length && cw[i].startsWith('-')) {
    if (cw[i] === '-c') { i += 2; continue; }
    return null;
  }
  return i < cw.length ? { sub: cw[i], args: cw.slice(i + 1) } : null;
}

/**
 * What a producer feeds xargs, or null when it cannot be read: `{paths}` for literal
 * words from `echo`/`printf '%s\n'`, `{scope}` for a git listing of files (the probe reads
 * the dirty state of its scope, which holds every file it can list as changed).
 */
function readProducer(words, zero) {
  const cw = commandWords(words || []);
  if (!cw.length) return null;
  const name = bareName(cw[0]);
  const literal = (list) => (list.length && !list.some(unresolved) ? list : null);
  if (name === 'echo') {
    if (zero) return null;
    const w = cw.slice(1);
    let k = 0;
    while (k < w.length && /^-[neE]+$/.test(w[k])) k += 1;
    const paths = literal(w.slice(k).join(' ').split(/\s+/).filter(Boolean));
    return paths ? { paths } : null;
  }
  if (name === 'printf') {
    const fmt = cw[1];
    const ok = zero ? ['%s\\0', '%s\0'] : ['%s\\n', '%s\n', '%s ', '%s\\t'];
    if (!ok.includes(fmt)) return null;
    const paths = literal(cw.slice(2));
    return paths ? { paths } : null;
  }
  if (name !== 'git') return null;
  const g = gitSub(cw);
  if (!g) return null;
  const { flags, pos, after } = split(g.args, ['--diff-filter', '-x', '--exclude', '-X', '--exclude-from']);
  const nul = flags.includes('-z');
  if (nul !== zero) return null;
  if (g.sub === 'diff') {
    if (!flags.includes('--name-only')) return null;
    if (pos.length) return null;   // a ref (or a path without `--`) names a scope this cannot place
  } else if (g.sub === 'ls-files') {
    if (flags.some((f) => typeof f === 'string' && /^-[^-]*s|^--stage|^--format|^-t$|^--debug/.test(f))) return null;
  } else return null;
  const scope = (after && after.length ? after : (g.sub === 'ls-files' ? pos : [])).slice();
  if (scope.some(unresolved)) return null;
  return { scope: scope.length ? scope : [WHOLE_REPO] };
}

/** The xargs words with the producer's input in place, or 'skip' when it cannot be placed. */
function feed(x, producer) {
  if (!x.git || x.file || x.delim || !producer) return 'skip';
  if (producer.paths) {
    const out = [];
    for (const w of x.git) if (w === INPUT) out.push(...producer.paths); else out.push(w);
    return { words: out };
  }
  return { words: x.git, scope: producer.scope };
}

/**
 * One simple command's words (and the dir the shell is in) -> a target, null or 'skip'.
 * `scope`, for xargs fed by a git listing, replaces the input marker in the pathspecs.
 */
function readGit(words, dir, scope) {
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
  const found = read(args.map((w) => (w === INPUT ? 'xargs-input' : w)));
  if (!found) return null;
  // The input marker went through the reader as a plain word; put it back where it sits.
  if (found !== 'unreadable') {
    const at = args.indexOf(INPUT);
    if (at >= 0) {
      const marked = found.pathspecs.indexOf('xargs-input');
      if (marked >= 0) {
        if (!scope) return 'skip';
        found.pathspecs = found.pathspecs.slice(0, marked).concat(scope, found.pathspecs.slice(marked + 1));
      }
    }
  }
  // A target this cannot place or whose paths it cannot read is allowed: fail open.
  if (found === 'unreadable' || where === null || found.pathspecs.some(unresolved)) return 'skip';
  const form = sub === 'reset' ? 'reset --hard' : sub;
  return { form, command: cw.join(' '), dir: where, pathspecs: found.pathspecs, lose: found.lose };
}

/** `export … SSHLG_DISCARD_OK=1 …` as a command of its own (B-270). */
function exportsOverride(cw) {
  return cw.length > 1 && ['export', 'declare', 'typeset'].includes(bareName(cw[0])) && cw.slice(1).includes(OVERRIDE);
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
      let exported = false;
      commands.forEach((words, k) => {
        if (exported) return;
        const cw = commandWords(words);
        if (exportsOverride(cw)) { exported = true; return; }
        if (cw.length && bareName(cw[0]) === 'cd') {
          const to = cw.slice(1).filter((w) => w !== '--')[0];
          if (to === undefined) dir = '~';
          else if (unresolved(to) || to === '-' || dir === null) dir = null;
          else dir = joinDir(dir, to);
          return;
        }
        // B-270: `… | xargs git <form>` is read with the input its producer feeds it.
        const x = readXargs(cw);
        if (x) {
          if (words.slice(0, words.length - cw.length).includes(OVERRIDE)) return;
          const fed = feed(x, words.piped ? readProducer(commands[k - 1], x.zero) : null);
          // The refusal quotes the xargs command as typed, so the override it names
          // (`SSHLG_DISCARD_OK=1 xargs git …`) is one that runs.
          const typed = (t) => Object.assign(t, { command: cw.join(' ') });
          if (fed !== 'skip') {
            const t = readGit(fed.words, dir, fed.scope);
            if (t && t !== 'skip') out.push(typed(t));
            return;
          }
          // Input this cannot read: a form that discards the whole repository whatever
          // its arguments still counts (`xargs git reset --hard`); a path list does not.
          const t = readGit(x.git || [], dir, null);
          if (t && t !== 'skip' && t.pathspecs.length === 1 && t.pathspecs[0] === WHOLE_REPO) out.push(typed(t));
          return;
        }
        const t = readGit(words, dir);
        if (t && t !== 'skip') out.push(t);
      });
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
  if (row.xy === '!!') return lose.ignored && (lose.dirs || !row.path.endsWith('/')) ? ['ignored'] : [];
  if (row.xy === '??') return lose.untracked && (lose.dirs || !row.path.endsWith('/')) ? ['untracked'] : [];
  const parts = [];
  if (lose.index && row.xy[0] !== ' ') parts.push('staged');
  if (lose.worktree && row.xy[1] !== ' ') parts.push('unstaged');
  return parts;
}

const VERB = {
  stash: 'would move uncommitted work out of the working tree into the stash',
  clean: 'would delete untracked or ignored files',
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
