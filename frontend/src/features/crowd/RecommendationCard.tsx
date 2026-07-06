import React from 'react';
import { Recommendation } from '../../shared/types';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const priorityColors: Record<string, string> = {
    low: 'bg-blue-50 border-blue-500 text-blue-800',
    medium: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    high: 'bg-orange-50 border-orange-500 text-orange-800',
    critical: 'bg-red-50 border-red-500 text-red-800',
  };

  const typeIcons: Record<string, string> = {
    food: '🍔',
    restroom: '🚻',
    exit: '🚪',
    safety: '⚠️',
  };

  return (
    <div
      className={`p-4 rounded-lg border-l-4 ${priorityColors[recommendation.priority]}`}
      role="article"
      aria-label={`Recommendation: ${recommendation.type}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">{typeIcons[recommendation.type]}</span>
        <div className="flex-1">
          <p className="text-sm font-medium">{recommendation.message}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs uppercase font-semibold">{recommendation.type}</span>
            <span className="text-xs">•</span>
            <span className="text-xs capitalize">{recommendation.priority}</span>
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
      <div className="text-center py-8 text-gray-500">
        <p>No recommendations at this time</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map(rec => (
        <RecommendationCard key={rec.id} recommendation={rec} />
      ))}
    </div>
  );
}