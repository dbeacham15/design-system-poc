"""DSP chain: HPF → de-esser → comp → EQ → saturation → pre-delay → reverb.
   Also provides make_doubles and make_harmony for stems.
"""
import numpy as np
import pedalboard as pb
import pyrubberband as pyrb
from presets import get_preset


def apply_chain(y: np.ndarray, sr: int, genre: str, pre_delay_ms: int = 20) -> np.ndarray:
    """Run the full mono processing chain; return same-length mono array."""
    preset = get_preset(genre)
    comp_cfg = preset["comp"]
    rev_cfg = preset["reverb"]

    # Step 1: HPF
    hpf_board = pb.Pedalboard([pb.HighpassFilter(cutoff_frequency_hz=80.0)])
    y_hpf = hpf_board(y.copy(), sr)

    # Step 2: De-esser (pre-compressor, per design)
    y_deessed = _deess(y_hpf, sr)

    # Step 3: Compressor → EQ → Distortion
    eq_filters = [
        pb.PeakFilter(cutoff_frequency_hz=b["freq"], gain_db=b["gain"], q=1.0)
        for b in preset["eq"]
    ]
    dry_board = pb.Pedalboard([
        pb.Compressor(
            threshold_db=comp_cfg["threshold_db"],
            ratio=comp_cfg["ratio"],
            attack_ms=comp_cfg["attack_ms"],
            release_ms=comp_cfg["release_ms"],
        ),
        *eq_filters,
        pb.Distortion(drive_db=preset["distortion_drive_db"]),
    ])
    y_dry = dry_board(y_deessed, sr)

    # --- Pre-delay then reverb ---
    delay_samples = int(pre_delay_ms * sr / 1000)
    if delay_samples > 0:
        y_predelay = np.concatenate([np.zeros(delay_samples, dtype=y.dtype), y_dry])[:len(y_dry)]
    else:
        y_predelay = y_dry

    wet_level = rev_cfg["wet_level"]
    rev_board = pb.Pedalboard([
        pb.Reverb(
            room_size=rev_cfg["room_size"],
            wet_level=1.0,
            dry_level=0.0,
            damping=rev_cfg["damping"],
        )
    ])
    y_wet = rev_board(y_predelay.copy(), sr)[:len(y_dry)]

    return y_dry * (1.0 - wet_level) + y_wet * wet_level


def _deess(y: np.ndarray, sr: int) -> np.ndarray:
    """Reduce sibilance: isolate 5-9 kHz, compress, mix correction back at -3 dB."""
    sib_board = pb.Pedalboard([
        pb.HighpassFilter(cutoff_frequency_hz=5000.0),
        pb.LowpassFilter(cutoff_frequency_hz=9000.0),
    ])
    sib = sib_board(y.copy(), sr)

    comp_board = pb.Pedalboard([
        pb.Compressor(threshold_db=-25.0, ratio=4.0, attack_ms=1.0, release_ms=10.0)
    ])
    compressed = comp_board(sib.copy(), sr)

    correction = (compressed - sib) * float(10 ** (-3.0 / 20))
    return y + correction


def make_doubles(y: np.ndarray, sr: int) -> tuple[np.ndarray, np.ndarray]:
    """Return (double_L, double_R): ±12 cents pitch shift, ±7 ms delay."""
    delay_samples = int(7 * sr / 1000)

    dL = pyrb.pitch_shift(y, sr, 0.12)
    dL = np.concatenate([np.zeros(delay_samples, dtype=y.dtype), dL])[:len(y)]

    dR = pyrb.pitch_shift(y, sr, -0.12)
    if len(dR) > delay_samples:
        dR = dR[delay_samples:]
        dR = np.concatenate([dR, np.zeros(delay_samples, dtype=y.dtype)])[:len(y)]

    return dL, dR


def make_harmony(y: np.ndarray, sr: int, key: str) -> np.ndarray:
    """Pitch up by a minor 3rd (minor key) or major 3rd (major key)."""
    interval = 3.0 if key.endswith("m") else 4.0
    return pyrb.pitch_shift(y, sr, interval)
