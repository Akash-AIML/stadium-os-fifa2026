import { useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { fetchCrowdData, fetchAlerts, fetchRecommendations } from '../../services/api';

export function useCrowdData() {
  const { setCrowdData, setAlerts, setRecommendations } = useApp();

  const loadData = useCallback(async () => {
    try {
      const [crowdData, alerts, recommendations] = await Promise.all([
        fetchCrowdData(),
        fetchAlerts(),
        fetchRecommendations(),
      ]);
      setCrowdData(crowdData);
      setAlerts(alerts);
      setRecommendations(recommendations);
    } catch (error) {
      console.error('Failed to load crowd data:', error);
    }
  }, [setCrowdData, setAlerts, setRecommendations]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  return { loadData };
}