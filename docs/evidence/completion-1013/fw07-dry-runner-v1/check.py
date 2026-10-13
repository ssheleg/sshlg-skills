"""Offline harness controls. Prepared source bundle only; no subprocess/provider path."""
import argparse
import ast
import copy
import json
import os
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch
import harness as H

BUNDLE=None

def counts(n=10,out=1):
    return dict(zip(H.KEYS,(n,0,0,out)))

def assistant(rid,content,n=10,out=1,uid=None):
    value={'type':'assistant','message':{'id':rid,'usage':counts(n,out),'content':content}}
    if uid:value['uuid']=uid
    return value

def text(value):return {'type':'text','text':value}

def tape(protocol,item):
    host=protocol['host']
    init={'type':'system','subtype':'init','model':host['model'],'apiKeySource':'none','skills':list(host['source_expected_inventory']),'tools':list(host['tools']),'mcp_servers':[]}
    final={'type':'result','subtype':'success','is_error':False,'total_cost_usd':0.01,'num_turns':1,'usage':counts(),'modelUsage':{host['model']:{'provider':'firstParty','costBasis':'list'}},'result':'READY'}
    if item['phase']=='readiness':return [init,assistant('r1',[text('READY')]),final]
    case=item['case'];stage={'q11':'00-intake','q24':'03-spec','q37':'05-dev','q42':'07-lint-deploy','q58':'10-acceptance','q63':'05-dev','q86':'05-dev'}.get(case['id'])
    if case['id']=='q79':file='{{PROJECT}}/notes/local-review.md'
    else:
        detail='references/stages.md' if item['arm']=='control' else 'references/stage-'+stage+'.md'
        if case.get('fault'):detail=case['fault'][item['arm']]
        file='{{PLUGIN}}/skills/task-pipeline/'+detail
    first=assistant('r1',[{'type':'tool_use','id':'s1','name':'Skill','input':{'skill':'task-pipeline:task-pipeline'}}],out=2)
    loaded={'type':'user','message':{'content':[{'type':'tool_result','tool_use_id':'s1','content':'loaded'}]}}
    second=assistant('r2',[{'type':'tool_use','id':'t1','name':'Read','input':{'file_path':file}}],n=20,out=2)
    read={'type':'user','message':{'content':[{'type':'tool_result','tool_use_id':'t1','content':'not found' if case.get('fault') else 'source','is_error':bool(case.get('fault'))}]}}
    result=assistant('r3',[text('Source reviewed. Synthetic answer for independent review.')],n=30,out=3)
    final.update(usage=counts(60,7),num_turns=5,result=result['message']['content'][0]['text'])
    return [init,first,loaded,second,read,result,final]

