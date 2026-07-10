import { useCallback, useState } from 'react';

const PREFERRED_VOICE_KEYWORDS: Record<string, string[]> = {
  en: ['Google US English', 'Google UK English Female', 'Microsoft Zira', 'Samantha', 'Natural'],
  es: ['Google español', 'Google Español', 'Microsoft Helena', 'Lucía', 'Natural'],
  fr: ['Google français', 'Microsoft Hortense', 'Amélie', 'Natural'],
  de: ['Google Deutsch', 'Microsoft Hedda', 'Vicki', 'Natural'],
  pt: ['Google português', 'Microsoft Maria', 'Helena', 'Natural'],
  ar: ['Google عربي', 'Microsoft Naayf', 'Noura', 'Natural'],
  ja: ['Google 日本語', 'Microsoft Ayumi', 'Haruka', 'Natural'],
  zh: ['Google 中文', 'Microsoft Huihui', 'Ting-Ting', 'Natural'],
  hi: ['Google हिन्दी', 'Microsoft Hemant', 'Kiran', 'Natural'],
  ta: ['Google தமிழ்', 'Microsoft Valluvar', 'Tamil', 'Natural']
};

function pickVoice(voices: SpeechSynthesisVoice[], langCode: string) {
  const languagePrefix = (langCode || 'en').toLowerCase();
  const preferredKeywords = PREFERRED_VOICE_KEYWORDS[languagePrefix] ?? PREFERRED_VOICE_KEYWORDS.en;

  const normalizedVoices = voices.filter(voice => voice.lang.toLowerCase().startsWith(languagePrefix));
  const searchPool = normalizedVoices.length > 0 ? normalizedVoices : voices;

  for (const keyword of preferredKeywords) {
    const lowerKeyword = keyword.toLowerCase();
    const exactMatch = searchPool.find(voice => voice.name.toLowerCase() === lowerKeyword);
    if (exactMatch) return exactMatch;

    const partialMatch = searchPool.find(voice => voice.name.toLowerCase().includes(lowerKeyword));
    if (partialMatch) return partialMatch;
  }

  return searchPool[0] ?? null;
}

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
      utterance.rate = 0.98;
      utterance.pitch = 1.05;

      utterance.onend = () => {
        setPlayingMessageId(null);
      };

      utterance.onerror = () => {
        setPlayingMessageId(null);
      };

      setPlayingMessageId(messageId);

      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = pickVoice(voices, langCode);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

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
