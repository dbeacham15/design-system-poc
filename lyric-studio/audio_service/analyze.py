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
    bpm = float(round(float(np.asarray(tempo).item())))

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
