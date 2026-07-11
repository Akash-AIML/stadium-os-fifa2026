import { useEffect, useRef } from 'react';
import { fetchRoute } from '../../services/api';
import { STADIUMS_CONFIG } from '../utils/stadiums';
import type { ChatMessage, Route } from '../types';

interface UseAiMapSyncOptions {
  chatHistory: ChatMessage[];
  stadiumId: string | undefined;
  accessibilityMode: boolean | undefined;
  currentZoneId: string | null | undefined;
  setCurrentRoute: (route: Route | null) => void;
  setCurrentZone: (zoneId: string) => void;
}

/**
 * Watches chat history for the latest AI message and attempts to
 * extract a route or zone mention to auto-update the map.
 * Debounced at 400 ms to prevent 429 flooding.
 */
export function useAiMapSync({
  chatHistory,
  stadiumId,
  accessibilityMode,
  currentZoneId,
  setCurrentRoute,
  setCurrentZone,
}: UseAiMapSyncOptions) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (chatHistory.length === 0) return;
    const lastMsg = chatHistory[chatHistory.length - 1];
    if (lastMsg.role !== 'model') return;

    const activeStadium = stadiumId ?? 'metlife';
    const config = STADIUMS_CONFIG[activeStadium] ?? STADIUMS_CONFIG.metlife;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      syncAiToMap(
        lastMsg,
        config,
        activeStadium,
        accessibilityMode ?? false,
        currentZoneId ?? null,
        setCurrentRoute,
        setCurrentZone,
      );
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [chatHistory, stadiumId, accessibilityMode, currentZoneId, setCurrentRoute, setCurrentZone]);
}

function syncAiToMap(
  lastMsg: { route_id?: string; content: string },
  config: (typeof STADIUMS_CONFIG)[keyof typeof STADIUMS_CONFIG],
  activeStadium: string,
  accessibilityMode: boolean,
  currentZoneId: string | null,
  setCurrentRoute: (r: Route | null) => void,
  setCurrentZone: (z: string) => void,
) {
  if (lastMsg.route_id) {
    const routeId = lastMsg.route_id;
    const zoneIds = Object.keys(config.zones);
    const found = zoneIds.filter(id => routeId.includes(id));
    if (found.length >= 2) {
      const sorted = [...found].sort((a, b) => routeId.indexOf(a) - routeId.indexOf(b));
      fetchRoute(sorted[0], sorted[1], activeStadium, accessibilityMode)
        .then(routeData => {
          setCurrentRoute(routeData);
          setCurrentZone(sorted[1]);
        })
        .catch(() => {});
    }
    return;
  }

  const contentLower = lastMsg.content.toLowerCase();
  const mentionedZone = Object.keys(config.zones).find(id => {
    const label = config.zones[id].label.toLowerCase();
    return contentLower.includes(label) || contentLower.includes(id.replace(/_/g, ' '));
  });
  if (!mentionedZone) return;

  setCurrentZone(mentionedZone);
  if (currentZoneId && currentZoneId !== mentionedZone) {
    fetchRoute(currentZoneId, mentionedZone, activeStadium, accessibilityMode)
      .then(routeData => setCurrentRoute(routeData))
      .catch(() => {});
  }
}
