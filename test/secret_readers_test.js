#!/usr/bin/env node
'use strict';
// Synthetic path strings only. No credential file is opened or command executed.
const assert = require('assert');
const { spawnSync } = require('child_process');
const path = require('path');
const S = require('../lib/secrets.js');
let checks = 0;
const failures = [];
function it(name, fn) { checks++; try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); } }
const denied = [
  'cd -- /tmp/secrets && cat provider', 'cd -P /tmp/secrets && cat provider',
  'cd -L /tmp/secrets && cat provider',
  "python3 -c 'print(open(file=\"/tmp/.env\").read())'",
  "find /tmp/secrets -type f -exec sh -c \"cat {}\" \\;",
  "printf '%s\\n' ~/.netrc | xargs sh -c 'cat \"$0\"'",
  'grep TOKEN ~/proj/.env', 'rg -n TOKEN ~/proj/.env',
  'grep -e /credentials ~/.netrc', 'grep --regexp TOKEN -- ~/.npmrc',
  "sed -n '1,5p' ~/proj/.env", "awk '{print}' ~/proj/.env",
  "sed -e 's/a/b/' ~/proj/.env", "awk -F : '{print $1}' ~/.netrc",
  'cat .env', 'head ../secrets/key', 'cd ~/.config/agentgateway && cat secrets/provider',
  'cd ~/.config/agentgateway/secrets && cat provider',
  "printf '%s\\n' ~/.netrc | xargs cat", 'xargs -n 1 cat ~/.netrc',
  "find ~/.config/agentgateway/secrets -type f -exec cat {} \\;",
  "find ~/.ssh -name id_rsa -exec head {} +",
  "bash -c 'cat ~/.netrc'", "sh -c 'grep TOKEN ~/.netrc'",
  "bash -lc 'cd ~/.config/agentgateway/secrets && cat provider'",
  "python3 -c 'print(open(\"/tmp/credentials\").read())'",
  "python3 -c 'from pathlib import Path; print(Path(\"/tmp/.env\").read_text())'",
  'dd if=~/.netrc', 'dd if=/tmp/.env bs=1 count=20',
  'jq . ~/.claude.json', "jq '.mcpServers' ~/.cursor/mcp.json",
  'cat ~/.codex/config.toml', 'cat ~/.config/opencode/opencode.json',
  'cat .mcp.json', 'cat .cursor/mcp.json',
  'cat ~/.claude/settings.json', 'cat ~/.config/agentgateway/servers.yaml',
  'claude mcp get provider', '/usr/local/bin/claude mcp get provider',
  'grep TOKEN < ~/.netrc', "sed 's/a/b/' < ~/.netrc",
  'f=~/.netrc; grep TOKEN "$f"', 'cp ~/.netrc /tmp/copy; grep TOKEN /tmp/copy',
  'ln -s ~/.netrc /tmp/link; sed -n 1p /tmp/link',
  'grep -f ~/.netrc README.md', "jq -f ~/.netrc README.md",
  'echo "$(grep TOKEN ~/.netrc)"', 'stat "$(cat ~/.netrc)"',
  'cat ~/.codex/auth.json', 'cat ~/.claude/.credentials.json',
  'cat ~/.local/share/opencode/auth.json', 'rg . ~/.codex',
  "python3 -c 'import sys; print(open(sys.argv[1]).read())' ~/.netrc",
  "bash -c 'cat \"$1\"' _ ~/.netrc", 'env F=~/.netrc cat "$F"',
  'sudo -u root cat ~/.netrc', 'cat <(cat ~/.netrc)',
  "python3 -c 'print(open(\"/tmp/.env\", \"a+\").read())'",
  "python3 -c 'from pathlib import Path; print(Path(\"/tmp/.env\").open(\"r\").read())'",
  'xargs -a /tmp/.env echo', 'xargs --arg-file=/tmp/.env echo',
  'grep -r TOKEN /tmp/.env', 'grep -T TOKEN /tmp/.env',
  'rg -T js TOKEN /tmp/.env',
  'xargs cat < ~/.netrc', 'xargs echo < ~/.netrc',
  "find /tmp/secrets -type f -exec sh -c 'cat \"$1\"' _ {} \\;",
  "printf '%s\\n' ~/.netrc | xargs -I{} sh -c 'cat {}'",
];
const allowed = [
  'rg --max-columns 200 /credentials lib/',
  'grep --include "*.js" /credentials lib/',
  'grep --exclude "*.md" /credentials lib/',
  'rg --max-filesize 1M /credentials lib/',
  "python3 -c 'open(file=\"/tmp/.env\", mode=\"w\").write(\"placeholder\")'",
  'rg -n "/credentials" lib/', 'rg -n "/credentials" lib/ | head -2',
  'grep -n /credentials lib/a.js', "sed -n '/credentials/p' lib/a.js",
  "awk '/credentials/ {print}' lib/a.js", 'rg -e /credentials -g "*.js" lib/',
  'grep -c TOKEN ~/.netrc', 'rg --count TOKEN ~/.netrc',
  'grep -q TOKEN ~/.netrc', 'rg -l TOKEN ~/.netrc', 'rg --files ~/.ssh',
  'test -f ~/.netrc && echo present', 'wc -c < ~/.netrc', 'stat ~/.claude.json',
  'ls -l ~/.codex/config.toml', 'chmod 600 ~/.netrc',
  'wc -c < ~/.netrc; cat README.md', 'stat ~/.netrc && head README.md',
  "python3 -c 'import os; print(os.path.getsize(\"/tmp/.env\"))'",
  "python3 -c 'from pathlib import Path; print(Path(\"/tmp/.env\").exists())'",
  "echo 'cat ~/.netrc'", "printf '%s' 'claude mcp get provider'",
  'claude mcp list', 'claude mcp get --help',
  'cat docs/credentials.md', 'cat lib/secrets.js',
  "find ~/.ssh -name id_rsa -print", "printf '%s\\n' README.md | xargs cat",
  "bash -c 'stat ~/.netrc'", "grep -e /credentials README.md | head -1",
  "printf '%s\\n' ~/.netrc | xargs grep -c TOKEN",
  "find /tmp/secrets -type f -exec grep -c TOKEN {} \\;",
  "python3 -c 'import sys,os; print(os.path.getsize(sys.argv[1]))' ~/.netrc",
  'cat ~/.codex/README.md',
  "python3 -c \"print(\\\"open('/tmp/.env')\\\")\"",
  "python3 -c \"# open('/tmp/.env')\nprint('example')\"",
  "python3 -c 'open(\"/tmp/.env\", \"w\").write(\"placeholder\")'",
  "python3 -c 'from pathlib import Path; Path(\"/tmp/.env\").open(\"w\")'",
  'cd /tmp/secrets; cd; cat provider',
  'rg TODO /tmp/opencode', 'cat /tmp/opencode/auth.json',
  "find /tmp/secrets -type f -exec sh -c 'stat \"$1\"' _ {} \\;",
];
for (const cmd of denied) it(`deny ${cmd}`, () => assert.strictEqual(S.inspect(cmd)?.rule, 'reads-secret-file'));
for (const cmd of allowed) it(`allow ${cmd}`, () => assert.strictEqual(S.inspect(cmd), null));
it('relative read uses hook cwd', () => assert.strictEqual(S.inspect('cat provider', { cwd: '/tmp/secrets' })?.rule, 'reads-secret-file'));
it('same relative file outside secret directory stays allowed', () => assert.strictEqual(S.inspect('cat provider', { cwd: '/tmp/docs' }), null));

