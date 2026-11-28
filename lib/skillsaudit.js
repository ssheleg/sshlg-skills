'use strict';
/**
 * B-368 (ST-18): the read-only skills audit, the decision half.
 *
 * Pure: it is handed what a walker read (the copies each runner loads, the pins, the
 * routes, the use counter) and returns the `skills-audit/1` report. Walking a home
 * belongs to `lib/cli-audit.js`; nothing here touches the filesystem or `HOME`, so the
 * fixtures in `test/skillsaudit_test.js` decide every rule without a machine.
 *
 * The `skills` array is item for item the `project-setup/1` skills item of the
 * contract (fabric-agent-contract DEC-0199, `schemas/project-setup.schema.json`
 * `/properties/skills`, PR #365 head `6e7c5c5a`): `name`, `scope`, `version`,
 * `installed`, `hints` and `source: skills-audit`, no other member (the schema says
 * `additionalProperties: false`). What the harness does not copy (the profile read,
 * the copies with their paths, the commands a person may run) sits beside it in
 * `runners`, `evidence` and `degraded` (PS-5).
 *
 * The four hint kinds, as the contract defines them:
 *   duplicate  the same skill is installed twice in one scope (two plugins ship it);
 *   shadowed   another copy hides this one; `other` names where the hiding copy is
 *              (`global` for a plain `~/.claude/skills/<id>`, `project` for a copy in
 *              the project's tree), never a path;
 *   stale      the installed version is behind the version its owner names as current
 *              (for the family, the pin the hub installs: offline, pins equal releases);
 *   unused     no route of the machine's runners reaches it (outside the family's
 *              plugins, the routing block's routers and `routes.external`); on Claude
 *              Code a `skillUsage` entry within `days` is extra evidence that clears it.
 *
 * Every hint says which runner it is about (`runner`, the catalogue id), because one
 * skill of one scope can be current in Claude Code and stale in Codex (B-364).
 * 1.0 is read-only: a hint names a command in `evidence`, the audit never runs one.
 */

const FORMAT = 'skills-audit/1';
const NAME = /^[a-z0-9][a-z0-9:-]{0,127}$/;
const PLUGIN = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MAX_HINTS = 16;
const DAY_MS = 24 * 60 * 60 * 1000;

/** `name@marketplace` → `name`; a bare name is returned as is. */
function pluginName(spec) {
  return typeof spec === 'string' && spec ? spec.split('@')[0] : null;
}

/** -1, 0 or 1 for two dotted numeric versions; null when either is not one. */
function compareVersions(a, b) {
  const parse = (v) => (typeof v === 'string' && /^\d+(\.\d+)*$/.test(v.trim()) ? v.trim().split('.').map(Number) : null);
  const x = parse(a); const y = parse(b);
  if (!x || !y) return null;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return d < 0 ? -1 : 1;
  }
  return 0;
}

function otherForPlugin(spec) {
  const n = pluginName(spec);
  return n && PLUGIN.test(n) ? `plugin:${n}` : null;
}

/**
 * input.runners: [{ id, profile, read, reason?, copies: [{ name, scope, channel, plugin, version, path, callable }] }]
 *   channel is 'plugin' (plugin = its `name@marketplace` spec) or 'plain'.
 *   A runner with read: false is named in `degraded`, never reported as clean.
 * input.pins:   { '<plugin name>': '<version>' } the version each family plugin is pinned at.
 * input.routed: names a route reaches (router names, `routes.external` skills).
 * input.ownedPlugins: plugin names whose skills the family routes (each member's plugin).
 * input.usage:  { '<runner id>': { '<skill name>': <lastUsedAt ms> } } or absent.
 * input.now, input.days: the window `usage` is read in (default 60 days).
 */
