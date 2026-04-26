from presets import get_preset, GENRES

def test_get_preset_returns_dict_for_all_genres():
    for g in GENRES:
        p = get_preset(g)
        assert "comp" in p
        assert "eq" in p
        assert "reverb" in p
        assert "distortion_drive_db" in p

def test_get_preset_falls_back_to_pop_for_unknown():
    p = get_preset("zork")
    assert p == get_preset("pop")

def test_comp_has_required_keys():
    p = get_preset("lofi")
    for k in ("threshold_db", "ratio", "attack_ms", "release_ms"):
        assert k in p["comp"]

def test_reverb_has_required_keys():
    p = get_preset("rnb")
    for k in ("room_size", "wet_level", "damping"):
        assert k in p["reverb"]
