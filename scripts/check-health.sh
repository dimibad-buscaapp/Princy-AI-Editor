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

FRONTEND_PORT=$(read_env FRONTEND_PORT 3400)
API_PORT=$(read_env API_PORT 3401)
AGENTS_PORT=$(read_env AGENTS_PORT 3402)
WORKSPACE_SERVICE_PORT=$(read_env WORKSPACE_SERVICE_PORT 3403)
CONTEXT_GRAPH_PORT=$(read_env CONTEXT_GRAPH_PORT 3404)
MEMORY_SERVICE_PORT=$(read_env MEMORY_SERVICE_PORT 3405)
AUTOMATION_SERVICE_PORT=$(read_env AUTOMATION_SERVICE_PORT 3406)
GATEWAY_PORT=$(read_env GATEWAY_PORT 3407)
MCP_SERVER_PORT=$(read_env MCP_SERVER_PORT 3408)

check() {
  local name="$1"
  local url="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$url" 2>/dev/null || echo "000")
  if [[ "$code" =~ ^[23] ]]; then
    echo "OK   $name ($code) $url"
  else
    echo "FAIL $name ($code) $url"
  fi
}

echo "=== Princy Health Check (Linux) ==="

check "Frontend" "http://127.0.0.1:${FRONTEND_PORT}/"
check "API" "http://127.0.0.1:${API_PORT}/health/live"
check "Agents" "http://127.0.0.1:${AGENTS_PORT}/health/live"
check "Workspace" "http://127.0.0.1:${WORKSPACE_SERVICE_PORT}/health/live"
check "Context Graph" "http://127.0.0.1:${CONTEXT_GRAPH_PORT}/health/live"
check "Memory" "http://127.0.0.1:${MEMORY_SERVICE_PORT}/health/live"
check "Automation" "http://127.0.0.1:${AUTOMATION_SERVICE_PORT}/health/live"
check "Gateway" "http://127.0.0.1:${GATEWAY_PORT}/health/live"
check "Gateway Ready" "http://127.0.0.1:${GATEWAY_PORT}/gateway/ready"
check "System Health" "http://127.0.0.1:${GATEWAY_PORT}/api/system/health"
check "OpenAI Models" "http://127.0.0.1:${GATEWAY_PORT}/v1/models"
check "Neural Core" "http://127.0.0.1:${AGENTS_PORT}/health/neural"
check "MCP" "http://127.0.0.1:${MCP_SERVER_PORT}/health/live"
check "Ollama" "http://127.0.0.1:11434/api/tags"

if command -v redis-cli >/dev/null 2>&1; then
  if redis-cli ping 2>/dev/null | grep -q PONG; then
    echo "OK   Redis (PONG)"
  else
    echo "FAIL Redis (no PONG)"
  fi
else
  echo "SKIP Redis (redis-cli not installed)"
fi

echo "=== Done ==="
