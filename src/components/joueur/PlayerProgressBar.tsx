import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { JOUEUR_SURFACES, JOUEUR_RADIUS } from '../../theme/joueurDesignSystem';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { spacing } from '../../theme/designTokens';

type Props = {
  value: number;
  max?: number;
  label?: string;
  accent?: string;
  style?: StyleProp<ViewStyle>;
};

/** Barre de progression joueur — données réelles uniquement. */
export function PlayerProgressBar({
  value,
  max = 100,
  label,
  accent = PLAYER_DARK.accent,
  style,
}: Props) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <View style={[styles.wrap, style]} accessibilityRole="progressbar">
      {label ? (
        <ProDayText variant="caption" style={styles.label}>
          {label}
        </ProDayText>
      ) : null}
      <View style={styles.track}>
        <LinearGradient
          colors={[`${accent}88`, accent]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.fill, { width: `${pct * 100}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { color: PLAYER_DARK.textMuted },
  track: {
    height: 8,
    borderRadius: JOUEUR_RADIUS.pill,
    backgroundColor: JOUEUR_SURFACES.chip,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: JOUEUR_RADIUS.pill,
  },
});
