#!/usr/bin/env python3
"""Offline trace and fake-process corruption controls; zero provider requests."""
import contextlib,copy,importlib.util,io,json,os,stat,tempfile
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('search_runner',ROOT/'run.py');a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
checks=0

def ok(value):
 global checks
 assert value
 checks+=1

items=a.plan();ok(len(items)==61);ok(items==a.plan());ok(len({(x['case_id'],x['repetition']) for x in items[1:]})==60)
ok(all(x['case_id'] not in x['prompt'] for x in items[1:]))
usage={'input_tokens':200,'cache_creation_input_tokens':100,'cache_read_input_tokens':0,'output_tokens':20}
init={'type':'system','subtype':'init','model':'claude-opus-5-5','apiKeySource':'none','skills':sorted(a.r.SKILLS),'tools':['Skill'],'mcp_servers':[]}
assistant={'type':'assistant','message':{'id':'m1','usage':usage,'content':[{'type':'text','text':'READY'}]}}
final={'type':'result','subtype':'success','is_error':False,'num_turns':1,'total_cost_usd':.001,'usage':usage,'modelUsage':{'claude-opus-5-5':{'provider':'firstParty','costBasis':'list'}},'result':'READY'}
with tempfile.TemporaryDirectory(prefix='skill-search-offline-') as temp:
 root=Path(temp);workspace=root/'work';hashes=a.materialize(ROOT.parents[3]/'skills/make-skill',workspace);a.r.m.verify(workspace,hashes);ok(len(hashes)==len(a.source()['files']))
 def parse(events,phase='task'):
  return a.r.inspect(('\n'.join(json.dumps(x) for x in events)+'\n').encode(),0,workspace,phase)
 ok(parse([init,assistant,final],'readiness')['evaluation_status']=='EXECUTED')
 ok(parse([init,assistant,final])['native']['skill_loads']==[])
 call=copy.deepcopy(assistant);call['message']['content']=[{'type':'tool_use','id':'t1','name':'Skill','input':{'skill':'make-skill:skill-search'}}]
 reply={'type':'user','message':{'content':[{'type':'tool_result','tool_use_id':'t1','content':'Loaded'}]}}
 text=copy.deepcopy(assistant);text['message']['id']='m2';text['message']['content']=[{'type':'text','text':'Tool loaded.'}]
 done=copy.deepcopy(final);done.update(num_turns=2,result='Tool loaded.')
 events=[init,call,reply,text,done]
 ok(parse(events)['native']['skill_loads']==['make-skill:skill-search'])
 denied=copy.deepcopy(reply);denied['message']['content'][0]['is_error']=True
 ok(parse([init,call,denied,text,done])['error_class']=='tool_denied_or_error')
 ok(parse([init,call,text,done])['error_class']=='unmatched_tool_result')
 foreign=copy.deepcopy(init);foreign['skills'].append('foreign:tool')
 ok(parse([foreign,assistant,final])['error_class']=='unexpected_skill_inventory')
 bad=copy.deepcopy(done);bad['total_cost_usd']=None
 ok(parse([init,call,reply,text,bad])['error_class']=='unknown_cost_or_usage')
 repeated=copy.deepcopy(assistant);repeated['message']['usage']=dict(usage,input_tokens=201)
 ok(parse([init,assistant,repeated,final])['error_class']=='conflicting_request_usage')
 bad=copy.deepcopy(init);bad['apiKeySource']='env'
 ok(parse([bad,assistant,final])['error_class']=='unexpected_auth_or_model')
 ok(len(parse([init,assistant,text,done])['artifact_text_blocks'])==2)
 dummy={'case_id':'s01','evaluation_status':'EXECUTED','native':{'skill_loads':['make-skill:skill-search']}}
 ok(a.score([dummy,dummy])[0]['verdict']=='NOT_SCORED');ok(a.score([dummy,dummy,dummy])[0]['verdict']=='PASS')
 # Actual fake executable: all runner subprocess and file lifecycle paths execute.
 fake=root/'claude';fake.write_text('''#!/usr/bin/env python3
import json,sys,os,time
if sys.argv[1:]==['--version']: print('2.1.296 (Claude Code)');raise SystemExit
if sys.argv[1:]==['auth','status','--json']:
 print(json.dumps({'loggedIn':True,'authMethod':'claude.ai','apiProvider':'firstParty','subscriptionType':'team'}));raise SystemExit
args=sys.argv[1:]
assert args[args.index('--tools')+1]=='Skill' and args[args.index('--allowedTools')+1]=='Skill'
assert '--restricted' in args and '--bare' not in args and '--disable-slash-commands' not in args
settings=json.loads(args[args.index('--settings')+1]);assert settings['disableAllHooks'] and settings['disableBundledSkills']
assert json.loads(args[args.index('--mcp-config')+1])=={'mcpServers':{}}
mode=os.environ.get('SEARCH_FAKE_MODE','ok')
if mode=='timeout':time.sleep(3)
i=INIT;a=ASSISTANT;f=FINAL
if mode=='unknown':f.pop('total_cost_usd')
if mode=='overshoot':f['total_cost_usd']=5
if args[args.index('--max-turns')+1]!='1':a['message']['content'][0]['text']='No tool needed.';f['result']='No tool needed.'
for row in (i,a,f):print(json.dumps(row))
'''.replace('INIT',repr(init)).replace('ASSISTANT',repr(assistant)).replace('FINAL',repr(final)));fake.chmod(0o700)
 for mode,want in [('ok','COMPLETED'),('unknown','STOPPED_TEST_ERROR'),('overshoot','STOPPED_BUDGET_OVERSHOOT'),('timeout','STOPPED_TEST_ERROR')]:
  output=root/(mode+'.json');private=root/(mode+'-raw');args=SimpleNamespace(source_repo=ROOT.parents[3]/'skills/make-skill',output=output,private_dir=private)
  with patch.object(a,'check_admission',return_value='offline-fake-only'),patch.object(a,'plan',return_value=items[:2]),patch.object(a,'MAX_CALLS',2),patch.object(a.r,'TIMEOUT',.1 if mode=='timeout' else 180),patch.dict(os.environ,{'PATH':str(root)+os.pathsep+os.environ['PATH'],'SEARCH_FAKE_MODE':mode}),contextlib.redirect_stdout(io.StringIO()):code=a.execute(args)
  receipt=json.loads(output.read_text());assert receipt['status']==want,(mode,receipt);ok(True)
  ok(all((p.stat().st_mode&0o777)==0o600 for p in private.rglob('*') if p.is_file()))
  ok(len(receipt['calls'])==(2 if mode=='ok' else 1))
  ok(receipt['cost_incomplete']==(mode in ('unknown','timeout')))
 # A coordinated manifest/corpus/admission replacement cannot retain the binding.
 with patch.object(a,'check_admission',return_value='offline-initial'):
  frozen=a.binding()
  with patch.object(a,'check_admission',return_value='offline-replaced'):
   ok(a.binding()!=frozen)
  original_read=Path.read_bytes;initial_source=a.source()
  for changed in ('source.json','cases.json'):
   with patch.object(Path,'read_bytes',lambda path:original_read(path)+b' ' if path==ROOT/changed else original_read(path)),patch.object(a,'source',return_value=initial_source):
    ok(a.binding()!=frozen)
  mutated=copy.deepcopy(json.loads((ROOT/'cases.json').read_text())['queries']);mutated[0]['should_trigger']=False
  ok(a.score([dummy,dummy,dummy],mutated)[0]['verdict']=='FAIL')
 # Crash-state receipt: no in-flight invocation is labelled complete-cost.
 original_save=a.b.save_receipt
 def observed_save(path,receipt):
  if receipt.get('calls') and receipt['calls'][-1].get('state')=='STARTED':
   assert receipt['cost_incomplete'] is True
  original_save(path,receipt)
 # Mid-request manifest admission change stops; no later cells execute or regrade.
 args=SimpleNamespace(source_repo=ROOT.parents[3]/'skills/make-skill',output=root/'midrun.json',private_dir=root/'midrun-raw')
 calls_to_binding=0
 original_binding=a.binding
 def changed_binding():
  global calls_to_binding
  calls_to_binding+=1
  value=original_binding()
  if calls_to_binding>=4:value=dict(value,source='changed-after-request')
  return value
 with patch.object(a,'check_admission',return_value='offline-fake-only'),patch.object(a,'binding',side_effect=changed_binding),patch.object(a,'plan',return_value=items[:2]),patch.object(a,'MAX_CALLS',2),patch.object(a.b,'save_receipt',side_effect=observed_save),patch.dict(os.environ,{'PATH':str(root)+os.pathsep+os.environ['PATH'],'SEARCH_FAKE_MODE':'ok'}),contextlib.redirect_stdout(io.StringIO()):
  code=a.execute(args)
 stopped=json.loads(args.output.read_text())
 ok(code==1 and stopped['status']=='STOPPED_PROTOCOL_CHANGED' and len(stopped['calls'])==1 and stopped['cost_incomplete'])
 ok(all(x['verdict']=='NOT_SCORED' for x in stopped['scores']))
 # Changed source bytes and changed workspace are refused before/after a request.
 original=a.subprocess.check_output
 with patch.object(a.subprocess,'check_output',side_effect=lambda argv,**kw:b'bad' if argv[1]=='show' else original(argv,**kw)):
  try:a.materialize(ROOT.parents[3]/'skills/make-skill',root/'corrupt')
  except AssertionError:ok(True)
  else:raise AssertionError('corrupt source admitted')
 (workspace/'unexpected').write_text('changed')
 try:a.r.m.verify(workspace,hashes)
 except AssertionError:ok(True)
 else:raise AssertionError('workspace mutation accepted')
print(f'PASS: {checks} offline native trigger controls; zero provider calls')
