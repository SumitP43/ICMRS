import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_list_complaints():
    response = client.get("/api/complaints")
    assert response.status_code == 200
    complaints = response.json()
    assert isinstance(complaints, list)
    assert len(complaints) > 0
    assert "complaintNumber" in complaints[0]

def test_create_and_get_complaint():
    payload = {
        "title": "Severe broken manhole on main crossing",
        "description": "Open manhole without warning sign or lid causing acute vehicular risk during night hours.",
        "category": "Water & Sanitation",
        "location": "Barakhamba Road, Connaught Place",
        "coordinates": {"lat": 28.6300, "lng": 77.2200},
        "priority": "High",
        "citizenName": "Test Citizen",
        "citizenEmail": "test.citizen@example.com"
    }
    create_res = client.post("/api/complaints", json=payload)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["title"] == payload["title"]
    assert "complaintNumber" in created
    assert created["pipelineStep"] == 1

    # Fetch by number (URL encode # character)
    import urllib.parse
    encoded_num = urllib.parse.quote(created['complaintNumber'])
    get_res = client.get(f"/api/complaints/{encoded_num}")
    assert get_res.status_code == 200
    fetched = get_res.json()
    assert fetched["id"] == created["id"]
