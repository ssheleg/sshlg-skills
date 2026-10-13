import datetime,gzip,hashlib,json,pathlib,shutil,subprocess,tempfile,time
repo=pathlib.Path('/Users/sshlg/DATA/_wt/hub-release-1.62.0');sha='d75ab705ca5195f7f4f361245ec9dc077f233011'
out=pathlib.Path('/tmp/codex-order-independent.json');log=pathlib.Path('/tmp/codex-order-independent.log.gz')
assert shutil.disk_usage(repo).free>500*1024**2,'focused snapshot admission <500MiB'
with tempfile.TemporaryDirectory(prefix='codex-order-peer-') as temp:
 root=pathlib.Path(temp)/'source'
 subprocess.run(['git','-c','core.hooksPath=/dev/null','worktree','add','--detach',str(root),sha],cwd=repo,check=True,capture_output=True)
 try:
  assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()==sha
  paths=['bin/sshlg-skills.js','test/codex_native_e2e_test.js','test/fixtures/fake-codex.js','test/fixtures/native-transaction-boundary.cjs','lib/codexplugins.js','lib/codex-pending.js','lib/hostvis.js','lib/visibility-state.js','skills.json','claude-plugin-pins.json']
  manifest=[]
  for rel in paths:
   data=(root/rel).read_bytes();blob=subprocess.check_output(['git','show',sha+':'+rel],cwd=repo);assert data==blob
   manifest.append({'path':rel,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
  start=time.time();r=subprocess.run(['node','test/codex_native_e2e_test.js'],cwd=root,capture_output=True,text=True,timeout=180)
  text=r.stdout+r.stderr;log.write_bytes(gzip.compress(text.encode(),mtime=0))
  assert not subprocess.check_output(['git','status','--porcelain'],cwd=root,text=True).strip(),'focused test changed tracked source'
  record={'schema':'codex-order-independent/1','source':sha,'tree':subprocess.check_output(['git','rev-parse','HEAD^{tree}'],cwd=root,text=True).strip(),'command':['node','test/codex_native_e2e_test.js'],'exit':r.returncode,'elapsed_seconds':time.time()-start,'source_hashes':manifest,'log_sha256':hashlib.sha256(text.encode()).hexdigest(),'log_gzip_sha256':hashlib.sha256(log.read_bytes()).hexdigest(),'observed_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Actual launcher process fixtures with owned temporary HOME/CODEX_HOME, fake Codex transport/installers. Immutable detached Git source with authentic gitlinks; no actual user profile/provider/full suite.'}
 finally:
  subprocess.run(['git','worktree','remove',str(root)],cwd=repo,check=True,capture_output=True)
record['owned_worktree_removed']=not root.exists();out.write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record,indent=2));raise SystemExit(r.returncode)
