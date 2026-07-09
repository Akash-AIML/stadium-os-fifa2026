import { useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
];

export function useLanguage() {
  const { state, setUser } = useApp();
  const [languages] = useState<Language[]>(LANGUAGES);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    LANGUAGES.find(l => l.code === state.user.language) || LANGUAGES[0]
  );

  useEffect(() => {
    const lang = LANGUAGES.find(l => l.code === state.user.language);
    if (lang) setCurrentLanguage(lang);
  }, [state.user.language]);

  const changeLanguage = useCallback((code: string) => {
    const lang = LANGUAGES.find(l => l.code === code);
    if (lang) {
      setCurrentLanguage(lang);
      setUser({ language: code });
    }
  }, [setUser]);

  const getLanguageName = useCallback((code: string) => {
    return LANGUAGES.find(l => l.code === code)?.name || code;
  }, []);

  return {
    languages,
    currentLanguage,
    changeLanguage,
    getLanguageName,
  };
}