import React from 'react';
import { Alert } from '../../shared/types';

interface AlertCardProps {
  alert: Alert;
}

export function AlertCard({ alert }: AlertCardProps) {
  const isCritical = alert.level === 'critical';

  return (
    <div
      className={`p-4 rounded-xl border-l-4 backdrop-blur-md transition-all ${
        isCritical
          ? 'bg-red-950/20 border-red-500/50 text-red-200'
          : 'bg-amber-950/20 border-amber-500/50 text-amber-200'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {isCritical ? (
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold tracking-wide">
            {alert.message}
          </p>
          <p className={`text-xs mt-1 font-mono font-medium ${isCritical ? 'text-red-400/80' : 'text-amber-400/80'}`}>
            ZONE: {alert.zone_id.replace(/_/g, ' ').toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
}

interface DashboardProps {
  alerts: Alert[];
  crowdData?: any[];
}

export function Dashboard({ alerts, crowdData }: DashboardProps) {
  const criticalCount = alerts.filter((a) => a.level === 'critical').length;
  const warningCount = alerts.filter((a) => a.level === 'warning').length;

  const avgDensity =
    crowdData && crowdData.length > 0
      ? (crowdData.reduce((sum, c) => sum + c.density, 0) / crowdData.length * 100).toFixed(0)
      : 0;

  return (
    <div className="space-y-6">
      {/* Grid of stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl backdrop-blur-md shadow-sm hover:border-slate-800 transition-all">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Critical Alerts</p>
          <p className="text-3xl font-extrabold text-red-500 mt-1.5 tracking-tight font-mono">{criticalCount}</p>
        </div>
        <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl backdrop-blur-md shadow-sm hover:border-slate-800 transition-all">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Warnings</p>
          <p className="text-3xl font-extrabold text-amber-500 mt-1.5 tracking-tight font-mono">{warningCount}</p>
        </div>
        <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl backdrop-blur-md shadow-sm hover:border-slate-800 transition-all">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Density</p>
          <p className="text-3xl font-extrabold text-cyan-400 mt-1.5 tracking-tight font-mono">{avgDensity}%</p>
        </div>
        <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl backdrop-blur-md shadow-sm hover:border-slate-800 transition-all">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Zones</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-1.5 tracking-tight font-mono">{crowdData?.length || 0}</p>
        </div>
      </div>

      {/* Active alerts panel */}
      {alerts.length > 0 && (
        <div className="pt-2">
          <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Active Security Alerts
          </h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}