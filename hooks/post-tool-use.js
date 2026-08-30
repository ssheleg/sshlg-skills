#!/usr/bin/env node
'use strict';
/**
 * `PostToolUse` — the two things that can only be checked after the fact.
 *
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

/** Skill id → the plugin spec that provides it, for every ENABLED plugin. */
function providedSkills(home) {
  const map = new Map();
  try {
    const settings = JSON.parse(fs.readFileSync(path.join(home, '.claude', 'settings.json'), 'utf8'));
    const enabled = Object.entries(settings.enabledPlugins || {})
      .filter(([, on]) => on).map(([spec]) => spec);
    const installed = JSON.parse(
      fs.readFileSync(path.join(home, '.claude', 'plugins', 'installed_plugins.json'), 'utf8'));
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
    if (!command) return process.exit(0);

    const hygiene = require(path.join(LIB, 'hygiene.js'));

    if (hygiene.skillsCli(command)) {
      let running = false;
      try { running = hygiene.launcherRunning(execSync('ps -Ao args=', { encoding: 'utf8' })); }
      catch (e) { running = true; } // cannot tell → say nothing rather than cry wolf
      if (!running) {
        const shadow = require(path.join(LIB, 'shadow.js'));
        const skillsDir = path.join(home, '.claude', 'skills');
        const plain = fs.existsSync(skillsDir)
          ? fs.readdirSync(skillsDir, { withFileTypes: true })
            .filter((e) => e.isDirectory() && !e.isSymbolicLink()).map((e) => e.name)
          : [];
        const text = shadow.render(shadow.shadows(plain, providedSkills(home)));
        if (text) notes.push(text);
      }
    }

    if (hygiene.isObsidianSetup(command)) {
      const backup = require(path.join(LIB, 'backup.js'));
      const cfg = path.join(home, '.obsidian-wiki', 'config');
      const real = fs.existsSync(cfg) ? fs.realpathSync(cfg) : cfg;
      const snap = backup.latest({ file: real, home });
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
