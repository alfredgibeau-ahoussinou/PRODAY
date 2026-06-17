import type { TranslateFn } from './types';

export const tr = (t: TranslateFn | undefined, key: string, fallback: string) => {
  if (!t) return fallback;
  const value = t(key);
  return value === key ? fallback : value;
};
