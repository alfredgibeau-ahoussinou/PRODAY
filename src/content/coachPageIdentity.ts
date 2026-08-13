import type { IconName } from '../components/ui/iconNames';
import type { CoachNavItemId } from '../features/coach/navigation/coachNavConfig';

/** Tokens Pôle Coach — même famille visuelle que Club (ProDay bleu). */
export const COACH_SITE = {
  accent: '#006CFC',
  deep: '#002478',
  soft: 'rgba(0, 108, 252, 0.14)',
  glow: 'rgba(0, 108, 252, 0.32)',
  bg: '#000000',
  band: '#04120a',
  surface: '#0c0c0c',
  elevated: '#141414',
  border: 'rgba(255,255,255,0.12)',
  foreground: '#f5f5f0',
  muted: 'rgba(245,245,240,0.55)',
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
    eyebrow: 'Briefing coach',
    title: 'Aujourd’hui',
    support: 'Priorités, prochain match, forme de l’effectif.',
    icon: 'home',
    motif: 'rays',
  }),
  pitch: page({
    id: 'pitch',
    eyebrow: 'Cockpit',
    title: 'Terrain',
    support: 'Six commandes pour piloter ton équipe.',
    icon: 'football',
    motif: 'grid',
    wash: [COACH_SITE.pitchDeep, COACH_SITE.bg],
  }),
  effectif: page({
    id: 'effectif',
    eyebrow: 'Groupe',
    title: 'Effectif & stade',
    support: 'Roster, bourse interne, cartes joueurs sur le terrain.',
    icon: 'people',
    motif: 'dots',
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
    eyebrow: 'Séances',
    title: 'Planning',
    support: 'Plans d’entraînement et suggestions IA.',
    icon: 'calendar',
    motif: 'stripes',
  }),
  matchs: page({
    id: 'matchs',
    eyebrow: 'Jour de match',
    title: 'Prochain match',
    support: 'Flux guidé, causerie, consignes tactiques.',
    icon: 'football-outline',
    motif: 'rays',
  }),
  match_center: page({
    id: 'match_center',
    eyebrow: 'Jour de match',
    title: 'Centre Match',
    support: 'Live, compositions, convocations, amicaux et compétitions.',
    icon: 'trophy',
    motif: 'rays',
  }),
  smart_tactics: page({
    id: 'smart_tactics',
    eyebrow: 'IA terrain',
    title: 'Tactique IA',
    support: 'Match → Composition → Effectif. Un parcours clair pour poser le XI.',
    icon: 'star-four-points',
    motif: 'grid',
  }),
  mes_videos: page({
    id: 'mes_videos',
    eyebrow: 'Centre vidéo coach',
    title: 'Mes vidéos',
    support: 'Captation, Live Center, analyse IA et causeries.',
    icon: 'videocam',
    motif: 'stripes',
    wash: [COACH_SITE.pitchDeep, COACH_SITE.bg],
  }),
  forme: page({
    id: 'forme',
    eyebrow: 'Charge & récupération',
    title: 'Analyse de forme',
    support: 'Effectif, alertes avant match, évaluations et objectifs — jamais un diagnostic.',
    icon: 'heart',
    motif: 'dots',
  }),
  messages: page({
    id: 'messages',
    eyebrow: 'Inbox',
    title: 'Messages',
    support: 'Staff, parents, joueurs.',
    icon: 'chat',
    motif: 'none',
  }),
  com_staff: page({
    id: 'com_staff',
    eyebrow: 'Relais',
    title: 'Parents & alertes',
    support: 'Notifications, documents, annonces club.',
    icon: 'mail',
    motif: 'stripes',
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
    eyebrow: 'Identité',
    title: 'Profil coach',
    support: 'Diplômes, bio, vitrine publique.',
    icon: 'person',
    motif: 'none',
  }),
};

export function getCoachPageIdentity(id: CoachNavItemId): CoachPageIdentity {
  return COACH_PAGE_IDENTITIES[id] ?? COACH_PAGE_IDENTITIES.today;
}
