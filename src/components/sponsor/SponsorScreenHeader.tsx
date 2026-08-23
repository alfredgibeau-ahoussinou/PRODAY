import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../ui/Icon';
import { ProDaySymbol } from '../branding/ProDaySymbol';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, radius } from '../../theme/designTokens';

interface SponsorScreenHeaderProps {
  title: string;
  subtitle?: string;
  label?: string;
}

export const SponsorScreenHeader: React.FC<SponsorScreenHeaderProps> = ({
  label = 'Pro Day Sponsor',
  title,
  subtitle,
}) => (
  <View style={styles.wrap}>
    <View style={styles.accentBar} />
    <View style={styles.body}>
      <View style={styles.badge}>
        <View style={styles.badgeLogo}>
          <ProDaySymbol size={24} variant="sponsor" tone="black" />
        </View>
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
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: SPONSOR_THEME.surface,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
  },
  accentBar: {
    width: 4,
    backgroundColor: SPONSOR_THEME.primary,
  },
  body: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    padding: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  badgeLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    padding: 2,
    overflow: 'hidden',
    flexShrink: 0,
  },
  badgeLogoImage: { width: '100%', height: '100%' },
  badgeText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: SPONSOR_THEME.primary,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    color: SPONSOR_THEME.text,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  sub: {
    marginTop: spacing.xs,
    fontSize: 13,
    lineHeight: 18,
    color: SPONSOR_THEME.textSecondary,
  },
});
