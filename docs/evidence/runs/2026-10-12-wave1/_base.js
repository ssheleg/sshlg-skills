'use strict';
/**
 * Shared by the wave-1 measurement scripts: materialise `hooks/`, `lib/` and
 * `package.json` of a git revision into a temporary directory, so a script can run the
 * code of that revision beside the working tree's without checking anything out.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = path.resolve(__dirname, '..', '..', '..', '..');

function materialise(rev) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `wave1-${rev.slice(0, 7)}-`));
  const tar = execFileSync('git', ['-C', REPO, 'archive', rev, 'hooks', 'lib', 'package.json']);
  execFileSync('tar', ['-x', '-C', dir], { input: tar });
  return dir;
}

function median(xs) {
  const s = xs.slice().sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
}

module.exports = { REPO, materialise, median };
