import React, { useEffect, useState } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { motion } from '../../theme/motion';
import { useAppTheme } from '../../context/ProductLineContext';

const { width: W } = Dimensions.get('window');

interface PushScreenTransitionProps {
  active: boolean;
  children: React.ReactNode;
  /** Fond plein écran (ex. #000 coach) — défaut thème produit. */
  backgroundColor?: string;
}

/**
 * Navigation type “stack” : l’écran enfant glisse depuis la droite.
 */
export const PushScreenTransition: React.FC<PushScreenTransitionProps> = ({
  active,
  children,
  backgroundColor,
}) => {
  const { colors } = useAppTheme();
  const [mounted, setMounted] = useState(active);
  const x = useSharedValue(active ? 0 : W);

  useEffect(() => {
    if (active) {
      setMounted(true);
      x.value = withSpring(0, motion.spring.smooth);
    } else if (mounted) {
      x.value = withSpring(W, motion.spring.snappy, (finished) => {
        if (finished) {
          runOnJS(setMounted)(false);
        }
      });
    }
  }, [active, mounted, x]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  if (!mounted) return null;

  return (
    <Animated.View
      style={[styles.overlay, { backgroundColor: backgroundColor ?? colors.background }, style]}
      pointerEvents={active ? 'auto' : 'none'}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
});
