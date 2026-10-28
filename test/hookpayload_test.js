#!/usr/bin/env node
'use strict';
// The payload normaliser (lib/hookpayload.js) and the PreToolUse matchers as each host
// reads them (B-209, B-218 CLAUDE-6).
//
// Three hosts run the family's PreToolUse script: Claude Code (its own payload), Cursor
// (it imports ~/.claude/settings.json and sends ITS payload: `Shell`, `path`,
// `MCP:<tool>`, `conversation_id`) and Codex (Claude-format hooks with `apply_patch`
// whose paths live inside the patch text). The guards are pure and Claude-shaped; this
// module is the one place a foreign payload becomes a Claude one, and the one place an
// answer is spelled for the host that asked.
//
// Sources the fixtures follow (read 2026-10-27):
// - Cursor: https://cursor.com/docs/agent/hooks (preToolUse fields, `permission` output,
//   "invalid JSON ... blocks the action") and https://cursor.com/docs/reference/third-party-hooks
//   (Claude import, Bash -> Shell, Edit -> Write); the matcher translation and the
//   ReadArgs/WriteArgs/DeleteArgs `path` field from cursor-agent 2026.09.02-c22c1a3 index.js.
// - Codex: https://learn.chatgpt.com/docs/hooks (tool_name `Bash`, `apply_patch`,
//   `mcp__server__tool`; `tool_input.command` carries the patch; matcher is a regex).
// - Claude Code: https://code.claude.com/docs/en/hooks.md, "Matcher evaluation" (letters,
//   digits, `_`, `-`, space, `,`, `|` only: exact names; anything else: unanchored RegExp).

const assert = require('assert');
const path = require('path');
const P = require('../lib/hookpayload.js');
const H = require('../lib/hooks.js');
const M = require('../lib/mcpsecrets.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// --- normalise: hosts ---------------------------------------------------------

it('a Claude payload passes through unchanged and is called claude', () => {
  const raw = { session_id: 's1', hook_event_name: 'PreToolUse', tool_name: 'Edit',
    tool_input: { file_path: '/x/a.js' }, cwd: '/x' };
  const n = P.normalise(raw);
  assert.strictEqual(n.host, 'claude');
  assert.deepStrictEqual(n.data, raw);
  assert.notStrictEqual(n.data, raw, 'the caller\'s object must not be the one returned');
});

it('a bare payload (no event, no ids) stays claude: the existing fixtures rely on it', () => {
  assert.strictEqual(P.normalise({ tool_name: 'Read', tool_input: { file_path: '/tmp/.env' } }).host, 'claude');
});

it('anything that is not an object normalises to an empty claude payload', () => {
  for (const v of [null, undefined, 'text', 42, [1, 2]]) {
    assert.deepStrictEqual(P.normalise(v), { host: 'claude', data: {} });
  }
});

it('Cursor is recognised by its event name and by conversation_id without session_id', () => {
  assert.strictEqual(P.normalise({ hook_event_name: 'preToolUse', tool_name: 'Read', tool_input: {} }).host, 'cursor');
  assert.strictEqual(P.normalise({ conversation_id: 'c', tool_name: 'Read', tool_input: {} }).host, 'cursor');
  assert.strictEqual(P.normalise({ hook_event_name: 'beforeSubmitPrompt', prompt: 'x' }).host, 'cursor');
});

it('Codex is recognised by turn_id or by apply_patch', () => {
  assert.strictEqual(P.normalise({ session_id: 's', turn_id: 't', hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'ls' } }).host, 'codex');
  assert.strictEqual(P.normalise({ session_id: 's', hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: { command: '' } }).host, 'codex');
});

// --- normalise: Cursor -----------------------------------------------------

const CURSOR = { conversation_id: 'conv-1', generation_id: 'gen-1', hook_event_name: 'preToolUse',
  model: 'm', cwd: '/w', tool_use_id: 'tu' };

it('Cursor Shell becomes Bash with the same command', () => {
  const n = P.normalise(Object.assign({}, CURSOR, { tool_name: 'Shell', tool_input: { command: 'cat /tmp/.env', working_directory: '/w' } }));
  assert.strictEqual(n.data.tool_name, 'Bash');
  assert.strictEqual(n.data.tool_input.command, 'cat /tmp/.env');
});

