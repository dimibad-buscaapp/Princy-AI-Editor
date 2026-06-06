#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

read_env() {
  local key="$1"
  local default="${2:-}"
  if [[ -n "${!key:-}" ]]; then
    echo "${!key}"
    return
  fi
  if [[ -f .env ]]; then
    local val
    val=$(grep -m1 "^${key}=" .env 2>/dev/null | cut -d= -f2- | tr -d '\r' | sed 's/^"\(.*\)"$/\1/')
    if [[ -n "$val" ]]; then
      echo "$val"
      return
    fi
  fi
  echo "$default"
}

BASE_URL="${BASE_URL:-$(read_env BASE_URL "http://127.0.0.1:3407")}"
JWT_SECRET="$(read_env JWT_SECRET "")"
USER_EMAIL="${USER_EMAIL:-$(read_env USER_EMAIL "")}"
DATABASE_URL="$(read_env DATABASE_URL "")"

FAILURES=0
PASSED=0

fail() {
  echo "FAIL $*"
  FAILURES=$((FAILURES + 1))
}

pass() {
  echo "OK   $*"
  PASSED=$((PASSED + 1))
}

status_matches() {
  local actual="$1"
  local expected="$2"
  if [[ "$expected" == *"|"* ]]; then
    local part
    IFS='|' read -ra parts <<< "$expected"
    for part in "${parts[@]}"; do
      if [[ "$actual" == "$part" ]]; then
        return 0
      fi
    done
    return 1
  fi
  [[ "$actual" == "$expected" ]]
}

check_route() {
  local method="$1"
  local path="$2"
  local expected="$3"
  local label="${4:-$method $path => $expected}"

  local code
  if [[ "$method" == "POST" ]]; then
    code=$(curl -s -o /dev/null -w "%{http_code}" \
      -X POST \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{"smoke":true,"source":"auth-smoke"}' \
      "${BASE_URL}${path}" 2>/dev/null || echo "000")
  else
    code=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "Authorization: Bearer ${TOKEN}" \
      "${BASE_URL}${path}" 2>/dev/null || echo "000")
  fi

  if status_matches "$code" "$expected"; then
    pass "$label ($code)"
  else
    fail "$label (got $code, expected $expected)"
  fi
}

echo "=== Princy Auth Smoke (RC1) ==="
echo "BASE_URL=$BASE_URL"

if [[ -z "$JWT_SECRET" || ${#JWT_SECRET} -lt 32 ]]; then
  echo "FAIL JWT_SECRET missing or too short (min 32 chars). Set env or .env."
  exit 1
fi

if [[ -z "$DATABASE_URL" ]]; then
  echo "FAIL DATABASE_URL missing. Set env or .env."
  exit 1
fi

if [[ -n "$USER_EMAIL" ]]; then
  read -r SMOKE_USER_ID SMOKE_USER_EMAIL SMOKE_USER_ROLE < <(
    psql "$DATABASE_URL" -t -A -F ' ' -c \
      "SELECT id, email, role FROM \"User\" WHERE email = '${USER_EMAIL//\'/\'\'}' LIMIT 1;" 2>/dev/null || true
  )
else
  read -r SMOKE_USER_ID SMOKE_USER_EMAIL SMOKE_USER_ROLE < <(
    psql "$DATABASE_URL" -t -A -F ' ' -c \
      "SELECT id, email, role FROM \"User\" WHERE role = 'ADMIN' ORDER BY email LIMIT 1;" 2>/dev/null || true
  )
fi

if [[ -z "${SMOKE_USER_ID:-}" || -z "${SMOKE_USER_EMAIL:-}" || -z "${SMOKE_USER_ROLE:-}" ]]; then
  echo "FAIL No ADMIN user found for auth smoke (USER_EMAIL=${USER_EMAIL:-<auto>})."
  exit 1
fi

echo "USER=$SMOKE_USER_EMAIL role=$SMOKE_USER_ROLE"

export JWT_SECRET
export SMOKE_USER_ID SMOKE_USER_EMAIL SMOKE_USER_ROLE
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
process.stdout.write(
  jwt.sign(
    { sub: process.env.SMOKE_USER_ID, email: process.env.SMOKE_USER_EMAIL, role: process.env.SMOKE_USER_ROLE },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )
);
")

if [[ -z "$TOKEN" ]]; then
  echo "FAIL Could not generate JWT."
  exit 1
fi

check_route GET  "/api/scheduler/status"              "200"
check_route POST "/api/scheduler/enqueue"             "201|200"
check_route GET  "/api/sync/status"                   "200"
check_route GET  "/api/agents/self-improvement/stats" "200"
check_route GET  "/api/audit"                         "200"
check_route GET  "/api/analytics/usage"               "200"
check_route GET  "/api/swarm/runs"                    "200"
check_route GET  "/api/autonomous/projects"           "200"
check_route GET  "/api/orgs"                          "200"
check_route GET  "/api/teams"                         "200"
check_route GET  "/api/workers"                       "200"
check_route GET  "/api/routing/policy/default"        "200"
check_route GET  "/api/agents/task-learning/patterns" "200"
check_route GET  "/api/agents/architect/memory"         "200"
check_route GET  "/api/agents/marketplace"            "200"
check_route GET  "/api/agents/store/agents"           "200"
check_route GET  "/api/agents/store/templates"        "200"
check_route GET  "/api/agents/store/mcp"              "200"
check_route GET  "/api/agents/store/themes"           "200"
check_route GET  "/api/memory/team/demo-team"         "403" "GET /api/memory/team/demo-team => 403 (expected forbidden)"

echo "=== Summary: $PASSED passed, $FAILURES failed ==="

if [[ "$FAILURES" -gt 0 ]]; then
  echo "=== Auth Smoke FAILED ==="
  exit 1
fi

echo "=== Auth Smoke OK ==="
