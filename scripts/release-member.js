#!/usr/bin/env node
'use strict';
// node scripts/release-member.js <member-checkout> vX.Y.Z [--push]   (B-222)
// Run inside nothing: the member checkout is the first argument. Refuses a candidate not on
// origin's default branch, a plugin.json or package.json version that differs from the tag, a
// missing CHANGELOG section, a dirty tree; then creates the annotated tag locally, runs the
// member's suite (`npm run test:all`, else `npm test`) with the tag present, and pushes only
// when it is green. A red suite removes the tag this run created.
const path = require('path');
const W = require('../lib/releasewatch');
const args = process.argv.slice(2);
const push = args.includes('--push');
const [dir, tag] = args.filter(a => a !== '--push');
if (!dir || !tag || args.length > 3) {
  console.error('usage: node scripts/release-member.js <member-checkout> vX.Y.Z [--push]');
  process.exit(2);
}
try {
  console.log(JSON.stringify(W.releaseMember(path.resolve(dir), tag, { push })));
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
