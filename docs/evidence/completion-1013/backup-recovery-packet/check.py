#!/usr/bin/env python3
"""Check frozen packet evidence; requires referenced Git objects locally."""
import hashlib
import json
import pathlib
import re
import subprocess

packet = pathlib.Path(__file__).resolve().parent
repo = subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], cwd=packet, text=True).strip()
ledger = json.loads((packet / 'sources.json').read_text())
for row in ledger['files']:
    source = subprocess.check_output(['git', 'show', row['revision'] + ':' + row['path']], cwd=repo)
    assert hashlib.sha256(source).hexdigest() == row['sha256'], row['path']
    blob = subprocess.check_output(['git', 'rev-parse', row['revision'] + ':' + row['path']], cwd=repo, text=True).strip()
    assert blob == row['gitBlob'], row['path']
    if 'protectLiteralMatches' in row:
        matches = [{'line': i, 'source': line.strip()} for i, line in enumerate(source.decode().splitlines(), 1) if 'protect(' in line]
        assert matches == row['protectLiteralMatches']
for link in re.findall(r'\]\(([^)]+)\)', (packet / 'README.md').read_text()):
    if not link.startswith('https://'):
        assert (packet / link).exists(), link
observation = json.loads((packet / 'retention-observation.json').read_text())
assert observation['schema'] == 'mb02-retention-observation/1'
assert observation['recoveryCopyStillExists'] is False
assert observation['laterOrdinarySaves'] == 11
print(f"PASS: {len(ledger['files'])} immutable source blobs, callsite inventory, local links and historical observation")
