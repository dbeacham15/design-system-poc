import numpy as np
import librosa
import pytest
from tune import pitch_correct, _key_notes

SR = 48000

def _sine(freq: float, duration_s: float = 1.0) -> np.ndarray:
    t = np.linspace(0, duration_s, int(SR * duration_s), endpoint=False)
    return np.sin(2 * np.pi * freq * t).astype(np.float32)


def test_key_notes_c_major():
    pcs = _key_notes("C")
    assert set(pcs) == {0, 2, 4, 5, 7, 9, 11}


def test_key_notes_a_minor():
    pcs = _key_notes("Am")
    assert set(pcs) == {9, 11, 0, 2, 4, 5, 7}


def test_pitch_correct_disabled_returns_input():
    y = _sine(440.0)
    out = pitch_correct(y, SR, "C", enabled=False)
    np.testing.assert_array_equal(y, out)


def test_pitch_correct_in_tune_signal_unchanged():
    """440 Hz is A4, in C major — no correction needed."""
    y = _sine(440.0, duration_s=2.0)
    out = pitch_correct(y, SR, "C")
    f0_out, voiced, _ = librosa.pyin(out, fmin=librosa.note_to_hz("C2"), fmax=librosa.note_to_hz("C6"), sr=SR)
    voiced_f0 = f0_out[voiced]
    assert len(voiced_f0) > 0
    assert abs(np.median(voiced_f0) - 440.0) < 10.0  # within 10 Hz of A4


def test_pitch_correct_snaps_sharp_note_closer_to_key():
    """450 Hz is ~0.39 semitones above A4; should snap toward A4."""
    y = _sine(450.0, duration_s=2.0)
    out = pitch_correct(y, SR, "C")
    f0_out, voiced, _ = librosa.pyin(out, fmin=librosa.note_to_hz("C2"), fmax=librosa.note_to_hz("C6"), sr=SR)
    voiced_f0 = f0_out[voiced]
    assert len(voiced_f0) > 0
    # Output should be closer to 440 Hz than the input (450 Hz)
    median_in = 450.0
    median_out = float(np.median(voiced_f0))
    assert abs(median_out - 440.0) < abs(median_in - 440.0)


def test_pitch_correct_leaves_large_deviation_alone():
    """480 Hz is ~1.5 semitones above A4 — outside 50 cent threshold, no correction."""
    y = _sine(480.0, duration_s=2.0)
    out = pitch_correct(y, SR, "C")
    f0_out, voiced, _ = librosa.pyin(out, fmin=librosa.note_to_hz("C2"), fmax=librosa.note_to_hz("C6"), sr=SR)
    voiced_f0 = f0_out[voiced]
    assert len(voiced_f0) > 0
    # Should be close to 480 Hz (not snapped)
    assert abs(float(np.median(voiced_f0)) - 480.0) < 20.0
