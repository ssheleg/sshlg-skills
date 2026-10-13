#!/usr/bin/env python3
"""Offline fake-CLI checks. No model, provider or installed configuration writes."""
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
s=importlib.util.spec_from_file_location('native_runner',ROOT/'run.py');r=importlib.util.module_from_spec(s);s.loader.exec_module(r)
REPO=Path(os.environ.get('NATIVE_SOURCE_REPO','/Users/sshlg/DATA/sheleg-dev'))
original_output=r.m.subprocess.check_output
assert r.plan(1)==r.plan(1) and r.plan(1)!=r.plan(2)
assert [x['phase'] for x in r.plan(1)[:2]]==['readiness','readiness']
assert len(r.plan(1))==6
with patch.dict(os.environ,{'ANTHROPIC_API_KEY':'PRIVATE_NATIVE_SENTINEL'}),patch.object(r.subprocess,'run',side_effect=AssertionError('auth command must not run')):
 try:r.preflight(ROOT)
 except ValueError as exc:assert 'PRIVATE_NATIVE_SENTINEL' not in str(exc)
 else:raise AssertionError('foreign auth admitted')
for item in r.plan(1):
 assert 'rubric' not in item['prompt'] and 'sheleg-dev:google-auth' not in item['prompt']
 if item['phase']=='task':assert item['case_id'] not in item['prompt']
