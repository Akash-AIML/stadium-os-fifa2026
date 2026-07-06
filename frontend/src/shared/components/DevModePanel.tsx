import React from 'react';
import { useApp } from '../context/AppContext';

export function DevModePanel() {
  const { state } = useApp();

  if (!state.dev_mode) return null;

  const lastMessage = state.chat_history[state.chat_history.length - 1];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white text-xs p-4 max-h-48 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Developer Mode</h3>
        <button
          onClick={() => {}}
          className="text-gray-400 hover:text-white"
          aria-label="Close dev mode"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-gray-400">Simulation Time</p>
          <p className="font-mono">{state.simulation_time} min</p>
        </div>
        <div>
          <p className="text-gray-400">Current Zone</p>
          <p className="font-mono">{state.current_zone_id || 'None'}</p>
        </div>
        <div>
          <p className="text-gray-400">Chat Messages</p>
          <p className="font-mono">{state.chat_history.length}</p>
        </div>
        <div>
          <p className="text-gray-400">Active Alerts</p>
          <p className="font-mono">{state.alerts.length}</p>
        </div>
      </div>
      {lastMessage && (
        <div className="mt-4">
          <p className="text-gray-400 mb-1">Last Response:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
            <p>Intent: {lastMessage.intent}</p>
            <p>Response: {lastMessage.response_time?.toFixed(2)}ms</p>
            <p>Confidence: {(lastMessage.confidence || 0 * 100).toFixed(0)}%</p>
            <p>Fallback: {lastMessage.is_fallback ? 'Yes' : 'No'}</p>
          </div>
        </div>
      )}
    </div>
  );
}