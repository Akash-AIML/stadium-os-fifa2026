import logging
import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from app.config import settings

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    In-memory rolling-window request rate limiter indexed by client IP.
    """

    def __init__(self, requests_limit: int, window_seconds: int):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.request_history = defaultdict(list)

    def is_rate_limited(self, client_ip: str) -> bool:
        """
        Determines whether the given IP has exceeded request limit within active window timeframe.
        """
        current_time = time.time()
        # Filter request timestamps within the active time window
        timestamps = self.request_history[client_ip]
        self.request_history[client_ip] = [
            t for t in timestamps
            if current_time - t < self.window_seconds
        ]
        
        if len(self.request_history[client_ip]) >= self.requests_limit:
            logger.warning("IP rate limit tripped: %s", client_ip)
            return True
            
        self.request_history[client_ip].append(current_time)
        return False


# Limiter instance based on configurations
limiter = RateLimiter(settings.rate_limit_per_minute, 60)


async def rate_limit_dependency(request: Request) -> None:
    """
    FastAPI dependency injection checking incoming request rate limit using X-Forwarded-For proxy IP headers.
    """
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        client_ip = x_forwarded_for.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "unknown"

    if limiter.is_rate_limited(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later."
        )
