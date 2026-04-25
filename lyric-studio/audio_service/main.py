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
