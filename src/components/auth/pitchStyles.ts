import { StyleSheet } from 'react-native';
import { colors, spacing, radius, shadows } from '../../theme/designTokens';

/** Bandeau noir + feuille blanche — DiscoverStage legacy uniquement. */
export const pitchStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl + spacing.lg,
    backgroundColor: colors.ink,
  },
  sheet: {
    marginTop: -spacing.xxl,
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    overflow: 'hidden',
    ...shadows.interactive,
  },
  sheetAccent: {
    height: 4,
    backgroundColor: colors.ink,
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.md,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  sheetSub: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
});
