import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, Layers, Users, Timer, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Zone, ZoneStatus, CrowdZone } from '../../shared/types';
import { STADIUM_ZONES_METADATA } from '../../shared/utils/zones';
import { useHeatMap } from '../../shared/hooks/useHeatMap';

interface StadiumMapProps {
  zones: CrowdZone[];
  selectedZoneId: string | null;
  onZoneClick: (zoneId: string) => void;
  activeRoute?: any | null;
  showHeatmap?: boolean;
}

// ── Zone status colors ────────────────────────────────────────────────────────
const ZONE_COLORS: Record<ZoneStatus, { fill: string; stroke: string; glow: string }> = {
  [ZoneStatus.CLEAR]:     { fill: '#10b981', stroke: '#059669', glow: 'rgba(16, 185, 129, 0.5)'  },
  [ZoneStatus.MODERATE]:  { fill: '#f59e0b', stroke: '#d97706', glow: 'rgba(245, 158, 11, 0.5)'  },
  [ZoneStatus.BUSY]:      { fill: '#f97316', stroke: '#ea580c', glow: 'rgba(249, 115, 22, 0.5)'  },
  [ZoneStatus.CONGESTED]: { fill: '#ef4444', stroke: '#dc2626', glow: 'rgba(239, 68, 68, 0.5)'   },
};

