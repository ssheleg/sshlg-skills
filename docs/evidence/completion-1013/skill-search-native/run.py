#!/usr/bin/env python3
"""Frozen native trigger observation; dry plan unless independently admitted."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import random
import signal
import subprocess
import sys
import tempfile
import time
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('native_observer',ROOT.parent/'native-quality-v1/run.py')
r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
b=r.base
r.SKILLS={'make-skill:make-skill','make-skill:skill-search','make-skill:skill-audit'}
INVENTORY={'make-skill:make-skill','make-skill:skill-search'}
r.TOOLS={'Skill'}
r.MAX_TURNS=3
r.RESERVE=0.20
r.TASK_INPUT=24000
BUDGET=3.878996
MAX_CALLS=61
REPORTED_TURN_LIMIT=5
SEED=101327

def source():
    data=json.loads((ROOT/'source.json').read_text())
    assert b.digest((ROOT/'cases.json').read_bytes())==data['cases_sha256']
    for rel,want in data['dependency_hashes'].items():
        assert b.digest((ROOT.parent/rel).read_bytes())==want,'runner dependency changed'
    return data

def plan():
    source();cases=json.loads((ROOT/'cases.json').read_text())['queries']
    assert len(cases)==20 and len({q['id'] for q in cases})==20
    tasks=[{'phase':'task','case_id':q['id'],'repetition':i,'prompt':q['query'],'expected':q['should_trigger']} for q in cases for i in range(3)]
    random.Random(SEED).shuffle(tasks)
    return [{'phase':'readiness','prompt':r.READY_PROMPT}]+tasks

def materialize(repo,workspace):
    data=source();prefix=data['plugin']+'/'
    tree=subprocess.check_output(['git','ls-tree','-r',data['commit'],data['plugin']],cwd=repo,text=True)
    modes={row.split('\t',1)[1]:row.split()[0] for row in tree.splitlines()}
    assert set(modes)=={row['path'] for row in data['files']}
    assert not workspace.exists();workspace.mkdir(mode=0o700);hashes={}
    for row in data['files']:
        path=row['path'];assert path.startswith(prefix) and '..' not in Path(path).parts and modes[path] in ('100644','100755')
        body=subprocess.check_output(['git','show',data['commit']+':'+path],cwd=repo)
        assert len(body)==row['bytes'] and b.digest(body)==row['sha256']
        if path.endswith('/SKILL.md'):
            assert b'!`' not in body and b'context: fork' not in body
        relative='plugin/'+path[len(prefix):];dest=workspace/relative
        dest.parent.mkdir(parents=True,exist_ok=True,mode=0o700);dest.write_bytes(body);dest.chmod(0o600);hashes[relative]=b.digest(body)
    return hashes

def score(calls,cases=None):
    result=[]
    for case in (json.loads((ROOT/'cases.json').read_text())['queries'] if cases is None else cases):
        rows=[x for x in calls if x.get('case_id')==case['id'] and x.get('evaluation_status')=='EXECUTED']
        assert len(rows)<=3
        match=sum(('make-skill:skill-search' in x['native']['skill_loads'])==case['should_trigger'] for x in rows)
        result.append({'case_id':case['id'],'expected':case['should_trigger'],'valid_repetitions':len(rows),'matching_repetitions':match,'verdict':('PASS' if match>=2 else 'FAIL') if len(rows)==3 else 'NOT_SCORED'})
    return result

def check_admission():
    admission=json.loads((ROOT/'admission.json').read_text())
    assert admission['status']=='ADMITTED' and admission['runner_sha256']==b.digest(Path(__file__).read_bytes())
    assert admission['source_sha256']==b.digest((ROOT/'source.json').read_bytes())
    assert admission['max_calls']==MAX_CALLS and admission['budget_usd']==BUDGET and admission['independent_review']=='PASS'
    return b.digest((ROOT/'admission.json').read_bytes())

def binding():
    admission_hash=check_admission();source()
    return {'admission':admission_hash,'runner':b.digest(Path(__file__).read_bytes()),'source':b.digest((ROOT/'source.json').read_bytes()),'cases':b.digest((ROOT/'cases.json').read_bytes())}

def execute(args):
    frozen=binding();admission_hash=frozen['admission'];items=plan();assert len(items)==MAX_CALLS
    frozen_cases=json.loads((ROOT/'cases.json').read_text())['queries']
    assert binding()==frozen,'protocol_changed_during_plan'
    if args.output.exists() or args.output.with_name(args.output.name+'.pending').exists():raise ValueError('receipt_exists')
    private=args.private_dir
    if not private.is_absolute() or private.is_symlink() or private.exists():raise ValueError('private_directory_must_be_absolute_and_new')
    if subprocess.run(['git','rev-parse','--show-toplevel'],cwd=private.parent,capture_output=True).returncode==0:raise ValueError('raw_inside_git')
    private.mkdir(mode=0o700)
    receipt={'schema':'skill-search-native-run/1','status':'PREFLIGHT','calls':[],'reported_list_usd':0.0,'cost_incomplete':False,'max_calls':MAX_CALLS,'budget_usd':BUDGET,'seed':SEED,'source_commit':source()['commit'],'runner_sha256':b.digest(Path(__file__).read_bytes()),'source_manifest_sha256':b.digest((ROOT/'source.json').read_bytes()),'admission_sha256':admission_hash,'prior_known_pilots_list_usd':2.1959482,'prior_protocol_a_list_usd':0.0174134,'prior_protocol_b_list_usd':0.1035906,'protocol':'C','max_cumulative_cli_invocations':64,'scope':'Restricted native loading only; no executed catalogue search or artifact-quality claim; list estimate is not subscription billing.'}
    b.save_receipt(args.output,receipt)
    try:r.preflight(private)
    except Exception as exc:
        receipt.update(status='STOPPED_PREFLIGHT',error_class=type(exc).__name__);b.save_receipt(args.output,receipt);return 1
    env=dict(os.environ,CLAUDE_CODE_DISABLE_AUTO_MEMORY='1',CLAUDE_CODE_MAX_OUTPUT_TOKENS='900')
    receipt['status']='RUNNING'
    for index,item in enumerate(items):
        try:assert binding()==frozen,'protocol_changed_before_request'
        except Exception as exc:
            receipt.update(status='STOPPED_PROTOCOL_CHANGED',error_class=type(exc).__name__);break
        if receipt['reported_list_usd']+r.RESERVE>BUDGET:receipt['status']='STOPPED_BUDGET';break
        record={k:v for k,v in item.items() if k not in ('prompt','expected')}
        record.update(index=index,state='STARTED',prompt_sha256=b.digest(item['prompt']),started_at_utc=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()))
        receipt['calls'].append(record);receipt['cost_incomplete']=True;b.save_receipt(args.output,receipt)
        folder=private/str(index);folder.mkdir(mode=0o700);b.private_write(folder/'prompt.txt',item['prompt'])
        try:
            with tempfile.TemporaryDirectory(prefix='sshlg-search-trigger-') as temp:
                workspace=Path(temp)/'work';hashes=materialize(args.source_repo,workspace)
                with os.fdopen(os.open(folder/'stdout.jsonl',os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'wb') as out,os.fdopen(os.open(folder/'stderr.log',os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'wb') as err:
                    proc=subprocess.Popen(r.command(workspace,item['phase'])+[item['prompt']],cwd=workspace,env=env,stdout=out,stderr=err,start_new_session=True)
                    try:code=proc.wait(timeout=r.TIMEOUT)
                    except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL);proc.wait();code='TIMEOUT'
                assert binding()==frozen,'protocol_changed_during_request'
                raw=(folder/'stdout.jsonl').read_bytes();result=r.inspect(raw,code,workspace,item['phase'],expected_inventory=INVENTORY,reported_turn_limit=REPORTED_TURN_LIMIT);r.m.verify(workspace,hashes)
                if isinstance(result.get('native'),dict):result['native'].pop('google_auth_loaded',None)
                if result['evaluation_status']=='EXECUTED':
                    blocks=r.visible_text([json.loads(line) for line in raw.splitlines() if line.strip()]);b.private_write(folder/'assistant-text.json',b.encode({'blocks':blocks,'text':'\n\n'.join(x['text'] for x in blocks)}))
                record['workspace_manifest_sha256']=b.digest(b.encode(hashes))
        except Exception as exc:
            record.update(state='UNKNOWN_EFFECT',evaluation_status='TEST_ERROR',error_class='execution_or_workspace_integrity',exception_type=type(exc).__name__)
            receipt.update(status='STOPPED_EXECUTION_ERROR',cost_incomplete=True);break
        record.update(result,state='FINISHED',stdout_sha256=b.digest(raw),stderr_sha256=b.digest((folder/'stderr.log').read_bytes()))
        if result['cost_usd'] is None:receipt['cost_incomplete']=True
        else:receipt['reported_list_usd']+=result['cost_usd'];receipt['cost_incomplete']=False
        b.save_receipt(args.output,receipt)
        print(b.encode({k:record.get(k) for k in ('index','phase','case_id','repetition','evaluation_status','error_class','cost_usd')}),flush=True)
        if result['evaluation_status']=='TEST_ERROR':receipt['status']='STOPPED_TEST_ERROR';break
        if receipt['reported_list_usd']>BUDGET:receipt['status']='STOPPED_BUDGET_OVERSHOOT';break
    else:receipt['status']='COMPLETED'
    try:assert binding()==frozen,'protocol_changed_before_scoring'
    except Exception as exc:receipt.update(status='STOPPED_PROTOCOL_CHANGED',error_class=type(exc).__name__)
    receipt['scores']=score(receipt['calls'],frozen_cases);receipt['planned_not_started']=len(items)-len(receipt['calls']);b.save_receipt(args.output,receipt)
    return 0 if receipt['status']=='COMPLETED' else 1

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--execute',action='store_true');parser.add_argument('--source-repo',type=Path);parser.add_argument('--private-dir',type=Path);parser.add_argument('--output',type=Path);args=parser.parse_args()
    if not args.execute:
        print(json.dumps({'provider_calls':0,'plan':[{k:v for k,v in x.items() if k!='prompt'} for x in plan()],'budget_usd':BUDGET},indent=2));return 0
    if any(x is None for x in (args.source_repo,args.private_dir,args.output)):parser.error('execution requires source-repo, private-dir and output')
    return execute(args)
if __name__=='__main__':raise SystemExit(main())
