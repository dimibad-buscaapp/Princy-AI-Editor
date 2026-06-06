#!/usr/bin/env bash
set -euo pipefail
GATEWAY="${GATEWAY_URL:-http://127.0.0.1:3407}"

echo "=== Princy RC1 Smoke ==="
curl -sf "$GATEWAY/api/system/health" | head -c 200
echo ""
curl -sf "$GATEWAY/v1/models" | head -c 200
echo ""
bash "$(dirname "$0")/perf-smoke.sh"
echo "Desktop version: $(node -p "require('./apps/desktop/package.json').version")"
echo "=== RC1 OK ==="
