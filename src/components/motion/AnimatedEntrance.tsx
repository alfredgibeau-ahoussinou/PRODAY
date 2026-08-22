import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { motion } from '../../theme/motion';
import { sanitizeHostChildren } from '../../motion/sanitizeHostChildren';

export type EntranceKind = 'fadeUp' | 'fadeDown' | 'fade' | 'zoom';

interface AnimatedEntranceProps {
  children: React.ReactNode;
  kind?: EntranceKind;
  index?: number;
  delayStep?: number;
  style?: StyleProp<ViewStyle>;
}

function buildEntering(kind: EntranceKind, delay: number) {
  const duration = motion.duration.normal;
  const easeOut = motion.easing.out;
  const base = {
    fadeUp: FadeInUp.duration(duration).easing(easeOut).withInitialValues({
      transform: [{ translateY: 12 }],
    }),
    fadeDown: FadeInDown.duration(duration).easing(easeOut).withInitialValues({
      transform: [{ translateY: -10 }],
    }),
    fade: FadeIn.duration(duration).easing(easeOut),
    zoom: FadeIn.duration(duration).easing(easeOut),
  }[kind];

  return delay > 0 ? base.delay(delay) : base;
}

/** Entrée animée — discrète, sans rebond. */
export const AnimatedEntrance: React.FC<AnimatedEntranceProps> = ({
  children,
  kind = 'fade',
  index = 0,
  delayStep = 36,
  style,
}) => (
  <Animated.View style={style} entering={buildEntering(kind, index * delayStep)}>
    {sanitizeHostChildren(children)}
  </Animated.View>
);
