#!/usr/bin/env node
// Read-only directory discovery, not full Continue parsing or model acceptance.
// Usage: node continue-discovery.mjs --root /explicit/path/to/skills
// Requires Node with node:module.stripTypeScriptTypes (tested on Node 26.10).
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const revision = '5522c6f44ca0ac3528b37244818fbfa39b5af470';
const sourceURL = `https://raw.githubusercontent.com/continuedev/continue/${revision}/extensions/cli/src/util/loadMarkdownSkills.ts`;
const sourceDigest = '7c8ac3242ca5aeb9b119f62186fc1d70f24bbe810ac6cd1f0ee7bdc293ee840c';
const helperDigest = '8d72a4362ee1539f120f86c5700b0382f2abfa5dbe2fc85126629bc46d4e8706';
const sha256 = value => createHash('sha256').update(value).digest('hex');

// Exported solely to permit an offline, fail-closed digest regression check.
export function discoveryHelper(source) {
  if (sha256(source) !== sourceDigest) throw Error('Continue source digest mismatch');
  const start = source.indexOf('async function getSkillFilesFromDir(');
  const end = source.indexOf('export async function loadMarkdownSkills(');
  if (start < 0 || end <= start) throw Error('Continue helper boundary mismatch');
  const helper = source.slice(start, end);
  if (sha256(helper) !== helperDigest) throw Error('Continue helper digest mismatch');
  // Exact upstream helper, with only TypeScript annotations stripped. It calls
  // stat/readdir, returns paths, and never reads SKILL.md contents.
  return vm.runInNewContext(`(${stripTypeScriptTypes(helper)})`, { fsPromises, path });
}

async function main(args) {
  if (args.length !== 2 || args[0] !== '--root' || !args[1] || args[1].startsWith('--')) {
    throw Error('Usage: node continue-discovery.mjs --root /explicit/path/to/skills');
  }
  const root = path.resolve(args[1]);
  let rootStat;
  try { rootStat = await fsPromises.stat(root); }
  catch { throw Error('Explicit root is unavailable'); }
  if (!rootStat.isDirectory()) throw Error('Explicit root must be a directory');
  const response = await fetch(sourceURL, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw Error(`Continue source fetch failed: HTTP ${response.status}`);
  const discover = discoveryHelper(await response.text());
  let found;
  try { found = await discover(root); }
  catch { throw Error('Explicit root directory discovery failed'); }
  const skills = found.map(file => {
    const relative = path.relative(root, file);
    if (path.isAbsolute(relative) || relative === '..' || relative.startsWith(`..${path.sep}`)) {
      throw Error('Discovered path escaped explicit root');
    }
    return { name: path.basename(path.dirname(file)), path: relative.split(path.sep).join('/') };
  }).sort((a, b) => a.path.localeCompare(b.path));
  console.log(JSON.stringify({
    scope: 'Exact upstream directory discovery helper; no frontmatter parsing or native/model acceptance',
    name_source: 'skill directory basename, not parsed frontmatter',
    source_url: sourceURL,
    source_revision: revision,
    source_sha256: sourceDigest,
    helper_sha256: helperDigest,
    count: skills.length,
    skills,
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
