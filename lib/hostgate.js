'use strict';
/**
 * The family's PreToolUse guard for hosts that cannot run it as it is (B-280).
 *
 * Claude Code, Codex and Cursor run `hooks/pre-tool-use.js` directly (lib/hookpayload.js).
 * Five more hosts can stop a tool call, each in its own words. This module translates their
 * payload into Claude's, runs the unchanged guard script on it, and spells a refusal the way
 * the host reads one. Everything else, a crash, a timeout, a payload it does not know, is a
 * silent pass: a gate that breaks must not stop the operator's work.
 *
 * Contracts, read from the installed hosts on 2026-11-02:
 * - **Gemini CLI 0.63.0**: `hooks.BeforeTool` in `~/.gemini/settings.json`, JSON on stdin
 *   (`tool_name`, `tool_input`, `cwd`). Exit 0 with `{"decision":"deny","reason"}` blocks.
 *   A non-zero exit other than 1 with text also BLOCKS, so the command never fails loudly.
 * - **Kimi Code CLI 2.3.1**: `[[hooks]]` in `~/.kimi-code/config.toml`, event `PreToolUse`,
 *   Claude's answer on exit 0. Tools `Bash`, `Read`, `Write`, `Edit`, `Grep` carry `path`;
 *   no `cwd` field: the hook runs in the session's directory. Crash, timeout, garbage: pass.
 * - **Hermes Agent 0.22.2**: `hooks.pre_tool_call` in `~/.hermes/config.yaml` (shell hooks,
 *   not its plugin hooks). `{"decision":"block","reason"}` blocks; tools `terminal`,
 *   `read_file`, `write_file`, `patch`, `search_files`. Its plugin dispatcher blocks a call
 *   whose hook outlasts 30 s, so the guard's own deadline stays well inside that.
 * - **Pi 1.1.0**: an extension in `~/.pi/agent/extensions/`; `tool_call` returns
 *   `{block: true, reason}`. A handler that throws BLOCKS, so the extension catches
 *   everything. Tools `bash`, `read`, `write`, `edit`, `grep` with `path`.
 * - **OpenCode 1.19.0**: a plugin in `~/.config/opencode/plugins/`; `tool.execute.before`
 *   blocks only by throwing, and any throw blocks, so only a refusal throws. Tools `bash`,
 *   `read`, `write`, `edit` with `filePath`, `grep`, `apply_patch`.
 *
 * MCP tools are translated where the name reads unambiguously (`mcp__` on Kimi; Gemini's
 * `mcp_<server>_<tool>` for a server the MCP guard registers); others pass.
 */

const path = require('path');
const { spawn, spawnSync } = require('child_process');

const HOSTS = ['gemini', 'kimi', 'hermes', 'pi', 'opencode'];
/** Per call, well inside every host's limit (Hermes blocks at 30 s, Gemini kills at 60 s). */
const DEADLINE_MS = 8000;

function isObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
function str(v) { return typeof v === 'string' && v ? v : null; }
function abs(p, cwd) { return path.isAbsolute(p) ? p : path.resolve(cwd || '/', p); }

/** One Claude PreToolUse payload. No session id: no host here shows the route escalation. */
function claude(tool, input, cwd) {
  return { hook_event_name: 'PreToolUse', tool_name: tool, tool_input: input, cwd: cwd || '/' };
}
function bash(command, cwd) { return str(command) ? [claude('Bash', { command }, cwd)] : []; }
function file(tool, p, cwd, extra) {
  return str(p) ? [claude(tool, Object.assign({ file_path: abs(p, cwd) }, extra || {}), cwd)] : [];
}
function grep(pattern, p, cwd, mode) {
  if (!str(pattern)) return [];
  const input = { pattern, output_mode: mode || 'content' };
  if (str(p)) input.path = abs(p, cwd);
  return [claude('Grep', input, cwd)];
}
/** Every file an apply_patch / V4A body names, as one Edit each. */
function patched(body, cwd) {
  return require('./hookpayload.js').patchPaths(body, cwd).map((p) => claude('Edit', { file_path: p }, cwd));
}
function geminiMcp(name, cwd, input) {
  const rest = name.slice('mcp_'.length);
  const server = Object.keys(require('./mcpsecrets.js').REGISTRY).find((s) => rest.startsWith(`${s}_`));
  return server ? [claude(`mcp__${server}__${rest.slice(server.length + 1)}`, input, cwd)] : [];
}

/**
 * Claude payloads for one host call, or [] when nothing here is gated. `call` is
 * `{tool, input, cwd}` in the host's own names. Pure; never throws on odd input.
 */
