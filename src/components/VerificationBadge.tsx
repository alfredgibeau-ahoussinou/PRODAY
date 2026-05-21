import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { User } from '../models/User';
import { getVerificationBadge } from '../models/User';
import { colors, spacing, radius } from '../theme/designTokens';

const BADGE_COLORS = {
  green: colors.success,
  orange: colors.warning,
  red: colors.error,
  gray: colors.textMuted,
} as const;

interface VerificationBadgeProps {
  user: User;
  size?: 'sm' | 'md';
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  user,
  size = 'md',
}) => {
  const badge = getVerificationBadge(user);
  const color = BADGE_COLORS[badge.color];

  if (badge.color === 'gray' && user.role === 'player') {
    return null;
  }

  return (
    <View style={[styles.wrap, size === 'sm' && styles.wrapSm, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, size === 'sm' && styles.labelSm, { color }]}>
        {badge.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: colors.surface,
    gap: 6,
  },
  wrapSm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelSm: {
    fontSize: 10,
  },
});
