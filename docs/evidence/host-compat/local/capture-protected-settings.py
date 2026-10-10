import argparse, datetime, hashlib, json
from pathlib import Path

parser = argparse.ArgumentParser(description='Capture hashes of selected protected host settings, never values.')
parser.add_argument('output', type=Path)
out = parser.parse_args().output
if out.exists():
    raise SystemExit('Refuse to overwrite a settings snapshot')
home = Path.home()
paths = ['.claude/settings.json', '.claude/settings.local.json',
         '.kimi-code/config.toml', '.hermes/config.yaml', '.gemini/settings.json',
         '.config/opencode/opencode.json', '.config/opencode/opencode.jsonc']
files = {}
for rel in paths:
    p = home / rel
    files[rel] = {'present': p.exists(),
                  'sha256': hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None}
claude = home / '.claude.json'
selected = {}
if claude.exists():
    config = json.loads(claude.read_text())
    selected['mcpServers'] = config.get('mcpServers', {})
    keys = ['allowedTools', 'disabledMcpServers', 'disabledMcpjsonServers',
            'enabledMcpjsonServers', 'mcpContextUris', 'mcpServers']
    selected['projects'] = {
        name: {key: value[key] for key in keys if key in value}
        for name, value in config.get('projects', {}).items()
        if isinstance(value, dict) and any(key in value for key in keys)
    }
digest = hashlib.sha256(json.dumps(selected, sort_keys=True).encode()).hexdigest()
instructions = {}
for rel in ['CLAUDE.md', '.claude/CLAUDE.md', '.codex/AGENTS.md', '.gemini/GEMINI.md']:
    path = home / rel
    if not path.exists():
        instructions[rel] = {'present': False}
        continue
    body = path.read_text()
    begin, end = '<!-- SSHLG:ROUTERS:BEGIN', '<!-- SSHLG:ROUTERS:END -->'
    outside = body
    if begin in body:
        if body.count(begin) != 1 or body.count(end) != 1:
            raise SystemExit('Ambiguous managed instruction boundaries: ' + rel)
        first, last = body.index(begin), body.index(end) + len(end)
        if last <= first:
            raise SystemExit('Reversed instruction boundaries: ' + rel)
        outside = body[:first] + body[last:]
    instructions[rel] = {
        'present': True,
        'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        'outside_managed_sha256': hashlib.sha256(outside.encode()).hexdigest(),
        'safari_first_present': 'Browser work — Safari first' in outside,
    }
receipt = {'captured_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
           'files': files, 'claude_mcp_present': claude.exists(),
           'instructions': instructions,
           'claude_mcp_and_project_tool_policy_sha256': digest,
           'claude_scope': 'Root mcpServers plus existing project MCP and allowedTools fields; transient caches excluded.'}
out.write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({'files': len(files), 'present': sum(x['present'] for x in files.values()),
                  'claude_mcp_captured': claude.exists()}))
