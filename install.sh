#!/usr/bin/env bash
# Bootstrap the ssheleg skill family everywhere.
# Clones this umbrella (with submodules) if run standalone, then runs the launcher.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -f "$HERE/bin/sshlg-skills.js" ]]; then
  echo "run this from a checkout of ssheleg/sshlg-skills" >&2
  exit 1
fi

# make sure submodules are present (harmless if already there)
if [[ -f "$HERE/.gitmodules" ]]; then
  git -C "$HERE" submodule update --init --recursive || true
fi

exec node "$HERE/bin/sshlg-skills.js" install "$@"
