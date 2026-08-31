#!/usr/bin/env node
'use strict';
// Fixtures for the routing-block eval — the RUN needs a model and is out of the
// gate; the ARTIFACT is guarded here, which is the half that rots silently.
//
// The defect this exists for has a name in the family: `make-skill` shipped
// "20 trigger queries" in prose over a file holding 22, and its validator checked
// existence and shape but never the sentence against the artifact. So every count
// RESULTS.md states is recomputed here, not read.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const E = require('./routing_eval.js');
const DIR = path.join(__dirname, 'evals');
const probes = JSON.parse(fs.readFileSync(path.join(DIR, 'routing.json'), 'utf8')).probes;
const results = fs.readFileSync(path.join(DIR, 'RESULTS.md'), 'utf8');
const readme = fs.readFileSync(path.join(DIR, 'README.md'), 'utf8');

let checks = 0;
const failures = [];
function it(name, fn) { checks += 1; try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); } }

it('every probe has an id, a prompt and a want', () => {
  for (const p of probes) {
    assert.ok(/^p\d\d$/.test(p.id), `bad id ${p.id}`);
    assert.ok(p.prompt && p.prompt.length > 3, `probe ${p.id} has no prompt`);
    assert.ok(typeof p.want === 'string', `probe ${p.id} has no want (use "" for silence)`);
  }
});

it('probe ids are unique — a duplicate silently overwrites a row', () => {
  const ids = probes.map((p) => p.id);
  assert.strictEqual(new Set(ids).size, ids.length);
});

it('every named router is probed at least once', () => {
  const reg = require('./../lib/routers-registry.js');
  const probed = new Set(probes.map((p) => p.want).filter(Boolean));
  const missing = reg.order().filter((n) => !probed.has(n));
  // telegram-dev and agent-harness have no curated operator phrasing yet; the point
  // of this assertion is that the gap is DECLARED, not that it is zero.
  assert.ok(missing.length <= 2,
    `${missing.length} routers never probed (${missing.join(', ')}) — add a probe or state why`);
});

it('at least one silence probe — over-routing is invisible without one', () => {
  assert.ok(probes.some((p) => p.want === ''), 'no probe expects silence');
});

it('THE ARMS ARE ORDERED BY SIZE, and the trims are smaller than what ships', () => {
  const sizes = E.ARMS.map((a) => Buffer.byteLength(E.arm(a)));
  assert.ok(sizes[0] > sizes[1], 'the no-among arm is not smaller than current');
  assert.ok(sizes[1] > sizes[2], 'the both arm is not smaller than no-among');
});

it('EVERY ARM KEEPS EVERY REFUSAL PHRASE — a trim may shorten, never disarm', () => {
  const reg = require('./../lib/routers-registry.js');
  for (const a of E.ARMS) {
    const n = (E.arm(a).match(/Refusal phrase/g) || []).length;
    assert.strictEqual(n, reg.order().length,
      `arm ${a} carries ${n} refusal phrases for ${reg.order().length} routers`);
  }
});

it("RESULTS.md's stated probe count matches the file", () => {
  const m = /(\d+) probes ×/.exec(results);
  assert.ok(m, 'RESULTS.md never states a probe count');
  assert.strictEqual(Number(m[1]), probes.length,
    `RESULTS.md says ${m[1]} probes, routing.json holds ${probes.length} — recompute it`);
});

it("RESULTS.md's recall denominator matches the named probes", () => {
  const named = probes.filter((p) => p.want).length;
  const m = /wanted route named, of (\d+)/.exec(results);
  assert.ok(m, 'RESULTS.md never states the recall denominator');
  assert.strictEqual(Number(m[1]), named,
    `RESULTS.md says of ${m[1]}, routing.json has ${named} named probes`);
});

it('RESULTS.md carries a per-probe row for every probe', () => {
  for (const p of probes) {
    assert.ok(results.includes(`| ${p.id} `), `RESULTS.md has no row for ${p.id}`);
  }
});

it('THE CONTAMINATION IS DECLARED — a result quoted without it is misread', () => {
  assert.ok(/contaminated/i.test(readme), 'README does not declare the contamination');
  assert.ok(/paired/i.test(readme) && /paired/i.test(results),
    'the paired-only reading is not stated in both files');
});

it('the README says why route_coverage.js is not this check', () => {
  assert.ok(/route_coverage/.test(readme), 'README never distinguishes the two instruments');
});

it('the runner is NOT discovered by the gate', () => {
  assert.ok(!/_test\.js$/.test('routing_eval.js'),
    'the model-calling runner would be picked up by test/run.js');
});

if (failures.length) {
  process.stdout.write(`${failures.map((f) => `FAIL: ${f}`).join('\n')}\n\n`);
  process.stdout.write(`${failures.length} failure(s) out of ${checks} checks\n`);
  process.exit(1);
}
process.stdout.write(`OK (${checks} checks)\n`);
