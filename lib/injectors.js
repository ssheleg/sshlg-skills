'use strict';
/**
 * Which enabled plugins speak at `SessionStart` — the check, separated from the walk.
 *
 * The routing block already carries the paragraph saying another pack's always-on
 * mandate does not outrank the family's map. Nothing on this machine could tell you
 * whether such a pack was **enabled**, and the one time it mattered the answer took a
 * hand-written Python one-liner: `superpowers` printed 854 tokens of
 * `using-superpowers` into every session and outcompeted the routing in live sessions,
 * and Claude Code has no per-hook disable for a plugin's hooks — turning the plugin off
 * is the whole remedy.
 *
 * **What this module does NOT claim.** It cannot tell doctrine from state. Of the three
 * injectors enabled here, `agent-sync`, `claude-mem` and `warp` all print their own
 * state rather than competing instructions, and no machine can sort those two apart.
 * So this reports *what injects*, never *what competes*, and it says so — a list
 * presented as a list of offenders would be a judgment about other people's packs,
 * dressed as a measurement.
 *
 * **Why one line and not a report.** The session block this joins is ~90 tokens on
 * purpose; it exists because a pack that prints its whole doctrine every session is the
 * cost this family measured elsewhere and removed. Naming three plugins and three file
 * paths every session would re-commit that mistake in miniature, and a notice that
 * arrives every turn is how an operator learns to switch a hook off. The detail lives
 * behind `sshlg-skills injectors`, which also gives the check somewhere to be **watched
 * working on a machine where nothing competes** — a guard whose output nobody has ever
 * seen is indistinguishable from one that is broken.
 *
 * Pure. Reading `settings.json` and each plugin's `hooks.json` belongs to the caller.
 */

/** The event whose timing is the whole problem: it lands before the first prompt. */
const EVENT = 'SessionStart';

/**
 * `enabled` is the list of enabled plugin specs (`name@marketplace`).
 * `hooksByPlugin` maps a spec to `{path, events}` — what its `hooks.json` declares.
 *
 * Returns one row per plugin that speaks at `SessionStart`, sorted, so two runs over
 * the same machine produce the same answer and a difference between them means
 * something. An entry that could not be read contributes nothing: a registry this
 * module cannot parse yields no claim rather than a wrong one.
 */
function injectors(enabled, hooksByPlugin) {
  const specs = Array.isArray(enabled) ? enabled : [];
  const map = hooksByPlugin instanceof Map
    ? hooksByPlugin
    : new Map(Object.entries(hooksByPlugin || {}));
  return specs
    .filter((spec) => {
      const entry = map.get(spec);
      return !!entry && Array.isArray(entry.events) && entry.events.includes(EVENT);
    })
    .sort()
    .map((spec) => ({ spec, hooksPath: (map.get(spec) || {}).path || null }));
}

/**
 * The one line for the session block, or `''` when nothing else injects.
 *
 * Empty means silent. "No other pack injects" is a sentence nobody needs every
 * session, and printing it would make the useful case harder to notice.
 */
function line(rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return '';
  const names = list.map((r) => r.spec.split('@')[0]).join(', ');
  return `[sshlg-skills] Also speaking at SessionStart: ${names}. `
       + 'Enablement in settings.json is the only switch a plugin hook has — '
       + '`npx sshlg-skills injectors` names the files.';
}

/**
 * The full account, for the operator who asked. Always prints something, including on
 * a machine where nothing competes, because a check with no visible output on the only
 * machine that runs it is a check nobody has watched work.
 */
function report(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const out = [`Enabled plugins with a ${EVENT} hook`];
  if (!list.length) {
    out.push('  none — this pack is the only thing speaking before your first prompt.');
  } else {
    for (const r of list) {
      out.push(`  ${r.spec}`);
      out.push(`    ${r.hooksPath || '(hooks.json path unresolved)'}`);
    }
  }
  out.push('');
  out.push('This lists what INJECTS, not what competes: a plugin printing its own');
  out.push('state and one printing instructions that outrank yours look identical');
  out.push('from here, and sorting them out is yours to do. Claude Code has no');
  out.push('per-hook disable for a plugin hook — the switch is the plugin itself,');
  out.push('in `enabledPlugins`.');
  return out.join('\n');
}

