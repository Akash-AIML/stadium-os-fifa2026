import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, IntentType } from '../../shared/types';
import { sendChatMessage } from '../../services/api';
import { useApp } from '../../shared/context/AppContext';

interface ChatWindowProps {
  currentZoneId?: string | null;
}

export function ChatWindow({ currentZoneId }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { state, addChatMessage } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.chat_history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
      intent: IntentType.GENERAL,
      context_snapshot: [],
      is_fallback: false,
      language: state.user.language,
    };

    addChatMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(
        input.trim(),
        state.user.language,
        currentZoneId || undefined,
        state.user.seat_number
      );
      addChatMessage(response.message);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'model',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        intent: IntentType.GENERAL,
        context_snapshot: [],
        is_fallback: true,
        language: state.user.language,
      };
      addChatMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getIntentStyle = (intent: IntentType): string => {
    const styles = {
      [IntentType.NAVIGATION]: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
      [IntentType.CROWD_STATUS]: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      [IntentType.RECOMMENDATION]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
      [IntentType.GENERAL]: 'bg-slate-500/10 text-slate-400 border-slate-500/25',
    };
    return styles[intent] || styles[IntentType.GENERAL];
  };

  const getIntentLabel = (intent: IntentType): string => {
    const labels = {
      [IntentType.NAVIGATION]: '🧭 Navigation',
      [IntentType.CROWD_STATUS]: '📊 Crowd Status',
      [IntentType.RECOMMENDATION]: '💡 Suggestion',
      [IntentType.GENERAL]: '💬 General',
    };
    return labels[intent];
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-0" role="log" aria-live="polite" aria-label="Chat messages">
        {state.chat_history.length === 0 ? (
          <div className="text-center py-20 text-slate-500 flex flex-col items-center justify-center">
            <div className="text-4xl mb-4 opacity-50">🤖</div>
            <p className="text-base font-semibold text-slate-400">Smart Guide AI Assistant</p>
            <p className="text-xs mt-1 max-w-xs text-slate-500 leading-relaxed">
              Ask about navigation routes, real-time section crowd densites, or food court recommendations.
            </p>
          </div>
        ) : (
          state.chat_history.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 shadow-md border ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-tr-none border-blue-500/35'
                    : 'bg-slate-900/60 text-slate-100 rounded-tl-none border-slate-800/80 backdrop-blur-md'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                {msg.role === 'model' && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[10px]">
                    <span className={`px-2 py-0.5 rounded-full border ${getIntentStyle(msg.intent)}`}>
                      {getIntentLabel(msg.intent)}
                    </span>
                    {msg.response_time && (
                      <span className="text-slate-400 font-mono">⚡ {msg.response_time.toFixed(0)}ms</span>
                    )}
                    {msg.is_fallback && (
                      <span className="text-amber-500 font-medium">⚠️ Limited mode</span>
                    )}
                  </div>
                )}
                <div className="mt-1.5 flex justify-end">
                  <span className="text-[9px] text-slate-400/50 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl rounded-tl-none p-4 backdrop-blur-md">
              <div className="flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSubmit} className="pt-4 border-t border-slate-800/80 mt-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about stadium navigation or section crowding..."
            className="flex-1 glass-input rounded-xl px-4 py-2.5 text-sm w-full placeholder:text-slate-500 font-medium tracking-wide focus:outline-none"
            aria-label="Chat message input"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2.5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-500 disabled:opacity-40 transition-all font-semibold shadow-lg shadow-cyan-600/10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label="Send message"
          >
            <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}