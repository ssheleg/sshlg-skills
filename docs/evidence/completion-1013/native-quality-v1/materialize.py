"""Materialize the frozen plugin in a new owned workspace; never installs it."""
import hashlib
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parent

def sha(data):
    return hashlib.sha256(data).hexdigest()

def description(text, value):
    assert text.startswith('---\n')
    end = text.index('\n---', 4)
    front = text[4:end]
    pattern = r'(?m)^description:[^\n]*(?:\n[ \t]+[^\n]*)*'
    hits = list(re.finditer(pattern, front))
    assert len(hits) == 1, 'ambiguous description field'
    # JSON string syntax is valid YAML; only the existing description field changes.
    new = re.sub(pattern, lambda _: 'description: '+json.dumps(value,ensure_ascii=False), front)
    result = '---\n'+new+text[end:]
    assert result[result.index('\n---',4):] == text[end:]
    return result

def build(repo, workspace, arm):
    assert arm in ('full','concise')
    manifest=json.loads((ROOT/'source.json').read_text())
    fixture=json.loads((ROOT.parent/'description-screening-fixture-v2.json').read_text())
    desc={x['id']:x['description'] for x in fixture['arms'][arm]}
    assert not workspace.exists()
    workspace.mkdir(mode=0o700)
    prefix=manifest['plugin']+'/'
    tree=subprocess.check_output(['git','ls-tree','-r',manifest['commit'],manifest['plugin']],cwd=repo,text=True)
    modes={row.split('\t',1)[1]:row.split()[0] for row in tree.splitlines()}
    assert set(modes)=={x['path'] for x in manifest['files']}
    changed=[];hashes={}
    for item in manifest['files']:
        path=item['path'];assert path.startswith(prefix) and '..' not in Path(path).parts
        assert modes[path] in ('100644','100755'), 'symlink or unsupported source mode'
        data=subprocess.check_output(['git','show',manifest['commit']+':'+path],cwd=repo)
        assert sha(data)==item['sha256'] and len(data)==item['bytes']
        rel=Path(path[len(prefix):])
        if rel.name=='SKILL.md':
            text=data.decode();assert '!`' not in text, 'dynamic skill command not admitted'
            assert not re.search(r'(?m)^context:\s*fork\s*$',text), 'forked skill not admitted'
            data=description(text,desc[rel.parent.name]).encode();changed.append(rel.parent.name)
        dest=workspace/'plugin'/rel;dest.parent.mkdir(mode=0o700,parents=True,exist_ok=True);dest.write_bytes(data);dest.chmod(0o600)
        hashes['plugin/'+str(rel)]=sha(data)
    assert len(changed)==7 and len(set(changed))==7
    for source in sorted((ROOT/'fixture').iterdir()):
        assert source.is_file() and not source.is_symlink()
        dest=workspace/'app'/source.name;dest.parent.mkdir(mode=0o700,exist_ok=True);dest.write_bytes(source.read_bytes());dest.chmod(0o600);hashes['app/'+source.name]=sha(dest.read_bytes())
    assert not any(x.name in ('tasks.json','rubric.json','source.json') for x in workspace.rglob('*'))
    return hashes

def verify(workspace, hashes):
    actual={str(p.relative_to(workspace)):sha(p.read_bytes()) for p in workspace.rglob('*') if p.is_file() and not p.is_symlink()}
    assert actual==hashes and not any(p.is_symlink() for p in workspace.rglob('*')), 'workspace changed'
