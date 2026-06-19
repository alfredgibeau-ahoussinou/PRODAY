import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import type { User } from '../../models/User';
import { computePlayerBadges } from '../../services/badges.service';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

interface PlayerBadgesRowProps {
  user: User;
  applicationsCount?: number;
}

export const PlayerBadgesRow: React.FC<PlayerBadgesRowProps> = ({
  user,
  applicationsCount,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const badges = computePlayerBadges(user, { applicationsCount });
  const unlocked = badges.filter((b) => b.unlocked);

  if (unlocked.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <ProDayText variant="caption" muted style={styles.label}>
        Badges ProDay
      </ProDayText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {unlocked.map((badge) => (
          <View key={badge.id} style={[styles.chip, { backgroundColor: c.accentSoft, borderColor: c.brand }]}>
            <Icon name="trophy" size={14} color={c.brand} variant="filled" />
            <ProDayText variant="caption" accent style={styles.chipText}>
              {badge.label}
            </ProDayText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

function createStyles(_c: { brand: string }) {
  return StyleSheet.create({
    wrap: { gap: spacing.xs, marginBottom: spacing.md },
    label: { fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
    row: { gap: spacing.sm, paddingRight: spacing.md },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    chipText: { fontWeight: '800' },
  });
}
