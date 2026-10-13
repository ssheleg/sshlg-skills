#!/usr/bin/env python3
"""Offline materialization, observer and fake process controls; no provider calls."""
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
spec=importlib.util.spec_from_file_location('native_v2',ROOT/'run.py')
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
REPO=Path('/Users/sshlg/DATA/sheleg-dev')
checks=0
def ok(value):
    global checks
    assert value
    checks+=1

items=a.plan()
ok(items==a.plan() and len(items)==8)
ok({(x['case_id'],x['arm']) for x in items[2:]}=={(q,arm) for q in ('b7','k2','m9') for arm in ('full','concise')})
ok(all(x['case_id'] not in x['prompt'] and 'sheleg-dev:' not in x['prompt'] for x in items[2:]))
usage={'input_tokens':200,'cache_creation_input_tokens':100,'cache_read_input_tokens':0,'output_tokens':20}
init={'type':'system','subtype':'init','model':'claude-opus-5-5','apiKeySource':'none','skills':sorted(a.r.SKILLS),'tools':sorted(a.r.TOOLS),'mcp_servers':[]}
assistant={'type':'assistant','message':{'id':'m1','usage':usage,'content':[{'type':'text','text':'READY'}]}}
final={'type':'result','subtype':'success','is_error':False,'num_turns':1,'total_cost_usd':.001,'usage':usage,'modelUsage':{'claude-opus-5-5':{'provider':'firstParty','costBasis':'list'}},'result':'READY'}
with tempfile.TemporaryDirectory(prefix='native-v2-offline-') as temp:
    root=Path(temp);full=root/'full';concise=root/'concise'
    item=next(x for x in items if x.get('case_id')=='b7' and x['arm']=='full')
    h=a.materialize(REPO,full,item);c=a.materialize(REPO,concise,dict(item,arm='concise'))
    ok(set(h)==set(c) and set(h)-{x for x in h if x.startswith('plugin/')}=={'OPERATIONS.md','service.py'})
    for name in h:
        left=(full/name).read_bytes();right=(concise/name).read_bytes()
        if name.endswith('/SKILL.md'):ok(left.split(b'\n---',1)[1]==right.split(b'\n---',1)[1])
        else:ok(left==right)
    ready=root/'ready';hr=a.materialize(REPO,ready,items[0])
    ok(all(x.startswith('plugin/') for x in hr))
    def inspect(events,phase='task'):
        return a.inspect(('\n'.join(json.dumps(x) for x in events)+'\n').encode(),0,full,phase)
    ok(inspect([init,assistant,final],'readiness')['evaluation_status']=='EXECUTED')
    call={'type':'tool_use','id':'t1','name':'Skill','input':{'skill':'sheleg-dev:google-auth'}}
    answer=copy.deepcopy(assistant);answer['message']['content']=[call,{'type':'text','text':'Audit.'}]
    response={'type':'user','message':{'content':[{'type':'tool_result','tool_use_id':'t1','is_error':False,'content':'skill body'}]}}
    tail=copy.deepcopy(final);tail['result']='Audit.';tail['num_turns']=3
    observed=inspect([init,answer,response,tail])
    ok(observed['evaluation_status']=='EXECUTED' and observed['native']['skill_loads']==['sheleg-dev:google-auth'])
    cases=json.loads((ROOT/'cases.json').read_text())['cases']
    def score_trace(value):return a.score([dict(value,index=0,phase='task',case_id='b7',arm='full')],cases)['cells'][0]
    ok(score_trace(observed)['load_before_delivered_audit']=='FAIL_NO_AUDIT_AFTER_LOAD')
    later=copy.deepcopy(assistant);later['message']['id']='m2';later['message']['content']=[{'type':'text','text':'Actual audit after loading.'}]
    valid=inspect([init,answer,response,later,tail])
    ok(score_trace(valid)['load_before_delivered_audit']=='PENDING_INDEPENDENT_AUDIT_TEXT_REVIEW')
    ok(valid['native']['load_delivery'][0]['later_text_blocks'][0]['event']==3)
    ok(inspect([init,response,answer,tail])['error_class']=='invalid_tool_order')
    pre=copy.deepcopy(assistant);pre['message']['content']=[{'type':'text','text':'Complete audit before loading.'}]
    callonly=copy.deepcopy(answer);callonly['message']['id']='m2';callonly['message']['content']=[call]
    late=inspect([init,pre,callonly,response,tail])
    ok(score_trace(late)['load_before_delivered_audit']=='FAIL_NO_AUDIT_AFTER_LOAD')
    ok(inspect([init,answer,tail])['error_class']=='unmatched_tool_result')
    denied=copy.deepcopy(response);denied['message']['content'][0]['is_error']=True
    ok(inspect([init,answer,denied,tail])['error_class']=='tool_denied_or_error')
    outside=copy.deepcopy(answer);outside['message']['content'][0].update(name='Read',input={'file_path':'/outside-synthetic-root'})
    ok(inspect([init,outside,response,tail])['error_class']=='outside_workspace_read')
    bad=copy.deepcopy(final);bad['usage']['output_tokens']=9601
    ok(inspect([init,assistant,bad])['error_class']=='output_bound')
    bad=copy.deepcopy(assistant);bad['message']['usage']['output_tokens']=1601
    ok(inspect([init,bad,final])['error_class']=='output_bound')
    bad=copy.deepcopy(init);bad['skills'].append('foreign:skill')
    ok(inspect([bad,assistant,final])['error_class']=='unexpected_skill_inventory')
    seven=[copy.deepcopy(assistant) for _ in range(7)]
    for i,row in enumerate(seven):row['message']['id']=str(i)
    ok(inspect([init,*seven,final])['error_class']=='aggregate_input_bound')
    calls=[dict(index=0,phase='task',case_id='b7',arm='full',evaluation_status='EXECUTED',native={'skill_loads':[]})]
    ok(a.score(calls,json.loads((ROOT/'cases.json').read_text())['cases'])['cells'][0]['native_selection']=='FAIL_NATIVE_SELECTION')
    fake=root/'claude';fake.write_text('''#!/usr/bin/env python3
import json,sys,os,time
if sys.argv[1:]==['--version']: print('2.1.296 (Claude Code)');raise SystemExit
if sys.argv[1:]==['auth','status','--json']:
 print(json.dumps({'loggedIn':True,'authMethod':'claude.ai','apiProvider':'firstParty','subscriptionType':'team'}));raise SystemExit
args=sys.argv[1:]
assert set(args[args.index('--tools')+1].split(','))=={'Read','Skill','Glob','Grep'}
assert '--restricted' in args and '--bare' not in args
assert json.loads(args[args.index('--mcp-config')+1])=={'mcpServers':{}}
assert os.environ['CLAUDE_CODE_MAX_OUTPUT_TOKENS']=='1600'
mode=os.environ.get('NATIVE_V2_FAKE_MODE','ok')
if mode=='timeout':time.sleep(3)
i=INIT;a=ASSISTANT;f=FINAL
if mode=='unknown':f.pop('total_cost_usd')
if mode=='overshoot':f['total_cost_usd']=4
if args[-1]!=READY_PROMPT:
 a['message']['content'][0]['text']='Audit grounded in synthetic files.';f['result']=a['message']['content'][0]['text']
for row in (i,a,f):print(json.dumps(row))
'''.replace('INIT',repr(init)).replace('ASSISTANT',repr(assistant)).replace('FINAL',repr(final)).replace('READY_PROMPT',repr(a.r.READY_PROMPT)))
    fake.chmod(0o700)
    pair=[items[0],item]
    for mode,want in [('ok','COMPLETED'),('unknown','STOPPED_TEST_ERROR'),('overshoot','STOPPED_BUDGET_OVERSHOOT'),('timeout','STOPPED_TEST_ERROR')]:
        args=SimpleNamespace(source_repo=REPO,output=root/(mode+'.json'),private_dir=root/(mode+'-raw'))
        with patch.object(a,'check_admission',return_value='offline-only'),patch.object(a,'plan',return_value=pair),patch.object(a,'MAX_CALLS',2),patch.object(a.r,'TIMEOUT',.1 if mode=='timeout' else 180),patch.dict(os.environ,{'PATH':str(root)+os.pathsep+os.environ['PATH'],'NATIVE_V2_FAKE_MODE':mode}),contextlib.redirect_stdout(io.StringIO()):
            result=a.execute(args)
        receipt=json.loads(args.output.read_text())
        ok(receipt['status']==want)
        ok(len(receipt['calls'])==(2 if mode=='ok' else 1))
        ok(receipt['cost_incomplete']==(mode in ('unknown','timeout')))
        ok(all((p.stat().st_mode&0o777)==0o600 for p in args.private_dir.rglob('*') if p.is_file()))
    original=Path.read_bytes
    with patch.object(Path,'read_bytes',lambda path:original(path)+b'corrupt' if path==ROOT/'fixtures/b7/service.py' else original(path)):
        try:a.source()
        except AssertionError:ok(True)
        else:raise AssertionError('source corruption accepted')
    with patch.object(a,'check_admission',return_value='original'):
        frozen=a.binding()
        with patch.object(a,'check_admission',return_value='replaced'):ok(a.binding()!=frozen)
    with patch.dict(os.environ,{'ANTHROPIC_API_KEY':'PRIVATE_TEST_SENTINEL'}),patch.object(a.r.subprocess,'run',side_effect=AssertionError('auth must not run')):
        try:a.r.preflight(root)
        except ValueError:ok(True)
        else:raise AssertionError('foreign API credentials admitted')
    (full/'foreign.txt').write_text('change')
    try:a.r.m.verify(full,h)
    except AssertionError:ok(True)
    else:raise AssertionError('workspace corruption accepted')
print(f'PASS: {checks} offline native-v2 controls; zero provider calls')
