import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Users, Timer } from 'lucide-react';
import type { CrowdZone } from '../../../shared/types';

interface ZoneTooltipProps {
  zone: CrowdZone;
  meta: {
    readonly label: string;
    readonly type: string;
    readonly location: readonly [number, number];
    readonly landmark?: string;
  };
  color: { readonly fill: string };
}

/** Positioned DOM overlay tooltip shown when hovering a zone marker. */
export function ZoneTooltip({ zone, meta, color }: Readonly<ZoneTooltipProps>) {
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
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: color.fill, boxShadow: `0 0 8px ${color.fill}` }}
        />
        <span className="font-semibold text-sm" style={{ color: 'hsl(var(--fg))' }}>
          {zone.label}
        </span>
      </div>

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

      <div className="mt-2 pt-2 border-t text-[10px] font-semibold uppercase tracking-wide text-center">
        {zone.status}
      </div>

      {meta.landmark && (
        <div
          className="mt-2 pt-2 border-t text-[10px] text-slate-400 text-left leading-normal"
          style={{ borderColor: 'var(--glass-border)' }}
        >
          <span className="font-bold text-slate-300 block mb-0.5">📍 Landmark:</span>
          {meta.landmark}
        </div>
      )}
    </motion.div>
  );
}
