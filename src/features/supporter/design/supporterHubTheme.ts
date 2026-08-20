import { SUPPORTER_SITE } from '../../../content/supporterPageIdentity';
import { spacing, radius } from '../../../theme/designTokens';

/** Thème media center supporter — dark immersif, accents LIVE électriques. */
export const SUPPORTER_HUB_THEME = {
  ...SUPPORTER_SITE,
  liveGlow: 'rgba(52, 211, 153, 0.25)',
  liveBorder: 'rgba(52, 211, 153, 0.45)',
  electric: '#00E5A0',
  heroGradient: ['#180078', '#000000'] as [string, string],
  cardRadius: radius.lg,
  sectionGap: spacing.lg,
  scoreboard: {
    fontSize: 28,
    letterSpacing: -0.5,
    fontWeight: '800' as const,
  },
  competitionCaps: {
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase' as const,
  },
} as const;

export type SupporterHubSectionKind =
  | 'hero_live'
  | 'match_du_jour'
  | 'proday_bridge'
  | 'videos_strip'
  | 'default';
