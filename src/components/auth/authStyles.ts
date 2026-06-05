import { useMemo } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';

/** Connexion / inscription — aligné sur l’accueil invité clair (#F7F7F7). */
export function createAuthStyles(c: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
    scroll: {
      flexGrow: 1,
    },
    header: {
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: c.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    headerRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerLogo: {
      flex: 1,
      alignItems: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    tagline: {
      marginTop: spacing.xs,
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: c.textMuted,
      textAlign: 'center',
      paddingHorizontal: spacing.md,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    spacePickerLink: {
      marginTop: spacing.sm,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    spacePickerText: {
      fontSize: 12,
      fontWeight: '700',
      color: c.ink,
      textAlign: 'center',
      textDecorationLine: 'underline',
    },
    body: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    bodyCompact: {
      paddingTop: spacing.md,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: c.text,
      letterSpacing: -0.4,
      textAlign: 'center',
      marginBottom: spacing.xs,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    titleCompact: {
      fontSize: 20,
    },
    sub: {
      fontSize: 14,
      lineHeight: 21,
      color: c.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
      paddingHorizontal: spacing.xs,
    },
    primaryBtn: {
      backgroundColor: c.ink,
      borderRadius: radius.pill,
      paddingVertical: spacing.md + 2,
      alignItems: 'center',
      minHeight: 52,
      justifyContent: 'center',
      marginTop: spacing.md,
      ...shadows.fab,
    },
    primaryDisabled: { opacity: 0.65 },
    primaryBtnText: {
      color: c.brandInverse,
      fontWeight: '800',
      fontSize: 16,
      textAlign: 'center',
    },
    forgotBtn: {
      alignSelf: 'flex-end',
      marginTop: spacing.xs,
      marginBottom: spacing.md,
      paddingVertical: spacing.xs,
    },
    forgotText: {
      color: c.textSecondary,
      fontWeight: '700',
      fontSize: 13,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginVertical: spacing.lg,
    },
    dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: c.border },
    dividerText: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    signupTeaser: {
      gap: spacing.sm,
    },
    teaserRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      ...shadows.card,
    },
    teaserNum: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.ink,
      alignItems: 'center',
      justifyContent: 'center',
    },
    teaserNumText: {
      fontSize: 14,
      fontWeight: '800',
      color: c.brandInverse,
    },
    teaserText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      color: c.text,
      fontWeight: '600',
    },
    legal: {
      marginTop: spacing.xl,
      fontSize: 11,
      lineHeight: 17,
      color: c.textMuted,
      textAlign: 'center',
      paddingHorizontal: spacing.sm,
    },
    legalLink: {
      color: c.ink,
      fontWeight: '700',
    },
    linkBtn: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    linkText: {
      color: c.textSecondary,
      fontWeight: '700',
      fontSize: 14,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    configWrap: {
      width: '100%',
      maxWidth: 360,
      marginTop: spacing.lg,
    },
  });
}

export function useAuthStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => createAuthStyles(colors), [colors]);
}
