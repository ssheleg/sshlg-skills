import pathlib,subprocess,json,tarfile,io,hashlib,os,re,argparse
parser=argparse.ArgumentParser(description="Read every expected pinned plain-skill file; writes only a new receipt.")
parser.add_argument("--source",required=True)
parser.add_argument("--output",type=pathlib.Path,required=True)
args=parser.parse_args()
if not re.fullmatch(r"[0-9a-f]{40}",args.source): parser.error("full immutable source commit required")
if args.output.exists(): parser.error("output already exists; preserve historical receipt")
root=pathlib.Path(__file__).resolve().parents[4];home=pathlib.Path.home()
manifest=json.loads(subprocess.check_output(['git','show',args.source+':skills.json'],cwd=root))
package=json.loads(subprocess.check_output(['git','show',args.source+':package.json'],cwd=root))
config=pathlib.Path(os.environ.get('XDG_CONFIG_HOME',str(home/'.config')))
claw=next((home/p for p in ('.openclaw','.clawdbot','.moltbot') if (home/p).exists()),home/'.openclaw')
roots={'shared':home/'.agents/skills','cursor':home/'.cursor/skills','opencode':config/'opencode/skills','kilo':home/'.kilo/skills','hermes':pathlib.Path(os.environ.get('HERMES_HOME',str(home/'.hermes')))/'skills','openclaw':claw/'skills','gemini':home/'.gemini/skills','windsurf':home/'.codeium/windsurf/skills','kiro':home/'.kiro/skills','goose':config/'goose/skills','continue':home/'.continue/skills'}
for host in ('cursor','opencode','kilo','gemini'): roots[host]=home/'.agents/skills'
rows=[];checks={k:{'skills':0,'files':0,'directory_symlinks':0,'issues':[]} for k in roots}
for member in manifest['skills']:
 repo=root/member['dir'];sha=member['commit']
 listing=subprocess.check_output(['git','ls-tree','-r','--name-only',sha],cwd=repo,text=True).splitlines()
 entries=[p for p in listing if re.fullmatch(r'plugins/[^/]+/skills/[^/]+/SKILL.md',p)]
 prefixes=[p[:-len('SKILL.md')] for p in entries]
 blob=subprocess.check_output(['git','archive',sha,*[x.rstrip('/') for x in prefixes]],cwd=repo)
 payload={}
 with tarfile.open(fileobj=io.BytesIO(blob)) as archive:
  for item in archive:
   if item.isdir():continue
   assert item.isfile(),item.name
   payload[item.name]=archive.extractfile(item).read()
 for prefix in prefixes:
  skill=prefix.rstrip('/').rsplit('/',1)[1];expected={p[len(prefix):]:b for p,b in payload.items() if p.startswith(prefix)}
  digest=hashlib.sha256(json.dumps({p:hashlib.sha256(b).hexdigest() for p,b in sorted(expected.items())},sort_keys=True).encode()).hexdigest()
  rows.append({'member':member['name'],'source':sha,'skill':skill,'file_count':len(expected),'file_hash_map_sha256':digest})
  for host,base in roots.items():
   dest=base/skill;c=checks[host];c['skills']+=1;c['directory_symlinks']+=int(dest.is_symlink())
   if not dest.is_dir():c['issues'].append({'skill':skill,'reason':'missing_directory'});continue
   if host=='continue' and dest.is_symlink():c['issues'].append({'skill':skill,'reason':'continue_not_real_directory'})
   for rel,body in expected.items():
    f=dest/rel;c['files']+=1
    try:actual=f.read_bytes()
    except OSError:c['issues'].append({'skill':skill,'file':rel,'reason':'missing_or_unreadable'});continue
    if actual!=body:c['issues'].append({'skill':skill,'file':rel,'reason':'bytes_differ'})
result={'schema':'plain-installed-readback/1','launcher':package['version'],'source':args.source,'source_skills':len(rows),'source_files':sum(x['file_count'] for x in rows),'sources':rows,'destinations':checks,'boundary':'Every expected source file compared at measured destinations; extra consumer files and native model invocation are not certified. Pinned skills CLI 1.7.2 isUniversalAgent/getAgentBaseDir routes Cursor/OpenCode/Kilo/Gemini to shared despite their globalSkillsDir entries; Codex/Kimi/Zed/Pi also share. First destination-table assumption is retained separately. Host loader use is separate.'}
with args.output.open('x') as output: output.write(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:{'skills':v['skills'],'files':v['files'],'issues':len(v['issues']),'directory_symlinks':v['directory_symlinks']} for k,v in checks.items()},indent=2))
raise SystemExit(any(v['issues'] for v in checks.values()))
