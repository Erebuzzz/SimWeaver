"""
Tests for SimWeaver FastAPI Server Endpoints and Adapters
"""
import pytest
from fastapi.testclient import TestClient
from simweaver.server.app import app


def test_server_endpoints():
    client = TestClient(app)
    
    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    # 2. Init orchestrator with prompt
    res = client.post("/api/orchestrator/init", json={
        "prompt": "Build a warehouse with 5 AMRs under 60s delivery and zero collisions."
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "INITIALIZED"
    assert "eir" in data

    # 3. Step iteration
    res = client.post("/api/orchestrator/step")
    assert res.status_code == 200
    step_data = res.json()
    assert "history" in step_data

    # 4. Replay frames retrieval (for Exp #0)
    res = client.get("/api/experiments/0/frames")
    assert res.status_code == 200
    assert "frames" in res.json()

    # 5. State & Export endpoints
    res = client.get("/api/orchestrator/state")
    assert res.status_code == 200
    
    res = client.get("/api/export/yaml")
    assert res.status_code == 200
    assert "yaml" in res.json()

    res = client.get("/api/export/ros2")
    assert res.status_code == 200
    assert "launch_file_content" in res.json()

    res = client.get("/api/export/urdf")
    assert res.status_code == 200
    assert "<robot" in res.json()["urdf"]

    res = client.get("/api/export/webots")
    assert res.status_code == 200
    assert "WorldInfo" in res.json()["webots_world"]

    res = client.get("/api/export/pybullet")
    assert res.status_code == 200
    assert "pybullet" in res.json()["pybullet_script"]

    res = client.get("/api/export/report")
    assert res.status_code == 200
    assert "markdown_report" in res.json()

    # 6. Preset loader
    res = client.post("/api/presets/load", json={"preset_id": "hospital_cleanroom"})
    assert res.status_code == 200
    assert res.json()["eir"]["environment"]["name"] == "Hospital Sterile Cleanroom"

    print("[OK] All FastAPI server endpoints and simulator adapters verified successfully!")


if __name__ == "__main__":
    test_server_endpoints()
