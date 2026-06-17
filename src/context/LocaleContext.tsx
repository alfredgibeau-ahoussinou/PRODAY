import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { findLocaleOption, resolveSupportedLocale } from '../i18n/localeCatalog';
import {
  resolveMessageCatalog,
  translateFromCatalog,
} from '../i18n/messages';
import type { MessageCatalog } from '../i18n/types';
import { getInitialLocale, setStoredLocale } from '../services/localePreference.service';
import { useAuth } from './AuthContext';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

interface LocaleContextValue {
  locale: string;
  localeReady: boolean;
  catalogLoading: boolean;
  languageLabel: string;
  setLocale: (locale: string) => Promise<void>;
  t: TranslateFn;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid ?? null;
  const [locale, setLocaleState] = useState('fr');
  const [catalog, setCatalog] = useState<MessageCatalog>(() => resolveMessageCatalog('fr'));
  const [localeReady, setLocaleReady] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getInitialLocale(uid).then((next) => {
      if (!cancelled) setLocaleState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  useEffect(() => {
    setCatalog(resolveMessageCatalog(locale));
    setCatalogLoading(false);
    setLocaleReady(true);
  }, [locale]);

  const t = useCallback<TranslateFn>(
    (key, params) => translateFromCatalog(catalog, locale, key, params),
    [catalog, locale]
  );

  const setLocale = useCallback(
    async (nextLocale: string) => {
      const normalized = resolveSupportedLocale(nextLocale);
      setLocaleState(normalized);
      await setStoredLocale(normalized, uid);
    },
    [uid]
  );

  const languageLabel = useMemo(() => {
    const option = findLocaleOption(locale);
    if (!option) return locale;
    return option.nativeLabel === option.label
      ? option.nativeLabel
      : `${option.nativeLabel} · ${option.label}`;
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      localeReady,
      catalogLoading,
      languageLabel,
      setLocale,
      t,
    }),
    [locale, localeReady, catalogLoading, languageLabel, setLocale, t]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale doit être utilisé dans LocaleProvider');
  return ctx;
}

export function useTranslation() {
  const { t, locale, languageLabel, setLocale, localeReady, catalogLoading } = useLocale();
  return { t, locale, languageLabel, setLocale, localeReady, catalogLoading };
}
