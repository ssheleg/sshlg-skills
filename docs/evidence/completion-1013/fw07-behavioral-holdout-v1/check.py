#!/usr/bin/env python3
"""Offline-only corpus/source checks. This file cannot invoke a model or install anything."""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import random
import re
import subprocess

ROOT = Path(__file__).resolve().parent

def digest(data):
    return hashlib.sha256(data).hexdigest()

def read(name):
    return json.loads((ROOT / name).read_text())

def packet_check():
    manifest = read('frozen-manifest.json')
    paths = {str(p.relative_to(ROOT)) for p in ROOT.rglob('*') if p.is_file()}
    assert not any(p.is_symlink() for p in ROOT.rglob('*')), 'packet symlink'
    assert paths == set(manifest['files']) | {'frozen-manifest.json'}, 'packet population drift'
    for name, row in manifest['files'].items():
        data = (ROOT / relative(name)).read_bytes()
        assert {'bytes':len(data),'sha256':digest(data)} == row, 'packet hash drift: ' + name

def relative(name):
    p = Path(name)
    assert not p.is_absolute() and '..' not in p.parts and str(p) == name, 'unsafe path'
    return p

def validate(corpus, protocol, fixtures, sources):
    cases = corpus['cases']
    assert len(cases) == corpus['n_unique_tasks'] == 8
    assert len({c['id'] for c in cases}) == len(cases), 'duplicate case'
    assert {c['cluster'] for c in cases} == {'entry', 'resume', 'short_path', 'custom_profile', 'failure_recovery'}
    assert {c['language'] for c in cases} == {'en', 'ru'}
    assert protocol['authorized_provider_calls'] == 0
    assert protocol['design']['task_cells'] == 2 * len(cases)
    assert protocol['design']['max_cli_invocations'] == 2 * len(cases) + 2
    assert protocol['budget_proposal']['old_program_budget_reuse'] is False
    assert protocol['budget_proposal']['retries'] == protocol['budget_proposal']['judge_model_calls'] == 0
    assert set(protocol['host']['tools']) == {'Read', 'Skill', 'Glob', 'Grep'}
    assert protocol['runner_status'].startswith('NOT_IMPLEMENTED')
    allowed = set()
    for c in cases:
        assert c['prompt'] and c['required'] and c['forbidden'] and c['contract_files']
        for contract in c['contract_files']:
            relative(contract)
            key = 'skills/task-pipeline/' + contract
            assert key in sources['control_files'] or key in sources['candidate_files'], 'unknown contract'
        assert c['id'] not in c['prompt'], 'case-id hint'
        assert len(c['files']) == len(set(c['files']))
        for f in c['files']:
            relative(f)
            key = 'fixtures/' + c['id'] + '/' + f
            assert key in fixtures['files'], 'unbound fixture'
            allowed.add(key)
        assert set(payload(c, protocol)) == {'prompt'}, 'label-bearing payload'
        for field in ('required', 'forbidden', 'cluster', 'arm', 'id', 'contract_files'):
            assert field not in payload(c, protocol)
    assert set(fixtures['files']) == allowed, 'fixture population mismatch'
    actual = {str(p.relative_to(ROOT)) for p in (ROOT / 'fixtures').rglob('*') if p.is_file()}
    assert actual == allowed and not any(p.is_symlink() for p in (ROOT / 'fixtures').rglob('*'))
    for rel, row in fixtures['files'].items():
        b = (ROOT / relative(rel)).read_bytes()
        assert len(b) == row['bytes'] and digest(b) == row['sha256'], 'fixture hash'
    custom = read('fixtures/q79/pipeline.json')
    assert [s['id'] for s in custom['stages']] == [0, 7, 10]
    assert set(custom['kernel']) >= {'scope', 'evidence', 'deps', 'resume'}
    assert next(c for c in cases if c['id'] == 'q86')['token_comparison'] is False
    for arm in ('control_files', 'candidate_files'):
        assert sources[arm]
        for path, row in sources[arm].items():
            relative(path)
            assert row['bytes'] > 0 and len(row['sha256']) == 64
    return len(cases)

def payload(case, protocol):
    # A future runner may pass ONLY this dict and the separately copied fixture files.
    return {'prompt': protocol['task_envelope'] + case['prompt']}

def plan(corpus, protocol):
    rng = random.Random(protocol['design']['seed'])
    arms = ['control', 'candidate']; rng.shuffle(arms)
    result = [{'phase': 'readiness', 'arm': a} for a in arms]
    cases = list(corpus['cases']); rng.shuffle(cases)
    for c in cases:
        arms = ['control', 'candidate']; rng.shuffle(arms)
        result.extend({'phase': 'task', 'id': c['id'], 'arm': a} for a in arms)
    return result

