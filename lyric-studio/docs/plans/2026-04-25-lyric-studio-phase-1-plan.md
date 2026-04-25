# Lyric Studio Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the Lyric Assistant — a localhost-only single-user app where the user uploads an instrumental, labels its sections on a bar grid, writes lyrics anchored to bars with on-demand AI rhyme/polish, and exports lyrics + project zip.

**Architecture:** Two services on `127.0.0.1` glued by `start.sh`. `web/` is Next.js 16 + TypeScript + Tailwind + shadcn/ui owning SQLite (singleton on `globalThis`, WAL mode) and talking to the audio service over HTTP. `audio_service/` is FastAPI + librosa + numpy, fully synchronous in Phase 1 (analysis is 3-5 sec; no job tracker). Audio files = filesystem source of truth at `data/projects/<id>/`; metadata = SQLite source of truth at `data/data.db`. No auth. No worktrees — work happens directly on `main`.

**Tech Stack:** Next.js 16, TypeScript, Tailwind, shadcn/ui, WaveSurfer.js v7, `better-sqlite3`, `syllable` (npm), `@anthropic-ai/sdk`, vitest. Python 3.12+, FastAPI, librosa, numpy, pytest. ffmpeg, libsndfile (system).

**Reference design:** `lyric-studio/docs/plans/2026-04-25-lyric-studio-design.md`. The design doc is authoritative; this plan operationalizes it.

**Scope guardrails (DO NOT do in Phase 1):**
- No `takes` table, no Voice Studio paths, no `jobs.py`, no pitch correction, no recording UI, no `pedalboard`/`pyrubberband`/`pyloudnorm` deps.
- No multi-user features, no auth, no remote deployment.
- No drag-and-drop reordering (use up/down arrows).
- No knob-tweaking on AI behavior.

**Working agreements:**
- TDD throughout. Test first, watch it fail, implement minimally, watch it pass, commit.
- Frequent commits — every task ends with a commit.
- DRY and YAGNI. Don't add unused fields, abstractions, or "for later" hooks.
- Use `pnpm` for the web app, `uv` for the Python service.
- All commands assume `cwd = /Users/dbeacham/Development/lyric-studio/` unless otherwise noted.

---

## Task 0: Pre-flight verification

**Files:** none (read-only system check).

**Step 1: Verify required system tools are installed**

Run:
```bash
which ffmpeg && which node && which pnpm && which python3 && which uv && brew list libsndfile
```
Expected: all paths print, no errors.

If any missing:
- `brew install ffmpeg libsndfile`
- `brew install node@20 && npm i -g pnpm`
- `curl -LsSf https://astral.sh/uv/install.sh | sh`

**Step 2: Verify `ANTHROPIC_API_KEY` is available for later use**

Run:
```bash
echo "${ANTHROPIC_API_KEY:-not set}" | head -c 20 ; echo
```
Expected: prints first 20 chars of the key, NOT "not set". If missing, ask the user for it before proceeding to Task 8.

**Step 3: Confirm we're on the right branch**

Run: `git status && git branch --show-current`
Expected: branch = `main`. Working tree may have other untracked files (other projects in the repo); they should NOT be touched.

---

## Task 1: Project scaffold + start/doctor scripts

**Files:**
- Create: `lyric-studio/.gitignore`
- Create: `lyric-studio/.env.example`
- Create: `lyric-studio/README.md`
- Create: `lyric-studio/doctor.sh`
- Create: `lyric-studio/start.sh`

**Step 1: Create `.gitignore`**

```gitignore
# Local data
data/
.env
.env.local
.env.*.local

# Node / Next
node_modules/
.next/
out/
*.log
.turbo/

# Python
__pycache__/
*.pyc
.venv/
.uv/
dist/
build/
*.egg-info/

# OS
.DS_Store

# Editor
.vscode/
.idea/
```

**Step 2: Create `.env.example`**

```env
# Required: get from https://console.anthropic.com/
ANTHROPIC_API_KEY=

# Optional overrides
WEB_PORT=3000
AUDIO_SERVICE_PORT=8000
```

**Step 3: Create `README.md`**

```markdown
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
```

**Step 4: Create `doctor.sh` (executable)**

```bash
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
```

Run: `chmod +x doctor.sh`

**Step 5: Create `start.sh` (executable, stub)**

```bash
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
```

Run: `chmod +x start.sh`

**Step 6: Run doctor**

Run: `./doctor.sh`
Expected: all OK except possibly the `.env` check if not yet copied. Copy `.env.example` to `.env`, set `ANTHROPIC_API_KEY`, re-run.

**Step 7: Commit**

```bash
git add lyric-studio/.gitignore lyric-studio/.env.example lyric-studio/README.md lyric-studio/doctor.sh lyric-studio/start.sh
git commit -m "$(cat <<'EOF'
chore(lyric-studio): scaffold project skeleton + start/doctor scripts

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Audio service init + health endpoint

**Files:**
- Create: `lyric-studio/audio_service/pyproject.toml`
- Create: `lyric-studio/audio_service/main.py`
- Create: `lyric-studio/audio_service/tests/__init__.py`
- Create: `lyric-studio/audio_service/tests/test_main.py`

**Step 1: Create `pyproject.toml`**

```toml
[project]
name = "audio_service"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.110",
  "uvicorn[standard]>=0.29",
  "librosa>=0.10",
  "numpy>=1.26",
  "soundfile>=0.12",
  "pydantic>=2.6",
  "python-multipart>=0.0.9",
]

[project.optional-dependencies]
dev = ["pytest>=8.0", "httpx>=0.27"]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

**Step 2: Write the failing test for `/health`**

Create `audio_service/tests/test_main.py`:
```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

**Step 3: Run test, expect failure**

Run:
```bash
cd lyric-studio/audio_service
uv sync --extra dev
uv run pytest tests/test_main.py -v
```
Expected: FAIL — `main` module not found.

**Step 4: Create `main.py`**

```python
from fastapi import FastAPI

app = FastAPI(title="Lyric Studio Audio Service", version="0.1.0")

@app.get("/health")
def health():
    return {"status": "ok"}
```

**Step 5: Run test, expect pass**

Run: `uv run pytest tests/test_main.py -v`
Expected: PASS.

**Step 6: Commit**

```bash
git add lyric-studio/audio_service/
git commit -m "feat(audio-service): scaffold FastAPI app with health endpoint"
```

---

## Task 3: Audio service `/analyze` — BPM, key, time signature, duration, downbeat

**Files:**
- Create: `lyric-studio/audio_service/analyze.py`
- Create: `lyric-studio/audio_service/tests/test_analyze.py`
- Create: `lyric-studio/audio_service/tests/fixtures/click_120bpm_4-4.wav` (small fixture)
- Modify: `lyric-studio/audio_service/main.py`

**Step 1: Generate the test fixture**

A small synthetic 4/4 click at 120 BPM, 8 seconds, 48 kHz mono. Generate it once and check it in.

```bash
cd lyric-studio/audio_service
mkdir -p tests/fixtures
uv run python -c "
import numpy as np
import soundfile as sf
sr = 48000
bpm = 120
duration_s = 8
beat_period_s = 60 / bpm
t = np.arange(int(sr * duration_s)) / sr
audio = np.zeros_like(t, dtype=np.float32)
for beat_n in range(int(duration_s * bpm / 60)):
    start = int(beat_n * beat_period_s * sr)
    env = np.exp(-np.arange(2400) / 240)
    click = (np.sin(2*np.pi*1000*np.arange(2400)/sr) * env * 0.6).astype(np.float32)
    end = min(start+2400, len(audio))
    audio[start:end] = click[:end-start]
sf.write('tests/fixtures/click_120bpm_4-4.wav', audio, sr)
print('wrote tests/fixtures/click_120bpm_4-4.wav')
"
```
Expected: prints "wrote ...".

**Step 2: Write the failing test for `analyze_audio`**

Create `audio_service/tests/test_analyze.py`:
```python
from pathlib import Path
from analyze import analyze_audio

FIXTURE = Path(__file__).parent / "fixtures" / "click_120bpm_4-4.wav"

def test_analyze_returns_expected_fields():
    result = analyze_audio(str(FIXTURE))
    assert "bpm" in result
    assert "key" in result
    assert "time_sig" in result
    assert "duration_ms" in result
    assert "downbeat_offset_ms" in result
    assert "rms_envelope" in result
    assert "energy_regions" in result

def test_analyze_bpm_is_close_to_120():
    result = analyze_audio(str(FIXTURE))
    assert 118 <= result["bpm"] <= 122

def test_analyze_duration_is_close_to_8000ms():
    result = analyze_audio(str(FIXTURE))
    assert 7800 <= result["duration_ms"] <= 8200

def test_analyze_rms_envelope_length_matches_duration():
    # 1 sample / 100ms, so 8 sec ≈ 80 samples
    result = analyze_audio(str(FIXTURE))
    assert 78 <= len(result["rms_envelope"]) <= 82
```

**Step 3: Run, expect fail**

Run: `uv run pytest tests/test_analyze.py -v`
Expected: FAIL — `analyze` module not found.

**Step 4: Implement `analyze.py`**

```python
"""Audio analysis: BPM, key, time signature, RMS envelope, energy regions."""
from pathlib import Path
import numpy as np
import librosa


def analyze_audio(wav_path: str) -> dict:
    """Analyze a WAV file and return a structured analysis dict."""
    y, sr = librosa.load(wav_path, sr=48000, mono=True)
    duration_ms = int(len(y) / sr * 1000)

    # BPM + beat tracking
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units="time")
    bpm = float(round(tempo))

    # Downbeat: heuristic — assume first beat is downbeat (4/4 only in MVP)
    downbeat_offset_ms = int(beats[0] * 1000) if len(beats) > 0 else 0

    # Time signature: detect via librosa beat strength autocorrelation; default 4/4
    time_sig = "4/4"  # MVP: assume 4/4. Non-4/4 surfaces a banner in UI.

    # Key detection via chroma + Krumhansl profile
    key = _detect_key(y, sr)

    # RMS envelope: 1 sample / 100ms
    hop_length = int(sr * 0.1)  # 100ms
    rms = librosa.feature.rms(y=y, frame_length=hop_length * 2, hop_length=hop_length)[0]
    rms_envelope = [float(x) for x in rms]

    # Energy regions: heuristic contiguous spans of similar RMS
    energy_regions = _energy_regions(rms_envelope, hop_ms=100)

    return {
        "bpm": bpm,
        "key": key,
        "time_sig": time_sig,
        "duration_ms": duration_ms,
        "downbeat_offset_ms": downbeat_offset_ms,
        "rms_envelope": rms_envelope,
        "energy_regions": energy_regions,
    }


def _detect_key(y: np.ndarray, sr: int) -> str:
    """Krumhansl-Schmuckler key detection. Returns "Cm" / "C" style label."""
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_mean = chroma.mean(axis=1)

    major = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    minor = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

    notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

    best_corr, best_label = -np.inf, "C"
    for i in range(12):
        rolled = np.roll(chroma_mean, -i)
        for profile, suffix in ((major, ""), (minor, "m")):
            c = np.corrcoef(rolled, profile)[0, 1]
            if c > best_corr:
                best_corr, best_label = c, f"{notes[i]}{suffix}"
    return best_label


def _energy_regions(rms: list[float], hop_ms: int) -> list[dict]:
    """Group consecutive samples into low/medium/high regions by RMS quantile."""
    if not rms:
        return []
    arr = np.array(rms)
    p33, p66 = np.percentile(arr, [33, 66])

    def bucket(v: float) -> str:
        if v < p33:
            return "low"
        if v < p66:
            return "medium"
        return "high"

    regions = []
    current_level = bucket(arr[0])
    region_start = 0

    for i in range(1, len(arr)):
        b = bucket(arr[i])
        if b != current_level:
            regions.append({
                "start_ms": region_start * hop_ms,
                "end_ms": i * hop_ms,
                "level": current_level,
            })
            region_start = i
            current_level = b

    regions.append({
        "start_ms": region_start * hop_ms,
        "end_ms": len(arr) * hop_ms,
        "level": current_level,
    })
    return regions
