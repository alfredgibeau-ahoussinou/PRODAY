import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SPONSOR_NAV_INSET } from '../../navigation/sponsorTabConfig';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { SPONSOR_SHELL_COLORS, sponsorChrome } from '../../theme/sponsorShellTheme';
import type { AppColors } from '../../theme/universeTheme';

export { sponsorChrome, SPONSOR_SHELL_COLORS };

export function createSponsorStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    rootAlt: { flex: 1, backgroundColor: c.backgroundAlt },
    header: {
      backgroundColor: sponsorChrome.shell,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: sponsorChrome.shellBorder,
    },
    pageEyebrow: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: sponsorChrome.gold,
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
      paddingBottom: SPONSOR_NAV_INSET + spacing.xl,
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
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: c.textMuted,
      marginBottom: spacing.sm,
    },
    centeredContainer: {
      width: '100%',
      maxWidth: 1180,
      alignSelf: 'center',
    },
  });
}

export function useSponsorStyles() {
  const colors = SPONSOR_SHELL_COLORS;
  const styles = useMemo(() => createSponsorStyles(colors), []);
  return { styles, colors };
}
