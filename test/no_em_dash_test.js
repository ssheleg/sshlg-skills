#!/usr/bin/env node
'use strict';
// B-226. The operator's rule of 2026-10-18: text a person reads carries no em dash
// (U+2014) and no substitute for one (`--`, a spaced hyphen used as a dash). 1.66.0 put
// the rule in the PROTOCOL region and took the dash out of that region only; the router
// sections, the heading, the block's opening comment, a table cell, the Cursor rule's
// description and the wait rule kept theirs.
//
// Everything here runs the REAL writer (`bin/sshlg-skills.js routers`, `rules`) against a
// sandbox HOME holding all five hosts, never the operator's. Three things are proved:
//
//   1. nothing the hub renders into an operator file carries the dash or a substitute
//      (every host file is scanned, so a new rendered string cannot bring it back);
//   2. a block the previous release (1.80.0) wrote, on a machine with NO rendered record,
//      is reworded by `routers --update` with nothing kept as a hand edit, because the old
//      packaged lines are passed to the B-202 guard as the pack's own;
//   3. a section the operator really edited is still kept, recorded as authored, and
//      reported as drift; the others are reworded around it.
//
// The previous wording comes from `test/fixtures/routers-registry-1.80.0.js`, a verbatim
// copy of `lib/routers-registry.js` at 1.80.0 (git blob 48d8fde2), not from the module
// under test, so the guard is checked against what really shipped.
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const R = require('../lib/routers.js');
const registry = require('../lib/routers-registry.js');
const cursor = require('../lib/cursor.js');
const T = require('../lib/wait-rule-text.js');
const OLD = require('./fixtures/routers-registry-1.80.0.js');

const EM = '—';
const BIN = path.join(__dirname, '..', 'bin', 'sshlg-skills.js');
let checks = 0;
const failures = [];
function it(name, fn) { checks += 1; try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); } }

