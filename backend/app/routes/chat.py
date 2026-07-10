import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends

from app.models import ChatRequest, ChatResponse, ChatMessage, ApiResponse
from app.utils.validators import sanitize_message, validate_seat_number, validate_zone_id, validate_language
from app.utils.intent import detect_intent
from app.utils.rate_limit import rate_limit_dependency
from app.services.crowd import crowd_engine
from app.services.navigation import navigation_engine
from app.services.gemini import gemini_client

router = APIRouter()


async def handle_chat(request: ChatRequest) -> ApiResponse[ChatResponse]:
    # 1. Sanitize & Validate input
    try:
        sanitized_message = sanitize_message(request.message)
        lang = validate_language(request.language)
        if request.current_zone_id:
            validate_zone_id(request.current_zone_id)
        if request.seat_number:
            validate_seat_number(request.seat_number)
    except ValueError as e:
        return ApiResponse(success=False, error=str(e))

    # 2. Detect Intent
    intent = detect_intent(sanitized_message)
    stadium_id = request.stadium_id or "metlife"
    accessibility_mode = request.accessibility_mode or False

    from app.services.stadiums import STADIUMS_CONFIG
    config = STADIUMS_CONFIG.get(stadium_id, STADIUMS_CONFIG["metlife"])
    stadium_zones = config["zones"]

    # 3. Build context & route if applicable
    route = None
    from_zone = request.current_zone_id
    to_zone = None
    
    # Simple extraction of target zone from message content if it matches zone labels or IDs
    message_lower = sanitized_message.lower()
    for zone in stadium_zones:
        zone_id_clean = zone["id"].replace('_', ' ')
        zone_label_clean = zone["label"].lower()
        if zone_label_clean in message_lower or zone_id_clean in message_lower:
            if not from_zone:
                from_zone = zone["id"]
            elif zone["id"] != from_zone:
                to_zone = zone["id"]

    # Determine target type from keywords
    target_type = None
    if any(w in message_lower for w in ["restroom", "bathroom", "toilet", "wc"]):
        target_type = "wc"
    elif any(w in message_lower for w in ["food", "eat", "snack", "drink", "concession", "canteen"]):
        target_type = "food"
    elif any(w in message_lower for w in ["exit", "leave", "out"]):
        target_type = "exit"
    elif any(w in message_lower for w in ["medical", "first aid", "aed", "doctor"]):
        target_type = "medical"

    if target_type and not to_zone:
        candidate_zones = [z["id"] for z in stadium_zones if z["type"] == target_type]
        if candidate_zones:
            if from_zone:
                best_zone = None
                min_time = float("inf")
                crowd_data = crowd_engine.get_all_snapshots(stadium_id)
                for cz in candidate_zones:
                    try:
                        test_route = navigation_engine.find_route(from_zone, cz, crowd_data, stadium_id, accessibility_mode)
                        if test_route.estimated_time < min_time:
                            min_time = test_route.estimated_time
                            best_zone = cz
                    except Exception:
                        pass
                if best_zone:
                    to_zone = best_zone
            else:
                to_zone = candidate_zones[0]

    # Apply defaults if only one side is known and we haven't resolved a target type
    if from_zone and not to_zone:
        to_zone = "exit_main" if from_zone != "exit_main" else "gate_north"
    elif not from_zone and to_zone:
        from_zone = "gate_north" if to_zone != "gate_north" else "gate_south"
        
    if from_zone and to_zone and from_zone != to_zone:
        try:
            crowd_data = crowd_engine.get_all_snapshots(stadium_id)
            route = navigation_engine.find_route(from_zone, to_zone, crowd_data, stadium_id, accessibility_mode)
        except Exception:
            pass

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

    # 5. Build ChatMessage & ChatResponse
    chat_message = ChatMessage(
        id=str(uuid.uuid4()),
        role="model",
        content=ai_response["text"],
        timestamp=ai_response.get("timestamp") or datetime.utcnow().isoformat() + "Z",
        intent=intent,
        context_snapshot=context_data,
        is_fallback=ai_response.get("is_fallback", False),
        language=lang,
        route_id=route.id if route else None,
        response_time=ai_response.get("response_time"),
        confidence=ai_response.get("confidence")
    )

    return ApiResponse(
        success=True,
        data=ChatResponse(
            message=chat_message,
            dev_info={
                "intent": intent,
                "is_fallback": ai_response.get("is_fallback", False),
                "response_time_ms": ai_response.get("response_time"),
                "confidence": ai_response.get("confidence"),
                "prompt_tokens_estimate": ai_response.get("prompt_tokens")
            }
        )
    )


@router.post("/", response_model=ApiResponse[ChatResponse], dependencies=[Depends(rate_limit_dependency)])
async def chat_endpoint(request: ChatRequest):
    try:
        result = await handle_chat(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")