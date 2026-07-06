import { AppState, ChatMessage, CrowdSnapshot, Alert, Recommendation } from '../types';

interface AppContextType {
  state: AppState;
  setUser: (user: Partial<AppState['user']>) => void;
  setCurrentZone: (zoneId: string | null) => void;
  setCrowdData: (data: CrowdSnapshot[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  setRecommendations: (recs: Recommendation[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  setSimulationTime: (time: number) => void;
  toggleDevMode: () => void;
}

export type { AppState, AppContextType };