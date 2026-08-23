import { useMemo } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import { AUTH_SHEET } from './authSheetPalette';

/** Connexion / inscription — hero noir + feuille claire (maquette v2). */
export function createAuthStyles(c: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: AUTH_SHEET.heroBackground,
    },
    scroll: {
      flexGrow: 1,
    },
    heroBand: {
      backgroundColor: AUTH_SHEET.heroBackground,
      paddingBottom: spacing.xl + spacing.sm,
    },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
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
      backgroundColor: AUTH_SHEET.toolbarBtn,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: AUTH_SHEET.toolbarBtnBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backBtnLight: {
      width: 42,
      height: 42,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: AUTH_SHEET.border,
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
      backgroundColor: AUTH_SHEET.toolbarBtn,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: AUTH_SHEET.toolbarBtnBorder,
    },
    universeChipText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    brandRow: {
      alignItems: 'center',
      marginBottom: spacing.md,
      paddingHorizontal: spacing.lg,
      overflow: 'visible',
    },
    hero: {
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
    },
    eyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 2.2,
      textTransform: 'uppercase',
      color: AUTH_SHEET.heroMuted,
      marginBottom: spacing.xs,
      textAlign: 'center',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    title: {
      fontSize: 28,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.8,
      textAlign: 'center',
      marginBottom: spacing.xs,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    titleCompact: {
      fontSize: 24,
    },
    sub: {
      fontSize: 15,
      lineHeight: 22,
      color: AUTH_SHEET.heroMuted,
      textAlign: 'center',
      maxWidth: 320,
      fontWeight: '500',
    },
    sheet: {
      flex: 1,
      marginTop: -spacing.lg,
      backgroundColor: AUTH_SHEET.background,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
      minHeight: 420,
      ...shadows.interactive,
    },
    body: {
      paddingTop: spacing.xs,
    },
    bodyCompact: {
      paddingTop: 0,
    },
    optionsPanel: {
      backgroundColor: AUTH_SHEET.backgroundMuted,
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
    dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: AUTH_SHEET.border },
    dividerText: {
      fontSize: 11,
      fontWeight: '700',
      color: AUTH_SHEET.textMuted,
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
      backgroundColor: AUTH_SHEET.backgroundMuted,
      borderRadius: radius.xl,
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: AUTH_SHEET.border,
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
      color: AUTH_SHEET.text,
      fontWeight: '600',
    },
    legal: {
      marginTop: spacing.xl,
      fontSize: 11,
      lineHeight: 17,
      color: AUTH_SHEET.textMuted,
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
      color: AUTH_SHEET.textSecondary,
      fontWeight: '700',
      fontSize: 14,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      backgroundColor: AUTH_SHEET.heroBackground,
    },
    configWrap: {
      width: '100%',
      maxWidth: 360,
      marginTop: spacing.lg,
    },
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
