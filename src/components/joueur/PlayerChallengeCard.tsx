import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { PlayerProgressBar } from './PlayerProgressBar';
import { JOUEUR_SURFACES, JOUEUR_RADIUS } from '../../theme/joueurDesignSystem';
import { spacing } from '../../theme/designTokens';

type Props = {
  title: string;
  description?: string;
  progress: number;
  progressMax?: number;
  progressLabel?: string;
  done?: boolean;
  accent?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Défi / objectif joueur — progression basée sur données réelles. */
export function PlayerChallengeCard({
  title,
  description,
  progress,
  progressMax = 100,
  progressLabel,
  done = false,
  accent = '#4C8BFF',
  onPress,
  style,
}: Props) {
  const body = (
    <View style={[styles.card, done && styles.done, style]}>
      <ProDayText variant="section" style={styles.title}>
        {title}
      </ProDayText>
      {description ? (
        <ProDayText variant="caption" style={styles.desc}>
          {description}
        </ProDayText>
      ) : null}
      <PlayerProgressBar
        value={progress}
        max={progressMax}
        label={progressLabel}
        accent={done ? '#22C55E' : accent}
      />
      {done ? (
        <ProDayText variant="caption" style={styles.badge}>
          Terminé
        </ProDayText>
      ) : null}
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
    gap: spacing.sm,
  },
  done: { borderColor: 'rgba(34,197,94,0.35)' },
  title: { color: '#F3F8FF' },
  desc: { color: 'rgba(243,248,255,0.68)' },
  badge: { color: '#22C55E', marginTop: 2 },
});
