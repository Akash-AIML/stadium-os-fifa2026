import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './shared/context/AppContext';
import { StadiumMap } from './features/navigation/StadiumMap';
import { ChatWindow } from './features/chat/ChatWindow';
import { Dashboard } from './features/crowd/Dashboard';
import { RecommendationsList } from './features/crowd/RecommendationCard';
import { OnboardingModal } from './shared/components/OnboardingModal';
import { DevModePanel } from './shared/components/DevModePanel';
import { useCrowdData } from './shared/hooks/useCrowdData';
import { useSimulation } from './shared/hooks/useSimulation';
import { STADIUM_ZONES_METADATA } from './shared/utils/zones';
import { fetchRoute } from './services/api';


function AppContent() {
  const { state, setCurrentZone, toggleDevMode, setSimulationTime } = useApp();
  const { loadData } = useCrowdData();
  const { setMatchTime } = useSimulation();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState<'map' | 'chat' | 'dashboard'>('map');
  const [currentRoute, setCurrentRoute] = useState<any | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('fifa_onboarding_complete');
    if (saved) setShowOnboarding(false);
  }, []);

  const handleZoneClick = async (zoneId: string) => {
    if (state.current_zone_id && state.current_zone_id !== zoneId) {
      try {
        const routeData = await fetchRoute(state.current_zone_id, zoneId);
        setCurrentRoute(routeData);
      } catch (error) {
        console.error('Failed to fetch route:', error);
        setCurrentRoute(null);
      }
    } else {
      setCurrentRoute(null);
    }
    setCurrentZone(zoneId);
    loadData();
  };

  const zones = state.crowd_data.map(c => {
    const meta = STADIUM_ZONES_METADATA[c.zone_id] || {
      label: c.zone_id.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      type: 'generic',
      location: [0, 0] as [number, number],
    };
    return {
      id: c.zone_id,
      label: meta.label,
      type: meta.type,
      location: meta.location,
      status: c.status,
    };
  });

  return (
    <div className="min-h-screen text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      <div>
        {/* Header */}
        <header className="border-b border-slate-800/80 bg-slate-950/45 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-violet-500/20">
                  ⚽
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    FIFA 2026 <span className="font-light text-cyan-400 neon-text-cyan">Smart Guide</span>
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-slate-400">Authorized user</p>
                  <p className="text-sm font-semibold text-slate-200">{state.user.name}</p>
                </div>
                <button
                  onClick={toggleDevMode}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-xs font-semibold text-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  aria-label="Toggle developer mode"
                >
                  🛠️ Developer Panel
                </button>
              </div>
            </div>

            {/* Simulation Controls */}
            <div className="mt-4 pt-4 border-t border-slate-900 flex flex-wrap justify-between items-center gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setMatchTime(15)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
                    state.simulation_time <= 30
                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  ⚡ Pre-Match
                </button>
                <button
                  onClick={() => setMatchTime(50)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
                    state.simulation_time > 30 && state.simulation_time <= 75
                      ? 'bg-amber-600/20 border-amber-500/50 text-amber-300 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  ⏳ Halftime
                </button>
                <button
                  onClick={() => setMatchTime(95)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
                    state.simulation_time > 75
                      ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  🏁 Full-Time
                </button>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-900 text-xs font-mono text-cyan-400">
                <span className="h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
                <span>Simulation: {state.simulation_time} mins</span>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Tabs */}
        <nav className="md:hidden bg-slate-950/60 backdrop-blur border-b border-slate-900" role="tablist">
          <div className="flex">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex-1 py-3 text-center text-sm font-semibold transition-all ${
                activeTab === 'map'
                  ? 'border-b-2 border-cyan-500 text-cyan-400 bg-cyan-500/5'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              role="tab"
              aria-selected={activeTab === 'map'}
            >
              🧭 Map
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 text-center text-sm font-semibold transition-all ${
                activeTab === 'chat'
                  ? 'border-b-2 border-cyan-500 text-cyan-400 bg-cyan-500/5'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              role="tab"
              aria-selected={activeTab === 'chat'}
            >
              💬 Assistant
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 py-3 text-center text-sm font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'border-b-2 border-cyan-500 text-cyan-400 bg-cyan-500/5'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              role="tab"
              aria-selected={activeTab === 'dashboard'}
            >
              📊 Stats
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Map */}
            <div className={`${activeTab === 'map' ? 'block' : 'hidden md:block'}`}>
              <div className="glass-panel rounded-2xl p-5">
                <h2 className="text-lg font-bold mb-4 tracking-wide text-slate-200 flex items-center gap-2">
                  <span>🧭</span> Stadium Live Blueprint
                </h2>
                <StadiumMap
                  zones={zones}
                  selectedZoneId={state.current_zone_id}
                  onZoneClick={handleZoneClick}
                  activeRoute={currentRoute}
                />
              </div>
            </div>

            {/* Chat */}
            <div className={`${activeTab === 'chat' ? 'block' : 'hidden md:block'}`}>
              <div className="glass-panel rounded-2xl p-5 h-[620px] flex flex-col justify-between">
                <h2 className="text-lg font-bold mb-4 tracking-wide text-slate-200 flex items-center gap-2">
                  <span>✨</span> FIFA AI Fan Assistant
                </h2>
                <div className="flex-1 h-full min-h-0">
                  <ChatWindow currentZoneId={state.current_zone_id} />
                </div>
              </div>
            </div>

            {/* Dashboard & Recommendations */}
            <div className={`${activeTab === 'dashboard' ? 'block' : 'hidden md:block'} md:col-span-2`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel rounded-2xl p-5">
                  <h2 className="text-lg font-bold mb-4 tracking-wide text-slate-200 flex items-center gap-2">
                    <span>📊</span> Crowd Dynamics Overview
                  </h2>
                  <Dashboard alerts={state.alerts} crowdData={state.crowd_data} />
                </div>
                <div className="glass-panel rounded-2xl p-5">
                  <h2 className="text-lg font-bold mb-4 tracking-wide text-slate-200 flex items-center gap-2">
                    <span>💡</span> Contextual Recommendations
                  </h2>
                  <RecommendationsList recommendations={state.recommendations} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950/20 border-t border-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          FIFA 2026 Smart Guide • Powered by Google Gemini AI & FastAPI
        </div>
      </footer>

      {showOnboarding && <OnboardingModal onComplete={() => setShowOnboarding(false)} />}
      <DevModePanel />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}