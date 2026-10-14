import json,gzip,hashlib,subprocess,re,sys
from pathlib import Path
repo=Path(sys.argv[1])
out=Path(sys.argv[2])
r=repo/'docs/reports/2026-10-13-code-graph-finalization/raw'
rows=[]
for name in ['baseline-9f0c0dc','final-86477b5']:
 p=r/name;m=json.loads((p/'manifest.json').read_bytes());d=json.loads((p/'diagnostics.json').read_bytes())
 raw={k:gzip.decompress((p/(k+'.json.gz')).read_bytes()) for k in ['graph','extraction']};g=json.loads(raw['graph']);e=json.loads(raw['extraction']);commit=m['built_at_commit']
 def git(*args):return subprocess.check_output(['git',*args],cwd=repo)
 admitted={}
 for rec in git('ls-tree','-rz',commit).split(b'\0'):
  if not rec:continue
  meta,path=rec.decode().split('\t');mode,kind,oid=meta.split()
  if kind=='blob' and mode in ('100644','100755') and Path(path).suffix in ('.py','.js','.mjs','.cjs','.ts','.tsx','.sh') and not path.startswith(('docs/','skills/')):admitted[path]=oid
 assert set(admitted)=={f['path'] for f in m['source_files']}
 lines={}
 for f in m['source_files']:
  b=git('cat-file','blob',admitted[f['path']]);assert admitted[f['path']]==f['git_blob'];assert len(b)==f['bytes'];assert hashlib.sha256(b).hexdigest()==f['sha256'];lines[f['path']]=len(b.splitlines())
 for key in raw:assert hashlib.sha256(raw[key]).hexdigest()==m[key+'_json_sha256']
 assert len(g['nodes'])==len(e['nodes'])==m['nodes'];assert len(g['links'])==m['edges'];assert g['built_at_commit']==commit
 assert len({n['community'] for n in g['nodes']})==m['communities']
 for n in e['nodes']:
  assert n['source_file'] in admitted
  loc=re.fullmatch(r'L(\d+)(?:-L?(\d+))?',n['source_location']);assert loc,(n['source_location']);assert 1<=int(loc[1])<=lines[n['source_file']];assert not loc[2] or int(loc[1])<=int(loc[2])<=lines[n['source_file']]
 ids={n['id'] for n in e['nodes']};valid=[x for x in e['edges'] if x['source'] in ids and x['target'] in ids];pairs={(x['source'],x['target']) for x in valid};exportpairs={(x['source'],x['target']) for x in g['links']}
 measured={'files':len(admitted),'nodes':len(g['nodes']),'edges':len(g['links']),'communities':len({n['community'] for n in g['nodes']}),'raw_edges':len(e['edges']),'dangling_edges':len(e['edges'])-len(valid),'valid_candidate_edges':len(valid),'unique_endpoint_pairs':len(pairs),'collapsed_relations':len(valid)-len(pairs),'export_added_pairs':len(exportpairs-pairs),'raw_pairs_missing_export':len(pairs-exportpairs)}
 assert measured['dangling_edges']==d['dangling_endpoint_edges'];assert measured['collapsed_relations']==d['directed_same_endpoint_collapsed_edges'];assert measured['raw_edges']==d['raw_edge_count']
 assert e['failed_sources']==[];assert e['input_tokens']==0 and e['output_tokens']==0;assert m['provider_calls']==m['provider_tokens']==0
 assert all(x['source'] in ids and x['target'] in ids for x in g['links'])
 assert not any(b'/private/var/' in raw[k] or b'/Users/' in raw[k] for k in raw)
 rows.append({'snapshot':name,'source_commit':commit,'checks':'PASS','counts':measured,'receipt_hashes':{f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in p.iterdir() if f.is_file()},'decompressed_hashes':{k:hashlib.sha256(v).hexdigest() for k,v in raw.items()}})
result={'schema':'graph-peer/1','reviewer':'fresh_research','status':'PASS_BOUNDED','snapshots':rows,'delta':{k:rows[1]['counts'][k]-rows[0]['counts'][k] for k in rows[0]['counts']},'verification':'Read immutable Git blobs for every manifest entry and independently derived corpus, byte hashes, sizes, node source/line bounds, graph/extraction hashes, endpoint diagnostics and exported community counts. Read build.py code-only extraction path. No extractor rerun or provider call.','limits':['Provider-free mode and zero token counters agree with reviewed builder; not independent network telemetry.','Static graph is not runtime reachability or task quality.','Dangling raw edges and endpoint relation collapse remain explicit; export adds16 builder-added endpoint pairs in each snapshot.','Member Git repositories, docs, Python dynamic imports, runtime dispatch and semantic contracts are outside this corpus or incompletely represented.','Community count growth is a structural observation, not evidence of improved modularity.']}
out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result['delta']));print(out)
