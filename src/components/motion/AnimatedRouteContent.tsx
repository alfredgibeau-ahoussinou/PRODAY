import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';
import { motion } from '../../theme/motion';

interface AnimatedRouteContentProps {
  /** Clé de route active (ex. onglet ou segment). */
  routeKey: string;
  /** Ordre des routes pour la direction du slide. */
  routeOrder: string[];
  children: React.ReactNode;
}

/**
 * Transition directionnelle entre routes (slide + spring), générique hors MainTabs.
 */
export const AnimatedRouteContent: React.FC<AnimatedRouteContentProps> = ({
  routeKey,
  routeOrder,
  children,
}) => {
  const prevIndex = useRef(routeOrder.indexOf(routeKey));
  const currentIndex = routeOrder.indexOf(routeKey);
  const direction = currentIndex >= prevIndex.current ? 1 : -1;

  useEffect(() => {
    prevIndex.current = currentIndex >= 0 ? currentIndex : prevIndex.current;
  }, [currentIndex]);

  const entering =
    direction > 0
      ? SlideInRight.springify()
          .damping(18)
          .stiffness(165)
          .mass(0.85)
          .duration(motion.duration.normal)
      : SlideInLeft.springify()
          .damping(18)
          .stiffness(165)
          .mass(0.85)
          .duration(motion.duration.normal);

  const exiting =
    direction > 0
      ? SlideOutLeft.duration(motion.duration.fast).easing(motion.easing.in)
      : SlideOutRight.duration(motion.duration.fast).easing(motion.easing.in);

  return (
    <Animated.View key={routeKey} style={styles.fill} entering={entering} exiting={exiting}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
