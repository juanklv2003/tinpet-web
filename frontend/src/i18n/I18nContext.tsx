import React, { createContext, useContext, useState, useEffect } from 'react';

export type Locale = 'es' | 'en';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'es',
  setLocale: () => {},
});

const STORAGE_KEY = 'tinpet_locale';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'es' || stored === 'en') return stored;
    // Detect browser language
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'en' ? 'en' : 'es';
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  };

  // Persist on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
