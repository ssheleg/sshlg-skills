#!/usr/bin/env python3
"""Native routing v2 passive diagnostic; dry plan unless independently admitted."""
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
INVENTORY=r.SKILLS
r.MAX_TURNS=6
r.RESERVE=0.50
r.TASK_INPUT=32000
r.READY_INPUT=24000
BUDGET=3.5463678
MAX_CALLS=8
REPORTED_TURN_LIMIT=11
SEED=1013281

def source():
    data=json.loads((ROOT/'protocol.json').read_text())
    for rel,want in data['artifact_hashes'].items():
        assert b.digest((ROOT/rel).read_bytes())==want,'protocol dependency changed'
    manifest=json.loads((ROOT/'source.json').read_text())
    for row in manifest['fixtures']:
        path=ROOT/row['path'];assert path.is_file() and not path.is_symlink()
        assert b.digest(path.read_bytes())==row['sha256']
    expected={row['path'] for row in manifest['fixtures']}
    actual={str(path.relative_to(ROOT)) for path in (ROOT/'fixtures').rglob('*') if path.is_file()}
    assert actual==expected and not any(path.is_symlink() for path in (ROOT/'fixtures').rglob('*')),'fixture population changed'
    plugin=json.loads((ROOT.parent/'native-quality-v1/source.json').read_text())
    assert manifest['member_commit']==plugin['commit']==data['member_commit']
    frozen={row['path']:row for row in plugin['files']}
    assert all(frozen[row['path']]['sha256']==row['sha256'] and frozen[row['path']]['bytes']==row['bytes'] for row in manifest['contracts'])
    return data

def plan():
    source();cases=json.loads((ROOT/'cases.json').read_text())['cases'];rng=random.Random(SEED)
    arms=['full','concise'];rng.shuffle(arms)
    result=[{'phase':'readiness','arm':arm,'prompt':r.READY_PROMPT} for arm in arms]
    rng.shuffle(cases)
    for case in cases:
        order=['full','concise'];rng.shuffle(order)
        result.extend({'phase':'task','case_id':case['id'],'arm':arm,'prompt':case['prompt']} for arm in order)
    return result

def materialize(repo,workspace,item):
    hashes=r.m.build(repo,workspace,item['arm'])
    # Remove only the known, freshly materialized v1 synthetic input. No installed
    # or operator file is ever a destination of this isolated helper.
    for name in list(hashes):
        if name.startswith('app/'):
            (workspace/name).unlink();del hashes[name]
    (workspace/'app').rmdir()
    if item['phase']=='task':
        fixture=ROOT/'fixtures'/item['case_id']
        for path in sorted(fixture.iterdir()):
            assert path.is_file() and not path.is_symlink()
            dest=workspace/path.name;assert not dest.exists()
            data=path.read_bytes();dest.write_bytes(data);dest.chmod(0o600);hashes[path.name]=b.digest(data)
    r.m.verify(workspace,hashes)
    return hashes

def inspect(raw,code,workspace,phase):
    result=r.inspect(raw,code,workspace,phase,expected_inventory=INVENTORY,reported_turn_limit=REPORTED_TURN_LIMIT)
    if result['evaluation_status']=='EXECUTED':
        events=[json.loads(line) for line in raw.splitlines() if line.strip()]
        pending={};loads=[];texts=[]
        try:
            for index,event in enumerate(events):
                if event.get('type')=='assistant':
                    for block in event['message']['content']:
                        if block.get('type')=='tool_use' and block.get('name')=='Skill':
                            pending[block['id']]={'skill':block['input']['skill'],'call_event':index}
                        elif block.get('type')=='text' and block['text'].strip():
                            texts.append({'event':index,'text_sha256':b.digest(block['text'])})
                elif event.get('type')=='user':
                    for block in event.get('message',{}).get('content',[]):
                        if block.get('type')=='tool_result':
                            key=block['tool_use_id']
                            matching=[row for row in events if row.get('type')=='assistant' for call in row['message']['content'] if call.get('type')=='tool_use' and call.get('id')==key and call.get('name')=='Skill']
                            if matching:
                                if key not in pending or index<=pending[key]['call_event']:raise ValueError('invalid_tool_order')
                                loads.append(dict(pending[key],result_event=index))
            for load in loads:load['later_text_blocks']=[text for text in texts if text['event']>load['result_event']]
            result['native']['load_delivery']=loads
        except (KeyError,TypeError,ValueError):
            result.update(evaluation_status='TEST_ERROR',error_class='invalid_tool_order');return result
        outputs=[event['message']['usage'].get('output_tokens') for event in events if event.get('type')=='assistant']
        if not all(r.number(value) and value<=1600 for value in outputs) or result['usage']['output_tokens']>(1 if phase=='readiness' else r.MAX_TURNS)*1600:
            result.update(evaluation_status='TEST_ERROR',error_class='output_bound')
    return result

