#!/bin/bash
# keep_doujin_api.sh — ensure doujin-api stays running across turn restarts.
set -euo pipefail

SERVICE_DIR="${SERVICE_DIR:-/workspace/chats/64f2ff02c1fdbdd08866196c/site/services/doujin-api}"
PORT="${PORT:-3001}"
LOG="/tmp/doujin-api.log"
VENV_PYTHON="${SERVICE_DIR}/.venv/bin/uvicorn"

# ensure we can wait for the port
WAIT_PORT="${SERVICE_DIR}/../wait_port.sh"
if [ -x "$WAIT_PORT" ]; then
  WAIT_CMD="$WAIT_PORT $PORT 75"
elif command -v ss >/dev/null 2>&1; then
  WAIT_CMD="
    elapsed=0
    while [ \"\$elapsed\" -lt 75 ]; do
      if ss -ltn 2>/dev/null | awk 'NR>1{print \$4}' | grep -qE \":$PORT$\"; then exit 0; fi
      sleep 3
      elapsed=\$((elapsed + 3))
    done
    exit 2
  "
else
  WAIT_CMD="
    elapsed=0
    while [ \"\$elapsed\" -lt 75 ]; do
      if netstat -ltn 2>/dev/null | awk 'NR>1{print \$4}' | grep -qE \":$PORT$\"; then exit 0; fi
      sleep 3
      elapsed=\$((elapsed + 3))
    done
    exit 2
  "
fi

# 1. kill any stale instance
pkill -f "uvicorn main:app" 2>/dev/null || true
sleep 2

# 2. start fresh
cd "$SERVICE_DIR"
export HOME="${HOME:-/workspace/homes/64f2ff02c1fdbdd08866196c}"
nohup "$VENV_PYTHON" main:app --host 0.0.0.0 --port "$PORT" > "$LOG" 2>&1 &
echo "started doujin-api pid=$! port=$PORT"

# 3. wait for LISTEN
eval "$WAIT_CMD" && echo "doujin-api listening on :$PORT" || {
  echo "ERROR: doujin-api did not come up; dumping log:" >&2
  tail -n 40 "$LOG" >&2
  exit 2
}

# 4. quick idempotent smoke test (do not fail the keeper if it flakes)
curl -s -m 30 "http://127.0.0.1:$PORT/manga_id=234850" -o /tmp/dj_keeper.json 2>/dev/null && \
python3 -c "import json;d=json.load(open('/tmp/dj_keeper.json'));assert d.get('title'), 'empty response'" 2>/dev/null && \
echo "doujin-api smoke OK: $(python3 -c 'import json;print(json.load(open(\"/tmp/dj_keeper.json\")).get(\"title\"))')" || \
echo "WARNING: doujin-api smoke check did not return a usable title (continuing anyway)"
