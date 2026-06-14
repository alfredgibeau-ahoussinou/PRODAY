import type { ReelSeed, ReelPoleId } from '../../content/reelSeedCatalog';
import type { HealthState } from '../types/health';

const POLE_TAG_BOOST: Record<ReelPoleId, string[]> = {
  foot: ['#skills', '#football', '#ucl', '#match'],
  mercato: ['#mercato', '#transfert', '#club', '#carrière'],
  sante: ['#santé', '#récup', '#prévention', '#kiné', '#blessure'],
};

const RECOVERY_TAGS = ['#récup', '#prévention', '#santé', '#mobilité', '#étirement'];

function seedUsefulness(seed: ReelSeed, pole: ReelPoleId, healthState: HealthState): number {
  const tags = seed.tags.map((t) => t.toLowerCase()).join(' ');
  let score = 0.45;

  for (const hint of POLE_TAG_BOOST[pole]) {
    if (tags.includes(hint.replace('#', '')) || tags.includes(hint)) score += 0.12;
  }

  if (
    healthState === 'FATIGUED' ||
    healthState === 'OVERLOADED' ||
    healthState === 'INJURY_RISK'
  ) {
    if (RECOVERY_TAGS.some((t) => tags.includes(t.replace('#', '')))) score += 0.25;
    if (pole === 'sante') score += 0.15;
  } else if (healthState === 'OPTIMAL' || healthState === 'ACTIVE') {
    if (pole === 'foot') score += 0.1;
  }

  return Math.min(1, score);
}

/** Classement réels par utilité IA — santé, pôle, objectifs (spec §4). */
export function rankReelSeeds(params: {
  seeds: ReelSeed[];
  pole: ReelPoleId;
  healthState: HealthState;
  usefulnessMin: number;
}): ReelSeed[] {
  return [...params.seeds]
    .map((seed) => ({
      seed,
      usefulness: seedUsefulness(seed, params.pole, params.healthState),
    }))
    .filter((s) => s.usefulness >= params.usefulnessMin)
    .sort((a, b) => b.usefulness - a.usefulness)
    .map((s) => s.seed);
}
