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
