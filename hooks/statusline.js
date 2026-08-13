#!/usr/bin/env node
'use strict';
/**
 * The terminal status line — where the pipeline is, without asking.
 *
 * Claude Code passes a JSON payload on stdin and renders this script's stdout on
 * the status line. It runs on every render, so it does two things and no more:
 * read two files, print one line.
 *
 * The state comes from `.task-pipeline/run.md` — the run ledger the pipeline
 * already keeps and which already survives a compaction. **The stage list comes
 * from the project's own `pipeline.json`**, and from nowhere else: until v0.43.0
 * this line built its fraction out of how many lines the ledger happened to hold,
 * so a run at stage 4 of ten printed `gates 5/5`. Nothing is written and no number
 * is invented; see `lib/runledger.js` for why every one of them is borrowed.
 *
 * Prints nothing when no run is in progress. An empty status line is the honest
 * rendering of "no pipeline here", and better than a line that says `0/0` in a
 * repository that has never run one.
 */

const fs = require('fs');
const path = require('path');

/** The project's own stage ids, or `null`. Never the example flow's eleven. */
function stageIds(cwd) {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(cwd, 'pipeline.json'), 'utf8'));
    const stages = cfg && cfg.stages;
    if (!Array.isArray(stages) || !stages.length) return null;
    return stages.map((s) => (s && s.id !== undefined ? s.id : s));
  } catch (e) {
    return null;
  }
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  try {
    const data = raw.trim().startsWith('{') ? JSON.parse(raw) : {};
    // The payload's cwd is the session's, which is the one that has the ledger.
    // `process.cwd()` is where the hook happened to be spawned and is not the
    // same thing in a worktree.
    const cwd = (data.cwd || (data.workspace && data.workspace.current_dir) ||
                 process.env.CLAUDE_PROJECT_DIR || process.cwd());
    const ledger = path.join(cwd, '.task-pipeline', 'run.md');
    if (!fs.existsSync(ledger)) return process.exit(0);
    const ledgerLib = require(path.join(__dirname, '..', 'lib', 'runledger.js'));
    const line = ledgerLib.render(fs.readFileSync(ledger, 'utf8'), {
      stageIds: stageIds(cwd),
      now: Date.now(),
    });
    if (line) process.stdout.write(line + '\n');
  } catch (e) {
    /* a status line that throws would paint a stack trace under the prompt */
  }
  process.exit(0);
});
