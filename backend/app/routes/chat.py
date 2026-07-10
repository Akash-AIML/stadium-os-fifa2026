import logging
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends

from app.config import settings
from app.models import ChatRequest, ChatResponse, ChatMessage, ApiResponse
from app.utils.validators import sanitize_message, validate_seat_number, validate_zone_id, validate_language, strip_html
from app.utils.intent import detect_intent
from app.utils.rate_limit import rate_limit_dependency
from app.services.crowd import crowd_engine
from app.services.navigation import navigation_engine
from app.services.gemini import gemini_client

logger = logging.getLogger(__name__)
router = APIRouter()


def _extract_routing_zones(
    message: str,
    stadium_zones: list[dict],
    current_zone_id: str | None
) -> tuple[str | None, str | None]:
    """
    Extracts starting (from_zone) and destination (to_zone) zone identifiers from the chat message content.
    """
    message_lower = message.lower()
    from_zone = current_zone_id
    to_zone = None

    for zone in stadium_zones:
        zone_id_clean = zone["id"].replace('_', ' ')
        zone_label_clean = zone["label"].lower()
        if zone_label_clean in message_lower or zone_id_clean in message_lower:
            if not from_zone:
                from_zone = zone["id"]
            elif zone["id"] != from_zone:
                to_zone = zone["id"]
    return from_zone, to_zone


def _resolve_target_type(message: str) -> str | None:
    """
    Resolves category facility keywords in the user query (e.g. restrooms, food stalls).
    """
    message_lower = message.lower()
    if any(w in message_lower for w in ["restroom", "bathroom", "toilet", "wc"]):
        return "wc"
    if any(w in message_lower for w in ["food", "eat", "snack", "drink", "concession", "canteen"]):
        return "food"
    if any(w in message_lower for w in ["exit", "leave", "out"]):
        return "exit"
    if any(w in message_lower for w in ["medical", "first aid", "aed", "doctor"]):
        return "medical"
    return None


def _resolve_facility_route(
    message: str,
    stadium_zones: list[dict],
    from_zone: str | None,
    to_zone: str | None,
    stadium_id: str,
    accessibility_mode: bool
) -> tuple[str | None, str | None]:
    """
    Finds the closest amenity zone if the user asks for facilities like WC or food.
    """
    target_type = _resolve_target_type(message)
    res_from = from_zone
    res_to = to_zone

    if target_type and not res_to:
        candidate_zones = [z["id"] for z in stadium_zones if z["type"] == target_type]
        if candidate_zones:
            if res_from:
                best_zone = None
                min_time = float("inf")
                crowd_data = crowd_engine.get_all_snapshots(stadium_id)
                for cz in candidate_zones:
                    try:
                        test_route = navigation_engine.find_route(
                            res_from, cz, crowd_data, stadium_id, accessibility_mode
                        )
                        if test_route and test_route.estimated_time < min_time:
                            min_time = test_route.estimated_time
                            best_zone = cz
                    except Exception as e:
                        logger.warning("Error searching routes for target facility check: %s", str(e))
                if best_zone:
                    res_to = best_zone
            else:
                res_to = candidate_zones[0]

    # Apply defaults if only one side is known and we haven't resolved a target type
    if res_from and not res_to:
        res_to = "exit_main" if res_from != "exit_main" else "gate_north"
    elif not res_from and res_to:
        res_from = "gate_north" if res_to != "gate_north" else "gate_south"

    return res_from, res_to


async def handle_chat(request: ChatRequest) -> ApiResponse[ChatResponse]:
    """
    Coordinates chat message pipeline: validation, intent parsing, routing resolution,
    co-pilot generating, response sanitization, and returning metadata.
    """
    logger.info("Processing chat message for stadium_id: %s", request.stadium_id)
    # 1. Sanitize & Validate input
    try:
        sanitized_message = sanitize_message(request.message)
        lang = validate_language(request.language)
        if request.current_zone_id:
            validate_zone_id(request.current_zone_id)
        if request.seat_number:
            validate_seat_number(request.seat_number)
    except ValueError as e:
        logger.error("Chat payload validation failed: %s", str(e))
        return ApiResponse(success=False, error=str(e))

    # 2. Detect Intent
    intent = detect_intent(sanitized_message)
    stadium_id = request.stadium_id or "metlife"
    accessibility_mode = request.accessibility_mode or False

    from app.services.stadiums import STADIUMS_CONFIG
    config = STADIUMS_CONFIG.get(stadium_id, STADIUMS_CONFIG["metlife"])
    stadium_zones = config["zones"]

    # 3. Extract & Resolve routing targets
    from_zone, to_zone = _extract_routing_zones(sanitized_message, stadium_zones, request.current_zone_id)
    from_zone, to_zone = _resolve_facility_route(
        sanitized_message, stadium_zones, from_zone, to_zone, stadium_id, accessibility_mode
    )

    route = None
    if from_zone and to_zone and from_zone != to_zone:
        try:
            crowd_data = crowd_engine.get_all_snapshots(stadium_id)
            route = navigation_engine.find_route(from_zone, to_zone, crowd_data, stadium_id, accessibility_mode)
        except Exception as e:
            logger.warning("Routing pathfinder calculation failed inside handle_chat: %s", str(e))

    # Fetch context data (crowd snapshots relevant to the user's current zone)
    context_data = crowd_engine.get_relevant_zones(request.current_zone_id, stadium_id)
    alerts = crowd_engine.get_alerts(stadium_id)

    # 4. Generate Response using Gemini (with fallback)
    ai_response = gemini_client.generate_response(
        intent=intent,
        context_data=context_data,
        user_message=sanitized_message,
        language=lang,
        alerts=alerts,
        route=route,
        stadium_id=stadium_id,
        accessibility_mode=accessibility_mode
    )

    # 5. Sanitize AI response output (prevent potential HTML injects)
    clean_ai_text = strip_html(ai_response["text"])

    # 6. Build ChatMessage & ChatResponse
    chat_message = ChatMessage(
        id=str(uuid.uuid4()),
        role="model",
        content=clean_ai_text,
        timestamp=ai_response.get("timestamp") or datetime.utcnow().isoformat() + "Z",
        intent=intent,
        context_snapshot=context_data,
        is_fallback=ai_response.get("is_fallback", False),
        language=lang,
        route_id=route.id if route else None,
        response_time=ai_response.get("response_time"),
        confidence=ai_response.get("confidence")
    )

    # Gate dev_info behind settings.dev_mode configurations
    dev_info = None
    if settings.dev_mode:
        dev_info = {
            "intent": intent,
            "is_fallback": ai_response.get("is_fallback", False),
            "response_time_ms": ai_response.get("response_time"),
            "confidence": ai_response.get("confidence"),
            "prompt_tokens_estimate": ai_response.get("prompt_tokens")
        }

    return ApiResponse(
        success=True,
        data=ChatResponse(
            message=chat_message,
            dev_info=dev_info
        )
    )


@router.post("/", response_model=ApiResponse[ChatResponse], dependencies=[Depends(rate_limit_dependency)])
async def chat_endpoint(request: ChatRequest):
    """API endpoint for co-pilot conversational interface, rate-limited."""
    try:
        result = await handle_chat(request)
        return result
    except ValueError as e:
        logger.error("ValueError in chat_endpoint: %s", str(e))
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error("Unhandled Exception in chat_endpoint: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")