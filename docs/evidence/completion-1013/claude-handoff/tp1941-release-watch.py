import subprocess,time,json,hashlib
from pathlib import Path
from datetime import datetime,timezone
rid='38404300140'; source='540679ea7552f8a37e99560e287a69c23cbd3c4a'
out=Path('/tmp/tp1941-release-watch.json'); begin=time.monotonic()
verify=Path('/Users/sshlg/DATA/_wt/hub-release-1.62.0/docs/evidence/host-compat/releases/verify_registry.py')
digest=hashlib.sha256(verify.read_bytes()).hexdigest()
while time.monotonic()-begin<10800:
    p=subprocess.run(['gh','run','view',rid,'-R','ssheleg/task-pipeline','--json','databaseId,headSha,headBranch,status,conclusion,url,jobs'],capture_output=True,text=True,timeout=60)
    if p.returncode:
        out.write_text(json.dumps({'state':'READ_ERROR','exit':p.returncode,'observed':datetime.now(timezone.utc).isoformat()})+'\n');time.sleep(60);continue
    d=json.loads(p.stdout);assert d['headSha']==source and d['headBranch']=='v1.94.1'
    d.update(observed=datetime.now(timezone.utc).isoformat(),watcher='read-only hosted run and immutable registry verifier; no retry of publication')
    out.write_text(json.dumps(d,indent=2)+'\n')
    if d['status']=='completed':
        if d['conclusion']=='success':
            assert hashlib.sha256(verify.read_bytes()).hexdigest()==digest
            args=['python3',str(verify),'--repo','/Users/sshlg/DATA/_wt/tp-publish-1.94.1-clean','--package','task-pipeline-skill','--version','1.94.1','--source',source,'--release-run',rid,'--output','/tmp/tp1941-registry.json']
            p=subprocess.run(args,capture_output=True,text=True,timeout=120)
            d.update(registry_check_exit=p.returncode,registry_receipt='/tmp/tp1941-registry.json',verifier_sha256=digest)
            out.write_text(json.dumps(d,indent=2)+'\n')
        print(json.dumps({'run':rid,'conclusion':d['conclusion'],'registry_check_exit':d.get('registry_check_exit')}),flush=True);break
    time.sleep(60)
else:
    print('watcher bounded timeout; no release retry or approval implied',flush=True)
