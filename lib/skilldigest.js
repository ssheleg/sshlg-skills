'use strict';
/**
 * `skill-digest/1` (fabric-agent-contract DEC-0204, B-378): the digest a device baseline
 * (`harness.baseline`, `kind: skill` or `kind: plugin`) names for a skill or a plugin root.
 *
 * A port of the contract's reference `src/skill-digest.ts` (fabric-agent-contract `bcd30b99`).
 * Two routes reach the same entries: the hub's, from the file list it pins for each member
 * (`claude-plugin-pins.json`, `members[].files`), and a node's, from the installed folder.
 * `test/skilldigest_test.js` runs the contract's vectors (vendored in
 * `test/fixtures/contract/skill-digest.json`) through both.
 *
 * The digest is `sha256:` and the hex SHA-256 of the UTF-8 RFC 8785 form of
 * `{files: [{path, sha256}]}`: every regular file under the root but `.git` segments and
 * `.DS_Store` files, each path relative with `/` in NFC, ordered by its UTF-8 bytes, each
 * `sha256` in the `sha256:` form. Bytes are hashed as they are. A root whose digest cannot be
 * computed answers `{unknown: <fault>, path?}`, never the digest of a partial set.
 *
 * Pure apart from the folder route, which only reads. Never throws.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SKILL_DIGEST = 'skill-digest/1';
const ROOT_MARKER = Object.freeze({ skill: 'SKILL.md', plugin: '.claude-plugin/plugin.json' });

const SHA256 = /^sha256:[a-f0-9]{64}$/;
const BAD_SEGMENT = /^(?:|\.|\.\.)$/;
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f\\]/;
// With the u flag a well-formed pair is one code point; only a lone half matches.
const SURROGATE = /\p{Surrogate}/u;

/** Any path segment `.git` (a folder, or a worktree's `.git` file) and any file named `.DS_Store`. */
function isExcluded(relative) {
  const segments = relative.split('/');
  return segments.includes('.git') || segments[segments.length - 1] === '.DS_Store';
}

function pathProblem(relative) {
  if (relative.length === 0 || relative.startsWith('/') || CONTROL.test(relative)) return true;
  return relative.split('/').some((segment) => BAD_SEGMENT.test(segment));
}

function byUtf8(a, b) {
  return Buffer.compare(Buffer.from(a.path, 'utf8'), Buffer.from(b.path, 'utf8'));
}

/**
 * RFC 8785 of `{files: [{path, sha256}]}`. Keys are already in code-unit order (`files`;
 * `path` < `sha256`) and the values are strings, whose JCS form is ECMAScript's
 * `JSON.stringify` (RFC 8785 section 3.2.2.2); lone surrogates were refused before this.
 */
function canonicalOf(files) {
  return JSON.stringify({ files: files.map((f) => ({ path: f.path, sha256: f.sha256 })) });
}

/** The hub's route: the digest of a root from its file list. */
function skillDigestOfEntries(kind, entries) {
  if (kind !== 'skill' && kind !== 'plugin') return { unknown: 'input-invalid' };
  if (!Array.isArray(entries)) return { unknown: 'input-invalid' };
  const kept = [];
  const seen = new Set();
  for (const entry of entries) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) return { unknown: 'input-invalid' };
    const raw = entry.path;
    const sha256 = entry.sha256;
    if (typeof raw !== 'string' || typeof sha256 !== 'string' || !SHA256.test(sha256)) return { unknown: 'input-invalid' };
    if (SURROGATE.test(raw)) return { unknown: 'path-invalid', path: '' };
    const relative = raw.normalize('NFC');
    if (pathProblem(relative)) return { unknown: 'path-invalid', path: relative };
    if (isExcluded(relative)) continue;
    if (seen.has(relative)) return { unknown: 'path-duplicate', path: relative };
    seen.add(relative);
    kept.push({ path: relative, sha256 });
  }
  if (!seen.has(ROOT_MARKER[kind])) return { unknown: 'no-marker', path: ROOT_MARKER[kind] };
  kept.sort(byUtf8);
  const canonical = canonicalOf(kept);
  return { digest: `sha256:${crypto.createHash('sha256').update(canonical, 'utf8').digest('hex')}`, canonical };
}

