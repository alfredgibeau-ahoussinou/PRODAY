import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { PlayerShieldCard } from './PlayerShieldCard';
import type { ProDayCardData } from '../../models/ProDayCard';

type Props = {
  card: ProDayCardData;
  width?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Ouverture légère carte bouclier — scale/fade subtil, pas flip 3D.
 */
export function PlayerCardReveal({ card, width = 240, onPress, style }: Props) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(1, { damping: 18, stiffness: 120 });
  }, [progress]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.96, 1]) }],
    opacity: interpolate(progress.value, [0, 1], [0.65, 1]),
  }));

  const stats =
    card.role === 'player'
      ? {
          matches: card.matches,
          notes: card.formPct > 0 ? card.formPct / 10 : null,
          goals: card.goals,
          assists: card.assists,
          rating: card.overall > 0 ? card.overall / 10 : null,
        }
      : undefined;

  return (
    <View style={[styles.wrap, style]}>
      <Animated.View style={cardStyle}>
        <PlayerShieldCard
          displayName={card.displayName}
          position={card.role === 'player' ? card.primaryPosition : undefined}
          photoUrl={card.photoUrl}
          clubName={card.role === 'player' ? card.clubName : undefined}
          stats={stats}
          width={width}
          onPress={onPress}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
