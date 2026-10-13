#!/usr/bin/env python3
"""Frozen routing-reader comparison; dry plan unless independently admitted."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import random
import re
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
r.SKILLS=set()
INVENTORY=set()
r.TOOLS=set()
r.MAX_TURNS=1
r.RESERVE=0.10
r.TASK_INPUT=12000
r.READY_INPUT=12000
BUDGET=1.4344608
MAX_CALLS=17
REPORTED_TURN_LIMIT=1
SEED=1013272

def source():
    data=json.loads((ROOT/'source.json').read_text())
    for name in ('cases','arms'):
        assert b.digest((ROOT/(name+'.json')).read_bytes())==data[name+'_sha256']
    for rel,want in data['dependency_hashes'].items():
        assert b.digest((ROOT.parent/rel).read_bytes())==want,'runner dependency changed'
    for rel,want in data['source_files'].items():
        assert b.digest(subprocess.check_output(['git','show',data['commit']+':'+rel],cwd=ROOT.parents[3]))==want
    amendment=json.loads((ROOT/'protocol-b.json').read_text())
    for name,want in amendment['previous_artifact_hashes'].items():
        assert b.digest((ROOT/name).read_bytes())==want,'prior evidence changed'
    previous=json.loads((ROOT/'results-a.json').read_text())
    assert previous['status']=='STOPPED_TEST_ERROR' and len(previous['calls'])==4 and previous['reported_list_usd']==0.1034776 and previous['cost_incomplete'] is False
    return data

def plan():
    source();cases=json.loads((ROOT/'cases.json').read_text())['cases']
    arms=json.loads((ROOT/'arms.json').read_text());assert set(arms)=={'current','no-among'}
    instruction="Read the supplied router text and classify the user's query from that text alone. Do not perform the task, invoke tools or infer facts about a real project. Reply with ROUTE: followed by comma-separated router names, or none, then WHY: one short sentence.\n\nRouter text:\n"
    tasks=[{'phase':'task','case_id':q['id'],'repetition':i,'arm':arm,'prompt':instruction+body+"\nUser query:\n"+q['prompt']} for q in cases for i in range(3) for arm,body in arms.items()]
    random.Random(SEED).shuffle(tasks)
    return tasks[1:]  # A's one valid task is retained; repeat only its failed cell under B.

def materialize(repo,workspace):
    assert not workspace.exists();workspace.mkdir(mode=0o700)
    path=workspace/'plugin/.claude-plugin/plugin.json';path.parent.mkdir(mode=0o700,parents=True)
    body=b'{"name":"local-pack","version":"1.0.0"}\n';path.write_bytes(body);path.chmod(0o600)
    return {'plugin/.claude-plugin/plugin.json':b.digest(body)}

def inspect(raw,code,workspace,phase):
    result=r.inspect(raw,code,workspace,phase,expected_inventory=INVENTORY,reported_turn_limit=REPORTED_TURN_LIMIT)
    if result['evaluation_status']=='EXECUTED':
        events=[json.loads(line) for line in raw.splitlines() if line.strip()]
        outputs=[event['message']['usage'].get('output_tokens') for event in events if event.get('type')=='assistant']
        outputs.append(result['usage']['output_tokens'])
        if not all(r.number(value) and value<=600 for value in outputs):
            result.update(evaluation_status='TEST_ERROR',error_class='output_bound')
    return result

def parse_routes(text):
    match=re.fullmatch(r'ROUTE: ([^\n]+)\n(?:[ \t]*\n)*WHY: ([^\n]+)',text.strip())
    if not match:raise ValueError('route_output_format')
    names=[name.strip() for name in match[1].split(',')]
    if names==['none']:return []
    if not all(re.fullmatch(r'[a-z][a-z0-9-]*',name) and name!='none' for name in names):
        raise ValueError('route_output_format')
    if len(names)!=len(set(names)):raise ValueError('route_output_format')
    return names

def score(calls,cases=None):
    # Independent reviewer scores route sets from full visible artifacts; there
    # is no silent format repair or automatic adoption decision here.
    return {'task_cells':sum(x.get('phase')=='task' and x.get('evaluation_status')=='EXECUTED' for x in calls),'semantic_review':'PENDING_INDEPENDENT_ROUTE_SET_REVIEW'}

def check_admission():
    admission=json.loads((ROOT/'admission-b.json').read_text())
    assert admission['status']=='ADMITTED' and admission['runner_sha256']==b.digest(Path(__file__).read_bytes())
    assert admission['source_sha256']==b.digest((ROOT/'source.json').read_bytes())
    assert admission['max_calls']==MAX_CALLS and admission['budget_usd']==BUDGET and admission['independent_review']=='PASS'
    return b.digest((ROOT/'admission-b.json').read_bytes())

def binding():
    admission_hash=check_admission();source()
    return {'admission':admission_hash,'runner':b.digest(Path(__file__).read_bytes()),'source':b.digest((ROOT/'source.json').read_bytes()),'cases':b.digest((ROOT/'cases.json').read_bytes()),'arms':b.digest((ROOT/'arms.json').read_bytes()),'amendment':b.digest((ROOT/'protocol-b.json').read_bytes())}

def execute(args):
    frozen=binding();admission_hash=frozen['admission'];items=plan();assert len(items)==MAX_CALLS
    frozen_cases=json.loads((ROOT/'cases.json').read_text())['cases']
    assert binding()==frozen,'protocol_changed_during_plan'
    if args.output.exists() or args.output.with_name(args.output.name+'.pending').exists():raise ValueError('receipt_exists')
    private=args.private_dir
    if not private.is_absolute() or private.is_symlink() or private.exists():raise ValueError('private_directory_must_be_absolute_and_new')
    if subprocess.run(['git','rev-parse','--show-toplevel'],cwd=private.parent,capture_output=True).returncode==0:raise ValueError('raw_inside_git')
    private.mkdir(mode=0o700)
    receipt={'schema':'paired-routing-reader-run/1','status':'PREFLIGHT','calls':[],'reported_list_usd':0.0,'cost_incomplete':False,'max_calls':MAX_CALLS,'budget_usd':BUDGET,'seed':SEED,'source_commit':source()['commit'],'runner_sha256':b.digest(Path(__file__).read_bytes()),'source_manifest_sha256':b.digest((ROOT/'source.json').read_bytes()),'admission_sha256':admission_hash,'prior_known_pilots_list_usd':2.1959482,'prior_native_a_b_c_list_usd':2.4620616,'prior_native_cli_invocations':64,'protocol':'PAIRED_READER_B','prior_paired_a_list_usd':0.1034776,'prior_paired_a_cli_invocations':4,'max_cumulative_cli_invocations':85,'scope':'Paired reading of router text only; no native skill selection, task execution or adoption claim; list metadata is not subscription billing.'}
    b.save_receipt(args.output,receipt)
    try:r.preflight(private)
    except Exception as exc:
        receipt.update(status='STOPPED_PREFLIGHT',error_class=type(exc).__name__);b.save_receipt(args.output,receipt);return 1
    env=dict(os.environ,CLAUDE_CODE_DISABLE_AUTO_MEMORY='1',CLAUDE_CODE_MAX_OUTPUT_TOKENS='600')
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
            with tempfile.TemporaryDirectory(prefix='sshlg-routing-reader-') as temp:
                workspace=Path(temp)/'work';hashes=materialize(args.source_repo,workspace)
                with os.fdopen(os.open(folder/'stdout.jsonl',os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'wb') as out,os.fdopen(os.open(folder/'stderr.log',os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'wb') as err:
                    proc=subprocess.Popen(r.command(workspace,item['phase'])+['--disable-slash-commands',item['prompt']],cwd=workspace,env=env,stdout=out,stderr=err,start_new_session=True)
                    try:code=proc.wait(timeout=r.TIMEOUT)
                    except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL);proc.wait();code='TIMEOUT'
                assert binding()==frozen,'protocol_changed_during_request'
                raw=(folder/'stdout.jsonl').read_bytes();result=inspect(raw,code,workspace,item['phase']);r.m.verify(workspace,hashes)
                if isinstance(result.get('native'),dict):result['native'].pop('google_auth_loaded',None)
                if result['evaluation_status']=='EXECUTED':
                    blocks=r.visible_text([json.loads(line) for line in raw.splitlines() if line.strip()]);visible='\n\n'.join(x['text'] for x in blocks);b.private_write(folder/'assistant-text.json',b.encode({'blocks':blocks,'text':visible}))
                    if item['phase']=='task':
                        try:result['route_names']=parse_routes(visible)
                        except ValueError:result.update(evaluation_status='TEST_ERROR',error_class='route_output_format')
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
