import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback, ReactNode } from 'react';
import { AppState, AppContextType } from '../context/types';
import { ChatMessage, CrowdSnapshot, Alert, Recommendation } from '../types';

const initialState: AppState = {
  user: {
    name: 'Fan',
    role: 'fan',
    language: 'en',
    stadium_id: 'metlife',
    accessibility_mode: false,
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

let globalSocket: WebSocket | null = null;
let lastStadiumId: string | null = null;

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const wsRef = useRef<WebSocket | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  });

  // Setup WebSocket connection
  useEffect(() => {
    const stadiumId = state.user.stadium_id || 'metlife';

    // If socket is already open or opening for this stadium, reuse it
    if (globalSocket && lastStadiumId === stadiumId && globalSocket.readyState <= WebSocket.OPEN) {
      wsRef.current = globalSocket;
      return;
    }

    // Close any existing stale connection
    if (globalSocket) {
      try {
        globalSocket.close();
      } catch (e) {}
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    let wsHost = window.location.host;
    if (window.location.port === '5173') {
      wsHost = 'localhost:8000';
    }
    const wsUrl = `${wsProtocol}://${wsHost}/api/v1/crowd/ws/${stadiumId}`;

    const socket = new WebSocket(wsUrl);
    globalSocket = socket;
    lastStadiumId = stadiumId;
    wsRef.current = socket;

    socket.onopen = () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          current_zone_id: stateRef.current.current_zone_id,
          minutes: stateRef.current.simulation_time
        }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.crowd) dispatch({ type: 'SET_CROWD_DATA', payload: payload.crowd });
        if (payload.alerts) dispatch({ type: 'SET_ALERTS', payload: payload.alerts });
        if (payload.recommendations) dispatch({ type: 'SET_RECOMMENDATIONS', payload: payload.recommendations });
        if (payload.match_time !== undefined) dispatch({ type: 'SET_SIMULATION_TIME', payload: payload.match_time });
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    socket.onerror = (error) => {
      if (socket.readyState === WebSocket.CLOSED) return;
      console.error('WebSocket error in AppProvider:', error);
    };

    return () => {
      // Delay closing to prevent React 18 Strict Mode double-render warnings
      setTimeout(() => {
        if (globalSocket === socket && socket.readyState <= WebSocket.OPEN) {
          return;
        }
        socket.close();
      }, 100);
    };
  }, [state.user.stadium_id]);

  // Keep current_zone_id synchronized on changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ current_zone_id: state.current_zone_id }));
    }
  }, [state.current_zone_id]);

  const sendWSMessage = useCallback((msg: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

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
    sendWSMessage,
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