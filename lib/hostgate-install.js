'use strict';
/**
 * Where the family guard is wired for the hosts of lib/hostgate.js (B-280), and how.
 *
 * - gemini: one entry in `hooks.BeforeTool` of `<GEMINI_CLI_HOME or home>/.gemini/settings.json`,
 *   planned by lib/hooks.js like Claude's and Codex's files (others' hooks kept, ours in place).
 * - kimi: a marked `[[hooks]]` block at the end of `<KIMI_CODE_HOME or ~/.kimi-code>/config.toml`.
 * - hermes: a marked top-level `hooks:` block at the end of `<HERMES_HOME or ~/.hermes>/config.yaml`,
 *   only while the file has no `hooks:` of its own (then the entry to add by hand is named).
 * - pi: the hub's own extension `<PI_CODING_AGENT_DIR or ~/.pi/agent>/extensions/sshlg-skills-gate.js`.
 * - opencode: the hub's own plugin `<XDG_CONFIG_HOME or ~/.config>/opencode/plugins/sshlg-skills-gate.js`.
 *
 * A host whose home does not exist is not installed here and is never created. Every write
 * goes through `apply.protectedWrite` (backup first, compare before replace, read back);
 * removing an own file takes the same backup first. Pure planning (`plan`, `status`) is
 * separated from the writes (`install`, `remove`) so fixtures need no host.
 */

const fs = require('fs');
const path = require('path');

const BEGIN = '# BEGIN sshlg-skills gate (B-280): `npx sshlg-skills hooks install` rewrites this block';
const END = '# END sshlg-skills gate';
const FILE_HEADER = '// sshlg-skills managed gate (B-280). `npx sshlg-skills hooks install` rewrites this file; `hooks remove` deletes it.';
const HOSTS = ['gemini', 'kimi', 'hermes', 'pi', 'opencode'];

function envOf(o) { return (o && o.env) || process.env; }
function pick(env, name, fallback) { const v = env[name] && String(env[name]).trim(); return v || fallback; }

/** `{dir, file, kind}` per host; `dir` is the host's home, which must already exist. */
function where(host, home, env) {
  const e = env || {};
  if (host === 'gemini') { const dir = path.join(pick(e, 'GEMINI_CLI_HOME', home), '.gemini'); return { dir, file: path.join(dir, 'settings.json'), kind: 'json' }; }
  if (host === 'kimi') { const dir = pick(e, 'KIMI_CODE_HOME', path.join(home, '.kimi-code')); return { dir, file: path.join(dir, 'config.toml'), kind: 'block' }; }
  if (host === 'hermes') { const dir = pick(e, 'HERMES_HOME', path.join(home, '.hermes')); return { dir, file: path.join(dir, 'config.yaml'), kind: 'block' }; }
  if (host === 'pi') { const dir = pick(e, 'PI_CODING_AGENT_DIR', path.join(home, '.pi', 'agent')); return { dir, file: path.join(dir, 'extensions', 'sshlg-skills-gate.js'), kind: 'own' }; }
  if (host === 'opencode') { const dir = path.join(pick(e, 'XDG_CONFIG_HOME', path.join(home, '.config')), 'opencode'); return { dir, file: path.join(dir, 'plugins', 'sshlg-skills-gate.js'), kind: 'own' }; }
  throw new Error(`unknown host ${host}`);
}

