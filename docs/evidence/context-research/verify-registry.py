import argparse,base64,hashlib,io,json,subprocess,tarfile,urllib.request
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('repo');p.add_argument('package');p.add_argument('version');p.add_argument('sha');p.add_argument('output');a=p.parse_args()
url='https://registry.npmjs.org/'+a.package.replace('/','%2f')+'/'+a.version
with urllib.request.urlopen(url,timeout=40) as r: meta=json.load(r)
assert meta['version']==a.version
assert meta['gitHead']==a.sha,meta.get('gitHead')
with urllib.request.urlopen(meta['dist']['tarball'],timeout=40) as r: data=r.read()
integrity='sha512-'+base64.b64encode(hashlib.sha512(data).digest()).decode();assert integrity==meta['dist']['integrity']
rows=[]
with tarfile.open(fileobj=io.BytesIO(data),mode='r:gz') as archive:
 for m in archive:
  if m.isdir():continue
  assert m.isfile() and m.name.startswith('package/') and '..' not in Path(m.name).parts,m.name
  path=m.name[len('package/'):];raw=archive.extractfile(m).read()
  source=subprocess.check_output(['git','-C',a.repo,'show',a.sha+':'+path])
  assert raw==source,path
  rows.append({'file':path,'sha256':hashlib.sha256(raw).hexdigest()})
assert rows
out={'as_of':'2026-10-09','package':a.package,'version':a.version,'source_commit':a.sha,'registry_gitHead':meta['gitHead'],'integrity':integrity,'files_matched':len(rows),'files':rows}
Path(a.output).write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({k:v for k,v in out.items() if k!='files'}))
