from fastapi import APIRouter, Query
from app.models import ApiResponse, Route
from app.services.navigation import navigation_engine
from app.services.crowd import crowd_engine

router = APIRouter()


@router.get("/", response_model=ApiResponse[Route | None])
async def get_route(
    from_zone: str = Query(..., description="Starting zone ID"),
    to_zone: str = Query(..., description="Destination zone ID"),
    stadium_id: str = Query("metlife", description="Active stadium ID"),
    accessibility_mode: bool = Query(False, description="Whether to compute an accessible route"),
):
    try:
        crowd_data = crowd_engine.get_all_snapshots(stadium_id)
        route = navigation_engine.find_route(from_zone, to_zone, crowd_data, stadium_id, accessibility_mode)
        if route is None:
            return ApiResponse(success=False, data=None, error="No viable route found")
        return ApiResponse(success=True, data=route)
    except ValueError as e:
        return ApiResponse(success=False, data=None, error=str(e))