import type { ReelSeed } from './reelSeedCatalog';

export type ReelThemeId = 'all' | 'skills' | 'motivation' | 'nutrition';

export const REEL_THEME_CHIPS: { id: ReelThemeId; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'skills', label: 'Skills' },
  { id: 'motivation', label: 'Motivation' },
  { id: 'nutrition', label: 'Nutrition' },
];

const THEME_HINTS: Record<Exclude<ReelThemeId, 'all'>, string[]> = {
  skills: ['skills', 'footwork', 'viral', 'dribble', 'technique', 'fc25', 'tactique', 'tactics'],
  motivation: [
    'motivation', 'mindset', 'culture', 'legends', 'worldcup', 'ucl', 'masterclass', 'pro',
    'carrière', 'mercato',
  ],
  nutrition: [
    'nutrition', 'recovery', 'récup', 'fitness', 'warmup', 'stretch', 'prévention', 'santé',
    'kiné', 'blessure', 'mobilité',
  ],
};

export function seedMatchesTheme(seed: ReelSeed, theme: ReelThemeId): boolean {
  if (theme === 'all') return true;
  if (seed.themes?.includes(theme)) return true;
  const hints = THEME_HINTS[theme];
  const blob = seed.tags.join(' ').toLowerCase();
  return hints.some((h) => blob.includes(h));
}

export function filterSeedsByTheme(seeds: ReelSeed[], theme: ReelThemeId): ReelSeed[] {
  if (theme === 'all') return seeds;
  const filtered = seeds.filter((s) => seedMatchesTheme(s, theme));
  return filtered.length > 0 ? filtered : seeds;
}
