import { motion } from 'framer-motion';
import { Trophy, Navigation, Layers, Zap, BarChart2, ArrowRight, Sparkles } from 'lucide-react';
import { StadiumHero3D } from '../../shared/components/StadiumHero3D';

const HERO_FEATURES = [
  { Icon: Navigation, title: 'Smart Nav',     desc: 'Congestion-aware pathfinding'  },
  { Icon: Layers,     title: 'Crowd Heatmap', desc: 'Live stadium zone density'     },
  { Icon: Zap,        title: 'AI Assistant',  desc: 'Speech-supported Fan Copilot' },
  { Icon: BarChart2,  title: 'Live Timeline', desc: 'Match clock time simulation'  },
];

interface HeroScreenProps {
  onEnter: () => void;
}

/** Full-screen 3D landing page shown on first visit. */
export function HeroScreen({ onEnter }: Readonly<HeroScreenProps>) {
  return (
    <motion.div
      key="hero-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ background: 'hsl(var(--bg))' }}
    >
      {/* 3D background */}
      <div className="absolute inset-0 z-0">
        <StadiumHero3D />
      </div>

      {/* Top bar */}
      <header className="relative z-10 w-full px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #a855f7)' }}
          >
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-widest uppercase" style={{ color: 'hsl(var(--fg))' }}>
            FIFA 2026
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="px-3 py-1 rounded-full text-xs font-semibold border"
            style={{ background: 'rgba(6,182,212,0.08)', borderColor: 'rgba(6,182,212,0.2)', color: '#06b6d4' }}
          >
            Smart Guide v2.0
          </div>
          <motion.button
            onClick={onEnter}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all"
            style={{ background: 'hsl(var(--elevated))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted))' }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            aria-label="Skip intro and enter dashboard"
          >
            Skip <ArrowRight className="w-3 h-3" />
          </motion.button>
        </div>
      </header>

      {/* Central glass overlay */}
      <main className="relative z-10 max-w-lg mx-auto w-full px-4 flex flex-col items-center justify-center flex-1">
        <motion.div
          initial={{ scale: 0.96, y: 24, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, type: 'spring', stiffness: 200, damping: 25 }}
          className="glass-panel-strong p-8 text-center w-full"
          style={{ borderRadius: 24 }}
        >
          {/* Logo badge */}
          <motion.div
            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(168,85,247,0.3))' }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Trophy className="w-10 h-10" style={{ color: '#06b6d4' }} />
          </motion.div>

          <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'hsl(var(--fg))' }}>
            FIFA 2026{' '}
            <span className="neon-text-cyan font-light">Smart Guide</span>
          </h1>
          <p className="text-sm leading-relaxed mb-8 max-w-sm mx-auto" style={{ color: 'hsl(var(--muted))' }}>
            Real-time stadium intelligence — navigation, crowd density, AI assistant, and match insights.
          </p>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-8 text-left">
            {HERO_FEATURES.map(({ Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="p-3 rounded-xl flex gap-2.5 items-start"
                style={{ background: 'hsl(var(--elevated))', border: '1px solid hsl(var(--border))' }}
              >
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#06b6d4' }} />
                <div>
                  <p className="text-xs font-bold" style={{ color: 'hsl(var(--fg))' }}>{title}</p>
                  <p className="text-[10px]" style={{ color: 'hsl(var(--muted-fg))' }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.button
            onClick={onEnter}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center gap-2 transition-all"
            style={{
              background: 'linear-gradient(135deg, #0891b2, #3b82f6)',
              boxShadow: '0 8px 32px rgba(6,182,212,0.3)',
            }}
          >
            <Sparkles className="w-4 h-4" />
            Enter Stadium Guide
          </motion.button>
        </motion.div>
      </main>

      <footer className="relative z-10 py-5 text-center text-[10px]" style={{ color: 'hsl(var(--muted-fg))' }}>
        Powered by Google Gemini AI &amp; FastAPI • FIFA 2026
      </footer>
    </motion.div>
  );
}
