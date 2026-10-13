#!/usr/bin/env python3
"""Native audit diagnostic. Dry plan by default; no automatic retry/resume."""
import argparse
import importlib.util
import json
import math
import os
from pathlib import Path
import random
import signal
import subprocess
import tempfile
import time

ROOT=Path(__file__).resolve().parent

def module(name,path):
    spec=importlib.util.spec_from_file_location(name,path);value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value

m=module('native_materialize',ROOT/'materialize.py')
base=module('selection_runner',ROOT.parent/'run-description-screening-v2.py')
TOOLS={'Read','Skill','Glob','Grep'}
SKILLS={'sheleg-dev:'+x for x in ('ad-tracking','crypto-payments','error-tracking','frontend-performance','google-auth','google-signin','stripe-billing')}
MAX_CALLS=6
BUDGET=4.0
RESERVE=0.50
PRIOR_RECORDS=(('observed-20261013.json',0.0373944,1),('observed-b-20261013.json',0.011772000000000001,1))
PRIOR_COST=sum(cost for _,cost,_ in PRIOR_RECORDS)
PRIOR_CALLS=2
MAX_CUMULATIVE_CALLS=8
TIMEOUT=180
READY_INPUT=24000
TASK_INPUT=32000
MAX_TURNS=6
READY_PROMPT='This is a startup readiness check. Do not invoke Skill, Read, Glob, Grep or any other tool. Reply with exactly READY and nothing else.'
SETTINGS={'disableBundledSkills':True,'skillOverrides':{'doctor':'off','design':'off','plugin-authoring':'off'},'disableAllHooks':True,'autoMemoryEnabled':False,'claudeMdExcludes':['**'],'disableClaudeAiConnectors':True}

def plan(seed):
    rng=random.Random(seed);arms=['full','concise'];rng.shuffle(arms)
    result=[{'phase':'readiness','arm':arm,'prompt':READY_PROMPT} for arm in arms]
    tasks=json.loads((ROOT/'tasks.json').read_text())['tasks'];rng.shuffle(tasks)
    for task in tasks:
        order=['full','concise'];rng.shuffle(order)
        result += [{'phase':'task','arm':arm,'case_id':task['id'],'prompt':task['prompt']} for arm in order]
    assert len(result)==MAX_CALLS
    return result

def command(workspace,phase):
    return ['claude','-p','--restricted','--model','claude-opus-5-5','--effort','low',
            '--plugin-dir',str(workspace/'plugin'),'--tools',','.join(sorted(TOOLS)),
            '--allowedTools',','.join(sorted(TOOLS)),
            '--strict-mcp-config','--mcp-config','{"mcpServers":{}}',
            '--settings',json.dumps(SETTINGS,separators=(',',':')),
            '--no-session-persistence','--max-turns',str(1 if phase=='readiness' else MAX_TURNS),
            '--max-budget-usd',str(RESERVE),'--output-format','stream-json','--verbose']

def number(value):
    return isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(value) and value>=0