function shellQuote(s) { return /^[A-Za-z0-9_@%+=:,./-]+$/.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`; }

/** The marked block a block host carries. */
function block(host, root) {
  const script = path.join(root, 'hooks', 'host-gate.js');
  if (host === 'kimi') {
    // Kimi's matcher is an unanchored regex; its hook entry schema is strict (four keys).
    return [BEGIN, '[[hooks]]', 'event = "PreToolUse"', `matcher = ${JSON.stringify('^(?:Bash|Read|Write|Edit|Grep|mcp__.+)$')}`,
      `command = ${JSON.stringify(`node ${shellQuote(script)} kimi`)}`, 'timeout = 10', END].join('\n');
  }
  // Hermes matches the whole tool name and splits the command without a shell. Its plugin
  // dispatcher blocks a call whose hook outlasts 30 s, so the timeout stays below that.
  return [BEGIN, 'hooks:', '  pre_tool_call:', '    - matcher: "terminal|read_file|write_file|patch|search_files"',
    `      command: ${JSON.stringify(`node ${shellQuote(script)} hermes`)}`, '      timeout: 20', END].join('\n');
}

/** The own file of pi or opencode. `node` is baked in: OpenCode runs plugins inside Bun. */
function ownFile(host, root, node) {
  const head = [FILE_HEADER, "import { createRequire } from 'node:module';",
    `const ROOT = ${JSON.stringify(root)};`, `const NODE = ${JSON.stringify(node)};`,
    'function gate() { try { return createRequire(import.meta.url)(ROOT + "/lib/hostgate.js"); } catch (_) { return null; } }', ''];
  if (host === 'pi') {
    return head.concat([
      '// Pi blocks a call whose handler throws, so every fault returns undefined (a pass).',
      'export default function (pi) {',
      '  const g = gate();',
      '  if (!g) return;',
      "  pi.on('tool_call', async (event, ctx) => {",
      '    try {',
      "      const payloads = g.toClaude('pi', { tool: event && event.toolName, input: event && event.input, cwd: ctx && ctx.cwd });",
      '      if (!payloads.length) return undefined;',
      '      const why = await g.judge(payloads, ROOT, { node: NODE });',
      '      return why ? { block: true, reason: why } : undefined;',
      '    } catch (_) { return undefined; }',
      '  });',
      '}', '']).join('\n');
  }
  return head.concat([
    '// OpenCode blocks only on a throw, and on any throw: only a refusal throws.',
    'export const SshlgSkillsGate = async (ctx) => {',
    '  const g = gate();',
    '  if (!g) return {};',
    '  const base = (ctx && (ctx.directory || ctx.worktree)) || process.cwd();',
    '  return {',
    "    'tool.execute.before': async (input, output) => {",
    '      let why = null;',
    '      try {',
    "        const payloads = g.toClaude('opencode', { tool: input && input.tool, input: output && output.args, cwd: base });",
    '        if (payloads.length) why = await g.judge(payloads, ROOT, { node: NODE });',
    '      } catch (_) { why = null; }',
    '      if (why) throw new Error(why);',
    '    },',
    '  };',
    '};', '']).join('\n');
}

/** Text without our block (and the blank line we put before it). */
function withoutBlock(text) {
  const i = text.indexOf(BEGIN);
  if (i < 0) return text;
  const j = text.indexOf(END, i);
  if (j < 0) return null; // a BEGIN without END: hand-edited, not ours to guess about
  let head = text.slice(0, i);
  let tail = text.slice(j + END.length);
  if (tail.startsWith('\n')) tail = tail.slice(1);
  if (head.endsWith('\n\n')) head = head.slice(0, -1);
  return head + tail;
}
function withBlock(text, body) {
  const base = text === null ? '' : text;
  const sep = base === '' ? '' : (base.endsWith('\n') ? '\n' : '\n\n');
  return `${base}${sep}${body}\n`;
}

function read(file) {
  try { return { text: fs.readFileSync(file, 'utf8') }; } catch (e) { return e.code === 'ENOENT' ? { text: null } : { error: e.code || e.message }; }
}

/**
 * What `install` would do for one host. Returns `{host, file, state, next?, reason?}` where
 * state is `absent-host` | `unreadable` | `conflict` | `current` | `install` | `update`.
 * `opts`: {home, env, root, node, read}.
 */
function plan(host, opts) {
  const o = opts || {};
  const w = where(host, o.home, envOf(o));
  const exists = o.exists || fs.existsSync;
  if (!exists(w.dir)) return { host, file: w.file, state: 'absent-host', reason: `${host} is not installed here (${w.dir})` };
  const cur = (o.read || read)(w.file);
  if (cur.error) return { host, file: w.file, state: 'unreadable', reason: cur.error };
  let next;
  let present = false;
  if (w.kind === 'json') {
    let current = {};
    if (cur.text !== null) {
      try { current = JSON.parse(cur.text); } catch (e) { return { host, file: w.file, state: 'unreadable', reason: `not JSON (${e.message})` }; }
    }
    const hooks = require('./hooks.js');
    present = hooks.consented(current, o.root);
    const p = hooks.plan(current, o.root, { host: 'gemini', refreshOnly: Boolean(o.refreshOnly) });
    if (!p.changed.length) return { host, file: w.file, state: present ? 'current' : (o.refreshOnly ? 'not-wired' : 'current'), text: cur.text };
    next = JSON.stringify(p.settings, null, 2) + '\n';
  } else if (w.kind === 'block') {
    const text = cur.text === null ? '' : cur.text;
    const rest = withoutBlock(text);
    if (rest === null) return { host, file: w.file, state: 'conflict', reason: `${w.file} has our BEGIN line without its END; fix it by hand` };
    present = rest !== text;
    if (o.refreshOnly && !present) return { host, file: w.file, state: 'not-wired' };
    if (host === 'hermes' && /^hooks\s*:/m.test(rest)) {
      return { host, file: w.file, state: 'conflict',
        reason: `${w.file} already has a hooks: key; add this under its pre_tool_call by hand:\n${block(host, o.root).split('\n').slice(3, -1).join('\n')}` };
    }
    next = withBlock(rest, block(host, o.root));
  } else {
    present = cur.text !== null;
    if (present && !cur.text.startsWith(FILE_HEADER)) return { host, file: w.file, state: 'conflict', reason: `${w.file} was not written by sshlg-skills; left as it is` };
    if (o.refreshOnly && !present) return { host, file: w.file, state: 'not-wired' };
    next = ownFile(host, o.root, o.node);
  }
  if (next === cur.text) return { host, file: w.file, state: 'current', text: cur.text };
  return { host, file: w.file, state: present ? 'update' : 'install', text: cur.text, next, kind: w.kind };
}

/** What `remove` would do: `{state: absent-host|not-wired|unreadable|conflict|remove, next?}`; next null deletes. */
function planRemoval(host, opts) {
  const o = opts || {};
  const w = where(host, o.home, envOf(o));
  if (!(o.exists || fs.existsSync)(w.dir)) return { host, file: w.file, state: 'absent-host' };
  const cur = (o.read || read)(w.file);
  if (cur.error) return { host, file: w.file, state: 'unreadable', reason: cur.error };
  if (cur.text === null) return { host, file: w.file, state: 'not-wired' };
  if (w.kind === 'json') {
    let current;
    try { current = JSON.parse(cur.text); } catch (e) { return { host, file: w.file, state: 'unreadable', reason: `not JSON (${e.message})` }; }
    const r = require('./hooks.js').removal(current, o.root, { host: 'gemini' });
    if (!r.changed.length) return { host, file: w.file, state: 'not-wired' };
    return { host, file: w.file, state: 'remove', text: cur.text, next: JSON.stringify(r.settings, null, 2) + '\n' };
  }
  if (w.kind === 'block') {
    const rest = withoutBlock(cur.text);
    if (rest === null) return { host, file: w.file, state: 'conflict', reason: 'our BEGIN line without its END; fix it by hand' };
    if (rest === cur.text) return { host, file: w.file, state: 'not-wired' };
    return { host, file: w.file, state: 'remove', text: cur.text, next: rest };
  }
  if (!cur.text.startsWith(FILE_HEADER)) return { host, file: w.file, state: 'not-wired' };
  return { host, file: w.file, state: 'remove', text: cur.text, next: null };
}

/** Write a planned change: `protectedWrite`, or for a deleted own file, backup then unlink. */
function write(p, opts) {
  const apply = require('./apply.js');
  if (p.next === null) {
    const saved = apply.protect(p.file, { home: opts.home });
    if (saved.action === 'backup-failed') return { ok: false, action: 'backup-failed', error: saved.error };
    if (read(p.file).text !== p.text) return { ok: false, action: 'changed' };
    fs.unlinkSync(p.file);
    return { ok: true, action: 'deleted', backup: saved.path || null };
  }
  if (p.kind === 'own') fs.mkdirSync(path.dirname(p.file), { recursive: true });
  return apply.protectedWrite(p.file, p.next, { home: opts.home, expected: p.text === undefined ? null : p.text });
}

/** After-install note per host: what the operator still does, if anything. */
const NOTES = {
  gemini: 'Gemini reads hooks at start: open a new Gemini session',
  kimi: 'Kimi reads config.toml at start: open a new Kimi session',
  hermes: 'Hermes asks to approve a new shell hook the first time it starts in a terminal (or run it once with --accept-hooks); until then it does not run it',
  pi: 'Pi loads extensions at start: open a new Pi session',
  opencode: 'OpenCode loads plugins at start: open a new OpenCode session',
};

/** Hosts where a gate of ours is wired (for the runtime refresh and `hooks`). */
function wired(opts) {
  return HOSTS.filter((h) => { try { const p = planRemoval(h, opts); return p.state === 'remove'; } catch (_) { return false; } });
}

module.exports = { HOSTS, BEGIN, END, FILE_HEADER, NOTES, where, block, ownFile, withoutBlock, withBlock, plan, planRemoval, write, wired };
