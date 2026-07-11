import heapq
import logging
from app.models import Route, CrowdSnapshot, ZoneStatus
from app.utils.exceptions import NavigationError
from app.services.stadiums import STADIUMS_CONFIG

logger = logging.getLogger(__name__)

# Magic number constants
DISTANCE_WEIGHT = 0.6
CONGESTION_WEIGHT = 0.4
DENSITY_SCALE = 100.0
ACCESSIBILITY_PENALTY = 1000.0
WALKING_SPEED_FACTOR = 50.0
QUEUE_WAIT_FACTOR = 10.0
DEFAULT_ALT_TIME = 5
DEFAULT_ALT_DENSITY = 0.5
DENSITY_THRESHOLD_LOW = 0.3
DENSITY_THRESHOLD_MODERATE = 0.5
DENSITY_THRESHOLD_BUSY = 0.75


class NavigationEngine:
    """
    Core pathfinding and routing service using Dijkstra's algorithm.
    Calculates step-free paths when Accessibility Mode is active by penalizing stairways
    and non-accessible concourses.
    """

    def __init__(self):
        metlife_zones = STADIUMS_CONFIG["metlife"]["zones"]
        self.zone_locations = {z["id"]: tuple(z["location"]) for z in metlife_zones}

    def _calculate_distance(self, zone1_id: str, zone2_id: str, zone_locations: dict) -> float:
        """
        Computes Euclidean distance between coordinates of two stadium zones.
        """
        loc1 = zone_locations.get(zone1_id, (0, 0))
        loc2 = zone_locations.get(zone2_id, (0, 0))
        return ((loc1[0] - loc2[0]) ** 2 + (loc1[1] - loc2[1]) ** 2) ** 0.5

    def _get_edge_weight(
        self,
        current_zone: str,
        neighbor: str,
        zone_locations: dict,
        crowd_map: dict,
        accessibility_mode: bool,
        accessible_zones: set[str]
    ) -> float:
        """
        Calculates the dynamic edge traversal weight between two zones.
        """
        distance = self._calculate_distance(current_zone, neighbor, zone_locations)
        density = crowd_map.get(neighbor, DEFAULT_ALT_DENSITY)
        weight = (distance * DISTANCE_WEIGHT) + (density * DENSITY_SCALE * CONGESTION_WEIGHT)

        if accessibility_mode and neighbor not in accessible_zones:
            weight += ACCESSIBILITY_PENALTY

        return weight

    def _is_zone_passable(self, zone: str, target_zone: str, start_zone: str, congested_zones: set[str]) -> bool:
        """
        Determines if a zone is passable during Dijkstra search.
        Congested zones are impassable unless they are the source or destination.
        """
        if zone in congested_zones and zone != start_zone and zone != target_zone:
            return False
        return True

    def _update_neighbor(
        self,
        current_zone: str,
        neighbor: str,
        current_dist: float,
        distances: dict[str, float],
        previous: dict[str, str | None],
        pq: list,
        zone_locations: dict,
        crowd_map: dict,
        accessibility_mode: bool,
        accessible_zones: set[str]
    ) -> None:
        """
        Updates neighbor distances and priority queue weights.
        """
        weight = self._get_edge_weight(
            current_zone, neighbor, zone_locations,
            crowd_map, accessibility_mode, accessible_zones
        )
        new_dist = current_dist + weight
        if new_dist < distances[neighbor]:
            distances[neighbor] = new_dist
            previous[neighbor] = current_zone
            heapq.heappush(pq, (new_dist, neighbor))

    def _run_dijkstra(
        self,
        from_zone: str,
        to_zone: str,
        zone_graph: dict,
        zone_locations: dict,
        crowd_map: dict,
        congested_zones: set[str],
        accessibility: dict,
        accessibility_mode: bool
    ) -> tuple[dict[str, float], dict[str, str | None]]:
        """
        Runs Dijkstra shortest path search algorithm over zone graphs, taking accessibility,
        congestion status, and physical coordinates distance weights into calculations.
        """
        distances = dict.fromkeys(zone_graph, float("inf"))
        distances[from_zone] = 0.0
        previous = dict.fromkeys(zone_graph)
        pq = [(0.0, from_zone)]
        visited = set()

        accessible_zones = set()
        if accessibility_mode:
            elevators = set(accessibility.get("elevators", []))
            wheelchair_seating = set(accessibility.get("wheelchair_seating", []))
            accessible_zones = elevators | wheelchair_seating | {"exit_main", "exit_emergency"}

        while pq:
            current_dist, current_zone = heapq.heappop(pq)

            if current_zone in visited:
                continue

            visited.add(current_zone)

            if current_zone == to_zone:
                break

            if not self._is_zone_passable(current_zone, to_zone, from_zone, congested_zones):
                continue

            for neighbor in zone_graph.get(current_zone, []):
                if not self._is_zone_passable(neighbor, to_zone, from_zone, congested_zones):
                    continue

                self._update_neighbor(
                    current_zone, neighbor, current_dist, distances, previous,
                    pq, zone_locations, crowd_map, accessibility_mode, accessible_zones
                )

        return distances, previous

    def _reconstruct_path(
        self,
        to_zone: str,
        distances: dict[str, float],
        previous: dict[str, str | None]
    ) -> list[str] | None:
        """
        Traces back path zone IDs sequentially from source to target.
        """
        if distances[to_zone] == float("inf"):
            return None

        path = []
        current = to_zone
        while current is not None:
            path.append(current)
            current = previous[current]
        path.reverse()

        if len(path) == 1:
            return None
        return path

    def find_route(
        self,
        from_zone: str,
        to_zone: str,
        crowd_data: list[CrowdSnapshot],
        stadium_id: str = "metlife",
        accessibility_mode: bool = False
    ) -> Route | None:
        """
        Calculates the optimal weighted path between two zones, incorporating
        corridor distances, active crowd congestion multipliers, and step-free constraints.
        """
        logger.info(
            "Computing route from %s to %s (stadium=%s, accessibility=%s)",
            from_zone, to_zone, stadium_id, accessibility_mode
        )
        if not stadium_id or stadium_id not in STADIUMS_CONFIG:
            stadium_id = "metlife"
        config = STADIUMS_CONFIG[stadium_id]
        zone_graph = config["zone_graph"]
        zone_locations = {z["id"]: tuple(z["location"]) for z in config["zones"]}
        accessibility = config.get("accessibility", {})

        if from_zone not in zone_graph or to_zone not in zone_graph:
            logger.error("Dijkstra failed: invalid zone ID (from_zone=%s, to_zone=%s)", from_zone, to_zone)
            raise NavigationError("Invalid zone ID")

        if from_zone == to_zone:
            return Route(
                id=f"route_{from_zone}_{to_zone}",
                path=[from_zone],
                estimated_time=0,
                crowd_level=0.0,
                rationale="You are already at your destination.",
            )

        crowd_map = {c.zone_id: c.density for c in crowd_data}
        congested_zones = {
            c.zone_id for c in crowd_data if c.status == ZoneStatus.CONGESTED
        }

        distances, previous = self._run_dijkstra(
            from_zone, to_zone, zone_graph, zone_locations,
            crowd_map, congested_zones, accessibility, accessibility_mode
        )

        path = self._reconstruct_path(to_zone, distances, previous)
        if path is None:
            logger.warning("No viable Dijkstra route path, using fallback direct route")
            return Route(
                id=f"route_{from_zone}_{to_zone}_alt",
                path=[from_zone, to_zone],
                estimated_time=DEFAULT_ALT_TIME,
                crowd_level=DEFAULT_ALT_DENSITY,
                rationale="Direct route recommended. Alternate path congestion or constraints detected.",
            )

        total_density = sum(crowd_map.get(zone, DEFAULT_ALT_DENSITY) for zone in path)
        avg_density = total_density / len(path) if path else 0.0

        actual_distance = 0.0
        for i in range(len(path) - 1):
            actual_distance += self._calculate_distance(path[i], path[i+1], zone_locations)
        estimated_time = int(actual_distance / WALKING_SPEED_FACTOR) + int(avg_density * QUEUE_WAIT_FACTOR)

        rationale = self._generate_rationale(path, avg_density, congested_zones)
        if accessibility_mode:
            rationale = "♿ Optimized for elevator/ramp access. " + rationale

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
        """
        Creates a natural language description explaining why this specific path was chosen.
        """
        if avg_density < DENSITY_THRESHOLD_LOW:
            density_desc = "clear"
        elif avg_density < DENSITY_THRESHOLD_MODERATE:
            density_desc = "moderate"
        elif avg_density < DENSITY_THRESHOLD_BUSY:
            density_desc = "busy"
        else:
            density_desc = "congested"

        rationale = f"Passes through {len(path) - 1} zones with {density_desc} conditions."

        avoided = [z for z in congested_zones if z not in path]
        if avoided:
            rationale += f" Avoids congestion at {', '.join(avoided[:3])}."

        return rationale


navigation_engine = NavigationEngine()