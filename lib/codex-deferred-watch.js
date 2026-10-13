#!/usr/bin/env node
'use strict';
// Bounded read-only observer. It never installs, removes, reloads or stops a host.
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const pending = require('./codex-pending');
async function main(args) {
  if (args.length < 1 || args.length > 2 || (args[1] && args[1] !== '--once') || args[0].startsWith('-'))
    throw new Error('usage: node lib/codex-deferred-watch.js <receipt.json> [--once]');
  const file = path.resolve(args[0]); const receipt = pending.read(file);
  const before = fs.readFileSync(file);
  const cycles = args[1] === '--once' ? 1 : 60; // two hours; no infinite retries
  for (let n = 0; n < cycles; n++) {
    if (!fs.readFileSync(file).equals(before)) throw new Error('pending receipt changed; stop and rescan');
    const result = pending.observe(receipt, (cmd, argv, opts) => spawnSync(cmd, argv, {
      encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024,
      env: { ...process.env, CODEX_HOME: opts.profile },
    }));
    const record = { schema: 'sshlg.codex-deferred-observation/v1', receiptSha256: crypto.createHash('sha256').update(before).digest('hex'), ...result };
    const digest = crypto.createHash('sha256').update(JSON.stringify(record)).digest('hex');
    pending.immutable(path.join(path.dirname(file), `${path.basename(file, '.json')}.observation-${digest}.json`), record);
    process.stdout.write(JSON.stringify(record) + '\n');
    if (result.status !== 'deferred') { process.exitCode = result.status.startsWith('catalog-matches') ? 0 : 3; return; }
    if (n + 1 < cycles) await new Promise((resolve) => setTimeout(resolve, 120000));
  }
  process.exitCode = 3;
}
main(process.argv.slice(2)).catch((e) => { console.error(e.message); process.exitCode = 1; });
