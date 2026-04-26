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


import threading
import soundfile as sf
import numpy as np
from jobs import create_job, get_job, update_job
from tune import pitch_correct
from chain import apply_chain, make_doubles, make_harmony
from bounce import bounce_stems


class ProcessRequest(BaseModel):
    project_id: str
    take_id: str
    take_path: str
    instrumental_path: str
    key: str
    genre: str
    output_dir: str
    trim_start_ms: int = 0
    trim_end_ms: int = 0
    latency_ms: int = 25
    pitch_correction: bool = True
    harmony: bool = False


@app.post("/process", status_code=202)
def process(req: ProcessRequest):
    if not Path(req.take_path).exists():
        raise HTTPException(404, f"take not found: {req.take_path}")
    if not Path(req.instrumental_path).exists():
        raise HTTPException(404, f"instrumental not found: {req.instrumental_path}")
    job = create_job()
    t = threading.Thread(target=_run_pipeline, args=(job.id, req), daemon=True)
    t.start()
    return {"job_id": job.id}


@app.get("/jobs/{job_id}")
def job_status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, f"job not found: {job_id}")
    return {"job_id": job.id, "status": job.status, "progress": job.progress, "error": job.error}


def _run_pipeline(job_id: str, req: ProcessRequest) -> None:
    try:
        update_job(job_id, status="running", progress=5)
        SR = 48000
        out = Path(req.output_dir)
        out.mkdir(parents=True, exist_ok=True)

        # 1. Load and trim take
        y_raw, file_sr = sf.read(req.take_path, dtype="float32", always_2d=False)
        if y_raw.ndim == 2:
            y_raw = y_raw.mean(axis=1)  # stereo -> mono
        if file_sr != SR:
            import librosa
            y_raw = librosa.resample(y_raw, orig_sr=file_sr, target_sr=SR)

        # Apply latency compensation (shift audio forward by latency_ms)
        if req.latency_ms > 0:
            delay = int(req.latency_ms * SR / 1000)
            y_raw = np.concatenate([np.zeros(delay, dtype=np.float32), y_raw])

        # Trim
        if req.trim_end_ms > req.trim_start_ms:
            s = int(req.trim_start_ms * SR / 1000)
            e = int(req.trim_end_ms * SR / 1000)
            y_raw = y_raw[s:e]

        # Save lead-raw.wav
        sf.write(str(out / "lead-raw.wav"), y_raw, SR, subtype="FLOAT")
        update_job(job_id, progress=15)

        # 2. Pitch correction
        y_tuned = pitch_correct(y_raw, SR, req.key, enabled=req.pitch_correction)
        sf.write(str(out / "lead-tuned.wav"), y_tuned, SR, subtype="FLOAT")
        update_job(job_id, progress=35)

        # 3. DSP chain
        y_chain = apply_chain(y_tuned, SR, req.genre)
        update_job(job_id, progress=60)

        # 4. Doubles
        dL, dR = make_doubles(y_chain, SR)
        sf.write(str(out / "lead-double-L.wav"), dL, SR, subtype="FLOAT")
        sf.write(str(out / "lead-double-R.wav"), dR, SR, subtype="FLOAT")
        update_job(job_id, progress=75)

        # 5. Optional harmony
        y_harmony = None
        if req.harmony:
            y_harmony = make_harmony(y_chain, SR, req.key)
            sf.write(str(out / "lead-harmony.wav"), y_harmony, SR, subtype="FLOAT")
        update_job(job_id, progress=85)

        # 6. Load instrumental + bounce
        inst, inst_sr = sf.read(req.instrumental_path, dtype="float32", always_2d=True)
        inst = inst.T  # soundfile returns (N, C); we want (C, N)
        if inst_sr != SR:
            import librosa
            inst = np.vstack([librosa.resample(inst[i], orig_sr=inst_sr, target_sr=SR) for i in range(inst.shape[0])])
        # Ensure stereo (2, N) — duplicate mono if needed
        if inst.shape[0] == 1:
            inst = np.vstack([inst, inst])

        bounce = bounce_stems(y_chain, dL, dR, inst, SR, harmony=y_harmony)
        sf.write(str(out / "bounce.wav"), bounce.T, SR, subtype="FLOAT")
        update_job(job_id, progress=100, status="done", result={"output_dir": str(out)})

    except Exception as exc:
        update_job(job_id, status="error", error=str(exc))
