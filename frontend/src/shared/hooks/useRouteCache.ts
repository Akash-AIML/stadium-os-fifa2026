import { useState, useRef, useEffect, useCallback } from 'react';
import { fetchRoute } from '../../services/api';
import type { Route } from '../types';

interface UseRouteCacheOptions {
  stadiumId: string | undefined;
  accessibilityMode: boolean | undefined;
  currentZoneId: string | null | undefined;
  setCurrentZone: (zoneId: string) => void;
}

interface UseRouteCacheReturn {
  currentRoute: Route | null;
  setCurrentRoute: (route: Route | null) => void;
  handleZoneClick: (zoneId: string) => Promise<void>;
}

/**
 * Manages route fetching with a client-side key-value cache.
 * Cache is invalidated automatically when accessibilityMode changes.
 */
export function useRouteCache({
  stadiumId,
  accessibilityMode,
  currentZoneId,
  setCurrentZone,
}: UseRouteCacheOptions): UseRouteCacheReturn {
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const routeCacheRef = useRef<Map<string, Route | null>>(new Map());

  // Invalidate stale routes whenever accessibility mode flips
  useEffect(() => {
    routeCacheRef.current.clear();
  }, [accessibilityMode]);

  const handleZoneClick = useCallback(async (zoneId: string) => {
    if (currentZoneId && currentZoneId !== zoneId) {
      const cacheKey = `${currentZoneId}_${zoneId}_${stadiumId}_${accessibilityMode}`;
      const cached = routeCacheRef.current.get(cacheKey);
      if (cached !== undefined) {
        setCurrentRoute(cached);
      } else {
        try {
          const routeData = await fetchRoute(
            currentZoneId,
            zoneId,
            stadiumId,
            accessibilityMode
          );
          routeCacheRef.current.set(cacheKey, routeData);
          setCurrentRoute(routeData);
        } catch (error) {
          console.error('Failed to fetch route:', error);
          setCurrentRoute(null);
        }
      }
    } else {
      setCurrentRoute(null);
    }
    setCurrentZone(zoneId);
  }, [currentZoneId, stadiumId, accessibilityMode, setCurrentZone]);

  return { currentRoute, setCurrentRoute, handleZoneClick };
}
