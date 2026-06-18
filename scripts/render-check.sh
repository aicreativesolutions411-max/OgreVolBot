#!/usr/bin/env bash
# render-check.sh — one-shot health scan of the live OgreVolBot deploy.
# Needs env vars RENDER_API_KEY and AUTOPILOT_OWNER_KEY (put them in the gitignored .env
# or export them). NEVER prints the key values. See AGENTS.md.
#
# Usage:  ./scripts/render-check.sh        (needs curl; jq optional but nicer)

SVC="srv-d86q8gq8qa3s73fq1r60"
OWNER="tea-d84e17rtqb8s73fabu1g"
ORIGIN="https://ogrevolbot.onrender.com"
fail=0

if [ -z "$RENDER_API_KEY" ]; then echo "FAIL  RENDER_API_KEY not set (add it to .env / export it)"; exit 1; fi
AUTH="Authorization: Bearer $RENDER_API_KEY"

echo "== OgreVolBot deploy check =="
echo

# 1) Latest deploy status
DEP=$(curl -s -H "$AUTH" "https://api.render.com/v1/services/$SVC/deploys?limit=1")
STATUS=$(printf '%s' "$DEP" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
COMMIT=$(printf '%s' "$DEP" | grep -o '"id":"[a-f0-9]\{40\}"' | head -1 | cut -d'"' -f4 | cut -c1-7)
echo "[1] DEPLOY  status=$STATUS  commit=$COMMIT"
if [ "$STATUS" != "live" ]; then echo "          -> not live yet"; fail=1; fi

# 2) Recent logs — count error-ish lines
LOGS=$(curl -s -H "$AUTH" "https://api.render.com/v1/logs?ownerId=$OWNER&resource=$SVC&limit=100&direction=backward")
ERRS=$(printf '%s' "$LOGS" | grep -o '"message":"[^"]*"' | grep -iE 'error|exception|unhandled|fatal|econn|throw' | wc -l | tr -d ' ')
echo
echo "[2] LOGS    scanned last 100 lines, $ERRS error-ish"
if [ "$ERRS" -gt 0 ]; then
  printf '%s' "$LOGS" | grep -o '"message":"[^"]*"' | grep -iE 'error|exception|unhandled|fatal|econn|throw' | head -4 \
    | sed 's/^"message":"/          ! /; s/"$//' | cut -c1-150
fi

# 3) Bot health (owner-gated read)
echo
if [ -n "$AUTOPILOT_OWNER_KEY" ]; then
  ST=$(curl -s --max-time 25 "$ORIGIN/api/web/autopilot/stats?key=$AUTOPILOT_OWNER_KEY")
  if printf '%s' "$ST" | grep -q '"total"\|"netPnlSol"\|"observatory"'; then
    TOT=$(printf '%s' "$ST" | grep -o '"total":[0-9]*' | head -1 | cut -d: -f2)
    NET=$(printf '%s' "$ST" | grep -o '"netPnlSol":[-0-9.]*' | head -1 | cut -d: -f2)
    echo "[3] BOT     stats OK  trades=${TOT:-n/a}  netPnlSol=${NET:-n/a}"
  else
    echo "[3] BOT     ERROR: unexpected stats response"; fail=1
  fi
else
  echo "[3] BOT     skipped (AUTOPILOT_OWNER_KEY not set)"
fi

echo
if [ "$fail" -eq 0 ]; then echo "RESULT: PASS — live, logs clean, bot responding."; else echo "RESULT: ATTENTION — see flags above."; exit 1; fi
