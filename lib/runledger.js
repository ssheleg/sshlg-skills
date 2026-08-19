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
 * **And a denominator is borrowed too — this module shipped one that was not.**
 * Until v0.43.0 the bar read `gates N/N`, where both numbers came from *how many
 * `stage:` lines the ledger happened to contain*. At stage 4 of ten that printed
 * `gates 5/5`, which reads at a glance as a finished run. `progress.md` names this
 * exact failure — "a bar reading `gates 5/11` in a project with six stages is a
 * false success in the purest form the pipeline has, printed in the place designed
 * to be trusted at a glance" — and we shipped it in the status line for two
 * releases. The stage list now comes from the project's `pipeline.json` → `stages[]`
 * or from nowhere: **the example flow's eleven are deliberately not a fallback**,
 * because a host project replaces them and guessing reproduces the defect with a
 * different number.
 *
 * So the rail of what HAPPENED is always truthful; the positions still to come and
 * the percentage appear only when the stage list is known.
 *
 * Pure: it is handed text and returns a summary. No filesystem here.
 */

/** Glyphs, from `progress.md`. Each one is derived from a recorded verdict. */
const GLYPH = { pass: '✓', fail: '✗', skip: '⊘', entered: '▶', absent: '·' };

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
      const at = /—\s*(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)/.exec(l);
      stages.push({
        id: id ? id[1] : '?',
        name: id ? id[2] : '',
        gate: gate ? gate[1] : null,
        verdict: verdict ? verdict[1] : null,
        at: at ? at[1] : null,
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
 * Is a run still open, read from what the ledger SAYS rather than from its existence?
 *
 * UM-01, and it silenced a gate for six days. The route gate asked
 * `fs.existsSync('.task-pipeline/run.md')`, and this repository's own ledger has
 * recorded `stage: 10 acceptance — verdict pass` since 2026-08-14 while the file stayed
 * on disk and kept growing — 1037 lines, `event:` rows still being appended during the
 * 2026-08-18 audit. So a closed run permanently suppressed the escalation that exists to
 * ask which route a change is on: the one control that fails silent, failing silently.
 *
 * The rule is the ledger's own grammar. The LAST `stage:` line is where the run is; if
 * its verdict is `pass` and it names the final stage, the run is over. `event:` lines
 * after it are the artifacts of the session, not the run — they do not reopen anything.
 * A fail or a missing verdict at the last stage means the run is still open, which is
 * the honest reading: the gate stays quiet while somebody is mid-run.
 *
 * `final` is the last stage's id or name from the project's `pipeline.json`, so the
 * number is borrowed like every other number in this module. With no `final` given, any
 * `pass` on the highest-numbered stage seen closes the run.
 */
function isOpen(text, final) {
  const summary = parse(text);
  if (!summary.stages.length) return true;          // a ledger with no stage line is a run beginning
  const last = summary.stages[summary.stages.length - 1];
  if (last.verdict !== 'pass') return true;
  if (final === undefined || final === null || final === '') {
    // No pipeline to borrow from, so borrow from the doctrine that defines this
    // grammar: task-pipeline's last gated stage is `10 acceptance`. The first draft
    // took the highest stage id the ledger happened to contain, which reads EVERY
    // mid-run ledger as closed — the newest stage is always the highest one — and a
    // fixture at stage 2 caught it. A default that closes a run early is worse than
    // the bug this function fixes: it would put a prompt in front of live work.
    return !(Number(last.id) >= 10 || /acceptance/i.test(String(last.name || '')));
  }
  const want = String(final).trim().toLowerCase();
  const id = String(last.id).trim().toLowerCase();
  const name = String(last.name || '').trim().toLowerCase();
  return !(id === want || name === want || name.endsWith(want));
}

/**
 * Is the run stopped waiting for a person?
 *
 * The last stage was entered, its gate is `manual`, and no verdict has been
 * written. This is the only moment in a run when nothing advances until the
 * operator acts — which makes it the only moment worth interrupting them for, and
 * a better trigger than "Claude went quiet 60 seconds ago".
 */
function awaitingOperator(summary) {
  const last = summary.stages[summary.stages.length - 1];
  return Boolean(last && last.gate === 'manual' && !last.verdict);
}

/**
 * The glyph rail.
 *
 * `stageIds` is the project's own stage list, or `null`. With it, unentered
 * positions are printed as `·` and the rail is a map of the whole run. Without it,
 * only what the ledger recorded is printed — a rail with no claim about what
 * remains, which is the honest shape when the total is unknown.
 */
function rail(summary, stageIds) {
  const seen = new Map();
  for (const s of summary.stages) {
    seen.set(String(s.id), s.verdict ? GLYPH[s.verdict] : GLYPH.entered);
  }
  const ids = stageIds && stageIds.length ? stageIds.map(String) : [...seen.keys()];
  return ids.map((id) => `${id}${seen.get(id) || GLYPH.absent}`).join(' ');
}

/**
 * How many DISTINCT stages are closed — never how many lines say so.
 *
 * A stage is re-entered whenever a loop sends the run back through it, and the
 * ledger is append-only, so two `stage: 8` lines are normal and mean one stage.
 * Counting lines produced `gates 12/11 · 109%` on this repository's own run —
 * the same defect as the denominator it replaced, arriving from the numerator.
 * The last verdict for an id wins, because that is the one that is current.
 */
function closed(summary) {
  const latest = new Map();
  for (const s of summary.stages) latest.set(String(s.id), s.verdict);
  return [...latest.values()].filter((v) => v === 'pass' || v === 'skip').length;
}

/** Gates passed, distinct. Same rule, and `fail` is not passed. */
function passed(summary) {
  const latest = new Map();
  for (const s of summary.stages) latest.set(String(s.id), s.verdict);
  return [...latest.values()].filter((v) => v === 'pass').length;
}

/** How far along, or `null` when the stage list is unknown. */
function percent(summary, stageIds) {
  if (!stageIds || !stageIds.length) return null;
  return Math.min(100, Math.round((closed(summary) / stageIds.length) * 100));
}

/** `1h 12m`, `12m`, `40s` — the coarsest unit that is still true. */
function elapsed(fromISO, nowMs) {
  const from = Date.parse(fromISO || '');
  if (!Number.isFinite(from) || !Number.isFinite(nowMs) || nowMs < from) return null;
  const s = Math.floor((nowMs - from) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/**
 * One terminal line, or `''` when there is no run to describe.
 *
 * `opts.stageIds` is the project's stage list; `opts.now` is the clock, passed in
 * so this stays pure and a fixture can hold time still.
 */
function render(text, opts) {
  const o = opts || {};
  const s = parse(text);
  if (!s.stages.length && !s.iters) return '';

  const last = s.stages[s.stages.length - 1];
  const parts = [];

  const r = rail(s, o.stageIds);
  if (r) parts.push(r);

  const pct = percent(s, o.stageIds);
  if (pct !== null) parts.push(`${pct}%`);

  if (last) {
    const gate = last.gate ? ` ${last.gate}` : '';
    parts.push(`▶ ${last.id} ${last.name}${gate}`.replace(/\s+/g, ' ').trim());
    // A count when the total is unknown, a fraction when it is. The two must not
    // look alike: `gates 5/5` claims a finished run, `5 gates` claims five gates.
    parts.push(o.stageIds && o.stageIds.length
      ? `gates ${passed(s)}/${o.stageIds.length}`
      : `${passed(s)} gates passed`);
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

  const since = elapsed(s.stages[0] && s.stages[0].at, o.now);
  if (since) parts.push(since);
  if (awaitingOperator(s)) parts.push('⏸ waiting on you');

  return parts.join(' · ');
}

/**
 * The four-line block `progress.md` specifies, or `''`.
 *
 * Printed by a hook rather than by the agent, and that is the point of moving it
 * here: the doctrine requires every glyph to be derived from the verdict the gate
 * wrote "and from nothing else", while a block typed by the agent is a summary
 * written from memory — the one artefact in a run easiest to get confidently wrong.
 */
function block(text, opts) {
  const o = opts || {};
  const s = parse(text);
  if (!s.stages.length) return '';
  const last = s.stages[s.stages.length - 1];
  const pct = percent(s, o.stageIds);

  const head = [`task-pipeline${o.version ? ' v' + o.version : ''}`, s.topic]
    .filter(Boolean).join(' · ');

  const bar = pct === null ? null :
    '█'.repeat(Math.round(pct / 4)) + '░'.repeat(25 - Math.round(pct / 4));

  const third = [
    bar,
    o.stageIds && o.stageIds.length
      ? `gates ${passed(s)}/${o.stageIds.length}`
      : `${passed(s)} gates passed`,
    last ? `now ${last.id} ${last.name}`.trim() : null,
    last && last.gate,
    awaitingOperator(s) ? 'waiting on you' : null,
  ].filter(Boolean).join(' · ');

  return [head, '  ' + rail(s, o.stageIds), '  ' + third].join('\n');
}

module.exports = {
  parse, render, block, rail, percent, closed, passed, elapsed, awaitingOperator, isOpen, GLYPH,
};
