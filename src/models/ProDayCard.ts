/**
 * ProDay Fut Cards — passeport numérique style cartes évolutives.
 * View-models partagés (app + site). Les UI RN / Next restent séparées.
 */

export type ProDayCardRole =
  | 'player'
  | 'coach'
  | 'club'
  | 'team'
  | 'supporter'
  | 'sponsor';

export type ProDayCardTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'elite'
  | 'legend';

export type ProDayCardActionId =
  | 'view_profile'
  | 'message'
  | 'follow'
  | 'invite'
  | 'recruit'
  | 'view_club';

export interface ProDayCardBadge {
  id: string;
  label: string;
  tone?: 'default' | 'verified' | 'pro' | 'amateur' | 'warn';
}

export interface ProDayCardBase {
  id: string;
  role: ProDayCardRole;
  tier: ProDayCardTier;
  displayName: string;
  photoUrl?: string | null;
  verified: boolean;
  accentHex: string;
  deepHex: string;
  actions: ProDayCardActionId[];
}

export interface ProDayPlayerCardData extends ProDayCardBase {
  role: 'player';
  firstName: string;
  lastName: string;
  age: number;
  gender: 'M' | 'F' | 'X';
  nationality: string;
  nationalityFlag?: string;
  clubName: string;
  primaryPosition: string;
  secondaryPosition?: string;
  strongFoot: 'L' | 'R' | 'Both';
  heightCm: number;
  weightKg: number;
  levelLabel: string;
  league: string;
  levelBadge: 'amateur' | 'centre' | 'pro';
  overall: number;
  formPct: number;
  potential: number;
  estimatedValueLabel: string;
  matches: number;
  goals: number;
  assists: number;
  minutesPlayed: number;
  lastMatchLabel: string;
  maxSpeedKmh?: number;
  progressLabel: string;
  skillBadges: string[];
  aiObjectives: string[];
  recruitmentStatus: string;
  heatmapHint?: string;
}

export interface ProDayCoachCardData extends ProDayCardBase {
  role: 'coach';
  clubName: string;
  category: string;
  diplomas: string[];
  certifications: string[];
  preferredFormation: string;
  philosophy: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  winRatePct: number;
  playersDeveloped: number;
  coachLevel: string;
  reputation: number;
}

export interface ProDayClubCardData extends ProDayCardBase {
  role: 'club';
  city: string;
  country: string;
  licensedCount: number;
  teamsCount: number;
  coachesCount: number;
  stadium: string;
  levelLabel: string;
  league: string;
  standingLabel: string;
  primaryColor: string;
  secondaryColor: string;
  historyLine: string;
}

/** Carte équipe (catégorie / effectif) — distincte de la carte club. */
export interface ProDayTeamCardData extends ProDayCardBase {
  role: 'team';
  clubName: string;
  category: string;
  seasonLabel: string;
  playersCount: number;
  coachName: string;
  formation?: string;
  standingLabel?: string;
}

export interface ProDaySupporterCardData extends ProDayCardBase {
  role: 'supporter';
  favoriteClub: string;
  loyaltyLevel: string;
  eventsAttended: number;
  referrals: number;
  rewards: string[];
  points: number;
  badges: string[];
}

export interface ProDaySponsorCardData extends ProDayCardBase {
  role: 'sponsor';
  company: string;
  sector: string;
  location: string;
  partnerClubs: string[];
  sponsoredEvents: number;
}

export type ProDayCardData =
  | ProDayPlayerCardData
  | ProDayCoachCardData
  | ProDayClubCardData
  | ProDayTeamCardData
  | ProDaySupporterCardData
  | ProDaySponsorCardData;

export const PRODAY_CARD_ACTION_LABELS: Record<ProDayCardActionId, string> = {
  view_profile: 'Voir le profil',
  message: 'Message',
  follow: 'Suivre',
  invite: 'Inviter',
  recruit: 'Recruter',
  view_club: 'Voir le club',
};

export const PRODAY_CARD_ROLE_META: Record<
  ProDayCardRole,
  { label: string; accent: string; deep: string }
> = {
  player: { label: 'Joueur', accent: '#0054F0', deep: '#001854' },
  coach: { label: 'Coach', accent: '#3B5BFF', deep: '#001848' },
  club: { label: 'Club', accent: '#10B981', deep: '#047857' },
  team: { label: 'Équipe', accent: '#0054F0', deep: '#001F6B' },
  supporter: { label: 'Supporter', accent: '#3C00F0', deep: '#180078' },
  sponsor: { label: 'Sponsor', accent: '#D4AF37', deep: '#070605' },
};
