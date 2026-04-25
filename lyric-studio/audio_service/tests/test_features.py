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
