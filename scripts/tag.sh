#!/usr/bin/env bash
# Annotated tag at the current clean commit. Existing refs are never rewritten.
# This helper does not certify CI; release-watch.js adds exact-candidate checks.
set -euo pipefail
cd "$(dirname "$0")/.."
node - "$@" <<'JS'
const W = require('./lib/releasewatch');
const args = process.argv.slice(2);
if (!args[0] || args.length > 2 || (args[1] && args[1] !== '--push')) {
  console.error('usage: scripts/tag.sh vX.Y.Z [--push]'); process.exit(1);
}
try {
  const repo = process.cwd();
  const sha = W.command(repo, 'git', ['rev-parse', 'HEAD']);
  console.log(JSON.stringify(W.safeTag(repo, args[0], sha, args[1] === '--push')));
} catch (e) { console.error(e.message); process.exit(1); }
JS
