import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { JOUEUR_SURFACES, JOUEUR_RADIUS } from '../../theme/joueurDesignSystem';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { spacing } from '../../theme/designTokens';

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
  empty?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Stat joueur — empty state honnête si pas de donnée. */
export function PlayerStatCard({
  label,
  value,
  hint,
  accent = PLAYER_DARK.accent,
  empty = false,
  onPress,
  style,
}: Props) {
  const body = (
    <View style={[styles.card, style]}>
      <ProDayText variant="caption" style={styles.label}>
        {label}
      </ProDayText>
      <ProDayText variant="title" style={[styles.value, empty && styles.empty]}>
        {empty ? '—' : value}
      </ProDayText>
      {hint ? (
        <ProDayText variant="caption" style={styles.hint}>
          {hint}
        </ProDayText>
      ) : null}
      {!empty ? <View style={[styles.glow, { backgroundColor: `${accent}22` }]} /> : null}
    </View>
  );

  if (!onPress) return body;
  return (
    <PressableSpring onPress={onPress} scaleTo={0.98} haptic>
      {body}
    </PressableSpring>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: JOUEUR_RADIUS.md,
    backgroundColor: JOUEUR_SURFACES.card,
    borderWidth: 1,
    borderColor: JOUEUR_SURFACES.cardBorder,
    overflow: 'hidden',
    minHeight: 88,
    justifyContent: 'center',
  },
  label: { color: PLAYER_DARK.textMuted, marginBottom: 4 },
  value: { color: PLAYER_DARK.text, fontSize: 28 },
  empty: { color: PLAYER_DARK.textDim, fontSize: 22 },
  hint: { color: PLAYER_DARK.textMuted, marginTop: 4 },
  glow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
});
