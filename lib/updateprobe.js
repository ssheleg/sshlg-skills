#!/usr/bin/env node
'use strict';

/**
 * The detached half of the set-update check: ask the registry once, write the
 * cache, exit. Nothing reads its output and nothing waits for it.
 *
 * It runs OUT of the session's way on purpose — see `lib/updatecheck.js` for why
 * session start must not depend on npm. Consequences that follow from that and
 * are deliberate:
 *
 * - a failure writes the STAMP but no version, so a machine that cannot reach
 *   the registry backs off for the interval instead of spawning a doomed probe
 *   at every single session start;
 * - the timeout is short and hard. A hung request that kept the process alive
 *   would leave one orphan per session, which is the litter the turnstate prune
 *   in the same hook exists to clean up after a different mechanism;
 * - it never prints and never throws where anyone can see it, because the only
 *   consumer is a JSON file read by the next session.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const chk = require('./updatecheck.js');

const DIR = path.join(os.homedir(), '.sshlg-skills');
const TIMEOUT_MS = 8000;

function write(latest) {
  try {
    // The path is spelled AT the write rather than hidden behind a const: this is
    // the launcher's own state, not one of the operator's files, and the guard in
    // test/apply_test.js reads the write site to tell those apart. An opaque
    // variable there would have needed an exemption instead of being self-evident.
    let state = {};
    try { state = JSON.parse(fs.readFileSync(path.join(DIR, 'state.json'), 'utf8')); }
    catch (e) { state = {}; }
    state.updateCheck = chk.record(latest, Date.now());
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(path.join(DIR, 'state.json'), JSON.stringify(state, null, 2) + '\n');
  } catch (e) { /* an unwritable cache means the next session probes again */ }
}

execFile('npm', ['view', 'sshlg-skills', 'version'],
  { timeout: TIMEOUT_MS, windowsHide: true },
  (err, stdout) => {
    // A stamp with no version on failure: back off for the interval rather than
    // retry every session against a registry that is not answering.
    write(err ? null : String(stdout || '').trim());
    process.exit(0);
  });
