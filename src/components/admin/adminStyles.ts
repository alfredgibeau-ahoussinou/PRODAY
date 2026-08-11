import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { ADMIN_NAV_INSET } from '../../navigation/adminTabConfig';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { ADMIN_COLORS, adminChrome } from '../../theme/adminTheme';
import type { AppColors } from '../../theme/universeTheme';

export { adminChrome, ADMIN_COLORS };

export function createAdminStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    rootAlt: { flex: 1, backgroundColor: c.backgroundAlt },
    header: {
      backgroundColor: c.surface,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
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
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      ...shadows.card,
    },
    cardMuted: {
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
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
      borderRadius: radius.md,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    btnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
    btnGhost: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    btnGhostText: { color: c.text, fontWeight: '700', fontSize: 14 },
    input: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
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
      borderWidth: 1,
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

export function useAdminStyles() {
  return useMemo(
    () => ({ styles: createAdminStyles(ADMIN_COLORS), colors: ADMIN_COLORS }),
    [],
  );
}