it('Cursor Read, Write and Delete carry `path`; the guards read `file_path`', () => {
  for (const tool of ['Read', 'Write', 'Delete']) {
    const n = P.normalise(Object.assign({}, CURSOR, { tool_name: tool, tool_input: { path: '/w/a.txt', file_text: 'x' } }));
    assert.strictEqual(n.data.tool_input.file_path, '/w/a.txt', tool);
    assert.strictEqual(n.data.tool_name, tool, tool);
  }
});

it('a relative Cursor path resolves against the payload cwd', () => {
  const n = P.normalise(Object.assign({}, CURSOR, { tool_name: 'Read', tool_input: { path: 'b/c.txt' } }));
  assert.strictEqual(n.data.tool_input.file_path, path.join('/w', 'b', 'c.txt'));
});

it('Cursor Grep keeps its own `path` (a directory or file to search), as Claude Grep does', () => {
  const n = P.normalise(Object.assign({}, CURSOR, { tool_name: 'Grep', tool_input: { pattern: 'x', path: '/tmp/.env', output_mode: 'content' } }));
  assert.strictEqual(n.data.tool_input.path, '/tmp/.env');
  assert.strictEqual(n.data.tool_input.file_path, undefined);
});

it('a Cursor tool_input sent as a JSON string is parsed; garbage becomes {}', () => {
  const ok = P.normalise(Object.assign({}, CURSOR, { tool_name: 'Read', tool_input: '{"path":"/w/x"}' }));
  assert.strictEqual(ok.data.tool_input.file_path, '/w/x');
  const bad = P.normalise(Object.assign({}, CURSOR, { tool_name: 'Read', tool_input: '{not json' }));
  assert.deepStrictEqual(bad.data.tool_input, {});
});

it('Cursor MCP:<tool> becomes mcp__<server>__<tool> for a registered tool', () => {
  const n = P.normalise(Object.assign({}, CURSOR, { tool_name: 'MCP:db-cluster-list', tool_input: {} }));
  assert.strictEqual(n.data.tool_name, 'mcp__digitalocean__db-cluster-list');
  assert.ok(M.inspectTool(n.data.tool_name), 'the MCP guard does not recognise the normalised name');
});

it('Cursor MCP:<tool> with a server name in the payload uses that server', () => {
  const n = P.normalise(Object.assign({}, CURSOR, { tool_name: 'MCP:db-cluster-list', mcp_server_name: 'other', tool_input: {} }));
  assert.strictEqual(n.data.tool_name, 'mcp__other__db-cluster-list');
  assert.strictEqual(M.inspectTool(n.data.tool_name), null);
});

it('an unregistered Cursor MCP tool stays an MCP name the guard passes', () => {
  const n = P.normalise(Object.assign({}, CURSOR, { tool_name: 'MCP:list_issues', tool_input: {} }));
  assert.ok(n.data.tool_name.startsWith('mcp__'));
  assert.strictEqual(M.inspectTool(n.data.tool_name), null);
});

it('Cursor has no session_id: the route gate degrades to silence (Cursor does not enforce `ask`)', () => {
  const n = P.normalise(Object.assign({}, CURSOR, { tool_name: 'Write', tool_input: { path: '/w/a' } }));
  assert.strictEqual(n.data.session_id, undefined);
  const forged = P.normalise(Object.assign({}, CURSOR, { session_id: 'x', tool_name: 'Write', tool_input: { path: '/w/a' } }));
  assert.strictEqual(forged.data.session_id, undefined, 'a Cursor payload must never arm the escalation');
});

// --- normalise: Codex ------------------------------------------------------

const PATCH = [
  '*** Begin Patch',
  '*** Update File: .codex/AGENTS.md',
  '@@',
  '-old',
  '+npx skills update task-pipeline',
  '*** Add File: /abs/new.md',
  '+x',
  '*** Delete File: gone.txt',
  '*** Update File: src/a.js',
  '*** Move to: src/b.js',
  '*** End Patch',
].join('\n');

