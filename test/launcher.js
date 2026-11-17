'use strict';
/**
 * The launcher's code as one text: `bin/sshlg-skills.js` and the command modules cut from
 * it on 2026-11-17 (`lib/cli-*.js`, B-357). A check that reads the launcher's source reads
 * all of it, so moving a function between those files changes nothing the check sees.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function files() {
  const lib = path.join(ROOT, 'lib');
  return [path.join(ROOT, 'bin', 'sshlg-skills.js'),
    ...fs.readdirSync(lib).filter((n) => /^cli-.*\.js$/.test(n)).sort().map((n) => path.join(lib, n))];
}

function source() { return files().map((f) => fs.readFileSync(f, 'utf8')).join('\n'); }

module.exports = { files, source };
