import type { IconName } from '../components/ui/iconNames';
import type { MainTabId } from '../navigation/mainTabConfig';

/**
 * Tokens Pôle Supporter — tribune fan (énergie stade, violet ProDay).
 * LIVE en vert menthe distinct ; surfaces sombres avec lavis violet.
 */
export const SUPPORTER_SITE = {
  accent: '#3C00F0',
  deep: '#180078',
  soft: 'rgba(60, 0, 240, 0.12)',
  glow: 'rgba(60, 0, 240, 0.14)',
  bright: '#7C5CFF',
  bg: '#000000',
  band: '#0c0c0c',
  surface: '#0c0c0c',
  elevated: '#141414',
  border: 'rgba(124, 92, 255, 0.18)',
  foreground: '#FAFAFA',
  muted: 'rgba(250, 250, 250, 0.55)',
  live: '#34D399',
  free: '#7C5CFF',
} as const;

export type SupporterPageId =
  | 'tribune'
  | 'matchs'
  | 'suivis'
  | 'debats'
  | 'moments'
  | 'shop'
  | 'compte';

export type SupporterPageIdentity = {
  id: SupporterPageId;
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
  accent: SUPPORTER_SITE.accent,
  accentSoft: SUPPORTER_SITE.soft,
  wash: [SUPPORTER_SITE.band, SUPPORTER_SITE.bg] as [string, string],
};

function page(
  partial: Omit<SupporterPageIdentity, 'accent' | 'accentSoft' | 'wash'> & {
    wash?: [string, string];
  },
): SupporterPageIdentity {
  return {
    ...CHROME,
    wash: partial.wash ?? CHROME.wash,
    ...partial,
    accent: CHROME.accent,
    accentSoft: CHROME.accentSoft,
  };
}

export const SUPPORTER_PAGE_IDENTITIES: Record<SupporterPageId, SupporterPageIdentity> = {
  tribune: page({
    id: 'tribune',
    eyebrow: 'Centre du football',
    title: 'Accueil',
    support: 'Live, tes clubs, ProDay et le monde — tout le football en un lieu.',
    icon: 'home',
    motif: 'none',
  }),
  matchs: page({
    id: 'matchs',
    eyebrow: 'Calendrier',
    title: 'Matchs',
    support: 'Live, à venir, ProDay et le monde — filtre comme tu veux.',
    icon: 'football',
    motif: 'none',
  }),
  suivis: page({
    id: 'suivis',
    eyebrow: 'Explorer',
    title: 'Explorer',
    support: 'Clubs, ligues, matchs et vidéos — recherche globale.',
    icon: 'search',
    motif: 'none',
  }),
  debats: page({
    id: 'debats',
    eyebrow: 'La tribune',
    title: 'Fil',
    support: 'Question hebdo, réponses des fans et actus.',
    icon: 'chat',
    motif: 'none',
  }),
  moments: page({
    id: 'moments',
    eyebrow: 'Vidéos',
    title: 'Vidéos',
    support: 'Replays ProDay, highlights et clips communauté (droits vérifiés).',
    icon: 'videocam',
    motif: 'none',
  }),
  shop: page({
    id: 'shop',
    eyebrow: 'Merch',
    title: 'Shop',
    support: 'Équipement et goodies ProDay.',
    icon: 'bag',
    motif: 'none',
  }),
  compte: page({
    id: 'compte',
    eyebrow: 'Profil',
    title: 'Compte',
    support: 'Alertes, suivis et préférences. Tribune toujours gratuite.',
    icon: 'person',
    motif: 'none',
  }),
};

export function getSupporterPageIdentity(id: SupporterPageId): SupporterPageIdentity {
  return SUPPORTER_PAGE_IDENTITIES[id];
}

/** Mappe un onglet shell → identité de page. */
export function supporterPageFromTab(tab: MainTabId): SupporterPageId {
  switch (tab) {
    case 'home':
      return 'tribune';
    case 'matchs':
      return 'matchs';
    case 'feed':
      return 'suivis';
    case 'messages':
      return 'debats';
    case 'reels':
      return 'moments';
    case 'shop':
      return 'shop';
    case 'profil':
      return 'compte';
    default:
      return 'tribune';
  }
}
