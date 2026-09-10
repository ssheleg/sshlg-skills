#!/usr/bin/env node
'use strict';
// Fixtures for the closure of the wired runtime — FIX-RT-01.
//
// The runtime is not the package. It is a COPY of `hooks/` and `lib/` plus a
// couple of flat files, and the hooks in `settings.json` point at that copy, so
// the copy is the thing that runs. A module can therefore be perfectly correct
// in the package and unloadable where it executes, and nothing says so: hooks
// fail silent by design, so the failure is an absence, not a message.
//
// That is exactly what shipped in v1.48.0. `lib/updaterun.js` opened with
// `require('../package.json')` to learn the running version — resolvable from the
// package, resolvable from nothing in the runtime. The module threw at load, so
// the unattended update the release existed to ship never ran once, on any
// machine, and the session-start surface that reports it stayed empty.
//
// Measured on this machine 2026-09-10, against the runtime the hooks were wired
// to: 21 relative requires across the wired tree, 1 dangling — the new feature.
//
// The invariant is not "package.json is copied". It is that EVERY relative
// require in a runtime-managed file resolves inside a synced runtime, so the next
// module that reaches out of the copied trees is refused here rather than
// discovered by an operator wondering why nothing happens.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const R = require('../lib/runtime.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const PKG = path.join(__dirname, '..');

/**
 * Source with comments removed, so a require NAMED in prose is not read as one.
 *
 * The first version of this guard scanned raw text and reported `lib/runtime.js`
 * as dangling — on the strength of a sentence in its own header explaining the
 * defect being fixed. That is this repository's oldest guard defect, already paid
 * for once in `lib/hygiene.js`: a guard reads what would RUN, not what a payload
 * contains. String literals are KEPT, because `require('./x')` inside a string is
 * still a thing a module can hand to something that runs it.
 */
function stripComments(src) {
  let out = '';
  let i = 0;
  let quote = null;
  while (i < src.length) {
    const c = src[i];
    const d = src[i + 1];
    if (quote) {
      out += c;
      if (c === '\\') { out += d === undefined ? '' : d; i += 2; continue; }
      if (c === quote) quote = null;
      i += 1;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { quote = c; out += c; i += 1; continue; }
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') i += 1; continue; }
    if (c === '/' && d === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}

/** Relative `require(...)` targets that would actually be resolved. */
function relRequires(src) {
  return [...stripComments(src).matchAll(/require\((['"])(\.[^'"]+)\1\)/g)].map((m) => m[2]);
}

/** Every dangling relative require under `root`, as `file -> target` strings. */
function dangling(root) {
  const out = [];
  const walk = (dir) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const e of entries) {
      if (e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (!e.name.endsWith('.js')) continue;
      const src = fs.readFileSync(full, 'utf8');
      for (const rel of relRequires(src)) {
        const target = path.resolve(path.dirname(full), rel);
        if (!fs.existsSync(target) && !fs.existsSync(`${target}.js`)) {
          out.push(`${path.relative(root, full)} -> ${rel}`);
        }
      }
    }
  };
  walk(root);
  return out;
}

function syncedRuntime() {
  const rt = fs.mkdtempSync(path.join(os.tmpdir(), 'rtclose-'));
  fs.rmSync(rt, { recursive: true, force: true });
  R.sync(PKG, rt, { create: true });
  return rt;
}

it('THE WIRED RUNTIME CAN LOAD EVERY MODULE IT CARRIES', () => {
  const rt = syncedRuntime();
  const bad = dangling(rt);
  assert.deepStrictEqual(bad, [], `dangling requires in the synced runtime: ${bad.join(', ')}`);
  fs.rmSync(rt, { recursive: true, force: true });
});

it('THE CHECK IS READING A REAL TREE — it found the modules to check', () => {
  const rt = syncedRuntime();
  const files = R.managedFiles(PKG).filter((f) => f.endsWith('.js'));
  // A guard that silently examines nothing passes everything. This is the
  // repository's own recurring defect class, so the corpus is asserted non-trivial
  // and the scan is asserted to have SEEN requires, not merely to have found none
  // broken.
  assert.ok(files.length >= 20, `expected the managed js set to be substantial, got ${files.length}`);
  let seen = 0;
  for (const rel of files) seen += relRequires(fs.readFileSync(path.join(rt, rel), 'utf8')).length;
  assert.ok(seen >= 15, `expected the scan to resolve many requires, saw ${seen}`);
  fs.rmSync(rt, { recursive: true, force: true });
});

it('A REQUIRE NAMED IN A COMMENT IS NOT A REQUIRE — and a real one beside it still is', () => {
  const rt = syncedRuntime();
  // Both halves in ONE file, because a scanner that reports neither would pass a
  // test that only asserted the comment is ignored.
  fs.writeFileSync(path.join(rt, 'lib', 'plant2.js'),
    "'use strict';\n"
    + "// This module used to call require('../gone-from-prose.js') and no longer does.\n"
    + "/* Nor require('../also-gone.js'), which is discussed here and not called. */\n"
    + "const real = require('../still-missing.js');\n"
    + "module.exports = real;\n");
  const bad = dangling(rt).filter((b) => b.includes('plant2.js'));
  assert.deepStrictEqual(bad, ['lib/plant2.js -> ../still-missing.js'],
    `only the executed require may be reported, got: ${bad.join(', ')}`);
  fs.rmSync(rt, { recursive: true, force: true });
});

it('NEGATIVE: a module reaching outside the copied trees is REFUSED', () => {
  const rt = syncedRuntime();
  // The v1.48.0 defect, reintroduced by hand: a lib module asking for a file that
  // exists in the package and is not part of the managed set.
  fs.writeFileSync(path.join(rt, 'lib', 'plant.js'),
    "'use strict';\nconst x = require('../README.md');\nmodule.exports = x;\n");
  const bad = dangling(rt);
  assert.ok(bad.some((b) => b.includes('plant.js')),
    'the planted reach-out must be caught, or this guard proves nothing');
  fs.rmSync(rt, { recursive: true, force: true });
});

it('THE VERSION IS READABLE WHERE THE CODE RUNS, and it is the right one', () => {
  const rt = syncedRuntime();
  const p = path.join(rt, 'package.json');
  assert.ok(fs.existsSync(p), 'the runtime carries the version the running modules belong to');
  assert.strictEqual(JSON.parse(fs.readFileSync(p, 'utf8')).version,
    require('../package.json').version,
    'the copied version is the generation that was synced');
  // And it must not turn the runtime into an ES module tree, which would break
  // every `require` in it at once.
  assert.ok(!('type' in JSON.parse(fs.readFileSync(p, 'utf8'))),
    'a `type` field in the copied manifest would change how every runtime module parses');
  fs.rmSync(rt, { recursive: true, force: true });
});

it('A SECOND SYNC CHANGES NOTHING — the flat files did not break idempotence', () => {
  const rt = syncedRuntime();
  const first = R.stale(PKG, rt);
  assert.deepStrictEqual([first.missing, first.differing], [[], []],
    'a freshly synced runtime is not stale');
  const again = R.sync(PKG, rt, { create: true });
  assert.deepStrictEqual(again.copied, [], 'the second sync copies nothing');
  fs.rmSync(rt, { recursive: true, force: true });
});

if (failures.length) {
  for (const f of failures) console.error(`FAIL: ${f}`);
  console.error(`\n${failures.length} of ${checks} failed`);
  process.exit(1);
}
console.log(`PASS: runtime closure — ${checks} checks`);
