'use strict';
/**
 * Global instruction files beyond `apply.TARGETS` (B-206).
 *
 * `apply.TARGETS` holds the hosts whose file the hub has written since 1.57 (Claude,
 * Codex, Gemini, Pi) and that every other module (wait rules, catalogue, visibility)
 * also iterates. The hosts here get the routing block and nothing else, so they live in
 * their own list: adding them to TARGETS would also hand them the wait rule and the
 * skill-root scans, which is a different decision with its own row.
 *
 * Each row is one of three kinds, decided per host with the source that says why:
 *  - `full`     the whole routing block, written by `apply.applyOne` (same sentinels,
 *               consent, backup and B-202 hand-edit guard as the TARGETS files);
 *  - `compact`  a host that caps its global rules file: the map, the protocol and the
 *               router table without the per-router sections, refused (never cut) when
 *               the file would cross the cap;
 *  - reported   (`REPORTED`) a host the hub reaches another way or must not write for;
 *               `hosts` and `context` name it with the exact manual step.
 *
 * A host is PRESENT only on evidence the hub did not create itself. The skills CLI makes
 * `<home>/skills` for every agent in its list (skills.json `defaultAgents` names
 * windsurf, kiro-cli and goose), so a home holding only `skills/` proves nothing:
 * measured 2026-10-27 on the operator's machine, `~/.qwen`, `~/.factory`,
 * `~/.codeium/windsurf` and `~/.copilot` hold exactly that and no host. A row with
 * `needsDir` also requires the file's own directory, which is never created (the
 * Cursor rule: the directory is how the host says it is installed).
 */

const fs = require('fs');
const path = require('path');

/** Entries a host home may hold that the hub, the skills CLI or Finder put there. */
const NOT_EVIDENCE = new Set(['skills', '.DS_Store']);

function meaningful(dir) {
  let names;
  try { names = fs.readdirSync(dir); } catch (e) { return false; }
  return names.some((n) => !NOT_EVIDENCE.has(n));
}

/** An executable on PATH, read from the directory listing: nothing is spawned. */
function onPath(bin, env) {
  const dirs = String((env && env.PATH) || '').split(path.delimiter).filter(Boolean);
  for (const d of dirs) {
    const f = path.join(d, bin);
    try {
      const st = fs.statSync(f);
      if (st.isFile() && (st.mode & 0o111)) return f;
    } catch (e) { /* not here */ }
  }
  return null;
}

const xdg = (home, env) => (env && env.XDG_CONFIG_HOME) || path.join(home, '.config');

/**
 * The hosts this module knows, with where each one's home is and which binary proves
 * it. `homes` returns candidate directories; the first meaningful one counts.
 */
const HOSTS = {
  kimi: { homes: (h, e) => [e.KIMI_CODE_HOME, path.join(h, '.kimi-code'), path.join(h, '.kimi')], bins: ['kimi'] },
  goose: { homes: (h, e) => [path.join(xdg(h, e), 'goose')], bins: ['goose'] },
  warp: { homes: (h) => [path.join(h, '.warp')], bins: ['warp'] },
  droid: { homes: (h) => [path.join(h, '.factory')], bins: ['droid'] },
  zcode: { homes: (h) => [path.join(h, '.zcode')], bins: ['zcode'] },
  qwen: { homes: (h, e) => [e.QWEN_HOME, path.join(h, '.qwen')], bins: ['qwen'] },
  kiro: { homes: (h) => [path.join(h, '.kiro')], bins: ['kiro', 'kiro-cli'] },
  windsurf: { homes: (h) => [path.join(h, '.codeium', 'windsurf')], bins: ['windsurf'] },
  hermes: { homes: (h, e) => [e.HERMES_HOME, path.join(h, '.hermes')], bins: ['hermes'] },
  opencode: { homes: (h, e) => [path.join(xdg(h, e), 'opencode')], bins: ['opencode'] },
  // VS Code Copilot Chat: the extension directory is the evidence, not `~/.copilot`
  // (the skills CLI makes that one).
  copilot: {
    homes: () => [],
    bins: [],
    probe: (h) => {
      try { return fs.readdirSync(path.join(h, '.vscode', 'extensions')).some((n) => /^github\.copilot-chat-/.test(n)); }
      catch (e) { return false; }
    },
  },
};

/** { present, via } for one host id. `opts.which(bin)` replaces the PATH scan in tests. */
function presence(id, home, opts) {
  const o = opts || {};
  const env = o.env || process.env;
  const host = HOSTS[id];
  if (!host) return { present: false, via: [] };
  const via = [];
  for (const d of host.homes(home, env).filter(Boolean)) if (meaningful(d)) { via.push(d); break; }
  const which = o.which || ((b) => onPath(b, env));
  for (const b of host.bins) { const w = which(b); if (w) { via.push(typeof w === 'string' ? w : b); break; } }
  if (host.probe && host.probe(home)) via.push('extension');
  return { present: via.length > 0, via };
}

