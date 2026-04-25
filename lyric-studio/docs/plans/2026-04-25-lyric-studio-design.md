# Lyric Studio — Design

**Date:** 2026-04-25
**Status:** Locked (validated brainstorm output)
**Working directory:** `/Users/dbeacham/Development/lyric-studio/`

---

## 1. Overview

A localhost-only single-user app for writing lyrics to instrumentals and (later) polishing recorded vocals. The user uploads a finished or near-finished instrumental (e.g., a Suno track), the app analyzes it for tempo/key/structure/feel, and provides a lyric-writing surface aligned to the track's bar/phrase structure, with on-demand AI assistance for rhymes and phrasing polish. A Voice Studio component (deferred to Phase 2) records and processes vocals through a DSP chain.

The user is a hobbyist songwriter with no formal singing training, working primarily with Suno-generated instrumentals. Their voice is "in the pocket" but untrained; they want production help they don't have the expertise to do themselves, while keeping their voice character intact (no cloning, no voice swapping). Lyric writing is theirs — AI assists "as any lyric writer would be helped," not by ghostwriting.

Post-MVP goal: lyric video generation, which informs the export format (per-line bar+timestamp data preserved).

---

## 2. Scope & phasing

### Phase 1 (MVP — build now)

- Project library (multi-project, soft-delete, status badges).
- Lyric Assistant: instrumental analysis → manual section labeling on bar grid → per-line lyric writing with bar anchoring → AI rhyme/polish on demand → AI per-section creative-brief notes.
- Lyrics export (`lyrics.md`, `lyrics.json` with bar+timestamp data) and project zip.
- Playback preview mode (full song plays, current line highlights — proof-of-concept for Phase 3 lyric video).

### Phase 2 (deferred — Voice Studio)

- In-browser vocal recording (AudioWorklet → 48 kHz PCM WAV).
- DSP pipeline: pitch correction (light, key-snap), de-esser, comp, EQ, saturation, reverb, doubling, optional harmony, LUFS-normalized bounce.
- A/B listen with per-stem mixer.
- Stems + bounce export.

### Phase 3 (post-MVP, user-stated goal)

- Lyric video generator. Consumes `lyrics.json` + `instrumental.wav` from Phase 1 exports.

The user covers the audible-demo gap during Phase 1 with AI-generated voice (Suno).

---

## 3. Architecture

Two services on `127.0.0.1`, glued by `start.sh`:

- **`web/`** — Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui. Owns SQLite (singleton on `globalThis`, WAL mode). Talks to audio service over HTTP.
- **`audio_service/`** — Python 3.12+ + FastAPI + librosa + numpy. Stateless except for cached model weights. Phase 1 surface = analysis only (`POST /analyze` returns BPM, key, time signature, downbeat offset, RMS envelope, energy regions).

Phase 1 audio service is fully synchronous (analysis is 3-5 sec). Phase 2 introduces a job tracker (`jobs.py`) for the longer voice pipeline.

Storage:
- **Audio files** (instrumental, takes, bounces): filesystem = source of truth at `data/projects/<id>/`.
- **Metadata** (sections, bars, lyrics, project state): SQLite = source of truth at `data/data.db`.
- `lyrics.json` and `project.json` are *exports written at export time*, not live mirrors.

No auth, no sessions. `.env` holds `ANTHROPIC_API_KEY`. `.gitignore` covers `.env*` and `data/`.

---

## 4. Data model

### Phase 1 schema (`migrations/001_init.sql`)

- `_migrations(name TEXT PRIMARY KEY, ran_at INTEGER)` — migration tracking.
- `projects(id, title, created_at, updated_at, status, instrumental_path, bpm, key, time_sig, duration_ms, downbeat_offset_ms, genre, deleted_at)`.
- `sections(id, project_id, name, bar_start, bar_end, lines_per_phrase, notes, lines_json, created_at, updated_at)`. Sorted by `bar_start ASC` (no explicit `order` field).
- `rhyme_cache(key, json_result, created_at)` keyed by `(word, syllable_budget, genre)`.