def source_check(repo, sources):
    # Local immutable Git-object reads only. No fetch, checkout, model or network.
    repo = str(Path(repo).resolve())
    prefix = sources['plugin_prefix']
    def files(sha):
        entries = subprocess.check_output(['git', '-C', repo, 'ls-tree', '-rz', sha, prefix]).decode().split('\0')
        result = {}
        for entry in entries:
            if not entry: continue
            meta, path = entry.split('\t'); mode, kind, _ = meta.split()
            assert kind == 'blob' and mode in ('100644', '100755'), 'unsupported source kind'
            result[path[len(prefix):]] = subprocess.check_output(['git', '-C', repo, 'show', sha + ':' + path])
        return result
    control = files(sources['corrected_pre_extraction_base'])
    candidate = files(sources['reviewed_corrected_candidate'])
    overlay = read('common-correction.json')
    assert overlay['reviewed_candidate'] == sources['reviewed_corrected_candidate']
    for change in overlay['replacements']:
        key = change['control_path']; before = control[key].decode()
        assert before.count(change['old']) == 1 and change['new'] not in before
        control[key] = before.replace(change['old'], change['new'], 1).encode()
        assert change['new'] in candidate[change['candidate_path']].decode()
    for name, values in [('control_files', control), ('candidate_files', candidate)]:
        actual = {k: {'bytes': len(v), 'sha256': digest(v)} for k, v in sorted(values.items())}
        assert actual == sources[name], name + ' source mismatch'
    profile_key = 'skills/task-pipeline/pipeline.example.json'
    profiles = [json.loads(values[profile_key]) for values in (control,candidate)]
    assert profiles[0] == profiles[1], 'default profile intervention'
    stages = {s['id']: (s['name'],s['gate']['type']) for s in profiles[0]['stages']}
    ledger_rows = 0
    for case in read('cases.json')['cases']:
        path = ROOT / 'fixtures' / case['id'] / '.task-pipeline/run.md'
        if not path.exists() or case['cluster'] == 'custom_profile': continue
        for line in path.read_text().splitlines():
            if not line.startswith('stage:'): continue
            match = re.fullmatch(r'stage: (\d+) (.+) — gate (auto|manual) — verdict (pending|pass|skip) — .+',line)
            assert match, 'invalid fixture ledger'
            assert stages[int(match[1])] == (match[2],match[3]), 'fixture stage/gate differs from default source'
            ledger_rows += 1
    return {'control_files': len(control), 'candidate_files': len(candidate), 'common_corrections': len(overlay['replacements']), 'default_ledger_rows':ledger_rows}

def self_test(c, p, f, s):
    plants = [
        ('duplicate id', lambda x: x[0]['cases'][1].update(id=x[0]['cases'][0]['id'])),
        ('missing rubric', lambda x: x[0]['cases'][0].update(required=[])),
        ('unknown contract', lambda x: x[0]['cases'][0]['contract_files'].append('references/missing.md')),
        ('case hint', lambda x: x[0]['cases'][0].update(prompt='q11 reveals a label')),
        ('unsafe path', lambda x: x[0]['cases'][0]['files'].append('../foreign')),
        ('missing fixture', lambda x: x[2]['files'].pop(next(iter(x[2]['files'])))),
        ('wrong fixture hash', lambda x: x[2]['files'][next(iter(x[2]['files']))].update(sha256='0'*64)),
        ('unauthorized calls', lambda x: x[1].update(authorized_provider_calls=1)),
        ('wrong call count', lambda x: x[1]['design'].update(max_cli_invocations=19)),
        ('old budget reuse', lambda x: x[1]['budget_proposal'].update(old_program_budget_reuse=True)),
        ('mutating tool', lambda x: x[1]['host']['tools'].append('Write')),
    ]
    for label, mutate in plants:
        values = copy.deepcopy([c,p,f,s]); mutate(values)
        try: validate(*values)
        except (AssertionError, KeyError): pass
        else: raise AssertionError('plant accepted: ' + label)
    assert plan(c,p) == plan(c,p)
    cells = plan(c,p)
    assert len(cells) == 18 and len({(x['id'],x['arm']) for x in cells if x['phase']=='task'}) == 16
    return len(plants) + 2

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-repo')
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    packet_check()
    c,p,f,s = [read(n) for n in ('cases.json','protocol.json','fixture-manifest.json','source.json')]
    result = {'status': 'OFFLINE_PACKET_PASS', 'cases': validate(c,p,f,s), 'fixture_files':len(f['files']), 'provider_calls':0, 'runner_execution':'NOT_IMPLEMENTED_NOT_AUTHORIZED'}
    if args.source_repo: result['sources'] = source_check(args.source_repo,s)
    if args.self_test: result['controls'] = self_test(c,p,f,s)
    print(json.dumps(result,sort_keys=True))
