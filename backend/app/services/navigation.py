import heapq
from app.models import Route, CrowdSnapshot, ZoneStatus
from app.services.crowd import ZONE_GRAPH, STADIUM_ZONES
from app.utils.exceptions import NavigationError


class NavigationEngine:
    def __init__(self):
        self.zone_locations = {z["id"]: tuple(z["location"]) for z in STADIUM_ZONES}

    def _calculate_distance(self, zone1_id: str, zone2_id: str) -> float:
        loc1 = self.zone_locations.get(zone1_id, (0, 0))
        loc2 = self.zone_locations.get(zone2_id, (0, 0))
        return ((loc1[0] - loc2[0]) ** 2 + (loc1[1] - loc2[1]) ** 2) ** 0.5

    def find_route(
        self, from_zone: str, to_zone: str, crowd_data: list[CrowdSnapshot]
    ) -> Route | None:
        if from_zone not in ZONE_GRAPH or to_zone not in ZONE_GRAPH:
            raise NavigationError("Invalid zone ID")

        if from_zone == to_zone:
            return Route(
                id=f"route_{from_zone}_{to_zone}",
                path=[from_zone],
                estimated_time=0,
                crowd_level=0,
                rationale="You are already at your destination.",
            )

        crowd_map = {c.zone_id: c.density for c in crowd_data}
        congested_zones = {
            c.zone_id for c in crowd_data if c.status == ZoneStatus.CONGESTED
        }

        distances = {zone: float("inf") for zone in ZONE_GRAPH}
        distances[from_zone] = 0
        previous = {zone: None for zone in ZONE_GRAPH}
        pq = [(0, from_zone)]
        visited = set()

        while pq:
            current_dist, current_zone = heapq.heappop(pq)

            if current_zone in visited:
                continue

            visited.add(current_zone)

            if current_zone == to_zone:
                break

            if current_zone in congested_zones and current_zone != from_zone:
                continue

            for neighbor in ZONE_GRAPH.get(current_zone, []):
                if neighbor in congested_zones and neighbor != to_zone:
                    continue

                distance = self._calculate_distance(current_zone, neighbor)
                density = crowd_map.get(neighbor, 0.5)
                weight = (distance * 0.6) + (density * 100 * 0.4)

                new_dist = current_dist + weight
                if new_dist < distances[neighbor]:
                    distances[neighbor] = new_dist
                    previous[neighbor] = current_zone
                    heapq.heappush(pq, (new_dist, neighbor))

        if distances[to_zone] == float("inf"):
            return Route(
                id=f"route_{from_zone}_{to_zone}_alt",
                path=[from_zone, to_zone],
                estimated_time=5,
                crowd_level=0.5,
                rationale="Direct route recommended due to congestion on alternative paths.",
            )

        path = []
        current = to_zone
        while current is not None:
            path.append(current)
            current = previous[current]
        path.reverse()

        if len(path) == 1:
            return None

        total_density = sum(crowd_map.get(zone, 0.5) for zone in path)
        avg_density = total_density / len(path) if path else 0
        estimated_time = int(distances[to_zone] / 50) + int(avg_density * 10)

        rationale = self._generate_rationale(path, avg_density, congested_zones)

        return Route(
            id=f"route_{from_zone}_{to_zone}",
            path=path,
            estimated_time=max(1, estimated_time),
            crowd_level=avg_density,
            rationale=rationale,
        )

    def _generate_rationale(
        self, path: list[str], avg_density: float, congested_zones: set[str]
    ) -> str:
        if avg_density < 0.3:
            density_desc = "clear"
        elif avg_density < 0.5:
            density_desc = "moderate"
        elif avg_density < 0.75:
            density_desc = "busy"
        else:
            density_desc = "congested"

        rationale = f"This route passes through {len(path) - 1} zones with {density_desc} conditions."

        avoided = [z for z in congested_zones if z not in path]
        if avoided:
            rationale += f" Avoids congested areas: {', '.join(avoided[:3])}."

        return rationale


navigation_engine = NavigationEngine()