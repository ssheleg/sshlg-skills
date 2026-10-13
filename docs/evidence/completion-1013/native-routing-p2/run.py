#!/usr/bin/env python3
"""Native routing P2 directed diagnostic; dry plan unless independently admitted."""
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
spec=importlib.util.spec_from_file_location('passive_protocol',ROOT.parent/'native-routing-v2/run.py')
p1=importlib.util.module_from_spec(spec);spec.loader.exec_module(p1)
r=p1.r
b=p1.b
BUDGET=2.7814328
MAX_CALLS=2
REPORTED_TURN_LIMIT=11
SEED=1013282
DIRECTED=('b7','k2')


def source():
    data=json.loads((ROOT/'protocol.json').read_text())
    p1.source()
    for rel,want in data['artifact_hashes'].items():
        assert b.digest((ROOT/rel).read_bytes())==want,'protocol dependency changed'
    previous=json.loads((ROOT.parent/'native-routing-v2/results-a.json').read_text())
    assert previous['status']=='COMPLETED' and previous['cost_incomplete'] is False
    assert len(previous['calls'])==8 and abs(previous['reported_list_usd']-0.764935)<1e-9
    assert abs(sum(x['cost_usd'] for x in previous['calls'])-0.764935)<1e-9
    assert all(x['evaluation_status']=='EXECUTED' for x in previous['calls'])
    assert len([x for x in previous['calls'] if x['phase']=='readiness'])==2
    for case in DIRECTED:
        missed=[x for x in previous['calls'] if x.get('case_id')==case]
        assert len(missed)==2 and {x['arm'] for x in missed}=={'full','concise'}
        assert all(x['native']['skill_loads']==[] for x in missed),'P2 scope no longer missed'
    assert data['new_budget_usd']==BUDGET and data['max_new_cli']==MAX_CALLS
    assert abs(data['prior_list_usd']+BUDGET-4.0)<1e-9
    return data

def plan():
    source();cases={x['id']:x for x in json.loads((ROOT.parent/'native-routing-v2/cases.json').read_text())['cases']}
    order=list(DIRECTED);random.Random(SEED).shuffle(order)
    return [{'phase':'task','case_id':name,'arm':'full','prompt':
        'First invoke the Skill tool with skill="'+cases[name]['expected_skill']+'" and wait for its successful result. Then perform the original task below. If the tool is unavailable or denied, state that limitation and do not claim the skill was loaded.\n\nOriginal task:\n'+cases[name]['prompt']} for name in order]

def materialize(repo,workspace,item):
    assert item['phase']=='task' and item['arm']=='full' and item['case_id'] in DIRECTED
    return p1.materialize(repo,workspace,item)

def inspect(raw,code,workspace,phase):
    result=p1.inspect(raw,code,workspace,phase)
    if result['evaluation_status']=='EXECUTED':
        events=[json.loads(line) for line in raw.splitlines() if line.strip()]
        calls=[c for e in events if e.get('type')=='assistant' for c in e['message']['content'] if c.get('type')=='tool_use']
        first=calls[0] if calls else None
        result['directed_first_tool']=None if first is None else {'name':first['name'],'skill':first.get('input',{}).get('skill') if first['name']=='Skill' else None}
    return result

def score(calls,cases):
    expected={x['id']:x['expected_skill'] for x in cases}
    cells=p1.score(calls,cases)['cells']
    by_index={x['index']:x for x in calls}
    for cell in cells:
        call=by_index[cell['index']];first=call.get('directed_first_tool')
        cell['directed_instruction']=('PASS_FIRST_EXPECTED_SKILL' if first=={'name':'Skill','skill':expected[cell['case_id']]} else 'FAIL_FIRST_EXPECTED_SKILL') if call.get('evaluation_status')=='EXECUTED' else 'NOT_SCORED'
        cell['diagnostic']='DIRECTED_ACCESS_ONLY_NOT_PASSIVE_ROUTING'
    return {'cells':cells,'adoption':'NOT_ADOPTED','scope':'Two full-arm directed access diagnostics; original rubric remains independently scored. No passive-selection or compression effect claim.'}

def check_admission():
    admission=json.loads((ROOT/'admission.json').read_text())
    assert admission['status']=='ADMITTED' and admission['runner_sha256']==b.digest(Path(__file__).read_bytes())
    assert admission['protocol_sha256']==b.digest((ROOT/'protocol.json').read_bytes())
    assert admission['max_calls']==MAX_CALLS and admission['budget_usd']==BUDGET and admission['independent_review']=='PASS'
    return b.digest((ROOT/'admission.json').read_bytes())

