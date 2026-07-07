import type { ProductLineId } from '../models/ProductLine';
import { withProFamilyRecord } from '../models/ProductLine';
import type { ReelSource } from './footballReels';
import type { ReelThemeId } from './reelThemes';
import type { UserRole } from '../models/User';

/** Seed ProDay — reels et highlights des acteurs de l’app. */
export type ReelSeed = {
  source: ReelSource;
  externalId: string;
  authorHandle: string;
  authorName: string;
  tags: string[];
  themes?: Exclude<ReelThemeId, 'all'>[];
  directVideoUrl?: string;
  posterUrl?: string;
  sourceUrl?: string;
  caption?: string;
  actorUid?: string;
  actorRole?: UserRole;
  clubId?: string;
};

/** Catalogue statique vide — le feed est alimenté par les acteurs ProDay (Firestore). */
export const REEL_SEEDS: Record<ProductLineId, ReelSeed[]> = withProFamilyRecord({
  homme: [],
  woman: [],
  amateur: [],
  supporter: [],
  pro: [],
  sante: [],
});

export type ReelPoleId = 'foot' | 'mercato' | 'sante';

/** Pôles affichés dans le feed selon l’univers actif. */
export function polesForUniverse(universe: ProductLineId): ReelPoleId[] {
  switch (universe) {
    case 'pro':
      return ['foot', 'mercato'];
    case 'sante':
      return ['sante'];
    default:
      return ['foot', 'mercato', 'sante'];
  }
}

const POLE_HINTS: Record<ReelPoleId, string[]> = {
  foot: ['skills', 'football', 'highlight', 'joueur', 'match', 'proday', 'skills'],
  mercato: ['mercato', 'coaching', 'tactique', 'club', 'carrière', 'coach', 'équipe'],
  sante: ['nutrition', 'recovery', 'récup', 'santé', 'prévention', 'mobilité', 'kiné'],
};

function seedMatchesPole(seed: ReelSeed, pole: ReelPoleId): boolean {
  const hints = POLE_HINTS[pole];
  const blob = [
    ...seed.tags,
    ...(seed.themes ?? []),
    seed.caption ?? '',
    seed.actorRole ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return hints.some((h) => blob.includes(h));
}

export function filterSeedsForPole(seeds: ReelSeed[], pole: ReelPoleId): ReelSeed[] {
  if (seeds.length === 0) return seeds;
  const filtered = seeds.filter((s) => seedMatchesPole(s, pole));
  return filtered.length > 0 ? filtered : seeds;
}

export function dedupeSeeds(seeds: ReelSeed[]): ReelSeed[] {
  const seen = new Set<string>();
  return seeds.filter((seed) => {
    const key = seedKey(seed);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function seedKey(seed: ReelSeed): string {
  return `${seed.source}-${seed.externalId}-${seed.authorHandle}`;
}

/** @deprecated Utiliser `filterSeedsForPole` sur les seeds acteurs. */
export function seedsForUniverse(_universe: ProductLineId, _pole: ReelPoleId = 'foot'): ReelSeed[] {
  return [];
}
