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

const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const chk = require('./updatecheck.js');
const store = require('./store.js');

const DIR = path.join(os.homedir(), '.sshlg-skills');
const TIMEOUT_MS = 8000;

function write(latest) {
  try {
    // MERGED into `updateCheck`, never replacing it (fix round #6): the idle updater keeps
    // `ranAt/from/to/ok` in the same object, and a probe that replaced it erased the
    // interval guard — the next idle ran `update` again right after one had run. One
    // writer for the file: `store.writeJson`, temp file and rename, mode 0600.
    const file = path.join(DIR, 'state.json');
    const state = store.readJson(file);
    store.writeJson(file, {
      updateCheck: Object.assign({}, state.updateCheck, chk.record(latest, Date.now())),
      schemaVersion: store.STATE_SCHEMA,
    });
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
