import type { User, UserRole, GeoPoint } from '../../../models/User';
import type { FriendlyMatch } from '../../../models/FriendlyMatch';
import type { MainTabId } from '../../../navigation/mainTabConfig';
import { distanceBetween } from '../../../utils/geoLocation';

export type SocialSuggestionKind = 'contact' | 'community' | 'mercato';

export interface SocialProfileSuggestion {
  id: string;
  kind: SocialSuggestionKind;
  displayName: string;
  role: string;
  city: string;
  distanceKm?: number;
  reason: string;
  matchScore: number;
  targetUid?: string;
  targetRole?: UserRole;
  matchId?: string;
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
      kind: 'contact',
      displayName: match.requester_club_name,
      role: 'Club · Match amical',
      city: match.city,
      distanceKm,
      reason: 'Recherche un adversaire. Profil compatible',
      matchScore: 70 + Math.min(20, params.user.profile.level === match.level ? 15 : 0),
      targetUid: match.requester_uid,
      targetRole: 'club',
      matchId: match.id,
      actionTab: 'matchs',
    });
  }

  return suggestions.sort((a, b) => b.matchScore - a.matchScore).slice(0, 6);
}
