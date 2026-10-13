import os,json,tempfile,pathlib,subprocess,shutil
root=pathlib.Path(tempfile.mkdtemp(prefix='owned-claude-pins-probe-'))
results=[]
try:
 repo=root/'source';repo.mkdir();home=root/'home';home.mkdir();cwd=root/'cwd';cwd.mkdir()
 env={k:v for k,v in os.environ.items() if not any(w in k.upper() for w in ('TOKEN','SECRET','API_KEY','AUTH'))}
 env.update(HOME=str(home),CLAUDE_CONFIG_DIR=str(home/'.claude'),XDG_CONFIG_HOME=str(home/'.config'),GIT_CONFIG_GLOBAL=str(home/'.gitconfig'),GIT_CONFIG_NOSYSTEM='1',CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC='1',DISABLE_AUTOUPDATER='1')
 def run(args,where=repo):
  p=subprocess.run(args,cwd=where,env=env,text=True,capture_output=True,timeout=60)
  return p
 def git(*a):
  p=run(['git',*a]);assert p.returncode==0,p.stderr;return p.stdout.strip()
 git('init','-q');git('config','user.email','probe@example.invalid');git('config','user.name','Probe')
 (repo/'.claude-plugin').mkdir();(repo/'plugins/probe/.claude-plugin').mkdir(parents=True)
 (repo/'.claude-plugin/marketplace.json').write_text(json.dumps({'name':'owned-pin-probe','owner':{'name':'Probe'},'plugins':[{'name':'probe','source':'./plugins/probe'}]}))
 (repo/'plugins/probe/.claude-plugin/plugin.json').write_text(json.dumps({'name':'probe','version':'1.0.0'}))
 payload=repo/'plugins/probe/value.txt';payload.write_text('first');git('add','.');git('commit','-qm','first');a=git('rev-parse','HEAD')
 payload.write_text('second');git('add','.');git('commit','-qm','second');b=git('rev-parse','HEAD')
 # Git transport is mapped to this synthetic repository in this isolated process only.
 run(['git','config','--global',f'url.file://{repo}.insteadOf','https://fixture.invalid/probe.git'])
 def cli(label,args):
  p=run(['/opt/homebrew/bin/claude',*args],cwd)
  reg=home/'.claude/plugins/installed_plugins.json';known=home/'.claude/plugins/known_marketplaces.json'
  row={'label':label,'exit':p.returncode,'stdout':p.stdout,'stderr':p.stderr,'installed':json.loads(reg.read_text()) if reg.exists() else None,'known':json.loads(known.read_text()) if known.exists() else None}
  if row['installed']:
   for records in row['installed'].get('plugins',{}).values():
    for r in records:
     f=pathlib.Path(r['installPath'])/'value.txt';r['observed_payload']=f.read_text() if f.exists() else 'MISSING'
  results.append(row);print(label,p.returncode,p.stdout.strip(),flush=True)
 catalog=root/'catalog';(catalog/'.claude-plugin').mkdir(parents=True)
 def catalog_at(sha):
  (catalog/'.claude-plugin/marketplace.json').write_text(json.dumps({'name':'owned-pin-probe','owner':{'name':'Probe'},'plugins':[{'name':'probe','source':{'source':'git-subdir','url':'https://fixture.invalid/probe.git','path':'plugins/probe','sha':sha}}]}))
 catalog_at(a)
 cli('add-local-sha-a',['plugin','marketplace','add',str(catalog)])
 cli('install-sha-a',['plugin','install','probe@owned-pin-probe'])
 catalog_at(b)
 cli('refresh-local-sha-b',['plugin','marketplace','update','owned-pin-probe'])
 cli('update-same-version-sha-b',['plugin','update','probe@owned-pin-probe'])
 settings=home/'.claude/settings.json';obj=json.loads(settings.read_text());obj['enabledPlugins']['probe@owned-pin-probe']=False;obj['enabledPlugins']['foreign@foreign']=False;obj['env']={'SYNTHETIC':'preserve'};settings.write_text(json.dumps(obj))
 data=home/'.claude/plugins/data/probe-owned-pin-probe';data.mkdir(parents=True);(data/'owned.txt').write_text('preserve')
 cli('uninstall-keep-data',['plugin','uninstall','probe@owned-pin-probe','--keep-data','--scope','user','--json'])
 cli('reinstall-same-version-sha-b',['plugin','install','probe@owned-pin-probe','--scope','user'])
 results.append({'label':'preservation','settings':json.loads(settings.read_text()),'data_retained':(data/'owned.txt').exists()})

 catalog_at(a)
 cli('refresh-local-sha-a',['plugin','marketplace','update','owned-pin-probe'])
 cli('update-back-sha-a',['plugin','update','probe@owned-pin-probe'])
 pathlib.Path('/tmp/claude-pins-probe-reinstall.json').write_text(json.dumps({'a':a,'b':b,'rows':results},indent=2))
finally:
 shutil.rmtree(root)
 print('owned synthetic tree removed',flush=True)
