#!/usr/bin/env node
'use strict';
// B-289: the live documents carry no em dash (U+2014) and no substitute for one.
//
// The operator's rule covers docs: "Any text a person reads (chat answers, messages,
// mail, posts, UI strings, docs, reports, handoffs, PR descriptions, captions) carries
// no em dash (U+2014) and no substitute (`--`, a spaced hyphen used as a dash)". It keeps
// the dash only in exact quotations, code, commands, paths and historical records.
// `test/person_text_test.js` holds the strings the launcher prints; this suite holds the
// Markdown a reader opens.
//
// The corpus is derived, never listed here. `LIVE_DOCS` in `test/validate.py` is the
// repository's live/dated split (its address gate enforces the live side), so this suite
// reads that tuple out of the validator's source. Two adjustments, each with its reason:
//   - an entry under `docs/evidence/` is dropped: that directory holds the dated records,
//     and a historical record stays as written (the rule's own exception);
//   - every `docs/working-rules/*.md` is added, discovered: CLAUDE.md applies them to
//     every task, so they are read as instructions today;
//   - `READER_DOCS` below is added: documents a contributor, a reporter or the next agent
//     opens as current guidance, which the address gate does not hold (B-289 follow-up).
// `docs/CLAUDE-CONTINUE.md` is Russian prose. The rule keeps a Russian dash only where the
// grammar requires it and no rewrite reads naturally; such a line goes into
// `RUSSIAN_DASH_ALLOWED` by its exact text, with the reason, and the list stays empty
// while every dash there could be rewritten.
// A generated page (first line `<!-- <tool>:generated ... do not hand-edit -->`, such as
// `docs/AGENT_SYNC.md`) is reported apart and not failed: a hand edit is lost on the next
// regeneration, so its dashes are fixed in the generator's template, not here.
//
// What is not prose, and so not checked, each with its reason:
//   - fenced code and inline code spans (code, commands, paths);
//   - blockquotes (in these documents a blockquote is a quotation of other text);
//   - text inside double quotes or guillemets on one line (an exact quotation);
//   - link targets, bare URLs, HTML tags and comments (addresses and markup, not text);
//   - a section whose heading begins with a date (a dated record kept inside a live file);
//   - the `PASS: <name> (U+2014) N cases` line `test/run.js` parses.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const ROOT = path.join(__dirname, '..');
const DASH = '—';
const PARSED_PASS = /PASS: [^\n]*? — \d+ (cases?|checks?)/g;
// A dash substitute: a spaced `--`, a spaced hyphen or a spaced en dash between words.
// `--flag`, `a-b`, `1–3`, list bullets and table rules have no word on both sides.
const SUBSTITUTE = /[\p{L}\p{N})\]*_'".,] (--|-|–) [\p{L}\p{N}(*_'"]/u;
const FENCE = /^\s*(`{3,}|~{3,})/;
const DATED_HEADING = /^(#{1,6})\s+\d{4}-\d{2}-\d{2}\b/;
const HEADING = /^(#{1,6})\s/;
const GENERATED = /^<!-- [\w-]+:generated\b.*do not hand-edit/;

/** Live documents outside `LIVE_DOCS` that a person reads as current (B-289 follow-up). */
const READER_DOCS = [
  'CONTRIBUTING.md', 'SECURITY.md', 'CODE_OF_CONDUCT.md',  // read by contributors and reporters
  'docs/CLAUDE-CONTINUE.md',                                 // the next agent's entry, in Russian
  'docs/ux/scenarios.md', 'docs/brand/terminology.md',      // the hub's own UX and brand pack
  'test/evals/README.md',                                    // how to run the routing eval
];

/**
 * Russian lines whose dash the grammar requires and no rewrite reads naturally, by exact
 * text, each with its reason. Empty: every dash in `docs/CLAUDE-CONTINUE.md` was rewritten.
 */
const RUSSIAN_DASH_ALLOWED = new Map([]);

/** The validator's live corpus, read out of its source so the two cannot diverge. */
function validatorLiveDocs(src) {
  const m = /^LIVE_DOCS\s*=\s*\(([^)]*)\)/m.exec(src);
  if (!m) return [];
  return Array.from(m[1].matchAll(/"([^"]+)"/g), (x) => x[1]);
}

function liveCorpus() {
  const declared = validatorLiveDocs(fs.readFileSync(path.join(ROOT, 'test', 'validate.py'), 'utf8'));
  const candidates = declared.filter((d) => !d.startsWith('docs/evidence/'));
  const rules = path.join(ROOT, 'docs', 'working-rules');
  for (const f of fs.readdirSync(rules).sort()) {
    if (f.endsWith('.md')) candidates.push(`docs/working-rules/${f}`);
  }
  for (const d of READER_DOCS) if (!candidates.includes(d)) candidates.push(d);
  const live = [];
  const generated = [];
  for (const d of candidates) {
    const first = fs.readFileSync(path.join(ROOT, d), 'utf8').split('\n', 1)[0];
    (GENERATED.test(first) ? generated : live).push(d);
  }
  return { declared, live, generated };
}

/** One line with everything that is not prose removed. */
function prose(line) {
  return line
    .replace(PARSED_PASS, '')
    .replace(/(`+)[\s\S]*?\1/g, '')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/"[^"]*"/g, '""')
    .replace(/“[^”]*”/g, '""')
    .replace(/«[^»]*»/g, '""');
}

