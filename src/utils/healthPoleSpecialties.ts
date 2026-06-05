/** Filtres annuaire pôle santé — aligné sur MEDICAL_POLE_SPECIALTIES (inscription). */
export const HEALTH_POLE_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'kine', label: 'Kiné & ostéo', match: ['kinésithérapeute', 'ostéopathe'] },
  { id: 'mental', label: 'Coach mental', match: ['mental', 'préparateur mental'] },
  { id: 'medecin', label: 'Médecin & prépa', match: ['médecin', 'préparateur physique'] },
  { id: 'nutrition', label: 'Nutrition', match: ['nutritionniste'] },
  { id: 'other', label: 'Autres', match: ['podologue'] },
] as const;

export type HealthPoleFilterId = (typeof HEALTH_POLE_FILTERS)[number]['id'];

export function isMentalCoachSpecialty(specialty: string | undefined): boolean {
  if (!specialty) return false;
  const lower = specialty.toLowerCase();
  return lower.includes('mental') || lower.includes('préparateur mental');
}

export function matchesHealthPoleFilter(
  specialty: string | undefined,
  filterId: HealthPoleFilterId
): boolean {
  if (filterId === 'all') return true;
  const filter = HEALTH_POLE_FILTERS.find((f) => f.id === filterId);
  if (!filter || filter.id === 'all' || !('match' in filter)) return true;
  const lower = (specialty ?? '').toLowerCase();
  if (!lower) return filterId === 'other';
  return filter.match.some((token) => lower.includes(token));
}
