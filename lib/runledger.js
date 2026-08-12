'use strict';
/**
 * Reading `.task-pipeline/run.md` — the run's position, as a printed fact.
 *
 * The ledger's grammar is defined by task-pipeline, not here
 * (`references/progress.md` and `templates/run.md` in that skill). Five append-only
 * line shapes:
 *
 *     stage: <id> <name> — gate <auto|manual> — verdict <pass|fail|skip> — <ISO>
 *     iter:  <N> — item <B-NNN> — closed at gate <stage id>
 *     touch: <file> — pass <N> (<stage>) — reason: <id>
 *     hand:  <N|10> — task "<quoted>" — done <n> — surfaced <n> — …
 *     holds: <stage id> — <n> (<class: what, owner>; …) — enumerated <n>/8 classes
 *
 * **Every number is borrowed.** That is the doctrine's own rule and it is why
 * this module counts lines rather than remembering anything: the iteration
 * counter is `grep -c '^iter:'`, and the rail's ticks come from `stage:` verdicts
 * and from nothing else. A status line that computed its own counts would be the
 * fourth copy of the truth, which the same doctrine says nobody maintains.
 *
 * **Absent is a word, never a zero.** A run with no `holds:` line has not
 * reported zero holds — it has not reported. The two must not render the same,
 * or a silent stage looks like a clean one.
 *
 * Pure: it is handed text and returns a summary. No filesystem here.
 */

/** Parse the ledger's text into what a status line can print. */
function parse(text) {
  const lines = String(text || '').split('\n');
  const stages = [];
  let iters = 0;
  let touches = 0;
  let hands = 0;
  let holds = null;
  let topic = null;

  for (const raw of lines) {
    const l = raw.trim();
    if (l.startsWith('stage:')) {
      const gate = /—\s*gate\s+(auto|manual)/.exec(l);
      const verdict = /—\s*verdict\s+(pass|fail|skip)/.exec(l);
      const id = /^stage:\s*(\S+)\s*(.*?)\s*—/.exec(l);
      stages.push({
        id: id ? id[1] : '?',
        name: id ? id[2] : '',
        gate: gate ? gate[1] : null,
        verdict: verdict ? verdict[1] : null,
      });
    } else if (l.startsWith('iter:')) {
      iters += 1;
    } else if (l.startsWith('touch:')) {
      touches += 1;
    } else if (l.startsWith('hand:')) {
      hands += 1;
    } else if (l.startsWith('holds:')) {
      const n = /—\s*(\d+)\s*\(/.exec(l);
      const enumerated = /enumerated\s+(\d+)\s*\/\s*8/.exec(l);
      holds = {
        count: n ? Number(n[1]) : null,
        enumerated: enumerated ? Number(enumerated[1]) : null,
        none: /\(\s*none\s*\)/.test(l),
      };
    } else if (/^Run:/.test(l)) {
      const t = /^Run:\s*`?([^`·]+)`?/.exec(l);
      if (t) topic = t[1].trim();
    }
  }

  return { topic, stages, iters, touches, hands, holds };
}

/**
 * One terminal line, or `''` when there is no run to describe.
 *
 * Deliberately not the four-line header block: that one is emitted by the run at
 * two boundaries and is the run's own artefact. This is the always-visible strip,
 * and a status line that wrapped would push the prompt around on every keystroke.
 */
function render(text) {
  const s = parse(text);
  if (!s.stages.length && !s.iters) return '';

  const last = s.stages[s.stages.length - 1];
  const passed = s.stages.filter((x) => x.verdict === 'pass').length;
  const parts = [];

  if (last) {
    const gate = last.gate ? ` ${last.gate}` : '';
    parts.push(`▶ ${last.id} ${last.name}${gate}`.replace(/\s+/g, ' ').trim());
    parts.push(`gates ${passed}/${s.stages.length}`);
  }
  parts.push(`iter ${s.iters}`);

  // Three states, three renderings. `holds —` is the one that must not look like
  // `holds 0`: the first says nothing was reported, the second that nothing is held.
  if (s.holds === null) parts.push('holds —');
  else if (s.holds.none) parts.push('holds none');
  else parts.push(`holds ${s.holds.count === null ? '?' : s.holds.count}`);

  // The hand-back trace: task-pipeline's own audit compares it against `iter:`,
  // and the two disagreeing is the finding. Shown only when it does disagree,
  // because a status line is not a report.
  if (s.hands && s.hands !== s.iters) parts.push(`hand ${s.hands}≠iter ${s.iters}`);
  if (s.touches) parts.push(`touch ${s.touches}`);

  return parts.join(' · ');
}

module.exports = { parse, render };
