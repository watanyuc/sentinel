import { useCallback } from 'react';
import { useUIStore } from '../stores/uiStore';
import en from './en.json';
import th from './th.json';

const translations: Record<string, Record<string, string>> = { en, th };

/**
 * Lightweight i18n hook.
 * Returns a `t(key)` function that looks up the current language's translation.
 */
export const useTranslation = () => {
  const language = useUIStore(s => s.language);

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] ?? translations.en[key] ?? key;
    },
    [language],
  );

  return t;
};