def inspect(raw,exit_code,workspace,phase):
    result={'evaluation_status':'TEST_ERROR','error_class':None,'cost_usd':None,'usage':None,'native':None,'artifact_sha256':None}
    try:
        events=[json.loads(line) for line in raw.splitlines() if line.strip()]
        if not all(isinstance(x,dict) for x in events):raise ValueError()
        initial=[x for x in events if x.get('type')=='system' and x.get('subtype')=='init']
        finals=[x for x in events if x.get('type')=='result']
        if len(initial)!=1 or len(finals)!=1:raise ValueError()
    except (ValueError,TypeError):result['error_class']='invalid_stream';return result
    init,final=initial[0],finals[0]
    cost=final.get('total_cost_usd');result['cost_usd']=cost if number(cost) else None
    usage=final.get('usage');keys=('input_tokens','cache_creation_input_tokens','cache_read_input_tokens','output_tokens')
    if isinstance(usage,dict) and all(number(usage.get(k)) for k in keys):result['usage']={k:usage[k] for k in keys}
    if exit_code!=0 or final.get('is_error') is not False or final.get('subtype')!='success':result['error_class']='transport_or_provider';return result
    if result['cost_usd'] is None or result['usage'] is None:result['error_class']='unknown_cost_or_usage';return result
    if init.get('model')!='claude-opus-5-5' or init.get('apiKeySource')!='none':result['error_class']='unexpected_auth_or_model';return result
    models=final.get('modelUsage')
    if not isinstance(models,dict) or set(models)!={'claude-opus-5-5'} or any(not isinstance(v,dict) or v.get('provider')!='firstParty' or v.get('costBasis')!='list' for v in models.values()):result['error_class']='unexpected_provider_or_cost';return result
    if not isinstance(init.get('skills'),list) or not all(isinstance(x,str) for x in init['skills']) or set(init['skills'])!=SKILLS or len(init['skills'])!=len(SKILLS):result['error_class']='unexpected_skill_inventory';return result
    if not isinstance(init.get('tools'),list) or not all(isinstance(x,str) for x in init['tools']) or set(init['tools'])!=TOOLS or init.get('mcp_servers')!=[]:result['error_class']='unexpected_tools_or_mcp';return result
    turns=final.get('num_turns');max_turns=1 if phase=='readiness' else MAX_TURNS
    if not isinstance(turns,int) or isinstance(turns,bool) or not 1<=turns<=max_turns:result['error_class']='turn_bound';return result
    server=usage.get('server_tool_use',{})
    if not isinstance(server,dict) or any(server.get(k,0)!=0 for k in ('web_search_requests','web_fetch_requests')):result['error_class']='network_tool_use';return result
    assistants=[x for x in events if x.get('type')=='assistant']
    inputs=[];request_usage={};requests={};responses={}
    try:
        for event in assistants:
            message=event['message'];u=message['usage']
            if not all(number(u.get(k)) for k in keys[:3]):raise ValueError('unknown_request_usage')
            message_id=message.get('id')
            if not isinstance(message_id,str) or not message_id:raise ValueError('missing_request_id')
            counts=tuple(u[k] for k in keys[:3])
            if message_id in request_usage and request_usage[message_id]!=counts:raise ValueError('conflicting_request_usage')
            request_usage[message_id]=counts
            for content in message['content']:
                if content.get('type')=='tool_use':
                    key=content['id'];assert key not in requests;requests[key]=content
        for event in events:
            if event.get('type')=='user':
                for content in event.get('message',{}).get('content',[]):
                    if content.get('type')=='tool_result':
                        key=content['tool_use_id'];assert key not in responses;responses[key]=content
        inputs=[sum(counts) for counts in request_usage.values()]
        if not inputs:raise ValueError('missing_request_usage')
        if max(inputs)>(READY_INPUT if phase=='readiness' else TASK_INPUT):raise ValueError('input_bound')
        if len(inputs)>max_turns or sum(result['usage'][k] for k in keys[:3])>max_turns*(READY_INPUT if phase=='readiness' else TASK_INPUT):raise ValueError('aggregate_input_bound')
        if set(requests)!=set(responses):raise ValueError('unmatched_tool_result')
        loads=[];reads=[]
        for key,call in requests.items():
            name=call['name'];args=call['input']
            if name not in TOOLS:raise ValueError('unallowed_tool')
            if responses[key].get('is_error',False):raise ValueError('tool_denied_or_error')
            if name=='Skill':
                skill=args.get('skill')
                if skill not in SKILLS:raise ValueError('unallowed_skill')
                loads.append(skill)
            else:
                path=args.get('file_path') if name=='Read' else args.get('path','.')
                if not isinstance(path,str):raise ValueError('invalid_read_path')
                resolved=(workspace/path).resolve()
                if not resolved.is_relative_to(workspace.resolve()):raise ValueError('outside_workspace_read')
                if name=='Read':
                    if not resolved.is_file():raise ValueError('invalid_read_path')
                    reads.append(str(resolved.relative_to(workspace.resolve())))
        if phase=='readiness' and requests:raise ValueError('readiness_tool_use')
    except (KeyError,TypeError,AttributeError,AssertionError,ValueError) as exc:
        known={'missing_request_id','conflicting_request_usage','unknown_request_usage','missing_request_usage','input_bound','aggregate_input_bound','unmatched_tool_result','unallowed_tool','tool_denied_or_error','unallowed_skill','invalid_read_path','outside_workspace_read','readiness_tool_use'}
        result['error_class']=str(exc) if str(exc) in known else 'invalid_tool_stream';return result
    artifact=final.get('result')
    if not isinstance(artifact,str) or not artifact.strip() or (phase=='readiness' and artifact.strip()!='READY'):result['error_class']='invalid_final_artifact';return result
    result.update(evaluation_status='EXECUTED',native={'visible':sorted(SKILLS),'skill_loads':loads,'read_files':reads,'google_auth_loaded':'sheleg-dev:google-auth' in loads},artifact_sha256=base.digest(artifact),max_request_input=max(inputs),request_count=len(inputs),turns=turns)
    # Semantic scoring is deliberately absent. Native non-invocation remains observed.
    return result

