'use strict';
// Plain-skills production admission. skills.json is shipped in the npm package;
// its commit fields are checked against gitlinks by the repository gate.
const plan = require('./plan');
const SHA = /^[0-9a-f]{40}$/;
function validate(members) {
  if (!Array.isArray(members) || !members.length) throw new Error('empty immutable member set');
  const names = new Set();
  for (const m of members) {
    if (!m || typeof m.name !== 'string' || !m.name || names.has(m.name)) {
      throw new Error('invalid or duplicate immutable member name');
    }
    names.add(m.name);
    if (typeof m.commit !== 'string' || !SHA.test(m.commit)) {
      throw new Error(`${m.name}: missing or invalid immutable commit; restore the released skills.json`);
    }
    // A local ./ or ../ prefix is parsed before #ref by skills; a leading -
    // is option-shaped. Admit GitHub shorthand only, never those other forms.
    if (typeof m.repo !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/.test(m.repo)) {
      throw new Error(`${m.name}: invalid immutable repository source`);
    }
  }
}
function build(members, agents, opts = {}) {
  validate(members); // Admit the whole set before emitting any install step.
  const byName = Object.fromEntries(members.map(m => [m.name, m]));
  // Reuse the existing pinned-plan contract. This is a ref plan, not a claim
  // that the old release-set/1 digest resolver has verified fetched payloads.
  const lock = {members: members.map(m => ({name:m.name,ref:m.commit,status:'pinned'}))};
  const result = plan.installPlanLocked(lock, byName, agents);
  if (result.skipped.length) throw new Error('incomplete immutable member plan');
  const restore = opts.continueCopies && !(agents || []).includes('continue')
    ? plan.installPlanLocked(lock, byName, ['continue']).plan : [];
  return result.plan.concat(restore);
}
function verifyGitlinks(members, text) {
  validate(members);
  const links = new Map();
  for (const line of text.split('\n')) {
    const m = /^160000 ([0-9a-f]{40}) 0\t(.+)$/.exec(line);
    if (m) links.set(m[2], m[1]);
  }
  for (const m of members) {
    if (links.get(m.dir) !== m.commit) throw new Error(`${m.name}: immutable commit differs from staged gitlink ${m.dir}`);
  }
  return true;
}
module.exports = {validate, build, verifyGitlinks};
