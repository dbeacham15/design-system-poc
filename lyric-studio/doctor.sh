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
if [[ $fail -eq 0 ]]; then echo "All checks passed."; else echo "Issues found."; exit 1; fi
