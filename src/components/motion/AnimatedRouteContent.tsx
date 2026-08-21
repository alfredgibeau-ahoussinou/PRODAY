import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';
import { getMotionPreset, useReducedMotion } from '../../motion';

interface AnimatedRouteContentProps {
  /** Clé de route active (ex. onglet ou segment). */
  routeKey: string;
  /** Ordre des routes pour la direction du slide. */
  routeOrder: string[];
  children: React.ReactNode;
}

/**
 * Transition directionnelle entre routes (preset `nav`).
 */
export const AnimatedRouteContent: React.FC<AnimatedRouteContentProps> = ({
  routeKey,
  routeOrder,
  children,
}) => {
  const reduced = useReducedMotion();
  const preset = getMotionPreset('nav');
  const hasMounted = useRef(false);
  const prevIndex = useRef(routeOrder.indexOf(routeKey));
  const currentIndex = routeOrder.indexOf(routeKey);
  const direction = currentIndex >= prevIndex.current ? 1 : -1;

  useEffect(() => {
    prevIndex.current = currentIndex >= 0 ? currentIndex : prevIndex.current;
    hasMounted.current = true;
  }, [currentIndex]);

  if (reduced) {
    return (
      <View key={routeKey} style={styles.fill}>
        {children}
      </View>
    );
  }

  const entering = hasMounted.current
    ? direction > 0
      ? SlideInRight.springify()
          .damping(preset.spring.damping)
          .stiffness(preset.spring.stiffness)
          .mass(preset.spring.mass)
          .duration(preset.enterMs)
      : SlideInLeft.springify()
          .damping(preset.spring.damping)
          .stiffness(preset.spring.stiffness)
          .mass(preset.spring.mass)
          .duration(preset.enterMs)
    : undefined;

  const exiting =
    direction > 0
      ? SlideOutLeft.duration(preset.exitMs)
      : SlideOutRight.duration(preset.exitMs);

  return (
    <Animated.View
      key={routeKey}
      style={styles.fill}
      entering={entering}
      exiting={hasMounted.current ? exiting : undefined}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
