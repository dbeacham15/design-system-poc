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
