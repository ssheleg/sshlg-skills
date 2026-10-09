#!/usr/bin/env node
'use strict';

// Bounded navigation/integrity check. Currentness and semantic rule preservation
// require the source/coverage review in docs/evidence/context-research/README.md.
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function links(file, text) {
  return [...text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)]
    .map(match => match[1].split('#')[0])
    .filter(target => target && !/^[a-z]+:/i.test(target))
    .map(target => path.posix.normalize(path.posix.join(path.posix.dirname(file), target)));
}

function check(read) {
  const manifest = JSON.parse(read('docs/evidence/context-research/navigation.json'));
  assert(manifest.archives.length > 0, 'archive inventory is empty');
  const required = {
    'CLAUDE.md': ['docs/HANDOFF.md', 'docs/evidence/retro.md'],
    'docs/HANDOFF.md': [
      'docs/HANDOFF-2026-10-09-archive.md',
      'docs/evidence/instruction-context/README.md',
      'docs/runs/2026-10-09-knowledge-wave2.md',
      'docs/evidence/context-research/README.md',
      'docs/evidence/audits/2026-09-07-sherlock/external-v3/progress.json',
      'docs/evidence/audits/2026-09-13-family-hooks/progress.json',
      'docs/working-rules/repository-handoff.md'
    ]
  };
  for (const [file, expected] of Object.entries(required)) {
    const found = links(file, read(file).toString());
    for (const target of expected) assert(found.includes(target), `${file}: missing entry link ${target}`);
    for (const target of found) read(target); // missing local targets fail visibly
  }
  for (const entry of manifest.archives) {
    assert(/^[a-f0-9]{40}$/.test(entry.source_commit), 'archive source commit is missing');
    assert.strictEqual(path.posix.dirname(entry.path), path.posix.dirname(entry.source_path),
      'archive moved to a depth that changes relative links');
    assert.strictEqual(digest(read(entry.path)), entry.sha256, `frozen archive changed: ${entry.path}`);
  }
}

const files = new Map();
function read(file) {
  if (!files.has(file)) files.set(file, fs.readFileSync(path.join(root, file)));
  return files.get(file);
}
let count = 0;
function test(name, fn) { fn(); count++; process.stdout.write(`ok: ${name}\n`); }
test('active entry links resolve and frozen history matches recorded bytes', () => check(read));

function reject(name, mutate, reason) {
  test(name, () => {
    const planted = new Map(files);
    mutate(planted);
    assert([...planted].some(([key, value]) => value !== files.get(key)), 'negative control did not change input');
    assert.throws(() => check(file => {
      if (!planted.has(file)) throw new Error(`missing target: ${file}`);
      return planted.get(file);
    }), reason);
  });
}
reject('missing active entry link fails', m => {
  const file = 'CLAUDE.md';
  const text = m.get(file).toString();
  assert(links(file, text).includes('docs/HANDOFF.md'));
  m.set(file, text.replace(/\[[^\]]*\]\(docs\/HANDOFF\.md\)/g, 'removed link'));
  assert(!links(file, m.get(file)).includes('docs/HANDOFF.md'));
}, /missing entry link docs\/HANDOFF/);
reject('an extra broken local link fails', m => m.set('docs/HANDOFF.md',
  m.get('docs/HANDOFF.md') + '\n[missing](missing-context-target.md)\n'), /missing target/);
reject('altered frozen history fails', m => m.set('docs/HANDOFF-2026-10-09-archive.md',
  m.get('docs/HANDOFF-2026-10-09-archive.md') + '\nchanged\n'), /frozen archive changed/);
reject('an empty archive inventory fails', m => {
  const file = 'docs/evidence/context-research/navigation.json';
  const data = JSON.parse(m.get(file)); data.archives = []; m.set(file, JSON.stringify(data));
}, /archive inventory is empty/);
reject('archive moves cannot silently change relative link resolution', m => {
  const file = 'docs/evidence/context-research/navigation.json';
  const data = JSON.parse(m.get(file)); data.archives[0].path = 'docs/archive/HANDOFF.md';
  m.set(file, JSON.stringify(data));
}, /depth that changes relative links/);
process.stdout.write(`PASS: context handoff — ${count} cases\n`);
