import React from 'react';
import { motion } from 'framer-motion';
import {
  Bot, Zap, Target, AlertTriangle,
  Map, Navigation, RefreshCw,
  Volume2, VolumeX,
} from 'lucide-react';
import { ChatMessage, IntentType } from '../../../shared/types';

// ── Quick follow-up actions shown after the last AI response ─────────────────
export const QUICK_ACTIONS = [
  { Icon: Map,        label: 'Show on map',   action: 'map'       },
  { Icon: Navigation, label: 'Get directions', action: 'navigate'  },
  { Icon: Navigation, label: 'Nearby food',    action: 'food'      },
  { Icon: RefreshCw,  label: 'Alt route',      action: 'alt_route' },
];

// ── Intent badge metadata ─────────────────────────────────────────────────────
const INTENT_META: Record<IntentType, { label: string; Icon: typeof Zap; color: string }> = {
  [IntentType.NAVIGATION]:    { label: '🧭 Navigation',   Icon: Navigation, color: 'text-cyan-400    border-cyan-500/30   bg-cyan-500/10'   },
  [IntentType.CROWD_STATUS]:  { label: '📊 Crowd Status', Icon: Zap,        color: 'text-amber-400   border-amber-500/30  bg-amber-500/10'  },
  [IntentType.RECOMMENDATION]:{ label: '💡 Suggestion',   Icon: Zap,        color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'},
  [IntentType.GENERAL]:       { label: '💬 General',      Icon: Zap,        color: 'text-slate-400   border-slate-500/30  bg-slate-500/10'  },
};

// ── Word-by-word animated text (last AI message only) ────────────────────────
function AnimatedText({ content }: Readonly<{ content: string }>) {
  const words = content.split(' ');
  return (
    <motion.span
      className="whitespace-pre-line leading-relaxed"
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.025 } } }}
    >
      {words.map((word, i) => (
        <React.Fragment key={`${word}-${i}`}>
          <motion.span
            className="inline-block"
            variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.18 } } }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && ' '}
        </React.Fragment>
      ))}
    </motion.span>
  );
}

export interface MessageBubbleViewProps {
  msg: ChatMessage;
  isLast: boolean;
  playingMessageId: string | null;
  onQuickAction: (action: string) => void;
  speak: (text: string, lang: string, id: string) => void;
  userLanguage: string;
}

/** Renders a single chat message bubble (user or AI). */
export function MessageBubbleView({
  msg,
  isLast,
  playingMessageId,
  onQuickAction,
  speak,
  userLanguage,
}: Readonly<MessageBubbleViewProps>) {
  const isUser = msg.role === 'user';
  const intentMeta = INTENT_META[msg.intent] ?? INTENT_META[IntentType.GENERAL];
  const [tColor, bColor, bgColor] = intentMeta.color.split('   ');

  return (
    <motion.div
      key={msg.id}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: isUser ? 10 : -10 }}
      transition={{ duration: 0.25, type: 'spring', stiffness: 400, damping: 30 }}
    >
      {!isUser && (
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 self-end"
          style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(168,85,247,0.2))' }}
        >
          <Bot className="w-4 h-4" style={{ color: '#06b6d4' }} />
        </div>
      )}

      <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'} max-w-[82%]`}>
        <motion.div
          className={isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}
          initial={{ scale: 0.94 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {msg.role === 'model' ? (
            <>
              <div className="text-sm leading-relaxed">
                {isLast ? <AnimatedText content={msg.content} /> : msg.content}
              </div>

              <div
                className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t"
                style={{ borderColor: 'hsl(var(--border))' }}
              >
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tColor} ${bColor} ${bgColor}`}>
                  <intentMeta.Icon className="w-2.5 h-2.5" />
                  {intentMeta.label}
                </span>
                {msg.response_time && (
                  <span className="flex items-center gap-1 text-[10px] tabular-nums" style={{ color: 'hsl(var(--muted-fg))' }}>
                    <Zap className="w-2.5 h-2.5" />
                    {msg.response_time.toFixed(0)}ms
                  </span>
                )}
                {msg.confidence && (
                  <span className="flex items-center gap-1 text-[10px] tabular-nums" style={{ color: 'hsl(var(--muted-fg))' }}>
                    <Target className="w-2.5 h-2.5" />
                    {(msg.confidence * 100).toFixed(0)}%
                  </span>
                )}
                {msg.is_fallback && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-amber-500">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    Limited
                  </span>
                )}
                <button
                  onClick={() => speak(msg.content, userLanguage, msg.id)}
                  className="flex items-center gap-1 text-[10px] ml-auto p-1 rounded hover:bg-slate-800 transition-colors"
                  style={{ color: playingMessageId === msg.id ? '#06b6d4' : 'hsl(var(--muted-fg))' }}
                  title="Speak Aloud"
                >
                  {playingMessageId === msg.id
                    ? <VolumeX className="w-3 h-3 text-cyan-400" />
                    : <Volume2 className="w-3 h-3" />}
                  <span>Speak</span>
                </button>
              </div>

              {isLast && (
                <motion.div
                  className="flex flex-wrap gap-1.5 mt-3"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {QUICK_ACTIONS.map(({ Icon, label, action }, i) => (
                    <motion.button
                      key={action}
                      onClick={() => onQuickAction(action)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all"
                      style={{
                        background: 'hsl(var(--surface))',
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--primary))',
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.06 }}
                      whileHover={{ scale: 1.04, y: -1 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </>
          ) : (
            <p className="text-sm leading-relaxed">{msg.content}</p>
          )}
        </motion.div>

        <span className="text-[9px] px-1 tabular-nums" style={{ color: 'hsl(var(--muted-fg))' }}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}
