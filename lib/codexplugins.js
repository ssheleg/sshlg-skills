'use strict';
/**
 * Codex's native plugins, refreshed through Codex's OWN CLI (B-166).
 *
 * `lib/lifecycle.js` holds the rule: a host is driven through its supported API,
 * and only what the host reads back counts as `current`. Until B-166 Codex was
 * declared to have no such API, so after every re-pin the family plugins in
 * Codex's native cache stayed at their old versions — and because the
 * `~/.agents/skills` copies of those skills are excluded in Codex's
 * `skills.config`, Codex had no fresh copy of them at all.
 *
 * Codex 0.162.1 does have the API (measured 2026-10-12, compat cut finding 2,
 * and re-measured against a sandbox `CODEX_HOME` for this module):
 *
 *   1. `codex plugin marketplace remove <m>` — `add` refuses a name that is
 *      already configured from another source or ref, hence the remove;
 *   2. `codex plugin marketplace add https://github.com/<repo>.git --ref <pin>`;
 *   3. `codex plugin add <plugin>@<m>` — re-adding the marketplace alone leaves
 *      the old version in the plugin cache, and `codex plugin list` keeps
 *      reporting it until this step runs;
 *   4. readback: `codex plugin list --json` — the version Codex reports for the
 *      plugin must equal the pin. That readback is the only thing that may
 *      produce `current` (`lifecycle.reloadReceipt`).
 *
 * What this module will not do:
 *   - touch a marketplace that is not a family member's, or a family member's
 *     whose source is not the family repository (a local checkout, a fork);
 *   - install into Codex a plugin the operator does not have there, or refresh
 *     one the operator disabled;
 *   - remove a marketplace whose previous source and ref it could not record
 *     first, or whose table carries settings it could not restore;
 *   - edit `config.toml` itself. Codex's CLI writes Codex's config; this module
 *     only READS it, to record the ref a rollback must restore.
 *
 * Every external command goes through an injected `runner(cmd, args, opts)`
 * returning `{status, stdout, stderr, error}`, so the suites drive a fake
 * `codex` and never the machine's own. Pure apart from that runner.
 */

const path = require('path');
const lc = require('./lifecycle.js');

const HOST = 'Codex';

/** Codex's config root: `$CODEX_HOME` (Codex's documented override) or `~/.codex`. */
function codexHome(env, home) {
  const e = env || {};
  return e.CODEX_HOME || path.join(home, '.codex');
}

/** Lower-case `github.com/<owner>/<repo>` for a git source in any of its spellings. */
function normalizeSource(source) {
  let s = String(source || '').trim();
  if (!s) return '';
  s = s.replace(/^git@github\.com:/i, 'github.com/')
    .replace(/^(?:https?|ssh|git):\/\/(?:[^@/]+@)?/i, '')
    .replace(/\/+$/, '')
    .replace(/\.git$/i, '');
  if (/^[\w.-]+\/[\w.-]+$/.test(s)) s = `github.com/${s}`; // the `owner/repo` shorthand
  return s.toLowerCase();
}

/** The family's repository URL for a member, as the re-add passes it to Codex. */
function familyUrl(member) {
  return `https://github.com/${member.repo}.git`;
}

/**
 * `["marketplaces".<name>]` tables from config.toml, read-only.
 *
 * Codex writes these in more than one quoting (`[marketplaces.x]`,
 * `["marketplaces".x]`, `["marketplaces"."x"]`, and quoted keys inside) — the
 * same mixed quoting B-167 is about — so every spelling is accepted. Only
 * single-line string values are read; any other key is kept by NAME in
 * `other`, so a table carrying a setting this module cannot restore (sparse
 * paths, say) is left alone rather than half-restored by a rollback.
 */
