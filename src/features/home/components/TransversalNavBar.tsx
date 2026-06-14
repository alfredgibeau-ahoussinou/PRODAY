import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { ProDayText } from '../../../components/ui/ProDayText';
import { useAppTheme } from '../../../context/ProductLineContext';
import { spacing, radius } from '../../../theme/designTokens';

type TransversalAction = {
  id: string;
  icon: IconName;
  label: string;
  badge?: number;
  onPress: () => void;
};

interface TransversalNavBarProps {
  actions: TransversalAction[];
}

/** Navigation transversale — notifs, chat, calendrier, recherche (spec §3.2). */
export const TransversalNavBar: React.FC<TransversalNavBarProps> = ({ actions }) => {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {actions.map((action) => (
        <PressableSpring
          key={action.id}
          onPress={action.onPress}
          style={styles.item}
          scaleTo={0.96}
          haptic
        >
          <View style={styles.iconWrap}>
            <Icon name={action.icon} size={20} color={colors.textSecondary} />
            {action.badge != null && action.badge > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                <ProDayText variant="caption" inverse style={styles.badgeText}>
                  {action.badge > 9 ? '9+' : action.badge}
                </ProDayText>
              </View>
            ) : null}
          </View>
          <ProDayText variant="caption" muted style={styles.label}>
            {action.label}
          </ProDayText>
        </PressableSpring>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
  },
  iconWrap: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: { fontSize: 8, fontWeight: '700' },
  label: { fontSize: 10, fontWeight: '600' },
});
