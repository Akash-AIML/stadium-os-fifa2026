import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Mic, MicOff, Bot, MapPin, Utensils, Users,
  Navigation, DoorOpen, Trophy, Zap, Map, RefreshCw,
  Clock, Target, AlertTriangle, MessageSquare, Volume2, VolumeX
} from 'lucide-react';
import { sendChatMessage } from '../../services/api';
import { ChatMessage, IntentType } from '../../shared/types';
import { useApp } from '../../shared/context/AppContext';
import { useVoice } from '../../shared/hooks/useVoice';
import { useAI } from '../../shared/hooks/useAI';
import { useTextToSpeech } from '../../shared/hooks/useTextToSpeech';
import { useTranslation } from '../../shared/hooks/useTranslation';

// ── Chip definitions (Lucide icons) ──────────────────────────────────────────
const SUGGESTED_CHIPS = [
  { Icon: Navigation,  label: 'Navigate',   intent: 'navigate',  color: 'text-cyan-400',    query: 'How do I get to my seat from here?' },
  { Icon: Utensils,    label: 'Food',        intent: 'food',      color: 'text-amber-400',   query: 'Where is the nearest food court with shortest queue?' },
  { Icon: DoorOpen,    label: 'Exit',        intent: 'exit',      color: 'text-emerald-400', query: 'Which exit is closest to me?' },
  { Icon: Users,       label: 'Restroom',    intent: 'restroom',  color: 'text-violet-400',  query: 'Where is the nearest restroom?' },
  { Icon: Map,         label: 'Map',         intent: 'map',       color: 'text-blue-400',    query: 'Show me the stadium map' },
  { Icon: Trophy,      label: 'Match',       intent: 'match',     color: 'text-yellow-400',  query: 'What is the current match status?' },
];

// ── Quick follow-up actions (after AI response) ───────────────────────────────
const QUICK_ACTIONS = [
  { Icon: Map,        label: 'Show on map',   action: 'map'       },
  { Icon: Navigation, label: 'Get directions', action: 'navigate'  },
  { Icon: Utensils,   label: 'Nearby food',    action: 'food'      },
  { Icon: RefreshCw,  label: 'Alt route',      action: 'alt_route' },
];

// ── Intent metadata ───────────────────────────────────────────────────────────
const INTENT_META: Record<IntentType, { label: string; Icon: typeof Zap; color: string }> = {
  [IntentType.NAVIGATION]:    { label: '🧭 Navigation',   Icon: Navigation,     color: 'text-cyan-400    border-cyan-500/30   bg-cyan-500/10'   },
  [IntentType.CROWD_STATUS]:  { label: '📊 Crowd Status', Icon: Users,          color: 'text-amber-400   border-amber-500/30  bg-amber-500/10'  },
  [IntentType.RECOMMENDATION]:{ label: '💡 Suggestion',   Icon: Zap,            color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'},
  [IntentType.GENERAL]:       { label: '💬 General',      Icon: MessageSquare,  color: 'text-slate-400   border-slate-500/30  bg-slate-500/10'  },
};

// ── Stadium SVG illustration for the welcome screen ───────────────────────────
function StadiumIllustration() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" aria-hidden="true">
      {/* Bowl */}
      <ellipse cx="60" cy="50" rx="55" ry="28" fill="none" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
      <ellipse cx="60" cy="50" rx="45" ry="22" fill="none" stroke="rgba(6,182,212,0.2)" strokeWidth="1" />
      {/* Field */}
      <rect x="30" y="38" width="60" height="36" rx="3" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.3)" strokeWidth="1.2" />
      {/* Center line */}
      <line x1="60" y1="38" x2="60" y2="74" stroke="rgba(16,185,129,0.25)" strokeWidth="0.8" />
      {/* Center circle */}
      <circle cx="60" cy="56" r="10" fill="none" stroke="rgba(16,185,129,0.25)" strokeWidth="0.8" />
      {/* Stands */}
      <path d="M 5 50 Q 60 20 115 50" stroke="rgba(6,182,212,0.15)" strokeWidth="6" fill="none" />
      {/* Lights */}
      {[15, 40, 80, 105].map(x => (
        <circle key={x} cx={x} cy={x > 60 ? 18 : 18} r="2.5" fill="#f59e0b" opacity="0.7">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" begin={`${x * 0.02}s`} />
        </circle>
      ))}
    </svg>
  );
}

