import type { MessageCatalog } from '../i18n/types';
import { MASTER_CATALOG } from '../i18n/messages/master';
import { findLocaleOption } from '../i18n/localeCatalog';
import { getCachedUiCatalog, setCachedUiCatalog } from './uiTranslationCache.service';

const CHUNK_SIZE = 12;
const GOOGLE_LOCALE_MAP: Record<string, string> = {
  nb: 'no',
  nn: 'no',
  'pt-br': 'pt',
  'pt-pt': 'pt',
  zh: 'zh-CN',
  'zh-hans': 'zh-CN',
  'zh-hant': 'zh-TW',
  'fr-ca': 'fr',
  'fr-x-acd': 'fr',
  iw: 'he',
};

function protectParams(text: string): { template: string; slots: string[] } {
  const slots: string[] = [];
  const template = text.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    slots.push(name);
    return `__PD${slots.length - 1}__`;
  });
  return { template, slots };
}

function restoreParams(text: string, slots: string[]): string {
  return text.replace(/__PD(\d+)__/g, (_, index: string) => {
    const slot = slots[Number(index)];
    return slot ? `{{${slot}}}` : '';
  });
}

export function toTranslateTarget(locale: string): string | null {
  const normalized = locale.trim().toLowerCase().replace('_', '-');
  const option = findLocaleOption(normalized);
  if (option?.isSignLanguage) return null;

  if (normalized === 'en' || normalized.startsWith('en-')) return null;

  const mapped = GOOGLE_LOCALE_MAP[normalized] ?? normalized.split('-')[0];
  if (!mapped || mapped === 'en') return null;
  return mapped;
}

async function translateLine(text: string, target: string): Promise<string> {
  const { template, slots } = protectParams(text);
  if (!template.trim()) return text;

  const url =
    'https://translate.googleapis.com/translate_a/single' +
    `?client=gtx&sl=en&tl=${encodeURIComponent(target)}&dt=t` +
    `&q=${encodeURIComponent(template)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`translate_http_${res.status}`);

  const data = (await res.json()) as [Array<[string]>, unknown];
  const translated = data[0]?.map((row) => row[0]).join('') ?? template;
  return restoreParams(translated, slots);
}

export async function translateMessageCatalog(
  source: MessageCatalog,
  target: string
): Promise<MessageCatalog> {
  const entries = Object.entries(source);
  const result: MessageCatalog = {};

  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunk = entries.slice(i, i + CHUNK_SIZE);
    const translated = await Promise.all(
      chunk.map(async ([key, value]) => {
        try {
          return [key, await translateLine(value, target)] as const;
        } catch {
          return [key, value] as const;
        }
      })
    );
    for (const [key, value] of translated) {
      result[key] = value;
    }
  }

  return result;
}

/** Charge le catalogue UI — statique, cache ou traduction automatique. */
export async function loadUiMessageCatalog(
  locale: string,
  handcraft: Record<string, MessageCatalog>
): Promise<MessageCatalog> {
  const normalized = locale.trim().toLowerCase();
  const base = normalized.split('-')[0];

  if (handcraft[normalized]) return handcraft[normalized];
  if (handcraft[base]) return handcraft[base];

  const target = toTranslateTarget(normalized);
  if (!target) return MASTER_CATALOG;

  const cached = await getCachedUiCatalog(base);
  if (cached) return cached;

  const translated = await translateMessageCatalog(MASTER_CATALOG, target);
  await setCachedUiCatalog(base, translated);
  return translated;
}
