#!/bin/bash
# Boot next dev with polling, wait for ready, hit /, then kill.
set -uo pipefail
source /root/.nvm/nvm.sh 2>/dev/null || true
cd "$(dirname "$0")/.."

export WATCHPACK_POLLING=true
export CHOKIDAR_USEPOLLING=1
export CHOKIDAR_INTERVAL=1000

ulimit -n 8192 2>/dev/null || true

LOG=$(mktemp)
node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3030 > "$LOG" 2>&1 &
PID=$!

# Wait up to 40s for ready
for i in $(seq 1 40); do
  if grep -q "Ready in" "$LOG" 2>/dev/null; then
    break
  fi
  sleep 1
done

echo "===== DEV LOG (boot) ====="
grep -v "EMFILE" "$LOG" | head -60
echo "===== HTTP CHECK ====="
curl -sS -o /tmp/probe-resp.html -w "HTTP %{http_code} | size=%{size_download}\n" http://127.0.0.1:3030/ || true

echo "===== AFTER COMPILE LOG ====="
sleep 5
grep -v "EMFILE" "$LOG" | tail -30

kill $PID 2>/dev/null
wait 2>/dev/null
rm -f "$LOG"
