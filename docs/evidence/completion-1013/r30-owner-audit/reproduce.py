#!/usr/bin/env python3
"""Read owner commits in disposable clones; never alter an owner checkout.
Usage: python3 reproduce.py --owners-root PATH --output PATH [--owner NAME]
No provider calls, npm suite, or validator self-tests. Outputs every observed status.
"""
import argparse,hashlib,json,os,pathlib,re,shutil,subprocess,tempfile,time
OWNERS=['agent-sync','make-skill','sheleg-design-skill','sheleg-dev','super-ux','task-pipeline','seo-aeo-audit']
def cmd(argv,cwd,timeout=180,env=None):
 p=subprocess.run(argv,cwd=cwd,capture_output=True,text=True,timeout=timeout,env=env)
 return p.returncode,p.stdout+p.stderr

def main():
 a=argparse.ArgumentParser();a.add_argument('--owners-root',required=True,type=pathlib.Path);a.add_argument('--output',required=True,type=pathlib.Path);a.add_argument('--owner',choices=OWNERS);a.add_argument('--resume',action='store_true');a.add_argument('--kinds',nargs='+',choices=['baseline','duplicate','width','tail-width','escaped'],default=['baseline','duplicate','width']);args=a.parse_args()
 rows=json.loads(args.output.read_text())["rows"] if args.resume and args.output.exists() else []
 for owner in ([args.owner] if args.owner else OWNERS):
  src=args.owners_root/owner
  rc,remote=cmd(['git','ls-remote','origin','refs/heads/main'],src);assert rc==0,remote
  sha=remote.split()[0]
  rc,_=cmd(['git','cat-file','-e',sha+'^{commit}'],src)
  if rc:raise RuntimeError(owner+' remote commit not in local object store; fetch separately before replay')
  rc,url=cmd(['git','remote','get-url','origin'],src);assert rc==0
  old=next((x for x in rows if x['owner']==owner),None)
  if old:assert old['sha']==sha,'changed source cannot resume'
  row=old or {'owner':owner,'sha':sha,'remote':url.strip(),'cases':[]}
  if old is None:rows.append(row)
  with tempfile.TemporaryDirectory(prefix='r30-owner-peer-') as tmp:
   scratch=pathlib.Path(tmp)/'scratch';scratch.mkdir()
   testenv=dict(os.environ,TMPDIR=str(scratch),PYTHONDONTWRITEBYTECODE='1')
   clone=pathlib.Path(tmp)/'repo'
   rc,out=cmd(['git','clone','--shared','--no-checkout','--quiet',str(src),str(clone)],src);assert rc==0,out
   rc,out=cmd(['git','checkout','--detach','--quiet',sha],clone);assert rc==0,out
   cmd(['git','remote','set-url','origin',url.strip()],clone)
   board=clone/'docs/evidence/backlog.md';original=board.read_text();lines=original.splitlines(keepends=True)
   candidates=[(i,l) for i,l in enumerate(lines) if re.match(r'^\|\s*\**[A-Z]{1,8}-\d+[a-z]?\**\s*\|',l)]
   assert candidates,owner+' has no recognized existing row'
   # A closed row avoids changing operational priority semantics; any row if no closed one.
   i,line=next(((i,l) for i,l in candidates if re.search(r'\b(closed|done)\b',l,re.I)),candidates[0])
   row['plant_line']=i+1;row['plant_id']=re.match(r'^\|\s*(\**[A-Z]{1,8}-\d+[a-z]?\**)',line).group(1)
   row['board_sha256']=hashlib.sha256(original.encode()).hexdigest()
   for mode in args.kinds:
    if any(c['kind']==mode for c in row['cases']):continue
    board.write_text(original)
    if mode=='duplicate':board.write_text(''.join(lines[:i+1]+[line]+lines[i+1:]))
    if mode=='width':
     changed=line.rstrip('\n').rstrip();assert changed.endswith('|')
     left,identifier,rest=changed.split('|',2)
     board.write_text(''.join(lines[:i]+[left+'|'+identifier+'| peer-width |'+rest+'\n']+lines[i+1:]))
    if mode=='tail-width':
     cells=line.rstrip('\n').split('|')
     assert cells[-1].strip()==''
     cells.insert(-2,' peer-width ')
     board.write_text(''.join(lines[:i]+['|'.join(cells)+'\n']+lines[i+1:]))
    if mode=='escaped':
     left,identifier,rest=line.rstrip('\n').split('|',2)
     board.write_text(''.join(lines[:i]+[left+'|'+identifier+'| peer\\|width '+rest+'\n']+lines[i+1:]))
    started=time.monotonic()
    try:rc,out=cmd(['python3','test/validate.py'],clone,env=testenv)
    except subprocess.TimeoutExpired as e:rc='TIMEOUT';out='validator exceeded 180 seconds'
    normalized=out.replace(str(clone),'<fixture>')
    _,dirty=cmd(['git','diff','--name-only'],clone)
    assert set(dirty.splitlines()) <= {'docs/evidence/backlog.md'},'validator mutated other tracked source'
    case={'kind':mode,'exit_code':rc,'elapsed_seconds':round(time.monotonic()-started,3),'board_sha256':hashlib.sha256(board.read_bytes()).hexdigest(),'other_tracked_changes':False,'output':normalized}
    row['cases'].append(case)
    print(owner,sha[:8],mode,rc,flush=True)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    data=json.dumps({'schema':'owner-board-replay/1','scope':'real structural validator, existing-row plants; no whole-suite acceptance','rows':rows},indent=2)+'\n'
    fd,pending=tempfile.mkstemp(prefix='.r30-receipt-',dir=args.output.parent)
    try:
     with os.fdopen(fd,'w') as stream:stream.write(data);stream.flush();os.fsync(stream.fileno())
     os.replace(pending,args.output)
    finally:
     if os.path.exists(pending):os.unlink(pending)
  # TemporaryDirectory removes only this script's clone.
 return 0
if __name__=='__main__':raise SystemExit(main())
