"""Dry-only FW07 harness. No subprocess, network or model transport exists."""
import copy
import hashlib
import json
import math
import os
from pathlib import Path
import random
import stat
import tempfile
import time
from decimal import Decimal

HERE = Path(__file__).resolve().parent
PROPOSAL = HERE.parent / 'fw07-behavioral-holdout-v1'
KEYS = ('input_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens', 'output_tokens')
MAX_RAW = 8 * 1024 * 1024
PROPOSAL_MANIFEST_SHA256 = '5727483d7d05dc7075f0b6308e75b6de27250f99a076d0943c086af3d719aac7'

class Refusal(ValueError):
    pass

def need(condition, code):
    if not condition:
        raise Refusal(code)

def encoded(value):
    try:return (json.dumps(value, ensure_ascii=False, sort_keys=True, allow_nan=False) + '\n').encode()
    except (ValueError,TypeError) as exc:raise Refusal('invalid_json_value') from exc

def digest(value):
    return hashlib.sha256(value).hexdigest()

def relative(value):
    need(isinstance(value, str) and value and '\\' not in value, 'unsafe_path')
    p = Path(value)
    need(not p.is_absolute() and '..' not in p.parts and str(p) == value, 'unsafe_path')
    return p

def regular(file):
    s = file.lstat()
    need(stat.S_ISREG(s.st_mode) and not file.is_symlink(), 'source_kind')
    return s

def snapshot(root, allow_empty=()):
    root = Path(root)
    need(root.is_dir() and not root.is_symlink() and root.resolve() == root.absolute(), 'root_alias')
    out = {}; directories = set()
    def walk(folder):
        for p in sorted(folder.iterdir()):
            s = p.lstat()
            need(not p.is_symlink(), 'source_symlink')
            if stat.S_ISDIR(s.st_mode):
                directories.add(str(p.relative_to(root))); walk(p)
            else:
                regular(p)
                b = p.read_bytes()
                out[str(p.relative_to(root))] = {'bytes':len(b), 'sha256':digest(b)}
    walk(root)
    expected_dirs = {str(parent) for name in out for parent in Path(name).parents if str(parent)!='.'}
    need(directories == expected_dirs | (set(allow_empty) & directories), 'unexpected_directory')
    return out

def private_write(path, data, exclusive=True):
    flags = os.O_WRONLY | os.O_CREAT | (os.O_EXCL if exclusive else os.O_TRUNC)
    fd = os.open(path, flags, 0o600)
    try:
        with os.fdopen(fd, 'wb', closefd=False) as out:
            out.write(data); out.flush(); os.fsync(fd)
    finally:
        os.close(fd)

class Journal:
    def __init__(self, path):
        self.path = path
        self.previous = None
    def save(self, value):
        if self.previous is None:
            need(not self.path.exists() and not self.path.is_symlink(), 'receipt_exists')
        else:
            regular(self.path)
            need(self.path.read_bytes() == self.previous, 'receipt_changed')
        data = encoded(value)
        temp = self.path.with_name('.' + os.urandom(12).hex())
        private_write(temp, data)
        try:
            os.replace(temp, self.path)
        finally:
            if temp.exists(): temp.unlink()
        self.previous = data

