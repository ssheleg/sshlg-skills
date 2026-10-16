#!/usr/bin/env node
'use strict';
/**
 * `PostToolUse` — the things that can only be checked after the fact.
 *
 * 0. **A credential in what came back** — from `Bash`, `Read` or `Grep`: one shaped like
 *    a vendor's key (`secrets.scan`), or a generated-looking value printed under a label
 *    that names a credential (`labelledsecrets.scanLabelled`: `x-api-key: …`,
 *    `FOO_API_KEY=…`, `Authorization: Bearer …`). Both report the name, never the value.
 * 1. **Shadowing plain copies.** After any skills-CLI run, a plain
 *    `~/.claude/skills/<id>` beside a plugin that provides the same id serves the
 *    version it was copied from, forever. The machine's own notes carry this
 *    check as a command somebody has to remember; here it runs itself.
 * 2. **The config `obsidian-wiki setup` truncated.** Its `write_config()` writes
 *    three keys through the profile symlink and drops the rest. `PreToolUse` took
 *    a snapshot; this puts back exactly what went missing and says which keys.
 *
 * **The window where the shadow check lies.** The launcher installs into every
 * agent first and clears the shadowing copies last, so a check inside that window
 * reports shadows that are gone seconds later. Recorded on this machine on
 * 2026-08-12. So the check asks whether the launcher is running, and matches its
 * argv rather than its name — a bare name match also catches every Claude Code
 * session whose working directory is this repository.
 *
 * Reports through `additionalContext`, which is what this event delivers. Fails
 * silent, for the reason the guard does.
 */

const path = require('path');
const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');

const LIB = path.join(__dirname, '..', 'lib');

function say(text) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: text },
  }) + '\n');
}

/**
 * Skill id → the plugin spec that provides it, for every plugin ENABLED for `cwd` — user
 * scope, then the project's settings files (B-185: a domain member is on per project).
 */
