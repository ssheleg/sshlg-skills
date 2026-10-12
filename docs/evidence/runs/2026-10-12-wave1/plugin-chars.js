#!/usr/bin/env node
'use strict';
/**
 * W1-G — how many skill-listing characters the ENABLED Claude Code plugins cost.
 *
 *   node docs/evidence/runs/2026-10-12-wave1/plugin-chars.js [settings.json]
 *
 * Reads `enabledPlugins` from the given settings file (default `~/.claude/settings.json`),
 * resolves each enabled plugin's install path from `~/.claude/plugins/installed_plugins.json`,
 * and sums `name` + `description` characters of every `SKILL.md` under it — the text a
 * skill contributes to the listing. Read-only. Pass the pre-change backup
 * (`~/.claude/settings.json.bak-plugins-scope-2026-10-12`) to measure the set before W1-G.
 * Prints one JSON line: enabled plugins, skills, characters, and the five largest plugins.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const home = os.homedir();
const settingsFile = process.argv[2] || path.join(home, '.claude', 'settings.json');
const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
const installed = JSON.parse(fs.readFileSync(
  path.join(home, '.claude', 'plugins', 'installed_plugins.json'), 'utf8')).plugins || {};

function frontMatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return {};
  const out = {};
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const kv = /^([A-Za-z_-]+):\s*(.*)$/.exec(lines[i]);
    if (!kv || !['name', 'description'].includes(kv[1])) continue;
    let v = kv[2];
    if (/^[>|][-+]?\s*$/.test(v)) {               // a folded or literal block
      const body = [];
      while (i + 1 < lines.length && (/^\s+\S/.test(lines[i + 1]) || lines[i + 1] === '')) body.push(lines[(i += 1)].trim());
      v = body.join(v.startsWith('>') ? ' ' : '\n').trim();
    } else {
      v = v.trim().replace(/^(['"])([\s\S]*)\1$/, '$2');
    }
    out[kv[1]] = v;
  }
  return out;
}

function skillFiles(dir, acc) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return acc; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) skillFiles(p, acc);
    else if (e.name === 'SKILL.md') acc.push(p);
  }
  return acc;
}

const rows = [];
for (const [spec, on] of Object.entries(settings.enabledPlugins || {})) {
  if (on !== true) continue;
  const inst = (installed[spec] || []).find((x) => x.scope === 'user') || (installed[spec] || [])[0];
  if (!inst || !inst.installPath) { rows.push({ spec, skills: 0, chars: 0, note: 'not installed' }); continue; }
  let skills = 0;
  let chars = 0;
  for (const f of skillFiles(inst.installPath, [])) {
    const fm = frontMatter(fs.readFileSync(f, 'utf8'));
    if (!fm.name && !fm.description) continue;
    skills += 1;
    chars += (fm.name || '').length + (fm.description || '').length;
  }
  rows.push({ spec, skills, chars });
}
rows.sort((a, b) => b.chars - a.chars);
console.log(JSON.stringify({
  settings: settingsFile.replace(home, '~'),
  enabled: rows.length,
  skills: rows.reduce((n, r) => n + r.skills, 0),
  chars: rows.reduce((n, r) => n + r.chars, 0),
  largest: rows.slice(0, 5).map((r) => `${r.spec} ${r.chars}`),
}));
