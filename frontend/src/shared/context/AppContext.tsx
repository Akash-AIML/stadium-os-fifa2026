import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, AppContextType } from '../context/types';
import { ChatMessage, CrowdSnapshot, Alert, Recommendation } from '../types';

const initialState: AppState = {
  user: {
    name: 'Fan',
    role: 'fan',
    language: 'en',
  },
  current_zone_id: null,
  crowd_data: [],
  alerts: [],
  recommendations: [],
  chat_history: [],
  simulation_time: 0,
  dev_mode: false,
};

type Action =
  | { type: 'SET_USER'; payload: Partial<AppState['user']> }
  | { type: 'SET_CURRENT_ZONE'; payload: string | null }
  | { type: 'SET_CROWD_DATA'; payload: CrowdSnapshot[] }
  | { type: 'SET_ALERTS'; payload: Alert[] }
  | { type: 'SET_RECOMMENDATIONS'; payload: Recommendation[] }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_SIMULATION_TIME'; payload: number }
  | { type: 'TOGGLE_DEV_MODE' };

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'SET_CURRENT_ZONE':
      return { ...state, current_zone_id: action.payload };
    case 'SET_CROWD_DATA':
      return { ...state, crowd_data: action.payload };
    case 'SET_ALERTS':
      return { ...state, alerts: action.payload };
    case 'SET_RECOMMENDATIONS':
      return { ...state, recommendations: action.payload };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chat_history: [...state.chat_history, action.payload] };
    case 'SET_SIMULATION_TIME':
      return { ...state, simulation_time: action.payload };
    case 'TOGGLE_DEV_MODE':
      return { ...state, dev_mode: !state.dev_mode };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const value: AppContextType = {
    state,
    setUser: (user) => dispatch({ type: 'SET_USER', payload: user }),
    setCurrentZone: (zoneId) => dispatch({ type: 'SET_CURRENT_ZONE', payload: zoneId }),
    setCrowdData: (data) => dispatch({ type: 'SET_CROWD_DATA', payload: data }),
    setAlerts: (alerts) => dispatch({ type: 'SET_ALERTS', payload: alerts }),
    setRecommendations: (recs) => dispatch({ type: 'SET_RECOMMENDATIONS', payload: recs }),
    addChatMessage: (message) => dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message }),
    setSimulationTime: (time) => dispatch({ type: 'SET_SIMULATION_TIME', payload: time }),
    toggleDevMode: () => dispatch({ type: 'TOGGLE_DEV_MODE' }),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}