import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map as MapIcon, MessageSquare, BarChart2 } from 'lucide-react';
import { AppProvider, useApp } from './shared/context/AppContext';
import { STADIUMS_CONFIG } from './shared/utils/stadiums';
import { useRouteCache } from './shared/hooks/useRouteCache';
import { useAiMapSync } from './shared/hooks/useAiMapSync';
import { TopNavbar } from './shared/components/TopNavbar';
import { ToastSystem } from './shared/components/ToastSystem';
import { OnboardingModal } from './shared/components/OnboardingModal';
import { DevModePanel } from './shared/components/DevModePanel';
import { HeroScreen } from './features/app/HeroScreen';
import { MobileChatDrawer } from './features/app/MobileChatDrawer';
import { MainWorkspace } from './features/app/MainWorkspace';
import type { ZoneStatus } from './shared/types';

type ActiveTab       = 'map' | 'chat' | 'dashboard';
type SelectedMetric  = 'density' | 'queue' | 'flow';
type ZoneTrend       = 'up' | 'down' | 'stable';

/** Determine crowd trend from density value without nesting ternaries. */
function getDensityTrend(density: number): ZoneTrend {
  if (density > 0.75) return 'up';
  if (density < 0.25) return 'down';
  return 'stable';
}

function AppContent() {
  const { state, setCurrentZone } = useApp();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showHero, setShowHero]             = useState(true);
  const [activeTab, setActiveTab]           = useState<ActiveTab>('map');
  const [showMobileChatSheet, setShowMobileChatSheet] = useState(false);
  const [showChat, setShowChat]             = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<SelectedMetric>('density');

  const activeStadium  = state.user.stadium_id || 'metlife';
  const currentStadium = STADIUMS_CONFIG[activeStadium] || STADIUMS_CONFIG.metlife;

  // ── Persistence ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (localStorage.getItem('fifa_onboarding_complete')) setShowOnboarding(false);
    if (localStorage.getItem('fifa_smart_guide_entered'))  setShowHero(false);
  }, []);

  const handleEnterGuide = () => {
    setShowHero(false);
    localStorage.setItem('fifa_smart_guide_entered', 'true');
  };

  // ── Route cache + zone click ───────────────────────────────────────────────
  const { currentRoute, setCurrentRoute, handleZoneClick } = useRouteCache({
    stadiumId:         state.user.stadium_id,
    accessibilityMode: state.user.accessibility_mode,
    currentZoneId:     state.current_zone_id,
    setCurrentZone,
  });

  // ── AI → Map synchronisation ───────────────────────────────────────────────
  useAiMapSync({
    chatHistory:       state.chat_history,
    stadiumId:         state.user.stadium_id,
    accessibilityMode: state.user.accessibility_mode,
    currentZoneId:     state.current_zone_id,
    setCurrentRoute,
    setCurrentZone,
  });

  // ── Derive zone list with live crowd data ──────────────────────────────────
  const zones = Object.entries(currentStadium.zones).map(([zoneId, meta]) => {
    const live      = state.crowd_data.find(c => c.zone_id === zoneId);
    const density   = live?.density   ?? 0.3;
    const queueTime = live?.queue_time ?? 5;
    const status    = (live?.status ?? 'low') as ZoneStatus;
    const history     = [density * 0.9, density * 0.95, density * 1.05, density];
    const waitHistory = [queueTime - 2, queueTime - 1, queueTime + 1, queueTime];

    const trend = getDensityTrend(density);

    return {
      id: zoneId, label: meta.label, type: meta.type, location: meta.location,
      status, density, queueTime, trend, history, waitHistory,
      recommendations: [] as string[],
    };
  });

  return (
    <AnimatePresence mode="wait">
      {showHero ? (
        <HeroScreen key="hero-screen" onEnter={handleEnterGuide} />
      ) : (
        <motion.div
          key="main-dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="min-h-screen flex flex-col"
          style={{ color: 'hsl(var(--fg))' }}
        >
          <TopNavbar showChat={showChat} onToggleChat={() => setShowChat(s => !s)} onNavigate={handleZoneClick} />

          {/* Mobile tab bar */}
          <div
            className="md:hidden sticky top-[60px] z-30 border-b"
            style={{ background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)', borderColor: 'var(--glass-border)' }}
            role="tablist"
          >
            <div className="flex">
              {([
                { id: 'map',       label: 'Map',       Icon: MapIcon       },
                { id: 'chat',      label: 'Assistant', Icon: MessageSquare },
                { id: 'dashboard', label: 'Stats',     Icon: BarChart2     },
              ] as const).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-all border-b-2"
                  style={{
                    borderColor: activeTab === id ? 'hsl(var(--primary))' : 'transparent',
                    color:       activeTab === id ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                  }}
                  role="tab"
                  aria-selected={activeTab === id}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Main workspace */}
          <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 py-5 sm:px-6 lg:px-8">
            {state.crowd_data.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                <div className="skeleton h-12 w-full md:col-span-5" />
                <div className="skeleton-card h-[calc(100vh-200px)] md:col-span-3" />
                <div className="skeleton-card h-[calc(100vh-200px)] md:col-span-2" />
              </div>
            ) : (
              <MainWorkspace
                zones={zones}
                selectedZoneId={state.current_zone_id}
                onZoneClick={handleZoneClick}
                currentRoute={currentRoute}
                showChat={showChat}
                currentZoneId={state.current_zone_id}
                alerts={state.alerts}
                crowdData={state.crowd_data}
                recommendations={state.recommendations}
                selectedMetric={selectedMetric}
                onMetricChange={setSelectedMetric}
                activeTab={activeTab}
                stadiumId={state.user.stadium_id as 'metlife' | 'sofi' | 'azteca' | undefined}
                accessibleMode={state.user.accessibility_mode || false}
              />
            )}
          </main>

          <footer
            className="py-4 mt-8 text-center text-[10px] border-t"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-fg))' }}
          >
            FIFA 2026 Smart Guide • Powered by Google Gemini AI &amp; FastAPI
          </footer>

          <MobileChatDrawer
            show={showMobileChatSheet}
            onOpen={() => setShowMobileChatSheet(true)}
            onClose={() => setShowMobileChatSheet(false)}
            currentZoneId={state.current_zone_id}
            hideFab={activeTab === 'chat'}
          />

          <ToastSystem alerts={state.alerts} />
          {showOnboarding && <OnboardingModal onComplete={() => setShowOnboarding(false)} />}
          <DevModePanel />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}