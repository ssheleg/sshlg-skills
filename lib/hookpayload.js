'use strict';
/**
 * One payload shape for the guards, whichever host ran the hook (B-209).
 *
 * The guards (`lib/guard.js`, `lib/secretreaders.js`, `lib/secrets.js`, `lib/hygiene.js`,
 * `lib/mcpsecrets.js`, `lib/routegate.js`) read a Claude Code PreToolUse payload. Three
 * hosts run the family's PreToolUse script, and two of them speak differently:
 *
 * - **Cursor** imports `~/.claude/settings.json` (third-party hooks, on by default) and
 *   sends its own payload: `tool_name` `Shell` for Bash, `Read`/`Write`/`Delete` with
 *   `tool_input.path`, MCP tools as `MCP:<tool>` without the server, and
 *   `conversation_id` instead of `session_id`. It reads `permission`/`user_message`
 *   back, and the nested Claude answer only behind a compatibility flag. For a permission
 *   hook, output that is not JSON BLOCKS the call, so this module spells every answer.
 *   Cursor accepts `ask` from preToolUse but does not enforce it, so the route
 *   escalation is not offered there at all (no session id, and `render` says nothing).
 * - **Codex** runs Claude-format hooks from `~/.codex/hooks.json`. `apply_patch` carries
 *   the patch in `tool_input.command`; the paths it touches are read out of the patch
 *   and the text is moved to `patch`, because the shell guards would otherwise read a
 *   patch body as a command.
 *
 * Sources: https://cursor.com/docs/agent/hooks, https://cursor.com/docs/reference/third-party-hooks,
 * cursor-agent 2026.09.02-c22c1a3 (index.js: matcher import, ReadArgs/WriteArgs/DeleteArgs
 * `path`), https://learn.chatgpt.com/docs/hooks (Codex). Fixtures: test/hookpayload_test.js.
 *
 * Pure: no filesystem, no environment. Never throws on a payload; an unusable one
 * becomes an empty Claude payload, which every guard reads as "nothing to do".
 */

const path = require('path');

/** Cursor's event names (lower camel case); Claude and Codex use PascalCase. */
const CURSOR_EVENTS = new Set(['preToolUse', 'postToolUse', 'postToolUseFailure', 'beforeSubmitPrompt',
  'sessionStart', 'sessionEnd', 'stop', 'subagentStop', 'preCompact']);

/** Cursor tool names that differ from Claude's. Edit is imported as Write already. */
const CURSOR_TOOLS = { Shell: 'Bash' };

/** Cursor tools whose `tool_input.path` is the one file the call acts on. */
const CURSOR_FILE_TOOLS = ['Read', 'Write', 'Delete', 'Edit'];

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** Which host sent this payload: 'cursor' | 'codex' | 'claude'. */
function hostOf(p) {
  if (CURSOR_EVENTS.has(p.hook_event_name)) return 'cursor';
  if (typeof p.conversation_id === 'string' && p.session_id === undefined) return 'cursor';
  if (p.turn_id !== undefined || p.tool_name === 'apply_patch') return 'codex';
  return 'claude';
}

/** `tool_input` as an object: Cursor may send a JSON string; anything else is {}. */
function inputOf(v) {
  if (isObject(v)) return Object.assign({}, v);
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      return isObject(parsed) ? parsed : {};
    } catch (e) { return {}; }
  }
  return {};
}

function absolute(p, cwd) {
  if (typeof p !== 'string' || !p) return p;
  if (path.isAbsolute(p)) return p;
  return path.resolve(typeof cwd === 'string' && cwd ? cwd : '/', p);
}

/** Every path an apply_patch body names: Add, Update, Delete and Move to. */
function patchPaths(patch, cwd) {
  if (typeof patch !== 'string') return [];
  const out = [];
  const re = /^\*\*\* (?:(?:Add|Update|Delete) File|Move to): (.+?)\s*$/gm;
  for (let m = re.exec(patch); m; m = re.exec(patch)) out.push(absolute(m[1], cwd));
  return out;
}

/** An argv array as one shell line, quoting what a shell would split. */
function joinArgv(argv) {
  return argv.map((a) => {
    const s = String(a);
    return /^[A-Za-z0-9_@%+=:,./-]+$/.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`;
  }).join(' ');
}

function fromCursor(p) {
  const data = Object.assign({}, p);
  // No session: Cursor does not enforce `ask`, so the escalation must not arm or spend
  // its once-per-turn record on a prompt that would never be shown.
  delete data.session_id;
  const input = inputOf(p.tool_input);
  let tool = typeof p.tool_name === 'string' ? p.tool_name : '';
  if (CURSOR_TOOLS[tool]) tool = CURSOR_TOOLS[tool];
  if (tool.startsWith('MCP:')) {
    const name = tool.slice(4);
    const server = (typeof p.mcp_server_name === 'string' && p.mcp_server_name)
      || require('./mcpsecrets.js').serverFor(name)
      || 'unknown';
    tool = `mcp__${server}__${name}`;
  }
  if (CURSOR_FILE_TOOLS.includes(tool) && typeof input.path === 'string' && input.file_path === undefined) {
    input.file_path = absolute(input.path, p.cwd);
  }
  if (tool) data.tool_name = tool;
  if (p.tool_input !== undefined) data.tool_input = input;
  return data;
}

function fromCodex(p) {
  const data = Object.assign({}, p);
  const input = inputOf(p.tool_input);
  if (p.tool_name === 'apply_patch') {
    const patch = input.command !== undefined ? input.command : input.patch;
    delete input.command;
    input.patch = patch;
    input.file_paths = patchPaths(patch, p.cwd);
  } else if (Array.isArray(input.command)) {
    input.command = joinArgv(input.command);
  }
  if (p.tool_input !== undefined || p.tool_name === 'apply_patch') data.tool_input = input;
  return data;
}

/**
 * `{host, data}`: the host that sent the payload and the payload in Claude's shape.
 * The caller's object is never modified.
 */
function normalise(raw) {
  if (!isObject(raw)) return { host: 'claude', data: {} };
  const host = hostOf(raw);
  if (host === 'cursor') return { host, data: fromCursor(raw) };
  if (host === 'codex') return { host, data: fromCodex(raw) };
  return { host, data: Object.assign({}, raw) };
}

/**
 * The PreToolUse answer for `host`, as the exact bytes to write (one JSON line), or ''
 * when this host should be told nothing. Claude and Codex read `hookSpecificOutput`;
 * Cursor reads `permission`, shows `user_message` and feeds `agent_message` back.
 */
function render(host, decision, reason) {
  if (host === 'cursor') {
    if (decision === 'ask') return '';
    return JSON.stringify({ permission: decision, user_message: reason, agent_message: reason }) + '\n';
  }
  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: decision,
      permissionDecisionReason: reason,
    },
  }) + '\n';
}

/**
 * What a prompt hook prints to add `text` to the turn. Claude reads plain stdout as
 * context; Cursor's beforeSubmitPrompt ignores plain text and reads `additional_context`.
 */
function promptContext(host, text) {
  if (!text) return '';
  if (host === 'cursor') return JSON.stringify({ additional_context: text }) + '\n';
  return `${text}\n`;
}

module.exports = { normalise, render, promptContext, patchPaths, hostOf, CURSOR_EVENTS };
