#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

read_env() {
  local key="$1"
  local default="$2"
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

GATEWAY=$(read_env PUBLIC_GATEWAY_URL "http://127.0.0.1:3407")
GATEWAY="${GATEWAY%/}"

fail=0

check() {
  local name="$1"
  local url="$2"
  local expect="$3"
  local extra="${4:-}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 $extra "$url" 2>/dev/null)
  code="${code:-000}"
  if [[ "$code" =~ $expect ]]; then
    echo "OK   $name ($code) $url"
  else
    echo "FAIL $name ($code, expected $expect) $url"
    fail=1
  fi
}

echo "=== Princy Route Verification ==="
echo "Gateway: $GATEWAY"

if grep -R "api/api" apps/frontend/src --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "normalizeApiBase\|/api/api\$"; then
  echo "FAIL Found api/api in frontend source"
  fail=1
else
  echo "OK   No api/api in frontend source"
fi

check "System Health" "$GATEWAY/api/system/health" '^200$'
check "OpenAI Models" "$GATEWAY/v1/models" '^200$'
check "Agents Status" "$GATEWAY/api/agents/status" '^(401|403)$'
check "Agents Metrics" "$GATEWAY/api/agents/metrics" '^(401|403)$'
check "Code Ghost Text" "$GATEWAY/api/code/ghost-text" '^(401|403)$' '-X POST -H Content-Type:application/json -d {}'
check "Code Fix" "$GATEWAY/api/code/fix" '^(401|403)$' '-X POST -H Content-Type:application/json -d {}'
check "Workspace Link" "$GATEWAY/api/workspace/link" '^(401|403)$' '-X POST -H Content-Type:application/json -d {}'
check "Workspace Index" "$GATEWAY/api/workspace/index" '^(401|403)$' '-X POST -H Content-Type:application/json -d {}'
check "Terminal Explain" "$GATEWAY/api/terminal/explain-error" '^(401|403)$' '-X POST -H Content-Type:application/json -d {}'
check "Terminal Fix" "$GATEWAY/api/terminal/fix-error" '^(401|403)$' '-X POST -H Content-Type:application/json -d {}'
check "Memory Project" "$GATEWAY/api/memory/project?projectId=x" '^(401|403)$'
check "Memory Chat Context" "$GATEWAY/api/memory/chat/context" '^(401|403)$'
check "Swarm Tasks" "$GATEWAY/api/swarm/tasks" '^(401|403)$'
check "DevOps Status" "$GATEWAY/api/devops/status" '^(401|403)$'
check "Models Warm" "$GATEWAY/api/models/warm" '^(401|403)$' '-X POST -H Content-Type:application/json -d {}'
check "Router Stats" "$GATEWAY/api/router/stats" '^(401|403)$'
check "Workspace Profile" "$GATEWAY/api/workspace/profile" '^(401|403)$'
check "Marketplace" "$GATEWAY/api/agents/marketplace" '^(401|403)$'
check_sse() {
  local url="$1"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 --max-time 2 "$url" 2>/dev/null || true)
  code="${code:-000}"
  if [[ "$code" == "200" ]]; then
    echo "OK   Events Stream ($code) $url"
  else
    echo "FAIL Events Stream ($code, expected 200) $url"
    fail=1
  fi
}

check_sse "$GATEWAY/api/events/stream"

if [[ "$fail" -ne 0 ]]; then
  echo "=== FAILED ==="
  exit 1
fi

echo "=== All routes OK ==="
