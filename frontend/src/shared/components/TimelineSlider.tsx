import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, Timer, Flag, Coffee, DoorOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';

// ── Match phases (icon refs, no emojis) ──────────────────────────────────────
const TIMELINE_STEPS = [
  { id: 'pre',      label: 'Pre-Match',  time: -30, Icon: DoorOpen, color: '#10b981', desc: 'Gates opening, fans arriving'         },
  { id: 'kickoff',  label: 'Kick-off',   time: 0,   Icon: Zap,      color: '#06b6d4', desc: 'Match starts, all seated'             },
  { id: 'min15',    label: '15\'',        time: 15,  Icon: Timer,    color: '#a855f7', desc: 'First quarter, concessions busy'      },
  { id: 'halftime', label: 'Half Time',  time: 45,  Icon: Coffee,   color: '#f59e0b', desc: 'Break, high concourse traffic'        },
  { id: 'min60',    label: '60\'',        time: 60,  Icon: Timer,    color: '#a855f7', desc: 'Second half, sustained energy'        },
  { id: 'min75',    label: '75\'',        time: 75,  Icon: Zap,      color: '#f97316', desc: 'Final push, tension rising'           },
  { id: 'fulltime', label: 'Full Time',  time: 90,  Icon: Flag,     color: '#10b981', desc: 'Match ends, exit surge'               },
  { id: 'exit',     label: 'Exit',       time: 105, Icon: DoorOpen, color: '#06b6d4', desc: 'Stadium clearing, transport peak'     },
] as const;

const MIN_TIME = -30;
const MAX_TIME = 105;

// ── Match segment bands ───────────────────────────────────────────────────────
const SEGMENTS = [
  { label: 'Pre',      from: -30, to:  0,  color: '#10b981' },
  { label: '1st Half', from:   0, to: 45,  color: '#06b6d4' },
  { label: 'Half Time',from:  45, to: 60,  color: '#f59e0b' },
  { label: '2nd Half', from:  60, to: 90,  color: '#a855f7' },
  { label: 'Post',     from:  90, to: 105, color: '#ef4444' },
];

function getPos(t: number) {
  return ((t - MIN_TIME) / (MAX_TIME - MIN_TIME)) * 100;
}

