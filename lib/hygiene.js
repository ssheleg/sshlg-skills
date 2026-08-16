'use strict';
/**
 * The three machine habits this pack keeps writing down and nothing enforces.
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

function executablePart(command) {
  const lines = String(command || '').split('\n');
  const out = [];
  let terminator = null;
  let dropping = false;
  for (const line of lines) {
    if (terminator !== null) {
      // The terminator may be indented when the heredoc used `<<-`.
      if (line.trim() === terminator) { terminator = null; dropping = false; continue; }
      if (dropping) continue;
      out.push(line);
      continue;
    }
    if (/^\s*#/.test(line)) continue;
    const here = /<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1/.exec(line);
    if (here) {
      terminator = here[2];
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
    out.push(line);
  }
  return out.join('\n');
}

function skillsCli(command) {
  const tokens = String(command || '').split(/\s+/).filter(Boolean);
  for (let i = 0; i < tokens.length; i += 1) {
    if (bareName(tokens[i]) !== 'skills') continue;
    const rest = tokens.slice(i + 1).filter((t) => !isFlag(t));
    if (!rest.length) return { verb: null, args: [] };
    return { verb: rest[0], args: rest.slice(1) };
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
  const target = call.args.find((a) => ids.has(bareName(a)));
  if (!target) return null;
  return { target, verb: call.verb, remedy: REMEDY };
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

/** Does this command run `obsidian-wiki setup`, the one that truncates the config? */
function isObsidianSetup(command) {
  const tokens = String(command || '').split(/\s+/).filter(Boolean);
  const at = tokens.findIndex((t) => bareName(t) === 'obsidian-wiki');
  if (at < 0) return false;
  return tokens.slice(at + 1).filter((t) => !isFlag(t))[0] === 'setup';
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

module.exports = {
  skillsCli, familyIds, bareFamilyInstall, launcherRunning, executablePart,
  isObsidianSetup, parseConfig, reapply, bareName, REMEDY,
};
