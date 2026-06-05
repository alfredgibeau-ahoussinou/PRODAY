import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import type { AppColors } from '../../theme/universeTheme';

export function createMedicalStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: c.textMuted,
      marginBottom: spacing.sm,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadows.soft,
    },
    cardMuted: {
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
    },
    title: { fontSize: 16, fontWeight: '900', color: c.text },
    sub: { fontSize: 13, color: c.textSecondary, lineHeight: 19, marginTop: 4 },
    pill: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: c.brandSoft,
    },
    pillText: { fontSize: 10, fontWeight: '800', color: c.brand },
    btn: {
      backgroundColor: c.ink,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    btnText: { color: c.brandInverse, fontWeight: '800', fontSize: 14 },
    empty: {
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
    },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: c.text },
    emptySub: { fontSize: 13, color: c.textMuted, textAlign: 'center', lineHeight: 19 },
  });
}

export function useMedicalStyles() {
  const { colors, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createMedicalStyles(colors), [colors]);
  return { styles, colors, rootStyle };
}
