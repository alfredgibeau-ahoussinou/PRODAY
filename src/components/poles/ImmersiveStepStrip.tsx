import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { radius, spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

type Props = {
  steps: string[];
};

/** Bandeau d’étapes (bourse / parcours) — rythme site. */
export function ImmersiveStepStrip({ steps }: Props) {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.row}>
      {steps.map((step, i) => (
        <View
          key={`${i}_${step}`}
          style={[styles.chip, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}
        >
          <ProDayText variant="caption" muted>
            {i + 1}. {step}
          </ProDayText>
        </View>
      ))}
    </View>
  );
}

function createStyles(_c: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    chip: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
  });
}
