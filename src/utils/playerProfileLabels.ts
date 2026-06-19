import type { User } from '../models/User';

export function strongFootLabel(foot?: string): string | null {
  if (foot === 'left') return 'Pied gauche';
  if (foot === 'right') return 'Pied droit';
  if (foot === 'both') return 'Ambidextre';
  return null;
}

export function availabilityLabel(
  value?: User['profile']['availability'],
): string | null {
  if (value === 'available') return 'Disponible';
  if (value === 'negotiating') return 'En discussion';
  if (value === 'unavailable') return 'Indisponible';
  return null;
}

export function availabilityTone(
  value?: User['profile']['availability'],
): 'positive' | 'neutral' | 'muted' {
  if (value === 'available') return 'positive';
  if (value === 'negotiating') return 'neutral';
  return 'muted';
}
