#!/bin/bash
# Smoke-test: build + run standalone server.js, hit /api/health, kill.
# Mirrors what Cloud Run will execute.
set -uo pipefail
source /root/.nvm/nvm.sh 2>/dev/null || true
cd "$(dirname "$0")/.."

# Copy static + public into standalone (Cloud Run does this via Dockerfile).
mkdir -p .next/standalone/public
[ -d public ] && cp -r public/. .next/standalone/public/ 2>/dev/null || true
cp -r .next/static .next/standalone/.next/static 2>/dev/null || true

LOG=$(mktemp)
PORT=8080 HOSTNAME=0.0.0.0 NODE_ENV=production \
  GEMINI_API_KEY="${GEMINI_API_KEY:-test_key_for_health_probe}" \
  node .next/standalone/server.js > "$LOG" 2>&1 &
PID=$!

# Wait for ready
for i in $(seq 1 20); do
  if curl -sS -o /dev/null http://127.0.0.1:8080/api/health 2>/dev/null; then
    break
  fi
  sleep 1
done

echo "===== STARTUP LOG ====="
head -20 "$LOG"
echo "===== HEALTH CHECK ====="
curl -sS -w "\nHTTP %{http_code}\n" http://127.0.0.1:8080/api/health || true
echo "===== ROOT CHECK ====="
curl -sS -o /dev/null -w "HTTP %{http_code} | size=%{size_download}\n" http://127.0.0.1:8080/ || true

kill $PID 2>/dev/null
wait 2>/dev/null
rm -f "$LOG"
