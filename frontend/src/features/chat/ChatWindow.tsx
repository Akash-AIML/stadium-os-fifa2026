import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic } from 'lucide-react';
import { useApp } from '../../shared/context/AppContext';
import { useVoice } from '../../shared/hooks/useVoice';
import { useAI } from '../../shared/hooks/useAI';
import { useTextToSpeech } from '../../shared/hooks/useTextToSpeech';
import { useTranslation } from '../../shared/hooks/useTranslation';
import { TypingIndicator } from './components/TypingIndicator';
import { WelcomeView, SUGGESTED_CHIPS } from './components/WelcomeView';
import { MessageBubbleView } from './components/MessageBubbleView';
import { ChatHeader } from './components/ChatHeader';
import { ChatInput } from './components/ChatInput';

const QUICK_ACTION_QUERIES: Record<string, string> = {
  map:       'Show this location on the stadium map',
  navigate:  'Give me directions to the nearest exit from here',
  food:      'Where is the nearest food court with the shortest queue?',
  alt_route: 'Is there an alternative accessible route I can take?',
};

export function ChatWindow({ currentZoneId }: Readonly<{ currentZoneId?: string | null }>) {
  const { state } = useApp();
  const [input, setInput]                     = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } = useVoice();
  const { sendMessage: sendAIMessage, isProcessing } = useAI();
  const { speak, playingMessageId } = useTextToSpeech();
  const { t } = useTranslation();

  // Auto-scroll to newest message
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
    const query = QUICK_ACTION_QUERIES[action];
    if (!query) return;
    setShowSuggestions(false);
    await sendAIMessage(query, currentZoneId);
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: 'hsl(var(--surface))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 20,
      }}
    >
      <ChatHeader
        isProcessing={isProcessing}
        isListening={isListening}
        isSupported={isSupported}
        language={state.user.language}
        startListening={startListening}
        stopListening={stopListening}
      />

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none"
        role="log"
        aria-live="polite"
        aria-label="Chat conversation"
      >
        <AnimatePresence mode="popLayout">
          {state.chat_history.length === 0 && showSuggestions && (
            <WelcomeView key="welcome-view" onChipClick={handleChipClick} t={t} />
          )}

          {state.chat_history.map((msg) => {
            const isLast =
              state.chat_history.length > 0 &&
              msg.id === state.chat_history[state.chat_history.length - 1].id;
            return (
              <MessageBubbleView
                key={msg.id}
                msg={msg}
                isLast={isLast}
                playingMessageId={playingMessageId}
                onQuickAction={handleQuickAction}
                speak={speak}
                userLanguage={state.user.language}
              />
            );
          })}
        </AnimatePresence>

        <AnimatePresence>
          {isProcessing && <TypingIndicator key="typing" />}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Voice transcript preview */}
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

      <ChatInput
        input={input}
        setInput={setInput}
        isProcessing={isProcessing}
        isListening={isListening}
        isSupported={isSupported}
        language={state.user.language}
        transcript={transcript}
        startListening={startListening}
        stopListening={stopListening}
        handleSubmit={handleSubmit}
        inputRef={inputRef}
      />
    </div>
  );
}