function readMarketplaces(text) {
  const out = new Map();
  if (typeof text !== 'string') return out;
  const header = /^\s*\[\s*(?:"marketplaces"|'marketplaces'|marketplaces)\s*\.\s*(?:"([^"]+)"|'([^']+)'|([A-Za-z0-9_-]+))\s*\]\s*(?:#.*)?$/;
  const anyHeader = /^\s*\[/;
  const keyLine = /^\s*(?:"([^"]+)"|'([^']+)'|([A-Za-z0-9_-]+))\s*=\s*(.*?)\s*$/;
  let cur = null;
  for (const line of text.split(/\r?\n/)) {
    const h = header.exec(line);
    if (h) {
      cur = { name: h[1] || h[2] || h[3], other: [] };
      out.set(cur.name, cur);
      continue;
    }
    if (anyHeader.test(line)) { cur = null; continue; }
    if (!cur || /^\s*(#|$)/.test(line)) continue;
    const k = keyLine.exec(line);
    if (!k) continue;
    const key = k[1] || k[2] || k[3];
    const raw = k[4].replace(/\s+#.*$/, '');
    const str = /^"((?:[^"\\]|\\.)*)"$/.exec(raw) || /^'([^']*)'$/.exec(raw);
    if ((key === 'source_type' || key === 'source' || key === 'ref') && str) {
      cur[key] = str[1].replace(/\\(["\\])/g, '$1');
    } else {
      cur.other.push(key);
    }
  }
  return out;
}

/**
 * What `codex plugin list` says is installed: `Map<pluginId, {version, installed,
 * enabled}>`. The JSON form (`--json`) is read first; the table form is the
 * fallback for a Codex whose `list` has no `--json`. Returns null when neither
 * parses — an unreadable list is not an empty one.
 */
function parsePluginList(stdout) {
  const text = String(stdout || '');
  try {
    const d = JSON.parse(text);
    if (d && Array.isArray(d.installed)) {
      const out = new Map();
      for (const p of d.installed) {
        if (!p || !p.pluginId) continue;
        out.set(p.pluginId, {
          version: p.version || null, installed: p.installed !== false, enabled: p.enabled !== false,
        });
      }
      return out;
    }
  } catch (_) { /* not JSON — try the table */ }
  const out = new Map();
  let sawHeader = false;
  const row = /^(\S+@\S+)\s+(installed, enabled|installed, disabled|not installed)(?:\s+(\S+))?/;
  for (const line of text.split(/\r?\n/)) {
    if (/^PLUGIN\s+STATUS\s+VERSION/.test(line)) { sawHeader = true; continue; }
    const m = row.exec(line);
    if (!m) continue;
    const installed = m[2] !== 'not installed';
    out.set(m[1], {
      version: installed ? (m[3] || null) : null,
      installed, enabled: m[2] === 'installed, enabled',
    });
  }
  return sawHeader || out.size ? out : null;
}

/** `plugin@marketplace` → its two halves. */
function splitPluginId(id) {
  const at = String(id || '').lastIndexOf('@');
  return at > 0 ? { plugin: id.slice(0, at), marketplace: id.slice(at + 1) } : null;
}

/**
 * Decide, per family member, what happens in Codex. Pure.
 *
 * `listed` is `parsePluginList`'s map, `marketplaces` is `readMarketplaces`'s,
 * `pinRef(member)` returns `{ref, kind}`. Each item's `action`:
 *   - `absent`  — not installed in Codex: left alone, never installed;
 *   - `skip`    — installed, but something makes touching it unsafe (`why`);
 *   - `current` — Codex already reports the pinned version;
 *   - `refresh` — the four steps run, with `prev` recorded for the rollback.
 */
function planRefresh({ skills, listed, marketplaces, pinRef, only }) {
  const items = [];
  for (const s of skills || []) {
    if (only && s.name !== only) continue;
    const ids = splitPluginId(s.pluginInstall);
    if (!ids) continue;
    const base = {
      member: s.name, pluginId: s.pluginInstall, marketplace: ids.marketplace,
      pin: s.version, url: familyUrl(s),
    };
    const entry = listed && listed.get(s.pluginInstall);
    if (!entry || !entry.installed) {
      items.push(Object.assign(base, { action: 'absent' }));
      continue;
    }
    base.from = entry.version;
    const mk = marketplaces && marketplaces.get(ids.marketplace);
    if (!entry.enabled) {
      items.push(Object.assign(base, { action: 'skip',
        why: 'disabled in Codex — left as the operator set it' }));
    } else if (!mk) {
      items.push(Object.assign(base, { action: 'skip',
        why: `no [marketplaces.${ids.marketplace}] table in Codex's config.toml — the previous ref `
          + 'cannot be recorded, so the marketplace is not removed' }));
    } else if (mk.source_type !== 'git' || normalizeSource(mk.source) !== normalizeSource(base.url)) {
      items.push(Object.assign(base, { action: 'skip',
        why: `marketplace source is ${mk.source || '(none)'}, not the family repository — not touched` }));
    } else if (mk.other.length) {
      items.push(Object.assign(base, { action: 'skip',
        why: `marketplace carries settings a rollback could not restore (${mk.other.join(', ')}) — not touched` }));
    } else if (entry.version === s.version) {
      items.push(Object.assign(base, { action: 'current' }));
    } else {
      const r = pinRef(s) || {};
      items.push(Object.assign(base, {
        action: 'refresh', ref: r.ref, refKind: r.kind,
        prev: { source: mk.source, ref: mk.ref || null },
      }));
    }
  }
  return items;
}

/** The three mutating commands for one item, in order — shared by the run and the dry-run. */
function refreshCommands(item) {
  return [
    { step: 'marketplace remove', args: ['plugin', 'marketplace', 'remove', item.marketplace] },
    { step: 'marketplace add', args: ['plugin', 'marketplace', 'add', item.url, '--ref', item.ref] },
    { step: 'plugin add', args: ['plugin', 'add', item.pluginId] },
  ];
}

/** The commands that put the previous marketplace back as it was recorded. */
function rollbackCommands(item, newMarketplaceAdded) {
  const add = ['plugin', 'marketplace', 'add', item.prev.source];
  if (item.prev.ref) add.push('--ref', item.prev.ref);
  const cmds = [];
  if (newMarketplaceAdded) {
    cmds.push({ step: 'rollback marketplace remove', args: ['plugin', 'marketplace', 'remove', item.marketplace] });
  }
  cmds.push({ step: 'rollback marketplace add', args: add });
  cmds.push({ step: 'rollback plugin add', args: ['plugin', 'add', item.pluginId] });
  return cmds;
}

function firstLine(r) {
  const t = `${(r && r.stderr) || ''}\n${(r && r.stdout) || ''}`.split(/\r?\n/)
    .map((l) => l.trim()).find(Boolean);
  if (t) return t;
  if (r && r.error) return r.error.message || String(r.error);
  return `exit ${r ? r.status : '?'}`;
}

function ok(r) { return !!r && !r.error && r.status === 0; }

/** `codex plugin list`, JSON first; `{listed}` or `{error}` naming what failed. */
function readList(runner) {
  const j = runner('codex', ['plugin', 'list', '--json'], { read: true });
  if (ok(j)) {
    const listed = parsePluginList(j.stdout);
    if (listed) return { listed };
  }
  const t = runner('codex', ['plugin', 'list'], { read: true });
  if (ok(t)) {
    const listed = parsePluginList(t.stdout);
    if (listed) return { listed };
    return { error: 'codex plugin list printed nothing this module can read' };
  }
  const unsupported = /unrecognized subcommand|unexpected argument|unknown command/i.test(firstLine(t));
  return { error: firstLine(t), unsupported };
}

/** The version Codex now reports for one plugin, as a reload receipt. */
function readback(runner, item) {
  const r = readList(runner);
  const loaded = r.listed && r.listed.get(item.pluginId);
  return lc.reloadReceipt(HOST, item.pin, loaded && loaded.installed ? loaded.version : null);
}

/**
 * Run one `refresh` item: remove → add at the pin → plugin add → readback.
 *
 * A failing step stops the item and is reported as `FAILED <step>`. Once the
 * marketplace has been removed, any later failure re-adds the PREVIOUS source
 * and ref recorded before the removal (and its plugin), so a failure never
 * leaves the operator without a marketplace this run removed — and if that
 * rollback fails too, the exact commands to restore it by hand are returned.
 * A readback that disagrees with the pin is `stale`, not rolled back: the
 * marketplace is at the pinned ref, which is where the hub wants it, and the
 * previous ref was not the pin either.
 */
function refreshOne(item, runner) {
  const cmds = refreshCommands(item);
  let removed = false;
  let added = false;
  for (const c of cmds) {
    const r = runner('codex', c.args, { read: false });
    if (!ok(r)) {
      const res = { item, status: 'FAILED', step: c.step, detail: firstLine(r) };
      if (removed) res.rollback = rollback(item, runner, added);
      return res;
    }
    if (c.step === 'marketplace remove') removed = true;
    if (c.step === 'marketplace add') added = true;
  }
  const receipt = readback(runner, item);
  if (receipt.status === 'current') return { item, status: 'current', receipt };
  return { item, status: 'FAILED', step: 'readback', receipt,
    detail: receipt.status === 'stale'
      ? `Codex reports ${receipt.loaded}, the pin is ${item.pin}`
      : receipt.why };
}

function rollback(item, runner, newMarketplaceAdded) {
  const cmds = rollbackCommands(item, newMarketplaceAdded);
  for (const c of cmds) {
    const r = runner('codex', c.args, { read: false });
    // A rollback `remove` that fails because the new marketplace never landed is not
    // a reason to stop putting the old one back.
    if (!ok(r) && c.step !== 'rollback marketplace remove') {
      return { status: 'FAILED', step: c.step, detail: firstLine(r),
        manual: cmds.filter((x) => x.step !== 'rollback marketplace remove')
          .map((x) => `codex ${x.args.join(' ')}`) };
    }
  }
  const back = readList(runner);
  const loaded = back.listed && back.listed.get(item.pluginId);
  return { status: 'restored', ref: item.prev.ref, version: loaded ? loaded.version : null };
}

/**
 * The whole Codex pass for `update`. `deps`:
 *   runner(cmd, args, {read}) → {status, stdout, stderr, error}
 *   readConfig() → config.toml text, or null when absent/unreadable
 *   pinRef(member) → {ref, kind}
 *   skills, only (a member name, or null)
 * Returns `{status, why?, items, results}` where status is `skipped` (with why),
 * `unsupported`, `unread` or `ran`.
 */
function refreshAll(deps) {
  const text = deps.readConfig();
  if (text === null || text === undefined) {
    return { status: 'skipped', why: `no Codex config at ${deps.configPath || 'config.toml'} — nothing installed natively`,
      items: [], results: [] };
  }
  const v = deps.runner('codex', ['--version'], { read: true });
  if (!ok(v)) {
    return { status: 'skipped', why: 'codex is not on PATH — its native plugins were not read', items: [], results: [] };
  }
  const r = readList(deps.runner);
  if (!r.listed) {
    return { status: r.unsupported ? 'unsupported' : 'unread', why: r.error, items: [], results: [] };
  }
  const items = planRefresh({
    skills: deps.skills, listed: r.listed, marketplaces: readMarketplaces(text),
    pinRef: deps.pinRef, only: deps.only,
  });
  const results = [];
  for (const it of items) {
    if (it.action !== 'refresh') continue;
    if (deps.onItem) deps.onItem(it);
    const res = refreshOne(it, deps.runner);
    results.push(res);
    if (deps.onResult) deps.onResult(res);
  }
  return { status: 'ran', items, results };
}

/** Log lines for one result, in the `update` log's style. */
function resultLines(res) {
  const it = res.item;
  if (res.status === 'current') {
    return [`  ${it.pluginId}: ${it.from} → ${res.receipt.digest} — current (read back from codex plugin list)`];
  }
  const lines = [`  ${it.pluginId}: FAILED ${res.step} — ${res.detail}`];
  if (res.rollback) {
    if (res.rollback.status === 'restored') {
      lines.push(`    rollback: marketplace ${it.marketplace} restored at `
        + `${res.rollback.ref || 'its default branch'}${res.rollback.version ? ` (Codex reports ${res.rollback.version})` : ''}`);
    } else {
      lines.push(`    rollback FAILED ${res.rollback.step} — ${res.rollback.detail}`);
      lines.push(`    marketplace ${it.marketplace} may be missing from Codex; restore it by hand:`);
      for (const m of res.rollback.manual) lines.push(`      ${m}`);
    }
  }
  return lines;
}

/** One summary line over every installed family plugin, from `lifecycle.overallCurrent`. */
function summaryLine(out) {
  const present = out.items.filter((i) => i.action !== 'absent');
  const receipts = present.map((i) => {
    if (i.action === 'current') return { host: i.pluginId, status: 'current' };
    if (i.action === 'skip') return { host: i.pluginId, status: 'skipped' };
    const res = out.results.find((r) => r.item === i);
    return { host: i.pluginId, status: res && res.status === 'current' ? 'current' : 'failed' };
  });
  const moved = out.results.filter((r) => r.status === 'current').length;
  const failed = out.results.filter((r) => r.status !== 'current').length;
  const skipped = present.filter((i) => i.action === 'skip').length;
  const overall = lc.overallCurrent(receipts).overall;
  return `  ${present.length} family plugin(s) installed in Codex: ${moved} moved to the pin, `
    + `${present.length - moved - failed - skipped} already at it, ${skipped} left alone, ${failed} failed — overall ${overall}`;
}

module.exports = {
  HOST,
  codexHome,
  normalizeSource,
  familyUrl,
  readMarketplaces,
  parsePluginList,
  splitPluginId,
  planRefresh,
  refreshCommands,
  rollbackCommands,
  refreshOne,
  refreshAll,
  resultLines,
  summaryLine,
};
