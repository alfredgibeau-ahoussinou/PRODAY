import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { ADMIN_TAB_BAR_INSET } from '../../navigation/adminTabConfig';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';

export function createAdminStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.backgroundAlt },
    rootAlt: { flex: 1, backgroundColor: c.background },
    header: {
      backgroundColor: c.surfaceInverse,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      borderBottomWidth: 3,
      borderBottomColor: c.brand,
    },
    headerBrand: {
      color: c.brand,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 2,
      marginBottom: spacing.sm,
    },
    headerTitle: { color: c.brandInverse, fontSize: 22, fontWeight: '900' },
    title: { fontSize: 20, fontWeight: '900', color: c.text },
    subtitle: { fontSize: 13, color: c.textSecondary, marginTop: 4 },
    content: {
      padding: spacing.lg,
      paddingBottom: ADMIN_TAB_BAR_INSET + spacing.xl,
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
      fontWeight: '800',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: c.textMuted,
      marginBottom: spacing.sm,
    },
    btn: {
      backgroundColor: c.ink,
      borderRadius: radius.md,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    btnText: { color: c.brandInverse, fontWeight: '900', fontSize: 14 },
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
      backgroundColor: c.ink,
      borderColor: c.ink,
    },
    chipText: { fontSize: 12, fontWeight: '700', color: c.text },
    chipTextActive: { color: c.brandInverse },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: c.text, textAlign: 'center' },
    emptySub: { fontSize: 13, color: c.textSecondary, textAlign: 'center', lineHeight: 20 },
    statValue: { fontSize: 24, fontWeight: '900', color: c.text },
    statLabel: { fontSize: 11, fontWeight: '700', color: c.textMuted, marginTop: 2 },
  });
}

export function useAdminStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => ({ styles: createAdminStyles(colors), colors }), [colors]);
}
