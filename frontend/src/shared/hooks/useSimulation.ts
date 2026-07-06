import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { setSimulationTimeApi } from '../../services/api';
import { useCrowdData } from './useCrowdData';

export function useSimulation() {
  const { state, setSimulationTime, toggleDevMode } = useApp();
  const { loadData } = useCrowdData();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        toggleDevMode();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleDevMode]);

  const setMatchTime = async (minutes: number) => {
    const mins = Math.max(0, Math.min(120, minutes));
    setSimulationTime(mins);
    try {
      await setSimulationTimeApi(mins);
      loadData();
    } catch (error) {
      console.error('Failed to sync simulation time with backend:', error);
    }
  };

  const scenarios = {
    preMatch: () => setMatchTime(15),
    halftime: () => setMatchTime(50),
    fullTime: () => setMatchTime(95),
  };

  return {
    simulationTime: state.simulation_time,
    setMatchTime,
    scenarios,
  };
}