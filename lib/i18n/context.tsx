'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { Lang } from './types';
import { t as translations } from './translations';

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: 'uz',
  setLang: () => {},
  t: (key) => key,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('uz');

  useEffect(() => {
    const stored = localStorage.getItem('iqro_lang') as Lang | null;
    if (stored && ['en', 'uz', 'ru'].includes(stored)) {
      setLangState(stored);
    }
  }, []);

  function setLang(newLang: Lang) {
    setLangState(newLang);
    localStorage.setItem('iqro_lang', newLang);
  }

  function t(key: string): string {
    return translations[lang]?.[key] ?? translations['uz'][key] ?? key;
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
