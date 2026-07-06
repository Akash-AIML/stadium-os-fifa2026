from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models import ApiResponse, ChatRequest, ChatResponse, CrowdSnapshot, Alert, Recommendation, Route


from app.routes import crowd, navigate, chat

app = FastAPI(title="FIFA 2026 Smart Guide", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/health")
async def health() -> dict:
    return {"status": "ok", "service": "FIFA 2026 Smart Guide"}


# Include routers
app.include_router(crowd.router, prefix="/api/v1/crowd")
app.include_router(navigate.router, prefix="/api/v1/navigate")
app.include_router(chat.router, prefix="/api/v1/chat")