it('apply_patch: every path the patch names, absolute against cwd, and no shell command left', () => {
  const n = P.normalise({ session_id: 's', turn_id: 't', hook_event_name: 'PreToolUse', cwd: '/home/u',
    tool_name: 'apply_patch', tool_input: { command: PATCH } });
  assert.deepStrictEqual(n.data.tool_input.file_paths, [
    '/home/u/.codex/AGENTS.md', '/abs/new.md', '/home/u/gone.txt', '/home/u/src/a.js', '/home/u/src/b.js',
  ]);
  assert.strictEqual(n.data.tool_input.command, undefined,
    'the patch text left as `command` is read by the shell guards as a command it is not');
  assert.strictEqual(n.data.tool_input.patch, PATCH);
  assert.strictEqual(n.data.session_id, 's');
});

it('apply_patch with an input that is not a string yields no paths and no throw', () => {
  const n = P.normalise({ session_id: 's', tool_name: 'apply_patch', tool_input: { command: 7 } });
  assert.deepStrictEqual(n.data.tool_input.file_paths, []);
});

it('a Codex Bash command given as an argv array is joined into one string', () => {
  const n = P.normalise({ session_id: 's', turn_id: 't', tool_name: 'Bash', tool_input: { command: ['bash', '-lc', 'cat /tmp/.env'] } });
  assert.strictEqual(typeof n.data.tool_input.command, 'string');
  assert.ok(n.data.tool_input.command.includes('cat /tmp/.env'));
});

// --- render ----------------------------------------------------------------

function parsesOrEmpty(s) {
  if (s === '') return null;
  assert.ok(s.endsWith('\n') && s.indexOf('\n') === s.length - 1, 'one line, newline-terminated');
  return JSON.parse(s);
}

it('Claude and Codex get hookSpecificOutput', () => {
  for (const host of ['claude', 'codex']) {
    const o = parsesOrEmpty(P.render(host, 'deny', 'why'));
    assert.deepStrictEqual(o, { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: 'why' } });
  }
});

it('Cursor gets its flat shape: nested output is honoured only behind a Cursor flag', () => {
  const o = parsesOrEmpty(P.render('cursor', 'deny', 'why'));
  assert.deepStrictEqual(o, { permission: 'deny', user_message: 'why', agent_message: 'why' });
});

it('Cursor `ask` is not enforced by Cursor, so it is not said at all', () => {
  assert.strictEqual(P.render('cursor', 'ask', 'route'), '');
});

it('an unknown host is answered as Claude', () => {
  assert.ok(parsesOrEmpty(P.render('nobody', 'deny', 'x')).hookSpecificOutput);
});

it('prompt context: Cursor gets {additional_context}, Claude keeps plain text', () => {
  assert.deepStrictEqual(JSON.parse(P.promptContext('cursor', 'route note')), { additional_context: 'route note' });
  assert.strictEqual(P.promptContext('claude', 'route note'), 'route note\n');
  assert.strictEqual(P.promptContext('cursor', ''), '');
});

// B-274: Cursor reads sessionStart and postToolUse answers as top-level
// `additional_context` (https://cursor.com/docs/agent/hooks, "sessionStart" and
// "postToolUse" output tables); the nested Claude answer only behind a Cursor flag
// (`enableClaudeNestedHookSpecificOutputCompatibility`, cursor-agent 2026.09.02-c22c1a3).
it('B-274: session and post-tool context: Cursor gets {additional_context} and nothing else', () => {
  const session = { hookEventName: 'SessionStart', additionalContext: 'pointer', sessionTitle: 't', watchPaths: ['/x'] };
  assert.deepStrictEqual(parsesOrEmpty(P.eventContext('cursor', session)), { additional_context: 'pointer' });
  assert.deepStrictEqual(parsesOrEmpty(P.eventContext('claude', session)), { hookSpecificOutput: session });
  assert.deepStrictEqual(parsesOrEmpty(P.eventContext('codex', session)), { hookSpecificOutput: session });
  const post = { hookEventName: 'PostToolUse', additionalContext: 'note' };
  assert.deepStrictEqual(parsesOrEmpty(P.eventContext('cursor', post)), { additional_context: 'note' });
  assert.deepStrictEqual(parsesOrEmpty(P.eventContext('claude', post)), { hookSpecificOutput: post });
  assert.strictEqual(P.eventContext('cursor', { hookEventName: 'SessionStart', additionalContext: '' }), '');
  assert.strictEqual(P.eventContext('cursor', null), '');
});

