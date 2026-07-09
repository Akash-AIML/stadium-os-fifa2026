from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from app.models import ApiResponse, CrowdSnapshot, Alert, Recommendation
from app.services.crowd import crowd_engine
from app.services.recommendation import recommendation_engine

router = APIRouter()


@router.get("/", response_model=ApiResponse[list[CrowdSnapshot]])
async def get_crowd_data(zone_id: str | None = None, stadium_id: str = "metlife"):
    if zone_id:
        try:
            snapshots = [crowd_engine.get_snapshot(zone_id, stadium_id)]
        except ValueError:
            return ApiResponse(success=False, data=[], error="Zone not found")
    else:
        snapshots = crowd_engine.get_all_snapshots(stadium_id)
    return ApiResponse(success=True, data=snapshots)


@router.get("/alerts", response_model=ApiResponse[list[Alert]])
async def get_alerts(stadium_id: str = "metlife"):
    alerts = crowd_engine.get_alerts(stadium_id)
    return ApiResponse(success=True, data=alerts)


@router.get("/recommendations", response_model=ApiResponse[list[Recommendation]])
async def get_recommendations(zone_id: str | None = None, stadium_id: str = "metlife"):
    snapshots = crowd_engine.get_all_snapshots(stadium_id)
    recs = recommendation_engine.generate(snapshots, zone_id, stadium_id)
    return ApiResponse(success=True, data=recs)


@router.post("/time", response_model=ApiResponse[dict])
async def set_time(minutes: int):
    crowd_engine.set_match_time(minutes)
    return ApiResponse(success=True, data={"match_time": crowd_engine.match_time_minutes})


@router.websocket("/ws/{stadium_id}")
async def websocket_endpoint(websocket: WebSocket, stadium_id: str):
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
        except Exception:
            pass

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
            except (WebSocketDisconnect, RuntimeError):
                break
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        pass
    finally:
        receive_task.cancel()