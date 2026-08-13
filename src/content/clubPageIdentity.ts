import type { IconName } from '../components/ui/iconNames';
import type { ClubNavItemId } from '../features/club/navigation/clubNavConfig';

/**
 * Identité visuelle Pôle Club — alignée site `/pro-club` (terminal cinéma).
 * Un seul accent électrique ; les pages se différencient par layout / copy / motif.
 */

/** Tokens brand site `poleAccentCssVars('pro_club')`. */
export const CLUB_SITE = {
  accent: '#006CFC',
  deep: '#002478',
  soft: 'rgba(0, 108, 252, 0.14)',
  glow: 'rgba(0, 108, 252, 0.35)',
  bg: '#000000',
  band: '#020814',
  surface: '#0c0c0c',
  elevated: '#141414',
  border: 'rgba(255,255,255,0.12)',
  foreground: '#f5f5f0',
  muted: 'rgba(245,245,240,0.55)',
  /** Terrain (ClubPitchMap site). */
  pitchDeep: '#0a3d1a',
  pitch: '#14532d',
  pitchLight: '#166534',
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
  accent: CLUB_SITE.accent,
  accentSoft: CLUB_SITE.soft,
  wash: [CLUB_SITE.band, CLUB_SITE.bg] as [string, string],
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

export const CLUB_PAGE_IDENTITIES: Record<ClubNavItemId, ClubPageIdentity> = {
  today: page({
    id: 'today',
    eyebrow: 'Briefing président',
    title: 'Aujourd’hui',
    support: 'Priorités, décisions, raccourcis — le QG du club.',
    icon: 'home',
    layout: 'briefing',
    motif: 'rays',
  }),
  assistant: page({
    id: 'assistant',
    eyebrow: 'Copilote',
    title: 'Assistant IA',
    support: 'Chat live Mistral — vraies réponses, pas une FAQ.',
    icon: 'star-four-points',
    layout: 'signal',
    motif: 'dots',
  }),
  pitch: page({
    id: 'pitch',
    eyebrow: 'Cockpit',
    title: 'Un terrain. Six commandes.',
    support: 'Le club en un coup d’œil — comme sur Pro Day Club.',
    icon: 'football',
    layout: 'map',
    motif: 'grid',
    wash: [CLUB_SITE.pitchDeep, CLUB_SITE.bg],
  }),
  structure: page({
    id: 'structure',
    eyebrow: 'Organisation',
    title: 'Structure',
    support: 'Arbre des équipes, coachs, adhésions.',
    icon: 'people',
    layout: 'tree',
    motif: 'stripes',
  }),
  vivier: page({
    id: 'vivier',
    eyebrow: 'Bourse interne',
    title: 'Vivier',
    support: 'Équipe B et réserve avant de chercher dehors.',
    icon: 'football-outline',
    layout: 'pipeline',
    motif: 'grid',
  }),
  pipeline: page({
    id: 'pipeline',
    eyebrow: 'Recrutement',
    title: 'Pipeline Observé → Intégré',
    support: 'Mercato externe après le vivier.',
    icon: 'briefcase',
    layout: 'pipeline',
    motif: 'stripes',
  }),
  calendar: page({
    id: 'calendar',
    eyebrow: 'Planning',
    title: 'Calendrier',
    support: 'Matchs, séances, convocations.',
    icon: 'calendar',
    layout: 'arena',
    motif: 'grid',
  }),
  invites: page({
    id: 'invites',
    eyebrow: 'Matchs',
    title: 'Invitations',
    support: 'Club ↔ club — proposer, accepter, convoquer.',
    icon: 'handshake',
    layout: 'arena',
    motif: 'rays',
  }),
  events: page({
    id: 'events',
    eyebrow: 'Compétition',
    title: 'Tournois & Live',
    support: 'Poules, QR, feuille live.',
    icon: 'trophy',
    layout: 'arena',
    motif: 'stripes',
  }),
  messages: page({
    id: 'messages',
    eyebrow: 'Communication',
    title: 'Messages',
    support: 'Staff, effectif, fils d’équipe.',
    icon: 'chat',
    layout: 'signal',
    motif: 'dots',
  }),
  vitrine: page({
    id: 'vitrine',
    eyebrow: 'Image publique',
    title: 'Vitrine',
    support: 'Identité, galerie, annonces club.',
    icon: 'image',
    layout: 'editorial',
    motif: 'none',
  }),
  offers: page({
    id: 'offers',
    eyebrow: 'Formules',
    title: 'Offres Club',
    support: 'Amateur · Essentiel · Tout inclus · Pro + Veo.',
    icon: 'star-outline',
    layout: 'market',
    motif: 'grid',
    wash: ['#050505', CLUB_SITE.bg],
  }),
  carpool: page({
    id: 'carpool',
    eyebrow: 'Déplacements',
    title: 'Covoiturage',
    support: 'Trajets matchs et déplacements groupés.',
    icon: 'car',
    layout: 'map',
    motif: 'stripes',
  }),
  equipment: page({
    id: 'equipment',
    eyebrow: 'Matériel',
    title: 'Équipements',
    support: 'Marketplace entre licenciés.',
    icon: 'shirt',
    layout: 'market',
    motif: 'grid',
  }),
  sponsors: page({
    id: 'sponsors',
    eyebrow: 'Partenariats',
    title: 'Sponsors',
    support: 'Micro-sponsoring et mises en avant.',
    icon: 'business',
    layout: 'editorial',
    motif: 'rays',
  }),
  video: page({
    id: 'video',
    eyebrow: 'Centre Vidéo',
    title: 'Centre Vidéo',
    support: 'Caméra → Match → IA → Clips → Causerie. Veo, XbotGo ou smartphone.',
    icon: 'videocam',
    layout: 'studio',
    motif: 'stripes',
    wash: ['#050505', CLUB_SITE.bg],
  }),
  shop: page({
    id: 'shop',
    eyebrow: 'Boutique',
    title: 'Shop ProDay',
    support: 'Équipement et merch club.',
    icon: 'bag',
    layout: 'market',
    motif: 'dots',
  }),
};

export const CLUB_LOCKED_IDENTITY: ClubPageIdentity = page({
  id: 'locked',
  eyebrow: 'Formule',
  title: 'Module verrouillé',
  support: 'Ce dossier s’ouvre avec une offre adaptée.',
  icon: 'lock',
  layout: 'signal',
  motif: 'none',
});

export function getClubPageIdentity(id: ClubNavItemId): ClubPageIdentity {
  return CLUB_PAGE_IDENTITIES[id];
}
