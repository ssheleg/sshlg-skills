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
 payload.write_text('second');(repo/'plugins/probe/.claude-plugin/plugin.json').write_text(json.dumps({'name':'probe','version':'2.0.0'}));git('add','.');git('commit','-qm','second');b=git('rev-parse','HEAD');git('tag','first',a);git('tag','second',b)
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
 cli('add-first',['plugin','marketplace','add','https://fixture.invalid/probe.git#first'])
 cli('install-first',['plugin','install','probe@owned-pin-probe'])
 settings=home/'.claude/settings.json';obj=json.loads(settings.read_text());obj['extraKnownMarketplaces']['owned-pin-probe']['source']['ref']='second';settings.write_text(json.dumps(obj))
 cli('add-second',['plugin','marketplace','add','https://fixture.invalid/probe.git#second'])
 cli('update-same-version',['plugin','update','probe@owned-pin-probe'])
 obj=json.loads(settings.read_text());obj['extraKnownMarketplaces']['owned-pin-probe']['source']['ref']='first';settings.write_text(json.dumps(obj))
 cli('add-first-again',['plugin','marketplace','add','https://fixture.invalid/probe.git#first'])
 cli('update-back',['plugin','update','probe@owned-pin-probe'])
 pathlib.Path('/tmp/claude-pins-probe-settings.json').write_text(json.dumps({'a':a,'b':b,'rows':results},indent=2))
finally:
 shutil.rmtree(root)
 print('owned synthetic tree removed',flush=True)
