from fastapi import APIRouter
from app.models import ApiResponse, CrowdSnapshot, Alert, Recommendation
from app.services.crowd import crowd_engine
from app.services.recommendation import recommendation_engine

router = APIRouter()


@router.get("/", response_model=ApiResponse[list[CrowdSnapshot]])
async def get_crowd_data(zone_id: str | None = None):
    if zone_id:
        try:
            snapshots = [crowd_engine.get_snapshot(zone_id)]
        except ValueError:
            return ApiResponse(success=False, data=[], error="Zone not found")
    else:
        snapshots = crowd_engine.get_all_snapshots()
    return ApiResponse(success=True, data=snapshots)


@router.get("/alerts", response_model=ApiResponse[list[Alert]])
async def get_alerts():
    alerts = crowd_engine.get_alerts()
    return ApiResponse(success=True, data=alerts)


@router.get("/recommendations", response_model=ApiResponse[list[Recommendation]])
async def get_recommendations(zone_id: str | None = None):
    snapshots = crowd_engine.get_all_snapshots()
    recs = recommendation_engine.generate(snapshots, zone_id)
    return ApiResponse(success=True, data=recs)


@router.post("/time", response_model=ApiResponse[dict])
async def set_time(minutes: int):
    crowd_engine.set_match_time(minutes)
    return ApiResponse(success=True, data={"match_time": crowd_engine.match_time_minutes})