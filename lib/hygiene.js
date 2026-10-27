'use strict';
/**
 * The machine habits this pack keeps writing down and nothing enforces (four, see #4 below).
 *
 * Each one is documented on this machine as a rule, each has been broken anyway,
 * and a rule broken by the agent that wrote it is a rule that needed a mechanism:
 *
 * 1. **A bare `npx skills update <member>` re-creates a plain copy** under
 *    `~/.claude/skills/<id>`, which shadows the plugin of the same name and serves
 *    the version it was copied from forever. Observed 2026-08-03: the copy sat at
 *    1.8.0 while the plugin was already 1.8.1.
 * 2. **A shadow is invisible until someone runs the check** — and the check has a
 *    window in which it lies, because the launcher installs into every agent first
 *    and clears the shadowing copies last.
 * 3. **`obsidian-wiki setup` truncates the active config.** Its `write_config()`
 *    writes three keys through a symlink onto the profile, dropping the history
 *    paths, the exclude list and the QMD block every single time.
 *
 * Pure, all of it: commands in, verdicts out; two texts in, one text out. The
 * process table and the filesystem belong to the hooks that call this.
 */

/** Strip an `@version` suffix so `sshlg-skills@latest` is not read as `skills`. */
function bareName(token) {
  // Shell quoting is not part of a name. `bash -c 'npx skills update ux-flows'` reaches
  // this as the token `ux-flows'`, which matched no family id — so a real invocation
  // wrapped in quotes passed the guard untouched. Found on 2026-08-16 while fixing the
  // opposite complaint (B-59, a false positive on documented text); the same run turned
  // up a bypass worth more than the annoyance that started it.
  token = String(token || '').replace(/^['"]+/, '').replace(/['"]+$/, '');
  return String(token || '').replace(/@.*$/, '').replace(/^.*\//, '');
}

/** Tokens that are flags rather than arguments. */
function isFlag(token) {
  return /^-/.test(token);
}

/**
 * Is this command the skills CLI, and if so what is it doing?
 *
 * Returns `{verb, args}` or `null`. The launcher — `sshlg-skills` — is
 * deliberately not the skills CLI: it is the remedy, and matching it here would
 * deny the very command the denial recommends.
 *
 * `args` is every positional after the verb rather than the one that looks like
 * the target, because a flag's VALUE is indistinguishable from a positional
 * without the CLI's own grammar: `skills add --agent claude ux-flows` puts
 * `claude` exactly where the target would be, and reading it as the target let a
 * real family skill through unguarded. Watched failing in the fixtures.
 */
/**
 * The part of a payload that could actually run, with data stripped out.
 *
 * B-59: this guard reads the whole command text, so **writing the forbidden string into a
 * document is refused too**. On 2026-08-16 a verification-ledger row quoting the
 * diagnostic invocation blocked its own commit, and the sentence had to be split around
 * the guard. The family's own documents could not quote the command they warn about.
 *
 * Two things are removed, and the boundary between them and everything else is the whole
 * design:
 *
 * - **A heredoc body fed to something that is not a shell.** `python3 - <<'PY' … PY` and
 *   `cat > f <<EOF … EOF` are data. `bash <<EOF … EOF` is a script, so its body is KEPT —
 *   stripping every heredoc would be a documented bypass, which is worse than the false
 *   positive it fixes.
 * - **A whole-line comment.** A line whose first non-space character is `#` does not run.
 *
 * **Quoted strings are deliberately NOT stripped.** `bash -c 'npx skills update ux-flows'`
 * is a real invocation living inside quotes, and a guard that ignored quoted text would
 * miss it. The false positive that remains — the string in a single-line argument to
 * `echo` — is the price of not opening that hole, and it is documented rather than fixed.
 */
const HEREDOC_SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh', 'eval', 'source', '.']);

/**
 * B-253: the command substitutions in a piece of text, `$(...)` (not arithmetic `$((`) and
 * backticks, outermost only. The shell runs these inside an unquoted-delimiter heredoc body
 * even when the body itself is fed to a non-shell, so they are executable text.
 */
function substitutions(text) {
  const out = [];
  const t = String(text || '');
  for (let i = 0; i < t.length; i += 1) {
    if (t[i] === '\\') { i += 1; continue; }
    if (t[i] === '$' && t[i + 1] === '(' && t[i + 2] !== '(') {
      let depth = 1, j = i + 2;
      for (; j < t.length && depth; j += 1) { if (t[j] === '(') depth += 1; else if (t[j] === ')') depth -= 1; }
      out.push(t.slice(i + 2, depth ? j : j - 1));
      i = j - 1;
    } else if (t[i] === '`') {
      const j = t.indexOf('`', i + 1);
      out.push(t.slice(i + 1, j < 0 ? t.length : j));
      i = j < 0 ? t.length : j;
    }
  }
  return out;
}

/** Whether a quote opened on this line is still open at its end, given the state at its start. */
function quoteAfter(line, open) {
  let q = open;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (q === null) {
      if (c === '\\') { i += 1; continue; }
      if (c === '#' && (i === 0 || /\s/.test(line[i - 1]))) break;   // the rest is a comment
      if (c === '"' || c === "'") q = c;
    } else if (q === '"') {
      if (c === '\\') { i += 1; continue; }
      if (c === '"') q = null;
    } else if (c === "'") {
      q = null;
    }
  }
  return q;
}

function executablePart(command) {
  const lines = String(command || '').split('\n');
  const out = [];
  let terminator = null;
  let dropping = false;
  let expands = false;
  let open = null;   // a quote still open from an earlier line (B-253)
  for (const line of lines) {
    if (terminator !== null) {
      // The terminator may be indented when the heredoc used `<<-`.
      if (line.trim() === terminator) { terminator = null; dropping = false; continue; }
      // B-253: a non-shell's body is data, but an unquoted delimiter still runs its
      // substitutions, so those (and only those) stay executable.
      if (dropping) { if (expands) out.push(...substitutions(line)); continue; }
      out.push(line);
      continue;
    }
    // A `#` line is a comment only outside a quote that an earlier line left open (B-253).
    if (open === null && /^\s*#/.test(line)) continue;
    const here = open === null ? /<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1/.exec(line) : null;
    if (here) {
      terminator = here[2];
      expands = here[1] === '';
      // Which command is being fed? The last simple-command word before the `<<`, taken
      // after the final pipe or `&&` so `foo | python3 - <<EOF` reads as python3.
      const before = line.slice(0, here.index);
      const segment = before.split(/\|\||&&|[|;]/).pop();
      const words = segment.trim().split(/\s+/).filter(Boolean).map(bareName);
      const cmd = words.find((w) => !w.includes('=')) || '';
      dropping = !HEREDOC_SHELLS.has(cmd);
      out.push(before);
      continue;
    }
    open = quoteAfter(line, open);
    out.push(line);
  }
  return out.join('\n');
}

/**
 * The skills CLI's verbs — a small, fixed vocabulary, which is what makes the verb
 * findable without knowing the flag grammar.
 *
 * B-123: the first draft read the FIRST positional as the verb. A flag that consumes
 * its argument puts that argument exactly there, so `skills --agent claude update
 * <member>` read `claude` as the verb, matched none of update/add/install, and the
 * install went through. The comment four lines up already stated this class — it is
 * why `args` is every positional rather than the one that looks like the target — and
 * the same value lands one token earlier when the flag precedes the verb.
 *
 * A flag table would have to track someone else's CLI and rot; the verb vocabulary is
 * ours to read and small enough to scan. Unknown verbs keep the old first-positional
 * behaviour, so nothing that used to be recognised stops being recognised.
 */
const SKILLS_VERBS = ['update', 'add', 'install', 'remove', 'list', 'check', 'sync'];

function skillsCli(command) {
  // A line continuation is punctuation, not a word: `skills \` + newline + `update`
  // reached this as the token `\` and was read as the verb.
  const tokens = String(command || '').split(/\s+/).filter((t) => t && t !== '\\');
  for (let i = 0; i < tokens.length; i += 1) {
    if (bareName(tokens[i]) !== 'skills') continue;
    // Flags are kept, not merely skipped: `--list` turns `add` into a read-only
    // rendering, and dropping it here is why the guard refused the family's own
    // distribution probe on 2026-09-06. But a flag belongs to ONE invocation:
    // the first cut collected flags to end of string, and the second audit round
    // proved `skills update super-ux && skills check --list` disarmed the guard
    // across the `&&`. Flags stop at the first command separator and at `--`
    // (after which the CLI reads `--list` as a positional); `args` deliberately
    // keep the old full-width scan — its cross-boundary reach only ever made
    // the guard MORE aggressive, and narrowing it is not this fix's business.
    const after = tokens.slice(i + 1);
    const cut = after.findIndex((t) => t === '&&' || t === '||' || t === ';' || t === '|' || t === '--');
    const flags = (cut < 0 ? after : after.slice(0, cut)).filter((t) => isFlag(t));
    const rest = after.filter((t) => !isFlag(t));
    if (!rest.length) return { verb: null, args: [], flags };
    const at = rest.findIndex((t) => SKILLS_VERBS.includes(t));
    if (at < 0) return { verb: rest[0], args: rest.slice(1), flags };
    return { verb: rest[at], args: rest.filter((_, k) => k !== at), flags };
  }
  return null;
}

/**
 * The skill ids and member names the family owns, from the manifest.
 *
 * Read from the manifest rather than listed here, because a member that gains a
 * skill would otherwise keep its new skill unguarded until someone remembered
 * this file — the exact failure `skills.json` → `skillNames` already cost the
 * bundle once (B-12).
 */
function familyIds(manifest) {
  const skills = (manifest && manifest.skills) || [];
  const ids = new Set();
  for (const s of skills) {
    if (s.name) ids.add(s.name);
    for (const n of s.skillNames || []) ids.add(n);
  }
  return ids;
}

/** What the operator should run instead. One line, copy-pasteable. */
const REMEDY = 'npx --yes sshlg-skills@latest update';

/**
 * Would this command install a family member through the bare skills CLI?
 *
 * Returns `{target, remedy}` when it would, `null` otherwise. `install` counts
 * alongside `update` and `add`: all three end with a plain copy in
 * `~/.claude/skills/`, which is what does the shadowing.
 */
function bareFamilyInstall(command, ids) {
  // Data first: a heredoc body written by a non-shell, and whole-line comments, cannot
  // install anything. See `executablePart` for why quoted strings are not stripped.
  const call = skillsCli(executablePart(command));
  if (!call || !call.args.length) return null;
  if (!['update', 'add', 'install'].includes(call.verb)) return null;
  // `--list` renders what WOULD land and writes nothing — the CLI's own
  // read-only mode, observed live on `add` and only on `add`. Refusing it
  // blocked the family audit's distribution probe (2026-09-06): a guard against
  // plain copies has no business stopping a look. The exact token only, inside
  // the same invocation only (see skillsCli), and only for the verb it was
  // measured on: `update --list` stays refused until somebody shows it reads.
  if (call.verb === 'add' && (call.flags || []).includes('--list')) return null;
  const target = call.args.find((a) => ids.has(bareName(a)));
  if (!target) return null;
  // B-153: an explicit agent list that does not name Claude cannot write
  // ~/.claude/skills, so it cannot shadow a plugin. `add`/`install` only — `update`
  // takes no agent scope and re-links every agent the CLI remembers.
  // Judged per invocation of a chain: a scoped first command must not excuse an
  // unscoped second one (`… --agent continue && skills add …`).
  if (call.verb !== 'update') {
    const segments = String(executablePart(command)).split(/\s(?:&&|\|\||;|\|)\s/);
    const shadowing = segments.some((seg) => {
      const c = skillsCli(seg);
      if (!c || !['update', 'add', 'install'].includes(c.verb)) return false;
      if (!c.args.some((a) => ids.has(bareName(a)))) return false;
      if (c.verb === 'add' && (c.flags || []).includes('--list')) return false;
      if (c.verb === 'update') return true;
      const agents = agentList(seg);
      return !agents.length || agents.some((a) => CLAUDE_AGENTS.has(a.replace(/^['"]|['"]$/g, '')));
    });
    if (!shadowing) return null;
  }
  return { target, verb: call.verb, remedy: REMEDY };
}

const CLAUDE_AGENTS = new Set(['claude', 'claude-code', '*']);

/** `--agent x` / `-a x` / `--agent=x` values of the FIRST skills invocation, up to its separator. */
function agentList(command) {
  const tokens = String(command || '').split(/\s+/).filter((t) => t && t !== '\\');
  const start = tokens.findIndex((t) => bareName(t) === 'skills');
  if (start < 0) return [];
  const out = [];
  for (let i = start + 1; i < tokens.length; i += 1) {
    const t = tokens[i];
    if (['&&', '||', ';', '|', '--'].includes(t)) break;
    if ((t === '--agent' || t === '-a') && tokens[i + 1]) { out.push(tokens[i + 1]); i += 1; continue; }
    const eq = /^--agent=(.+)$/.exec(t);
    if (eq) out.push(eq[1]);
  }
  return out;
}

/**
 * Is the launcher itself running right now?
 *
 * Takes the process table as text. The shapes are the launcher's own argv, never
 * the bare package name: a bare match also catches every Claude Code session
 * whose working directory is this repository, which is most of them — recorded on
 * this machine on 2026-08-12, when a mid-run check reported shadows that were
 * gone two minutes later.
 *
 * **Measuring this by hand self-matches, and that is not a defect here.** A shell
 * command containing the pattern appears in its own `ps` output, so a check typed
 * as `ps -Ao args= | grep 'sshlg-skills@'` always reports the launcher running —
 * the same trap the machine's notes record for `pgrep -f`. The hook's real path is
 * clean, because the command it fires on is `npx skills …` and carries no such
 * string. Verified 2026-08-13: the ad-hoc check said `true` with no launcher alive,
 * while the shadow computation it guards returned an empty set either way.
 */
function launcherRunning(psText) {
  return String(psText || '')
    .split('\n')
    .some((l) => /sshlg-skills@|bin\/sshlg-skills/.test(l));
}

/**
 * Does this command run `obsidian-wiki setup`, the one that truncates the config?
 *
 * B-123: reading the FIRST positional after the tool name assumed no flag consumes its
 * argument, and `--vault <path>` does — so `obsidian-wiki --vault /some/vault setup`
 * put the PATH where the subcommand is read and the guard said no. The trailing form
 * (`setup --vault /v`) was fixtured from the start; the leading one was not, and it is
 * the form the machine's own runbook uses.
 *
 * The subcommand is matched EXACTLY, never through `bareName`: a vault at
 * `/Users/x/setup` would otherwise be stripped to `setup` and refuse a `doctor` run.
 */
function isObsidianSetup(command) {
  const tokens = String(command || '').split(/\s+/).filter((t) => t && t !== '\\');
  const at = tokens.findIndex((t) => bareName(t) === 'obsidian-wiki');
  if (at < 0) return false;
  return tokens.slice(at + 1).filter((t) => !isFlag(t)).includes('setup');
}

/** `KEY=value` lines, ignoring comments. Values keep their quoting verbatim. */
function parseConfig(text) {
  const map = new Map();
  for (const line of String(text || '').split('\n')) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/.exec(line);
    if (m) map.set(m[1], m[2]);
  }
  return map;
}

/**
 * The config as it should look after `setup` ran: everything the snapshot had,
 * carrying whatever values `setup` just wrote.
 *
 * **The direction matters and it is the whole design.** Merging the lost keys
 * back *into* the truncated file would rebuild the keys and lose the file — the
 * comments, the profile header, the ordering, and the QMD block, which is commented
 * out and therefore invisible to any key-level merge. So the snapshot is the base,
 * and the three keys `write_config()` writes are updated in place on top of it.
 *
 * Returns `{text, restored, updated}` — `restored` names what the truncation had
 * dropped, which is what the hook reports.
 */
function reapply(snapshot, fresh) {
  const freshKeys = parseConfig(fresh);
  const snapKeys = parseConfig(snapshot);
  const updated = [];
  const seen = new Set();

  const lines = String(snapshot || '').split('\n').map((line) => {
    const m = /^(\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*=)(.*)$/.exec(line);
    if (!m || !freshKeys.has(m[2])) return line;
    seen.add(m[2]);
    if (freshKeys.get(m[2]) === m[4]) return line;
    updated.push(m[2]);
    return `${m[1]}${m[2]}${m[3]}${freshKeys.get(m[2])}`;
  });

  // A key `setup` invented that the snapshot never had is new information, not
  // noise — appended rather than dropped, so a future version of the tool adding
  // a key does not have it silently reverted by this restore.
  const added = [...freshKeys.keys()].filter((k) => !seen.has(k) && !snapKeys.has(k));
  if (added.length) {
    lines.push('', '# --- added by `obsidian-wiki setup`, kept by sshlg-skills ---');
    for (const k of added) lines.push(`${k}=${freshKeys.get(k)}`);
  }

  const restored = [...snapKeys.keys()].filter((k) => !freshKeys.has(k));
  return { text: lines.join('\n'), restored, updated: updated.concat(added) };
}

/**
 * 4. **A gate read through a pipe.** `npm test | tail -5 && git push` pushes even when
 *    the tests failed: a pipeline's status is its LAST command's, so `tail` decides.
 *    The 2026-10-20 survey of the operator's retrospectives found this class in at
 *    least 26 of them (a PR reached main red; releases shipped on a failed suite), each
 *    written down as a rule and broken again. A rule that keeps being broken needs a
 *    mechanism, which is this file's whole reason to exist.
 *
 * Returns `{gate, filter, git}` when a gate-looking command is piped into a filter and
 * the chain then commits, pushes or tags; `null` otherwise. `set -o pipefail` anywhere
 * in the command, or a `PIPESTATUS` read, means the author handled it.
 */
const GATE = /(?:^|\s|\/)(?:npm\s+(?:test|run\s+\S+)|pnpm\s+(?:test|run)|yarn\s+(?:test|run)|npx\s+\S*(?:test|jest|vitest|tsc|eslint)|pytest|make|cargo\s+(?:test|build|clippy)|go\s+(?:test|build|vet)|swift\s+(?:test|build)|xcodebuild|gradle\w*|node\s+\S*test\S*|python3?\s+\S*(?:test|check|validate|gate)\S*|bash\s+\S*(?:test|check|gate|release|deploy)\S*|gh\s+run\s+watch|\S*deploy\S*)(?=\s|$)/;
const MASKED = /((?:[^|&;\n]|\d?>&\d?|&>)+?)\|\s*(tail|head|grep|sed|awk|less|cat)\b[^&;\n]*?&&(?:[^;\n]*?&&)*?\s*git\s+(commit|push|tag)\b/;

function maskedGate(command) {
  const cmd = executablePart(command);
  if (/pipefail|PIPESTATUS/.test(cmd)) return null;
  const m = MASKED.exec(cmd);
  if (!m || !GATE.test(' ' + m[1].trim())) return null;
  return { gate: m[1].trim(), filter: m[2], git: m[3] };
}

/**
 * 5. **A host self-update inside a command substitution (B-223).** On 2026-10-17 a review
 *    agent wrote `pi update` in backticks inside a double-quoted argument. The shell ran it
 *    before the command around it started; the in-place `npm install -g` hit ENOSPC and
 *    removed the `pi` link. Nobody typed `pi update` as a command: it was prose that the
 *    shell read as code.
 *
 * `executablePart` cannot see this and is not meant to: it keeps quoted strings whole and
 * the other rules read them as words, so `"run \`pi update\`"` is one argument to them. This
 * rule reads the payload the way the shell does, with a small lexer of its own:
 *
 * - `$(…)` and backticks are code, at top level, inside double quotes, nested, inside an
 *   unquoted heredoc body (the shell expands those for `cat` too) and inside the script of
 *   `bash -c '…'` (literal to the outer shell, code to the inner one).
 * - Single quotes, `$'…'`, an escaped `\$(` or `` \` ``, a quoted-delimiter heredoc fed to a
 *   non-shell, and a comment are literal: none of them runs.
 * - Inside a substitution, only the COMMAND position counts: `$(echo pi update)` runs `echo`.
 *
 * Only a substitution is refused. `pi update` typed as its own command is a deliberate act
 * and stays the operator's call.
 *
 * Returns `{command, host, form}` (`form` is `$(…)` or `backticks`) or `null`. Pure, and it
 * never throws: a payload the lexer cannot follow ends at end of input.
 */
const HOSTS = new Set([
  'pi', 'pi-coding-agent', 'codex', 'claude', 'claude-code', 'gemini', 'gemini-cli',
  'opencode', 'opencode-ai', 'cursor-agent', 'amp', 'goose', 'crush', 'droid', 'qwen',
  'qwen-code', 'kimi', 'kimi-cli', 'copilot', 'hermes', 'hermes-agent',
]);
const HOST_VERBS = new Set(['update', 'upgrade', 'self-update']);
const SCRIPT_SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh']);
const PREFIXES = new Set(['sudo', 'env', 'command', 'exec', 'nohup', 'time', 'nice', 'builtin',
  '{', '!', 'if', 'then', 'elif', 'else', 'while', 'until', 'do']);
const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;
const SUB = '\u0000';

/** `@openai/codex@1.2` -> `codex`; `openai/tap/codex` -> `codex`. */
function packageName(spec) {
  return String(spec || '').replace(/(.)@.*$/, '$1').replace(/^.*\//, '');
}

/** Text the shell expands (`"…"`, an unquoted heredoc body): `$(` and backticks run. */
function expandable(src, i, stop, subs, add) {
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (stop !== null && c === stop) return i + 1;
    if (c === '\\') {
      const d = src[i + 1];
      if (d === '\n') { i += 2; continue; }
      if (d === '$' || d === '`' || d === '\\' || (stop !== null && d === stop)) { add(d); i += 2; continue; }
      add(c); i += 1; continue;
    }
    if (c === '$' && src[i + 1] === '(') { i = substitution(src, i + 2, subs); add(SUB); continue; }
    if (c === '`') { i = backtick(src, i + 1, subs); add(SUB); continue; }
    add(c); i += 1;
  }
  return n;
}

function substitution(src, i, subs) {
  const r = lex(src, i, ')', subs);
  subs.push({ form: '$(…)', commands: r.commands });
  return r.end;
}

function backtick(src, i, subs) {
  // Inside backticks a backslash escapes only `$`, a backtick and itself; the body is
  // unescaped once and read as a script, which is how nested backticks are written.
  let body = '';
  let j = i;
  while (j < src.length && src[j] !== '`') {
    if (src[j] === '\\' && ['`', '\\', '$'].includes(src[j + 1])) { body += src[j + 1]; j += 2; continue; }
    body += src[j]; j += 1;
  }
  const r = lex(body, 0, null, subs);
  subs.push({ form: 'backticks', commands: r.commands });
  return j + 1;
}

function heredocBodies(src, i, list, subs) {
  for (const h of list) {
    let body = '';
    while (i < src.length) {
      let e = src.indexOf('\n', i);
      if (e < 0) e = src.length;
      const line = src.slice(i, e);
      i = e + 1;
      if (line.trim() === h.delim) break;
      body += line + '\n';
    }
    if (!h.quoted) expandable(body, 0, null, subs, () => {});
    // A body fed to a shell is a script: its commands are a group of their own (top-level
    // code, `form: null`), so readers of simple commands see them too (B-240).
    if (h.shell) subs.push({ form: null, commands: lex(body, 0, null, subs).commands });
  }
  return i;
}

/**
 * Simple commands as word lists, quotes removed, a substitution left as a marker. With
 * `close === ')'` it reads the body of `$(…)` and returns where it ended.
 */
function lex(src, start, close, subs) {
  const commands = [];
  const pending = [];
  let words = [];
  let word = null;
  let depth = 0;
  let i = start;
  const n = src.length;
  const add = (s) => { word = (word === null ? '' : word) + s; };
  const endWord = () => { if (word !== null) { words.push(word); word = null; } };
  const endCommand = () => { endWord(); if (words.length) commands.push(words); words = []; };
  while (i < n) {
    const c = src[i];
    if (c === ')' && close === ')' && depth === 0) { endCommand(); return { end: i + 1, commands }; }
    if (c === ' ' || c === '\t' || c === '\r') { endWord(); i += 1; continue; }
    if (c === '\n') {
      endCommand(); i += 1;
      if (pending.length) i = heredocBodies(src, i, pending.splice(0), subs);
      continue;
    }
    if (c === '&' && src[i + 1] === '>') { endWord(); i += 2; continue; }
    if (c === ';' || c === '&' || c === '|') { endCommand(); i += 1; continue; }
    if (c === '(') { endCommand(); depth += 1; i += 1; continue; }
    if (c === ')') { endCommand(); if (depth > 0) depth -= 1; i += 1; continue; }
    if (c === '#' && word === null) { while (i < n && src[i] !== '\n') i += 1; continue; }
    if (c === '\\') {
      if (src[i + 1] !== '\n') add(src[i + 1] || '');
      i += 2; continue;
    }
    if (c === "'") {
      const j = src.indexOf("'", i + 1);
      const stop = j < 0 ? n : j;
      add(src.slice(i + 1, stop)); i = stop + 1; continue;
    }
    if (c === '$' && src[i + 1] === "'") {
      let j = i + 2; let s = '';
      while (j < n && src[j] !== "'") {
        if (src[j] === '\\') { s += src[j + 1] || ''; j += 2; } else { s += src[j]; j += 1; }
      }
      add(s); i = j + 1; continue;
    }
    if (c === '"') { add(''); i = expandable(src, i + 1, '"', subs, add); continue; }
    if (c === '$' && src[i + 1] === '(') { i = substitution(src, i + 2, subs); add(SUB); continue; }
    if (c === '`') { i = backtick(src, i + 1, subs); add(SUB); continue; }
    if (c === '<' && src[i + 1] === '<' && src[i + 2] === '<') { endWord(); i += 3; continue; }
    if (c === '<' && src[i + 1] === '<') {
      endWord();
      let j = i + 2;
      if (src[j] === '-') j += 1;
      while (src[j] === ' ' || src[j] === '\t') j += 1;
      let delim = '';
      let quoted = false;
      while (j < n && !/[\s;&|<>()]/.test(src[j])) {
        const d = src[j];
        if (d === "'" || d === '"') {
          quoted = true;
          const k = src.indexOf(d, j + 1);
          const stop = k < 0 ? n : k;
          delim += src.slice(j + 1, stop); j = stop + 1; continue;
        }
        if (d === '\\') { quoted = true; delim += src[j + 1] || ''; j += 2; continue; }
        delim += d; j += 1;
      }
      const cmd = words.find((w) => !ASSIGNMENT.test(w)) || '';
      if (delim) pending.push({ delim, quoted, shell: HEREDOC_SHELLS.has(bareName(cmd)) });
      i = j; continue;
    }
    if (c === '<' || c === '>') {
      endWord(); i += 1;
      if (src[i] === '&' || src[i] === '|' || src[i] === '>') i += 1;
      continue;
    }
    add(c); i += 1;
  }
  endCommand();
  return { end: n, commands };
}

/** The words from the command name on, past `sudo`, `env`, assignments and keywords. */
function commandWords(words) {
  let k = 0;
  while (k < words.length) {
    const w = words[k];
    if (ASSIGNMENT.test(w)) { k += 1; continue; }
    if (PREFIXES.has(bareName(w))) {
      k += 1;
      while (k < words.length && /^-/.test(words[k])) k += 1;
      continue;
    }
    break;
  }
  return words.slice(k);
}

/** Is this simple command a coding-agent host updating itself? `'pi update'` or null. */
function hostCall(words) {
  const cw = commandWords(words);
  if (!cw.length) return null;
  const tool = bareName(cw[0]);
  const rest = cw.slice(1);
  const pos = rest.filter((w) => !/^-/.test(w));
  const said = () => cw.join(' ');
  if (HOSTS.has(tool)) {
    return pos.length && HOST_VERBS.has(pos[0]) ? { command: `${tool} ${pos[0]}`, host: tool } : null;
  }
  if (['npm', 'pnpm', 'bun', 'yarn'].includes(tool)) {
    let global = rest.some((w) => w === '-g' || w === '--global' || w === '--location=global');
    let args = pos;
    if (rest.includes('--location') && pos.includes('global')) {
      global = true; args = pos.filter((w, k) => !(w === 'global' && k === pos.indexOf('global')));
    }
    if (tool === 'yarn' && args[0] === 'global') { global = true; args = args.slice(1); }
    if (!global) return null;
    const verbs = tool === 'yarn' ? ['add', 'upgrade', 'up'] : ['i', 'install', 'add', 'update', 'up', 'upgrade'];
    if (!verbs.includes(args[0])) return null;
    const pkgs = args.slice(1);
    const host = pkgs.map(packageName).find((p) => HOSTS.has(p));
    if (host) return { command: said(), host };
    if (!pkgs.length && ['update', 'up', 'upgrade'].includes(args[0])) return { command: said(), host: 'every global package' };
    return null;
  }
  if (tool === 'brew') {
    if (!['upgrade', 'reinstall', 'install'].includes(pos[0])) return null;
    const formulae = pos.slice(1);
    const host = formulae.map(packageName).find((p) => HOSTS.has(p));
    if (host) return { command: said(), host };
    if (!formulae.length && pos[0] === 'upgrade') return { command: said(), host: 'every outdated formula' };
    return null;
  }
  return null;
}

/** `bash -c '<script>'` / `sh -lc "<script>"`: the script, or null. */
function shellScript(words) {
  const cw = commandWords(words);
  if (!cw.length || !SCRIPT_SHELLS.has(bareName(cw[0]))) return null;
  const at = cw.findIndex((w, k) => k > 0 && /^-[A-Za-z]*c[A-Za-z]*$/.test(w));
  return at > 0 && at + 1 < cw.length ? cw[at + 1] : null;
}

/**
 * Every simple command a payload would run, as `{form, commands}` groups: the top level
 * (`form: null`), each `$(…)` and backtick body (`form` names it), and the script of each
 * `bash -c '…'` (the form of the group it sits in). Quotes are removed from the words and
 * an unresolved substitution is left as a marker. A non-shell heredoc body and a comment
 * are not commands; a shell heredoc body is. Bounded at 512 groups, so a pathological
 * payload costs a fixed amount of work; never throws (an input the lexer cannot follow
 * ends at end of input). Shared by `hostSelfUpdate` here and `lib/gitdiscard.js` (B-240).
 */
function commandGroups(command) {
  const all = [];
  try {
    const text = command == null ? '' : String(command);
    const top = lex(text, 0, null, all);
    all.push({ form: null, commands: top.commands });
    for (let p = 0; p < all.length && p < 512; p += 1) {
      const { form, commands } = all[p];
      for (const words of commands) {
        const script = shellScript(words);
        if (script !== null) {
          const r = lex(script, 0, null, all);
          all.push({ form, commands: r.commands });
        }
      }
    }
  } catch (e) {
    /* Pure and silent, like every reader here. */
  }
  return all.slice(0, 512);
}

function hostSelfUpdate(command) {
  try {
    for (const { form, commands } of commandGroups(command)) {
      if (!form) continue;
      for (const words of commands) {
        const hit = hostCall(words);
        if (hit) return Object.assign(hit, { form });
      }
    }
  } catch (e) {
    /* Pure and silent: an input this lexer cannot follow is not a reason to break a turn. */
  }
  return null;
}

module.exports = {
  maskedGate, hostSelfUpdate, commandGroups, commandWords, SUB,
  skillsCli, familyIds, bareFamilyInstall, launcherRunning, executablePart, substitutions,
  isObsidianSetup, parseConfig, reapply, bareName, REMEDY,
};
