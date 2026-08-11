import { StyleSheet } from 'react-native';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

/** Styles partagés écrans compétition — alignés sur Tournois / design system. */
export function createCompetitionScreenStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    body: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    form: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.xs,
    },
    label: {
      fontWeight: '700',
      marginTop: spacing.sm,
    },
    input: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 16,
      color: c.text,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    multiline: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    sectionTitle: {
      fontWeight: '800',
      color: c.text,
    },
    titleText: {
      fontWeight: '800',
      color: c.text,
      lineHeight: 22,
    },
    bodyStrong: {
      fontWeight: '700',
      color: c.text,
    },
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    actionPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionPillPrimary: {
      backgroundColor: c.brand,
    },
    actionPillGhost: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    btn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      minHeight: 48,
    },
    btnPrimary: {
      backgroundColor: c.brand,
    },
    btnGhost: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    btnRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    btnFlex: {
      flex: 1,
    },
    modeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    modeChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    submit: {
      marginTop: spacing.lg,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    submitText: {
      fontWeight: '800',
    },
    statusPill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      alignSelf: 'flex-start',
    },
    tableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    cellRank: { width: 28, textAlign: 'center' },
    cellNum: { width: 40, textAlign: 'center' },
    cellTeam: { flex: 1, paddingHorizontal: spacing.sm },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      marginTop: spacing.md,
    },
    scoreInput: {
      width: 72,
      borderWidth: 1,
      borderRadius: radius.md,
      textAlign: 'center',
      fontSize: 28,
      fontWeight: '800',
      paddingVertical: spacing.sm,
      color: c.text,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
  });
}
