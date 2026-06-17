/** Groupes annuaire pôle santé — alignés sur MEDICAL_POLE_SPECIALTIES. */
export type HealthPoleGroupId =
  | 'kine_osteo'
  | 'medecin_prepa'
  | 'mental'
  | 'nutrition'
  | 'podologie';

const GROUP_MATCH: Record<HealthPoleGroupId, string[]> = {
  kine_osteo: ['kinésithérapeute', 'ostéopathe'],
  medecin_prepa: ['médecin', 'préparateur physique'],
  mental: ['mental', 'préparateur mental'],
  nutrition: ['nutritionniste'],
  podologie: ['podologue'],
};

/** @deprecated Filtres fins — préférer les onglets par pôle. */
export const HEALTH_POLE_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'kine_osteo', label: 'Kiné & ostéo', match: GROUP_MATCH.kine_osteo },
  { id: 'medecin_prepa', label: 'Médecin & prépa', match: GROUP_MATCH.medecin_prepa },
  { id: 'mental', label: 'Mental', match: GROUP_MATCH.mental },
  { id: 'nutrition', label: 'Nutrition', match: GROUP_MATCH.nutrition },
  { id: 'podologie', label: 'Podologie', match: GROUP_MATCH.podologie },
] as const;

export type HealthPoleFilterId = (typeof HEALTH_POLE_FILTERS)[number]['id'];

export function isMentalCoachSpecialty(specialty: string | undefined): boolean {
  if (!specialty) return false;
  const lower = specialty.toLowerCase();
  return lower.includes('mental') || lower.includes('préparateur mental');
}

export function matchesHealthPoleGroup(
  specialty: string | undefined,
  groupId: HealthPoleGroupId
): boolean {
  const lower = (specialty ?? '').toLowerCase();
  if (!lower) return false;
  return GROUP_MATCH[groupId].some((token) => lower.includes(token));
}

export function matchesHealthPoleFilter(
  specialty: string | undefined,
  filterId: HealthPoleFilterId
): boolean {
  if (filterId === 'all') return true;
  const filter = HEALTH_POLE_FILTERS.find((f) => f.id === filterId);
  if (!filter || filter.id === 'all' || !('match' in filter)) return true;
  const lower = (specialty ?? '').toLowerCase();
  if (!lower) return false;
  return filter.match.some((token) => lower.includes(token));
}
