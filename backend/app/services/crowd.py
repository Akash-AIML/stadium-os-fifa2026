import math
import logging
from datetime import datetime
from app.models import CrowdSnapshot, ZoneStatus, Alert, Zone

logger = logging.getLogger(__name__)

# Simulation constants
DEFAULT_DENSITY = 0.3
DENSITY_LEVEL_LOW = 0.3
DENSITY_LEVEL_MODERATE = 0.5
DENSITY_LEVEL_BUSY = 0.75
QUEUE_MULTIPLIER = 30
CRITICAL_DENSITY_THRESHOLD = 0.9

# Match clock constants
HALFTIME_START = 45
HALFTIME_END = 60
FULLTIME = 90


class CrowdEngine:
    """
    Simulates real-time crowd dynamics, congestion states, and queue wait times
    across match clock phases (pre-match, halftime, full-time).
    """

    def __init__(self):
        self.base_time = datetime.now()
        self.match_time_minutes = 0

    def get_stadium_config(self, stadium_id: str = "metlife") -> dict:
        """
        Resolves the configuration profile (zones, capacities, edges) of the requested venue.
        """
        from app.services.stadiums import STADIUMS_CONFIG
        if not stadium_id or stadium_id not in STADIUMS_CONFIG:
            stadium_id = "metlife"
        return STADIUMS_CONFIG[stadium_id]

    def set_match_time(self, minutes: int) -> None:
        """
        Updates the simulation minute (clamped between 0 and 120 minutes).
        """
        logger.info("Setting simulation match time to %d minutes", minutes)
        self.match_time_minutes = max(0, min(120, minutes))

    def get_all_zones(self, stadium_id: str = "metlife") -> list[Zone]:
        """
        Returns a list of all zones with their physical metadata and live status snapshots.
        """
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
        """
        Calculates density status snapshots for every zone within the stadium configuration.
        """
        config = self.get_stadium_config(stadium_id)
        snapshots = []
        for zone in config["zones"]:
            snapshot = self.get_snapshot(zone["id"], stadium_id)
            snapshots.append(snapshot)
        return snapshots

    def get_snapshot(self, zone_id: str, stadium_id: str = "metlife") -> CrowdSnapshot:
        """
        Resolves a single crowd snapshot for a given zone.
        """
        config = self.get_stadium_config(stadium_id)
        zone = next((z for z in config["zones"] if z["id"] == zone_id), None)
        if not zone:
            logger.error("Snapshot resolution failed: zone %s not found in stadium %s", zone_id, stadium_id)
            raise ValueError(f"Zone {zone_id} not found")

        density = self._calculate_density(zone)
        status = self._density_to_status(density)
        queue_time = int(density * QUEUE_MULTIPLIER) if zone["type"] in ["food", "wc", "entrance"] else 0

        return CrowdSnapshot(zone_id=zone_id, density=density, status=status, queue_time=queue_time)

    def _calculate_entrance_density(self, match_time: int) -> float:
        """Computes entrance density."""
        if match_time < 30:
            return 0.7 + 0.2 * math.sin(match_time * 0.1)
        if match_time > FULLTIME:
            return 0.4
        return 0.2

    def _calculate_seating_density(self, match_time: int) -> float:
        """Computes seating density."""
        if 30 <= match_time <= FULLTIME:
            return 0.9
        if match_time > FULLTIME:
            return 0.3
        return 0.4

    def _calculate_food_density(self, match_time: int) -> float:
        """Computes concession food stand density."""
        if HALFTIME_START <= match_time <= HALFTIME_END:
            return 0.85
        if match_time < 30 or match_time > FULLTIME:
            return 0.6
        return 0.3

    def _calculate_wc_density(self, match_time: int) -> float:
        """Computes restroom density."""
        if HALFTIME_START <= match_time <= HALFTIME_END:
            return 0.9
        return 0.4

    def _calculate_exit_density(self, match_time: int) -> float:
        """Computes exit gate density."""
        if match_time > FULLTIME:
            return 0.8
        return 0.2

    def _calculate_density(self, zone: dict) -> float:
        """
        Computes dynamic zone density coefficients based on active match clock state.
        """
        zone_type = zone["type"]
        match_time = self.match_time_minutes

        if zone_type == "entrance":
            base_density = self._calculate_entrance_density(match_time)
        elif zone_type == "seating":
            base_density = self._calculate_seating_density(match_time)
        elif zone_type == "food":
            base_density = self._calculate_food_density(match_time)
        elif zone_type == "wc":
            base_density = self._calculate_wc_density(match_time)
        elif zone_type == "exit":
            base_density = self._calculate_exit_density(match_time)
        elif zone_type == "medical":
            base_density = 0.15
        else:
            base_density = DEFAULT_DENSITY

        return min(1.0, max(0.0, base_density))

    def _density_to_status(self, density: float) -> ZoneStatus:
        """
        Maps a float density scale to structural ZoneStatus enum categorizations.
        """
        if density < DENSITY_LEVEL_LOW:
            return ZoneStatus.CLEAR
        elif density < DENSITY_LEVEL_MODERATE:
            return ZoneStatus.MODERATE
        elif density < DENSITY_LEVEL_BUSY:
            return ZoneStatus.BUSY
        else:
            return ZoneStatus.CONGESTED

    def get_alerts(self, stadium_id: str = "metlife") -> list[Alert]:
        """
        Returns active warning or critical alerts when zone congestions arise.
        """
        alerts = []
        snapshots = self.get_all_snapshots(stadium_id)
        for snapshot in snapshots:
            if snapshot.status == ZoneStatus.CONGESTED:
                alerts.append(
                    Alert(
                        id=f"alert_{snapshot.zone_id}",
                        level="critical" if snapshot.density > CRITICAL_DENSITY_THRESHOLD else "warning",
                        message=f"High congestion at {snapshot.zone_id.replace('_', ' ').title()}",
                        zone_id=snapshot.zone_id,
                    )
                )
        return alerts

    def get_relevant_zones(self, zone_id: str | None = None, stadium_id: str = "metlife") -> list[CrowdSnapshot]:
        """
        Returns live snapshots for user's surrounding neighbor zones to enrich co-pilot recommendations.
        """
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