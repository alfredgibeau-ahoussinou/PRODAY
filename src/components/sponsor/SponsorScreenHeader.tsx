import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../ui/Icon';
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
        <Icon name="briefcase" size={14} color={SPONSOR_THEME.primary} variant="filled" />
        <Text style={styles.badgeText}>{label}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    backgroundColor: SPONSOR_THEME.primary,
  },
  body: {
    flex: 1,
    padding: spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: SPONSOR_THEME.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: SPONSOR_THEME.heroSubtext,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: SPONSOR_THEME.text,
  },
  sub: {
    fontSize: 14,
    color: SPONSOR_THEME.textSecondary,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
});
