import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography, shadows, surfaces } from './designTokens';

/** Styles partagés — toutes les pages (ProDay v2) */
export const appStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  contentWithTabBar: {
    paddingBottom: 72,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    color: colors.accent,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sizes.section,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  card: {
    ...surfaces.card,
    padding: spacing.lg,
  },
  cardSoft: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.soft,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    ...shadows.interactive,
  },
  primaryBtnText: {
    color: colors.brandInverse,
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    ...shadows.soft,
  },
  secondaryBtnText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  fab: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.fab,
  },
  fabText: {
    color: colors.brandInverse,
    fontWeight: '800',
    fontSize: 15,
  },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  link: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
});
