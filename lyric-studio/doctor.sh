#!/usr/bin/env bash
set -euo pipefail

fail=0
check() { if "$@" >/dev/null 2>&1; then echo "  OK  $*"; else echo "MISS  $*"; fail=1; fi; }

echo "Checking system tools..."
check command -v ffmpeg
check command -v node
check command -v pnpm
check command -v python3
check command -v uv
check brew list libsndfile

echo
echo "Checking .env..."
if [[ -f .env ]] && grep -q '^ANTHROPIC_API_KEY=.\+' .env; then
  echo "  OK  .env exists with ANTHROPIC_API_KEY set"
else
  echo "MISS  .env missing or ANTHROPIC_API_KEY not set"
  fail=1
fi

echo
echo "When services are running:"
probe() {
  local label=$1 url=$2
  if curl -sf --max-time 2 "$url" >/dev/null 2>&1; then
    echo "  OK  $label ($url)"
  else
    echo "  --  $label ($url) (not running, OK to skip if you haven't started services)"
  fi
}
probe "audio_service /health" "http://127.0.0.1:8000/health"
probe "web              "      "http://127.0.0.1:3000"

echo
if [[ $fail -eq 0 ]]; then echo "All checks passed."; else echo "Issues found."; exit 1; fi