def score(calls,cases):
    expected={x['id']:x['expected_skill'] for x in cases}
    cells=[]
    for call in calls:
        if call.get('phase')!='task':continue
        valid=call.get('evaluation_status')=='EXECUTED'
        loads=(call.get('native') or {}).get('skill_loads',[])
        observed=expected[call['case_id']] in loads
        delivery=[row for row in (call.get('native') or {}).get('load_delivery',[]) if row['skill']==expected[call['case_id']]]
        relation=('PENDING_INDEPENDENT_AUDIT_TEXT_REVIEW' if any(row['later_text_blocks'] for row in delivery) else 'FAIL_NO_AUDIT_AFTER_LOAD') if observed else 'NOT_LOADED'
        cells.append({'index':call['index'],'case_id':call['case_id'],'arm':call['arm'],
                      'native_selection':('OBSERVED_EXPECTED_LOAD' if observed else 'FAIL_NATIVE_SELECTION') if valid else 'TEST_ERROR',
                      'load_before_delivered_audit':relation if valid else 'NOT_SCORED',
                      'skill_loads':loads,'artifact_quality':'PENDING_INDEPENDENT_REVIEW' if valid else 'NOT_SCORED'})
    return {'cells':cells,'adoption':'NOT_ADOPTED','scope':'Passive six-cell diagnostic; no directed follow-up or full-family quality claim.'}

def check_admission():
    admission=json.loads((ROOT/'admission.json').read_text())
    assert admission['status']=='ADMITTED' and admission['runner_sha256']==b.digest(Path(__file__).read_bytes())
    assert admission['source_sha256']==b.digest((ROOT/'source.json').read_bytes())
    assert admission['max_calls']==MAX_CALLS and admission['budget_usd']==BUDGET and admission['independent_review']=='PASS'
    return b.digest((ROOT/'admission.json').read_bytes())

def binding():
    admission_hash=check_admission();source()
    return {'admission':admission_hash,'runner':b.digest(Path(__file__).read_bytes()),'source':b.digest((ROOT/'source.json').read_bytes()),'cases':b.digest((ROOT/'cases.json').read_bytes()),'protocol':b.digest((ROOT/'protocol.json').read_bytes())}

def execute(args):
    frozen=binding();admission_hash=frozen['admission'];items=plan();assert len(items)==MAX_CALLS
    frozen_cases=json.loads((ROOT/'cases.json').read_text())['cases']
    assert binding()==frozen,'protocol_changed_during_plan'
    if args.output.exists() or args.output.with_name(args.output.name+'.pending').exists():raise ValueError('receipt_exists')
    private=args.private_dir
    if not private.is_absolute() or private.is_symlink() or private.exists():raise ValueError('private_directory_must_be_absolute_and_new')
    if subprocess.run(['git','rev-parse','--show-toplevel'],cwd=private.parent,capture_output=True).returncode==0:raise ValueError('raw_inside_git')
    private.mkdir(mode=0o700)
    receipt={'schema':'native-routing-run/2','status':'PREFLIGHT','calls':[],'reported_list_usd':0.0,'cost_incomplete':False,'max_calls':MAX_CALLS,'budget_usd':BUDGET,'seed':SEED,'source_commit':source()['member_commit'],'runner_sha256':b.digest(Path(__file__).read_bytes()),'source_manifest_sha256':b.digest((ROOT/'source.json').read_bytes()),'admission_sha256':admission_hash,'prior_known_pilots_list_usd':2.1959482,'prior_native_a_b_c_d_list_usd':0.4536322,'prior_native_cli_invocations':8,'protocol':'PASSIVE_NATIVE_V2','max_cumulative_cli_invocations':16,'scope':'Six passive fixture audits; native loading and artifact quality scored separately. No automatic directed calls, adoption or installed changes. List metadata is not subscription billing.'}
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
            with tempfile.TemporaryDirectory(prefix='sshlg-native-v2-') as temp:
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
