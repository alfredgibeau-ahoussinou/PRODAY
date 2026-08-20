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

export const FilterChips: React.FC<Props> = ({ chips, selectedId, onSelect }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.row}
  >
    {chips.map((chip) => {
      const active = chip.id === selectedId;
      return (
        <Pressable
          key={chip.id}
          onPress={() => onSelect(chip.id)}
          style={[styles.chip, active && styles.chipActive]}
        >
          <ProDayText variant="caption" style={[styles.label, active && styles.labelActive]}>
            {chip.label}
          </ProDayText>
        </Pressable>
      );
    })}
  </ScrollView>
);

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4, paddingRight: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: SUPPORTER_SPACE.band,
  },
  chipActive: {
    backgroundColor: SUPPORTER_SPACE.accent,
  },
  label: { color: SUPPORTER_SPACE.muted, fontWeight: '600' },
  labelActive: { color: SUPPORTER_SPACE.onBlue },
});
