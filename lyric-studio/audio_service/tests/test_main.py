from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

from pathlib import Path

FIXTURE = Path(__file__).parent / "fixtures" / "click_120bpm_4-4.wav"

def test_analyze_endpoint_returns_bpm():
    response = client.post("/analyze", json={"wav_path": str(FIXTURE)})
    assert response.status_code == 200
    body = response.json()
    assert "bpm" in body
    assert 118 <= body["bpm"] <= 122

def test_analyze_endpoint_404_on_missing_file():
    response = client.post("/analyze", json={"wav_path": "/nonexistent.wav"})
    assert response.status_code == 404

def test_features_endpoint():
    response = client.post("/features", json={
        "wav_path": str(FIXTURE), "start_ms": 0, "end_ms": 4000,
    })
    assert response.status_code == 200
    assert "rms_mean" in response.json()
