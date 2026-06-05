import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { User } from '../models/User';
import { getVerificationBadge } from '../models/User';
import { useAppTheme } from '../context/ProductLineContext';
import { spacing, radius } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';

interface VerificationBadgeProps {
  user: User;
  size?: 'sm' | 'md';
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  user,
  size = 'md',
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const badge = getVerificationBadge(user);
  const badgeColors = {
    green: c.success,
    orange: c.warning,
    red: c.error,
    gray: c.textMuted,
  } as const;
  const color = badgeColors[badge.color];

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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      backgroundColor: c.surface,
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
}