`sections.lines_json` is a JSON column:
```json
[
  {"text": "Walking down the boulevard", "bar_start": 5, "bar_end": 6},
  {"text": "Streetlights flicker overhead", "bar_start": 7, "bar_end": 8}
]
```

### Phase 2 additions (`migrations/002_voice.sql`)

- `takes(id, project_id, kind, path, trim_start_ms, trim_end_ms, is_processed, created_at)`.
- `settings(key, value)` — global defaults (last latency calibration, etc.).
- ALTER `projects` ADD `latency_ms`.

### Status enum (Phase 1)

`analyzing → drafting | analysis_failed → lyrics_done`

`drafting` covers both "post-analysis, no sections yet" and "writing in progress" — the data answers "do they have sections" without a status field. `lyrics_done` is user-toggled.

### Migration runner

On web startup, scan `migrations/`, run not-yet-applied files in lexical order inside transactions, insert into `_migrations` on success. Fail-fast on error.

---

## 5. Lyric Assistant flow (Phase 1)

### Project creation

- Title + instrumental upload + genre dropdown (`pop, indie, lofi, rap/hip-hop, rnb, electronic, rock, ballad, folk, other`).
- ffmpeg transcodes to 48 kHz WAV at `data/projects/<id>/instrumental.wav`.
- Synchronous `POST /analyze` returns: `bpm`, `key`, `time_sig`, `duration_ms`, `downbeat_offset_ms`, `rms_envelope` (1 sample / 100 ms), `energy_regions` (heuristic RMS-similarity spans, unnamed, visual-hint only).
- 4/4 only for full features. Non-4/4 → banner + manual bar grid + syllable budget guidance disabled.

### Section editor (single screen, sticky waveform)

- WaveSurfer.js v7 + Regions plugin.
- Bar grid drawn from BPM + downbeat (every-bar lines, every-4-bar bolder, every-8-bar boldest).
- Grey energy region hints (visual only, not editable).
- Drag to create section regions, snap to bar boundaries, no overlaps allowed, gaps allowed (instrumental breaks).
- ←/→ keys nudge whole bar grid by one beat (`downbeat_offset_ms` shift).
- Zoom controls.
- Click-track toggle (Web Audio metronome layered over instrumental during playback).
- UI locked while analysis runs.

### Section card

- Header: name (autocomplete from `Intro / Verse N / Pre-Chorus / Chorus / Bridge / Drop / Breakdown / Outro` with smart `Verse N+1` numbering), bar range, `lines per phrase` chip (default 2).
- AI notes (collapsible, regenerable, editable). Generated by Claude Sonnet 4.6 with prompt caching on track context. Streaming on (notes are longer-form, real benefit).
- Line list with `+ Add line` and `+ Paste lyrics` (paste a multi-line block, auto-split by newline, sequential bar-range assignment).

### Line card

