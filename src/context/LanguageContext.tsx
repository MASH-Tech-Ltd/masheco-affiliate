'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { affiliateTranslations, AffiliateLang } from '@/data/affiliateTranslations';

interface LanguageContextType {
  lang: AffiliateLang;
  setLang: (lang: AffiliateLang) => void;
  t: typeof affiliateTranslations.en;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: affiliateTranslations.en,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<AffiliateLang>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mash_affiliate_lang') as AffiliateLang;
      if (saved === 'en' || saved === 'bn') {
        setLangState(saved);
      }
    } catch (_) {}
  }, []);

  const setLang = (next: AffiliateLang) => {
    setLangState(next);
    try {
      localStorage.setItem('mash_affiliate_lang', next);
    } catch (_) {}
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        t: affiliateTranslations[lang],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useAffiliateLang = () => useContext(LanguageContext);
export const useLanguage = useAffiliateLang;