class Controls(unittest.TestCase):
    def setUp(self):
        self.temp=Path(tempfile.mkdtemp(prefix='fw07-fake-')).resolve()
        self.packet=self.temp/'packet';shutil.copytree(H.PROPOSAL,self.packet)
        self.bundle=BUNDLE
        self.f=H.Frozen(self.packet,self.bundle)
        self.item=self.f.plan()[2]
        self.work=self.temp/'cells';self.work.mkdir()
        self.ctx=self.f.materialize(self.work,self.item)
        self.p=self.f.protocol
    def mutable_bundle(self):
        self.bundle=self.temp/'bundle';shutil.copytree(BUNDLE,self.bundle);self.f=H.Frozen(self.packet,self.bundle)
    def tearDown(self):shutil.rmtree(self.temp)
    def parse(self,events=None,item=None,ctx=None):
        item=item or self.item;ctx=ctx or self.ctx
        events=events or tape(self.p,item)
        payload={k:str(ctx[k]) if isinstance(ctx[k],Path) else ctx[k] for k in ('prompt','project','plugin','settings','tools','mcp','mode','session_persistence')}
        stream=list(H.FakeAdapter([events]).stream(payload))
        return H.inspect(stream,ctx,item,self.p)
    def reject(self,mutate,code=None):
        events=tape(self.p,self.item);mutate(events)
        with self.assertRaises(H.Refusal) as caught:self.parse(events)
        if code:self.assertEqual(str(caught.exception),code)
    def test_full_plan_eighteen_fresh_cells(self):
        plan=self.f.plan();adapter=H.FakeAdapter([tape(self.p,c) for c in plan]);r=H.Runner(self.f,self.temp/'run');value=r.run(adapter)
        self.assertEqual(value['status'],'DRY_ONLY_COMPLETED');self.assertEqual(adapter.calls,18);self.assertEqual(value['provider_calls'],0)
        self.assertEqual(len(list(r.visible.iterdir())),18)
        self.assertTrue(all(p.stat().st_mode&0o777==0o600 for p in r.private.rglob('*') if p.is_file()))
        self.assertTrue(all('q79' not in p.name and 'control' not in p.name for p in r.visible.iterdir()))
        with self.assertRaises(H.Refusal):r.run(adapter)
        with self.assertRaises(H.Refusal):H.Runner(self.f,self.temp/'run')
    def test_chunk_identity_dedup_and_full_text(self):
        e=tape(self.p,self.item);e.insert(-1,assistant('r3',[text('The tail.')],n=30,out=4));e[-1]['usage']=counts(60,8);e[-1]['result']='The tail.'
        out=self.parse(e);self.assertEqual(out['request_count'],3);self.assertIn('Source reviewed.',out['artifact']);self.assertTrue(out['artifact'].endswith('The tail.'))
    def test_exact_uuid_replay_dedup(self):
        e=tape(self.p,self.item);e[-2]['uuid']='x';e.insert(-1,copy.deepcopy(e[-2]));self.assertEqual(self.parse(e)['request_count'],3)
    def test_conflicting_uuid(self):
        def change(e):e[-2]['uuid']='x';v=copy.deepcopy(e[-2]);v['message']['content']=[text('different')];e.insert(-1,v)
        self.reject(change,'conflicting_event')
    def test_usage_conflict(self):
        def change(e):e.insert(-1,assistant('r3',[text('tail')],n=31,out=3))
        self.reject(change,'conflicting_usage')
    def test_missing_request_id(self):self.reject(lambda e:e[1]['message'].pop('id'),'request_identity')
    def test_nan_usage(self):self.reject(lambda e:e[1]['message']['usage'].update(input_tokens=float('nan')))
    def test_negative_usage(self):self.reject(lambda e:e[1]['message']['usage'].update(input_tokens=-1),'request_usage')
    def test_bool_usage(self):self.reject(lambda e:e[1]['message']['usage'].update(input_tokens=True),'request_usage')
    def test_input_cap(self):self.reject(lambda e:e[1]['message']['usage'].update(input_tokens=64001),'request_bound')
    def test_output_cap(self):self.reject(lambda e:e[1]['message']['usage'].update(output_tokens=1801),'request_bound')
    def test_aggregate_mismatch(self):self.reject(lambda e:e[-1]['usage'].update(input_tokens=61),'usage_reconciliation')
    def test_reported_turn_cap(self):self.reject(lambda e:e[-1].update(num_turns=16),'turn_bound')
    def test_unique_request_cap(self):
        def change(e):
            for n in range(6):e.insert(-1,assistant('extra'+str(n),[text('a')]))
        self.reject(change,'request_count')
    def test_cost_unknown(self):self.reject(lambda e:e[-1].pop('total_cost_usd'),'cost_unknown')
    def test_nonfinite_cost(self):self.reject(lambda e:e[-1].update(total_cost_usd=float('inf')))
    def test_auth_route(self):self.reject(lambda e:e[0].update(apiKeySource='environment'),'auth_model')
    def test_foreign_provider(self):self.reject(lambda e:e[-1]['modelUsage'][self.p['host']['model']].update(provider='other'),'provider')
    def test_inventory_extra(self):self.reject(lambda e:e[0]['skills'].append('foreign'),'inventory_skills')
    def test_inventory_duplicate(self):self.reject(lambda e:e[0]['skills'].append(e[0]['skills'][0]),'inventory_skills')
    def test_tool_inventory(self):self.reject(lambda e:e[0]['tools'].append('Bash'),'inventory_tools')
    def test_mcp(self):self.reject(lambda e:e[0].update(mcp_servers=['foreign']),'mcp')
    def test_server_tool_usage(self):self.reject(lambda e:e[-1]['usage'].update(server_tool_use={'web_search_requests':1}),'network')
    def test_forbidden_call(self):self.reject(lambda e:e[1]['message']['content'][0].update(name='Bash'),'tool_forbidden')
    def test_result_before_call(self):self.reject(lambda e:e.insert(1,e.pop(2)),'tool_result_order')
    def test_unmatched_tool(self):self.reject(lambda e:e.pop(2),'tool_unmatched')
    def test_unknown_skill(self):self.reject(lambda e:e[1]['message']['content'][0]['input'].update(skill='foreign'),'skill_error')
    def test_outside_read(self):self.reject(lambda e:e[3]['message']['content'][0]['input'].update(file_path='/etc/passwd'),'outside_read')
    def test_internal_symlink(self):
        target=self.ctx['project']/'link';target.symlink_to(self.ctx['plugin']/'skills/task-pipeline/SKILL.md')
        self.reject(lambda e:e[3]['message']['content'][0]['input'].update(file_path=str(target)),'tool_path_alias')
    def test_missing_ordinary_file(self):self.reject(lambda e:e[3]['message']['content'][0]['input'].update(file_path='not-present'),'missing_tool_target')
    def test_unexpected_tool_error(self):self.reject(lambda e:e[2]['message']['content'][0].update(is_error=True),'skill_error')
    def test_declared_missing_source(self):
        item=next(c for c in self.f.plan() if c.get('case',{}).get('id')=='q86');ctx=self.f.materialize(self.work,item)
        out=self.parse(item=item,ctx=ctx);self.assertEqual(len(out['expected_missing']),1);self.assertEqual(out['quality'],'NOT_SCORED')
    def test_late_load_never_semantic_pass(self):
        e=tape(self.p,self.item);early=assistant('r0',[text('Complete audit before source load.')],n=1,out=1);e.insert(1,early);e[-1]['usage']=counts(61,8)
        result=self.parse(e);self.assertEqual(result['temporal'],'PENDING_INDEPENDENT_SUBSTANTIVE_TEXT_REVIEW');self.assertLess(result['texts'][0]['event'],result['loads'][0]['result_event'])
    def test_artifact_cap(self):self.reject(lambda e:e[-2]['message'].update(content=[text('x'*24001)]),'artifact_bound')
    def test_final_tail_cap(self):self.reject(lambda e:e[-1].update(result='x'*24001),'final_artifact')
    def test_thinking_not_visible(self):
        e=tape(self.p,self.item);e[-2]['message']['content'].append({'type':'thinking','thinking':'SECRET_THOUGHT'});self.assertNotIn('SECRET_THOUGHT',self.parse(e)['artifact'])
    def test_transport_error(self):self.reject(lambda e:e[-1].update(is_error=True),'transport')
    def test_readiness_no_tools(self):
        item={'phase':'readiness','arm':'control'};e=tape(self.p,item);e[1]['message']['content'].append({'type':'tool_use','id':'s','name':'Skill','input':{'skill':'task-pipeline:task-pipeline'}});e.insert(-1,{'type':'user','message':{'content':[{'type':'tool_result','tool_use_id':'s','content':'x'}]}})
        with self.assertRaisesRegex(H.Refusal,'readiness_tools'):self.parse(e,item=item)
    def test_failed_readiness_blocks_tasks(self):
        plan=self.f.plan();tapes=[tape(self.p,c) for c in plan];tapes[0][-1]['result']='wrong';a=H.FakeAdapter(tapes);r=H.Runner(self.f,self.temp/'run');v=r.run(a)
        self.assertEqual(a.calls,1);self.assertEqual(v['status'],'STOPPED_TEST_ERROR');self.assertEqual(v['known_synthetic_cost'],0.01);self.assertFalse(v['cost_unknown'])
    def test_start_before_adapter_and_interrupt(self):
        r=H.Runner(self.f,self.temp/'run');original=H.FakeAdapter.stream
        def spy(adapter,payload):
            state=json.loads(r.journal.path.read_bytes());self.assertEqual(state['cells'][-1]['state'],'STARTED');self.assertTrue(state['cost_unknown']);yield from original(adapter,payload)
        a=H.FakeAdapter([[tape(self.p,self.f.plan()[0])[0],'INTERRUPT']])
        with patch.object(H.FakeAdapter,'stream',spy):v=r.run(a)
        self.assertTrue(v['cost_unknown']);self.assertEqual(a.calls,1);self.assertTrue(next(r.private.rglob('raw.jsonl')).read_bytes())
    def test_reserve_whole_pair(self):
        plan=self.f.plan();a=H.FakeAdapter([tape(self.p,c) for c in plan]);r=H.Runner(self.f,self.temp/'run',budget=2.7);v=r.run(a)
        self.assertEqual(a.calls,2);self.assertEqual(v['status'],'STOPPED_BUDGET')
    def test_cost_overshoot_stops(self):
        plan=self.f.plan();t=[tape(self.p,c) for c in plan];t[0][-1]['total_cost_usd']=0.21;a=H.FakeAdapter(t);v=H.Runner(self.f,self.temp/'run').run(a)
        self.assertEqual(v['status'],'STOPPED_BUDGET_OVERSHOOT');self.assertEqual(a.calls,1)
    def test_live_adapter_refused(self):
        with self.assertRaisesRegex(H.Refusal,'live_adapter_disabled'):H.Runner(self.f,self.temp/'run').run(object())
    def test_mutable_manifest_replacement(self):
        p=self.packet/'cases.json';p.write_text('{}');m=self.packet/'frozen-manifest.json';d=json.loads(m.read_text());d['files']['cases.json']={'bytes':2,'sha256':H.digest(b'{}')};m.write_text(json.dumps(d))
        with self.assertRaisesRegex(H.Refusal,'proposal_drift'):self.f.check()
    def test_bundle_change(self):
        self.mutable_bundle()
        p=self.bundle/'control/skills/task-pipeline/SKILL.md';p.write_text('changed')
        with self.assertRaisesRegex(H.Refusal,'bundle_drift'):self.f.check()
    def test_bundle_extra(self):
        self.mutable_bundle()
        (self.bundle/'extra').write_text('x')
        with self.assertRaisesRegex(H.Refusal,'bundle_drift'):self.f.check()
    def test_bundle_symlink(self):
        self.mutable_bundle()
        (self.bundle/'link').symlink_to(self.bundle/'control')
        with self.assertRaisesRegex(H.Refusal,'source_symlink'):self.f.check()
    def test_dependency_mutation(self):
        p=self.temp/'dependency';p.write_text('before');f=H.Frozen(self.packet,self.bundle,[p]);p.write_text('after')
        with self.assertRaisesRegex(H.Refusal,'dependency_drift'):f.check()
    def test_materialization_neutral_and_payload(self):
        self.assertEqual(H.snapshot(self.ctx['root']),self.ctx['manifest']);self.assertEqual(set(self.ctx['settings']['skillOverrides']),{'doctor','design','plugin-authoring'});self.assertEqual(self.ctx['mcp'],{'mcpServers':{}})
        self.assertNotIn('required',self.ctx['prompt']);self.assertNotIn(self.item['case']['id'],str(self.ctx['root']))
    def test_workspace_mutation_stops(self):
        original=H.FakeAdapter.stream
        def change(adapter,payload):
            (Path(payload['project'])/'extra').write_text('foreign')
            yield from original(adapter,payload)
        r=H.Runner(self.f,self.temp/'run');a=H.FakeAdapter([tape(self.p,c) for c in self.f.plan()])
        with patch.object(H.FakeAdapter,'stream',change):v=r.run(a)
        self.assertEqual(v['status'],'STOPPED_TEST_ERROR');self.assertTrue(v['cost_unknown']);self.assertEqual(a.calls,1)
    def test_mask_preserves_project_and_other_version(self):
        raw=f"{self.ctx['plugin']}/skills/task-pipeline/SKILL.md task-pipeline@1.94.0 docs/brief.md business schema1.94.0"
        out=H.mask(raw,self.ctx,'1.94.0');self.assertIn('docs/brief.md business schema1.94.0',out['text']);self.assertNotIn(str(self.ctx['plugin']),out['text']);self.assertEqual(len(out['map']),2)
    def test_extra_empty_source_directory(self):
        self.mutable_bundle();(self.bundle/'empty-label').mkdir()
        with self.assertRaisesRegex(H.Refusal,'unexpected_directory'):self.f.check()
    def test_unsafe_paths(self):
        for path in ('../foreign','/absolute','a/../b','a\\b'):
            with self.subTest(path=path),self.assertRaises(H.Refusal):H.relative(path)
    def test_raw_size_cap(self):
        self.reject(lambda e:e[-1].update(unknown='x'*(H.MAX_RAW+1)),'raw_bound')
    def test_glob_escape(self):
        def change(e):e[3]['message']['content'][0].update(name='Glob',input={'path':'.','pattern':'../*'})
        self.reject(change,'glob_escape')
    def test_duplicate_tool_result(self):self.reject(lambda e:e.insert(3,copy.deepcopy(e[2])),'tool_result_order')
    def test_extra_system(self):self.reject(lambda e:e.insert(1,{'type':'system','subtype':'unexpected'}),'extra_system_event')
    def test_journal_foreign_replacement(self):
        r=H.Runner(self.f,self.temp/'run');r.journal.path.write_text('FOREIGN')
        with self.assertRaisesRegex(H.Refusal,'receipt_changed'):r.journal.save(r.state)
        self.assertEqual(r.journal.path.read_text(),'FOREIGN')
    def test_wall_stop_preserves_started(self):
        r=H.Runner(self.f,self.temp/'run');a=H.FakeAdapter([tape(self.p,c) for c in self.f.plan()])
        with patch.object(H.time,'monotonic',side_effect=[0,241]):v=r.run(a)
        self.assertEqual(v['status'],'STOPPED_TEST_ERROR');self.assertEqual(v['cells'][0]['error_class'],'wall_bound');self.assertTrue(v['cost_unknown'])
    def test_coordinated_change_after_started(self):
        original=H.FakeAdapter.stream;r=H.Runner(self.f,self.temp/'run');a=H.FakeAdapter([tape(self.p,c) for c in self.f.plan()]);bindings=copy.deepcopy(r.state['initial_bindings'])
        def change(adapter,payload):
            file=self.packet/'cases.json';file.write_text('{}');manifest=self.packet/'frozen-manifest.json';d=json.loads(manifest.read_text());d['files']['cases.json']={'bytes':2,'sha256':H.digest(b'{}')};manifest.write_text(json.dumps(d))
            yield from original(adapter,payload)
        with patch.object(H.FakeAdapter,'stream',change):v=r.run(a)
        self.assertEqual(v['status'],'STOPPED_TEST_ERROR');self.assertEqual(v['initial_bindings'],bindings);self.assertEqual(a.calls,1)
    def test_no_success_from_read_only_trace(self):
        e=tape(self.p,self.item);e[1]['message']['content'][0].update(name='Read',input={'file_path':'{{PLUGIN}}/skills/task-pipeline/SKILL.md'})
        out=self.parse(e);self.assertFalse(out['required_skill_in_fake_trace']);self.assertEqual(out['quality'],'NOT_SCORED')
    def test_coordinated_initial_replacement_refuses(self):
        file=self.packet/'cases.json';file.write_text('{}');manifest=self.packet/'frozen-manifest.json';data=json.loads(manifest.read_text());data['files']['cases.json']={'bytes':2,'sha256':H.digest(b'{}')};manifest.write_text(json.dumps(data))
        with self.assertRaisesRegex(H.Refusal,'proposal_identity'):H.Frozen(self.packet,self.bundle)
    def test_readiness_pair_reservation(self):
        r=H.Runner(self.f,self.temp/'run',budget=0.3);a=H.FakeAdapter([]);v=r.run(a)
        self.assertEqual(a.calls,0);self.assertEqual(v['status'],'STOPPED_BUDGET');self.assertEqual(v['not_started_indices'],list(range(18)))
    def test_interruption_retains_unstarted(self):
        r=H.Runner(self.f,self.temp/'run');v=r.run(H.FakeAdapter([['INTERRUPT']]))
        self.assertEqual(v['not_started_indices'],list(range(1,18)));self.assertEqual(len(v['planned_cells']),18)
    def test_huge_integer_is_invalid_not_exception(self):
        self.assertFalse(H.number(10**400));self.reject(lambda e:e[-1].update(total_cost_usd=10**400),'cost_unknown')
    def test_huge_cost_retains_unknown_journal(self):
        plan=self.f.plan();t=tape(self.p,plan[0]);t[-1]['total_cost_usd']=10**400;r=H.Runner(self.f,self.temp/'run');v=r.run(H.FakeAdapter([t]))
        self.assertEqual(v['status'],'STOPPED_TEST_ERROR');self.assertTrue(v['cost_unknown']);self.assertEqual(v['known_synthetic_cost'],0)
    def test_contained_parent_read_is_valid(self):
        e=tape(self.p,self.item);e[3]['message']['content'][0]['input']['file_path']='../plugin/skills/task-pipeline/SKILL.md'
        self.assertEqual(self.parse(e)['status'],'SYNTHETIC_TRACE_VALID')
    def test_no_process_network_imports(self):
        tree=ast.parse((H.HERE/'harness.py').read_text());imports=[]
        for n in ast.walk(tree):
            if isinstance(n,ast.Import):imports.extend(a.name for a in n.names)
            elif isinstance(n,ast.ImportFrom):imports.append(n.module)
        self.assertFalse(set(imports)&{'subprocess','socket','urllib','requests','http','ctypes'})

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--bundle',type=Path,required=True);p.add_argument('--result',type=Path);args=p.parse_args();BUNDLE=args.bundle.resolve()
    suite=unittest.defaultTestLoader.loadTestsFromTestCase(Controls);result=unittest.TextTestRunner(verbosity=2).run(suite)
    receipt={'status':'OFFLINE_PASS' if result.wasSuccessful() else 'OFFLINE_FAIL','tests':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'provider_calls':0,'subprocess_calls':0,'native_quality':'NOT_OBSERVED','source_hashes':{p.name:H.digest(p.read_bytes()) for p in [H.HERE/'harness.py',H.HERE/'check.py',H.HERE/'README.md']}}
    if args.result:args.result.write_bytes(H.encoded(receipt))
    print(json.dumps(receipt));raise SystemExit(not result.wasSuccessful())
