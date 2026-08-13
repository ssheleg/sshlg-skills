#!/usr/bin/env node
'use strict';
/**
 * `FileChanged` — the run ledger moved, so the progress block is printed from it.
 *
 * The status line answers "where am I" when you look. This answers "something
 * happened" when you are not looking, and it does one thing the status line
 * cannot: it prints the **block** `progress.md` specifies — the rail, the bar and
 * what is running now.
 *
 * **Why a hook prints it rather than the agent.** The doctrine is that every glyph
 * is derived from the verdict the gate wrote *and from nothing else*, because a
 * rail is a summary and a summary is the easiest artefact in a run to write from
 * memory rather than from the record. A block emitted here cannot be written from
 * memory: this process has no memory, only the file.
 *
 * Three outputs, and each has a different reason to exist:
 *
 * - `systemMessage` — the block, delivered as a brief terminal notice.
 * - `terminalSequence` OSC `9;4` — taskbar/dock progress, so the run's position is
 *   visible without the terminal being on screen. Sent only when the project's
 *   stage list is known, because a percentage with an invented denominator is the
 *   defect this release exists to remove.
 * - `terminalSequence` OSC `777` — a desktop ping when the run reaches a **manual**
 *   gate with no verdict. That is the only moment nothing advances until the
 *   operator acts, which makes it the only moment worth interrupting them for.
 *
 * The watch list arrives from `SessionStart`'s `watchPaths` — this event's own
 * matcher can only name files in the working directory, and the ledger lives at
 * `.task-pipeline/run.md`. The matcher (`run.md`) then filters which hook groups
 * run against the changed file's basename.
 *
 * The event has no decision control and cannot block a file change, which is
 * correct for it.
 */

const path = require('path');
const fs = require('fs');

const LIB = path.join(__dirname, '..', 'lib');

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
    const file = data.file_path || '';
    if (path.basename(file) !== 'run.md') return process.exit(0);
    // A deleted ledger is a finished or abandoned run, not a stage advance.
    if (data.event === 'unlink' || !fs.existsSync(file)) return process.exit(0);

    const ledger = require(path.join(LIB, 'runledger.js'));
    const notify = require(path.join(LIB, 'notify.js'));
    const text = fs.readFileSync(file, 'utf8');
    const cwd = data.cwd || path.dirname(path.dirname(file));
    const ids = stageIds(cwd);

    const out = {};
    const b = ledger.block(text, { stageIds: ids });
    if (b) out.systemMessage = b;

    const summary = ledger.parse(text);
    const pct = ledger.percent(summary, ids);
    let seq = '';
    // OSC 9;4;1;<percent> — the documented taskbar-progress form. Withheld when
    // the denominator is unknown: a bar is a claim about how much is left.
    if (pct !== null) seq += `${notify.ESC}]9;4;1;${pct}${notify.BEL}`;
    if (ledger.awaitingOperator(summary)) {
      const last = summary.stages[summary.stages.length - 1];
      seq += `${notify.ESC}]777;notify;task-pipeline;` +
        `${notify.sanitise(`stage ${last.id} ${last.name} needs you — manual gate`)}${notify.BEL}`;
    }
    if (seq && notify.isAllowed(seq)) out.terminalSequence = seq;

    if (Object.keys(out).length) process.stdout.write(JSON.stringify(out) + '\n');
  } catch (e) {
    /* Silence, deliberately. */
  }
  process.exit(0);
});