/**
 * Written targets. `ids` are the names `--agent` accepts for the row (the hub's short
 * name and the skills CLI id). `source` is where the path, and the cap, come from.
 */
const EXTRA_TARGETS = [
  {
    agent: 'agents', ids: ['agents', 'kimi', 'kimi-code-cli', 'goose', 'warp', 'droid'],
    file: (h) => path.join(h, '.agents', 'AGENTS.md'), render: 'full', shared: true,
    serves: ['kimi', 'goose', 'warp', 'droid'],
    source: 'Kimi 2.3.1 loader (binary: ~/.kimi-code/AGENTS.md then ~/.agents/AGENTS.md, 32 KiB load warning); '
      + 'Goose load_hints.rs@v1.44.0:13-24,231-241; Warp global_rules.rs and Droid docs.factory.com/cli/configuration/agents-md '
      + '(compatibility report 2026-10-16, KIMI-1, GOOSE-1, WARP-1)',
  },
  {
    agent: 'zcode', ids: ['zcode'], file: (h) => path.join(h, '.zcode', 'AGENTS.md'), render: 'full', host: 'zcode',
    source: 'ZCode 3.14.4 app.asar getUserZcodeAgentsFilePath() = join(homedir(), ".zcode", "AGENTS.md") (read 2026-10-27); ZCODE-1',
    // B-282: printed by `hosts` beside the row.
    note: 'ZCode onboarding offers to migrate ~/.claude/CLAUDE.md into ~/.zcode/AGENTS.md, overwriting it; '
      + 'after the hub has written there, that duplicates or replaces the routing block. '
      + 'Decline the migration, or run `npx sshlg-skills update` after it.',
  },
  {
    agent: 'qwen', ids: ['qwen', 'qwen-code'], host: 'qwen', render: 'full',
    file: (h, e) => path.join(e.QWEN_HOME || path.join(h, '.qwen'), 'QWEN.md'),
    source: 'qwenlm.github.io/qwen-code-docs/en/users/features/memory/ (global ~/.qwen/QWEN.md, read 2026-10-27); QWEN-1',
  },
  {
    agent: 'kiro', ids: ['kiro', 'kiro-cli'], host: 'kiro', render: 'full', needsDir: true,
    file: (h) => path.join(h, '.kiro', 'steering', 'sshlg-routing.md'),
    // B-283: the file name is the hub's own (like Cursor's sshlg-routing.mdc), so the hub
    // created it; uninstall deletes it when nothing but the block was in it.
    ownFile: true,
    // No front matter: "Always included (default)" is Kiro's documented default mode.
    source: 'kiro.dev/docs/steering/ (global ~/.kiro/steering/, inclusion "always" by default, read 2026-10-27); KIRO-2',
  },
  {
    agent: 'windsurf', ids: ['windsurf'], host: 'windsurf', render: 'compact', cap: 6000, needsDir: true,
    file: (h) => path.join(h, '.codeium', 'windsurf', 'memories', 'global_rules.md'),
    source: 'docs.devin.ai/desktop/cascade/memories ("Limited to 6,000 characters", read 2026-10-27); WINDSURF-1',
  },
];

/** The cap of a Hermes plugin's system-prompt sections, for the compact-form test (HERMES-1). */
const HERMES_PLUGIN_CAP = 8000;

/**
 * Hosts the hub names but does not write for, each with the reason and the manual step.
 * `file` is the host's own global file, measured by `context`.
 */
