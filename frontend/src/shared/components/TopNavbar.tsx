import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Search, Globe, Sun, Moon, Monitor, ChevronDown,
  Check, Settings, Zap, Timer, Flag, MapPin, Utensils,
  DoorOpen, Users, Activity, Cpu, Bot
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { STADIUM_ZONES_METADATA } from '../utils/zones';

const QUICK_ACTIONS = [
  { label: 'Navigate to Seat', icon: MapPin,     action: 'nav_seat',  color: 'text-cyan-400'   },
  { label: 'Find Food Court',  icon: Utensils,   action: 'food',      color: 'text-amber-400'  },
  { label: 'Nearest Exit',     icon: DoorOpen,   action: 'exit',      color: 'text-emerald-400'},
  { label: 'Restroom Locator', icon: Users,      action: 'restroom',  color: 'text-violet-400' },
  { label: 'Crowd Heatmap',    icon: Activity,   action: 'heatmap',   color: 'text-orange-400' },
  { label: 'Match Status',     icon: Trophy,     action: 'match',     color: 'text-yellow-400' },
];

const THEME_OPTIONS = [
  { value: 'dark',  label: 'Dark',  Icon: Moon,    desc: 'Always dark mode'  },
  { value: 'light', label: 'Light', Icon: Sun,     desc: 'Always light mode' },
  { value: 'auto',  label: 'Auto',  Icon: Monitor, desc: 'Follow system'     },
] as const;

const ZONE_TYPE_ICONS: Record<string, typeof MapPin> = {
  entrance: MapPin, exit: DoorOpen, seating: Users, food: Utensils, wc: Users,
  medical: Activity, generic: MapPin,
};

interface TopNavbarProps {
  showChat: boolean;
  onToggleChat: () => void;
}