/**
 * `[enabledSpecs, hooksByPlugin]` read off a real machine — the ONE impure function
 * here, and it lives beside the pure ones because two callers need the identical walk.
 * The hook and `sshlg-skills injectors` had a copy each for about ten minutes, which is
 * a second home for one fact and the thing this repository refuses everywhere else.
 *
 * A plugin's hooks live at
 * `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/hooks/hooks.json`. The
 * version segment is DISCOVERED, never assumed: pinning it would silently stop finding
 * a plugin the day it updates, and a check that quietly finds nothing is the failure
 * mode this whole module exists to avoid. Anything unreadable is absent from the map,
 * so the decision makes no claim rather than a wrong one.
 */
function readRegistry(home) {
  const fs = require('fs');
  const path = require('path');
  const enabled = [];
  const map = {};
  const settings = JSON.parse(
    fs.readFileSync(path.join(home, '.claude', 'settings.json'), 'utf8'));
  // Which version RUNS. Absent or unreadable → null, and the order below falls back to
  // newest-first rather than to a wrong claim.
  let installed = null;
  try {
    installed = JSON.parse(
      fs.readFileSync(path.join(home, '.claude', 'plugins', 'installed_plugins.json'), 'utf8'));
  } catch (e) { installed = null; }
  for (const [spec, on] of Object.entries(settings.enabledPlugins || {})) {
    if (!on) continue;
    enabled.push(spec);
    const [name, marketplace] = spec.split('@');
    const base = path.join(home, '.claude', 'plugins', 'cache',
                           marketplace || '', name || '');
    let versions = [];
    try { versions = fs.readdirSync(base); } catch (e) { continue; }
    // The cache keeps every version ever installed, and `readdirSync` returns them in
    // directory order — which on this machine put `1.18.6` before `1.20.0` and made this
    // command cite a hooks.json two releases stale (2026-09-13, FIX-HK-03). The version
    // that RUNS is the one `installed_plugins.json` names; the others are history.
    for (const v of orderVersions(versions, installedVersion(installed, spec))) {
      const hooksPath = path.join(base, v, 'hooks', 'hooks.json');
      try {
        const declared = JSON.parse(fs.readFileSync(hooksPath, 'utf8')).hooks || {};
        map[spec] = { path: hooksPath, events: Object.keys(declared) };
        break;
      } catch (e) { /* this version ships no hooks.json, or it is unreadable */ }
    }
  }
  return [enabled, map];
}

/**
 * The version `installed_plugins.json` records for `spec`, or `null` when the registry
 * is absent, unreadable or silent about it — never a guess. `installed` is the parsed
 * registry (`{plugins: {spec: [{version, installPath, …}]}}`) or `null`.
 */
function installedVersion(installed, spec) {
  const recs = installed && installed.plugins && installed.plugins[spec];
  if (!Array.isArray(recs)) return null;
  for (const r of recs) {
    if (r && typeof r.version === 'string' && r.version) return r.version;
    if (r && typeof r.installPath === 'string' && r.installPath) {
      const tail = r.installPath.replace(/[\\/]+$/, '').split(/[\\/]/).pop();
      if (tail) return tail;
    }
  }
  return null;
}

/**
 * Cache version directories in the order they should be consulted: the installed one
 * first when it is present, then the rest newest-first by semver, so a registry that
 * names nothing still lands on the newest rather than on whatever the directory
 * listing happened to yield. Pure; unknown shapes sort after real versions.
 */
