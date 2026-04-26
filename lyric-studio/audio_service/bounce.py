"""Mix stems into a stereo bounce and normalize to -14 LUFS."""
import numpy as np
import pedalboard as pb
import pyloudnorm as pyln


def _db(x: float) -> float:
    return float(10 ** (x / 20))


def _duck_instrumental(inst: np.ndarray, sr: int) -> np.ndarray:
    """Apply -6 dB gain + 2-4 kHz scoop to carve vocal space."""
    if inst.ndim == 2:
        channels = []
        for ch in inst:
            channels.append(_duck_mono(ch, sr))
        return np.vstack(channels)
    return _duck_mono(inst, sr)


def _duck_mono(y: np.ndarray, sr: int) -> np.ndarray:
    board = pb.Pedalboard([
        pb.Gain(gain_db=-6.0),
        pb.PeakFilter(cutoff_frequency_hz=3000.0, gain_db=-2.5, q=0.7),
    ])
    return board(y.copy(), sr)


def bounce_stems(
    lead: np.ndarray,
    double_L: np.ndarray,
    double_R: np.ndarray,
    instrumental: np.ndarray,
    sr: int,
    harmony: np.ndarray | None = None,
) -> np.ndarray:
    """
    Mix stems into a stereo (-14 LUFS) bounce.

    Returns ndarray of shape (2, N): [left, right].
    """
    inst_ducked = _duck_instrumental(instrumental, sr)

    if inst_ducked.ndim == 2:
        inst_L, inst_R = inst_ducked[0], inst_ducked[1]
    else:
        inst_L = inst_R = inst_ducked

    # Align all to shortest
    stems = [lead, double_L, double_R, inst_L, inst_R]
    if harmony is not None:
        stems.append(harmony)
    N = min(len(s) for s in stems)

    mix_L = (
        lead[:N] * _db(0)
        + double_L[:N] * _db(-6)
        + inst_L[:N] * _db(0)  # inst already ducked to -6 dB
    )
    mix_R = (
        lead[:N] * _db(0)
        + double_R[:N] * _db(-6)
        + inst_R[:N] * _db(0)
    )

    if harmony is not None:
        mix_L += harmony[:N] * _db(-9)
        mix_R += harmony[:N] * _db(-9)

    stereo = np.vstack([mix_L, mix_R])  # (2, N)

    # Normalize to -14 LUFS
    meter = pyln.Meter(sr)
    lufs = meter.integrated_loudness(stereo.T)  # pyloudnorm wants (N, 2)
    if np.isfinite(lufs):
        normalized = pyln.normalize.loudness(stereo.T, lufs, -14.0)
        stereo = normalized.T

    return stereo.astype(np.float32)
