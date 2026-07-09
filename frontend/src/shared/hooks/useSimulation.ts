import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { setSimulationTimeApi } from '../../services/api';

export function useSimulation() {
  const { state, setSimulationTime, toggleDevMode } = useApp();

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
    // Allow full range including pre-match (-30) to post-match (120)
    const mins = Math.max(-30, Math.min(120, minutes));
    setSimulationTime(mins);
    // Notify backend if available — silently ignore failures (backend may not be deployed)
    try {
      await setSimulationTimeApi(mins);
    } catch {
      // Backend unreachable — slider still works locally
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