import type { LocaleOption } from './types';

/** Langues supportées par l’application. */
export const SUPPORTED_LOCALES: readonly LocaleOption[] = [
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어' },
] as const;

export type SupportedLocaleCode = (typeof SUPPORTED_LOCALES)[number]['code'];

const SUPPORTED_CODES = new Set(SUPPORTED_LOCALES.map((item) => item.code));

/** Catalogue des langues proposées dans le sélecteur. */
export function getLocaleCatalog(): LocaleOption[] {
  return [...SUPPORTED_LOCALES];
}

export function findLocaleOption(code: string): LocaleOption | undefined {
  const normalized = code.trim().toLowerCase().replace('_', '-');
  const direct = SUPPORTED_LOCALES.find((item) => item.code === normalized);
  if (direct) return direct;
  const base = normalized.split('-')[0];
  return SUPPORTED_LOCALES.find((item) => item.code === base);
}

/** Ramène une locale appareil ou stockée vers une langue supportée. */
export function resolveSupportedLocale(code: string): SupportedLocaleCode {
  const normalized = code.trim().toLowerCase().replace('_', '-');
  if (SUPPORTED_CODES.has(normalized as SupportedLocaleCode)) {
    return normalized as SupportedLocaleCode;
  }
  const base = normalized.split('-')[0];
  if (SUPPORTED_CODES.has(base as SupportedLocaleCode)) {
    return base as SupportedLocaleCode;
  }
  return 'fr';
}

export function getDeviceLanguageTag(): string {
  try {
    return resolveSupportedLocale(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return 'fr';
  }
}

/** @deprecated Conservé pour les tests — le catalogue est désormais statique. */
export function resetLocaleCatalogCache(): void {
  // no-op
}
