import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { fetchRoute } from '../../services/api';
import { STADIUM_ZONES_METADATA } from '../utils/zones';

interface RouteStep {
  zoneId: string;
  label: string;
  location: [number, number];
  instruction: string;
  distance: number;
  crowdLevel: number;
}

interface NavigationState {
  isNavigating: boolean;
  currentRoute: RouteStep[] | null;
  currentStepIndex: number;
  estimatedTimeRemaining: number;
  totalDistance: number;
  alternativeRoutes: RouteStep[][];
}

export function useNavigation() {
  const { state } = useApp();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false,
    currentRoute: null,
    currentStepIndex: 0,
    estimatedTimeRemaining: 0,
    totalDistance: 0,
    alternativeRoutes: [],
  });
  const [recentDestinations, setRecentDestinations] = useState<string[]>([]);

  const calculateRoute = useCallback(async (fromZoneId: string, toZoneId: string) => {
    try {
      const routeData = await fetchRoute(fromZoneId, toZoneId);
      if (routeData?.path) {
        const steps: RouteStep[] = routeData.path
          .map((zoneId: string, index: number) => {
            const meta = STADIUM_ZONES_METADATA[zoneId];
            const crowdData = state.crowd_data.find(c => c.zone_id === zoneId);
            if (!meta) return null;
            let instruction = `Continue to ${meta.label}`;
            if (index === 0) {
              instruction = `Start at ${meta.label}`;
            } else if (index === routeData.path.length - 1) {
              instruction = `Arrive at ${meta.label}`;
            }
            return {
              zoneId,
              label: meta.label,
              location: meta.location,
              instruction,
              distance: index > 0 ? 50 + ((zoneId.codePointAt(0) ?? 0) % 10) * 10 : 0,
              crowdLevel: crowdData?.density ?? 0,
            };
          })
          .filter(Boolean) as RouteStep[];

        const totalDistance = steps.reduce((sum, s) => sum + s.distance, 0);
        const estimatedTime = routeData.estimated_time || steps.length * 2;

        setNavigationState({
          isNavigating: true,
          currentRoute: steps,
          currentStepIndex: 0,
          estimatedTimeRemaining: estimatedTime,
          totalDistance,
          alternativeRoutes: [],
        });

        return steps;
      }
    } catch (error) {
      console.error('Route calculation failed:', error);
    }
    return null;
  }, [state.crowd_data]);

  const startNavigation = useCallback((fromZoneId: string, toZoneId: string) => {
    calculateRoute(fromZoneId, toZoneId);
    if (!recentDestinations.includes(toZoneId)) {
      setRecentDestinations(prev => [toZoneId, ...prev.slice(0, 4)]);
    }
  }, [calculateRoute, recentDestinations]);

  const nextStep = useCallback(() => {
    setNavigationState(prev => {
      if (!prev.currentRoute || prev.currentStepIndex >= prev.currentRoute.length - 1) {
        return { ...prev, isNavigating: false };
      }
      return {
        ...prev,
        currentStepIndex: prev.currentStepIndex + 1,
        estimatedTimeRemaining: Math.max(0, prev.estimatedTimeRemaining - 2),
      };
    });
  }, []);

  const previousStep = useCallback(() => {
    setNavigationState(prev => ({
      ...prev,
      currentStepIndex: Math.max(0, prev.currentStepIndex - 1),
    }));
  }, []);

  const stopNavigation = useCallback(() => {
    setNavigationState({
      isNavigating: false,
      currentRoute: null,
      currentStepIndex: 0,
      estimatedTimeRemaining: 0,
      totalDistance: 0,
      alternativeRoutes: [],
    });
  }, []);

  const getCurrentInstruction = useCallback(() => {
    if (!navigationState.currentRoute) return null;
    return navigationState.currentRoute[navigationState.currentStepIndex]?.instruction || null;
  }, [navigationState]);

  const getProgress = useCallback(() => {
    if (!navigationState.currentRoute || navigationState.currentRoute.length === 0) return 0;
    return (navigationState.currentStepIndex + 1) / navigationState.currentRoute.length;
  }, [navigationState]);

  return {
    navigationState,
    startNavigation,
    nextStep,
    previousStep,
    stopNavigation,
    getCurrentInstruction,
    getProgress,
    recentDestinations,
    calculateRoute,
  };
}