import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import { resolveSponsorTierStatus } from '../../utils/sponsorPlanLimits';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, radius } from '../../theme/designTokens';

type SponsorTierStatusBannerProps = {
  profile: User;
};

const TONE_COLORS = {
  discovery: SPONSOR_THEME.primary,
  territorial: '#34d399',
  pro: SPONSOR_THEME.primary,
  pending: SPONSOR_THEME.textMuted,
} as const;

export const SponsorTierStatusBanner: React.FC<SponsorTierStatusBannerProps> = ({ profile }) => {
  const status = resolveSponsorTierStatus(profile);

  return (
    <View style={[styles.root, { borderColor: `${TONE_COLORS[status.tone]}55` }]}>
      <View style={[styles.badge, { backgroundColor: `${TONE_COLORS[status.tone]}22` }]}>
        <Text style={[styles.badgeText, { color: TONE_COLORS[status.tone] }]}>
          {status.label}
        </Text>
      </View>
      {status.detail ? <Text style={styles.detail}>{status.detail}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: SPONSOR_THEME.surfaceMuted,
    borderWidth: 1,
    gap: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  detail: {
    color: SPONSOR_THEME.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
