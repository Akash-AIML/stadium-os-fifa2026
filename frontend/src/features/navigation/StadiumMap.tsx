import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Layers, Users, Timer, TrendingUp, TrendingDown, Minus, Map as MapIcon, Navigation as NavigationIcon, Utensils, DoorOpen, Activity } from 'lucide-react';
import { ZoneStatus, CrowdZone, Route } from '../../shared/types';
import { STADIUMS_CONFIG } from '../../shared/utils/stadiums';
import { useHeatMap } from '../../shared/hooks/useHeatMap';

interface StadiumMapProps {
  zones: CrowdZone[];
  selectedZoneId: string | null;
  onZoneClick: (zoneId: string) => void;
  activeRoute?: Route | null;
  showHeatmap?: boolean;
  stadiumId?: 'metlife' | 'sofi' | 'azteca';
  accessibleMode?: boolean;
}

// ── Zone status colors ────────────────────────────────────────────────────────
const ZONE_COLORS: Record<ZoneStatus, { fill: string; stroke: string; glow: string }> = {
  [ZoneStatus.CLEAR]:     { fill: '#10b981', stroke: '#059669', glow: 'rgba(16, 185, 129, 0.5)'  },
  [ZoneStatus.MODERATE]:  { fill: '#f59e0b', stroke: '#d97706', glow: 'rgba(245, 158, 11, 0.5)'  },
  [ZoneStatus.BUSY]:      { fill: '#f97316', stroke: '#ea580c', glow: 'rgba(249, 115, 22, 0.5)'  },
  [ZoneStatus.CONGESTED]: { fill: '#ef4444', stroke: '#dc2626', glow: 'rgba(239, 68, 68, 0.5)'   },
};

// ── Tooltip positioned outside SVG (DOM overlay) ──────────────────────────────
function ZoneTooltip({ zone, meta, color }: Readonly<{
  zone: CrowdZone;
  meta: { readonly label: string; readonly type: string; readonly location: readonly [number, number]; readonly landmark?: string };
  color: { readonly fill: string };
}>) {
  let TrendIcon = Minus;
  if (zone.trend === 'up') {
    TrendIcon = TrendingUp;
  } else if (zone.trend === 'down') {
    TrendIcon = TrendingDown;
  }

  let trendColor = '#f59e0b';
  if (zone.trend === 'up') {
    trendColor = '#ef4444';
  } else if (zone.trend === 'down') {
    trendColor = '#10b981';
  }

  let trendText = 'Stable';
  if (zone.trend === 'up') {
    trendText = 'Filling up';
  } else if (zone.trend === 'down') {
    trendText = 'Clearing';
  }

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
          <span className="text-xs font-medium" style={{ color: trendColor }}>
            {trendText}
          </span>
        </div>
      </div>
      {/* Status badge */}
      <div
        className="mt-2 pt-2 border-t text-[10px] font-semibold uppercase tracking-wide text-center"
      >
        {zone.status}
      </div>
      {/* Landmark */}
      {meta.landmark && (
        <div className="mt-2 pt-2 border-t text-[10px] text-slate-400 text-left leading-normal" style={{ borderColor: 'var(--glass-border)' }}>
          <span className="font-bold text-slate-300 block mb-0.5">📍 Landmark:</span>
          {meta.landmark}
        </div>
      )}
    </motion.div>
  );
}

const getZoneIcon = (type: string) => {
  switch (type) {
    case 'wc':
      return Users;
    case 'food':
      return Utensils;
    case 'medical':
      return Activity;
    case 'exit':
    case 'entrance':
      return DoorOpen;
    default:
      return null;
  }
};

