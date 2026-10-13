#!/usr/bin/env python3
"""Offline pair-plan, parser and real fake-process controls; zero provider calls."""
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
spec=importlib.util.spec_from_file_location('paired_runner',ROOT/'run.py')
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
checks=0
def ok(value):
    global checks
    assert value
    checks+=1

ok(a.r.READY_INPUT==a.r.TASK_INPUT==12000)
ok(a.parse_routes('ROUTE: super-ux, task-pipeline\nWHY: interface work.')==['super-ux','task-pipeline'])
ok(a.parse_routes('ROUTE: none\nWHY: outside scope.')==[])
ok(a.parse_routes('ROUTE: unknown-name\nWHY: retain semantic observation.')==['unknown-name'])
for malformed in ('super-ux','ROUTE: none, super-ux\nWHY: mixed','ROUTE: super-ux, super-ux\nWHY: duplicate','ROUTE: super-ux\nWHY: first\nextra'):
    try:a.parse_routes(malformed)
    except ValueError:ok(True)
    else:raise AssertionError('malformed output accepted')
items=a.plan()
ok(items==a.plan() and len(items)==20)
ok({(x['case_id'],x['arm'],x['repetition']) for x in items[2:]}==
   {(q,arm,i) for q in ('p01','p02','p07') for arm in ('current','no-among') for i in range(3)})
