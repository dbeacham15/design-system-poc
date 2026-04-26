"""Pitch correction: pyin → key-snap → global median shift via pyrubberband."""
import numpy as np
import librosa
import pyrubberband as pyrb

MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11]
MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10]
NOTE_TO_PC = {
    "C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5,
    "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11,
}


def _key_notes(key: str) -> list[int]:
    """Return pitch class set for key strings like 'Cm' or 'F#'."""
    is_minor = key.endswith("m")
    root_str = key[:-1] if is_minor else key
    root_pc = NOTE_TO_PC.get(root_str, 0)
    intervals = MINOR_INTERVALS if is_minor else MAJOR_INTERVALS
    return [(root_pc + i) % 12 for i in intervals]


def pitch_correct(y: np.ndarray, sr: int, key: str, enabled: bool = True) -> np.ndarray:
    """
    Light pitch correction: detect median pitch deviation toward key notes
    (only if ≤50 cents) and apply global shift via pyrubberband.
    """
    if not enabled:
        return y

    f0, voiced_flag, _ = librosa.pyin(
        y,
        fmin=float(librosa.note_to_hz("C2")),
        fmax=float(librosa.note_to_hz("C6")),
        sr=sr,
    )

    if f0 is None or not np.any(voiced_flag):
        return y

    target_pcs = _key_notes(key)
    shifts: list[float] = []

    for freq, voiced in zip(f0, voiced_flag):
        if not voiced or freq is None or np.isnan(freq):
            continue
        current_pc = float(librosa.hz_to_midi(float(freq))) % 12.0

        best_diff: float | None = None
        for tpc in target_pcs:
            # Wrap to [-6, 6) for nearest pitch class
            diff = ((tpc - current_pc + 6) % 12) - 6
            if best_diff is None or abs(diff) < abs(best_diff):
                best_diff = diff

        if best_diff is not None and abs(best_diff) <= 0.5:
            shifts.append(best_diff)

    if not shifts:
        return y

    global_shift = float(np.median(shifts))
    if abs(global_shift) < 0.01:
        return y

    return pyrb.pitch_shift(y, sr, global_shift)
