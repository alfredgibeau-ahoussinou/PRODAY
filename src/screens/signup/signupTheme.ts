import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import { AUTH_SHEET } from '../../components/auth/authSheetPalette';
import { useSignupFlowTheme } from './SignupFlowContext';

/** Styles partagés — parcours d'inscription ProDay */
export function createSignupTheme(c: AppColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: AUTH_SHEET.background,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: AUTH_SHEET.textMuted,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    card: {
      backgroundColor: AUTH_SHEET.backgroundMuted,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: AUTH_SHEET.border,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadows.card,
    },
    cardMuted: {
      backgroundColor: AUTH_SHEET.backgroundMuted,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: AUTH_SHEET.border,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    chip: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: AUTH_SHEET.border,
      backgroundColor: AUTH_SHEET.background,
      minHeight: 52,
      justifyContent: 'center',
    },
    chipActive: {
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    chipTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: AUTH_SHEET.text,
    },
    chipTitleActive: {
      color: '#000000',
    },
    chipHint: {
      fontSize: 12,
      color: AUTH_SHEET.textMuted,
      marginTop: 2,
      lineHeight: 17,
    },
    chipHintActive: {
      color: 'rgba(255,255,255,0.72)',
    },
    fieldError: {
      color: c.error,
      fontSize: 12,
      marginBottom: spacing.sm,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
}

export function useSignupTheme() {
  const { colors } = useSignupFlowTheme();
  return useMemo(() => createSignupTheme(colors), [colors]);
}
