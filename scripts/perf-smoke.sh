#!/usr/bin/env bash
set -euo pipefail
GATEWAY="${GATEWAY_URL:-http://127.0.0.1:3407}"

echo "=== Princy Perf Smoke ==="
for path in /api/system/health /api/analytics/usage /api/audit?limit=5; do
  start=$(date +%s%3N)
  code=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY$path" || echo "000")
  end=$(date +%s%3N)
  ms=$((end - start))
  echo "OK   $path ($code) ${ms}ms"
done
echo "=== Done ==="