```

**Step 5: Run analyze tests, expect pass**

Run: `uv run pytest tests/test_analyze.py -v`
Expected: all 4 PASS.

**Step 6: Wire `/analyze` endpoint**

Modify `main.py`:
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pathlib import Path
from analyze import analyze_audio

app = FastAPI(title="Lyric Studio Audio Service", version="0.1.0")


class AnalyzeRequest(BaseModel):
    wav_path: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    p = Path(req.wav_path)
    if not p.exists():
        raise HTTPException(404, f"file not found: {req.wav_path}")
    if not p.is_file():
        raise HTTPException(400, f"not a file: {req.wav_path}")
    return analyze_audio(str(p))
```

**Step 7: Add an integration test for `/analyze`**

Append to `tests/test_main.py`:
```python
from pathlib import Path

FIXTURE = Path(__file__).parent / "fixtures" / "click_120bpm_4-4.wav"

def test_analyze_endpoint_returns_bpm():
    response = client.post("/analyze", json={"wav_path": str(FIXTURE)})
    assert response.status_code == 200
    body = response.json()
    assert "bpm" in body
    assert 118 <= body["bpm"] <= 122

def test_analyze_endpoint_404_on_missing_file():
    response = client.post("/analyze", json={"wav_path": "/nonexistent.wav"})
    assert response.status_code == 404
```

**Step 8: Run all tests, expect pass**

Run: `uv run pytest -v`
Expected: all PASS.

**Step 9: Commit**

```bash
git add lyric-studio/audio_service/
git commit -m "feat(audio-service): /analyze endpoint with BPM, key, RMS envelope, energy regions"
```

---

## Task 4: Audio service `/features` — per-section feature extraction for AI notes

**Files:**
- Create: `lyric-studio/audio_service/features.py`
- Create: `lyric-studio/audio_service/tests/test_features.py`
- Modify: `lyric-studio/audio_service/main.py`

**Step 1: Write the failing test**

Create `tests/test_features.py`:
```python
from pathlib import Path
from features import extract_section_features

FIXTURE = Path(__file__).parent / "fixtures" / "click_120bpm_4-4.wav"

def test_extract_returns_expected_fields():
    result = extract_section_features(str(FIXTURE), start_ms=0, end_ms=4000)
    for f in ["rms_mean", "rms_max", "spectral_centroid_hz", "spectral_rolloff_hz",
              "zero_crossing_rate", "harmonic_percussive_ratio", "duration_ms"]:
        assert f in result

def test_extract_duration_matches_request():
    result = extract_section_features(str(FIXTURE), start_ms=1000, end_ms=3000)
    assert 1900 <= result["duration_ms"] <= 2100
```

**Step 2: Run, expect fail**

Run: `uv run pytest tests/test_features.py -v`
Expected: FAIL — `features` module not found.

**Step 3: Implement `features.py`**

```python
"""Per-section feature extraction for AI section-notes prompts."""
import numpy as np
import librosa


def extract_section_features(wav_path: str, start_ms: int, end_ms: int) -> dict:
    """Extract a feature dict for the audio between [start_ms, end_ms]."""
    y_full, sr = librosa.load(wav_path, sr=48000, mono=True)
    start = int(start_ms * sr / 1000)
    end = int(end_ms * sr / 1000)
    y = y_full[start:end]
    if len(y) == 0:
        return _empty_features(end_ms - start_ms)

    rms = librosa.feature.rms(y=y)[0]
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
    zcr = librosa.feature.zero_crossing_rate(y)[0]

    y_h, y_p = librosa.effects.hpss(y)
    hp_ratio = float(np.sum(np.abs(y_h)) / (np.sum(np.abs(y_p)) + 1e-9))

    return {
        "rms_mean": float(rms.mean()),
        "rms_max": float(rms.max()),
        "spectral_centroid_hz": float(centroid.mean()),
        "spectral_rolloff_hz": float(rolloff.mean()),
        "zero_crossing_rate": float(zcr.mean()),
        "harmonic_percussive_ratio": hp_ratio,
        "duration_ms": end_ms - start_ms,
    }


def _empty_features(duration_ms: int) -> dict:
    return {
        "rms_mean": 0.0, "rms_max": 0.0,
        "spectral_centroid_hz": 0.0, "spectral_rolloff_hz": 0.0,
        "zero_crossing_rate": 0.0, "harmonic_percussive_ratio": 0.0,
        "duration_ms": duration_ms,
    }
```

**Step 4: Run, expect pass**

Run: `uv run pytest tests/test_features.py -v`
Expected: PASS.

**Step 5: Add `/features` endpoint to `main.py`**

Append to `main.py`:
```python
from features import extract_section_features


class FeaturesRequest(BaseModel):
    wav_path: str
    start_ms: int
    end_ms: int


@app.post("/features")
def features(req: FeaturesRequest):
    p = Path(req.wav_path)
    if not p.exists():
        raise HTTPException(404, f"file not found: {req.wav_path}")
    if req.end_ms <= req.start_ms:
        raise HTTPException(400, "end_ms must be greater than start_ms")
    return extract_section_features(str(p), req.start_ms, req.end_ms)
```

**Step 6: Add integration test**

Append to `tests/test_main.py`:
```python
def test_features_endpoint():
    response = client.post("/features", json={
        "wav_path": str(FIXTURE), "start_ms": 0, "end_ms": 4000,
    })
    assert response.status_code == 200
    assert "rms_mean" in response.json()
```

**Step 7: Run all tests**

Run: `uv run pytest -v`
Expected: all PASS.

**Step 8: Commit**

```bash
git add lyric-studio/audio_service/
git commit -m "feat(audio-service): /features endpoint for per-section AI context"
```

---

## Task 5: Web app init — Next.js + Tailwind + shadcn

**Files:**
- Create: `lyric-studio/web/` (everything Next.js scaffolds)

**Step 1: Scaffold Next.js**

Run:
```bash
cd lyric-studio
pnpm create next-app@latest web --typescript --tailwind --app --src-dir=false --import-alias='@/*' --no-eslint --use-pnpm
```

When prompted, accept defaults. Confirm files appear under `web/`.

**Step 2: Install shadcn/ui**

Run:
```bash
cd web
pnpm dlx shadcn@latest init -d
```
Default style: New York. Default base color: Neutral. Accept rest of defaults.

**Step 3: Install initial shadcn components used across the app**

Run:
```bash
pnpm dlx shadcn@latest add button card input label dialog dropdown-menu select textarea badge popover tooltip toast
```
Expected: components appear under `web/components/ui/`.

**Step 4: Install runtime deps**

Run:
```bash
pnpm add better-sqlite3 wavesurfer.js syllable @anthropic-ai/sdk archiver
pnpm add -D @types/better-sqlite3 @types/archiver vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

**Step 5: Configure vitest**

Create `web/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

Create `web/vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

Add to `web/package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 6: Verify Next.js + tests run**

Run:
```bash
pnpm dev &
sleep 8
curl -s http://localhost:3000 | head -c 200
kill %1
pnpm test
```
Expected: HTML content from Next.js (no error), and vitest reports "no tests found" (we'll add some next).

**Step 7: Commit**

```bash
git add lyric-studio/web/
git commit -m "chore(web): scaffold Next.js + Tailwind + shadcn/ui + vitest"
```

---

## Task 6: SQLite + migrations system

**Files:**
- Create: `lyric-studio/web/lib/db.ts`
- Create: `lyric-studio/web/lib/migrations.ts`
- Create: `lyric-studio/web/migrations/001_init.sql`
- Create: `lyric-studio/web/lib/__tests__/migrations.test.ts`

**Step 1: Write the failing test**

Create `web/lib/__tests__/migrations.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "../migrations";
import path from "node:path";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../migrations");

describe("runMigrations", () => {
  let db: Database.Database;
  beforeEach(() => {
    db = new Database(":memory:");
  });

  it("creates _migrations table on first run", () => {
    runMigrations(db, MIGRATIONS_DIR);
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'").get();
    expect(row).toBeDefined();
  });

  it("runs 001_init.sql and creates projects table", () => {
    runMigrations(db, MIGRATIONS_DIR);
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'").get();
    expect(row).toBeDefined();
  });

  it("is idempotent — second run does nothing new", () => {
    runMigrations(db, MIGRATIONS_DIR);
    const before = db.prepare("SELECT count(*) as c FROM _migrations").get() as { c: number };
    runMigrations(db, MIGRATIONS_DIR);
    const after = db.prepare("SELECT count(*) as c FROM _migrations").get() as { c: number };
    expect(after.c).toBe(before.c);
  });
});
```

**Step 2: Run, expect fail**

Run: `pnpm test`
Expected: FAIL — modules don't exist.

**Step 3: Create `migrations/001_init.sql`**

```sql
-- Phase 1 schema: projects, sections, rhyme cache, _migrations.
-- Phase 2 will add: takes, settings, voice fields on projects.

CREATE TABLE IF NOT EXISTS _migrations (
  name TEXT PRIMARY KEY,
  ran_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'analyzing',  -- analyzing | drafting | analysis_failed | lyrics_done
  instrumental_path TEXT,
  bpm REAL,
  key TEXT,
  time_sig TEXT,
  duration_ms INTEGER,
  downbeat_offset_ms INTEGER,
  rms_envelope_json TEXT,
  energy_regions_json TEXT,
  genre TEXT NOT NULL,
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_projects_deleted ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bar_start INTEGER NOT NULL,
  bar_end INTEGER NOT NULL,
  lines_per_phrase INTEGER NOT NULL DEFAULT 2,
  notes TEXT,
  lines_json TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sections_project ON sections(project_id, bar_start);

CREATE TABLE IF NOT EXISTS rhyme_cache (
  key TEXT PRIMARY KEY,  -- e.g., "love|14|pop"
  json_result TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

**Step 4: Implement `migrations.ts`**

```ts
import fs from "node:fs";
import path from "node:path";
import type Database from "better-sqlite3";

export function runMigrations(db: Database.Database, migrationsDir: string): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      ran_at INTEGER NOT NULL
    )
  `);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = new Set(
    db.prepare("SELECT name FROM _migrations").all().map((r: any) => r.name)
  );

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    const tx = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO _migrations (name, ran_at) VALUES (?, ?)").run(
        file,
        Date.now()
      );
    });
    tx();
  }
}
```

**Step 5: Implement `db.ts` with HMR-safe singleton**

```ts
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { runMigrations } from "./migrations";

const DB_PATH = path.resolve(process.cwd(), "..", "data", "data.db");
const MIGRATIONS_DIR = path.resolve(process.cwd(), "migrations");

declare global {
  // eslint-disable-next-line no-var
  var __lyric_studio_db: Database.Database | undefined;
}

function init(): Database.Database {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

export function getDb(): Database.Database {
  if (!globalThis.__lyric_studio_db) {
    globalThis.__lyric_studio_db = init();
  }
  return globalThis.__lyric_studio_db;
}
```

**Step 6: Run tests**

Run: `pnpm test`
Expected: 3 PASS in `migrations.test.ts`.

**Step 7: Smoke-test `getDb` runs without error**

Run from `web/`:
```bash
node --experimental-strip-types -e "import('./lib/db.ts').then(m => { const db = m.getDb(); console.log(db.prepare('SELECT count(*) as c FROM projects').get()); })"
```
Expected: prints `{ c: 0 }` and creates `lyric-studio/data/data.db`.

**Step 8: Commit**

```bash
git add lyric-studio/web/lib lyric-studio/web/migrations
git commit -m "feat(web): SQLite + idempotent migrations + Phase 1 schema"
```

---

## Task 7: Project CRUD + soft-delete API

**Files:**
- Create: `lyric-studio/web/lib/projects.ts`
- Create: `lyric-studio/web/lib/__tests__/projects.test.ts`
- Create: `lyric-studio/web/app/api/projects/route.ts`
- Create: `lyric-studio/web/app/api/projects/[id]/route.ts`
- Create: `lyric-studio/web/app/api/projects/[id]/restore/route.ts`

**Step 1: Write failing tests**

