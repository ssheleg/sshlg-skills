#!/usr/bin/env node
'use strict';

/**
 * The detached half of the inbound-work surface: ask GitHub once for the open
 * issues and pull requests of ONE repository, write the cache, exit.
 *
 * Detached for the reason `lib/updatecheck.js` sets out: session start must not
 * wait on a network. Consequences that follow and are deliberate:
 *
 * - **`gh` absent or unauthenticated is silence, not an error.** Most machines
 *   running these packs have it; a machine that does not is not broken, it simply
 *   cannot see the queue, and a surface that shouted about its own tooling would
 *   be worse than one that says nothing.
 * - **A failure stamps the time and an EMPTY list**, so a repository whose API
 *   call keeps failing backs off for the interval rather than being probed at
 *   every session start. An empty list is honest here: it says "nothing was
 *   found", and the absence of a claim is exactly right when nothing was read.
 * - The repo slug is taken from the ARGUMENT, not guessed from a remote, because
 *   the hook already resolved which repository the session is in and two answers
 *   to that question is one too many.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const hand = require('./handoff.js');

const DIR = path.join(os.homedir(), '.sshlg-skills');
const TIMEOUT_MS = 15000;
const FIELDS = 'number,title,labels';

function save(repo, items) {
  try {
    let state = {};
    try { state = JSON.parse(fs.readFileSync(path.join(DIR, 'state.json'), 'utf8')); }
    catch (e) { state = {}; }
    state.inbound = hand.record(repo, items, Date.now());
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(path.join(DIR, 'state.json'), JSON.stringify(state, null, 2) + '\n');
  } catch (e) { /* an unwritable cache means the next session probes again */ }
}

const repo = process.argv[2];
if (!repo) process.exit(0);

function list(kind, cb) {
  execFile('gh', [kind, 'list', '-R', repo, '--state', 'open', '--json', FIELDS, '--limit', '30'],
    { timeout: TIMEOUT_MS, windowsHide: true },
    (err, stdout) => {
      if (err) return cb([]);
      try {
        const rows = JSON.parse(String(stdout || '[]'));
        return cb(rows.map((r) => Object.assign({}, r, { kind: kind === 'pr' ? 'pr' : 'issue' })));
      } catch (e) { return cb([]); }
    });
}

list('issue', (issues) => {
  list('pr', (prs) => {
    save(repo, issues.concat(prs));
    process.exit(0);
  });
});
