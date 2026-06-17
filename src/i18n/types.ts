export type MessageKey = string;

export type MessageCatalog = Record<MessageKey, string>;

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export interface LocaleOption {
  code: string;
  label: string;
  nativeLabel: string;
  isSignLanguage?: boolean;
}