const toolCases = [
  ['Read', { file_path: '/tmp/.env' }, true],
  ['Read', { file_path: '/tmp/docs/credentials.md' }, false],
  ['Read', { file_path: 'provider' }, true, '/tmp/secrets'],
  ['Grep', { path: '/tmp/.env', pattern: 'TOKEN', output_mode: 'content' }, true],
  ['Grep', { path: '/tmp/.env', pattern: 'TOKEN', output_mode: 'count' }, false],
  ['Grep', { path: '/tmp/.env', pattern: 'TOKEN' }, false],
  ['Grep', { path: '/tmp/project', glob: '.env*', pattern: '.', output_mode: 'content' }, true],
  ['Grep', { path: '/tmp/lib', pattern: '/credentials', output_mode: 'content' }, false],
  ['Grep', { pattern: '.', output_mode: 'content' }, true, '/tmp/secrets'],
  ['Bash', { command: 'cat provider' }, true, '/tmp/secrets'],
];
for (const [tool, input, deny, cwd] of toolCases) it(`hook ${tool} ${JSON.stringify(input)}`, () => {
  const r = spawnSync(process.execPath, [path.join(__dirname, '../hooks/pre-tool-use.js')], {
    input: JSON.stringify({ tool_name: tool, tool_input: input, cwd }), encoding: 'utf8',
  });
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout ? JSON.parse(r.stdout).hookSpecificOutput.permissionDecision : null, deny ? 'deny' : null);
});
it('Read and Grep reach the hook through installed matcher', () => {
  const re = new RegExp(`^(?:${require('../lib/hooks.js').entries('/test').PreToolUse.matcher})$`);
  assert.ok(re.test('Read') && re.test('Grep'));
});
if (failures.length) { console.error(`${failures.length}/${checks} failed\n${failures.join('\n')}`); process.exit(1); }
console.log(`OK (${checks} checks)`);
