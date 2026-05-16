#!/bin/bash
# Boot Drift dev server with polling watcher (Termux/Android-safe).
set -e
source /root/.nvm/nvm.sh 2>/dev/null || true
cd "$(dirname "$0")/.."

# Force polling — works in Termux, low-inotify VMs, Docker bind mounts.
export WATCHPACK_POLLING=true
export CHOKIDAR_USEPOLLING=1
export CHOKIDAR_INTERVAL=1000

# Avoid EMFILE — bump open-file limit if shell allows (best effort).
ulimit -n 8192 2>/dev/null || true

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-3000}"

exec node node_modules/next/dist/bin/next dev --hostname "$HOST" --port "$PORT"
