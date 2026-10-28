#!/usr/bin/env node
'use strict';
// B-278: text a person reads carries no em dash (U+2014) and no substitute for one.
//
// The operator's rule covers every line the launcher and its hooks print: console logs,
// refusal messages, report headers, notices handed to a session. Those strings are the
// string literals of bin/, lib/ and hooks/, so this suite reads every literal (template
// text included) and fails on an em dash a person would read. Comments are code
// documentation and are not read.
//
// Scanning every literal, rather than only the arguments of `log(` and friends, is the
// stricter choice on purpose: report builders (`lines.push`, `out.push`), tables of
// notices and refusal reasons reach the console through a variable, and a sink list
// would miss each of them the day it was written.
//
// What is allowed, each with its reason:
//   - a dash that is DATA: both neighbours are regex or list punctuation (a character
//     class such as `[\s\-–(U+2014),:;]`, or an alternation `|(U+2014)|`), which matches dashes in
//     input and prints nothing;
//   - historical records the hub must recognise byte for byte in operator files
//     (`PREVIOUS_LINES`, `PREVIOUS_CELLS`, the 1.69 map heading);
//   - the `PASS: <name> (U+2014) N cases` line `test/run.js` parses.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { literals } = require('./lib_jsstrings.js');
const registry = require('../lib/routers-registry.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const ROOT = path.join(__dirname, '..');
const DASH = '\u2014';
const DATA_NEIGHBOUR = /[\[\]|–\-,:;\\/()?]/;

/**
 * Historical records: a top-level constant whose name says it holds what an older
 * release wrote (`PREVIOUS_LINES`, `LEGACY_OPENERS`, `MAP_1_69`, `PROTOCOL_1_75`). The
 * hub recognises those bytes in operator files to migrate them, so they stay as written.
 */
const HISTORICAL_DECL = /^(PREVIOUS|LEGACY)|_\d+_\d+$/;

/** The literal as it prints: `\u2014` escapes decoded, other escapes left alone. */
function printed(text) {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (m, hex) => String.fromCharCode(parseInt(hex, 16)));
}

const PARSED_PASS = /^PASS: [^\n]* \u2014 \d+ (cases?|checks?)$/;

/** Offsets of em dashes a person would read in one literal's text. */
function personDashes(text) {
  if (PARSED_PASS.test(text)) return [];
  const out = [];
  for (let i = text.indexOf(DASH); i !== -1; i = text.indexOf(DASH, i + 1)) {
    const before = text[i - 1];
    const after = text[i + 1];
    const data = before !== undefined && after !== undefined
      && DATA_NEIGHBOUR.test(before) && DATA_NEIGHBOUR.test(after);
    if (!data) out.push(i);
  }
  return out;
}

/** `file:line  "…context…"` for every person-facing em dash in `src`. */
function offenders(src, label) {
  const out = [];
  for (const l of literals(src)) {
    if (HISTORICAL_DECL.test(l.decl)) continue;
    const text = printed(l.text);
    for (const at of personDashes(text)) {
      out.push(`${label}:${l.line}  ${JSON.stringify(text.slice(Math.max(0, at - 30), at + 30))}`);
    }
  }
  return out;
}

function sources() {
  const files = [];
  for (const dir of ['bin', 'lib', 'hooks']) {
    for (const f of fs.readdirSync(path.join(ROOT, dir)).sort()) {
      if (f.endsWith('.js')) files.push(path.join(dir, f));
    }
  }
  return files;
}

// ---- negative controls: the scanner sees what it must, and only that ------------------

it('control: a dash in a log line, a thrown Error and a template part is caught', () => {
  assert.strictEqual(offenders("log('update: refused \u2014 lock held');", 'x').length, 1);
  assert.strictEqual(offenders("throw new Error(`bad ${x} \u2014 fix it`);", 'x').length, 1);
  assert.strictEqual(offenders("const lines = []; lines.push('none \u2014 nothing here');", 'x').length, 1);
  assert.strictEqual(offenders("say('deny', \"refused \u2014 \" + why);", 'x').length, 1);
});

it('control: comments, regex literals and regex character classes are not text', () => {
  assert.deepStrictEqual(offenders("// a comment \u2014 with a dash\n/* and \u2014 this */ log('ok');", 'x'), []);
  assert.deepStrictEqual(offenders("const re = /a \u2014 b/; log('ok');", 'x'), []);
  assert.deepStrictEqual(offenders("const gap = '[\\\\s\\\\-–\u2014,:;]+'; const alt = '(?:,|\u2014|–)';", 'x'), []);
});

