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
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: SUPPORTER_SPACE.surface,
    borderWidth: 1,
    borderColor: SUPPORTER_SPACE.border,
  },
  chipActive: {
    backgroundColor: SUPPORTER_SPACE.soft,
    borderColor: SUPPORTER_SPACE.accent,
  },
  label: { color: SUPPORTER_SPACE.muted },
  labelActive: { color: SUPPORTER_SPACE.foreground },
});
