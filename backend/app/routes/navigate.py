import logging
from fastapi import APIRouter, Query, Depends
from app.models import ApiResponse, Route
from app.services.navigation import navigation_engine
from app.services.crowd import crowd_engine
from app.utils.exceptions import NavigationError
from app.utils.rate_limit import rate_limit_dependency

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=ApiResponse[Route | None], dependencies=[Depends(rate_limit_dependency)])
async def get_route(
    from_zone: str = Query(..., description="Starting zone ID"),
    to_zone: str = Query(..., description="Destination zone ID"),
    stadium_id: str = Query("metlife", description="Active stadium ID"),
    accessibility_mode: bool = Query(False, description="Whether to compute an accessible route"),
) -> ApiResponse[Route | None]:
    """
    Computes Dijkstra path between from_zone and to_zone under congestion levels and step-free guidelines.
    Rate-limited.
    """
    logger.info("Dijkstra GET route request: from=%s to=%s (stadium=%s)", from_zone, to_zone, stadium_id)
    try:
        crowd_data = crowd_engine.get_all_snapshots(stadium_id)
        route = navigation_engine.find_route(from_zone, to_zone, crowd_data, stadium_id, accessibility_mode)
        if route is None:
            logger.warning("No viable path found between %s and %s", from_zone, to_zone)
            return ApiResponse(success=False, data=None, error="No viable route found")
        return ApiResponse(success=True, data=route)
    except (ValueError, NavigationError) as e:
        logger.error("Navigation error resolved dynamically: %s", str(e))
        return ApiResponse(success=False, data=None, error=str(e))