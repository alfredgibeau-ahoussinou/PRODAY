import { useMemo } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing, radius, shadows, BRAND } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';

/** Au-dessus de la barre CTA fixe (prompt connexion). */
export const DISCOVER_LOGIN_PROMPT_BOTTOM = TAB_BAR_CONTENT_INSET + 132;

export const discoverLayout = {
  pagePadH: spacing.lg,
  cardRadius: radius.lg,
  tabHeight: 44,
  headerLogoW: 160,
} as const;

export function getDiscoverPalette(c: AppColors) {
  return {
    canvas: c.background,
    surface: c.surface,
    surfaceMuted: c.surfaceMuted,
    surfaceRaised: c.surfaceMuted,
    text: c.text,
    muted: c.textSecondary,
    faint: c.textMuted,
    border: c.border,
    live: c.accent,
    liveBg: c.accentSoft,
    ink: c.ink,
    card: c.surface,
    cardBorder: c.border,
    canvasDeep: c.surfaceMuted,
  } as const;
}

export function createDiscoverStyles(palette: ReturnType<typeof getDiscoverPalette>) {
  return StyleSheet.create({
    canvas: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    header: {
      width: '100%',
      alignItems: 'center',
      paddingHorizontal: discoverLayout.pagePadH,
      paddingBottom: spacing.md,
      backgroundColor: palette.surface,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
      overflow: 'hidden',
    },
    headerGradientBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
    },
    tagline: {
      marginTop: spacing.sm,
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: palette.faint,
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
      backgroundColor: palette.surface,
      borderRadius: discoverLayout.cardRadius,
      borderWidth: 1,
      borderColor: palette.border,
      marginBottom: spacing.md,
      ...shadows.card,
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: palette.live,
    },
    statsRowText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: palette.text,
      lineHeight: 18,
    },
    shortcut: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      backgroundColor: palette.surface,
      borderRadius: discoverLayout.cardRadius,
      borderWidth: 1,
      borderColor: palette.border,
      ...shadows.card,
    },
    shortcutIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.sm,
      backgroundColor: palette.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shortcutTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: palette.text,
    },
    shortcutSub: {
      fontSize: 11,
      fontWeight: '500',
      color: palette.muted,
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
      color: palette.faint,
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
      backgroundColor: palette.liveBg,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(22, 163, 74, 0.25)',
      alignSelf: 'center',
      maxWidth: '100%',
    },
    headerStatsText: {
      fontSize: 12,
      fontWeight: '700',
      color: palette.ink,
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
      backgroundColor: palette.surface,
      borderRadius: discoverLayout.cardRadius,
      borderWidth: 1,
      borderColor: palette.border,
      ...shadows.card,
    },
    trustText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
      color: palette.muted,
    },
    trustBold: {
      fontWeight: '800',
      color: palette.text,
    },
    emptyCard: {
      padding: spacing.lg,
      backgroundColor: palette.surface,
      borderRadius: discoverLayout.cardRadius,
      borderWidth: 1,
      borderColor: palette.border,
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    emptyCardText: {
      fontSize: 13,
      color: palette.muted,
      textAlign: 'center',
      lineHeight: 19,
      fontWeight: '500',
    },
  });
}

export function useDiscoverStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => {
    const palette = getDiscoverPalette(colors);
    const styles = createDiscoverStyles(palette);
    return { palette, styles, colors };
  }, [colors]);
}

export { BRAND };