const renderStadiumBackground = (stadiumId: string) => {
  if (stadiumId === 'sofi') {
    return (
      <>
        <path
          d="M 120 180 C 180 120, 620 100, 680 180 C 740 260, 700 580, 640 660 C 580 740, 220 700, 140 620 C 60 540, 60 240, 120 180 Z"
          fill="none"
          stroke="hsl(var(--border-strong))"
          strokeWidth="2"
          opacity="0.8"
        />
        <ellipse cx="410" cy="390" rx="330" ry="290" fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="8" />
        <ellipse cx="410" cy="390" rx="310" ry="270" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
      </>
    );
  }
  if (stadiumId === 'azteca') {
    return (
      <>
        <circle cx="400" cy="400" r="365" fill="none" stroke="hsl(var(--border-strong))" strokeWidth="2.5" />
        <circle cx="400" cy="400" r="335" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
        <circle cx="400" cy="400" r="305" fill="none" stroke="rgba(168,85,247,0.1)" strokeWidth="6" />
        {[
          { cx: 130, cy: 130 },
          { cx: 670, cy: 130 },
          { cx: 130, cy: 670 },
          { cx: 670, cy: 670 }
        ].map((ramp) => {
          const rKey = `ramp_${ramp.cx}_${ramp.cy}`;
          return (
            <g key={rKey}>
              <circle cx={ramp.cx} cy={ramp.cy} r={28} fill="none" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx={ramp.cx} cy={ramp.cy} r={20} fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="2" />
            </g>
          );
        })}
      </>
    );
  }
  return (
    <>
      <ellipse cx="400" cy="400" rx="365" ry="320" fill="none" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
      <ellipse cx="400" cy="400" rx="352" ry="308" fill="none" stroke="rgba(6,182,212,0.12)" strokeWidth="6" />
      <ellipse cx="400" cy="400" rx="352" ry="308" fill="none" stroke="rgba(6,182,212,0.2)" strokeWidth="1.5" />
      <ellipse cx="400" cy="400" rx="300" ry="255" fill="none" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="8 6" />
    </>
  );
};

// ── Pure helper: derive visual state values from zone interaction flags ────────
function computeZoneMarkerState(isSelected: boolean, isHovered: boolean, isCritical: boolean, r: number) {
  const scaleVal       = isSelected ? 1.2    : isHovered ? 1.12 : 1;
  const circleRadius   = isSelected ? r + 2  : isHovered ? r + 1 : r;
  const strokeWidthVal = isSelected ? 2.5    : isHovered ? 2 : 1.5;

  let opacityVal = 0.06;
  if (isSelected)     { opacityVal = 0.22; }
  else if (isHovered) { opacityVal = 0.16; }
  else if (isCritical){ opacityVal = 0.12; }

  return { scaleVal, circleRadius, strokeWidthVal, opacityVal };
}

interface ZoneMarkerViewProps {
  zone: CrowdZone;
  index: number;
  selectedZoneId: string | null;
  hoveredZone: string | null;
  onZoneClick: (zoneId: string) => void;
  setHoveredZone: (zoneId: string | null) => void;
  STADIUM_ZONES_METADATA: Record<string, any>;
}

