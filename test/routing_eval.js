#!/usr/bin/env node
'use strict';
/**
 * The routing block, measured by a model rather than by a regex.
 *
 * **Why this exists.** This package writes a routing block into an operator's
 * instruction file, and until 2026-08-31 nothing anywhere asked whether that block
 * routes. `test/route_coverage.js` looks like the check and is not: it calls
 * `lib/triggers.js`, a deterministic matcher over the PROMPT, and never reads the
 * block's text. Trim a paragraph out of every router and `route_coverage` returns
 * the identical number — a green that means nothing, which is worse than no check.
 *
 * **Deliberately not a `_test.js`.** `test/run.js` discovers the gate by that
 * suffix, and this needs model calls: it cannot run offline, it costs money, and
 * its output is a measurement rather than a verdict. Same shelf as
 * `route_coverage.js` and `check_pins.py`, for the same family of reasons.
 * `routing_evals_test.js` IS in the gate and checks this one's fixtures and its
 * recorded numbers — the artifact is guarded even though the run is not.
 *
 * **What it emits.** Arm texts and a dispatch pack. It does not call a model
 * itself: the probes are run by handing each (arm, probe) pair to a fresh agent,
 * because one agent seeing every probe anchors on its own earlier answers.
 *
 *   node test/routing_eval.js --arms <dir>     write the arm texts
 *   node test/routing_eval.js --pack           print one dispatch line per pair
 *
 * **The arms, and why more than one.** `current` is the shipped block. The others
 * are candidate trims, and they exist so a size argument can be settled by a
 * number. Keep them: a trim proposed twice against no baseline is how a block
 * grows or shrinks on taste.
 *
 * **Read the limits in `evals/README.md` before quoting a result.** The probes run
 * on a machine whose own configuration carries this block, so both arms are
 * contaminated equally and only the PAIRED difference is informative — never the
 * absolute rate.
 */

const fs = require('fs');
const path = require('path');
const reg = require('./../lib/routers-registry.js');

const ROOT = path.join(__dirname, '..');
const PROBES = JSON.parse(fs.readFileSync(path.join(__dirname, 'evals', 'routing.json'), 'utf8')).probes;

/** Every router's text, joined — the block as a model meets it. */
function arm(kind) {
  return reg.order().map((name) => {
    let t = reg.REGISTRY[name].text.trim();
    if (kind === 'no-among' || kind === 'both') {
      // the comparative paragraph that places a router against its neighbours
      t = t.replace(/\n\n\*\*Among the routers[^]*?(?=\n\n\*\*|$)/g, '');
    }
    if (kind === 'both') {
      // the boundary paragraph, cut to its first sentence
      t = t.replace(/(\*\*The boundary[^]*?\*\*)([^]*?)(?=\n\n)/g, (m, head, body) => {
        const first = body.trim().split(/(?<=\.)\s+/)[0] || '';
        return `${head} ${first}`;
      });
    }
    return t.trim();
  }).join('\n\n') + '\n';
}

const ARMS = ['current', 'no-among', 'both'];

function main(argv) {
  const at = argv.indexOf('--arms');
  if (at >= 0) {
    const dir = argv[at + 1];
    if (!dir) { process.stderr.write('--arms needs a directory\n'); return 2; }
    fs.mkdirSync(dir, { recursive: true });
    for (const a of ARMS) {
      const p = path.join(dir, `block-${a}.md`);
      fs.writeFileSync(p, arm(a), 'utf8');
      process.stdout.write(`${p}  ${fs.statSync(p).size} bytes\n`);
    }
    return 0;
  }
  if (argv.includes('--pack')) {
    for (const a of ARMS) {
      for (const p of PROBES) {
        process.stdout.write(`${a}\t${p.id}\t${p.want}\t${p.prompt}\n`);
      }
    }
    return 0;
  }
  const sizes = ARMS.map((a) => `${a}=${Buffer.byteLength(arm(a))}B`).join('  ');
  process.stdout.write(
    `routing eval: ${PROBES.length} probes x ${ARMS.length} arms = ${PROBES.length * ARMS.length} dispatches\n`
    + `arm sizes: ${sizes}\n`
    + 'run: --arms <dir> to write the texts, --pack to print the dispatch list\n'
    + `results: ${path.relative(ROOT, path.join(__dirname, 'evals', 'RESULTS.md'))}\n`,
  );
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { arm, ARMS, PROBES };
