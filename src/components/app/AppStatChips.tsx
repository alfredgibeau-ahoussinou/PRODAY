import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StaggerReveal } from '../motion/StaggerReveal';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

export type AppStatChip = {
  value: string | number;
  label: string;
  highlight?: boolean;
};

interface AppStatChipsProps {
  items: AppStatChip[];
}

/** Stats compacts sous l’en-tête — entrée échelonnée. */
export const AppStatChips: React.FC<AppStatChipsProps> = ({ items }) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.row}>
      {items.map((item, index) => (
        <StaggerReveal key={item.label} index={index} delayStep={65} style={styles.chipCell}>
          <View
            style={[
              styles.chip,
              {
                backgroundColor: item.highlight ? colors.accentSoft : colors.surfaceMuted,
                borderColor: item.highlight ? colors.accentMuted : colors.border,
              },
            ]}
          >
            <ProDayText variant="section" accent={item.highlight}>
              {item.value}
            </ProDayText>
            <ProDayText variant="caption" muted style={styles.label}>
              {item.label}
            </ProDayText>
          </View>
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
  },
  chipCell: {
    flex: 1,
    minWidth: 88,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
