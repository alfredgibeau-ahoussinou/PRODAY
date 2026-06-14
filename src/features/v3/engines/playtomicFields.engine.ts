import type { GeoPoint } from '../../../models/User';
import { distanceBetween } from '../../../utils/geoLocation';

export interface FieldSlotSuggestion {
  id: string;
  name: string;
  city: string;
  surface: string;
  location: GeoPoint;
  distanceKm: number | null;
  nextSlotLabel: string;
}

const FIELD_SEEDS: Omit<FieldSlotSuggestion, 'distanceKm'>[] = [
  {
    id: 'field-synth-1',
    name: 'Complexe sportif municipal',
    city: 'Paris',
    surface: 'Synthétique',
    location: { latitude: 48.8566, longitude: 2.3522 },
    nextSlotLabel: 'Sam. 10h–11h',
  },
  {
    id: 'field-grass-1',
    name: 'Stade annexe',
    city: 'Lyon',
    surface: 'Gazon',
    location: { latitude: 45.764, longitude: 4.8357 },
    nextSlotLabel: 'Dim. 14h–15h',
  },
  {
    id: 'field-5v5',
    name: 'Five indoor',
    city: 'Marseille',
    surface: 'Five',
    location: { latitude: 43.2965, longitude: 5.3698 },
    nextSlotLabel: 'Ven. 19h–20h',
  },
];

/** Créneaux terrains type Playtomic — suggestions locales. */
export function suggestFieldSlots(params: {
  userLocation?: GeoPoint;
  city?: string;
  limit?: number;
}): FieldSlotSuggestion[] {
  const limit = params.limit ?? 4;
  const cityQ = params.city?.trim().toLowerCase();

  return FIELD_SEEDS.map((seed) => ({
    ...seed,
    distanceKm: distanceBetween(params.userLocation, seed.location),
  }))
    .filter((f) => !cityQ || f.city.toLowerCase().includes(cityQ))
    .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99))
    .slice(0, limit);
}
