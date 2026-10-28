#!/bin/bash
# wait_port.sh — block until a TCP port is in LISTEN state, or timeout.
set -euo pipefail

PORT="${1:-3001}"
TIMEOUT_SEC="${2:-75}"

elapsed=0
while [ "$elapsed" -lt "$TIMEOUT_SEC" ]; do
  if (ss -ltn 2>/dev/null || netstat -ltn 2>/dev/null) | awk 'NR>1{print $4}' | grep -qE ":${PORT}$"; then
    exit 0
  fi
  sleep 3
  elapsed=$((elapsed + 3))
done

echo "timeout waiting for :${PORT} after ${elapsed}s" >&2
exit 2
