import type { ProductLineId } from '../models/ProductLine';
import type { TranslateFn } from './types';

export function getAuthSignupTeaser(line: ProductLineId, t: TranslateFn): string[] {
  const prefix =
    line === 'woman'
      ? 'auth.teaser.woman'
      : line === 'pro'
        ? 'auth.teaser.pro'
        : line === 'sante'
          ? 'auth.teaser.sante'
          : 'auth.teaser.homme';
  return [0, 1, 2].map((i) => t(`${prefix}.${i}`));
}