// ── Tooltip positioned outside SVG (DOM overlay) ──────────────────────────────
function ZoneTooltip({ zone, meta, color }: {
  zone: CrowdZone;
  meta: { label: string; type: string; location: [number, number] };
  color: { fill: string };
}) {
  const TrendIcon = zone.trend === 'up' ? TrendingUp : zone.trend === 'down' ? TrendingDown : Minus;
  const trendColor = zone.trend === 'up' ? '#ef4444' : zone.trend === 'down' ? '#10b981' : '#f59e0b';

  return (
    <motion.div
      className="map-tooltip pointer-events-none"
      initial={{ opacity: 0, scale: 0.92, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 6 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'absolute',
        left: `${meta.location[0] / 8 + 4}%`,
        top: `${meta.location[1] / 8 - 10}%`,
        zIndex: 30,
        minWidth: 160,
        transform: 'translate(-50%, -100%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: color.fill, boxShadow: `0 0 8px ${color.fill}` }}
        />
        <span className="font-semibold text-sm" style={{ color: 'hsl(var(--fg))' }}>
          {zone.label}
        </span>
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3" style={{ color: 'hsl(var(--muted))' }} />
          <span className="text-xs tabular-nums font-medium" style={{ color: 'hsl(var(--fg))' }}>
            {(zone.density * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="w-3 h-3" style={{ color: 'hsl(var(--muted))' }} />
          <span className="text-xs tabular-nums font-medium" style={{ color: 'hsl(var(--fg))' }}>
            {zone.queueTime}min
          </span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2">
          <TrendIcon className="w-3 h-3" style={{ color: trendColor }} />
          <span className="text-xs font-medium capitalize" style={{ color: trendColor }}>
            {zone.trend === 'up' ? 'Filling up' : zone.trend === 'down' ? 'Clearing' : 'Stable'}
          </span>
        </div>
      </div>
      {/* Status badge */}
      <div
        className="mt-2 pt-2 border-t text-[10px] font-semibold uppercase tracking-wide text-center capitalize"
        style={{ borderColor: 'var(--glass-border)', color: color.fill }}
      >
        {zone.status}
      </div>
    </motion.div>
  );
}

export function StadiumMap({ zones, selectedZoneId, onZoneClick, activeRoute, showHeatmap = false }: StadiumMapProps) {
  const [hoveredZone, setHoveredZone]     = useState<string | null>(null);
  const [mapScale, setMapScale]           = useState(1);
  const [mapPosition, setMapPosition]     = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging]       = useState(false);
  const [heatmapVisible, setHeatmapVisible] = useState(showHeatmap);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const svgRef       = useRef<SVGSVGElement>(null);
  const { heatmapZones } = useHeatMap(zones as any);

  // ── Wheel zoom ────────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setMapScale(prev => Math.min(Math.max(prev - e.deltaY * 0.001, 0.5), 3));
  }, []);

  // ── Drag pan ──────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - mapPosition.x, y: e.clientY - mapPosition.y };
    }
  }, [mapPosition]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) setMapPosition({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging]);

  // ── Route path ────────────────────────────────────────────────
  const renderActiveRoute = useCallback(() => {
    if (!activeRoute?.path || activeRoute.path.length < 2) return null;
    const points = activeRoute.path
      .map((id: string) => STADIUM_ZONES_METADATA[id]?.location)
      .filter(Boolean) as [number, number][];
    if (points.length < 2) return null;

    const d = `M ${points.map(p => `${p[0]} ${p[1]}`).join(' L ')}`;
    const totalLen = points.reduce((sum, p, i) => {
      if (i === 0) return sum;
      const prev = points[i - 1];
      return sum + Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    }, 0);

    return (
      <g>
        {/* Glow halo */}
        <motion.path
          d={d} fill="none"
          stroke="#06b6d4" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round"
          opacity={0.08}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        {/* Solid line */}
        <motion.path
          d={d} fill="none"
          stroke="url(#routeGradient)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
          filter="url(#route-glow)"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        {/* Animated dashes */}
        <motion.path
          d={d} fill="none"
          stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} strokeLinecap="round"
          strokeDasharray={`${totalLen * 0.05} ${totalLen * 0.07}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1, strokeDashoffset: [-totalLen * 0.12, 0] }}
          transition={{ opacity: { delay: 0.8 }, strokeDashoffset: { repeat: Infinity, duration: 1.5, ease: 'linear' } }}
        />
        {/* Waypoint dots */}
        {points.map((p, i) => (
          <motion.circle
            key={i} cx={p[0]} cy={p[1]} r={i === 0 || i === points.length - 1 ? 6 : 4}
            fill={i === 0 ? '#10b981' : i === points.length - 1 ? '#ef4444' : '#06b6d4'}
            stroke="rgba(0,0,0,0.5)" strokeWidth={1.5}
            initial={{ r: 0, opacity: 0 }}
            animate={{ r: i === 0 || i === points.length - 1 ? 6 : 4, opacity: 1 }}
            transition={{ delay: 0.9 + i * 0.1 }}
          />
        ))}
      </g>
    );
  }, [activeRoute]);

  // ── Heatmap overlay ───────────────────────────────────────────
  const renderHeatmap = useCallback(() => {
    if (!heatmapVisible) return null;
    return (
      <g style={{ mixBlendMode: 'screen' }}>
        {heatmapZones.map(zone => (
          <motion.circle
            key={zone.id}
            cx={zone.location[0]} cy={zone.location[1]}
            r={zone.radius * 1.4}
            fill={zone.color} opacity={zone.intensity * 0.25}
            initial={{ r: 0, opacity: 0 }}
            animate={{ r: zone.radius * 1.4, opacity: zone.intensity * 0.25 }}
            transition={{ duration: 0.8, delay: Math.random() * 0.3 }}
          />
        ))}
      </g>
    );
  }, [heatmapZones, heatmapVisible]);

  const hoveredMeta  = hoveredZone ? STADIUM_ZONES_METADATA[hoveredZone] : null;
  const hoveredData  = hoveredZone ? zones.find(z => z.id === hoveredZone) : null;
  const hoveredColor = hoveredData ? ZONE_COLORS[hoveredData.status as ZoneStatus] : null;

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        borderRadius: 20,
        background: 'hsl(var(--surface))',
        border: '1px solid hsl(var(--border))',
      }}
      onWheel={handleWheel}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, hsl(188 91% 43% / 0.04) 0%, transparent 70%), hsl(var(--surface))',
        }}
      />
      {/* Subtle grid texture */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" aria-hidden>
        <defs>
          <pattern id="bgGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgGrid)" />
      </svg>

      {/* ── Main SVG Map ─────────────────────────────────────── */}
      <svg
        ref={svgRef}
        viewBox="0 0 800 800"
        className="w-full h-full touch-none select-none"
        style={{
          transform: `translate(${mapPosition.x}px, ${mapPosition.y}px) scale(${mapScale})`,
          transformOrigin: '0 0',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseLeave={() => setHoveredZone(null)}
      >
        <defs>
          {/* Route glow filter */}
          <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Zone glow filter */}
          <filter id="zone-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Congested pulse filter */}
          <filter id="critical-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Route gradient */}
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          {/* Stadium radial gradient */}
          <radialGradient id="stadiumGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(6,182,212,0.06)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          {/* Field gradient */}
          <linearGradient id="fieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(16,185,129,0.08)" />
            <stop offset="50%" stopColor="rgba(16,185,129,0.06)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0.08)" />
          </linearGradient>
        </defs>

        {/* Stadium ambient glow */}
        <ellipse cx="400" cy="400" rx="380" ry="340" fill="url(#stadiumGlow)" />

        {/* Outer stadium bowl */}
        <ellipse cx="400" cy="400" rx="365" ry="320" fill="none" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
        <ellipse cx="400" cy="400" rx="352" ry="308" fill="none" stroke="rgba(6,182,212,0.12)" strokeWidth="6" />
        <ellipse cx="400" cy="400" rx="352" ry="308" fill="none" stroke="rgba(6,182,212,0.2)" strokeWidth="1.5" />

        {/* Seating tiers */}
        <ellipse cx="400" cy="400" rx="300" ry="255" fill="none" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="8 6" />

        {/* Field */}
        <motion.rect
          x="220" y="290" width="360" height="220" rx="6"
          fill="url(#fieldGrad)" stroke="rgba(16,185,129,0.45)" strokeWidth="2"
          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.7 }}
        />
        {/* Center line */}
        <motion.line x1="400" y1="290" x2="400" y2="510" stroke="rgba(16,185,129,0.35)" strokeWidth="1.5"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 0.6 }} />
        {/* Center circle */}
        <motion.circle cx="400" cy="400" r="44" fill="none" stroke="rgba(16,185,129,0.35)" strokeWidth="1.5"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          style={{ transformOrigin: '400px 400px' }}
          transition={{ delay: 0.5, duration: 0.5, type: 'spring' }} />
        {/* Penalty areas */}
        <motion.rect x="220" y="350" width="42" height="100" fill="none" stroke="rgba(16,185,129,0.35)" strokeWidth="1.5"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} />
        <motion.rect x="538" y="350" width="42" height="100" fill="none" stroke="rgba(16,185,129,0.35)" strokeWidth="1.5"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} />
        {/* Kick-off spot */}
        <circle cx="400" cy="400" r="3" fill="rgba(16,185,129,0.6)" />

        {/* Pitch stripe texture */}
        {Array.from({ length: 6 }).map((_, i) => (
          <rect
            key={i}
            x="220" y={290 + i * 36.7} width="360" height="18"
            fill="rgba(16,185,129,0.015)"
          />
        ))}

        {/* Heatmap */}
        {renderHeatmap()}

        {/* Route */}
        {renderActiveRoute()}

        {/* ── Zone markers ───────────────────────────────────── */}
        <AnimatePresence>
          {zones.map((zone, index) => {
            const color      = ZONE_COLORS[zone.status as ZoneStatus] ?? ZONE_COLORS[ZoneStatus.CLEAR];
            const isSelected = selectedZoneId === zone.id;
            const isHovered  = hoveredZone    === zone.id;
            const isCritical = zone.status    === ZoneStatus.CONGESTED;
            const isGate     = zone.type === 'entrance' || zone.type === 'exit';
            const coords     = STADIUM_ZONES_METADATA[zone.id]?.location ?? [0, 0];
            const r          = isGate ? 18 : 15;

            return (
              <motion.g
                key={zone.id}
                onClick={() => onZoneClick(zone.id)}
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
                tabIndex={0}
                role="button"
                aria-label={`${zone.label}, ${zone.status}${isSelected ? ', selected' : ''}`}
                aria-pressed={isSelected}
                className="cursor-pointer"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: isSelected ? 1.2 : isHovered ? 1.12 : 1,
                  opacity: 1,
                }}
                transition={{ type: 'spring', stiffness: 280, damping: 22, delay: index * 0.025 }}
                whileTap={{ scale: 0.92 }}
                style={{ transformOrigin: `${coords[0]}px ${coords[1]}px` }}
              >
                {/* Critical pulsing ring */}
                {isCritical && (
                  <motion.circle
                    cx={coords[0]} cy={coords[1]} r={r + 10}
                    fill={color.fill} opacity={0}
                    animate={{ r: [r + 6, r + 18], opacity: [0.4, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}

                {/* Glow halo */}
                <motion.circle
                  cx={coords[0]} cy={coords[1]} r={r + 6}
                  fill={color.fill}
                  opacity={isSelected ? 0.22 : isHovered ? 0.16 : isCritical ? 0.12 : 0.06}
                  transition={{ duration: 0.25 }}
                />

                {/* Zone shape — circle for gates, rounded-rect for sections */}
                {isGate ? (
                  <motion.circle
                    cx={coords[0]} cy={coords[1]}
                    r={isSelected ? r + 2 : isHovered ? r + 1 : r}
                    fill={color.fill}
                    stroke={isSelected ? '#ffffff' : color.stroke}
                    strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5}
                    filter={isSelected || isHovered ? 'url(#zone-glow)' : undefined}
                    transition={{ duration: 0.2 }}
                  />
                ) : (
                  <motion.rect
                    x={coords[0] - (isSelected ? 20 : 17)} y={coords[1] - (isSelected ? 14 : 12)}
                    width={isSelected ? 40 : 34} height={isSelected ? 28 : 24}
                    fill={color.fill}
                    stroke={isSelected ? '#ffffff' : color.stroke}
                    strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5}
                    rx={isSelected ? 8 : 6}
                    filter={isSelected || isHovered ? 'url(#zone-glow)' : undefined}
                    transition={{ duration: 0.2 }}
                  />
                )}

                {/* Selected ring */}
                {isSelected && (
                  <motion.circle
                    cx={coords[0]} cy={coords[1]} r={r + 14}
                    fill="none" stroke="#22d3ee" strokeWidth={1.5}
                    strokeDasharray="4 3"
                    opacity={0.7}
                    animate={{ rotate: 360 }}
                    style={{ transformOrigin: `${coords[0]}px ${coords[1]}px` }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    initial={{ r: r + 8, opacity: 0 }}
                  />
                )}

                {/* Congested badge */}
                {isCritical && (
                  <motion.circle
                    cx={coords[0] + r - 2} cy={coords[1] - r + 2} r={5}
                    fill="#ef4444" stroke="rgba(0,0,0,0.6)" strokeWidth={1.5}
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}

                {/* Trend arrow */}
                {zone.trend === 'up' && (
                  <motion.text
                    x={coords[0]} y={coords[1] - r - 8}
                    textAnchor="middle" fontSize="11" fill="#ef4444" fontWeight="900"
                    initial={{ y: coords[1] - r, opacity: 0 }}
                    animate={{ y: coords[1] - r - 8, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >↑</motion.text>
                )}
                {zone.trend === 'down' && (
                  <motion.text
                    x={coords[0]} y={coords[1] - r - 8}
                    textAnchor="middle" fontSize="11" fill="#10b981" fontWeight="900"
                    initial={{ y: coords[1] - r, opacity: 0 }}
                    animate={{ y: coords[1] - r - 8, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >↓</motion.text>
                )}

                {/* Zone label */}
                <text
                  x={coords[0]} y={coords[1] + 4}
                  textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.95)"
                  fontWeight="700" className="pointer-events-none select-none"
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em' }}
                >
                  {zone.label.substring(0, 4).toUpperCase()}
                </text>
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>

      {/* ── DOM Tooltip overlay ──────────────────────────────── */}
      <AnimatePresence>
        {hoveredZone && hoveredMeta && hoveredData && hoveredColor && (
          <ZoneTooltip
            zone={hoveredData}
            meta={hoveredMeta}
            color={hoveredColor}
          />
        )}
      </AnimatePresence>

      {/* ── Zoom controls ────────────────────────────────────── */}
      <div className="map-controls" style={{ bottom: 80, right: 12 }}>
        <motion.button
          className="map-control-btn" aria-label="Zoom in"
          onClick={() => setMapScale(s => Math.min(s + 0.25, 3))}
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        >
          <ZoomIn className="w-4 h-4" />
        </motion.button>
        <motion.button
          className="map-control-btn" aria-label="Zoom out"
          onClick={() => setMapScale(s => Math.max(s - 0.25, 0.5))}
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        >
          <ZoomOut className="w-4 h-4" />
        </motion.button>
        <motion.button
          className="map-control-btn" aria-label="Reset view"
          onClick={() => { setMapScale(1); setMapPosition({ x: 0, y: 0 }); }}
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        >
          <Maximize2 className="w-4 h-4" />
        </motion.button>
        <motion.button
          className="map-control-btn"
          aria-label="Toggle heatmap"
          aria-pressed={heatmapVisible}
          onClick={() => setHeatmapVisible(v => !v)}
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
          style={heatmapVisible ? { background: 'hsl(var(--primary-subtle))', borderColor: 'hsl(var(--primary) / 0.3)', color: 'hsl(var(--primary))' } : {}}
        >
          <Layers className="w-4 h-4" />
        </motion.button>
      </div>

      {/* ── Legend ──────────────────────────────────────────────── */}
      <motion.div
        className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-3 justify-center items-center px-4 py-2"
        style={{
          background: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--glass-border)',
          borderRadius: 12,
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        role="legend"
        aria-label="Zone status legend"
      >
        {Object.entries(ZoneStatus).map(([key, value]) => {
          const c = ZONE_COLORS[value as ZoneStatus];
          return (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="relative flex h-2.5 w-2.5"
              >
                {value === ZoneStatus.CONGESTED && (
                  <span
                    className="animate-ping absolute inset-0 rounded-full"
                    style={{ backgroundColor: c.fill, opacity: 0.6 }}
                  />
                )}
                <span
                  className="relative inline-flex rounded-full h-2.5 w-2.5"
                  style={{ backgroundColor: c.fill }}
                />
              </span>
              <span
                className="text-[10px] font-semibold capitalize tabular-nums"
                style={{ color: 'hsl(var(--muted))' }}
              >
                {value}
              </span>
            </div>
          );
        })}
      </motion.div>

      {/* ── Minimap ─────────────────────────────────────────────── */}
      <div
        className="absolute top-3 right-3 overflow-hidden"
        style={{
          width: 100, height: 100,
          background: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--glass-border)',
          borderRadius: 10,
        }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 800 800" className="w-full h-full">
          {/* Minimap bowl */}
          <ellipse cx="400" cy="400" rx="350" ry="300" fill="none" stroke="rgba(100,116,139,0.4)" strokeWidth="3" />
          {/* Minimap field */}
          <rect x="220" y="290" width="360" height="220" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.25)" strokeWidth="2" rx="4" />
          {/* Minimap zone dots */}
          {zones.map(zone => {
            const c      = ZONE_COLORS[zone.status as ZoneStatus] ?? ZONE_COLORS[ZoneStatus.CLEAR];
            const coords = STADIUM_ZONES_METADATA[zone.id]?.location ?? [0, 0];
            return (
              <circle
                key={zone.id}
                cx={coords[0]} cy={coords[1]} r={selectedZoneId === zone.id ? 9 : 6}
                fill={c.fill}
                opacity={selectedZoneId === zone.id ? 1 : 0.7}
                stroke={selectedZoneId === zone.id ? '#fff' : 'none'}
                strokeWidth={2}
              />
            );
          })}
          {/* Viewport indicator */}
          {mapScale !== 1 && (
            <rect
              x={400 - (350 / mapScale)}
              y={400 - (300 / mapScale)}
              width={700 / mapScale}
              height={600 / mapScale}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="4"
              strokeDasharray="12 8"
              opacity={0.6}
            />
          )}
        </svg>
      </div>
    </div>
  );
}