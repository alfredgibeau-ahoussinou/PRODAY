import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { ProDayText } from '../../../components/ui/ProDayText';
import { PressableSpring } from '../../../components/motion';
import { useAppTheme } from '../../../context/ProductLineContext';
import { spacing } from '../../../theme/designTokens';
import type { StaffPriorityItem } from '../engines/staffHome.engine';

interface StaffPrioritiesStripProps {
  items: StaffPriorityItem[];
  onPress?: (item: StaffPriorityItem) => void;
}

export const StaffPrioritiesStrip: React.FC<StaffPrioritiesStripProps> = ({ items, onPress }) => {
  const { colors } = useAppTheme();

  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <GlassCard variant="default" style={styles.card}>
        <ProDayText variant="eyebrow" muted style={styles.eyebrow}>
          Priorités staff
        </ProDayText>
        <ProDayText variant="section">À traiter</ProDayText>
        <View style={styles.list}>
          {items.map((item) => (
            <PressableSpring
              key={item.id}
              onPress={() => onPress?.(item)}
              style={[styles.row, { borderColor: colors.border }]}
              scaleTo={0.98}
              haptic
            >
              <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
                <ProDayText variant="caption" accent style={styles.badgeText}>
                  {item.label}
                </ProDayText>
              </View>
              <ProDayText variant="caption" muted style={styles.detail} numberOfLines={2}>
                {item.detail}
              </ProDayText>
            </PressableSpring>
          ))}
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  card: { padding: spacing.lg, gap: spacing.sm },
  eyebrow: { fontSize: 10, letterSpacing: 2 },
  list: { gap: spacing.xs, marginTop: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    minWidth: 72,
    alignItems: 'center',
  },
  badgeText: { fontWeight: '800', fontSize: 9, letterSpacing: 0.5 },
  detail: { flex: 1, fontSize: 12, lineHeight: 17 },
});
