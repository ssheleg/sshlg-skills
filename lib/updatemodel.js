'use strict';

/**
 * How the next version reaches this machine — said out loud, because not saying it is
 * itself a choice and the choice is "never".
 *
 * Claude Code carries a per-marketplace `autoUpdate` flag in
 * `~/.claude/plugins/known_marketplaces.json`. It is real and it is **not in the
 * documented settings surface** — the `/plugin` UI writes it, and third-party installers
 * write it directly: `vercel-labs/plugins` prompts `Enable auto-updates? [Y/n]`, defaults
 * to yes, and asks only when the marketplace is new and the install did not go through the
 * official CLI. Measured here 2026-08-28: of 20 marketplaces on one machine, the 2
 * installed by that tool carry `autoUpdate: true` and 18 have no such key, because
 * `claude plugin marketplace add` never sets it.
 *
 * **This family leaves it off deliberately, and that is the part worth writing down.**
 * The nine packs are released and pinned as a set; `skills.json` says which versions belong
 * together and the launcher refuses a per-member argument for the same reason. Per-
 * marketplace auto-update updates each one on its own clock, so a machine drifts into a
 * combination nobody tested — which is precisely the failure the launcher exists to
 * prevent. For a pack that stands alone the flag is the better answer; for a family that
 * composes it is not.
 *
 * So the installer states the model, and reports it when somebody has turned the flag on
 * behind its back. Reporting rather than reverting: the file belongs to the operator and
 * to Claude Code, and silently rewriting somebody's setting is how a tool loses trust.
 */

const FAMILY_LINE = 'npx sshlg-skills@latest update';

/** The notice, as lines. Pure — no filesystem, no HOME, so a fixture can read every word. */
function notice(mode, findings) {
  const on = (findings && findings.on) || [];
  const out = [];
  out.push('');
  out.push('== How the next version arrives ==');
  out.push(`  ${FAMILY_LINE}`);
  out.push('');
  out.push('  Auto-update is OFF for these packs on purpose. They are pinned and released');
  out.push('  as a set, so updating one on its own clock leaves a combination nobody');
  out.push('  tested — the same reason this launcher takes no member argument.');
  if (mode === 'install') {
    out.push('  Nothing checks for you: run the line above when you want the next set.');
  }
  if (on.length) {
    out.push('');
    out.push(`  NOTE: auto-update is enabled on ${on.length} of this family's marketplaces —`);
    out.push(`  ${on.join(', ')}`);
    out.push('  Claude Code will move those independently of the rest. Nothing here changed');
    out.push('  it: turn it off in /plugin if you want the set to move together.');
  }
  return out;
}

/**
 * Which of this family's marketplaces have the flag on.
 *
 * The single impure function here, and the same split `injectors.js` and `conflicts.js`
 * use: the rule ships to every operator, the roster is a fact about one machine and is
 * read at the moment it is needed. An unreadable or absent file is not an error — a
 * machine with no plugins installed has nothing to report, and a notice that failed the
 * install over a missing JSON file would be worse than the drift it warns about.
 */
function autoUpdateState(home, marketplaces) {
  const wanted = new Set(marketplaces || []);
  const on = [];
  const path = require('path');
  const source = path.join(home, '.claude', 'plugins', 'known_marketplaces.json');
  try {
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync(source, 'utf8'));
    for (const [name, entry] of Object.entries(data || {})) {
      if (!wanted.has(name)) continue;
      if (entry && entry.autoUpdate === true) on.push(name);
    }
  } catch (e) {
    // A read/parse failure is UNKNOWN, not "none enabled" — the difference is
    // the whole of FIX-UP-01.03. `error` carries the reason; `read:false` keeps
    // the old shape for existing callers.
    return { on: [], read: false, source, error: String(e && e.message || e) };
  }
  return { on: on.sort(), read: true, source };
}

/**
 * Render the auto-update observation as a STATE, never a green line for a
 * failed check (FIX-UP-01.03). A read/parse failure is `CHECK_ERROR` and the
 * status is `UNKNOWN` — it must NOT print as "off" (which reads as "checked,
 * and it is off"). An observation carries where it was read and when.
 */
function observeAutoUpdate(state, checkedAt) {
  const s = state || {};
  if (s.read === false) {
    return { status: 'UNKNOWN', reason: 'CHECK_ERROR',
             detail: `could not read ${s.source || 'known_marketplaces.json'}`
               + (s.error ? ` (${s.error})` : ''),
             checked_at: checkedAt || null, source: s.source || null };
  }
  const on = s.on || [];
  return {
    status: on.length ? 'drift' : 'off',
    on,
    detail: on.length
      ? `auto-update enabled on ${on.length}: ${on.join(', ')}`
      : 'auto-update off for every family marketplace (as designed)',
    checked_at: checkedAt || null,
    source: s.source || null,
  };
}

