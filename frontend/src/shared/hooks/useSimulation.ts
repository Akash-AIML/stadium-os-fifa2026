import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export function useSimulation() {
  const { state, setSimulationTime } = useApp();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const setMatchTime = (minutes: number) => {
    setSimulationTime(Math.max(0, Math.min(120, minutes)));
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