export function TopNavbar({ showChat, onToggleChat }: TopNavbarProps) {
  const { state, toggleDevMode, setSimulationTime, setCurrentZone } = useApp();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { currentLanguage, changeLanguage, languages } = useLanguage();
  const [showLanguage, setShowLanguage] = useState(false);
  const [showTheme, setShowTheme]       = useState(false);
  const [showCommand, setShowCommand]   = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const langRef  = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Close dropdowns on outside click ───────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current  && !langRef.current.contains(e.target as Node))  setShowLanguage(false);
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setShowTheme(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Global keyboard shortcuts ───────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setShowCommand(prev => !prev);
    }
    if (e.key === 'Escape') {
      setShowCommand(false);
      setShowLanguage(false);
      setShowTheme(false);
      setSearchQuery('');
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Auto-focus search input when palette opens
  useEffect(() => {
    if (showCommand) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [showCommand]);

  // ── Filter results ──────────────────────────────────────────
  const filteredActions = QUICK_ACTIONS.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredZones = Object.entries(STADIUM_ZONES_METADATA)
    .map(([id, meta]) => ({ id, label: meta.label, type: meta.type }))
    .filter(z => z.label.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 9);

  // ── Match phase helpers ─────────────────────────────────────
  const t = state.simulation_time;
  const phases = [
    { label: 'Pre-Match', Icon: Zap,   time: 15, active: t <= 30,           color: 'emerald' },
    { label: 'Halftime',  Icon: Timer, time: 50, active: t > 30 && t <= 75, color: 'amber'   },
    { label: 'Full-Time', Icon: Flag,  time: 95, active: t > 75,            color: 'emerald' },
  ];

  const ThemeIcon = resolvedTheme === 'dark' ? Moon : resolvedTheme === 'light' ? Sun : Monitor;
  const isMac = typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');

  return (
    <>
      {/* ── Header ──────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderColor: 'var(--glass-border)',
        }}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-[60px] items-center justify-between gap-4">

            {/* ── Left: Logo ──────────────────────────────── */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <motion.div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-elevated flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #a855f7 100%)' }}
                animate={{ rotate: [0, 3, -3, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden="true"
              >
                <Trophy className="w-5 h-5 text-white" strokeWidth={2} />
              </motion.div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold tracking-tight leading-none" style={{ color: 'hsl(var(--fg))' }}>
                  FIFA 2026{' '}
                  <span className="neon-text-cyan font-light">Smart Guide</span>
                </h1>
                <p className="text-[10px] mt-0.5 font-medium uppercase tracking-widest" style={{ color: 'hsl(var(--muted-fg))' }}>
                  Stadium Intelligence
                </p>
              </div>
            </div>

            {/* ── Center: Match Phases ─────────────────────── */}
            <div className="hidden md:flex items-center gap-1.5">
              {phases.map(({ label, Icon, time, active, color }) => (
                <motion.button
                  key={label}
                  onClick={() => setSimulationTime(time)}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    active
                      ? color === 'emerald'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'border-transparent text-[hsl(var(--muted))] hover:text-[hsl(var(--fg))] hover:bg-[hsl(var(--elevated))]',
                  ].join(' ')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  aria-pressed={active}
                >
                  <Icon className="w-3 h-3" strokeWidth={2.5} />
                  {label}
                </motion.button>
              ))}

              {/* Live clock badge */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border"
                style={{
                  background: 'hsl(var(--elevated))',
                  borderColor: 'hsl(var(--border))',
                  color: '#06b6d4',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping flex-shrink-0" />
                {t}'
              </div>
            </div>

            {/* ── Right: Controls ──────────────────────────── */}
            <div className="flex items-center gap-1.5 flex-shrink-0">

              {/* Search pill */}
              <motion.button
                onClick={() => setShowCommand(p => !p)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-all"
                style={{
                  background: 'hsl(var(--elevated))',
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--muted))',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                aria-label="Open command palette"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
                <kbd
                  className="px-1.5 py-0.5 rounded text-[10px] border"
                  style={{
                    background: 'hsl(var(--floating))',
                    borderColor: 'hsl(var(--border-strong))',
                  }}
                >
                  {isMac ? '⌘K' : 'Ctrl+K'}
                </kbd>
              </motion.button>

              {/* AI Copilot toggle button */}
              <motion.button
                onClick={onToggleChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all font-semibold"
                style={{
                  background: showChat ? 'hsl(var(--primary-subtle))' : 'hsl(var(--elevated))',
                  borderColor: showChat ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--border))',
                  color: showChat ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                aria-label="Toggle AI Assistant"
                aria-pressed={showChat}
              >
                <Bot className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI Copilot</span>
              </motion.button>

              {/* Language selector */}
              <div className="relative" ref={langRef}>
                <motion.button
                  onClick={() => setShowLanguage(p => !p)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all"
                  style={{
                    background: 'hsl(var(--elevated))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--muted))',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  aria-label="Change language"
                  aria-expanded={showLanguage}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline font-medium" style={{ color: 'hsl(var(--fg))' }}>
                    {currentLanguage.nativeName}
                  </span>
                  <span className="text-base">{currentLanguage.flag}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showLanguage ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {showLanguage && (
                    <motion.div
                      className="absolute right-0 top-full mt-2 glass-panel-strong rounded-xl shadow-floating overflow-hidden min-w-[200px] z-50"
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                    >
                      <div className="p-1">
                        {languages.map(lang => (
                          <button
                            key={lang.code}
                            onClick={() => { changeLanguage(lang.code); setShowLanguage(false); }}
                            className="w-full px-3 py-2.5 flex items-center gap-3 rounded-lg text-left transition-all text-sm"
                            style={{
                              background: currentLanguage.code === lang.code ? 'hsl(var(--primary-subtle))' : 'transparent',
                              color: 'hsl(var(--fg))',
                            }}
                            onMouseEnter={e => {
                              if (currentLanguage.code !== lang.code)
                                (e.currentTarget as HTMLElement).style.background = 'hsl(var(--elevated))';
                            }}
                            onMouseLeave={e => {
                              if (currentLanguage.code !== lang.code)
                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                            }}
                          >
                            <span className="text-base">{lang.flag}</span>
                            <span className="font-medium flex-1">{lang.nativeName}</span>
                            <span className="text-xs" style={{ color: 'hsl(var(--muted-fg))' }}>{lang.name}</span>
                            {currentLanguage.code === lang.code && (
                              <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Theme toggle */}
              <div className="relative" ref={themeRef}>
                <motion.button
                  onClick={() => setShowTheme(p => !p)}
                  className="flex items-center justify-center w-9 h-9 rounded-lg border transition-all"
                  style={{
                    background: 'hsl(var(--elevated))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--muted))',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={`Theme: ${theme}. Click to change.`}
                  aria-expanded={showTheme}
                >
                  <ThemeIcon className="w-4 h-4" />
                </motion.button>

                <AnimatePresence>
                  {showTheme && (
                    <motion.div
                      className="absolute right-0 top-full mt-2 glass-panel-strong rounded-xl shadow-floating overflow-hidden w-48 z-50"
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                    >
                      <div className="p-1">
                        {THEME_OPTIONS.map(({ value, label, Icon: OptionIcon, desc }) => (
                          <button
                            key={value}
                            onClick={() => { setTheme(value as any); setShowTheme(false); }}
                            className="w-full px-3 py-2.5 flex items-center gap-3 rounded-lg text-left transition-all text-sm"
                            style={{
                              background: theme === value ? 'hsl(var(--primary-subtle))' : 'transparent',
                              color: theme === value ? 'hsl(var(--primary))' : 'hsl(var(--fg))',
                            }}
                            onMouseEnter={e => {
                              if (theme !== value)
                                (e.currentTarget as HTMLElement).style.background = 'hsl(var(--elevated))';
                            }}
                            onMouseLeave={e => {
                              if (theme !== value)
                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                            }}
                          >
                            <OptionIcon className="w-4 h-4 flex-shrink-0" />
                            <div className="flex-1 text-left">
                              <p className="font-medium text-sm">{label}</p>
                              <p className="text-[10px]" style={{ color: 'hsl(var(--muted-fg))' }}>{desc}</p>
                            </div>
                            {theme === value && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Separator */}
              <div className="w-px h-6 mx-0.5" style={{ background: 'hsl(var(--border))' }} />

              {/* User badge */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: 'hsl(var(--muted-fg))' }}>Fan</p>
                  <p className="text-sm font-semibold leading-none" style={{ color: 'hsl(var(--fg))' }}>
                    {state.user.name}
                  </p>
                </div>
                <motion.button
                  onClick={toggleDevMode}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border font-medium transition-all"
                  style={{
                    background: state.dev_mode ? 'hsl(var(--primary-subtle))' : 'hsl(var(--elevated))',
                    borderColor: state.dev_mode ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--border))',
                    color: state.dev_mode ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  aria-label="Toggle developer mode"
                  aria-pressed={state.dev_mode}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dev</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Command Palette ──────────────────────────────────── */}
      <AnimatePresence>
        {showCommand && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setShowCommand(false)}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0"
              style={{ background: 'hsl(var(--overlay) / 0.7)', backdropFilter: 'blur(4px)' }}
            />

            {/* Palette panel */}
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
              <div
                className="flex items-center gap-3 px-4 py-3 border-b"
                style={{ borderColor: 'var(--glass-border)' }}
              >
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
                          onClick={() => {
                            if (action === 'food') {
                              const z = Object.keys(STADIUM_ZONES_METADATA).find(id => id.includes('food'));
                              if (z) setCurrentZone(z);
                            } else if (action === 'exit') {
                              const z = Object.keys(STADIUM_ZONES_METADATA).find(id => id.includes('exit') || id.includes('gate'));
                              if (z) setCurrentZone(z);
                            } else if (action === 'restroom') {
                              const z = Object.keys(STADIUM_ZONES_METADATA).find(id => id.includes('wc'));
                              if (z) setCurrentZone(z);
                            } else if (action === 'nav_seat') {
                              const z = Object.keys(STADIUM_ZONES_METADATA).find(id => id.includes('section'));
                              if (z) setCurrentZone(z);
                            }
                            setShowCommand(false);
                          }}
                        >
                          <ItemIcon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                          <span className="font-medium">{label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {filteredZones.length > 0 && (
                  <div>
                    <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-fg))' }}>
                      Stadium Zones
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {filteredZones.map(zone => {
                        const ZoneIcon = ZONE_TYPE_ICONS[zone.type] || MapPin;
                        return (
                          <motion.button
                            key={zone.id}
                            className="flex flex-col gap-1 p-2.5 rounded-xl text-left transition-all"
                            style={{
                              background: 'hsl(var(--elevated))',
                              border: '1px solid hsl(var(--border))',
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setCurrentZone(zone.id); setShowCommand(false); }}
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

                {filteredActions.length === 0 && filteredZones.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: 'hsl(var(--elevated))' }}
                    >
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

              {/* Footer hint */}
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}