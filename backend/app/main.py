import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config import settings
from app.routes import crowd, navigate, chat

logger = logging.getLogger(__name__)

app = FastAPI(
    title="FIFA 2026 Smart Guide",
    version="1.0.0",
    docs_url="/docs" if settings.dev_mode else None,
    redoc_url="/redoc" if settings.dev_mode else None,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next) -> Response:
    """
    Appends security hardeners (CSP, HSTS, XFO, nosniff) to every HTTP API response envelope.
    """
    response: Response = await call_next(request)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; frame-ancestors 'none'; object-src 'none';"
    )
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains"
    )
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


@app.get("/api/v1/health")
async def health() -> dict[str, str]:
    """
    Quick status ping check validating server availability.
    """
    logger.info("Health check ping received")
    return {"status": "ok", "service": "FIFA 2026 Smart Guide"}


# Include routers
app.include_router(crowd.router, prefix="/api/v1/crowd")
app.include_router(navigate.router, prefix="/api/v1/navigate")
app.include_router(chat.router, prefix="/api/v1/chat")