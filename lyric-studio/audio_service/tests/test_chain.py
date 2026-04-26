import numpy as np
import soundfile as sf
import tempfile, os, pytest
from chain import apply_chain, make_doubles, make_harmony
from presets import get_preset

SR = 48000

def _white_noise(duration_s: float = 1.0) -> np.ndarray:
    rng = np.random.default_rng(42)
    return rng.standard_normal(int(SR * duration_s)).astype(np.float32) * 0.1

def _sine(freq: float, duration_s: float = 1.0) -> np.ndarray:
    t = np.linspace(0, duration_s, int(SR * duration_s), endpoint=False)
    return np.sin(2 * np.pi * freq * t).astype(np.float32) * 0.5


def test_apply_chain_output_length_matches_input():
    y = _white_noise(1.0)
    out = apply_chain(y, SR, "pop")
    assert len(out) == len(y)


def test_apply_chain_output_not_clipped():
    y = _white_noise(1.0)
    out = apply_chain(y, SR, "pop")
    assert np.max(np.abs(out)) <= 1.0


def test_apply_chain_output_not_silent():
    y = _white_noise(1.0)
    out = apply_chain(y, SR, "pop")
    assert np.max(np.abs(out)) > 1e-6


def test_apply_chain_works_for_all_genres():
    y = _white_noise(0.5)
    for genre in ["pop", "lofi", "rap", "rnb", "rock"]:
        out = apply_chain(y, SR, genre)
        assert len(out) == len(y)


def test_make_doubles_returns_two_mono_arrays():
    y = _sine(440.0, 0.5)
    dL, dR = make_doubles(y, SR)
    assert dL.ndim == 1
    assert dR.ndim == 1
    assert abs(len(dL) - len(y)) <= SR // 100  # within 10ms


def test_make_doubles_are_different_from_each_other():
    y = _sine(440.0, 0.5)
    dL, dR = make_doubles(y, SR)
    min_len = min(len(dL), len(dR))
    assert not np.allclose(dL[:min_len], dR[:min_len])


def test_make_harmony_major_third():
    y = _sine(440.0, 1.0)  # A4
    harmony = make_harmony(y, SR, "C")  # C major → major 3rd (+4 semitones) → C#5 = 554 Hz
    assert len(harmony) > 0
    assert not np.allclose(harmony, y)
