import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';

/** Bandeau noir + feuille blanche — DiscoverStage legacy uniquement. */
export function createPitchStyles(c: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.ink,
    },
    scrollContent: {
      flexGrow: 1,
    },
    hero: {
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xxl + spacing.lg,
      backgroundColor: c.ink,
    },
    sheet: {
      marginTop: -spacing.xxl,
      marginHorizontal: spacing.md,
      backgroundColor: c.surface,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      overflow: 'hidden',
      ...shadows.interactive,
    },
    sheetAccent: {
      height: 4,
      marginHorizontal: -spacing.lg,
      marginBottom: spacing.md,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      marginBottom: spacing.lg,
    },
    sheetTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: c.text,
      letterSpacing: -0.5,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    sheetSub: {
      fontSize: 14,
      lineHeight: 21,
      color: c.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
      paddingHorizontal: spacing.sm,
    },
  });
}

export function usePitchStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => createPitchStyles(colors), [colors]);
}
