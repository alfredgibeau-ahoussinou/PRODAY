import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { motion } from '../../theme/motion';

interface LivePulseDotProps {
  active?: boolean;
  size?: number;
  color?: string;
  inactiveColor?: string;
}

/** Point pulsant pour indicateurs « en direct ». */
export const LivePulseDot: React.FC<LivePulseDotProps> = ({
  active = false,
  size = 8,
  color = '#FF4D4D',
  inactiveColor = 'rgba(255,255,255,0.35)',
}) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (active) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(0.45, { duration: 700, easing: motion.easing.inOut }),
          withTiming(1, { duration: 700, easing: motion.easing.inOut })
        ),
        -1,
        false
      );
    } else {
      pulse.value = 1;
    }
  }, [active, pulse]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: active ? pulse.value : 0.35,
    transform: [{ scale: active ? 0.92 + pulse.value * 0.12 : 1 }],
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: active ? color : inactiveColor,
        },
        dotStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  dot: {},
});
