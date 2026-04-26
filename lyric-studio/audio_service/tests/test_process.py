import time
from pathlib import Path
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

FIXTURE = Path(__file__).parent / "fixtures" / "click_120bpm_4-4.wav"


def test_jobs_unknown_returns_404():
    r = client.get("/jobs/nonexistent-id")
    assert r.status_code == 404


def test_process_missing_field_returns_422():
    r = client.post("/process", json={})
    assert r.status_code == 422


def test_process_nonexistent_take_path_returns_404():
    r = client.post("/process", json={
        "project_id": "p1",
        "take_id": "t1",
        "take_path": "/nonexistent/raw.wav",
        "instrumental_path": str(FIXTURE),
        "key": "C",
        "genre": "pop",
        "output_dir": "/tmp/test_output",
        "latency_ms": 25,
        "pitch_correction": True,
        "harmony": False,
    })
    assert r.status_code == 404


def test_process_creates_job_and_polls_to_completion(tmp_path):
    import shutil
    out_dir = tmp_path / "stems"
    out_dir.mkdir()
    r = client.post("/process", json={
        "project_id": "p1",
        "take_id": "t1",
        "take_path": str(FIXTURE),
        "instrumental_path": str(FIXTURE),
        "key": "C",
        "genre": "pop",
        "trim_start_ms": 0,
        "trim_end_ms": 0,
        "output_dir": str(out_dir),
        "latency_ms": 0,
        "pitch_correction": False,  # skip for speed
        "harmony": False,
    })
    assert r.status_code == 202
    job_id = r.json()["job_id"]

    # Poll until done (max 60 sec)
    for _ in range(60):
        jr = client.get(f"/jobs/{job_id}")
        assert jr.status_code == 200
        status = jr.json()["status"]
        if status == "done":
            break
        if status == "error":
            raise AssertionError(f"Job failed: {jr.json().get('error')}")
        time.sleep(1.0)
    else:
        raise AssertionError("Job timed out")

    # Stems should exist
    assert (out_dir / "lead-tuned.wav").exists()
    assert (out_dir / "bounce.wav").exists()
