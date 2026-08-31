import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';

import { AUTH_SHEET } from './authSheetPalette';

/** Bandeau noir + feuille blanche — chrome auth / PitchSheetChrome. */
export function createPitchStyles(_c: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: AUTH_SHEET.heroBackground,
    },
    scrollContent: {
      flexGrow: 1,
    },
    hero: {
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xxl + spacing.md,
      backgroundColor: AUTH_SHEET.heroBackground,
    },
    sheet: {
      flex: 1,
      marginTop: -spacing.xl,
      backgroundColor: AUTH_SHEET.background,
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
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#CCCCCC',
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
    },
    sheetTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: AUTH_SHEET.text,
      letterSpacing: -0.5,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    sheetSub: {
      fontSize: 14,
      lineHeight: 21,
      color: AUTH_SHEET.textSecondary,
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
