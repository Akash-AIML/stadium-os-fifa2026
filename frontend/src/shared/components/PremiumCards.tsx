import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, Utensils, Users,
  DoorOpen, Shield, Armchair, Activity, MapPin, ArrowRight,
  type LucideIcon
} from 'lucide-react';
import { Recommendation, ZoneStatus } from '../types';

interface LiveCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
  icon?: string;
  status?: ZoneStatus;
  history?: number[];
  onClick?: () => void;
}

const STATUS_COLORS: Record<ZoneStatus, string> = {
  [ZoneStatus.CLEAR]: '#10b981',
  [ZoneStatus.MODERATE]: '#f59e0b',
  [ZoneStatus.BUSY]: '#f97316',
  [ZoneStatus.CONGESTED]: '#ef4444',
};

const TREND_ICONS: Record<string, LucideIcon> = { up: TrendingUp, down: TrendingDown, stable: Minus };
const TREND_COLORS = { up: '#ef4444', down: '#10b981', stable: '#f59e0b' };

export function LiveCard({ title, value, unit = '', trend = 'stable', subtitle, icon = '📊', status, history = [], onClick }: Readonly<LiveCardProps>) {
  const sparklineRef = useRef<SVGPolylineElement>(null);

  useEffect(() => {
    if (sparklineRef.current && history.length > 1) {
      const width = 120;
      const height = 40;
      const padding = 2;
      const maxVal = Math.max(...history);
      const minVal = Math.min(...history);
      const range = maxVal - minVal || 1;
      
      const points = history.map((val, i) => {
        const x = padding + (i / (history.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((val - minVal) / range) * (height - 2 * padding);
        return `${x},${y}`;
      }).join(' ');
      
      sparklineRef.current.setAttribute('points', points);
    }
  }, [history]);

  const TrendIconComponent = TREND_ICONS[trend];

  return (
    <motion.div
      className="glass-panel-gradient gradient-border-cyan p-5 relative overflow-hidden cursor-pointer hover-lift"
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity mesh-gradient" />
      
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <span className="text-2xl mb-2 block animate-float">{icon}</span>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <motion.div
            className="flex items-baseline gap-1 mt-1"
            key={value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="stat-counter text-3xl font-extrabold text-slate-100 tabular-nums">{value}</span>
            <span className="text-sm font-medium text-slate-400 mt-1">{unit}</span>
          </motion.div>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span 
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase`}
            style={{ 
              backgroundColor: `${STATUS_COLORS[status || ZoneStatus.CLEAR]}20`,
              color: STATUS_COLORS[status || ZoneStatus.CLEAR]
            }}
          >
            {status || 'Live'}
          </span>
          {TrendIconComponent && (
            <TrendIconComponent className="w-3 h-3" style={{ color: TREND_COLORS[trend] }} />
          )}
        </div>
      </div>

      {history.length > 1 && (
        <div className="relative z-10 mt-4 h-12">
          <svg className="w-full h-full" viewBox="0 0 120 40">
            <defs>
              <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={STATUS_COLORS[status || ZoneStatus.CLEAR]} stopOpacity={0.6} />
                <stop offset="100%" stopColor={STATUS_COLORS[status || ZoneStatus.CLEAR]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <polyline
              ref={sparklineRef}
              fill="none"
              stroke={STATUS_COLORS[status || ZoneStatus.CLEAR]}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 4px currentColor)"
            />
          </svg>
        </div>
      )}
    </motion.div>
  );
}

interface ExpandableCardProps {
  title: string;
  icon: string;
  status: ZoneStatus;
  children: React.ReactNode;
  summary?: React.ReactNode;
  defaultExpanded?: boolean;
}

export function ExpandableCard({ title, icon, status, children, summary, defaultExpanded = false }: Readonly<ExpandableCardProps>) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      className={`expandable-card ${expanded ? 'expanded' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between focus-visible-ring"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <motion.span
            className="text-2xl"
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.span>
          <div>
            <h3 className="font-bold text-slate-100">{title}</h3>
            <span 
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ 
                backgroundColor: `${STATUS_COLORS[status]}20`,
                color: STATUS_COLORS[status]
              }}
            >
              {status}
            </span>
          </div>
        </div>
        {summary && <div className="text-right text-sm text-slate-400">{summary}</div>}
        <motion.span
          className="text-slate-400"
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="expandable-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="border-t border-slate-800/50 pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const TYPE_ICONS: Record<string, LucideIcon> = {
  food:     Utensils,
  restroom: Users,
  exit:     DoorOpen,
  safety:   Shield,
  seating:  Armchair,
  medical:  Activity,
  entrance: MapPin,
};

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAction?: (action: string) => void;
}

export function RecommendationCard({ recommendation, onAction }: Readonly<RecommendationCardProps>) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const staggerDelay = ((recommendation.id.codePointAt(0) ?? 0) % 5) * 60;
    const timer = setTimeout(() => setVisible(true), staggerDelay);
    return () => clearTimeout(timer);
  }, [recommendation.id]);

  const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
    low: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
    medium: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    high: { bg: 'rgba(249,115,22,0.1)', text: '#f97316', border: 'rgba(249,115,22,0.3)' },
    critical: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  };

  const colors = priorityColors[recommendation.priority] || priorityColors.low;
  const TypeIcon = TYPE_ICONS[recommendation.type] || MapPin;

  return (
    <motion.div
      className="glass-panel-gradient gradient-border relative overflow-hidden"
      style={{ borderColor: colors.border }}
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: visible ? 0 : 0.1 }}
      whileHover={{ x: 4 }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: colors.text }} />
      
      <div className="p-4 relative z-10">
        <div className="flex items-start gap-3">
          <motion.div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <TypeIcon className="w-4 h-4" style={{ color: colors.text }} />
          </motion.div>
          <div className="flex-1">
            <p className="font-semibold text-slate-100 leading-relaxed">{recommendation.message}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3 text-[10px]">
              <span 
                className="px-2 py-0.5 rounded font-bold uppercase"
                style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
              >
                {recommendation.type}
              </span>
              <span style={{ color: colors.text }}>•</span>
              <span className="font-medium capitalize" style={{ color: colors.text }}>
                Priority: {recommendation.priority}
              </span>
            </div>
          </div>
          <motion.button
            onClick={() => onAction?.('navigate')}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex-shrink-0"
            style={{ color: 'hsl(var(--primary))', background: 'hsl(var(--primary-subtle))' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowRight className="w-3 h-3" />
            Go
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

interface FloatingWidgetProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  color?: 'cyan' | 'violet' | 'emerald' | 'amber';
  onClick?: () => void;
}

export function FloatingWidget({ icon: Icon, label, value, trend = 'stable', color = 'cyan', onClick }: Readonly<FloatingWidgetProps>) {
  const COLORS = {
    cyan:    { bg: 'rgba(6,182,212,0.12)',   text: '#06b6d4', border: 'rgba(6,182,212,0.25)'   },
    violet:  { bg: 'rgba(168,85,247,0.12)',  text: '#a855f7', border: 'rgba(168,85,247,0.25)'  },
    emerald: { bg: 'rgba(16,185,129,0.12)',  text: '#10b981', border: 'rgba(16,185,129,0.25)'  },
    amber:   { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b', border: 'rgba(245,158,11,0.25)'  },
  };
  const c = COLORS[color];
  const TrendIconComponent = TREND_ICONS[trend];

  return (
    <motion.button
      onClick={onClick}
      className="card-surface p-4 flex items-center gap-3 w-full text-left"
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ borderColor: c.border }}
    >
      <motion.div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: c.bg }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 3.5, repeat: Infinity }}
      >
        <Icon className="w-5 h-5" style={{ color: c.text }} />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-fg))' }}>{label}</p>
        <p className="text-sm font-bold" style={{ color: 'hsl(var(--fg))' }}>{value}</p>
      </div>
      {TrendIconComponent && (
        <TrendIconComponent className="w-3.5 h-3.5 flex-shrink-0" style={{ color: TREND_COLORS[trend] }} />
      )}
    </motion.button>
  );
}

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: 'cyan' | 'violet' | 'emerald' | 'amber';
  label?: string;
  subLabel?: string;
  animate?: boolean;
}

export function CircularProgress({ value, max = 100, size = 120, strokeWidth = 8, color = 'cyan', label, subLabel, animate = true }: Readonly<CircularProgressProps>) {
  const colors = {
    cyan: '#06b6d4',
    violet: '#a855f7',
    emerald: '#22c55e',
    amber: '#f59e0b',
  };
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value / max, 0), 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="circular-progress relative inline-flex flex-col items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors[color]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          initial={animate ? { strokeDashoffset: circumference } : false}
          animate={animate ? { strokeDashoffset } : false}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          filter="drop-shadow(0 0 8px currentColor)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-extrabold tabular-nums font-num"
          style={{ color: 'hsl(var(--fg))' }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {Math.round(progress * 100)}%
        </motion.span>
        {label    && <span className="text-xs mt-1" style={{ color: 'hsl(var(--muted))' }}>{label}</span>}
        {subLabel && <span className="text-[10px]" style={{ color: 'hsl(var(--muted-fg))' }}>{subLabel}</span>}
      </div>
    </div>
  );
}