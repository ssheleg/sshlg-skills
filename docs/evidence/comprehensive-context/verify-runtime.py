"""Compare installed runtime to an explicit release; do not alter historical receipts."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('source')
p.add_argument('output', type=Path)
a = p.parse_args()
repo = Path(__file__).resolve().parents[3]
runtime = Path.home() / '.sshlg-skills/runtime'

def git(*args):
    return subprocess.check_output(['git', '-C', str(repo), *args])

source = git('rev-parse', '--verify', a.source + '^{commit}').decode().strip()
paths = git('ls-tree', '-r', '--name-only', source, 'hooks', 'lib').decode().splitlines()
paths = sorted(f for f in paths if f.endswith('.js')) + ['skills.json', 'package.json']
rows = []
for rel in paths:
    expected = git('show', source + ':' + rel)
    actual = (runtime / rel).read_bytes()
    rows.append(dict(file=rel, sha256=hashlib.sha256(actual).hexdigest(), matches=actual == expected))
version = json.loads(git('show', source + ':package.json'))['version']
result = dict(source_commit=source, version=version, files=len(rows), checks=rows)
a.output.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(dict(files=len(rows), mismatches=sum(not r['matches'] for r in rows))))
if not all(r['matches'] for r in rows):
    raise SystemExit('Installed runtime does not match the release source')