init={'type':'system','subtype':'init','model':'claude-opus-5-5','apiKeySource':'none','skills':sorted(r.SKILLS),'tools':sorted(r.TOOLS),'mcp_servers':[]}
usage={'input_tokens':200,'cache_creation_input_tokens':100,'cache_read_input_tokens':0,'output_tokens':20}
assistant={'type':'assistant','message':{'usage':usage.copy(),'content':[{'type':'text','text':'READY'}]}}
final={'type':'result','subtype':'success','is_error':False,'num_turns':1,'total_cost_usd':0.1,'usage':usage.copy(),'modelUsage':{'claude-opus-5-5':{'provider':'firstParty','costBasis':'list'}},'result':'READY'}
with tempfile.TemporaryDirectory(prefix='native-check-') as temp:
 root=Path(temp);full=root/'full';concise=root/'concise'
 with patch.object(r.m.subprocess,'check_output',side_effect=lambda args,**kwargs: b'corrupt' if args[1]=='show' else original_output(args,**kwargs)):
  try:r.m.build(REPO,root/'corrupt-source','full')
  except AssertionError:pass
  else:raise AssertionError('corrupt source accepted')
 hf=r.m.build(REPO,full,'full');hc=r.m.build(REPO,concise,'concise');r.m.verify(full,hf);r.m.verify(concise,hc)
 assert set(hf)==set(hc)
 for name in hf:
  a=(full/name).read_bytes();b=(concise/name).read_bytes()
  if name.endswith('/SKILL.md'):assert a.split(b'\n---',1)[1]==b.split(b'\n---',1)[1]
  else:assert a==b
 def parse(events,phase='readiness',code=0):return r.inspect(('\n'.join(json.dumps(x) for x in events)+'\n').encode(),code,full,phase)
 assert parse([init,assistant,final])['evaluation_status']=='EXECUTED'
 for change,error in [
  (lambda a,b,c:a['skills'].append('foreign:secret'),'unexpected_skill_inventory'),
  (lambda a,b,c:a['skills'].append('doctor'),'unexpected_skill_inventory'),
  (lambda a,b,c:a['skills'].pop(),'unexpected_skill_inventory'),
  (lambda a,b,c:a.update(skills=[{}]),'unexpected_skill_inventory'),
  (lambda a,b,c:a['tools'].append('Bash'),'unexpected_tools_or_mcp'),
  (lambda a,b,c:a.update(apiKeySource='env'),'unexpected_auth_or_model'),
  (lambda a,b,c:c.update(total_cost_usd=None),'unknown_cost_or_usage'),
  (lambda a,b,c:b['message']['usage'].update(input_tokens=r.READY_INPUT+1),'input_bound'),
  (lambda a,b,c:c.update(num_turns=2),'turn_bound'),
  (lambda a,b,c:c.update(result='```READY```'),'invalid_final_artifact'),
 ]:
  a,b,c=copy.deepcopy((init,assistant,final));change(a,b,c);assert parse([a,b,c])['error_class']==error,error
 call={'type':'tool_use','id':'t1','name':'Read','input':{'file_path':str(full/'app/client.py')}}
 response={'type':'user','message':{'content':[{'type':'tool_result','tool_use_id':'t1','content':'fixture source','is_error':False}]}}
 a=copy.deepcopy(assistant);a['message']['content']=[call]
 c=copy.deepcopy(final);c['result']='Audit findings with evidence.'
 assert parse([init,a,response,c],'task')['native']['read_files']==['app/client.py']
 for mode,error in [('outside','outside_workspace_read'),('bash','unallowed_tool'),('denied','tool_denied_or_error')]:
  b=copy.deepcopy(a);res=copy.deepcopy(response)
  if mode=='outside':b['message']['content'][0]['input']['file_path']=str(root/'not-workspace')
  if mode=='bash':b['message']['content'][0]['name']='Bash'
  if mode=='denied':res['message']['content'][0]['is_error']=True
  assert parse([init,b,res,c],'task')['error_class']==error
 assert parse([init,a,response,final])['error_class']=='readiness_tool_use'
 fake=root/'claude';fake.write_text('#!/usr/bin/env python3\n'+'''import json,sys,os,time
from pathlib import Path
if sys.argv[1:]==['--version']:print('2.1.296 (Claude Code)');raise SystemExit(0)
if sys.argv[1:]==['auth','status','--json']:
 print(json.dumps({'loggedIn':True,'authMethod':'claude.ai','apiProvider':'firstParty','subscriptionType':'team','email':'PRIVATE_NATIVE_SENTINEL'}));raise SystemExit(0)
args=sys.argv[1:];assert '--restricted' in args and '--bare' not in args and '--disable-slash-commands' not in args
assert set(args[args.index('--tools')+1].split(','))=={'Read','Skill','Glob','Grep'}
assert set(args[args.index('--allowedTools')+1].split(','))=={'Read','Skill','Glob','Grep'}
settings=json.loads(args[args.index('--settings')+1]);assert settings['disableAllHooks'] is True
assert settings['disableBundledSkills'] is True and settings['skillOverrides']=={'doctor':'off'}
assert 'enabledPlugins' not in settings
assert json.loads(args[args.index('--mcp-config')+1])=={'mcpServers':{}}
assert not list(Path.cwd().rglob('rubric.json')) and not list(Path.cwd().rglob('tasks.json'))
init=INIT
assistant=ASSISTANT
final=FINAL
mode=os.environ.get('NATIVE_FAKE_MODE','ok');phase='readiness' if args[args.index('--max-turns')+1]=='1' else 'task'
if phase=='task':
 assistant['message']['content']=[{'type':'tool_use','id':'s1','name':'Skill','input':{'skill':'sheleg-dev:google-auth'}},{'type':'tool_use','id':'r1','name':'Read','input':{'file_path':str(Path.cwd()/'app/client.py')}}]
 final['result']='Audit artifact PRIVATE_NATIVE_SENTINEL';final['num_turns']=2
if mode=='contamination':init['skills'].append('foreign:secret')
if mode=='unknown-cost':final.pop('total_cost_usd')
if mode=='budget':final['total_cost_usd']=0.75
if mode=='overshoot':final['total_cost_usd']=4.1
if mode=='timeout':time.sleep(3)
print(json.dumps(init));print(json.dumps(assistant))
if phase=='task':print(json.dumps({'type':'user','message':{'content':[{'type':'tool_result','tool_use_id':x,'content':'PRIVATE_NATIVE_SENTINEL','is_error':False} for x in ('s1','r1')]}}))
print(json.dumps(final));print('PRIVATE_NATIVE_SENTINEL',file=sys.stderr)
'''.replace('init=INIT','init='+repr(init)).replace('assistant=ASSISTANT','assistant='+repr(assistant)).replace('final=FINAL','final='+repr(final)));fake.chmod(0o700)
 env={k:v for k,v in os.environ.items() if k not in r.base.DENY_ENV and not k.startswith(('ANTHROPIC_','CLAUDE_CODE_USE_')) and k!='CLAUDE_CODE_SAFE_MODE'};env['PATH']=str(root)+os.pathsep+env['PATH']
 for mode,status,n in [('ok','COMPLETED',6),('contamination','STOPPED_TEST_ERROR',1),('unknown-cost','STOPPED_TEST_ERROR',1),('budget','STOPPED_BUDGET',5),('overshoot','STOPPED_BUDGET_OVERSHOOT',1),('timeout','STOPPED_TEST_ERROR',1)]:
  args=SimpleNamespace(output=root/(mode+'.json'),private_dir=root/(mode+'-raw'),source_repo=REPO,seed=10132027)
  with patch.dict(os.environ,dict(env,NATIVE_FAKE_MODE=mode),clear=True),patch.object(r,'TIMEOUT',0.1 if mode=='timeout' else 10):
   code=r.execute(args);receipt=json.loads(args.output.read_text());assert receipt['status']==status,(mode,receipt);assert len(receipt['calls'])==n
   assert receipt['prior_reported_list_usd']==r.PRIOR_COST
   assert abs(receipt['combined_known_list_usd']-receipt['reported_list_usd']-r.PRIOR_COST)<1e-9
   assert code==(0 if mode=='ok' else 1)
   try:r.execute(args)
   except ValueError:pass
   else:raise AssertionError('implicit retry')
  assert 'PRIVATE_NATIVE_SENTINEL' not in args.output.read_text()
  assert stat.S_IMODE(args.private_dir.stat().st_mode)==0o700
  assert all(stat.S_IMODE(p.stat().st_mode)==(0o700 if p.is_dir() else 0o600) for p in args.private_dir.rglob('*'))
print('PASS: source/body parity; native readiness and tool controls; six fake-process modes; no retries; private/public boundary; no provider calls')
