import { Map as MapIcon, BarChart2, Zap, Cloud, Users, Clock, Shield } from 'lucide-react';
import { FloatingWidget } from '../../shared/components/PremiumCards';
import { StadiumMap } from '../navigation/StadiumMap';
import { ChatWindow } from '../chat/ChatWindow';
import { Dashboard } from '../crowd/Dashboard';
import { RecommendationsList } from '../crowd/RecommendationCard';
import { TimelineSlider } from '../../shared/components/TimelineSlider';
import type { CrowdZone, Route, Alert, CrowdSnapshot, Recommendation } from '../../shared/types';

type ActiveTab = 'map' | 'chat' | 'dashboard';
type SelectedMetric = 'density' | 'queue' | 'flow';

interface MainWorkspaceProps {
  zones: CrowdZone[];
  selectedZoneId: string | null | undefined;
  onZoneClick: (zoneId: string) => void;
  currentRoute: Route | null;
  showChat: boolean;
  currentZoneId: string | null | undefined;
  alerts: Alert[];
  crowdData: CrowdSnapshot[];
  recommendations: Recommendation[];
  selectedMetric: SelectedMetric;
  onMetricChange: (m: SelectedMetric) => void;
  activeTab: ActiveTab;
  stadiumId: 'metlife' | 'sofi' | 'azteca' | undefined;
  accessibleMode: boolean;
}

/** The main 5-column grid: map + timeline + dashboard + chat panel. */
export function MainWorkspace({
  zones,
  selectedZoneId,
  onZoneClick,
  currentRoute,
  showChat,
  currentZoneId,
  alerts,
  crowdData,
  recommendations,
  selectedMetric,
  onMetricChange,
  activeTab,
  stadiumId,
  accessibleMode,
}: Readonly<MainWorkspaceProps>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-5 items-start">

      {/* ── Left: Map + Timeline + Dashboard + Recs ── */}
      <div className={`${
        activeTab === 'map' || activeTab === 'dashboard' ? 'block' : 'hidden md:block'
      } ${showChat ? 'md:col-span-3' : 'md:col-span-5'} space-y-4`}>

        {/* Stadium Map */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapIcon className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
              <h2 className="text-sm font-bold" style={{ color: 'hsl(var(--fg))' }}>Stadium Blueprint</h2>
              {selectedZoneId && (
                <span className="badge-primary text-[10px]">{selectedZoneId.replace(/_/g, ' ')}</span>
              )}
            </div>
            {selectedZoneId && (
              <button
                className="btn-ghost text-xs"
                onClick={() => onZoneClick(selectedZoneId!)}
              >
                Reset Route
              </button>
            )}
          </div>
          <div className="h-[calc(100vh-260px)] min-h-[480px]">
            <StadiumMap
              zones={zones}
              selectedZoneId={selectedZoneId ?? null}
              onZoneClick={onZoneClick}
              activeRoute={currentRoute}
              showHeatmap={true}
              stadiumId={stadiumId}
              accessibleMode={accessibleMode}
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
              alerts={alerts}
              crowdData={crowdData}
              selectedMetric={selectedMetric}
              onMetricChange={onMetricChange}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
              <h2 className="text-sm font-bold" style={{ color: 'hsl(var(--fg))' }}>Smart Recommendations</h2>
            </div>
            <RecommendationsList recommendations={recommendations} onNavigate={onZoneClick} />
          </div>
        </div>

        {/* Floating Widgets Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <FloatingWidget icon={Cloud}  label="Weather"    value="24°C"   trend="stable" color="cyan"    />
          <FloatingWidget icon={Users}  label="Attendance" value="78,432" trend="up"     color="emerald" />
          <FloatingWidget icon={Clock}  label="Match Time" value="67'"    trend="up"     color="violet"  />
          <FloatingWidget icon={Shield} label="Emergency"  value="Clear"  trend="stable" color="amber"   />
        </div>
      </div>

      {/* ── Right: Toggleable Chat ── */}
      {showChat && (
        <div
          className={`${activeTab === 'chat' ? 'block' : 'hidden md:block'} md:col-span-2 md:sticky`}
          style={{ top: 'calc(60px + 1.25rem)', height: 'calc(100vh - 80px)' }}
        >
          <ChatWindow currentZoneId={currentZoneId} />
        </div>
      )}
    </div>
  );
}

// Re-export types used by parent
export type { ActiveTab, SelectedMetric };
