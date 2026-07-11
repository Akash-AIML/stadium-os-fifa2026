import React from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Utensils, DoorOpen, Users, Activity, Trophy } from 'lucide-react';
import { STADIUMS_CONFIG } from '../utils/stadiums';

export const QUICK_ACTIONS = [
  { label: 'Navigate to Seat', icon: MapPin,   action: 'nav_seat',  color: 'text-cyan-400'    },
  { label: 'Find Food Court',  icon: Utensils, action: 'food',      color: 'text-amber-400'   },
  { label: 'Nearest Exit',     icon: DoorOpen, action: 'exit',      color: 'text-emerald-400' },
  { label: 'Restroom Locator', icon: Users,    action: 'restroom',  color: 'text-violet-400'  },
  { label: 'Crowd Heatmap',    icon: Activity, action: 'heatmap',   color: 'text-orange-400'  },
  { label: 'Match Status',     icon: Trophy,   action: 'match',     color: 'text-yellow-400'  },
];

const ZONE_TYPE_ICONS: Record<string, typeof MapPin> = {
  entrance: MapPin, exit: DoorOpen, seating: Users, food: Utensils, wc: Users,
  medical: Activity, generic: MapPin,
};

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  filteredActions: typeof QUICK_ACTIONS;
  activeStadiumZones: { id: string; label: string; type: string }[];
  onNavigate: (zoneId: string) => void;
  currentStadium: (typeof STADIUMS_CONFIG)[keyof typeof STADIUMS_CONFIG];
  isMac: boolean;
}

export const CommandPalette = React.memo(({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  inputRef,
  filteredActions,
  activeStadiumZones,
  onNavigate,
  currentStadium,
  isMac,
}: Readonly<CommandPaletteProps>) => {
  if (!isOpen) return null;

  const handleActionClick = (action: string) => {
    if (action === 'food') {
      const z = Object.keys(currentStadium.zones).find(id => id.includes('food'));
      if (z) onNavigate(z);
    } else if (action === 'exit') {
      const z = Object.keys(currentStadium.zones).find(id => id.includes('exit') || id.includes('gate'));
      if (z) onNavigate(z);
    } else if (action === 'restroom') {
      const z = Object.keys(currentStadium.zones).find(id => id.includes('wc'));
      if (z) onNavigate(z);
    } else if (action === 'nav_seat') {
      const z = Object.keys(currentStadium.zones).find(id => id.includes('section'));
      if (z) onNavigate(z);
    }
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'hsl(var(--overlay) / 0.7)', backdropFilter: 'blur(4px)' }}
      />

      {/* Panel */}
      <motion.div
        className="relative w-full max-w-2xl mx-4 glass-panel-strong overflow-hidden"
        style={{ borderRadius: '20px' }}
        initial={{ opacity: 0, scale: 0.96, y: -16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -16 }}
        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--glass-border)' }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--muted))' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands, zones, exits, food…"
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: 'hsl(var(--fg))' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
          <kbd
            className="px-2 py-1 rounded text-[10px] border"
            style={{
              background: 'hsl(var(--elevated))',
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--muted-fg))',
            }}
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="p-3 space-y-4 max-h-[420px] overflow-y-auto scrollbar-none">
          {filteredActions.length > 0 && (
            <div>
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-fg))' }}>
                Quick Actions
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {filteredActions.map(({ label, icon: ItemIcon, action, color }) => (
                  <motion.button
                    key={action}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm"
                    style={{
                      background: 'hsl(var(--elevated))',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--fg))',
                    }}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleActionClick(action)}
                  >
                    <ItemIcon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                    <span className="font-medium">{label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {activeStadiumZones.length > 0 && (
            <div>
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-fg))' }}>
                Stadium Zones
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {activeStadiumZones.map(zone => {
                  const ZoneIcon = ZONE_TYPE_ICONS[zone.type] ?? MapPin;
                  return (
                    <motion.button
                      key={zone.id}
                      className="flex flex-col gap-1 p-2.5 rounded-xl text-left transition-all"
                      style={{ background: 'hsl(var(--elevated))', border: '1px solid hsl(var(--border))' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { onNavigate(zone.id); onClose(); }}
                    >
                      <ZoneIcon className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
                      <span className="text-xs font-semibold" style={{ color: 'hsl(var(--fg))' }}>{zone.label}</span>
                      <span className="text-[10px] uppercase font-medium" style={{ color: 'hsl(var(--muted-fg))' }}>{zone.type}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredActions.length === 0 && activeStadiumZones.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--elevated))' }}>
                <Search className="w-5 h-5" style={{ color: 'hsl(var(--muted-fg))' }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted))' }}>
                  No results for "{searchQuery}"
                </p>
                <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-fg))' }}>
                  Try searching for zones, facilities, or exits
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-2 border-t flex items-center gap-4"
          style={{ borderColor: 'var(--glass-border)', background: 'hsl(var(--elevated) / 0.5)' }}
        >
          {[['↵', 'Select'], ['↑↓', 'Navigate'], ['Esc', 'Close']].map(([key, action]) => (
            <div key={action} className="flex items-center gap-1.5">
              <kbd
                className="px-1.5 py-0.5 rounded text-[10px] border font-mono"
                style={{
                  background: 'hsl(var(--floating))',
                  borderColor: 'hsl(var(--border-strong))',
                  color: 'hsl(var(--muted-fg))',
                }}
              >
                {key}
              </kbd>
              <span className="text-[10px]" style={{ color: 'hsl(var(--muted-fg))' }}>{action}</span>
            </div>
          ))}
          <div className="ml-auto text-[10px]" style={{ color: 'hsl(var(--muted-fg))' }}>
            {isMac ? '⌘K' : 'Ctrl+K'} to open
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

CommandPalette.displayName = 'CommandPalette';
