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

printf 'Paste the token (input hidden), then Enter: '
read -rs TOKEN
printf '\n\n'
[ -n "$TOKEN" ] || { echo "no token given" >&2; exit 1; }

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
