#!/usr/bin/env python3
"""Reproduce a bounded, provider-free AST graph from immutable hub Git objects.

Run with the installed graphifyy 0.9.44 interpreter. Output must be new.
Member repositories, prose and historical evidence scripts are outside scope.
"""
import argparse
from collections import Counter
from datetime import datetime, timezone
import gzip
import hashlib
from importlib.metadata import version
import json
from pathlib import Path
import subprocess
import tempfile

from graphify.extract import extract
from graphify.build import build_from_json
from graphify.cluster import cluster
from graphify.analyze import god_nodes
from graphify.export import to_json
from graphify.diagnostics import diagnose_extraction


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--commit', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    assert version('graphifyy') == '0.9.44', 're-admit a different extractor version'
    def git(*command):
        return subprocess.check_output(['git', *command], cwd=args.repo)
    commit = git('rev-parse', args.commit+'^{commit}').decode().strip()
    assert len(commit) == 40
    assert not args.output.exists(), 'preserve previous snapshots'
    entries = []
    for record in git('ls-tree', '-rz', commit).split(b'\0'):
        if not record:
            continue
        metadata, name = record.decode().split('\t')
        mode, kind, oid = metadata.split()
        if kind == 'blob' and mode in ('100644', '100755'):
            entries.append((name, oid))
    code = [(name, oid) for name, oid in entries
            if Path(name).suffix in ('.py', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.sh')
            and not name.startswith(('docs/', 'skills/'))]
    assert code and len(code) < 500, 'scope changed; review corpus first'
    manifest = []
    with tempfile.TemporaryDirectory(prefix='sshlg-code-graph-') as temporary:
        box = Path(temporary).resolve(); root = box/'source'; root.mkdir()
        paths = []
        for name, oid in code:
            body = git('cat-file', 'blob', oid)
            path = root/name; path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(body); paths.append(path)
            manifest.append({'path': name, 'git_blob': oid, 'bytes': len(body),
                             'sha256': hashlib.sha256(body).hexdigest()})
        data = extract(paths, root=root, cache_root=box/'cache', parallel=False)
        diagnostics = diagnose_extraction(data, directed=True, root=root)
        if isinstance(diagnostics.get('producer_suppression'), dict):
            diagnostics['producer_suppression']['path'] = 'graphifyy0.9.44/graphify/extract.py'
        graph = build_from_json(data, root=str(root), directed=True)
        assert graph.number_of_nodes() > 0 and graph.number_of_edges() > 0
        communities = cluster(graph)
        labels = {}
        for key, nodes in communities.items():
            sources = Counter(graph.nodes[node].get('source_file', 'unknown') for node in nodes)
            labels[key] = ' / '.join(Path(path).name for path, _ in sources.most_common(2))
        destination = box/'graph.json'
        assert to_json(graph, communities, str(destination), built_at_commit=commit,
                       community_labels=labels)
        raw = destination.read_bytes()
        assert str(box).encode() not in raw, 'nonportable extraction path'
        represented = {node.get('source_file') for node in data['nodes']}
        summary = {
            'schema': 'hub-code-graph/1', 'built_at_commit': commit,
            'as_of': datetime.now(timezone.utc).isoformat(), 'graphifyy': version('graphifyy'),
            'mode': 'code-only AST; directed; no-viz; no semantic or model extraction',
            'provider_calls': 0, 'provider_tokens': 0,
            'scope': 'tracked hub code excluding docs and member Git repositories',
            'source_files': manifest, 'files_with_no_extracted_nodes':
                [name for name, _ in code if name not in represented],
            'nodes': graph.number_of_nodes(), 'edges': graph.number_of_edges(),
            'communities': len(communities), 'community_labels': labels,
            'most_connected_symbols': [dict(item, source_file=graph.nodes[item['id']].get('source_file'),
                                            source_location=graph.nodes[item['id']].get('source_location'))
                                       for item in god_nodes(graph)],
            'graph_json_sha256': hashlib.sha256(raw).hexdigest(),
            'limits': ['Static extraction is not runtime reach or full dependency proof.',
                       'Same-endpoint relations may collapse; see diagnostics.',
                       'Member contracts and prose require separate source review.']}
        args.output.mkdir(parents=True)
        (args.output/'graph.json.gz').write_bytes(gzip.compress(raw, mtime=0))
        extraction_bytes = json.dumps(data, sort_keys=True).encode()
        assert str(box).encode() not in extraction_bytes, 'nonportable raw extraction'
        (args.output/'extraction.json.gz').write_bytes(gzip.compress(extraction_bytes, mtime=0))
        summary['extraction_json_sha256'] = hashlib.sha256(extraction_bytes).hexdigest()
        for name, value in [('manifest.json', summary), ('diagnostics.json', diagnostics)]:
            (args.output/name).write_text(json.dumps(value, indent=2, ensure_ascii=False)+'\n')
        print(json.dumps({key: summary[key] for key in
                          ('built_at_commit', 'nodes', 'edges', 'communities', 'provider_calls')}))


if __name__ == '__main__':
    main()
