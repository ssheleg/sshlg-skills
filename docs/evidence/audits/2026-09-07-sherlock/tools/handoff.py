#!/usr/bin/env python3
"""Read-only, stdlib entry to a repository-backed planning handoff."""
import argparse, hashlib, json, pathlib, re, sys

B = pathlib.Path(__file__).resolve().parent.parent
def read(p): return json.loads(p.read_text())
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def inside(root, suffix):
    p = (root / suffix).resolve()
    if not p.is_relative_to(root.resolve()): raise ValueError('Path escapes declared root: '+suffix)
    return p
def resolve(address, roots):
    if address.startswith('audit://'): return inside(B, address[8:])
    if address.startswith('repo://'):
        name, _, suffix = address[7:].partition('/')
        if name not in roots: return None
        return inside(pathlib.Path(roots[name]), suffix)
    return None
def validate(plan):
    errors=[]; leaves=plan['leaves']; by={l['id']:l for l in leaves}
    parents={p['id']:p for p in plan['parents']}
    if len(by)!=len(leaves):errors.append('duplicate leaf')
    for leaf in leaves:
        ident=leaf['id']; pc=leaf['primary_context']; p=resolve(pc['path'],{})
        if not p or not p.is_file() or digest(p)!=pc['sha256']:errors.append(ident+': primary digest')
        elif p.stat().st_size!=pc['utf8_bytes'] or p.stat().st_size>pc['budget_bytes']:errors.append(ident+': primary budget')
        if read(B/'external-v3/leaves'/(ident+'.json'))!=leaf:errors.append(ident+': sidecar drift')
        for k in ['why','decision','change','acceptance','edit_targets','outputs']:
            if not leaf.get(k):errors.append(ident+': missing '+k)
        if leaf['parent_id'] not in parents:errors.append(ident+': parent missing')
        for d in leaf['depends_on']:
            if d['task_id'] not in by or d['kind'] not in ['data','control','resource']:errors.append(ident+': dependency')
    visited=set(); active=set()
    def visit(i):
        if i in active:errors.append('cycle at '+i);return
        if i in visited or i not in by:return
        active.add(i)
        for d in by[i]['depends_on']:visit(d['task_id'])
        active.remove(i);visited.add(i)
    for i in by:visit(i)
    for p in parents.values():
        if set(p['leaf_ids'])!={l['id'] for l in leaves if l['parent_id']==p['id']}:errors.append(p['id']+': coverage')
    return errors
def verify():
    errors=validate(read(B/'external-v3/plan.json'))
    integrity=read(B/'integrity.json')
    for row in integrity['files']:
        p=inside(B,row['path'])
        if not p.is_file() or digest(p)!=row['sha256']:errors.append('transport: '+row['path'])
    result={'pass':not errors,'files':len(integrity['files']),'errors':errors,'scope':'Portable data integrity and plan structure, not source freshness or execution readiness.'}
    print(json.dumps(result,ensure_ascii=False));return bool(errors)
def show(ident,roots):
    plan=read(B/'external-v3/plan.json');leaf=next((l for l in plan['leaves'] if l['id']==ident),None)
    if not leaf: raise ValueError('Unknown task: '+ident)
    primary=resolve(leaf['primary_context']['path'],{})
    if digest(primary)!=leaf['primary_context']['sha256']:raise ValueError('Primary packet changed; verify and revise before use')
    print(primary.read_text())
    checks=[]
    for row in leaf['edit_targets']+leaf['appendix'].get('source_files',[]):
        address=row['path'];p=resolve(address,roots);expected=row.get('baseline_sha256',row.get('sha256'))
        if not address.startswith('repo://'):continue
        if not p:state='CHECKOUT_NOT_MAPPED'
        elif row.get('mode')=='Edit_from_predecessor':state='REQUIRES_PREDECESSOR_OUTPUT'
        elif row.get('mode')=='Create':state='CREATE_CONFLICT' if p.exists() else 'CREATE_TARGET_ABSENT'
        elif not p.is_file():state='MISSING'
        elif expected and digest(p)!=expected:state='STALE_AUDIT_BASELINE'
        else:state='MATCH'
        checks.append({'source':address,'state':state})
    print('\n## Dispatch status\n')
    print(json.dumps({'status':'NOT_DISPATCHED','prerequisites':leaf['depends_on'],'source_checks':checks,'remaining':'Materialize predecessor results, review source drift, host capabilities, scope and ownership claim before execution.'},ensure_ascii=False,indent=2))
    return 0
def main():
    parser=argparse.ArgumentParser(description=__doc__);sub=parser.add_subparsers(dest='command',required=True)
    sub.add_parser('verify');p=sub.add_parser('show');p.add_argument('task');p.add_argument('--roots',type=pathlib.Path)
    args=parser.parse_args()
    return verify() if args.command=='verify' else show(args.task,read(args.roots) if args.roots else {})
if __name__=='__main__':
    try: sys.exit(main())
    except (ValueError,KeyError,OSError,json.JSONDecodeError) as error:
        print('handoff: '+str(error),file=sys.stderr);sys.exit(2)
