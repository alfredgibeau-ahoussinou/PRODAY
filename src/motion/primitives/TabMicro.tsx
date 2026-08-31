import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { prodayMotion } from '../tokens';

type Props = {
  active: boolean;
  color: string;
  widthPercent?: `${number}%`;
};

/** Micro-indicateur tab (underline) — preset `tab`. */
export function TabUnderline({ active, color, widthPercent = '70%' }: Props) {
  const reduced = useReducedMotion();
  const w = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      w.value = active ? 1 : 0;
      return;
    }
    w.value = withTiming(active ? 1 : 0, {
      duration: prodayMotion.duration.fast,
      easing: prodayMotion.easing.out,
    });
  }, [active, reduced, w]);

  const style = useAnimatedStyle(() => ({
    opacity: w.value,
    transform: [{ scaleX: 0.4 + w.value * 0.6 }],
  }));

  return (
    <Animated.View
      style={[
        { height: 2, borderRadius: 1, backgroundColor: color, width: widthPercent },
        style,
      ]}
    />
  );
}

/** Pill dock indicator — scale opacity. */
export function DockPillIndicator({
  active,
  color,
}: {
  active: boolean;
  color: string;
}) {
  const reduced = useReducedMotion();
  const indicator = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      indicator.value = active ? 1 : 0;
      return;
    }
    indicator.value = withSpring(active ? 1 : 0, prodayMotion.spring.dock);
  }, [active, reduced, indicator]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: indicator.value,
    transform: [
      { scaleX: 0.72 + indicator.value * 0.28 },
      { scaleY: indicator.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        { backgroundColor: color, borderRadius: 12 },
        pillStyle,
      ]}
      pointerEvents="none"
    />
  );
}
