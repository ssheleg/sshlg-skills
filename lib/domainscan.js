'use strict';
/**
 * Collect every project's domain evidence, several repositories at a time.
 *
 * Why a separate process. Measured 2026-10-13 on 189 repositories: walking them one after
 * another and opening every source file took 18 s and read 307 MB; the same questions put
 * to git — `ls-files` for the manifests (it honours .gitignore, so `node_modules` is never
 * listed) and `grep` for the source markers — eight repositories at a time took about 7 s.
 * The launcher is synchronous end to end, so the concurrency lives here, in a child it
 * runs with `spawnSync`: directories in on stdin as JSON, `{dir: {evidence, via}}` out.
 *
 * Read-only. Judgement stays in `lib/domains.js` (`kindOf`, `evidenceIn`); a repository git
 * cannot answer for falls back to that module's own bounded walk, and says so in `via`.
 */

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const D = require('./domains.js');

const MANIFEST_SPECS = ['*package.json', '*requirements*.txt', '*pyproject.toml', '*Pipfile', '*setup.py',
  '*setup.cfg', '*.gradle', '*.gradle.kts', '*libs.versions.toml', '*AndroidManifest.xml', '*CMakeLists.txt',
  '*Packages/manifest.json', '*project.godot'];
const MAX_MANIFEST = 1024 * 1024;
const KEEP_WHY = 3;

function git(dir, args) {
  return new Promise((resolve) => {
    execFile('git', ['-C', dir, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ status: err ? (typeof err.code === 'number' ? err.code : -1) : 0, stdout: stdout || '', stderr: stderr || '' });
    });
  });
}

/** A path inside a directory the scan never trusts (vendored, built, fixtures, hidden). */
function skipped(rel) {
  return rel.split('/').slice(0, -1).some((seg) => D.SKIP_DIRS.has(seg) || (seg.startsWith('.') && seg !== '.github'));
}

async function one(dir) {
  const evidence = {};
  const partial = new Set();
  const note = (ev) => {
    for (const e of ev) {
      const list = evidence[e.member] || (evidence[e.member] = []);
      if (list.length < KEEP_WHY && !list.includes(e.why)) list.push(e.why);
    }
  };
  const listed = await git(dir, ['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', ...MANIFEST_SPECS]);
  if (listed.status !== 0) {
    // git could not list it: the bounded walk is a partial read, so no member is ruled out.
    const s = D.scan(dir, fs, path);
    return { evidence: s.evidence, via: s.truncated ? 'walk (stopped early)' : 'walk', partial: D.DOMAIN_MEMBERS.slice() };
  }
  const rels = [...new Set(listed.stdout.split('\0').filter(Boolean))].sort();
  for (const rel of rels) {
    const kind = D.kindOf(rel);
    if (!kind || kind === 'source' || skipped(rel)) continue;
    const file = path.join(dir, rel);
    try {
      const st = await fs.promises.stat(file);
      if (!st.isFile() || st.size > MAX_MANIFEST) { D.DOMAIN_MEMBERS.forEach((m) => partial.add(m)); continue; }
      const text = await fs.promises.readFile(file, 'utf8');
      if (kind === 'npm' || kind === 'unity') JSON.parse(text);
      note(D.evidenceIn(rel, text));
    } catch (e) { D.DOMAIN_MEMBERS.forEach((m) => partial.add(m)); }
  }
  // Read all matching lines: a per-file match cap can hide a different domain later in
  // the same file. Only stored explanations are capped; grep overflow stays partial.
  const g = await git(dir, ['grep', '--untracked', '-I', '--null', '-E', '-e', D.SOURCE_PATTERN, '--', ...D.SOURCE_GLOBS]);
  if (g.status !== 0 && g.status !== 1) return { evidence, via: 'git (source search failed)', partial: [...new Set([...partial, ...D.SOURCE_MEMBERS])] };
  if (g.status === 0) {
    for (const line of g.stdout.split('\n')) {
      const i = line.indexOf('\0');
      if (i <= 0) continue;
      const rel = line.slice(0, i);
      if (!skipped(rel) && D.kindOf(rel) === 'source') note(D.evidenceIn(rel, line.slice(i + 1)));
    }
  }
  return { evidence, via: partial.size ? 'git (manifest read incomplete)' : 'git', partial: [...partial] };
}

async function scanMany(dirs, concurrency) {
  const out = {};
  let next = 0;
  const worker = async () => {
    while (next < dirs.length) {
      const dir = dirs[next++];
      try { out[dir] = await one(dir); } catch (e) { out[dir] = { evidence: {}, via: `failed: ${e.message}`, partial: D.DOMAIN_MEMBERS.slice() }; }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency || 8, dirs.length)) }, worker));
  return out;
}

module.exports = { scanMany, MANIFEST_SPECS };

if (require.main === module) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (c) => { input += c; });
  process.stdin.on('end', () => {
    let dirs = [];
    try { dirs = JSON.parse(input || '[]'); } catch (e) { dirs = []; }
    scanMany(dirs, Number(process.env.SSHLG_DOMAINS_CONCURRENCY) || 8)
      .then((r) => { process.stdout.write(JSON.stringify(r)); });
  });
}