Create `lib/__tests__/projects.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "../migrations";
import { createProject, listProjects, getProject, softDeleteProject, restoreProject, listTrash } from "../projects";
import path from "node:path";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../migrations");

describe("projects", () => {
  let db: Database.Database;
  beforeEach(() => {
    db = new Database(":memory:");
    runMigrations(db, MIGRATIONS_DIR);
  });

  it("creates and retrieves a project", () => {
    const p = createProject(db, { title: "Test", genre: "pop" });
    expect(p.id).toBeDefined();
    expect(p.title).toBe("Test");
    expect(p.status).toBe("analyzing");
    expect(getProject(db, p.id)?.title).toBe("Test");
  });

  it("listProjects excludes soft-deleted", () => {
    const a = createProject(db, { title: "A", genre: "pop" });
    createProject(db, { title: "B", genre: "rock" });
    softDeleteProject(db, a.id);
    const visible = listProjects(db);
    expect(visible.map((p) => p.title)).toEqual(["B"]);
  });

  it("listTrash returns only soft-deleted", () => {
    const a = createProject(db, { title: "A", genre: "pop" });
    createProject(db, { title: "B", genre: "rock" });
    softDeleteProject(db, a.id);
    expect(listTrash(db).map((p) => p.title)).toEqual(["A"]);
  });

  it("restoreProject moves project back to live list", () => {
    const a = createProject(db, { title: "A", genre: "pop" });
    softDeleteProject(db, a.id);
    restoreProject(db, a.id);
    expect(listProjects(db).map((p) => p.title)).toEqual(["A"]);
  });
});
```

**Step 2: Run, expect fail**

Run: `pnpm test projects`
Expected: FAIL.

**Step 3: Implement `projects.ts`**

```ts
import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

export type ProjectStatus = "analyzing" | "drafting" | "analysis_failed" | "lyrics_done";

export interface Project {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  status: ProjectStatus;
  instrumental_path: string | null;
  bpm: number | null;
  key: string | null;
  time_sig: string | null;
  duration_ms: number | null;
  downbeat_offset_ms: number | null;
  rms_envelope_json: string | null;
  energy_regions_json: string | null;
  genre: string;
  deleted_at: number | null;
}

export function createProject(db: Database.Database, input: { title: string; genre: string }): Project {
  const id = randomUUID();
  const now = Date.now();
  db.prepare(
    `INSERT INTO projects (id, title, created_at, updated_at, status, genre)
     VALUES (?, ?, ?, ?, 'analyzing', ?)`
  ).run(id, input.title, now, now, input.genre);
  return getProject(db, id)!;
}

export function getProject(db: Database.Database, id: string): Project | null {
  return (db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as Project) ?? null;
}

export function listProjects(db: Database.Database): Project[] {
  return db
    .prepare("SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY updated_at DESC")
    .all() as Project[];
}

export function listTrash(db: Database.Database): Project[] {
  return db
    .prepare("SELECT * FROM projects WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC")
    .all() as Project[];
}

export function softDeleteProject(db: Database.Database, id: string): void {
  db.prepare("UPDATE projects SET deleted_at = ?, updated_at = ? WHERE id = ?").run(
    Date.now(), Date.now(), id
  );
}

export function restoreProject(db: Database.Database, id: string): void {
  db.prepare("UPDATE projects SET deleted_at = NULL, updated_at = ? WHERE id = ?").run(
    Date.now(), id
  );
}

export function permanentlyDeleteProject(db: Database.Database, id: string): void {
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);
}

export function updateProjectStatus(
  db: Database.Database,
  id: string,
  status: ProjectStatus
): void {
  db.prepare("UPDATE projects SET status = ?, updated_at = ? WHERE id = ?").run(
    status, Date.now(), id
  );
}

export function updateProjectAnalysis(
  db: Database.Database,
  id: string,
  analysis: {
    bpm: number;
    key: string;
    time_sig: string;
    duration_ms: number;
    downbeat_offset_ms: number;
    rms_envelope: number[];
    energy_regions: unknown[];
    instrumental_path: string;
  }
): void {
  db.prepare(
    `UPDATE projects SET
      bpm = ?, key = ?, time_sig = ?, duration_ms = ?, downbeat_offset_ms = ?,
      rms_envelope_json = ?, energy_regions_json = ?, instrumental_path = ?,
      status = 'drafting', updated_at = ?
     WHERE id = ?`
  ).run(
    analysis.bpm, analysis.key, analysis.time_sig, analysis.duration_ms,
    analysis.downbeat_offset_ms, JSON.stringify(analysis.rms_envelope),
    JSON.stringify(analysis.energy_regions), analysis.instrumental_path,
    Date.now(), id
  );
}
```

**Step 4: Run tests, expect pass**

Run: `pnpm test projects`
Expected: 4 PASS.

**Step 5: Wire HTTP routes**

Create `app/api/projects/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { listProjects, createProject } from "@/lib/projects";

export async function GET() {
  const projects = listProjects(getDb());
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.title || !body.genre) {
    return NextResponse.json({ error: "title and genre required" }, { status: 400 });
  }
  const project = createProject(getDb(), body);
  return NextResponse.json({ project }, { status: 201 });
}
```

Create `app/api/projects/[id]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getProject, softDeleteProject, permanentlyDeleteProject } from "@/lib/projects";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = getProject(getDb(), id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ project });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const permanent = url.searchParams.get("permanent") === "true";
  if (permanent) {
    permanentlyDeleteProject(getDb(), id);
  } else {
    softDeleteProject(getDb(), id);
  }
  return NextResponse.json({ ok: true });
}
```

Create `app/api/projects/[id]/restore/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { restoreProject } from "@/lib/projects";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  restoreProject(getDb(), id);
  return NextResponse.json({ ok: true });
}
```

**Step 6: Smoke-test from terminal**

Run:
```bash
cd web && pnpm dev &
sleep 5
curl -s -X POST http://localhost:3000/api/projects \
  -H "content-type: application/json" \
  -d '{"title":"Test Song","genre":"pop"}' | head -c 200; echo
curl -s http://localhost:3000/api/projects | head -c 300; echo
kill %1
```
Expected: project created and returned in list.

**Step 7: Commit**

```bash
git add lyric-studio/web/lib lyric-studio/web/app/api
git commit -m "feat(web): project CRUD + soft-delete + restore API"
```

---

## Task 8: Audio service client + analyze endpoint integration

**Files:**
- Create: `lyric-studio/web/lib/audio-service.ts`
- Create: `lyric-studio/web/app/api/analyze/route.ts`
- Create: `lyric-studio/web/lib/__tests__/audio-service.test.ts`

**Step 1: Write the failing test (HTTP-mocked)**

Create `lib/__tests__/audio-service.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { analyzeAudio } from "../audio-service";

describe("analyzeAudio", () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  beforeEach(() => fetchSpy.mockReset());
  afterEach(() => fetchSpy.mockRestore());

  it("posts to /analyze with wav_path and returns parsed body", async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ bpm: 120, key: "C", time_sig: "4/4", duration_ms: 8000, downbeat_offset_ms: 0, rms_envelope: [], energy_regions: [] }), { status: 200 })
    );
    const result = await analyzeAudio("/tmp/test.wav");
    expect(result.bpm).toBe(120);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\/analyze$/),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("throws on non-200", async () => {
    fetchSpy.mockResolvedValue(new Response("nope", { status: 500 }));
    await expect(analyzeAudio("/tmp/test.wav")).rejects.toThrow();
  });
});
```

**Step 2: Run, expect fail**

Run: `pnpm test audio-service`

**Step 3: Implement `audio-service.ts`**

```ts
const AUDIO_SERVICE_URL =
  process.env.AUDIO_SERVICE_URL || "http://127.0.0.1:8000";

export interface AnalysisResult {
  bpm: number;
  key: string;
  time_sig: string;
  duration_ms: number;
  downbeat_offset_ms: number;
  rms_envelope: number[];
  energy_regions: { start_ms: number; end_ms: number; level: string }[];
}

export async function analyzeAudio(wav_path: string): Promise<AnalysisResult> {
  const r = await fetch(`${AUDIO_SERVICE_URL}/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ wav_path }),
  });
  if (!r.ok) throw new Error(`audio service /analyze failed: ${r.status}`);
  return r.json();
}

export interface SectionFeatures {
  rms_mean: number;
  rms_max: number;
  spectral_centroid_hz: number;
  spectral_rolloff_hz: number;
  zero_crossing_rate: number;
  harmonic_percussive_ratio: number;
  duration_ms: number;
}

export async function extractSectionFeatures(
  wav_path: string,
  start_ms: number,
  end_ms: number
): Promise<SectionFeatures> {
  const r = await fetch(`${AUDIO_SERVICE_URL}/features`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ wav_path, start_ms, end_ms }),
  });
  if (!r.ok) throw new Error(`audio service /features failed: ${r.status}`);
  return r.json();
}
```

**Step 4: Run tests, expect pass**

Run: `pnpm test audio-service`
Expected: PASS.

**Step 5: Commit**

```bash
git add lyric-studio/web/lib
git commit -m "feat(web): audio service HTTP client (analyze + features)"
```

---

## Task 9: Instrumental upload + analyze flow

**Files:**
- Create: `lyric-studio/web/lib/storage.ts`
- Create: `lyric-studio/web/app/api/projects/[id]/upload/route.ts`

**Step 1: Implement `storage.ts`**

```ts
import path from "node:path";
import fs from "node:fs";
import { spawn } from "node:child_process";

export const DATA_ROOT = path.resolve(process.cwd(), "..", "data");

export function projectDir(id: string): string {
  return path.join(DATA_ROOT, "projects", id);
}

export function ensureProjectDir(id: string): string {
  const dir = projectDir(id);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function transcodeTo48kWav(
  inputPath: string,
  outputPath: string
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const ff = spawn("ffmpeg", [
      "-y", "-i", inputPath,
      "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le",
      outputPath,
    ]);
    let stderr = "";
    ff.stderr.on("data", (b) => (stderr += b.toString()));
    ff.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg failed (${code}): ${stderr}`));
    });
  });
}
```

**Step 2: Implement upload route**

Create `app/api/projects/[id]/upload/route.ts`:
```ts
import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { getDb } from "@/lib/db";
import { getProject, updateProjectAnalysis, updateProjectStatus } from "@/lib/projects";
import { ensureProjectDir, transcodeTo48kWav } from "@/lib/storage";
import { analyzeAudio } from "@/lib/audio-service";

export const config = { api: { bodyParser: false } };

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = getProject(getDb(), id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

  const dir = ensureProjectDir(id);
  const tempPath = path.join(dir, `upload.${file.name.split(".").pop() || "bin"}`);
  const outPath = path.join(dir, "instrumental.wav");

  fs.writeFileSync(tempPath, Buffer.from(await file.arrayBuffer()));

  try {
    await transcodeTo48kWav(tempPath, outPath);
    fs.unlinkSync(tempPath);
    const analysis = await analyzeAudio(outPath);
    updateProjectAnalysis(getDb(), id, { ...analysis, instrumental_path: outPath });
    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    updateProjectStatus(getDb(), id, "analysis_failed");
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
```

**Step 3: Manually smoke-test**

Run from `lyric-studio/`:
```bash
./start.sh &
sleep 8
# Create a project
PID=$(curl -s -X POST http://localhost:3000/api/projects \
  -H "content-type: application/json" \
  -d '{"title":"Test","genre":"pop"}' | jq -r .project.id)
echo "Project: $PID"
# Upload the click fixture
curl -s -X POST http://localhost:3000/api/projects/$PID/upload \
  -F "file=@audio_service/tests/fixtures/click_120bpm_4-4.wav" | jq .
# Verify analysis stored
curl -s http://localhost:3000/api/projects/$PID | jq '.project | {bpm, key, status}'
kill %1 2>/dev/null
```
Expected: bpm ≈ 120, status = `drafting`.

**Step 4: Commit**

```bash
git add lyric-studio/web
git commit -m "feat(web): instrumental upload + ffmpeg transcode + analyze pipeline"
```

---

## Task 10: Project list page

**Files:**
- Modify: `lyric-studio/web/app/page.tsx`
- Create: `lyric-studio/web/components/project-card.tsx`
- Create: `lyric-studio/web/components/empty-state.tsx`

**Step 1: Implement the list page**

Replace `app/page.tsx`:
```tsx
import Link from "next/link";
import { getDb } from "@/lib/db";
import { listProjects } from "@/lib/projects";
import { ProjectCard } from "@/components/project-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const projects = listProjects(getDb());

  return (
    <main className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Lyric Studio</h1>
          <p className="text-muted-foreground">Your songs in progress</p>
        </div>
        <div className="flex gap-2">
          <Link href="/trash"><Button variant="ghost">Trash</Button></Link>
          <Link href="/projects/new"><Button>New project</Button></Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </main>
  );
}
```

**Step 2: Implement `ProjectCard`**

```tsx
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/projects";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:bg-accent transition-colors">
        <CardHeader>
          <CardTitle className="truncate">{project.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1">
          <Badge variant={project.instrumental_path ? "default" : "outline"}>
            instrumental {project.instrumental_path ? "✓" : "·"}
          </Badge>
          <Badge variant="outline">
            sections {/* will be wired after sections list exists */}·
          </Badge>
          <Badge variant={project.status === "lyrics_done" ? "default" : "outline"}>
            lyrics {project.status === "lyrics_done" ? "✓" : "·"}
          </Badge>
          {project.bpm && (
            <span className="text-xs text-muted-foreground ml-auto">
              {Math.round(project.bpm)} BPM · {project.key}
            </span>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
```

**Step 3: Implement `EmptyState`**

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed p-12 text-center">
      <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
      <p className="text-muted-foreground mb-4">
        Upload an instrumental to get started.
      </p>
      <Link href="/projects/new"><Button>Create your first project</Button></Link>
    </div>
  );
}
```

**Step 4: Smoke-test**

Run: `cd web && pnpm dev`. Open http://localhost:3000 in a browser. Verify empty state shows; if there's an existing project from Task 9 smoke test, verify the card renders.

**Step 5: Commit**

```bash
git add lyric-studio/web
git commit -m "feat(web): project list page with cards + empty state"
```

---

## Task 11: New project page

**Files:**
- Create: `lyric-studio/web/app/projects/new/page.tsx`
- Create: `lyric-studio/web/components/genre-select.tsx`

**Step 1: Implement `GenreSelect`**

```tsx
"use client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const GENRES = [
  "pop", "indie", "lofi", "rap/hip-hop", "rnb",
  "electronic", "rock", "ballad", "folk", "other",
] as const;

