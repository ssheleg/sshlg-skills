#!/usr/bin/env python3
"""Compare pinned Git blobs with installed family files; never mutate a host."""
import argparse,json,subprocess,hashlib,os
from pathlib import Path, PurePosixPath
p=argparse.ArgumentParser();p.add_argument('--private',required=True,type=Path);p.add_argument('--output',required=True,type=Path);a=p.parse_args();root=Path(__file__).resolve().parents[4]
def git(repo,*args):return subprocess.check_output(['git',*args],cwd=repo)
def require(ok,message):
 if not ok:raise RuntimeError(message)
manifest=json.loads(git(root,'show','HEAD:skills.json'));home=Path.home();codex_home=Path(os.environ.get('CODEX_HOME',str(home/'.codex')));hermes_home=Path(os.environ.get('HERMES_HOME',str(home/'.hermes')));members={m['name'] for m in manifest['skills']}
claude=json.loads((a.private/'claude-plugins-after.json').read_text());codex=json.loads((a.private/'codex-plugins-after.json').read_text())['installed'];before=json.loads((a.private/'codex-plugins-before.json').read_text())['installed']
cc={x['id'].split('@')[0]:x for x in claude};cx={x['name']:x for x in codex};expected_native={x['name'] for x in before if x['name'] in members}
require({n for n in cx if n in members}==expected_native,'Codex family plugin identity set differs from before; no silent missing registration')
rows=[];sources=[]
def compare(owner,channel,target_dir,files,source_sha):
 require(bool(files),'empty payload comparison: '+owner);missing=[];different=[];hashed=[]
 for rel,src in files.items():
  dst=target_dir/rel
  if not dst.is_file():missing.append(rel);continue
  raw=dst.read_bytes()
  if raw!=src:different.append(rel)
  hashed.append({'path':rel,'sha256':hashlib.sha256(raw).hexdigest()})
 rows.append({'owner':owner,'channel':channel,'source':source_sha,'files':len(files),'equal':not missing and not different,'missing':missing,'different':different,'manifest_sha256':hashlib.sha256(json.dumps(hashed,sort_keys=True).encode()).hexdigest()})
for m in manifest['skills']:
 repo=root/m['dir'];sha=git(root,'rev-parse','HEAD:'+m['dir']).decode().strip();tracked=git(repo,'ls-tree','-r','--name-only',sha).decode().splitlines();ids=m.get('skillNames',[m['name']]);skilldirs={PurePosixPath(f).parent.name:str(PurePosixPath(f).parent) for f in tracked if f.startswith('plugins/') and f.endswith('/SKILL.md') and PurePosixPath(f).parent.name in ids}
 require(set(skilldirs)==set(ids),'Incomplete source skill set: '+m['name']);cache={}
 def payload(prefix):
  result={}
  for f in tracked:
   if f.startswith(prefix+'/'):
    if f not in cache:cache[f]=git(repo,'show',sha+':'+f)
    result[f[len(prefix)+1:]]=cache[f]
  return result
 for name,d in skilldirs.items():
  files=payload(d)
  for ch,target in [('shared',home/'.agents/skills'/name),('hermes',hermes_home/'skills'/name)]:compare(name,ch,target,files,sha)
 manifests=[f for f in tracked if f.startswith('plugins/') and f.endswith('/.claude-plugin/plugin.json')];require(len(manifests)==1,'Expected one plugin manifest: '+m['name']);plugin=str(PurePosixPath(manifests[0]).parent.parent)
 plugin_meta=json.loads(git(repo,'show',sha+':'+manifests[0]));require(plugin_meta['version']==m['version'],'Pin/version mismatch: '+m['name']);files=payload(plugin)
 c=cc.get(m['name']);require(c and c['enabled'] and c['version']==m['version'],'Claude registration mismatch: '+m['name']);compare(m['name'],'claude-plugin',Path(c['installPath']),files,sha)
 if m['name'] in expected_native:
  c=cx[m['name']];require(c['enabled'] and c['version']==m['version'],'Codex registration mismatch: '+m['name']);target=codex_home/'plugins/cache'/c['marketplaceName']/c['name']/c['version'];compare(m['name'],'codex-plugin',target,files,sha)
 sources.append({'owner':m['name'],'version':m['version'],'source':sha})
receipt={'as_of':'2026-10-10','hub_source':git(root,'rev-parse','HEAD').decode().strip(),'sources':sources,'expected_members':len(members),'expected_skills':sum(len(m.get('skillNames',[m['name']])) for m in manifest['skills']),'native_codex_members':sorted(expected_native),'shared_only_codex_members':sorted(members-expected_native),'comparisons':len(rows),'all_equal':bool(rows) and all(x['equal'] for x in rows),'rows':rows,'runtime_acceptance':'NOT_RUN; pinned blob equality and enabled plugin registration only'}
a.output.write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({k:v for k,v in receipt.items() if k not in ['rows','sources']}));raise SystemExit(0 if receipt['all_equal'] else 1)
