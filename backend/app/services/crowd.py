import math
from datetime import datetime
from app.models import CrowdSnapshot, ZoneStatus, Alert, Zone

STADIUM_ZONES = [
    {"id": "gate_north", "label": "North Gate", "type": "entrance", "location": [400, 100]},
    {"id": "gate_south", "label": "South Gate", "type": "entrance", "location": [400, 700]},
    {"id": "gate_east", "label": "East Gate", "type": "entrance", "location": [700, 400]},
    {"id": "gate_west", "label": "West Gate", "type": "entrance", "location": [100, 400]},
    {"id": "section_a", "label": "Section A", "type": "seating", "location": [300, 200]},
    {"id": "section_b", "label": "Section B", "type": "seating", "location": [500, 200]},
    {"id": "section_c", "label": "Section C", "type": "seating", "location": [300, 600]},
    {"id": "section_d", "label": "Section D", "type": "seating", "location": [500, 600]},
    {"id": "food_court_a", "label": "Food Court A", "type": "food", "location": [200, 300]},
    {"id": "food_court_b", "label": "Food Court B", "type": "food", "location": [600, 300]},
    {"id": "food_court_c", "label": "Food Court C", "type": "food", "location": [200, 500]},
    {"id": "food_court_d", "label": "Food Court D", "type": "food", "location": [600, 500]},
    {"id": "wc_north", "label": "Restroom North", "type": "wc", "location": [350, 150]},
    {"id": "wc_south", "label": "Restroom South", "type": "wc", "location": [450, 650]},
    {"id": "medical_center", "label": "Medical Center", "type": "medical", "location": [100, 200]},
    {"id": "exit_main", "label": "Main Exit", "type": "exit", "location": [400, 750]},
    {"id": "exit_emergency", "label": "Emergency Exit", "type": "exit", "location": [750, 400]},
]

ZONE_GRAPH = {
    "gate_north": ["section_a", "section_b", "wc_north", "food_court_a", "food_court_b"],
    "gate_south": ["section_c", "section_d", "wc_south", "food_court_c", "food_court_d", "exit_main"],
    "gate_east": ["section_b", "section_d", "food_court_b", "food_court_d", "exit_emergency"],
    "gate_west": ["section_a", "section_c", "food_court_a", "food_court_c", "medical_center"],
    "section_a": ["gate_north", "gate_west", "food_court_a", "wc_north"],
    "section_b": ["gate_north", "gate_east", "food_court_b", "wc_north"],
    "section_c": ["gate_south", "gate_west", "food_court_c", "wc_south"],
    "section_d": ["gate_south", "gate_east", "food_court_d", "wc_south"],
    "food_court_a": ["gate_north", "gate_west", "section_a", "section_c"],
    "food_court_b": ["gate_north", "gate_east", "section_b", "section_d"],
    "food_court_c": ["gate_south", "gate_west", "section_c", "section_d"],
    "food_court_d": ["gate_south", "gate_east", "section_c", "section_d"],
    "wc_north": ["gate_north", "section_a", "section_b"],
    "wc_south": ["gate_south", "section_c", "section_d"],
    "medical_center": ["gate_west", "section_a"],
    "exit_main": ["gate_south", "section_c", "section_d"],
    "exit_emergency": ["gate_east", "section_b", "section_d"],
}