const REPORTED = [
  {
    agent: 'kimi', file: (h, e) => path.join(e.KIMI_CODE_HOME || path.join(h, '.kimi-code'), 'AGENTS.md'), servedBy: 'agents',
    why: 'Kimi 2.3.1 loads this file AND ~/.agents/AGENTS.md; the block lives in the shared file so Kimi does not read it twice.',
  },
  { agent: 'goose', file: (h, e) => path.join(xdg(h, e), 'goose', '.goosehints'), servedBy: 'agents',
    why: 'Goose 1.44 also loads ~/.agents/AGENTS.md (load_hints.rs:231-241); one block serves it there.' },
  { agent: 'warp', file: null, servedBy: 'agents', why: 'Warp reads ~/.agents/AGENTS.md as its global rule file (WARP-1).' },
  { agent: 'droid', file: (h) => path.join(h, '.factory', 'AGENTS.md'), servedBy: 'agents',
    why: 'Droid reads personal instructions from ~/.factory/ and ~/.agents/ (docs.factory.com/cli/configuration/agents-md); the shared file serves it.' },
  {
    agent: 'hermes', file: (h, e) => path.join(e.HERMES_HOME || path.join(h, '.hermes'), 'SOUL.md'), cap: HERMES_PLUGIN_CAP,
    why: 'Hermes has no global instruction file: SOUL.md "controls the agent\'s personality, tone, and communication style" '
      + '(hermes-agent.nousresearch.com/docs/user-guide/features/context-files). A routing block there would rewrite its persona.',
    manual: 'Not written. To give Hermes the routing map, register it as a plugin system-prompt section (8,000 characters in total) '
      + 'holding the compact block; until then Hermes sessions run without the family routing.',
  },
  {
    agent: 'opencode', file: (h, e) => path.join(xdg(h, e), 'opencode', 'AGENTS.md'), fallback: (h) => path.join(h, '.claude', 'CLAUDE.md'),
    why: 'OpenCode 1.x reads ~/.claude/CLAUDE.md only while ~/.config/opencode/AGENTS.md does not exist (opencode.ai/docs/rules/); '
      + 'OpenCode 2 drops that fallback (opencode.ai/v2/docs/instructions).',
  },
  {
    agent: 'copilot', file: null, fallback: (h) => path.join(h, '.claude', 'CLAUDE.md'),
    why: 'VS Code Copilot Chat loads ~/.claude/CLAUDE.md by default (setting chat.useClaudeMdFile; COPILOT-1); '
      + 'it receives the Claude-worded block from there.',
  },
];

function envOf(opts) { return (opts && opts.env) || process.env; }

/** The file a written target resolves to on this machine. */
function fileOf(t, home, opts) { return t.file(home, envOf(opts)); }

/** Present when the host is (or, for the shared file, any host it serves is). */
function targetPresence(t, home, opts) {
  if (t.needsDir && !fs.existsSync(path.dirname(fileOf(t, home, opts)))) {
    return { present: false, via: [], why: `${path.dirname(fileOf(t, home, opts))} does not exist (never created by the hub)` };
  }
  if (t.shared) {
    const via = [];
    for (const id of t.serves) if (presence(id, home, opts).present) via.push(id);
    if (!via.length) return { present: false, via, why: `none of ${t.serves.join(', ')} is installed` };
    if (!fs.existsSync(path.dirname(fileOf(t, home, opts)))) {
      return { present: false, via, why: `${path.dirname(fileOf(t, home, opts))} does not exist` };
    }
    return { present: true, via };
  }
  const p = presence(t.host, home, opts);
  return p.present ? p : { present: false, via: [], why: `${t.host} is not installed (no home beyond skills/, no binary on PATH)` };
}

/** Rows a `--agent` list / `--claude-only` selects; unscoped selects them all. */
function select(f) {
  const flags = f || {};
  if (flags.claudeOnly) return [];
  const selected = flags.agents && flags.agents.length ? new Set(flags.agents) : null;
  if (!selected) return EXTRA_TARGETS.slice();
  return EXTRA_TARGETS.filter((t) => t.ids.some((id) => selected.has(id)));
}

/**
 * What `hosts` and `context` say about every row, written or reported. Read-only.
 */
function describe(home, opts) {
  const env = envOf(opts);
  const out = [];
  for (const t of EXTRA_TARGETS) {
    const p = targetPresence(t, home, opts);
    out.push({ agent: t.agent, kind: t.render, file: fileOf(t, home, opts), cap: t.cap || null, present: p.present, via: p.via, why: p.why || null, source: t.source, serves: t.serves || null, note: t.note || null });
  }
  for (const r of REPORTED) {
    const p = presence(r.agent, home, opts);
    const row = { agent: r.agent, kind: 'reported', file: r.file ? r.file(home, env) : null, cap: r.cap || null, present: p.present, via: p.via, why: r.why, servedBy: r.servedBy || null, manual: r.manual || null };
    if (r.fallback) {
      row.fallback = r.fallback(home);
      // OpenCode stops reading the fallback the moment its own file exists.
      row.fallbackActive = !(row.file && fs.existsSync(row.file));
    }
    out.push(row);
  }
  return out;
}

/**
 * B-283: what uninstall does with one target file's text. `none` when it holds no block;
 * `delete` when the row's file is the hub's own (`ownFile`) and only whitespace is left
 * once the block is out; otherwise `write` the rest back. Pure: the caller backs up first.
 */
function afterRemoval(t, text) {
  const res = require('./routers.js').removeBlock(text);
  if (!res.removed) return { action: 'none', text };
  if (t && t.ownFile && res.text.trim() === '') return { action: 'delete', text: '' };
  return { action: 'write', text: res.text };
}

module.exports = { EXTRA_TARGETS, REPORTED, HOSTS, HERMES_PLUGIN_CAP, presence, targetPresence, fileOf, select, describe, meaningful, onPath, afterRemoval };