function toClaude(host, call) {
  try {
    const c = isObject(call) ? call : {};
    const tool = str(c.tool) || '';
    const input = isObject(c.input) ? c.input : {};
    const cwd = str(c.cwd) || '/';
    if (host === 'gemini') {
      const at = str(input.dir_path) ? abs(input.dir_path, cwd) : cwd;
      if (tool === 'run_shell_command') return bash(input.command, at);
      if (tool === 'read_file') return file('Read', input.file_path, cwd);
      if (tool === 'read_many_files') {
        const list = [].concat(Array.isArray(input.paths) ? input.paths : [], Array.isArray(input.include) ? input.include : []);
        return list.filter((p) => str(p) && !/[*?[{]/.test(p)).flatMap((p) => file('Read', p, cwd));
      }
      if (tool === 'write_file') return file('Write', input.file_path, cwd, { content: input.content });
      if (tool === 'replace') return file('Edit', input.file_path, cwd, { old_string: input.old_string, new_string: input.new_string });
      if (tool === 'grep_search' || tool === 'search_file_content') return grep(input.pattern, input.dir_path || input.path, cwd);
      if (tool.startsWith('mcp_')) return geminiMcp(tool, cwd, input);
      return [];
    }
    if (host === 'kimi') {
      if (tool === 'Bash') return bash(input.command, str(input.cwd) ? abs(input.cwd, cwd) : cwd);
      if (tool === 'Read' || tool === 'Write' || tool === 'Edit') return file(tool, input.path, cwd, tool === 'Write' ? { content: input.content } : null);
      if (tool === 'Grep') return grep(input.pattern, input.path, cwd, str(input.output_mode) || 'content');
      if (tool.startsWith('mcp__')) return [claude(tool, input, cwd)];
      return [];
    }
    if (host === 'hermes') {
      if (tool === 'terminal') return bash(input.command, str(input.workdir) ? abs(input.workdir, cwd) : cwd);
      if (tool === 'read_file') return file('Read', input.path, cwd);
      if (tool === 'write_file') return file('Write', input.path, cwd, { content: input.content });
      if (tool === 'patch') return str(input.patch) ? patched(input.patch, cwd) : file('Edit', input.path, cwd);
      if (tool === 'search_files') return grep(input.pattern, input.path, cwd, input.target === 'files' ? 'files_with_matches' : 'content');
      return [];
    }
    if (host === 'pi') {
      if (tool === 'bash') return bash(input.command, cwd);
      if (tool === 'read' || tool === 'write' || tool === 'edit') {
        return file(tool[0].toUpperCase() + tool.slice(1), input.path, cwd, tool === 'write' ? { content: input.content } : null);
      }
      if (tool === 'grep') return grep(input.pattern, input.path, cwd);
      return [];
    }
    if (host === 'opencode') {
      if (tool === 'bash') return bash(input.command, str(input.workdir) ? abs(input.workdir, cwd) : cwd);
      if (tool === 'read' || tool === 'write' || tool === 'edit') {
        return file(tool[0].toUpperCase() + tool.slice(1), input.filePath, cwd, tool === 'write' ? { content: input.content } : null);
      }
      if (tool === 'grep') return grep(input.pattern, input.path, cwd);
      if (tool === 'apply_patch') return patched(input.patchText || input.patch, cwd);
      return [];
    }
    return [];
  } catch (_) { return []; }
}

/** The host's stdin payload as `{tool, input, cwd}` (command hosts only). */
function callOf(host, raw, processCwd) {
  if (!isObject(raw)) return null;
  const input = isObject(raw.tool_input) ? raw.tool_input : {};
  // Kimi sends no cwd: its hook runs in the session's directory.
  const cwd = host === 'kimi' ? processCwd : (str(raw.cwd) || processCwd);
  return { tool: raw.tool_name, input, cwd };
}

/** The refusal in the guard's stdout, or null. */
function denied(stdout) {
  for (const line of String(stdout || '').split('\n')) {
    try {
      const o = JSON.parse(line);
      const h = isObject(o) && o.hookSpecificOutput;
      if (isObject(h) && h.permissionDecision === 'deny') return String(h.permissionDecisionReason || 'Refused by the sshlg-skills guard.');
    } catch (_) { /* not an answer */ }
  }
  return null;
}

/** What a command host is told: exact stdout bytes, '' to pass. */
function answer(host, reason) {
  if (!reason) return '';
  if (host === 'gemini') return JSON.stringify({ decision: 'deny', reason }) + '\n';
  if (host === 'hermes') return JSON.stringify({ decision: 'block', reason }) + '\n';
  return JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }) + '\n';
}

function guardScript(root) { return path.join(root, 'hooks', 'pre-tool-use.js'); }

/** Run the guard over each payload in turn; the first refusal wins. Synchronous. */
function judgeSync(payloads, root, opts) {
  const o = opts || {};
  const end = Date.now() + (o.deadlineMs || DEADLINE_MS);
  for (const p of payloads) {
    const left = end - Date.now();
    if (left <= 0) return null;
    const r = spawnSync(o.node || process.execPath, [guardScript(root)], { input: JSON.stringify(p), encoding: 'utf8',
      timeout: left, env: o.env || process.env, stdio: ['pipe', 'pipe', 'ignore'] });
    if (r.error || r.signal) return null;
    const why = denied(r.stdout);
    if (why) return why;
  }
  return null;
}

/** The same, without blocking the host's event loop (Pi and OpenCode run it in-process). */
function judge(payloads, root, opts) {
  const o = opts || {};
  const end = Date.now() + (o.deadlineMs || DEADLINE_MS);
  const one = (p) => new Promise((resolve) => {
    const left = end - Date.now();
    if (left <= 0) return resolve(null);
    let out = '';
    let child;
    try {
      child = spawn(o.node || process.execPath, [guardScript(root)], { env: o.env || process.env, stdio: ['pipe', 'pipe', 'ignore'] });
    } catch (_) { return resolve(null); }
    const timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch (_) { /* gone */ } resolve(null); }, left);
    child.on('error', () => { clearTimeout(timer); resolve(null); });
    child.stdout.on('data', (d) => { out += d; });
    child.on('close', () => { clearTimeout(timer); resolve(denied(out)); });
    child.stdin.on('error', () => { /* the guard exited first */ });
    child.stdin.end(JSON.stringify(p));
  });
  return payloads.reduce((prev, p) => prev.then((why) => why || one(p)), Promise.resolve(null)).catch(() => null);
}

module.exports = { HOSTS, DEADLINE_MS, toClaude, callOf, denied, answer, judgeSync, judge, guardScript };
