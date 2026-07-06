import React from 'react';
import { Zone, ZoneStatus } from '../../shared/types';
import { STADIUM_ZONES_METADATA } from '../../shared/utils/zones';

interface StadiumMapProps {
  zones: Zone[];
  selectedZoneId: string | null;
  onZoneClick: (zoneId: string) => void;
  activeRoute?: any | null;
}

const ZONE_COLORS: Record<ZoneStatus, { fill: string; stroke: string }> = {
  [ZoneStatus.CLEAR]: { fill: '#10b981', stroke: '#059669' },     // Emerald
  [ZoneStatus.MODERATE]: { fill: '#f59e0b', stroke: '#d97706' },  // Amber
  [ZoneStatus.BUSY]: { fill: '#f97316', stroke: '#ea580c' },      // Orange
  [ZoneStatus.CONGESTED]: { fill: '#ef4444', stroke: '#dc2626' }, // Red
};

export function StadiumMap({ zones, selectedZoneId, onZoneClick, activeRoute }: StadiumMapProps) {
  const handleKeyDown = (e: React.KeyboardEvent, zoneId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onZoneClick(zoneId);
    }
  };

  const renderActiveRoute = () => {
    if (!activeRoute || !activeRoute.path || activeRoute.path.length < 2) return null;

    const points = activeRoute.path
      .map((zoneId: string) => {
        const meta = STADIUM_ZONES_METADATA[zoneId];
        return meta ? meta.location : null;
      })
      .filter(Boolean) as [number, number][];

    if (points.length < 2) return null;

    const pathData = `M ${points.map((p) => `${p[0]} ${p[1]}`).join(' L ')}`;

    return (
      <g>
        {/* Glow backdrop path */}
        <path
          d={pathData}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.25"
          className="blur-sm"
        />
        {/* Animated flow path */}
        <path
          d={pathData}
          fill="none"
          stroke="#06b6d4"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="12, 8"
          className="animate-route-flow"
        />
      </g>
    );
  };

  return (
    <div className="w-full h-full min-h-[420px] bg-slate-950/80 rounded-xl p-4 border border-slate-900 shadow-inner relative overflow-hidden" role="application" aria-label="Stadium map">
      <svg viewBox="0 0 800 800" className="w-full h-full" aria-label="Interactive stadium map">
        {/* Outer space grid effect */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Stadium outline */}
        <ellipse cx="400" cy="400" rx="360" ry="320" fill="none" stroke="rgba(51, 65, 85, 0.25)" strokeWidth="8" />
        <ellipse cx="400" cy="400" rx="350" ry="300" fill="none" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="2" className="map-glow-ellipse" />
        <ellipse cx="400" cy="400" rx="350" ry="300" fill="none" stroke="#1e293b" strokeWidth="3" />

        {/* Field markings (tactical style) */}
        <rect x="250" y="300" width="300" height="200" fill="rgba(16, 185, 129, 0.02)" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="2" rx="4" className="map-glow-field" />
        <line x1="400" y1="300" x2="400" y2="500" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1.5" />
        <circle cx="400" cy="400" r="40" fill="none" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1.5" />
        <rect x="250" y="360" width="35" height="80" fill="none" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1.5" />
        <rect x="515" y="360" width="35" height="80" fill="none" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1.5" />

        {/* Pathfinding route */}
        {renderActiveRoute()}

        {/* Zones */}
        {zones.map((zone) => {
          const color = ZONE_COLORS[zone.status as ZoneStatus] || ZONE_COLORS[ZoneStatus.CLEAR];
          const isSelected = selectedZoneId === zone.id;
          const isEntrance = zone.type === 'entrance';
          const isExit = zone.type === 'exit';

          const coordinates = STADIUM_ZONES_METADATA[zone.id]?.location || [0, 0];

          return (
            <g
              key={zone.id}
              onClick={() => onZoneClick(zone.id)}
              onKeyDown={(e) => handleKeyDown(e, zone.id)}
              tabIndex={0}
              role="button"
              aria-label={`${zone.label}, ${zone.status}${isSelected ? ', selected' : ''}`}
              aria-pressed={isSelected}
              className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 group"
              style={{
                transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                transformOrigin: `${coordinates[0]}px ${coordinates[1]}px`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* Pulse overlay ring for selected zone */}
              {isSelected && (
                <circle
                  cx={coordinates[0]}
                  cy={coordinates[1]}
                  r={isEntrance || isExit ? 28 : 26}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2"
                  className="animate-ping opacity-75"
                />
              )}

              {/* Glowing shadow background circle */}
              <circle
                cx={coordinates[0]}
                cy={coordinates[1]}
                r={isEntrance || isExit ? 18 : 15}
                fill={color.fill}
                opacity="0.15"
                className="blur-[6px] group-hover:opacity-30 transition-all duration-300"
              />

              {isEntrance || isExit ? (
                <circle
                  cx={coordinates[0]}
                  cy={coordinates[1]}
                  r={isSelected ? 18 : 16}
                  fill={color.fill}
                  stroke={isSelected ? '#ffffff' : color.stroke}
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-all duration-300"
                />
              ) : (
                <rect
                  x={coordinates[0] - 18}
                  y={coordinates[1] - 14}
                  width={36}
                  height={28}
                  fill={color.fill}
                  stroke={isSelected ? '#ffffff' : color.stroke}
                  strokeWidth={isSelected ? 3 : 2}
                  rx={6}
                  className="transition-all duration-300"
                />
              )}

              {/* Overlay pulse indicator class if busy/congested */}
              {zone.status === ZoneStatus.CONGESTED && (
                <circle
                  cx={coordinates[0] + 12}
                  cy={coordinates[1] - 12}
                  r="5"
                  fill="#ef4444"
                  stroke="#020408"
                  strokeWidth="1.5"
                  className="pulse-congested"
                />
              )}

              <text
                x={coordinates[0]}
                y={coordinates[1] + 4}
                textAnchor="middle"
                fontSize="8"
                fill="white"
                fontWeight="800"
                className="pointer-events-none select-none tracking-tight font-sans"
              >
                {zone.label.substring(0, 3).toUpperCase()}
              </text>

              {/* Hover label tooltip backdrop */}
              <title>{`${zone.label} (${zone.status.toUpperCase()})`}</title>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-4 justify-center bg-slate-900/90 border border-slate-800/80 px-4 py-2.5 rounded-xl backdrop-blur-md" role="legend" aria-label="Crowd status legend">
        {Object.entries(ZoneStatus).map(([key, value]) => {
          const statusColors = ZONE_COLORS[value as ZoneStatus] || ZONE_COLORS[ZoneStatus.CLEAR];
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                {value === ZoneStatus.CONGESTED && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                )}
                <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: statusColors.fill }}></span>
              </span>
              <span className="text-xs font-semibold text-slate-300 capitalize">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}