def preflight(private):
    base.check_environment(os.environ)
    if os.environ.get('CLAUDE_CODE_SAFE_MODE'):raise ValueError('unexpected_safe_mode')
    auth=subprocess.run(['claude','auth','status','--json'],capture_output=True,timeout=30)
    base.private_write(private/'auth.stdout',auth.stdout.decode(errors='replace'));base.private_write(private/'auth.stderr',auth.stderr.decode(errors='replace'))
    value=json.loads(auth.stdout)
    assert auth.returncode==0 and value.get('loggedIn') is True and value.get('authMethod')=='claude.ai' and value.get('apiProvider')=='firstParty' and value.get('subscriptionType') in ('team','max','pro','enterprise')
    version=subprocess.run(['claude','--version'],capture_output=True,timeout=30)
    base.private_write(private/'version.stdout',version.stdout.decode(errors='replace'));base.private_write(private/'version.stderr',version.stderr.decode(errors='replace'))
    assert version.returncode==0 and version.stdout.decode().strip()=='2.1.296 (Claude Code)'

def execute(args,metadata=None):
    prior_hashes={}
    for name,cost,count in PRIOR_RECORDS:
        data=(ROOT/name).read_bytes();prior=json.loads(data)
        assert prior['status']=='STOPPED_TEST_ERROR' and prior['cost_incomplete'] is False
        assert prior['reported_list_usd']==cost and len(prior['calls'])==count
        assert all(number(call.get('cost_usd')) for call in prior['calls'])
        assert abs(sum(call['cost_usd'] for call in prior['calls'])-cost)<1e-9
        prior_hashes[name]=base.digest(data)
    assert sum(count for _,_,count in PRIOR_RECORDS)==PRIOR_CALLS and PRIOR_CALLS+MAX_CALLS==MAX_CUMULATIVE_CALLS
    if args.output.exists() or args.output.with_name(args.output.name+'.pending').exists():raise ValueError('receipt_exists')
    private=args.private_dir
    if not private.is_absolute() or private.is_symlink() or private.exists():raise ValueError('private_directory_must_be_absolute_and_new')
    if subprocess.run(['git','rev-parse','--show-toplevel'],cwd=private.parent,capture_output=True).returncode==0:raise ValueError('raw_inside_git')
    private.mkdir(mode=0o700)
    receipt={'schema':'native-quality-run/1','status':'PREFLIGHT','calls':[],'seed':args.seed,'reported_list_usd':0.0,'prior_reported_list_usd':PRIOR_COST,'combined_known_list_usd':PRIOR_COST,'prior_receipt_sha256':prior_hashes,'prior_cli_invocations':PRIOR_CALLS,'max_cumulative_cli_invocations':MAX_CUMULATIVE_CALLS,'max_model_turns_this_attempt':sum(1 if item['phase']=='readiness' else MAX_TURNS for item in plan(args.seed)),'cost_incomplete':False,'source_sha':json.loads((ROOT/'source.json').read_text())['commit'],'runner_sha256':base.digest(Path(__file__).read_bytes()),'materializer_sha256':base.digest((ROOT/'materialize.py').read_bytes()),'source_manifest_sha256':base.digest((ROOT/'source.json').read_bytes()),'arms_fixture_sha256':base.digest((ROOT.parent/'description-screening-fixture-v2.json').read_bytes()),'tasks_sha256':base.digest((ROOT/'tasks.json').read_bytes()),'rubric_sha256':base.digest((ROOT/'rubric.json').read_bytes()),'budget':BUDGET,'max_calls':MAX_CALLS,'scope':'Restricted native fixture only; call counts mean CLI invocations, bounded model turns separately; CLI internal retries unmeasured. Artifact quality requires independent review; list metadata is not subscription billing.'}
    if metadata:receipt.update(metadata)
    base.save_receipt(args.output,receipt)
    try:preflight(private)
    except Exception as exc:
        receipt.update(status='STOPPED_PREFLIGHT',error_class='auth_or_cli',exception_type=type(exc).__name__);base.save_receipt(args.output,receipt);return 1
    receipt.update(status='RUNNING',auth_route='claude.ai subscription / firstParty',cli_version='2.1.296')
    env=dict(os.environ,CLAUDE_CODE_DISABLE_AUTO_MEMORY='1',CLAUDE_CODE_MAX_OUTPUT_TOKENS='1600')
    for index,item in enumerate(plan(args.seed)):
        if len(receipt['calls'])+PRIOR_CALLS>=MAX_CUMULATIVE_CALLS:receipt['status']='STOPPED_CALL_BOUND';break
        if PRIOR_COST+receipt['reported_list_usd']+RESERVE>BUDGET:receipt['status']='STOPPED_BUDGET';break
        record={k:v for k,v in item.items() if k!='prompt'};record.update(index=index,state='STARTED',prompt_sha256=base.digest(item['prompt']),started_at_utc=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()))
        receipt['calls'].append(record);base.save_receipt(args.output,receipt)
        folder=private/str(index);folder.mkdir(mode=0o700);base.private_write(folder/'prompt.txt',item['prompt'])
        try:
            with tempfile.TemporaryDirectory(prefix='sshlg-native-') as temp:
                workspace=Path(temp)/'work';hashes=m.build(args.source_repo,workspace,item['arm'])
                with os.fdopen(os.open(folder/'stdout.jsonl',os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'wb') as out,os.fdopen(os.open(folder/'stderr.log',os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'wb') as err:
                    process=subprocess.Popen(command(workspace,item['phase'])+[item['prompt']],cwd=workspace,env=env,stdout=out,stderr=err,start_new_session=True)
                    try:code=process.wait(timeout=TIMEOUT)
                    except subprocess.TimeoutExpired:os.killpg(process.pid,signal.SIGKILL);process.wait();code='TIMEOUT'
                raw=(folder/'stdout.jsonl').read_bytes();result=inspect(raw,code,workspace,item['phase']);m.verify(workspace,hashes)
                record['workspace_manifest_sha256']=base.digest(base.encode(hashes))
        except Exception as exc:
            record.update(state='UNKNOWN_EFFECT',evaluation_status='TEST_ERROR',error_class='execution_or_workspace_integrity',exception_type=type(exc).__name__)
            receipt.update(status='STOPPED_EXECUTION_ERROR',cost_incomplete=True);base.save_receipt(args.output,receipt);return 1
        record.update(result,state='FINISHED',stdout_sha256=base.digest(raw),stderr_sha256=base.digest((folder/'stderr.log').read_bytes()))
        if result['cost_usd'] is None:receipt['cost_incomplete']=True
        else:receipt['reported_list_usd']+=result['cost_usd']
        receipt['combined_known_list_usd']=PRIOR_COST+receipt['reported_list_usd']
        base.save_receipt(args.output,receipt);print(base.encode({k:record.get(k) for k in ('index','phase','arm','case_id','evaluation_status','error_class','cost_usd')}),flush=True)
        if result['evaluation_status']=='TEST_ERROR':receipt['status']='STOPPED_TEST_ERROR';break
        if PRIOR_COST+receipt['reported_list_usd']>BUDGET:receipt['status']='STOPPED_BUDGET_OVERSHOOT';break
    else:receipt['status']='COMPLETED'
    base.save_receipt(args.output,receipt);return 0 if receipt['status']=='COMPLETED' else 1

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--execute',action='store_true');parser.add_argument('--seed',type=int,default=10132027);parser.add_argument('--source-repo',type=Path);parser.add_argument('--private-dir',type=Path);parser.add_argument('--output',type=Path);args=parser.parse_args()
    if not args.execute:print(json.dumps({'provider_calls':0,'plan':[{k:v for k,v in x.items() if k!='prompt'} for x in plan(args.seed)],'max_reported_list_usd':BUDGET,'prior_reported_list_usd':PRIOR_COST},indent=2));return 0
    if (ROOT/'observed-c-20261013.json').exists():parser.error('attempt C is preserved; use only a separately reviewed continuation protocol')
    if any(x is None for x in (args.source_repo,args.private_dir,args.output)):parser.error('execution requires source-repo, private-dir and output')
    return execute(args)

if __name__=='__main__':raise SystemExit(main())
