import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

/** Three-dot bounce animation displayed while the AI is processing. */
export function TypingIndicator() {
  return (
    <motion.div
      className="flex justify-start"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(168,85,247,0.2))' }}
        >
          <Bot className="w-4 h-4" style={{ color: '#06b6d4' }} />
        </div>
        <div
          className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5"
          style={{
            background: 'hsl(var(--elevated))',
            border: '1px solid hsl(var(--border))',
          }}
        >
          {[0, 0.15, 0.3].map((delay) => (
            <motion.span
              key={delay}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#06b6d4' }}
              animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, delay, repeat: Infinity }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
