export type CandidatureChapterId = 'annonces' | 'suivi';

export const CANDIDATURE_CHAPTERS: { id: CandidatureChapterId; label: string }[] = [
  { id: 'annonces', label: 'Annonces' },
  { id: 'suivi', label: 'Suivi' },
];

export const POSITION_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'gk', label: 'Gardien' },
  { id: 'def', label: 'Défense' },
  { id: 'mid', label: 'Milieu' },
  { id: 'fwd', label: 'Attaque' },
] as const;

export type PositionFilterId = (typeof POSITION_FILTERS)[number]['id'];

export function postMatchesPositionFilter(
  position: string,
  filter: PositionFilterId
): boolean {
  if (filter === 'all') return true;
  const p = position.toLowerCase();
  switch (filter) {
    case 'gk':
      return p.includes('gard') || p.includes('gb');
    case 'def':
      return p.includes('déf') || p.includes('def') || p.includes('latéral') || p.includes('central');
    case 'mid':
      return p.includes('milieu') || p.includes('médian') || p.includes('relayeur');
    case 'fwd':
      return p.includes('attaquant') || p.includes('ailier') || p.includes('buteur') || p.includes('pointe');
    default:
      return true;
  }
}
