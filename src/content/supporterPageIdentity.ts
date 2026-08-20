import type { IconName } from '../components/ui/iconNames';
import type { MainTabId } from '../navigation/mainTabConfig';
import { SUPPORTER_SPACE } from '../features/supporterSpace/theme/supporterSpaceTheme';

/**
 * Tokens Football Hub (ex-pôle Supporter) — violet ProDay immersif.
 * Alignés sur `SUPPORTER_SPACE` ; conservés pour écrans secondaires / legacy.
 */
export const SUPPORTER_SITE = {
  accent: SUPPORTER_SPACE.accent,
  deep: SUPPORTER_SPACE.deep,
  soft: SUPPORTER_SPACE.soft,
  glow: SUPPORTER_SPACE.glow,
  bright: SUPPORTER_SPACE.bright,
  bg: SUPPORTER_SPACE.bg,
  band: SUPPORTER_SPACE.band,
  surface: SUPPORTER_SPACE.surface,
  elevated: SUPPORTER_SPACE.elevated,
  border: SUPPORTER_SPACE.border,
  foreground: SUPPORTER_SPACE.foreground,
  muted: SUPPORTER_SPACE.muted,
  live: SUPPORTER_SPACE.live,
  free: SUPPORTER_SPACE.bright,
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
    eyebrow: 'Supporter Space',
    title: 'Accueil',
    support: 'Tout le football, au même endroit.',
    icon: 'home',
    motif: 'none',
  }),
  matchs: page({
    id: 'matchs',
    eyebrow: 'Calendrier',
    title: 'Matchs',
    support: 'Live, aujourd’hui, à venir et monde.',
    icon: 'football',
    motif: 'none',
  }),
  suivis: page({
    id: 'suivis',
    eyebrow: 'ProDay',
    title: 'ProDay',
    support: 'Matchs amateur, TV et pont ProDay.',
    icon: 'star-four-points',
    motif: 'none',
  }),
  debats: page({
    id: 'debats',
    eyebrow: 'Communauté',
    title: 'Fil',
    support: 'Questions et échanges supporters.',
    icon: 'chat',
    motif: 'none',
  }),
  moments: page({
    id: 'moments',
    eyebrow: 'Médias',
    title: 'Vidéos',
    support: 'Replays avec droits disponibles.',
    icon: 'videocam',
    motif: 'none',
  }),
  shop: page({
    id: 'shop',
    eyebrow: 'Boutique',
    title: 'Shop',
    support: 'Merch ProDay.',
    icon: 'bag',
    motif: 'none',
  }),
  compte: page({
    id: 'compte',
    eyebrow: 'Compte',
    title: 'Profil',
    support: 'Identité, favoris et alertes.',
    icon: 'person',
    motif: 'none',
  }),
};

export function getSupporterPageIdentity(id: SupporterPageId): SupporterPageIdentity {
  return SUPPORTER_PAGE_IDENTITIES[id];
}

export function supporterPageFromTab(tab: MainTabId): SupporterPageId {
  switch (tab) {
    case 'home':
      return 'tribune';
    case 'matchs':
      return 'matchs';
    case 'feed':
      return 'suivis';
    case 'plus':
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