const made = [];
const tmp = (p) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), p)); made.push(d); return d; };
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const HOST_VARS = ['CLAUDE_CONFIG_DIR', 'CODEX_HOME', 'GEMINI_CLI_HOME', 'PI_CODING_AGENT_DIR'];
function run(home, args) {
  const env = Object.assign({}, process.env, { HOME: home, FABRIC_SERVICES_DIR: path.join(home, 'fabric-services') });
  for (const k of HOST_VARS) delete env[k]; // the sandbox is the only place this may write
  const r = spawnSync(process.execPath, [BIN].concat(args), { encoding: 'utf8', env });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
const FILES = (h) => ({
  claude: path.join(h, '.claude', 'CLAUDE.md'),
  codex: path.join(h, '.codex', 'AGENTS.md'),
  gemini: path.join(h, '.gemini', 'GEMINI.md'),
  pi: path.join(h, '.pi', 'agent', 'AGENTS.md'),
  cursor: path.join(h, '.cursor', 'rules', cursor.FILENAME),
  cursorWait: path.join(h, '.cursor', 'rules', 'sshlg-wait.mdc'),
});
const ROUTED = ['claude', 'codex', 'gemini', 'pi', 'cursor'];
// Every host present, Fabric present (so the fabric section renders too), consent on
// record, the wait rule on and applied: the widest set of text the hub can write.
function sandbox() {
  const h = tmp('sshlg-b226-');
  for (const d of ['.claude', '.codex', '.gemini', path.join('.pi', 'agent'), path.join('.cursor', 'rules'), '.sshlg-skills', 'fabric-services']) {
    fs.mkdirSync(path.join(h, d), { recursive: true });
  }
  fs.writeFileSync(path.join(h, '.sshlg-skills', 'state.json'), JSON.stringify({ routers: 'yes' }) + '\n');
  fs.writeFileSync(FILES(h).claude, '# mine\n\nprose the operator wrote\n');
  let r = run(h, ['routers']);
  assert.strictEqual(r.code, 0, r.out);
  r = run(h, ['config', 'set', 'rules.wait', 'on']);
  assert.strictEqual(r.code, 0, r.out);
  r = run(h, ['rules', '--apply']);
  assert.strictEqual(r.code, 0, r.out);
  return h;
}
const read = (f) => fs.readFileSync(f, 'utf8');
const record = (h) => path.join(h, '.sshlg-skills', 'routers-rendered.json');
const authored = (h) => {
  try { return JSON.parse(read(path.join(h, '.sshlg-skills', 'config.json'))).authored || {}; }
  catch (e) { return {}; }
};
const sectionOf = (text, name) => {
  const m = new RegExp(`<!-- SSHLG:ROUTER:${name}:BEGIN -->\\n([\\s\\S]*?)\\n<!-- SSHLG:ROUTER:${name}:END -->`).exec(text);
  return m ? m[1] : null;
};

// The text a person reads: HTML comment syntax and code spans are syntax, not prose.
function prose(text) {
  return String(text)
    .replace(/<!--|-->/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]*`/g, ' ');
}
function dashes(text) {
  const out = [];
  String(text).split('\n').forEach((line, i) => {
    if (line.includes(EM)) out.push(`${i + 1}: U+2014 in ${JSON.stringify(line.slice(0, 90))}`);
    const p = prose(line);
    if (/\s--\s/.test(p)) out.push(`${i + 1}: "--" as a dash in ${JSON.stringify(line.slice(0, 90))}`);
    if (/\S\s-\s\S/.test(p)) out.push(`${i + 1}: spaced hyphen as a dash in ${JSON.stringify(line.slice(0, 90))}`);
  });
  return out;
}

// 1.80.0's chrome, as it sits in every operator file today.
const OLD_OPENER = `${R.BEGIN} ${EM} managed by sshlg-skills. To opt out: replace this whole block\n     with a single SSHLG:ROUTERS:OPTOUT comment line. -->`;
const OLD_HEADING = `## Work routing ${EM} the ssheleg family`;
const OLD_DESCRIPTION = `Work routing for the ssheleg family ${EM} the member map, entry points and the rules ` +
  'for when each skill is required. Managed by sshlg-skills.';

/** Turn a current file back into what 1.80.0 wrote: old sections, old cell, old chrome. */
function toPrevious(text) {
  let out = text;
  for (const name of registry.order()) {
    const now = sectionOf(out, name);
    if (now === null) continue;
    assert.strictEqual(now, registry.REGISTRY[name].text, `${name}: the fixture expects the packaged text`);
    out = out.replace(R.sectionRaw(name, now), () => R.sectionRaw(name, OLD.REGISTRY[name].text));
  }
  for (const name of registry.order()) {
    for (const cell of ['answers', 'when']) {
      const now = registry.REGISTRY[name][cell];
      const was = OLD.REGISTRY[name][cell];
      if (now !== was) out = out.replace(`| \`${name}\` | ${cell === 'answers' ? now : registry.REGISTRY[name].answers}`, `| \`${name}\` | ${cell === 'answers' ? was : registry.REGISTRY[name].answers}`);
    }
  }
  out = out.replace(R.OPENER, () => OLD_OPENER).replace(R.HEADING, () => OLD_HEADING);
  out = out.replace(`description: ${cursor.DESCRIPTION}`, () => `description: ${OLD_DESCRIPTION}`);
  return out;
}

// ---------------------------------------------------------------- the packaged text

it('the 1.80.0 fixture is the wording that shipped (it still carries the dash)', () => {
  const total = registry.order().reduce((n, name) => n + OLD.REGISTRY[name].text.split(EM).length - 1, 0);
  assert.strictEqual(total, 23, `${total} em dashes in the fixture: it is not the 1.80.0 registry`);
  assert.deepStrictEqual(Object.keys(OLD.REGISTRY), registry.order(), 'the fixture lists other routers');
});

it('every router section, cell, the heading, opener and Cursor description carry no dash', () => {
  const bad = [];
  for (const name of registry.order()) {
    const e = registry.REGISTRY[name];
    for (const [what, s] of [['text', e.text], ['answers', e.answers], ['when', e.when]]) {
      dashes(s).forEach((d) => bad.push(`${name}.${what} ${d}`));
    }
  }
  for (const [what, s] of [['HEADING', R.HEADING], ['OPENER', R.OPENER], ['cursor.DESCRIPTION', cursor.DESCRIPTION], ['wait BODY', T.BODY]]) {
    dashes(s).forEach((d) => bad.push(`${what} ${d}`));
  }
  assert.deepStrictEqual(bad, []);
});

it('the rewording is punctuation only: the words of every router are the words 1.80.0 shipped', () => {
  // Meaning, boundaries, refusal phrases and neighbour statements stay exactly as they
  // were. Strip punctuation and case; what is left must be identical word for word.
  const words = (s) => String(s).toLowerCase().replace(/[—:,.()*;]/g, ' ').split(/\s+/).filter(Boolean).join(' ');
  for (const name of registry.order()) {
    assert.strictEqual(words(registry.REGISTRY[name].text), words(OLD.REGISTRY[name].text), `${name}: words changed`);
    assert.strictEqual(words(registry.REGISTRY[name].answers), words(OLD.REGISTRY[name].answers), `${name}: answers changed`);
    assert.strictEqual(registry.REGISTRY[name].when, OLD.REGISTRY[name].when, `${name}: when changed`);
  }
  assert.strictEqual(words(R.HEADING), words(OLD_HEADING));
  assert.strictEqual(words(cursor.DESCRIPTION), words(OLD_DESCRIPTION));
  assert.strictEqual(words(T.BODY), words(T.PREVIOUS['wait-v2']));
});

it('the old heading and opener are recognised as legacy aliases', () => {
  assert.ok(R.LEGACY_HEADINGS.includes(OLD_HEADING), 'the 1.80.0 heading is not a legacy alias');
  assert.ok(R.LEGACY_OPENERS.includes(OLD_OPENER), 'the 1.80.0 opener is not a legacy alias');
  assert.ok(R.LEGACY_HEADINGS.includes('## Роутинг работы — семья ssheleg'), 'the Russian alias was dropped');
});

// ---------------------------------------------------------------- the real writer

it('regression: no file the hub writes on any host carries U+2014 or a substitute', () => {
  const h = sandbox();
  const files = FILES(h);
  const bad = [];
  for (const [host, f] of Object.entries(files)) {
    assert.ok(fs.existsSync(f), `${host}: ${f} was not written`);
    const text = read(f);
    // Only the hub's own text is judged; the operator's prose above it is theirs.
    const own = host === 'claude' ? text.slice(text.indexOf(R.BEGIN)) : text;
    dashes(own).forEach((d) => bad.push(`${host} ${d}`));
  }
  assert.ok(read(files.claude).includes(T.BEGIN), 'the wait rule was not applied: half the surface is unscanned');
  assert.ok(read(files.claude).includes('<!-- SSHLG:ROUTER:fabric:BEGIN -->'), 'the fabric section was not rendered');
  assert.deepStrictEqual(bad, []);
});

it('(1) a 1.80.0 block with no rendered record is reworded and nothing is kept', () => {
  const h = sandbox();
  const files = FILES(h);
  const fresh = {};
  for (const host of ROUTED) fresh[host] = read(files[host]);
  for (const host of ROUTED) {
    const old = toPrevious(fresh[host]);
    assert.ok(old.split(EM).length - 1 >= 25, `${host}: the fixture did not rebuild the 1.80.0 block`);
    fs.writeFileSync(files[host], old);
  }
  fs.rmSync(record(h));
  const r = run(h, ['routers', '--update']);
  assert.strictEqual(r.code, 0, r.out);
  assert.ok(!/holds text the pack did not write/.test(r.out), `a packaged line was kept as a hand edit:\n${r.out}`);
  for (const host of ROUTED) assert.strictEqual(read(files[host]), fresh[host], `${host}: not reworded to the current text`);
  assert.deepStrictEqual(authored(h), {}, 'packaged wording was recorded as the operator\'s');
});

it('(2) a hand-edited section is kept and reported; every other section is reworded', () => {
  const h = sandbox();
  const files = FILES(h);
  const fresh = read(files.claude);
  const mine = OLD.REGISTRY['sheleg-dev'].text.replace('or count revenue twice.', 'or count revenue twice. My own line.');
  const old = toPrevious(fresh).replace(R.sectionRaw('sheleg-dev', OLD.REGISTRY['sheleg-dev'].text), () => R.sectionRaw('sheleg-dev', mine));
  assert.notStrictEqual(old, toPrevious(fresh), 'the hand edit did not land');
  fs.writeFileSync(files.claude, old);
  fs.rmSync(record(h));
  const r = run(h, ['routers', '--update']);
  assert.strictEqual(r.code, 0, r.out);
  const after = read(files.claude);
  assert.strictEqual(sectionOf(after, 'sheleg-dev'), mine, 'the operator\'s section was replaced');
  assert.ok(/section "sheleg-dev" holds text the pack did not write/.test(r.out), `not reported:\n${r.out}`);
  assert.ok(!/section "(?!sheleg-dev)[a-z-]+" holds text/.test(r.out), `another section was kept:\n${r.out}`);
  assert.ok(/расходится с пакетным: sheleg-dev/.test(r.out), `drift not reported:\n${r.out}`);
  assert.deepStrictEqual(Object.keys(authored(h)), ['sheleg-dev'], 'the kept section is not recorded as authored');
  assert.strictEqual(after, fresh.replace(R.sectionRaw('sheleg-dev', registry.REGISTRY['sheleg-dev'].text), () => R.sectionRaw('sheleg-dev', mine)),
    'the rest of the block is not the current text');
});

it('(3) three real runs after the rewording leave every host file byte-identical', () => {
  const h = sandbox();
  const files = FILES(h);
  for (const host of ROUTED) fs.writeFileSync(files[host], toPrevious(read(files[host])));
  fs.rmSync(record(h));
  const hashes = [];
  for (let i = 0; i < 3; i++) {
    const r = run(h, ['routers', '--update']);
    assert.strictEqual(r.code, 0, r.out);
    hashes.push(Object.values(files).map(sha).join(','));
  }
  assert.ok(hashes[0] === hashes[1] && hashes[1] === hashes[2], 'a run changed a file again');
});

it('(5) the 1.80.0 heading and opener are rewritten, the operator\'s prose is not', () => {
  const h = sandbox();
  const f = FILES(h).claude;
  const fresh = read(f);
  fs.writeFileSync(f, fresh.replace(R.HEADING, () => OLD_HEADING).replace(R.OPENER, () => OLD_OPENER));
  const r = run(h, ['routers', '--update']);
  assert.strictEqual(r.code, 0, r.out);
  const after = read(f);
  assert.strictEqual(after, fresh);
  assert.ok(after.startsWith('# mine\n\nprose the operator wrote\n'), 'operator text changed');
});

for (const d of made) fs.rmSync(d, { recursive: true, force: true });
if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`PASS: no em dash in rendered text (B-226) — ${checks} cases`);
