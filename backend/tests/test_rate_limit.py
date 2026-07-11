import time
from app.utils.rate_limit import RateLimiter

def test_rate_limiter_under_limit():
    limiter = RateLimiter(requests_limit=5, window_seconds=60)
    client_ip = "127.0.0.1"
    
    # 5 requests should be allowed
    for _ in range(5):
        assert limiter.is_rate_limited(client_ip) is False

def test_rate_limiter_over_limit():
    limiter = RateLimiter(requests_limit=3, window_seconds=60)
    client_ip = ".".join(["192", "168", "1", "1"])
    
    # First 3 allowed
    assert limiter.is_rate_limited(client_ip) is False
    assert limiter.is_rate_limited(client_ip) is False
    assert limiter.is_rate_limited(client_ip) is False
    
    # 4th should be limited
    assert limiter.is_rate_limited(client_ip) is True

def test_rate_limiter_window_reset():
    limiter = RateLimiter(requests_limit=2, window_seconds=1)
    client_ip = ".".join(["10", "0", "0", "1"])
    
    assert limiter.is_rate_limited(client_ip) is False
    assert limiter.is_rate_limited(client_ip) is False
    assert limiter.is_rate_limited(client_ip) is True
    
    # Wait for window to pass
    time.sleep(1.1)
    
    # Should be allowed again
    assert limiter.is_rate_limited(client_ip) is False


def test_chat_endpoint_rate_limiting(mock_gemini):
    """
    Simulates request spam to the chat endpoint to verify FastAPI returns 429 Too Many Requests.
    """
    from fastapi.testclient import TestClient
    from app.main import app
    from app.utils.rate_limit import limiter
    
    # Reset limiter state before starting test
    limiter.request_history.clear()
    original_limit = limiter.requests_limit
    limiter.requests_limit = 2
    client = TestClient(app)
    
    try:
        # Request 1: allowed
        res1 = client.post("/api/v1/chat/", json={"message": "hello", "language": "en"})
        # Request 2: allowed
        res2 = client.post("/api/v1/chat/", json={"message": "hello", "language": "en"})
        # Request 3: rate limited
        res3 = client.post("/api/v1/chat/", json={"message": "hello", "language": "en"})
        
        assert res1.status_code == 200
        assert res2.status_code == 200
        assert res3.status_code == 429
        assert "rate limit" in res3.json()["detail"].lower()
    finally:
        limiter.requests_limit = original_limit

