import { useMemo } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';

/** Connexion / inscription — layout app native, hero gauche, carte élevée. */
export function createAuthStyles(c: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
    ambient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 280,
    },
    scroll: {
      flexGrow: 1,
    },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    toolbarEnd: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flexShrink: 1,
      justifyContent: 'flex-end',
    },
    backBtn: {
      width: 42,
      height: 42,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.soft,
    },
    universeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      ...shadows.soft,
    },
    universeChipText: {
      fontSize: 12,
      fontWeight: '800',
      color: c.text,
    },
    brandRow: {
      alignItems: 'center',
      marginBottom: spacing.xl,
      paddingHorizontal: spacing.lg,
      overflow: 'visible',
    },
    hero: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      alignItems: 'flex-start',
    },
    eyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 2.2,
      textTransform: 'uppercase',
      color: c.accent,
      marginBottom: spacing.xs,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    title: {
      fontSize: 28,
      fontWeight: '900',
      color: c.text,
      letterSpacing: -0.8,
      textAlign: 'left',
      marginBottom: spacing.xs,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    titleCompact: {
      fontSize: 24,
    },
    sub: {
      fontSize: 15,
      lineHeight: 22,
      color: c.textSecondary,
      textAlign: 'left',
      maxWidth: 340,
      fontWeight: '500',
    },
    body: {
      paddingHorizontal: spacing.lg,
    },
    bodyCompact: {
      paddingTop: 0,
    },
    optionsPanel: {
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
    },
    forgotRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    forgotText: {
      color: c.accent,
      fontWeight: '800',
      fontSize: 13,
      textDecorationLine: 'underline',
      textDecorationColor: c.accent,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginVertical: spacing.md,
    },
    dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: c.border },
    dividerText: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    signupTeaser: {
      gap: spacing.sm,
    },
    teaserRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      ...shadows.soft,
    },
    teaserNum: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.accentMuted,
    },
    teaserNumText: {
      fontSize: 14,
      fontWeight: '900',
      color: c.accent,
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
      paddingHorizontal: spacing.md,
    },
    legalLink: {
      color: c.accent,
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
    // legacy aliases used by signup layout
    header: { paddingHorizontal: spacing.lg },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    headerLogo: { flex: 1, alignItems: 'center' },
    headerSpacer: { width: 42 },
    tagline: { display: 'none' },
    formCard: {},
    formCardInner: {},
    primaryBtn: {
      backgroundColor: c.accent,
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
      color: '#000000',
      fontWeight: '800',
      fontSize: 16,
      textAlign: 'center',
    },
    forgotBtn: {},
  });
}

export function useAuthStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => createAuthStyles(colors), [colors]);
}