export function GenreSelect({
  value, onChange,
}: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Select a genre" /></SelectTrigger>
      <SelectContent>
        {GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
```

**Step 2: Implement the new-project page**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GenreSelect } from "@/components/genre-select";

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("pop");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !genre || !file) {
      setError("Title, genre, and file are required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const r1 = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, genre }),
      });
      if (!r1.ok) throw new Error("Failed to create project");
      const { project } = await r1.json();

      const fd = new FormData();
      fd.append("file", file);
      const r2 = await fetch(`/api/projects/${project.id}/upload`, {
        method: "POST", body: fd,
      });
      if (!r2.ok) {
        const body = await r2.json().catch(() => ({}));
        throw new Error(body.error || "Upload/analysis failed");
      }
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container mx-auto p-8 max-w-xl">
      <h1 className="text-3xl font-bold mb-6">New project</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="title">Song title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <Label>Genre</Label>
          <GenreSelect value={genre} onChange={setGenre} />
        </div>
        <div>
          <Label htmlFor="file">Instrumental (WAV / MP3)</Label>
          <Input id="file" type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Analyzing..." : "Create"}
        </Button>
      </form>
    </main>
  );
}
```

**Step 3: Smoke-test**

`./start.sh`, navigate to `/projects/new`, fill form with the click fixture, submit. Should redirect to `/projects/<id>` (which 404s for now — next task). Verify the project shows up in the list.

**Step 4: Commit**

```bash
git add lyric-studio/web
git commit -m "feat(web): new project page with title + genre + instrumental upload"
```

---

## Task 12: Trash page

**Files:**
- Create: `lyric-studio/web/app/trash/page.tsx`
- Create: `lyric-studio/web/app/api/projects/trash/route.ts`

**Step 1: Implement the trash list endpoint**

Create `app/api/projects/trash/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { listTrash } from "@/lib/projects";

export async function GET() {
  return NextResponse.json({ projects: listTrash(getDb()) });
}
```

**Step 2: Implement the trash page**

```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/lib/projects";

export default function TrashPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  async function load() {
    const r = await fetch("/api/projects/trash");
    setProjects((await r.json()).projects);
  }

  useEffect(() => { load(); }, []);

  async function restore(id: string) {
    await fetch(`/api/projects/${id}/restore`, { method: "POST" });
    load();
  }

  async function purge(id: string) {
    if (!confirm("Permanently delete? This cannot be undone.")) return;
    await fetch(`/api/projects/${id}?permanent=true`, { method: "DELETE" });
    load();
  }

  return (
    <main className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Trash</h1>
        <Link href="/"><Button variant="ghost">← Back</Button></Link>
      </div>
      {projects.length === 0 ? (
        <p className="text-muted-foreground">Trash is empty.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <Card key={p.id}>
              <CardHeader><CardTitle>{p.title}</CardTitle></CardHeader>
              <CardContent className="flex gap-2">
                <Button size="sm" onClick={() => restore(p.id)}>Restore</Button>
                <Button size="sm" variant="destructive" onClick={() => purge(p.id)}>Delete forever</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
```

**Step 3: Smoke-test**

Soft-delete a project (we'll need a delete control on the list page eventually; for now delete via curl). Visit `/trash`. Restore. Verify it returns to the list.

**Step 4: Commit**

```bash
git add lyric-studio/web
git commit -m "feat(web): trash page with restore + purge"
```

---

## Task 13: Sections CRUD (server-side)

**Files:**
- Create: `lyric-studio/web/lib/sections.ts`
- Create: `lyric-studio/web/lib/__tests__/sections.test.ts`
- Create: `lyric-studio/web/app/api/projects/[id]/sections/route.ts`
- Create: `lyric-studio/web/app/api/projects/[id]/sections/[sectionId]/route.ts`

**Step 1: Write failing tests**

Create `lib/__tests__/sections.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import path from "node:path";
import { runMigrations } from "../migrations";
import { createProject } from "../projects";
import {
  createSection, listSections, updateSection, deleteSection, validateSectionPlacement
} from "../sections";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../migrations");

describe("sections", () => {
  let db: Database.Database;
  let projectId: string;

  beforeEach(() => {
    db = new Database(":memory:");
    runMigrations(db, MIGRATIONS_DIR);
    projectId = createProject(db, { title: "T", genre: "pop" }).id;
  });

  it("creates and lists sections sorted by bar_start", () => {
    createSection(db, { project_id: projectId, name: "Chorus", bar_start: 17, bar_end: 24 });
    createSection(db, { project_id: projectId, name: "Verse 1", bar_start: 5, bar_end: 12 });
    const list = listSections(db, projectId);
    expect(list.map((s) => s.name)).toEqual(["Verse 1", "Chorus"]);
  });

  it("rejects overlapping sections", () => {
    createSection(db, { project_id: projectId, name: "A", bar_start: 5, bar_end: 12 });
    expect(() =>
      createSection(db, { project_id: projectId, name: "B", bar_start: 10, bar_end: 15 })
    ).toThrow(/overlap/i);
  });

  it("validateSectionPlacement detects overlaps", () => {
    createSection(db, { project_id: projectId, name: "A", bar_start: 5, bar_end: 12 });
    expect(validateSectionPlacement(db, projectId, 6, 8, null)).toBe("overlap");
    expect(validateSectionPlacement(db, projectId, 13, 16, null)).toBe("ok");
  });

  it("update preserves lines_json when not specified", () => {
    const s = createSection(db, { project_id: projectId, name: "A", bar_start: 5, bar_end: 12 });
    updateSection(db, s.id, { lines_json: '[{"text":"hi","bar_start":5,"bar_end":6}]' });
    updateSection(db, s.id, { name: "Renamed" });
    const list = listSections(db, projectId);
    expect(list[0].lines_json).toContain("hi");
    expect(list[0].name).toBe("Renamed");
  });
});
```

**Step 2: Run, expect fail**

Run: `pnpm test sections`

**Step 3: Implement `sections.ts`**

```ts
import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

export interface Section {
  id: string;
  project_id: string;
  name: string;
  bar_start: number;
  bar_end: number;
  lines_per_phrase: number;
  notes: string | null;
  lines_json: string;
  created_at: number;
  updated_at: number;
}

export function listSections(db: Database.Database, projectId: string): Section[] {
  return db
    .prepare("SELECT * FROM sections WHERE project_id = ? ORDER BY bar_start ASC")
    .all(projectId) as Section[];
}

export function getSection(db: Database.Database, id: string): Section | null {
  return (db.prepare("SELECT * FROM sections WHERE id = ?").get(id) as Section) ?? null;
}

export function validateSectionPlacement(
  db: Database.Database,
  projectId: string,
  bar_start: number,
  bar_end: number,
  excludeId: string | null
): "ok" | "overlap" | "invalid" {
  if (bar_end <= bar_start) return "invalid";
  const others = listSections(db, projectId);
  for (const s of others) {
    if (s.id === excludeId) continue;
    if (bar_start < s.bar_end && bar_end > s.bar_start) return "overlap";
  }
  return "ok";
}

export function createSection(
  db: Database.Database,
  input: { project_id: string; name: string; bar_start: number; bar_end: number; lines_per_phrase?: number }
): Section {
  const placement = validateSectionPlacement(db, input.project_id, input.bar_start, input.bar_end, null);
  if (placement !== "ok") throw new Error(`section placement ${placement}`);

  const id = randomUUID();
  const now = Date.now();
  db.prepare(
    `INSERT INTO sections (id, project_id, name, bar_start, bar_end, lines_per_phrase, lines_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, '[]', ?, ?)`
  ).run(
    id, input.project_id, input.name, input.bar_start, input.bar_end,
    input.lines_per_phrase ?? 2, now, now
  );
  return getSection(db, id)!;
}

export function updateSection(
  db: Database.Database,
  id: string,
  patch: Partial<Pick<Section, "name" | "bar_start" | "bar_end" | "lines_per_phrase" | "notes" | "lines_json">>
): Section {
  const existing = getSection(db, id);
  if (!existing) throw new Error("not found");

  if (patch.bar_start !== undefined || patch.bar_end !== undefined) {
    const newStart = patch.bar_start ?? existing.bar_start;
    const newEnd = patch.bar_end ?? existing.bar_end;
    const placement = validateSectionPlacement(db, existing.project_id, newStart, newEnd, id);
    if (placement !== "ok") throw new Error(`section placement ${placement}`);
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  for (const k of ["name", "bar_start", "bar_end", "lines_per_phrase", "notes", "lines_json"] as const) {
    if (patch[k] !== undefined) {
      fields.push(`${k} = ?`);
      values.push(patch[k]);
    }
  }
  if (fields.length === 0) return existing;
  fields.push("updated_at = ?");
  values.push(Date.now(), id);
  db.prepare(`UPDATE sections SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getSection(db, id)!;
}

export function deleteSection(db: Database.Database, id: string): void {
  db.prepare("DELETE FROM sections WHERE id = ?").run(id);
}
```

**Step 4: Run tests, expect pass**

Run: `pnpm test sections`
Expected: 4 PASS.

**Step 5: Wire HTTP routes**

Create `app/api/projects/[id]/sections/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { listSections, createSection } from "@/lib/sections";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return NextResponse.json({ sections: listSections(getDb(), id) });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  try {
    const section = createSection(getDb(), {
      project_id: id,
      name: body.name,
      bar_start: body.bar_start,
      bar_end: body.bar_end,
      lines_per_phrase: body.lines_per_phrase,
    });
    return NextResponse.json({ section }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }
}
```

Create `app/api/projects/[id]/sections/[sectionId]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { updateSection, deleteSection } from "@/lib/sections";

export async function PATCH(req: Request, ctx: { params: Promise<{ sectionId: string }> }) {
  const { sectionId } = await ctx.params;
  const patch = await req.json();
  try {
    return NextResponse.json({ section: updateSection(getDb(), sectionId, patch) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }
}

export async function DELETE(_: Request, ctx: { params: Promise<{ sectionId: string }> }) {
  const { sectionId } = await ctx.params;
  deleteSection(getDb(), sectionId);
  return NextResponse.json({ ok: true });
}
```

**Step 6: Commit**

```bash
git add lyric-studio/web
git commit -m "feat(web): sections CRUD with overlap validation"
```

---

## Task 14: Section editor — waveform + bar grid + drag-to-create

**Files:**
- Create: `lyric-studio/web/app/projects/[id]/page.tsx`
- Create: `lyric-studio/web/components/waveform.tsx`
- Create: `lyric-studio/web/components/bar-grid.tsx`
- Create: `lyric-studio/web/lib/__tests__/bar-math.test.ts`
- Create: `lyric-studio/web/lib/bar-math.ts`
- Create: `lyric-studio/web/app/api/projects/[id]/instrumental/route.ts` (serves the WAV to the browser)

**Step 1: Implement bar math + tests (TDD)**

Test file `lib/__tests__/bar-math.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { barToMs, msToBar, barLengthMs } from "../bar-math";

describe("bar math", () => {
  it("barLengthMs at 120 BPM 4/4 = 2000ms", () => {
    expect(barLengthMs(120, "4/4")).toBe(2000);
  });

  it("barToMs(1) at 120 BPM with 0 downbeat = 0", () => {
    expect(barToMs(1, 0, 120, "4/4")).toBe(0);
  });

  it("barToMs(2) at 120 BPM with 0 downbeat = 2000", () => {
    expect(barToMs(2, 0, 120, "4/4")).toBe(2000);
  });

  it("msToBar(2000) at 120 BPM = 2", () => {
    expect(msToBar(2000, 0, 120, "4/4")).toBe(2);
  });

  it("msToBar applies downbeat offset", () => {
    expect(msToBar(2500, 500, 120, "4/4")).toBe(2);
  });
});
```

Implement `lib/bar-math.ts`:
```ts
export function beatsPerBar(timeSig: string): number {
  const [num] = timeSig.split("/").map(Number);
  return num || 4;
}

export function barLengthMs(bpm: number, timeSig: string): number {
  const beatMs = 60000 / bpm;
  return Math.round(beatMs * beatsPerBar(timeSig));
}

export function barToMs(bar: number, downbeatOffsetMs: number, bpm: number, timeSig: string): number {
  return downbeatOffsetMs + (bar - 1) * barLengthMs(bpm, timeSig);
}

export function msToBar(ms: number, downbeatOffsetMs: number, bpm: number, timeSig: string): number {
  const offset = ms - downbeatOffsetMs;
  return Math.floor(offset / barLengthMs(bpm, timeSig)) + 1;
}

export function snapMsToBar(ms: number, downbeatOffsetMs: number, bpm: number, timeSig: string): number {
  const bar = Math.max(1, Math.round((ms - downbeatOffsetMs) / barLengthMs(bpm, timeSig)) + 1);
  return barToMs(bar, downbeatOffsetMs, bpm, timeSig);
}
```

Run: `pnpm test bar-math`
Expected: 5 PASS.

**Step 2: Implement instrumental file route**

Create `app/api/projects/[id]/instrumental/route.ts`:
```ts
import { NextResponse } from "next/server";
import fs from "node:fs";
import { getDb } from "@/lib/db";
import { getProject } from "@/lib/projects";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = getProject(getDb(), id);
  if (!project?.instrumental_path) {
    return NextResponse.json({ error: "no instrumental" }, { status: 404 });
  }
  const buf = fs.readFileSync(project.instrumental_path);
  return new NextResponse(buf, {
    headers: {
      "content-type": "audio/wav",
      "content-length": buf.length.toString(),
    },
  });
}
```

**Step 3: Implement `Waveform` component**

```tsx
"use client";
import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";

interface Region {
  id: string;
  start: number;  // seconds
  end: number;    // seconds
  color: string;
  drag?: boolean;
  resize?: boolean;
}

interface Props {
  audioUrl: string;
  regions: Region[];
  onRegionCreated?: (start: number, end: number) => void;
  onRegionUpdated?: (id: string, start: number, end: number) => void;
}

export function Waveform({ audioUrl, regions, onRegionCreated, onRegionUpdated }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<RegionsPlugin | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const regionsPlugin = RegionsPlugin.create();
    const ws = WaveSurfer.create({
      container: containerRef.current,
      url: audioUrl,
      waveColor: "#999",
      progressColor: "#444",
      height: 96,
      plugins: [regionsPlugin],
    });
    wsRef.current = ws;
    regionsPluginRef.current = regionsPlugin;

    regionsPlugin.enableDragSelection({ color: "rgba(0, 100, 255, 0.2)" });

    regionsPlugin.on("region-created", (r) => {
      onRegionCreated?.(r.start, r.end);
    });

    regionsPlugin.on("region-updated", (r) => {
      onRegionUpdated?.(r.id, r.start, r.end);
    });

    return () => {
      ws.destroy();
      wsRef.current = null;
    };
  }, [audioUrl]);

  // sync regions in
  useEffect(() => {
    const rp = regionsPluginRef.current;
    if (!rp) return;
    rp.clearRegions();
    for (const r of regions) {
      rp.addRegion({ id: r.id, start: r.start, end: r.end, color: r.color, drag: r.drag, resize: r.resize });
    }
  }, [regions]);

  return <div ref={containerRef} className="w-full" />;
}
```

**Step 4: Implement the project page (skeleton)**

Create `app/projects/[id]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getProject } from "@/lib/projects";
import { listSections } from "@/lib/sections";
import { ProjectEditor } from "./project-editor";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(getDb(), id);
  if (!project) notFound();
  const sections = listSections(getDb(), id);
  return <ProjectEditor project={project} initialSections={sections} />;
}
```

Create `app/projects/[id]/project-editor.tsx`:
```tsx
"use client";
import { useMemo, useState } from "react";
import type { Project } from "@/lib/projects";
import type { Section } from "@/lib/sections";
import { Waveform } from "@/components/waveform";
import { barToMs, msToBar, snapMsToBar } from "@/lib/bar-math";

