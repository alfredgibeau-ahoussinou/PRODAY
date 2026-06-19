import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { motion } from '../../theme/motion';

interface StaggerRevealProps {
  children: React.ReactNode;
  index?: number;
  delayStep?: number;
  style?: StyleProp<ViewStyle>;
}

/** Entrée échelonnée — fondu simple, sans glissement. */
export const StaggerReveal: React.FC<StaggerRevealProps> = ({
  children,
  index = 0,
  delayStep = 40,
  style,
}) => (
  <Animated.View
    style={style}
    entering={FadeIn.delay(index * delayStep)
      .duration(motion.duration.fast)
      .easing(motion.easing.out)}
  >
    {children}
  </Animated.View>
);