// ── Animated typing indicator ─────────────────────────────────────────────────
function TypingIndicator() {
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
          {[0, 0.15, 0.3].map((delay, i) => (
            <motion.span
              key={i}
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

// ── Word-by-word animated text (AI messages only) ─────────────────────────────
function AnimatedText({ content }: { content: string }) {
  const words = content.split(' ');
  return (
    <motion.span
      className="whitespace-pre-line leading-relaxed"
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.025 } } }}
    >
      {words.map((word, i) => (
        <React.Fragment key={i}>
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

export function ChatWindow({ currentZoneId }: { currentZoneId?: string | null }) {
  const { state, addChatMessage } = useApp();
  const [input, setInput]                   = useState('');
  const [isLoading, setIsLoading]           = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } = useVoice();
  const { sendMessage: sendAIMessage, isProcessing, suggestions, quickActions, setQuickActions } = useAI();
  const { speak, stop: stopTTS, playingMessageId } = useTextToSpeech();
  const { t } = useTranslation();

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chat_history, isProcessing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = input.trim() || transcript;
    if (!message || isProcessing) return;
    setInput('');
    resetTranscript();
    setShowSuggestions(false);
    await sendAIMessage(message, currentZoneId);
  };

  const handleChipClick = async (chip: typeof SUGGESTED_CHIPS[0]) => {
    setShowSuggestions(false);
    await sendAIMessage(chip.query, currentZoneId);
  };

  const handleQuickAction = async (action: string) => {
    const actionQueries: Record<string, string> = {
      map:       'Show this location on the stadium map',
      navigate:  'Give me directions to the nearest exit from here',
      food:      'Where is the nearest food court with the shortest queue?',
      alt_route: 'Is there an alternative accessible route I can take?',
    };
    const query = actionQueries[action];
    if (query) {
      setShowSuggestions(false);
      await sendAIMessage(query, currentZoneId);
    }
  };

  const getIntentMeta = (intent: IntentType) => INTENT_META[intent] ?? INTENT_META[IntentType.GENERAL];

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: 'hsl(var(--surface))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 20,
      }}
    >
      {/* ── Header ────────────────────────────────────────────── */}
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
              onClick={isListening ? stopListening : () => startListening(state.user.language)}
              className="w-9 h-9 flex items-center justify-center rounded-xl border transition-all"
              style={{
                background: isListening ? 'rgba(239,68,68,0.1)' : 'hsl(var(--elevated))',
                borderColor: isListening ? 'rgba(239,68,68,0.3)' : 'hsl(var(--border))',
                color: isListening ? '#ef4444' : 'hsl(var(--muted))',
              }}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </motion.button>
          )}
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border"
            style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)', color: '#10b981' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none"
        role="log"
        aria-live="polite"
        aria-label="Chat conversation"
      >
        <AnimatePresence mode="popLayout">
          {/* ── Welcome / empty state ─────────────────────── */}
          {state.chat_history.length === 0 && showSuggestions && (
            <motion.div
              key="welcome"
              className="flex flex-col items-center text-center py-6 gap-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Illustration */}
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

              {/* Featured question tiles — 2×2 grid */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-[280px]">
                {SUGGESTED_CHIPS.slice(0, 4).map((chip, i) => (
                  <motion.button
                    key={chip.intent}
                    onClick={() => handleChipClick(chip)}
                    className="flex flex-col items-start gap-2 p-3 rounded-xl text-left transition-all"
                    style={{
                      background: 'hsl(var(--elevated))',
                      border: '1px solid hsl(var(--border))',
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border-strong))';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px hsl(var(--shadow-color) / 0.1)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  >
                    <chip.Icon className={`w-4 h-4 ${chip.color}`} />
                    <span className="text-xs font-semibold" style={{ color: 'hsl(var(--fg))' }}>{chip.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Remaining chips as a row */}
              <div className="flex flex-wrap gap-1.5 justify-center">
                {SUGGESTED_CHIPS.slice(4).map((chip, i) => (
                  <motion.button
                    key={chip.intent}
                    onClick={() => handleChipClick(chip)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                    style={{
                      background: 'hsl(var(--elevated))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--muted))',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <chip.Icon className={`w-3 h-3 ${chip.color}`} />
                    {chip.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Message bubbles ───────────────────────────── */}
          {state.chat_history.map((msg, idx) => {
            const isUser    = msg.role === 'user';
            const isLast    = idx === state.chat_history.length - 1;
            const intentMeta = getIntentMeta(msg.intent);
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
                {/* AI avatar */}
                {!isUser && (
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 self-end"
                    style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(168,85,247,0.2))' }}
                  >
                    <Bot className="w-4 h-4" style={{ color: '#06b6d4' }} />
                  </div>
                )}

                <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'} max-w-[82%]`}>
                  {/* Bubble */}
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

                        {/* Meta row */}
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
                            onClick={() => speak(msg.content, state.user.language, msg.id)}
                            className="flex items-center gap-1 text-[10px] ml-auto p-1 rounded hover:bg-slate-800 transition-colors"
                            style={{ color: playingMessageId === msg.id ? '#06b6d4' : 'hsl(var(--muted-fg))' }}
                            title="Speak Aloud"
                          >
                            {playingMessageId === msg.id ? <VolumeX className="w-3 h-3 text-cyan-400" /> : <Volume2 className="w-3 h-3" />}
                            <span>Speak</span>
                          </button>
                        </div>

                        {/* Quick follow-ups (last message only) */}
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
                                onClick={() => handleQuickAction(action)}
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

                  {/* Timestamp */}
                  <span className="text-[9px] px-1 tabular-nums" style={{ color: 'hsl(var(--muted-fg))' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {isProcessing && <TypingIndicator key="typing" />}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ── Voice transcript preview ─────────────────────────── */}
      <AnimatePresence>
        {transcript && !input && (
          <motion.div
            className="mx-4 mb-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs border"
            style={{
              background: 'rgba(6,182,212,0.06)',
              borderColor: 'rgba(6,182,212,0.2)',
              color: '#06b6d4',
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Mic className="w-3.5 h-3.5 animate-pulse flex-shrink-0" />
            <span className="flex-1 truncate">"{transcript}"</span>
            <span className="opacity-60">↵ to send</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input bar ────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 border-t flex-shrink-0"
        style={{ borderColor: 'hsl(var(--border))' }}
      >
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isListening ? 'Listening…' : 'Ask about stadium, crowd, food, navigation...'}
              className="input-field pr-3"
              aria-label="Chat message input"
              disabled={isProcessing}
              style={{ paddingRight: '0.75rem' }}
            />
          </div>

          {isSupported && (
            <motion.button
              type="button"
              onClick={isListening ? stopListening : () => startListening(state.user.language)}
              className="w-10 h-10 flex items-center justify-center rounded-xl border transition-all flex-shrink-0"
              style={{
                background: isListening ? 'rgba(239,68,68,0.1)' : 'hsl(var(--elevated))',
                borderColor: isListening ? 'rgba(239,68,68,0.3)' : 'hsl(var(--border))',
                color: isListening ? '#ef4444' : 'hsl(var(--muted))',
              }}
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? (
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                  <MicOff className="w-4 h-4" />
                </motion.div>
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </motion.button>
          )}

          <motion.button
            type="submit"
            disabled={isProcessing || (!input.trim() && !transcript)}
            className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 transition-all"
            style={{
              background: isProcessing || (!input.trim() && !transcript) ? 'hsl(var(--elevated))' : 'hsl(var(--primary))',
              color: isProcessing || (!input.trim() && !transcript) ? 'hsl(var(--muted-fg))' : 'white',
              border: '1px solid transparent',
              opacity: isProcessing || (!input.trim() && !transcript) ? 0.5 : 1,
            }}
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
            aria-label="Send message"
          >
            <motion.div
              animate={{ rotate: isProcessing ? 360 : 0 }}
              transition={{ duration: 1, repeat: isProcessing ? Infinity : 0, ease: 'linear' }}
            >
              <Send className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </div>
      </form>
    </div>
  );
}