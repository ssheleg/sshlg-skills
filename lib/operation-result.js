'use strict';
/**
 * The operation plan and its typed result — what `--dry-run` renders and what
 * every mutating command answers with.
 *
 * Finding UP-02 (sherlock audit): the parser ACCEPTED `--dry-run` for every
 * command, and `install`/`update` then ran their subprocesses and deleted
 * shadow copies anyway — an accepted flag that changes nothing is worse than a
 * rejected one, because the operator has already relied on it. The repair is
 * structural rather than a scatter of `if (dryRun)` guards: a command first
 * builds an immutable PLAN of every action it would take (subprocess, prune,
 * router block, runtime sync), and dry-run renders that plan and executes
 * nothing. The plan is the receipt; the run is the plan, executed.
 *
 * The RESULT side replaces prose-parsing: an operation answers with a typed
 * record — scope, status, evidence, error class, remediation — and statuses
 * that are not success never map to a zero exit. `unknown` and `unsupported`
 * exist precisely so that "I could not tell" stops masquerading as "done".
 *
 * Node stdlib only, pure by construction: nothing here spawns, reads or
 * writes. That is what lets `test/operation-result_test.js` pin the contract
 * without a network, a HOME or a checkout.
 */

const KINDS = Object.freeze(['subprocess', 'prune', 'router-block', 'runtime-sync']);
const SCOPES = Object.freeze(['home', 'project', 'checkout', 'runtime', 'none']);
const STATUSES = Object.freeze(['ok', 'dry-run', 'partial', 'failed', 'unknown', 'unsupported']);
const ERROR_CLASSES = Object.freeze([
  'none', 'auth', 'network', 'parse', 'child', 'internal', 'unsupported', 'unknown',
]);

// Effects are rendered into receipts people forward. A key that names a secret is
// refused at construction, because redaction at print time is a promise somebody
// eventually forgets — refusing the shape is a guarantee nobody has to remember.
const SECRETISH = /(token|secret|password|credential|authorization|api[-_]?key)/i;

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const k of Object.keys(value)) deepFreeze(value[k]);
  }
  return value;
}

/**
 * One planned action. `effect` is the exact, replayable description of what
 * would happen: `{cmd, args}` for a subprocess, `{paths}` for a prune,
 * `{mode}` for the router block, `{root}` for the runtime sync — plain
 * strings and arrays of strings, nothing executable and nothing secret.
 */
function step(kind, scope, label, effect) {
  if (!KINDS.includes(kind)) throw new Error(`unknown step kind: ${kind}`);
  if (!SCOPES.includes(scope)) throw new Error(`unknown step scope: ${scope}`);
  if (!label || typeof label !== 'string') throw new Error('a step needs a label');
  const eff = effect || {};
  for (const [k, v] of Object.entries(eff)) {
    if (SECRETISH.test(k)) throw new Error(`effect key ${k} names a secret — a receipt must not carry one`);
    const flat = Array.isArray(v) ? v : [v];
    for (const item of flat) {
      if (typeof item !== 'string') {
        throw new Error(`effect ${k} must be strings — a receipt is rendered, not executed`);
      }
    }
  }
  return deepFreeze({ kind, scope, label, effect: eff });
}

/** The immutable plan: what a run WILL do, known before anything does it. */
function buildPlan(steps) {
  for (const s of steps || []) {
    if (!s || !KINDS.includes(s.kind)) throw new Error('buildPlan takes steps from step()');
  }
  return deepFreeze({ steps: (steps || []).slice() });
}

function summarizeEffect(s) {
  if (s.kind === 'subprocess') return `${s.effect.cmd} ${(s.effect.args || []).join(' ')}`;
  if (s.kind === 'prune') {
    const paths = s.effect.paths || [];
    return paths.length ? paths.join(', ') : '(no candidates at plan time)';
  }
  if (s.kind === 'router-block') return `mode=${s.effect.mode}`;
  if (s.kind === 'runtime-sync') return s.effect.root || '';
  return '';
}