/** The entries under `prefix` (such as `skills/demo`) with the prefix removed. */
function entriesUnder(entries, prefix) {
  const head = `${prefix.normalize('NFC').replace(/\/+$/, '')}/`;
  return entries
    .map((e) => ({ path: e.path.normalize('NFC'), sha256: e.sha256 }))
    .filter((e) => e.path.startsWith(head))
    .map((e) => ({ path: e.path.slice(head.length), sha256: e.sha256 }));
}

function hashFile(file) {
  return `sha256:${crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}`;
}

function walk(absolute, relative, out) {
  let names;
  try { names = fs.readdirSync(absolute); } catch (e) { return { unknown: 'unreadable', path: relative }; }
  for (const name of names) {
    const childRelative = relative === '' ? name : `${relative}/${name}`;
    const key = childRelative.normalize('NFC');
    if (name === '.git') continue;
    const child = path.join(absolute, name);
    try {
      const own = fs.lstatSync(child);
      if (name === '.DS_Store' && !own.isDirectory()) continue;
      if (own.isSymbolicLink()) {
        let target;
        try {
          target = fs.statSync(child);
        } catch (e) {
          if (e.code === 'ENOENT' || e.code === 'ELOOP') return { unknown: 'dangling-link', path: key };
          return { unknown: 'unreadable', path: key };
        }
        if (target.isDirectory()) return { unknown: 'link-to-folder', path: key };
        if (target.isFile()) out.push({ path: key, sha256: hashFile(child) });
        continue;
      }
      if (own.isDirectory()) {
        const failed = walk(child, childRelative, out);
        if (failed) return failed;
        continue;
      }
      // A FIFO, socket or device is not a regular file: never opened, never listed.
      if (own.isFile()) out.push({ path: key, sha256: hashFile(child) });
    } catch (e) {
      return { unknown: 'unreadable', path: key };
    }
  }
  return undefined;
}

/** The node's route: the digest of an installed root, which may itself be reached through a link. */
function skillDigestOfFolder(kind, root) {
  if (kind !== 'skill' && kind !== 'plugin') return { unknown: 'input-invalid' };
  let resolved;
  try {
    resolved = fs.realpathSync(root);
    if (!fs.statSync(resolved).isDirectory()) return { unknown: 'unreadable', path: '' };
  } catch (e) {
    return { unknown: 'unreadable', path: '' };
  }
  const entries = [];
  const failed = walk(resolved, '', entries);
  if (failed) return failed;
  return skillDigestOfEntries(kind, entries);
}

/**
 * One pinned member's digests: the plugin root's and each skill's (`skills/<id>/SKILL.md`
 * among its files). The pins keep bare hex, so each gets the `sha256:` form here; a value
 * that is not 64 lower-case hex stays as it is and the digest reads `input-invalid`.
 */
function memberDigests(member) {
  const files = Array.isArray(member && member.files) ? member.files : null;
  if (!files) return { name: member && member.name, plugin: { unknown: 'input-invalid' }, skills: [] };
  const entries = files.map((f) => ({
    path: f && f.path,
    sha256: f && typeof f.sha256 === 'string' && /^[a-f0-9]{64}$/.test(f.sha256) ? `sha256:${f.sha256}` : f && f.sha256,
  }));
  const ids = new Set();
  for (const e of entries) {
    const m = typeof e.path === 'string' && /^skills\/([^/]+)\/SKILL\.md$/.exec(e.path.normalize('NFC'));
    if (m) ids.add(m[1]);
  }
  const skills = [...ids].sort().map((id) => {
    let result;
    try { result = skillDigestOfEntries('skill', entriesUnder(entries, `skills/${id}`)); } catch (e) { result = { unknown: 'input-invalid' }; }
    return { id, ...result };
  });
  return { name: member.name, version: member.version, commit: member.commit, plugin: skillDigestOfEntries('plugin', entries), skills };
}

module.exports = {
  SKILL_DIGEST, ROOT_MARKER, isExcluded, skillDigestOfEntries, entriesUnder, skillDigestOfFolder, memberDigests,
};
