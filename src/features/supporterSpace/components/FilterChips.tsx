import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { SUPPORTER_SPACE } from '../theme/supporterSpaceTheme';

export type FilterChip = { id: string; label: string };

type Props = {
  chips: FilterChip[];
  selectedId: string;
  onSelect: (id: string) => void;
};

/** Compact Live Score chips (~36–40px), never stretch in nested ScrollViews. */
export const FilterChips: React.FC<Props> = ({ chips, selectedId, onSelect }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={styles.scroll}
    contentContainerStyle={styles.row}
  >
    {chips.map((chip) => {
      const active = chip.id === selectedId;
      return (
        <Pressable
          key={chip.id}
          onPress={() => onSelect(chip.id)}
          style={[styles.chip, active && styles.chipActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
        >
          <ProDayText
            variant="caption"
            numberOfLines={1}
            style={[styles.label, active && styles.labelActive]}
          >
            {chip.label}
          </ProDayText>
        </Pressable>
      );
    })}
  </ScrollView>
);

const CHIP_HEIGHT = 36;

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: {
    gap: 8,
    paddingVertical: 2,
    paddingRight: 8,
    alignItems: 'center',
  },
  chip: {
    height: CHIP_HEIGHT,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: SUPPORTER_SPACE.band,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  chipActive: {
    backgroundColor: SUPPORTER_SPACE.accent,
  },
  label: {
    color: SUPPORTER_SPACE.muted,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 16,
  },
  labelActive: { color: SUPPORTER_SPACE.onBlue },
});
