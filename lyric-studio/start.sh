#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Load .env if present
[[ -f .env ]] && set -a && source .env && set +a

WEB_PORT="${WEB_PORT:-3000}"
AUDIO_SERVICE_PORT="${AUDIO_SERVICE_PORT:-8000}"

echo "Starting audio_service on :${AUDIO_SERVICE_PORT}..."
( cd audio_service && uv run uvicorn main:app --host 127.0.0.1 --port "${AUDIO_SERVICE_PORT}" ) &
AUDIO_PID=$!

echo "Starting web on :${WEB_PORT}..."
( cd web && pnpm dev --port "${WEB_PORT}" ) &
WEB_PID=$!

cleanup() { echo "Stopping..."; kill "$AUDIO_PID" "$WEB_PID" 2>/dev/null || true; }
trap cleanup INT TERM

# Wait for both
wait