it('control: the parsed PASS line and a historical record are allowed, a new line is not', () => {
  assert.deepStrictEqual(offenders("console.log(`PASS: injectors \u2014 ${n} checks`);", 'x').length, 1,
    'a template PASS line is split by its expression; only a literal whole line is the parsed format');
  assert.deepStrictEqual(offenders("console.log('PASS: injectors \u2014 3 checks');", 'x'), []);
  const old = registry.PREVIOUS_LINES['super-ux'][0];
  assert.ok(old.includes(DASH), 'the fixture needs a historical line that carries the dash');
  assert.deepStrictEqual(offenders(`const PREVIOUS_LINES = { a: [${JSON.stringify(old)}] };`, 'x'), []);
  assert.deepStrictEqual(offenders("const MAP_1_69 = ['old \\u2014 text'];", 'x'), []);
  assert.strictEqual(offenders("const y = 'new text \u2014 written today';", 'x').length, 1);
  assert.strictEqual(offenders("const z = 'escaped \\u2014 dash';", 'x').length, 1, 'an escaped dash prints too');
  assert.strictEqual(offenders("const MAP = 'current text'; log('after \u2014 it');", 'x').length, 1,
    'the declaration ends at its semicolon');
  assert.strictEqual(offenders("const PREVIOUS = 1;\nlog('after \u2014 it');", 'x').length, 1,
    'a historical declaration does not cover the statements after it');
});

it('control: the corpus is not empty', () => {
  const files = sources();
  assert.ok(files.length > 50, `only ${files.length} source files found`);
  const n = files.reduce((acc, f) => acc + literals(fs.readFileSync(path.join(ROOT, f), 'utf8')).length, 0);
  assert.ok(n > 5000, `only ${n} literals read: the tokenizer lost the corpus`);
});

// ---- the rule ------------------------------------------------------------------------

it('no string in bin/, lib/ or hooks/ carries an em dash a person would read', () => {
  const found = [];
  for (const f of sources()) found.push(...offenders(fs.readFileSync(path.join(ROOT, f), 'utf8'), f));
  assert.deepStrictEqual(found, [],
    `${found.length} em dash(es) in person-facing text; use a full stop, comma, colon or parentheses`);
});

it('no person-facing string uses a dash substitute (" -- " or a spaced hyphen as a dash)', () => {
  // Only the spaced forms after a lower-case word: `--flag`, `a-b`, ranges and list
  // bullets are code, and so is the argument separator after a placeholder
  // (`run NAME -- COMMAND`) or an upper-case marker matched in input.
  const SUBSTITUTE = /[a-zа-яё)\]`'"] (--|-) [A-Za-zА-Яа-яЁё(`'"]/;
  const found = [];
  for (const f of sources()) {
    for (const l of literals(fs.readFileSync(path.join(ROOT, f), 'utf8'))) {
      if (HISTORICAL_DECL.test(l.decl)) continue;
      if (SUBSTITUTE.test(l.text)) found.push(`${f}:${l.line}  ${JSON.stringify(l.text.slice(0, 90))}`);
    }
  }
  assert.deepStrictEqual(found, [], `${found.length} dash substitute(s) in person-facing text`);
});

// ---- B-290: the public site's builders -------------------------------------------------
//
// `scripts/site.js` and `scripts/og-card.js` write the public site and its social card, and
// their own messages reach whoever builds it. Decided 2026-10-27: a string the hub wrote
// carries no em dash; member wording quoted on the site stays verbatim, because it is a
// quotation of the member's text (it arrives from the member's SKILL.md at build time, never
// as a literal here, so this scan cannot reach it). Only the em-dash rule is applied: the
// pages embed browser JavaScript whose `a - b` is arithmetic, not a dash substitute.
const SITE_SCRIPTS = ['scripts/site.js', 'scripts/og-card.js'];

/**
 * Literals that hold an em dash as DATA, by file and declaration, each with its reason.
 * Kept short on purpose; a new entry needs a reason a reviewer can check.
 */
const SITE_DATA = {
  // The 5x7 font's fold table: the dash is a key it maps to '-', the glyph it draws.
  'scripts/og-card.js': new Set(['FOLD']),
};

function siteOffenders(src, file) {
  const allowed = SITE_DATA[file] || new Set();
  return offenders(src, file).filter((o) => {
    const line = Number(/:(\d+) /.exec(o)[1]);
    const lit = literals(src).find((l) => l.line === line);
    return !(lit && allowed.has(lit.decl));
  });
}

it('B-290 control: the site scripts are read, and a new dash in them is caught', () => {
  for (const f of SITE_SCRIPTS) {
    const n = literals(fs.readFileSync(path.join(ROOT, f), 'utf8')).length;
    assert.ok(n > 30, `${f}: only ${n} literals read`);
  }
  assert.strictEqual(siteOffenders("throw new Error('built — now');", 'scripts/site.js').length, 1);
  assert.strictEqual(siteOffenders("const FOLD = new Map(Object.entries({ '—': '-' }));", 'scripts/og-card.js').length, 0);
  assert.strictEqual(siteOffenders("const FOLD = new Map(Object.entries({ '—': '-' }));", 'scripts/site.js').length, 1,
    'the allowance is per file');
});

it('B-290: no hub-authored string in scripts/site.js or scripts/og-card.js carries an em dash', () => {
  const found = [];
  for (const f of SITE_SCRIPTS) found.push(...siteOffenders(fs.readFileSync(path.join(ROOT, f), 'utf8'), f));
  assert.deepStrictEqual(found, [],
    `${found.length} em dash(es) in the site builders' own text; use a full stop, comma, colon or parentheses`);
});

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