class CrowdEngine:
    def __init__(self):
        self.base_time = datetime.now()
        self.match_time_minutes = 0

    def get_stadium_config(self, stadium_id: str = "metlife") -> dict:
        from app.services.stadiums import STADIUMS_CONFIG
        if not stadium_id or stadium_id not in STADIUMS_CONFIG:
            stadium_id = "metlife"
        return STADIUMS_CONFIG[stadium_id]

    def set_match_time(self, minutes: int) -> None:
        self.match_time_minutes = max(0, min(120, minutes))

    def get_all_zones(self, stadium_id: str = "metlife") -> list[Zone]:
        config = self.get_stadium_config(stadium_id)
        snapshots = self.get_all_snapshots(stadium_id)
        snapshot_map = {s.zone_id: s for s in snapshots}
        zones = []
        for z in config["zones"]:
            snapshot = snapshot_map.get(z["id"])
            zones.append(
                Zone(
                    id=z["id"],
                    label=z["label"],
                    type=z["type"],
                    location=tuple(z["location"]),
                    status=snapshot.status if snapshot else ZoneStatus.CLEAR,
                )
            )
        return zones

    def get_all_snapshots(self, stadium_id: str = "metlife") -> list[CrowdSnapshot]:
        config = self.get_stadium_config(stadium_id)
        snapshots = []
        for zone in config["zones"]:
            snapshot = self.get_snapshot(zone["id"], stadium_id)
            snapshots.append(snapshot)
        return snapshots

    def get_snapshot(self, zone_id: str, stadium_id: str = "metlife") -> CrowdSnapshot:
        config = self.get_stadium_config(stadium_id)
        zone = next((z for z in config["zones"] if z["id"] == zone_id), None)
        if not zone:
            raise ValueError(f"Zone {zone_id} not found")

        density = self._calculate_density(zone)
        status = self._density_to_status(density)
        queue_time = int(density * 30) if zone["type"] in ["food", "wc", "entrance"] else 0

        return CrowdSnapshot(zone_id=zone_id, density=density, status=status, queue_time=queue_time)

    def _calculate_density(self, zone: dict) -> float:
        zone_type = zone["type"]
        match_time = self.match_time_minutes

        base_density = 0.3

        if zone_type == "entrance":
            if match_time < 30:
                base_density = 0.7 + 0.2 * math.sin(match_time * 0.1)
            elif match_time > 90:
                base_density = 0.4
            else:
                base_density = 0.2

        elif zone_type == "seating":
            if 30 <= match_time <= 90:
                base_density = 0.9
            elif match_time > 90:
                base_density = 0.3
            else:
                base_density = 0.4

        elif zone_type == "food":
            if 45 <= match_time <= 60:
                base_density = 0.85
            elif match_time < 30 or match_time > 90:
                base_density = 0.6
            else:
                base_density = 0.3

        elif zone_type == "wc":
            if 45 <= match_time <= 60:
                base_density = 0.9
            else:
                base_density = 0.4

        elif zone_type == "exit":
            if match_time > 90:
                base_density = 0.8
            else:
                base_density = 0.2

        elif zone_type == "medical":
            base_density = 0.15

        return min(1.0, max(0.0, base_density))

    def _density_to_status(self, density: float) -> ZoneStatus:
        if density < 0.3:
            return ZoneStatus.CLEAR
        elif density < 0.5:
            return ZoneStatus.MODERATE
        elif density < 0.75:
            return ZoneStatus.BUSY
        else:
            return ZoneStatus.CONGESTED

    def get_alerts(self, stadium_id: str = "metlife") -> list[Alert]:
        alerts = []
        snapshots = self.get_all_snapshots(stadium_id)
        for snapshot in snapshots:
            if snapshot.status == ZoneStatus.CONGESTED:
                alerts.append(
                    Alert(
                        id=f"alert_{snapshot.zone_id}",
                        level="critical" if snapshot.density > 0.9 else "warning",
                        message=f"High congestion at {snapshot.zone_id.replace('_', ' ').title()}",
                        zone_id=snapshot.zone_id,
                    )
                )
        return alerts

    def get_relevant_zones(self, zone_id: str | None = None, stadium_id: str = "metlife") -> list[CrowdSnapshot]:
        config = self.get_stadium_config(stadium_id)
        zone_graph = config["zone_graph"]
        if not zone_id or zone_id not in zone_graph:
            return self.get_all_snapshots(stadium_id)[:5]
        neighbors = zone_graph.get(zone_id, [])
        relevant = [self.get_snapshot(zone_id, stadium_id)]
        for neighbor in neighbors[:4]:
            relevant.append(self.get_snapshot(neighbor, stadium_id))
        return relevant


crowd_engine = CrowdEngine()