export function ProjectEditor({
  project, initialSections,
}: { project: Project; initialSections: Section[] }) {
  const [sections, setSections] = useState(initialSections);

  const audioUrl = `/api/projects/${project.id}/instrumental`;

  const regions = useMemo(() => {
    if (!project.bpm || !project.time_sig) return [];
    return sections.map((s) => ({
      id: s.id,
      start: barToMs(s.bar_start, project.downbeat_offset_ms ?? 0, project.bpm!, project.time_sig!) / 1000,
      end: barToMs(s.bar_end + 1, project.downbeat_offset_ms ?? 0, project.bpm!, project.time_sig!) / 1000,
      color: "rgba(120, 80, 200, 0.2)",
      drag: true, resize: true,
    }));
  }, [sections, project]);

  async function handleRegionCreated(startSec: number, endSec: number) {
    if (!project.bpm || !project.time_sig) return;
    const startMs = snapMsToBar(startSec * 1000, project.downbeat_offset_ms ?? 0, project.bpm, project.time_sig);
    const endMs = snapMsToBar(endSec * 1000, project.downbeat_offset_ms ?? 0, project.bpm, project.time_sig);
    const bar_start = msToBar(startMs, project.downbeat_offset_ms ?? 0, project.bpm, project.time_sig);
    const bar_end = msToBar(endMs, project.downbeat_offset_ms ?? 0, project.bpm, project.time_sig) - 1;
    const r = await fetch(`/api/projects/${project.id}/sections`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: `Section ${sections.length + 1}`, bar_start, bar_end }),
    });
    if (r.ok) {
      const { section } = await r.json();
      setSections((s) => [...s, section]);
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-2">{project.title}</h1>
      <p className="text-sm text-muted-foreground mb-4">
        {project.bpm ? `${Math.round(project.bpm)} BPM` : "..."} · {project.key} · {project.time_sig} · {project.genre}
      </p>
      {project.instrumental_path && <Waveform audioUrl={audioUrl} regions={regions} onRegionCreated={handleRegionCreated} />}
      <p className="text-xs text-muted-foreground mt-2">Drag on the waveform to create a section.</p>
    </main>
  );
}
```

**Step 5: Smoke-test**

Run `./start.sh`, navigate to a project's URL, drag on the waveform. Verify a section is created (check DB or refresh the page).

**Step 6: Commit**

```bash
git add lyric-studio/web
git commit -m "feat(web): section editor with waveform + drag-to-create + bar snap"
```

---

## Task 15: Section editor polish — bar grid overlay, energy hints, downbeat shift, time-sig banner

**Files:**
- Modify: `lyric-studio/web/components/waveform.tsx`
- Modify: `lyric-studio/web/app/projects/[id]/project-editor.tsx`
- Create: `lyric-studio/web/components/time-sig-banner.tsx`

**Step 1: Add bar grid overlay to `Waveform`**

Augment the component to accept `barGridLines: number[]` (in seconds) and `energyRegions: { start: number; end: number; level: string }[]`, and draw them as canvas overlays inside the wavesurfer container.

(Implementation: place absolutely positioned `<div>`s for grid lines (1px width, color tiered by every-1/4/8 bar), and for energy regions (low-opacity colored backgrounds). Use the WaveSurfer container's `pixelsPerSecond` from `ws.getDuration()` and the container width.)

```tsx
// inside Waveform component, after the WaveSurfer container <div>, add:
<div className="absolute inset-0 pointer-events-none" ref={overlayRef} />
```

Compute lines + region overlays in a `useEffect` that listens to `ws.on("ready")` and resize.

(Boilerplate; ~60 lines of canvas/DOM code. The key is `pixelsPerSecond = containerWidth / duration`.)

**Step 2: Implement downbeat shift via keyboard**

In `project-editor.tsx`, add a `useEffect` that listens for `keydown` events on `ArrowLeft`/`ArrowRight` and calls `PATCH /api/projects/[id]` to shift `downbeat_offset_ms` by ±beat duration.

Add the project-level update endpoint first:

Create `web/app/api/projects/[id]/update/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const patch = await req.json();
  const allowed = ["title", "downbeat_offset_ms", "status", "genre"];
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const k of allowed) {
    if (patch[k] !== undefined) {
      fields.push(`${k} = ?`);
      values.push(patch[k]);
    }
  }
  if (fields.length === 0) return NextResponse.json({ ok: true });
  fields.push("updated_at = ?");
  values.push(Date.now(), id);
  getDb().prepare(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return NextResponse.json({ ok: true });
}
```

In the editor:
```tsx
useEffect(() => {
  function onKey(e: KeyboardEvent) {
    if (!project.bpm || !project.time_sig) return;
    const beatMs = 60000 / project.bpm;
    let delta = 0;
    if (e.key === "ArrowLeft") delta = -beatMs;
    if (e.key === "ArrowRight") delta = beatMs;
    if (delta === 0) return;
    e.preventDefault();
    const newOffset = (project.downbeat_offset_ms ?? 0) + delta;
    fetch(`/api/projects/${project.id}/update`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ downbeat_offset_ms: Math.round(newOffset) }),
    }).then(() => location.reload());
  }
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [project]);
```

(Yes, location.reload is crude for MVP. Iterate later.)

**Step 3: Add the time-sig banner**

```tsx
export function TimeSigBanner({ timeSig }: { timeSig: string }) {
  if (timeSig === "4/4") return null;
  return (
    <div className="rounded border bg-yellow-50 p-2 text-sm text-yellow-900 mb-3">
      Detected time signature: <strong>{timeSig}</strong>. Phase 1 supports 4/4 fully —
      bar grid + syllable budget guidance are disabled. Manual section labeling still works.
    </div>
  );
}
```

Render above the waveform in `ProjectEditor`.

**Step 4: Smoke-test**

Verify bar lines visible, energy regions tint visible, arrow keys shift downbeat, banner appears for non-4/4 fixtures (you can manually patch the project's `time_sig` to test).

**Step 5: Commit**

```bash
git add lyric-studio/web
git commit -m "feat(web): bar grid overlay + energy hints + downbeat shift + time-sig banner"
```

---

## Task 16: AI section notes — Claude wrapper + endpoint + UI

**Files:**
- Create: `lyric-studio/web/lib/claude.ts`
- Create: `lyric-studio/web/app/api/ai/section-notes/route.ts`
- Modify: `lyric-studio/web/app/projects/[id]/project-editor.tsx`
- Create: `lyric-studio/web/components/section-card.tsx`

**Step 1: Implement Claude wrapper with prompt caching**

```ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const SONNET = "claude-sonnet-4-6";
export const HAIKU = "claude-haiku-4-5-20251001";

