import type { IconName } from '../components/ui/iconNames';
import type { MainTabId } from '../navigation/mainTabConfig';
import { FOOTBALL_HUB } from '../features/footballHub/theme/footballHubTheme';

/**
 * Tokens Football Hub (ex-pôle Supporter) — violet ProDay immersif.
 * Alignés sur `FOOTBALL_HUB` ; conservés pour écrans secondaires / legacy.
 */
export const SUPPORTER_SITE = {
  accent: FOOTBALL_HUB.accent,
  deep: FOOTBALL_HUB.deep,
  soft: FOOTBALL_HUB.soft,
  glow: FOOTBALL_HUB.glow,
  bright: FOOTBALL_HUB.bright,
  bg: FOOTBALL_HUB.bg,
  band: FOOTBALL_HUB.band,
  surface: FOOTBALL_HUB.surface,
  elevated: FOOTBALL_HUB.elevated,
  border: FOOTBALL_HUB.border,
  foreground: FOOTBALL_HUB.foreground,
  muted: FOOTBALL_HUB.muted,
  live: FOOTBALL_HUB.live,
  free: FOOTBALL_HUB.bright,
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
    eyebrow: 'Football Hub',
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
