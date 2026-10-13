#!/usr/bin/env python3
"""Offline tests; the fake CLI is an owned Python process, never a provider."""
import copy
import importlib.util
import json
import os
from pathlib import Path
import stat
import tempfile
from types import SimpleNamespace
from unittest.mock import patch

ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('runner',ROOT/'run-description-screening-v2.py')
r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
f,p,c=r.load();allowed={x['id'] for x in f['arms']['full']};case=f['cases'][0]
plan=r.make_plan(f,10132026)
assert plan==r.make_plan(f,10132026) and plan!=r.make_plan(f,3)
assert len(plan)==24 and len({x['case_id'] for x in plan})==12
for x in plan:
 payload=json.loads(x['prompt']);assert set(payload)=={'instructions','data_boundary','catalogue','task'}
 assert set(payload['task'])=={'id','prompt'} and 'accepted_sets' not in x['prompt']
 assert 'rationale' not in x['prompt'] and 'source_skills' not in x['prompt']
for i in range(0,24,2):
 assert plan[i]['case_id']==plan[i+1]['case_id'] and plan[i]['catalogue_order']==plan[i+1]['catalogue_order']
 assert {plan[i]['arm'],plan[i+1]['arm']}=={'full','concise'}
for key in ['ANTHROPIC_API_KEY','ANTHROPIC_AUTH_TOKEN','CLAUDE_CODE_OAUTH_TOKEN','CLAUDE_CONFIG_DIR','ANTHROPIC_FUTURE_AUTH','CLAUDE_CODE_USE_FUTURE']:
 try:r.check_environment({key:'do-not-print-me'})
 except ValueError as exc:assert 'do-not-print-me' not in str(exc)
 else:raise AssertionError(key)
r.check_environment({})
argv=r.checked_command(p)
bad=copy.deepcopy(p);bad['argv'][bad['argv'].index('--tools')+1]='Bash'
try:r.checked_command(bad)
except AssertionError:pass
else:raise AssertionError('tool widening accepted')
init={'type':'system','subtype':'init','model':'claude-opus-5-5','apiKeySource':'none',**{k:[{}]*v for k,v in p['init_counts'].items()}}
final={'type':'result','subtype':'success','is_error':False,'num_turns':1,'result':json.dumps(case['accepted_sets'][0]),'total_cost_usd':0.01,'usage':{'input_tokens':1000,'cache_creation_input_tokens':2000,'cache_read_input_tokens':0,'output_tokens':8,'server_tool_use':{'web_search_requests':0,'web_fetch_requests':0}},'modelUsage':{'claude-opus-5-5':{'provider':'firstParty','costBasis':'list'}}}
def parse(events,code=0):return r.parse_result(('\n'.join(json.dumps(x) for x in events)+'\n').encode(),code,p,case,c,allowed)
assert parse([init,final])['score']=='PASS'
for mutate,error in [
 (lambda a,b:a.update(tools=[{}]),'startup_contamination'),
 (lambda a,b:b.update(total_cost_usd=None),'unknown_cost_or_usage'),
 (lambda a,b:b.update(result='not json'),'invalid_selection_schema'),
 (lambda a,b:b.update(result='["unknown"]'),'invalid_selection_schema'),
 (lambda a,b:b.update(num_turns=2),'unexpected_turn_or_tool'),
 (lambda a,b:b['usage'].update(input_tokens=20000),'input_envelope_exceeded'),
 (lambda a,b:b.update(is_error=True,result='usage limit reached'),'usage_limit'),
 (lambda a,b:b['modelUsage']['claude-opus-5-5'].update(provider='foreign'),'unexpected_provider_or_cost_basis'),
]:
 a,b=copy.deepcopy(init),copy.deepcopy(final);mutate(a,b);got=parse([a,b]);assert got['error_class']==error,(error,got)
assert parse([init,final], 'TIMEOUT')['score'] is None
assert parse([init,final,final])['error_class']=='transport_timeout_or_stream'
with tempfile.TemporaryDirectory(prefix='fw08-runner-test-') as temp:
 base=Path(temp);fake=base/'claude'
 # Every CLI invocation must receive one task and the label-free catalogue.
 fake.write_text('#!/usr/bin/env python3\n'+'''import sys,json,os,time
from pathlib import Path
if sys.argv[1:]==['--version']:
 print('2.1.296 (Claude Code)');raise SystemExit(0)
if sys.argv[1:]==['auth','status','--json']:
 print(json.dumps({'loggedIn':True,'authMethod':'claude.ai','apiProvider':'firstParty','subscriptionType':'team','email':'PRIVATE_SENTINEL'}));raise SystemExit(0)
payload=json.loads(sys.argv[-1]);assert set(payload['task'])=={'id','prompt'}
assert len(payload['catalogue'])==39 and not list(Path.cwd().iterdir())
assert 'accepted_sets' not in sys.argv[-1]
init=INIT
final=FINAL
final['result']='[]';final['private_unexpected_field']='PRIVATE_SENTINEL'
mode=os.environ.get('FW08_FAKE_MODE','ok')
if mode=='budget':final['total_cost_usd']=0.25
if mode=='error':final.update(is_error=True,result='usage limit PRIVATE_SENTINEL')
if mode=='schema':final['result']='PRIVATE_SENTINEL'
if mode=='unknown-cost':final.pop('total_cost_usd')
if mode=='timeout':time.sleep(3)
print(json.dumps(init));print(json.dumps(final));print('PRIVATE_SENTINEL',file=sys.stderr)
'''.replace('init=INIT','init='+repr(init)).replace('final=FINAL','final='+repr(final)))
 fake.chmod(0o700)
 environment={k:v for k,v in os.environ.items() if k not in r.DENY_ENV and not k.startswith('ANTHROPIC_') and not k.startswith('CLAUDE_CODE_USE_')}
 environment['PATH']=str(base)+os.pathsep+environment['PATH']
 for mode,expected,n in [('ok','COMPLETED',24),('budget','STOPPED_BUDGET',16),('error','STOPPED_TEST_ERROR',1),('schema','STOPPED_TEST_ERROR',1),('unknown-cost','STOPPED_TEST_ERROR',1),('timeout','STOPPED_TEST_ERROR',1)]:
  args=SimpleNamespace(output=base/(mode+'.json'),private_dir=base/(mode+'-raw'),seed=10132026)
  with patch.dict(os.environ,dict(environment,FW08_FAKE_MODE=mode),clear=True),patch.object(r,'TIMEOUT',0.1 if mode=='timeout' else 10):
   code=r.execute(f,p,c,plan,args)
   result=json.loads(args.output.read_text());assert result['status']==expected,result
   assert len(result['calls'])==n and ('PRIVATE_SENTINEL' not in args.output.read_text())
   assert code==(0 if mode=='ok' else 1)
   try:r.execute(f,p,c,plan,args)
   except ValueError:pass
   else:raise AssertionError('implicit retry accepted')
  assert stat.S_IMODE(args.private_dir.stat().st_mode)==0o700
  for item in args.private_dir.rglob('*'):
   assert stat.S_IMODE(item.stat().st_mode)==(0o700 if item.is_dir() else 0o600)
print('PASS: seeded label-free pairs; auth/context rejection; parser and contamination controls; six fake-process runs; budget16/24; stop/no-retry; private0600/public sanitization')
