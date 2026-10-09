#!/usr/bin/env python3
"""Collect a NEW pinned portability snapshot without touching installed skills.

Python 3.12+ and git. Existing output directories are refused. Source git objects
come from --repositories/<member.dir>; missing pins are fetched into temporary
bare repos by exact SHA. No checkout/reset/submodule update or provider call.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import re
import subprocess
import sys
import tarfile
import tempfile
from urllib.parse import unquote


def run(argv, cwd=None):
    return subprocess.check_output(argv, cwd=cwd)


def emit(path, data):
    path.write_text(json.dumps(data, indent=2) + '\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--hub', type=Path, required=True)
    parser.add_argument('--repositories', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if sys.version_info < (3, 12):
        parser.error('Python 3.12+ is required for safe archive extraction')
    args.output.mkdir(parents=True, exist_ok=False)
    hub_sha = run(['git', 'rev-parse', 'HEAD'], args.hub).decode().strip()
    manifest = json.loads(run(['git', 'show', hub_sha + ':skills.json'], args.hub))
    rows, hits, closures = [], [], []
    patterns = {
        'plugin-variable': r'CLAUDE_(?:PLUGIN_ROOT|SKILL_DIR|PROJECT_DIR)',
        'argument-variable': r'\$ARGUMENTS',
        'claude-tool-name': r'\b(?:AskUserQuestion|TodoWrite|TaskCreate|TaskUpdate|TaskList|WebFetch|WebSearch)\b',
        'universal-negative': r'(?:only (?:inside|in) Claude Code|Claude.Code.only|elsewhere.*(?:no |nothing)|other host.*(?:no |nothing)|Not Claude Code)',
        'delegation': r'\b(?:subagent|sub-agent|Explore agent|Task tool)\b',
    }
    with tempfile.TemporaryDirectory(prefix='pinned-portability-') as tmp:
        snapshots = Path(tmp)
        pins = {}
        for member in manifest['skills']:
            sha = run(['git', 'ls-tree', hub_sha, member['dir']], args.hub).decode().split()[2]
            pins[member['name']] = sha
            source = args.repositories / member['dir']
            available = source.exists() and subprocess.run(['git', 'cat-file', '-e', sha + '^{tree}'], cwd=source, capture_output=True).returncode == 0
            if not available:
                source = snapshots / (member['name'] + '.git')
                run(['git', 'init', '--bare', str(source)])
                run(['git', 'fetch', '--depth=1', 'https://github.com/' + member['repo'] + '.git', sha], source)
            target = snapshots / member['name']
            target.mkdir()
            archive = run(['git', 'archive', sha], source)
            with tarfile.open(fileobj=io.BytesIO(archive)) as tree:
                tree.extractall(target, filter='data')
        auditor = snapshots / 'make-skill/plugins/make-skill/skills/make-skill/scripts/audit_skill.py'
        auditor_hash = hashlib.sha256(auditor.read_bytes()).hexdigest()
        for member in manifest['skills']:
            root = snapshots / member['name']
            for name in member['skillNames']:
                found = [p for p in root.glob('plugins/*/skills/*/SKILL.md') if p.parent.name == name]
                if len(found) != 1:
                    raise RuntimeError('expected one advertised skill: ' + name)
                skill = found[0].parent
                checked = subprocess.run([sys.executable, str(auditor), str(skill), '--house', '--json'], capture_output=True, text=True)
                audit = json.loads(checked.stdout)
                emit(args.output / (name + '.audit.json'), audit)
                files, escaping, links = [], [], []
                for file in sorted(skill.rglob('*')):
                    if file.is_file():
                        files.append({'path': str(file.relative_to(skill)), 'sha256': hashlib.sha256(file.read_bytes()).hexdigest(), 'bytes': file.stat().st_size})
                    if file.is_symlink() and not file.resolve().is_relative_to(skill.resolve()):
                        escaping.append(str(file.relative_to(skill)))
                    if file.suffix != '.md' or not file.is_file():
                        continue
                    for line_number, line in enumerate(file.read_text().splitlines(), 1):
                        for kind, pattern in patterns.items():
                            if re.search(pattern, line, re.I):
                                hits.append({'member': member['name'], 'skill': name, 'path': str(file.relative_to(root)), 'line': line_number, 'kind': kind, 'text': line})
                        for url in re.findall(r'\]\(([^\s)]+)(?:\s+"[^"]*")?\)', line):
                            url = url.strip('<>')
                            base = unquote(url.split('#')[0])
                            if not base or re.match(r'^[a-z]+:', base) or base.startswith('/'):
                                continue
                            target = (file.parent / base).resolve()
                            links.append({'file': str(file.relative_to(skill)), 'line': line_number, 'target': url, 'exists': target.exists(), 'inside_skill': target.is_relative_to(skill.resolve())})
                rows.append({'member': member['name'], 'commit': pins[member['name']], 'skill': name, 'skill_path': str(skill.relative_to(root)), 'audit_exit': checked.returncode, 'audit_file': name + '.audit.json', 'files': files, 'escaping_symlinks': escaping})
                closures.append({'skill': name, 'markdown_links': links})
        emit(args.output / 'census.json', {'hub_commit': hub_sha, 'python_version': sys.version.split()[0], 'auditor_sha256': auditor_hash, 'members': len(manifest['skills']), 'skills': len(rows), 'file_count': sum(len(r['files']) for r in rows), 'rows': rows})
        emit(args.output / 'host-pattern-hits.json', hits)
        emit(args.output / 'link-closure.json', closures)
    print(json.dumps({'hub_commit': hub_sha, 'skills': len(rows), 'files': sum(len(r['files']) for r in rows), 'audit_nonzero': sum(r['audit_exit'] != 0 for r in rows)}))


if __name__ == '__main__':
    main()
