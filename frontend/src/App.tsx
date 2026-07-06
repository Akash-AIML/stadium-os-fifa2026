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

function AppContent() {
  const { state, setCurrentZone, toggleDevMode, setSimulationTime } = useApp();
  const { loadData } = useCrowdData();
  const { setMatchTime } = useSimulation();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState<'map' | 'chat' | 'dashboard'>('map');

  useEffect(() => {
    const saved = localStorage.getItem('fifa_onboarding_complete');
    if (saved) setShowOnboarding(false);
  }, []);

  const handleZoneClick = (zoneId: string) => {
    setCurrentZone(zoneId);
    loadData();
  };

  const zones = state.crowd_data.map(c => ({
    id: c.zone_id,
    label: c.zone_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    type: 'generic',
    location: [0, 0] as [number, number],
    status: c.status,
  }));

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">FIFA 2026 Smart Guide</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {state.user.name}
              </span>
              <button
                onClick={toggleDevMode}
                className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                aria-label="Toggle developer mode"
              >
                Dev Mode
              </button>
            </div>
          </div>

          {/* Simulation Controls */}
          <div className="mt-4 flex gap-2">
            <button onClick={() => setMatchTime(15)} className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200">
              Pre-Match
            </button>
            <button onClick={() => setMatchTime(50)} className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200">
              Halftime
            </button>
            <button onClick={() => setMatchTime(95)} className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200">
              Full-Time
            </button>
            <span className="text-sm text-gray-600 self-center">
              Match Time: {state.simulation_time}min
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Tabs */}
      <nav className="md:hidden bg-white border-b" role="tablist">
        <div className="flex">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-3 text-center ${activeTab === 'map' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            role="tab"
            aria-selected={activeTab === 'map'}
          >
            Map
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-center ${activeTab === 'chat' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            role="tab"
            aria-selected={activeTab === 'chat'}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 text-center ${activeTab === 'dashboard' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            role="tab"
            aria-selected={activeTab === 'dashboard'}
          >
            Dashboard
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Map */}
          <div className={`${activeTab === 'map' ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Stadium Map</h2>
              <StadiumMap
                zones={zones}
                selectedZoneId={state.current_zone_id}
                onZoneClick={handleZoneClick}
              />
            </div>
          </div>

          {/* Chat */}
          <div className={`${activeTab === 'chat' ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white rounded-lg shadow p-4 h-[600px]">
              <h2 className="text-lg font-semibold mb-4">AI Assistant</h2>
              <ChatWindow currentZoneId={state.current_zone_id} />
            </div>
          </div>

          {/* Dashboard & Recommendations */}
          <div className={`${activeTab === 'dashboard' ? 'block' : 'hidden md:block'} md:col-span-2`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Live Dashboard</h2>
                <Dashboard alerts={state.alerts} crowdData={state.crowd_data} />
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Recommendations</h2>
                <RecommendationsList recommendations={state.recommendations} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-600">
          FIFA 2026 Smart Guide • Built with React + FastAPI + Gemini AI
        </div>
      </footer>

      {showOnboarding && <OnboardingModal />}
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