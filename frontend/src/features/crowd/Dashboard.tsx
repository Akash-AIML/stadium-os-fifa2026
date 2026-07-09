import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, AlertTriangle, Timer, MapPin, Activity,
  TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { Alert, ZoneStatus, CrowdSnapshot } from '../../shared/types';
import { CircularProgress } from '../../shared/components/PremiumCards';

interface DashboardProps {
  alerts: Alert[];
  crowdData: CrowdSnapshot[];
  selectedMetric?: 'density' | 'queue' | 'flow';
  onMetricChange?: (metric: 'density' | 'queue' | 'flow') => void;
}

const STATUS_COLORS: Record<string, string> = {
  [ZoneStatus.CLEAR]:    '#10b981',
  [ZoneStatus.MODERATE]: '#f59e0b',
  [ZoneStatus.BUSY]:     '#f97316',
  [ZoneStatus.CONGESTED]:'#ef4444',
};

// ── Animated counter hook ─────────────────────────────────────────────────────
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(target);
  const prevTarget = useRef(target);
  useEffect(() => {
    if (prevTarget.current === target) return;
    prevTarget.current = target;
    const start    = value;
    const startTs  = performance.now();
    const animate  = (now: number) => {
      const progress = Math.min(1, (now - startTs) / duration);
      const ease     = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (target - start) * ease));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target]);
  return value;
}