function orderVersions(versions, preferred) {
  const list = Array.isArray(versions) ? versions.filter((v) => typeof v === 'string') : [];
  const parse = (v) => {
    const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v);
    return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
  };
  const cmp = (a, b) => {
    const pa = parse(a); const pb = parse(b);
    if (pa && pb) {
      for (let i = 0; i < 3; i += 1) if (pa[i] !== pb[i]) return pb[i] - pa[i];
      return a < b ? -1 : a > b ? 1 : 0;
    }
    if (pa) return -1;
    if (pb) return 1;
    return a < b ? -1 : a > b ? 1 : 0;
  };
  const rest = list.filter((v) => v !== preferred).sort(cmp);
  return preferred && list.includes(preferred) ? [preferred].concat(rest) : rest;
}

// --- MCP server instructions -------------------------------------------------------
//
// A plugin hook is not the only thing that speaks before the first prompt. Every MCP
// server may return `instructions` at `initialize`, and Claude Code puts them in the
// system prompt of every session — where they carry routing language of their own. The
// 2026-10-08 audit read Figma's: "Use this server whenever the user wants to create … any
// design, UI, screen … even if Figma isn't named". That is a second entry point declared
// by a server, and nothing here could see it.
//
// **Where the text is, and where it is not.** A config file declares a server; it does
// not hold what the server says — that arrives over the wire at `initialize`. So this
// reads two things, both read-only: the DECLARATIONS (`~/.claude.json`, global and every
// project scope, and each enabled plugin's `.mcp.json`), and the text Claude Code
// RECORDED as delivered — the `mcp_instructions_delta` entries of the newest session
// transcript. It never starts a server and never opens a socket: asking a server for its
// instructions would mean running other people's code with this machine's credentials.
// A declared server with no delivered record is reported as NOT READ, never as clean.

/**
 * Phrases that claim ground rather than describe a tool. Each is a CANDIDATE: a server
 * saying "whenever" may be right to, and sorting that out is the operator's. Kept short
 * and literal for the reason `conflicts.js` keeps its lexicon short — a pattern that
 * matches every sentence is noise within a day.
 */
const ROUTING_LANGUAGE = [
  { label: 'whenever', re: /\bwhenever\b/i },
  { label: 'MANDATORY', re: /\bMANDATORY\b/ },
  { label: "even if … isn't named", re: /\beven (?:if|when)\b[^.\n]{0,60}?\b(?:isn['’]t|is not|aren['’]t|are not|not)\s+(?:named|mentioned)\b/i },
  { label: 'use this server for any', re: /\buse (?:this|the) (?:server|tool|mcp)s?\b[^.\n]{0,30}?\b(?:for|on|in) (?:any|all|every)\b/i },
  { label: 'always use', re: /\balways use\b/i },
  { label: 'prefer this over', re: /\bprefer (?:this|it) over\b/i },
];

/** `[{label, excerpt}]` for every routing phrase in `text`. Pure. */
function routingPhrases(text) {
  const t = String(text || '');
  const out = [];
  for (const { label, re } of ROUTING_LANGUAGE) {
    const m = re.exec(t);
    if (!m) continue;
    const from = Math.max(0, m.index - 40);
    const to = Math.min(t.length, m.index + m[0].length + 40);
    const body = t.slice(from, to).replace(/\s+/g, ' ').trim();
    out.push({ label, excerpt: `${from ? '…' : ''}${body}${to < t.length ? '…' : ''}` });
  }
  return out;
}

/**
 * Replay `mcp_instructions_delta` attachments, in order, into `name -> text`. Pure.
 * A delta adds blocks (`addedNames[i]` ↔ `addedBlocks[i]`) and removes names; the last
 * word wins, which is what the session that wrote them was running with.
 */
