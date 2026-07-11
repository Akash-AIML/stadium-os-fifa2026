import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert } from '../types';

interface ToastSystemProps {
  alerts: Alert[];
}

export function ToastSystem({ alerts }: Readonly<ToastSystemProps>) {
  const [activeToasts, setActiveToasts] = useState<Alert[]>([]);

  useEffect(() => {
    // Whenever new alerts arrive, show them
    if (alerts.length > 0) {
      // Find alerts that aren't already active
      const newAlerts = alerts.filter(
        (a) => !activeToasts.some((toast) => toast.id === a.id)
      );
      if (newAlerts.length > 0) {
        setActiveToasts((prev) => [...prev, ...newAlerts].slice(-3)); // Limit to last 3 toasts
      }
    }
  }, [alerts, activeToasts]);

  const removeToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {activeToasts.map((alert) => (
          <motion.div
            key={alert.id}
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl backdrop-blur-lg border flex gap-3 ${
              alert.level === 'critical'
                ? 'bg-red-950/85 border-red-500/50 text-red-200 shadow-red-500/10'
                : 'bg-amber-950/85 border-amber-500/50 text-amber-200 shadow-amber-500/10'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {alert.level === 'critical' ? (
                <span className="text-xl">🚨</span>
              ) : (
                <span className="text-xl">⚠️</span>
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider opacity-60">
                {alert.level} Event
              </h4>
              <p className="text-sm font-semibold leading-snug mt-0.5">
                {alert.message}
              </p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded bg-black/40 border border-white/5 text-[10px] font-mono">
                {alert.zone_id.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => removeToast(alert.id)}
              className="text-slate-400 hover:text-white self-start text-xs p-1 focus:outline-none"
              aria-label="Dismiss toast"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
