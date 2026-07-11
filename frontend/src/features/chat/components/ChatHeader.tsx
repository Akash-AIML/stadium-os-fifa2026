import { motion } from 'framer-motion';
import { Mic, MicOff, Bot } from 'lucide-react';

export type ChatHeaderProps = Readonly<{
  isProcessing: boolean;
  isListening: boolean;
  isSupported: boolean;
  language: string;
  startListening: (lang: string) => void;
  stopListening: () => void;
}>;

/** Top bar of the chat panel: bot identity, status, and voice toggle. */
export function ChatHeader({
  isProcessing,
  isListening,
  isSupported,
  language,
  startListening,
  stopListening,
}: ChatHeaderProps) {
  const handleMicClick = isListening ? stopListening : () => startListening(language);

  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
      style={{ borderColor: 'hsl(var(--border))' }}
    >
      <div className="flex items-center gap-3">
        <motion.div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(168,85,247,0.25))' }}
          animate={{ rotate: [0, 3, -3, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Bot className="w-5 h-5" style={{ color: '#06b6d4' }} />
        </motion.div>
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'hsl(var(--fg))' }}>Smart Guide AI</h2>
          <p className="text-[10px]" style={{ color: 'hsl(var(--muted-fg))' }}>
            {isProcessing ? 'Thinking…' : 'FIFA Stadium Assistant'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isSupported && (
          <motion.button
            onClick={handleMicClick}
            className="w-9 h-9 flex items-center justify-center rounded-xl border transition-all"
            style={{
              background:   isListening ? 'rgba(239,68,68,0.1)'  : 'hsl(var(--elevated))',
              borderColor:  isListening ? 'rgba(239,68,68,0.3)'  : 'hsl(var(--border))',
              color:        isListening ? '#ef4444'              : 'hsl(var(--muted))',
            }}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </motion.button>
        )}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border"
          style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)', color: '#10b981' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {' '}Live
        </div>
      </div>
    </div>
  );
}