/**
 * The immutable release-set lock (FIX-UP-01.01).
 *
 * The family's whole promise — "released and pinned as a set" — was documented
 * and NOT enforced by the install: pins materialized a git-submodule checkout,
 * `npx` resolved whatever the skills CLI happened to be, and a `plugin update`
 * carried no immutable ref. A lock closes that: each member is pinned to an
 * immutable git SHA and a content digest, with its provider, its minimum host
 * capability and the installer version that wrote it. The four states a naive
 * model conflates are SEPARATE fields — `desired` (what skills.json asks for),
 * `latest` (what upstream now offers), `installed` (what is on disk) and
 * `active` (what actually loads) — because collapsing them is how "up to date"
 * gets asserted about a machine running something else.
 *
 * `resolver(member)` is injected — it returns `{sha, digest, provider,
 * hostFloor}` for a member, or omits `sha`/`digest` when upstream offers no
 * immutable ref. A member the resolver cannot pin is recorded
 * `UNSUPPORTED_PIN`, never silently pinned to a moving ref: a pin that is not
 * immutable is not a pin. Pure — the resolver does the impure work, so a
 * fixture drives every branch without a network.
 */
const LOCK_VERSION = 'release-set/1';

function buildLock(members, cliVersion, resolver) {
  const out = { lock: LOCK_VERSION, cliVersion: cliVersion || null, members: [] };
  for (const m of members || []) {
    const r = (resolver && resolver(m)) || {};
    const entry = {
      name: m.name,
      provider: r.provider || 'github',
      desired: m.version || null,
      hostFloor: r.hostFloor || null,
    };
    if (r.sha && r.digest) {
      entry.ref = r.sha;
      entry.digest = r.digest;
      entry.status = 'pinned';
    } else {
      entry.status = 'UNSUPPORTED_PIN';
      entry.reason = 'upstream offers no immutable ref/digest — cannot pin';
    }
    out.members.push(entry);
  }
  return out;
}

/**
 * Re-resolve against a lock: one lock, on an upstream change, allows exactly
 * two verdicts per member — the SAME bytes, or `UNSUPPORTED_PIN`. A digest
 * that changed under a pinned ref is `DRIFT`: the ref moved, which a git SHA
 * must never do, so it is an error and not an upgrade.
 */
function checkLock(lock, resolver) {
  const out = [];
  for (const m of (lock && lock.members) || []) {
    if (m.status === 'UNSUPPORTED_PIN') {
      out.push({ name: m.name, verdict: 'UNSUPPORTED_PIN' });
      continue;
    }
    const r = (resolver && resolver(m)) || {};
    if (!r.digest) {
      out.push({ name: m.name, verdict: 'UNSUPPORTED_PIN' });
    } else if (r.digest === m.digest) {
      out.push({ name: m.name, verdict: 'SAME_BYTES' });
    } else {
      out.push({ name: m.name, verdict: 'DRIFT',
                 detail: `pinned ${String(m.digest).slice(0, 12)}…, upstream now `
                   + `${String(r.digest).slice(0, 12)}… — a pinned ref must not move` });
    }
  }
  return out;
}

/** The four separated states for one member, from the lock and the observed
 * install. `upToDate` is true only when all four agree — never inferred from
 * fewer. */
function memberStatus(lockEntry, observed) {
  const o = observed || {};
  const installed = o.installed || null;
  const active = o.active || null;
  const latest = o.latest || null;
  const desired = lockEntry.desired || null;
  // enablement is enabled|disabled|unknown — a failed observation is UNKNOWN,
  // never silently 'disabled' (FIX-UP-01.03). checked_at/source travel with it.
  let enablement = 'unknown';
  if (o.enabled === true) enablement = 'enabled';
  else if (o.enabled === false) enablement = 'disabled';
  return {
    name: lockEntry.name,
    desired, latest, installed, active,
    enablement,
    checked_at: o.checked_at || null,
    source: o.source || null,
    // upToDate is only ever true on a COMPLETE observation — an unknown
    // enablement or a missing field can never read as up to date.
    upToDate: Boolean(desired && desired === latest
      && desired === installed && desired === active
      && enablement === 'enabled'),
  };
}

module.exports = {
  notice, autoUpdateState, observeAutoUpdate, FAMILY_LINE,
  buildLock, checkLock, memberStatus, LOCK_VERSION,
};
