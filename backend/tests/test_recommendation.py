from app.services.recommendation import recommendation_engine
from app.services.crowd import crowd_engine


def test_recommendation_engine_initialization():
    assert recommendation_engine.zone_types is not None


def test_generate_recommendations():
    crowd_data = crowd_engine.get_all_snapshots()
    recs = recommendation_engine.generate(crowd_data, "gate_north")
    assert isinstance(recs, list)


def test_generate_with_current_zone():
    crowd_engine.set_match_time(50)
    crowd_data = crowd_engine.get_all_snapshots()
    recs = recommendation_engine.generate(crowd_data, "food_court_a")
    assert isinstance(recs, list)


def test_recommendation_structure():
    crowd_data = crowd_engine.get_all_snapshots()
    recs = recommendation_engine.generate(crowd_data, None)
    for rec in recs:
        assert hasattr(rec, "id")
        assert hasattr(rec, "type")
        assert hasattr(rec, "message")
        assert hasattr(rec, "zone_id")
        assert hasattr(rec, "priority")
        assert rec.type in ["food", "restroom", "exit", "safety"]
        assert rec.priority in ["low", "medium", "high"]