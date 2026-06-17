import type { User, UserRole } from '../models/User';
import type { FriendlyMatch } from '../models/FriendlyMatch';
import {
  buildSocialSuggestions,
  type SocialProfileSuggestion,
} from '../features/v3/engines/socialRecommendation.engine';
import { usersService } from './users.service';
import { isFirebaseConfigured } from '../config/firebase';
import { distanceBetween } from '../utils/geoLocation';

const ROLE_LABELS: Partial<Record<UserRole, string>> = {
  player: 'Joueur',
  coach: 'Coach',
  physio: 'Kinésithérapeute',
  agent: 'Agent',
  recruiter: 'Recruteur',
  club: 'Club',
  organizer: 'Organisateur',
};

function rolesToSuggestFor(viewerRole: UserRole): UserRole[] {
  switch (viewerRole) {
    case 'player':
      return ['coach', 'physio', 'player'];
    case 'coach':
    case 'club':
    case 'organizer':
      return ['player', 'agent'];
    case 'physio':
      return ['player', 'coach'];
    case 'agent':
    case 'recruiter':
      return ['player', 'coach'];
    default:
      return ['player', 'coach'];
  }
}

function scoreCandidate(viewer: User, candidate: User): { score: number; reason: string } {
  let score = 55;
  const reasons: string[] = [];
  const viewerCity = viewer.city?.trim().toLowerCase();
  const candidateCity = candidate.city?.trim().toLowerCase();

  if (viewerCity && candidateCity && candidateCity.includes(viewerCity)) {
    score += 22;
    reasons.push(`Secteur ${candidate.city}`);
  }

  const clubId = viewer.profile.club_id;
  if (clubId && candidate.profile.club_id === clubId) {
    score += 18;
    reasons.push('Même club');
  }

  if (viewer.role === 'player' && candidate.role === 'coach') {
    score += 8;
    reasons.push('Coach à contacter');
  }
  if (viewer.role === 'player' && candidate.role === 'physio') {
    score += 8;
    reasons.push('Suivi kiné');
  }
  if (
    viewer.role === 'coach' &&
    candidate.role === 'player' &&
    viewer.profile.level &&
    candidate.profile.level === viewer.profile.level
  ) {
    score += 12;
    reasons.push(`Niveau ${candidate.profile.level}`);
  }

  if (viewer.location && candidate.location) {
    const km = distanceBetween(viewer.location, candidate.location);
    if (km != null && km <= 25) {
      score += Math.max(0, 15 - Math.floor(km));
    }
  }

  if (usersService.isNewProfile(candidate)) {
    score += 5;
    reasons.push('Nouveau sur ProDay');
  }

  if (candidate.is_verified) score += 5;

  return {
    score: Math.min(98, score),
    reason: reasons.length > 0 ? reasons.join(' · ') : 'Profil actif sur ProDay',
  };
}

function userToSuggestion(viewer: User, candidate: User): SocialProfileSuggestion | null {
  if (candidate.uid === viewer.uid) return null;
  const { score, reason } = scoreCandidate(viewer, candidate);
  const roleLabel = ROLE_LABELS[candidate.role] ?? candidate.role;

  return {
    id: `user-${candidate.uid}`,
    kind: 'contact',
    displayName: candidate.display_name,
    role: roleLabel,
    city: candidate.city ?? 'France',
    distanceKm:
      viewer.location && candidate.location
        ? distanceBetween(viewer.location, candidate.location) ?? undefined
        : undefined,
    reason,
    matchScore: score,
    targetUid: candidate.uid,
    targetRole: candidate.role,
  };
}

async function fetchUserSuggestions(viewer: User): Promise<SocialProfileSuggestion[]> {
  if (!isFirebaseConfigured()) return [];

  const roles = rolesToSuggestFor(viewer.role);
  const lists = await Promise.all(roles.map((role) => usersService.listByRole(role)));
  const seen = new Set<string>();
  const suggestions: SocialProfileSuggestion[] = [];

  for (const list of lists) {
    for (const candidate of list) {
      if (seen.has(candidate.uid)) continue;
      seen.add(candidate.uid);
      const item = userToSuggestion(viewer, candidate);
      if (item) suggestions.push(item);
    }
  }

  return suggestions.sort((a, b) => b.matchScore - a.matchScore).slice(0, 8);
}

/** Suggestions réseau — matchs amicaux + profils Firestore + Mercato. */
export async function fetchSocialSuggestions(params: {
  user: User;
  openMatches: FriendlyMatch[];
}): Promise<SocialProfileSuggestion[]> {
  const base = buildSocialSuggestions({
    user: params.user,
    userLocation: params.user.location,
    openMatches: params.openMatches,
  }).filter((s) => s.id !== 'community-local');

  const userSuggestions = await fetchUserSuggestions(params.user);

  const mercatoCard: SocialProfileSuggestion = {
    id: 'mercato-explore',
    kind: 'mercato',
    displayName: 'Mercato ProDay',
    role: 'Annonces & annuaire',
    city: params.user.city ?? 'France',
    reason: 'Parcourir les annonces et l’annuaire joueurs sans envoyer de message',
    matchScore: 60,
    actionTab: 'recrutement',
  };

  const merged = new Map<string, SocialProfileSuggestion>();
  for (const item of [...userSuggestions, ...base, mercatoCard]) {
    const key = item.targetUid ?? item.id;
    const prev = merged.get(key);
    if (!prev || item.matchScore > prev.matchScore) {
      merged.set(key, item);
    }
  }

  return [...merged.values()].sort((a, b) => b.matchScore - a.matchScore).slice(0, 12);
}
