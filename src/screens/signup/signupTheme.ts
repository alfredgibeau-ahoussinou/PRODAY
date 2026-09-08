import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { spacing, radius } from '../../theme/designTokens';
import { useSignupFlowTheme } from './SignupFlowContext';
import type { SignupVisualChrome } from './signupVisualSystem';

/** Styles partagés — chrome inscription = shells (plus de AUTH_SHEET blanc). */
export function createSignupTheme(v: SignupVisualChrome) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: v.bg,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.3,
      textTransform: 'uppercase',
      color: v.textFaint,
      marginBottom: spacing.sm,
    },
    card: {
      backgroundColor: v.elevated,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: v.border,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    cardMuted: {
      backgroundColor: v.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: v.border,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    chip: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: v.border,
      backgroundColor: v.surface,
      minHeight: 52,
      justifyContent: 'center',
    },
    chipActive: {
      backgroundColor: v.accent,
      borderColor: v.accent,
    },
    chipTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: v.text,
    },
    chipTitleActive: {
      color: v.onAccent,
    },
    chipHint: {
      fontSize: 12,
      color: v.textMuted,
      marginTop: 2,
      lineHeight: 17,
    },
    chipHintActive: {
      color: v.onAccent,
      opacity: 0.8,
    },
    fieldError: {
      color: v.danger,
      fontSize: 12,
      marginBottom: spacing.sm,
      fontWeight: '600',
    },
  });
}

export function useSignupTheme() {
  const { visual } = useSignupFlowTheme();
  return useMemo(() => createSignupTheme(visual), [visual]);
}
