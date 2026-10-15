'use strict';
const assert = require('assert');
const C = require('../lib/context');
let checks = 0; const failures = [];
function it(name, fn) { checks++; try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); } }
const block = '<!-- SSHLG:ROUTERS:BEGIN — managed -->\nrouting\n<!-- SSHLG:ROUTERS:END -->';
it('managed blocks are measured apart from operator text', () => {
  const m = C.measure('operator rule\n' + block + '\nmore');
  assert.equal(m.managedBytes, Buffer.byteLength(block));
  assert.equal(m.operatorBytes, m.bytes - m.managedBytes);
});
it('Codex over its default cap is an error finding', () => {
  const r = C.report([{ agent: 'codex', file: 'AGENTS.md', text: 'x'.repeat(40000) }], null);
  assert.equal(r.findings[0].severity, 'error'); assert.match(r.findings[0].message, /32768-byte/);
});
it('a top-level project_doc_max_bytes raises the cap; one inside a table does not', () => {
  assert.equal(C.codexCap('project_doc_max_bytes = 65536\n[x]\na=1\n').cap, 65536);
  assert.equal(C.codexCap('[profile]\nproject_doc_max_bytes = 65536\n').cap, 32768);
  const r = C.report([{ agent: 'codex', file: 'AGENTS.md', text: 'x'.repeat(40000) }], 'project_doc_max_bytes = 65536\n');
  assert.equal(r.findings.length, 0);
});
it('a long CLAUDE.md is a note, an absent host is reported absent', () => {
  const r = C.report([{ agent: 'claude', file: 'CLAUDE.md', text: 'l\n'.repeat(300) }, { agent: 'gemini', file: 'GEMINI.md', text: null }], null);
  assert.equal(r.findings[0].severity, 'note'); assert.equal(r.rows[1].present, false);
});
it('cap parsing accepts comments, underscores and quoted keys; an unreadable cap is a note', () => {
  assert.equal(C.codexCap('project_doc_max_bytes = 65536 # raised\n').cap, 65536);
  assert.equal(C.codexCap('project_doc_max_bytes=65_536\n[t]\n').cap, 65536);
  assert.equal(C.codexCap('"project_doc_max_bytes" = 65536\n').cap, 65536);
  assert.equal(C.codexCap('project_doc_max_bytes = "lots"\n').source, 'unparsed');
  const r = C.report([{ agent: 'codex', file: 'AGENTS.md', text: 'x'.repeat(40000) }], 'project_doc_max_bytes = "lots"\n');
  assert.ok(r.findings.every(f => f.severity === 'note'));
});
it('wait-rule and lower-case block ids count as hub-managed; unreadable files are reported, not thrown', () => {
  const t = '<!-- SSHLG:RULE:wait-is-not-a-stop:BEGIN -->\nw\n<!-- SSHLG:RULE:wait-is-not-a-stop:END -->';
  assert.equal(C.measure(t).managedBytes, Buffer.byteLength(t));
  const r = C.report([{ agent: 'gemini', file: 'G.md', text: null, error: 'EACCES' }], null);
  assert.equal(r.rows[0].error, 'EACCES'); assert.equal(r.findings[0].severity, 'error');
  assert.deepEqual(C.host('x', '/nonexistent/dir/file').text, null);
});
it('an unreadable config.toml and a shadowed AGENTS.md never raise a false error', () => {
  const big = 'x'.repeat(40000);
  assert.ok(C.report([{ agent: 'codex', file: 'AGENTS.md', text: big }], { error: 'EACCES' }).findings.every(f => f.severity === 'note'));
  assert.equal(C.report([{ agent: 'codex', file: 'AGENTS.md', text: big, shadowed: true }], null).findings.length, 0);
});
it('the routing registry total only falls (DOCMAP ratchet)', () => {
  const fs = require('fs'), path = require('path');
  const R = require('../lib/routers-registry.js');
  let total = 0;
  for (const entry of Object.values(R.REGISTRY)) for (const v of Object.values(entry)) if (typeof v === 'string') total += v.length;
  const m = /<!--\s*routing-registry-total:\s*(\d+)\s*-->/.exec(fs.readFileSync(path.join(__dirname, '..', 'docs', 'DOCMAP.md'), 'utf8'));
  assert.ok(m, 'docs/DOCMAP.md carries no routing-registry-total marker');
  const recorded = Number(m[1]);
  assert.ok(total <= recorded, `routing registry grew to ${total} characters, over the recorded ${recorded}: every host loads it before the first word`);
  if (total < recorded) console.log(`  record ${total} as the new routing-registry-total in docs/DOCMAP.md`);
});

if (failures.length) { failures.forEach(f => console.log('FAIL: ' + f)); console.log(`${failures.length} failure(s) out of ${checks} checks`); process.exit(1); }
console.log(`PASS: context — ${checks} checks`);
