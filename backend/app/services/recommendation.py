import logging
from typing import Literal
from app.models import Recommendation, CrowdSnapshot, ZoneStatus

logger = logging.getLogger(__name__)

# Decision threshold constants
DENSITY_DIFF_THRESHOLD = 0.3
CONGESTION_ALERT_THRESHOLD = 0.75


class RecommendationEngine:
    """
    Simulates crowd snapshot statistics to generate real-time safety,
    restroom wait optimization, and crowd detour recommendations.
    """

    def __init__(self):
        self.zone_types: dict[str, str] = {}

    def generate(
        self, crowd_data: list[CrowdSnapshot], current_zone_id: str | None = None, stadium_id: str = "metlife"
    ) -> list[Recommendation]:
        """
        Synthesizes recommendations across all categories (food, restroom, egress, safety)
        based on active crowd density snapshots.
        """
        logger.info("Generating recommendations for stadium_id=%s, current_zone_id=%s", stadium_id, current_zone_id)
        from app.services.stadiums import STADIUMS_CONFIG
        config = STADIUMS_CONFIG.get(stadium_id, STADIUMS_CONFIG["metlife"])
        self.zone_types = {z["id"]: z["type"] for z in config["zones"]}
        recommendations = []

        food_recommendations = self._recommend_food(crowd_data)
        if food_recommendations:
            recommendations.append(food_recommendations)

        restroom_recommendations = self._recommend_restroom(crowd_data, current_zone_id)
        if restroom_recommendations:
            recommendations.append(restroom_recommendations)

        exit_recommendations = self._recommend_exit(crowd_data)
        if exit_recommendations:
            recommendations.append(exit_recommendations)

        safety_recommendations = self._recommend_safety(crowd_data, current_zone_id, stadium_id)
        if safety_recommendations:
            recommendations.append(safety_recommendations)

        return recommendations

    def _recommend_food(self, crowd_data: list[CrowdSnapshot]) -> Recommendation | None:
        """
        Suggests the least busy food court location to optimize concessions throughput.
        """
        food_zones = [
            c for c in crowd_data if self.zone_types.get(c.zone_id) == "food"
        ]
        if not food_zones:
            return None

        best = min(food_zones, key=lambda x: x.density)
        worst = max(food_zones, key=lambda x: x.density)

        if worst.density - best.density > DENSITY_DIFF_THRESHOLD:
            priority: Literal["high", "medium", "low"] = "high" if worst.density > CONGESTION_ALERT_THRESHOLD else "medium"
            return Recommendation(
                id="rec_food",
                type="food",
                message=f"{worst.zone_id.replace('_', ' ').title()} is crowded. Try {best.zone_id.replace('_', ' ').title()} for shorter queues.",
                zone_id=best.zone_id,
                priority=priority,
            )
        else:
            return Recommendation(
                id="rec_food_info",
                type="food",
                message=f"Hungry? {best.zone_id.replace('_', ' ').title()} is currently least busy with only {best.density:.0%} density.",
                zone_id=best.zone_id,
                priority="low",
            )

    def _recommend_restroom(
        self, crowd_data: list[CrowdSnapshot], current_zone_id: str | None
    ) -> Recommendation | None:
        """
        Routes users to clearer restrooms to optimize queue times during match peak cycles.
        """
        wc_zones = [c for c in crowd_data if self.zone_types.get(c.zone_id) == "wc"]
        if not wc_zones:
            return None

        congested = [w for w in wc_zones if w.status == ZoneStatus.CONGESTED]
        if congested:
            clear = [w for w in wc_zones if w.status in [ZoneStatus.CLEAR, ZoneStatus.MODERATE]]
            if clear:
                best = min(clear, key=lambda x: x.density)
                return Recommendation(
                    id="rec_restroom",
                    type="restroom",
                    message=f"Restrooms near {congested[0].zone_id.replace('_', ' ').title()} are busy. Try {best.zone_id.replace('_', ' ').title()}.",
                    zone_id=best.zone_id,
                    priority="high",
                )
        
        clear_wc = [w for w in wc_zones if w.status in [ZoneStatus.CLEAR, ZoneStatus.MODERATE]]
        if clear_wc:
            best = min(clear_wc, key=lambda x: x.density)
            return Recommendation(
                id="rec_restroom_info",
                type="restroom",
                message=f"Restrooms near {best.zone_id.replace('_', ' ').title()} are currently clear.",
                zone_id=best.zone_id,
                priority="low",
            )

        return None

    def _recommend_exit(self, crowd_data: list[CrowdSnapshot]) -> Recommendation | None:
        """
        Routes stadium egress flow away from congested exits during fulltime match conclusion.
        """
        exit_zones = [
            c for c in crowd_data if self.zone_types.get(c.zone_id) == "exit"
        ]
        if not exit_zones:
            return None

        congested_exits = [e for e in exit_zones if e.status == ZoneStatus.CONGESTED]
        if congested_exits:
            clear_exits = [e for e in exit_zones if e.status != ZoneStatus.CONGESTED]
            if clear_exits:
                best = min(clear_exits, key=lambda x: x.density)
                # Using Literal "high" to match strict Recommendation models
                return Recommendation(
                    id="rec_exit",
                    type="exit",
                    message=f"{congested_exits[0].zone_id.replace('_', ' ').title()} is congested. Use {best.zone_id.replace('_', ' ').title()} for faster exit.",
                    zone_id=best.zone_id,
                    priority="high",
                )
        
        clear_exits = [e for e in exit_zones if e.status in [ZoneStatus.CLEAR, ZoneStatus.MODERATE]]
        if clear_exits:
            best = min(clear_exits, key=lambda x: x.density)
            return Recommendation(
                id="rec_exit_info",
                type="exit",
                message=f"For a fast egress, Exit/Gate {best.zone_id.replace('_', ' ').title()} has low density.",
                zone_id=best.zone_id,
                priority="low",
            )

        return None

    def _recommend_safety(
        self, crowd_data: list[CrowdSnapshot], current_zone_id: str | None, stadium_id: str = "metlife"
    ) -> Recommendation | None:
        """
        Resolves emergency detours if active crowd safety thresholds are tripped.
        """
        if not current_zone_id:
            return None

        current = next((c for c in crowd_data if c.zone_id == current_zone_id), None)
        if not current or current.status != ZoneStatus.CONGESTED:
            return None

        neighbors = self._get_neighbors(current_zone_id, stadium_id)
        clear_neighbors = [
            c for c in crowd_data if c.zone_id in neighbors and c.status != ZoneStatus.CONGESTED
        ]

        if clear_neighbors:
            best = min(clear_neighbors, key=lambda x: x.density)
            return Recommendation(
                id="rec_safety",
                type="safety",
                message=f"Heavy congestion detected at {current_zone_id.replace('_', ' ')}. Consider moving toward {best.zone_id.replace('_', ' ')}.",
                zone_id=best.zone_id,
                priority="high",
            )

        return None

    def _get_neighbors(self, zone_id: str, stadium_id: str = "metlife") -> list[str]:
        """
        Returns adjacent zone connections based on physical venue map configuration.
        """
        from app.services.stadiums import STADIUMS_CONFIG
        config = STADIUMS_CONFIG.get(stadium_id, STADIUMS_CONFIG["metlife"])
        return config["zone_graph"].get(zone_id, [])


recommendation_engine = RecommendationEngine()