- Bar-range chip (must lie inside parent section).
- Text input.
- Live syllable counter via `syllable` npm package. Thresholds: ≤budget green, +1-2 yellow, +3 red. Budget computed from `bars × beats × syllables_per_beat[genre]`.
- Up/down arrow buttons for reorder (no DnD in MVP).
- Hover-revealed: `[♪ Play bars]` (plays just that line's bar range from instrumental), `[Rhyme]`, `[Polish]`.

### AI buttons

- **Rhyme** → Haiku 4.5. Context: end-word + syllable budget + section notes + same-section lyrics + previous-section lyrics. Returns 5-10 rhymes labeled `perfect | slant`. Cached in `rhyme_cache` keyed by `(word, budget, genre)`. Popover; click to insert.
- **Polish** → Haiku 4.5. Context: full line + section notes + same-section lyrics. Non-streaming (spinner → diff view → accept/dismiss). Single suggestion only; never a full rewrite.
- AI failures show retry in the popover with an actionable message.

### Autosave

250 ms debounced write to `sections.lines_json`. Visible "saved" indicator.

### Playback preview

Full song plays via WaveSurfer; current bar's line highlights as the playhead crosses each line's bar range. Line-level highlighting (not syllable). Validates alignment work; doubles as Phase 3 lyric video proof-of-concept.

### Status flow

`analyzing → drafting | analysis_failed → lyrics_done` (user-toggled).

### Project list / library

Sidebar with all projects, status badges (`instrumental ✓ | sections ✓ | lyrics ✓`), soft-delete to trash. Trash view (`app/trash/page.tsx`) with restore + permanently-delete + empty-trash.

### Settings page (Phase 1)

Minimal: API key status + "Verify API key" button (tiny test call to Claude), default genre, theme (system/dark/light).

### Exports

- `lyrics.md` — title + metadata header + per-section blocks with notes + bar-range-prefixed lines.
- `lyrics.json` — schema below.
- `project.json` — full project state snapshot.
- `<title>.zip` — all of the above + `instrumental.wav`. Phase 2 zips also include `takes/` + `exports/`.

Exports go to `~/Music/lyric-studio/<title-slug>/`.

#### `lyrics.json` schema (Phase 3 contract)

```json
{
  "project": {
    "title": "...",
    "bpm": 95,
    "downbeat_offset_ms": 240,
    "time_sig": "4/4",
    "duration_ms": 245000,
    "genre": "lofi",
    "key": "Cm"
  },
  "sections": [
    {
      "name": "Verse 1",
      "bar_start": 5,
      "bar_end": 12,
      "time_start_ms": 1234,
      "time_end_ms": 5678,
      "notes": "...",
      "lines": [
        {
          "text": "...",
          "bar_start": 5,
          "bar_end": 6,
          "time_start_ms": 1234,
          "time_end_ms": 2456,
          "syllable_count": 14
        }
      ]
    }
  ]
}
```

Both bar ranges and ms timestamps included so the lyric video tool doesn't recompute timing.

---

## 6. Voice Studio flow (Phase 2 — design locked, build deferred)

Always project-linked. No standalone-vocal mode.

### Pre-record

- Device picker; recommends MV7 if found.
- One-time pre-record checklist modal: "☐ Headphones plugged into MV7's jack ☐ MV7 in Manual mode (not Auto)".
- Latency: default `25 ms` for MV7+macOS USB Class. Manual A/B test in settings: record a 4-bar click test, app processes with 0/25/50 ms compensation, user picks tightest. Stored as `projects.latency_ms` (per-project) + global default in `settings`.
- Mic permission errors are actionable (browser-specific instructions).

### Recording

- AudioWorklet → 48 kHz / 32-bit float PCM → WAV in browser → upload (lossless; not Opus).
- 2-bar count-in click track (Web Audio synthesis).
- Live level meter; warning if peaks > -6 dBFS.
- Stop only (no pause). Multi-take per project.
- 15 min hard cap, soft warning at 10 min.

### Take trim

In/out point selectors on take waveform before processing. Persisted as `takes.trim_start_ms` / `trim_end_ms`. Untrained singers will use this constantly.

### Pipeline (6 stages, polled progress in Phase 2)

1. Trim & resample.
2. Pitch correction: `librosa.pyin` for f0 → snap to nearest note in detected key (≤50 cent fixes only) → emit rubberband-cli pitch envelope → `rubberband-cli` with `--pitch-curve <envelope>` for time-varying correction with formant preservation. Per-take toggle (default on; off for spoken/rap).
3. Chain: HPF (80 Hz) → custom de-esser (5-9 kHz bandpass + aggressive comp at 4:1, -25 dB threshold + numpy mix at -3 dB) → pedalboard Compressor → pedalboard EQ (genre preset) → pedalboard Distortion (subtle) → 20 ms manual pre-delay → pedalboard Reverb (genre preset, ~15-20% wet).
4. Doubling: ±12 cents pitch shift, ±7 ms delay, 70% L/R pan. Always on.
5. Optional harmony: lead pitched up a 3rd, key-snapped. Default off. Chord-tone-aware harmony is post-MVP.
6. Bounce: instrumental at -6 dB with a 2-3 dB scoop at 2-4 kHz (carves vocal space without sidechain), lead 0 dB, double -6 dB per side, harmony -9 dB. `pyloudnorm` normalize to -14 LUFS.

### Stems output

`lead-raw.wav`, `lead-tuned.wav`, `lead-double-L.wav`, `lead-double-R.wav`, `lead-harmony.wav` (if enabled), `instrumental.wav`, `bounce.wav`.

### Listen / A/B

- Single waveform, source toggle (Raw + Inst ↔ Processed full mix).
- Per-stem mixer panel below (solo/mute per stem).

### Re-process

Always full pipeline rerun (no per-change optimization for MVP). Replaces bounce; takes preserved.

### Genre presets

Hardcoded in `audio_service/presets.py`. User can't tweak knobs in Phase 2. Knob exposure is post-MVP.

### Pitch-correction quality risk (acknowledged)

OSS pyin + rubberband-cli envelope produces light, professional-sounding correction for in-pocket vocals. It will not match Antares/Auto-Tune Pro. Escape hatch: `pedalboard.load_plugin()` supports VST3/AU, so if quality underdelivers, evaluate iZotope Nectar 4 (~$99-249 on sale) via its 10-day trial on the user's actual voice on actual songs. Architecture supports plugin hosting cleanly with no rework.

---

## 7. File layout

```
lyric-studio/
├── start.sh                         # boots web + audio_service, waits for health
├── doctor.sh                        # preflight: ffmpeg, libsndfile, node>=20, pnpm, python>=3.12, uv, .env w/ ANTHROPIC_API_KEY
├── .env.example
├── .gitignore                       # .env*, data/
├── README.md
├── docs/plans/                      # this design doc + future plans
├── web/                             # Next.js 16 + TS + Tailwind + shadcn
│   ├── app/
│   │   ├── page.tsx                 # project list (sidebar + grid)
│   │   ├── projects/new/page.tsx
│   │   ├── projects/[id]/page.tsx   # section editor + lyric writer (single screen, sticky waveform)
│   │   ├── trash/page.tsx
│   │   ├── settings/page.tsx
│   │   └── api/
│   │       ├── projects/[...]
│   │       ├── analyze/route.ts
│   │       ├── ai/section-notes/route.ts
│   │       ├── ai/rhyme/route.ts
│   │       ├── ai/polish/route.ts
│   │       └── export/[id]/route.ts
│   ├── lib/
│   │   ├── db.ts                    # better-sqlite3 singleton on globalThis, WAL
│   │   ├── migrations.ts            # runs migrations/*.sql in order, _migrations table
│   │   ├── audio-service.ts
│   │   ├── claude.ts                # Anthropic SDK + prompt caching
│   │   └── syllables.ts             # `syllable` npm wrapper
│   ├── components/
│   │   ├── waveform/                # WaveSurfer.js v7 + Regions
│   │   ├── section-card/
│   │   ├── line-card/
│   │   ├── rhyme-popover/
│   │   └── polish-popover/
│   └── migrations/
│       └── 001_init.sql
├── audio_service/                   # FastAPI + librosa + numpy
│   ├── pyproject.toml
│   ├── main.py
│   ├── analyze.py                   # bpm, key, beats, downbeat, RMS, energy regions
│   ├── features.py                  # per-section feature extraction for AI notes
│   └── (Phase 2: jobs.py, chain.py, tune.py, presets.py, bounce.py)
└── data/                            # gitignored
    ├── data.db
    └── projects/<id>/
        ├── instrumental.wav
        └── (Phase 2) takes/, exports/
```

---

## 8. Tech stack

- **Web:** Next.js 16 (App Router), TypeScript, Tailwind, shadcn/ui, WaveSurfer.js v7, `better-sqlite3`, `syllable` (npm), `@anthropic-ai/sdk`.
- **Audio service (Phase 1):** Python 3.12+, FastAPI, `librosa`, `numpy`, `ffmpeg` (system).
- **Audio service (Phase 2 additions):** `pedalboard`, `pyrubberband` + `rubberband-cli` (system), `pyloudnorm`.
- **AI:** Claude Sonnet 4.6 (per-section notes, streaming), Haiku 4.5 (rhyme/polish, polish non-streamed). Prompt caching on track context.

---

## 9. Open risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Phase 2 pitch-correction quality | Medium | Medium-high | Architecture supports `pedalboard.load_plugin()`. Trial Nectar 4 if OSS underdelivers. |
| Tempo drift on non-Suno tracks | Low | Medium | Document MVP supports quantized/produced tracks; live/rubato breaks bar grid. Manual downbeat shift handles single-bar offsets only. |
| AI per-section notes generic on niche genres | Medium | Low | Notes are editable; user can rewrite. |
| Bar-per-line default (2) doesn't match user style | Low | Low | Per-section override chip. |
| AudioWorklet cross-browser quirks | Low | Low | Targeting Chrome on macOS. |

---

## 10. Key decisions and rejected alternatives

- **Standalone app, not extension of `personal-songsmith`** — fresh start, no mixed contexts. `personal-songsmith` is being deprecated.
- **Instrumental-only upload** (Q3 = "the instrumental *is* the melody"). No separate humming/melody capture step.
- **Bar/phrase-level alignment** (B), not section-level (too loose) or syllable/beat-level (over-engineered for drafting).
- **Auto BPM/bars + manual sections + RMS energy hints + downbeat shift** — auto-section-detection rejected (model maintenance cost > manual labeling cost; ML segmentation models are unreliable on Suno-style tracks).
- **Two independent tools, shared project entity** — not one rigid linear workflow, not two unrelated tools.
- **B chain + per-take auto-tune toggle + fixed presets** — not reference-matched chain (deferred), not AI black-box mastering (loses control), not manual mixing surface (DAW-in-app).
- **Stacked vocals (auto-double + optional harmony)**, not single vocal — matches user's "untrained voice needs production help" reality.
- **Rhyme + Polish suggestions only**, not full-line generation or "continue mode" — preserves user's authorial voice.
- **In-browser recording with upload fallback** (build in-browser first).
- **Localhost-only single user, no auth, SQLite + filesystem** — not multi-user SaaS, not self-hosted-cloud, not local-first-syncable. Single-user creative tool, not a product.
- **Next.js (web) + Python FastAPI (DSP)** — not all-TypeScript (locks out Python audio ecosystem), not all-Python (HTMX is wrong for this UI), not Supabase (3 GB Docker pull for kv+blob is overkill).
- **Per-section AI micro-notes** (D), not minimal facts, not paragraph producer's notes — context lands at the right time.
- **Claude (Sonnet 4.6 + Haiku 4.5)** — already in the ecosystem, costs trivial for single-user, prompt caching available.
- **JSON-column lyrics, not per-line table rows** — lyrics are a structured blob, not a relation. No cross-song queries justify the normalization cost.
- **Multi-project library with status badges**, not single-active-project. Songwriting is non-linear.
- **Lyrics doc + project zip** export — preserves lyric video timing data for Phase 3.
- **OSS DSP first, plugin-host fallback**, not commercial-from-day-one. Ten-day Nectar trial available if quality underdelivers.

---

## 11. Cost notes

- **Recurring:** ~$5-15/year for Claude API (lyrics only). Voice Studio uses zero APIs.
- **One-time:** $0 (all OSS for MVP).
- **Optional fallback (Phase 2):** ~$99-249 one-time for iZotope Nectar 4 if OSS pitch correction underdelivers. Single VST3 hosted by `pedalboard.load_plugin()` would replace much of the custom DSP.
- **Hardware:** already owned (Shure MV7 USB).

---

## 12. Next steps

1. Set up isolated workspace via `superpowers:using-git-worktrees`.
2. Create detailed Phase 1 implementation plan via `superpowers:writing-plans`.
3. Execute plan in batches with review checkpoints (`superpowers:executing-plans` or `superpowers:subagent-driven-development`).
4. After Phase 1 ship: revisit Phase 2 voice work with real lyric/project data to inform DSP tuning.
