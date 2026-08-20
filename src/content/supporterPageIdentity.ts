import type { IconName } from '../components/ui/iconNames';
import type { MainTabId } from '../navigation/mainTabConfig';

/**
 * Tokens Pôle Supporter — alignés site `/supporter` (#3C00F0 / #180078).
 * Tribune 100 % gratuite : scores, suivis, débats, moments, shop.
 */
export const SUPPORTER_SITE = {
  accent: '#3C00F0',
  deep: '#180078',
  soft: 'rgba(60, 0, 240, 0.14)',
  glow: 'rgba(60, 0, 240, 0.35)',
  bright: '#7C5CFF',
  bg: '#000000',
  band: '#0a0618',
  surface: '#0c0c0c',
  elevated: '#141414',
  border: 'rgba(255,255,255,0.12)',
  foreground: '#f5f5f0',
  muted: 'rgba(245,245,240,0.55)',
  live: '#34D399',
  free: '#A78BFA',
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
    eyebrow: 'Tribune ProDay',
    title: 'Le score. En direct.',
    support: 'Sans payer un centime. Clubs ProDay et foot du monde.',
    icon: 'home',
    motif: 'rays',
  }),
  matchs: page({
    id: 'matchs',
    eyebrow: 'Jour J',
    title: 'Matchs',
    support: 'En direct, PRODAY, monde entier et clubs suivis.',
    icon: 'football',
    motif: 'grid',
  }),
  suivis: page({
    id: 'suivis',
    eyebrow: 'Ta sélection',
    title: 'Suivis',
    support: 'Suis des joueurs, clubs et tournois — illimité et gratuit.',
    icon: 'heart',
    motif: 'dots',
  }),
  debats: page({
    id: 'debats',
    eyebrow: 'Communauté',
    title: 'Fil',
    support: 'Question hebdo, réponses de la tribune et actus.',
    icon: 'chat',
    motif: 'stripes',
  }),
  moments: page({
    id: 'moments',
    eyebrow: 'Highlights',
    title: 'Moments',
    support: 'Reels et clips de la communauté.',
    icon: 'videocam',
    motif: 'rays',
    wash: [SUPPORTER_SITE.deep, SUPPORTER_SITE.bg],
  }),
  shop: page({
    id: 'shop',
    eyebrow: 'Merch',
    title: 'Shop',
    support: 'Équipement et goodies ProDay.',
    icon: 'bag',
    motif: 'dots',
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
