import type { MainTabId } from '../../../navigation/mainTabConfig';

export type NearbyEntityKind = 'match' | 'event' | 'player' | 'venue' | 'carpool';

export interface NearbyEntity {
  id: string;
  kind: NearbyEntityKind;
  title: string;
  subtitle: string;
  distanceKm: number;
  city: string;
  tab: MainTabId;
}
