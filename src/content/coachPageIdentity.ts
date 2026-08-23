import type { IconName } from '../components/ui/iconNames';
import {
  canonicalizeCoachNav,
  type CoachNavItemId,
} from '../features/coach/navigation/coachNavConfig';
import { PRODAY_POLE_ACCENTS, poleAccentSoft } from '../theme/prodayBrand';

/** Tokens Pôle Coach — nuit premium, accent vert officiel. */
export const COACH_SITE = {
  accent: PRODAY_POLE_ACCENTS.coach,
  deep: '#15803D',
  soft: poleAccentSoft('coach', 0.22),
  glow: poleAccentSoft('coach', 0.28),
  bg: '#000000',
  band: '#000000',
  surface: '#1C1C1E',
  elevated: '#2C2C2E',
  border: 'rgba(255, 255, 255, 0.12)',
  foreground: '#FFFFFF',
  muted: 'rgba(235, 235, 245, 0.58)',
  pitchDeep: '#0a3d1a',
  pitch: '#14532d',
  pitchLight: '#166534',
} as const;

export type CoachPageIdentity = {
  id: CoachNavItemId | 'locked';
  eyebrow: string;
  title: string;
  support: string;
  icon: IconName;
  accent: string;
  accentSoft: string;
  wash: [string, string];
  motif: 'rays' | 'grid' | 'stripes' | 'dots' | 'none';
};

const CHROME = {
  accent: COACH_SITE.accent,
  accentSoft: COACH_SITE.soft,
  wash: [COACH_SITE.band, COACH_SITE.bg] as [string, string],
};

function page(
  partial: Omit<CoachPageIdentity, 'accent' | 'accentSoft' | 'wash'> & {
    wash?: [string, string];
  },
): CoachPageIdentity {
  return {
    ...CHROME,
    wash: partial.wash ?? CHROME.wash,
    ...partial,
    accent: CHROME.accent,
    accentSoft: CHROME.accentSoft,
  };
}

export const COACH_LOCKED_IDENTITY: CoachPageIdentity = page({
  id: 'locked',
  eyebrow: 'Module verrouillé',
  title: 'Coach Pro requis',
  support: 'Débloque Tactique IA avec Coach Pro ou l’offre club Tout inclus.',
  icon: 'lock',
  motif: 'stripes',
});

export const COACH_PAGE_IDENTITIES: Record<CoachNavItemId, CoachPageIdentity> = {
  today: page({
    id: 'today',
    eyebrow: 'Briefing',
    title: 'Accueil',
    support: 'Jour J — match ou séance, pointage et hubs.',
    icon: 'home',
    motif: 'none',
  }),
  equipe: page({
    id: 'equipe',
    eyebrow: 'Groupe',
    title: 'Équipe',
    support: 'Composition, terrain et gestion licences.',
    icon: 'football',
    motif: 'none',
  }),
  pitch: page({
    id: 'pitch',
    eyebrow: 'Briefing',
    title: 'Accueil',
    support: 'Les raccourcis Terrain sont sur l’accueil.',
    icon: 'home',
    motif: 'none',
  }),
  effectif: page({
    id: 'effectif',
    eyebrow: 'Groupe',
    title: 'Équipe',
    support: 'Composition et terrain.',
    icon: 'football',
    motif: 'none',
  }),
  gestion: page({
    id: 'gestion',
    eyebrow: 'Organisation',
    title: 'Gestion d’équipe',
    support: 'Licences, invitations, structure de catégorie.',
    icon: 'settings',
    motif: 'none',
  }),
  planning: page({
    id: 'planning',
    eyebrow: 'Calendrier',
    title: 'Agenda',
    support: 'Séances, matchs et covoiturage depuis chaque événement.',
    icon: 'calendar',
    motif: 'none',
  }),
  entrainements: page({
    id: 'entrainements',
    eyebrow: 'Calendrier',
    title: 'Entraînements',
    support: 'Planning séances, présences et convocations.',
    icon: 'calendar',
    motif: 'none',
  }),
  joueurs: page({
    id: 'joueurs',
    eyebrow: 'Effectif',
    title: 'Joueurs',
    support: 'Liste individuelle, notes coach et analyse IA.',
    icon: 'people',
    motif: 'none',
  }),
  matchs: page({
    id: 'matchs',
    eyebrow: 'Jour de match',
    title: 'Matchs',
    support: 'Live, compositions, convocations et compétitions.',
    icon: 'trophy',
    motif: 'none',
  }),
  match_center: page({
    id: 'match_center',
    eyebrow: 'Jour de match',
    title: 'Matchs',
    support: 'Live, compositions, convocations, amicaux et compétitions.',
    icon: 'trophy',
    motif: 'none',
  }),
  smart_tactics: page({
    id: 'smart_tactics',
    eyebrow: 'Outil',
    title: 'Tactique IA',
    support: 'Match → Composition → Effectif. Un parcours clair pour poser le XI.',
    icon: 'star-four-points',
    motif: 'none',
  }),
  coach_ia: page({
    id: 'coach_ia',
    eyebrow: 'Intelligence',
    title: 'Assistant IA',
    support: 'Analyse honnête, stratégie et actions prioritaires — sans données inventées.',
    icon: 'star-four-points',
    motif: 'none',
  }),
  mes_videos: page({
    id: 'mes_videos',
    eyebrow: 'Outil',
    title: 'Mes vidéos',
    support: 'Captation, Live Center, analyse IA et causeries.',
    icon: 'videocam',
    motif: 'none',
  }),
  forme: page({
    id: 'forme',
    eyebrow: 'Outil',
    title: 'Analyse de forme',
    support: 'Effectif, alertes avant match, évaluations — jamais un diagnostic.',
    icon: 'heart',
    motif: 'none',
  }),
  messages: page({
    id: 'messages',
    eyebrow: 'Inbox',
    title: 'Messagerie',
    support: 'Staff, parents, joueurs.',
    icon: 'chat',
    motif: 'none',
  }),
  com_staff: page({
    id: 'com_staff',
    eyebrow: 'Communauté',
    title: 'Communauté',
    support: 'Salons équipe · messagerie, mercato, trajets',
    icon: 'chat',
    motif: 'none',
  }),
  carpool: page({
    id: 'carpool',
    eyebrow: 'Déplacements',
    title: 'Covoiturage',
    support: 'Trajets match et entraînement.',
    icon: 'car',
    motif: 'none',
  }),
  profil: page({
    id: 'profil',
    eyebrow: 'Compte',
    title: 'Profil coach',
    support: 'Diplômes, bio, vitrine publique.',
    icon: 'person',
    motif: 'none',
  }),
  plus: page({
    id: 'plus',
    eyebrow: 'Navigation',
    title: 'Menu',
    support: 'Matchs, séances, tactique IA, vidéos et plus.',
    icon: 'hamburger',
    motif: 'none',
  }),
};

export function getCoachPageIdentity(id: CoachNavItemId): CoachPageIdentity {
  const canonical = canonicalizeCoachNav(id);
  return COACH_PAGE_IDENTITIES[canonical] ?? COACH_PAGE_IDENTITIES.today;
}
