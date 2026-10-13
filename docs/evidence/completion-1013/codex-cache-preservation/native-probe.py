import os,pathlib,tempfile,json,subprocess,shutil
root=pathlib.Path(tempfile.mkdtemp(prefix='owned-codex-cache-probe-')); results=[]
try:
 repo=root/'repo';repo.mkdir();home=root/'home';home.mkdir();ch=home/'.codex';ch.mkdir()
 env={**os.environ,'HOME':str(home),'CODEX_HOME':str(ch),'GIT_CONFIG_GLOBAL':str(root/'gitconfig'),'GIT_CONFIG_NOSYSTEM':'1'}
 def run(args,expect=0):
  p=subprocess.run(args,cwd=repo,env=env,text=True,capture_output=True,timeout=45)
  results.append({'args':args,'exit':p.returncode,'stdout':p.stdout.replace(str(root),'<fixture>'),'stderr':p.stderr.replace(str(root),'<fixture>')})
  if expect is not None: assert p.returncode==expect,results[-1]
  return p
 run(['git','init','-q']);run(['git','config','user.email','fixture@example.invalid']);run(['git','config','user.name','Fixture'])
 for d in ['.claude-plugin','plugins/probe/.claude-plugin','plugins/probe/scripts']: (repo/d).mkdir(parents=True,exist_ok=True)
 def version(v):
  (repo/'.claude-plugin/marketplace.json').write_text(json.dumps({'name':'cache-probe','owner':{'name':'fixture'},'plugins':[{'name':'probe','source':'./plugins/probe','version':v}]}))
  (repo/'plugins/probe/.claude-plugin/plugin.json').write_text(json.dumps({'name':'probe','version':v,'description':'Synthetic cache lifetime probe'}))
  (repo/'plugins/probe/scripts/probe.sh').write_text('echo version-'+v+'\n')
  run(['git','add','.']);run(['git','commit','-qm',v]);return run(['git','rev-parse','HEAD']).stdout.strip()
 old=version('1.0.0');new=version('1.1.0')
 run(['git','config','--file',str(root/'gitconfig'),'url.'+repo.as_uri()+'.insteadOf','https://github.com/fixture/cache-probe.git'])
 def codex(*args):return run(['codex','plugin',*args])
 codex('marketplace','add','https://github.com/fixture/cache-probe.git','--ref',old,'--json');codex('add','probe@cache-probe','--json')
 oldpath=ch/'plugins/cache/cache-probe/probe/1.0.0/scripts/probe.sh'
 assert oldpath.exists(),list(ch.rglob('probe.sh'))
 run(['sh',str(oldpath)])
 codex('marketplace','remove','cache-probe');assert oldpath.exists()
 codex('marketplace','add','https://github.com/fixture/cache-probe.git','--ref',new,'--json');assert oldpath.exists()
 codex('add','probe@cache-probe','--json');assert not oldpath.exists()
 p=run(['sh',str(oldpath)],expect=None);assert p.returncode!=0
 # A second isolated profile tests the native upgrade route too.
 ch2=home/'.codex-upgrade';ch2.mkdir();env['CODEX_HOME']=str(ch2)
 codex('marketplace','add','https://github.com/fixture/cache-probe.git','--ref',old,'--json');codex('add','probe@cache-probe','--json')
 oldpath2=ch2/'plugins/cache/cache-probe/probe/1.0.0/scripts/probe.sh';assert oldpath2.exists()
 beforeconfig=(ch2/'config.toml').read_bytes()
 run(['codex','-c','marketplaces.cache-probe.ref="'+new+'"','plugin','marketplace','upgrade','cache-probe','--json'])
 upgrade_pruned=not oldpath2.exists()
 assert upgrade_pruned
 assert (ch2/'config.toml').read_bytes()==beforeconfig
 results.append({'assertions':{'old_payload_survives_marketplace_remove':True,'old_payload_survives_marketplace_add':True,'plugin_add_deletes_old_payload':True,'old_hook_path_fails':True,'upgrade_with_ephemeral_ref_also_prunes':upgrade_pruned,'upgrade_does_not_persist_override':True}})
finally:
 pathlib.Path('/tmp/owned-codex-cache-probe.json').write_text(json.dumps(results,indent=2)+'\n');shutil.rmtree(root)
print('native isolated cache probe PASS; synthetic fixture removed')
