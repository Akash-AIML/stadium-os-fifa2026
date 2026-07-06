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

  const getIntentLabel = (intent: IntentType): string => {
    const labels = {
      [IntentType.NAVIGATION]: '🧭 Navigation',
      [IntentType.CROWD_STATUS]: '📊 Crowd Status',
      [IntentType.RECOMMENDATION]: '💡 Recommendation',
      [IntentType.GENERAL]: '💬 General',
    };
    return labels[intent];
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite" aria-label="Chat messages">
        {state.chat_history.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">Welcome to FIFA 2026 Smart Guide!</p>
            <p className="text-sm mt-2">Ask me about navigation, crowd status, or recommendations.</p>
          </div>
        ) : (
          state.chat_history.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                {msg.role === 'model' && (
                  <div className="mt-2 flex items-center gap-2 text-xs opacity-70">
                    <span>{getIntentLabel(msg.intent)}</span>
                    {msg.response_time && (
                      <span>• {msg.response_time.toFixed(0)}ms</span>
                    )}
                    {msg.is_fallback && <span>• (Limited Mode)</span>}
                  </div>
                )}
                <p className="text-xs mt-1 opacity-50">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about navigation, crowds, or recommendations..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Chat message input"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Send message"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}