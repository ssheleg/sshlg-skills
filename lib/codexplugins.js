'use strict';
/**
 * Native Codex catalog inspection. Updating the 0.162.1 plugin store prunes old
 * versions, including paths retained by active threads. No supported global
 * generation-retirement barrier has been verified. A version-changing request
 * therefore defers before mutation. A future supported adapter needs explicit
 * retention/retirement evidence; neither time, process counts nor a CLI version
 * string grants permission. See docs/evidence/completion-1013/codex-cache-preservation.md.
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
 * paths, say) is left alone; this inspector does not interpret unsupported table settings.
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
 *   - `refresh` — a requested transition, deferred before native mutation.
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

const DEFER_REASON = 'Codex native installation can delete payload paths retained by active sessions; '
  + 'a supported generation-retention or all-consumer retirement barrier has not been verified';

/** No destructive command is admitted by this implementation, including previews. */
function refreshCommands() { return []; }

function firstLine(r) {
  const t = `${(r && r.stderr) || ''}\n${(r && r.stdout) || ''}`.split(/\r?\n/)
    .map((l) => l.trim()).find(Boolean);
  if (t) return t;
  if (r && r.error) return r.error.message || String(r.error);
  return `exit ${r ? r.status : '?'}`;
}

function ok(r) { return !!r && !r.error && !r.signal && r.status === 0; }

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

/** A direct caller cannot bypass the same admission boundary used by refreshAll. */
function refreshOne(item) {
  return { item, status: 'deferred', code: 'DEFERRED_ACTIVE_GENERATION_SAFETY',
    detail: DEFER_REASON, catalogVersion: item.from, threadLoadedVersion: 'unknown' };
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
  return { status: 'ran', runtime: (/^codex-cli [0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?$/m.exec(String(v.stdout || '')) || ['unknown'])[0], items, results };
}

/** Log lines for the deferred result, in the update log's style. */
function resultLines(res) {
  const it = res.item;
  if (res.status === 'current') {
    return [`  ${it.pluginId}: ${it.from} → ${res.receipt.digest} — current (read back from codex plugin list)`];
  }
  if (res.status === 'deferred') return [`  ${it.pluginId}: ${res.code} — ${res.detail}`];
  return [`  ${it.pluginId}: FAILED ${res.step || 'inspection'} — ${res.detail}`];
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
  const deferred = out.results.filter((r) => r.status === 'deferred').length;
  const failed = out.results.filter((r) => !['current', 'deferred'].includes(r.status)).length;
  const skipped = present.filter((i) => i.action === 'skip').length;
  const overall = lc.overallCurrent(receipts).overall;
  return `  ${present.length} family plugin(s) installed in Codex: ${moved} moved to the pin, `
    + `${present.length - moved - failed - skipped - deferred} already at it in the native catalog, ${skipped} left alone, ${deferred} deferred, ${failed} failed — overall ${overall}; thread-loaded generations unknown`;
}

module.exports = {
  HOST,
  DEFER_REASON,
  codexHome,
  normalizeSource,
  familyUrl,
  readMarketplaces,
  parsePluginList,
  splitPluginId,
  planRefresh,
  refreshCommands,
  refreshOne,
  refreshAll,
  resultLines,
  summaryLine,
};
