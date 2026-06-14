import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { motion } from '../../theme/motion';

export type EntranceKind = 'fadeUp' | 'fadeDown' | 'fade' | 'zoom';

interface AnimatedEntranceProps {
  children: React.ReactNode;
  kind?: EntranceKind;
  index?: number;
  delayStep?: number;
  style?: StyleProp<ViewStyle>;
}

function buildEntering(kind: EntranceKind, delay: number) {
  const base = {
    fadeUp: FadeInUp.springify().damping(17).stiffness(140),
    fadeDown: FadeInDown.springify().damping(17).stiffness(140),
    fade: FadeIn.springify().damping(20).stiffness(160),
    zoom: ZoomIn.springify().damping(16).stiffness(150),
  }[kind];

  return delay > 0 ? base.delay(delay) : base;
}

/** Entrée animée — headers, sections, tuiles. */
export const AnimatedEntrance: React.FC<AnimatedEntranceProps> = ({
  children,
  kind = 'fadeUp',
  index = 0,
  delayStep = 48,
  style,
}) => (
  <Animated.View
    style={style}
    entering={buildEntering(kind, index * delayStep).duration(motion.duration.normal)}
  >
    {children}
  </Animated.View>
);
