import type { User } from '../../../models/User';
import type { GeoPoint } from '../../../models/User';
import type { FriendlyMatch } from '../../../models/FriendlyMatch';
import type { MainTabId } from '../../../navigation/mainTabConfig';
import { distanceBetween } from '../../../utils/geoLocation';

export interface SocialProfileSuggestion {
  id: string;
  displayName: string;
  role: string;
  city: string;
  distanceKm?: number;
  reason: string;
  matchScore: number;
  targetUid?: string;
  actionTab?: MainTabId;
}

export function buildSocialSuggestions(params: {
  user: User;
  userLocation?: GeoPoint;
  openMatches: FriendlyMatch[];
}): SocialProfileSuggestion[] {
  const suggestions: SocialProfileSuggestion[] = [];
  const city = params.user.city?.trim().toLowerCase();

  for (const match of params.openMatches.slice(0, 6)) {
    if (match.requester_uid === params.user.uid) continue;
    let distanceKm: number | undefined;
    if (params.userLocation && match.location) {
      const d = distanceBetween(params.userLocation, match.location);
      if (d != null) distanceKm = d;
    }
    if (!distanceKm && city && match.city.toLowerCase().includes(city)) {
      distanceKm = 2;
    }
    if (city && !match.city.toLowerCase().includes(city) && distanceKm == null) continue;

    suggestions.push({
      id: `club-${match.id}`,
      displayName: match.requester_club_name,
      role: 'Club · Match amical',
      city: match.city,
      distanceKm,
      reason: 'Recherche un adversaire — profil compatible',
      matchScore: 70 + Math.min(20, params.user.profile.level === match.level ? 15 : 0),
      targetUid: match.requester_uid,
      actionTab: 'matchs',
    });
  }

  if (params.user.city) {
    suggestions.push({
      id: 'community-local',
      displayName: `Communauté ${params.user.city}`,
      role: 'Groupe local',
      city: params.user.city,
      distanceKm: 0,
      reason: 'Échanges matchs, entraînements et covoiturage',
      matchScore: 85,
      actionTab: 'matchs',
    });
  }

  return suggestions
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);
}
