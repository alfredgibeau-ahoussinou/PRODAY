import type { ReelSeed } from '../content/reelSeedCatalog';
import { seedKey } from '../content/reelSeedCatalog';

let lastAuthorHandle = '';

/** Mélange éditorial — évite deux reels du même auteur consécutifs. */
export function editorialSortSeeds(seeds: ReelSeed[]): ReelSeed[] {
  const scored = seeds.map((seed) => {
    const sameAuthorPenalty = seed.authorHandle === lastAuthorHandle ? -3 : 0;
    return { seed, score: sameAuthorPenalty + Math.random() * 0.5 };
  });
  scored.sort((a, b) => b.score - a.score);
  const out = scored.map((s) => s.seed);
  if (out[0]) lastAuthorHandle = out[0].authorHandle;
  return out;
}

export function interleaveBySource(seeds: ReelSeed[]): ReelSeed[] {
  const seen = new Set<string>();
  return seeds.filter((seed) => {
    const key = seedKey(seed);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