class Frozen:
    """Capture original bytes once; subsequent checks never trust replacement metadata."""
    def __init__(self, proposal, bundle, dependencies=None):
        self.proposal, self.bundle = Path(proposal).resolve(), Path(bundle).resolve()
        need(not Path(proposal).is_symlink() and not Path(bundle).is_symlink(), 'root_alias')
        self.packet = snapshot(self.proposal)
        original_manifest = (self.proposal / 'frozen-manifest.json').read_bytes()
        need(digest(original_manifest)==PROPOSAL_MANIFEST_SHA256, 'proposal_identity')
        manifest = json.loads(original_manifest)['files']
        need(self.packet == {**manifest, 'frozen-manifest.json':self.packet.get('frozen-manifest.json')}, 'proposal_manifest')
        self.protocol = json.loads((self.proposal / 'protocol.json').read_bytes())
        self.cases = json.loads((self.proposal / 'cases.json').read_bytes())['cases']
        self.sources = json.loads((self.proposal / 'source.json').read_bytes())
        need(self.protocol['authorized_provider_calls'] == 0, 'live_not_authorized')
        self.bundles = snapshot(self.bundle)
        expected = {arm+'/'+k:v for arm in ('control','candidate') for k,v in self.sources[arm+'_files'].items()}
        need(self.bundles == expected, 'bundle_manifest')
        deps = dependencies or [HERE / 'harness.py', HERE / 'check.py', HERE / 'README.md']
        self.dependencies = {}
        for p in deps:
            p=Path(p).absolute(); regular(p); self.dependencies[p]=p.read_bytes()
        self.initial_hashes = {'proposal':digest(encoded(self.packet)), 'bundles':digest(encoded(self.bundles)), 'dependencies':{str(p.name):digest(b) for p,b in self.dependencies.items()}}
    def check(self):
        need(snapshot(self.proposal) == self.packet, 'proposal_drift')
        need(snapshot(self.bundle) == self.bundles, 'bundle_drift')
        for p,b in self.dependencies.items():
            regular(p); need(p.read_bytes() == b, 'dependency_drift')
    def plan(self):
        rng = random.Random(self.protocol['design']['seed'])
        arms = ['control','candidate']; rng.shuffle(arms)
        out = [{'phase':'readiness','arm':a} for a in arms]
        cases = copy.deepcopy(self.cases); rng.shuffle(cases)
        for c in cases:
            arms = ['control','candidate']; rng.shuffle(arms)
            out.extend({'phase':'task','arm':a,'case':c} for a in arms)
        return out
    def materialize(self, parent, item):
        self.check()
        root = Path(tempfile.mkdtemp(prefix='cell-', dir=parent)).resolve()
        project, plugin = root/'project', root/'plugin'
        project.mkdir(mode=0o700); plugin.mkdir(mode=0o700)
        expected = {}
        for name,row in self.sources[item['arm']+'_files'].items():
            relative(name)
            data = (self.bundle / item['arm'] / name).read_bytes()
            need({'bytes':len(data),'sha256':digest(data)} == row, 'copy_source_drift')
            dest = plugin/name; dest.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
            private_write(dest,data);expected['plugin/'+name]=row
        case = item.get('case')
        if case:
            for name in case['files']:
                relative(name)
                source = self.proposal/'fixtures'/case['id']/name
                data = source.read_bytes()
                need({'bytes':len(data),'sha256':digest(data)} == self.packet[str(source.relative_to(self.proposal))], 'fixture_drift')
                dest = project/name;dest.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
                private_write(dest,data);expected['project/'+name]={'bytes':len(data),'sha256':digest(data)}
            if case.get('fault'):
                target = 'skills/task-pipeline/'+case['fault'][item['arm']]
                (plugin/relative(target)).unlink();expected.pop('plugin/'+target)
        need(snapshot(root,allow_empty=('project',)) == expected, 'workspace_population')
        prompt = self.protocol['readiness_prompt'] if not case else self.protocol['task_envelope']+case['prompt']
        need(not case or case['id'] not in prompt, 'payload_label')
        return {'root':root,'project':project,'plugin':plugin,'manifest':expected,'prompt':prompt,
                'settings':copy.deepcopy(self.protocol['host']['settings']), 'tools':list(self.protocol['host']['tools']),
                'mcp':{'mcpServers':{}}, 'session_persistence':False, 'mode':'FAKE_ONLY'}

def number(v, integer=False):
    if not isinstance(v,(int,float)) or isinstance(v,bool):return False
    try:return math.isfinite(v) and v>=0 and (not integer or int(v)==v)
    except (OverflowError,ValueError):return False