function replayDeltas(deltas) {
  const map = new Map();
  for (const d of deltas || []) {
    if (!d || typeof d !== 'object') continue;
    for (const n of Array.isArray(d.removedNames) ? d.removedNames : []) map.delete(n);
    const names = Array.isArray(d.addedNames) ? d.addedNames : [];
    const blocks = Array.isArray(d.addedBlocks) ? d.addedBlocks : [];
    names.forEach((n, i) => {
      if (typeof n !== 'string') return;
      // a block opens with its own `## <name>` heading; the heading is not the text
      map.set(n, String(blocks[i] || '').replace(/^##[^\n]*\n/, ''));
    });
  }
  return map;
}

/**
 * The account. `servers` is `[{name, scope, instructions?}]` (declared), `delivered` a
 * Map from `replayDeltas`. One row per server whose text carries routing language;
 * counts for everything else, so "no rows" can never be read as "nothing was read".
 */
function mcpFindings(servers, delivered) {
  const declared = Array.isArray(servers) ? servers : [];
  const got = delivered instanceof Map ? delivered : new Map();
  const scopes = new Map();
  for (const s of declared) {
    if (!s || !s.name) continue;
    if (!scopes.has(s.name)) scopes.set(s.name, []);
    scopes.get(s.name).push(s.scope);
  }
  const names = [...new Set([...scopes.keys(), ...got.keys()])].sort();
  const rows = [];
  const notRead = [];
  let read = 0;
  for (const name of names) {
    const own = declared.find((s) => s && s.name === name && typeof s.instructions === 'string');
    let text = null;
    if (got.has(name)) text = got.get(name);
    else if (own) text = own.instructions;
    if (text === null) { notRead.push(name); continue; }
    read += 1;
    const phrases = routingPhrases(text);
    if (phrases.length) {
      rows.push({ name, scopes: scopes.get(name) || ['not declared in a file read here'],
                  source: got.has(name) ? 'delivered' : 'declared', phrases });
    }
  }
  return { rows, read, notRead, declared: scopes.size };
}

/** The MCP half of `sshlg-skills injectors`. Always prints, including the counts. */
function mcpReport(found, opts) {
  const f = found || { rows: [], read: 0, notRead: [], declared: 0 };
  const o = opts || {};
  const out = ['MCP servers whose instructions carry routing language'];
  if (!f.rows.length) out.push('  none among the instructions read here.');
  for (const r of f.rows) {
    out.push(`  ${r.name}  (${r.scopes.join('; ')})`);
    for (const p of r.phrases) out.push(`    "${p.label}" — ${p.excerpt}`);
  }
  out.push('');
  const unread = f.notRead.length ? ` (${f.notRead.join(', ')})` : '';
  out.push(`  ${f.declared} server(s) declared in the files read; instructions read for `
    + `${f.read}; ${f.notRead.length} not read${unread}.`);
  out.push(o.transcript
    ? `  Delivered text read from ${o.transcript}.`
    : '  No session transcript recorded delivered instructions, so only declared text was read.');
  out.push('');
  out.push('These are CANDIDATES, not offenders. A server\'s instructions arrive at');
  out.push('`initialize` and live in no config file, so this reads what Claude Code');
  out.push('RECORDED as delivered, read-only, and starts nothing. A server that is not');
  out.push('read is not clean — it is unknown. The routing block still decides the');
  out.push('route; a server saying "whenever" is a tool the router may reach for.');
  return out.join('\n');
}

/**
 * The impure half: declarations, and the newest transcript's delivered text.
 *
 * Read-only by construction — `openSync(…, 'r')`, `readFileSync`, `readdirSync`,
 * `statSync` and nothing else — and `test/injectors_test.js` holds it to that by
 * hashing a fixture HOME before and after. The transcript is streamed and only lines
 * carrying the delta marker are parsed; every other line of the operator's sessions is
 * skipped, and only server-authored instruction text leaves this function.
 */
const DELTA = 'mcp_instructions_delta';
const SCAN_CAP = 256 * 1024 * 1024;

function readJsonOr(fs, file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) || fallback; } catch (e) { return fallback; }
}

