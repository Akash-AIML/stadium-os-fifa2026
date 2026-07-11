import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Map as MapIcon, Navigation as NavigationIcon } from 'lucide-react';
import { ZoneStatus, CrowdZone, Route } from '../../shared/types';
import { STADIUMS_CONFIG } from '../../shared/utils/stadiums';
import { useHeatMap } from '../../shared/hooks/useHeatMap';
import { renderStadiumBackground } from './components/StadiumBackground';
import { ZoneTooltip } from './components/ZoneTooltip';
import { ZoneMarkerView, ZONE_COLORS } from './components/ZoneMarkerView';
import { MapControls } from './components/MapControls';

interface StadiumMapProps {
  zones: CrowdZone[];
  selectedZoneId: string | null;
  onZoneClick: (zoneId: string) => void;
  activeRoute?: Route | null;
  showHeatmap?: boolean;
  stadiumId?: 'metlife' | 'sofi' | 'azteca';
  accessibleMode?: boolean;
}

export function StadiumMap({
  zones,
  selectedZoneId,
  onZoneClick,
  activeRoute,
  showHeatmap = false,
  stadiumId = 'metlife',
  accessibleMode = false,
}: Readonly<StadiumMapProps>) {
  const [viewMode, setViewMode]       = useState<'indoor' | 'outdoor'>('indoor');
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [mapScale, setMapScale]       = useState(1);
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging]   = useState(false);
  const dragStartRef  = useRef({ x: 0, y: 0 });
  const svgRef        = useRef<SVGSVGElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);

  const heatmapData = useHeatMap(zones);
  const heatmapZones = heatmapData.heatmapZones;

  const stadiumConfig           = STADIUMS_CONFIG[stadiumId] || STADIUMS_CONFIG.metlife;
  const STADIUM_ZONES_METADATA  = stadiumConfig.zones;
  const DENSITY_THRESHOLD_BUSY  = 0.7;

  // ── Wheel zoom ──────────────────────────────────────────────────────────────
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

  // ── Drag panning (using refs to avoid teardown/re-bind cycle during movement) ──
  const mapPositionRef = useRef(mapPosition);
  useEffect(() => {
    mapPositionRef.current = mapPosition;
  }, [mapPosition]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || viewMode === 'outdoor') return;

    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - mapPositionRef.current.x,
        y: e.clientY - mapPositionRef.current.y
      };
    };

    el.addEventListener('mousedown', handleMouseDown);
    return () => {
      el.removeEventListener('mousedown', handleMouseDown);
    };
  }, [viewMode]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMapPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDragging]);

  // ── Active route overlay ────────────────────────────────────────────────────
  const renderActiveRoute = () => {
    if (viewMode === 'outdoor' || !activeRoute?.path || activeRoute.path.length < 2) return null;
    const points: string[] = [];
    activeRoute.path.forEach(zoneId => {
      const coords = STADIUM_ZONES_METADATA[zoneId]?.location;
      if (coords) points.push(`${coords[0]},${coords[1]}`);
    });
    if (points.length < 2) return null;

    const pathData   = 'M ' + points.join(' L ');
    const isRed      = activeRoute.crowd_level > DENSITY_THRESHOLD_BUSY;
    const routeColor = isRed ? '#ef4444' : '#22d3ee';

    return (
      <g>
        <motion.path
          d={pathData} fill="none" stroke={routeColor} strokeWidth="6"
          strokeLinecap="round" strokeLinejoin="round" opacity="0.3"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
        <motion.path
          d={pathData} fill="none" stroke={routeColor} strokeWidth="3.5"
          strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 6"
          initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: -100 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
      </g>
    );
  };

  // ── Heatmap overlay ─────────────────────────────────────────────────────────
  const renderHeatmap = useCallback(() => {
    if (!showHeatmap) return null;
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
  }, [showHeatmap, heatmapZones]);

  const hoveredData  = hoveredZone ? zones.find(z => z.id === hoveredZone) : null;
  const hoveredMeta  = hoveredZone ? STADIUM_ZONES_METADATA[hoveredZone] : null;
  const hoveredColor = hoveredData ? ZONE_COLORS[hoveredData.status as ZoneStatus] : null;

  return (
    <section
      ref={containerRef}
      className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none"
      style={{
        background: 'radial-gradient(circle at center, #0b1120 0%, #030712 100%)',
        border: '1px solid var(--glass-border)',
        borderRadius: 20,
      }}
      aria-label={`${stadiumConfig.name} Stadium Map`}
    >
      {/* View mode tabs */}
      <div className="absolute top-3 left-3 z-30 flex gap-1.5 p-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800">
        <button
          onClick={() => setViewMode('indoor')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all"
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all"
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
          {/* ── Main SVG Map ─────────────────────────────────────────────── */}
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

            {renderStadiumBackground(stadiumId)}

            <circle cx="400" cy="400" r="3" fill="rgba(16,185,129,0.6)" />

            {Array.from({ length: 6 }).map((_, i) => {
              const sKey = `stripe_${290 + i * 36.7}`;
              return (
                <rect key={sKey} x="220" y={290 + i * 36.7} width="360" height="18" fill="rgba(16,185,129,0.015)" />
              );
            })}

            {renderHeatmap()}
            {renderActiveRoute()}

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

          {/* Tooltip */}
          <AnimatePresence>
            {hoveredZone && hoveredMeta && hoveredData && hoveredColor && (
              <ZoneTooltip zone={hoveredData} meta={hoveredMeta} color={hoveredColor} />
            )}
          </AnimatePresence>

          {/* Zoom controls */}
          <MapControls
            onZoomIn={() => setMapScale(s => Math.min(s + 0.25, 3))}
            onZoomOut={() => setMapScale(s => Math.max(0.5, s - 0.25))}
          />

          {/* Minimap */}
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
              <ellipse cx="400" cy="400" rx="350" ry="300" fill="none" stroke="rgba(100,116,139,0.4)" strokeWidth="3" />
              <rect x="220" y="290" width="360" height="220" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.25)" strokeWidth="2" rx="4" />
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
              {mapScale !== 1 && (
                <rect
                  x={400 - (350 / mapScale)} y={400 - (300 / mapScale)}
                  width={700 / mapScale} height={600 / mapScale}
                  fill="none" stroke="#22d3ee" strokeWidth="4" strokeDasharray="12 8" opacity={0.6}
                />
              )}
            </svg>
          </div>
        </>
      )}
    </section>
  );
}

// Re-export memo'd marker for convenience
export { ZoneMarkerView };