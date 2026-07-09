import { useCallback, useState } from 'react';

export function useTextToSpeech() {
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const speak = useCallback((text: string, langCode: string, messageId: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      if (playingMessageId === messageId) {
        setPlayingMessageId(null);
        return;
      }

      // Strip markdown tags to read cleanly
      const cleanText = text
        .replace(/[*#`_\-]/g, '')
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

      const utterance = new SpeechSynthesisUtterance(cleanText);

      const langMapping: Record<string, string> = {
        en: 'en-US',
        es: 'es-ES',
        fr: 'fr-FR',
        de: 'de-DE',
        pt: 'pt-PT',
        ar: 'ar-SA',
        ja: 'ja-JP',
        zh: 'zh-CN',
        hi: 'hi-IN',
        ta: 'ta-IN'
      };
      utterance.lang = langMapping[langCode] || 'en-US';

      utterance.onend = () => {
        setPlayingMessageId(null);
      };

      utterance.onerror = () => {
        setPlayingMessageId(null);
      };

      setPlayingMessageId(messageId);
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported in this browser.');
    }
  }, [playingMessageId]);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setPlayingMessageId(null);
    }
  }, []);

  return { speak, stop, playingMessageId };
}
