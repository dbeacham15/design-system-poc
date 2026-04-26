"""Genre presets for the DSP chain. User cannot tweak these in Phase 2."""

GENRES = ["pop", "indie", "lofi", "rap", "rnb", "electronic", "rock", "ballad", "folk", "other"]

_PRESETS = {
    "pop": {
        "comp": {"threshold_db": -18.0, "ratio": 3.0, "attack_ms": 5.0, "release_ms": 50.0},
        "eq": [
            {"freq": 200.0, "gain": -1.5},   # tame boxiness
            {"freq": 3000.0, "gain": 2.0},   # presence
            {"freq": 10000.0, "gain": 1.5},  # air
        ],
        "distortion_drive_db": 2.0,
        "reverb": {"room_size": 0.25, "wet_level": 0.13, "damping": 0.5},
    },
    "indie": {
        "comp": {"threshold_db": -20.0, "ratio": 2.5, "attack_ms": 8.0, "release_ms": 80.0},
        "eq": [
            {"freq": 250.0, "gain": -1.0},
            {"freq": 2500.0, "gain": 1.5},
            {"freq": 8000.0, "gain": 1.0},
        ],
        "distortion_drive_db": 3.0,
        "reverb": {"room_size": 0.35, "wet_level": 0.17, "damping": 0.4},
    },
    "lofi": {
        "comp": {"threshold_db": -22.0, "ratio": 4.0, "attack_ms": 3.0, "release_ms": 40.0},
        "eq": [
            {"freq": 100.0, "gain": 1.0},
            {"freq": 5000.0, "gain": -2.0},  # dull highs for lofi feel
            {"freq": 12000.0, "gain": -4.0},
        ],
        "distortion_drive_db": 5.0,
        "reverb": {"room_size": 0.4, "wet_level": 0.2, "damping": 0.7},
    },
    "rap": {
        "comp": {"threshold_db": -16.0, "ratio": 4.0, "attack_ms": 2.0, "release_ms": 30.0},
        "eq": [
            {"freq": 150.0, "gain": 1.5},
            {"freq": 3500.0, "gain": 2.5},
            {"freq": 9000.0, "gain": 1.0},
        ],
        "distortion_drive_db": 1.0,
        "reverb": {"room_size": 0.2, "wet_level": 0.08, "damping": 0.6},
    },
    "rnb": {
        "comp": {"threshold_db": -20.0, "ratio": 3.5, "attack_ms": 4.0, "release_ms": 60.0},
        "eq": [
            {"freq": 200.0, "gain": -1.0},
            {"freq": 2800.0, "gain": 2.0},
            {"freq": 8000.0, "gain": 2.0},
        ],
        "distortion_drive_db": 2.5,
        "reverb": {"room_size": 0.3, "wet_level": 0.16, "damping": 0.45},
    },
    "electronic": {
        "comp": {"threshold_db": -15.0, "ratio": 5.0, "attack_ms": 2.0, "release_ms": 25.0},
        "eq": [
            {"freq": 300.0, "gain": -2.0},
            {"freq": 4000.0, "gain": 3.0},
            {"freq": 12000.0, "gain": 2.0},
        ],
        "distortion_drive_db": 2.0,
        "reverb": {"room_size": 0.2, "wet_level": 0.10, "damping": 0.3},
    },
    "rock": {
        "comp": {"threshold_db": -18.0, "ratio": 4.0, "attack_ms": 3.0, "release_ms": 40.0},
        "eq": [
            {"freq": 250.0, "gain": -1.5},
            {"freq": 3000.0, "gain": 2.0},
            {"freq": 7000.0, "gain": 1.5},
        ],
        "distortion_drive_db": 4.0,
        "reverb": {"room_size": 0.3, "wet_level": 0.12, "damping": 0.5},
    },
    "ballad": {
        "comp": {"threshold_db": -22.0, "ratio": 2.5, "attack_ms": 10.0, "release_ms": 100.0},
        "eq": [
            {"freq": 200.0, "gain": -1.0},
            {"freq": 2500.0, "gain": 1.0},
            {"freq": 9000.0, "gain": 1.5},
        ],
        "distortion_drive_db": 1.5,
        "reverb": {"room_size": 0.45, "wet_level": 0.20, "damping": 0.4},
    },
    "folk": {
        "comp": {"threshold_db": -24.0, "ratio": 2.0, "attack_ms": 10.0, "release_ms": 120.0},
        "eq": [
            {"freq": 300.0, "gain": -0.5},
            {"freq": 2000.0, "gain": 1.0},
            {"freq": 8000.0, "gain": 1.0},
        ],
        "distortion_drive_db": 1.0,
        "reverb": {"room_size": 0.3, "wet_level": 0.14, "damping": 0.5},
    },
    "other": {
        "comp": {"threshold_db": -18.0, "ratio": 3.0, "attack_ms": 5.0, "release_ms": 50.0},
        "eq": [
            {"freq": 250.0, "gain": -1.0},
            {"freq": 3000.0, "gain": 1.5},
        ],
        "distortion_drive_db": 2.0,
        "reverb": {"room_size": 0.25, "wet_level": 0.12, "damping": 0.5},
    },
}


def get_preset(genre: str) -> dict:
    return _PRESETS.get(genre, _PRESETS["pop"])