def safe_path(ctx, value):
    need(isinstance(value,str) and value, 'tool_path')
    p = Path(value)
    raw = p if p.is_absolute() else ctx['project']/p
    resolved = raw.resolve()
    need(any(resolved.is_relative_to(ctx[k]) for k in ('project','plugin')), 'outside_read')
    # Symlinks, including internal aliases, are outside the declared fixture grammar.
    need(Path(os.path.abspath(raw)) == resolved, 'tool_path_alias')
    return resolved

def inspect(events, ctx, item, protocol):
    """Parse a declared complete stream subset; no tool call here is executed."""
    need(isinstance(events,list) and events and all(isinstance(e,dict) for e in events), 'empty_or_invalid_stream')
    need(len(encoded(events)) <= MAX_RAW, 'raw_bound')
    inits = [e for e in events if e.get('type')=='system' and e.get('subtype')=='init']
    finals = [e for e in events if e.get('type')=='result']
    need(len(inits)==len(finals)==1 and events[0] is inits[0] and events[-1] is finals[0], 'stream_shape')
    init, final = inits[0], finals[0]
    host, limits = protocol['host'], protocol['limits']
    need(init.get('model')==host['model'] and init.get('apiKeySource')=='none', 'auth_model')
    for key,expected in [('skills',host['source_expected_inventory']),('tools',host['tools'])]:
        got=init.get(key);need(isinstance(got,list) and all(isinstance(x,str) for x in got) and len(got)==len(expected) and set(got)==set(expected), 'inventory_'+key)
    need(init.get('mcp_servers')==[], 'mcp')
    need(final.get('subtype')=='success' and final.get('is_error') is False, 'transport')
    need(number(final.get('total_cost_usd')), 'cost_unknown')
    models=final.get('modelUsage');need(isinstance(models,dict) and set(models)=={host['model']}, 'model_usage')
    need(models[host['model']].get('provider')=='firstParty' and models[host['model']].get('costBasis')=='list', 'provider')
    usage=final.get('usage');need(isinstance(usage,dict) and all(number(usage.get(k),True) for k in KEYS), 'usage')
    server=usage.get('server_tool_use',{});need(isinstance(server,dict) and all(number(v,True) and v==0 for v in server.values()), 'network')
    phase=item['phase']; cap=limits['readiness_unique_model_requests'] if phase=='readiness' else limits['task_unique_model_requests']
    turns=limits['readiness_reported_turns'] if phase=='readiness' else limits['task_reported_turns']
    need(number(final.get('num_turns'),True) and 1<=final['num_turns']<=turns, 'turn_bound')
    requests={}; calls={}; results={}; texts=[]; seen_events={}
    for position,event in enumerate(events):
        kind=event.get('type');need(kind in ('system','assistant','user','result'), 'event_type')
        need(kind!='system' or position==0, 'extra_system_event')
        uid=event.get('uuid')
        if uid is not None:
            need(isinstance(uid,str) and uid, 'event_identity')
            if uid in seen_events:
                need(seen_events[uid]==event, 'conflicting_event');continue
            seen_events[uid]=copy.deepcopy(event)
        if kind=='assistant':
            msg=event.get('message',{});rid=msg.get('id');u=msg.get('usage',{})
            need(isinstance(rid,str) and rid, 'request_identity')
            need(all(number(u.get(k),True) for k in KEYS), 'request_usage')
            counts=tuple(u[k] for k in KEYS)
            if rid in requests:
                prior=requests[rid]
                need(prior[:3]==counts[:3] and counts[3]>=prior[3], 'conflicting_usage')
            requests[rid]=counts
            need(sum(counts[:3])<=limits['max_input_tokens_per_unique_request'] and counts[3]<=limits['max_output_tokens_per_unique_request'], 'request_bound')
            content=msg.get('content');need(isinstance(content,list), 'content')
            for block in content:
                bt=block.get('type')
                if bt=='text':
                    need(isinstance(block.get('text'),str), 'text');texts.append({'event':position,'request_id':rid,'text':block['text']})
                elif bt=='tool_use':
                    tid=block.get('id');need(isinstance(tid,str) and tid and tid not in calls, 'tool_identity')
                    need(block.get('name') in host['tools'] and isinstance(block.get('input'),dict), 'tool_forbidden')
                    calls[tid]={'event':position,**copy.deepcopy(block)}
                else: need(bt in ('thinking','redacted_thinking'), 'content_type')
        elif kind=='user':
            blocks=event.get('message',{}).get('content');need(isinstance(blocks,list), 'result_content')
            for block in blocks:
                need(block.get('type')=='tool_result', 'user_content')
                tid=block.get('tool_use_id');need(tid in calls and tid not in results and position>calls[tid]['event'], 'tool_result_order')
                results[tid]={'event':position,**copy.deepcopy(block)}
    need(0<len(requests)<=cap, 'request_count')
    totals=tuple(sum(v[i] for v in requests.values()) for i in range(4))
    need(tuple(usage[k] for k in KEYS)==totals, 'usage_reconciliation')
    need(totals[3]<=limits['max_cell_output_tokens'], 'output_bound')
    need(set(calls)==set(results), 'tool_unmatched')
    if phase=='readiness': need(not calls, 'readiness_tools')
    loads=[];reads=[];missing=[]
    fault=item.get('case',{}).get('fault')
    expected_missing=ctx['plugin']/'skills/task-pipeline'/fault[item['arm']] if fault else None
    for tid,call in calls.items():
        args=call['input'];name=call['name'];result=results[tid];error=result.get('is_error',False)
        need(isinstance(error,bool), 'tool_error_shape')
        if name=='Skill':
            need(args.get('skill') in host['source_expected_inventory'] and not error, 'skill_error')
            loads.append({'skill':args['skill'],'call_event':call['event'],'result_event':result['event']})
        else:
            value=args.get('file_path') if name=='Read' else args.get('path','.')
            target=safe_path(ctx,value)
            if name=='Glob':
                pattern=args.get('pattern','');need(isinstance(pattern,str) and not Path(pattern).is_absolute() and '..' not in Path(pattern).parts, 'glob_escape')
            if error:
                need(name=='Read' and expected_missing==target and not target.exists(), 'tool_error')
                missing.append({'file':str(target),'result_event':result['event']})
            else:
                need(target.exists(), 'missing_tool_target')
                if name=='Read':regular(target);reads.append({'file':str(target),'call_event':call['event'],'result_event':result['event']})
    artifact='\n\n'.join(t['text'] for t in texts)
    need(artifact.strip() and len(artifact.encode())<=limits['artifact_max_bytes'], 'artifact_bound')
    need(isinstance(final.get('result'),str) and final['result'].strip() and len(final['result'].encode())<=limits['artifact_max_bytes'], 'final_artifact')
    if phase=='readiness':need(artifact.strip()=='READY' and final['result'].strip()=='READY', 'readiness_artifact')
    return {'status':'SYNTHETIC_TRACE_VALID','cost':final['total_cost_usd'],'usage':dict(zip(KEYS,totals)),
            'request_count':len(requests),'reported_turns':final['num_turns'],'texts':texts,'artifact':artifact,
            'artifact_sha256':digest(artifact.encode()),'final_result_sha256':digest(final['result'].encode()),
            'loads':loads,'reads':reads,'expected_missing':missing,'quality':'NOT_SCORED',
            'required_skill_in_fake_trace':any(x['skill']=='task-pipeline:task-pipeline' for x in loads),
            'temporal':'PENDING_INDEPENDENT_SUBSTANTIVE_TEXT_REVIEW','native_behavior':'NOT_OBSERVED_FAKE_ONLY'}

