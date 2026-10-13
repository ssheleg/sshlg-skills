#!/usr/bin/env python3
"""Offline corpus/label checks, optional committed-source replay; no provider calls."""
import argparse
import collections
import copy
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent

def validate(data, source, original):
    assert data['schema'] == 'explicit-corpus-screening/2'
    assert data['arms'] == original['arms'], 'comparison arms changed'
    ids = {x['id'] for x in data['arms']['full']}
    assert len(ids) == len(data['arms']['full']) == 39
    assert ids == {x['id'] for x in data['arms']['concise']} == set(source['skills'])
    assert data['source_commit'] == original['source_commit'] == source['hub_source_commit']
    cases = data['cases']
    assert data['n'] == len(cases) and cases
    assert len({x['id'] for x in cases}) == len(cases), 'duplicate case ID'
    assert len({x['prompt'] for x in cases}) == len(cases), 'duplicate prompt'
    pairs = collections.defaultdict(set)
    for case in cases:
        assert case['language'] in ('en', 'ru') and case['prompt'].strip()
        assert case['kind'] in ('primary', 'neighbor', 'composition', 'ambiguous', 'negative')
        assert case['source_skills'] and set(case['source_skills']) <= ids and case['rationale'].strip()
        accepted = case['accepted_sets']
        assert accepted and len({tuple(sorted(x)) for x in accepted}) == len(accepted)
        for option in accepted:
            assert len(option) == len(set(option)) and len(option) <= data['selection_contract']['max_selections']
            assert set(option) <= ids and set(option) <= set(case['source_skills'])
        if case['kind'] == 'negative':
            assert accepted == [[]]
        elif case['kind'] == 'primary':
            assert len(accepted) == len(accepted[0]) == 1
            pairs[accepted[0][0]].add(case['language'])
            assert case['group'] == 'primary-' + accepted[0][0]
        elif case['kind'] == 'composition':
            assert all(len(x) >= 2 for x in accepted)
        elif case['kind'] == 'ambiguous':
            assert len(accepted) > 1
    assert set(pairs) == ids and all(v == {'en', 'ru'} for v in pairs.values()), 'bilingual primary coverage missing'
    for sid, row in source['skills'].items():
        assert row['path'] == f"plugins/{row['member']}/skills/{sid}/SKILL.md"
        assert len(row['commit']) == 40 and len(row['sha256']) == 64
        a = row['body_anchor']
        assert a['start_line'] > 1 and a['end_line'] >= a['start_line']
        assert a['excerpt'].startswith('## ') and a['excerpt'].strip()
        assert row['commit'] in row['url'] and row['path'] in row['url']
    return collections.Counter(x['kind'] for x in cases)

def score(case, prediction, catalogue):
    if not isinstance(prediction, list) or any(not isinstance(x, str) for x in prediction):
        return 'INVALID_OUTPUT'
    if len(prediction) != len(set(prediction)) or not set(prediction) <= catalogue:
        return 'INVALID_OUTPUT'
    return 'PASS' if frozenset(prediction) in {frozenset(x) for x in case['accepted_sets']} else 'FAIL'

def verify_sources(source, parent):
    for row in source['skills'].values():
        options = [parent / row['member'], parent / (row['member'] + '-skill'), parent / 'sshlg-skills' / 'skills' / row['member']]
        owner = next(p for p in options if (p / '.git').exists())
        raw = subprocess.check_output(['git', 'show', row['commit'] + ':' + row['path']], cwd=owner)
        assert hashlib.sha256(raw).hexdigest() == row['sha256']
        a = row['body_anchor']; lines = raw.decode().splitlines()
        assert '\n'.join(lines[a['start_line']-1:a['end_line']]) == a['excerpt']
        assert a['start_line'] > next(i+1 for i in range(1, len(lines)) if lines[i] == '---')

def controls(data, source, original):
    # Corrupt a copy, require rejection, and preserve the healthy fixture.
    for mutate in [lambda d: d['cases'].pop(),
                   lambda d: d['cases'][1].update(id=d['cases'][0]['id']),
                   lambda d: d['cases'][0].update(accepted_sets=[['unknown']]),
                   lambda d: d['cases'][0].update(accepted_sets=[['agent-sync', 'agent-sync']]),
                   lambda d: d['arms']['concise'][0].update(description='changed')]:
        bad = copy.deepcopy(data); mutate(bad)
        try: validate(bad, source, original)
        except AssertionError: pass
        else: raise AssertionError('corpus corruption accepted')
    ids = set(source['skills'])
    primary = data['cases'][0]; expected = primary['accepted_sets'][0]
    other = next(x for x in ids if x not in expected)
    assert score(primary, expected, ids) == 'PASS'
    assert score(primary, [], ids) == score(primary, expected+[other], ids) == 'FAIL'
    assert score(primary, expected*2, ids) == score(primary, ['unknown'], ids) == 'INVALID_OUTPUT'
    ambiguous = next(x for x in data['cases'] if x['kind'] == 'ambiguous')
    assert all(score(ambiguous, p, ids) == 'PASS' for p in ambiguous['accepted_sets'])
    composition = next(x for x in data['cases'] if x['kind'] == 'composition')
    assert score(composition, list(reversed(composition['accepted_sets'][0])), ids) == 'PASS'
    assert score(composition, composition['accepted_sets'][0][:1], ids) == 'FAIL'
    negative = next(x for x in data['cases'] if x['kind'] == 'negative')
    assert score(negative, [], ids) == 'PASS' and score(negative, [other], ids) == 'FAIL'

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify-git', type=Path, help='parent directory of existing owner repositories; read committed blobs only')
    args = parser.parse_args()
    data = json.loads((ROOT/'description-screening-fixture-v2.json').read_text())
    source = json.loads((ROOT/'description-screening-sources-v2.json').read_text())
    original = json.loads((ROOT/'description-screening-fixture.json').read_text())
    counts = validate(data, source, original)
    controls(data, source, original)
    if args.verify_git: verify_sources(source, args.verify_git)
    print(json.dumps({'status':'PASS','cases':data['n'],'skills':len(source['skills']),'kinds':dict(counts),'corruption_plants':5,'scorer_controls':'PASS','committed_sources_verified':bool(args.verify_git)}, sort_keys=True))
