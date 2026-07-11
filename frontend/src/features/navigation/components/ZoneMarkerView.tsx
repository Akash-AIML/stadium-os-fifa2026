import { memo } from 'react';
import { motion } from 'framer-motion';
import { ZoneStatus, CrowdZone } from '../../../shared/types';
import { Users, Utensils, Activity, DoorOpen } from 'lucide-react';

// ── Zone status colors ────────────────────────────────────────────────────────
export const ZONE_COLORS: Record<ZoneStatus, { fill: string; stroke: string; glow: string }> = {
  [ZoneStatus.CLEAR]:     { fill: '#10b981', stroke: '#059669', glow: 'rgba(16, 185, 129, 0.5)'  },
  [ZoneStatus.MODERATE]:  { fill: '#f59e0b', stroke: '#d97706', glow: 'rgba(245, 158, 11, 0.5)'  },
  [ZoneStatus.BUSY]:      { fill: '#f97316', stroke: '#ea580c', glow: 'rgba(249, 115, 22, 0.5)'  },
  [ZoneStatus.CONGESTED]: { fill: '#ef4444', stroke: '#dc2626', glow: 'rgba(239, 68, 68, 0.5)'   },
};

function getZoneIcon(type: string) {
  switch (type) {
    case 'wc':       return Users;
    case 'food':     return Utensils;
    case 'medical':  return Activity;
    case 'exit':
    case 'entrance': return DoorOpen;
    default:         return null;
  }
}

// ── Pure helper: derive visual state values from zone interaction flags ───────
export function computeZoneMarkerState(isSelected: boolean, isHovered: boolean, isCritical: boolean, r: number) {
  // Avoid nested ternaries: compute each value with explicit precedence
  let scaleVal = 1;
  if (isSelected)     scaleVal = 1.2;
  else if (isHovered) scaleVal = 1.12;

  let circleRadius = r;
  if (isSelected)     circleRadius = r + 2;
  else if (isHovered) circleRadius = r + 1;

  let strokeWidthVal = 1.5;
  if (isSelected)     strokeWidthVal = 2.5;
  else if (isHovered) strokeWidthVal = 2;

  let opacityVal = 0.06;
  if (isSelected)     { opacityVal = 0.22; }
  else if (isHovered) { opacityVal = 0.16; }
  else if (isCritical){ opacityVal = 0.12; }

  return { scaleVal, circleRadius, strokeWidthVal, opacityVal };
}

export interface ZoneMarkerViewProps {
  zone: CrowdZone;
  index: number;
  selectedZoneId: string | null;
  hoveredZone: string | null;
  onZoneClick: (zoneId: string) => void;
  setHoveredZone: (zoneId: string | null) => void;
  STADIUM_ZONES_METADATA: Record<string, { location: [number, number] }>;
}

/** Render the correct SVG shape (circle for gates, rect for regular zones). */
function renderZoneShape(
  isGate: boolean,
  isSelected: boolean,
  isHovered: boolean,
  coords: [number, number],
  circleRadius: number,
  strokeWidthVal: number,
  color: { fill: string; stroke: string },
) {
  const filter = isSelected || isHovered ? 'url(#zone-glow)' : undefined;
  const stroke = isSelected ? '#ffffff' : color.stroke;

  if (isGate) {
    return (
      <motion.circle
        cx={coords[0]} cy={coords[1]}
        r={circleRadius}
        fill={color.fill}
        stroke={stroke}
        strokeWidth={strokeWidthVal}
        filter={filter}
        transition={{ duration: 0.2 }}
      />
    );
  }

  const x = coords[0] - (isSelected ? 20 : 17);
  const y = coords[1] - (isSelected ? 14 : 12);
  const w = isSelected ? 40 : 34;
  const h = isSelected ? 28 : 24;
  const rx = isSelected ? 8 : 6;

  return (
    <motion.rect
      x={x} y={y}
      width={w} height={h}
      fill={color.fill}
      stroke={stroke}
      strokeWidth={strokeWidthVal}
      rx={rx}
      filter={filter}
      transition={{ duration: 0.2 }}
    />
  );
}

/** SVG group marker for a single stadium zone. */
export const ZoneMarkerView = memo(({
  zone,
  index,
  selectedZoneId,
  hoveredZone,
  onZoneClick,
  setHoveredZone,
  STADIUM_ZONES_METADATA,
}: ZoneMarkerViewProps) => {
  const color       = ZONE_COLORS[zone.status as ZoneStatus] ?? ZONE_COLORS[ZoneStatus.CLEAR];
  const isSelected  = selectedZoneId === zone.id;
  const isHovered   = hoveredZone    === zone.id;
  const isCritical  = zone.status    === ZoneStatus.CONGESTED;
  const isGate      = zone.type === 'entrance' || zone.type === 'exit';
  const coords      = STADIUM_ZONES_METADATA[zone.id]?.location ?? [0, 0];
  const r           = isGate ? 18 : 15;
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
      {renderZoneShape(isGate, isSelected, isHovered, coords, circleRadius, strokeWidthVal, color)}
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
      {/* Trend arrows */}
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
      {/* Zone icon or label */}
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

ZoneMarkerView.displayName = 'ZoneMarkerView';
