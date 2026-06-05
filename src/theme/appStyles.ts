import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { spacing, radius, typography, shadows, surfaces } from './designTokens';
import { useAppTheme } from '../context/ProductLineContext';
import type { AppColors } from './universeTheme';

/** Styles partagés — toutes les pages (ProDay v2) */
export function createAppStyles(c: AppColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      paddingBottom: spacing.xl,
    },
    contentWithTabBar: {
      paddingBottom: 72,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.8,
      color: c.brand,
      textTransform: 'uppercase',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.xs,
    },
    sectionTitle: {
      fontSize: typography.sizes.section,
      fontWeight: '800',
      color: c.text,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
      letterSpacing: -0.3,
    },
    card: {
      ...surfaces.card,
      padding: spacing.lg,
    },
    cardSoft: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      ...shadows.soft,
    },
    primaryBtn: {
      backgroundColor: c.brand,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      alignItems: 'center',
      ...shadows.interactive,
    },
    primaryBtnText: {
      color: c.brandInverse,
      fontWeight: '800',
      fontSize: 15,
    },
    secondaryBtn: {
      backgroundColor: c.surface,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      ...shadows.soft,
    },
    secondaryBtnText: {
      color: c.text,
      fontWeight: '700',
      fontSize: 14,
    },
    fab: {
      backgroundColor: c.brand,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      ...shadows.fab,
    },
    fabText: {
      color: c.brandInverse,
      fontWeight: '800',
      fontSize: 15,
    },
    empty: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 22,
      paddingHorizontal: spacing.lg,
    },
    link: {
      color: c.brand,
      fontWeight: '700',
      fontSize: 14,
    },
  });
}

export function useAppStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => createAppStyles(colors), [colors]);
}
