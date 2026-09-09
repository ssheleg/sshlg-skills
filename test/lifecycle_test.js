'use strict';
// lib/lifecycle.js — native host lifecycle (FIX-UP-07.02). Zero deps, stdlib only.
const assert = require('assert');
const lc = require('../lib/lifecycle.js');

let n = 0;
function t(name, fn) { fn(); n++; console.log('  ok  ' + name); }

t('a host with no API is UNSUPPORTED_UPDATE and mutates nothing', () => {
  const r = lc.planHostLifecycle({ name: 'codex', api: null });
  assert.strictEqual(r.outcome, lc.UNSUPPORTED_UPDATE);
  assert.strictEqual(r.mutates, false);
  assert.ok(r.manualStep && r.manualStep.length > 0, 'no manual step');
});

t('a host with an API is SUPPORTED and drives through it', () => {
  const r = lc.planHostLifecycle({ name: 'claude', api: 'claude plugin update' });
  assert.strictEqual(r.outcome, lc.SUPPORTED);
  assert.strictEqual(r.mutates, true);
  assert.strictEqual(r.api, 'claude plugin update');
});

t('a matching loaded digest is current', () => {
  assert.strictEqual(lc.reloadReceipt('claude', 'abc', 'abc').status, 'current');
});

t('a null loaded digest is unverified, never current', () => {
  const r = lc.reloadReceipt('codex', 'abc', null);
  assert.strictEqual(r.status, 'unverified');
});

t('a different loaded digest is stale, naming both', () => {
  const r = lc.reloadReceipt('claude', 'abc', 'xyz');
  assert.strictEqual(r.status, 'stale');
  assert.strictEqual(r.expected, 'abc');
  assert.strictEqual(r.loaded, 'xyz');
});

t('overall is current only when every host verified', () => {
  assert.strictEqual(lc.overallCurrent([
    { host: 'claude', status: 'current' }, { host: 'codex', status: 'current' }]).overall, 'current');
  const p = lc.overallCurrent([
    { host: 'claude', status: 'current' }, { host: 'codex', status: 'unverified' }]);
  assert.strictEqual(p.overall, 'partial');
  assert.deepStrictEqual(p.unverified, [{ host: 'codex', status: 'unverified' }]);
});

t('no receipts is unknown, not current', () => {
  assert.strictEqual(lc.overallCurrent([]).overall, 'unknown');
});

console.log('\nPASS: lifecycle — ' + n + ' cases');
