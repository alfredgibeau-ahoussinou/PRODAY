import React from 'react';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { motion } from '../../theme/motion';

interface StaggerRevealProps {
  children: React.ReactNode;
  index?: number;
  delayStep?: number;
}

/** Entrée échelonnée pour listes / sections Discover. */
export const StaggerReveal: React.FC<StaggerRevealProps> = ({
  children,
  index = 0,
  delayStep = 55,
}) => (
  <Animated.View
    entering={FadeInUp.delay(index * delayStep)
      .duration(motion.duration.normal)
      .springify()
      .damping(16)}
  >
    {children}
  </Animated.View>
);