export function Dashboard({ alerts, crowdData, selectedMetric: externalMetric, onMetricChange: externalChange }: DashboardProps) {
  const [localMetric, setLocalMetric] = useState<'density' | 'queue' | 'flow'>('density');

  const selectedMetric = externalMetric || localMetric;
  const onMetricChange = externalChange || setLocalMetric;

  // KPI Calculations
  const criticalCount = alerts.filter(a => a.level === 'critical').length;
  const warningCount  = alerts.filter(a => a.level === 'warning').length;
  const avgDensity    = crowdData.length > 0
    ? Math.round(crowdData.reduce((s, c) => s + c.density, 0) / crowdData.length * 100)
    : 0;
  const avgQueue = Math.round(
    crowdData.reduce((s, c) => s + c.queue_time, 0) / Math.max(crowdData.length, 1)
  );
  const avgFlow = crowdData.length > 0
    ? Math.round(crowdData.reduce((s, c) => s + (1 - c.density), 0) / crowdData.length * 100)
    : 100;

  const activeAlertsVal = criticalCount + warningCount;
  const activeZonesVal  = crowdData.length;

  const animatedDensity = useCountUp(avgDensity);
  const animatedAlerts  = useCountUp(activeAlertsVal);
  const animatedQueue   = useCountUp(avgQueue);
  const animatedZones   = useCountUp(activeZonesVal);

  // Filter and sort top 3 bottleneck zones based on selectedMetric
  const getBottleneckZones = () => {
    if (selectedMetric === 'queue') {
      return [...crowdData]
        .sort((a, b) => b.queue_time - a.queue_time)
        .slice(0, 3)
        .map(c => ({
          zone_id: c.zone_id,
          status: c.status,
          value: `${c.queue_time}m`,
          label: 'wait time',
          color: c.queue_time > 20 ? '#ef4444' : c.queue_time > 10 ? '#f97316' : '#10b981'
        }));
    } else if (selectedMetric === 'flow') {
      return [...crowdData]
        .sort((a, b) => a.density - b.density)
        .reverse()
        .slice(0, 3)
        .map(c => {
          const flow = Math.round((1 - c.density) * 100);
          return {
            zone_id: c.zone_id,
            status: c.status,
            value: `${flow}%`,
            label: 'flow rate',
            color: flow < 30 ? '#ef4444' : flow < 60 ? '#f97316' : '#10b981'
          };
        });
    } else {
      return [...crowdData]
        .sort((a, b) => b.density - a.density)
        .slice(0, 3)
        .map(c => ({
          zone_id: c.zone_id,
          status: c.status,
          value: `${Math.round(c.density * 100)}%`,
          label: 'density',
          color: STATUS_COLORS[c.status] || '#10b981'
        }));
    }
  };

  const bottleneckZones = getBottleneckZones();

  return (
    <div className="space-y-4">
      {/* ── KPI Row (Extremely compact StatCards for test assertions) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Overall Density Card */}
        <div className="p-3 rounded-xl border flex flex-col justify-between" style={{ background: 'hsl(var(--elevated))', borderColor: 'hsl(var(--border))' }}>
          <span className="flex items-center justify-between text-slate-500 w-full">
            <span className="text-[10px] font-bold uppercase tracking-wider">Overall Density</span>
            <Users className="w-3.5 h-3.5" style={{ color: '#06b6d4' }} />
          </span>
          <span className="flex items-baseline gap-0.5 mt-2">
            <span className="text-xl font-black font-num tabular-nums text-white">
              {animatedDensity}%
            </span>
          </span>
        </div>

        {/* Active Alerts Card */}
        <div className="p-3 rounded-xl border flex flex-col justify-between" style={{ background: 'hsl(var(--elevated))', borderColor: 'hsl(var(--border))' }}>
          <span className="flex items-center justify-between text-slate-500 w-full">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Alerts</span>
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: activeAlertsVal > 0 ? '#ef4444' : '#10b981' }} />
          </span>
          <span className="flex items-baseline gap-0.5 mt-2">
            <span className="text-xl font-black font-num tabular-nums text-white">
              {animatedAlerts}
            </span>
          </span>
        </div>

        {/* Avg Wait Time Card */}
        <div className="p-3 rounded-xl border flex flex-col justify-between" style={{ background: 'hsl(var(--elevated))', borderColor: 'hsl(var(--border))' }}>
          <span className="flex items-center justify-between text-slate-500 w-full">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Wait Time</span>
            <Timer className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
          </span>
          <span className="flex items-baseline gap-0.5 mt-2">
            <span className="text-xl font-black font-num tabular-nums text-white">
              {animatedQueue}
            </span>
            <span className="text-[9px] text-slate-500">min</span>
          </span>
        </div>

        {/* Active Zones Card */}
        <div className="p-3 rounded-xl border flex flex-col justify-between" style={{ background: 'hsl(var(--elevated))', borderColor: 'hsl(var(--border))' }}>
          <span className="flex items-center justify-between text-slate-500 w-full">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Zones</span>
            <MapPin className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
          </span>
          <span className="flex items-baseline gap-0.5 mt-2">
            <span className="text-xl font-black font-num tabular-nums text-white">
              {animatedZones}
            </span>
          </span>
        </div>
      </div>

      {/* ── Metric Tab Bar ────────────────────────────────────── */}
      <div className="flex p-1 rounded-xl" style={{ background: 'hsl(var(--elevated))', border: '1px solid hsl(var(--border))' }}>
        {(['density', 'queue', 'flow'] as const).map(m => (
          <motion.button
            key={m}
            onClick={() => onMetricChange(m)}
            className="flex-1 py-1 rounded-md text-[11px] font-semibold transition-all text-center capitalize"
            style={{
              background:  selectedMetric === m ? 'hsl(var(--primary))' : 'transparent',
              color:       selectedMetric === m ? 'white' : 'hsl(var(--muted))',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-pressed={selectedMetric === m}
          >
            {m === 'density' ? 'Density' : m === 'queue' ? 'Queue Time' : 'Crowd Flow'}
          </motion.button>
        ))}
      </div>

      {/* ── Split Card View (Gauges and Rankings) ─────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Left: Circular gauge for current metric */}
        <div className="flex flex-col items-center justify-center p-2">
          {selectedMetric === 'density' && (
            <CircularProgress
              value={avgDensity} size={110} strokeWidth={8}
              color="cyan" label="Avg Occupancy" subLabel={`${avgDensity}% Capacity`}
            />
          )}
          {selectedMetric === 'queue' && (
            <CircularProgress
              value={avgQueue} max={30} size={110} strokeWidth={8}
              color="amber" label="Avg Delay" subLabel={`${avgQueue} Min Wait`}
            />
          )}
          {selectedMetric === 'flow' && (
            <CircularProgress
              value={avgFlow} size={110} strokeWidth={8}
              color="emerald" label="Avg Flow Rate" subLabel={`${avgFlow}% Speed`}
            />
          )}
        </div>

        {/* Right: Clean list of Top 3 Bottlenecks */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              {selectedMetric === 'density' ? 'Top Congested Sections' : selectedMetric === 'queue' ? 'Longest Queue Bottlenecks' : 'Stalled Flow Points'}
            </span>
          </div>

          <div className="space-y-1.5">
            {bottleneckZones.map((zone, idx) => (
              <div
                key={zone.zone_id}
                className="flex items-center justify-between p-2 rounded-lg border text-[11px]"
                style={{ background: 'hsl(var(--elevated))', borderColor: 'hsl(var(--border))' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[9px] text-slate-500 w-3">{idx + 1}.</span>
                  <span className="font-semibold capitalize truncate" style={{ color: 'hsl(var(--fg))' }}>
                    {zone.zone_id.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-bold tabular-nums" style={{ color: zone.color }}>
                    {zone.value}
                  </span>
                  <span className="text-[9px] uppercase tracking-wide text-slate-500">
                    {zone.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Active Alerts ─────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="border-t pt-3" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Alerts</span>
          </div>
          <div className="space-y-1.5">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className="flex items-start gap-2 p-2.5 rounded-lg text-xs"
                style={{
                  background: alert.level === 'critical' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)',
                  borderLeft: `2.5px solid ${alert.level === 'critical' ? '#ef4444' : '#f59e0b'}`
                }}
              >
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: alert.level === 'critical' ? '#ef4444' : '#f59e0b' }} />
                <span className="leading-normal text-slate-300 font-medium">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}