from fastapi.testclient import TestClient
from app.main import app
from app.services.crowd import crowd_engine

client = TestClient(app)


def test_api_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "FIFA 2026 Smart Guide"}


def test_api_time_update_integration():
    # Test setting match time via REST API and verify it updates the global crowd simulator
    response = client.post("/api/v1/crowd/time?minutes=45")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["match_time"] == 45
    assert crowd_engine.match_time_minutes == 45


def test_websocket_stadium_stream():
    # Test FastAPI WebSocket endpoint with TestClient context
    with client.websocket_connect("/api/v1/crowd/ws/metlife") as websocket:
        # 1. The server immediately pushes initial data on connection
        initial_data = websocket.receive_json()
        assert "crowd" in initial_data
        assert "alerts" in initial_data
        assert "recommendations" in initial_data

        # 2. Send simulation time update message to WebSocket
        websocket.send_json({"minutes": 15, "current_zone_id": "gate_north"})
        
        # 3. Verify the backend state was successfully updated asynchronously
        assert crowd_engine.match_time_minutes == 15


def test_rest_crowd_endpoints():
    # Test GET /api/v1/crowd/
    response = client.get("/api/v1/crowd/")
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert len(response.json()["data"]) > 0

    # Test GET /api/v1/crowd/alerts
    response = client.get("/api/v1/crowd/alerts")
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Test GET /api/v1/crowd/recommendations
    response = client.get("/api/v1/crowd/recommendations?zone_id=gate_north")
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_rest_navigate_endpoints():
    # Valid route
    response = client.get("/api/v1/navigate/?from_zone=gate_north&to_zone=food_court_a")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["path"] == ["gate_north", "food_court_a"]

    # Invalid zone ID to trigger ValueError catch block
    response = client.get("/api/v1/navigate/?from_zone=invalid_zone&to_zone=food_court_a")
    assert response.status_code == 200
    assert response.json()["success"] is False
    assert "invalid" in response.json()["error"].lower()


def test_chat_keyword_routing_and_validation():
    # Keyword: wc / restroom
    response = client.post(
        "/api/v1/chat/",
        json={
            "message": "Where is the nearest restroom or wc?",
            "language": "en",
            "current_zone_id": "gate_north",
        },
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Keyword: food
    response = client.post(
        "/api/v1/chat/",
        json={
            "message": "Where can I get some food?",
            "language": "en",
            "current_zone_id": "gate_north",
        },
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Validation failure: Invalid zone ID format
    response = client.post(
        "/api/v1/chat/",
        json={
            "message": "Hello",
            "language": "en",
            "current_zone_id": "invalid@zone",
        },
    )
    assert response.status_code == 200
    assert response.json()["success"] is False
    assert "invalid" in response.json()["error"].lower()

