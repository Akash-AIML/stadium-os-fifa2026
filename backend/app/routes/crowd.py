import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.models import ApiResponse, CrowdSnapshot, Alert, Recommendation
from app.services.crowd import crowd_engine
from app.services.recommendation import recommendation_engine
from app.utils.rate_limit import rate_limit_dependency, limiter
from app.utils.validators import validate_zone_id

logger = logging.getLogger(__name__)
router = APIRouter()

INVALID_STADIUM_ID = "Invalid stadium ID"


@router.get("/", dependencies=[Depends(rate_limit_dependency)])
async def get_crowd_data(
    zone_id: str | None = None,
    stadium_id: str = "metlife"
) -> ApiResponse[list[CrowdSnapshot]]:
    """
    Fetch live simulated crowd snapshots for zones, optionally filtered by zone_id.
    Rate-limited.
    """
    try:
        clean_zone = validate_zone_id(zone_id) if zone_id else None
        if stadium_id not in ["metlife", "sofi", "azteca"]:
            raise ValueError(INVALID_STADIUM_ID)

        clean_stadium = stadium_id
        logger.info("Fetching crowd data (zone filter applied: %s)", bool(clean_zone))
        if clean_zone:
            snapshots = [crowd_engine.get_snapshot(clean_zone, clean_stadium)]
        else:
            snapshots = crowd_engine.get_all_snapshots(clean_stadium)
        return ApiResponse(success=True, data=snapshots)
    except ValueError:
        logger.exception("Error fetching zone snapshot")
        return ApiResponse(success=False, data=[], error="Zone not found")


@router.get("/alerts", dependencies=[Depends(rate_limit_dependency)])
async def get_alerts(stadium_id: str = "metlife") -> ApiResponse[list[Alert]]:
    """
    Fetch active warning/critical stadium alerts.
    Rate-limited.
    """
    try:
        if stadium_id not in ["metlife", "sofi", "azteca"]:
            raise ValueError(INVALID_STADIUM_ID)

        clean_stadium = stadium_id
        logger.info("Fetching alerts for stadium_id=%s", clean_stadium)
        alerts = crowd_engine.get_alerts(clean_stadium)
        return ApiResponse(success=True, data=alerts)
    except ValueError as e:
        logger.exception("Error fetching alerts")
        return ApiResponse(success=False, data=[], error=str(e))


@router.get("/recommendations", dependencies=[Depends(rate_limit_dependency)])
async def get_recommendations(
    zone_id: str | None = None,
    stadium_id: str = "metlife"
) -> ApiResponse[list[Recommendation]]:
    """
    Fetch live context recommendations for food/wc wait optimizations.
    Rate-limited.
    """
    clean_zone = validate_zone_id(zone_id) if zone_id else None
    if stadium_id not in ["metlife", "sofi", "azteca"]:
        raise ValueError(INVALID_STADIUM_ID)

    clean_stadium = stadium_id
    logger.info("Fetching recommendations (zone filter applied: %s)", bool(clean_zone))
    snapshots = crowd_engine.get_all_snapshots(clean_stadium)
    recs = recommendation_engine.generate(snapshots, clean_zone, clean_stadium)
    return ApiResponse(success=True, data=recs)


@router.post("/time", dependencies=[Depends(rate_limit_dependency)])
async def set_time(minutes: int) -> ApiResponse[dict]:
    """
    Advance match clock simulation time.
    Rate-limited.
    """
    logger.info("Advancing simulation match clock time to minute: %d", minutes)
    crowd_engine.set_match_time(minutes)
    return ApiResponse(success=True, data={"match_time": crowd_engine.match_time_minutes})


async def _validate_ws(websocket: WebSocket, stadium_id: str) -> bool:
    """
    Validates origin, rate limit, and stadium_id configuration settings for the WebSocket connection.
    """
    origin = websocket.headers.get("origin")
    if origin:
        allowed = ["http://localhost:5173", "https://stadium-os-fifa2026.vercel.app"]
        if origin not in allowed and not origin.endswith(".vercel.app"):
            logger.warning("Rejected WebSocket origin")
            await websocket.close(code=4003, reason="Forbidden origin")
            return False

    x_forwarded_for = websocket.headers.get("x-forwarded-for")
    if x_forwarded_for:
        client_ip = x_forwarded_for.split(",")[0].strip()
    else:
        client_ip = websocket.client.host if websocket.client else "unknown"

    if limiter.is_rate_limited(client_ip):
        logger.warning("Rejected WebSocket connection due to rate limits")
        await websocket.accept()
        await websocket.close(code=1008, reason="Rate limit exceeded")
        return False

    if stadium_id not in ["metlife", "sofi", "azteca"]:
        logger.warning("Rejected WebSocket connection: invalid stadium ID")
        await websocket.close(code=4004, reason=INVALID_STADIUM_ID)
        return False

    clean_stadium = stadium_id
    logger.info("WebSocket handshake accepted for stadium_id=%s", clean_stadium)
    return True


class WebSocketHandler:
    """
    Manages connection lifecycle state and loop handlers for an active WebSocket client.
    """
    def __init__(self, websocket: WebSocket, stadium_id: str):
        self.websocket = websocket
        self.stadium_id = stadium_id
        self.current_zone_id = None

    async def receive_loop(self):
        try:
            while True:
                data = await self.websocket.receive_json()
                if isinstance(data, dict):
                    if "current_zone_id" in data:
                        self.current_zone_id = validate_zone_id(data["current_zone_id"])
                    if "minutes" in data:
                        crowd_engine.set_match_time(int(data["minutes"]))
        except Exception as e:
            logger.info("WebSocket connection read stream ended: %s", str(e))

    async def send_loop(self):
        receive_task = asyncio.create_task(self.receive_loop())
        try:
            while True:
                snapshots = crowd_engine.get_all_snapshots(self.stadium_id)
                alerts = crowd_engine.get_alerts(self.stadium_id)
                recs = recommendation_engine.generate(snapshots, self.current_zone_id, self.stadium_id)

                payload = {
                    "crowd": [snap.model_dump() for snap in snapshots],
                    "alerts": [alert.model_dump() for alert in alerts],
                    "recommendations": [rec.model_dump() for rec in recs],
                    "match_time": crowd_engine.match_time_minutes
                }
                try:
                    await self.websocket.send_json(payload)
                except (WebSocketDisconnect, RuntimeError) as e:
                    logger.info("WebSocket connection write stream ended: %s", str(e))
                    break
                await asyncio.sleep(3)
        except WebSocketDisconnect:
            logger.info("WebSocket subscriber disconnected")
        finally:
            receive_task.cancel()


@router.websocket("/ws/{stadium_id}")
async def websocket_endpoint(websocket: WebSocket, stadium_id: str) -> None:
    """
    WebSocket endpoint streaming live alerts, zones, and crowd status feeds to client subscribers.
    """
    if not await _validate_ws(websocket, stadium_id):
        return

    await websocket.accept()
    handler = WebSocketHandler(websocket, stadium_id)
    await handler.send_loop()