def mask(artifact, ctx, version):
    replacements=[(str(ctx['plugin']),'<instruction-source>')]
    if version:replacements.extend([(f'task-pipeline@{version}','task-pipeline@<plugin-version>'),(f'task-pipeline v{version}','task-pipeline v<plugin-version>')])
    text=artifact;mapping=[]
    for source,replacement in replacements:
        offsets=[];start=0
        while (at:=text.find(source,start))>=0:offsets.append(at);start=at+len(source)
        if offsets:mapping.append({'source':source,'replacement':replacement,'offsets_before_this_pass':offsets});text=text.replace(source,replacement)
    return {'text':text,'map':mapping,'original_sha256':digest(artifact.encode()),'masked_sha256':digest(text.encode())}

class FakeAdapter:
    """Plain event tapes only. This adapter never evaluates commands or tools."""
    def __init__(self, tapes):
        self.tapes=copy.deepcopy(tapes);self.calls=0
    def stream(self, payload):
        need(set(payload)=={'prompt','project','plugin','settings','tools','mcp','mode','session_persistence'}, 'adapter_payload')
        need(payload['mode']=='FAKE_ONLY', 'live_disabled')
        tape=self.tapes[self.calls];self.calls+=1
        for event in tape:
            if event=='INTERRUPT':raise KeyboardInterrupt()
            if event=='ERROR':raise Refusal('fake_transport')
            def expand(value):
                if isinstance(value,str):return value.replace('{{PROJECT}}',payload['project']).replace('{{PLUGIN}}',payload['plugin'])
                if isinstance(value,list):return [expand(v) for v in value]
                if isinstance(value,dict):return {k:expand(v) for k,v in value.items()}
                return value
            yield expand(copy.deepcopy(event))

