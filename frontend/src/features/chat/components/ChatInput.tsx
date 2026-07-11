import React from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, MicOff } from 'lucide-react';

// ── Style helpers (keep complexity low) ──────────────────────────────────────
function getMicStyle(isListening: boolean) {
  return {
    background:  isListening ? 'rgba(239,68,68,0.1)' : 'hsl(var(--elevated))',
    borderColor: isListening ? 'rgba(239,68,68,0.3)' : 'hsl(var(--border))',
    color:       isListening ? '#ef4444'             : 'hsl(var(--muted))',
  };
}

function getSubmitStyle(disabled: boolean) {
  return {
    background: disabled ? 'hsl(var(--elevated))' : 'hsl(var(--primary))',
    color:      disabled ? 'hsl(var(--muted-fg))' : 'white',
    border:     '1px solid transparent',
    opacity:    disabled ? 0.5 : 1,
  };
}

export type ChatInputProps = Readonly<{
  input: string;
  setInput: (val: string) => void;
  isProcessing: boolean;
  isListening: boolean;
  isSupported: boolean;
  language: string;
  transcript: string;
  startListening: (lang: string) => void;
  stopListening: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}>;

/** Bottom form: text input, mic button, send button. */
export function ChatInput({
  input,
  setInput,
  isProcessing,
  isListening,
  isSupported,
  language,
  transcript,
  startListening,
  stopListening,
  handleSubmit,
  inputRef,
}: ChatInputProps) {
  const isSubmitDisabled = isProcessing || (!input.trim() && !transcript);
  const handleMicClick   = isListening ? stopListening : () => startListening(language);
  const placeholder      = isListening ? 'Listening…' : 'Ask about stadium, crowd, food, navigation...';

  return (
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
            placeholder={placeholder}
            className="input-field pr-3"
            aria-label="Chat message input"
            disabled={isProcessing}
            style={{ paddingRight: '0.75rem' }}
          />
        </div>

        {isSupported && (
          <motion.button
            type="button"
            onClick={handleMicClick}
            className="w-10 h-10 flex items-center justify-center rounded-xl border transition-all flex-shrink-0"
            style={getMicStyle(isListening)}
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
          disabled={isSubmitDisabled}
          className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 transition-all"
          style={getSubmitStyle(isSubmitDisabled)}
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
  );
}