function readMcp(home) {
  const fs = require('fs');
  const path = require('path');
  const servers = [];
  const add = (name, scope, entry) => {
    if (!name) return;
    const row = { name, scope };
    if (entry && typeof entry.instructions === 'string') row.instructions = entry.instructions;
    servers.push(row);
  };
  const claudeJson = readJsonOr(fs, path.join(home, '.claude.json'), {});
  for (const [n, e] of Object.entries(claudeJson.mcpServers || {})) add(n, 'global ~/.claude.json', e);
  for (const [proj, pv] of Object.entries(claudeJson.projects || {})) {
    for (const [n, e] of Object.entries((pv && pv.mcpServers) || {})) add(n, `project ${proj}`, e);
  }

  // Enabled plugins' `.mcp.json`, at the version that RUNS — the ordering rule
  // `readRegistry` above uses, for the same reason.
  const settings = readJsonOr(fs, path.join(home, '.claude', 'settings.json'), {});
  const installed = readJsonOr(fs, path.join(home, '.claude', 'plugins', 'installed_plugins.json'), null);
  for (const [spec, on] of Object.entries(settings.enabledPlugins || {})) {
    if (!on) continue;
    const [name, marketplace] = spec.split('@');
    const base = path.join(home, '.claude', 'plugins', 'cache', marketplace || '', name || '');
    let versions = [];
    try { versions = fs.readdirSync(base); } catch (e) { continue; }
    for (const v of orderVersions(versions, installedVersion(installed, spec))) {
      const decl = readJsonOr(fs, path.join(base, v, '.mcp.json'), null);
      if (!decl) continue;
      const table = decl.mcpServers || decl;
      for (const [n, e] of Object.entries(table)) {
        if (e && typeof e === 'object') add(`plugin:${name}:${n}`, `plugin ${spec}`, e);
      }
      break;
    }
  }

  const transcript = newestTranscript(fs, path, path.join(home, '.claude', 'projects'));
  const deltas = [];
  if (transcript) {
    try {
      scanLines(fs, transcript, DELTA, (text) => {
        try {
          const rec = JSON.parse(text);
          if (rec && rec.attachment && rec.attachment.type === DELTA) deltas.push(rec.attachment);
        } catch (e) { /* a line that is not one record is not a delta */ }
      });
    } catch (e) { deltas.length = 0; }
  }
  return { servers, delivered: replayDeltas(deltas), transcript: deltas.length ? transcript : null };
}

/** The most recently written session transcript — the session that last started here. */
function newestTranscript(fs, path, projects) {
  let best = null;
  let newest = -1;
  let dirs = [];
  try { dirs = fs.readdirSync(projects); } catch (e) { return null; }
  for (const d of dirs) {
    let files = [];
    try { files = fs.readdirSync(path.join(projects, d)); } catch (e) { continue; }
    for (const f of files) {
      if (!f.endsWith('.jsonl')) continue;
      const file = path.join(projects, d, f);
      try {
        const m = fs.statSync(file).mtimeMs;
        if (m > newest) { newest = m; best = file; }
      } catch (e) { /* vanished between the listing and the stat */ }
    }
  }
  return best;
}

/** Stream `file`, handing every line containing `marker` to `onLine`. Read-only. */
function scanLines(fs, file, marker, onLine) {
  const { StringDecoder } = require('string_decoder');
  const decoder = new StringDecoder('utf8');
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(1 << 20);
  let rest = '';
  let pos = 0;
  try {
    while (pos < SCAN_CAP) {
      const n = fs.readSync(fd, buf, 0, buf.length, pos);
      if (!n) break;
      pos += n;
      const parts = (rest + decoder.write(buf.subarray(0, n))).split('\n');
      rest = parts.pop();
      for (const l of parts) if (l.includes(marker)) onLine(l);
    }
    rest += decoder.end();
    if (rest.includes(marker)) onLine(rest);
  } finally {
    fs.closeSync(fd);
  }
}

module.exports = {
  injectors, line, report, readRegistry, installedVersion, orderVersions, EVENT,
  routingPhrases, replayDeltas, mcpFindings, mcpReport, readMcp, ROUTING_LANGUAGE,
};
