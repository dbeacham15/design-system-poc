import numpy as np
import pyloudnorm as pyln
import pytest
from bounce import bounce_stems

SR = 48000

def _signal(duration_s: float = 2.0) -> np.ndarray:
    rng = np.random.default_rng(0)
    return rng.standard_normal(int(SR * duration_s)).astype(np.float32) * 0.1


def test_bounce_returns_stereo():
    lead = _signal()
    dL = _signal()
    dR = _signal()
    inst = np.vstack([_signal(), _signal()])  # stereo instrumental (2, N)
    out = bounce_stems(lead, dL, dR, inst, SR)
    assert out.ndim == 2
    assert out.shape[0] == 2


def test_bounce_lufs_near_minus14():
    lead = _signal(3.0)
    dL = _signal(3.0)
    dR = _signal(3.0)
    inst = np.vstack([_signal(3.0), _signal(3.0)])
    out = bounce_stems(lead, dL, dR, inst, SR)
    meter = pyln.Meter(SR)
    lufs = meter.integrated_loudness(out.T)
    assert abs(lufs - (-14.0)) < 1.0


def test_bounce_with_harmony():
    lead = _signal(3.0)
    dL = _signal(3.0)
    dR = _signal(3.0)
    inst = np.vstack([_signal(3.0), _signal(3.0)])
    harmony = _signal(3.0)
    out = bounce_stems(lead, dL, dR, inst, SR, harmony=harmony)
    assert out.shape[0] == 2


def test_bounce_mono_instrumental():
    lead = _signal(2.0)
    dL = _signal(2.0)
    dR = _signal(2.0)
    inst = _signal(2.0)  # mono
    out = bounce_stems(lead, dL, dR, inst, SR)
    assert out.shape[0] == 2
