import hashlib,json,re,subprocess
from pathlib import Path
repo=Path(__file__).resolve().parents[3]
home=Path.home()
plugins=json.loads((home/'.claude/plugins/installed_plugins.json').read_text())['plugins']
def git(cwd,*args):return subprocess.check_output(['git','-C',str(cwd),*args])
def digest(rows):return hashlib.sha256(json.dumps(rows,separators=(',',':')).encode()).hexdigest()
rows=[]
for member in json.loads((repo/'skills.json').read_text())['skills']:
 sub=repo/member['dir']; sha=git(repo,'rev-parse','HEAD:'+member['dir']).decode().strip()
 assert git(sub,'rev-parse','HEAD').decode().strip()==sha, member['name']
 tracked=git(sub,'ls-files').decode().splitlines()
 inst=plugins[member['pluginInstall']]
 assert len(inst)==1,(member['name'],len(inst))
 plugin=Path(inst[0]['installPath'])
 assert inst[0]['version']==member['version'],member['name']
 for name in member['skillNames']:
  roots=[p[:-len('/SKILL.md')] for p in tracked if p.endswith('/skills/'+name+'/SKILL.md') or p=='skills/'+name+'/SKILL.md']
  roots=[p for p in roots if p.startswith('plugins/')] or [p for p in roots if p.startswith('skills/')]
  assert len(roots)==1,(name,roots)
  root=roots[0]
  files=sorted(p for p in tracked if p.startswith(root+'/'))
  for channel,installed in [('skills_cli',home/'.agents/skills'/name),('claude_plugin',plugin/'skills'/name)]:
   expected=[];actual=[];bad=[]
   for f in files:
    rel=f[len(root)+1:];expected.append([rel,hashlib.sha256(git(sub,'show',sha+':'+f)).hexdigest()])
    p=installed/rel;v=hashlib.sha256(p.read_bytes()).hexdigest() if p.is_file() else None;actual.append([rel,v])
    if v!=expected[-1][1]:bad.append(rel)
   rows.append(dict(member=member['name'],version=member['version'],commit=sha,skill=name,channel=channel,files=len(files),expected_digest=digest(expected),installed_digest=digest(actual),mismatches=bad,status='MATCH' if not bad else 'MISMATCH'))
before=json.loads(Path(__file__).with_name('operator-before.json').read_text());preserve=[]
for rel,v in before.items():
 raw=(home/rel).read_bytes();s=raw.decode();outside=re.sub(r'<!-- SSHLG:ROUTERS:BEGIN[\s\S]*?<!-- SSHLG:ROUTERS:END -->','',s)
 now=hashlib.sha256(outside.encode()).hexdigest()
 preserve.append(dict(path=rel,outside_before=v['outside_router_sha256'],outside_after=now,unchanged=now==v['outside_router_sha256']))
result=dict(as_of='2026-10-09',method='Every Git-tracked file in all pinned skill payloads versus installed skills-CLI and Claude plugin channels; SHA256 digests over ordered relative-path/hash tuples.',rows=rows,skills=len(rows)//2,file_comparisons=sum(r['files'] for r in rows),mismatches=sum(len(r['mismatches']) for r in rows),operator_instruction_preservation=preserve)
Path(__file__).with_name('family-payload-readback.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k not in ['rows','operator_instruction_preservation']}))
assert not result['mismatches'] and all(p['unchanged'] for p in preserve)
