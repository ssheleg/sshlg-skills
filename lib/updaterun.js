#!/usr/bin/env node
'use strict';

/**
 * The unattended set update: run the launcher while the operator is idle, record
 * what happened, exit.
 *
 * **Why idle and not session start.** Skills load AT session start, so an update
 * landing there reaches the operator only in the NEXT session — which is what
 * the session-start NOTICE already achieves, at the cost of a session start that
 * waits on npm. `idle_prompt` costs nothing: nobody is waiting on the model, and
 * the next session begins already fresh.
 *
 * **What it is allowed to do, and what it is not.** It runs the family launcher,
 * which updates all nine packs as a SET — never a member on its own clock, which
 * is the drift Claude Code's per-marketplace `autoUpdate` flag would produce and
 * the reason this pack leaves that flag alone. It writes the routing block only
 * through the launcher's own `protect()` path, where `authored` precedence keeps
 * the operator's wording and a copy is taken before every write.
 *
 * **It records rather than reports.** Nothing reads its stdout; the next session
 * reads the cache and says what happened — including when it FAILED, because an
 * unattended mechanism that fails quietly is worse than one that never ran.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const chk = require('./updatecheck.js');

const DIR = path.join(os.homedir(), '.sshlg-skills');
const TIMEOUT_MS = 1000 * 60 * 10;

function readState() {
  try { return JSON.parse(fs.readFileSync(path.join(DIR, 'state.json'), 'utf8')); }
  catch (e) { return {}; }
}

function save(patch) {
  try {
    const state = readState();
    state.updateCheck = Object.assign({}, state.updateCheck, patch);
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(path.join(DIR, 'state.json'), JSON.stringify(state, null, 2) + '\n');
  } catch (e) { /* an unwritable cache means the next idle tries again */ }
}

const from = require('../package.json').version;

// Stamp BEFORE running, not after: a launcher that hangs or is killed mid-run
// would otherwise leave no record and be retried on every single idle ping.
save({ ranAt: Date.now() });

execFile('npx', ['--yes', 'sshlg-skills@latest', 'update'],
  { timeout: TIMEOUT_MS, windowsHide: true, maxBuffer: 1024 * 1024 * 8 },
  (err) => {
    // Unknown is its own answer. This used to fall back to `from`, which records
    // "the version did not move" — and `ranLine` is silent on that, so an update
    // that DID move the set would tell the operator nothing and they would keep
    // running the old one in this session. A null `to` is reported as a real
    // update whose version could not be read (FIX-RT-01).
    let to = null;
    try {
      // Read the version the launcher just installed, not the one this process
      // started with — this file is the OLD copy while it runs.
      const p = path.join(DIR, 'runtime', 'package.json');
      if (fs.existsSync(p)) to = JSON.parse(fs.readFileSync(p, 'utf8')).version || null;
    } catch (e) { /* stays null, and the record says unknown rather than unchanged */ }
    save(chk.ranRecord(from, err ? null : to, !err, Date.now()));
    process.exit(0);
  });
