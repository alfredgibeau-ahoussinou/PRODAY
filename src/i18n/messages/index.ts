import type { MessageCatalog } from '../types';
import { MASTER_CATALOG } from './master';
import { de } from './de';
import { es } from './es';
import { fr } from './fr';
import { ko } from './ko';

export const MESSAGE_CATALOGS: Record<string, MessageCatalog> = {
  fr,
  en: MASTER_CATALOG,
  es,
  de,
  ko,
};

const FALLBACK_CHAIN = ['en', 'fr'] as const;

export function resolveMessageCatalog(locale: string): MessageCatalog {
  const normalized = locale.trim().toLowerCase();
  if (MESSAGE_CATALOGS[normalized]) return MESSAGE_CATALOGS[normalized];

  const base = normalized.split('-')[0];
  if (MESSAGE_CATALOGS[base]) return MESSAGE_CATALOGS[base];

  return MESSAGE_CATALOGS.en ?? MESSAGE_CATALOGS.fr;
}

export async function loadMessageCatalog(locale: string): Promise<MessageCatalog> {
  return resolveMessageCatalog(locale);
}

export function translateFromCatalog(
  catalog: MessageCatalog,
  locale: string,
  key: string,
  params?: Record<string, string | number>
): string {
  const catalogs = [
    catalog,
    ...FALLBACK_CHAIN.map((code) => MESSAGE_CATALOGS[code]).filter(Boolean),
  ];

  let template = key;
  for (const c of catalogs) {
    if (c[key]) {
      template = c[key];
      break;
    }
  }

  if (!params) return template;
  return Object.entries(params).reduce(
    (text, [param, value]) => text.replaceAll(`{{${param}}}`, String(value)),
    template
  );
}
