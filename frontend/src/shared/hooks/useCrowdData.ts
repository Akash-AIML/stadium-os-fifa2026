import { useCallback } from 'react';
import { useApp } from '../context/AppContext';

export function useCrowdData() {
  const { sendWSMessage, state } = useApp();

  const loadData = useCallback(async () => {
    sendWSMessage({ current_zone_id: state.current_zone_id });
  }, [sendWSMessage, state.current_zone_id]);

  return { loadData };
}