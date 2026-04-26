# Lyric Studio

Localhost-only single-user app for writing lyrics to instrumentals (Phase 1) and (Phase 2) polishing recorded vocals.

## Status

Phase 1 (Lyric Assistant): **partial** — lyric writing, sections, exports, playback complete. AI features (per-section notes, rhyme, polish, settings page) deferred until `ANTHROPIC_API_KEY` is configured.

## Prereqs

- macOS with Homebrew
- `brew install ffmpeg libsndfile node pnpm`
- `curl -LsSf https://astral.sh/uv/install.sh | sh`

## Setup

```bash
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY
./doctor.sh   # verify system + (optionally) running services
./start.sh    # boots both services
```

Open http://localhost:3000.

## Architecture

Two processes managed by `start.sh`:

- `web/` — Next.js + TypeScript UI on `:3000`. Owns SQLite (via Prisma migrations), exports, AI calls, and audio playback.
- `audio_service/` — Python FastAPI on `:8000`. Stateless DSP: BPM/key/genre detection, section feature extraction (energy, brightness). Exposes `/health`, `/analyze`, `/features`.
- `data/` — SQLite DB + per-project audio files (gitignored).
- Exports are written to `~/Music/lyric-studio/<slug>/` (lyrics.md, lyrics.json, project.json) and zipped on demand.

Authoritative design + plan:

- `docs/plans/2026-04-25-lyric-studio-design.md` — full design (data model, AI prompts, export contract, Phase 2/3 surface).
- `docs/plans/2026-04-25-lyric-studio-phase-1-plan.md` — Phase 1 implementation plan, task by task.

## How to use

1. `./doctor.sh` — confirm prereqs and `.env`.
2. `./start.sh` — boots `audio_service` (`:8000`) and `web` (`:3000`).
3. Open http://localhost:3000.
4. **New project** — drop in an MP3/WAV instrumental. Wait for analysis (BPM, key, genre).
5. **Sections** — drag on the waveform to create sections. Rename, set lines-per-phrase, nudge the downbeat if needed.
6. **Lyrics** — add lines under each section. Syllable counter updates as you type. Autosave is on.
7. *(Deferred)* **AI helpers** — generate per-section notes, request rhymes, polish a line. Wired by Tasks 16/18/19.
8. **Playback** — press ▶ for full project; press [♪] on a single line to scrub just that bar range.
9. **Export** — Download zip writes `lyrics.md`, `lyrics.json`, `project.json` to `~/Music/lyric-studio/<slug>/`.
10. **Trash** — soft-delete a project from the library; restore or permanently delete from `/trash`.

See `docs/MANUAL_SMOKE.md` for the full end-to-end smoke checklist.

## Layout

- `web/` — Next.js + TypeScript UI
- `audio_service/` — Python FastAPI DSP analysis
- `data/` — SQLite + project audio files (gitignored)
- `docs/` — design + plans + manual smoke checklist

## Roadmap

**Phase 1 — Lyric Assistant (in progress):**

- ✅ Project library, soft-delete, trash
- ✅ Instrumental upload + DSP analysis
- ✅ Section editor (bar grid, drag-to-create, energy hints)
- ✅ Lyric line cards with syllable counter + autosave
- ✅ Playback preview with line-level highlighting
- ✅ Per-line `[♪ Play bars]`
- ✅ Exports: lyrics.md, lyrics.json, project.json, zip
- ⏳ Per-section AI notes (Sonnet 4.6, prompt-cached) — Task 16
- ⏳ Rhyme suggestions (Haiku 4.5, persistent cache) — Task 18
- ⏳ Polish suggestions (Haiku 4.5, diff popover) — Task 19
- ⏳ Settings page with API key verify — Task 20

**Phase 2 — Voice Studio:** record vocal takes against an instrumental, align takes to bars, comp lines from multiple takes, render a vocal stem. Own plan (TBD).

**Phase 3 — Lyric video generator:** consume `lyrics.json` (per-line `time_start_ms`/`time_end_ms`) to render a synced lyric video. Own plan (TBD).

**Out of scope (intentionally):** voice studio, video generator, multi-user / cloud / auth, drag-and-drop reorder, knob-tweaking AI behavior.
