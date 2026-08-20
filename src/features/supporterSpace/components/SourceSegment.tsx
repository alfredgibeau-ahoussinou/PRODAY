import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { SUPPORTER_SPACE, SUPPORTER_SPACE_COPY } from '../theme/supporterSpaceTheme';

export type SupporterSourceSide = 'proday' | 'leagues' | 'all';

type Props = {
  value: SupporterSourceSide;
  onChange: (value: SupporterSourceSide) => void;
  /** Hide "Tous" when only dual rails are shown */
  showAll?: boolean;
};

const OPTIONS: Array<{ id: SupporterSourceSide; label: string }> = [
  { id: 'proday', label: SUPPORTER_SPACE_COPY.sourceProday },
  { id: 'leagues', label: SUPPORTER_SPACE_COPY.sourceLeagues },
];

/** Compact source segment — same height language as FilterChips. */
export const SourceSegment: React.FC<Props> = ({ value, onChange, showAll = false }) => {
  const chips = showAll
    ? [{ id: 'all' as const, label: 'Tous' }, ...OPTIONS]
    : OPTIONS;

  return (
    <View style={styles.row}>
      {chips.map((chip) => {
        const active = chip.id === value;
        return (
          <Pressable
            key={chip.id}
            onPress={() => onChange(chip.id)}
            style={[styles.pill, active && styles.pillActive]}
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
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: SUPPORTER_SPACE.band,
    borderRadius: 999,
    padding: 3,
    gap: 3,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  pill: {
    flex: 1,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
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