it('B-274: a Cursor postToolUse payload reads like Claude\'s: Shell is Bash, tool_output is tool_response', () => {
  const { host, data } = P.normalise({ hook_event_name: 'postToolUse', conversation_id: 'c', tool_name: 'Shell',
    tool_input: { command: 'make' }, tool_output: '{"stdout":"ok"}' });
  assert.strictEqual(host, 'cursor');
  assert.strictEqual(data.tool_name, 'Bash');
  assert.strictEqual(data.tool_response, '{"stdout":"ok"}');
  const claude = P.normalise({ hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_response: { stdout: 'x' } });
  assert.deepStrictEqual(claude.data.tool_response, { stdout: 'x' });
});

// B-275: Cursor's Grep hook input is `{pattern, file_path, glob, output_mode}`
// (cursor-agent 2026.09.02-c22c1a3, 190.index.js `createToolInput`), and its executor
// runs `outputMode ?? "content"` (index.js LocalGrepExecutor): with no mode the matching
// lines are shown. Claude's default (`files_with_matches`) shows no line, so only Cursor's
// absent mode becomes `content`.
it('B-275: a Cursor Grep with no output_mode reads as content, at its file_path', () => {
  const g = P.normalise({ hook_event_name: 'preToolUse', conversation_id: 'c', cwd: '/w', tool_name: 'Grep',
    tool_input: { pattern: 'KEY', file_path: '/tmp/.env' } }).data.tool_input;
  assert.strictEqual(g.output_mode, 'content');
  assert.strictEqual(g.path, '/tmp/.env');
  const rel = P.normalise({ hook_event_name: 'preToolUse', conversation_id: 'c', cwd: '/w', tool_name: 'Grep',
    tool_input: { pattern: 'KEY', file_path: 'conf/.env', output_mode: '' } }).data.tool_input;
  assert.strictEqual(rel.output_mode, 'content');
  assert.strictEqual(rel.path, '/w/conf/.env');
  const files = P.normalise({ hook_event_name: 'preToolUse', conversation_id: 'c', tool_name: 'Grep',
    tool_input: { pattern: 'KEY', file_path: '/tmp/.env', output_mode: 'files_with_matches' } }).data.tool_input;
  assert.strictEqual(files.output_mode, 'files_with_matches');
  const claude = P.normalise({ hook_event_name: 'PreToolUse', session_id: 's', tool_name: 'Grep',
    tool_input: { pattern: 'KEY', path: '/tmp/.env' } }).data.tool_input;
  assert.strictEqual(claude.output_mode, undefined, "Claude's default shows no line and stays as sent");
  const R = require('../lib/secretreaders.js');
  assert.ok(R.inspectTool('Grep', g, { cwd: '/w', home: '/home/op' }), 'the credential check does not fire on Cursor\'s default');
  assert.ok(!R.inspectTool('Grep', files, { cwd: '/w', home: '/home/op' }));
});

// --- the PreToolUse matcher as each host reads it (CLAUDE-6) ----------------

/** Claude Code's rule (hooks.md "Matcher evaluation"). */
function claudeMatches(matcher, tool) {
  if (!matcher || matcher === '*') return true;
  if (/^[A-Za-z0-9_\- ,|]*$/.test(matcher)) return matcher.split(/[|,]/).map((s) => s.trim()).includes(tool);
  return new RegExp(matcher).test(tool);
}

/**
 * Cursor's import of a Claude matcher, transcribed from cursor-agent 2026.09.02-c22c1a3
 * index.js (the function that maps PreToolUse matchers): split on `|`, map each trimmed
 * piece by name (Bash -> Shell, Edit -> Write, Glob dropped), `mcp__a__b` -> `MCP:b`,
 * keep anything else as it is, join with `|`; the result is tested with `new RegExp(m).test`.
 */