export interface TrackContext {
  title: string;
  bpm: number;
  key: string;
  time_sig: string;
  genre: string;
}

export async function generateSectionNotes(args: {
  track: TrackContext;
  section: { name: string; bar_start: number; bar_end: number };
  features: {
    rms_mean: number; rms_max: number;
    spectral_centroid_hz: number; spectral_rolloff_hz: number;
    zero_crossing_rate: number; harmonic_percussive_ratio: number;
    duration_ms: number;
  };
}): Promise<string> {
  const trackBlock = `
Track: "${args.track.title}"
Genre: ${args.track.genre}
BPM: ${args.track.bpm}
Key: ${args.track.key}
Time signature: ${args.track.time_sig}
`.trim();

  const sectionBlock = `
Section: ${args.section.name} (bars ${args.section.bar_start}-${args.section.bar_end})
Duration: ${(args.features.duration_ms / 1000).toFixed(1)}s
RMS mean: ${args.features.rms_mean.toFixed(3)}, max: ${args.features.rms_max.toFixed(3)}
Spectral centroid: ${args.features.spectral_centroid_hz.toFixed(0)} Hz
Spectral rolloff: ${args.features.spectral_rolloff_hz.toFixed(0)} Hz
Harmonic/percussive ratio: ${args.features.harmonic_percussive_ratio.toFixed(2)}
Zero-crossing rate: ${args.features.zero_crossing_rate.toFixed(3)}
`.trim();

  const message = await client.messages.create({
    model: SONNET,
    max_tokens: 300,
    system: [
      {
        type: "text",
        text: "You are a producer giving creative-brief notes to a lyric writer. Be concise (2-3 sentences). Describe energy, feel, what kinds of lyrics work here, and any pacing guidance. Do NOT write lyrics. Do NOT use vague terms like 'beautiful'; be specific about what the writer should aim for.",
        cache_control: { type: "ephemeral" },
      },
      {
        type: "text",
        text: trackBlock,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: sectionBlock }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("unexpected response type");
  return block.text;
}
```

**Step 2: Implement the endpoint**

```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getProject } from "@/lib/projects";
import { getSection, updateSection } from "@/lib/sections";
import { extractSectionFeatures } from "@/lib/audio-service";
import { generateSectionNotes } from "@/lib/claude";
import { barToMs } from "@/lib/bar-math";

export async function POST(req: Request) {
  const { section_id } = await req.json();
  const section = getSection(getDb(), section_id);
  if (!section) return NextResponse.json({ error: "section not found" }, { status: 404 });
  const project = getProject(getDb(), section.project_id);
  if (!project?.instrumental_path || !project.bpm || !project.time_sig) {
    return NextResponse.json({ error: "project not ready" }, { status: 400 });
  }

  const start_ms = barToMs(section.bar_start, project.downbeat_offset_ms ?? 0, project.bpm, project.time_sig);
  const end_ms = barToMs(section.bar_end + 1, project.downbeat_offset_ms ?? 0, project.bpm, project.time_sig);

  try {
    const features = await extractSectionFeatures(project.instrumental_path, start_ms, end_ms);
    const notes = await generateSectionNotes({
      track: { title: project.title, bpm: project.bpm, key: project.key!, time_sig: project.time_sig, genre: project.genre },
      section: { name: section.name, bar_start: section.bar_start, bar_end: section.bar_end },
      features,
    });
    updateSection(getDb(), section_id, { notes });
    return NextResponse.json({ notes });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
```

**Step 3: Implement `SectionCard`**

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Section } from "@/lib/sections";

interface Props {
  section: Section;
  onUpdate: (id: string, patch: Partial<Section>) => void;
  onDelete: (id: string) => void;
}

export function SectionCard({ section, onUpdate, onDelete }: Props) {
  const [name, setName] = useState(section.name);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState(section.notes ?? "");
  const [generating, setGenerating] = useState(false);

  async function generateNotes() {
    setGenerating(true);
    const r = await fetch("/api/ai/section-notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ section_id: section.id }),
    });
    if (r.ok) {
      const { notes } = await r.json();
      setNotes(notes);
      onUpdate(section.id, { notes });
    }
    setGenerating(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => onUpdate(section.id, { name })}
          className="text-lg font-semibold"
        />
        <span className="text-sm text-muted-foreground">bars {section.bar_start}–{section.bar_end}</span>
        <Button variant="ghost" size="sm" onClick={() => setNotesOpen((v) => !v)}>
          {notesOpen ? "Hide notes" : "Notes"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(section.id)}>Delete</Button>
      </CardHeader>
      {notesOpen && (
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <Button size="sm" onClick={generateNotes} disabled={generating}>
              {generating ? "Generating..." : (notes ? "Regenerate" : "Generate notes")}
            </Button>
          </div>
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => onUpdate(section.id, { notes })}
            placeholder="Producer notes for this section will appear here. Editable."
          />
        </CardContent>
      )}
    </Card>
  );
}
```

**Step 4: Wire `SectionCard` into the project editor**

Render a list of `SectionCard`s below the waveform. Implement `onUpdate` and `onDelete` to call PATCH/DELETE endpoints and update local state.

**Step 5: Smoke-test**

With a project that has the click fixture: create a section, click "Generate notes," verify notes appear (will be generic for a click fixture but the call should succeed). Edit notes; refresh; verify persisted.

**Step 6: Commit**

```bash
git add lyric-studio/web
git commit -m "feat(web): AI section notes (Sonnet 4.6) + section cards"
```

---

## Task 17: Lyric line cards — text + bar range + syllable counter + autosave

**Files:**
- Create: `lyric-studio/web/components/line-card.tsx`
- Create: `lyric-studio/web/lib/syllables.ts`
- Create: `lyric-studio/web/lib/__tests__/syllables.test.ts`
- Create: `lyric-studio/web/lib/syllable-budget.ts`
- Modify: `lyric-studio/web/components/section-card.tsx`

**Step 1: Implement `syllables.ts` and tests**

```ts
import syllable from "syllable";

export function countSyllables(text: string): number {
  if (!text.trim()) return 0;
  return syllable(text);
}
```

Tests:
```ts
import { describe, it, expect } from "vitest";
import { countSyllables } from "../syllables";

describe("countSyllables", () => {
  it("returns 0 for empty", () => expect(countSyllables("")).toBe(0));
  it("simple words", () => expect(countSyllables("walking down the street")).toBe(5));
  it("multi-syllable", () => expect(countSyllables("beautiful melodies")).toBeGreaterThan(5));
});
```

Run: `pnpm test syllables`. Expected: PASS.

**Step 2: Implement `syllable-budget.ts`**

```ts
const SYLLABLES_PER_BEAT_BY_GENRE: Record<string, number> = {
  "pop": 1.5,
  "indie": 1.4,
  "lofi": 1.2,
  "rap/hip-hop": 3.5,
  "rnb": 1.6,
  "electronic": 1.4,
  "rock": 1.5,
  "ballad": 1.0,
  "folk": 1.3,
  "other": 1.5,
};

export function syllableBudget(args: {
  bars: number;
  beats_per_bar: number;
  genre: string;
}): number {
  const sb = SYLLABLES_PER_BEAT_BY_GENRE[args.genre] ?? 1.5;
  return Math.round(args.bars * args.beats_per_bar * sb);
}
```

**Step 3: Implement `LineCard`**

```tsx
"use client";
import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { countSyllables } from "@/lib/syllables";

export interface Line {
  text: string;
  bar_start: number;
  bar_end: number;
}

interface Props {
  line: Line;
  budget: number;
  onChange: (patch: Partial<Line>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRhyme: () => void;
  onPolish: () => void;
  onPlayBars: () => void;
}

export function LineCard({
  line, budget, onChange, onDelete, onMoveUp, onMoveDown, onRhyme, onPolish, onPlayBars,
}: Props) {
  const [text, setText] = useState(line.text);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const syllableCount = countSyllables(text);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (text !== line.text) onChange({ text });
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [text]);

  const overBudget = syllableCount - budget;
  const color =
    overBudget <= 0 ? "text-green-600" :
    overBudget <= 2 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="flex items-center gap-2 group">
      <Badge variant="outline">bars {line.bar_start}-{line.bar_end}</Badge>
      <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a line..." />
      <span className={`text-xs ${color} w-20 text-right`}>{syllableCount} / {budget}</span>
      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
        <Button size="sm" variant="ghost" onClick={onPlayBars} aria-label="Play bars">♪</Button>
        <Button size="sm" variant="ghost" onClick={onRhyme}>Rhyme</Button>
        <Button size="sm" variant="ghost" onClick={onPolish}>Polish</Button>
        <Button size="sm" variant="ghost" onClick={onMoveUp} aria-label="Up">↑</Button>
        <Button size="sm" variant="ghost" onClick={onMoveDown} aria-label="Down">↓</Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>×</Button>
      </div>
    </div>
  );
}
```

**Step 4: Wire lines into `SectionCard`**

Inside `SectionCard`, parse `section.lines_json` into a list, render `LineCard`s, handle add/delete/reorder/edit. On every change, debounce-save by writing the whole `lines_json` array via PATCH.

(About 80 lines. Use the established PATCH endpoint.)

**Step 5: Add `+ Add line` and `+ Paste lyrics`**

`+ Add line`: appends a new line with `bar_start = previous line's bar_end + 1`, `bar_end = bar_start + section.lines_per_phrase - 1`, clamped to `section.bar_end`.

`+ Paste lyrics`: a dialog with a textarea. On submit, split by `\n`, trim, drop empty lines, assign bar ranges sequentially using `lines_per_phrase`, replace existing lines.

**Step 6: Smoke-test**

Verify add/edit/reorder/delete works. Refresh page, verify persistence.

**Step 7: Commit**

```bash
git add lyric-studio/web
git commit -m "feat(web): line cards with syllable counter, autosave, paste lyrics"
```

---

## Task 18: Rhyme suggestions — endpoint + cache + popover

**Files:**
- Create: `lyric-studio/web/lib/rhyme.ts`
- Create: `lyric-studio/web/lib/__tests__/rhyme.test.ts` (cache only)
- Create: `lyric-studio/web/app/api/ai/rhyme/route.ts`
- Create: `lyric-studio/web/components/rhyme-popover.tsx`
- Modify: `lyric-studio/web/components/line-card.tsx` (wire popover)

**Step 1: Implement and test the cache layer**

`lib/rhyme.ts`:
```ts
import type Database from "better-sqlite3";

export interface RhymeResult {
  word: string;
  type: "perfect" | "slant";
}

export function cacheKey(word: string, budget: number, genre: string): string {
  return `${word.toLowerCase()}|${budget}|${genre}`;
}

export function getCachedRhymes(db: Database.Database, key: string): RhymeResult[] | null {
  const row = db.prepare("SELECT json_result FROM rhyme_cache WHERE key = ?").get(key) as { json_result: string } | undefined;
  return row ? JSON.parse(row.json_result) : null;
}

export function setCachedRhymes(db: Database.Database, key: string, results: RhymeResult[]): void {
  db.prepare(
    "INSERT OR REPLACE INTO rhyme_cache (key, json_result, created_at) VALUES (?, ?, ?)"
  ).run(key, JSON.stringify(results), Date.now());
}
```

Test (`lib/__tests__/rhyme.test.ts`):
```ts
import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import path from "node:path";
import { runMigrations } from "../migrations";
import { cacheKey, getCachedRhymes, setCachedRhymes } from "../rhyme";

const M = path.resolve(__dirname, "../../migrations");

describe("rhyme cache", () => {
  let db: Database.Database;
  beforeEach(() => { db = new Database(":memory:"); runMigrations(db, M); });

  it("returns null on miss", () => {
    expect(getCachedRhymes(db, cacheKey("love", 14, "pop"))).toBeNull();
  });

  it("returns stored on hit", () => {
    const k = cacheKey("love", 14, "pop");
    setCachedRhymes(db, k, [{ word: "above", type: "perfect" }]);
    expect(getCachedRhymes(db, k)).toEqual([{ word: "above", type: "perfect" }]);
  });
});
```

Run: `pnpm test rhyme`
Expected: 2 PASS.

**Step 2: Implement the rhyme generator in `claude.ts`**

Append to `web/lib/claude.ts`:
```ts
export async function generateRhymes(args: {
  end_word: string;
  syllable_budget: number;
  section_notes: string | null;
  same_section_lyrics: string;
  prev_section_lyrics: string;
  genre: string;
}): Promise<{ word: string; type: "perfect" | "slant" }[]> {
  const message = await client.messages.create({
    model: HAIKU,
    max_tokens: 300,
    system: "You are a rhyme assistant for a lyric writer. Return ONLY a JSON array of {word, type} where type is 'perfect' or 'slant'. 8-10 entries. Avoid clichéd words for the genre. No preamble, no markdown.",
    messages: [{
      role: "user",
      content: `End word: ${args.end_word}
Syllable budget for the line: ${args.syllable_budget}
Genre: ${args.genre}
Section notes: ${args.section_notes ?? "(none)"}
Same-section lyrics so far:
${args.same_section_lyrics || "(none)"}
Previous section lyrics:
${args.prev_section_lyrics || "(none)"}`,
    }],
  });
  const block = message.content[0];
  if (block.type !== "text") throw new Error("unexpected");
  const text = block.text.trim();
  // Strip optional ```json wrapping
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}
```

**Step 3: Implement the endpoint**

```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSection, listSections } from "@/lib/sections";
import { getProject } from "@/lib/projects";
import { generateRhymes } from "@/lib/claude";
import { cacheKey, getCachedRhymes, setCachedRhymes } from "@/lib/rhyme";

export async function POST(req: Request) {
  const { section_id, end_word, syllable_budget, line_index } = await req.json();
  const section = getSection(getDb(), section_id);
  if (!section) return NextResponse.json({ error: "section not found" }, { status: 404 });
  const project = getProject(getDb(), section.project_id);
  if (!project) return NextResponse.json({ error: "project not found" }, { status: 404 });

  const k = cacheKey(end_word, syllable_budget, project.genre);
  const cached = getCachedRhymes(getDb(), k);
  if (cached) return NextResponse.json({ rhymes: cached, cached: true });

  // Same-section + previous-section lyric context
  const sections = listSections(getDb(), project.id);
  const idx = sections.findIndex((s) => s.id === section_id);
  const lines: { text: string }[] = JSON.parse(section.lines_json);
  const same_section_lyrics = lines.slice(0, line_index).map((l) => l.text).join("\n");
  const prev_section_lyrics = idx > 0
    ? (JSON.parse(sections[idx - 1].lines_json) as { text: string }[]).map((l) => l.text).join("\n")
    : "";

  try {
    const rhymes = await generateRhymes({
      end_word, syllable_budget,
      section_notes: section.notes,
      same_section_lyrics, prev_section_lyrics,
      genre: project.genre,
    });
    setCachedRhymes(getDb(), k, rhymes);
    return NextResponse.json({ rhymes, cached: false });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
```

**Step 4: Implement `RhymePopover` component**

```tsx
"use client";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface Props {
  trigger: React.ReactNode;
  onFetch: () => Promise<{ word: string; type: "perfect" | "slant" }[]>;
  onPick: (word: string) => void;
}

export function RhymePopover({ trigger, onFetch, onPick }: Props) {
  const [rhymes, setRhymes] = useState<{ word: string; type: string }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRhymes(await onFetch());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  }

  return (
    <Popover onOpenChange={(open) => { if (open && !rhymes) load(); }}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent>
        {loading && <p className="text-sm">Loading...</p>}
        {error && (
          <div>
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" onClick={load}>Retry</Button>
          </div>
        )}
        {rhymes && (
          <div className="grid grid-cols-2 gap-1">
            {rhymes.map((r) => (
              <button
                key={r.word}
                onClick={() => onPick(r.word)}
                className="text-left text-sm hover:bg-accent rounded px-2 py-1"
              >
                {r.word} <span className="text-xs text-muted-foreground">{r.type}</span>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
```

**Step 5: Wire `RhymePopover` into `LineCard`**

Replace the static `Rhyme` button with a `RhymePopover` that fetches `/api/ai/rhyme` on open and inserts the picked word at the end of the line text.

**Step 6: Smoke-test**

Type a line ending in "love." Click Rhyme. Verify a popover with rhymes opens. Pick one — verify it appends to the line text.

**Step 7: Commit**

```bash
git add lyric-studio/web
git commit -m "feat(web): AI rhyme suggestions (Haiku 4.5) with persistent cache"
```

---

## Task 19: Polish suggestions — endpoint + diff popover

**Files:**
- Create: `lyric-studio/web/app/api/ai/polish/route.ts`
- Create: `lyric-studio/web/components/polish-popover.tsx`
- Modify: `lyric-studio/web/lib/claude.ts`
- Modify: `lyric-studio/web/components/line-card.tsx`

**Step 1: Implement `polishLine` in `claude.ts`**

```ts
export async function polishLine(args: {
  line: string;
  section_notes: string | null;
  same_section_lyrics: string;
  genre: string;
}): Promise<string> {
  const message = await client.messages.create({
    model: HAIKU,
    max_tokens: 200,
    system: "You are a lyric editor. Return ONE polished version of the user's line — same meaning, same rough syllable count, tighter wording or stronger imagery. Never change the meaning. Output ONLY the polished line, no quotes, no preamble, no markdown.",
    messages: [{
      role: "user",
      content: `Genre: ${args.genre}
Section notes: ${args.section_notes ?? "(none)"}
Same-section lyrics so far:
${args.same_section_lyrics || "(none)"}

Polish this line:
${args.line}`,
    }],
  });
  const block = message.content[0];
  if (block.type !== "text") throw new Error("unexpected");
  return block.text.trim();
}
```

**Step 2: Implement the endpoint** (similar shape to rhyme; no caching).

```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSection } from "@/lib/sections";
import { getProject } from "@/lib/projects";
import { polishLine } from "@/lib/claude";

export async function POST(req: Request) {
  const { section_id, line_index, line } = await req.json();
  const section = getSection(getDb(), section_id);
  if (!section) return NextResponse.json({ error: "section not found" }, { status: 404 });
  const project = getProject(getDb(), section.project_id);
  if (!project) return NextResponse.json({ error: "project not found" }, { status: 404 });

  const lines: { text: string }[] = JSON.parse(section.lines_json);
  const same_section_lyrics = lines.slice(0, line_index).map((l) => l.text).join("\n");

  try {
    const polished = await polishLine({
      line,
      section_notes: section.notes,
      same_section_lyrics,
      genre: project.genre,
    });
    return NextResponse.json({ polished });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
```

**Step 3: Implement `PolishPopover`**

```tsx
"use client";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface Props {
  trigger: React.ReactNode;
  original: string;
  onFetch: () => Promise<string>;
  onAccept: (polished: string) => void;
}

export function PolishPopover({ trigger, original, onFetch, onAccept }: Props) {
  const [polished, setPolished] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setPolished(await onFetch());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  }

  return (
    <Popover onOpenChange={(open) => { if (open && polished === null) load(); }}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80">
        {loading && <p className="text-sm">Polishing...</p>}
        {error && (
          <div>
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" onClick={load}>Retry</Button>
          </div>
        )}
        {polished && (
          <div className="space-y-2">
            <p className="text-sm line-through text-muted-foreground">{original}</p>
            <p className="text-sm font-medium">{polished}</p>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setPolished(null)}>Dismiss</Button>
              <Button size="sm" onClick={() => onAccept(polished)}>Accept</Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
```

**Step 4: Wire into `LineCard`** — replace the static "Polish" button with `PolishPopover`. On `onAccept`, set the line text to the polished value.

**Step 5: Smoke-test**

Write a line. Click Polish. Verify a polished version appears below the original (struck through). Accept — verify line updates.

**Step 6: Commit**

```bash
git add lyric-studio/web
git commit -m "feat(web): AI polish suggestions (Haiku 4.5) with diff popover"
```

---

## Task 20: Settings page

**Files:**
- Create: `lyric-studio/web/app/api/settings/verify-key/route.ts`
- Create: `lyric-studio/web/app/settings/page.tsx`

**Step 1: Implement key-verify endpoint**

```ts
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY not set" });
  try {
    const client = new Anthropic({ apiKey: key });
    await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1,
      messages: [{ role: "user", content: "ok" }],
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}
```

**Step 2: Implement settings page**

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [status, setStatus] = useState<string | null>(null);

  async function verify() {
    setStatus("Checking...");
    const r = await fetch("/api/settings/verify-key", { method: "POST" });
    const body = await r.json();
    setStatus(body.ok ? "API key works" : `Failed: ${body.error}`);
  }

  return (
    <main className="container mx-auto p-8 max-w-xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Anthropic API key</h2>
        <p className="text-sm text-muted-foreground">
          Set <code>ANTHROPIC_API_KEY</code> in your <code>.env</code> and restart the app.
        </p>
        <Button onClick={verify}>Verify API key</Button>
        {status && <p className="text-sm">{status}</p>}
      </section>
    </main>
  );
}
```

**Step 3: Smoke-test**

Visit `/settings`. Click verify. With key set, expect "API key works." Without, expect failure message.

**Step 4: Commit**

```bash
git add lyric-studio/web
git commit -m "feat(web): settings page with verify-API-key action"
```

---

## Task 21: Playback preview mode

**Files:**
- Modify: `lyric-studio/web/components/waveform.tsx`
- Modify: `lyric-studio/web/app/projects/[id]/project-editor.tsx`
- Create: `lyric-studio/web/components/playback-controls.tsx`

**Step 1: Add play/pause + position state to `Waveform`**

Expose imperative methods via `useImperativeHandle`:
- `play()`, `pause()`, `seekToSec(s)`, `getCurrentSec()`
- Emit `onTimeUpdate(seconds)` callback every animation frame while playing.

**Step 2: Implement `PlaybackControls`**

```tsx
"use client";
import { Button } from "@/components/ui/button";

export function PlaybackControls({
  isPlaying, onPlay, onPause, onStop,
}: { isPlaying: boolean; onPlay: () => void; onPause: () => void; onStop: () => void }) {
  return (
    <div className="flex gap-2 my-3">
      {!isPlaying ? <Button onClick={onPlay}>▶ Play</Button> : <Button onClick={onPause}>⏸ Pause</Button>}
      <Button variant="ghost" onClick={onStop}>⏹ Stop</Button>
    </div>
  );
}
```

**Step 3: Highlight active line in `LineCard`**

Add an `isActive: boolean` prop; when true, apply a highlight class (e.g., `ring-2 ring-primary`).

**Step 4: In `ProjectEditor`, track current playback time and compute the active line**

```tsx
const [currentMs, setCurrentMs] = useState(0);

const activeLineKey = useMemo(() => {
  if (!project.bpm || !project.time_sig) return null;
  for (const s of sections) {
    const lines = JSON.parse(s.lines_json) as Line[];
    for (let i = 0; i < lines.length; i++) {
      const start = barToMs(lines[i].bar_start, project.downbeat_offset_ms ?? 0, project.bpm, project.time_sig);
      const end = barToMs(lines[i].bar_end + 1, project.downbeat_offset_ms ?? 0, project.bpm, project.time_sig);
      if (currentMs >= start && currentMs < end) return `${s.id}:${i}`;
    }
  }
  return null;
}, [currentMs, sections, project]);
```

Pass `isActive={activeLineKey === '${s.id}:${i}'}` to each `LineCard`.

**Step 5: Add a `[♪ Play bars]` handler** that seeks the wavesurfer to `barToMs(line.bar_start)/1000` and plays until `barToMs(line.bar_end+1)/1000`.

**Step 6: Smoke-test**

Play the project. Verify lines highlight as the playhead crosses their bar ranges. Click `[♪ Play bars]` on a line — verify only that bar range plays.

**Step 7: Commit**

```bash
git add lyric-studio/web
git commit -m "feat(web): playback preview with line-level highlighting + per-line play"
```

---

## Task 22: Exports — lyrics.md, lyrics.json, project.json, zip

**Files:**
- Create: `lyric-studio/web/lib/exports.ts`
- Create: `lyric-studio/web/lib/__tests__/exports.test.ts`
- Create: `lyric-studio/web/app/api/projects/[id]/export/route.ts`
- Modify: `lyric-studio/web/app/projects/[id]/project-editor.tsx` (add Export button)

**Step 1: Write failing tests**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import path from "node:path";
import { runMigrations } from "../migrations";
import { createProject, updateProjectAnalysis } from "../projects";
import { createSection, updateSection } from "../sections";
import { buildLyricsJson, buildLyricsMd } from "../exports";

const M = path.resolve(__dirname, "../../migrations");

describe("exports", () => {
  let db: Database.Database;

  beforeEach(() => { db = new Database(":memory:"); runMigrations(db, M); });

  it("buildLyricsJson includes per-line ms timestamps", () => {
    const p = createProject(db, { title: "X", genre: "pop" });
    updateProjectAnalysis(db, p.id, {
      bpm: 120, key: "Cm", time_sig: "4/4",
      duration_ms: 60000, downbeat_offset_ms: 0,
      rms_envelope: [], energy_regions: [],
      instrumental_path: "/tmp/x.wav",
    });
    const s = createSection(db, { project_id: p.id, name: "V1", bar_start: 1, bar_end: 4 });
    updateSection(db, s.id, {
      lines_json: JSON.stringify([{ text: "hello world", bar_start: 1, bar_end: 2 }]),
    });
    const out = buildLyricsJson(db, p.id);
    expect(out.project.bpm).toBe(120);
    expect(out.sections[0].lines[0].time_start_ms).toBe(0);
    expect(out.sections[0].lines[0].time_end_ms).toBe(4000); // 2 bars × 2000ms
  });

  it("buildLyricsMd includes section header + bar-prefixed lines", () => {
    const p = createProject(db, { title: "X", genre: "pop" });
    updateProjectAnalysis(db, p.id, {
      bpm: 120, key: "Cm", time_sig: "4/4",
      duration_ms: 60000, downbeat_offset_ms: 0,
      rms_envelope: [], energy_regions: [],
      instrumental_path: "/tmp/x.wav",
    });
    const s = createSection(db, { project_id: p.id, name: "V1", bar_start: 1, bar_end: 4 });
    updateSection(db, s.id, {
      lines_json: JSON.stringify([{ text: "hello world", bar_start: 1, bar_end: 2 }]),
    });
    const md = buildLyricsMd(db, p.id);
    expect(md).toContain("# X");
    expect(md).toContain("## V1 (bars 1-4)");
    expect(md).toContain("[bars 1-2]  hello world");
  });
});
```

**Step 2: Implement `exports.ts`**

```ts
import type Database from "better-sqlite3";
import { getProject } from "./projects";
import { listSections } from "./sections";
import { barToMs } from "./bar-math";

export function buildLyricsJson(db: Database.Database, projectId: string) {
  const project = getProject(db, projectId);
  if (!project) throw new Error("project not found");
  const sections = listSections(db, projectId);

  return {
    project: {
      title: project.title,
      bpm: project.bpm,
      downbeat_offset_ms: project.downbeat_offset_ms ?? 0,
      time_sig: project.time_sig,
      duration_ms: project.duration_ms,
      genre: project.genre,
      key: project.key,
    },
    sections: sections.map((s) => {
      const lines = JSON.parse(s.lines_json) as { text: string; bar_start: number; bar_end: number }[];
      const time_start_ms = barToMs(s.bar_start, project.downbeat_offset_ms ?? 0, project.bpm!, project.time_sig!);
      const time_end_ms = barToMs(s.bar_end + 1, project.downbeat_offset_ms ?? 0, project.bpm!, project.time_sig!);
      return {
        name: s.name,
        bar_start: s.bar_start,
        bar_end: s.bar_end,
        time_start_ms, time_end_ms,
        notes: s.notes,
        lines: lines.map((l) => ({
          text: l.text,
          bar_start: l.bar_start,
          bar_end: l.bar_end,
          time_start_ms: barToMs(l.bar_start, project.downbeat_offset_ms ?? 0, project.bpm!, project.time_sig!),
          time_end_ms: barToMs(l.bar_end + 1, project.downbeat_offset_ms ?? 0, project.bpm!, project.time_sig!),
          syllable_count: countSyllablesQuick(l.text),
        })),
      };
    }),
  };
}

export function buildLyricsMd(db: Database.Database, projectId: string): string {
  const project = getProject(db, projectId);
  if (!project) throw new Error("project not found");
  const sections = listSections(db, projectId);

  const parts: string[] = [];
  parts.push(`# ${project.title}`);
  parts.push("");
  parts.push(
    `**BPM:** ${project.bpm} | **Key:** ${project.key} | **Time:** ${project.time_sig} | ` +
    `**Length:** ${formatDuration(project.duration_ms ?? 0)} | **Genre:** ${project.genre}`
  );
  parts.push("");
  for (const s of sections) {
    parts.push(`## ${s.name} (bars ${s.bar_start}-${s.bar_end})`);
    if (s.notes) {
      parts.push(`> Notes: ${s.notes}`);
    }
    parts.push("");
    const lines = JSON.parse(s.lines_json) as { text: string; bar_start: number; bar_end: number }[];
    for (const l of lines) {
      parts.push(`[bars ${l.bar_start}-${l.bar_end}]  ${l.text}`);
    }
    parts.push("");
  }
  return parts.join("\n");
}

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function countSyllablesQuick(text: string): number {
  // Re-export the syllable count for the JSON. Keep heavy imports out of hot path.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const syllable = require("syllable");
  return text ? syllable(text) : 0;
}
```

**Step 3: Run tests, expect pass**

Run: `pnpm test exports`
Expected: 2 PASS.

**Step 4: Implement the export endpoint**

Bundles into a zip and returns it.

```ts
import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import archiver from "archiver";
import { Readable } from "node:stream";
import { getDb } from "@/lib/db";
import { getProject } from "@/lib/projects";
import { buildLyricsJson, buildLyricsMd } from "@/lib/exports";

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = getProject(getDb(), id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });

  const exportRoot = path.join(os.homedir(), "Music", "lyric-studio", slug(project.title));
  fs.mkdirSync(exportRoot, { recursive: true });

  const lyricsJson = buildLyricsJson(getDb(), id);
  const lyricsMd = buildLyricsMd(getDb(), id);
  fs.writeFileSync(path.join(exportRoot, "lyrics.json"), JSON.stringify(lyricsJson, null, 2));
  fs.writeFileSync(path.join(exportRoot, "lyrics.md"), lyricsMd);
  fs.writeFileSync(path.join(exportRoot, "project.json"), JSON.stringify({ project, lyrics: lyricsJson }, null, 2));
  if (project.instrumental_path && fs.existsSync(project.instrumental_path)) {
    fs.copyFileSync(project.instrumental_path, path.join(exportRoot, "instrumental.wav"));
  }

  // Build zip
  const zipPath = path.join(exportRoot, `${slug(project.title)}.zip`);
  await new Promise<void>((resolve, reject) => {
    const out = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    out.on("close", () => resolve());
    archive.on("error", reject);
    archive.pipe(out);
    for (const f of ["lyrics.json", "lyrics.md", "project.json", "instrumental.wav"]) {
      const p = path.join(exportRoot, f);
      if (fs.existsSync(p)) archive.file(p, { name: f });
    }
    archive.finalize();
  });

  const buf = fs.readFileSync(zipPath);
  return new NextResponse(buf, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${slug(project.title)}.zip"`,
    },
  });
}
```

**Step 5: Add an Export button to `ProjectEditor`**

```tsx
<a href={`/api/projects/${project.id}/export`} download>
  <Button variant="outline">Download zip</Button>
</a>
```

Also add a "Mark lyrics done" toggle that PATCHes the project status.

**Step 6: Smoke-test**

Click Download. Verify a zip downloads + a folder appears at `~/Music/lyric-studio/<title-slug>/` with `lyrics.md`, `lyrics.json`, `project.json`, `instrumental.wav`. Inspect `lyrics.json` — confirm per-line timestamps present.

**Step 7: Commit**

```bash
git add lyric-studio/web
git commit -m "feat(web): exports — lyrics.md, lyrics.json, project.json, zip"
```

---

## Task 23: Final polish — README, doctor.sh refresh, end-to-end smoke checklist

**Files:**
- Modify: `lyric-studio/README.md`
- Modify: `lyric-studio/doctor.sh`
- Create: `lyric-studio/docs/MANUAL_SMOKE.md`

**Step 1: Expand README**

Add sections: Architecture overview, How to use (step-by-step), Phase 2/3 roadmap.

**Step 2: Update `doctor.sh`** — verify both `/health` endpoints respond when services are running.

**Step 3: Create `docs/MANUAL_SMOKE.md`** — a checklist:

```markdown
# Manual Smoke Test

After any meaningful change, run through this:

1. `./doctor.sh` — all green.
2. `./start.sh` — both services boot, browser at http://localhost:3000.
3. Empty state visible.
4. Create new project (use any short MP3/WAV). Wait for analysis.
5. Verify BPM, key, genre show on the project page.
6. Drag on the waveform → section created.
7. Rename section. Set lines per phrase.
8. Click "Generate notes" — verify notes appear (~2-5 sec).
9. Add a line. Type lyrics. Verify syllable counter updates.
10. Click Rhyme → verify popover with rhymes. Pick one.
11. Click Polish → verify polished version. Accept.
12. Click ▶ Play — verify lines highlight in time.
13. Click [♪] on a line — verify only that bar range plays.
14. Click Download zip — verify zip appears + `~/Music/lyric-studio/<slug>/` populated.
15. Open `lyrics.json` — verify per-line `time_start_ms`/`time_end_ms` present.
16. Soft-delete the project — disappears from list, appears in `/trash`.
17. Restore — returns to list.
18. Permanently delete from trash — gone for good.
```

**Step 4: Run the full checklist on a clean DB**

If anything breaks, fix and re-run.

**Step 5: Commit**

```bash
git add lyric-studio
git commit -m "docs(lyric-studio): README + manual smoke checklist + doctor.sh polish"
```

---

## Done

Phase 1 ships. Lyric Assistant fully usable. Voice Studio (Phase 2) is its own plan, unblocked.

**Quick scope-completion check:**

- ✅ Project library + status badges
- ✅ Soft-delete + trash
- ✅ Instrumental upload + analysis
- ✅ Section editor with bar grid + drag-to-create + downbeat shift + energy hints
- ✅ Section cards with name + AI notes (Sonnet 4.6, prompt-cached)
- ✅ Lyric line cards with syllable counter + autosave
- ✅ Rhyme suggestions (Haiku 4.5) with persistent cache
- ✅ Polish suggestions (Haiku 4.5) with diff popover
- ✅ Playback preview with line-level highlighting
- ✅ Per-line `[♪ Play bars]`
- ✅ Settings page with API key verify
- ✅ Exports: lyrics.md, lyrics.json (Phase 3 contract), project.json, zip

**Out of scope (correctly deferred):**

- ❌ Voice Studio (Phase 2)
- ❌ Lyric video generator (Phase 3)
- ❌ Multi-user / cloud / auth
- ❌ Drag-and-drop reorder (use up/down arrows)
- ❌ Knob tweaking on AI behavior
