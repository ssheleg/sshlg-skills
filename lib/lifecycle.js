'use strict';
/**
 * Native host lifecycle — install/update a member through the HOST's own
 * supported API, or refuse with a manual step (FIX-UP-07.02).
 *
 * `skills.json` describes Codex as a skills-CLI channel, but a Codex install
 * also has a NATIVE plugin cache (measured 2026-09: 25 of 28 members present
 * in `~/.codex/`). The temptation is to "update" it by copying files into that
 * cache and reporting success. That is a fake mutation: Codex loads its
 * plugins through its own lifecycle, and files dropped behind its back are not
 * a loaded version — the receipt would claim `current` for a digest the host
 * never loaded.
 *
 * The rule this module holds:
 *   - a host that exposes a SUPPORTED update API is driven through it, and the
 *     reload receipt verifies the digest the host ACTUALLY loaded;
 *   - a host with no such API returns `UNSUPPORTED_UPDATE` with a manual step
 *     and mutates NOTHING;
 *   - with no API there is no overall `current` — a run that could not verify
 *     a loaded digest never claims the member is current on that host.
 */

/** Outcomes, and the two that must never be confused. */
const SUPPORTED = 'SUPPORTED';
const UNSUPPORTED_UPDATE = 'UNSUPPORTED_UPDATE';

/**
 * Decide how a member's lifecycle runs on one host.
 *
 * `host`: { name, api } — `api` is the host's own update entry point when it
 * has one (a function, a command spec), or null/undefined when it does not.
 * Only a real, callable API counts as supported; a filesystem cache is not an
 * API.
 */
function planHostLifecycle(host) {
  if (host && host.api) {
    return { host: host.name, outcome: SUPPORTED, api: host.api, mutates: true };
  }
  return {
    host: host ? host.name : 'unknown',
    outcome: UNSUPPORTED_UPDATE,
    mutates: false,
    manualStep: host && host.manualStep
      ? host.manualStep
      : `${host ? host.name : 'this host'} exposes no supported update API — ` +
        `update it through the host's own plugin manager, then reload the session. ` +
        `No files were touched.`,
  };
}

/**
 * The reload receipt: was the member's expected digest the one the host LOADED?
 *
 * `loadedDigest` comes back from the supported reload API — what the host now
 * runs. A null/absent loaded digest means the host could not report what it
 * loaded, which is NOT the same as a match: it is `unverified`, never
 * `current`.
 */
function reloadReceipt(host, expectedDigest, loadedDigest) {
  if (!loadedDigest) {
    return { host, status: 'unverified',
      why: 'the host returned no loaded digest — a reload that cannot report what ' +
           'it loaded does not prove the member is current' };
  }
  if (loadedDigest !== expectedDigest) {
    return { host, status: 'stale', expected: expectedDigest, loaded: loadedDigest,
      why: 'the host loaded a different digest than the one installed — reload again ' +
           'or the change did not take' };
  }
  return { host, status: 'current', digest: loadedDigest };
}

/**
 * The overall verdict across hosts: `current` ONLY when every host that was
 * asked verified a loaded digest. One unverified/stale/unsupported host means
 * the member is NOT overall-current — the honest word is `partial`.
 */
function overallCurrent(receipts) {
  if (!receipts.length) return { overall: 'unknown', hosts: [] };
  const bad = receipts.filter((r) => r.status !== 'current');
  return {
    overall: bad.length ? 'partial' : 'current',
    unverified: bad.map((r) => ({ host: r.host, status: r.status })),
    hosts: receipts.map((r) => r.host),
  };
}

module.exports = {
  SUPPORTED,
  UNSUPPORTED_UPDATE,
  planHostLifecycle,
  reloadReceipt,
  overallCurrent,
};