function audit(input) {
  const o = input || {};
  const pins = o.pins || {};
  const routed = new Set(o.routed || []);
  const owned = new Set((o.ownedPlugins || []).map(pluginName));
  const usage = o.usage || {};
  const now = Number.isFinite(o.now) ? o.now : 0;
  const days = Number.isFinite(o.days) && o.days > 0 ? o.days : 60;

  const items = new Map(); // `${scope}\0${name}` -> item
  const evidence = new Map();
  const degraded = [];
  const runners = [];
  const skipped = [];

  const itemFor = (name, scope) => {
    const key = `${scope}\0${name}`;
    if (!items.has(key)) {
      items.set(key, { name, scope, installed: true, hints: [], source: 'skills-audit' });
      evidence.set(key, { name, scope, copies: [], commands: [] });
    }
    return key;
  };
  const hint = (key, h) => {
    const it = items.get(key);
    const same = it.hints.some((x) => x.kind === h.kind && x.other === h.other && x.runner === h.runner && x.latest === h.latest);
    if (!same) it.hints.push(h);
  };
  const command = (key, line) => {
    const ev = evidence.get(key);
    if (!ev.commands.includes(line)) ev.commands.push(line);
  };

  for (const r of o.runners || []) {
    if (!r || !r.id) continue;
    runners.push(Object.assign({ id: r.id, profile: r.profile || null, read: r.read !== false }, r.note ? { note: r.note } : {}));
    if (r.read === false) { degraded.push({ runner: r.id, profile: r.profile || null, reason: r.reason || 'not read' }); continue; }

    const byName = new Map();
    for (const c of r.copies || []) {
      if (!c || typeof c.name !== 'string') continue;
      if (!NAME.test(c.name)) { skipped.push({ runner: r.id, name: c.name, why: 'name outside the contract pattern' }); continue; }
      if (c.callable === false) { skipped.push({ runner: r.id, name: c.name, why: 'no SKILL.md behind it (not callable)' }); continue; }
      if (!byName.has(c.name)) byName.set(c.name, []);
      byName.get(c.name).push(c);
    }

    for (const [name, copies] of [...byName.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      const plugins = copies.filter((c) => c.channel === 'plugin' && (c.scope || 'global') === 'global');
      const plainGlobal = copies.filter((c) => c.channel !== 'plugin' && (c.scope || 'global') === 'global');
      const project = copies.filter((c) => c.scope === 'project');
      const keys = [];

      if (plugins.length || plainGlobal.length) {
        const key = itemFor(name, 'global');
        keys.push(key);
        const it = items.get(key);
        const serving = plugins[0] || plainGlobal[0];
        if (serving.version && !it.version) it.version = String(serving.version).slice(0, 64);
        for (const c of plugins.concat(plainGlobal)) evidence.get(key).copies.push(
          { runner: r.id, channel: c.channel === 'plugin' ? 'plugin' : 'plain', plugin: c.plugin || null, version: c.version || null, path: c.path || null });

        // Two plugins ship the same skill id: one is installed twice.
        for (const extra of plugins.slice(1)) {
          const other = otherForPlugin(extra.plugin);
          hint(key, Object.assign({ kind: 'duplicate' }, other ? { other } : {}, { runner: r.id }));
          command(key, r.id === 'claude-code'
            ? `claude plugin uninstall ${extra.plugin}   # or disable one of the two plugins that ship ${name}`
            : `disable ${extra.plugin} or ${plugins[0].plugin} in ${r.id}   # both ship ${name}`);
        }
        // A plain copy beats the plugin and serves its frozen version (one channel per agent).
        // Only Claude Code's precedence is measured (the plain copy wins); elsewhere the
        // pair is reported as what it surely is, the same skill installed twice.
        if (plugins.length && plainGlobal.length) {
          if (r.id === 'claude-code') hint(key, { kind: 'shadowed', other: 'global', runner: r.id });
          else hint(key, { kind: 'duplicate', other: 'global', runner: r.id });
          const fam = plugins.some((p) => owned.has(pluginName(p.plugin)));
          command(key, fam
            ? 'npx --yes sshlg-skills@latest update   # prunes plain copies that shadow a family plugin'
            : `remove ${plainGlobal[0].path || `the plain copy of ${name}`}   # the plugin copy serves again`);
        }
        // Behind its pin: only a family plugin has a pin here; anything else has no owner's "current" offline.
        for (const p of plugins) {
          const pin = pins[pluginName(p.plugin)];
          if (pin && compareVersions(p.version, pin) === -1) {
            hint(key, { kind: 'stale', latest: String(pin).slice(0, 64), runner: r.id });
            command(key, 'npx --yes sshlg-skills@latest update   # installs the pinned version');
          }
        }
      }

      if (project.length) {
        const key = itemFor(name, 'project');
        keys.push(key);
        const it = items.get(key);
        if (project[0].version && !it.version) it.version = String(project[0].version).slice(0, 64);
        for (const c of project) evidence.get(key).copies.push(
          { runner: r.id, channel: 'plain', plugin: null, version: c.version || null, path: c.path || null });
        if (plugins.length || plainGlobal.length) {
          // The project copy hides the global one for this project: say it on the global item,
          // and on the project item that the same skill is installed twice.
          const gkey = itemFor(name, 'global');
          hint(gkey, { kind: 'shadowed', other: 'project', runner: r.id });
          const other = plugins.length ? otherForPlugin(plugins[0].plugin) : 'global';
          hint(key, Object.assign({ kind: 'duplicate' }, other ? { other } : {}, { runner: r.id }));
          command(key, `remove ${project[0].path || `the project copy of ${name}`}, or keep it on purpose and allowlist it in .gitignore (.claude/skills/* then !.claude/skills/${name}/)`);
        }
      }

      // Outside every route. A family plugin's skills are routed by the block; so are the
      // router names and the operator's declared routes. Recent use on this runner clears it.
      const fromFamily = plugins.some((p) => owned.has(pluginName(p.plugin)));
      const bare = name.includes(':') ? name.split(':').pop() : name;
      if (!fromFamily && !routed.has(name) && !routed.has(bare)) {
        const last = (usage[r.id] || {})[name];
        const recent = Number.isFinite(last) && now - last <= days * DAY_MS;
        if (!recent) for (const key of keys) {
          hint(key, { kind: 'unused', runner: r.id });
          command(key, `npx sshlg-skills config set routes.external.${bare}.triggers "<words>"   # route it, or remove it if nothing needs it`);
        }
      }
    }
  }

  const keys = [...items.keys()].sort();
  const skills = [];
  const ev = [];
  const counts = { duplicate: 0, shadowed: 0, stale: 0, unused: 0 };
  let truncated = 0;
  for (const key of keys) {
    const it = items.get(key);
    if (it.hints.length > MAX_HINTS) { truncated += it.hints.length - MAX_HINTS; it.hints = it.hints.slice(0, MAX_HINTS); }
    for (const h of it.hints) counts[h.kind] += 1;
    skills.push(it);
    ev.push(evidence.get(key));
  }
  return {
    format: FORMAT,
    readOnly: true,
    runners,
    degraded,
    counts,
    skills,
    evidence: ev,
    skipped,
    truncatedHints: truncated,
  };
}

/**
 * `[plugins."<name>@<marketplace>"]` tables of Codex's config.toml → Map<spec, enabled>.
 * Every quoting Codex writes is accepted (as `codexplugins.readMarketplaces` does);
 * a table with no `enabled` key, or a value other than true/false, is left out, so
 * an unreadable flag never hides a plugin. Pure: it is handed the text.
 */
function codexPluginFlags(text) {
  const out = new Map();
  if (typeof text !== 'string') return out;
  const header = /^\s*\[\s*(?:"plugins"|'plugins'|plugins)\s*\.\s*(?:"([^"]+)"|'([^']+)'|([A-Za-z0-9_@.-]+))\s*\]\s*(?:#.*)?$/;
  const anyHeader = /^\s*\[/;
  const enabled = /^\s*(?:"enabled"|'enabled'|enabled)\s*=\s*(true|false)\s*(?:#.*)?$/;
  let cur = null;
  for (const line of text.split(/\r?\n/)) {
    const h = header.exec(line);
    if (h) { cur = h[1] || h[2] || h[3]; continue; }
    if (anyHeader.test(line)) { cur = null; continue; }
    if (!cur) continue;
    const e = enabled.exec(line);
    if (e) out.set(cur, e[1] === 'true');
  }
  return out;
}

/** The text form: counts first, then each item with a hint and the commands it names. */
function render(report, opts) {
  const o = opts || {};
  const r = report || {};
  const out = [];
  const c = r.counts || {};
  const read = (r.runners || []).filter((x) => x.read).map((x) => `${x.id} (${x.profile || 'unknown profile'})`);
  const notes = (r.runners || []).filter((x) => x.read && x.note).map((x) => `  note: ${x.id}: ${x.note}`);
  out.push(`skills audit (read-only): ${(r.skills || []).length} skills read in ${read.join(', ') || 'no runner'}`);
  out.push(`  duplicate ${c.duplicate || 0}, shadowed ${c.shadowed || 0}, stale ${c.stale || 0}, unused ${c.unused || 0}`);
  out.push(...notes);
  for (const d of r.degraded || []) out.push(`  not read: ${d.runner}${d.profile ? ` (${d.profile})` : ''}: ${d.reason}`);
  const withHints = (r.skills || []).map((s, i) => [s, (r.evidence || [])[i]]).filter(([s]) => s.hints.length);
  const strong = withHints.filter(([s]) => s.hints.some((h) => h.kind !== 'unused'));
  const unusedOnly = withHints.filter(([s]) => s.hints.every((h) => h.kind === 'unused'));
  for (const [s, e] of strong) {
    out.push('');
    out.push(`${s.name} (${s.scope}${s.version ? `, ${s.version}` : ''}): ${s.hints.map((h) => h.kind + (h.other ? ` by ${h.other}` : '') + (h.latest ? ` (pin ${h.latest})` : '') + ` [${h.runner}]`).join('; ')}`);
    for (const cp of (e && e.copies) || []) out.push(`  copy: ${cp.channel}${cp.plugin ? ` ${cp.plugin}` : ''}${cp.version ? ` ${cp.version}` : ''}${cp.path ? ` at ${cp.path}` : ''}`);
    for (const line of (e && e.commands) || []) out.push(`  may run: ${line}`);
  }
  if (unusedOnly.length) {
    out.push('');
    const names = unusedOnly.map(([s]) => s.name);
    const limit = o.full ? names.length : 40;
    out.push(`unused (no route reaches them${o.days ? `, no use in ${o.days} days` : ''}): ${names.slice(0, limit).join(', ')}${names.length > limit ? `, and ${names.length - limit} more (--json lists all)` : ''}`);
  }
  out.push('');
  out.push('Nothing was changed: each "may run" line is a hint for a person or an agent.');
  return out.join('\n');
}

module.exports = { FORMAT, audit, render, compareVersions, pluginName, codexPluginFlags };
