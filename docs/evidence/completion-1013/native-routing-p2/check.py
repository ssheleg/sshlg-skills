#!/usr/bin/env python3
"""Offline P2 admission/trace/process plants. Every CLI below is an owned fake."""
import contextlib
import copy
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
from types import SimpleNamespace
from unittest.mock import patch

ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('directed_runner',ROOT/'run.py')
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
REPO=Path('/Users/sshlg/DATA/sheleg-dev')
checks=0
def ok(value):
    global checks
    assert value
    checks+=1
items=a.plan();cases=json.loads((ROOT.parent/'native-routing-v2/cases.json').read_text())['cases'];by_id={x['id']:x for x in cases}
ok(len(items)==2 and items==a.plan())
ok({x['case_id'] for x in items}=={'b7','k2'} and all(x['phase']=='task' and x['arm']=='full' for x in items))
for item in items:
    case=by_id[item['case_id']]
    ok(item['prompt'].endswith(case['prompt']))
    ok(case['expected_skill'] in item['prompt'] and item['case_id'] not in item['prompt'])
    ok(all(rule not in item['prompt'] for rule in case['required']))
try:a.check_admission()
except AssertionError:ok(True)
else:raise AssertionError('unreviewed protocol admitted')
usage={'input_tokens':200,'cache_creation_input_tokens':100,'cache_read_input_tokens':0,'output_tokens':20}
init={'type':'system','subtype':'init','model':'claude-opus-5-5','apiKeySource':'none','skills':sorted(a.r.SKILLS),'tools':sorted(a.r.TOOLS),'mcp_servers':[]}
call={'type':'assistant','message':{'id':'m1','usage':usage,'content':[{'type':'tool_use','id':'t1','name':'Skill','input':{'skill':'sheleg-dev:google-auth'}}]}}
response={'type':'user','message':{'content':[{'type':'tool_result','tool_use_id':'t1','is_error':False,'content':'synthetic skill body'}]}}
answer={'type':'assistant','message':{'id':'m2','usage':usage,'content':[{'type':'text','text':'Synthetic audit after load.'}]}}
final={'type':'result','subtype':'success','is_error':False,'num_turns':3,'total_cost_usd':.001,'usage':{k:v*2 for k,v in usage.items()},'modelUsage':{'claude-opus-5-5':{'provider':'firstParty','costBasis':'list'}},'result':'Synthetic audit after load.'}
with tempfile.TemporaryDirectory(prefix='native-p2-offline-') as tmp:
    root=Path(tmp);workspace=root/'work';h=a.materialize(REPO,workspace,items[0]);same=root/'same';old=a.p1.materialize(REPO,same,items[0]);ok(h==old)
    ok(set(h)-{x for x in h if x.startswith('plugin/')}=={'OPERATIONS.md','service.py'})
    def observe(rows):return a.inspect(('\n'.join(json.dumps(x) for x in rows)+'\n').encode(),0,workspace,'task')
    def grade(value):return a.score([dict(value,index=0,phase='task',case_id='b7',arm='full')],cases)['cells'][0]
    valid=observe([init,call,response,answer,final]);g=grade(valid)
    ok(valid['evaluation_status']=='EXECUTED' and g['directed_instruction']=='PASS_FIRST_EXPECTED_SKILL')
    ok(g['load_before_delivered_audit']=='PENDING_INDEPENDENT_AUDIT_TEXT_REVIEW' and g['artifact_quality']=='PENDING_INDEPENDENT_REVIEW')
    g=grade(observe([init,answer,call,response,final]));ok(g['load_before_delivered_audit']=='FAIL_NO_AUDIT_AFTER_LOAD')
    g=grade(observe([init,answer,final]));ok(g['native_selection']=='FAIL_NATIVE_SELECTION' and g['directed_instruction']=='FAIL_FIRST_EXPECTED_SKILL')
    denied=copy.deepcopy(response);denied['message']['content'][0]['is_error']=True
    ok(observe([init,call,denied,answer,final])['evaluation_status']=='TEST_ERROR')
    ok(observe([init,call,answer,final])['error_class']=='unmatched_tool_result')
    ok(observe([init,response,call,answer,final])['error_class']=='invalid_tool_order')
    bad=copy.deepcopy(init);bad['apiKeySource']='env';ok(observe([bad,call,response,answer,final])['evaluation_status']=='TEST_ERROR')
    bad=copy.deepcopy(answer);bad['message']['usage']['output_tokens']=1601;ok(observe([init,call,response,bad,final])['error_class']=='output_bound')
    bad=copy.deepcopy(answer);bad['message']['usage']['input_tokens']=32001;ok(observe([init,call,response,bad,final])['error_class']=='input_bound')
    bad=copy.deepcopy(final);bad['num_turns']=12;ok(observe([init,call,response,answer,bad])['error_class']=='turn_bound')
    seven=[copy.deepcopy(answer) for _ in range(7)]
    for i,row in enumerate(seven):row['message']['id']=str(i)
    ok(observe([init,*seven,final])['error_class']=='aggregate_input_bound')
    glob=copy.deepcopy(call);glob['message']['id']='m0';glob['message']['content']=[{'type':'tool_use','id':'t0','name':'Glob','input':{'pattern':'*'}}]
    glob_answer=copy.deepcopy(response);glob_answer['message']['content'][0]['tool_use_id']='t0'
    g=grade(observe([init,glob,glob_answer,call,response,answer,final]));ok(g['directed_instruction']=='FAIL_FIRST_EXPECTED_SKILL' and g['native_selection']=='OBSERVED_EXPECTED_LOAD')
    fake=root/'claude';fake.write_text('''#!/usr/bin/env python3
import json,sys,os,re,time
if sys.argv[1:]==['--version']: print('2.1.296 (Claude Code)');raise SystemExit
if sys.argv[1:]==['auth','status','--json']:
 print(json.dumps({'loggedIn':True,'authMethod':'claude.ai','apiProvider':'firstParty','subscriptionType':'team'}));raise SystemExit
args=sys.argv[1:]
assert '--restricted' in args and '--bare' not in args
assert args[args.index('--max-turns')+1]=='6'
assert args[args.index('--max-budget-usd')+1]=='0.5'
assert os.environ['CLAUDE_CODE_MAX_OUTPUT_TOKENS']=='1600'
assert set(args[args.index('--tools')+1].split(','))=={'Read','Skill','Glob','Grep'}
assert json.loads(args[args.index('--mcp-config')+1])=={'mcpServers':{}}
record=json.load(open(os.environ['P2_RECEIPT']));assert record['calls'][-1]['state']=='STARTED' and record['cost_incomplete'] is True
mode=os.environ.get('P2_MODE','ok')
if mode=='timeout':time.sleep(3)
i=INIT;c=CALL;r=RESPONSE;a=ANSWER;f=FINAL
c['message']['content'][0]['input']['skill']=re.search('skill="([^"]+)"',args[-1])[1]
if mode=='denied':r['message']['content'][0]['is_error']=True
if mode=='unknown':f.pop('total_cost_usd')
if mode=='overshoot':f['total_cost_usd']=3
if mode=='budget':f['total_cost_usd']=2.4
rows=[i,c,r,a,f]
if mode=='zero':rows=[i,a,f]
if mode=='late':rows=[i,a,c,r,f]
for x in rows:print(json.dumps(x))
'''.replace('INIT',repr(init)).replace('CALL',repr(call)).replace('RESPONSE',repr(response)).replace('ANSWER',repr(answer)).replace('FINAL',repr(final)))
    fake.chmod(0o700)
    for mode,status,count in [('ok','COMPLETED',2),('zero','COMPLETED',2),('late','COMPLETED',2),('denied','STOPPED_TEST_ERROR',1),('unknown','STOPPED_TEST_ERROR',1),('overshoot','STOPPED_BUDGET_OVERSHOOT',1),('budget','STOPPED_BUDGET',1),('timeout','STOPPED_TEST_ERROR',1)]:
        args=SimpleNamespace(source_repo=REPO,output=root/(mode+'.json'),private_dir=root/(mode+'-raw'))
        with patch.object(a,'check_admission',return_value='offline'),patch.object(a.r,'TIMEOUT',.1 if mode=='timeout' else 180),patch.dict(os.environ,{'PATH':str(root)+os.pathsep+os.environ['PATH'],'P2_MODE':mode,'P2_RECEIPT':str(args.output)}),contextlib.redirect_stdout(io.StringIO()):a.execute(args)
        result=json.loads(args.output.read_text());ok(result['status']==status);ok(len(result['calls'])==count);ok(result['cost_incomplete']==(mode in ('unknown','timeout')))
        ok(all(p.stat().st_mode&0o777==0o600 for p in args.private_dir.rglob('*') if p.is_file()))
    # Source/admission replacement during a real fake child cannot continue or score it.
    args=SimpleNamespace(source_repo=REPO,output=root/'changed.json',private_dir=root/'changed-raw')
    with patch.object(a,'check_admission',return_value='offline'):
        frozen=a.binding();replacement=dict(frozen,protocol='changed')
        with patch.object(a,'binding',side_effect=[frozen,frozen,frozen,replacement,replacement]),patch.dict(os.environ,{'PATH':str(root)+os.pathsep+os.environ['PATH'],'P2_MODE':'ok','P2_RECEIPT':str(args.output)}),contextlib.redirect_stdout(io.StringIO()):a.execute(args)
    result=json.loads(args.output.read_text());ok(len(result['calls'])==1 and result['cost_incomplete']);ok(result['calls'][0]['state']=='UNKNOWN_EFFECT');ok(result['scores']['cells'][0]['artifact_quality']=='NOT_SCORED')
    with patch.dict(os.environ,{'ANTHROPIC_API_KEY':'PRIVATE_OFFLINE_SENTINEL'}),patch.object(a.r.subprocess,'run',side_effect=AssertionError('no child allowed')):
        try:a.r.preflight(root)
        except ValueError:ok(True)
        else:raise AssertionError('foreign key accepted')
print(f'PASS: {checks} offline P2 controls; zero provider calls')
