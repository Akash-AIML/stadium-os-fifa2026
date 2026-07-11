import { motion } from 'framer-motion';
import { Navigation, DoorOpen, Users, Map, Trophy } from 'lucide-react';

export const SUGGESTED_CHIPS = [
  { Icon: Navigation, label: 'Navigate',  intent: 'navigate',  color: 'text-cyan-400',    query: 'How do I get to my seat from here?'                     },
  { Icon: Navigation, label: 'Food',      intent: 'food',      color: 'text-amber-400',   query: 'Where is the nearest food court with shortest queue?'   },
  { Icon: DoorOpen,   label: 'Exit',      intent: 'exit',      color: 'text-emerald-400', query: 'Which exit is closest to me?'                           },
  { Icon: Users,      label: 'Restroom',  intent: 'restroom',  color: 'text-violet-400',  query: 'Where is the nearest restroom?'                         },
  { Icon: Map,        label: 'Map',       intent: 'map',       color: 'text-blue-400',    query: 'Show me the stadium map'                                },
  { Icon: Trophy,     label: 'Match',     intent: 'match',     color: 'text-yellow-400',  query: 'What is the current match status?'                      },
];

function StadiumIllustration() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" aria-hidden="true">
      <ellipse cx="60" cy="50" rx="55" ry="28" fill="none" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
      <ellipse cx="60" cy="50" rx="45" ry="22" fill="none" stroke="rgba(6,182,212,0.2)" strokeWidth="1" />
      <rect x="30" y="38" width="60" height="36" rx="3" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.3)" strokeWidth="1.2" />
      <line x1="60" y1="38" x2="60" y2="74" stroke="rgba(16,185,129,0.25)" strokeWidth="0.8" />
      <circle cx="60" cy="56" r="10" fill="none" stroke="rgba(16,185,129,0.25)" strokeWidth="0.8" />
      <path d="M 5 50 Q 60 20 115 50" stroke="rgba(6,182,212,0.15)" strokeWidth="6" fill="none" />
      {[15, 40, 80, 105].map(x => (
        <circle key={x} cx={x} cy={18} r="2.5" fill="#f59e0b" opacity="0.7">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" begin={`${x * 0.02}s`} />
        </circle>
      ))}
    </svg>
  );
}

interface WelcomeViewProps {
  onChipClick: (chip: typeof SUGGESTED_CHIPS[0]) => void;
  t: (key: string) => string;
}

/** Empty-state welcome screen with suggestion chips. */
export function WelcomeView({ onChipClick, t }: Readonly<WelcomeViewProps>) {
  return (
    <motion.div
      key="welcome"
      className="flex flex-col items-center text-center py-6 gap-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <StadiumIllustration />
      </motion.div>

      <div>
        <h3 className="text-base font-bold mb-1" style={{ color: 'hsl(var(--fg))' }}>
          {t('stadium_os_assistant')}
        </h3>
        <p className="text-xs max-w-[220px] leading-relaxed" style={{ color: 'hsl(var(--muted))' }}>
          {t('welcome_message')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full max-w-[280px]">
        {SUGGESTED_CHIPS.slice(0, 4).map((chip) => (
          <motion.button
            key={chip.intent}
            onClick={() => onChipClick(chip)}
            className="flex flex-col items-start gap-2 p-3 rounded-xl text-left transition-all"
            style={{ background: 'hsl(var(--elevated))', border: '1px solid hsl(var(--border))' }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <chip.Icon className={`w-4 h-4 ${chip.color}`} />
            <span className="text-xs font-semibold" style={{ color: 'hsl(var(--fg))' }}>{chip.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center">
        {SUGGESTED_CHIPS.slice(4).map((chip) => (
          <motion.button
            key={chip.intent}
            onClick={() => onChipClick(chip)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
            style={{
              background: 'hsl(var(--elevated))',
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--muted))',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <chip.Icon className={`w-3 h-3 ${chip.color}`} />
            {chip.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
