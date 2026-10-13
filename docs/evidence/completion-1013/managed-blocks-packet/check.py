#!/usr/bin/env python3
"""Bounded packet checks; no product verification or live HOME mutation."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('b174_collect', HERE / 'collect.py')
C = importlib.util.module_from_spec(spec)
spec.loader.exec_module(C)
passed=[]
def check(name, condition):
    if not condition:
        raise AssertionError(name)
    passed.append(name)

args=argparse.ArgumentParser()
args.add_argument('--observatory-repo', type=Path)
args=args.parse_args()
with tempfile.TemporaryDirectory(prefix='b174-packet-') as td:
    home=Path(td)
    check('all six absent targets stay distinct', all(r['state']=='ABSENT' for r in C.inspect(home, {})))
    check('absent preview creates nothing', list(home.iterdir())==[])
    root=home/'.claude';root.mkdir();p=root/'CLAUDE.md'
    body='PRIVATE_FIXTURE_CANARY\n<!-- SSHLG:ROUTERS:BEGIN — managed by example -->\n<!-- SSHLG:ROUTERS:MAP:BEGIN -->\nx\n<!-- SSHLG:ROUTERS:MAP:END -->\n<!-- SSHLG:ROUTERS:END -->\n<!-- OTHER:EXAMPLE:BEGIN -->\ny\n<!-- OTHER:EXAMPLE:END -->\n'
    p.write_text(body);before=p.stat()
    rows=C.inspect(home,{})
    check('nested and foreign markers retained',len(rows[0]['markers'])==3)
    check('private content absent from output','PRIVATE_FIXTURE_CANARY' not in json.dumps(rows))
    after=p.stat()
    check('inspection preserves bytes mode mtime inode',p.read_text()==body and (before.st_mode,before.st_mtime_ns,before.st_ino)==(after.st_mode,after.st_mtime_ns,after.st_ino))
    check('no backups journal or sibling writes',sorted(str(x.relative_to(home)) for x in home.rglob('*'))==['.claude','.claude/CLAUDE.md'])
    p.write_bytes(b'\xff')
    check('invalid UTF8 unknown not empty',C.inspect(home,{})[0]['state']=='UNKNOWN')
    p.write_text('private');p.chmod(0)
    check('unreadable unknown not absent',C.inspect(home,{})[0]['state']=='UNKNOWN_UNREADABLE')
    p.chmod(0o600);p.unlink();p.symlink_to(home/'missing')
    check('dangling symlink unsupported not absent',C.inspect(home,{})[0]['state']=='UNSUPPORTED_FILE_KIND')
    alternate=home/'nonpublic-root';alternate.mkdir();(alternate/'AGENTS.md').write_text('PRIVATE_FIXTURE_CANARY')
    rows=C.inspect(home,{'CODEX_HOME':str(alternate)})
    check('override root selected but not publicly exposed',rows[1]['state']=='READ' and rows[1]['pathAlias']=='${CODEX_HOME}/AGENTS.md' and str(alternate) not in json.dumps(rows))
check('unknown namespace cannot acquire authority',C.classify('SSHLG:UNKNOWN')=='foreign-or-unknown-no-write-authority')
check('handoff remains operator owned decision',C.classify('SSHLG:REPOSITORY-HANDOFF')=='operator-decision-pending-no-writer')
check('duplicates retained as observations',len(C.markers('<!-- A:B:BEGIN -->\n<!-- A:B:BEGIN -->')[0]['BEGIN'])==2)
inv=json.loads((HERE/'inventory.json').read_text())
check('snapshot six targets no write authorization',len(inv['rows'])==6 and all(r['writeAuthorized'] is False for r in inv['rows']))
outer=[g for r in inv['rows'] for g in r.get('markers',[]) if 'subregion' not in g['classification']]
inner=[g for r in inv['rows'] for g in r.get('markers',[]) if 'subregion' in g['classification']]
check('snapshot counts independently derived',len(outer)==10 and len(inner)==90 and all(len(g['BEGIN'])==len(g['END'])==1 for g in outer+inner))
contract=json.loads((HERE/'contract.json').read_text())
check('draft nonimplementation boundary',contract['status']=='PROPOSED_NOT_IMPLEMENTED')
check('state transition destinations declared',all(s in contract['operation']['states'] for nexts in contract['operation']['transitions'].values() for s in nexts))
manifest=json.loads((HERE/'sources.json').read_text())
source_checked=[];source_skipped=[]
for r in manifest['sources']:
    cwd=HERE if r['repo']=='ssheleg/sshlg-skills' else args.observatory_repo
    if cwd is None:
        source_skipped.append(r['path']);continue
    b=subprocess.check_output(['git','-C',str(cwd),'show',r['commit']+':'+r['path']])
    check('source '+r['repo']+'/'+r['path'],hashlib.sha256(b).hexdigest()==r['sha256'])
    source_checked.append(r['path'])
print(json.dumps({'status':'PASS','scope':'packet collector/source controls only; product implementation NOT_RUN','checks':passed,'sourceChecked':source_checked,'sourceSkipped':source_skipped},indent=2))
