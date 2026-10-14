#!/usr/bin/env python3
"""Read-only, six-file metadata snapshot. Evidence collector, not production parser."""
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import stat

SCOPE = [
    ('claude', 'CLAUDE_CONFIG_DIR', '.claude', 'CLAUDE.md'),
    ('codex', 'CODEX_HOME', '.codex', 'AGENTS.md'),
    ('gemini', 'GEMINI_CONFIG_DIR', '.gemini', 'GEMINI.md'),
    ('pi', 'PI_CODING_AGENT_DIR', '.pi/agent', 'AGENTS.md'),
    ('cursor-routing', None, '.cursor/rules', 'sshlg-routing.mdc'),
    ('cursor-wait', None, '.cursor/rules', 'sshlg-wait.mdc'),
]
MARKER = re.compile(r'<!--[ \t]*([A-Za-z0-9_.:-]+):(BEGIN|END|OPTOUT)(?=[ \t>\r\n])')

def markers(text):
    """Lexical marker inventory only, including markers in examples if present."""
    groups = {}
    for match in MARKER.finditer(text):
        ident, kind = match.groups()
        group = groups.setdefault(ident, {'id': ident, 'BEGIN': [], 'END': [], 'OPTOUT': []})
        group[kind].append(text.count('\n', 0, match.start()) + 1)
    return list(groups.values())

def classify(ident):
    if ident == 'SSHLG:ROUTERS':
        return 'hub-router-surface-not-receipt'
    if ident.startswith('SSHLG:ROUTER:') or ident in ('SSHLG:ROUTERS:MAP', 'SSHLG:ROUTERS:PROTOCOL', 'SSHLG:ROUTERS:TABLE'):
        return 'hub-router-subregion-not-independent-owner'
    if ident == 'SSHLG:RULE:wait-is-not-a-stop':
        return 'hub-wait-surface-requires-receipt-and-consent'
    if ident == 'SSHLG:REPOSITORY-HANDOFF':
        return 'operator-decision-pending-no-writer'
    return 'foreign-or-unknown-no-write-authority'

def inspect(home, env):
    rows = []
    for host, key, rel, name in SCOPE:
        value = env.get(key) if key else None
        root = Path(value) if value else home / rel
        p = root / name
        # Never publish an arbitrary override path, its body, or its environment value.
        alias = '${' + key + '}/' + name if value else '~/' + rel + '/' + name
        row = {'host': host, 'pathAlias': alias, 'rootSource': 'env' if value else 'default', 'writeAuthorized': False}
        try:
            st = p.lstat()
            row['mode'] = oct(stat.S_IMODE(st.st_mode))
            if not stat.S_ISREG(st.st_mode):
                row['state'] = 'UNSUPPORTED_FILE_KIND'
            elif not st.st_mode & 0o444:
                row['state'] = 'UNKNOWN_UNREADABLE'
            else:
                b = p.read_bytes()
                text = b.decode('utf-8')
                after = p.lstat()
                if (st.st_dev, st.st_ino, st.st_size, st.st_mtime_ns) != (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns):
                    row['state'] = 'CHANGED_DURING_READ'
                else:
                    row.update(state='READ', bytes=len(b), sha256=hashlib.sha256(b).hexdigest(), markers=markers(text))
                    for group in row['markers']:
                        group['classification'] = classify(group['id'])
        except FileNotFoundError:
            row['state'] = 'ABSENT'
        except (OSError, UnicodeError) as exc:
            row.update(state='UNKNOWN', errorType=type(exc).__name__)
        rows.append(row)
    return rows

if __name__ == '__main__':
    # stdout only; caller chooses an evidence destination. No mkdir, backups, locks,
    # host writes, policy/receipt read, external command or recursive home scan.
    print(json.dumps({'schema': 'b174-observation/1', 'asOf': dt.datetime.now(dt.timezone.utc).isoformat(),
                      'scope': 'six named global instruction files only; lexical markers, no ownership certification',
                      'rows': inspect(Path.home(), os.environ)}, indent=2))
