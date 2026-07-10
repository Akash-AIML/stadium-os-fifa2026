from app.models import IntentType, CrowdSnapshot, ZoneStatus, Route
from app.services.gemini import gemini_client, FALLBACK_TRANSLATIONS


def test_fallback_translations_structure():
    """
    Validates dictionary keys and structures of all supported languages fallback translations.
    """
    required_keys = {"route_found", "busy_zones", "clear_zones", "recommend_food", "limited_mode"}
    for lang, trans in FALLBACK_TRANSLATIONS.items():
        assert isinstance(trans, dict), f"Translation for {lang} should be a dictionary"
        for key in required_keys:
            assert key in trans, f"Missing key '{key}' in language translations for '{lang}'"


def test_get_timeline_phase_edges():
    """
    Validates simulation timeline match clock phase calculations.
    """
    assert gemini_client._get_timeline_phase(0) == "Pre-match"
    assert gemini_client._get_timeline_phase(9) == "Pre-match"
    assert gemini_client._get_timeline_phase(10) == "First Half"
    assert gemini_client._get_timeline_phase(44) == "First Half"
    assert gemini_client._get_timeline_phase(45) == "Halftime"
    assert gemini_client._get_timeline_phase(59) == "Halftime"
    assert gemini_client._get_timeline_phase(60) == "Second Half"
    assert gemini_client._get_timeline_phase(89) == "Second Half"
    assert gemini_client._get_timeline_phase(90) == "Fulltime (Post-match)"
    assert gemini_client._get_timeline_phase(120) == "Fulltime (Post-match)"


def test_fallback_generation_navigation():
    """
    Verifies rule-based template output under mock conditions for navigation intents.
    """
    route = Route(
        id="route_test",
        path=["gate_north", "wc_north"],
        estimated_time=4,
        crowd_level=0.25,
        rationale="Clear pathways resolved."
    )
    res = gemini_client._generate_fallback_response(
        intent=IntentType.NAVIGATION,
        context_data=[],
        user_message="navigate to wc",
        language="en",
        alerts=[],
        route=route
    )
    assert "**Recommendation:**" in res
    assert "Gate North" in res
    assert "Wc North" in res
    assert "4 minutes" in res


def test_fallback_generation_crowd_clear():
    """
    Checks template responses for crowd status intent under clear simulation settings.
    """
    res = gemini_client._generate_fallback_response(
        intent=IntentType.CROWD_STATUS,
        context_data=[],
        user_message="crowd levels?",
        language="en",
        alerts=[],
        route=None
    )
    assert "Stadium conditions are generally clear" in res


def test_fallback_generation_crowd_busy():
    """
    Checks template responses for crowd status intent under congested simulation settings.
    """
    snapshots = [
        CrowdSnapshot(zone_id="section_a", density=0.8, status=ZoneStatus.CONGESTED, queue_time=0)
    ]
    res = gemini_client._generate_fallback_response(
        intent=IntentType.CROWD_STATUS,
        context_data=snapshots,
        user_message="crowd levels?",
        language="en",
        alerts=[],
        route=None
    )
    assert "Currently busy: Section A" in res


def test_fallback_generation_recommendation():
    """
    Validates facility recommendation template outputs.
    """
    snapshots = [
        CrowdSnapshot(zone_id="food_court_a", density=0.2, status=ZoneStatus.CLEAR, queue_time=1),
        CrowdSnapshot(zone_id="food_court_b", density=0.8, status=ZoneStatus.CONGESTED, queue_time=15)
    ]
    res = gemini_client._generate_fallback_response(
        intent=IntentType.RECOMMENDATION,
        context_data=snapshots,
        user_message="recommend food",
        language="en",
        alerts=[],
        route=None
    )
    assert "Food Court A" in res
    assert "1min wait" in res