const CURSOR_NAMES = { Bash: 'Shell', Read: 'Read', Write: 'Write', Edit: 'Write', Glob: null, Grep: 'Grep', WebFetch: 'WebFetch', WebSearch: 'WebSearch', Task: 'Task' };
function cursorTranslate(matcher) {
  if (!matcher || matcher === '*') return '*';
  const out = [];
  for (const raw of matcher.split('|')) {
    const t = raw.trim();
    if (t.startsWith('mcp__')) {
      const parts = t.split('__');
      if (parts.length >= 3) { out.push(`MCP:${parts.slice(2).join('__')}`); continue; }
    }
    const n = CURSOR_NAMES[t];
    if (n === null) continue;
    if (n !== undefined) { if (!out.includes(n)) out.push(n); } else out.push(t);
  }
  return out.length ? out.join('|') : null;
}
function cursorMatches(matcher, tool) {
  const m = cursorTranslate(matcher);
  if (m === '*') return true;
  try { return new RegExp(m).test(tool); } catch (e) { return true; }
}

const PRE = H.entries('/r').PreToolUse.matcher;

it('Claude: the matcher fires on every tool the guards read, by exact name', () => {
  for (const t of ['Edit', 'Write', 'NotebookEdit', 'Bash', 'Read', 'Grep',
    'mcp__digitalocean__db-cluster-list', 'mcp__plugin_do_digitalocean__db-cluster-get']) {
    assert.ok(claudeMatches(PRE, t), `${t} is not matched by ${PRE}`);
  }
});

it('Claude: no prefix or suffix match spawns the hook (TodoWrite, BashOutput, ReadMcpResourceTool)', () => {
  for (const t of ['TodoWrite', 'BashOutput', 'ReadMcpResourceTool', 'KillBash', 'MultiEdit',
    'mcp__digitalocean__db-cluster-get-ca', 'Task', 'WebFetch']) {
    assert.ok(!claudeMatches(PRE, t), `${t} is matched by ${PRE}`);
  }
});

it('the matcher names no tool absent from both hosts that read it (MultiEdit is gone)', () => {
  assert.ok(!/\bMultiEdit\b/.test(PRE), PRE);
});

it('Cursor: the imported matcher still reaches Shell, Read, Write, Grep, Delete and the MCP tools', () => {
  for (const t of ['Shell', 'Read', 'Write', 'Grep', 'Delete', 'MCP:db-cluster-list', 'MCP:vector-db-get-credentials']) {
    assert.ok(cursorMatches(PRE, t), `${t} is not matched by Cursor's translation ${cursorTranslate(PRE)}`);
  }
});

it('Cursor: and it stays anchored after the translation', () => {
  for (const t of ['TodoWrite', 'MCP:db-cluster-get-ca', 'Task', 'ShellOutput']) {
    assert.ok(!cursorMatches(PRE, t), `${t} is matched by Cursor's translation ${cursorTranslate(PRE)}`);
  }
});

it('Claude: the PostToolUse matcher is an exact list (no regex path)', () => {
  const post = H.entries('/r').PostToolUse.matcher;
  assert.ok(/^[A-Za-z0-9_|]+$/.test(post), post);
  assert.ok(!claudeMatches(post, 'BashOutput'));
});

// --- the Codex matcher ------------------------------------------------------

it('Codex: Bash, apply_patch and the registered MCP tools, anchored', () => {
  const m = H.codexEntries('/r').PreToolUse.matcher;
  for (const t of ['Bash', 'apply_patch', 'mcp__digitalocean__db-cluster-list']) {
    assert.ok(new RegExp(m).test(t), `${t} is not matched by ${m}`);
  }
  for (const t of ['update_plan', 'apply_patch_v2', 'mcp__digitalocean__db-cluster-get-ca', 'xBash']) {
    assert.ok(!new RegExp(m).test(t), `${t} is matched by ${m}`);
  }
});

if (failures.length) {
  process.stderr.write(`hookpayload: ${failures.length}/${checks} failed\n  ${failures.join('\n  ')}\n`);
  process.exit(1);
}
process.stdout.write(`PASS: hookpayload — ${checks} cases\n`);
