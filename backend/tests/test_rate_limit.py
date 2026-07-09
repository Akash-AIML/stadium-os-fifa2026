import time
import pytest
from app.utils.rate_limit import RateLimiter

def test_rate_limiter_under_limit():
    limiter = RateLimiter(requests_limit=5, window_seconds=60)
    client_ip = "127.0.0.1"
    
    # 5 requests should be allowed
    for _ in range(5):
        assert limiter.is_rate_limited(client_ip) is False

def test_rate_limiter_over_limit():
    limiter = RateLimiter(requests_limit=3, window_seconds=60)
    client_ip = "192.168.1.1"
    
    # First 3 allowed
    assert limiter.is_rate_limited(client_ip) is False
    assert limiter.is_rate_limited(client_ip) is False
    assert limiter.is_rate_limited(client_ip) is False
    
    # 4th should be limited
    assert limiter.is_rate_limited(client_ip) is True

def test_rate_limiter_window_reset():
    limiter = RateLimiter(requests_limit=2, window_seconds=1)
    client_ip = "10.0.0.1"
    
    assert limiter.is_rate_limited(client_ip) is False
    assert limiter.is_rate_limited(client_ip) is False
    assert limiter.is_rate_limited(client_ip) is True
    
    # Wait for window to pass
    time.sleep(1.1)
    
    # Should be allowed again
    assert limiter.is_rate_limited(client_ip) is False
