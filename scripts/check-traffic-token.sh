#!/usr/bin/env bash
# Does a token actually grant family-wide traffic? Ask before storing it as a secret.
#
# Why this exists. Repository traffic is admin-only data, and a fine-grained PAT grants it
# only with **Administration: Read-only** on **each** repository named in its scope. A token
# that reads every repo perfectly still returns 403 here, and the failure looks identical to
# a quiet week once it is inside CI. So the token is tested against all ten repositories
# BEFORE it becomes `FAMILY_TRAFFIC_TOKEN`, and this prints which ones answered.
#
# The value never reaches a shell argument, an env file, the transcript or the history: it is
# read with `read -rs` from the terminal and lives only in this process. Nothing is written.
#
#   ./scripts/check-traffic-token.sh          # prompts, then reports per repository
set -uo pipefail
cd "$(dirname "$0")/.."

command -v gh >/dev/null || { echo "gh is not installed" >&2; exit 1; }

REPOS=$(python3 -c "
import json
d=json.load(open('skills.json'))
print(f\"{d['owner']}/sshlg-skills\")
[print(s['repo']) for s in d['skills']]
")

# Three ways in, because the first one needs a terminal and the caller may not have one.
# Run through an agent's `!` prefix, or any wrapper that is not a TTY, `read -rs` reads an
# immediately-closed stdin and reports "no token given" — which blames the operator for
# the harness. Detected and named instead.
TOKEN=""
if [ -n "${1:-}" ] && [ "${1}" = "--env" ]; then
  VAR="${2:?--env needs the NAME of an environment variable, never the token itself}"
  eval "TOKEN=\${$VAR:-}"
  [ -n "$TOKEN" ] || { echo "\$$VAR is empty or unset in this shell" >&2; exit 1; }
elif [ ! -t 0 ]; then
  # Piped: `printf %s "$TOKEN" | ./scripts/check-traffic-token.sh`
  IFS= read -r TOKEN || true
  if [ -z "$TOKEN" ]; then
    cat >&2 <<'EOM'
stdin is not a terminal and nothing was piped in, so there was nothing to read.
This happens when the script runs through an agent, a CI step, or any non-TTY wrapper.

Three ways to give it the token, none of which put the value in a shell argument:

  1. a real terminal            ./scripts/check-traffic-token.sh
  2. piped                      printf %s "$PAT" | ./scripts/check-traffic-token.sh
  3. from a variable, by NAME   ./scripts/check-traffic-token.sh --env PAT

Option 3 reads the variable this shell already holds; the name is the argument,
never the secret.
EOM
    exit 2
  fi
else
  printf 'Paste the token (input hidden), then Enter: '
  read -rs TOKEN
  printf '\n\n'
  [ -n "$TOKEN" ] || { echo "no token given" >&2; exit 1; }
fi

ok=0; bad=0
while IFS= read -r repo; do
  [ -n "$repo" ] || continue
  if out=$(GH_TOKEN="$TOKEN" gh api "repos/$repo/traffic/views" --jq '"views=\(.count) uniques=\(.uniques)"' 2>&1); then
    printf '  \033[32m✓\033[0m %-30s %s\n' "$repo" "$out"
    ok=$((ok+1))
  else
    printf '  \033[31m✗\033[0m %-30s %s\n' "$repo" "$(printf '%s' "$out" | tail -1 | cut -c1-70)"
    bad=$((bad+1))
  fi
done <<< "$REPOS"

unset TOKEN
printf '\n%d of %d repositories readable.\n' "$ok" "$((ok+bad))"

if [ "$bad" -gt 0 ]; then
  cat <<'EOF'

Not all ten answered, so the ledger would record a silent gap for the rest.
A fine-grained PAT needs, for EVERY repository above:

    Repository access .... all ten (or "All repositories")
    Permissions .......... Administration: Read-only
                           Contents:       Read-only

Fix the token's scope, then re-run this. Do not store it yet.
EOF
  exit 1
fi

cat <<'EOF'

All ten answered. Store it — the value is prompted for, never passed as an argument:

    gh secret set FAMILY_TRAFFIC_TOKEN --repo ssheleg/sshlg-skills

Then the daily job stops skipping, and history accumulates past the API's 14-day window.
EOF
