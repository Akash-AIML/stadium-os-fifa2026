from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models import ApiResponse, ChatRequest, ChatResponse, CrowdSnapshot, Alert, Recommendation, Route


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


@app.get("/api/v1/crowd")
async def get_crowd(zone_id: str | None = None) -> ApiResponse[list[CrowdSnapshot]]:
    from app.routes.crowd import get_crowd_data
    return await get_crowd_data(zone_id)


@app.get("/api/v1/alerts")
async def get_alerts() -> ApiResponse[list[Alert]]:
    from app.routes.crowd import get_alerts as _get_alerts
    return await _get_alerts()


@app.get("/api/v1/recommend")
async def get_recommendations(zone_id: str | None = None) -> ApiResponse[list[Recommendation]]:
    from app.routes.crowd import get_recommendations as _get_recs
    return await _get_recs(zone_id)


@app.get("/api/v1/navigate")
async def navigate(from_zone: str, to_zone: str) -> ApiResponse[Route | None]:
    from app.routes.navigate import get_route
    return await get_route(from_zone, to_zone)


@app.post("/api/v1/chat")
async def chat(request: ChatRequest) -> ApiResponse[ChatResponse]:
    from app.routes.chat import handle_chat
    from app.utils.exceptions import AppException
    try:
        return await handle_chat(request)
    except AppException as e:
        return ApiResponse(success=False, error=e.message)
    except Exception as e:
        return ApiResponse(success=False, error=str(e))