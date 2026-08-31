import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { motion } from '../../theme/motion';
import { sanitizeHostChildren } from '../../motion/sanitizeHostChildren';

interface AnimatedTabLabelProps {
  active: boolean;
  children: React.ReactNode;
}

/** Label d’onglet — scale + opacité au changement d’état. */
export const AnimatedTabLabel: React.FC<AnimatedTabLabelProps> = ({ active, children }) => {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(active ? 1 : 0, motion.spring.snappy);
  }, [active, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.5 + progress.value * 0.5,
    transform: [{ scale: 0.94 + progress.value * 0.06 }],
  }));

  return (
    <Animated.View style={[styles.wrap, style]}>
      {sanitizeHostChildren(children)}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
