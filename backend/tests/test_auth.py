import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_login_admin():
    response = client.post("/api/auth/login", json={
        "email": "admin@icmrs.gov",
        "password": "Admin@123456"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["role"] == "admin"

def test_login_officer():
    response = client.post("/api/auth/login", json={
        "email": "officer@icmrs.gov",
        "password": "Officer@123456"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["user"]["role"] == "officer"

def test_login_invalid_password():
    response = client.post("/api/auth/login", json={
        "email": "admin@icmrs.gov",
        "password": "WrongPassword999"
    })
    assert response.status_code == 401
