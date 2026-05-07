#!/usr/bin/env bash
# Lists every McKenzie-related Make.com scenario for our team.
# Run when a new campaign goes live so we can confirm the Make scenario
# is wired up, see its hookId, and grab the webhook URL for n8n config.
#
# Usage:  MAKE_API_TOKEN=<token> ./scripts/make/inventory.sh
#
# The token belongs to the Modern Amenities Make.com account (team 285569,
# zone us2). Lujan owns the workspace; Ahmad has admin via API key.

set -euo pipefail

if [[ -z "${MAKE_API_TOKEN:-}" ]]; then
  echo "MAKE_API_TOKEN env var is required" >&2
  exit 1
fi

TEAM_ID="${MAKE_TEAM_ID:-285569}"
ZONE="${MAKE_ZONE:-us2}"
KEYWORDS="${MAKE_KEYWORDS:-mckenzie,sewon,tourist,museum,acquisition,bank,credit union,school,construction}"

curl -fsS -H "Authorization: Token $MAKE_API_TOKEN" \
  "https://${ZONE}.make.com/api/v2/scenarios?teamId=${TEAM_ID}" \
  | python3 -c "
import sys, json, os
keys = [k.strip().lower() for k in os.environ['KEYWORDS'].split(',')]
d = json.load(sys.stdin)
for s in d.get('scenarios', []):
    if any(k in s.get('name','').lower() for k in keys):
        print(f\"[{s.get('id')}] active={s.get('isActive')} hook={s.get('hookId')}  {s.get('name')!r}\")
" 2>&1
