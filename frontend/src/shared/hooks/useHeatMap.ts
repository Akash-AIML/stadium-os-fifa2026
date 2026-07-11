import { useMemo, useCallback } from 'react';
import { ZoneStatus, CrowdZone } from '../types';

interface HeatmapZone {
  id: string;
  label: string;
  location: [number, number];
  intensity: number;
  status: ZoneStatus;
  color: string;
  radius: number;
  pulse: boolean;
}

const STATUS_COLORS: Record<ZoneStatus, string> = {
  [ZoneStatus.CLEAR]: '#10b981',
  [ZoneStatus.MODERATE]: '#f59e0b',
  [ZoneStatus.BUSY]: '#f97316',
  [ZoneStatus.CONGESTED]: '#ef4444',
};

export function useHeatMap(zones: CrowdZone[]) {
  const heatmapZones = useMemo((): HeatmapZone[] => {
    return zones.map((zone) => {
      const intensity = Math.min(zone.density * 1.2, 1);
      const baseRadius = zone.type === 'entrance' || zone.type === 'exit' ? 35 : 28;
      return {
        id: zone.id,
        label: zone.label,
        location: zone.location,
        intensity,
        status: zone.status,
        color: STATUS_COLORS[zone.status] || STATUS_COLORS[ZoneStatus.CLEAR],
        radius: baseRadius * (0.7 + intensity * 0.5),
        pulse: zone.status === ZoneStatus.CONGESTED || zone.status === ZoneStatus.BUSY,
      };
    });
  }, [zones]);

  const getZoneIntensity = useCallback((zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    return zone ? zone.density : 0;
  }, [zones]);

  const getOverallCrowdLevel = useCallback(() => {
    if (zones.length === 0) return 0;
    return zones.reduce((sum, z) => sum + z.density, 0) / zones.length;
  }, [zones]);

  const getCongestedCount = useCallback(() => {
    return zones.filter(z => z.status === ZoneStatus.CONGESTED || z.status === ZoneStatus.BUSY).length;
  }, [zones]);

  const getColorForDensity = useCallback((density: number) => {
    if (density < 0.25) return STATUS_COLORS[ZoneStatus.CLEAR];
    if (density < 0.5) return STATUS_COLORS[ZoneStatus.MODERATE];
    if (density < 0.75) return STATUS_COLORS[ZoneStatus.BUSY];
    return STATUS_COLORS[ZoneStatus.CONGESTED];
  }, []);

  return {
    heatmapZones,
    getZoneIntensity,
    getOverallCrowdLevel,
    getCongestedCount,
    getColorForDensity,
  };
}