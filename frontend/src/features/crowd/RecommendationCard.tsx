import React from 'react';
import { motion } from 'framer-motion';
import {
  Utensils, Users, DoorOpen, Shield, MapPin, ArrowRight, Lightbulb
} from 'lucide-react';
import { Recommendation } from '../../shared/types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onNavigate?: (zoneId: string) => void;
}

const TYPE_ICONS = {
  food: Utensils,
  restroom: Users,
  exit: DoorOpen,
  safety: Shield,
};

const PRIORITY_STYLES: Record<string, { border: string; glow: string; text: string; bg: string }> = {
  low: {
    border: 'border-l-slate-400 dark:border-l-slate-600',
    glow: 'shadow-sm',
    text: 'text-slate-500 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-900/10',
  },
  medium: {
    border: 'border-l-cyan-500',
    glow: 'shadow-cyan-500/5 dark:shadow-cyan-500/10',
    text: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50/50 dark:bg-cyan-950/10',
  },
  high: {
    border: 'border-l-amber-500',
    glow: 'shadow-amber-500/5 dark:shadow-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50/50 dark:bg-amber-950/10',
  },
  critical: {
    border: 'border-l-red-500',
    glow: 'shadow-red-500/10 dark:shadow-red-500/20',
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50/50 dark:bg-red-950/10',
  },
};

export function RecommendationCard({ recommendation, onNavigate }: Readonly<RecommendationCardProps>) {
  const styles = PRIORITY_STYLES[recommendation.priority] || PRIORITY_STYLES.low;
  const Icon = TYPE_ICONS[recommendation.type as keyof typeof TYPE_ICONS] || MapPin;

  return (
    <motion.div
      className={`p-4 rounded-xl border border-l-4 card-surface ${styles.border} ${styles.glow}`}
      role="article"
      aria-label={`Recommendation: ${recommendation.type}`}
      whileHover={{ y: -2, x: 2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0`}
          style={{ background: 'var(--glass-bg-subtle)', border: '1px solid var(--glass-border)' }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: 'hsl(var(--primary))' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-relaxed" style={{ color: 'hsl(var(--fg))' }}>
            {recommendation.message}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3 text-[10px]">
            <span
              className="px-2 py-0.5 rounded-full font-bold uppercase border"
              style={{
                background: 'hsl(var(--elevated))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--muted))',
              }}
            >
              {recommendation.type}
            </span>
            <span style={{ color: 'hsl(var(--border))' }}>•</span>
            <span className="font-semibold capitalize" style={{ color: 'hsl(var(--muted-fg))' }}>
              Priority: {recommendation.priority}
            </span>
          </div>
        </div>

        {recommendation.zone_id && (
          <motion.button
            onClick={() => onNavigate?.(recommendation.zone_id)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex-shrink-0 btn-ghost"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Show</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

interface RecommendationsListProps {
  recommendations: Recommendation[];
  onNavigate?: (zoneId: string) => void;
}

export function RecommendationsList({ recommendations, onNavigate }: Readonly<RecommendationsListProps>) {
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-10 flex flex-col items-center justify-center border border-dashed rounded-xl" style={{ borderColor: 'hsl(var(--border))' }}>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
          style={{ background: 'var(--glass-bg-subtle)', border: '1px solid var(--glass-border)' }}
        >
          <Lightbulb className="w-6 h-6" style={{ color: 'hsl(var(--muted))' }} />
        </div>
        <p className="text-sm font-bold" style={{ color: 'hsl(var(--fg))' }}>No suggestions right now</p>
        <p className="text-xs mt-1 max-w-[240px]" style={{ color: 'hsl(var(--muted-fg))' }}>
          We will display recommendations as crowding events occur.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => (
        <RecommendationCard key={rec.id} recommendation={rec} onNavigate={onNavigate} />
      ))}
    </div>
  );
}