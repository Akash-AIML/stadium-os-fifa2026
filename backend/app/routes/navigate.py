import logging
from typing import Annotated
from fastapi import APIRouter, Query, Depends
from app.models import ApiResponse, Route
from app.services.navigation import navigation_engine
from app.services.crowd import crowd_engine
from app.utils.exceptions import NavigationError
from app.utils.rate_limit import rate_limit_dependency
from app.utils.validators import validate_zone_id

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", dependencies=[Depends(rate_limit_dependency)])
async def get_route(
    from_zone: Annotated[str, Query(description="Starting zone ID")],
    to_zone: Annotated[str, Query(description="Destination zone ID")],
    stadium_id: Annotated[str, Query(description="Active stadium ID")] = "metlife",
    accessibility_mode: Annotated[bool, Query(description="Whether to compute an accessible route")] = False,
) -> ApiResponse[Route | None]:
    """
    Computes Dijkstra path between from_zone and to_zone under congestion levels and step-free guidelines.
    Rate-limited.
    """
    try:
        from_zone_clean = validate_zone_id(from_zone)
        to_zone_clean = validate_zone_id(to_zone)
        if stadium_id not in ["metlife", "sofi", "azteca"]:
            raise ValueError("Invalid stadium ID")

        clean_stadium = stadium_id

        logger.info("Dijkstra GET route request received (stadium validated)")

        crowd_data = crowd_engine.get_all_snapshots(clean_stadium)
        route = navigation_engine.find_route(
            from_zone_clean, to_zone_clean, crowd_data, clean_stadium, accessibility_mode
        )
        if route is None:
            logger.warning("No viable path found between validated zones")
            return ApiResponse(success=False, data=None, error="No viable route found")
        return ApiResponse(success=True, data=route)
    except (ValueError, NavigationError) as e:
        logger.exception("Navigation error resolved dynamically")
        return ApiResponse(success=False, data=None, error=str(e))