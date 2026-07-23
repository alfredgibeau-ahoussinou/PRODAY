import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import { useSignupFlowTheme } from './SignupFlowContext';

/** Styles partagés — parcours d'inscription ProDay */
export function createSignupTheme(c: AppColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: c.textMuted,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadows.card,
    },
    cardMuted: {
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    chip: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.surface,
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
      color: c.text,
    },
    chipTitleActive: {
      color: '#000000',
    },
    chipHint: {
      fontSize: 12,
      color: c.textMuted,
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