/** `file:line  text` for every prose dash in a Markdown document. */
function offenders(text, label) {
  const out = [];
  let fence = null;
  let comment = false;
  let datedLevel = 0;
  text.split('\n').forEach((raw, i) => {
    const f = FENCE.exec(raw);
    if (fence) {
      if (f && f[1][0] === fence[0] && f[1].length >= fence.length) fence = null;
      return;
    }
    if (f) { fence = f[1]; return; }
    // Code spans first: a `<!--` quoted inside one opens no comment.
    let line = raw.replace(/(`+)[\s\S]*?\1/g, '');
    if (comment) {
      const end = line.indexOf('-->');
      if (end === -1) return;
      line = line.slice(end + 3);
      comment = false;
    }
    line = line.replace(/<!--[\s\S]*?-->/g, '');
    const open = line.indexOf('<!--');
    if (open !== -1) { line = line.slice(0, open); comment = true; }
    const h = HEADING.exec(line);
    if (h) {
      if (datedLevel && h[1].length <= datedLevel) datedLevel = 0;
      const d = DATED_HEADING.exec(line);
      if (!datedLevel && d) datedLevel = d[1].length;
    }
    if (datedLevel) return;
    if (/^\s*>/.test(line)) return;
    const p = prose(line);
    if (RUSSIAN_DASH_ALLOWED.has(raw.trim())) return;
    if (p.includes(DASH) || SUBSTITUTE.test(p)) out.push(`${label}:${i + 1}  ${raw.trim().slice(0, 100)}`);
  });
  return out;
}

// ---- negative controls: the scanner sees what it must, and only that ------------------

it('control: an em dash, a spaced hyphen, a spaced `--` and a spaced en dash in prose are caught', () => {
  assert.strictEqual(offenders('The gate runs — then it stops.', 'x').length, 1);
  assert.strictEqual(offenders('The gate runs - then it stops.', 'x').length, 1);
  assert.strictEqual(offenders('The gate runs -- then it stops.', 'x').length, 1);
  assert.strictEqual(offenders('The gate runs – then it stops.', 'x').length, 1);
  assert.strictEqual(offenders('| a cell — with a dash | b |', 'x').length, 1, 'a table cell is prose');
  assert.strictEqual(offenders('## A heading — with a dash', 'x').length, 1, 'a heading is prose');
});

it('control: code, quotations, addresses, markup and dated records are not prose', () => {
  assert.deepStrictEqual(offenders('Run `a — b` and `x -- y`.', 'x'), []);
  assert.deepStrictEqual(offenders('```\nlog — here\n```\nafter', 'x'), []);
  assert.deepStrictEqual(offenders('~~~sh\nrun -- now\n~~~', 'x'), []);
  assert.deepStrictEqual(offenders('> quoted — text', 'x'), []);
  assert.deepStrictEqual(offenders('It said *"one — two"* and «три — четыре».', 'x'), []);
  assert.deepStrictEqual(offenders('See [this](#routing--making-it) and https://a.b/c--d.', 'x'), []);
  assert.deepStrictEqual(offenders('<a id="x--y"></a><!-- a — b -->\n<!--\nc — d\n-->ok', 'x'), []);
  assert.deepStrictEqual(offenders('Use `--flag`, a-b, 1–3 and:\n- a bullet\n|---|---|', 'x'), []);
  assert.deepStrictEqual(offenders('PASS: injectors — 3 cases', 'x'), []);
  assert.deepStrictEqual(offenders('## 2026-09-03 · a record\nold — text\n### sub\nmore — old', 'x'), []);
});

it('control: a dated section ends at the next heading of its level, and fences close', () => {
  assert.strictEqual(offenders('## 2026-09-03 record\nold — text\n## Live\nnew — text', 'x').length, 1);
  assert.strictEqual(offenders('```\ncode\n```\nprose — here', 'x').length, 1);
  assert.strictEqual(offenders('````\n```\nstill code —\n```\n````\nprose — here', 'x').length, 1);
  assert.strictEqual(offenders('a `span` — then text', 'x').length, 1, 'a dash outside the span is prose');
  assert.strictEqual(offenders('"quoted" — then text', 'x').length, 1, 'a dash outside the quote is prose');
  assert.strictEqual(offenders('an unterminated `<!--` is refused\nlater — prose', 'x').length, 1,
    'a comment opener inside a code span hides nothing');
});

it('control: the corpus is derived from the validator and is not empty', () => {
  assert.deepStrictEqual(validatorLiveDocs('LIVE_DOCS = ("a.md", "b/c.md",\n "d.md")\n'), ['a.md', 'b/c.md', 'd.md']);
  assert.deepStrictEqual(validatorLiveDocs('NOTHING = ()\n'), []);
  const { declared, live } = liveCorpus();
  assert.ok(declared.includes('README.md'), `LIVE_DOCS no longer parses out of test/validate.py: ${declared}`);
  assert.ok(live.length >= 8, `only ${live.length} live documents: the corpus lost its files`);
  assert.ok(GENERATED.test('<!-- agent-sync:generated source=x at=y (regenerate), do not hand-edit -->'));
  assert.ok(!GENERATED.test('# A heading that says generated, do not hand-edit'), 'only a first-line marker exempts');
  for (const doc of live) assert.ok(fs.existsSync(path.join(ROOT, doc)), `${doc} is in the corpus and absent`);
  for (const doc of READER_DOCS) assert.ok(live.includes(doc), `${doc} is listed for the scan and not read`);
});

// ---- the rule ------------------------------------------------------------------------

it('no live document carries an em dash or a dash substitute in prose', () => {
  const found = [];
  for (const doc of liveCorpus().live) {
    found.push(...offenders(fs.readFileSync(path.join(ROOT, doc), 'utf8'), doc));
  }
  assert.deepStrictEqual(found, [],
    `${found.length} prose dash(es) in live documents; use a full stop, comma, colon or parentheses`);
});

const corpus = liveCorpus();
if (corpus.generated.length) {
  console.log(`  generated, fixed at their generator: ${corpus.generated.join(', ')}`);
}

if (require.main === module && process.argv[2] === '--list') {
  for (const doc of corpus.live) {
    for (const o of offenders(fs.readFileSync(path.join(ROOT, doc), 'utf8'), doc)) console.log(o);
  }
  process.exit(0);
}

if (failures.length) {
  for (const f of failures) console.log(`FAIL: ${f}`);
  process.exit(1);
}
console.log(`PASS: live_docs_text — ${checks} cases`);
