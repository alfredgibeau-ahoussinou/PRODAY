import type { GeoPoint } from '../../../models/User';

export interface FieldSlotSuggestion {
  id: string;
  name: string;
  city: string;
  surface: string;
  location: GeoPoint;
  distanceKm: number | null;
  nextSlotLabel: string;
}

/** Intégration Playtomic non branchée — pas de créneaux fictifs. */
export function suggestFieldSlots(_params: {
  userLocation?: GeoPoint;
  city?: string;
  limit?: number;
}): FieldSlotSuggestion[] {
  return [];
}

export const PLAYTOMIC_FIELDS_AVAILABLE = false;
