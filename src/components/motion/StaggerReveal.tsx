import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { motion } from '../../theme/motion';

interface StaggerRevealProps {
  children: React.ReactNode;
  index?: number;
  delayStep?: number;
  style?: StyleProp<ViewStyle>;
}

/** Entrée échelonnée pour listes / sections. */
export const StaggerReveal: React.FC<StaggerRevealProps> = ({
  children,
  index = 0,
  delayStep = 55,
  style,
}) => (
  <Animated.View
    style={style}
    entering={FadeInUp.delay(index * delayStep)
      .springify()
      .damping(15)
      .stiffness(150)
      .duration(motion.duration.normal)}
  >
    {children}
  </Animated.View>
);
