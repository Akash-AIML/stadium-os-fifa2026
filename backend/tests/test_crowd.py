import pytest
from app.services.crowd import crowd_engine
from app.models import ZoneStatus


def test_crowd_engine_initialization():
    assert crowd_engine.match_time_minutes == 0


def test_set_match_time():
    crowd_engine.set_match_time(45)
    assert crowd_engine.match_time_minutes == 45


def test_set_match_time_bounds():
    crowd_engine.set_match_time(-10)
    assert crowd_engine.match_time_minutes == 0

    crowd_engine.set_match_time(150)
    assert crowd_engine.match_time_minutes == 120

    # Boundary tests: 0, 1, 119, 120, 121
    crowd_engine.set_match_time(0)
    assert crowd_engine.match_time_minutes == 0

    crowd_engine.set_match_time(1)
    assert crowd_engine.match_time_minutes == 1

    crowd_engine.set_match_time(119)
    assert crowd_engine.match_time_minutes == 119

    crowd_engine.set_match_time(120)
    assert crowd_engine.match_time_minutes == 120

    crowd_engine.set_match_time(121)
    assert crowd_engine.match_time_minutes == 120


def test_get_all_snapshots():
    snapshots = crowd_engine.get_all_snapshots()
    assert len(snapshots) > 0
    assert all(hasattr(s, "zone_id") for s in snapshots)
    assert all(hasattr(s, "density") for s in snapshots)
    assert all(0 <= s.density <= 1 for s in snapshots)


def test_get_snapshot():
    snapshot = crowd_engine.get_snapshot("gate_north")
    assert snapshot.zone_id == "gate_north"
    assert 0 <= snapshot.density <= 1
    assert isinstance(snapshot.status, ZoneStatus)


def test_get_snapshot_invalid_zone():
    with pytest.raises(ValueError):
        crowd_engine.get_snapshot("invalid_zone")


def test_density_to_status():
    # Regular values
    assert crowd_engine._density_to_status(0.2) == ZoneStatus.CLEAR
    assert crowd_engine._density_to_status(0.4) == ZoneStatus.MODERATE
    assert crowd_engine._density_to_status(0.6) == ZoneStatus.BUSY
    assert crowd_engine._density_to_status(0.85) == ZoneStatus.CONGESTED

    # Exact threshold boundaries (0.3, 0.5, 0.75)
    # < 0.3 is CLEAR, >= 0.3 is MODERATE
    assert crowd_engine._density_to_status(0.29) == ZoneStatus.CLEAR
    assert crowd_engine._density_to_status(0.3) == ZoneStatus.MODERATE
    # < 0.5 is MODERATE, >= 0.5 is BUSY
    assert crowd_engine._density_to_status(0.49) == ZoneStatus.MODERATE
    assert crowd_engine._density_to_status(0.5) == ZoneStatus.BUSY
    # < 0.75 is BUSY, >= 0.75 is CONGESTED
    assert crowd_engine._density_to_status(0.74) == ZoneStatus.BUSY
    assert crowd_engine._density_to_status(0.75) == ZoneStatus.CONGESTED


def test_get_alerts():
    crowd_engine.set_match_time(50)
    alerts = crowd_engine.get_alerts()
    assert isinstance(alerts, list)
    if alerts:
        assert all(hasattr(a, "level") for a in alerts)
        assert all(a.level in ["warning", "critical"] for a in alerts)


def test_get_all_zones():
    zones = crowd_engine.get_all_zones()
    assert len(zones) > 0
    assert all(hasattr(z, "id") for z in zones)
    assert all(hasattr(z, "type") for z in zones)