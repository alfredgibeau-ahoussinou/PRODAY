import { StyleSheet } from 'react-native';
import { colors, spacing, radius, shadows } from '../../theme/designTokens';

/** Styles partagés — parcours d’inscription ProDay */
export const signupTheme = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardMuted: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  chip: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 52,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  chipTitleActive: {
    color: colors.brandInverse,
  },
  chipHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 17,
  },
  chipHintActive: {
    color: 'rgba(255,255,255,0.72)',
  },
  fieldError: {
    color: colors.error,
    fontSize: 12,
    marginBottom: spacing.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
});