class Runner:
    def __init__(self, frozen, output, *, budget=None):
        self.f=frozen;self.f.check();self.root=Path(output).absolute()
        need(not self.root.exists() and not self.root.is_symlink(), 'output_exists')
        need(self.root.parent.resolve()==self.root.parent, 'output_parent_alias')
        self.root.mkdir(mode=0o700)
        self.private=self.root/'private';self.private.mkdir(mode=0o700)
        self.visible=self.root/'workspaces';self.visible.mkdir(mode=0o700)
        self.journal=Journal(self.private/'receipt.json')
        ceiling=Decimal(str(frozen.protocol['budget_proposal']['reported_list_ceiling']))
        self.budget=ceiling if budget is None else Decimal(str(budget))
        need(self.budget.is_finite() and 0<=self.budget<=ceiling, 'budget')
        self.state={'status':'DRY_ONLY_READY','provider_calls':0,'native_behavior':'NOT_OBSERVED', 'known_synthetic_cost':0,'cost_unknown':False,'cells':[], 'planned_cells':[{'index':i,'phase':c['phase'],'arm':c['arm'],'case_id':c.get('case',{}).get('id')} for i,c in enumerate(frozen.plan())], 'not_started_indices':list(range(len(frozen.plan()))), 'initial_bindings':copy.deepcopy(frozen.initial_hashes)}
        self.journal.save(self.state)
    def run(self, adapter):
        need(type(adapter) is FakeAdapter, 'live_adapter_disabled')
        need(not self.state['cells'] and self.state['status']=='DRY_ONLY_READY', 'resume_disabled')
        spent=Decimal(0);p=self.f.protocol;plan=self.f.plan();self.state['status']='DRY_ONLY_RUNNING'
        for index,item in enumerate(plan):
            reserve=Decimal(str(p['budget_proposal']['readiness_reserve'] if item['phase']=='readiness' else p['budget_proposal']['task_cell_reserve']))
            needed=reserve*(2 if index%2==0 else 1)
            if spent+needed>self.budget:self.state['status']='STOPPED_BUDGET';break
            rec={'index':index,'phase':item['phase'],'arm':item['arm'],'state':'PREPARED','case_id':item.get('case',{}).get('id')}
            folder=self.private/os.urandom(12).hex();folder.mkdir(mode=0o700)
            events=[];ctx=None;start=time.monotonic()
            try:
                self.f.check();ctx=self.f.materialize(self.visible,item)
                payload={k:(str(ctx[k]) if isinstance(ctx[k],Path) else ctx[k]) for k in ('prompt','project','plugin','settings','tools','mcp','mode','session_persistence')}
                private_write(folder/'payload.json',encoded(payload))
                rec.update(state='STARTED',started_monotonic=start,prompt_sha256=digest(ctx['prompt'].encode()),workspace_sha256=digest(encoded(ctx['manifest'])))
                self.state['cost_unknown']=True;self.state['cells'].append(rec);self.state['not_started_indices'].remove(index);self.journal.save(self.state)
                with os.fdopen(os.open(folder/'raw.jsonl',os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'wb') as raw:
                    size=0
                    for event in adapter.stream(payload):
                        data=encoded(event);size+=len(data)
                        need(size<=MAX_RAW, 'raw_bound')
                        raw.write(data);raw.flush();os.fsync(raw.fileno());events.append(event)
                        self.f.check();need(snapshot(ctx['root'],allow_empty=('project',))==ctx['manifest'], 'workspace_drift')
                        need(time.monotonic()-start<=p['limits']['cell_wall_seconds'], 'wall_bound')
                self.f.check();need(snapshot(ctx['root'],allow_empty=('project',))==ctx['manifest'], 'workspace_drift')
                result=inspect(events,ctx,item,p)
                cost=Decimal(str(result['cost']));spent+=cost
                private_write(folder/'artifact.json',encoded(result))
                version=json.loads((ctx['plugin']/'.claude-plugin/plugin.json').read_bytes()).get('version')
                private_write(folder/'masked.json',encoded(mask(result['artifact'],ctx,version)))
                rec.update(state='FINISHED',synthetic_cost=float(cost),trace_status=result['status'],artifact_sha256=result['artifact_sha256'])
                self.state['known_synthetic_cost']=float(spent);self.state['cost_unknown']=False
                if spent>self.budget or cost>reserve:self.state['status']='STOPPED_BUDGET_OVERSHOOT';break
            except BaseException as exc:
                if isinstance(exc,(SystemExit,KeyboardInterrupt)) or isinstance(exc,Exception):
                    rec.update(state='UNKNOWN_EFFECT' if rec.get('started_monotonic') is not None else 'NOT_STARTED',error_class=str(exc) if isinstance(exc,Refusal) else type(exc).__name__)
                    if rec not in self.state['cells']:self.state['cells'].append(rec)
                    finals=[e for e in events if isinstance(e,dict) and e.get('type')=='result']
                    known=len(finals)==1 and number(finals[0].get('total_cost_usd'))
                    if known and 'synthetic_cost' not in rec:
                        cost=Decimal(str(finals[0]['total_cost_usd']));spent+=cost;rec['synthetic_cost']=float(cost);self.state['known_synthetic_cost']=float(spent)
                    self.state.update(status='STOPPED_TEST_ERROR',cost_unknown=rec.get('started_monotonic') is not None and not known)
                    break
                raise
            finally:
                self.journal.save(self.state)
        else:self.state['status']='DRY_ONLY_COMPLETED'
        if self.state['status']=='DRY_ONLY_COMPLETED':self.f.check()
        self.journal.save(self.state)
        return copy.deepcopy(self.state)

if __name__=='__main__':
    import sys
    need(len(sys.argv)==1, 'live_execution_unavailable')
    print(json.dumps({'status':'DRY_ONLY_LIBRARY','provider_calls':0,'live_adapter':'ABSENT','check':'Use check.py with a hash-verified prepared source bundle.'}))
