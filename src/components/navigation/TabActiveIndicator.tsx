import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { motion } from '../../theme/motion';

type TabActiveIndicatorProps = {
  active: boolean;
  color: string;
};

/** Pilule animée derrière l’icône de l’onglet actif. */
export const TabActiveIndicator: React.FC<TabActiveIndicatorProps> = ({
  active,
  color,
}) => {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(active ? 1 : 0, motion.spring.snappy);
  }, [active, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.82 + progress.value * 0.18 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: 44,
          height: 30,
          borderRadius: 15,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
};
