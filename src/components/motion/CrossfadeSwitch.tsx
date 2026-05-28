import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { motion } from '../../theme/motion';

interface CrossfadeSwitchProps {
  /** Clé qui déclenche la transition (ex. user id ou mode guest/logged) */
  switchKey: string;
  children: React.ReactNode;
}

/** Fondu entre deux états (ex. Discover → Dashboard après connexion). */
export const CrossfadeSwitch: React.FC<CrossfadeSwitchProps> = ({ switchKey, children }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: motion.duration.slow });
  }, [switchKey, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View key={switchKey} style={[styles.fill, style]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
