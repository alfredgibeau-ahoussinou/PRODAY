import { StyleSheet, Platform } from 'react-native';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { colors, spacing, radius, shadows, BRAND } from '../../theme/designTokens';

/** Au-dessus de la barre CTA fixe (prompt connexion). */
export const DISCOVER_LOGIN_PROMPT_BOTTOM = TAB_BAR_CONTENT_INSET + 132;

/** Accueil invité — clair & minimal (designTokens v2). */
export const discoverPalette = {
  canvas: colors.background,
  surface: colors.surface,
  surfaceMuted: colors.surfaceMuted,
  surfaceRaised: colors.surfaceMuted,
  text: colors.text,
  muted: colors.textSecondary,
  faint: colors.textMuted,
  border: colors.border,
  live: colors.success,
  liveBg: colors.successBg,
  ink: colors.ink,
  card: colors.surface,
  cardBorder: colors.border,
  canvasDeep: colors.surfaceMuted,
} as const;

export const discoverLayout = {
  pagePadH: spacing.lg,
  cardRadius: radius.lg,
  tabHeight: 44,
  headerLogoW: 160,
} as const;

export const discoverStyles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: discoverPalette.canvas,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: discoverLayout.pagePadH,
    paddingBottom: spacing.md,
    backgroundColor: discoverPalette.surface,
    borderBottomWidth: 1,
    borderBottomColor: discoverPalette.border,
  },
  tagline: {
    marginTop: spacing.sm,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: discoverPalette.faint,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    maxWidth: '100%',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  taglineCompact: {
    fontSize: 8,
    letterSpacing: 1.8,
    marginTop: spacing.xs,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: discoverPalette.surface,
    borderRadius: discoverLayout.cardRadius,
    borderWidth: 1,
    borderColor: discoverPalette.border,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: discoverPalette.live,
  },
  statsRowText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: discoverPalette.text,
    lineHeight: 18,
  },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: discoverPalette.surface,
    borderRadius: discoverLayout.cardRadius,
    borderWidth: 1,
    borderColor: discoverPalette.border,
    ...shadows.card,
  },
  shortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: discoverPalette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: discoverPalette.text,
  },
  shortcutSub: {
    fontSize: 11,
    fontWeight: '500',
    color: discoverPalette.muted,
    marginTop: 2,
  },
  shortcuts: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: discoverPalette.faint,
    marginBottom: spacing.sm,
    textAlign: 'left',
    width: '100%',
  },
  headerStats: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: discoverPalette.liveBg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.25)',
    alignSelf: 'center',
    maxWidth: '100%',
  },
  headerStatsText: {
    fontSize: 12,
    fontWeight: '700',
    color: discoverPalette.ink,
    textAlign: 'center',
    flexShrink: 1,
  },
  headerStatsCompact: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs + 2,
  },
  trust: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: discoverPalette.surface,
    borderRadius: discoverLayout.cardRadius,
    borderWidth: 1,
    borderColor: discoverPalette.border,
    ...shadows.card,
  },
  trustText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: discoverPalette.muted,
  },
  trustBold: {
    fontWeight: '800',
    color: discoverPalette.text,
  },
  emptyCard: {
    padding: spacing.lg,
    backgroundColor: discoverPalette.surface,
    borderRadius: discoverLayout.cardRadius,
    borderWidth: 1,
    borderColor: discoverPalette.border,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  emptyCardText: {
    fontSize: 13,
    color: discoverPalette.muted,
    textAlign: 'center',
    lineHeight: 19,
    fontWeight: '500',
  },
});

export { BRAND };
