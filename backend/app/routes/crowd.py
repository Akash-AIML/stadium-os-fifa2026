import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.models import ApiResponse, CrowdSnapshot, Alert, Recommendation
from app.services.crowd import crowd_engine
from app.services.recommendation import recommendation_engine
from app.utils.rate_limit import rate_limit_dependency, limiter

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=ApiResponse[list[CrowdSnapshot]], dependencies=[Depends(rate_limit_dependency)])
async def get_crowd_data(zone_id: str | None = None, stadium_id: str = "metlife") -> ApiResponse[list[CrowdSnapshot]]:
    """
    Fetch live simulated crowd snapshots for zones, optionally filtered by zone_id.
    Rate-limited.
    """
    logger.info("Fetching crowd data for zone_id=%s, stadium_id=%s", zone_id, stadium_id)
    if zone_id:
        try:
            snapshots = [crowd_engine.get_snapshot(zone_id, stadium_id)]
        except ValueError as e:
            logger.error("Error fetching zone snapshot: %s", str(e))
            return ApiResponse(success=False, data=[], error="Zone not found")
    else:
        snapshots = crowd_engine.get_all_snapshots(stadium_id)
    return ApiResponse(success=True, data=snapshots)


@router.get("/alerts", response_model=ApiResponse[list[Alert]], dependencies=[Depends(rate_limit_dependency)])
async def get_alerts(stadium_id: str = "metlife") -> ApiResponse[list[Alert]]:
    """
    Fetch active warning/critical stadium alerts.
    Rate-limited.
    """
    logger.info("Fetching alerts for stadium_id=%s", stadium_id)
    alerts = crowd_engine.get_alerts(stadium_id)
    return ApiResponse(success=True, data=alerts)


@router.get("/recommendations", response_model=ApiResponse[list[Recommendation]], dependencies=[Depends(rate_limit_dependency)])
async def get_recommendations(zone_id: str | None = None, stadium_id: str = "metlife") -> ApiResponse[list[Recommendation]]:
    """
    Fetch live context recommendations for food/wc wait optimizations.
    Rate-limited.
    """
    logger.info("Fetching recommendations for zone_id=%s, stadium_id=%s", zone_id, stadium_id)
    snapshots = crowd_engine.get_all_snapshots(stadium_id)
    recs = recommendation_engine.generate(snapshots, zone_id, stadium_id)
    return ApiResponse(success=True, data=recs)


@router.post("/time", response_model=ApiResponse[dict], dependencies=[Depends(rate_limit_dependency)])
async def set_time(minutes: int) -> ApiResponse[dict]:
    """
    Advance match clock simulation time.
    Rate-limited.
    """
    logger.info("Advancing simulation match clock time to minute: %d", minutes)
    crowd_engine.set_match_time(minutes)
    return ApiResponse(success=True, data={"match_time": crowd_engine.match_time_minutes})


@router.websocket("/ws/{stadium_id}")
async def websocket_endpoint(websocket: WebSocket, stadium_id: str) -> None:
    """
    WebSocket endpoint streaming live alerts, zones, and crowd status feeds to client subscribers.
    Validated for safe origin and IP rate-limiting parameters.
    """
    # 1. Origin Header Validation Check
    origin = websocket.headers.get("origin")
    if origin:
        allowed = ["http://localhost:5173", "https://stadium-os-fifa2026.vercel.app"]
        if origin not in allowed and not origin.endswith(".vercel.app"):
            logger.warning("Rejected WebSocket origin: %s", origin)
            await websocket.close(code=4003, reason="Forbidden origin")
            return

    # 2. IP rate limit check
    x_forwarded_for = websocket.headers.get("x-forwarded-for")
    if x_forwarded_for:
        client_ip = x_forwarded_for.split(",")[0].strip()
    else:
        client_ip = websocket.client.host if websocket.client else "unknown"

    if limiter.is_rate_limited(client_ip):
        logger.warning("Rejected WebSocket connection due to rate limits: %s", client_ip)
        await websocket.accept()
        await websocket.close(code=1008, reason="Rate limit exceeded")
        return

    logger.info("WebSocket handshake accepted for stadium_id=%s (ip=%s)", stadium_id, client_ip)
    await websocket.accept()
    current_zone_id = None
    
    async def receive_messages():
        nonlocal current_zone_id
        try:
            while True:
                data = await websocket.receive_json()
                if isinstance(data, dict):
                    if "current_zone_id" in data:
                        current_zone_id = data["current_zone_id"]
                    if "minutes" in data:
                        crowd_engine.set_match_time(int(data["minutes"]))
        except Exception as e:
            logger.info("WebSocket connection read stream ended: %s", str(e))

    receive_task = asyncio.create_task(receive_messages())
    
    try:
        while True:
            snapshots = crowd_engine.get_all_snapshots(stadium_id)
            alerts = crowd_engine.get_alerts(stadium_id)
            recs = recommendation_engine.generate(snapshots, current_zone_id, stadium_id)
            
            payload = {
                "crowd": [snap.model_dump() for snap in snapshots],
                "alerts": [alert.model_dump() for alert in alerts],
                "recommendations": [rec.model_dump() for rec in recs],
                "match_time": crowd_engine.match_time_minutes
            }
            try:
                await websocket.send_json(payload)
            except (WebSocketDisconnect, RuntimeError) as e:
                logger.info("WebSocket connection write stream ended: %s", str(e))
                break
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        logger.info("WebSocket subscriber disconnected")
    finally:
        receive_task.cancel()