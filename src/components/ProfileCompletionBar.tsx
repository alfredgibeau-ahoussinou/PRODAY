import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { User } from '../models/User';
import { getProfileCompletion } from '../utils/profileCompletion';
import { useAppTheme } from '../context/ProductLineContext';
import { spacing, radius } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';

interface ProfileCompletionBarProps {
  user: User;
  compact?: boolean;
}

export const ProfileCompletionBar: React.FC<ProfileCompletionBarProps> = ({
  user,
  compact,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const { percent, missingLabels } = getProfileCompletion(user);

  if (percent >= 100) return null;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.row}>
        <Text style={styles.label}>Profil complété</Text>
        <Text style={styles.pct}>{percent}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      {!compact && missingLabels.length > 0 ? (
        <Text style={styles.hint} numberOfLines={2}>
          À ajouter : {missingLabels.slice(0, 3).join(' · ')}
          {missingLabels.length > 3 ? '…' : ''}
        </Text>
      ) : null}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.md,
    },
    wrapCompact: { padding: spacing.sm, marginBottom: spacing.sm },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    label: { fontSize: 12, fontWeight: '800', color: c.textSecondary },
    pct: { fontSize: 14, fontWeight: '900', color: c.brand },
    track: {
      height: 6,
      borderRadius: 3,
      backgroundColor: c.surfaceMuted,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: c.brand,
      borderRadius: 3,
    },
    hint: {
      marginTop: spacing.xs,
      fontSize: 11,
      color: c.textMuted,
      lineHeight: 16,
    },
  });
}