const ZoneMarkerView = memo(({
  zone,
  index,
  selectedZoneId,
  hoveredZone,
  onZoneClick,
  setHoveredZone,
  STADIUM_ZONES_METADATA,
}: ZoneMarkerViewProps) => {
  const color      = ZONE_COLORS[zone.status as ZoneStatus] ?? ZONE_COLORS[ZoneStatus.CLEAR];
  const isSelected = selectedZoneId === zone.id;
  const isHovered  = hoveredZone    === zone.id;
  const isCritical = zone.status    === ZoneStatus.CONGESTED;
  const isGate     = zone.type === 'entrance' || zone.type === 'exit';
  const coords     = STADIUM_ZONES_METADATA[zone.id]?.location ?? [0, 0];
  const r          = isGate ? 18 : 15;
  const IconComponent = getZoneIcon(zone.type);

  const { scaleVal, circleRadius, strokeWidthVal, opacityVal } =
    computeZoneMarkerState(isSelected, isHovered, isCritical, r);

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
      animate={{ scale: scaleVal, opacity: 1 }}
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
        opacity={opacityVal}
        transition={{ duration: 0.25 }}
      />
      {/* Zone shape */}
      {isGate ? (
        <motion.circle
          cx={coords[0]} cy={coords[1]}
          r={circleRadius}
          fill={color.fill}
          stroke={isSelected ? '#ffffff' : color.stroke}
          strokeWidth={strokeWidthVal}
          filter={isSelected || isHovered ? 'url(#zone-glow)' : undefined}
          transition={{ duration: 0.2 }}
        />
      ) : (
        <motion.rect
          x={coords[0] - (isSelected ? 20 : 17)} y={coords[1] - (isSelected ? 14 : 12)}
          width={isSelected ? 40 : 34} height={isSelected ? 28 : 24}
          fill={color.fill}
          stroke={isSelected ? '#ffffff' : color.stroke}
          strokeWidth={strokeWidthVal}
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
      {IconComponent ? (
        <g transform={`translate(${coords[0] - 7}, ${coords[1] - 7})`} className="pointer-events-none select-none">
          <IconComponent size={14} color="#ffffff" strokeWidth={2.5} />
        </g>
      ) : (
        <text
          x={coords[0]} y={coords[1] + 3}
          textAnchor="middle" fontSize="6.5" fill="rgba(255,255,255,0.95)"
          fontWeight="700" className="pointer-events-none select-none"
          style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.02em' }}
        >
          {zone.label.substring(0, 4).toUpperCase()}
        </text>
      )}
    </motion.g>
  );
});

export function StadiumMap({
  zones,
  selectedZoneId,
  onZoneClick,
  activeRoute,
  showHeatmap = false,
  stadiumId = 'metlife',
  accessibleMode = false
}: Readonly<StadiumMapProps>) {
  const [viewMode, setViewMode]           = useState<'indoor' | 'outdoor'>('indoor');
  const [hoveredZone, setHoveredZone]     = useState<string | null>(null);

  const [mapScale, setMapScale]           = useState(1);
  const [mapPosition, setMapPosition]     = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging]       = useState(false);
  const heatmapVisible = showHeatmap;
  const dragStartRef = useRef({ x: 0, y: 0 });
  const svgRef       = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const heatmapData = useHeatMap(zones);
  const heatmapZones = heatmapData.heatmapZones;

  const stadiumConfig = STADIUMS_CONFIG[stadiumId] || STADIUMS_CONFIG.metlife;
  const STADIUM_ZONES_METADATA = stadiumConfig.zones;
  const DENSITY_THRESHOLD_BUSY = 0.7;

  // ── Wheel zoom ────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setMapScale(s => Math.max(0.5, Math.min(3, s - e.deltaY * 0.0015)));
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // ── Drag panning handlers ──────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode === 'outdoor') return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - mapPosition.x, y: e.clientY - mapPosition.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || viewMode === 'outdoor') return;
    setMapPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // ── Active path overlay builder ───────────────────────────────
  const renderActiveRoute = () => {
    if (viewMode === 'outdoor' || !activeRoute?.path || activeRoute.path.length < 2) return null;
    const points: string[] = [];
    activeRoute.path.forEach(zoneId => {
      const coords = STADIUM_ZONES_METADATA[zoneId]?.location;
      if (coords) {
        points.push(`${coords[0]},${coords[1]}`);
      }
    });

    if (points.length < 2) return null;

    const pathData = 'M ' + points.join(' L ');
    const isRed = activeRoute.crowd_level > DENSITY_THRESHOLD_BUSY;
    const routeColor = isRed ? '#ef4444' : '#22d3ee';

    return (
      <g>
        <motion.path
          d={pathData}
          fill="none"
          stroke={routeColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
        <motion.path
          d={pathData}
          fill="none"
          stroke={routeColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="10 6"
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: -100 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
      </g>
    );
  };

  // ── Heatmap overlay ───────────────────────────────────────────
  const renderHeatmap = useCallback(() => {
    if (!heatmapVisible) return null;
    return (
      <g style={{ mixBlendMode: 'screen' }}>
        {heatmapZones.map(zone => {
          const staggerDelay = ((zone.id.codePointAt(0) ?? 0) % 5) * 0.06;
          return (
            <motion.circle
              key={zone.id}
              cx={zone.location[0]} cy={zone.location[1]}
              r={zone.radius * 1.4}
              fill={zone.color} opacity={zone.intensity * 0.25}
              initial={{ r: 0, opacity: 0 }}
              animate={{ r: zone.radius * 1.4, opacity: zone.intensity * 0.25 }}
              transition={{ duration: 0.8, delay: staggerDelay }}
            />
          );
        })}
      </g>
    );
  }, [heatmapVisible, heatmapZones]);

  const hoveredData  = hoveredZone ? zones.find(z => z.id === hoveredZone) : null;
  const hoveredMeta  = hoveredZone ? STADIUM_ZONES_METADATA[hoveredZone] : null;
  const hoveredColor = hoveredData ? ZONE_COLORS[hoveredData.status as ZoneStatus] : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none"
      style={{
        background: 'radial-gradient(circle at center, #0b1120 0%, #030712 100%)',
        border: '1px solid var(--glass-border)',
        borderRadius: 20,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onKeyDown={(e) => { if (e.key === 'Escape') setIsDragging(false); }}
      role="application"
      aria-label={`${stadiumConfig.name} Stadium Map`}
    >
      {/* ── Tabs header overlay ────────────────────────────────── */}
      <div className="absolute top-3 left-3 z-30 flex gap-1.5 p-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800">
        <button
          onClick={() => setViewMode('indoor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all`}
          style={{
            background: viewMode === 'indoor' ? 'hsl(var(--primary))' : 'transparent',
            color: viewMode === 'indoor' ? 'white' : 'hsl(var(--muted))',
          }}
          aria-pressed={viewMode === 'indoor'}
        >
          <Layers className="w-3.5 h-3.5" />
          Indoor View
        </button>
        <button
          onClick={() => setViewMode('outdoor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all`}
          style={{
            background: viewMode === 'outdoor' ? 'hsl(var(--primary))' : 'transparent',
            color: viewMode === 'outdoor' ? 'white' : 'hsl(var(--muted))',
          }}
          aria-pressed={viewMode === 'outdoor'}
        >
          <MapIcon className="w-3.5 h-3.5" />
          Outdoor Transit
        </button>
      </div>

      {viewMode === 'outdoor' ? (
        <div className="w-full h-full relative" style={{ background: '#020408' }}>
          <iframe
            key={stadiumConfig.id}
            src={stadiumConfig.embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0, opacity: 0.85, filter: 'invert(90%) hue-rotate(180deg) contrast(110%) brightness(95%)' }}
            allowFullScreen={false}
            loading="lazy"
            title={`${stadiumConfig.name} Outdoor Transit Map`}
          />
          <motion.div
            className="absolute bottom-3 left-3 right-3 p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-30"
            style={{
              background: 'var(--glass-bg-strong)',
              backdropFilter: 'blur(20px)',
              borderColor: 'var(--glass-border)',
              boxShadow: '0 8px 32px var(--glass-shadow)',
            }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                <NavigationIcon className="w-4 h-4 text-cyan-400 rotate-45" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-white leading-tight">Outdoor Transit Directions</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Arrived at North Gate entry zone. Switch to indoor mode for stadium concourse guidance.</p>
              </div>
            </div>
            <motion.button
              onClick={() => setViewMode('indoor')}
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold rounded-lg text-white self-end sm:self-center flex-shrink-0"
              style={{ background: 'hsl(var(--primary))' }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <span>Enter Gate</span>
              <Layers className="w-3 h-3" />
            </motion.button>
          </motion.div>
        </div>
      ) : (
        <>
      {/* ── Main SVG Map ────────────────────────────────────────── */}
      <svg
        ref={svgRef}
        viewBox="0 0 800 800"
        className="w-full h-full pointer-events-auto"
        style={{
          transform: `translate(${mapPosition.x}px, ${mapPosition.y}px) scale(${mapScale})`,
          transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
          transformOrigin: 'center center',
        }}
      >
        <defs>
          <filter id="zone-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Stadium outline background */}
        {renderStadiumBackground(stadiumId)}

        {/* Kick-off spot */}
        <circle cx="400" cy="400" r="3" fill="rgba(16,185,129,0.6)" />

        {/* Pitch stripe texture */}
        {Array.from({ length: 6 }).map((_, i) => {
          const sKey = `stripe_${290 + i * 36.7}`;
          return (
            <rect
              key={sKey}
              x="220" y={290 + i * 36.7} width="360" height="18"
              fill="rgba(16,185,129,0.015)"
            />
          );
        })}

        {/* Heatmap */}
        {renderHeatmap()}

        {/* Route */}
        {renderActiveRoute()}

        {/* ── Zone markers ───────────────────────────────────── */}
        <AnimatePresence>
          {zones.map((zone, index) => (
            <ZoneMarkerView
              key={zone.id}
              zone={zone}
              index={index}
              selectedZoneId={selectedZoneId}
              hoveredZone={hoveredZone}
              onZoneClick={onZoneClick}
              setHoveredZone={setHoveredZone}
              STADIUM_ZONES_METADATA={STADIUM_ZONES_METADATA}
            />
          ))}
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
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-30">
        <motion.button
          className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white"
          onClick={() => setMapScale(s => Math.min(s + 0.25, 3))}
        >
          <ZoomIn className="w-5 h-5" />
        </motion.button>
        <motion.button
          className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white"
          onClick={() => setMapScale(s => Math.max(0.5, s - 0.25))}
        >
          <ZoomOut className="w-5 h-5" />
        </motion.button>
      </div>

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
        </>
      )}
    </div>
  );
}