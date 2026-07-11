import { useState, useCallback, useRef } from 'react';
import { sendChatMessage } from '../../services/api';
import { ChatMessage, IntentType } from '../../shared/types';
import { useApp } from '../context/AppContext';

interface AIResponse {
  message: ChatMessage;
  suggestions: string[];
  actions: Array<{ label: string; action: () => void }>;
}

export function useAI() {
  const { state, addChatMessage } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [quickActions, setQuickActions] = useState<Array<{ label: string; action: () => void }>>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (message: string, currentZoneId?: string | null) => {
    if (isProcessing || !message.trim()) return;

    setIsProcessing(true);
    setCurrentResponse('');
    abortControllerRef.current = new AbortController();

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
      intent: IntentType.GENERAL,
      context_snapshot: [],
      is_fallback: false,
      language: state.user.language,
    };

    addChatMessage(userMessage);

    try {
      const response = await sendChatMessage(
        message.trim(),
        state.user.language,
        currentZoneId || undefined,
        state.user.seat_number,
        state.user.stadium_id,
        state.user.accessibility_mode
      );

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: response.message.content,
        timestamp: new Date().toISOString(),
        intent: response.message.intent,
        context_snapshot: response.message.context_snapshot,
        is_fallback: response.message.is_fallback,
        language: response.message.language,
        route_id: response.message.route_id,
        response_time: response.message.response_time,
        confidence: response.message.confidence,
      };

      addChatMessage(aiMessage);
      
      setSuggestions(response.suggestions || [
        '🍔 Food courts nearby',
        '🚪 Nearest exit',
        '🪑 My seat location',
        '🚻 Restrooms',
        '🗺 Navigate to...',
        '⚽ Match info',
      ]);

      setQuickActions([
        { label: 'Navigate', action: () => console.log('Navigate') },
        { label: 'Show on Map', action: () => console.log('Show on Map') },
        { label: 'Nearby Food', action: () => console.log('Nearby Food') },
        { label: 'Alternative Route', action: () => console.log('Alt Route') },
      ]);

      return aiMessage;
    } catch (error: any) {
      const is429 = error?.message?.includes('429') || error?.message?.includes('Rate limit') || error?.message?.includes('rate limit');
      const isOffline = error?.message?.includes('404') || error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError');

      let fallbackContent = 'Sorry, I encountered an error. Please try again.';
      if (is429) {
        fallbackContent = 'The AI assistant is temporarily busy (rate limit reached). Please wait a moment and try again. In the meantime, use the interactive map to navigate zones and the crowd dashboard for real-time density updates.';
      } else if (isOffline) {
        fallbackContent = 'The AI backend is currently offline. You can still use the interactive SVG map to navigate zones, view crowd density in the dashboard, and use the timeline simulator. The AI assistant will be available once the backend is connected.';
      }

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'model',
        content: fallbackContent,
        timestamp: new Date().toISOString(),
        intent: IntentType.GENERAL,
        context_snapshot: [],
        is_fallback: true,
        language: state.user.language,
      };
      addChatMessage(errorMessage);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [state.user.language, state.user.seat_number, addChatMessage, isProcessing]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsProcessing(false);
  }, []);

  return {
    sendMessage,
    cancel,
    isProcessing,
    currentResponse,
    suggestions,
    quickActions,
    setSuggestions,
    setQuickActions,
  };
}