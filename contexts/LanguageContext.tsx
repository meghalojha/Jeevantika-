import React, { createContext, useContext, useState } from 'react';
import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import gu from '@/locales/gu.json';

type Language = 'en' | 'hi' | 'gu';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
}

const translations = { en, hi, gu };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (path: string): string => {
    const keys = path.split('.');
    let value: any = translations[language];

    for (const key of keys) {
      value = value?.[key];
    }

    return value || path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
