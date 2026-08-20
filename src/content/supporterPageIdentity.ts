import type { IconName } from '../components/ui/iconNames';
import type { MainTabId } from '../navigation/mainTabConfig';

/**
 * Tokens Pôle Supporter — tribune cinéma (broadcast editorial).
 * Accent unique champagne / ivoire. Surfaces encre, filets discrets.
 */
export const SUPPORTER_SITE = {
  accent: '#C9B896',
  deep: '#0A0A08',
  soft: 'rgba(201, 184, 150, 0.10)',
  glow: 'rgba(201, 184, 150, 0.12)',
  bright: '#E8DCC4',
  bg: '#050505',
  band: '#070706',
  surface: '#0C0C0B',
  elevated: '#121211',
  border: 'rgba(232, 220, 196, 0.12)',
  foreground: '#F4F1EA',
  muted: 'rgba(244, 241, 234, 0.52)',
  live: '#C9B896',
  free: '#E8DCC4',
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
    title: 'La tribune.',
    support: 'À venir, en direct, clubs ProDay et le monde. Gratuit.',
    icon: 'home',
    motif: 'none',
  }),
  matchs: page({
    id: 'matchs',
    eyebrow: 'Calendrier',
    title: 'Matchs',
    support: 'Les prochaines affiches, le live, ProDay et le monde.',
    icon: 'football',
    motif: 'none',
  }),
  suivis: page({
    id: 'suivis',
    eyebrow: 'Ta sélection',
    title: 'Suivis',
    support: 'Suis des joueurs, clubs et tournois — illimité et gratuit.',
    icon: 'heart',
    motif: 'none',
  }),
  debats: page({
    id: 'debats',
    eyebrow: 'Communauté',
    title: 'Fil',
    support: 'Question hebdo, réponses de la tribune et actus.',
    icon: 'chat',
    motif: 'none',
  }),
  moments: page({
    id: 'moments',
    eyebrow: 'Highlights',
    title: 'Moments',
    support: 'Reels et clips de la communauté.',
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
