import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from app.config import settings

class RateLimiter:
    def __init__(self, requests_limit: int, window_seconds: int):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.request_history = defaultdict(list)

    def is_rate_limited(self, client_ip: str) -> bool:
        current_time = time.time()
        # Filter request timestamps within the active time window
        timestamps = self.request_history[client_ip]
        self.request_history[client_ip] = [
            t for t in timestamps
            if current_time - t < self.window_seconds
        ]
        
        if len(self.request_history[client_ip]) >= self.requests_limit:
            return True
            
        self.request_history[client_ip].append(current_time)
        return False

# Limiter instance based on configurations
limiter = RateLimiter(settings.rate_limit_per_minute, 60)

async def rate_limit_dependency(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if limiter.is_rate_limited(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later."
        )