export function TimelineSlider() {
  const { state, setSimulationTime } = useApp();
  const [isDragging, setIsDragging]   = useState(false);
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const currentStep = [...TIMELINE_STEPS].reverse().find(s => state.simulation_time >= s.time) ?? TIMELINE_STEPS[0];
  const CurrentIcon = currentStep.Icon;

  // ── Drag logic ─────────────────────────────────────────────────
  const calculateTime = useCallback((clientX: number) => {
    if (!sliderRef.current) return state.simulation_time;
    const rect = sliderRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(MIN_TIME + ratio * (MAX_TIME - MIN_TIME));
  }, [state.simulation_time]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setSimulationTime(calculateTime(e.clientX));
  }, [calculateTime, setSimulationTime]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => setSimulationTime(calculateTime(e.clientX));
    const onUp   = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',  onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [isDragging, calculateTime, setSimulationTime]);

  const progressPct = getPos(state.simulation_time);

  return (
    <motion.div
      className="p-5 overflow-hidden"
      style={{
        background: 'hsl(var(--surface))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 16,
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Phase header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${currentStep.color}18`, border: `1px solid ${currentStep.color}35` }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <CurrentIcon className="w-5 h-5" style={{ color: currentStep.color }} />
          </motion.div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-fg))' }}>
              Current Phase
            </p>
            <p className="text-sm font-bold" style={{ color: 'hsl(var(--fg))' }}>
              {currentStep.label}
            </p>
          </div>
        </div>

        {/* Match clock */}
        <div className="flex items-center gap-2 text-right">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'hsl(var(--muted-fg))' }}>
              Match Clock
            </p>
            <motion.p
              className="text-xl font-black tabular-nums font-mono"
              style={{ color: currentStep.color }}
              key={state.simulation_time}
              initial={{ scale: 1.1, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {state.simulation_time >= 0 ? `${state.simulation_time}'` : 'Pre'}
            </motion.p>
          </div>
          <Clock className="w-4 h-4" style={{ color: 'hsl(var(--muted))' }} />
        </div>
      </div>

      {/* ── Segment bands + track ─────────────────────────────── */}
      <div
        ref={sliderRef}
        className="relative cursor-pointer select-none"
        style={{ paddingTop: 20, paddingBottom: 28 }}
        onMouseDown={handleMouseDown}
        role="slider"
        aria-valuemin={MIN_TIME}
        aria-valuemax={MAX_TIME}
        aria-valuenow={state.simulation_time}
        aria-label="Match time simulation"
      >
        {/* Segment labels */}
        <div className="absolute top-0 left-0 right-0 flex" style={{ height: 16 }}>
          {SEGMENTS.map(seg => {
            const left  = getPos(seg.from);
            const width = getPos(seg.to) - left;
            const isActive = state.simulation_time >= seg.from && state.simulation_time < seg.to;
            return (
              <div
                key={seg.label}
                className="absolute text-center flex items-center justify-center"
                style={{ left: `${left}%`, width: `${width}%`, top: 0, height: 16 }}
              >
                <span
                  className="text-[9px] font-semibold uppercase tracking-wide px-1 truncate"
                  style={{ color: isActive ? seg.color : 'hsl(var(--muted-fg))' }}
                >
                  {seg.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Track background */}
        <div
          className="relative overflow-hidden"
          style={{ height: 8, borderRadius: 4, background: 'hsl(var(--elevated))', border: '1px solid hsl(var(--border))' }}
        >
          {/* Segment color bands (completed) */}
          {SEGMENTS.map(seg => {
            const fromPct = getPos(seg.from);
            const toPct   = getPos(seg.to);
            const fillEnd = Math.min(progressPct, toPct);
            if (fillEnd <= fromPct) return null;
            return (
              <motion.div
                key={seg.label}
                className="absolute top-0 bottom-0"
                style={{ left: `${fromPct}%`, background: seg.color, opacity: 0.85 }}
                initial={{ width: 0 }}
                animate={{ width: `${fillEnd - fromPct}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            );
          })}

          {/* Segment dividers */}
          {SEGMENTS.slice(1).map(seg => (
            <div
              key={seg.label}
              className="absolute top-0 bottom-0 w-px"
              style={{ left: `${getPos(seg.from)}%`, background: 'hsl(var(--bg) / 0.6)' }}
            />
          ))}
        </div>

        {/* Step markers */}
        {TIMELINE_STEPS.map((step, i) => {
          const pos       = getPos(step.time);
          const isActive  = state.simulation_time >= step.time;
          const isCurrent = currentStep.id === step.id;
          const isHov     = hoveredStep === step.id;

          return (
            <motion.button
              key={step.id}
              className="absolute z-10"
              style={{
                left: `${pos}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: isCurrent ? 16 : 12,
                height: isCurrent ? 16 : 12,
                borderRadius: '50%',
                background: isActive ? step.color : 'hsl(var(--elevated))',
                border: `2px solid ${isActive ? step.color : 'hsl(var(--border-strong))'}`,
                boxShadow: isCurrent ? `0 0 0 3px ${step.color}30, 0 0 16px ${step.color}50` : 'none',
              }}
              onMouseEnter={() => setHoveredStep(step.id)}
              onMouseLeave={() => setHoveredStep(null)}
              onClick={e => { e.stopPropagation(); setSimulationTime(step.time); }}
              aria-label={`${step.label} (${step.time >= 0 ? step.time + "'" : 'Pre-Match'})`}
              whileHover={{ scale: 1.6 }}
              whileTap={{ scale: 1.1 }}
            />
          );
        })}

        {/* Draggable thumb */}
        <motion.div
          className="absolute z-20 pointer-events-none"
          style={{
            left: `${progressPct}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: isDragging ? 24 : 20,
            height: isDragging ? 24 : 20,
            borderRadius: '50%',
            background: 'hsl(var(--bg))',
            border: `3px solid ${currentStep.color}`,
            boxShadow: `0 0 0 2px hsl(var(--bg)), 0 4px 12px rgba(0,0,0,0.3), 0 0 20px ${currentStep.color}50`,
          }}
          animate={{ scale: isDragging ? 1.2 : 1 }}
          transition={{ duration: 0.15 }}
        />

        {/* Step labels below the track */}
        <div className="absolute left-0 right-0 flex" style={{ top: 'calc(50% + 12px)' }}>
          {TIMELINE_STEPS.map((step, i) => {
            const pos      = getPos(step.time);
            const isActive = state.simulation_time >= step.time;
            const isCurr   = currentStep.id === step.id;
            // Only show subset to prevent overlap
            if (i % 2 !== 0 && i !== TIMELINE_STEPS.length - 1) return null;
            return (
              <div
                key={step.id}
                className="absolute text-center"
                style={{ left: `${pos}%`, transform: 'translateX(-50%)', width: 40 }}
              >
                <p className="text-[9px] font-semibold truncate"
                  style={{ color: isCurr ? step.color : isActive ? 'hsl(var(--muted))' : 'hsl(var(--muted-fg))' }}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Hover tooltip */}
        <AnimatePresence>
          {hoveredStep && (() => {
            const s    = TIMELINE_STEPS.find(st => st.id === hoveredStep)!;
            const HovIcon = s.Icon;
            return (
              <motion.div
                key={s.id}
                className="absolute bottom-full mb-6 z-30 pointer-events-none"
                style={{ left: `${getPos(s.time)}%`, transform: 'translateX(-50%)' }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12 }}
              >
                <div
                  className="rounded-xl px-3 py-2 whitespace-nowrap text-left"
                  style={{
                    background: 'var(--glass-bg-strong)',
                    border: `1px solid ${s.color}30`,
                    backdropFilter: 'blur(16px)',
                    boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px var(--glass-border)`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <HovIcon className="w-3.5 h-3.5" style={{ color: s.color }} />
                    <span className="text-xs font-bold" style={{ color: 'hsl(var(--fg))' }}>{s.label}</span>
                    <span className="text-xs font-mono tabular-nums" style={{ color: s.color }}>
                      {s.time >= 0 ? `${s.time}'` : 'Pre'}
                    </span>
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--muted))' }}>{s.desc}</p>
                </div>
                {/* Arrow */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    bottom: -5,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: `5px solid ${s.color}30`,
                  }}
                />
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {/* ── Quick jump buttons ────────────────────────────────── */}
      <div
        className="flex flex-wrap gap-1.5 pt-4 mt-1 border-t"
        style={{ borderColor: 'hsl(var(--border))' }}
      >
        {TIMELINE_STEPS.filter((_, i) => i % 2 === 0).map(step => {
          const StepIcon = step.Icon;
          const isActive = currentStep.id === step.id;
          return (
            <motion.button
              key={step.id}
              onClick={() => setSimulationTime(step.time)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={{
                background:  isActive ? `${step.color}12` : 'hsl(var(--elevated))',
                borderColor: isActive ? `${step.color}30` : 'hsl(var(--border))',
                color:       isActive ? step.color : 'hsl(var(--muted))',
              }}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              aria-pressed={isActive}
            >
              <StepIcon className="w-3 h-3" />
              {step.label}
            </motion.button>
          );
        })}
      </div>

      {/* Current phase description */}
      <AnimatePresence mode="wait">
        <motion.p
          key={currentStep.id}
          className="mt-3 text-xs"
          style={{ color: 'hsl(var(--muted-fg))' }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep.desc}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}