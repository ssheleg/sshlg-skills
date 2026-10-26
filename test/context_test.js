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
// B-212: Codex 0.163 reads the global AGENTS.md in full (codex-home/src/instructions);
// project_doc_max_bytes caps only the project chain, combined (core/src/agents_md.rs).
const P = (file, text) => ({ agent: 'codex', scope: 'project', file, text });
it('Codex project files over the default cap, combined, are an error finding', () => {
  const r = C.report([P('/r/AGENTS.md', 'x'.repeat(20000)), P('/r/a/AGENTS.md', 'y'.repeat(20000))], null);
  const e = r.findings.filter(f => f.severity === 'error');
  assert.equal(e.length, 1, JSON.stringify(r.findings)); assert.match(e[0].message, /32768-byte/); assert.match(e[0].message, /40000 bytes/);
  assert.match(e[0].message, /\/r\/a\/AGENTS\.md/, 'names the file the cap cuts');
});
it('the global Codex AGENTS.md has no cap: a large one raises no error', () => {
  const r = C.report([{ agent: 'codex', file: 'AGENTS.md', text: 'x'.repeat(40000) }], null);
  assert.ok(r.findings.every(f => f.severity !== 'error'), JSON.stringify(r.findings));
  assert.equal(r.rows[0].cap, undefined);
});
it('a CLAUDE.md over 40,000 characters is a note naming that limit', () => {
  const r = C.report([{ agent: 'claude', file: 'CLAUDE.md', text: 'x'.repeat(40001) }], null);
  assert.ok(r.findings.some(f => f.severity === 'note' && /40,000 characters/.test(f.message)), JSON.stringify(r.findings));
  assert.ok(!C.report([{ agent: 'claude', file: 'CLAUDE.md', text: 'x'.repeat(40000) }], null).findings.some(f => /40,000/.test(f.message)));
});
it('the Codex project chain runs from the nearest .git to cwd, override first in each directory', () => {
  const fs = require('fs'), os = require('os'), path = require('path');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-')); const w = (f, t) => { fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true }); fs.writeFileSync(path.join(root, f), t); };
  try {
    w('repo/.git/HEAD', 'ref'); w('repo/AGENTS.md', 'r'); w('repo/a/AGENTS.override.md', 'o'); w('repo/a/AGENTS.md', 'm'); w('AGENTS.md', 'outside'); fs.mkdirSync(path.join(root, 'repo/a/b'));
    assert.deepEqual(C.codexProjectFiles(path.join(root, 'repo/a/b')), [path.join(root, 'repo/AGENTS.md'), path.join(root, 'repo/a/AGENTS.override.md')]);
    w('loose/AGENTS.md', 'l'); w('loose/sub/AGENTS.md', 's');
    assert.deepEqual(C.codexProjectFiles(path.join(root, 'loose/sub')), [path.join(root, 'loose/sub/AGENTS.md')], 'no .git: only cwd');
    w('repo/CLAUDE.md', 'c'); w('repo/a/.claude/CLAUDE.md', 'd'); w('repo/a/CLAUDE.local.md', 'e');
    const cl = C.claudeProjectFiles(path.join(root, 'repo/a/b'), []);
    for (const f of ['repo/CLAUDE.md', 'repo/a/.claude/CLAUDE.md', 'repo/a/CLAUDE.local.md']) assert.ok(cl.includes(path.join(root, f)), f + ' ' + cl);
    assert.ok(!C.claudeProjectFiles(path.join(root, 'repo'), [path.join(root, 'repo/CLAUDE.md')]).includes(path.join(root, 'repo/CLAUDE.md')), 'a file already measured is not counted twice');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
it('a top-level project_doc_max_bytes raises the cap; one inside a table does not', () => {
  assert.equal(C.codexCap('project_doc_max_bytes = 65536\n[x]\na=1\n').cap, 65536);
  assert.equal(C.codexCap('[profile]\nproject_doc_max_bytes = 65536\n').cap, 32768);
  const r = C.report([P('AGENTS.md', 'x'.repeat(40000))], 'project_doc_max_bytes = 65536\n');
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
  const r = C.report([P('AGENTS.md', 'x'.repeat(40000))], 'project_doc_max_bytes = "lots"\n');
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
  assert.ok(C.report([P('AGENTS.md', big)], { error: 'EACCES' }).findings.every(f => f.severity === 'note'));
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
