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
