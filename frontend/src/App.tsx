import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Map as MapIcon, MessageSquare, BarChart2,
  Navigation, Layers, Zap, ArrowRight, Sparkles,
  Cloud, Users, Clock, Shield
} from 'lucide-react';
import { FloatingWidget } from './shared/components/PremiumCards';
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
import { STADIUMS_CONFIG } from './shared/utils/stadiums';
import { fetchRoute } from './services/api';

// Premium Core Components
import { TopNavbar } from './shared/components/TopNavbar';
import { TimelineSlider } from './shared/components/TimelineSlider';
import { StadiumHero3D } from './shared/components/StadiumHero3D';
import { ToastSystem } from './shared/components/ToastSystem';

function AppContent() {
  const { state, setCurrentZone, toggleDevMode, setSimulationTime } = useApp();
  const { } = useCrowdData();
  const { setMatchTime } = useSimulation();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showHero, setShowHero] = useState(true);
  const [activeTab, setActiveTab] = useState<'map' | 'chat' | 'dashboard'>('map');
  const [currentRoute, setCurrentRoute] = useState<any | null>(null);
  const [showMobileChatSheet, setShowMobileChatSheet] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'density' | 'queue' | 'flow'>('density');

  useEffect(() => {
    const saved = localStorage.getItem('fifa_onboarding_complete');
    if (saved) setShowOnboarding(false);
    
    const entered = localStorage.getItem('fifa_smart_guide_entered');
    if (entered) setShowHero(false);
  }, []);

  // AI ↔ Map Synchronization Effect (debounced to prevent 429 flooding)
  const routeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (state.chat_history.length > 0) {
      const lastMsg = state.chat_history[state.chat_history.length - 1];
      if (lastMsg.role === 'model') {
        const activeStadium = state.user.stadium_id || 'metlife';
        const config = STADIUMS_CONFIG[activeStadium] || STADIUMS_CONFIG.metlife;

        // 1. If response specifies a routing path, calculate and draw it (debounced 400ms)
        if (lastMsg.route_id) {
          if (routeDebounceRef.current) clearTimeout(routeDebounceRef.current);
          routeDebounceRef.current = setTimeout(() => {
            const routeId = lastMsg.route_id!;
            const zoneIds = Object.keys(config.zones);
            const found = zoneIds.filter(id => routeId.includes(id));
            if (found.length >= 2) {
              const sorted = found.sort((a, b) => routeId.indexOf(a) - routeId.indexOf(b));
              const fromZone = sorted[0];
              const toZone = sorted[1];
              fetchRoute(fromZone, toZone, activeStadium, state.user.accessibility_mode)
                .then(routeData => {
                  setCurrentRoute(routeData);
                  setCurrentZone(toZone);
                })
                .catch(() => {}); // Silently ignore 429/offline errors
            }
          }, 400);
        } else {
          // 2. Highlight/Pulse the zone mentioned by name in response content
          //    AND draw a route line from current zone → mentioned zone if possible
          const contentLower = lastMsg.content.toLowerCase();
          const mentionedZone = Object.keys(config.zones).find(id => {
            const label = config.zones[id].label.toLowerCase();
            return contentLower.includes(label) || contentLower.includes(id.replace(/_/g, ' '));
          });
          if (mentionedZone) {
            setCurrentZone(mentionedZone);
            // Draw route from current position to the mentioned zone
            if (state.current_zone_id && state.current_zone_id !== mentionedZone) {
              if (routeDebounceRef.current) clearTimeout(routeDebounceRef.current);
              routeDebounceRef.current = setTimeout(() => {
                fetchRoute(state.current_zone_id!, mentionedZone, activeStadium, state.user.accessibility_mode)
                  .then(routeData => setCurrentRoute(routeData))
                  .catch(() => {});
              }, 400);
            }
          }
        }
      }
    }
  }, [state.chat_history, state.user.stadium_id, state.user.accessibility_mode, setCurrentZone]);

  // Clear route cache whenever accessibility mode changes so stale routes aren't served
  useEffect(() => {
    routeCacheRef.current.clear();
  }, [state.user.accessibility_mode]);

  const routeCacheRef = useRef<Map<string, any>>(new Map());

  const handleZoneClick = async (zoneId: string) => {
    if (state.current_zone_id && state.current_zone_id !== zoneId) {
      const cacheKey = `${state.current_zone_id}_${zoneId}_${state.user.stadium_id}_${state.user.accessibility_mode}`;
      const cached = routeCacheRef.current.get(cacheKey);
      if (cached) {
        setCurrentRoute(cached);
      } else {
        try {
          const routeData = await fetchRoute(
            state.current_zone_id,
            zoneId,
            state.user.stadium_id,
            state.user.accessibility_mode
          );
          routeCacheRef.current.set(cacheKey, routeData);
          setCurrentRoute(routeData);
        } catch (error) {
          console.error('Failed to fetch route:', error);
          setCurrentRoute(null);
        }
      }
    } else {
      setCurrentRoute(null);
    }
    setCurrentZone(zoneId);
    // NOTE: loadData() removed — crowd data streams in via WebSocket automatically
  };

  const handleEnterGuide = () => {
    setShowHero(false);
    localStorage.setItem('fifa_smart_guide_entered', 'true');
  };

  // Map raw snapshots into CrowdZone format
  // Seed from STADIUMS_CONFIG so the map is always interactive even before WebSocket data arrives.
  // Live crowd data (density/status) overlays on top when the WebSocket connects.
  const activeStadium = state.user.stadium_id || 'metlife';
  const currentStadium = STADIUMS_CONFIG[activeStadium] || STADIUMS_CONFIG.metlife;

  const zones = Object.entries(currentStadium.zones).map(([zoneId, meta]) => {
    const live = state.crowd_data.find(c => c.zone_id === zoneId);
    const density    = live?.density    ?? 0.3;
    const queueTime  = live?.queue_time ?? 5;
    const status     = (live?.status ?? 'low') as import('./shared/types').ZoneStatus;
    const history    = [density * 0.9, density * 0.95, density * 1.05, density];
    const waitHistory = [queueTime - 2, queueTime - 1, queueTime + 1, queueTime];
    const trend      = density > 0.75 ? 'up' : density < 0.25 ? 'down' : 'stable';

    return {
      id: zoneId,
      label: meta.label,
      type: meta.type,
      location: meta.location,
      status,
      density,
      queueTime,
      trend: trend as 'up' | 'down' | 'stable',
      history,
      waitHistory,
      recommendations: [] as string[],
    };
  });

  const HERO_FEATURES = [
    { Icon: Navigation, title: 'Smart Nav',      desc: 'Congestion-aware pathfinding'    },
    { Icon: Layers,     title: 'Crowd Heatmap',  desc: 'Live stadium zone density'       },
    { Icon: Zap,        title: 'AI Assistant',   desc: 'Speech-supported Fan Copilot'   },
    { Icon: BarChart2,  title: 'Live Timeline',  desc: 'Match clock time simulation'    },
  ];

  return (
    <AnimatePresence mode="wait">
      {showHero ? (
        <motion.div
          key="hero-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5 }}
          className="relative min-h-screen flex flex-col overflow-hidden"
          style={{ background: 'hsl(var(--bg))' }}
        >
          {/* 3D background */}
          <div className="absolute inset-0 z-0">
            <StadiumHero3D />
          </div>

          {/* Top bar */}
          <header className="relative z-10 w-full px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06b6d4, #a855f7)' }}>
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold tracking-widest uppercase" style={{ color: 'hsl(var(--fg))' }}>FIFA 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full text-xs font-semibold border" style={{ background: 'rgba(6,182,212,0.08)', borderColor: 'rgba(6,182,212,0.2)', color: '#06b6d4' }}>
                Smart Guide v2.0
              </div>
              {/* Skip button for returning users */}
              <motion.button
                onClick={handleEnterGuide}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all"
                style={{ background: 'hsl(var(--elevated))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted))' }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                aria-label="Skip intro and enter dashboard"
              >
                Skip <ArrowRight className="w-3 h-3" />
              </motion.button>
            </div>
          </header>

          {/* Central glass overlay */}
          <main className="relative z-10 max-w-lg mx-auto w-full px-4 flex flex-col items-center justify-center flex-1">
            <motion.div
              initial={{ scale: 0.96, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6, type: 'spring', stiffness: 200, damping: 25 }}
              className="glass-panel-strong p-8 text-center w-full"
              style={{ borderRadius: 24 }}
            >
              {/* Logo badge */}
              <motion.div
                className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(168,85,247,0.3))' }}
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Trophy className="w-10 h-10" style={{ color: '#06b6d4' }} />
              </motion.div>

              <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'hsl(var(--fg))' }}>
                FIFA 2026{' '}
                <span className="neon-text-cyan font-light">Smart Guide</span>
              </h1>
              <p className="text-sm leading-relaxed mb-8 max-w-sm mx-auto" style={{ color: 'hsl(var(--muted))' }}>
                Real-time stadium intelligence — navigation, crowd density, AI assistant, and match insights.
              </p>

              {/* Feature grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-8 text-left">
                {HERO_FEATURES.map(({ Icon, title, desc }, i) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className="p-3 rounded-xl flex gap-2.5 items-start"
                    style={{ background: 'hsl(var(--elevated))', border: '1px solid hsl(var(--border))' }}
                  >
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#06b6d4' }} />
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'hsl(var(--fg))' }}>{title}</p>
                      <p className="text-[10px]" style={{ color: 'hsl(var(--muted-fg))' }}>{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <motion.button
                onClick={handleEnterGuide}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center gap-2 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #0891b2, #3b82f6)',
                  boxShadow: '0 8px 32px rgba(6,182,212,0.3)',
                }}
              >
                <Sparkles className="w-4 h-4" />
                Enter Stadium Guide
              </motion.button>
            </motion.div>
          </main>

          <footer className="relative z-10 py-5 text-center text-[10px]" style={{ color: 'hsl(var(--muted-fg))' }}>
            Powered by Google Gemini AI & FastAPI • FIFA 2026
          </footer>
        </motion.div>
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

          {/* ── Mobile tab bar ───────────────────────────────── */}
          <nav
            className="md:hidden sticky top-[60px] z-30 border-b"
            style={{
              background: 'var(--glass-bg-strong)',
              backdropFilter: 'blur(20px)',
              borderColor: 'var(--glass-border)',
            }}
            role="tablist"
          >
            <div className="flex">
              {[
                { id: 'map',       label: 'Map',       Icon: MapIcon       },
                { id: 'chat',      label: 'Assistant', Icon: MessageSquare },
                { id: 'dashboard', label: 'Stats',     Icon: BarChart2     },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
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
          </nav>

          {/* ── Main workspace ───────────────────────────────── */}
          <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 py-5 sm:px-6 lg:px-8">
            {state.crowd_data.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                <div className="skeleton h-12 w-full md:col-span-5" />
                <div className="skeleton-card h-[calc(100vh-200px)] md:col-span-3" />
                <div className="skeleton-card h-[calc(100vh-200px)] md:col-span-2" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-5 items-start">

                {/* ── Left 60% or 100%: Map + Timeline + Dashboard/Recs ── */}
                <div className={`${
                  activeTab === 'map' || activeTab === 'dashboard' ? 'block' : 'hidden md:block'
                } ${showChat ? 'md:col-span-3' : 'md:col-span-5'} space-y-4`}>

                  {/* Stadium Map hero */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapIcon className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                        <h2 className="text-sm font-bold" style={{ color: 'hsl(var(--fg))' }}>Stadium Blueprint</h2>
                        {state.current_zone_id && (
                          <span className="badge-primary text-[10px]">{state.current_zone_id.replace(/_/g, ' ')}</span>
                        )}
                      </div>
                      {state.current_zone_id && (
                        <motion.button
                          onClick={() => handleZoneClick(state.current_zone_id!)}
                          className="btn-ghost text-xs"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          Reset Route
                        </motion.button>
                      )}
                    </div>
                    <div className="h-[calc(100vh-260px)] min-h-[480px]">
                      <StadiumMap
                        zones={zones}
                        selectedZoneId={state.current_zone_id}
                        onZoneClick={handleZoneClick}
                        activeRoute={currentRoute}
                        showHeatmap={true}
                        stadiumId={state.user.stadium_id}
                      />
                    </div>
                  </div>

                  {/* Timeline */}
                  <TimelineSlider />

                  {/* Dashboard + Recommendations */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart2 className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                        <h2 className="text-sm font-bold" style={{ color: 'hsl(var(--fg))' }}>Stadium Intelligence</h2>
                      </div>
                      <Dashboard
                        alerts={state.alerts}
                        crowdData={state.crowd_data}
                        selectedMetric={selectedMetric}
                        onMetricChange={setSelectedMetric}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                        <h2 className="text-sm font-bold" style={{ color: 'hsl(var(--fg))' }}>Smart Recommendations</h2>
                      </div>
                      <RecommendationsList recommendations={state.recommendations} onNavigate={handleZoneClick} />
                    </div>
                  </div>

                  {/* Floating Widgets Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                    <FloatingWidget icon={Cloud}   label="Weather"    value="24°C"   trend="stable" color="cyan"    />
                    <FloatingWidget icon={Users}   label="Attendance" value="78,432" trend="up"     color="emerald" />
                    <FloatingWidget icon={Clock}   label="Match Time" value="67'"    trend="up"     color="violet"  />
                    <FloatingWidget icon={Shield}  label="Emergency"  value="Clear"  trend="stable" color="amber"   />
                  </div>
                </div>

                {/* ── Right 40%: Toggleable Chat ────────────── */}
                {showChat && (
                  <div
                    className={`${activeTab === 'chat' ? 'block' : 'hidden md:block'} md:col-span-2 md:sticky`}
                    style={{ top: 'calc(60px + 1.25rem)', height: 'calc(100vh - 80px)' }}
                  >
                    <ChatWindow currentZoneId={state.current_zone_id} />
                  </div>
                )}

              </div>
            )}
          </main>

          {/* Footer */}
          <footer
            className="py-4 mt-8 text-center text-[10px] border-t"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-fg))' }}
          >
            FIFA 2026 Smart Guide • Powered by Google Gemini AI & FastAPI
          </footer>

          {/* ── Mobile floating AI FAB ─────────────────────── */}
          <div className="md:hidden">
            <AnimatePresence>
              {activeTab !== 'chat' && (
                <motion.button
                  key="ai-fab"
                  className="fab"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={() => setShowMobileChatSheet(true)}
                  aria-label="Open AI assistant"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.93 }}
                >
                  <MessageSquare className="w-6 h-6" />
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showMobileChatSheet && (
                <motion.div
                  key="mobile-drawer"
                  className="bottom-sheet fixed bottom-0 left-0 right-0 h-[82vh] z-50 flex flex-col overflow-hidden p-4"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                >
                  <div
                    className="w-10 h-1 rounded-full mx-auto mb-4 cursor-pointer"
                    style={{ background: 'hsl(var(--border-strong))' }}
                    onClick={() => setShowMobileChatSheet(false)}
                  />
                  <div className="flex-1 min-h-0">
                    <ChatWindow currentZoneId={state.current_zone_id} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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