/** The receipt: every step, its scope and its exact effect — render, never run. */
function render(plan) {
  const lines = [];
  for (const s of plan.steps) {
    lines.push(`  - [${s.scope}] ${s.kind}: ${s.label}`);
    const summary = summarizeEffect(s);
    if (summary) lines.push(`      ${summary}`);
  }
  lines.push(`  = ${plan.steps.length} action(s), 0 executed`);
  return lines;
}

/**
 * One typed answer. `failed` and `partial` must carry a remediation — a
 * refusal with no next step is how an operator learns to stop reading — and
 * an error class outside `none` must not ride under an `ok` status.
 */
function result(fields) {
  const f = fields || {};
  if (!STATUSES.includes(f.status)) throw new Error(`unknown status: ${f.status}`);
  if (!SCOPES.includes(f.scope)) throw new Error(`unknown scope: ${f.scope}`);
  const errorClass = f.errorClass || (f.status === 'ok' || f.status === 'dry-run' ? 'none' : 'unknown');
  if (!ERROR_CLASSES.includes(errorClass)) throw new Error(`unknown error class: ${errorClass}`);
  if ((f.status === 'ok' || f.status === 'dry-run') && errorClass !== 'none') {
    throw new Error(`status ${f.status} cannot carry error class ${errorClass}`);
  }
  if ((f.status === 'failed' || f.status === 'partial') && !f.remediation) {
    throw new Error(`status ${f.status} needs a remediation — a dead end is not an answer`);
  }
  return deepFreeze({
    scope: f.scope,
    status: f.status,
    evidence: f.evidence || '',
    errorClass,
    remediation: f.remediation || '',
  });
}

/**
 * Many step results into one verdict. Failure dominates; not-knowing is never
 * promoted to success; a mixed bag is `partial`, with the failures named.
 */
function aggregate(results, scope) {
  const list = results || [];
  const by = (s) => list.filter((r) => r.status === s);
  if (!list.length) {
    return result({
      scope: scope || 'none', status: 'unknown', errorClass: 'unknown',
      evidence: 'no step reported a result',
    });
  }
  const failed = by('failed');
  const oks = by('ok').length + by('dry-run').length;
  if (failed.length) {
    return result({
      scope: scope || failed[0].scope,
      status: oks || by('partial').length ? 'partial' : 'failed',
      errorClass: failed[0].errorClass === 'none' ? 'child' : failed[0].errorClass,
      evidence: `${failed.length} of ${list.length} step(s) failed`,
      remediation: failed.map((r) => r.remediation).filter(Boolean).join('; ')
        || 're-run the failed steps',
    });
  }
  const dark = by('unknown').concat(by('unsupported'));
  if (dark.length) {
    // "I could not tell" out of any step keeps the whole answer honest.
    return result({
      scope: scope || dark[0].scope, status: dark[0].status,
      errorClass: dark[0].errorClass, evidence: dark[0].evidence,
      remediation: dark[0].remediation,
    });
  }
  if (by('partial').length) {
    return result({
      scope: scope || 'none', status: 'partial', errorClass: by('partial')[0].errorClass,
      evidence: 'a step completed only part of its work',
      remediation: by('partial')[0].remediation || 'inspect the partial step',
    });
  }
  if (by('dry-run').length === list.length) {
    return result({ scope: scope || 'none', status: 'dry-run', evidence: `${list.length} step(s) rendered` });
  }
  return result({ scope: scope || 'none', status: 'ok', evidence: `${list.length} step(s) completed` });
}

/** Only success shapes exit 0. `unknown`/`unsupported` are NOT success. */
function exitCode(res) {
  return res.status === 'ok' || res.status === 'dry-run' ? 0 : 1;
}

module.exports = {
  KINDS, SCOPES, STATUSES, ERROR_CLASSES,
  step, buildPlan, render, result, aggregate, exitCode,
};
