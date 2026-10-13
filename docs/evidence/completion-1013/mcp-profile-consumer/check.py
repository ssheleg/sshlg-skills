#!/usr/bin/env python3
"""Draft-only semantic fixture. No files/config/network/process mutation."""
import copy
import json
import re


def unique_object(pairs):
    out = {}
    for key, value in pairs:
        if key in out:
            raise ValueError('duplicate property')
        out[key] = value
    return out


def opaque(value):
    return isinstance(value, str) and re.fullmatch(r"[a-z][a-z0-9_-]*(?::[a-z0-9][a-z0-9_-]*)?", value) is not None


def classify(raw, project):
    data = json.loads(raw, object_pairs_hook=unique_object)
    if not isinstance(data, dict) or set(data) != {'owner', 'contract', 'revision', 'project', 'broker', 'servers'}:
        raise ValueError('unsupported profile shape')
    if data['owner'] != 'observatory' or data['contract'] != 'draft-fixture/1':
        raise ValueError('unknown owner contract')
    if not isinstance(data['revision'], str) or not data['revision'].strip():
        raise ValueError('missing revision')
    if data['project'] != project or not opaque(project):
        raise ValueError('wrong project')
    if type(data['broker']) is not bool or not isinstance(data['servers'], list):
        raise ValueError('unsupported capabilities')
    seen, rows = set(), []
    for row in data['servers']:
        if not isinstance(row, dict) or set(row) != {'id', 'state', 'minimum', 'observed', 'reason'}:
            raise ValueError('unsupported server shape')
        sid = row['id']
        if not opaque(sid) or sid in seen:
            raise ValueError('ambiguous server identity')
        seen.add(sid)
        if row['state'] not in ('on', 'off', 'on-demand') or type(row['minimum']) is not bool:
            raise ValueError('unsupported desired state')
        if row['observed'] not in ('reachable', 'unavailable', 'unknown'):
            raise ValueError('unsupported observed state')
        if not isinstance(row['reason'], str) or not row['reason'].strip():
            raise ValueError('missing reason')
        if row['minimum'] and row['state'] != 'on':
            state = 'CONFLICT_MINIMUM'
        elif row['state'] == 'off':
            state = 'DECLARED_OFF_EXISTING_SESSION_UNKNOWN'
        elif row['state'] == 'on-demand' and not data['broker']:
            state = 'UNSUPPORTED_ON_DEMAND'
        else:
            state = {'reachable': 'OBSERVED_REACHABLE', 'unavailable': 'UNAVAILABLE', 'unknown': 'NOT_VERIFIED'}[row['observed']]
        rows.append({'id': sid, 'status': state})
    return rows


def main():
    base = {'owner': 'observatory', 'contract': 'draft-fixture/1', 'revision': 'synthetic-r1',
            'project': 'synthetic-project', 'broker': True,
            'servers': [{'id': 'example', 'state': 'on', 'minimum': False,
                         'observed': 'reachable', 'reason': 'synthetic requirement'}]}
    checks = 0
    for state, minimum, broker, observed, expected in [
        ('on', False, True, 'reachable', 'OBSERVED_REACHABLE'),
        ('on', True, False, 'reachable', 'OBSERVED_REACHABLE'),
        ('off', False, False, 'reachable', 'DECLARED_OFF_EXISTING_SESSION_UNKNOWN'),
        ('on-demand', False, True, 'reachable', 'OBSERVED_REACHABLE'),
        ('on-demand', False, False, 'reachable', 'UNSUPPORTED_ON_DEMAND'),
        ('on', False, True, 'unavailable', 'UNAVAILABLE'),
        ('on', False, True, 'unknown', 'NOT_VERIFIED'),
        ('off', True, True, 'reachable', 'CONFLICT_MINIMUM'),
        ('on-demand', True, True, 'reachable', 'CONFLICT_MINIMUM')]:
        data = copy.deepcopy(base); data['broker'] = broker
        data['servers'][0].update(state=state, minimum=minimum, observed=observed)
        assert classify(json.dumps(data), 'synthetic-project')[0]['status'] == expected
        checks += 1
    for mutate in [lambda d: d.update(project='different'), lambda d: d.update(contract='future/2'),
                   lambda d: d.update(revision=''), lambda d: d.update(owner='other'),
                   lambda d: d['servers'].append(copy.deepcopy(d['servers'][0])),
                   lambda d: d['servers'][0].update(headers={'secret': 'synthetic'}),
                   lambda d: d['servers'][0].update(state='maybe'),
                   lambda d: d['servers'][0].update(observed='declared'),
                   lambda d: d['servers'][0].update(minimum=1),
                   lambda d: d['servers'][0].update(reason=''),
                   lambda d: d.update(env={}), lambda d: d.update(broker='yes'),
                   lambda d: d['servers'][0].update(id='   '),
                   lambda d: d['servers'][0].update(id='/private/path\n'),
                   lambda d: d.update(project='   ')]:
        bad = copy.deepcopy(base); mutate(bad)
        try: classify(json.dumps(bad), 'synthetic-project')
        except ValueError: checks += 1
        else: raise AssertionError('bad input accepted')
    duplicate = json.dumps(base).replace('"revision": "synthetic-r1"', '"revision": "synthetic-r1", "revision": "synthetic-r2"')
    try: classify(duplicate, 'synthetic-project')
    except ValueError: checks += 1
    else: raise AssertionError('duplicate property accepted')
    print(json.dumps({'checks': checks, 'result': 'PASS', 'scope': 'draft synthetic semantics only', 'production_config_reads': 0, 'writes': 0}))


if __name__ == '__main__':
    main()
