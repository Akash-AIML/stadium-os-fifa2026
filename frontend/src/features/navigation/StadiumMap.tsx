import React from 'react';
import { Zone, ZoneStatus } from '../../shared/types';

interface StadiumMapProps {
  zones: Zone[];
  selectedZoneId: string | null;
  onZoneClick: (zoneId: string) => void;
}

const ZONE_COLORS: Record<ZoneStatus, { fill: string; stroke: string; pattern?: string }> = {
  [ZoneStatus.CLEAR]: { fill: '#22c55e', stroke: '#15803d' },
  [ZoneStatus.MODERATE]: { fill: '#eab308', stroke: '#a16207' },
  [ZoneStatus.BUSY]: { fill: '#f97316', stroke: '#c2410c' },
  [ZoneStatus.CONGESTED]: { fill: '#ef4444', stroke: '#b91c1c' },
};

const ZONE_PATTERNS: Record<ZoneStatus, string> = {
  [ZoneStatus.CLEAR]: '',
  [ZoneStatus.MODERATE]: '<circle cx="5" cy="5" r="2" fill="rgba(0,0,0,0.1)"/>',
  [ZoneStatus.BUSY]: '<line x1="0" y1="0" x2="10" y2="10" stroke="rgba(0,0,0,0.1)" stroke-width="2"/>',
  [ZoneStatus.CONGESTED]: '<rect x="0" y="0" width="10" height="10" fill="rgba(0,0,0,0.1)"/>',
};

export function StadiumMap({ zones, selectedZoneId, onZoneClick }: StadiumMapProps) {
  const handleKeyDown = (e: React.KeyboardEvent, zoneId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onZoneClick(zoneId);
    }
  };

  return (
    <div className="w-full h-full min-h-[400px] bg-gray-50 rounded-lg p-4" role="application" aria-label="Stadium map">
      <svg viewBox="0 0 800 800" className="w-full h-full" aria-label="Interactive stadium map">
        <defs>
          <pattern id="pattern-moderate" width="10" height="10" patternUnits="userSpaceOnUse">
            {ZONE_PATTERNS[ZoneStatus.MODERATE]}
          </pattern>
          <pattern id="pattern-busy" width="10" height="10" patternUnits="userSpaceOnUse">
            {ZONE_PATTERNS[ZoneStatus.BUSY]}
          </pattern>
          <pattern id="pattern-congested" width="10" height="10" patternUnits="userSpaceOnUse">
            {ZONE_PATTERNS[ZoneStatus.CONGESTED]}
          </pattern>
        </defs>
        
        {/* Stadium outline */}
        <ellipse cx="400" cy="400" rx="350" ry="300" fill="none" stroke="#374151" strokeWidth="3" />
        
        {/* Field */}
        <rect x="250" y="300" width="300" height="200" fill="#86efac" stroke="#22c55e" strokeWidth="2" />
        
        {/* Zones */}
        {zones.map((zone) => {
          const color = ZONE_COLORS[zone.status as ZoneStatus];
          const isSelected = selectedZoneId === zone.id;
          const isEntrance = zone.type === 'entrance';
          const isExit = zone.type === 'exit';
          
          return (
            <g
              key={zone.id}
              onClick={() => onZoneClick(zone.id)}
              onKeyDown={(e) => handleKeyDown(e, zone.id)}
              tabIndex={0}
              role="button"
              aria-label={`${zone.label}, ${zone.status}${isSelected ? ', selected' : ''}`}
              aria-pressed={isSelected}
              className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{ transform: isSelected ? 'scale(1.1)' : 'scale(1)', transformOrigin: `${zone.location[0]}px ${zone.location[1]}px`, transition: 'transform 0.2s' }}
            >
              {isEntrance || isExit ? (
                <circle
                  cx={zone.location[0]}
                  cy={zone.location[1]}
                  r={isSelected ? 22 : 20}
                  fill={color.fill}
                  stroke={color.stroke}
                  strokeWidth={isSelected ? 3 : 2}
                />
              ) : (
                <rect
                  x={zone.location[0] - 20}
                  y={zone.location[1] - 15}
                  width={40}
                  height={30}
                  fill={color.fill}
                  stroke={color.stroke}
                  strokeWidth={isSelected ? 3 : 2}
                  rx={4}
                />
              )}
              <text
                x={zone.location[0]}
                y={zone.location[1] + 5}
                textAnchor="middle"
                fontSize="10"
                fill="white"
                fontWeight="bold"
                className="pointer-events-none select-none"
              >
                {zone.label.split(' ')[0]}
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center" role="legend" aria-label="Crowd status legend">
        {Object.entries(ZoneStatus).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: ZONE_COLORS[value as ZoneStatus].fill }}
              aria-hidden="true"
            />
            <span className="text-sm capitalize">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}