ok(all(x['case_id'] not in x['prompt'] and 'no-among' not in x['prompt'] for x in items[2:]))
usage={'input_tokens':200,'cache_creation_input_tokens':100,'cache_read_input_tokens':0,'output_tokens':20}
init={'type':'system','subtype':'init','model':'claude-opus-5-5','apiKeySource':'none','skills':[],'tools':[],'mcp_servers':[]}
assistant={'type':'assistant','message':{'id':'m1','usage':usage,'content':[{'type':'text','text':'READY'}]}}
final={'type':'result','subtype':'success','is_error':False,'num_turns':1,'total_cost_usd':.001,'usage':usage,'modelUsage':{'claude-opus-5-5':{'provider':'firstParty','costBasis':'list'}},'result':'READY'}
with tempfile.TemporaryDirectory(prefix='paired-routing-offline-') as temp:
    root=Path(temp);workspace=root/'work';hashes=a.materialize(None,workspace);a.r.m.verify(workspace,hashes)
    ok(set(hashes)=={'plugin/.claude-plugin/plugin.json'})
    def inspect(events,phase='task'):
        return a.r.inspect(('\n'.join(json.dumps(x) for x in events)+'\n').encode(),0,workspace,phase,expected_inventory=set(),reported_turn_limit=1)
    ok(inspect([init,assistant,final],'readiness')['evaluation_status']=='EXECUTED')
    second=copy.deepcopy(assistant);second['message']['id']='m2'
    ok(inspect([init,assistant,second,final])['error_class']=='aggregate_input_bound')
    bad=copy.deepcopy(final);bad['num_turns']=2
    ok(inspect([init,assistant,bad])['error_class']=='turn_bound')
    bad=copy.deepcopy(init);bad['tools']=['Read']
    ok(inspect([bad,assistant,final])['error_class']=='unexpected_tools_or_mcp')
    bad=copy.deepcopy(init);bad['skills']=['make-skill:skill-search']
    ok(inspect([bad,assistant,final])['error_class']=='unexpected_skill_inventory')
    bad=copy.deepcopy(assistant);bad['message']['usage']['input_tokens']=12001
    ok(inspect([init,bad,final])['error_class']=='input_bound')
    bad=copy.deepcopy(init);bad['apiKeySource']='env'
    ok(inspect([bad,assistant,final])['error_class']=='unexpected_auth_or_model')
    fake=root/'claude';fake.write_text('''#!/usr/bin/env python3
import json,sys,os,time
if sys.argv[1:]==['--version']: print('2.1.296 (Claude Code)');raise SystemExit
if sys.argv[1:]==['auth','status','--json']:
 print(json.dumps({'loggedIn':True,'authMethod':'claude.ai','apiProvider':'firstParty','subscriptionType':'team'}));raise SystemExit
args=sys.argv[1:]
assert args[args.index('--tools')+1]==args[args.index('--allowedTools')+1]==''
assert args[args.index('--max-turns')+1]=='1'
assert '--restricted' in args and '--disable-slash-commands' in args and '--bare' not in args
assert json.loads(args[args.index('--mcp-config')+1])=={'mcpServers':{}}
assert os.environ['CLAUDE_CODE_MAX_OUTPUT_TOKENS']=='600'
mode=os.environ.get('PAIRED_FAKE_MODE','ok')
if mode=='timeout':time.sleep(3)
i=INIT;a=ASSISTANT;f=FINAL
if mode=='unknown':f.pop('total_cost_usd')
if mode=='overshoot':f['total_cost_usd']=2
if args[-1]!='READY_PROMPT':
 a['message']['content'][0]['text']='ROUTE: super-ux\\nWHY: interface work.';f['result']=a['message']['content'][0]['text']
if mode=='format' and args[-1]!='READY_PROMPT':
 a['message']['content'][0]['text']='unstructured';f['result']='unstructured'
for row in (i,a,f):print(json.dumps(row))
'''.replace('INIT',repr(init)).replace('ASSISTANT',repr(assistant)).replace('FINAL',repr(final)).replace("'READY_PROMPT'",repr(a.r.READY_PROMPT)))
    fake.chmod(0o700)
    pair=[items[0],items[2]]
    for mode,want in [('ok','COMPLETED'),('unknown','STOPPED_TEST_ERROR'),('overshoot','STOPPED_BUDGET_OVERSHOOT'),('timeout','STOPPED_TEST_ERROR'),('format','STOPPED_TEST_ERROR')]:
        args=SimpleNamespace(source_repo=ROOT.parents[3],output=root/(mode+'.json'),private_dir=root/(mode+'-raw'))
        with patch.object(a,'check_admission',return_value='offline-only'),patch.object(a,'plan',return_value=pair),patch.object(a,'MAX_CALLS',2),patch.object(a.r,'TIMEOUT',.1 if mode=='timeout' else 180),patch.dict(os.environ,{'PATH':str(root)+os.pathsep+os.environ['PATH'],'PAIRED_FAKE_MODE':mode}),contextlib.redirect_stdout(io.StringIO()):
            result=a.execute(args)
        receipt=json.loads(args.output.read_text())
        ok(receipt['status']==want)
        ok(len(receipt['calls'])==(2 if mode in ('ok','format') else 1))
        ok(receipt['cost_incomplete']==(mode in ('unknown','timeout')))
        ok(all((p.stat().st_mode&0o777)==0o600 for p in args.private_dir.rglob('*') if p.is_file()))
    with patch.object(a,'check_admission',return_value='original'):
        frozen=a.binding()
        with patch.object(a,'check_admission',return_value='replaced'):
            ok(a.binding()!=frozen)
        read=Path.read_bytes
        with patch.object(Path,'read_bytes',lambda p:read(p)+b' ' if p==ROOT/'arms.json' else read(p)),patch.object(a,'source',return_value={}):
            ok(a.binding()!=frozen)
    args=SimpleNamespace(source_repo=ROOT.parents[3],output=root/'existing.json',private_dir=root/'existing-raw')
    args.output.write_text('{}')
    with patch.object(a,'check_admission',return_value='offline-only'):
        try:a.execute(args)
        except ValueError as e:ok(str(e)=='receipt_exists')
        else:raise AssertionError('existing output accepted')
    (workspace/'foreign.txt').write_text('change')
    try:a.r.m.verify(workspace,hashes)
    except AssertionError:ok(True)
    else:raise AssertionError('workspace corruption accepted')
print(f'PASS: {checks} offline paired-reader controls; zero provider calls')
