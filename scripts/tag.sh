#!/usr/bin/env bash
# Cut the release tag, ANNOTATED, with its CHANGELOG section as the message.
#
# Exists because the step it replaces was remembered rather than mechanised, and on
# 2026-08-20 all eight members and the umbrella carried lightweight tags for their
# newest release. `git describe` — and therefore `git submodule status` — prefers an
# annotated tag and ignores a lightweight one, so the umbrella reported every member
# at its PREVIOUS version while every pin was correct. Nothing was broken and
# everything read wrong, which is the worst shape a release fact can take.
#
# Usage:  scripts/tag.sh v0.91.0        # tag HEAD, message from CHANGELOG.md
#         scripts/tag.sh v0.91.0 --push
set -euo pipefail
cd "$(dirname "$0")/.."

TAG="${1:?usage: scripts/tag.sh vX.Y.Z [--push]}"
VER="${TAG#v}"
PUSH="${2:-}"

PKG=$(python3 -c "import json;print(json.load(open('package.json'))['version'])")
if [ "$PKG" != "$VER" ]; then
  echo "package.json says $PKG, the tag says $VER — bump first, tag second." >&2
  exit 1
fi

# The CHANGELOG section for this version, so the tag object carries what shipped.
BODY=$(python3 - "$VER" <<'PY'
import re, sys
ver = sys.argv[1]
text = open('CHANGELOG.md', encoding='utf-8').read()
m = re.search(r'^##+ \[?v?' + re.escape(ver) + r'\]?[^\n]*\n(.*?)(?=\n##+ |\Z)',
              text, re.S | re.M)
print((m.group(1).strip() if m else '').strip())
PY
)
if [ -z "$BODY" ]; then
  echo "CHANGELOG.md has no section for $VER — a tag with no notes is a tag nobody can read." >&2
  exit 1
fi

if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  KIND=$(git cat-file -t "$TAG")
  if [ "$KIND" = "tag" ]; then
    echo "$TAG already exists and is annotated — nothing to do."
    exit 0
  fi
  echo "$TAG exists as a $KIND; replacing it in place at the same commit."
  git tag -d "$TAG" >/dev/null
fi

printf '%s\n\n%s\n' "$TAG" "$BODY" | git tag -a "$TAG" -F -
echo "annotated $TAG at $(git rev-parse --short HEAD)"
git cat-file -t "$TAG"

if [ "$PUSH" = "--push" ]; then
  git push --force origin "refs/tags/$TAG"
  echo "pushed $TAG"
fi