def binding():
    admission_hash=check_admission();source()
    return {'admission':admission_hash,'runner':b.digest(Path(__file__).read_bytes()),'protocol':b.digest((ROOT/'protocol.json').read_bytes())}


def execute(args):
    frozen=binding();admission_hash=frozen['admission'];items=plan();assert len(items)==MAX_CALLS
    frozen_cases=json.loads((ROOT.parent/'native-routing-v2/cases.json').read_text())['cases']
    assert binding()==frozen,'protocol_changed_during_plan'
    if args.output.exists() or args.output.with_name(args.output.name+'.pending').exists():raise ValueError('receipt_exists')
    private=args.private_dir
    if not private.is_absolute() or private.is_symlink() or private.exists():raise ValueError('private_directory_must_be_absolute_and_new')
    if subprocess.run(['git','rev-parse','--show-toplevel'],cwd=private.parent,capture_output=True).returncode==0:raise ValueError('raw_inside_git')
    private.mkdir(mode=0o700)
    receipt={'schema':'native-routing-directed-run/1','status':'PREFLIGHT','calls':[],'reported_list_usd':0.0,'cost_incomplete':False,'max_calls':MAX_CALLS,'budget_usd':BUDGET,'seed':SEED,'source_commit':source()['member_commit'],'runner_sha256':b.digest(Path(__file__).read_bytes()),'protocol_sha256':b.digest((ROOT/'protocol.json').read_bytes()),'admission_sha256':admission_hash,'prior_known_pilots_list_usd':2.1959482,'prior_native_v1_list_usd':0.4536322,'prior_native_p1_list_usd':0.764935,'prior_native_cli_invocations':16,'protocol':'DIRECTED_NATIVE_P2','max_cumulative_cli_invocations':18,'scope':'Two directed full-arm access diagnostics; loading, temporal relation and original artifact rubric scored separately. No passive routing, compression adoption, further automatic calls or installed changes. List metadata is not subscription billing.'}
    b.save_receipt(args.output,receipt)
    try:r.preflight(private)
    except Exception as exc:
        receipt.update(status='STOPPED_PREFLIGHT',error_class=type(exc).__name__);b.save_receipt(args.output,receipt);return 1
    env=dict(os.environ,CLAUDE_CODE_DISABLE_AUTO_MEMORY='1',CLAUDE_CODE_MAX_OUTPUT_TOKENS='1600')
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
            with tempfile.TemporaryDirectory(prefix='sshlg-native-p2-') as temp:
                workspace=Path(temp)/'work';hashes=materialize(args.source_repo,workspace,item)
                with os.fdopen(os.open(folder/'stdout.jsonl',os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'wb') as out,os.fdopen(os.open(folder/'stderr.log',os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'wb') as err:
                    proc=subprocess.Popen(r.command(workspace,item['phase'])+[item['prompt']],cwd=workspace,env=env,stdout=out,stderr=err,start_new_session=True)
                    try:code=proc.wait(timeout=r.TIMEOUT)
                    except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL);proc.wait();code='TIMEOUT'
                assert binding()==frozen,'protocol_changed_during_request'
                raw=(folder/'stdout.jsonl').read_bytes();result=inspect(raw,code,workspace,item['phase']);r.m.verify(workspace,hashes)
                if isinstance(result.get('native'),dict):result['native'].pop('google_auth_loaded',None)
                if result['evaluation_status']=='EXECUTED':
                    blocks=r.visible_text([json.loads(line) for line in raw.splitlines() if line.strip()]);visible='\n\n'.join(x['text'] for x in blocks);b.private_write(folder/'assistant-text.json',b.encode({'blocks':blocks,'text':visible}))
                record['workspace_manifest_sha256']=b.digest(b.encode(hashes))
        except Exception as exc:
            record.update(state='UNKNOWN_EFFECT',evaluation_status='TEST_ERROR',error_class='execution_or_workspace_integrity',exception_type=type(exc).__name__)
            receipt.update(status='STOPPED_EXECUTION_ERROR',cost_incomplete=True);break
        record.update(result,state='FINISHED',stdout_sha256=b.digest(raw),stderr_sha256=b.digest((folder/'stderr.log').read_bytes()))
        if result['cost_usd'] is None:receipt['cost_incomplete']=True
        else:receipt['reported_list_usd']+=result['cost_usd'];receipt['cost_incomplete']=False
        b.save_receipt(args.output,receipt)
        print(b.encode({k:record.get(k) for k in ('index','phase','case_id','repetition','arm','evaluation_status','error_class','cost_usd')}),flush=True)
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
