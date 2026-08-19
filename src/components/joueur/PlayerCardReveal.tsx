import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { ProDayFutCard } from '../cards/ProDayFutCard';
import type { ProDayCardData, ProDayCardActionId } from '../../models/ProDayCard';

type Props = {
  card: ProDayCardData;
  width?: number;
  onPress?: () => void;
  onAction?: (action: ProDayCardActionId) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Ouverture légère carte joueur — parallaxe subtile, pas flip FIFA.
 * Respecte prefers-reduced-motion.
 */
export function PlayerCardReveal({ card, width = 280, onPress, onAction, style }: Props) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(1, { damping: 18, stiffness: 120 });
  }, [progress]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${interpolate(progress.value, [0, 1], [8, 0])}deg` },
      { translateY: interpolate(progress.value, [0, 1], [16, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.96, 1]) },
    ],
    opacity: interpolate(progress.value, [0, 1], [0.6, 1]),
  }));

  return (
    <View style={[styles.wrap, style]}>
      <Animated.View style={cardStyle}>
        <ProDayFutCard card={card} width={width} onSelect={onPress} onAction={onAction} />
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
