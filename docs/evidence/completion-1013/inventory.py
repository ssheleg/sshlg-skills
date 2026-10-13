#!/usr/bin/env python3
"""Reconcile committed owning boards; documented state is not implementation acceptance."""
import collections
import hashlib
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).with_name('inventory.json')
CLOSED = re.compile(r'^(closed|done|resolved|waived|dropped|superseded|retired)\b', re.I)
PACKETS = {'B-143':'C04','B-164':'C03','B-171':'C06','B-172':'C06','B-182':'C07','B-183':'C07','B-184':'C07','B-185':'C05','B-144':'C09','B-147':'C09','B-148':'C09'}
WAVES = {'C03':1,'C04':1,'C05':1,'C06':2,'C07':2,'C08':3,'C09':3,'C10':4}
HUMAN = {'B-29','B-146','B-174','B-175','B-180'}
def git(root, *args):
    return subprocess.check_output(['git','-C',str(root),*args],text=True).strip()
def cells(line):
    return [x.strip() for x in re.split(r'(?<!\\)\|',line)[1:-1]]
def rows(text):
    header=[];section='';result=[]
    for n,line in enumerate(text.splitlines(),1):
        if line.startswith('#'): section=line.lstrip('# ').strip();header=[]
        if not line.startswith('|'):continue
        c=cells(line)
        if c and c[0].lower()=='id':header=[x.lower() for x in c];continue
        if not c or not re.fullmatch(r'[A-Z]+-\d+[a-z]?',c[0]):continue
        if len(c)!=len(header):raise ValueError(f'line {n}: row/header width mismatch')
        d=dict(zip(header,c));status=d.get('status',d.get('state'))
        if status is None:
            if 'what closed it' in d or section.lower().startswith('closed'):status='closed'
            elif 'why it is still open' in d:status='open: '+d['why it is still open']
            elif 'priority' in d:status='open: '+d['priority']
            else:status='unknown: no status column; reconcile table before acceptance'
        normalized=status.replace('*','').strip()
        result.append({'id':c[0],'line':n,'recorded_status':normalized,'open':not bool(CLOSED.match(normalized)),
            'summary':d.get('what',d.get('item',d.get('row',''))),'section':section})
    return result

def main():
    owners=[('hub',ROOT)]+[(p.name,p) for p in sorted((ROOT/'skills').iterdir()) if p.is_dir()]
    sources=[];items=[]
    for owner,root in owners:
        sha=git(root,'rev-parse','HEAD'); rel='docs/evidence/backlog.md'
        available=subprocess.run(['git','-C',str(root),'cat-file','-e',f'{sha}:{rel}'],capture_output=True).returncode==0
        source={'owner':owner,'commit':sha,'path':str((root/rel).relative_to(ROOT)),'status':'read' if available else 'absent-at-pin'}
        if not available:sources.append(source);continue
        body=git(root,'show',f'{sha}:{rel}')
        try: parsed=rows(body)
        except ValueError as e: raise ValueError(f'{owner}: {e}') from e
        source.update(sha256=hashlib.sha256(body.encode()).hexdigest(),row_count=len(parsed),open_count=sum(x['open'] for x in parsed));sources.append(source)
        for row in parsed:
            if not row.pop('open'):continue
            ident=row['id'];packet=PACKETS.get(ident) if owner=='hub' else None
            row.update(owner=owner,source=f"{source['path']}:{row.pop('line')}",commit=sha,
                measured_status='documented-open; implementation requires evidence reconciliation',packet=packet,
                wave='human' if owner=='hub' and ident in HUMAN else (WAVES[packet] if packet else 'family-program'))
            items.append(row)
    data={'generated_by':str(Path(__file__).relative_to(ROOT)), 'scope':'Committed hub and pinned member boards, not all external projects or runtime acceptance', 'sources':sources,'items':items}
    OUT.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({'documented_open':len(items),'by_owner':dict(collections.Counter(x['owner'] for x in items)), 'absent_boards':[x['owner'] for x in sources if x['status']!='read']}))
if __name__=='__main__':main()
