import type { IconName } from '../components/ui/iconNames';
import type { ClubNavItemId } from '../features/club/navigation/clubNavConfig';
import { CLUB_TOKENS, CLUB_SITE_LEGACY } from '../features/club/theme/clubTokens';

/** Chrome partagé app Club — navy premium + accent violet pôle. */
export const CLUB_SITE = {
  ...CLUB_SITE_LEGACY,
  accent: CLUB_TOKENS.accent,
  deep: CLUB_TOKENS.accentDeep,
  soft: CLUB_TOKENS.accentSoft,
  glow: CLUB_TOKENS.pitchSoft,
  bg: CLUB_TOKENS.bg,
  band: CLUB_TOKENS.headerWash,
  surface: CLUB_TOKENS.surface,
  elevated: CLUB_TOKENS.elevated,
  border: CLUB_TOKENS.border,
  foreground: CLUB_TOKENS.foreground,
  muted: CLUB_TOKENS.muted,
  pitch: CLUB_TOKENS.pitch,
} as const;

export type ClubPageLayout =
  | 'briefing'
  | 'tree'
  | 'pipeline'
  | 'arena'
  | 'editorial'
  | 'studio'
  | 'market'
  | 'signal'
  | 'map';

export type ClubPageIdentity = {
  id: ClubNavItemId | 'locked';
  eyebrow: string;
  title: string;
  support: string;
  icon: IconName;
  accent: string;
  accentSoft: string;
  wash: [string, string];
  layout: ClubPageLayout;
  motif: 'rays' | 'grid' | 'stripes' | 'dots' | 'none';
};

const SITE_CHROME = {
  accent: CLUB_TOKENS.accent,
  accentSoft: CLUB_TOKENS.accentSoft,
  wash: [CLUB_TOKENS.bg, CLUB_TOKENS.surface] as [string, string],
};

function page(
  partial: Omit<ClubPageIdentity, 'accent' | 'accentSoft' | 'wash'> & {
    wash?: [string, string];
  },
): ClubPageIdentity {
  return {
    ...SITE_CHROME,
    wash: partial.wash ?? SITE_CHROME.wash,
    ...partial,
    accent: SITE_CHROME.accent,
    accentSoft: SITE_CHROME.accentSoft,
  };
}

const DEFAULT_IDENTITY = page({
  id: 'today',
  eyebrow: 'Club',
  title: 'Accueil',
  support: 'Centre de contrôle',
  icon: 'home',
  layout: 'briefing',
  motif: 'rays',
});

export const CLUB_PAGE_IDENTITIES: Partial<Record<ClubNavItemId, ClubPageIdentity>> = {
  today: page({
    id: 'today',
    eyebrow: 'Pilotage',
    title: 'Accueil',
    support: 'AUJOURD’HUI · À FAIRE · statut club',
    icon: 'home',
    layout: 'briefing',
    motif: 'rays',
  }),
  teams: page({
    id: 'teams',
    eyebrow: 'Effectifs',
    title: 'Équipes',
    support: 'U7 → Seniors',
    icon: 'football',
    layout: 'tree',
    motif: 'stripes',
  }),
  players: page({
    id: 'players',
    eyebrow: 'Effectifs',
    title: 'Joueurs',
    support: 'Liste · fiches · docs',
    icon: 'people',
    layout: 'tree',
    motif: 'grid',
  }),
  coaches: page({
    id: 'coaches',
    eyebrow: 'Staff',
    title: 'Coach',
    support: 'Affectations & rôles',
    icon: 'school',
    layout: 'tree',
    motif: 'dots',
  }),
  calendar: page({
    id: 'calendar',
    eyebrow: 'Sport',
    title: 'Calendrier',
    support: 'Jour · semaine · mois',
    icon: 'calendar',
    layout: 'arena',
    motif: 'grid',
  }),
  matches: page({
    id: 'matches',
    eyebrow: 'Sport',
    title: 'Matchs',
    support: 'Convocs & invitations',
    icon: 'trophy',
    layout: 'arena',
    motif: 'rays',
  }),
  trainings: page({
    id: 'trainings',
    eyebrow: 'Sport',
    title: 'Entraînements',
    support: 'Présences',
    icon: 'time',
    layout: 'arena',
    motif: 'stripes',
  }),
  communication: page({
    id: 'communication',
    eyebrow: 'Ops',
    title: 'Communication',
    support: 'Équipes · coachs · parents',
    icon: 'chat',
    layout: 'signal',
    motif: 'dots',
  }),
  recruitment: page({
    id: 'recruitment',
    eyebrow: 'Ops',
    title: 'Recrutement',
    support: 'Bassin & suivi des recrutements',
    icon: 'briefcase',
    layout: 'pipeline',
    motif: 'stripes',
  }),
  video: page({
    id: 'video',
    eyebrow: 'Ops',
    title: 'Vidéo',
    support: 'Veo · XbotGo · smartphone',
    icon: 'videocam',
    layout: 'studio',
    motif: 'stripes',
  }),
  stats: page({
    id: 'stats',
    eyebrow: 'Ops',
    title: 'Statistiques',
    support: 'Insights club',
    icon: 'stats-chart',
    layout: 'signal',
    motif: 'grid',
  }),
  club: page({
    id: 'club',
    eyebrow: 'Club',
    title: 'Club',
    support: 'Identité & réglages',
    icon: 'business',
    layout: 'editorial',
    motif: 'none',
  }),
  pack: page({
    id: 'pack',
    eyebrow: 'Pack Club',
    title: 'Pack Club',
    support: 'SUR DEVIS · dès 3 € / adhérent',
    icon: 'star-outline',
    layout: 'market',
    motif: 'grid',
  }),
  assistant: page({
    id: 'assistant',
    eyebrow: 'IA',
    title: 'Copilote Club',
    support: 'Dialogue réel · confirmation',
    icon: 'chat',
    layout: 'signal',
    motif: 'dots',
  }),
  plus: page({
    id: 'plus',
    eyebrow: 'Outils',
    title: 'Outils',
    support: 'Pilotage & métiers du club',
    icon: 'tune',
    layout: 'market',
    motif: 'none',
  }),
  events: page({
    id: 'events',
    eyebrow: 'Sport',
    title: 'Événements',
    support: 'Tournois & poules',
    icon: 'flag',
    layout: 'arena',
    motif: 'rays',
  }),
};

export const CLUB_LOCKED_IDENTITY: ClubPageIdentity = page({
  id: 'locked',
  eyebrow: 'Formule',
  title: 'Module verrouillé',
  support: 'Ce module s’ouvre avec une offre adaptée. Voir Pack Club.',
  icon: 'lock',
  layout: 'signal',
  motif: 'none',
});

export function getClubPageIdentity(id: ClubNavItemId): ClubPageIdentity {
  return CLUB_PAGE_IDENTITIES[id] ?? DEFAULT_IDENTITY;
}
