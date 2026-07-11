import { useState, useEffect, useCallback, useRef } from 'react';
import { ZoneStatus, CrowdSnapshot, Alert, Recommendation, CrowdZone } from '../types';
import { fetchCrowdData, fetchAlerts, fetchRecommendations } from '../../services/api';
import { STADIUM_ZONES_METADATA } from '../utils/zones';

export function useCrowd() {
  const [zones, setZones] = useState<CrowdZone[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [crowdData, alertsData, recsData] = await Promise.all([
        fetchCrowdData(),
        fetchAlerts(),
        fetchRecommendations(),
      ]);

      const enrichedZones: CrowdZone[] = crowdData.map((c) => {
        const meta = STADIUM_ZONES_METADATA[c.zone_id] || {
          label: c.zone_id.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          type: 'generic',
          location: [0, 0] as [number, number],
        };
        const existing = zones.find(z => z.id === c.zone_id);
        const history = existing ? [...existing.history.slice(-19), c.density] : new Array(20).fill(c.density);
        const waitHistory = existing ? [...existing.waitHistory.slice(-19), c.queue_time] : new Array(20).fill(c.queue_time);
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (history.length >= 2) {
          const currentVal = history[history.length - 1];
          const prevVal = history[history.length - 2];
          if (currentVal > prevVal + 0.02) {
            trend = 'up';
          } else if (currentVal < prevVal - 0.02) {
            trend = 'down';
          }
        }

        return {
          id: c.zone_id,
          label: meta.label,
          type: meta.type,
          location: meta.location,
          status: c.status,
          density: c.density,
          queueTime: c.queue_time,
          trend,
          history,
          waitHistory,
          recommendations: [],
        };
      });

      setZones(enrichedZones);
      setAlerts(alertsData);
      setRecommendations(recsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load crowd data');
    } finally {
      setIsLoading(false);
    }
  }, [zones]);

  useEffect(() => {
    loadData();
    intervalRef.current = setInterval(loadData, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [loadData]);

  const getZone = useCallback((zoneId: string) => zones.find(z => z.id === zoneId), [zones]);
  const getZonesByType = useCallback((type: string) => zones.filter(z => z.type === type), [zones]);
  const getCongestedZones = useCallback(() => zones.filter(z => z.status === ZoneStatus.CONGESTED || z.status === ZoneStatus.BUSY), [zones]);

  return {
    zones,
    alerts,
    recommendations,
    isLoading,
    error,
    loadData,
    getZone,
    getZonesByType,
    getCongestedZones,
  };
}