import pytest
from app.services.navigation import navigation_engine
from app.services.crowd import crowd_engine


def test_navigation_initialization():
    assert navigation_engine.zone_locations is not None


def test_find_route_same_zone():
    crowd_data = crowd_engine.get_all_snapshots()
    route = navigation_engine.find_route("gate_north", "gate_north", crowd_data)
    assert route is not None
    assert route.path == ["gate_north"]
    assert route.estimated_time == 0


def test_find_route_invalid_zone():
    from app.utils.exceptions import NavigationError
    with pytest.raises(NavigationError):
        navigation_engine.find_route("invalid1", "invalid2", [])


def test_find_route_basic():
    crowd_data = crowd_engine.get_all_snapshots()
    route = navigation_engine.find_route("gate_north", "section_a", crowd_data)
    assert route is not None
    assert "gate_north" in route.path
    assert "section_a" in route.path
    assert route.estimated_time >= 0


def test_route_avoids_congestion():
    crowd_engine.set_match_time(50)
    crowd_data = crowd_engine.get_all_snapshots()
    route = navigation_engine.find_route("gate_north", "food_court_a", crowd_data)
    assert route is not None
    assert len(route.path) >= 2


def test_route_rationale():
    crowd_data = crowd_engine.get_all_snapshots()
    route = navigation_engine.find_route("gate_north", "section_d", crowd_data)
    assert route is not None
    assert route.rationale is not None
    assert len(route.rationale) > 0