import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { ProDaySymbol } from '../branding/ProDaySymbol';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing } from '../../theme/designTokens';

interface SponsorScreenHeaderProps {
  title: string;
  subtitle?: string;
  label?: string;
}

/** En-tête d’écran Sponsor — minimal, accent violet. */
export const SponsorScreenHeader: React.FC<SponsorScreenHeaderProps> = ({
  label = 'ProDay Sponsor',
  title,
  subtitle,
}) => (
  <View style={styles.wrap}>
    <View style={styles.row}>
      <ProDaySymbol size={28} variant="sponsor" tone="white" />
      <Text style={styles.badgeText}>{label}</Text>
    </View>
    <Text
      style={styles.title}
      numberOfLines={2}
      adjustsFontSizeToFit
      minimumFontScale={0.75}
    >
      {title}
    </Text>
    {subtitle ? (
      <Text style={styles.sub} numberOfLines={3}>
        {subtitle}
      </Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SPONSOR_THEME.borderSubtle,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: SPONSOR_THEME.primary,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  title: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    color: SPONSOR_THEME.text,
    letterSpacing: -0.4,
  },
  sub: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: SPONSOR_THEME.textMuted,
  },
});
