import React from 'react';
import { Recommendation } from '../../shared/types';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const priorityBorders: Record<string, string> = {
    low: 'border-l-blue-500 border-y-slate-900/80 border-r-slate-900/80',
    medium: 'border-l-amber-500 border-y-slate-900/80 border-r-slate-900/80',
    high: 'border-l-orange-500 border-y-slate-900/80 border-r-slate-900/80',
    critical: 'border-l-red-500 border-y-slate-900/80 border-r-slate-900/80',
  };

  const typeIcons: Record<string, string> = {
    food: '🍔',
    restroom: '🚻',
    exit: '🚪',
    safety: '⚠️',
  };

  return (
    <div
      className={`p-4 rounded-xl border bg-slate-900/30 backdrop-blur-sm transition-all hover:bg-slate-900/50 border-l-4 ${priorityBorders[recommendation.priority] || priorityBorders.low}`}
      role="article"
      aria-label={`Recommendation: ${recommendation.type}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5" aria-hidden="true">
          {typeIcons[recommendation.type] || '💡'}
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-relaxed text-slate-200">
            {recommendation.message}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3 text-[10px]">
            <span className="px-2 py-0.5 rounded-md font-bold tracking-wider uppercase bg-slate-950 border border-slate-800/80 text-slate-400">
              {recommendation.type}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-medium capitalize">
              Priority: {recommendation.priority}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RecommendationsListProps {
  recommendations: Recommendation[];
}

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500 flex flex-col items-center justify-center">
        <div className="text-3xl mb-2 opacity-35">💡</div>
        <p className="text-sm font-semibold text-slate-400">No suggestions right now</p>
        <p className="text-xs mt-1 text-slate-500">We will display recommendations as crowding events occur.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => (
        <RecommendationCard key={rec.id} recommendation={rec} />
      ))}
    </div>
  );
}