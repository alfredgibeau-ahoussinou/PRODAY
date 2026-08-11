import type { ProDayPlayerCardData, ProDayTeamCardData } from '../models/ProDayCard';
import { PRODAY_CARD_ROLE_META } from '../models/ProDayCard';
import type { SmartPlayerCardData } from '../models/SmartTactics';
import type { User } from '../models/User';
import type { Team } from '../models/Team';

/** Mappe une carte Smart Tactics vers le passeport Fut ProDay (champs manquants = défauts). */
export function smartPlayerToProDayCard(
  card: SmartPlayerCardData,
  extras?: Partial<Omit<ProDayPlayerCardData, 'id' | 'role'>>,
): ProDayPlayerCardData {
  const meta = PRODAY_CARD_ROLE_META.player;
  const [firstName, ...rest] = card.display_name.trim().split(/\s+/);
  const lastName = rest.join(' ') || firstName;
  const foot =
    card.preferred_foot === 'left' ? 'L' : card.preferred_foot === 'both' ? 'Both' : 'R';

  return {
    id: card.uid,
    role: 'player',
    tier: card.overall >= 88 ? 'legend' : card.overall >= 80 ? 'gold' : card.overall >= 70 ? 'silver' : 'bronze',
    displayName: card.display_name,
    photoUrl: card.photo_url ?? null,
    verified: card.badges.some((b) => /vérif/i.test(b)),
    accentHex: meta.accent,
    deepHex: meta.deep,
    actions: ['view_profile', 'message', 'recruit', 'follow'],
    firstName: firstName || 'Joueur',
    lastName,
    age: card.age ?? 0,
    gender: 'M',
    nationality: '—',
    clubName: '—',
    primaryPosition: card.position ?? '—',
    strongFoot: foot,
    heightCm: 0,
    weightKg: 0,
    levelLabel: '—',
    league: '—',
    levelBadge: 'amateur',
    overall: card.overall,
    formPct: Math.round(card.form),
    potential: Math.min(99, card.overall + Math.round(card.progress / 10)),
    estimatedValueLabel: '—',
    matches: 0,
    goals: 0,
    assists: 0,
    minutesPlayed: 0,
    lastMatchLabel: '—',
    progressLabel: `Prog. ${card.progress}%`,
    skillBadges: card.badges.slice(0, 4),
    aiObjectives: [],
    recruitmentStatus: card.contract_status ?? '—',
    ...extras,
  };
}

/** Carte Fut live depuis un profil User (effectif / profil). */
export function userToProDayCard(
  user: User,
  extras?: Partial<Omit<ProDayPlayerCardData, 'id' | 'role'>>,
): ProDayPlayerCardData {
  const meta = PRODAY_CARD_ROLE_META.player;
  const name = user.display_name?.trim() || 'Joueur';
  const [firstName, ...rest] = name.split(/\s+/);
  const lastName = rest.join(' ') || firstName;
  const foot =
    user.profile.strong_foot === 'left'
      ? 'L'
      : user.profile.strong_foot === 'both'
        ? 'Both'
        : 'R';
  const season = user.profile.season_stats;
  const matches = season?.matches ?? 0;
  const goals = season?.goals ?? 0;
  const assists = season?.assists ?? 0;
  const overall = Math.min(
    92,
    58 + matches + goals * 2 + assists + (user.profile.years_experience ?? 0),
  );

  return {
    id: user.uid,
    role: 'player',
    tier: overall >= 80 ? 'gold' : overall >= 70 ? 'silver' : 'bronze',
    displayName: name,
    photoUrl: user.avatar_url ?? null,
    verified: false,
    accentHex: meta.accent,
    deepHex: meta.deep,
    actions: ['view_profile', 'message'],
    firstName: firstName || 'Joueur',
    lastName,
    age: user.profile.age ?? 0,
    gender: user.profile.gender === 'women' ? 'F' : 'M',
    nationality: '—',
    clubName: extras?.clubName ?? '—',
    primaryPosition: user.profile.position ?? '—',
    strongFoot: foot,
    heightCm: user.profile.height_cm ?? 0,
    weightKg: user.profile.weight_kg ?? 0,
    levelLabel: user.profile.level ?? 'Amateur',
    league: user.profile.category ?? '—',
    levelBadge: 'amateur',
    overall,
    formPct: Math.min(99, 55 + matches * 2),
    potential: Math.min(99, overall + 6),
    estimatedValueLabel: '—',
    matches,
    goals,
    assists,
    minutesPlayed: matches * 70,
    lastMatchLabel: matches > 0 ? `${matches} matchs` : '—',
    progressLabel: user.profile.category ?? 'Saison',
    skillBadges: [
      user.profile.jersey_number != null ? `#${user.profile.jersey_number}` : null,
      user.profile.position,
      user.profile.level,
    ].filter(Boolean) as string[],
    aiObjectives: [],
    recruitmentStatus:
      user.profile.availability === 'available'
        ? 'Disponible'
        : user.profile.availability === 'negotiating'
          ? 'En discussion'
          : '—',
    ...extras,
  };
}

/** Carte équipe (catégorie / effectif / saison). */
export function teamToProDayCard(
  team: Team,
  opts?: {
    clubName?: string;
    coachName?: string;
    playersCount?: number;
    standingLabel?: string;
    formation?: string;
  },
): ProDayTeamCardData {
  const meta = PRODAY_CARD_ROLE_META.team;
  return {
    id: team.id,
    role: 'team',
    tier: 'silver',
    displayName: team.name,
    photoUrl: null,
    verified: true,
    accentHex: meta.accent,
    deepHex: meta.deep,
    actions: ['view_club', 'invite'],
    clubName: opts?.clubName ?? '—',
    category: team.category ?? team.name,
    seasonLabel: 'Saison en cours',
    playersCount: opts?.playersCount ?? 0,
    coachName: opts?.coachName ?? '—',
    formation: opts?.formation,
    standingLabel: opts?.standingLabel,
  };
}
