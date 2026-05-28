/** Espace ProDay : féminin / masculin, jeunes, moins de U13 */
export type AppSpaceId = 'women' | 'girls' | 'men' | 'boys' | 'under_u13';

export const DEFAULT_APP_SPACE: AppSpaceId = 'men';

export const APP_SPACE_IDS: AppSpaceId[] = [
  'under_u13',
  'boys',
  'men',
  'girls',
  'women',
];

export const APP_SPACE_LABELS: Record<AppSpaceId, string> = {
  women: 'ProDay Féminin',
  girls: 'ProDay Filles',
  men: 'ProDay Masculin',
  boys: 'ProDay Jeunes',
  under_u13: 'ProDay -13',
};

export const APP_SPACE_DESCRIPTIONS: Record<AppSpaceId, string> = {
  women: 'Football féminin — D1 F, Régional, détections et clubs féminins.',
  girls: 'U13 à U19 filles — formations et détections dédiées.',
  men: 'Football masculin — Seniors, Régional, National et détections.',
  boys: 'U13 à U19 garçons — formations et détections dédiées.',
  under_u13: 'U7, U9, U11 — école de foot, initiation et détections poussins.',
};

/** Ancien espace « mixte » ou valeur inconnue → espace par défaut */
export function normalizeAppSpace(value: string | null | undefined): AppSpaceId {
  if (value && (APP_SPACE_IDS as string[]).includes(value)) {
    return value as AppSpaceId;
  }
  return DEFAULT_APP_SPACE;
}

export function isFeminineAppSpace(space: AppSpaceId): boolean {
  return space === 'women' || space === 'girls';
}

export function isMasculineAppSpace(space: AppSpaceId): boolean {
  return space === 'men' || space === 'boys';
}

export function isUnderU13AppSpace(space: AppSpaceId): boolean {
  return space === 'under_u13';
}
