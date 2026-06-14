import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring, StaggerReveal } from '../motion';
import { Icon, type IconName } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

export interface HomeQuickItem {
  id: string;
  label: string;
  icon: IconName;
  onPress: () => void;
}

interface HomeQuickStripProps {
  items: HomeQuickItem[];
}

/** Raccourcis horizontaux — accueil invité et dashboard. */
export const HomeQuickStrip: React.FC<HomeQuickStripProps> = ({ items }) => {
  const { colors } = useAppTheme();

  if (items.length === 0) return null;

  return (
    <View style={styles.row}>
      {items.map((item, index) => (
        <StaggerReveal key={item.id} index={index} delayStep={40}>
        <PressableSpring
          style={[
            styles.chip,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={item.onPress}
          scaleTo={0.96}
          haptic
        >
          <Icon name={item.icon} size={18} color={colors.ink} />
          <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
            {item.label}
          </Text>
        </PressableSpring>
        </StaggerReveal>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  label: { fontSize: 13, fontWeight: '700' },
});
