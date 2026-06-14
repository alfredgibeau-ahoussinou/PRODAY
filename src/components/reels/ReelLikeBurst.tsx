import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Icon } from '../ui/Icon';
import { motion } from '../../theme/motion';

interface ReelLikeBurstProps {
  visible: boolean;
  onDone: () => void;
}

/** Cœur central — double-tap like (style TikTok). */
export const ReelLikeBurst: React.FC<ReelLikeBurstProps> = ({ visible, onDone }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    opacity.value = 1;
    scale.value = withSequence(
      withSpring(1.15, motion.spring.bouncy),
      withSpring(1, motion.spring.snappy),
      withTiming(0, { duration: 220 }, (finished) => {
        if (finished) runOnJS(onDone)();
      })
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 80 }),
      withTiming(0, { duration: 400 })
    );
  }, [visible, scale, opacity, onDone]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.burst, style]} pointerEvents="none">
      <Icon name="heart" size={88} color="#FF3B5C" variant="filled" />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  burst: {
    position: 'absolute',
    top: '38%',
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
