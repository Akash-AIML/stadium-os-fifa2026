import React from 'react';
import { useApp } from '../context/AppContext';
import { Terminal } from 'lucide-react';
import { STADIUMS_CONFIG } from '../utils/stadiums';

export function DevModePanel() {
  const { state, toggleDevMode } = useApp();

  if (!state.dev_mode) return null;

  const lastMessage = state.chat_history[state.chat_history.length - 1];
  const activeStadium = state.user.stadium_id || 'metlife';
  const config = STADIUMS_CONFIG[activeStadium] || STADIUMS_CONFIG.metlife;

  const elapsed_minutes = state.simulation_time;
  const timeline_phase = elapsed_minutes >= 90 ? 'Post-match' : elapsed_minutes >= 60 ? 'Second Half' : elapsed_minutes >= 45 ? 'Halftime' : 'First Half';

  return (
    <div
      className="fixed bottom-4 right-4 w-96 rounded-2xl border p-4 shadow-2xl z-50 flex flex-col gap-3 font-mono text-[10px]"
      style={{
        background: 'var(--glass-bg-strong)',
        backdropFilter: 'blur(20px)',
        borderColor: 'var(--glass-border)',
        boxShadow: '0 8px 32px var(--glass-shadow)',
        color: 'hsl(var(--fg))',
      }}
    >
      <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <Terminal className="w-3.5 h-3.5" />
          <span>StadiumOS DevMonitor</span>
        </div>
        <button
          onClick={toggleDevMode}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
          aria-label="Close dev mode"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-left">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-500">Active Venue</span>
          <p className="font-bold text-slate-200">{config.name}</p>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-500">Sim Time / Phase</span>
          <p className="font-bold text-slate-200">{elapsed_minutes}' ({timeline_phase})</p>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-500">A11y Strategy</span>
          <p className="font-bold text-purple-400">{state.user.accessibility_mode ? 'Wheelchair/Elevator' : 'Standard'}</p>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-500">Current Zone</span>
          <p className="font-bold text-slate-200">{state.current_zone_id || 'None'}</p>
        </div>
      </div>

      {lastMessage ? (
        <div className="border-t pt-2 flex flex-col gap-2" style={{ borderColor: 'var(--glass-border)' }}>
          <div className="grid grid-cols-2 gap-2 text-left">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-500">Detected Intent</span>
              <p className="text-cyan-400 font-bold">{lastMessage.intent}</p>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-500">LLM Latency</span>
              <p className="text-slate-200">{lastMessage.response_time ? `${lastMessage.response_time.toFixed(1)}ms` : 'N/A'}</p>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-500">Confidence Score</span>
              <p className="text-slate-200">{lastMessage.confidence ? `${(lastMessage.confidence * 100).toFixed(0)}%` : 'N/A'}</p>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-500">Fallback Source</span>
              <p className="font-bold text-amber-400">{lastMessage.is_fallback ? 'Offline Engine' : 'Google Gemini'}</p>
            </div>
          </div>

          <div className="text-left mt-1 bg-black/45 p-2 rounded-lg max-h-24 overflow-y-auto">
            <span className="text-[8px] uppercase tracking-wider text-slate-500 block mb-0.5">Decision Engine Output</span>
            <p className="text-emerald-400 leading-normal text-[9px]">
              {lastMessage.route_id ? `Active Path: ${lastMessage.route_id}` : `Context loaded with ${lastMessage.context_snapshot.length} zones`}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-slate-500 border-t" style={{ borderColor: 'var(--glass-border)' }}>
          No chat interactions logged in active session.
        </div>
      )}
    </div>
  );
}