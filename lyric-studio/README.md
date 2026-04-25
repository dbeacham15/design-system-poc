# Lyric Studio

Localhost-only single-user app for writing lyrics to instrumentals and (Phase 2) polishing recorded vocals.

See `docs/plans/2026-04-25-lyric-studio-design.md` for the full design.

## Prereqs

- macOS with Homebrew
- `brew install ffmpeg libsndfile node pnpm`
- `curl -LsSf https://astral.sh/uv/install.sh | sh`

## Setup

```bash
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY
./doctor.sh   # verify system
./start.sh    # boots both services
```

Open http://localhost:3000.

## Layout

- `web/` — Next.js + TypeScript UI
- `audio_service/` — Python FastAPI DSP analysis
- `data/` — SQLite + project audio files (gitignored)

## Status

Phase 1 (Lyric Assistant): in development.