function providedSkills(home, cwd) {
  const map = new Map();
  try {
    const en = require(path.join(LIB, 'enablement.js'));
    const eff = en.effective(home, cwd || null);
    const enabled = Object.entries(eff).filter(([, on]) => on).map(([spec]) => spec);
    const installed = JSON.parse(
      fs.readFileSync(path.join(en.claudeRoot(home), 'plugins', 'installed_plugins.json'), 'utf8'));
    for (const spec of enabled) {
      const rows = (installed.plugins || {})[spec] || [];
      for (const row of rows) {
        const dir = path.join(row.installPath || '', 'skills');
        if (!fs.existsSync(dir)) continue;
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          if (e.isDirectory()) map.set(e.name, spec);
        }
      }
    }
  } catch (e) { /* an unreadable plugin registry means no claim, not a wrong one */ }
  return map;
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  const notes = [];
  try {
    const data = raw.trim().startsWith('{') ? JSON.parse(raw) : {};
    const home = os.homedir();
    const command = (data.tool_input && data.tool_input.command) || '';

    // 0. Did this tool PRINT a credential? PreToolUse denies the shapes
    //    somebody thought of; a tool that prints its own configuration was not
    //    one of them. This cannot unprint — its value is the interval between
    //    leaking and knowing, which on 2026-09-05 was hours. Read and Grep reach
    //    here too (the matcher in lib/hooks.js): a config file read whole prints
    //    the same value a `cat` would. Each detector fails silent on its own, so
    //    one that throws never costs the other its report — or the tool its turn.
    // The vendor scan reads EVERY byte of every string, as it did before the labelled
    // detector existed; only the labelled detector windows its input (per string). A
    // cap on the joined text once hid a vendor key in `stderr` behind a MiB of `stdout`.
    let parts = null;
    try { parts = require(path.join(LIB, 'labelledsecrets.js')).outputParts(data.tool_response); }
    catch (e) { /* the reader below stands in */ }
    let text = '';
    if (parts) text = parts.join('\n');
    else {
      // The reader this hook had before the labelled detector, kept so a broken module
      // costs the vendor scan nothing.
      const r = data.tool_response;
      text = typeof r === 'string' ? r
        : r && typeof r === 'object'
          ? [r.stdout, r.stderr, r.output, r.content].filter((x) => typeof x === 'string').join('\n')
          : '';
    }
    try {
      const leak = require(path.join(LIB, 'secrets.js')).scan(text);
      if (leak) notes.push('[sshlg-skills] CREDENTIAL IN OUTPUT — ' + leak.why);
    } catch (e) { /* fails silent, like everything else here */ }
    try {
      const L = require(path.join(LIB, 'labelledsecrets.js'));
      // A time budget well inside the host's hook timeout: if the labelled scan cannot
      // finish, its note says PARTIAL and the vendor note above still reaches the turn.
      // SSHLG_LABELLED_BUDGET_MS exists for the e2e fixture that proves the budget is honoured.
      const timeBudgetMs = Number(process.env.SSHLG_LABELLED_BUDGET_MS) || 5000;
      const note = L.describe(L.scanLabelled(parts || [text], { timeBudgetMs }), L.whereOf(data));
      if (note) notes.push(note);
    } catch (e) { /* fails silent, like everything else here */ }

    if (!command) {
      if (notes.length) say(notes.join('\n\n'));
      return process.exit(0);
    }

    const hygiene = require(path.join(LIB, 'hygiene.js'));

    if (hygiene.skillsCli(command)) {
      let running = false;
      try { running = hygiene.launcherRunning(execSync('ps -Ao args=', { encoding: 'utf8' })); }
      catch (e) { running = true; } // cannot tell → say nothing rather than cry wolf
      if (!running) {
        const shadow = require(path.join(LIB, 'shadow.js'));
        const plainIn = (dir, scope, at) => {
          try {
            return fs.readdirSync(dir, { withFileTypes: true })
              .filter((e) => e.isDirectory() && !e.isSymbolicLink())
              .map((e) => ({ name: e.name, scope, at }));
          } catch (e) { return []; }
        };
        const profileRoot = require(path.join(LIB, 'enablement.js')).claudeRoot(home);
        const plain = plainIn(path.join(profileRoot, 'skills'), 'home');
        // The project's own `.claude/skills` is a second shadow location and the one
        // with a consequence the home copy does not have: it sits inside a git tree.
        // The hook is told where it is running; `process.cwd()` is where the hook
        // happened to be spawned and is not the project (`hooks/statusline.js` says
        // the same about the same field).
        const project = data.cwd || (data.workspace && data.workspace.current_dir)
          || process.env.CLAUDE_PROJECT_DIR || '';
        if (project && path.resolve(project) !== path.resolve(home)) {
          plain.push(...plainIn(path.join(project, '.claude', 'skills'), 'project',
            path.join(project, '.claude', 'skills')));
        }
        let text = shadow.render(shadow.shadows(plain, providedSkills(home, project)));
        if (profileRoot !== path.join(home, '.claude'))
          text = text.replace('in ~/.claude/skills/', `in ${path.join(profileRoot, 'skills')}/`);
        if (text) notes.push(text);
      }
    }

    if (hygiene.isObsidianSetup(command)) {
      const backup = require(path.join(LIB, 'backup.js'));
      const cfg = path.join(home, '.obsidian-wiki', 'config');
      const real = fs.existsSync(cfg) ? fs.realpathSync(cfg) : cfg;
      let snap;
      try { snap = backup.latest({ file: real, home }); }
      catch (e) { notes.push('[sshlg-skills] Automatic instruction-config restore was NOT performed: ' + e.message); }
      if (snap && fs.existsSync(real)) {
        const { text, restored } = hygiene.reapply(
          fs.readFileSync(snap, 'utf8'), fs.readFileSync(real, 'utf8'));
        if (restored.length) {
          // The one write this hook makes goes through the same gate as every
          // other write to a file the operator owns (CLAUDE.md: "there is no
          // second write path" — this line was the second one, UM-06): a copy
          // of what is on disk right now, and a copy that cannot be taken
          // cancels the write. What is on disk is `setup`'s own output, cheap
          // to reproduce — but the gate is the invariant, not a judgement
          // about which bytes are precious. Taken AFTER `latest()` was read,
          // so the pre-run snapshot this restore merges from is already held.
          const { protect } = require(path.join(LIB, 'apply.js'));
          const saved = protect(real, { home });
          if (saved.action === 'backup-failed') {
            notes.push(
              `[sshlg-skills] \`obsidian-wiki setup\` dropped ${restored.length} key(s) from ` +
              `${real} (${restored.join(', ')}), and the restore was NOT performed: a copy ` +
              `of the file could not be taken first (${saved.error}). The pre-run snapshot ` +
              `is ${snap} — fix the backup directory (~/.sshlg-skills/backups) and re-apply ` +
              `the missing keys from it.`);
          } else {
            fs.writeFileSync(real, text, 'utf8');
            notes.push(
              `[sshlg-skills] \`obsidian-wiki setup\` dropped ${restored.length} key(s) from ` +
              `${real}; they were restored from the snapshot taken before it ran: ` +
              `${restored.join(', ')}. The values setup wrote were kept.`);
          }
        }
      }
    }

    if (notes.length) say(notes.join('\n\n'));
  } catch (e) {
    /* Silence, deliberately. */
  }
  process.exit(0);
});
