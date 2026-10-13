#!/usr/bin/env python3
"""Append a committed-board disposition snapshot; never closes rows or rewrites history."""
import argparse
import collections
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
spec = importlib.util.spec_from_file_location('inventory', HERE / 'inventory.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def git(root, *args):
    return subprocess.check_output(['git', '-C', str(root), *args], text=True).strip()


def reconcile():
    original = json.loads((HERE / 'inventory.json').read_text())
    manifest = json.loads(git(ROOT, 'show', 'HEAD:skills.json'))
    owners = [('hub', ROOT, git(ROOT, 'rev-parse', 'HEAD'), 'ssheleg/sshlg-skills')]
    links = {line.split('\t', 1)[1]: line.split()[2] for line in git(ROOT, 'ls-tree', '-r', 'HEAD').splitlines() if line.startswith('160000 ')}
    owners += [(m['name'], ROOT / m['dir'], links[m['dir']], m['repo']) for m in manifest['skills']]
    current, sources = {}, []
    for owner, directory, sha, remote in owners:
        rel = 'docs/evidence/backlog.md'
        source = {'owner': owner, 'commit': sha, 'path': rel, 'url': f'https://github.com/{remote}/blob/{sha}/{rel}'}
        exists = subprocess.run(['git', '-C', str(directory), 'cat-file', '-e', sha+':'+rel], capture_output=True).returncode == 0
        if not exists:
            source['status'] = 'ABSENT_AT_PIN'; sources.append(source); continue
        body = git(directory, 'show', sha+':'+rel)
        parsed = module.rows(body)
        source.update(status='READ', sha256=hashlib.sha256(body.encode()).hexdigest(), rows=len(parsed))
        sources.append(source)
        for row in parsed:
            key = owner+':'+row['id']
            if key in current:
                raise ValueError('duplicate owner-qualified identity: '+key)
            current[key] = {**row, 'owner': owner, 'commit': sha, 'url': source['url']+'#L'+str(row['line'])}
    before = {r['owner']+':'+r['id']: r for r in original['items']}
    assert len(before) == len(original['items'])
    dispositions = []
    for key, old in sorted(before.items()):
        now = current.get(key)
        state = 'MISSING_REQUIRES_RECONCILIATION' if now is None else ('DOCUMENTED_OPEN' if now['open'] else 'DOCUMENTED_CLOSED_REQUIRES_ACCEPTANCE_LINK')
        dispositions.append({'identity': key, 'original_commit': old['commit'], 'original_source': old['source'], 'disposition': state, 'current': now})
    new = [{'identity': key, 'current': row} for key, row in sorted(current.items()) if key not in before and row['open']]
    assert {x['identity'] for x in dispositions} == set(before)
    return {'schema': 'board-disposition/1', 'hub_commit': owners[0][2],
            'original_sha256': hashlib.sha256((HERE/'inventory.json').read_bytes()).hexdigest(),
            'scope': 'Committed board states only. Closed prose is not implementation, release, installation or runtime acceptance. Original inventory identities retained losslessly.',
            'counts': {'original': len(before), 'preserved': len(dispositions), 'new_documented_open': len(new), 'dispositions': dict(collections.Counter(r['disposition'] for r in dispositions))},
            'sources': sources, 'dispositions': dispositions, 'new_documented_open': new}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    data = reconcile()
    # A dated cut never silently overwrites its predecessor.
    with args.output.open('x') as output:
        json.dump(data, output, ensure_ascii=False, indent=2); output.write('\n')
    print(json.dumps(data['counts'], sort_keys=True))


if __name__ == '__main__':
    main()
