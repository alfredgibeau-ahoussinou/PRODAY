import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { ADMIN_NAV_INSET } from '../../navigation/adminNavConfig';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { ADMIN_COLORS, adminChrome, buildAdminColors, type AdminThemePrefs } from '../../theme/adminTheme';
import type { AppColors } from '../../theme/universeTheme';

export { adminChrome, ADMIN_COLORS, buildAdminColors };
export type { AdminThemePrefs };

export function createAdminStyles(c: AppColors, chrome = adminChrome) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.backgroundAlt },
    rootAlt: { flex: 1, backgroundColor: c.backgroundAlt },
    header: {
      backgroundColor: c.surface,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    headerBrand: {
      color: c.brand,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.6,
      marginBottom: spacing.sm,
    },
    headerTitle: { color: c.text, fontSize: 22, fontWeight: '800' },
    pageEyebrow: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: c.textMuted,
      marginBottom: spacing.xs,
    },
    pageTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: c.text,
      letterSpacing: -0.5,
      lineHeight: 32,
    },
    pageSubtitle: {
      fontSize: 14,
      color: c.textSecondary,
      marginTop: spacing.xs,
      lineHeight: 20,
    },
    title: { fontSize: 18, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 13, color: c.textSecondary, marginTop: 4 },
    content: {
      padding: spacing.lg,
      paddingBottom: ADMIN_NAV_INSET + spacing.xl,
      gap: spacing.md,
    },
    loaderBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    card: {
      backgroundColor: c.surface,
      borderRadius: chrome.radiusLg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: spacing.md,
      ...shadows.card,
    },
    cardMuted: {
      backgroundColor: c.surfaceMuted,
      borderRadius: chrome.radiusLg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: spacing.md,
    },
    kpiCard: {
      backgroundColor: c.surface,
      borderRadius: chrome.radiusLg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: spacing.md,
      minHeight: 96,
      gap: spacing.xs,
    },
    table: {
      backgroundColor: c.surface,
      borderRadius: chrome.radius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      overflow: 'hidden',
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      gap: spacing.sm,
    },
    tableRowHover: { backgroundColor: chrome.rowHover },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.pill,
      alignSelf: 'flex-start',
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    filterBar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: c.textMuted,
      marginBottom: spacing.sm,
    },
    btn: {
      backgroundColor: c.accent,
      borderRadius: chrome.radiusSm,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    btnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
    btnGhost: {
      backgroundColor: c.surface,
      borderRadius: chrome.radiusSm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    btnGhostText: { color: c.text, fontWeight: '700', fontSize: 14 },
    input: {
      backgroundColor: c.surface,
      borderRadius: chrome.radiusSm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      color: c.text,
      fontSize: 15,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipActive: {
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    chipText: { fontSize: 12, fontWeight: '700', color: c.textSecondary },
    chipTextActive: { color: '#FFFFFF' },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: c.text, textAlign: 'center' },
    emptySub: { fontSize: 13, color: c.textSecondary, textAlign: 'center', lineHeight: 20 },
    statValue: { fontSize: 24, fontWeight: '800', color: c.text },
    statLabel: { fontSize: 11, fontWeight: '600', color: c.textMuted, marginTop: 2 },
  });
}

export function useAdminStyles(prefs?: AdminThemePrefs) {
  return useMemo(() => {
    const colors = prefs ? buildAdminColors(prefs) : ADMIN_COLORS;
    const chrome = prefs ? buildAdminColors(prefs) && adminChrome : adminChrome;
    return {
      styles: createAdminStyles(colors),
      colors,
      chrome: prefs
        ? {
            ...adminChrome,
            accent: colors.accent,
            radius: prefs.radius ?? adminChrome.radius,
            radiusSm: Math.max(6, (prefs.radius ?? adminChrome.radius) - 4),
            radiusLg: (prefs.radius ?? adminChrome.radius) + 4,
          }
        : adminChrome,
    };
  }, [prefs?.primaryColor, prefs?.secondaryColor, prefs?.pitchAccent, prefs?.radius]);
}
